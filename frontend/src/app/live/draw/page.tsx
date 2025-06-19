'use client';

import { useDraw } from '@/hooks/useDraw';
import { useWebSocket } from '@/hooks/webSocket';
import { Info } from 'lucide-react';
import { DrawToolbar } from '@/components/draw/DrawToolbar';
import { useCallback } from 'react';
import type { DrawState } from '@/hooks/useDraw';

export default function DrawPage() {
  const {
    canvasRef,
    drawState,
    setDrawState,
    startDrawing,
    draw,
    stopDrawing,
    clearCanvas,
    touchHandlers,
    zoomIn,
    zoomOut,
    resetView
  } = useDraw();
  
  const { currentRoom } = useWebSocket();

  const handleColorChange = useCallback((color: string) => {
    setDrawState(prev => ({ ...prev, color }));
  }, [setDrawState]);

  const handleLineWidthChange = useCallback((lineWidth: number) => {
    setDrawState(prev => ({ ...prev, lineWidth }));
  }, [setDrawState]);

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col min-h-screen">
      <header className="w-full border-b border-border p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Drawing</h1>
            <p className="text-sm text-muted-foreground">
              Room: <span className="font-mono">{currentRoom || 'Not connected'}</span>
            </p>
          </div>
          
          <div className="flex items-center gap-2 p-2 bg-primary/5 rounded-lg">
            <Info className="h-4 w-4 text-primary" />
            <p className="text-sm text-muted-foreground">
              Draw together with others in the chat room
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        <DrawToolbar
          drawState={drawState}
          onColorChange={handleColorChange}
          onLineWidthChange={handleLineWidthChange}
          onClear={clearCanvas}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onResetView={resetView}
        />

        <div className="flex-1 flex items-center justify-center p-4 bg-muted/20">
          <div className="relative w-full max-w-4xl h-[600px] bg-background rounded-lg shadow-lg overflow-hidden border border-border">
            <canvas
              ref={canvasRef}
              // Mouse events
              onMouseDown={e => {
                if (e.button === 0) { // Left mouse button only
                  startDrawing(e);
                } else if (e.button === 1 || e.button === 2) { // Middle or right button for panning
                  e.preventDefault();
                }
              }}
              onMouseMove={e => {
                if (e.buttons === 0) return; // No buttons pressed
                if (e.buttons === 1) { // Left button down - draw
                  draw(e);
                } else if (e.buttons === 2 || e.buttons === 4) { // Right or middle button - pan
                  e.preventDefault();
                  draw(e);
                }
              }}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onContextMenu={e => e.preventDefault()} // Disable context menu on right click
              onTouchStart={touchHandlers.onTouchStart}
              onTouchMove={touchHandlers.onTouchMove}
              onTouchEnd={touchHandlers.onTouchEnd}
              onTouchCancel={touchHandlers.onTouchCancel}
              className="absolute inset-0 w-full h-full touch-none"
              style={{ touchAction: 'none' }}
            />
          </div>
        </div>
      </main>
    </div>
  );
} 