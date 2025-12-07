import GlobalHeader from './GlobalHeader';
import PageTitle from './PageTitle';

export default function GameModePage(props) {
  return (
    <div style={{
      display: 'flex',
      'flex-direction': 'column',
      height: '100vh',
      background: '#0a0a1a'
    }}>
      <GlobalHeader player={props.player} />
      <PageTitle title="GAME MODES" onBack={props.onBack} />
      
      <div style={{
        flex: 1,
        display: 'flex',
        'flex-direction': 'column',
        'align-items': 'center',
        'justify-content': 'center',
        padding: '2rem',
        'text-align': 'center'
      }}>
        <div style={{ 'font-size': '64px', 'margin-bottom': '1rem' }}>🎮</div>
        <h2 style={{ 'font-size': '24px', color: '#00aaff', 'margin-bottom': '1rem' }}>
          Game Modes
        </h2>
        <p style={{ color: '#aaaaaa', 'font-size': '16px' }}>
          Coming Soon
        </p>
      </div>
    </div>
  );
}
