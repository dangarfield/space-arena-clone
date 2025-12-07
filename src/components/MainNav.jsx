export default function MainNav(props) {
  const activePage = () => props.activePage || 'hangar';
  
  const navItems = [
    { id: 'hangar', label: 'Hangar', icon: '🚀' },
    { id: 'research', label: 'Research', icon: '🔬' },
    { id: 'leaderboard', label: 'Leaderboard', icon: '🏆' },
    { id: 'database', label: 'Database', icon: '📊' },
    { id: 'shop', label: 'Shop', icon: '🛒' }
  ];
  
  return (
    <div class="main-nav" style={{
      display: 'flex',
      'justify-content': 'space-around',
      background: '#0a0a1a',
      'border-bottom': '2px solid #003366',
      padding: '0.35rem 0'
    }}>
      {navItems.map(item => (
        <button
          onClick={() => props.onNavigate?.(item.id)}
          style={{
            flex: 1,
            display: 'flex',
            'flex-direction': 'column',
            'align-items': 'center',
            gap: '0.25rem',
            background: 'transparent',
            border: 'none',
            'border-bottom': activePage() === item.id ? '3px solid #00aaff' : '3px solid transparent',
            padding: '0.5rem',
            cursor: 'pointer',
            color: activePage() === item.id ? '#00aaff' : '#666',
            transition: 'all 0.2s'
          }}
        >
          <span style={{ 'font-size': '20px' }}>{item.icon}</span>
          <span style={{ 'font-size': '11px', 'font-weight': '500' }}>{item.label}</span>
        </button>
      ))}
    </div>
  );
}
