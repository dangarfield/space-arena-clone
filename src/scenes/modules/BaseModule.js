// Base class for all ship modules
export default class BaseModule {
  constructor(config, ship, scene) {
    this.config = config; // Original module config from fitting
    this.ship = ship;
    this.scene = scene;
    
    // Position on grid
    this.col = config.col;
    this.row = config.row;
    this.size = config.size;
    
    // Module data - config.module is the processed format with stats
    this.data = config.module;
    this.name = this.data.name;
    this.type = config.type;
    this.color = config.color;
    
    // Category is stored at top level in the processed format
    this.category = this.data.category || 0;
    
    // Health - parse from stats string if available
    this.maxHealth = parseInt(this.data.stats?.Health || this.data.hlt || 100);
    this.health = this.maxHealth;
    this.alive = true;
    
    // Defense stats
    this.armor = parseInt(this.data.stats?.Armor || this.data.a || 0);
    this.reflect = parseFloat(this.data.stats?.Reflect || this.data.r || 0) / 100; // Convert to 0-1
    
    // Visual
    this.sprite = null;
    this.worldPos = { x: 0, y: 0 };
    
    console.log(`Created ${this.constructor.name}: ${this.name}, category: ${this.category}`, this.data);
  }
  
  createSprite(x, y, rotation, cellSize) {
    // Ship grid points up naturally - no transformation needed
    const width = this.size.w * cellSize;
    const height = this.size.h * cellSize;
    
    // Try to load image, fallback to colored rectangle
    if (this.data.image) {
      this.sprite = this.scene.add.image(x, y, 'module-placeholder');
      
      // Load the actual image
      this.scene.load.image(this.name, this.data.image);
      this.scene.load.once('complete', () => {
        if (this.sprite && this.scene.textures.exists(this.name)) {
          this.sprite.setTexture(this.name);
          this.sprite.setDisplaySize(width, height);
          this.sprite.setAlpha(1); // Ensure full opacity after texture load
        }
      });
      this.scene.load.start();
      
      // Set initial size and opacity
      this.sprite.setDisplaySize(width, height);
      this.sprite.setAlpha(1); // Ensure full opacity from start
    } else {
      this.sprite = this.scene.add.rectangle(x, y, width, height, this.color);
    }
    
    this.sprite.setOrigin(0.5);
    this.sprite.setDepth(1); // Images on top
    // No rotation - images point up naturally
    this.sprite.setRotation(0);
    
    // Health indicator cell (underneath sprite) - using graphics for rounded corners and gradient
    // Create at 0,0 - will be positioned by updateLocalPosition after being added to container
    this.healthCell = this.scene.add.graphics();
    this.healthCell.setDepth(0); // Behind sprite
    this.cellWidth = width;
    this.cellHeight = height;
    
    this.updateHealthCell();
    
    // Initialize power overlay state
    this.powerOverlay = null;
    
    // Check if power overlay should be shown initially
    this.updatePowerOverlay();
  }
  
  updateLocalPosition(localPos) {
    // Update position within container (no rotation needed, container handles it)
    this.localPos = localPos;
    if (this.sprite) {
      this.sprite.setPosition(localPos.x, localPos.y);
    }
    if (this.healthCell) {
      this.healthCell.setPosition(localPos.x, localPos.y);
    }
    if (this.powerOverlay) {
      this.powerOverlay.setPosition(localPos.x, localPos.y);
    }
  }
  
  update(dt) {
    // Override in subclasses
  }
  
  takeDamage(amount) {
    this.health -= amount;
    
    // Flash effect
    if (this.sprite) {
      this.sprite.setAlpha(0.5);
      this.scene.time.delayedCall(100, () => {
        if (this.sprite) this.sprite.setAlpha(1);
      });
    }
    
    if (this.health <= 0) {
      this.health = 0;
      this.alive = false;
      this.onDestroy();
    }
    
    this.updateHealthCell();
  }
  
  updateHealthCell() {
    if (!this.healthCell) return;
    
    const healthPercent = this.health / this.maxHealth;
    const cellSize = 1; // Each cell is 1x1
    const gap = 0.05; // Small gap between cells
    const radius = cellSize * 0.15; // 15% corner radius
    const borderWidth = 0.08; // Inner border width
    
    this.healthCell.clear();
    
    // Draw individual 1x1 cells for the entire module
    for (let row = 0; row < this.size.h; row++) {
      for (let col = 0; col < this.size.w; col++) {
        const cellX = -this.cellWidth/2 + col * cellSize + gap/2;
        const cellY = -this.cellHeight/2 + row * cellSize + gap/2;
        const cellW = cellSize - gap;
        const cellH = cellSize - gap;
        
        if (healthPercent <= 0) {
          // Destroyed - very dark grey
          this.healthCell.fillStyle(0x1a1a1a, 1);
          this.healthCell.fillRoundedRect(cellX, cellY, cellW, cellH, radius);
        } else {
          // Gradient from green (100%) -> yellow (50%) -> red (0%)
          let topColor, bottomColor;
          if (healthPercent > 0.5) {
            // Green to yellow gradient
            const t = (healthPercent - 0.5) * 2; // 0 to 1
            topColor = this.interpolateColor(0xffff00, 0x00ff00, t);
            bottomColor = this.interpolateColor(0xcccc00, 0x00cc00, t);
          } else {
            // Yellow to red gradient
            const t = healthPercent * 2; // 0 to 1
            topColor = this.interpolateColor(0xff0000, 0xffff00, t);
            bottomColor = this.interpolateColor(0xcc0000, 0xcccc00, t);
          }
          
          // Draw gradient using multiple horizontal strips
          const strips = 8;
          for (let i = 0; i < strips; i++) {
            const stripY = cellY + (i * cellH / strips);
            const stripH = cellH / strips;
            const t = i / (strips - 1);
            const color = this.interpolateColor(topColor, bottomColor, t);
            this.healthCell.fillStyle(color, 1);
            
            if (i === 0) {
              // Top strip with rounded top corners
              this.healthCell.fillRoundedRect(cellX, stripY, cellW, stripH + 0.01, { tl: radius, tr: radius, bl: 0, br: 0 });
            } else if (i === strips - 1) {
              // Bottom strip with rounded bottom corners
              this.healthCell.fillRoundedRect(cellX, stripY, cellW, stripH, { tl: 0, tr: 0, bl: radius, br: radius });
            } else {
              // Middle strips - no rounding
              this.healthCell.fillRect(cellX, stripY, cellW, stripH + 0.01);
            }
          }
          
          // Add inner grey border (inset from edge)
          this.healthCell.lineStyle(borderWidth, 0x666666, 0.4);
          this.healthCell.strokeRoundedRect(
            cellX + borderWidth/2, 
            cellY + borderWidth/2, 
            cellW - borderWidth, 
            cellH - borderWidth, 
            radius * 0.8
          );
        }
      }
    }
    
    if (healthPercent <= 0 && this.sprite) {
      this.sprite.setVisible(false);
    }
    
    // Update power overlay effect
    this.updatePowerOverlay();
  }
  
  interpolateColor(color1, color2, t) {
    const r1 = (color1 >> 16) & 0xff;
    const g1 = (color1 >> 8) & 0xff;
    const b1 = color1 & 0xff;
    
    const r2 = (color2 >> 16) & 0xff;
    const g2 = (color2 >> 8) & 0xff;
    const b2 = color2 & 0xff;
    
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    
    return (r << 16) | (g << 8) | b;
  }
  
  updatePowerOverlay() {
    const shouldShowOverlay = this.alive && this.powered === false;
    
    if (shouldShowOverlay && !this.powerOverlay) {
      // Create power overlay sprite
      this.createPowerOverlay();
    } else if (!shouldShowOverlay && this.powerOverlay) {
      // Remove power overlay sprite
      this.destroyPowerOverlay();
    }
  }
  
  createPowerOverlay() {
    if (!this.scene || !this.localPos) return;
    
    const powerConfig = this.scene.visualConfig?.effects?.power_offline || {
      sprite: '/images/effects/energy.png',
      frameWidth: 64,
      frameHeight: 64,
      frames: 5,
      frameRate: 6,
      scale: 0.03,
      alpha: 0.7,
      depth: 16
    };
    
    // Create power overlay sprite at module position
    this.powerOverlay = this.scene.add.sprite(
      this.localPos.x,
      this.localPos.y,
      'energy'
    );
    
    this.powerOverlay.setScale(powerConfig.scale);
    this.powerOverlay.setAlpha(powerConfig.alpha);
    this.powerOverlay.setDepth(powerConfig.depth);
    
    // Create animation if not already created
    if (!this.scene.anims.exists('power_offline_pulse')) {
      this.scene.anims.create({
        key: 'power_offline_pulse',
        frames: this.scene.anims.generateFrameNumbers('energy', { 
          start: 0, 
          end: powerConfig.frames - 1 
        }),
        frameRate: powerConfig.frameRate,
        repeat: -1 // Loop animation
      });
    }
    
    // Play animation
    this.powerOverlay.play('power_offline_pulse');
    
    // Add to ship container so it moves with the ship
    if (this.ship && this.ship.container) {
      this.ship.container.add(this.powerOverlay);
    }
  }
  
  destroyPowerOverlay() {
    if (this.powerOverlay) {
      this.powerOverlay.destroy();
      this.powerOverlay = null;
    }
  }
  
  onDestroy() {
    if (this.sprite) {
      this.sprite.setAlpha(0.3);
      // Rectangle uses setFillStyle instead of setTint
      if (this.sprite.setFillStyle) {
        this.sprite.setFillStyle(0x666666);
      }
    }
    console.log(`Module destroyed: ${this.name}`);
    
    // Destroy power overlay when module is destroyed
    this.destroyPowerOverlay();
    
    // Create explosion and smoke effect at module position
    if (this.worldPos && this.scene.createExplosion) {
      const moduleScale = this.scene.visualConfig?.explosions?.module?.scale || 0.3;
      this.scene.createExplosion(this.worldPos.x, this.worldPos.y, moduleScale);
    }
    
    // Check for reactor explosion
    this.checkReactorExplosion();
    
    // Recalculate power systems after module destruction
    if (this.scene.managePowerSystems && this.ship) {
      this.scene.managePowerSystems(this.ship);
    }
  }
  
  checkReactorExplosion() {
    // Reactor explosion on destruction (category 128 = Reactor)
    const explosionRadius = parseFloat(this.data.er || 0);
    const explosionDamage = parseFloat(this.data.ed || 0);
    
    if (explosionRadius > 0 && explosionDamage > 0) {
      console.log(`Reactor ${this.name} explosion! radius=${explosionRadius} cells, damage=${explosionDamage}`);
      
      // Visual explosion effect (scale by cell radius)
      const visualRadius = explosionRadius * 1.5; // Scale for visibility
      const explosion = this.scene.add.circle(
        this.worldPos.x,
        this.worldPos.y,
        0,
        0xff4400,
        0.6
      );
      explosion.setDepth(10);
      
      // Animate explosion
      this.scene.tweens.add({
        targets: explosion,
        radius: visualRadius,
        alpha: 0,
        duration: 500,
        onComplete: () => explosion.destroy()
      });
      
      // Get all cells occupied by this reactor
      const reactorCells = [];
      for (let r = 0; r < this.size.h; r++) {
        for (let c = 0; c < this.size.w; c++) {
          reactorCells.push({ col: this.col + c, row: this.row + r });
        }
      }
      
      // Damage modules on same ship based on grid distance (Manhattan distance)
      // Only horizontal/vertical, not diagonal
      this.ship.modules.forEach(module => {
        if (!module.alive || module === this) return;
        
        // Find minimum Manhattan distance from any reactor cell to any module cell
        let minDistance = Infinity;
        
        for (let r = 0; r < module.size.h; r++) {
          for (let c = 0; c < module.size.w; c++) {
            const moduleCell = { col: module.col + c, row: module.row + r };
            
            // Check distance to each reactor cell
            reactorCells.forEach(reactorCell => {
              const horizontalDist = Math.abs(moduleCell.col - reactorCell.col);
              const verticalDist = Math.abs(moduleCell.row - reactorCell.row);
              
              // Manhattan distance (only horizontal OR vertical, not both)
              // A cell is adjacent if it's directly horizontal or vertical, not diagonal
              let cellDistance;
              if (horizontalDist === 0) {
                // Same column, use vertical distance
                cellDistance = verticalDist;
              } else if (verticalDist === 0) {
                // Same row, use horizontal distance
                cellDistance = horizontalDist;
              } else {
                // Diagonal - use the sum (Manhattan distance)
                cellDistance = horizontalDist + verticalDist;
              }
              
              minDistance = Math.min(minDistance, cellDistance);
            });
          }
        }
        
        // Apply damage if within explosion radius
        if (minDistance <= explosionRadius) {
          console.log(`  Reactor explosion hit ${module.name} at ${minDistance} cells: ${explosionDamage} damage`);
          module.takeDamage(explosionDamage);
        }
      });
    }
  }

}
