'use client';

import { useDraw } from '@/hooks/useDraw';

export default function DrawPage() {
  const { canvasRef, drawState, setDrawState,
    startDrawing, draw, stopDrawing, clearCanvas } = useDraw();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
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
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        className="border border-gray-300 rounded-lg"
        style={{ width: '800px', height: '600px' }}
      />
    </div>
  );
} 