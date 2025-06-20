'use client';

import { useDraw } from '@/hooks/useDraw';
import { useWebSocket } from '@/hooks/webSocket';
import { DrawToolbar } from '@/components/draw/DrawToolbar';
import { useState, useRef, useEffect } from 'react';
import { DRAW_CANVAS_WIDTH, DRAW_CANVAS_HEIGHT } from '@/config/consts';
import { InfoCard } from '@/components/UI/InfoCard';

interface ViewState {
  zoom: number;
  offset: { x: number; y: number };
}

export default function DrawPage() {
  const { currentRoom } = useWebSocket();
  const {
    canvasRef,
    drawState,
    setDrawState,
    startDrawing,
    draw,
    stopDrawing,
  } = useDraw();

  const [containerZoom, setZoom] = useState(1);
  const [viewState, setViewState] = useState<ViewState>({ zoom: 1, offset: { x: 0, y: 0 } });
  const [isPanning, setIsPanning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Nessesary so browser doesn't complain about prevent default in passive listeners
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const preventDefault = (e: TouchEvent) => {
      if (e.touches.length === 1) e.preventDefault()
    };
    container.addEventListener('touchstart', preventDefault, { passive: false });
    container.addEventListener('touchmove', preventDefault, { passive: false });
    return () => {
      container.removeEventListener('touchstart', preventDefault);
      container.removeEventListener('touchmove', preventDefault);
    };
  }, [containerRef.current]);

  const panStartRef = useRef<{
    x: number;
    y: number;
    offsetX: number;
    offsetY: number;
  }>({ x: 0, y: 0, offsetX: 0, offsetY: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    const updateZoom = () => {
      if (!containerRef.current) return;
      const parent = containerRef.current.parentElement;
      if (!parent) return;
      const widthRatio = parent.clientWidth / DRAW_CANVAS_WIDTH;
      const heightRatio = window.innerHeight / DRAW_CANVAS_HEIGHT;
      setZoom(Math.min(widthRatio, heightRatio));
    };
    updateZoom();
    window.addEventListener('resize', updateZoom);
    return () => window.removeEventListener('resize', updateZoom);
  }, [containerRef]);


  const getCanvasCoords = (clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / containerZoom - viewState.offset.x) / viewState.zoom,
      y: ((clientY - rect.top) / containerZoom - viewState.offset.y) / viewState.zoom,
    };
  };

  const startPan = (clientX: number, clientY: number) => {
    setIsPanning(true);
    panStartRef.current = {
      x: clientX,
      y: clientY,
      offsetX: viewState.offset.x,
      offsetY: viewState.offset.y
    };
  };

  const handlePan = (clientX: number, clientY: number) => {
    if (!isPanning || !panStartRef.current) return;

    const scale = 1 / (containerZoom * viewState.zoom);
    const dx = (clientX - panStartRef.current.x) * scale;
    const dy = (clientY - panStartRef.current.y) * scale;

    setViewState({
      zoom: viewState.zoom,
      offset: {
        x: panStartRef.current.offsetX + dx,
        y: panStartRef.current.offsetY + dy
      }
    });
  };

  const stopPan = () => {
    setIsPanning(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
      startPan(e.clientX, e.clientY);
    } else if (e.button === 0) {
      const coords = getCanvasCoords(e.clientX, e.clientY);
      startDrawing(coords.x, coords.y);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      handlePan(e.clientX, e.clientY);
    } else {
      const coords = getCanvasCoords(e.clientX, e.clientY);
      draw(coords.x, coords.y);
    }
  };

  const handleMouseUp = () => {
    if (isPanning) {
      stopPan();
    } else {
      stopDrawing();
    }
  };

  const handleMouseLeave = () => {
    if (isPanning) {
      stopPan();
    } else {
      stopDrawing();
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 0) return;

    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const midX = (touch1.clientX + touch2.clientX) / 2;
      const midY = (touch1.clientY + touch2.clientY) / 2;
      startPan(midX, midY);
    } else {
      const touch = e.touches[0];
      const coords = getCanvasCoords(touch.clientX, touch.clientY);
      startDrawing(coords.x, coords.y);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 0) return;

    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const midX = (touch1.clientX + touch2.clientX) / 2;
      const midY = (touch1.clientY + touch2.clientY) / 2;
      handlePan(midX, midY);
    } else if (!isPanning) {
      const touch = e.touches[0];
      const coords = getCanvasCoords(touch.clientX, touch.clientY);
      draw(coords.x, coords.y);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.touches.length < 2) stopPan();
    stopDrawing();
  };


  return <div className="w-full flex flex-col">
    <header className="w-full border-b border-border p-4">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-semibold">Draw</h1>
        <InfoCard width={250}>
          <p className="text-primary">Draw with others in the room!</p>
          <p className="text-sm">- ctl+drag/middle drag to pan</p>
          <p className="text-sm">- 2 finger to pan</p>
        </InfoCard>
      </div>
      <div className="flex items-center space-x-1 text-sm text-muted-foreground">
        Room: {currentRoom}
      </div>
    </header>
    <DrawToolbar
      currentColor={drawState.color}
      currentWidth={drawState.lineWidth}
      currentZoom={viewState.zoom}
      changeColor={color => setDrawState(s => ({ ...s, color }))}
      changeWidth={lineWidth => setDrawState(s => ({ ...s, lineWidth }))}
      zoomIn={() => setViewState(s => ({ ...s, zoom: Math.min(s.zoom * 1.1, 3) }))}
      zoomOut={() => setViewState(s => ({ ...s, zoom: Math.max(s.zoom * 0.9, 1) }))}
      zoomReset={() => setViewState({ zoom: 1, offset: { x: 0, y: 0 } })}
    />

    <div
      ref={containerRef}
      className="border border-primary border-2 rounded-md overflow-hidden"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      style={{
        transform: `scale(${containerZoom})`,
        transformOrigin: '0 0',
        touchAction: 'none',
        width: `${DRAW_CANVAS_WIDTH}px`,
        height: `${DRAW_CANVAS_HEIGHT}px`,
      }}
    >
      <canvas
        ref={canvasRef}
        width={DRAW_CANVAS_WIDTH}
        height={DRAW_CANVAS_HEIGHT}
        className="bg-surface"
        style={{
          transform: `translate(${viewState.offset.x}px, ${viewState.offset.y}px) scale(${viewState.zoom})`,
          transformOrigin: '0 0',
          touchAction: 'none',
        }}
      />
    </div>
  </div>;
}