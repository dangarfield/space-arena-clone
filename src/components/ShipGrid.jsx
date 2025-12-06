import { For, createSignal, onMount } from 'solid-js';

export default function ShipGrid(props) {
  const ship = () => props.ship;
  const interactive = () => props.interactive || false;
  const [containerAspect, setContainerAspect] = createSignal(1);
  let containerRef;
  
  onMount(() => {
    if (containerRef?.parentElement) {
      const rect = containerRef.parentElement.getBoundingClientRect();
      setContainerAspect(rect.width / rect.height);
    }
  });
  
  // Convert grid format: g array + w/h to shape array
  const getShape = () => {
    const s = ship();
    if (!s) return [];
    
    // If ship has shape, use it
    if (s.shape) return s.shape;
    
    // Otherwise convert from g array (rotated 180 degrees)
    if (s.g && s.w && s.h) {
      const shape = [];
      // Read grid backwards (180 degree rotation)
      for (let row = s.h - 1; row >= 0; row--) {
        let rowStr = '';
        for (let col = s.w - 1; col >= 0; col--) {
          const cellValue = s.g[row * s.w + col];
          // 0=empty, 1/2/3=device cells, 4=engine only, 5=both
          const cellChar = cellValue === 0 ? ' ' : 
                          cellValue === 1 || cellValue === 2 || cellValue === 3 ? 'D' :
                          cellValue === 4 ? 'E' :
                          cellValue === 5 ? 'B' : ' ';
          rowStr += cellChar;
        }
        shape.push(rowStr);
      }
      return shape;
    }
    
    return [];
  };
  
  const shape = () => getShape();
  const gridWidth = () => shape()[0]?.length || 6;
  const gridHeight = () => shape().length || 5;
  const gridAspect = () => gridWidth() / gridHeight();
  
  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', display: 'flex', 'align-items': 'center', 'justify-content': 'center' }}>
      <div 
        id={props.id || 'ship-grid'}
        style={{
          display: 'grid',
          'grid-template-columns': `repeat(${gridWidth()}, 1fr)`,
          'grid-template-rows': `repeat(${gridHeight()}, 1fr)`,
          gap: '2px',
          background: '#0a0a1a',
          padding: '4px',
          border: '3px solid #00aaff',
          position: 'relative',

          // Compare grid aspect to container aspect
          ...(gridAspect() > containerAspect() ? {
            width: '100%',
            height: 'auto'
          } : {
            width: 'auto',
            height: '100%'
          }),

          'max-width': '100%',
          'max-height': '100%',
          'aspect-ratio': `${gridWidth()} / ${gridHeight()}`,
          ...props.style
        }}
      >
      <For each={shape()}>
        {(row, rowIndex) => (
          <For each={row.split('')}>
            {(cell, colIndex) => (
              <div 
                onClick={() => props.onCellClick?.(colIndex(), rowIndex())}
                onMouseEnter={() => props.onCellHover?.(colIndex(), rowIndex())}
                onMouseLeave={() => props.onCellLeave?.()}
                style={{
                  width: '100%',
                  'aspect-ratio': '1',
                  background: cell === 'D' ? 'rgba(153, 153, 153, 0.5)' : 
                             cell === 'E' ? 'rgba(102, 153, 204, 0.5)' : 
                             cell === 'B' ? 'linear-gradient(to bottom right, rgba(153, 153, 153, 0.5) 0%, rgba(153, 153, 153, 0.5) 49%, rgba(102, 153, 204, 0.5) 51%, rgba(102, 153, 204, 0.5) 100%)' : 
                             'transparent',
                  border: cell !== ' ' ? '1px solid #00aaff' : 'none',
                  cursor: interactive() && cell !== ' ' ? 'pointer' : 'default'
                }} 
              />
            )}
          </For>
        )}
      </For>
      
        {/* Render children (hover preview, placed modules, etc.) */}
        {props.children}
      </div>
    </div>
  );
}
