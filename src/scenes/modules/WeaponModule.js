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
    
    // Get visual config
    const config = this.scene.visualConfig?.modules?.weapon_range || {
      lineColor: 0xff4444,
      lineAlpha: 0.3,
      lineWidth: 0.1,
      fillColor: 0xff4444,
      fillAlpha: 0.1
    };
    this.visualConfig = config;
    
    this.updateVisuals(x, y);
  }
  
  updateVisuals(x, y) {
    if (!this.rangeGraphics) return;
    
    const config = this.visualConfig || {};
    this.rangeGraphics.clear();
    this.rangeGraphics.lineStyle(
      config.lineWidth || 0.1,
      parseInt(config.lineColor) || 0xff4444,
      config.lineAlpha || 0.3
    );
    this.rangeGraphics.fillStyle(
      parseInt(config.fillColor) || 0xff4444,
      config.fillAlpha || 0.1
    );
    
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
    
    const speed = this.scene.debugSettings?.ballisticSpeed || 400;
    
    // Get ballistic visual config by module key, fallback to default
    const moduleKey = this.config.module.key || 'default';
    const ballisticConfigs = this.scene.visualConfig?.projectiles?.ballistic || {};
    const ballisticConfig = ballisticConfigs[moduleKey] || ballisticConfigs.default || {
      sprite: '/images/effects/ballistic-01.png',
      scale: 0.015,
      rotationOffset: 1.5708
    };
    
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
      sprite: null
    };
    
    // Create sprite from config
    const spriteKey = ballisticConfig.sprite.split('/').pop().replace('.png', '');
    projectile.sprite = this.scene.add.image(this.worldPos.x, this.worldPos.y, spriteKey);
    projectile.sprite.setRotation(finalAngle + ballisticConfig.rotationOffset);
    projectile.sprite.setScale(ballisticConfig.scale);
    projectile.sprite.setDepth(5);
    
    this.scene.projectiles.push(projectile);
    console.log('Fired ballistic!');
    return true;
  }
  
  fireLaser(targetShip) {
    const angle = this.ship.rotation;
    const endX = this.worldPos.x + Math.cos(angle) * this.range;
    const endY = this.worldPos.y + Math.sin(angle) * this.range;
    
    // Raycast to find hit (instant hit detection)
    let hitModule = this.scene.raycastToModules(this.worldPos, { x: endX, y: endY }, targetShip);
    
    if (hitModule) {
      // Laser damage = DPS * Duration
      // Apply damage in ticks (60fps)
      const ticksPerSecond = 60;
      const totalTicks = this.laserDuration * ticksPerSecond;
      const totalDamage = this.damage * this.laserDuration;
      const damagePerTick = totalDamage / totalTicks;
      
      // Apply damage over duration with armor/reflect per tick
      let currentTick = 0;
      const damageInterval = this.scene.time.addEvent({
        delay: 1000 / ticksPerSecond,
        repeat: totalTicks - 1,
        callback: () => {
          // Stop if source laser module is destroyed
          if (!this.alive) {
            damageInterval.remove();
            return;
          }
          
          if (hitModule && hitModule.alive) {
            // Lasers ignore armor, only affected by reflect (wiki)
            let tickDamage = damagePerTick * (1 - hitModule.reflect);
            tickDamage = Math.max(1, tickDamage);
            
            hitModule.takeDamage(tickDamage);
            
            // If module destroyed, find next module in line
            if (!hitModule.alive) {
              hitModule = this.scene.raycastToModules(this.worldPos, { x: endX, y: endY }, targetShip);
            }
          }
          
          currentTick++;
          if (currentTick >= totalTicks) {
            this.scene.checkShipDestruction(targetShip);
          }
        }
      });
      
      // Visual beam effect with duration - tracks moving ships
      const moduleKey = this.config.module.key || 'default';
      const laserConfigs = this.scene.visualConfig?.projectiles?.laser || {};
      const laserConfig = laserConfigs[moduleKey] || laserConfigs.default || {
        color: '0xff0000',
        width: 0.1,
        alpha: 0.8
      };
      console.log(`Laser config lookup: key="${moduleKey}", found=${!!laserConfigs[moduleKey]}, config:`, laserConfig);
      const beamColor = parseInt(laserConfig.color);
      const beamWidth = this.scene.debugSettings?.laserBeamWidth || laserConfig.width;
      const beam = this.scene.add.line(0, 0, this.worldPos.x, this.worldPos.y, hitModule.worldPos.x, hitModule.worldPos.y, beamColor);
      beam.setLineWidth(beamWidth);
      beam.setAlpha(laserConfig.alpha);
      beam.setOrigin(0);
      beam.setDepth(10);
      
      // Store beam data for tracking and retargeting
      const beamData = {
        beam: beam,
        sourceModule: this,
        targetModule: hitModule,
        targetShip: targetShip,
        damageInterval: damageInterval,
        startTime: this.scene.time.now,
        duration: this.laserDuration * 1000
      };
      
      // Add to scene's active beams for update tracking
      this.scene.activeBeams = this.scene.activeBeams || [];
      this.scene.activeBeams.push(beamData);
      
      // Clean up after duration
      this.scene.time.delayedCall(this.laserDuration * 1000, () => {
        beam.destroy();
        const index = this.scene.activeBeams.indexOf(beamData);
        if (index > -1) this.scene.activeBeams.splice(index, 1);
      });
      console.log(`Fired laser! DPS: ${this.damage}, Duration: ${this.laserDuration}s, Total: ${totalDamage.toFixed(1)}`);
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
      
      // Launch at angle offset for arced trajectory
      const angleOffset = (this.scene.debugSettings?.missileLaunchAngle || 30) * (Math.PI / 180);
      const launchAngle = this.ship.rotation + angleOffset * (Math.random() > 0.5 ? 1 : -1);
      
      const missile = {
        type: 'missile',
        x: this.worldPos.x,
        y: this.worldPos.y,
        rotation: launchAngle,
        baseDamage: this.damage,
        speed: speed,
        currentSpeed: speed * 0.3, // Start at 30% speed
        maxSpeed: speed,
        acceleration: speed * 2, // Accelerate to max in 0.5s
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
        // Inherit ship velocity for momentum
        inheritedVelocity: {
          x: this.ship.velocity.x,
          y: this.ship.velocity.y
        },
        sprite: null,
        emitter: null
      };
      
      // Get missile visual config by module key, fallback to default
      const moduleKey = this.config.module.key || 'default';
      const missileConfigs = this.scene.visualConfig?.projectiles?.missile || {};
      const missileConfig = missileConfigs[moduleKey] || missileConfigs.default || {
        sprite: '/images/effects/missile-01.png',
        scale: 0.01,
        rotationOffset: 1.5708
      };
      console.log(`Missile config lookup: key="${moduleKey}", found=${!!missileConfigs[moduleKey]}, config:`, missileConfig);
      const spriteKey = missileConfig.sprite.split('/').pop().replace('.png', '');
      missile.sprite = this.scene.add.image(this.worldPos.x, this.worldPos.y, spriteKey);
      missile.sprite.setRotation(launchAngle + missileConfig.rotationOffset);
      missile.sprite.setScale(missileConfig.scale);
      missile.sprite.setDepth(5);
      
      // Create smoke trail particle emitter (manual emission mode)
      const trailConfig = this.scene.visualConfig?.effects?.missile_trail || {};
      missile.emitter = this.scene.add.particles(0, 0, 'smoke', {
        frame: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24],
        lifespan: trailConfig.lifespan || 800,
        speed: trailConfig.speed || 2,
        scale: { start: trailConfig.scaleStart || 0.003, end: trailConfig.scaleEnd || 0.008 },
        alpha: { start: trailConfig.alphaStart || 0.6, end: trailConfig.alphaEnd || 0 },
        frequency: -1,
        blendMode: trailConfig.blendMode || 'ADD'
      });
      missile.emitter.setDepth(trailConfig.depth || 3);
      missile.emitRate = trailConfig.emitRate || 1;
      
      this.scene.projectiles.push(missile);
    }
    
    console.log(`Fired ${this.missileCount} missile(s)!`);
    return true;
  }
}
