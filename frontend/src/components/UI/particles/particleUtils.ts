import { ThemeColorName } from '@/hooks/useThemeColor';
import { Particle, MousePosition } from '@/types/particleTypes';
import { SPREAD, SIZE, EASE, FRICTION, SPEED, DENSITY } from './config';
import { useMemo } from 'react';

export const createParticle = (
  width: number,
  height: number,
  x: number,
  y: number,
  color: ThemeColorName
): Particle => {
  const posX = x + SPREAD();
  const posY = y + SPREAD();

  const toLeft = posX;
  const toRight = width - posX;
  const toTop = posY;
  const toBottom = height - posY;
  const minDist = Math.min(toLeft, toRight, toTop, toBottom);

  let startX: number, startY: number;

  const edgeSpread = 0.6;
  const buffer = 10;
  if (minDist === toLeft) {
    startX = -buffer;
    startY = posY + (Math.random() - 0.5) * height * edgeSpread;
  } else if (minDist === toRight) {
    startX = width + buffer;
    startY = posY + (Math.random() - 0.5) * height * edgeSpread;
  } else if (minDist === toTop) {
    startX = posX + (Math.random() - 0.5) * width * edgeSpread;
    startY = -buffer;
  } else {
    startX = posX + (Math.random() - 0.5) * width * edgeSpread;
    startY = height + buffer;
  }

  return {
    x: startX,
    y: startY,
    originX: posX,
    originY: posY,
    size: SIZE(),
    color,
    vx: 0,
    vy: 0,
    friction: FRICTION,
    ease: EASE(),
  };
};

export const parseImgData = (
  canvas: HTMLCanvasElement,
  particlesRef: React.RefObject<Particle[]>
) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height).data;

  particlesRef.current = [];

  for (let y = 0; y < height; y += DENSITY) {
    for (let x = 0; x < width; x += DENSITY) {
      const index = (y * width + x) * 4;
      if (imageData[index + 3] > 128) {
        const color = Math.random() < 0.9 ? 'primary' : 'accent';
        particlesRef.current.push(createParticle(width, height, x, y, color));
      }
    }
  }
};

export const updateParticles = (
  particles: Particle[],
  mouse: MousePosition,
  speed: number = SPEED
): void => {
  for (const particle of particles) {
    const dx = mouse.x - particle.x;
    const dy = mouse.y - particle.y;

    const distance = dx * dx + dy * dy;
    if (distance < mouse.radiusSq) {
      const angle = Math.atan2(dy, dx);
      const force = (mouse.radiusSq - distance) / mouse.radiusSq;
      particle.vx -= Math.cos(angle) * force * speed * 3;
      particle.vy -= Math.sin(angle) * force * speed * 3;
    }

    const dx2 = particle.originX - particle.x;
    const dy2 = particle.originY - particle.y;

    particle.vx += dx2 * particle.ease;
    particle.vy += dy2 * particle.ease;

    particle.vx *= particle.friction;
    particle.vy *= particle.friction;

    particle.x += particle.vx;
    particle.y += particle.vy;
  }
};

export const canvasHandlers = (
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

export const updateCanvasSize = (canvas: HTMLCanvasElement) => {
  const parent = canvas.parentElement;
  if (!parent) return;

  const rect = parent.getBoundingClientRect();
  const width = Math.floor(rect.width);
  const height = Math.floor(rect.height);

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
};
