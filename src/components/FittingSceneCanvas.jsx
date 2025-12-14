import { onMount, onCleanup, createEffect, createSignal, createResource, For, Show } from 'solid-js';
import { useNavigate, useParams } from '@solidjs/router';
import { useGameState } from '../contexts/GameStateContext';
import Phaser from 'phaser';
import BattleScene from '../scenes/BattleScene';
import GlobalHeader from './GlobalHeader';

async function fetchModules() {
  const [modulesData, localization] = await Promise.all([
    fetch('/data/modules.json').then(r => r.json()),
    fetch('/data/module-localisation.json').then(r => r.json())
  ]);
  
  const loc = localization.en || {};
  
  const convertModule = (key, module) => {
    const displayName = loc[module.name] || module.name;
    const modification = module.Modification || '';
    const fullName = modification ? `${displayName} (${modification})` : displayName;
    const imageName = displayName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    
    return {
      name: fullName,
      moduleKey: key,
      image: `/images/modules/${imageName}.webp`,
      requiredLevel: module.rl || 0,
      category: module.c || 0,
      w: module.w,
      h: module.h,
      pu: module.pu || 0,
      pg: module.pg || 0
    };
  };
  
  const modules = Object.entries(modulesData).map(([key, mod]) => convertModule(key, mod));
  
  return {
    weapons: modules.filter(m => (m.category & 1) || (m.category & 2) || (m.category & 4)),
    defense: modules.filter(m => (m.category & 8) || (m.category & 16)),
    utility: modules.filter(m => (m.category & 64) || (m.category & 128) || (m.category & 32) || (m.category & 256))
  };
}

export default function FittingSceneCanvas() {
  const navigate = useNavigate();
  const params = useParams();
  const { gameState, updateHangar } = useGameState();
  
  const hangarIndex = () => parseInt(params.hangarIndex);
  const player = () => gameState().player;
  const currentHangar = () => gameState().hangars[hangarIndex()];
  
  const [modules] = createResource(fetchModules);
  const [activeTab, setActiveTab] = createSignal('weapons');
  const [activeSubTab, setActiveSubTab] = createSignal('ballistic');
  const [selectedModule, setSelectedModule] = createSignal(null);
  const [menuLevel, setMenuLevel] = createSignal(0);
  const [workingConfig, setWorkingConfig] = createSignal(null); // Local working copy
  const [showVisualHelpers, setShowVisualHelpers] = createSignal(true);
  
  let gameContainer;
  let game;
  let scene;
  
  const availableModules = () => {
    const mods = modules();
    if (!mods) return { weapons: [], defense: [], utility: [] };
    
    // Filter by level (ship level + 5)
    const maxLevel = 10; // TODO: Get from ship
    return {
      weapons: mods.weapons.filter(m => m.requiredLevel <= maxLevel),
      defense: mods.defense.filter(m => m.requiredLevel <= maxLevel),
      utility: mods.utility.filter(m => m.requiredLevel <= maxLevel)
    };
  };
  
  onMount(() => {
    const hangar = currentHangar();
    
    if (!hangar || !hangar.shipId) {
      console.error('No hangar or shipId found');
      navigate('/');
      return;
    }
    
    // Initialize working config
    setWorkingConfig({ ...hangar, modules: [...(hangar.modules || [])] });
    
    const config = {
      type: Phaser.AUTO,
      parent: gameContainer,
      width: window.innerWidth,
      height: window.innerHeight - 200, // Account for header + module selector
      backgroundColor: '#0a0a1a',
      scene: [BattleScene]
    };
    
    console.log('Creating Phaser game...');
    game = new Phaser.Game(config);
    
    // Wait for scene to be ready
    game.events.once('ready', () => {
      scene = game.scene.getScene('BattleScene');
      console.log('Scene ready:', scene);
    });
    
    console.log('Starting scene with config:', workingConfig());
    // Start scene in fitting mode
    game.scene.start('BattleScene', {
      fittingMode: true,
      playerConfig: workingConfig(),
      onModuleClick: handleModuleRemove,
      onCellClick: handleCellClick,
      selectedModule: null,
      showFiringCones: true,
      showShieldRadius: true,
      showPDRadius: true
    });
    
    // Handle resize
    const handleResize = () => {
      if (game) {
        game.scale.resize(window.innerWidth, window.innerHeight - 200);
      }
    };
    window.addEventListener('resize', handleResize);
    
    onCleanup(() => {
      window.removeEventListener('resize', handleResize);
      if (game) {
        game.destroy(true);
      }
    });
  });
  
  const handleModuleSelect = (module, type, color) => {
    setSelectedModule({ module, type, color });
    if (scene) {
      scene.selectedModule = module;
      scene.drawFittingOverlays(); // Redraw overlays with new selection
    }
  };
  
  const canPlaceModule = (col, row, module, shape) => {
    const w = module.w;
    const h = module.h;
    
    // Check bounds
    if (col < 0 || row < 0 || col + w > shape[0].length || row + h > shape.length) {
      return false;
    }
    
    // Check cell types and overlaps
    const isEngine = (module.category & 64) !== 0;
    const current = workingConfig();
    
    for (let r = row; r < row + h; r++) {
      for (let c = col; c < col + w; c++) {
        const cellType = shape[r][c];
        
        // Cell must exist (not 0)
        if (cellType === 0) return false;
        
        // Engines only on engine cells (4 or 5), others only on device cells (1, 2, 3, or 5)
        if (isEngine) {
          if (cellType !== 4 && cellType !== 5) return false;
        } else {
          if (cellType !== 1 && cellType !== 2 && cellType !== 3 && cellType !== 5) return false;
        }
        
        // Check for overlaps with existing modules
        const overlap = current.modules.some(m => {
          const mw = m.w || 1;
          const mh = m.h || 1;
          return !(c >= m.col + mw || c + 1 <= m.col || r >= m.row + mh || r + 1 <= m.row);
        });
        
        if (overlap) return false;
      }
    }
    
    return true;
  };
  
  const handleCellClick = async (col, row) => {
    console.log('🔥 handleCellClick called with:', col, row);
    
    const selected = selectedModule();
    console.log('Selected module:', selected);
    
    if (!selected) {
      console.log('❌ No module selected, returning');
      return;
    }
    
    console.log('✅ Cell clicked:', col, row, 'Selected module:', selected.module.name, 'Key:', selected.module.moduleKey);
    
    // Check if there's already a module at this position
    console.log('🔍 Searching for existing module at', col, row);
    console.log('Current modules:', workingConfig().modules);
    
    // Load modules data to get dimensions
    const modulesData = await fetch('/data/modules.json').then(r => r.json());
    
    const existingModule = workingConfig().modules.find(m => {
      const moduleData = modulesData[m.moduleId];
      const mw = moduleData?.w || 1;
      const mh = moduleData?.h || 1;
      const isInBounds = col >= m.col && col < m.col + mw && row >= m.row && row < m.row + mh;
      console.log(`Module ${m.moduleId} at (${m.col},${m.row}) size ${mw}x${mh}: clicked (${col},${row}) is in bounds?`, isInBounds);
      return isInBounds;
    });
    
    console.log('Found existing module:', existingModule);
    
    if (existingModule) {
      console.log('Found existing module:', existingModule);
      console.log('Selected module key:', selected.module.moduleKey);
      console.log('Existing module ID:', existingModule.moduleId);
      console.log('Are they equal?', existingModule.moduleId === selected.module.moduleKey);
      console.log('Selected module object:', selected.module);
      
      // If clicking on the same module type that's selected, remove it
      if (existingModule.moduleId === selected.module.moduleKey) {
        console.log('✅ REMOVING existing module of same type:', existingModule.moduleId);
        
        const newModules = workingConfig().modules.filter(m => 
          !(m.col === existingModule.col && m.row === existingModule.row)
        );
        
        console.log('Old modules count:', workingConfig().modules.length);
        console.log('New modules count:', newModules.length);
        
        const newConfig = {
          ...workingConfig(),
          modules: newModules
        };
        
        setWorkingConfig(newConfig);
        
        // Update scene
        if (scene && scene.updateShipConfig) {
          await scene.updateShipConfig(newConfig);
        }
        
        return;
      } else {
        console.log('❌ Cell occupied by DIFFERENT module, not placing');
        console.log('Expected:', selected.module.moduleKey, 'Found:', existingModule.moduleId);
        return; // Don't place if cell is occupied by different module
      }
    }
    
    // Load ship data and convert to shape (same as ShipGrid)
    const shipData = await fetch(`/data/ships/${workingConfig().shipId}.json`).then(r => r.json());
    
    // Convert g to shape (180 degree rotation, same as ShipGrid)
    const shape = [];
    for (let row = shipData.h - 1; row >= 0; row--) {
      const rowCells = [];
      for (let col = shipData.w - 1; col >= 0; col--) {
        rowCells.push(shipData.g[row * shipData.w + col]);
      }
      shape.push(rowCells);
    }
    
    console.log('Cell type at', col, row, '=', shape[row]?.[col]);
    
    if (!canPlaceModule(col, row, selected.module, shape)) {
      console.log('Cannot place module here');
      return;
    }
    
    console.log('Placing module at', col, row);
    
    // Add module to working config (not saved yet)
    const newModules = [...workingConfig().modules, {
      moduleId: selected.module.moduleKey,
      col,
      row
    }];
    
    const newConfig = {
      ...workingConfig(),
      modules: newModules
    };
    
    setWorkingConfig(newConfig);
    
    // Update scene
    if (scene && scene.updateShipConfig) {
      await scene.updateShipConfig(newConfig);
    }
  };
  
  const handleModuleRemove = async (moduleData) => {
    console.log('🎯 Module clicked:', moduleData);
    console.log('🔥 NEW CODE VERSION - DEBUGGING ACTIVE');
    
    const selected = selectedModule();
    console.log('Selected module:', selected);
    
    if (selected) {
      // Find the clicked module to get its moduleId
      const currentConfig = workingConfig();
      console.log('All modules in config:', currentConfig.modules);
      console.log('Looking for module at:', moduleData.col, moduleData.row);
      
      let clickedModule = null;
      for (const m of currentConfig.modules) {
        console.log(`Checking module ${m.moduleId} at (${m.col},${m.row})`);
        if (m.col === moduleData.col && m.row === moduleData.row) {
          clickedModule = m;
          console.log('✅ Found matching module!');
          break;
        }
      }
      
      console.log('Final clicked module data:', clickedModule);
      console.log('Selected module key:', selected.module.moduleKey);
      console.log('Clicked module ID:', clickedModule?.moduleId);
      
      if (clickedModule && clickedModule.moduleId === selected.module.moduleKey) {
        console.log('✅ REMOVING module - same type as selected');
        
        // Remove the module
        const newModules = workingConfig().modules.filter(m => 
          !(m.col === moduleData.col && m.row === moduleData.row)
        );
        
        const newConfig = {
          ...workingConfig(),
          modules: newModules
        };
        
        setWorkingConfig(newConfig);
        
        // Update scene
        if (scene && scene.updateShipConfig) {
          await scene.updateShipConfig(newConfig);
        }
      } else if (clickedModule) {
        console.log('🔄 REPLACING module - different type');
        
        // Get the new module's dimensions
        const newModuleW = selected.module.w || 1;
        const newModuleH = selected.module.h || 1;
        const placementCol = moduleData.col;
        const placementRow = moduleData.row;
        
        console.log(`New module size: ${newModuleW}x${newModuleH} at (${placementCol},${placementRow})`);
        
        // Load modules data to get dimensions for overlap checking
        const modulesData = await fetch('/data/modules.json').then(r => r.json());
        
        // Find all modules that overlap with the new module's footprint
        const overlappingModules = workingConfig().modules.filter(m => {
          const moduleData = modulesData[m.moduleId];
          const mw = moduleData?.w || 1;
          const mh = moduleData?.h || 1;
          
          // Check if modules overlap using rectangle intersection
          const overlap = !(
            placementCol >= m.col + mw ||           // new module is to the right
            placementCol + newModuleW <= m.col ||   // new module is to the left
            placementRow >= m.row + mh ||           // new module is below
            placementRow + newModuleH <= m.row      // new module is above
          );
          
          if (overlap) {
            console.log(`🗑️ Removing overlapping module: ${m.moduleId} at (${m.col},${m.row}) size ${mw}x${mh}`);
          }
          
          return overlap;
        });
        
        // Remove all overlapping modules and add the new one
        const newModules = workingConfig().modules.filter(m => 
          !overlappingModules.some(overlap => overlap.col === m.col && overlap.row === m.row)
        ).concat([{
          moduleId: selected.module.moduleKey,
          col: placementCol,
          row: placementRow
        }]);
        
        console.log(`Removed ${overlappingModules.length} overlapping modules`);
        
        const newConfig = {
          ...workingConfig(),
          modules: newModules
        };
        
        setWorkingConfig(newConfig);
        
        // Update scene
        if (scene && scene.updateShipConfig) {
          await scene.updateShipConfig(newConfig);
        }
      }
    } else {
      console.log('✅ REMOVING module - no module selected (normal removal)');
      
      // Normal removal when no module selected
      const newModules = workingConfig().modules.filter(m => 
        !(m.col === moduleData.col && m.row === moduleData.row)
      );
      
      const newConfig = {
        ...workingConfig(),
        modules: newModules
      };
      
      setWorkingConfig(newConfig);
      
      // Update scene
      if (scene && scene.updateShipConfig) {
        await scene.updateShipConfig(newConfig);
      }
    }
  };
  
  const validate = async () => {
    const config = workingConfig();
    if (!config || !config.modules) return false;
    
    // Load modules data
    const modulesData = await fetch('/data/modules.json').then(r => r.json());
    
    // Check power balance
    let power = 0;
    config.modules.forEach(m => {
      const mod = modulesData[m.moduleId];
      if (!mod) return;
      power += (mod.pg || 0) - (mod.pu || 0);
    });
    
    if (power < 0) {
      alert('Power deficit! Need more reactors or fewer power-consuming modules.');
      return false;
    }
    
    // Reactor requirement removed - power balance check above is sufficient
    
    // Check for at least one engine
    const hasEngine = config.modules.some(m => {
      const mod = modulesData[m.moduleId];
      return mod && (mod.c & 64);
    });
    
    if (!hasEngine) {
      alert('Need at least one engine!');
      return false;
    }
    
    return true;
  };
  
  const saveFitting = async () => {
    if (!await validate()) return;
    
    // Save working config to hangar
    updateHangar(hangarIndex(), workingConfig());
    navigate('/');
  };
  
  const toggleVisualHelpers = () => {
    const newState = !showVisualHelpers();
    setShowVisualHelpers(newState);
    
    if (scene) {
      // Update visibility flags in the scene
      scene.showFiringCones = newState;
      scene.showShieldRadius = newState;
      scene.showPDRadius = newState;
      
      // Update visibility of all existing visuals
      if (scene.playerShip && scene.playerShip.modules) {
        scene.playerShip.modules.forEach(module => {
          if (module.rangeGraphics) module.rangeGraphics.setVisible(newState);
          if (module.shieldGraphics) module.shieldGraphics.setVisible(newState);
          if (module.pdGraphics) module.pdGraphics.setVisible(newState);
        });
      }
    }
  };
  
  const resetFitting = async () => {
    // Reset to saved hangar state
    const original = currentHangar();
    setWorkingConfig({ ...original, modules: [...(original.modules || [])] });
    
    // Update scene
    if (scene && scene.updateShipConfig) {
      await scene.updateShipConfig(workingConfig());
    }
    
    setSelectedModule(null);
  };
  
  // Safety check
  if (!currentHangar() || !currentHangar().shipId) {
    return (
      <div style={{
        display: 'flex',
        'align-items': 'center',
        'justify-content': 'center',
        height: '100vh',
        color: 'white'
      }}>
        No ship selected
      </div>
    );
  }
  
  return (
    <div style={{
      display: 'flex',
      'flex-direction': 'column',
      height: '100vh',
      background: '#0a0a1a'
    }}>
      <GlobalHeader player={player()} />
      
      {/* Title Bar */}
      <div style={{
        display: 'flex',
        'align-items': 'center',
        'justify-content': 'center',
        height: '45px',
        padding: '0 0.75rem',
        'border-bottom': '2px solid #003366',
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
        <h2 style={{ 'font-size': '18px', color: '#00aaff', margin: 0 }}>
          SHIP FITTING
        </h2>
        <div style={{
          position: 'absolute',
          right: '0.75rem',
          display: 'flex',
          gap: '0.5rem'
        }}>
          <button onClick={toggleVisualHelpers} style={{
            background: showVisualHelpers() ? '#003366' : '#333333', 
            border: '2px solid', 
            'border-color': showVisualHelpers() ? '#00aaff' : '#666666',
            color: showVisualHelpers() ? '#00aaff' : '#999999',
            'font-size': '14px', width: '32px', height: '32px',
            'border-radius': '6px', cursor: 'pointer',
            display: 'flex', 'align-items': 'center', 'justify-content': 'center',
            transition: 'all 0.2s'
          }}>👁</button>
          <button onClick={resetFitting} style={{
            background: '#663300', border: 'none', color: 'white',
            'font-size': '16px', width: '32px', height: '32px',
            'border-radius': '6px', cursor: 'pointer',
            display: 'flex', 'align-items': 'center', 'justify-content': 'center'
          }}>↻</button>
          <button onClick={saveFitting} style={{
            background: '#005500', border: 'none', color: 'white',
            'font-size': '16px', width: '32px', height: '32px',
            'border-radius': '6px', cursor: 'pointer',
            display: 'flex', 'align-items': 'center', 'justify-content': 'center'
          }}>✓</button>
        </div>
      </div>
      
      {/* Phaser Game Container */}
      <div ref={gameContainer} style={{ flex: 1, position: 'relative' }}>
        {/* Resource Display */}
        <div style={{
          position: 'absolute',
          top: '1rem',
          right: '1rem',
          background: 'rgba(0, 0, 0, 0.8)',
          border: '2px solid #00aaff',
          'border-radius': '8px',
          padding: '0.75rem',
          color: 'white',
          'font-size': '14px',
          'min-width': '150px'
        }}>
          <ResourceDisplay hangar={workingConfig()} />
        </div>
      </div>
      
      {/* Module Selector */}
      <div style={{
        'flex-shrink': 0,
        'border-top': '2px solid #003366',
        background: '#0a0a1a',
        display: 'flex',
        gap: '0.5rem',
        padding: '0.75rem'
      }}>
        <div class="module-scroll" style={{
          display: 'flex',
          'align-items': 'center',
          gap: '0.5rem',
          flex: 1,
          'overflow-x': menuLevel() === 2 ? 'auto' : 'visible',
          'overflow-y': 'hidden',
          '-webkit-overflow-scrolling': 'touch',
          'scroll-behavior': 'smooth'
        }}>
          {/* Level 0: Categories */}
          <Show when={menuLevel() === 0}>
            <ModuleCard label="WEAPONS" color="#ff4444" onClick={() => { setActiveTab('weapons'); setMenuLevel(1); }} />
            <ModuleCard label="DEFENSE" color="#4444ff" onClick={() => { setActiveTab('defense'); setMenuLevel(1); }} />
            <ModuleCard label="UTILITY" color="#ffaa00" onClick={() => { setActiveTab('utility'); setMenuLevel(1); }} />
          </Show>
          
          {/* Level 1: Subcategories */}
          <Show when={menuLevel() === 1}>
            <Show when={activeTab() === 'weapons'}>
              <ModuleCard label="Ballistic" color="#ff6666" onClick={() => { setActiveSubTab('ballistic'); setMenuLevel(2); }} />
              <ModuleCard label="Laser" color="#ff6666" onClick={() => { setActiveSubTab('laser'); setMenuLevel(2); }} />
              <ModuleCard label="Missile" color="#ff6666" onClick={() => { setActiveSubTab('missile'); setMenuLevel(2); }} />
            </Show>
            <Show when={activeTab() === 'defense'}>
              <ModuleCard label="Armor" color="#6666ff" onClick={() => { setActiveSubTab('armor'); setMenuLevel(2); }} />
              <ModuleCard label="Shield" color="#6666ff" onClick={() => { setActiveSubTab('shield'); setMenuLevel(2); }} />
            </Show>
            <Show when={activeTab() === 'utility'}>
              <ModuleCard label="Reactor" color="#ffcc66" onClick={() => { setActiveSubTab('reactor'); setMenuLevel(2); }} />
              <ModuleCard label="Engine" color="#ffcc66" onClick={() => { setActiveSubTab('engine'); setMenuLevel(2); }} />
              <ModuleCard label="Support" color="#ffcc66" onClick={() => { setActiveSubTab('support'); setMenuLevel(2); }} />
            </Show>
          </Show>
          
          {/* Level 2: Modules */}
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
                    selected={selectedModule()?.module === module}
                    onClick={() => handleModuleSelect(module, 'weapon', 0xff4444)}
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
                    selected={selectedModule()?.module === module}
                    onClick={() => handleModuleSelect(module, 'defense', 0x4444ff)}
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
                    selected={selectedModule()?.module === module}
                    onClick={() => handleModuleSelect(module, 'utility', 0xffaa00)}
                  />
                )}
              </For>
            </Show>
          </Show>
        </div>
        
        <Show when={menuLevel() > 0}>
          <button onClick={() => setMenuLevel(menuLevel() - 1)} style={{
            'flex-shrink': 0, background: '#003366', border: '2px solid #00aaff',
            'border-radius': '8px', width: '30px', height: '60px',
            display: 'flex', 'align-items': 'center', 'justify-content': 'center',
            color: '#00aaff', 'font-size': '24px', 'font-weight': 'bold', cursor: 'pointer'
          }}>‹</button>
        </Show>
      </div>
      
      <style>{`
        .module-scroll::-webkit-scrollbar { display: none; }
        .module-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

function ResourceDisplay(props) {
  const [resources, setResources] = createSignal({ power: 0, mass: 0, armor: 0, cells: 0 });
  
  createEffect(async () => {
    if (!props.hangar || !props.hangar.modules) {
      setResources({ power: 0, mass: 0, armor: 0, cells: 0 });
      return;
    }
    
    const modulesData = await fetch('/data/modules.json').then(r => r.json());
    
    let power = 0, mass = 0, armor = 0, cells = 0;
    
    props.hangar.modules.forEach(m => {
      const mod = modulesData[m.moduleId];
      if (!mod) return;
      
      power += (mod.pg || 0) - (mod.pu || 0);
      mass += mod.m || 0;
      armor += mod.a || 0;
      cells += (mod.w || 1) * (mod.h || 1);
    });
    
    setResources({ power, mass, armor, cells });
  });
  
  return (
    <>
      <div style={{ display: 'flex', 'justify-content': 'space-between', 'margin-bottom': '0.5rem' }}>
        <span>Power:</span>
        <span style={{ color: resources().power >= 0 ? '#00ff00' : '#ff0000', 'font-weight': '600' }}>
          {resources().power >= 0 ? '+' : ''}{resources().power}
        </span>
      </div>
      <div style={{ display: 'flex', 'justify-content': 'space-between', 'margin-bottom': '0.5rem' }}>
        <span>Mass:</span>
        <span style={{ 'font-weight': '600' }}>{resources().mass}</span>
      </div>
      <div style={{ display: 'flex', 'justify-content': 'space-between', 'margin-bottom': '0.5rem' }}>
        <span>Armor:</span>
        <span style={{ 'font-weight': '600' }}>{resources().armor}</span>
      </div>
      <div style={{ display: 'flex', 'justify-content': 'space-between' }}>
        <span>Cells:</span>
        <span style={{ 'font-weight': '600' }}>{resources().cells}</span>
      </div>
    </>
  );
}

function ModuleCard(props) {
  if (props.label) {
    return (
      <button onClick={props.onClick} style={{
        flex: 1, 'flex-shrink': 0, 'min-width': '100px', height: '60px',
        background: props.color, border: '2px solid #00aaff', 'border-radius': '8px',
        color: 'white', 'font-size': '14px', 'font-weight': '600', cursor: 'pointer',
        display: 'flex', 'align-items': 'center', 'justify-content': 'center',
        'text-align': 'center', padding: '0.5rem'
      }}>{props.label}</button>
    );
  }
  
  const powerValue = () => {
    const net = (props.module.pg || 0) - (props.module.pu || 0);
    if (net > 0) return `+${net}`;
    if (net < 0) return `${net}`;
    return null;
  };
  
  return (
    <button onClick={props.onClick} style={{
      'flex-shrink': 0, width: '60px', height: '60px',
      background: props.module.image ? `url(${props.module.image}) center/contain no-repeat, #003366` : '#003366',
      'background-size': 'contain',
      border: props.selected ? '3px solid #00aaff' : '2px solid #0055aa',
      'border-radius': '8px', cursor: 'pointer', position: 'relative', padding: 0
    }}>
      <div style={{
        position: 'absolute', bottom: '4px', left: '4px',
        background: 'rgba(0, 0, 0, 0.8)', color: 'white',
        'font-size': '10px', 'font-weight': '600',
        padding: '2px 6px', 'border-radius': '4px'
      }}>{props.module.w}x{props.module.h}</div>
      <Show when={powerValue()}>
        <div style={{
          position: 'absolute', bottom: '4px', right: '4px',
          background: 'rgba(0, 0, 0, 0.8)',
          color: powerValue().startsWith('+') ? '#00ff00' : '#ff0000',
          'font-size': '10px', 'font-weight': '600',
          padding: '2px 6px', 'border-radius': '4px'
        }}>{powerValue()}</div>
      </Show>
    </button>
  );
}
