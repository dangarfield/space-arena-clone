import BaseModule from './BaseModule.js';

export default class WeaponModule extends BaseModule {
  constructor(config, ship, scene) {
    super(config, ship, scene);
    
    // Basic weapon stats
    this.damage = parseInt(this.data.stats?.Damage || this.data.dmg || 10);
    this.range = parseInt(this.data.stats?.Range || this.data.rng || 500);
    this.fireRate = parseFloat(this.data.ats || 1); // attacks per second
    this.fireCone = parseFloat(this.data.fc || 360); // firing arc in degrees
    
    // Weapon type from category flags: 1=Ballistic, 2=Missile, 4=Laser
    this.isBallistic = (this.category & 1) > 0;
    this.isMissile = (this.category & 2) > 0;
    this.isLaser = (this.category & 4) > 0;
    
    // Ballistic-specific stats
    this.impactPower = parseFloat(this.data.ip || 0); // Armor penetration (0-1000)
    this.impactForceMultiplier = parseFloat(this.data.imf || 100) / 100; // Penetration multiplier (0-130)
    this.ricochetPower = parseFloat(this.data.rp || 0); // Penetration depth (0-200)
    this.ricochetFactor = parseFloat(this.data.rf || 0); // Armor layers penetrated (0-15)
    this.damageDropoff = parseFloat(this.data.ddo || 0); // Damage reduction over distance
    this.shotSpread = parseFloat(this.data.ss || 0); // Accuracy/dispersion (0-10)
    
    // Laser-specific stats
    this.laserDuration = parseFloat(this.data.msd || 0.1); // Beam duration in seconds
    
    // Missile-specific stats
    this.missileCount = parseInt(this.data.mc || 1); // Projectiles per shot
    this.missileSpeed = parseFloat(this.data.mspd || 30); // Flight speed
    this.missileAccuracy = parseFloat(this.data.macc || 0.5); // Tracking strength
    this.missileFuel = parseFloat(this.data.mfj || 25); // Tracking duration tiers (25/65/90)
    this.missileLifetime = parseFloat(this.data.mlf || 4.0); // Flight time (constant 4.0s)
    this.missileExplosionRadius = parseFloat(this.data.mer || 0); // AoE damage radius
    this.missileExplosionForce = parseFloat(this.data.mef || 1); // Explosion damage multiplier
    
    // State
    this.cooldownTimer = 0;
    
    console.log(`  Weapon: dmg=${this.damage}, range=${this.range}, rate=${this.fireRate}, type=${this.isBallistic ? 'Ballistic' : this.isMissile ? 'Missile' : 'Laser'}`);
  }
  
  createVisuals(x, y) {
    // Create firing cone and range visualization
    this.rangeGraphics = this.scene.add.graphics();
    this.rangeGraphics.setDepth(-2);
    this.updateVisuals(x, y);
  }
  
  updateVisuals(x, y) {
    if (!this.rangeGraphics) return;
    
    this.rangeGraphics.clear();
    this.rangeGraphics.lineStyle(0.1, 0xff4444, 0.3);
    this.rangeGraphics.fillStyle(0xff4444, 0.1);
    
    // Draw firing cone pointing up (-90°) - container rotation handles direction
    const coneRad = this.fireCone * (Math.PI / 180);
    const startAngle = -Math.PI / 2 - coneRad / 2;
    const endAngle = -Math.PI / 2 + coneRad / 2;
    
    this.rangeGraphics.beginPath();
    this.rangeGraphics.moveTo(x, y);
    this.rangeGraphics.arc(x, y, this.range, startAngle, endAngle, false);
    this.rangeGraphics.closePath();
    this.rangeGraphics.fillPath();
    this.rangeGraphics.strokePath();
  }
  
  update(dt) {
    if (this.cooldownTimer > 0) {
      this.cooldownTimer -= dt;
    }
  }
  
  canFire() {
    return this.alive && this.cooldownTimer <= 0;
  }
  
  fire(targetShip) {
    if (!this.canFire()) return false;
    
    // Reset cooldown
    this.cooldownTimer = this.fireRate > 0 ? 1 / this.fireRate : 1;
    
    // Fire based on type
    if (this.isLaser) {
      return this.fireLaser(targetShip);
    } else if (this.isMissile) {
      return this.fireMissile(targetShip);
    } else {
      return this.fireBallistic(targetShip);
    }
  }
  
  fireBallistic(targetShip) {
    const angle = this.ship.rotation;
    const spreadRad = this.shotSpread * (Math.PI / 180);
    const finalAngle = angle + (Math.random() - 0.5) * spreadRad;
    
    const speed = this.scene.debugSettings?.ballisticSpeed || 40;
    
    const projectile = {
      type: 'ballistic',
      x: this.worldPos.x,
      y: this.worldPos.y,
      rotation: finalAngle,
      velocity: {
        x: Math.cos(finalAngle) * speed,
        y: Math.sin(finalAngle) * speed
      },
      baseDamage: this.damage,
      impactPower: this.impactPower,
      impactForceMultiplier: this.impactForceMultiplier,
      ricochetPower: this.ricochetPower,
      ricochetFactor: this.ricochetFactor,
      damageDropoff: this.damageDropoff,
      travelDistance: 0,
      weapon: this,
      owner: this.ship,
      sprite: this.scene.add.circle(this.worldPos.x, this.worldPos.y, 1, 0xffff00)
    };
    
    this.scene.projectiles.push(projectile);
    console.log('Fired ballistic!');
    return true;
  }
  
  fireLaser(targetShip) {
    const angle = this.ship.rotation;
    const endX = this.worldPos.x + Math.cos(angle) * this.range;
    const endY = this.worldPos.y + Math.sin(angle) * this.range;
    
    // Raycast to find hit (instant hit detection)
    const hitModule = this.scene.raycastToModules(this.worldPos, { x: endX, y: endY }, targetShip);
    
    if (hitModule) {
      // Instant damage - no travel time, no dodging
      hitModule.takeDamage(this.damage);
      
      // Visual beam effect with duration
      const beam = this.scene.add.line(0, 0, this.worldPos.x, this.worldPos.y, hitModule.worldPos.x, hitModule.worldPos.y, 0xff0000);
      beam.setLineWidth(3);
      beam.setOrigin(0);
      beam.setDepth(10);
      
      // Beam persists for laser duration
      this.scene.time.delayedCall(this.laserDuration * 1000, () => beam.destroy());
      console.log(`Fired laser! Duration: ${this.laserDuration}s`);
      return true;
    }
    
    return false;
  }
  
  fireMissile(targetShip) {
    const aliveModules = targetShip.modules.filter(m => m.alive);
    if (aliveModules.length === 0) return false;
    
    const speed = this.scene.debugSettings?.missileSpeed || this.missileSpeed;
    
    // Fire multiple missiles if missileCount > 1
    for (let i = 0; i < this.missileCount; i++) {
      const target = aliveModules[Math.floor(Math.random() * aliveModules.length)];
      
      const missile = {
        type: 'missile',
        x: this.worldPos.x,
        y: this.worldPos.y,
        rotation: this.ship.rotation,
        baseDamage: this.damage,
        speed: speed,
        accuracy: this.missileAccuracy,
        fuel: this.missileFuel,
        maxLifetime: this.missileLifetime,
        explosionRadius: this.missileExplosionRadius,
        explosionForce: this.missileExplosionForce,
        weapon: this,
        owner: this.ship,
        target: target,
        lifetime: 0,
        fuelRemaining: this.missileFuel,
        sprite: this.scene.add.triangle(this.worldPos.x, this.worldPos.y, 0, -1, -0.7, 1, 0.7, 1, 0xff6600)
      };
      
      missile.sprite.setRotation(this.ship.rotation);
      missile.sprite.setDepth(5);
      this.scene.projectiles.push(missile);
    }
    
    console.log(`Fired ${this.missileCount} missile(s)!`);
    return true;
  }
}
