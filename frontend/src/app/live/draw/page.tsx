'use client';

import { useDraw } from '@/hooks/useDraw';

export default function DrawPage() {
  const { canvasRef, drawState, setDrawState,
    startDrawing, draw, stopDrawing, clearCanvas, touchHandlers } = useDraw();

  return <div className="flex flex-col items-center justify-center min-h-screen p-4">
    <div className="flex gap-4 mb-4">
      <input
        type="color"
        value={drawState.color}
        onChange={(e) => setDrawState(prev => ({ ...prev, color: e.target.value }))}
        className="w-10 h-10"
      />
      <input
        type="range"
        min="1"
        max="20"
        value={drawState.lineWidth}
        onChange={(e) => setDrawState(prev => ({ ...prev, lineWidth: parseInt(e.target.value) }))}
        className="w-32"
      />
      <button
        onClick={clearCanvas}
        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
      >
        Clear
      </button>
    </div>
    <canvas
      ref={canvasRef}
      // Mouse events
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={stopDrawing}
      onMouseLeave={stopDrawing}
      // Touch events
      onTouchStart={touchHandlers.onTouchStart}
      onTouchMove={touchHandlers.onTouchMove}
      onTouchEnd={touchHandlers.onTouchEnd}
      onTouchCancel={touchHandlers.onTouchCancel}
      // Disable scrolling on touch devices when drawing
      style={{
        width: '100%',
        maxWidth: '800px',
        height: '600px',
        touchAction: 'none', // Prevent touch scrolling
        border: '1px solid #d1d5db',
        borderRadius: '0.5rem'
      }}
      className="bg-white"
    />
  </div>;
} 