'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { toPng } from 'html-to-image';
import {
  parseImgData,
  updateCanvasSize,
  updateParticles,
} from './particleUtils';
import { Particle, MousePosition } from '@/types/particleTypes';
import useThemeColor from '@/hooks/useThemeColor';
import { R_SQ } from './config';
import useDebounce from '@/hooks/useDebounce';
import { useCanvasHandlers } from '@/hooks/useCanvasHandlers';

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
  const colors = useThemeColor();
  const colorsRef = useRef(colors);
  useEffect(() => void (colorsRef.current = colors), [colors]);

  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const dbSize = useDebounce(canvasSize, 500);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateSize = () => {
      setCanvasSize({
        width: canvas.offsetWidth,
        height: canvas.offsetHeight,
      });
    };

    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(canvas);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const sampleSnapshot = useCallback(async (callback: () => void) => {
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

        parseImgData(canvasRef.current, particlesRef);
        callback();
      };
    } catch (error) {
      console.error('Error rendering text to canvas:', error);
    }
  }, []);

  useEffect(() => {
    sampleRef.current?.classList.remove('opacity-0');
    const canvas = canvasRef.current;
    if (!canvas || !dbSize.width || !dbSize.height) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let isAnimating = true;
    let lastRenderTime = 0;
    const frameRate = 60;
    const frameInterval = 1000 / frameRate;

    const animate = (timestamp: number) => {
      if (!ctx) return;

      const now = timestamp || Date.now();
      const delta = now - lastRenderTime;

      if (delta > frameInterval) {
        lastRenderTime = now - (delta % frameInterval);

        updateParticles(particlesRef.current, mouseRef.current);
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        for (const particle of particlesRef.current) {
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fillStyle = colorsRef.current[particle.color];
          ctx.fill();
        }
      }

      if (isAnimating) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    updateCanvasSize(canvas);
    sampleSnapshot(() => {
      sampleRef.current?.classList.add('opacity-0');
      animationFrameId = requestAnimationFrame(animate);
    });

    return () => {
      isAnimating = false;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [dbSize]);

  return (
    <div className="relative">
      <div ref={sampleRef} className="pointer-events-none">
        {children}
      </div>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full touch-none"
        {...useCanvasHandlers(canvasRef, mouseRef)}
        style={{
          WebkitTapHighlightColor: 'transparent',
        }}
      />
    </div>
  );
}
