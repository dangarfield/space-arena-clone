import Phaser from 'phaser';
import ModuleFactory from './modules/ModuleFactory.js';
import WeaponModule from './modules/WeaponModule.js';
import EngineModule from './modules/EngineModule.js';
import { hydrateShipConfig } from '../utils/shipHydration.js';
import GUI from 'lil-gui';

const CELL_SIZE = 1; // Size of each grid cell in pixels

export default class BattleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BattleScene' });
  }

  init(data) {
    this.playerConfig = data.playerConfig;
    this.enemyConfig = data.enemyConfig;
  }

  async create() {
    console.log('BattleScene create() called');
    console.log('Player config (raw):', this.playerConfig);
    console.log('Enemy config (raw):', this.enemyConfig);
    
    // ALWAYS hydrate both configs - they should be minimal format
    if (!this.playerConfig || !this.playerConfig.shipId || !this.playerConfig.modules) {
      console.error('Invalid player config format. Expected {shipId, modules}:', this.playerConfig);
      return;
    }
    
    if (!this.enemyConfig || !this.enemyConfig.shipId || !this.enemyConfig.modules) {
      console.error('Invalid enemy config format. Expected {shipId, modules}:', this.enemyConfig);
      return;
    }
    
    // Hydrate both configs
    console.log('Hydrating player config...');
    this.playerConfig = await hydrateShipConfig(this.playerConfig);
    console.log('Hydrating enemy config...');
    this.enemyConfig = await hydrateShipConfig(this.enemyConfig);
    
    console.log('Player config hydrated:', this.playerConfig.modules.length, 'modules');
    console.log('Enemy config hydrated:', this.enemyConfig.modules.length, 'modules');
    
    // Arena setup
    this.cameras.main.setBackgroundColor('#0a0a1a');
    
    // Create ships - player pointing right, enemy pointing left (facing each other)
    this.playerShip = this.createBattleShip(this.playerConfig, { x: -10, y: 0 }, 0);
    this.enemyShip = this.createBattleShip(this.enemyConfig, { x: 10, y: 0 }, Math.PI);
    
    console.log('Player ship created:', this.playerShip);
    console.log('Player modules:', this.playerShip.modules.length);
    console.log('Enemy ship created:', this.enemyShip);
    console.log('Enemy modules:', this.enemyShip.modules.length);
    
    // Initialize systems
    this.projectiles = [];
    this.effects = [];
    
    // Camera - no bounds, allow free movement
    // this.cameras.main.setBounds(0, 0, 1200, 800);
    
    // Debug grid
    const gridSize = 10;
    const gridExtent = 200;
    this.gridGraphics = this.add.graphics({ lineStyle: { width: 0.1, color: 0x333333 } });
    
    for (let x = -gridExtent; x <= gridExtent; x += gridSize) {
      this.gridGraphics.lineBetween(x, -gridExtent, x, gridExtent);
    }
    for (let y = -gridExtent; y <= gridExtent; y += gridSize) {
      this.gridGraphics.lineBetween(-gridExtent, y, gridExtent, y);
    }
    
    // Highlight origin
    this.gridGraphics.lineStyle(0.2, 0x00ff00);
    this.gridGraphics.lineBetween(-5, 0, 5, 0);
    this.gridGraphics.lineBetween(0, -5, 0, 5);
    
    // Direction indicators (added to containers) - point up in local space
    this.playerDirection = this.add.graphics({ lineStyle: { width: 0.3, color: 0x4444ff } });
    this.playerDirection.lineBetween(0, 0, 0, -100); // Point up in local space
    this.playerShip.container.add(this.playerDirection);
    
    this.enemyDirection = this.add.graphics({ lineStyle: { width: 0.3, color: 0xff0000 } });
    this.enemyDirection.lineBetween(0, 0, 0, -100); // Point up in local space
    this.enemyShip.container.add(this.enemyDirection);
    
    // Frame counter for periodic logging
    this.frameCount = 0;
    
    // Setup GUI
    this.setupGUI();
  }
  
  setupGUI() {
    this.gui = new GUI({ title: 'Battle Debug' });
    
    this.debugSettings = {
      showModules: true,
      showGrid: true,
      showFiringCones: true,
      showDirectionLines: true,
      showShields: true,
      enableEngines: false,
      enableWeapons: false,
      turnMultiplier: 0.02,
      thrustMultiplier: 0.0001,
      ballisticSpeed: 40,
      missileSpeed: 30
    };
    
    // Battle View folder
    const viewFolder = this.gui.addFolder('Battle View');
    
    viewFolder.add(this.debugSettings, 'showModules').name('Module Icons').onChange(v => {
      this.playerShip.modules.forEach(m => {
        if (m.sprite) m.sprite.setVisible(v);
      });
      this.enemyShip.modules.forEach(m => {
        if (m.sprite) m.sprite.setVisible(v);
      });
    });
    
    viewFolder.add(this.debugSettings, 'showGrid').name('Grid').onChange(v => {
      if (this.gridGraphics) this.gridGraphics.setVisible(v);
    });
    
    viewFolder.add(this.debugSettings, 'showFiringCones').name('Firing Cones').onChange(v => {
      this.playerShip.modules.forEach(m => {
        if (m.rangeGraphics) m.rangeGraphics.setVisible(v);
      });
      this.enemyShip.modules.forEach(m => {
        if (m.rangeGraphics) m.rangeGraphics.setVisible(v);
      });
    });
    
    viewFolder.add(this.debugSettings, 'showDirectionLines').name('Direction Lines').onChange(v => {
      if (this.playerDirection) this.playerDirection.setVisible(v);
      if (this.enemyDirection) this.enemyDirection.setVisible(v);
    });
    
    viewFolder.add(this.debugSettings, 'showShields').name('Shield Radius').onChange(v => {
      this.playerShip.modules.forEach(m => {
        if (m.shieldGraphics) m.shieldGraphics.setVisible(v);
      });
      this.enemyShip.modules.forEach(m => {
        if (m.shieldGraphics) m.shieldGraphics.setVisible(v);
      });
    });
    
    // Battle Actions folder
    const actionsFolder = this.gui.addFolder('Battle Actions');
    
    actionsFolder.add(this.debugSettings, 'enableEngines').name('Engines');
    actionsFolder.add(this.debugSettings, 'enableWeapons').name('Weapons');
    
    // Battle Variables folder
    const variablesFolder = this.gui.addFolder('Battle Variables');
    
    variablesFolder.add(this.debugSettings, 'turnMultiplier', 0, 0.1, 0.001).name('Turn Speed');
    variablesFolder.add(this.debugSettings, 'thrustMultiplier', 0, 0.001, 0.00001).name('Thrust Speed');
    variablesFolder.add(this.debugSettings, 'ballisticSpeed', 0, 200, 1).name('Ballistic Speed');
    variablesFolder.add(this.debugSettings, 'missileSpeed', 0, 100, 1).name('Missile Speed');
  }



  createBattleShip(config, position, rotation) {
    // Create container for all ship modules
    const container = this.add.container(position.x, position.y);
    container.setRotation(rotation);
    
    const ship = {
      config: config,
      pos: position,
      rotation: rotation,
      velocity: { x: 0, y: 0 },
      modules: [],
      container: container,
      destroyed: false
    };
    
    console.log('=== Creating ship ===');
    
    // Create module instances using factory
    config.modules.forEach((moduleConfig, index) => {
      const module = ModuleFactory.createModule(moduleConfig, ship, this);
      
      // Calculate position relative to ship center (not world position)
      const localPos = this.gridToLocal(module.col, module.row, module.size, ship);
      module.createSprite(localPos.x, localPos.y, 0, CELL_SIZE); // rotation 0 since container handles it
      module.updateLocalPosition(localPos);
      
      // Create weapon/shield visuals if applicable
      if (module.createVisuals) {
        module.createVisuals(localPos.x, localPos.y);
        if (module.rangeGraphics) container.add(module.rangeGraphics);
        if (module.shieldGraphics) container.add(module.shieldGraphics);
      }
      
      // Add sprites to container
      if (module.healthCell) container.add(module.healthCell);
      if (module.sprite) container.add(module.sprite);
      
      ship.modules.push(module);
    });
    
    // Count module types
    const weapons = ship.modules.filter(m => m instanceof WeaponModule);
    const engines = ship.modules.filter(m => m instanceof EngineModule);
    const shields = ship.modules.filter(m => m.constructor.name === 'ShieldModule');
    
    console.log(`Ship created: ${ship.modules.length} modules (${weapons.length} weapons, ${engines.length} engines, ${shields.length} shields)`);
    weapons.forEach(w => console.log(`  Weapon: fc=${w.fireCone}, rng=${w.range}`));
    shields.forEach(s => console.log(`  Shield: radius=${s.shieldRadius}`));
    
    return ship;
  }

  gridToLocal(col, row, moduleSize, ship) {
    // Convert grid coordinates to local position relative to ship center
    const shipData = ship.config.ship;
    const gridWidth = shipData.w || 6;
    const gridHeight = shipData.h || 5;
    
    // Ship grid is designed pointing "up" (row 0 at top)
    // col, row is the top-left corner of the module in grid space
    // Calculate center of module in grid space
    const moduleCenterCol = col + moduleSize.w / 2;
    const moduleCenterRow = row + moduleSize.h / 2;
    
    // Keep natural orientation - ships point up
    const offsetX = (moduleCenterCol - gridWidth / 2) * CELL_SIZE;
    const offsetY = (moduleCenterRow - gridHeight / 2) * CELL_SIZE;
    
    return { x: offsetX, y: offsetY };
  }
  
  gridToWorld(col, row, moduleSize, ship) {
    if (!ship || !ship.config) {
      console.error('gridToWorld called with invalid ship:', ship);
      return { x: 0, y: 0 };
    }
    // Get local position then transform to world
    const local = this.gridToLocal(col, row, moduleSize, ship);
    
    // Rotate based on ship rotation
    const cos = Math.cos(ship.rotation);
    const sin = Math.sin(ship.rotation);
    
    const rotatedX = local.x * cos - local.y * sin;
    const rotatedY = local.x * sin + local.y * cos;
    
    return {
      x: ship.pos.x + rotatedX,
      y: ship.pos.y + rotatedY
    };
  }

  update(time, delta) {
    const dt = delta / 1000; // Convert to seconds
    
    // Wait for async create() to finish
    if (!this.playerShip || !this.enemyShip) {
      return;
    }
    
    if (this.playerShip.destroyed || this.enemyShip.destroyed) {
      return;
    }
    
    this.frameCount++;
    
    // Update ships
    this.updateShip(this.playerShip, this.enemyShip, dt);
    this.updateShip(this.enemyShip, this.playerShip, dt);
    
    // Update projectiles
    this.updateProjectiles(dt);
    
    // Update effects
    this.updateEffects(dt);
    
    // Update camera to keep both ships in view
    this.updateCamera();
    

  }

  updateShip(ship, enemyShip, dt) {
    // Update container position and rotation
    // Offset container by +90° since visuals point up but Phaser 0° = right
    ship.container.setPosition(ship.pos.x, ship.pos.y);
    ship.container.setRotation(ship.rotation + Math.PI / 2);
    
    // Update all modules (for logic, not position)
    ship.modules.forEach(module => {
      // Calculate world position for collision detection
      const worldPos = this.gridToWorld(module.col, module.row, module.size, ship);
      module.worldPos = worldPos;
      module.update(dt);
    });
    
    // AI and combat
    this.updateAI(ship, enemyShip, dt);
  }

  updateAI(ship, enemyShip, dt) {
    // Weapons
    if (this.debugSettings.enableWeapons) {
      const weapons = ship.modules.filter(m => m instanceof WeaponModule && m.alive);
      
      const distance = Phaser.Math.Distance.Between(
        ship.pos.x, ship.pos.y,
        enemyShip.pos.x, enemyShip.pos.y
      );
      
      weapons.forEach(weapon => {
        if (distance <= weapon.range && weapon.canFire()) {
          weapon.fire(enemyShip);
        }
      });
    }
    
    // Movement AI
    const engines = ship.modules.filter(m => m instanceof EngineModule && m.alive);
    
    if (engines.length > 0) {
      // Calculate angle to enemy
      const angleToEnemy = Phaser.Math.Angle.Between(
        ship.pos.x, ship.pos.y,
        enemyShip.pos.x, enemyShip.pos.y
      );
      
      // Sum engine contributions
      const totalThrust = engines.reduce((sum, e) => sum + e.getThrustContribution(), 0);
      const totalTurn = engines.reduce((sum, e) => sum + e.getTurnContribution(), 0);
      
      // Engines
      if (this.debugSettings.enableEngines) {
        // Rotate towards enemy (no clamping - allows overshoot)
        const shipTurnPower = ship.config.ship.ts || 1;
        if (totalTurn > 0) {
          const angleDiff = Phaser.Math.Angle.Wrap(angleToEnemy - ship.rotation);
          const turnAmount = angleDiff * totalTurn * shipTurnPower * this.debugSettings.turnMultiplier * dt;
          ship.rotation += turnAmount;
        }
        
        // Move forward if facing roughly towards enemy
        const angleDiff = Math.abs(Phaser.Math.Angle.Wrap(angleToEnemy - ship.rotation));
        if (angleDiff < Math.PI / 4 && totalThrust > 0) { // Within 45 degrees
          // Use ship rotation directly (no offset)
          ship.velocity.x += Math.cos(ship.rotation) * totalThrust * this.debugSettings.thrustMultiplier * dt;
          ship.velocity.y += Math.sin(ship.rotation) * totalThrust * this.debugSettings.thrustMultiplier * dt;
        }
        
        // Cap velocity to ship's max speed
        const maxSpeed = ship.config.ship.ms || 10;
        const currentSpeed = Math.sqrt(ship.velocity.x ** 2 + ship.velocity.y ** 2);
        if (currentSpeed > maxSpeed) {
          ship.velocity.x = (ship.velocity.x / currentSpeed) * maxSpeed;
          ship.velocity.y = (ship.velocity.y / currentSpeed) * maxSpeed;
        }
        
        // Apply velocity
        ship.pos.x += ship.velocity.x;
        ship.pos.y += ship.velocity.y;
      }
    }
  }



  raycastToModules(start, end, ship) {
    const modules = ship.modules.filter(m => m.alive);
    let closestModule = null;
    let closestDist = Infinity;
    
    const ray = new Phaser.Geom.Line(start.x, start.y, end.x, end.y);
    
    modules.forEach(module => {
      const bounds = new Phaser.Geom.Rectangle(
        module.worldPos.x - (module.size.w * CELL_SIZE) / 2,
        module.worldPos.y - (module.size.h * CELL_SIZE) / 2,
        module.size.w * CELL_SIZE,
        module.size.h * CELL_SIZE
      );
      
      // Get actual intersection points on the rectangle
      const intersectionPoints = [];
      const intersects = Phaser.Geom.Intersects.GetLineToRectangle(ray, bounds, intersectionPoints);
      
      if (intersects && intersectionPoints.length > 0) {
        // Use first intersection point (closest to ray start)
        const point = intersectionPoints[0];
        const dist = Phaser.Math.Distance.Between(start.x, start.y, point.x, point.y);
        if (dist < closestDist) {
          closestDist = dist;
          closestModule = module;
        }
      }
    });
    
    return closestModule;
  }

  updateProjectiles(dt) {
    this.projectiles = this.projectiles.filter(proj => {
      if (proj.type === 'ballistic') {
        // Update position
        proj.x += proj.velocity.x * dt;
        proj.y += proj.velocity.y * dt;
        proj.sprite.setPosition(proj.x, proj.y);
        
        // Track travel distance for damage dropoff
        const distanceTraveled = Math.sqrt(proj.velocity.x ** 2 + proj.velocity.y ** 2) * dt;
        proj.travelDistance += distanceTraveled;
        
        // Check collision
        const target = proj.owner === this.playerShip ? this.enemyShip : this.playerShip;
        const hit = this.checkBallisticCollision(proj, target);
        
        if (hit || proj.travelDistance > this.range) {
          proj.sprite.destroy();
          return false;
        }
      }
      
      if (proj.type === 'missile') {
        proj.lifetime += dt;
        proj.fuelRemaining -= dt;
        
        const target = proj.target;
        
        // Tracking only works while fuel remains
        if (proj.fuelRemaining > 0 && target && target.alive) {
          const angleToTarget = Phaser.Math.Angle.Between(proj.x, proj.y, target.worldPos.x, target.worldPos.y);
          // Accuracy affects turn rate (higher accuracy = tighter tracking)
          const turnRate = proj.accuracy * 0.2;
          proj.rotation = Phaser.Math.Angle.RotateTo(proj.rotation, angleToTarget, turnRate);
        }
        
        // Move forward
        proj.x += Math.cos(proj.rotation) * proj.speed * dt;
        proj.y += Math.sin(proj.rotation) * proj.speed * dt;
        proj.sprite.setPosition(proj.x, proj.y);
        proj.sprite.setRotation(proj.rotation + Math.PI / 2); // Offset for visual
        
        // Check collision or lifetime expiry
        const targetShip = proj.owner === this.playerShip ? this.enemyShip : this.playerShip;
        const hit = this.checkMissileCollision(proj, targetShip);
        
        if (hit || proj.lifetime > proj.maxLifetime) {
          proj.sprite.destroy();
          return false;
        }
      }
      
      return true;
    });
  }

  checkBallisticCollision(projectile, targetShip) {
    const modules = targetShip.modules.filter(m => m.alive);
    
    // Sort modules by distance from projectile (check closest first)
    const sortedModules = modules.sort((a, b) => {
      const distA = Phaser.Math.Distance.Between(projectile.x, projectile.y, a.worldPos.x, a.worldPos.y);
      const distB = Phaser.Math.Distance.Between(projectile.x, projectile.y, b.worldPos.x, b.worldPos.y);
      return distA - distB;
    });
    
    for (const module of sortedModules) {
      const bounds = new Phaser.Geom.Rectangle(
        module.worldPos.x - (module.size.w * CELL_SIZE) / 2,
        module.worldPos.y - (module.size.h * CELL_SIZE) / 2,
        module.size.w * CELL_SIZE,
        module.size.h * CELL_SIZE
      );
      
      if (Phaser.Geom.Rectangle.Contains(bounds, projectile.x, projectile.y)) {
        // Calculate damage with dropoff
        let damage = projectile.baseDamage;
        if (projectile.damageDropoff > 0) {
          const dropoffFactor = 1 - (projectile.travelDistance / 1000) * projectile.damageDropoff;
          damage *= Math.max(0.1, dropoffFactor); // Minimum 10% damage
        }
        
        // Apply armor penetration
        const moduleArmor = module.armor || 0;
        const penetration = projectile.impactPower * projectile.impactForceMultiplier;
        
        // Ricochet mechanics - can penetrate multiple layers
        if (penetration < moduleArmor && projectile.ricochetFactor > 0) {
          damage *= (projectile.ricochetPower / 200); // Reduced damage on ricochet
          console.log(`Ricochet! Reduced damage: ${damage.toFixed(1)}`);
        } else if (penetration >= moduleArmor) {
          console.log(`Penetrated armor! Full damage: ${damage.toFixed(1)}`);
        } else {
          damage *= 0.5; // Partial damage if no penetration
          console.log(`Blocked by armor! Reduced damage: ${damage.toFixed(1)}`);
        }
        
        module.takeDamage(damage);
        this.checkShipDestruction(module.ship);
        return true; // Projectile destroyed on hit
      }
    }
    
    return false;
  }
  
  checkMissileCollision(projectile, targetShip) {
    const modules = targetShip.modules.filter(m => m.alive);
    
    // Sort modules by distance from projectile (check closest first)
    const sortedModules = modules.sort((a, b) => {
      const distA = Phaser.Math.Distance.Between(projectile.x, projectile.y, a.worldPos.x, a.worldPos.y);
      const distB = Phaser.Math.Distance.Between(projectile.x, projectile.y, b.worldPos.x, b.worldPos.y);
      return distA - distB;
    });
    
    for (const module of sortedModules) {
      const bounds = new Phaser.Geom.Rectangle(
        module.worldPos.x - (module.size.w * CELL_SIZE) / 2,
        module.worldPos.y - (module.size.h * CELL_SIZE) / 2,
        module.size.w * CELL_SIZE,
        module.size.h * CELL_SIZE
      );
      
      if (Phaser.Geom.Rectangle.Contains(bounds, projectile.x, projectile.y)) {
        // Explosion damage with AoE
        if (projectile.explosionRadius > 0) {
          // Apply damage to all modules in radius
          modules.forEach(m => {
            const dist = Phaser.Math.Distance.Between(projectile.x, projectile.y, m.worldPos.x, m.worldPos.y);
            if (dist <= projectile.explosionRadius) {
              const falloff = 1 - (dist / projectile.explosionRadius);
              const damage = projectile.baseDamage * projectile.explosionForce * falloff;
              m.takeDamage(damage);
              console.log(`Explosion hit module at ${dist.toFixed(1)} units: ${damage.toFixed(1)} damage`);
            }
          });
          
          // Visual explosion effect
          const explosion = this.add.circle(projectile.x, projectile.y, projectile.explosionRadius, 0xff6600, 0.5);
          explosion.setDepth(10);
          this.tweens.add({
            targets: explosion,
            alpha: 0,
            scale: 1.5,
            duration: 300,
            onComplete: () => explosion.destroy()
          });
        } else {
          // Direct hit damage
          module.takeDamage(projectile.baseDamage);
        }
        
        this.checkShipDestruction(module.ship);
        return true; // Projectile destroyed on hit
      }
    }
    
    return false;
  }

  checkShipDestruction(ship) {
    const aliveWeapons = ship.modules.filter(m => m instanceof WeaponModule && m.alive);
    const aliveReactors = ship.modules.filter(m => (m.category & 128) && m.alive);
    
    if (aliveWeapons.length === 0 || aliveReactors.length === 0) {
      ship.destroyed = true;
      
      // Show result via alert
      const isPlayer = ship === this.playerShip;
      alert(isPlayer ? 'DEFEAT - Your ship was destroyed!' : 'VICTORY - Enemy ship destroyed!');
    }
  }

  updateEffects(dt) {
    // Placeholder for effect updates
  }
  
  updateCamera() {
    // Calculate center point between the two ships only
    const centerX = (this.playerShip.pos.x + this.enemyShip.pos.x) / 2;
    const centerY = (this.playerShip.pos.y + this.enemyShip.pos.y) / 2;
    
    // Calculate distance between ships
    const distance = Phaser.Math.Distance.Between(
      this.playerShip.pos.x, this.playerShip.pos.y,
      this.enemyShip.pos.x, this.enemyShip.pos.y
    );
    
    // Calculate zoom based on distance (add padding for ship size)
    const padding = 50;
    const requiredWidth = distance + padding;
    const requiredHeight = distance + padding;
    
    const zoomX = this.cameras.main.width / requiredWidth;
    const zoomY = this.cameras.main.height / requiredHeight;
    const clampedZoom = Math.min(zoomX, zoomY) * 2; // 2x zoom
    
    // Center directly on the average position
    const cam = this.cameras.main;
    cam.zoom = clampedZoom;
    cam.scrollX = centerX - cam.width / 2;
    cam.scrollY = centerY - cam.height / 2;
    
    // Debug logging every 1 second
    if (!this.lastLogTime) this.lastLogTime = 0;
    if (this.time.now - this.lastLogTime > 1000) {
      const actualCenterX = cam.scrollX + cam.width / 2 / cam.zoom;
      const actualCenterY = cam.scrollY + cam.height / 2 / cam.zoom;
      console.log(`Player: (${Math.round(this.playerShip.pos.x)}, ${Math.round(this.playerShip.pos.y)}) | Enemy: (${Math.round(this.enemyShip.pos.x)}, ${Math.round(this.enemyShip.pos.y)}) | Target: (${Math.round(centerX)}, ${Math.round(centerY)}) | Actual: (${Math.round(actualCenterX)}, ${Math.round(actualCenterY)}) | Scroll: (${Math.round(cam.scrollX)}, ${Math.round(cam.scrollY)}) | Zoom: ${cam.zoom.toFixed(2)}`);
      this.lastLogTime = this.time.now;
    }
  }
}
