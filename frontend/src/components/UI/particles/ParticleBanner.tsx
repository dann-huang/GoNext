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

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    mouseRef.current.x = (e.clientX - rect.left) * dpr;
    mouseRef.current.y = (e.clientY - rect.top) * dpr;
  };

  const handleMouseLeave = () => {
    mouseRef.current.x = -1000;
    mouseRef.current.y = -1000;
  };

  const createParticlesFromCanvas = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return [];

    const { width, height } = canvas;
    const imageData = ctx.getImageData(0, 0, width, height).data;

    for (let y = 0; y < height; y += DENSITY) {
      for (let x = 0; x < width; x += DENSITY) {
        const color = Math.random() < 0.9 ? 'primary' : 'accent';
        const index = (y * width + x) * 4;
        if (imageData[index + 3] > 128) {
          particlesRef.current.push(createParticle(width, height, x, y, color));
        }
      }
    }
  };

  const renderTextToCanvas = useCallback(async () => {
    if (!sampleRef.current || !canvasRef.current) return;

    try {
      const dataUrl = await toPng(sampleRef.current, {
        pixelRatio: 2,
        backgroundColor: 'transparent',
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let isAnimating = true;

    const updateCanvasSize = () => {
      const dpr = window.devicePixelRatio || 1;
      const parent = canvas.parentElement;
      if (!parent) return { width: 0, height: 0 };

      const rect = parent.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      return { width, height };
    };

    const animate = () => {
      if (!ctx) return;

      updateParticles(particlesRef.current, mouseRef.current, SPEED);
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      for (const particle of particlesRef.current) {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = colorsRef.current[particle.color];
        ctx.fill();
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

    window.addEventListener('resize', handleResize);

    return () => {
      isAnimating = false;
      window.removeEventListener('resize', handleResize);
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
        className="absolute inset-0 w-full h-full"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
    </div>
  );
}
