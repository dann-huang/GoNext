import { ThemeColorName } from '@/hooks/useThemeColor';
import { Particle, MousePosition } from '@/types/particleTypes';
import { SPREAD, SIZE, EASE, FRICTION } from './config';

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

  const edgeSpread = 0.8;
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

export const updateParticles = (
  particles: Particle[],
  mouse: MousePosition,
  speed: number = 0.4
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
