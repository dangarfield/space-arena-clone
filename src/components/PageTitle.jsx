export default function PageTitle(props) {
  return (
    <div style={{
      display: 'flex',
      'align-items': 'center',
      'justify-content': 'center',
      height: '45px',
      padding: '0 0.75rem',
      'border-bottom': '2px solid #003366',
      'flex-shrink': 0,
      position: 'relative'
    }}>
      <button
        onClick={() => props.onBack?.()}
        style={{
          position: 'absolute',
          left: '0.75rem',
          background: 'transparent',
          border: 'none',
          color: '#00aaff',
          'font-size': '24px',
          cursor: 'pointer',
          padding: '0.25rem'
        }}
      >
        ‹
      </button>
      <h2 style={{ 
        'font-size': '18px', 
        color: '#00aaff',
        margin: 0
      }}>
        {props.title}
      </h2>
    </div>
  );
}
