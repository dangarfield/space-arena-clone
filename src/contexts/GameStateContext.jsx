import { createContext, useContext, createSignal } from 'solid-js';

const GameStateContext = createContext();

// Load game state from localStorage
const loadGameState = () => {
  const saved = localStorage.getItem('spacearena');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse saved game state:', e);
    }
  }
  
  return {
    player: { name: 'Commander', level: 1, credits: 1000 },
    hangars: [null, null, null, null, null],
    activeHangar: 0
  };
};

// Save game state to localStorage
const saveGameState = (state) => {
  localStorage.setItem('spacearena', JSON.stringify(state));
};

export function GameStateProvider(props) {
  const [gameState, setGameState] = createSignal(loadGameState());
  
  const updateGameState = (updates) => {
    const newState = { ...gameState(), ...updates };
    setGameState(newState);
    saveGameState(newState);
  };
  
  const updateHangar = (index, config) => {
    const newState = { ...gameState() };
    newState.hangars[index] = config;
    setGameState(newState);
    saveGameState(newState);
  };
  
  const setActiveHangar = (index) => {
    updateGameState({ activeHangar: index });
  };
  
  const value = {
    gameState,
    updateGameState,
    updateHangar,
    setActiveHangar
  };
  
  return (
    <GameStateContext.Provider value={value}>
      {props.children}
    </GameStateContext.Provider>
  );
}

export function useGameState() {
  const context = useContext(GameStateContext);
  if (!context) {
    throw new Error('useGameState must be used within GameStateProvider');
  }
  return context;
}
