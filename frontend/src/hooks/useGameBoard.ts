import { TOUCH_HOLD_DURATION } from '@/config/consts';
import { useState, useRef, useEffect, useCallback } from 'react';

type ClickType = 'left' | 'right';

type useBoardProps = {
  onCellClick?: (cellIndex: number, clickType?: ClickType) => void;
  onCellDrop?: (fromIndex: number, toIndex: number) => void;
  touchOffset?: { x: number; y: number };
};

export function useGameBoard({ onCellClick, onCellDrop, touchOffset = { x: 0, y: 10 } }: useBoardProps) {
  const [hoveredCell, setHoveredCell] = useState<number | null>(null);
  const [dragging, setDrag] = useState<number | null>(null);

  const shouldContinue = useRef<boolean>(false);

  const lastInputType = useRef<React.PointerEvent['pointerType']>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const touchTimeout = useRef<NodeJS.Timeout | null>(null);

  const reset = useCallback(() => {
    setDrag(null);
    touchStart.current = null;
    if (touchTimeout.current) clearTimeout(touchTimeout.current);
    shouldContinue.current = false;
  }, []);
  const setInputType = (type: React.PointerEvent['pointerType']) => {
    if (lastInputType.current && lastInputType.current !== type) reset();
    lastInputType.current = type;
  };

  const handleMouseDown = (e: React.PointerEvent, cellIndex: number) => {
    setDrag(cellIndex);
    shouldContinue.current = true;
  }
  const handleMouseUp = (e: React.PointerEvent, cellIndex: number) => {
    if (onCellClick && shouldContinue.current)
      onCellClick(cellIndex, e.button === 0 ? 'left' : 'right');
    if (onCellDrop && dragging !== null && hoveredCell !== null)
      onCellDrop(dragging, hoveredCell);
    reset();
  }

  const handleTouchDown = (e: React.PointerEvent, cellIndex: number) => {
    // touch 1/2
    if (touchTimeout.current) clearTimeout(touchTimeout.current);
    shouldContinue.current = true;
    touchTimeout.current = setTimeout(() => {
      if (!shouldContinue.current || !touchStart.current) return;
      shouldContinue.current = false;
      if (onCellClick) onCellClick(cellIndex, 'right');

    }, TOUCH_HOLD_DURATION);
    // fake drag
    if (dragging === null) {
      console.debug(123)
      setDrag(cellIndex);
      const rect = e.currentTarget.getBoundingClientRect();
      const x = rect.left + rect.width / 2 + touchOffset.x;
      const y = rect.top + rect.height / 2 - touchOffset.y;
      touchStart.current = { x, y };
    } else {
      if (onCellDrop) onCellDrop(dragging, cellIndex);
      setDrag(null);
    }
  }
  const handleTouchUp = (e: React.PointerEvent, cellIndex: number) => {
    // touch 2/2
    if (!touchStart.current || !shouldContinue.current) return;
    shouldContinue.current = false;
    if (onCellClick) onCellClick(cellIndex, 'left');
  }

  const getCellProps = (cellIndex: number) => ({
    onPointerDown: (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault()
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
    },
    onPointerEnter: () => { setHoveredCell(cellIndex) },
    onPointerLeave: () => {
      setHoveredCell(null);
      shouldContinue.current = false;
    },
    onContextMenu: (e: React.PointerEvent<HTMLDivElement>) => {
      e.stopPropagation()
      e.preventDefault()
    },
  });

  useEffect(() => {
    //cancel drag if outside. Up needed for mouse and down for touch
    window.addEventListener('pointerup', reset);
    window.addEventListener('pointerdown', reset);
    window.addEventListener('pointercancel', reset);
    return () => {
      window.removeEventListener('pointerup', reset);
      window.removeEventListener('pointerdown', reset);
      window.removeEventListener('pointercancel', reset);
    };
  }, [reset]);

  return {
    hoveredCell,
    dragging,
    hangingPos: touchStart.current,
    getCellProps,
  };
} 