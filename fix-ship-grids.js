import fs from 'fs';
import path from 'path';

const shipsDir = 'src/data/ships';

const shipFiles = fs.readdirSync(shipsDir)
  .filter(f => f.endsWith('.json') && f !== 'index.json');

shipFiles.forEach(shipFile => {
  const filepath = path.join(shipsDir, shipFile);
  const shipData = JSON.parse(fs.readFileSync(filepath, 'utf8'));
  
  if (shipData.shape && Array.isArray(shipData.shape)) {
    // Remove grid property - it will be calculated from shape
    delete shipData.grid;
    
    fs.writeFileSync(filepath, JSON.stringify(shipData, null, 2), 'utf8');
    console.log(`✓ ${shipData.name}: Removed grid property`);
  }
});

console.log('\nDone! Grid dimensions will now be calculated from shape arrays.');
