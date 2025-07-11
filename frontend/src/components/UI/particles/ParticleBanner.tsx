'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { toPng } from 'html-to-image';
import { createParticle, updateParticles } from './particleUtils';
import { Particle, MousePosition } from '@/types/particleTypes';
import useThemeColor from '@/hooks/useThemeColor';
import { DENSITY, SPEED, R_SQ } from './config';

export default function ParticleBanner({
  children,
}: {
  children: React.ReactNode;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sampleRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef<MousePosition>({
    x: -1000,
    y: -1000,
    radiusSq: R_SQ,
  });
  const [isRendered, setIsRendered] = useState(false);
  const colors = useThemeColor();
  const colorsRef = useRef(colors);

  useEffect(() => {
    colorsRef.current = colors;
  }, [colors]);

  const updateMousePosition = (clientX: number, clientY: number) => {
    if (!canvasRef.current) return;

    // Get the canvas position and size
    const rect = canvasRef.current.getBoundingClientRect();

    // Calculate the mouse position relative to the canvas
    // Ensure we're using the same coordinate system as the canvas
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Update mouse position
    mouseRef.current.x = x;
    mouseRef.current.y = y;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    updateMousePosition(e.clientX, e.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      updateMousePosition(touch.clientX, touch.clientY);
      e.preventDefault(); // Prevent scrolling while interacting with particles
    }
  };

  const handleMouseLeave = () => {
    mouseRef.current.x = -1000;
    mouseRef.current.y = -1000;
  };

  const createParticlesFromCanvas = (canvas: HTMLCanvasElement) => {
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

  const renderTextToCanvas = useCallback(async () => {
    if (!sampleRef.current || !canvasRef.current) return;

    try {
      const dataUrl = await toPng(sampleRef.current, {
        pixelRatio: 1,
        backgroundColor: 'transparent',
        cacheBust: true,
        canvasWidth: canvasRef.current.width,
        canvasHeight: canvasRef.current.height,
      });

      const img = new Image();
      img.src = dataUrl;

      img.onload = () => {
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx || !canvasRef.current) return;

        const { width, height } = canvasRef.current;

        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        createParticlesFromCanvas(canvasRef.current);
        setIsRendered(true);
      };
    } catch (error) {
      console.error('Error rendering text to canvas:', error);
    }
  }, []);

  const getAnimationSpeed = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return 0.2;
    }
    return 0.35;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let isAnimating = true;
    let lastRenderTime = 0;
    const frameRate = 60;
    const frameInterval = 1000 / frameRate;

    const updateCanvasSize = () => {
      const parent = canvas.parentElement;
      if (!parent) return { width: 0, height: 0 };

      const rect = parent.getBoundingClientRect();
      const width = Math.floor(rect.width);
      const height = Math.floor(rect.height);

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        ctx.setTransform(1, 0, 0, 1, 0, 0);

        particlesRef.current = [];
        renderTextToCanvas();
      }

      return { width, height };
    };

    const animate = (timestamp: number) => {
      if (!ctx) return;

      const now = timestamp || Date.now();
      const delta = now - lastRenderTime;

      if (delta > frameInterval) {
        lastRenderTime = now - (delta % frameInterval);

        const currentSpeed = getAnimationSpeed();
        updateParticles(particlesRef.current, mouseRef.current, currentSpeed);

        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        ctx.save();

        for (const particle of particlesRef.current) {
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fillStyle = colorsRef.current[particle.color];
          ctx.fill();
        }

        ctx.restore();
      }

      if (isAnimating) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    updateCanvasSize();
    setIsRendered(false);

    renderTextToCanvas().then(() => {
      animationFrameId = requestAnimationFrame(animate);
    });

    const handleResize = () => {
      updateCanvasSize();
      renderTextToCanvas();
    };

    let resizeObserver: ResizeObserver | null = null;

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(handleResize);
      const parent = canvas.parentElement;
      if (parent) {
        resizeObserver.observe(parent);
      }
    } else {
      window.addEventListener('resize', handleResize);
    }

    return () => {
      isAnimating = false;
      if (resizeObserver) {
        resizeObserver.disconnect();
      } else {
        window.removeEventListener('resize', handleResize);
      }
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  return (
    <div className="relative">
      <div
        ref={sampleRef}
        className={cn(
          'transition-opacity pointer-events-none',
          isRendered && 'opacity-0'
        )}
      >
        {children}
      </div>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full touch-none"
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseLeave}
        onTouchCancel={handleMouseLeave}
        onMouseLeave={handleMouseLeave}
        style={{
          WebkitTapHighlightColor: 'transparent',
        }}
      />
    </div>
  );
}
