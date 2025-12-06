import { For, Show, createResource } from 'solid-js';
import GlobalHeader from './GlobalHeader';
import PageTitle from './PageTitle';

async function fetchShip(shipId) {
  if (!shipId) return null;
  const response = await fetch(`/data/ships/${shipId}.json`);
  return response.json();
}

function HangarRow(props) {
  const hangar = () => props.hangar;
  const index = () => props.index;
  const [ship] = createResource(() => hangar()?.shipId, fetchShip);
  
  return (
    <div style={{
      display: 'flex',
      'align-items': 'center',
      gap: '0.75rem',
      padding: '1rem',
      background: '#001a33',
      border: '2px solid #003366',
      'border-radius': '8px'
    }}>
      {/* Hangar Number */}
      <div style={{
        'min-width': '40px',
        height: '40px',
        display: 'flex',
        'align-items': 'center',
        'justify-content': 'center',
        background: '#003366',
        border: '2px solid #00aaff',
        'border-radius': '8px',
        color: 'white',
        'font-size': '18px',
        'font-weight': '600',
        'flex-shrink': 0
      }}>
        {index() + 1}
      </div>
      
      {/* Ship Info */}
      <Show when={hangar() && ship()} fallback={
        <div style={{ flex: 1, color: '#666', 'font-size': '14px' }}>
          Empty Slot
        </div>
      }>
        <div style={{ flex: 1, 'min-width': 0 }}>
          <div style={{ 
            color: 'white', 
            'font-size': '15px', 
            'font-weight': '600',
            'white-space': 'nowrap',
            overflow: 'hidden',
            'text-overflow': 'ellipsis'
          }}>
            {ship()?.name}
          </div>
          <div style={{ 
            color: '#aaa', 
            'font-size': '12px',
            'white-space': 'nowrap',
            overflow: 'hidden',
            'text-overflow': 'ellipsis'
          }}>
            {ship()?.sname}
          </div>
        </div>
      </Show>
      
      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '0.5rem', 'flex-shrink': 0 }}>
        <Show when={hangar()}>
          <button
            onClick={() => props.onEdit?.(index())}
            style={{
              width: '36px',
              height: '36px',
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center',
              background: '#003366',
              border: '2px solid #00aaff',
              'border-radius': '6px',
              color: '#00aaff',
              'font-size': '16px',
              cursor: 'pointer'
            }}
            title="Edit Fitting"
          >
            🔧
          </button>
          
          <button
            onClick={() => props.onDelete?.(index())}
            style={{
              width: '36px',
              height: '36px',
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center',
              background: '#330000',
              border: '2px solid #ff4444',
              'border-radius': '6px',
              color: '#ff4444',
              'font-size': '16px',
              cursor: 'pointer'
            }}
            title="Clear Hangar"
          >
            🗑️
          </button>
        </Show>
        
        <Show when={!hangar()}>
          <button
            onClick={() => props.onSelectShip?.(index())}
            style={{
              padding: '0.5rem 1rem',
              background: '#005500',
              border: 'none',
              'border-radius': '6px',
              color: 'white',
              'font-size': '13px',
              'font-weight': '600',
              cursor: 'pointer',
              'white-space': 'nowrap'
            }}
          >
            SELECT SHIP
          </button>
        </Show>
      </div>
    </div>
  );
}

export default function HangarManagement(props) {
  const hangars = () => props.hangars || [];
  
  return (
    <div class="hangar-management" style={{
      display: 'flex',
      'flex-direction': 'column',
      height: '100%',
      background: '#0a0a1a'
    }}>
      <GlobalHeader player={props.player} />
      <PageTitle title="Manage Hangars" onBack={props.onClose} />
      
      {/* Hangar List */}
      <div style={{
        flex: 1,
        'overflow-y': 'auto',
        padding: '1rem',
        display: 'flex',
        'flex-direction': 'column',
        gap: '0.75rem'
      }}>
        <For each={hangars()}>
          {(hangar, index) => (
            <HangarRow
              hangar={hangar}
              index={index()}
              onEdit={props.onEdit}
              onDelete={props.onDelete}
              onSelectShip={props.onSelectShip}
            />
          )}
        </For>
      </div>
    </div>
  );
}
