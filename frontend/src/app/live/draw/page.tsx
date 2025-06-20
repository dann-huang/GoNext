'use client';

import { useDraw } from '@/hooks/useDraw';
import { useWebSocket } from '@/hooks/webSocket';
import { DrawToolbar } from '@/components/draw/DrawToolbar';
import { useState, useRef, useEffect } from 'react';
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
  const panStartRef = useRef<{
    x: number;
    y: number;
    offsetX: number;
    offsetY: number;
  }>({ x: 0, y: 0, offsetX: 0, offsetY: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate initial zoom to fit container
  useEffect(() => {
    if (!containerRef.current) return;
    const updateZoom = () => {
      if (!containerRef.current) return;
      const parent = containerRef.current.parentElement;
      if (!parent) return;
      const widthRatio = parent.clientWidth / DRAW_CANVAS_WIDTH;
      const heightRatio = window.innerHeight / DRAW_CANVAS_HEIGHT;
      setStartZoom(Math.min(widthRatio, heightRatio));
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

  const getCanvasCoords = (clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left - viewState.offset.x) / (startZoom * viewState.zoom),
      y: (clientY - rect.top - viewState.offset.y) / (startZoom * viewState.zoom),
    };
  };

  // Panning functions
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
    
    const scale = 1 / (startZoom * viewState.zoom);
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

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
      // Middle mouse or Ctrl+Left click for panning
      e.preventDefault();
      startPan(e.clientX, e.clientY);
    } else if (e.button === 0) {
      // Left click for drawing
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

  const handleMouseUp = (e: React.MouseEvent) => {
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

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 0) return;
    
    if (e.touches.length === 2) {
      // Two-finger pan
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const midX = (touch1.clientX + touch2.clientX) / 2;
      const midY = (touch1.clientY + touch2.clientY) / 2;
      startPan(midX, midY);
    } else {
      // Single touch draw
      const touch = e.touches[0];
      const coords = getCanvasCoords(touch.clientX, touch.clientY);
      startDrawing(coords.x, coords.y);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 0) return;

    if (e.touches.length === 2) {
      // Continue two-finger pan
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const midX = (touch1.clientX + touch2.clientX) / 2;
      const midY = (touch1.clientY + touch2.clientY) / 2;
      handlePan(midX, midY);
    } else if (!isPanning) {
      // Single touch draw
      const touch = e.touches[0];
      const coords = getCanvasCoords(touch.clientX, touch.clientY);
      draw(coords.x, coords.y);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length < 2) {
      stopPan();
    }
    stopDrawing();
  };


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
      onMouseLeave={handleMouseLeave}
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