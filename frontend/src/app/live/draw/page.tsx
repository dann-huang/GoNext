'use client';

import { useDraw } from '@/hooks/useDraw';
import { useWebSocket } from '@/hooks/webSocket';
import { DrawToolbar } from '@/components/draw/DrawToolbar';
import { useCallback, useState, useRef, useEffect } from 'react';
import { DRAW_CANVAS_WIDTH, DRAW_CANVAS_HEIGHT } from '@/config/consts';

interface ViewState {
  zoom: number;
  offset: { x: number; y: number };
}

export default function DrawPage() {
  const { currentRoom } = useWebSocket();
  const [startZoom, setStartZoom] = useState(1);
  const [viewState, setViewState] = useState<ViewState>({
    zoom: 1,
    offset: { x: 0, y: 0 },
  });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate initial zoom to fit container
  useEffect(() => {
    if (!containerRef.current) return;

    const updateZoom = () => {
      if (!containerRef.current) return;
      const container = containerRef.current.parentElement;
      if (!container) return;

      const availableWidth = container.clientWidth;
      const availableHeight = window.innerHeight;

      const widthRatio = availableWidth / DRAW_CANVAS_WIDTH;
      const heightRatio = availableHeight / DRAW_CANVAS_HEIGHT;
      const newZoom = Math.min(widthRatio, heightRatio);

      setStartZoom(newZoom);
    };

    updateZoom();

    window.addEventListener('resize', updateZoom);
    return () => window.removeEventListener('resize', updateZoom);
  }, [containerRef]);

  const {
    canvasRef,
    drawState,
    setDrawState,
    startDrawing,
    draw,
    stopDrawing,
  } = useDraw();

  const getCanvasCoords = (clientX: number, clientY: number, element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    return {
      x: (clientX - rect.left - viewState.offset.x) / (startZoom * viewState.zoom),
      y: (clientY - rect.top - viewState.offset.y) / (startZoom * viewState.zoom),
    };
  };

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const coords = getCanvasCoords(e.clientX, e.clientY, e.currentTarget as HTMLElement);
    startDrawing(coords.x, coords.y);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) {
      const coords = getCanvasCoords(e.clientX, e.clientY, e.currentTarget as HTMLElement);
      draw(coords.x, coords.y);
    }
  };

  const handleMouseUp = () => {
    stopDrawing();
  };

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 0) return;

    const touch = e.touches[0];
    const coords = getCanvasCoords(touch.clientX, touch.clientY, e.currentTarget as HTMLElement);
    startDrawing(coords.x, coords.y);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (isPanning || e.touches.length === 0) return;

    const touch = e.touches[0];
    const coords = getCanvasCoords(touch.clientX, touch.clientY, e.currentTarget as HTMLElement);
    draw(coords.x, coords.y);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    stopDrawing();
  }


  return <div className="w-full max-w-6xl mx-auto flex flex-col min-h-screen">
    <header className="w-full border-b border-border p-4">
      <h1 className="text-xl font-bold">Draw</h1>
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
      zoomIn={() => setViewState(s => ({ ...s, zoom: s.zoom * 1.1 }))}
      zoomOut={() => setViewState(s => ({ ...s, zoom: Math.max(s.zoom * 0.9, 1) }))}
      zoomReset={() => setViewState({ zoom: 1, offset: { x: 0, y: 0 } })}
    />

    <div
      ref={containerRef}
      className="border border-primary overflow-hidden"

      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      style={{
        transform: `scale(${startZoom})`,
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