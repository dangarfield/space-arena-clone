import { createSignal, createEffect, createResource, For, Show } from 'solid-js';
import GlobalHeader from './GlobalHeader';
import MainNav from './MainNav';
import HangarSlotsNav from './HangarSlotsNav';
import BottomNav from './BottomNav';
import ShipGrid from './ShipGrid';
import ResearchPage from './ResearchPage';
import LeaderboardPage from './LeaderboardPage';
import ShopPage from './ShopPage';
import SettingsPage from './SettingsPage';
import HangarManagement from './HangarManagement';

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
  const [activePage, setActivePage] = createSignal('hangar');
  const [activeHangar, setActiveHangar] = createSignal(props.initialActiveHangar ?? 0);
  const [gridReady, setGridReady] = createSignal(false);
  const [touchStart, setTouchStart] = createSignal(null);
  const [showManagement, setShowManagement] = createSignal(false);
  
  const hangars = () => props.hangars || [null, null, null, null, null];
  const currentHangar = () => hangars()[activeHangar()];
  
  // Load ship data for current hangar
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
      if (!rawModule) return null;
      
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
          image: `/images/modules/${imageName}.webp`
        }
      };
    }).filter(m => m !== null);
  };
  
  // Force re-render when grid is mounted or page changes
  createEffect(() => {
    if (ship() && activePage() === 'hangar') {
      setGridReady(false);
      setTimeout(() => setGridReady(true), 0);
    }
  });

  const handleGoToFitting = () => {
    if (currentHangar()) {
      props.onGoToFitting?.(activeHangar(), currentHangar());
    } else {
      props.onSelectShip?.(activeHangar());
    }
  };

  const handleGoToBattle = () => {
    const hangar = currentHangar();
    if (hangar && ship()) {
      const minimalConfig = {
        shipId: ship().name,
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
    const hasWeapon = modules.some(m => m.type === 'weapon');
    const hasReactor = modules.some(m => m.module.name.toLowerCase().includes('reactor'));
    const hasEngine = modules.some(m => 
      m.module.name.toLowerCase().includes('drive') || 
      m.module.name.toLowerCase().includes('thruster') || 
      m.module.name.toLowerCase().includes('engine')
    );
    
    return hasWeapon && hasReactor && hasEngine;
  };
  
  // Swipe navigation
  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX);
  };
  
  const handleTouchEnd = (e) => {
    if (!touchStart()) return;
    
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart() - touchEnd;
    
    if (Math.abs(diff) > 50) { // Minimum swipe distance
      if (diff > 0 && activeHangar() < hangars().length - 1) {
        // Swipe left - next hangar
        handleHangarChange(activeHangar() + 1);
      } else if (diff < 0 && activeHangar() > 0) {
        // Swipe right - previous hangar
        handleHangarChange(activeHangar() - 1);
      }
    }
    
    setTouchStart(null);
  };

  return (
    <div class="hangar-hub" style={{
      display: 'flex',
      'flex-direction': 'column',
      height: '100vh',
      background: '#0a0a1a',
      overflow: 'hidden'
    }}>
      {/* Global Header */}
      <GlobalHeader 
        player={props.player}
        onSettings={() => setActivePage('settings')}
        onShop={() => setActivePage('shop')}
      />
      
      {/* Main Navigation */}
      <MainNav activePage={activePage()} onNavigate={setActivePage} />
      
      {/* Page Content */}
      <Show when={activePage() === 'hangar'}>
        <div style={{
          display: 'flex',
          'flex-direction': 'column',
          flex: 1,
          'min-height': 0
        }}>
          {/* Hangar Slots Navigation */}
          <HangarSlotsNav 
            hangars={hangars()}
            activeHangar={activeHangar()}
            onSelectHangar={handleHangarChange}
            onSettings={() => setShowManagement(true)}
          />
          
          {/* Current Hangar Display */}
          <div 
            class="current-hangar"
            style={{
              flex: 1,
              display: 'flex',
              'flex-direction': 'column',
              'align-items': 'center',
              'justify-content': 'center',
              padding: '0.75rem',
              'min-height': 0,
              position: 'relative',
              overflow: 'hidden'
            }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* Navigation Arrows */}
            <Show when={activeHangar() > 0}>
              <button
                onClick={() => handleHangarChange(activeHangar() - 1)}
                style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: '#003366',
                  border: '2px solid #00aaff',
                  'border-radius': '50%',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  'align-items': 'center',
                  'justify-content': 'center',
                  color: '#00aaff',
                  'font-size': '20px',
                  cursor: 'pointer',
                  'z-index': 10
                }}
              >
                ‹
              </button>
            </Show>
            
            <Show when={activeHangar() < hangars().length - 1}>
              <button
                onClick={() => handleHangarChange(activeHangar() + 1)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: '#003366',
                  border: '2px solid #00aaff',
                  'border-radius': '50%',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  'align-items': 'center',
                  'justify-content': 'center',
                  color: '#00aaff',
                  'font-size': '20px',
                  cursor: 'pointer',
                  'z-index': 10
                }}
              >
                ›
              </button>
            </Show>
            
            {/* Edit Fitting Button - Top Right */}
            <Show when={currentHangar() && ship()}>
              <button
                onClick={handleGoToFitting}
                style={{
                  position: 'absolute',
                  top: '0.75rem',
                  right: '0.75rem',
                  background: '#003366',
                  border: '2px solid #00aaff',
                  'border-radius': '50%',
                  width: '40px',
                  height: '40px',
                  display: 'flex',
                  'align-items': 'center',
                  'justify-content': 'center',
                  color: '#00aaff',
                  'font-size': '20px',
                  cursor: 'pointer',
                  'z-index': 10
                }}
                title="Edit Fitting"
              >
                🔧
              </button>
            </Show>
            
            <Show when={currentHangar() && ship()} fallback={
              <div 
                onClick={() => props.onSelectShip?.(activeHangar())}
                style={{ 
                  'text-align': 'center', 
                  color: '#666',
                  display: 'flex',
                  'flex-direction': 'column',
                  'align-items': 'center',
                  'justify-content': 'center',
                  height: '100%',
                  cursor: 'pointer'
                }}
              >
                <div style={{ 'font-size': '64px', 'margin-bottom': '1rem' }}>🚀</div>
                <h2 style={{ 'font-size': '20px', color: '#00aaff', 'margin-bottom': '0.5rem' }}>
                  Empty Hangar
                </h2>
                <a style={{
                  color: '#00aaff',
                  'font-size': '16px',
                  'text-decoration': 'underline',
                  'margin-top': '0.5rem',
                  'pointer-events': 'none'
                }}>
                  Select a ship
                </a>
              </div>
            }>
              <div class='current-ship' style={{
                display: 'flex',
                'flex-direction': 'column',
                'align-items': 'center',
                gap: '0.5rem',
                width: '100%',
                height: '100%',
                'max-width': '500px'
              }}>
                <h2 style={{ 'font-size': '18px', color: '#00aaff', margin: '0', 'text-align': 'center', 'flex-shrink': 0 }}>
                  {ship().name} - {ship().sname}
                </h2>
                
                {/* Ship Grid - scales to fit */}
                <div 
                  onClick={handleGoToFitting}
                  style={{ 
                    cursor: 'pointer',
                    width: '100%',
                    flex: 1,
                    display: 'flex',
                    'align-items': 'center',
                    'justify-content': 'center',
                    'min-height': 0
                  }}
                >
                  <ShipGrid 
                    id="hangar-ship-grid"
                    ship={ship()}
                  >
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
                              opacity: 0.9,
                              'pointer-events': 'none'
                            }} />
                          );
                        }}
                      </For>
                    </Show>
                  </ShipGrid>
                </div>
              </div>
            </Show>
          </div>
          
          {/* Bottom Navigation */}
          <BottomNav 
            gameMode="Career"
            battleReady={isBattleReady()}
            onBattleClick={handleGoToBattle}
          />
        </div>
      </Show>
      
      <Show when={activePage() === 'research'}>
        <ResearchPage />
      </Show>
      
      <Show when={activePage() === 'leaderboard'}>
        <LeaderboardPage />
      </Show>
      
      <Show when={activePage() === 'shop'}>
        <ShopPage />
      </Show>
      
      <Show when={activePage() === 'settings'}>
        <SettingsPage />
      </Show>
      
      {/* Hangar Management Overlay */}
      <Show when={showManagement()}>
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: '#0a0a1a',
          'z-index': 1000,
          display: 'flex',
          'flex-direction': 'column'
        }}>
          <HangarManagement
            player={props.player}
            hangars={hangars()}
            onClose={() => setShowManagement(false)}
            onEdit={(index) => {
              setShowManagement(false);
              handleHangarChange(index);
              props.onGoToFitting?.(index, hangars()[index]);
            }}
            onDelete={(index) => {
              props.onClearHangar?.(index);
            }}
            onSelectShip={(index) => {
              setShowManagement(false);
              props.onSelectShip?.(index);
            }}
          />
        </div>
      </Show>
    </div>
  );
}
