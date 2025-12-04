import Phaser from 'phaser';
import ModuleFactory from './modules/ModuleFactory.js';
import WeaponModule from './modules/WeaponModule.js';
import EngineModule from './modules/EngineModule.js';
import WarpModule from './modules/WarpModule.js';
import PointDefenseModule from './modules/PointDefenseModule.js';
import { hydrateShipConfig } from '../utils/shipHydration.js';
import GUI from 'lil-gui';
import visualEffectsConfig from '../config/visual-effects.json';

const CELL_SIZE = 1; // Size of each grid cell in pixels

export default class BattleScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BattleScene' });
  }

  preload() {
    // Store visual config
    this.visualConfig = visualEffectsConfig;
    
    // Load all projectile sprites
    const spritesToLoad = new Set();
    
    // Collect ballistic sprites
    Object.values(this.visualConfig.projectiles.ballistic).forEach(config => {
      if (config.sprite) spritesToLoad.add(config.sprite);
    });
    
    // Collect missile sprites
    Object.values(this.visualConfig.projectiles.missile).forEach(config => {
      if (config.sprite) spritesToLoad.add(config.sprite);
    });
    
    // Collect PD sprite
    if (this.visualConfig.projectiles.point_defense?.sprite) {
      spritesToLoad.add(this.visualConfig.projectiles.point_defense.sprite);
    }
    
    // Load unique sprites
    spritesToLoad.forEach(spritePath => {
      const key = spritePath.split('/').pop().replace('.png', '');
      this.load.image(key, spritePath);
    });
    
    // Load sprite sheets for effects
    this.load.spritesheet('smoke', '/images/effects/smoke.png', {
      frameWidth: 256,
      frameHeight: 256
    });
    
    this.load.spritesheet('explosion', '/images/effects/explosion.png', {
      frameWidth: 32,
      frameHeight: 32
    });
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
    // Start far apart so they approach each other
    this.playerShip = this.createBattleShip(this.playerConfig, { x: -50, y: 0 }, 0);
    this.enemyShip = this.createBattleShip(this.enemyConfig, { x: 50, y: 0 }, Math.PI);
    
    console.log('Player ship created:', this.playerShip);
    console.log('Player modules:', this.playerShip.modules.length);
    console.log('Enemy ship created:', this.enemyShip);
    console.log('Enemy modules:', this.enemyShip.modules.length);
    
    // Initialize systems
    this.projectiles = [];
    this.pdProjectiles = [];
    this.activeBeams = [];
    this.effects = [];
    this.junkPieces = [];
    
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
    this.playerDirection.setVisible(false); // Start hidden
    this.playerShip.container.add(this.playerDirection);
    
    this.enemyDirection = this.add.graphics({ lineStyle: { width: 0.3, color: 0xff0000 } });
    this.enemyDirection.lineBetween(0, 0, 0, -100); // Point up in local space
    this.enemyDirection.setVisible(false); // Start hidden
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
      showDirectionLines: false,
      showShields: true,
      enableEngines: true,
      enableWeapons: true,
      timeScale: 1.0,
      turnMultiplier: 0.02,
      thrustMultiplier: 0.0001,
      ballisticSpeed: 400,
      missileSpeed: 30,
      missileLaunchAngle: 30,
      missileTrackingDelay: 0.5,
      missileTurnRate: 0.05,
      missileDamageFactor: 0.1,
      minDamageDropoff: 0.1,
      ricochetDamageFactor: 200,
      armorBlockFactor: 0.5,
      laserBeamWidth: 0.1,
      explosionDuration: 300,
      explosionScale: 1.5,
      velocityDamping: 0.98,
      engagementRangeFactor: 0.7
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
    
    variablesFolder.add(this.debugSettings, 'timeScale', 0.1, 10, 0.1).name('Time Scale');
    variablesFolder.add(this.debugSettings, 'turnMultiplier', 0, 0.1, 0.001).name('Turn Speed');
    variablesFolder.add(this.debugSettings, 'thrustMultiplier', 0, 0.001, 0.00001).name('Thrust Speed');
    variablesFolder.add(this.debugSettings, 'ballisticSpeed', 0, 200, 1).name('Ballistic Speed');
    variablesFolder.add(this.debugSettings, 'missileSpeed', 0, 100, 1).name('Missile Speed');
    variablesFolder.add(this.debugSettings, 'missileLaunchAngle', 0, 90, 1).name('Missile Launch Angle');
    variablesFolder.add(this.debugSettings, 'missileTrackingDelay', 0, 2, 0.1).name('Missile Track Delay');
    variablesFolder.add(this.debugSettings, 'missileTurnRate', 0, 0.2, 0.001).name('Missile Turn Rate');
    variablesFolder.add(this.debugSettings, 'missileDamageFactor', 0.1, 2, 0.05).name('Missile Damage Factor');
    variablesFolder.add(this.debugSettings, 'minDamageDropoff', 0, 1, 0.05).name('Min Damage Dropoff');
    variablesFolder.add(this.debugSettings, 'ricochetDamageFactor', 1, 500, 1).name('Ricochet Damage Factor');
    variablesFolder.add(this.debugSettings, 'armorBlockFactor', 0, 1, 0.1).name('Armor Block Factor');
    variablesFolder.add(this.debugSettings, 'laserBeamWidth', 0.1, 5, 0.1).name('Laser Beam Width');
    variablesFolder.add(this.debugSettings, 'explosionDuration', 100, 1000, 50).name('Explosion Duration (ms)');
    variablesFolder.add(this.debugSettings, 'explosionScale', 1, 5, 0.1).name('Explosion Scale');
    variablesFolder.add(this.debugSettings, 'velocityDamping', 0.9, 1, 0.01).name('Velocity Damping');
    variablesFolder.add(this.debugSettings, 'engagementRangeFactor', 0.1, 1, 0.05).name('Engagement Range %');
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
      
      // Create weapon/shield/PD visuals if applicable
      if (module.createVisuals) {
        module.createVisuals(localPos.x, localPos.y);
        if (module.rangeGraphics) container.add(module.rangeGraphics);
        if (module.shieldGraphics) container.add(module.shieldGraphics);
        if (module.pdGraphics) container.add(module.pdGraphics);
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
    // Local space has ships pointing up (-90° in Phaser coords), so add PI/2 to align
    const actualRotation = ship.rotation + Math.PI / 2;
    const cos = Math.cos(actualRotation);
    const sin = Math.sin(actualRotation);
    
    const rotatedX = local.x * cos - local.y * sin;
    const rotatedY = local.x * sin + local.y * cos;
    
    return {
      x: ship.pos.x + rotatedX,
      y: ship.pos.y + rotatedY
    };
  }

  update(time, delta) {
    let dt = delta / 1000; // Convert to seconds
    
    // Apply time scale (only if debugSettings exists)
    if (this.debugSettings) {
      dt *= this.debugSettings.timeScale;
    }
    
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
    this.updatePDProjectiles(dt);
    
    // Update laser beams
    this.updateLaserBeams();
    
    // Update junk pieces
    this.updateJunk(dt);
    
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
    
    // Warp drive mechanics
    this.updateWarp(ship, enemyShip, dt);
    
    // AI and combat
    this.updateAI(ship, enemyShip, dt);
  }

  updateWarp(ship, enemyShip, dt) {
    const warpModules = ship.modules.filter(m => m instanceof WarpModule && m.alive);
    if (warpModules.length === 0) return;
    
    // Initialize warp timer
    if (!ship.warpTimer) {
      ship.warpTimer = 0;
      ship.warpCooldown = this.calculateWarpCooldown(ship, warpModules);
      console.log(`Initial warp cooldown calculated: ${ship.warpCooldown.toFixed(1)}s`);
    }
    
    ship.warpTimer += dt;
    
    // Check if ready to warp
    if (ship.warpTimer >= ship.warpCooldown) {
      this.performWarp(ship, enemyShip);
      ship.warpTimer = 0;
      ship.warpCooldown = this.calculateWarpCooldown(ship, warpModules);
    }
  }
  
  calculateWarpCooldown(ship, warpModules) {
    // Formula: Fixed + (Ship cells / Sum of Warp Power) + Random
    const fixedTime = 5; // Base cooldown
    const totalCells = ship.config.ship.w * ship.config.ship.h;
    const totalWarpPower = warpModules.reduce((sum, m) => sum + m.getWarpPower(), 0);
    const randomTime = Math.random() * 2; // 0-2 seconds
    
    const cooldown = fixedTime + (totalCells / Math.max(1, totalWarpPower) / 6) + randomTime;
    console.log(`Warp cooldown: ${cooldown.toFixed(1)}s (cells: ${totalCells}, power: ${totalWarpPower})`);
    return cooldown;
  }
  
  performWarp(ship, enemyShip) {
    const currentDistance = Phaser.Math.Distance.Between(
      ship.pos.x, ship.pos.y,
      enemyShip.pos.x, enemyShip.pos.y
    );
    
    // Jump to random location 0.5-1.5x current distance from enemy
    const distanceFactor = 0.5 + Math.random(); // 0.5 to 1.5
    const newDistance = currentDistance * distanceFactor;
    const randomAngle = Math.random() * Math.PI * 2;
    
    // Calculate new position relative to enemy
    const newX = enemyShip.pos.x + Math.cos(randomAngle) * newDistance;
    const newY = enemyShip.pos.y + Math.sin(randomAngle) * newDistance;
    
    // Visual warp effect
    const warpOut = this.add.circle(ship.pos.x, ship.pos.y, 10, 0x00ffff, 0.8);
    warpOut.setDepth(20);
    this.tweens.add({
      targets: warpOut,
      alpha: 0,
      scale: 3,
      duration: 300,
      onComplete: () => warpOut.destroy()
    });
    
    // Teleport ship
    ship.pos.x = newX;
    ship.pos.y = newY;
    
    // Face the enemy ship after warp
    ship.rotation = Phaser.Math.Angle.Between(newX, newY, enemyShip.pos.x, enemyShip.pos.y);
    
    // Reset velocity (warp doesn't affect speed)
    ship.velocity.x = 0;
    ship.velocity.y = 0;
    
    // Visual warp in effect
    const warpIn = this.add.circle(newX, newY, 30, 0x00ffff, 0.8);
    warpIn.setDepth(20);
    this.tweens.add({
      targets: warpIn,
      alpha: 0,
      scale: 0.5,
      duration: 300,
      onComplete: () => warpIn.destroy()
    });
    
    // Missiles lose focus (clear tracking)
    this.projectiles.forEach(proj => {
      if (proj.type === 'missile' && proj.owner === ship) {
        proj.target = null; // Lose lock
      }
    });
    
    console.log(`Ship warped from (${ship.pos.x.toFixed(1)}, ${ship.pos.y.toFixed(1)}) to (${newX.toFixed(1)}, ${newY.toFixed(1)})`);
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
        // Calculate distance to enemy
        const distance = Phaser.Math.Distance.Between(
          ship.pos.x, ship.pos.y,
          enemyShip.pos.x, enemyShip.pos.y
        );
        
        // Rotate towards enemy
        const shipTurnPower = ship.config.ship.ts || 1;
        if (totalTurn > 0) {
          const angleDiff = Phaser.Math.Angle.Wrap(angleToEnemy - ship.rotation);
          const turnAmount = angleDiff * totalTurn * shipTurnPower * this.debugSettings.turnMultiplier * dt;
          ship.rotation += turnAmount;
        }
        
        // Desired engagement distance (average weapon range)
        const weapons = ship.modules.filter(m => m instanceof WeaponModule && m.alive);
        const avgRange = weapons.length > 0 
          ? weapons.reduce((sum, w) => sum + w.range, 0) / weapons.length 
          : 50;
        const engagementRangeFactor = this.debugSettings?.engagementRangeFactor || 0.7;
        
        // Vary engagement distance over time for more natural movement
        if (!ship.engagementVariation) {
          ship.engagementVariation = Math.random() * 0.3 - 0.15; // -0.15 to +0.15
          ship.engagementTimer = 0;
        }
        ship.engagementTimer += dt;
        
        if (ship.engagementTimer > 3) { // Change preferred distance every 3 seconds
          ship.engagementVariation = Math.random() * 0.3 - 0.15;
          ship.engagementTimer = 0;
        }
        
        const variedRangeFactor = engagementRangeFactor + ship.engagementVariation;
        const engagementDistance = avgRange * variedRangeFactor;
        
        const angleDiff = Math.abs(Phaser.Math.Angle.Wrap(angleToEnemy - ship.rotation));
        
        // Determine thrust direction based on distance
        let thrustDirection = 0; // 0 = none, 1 = forward, -1 = reverse
        
        if (distance > engagementDistance * 1.1 && angleDiff < Math.PI / 4) {
          thrustDirection = 1; // Too far - thrust forward
        } else if (distance < engagementDistance * 0.9) {
          thrustDirection = -1; // Too close - reverse thrust
        }
        

        
        if (thrustDirection !== 0 && totalThrust > 0) {
          // Apply thrust (forward or reverse)
          const thrustAngle = thrustDirection > 0 ? ship.rotation : ship.rotation + Math.PI;
          ship.velocity.x += Math.cos(thrustAngle) * totalThrust * this.debugSettings.thrustMultiplier * dt;
          ship.velocity.y += Math.sin(thrustAngle) * totalThrust * this.debugSettings.thrustMultiplier * dt;
        }
        
        // Add random lateral movement for more dynamic combat
        // Apply perpendicular thrust occasionally
        if (!ship.strafeTimer) ship.strafeTimer = 0;
        ship.strafeTimer += dt;
        
        if (ship.strafeTimer > 2) { // Change strafe direction every 2 seconds
          ship.strafeDirection = (Math.random() - 0.5) * 2; // -1 to 1
          ship.strafeTimer = 0;
        }
        
        if (ship.strafeDirection && totalThrust > 0) {
          // Apply lateral thrust perpendicular to facing direction
          const perpAngle = ship.rotation + Math.PI / 2;
          const strafeStrength = 0.3; // 30% of forward thrust
          ship.velocity.x += Math.cos(perpAngle) * ship.strafeDirection * totalThrust * strafeStrength * this.debugSettings.thrustMultiplier * dt;
          ship.velocity.y += Math.sin(perpAngle) * ship.strafeDirection * totalThrust * strafeStrength * this.debugSettings.thrustMultiplier * dt;
        }
        
        // Apply velocity damping (friction/drag)
        const dampingFactor = this.debugSettings?.velocityDamping || 0.98;
        ship.velocity.x *= dampingFactor;
        ship.velocity.y *= dampingFactor;
        
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
      
      if (proj.type === 'ballistic') {
        // Check point defense intercept for ballistics
        const enemyShip = proj.owner === this.playerShip ? this.enemyShip : this.playerShip;
        const pdModules = enemyShip.modules.filter(m => m instanceof PointDefenseModule);
        
        for (const pd of pdModules) {
          pd.tryIntercept(proj);
        }
      }
      
      if (proj.type === 'missile') {
        // Check point defense intercept for missiles
        const enemyShip = proj.owner === this.playerShip ? this.enemyShip : this.playerShip;
        const pdModules = enemyShip.modules.filter(m => m instanceof PointDefenseModule);
        
        for (const pd of pdModules) {
          pd.tryIntercept(proj);
        }
        
        // Use scaled time for all missile behavior
        proj.lifetime += dt;
        proj.fuelRemaining -= dt;
        
        // Accelerate to max speed
        if (proj.currentSpeed < proj.maxSpeed) {
          proj.currentSpeed = Math.min(proj.maxSpeed, proj.currentSpeed + proj.acceleration * dt);
        }
        
        const target = proj.target;
        
        // Delay tracking to create arc
        const trackingDelay = this.debugSettings?.missileTrackingDelay || 0.5;
        
        // Tracking only works after delay and while fuel remains
        if (proj.lifetime > trackingDelay && proj.fuelRemaining > 0 && target && target.alive) {
          const angleToTarget = Phaser.Math.Angle.Between(proj.x, proj.y, target.worldPos.x, target.worldPos.y);
          // Turn rate scaled by dt for consistent trajectory
          const baseTurnRate = this.debugSettings?.missileTurnRate || 0.05;
          const turnRate = baseTurnRate * (dt / 0.016); // Normalize to 60fps
          proj.rotation = Phaser.Math.Angle.RotateTo(proj.rotation, angleToTarget, turnRate);
        }
        
        // Move forward with missile thrust + inherited ship velocity
        const thrustX = Math.cos(proj.rotation) * proj.currentSpeed * dt;
        const thrustY = Math.sin(proj.rotation) * proj.currentSpeed * dt;
        const inheritedX = (proj.inheritedVelocity?.x || 0) * dt;
        const inheritedY = (proj.inheritedVelocity?.y || 0) * dt;
        
        proj.x += thrustX + inheritedX;
        proj.y += thrustY + inheritedY;
        proj.sprite.setPosition(proj.x, proj.y);
        proj.sprite.setRotation(proj.rotation + Math.PI / 2); // Image points up, rotate 90° right
        
        // Emit smoke at current position (particles stay in world space)
        if (proj.emitter) {
          const emitRate = proj.emitRate || 1;
          for (let i = 0; i < emitRate; i++) {
            proj.emitter.emitParticleAt(proj.x, proj.y);
          }
        }
        
        // Check collision or lifetime expiry
        const targetShip = proj.owner === this.playerShip ? this.enemyShip : this.playerShip;
        const hit = this.checkMissileCollision(proj, targetShip);
        
        if (hit || proj.lifetime > proj.maxLifetime) {
          proj.sprite.destroy();
          if (proj.emitter) {
            proj.emitter.stop();
            this.time.delayedCall(1000, () => proj.emitter.destroy());
          }
          return false;
        }
      }
      
      return true;
    });
  }

  updateLaserBeams() {
    if (!this.activeBeams) return;
    
    this.activeBeams = this.activeBeams.filter(beamData => {
      const { beam, sourceModule, targetModule, targetShip, damageInterval } = beamData;
      
      // If source module destroyed, stop beam immediately
      if (!sourceModule.alive) {
        beam.destroy();
        if (damageInterval) damageInterval.remove();
        return false;
      }
      
      // If current target destroyed, find nearest module in range
      if (!targetModule.alive) {
        const angle = sourceModule.ship.rotation;
        const endX = sourceModule.worldPos.x + Math.cos(angle) * sourceModule.range;
        const endY = sourceModule.worldPos.y + Math.sin(angle) * sourceModule.range;
        
        const newTarget = this.raycastToModules(sourceModule.worldPos, { x: endX, y: endY }, targetShip);
        if (newTarget) {
          beamData.targetModule = newTarget;
          console.log(`Laser retargeted to ${newTarget.name}`);
        }
      }
      
      // Update beam position to track moving modules
      if (sourceModule.worldPos && beamData.targetModule.worldPos && beamData.targetModule.alive) {
        beam.setTo(
          sourceModule.worldPos.x,
          sourceModule.worldPos.y,
          beamData.targetModule.worldPos.x,
          beamData.targetModule.worldPos.y
        );
      }
      
      return true;
    });
  }

  updatePDProjectiles(dt) {
    this.pdProjectiles = this.pdProjectiles.filter(pdProj => {
      pdProj.lifetime += dt;
      
      // Check if target still exists
      if (!pdProj.target || pdProj.target.destroyed) {
        pdProj.sprite.destroy();
        return false;
      }
      
      // Home towards target
      const angleToTarget = Phaser.Math.Angle.Between(
        pdProj.x, pdProj.y,
        pdProj.target.x, pdProj.target.y
      );
      
      const vx = Math.cos(angleToTarget) * pdProj.speed * dt;
      const vy = Math.sin(angleToTarget) * pdProj.speed * dt;
      
      pdProj.x += vx;
      pdProj.y += vy;
      pdProj.sprite.setPosition(pdProj.x, pdProj.y);
      
      // Update rotation to face target
      const pdConfig = this.visualConfig?.projectiles?.point_defense || { rotationOffset: 1.5708 };
      pdProj.sprite.setRotation(angleToTarget + pdConfig.rotationOffset);
      
      // Check if hit target
      const dist = Phaser.Math.Distance.Between(
        pdProj.x, pdProj.y,
        pdProj.target.x, pdProj.target.y
      );
      
      if (dist < 0.5) {
        // Hit! Destroy target projectile
        console.log(`PD interceptor hit ${pdProj.target.type}`);
        if (pdProj.target.sprite) pdProj.target.sprite.destroy();
        pdProj.target.destroyed = true;
        pdProj.sprite.destroy();
        return false;
      }
      
      // Timeout
      if (pdProj.lifetime > pdProj.maxLifetime) {
        console.log('PD interceptor missed');
        pdProj.sprite.destroy();
        return false;
      }
      
      return true;
    });
    
    // Remove destroyed projectiles from main array
    this.projectiles = this.projectiles.filter(p => !p.destroyed);
  }

  checkBallisticCollision(projectile, targetShip) {
    // Check shields first (ballistics blocked by shields)
    const shields = targetShip.modules.filter(m => m.constructor.name === 'ShieldModule' && m.isShieldUp());
    for (const shield of shields) {
      if (shield.isPointInShield(projectile.x, projectile.y)) {
        // Shield blocks projectile
        let damage = projectile.baseDamage;
        damage = damage - shield.armor;
        damage = Math.max(1, damage);
        
        shield.takeDamage(damage);
        console.log(`Shield blocked ballistic: ${damage.toFixed(1)} dmg, shield: ${shield.currentShield.toFixed(1)}/${shield.shieldStrength}`);
        return true; // Projectile destroyed
      }
    }
    
    const modules = targetShip.modules.filter(m => m.alive);
    
    // Sort modules by distance from projectile (check closest first)
    const sortedModules = modules.sort((a, b) => {
      const distA = Phaser.Math.Distance.Between(projectile.x, projectile.y, a.worldPos.x, a.worldPos.y);
      const distB = Phaser.Math.Distance.Between(projectile.x, projectile.y, b.worldPos.x, b.worldPos.y);
      return distA - distB;
    });
    
    // Track penetration for piercing weapons
    projectile.penetratedModules = projectile.penetratedModules || 0;
    const maxPenetration = projectile.ricochetFactor || 0;
    
    for (const module of sortedModules) {
      const bounds = new Phaser.Geom.Rectangle(
        module.worldPos.x - (module.size.w * CELL_SIZE) / 2,
        module.worldPos.y - (module.size.h * CELL_SIZE) / 2,
        module.size.w * CELL_SIZE,
        module.size.h * CELL_SIZE
      );
      
      if (Phaser.Geom.Rectangle.Contains(bounds, projectile.x, projectile.y)) {
        // Calculate damage with penetration formula from wiki
        let damage = projectile.baseDamage;
        
        // For subsequent modules (piercing)
        if (projectile.penetratedModules > 0) {
          // Wiki formula: Dmg(Cn) = (Dmg(Cn-1) × Pen × (1-AntiPen)) - Armor(Cn)
          // Pen from ricochetPower, AntiPen from damageDropoff
          const pen = (projectile.ricochetPower || 0) / 200; // Normalize to 0-1
          const antiPen = projectile.damageDropoff || 0;
          damage = damage * pen * (1 - antiPen);
        }
        
        // Apply armor (flat reduction)
        damage = damage - module.armor;
        
        // Damage floor
        damage = Math.max(1, damage);
        
        // Ballistics ignore reflect (wiki: armor only)
        
        console.log(`Ballistic hit ${module.name}: ${damage.toFixed(1)} dmg (armor: ${module.armor}, penetrated: ${projectile.penetratedModules})`);
        
        module.takeDamage(damage);
        this.checkShipDestruction(module.ship);
        
        // Check if projectile can continue (piercing)
        projectile.penetratedModules++;
        
        if (projectile.penetratedModules >= maxPenetration || damage < 1) {
          return true; // Projectile destroyed
        }
        
        // Continue to next module (piercing)
        continue;
      }
    }
    
    return false;
  }
  
  checkMissileCollision(projectile, targetShip) {
    // Check shields first (missiles blocked by shields)
    const shields = targetShip.modules.filter(m => m.constructor.name === 'ShieldModule' && m.isShieldUp());
    for (const shield of shields) {
      if (shield.isPointInShield(projectile.x, projectile.y)) {
        // Shield blocks missile
        let damage = projectile.baseDamage;
        damage = damage - shield.armor;
        damage = Math.max(1, damage);
        
        shield.takeDamage(damage);
        console.log(`Shield blocked missile: ${damage.toFixed(1)} dmg, shield: ${shield.currentShield.toFixed(1)}/${shield.shieldStrength}`);
        return true; // Projectile destroyed
      }
    }
    
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
            // Calculate closest point on module bounds to explosion center
            const moduleBounds = new Phaser.Geom.Rectangle(
              m.worldPos.x - (m.size.w * CELL_SIZE) / 2,
              m.worldPos.y - (m.size.h * CELL_SIZE) / 2,
              m.size.w * CELL_SIZE,
              m.size.h * CELL_SIZE
            );
            
            // Count how many cells of this module are within explosion radius
            let cellsHit = 0;
            const moduleLeft = m.worldPos.x - (m.size.w * CELL_SIZE) / 2;
            const moduleTop = m.worldPos.y - (m.size.h * CELL_SIZE) / 2;
            
            for (let row = 0; row < m.size.h; row++) {
              for (let col = 0; col < m.size.w; col++) {
                const cellCenterX = moduleLeft + (col + 0.5) * CELL_SIZE;
                const cellCenterY = moduleTop + (row + 0.5) * CELL_SIZE;
                const cellDist = Phaser.Math.Distance.Between(projectile.x, projectile.y, cellCenterX, cellCenterY);
                
                if (cellDist <= projectile.explosionRadius) {
                  cellsHit++;
                }
              }
            }
            
            if (cellsHit > 0) {
              // Calculate damage per cell hit
              const closestX = Math.max(moduleBounds.left, Math.min(projectile.x, moduleBounds.right));
              const closestY = Math.max(moduleBounds.top, Math.min(projectile.y, moduleBounds.bottom));
              const dist = Phaser.Math.Distance.Between(projectile.x, projectile.y, closestX, closestY);
              const falloff = 1 - (dist / projectile.explosionRadius);
              const damageFactor = this.debugSettings?.missileDamageFactor || 0.1;
              let damagePerCell = projectile.baseDamage * projectile.explosionForce * falloff * damageFactor;
              
              // Apply armor (flat reduction)
              damagePerCell = damagePerCell - m.armor;
              damagePerCell = Math.max(1, damagePerCell);
              
              // Total damage = damage per cell × cells hit
              const totalDamage = damagePerCell * cellsHit;
              
              // Missiles ignore reflect (wiki: missiles not affected by reflect)
              
              m.takeDamage(totalDamage);
              console.log(`Explosion hit ${m.name} (${cellsHit}/${m.size.w * m.size.h} cells) at ${dist.toFixed(1)} units: ${damagePerCell.toFixed(1)}/cell × ${cellsHit} = ${totalDamage.toFixed(1)} total`);
            }
          });
          
          // Visual explosion effect with sprite animation
          const missileScale = this.visualConfig?.explosions?.missile?.scale || 0.5;
          this.createExplosion(projectile.x, projectile.y, missileScale);
        } else {
          // Direct hit damage (no explosion)
          const damageFactor = this.debugSettings?.missileDamageFactor || 0.1;
          let damage = projectile.baseDamage * damageFactor;
          damage = damage - module.armor;
          damage = Math.max(1, damage);
          // No reflect for missiles
          
          module.takeDamage(damage);
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

  createExplosion(x, y, scale = 1) {
    const explosionConfig = this.visualConfig?.effects?.explosion || {};
    const smokeConfig = this.visualConfig?.effects?.smoke || {};
    
    // Create explosion sprite animation
    const explosion = this.add.sprite(x, y, 'explosion');
    explosion.setScale(scale);
    explosion.setDepth(explosionConfig.depth || 12);
    
    // Play explosion animation (14 frames)
    explosion.anims.create({
      key: 'explode',
      frames: this.anims.generateFrameNumbers('explosion', { start: 0, end: 13 }),
      frameRate: explosionConfig.frameRate || 30,
      repeat: 0
    });
    
    explosion.play('explode');
    explosion.once('animationcomplete', () => explosion.destroy());
    
    // Add smoke effect on top
    const smoke = this.add.sprite(x, y, 'smoke');
    smoke.setScale(scale * 0.8);
    smoke.setDepth(smokeConfig.depth || 11);
    smoke.setAlpha(smokeConfig.alpha || 0.7);
    
    // Play smoke animation (25 frames)
    smoke.anims.create({
      key: 'smoke_dissipate',
      frames: this.anims.generateFrameNumbers('smoke', { start: 0, end: 24 }),
      frameRate: smokeConfig.frameRate || 20,
      repeat: 0
    });
    
    smoke.play('smoke_dissipate');
    smoke.once('animationcomplete', () => smoke.destroy());
  }

  updateJunk(dt) {
    if (!this.junkPieces) return;
    
    this.junkPieces = this.junkPieces.filter(junk => {
      junk.lifetime += dt;
      
      // Move junk
      junk.x += junk.velocity.x * dt;
      junk.y += junk.velocity.y * dt;
      junk.sprite.setPosition(junk.x, junk.y);
      
      // Slow down over time
      junk.velocity.x *= 0.99;
      junk.velocity.y *= 0.99;
      
      // Remove if expired
      if (junk.lifetime > junk.maxLifetime || junk.health <= 0) {
        junk.sprite.destroy();
        return false;
      }
      
      return true;
    });
  }
  
  checkJunkCollision(projectile) {
    if (!this.junkPieces) return false;
    
    for (let i = 0; i < this.junkPieces.length; i++) {
      const junk = this.junkPieces[i];
      const dist = Phaser.Math.Distance.Between(projectile.x, projectile.y, junk.x, junk.y);
      
      if (dist < 1) {
        if (projectile.type === 'ballistic') {
          // Ballistic damages junk
          junk.health -= projectile.baseDamage;
          
          // Piercing ballistics lose one penetration level
          if (projectile.ricochetFactor > 0) {
            projectile.ricochetFactor--;
          }
          
          if (junk.health <= 0) {
            junk.sprite.destroy();
            this.junkPieces.splice(i, 1);
          }
          
          console.log(`Junk hit by ballistic: ${junk.health}/15 HP`);
          return true; // Projectile continues (unless junk absorbed it)
        } else if (projectile.type === 'missile') {
          // Missile destroys junk and is destroyed
          junk.health -= projectile.baseDamage;
          if (junk.health <= 0) {
            junk.sprite.destroy();
            this.junkPieces.splice(i, 1);
          }
          console.log(`Junk destroyed missile`);
          return true; // Missile destroyed
        }
      }
    }
    
    return false;
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
      this.lastLogTime = this.time.now;
    }
  }
}
