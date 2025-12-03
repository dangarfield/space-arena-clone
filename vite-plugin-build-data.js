import fs from 'fs';
import path from 'path';

export default function buildDataPlugin() {
  const buildData = () => {
    // Read data keys mapping
    const dataKeys = JSON.parse(fs.readFileSync('src/data/data-keys.json', 'utf8'));

    // Build ships.json
    const shipsDir = 'src/data/ships';
    const ships = {};

    fs.readdirSync(shipsDir).forEach(file => {
      if (file.endsWith('.json')) {
        const shipKey = file.replace('.json', '');
        const shipData = JSON.parse(fs.readFileSync(path.join(shipsDir, file), 'utf8'));
        ships[shipKey] = shipData;
      }
    });

    // Build modules.json
    const modulesDir = 'src/data/modules';
    const modules = {};

    fs.readdirSync(modulesDir).forEach(file => {
      if (file.endsWith('.json')) {
        const moduleKey = file.replace('.json', '');
        const moduleData = JSON.parse(fs.readFileSync(path.join(modulesDir, file), 'utf8'));
        modules[moduleKey] = moduleData;
      }
    });

    // Ensure public/data directory exists
    const outputDir = 'public/data';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write combined files
    fs.writeFileSync(path.join(outputDir, 'ships.json'), JSON.stringify(ships, null, 2));
    fs.writeFileSync(path.join(outputDir, 'modules.json'), JSON.stringify(modules, null, 2));
    fs.writeFileSync(path.join(outputDir, 'data-keys.json'), JSON.stringify(dataKeys, null, 2));

    console.log(`[build-data] Built ships.json with ${Object.keys(ships).length} ships`);
    console.log(`[build-data] Built modules.json with ${Object.keys(modules).length} modules`);
  };

  return {
    name: 'build-data',
    buildStart() {
      buildData();
    },
    configureServer(server) {
      // Watch for changes in data files
      server.watcher.add('src/data/ships/*.json');
      server.watcher.add('src/data/modules/*.json');
      
      server.watcher.on('change', (file) => {
        if (file.includes('src/data/ships/') || file.includes('src/data/modules/')) {
          console.log(`[build-data] Detected change in ${file}, rebuilding...`);
          buildData();
        }
      });
    }
  };
}
