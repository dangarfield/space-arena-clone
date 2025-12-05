import BaseModule from './BaseModule.js';

export default class PointDefenseModule extends BaseModule {
  constructor(config, ship, scene) {
    super(config, ship, scene);
    
    // Point defense stats
    this.pdRange = parseFloat(this.data.pdr || 19);
    this.pdFireRate = 5; // 5 rounds per second
    this.missileKillChance = parseFloat(this.data.pdmsc || 0.5);
    this.mineKillChance = parseFloat(this.data.pdmnc || 0.35);
    this.torpedoKillChance = parseFloat(this.data.pdtc || 0.25);
    this.cooldown = 0;
    
    console.log(`  PointDefense: range=${this.pdRange}, missile=${this.missileKillChance}, mine=${this.mineKillChance}, torpedo=${this.torpedoKillChance}`);
  }
  
  createVisuals(x, y) {
    // Create PD radius visualization
    this.pdGraphics = this.scene.add.graphics();
    this.pdGraphics.setDepth(-2);
    
    // Get visual config
    const config = this.scene.visualConfig?.modules?.point_defense || {
      lineColor: 0xffaa00,
      lineAlpha: 0.4,
      lineWidth: 0.2,
      fillColor: 0xffaa00,
      fillAlpha: 0.1
    };
    this.visualConfig = config;
    
    this.updateVisuals(x, y);
  }
  
  updateVisuals(x, y) {
    if (!this.pdGraphics) return;
    
    this.pdGraphics.clear();
    
    // Check debug setting first
    const showShields = this.scene.debugSettings?.showShields !== false;
    
    if (!this.alive || !showShields) {
      this.pdGraphics.setVisible(false);
      return;
    }
    
    this.pdGraphics.setVisible(true);
    
    // Draw PD range circle with config colors
    const config = this.visualConfig || {};
    this.pdGraphics.lineStyle(
      config.lineWidth || 0.2,
      parseInt(config.lineColor) || 0xffaa00,
      config.lineAlpha || 0.4
    );
    this.pdGraphics.fillStyle(
      parseInt(config.fillColor) || 0xffaa00,
      config.fillAlpha || 0.1
    );
    this.pdGraphics.fillCircle(x, y, this.pdRange);
    this.pdGraphics.strokeCircle(x, y, this.pdRange);
  }
  
  update(dt) {
    if (this.cooldown > 0) {
      this.cooldown -= dt;
    }
    
    // Try to target junk and mines
    if (this.canFire() && this.worldPos) {
      this.scanForJunkAndMines();
    }
    
    // Update visuals if position changed
    if (this.localPos && this.pdGraphics) {
      this.updateVisuals(this.localPos.x, this.localPos.y);
    }
  }
  
  scanForJunkAndMines() {
    // Priority: missiles (handled in tryIntercept), then mines, then junk
    
    // Check for enemy mines first
    if (this.scene.mines) {
      for (const mine of this.scene.mines) {
        if (mine.owner === this.ship) continue; // Don't target own mines
        
        const dist = Phaser.Math.Distance.Between(
          this.worldPos.x, this.worldPos.y,
          mine.x, mine.y
        );
        
        if (dist <= this.pdRange) {
          // Fire at mine
          this.fireAtJunkOrMine(mine, 'mine');
          this.cooldown = 1 / this.pdFireRate;
          return;
        }
      }
    }
    
    // Check for enemy junk pieces last
    if (this.scene.junkPieces) {
      for (const junk of this.scene.junkPieces) {
        if (junk.owner === this.ship) continue; // Don't target own junk
        
        const dist = Phaser.Math.Distance.Between(
          this.worldPos.x, this.worldPos.y,
          junk.x, junk.y
        );
        
        if (dist <= this.pdRange) {
          // Fire at junk
          this.fireAtJunkOrMine(junk, 'junk');
          this.cooldown = 1 / this.pdFireRate;
          return;
        }
      }
    }
  }
  
  fireAtJunkOrMine(target, type) {
    // Damage the target directly (PD is very effective against stationary targets)
    const damage = parseFloat(this.data.pdd || 0.1) * 100; // Scale up PD damage
    target.health -= damage;
    
    // Create visual effect
    const pdConfig = this.scene.visualConfig?.projectiles?.point_defense || {};
    const spriteKey = (pdConfig.sprite || '/images/effects/missile-01.png').split('/').pop().replace('.png', '');
    
    const effect = this.scene.add.image(this.worldPos.x, this.worldPos.y, spriteKey);
    effect.setScale(pdConfig.scale || 0.008);
    effect.setDepth(5);
    effect.setTint(0xffaa00);
    
    // Animate to target
    this.scene.tweens.add({
      targets: effect,
      x: target.x,
      y: target.y,
      duration: 100,
      onComplete: () => {
        effect.destroy();
      }
    });
  }
  
  onDestroy() {
    super.onDestroy();
    if (this.pdGraphics) {
      this.pdGraphics.destroy();
    }
  }
  
  canFire() {
    return this.alive && this.cooldown <= 0;
  }
  
  tryIntercept(projectile) {
    if (!this.canFire()) return false;
    if (!this.worldPos) return false;
    
    // Only attempt once per projectile
    if (projectile.pdTargeted) return false;
    
    // Check if projectile is in range
    const dist = Phaser.Math.Distance.Between(
      this.worldPos.x, this.worldPos.y,
      projectile.x, projectile.y
    );
    
    if (dist > this.pdRange) return false;
    
    // Mark as targeted so no other PD tries
    projectile.pdTargeted = true;
    
    // Determine kill chance based on projectile type
    let killChance = 0;
    if (projectile.type === 'missile') {
      // Check if it's a mine or torpedo based on speed/tracking
      if (projectile.speed < 10) {
        killChance = this.mineKillChance;
      } else if (projectile.accuracy < 0.3) {
        killChance = this.torpedoKillChance;
      } else {
        killChance = this.missileKillChance;
      }
    } else if (projectile.type === 'ballistic') {
      killChance = 0.3; // 30% chance to intercept ballistics
    }
    
    if (killChance === 0) return false;
    
    // Roll for intercept
    if (Math.random() < killChance) {
      this.cooldown = 1 / this.pdFireRate;
      this.fireInterceptor(projectile);
      console.log(`PD firing at ${projectile.type} at ${dist.toFixed(1)} units (${(killChance * 100).toFixed(0)}% chance)`);
      return true;
    }
    
    return false;
  }
  
  fireInterceptor(target) {
    // Get PD interceptor visual config
    const pdConfig = this.scene.visualConfig?.projectiles?.point_defense || {
      sprite: '/images/effects/missile-01.png',
      scale: 0.008,
      rotationOffset: 1.5708
    };
    
    // Create PD projectile that homes to target
    const pdProjectile = {
      type: 'pd-interceptor',
      x: this.worldPos.x,
      y: this.worldPos.y,
      target: target,
      speed: pdConfig.speed || 50,
      lifetime: 0,
      maxLifetime: pdConfig.maxLifetime || 2,
      sprite: null
    };
    
    // Create sprite from config
    const spriteKey = pdConfig.sprite.split('/').pop().replace('.png', '');
    pdProjectile.sprite = this.scene.add.image(this.worldPos.x, this.worldPos.y, spriteKey);
    pdProjectile.sprite.setScale(pdConfig.scale);
    pdProjectile.sprite.setDepth(5);
    pdProjectile.sprite.setTint(0xffaa00);
    
    // Add to scene's PD projectiles array
    this.scene.pdProjectiles = this.scene.pdProjectiles || [];
    this.scene.pdProjectiles.push(pdProjectile);
  }
}
