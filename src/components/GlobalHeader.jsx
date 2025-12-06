import { Show } from 'solid-js';

export default function GlobalHeader(props) {
  const player = () => props.player || { name: 'Commander', level: 1, credits: 0 };
  
  return (
    <div class="global-header" style={{
      display: 'flex',
      'align-items': 'center',
      'justify-content': 'space-between',
      padding: '0.5rem 0.75rem',
      background: '#0a0a1a',
      'border-bottom': '2px solid #003366',
      'min-height': '44px'
    }}>
      {/* Left - Player Info */}
      <button
        onClick={() => props.onSettings?.()}
        style={{
          display: 'flex',
          'align-items': 'center',
          gap: '0.75rem',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: 0
        }}
      >
        <div style={{
          background: '#003366',
          'border-radius': '50%',
          width: '32px',
          height: '32px',
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'center',
          color: '#00aaff',
          'font-weight': 'bold',
          'font-size': '14px'
        }}>
          {player().level}
        </div>
        <div style={{ color: 'white', 'font-size': '14px', 'font-weight': '500' }}>
          {player().name}
        </div>
      </button>
      
      {/* Right - Credits & Settings */}
      <div style={{ display: 'flex', 'align-items': 'center', gap: '1rem' }}>
        <button
          onClick={() => props.onShop?.()}
          style={{
            display: 'flex',
            'align-items': 'center',
            gap: '0.5rem',
            background: '#001a33',
            padding: '0.4rem 0.75rem',
            'border-radius': '12px',
            border: '1px solid #003366',
            cursor: 'pointer'
          }}
        >
          <span style={{ color: '#ffaa00', 'font-size': '16px' }}>💰</span>
          <span style={{ color: 'white', 'font-size': '13px', 'font-weight': '500' }}>
            {player().credits.toLocaleString()}
          </span>
        </button>
        
        <button
          onClick={() => props.onSettings?.()}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#00aaff',
            'font-size': '20px',
            cursor: 'pointer',
            padding: '0.25rem'
          }}
        >
          ⚙️
        </button>
      </div>
    </div>
  );
}
