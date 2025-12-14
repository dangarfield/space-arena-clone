import BaseModule from './BaseModule.js';

export default class MineLauncherModule extends BaseModule {
  constructor(config, ship, scene) {
    super(config, ship, scene);
    
    // Mine launcher stats
    this.fireRate = parseFloat(this.data.ats || 1);
    this.damage = parseFloat(this.data.dmg || 50);
    this.explosionRadius = parseFloat(this.data.mer || 2);
    this.range = parseFloat(this.data.rng || 50);
    this.cooldown = 0;
    
    console.log(`  MineLauncher: rate=${this.fireRate}, damage=${this.damage}, radius=${this.explosionRadius}`);
  }
  
  update(dt) {
    if (!this.alive || this.powered === false) return;
    
    // Check if weapons are enabled
    if (!this.scene.debugSettings?.enableWeapons) return;
    
    if (this.cooldown > 0) {
      this.cooldown -= dt;
    } else {
      this.launchMine();
      this.cooldown = 1 / this.fireRate;
    }
  }
  
  launchMine() {
    // Get mine config
    const mineConfigs = this.scene.visualConfig?.projectiles?.mine || {};
    const mineConfig = mineConfigs.default || {
      sprite: '/images/effects/missile-01.png',
      scale: 0.008,
      rotationOffset: 0
    };
    
    // Launch in random direction (360 degrees)
    const angle = Math.random() * Math.PI * 2;
    
    // Randomize initial speed (±40%)
    const speedVariation = 0.6 + Math.random() * 0.8; // 0.6 to 1.4
    const initialSpeed = 25 * speedVariation;
    
    const delay = Math.random() * 100;
    
    this.scene.time.delayedCall(delay, () => {
      if (!this.alive) return;
      
      const mine = {
        type: 'mine',
        x: this.worldPos.x,
        y: this.worldPos.y,
        health: 15,
        maxHealth: 15,
        velocity: {
          x: Math.cos(angle) * initialSpeed,
          y: Math.sin(angle) * initialSpeed
        },
        deceleration: 0.93, // Slow down faster than junk
        damage: this.damage,
        explosionRadius: this.explosionRadius,
        lifetime: 0,
        maxLifetime: mineConfig.maxLifetime || 10,
        owner: this.ship,
        sprite: null
      };
      
      // Create sprite from config
      const spriteKey = mineConfig.sprite.split('/').pop().replace('.png', '');
      mine.sprite = this.scene.add.image(this.worldPos.x, this.worldPos.y, spriteKey);
      mine.sprite.setRotation(Math.random() * Math.PI * 2); // Random rotation
      mine.sprite.setScale(mineConfig.scale);
      mine.sprite.setDepth(3);
      
      // Store rotation speed for spinning
      mine.rotationSpeed = (Math.random() - 0.5) * 2; // -1 to 1 rad/sec
      
      this.scene.mines = this.scene.mines || [];
      this.scene.mines.push(mine);
    });
  }
}
