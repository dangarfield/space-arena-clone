import BaseModule from './BaseModule.js';

export default class EngineModule extends BaseModule {
  constructor(config, ship, scene) {
    super(config, ship, scene);
    
    // Engine stats - parse from stats object if available
    this.thrustPower = parseFloat(this.data.stats?.Thrust_Power || this.data.ep || 0);
    this.turnPower = parseFloat(this.data.stats?.Turn_Power || this.data.ts || 0);
    
    console.log(`  Engine: thrust=${this.thrustPower}, turn=${this.turnPower}`);
  }
  
  update(dt) {
    // Engines are passive, no per-frame logic needed
  }
  
  getThrustContribution() {
    return this.alive ? this.thrustPower : 0;
  }
  
  getTurnContribution() {
    return this.alive ? this.turnPower : 0;
  }
}
