import BaseModule from './BaseModule.js';

export default class WarpModule extends BaseModule {
  constructor(config, ship, scene) {
    super(config, ship, scene);
    
    // Warp power (using ep field)
    this.warpPower = parseFloat(this.data.ep || 1);
    
    console.log(`  WarpModule: power=${this.warpPower}`);
  }
  
  getWarpPower() {
    return this.alive ? this.warpPower : 0;
  }
  
  update(dt) {
    // Warp modules don't need per-frame updates
  }
}
