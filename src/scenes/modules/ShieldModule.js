import BaseModule from './BaseModule.js';

export default class ShieldModule extends BaseModule {
  constructor(config, ship, scene) {
    super(config, ship, scene);
    
    // Shield stats
    this.shieldRadius = parseFloat(this.data.sr || 10);
    this.shieldStrength = parseInt(this.data.sa || 100);
    this.maxRegeneration = parseInt(this.data.smr || 100);
    this.regenSpeed = parseFloat(this.data.srs || 20);
    this.currentShield = this.shieldStrength;
    this.regenCapacity = this.maxRegeneration;
    this.timeSinceLastHit = 0;
    this.regenDelay = 2; // Start regen after 2 seconds without damage
    
    console.log(`  Shield: radius=${this.shieldRadius}, strength=${this.shieldStrength}, regen=${this.regenSpeed}/s`);
  }
  
  createVisuals(x, y) {
    // Create shield radius visualization
    this.shieldGraphics = this.scene.add.graphics();
    this.shieldGraphics.setDepth(-2);
    
    // Get visual config
    const config = this.scene.visualConfig?.modules?.shield || {
      lineColor: 0x4444ff,
      lineAlpha: 0.5,
      lineWidth: 0.2,
      fillAlpha: 0.2
    };
    this.visualConfig = config;
    
    this.updateVisuals(x, y);
  }
  
  updateVisuals(x, y) {
    if (!this.shieldGraphics) return;
    
    this.shieldGraphics.clear();
    
    // Check debug setting first
    const showShields = this.scene.debugSettings?.showShields !== false;
    
    // Hide shield visual when depleted or debug disabled
    if (this.currentShield <= 0 || !showShields) {
      this.shieldGraphics.setVisible(false);
      return;
    }
    
    this.shieldGraphics.setVisible(true);
    
    // Shield strength determines opacity
    const strength = this.currentShield / this.shieldStrength;
    const config = this.visualConfig || {};
    const fillAlpha = (config.fillAlpha || 0.2) * strength;
    
    this.shieldGraphics.lineStyle(
      config.lineWidth || 0.2,
      parseInt(config.lineColor) || 0x4444ff,
      config.lineAlpha || 0.5
    );
    this.shieldGraphics.fillStyle(
      parseInt(config.lineColor) || 0x4444ff,
      fillAlpha
    );
    
    // Draw shield circle
    this.shieldGraphics.fillCircle(x, y, this.shieldRadius);
    this.shieldGraphics.strokeCircle(x, y, this.shieldRadius);
  }
  
  takeDamage(amount) {
    // Shields absorb damage instead of module health
    if (this.currentShield > 0) {
      this.currentShield -= amount;
      this.timeSinceLastHit = 0;
      
      if (this.currentShield < 0) {
        // Shield broke, excess damage goes to module
        const excessDamage = -this.currentShield;
        this.currentShield = 0;
        super.takeDamage(excessDamage);
      }
      
      // Update visual
      if (this.worldPos) {
        this.updateVisuals(this.localPos.x, this.localPos.y);
      }
      
      return true; // Shield absorbed (at least some) damage
    } else {
      // Shield down, damage goes to module
      super.takeDamage(amount);
      return false;
    }
  }
  
  update(dt) {
    if (!this.alive) return;
    
    this.timeSinceLastHit += dt;
    
    // Regenerate shield after delay
    if (this.timeSinceLastHit >= this.regenDelay && this.currentShield < this.regenCapacity) {
      const regenAmount = this.regenSpeed * dt;
      this.currentShield = Math.min(this.regenCapacity, this.currentShield + regenAmount);
      
      // Update visual
      if (this.worldPos && this.localPos) {
        this.updateVisuals(this.localPos.x, this.localPos.y);
      }
    }
  }
  
  isShieldUp() {
    return this.alive && this.currentShield > 0;
  }
  
  isPointInShield(x, y) {
    if (!this.isShieldUp() || !this.worldPos) return false;
    const dist = Phaser.Math.Distance.Between(x, y, this.worldPos.x, this.worldPos.y);
    return dist <= this.shieldRadius;
  }
}
