import { createSignal, createResource, createEffect, For, Show } from 'solid-js';
import ShipGrid from './ShipGrid';

async function fetchModules() {
  console.log('fetchModules called');
  try {
    const [modulesData, localization] = await Promise.all([
      fetch('/data/modules.json').then(r => r.json()),
      fetch('/data/module-localisation.json').then(r => r.json())
    ]);
    console.log('Modules loaded, count:', Object.keys(modulesData).length);
  
  const loc = localization.en || {};
  
  // Convert module data to our format
  const convertModule = (key, module) => {
    const displayName = loc[module.name] || module.name;
    const description = loc[`${module.name}_DESC`] || '';
    const modification = module.Modification || '';
    
    // Add modification to name if present
    const fullName = modification ? `${displayName} (${modification})` : displayName;
    
    // Generate image path from display name
    const imageName = displayName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    const imagePath = `/images/modules/${imageName}.webp`;
    
    return {
      name: fullName,
      description: description,
      moduleKey: key, // Store the key (e.g., "Laser1x1")
      rawName: module.name, // Keep rawName for compatibility
      modification: modification,
      image: imagePath,
      requiredLevel: module.rl || 0,
      category: module.c || 0,
      stats: {
        Size: `${module.w}x${module.h}`,
        Health: String(module.hlt || 0),
        Power: String(module.pu || 0),
        'Power Use': String(module.pu || 0),
        'Power Generation': String(module.pg || 0),
        Mass: String(module.m || 0),
        Armor: String(module.a || 0),
        Damage: String(module.dmg || 0),
        Range: String(module.rng || 0),
        Type: module.t === 1 ? 'Ballistic' : module.t === 2 ? 'Missile' : module.t === 3 ? 'Device' : module.t === 4 ? 'Engine' : 'Unknown'
      }
    };
  };
  
  const modules = Object.entries(modulesData).map(([key, mod]) => convertModule(key, mod));
  
    // Category flags: 1=Ballistic, 2=Missile, 4=Laser, 8=Armor, 16=Shield, 32=PointDefense, 64=Engine, 128=Reactor, 256=Support
    const result = {
      weapons: modules.filter(m => (m.category & 1) || (m.category & 2) || (m.category & 4)),
      defense: modules.filter(m => (m.category & 8) || (m.category & 16)),
      utility: modules.filter(m => (m.category & 64) || (m.category & 128) || (m.category & 32) || (m.category & 256))
    };
    console.log('Modules categorized:', result);
    return result;
  } catch (error) {
    console.error('Error in fetchModules:', error);
    throw error;
  }
}

async function fetchShip(shipId) {
  console.log('fetchShip called with:', shipId);
  if (!shipId) {
    console.log('No shipId provided');
    return null;
  }
  try {
    const url = `/data/ships/${shipId}.json`;
    console.log('Fetching ship from:', url);
    const response = await fetch(url);
    if (!response.ok) {
      console.error('Ship fetch failed:', response.status, response.statusText);
      return null;
    }
    const data = await response.json();
    console.log('Ship loaded:', data);
    return data;
  } catch (error) {
    console.error('Error fetching ship:', error);
    return null;
  }
}

export default function FittingScene(props) {
  console.log('FittingScene props:', props);
  
  const [modules] = createResource(fetchModules);
  const [ship] = createResource(() => props.shipId, fetchShip);
  const [placedModules, setPlacedModules] = createSignal([]);
  const [activeTab, setActiveTab] = createSignal('weapons');
  const [activeSubTab, setActiveSubTab] = createSignal('ballistic');
  const [selectedModule, setSelectedModule] = createSignal(null);
  const [hoverCell, setHoverCell] = createSignal(null);
  

  
  const shipLevel = () => ship()?.unlockLevel || ship()?.lr || 1;
  const maxModuleLevel = () => shipLevel() + 5;
  
  // Convert ship grid to shape format
  const getShipShape = () => {
    const s = ship();
    if (!s) return [];
    
    // If ship has shape, use it
    if (s.shape) return s.shape;
    
    // Otherwise convert from g array (rotated 180 degrees)
    if (s.g && s.w && s.h) {
      const shape = [];
      for (let row = s.h - 1; row >= 0; row--) {
        let rowStr = '';
        for (let col = s.w - 1; col >= 0; col--) {
          const cellValue = s.g[row * s.w + col];
          const cellChar = cellValue === 0 ? ' ' : 
                          cellValue === 1 || cellValue === 2 || cellValue === 3 ? 'D' :
                          cellValue === 4 ? 'E' :
                          cellValue === 5 ? 'B' : ' ';
          rowStr += cellChar;
        }
        shape.push(rowStr);
      }
      return shape;
    }
    
    return [];
  };
  
  // Hydrate and sync placedModules with props.initialModules when they change
  createEffect(() => {
    const initial = props.initialModules || [];
    const mods = modules();
    
    console.log('Hydration effect - initial:', initial, 'modules loaded:', !!mods);
    
    if (initial.length === 0) {
      setPlacedModules([]);
      return;
    }
    
    if (!mods) {
      console.log('Modules not loaded yet, waiting...');
      return; // Wait for modules to load
    }
    
    // Check if modules need hydration (minimal format)
    if (initial[0]?.moduleId) {
      console.log('Hydrating from minimal format');
      // Hydrate from minimal format
      const hydrated = initial.map(placement => {
        // Find module in available modules by key
        let foundModule = null;
        ['weapons', 'defense', 'utility'].forEach(category => {
          const found = mods[category].find(m => m.moduleKey === placement.moduleId);
          if (found) foundModule = found;
        });
        
        if (!foundModule) {
          console.error('Module not found:', placement.moduleId);
          return null;
        }
        
        const size = parseSize(foundModule.stats.Size);
        const category = foundModule.category;
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
          size,
          type,
          color,
          module: foundModule
        };
      }).filter(m => m !== null);
      
      console.log('Hydrated modules:', hydrated);
      setPlacedModules(hydrated);
    } else {
      // Already in full format
      console.log('Using modules in full format');
      setPlacedModules(initial);
    }
  });
  
  // Auto-select first module when modules load
  createEffect(() => {
    const mods = availableModules();
    if (!mods || selectedModule()) return; // Only run once
    
    // Find first ballistic weapon
    const firstModule = mods.weapons.find(m => {
      const name = m.name.toLowerCase();
      const type = m.stats.Type?.toLowerCase() || '';
      return type.includes('ballistic') || name.includes('gun') || name.includes('cannon');
    });
    
    if (firstModule) {
      handleModuleClick(firstModule, 'weapon', 0xff4444);
    }
  });
  
  // Filter modules by level requirement and sort by required level
  const availableModules = () => {
    const mods = modules();
    if (!mods) return { weapons: [], defense: [], utility: [] };
    
    const maxLevel = maxModuleLevel();
    return {
      weapons: mods.weapons.filter(m => m.requiredLevel <= maxLevel).sort((a, b) => a.requiredLevel - b.requiredLevel),
      defense: mods.defense.filter(m => m.requiredLevel <= maxLevel).sort((a, b) => a.requiredLevel - b.requiredLevel),
      utility: mods.utility.filter(m => m.requiredLevel <= maxLevel).sort((a, b) => a.requiredLevel - b.requiredLevel)
    };
  };
  
  const resources = () => {
    const placed = placedModules();
    let power = 0, powerGen = 0, mass = 0, armor = 0;
    
    placed.forEach(pm => {
      // Check for power generation (reactors)
      const generation = parseInt(pm.module.stats['Power Generation'] || '0');
      if (generation > 0) {
        powerGen += generation;
      }
      
      // Check for power consumption
      const consumption = parseInt(pm.module.stats['Power Use'] || pm.module.stats.Power || '0');
      if (consumption > 0) {
        power += consumption;
      }
      
      mass += parseInt(pm.module.stats.Mass || '0');
      armor += parseInt(pm.module.stats.Armor || '0');
    });
    
    const cellsUsed = placed.reduce((sum, pm) => sum + pm.size.w * pm.size.h, 0);
    
    return { power, powerGen, mass, armor, cellsUsed };
  };

  const canPlace = (col, row, size, module = null) => {
    const shape = getShipShape();
    const gridWidth = shape[0]?.length || 6;
    const gridHeight = shape.length || 5;
    
    if (col + size.w > gridWidth || row + size.h > gridHeight) {
      return false;
    }
    
    // Check if all cells in the module footprint are valid ship cells
    const isEngine = module && (module.name.toLowerCase().includes('drive') || 
                                module.name.toLowerCase().includes('thruster') || 
                                module.name.toLowerCase().includes('engine'));
    
    for (let r = row; r < row + size.h; r++) {
      for (let c = col; c < col + size.w; c++) {
        const cellType = shape[r]?.[c];
        if (!cellType || cellType === ' ') {
          return false; // Can't place on empty space
        }
        
        // Engines can be placed on 'E' or 'B' cells, other modules on 'D' or 'B' cells
        if (isEngine && cellType !== 'E' && cellType !== 'B') {
          return false;
        }
        if (!isEngine && cellType !== 'D' && cellType !== 'B') {
          return false;
        }
      }
    }
    
    // Check if cells are already occupied
    const placed = placedModules();
    for (let r = row; r < row + size.h; r++) {
      for (let c = col; c < col + size.w; c++) {
        if (placed.some(pm => 
          c >= pm.col && c < pm.col + pm.size.w &&
          r >= pm.row && r < pm.row + pm.size.h
        )) {
          return false;
        }
      }
    }
    return true;
  };

  const handleModuleClick = (module, type, color) => {
    const size = parseSize(module.stats.Size);
    setSelectedModule({ module, type, color, size, moduleData: module });
  };

  const handleCellClick = (col, row) => {
    const selected = selectedModule();
    if (!selected) return;
    
    // Check level requirement
    const moduleLevel = selected.module.requiredLevel || 0;
    if (moduleLevel > maxModuleLevel()) {
      alert(`Module requires level ${moduleLevel}, but ship can only use modules up to level ${maxModuleLevel()}`);
      return;
    }
    
    if (canPlace(col, row, selected.size, selected.moduleData)) {
      const newModules = [...placedModules(), {
        module: selected.module,
        type: selected.type,
        color: selected.color,
        size: selected.size,
        col, row
      }];
      setPlacedModules(newModules);
    }
  };

  const handleCellHover = (col, row) => {
    const selected = selectedModule();
    if (selected) {
      setHoverCell({ col, row, size: selected.size, valid: canPlace(col, row, selected.size, selected.moduleData) });
    } else {
      setHoverCell(null);
    }
  };

  const parseSize = (sizeStr) => {
    if (!sizeStr) return { w: 1, h: 1 };
    const match = sizeStr.match(/(\d+)x(\d+)/);
    return match ? { w: parseInt(match[1]), h: parseInt(match[2]) } : { w: 1, h: 1 };
  };

  const validate = () => {
    const placed = placedModules();
    const res = resources();
    
    // Check power balance
    if (res.powerGen < res.power) {
      alert('Insufficient power! Add more reactors.');
      return false;
    }
    
    // Check required modules
    const hasWeapon = placed.some(m => m.type === 'weapon');
    const hasReactor = placed.some(m => m.module.name.toLowerCase().includes('reactor'));
    const hasEngine = placed.some(m => m.module.name.toLowerCase().includes('drive') || 
                                       m.module.name.toLowerCase().includes('thruster') || 
                                       m.module.name.toLowerCase().includes('engine'));
    
    if (!hasWeapon) {
      alert('Need at least one weapon!');
      return false;
    }
    if (!hasReactor) {
      alert('Need at least one reactor!');
      return false;
    }
    if (!hasEngine) {
      alert('Need at least one engine!');
      return false;
    }
    
    // Check all cells are filled
    const shape = getShipShape();
    const gridWidth = shape[0]?.length || 6;
    const gridHeight = shape.length || 5;
    
    for (let row = 0; row < gridHeight; row++) {
      for (let col = 0; col < gridWidth; col++) {
        const cellType = shape[row]?.[col];
        if (cellType && cellType !== ' ') {
          // Check if this cell is covered by a placed module
          const isCovered = placed.some(pm => 
            col >= pm.col && col < pm.col + pm.size.w &&
            row >= pm.row && row < pm.row + pm.size.h
          );
          if (!isCovered) {
            alert('All ship cells must be filled with modules!');
            return false;
          }
        }
      }
    }
    
    return true;
  };

  const saveFitting = () => {
    if (!validate()) return;
    
    // Save minimal data only - preserve shipId from props or ship data
    const config = {
      shipId: props.shipId || ship().name, // Use shipId prop or ship name
      modules: placedModules().map(m => ({
        moduleId: m.module.moduleKey, // Use the key (e.g., "Laser1x1")
        col: m.col,
        row: m.row
      }))
    };
    
    props.onSave?.(config);
  };

  return (
    <Show 
      when={ship() && modules()} 
      fallback={<div style={{ color: 'white', padding: '2rem' }}>Loading ship and modules...</div>}
    >
    <div style={{ display: 'flex', height: '100vh', padding: '1rem', gap: '1rem', overflow: 'hidden' }}>
      {/* Left side - Resources */}
      <div style={{ width: '250px', display: 'flex', 'flex-direction': 'column', 'min-height': 0 }}>
        <button onClick={props.onBack} style={{
          'font-size': '20px', background: 'transparent', color: 'white',
          border: 'none', cursor: 'pointer', 'margin-bottom': '1rem', 'text-align': 'left'
        }}>
          &lt; BACK
        </button>
        
        <h3 style={{ 'font-size': '20px', color: '#00aaff', 'margin-bottom': '0.5rem' }}>
          {ship().name}
        </h3>
        <p style={{ 'font-size': '14px', 'margin-bottom': '0.5rem', color: '#aaaaaa' }}>
          {ship().class}
        </p>
        <p style={{ 'font-size': '14px', 'margin-bottom': '1rem', color: '#ffaa00' }}>
          Level: {shipLevel()} (Max Module: {maxModuleLevel()})
        </p>
        
        {/* Resources */}
        <div style={{ 'font-size': '16px', flex: 1, 'min-height': 0 }}>
          <h3 style={{ 'margin-bottom': '0.5rem', 'font-size': '18px' }}>RESOURCES</h3>
          <p style={{ 
            color: resources().powerGen >= resources().power ? '#00ff00' : '#ff0000',
            'margin-bottom': '0.5rem'
          }}>
            Power: {resources().power} / {resources().powerGen}
          </p>

          <p style={{ 'margin-bottom': '0.5rem' }}>Mass: {resources().mass}</p>
          <p>Armor: {resources().armor}</p>
        </div>
        
        <button onClick={saveFitting} style={{
          'margin-top': 'auto', 'font-size': '18px', padding: '12px 20px',
          background: '#005500', color: 'white', border: 'none',
          'border-radius': '5px', cursor: 'pointer', width: '100%'
        }}>
          SAVE FITTING
        </button>
      </div>
      
      {/* Center - Ship Grid */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        'flex-direction': 'column',
        'align-items': 'center', 
        'justify-content': 'center',
        'min-width': 0,
        'min-height': 0,
        overflow: 'hidden'
      }}>
        <h1 style={{ 'font-size': '28px', color: '#00aaff', 'margin-bottom': '1rem' }}>
          PREPARE YOUR SHIP ({placedModules().length} modules)
        </h1>
        
        {/* Ship Grid - scales to fit */}
        <ShipGrid
          id="ship-grid"
          ship={ship()}
          interactive={true}
          onCellClick={handleCellClick}
          onCellHover={handleCellHover}
          onCellLeave={() => setHoverCell(null)}
        >
          {/* Hover preview */}
          <Show when={hoverCell()}>
            {(hover) => {
              const gridEl = document.getElementById('ship-grid');
              if (!gridEl) return null;
              
              // Get first cell to measure actual rendered size
              const firstCell = gridEl.querySelector('div');
              if (!firstCell) return null;
              
              const cellRect = firstCell.getBoundingClientRect();
              const cellWidth = cellRect.width;
              const cellHeight = cellRect.height;
              const gap = 2;
              const padding = 4;
              
              const selected = selectedModule();
              const imageUrl = selected?.module?.images?.[0];
              
              return (
                <div style={{
                  position: 'absolute',
                  left: `${padding + hover().col * (cellWidth + gap)}px`,
                  top: `${padding + hover().row * (cellHeight + gap)}px`,
                  width: `${hover().size.w * cellWidth + (hover().size.w - 1) * gap}px`,
                  height: `${hover().size.h * cellHeight + (hover().size.h - 1) * gap}px`,
                  background: imageUrl ? `url(${imageUrl}) center/contain no-repeat` : (hover().valid ? 'rgba(0, 255, 0, 0.3)' : 'rgba(255, 0, 0, 0.3)'),
                  'background-color': hover().valid ? 'rgba(0, 255, 0, 0.3)' : 'rgba(255, 0, 0, 0.3)',
                  border: `2px solid ${hover().valid ? '#00ff00' : '#ff0000'}`,
                  'pointer-events': 'none',
                  'z-index': 100,
                  opacity: 0.8
                }} />
              );
            }}
          </Show>
          
          {/* Placed modules */}
          <For each={placedModules()}>
            {(pm, i) => {
              const shape = getShipShape();
              const gridWidth = shape[0]?.length || 6;
              const gridHeight = shape.length || 5;
              const cellWidthPercent = 100 / gridWidth;
              const cellHeightPercent = 100 / gridHeight;
              
              const imageUrl = pm.module.image;
              
              return (
                <div
                  onClick={() => {
                    const newModules = placedModules().filter((_, idx) => idx !== i());
                    setPlacedModules(newModules);
                  }}
                  style={{
                    position: 'absolute',
                    left: `${pm.col * cellWidthPercent}%`,
                    top: `${pm.row * cellHeightPercent}%`,
                    width: `${pm.size.w * cellWidthPercent}%`,
                    height: `${pm.size.h * cellHeightPercent}%`,
                    background: imageUrl ? `url(${imageUrl}) center/contain no-repeat, #${pm.color.toString(16).padStart(6, '0')}` : `#${pm.color.toString(16).padStart(6, '0')}`,
                    'background-size': 'contain',
                    border: '2px solid white',
                    cursor: 'pointer',
                    opacity: 0.9,
                    overflow: 'hidden'
                  }}
                  title={pm.module.name}
                />
              );
            }}
          </For>
        </ShipGrid>
      </div>
      
      {/* Right side - Module Inventory */}
      <div style={{ width: '380px', 'overflow-y': 'auto', 'min-height': 0, display: 'flex', 'flex-direction': 'column' }}>
        <h2 style={{ 'margin-bottom': '0.5rem', 'font-size': '18px' }}>AVAILABLE MODULES</h2>
        
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '3px', 'margin-bottom': '0.5rem' }}>
          <button onClick={() => { 
            setActiveTab('weapons'); 
            setActiveSubTab('ballistic');
            // Auto-select first module
            const firstModule = availableModules().weapons.find(m => m.category & 1);
            if (firstModule) handleModuleClick(firstModule, 'weapon', 0xff4444);
          }} style={{
            flex: 1, padding: '8px', background: activeTab() === 'weapons' ? '#ff4444' : '#003366',
            color: 'white', border: 'none', cursor: 'pointer', 'font-size': '12px'
          }}>
            WEAPONS
          </button>
          <button onClick={() => { 
            setActiveTab('defense'); 
            setActiveSubTab('armor');
            // Auto-select first module
            const firstModule = availableModules().defense.find(m => m.category & 8);
            if (firstModule) handleModuleClick(firstModule, 'defense', 0x4444ff);
          }} style={{
            flex: 1, padding: '8px', background: activeTab() === 'defense' ? '#4444ff' : '#003366',
            color: 'white', border: 'none', cursor: 'pointer', 'font-size': '12px'
          }}>
            DEFENSE
          </button>
          <button onClick={() => { 
            setActiveTab('utility'); 
            setActiveSubTab('reactor');
            // Auto-select first module
            const firstModule = availableModules().utility.find(m => m.category & 128);
            if (firstModule) handleModuleClick(firstModule, 'utility', 0xffaa00);
          }} style={{
            flex: 1, padding: '8px', background: activeTab() === 'utility' ? '#ffaa00' : '#003366',
            color: 'white', border: 'none', cursor: 'pointer', 'font-size': '12px'
          }}>
            UTILITY
          </button>
        </div>
        
        {/* Sub-tabs */}
        <Show when={availableModules()}>
          <div style={{ display: 'flex', gap: '2px', 'margin-bottom': '0.5rem', 'flex-wrap': 'wrap' }}>
            <Show when={activeTab() === 'weapons'}>
              <button onClick={() => {
                setActiveSubTab('ballistic');
                const firstModule = availableModules().weapons.find(m => m.category & 1);
                if (firstModule) handleModuleClick(firstModule, 'weapon', 0xff4444);
              }} style={{
                padding: '5px 10px', background: activeSubTab() === 'ballistic' ? '#ff6666' : '#002244',
                color: 'white', border: 'none', cursor: 'pointer', 'font-size': '11px'
              }}>Ballistic</button>
              <button onClick={() => {
                setActiveSubTab('laser');
                const firstModule = availableModules().weapons.find(m => m.category & 4);
                if (firstModule) handleModuleClick(firstModule, 'weapon', 0xff4444);
              }} style={{
                padding: '5px 10px', background: activeSubTab() === 'laser' ? '#ff6666' : '#002244',
                color: 'white', border: 'none', cursor: 'pointer', 'font-size': '11px'
              }}>Laser</button>
              <button onClick={() => {
                setActiveSubTab('missile');
                const firstModule = availableModules().weapons.find(m => m.category & 2);
                if (firstModule) handleModuleClick(firstModule, 'weapon', 0xff4444);
              }} style={{
                padding: '5px 10px', background: activeSubTab() === 'missile' ? '#ff6666' : '#002244',
                color: 'white', border: 'none', cursor: 'pointer', 'font-size': '11px'
              }}>Missile</button>
            </Show>
            <Show when={activeTab() === 'defense'}>
              <button onClick={() => {
                setActiveSubTab('armor');
                const firstModule = availableModules().defense.find(m => m.category & 8);
                if (firstModule) handleModuleClick(firstModule, 'defense', 0x4444ff);
              }} style={{
                padding: '5px 10px', background: activeSubTab() === 'armor' ? '#6666ff' : '#002244',
                color: 'white', border: 'none', cursor: 'pointer', 'font-size': '11px'
              }}>Armor</button>
              <button onClick={() => {
                setActiveSubTab('shield');
                const firstModule = availableModules().defense.find(m => m.category & 16);
                if (firstModule) handleModuleClick(firstModule, 'defense', 0x4444ff);
              }} style={{
                padding: '5px 10px', background: activeSubTab() === 'shield' ? '#6666ff' : '#002244',
                color: 'white', border: 'none', cursor: 'pointer', 'font-size': '11px'
              }}>Shield</button>
            </Show>
            <Show when={activeTab() === 'utility'}>
              <button onClick={() => {
                setActiveSubTab('reactor');
                const firstModule = availableModules().utility.find(m => m.category & 128);
                if (firstModule) handleModuleClick(firstModule, 'utility', 0xffaa00);
              }} style={{
                padding: '5px 10px', background: activeSubTab() === 'reactor' ? '#ffcc66' : '#002244',
                color: 'white', border: 'none', cursor: 'pointer', 'font-size': '11px'
              }}>Reactor</button>
              <button onClick={() => {
                setActiveSubTab('engine');
                const firstModule = availableModules().utility.find(m => m.category & 64);
                if (firstModule) handleModuleClick(firstModule, 'utility', 0xffaa00);
              }} style={{
                padding: '5px 10px', background: activeSubTab() === 'engine' ? '#ffcc66' : '#002244',
                color: 'white', border: 'none', cursor: 'pointer', 'font-size': '11px'
              }}>Engine</button>
              <button onClick={() => {
                setActiveSubTab('support');
                const firstModule = availableModules().utility.find(m => (m.category & 32) || (m.category & 256));
                if (firstModule) handleModuleClick(firstModule, 'utility', 0xffaa00);
              }} style={{
                padding: '5px 10px', background: activeSubTab() === 'support' ? '#ffcc66' : '#002244',
                color: 'white', border: 'none', cursor: 'pointer', 'font-size': '11px'
              }}>Support</button>
            </Show>
          </div>
        </Show>
        
        {/* Module List */}
        <Show when={availableModules()}>
          <div style={{ display: 'flex', 'flex-direction': 'column', gap: '6px' }}>
            <Show when={activeTab() === 'weapons'}>
              <For each={availableModules().weapons.filter(m => {
                if (activeSubTab() === 'ballistic') return m.category & 1;
                if (activeSubTab() === 'laser') return m.category & 4;
                if (activeSubTab() === 'missile') return m.category & 2;
                return false;
              })}>
                {(module) => (
                  <ModuleButton 
                    module={module} 
                    type="weapon" 
                    color={0xff4444} 
                    onClick={handleModuleClick}
                    selected={selectedModule()?.module === module}
                  />
                )}
              </For>
            </Show>
            <Show when={activeTab() === 'defense'}>
              <For each={availableModules().defense.filter(m => {
                if (activeSubTab() === 'armor') return m.category & 8;
                if (activeSubTab() === 'shield') return m.category & 16;
                return false;
              })}>
                {(module) => (
                  <ModuleButton 
                    module={module} 
                    type="defense" 
                    color={0x4444ff} 
                    onClick={handleModuleClick}
                    selected={selectedModule()?.module === module}
                  />
                )}
              </For>
            </Show>
            <Show when={activeTab() === 'utility'}>
              <For each={availableModules().utility.filter(m => {
                if (activeSubTab() === 'reactor') return m.category & 128;
                if (activeSubTab() === 'engine') return m.category & 64;
                if (activeSubTab() === 'support') return (m.category & 32) || (m.category & 256);
                return false;
              })}>
                {(module) => (
                  <ModuleButton 
                    module={module} 
                    type="utility" 
                    color={0xffaa00} 
                    onClick={handleModuleClick}
                    selected={selectedModule()?.module === module}
                  />
                )}
              </For>
            </Show>
          </div>
        </Show>
      </div>
      

    </div>
    </Show>
  );
}

function ModuleButton(props) {
  const size = () => {
    const sizeStr = props.module.stats.Size;
    if (!sizeStr) return { w: 1, h: 1 };
    const match = sizeStr.match(/(\d+)x(\d+)/);
    return match ? { w: parseInt(match[1]), h: parseInt(match[2]) } : { w: 1, h: 1 };
  };

  const powerValue = () => {
    const generation = parseInt(props.module.stats['Power Generation'] || props.module.pg || '0');
    const consumption = parseInt(props.module.stats['Power Use'] || props.module.stats.Power || props.module.pu || '0');
    const net = generation - consumption;
    
    if (net > 0) {
      return `+${net}`;
    } else if (net < 0) {
      return `${net}`;
    }
    return null;
  };

  const imageUrl = props.module.image;
  
  return (
    <button
      onClick={() => props.onClick(props.module, props.type, props.color)}
      style={{
        padding: '8px',
        background: props.selected ? '#005588' : '#003366',
        border: props.selected ? '3px solid #00aaff' : '2px solid #0055aa',
        color: 'white',
        cursor: 'pointer',
        'border-radius': '3px',
        display: 'flex',
        gap: '8px',
        'align-items': 'center'
      }}
    >
      <div style={{
        width: '40px',
        height: '40px',
        'flex-shrink': 0,
        background: imageUrl ? `url(${imageUrl}) center/contain no-repeat, #${props.color.toString(16).padStart(6, '0')}` : `#${props.color.toString(16).padStart(6, '0')}`,
        'background-size': 'contain',
        border: '1px solid #00aaff',
        'border-radius': '3px'
      }} />
      <div style={{ flex: 1, 'text-align': 'left' }}>
        <div style={{ 'font-size': '13px', 'font-weight': 'bold' }}>
          {props.module.name} ({size().w}x{size().h})
        </div>
        <div style={{ 'font-size': '11px', color: '#aaaaaa', 'margin-top': '3px' }}>
          {props.module.stats.Health && `HP: ${props.module.stats.Health} | `}
          {props.module.stats.Damage && `DMG: ${props.module.stats.Damage} | `}
          {powerValue() && `PWR: ${powerValue()}`}
        </div>
      </div>
    </button>
  );
}
