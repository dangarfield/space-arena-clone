import { createResource, For } from 'solid-js';

async function fetchShips() {
  const shipsData = await fetch('/data/ships.json').then(r => r.json());
  
  // Convert grid array to shape array (rotated 180 degrees)
  const convertGridToShape = (g, w, h) => {
    const shape = [];
    // Iterate backwards through rows (bottom to top)
    for (let row = h - 1; row >= 0; row--) {
      let rowStr = '';
      // Iterate backwards through columns (right to left)
      for (let col = w - 1; col >= 0; col--) {
        const cellValue = g[row * w + col];
        // 0 = space, 1/2/3 = modules (D), 4 = engines only (E), 5 = both (B)
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
      id: key.toLowerCase().replace(/_/g, '_'),
      name: ship.name,
      class: ship.name,
      unlockLevel: ship.lr || 0,
      shape: convertGridToShape(ship.g, ship.w, ship.h),
      stats: {
        'Class': ship.name,
        'Unlock level': String(ship.lr || 0),
        'Turning': String(ship.ts || 0),
        'Speed': String(ship.ms || 0),
        'Cells without modifications': String(ship.sa || 0)
      }
    }))
    .filter(ship => ship.unlockLevel > 0)
    .sort((a, b) => a.unlockLevel - b.unlockLevel);
}

export default function ShipSelect(props) {
  const [ships] = createResource(fetchShips);

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
        SELECT YOUR SHIP
      </h1>
      
      <div style={{
        display: 'grid',
        'grid-template-columns': 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '1.5rem',
        padding: '0 2rem',
        'max-height': 'calc(100vh - 200px)',
        'overflow-y': 'auto'
      }}>
        <For each={ships()}>
          {(ship) => (
            <div style={{
              width: '300px',
              padding: '20px',
              background: '#003366',
              border: '2px solid #0055aa',
              'border-radius': '10px',
              'text-align': 'center'
            }}>
              {/* Ship grid preview */}
              <div style={{
                display: 'grid',
                'grid-template-columns': `repeat(${ship.shape?.[0]?.length || 6}, 20px)`,
                gap: '2px',
                'justify-content': 'center',
                'margin-bottom': '20px'
              }}>
                <For each={ship.shape}>
                  {(row) => (
                    <For each={row.split('')}>
                      {(cell) => (
                        <div style={{
                          width: '18px',
                          height: '18px',
                          background: cell === 'D' ? '#999999' : 
                                     cell === 'E' ? '#6699cc' : 
                                     cell === 'B' ? 'linear-gradient(to bottom right, #999999 0%, #999999 49%, #6699cc 51%, #6699cc 100%)' : 
                                     'transparent',
                          border: cell !== ' ' ? '1px solid #00aaff' : 'none'
                        }} />
                      )}
                    </For>
                  )}
                </For>
              </div>
              
              <h2 style={{ 'font-size': '32px', 'margin-bottom': '10px' }}>
                {ship.name}
              </h2>
              <p style={{ color: '#00aaff', 'margin-bottom': '5px' }}>
                {ship.class}
              </p>
              <p style={{ color: '#aaaaaa', 'margin-bottom': '20px' }}>
                Level {ship.unlockLevel}
              </p>
              
              <button
                onClick={() => props.onSelect(ship)}
                style={{
                  'font-size': '24px',
                  padding: '10px 30px',
                  background: '#005500',
                  color: 'white',
                  border: 'none',
                  'border-radius': '5px',
                  cursor: 'pointer',
                  transition: 'background 0.3s'
                }}
                onMouseOver={(e) => e.target.style.background = '#007700'}
                onMouseOut={(e) => e.target.style.background = '#005500'}
              >
                SELECT
              </button>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}
