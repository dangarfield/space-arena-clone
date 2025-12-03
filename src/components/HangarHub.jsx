import { createSignal, createEffect, createResource, For, Show } from 'solid-js';
import ShipGrid from './ShipGrid';

async function fetchShip(shipId) {
  if (!shipId) return null;
  const response = await fetch(`/data/ships/${shipId}.json`);
  return response.json();
}

async function fetchModules() {
  const [modulesData, localization] = await Promise.all([
    fetch('/data/modules.json').then(r => r.json()),
    fetch('/data/module-localisation.json').then(r => r.json())
  ]);
  return { modulesData, localization };
}

export default function HangarHub(props) {
  const [activeHangar, setActiveHangar] = createSignal(props.initialActiveHangar ?? 0);
  const [gridReady, setGridReady] = createSignal(false);
  
  const hangars = () => props.hangars || [null, null, null, null, null];
  const currentHangar = () => hangars()[activeHangar()];
  
  // Load ship data for current hangar
  // Use a signal to force resource to update when hangar is cleared
  const shipId = () => currentHangar()?.shipId || null;
  const [ship] = createResource(shipId, fetchShip);
  const [modulesLib] = createResource(fetchModules);
  
  // Notify parent when active hangar changes
  const handleHangarChange = (index) => {
    setActiveHangar(index);
    props.onActiveHangarChange?.(index);
  };
  
  // Hydrate modules for display
  const hydratedModules = () => {
    const hangar = currentHangar();
    const lib = modulesLib();
    if (!hangar || !lib || !hangar.modules) return [];
    
    const { modulesData, localization } = lib;
    const loc = localization.en || {};
    
    return hangar.modules.map(placement => {
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
          name: displayName, 
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
  };
  
  // Force re-render when grid is mounted
  createEffect(() => {
    if (ship()) {
      setGridReady(false);
      setTimeout(() => setGridReady(true), 0);
    }
  });

  const handleSelectShip = () => {
    props.onSelectShip(activeHangar());
  };
  
  const handleClearHangar = () => {
    props.onClearHangar?.(activeHangar());
  };

  const handleGoToFitting = () => {
    if (currentHangar()) {
      props.onGoToFitting?.(activeHangar(), currentHangar());
    }
  };

  const handleGoToBattle = () => {
    const hangar = currentHangar();
    if (hangar && ship()) {
      // Pass minimal format: shipId + module placements
      const minimalConfig = {
        shipId: ship().name, // Ship files use 'name' as the identifier
        modules: hangar.modules.map(m => ({
          moduleId: m.moduleId,
          col: m.col,
          row: m.row
        }))
      };
      props.onGoToBattle?.(minimalConfig);
    }
  };
  
  // Check if ship is battle-ready
  const isBattleReady = () => {
    const hangar = currentHangar();
    if (!hangar || !hangar.modules || hangar.modules.length === 0) return false;
    
    const modules = hydratedModules();
    
    // Check for required modules
    const hasWeapon = modules.some(m => m.type === 'weapon');
    const hasReactor = modules.some(m => m.module.name.toLowerCase().includes('reactor'));
    const hasEngine = modules.some(m => 
      m.module.name.toLowerCase().includes('drive') || 
      m.module.name.toLowerCase().includes('thruster') || 
      m.module.name.toLowerCase().includes('engine')
    );
    
    // Simplified check - just verify required module types exist
    // Full power validation happens in FittingScene
    return hasWeapon && hasReactor && hasEngine;
  };

  return (
    <div style={{ 
      display: 'flex', 
      height: '100vh', 
      background: '#0a0a1a',
      gap: '2rem',
      padding: '2rem'
    }}>
      {/* Left - Hangar Slots */}
      <div style={{
        width: '200px',
        display: 'flex',
        'flex-direction': 'column',
        gap: '1rem'
      }}>
        <h2 style={{ 
          'font-size': '24px', 
          color: '#00aaff',
          'margin-bottom': '1rem'
        }}>
          HANGARS
        </h2>
        <For each={hangars()}>
          {(hangar, index) => (
            <div
              onClick={() => handleHangarChange(index())}
              style={{
                background: activeHangar() === index() ? '#003366' : '#001a33',
                border: `3px solid ${activeHangar() === index() ? '#00aaff' : '#003366'}`,
                'border-radius': '8px',
                padding: '1rem',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
            >
              <div style={{ 
                'font-size': '16px', 
                color: '#00aaff',
                'margin-bottom': '0.5rem',
                'font-weight': 'bold'
              }}>
                Hangar {index() + 1}
              </div>
              <Show when={hangar} fallback={
                <div style={{ color: '#666', 'font-size': '13px' }}>Empty</div>
              }>
                <div style={{ color: 'white' }}>
                  <div style={{ 'font-size': '14px', 'margin-bottom': '0.25rem' }}>
                    {hangar.shipId}
                  </div>
                  <div style={{ 'font-size': '11px', color: '#aaa' }}>
                    {hangar.modules?.length || 0} modules
                  </div>
                </div>
              </Show>
            </div>
          )}
        </For>
      </div>

      {/* Center - Ship Preview */}
      <div style={{
        flex: 1,
        display: 'flex',
        'flex-direction': 'column',
        'align-items': 'center',
        'justify-content': 'center',
        gap: '2rem'
      }}>
        <Show when={currentHangar() && ship()} fallback={
          <div style={{ 'text-align': 'center', color: '#666' }}>
            <h2 style={{ 'font-size': '32px', 'margin-bottom': '1rem' }}>
              No ship selected
            </h2>
            <p style={{ 'font-size': '16px' }}>Select a hangar to view ship</p>
          </div>
        }>
          <h2 style={{ 'font-size': '36px', color: '#00aaff', 'margin': '0' }}>
            {ship().name}
          </h2>
          <p style={{ 'font-size': '18px', color: '#aaa', 'margin': '0' }}>
            {ship().class} - Level {ship().unlockLevel}
          </p>
          
          {/* Ship Grid Visualization */}
          <ShipGrid 
            id="hangar-ship-grid"
            ship={ship()}
          >
            {/* Placed modules overlay */}
            <Show when={gridReady()}>
              <For each={hydratedModules()}>
                {(pm) => {
                  const gridEl = document.getElementById('hangar-ship-grid');
                  if (!gridEl) return null;
                  
                  const firstCell = gridEl.querySelector('div');
                  if (!firstCell) return null;
                  
                  const cellRect = firstCell.getBoundingClientRect();
                  const cellWidth = cellRect.width;
                  const cellHeight = cellRect.height;
                  const gap = 2;
                  const padding = 4;
                  
                  return (
                    <div style={{
                      position: 'absolute',
                      left: `${padding + pm.col * (cellWidth + gap)}px`,
                      top: `${padding + pm.row * (cellHeight + gap)}px`,
                      width: `${pm.size.w * cellWidth + (pm.size.w - 1) * gap}px`,
                      height: `${pm.size.h * cellHeight + (pm.size.h - 1) * gap}px`,
                      background: pm.module?.image ? `url(${pm.module.image}) center/contain no-repeat, #${pm.color.toString(16).padStart(6, '0')}` : `#${pm.color.toString(16).padStart(6, '0')}`,
                      'background-size': 'contain',
                      border: '2px solid white',
                      opacity: 0.9
                    }} />
                  );
                }}
              </For>
            </Show>
          </ShipGrid>
        </Show>
      </div>

      {/* Right - Actions */}
      <div style={{
        width: '250px',
        display: 'flex',
        'flex-direction': 'column',
        gap: '1rem'
      }}>
        <h2 style={{ 
          'font-size': '24px', 
          color: '#00aaff',
          'margin-bottom': '1rem'
        }}>
          ACTIONS
        </h2>
        
        <Show when={!currentHangar()}>
          <button
            onClick={handleSelectShip}
            style={{
              'font-size': '18px',
              padding: '15px 20px',
              background: '#005500',
              color: 'white',
              border: 'none',
              'border-radius': '5px',
              cursor: 'pointer',
              width: '100%'
            }}
          >
            SELECT SHIP
          </button>
        </Show>
        
        <Show when={currentHangar()}>
          <button
            onClick={handleSelectShip}
            style={{
              'font-size': '16px',
              padding: '12px 20px',
              background: '#003366',
              color: 'white',
              border: '2px solid #00aaff',
              'border-radius': '5px',
              cursor: 'pointer',
              width: '100%'
            }}
          >
            CHANGE SHIP
          </button>
          
          <button
            onClick={handleGoToFitting}
            style={{
              'font-size': '16px',
              padding: '12px 20px',
              background: '#005500',
              color: 'white',
              border: 'none',
              'border-radius': '5px',
              cursor: 'pointer',
              width: '100%'
            }}
          >
            FITTING
          </button>
          
          <button
            onClick={handleClearHangar}
            style={{
              'font-size': '14px',
              padding: '10px 20px',
              background: 'transparent',
              color: '#ff4444',
              border: '2px solid #ff4444',
              'border-radius': '5px',
              cursor: 'pointer',
              width: '100%'
            }}
          >
            CLEAR HANGAR
          </button>
          
          <button
            onClick={handleGoToBattle}
            disabled={!isBattleReady()}
            style={{
              'font-size': '20px',
              padding: '18px 20px',
              background: isBattleReady() ? '#aa0000' : '#333333',
              color: isBattleReady() ? 'white' : '#666666',
              border: 'none',
              'border-radius': '5px',
              cursor: isBattleReady() ? 'pointer' : 'not-allowed',
              'font-weight': 'bold',
              width: '100%',
              'margin-top': 'auto',
              opacity: isBattleReady() ? 1 : 0.5
            }}
            title={!isBattleReady() ? 'Ship needs weapon, reactor, engine, and sufficient power' : ''}
          >
            GO TO BATTLE
          </button>
        </Show>
      </div>
    </div>
  );
}
