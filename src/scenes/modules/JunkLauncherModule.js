import BaseModule from './BaseModule.js';

export default class JunkLauncherModule extends BaseModule {
  constructor(config, ship, scene) {
    super(config, ship, scene);
    
    // Junk launcher stats
    this.fireRate = parseFloat(this.data.ats || 1);
    this.junkCount = parseInt(this.data.mc || 5); // Number of junk pieces per launch
    this.cooldown = 0;
    
    console.log(`  JunkLauncher: rate=${this.fireRate}, count=${this.junkCount}`);
  }
  
  update(dt) {
    if (this.cooldown > 0) {
      this.cooldown -= dt;
    } else if (this.alive) {
      this.launchJunk();
      this.cooldown = 1 / this.fireRate;
    }
  }
  
  launchJunk() {
    // Launch junk pieces around the ship
    for (let i = 0; i < this.junkCount; i++) {
      const angle = (Math.PI * 2 / this.junkCount) * i + Math.random() * 0.5;
      const distance = 5 + Math.random() * 3;
      
      const junk = {
        type: 'junk',
        x: this.worldPos.x + Math.cos(angle) * distance,
        y: this.worldPos.y + Math.sin(angle) * distance,
        health: 15,
        maxHealth: 15,
        velocity: {
          x: Math.cos(angle) * 2,
          y: Math.sin(angle) * 2
        },
        lifetime: 0,
        maxLifetime: 10, // Junk lasts 10 seconds
        owner: this.ship,
        sprite: this.scene.add.rectangle(
          this.worldPos.x + Math.cos(angle) * distance,
          this.worldPos.y + Math.sin(angle) * distance,
          0.5, 0.5, 0x888888
        )
      };
      
      junk.sprite.setDepth(3);
      this.scene.junkPieces = this.scene.junkPieces || [];
      this.scene.junkPieces.push(junk);
    }
    
    console.log(`Launched ${this.junkCount} junk pieces`);
  }
}
