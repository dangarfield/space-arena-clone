// Utility functions for calculating ship stats from module configuration

export function calculateResources(modules) {
  let power = 0;
  let powerGen = 0;
  let mass = 0;
  let armor = 0;
  
  modules.forEach(pm => {
    // Check for power generation (reactors)
    const generation = parseInt(pm.module.stats?.['Power Generation'] || pm.module.pg || 0);
    if (generation > 0) {
      powerGen += generation;
    }
    
    // Check for power consumption
    const consumption = parseInt(pm.module.stats?.['Power Use'] || pm.module.stats?.Power || pm.module.pu || 0);
    if (consumption > 0) {
      power += consumption;
    }
    
    mass += parseInt(pm.module.stats?.Mass || pm.module.m || 0);
    armor += parseInt(pm.module.stats?.Armor || pm.module.a || 0);
  });
  
  const cellsUsed = modules.reduce((sum, pm) => sum + pm.size.w * pm.size.h, 0);
  
  return { power, powerGen, mass, armor, cellsUsed };
}

export function validateShipFitting(ship, modules) {
  const res = calculateResources(modules);
  
  // Check power balance
  if (res.powerGen < res.power) {
    return { valid: false, error: 'Insufficient power! Add more reactors.' };
  }
  
  // Check required modules
  const hasWeapon = modules.some(m => m.type === 'weapon');
  const hasReactor = modules.some(m => {
    const name = m.module.name?.toLowerCase() || '';
    return name.includes('reactor');
  });
  const hasEngine = modules.some(m => {
    const name = m.module.name?.toLowerCase() || '';
    return name.includes('drive') || name.includes('thruster') || name.includes('engine');
  });
  
  if (!hasWeapon) {
    return { valid: false, error: 'Need at least one weapon!' };
  }
  if (!hasReactor) {
    return { valid: false, error: 'Need at least one reactor!' };
  }
  if (!hasEngine) {
    return { valid: false, error: 'Need at least one engine!' };
  }
  
  // Check all cells are filled
  const gridWidth = ship.shape?.[0]?.length || 6;
  const gridHeight = ship.shape?.length || 5;
  const shape = ship.shape;
  
  for (let row = 0; row < gridHeight; row++) {
    for (let col = 0; col < gridWidth; col++) {
      const cellType = shape[row]?.[col];
      if (cellType && cellType !== ' ') {
        // Check if this cell is covered by a placed module
        const isCovered = modules.some(pm => 
          col >= pm.col && col < pm.col + pm.size.w &&
          row >= pm.row && row < pm.row + pm.size.h
        );
        if (!isCovered) {
          return { valid: false, error: 'All ship cells must be filled with modules!' };
        }
      }
    }
  }
  
  return { valid: true, resources: res };
}

export function isBattleReady(ship, modules) {
  if (!ship || !modules || modules.length === 0) return false;
  
  const validation = validateShipFitting(ship, modules);
  return validation.valid;
}
