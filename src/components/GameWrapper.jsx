import { onMount, onCleanup } from 'solid-js';
import Phaser from 'phaser';
import BattleScene from '../scenes/BattleScene';

export default function GameWrapper(props) {
  let gameContainer;
  let game;
  let debugDiv;

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
          
          debugDiv.innerHTML = `
            <div>Frame: ${scene.frameCount || 0}</div>
            <div>Distance: ${Math.round(distance)}</div>
            <div>Camera Zoom: ${scene.cameras.main.zoom.toFixed(2)}</div>
            <div>Camera Pos: ${Math.round(scene.cameras.main.scrollX)}, ${Math.round(scene.cameras.main.scrollY)}</div>
            <div>Player Pos: ${Math.round(scene.playerShip.pos.x)}, ${Math.round(scene.playerShip.pos.y)}</div>
            <div>Player Rot: ${(scene.playerShip.rotation * 180 / Math.PI).toFixed(1)}°</div>
            <div>Player Vel: ${scene.playerShip.velocity.x.toFixed(1)}, ${scene.playerShip.velocity.y.toFixed(1)}</div>
            <div>Enemy Pos: ${Math.round(scene.enemyShip.pos.x)}, ${Math.round(scene.enemyShip.pos.y)}</div>
            <div>Enemy Rot: ${(scene.enemyShip.rotation * 180 / Math.PI).toFixed(1)}°</div>
            <div>Player: ${playerWeapons.length}W ${playerEngines.length}E</div>
            <div>Enemy: ${enemyWeapons.length}W ${enemyEngines.length}E</div>
            <div>Projectiles: ${scene.projectiles.length}</div>
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
      onBack: props.onBack
    });
  });

  onCleanup(() => {
    if (game) {
      game.destroy(true);
    }
  });

  return (
    <div style={{ width: '100%', height: '100vh', display: 'flex', 'justify-content': 'center', 'align-items': 'center', position: 'relative' }}>
      <div 
        ref={debugDiv}
        style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          color: '#00ff00',
          'font-family': 'monospace',
          'font-size': '16px',
          'background-color': 'rgba(0, 0, 0, 0.8)',
          padding: '15px',
          'border-radius': '4px',
          'z-index': 1000,
          'line-height': '1.5',
          'pointer-events': 'none'
        }}
      />
      <div ref={gameContainer} />
    </div>
  );
}
