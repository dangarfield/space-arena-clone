import BaseModule from './BaseModule.js';

export default class AfterburnerModule extends BaseModule {
  constructor(config, ship, scene) {
    super(config, ship, scene);
    
    // Afterburner stats
    this.duration = parseFloat(this.data.dur || this.data.dc || 3); // Boost duration
    this.cooldown = parseFloat(this.data.cd || 10); // Cooldown between uses
    this.movementBoost = parseFloat(this.data.mvmb || 2); // Speed multiplier
    this.thrustBoost = parseFloat(this.data.tb || 1.5); // Acceleration multiplier
    
    this.cooldownTimer = 0;
    this.activeTimer = 0;
    this.isActive = false;
    
    console.log(`  Afterburner: duration=${this.duration}s, cooldown=${this.cooldown}s, boost=${this.movementBoost}x`);
  }
  
  update(dt) {
    if (!this.alive) {
      if (this.isActive) {
        this.deactivate();
      }
      return;
    }
    
    if (this.isActive) {
      this.activeTimer -= dt;
      
      if (this.activeTimer <= 0) {
        this.deactivate();
      }
    } else if (this.cooldownTimer > 0) {
      this.cooldownTimer -= dt;
    }
  }
  
  canActivate() {
    return this.alive && !this.isActive && this.cooldownTimer <= 0;
  }
  
  activate() {
    if (!this.canActivate()) return false;
    
    this.isActive = true;
    this.activeTimer = this.duration;
    
    // Apply boost to ship
    this.ship.speedMultiplier = (this.ship.speedMultiplier || 1) * this.movementBoost;
    this.ship.thrustMultiplier = (this.ship.thrustMultiplier || 1) * this.thrustBoost;
    
    // Visual feedback
    if (this.sprite) {
      this.sprite.setTint(0xffaa00);
    }
    
    console.log(`Afterburner activated: ${this.movementBoost}x speed for ${this.duration}s`);
    return true;
  }
  
  deactivate() {
    if (!this.isActive) return;
    
    this.isActive = false;
    this.cooldownTimer = this.cooldown;
    
    // Remove boost from ship
    this.ship.speedMultiplier = (this.ship.speedMultiplier || 1) / this.movementBoost;
    this.ship.thrustMultiplier = (this.ship.thrustMultiplier || 1) / this.thrustBoost;
    
    // Reset visual
    if (this.sprite) {
      this.sprite.clearTint();
    }
    
    console.log(`Afterburner deactivated: ${this.cooldown}s cooldown`);
  }
  
  getStatus() {
    if (this.isActive) {
      return `ACTIVE (${this.activeTimer.toFixed(1)}s)`;
    } else if (this.cooldownTimer > 0) {
      return `COOLDOWN (${this.cooldownTimer.toFixed(1)}s)`;
    } else {
      return 'READY';
    }
  }
}
