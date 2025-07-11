'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { toPng } from 'html-to-image';

interface Particle {
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

interface MousePosition {
  x: number;
  y: number;
  radius: number;
}

const TEXT = 'GoNext';
const PARTICLE_DENSITY = 4;
const PARTICLE_SPEED = 0.4;
const MOUSE_RADIUS = 250;

const createParticle = (
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

const getPrimaryColor = (): string => {
  if (typeof window === 'undefined') return '#ffffff';
  return (
    getComputedStyle(document.documentElement)
      .getPropertyValue('--color-primary')
      .trim() || '#ffffff'
  );
};

const TitleBanner = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef<MousePosition>({ x: -1000, y: -1000, radius: MOUSE_RADIUS });
  const [mounted, setMounted] = useState(false);
  const [particleColor, setParticleColor] = useState('#ffffff');
  const [isRendered, setIsRendered] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Handle mouse move
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    mouseRef.current.x = (e.clientX - rect.left) * dpr;
    mouseRef.current.y = (e.clientY - rect.top) * dpr;
  };

  // Handle mouse leave
  const handleMouseLeave = () => {
    mouseRef.current.x = -1000;
    mouseRef.current.y = -1000;
  };

  // Create particles from canvas image data
  const createParticlesFromCanvas = (canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const { width, height } = canvas;
    particlesRef.current = [];
    
    // Get pixel data from canvas
    const imageData = ctx.getImageData(0, 0, width, height).data;
    
    // Create particles from non-transparent pixels
    for (let y = 0; y < height; y += PARTICLE_DENSITY) {
      for (let x = 0; x < width; x += PARTICLE_DENSITY) {
        const index = (y * width + x) * 4;
        // Only create particles for non-transparent pixels (alpha > 128)
        if (imageData[index + 3] > 128) {
          particlesRef.current.push(
            createParticle(width, height, x, y, particleColor)
          );
        }
      }
    }
  };

  // Render text to canvas using toPng
  const renderTextToCanvas = useCallback(async () => {
    if (!textRef.current || !canvasRef.current) return;
    
    try {
      // Convert the text element to a data URL
      const dataUrl = await toPng(textRef.current, {
        pixelRatio: 2, // Render at higher resolution for better quality
        backgroundColor: 'transparent',
      });
      
      // Create an image from the data URL
      const img = new Image();
      img.src = dataUrl;
      
      // When the image loads, draw it to canvas and create particles
      img.onload = () => {
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx || !canvasRef.current) return;
        
        const { width, height } = canvasRef.current;
        
        // Clear and draw the image
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        
        // Create particles from the rendered text
        createParticlesFromCanvas(canvasRef.current);
        setIsRendered(true);
      };
    } catch (error) {
      console.error('Error rendering text to canvas:', error);
    }
  }, [particleColor]);

  // Initialize canvas and animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let animationFrameId: number;
    let isAnimating = true;

    const updateCanvasSize = () => {
      const dpr = window.devicePixelRatio || 1;
      const parent = canvas.parentElement;
      if (!parent) return { width: 0, height: 0 };
      
      // Get the parent container dimensions
      const rect = parent.getBoundingClientRect();
      const containerWidth = Math.max(rect.width, 100); // Ensure minimum width
      const containerHeight = Math.max(rect.height, 200); // Increased minimum height for better text display
      
      // Set display size (CSS pixels)
      canvas.style.width = `${containerWidth}px`;
      canvas.style.height = `${containerHeight}px`;
      
      // Set actual size in memory (scaled for DPR)
      canvas.width = Math.floor(containerWidth * dpr);
      canvas.height = Math.floor(containerHeight * dpr);
      
      // Reset transform and scale for high DPI
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      
      // Store the logical size for our calculations
      width = containerWidth;
      height = containerHeight;
      setDimensions({ width, height });
      
      return { width, height };
    };

    const createParticles = () => {
      if (!ctx || width === 0 || height === 0) return;
      
      particlesRef.current = [];
      
      // Calculate font size based on viewport width, with a minimum size
      const baseFontSize = Math.min(width * 0.15, height * 0.7); // Increased height ratio for larger text
      const fontSize = Math.max(32, baseFontSize); // Increased minimum font size
      
      // Set font with proper weight and family
      ctx.font = `900 ${fontSize}px 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const textX = width / 2;
      const textY = height / 2;
      
      // Draw text to get pixel data
      ctx.fillStyle = '#fff';
      ctx.fillText(TEXT, textX, textY);
      
      // Get pixel data for text
      const imageData = ctx.getImageData(0, 0, width, height).data;
      ctx.clearRect(0, 0, width, height);
      
      // Create particles from text pixels
      for (let y = 0; y < height; y += PARTICLE_DENSITY) {
        for (let x = 0; x < width; x += PARTICLE_DENSITY) {
          const index = (y * width + x) * 4;
          // Only create particles for non-transparent pixels (alpha > 128)
          if (imageData[index + 3] > 128) {
            particlesRef.current.push(
              createParticle(width, height, x, y, particleColor)
            );
          }
        }
      }
    };

    const animate = () => {
      if (!ctx) return;
      
      // Clear the canvas
      ctx.clearRect(0, 0, width, height);
      
      // Get current color from CSS variable
      const currentColor = getPrimaryColor();
      if (currentColor !== particleColor) {
        setParticleColor(currentColor);
      }
      
      // Update and draw particles
      for (const particle of particlesRef.current) {
        // Mouse interaction
        const dx = mouseRef.current.x - particle.x;
        const dy = mouseRef.current.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Push particles away from mouse
        if (distance < mouseRef.current.radius) {
          const angle = Math.atan2(dy, dx);
          const force = (mouseRef.current.radius - distance) / mouseRef.current.radius;
          particle.vx -= Math.cos(angle) * force * PARTICLE_SPEED * 3; // Increased force
          particle.vy -= Math.sin(angle) * force * PARTICLE_SPEED * 3; // Increased force
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
        
        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = currentColor;
        ctx.fill();
      }
      
      // Continue animation
      if (isAnimating) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    // Initialize canvas
    updateCanvasSize();
    
    // Start with the text element visible
    setIsRendered(false);
    
    // Render text to canvas and create particles
    renderTextToCanvas().then(() => {
      // Start animation after particles are created
      animationFrameId = requestAnimationFrame(animate);
    });
    
    // Handle window resize
    const handleResize = () => {
      updateCanvasSize();
      renderTextToCanvas();
    };
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup function
    return () => {
      isAnimating = false;
      window.removeEventListener('resize', handleResize);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [particleColor]);

  // Initialize on mount and handle theme changes
  useEffect(() => {
    setMounted(true);
    setParticleColor(getPrimaryColor());
    
    // Set up theme change observer
    const observer = new MutationObserver(() => {
      const newColor = getPrimaryColor();
      if (newColor !== particleColor) {
        setParticleColor(newColor);
        // Re-render text when theme changes
        renderTextToCanvas();
      }
    });
    
    // Watch for theme changes
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'style']
    });
    
    return () => {
      observer.disconnect();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [renderTextToCanvas]);

  return (
    <div className="relative w-full h-48 md:h-64 flex items-center justify-center">
      {/* Text element used for rendering - only hidden after canvas is ready */}
      <div 
        ref={textRef}
        className={cn(
          'absolute w-full h-full flex items-center justify-center transition-opacity pointer-events-none',
          isRendered ? 'invisible opacity-0' : 'visible opacity-100',
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
            textShadow: `0 0 10px ${particleColor}33` // Subtle glow effect
          }}
        >
          {TEXT}
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
};

export default TitleBanner;
