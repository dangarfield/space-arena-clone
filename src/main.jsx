import { render } from 'solid-js/web';
import { Router } from '@solidjs/router';
import { GameStateProvider } from './contexts/GameStateContext';
import App from './App';

render(
  () => (
    <GameStateProvider>
      <Router>
        <App />
      </Router>
    </GameStateProvider>
  ),
  document.getElementById('root')
);
