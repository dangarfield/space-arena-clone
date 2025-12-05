import BaseModule from './BaseModule.js';

export default class RepairBayModule extends BaseModule {
  constructor(config, ship, scene) {
    super(config, ship, scene);
    
    // Repair stats - hardcoded per wiki
    this.repairCapacity = 2500; // Total HP it can repair (per bay)
    this.repairSpeed = 9; // HP per second (per bay)
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
      
      // Show repair effect
      this.showRepairEffect(target);
      
      console.log(`RepairBay repaired ${target.name}: +${repairAmount.toFixed(1)} HP (${this.remainingCapacity.toFixed(0)} capacity left)`);
    }
  }
  
  showRepairEffect(target) {
    if (!target.worldPos || !this.scene.visualConfig) return;
    
    const repairConfig = this.scene.visualConfig.effects?.repair || {
      sprite: '/images/effects/repair-01.png',
      frameWidth: 32,
      frameHeight: 32,
      frames: 4,
      frameRate: 8,
      scale: 0.02,
      alpha: 0.8,
      tint: 0x00ff00,
      depth: 15,
      duration: 500
    };
    
    // Create repair sprite at target position
    const repairSprite = this.scene.add.sprite(
      target.worldPos.x,
      target.worldPos.y,
      'repair'
    );
    repairSprite.setScale(repairConfig.scale);
    repairSprite.setAlpha(repairConfig.alpha);
    repairSprite.setTint(parseInt(repairConfig.tint));
    repairSprite.setDepth(repairConfig.depth);
    
    // Create animation if not already created
    if (!this.scene.anims.exists('repair_heal')) {
      this.scene.anims.create({
        key: 'repair_heal',
        frames: this.scene.anims.generateFrameNumbers('repair', { 
          start: 0, 
          end: repairConfig.frames - 1 
        }),
        frameRate: repairConfig.frameRate,
        repeat: -1 // Loop animation
      });
    }
    
    // Play animation
    repairSprite.play('repair_heal');
    
    // Fade out and destroy
    this.scene.tweens.add({
      targets: repairSprite,
      alpha: 0,
      duration: repairConfig.duration,
      onComplete: () => repairSprite.destroy()
    });
  }
}
