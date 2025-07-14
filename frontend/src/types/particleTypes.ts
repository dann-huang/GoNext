import { ThemeColorName } from '@/hooks/useThemeColor';

export interface Particle {
  x: number;
  y: number;
  originX: number;
  originY: number;
  size: number;
  color: ThemeColorName;
  vx: number;
  vy: number;
  friction: number;
  ease: number;
}

export interface MousePosition {
  x: number;
  y: number;
  radiusSq: number;
}
