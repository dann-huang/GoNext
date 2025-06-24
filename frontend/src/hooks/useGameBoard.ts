import React, { useState, useRef } from 'react';

export type UseGameBoardInput = {
  onCellClick?: (cellIndex: number) => void;
  onCellDrop?: (fromIndex: number, toIndex: number, pointer: { x: number; y: number }) => void;
};

export type UseGameBoardOutput = {
  hoveredCell: number | null;
  dragging: {
    fromCell: number | null;
    pointer: { x: number; y: number };
  };
  getCellProps: (cellIndex: number) => {
    onClick: (e: React.PointerEvent) => void;
    onPointerDown: (e: React.PointerEvent) => void;
    onPointerUp: (e: React.PointerEvent) => void;
    onPointerEnter: (e: React.PointerEvent) => void;
    onPointerLeave: (e: React.PointerEvent) => void;
  };
};

export function useGameBoard({ onCellClick, onCellDrop }: UseGameBoardInput): UseGameBoardOutput {
  const [hoveredCell, setHoveredCell] = useState<number | null>(null);
  const [dragging, setDragging] = useState<{ fromCell: number | null; pointer: { x: number; y: number } }>({
    fromCell: null,
    pointer: { x: 0, y: 0 },
  });
  const lastPointer = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const getCellProps = (cellIndex: number) => ({
    onClick: (e: React.PointerEvent) => {
      if (onCellClick) onCellClick(cellIndex);
    },
    onPointerDown: (e: React.PointerEvent) => {
      setDragging({ fromCell: cellIndex, pointer: { x: e.clientX, y: e.clientY } });
      lastPointer.current = { x: e.clientX, y: e.clientY };
    },
    onPointerUp: (e: React.PointerEvent) => {
      if (dragging.fromCell !== null && onCellDrop) {
        onCellDrop(dragging.fromCell, cellIndex, { x: e.clientX, y: e.clientY });
      }
      setDragging(d => ({ fromCell: null, pointer: { x: e.clientX, y: e.clientY } }));
      lastPointer.current = { x: e.clientX, y: e.clientY };
    },
    onPointerEnter: (_e: React.PointerEvent) => {
      setHoveredCell(cellIndex);
    },
    onPointerLeave: (_e: React.PointerEvent) => {
      setHoveredCell(null);
    },
  });

  // Optionally, update pointer position during drag
  // (for drag preview following pointer)
  const handlePointerMove = (e: PointerEvent) => {
    if (dragging.fromCell !== null) {
      setDragging(d => ({ ...d, pointer: { x: e.clientX, y: e.clientY } }));
      lastPointer.current = { x: e.clientX, y: e.clientY };
    }
  };

  // Attach global pointermove when dragging
  React.useEffect(() => {
    if (dragging.fromCell !== null) {
      window.addEventListener('pointermove', handlePointerMove);
      return () => window.removeEventListener('pointermove', handlePointerMove);
    }
  }, [dragging.fromCell]);

  // Always provide a pointer value, even if not dragging
  const pointer = dragging.fromCell !== null
    ? dragging.pointer
    : lastPointer.current;

  return {
    hoveredCell,
    dragging: {
      fromCell: dragging.fromCell,
      pointer,
    },
    getCellProps,
  };
} 