import fs from 'fs';
import path from 'path';

const shipsData = JSON.parse(fs.readFileSync('src/data/ships.json', 'utf8'));

// Function to generate a ship shape based on cells
function generateShape(cells, shipName) {
  const name = shipName.toLowerCase();
  
  // Predefined shapes for known ships
  const knownShapes = {
    'sparrow': { width: 6, height: 5, shape: ["  DD  ", " DDDD ", "DDDDDD", " DDEE ", "  EE  "] },
    'acolyte': { width: 6, height: 6, shape: ["  DD  ", " DDDD ", "DDDDDD", "DDDDDD", " DDEE ", "  EE  "] },
    'hammerhead': { width: 8, height: 6, shape: [" DDDDDD ", "DDDDDDDD", "DDDDDDDD", "DDDDDDDD", " DDEEEE ", "  EEEE  "] },
  };
  
  if (knownShapes[name]) {
    return knownShapes[name];
  }
  
  // Generate shape based on cell count
  let width, height;
  
  if (cells <= 30) {
    width = 6; height = 5;
  } else if (cells <= 40) {
    width = 6; height = 6;
  } else if (cells <= 50) {
    width = 7; height = 7;
  } else if (cells <= 70) {
    width = 8; height = 8;
  } else if (cells <= 100) {
    width = 10; height = 10;
  } else {
    width = 12; height = 12;
  }
  
  // Create a basic ship shape (wider in middle, engines at back)
  const shape = [];
  for (let row = 0; row < height; row++) {
    let line = '';
    const progress = row / (height - 1);
    
    if (progress < 0.3) {
      // Front - narrow
      const frontWidth = Math.floor(width * 0.5);
      const padding = Math.floor((width - frontWidth) / 2);
      line = ' '.repeat(padding) + 'D'.repeat(frontWidth) + ' '.repeat(width - padding - frontWidth);
    } else if (progress < 0.7) {
      // Middle - full width
      line = 'D'.repeat(width);
    } else if (progress < 0.85) {
      // Back - slightly narrower with engines
      const backWidth = Math.floor(width * 0.8);
      const padding = Math.floor((width - backWidth) / 2);
      line = ' '.repeat(padding) + 'D'.repeat(Math.floor(backWidth * 0.6)) + 'E'.repeat(Math.ceil(backWidth * 0.4)) + ' '.repeat(width - padding - backWidth);
    } else {
      // Engines only
      const engineWidth = Math.floor(width * 0.5);
      const padding = Math.floor((width - engineWidth) / 2);
      line = ' '.repeat(padding) + 'E'.repeat(engineWidth) + ' '.repeat(width - padding - engineWidth);
    }
    
    shape.push(line);
  }
  
  return { width, height, shape };
}

// Create ship files
const outputDir = 'src/data/ships';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

let created = 0;
shipsData.forEach(ship => {
  const cells = parseInt(ship.stats['Cells without modifications'] || ship.stats['Cell'] || '30');
  const shipId = ship.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  
  const shapeData = generateShape(cells, ship.name);
  
  const shipFile = {
    id: shipId,
    name: ship.name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    class: ship.stats['Class'] || 'Unknown',
    description: ship.description || '',
    stats: ship.stats,
    images: ship.images || [],
    grid: {
      width: shapeData.width,
      height: shapeData.height
    },
    shape: shapeData.shape
  };
  
  const filename = path.join(outputDir, `${shipId}.json`);
  fs.writeFileSync(filename, JSON.stringify(shipFile, null, 2), 'utf8');
  created++;
  console.log(`Created ${shipId}.json`);
});

console.log(`\nTotal ships created: ${created}`);
