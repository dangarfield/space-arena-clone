import BaseModule from './BaseModule.js';

export default class ShieldModule extends BaseModule {
  constructor(config, ship, scene) {
    super(config, ship, scene);
    
    // Shield stats
    this.shieldRadius = parseInt(this.data.sr || 100);
    this.shieldStrength = parseInt(this.data.sa || 100);
    this.currentShield = this.shieldStrength;
    
    console.log(`  Shield: data.sr=${this.data.sr}, radius=${this.shieldRadius}, strength=${this.shieldStrength}`);
  }
  
  createVisuals(x, y) {
    // Create shield radius visualization
    this.shieldGraphics = this.scene.add.graphics();
    this.shieldGraphics.setDepth(-2);
    this.updateVisuals(x, y);
  }
  
  updateVisuals(x, y) {
    if (!this.shieldGraphics) return;
    
    this.shieldGraphics.clear();
    
    // Shield strength determines opacity
    const strength = this.currentShield / this.shieldStrength;
    const alpha = 0.2 * strength;
    
    this.shieldGraphics.lineStyle(0.2, 0x4444ff, 0.5);
    this.shieldGraphics.fillStyle(0x4444ff, alpha);
    
    // Draw shield circle
    this.shieldGraphics.fillCircle(x, y, this.shieldRadius);
    this.shieldGraphics.strokeCircle(x, y, this.shieldRadius);
  }
  
  update(dt) {
    // Shield regeneration could go here
  }
}
