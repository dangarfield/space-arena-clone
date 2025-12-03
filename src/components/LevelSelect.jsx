export default function LevelSelect(props) {
  const levels = [
    { id: 1, name: 'Training Mission', difficulty: 'Easy', unlocked: true },
    { id: 2, name: 'Pirate Ambush', difficulty: 'Medium', unlocked: true },
    { id: 3, name: 'Fleet Battle', difficulty: 'Hard', unlocked: false },
  ];

  return (
    <div style={{ padding: '2rem', height: '100vh' }}>
      <button
        onClick={props.onBack}
        style={{
          'font-size': '24px',
          background: 'transparent',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          'margin-bottom': '2rem'
        }}
      >
        &lt; BACK
      </button>
      
      <h1 style={{
        'text-align': 'center',
        'font-size': '48px',
        color: '#00aaff',
        'margin-bottom': '3rem'
      }}>
        SELECT LEVEL
      </h1>
      
      <div style={{
        display: 'flex',
        'flex-direction': 'column',
        'align-items': 'center',
        gap: '1.5rem'
      }}>
        {levels.map(level => (
          <button
            disabled={!level.unlocked}
            onClick={() => level.unlocked && props.onSelect(level)}
            style={{
              width: '600px',
              padding: '20px',
              background: level.unlocked ? '#003366' : '#333333',
              color: level.unlocked ? 'white' : '#666666',
              border: 'none',
              'border-radius': '5px',
              cursor: level.unlocked ? 'pointer' : 'not-allowed',
              'text-align': 'left',
              transition: 'background 0.3s'
            }}
            onMouseOver={(e) => level.unlocked && (e.target.style.background = '#0055aa')}
            onMouseOut={(e) => level.unlocked && (e.target.style.background = '#003366')}
          >
            <div style={{ 'font-size': '28px', 'margin-bottom': '5px' }}>
              {level.name}
            </div>
            <div style={{ 'font-size': '18px', color: level.unlocked ? '#00aaff' : '#666666' }}>
              {level.difficulty}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
