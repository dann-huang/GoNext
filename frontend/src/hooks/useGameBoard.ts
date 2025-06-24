import { useState, useRef, useEffect } from 'react';

type useBoardProps = {
  onCellClick?: (cellIndex: number) => void;
  onCellDrop?: (fromIndex: number, toIndex: number) => void;
};

const noDrag = { from: null, pos: { x: 0, y: 0 } };

export function useGameBoard({ onCellClick, onCellDrop }: useBoardProps) {
  const [hoveredCell, setHoveredCell] = useState<number | null>(null);
  const [dragging, setDrag] = useState<{ from: number | null; pos: { x: number; y: number } }>(noDrag);
  const sameCell = useRef<boolean>(true); // for cursor cell click

  const lastInputType = useRef<React.PointerEvent['pointerType']>(null);
  const setInputType = (type: React.PointerEvent['pointerType']) => {
    if (lastInputType.current && lastInputType.current !== type) setDrag(noDrag);
    lastInputType.current = type;
  };

  const captured = useRef<{ ele: Element | null; ptr: number | null }>
    ({ ele: null, ptr: null });
  const capture = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    captured.current = { ele: e.currentTarget, ptr: e.pointerId };
  }
  const release = () => {
    if (captured.current.ele && captured.current.ptr !== null) {
      try {
        captured.current.ele.releasePointerCapture(captured.current.ptr);
      } finally {
        captured.current = { ele: null, ptr: null };
      }
    }
  }


  const getCellProps = (cellIndex: number) => ({
    onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => {
      e.stopPropagation()
      setInputType(e.pointerType);
      capture(e);
      if (e.pointerType === 'touch') {
        if (onCellClick) onCellClick(cellIndex);

        setDrag(drag => {
          if (drag.from === null)
            return { from: cellIndex, pos: { x: e.clientX, y: e.clientY } }

          onCellDrop && onCellDrop(drag.from, cellIndex);
          return { from: null, pos: { x: 0, y: 0 } }
        });
      } else {
        setDrag({ from: cellIndex, pos: { x: e.clientX, y: e.clientY } });
        sameCell.current = true;
      }
    },
    onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => {
      e.stopPropagation()
      release();
      setInputType(e.pointerType);
      if (e.pointerType === 'touch') return;

      if (sameCell.current && onCellClick)
        onCellClick(cellIndex);
      if (dragging.from !== null && onCellDrop)
        onCellDrop(dragging.from, cellIndex);
      setDrag({ from: null, pos: { x: e.clientX, y: e.clientY } });
    },

    onPointerEnter: () => { setHoveredCell(cellIndex) },
    onPointerLeave: () => {
      setHoveredCell(null);
      sameCell.current = false;
    },
  });

  // 
  useEffect(() => {
    if (dragging.from === null) return
    const onPointerMove = (e: PointerEvent) =>
      setDrag(d => ({ ...d, pos: { x: e.clientX, y: e.clientY } }))

    const reset = () => {
      release();
      setDrag(noDrag)
    }

    //cancel drag if outside. Up needed for mouse and down for touch
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', reset);
    window.addEventListener('pointerdown', reset);
    window.addEventListener('pointercancel', reset);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', reset);
      window.removeEventListener('pointerdown', reset);
      window.removeEventListener('pointercancel', reset);
    };
  }, [dragging.from]);

  return {
    hoveredCell,
    dragging,
    getCellProps,
  };
} 