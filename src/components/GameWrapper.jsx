import { onMount, onCleanup, createSignal } from 'solid-js';
import Phaser from 'phaser';
import BattleScene from '../scenes/BattleScene';

export default function GameWrapper(props) {
  let gameContainer;
  let game;
  let debugDiv;
  
  const [showVictory, setShowVictory] = createSignal(false);
  const [playerWon, setPlayerWon] = createSignal(false);

  onMount(() => {
    // Setup debug info updater
    const updateDebug = () => {
      if (game && game.scene.scenes[0]) {
        const scene = game.scene.scenes[0];
        if (scene.playerShip && scene.enemyShip && debugDiv) {
          const distance = Phaser.Math.Distance.Between(
            scene.playerShip.pos.x, scene.playerShip.pos.y,
            scene.enemyShip.pos.x, scene.enemyShip.pos.y
          );
          
          const playerWeapons = scene.playerShip.modules.filter(m => m.constructor.name === 'WeaponModule' && m.alive);
          const enemyWeapons = scene.enemyShip.modules.filter(m => m.constructor.name === 'WeaponModule' && m.alive);
          const playerEngines = scene.playerShip.modules.filter(m => m.constructor.name === 'EngineModule' && m.alive);
          const enemyEngines = scene.enemyShip.modules.filter(m => m.constructor.name === 'EngineModule' && m.alive);
          
          // Build module lists
          const playerModuleList = scene.playerShip.modules.map((m, i) => {
            const healthColor = m.health <= 0 ? '#666' : m.health / m.maxHealth > 0.5 ? '#5ba4ff' : m.health / m.maxHealth > 0.25 ? '#ffaa00' : '#ff5b5b';
            const shieldInfo = m.currentShield !== undefined ? ` [${Math.round(m.currentShield)}]` : '';
            const healthText = `${Math.round(m.health)}/${m.maxHealth}${shieldInfo}`;
            return `<div style="display: flex; justify-content: space-between; padding: 1px 0; line-height: 1.2;"><span style="color: #ebebeb;">${m.name}</span><span style="color: ${healthColor}; font-size: 9px;">${healthText}</span></div>`;
          }).join('');
          
          const enemyModuleList = scene.enemyShip.modules.map((m, i) => {
            const healthColor = m.health <= 0 ? '#666' : m.health / m.maxHealth > 0.5 ? '#5ba4ff' : m.health / m.maxHealth > 0.25 ? '#ffaa00' : '#ff5b5b';
            const shieldInfo = m.currentShield !== undefined ? ` [${Math.round(m.currentShield)}]` : '';
            const healthText = `${Math.round(m.health)}/${m.maxHealth}${shieldInfo}`;
            return `<div style="display: flex; justify-content: space-between; padding: 1px 0; line-height: 1.2;"><span style="color: #ebebeb;">${m.name}</span><span style="color: ${healthColor}; font-size: 9px;">${healthText}</span></div>`;
          }).join('');
          
          debugDiv.innerHTML = `
            <div style="padding: 10px; border-bottom: 1px solid #3c3c3c;">
              <div style="font-weight: 600; margin-bottom: 8px; color: #fff;">Battle Stats</div>
              <div style="padding: 4px 0;">Frame: ${scene.frameCount || 0}</div>
              <div style="padding: 4px 0;">Distance: ${Math.round(distance)}</div>
              <div style="padding: 4px 0;">Projectiles: ${scene.projectiles.length}</div>
            </div>
            <div style="padding: 10px; border-bottom: 1px solid #3c3c3c;">
              <div style="color: #5ba4ff; font-weight: 600; margin-bottom: 6px;">PLAYER (${playerWeapons.length}W ${playerEngines.length}E)</div>
              ${playerModuleList}
            </div>
            <div style="padding: 10px;">
              <div style="color: #ff5b5b; font-weight: 600; margin-bottom: 6px;">ENEMY (${enemyWeapons.length}W ${enemyEngines.length}E)</div>
              ${enemyModuleList}
            </div>
          `;
        }
      }
      requestAnimationFrame(updateDebug);
    };
    updateDebug();
    

    const config = {
      type: Phaser.AUTO,
      width: window.innerWidth,
      height: window.innerHeight,
      parent: gameContainer,
      backgroundColor: '#0a0a1a',
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0 },
          debug: false
        }
      },
      scene: BattleScene
    };

    game = new Phaser.Game(config);
    
    // Pass battle config to game
    game.scene.start('BattleScene', {
      playerConfig: props.shipConfig.player,
      enemyConfig: props.shipConfig.enemy || props.shipConfig.player, // Fallback to player if no enemy
      onBack: props.onBack,
      onVictory: (won) => {
        setPlayerWon(won);
        setShowVictory(true);
      }
    });
  });

  onCleanup(() => {
    if (game) {
      game.destroy(true);
    }
  });

  return (
    <>
      <style>{`
        .debug-panel::-webkit-scrollbar {
          width: 6px;
        }
        .debug-panel::-webkit-scrollbar-track {
          background: #1a1a1a;
        }
        .debug-panel::-webkit-scrollbar-thumb {
          background: #3c3c3c;
          border-radius: 3px;
        }
        .debug-panel::-webkit-scrollbar-thumb:hover {
          background: #4c4c4c;
        }
      `}</style>
      <div style={{ width: '100%', height: '100vh', display: 'flex', 'justify-content': 'center', 'align-items': 'center', position: 'relative', overflow: 'hidden' }}>
        <div 
          ref={debugDiv}
          class="debug-panel"
          style={{
            position: 'absolute',
            top: '0',
            left: '0',
            width: '245px',
            color: '#ebebeb',
            'font-family': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
            'font-size': '11px',
            'background-color': '#1f1f1f',
            padding: '0',
            'border-right': '1px solid #3c3c3c',
            'z-index': 1000,
            'pointer-events': 'auto',
            'max-height': '100vh',
            'overflow-y': 'auto',
            'overflow-x': 'hidden',
            'box-shadow': '0 0 10px rgba(0,0,0,0.5)',
            display: 'none'
          }}
        />
        <div ref={gameContainer} />
        
        {/* Victory/Defeat Popup */}
        {showVictory() && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            display: 'flex',
            'flex-direction': 'column',
            'justify-content': 'center',
            'align-items': 'center',
            'background-color': 'rgba(0, 0, 0, 0.7)',
            'z-index': 2000,
            'pointer-events': 'auto'
          }}>
            <div style={{
              'text-align': 'center',
              padding: '40px',
              'background-color': '#1f1f1f',
              'border-radius': '8px',
              border: `2px solid ${playerWon() ? '#00ff00' : '#ff0000'}`,
              'box-shadow': '0 4px 20px rgba(0,0,0,0.5)'
            }}>
              <h1 style={{
                'font-size': '64px',
                'font-weight': 'bold',
                color: playerWon() ? '#00ff00' : '#ff0000',
                margin: '0 0 20px 0',
                'font-family': 'Arial, sans-serif'
              }}>
                {playerWon() ? 'VICTORY!' : 'DEFEAT'}
              </h1>
              <p style={{
                'font-size': '24px',
                color: '#ffffff',
                margin: '0 0 40px 0',
                'font-family': 'Arial, sans-serif'
              }}>
                {playerWon() ? 'Enemy ship destroyed!' : 'Your ship was destroyed!'}
              </p>
              <button
                onClick={() => {
                  // Destroy GUI before going back
                  if (game && game.scene.scenes[0] && game.scene.scenes[0].gui) {
                    game.scene.scenes[0].gui.destroy();
                  }
                  props.onBack();
                }}
                style={{
                  'font-size': '24px',
                  padding: '12px 40px',
                  'background-color': '#444444',
                  color: '#ffffff',
                  border: 'none',
                  'border-radius': '4px',
                  cursor: 'pointer',
                  'font-family': 'Arial, sans-serif',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#666666'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#444444'}
              >
                Continue
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
