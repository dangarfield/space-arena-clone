import { For, createSignal, onMount } from 'solid-js';

export default function HangarSlotsNav(props) {
  // Hide scrollbar for webkit browsers
  onMount(() => {
    const style = document.createElement('style');
    style.textContent = `
      .hangar-slots-nav::-webkit-scrollbar {
        display: none;
      }
    `;
    document.head.appendChild(style);
  });
  const [scrollPosition, setScrollPosition] = createSignal(0);
  
  const hangars = () => props.hangars || [];
  const activeHangar = () => props.activeHangar ?? 0;
  const maxVisible = 5; // Show max 5 slots at once
  
  const handleScroll = (e) => {
    setScrollPosition(e.target.scrollLeft);
  };
  
  return (
    <div 
      class="hangar-slots-nav"
      style={{
        display: 'flex',
        'align-items': 'center',
        gap: '0.5rem',
        padding: '0.5rem 0.75rem',
        background: '#0a0a1a',
        'border-bottom': '2px solid #003366',
        'overflow-x': 'auto',
        'overflow-y': 'hidden',
        'scroll-behavior': 'smooth',
        '-webkit-overflow-scrolling': 'touch',
        'scrollbar-width': 'none', /* Firefox */
        '-ms-overflow-style': 'none' /* IE/Edge */
      }}
      onScroll={handleScroll}
    >
      <For each={hangars()}>
        {(hangar, index) => (
          <button
            onClick={() => props.onSelectHangar?.(index())}
            style={{
              'min-width': '40px',
              height: '40px',
              display: 'flex',
              'align-items': 'center',
              'justify-content': 'center',
              background: activeHangar() === index() ? '#003366' : '#001a33',
              border: `2px solid ${activeHangar() === index() ? '#00aaff' : '#003366'}`,
              'border-radius': '6px',
              cursor: 'pointer',
              color: hangar ? 'white' : '#666',
              'font-size': '15px',
              'font-weight': '600',
              transition: 'all 0.2s',
              'flex-shrink': 0
            }}
          >
            {index() + 1}
          </button>
        )}
      </For>
      
      <button
        onClick={() => props.onSettings?.()}
        style={{
          'min-width': '40px',
          height: '40px',
          display: 'flex',
          'align-items': 'center',
          'justify-content': 'center',
          background: '#001a33',
          border: '2px solid #003366',
          'border-radius': '6px',
          cursor: 'pointer',
          'font-size': '18px',
          'flex-shrink': 0,
          'margin-left': 'auto'
        }}
      >
        ⚙️
      </button>
    </div>
  );
}
