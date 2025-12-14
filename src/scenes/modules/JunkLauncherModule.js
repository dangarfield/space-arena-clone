import BaseModule from './BaseModule.js';

export default class JunkLauncherModule extends BaseModule {
  constructor(config, ship, scene) {
    super(config, ship, scene);
    
    // Junk launcher stats
    this.fireRate = parseFloat(this.data.ats || 1);
    this.range = parseFloat(this.data.rng || 30);
    this.fireCone = parseFloat(this.data.fc || 180);
    this.cooldown = 0;
    
    console.log(`  JunkLauncher: rate=${this.fireRate}, range=${this.range}, cone=${this.fireCone}°`);
  }
  
  createVisuals(x, y) {
    // Create firing cone and range visualization
    this.rangeGraphics = this.scene.add.graphics();
    this.rangeGraphics.setDepth(-2);
    
    // Get visual config
    const config = this.scene.visualConfig?.modules?.weapon_range || {};
    this.visualConfig = config;
    
    this.updateVisuals(x, y);
  }
  
  updateVisuals(x, y) {
    if (!this.rangeGraphics) return;
    
    this.rangeGraphics.clear();
    
    // Hide firing cone when destroyed or unpowered
    if (!this.alive || this.powered === false) {
      this.rangeGraphics.setVisible(false);
      return;
    }
    
    this.rangeGraphics.setVisible(true);
    
    const config = this.visualConfig || {};
    this.rangeGraphics.lineStyle(
      config.lineWidth || 0.1,
      parseInt(config.lineColor) || 0xff4444,
      config.lineAlpha || 0.3
    );
    this.rangeGraphics.fillStyle(
      parseInt(config.fillColor) || 0xff4444,
      config.fillAlpha || 0.1
    );
    
    // Draw firing cone arc
    const coneRad = (this.fireCone * Math.PI) / 180;
    const startAngle = -Math.PI / 2 - coneRad / 2;
    const endAngle = -Math.PI / 2 + coneRad / 2;
    
    this.rangeGraphics.beginPath();
    this.rangeGraphics.moveTo(x, y);
    this.rangeGraphics.arc(x, y, this.range, startAngle, endAngle, false);
    this.rangeGraphics.closePath();
    this.rangeGraphics.fillPath();
    this.rangeGraphics.strokePath();
  }
  
  update(dt, enemyShip) {
    if (!this.alive || this.powered === false) return;
    
    // Check if weapons are enabled
    if (!this.scene.debugSettings?.enableWeapons) return;
    
    if (this.cooldown > 0) {
      this.cooldown -= dt;
    } else if (enemyShip) {
      // Check if enemy is in range
      const distance = Phaser.Math.Distance.Between(
        this.worldPos.x, this.worldPos.y,
        enemyShip.pos.x, enemyShip.pos.y
      );
      
      if (distance <= this.range) {
        this.launchJunk(enemyShip);
        this.cooldown = 1 / this.fireRate;
      }
    }
  }
  
  launchJunk(enemyShip) {
    // Get junk config
    const junkConfig = this.scene.visualConfig?.projectiles?.junk || {
      color: '0x888888',
      size: 0.5,
      alpha: 0.6,
      pellets: 8,
      spread: 30
    };
    
    const pelletCount = junkConfig.pellets || 8;
    
    // Use shot spread from module data (ss field)
    const spreadRad = this.data.ss ? (this.data.ss * (Math.PI / 180)) : 0.17; // ~10 degrees default
    
    // Aim at enemy center
    const angleToTarget = Phaser.Math.Angle.Between(
      this.worldPos.x, this.worldPos.y,
      enemyShip.pos.x, enemyShip.pos.y
    );
    
    const color = typeof junkConfig.color === 'string' ? 
      parseInt(junkConfig.color.replace('0x', ''), 16) : junkConfig.color;
    
    // Launch junk pieces with staggered timing (spread over 200ms)
    for (let i = 0; i < pelletCount; i++) {
      const delay = Math.random() * 200; // Random delay 0-200ms
      
      this.scene.time.delayedCall(delay, () => {
        if (!this.alive) return; // Don't fire if launcher destroyed
        
        const finalAngle = angleToTarget + (Math.random() - 0.5) * spreadRad;
        
        // Randomize initial speed (±30%)
        const speedVariation = 0.7 + Math.random() * 0.6; // 0.7 to 1.3
        const initialSpeed = 30 * speedVariation;
        
        // Create sprite from spritesheet or fallback to rectangle
        let sprite;
        if (junkConfig.sprite && junkConfig.frames) {
          // Pick random frame from spritesheet
          const randomFrame = Math.floor(Math.random() * junkConfig.frames);
          sprite = this.scene.add.sprite(this.worldPos.x, this.worldPos.y, 'junk-sheet', randomFrame);
          sprite.setScale(junkConfig.scale || 0.005);
        } else {
          // Fallback to colored rectangle
          sprite = this.scene.add.rectangle(
            this.worldPos.x,
            this.worldPos.y,
            junkConfig.size || 0.5, 
            junkConfig.size || 0.5, 
            color
          );
        }
        
        const junk = {
          type: 'junk',
          x: this.worldPos.x,
          y: this.worldPos.y,
          health: 15,
          maxHealth: 15,
          velocity: {
            x: Math.cos(finalAngle) * initialSpeed,
            y: Math.sin(finalAngle) * initialSpeed
          },
          deceleration: 0.95, // Slow down to 95% each frame
          lifetime: 0,
          maxLifetime: junkConfig.maxLifetime || 10,
          owner: this.ship,
          rotationSpeed: (Math.random() - 0.5) * 3, // -1.5 to 1.5 rad/sec
          sprite: sprite
        };
        
        junk.sprite.setDepth(3);
        junk.sprite.setAlpha(junkConfig.alpha || 0.6);
        junk.sprite.setRotation(Math.random() * Math.PI * 2); // Random initial rotation
        
        this.scene.junkPieces = this.scene.junkPieces || [];
        this.scene.junkPieces.push(junk);
      });
    }
  }
  
  onPowerStateChanged() {
    // Update junk launcher visuals when power state changes
    if (this.localPos) {
      this.updateVisuals(this.localPos.x, this.localPos.y);
    }
  }
}
