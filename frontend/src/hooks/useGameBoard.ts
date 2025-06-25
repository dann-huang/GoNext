import { TOUCH_CANCEL_DISTANCE, TOUCH_HOLD_DURATION } from '@/config/consts';
import { useState, useRef, useEffect } from 'react';

type ClickType = 'left' | 'right';

type useBoardProps = {
  onCellClick?: (cellIndex: number, clickType?: ClickType) => void;
  onCellDrop?: (fromIndex: number, toIndex: number) => void;
  touchOffset?: { x: number; y: number };
};

const noDrag = { from: null, pos: { x: 0, y: 0 } };

export function useGameBoard({ onCellClick, onCellDrop, touchOffset = { x: 0, y: 10 } }: useBoardProps) {
  const [hoveredCell, setHoveredCell] = useState<number | null>(null);
  const [dragging, setDrag] = useState<{ from: number | null; pos: { x: number; y: number } }>(noDrag);
  const cursorSameCell = useRef<boolean>(true);
  const touchStart = useRef<{ x: number; y: number, time: number } | null>(null);
  const lastInputType = useRef<React.PointerEvent['pointerType']>(null);
  const setInputType = (type: React.PointerEvent['pointerType']) => {
    if (lastInputType.current && lastInputType.current !== type) setDrag({ ...noDrag });
    lastInputType.current = type;
  };
  const reset = () => { setDrag({ ...noDrag }); touchStart.current = null; }

  const handleMouseDown = (e: React.PointerEvent, cellIndex: number) => {
    setDrag({ from: cellIndex, pos: { x: e.clientX, y: e.clientY } });
    cursorSameCell.current = true;
  }
  const handleMouseUp = (e: React.PointerEvent, cellIndex: number) => {
    if (onCellClick && cursorSameCell.current)
      onCellClick(cellIndex, e.button === 0 ? 'left' : 'right');
    if (onCellDrop && dragging.from !== null && hoveredCell !== null)
      onCellDrop(dragging.from, hoveredCell);
  }

  const handleTouchDown = (e: React.PointerEvent, cellIndex: number) => {
    touchStart.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    if (dragging.from === null) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = rect.left + rect.width / 2 + touchOffset.x;
      const y = rect.top + rect.height / 2 - touchOffset.y;
      setDrag({ from: cellIndex, pos: { x, y } })
    } else {
      reset();
      if (onCellDrop) onCellDrop(dragging.from, cellIndex);
    }
  }
  const handleTouchUp = (e: React.PointerEvent, cellIndex: number) => {
    if (touchStart.current) {
      const { x, y, time } = touchStart.current;
      const dt = Date.now() - time;

      if (Math.abs(dragging.pos.x - x) < TOUCH_CANCEL_DISTANCE
        && Math.abs(dragging.pos.y - y) < TOUCH_CANCEL_DISTANCE) {
        if (onCellClick) onCellClick(cellIndex, dt < TOUCH_HOLD_DURATION ? 'left' : 'right');
      }
    }
  }

  const getCellProps = (cellIndex: number) => ({
    onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => {
      e.stopPropagation()
      setInputType(e.pointerType);
      if (e.pointerType === 'touch') handleTouchDown(e, cellIndex);
      else handleMouseDown(e, cellIndex);
    },
    onPointerUp: (e: React.PointerEvent<HTMLDivElement>) => {
      e.stopPropagation()
      setInputType(e.pointerType);
      if (e.pointerType === 'touch') handleTouchUp(e, cellIndex);
      else handleMouseUp(e, cellIndex);
      reset();
    },
    onPointerEnter: () => { setHoveredCell(cellIndex) },
    onPointerLeave: () => {
      setHoveredCell(null);
      cursorSameCell.current = false;
    },
  });

  useEffect(() => {
    if (dragging.from === null) return
    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      setDrag(d => ({ ...d, pos: { x: e.clientX, y: e.clientY } }))
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