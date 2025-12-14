import { createSignal, createEffect, createResource, For, Show } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { useGameState } from '../contexts/GameStateContext';
import GlobalHeader from './GlobalHeader';
import MainNav from './MainNav';
import HangarSlotsNav from './HangarSlotsNav';
import BottomNav from './BottomNav';
import ShipGrid from './ShipGrid';
import ResearchPage from './ResearchPage';
import LeaderboardPage from './LeaderboardPage';
import ShopPage from './ShopPage';
import SettingsPage from './SettingsPage';
import GameModePage from './GameModePage';
import DatabasePage from './DatabasePage';
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

export default function HangarHub() {
  const navigate = useNavigate();
  const { gameState, setActiveHangar: setActiveHangarInState, updateHangar } = useGameState();
  
  const [activePage, setActivePage] = createSignal('hangar');
  const [gridReady, setGridReady] = createSignal(false);
  const [touchStart, setTouchStart] = createSignal(null);
  const [showManagement, setShowManagement] = createSignal(false);
  
  const hangars = () => gameState().hangars;
  const activeHangar = () => gameState().activeHangar;
  const currentHangar = () => hangars()[activeHangar()];
  const player = () => gameState().player;
  
  // Load ship data for current hangar
  const shipId = () => currentHangar()?.shipId || null;
  const [ship] = createResource(shipId, fetchShip);
  const [modulesLib] = createResource(fetchModules);
  
  // Handle hangar changes
  const handleHangarChange = (index) => {
    setActiveHangarInState(index);
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
      navigate(`/fitting/${activeHangar()}`);
    } else {
      navigate(`/ship-select/${activeHangar()}`);
    }
  };

  const handleGoToBattle = async () => {
    const hangar = currentHangar();
    if (!hangar || !ship()) return;
    
    // Validate ship configuration before battle
    const isValid = await validateShipConfig(hangar);
    if (isValid) {
      navigate('/battle');
    }
  };
  
  // Validate ship configuration (same logic as fitting scene)
  const validateShipConfig = async (config) => {
    if (!config || !config.modules || config.modules.length === 0) {
      alert('Ship has no modules! Add some modules first.');
      return false;
    }
    
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
  
  // Check if ship is battle-ready (for UI display)
  const isBattleReady = () => {
    const hangar = currentHangar();
    if (!hangar || !hangar.modules || hangar.modules.length === 0) return false;
    
    // Simple check for UI - detailed validation happens in handleGoToBattle
    return hangar.modules.length > 0;
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
        player={player()}
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
                onClick={() => navigate(`/ship-select/${activeHangar()}`)}
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
            onGameModeClick={() => setActivePage('gamemode')}
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
      
      {/* Game Mode Overlay */}
      <Show when={activePage() === 'gamemode'}>
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: '#0a0a1a',
          'z-index': 1000
        }}>
          <GameModePage
            player={player()}
            onBack={() => setActivePage('hangar')}
          />
        </div>
      </Show>
      
      <Show when={activePage() === 'database'}>
        <DatabasePage />
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
            player={player()}
            hangars={hangars()}
            onClose={() => setShowManagement(false)}
            onEdit={(index) => {
              setShowManagement(false);
              handleHangarChange(index);
              navigate(`/fitting/${index}`);
            }}
            onDelete={(index) => {
              updateHangar(index, null);
            }}
            onSelectShip={(index) => {
              setShowManagement(false);
              navigate(`/ship-select/${index}`);
            }}
          />
        </div>
      </Show>
    </div>
  );
}
