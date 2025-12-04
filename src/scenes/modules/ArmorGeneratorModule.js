import BaseModule from './BaseModule.js';

export default class ArmorGeneratorModule extends BaseModule {
  constructor(config, ship, scene) {
    super(config, ship, scene);
    
    // Armor generation stats
    this.maxGenerations = parseInt(this.data.mc || 10); // Total armor pieces it can generate
    this.generationPeriod = 10; // 1 armor per 10 seconds
    this.remainingGenerations = this.maxGenerations;
    this.generationTimer = 0;
    this.generatedArmor = []; // Track generated armor pieces
    
    console.log(`  ArmorGenerator: max=${this.maxGenerations}, period=${this.generationPeriod}s`);
  }
  
  update(dt) {
    if (!this.alive || this.remainingGenerations <= 0) return;
    
    this.generationTimer += dt;
    
    if (this.generationTimer >= this.generationPeriod) {
      this.generateArmor();
      this.generationTimer = 0;
    }
  }
  
  generateArmor() {
    // Find empty cells adjacent to existing modules
    const emptyCells = this.findEmptyCells();
    
    if (emptyCells.length === 0) {
      console.log('ArmorGenerator: No empty cells available');
      return;
    }
    
    // Pick a random empty cell
    const cell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    
    // Create 1x1 armor piece
    const armorData = {
      name: 'Generated Armor',
      w: 1,
      h: 1,
      hlt: 100,
      a: 50,
      m: 10,
      c: 8 // Armor category
    };
    
    const armor = {
      type: 'armor',
      data: armorData,
      gridX: cell.x,
      gridY: cell.y,
      health: 100,
      maxHealth: 100,
      armor: 50,
      alive: true,
      ship: this.ship,
      worldPos: this.calculateWorldPos(cell.x, cell.y),
      sprite: this.scene.add.rectangle(0, 0, 1, 1, 0x666666),
      updateHealthCell: function() {
        if (this.health <= 0) {
          this.alive = false;
          this.sprite.destroy();
        }
      }
    };
    
    armor.sprite.setPosition(armor.worldPos.x, armor.worldPos.y);
    armor.sprite.setDepth(2);
    
    this.generatedArmor.push(armor);
    this.ship.modules.push(armor);
    this.remainingGenerations--;
    
    console.log(`ArmorGenerator: Created armor at (${cell.x}, ${cell.y}), ${this.remainingGenerations} left`);
  }
  
  calculateWorldPos(gridX, gridY) {
    // Calculate world position based on ship position and grid
    const cellSize = 1;
    const offsetX = (gridX - this.ship.gridWidth / 2) * cellSize;
    const offsetY = (gridY - this.ship.gridHeight / 2) * cellSize;
    
    const angle = this.ship.sprite.rotation;
    const rotatedX = offsetX * Math.cos(angle) - offsetY * Math.sin(angle);
    const rotatedY = offsetX * Math.sin(angle) + offsetY * Math.cos(angle);
    
    return {
      x: this.ship.sprite.x + rotatedX,
      y: this.ship.sprite.y + rotatedY
    };
  }
  
  findEmptyCells() {
    const emptyCells = [];
    
    // Check all grid cells
    for (let y = 0; y < this.ship.gridHeight; y++) {
      for (let x = 0; x < this.ship.gridWidth; x++) {
        // Check if cell is empty (no module occupies it)
        const occupied = this.ship.modules.some(m => {
          if (!m.alive || !m.gridX === undefined) return false;
          
          const mw = m.data?.w || 1;
          const mh = m.data?.h || 1;
          
          return x >= m.gridX && x < m.gridX + mw &&
                 y >= m.gridY && y < m.gridY + mh;
        });
        
        if (!occupied) {
          emptyCells.push({ x, y });
        }
      }
    }
    
    return emptyCells;
  }
  
  onDestroy() {
    // Clean up generated armor
    this.generatedArmor.forEach(armor => {
      if (armor.sprite) armor.sprite.destroy();
    });
  }
}
