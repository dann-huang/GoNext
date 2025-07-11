
export interface Particle {
  x: number;
  y: number;
  originX: number;
  originY: number;
  size: number;
  color: string;
  vx: number;
  vy: number;
  friction: number;
  ease: number;
}

export interface MousePosition {
  x: number;
  y: number;
  radius: number;
}

export const createParticle = (
  width: number,
  height: number,
  x: number,
  y: number,
  color: string
): Particle => {
  const posX = x + (Math.random() - 0.5) * 5;
  const posY = y + (Math.random() - 0.5) * 5;

  const toLeft = posX;
  const toRight = width - posX;
  const toTop = posY;
  const toBottom = height - posY;
  const minDist = Math.min(toLeft, toRight, toTop, toBottom);

  let startX: number, startY: number;
  const edgeSpread = 0.8;

  if (minDist === toLeft) {
    startX = -10;
    startY = posY + (Math.random() - 0.5) * height * edgeSpread;
  } else if (minDist === toRight) {
    startX = width + 10;
    startY = posY + (Math.random() - 0.5) * height * edgeSpread;
  } else if (minDist === toTop) {
    startX = posX + (Math.random() - 0.5) * width * edgeSpread;
    startY = -10;
  } else {
    startX = posX + (Math.random() - 0.5) * width * edgeSpread;
    startY = height + 10;
  }

  return {
    x: startX,
    y: startY,
    originX: posX,
    originY: posY,
    size: 2 + Math.random() * 2,
    color,
    vx: 0,
    vy: 0,
    friction: 0.95,
    ease: Math.random() * 0.1 + 0.02,
  };
};

export const createParticlesFromCanvas = (canvas: HTMLCanvasElement, color: string, density: number = 4): Particle[] => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return [];

  const { width, height } = canvas;
  const particles: Particle[] = [];
  const imageData = ctx.getImageData(0, 0, width, height).data;

  for (let y = 0; y < height; y += density) {
    for (let x = 0; x < width; x += density) {
      const index = (y * width + x) * 4;
      if (imageData[index + 3] > 128) {
        particles.push(createParticle(width, height, x, y, color));
      }
    }
  }

  return particles;
};

export const updateParticles = (particles: Particle[], mouse: MousePosition, speed: number = 0.4): void => {
  for (const particle of particles) {
    // Mouse interaction
    const dx = mouse.x - particle.x;
    const dy = mouse.y - particle.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Push particles away from mouse
    if (distance < mouse.radius) {
      const angle = Math.atan2(dy, dx);
      const force = (mouse.radius - distance) / mouse.radius;
      particle.vx -= Math.cos(angle) * force * speed * 3;
      particle.vy -= Math.sin(angle) * force * speed * 3;
    }

    // Return to original position with easing
    const dx2 = particle.originX - particle.x;
    const dy2 = particle.originY - particle.y;

    particle.vx += dx2 * particle.ease;
    particle.vy += dy2 * particle.ease;

    // Apply friction
    particle.vx *= particle.friction;
    particle.vy *= particle.friction;

    // Update position
    particle.x += particle.vx;
    particle.y += particle.vy;
  }
};

export const renderParticles = (ctx: CanvasRenderingContext2D, particles: Particle[]): void => {
  // Clear the canvas
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // Draw particles
  for (const particle of particles) {
    // Draw particle
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    ctx.fillStyle = particle.color;
    ctx.fill();
  }
};