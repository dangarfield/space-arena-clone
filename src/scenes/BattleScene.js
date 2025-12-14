import Phaser from 'phaser';
import ShipFactory from './ShipFactory.js';
import WeaponModule from './modules/WeaponModule.js';
import EngineModule from './modules/EngineModule.js';
import WarpModule from './modules/WarpModule.js';
import AfterburnerModule from './modules/AfterburnerModule.js';
import RepairBayModule from './modules/RepairBayModule.js';
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
    
    // Always create placeholder texture for modules
    this.load.image('module-placeholder', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
    
    // Full asset loading for battle mode
    // Preload starfield background images
    if (this.visualConfig.starfield?.backgroundImages) {
      this.visualConfig.starfield.backgroundImages.forEach((path, index) => {
        this.load.image(`starfield_bg_${index}`, path);
      });
    }
    
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
    
    // Collect mine sprites
    if (this.visualConfig.projectiles.mine) {
      Object.values(this.visualConfig.projectiles.mine).forEach(config => {
        if (config.sprite) spritesToLoad.add(config.sprite);
      });
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
    
    // Load repair effect spritesheet (128x32, 4 frames of 32x32)
    this.load.spritesheet('repair', '/images/effects/repair-01.png', {
      frameWidth: 32,
      frameHeight: 32
    });
    
    // Load power offline effect spritesheet (320x64, 5 frames of 64x64)
    this.load.spritesheet('energy', '/images/effects/energy.png', {
      frameWidth: 64,
      frameHeight: 64
    });
    
    // Load junk spritesheet (736x182, 16 frames of 92x92 in 2 rows)
    this.load.spritesheet('junk-sheet', '/images/effects/junk-01.png', {
      frameWidth: 92,
      frameHeight: 92
    });
  }

  init(data) {
    this.playerConfig = data.playerConfig;
    this.enemyConfig = data.enemyConfig;
    this.props = {
      onBack: data.onBack,
      onVictory: data.onVictory
    };
    
    // Fitting mode configuration
    this.fittingMode = data.fittingMode || false;
    this.onModuleClick = data.onModuleClick;
    this.onCellClick = data.onCellClick;
    this.selectedModule = data.selectedModule;
    this.showFiringCones = data.showFiringCones ?? true;
    this.showShieldRadius = data.showShieldRadius ?? true;
    this.showPDRadius = data.showPDRadius ?? true;
  }

  async create() {
    console.log('BattleScene create() called, fitting mode:', this.fittingMode);
    
    // Arena setup
    this.cameras.main.setBackgroundColor('#0a0a1a');
    
    if (this.fittingMode) {
      // Fitting mode - single ship setup
      await this.createFittingMode();
    } else {
      // Battle mode - dual ship setup
      await this.createBattleMode();
    }
    
    // Create parallax starfield (both modes)
    this.createStarfield();
    
    // Frame counter for periodic logging
    this.frameCount = 0;
    
    // Setup GUI (battle mode only)
    if (!this.fittingMode) {
      this.setupGUI();
    }
  }
  
  async createFittingMode() {
    // Hydrate player config only
    if (!this.playerConfig || !this.playerConfig.shipId) {
      console.error('Invalid player config for fitting mode:', this.playerConfig);
      return;
    }
    
    this.playerConfig = await hydrateShipConfig(this.playerConfig);
    
    // Create single ship at center
    this.playerShip = ShipFactory.createBattleShip(this, this.playerConfig, { x: 0, y: 0 }, 0);
    this.ship = this.playerShip; // Alias for fitting scene compatibility
    
    // Initialize minimal systems for fitting
    this.projectiles = [];
    this.pdProjectiles = [];
    this.activeBeams = [];
    this.effects = [];
    this.junkPieces = [];
    this.mines = [];
    this.battleEnded = false;
    
    // Setup fitting interactions
    this.setupFittingInteractions();
    
    // Center camera on ship and calculate appropriate zoom
    this.cameras.main.centerOn(0, 0);
    
    // Calculate zoom based on ship size and screen dimensions
    const shipData = this.playerConfig.ship;
    const shipWidth = shipData.w || 6;
    const shipHeight = shipData.h || 5;
    
    // Add padding around the ship
    const padding = 4;
    const requiredWidth = shipWidth + padding;
    const requiredHeight = shipHeight + padding;
    
    // Calculate zoom to fit ship with padding
    const zoomX = this.cameras.main.width / requiredWidth;
    const zoomY = this.cameras.main.height / requiredHeight;
    const optimalZoom = Math.min(zoomX, zoomY);
    
    this.cameras.main.setZoom(optimalZoom);
  }
  
  async createBattleMode() {
    // Validate configs
    if (!this.playerConfig || !this.playerConfig.shipId || !this.playerConfig.modules) {
      console.error('Invalid player config format. Expected {shipId, modules}:', this.playerConfig);
      return;
    }
    
    if (!this.enemyConfig || !this.enemyConfig.shipId || !this.enemyConfig.modules) {
      console.error('Invalid enemy config format. Expected {shipId, modules}:', this.enemyConfig);
      return;
    }
    
    // Hydrate both configs
    this.playerConfig = await hydrateShipConfig(this.playerConfig);
    this.enemyConfig = await hydrateShipConfig(this.enemyConfig);
    
    // Create ships - player pointing right, enemy pointing left (facing each other)
    // Start far apart so they approach each other
    this.playerShip = ShipFactory.createBattleShip(this, this.playerConfig, { x: -50, y: 0 }, 0);
    this.enemyShip = ShipFactory.createBattleShip(this, this.enemyConfig, { x: 50, y: 0 }, Math.PI);
    
    // Initialize systems
    this.projectiles = [];
    this.pdProjectiles = [];
    this.activeBeams = [];
    this.effects = [];
    this.junkPieces = [];
    this.mines = [];
    this.battleEnded = false;
    
    // Direction indicators (added to containers) - point up in local space
    this.playerDirection = this.add.graphics({ lineStyle: { width: 0.3, color: 0x4444ff } });
    this.playerDirection.lineBetween(0, 0, 0, -100); // Point up in local space
    this.playerDirection.setVisible(false); // Start hidden
    this.playerShip.container.add(this.playerDirection);
    
    this.enemyDirection = this.add.graphics({ lineStyle: { width: 0.3, color: 0xff0000 } });
    this.enemyDirection.lineBetween(0, 0, 0, -100); // Point up in local space
    this.enemyDirection.setVisible(false); // Start hidden
    this.enemyShip.container.add(this.enemyDirection);
  }
  
  createStarfield() {
    // Get starfield config
    const config = this.visualConfig?.starfield || {
      layers: [
        { count: 200, tileSize: 1024, sizeMin: 0.3, sizeMax: 0.8, alphaMin: 0.3, alphaMax: 0.6, parallax: 0.1, depth: -100 },
        { count: 100, tileSize: 1024, sizeMin: 0.5, sizeMax: 1.5, alphaMin: 0.5, alphaMax: 0.9, parallax: 0.3, depth: -50 }
      ]
    };
    
    this.starLayers = [];
    
    config.layers.forEach((layerConfig, index) => {
      // Skip layer if show is false
      if (layerConfig.show === false) return;
      
      let textureKey;
      
      // Use background image if specified, otherwise generate stars
      if (layerConfig.useBackgroundImage && config.backgroundImages && config.backgroundImages.length > 0) {
        // Pick a random background image
        const randomIndex = Math.floor(Math.random() * config.backgroundImages.length);
        textureKey = `starfield_bg_${randomIndex}`;
      } else {
        // Create a texture for this layer
        textureKey = `starfield_layer_${index}`;
        const texture = this.textures.createCanvas(textureKey, layerConfig.tileSize, layerConfig.tileSize);
        const ctx = texture.getContext();
        
        // Draw stars on the texture
        for (let i = 0; i < layerConfig.count; i++) {
          const x = Math.random() * layerConfig.tileSize;
          const y = Math.random() * layerConfig.tileSize;
          const size = Math.random() * (layerConfig.sizeMax - layerConfig.sizeMin) + layerConfig.sizeMin;
          const alpha = Math.random() * (layerConfig.alphaMax - layerConfig.alphaMin) + layerConfig.alphaMin;
          
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fill();
        }
        
        texture.refresh();
      }
      
      // Create a tileSprite that covers the entire camera view
      const tileSprite = this.add.tileSprite(
        0, 0,
        this.cameras.main.width * 4,
        this.cameras.main.height * 4,
        textureKey
      );
      tileSprite.setDepth(layerConfig.depth);
      tileSprite.setOrigin(0.5, 0.5);
      tileSprite.setScrollFactor(1); // Follow camera normally, we'll handle parallax via scale
      
      // Apply tile scale if specified (makes tiles larger/smaller)
      const tileScale = layerConfig.tileScale || 1.0;
      tileSprite.setTileScale(tileScale, tileScale);
      
      // Apply color tint if specified
      if (layerConfig.color) {
        const color = typeof layerConfig.color === 'string' ? 
          parseInt(layerConfig.color.replace('0x', ''), 16) : 
          layerConfig.color;
        tileSprite.setTint(color);
      }
      
      // Apply alpha if specified
      if (layerConfig.alpha !== undefined) {
        tileSprite.setAlpha(layerConfig.alpha);
      }
      
      this.starLayers.push({ 
        tileSprite: tileSprite,
        parallaxFactor: layerConfig.parallax,
        baseScale: 1.0 // Store base scale for zoom compensation
      });
    });
  }
  
  setupGUI() {
    this.gui = new GUI({ title: 'Battle Debug' });
    
    this.debugSettings = {
      showPlayerModules: true,
      showEnemyModules: true,
      showStarfield: true,
      showFiringCones: true,
      showDirectionLines: false,
      showShields: true,
      showDebugPanel: false,
      enableEngines: true,
      enableWeapons: true,
      timeScale: 1.0,
      turnMultiplier: 10,
      thrustMultiplier: 1,
      ballisticSpeed: 40,
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
    
    viewFolder.add(this.debugSettings, 'showPlayerModules').name('Player Module Icons').onChange(v => {
      this.playerShip.modules.forEach(m => {
        if (m.sprite) m.sprite.setVisible(v);
      });
    });
    
    viewFolder.add(this.debugSettings, 'showEnemyModules').name('Enemy Module Icons').onChange(v => {
      this.enemyShip.modules.forEach(m => {
        if (m.sprite) m.sprite.setVisible(v);
      });
    });
    
    viewFolder.add(this.debugSettings, 'showStarfield').name('Starfield').onChange(v => {
      if (this.starLayers) {
        this.starLayers.forEach(layer => layer.tileSprite.setVisible(v));
      }
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
    
    viewFolder.add(this.debugSettings, 'showShields').name('Shield/PD Radius').onChange(v => {
      this.playerShip.modules.forEach(m => {
        if (m.shieldGraphics) m.shieldGraphics.setVisible(v);
        if (m.pdGraphics) m.pdGraphics.setVisible(v);
      });
      this.enemyShip.modules.forEach(m => {
        if (m.shieldGraphics) m.shieldGraphics.setVisible(v);
        if (m.pdGraphics) m.pdGraphics.setVisible(v);
      });
    });
    
    viewFolder.add(this.debugSettings, 'showDebugPanel').name('Debug Modules').onChange(v => {
      const debugPanel = document.querySelector('.debug-panel');
      if (debugPanel) {
        debugPanel.style.display = v ? 'block' : 'none';
      }
    });
    
    // Battle Actions folder
    const actionsFolder = this.gui.addFolder('Battle Actions');
    
    actionsFolder.add(this.debugSettings, 'enableEngines').name('Engines');
    actionsFolder.add(this.debugSettings, 'enableWeapons').name('Weapons');
    
    // Battle Variables folder
    const variablesFolder = this.gui.addFolder('Battle Variables');
    
    variablesFolder.add(this.debugSettings, 'timeScale', 0.1, 10, 0.1).name('Time Scale');
    variablesFolder.add(this.debugSettings, 'turnMultiplier', 0, 20, 0.01).name('Turn Speed');
    variablesFolder.add(this.debugSettings, 'thrustMultiplier', 0, 10, 0.01).name('Thrust Speed');
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
    
    // Battle Stats folder (read-only displays)
    const statsFolder = this.gui.addFolder('Battle Stats');
    this.battleStats = {
      battleTime: 0,
      damageMultiplier: 1.0
    };
    statsFolder.add(this.battleStats, 'battleTime').name('Battle Time (s)').listen().disable();
    statsFolder.add(this.battleStats, 'damageMultiplier', 1.0, 5.0).name('Damage Multiplier').listen().disable();
  }



  gridToLocal(col, row, moduleSize, ship) {
    return ShipFactory.gridToLocal(col, row, moduleSize, ship);
  }
  
  gridToWorld(col, row, moduleSize, ship) {
    return ShipFactory.gridToWorld(col, row, moduleSize, ship);
  }

  update(time, delta) {
    let dt = delta / 1000; // Convert to seconds
    
    // Skip battle logic in fitting mode
    if (this.fittingMode) {
      // Update starfield in fitting mode
      if (this.starLayers) {
        const cam = this.cameras.main;
        const centerX = 0; // Ship is at center in fitting mode
        const centerY = 0;
        
        if (!this.initialCameraState) {
          this.initialCameraState = { x: centerX, y: centerY };
        }
        
        const cameraDeltaX = centerX - this.initialCameraState.x;
        const cameraDeltaY = centerY - this.initialCameraState.y;
        
        this.starLayers.forEach(layer => {
          layer.tileSprite.setPosition(centerX, centerY);
          const inverseZoom = 1 / cam.zoom;
          layer.tileSprite.setScale(inverseZoom);
          layer.tileSprite.tilePositionX = cameraDeltaX * layer.parallaxFactor;
          layer.tileSprite.tilePositionY = cameraDeltaY * layer.parallaxFactor;
        });
      }
      return;
    }
    
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
    
    // Track battle time
    if (!this.battleTime) this.battleTime = 0;
    this.battleTime += dt;
    
    // Calculate damage multiplier (starts at 30s, increases 2% per second)
    this.damageMultiplier = 1.0;
    if (this.battleTime > 30) {
      const secondsAfter30 = this.battleTime - 30;
      this.damageMultiplier = 1.0 + (secondsAfter30 * 0.02);
    }
    
    // Update GUI stats
    if (this.battleStats) {
      this.battleStats.battleTime = Math.floor(this.battleTime);
      this.battleStats.damageMultiplier = parseFloat(this.damageMultiplier.toFixed(2));
    }
    
    this.frameCount++;
    
    // Update ship positions and module worldPos FIRST (before AI/combat)
    this.updateShipPosition(this.playerShip, dt);
    this.updateShipPosition(this.enemyShip, dt);
    
    // Apply friction when battle ends
    if (this.battleEnded) {
      const friction = 0.95;
      this.playerShip.velocity.x *= friction;
      this.playerShip.velocity.y *= friction;
      this.playerShip.angularVelocity *= friction;
      this.enemyShip.velocity.x *= friction;
      this.enemyShip.velocity.y *= friction;
      this.enemyShip.angularVelocity *= friction;
    }
    
    // Update afterburners
    this.updateAfterburners(this.playerShip, dt);
    this.updateAfterburners(this.enemyShip, dt);
    
    // Update repair bays
    this.updateRepairBays(this.playerShip, dt);
    this.updateRepairBays(this.enemyShip, dt);
    
    // Update power systems periodically (every 0.5 seconds)
    if (!this.lastPowerUpdate) this.lastPowerUpdate = 0;
    this.lastPowerUpdate += dt;
    if (this.lastPowerUpdate >= 0.5) {
      this.managePowerSystems(this.playerShip);
      this.managePowerSystems(this.enemyShip);
      this.lastPowerUpdate = 0;
    }
    
    // Then update AI and combat (now all worldPos are current)
    if (!this.battleEnded) {
      this.updateShipAI(this.playerShip, this.enemyShip, dt);
      this.updateShipAI(this.enemyShip, this.playerShip, dt);
    }
    
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

  updateShipPosition(ship, dt) {
    // Update container position and rotation
    // Offset container by +90° since visuals point up but Phaser 0° = right
    ship.container.setPosition(ship.pos.x, ship.pos.y);
    ship.container.setRotation(ship.rotation + Math.PI / 2);
    
    // Update all module worldPos for collision detection
    ship.modules.forEach(module => {
      const worldPos = this.gridToWorld(module.col, module.row, module.size, ship);
      module.worldPos = worldPos;
      
      // Debug: log first module's position once
      if (!ship._positionLogged && module === ship.modules[0]) {
        console.log(`Ship at (${ship.pos.x.toFixed(1)}, ${ship.pos.y.toFixed(1)}), first module worldPos: (${worldPos.x.toFixed(1)}, ${worldPos.y.toFixed(1)})`);
        ship._positionLogged = true;
      }
      
      // Pass enemy ship for modules that need targeting (junk launcher, etc)
      const enemy = ship === this.playerShip ? this.enemyShip : this.playerShip;
      module.update(dt, enemy);
    });
  }
  
  updateShipAI(ship, enemyShip, dt) {
    // Warp drive mechanics
    this.updateWarp(ship, enemyShip, dt);
    
    // AI and combat
    this.updateAI(ship, enemyShip, dt);
  }

  updateAfterburners(ship, dt) {
    const afterburners = ship.modules.filter(m => m instanceof AfterburnerModule);
    afterburners.forEach(ab => ab.update(dt));
    
    // AI: Activate afterburner when far from enemy or low on health
    if (!this.battleEnded && afterburners.length > 0) {
      const enemyShip = ship === this.playerShip ? this.enemyShip : this.playerShip;
      const distance = Phaser.Math.Distance.Between(
        ship.pos.x, ship.pos.y,
        enemyShip.pos.x, enemyShip.pos.y
      );
      
      const aliveModules = ship.modules.filter(m => m.alive).length;
      const totalModules = ship.modules.length;
      const healthPercent = aliveModules / totalModules;
      
      // Activate if: far away (>300) OR low health (<30%)
      const shouldActivate = distance > 300 || healthPercent < 0.3;
      
      if (shouldActivate) {
        afterburners.forEach(ab => {
          if (ab.canActivate()) {
            ab.activate();
          }
        });
      }
    }
  }
  
  updateRepairBays(ship, dt) {
    const repairBays = ship.modules.filter(m => m instanceof RepairBayModule && m.alive);
    // Only first 3 repair bays are active (wiki limit)
    const activeRepairBays = repairBays.slice(0, 3);
    activeRepairBays.forEach(rb => rb.update(dt));
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
      const enemyModules = enemyShip.modules.filter(m => m.alive);
      
      weapons.forEach(weapon => {
        if (!weapon.canFire()) return;
        
        // Check if any enemy module is in range AND firing cone
        const targetsInRange = [];
        const targetsInCone = [];
        
        enemyModules.forEach(enemyModule => {
          if (!enemyModule.worldPos) return;
          
          // Check distance from weapon to enemy module
          const distance = Phaser.Math.Distance.Between(
            weapon.worldPos.x, weapon.worldPos.y,
            enemyModule.worldPos.x, enemyModule.worldPos.y
          );
          
          if (distance <= weapon.range) {
            targetsInRange.push({ module: enemyModule, distance });
            
            // Check if enemy module is in firing cone
            const angleToModule = Phaser.Math.Angle.Between(
              weapon.worldPos.x, weapon.worldPos.y,
              enemyModule.worldPos.x, enemyModule.worldPos.y
            );
            
            // Weapon faces ship's direction
            const weaponAngle = ship.rotation;
            const coneHalfAngle = (weapon.fireCone / 2) * (Math.PI / 180);
            
            // Calculate angle difference
            let angleDiff = Phaser.Math.Angle.Wrap(angleToModule - weaponAngle);
            
            // Check if within cone
            if (Math.abs(angleDiff) <= coneHalfAngle) {
              targetsInCone.push({ module: enemyModule, distance, angleDiff: angleDiff * (180 / Math.PI) });
            }
          }
        });
        
        // Debug logging for lasers
        if (weapon.isLaser) {
          console.log(`Laser ${weapon.name}: range=${weapon.range}, checking ${enemyModules.length} enemy modules`);
          console.log(`  Weapon pos: (${weapon.worldPos.x.toFixed(1)}, ${weapon.worldPos.y.toFixed(1)})`);
          
          if (targetsInRange.length > 0) {
            console.log(`  ${targetsInRange.length} targets in range, ${targetsInCone.length} in cone (${weapon.fireCone}°)`);
            console.log(`  Weapon angle: ${(ship.rotation * 180 / Math.PI).toFixed(1)}°, cone half-angle: ${(weapon.fireCone / 2).toFixed(1)}°`);
            
            // Show first few targets
            const samplesToShow = Math.min(3, targetsInRange.length);
            for (let i = 0; i < samplesToShow; i++) {
              const t = targetsInRange[i];
              const angleToModule = Phaser.Math.Angle.Between(
                weapon.worldPos.x, weapon.worldPos.y,
                t.module.worldPos.x, t.module.worldPos.y
              );
              const angleDiff = Phaser.Math.Angle.Wrap(angleToModule - ship.rotation);
              const inCone = Math.abs(angleDiff) <= (weapon.fireCone / 2) * (Math.PI / 180);
              console.log(`  [${i}] ${t.module.name}: pos=(${t.module.worldPos.x.toFixed(1)}, ${t.module.worldPos.y.toFixed(1)}), dist=${t.distance.toFixed(1)}, angleDiff=${(angleDiff * 180 / Math.PI).toFixed(1)}°, inCone=${inCone}`);
            }
          }
        }
        
        if (targetsInCone.length > 0) {
          if (weapon.isLaser) {
            console.log(`  Calling fire() for laser ${weapon.name}`);
          }
          const fired = weapon.fire(enemyShip);
          if (weapon.isLaser) {
            console.log(`  fire() returned: ${fired}`);
          }
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
      
      // Calculate total ship mass from all modules
      const totalMass = ship.modules.reduce((sum, m) => sum + (parseFloat(m.data.m) || 0), 0);
      const effectiveMass = Math.max(totalMass, 1); // Prevent division by zero
      
      // Engines
      if (this.debugSettings.enableEngines) {
        // Calculate distance to enemy
        const distance = Phaser.Math.Distance.Between(
          ship.pos.x, ship.pos.y,
          enemyShip.pos.x, enemyShip.pos.y
        );
        
        // Rotate towards enemy (factor in mass for rotational inertia)
        const shipTurnPower = ship.config.ship.ts || 1;
        if (totalTurn > 0) {
          const angleDiff = Phaser.Math.Angle.Wrap(angleToEnemy - ship.rotation);
          const turnAcceleration = (totalTurn * shipTurnPower) / effectiveMass;
          const turnAmount = angleDiff * turnAcceleration * this.debugSettings.turnMultiplier * dt;
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
        
        if (distance > engagementDistance * 1.2 && angleDiff < Math.PI / 4) {
          thrustDirection = 1; // Too far - thrust forward
        } else if (distance < engagementDistance * 0.8) {
          thrustDirection = -1; // Too close - reverse thrust
        }
        // Moderate deadzone (0.8 to 1.2) for balanced movement
        
        if (thrustDirection !== 0 && totalThrust > 0) {
          // Apply thrust (forward or reverse) - acceleration = thrust / mass
          const acceleration = totalThrust / effectiveMass;
          const thrustAngle = thrustDirection > 0 ? ship.rotation : ship.rotation + Math.PI;
          const thrustStrength = 0.7; // Moderate thrust strength
          const shipThrustMult = ship.thrustMultiplier || 1;
          ship.velocity.x += Math.cos(thrustAngle) * acceleration * thrustStrength * this.debugSettings.thrustMultiplier * shipThrustMult * dt;
          ship.velocity.y += Math.sin(thrustAngle) * acceleration * thrustStrength * this.debugSettings.thrustMultiplier * shipThrustMult * dt;
        }
        
        // Lateral strafing movement
        if (!ship.strafeTimer) ship.strafeTimer = 0;
        ship.strafeTimer += dt;
        
        if (ship.strafeTimer > 2) { // Change strafe direction every 2 seconds
          ship.strafeDirection = (Math.random() - 0.5) * 2; // -1 to 1
          ship.strafeTimer = 0;
        }
        
        if (ship.strafeDirection && totalThrust > 0) {
          // Apply lateral thrust perpendicular to facing direction
          const acceleration = totalThrust / effectiveMass;
          const perpAngle = ship.rotation + Math.PI / 2;
          const strafeStrength = 0.3; // Keep original strafe strength
          const shipThrustMult = ship.thrustMultiplier || 1;
          ship.velocity.x += Math.cos(perpAngle) * ship.strafeDirection * acceleration * strafeStrength * this.debugSettings.thrustMultiplier * shipThrustMult * dt;
          ship.velocity.y += Math.sin(perpAngle) * ship.strafeDirection * acceleration * strafeStrength * this.debugSettings.thrustMultiplier * shipThrustMult * dt;
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
          // Get target position (modules use worldPos, junk/mines use x/y)
          const targetX = target.worldPos ? target.worldPos.x : target.x;
          const targetY = target.worldPos ? target.worldPos.y : target.y;
          const angleToTarget = Phaser.Math.Angle.Between(proj.x, proj.y, targetX, targetY);
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
      
      // Safety check for null objects
      if (!sourceModule || !targetModule || !beam) {
        if (beam) beam.destroy();
        if (damageInterval) damageInterval.remove();
        return false;
      }
      
      // If source module destroyed, stop beam immediately
      if (!sourceModule.alive) {
        beam.destroy();
        if (damageInterval) damageInterval.remove();
        return false;
      }
      
      // Check if target is alive
      let targetAlive = false;
      if (targetModule.alive !== undefined) {
        // Module target
        targetAlive = targetModule.alive;
      } else if (targetModule.type === 'junk' || targetModule.type === 'mine') {
        // Junk/mine - check health directly (they're removed from array on next update)
        targetAlive = targetModule.health > 0;
      }
      
      // If current target destroyed or no target, hide beam by setting it to zero length
      if (!targetModule || !targetAlive) {
        // Set beam to zero length to hide it
        if (sourceModule.worldPos) {
          beam.setTo(
            sourceModule.worldPos.x,
            sourceModule.worldPos.y,
            sourceModule.worldPos.x,
            sourceModule.worldPos.y
          );
        }
        beam.setVisible(false);
        // Beam will be cleaned up by duration timer
        return true;
      }
      
      // Update beam position to track moving targets
      beam.setVisible(true);
      const targetPos = targetModule.worldPos || { x: targetModule.x, y: targetModule.y };
      
      if (sourceModule.worldPos && targetPos) {
        beam.setTo(
          sourceModule.worldPos.x,
          sourceModule.worldPos.y,
          targetPos.x,
          targetPos.y
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
        let damage = projectile.baseDamage * this.damageMultiplier;
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
    
    // Max penetration: rf / 4
    const rf = projectile.ricochetFactor || 0;
    const rp = projectile.ricochetPower || 0;
    const maxPenetration = Math.ceil(rf / 4);
    
    for (const module of sortedModules) {
      const bounds = new Phaser.Geom.Rectangle(
        module.worldPos.x - (module.size.w * CELL_SIZE) / 2,
        module.worldPos.y - (module.size.h * CELL_SIZE) / 2,
        module.size.w * CELL_SIZE,
        module.size.h * CELL_SIZE
      );
      
      if (Phaser.Geom.Rectangle.Contains(bounds, projectile.x, projectile.y)) {
        // Calculate base damage
        let damage = projectile.baseDamage * this.damageMultiplier;
        
        // For subsequent modules (after penetrating first)
        if (projectile.penetratedModules > 0) {
          // Apply damage multiplier: Math.max(0.25, ddo)
          const damageMultiplier = Math.max(0.25, projectile.damageDropoff || 0);
          damage = damage * damageMultiplier;
        }
        
        // Apply armor (flat reduction)
        damage = damage - module.armor;
        
        // Damage floor
        damage = Math.max(1, damage);
        
        // Ballistics ignore reflect (wiki: armor only)
        
        console.log(`Ballistic hit ${module.name}: ${damage.toFixed(1)} dmg (armor: ${module.armor}, penetrated: ${projectile.penetratedModules}/${maxPenetration})`);
        
        module.takeDamage(damage);
        this.checkShipDestruction(module.ship);
        
        // Check if projectile can continue (piercing)
        projectile.penetratedModules++;
        
        // Penetration chance: rp/ip
        const ip = projectile.impactPower || 1;
        const penetrationChance = Math.min(1, rp / ip); // Cap at 100%
        const willPenetrate = Math.random() < penetrationChance;
        
        if (projectile.penetratedModules >= maxPenetration || !willPenetrate) {
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
        let damage = projectile.baseDamage * this.damageMultiplier;
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
              // Calculate damage - module takes damage once regardless of cells hit (wiki rule)
              const closestX = Math.max(moduleBounds.left, Math.min(projectile.x, moduleBounds.right));
              const closestY = Math.max(moduleBounds.top, Math.min(projectile.y, moduleBounds.bottom));
              const dist = Phaser.Math.Distance.Between(projectile.x, projectile.y, closestX, closestY);
              const falloff = 1 - (dist / projectile.explosionRadius);
              const damageFactor = this.debugSettings?.missileDamageFactor || 0.1;
              let damage = projectile.baseDamage * projectile.explosionForce * falloff * damageFactor * this.damageMultiplier;
              
              // Future: multiply by surrounding module damage multiplier (currently 1.0)
              const surroundingDamageMultiplier = 1.0;
              damage = damage * surroundingDamageMultiplier;
              
              // Apply armor (flat reduction)
              damage = damage - m.armor;
              damage = Math.max(1, damage);
              
              // Missiles ignore reflect (wiki: missiles not affected by reflect)
              
              m.takeDamage(damage);
              console.log(`Explosion hit ${m.name} (${cellsHit}/${m.size.w * m.size.h} cells) at ${dist.toFixed(1)} units: ${damage.toFixed(1)} damage (module takes damage once)`);
            }
          });
          
          // Visual explosion effect with sprite animation
          const missileScale = this.visualConfig?.explosions?.missile?.scale || 0.5;
          this.createExplosion(projectile.x, projectile.y, missileScale);
        } else {
          // Direct hit damage (no explosion)
          const damageFactor = this.debugSettings?.missileDamageFactor || 0.1;
          let damage = projectile.baseDamage * damageFactor * this.damageMultiplier;
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
    // Don't check if battle already ended
    if (this.battleEnded) return;
    
    const aliveWeapons = ship.modules.filter(m => m instanceof WeaponModule && m.alive);
    const aliveEngines = ship.modules.filter(m => (m.category & 64) && m.alive);
    
    // Ship is destroyed if it has no weapons OR no engines (can't fight or move)
    if (aliveWeapons.length === 0 || aliveEngines.length === 0) {
      ship.destroyed = true;
      this.battleEnded = true;
      
      const isPlayer = ship === this.playerShip;
      const playerWon = !isPlayer;
      
      // Call victory callback
      if (this.props.onVictory) {
        this.props.onVictory(playerWon);
      }
    }
  }
  
  managePowerSystems(ship) {
    // Calculate current power generation and consumption
    let powerGeneration = 0;
    let powerConsumption = 0;
    
    ship.modules.forEach(module => {
      if (!module.alive) return;
      
      const moduleData = module.data;
      powerGeneration += moduleData.pg || 0;
      powerConsumption += moduleData.pu || 0;
    });
    
    const netPower = powerGeneration - powerConsumption;
    console.log(`Ship power: ${powerGeneration} generation - ${powerConsumption} consumption = ${netPower} net`);
    
    // If power is sufficient, ensure all modules are powered
    if (netPower >= 0) {
      ship.modules.forEach(module => {
        if (module.alive) {
          module.powered = true;
        }
      });
      return;
    }
    
    // Power deficit - need to shut down some modules
    const powerDeficit = Math.abs(netPower);
    console.log(`Power deficit: ${powerDeficit} - shutting down modules`);
    
    // Get modules that consume power, sorted by priority (lowest priority shut down first)
    const powerConsumers = ship.modules.filter(m => 
      m.alive && (m.data.pu || 0) > 0
    ).sort((a, b) => this.getModulePriority(b) - this.getModulePriority(a));
    
    // Shut down modules until power is balanced
    let remainingDeficit = powerDeficit;
    powerConsumers.forEach(module => {
      const wasPowered = module.powered;
      
      if (remainingDeficit <= 0) {
        // Sufficient power - ensure module is powered
        module.powered = true;
      } else {
        const modulePower = module.data.pu || 0;
        if (modulePower <= remainingDeficit) {
          module.powered = false;
          remainingDeficit -= modulePower;
          console.log(`Shutting down ${module.name} (saves ${modulePower} power)`);
        } else {
          module.powered = true;
        }
      }
      
      // Update visuals if power state changed
      if (wasPowered !== module.powered) {
        module.updatePowerOverlay();
        if (module.onPowerStateChanged) {
          module.onPowerStateChanged();
        }
      }
    });
    
    // Ensure all other modules are marked as powered
    ship.modules.forEach(module => {
      if (module.alive && !powerConsumers.includes(module)) {
        const wasPowered = module.powered;
        module.powered = true;
        // Update visuals if power state changed
        if (wasPowered === false) {
          module.updatePowerOverlay();
          if (module.onPowerStateChanged) {
            module.onPowerStateChanged();
          }
        }
      }
    });
    
    // Update visuals for modules that had their power state changed
    powerConsumers.forEach(module => {
      const wasPowered = module.powered;
      if (wasPowered !== module.powered) {
        module.updateHealthCell();
      }
    });
  }
  
  getModulePriority(module) {
    // Priority system: higher number = higher priority (kept online longer)
    // Engines: highest priority (need to move)
    if (module.category & 64) return 100;
    
    // Weapons: high priority (need to fight)
    if (module.category & 1 || module.category & 2 || module.category & 4) return 80;
    
    // Shields: medium-high priority (defense)
    if (module.category & 16) return 60;
    
    // Point Defense: medium priority (defensive)
    if (module.category & 32) return 50;
    
    // Support systems: lower priority
    if (module.category & 256) return 30;
    
    // Everything else: lowest priority
    return 10;
  }

  createExplosion(x, y, scale = 1, smokeOnly = false) {
    const explosionConfig = this.visualConfig?.effects?.explosion || {};
    const smokeConfig = this.visualConfig?.effects?.smoke || {};
    
    // Create explosion sprite animation (unless smoke-only)
    if (!smokeOnly) {
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
    }
    
    // Add smoke effect
    const smoke = this.add.sprite(x, y, 'smoke');
    smoke.setScale(scale * 0.5);
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
      
      // Apply rotation
      if (junk.rotationSpeed) {
        junk.sprite.rotation += junk.rotationSpeed * dt;
      }
      
      // Apply deceleration
      if (junk.deceleration) {
        junk.velocity.x *= junk.deceleration;
        junk.velocity.y *= junk.deceleration;
      }
      
      // Remove if expired or destroyed
      if (junk.lifetime > junk.maxLifetime || junk.health <= 0) {
        // Create effect based on removal reason
        if (junk.health <= 0) {
          // Destroyed by damage - full explosion
          const explosionScale = this.visualConfig?.explosions?.junk?.scale || 0.03;
          this.createExplosion(junk.x, junk.y, explosionScale);
        } else if (junk.lifetime > junk.maxLifetime) {
          // Expired naturally - smoke effect only
          this.createExplosion(junk.x, junk.y, 0.02, true);
        }
        // Destroy any laser beams targeting this junk
        if (junk.laserBeams) {
          junk.laserBeams.forEach(beam => beam.destroy());
          junk.laserBeams = [];
        }
        junk.sprite.destroy();
        return false;
      }
      
      return true;
    });
    
    // Update mines
    if (!this.mines) return;
    
    this.mines = this.mines.filter(mine => {
      mine.lifetime += dt;
      
      // Move mine
      mine.x += mine.velocity.x * dt;
      mine.y += mine.velocity.y * dt;
      mine.sprite.setPosition(mine.x, mine.y);
      
      // Apply rotation
      if (mine.rotationSpeed) {
        mine.sprite.rotation += mine.rotationSpeed * dt;
      }
      
      // Apply deceleration
      if (mine.deceleration) {
        mine.velocity.x *= mine.deceleration;
        mine.velocity.y *= mine.deceleration;
      }
      
      // Check collision with enemy modules
      const enemyShip = mine.owner === this.playerShip ? this.enemyShip : this.playerShip;
      
      for (const module of enemyShip.modules) {
        if (!module.alive || !module.worldPos) continue;
        
        const distance = Phaser.Math.Distance.Between(mine.x, mine.y, module.worldPos.x, module.worldPos.y);
        
        if (distance < 2) { // Module hit mine (tight collision)
          // Create explosion
          const explosionScale = this.visualConfig?.explosions?.mine?.scale || 0.08;
          this.createExplosion(mine.x, mine.y, explosionScale);
          
          // Damage nearby modules in explosion radius
          enemyShip.modules.forEach(m => {
            if (!m.alive || !m.worldPos) return;
            const modDist = Phaser.Math.Distance.Between(mine.x, mine.y, m.worldPos.x, m.worldPos.y);
            if (modDist < mine.explosionRadius) {
              m.takeDamage(mine.damage);
            }
          });
          
          mine.sprite.destroy();
          return false;
        }
      }
      
      // Remove if expired or destroyed
      if (mine.lifetime > mine.maxLifetime || mine.health <= 0) {
        // Create explosion (both damage and lifetime expiry)
        const explosionScale = this.visualConfig?.explosions?.mine?.scale || 0.08;
        this.createExplosion(mine.x, mine.y, explosionScale);
        
        // Destroy any laser beams targeting this mine
        if (mine.laserBeams) {
          mine.laserBeams.forEach(beam => beam.destroy());
          mine.laserBeams = [];
        }
        mine.sprite.destroy();
        return false;
      }
      
      return true;
    });
  }
  
  checkJunkCollision(projectile) {
    // Check junk pieces
    if (this.junkPieces) {
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
              const explosionScale = this.visualConfig?.explosions?.junk?.scale || 0.03;
              this.createExplosion(junk.x, junk.y, explosionScale);
              junk.sprite.destroy();
              this.junkPieces.splice(i, 1);
            }
            
            return true; // Projectile continues
          } else if (projectile.type === 'missile') {
            // Missile destroys junk and is destroyed
            junk.health -= projectile.baseDamage;
            if (junk.health <= 0) {
              const explosionScale = this.visualConfig?.explosions?.junk?.scale || 0.03;
              this.createExplosion(junk.x, junk.y, explosionScale);
              junk.sprite.destroy();
              this.junkPieces.splice(i, 1);
            }
            return true; // Missile destroyed
          }
        }
      }
    }
    
    // Check mines
    if (this.mines) {
      for (let i = 0; i < this.mines.length; i++) {
        const mine = this.mines[i];
        const dist = Phaser.Math.Distance.Between(projectile.x, projectile.y, mine.x, mine.y);
        
        if (dist < 1) {
          if (projectile.type === 'ballistic') {
            // Ballistic damages mine
            mine.health -= projectile.baseDamage;
            
            if (mine.health <= 0) {
              // Mine explodes
              const explosionScale = this.visualConfig?.explosions?.mine?.scale || 0.08;
              this.createExplosion(mine.x, mine.y, explosionScale);
              mine.sprite.destroy();
              this.mines.splice(i, 1);
            }
            
            return true; // Projectile continues
          } else if (projectile.type === 'missile') {
            // Missile triggers mine explosion
            const explosionScale = this.visualConfig?.explosions?.mine?.scale || 0.08;
            this.createExplosion(mine.x, mine.y, explosionScale);
            mine.sprite.destroy();
            this.mines.splice(i, 1);
            return true; // Missile destroyed
          }
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
    
    // Update starfield parallax with tiling
    if (this.starLayers) {
      // Store initial camera state if not set
      if (!this.initialCameraState) {
        this.initialCameraState = { 
          x: centerX, 
          y: centerY
        };
      }
      
      // Calculate camera movement from initial position
      const cameraDeltaX = centerX - this.initialCameraState.x;
      const cameraDeltaY = centerY - this.initialCameraState.y;
      
      this.starLayers.forEach(layer => {
        // Position at world center (scrollFactor=1 means it follows camera)
        layer.tileSprite.setPosition(centerX, centerY);
        
        // Scale inversely to camera zoom to keep visual size constant
        const inverseZoom = 1 / cam.zoom;
        layer.tileSprite.setScale(inverseZoom);
        
        // Update tile position for parallax effect
        layer.tileSprite.tilePositionX = cameraDeltaX * layer.parallaxFactor;
        layer.tileSprite.tilePositionY = cameraDeltaY * layer.parallaxFactor;
      });
    }
  }
  
  shutdown() {
    // Destroy lil-gui when scene is shut down
    if (this.gui) {
      this.gui.destroy();
      this.gui = null;
    }
  }
  
  // ===== FITTING MODE METHODS =====
  
  setupFittingInteractions() {
    // Make modules interactive for removal
    this.playerShip.modules.forEach(module => {
      if (module.sprite) {
        module.sprite.setInteractive();
        module.sprite.moduleData = { col: module.col, row: module.row };
        module.sprite.moduleRef = module;
      }
    });
    
    // Track if a module was clicked to prevent cell click
    this.moduleClickedThisFrame = false;
    
    // Module clicks take priority
    this.input.on('gameobjectdown', (pointer, gameObject) => {
      if (gameObject.moduleData) {
        this.moduleClickedThisFrame = true;
        this.onModuleClick?.(gameObject.moduleData);
        pointer.event.stopPropagation();
        
        // Reset flag after a short delay
        this.time.delayedCall(10, () => {
          this.moduleClickedThisFrame = false;
        });
      }
    });
    
    // Grid cell clicks for placement
    this.input.on('pointerdown', (pointer) => {
      if (!this.playerShip) return;
      
      // Don't handle cell clicks if a module was just clicked
      if (this.moduleClickedThisFrame) {
        return;
      }
      
      // Check if we clicked on a module sprite
      const objectsAtPointer = this.input.hitTestPointer(pointer);
      if (objectsAtPointer.some(obj => obj.moduleData)) {
        this.hoverCell = null;
        this.drawFittingOverlays();
        return;
      }
      
      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const shipData = this.playerShip.config.ship;
      const gridWidth = shipData.w;
      const gridHeight = shipData.h;
      
      // Convert world to local (relative to ship center)
      const localX = worldPoint.x - this.playerShip.pos.x;
      const localY = worldPoint.y - this.playerShip.pos.y;
      
      // Get display coordinates
      const col = Math.floor(localX + gridWidth / 2);
      const row = Math.floor(localY + gridHeight / 2);
      
      if (col >= 0 && col < gridWidth && row >= 0 && row < gridHeight) {
        this.onCellClick?.(col, row);
        this.hoverCell = null;
        this.drawFittingOverlays();
      }
    });
    
    // Hover preview
    this.input.on('pointermove', (pointer) => {
      if (!this.playerShip || !this.selectedModule) {
        if (this.hoverCell) {
          this.hoverCell = null;
          this.drawFittingOverlays();
        }
        return;
      }
      
      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const shipData = this.playerShip.config.ship;
      const gridWidth = shipData.w;
      const gridHeight = shipData.h;
      
      const localX = worldPoint.x - this.playerShip.pos.x;
      const localY = worldPoint.y - this.playerShip.pos.y;
      
      const col = Math.floor(localX + gridWidth / 2);
      const row = Math.floor(localY + gridHeight / 2);
      
      this.hoverCell = { col, row };
      this.drawFittingOverlays();
    });
    
    // Draw grid FIRST (bottom layer)
    this.drawFittingGrid();
    
    // Set initial visibility and ensure proper depth for existing visuals (created by ShipFactory)
    this.playerShip.modules.forEach(module => {
      // Ensure visual helpers are properly ordered
      if (module.rangeGraphics) {
        module.rangeGraphics.setVisible(this.showFiringCones);
        module.rangeGraphics.setDepth(-5);
      }
      if (module.shieldGraphics) {
        module.shieldGraphics.setVisible(this.showShieldRadius);
        module.shieldGraphics.setDepth(-5);
      }
      if (module.pdGraphics) {
        module.pdGraphics.setVisible(this.showPDRadius);
        module.pdGraphics.setDepth(-5);
      }
      // Ensure module sprites are on top
      if (module.sprite) {
        module.sprite.setDepth(5);
      }
      if (module.healthCell) {
        module.healthCell.setDepth(0);
      }
    });
    
    // Draw overlays LAST (top layer)
    this.drawFittingOverlays();
  }
  
  drawFittingGrid() {
    const shipData = this.playerShip.config.ship;
    const gridWidth = shipData.w;
    const gridHeight = shipData.h;
    
    // Create grid as scene object, not container child, with absolute positioning
    this.gridGraphics = this.add.graphics();
    this.gridGraphics.setDepth(-10); // Very low depth to ensure it's behind everything
    
    // Position relative to ship center
    this.gridGraphics.setPosition(this.playerShip.pos.x, this.playerShip.pos.y);
    
    // Convert g to shape (same as FittingPreviewScene)
    const shape = [];
    for (let row = gridHeight - 1; row >= 0; row--) {
      const rowCells = [];
      for (let col = gridWidth - 1; col >= 0; col--) {
        rowCells.push(shipData.g[row * gridWidth + col]);
      }
      shape.push(rowCells);
    }
    
    // Draw grid cells
    for (let row = 0; row < gridHeight; row++) {
      for (let col = 0; col < gridWidth; col++) {
        const cellType = shape[row][col];
        if (cellType === 0) continue;
        
        const x = (col - gridWidth / 2);
        const y = (row - gridHeight / 2);
        
        const isEngine = cellType === 4 || cellType === 5;
        const color = isEngine ? 0x663300 : 0x003366;
        
        this.gridGraphics.fillStyle(color, 0.3);
        this.gridGraphics.fillRect(x, y, 1, 1);
        this.gridGraphics.lineStyle(0.05, 0x00aaff, 0.5);
        this.gridGraphics.strokeRect(x, y, 1, 1);
      }
    }
  }
  
  drawFittingOverlays() {
    if (!this.playerShip) return;
    
    // Clear existing overlays
    if (this.overlayGraphics) {
      this.overlayGraphics.destroy();
    }
    
    // Create overlays as scene object, not container child
    this.overlayGraphics = this.add.graphics();
    this.overlayGraphics.setDepth(10); // Very high depth to ensure it's on top
    
    // Position relative to ship center
    this.overlayGraphics.setPosition(this.playerShip.pos.x, this.playerShip.pos.y);
    
    // Draw hover preview
    if (this.hoverCell && this.selectedModule) {
      const { col, row } = this.hoverCell;
      const w = this.selectedModule.w || 1;
      const h = this.selectedModule.h || 1;
      
      const shipData = this.playerShip.config.ship;
      const gridWidth = shipData.w;
      const gridHeight = shipData.h;
      
      // Check if over ship
      let overShipCell = false;
      for (let r = row; r < row + h; r++) {
        for (let c = col; c < col + w; c++) {
          if (c >= 0 && c < gridWidth && r >= 0 && r < gridHeight) {
            overShipCell = true;
            break;
          }
        }
        if (overShipCell) break;
      }
      
      if (!overShipCell) return;
      
      const canPlace = this.canPlaceModuleAt(col, row, w, h, (this.selectedModule.category & 64) !== 0);
      const color = canPlace ? 0x00ff00 : 0xff0000;
      
      const x = (col - gridWidth / 2);
      const y = (row - gridHeight / 2);
      
      this.overlayGraphics.fillStyle(color, 0.3);
      this.overlayGraphics.fillRect(x, y, w, h);
      this.overlayGraphics.lineStyle(0.1, color, 1);
      this.overlayGraphics.strokeRect(x, y, w, h);
    }
  }
  
  canPlaceModuleAt(col, row, w, h, isEngine) {
    const shipData = this.playerShip.config.ship;
    const gridWidth = shipData.w;
    const gridHeight = shipData.h;
    
    // Convert g to shape
    const shape = [];
    for (let r = gridHeight - 1; r >= 0; r--) {
      const rowCells = [];
      for (let c = gridWidth - 1; c >= 0; c--) {
        rowCells.push(shipData.g[r * gridWidth + c]);
      }
      shape.push(rowCells);
    }
    
    // Check bounds
    if (col < 0 || row < 0 || col + w > gridWidth || row + h > gridHeight) {
      return false;
    }
    
    // Check cell types and overlaps
    for (let r = row; r < row + h; r++) {
      for (let c = col; c < col + w; c++) {
        const cellType = shape[r][c];
        
        if (cellType === 0) return false;
        
        if (isEngine) {
          if (cellType !== 4 && cellType !== 5) return false;
        } else {
          if (cellType !== 1 && cellType !== 2 && cellType !== 3 && cellType !== 5) return false;
        }
        
        // Check overlaps
        const overlap = this.playerShip.modules.some(m => {
          const mw = m.size.w || 1;
          const mh = m.size.h || 1;
          return !(c >= m.col + mw || c + 1 <= m.col || r >= m.row + mh || r + 1 <= m.row);
        });
        
        if (overlap) return false;
      }
    }
    
    return true;
  }
  
  async updateShipConfig(newConfig) {
    if (!this.fittingMode) return;
    
    // Find differences
    const oldModules = this.playerConfig.modules || [];
    const newModules = newConfig.modules || [];
    
    const toRemove = oldModules.filter(old => 
      !newModules.some(n => n.col === old.col && n.row === old.row && n.moduleId === old.moduleId)
    );
    
    const toAdd = newModules.filter(n =>
      !oldModules.some(old => old.col === n.col && old.row === n.row && old.moduleId === n.moduleId)
    );
    

    
    // Remove modules
    toRemove.forEach(m => this.removeFittingModule(m.col, m.row));
    
    // Add modules
    for (const m of toAdd) {
      await this.addFittingModule(m.moduleId, m.col, m.row);
    }
    
    // Update config
    this.playerConfig = newConfig;
    
    // Redraw overlays
    this.drawFittingOverlays();
  }
  
  async addFittingModule(moduleId, col, row) {
    // Load module data (same as FittingPreviewScene)
    const [modulesData, localization] = await Promise.all([
      fetch('/data/modules.json').then(r => r.json()),
      fetch('/data/module-localisation.json').then(r => r.json())
    ]);
    
    const rawModule = modulesData[moduleId];
    if (!rawModule) return;
    
    const loc = localization.en || {};
    const displayName = loc[rawModule.name] || rawModule.name;
    const imageName = displayName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    
    const category = rawModule.c || 0;
    let type = 'utility', color = 0xffaa00;
    
    if ((category & 1) || (category & 2) || (category & 4)) {
      type = 'weapon';
      color = 0xff4444;
    } else if ((category & 8) || (category & 16)) {
      type = 'defense';
      color = 0x4444ff;
    }
    
    const placement = {
      col,
      row,
      size: { w: rawModule.w, h: rawModule.h },
      type, color,
      module: {
        ...rawModule, // Include all raw module data FIRST
        key: moduleId, // Store module key for visual config lookup
        name: displayName, // Override with localized name
        category,
        image: `/images/modules/${imageName}.webp`,
        stats: {
          Health: String(rawModule.hlt || 0),
          Damage: String(rawModule.dmg || 0),
          Range: String(rawModule.rng || 0),
          Thrust_Power: String(rawModule.ep || 0),
          Turn_Power: String(rawModule.ts || 0)
        }
      }
    };
    
    // Create module using existing factory
    const ModuleFactory = (await import('./modules/ModuleFactory.js')).default;
    const module = ModuleFactory.createModule(placement, this.playerShip, this);
    
    const localPos = ShipFactory.gridToLocal(col, row, { w: rawModule.w, h: rawModule.h }, this.playerShip);
    module.createSprite(localPos.x, localPos.y, 0, 1);
    module.updateLocalPosition(localPos);
    
    if (module.createVisuals) {
      module.createVisuals(localPos.x, localPos.y);
      if (module.rangeGraphics) {
        this.playerShip.container.add(module.rangeGraphics);
        module.rangeGraphics.setDepth(-5); // Visual helpers between grid and modules
        module.rangeGraphics.setVisible(this.showFiringCones);
      }
      if (module.shieldGraphics) {
        this.playerShip.container.add(module.shieldGraphics);
        module.shieldGraphics.setDepth(-5); // Visual helpers between grid and modules
        module.shieldGraphics.setVisible(this.showShieldRadius);
      }
      if (module.pdGraphics) {
        this.playerShip.container.add(module.pdGraphics);
        module.pdGraphics.setDepth(-5); // Visual helpers between grid and modules
        module.pdGraphics.setVisible(this.showPDRadius);
      }
    }
    
    if (module.healthCell) this.playerShip.container.add(module.healthCell);
    if (module.sprite) this.playerShip.container.add(module.sprite);
    
    module.col = col;
    module.row = row;
    
    if (module.sprite) {
      module.sprite.setInteractive();
      module.sprite.moduleData = { col, row };
      module.sprite.moduleRef = module;
    }
    
    this.playerShip.modules.push(module);
    
    // Refresh all module visuals after adding
    this.refreshModuleVisuals();
  }
  
  removeFittingModule(col, row) {
    const moduleIndex = this.playerShip.modules.findIndex(m => m.col === col && m.row === row);
    if (moduleIndex === -1) return;
    
    const module = this.playerShip.modules[moduleIndex];
    
    // Destroy visuals
    if (module.sprite) module.sprite.destroy();
    if (module.healthCell) module.healthCell.destroy();
    if (module.rangeGraphics) module.rangeGraphics.destroy();
    if (module.shieldGraphics) module.shieldGraphics.destroy();
    if (module.pdGraphics) module.pdGraphics.destroy();
    
    this.playerShip.modules.splice(moduleIndex, 1);
    
    // Refresh all module visuals after removing
    this.refreshModuleVisuals();
  }
  
  refreshModuleVisuals() {
    if (!this.fittingMode || !this.playerShip) return;
    
    // Refresh visuals for all remaining modules
    this.playerShip.modules.forEach((module, index) => {
      
      if (module.createVisuals) {
        // Destroy existing visuals first
        if (module.rangeGraphics) {
          module.rangeGraphics.destroy();
          module.rangeGraphics = null;
        }
        if (module.shieldGraphics) {
          module.shieldGraphics.destroy();
          module.shieldGraphics = null;
        }
        if (module.pdGraphics) {
          module.pdGraphics.destroy();
          module.pdGraphics = null;
        }
        
        // Recreate visuals
        const localPos = ShipFactory.gridToLocal(module.col, module.row, module.size, this.playerShip);
        module.createVisuals(localPos.x, localPos.y);
        
        // Add to container and set visibility and depth
        if (module.rangeGraphics) {
          this.playerShip.container.add(module.rangeGraphics);
          module.rangeGraphics.setDepth(-5); // Visual helpers between grid and modules
          module.rangeGraphics.setVisible(this.showFiringCones);
        }
        if (module.shieldGraphics) {
          this.playerShip.container.add(module.shieldGraphics);
          module.shieldGraphics.setDepth(-5); // Visual helpers between grid and modules
          module.shieldGraphics.setVisible(this.showShieldRadius);
        }
        if (module.pdGraphics) {
          this.playerShip.container.add(module.pdGraphics);
          module.pdGraphics.setDepth(-5); // Visual helpers between grid and modules
          module.pdGraphics.setVisible(this.showPDRadius);
        }
      }
    });
    
  }
}
