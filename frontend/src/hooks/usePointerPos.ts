import { useState, useEffect } from 'react';

export default function usePointerPos() {
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const updatePosition = (e: PointerEvent) =>
      setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener('pointermove', updatePosition);

    return () => window.removeEventListener('pointermove', updatePosition);
  }, []);

  return pos;
}