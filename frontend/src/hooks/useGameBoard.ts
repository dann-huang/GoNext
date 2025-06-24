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
    onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
    onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
    onPointerEnter: (e: React.PointerEvent<HTMLDivElement>) => void;
    onPointerLeave: (e: React.PointerEvent<HTMLDivElement>) => void;
  };
};

export function useGameBoard({ onCellClick, onCellDrop }: UseGameBoardInput): UseGameBoardOutput {
  const [hoveredCell, setHoveredCell] = useState<number | null>(null);
  const sameCell = useRef<boolean>(true);
  const [dragging, setDragging] = useState<{ fromCell: number | null; pointer: { x: number; y: number } }>({
    fromCell: null,
    pointer: { x: 0, y: 0 },
  });

  const getCellProps = (cellIndex: number) => ({
    onPointerDown: (e: React.PointerEvent) => {
      setDragging({ fromCell: cellIndex, pointer: { x: e.clientX, y: e.clientY } });
      sameCell.current = true;
    },
    onPointerUp: (e: React.PointerEvent) => {
      if (dragging.fromCell !== null) {
        if (onCellDrop)
          onCellDrop(dragging.fromCell, cellIndex, { x: e.clientX, y: e.clientY });
        if (sameCell.current && onCellClick)
          onCellClick(cellIndex);
      }
      setDragging({ fromCell: null, pointer: { x: e.clientX, y: e.clientY } });
    },
    onPointerEnter: (_e: React.PointerEvent) => {
      setHoveredCell(cellIndex);
    },
    onPointerLeave: (_e: React.PointerEvent) => {
      setHoveredCell(null);
      sameCell.current = false;
    },
  });

  const handlePointerMove = (e: PointerEvent) => {
    if (dragging.fromCell !== null) {
      setDragging(d => ({ ...d, pointer: { x: e.clientX, y: e.clientY } }));
    }
  };
  React.useEffect(() => {
    if (dragging.fromCell !== null) {
      window.addEventListener('pointermove', handlePointerMove);
      return () => window.removeEventListener('pointermove', handlePointerMove);
    }
  }, [dragging.fromCell]);

  return {
    hoveredCell,
    dragging,
    getCellProps,
  };
} 