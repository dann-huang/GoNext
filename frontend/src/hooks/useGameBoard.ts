import { useState, useRef, useEffect } from 'react';

export type UseGameBoardInput = {
  onCellClick?: (cellIndex: number) => void;
  onCellDrop?: (fromIndex: number, toIndex: number) => void;
};

export type UseGameBoardOutput = {
  hoveredCell: number | null;
  dragging: {
    from: number | null;
    pointer: { x: number; y: number };
  };
  getCellProps: (cellIndex: number) => {
    onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => void;
    onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => void;
    onPointerEnter: (e: React.PointerEvent<HTMLDivElement>) => void;
    onPointerLeave: (e: React.PointerEvent<HTMLDivElement>) => void;
    onPointerCancel: (e: React.PointerEvent<HTMLDivElement>) => void;
  };
};

export function useGameBoard({ onCellClick, onCellDrop }: UseGameBoardInput): UseGameBoardOutput {
  const [hoveredCell, setHoveredCell] = useState<number | null>(null);
  const [dragging, setDragging] = useState<{ from: number | null; pointer: { x: number; y: number } }>({
    from: null,
    pointer: { x: 0, y: 0 },
  });
  const lastPointerType = useRef<React.PointerEvent['pointerType']>(null);
  const sameCell = useRef<boolean>(true); // for cursor cell click

  const reset = () => {
    setDragging({ from: null, pointer: { x: 0, y: 0 } });
    setHoveredCell(null);
  };

  const setInput = (type: React.PointerEvent['pointerType']) => {
    if (lastPointerType.current && lastPointerType.current !== type) reset();
    lastPointerType.current = type;
  };

  const getCellProps = (cellIndex: number) => ({
    onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => {
      setInput(e.pointerType);
      if (e.pointerType === 'touch') {
        if (onCellClick) onCellClick(cellIndex);

        setDragging(drag => {
          if (drag.from === null)
            return { from: cellIndex, pointer: { x: e.clientX, y: e.clientY } }

          onCellDrop && onCellDrop(drag.from, cellIndex);
          return { from: null, pointer: { x: 0, y: 0 } }
        });
      } else {
        setDragging({ from: cellIndex, pointer: { x: e.clientX, y: e.clientY } });
        sameCell.current = true;
      }
    },
    onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => {
      setInput(e.pointerType);
      if (e.pointerType === 'touch') return;

      if (sameCell.current && onCellClick)
        onCellClick(cellIndex);
      if (dragging.from !== null && onCellDrop)
        onCellDrop(dragging.from, cellIndex);
      setDragging({ from: null, pointer: { x: e.clientX, y: e.clientY } });
    },

    onPointerEnter: () => { setHoveredCell(cellIndex) },
    onPointerLeave: () => {
      setHoveredCell(null);
      sameCell.current = false;
    },
    onPointerCancel: () => { reset() },
  });

  // for dragged pieces
  useEffect(() => {
    if (dragging.from !== null) {
      const onPointerMove = (e: PointerEvent) => {
        setDragging(d => ({ ...d, pointer: { x: e.clientX, y: e.clientY } }));
      };
      window.addEventListener('pointermove', onPointerMove);
      return () => window.removeEventListener('pointermove', onPointerMove);
    }
  }, [dragging.from]);

  return {
    hoveredCell,
    dragging,
    getCellProps,
  };
} 