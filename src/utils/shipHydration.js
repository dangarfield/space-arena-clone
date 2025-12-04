/**
 * Hydrates a minimal ship configuration into a full configuration with all module data
 * @param {Object} minimalConfig - { shipId: string, modules: [{moduleId, col, row}] }
 * @returns {Promise<Object>} - { ship: shipData, modules: [hydratedModules] }
 */
export async function hydrateShipConfig(minimalConfig) {
  if (!minimalConfig || !minimalConfig.shipId || !minimalConfig.modules) {
    throw new Error('Invalid config format. Expected {shipId, modules}');
  }

  // Load ship and modules data
  const [shipData, modulesData, localization] = await Promise.all([
    fetch(`/data/ships/${minimalConfig.shipId}.json`).then(r => r.json()),
    fetch('/data/modules.json').then(r => r.json()),
    fetch('/data/module-localisation.json').then(r => r.json())
  ]);
  
  const loc = localization.en || {};
  
  // Hydrate modules
  const hydratedModules = minimalConfig.modules.map(placement => {
    const rawModule = modulesData[placement.moduleId];
    if (!rawModule) {
      console.error('Module not found:', placement.moduleId);
      return null;
    }
    
    const displayName = loc[rawModule.name] || rawModule.name;
    const imageName = displayName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    const category = rawModule.c || 0;
    let type = 'utility', color = 0xffaa00;
    
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
      type, color,
      module: {
        ...rawModule, // Include all raw module data FIRST
        key: placement.moduleId, // Store module key for visual config lookup
        name: displayName, // Override with localized name
        category,
        image: `/images/modules/${imageName}.webp`,
        stats: {
          Health: String(rawModule.hlt || 0),
          Damage: String(rawModule.dmg || 0),
          Range: String(rawModule.rng || 0),
          Thrust_Power: String(rawModule.ep || 0),
          Turn_Power: String(rawModule.ts || 0)
        }
      }
    };
  }).filter(m => m !== null);
  
  return {
    ship: shipData,
    modules: hydratedModules
  };
}
