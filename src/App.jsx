import { createSignal, Show } from 'solid-js';
import HangarHub from './components/HangarHub';
import ShipSelect from './components/ShipSelect';
import FittingScene from './components/FittingScene';
import GameWrapper from './components/GameWrapper';

// Load game state from localStorage
const loadGameState = () => {
  const saved = localStorage.getItem('spacearena');
  if (saved) {
    return JSON.parse(saved);
  }
  return {
    player: {
      name: 'Commander',
      level: 1,
      credits: 10000,
      celestium: 0
    },
    career: {
      currentCampaign: 0,
      currentLevel: 0,
      completedLevels: []
    },
    hangars: [null, null, null, null, null],
    activeHangar: 0
  };
};

// Save game state to localStorage
const saveGameState = (state) => {
  localStorage.setItem('spacearena', JSON.stringify(state));
};

export default function App() {
  const [gameState, setGameState] = createSignal(loadGameState());
  const [currentScene, setCurrentScene] = createSignal('hangar');
  const [activeHangar, setActiveHangar] = createSignal(gameState().activeHangar ?? 0);
  const [shipConfiguration, setShipConfiguration] = createSignal(null);
  
  const hangars = () => gameState().hangars;
  
  // Save active hangar when it changes
  const handleActiveHangarChange = (index) => {
    setActiveHangar(index);
    const newState = { ...gameState(), activeHangar: index };
    setGameState(newState);
    saveGameState(newState);
  };

  const handleSelectShip = (hangarIndex) => {
    setActiveHangar(hangarIndex);
    setCurrentScene('shipSelect');
  };
  
  const handleClearHangar = (hangarIndex) => {
    const newState = { ...gameState() };
    newState.hangars[hangarIndex] = null;
    setGameState(newState);
    saveGameState(newState);
  };

  const handleShipSelected = (ship) => {
    // Store minimal data - just ship ID and empty modules
    const config = {
      shipId: ship.id,
      modules: []
    };
    
    // Update game state
    const newState = { ...gameState() };
    newState.hangars[activeHangar()] = config;
    setGameState(newState);
    saveGameState(newState);
    
    // Go directly to fitting scene
    setCurrentScene('fitting');
  };

  const handleGoToFitting = (hangarIndex, shipConfig) => {
    setActiveHangar(hangarIndex);
    setCurrentScene('fitting');
  };

  const handleSaveFitting = (config) => {
    // Config already has minimal format from FittingScene
    const newState = { ...gameState() };
    newState.hangars[activeHangar()] = config;
    setGameState(newState);
    saveGameState(newState);
    
    setCurrentScene('hangar');
  };

  const handleGoToBattle = (shipConfig) => {
    // Pass both player (hangar 0) and enemy (hangar 1) configs
    setShipConfiguration({
      player: shipConfig,
      enemy: hangars()[1] // Hangar 2 (index 1)
    });
    setCurrentScene('game');
  };

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <Show when={currentScene() === 'hangar'}>
        <HangarHub 
          player={gameState().player}
          hangars={hangars()}
          initialActiveHangar={activeHangar()}
          onActiveHangarChange={handleActiveHangarChange}
          onSelectShip={handleSelectShip}
          onClearHangar={handleClearHangar}
          onGoToFitting={handleGoToFitting}
          onGoToBattle={handleGoToBattle}
        />
      </Show>      
      <Show when={currentScene() === 'shipSelect'}>
        <ShipSelect 
          player={gameState().player}
          onBack={() => setCurrentScene('hangar')}
          onSelect={handleShipSelected}
        />
      </Show>
      
      <Show when={currentScene() === 'fitting'}>
        <FittingScene 
          shipId={hangars()[activeHangar()]?.shipId}
          initialModules={hangars()[activeHangar()]?.modules || []}
          hangarIndex={activeHangar()}
          onBack={() => setCurrentScene('hangar')}
          onSave={handleSaveFitting}
        />
      </Show>
      
      <Show when={currentScene() === 'game'}>
        <GameWrapper 
          shipConfig={shipConfiguration()}
          onBack={() => setCurrentScene('hangar')}
        />
      </Show>
    </div>
  );
}
