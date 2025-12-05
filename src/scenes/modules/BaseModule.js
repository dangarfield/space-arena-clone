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
        }
      });
      this.scene.load.start();
      
      // Set initial size
      this.sprite.setDisplaySize(width, height);
    } else {
      this.sprite = this.scene.add.rectangle(x, y, width, height, this.color);
    }
    
    this.sprite.setOrigin(0.5);
    this.sprite.setDepth(1); // Images on top
    // No rotation - images point up naturally
    this.sprite.setRotation(0);
    
    // Health indicator cell (underneath sprite)
    // Create at 0,0 - will be positioned by updateLocalPosition after being added to container
    this.healthCell = this.scene.add.rectangle(0, 0, width, height, 0x00ff00);
    this.healthCell.setOrigin(0.5);
    this.healthCell.setDepth(0); // Behind sprite
    
    this.updateHealthCell();
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
    
    if (healthPercent <= 0) {
      // Destroyed - black cell, hide sprite
      this.healthCell.setFillStyle(0x000000);
      if (this.sprite) this.sprite.setVisible(false);
    } else {
      // Set color based on health
      let color;
      if (healthPercent > 0.5) {
        color = 0x00ff00; // Green
      } else if (healthPercent > 0.25) {
        color = 0xff8800; // Orange
      } else {
        color = 0xff0000; // Red
      }
      this.healthCell.setFillStyle(color);
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
    
    // Create explosion and smoke effect at module position
    if (this.worldPos && this.scene.createExplosion) {
      const moduleScale = this.scene.visualConfig?.explosions?.module?.scale || 0.3;
      this.scene.createExplosion(this.worldPos.x, this.worldPos.y, moduleScale);
    }
    
    // Check for reactor explosion
    this.checkReactorExplosion();
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
