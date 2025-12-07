export default function BottomNav(props) {
  const gameMode = () => props.gameMode || 'Career';
  const battleReady = () => props.battleReady ?? false;
  
  return (
    <div class="bottom-nav" style={{
      display: 'flex',
      gap: '0.5rem',
      padding: '0.75rem',
      background: '#0a0a1a',
      'border-top': '2px solid #003366'
    }}>
      <button
        onClick={() => props.onGameModeClick?.()}
        style={{
          flex: 1,
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'center',
          gap: '0.5rem',
          height: '60px',
          background: '#003366',
          border: '2px solid #00aaff',
          'border-radius': '8px',
          color: 'white',
          'font-size': '16px',
          'font-weight': '600',
          cursor: 'pointer'
        }}
      >
        <span>🎮</span>
        <span>{gameMode()}</span>
      </button>
      
      <button
        onClick={() => props.onBattleClick?.()}
        disabled={!battleReady()}
        style={{
          flex: 1,
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'center',
          gap: '0.5rem',
          height: '60px',
          background: battleReady() ? '#aa0000' : '#333',
          border: 'none',
          'border-radius': '8px',
          color: battleReady() ? 'white' : '#666',
          'font-size': '18px',
          'font-weight': 'bold',
          cursor: battleReady() ? 'pointer' : 'not-allowed',
          opacity: battleReady() ? 1 : 0.5
        }}
      >
        <span>⚔️</span>
        <span>BATTLE</span>
      </button>
    </div>
  );
}
