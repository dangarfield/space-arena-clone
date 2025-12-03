export default function MenuScene(props) {
  return (
    <div style={{
      display: 'flex',
      'flex-direction': 'column',
      'align-items': 'center',
      'justify-content': 'center',
      height: '100vh',
      gap: '2rem'
    }}>
      <h1 style={{
        'font-size': '72px',
        color: '#00aaff',
        'text-shadow': '0 0 20px rgba(0, 170, 255, 0.5)',
        'margin-bottom': '2rem'
      }}>
        SPACE ARENA
      </h1>
      
      <button
        onClick={() => props.onNavigate('levelSelect')}
        style={{
          'font-size': '32px',
          padding: '15px 40px',
          background: '#003366',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          'border-radius': '5px',
          transition: 'background 0.3s'
        }}
        onMouseOver={(e) => e.target.style.background = '#0055aa'}
        onMouseOut={(e) => e.target.style.background = '#003366'}
      >
        CAREER MODE
      </button>
      
      <button
        style={{
          'font-size': '32px',
          padding: '15px 40px',
          background: '#003366',
          color: 'white',
          border: 'none',
          opacity: 0.5,
          'border-radius': '5px'
        }}
        disabled
      >
        QUICK BATTLE
      </button>
    </div>
  );
}
