'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { toPng } from 'html-to-image';
import {
  createParticlesFromCanvas as createParticlesFromCanvasUtil,
  updateParticles,
  renderParticles,
  type Particle,
  type MousePosition,
} from './particleUtils';

const PARTICLE_DENSITY = 4;
const PARTICLE_SPEED = 0.4;
const MOUSE_RADIUS = 250;

export default function ParticleBanner() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef<MousePosition>({
    x: -1000,
    y: -1000,
    radius: MOUSE_RADIUS,
  });
  const [particleColor, setParticleColor] = useState('#ffffff');
  const [isRendered, setIsRendered] = useState(false);

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

  // Create particles from canvas image data
  const createParticlesFromCanvas = (canvas: HTMLCanvasElement) => {
    const particles = createParticlesFromCanvasUtil(
      canvas,
      particleColor,
      PARTICLE_DENSITY
    );
    particlesRef.current = particles;
  };

  const renderTextToCanvas = useCallback(async () => {
    if (!textRef.current || !canvasRef.current) return;

    try {
      const dataUrl = await toPng(textRef.current, {
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
  }, [particleColor]);

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

      // Get the parent container dimensions
      const rect = parent.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      // Set actual size in memory (scaled for DPR)
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      return { width, height };
    };

    const animate = () => {
      if (!ctx) return;

      // Update and draw particles
      updateParticles(particlesRef.current, mouseRef.current, PARTICLE_SPEED);
      renderParticles(ctx, particlesRef.current);

      // Continue animation
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
  }, [particleColor]);

  return (
    <div className="relative w-full h-48 md:h-64 flex items-center justify-center">
      {/* Text element used for rendering - only hidden after canvas is ready */}
      <div
        ref={textRef}
        className={cn(
          'absolute w-full h-full flex items-center justify-center transition-opacity pointer-events-none',
          isRendered && 'opacity-0',
          'px-4' // Add some horizontal padding for better text display
        )}
      >
        <div
          className={cn(
            'text-7xl md:text-8xl lg:text-9xl font-black text-center w-full',
            'transform transition-transform duration-300',
            'whitespace-nowrap', // Prevent text wrapping
            'tracking-tight' // Tighter letter spacing for better readability
          )}
          style={{
            color: particleColor,
            textShadow: `0 0 10px ${particleColor}33`, // Subtle glow effect
          }}
        >
          Go Next
        </div>
      </div>

      {/* Canvas for rendering */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block cursor-pointer"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
    </div>
  );
}
