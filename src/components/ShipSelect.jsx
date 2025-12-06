import { createResource, For, Show } from 'solid-js';
import GlobalHeader from './GlobalHeader';
import PageTitle from './PageTitle';

async function fetchShips() {
  const shipsData = await fetch('/data/ships.json').then(r => r.json());
  
  // Convert grid array to shape array (rotated 180 degrees)
  const convertGridToShape = (g, w, h) => {
    const shape = [];
    for (let row = h - 1; row >= 0; row--) {
      let rowStr = '';
      for (let col = w - 1; col >= 0; col--) {
        const cellValue = g[row * w + col];
        if (cellValue === 0) rowStr += ' ';
        else if (cellValue === 4) rowStr += 'E';
        else if (cellValue === 5) rowStr += 'B';
        else rowStr += 'D';
      }
      shape.push(rowStr);
    }
    return shape;
  };
  
  return Object.entries(shipsData)
    .filter(([key]) => key !== 'Drone' && key !== 'StarDestroyer' && key !== 'Falcon' && key !== 'Wing')
    .map(([key, ship]) => ({
      id: key,
      name: ship.name,
      sname: ship.sname,
      unlockLevel: ship.lr || 0,
      shape: convertGridToShape(ship.g, ship.w, ship.h),
      width: ship.w,
      height: ship.h
    }))
    .filter(ship => ship.unlockLevel > 0)
    .sort((a, b) => a.unlockLevel - b.unlockLevel);
}

export default function ShipSelect(props) {
  const [ships] = createResource(fetchShips);

  return (
    <div class="ship-select" style={{
      display: 'flex',
      'flex-direction': 'column',
      height: '100vh',
      background: '#0a0a1a'
    }}>
      <GlobalHeader player={props.player} />
      <PageTitle title="Select Ship" onBack={props.onBack} />
      
      {/* Ship List */}
      <div style={{
        flex: 1,
        'overflow-y': 'auto',
        padding: '1rem',
        display: 'flex',
        'flex-direction': 'column',
        gap: '0.75rem'
      }}>
        <Show when={ships()} fallback={
          <div style={{ 'text-align': 'center', color: '#666', padding: '2rem' }}>
            Loading ships...
          </div>
        }>
          <For each={ships()}>
            {(ship) => (
              <button
                onClick={() => props.onSelect?.(ship)}
                style={{
                  display: 'flex',
                  'align-items': 'center',
                  gap: '1rem',
                  padding: '1rem',
                  background: '#001a33',
                  border: '2px solid #003366',
                  'border-radius': '8px',
                  cursor: 'pointer',
                  'text-align': 'left',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#003366';
                  e.currentTarget.style.borderColor = '#00aaff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#001a33';
                  e.currentTarget.style.borderColor = '#003366';
                }}
              >
                {/* Ship Preview */}
                <div style={{
                  width: '80px',
                  height: '80px',
                  display: 'flex',
                  'align-items': 'center',
                  'justify-content': 'center',
                  background: '#0a0a1a',
                  'border-radius': '6px',
                  'flex-shrink': 0,
                  padding: '5px',
                  overflow: 'hidden'
                }}>
                  {/* Simple grid visualization */}
                  <div style={{
                    display: 'grid',
                    'grid-template-columns': `repeat(${ship.width}, ${Math.min(70 / ship.width, 70 / ship.height)}px)`,
                    'grid-template-rows': `repeat(${ship.height}, ${Math.min(70 / ship.width, 70 / ship.height)}px)`,
                    gap: '1px'
                  }}>
                    <For each={ship.shape}>
                      {(row) => (
                        <For each={row.split('')}>
                          {(cell) => (
                            <div style={{
                              background: cell === ' ' ? 'transparent' : '#00aaff',
                              'border-radius': '1px'
                            }} />
                          )}
                        </For>
                      )}
                    </For>
                  </div>
                </div>
                
                {/* Ship Info */}
                <div style={{ flex: 1, 'min-width': 0 }}>
                  <div style={{ 
                    color: 'white', 
                    'font-size': '16px', 
                    'font-weight': '600',
                    'margin-bottom': '0.25rem'
                  }}>
                    {ship.name}
                  </div>
                  <div style={{ 
                    color: '#aaa', 
                    'font-size': '13px',
                    'margin-bottom': '0.25rem'
                  }}>
                    {ship.sname}
                  </div>
                  <div style={{ 
                    color: '#00aaff', 
                    'font-size': '12px'
                  }}>
                    Level {ship.unlockLevel}
                  </div>
                </div>
                
                {/* Arrow */}
                <div style={{
                  color: '#00aaff',
                  'font-size': '20px',
                  'flex-shrink': 0
                }}>
                  ›
                </div>
              </button>
            )}
          </For>
        </Show>
      </div>
    </div>
  );
}
