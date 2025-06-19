'use client';

import { useDraw } from '@/hooks/useDraw';
import { useWebSocket } from '@/hooks/webSocket';
import { DrawToolbar } from '@/components/draw/DrawToolbar';
import { useCallback, useState, useRef, useEffect } from 'react';

interface ViewState {
  zoom: number;
  offset: { x: number; y: number };
}

export default function DrawPage() {
  const { currentRoom } = useWebSocket();
  const [viewState, setViewState] = useState<ViewState>({
    zoom: 1,
    offset: { x: 0, y: 0 },
  });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    canvasRef,
    drawState,
    setDrawState,
    startDrawing,
    draw,
    stopDrawing,
  } = useDraw();

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    startDrawing(e);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) {
      draw(e);
    }
  };

  const handleMouseUp = () => {
    stopDrawing();
  };

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 0) return;
    startDrawing(e);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (!isPanning && e.touches.length > 0) {
      draw(e);
    }
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
        transform: `translate(${viewState.offset.x}px, ${viewState.offset.y}px) scale(${viewState.zoom})`,
        transformOrigin: '0 0',
        touchAction: 'none',
        width: '1600px',
        height: '900px',
      }}
    >
      <canvas
        ref={canvasRef}
        width={1600}
        height={900}
        className="bg-surface"
        style={{ touchAction: 'none' }}
      />
    </div>
  </div>;
}