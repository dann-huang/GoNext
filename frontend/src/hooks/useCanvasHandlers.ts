import { useMemo } from 'react';
import { MousePosition } from '@/types/particleTypes';

export const useCanvasHandlers = (
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  mouseRef: React.RefObject<MousePosition>
) => {
  const updateMousePosition = useMemo(
    () => (clientX: number, clientY: number) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      mouseRef.current.x = clientX - rect.left;
      mouseRef.current.y = clientY - rect.top;
    },
    [canvasRef, mouseRef]
  );

  const handleMouseMove = useMemo(
    () => (e: React.MouseEvent<HTMLCanvasElement>) => {
      updateMousePosition(e.clientX, e.clientY);
    },
    [updateMousePosition]
  );

  const handleTouchMove = useMemo(
    () => (e: React.TouchEvent<HTMLCanvasElement>) => {
      if (e.touches.length < 1) return;
      const touch = e.touches[0];
      updateMousePosition(touch.clientX, touch.clientY);
    },
    [updateMousePosition]
  );

  const handleMouseLeave = useMemo(
    () => () => {
      mouseRef.current.x = -1000;
      mouseRef.current.y = -1000;
    },
    [mouseRef]
  );

  return {
    onMouseMove: handleMouseMove,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleMouseLeave,
    onTouchCancel: handleMouseLeave,
    onMouseLeave: handleMouseLeave,
  };
};
