import { useState, useRef, useEffect } from 'react';

type useBoardProps = {
  onCellClick?: (cellIndex: number) => void;
  onCellDrop?: (fromIndex: number, toIndex: number) => void;
  touchOffset?: { x: number; y: number };
};

const noDrag = { from: null, pos: { x: 0, y: 0 } };

export function useGameBoard({ onCellClick, onCellDrop, touchOffset = { x: 0, y: 10 } }: useBoardProps) {
  const [hoveredCell, setHoveredCell] = useState<number | null>(null);
  const [dragging, setDrag] = useState<{ from: number | null; pos: { x: number; y: number } }>(noDrag);
  const sameCell = useRef<boolean>(true); // for cursor cell click

  const lastInputType = useRef<React.PointerEvent['pointerType']>(null);
  const setInputType = (type: React.PointerEvent['pointerType']) => {
    if (lastInputType.current && lastInputType.current !== type) setDrag({ ...noDrag });
    lastInputType.current = type;
  };

  /* causing problems with mouse drag. Prolly need to be used with manual hit test */
  // const captured = useRef<{ ele: Element | null; ptr: number | null }>
  //   ({ ele: null, ptr: null });
  // const capture = (e: React.PointerEvent) => {
  //   e.currentTarget.setPointerCapture(e.pointerId);
  //   captured.current = { ele: e.currentTarget, ptr: e.pointerId };
  // }
  // const release = () => {
  //   if (captured.current.ele && captured.current.ptr !== null) {
  //     try {
  //       captured.current.ele.releasePointerCapture(captured.current.ptr);
  //     } finally {
  //       captured.current = { ele: null, ptr: null };
  //     }
  //   }
  // }


  const getCellProps = (cellIndex: number) => ({
    onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => {
      e.stopPropagation()
      setInputType(e.pointerType);
      // capture(e);
      if (e.pointerType === 'touch') {
        if (onCellClick) onCellClick(cellIndex);

        if (dragging.from === null) {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = rect.left + rect.width / 2 + touchOffset.x;
          const y = rect.top + rect.height / 2 - touchOffset.y;
          setDrag({ from: cellIndex, pos: { x, y } })
        } else {
          setDrag({ ...noDrag })
          onCellDrop && onCellDrop(dragging.from, cellIndex);
        }
      } else {
        setDrag({ from: cellIndex, pos: { x: e.clientX, y: e.clientY } });
        sameCell.current = true;
      }
    },
    onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => {
      e.stopPropagation()
      // release();
      setInputType(e.pointerType);
      if (e.pointerType === 'touch') return;

      if (onCellClick && sameCell.current)
        onCellClick(cellIndex);
      if (onCellDrop && dragging.from !== null && hoveredCell !== null)
        onCellDrop(dragging.from, hoveredCell);
      setDrag({ ...noDrag });
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
    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      setDrag(d => ({ ...d, pos: { x: e.clientX, y: e.clientY } }))
    }

    const reset = () => {
      // release();
      setDrag({ ...noDrag })
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