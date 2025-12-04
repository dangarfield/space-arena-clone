import BaseModule from './BaseModule.js';

export default class RepairBayModule extends BaseModule {
  constructor(config, ship, scene) {
    super(config, ship, scene);
    
    // Repair stats - using shield regen fields as repair capacity
    this.repairCapacity = parseInt(this.data.smr || 500); // Total HP it can repair
    this.repairSpeed = parseFloat(this.data.srs || 50); // HP per second
    this.remainingCapacity = this.repairCapacity;
    this.repairTimer = 0;
    this.repairInterval = 0.5; // Check for repairs every 0.5s
    
    console.log(`  RepairBay: capacity=${this.repairCapacity}, speed=${this.repairSpeed}/s`);
  }
  
  update(dt) {
    if (!this.alive || this.remainingCapacity <= 0) return;
    
    this.repairTimer += dt;
    
    if (this.repairTimer >= this.repairInterval) {
      this.performRepair(dt);
      this.repairTimer = 0;
    }
  }
  
  performRepair(dt) {
    // Find damaged modules (not destroyed, just damaged)
    const damagedModules = this.ship.modules.filter(m => 
      m.alive && m.health < m.maxHealth && m !== this
    );
    
    if (damagedModules.length === 0) return;
    
    // Sort by most damaged (lowest health %)
    damagedModules.sort((a, b) => {
      const aPercent = a.health / a.maxHealth;
      const bPercent = b.health / b.maxHealth;
      return aPercent - bPercent;
    });
    
    // Repair the most damaged module
    const target = damagedModules[0];
    const repairAmount = Math.min(
      this.repairSpeed * this.repairInterval,
      target.maxHealth - target.health,
      this.remainingCapacity
    );
    
    if (repairAmount > 0) {
      target.health += repairAmount;
      target.updateHealthCell();
      this.remainingCapacity -= repairAmount;
      
      console.log(`RepairBay repaired ${target.name}: +${repairAmount.toFixed(1)} HP (${this.remainingCapacity.toFixed(0)} capacity left)`);
    }
  }
}
