// Hydrate minimal hangar data into full ship configuration for display/battle

export async function hydrateHangar(hangarData) {
  if (!hangarData || !hangarData.shipId) return null;
  
  // Load ship data
  const shipResponse = await fetch(`/data/ships/${hangarData.shipId}.json`);
  const ship = await shipResponse.json();
  
  // Load all modules data
  const [modulesData, localization] = await Promise.all([
    fetch('/data/modules.json').then(r => r.json()),
    fetch('/data/module-localisation.json').then(r => r.json())
  ]);
  
  const loc = localization.en || {};
  
  // Hydrate each placed module
  const hydratedModules = hangarData.modules.map(placement => {
    // Find the raw module data by rawName
    const rawModule = Object.values(modulesData).find(m => m.name === placement.moduleId);
    
    if (!rawModule) {
      console.error('Module not found:', placement.moduleId);
      return null;
    }
    
    // Convert to display format
    const displayName = loc[rawModule.name] || rawModule.name;
    const modification = rawModule.Modification || '';
    const fullName = modification ? `${displayName} (${modification})` : displayName;
    const imageName = displayName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    
    // Determine module type and color based on category
    const category = rawModule.c || 0;
    let type = 'utility';
    let color = 0xffaa00;
    
    if ((category & 1) || (category & 2) || (category & 4)) {
      type = 'weapon';
      color = 0xff4444;
    } else if ((category & 8) || (category & 16)) {
      type = 'defense';
      color = 0x4444ff;
    }
    
    return {
      col: placement.col,
      row: placement.row,
      size: { w: rawModule.w, h: rawModule.h },
      type: type,
      color: color,
      module: {
        name: fullName,
        rawName: rawModule.name,
        category: category,
        image: `/images/modules/${imageName}.webp`,
        stats: {
          Size: `${rawModule.w}x${rawModule.h}`,
          Health: String(rawModule.hlt || 0),
          'Power Use': String(rawModule.pu || 0),
          'Power Generation': String(rawModule.pg || 0),
          Mass: String(rawModule.m || 0),
          Armor: String(rawModule.a || 0),
          Damage: String(rawModule.dmg || 0),
          Range: String(rawModule.rng || 0)
        }
      }
    };
  }).filter(m => m !== null);
  
  return {
    ship: ship,
    modules: hydratedModules
  };
}

export async function hydrateAllHangars(hangars) {
  const hydrated = await Promise.all(
    hangars.map(h => h ? hydrateHangar(h) : Promise.resolve(null))
  );
  return hydrated;
}
