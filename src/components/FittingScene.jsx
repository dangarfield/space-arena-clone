import { createSignal, createResource, createEffect, For, Show } from 'solid-js';
import { useNavigate, useParams } from '@solidjs/router';
import { useGameState } from '../contexts/GameStateContext';
import ShipGrid from './ShipGrid';
import GlobalHeader from './GlobalHeader';
import PageTitle from './PageTitle';

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

export default function FittingScene() {
  const navigate = useNavigate();
  const params = useParams();
  const { gameState, updateHangar } = useGameState();
  
  const hangarIndex = () => parseInt(params.hangarIndex);
  const player = () => gameState().player;
  const currentHangar = () => gameState().hangars[hangarIndex()];
  const shipId = () => currentHangar()?.shipId;
  const initialModules = () => currentHangar()?.modules || [];
  
  const [modules] = createResource(fetchModules);
  const [ship] = createResource(shipId, fetchShip);
  const [placedModules, setPlacedModules] = createSignal([]);
  const [activeTab, setActiveTab] = createSignal('weapons');
  const [activeSubTab, setActiveSubTab] = createSignal('ballistic');
  const [selectedModule, setSelectedModule] = createSignal(null);
  const [hoverCell, setHoverCell] = createSignal(null);
  const [menuLevel, setMenuLevel] = createSignal(0); // 0=categories, 1=subcategories, 2=modules
  const [showModuleDetails, setShowModuleDetails] = createSignal(null);
  

  
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
  
  // Hydrate and sync placedModules with initialModules when they change
  createEffect(() => {
    const initial = initialModules();
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
    
    // Save minimal data
    const config = {
      shipId: shipId() || ship().name,
      modules: placedModules().map(m => ({
        moduleId: m.module.moduleKey,
        col: m.col,
        row: m.row
      }))
    };
    
    updateHangar(hangarIndex(), config);
    navigate('/');
  };

  const resetFitting = () => {
    // Reload the initial modules
    const initial = initialModules();
    const mods = modules();
    
    if (initial.length === 0 || !mods) {
      setPlacedModules([]);
      setSelectedModule(null);
      return;
    }
    
    // Re-hydrate from saved data
    if (initial[0]?.moduleId) {
      const hydrated = initial.map(placement => {
        let foundModule = null;
        ['weapons', 'defense', 'utility'].forEach(category => {
          const found = mods[category].find(m => m.moduleKey === placement.moduleId);
          if (found) foundModule = found;
        });
        
        if (!foundModule) return null;
        
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
      
      setPlacedModules(hydrated);
    } else {
      setPlacedModules(initial);
    }
    setSelectedModule(null);
  };

  return (
    <Show 
      when={ship() && modules()} 
      fallback={<div style={{ color: 'white', padding: '2rem' }}>Loading ship and modules...</div>}
    >
    <>
    <style>{`
      .module-scroll::-webkit-scrollbar {
        display: none;
      }
      .module-scroll {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
    `}</style>
    <div class="fitting-scene" style={{ 
      display: 'flex', 
      'flex-direction': 'column',
      height: '100vh', 
      background: '#0a0a1a',
      overflow: 'hidden' 
    }}>
      {/* Global Header */}
      <GlobalHeader player={player()} />
      
      {/* Page Title with Save/Reset */}
      <div style={{
        display: 'flex',
        'align-items': 'center',
        'justify-content': 'center',
        height: '45px',
        padding: '0 0.75rem',
        'border-bottom': '2px solid #003366',
        'flex-shrink': 0,
        position: 'relative'
      }}>
        <button
          onClick={() => navigate('/')}
          style={{
            position: 'absolute',
            left: '0.75rem',
            background: 'transparent',
            border: 'none',
            color: '#00aaff',
            'font-size': '24px',
            cursor: 'pointer',
            padding: '0.25rem'
          }}
        >
          ‹
        </button>
        <h2 style={{ 
          'font-size': '18px', 
          color: '#00aaff',
          margin: 0
        }}>
          SHIP FITTING
        </h2>
        <div style={{
          position: 'absolute',
          right: '0.75rem',
          display: 'flex',
          gap: '0.5rem'
        }}>
          <button
            onClick={resetFitting}
            style={{
              background: '#663300',
              border: 'none',
              color: 'white',
              'font-size': '16px',
              width: '32px',
              height: '32px',
              'border-radius': '6px',
              cursor: 'pointer',
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center'
            }}
          >
            ↻
          </button>
          <button
            onClick={saveFitting}
            style={{
              background: '#005500',
              border: 'none',
              color: 'white',
              'font-size': '16px',
              width: '32px',
              height: '32px',
              'border-radius': '6px',
              cursor: 'pointer',
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center'
            }}
          >
            ✓
          </button>
        </div>
      </div>
      
      {/* Ship Info Bar */}
      <div style={{
        display: 'flex',
        'align-items': 'center',
        'justify-content': 'space-between',
        padding: '0.5rem 0.75rem',
        background: '#001a33',
        'border-bottom': '1px solid #003366',
        'flex-shrink': 0
      }}>
        <div>
          <div style={{ 'font-size': '14px', color: 'white', 'font-weight': '500' }}>
            {ship().name} - {ship().sname}
          </div>
          <div style={{ 'font-size': '11px', color: '#aaaaaa', 'margin-top': '2px' }}>
            Max Module Level: {maxModuleLevel()}
          </div>
        </div>
        <div style={{ 'text-align': 'right', 'font-size': '11px' }}>
          <div style={{ 
            color: resources().powerGen >= resources().power ? '#00ff00' : '#ff0000',
            'font-weight': '500'
          }}>
            PWR: {resources().power}/{resources().powerGen}
          </div>
          <div style={{ color: '#aaaaaa', 'margin-top': '2px' }}>
            Mass: {resources().mass} | Armor: {resources().armor}
          </div>
        </div>
      </div>
      
      {/* Ship Grid Container */}
      <div style={{ 
        flex: 1,
        display: 'flex',
        'align-items': 'center',
        'justify-content': 'center',
        padding: '0.75rem',
        'min-height': 0,
        overflow: 'hidden',
        position: 'relative'
      }}>
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
      
      {/* Horizontal Module Selector */}
      <div style={{ 
        'flex-shrink': 0,
        'border-top': '2px solid #003366',
        background: '#0a0a1a',
        display: 'flex',
        gap: '0.5rem',
        padding: '0.75rem'
      }}>
        <div 
          class="module-scroll"
          style={{ 
            display: 'flex', 
            'align-items': 'center',
            gap: '0.5rem',
            flex: 1,
            'overflow-x': menuLevel() === 2 ? 'auto' : 'visible',
            'overflow-y': 'hidden',
            '-webkit-overflow-scrolling': 'touch',
            'scroll-behavior': 'smooth'
          }}
        >
          {/* Level 0: Categories */}
          <Show when={menuLevel() === 0}>
            <ModuleCard
              label="WEAPONS"
              color="#ff4444"
              onClick={() => {
                setActiveTab('weapons');
                setMenuLevel(1);
              }}
            />
            <ModuleCard
              label="DEFENSE"
              color="#4444ff"
              onClick={() => {
                setActiveTab('defense');
                setMenuLevel(1);
              }}
            />
            <ModuleCard
              label="UTILITY"
              color="#ffaa00"
              onClick={() => {
                setActiveTab('utility');
                setMenuLevel(1);
              }}
            />
          </Show>
          
          {/* Level 1: Subcategories */}
          <Show when={menuLevel() === 1}>
            <Show when={activeTab() === 'weapons'}>
              <ModuleCard
                label="Ballistic"
                color="#ff6666"
                onClick={() => {
                  setActiveSubTab('ballistic');
                  setMenuLevel(2);
                }}
              />
              <ModuleCard
                label="Laser"
                color="#ff6666"
                onClick={() => {
                  setActiveSubTab('laser');
                  setMenuLevel(2);
                }}
              />
              <ModuleCard
                label="Missile"
                color="#ff6666"
                onClick={() => {
                  setActiveSubTab('missile');
                  setMenuLevel(2);
                }}
              />
            </Show>
            <Show when={activeTab() === 'defense'}>
              <ModuleCard
                label="Armor"
                color="#6666ff"
                onClick={() => {
                  setActiveSubTab('armor');
                  setMenuLevel(2);
                }}
              />
              <ModuleCard
                label="Shield"
                color="#6666ff"
                onClick={() => {
                  setActiveSubTab('shield');
                  setMenuLevel(2);
                }}
              />
            </Show>
            <Show when={activeTab() === 'utility'}>
              <ModuleCard
                label="Reactor"
                color="#ffcc66"
                onClick={() => {
                  setActiveSubTab('reactor');
                  setMenuLevel(2);
                }}
              />
              <ModuleCard
                label="Engine"
                color="#ffcc66"
                onClick={() => {
                  setActiveSubTab('engine');
                  setMenuLevel(2);
                }}
              />
              <ModuleCard
                label="Support"
                color="#ffcc66"
                onClick={() => {
                  setActiveSubTab('support');
                  setMenuLevel(2);
                }}
              />
            </Show>
          </Show>
          
          {/* Level 2: Actual Modules */}
          <Show when={menuLevel() === 2 && availableModules()}>
            <Show when={activeTab() === 'weapons'}>
              <For each={availableModules().weapons.filter(m => {
                if (activeSubTab() === 'ballistic') return m.category & 1;
                if (activeSubTab() === 'laser') return m.category & 4;
                if (activeSubTab() === 'missile') return m.category & 2;
                return false;
              })}>
                {(module) => (
                  <ModuleCard
                    module={module}
                    type="weapon"
                    color={0xff4444}
                    selected={selectedModule()?.module === module}
                    onClick={() => handleModuleClick(module, 'weapon', 0xff4444)}
                    onInfo={() => setShowModuleDetails(module)}
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
                  <ModuleCard
                    module={module}
                    type="defense"
                    color={0x4444ff}
                    selected={selectedModule()?.module === module}
                    onClick={() => handleModuleClick(module, 'defense', 0x4444ff)}
                    onInfo={() => setShowModuleDetails(module)}
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
                  <ModuleCard
                    module={module}
                    type="utility"
                    color={0xffaa00}
                    selected={selectedModule()?.module === module}
                    onClick={() => handleModuleClick(module, 'utility', 0xffaa00)}
                    onInfo={() => setShowModuleDetails(module)}
                  />
                )}
              </For>
            </Show>
          </Show>
        </div>

        
        {/* Back Button - Fixed on Right */}
        <Show when={menuLevel() > 0}>
          <button
            onClick={() => setMenuLevel(menuLevel() - 1)}
            style={{
              'flex-shrink': 0,
              background: '#003366',
              border: '2px solid #00aaff',
              'border-radius': '8px',
              width: '30px',
              height: '60px',
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center',
              color: '#00aaff',
              'font-size': '24px',
              'font-weight': 'bold',
              cursor: 'pointer'
            }}
          >
            ‹
          </button>
        </Show>
      </div>
      
      {/* Module Details Modal */}
      <Show when={showModuleDetails()}>
        {(module) => (
          <div
            onClick={() => setShowModuleDetails(null)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center',
              'z-index': 1000,
              padding: '1rem'
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#001a33',
                border: '2px solid #00aaff',
                'border-radius': '12px',
                padding: '1.5rem',
                'max-width': '400px',
                width: '100%',
                'max-height': '80vh',
                'overflow-y': 'auto'
              }}
            >
              <h3 style={{ 'font-size': '18px', color: '#00aaff', 'margin-bottom': '1rem' }}>
                {module().name}
              </h3>
              <div style={{ 'font-size': '13px', color: '#aaaaaa', 'line-height': '1.6' }}>
                <Show when={module().description}>
                  <p style={{ 'margin-bottom': '1rem' }}>{module().description}</p>
                </Show>
                <div style={{ display: 'grid', 'grid-template-columns': '1fr 1fr', gap: '0.5rem' }}>
                  <For each={Object.entries(module().stats).filter(([k, v]) => v && v !== '0')}>
                    {([key, value]) => (
                      <div>
                        <div style={{ color: '#666', 'font-size': '11px' }}>{key}</div>
                        <div style={{ color: 'white', 'font-weight': '600' }}>{value}</div>
                      </div>
                    )}
                  </For>
                </div>
              </div>
              <button
                onClick={() => setShowModuleDetails(null)}
                style={{
                  'margin-top': '1.5rem',
                  width: '100%',
                  padding: '12px',
                  background: '#003366',
                  border: 'none',
                  'border-radius': '8px',
                  color: 'white',
                  'font-size': '14px',
                  'font-weight': '600',
                  cursor: 'pointer'
                }}
              >
                CLOSE
              </button>
            </div>
          </div>
        )}
      </Show>
    </div>
    </>
    </Show>
  );
}

function ModuleCard(props) {
  // For category/subcategory cards
  if (props.label) {
    return (
      <button
        onClick={props.onClick}
        style={{
          flex: 1,
          'flex-shrink': 0,
          'min-width': '100px',
          height: '60px',
          background: props.color,
          border: '2px solid #00aaff',
          'border-radius': '8px',
          color: 'white',
          'font-size': '14px',
          'font-weight': '600',
          cursor: 'pointer',
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'center',
          'text-align': 'center',
          padding: '0.5rem'
        }}
      >
        {props.label}
      </button>
    );
  }
  
  // For actual module cards
  const size = () => {
    const sizeStr = props.module.stats.Size;
    if (!sizeStr) return { w: 1, h: 1 };
    const match = sizeStr.match(/(\d+)x(\d+)/);
    return match ? { w: parseInt(match[1]), h: parseInt(match[2]) } : { w: 1, h: 1 };
  };

  const powerValue = () => {
    const generation = parseInt(props.module.stats['Power Generation'] || '0');
    const consumption = parseInt(props.module.stats['Power Use'] || props.module.stats.Power || '0');
    const net = generation - consumption;
    
    if (net > 0) return `+${net}`;
    if (net < 0) return `${net}`;
    return null;
  };

  const imageUrl = props.module.image;
  
  return (
    <button
      onClick={props.onClick}
      style={{
        'flex-shrink': 0,
        width: '60px',
        height: '60px',
        background: imageUrl ? `url(${imageUrl}) center/contain no-repeat, #${props.color.toString(16).padStart(6, '0')}` : `#${props.color.toString(16).padStart(6, '0')}`,
        'background-size': 'contain',
        border: props.selected ? '3px solid #00aaff' : '2px solid #0055aa',
        'border-radius': '8px',
        cursor: 'pointer',
        position: 'relative',
        padding: 0
      }}
    >
      {/* Size overlay - bottom left */}
      <div style={{
        position: 'absolute',
        bottom: '4px',
        left: '4px',
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        'font-size': '10px',
        'font-weight': '600',
        padding: '2px 6px',
        'border-radius': '4px'
      }}>
        {size().w}x{size().h}
      </div>
      
      {/* Power overlay - bottom right */}
      <Show when={powerValue()}>
        <div style={{
          position: 'absolute',
          bottom: '4px',
          right: '4px',
          background: 'rgba(0, 0, 0, 0.8)',
          color: powerValue().startsWith('+') ? '#00ff00' : '#ff0000',
          'font-size': '10px',
          'font-weight': '600',
          padding: '2px 6px',
          'border-radius': '4px'
        }}>
          {powerValue()}
        </div>
      </Show>
      
      {/* Info icon - top right (only when selected) */}
      <Show when={props.selected && props.onInfo}>
        <div
          onClick={(e) => {
            e.stopPropagation();
            props.onInfo();
          }}
          style={{
            position: 'absolute',
            top: '4px',
            right: '4px',
            background: '#00aaff',
            color: 'white',
            width: '20px',
            height: '20px',
            'border-radius': '50%',
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'center',
            'font-size': '12px',
            'font-weight': 'bold',
            cursor: 'pointer'
          }}
        >
          i
        </div>
      </Show>
    </button>
  );
}
