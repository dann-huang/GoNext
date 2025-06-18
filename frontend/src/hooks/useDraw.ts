'use client';

import { useRef, useEffect, useState } from 'react';
import { useWebSocket } from './webSocket';
import type { DrawPayload } from '@/types/wsTypes';
import { RawSignal } from '@/types/wsTypes';
import { DRAW_STROKE_INTERVAL } from '@/config/consts';

interface Point {
  x: number;
  y: number;
}

interface DrawState {
  color: string;
  lineWidth: number;
}

export function useDraw() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawState, setDrawState] = useState<DrawState>({
    color: '#777777',
    lineWidth: 2
  });
  const { sendMessage, setDrawHandler } = useWebSocket();

  // Store points for current stroke
  const currentStroke = useRef<Point[]>([]);
  const lastSendTime = useRef<number>(0);

  // Send current stroke points
  const sendStroke = () => {
    if (currentStroke.current.length === 0) return;

    const drawData: DrawPayload = {
      type: 'draw',
      points: currentStroke.current,
      color: drawState.color,
      width: drawState.lineWidth
    };

    sendMessage({
      type: RawSignal,
      sender: 'drawer',
      payload: drawData
    });

    // Clear sent points but keep the last point as the start of the next segment
    const lastPoint = currentStroke.current[currentStroke.current.length - 1];
    currentStroke.current = [lastPoint];
    lastSendTime.current = Date.now();
  };

  // Initialize canvas context
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Set initial styles
    ctx.strokeStyle = drawState.color;
    ctx.lineWidth = drawState.lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [drawState.color, drawState.lineWidth]);

  // Handle drawing
  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      // Touch event
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      // Mouse event
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault(); // Prevent scrolling on touch devices
    
    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);

    // Start new stroke
    currentStroke.current = [{ x: coords.x, y: coords.y }];
    lastSendTime.current = Date.now();
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault(); // Prevent scrolling on touch devices
    
    const coords = getCoordinates(e);
    if (!coords) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();

    // Add point to current stroke
    currentStroke.current.push({ x: coords.x, y: coords.y });

    // Send stroke if enough time has passed
    if (Date.now() - lastSendTime.current >= DRAW_STROKE_INTERVAL) {
      sendStroke();
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    // Send any remaining points
    if (currentStroke.current.length > 0) {
      sendStroke();
    }
  };

  // Handle received draw data
  useEffect(() => {
    const handleDrawData = (data: DrawPayload) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set received styles
      ctx.strokeStyle = data.color;
      ctx.lineWidth = data.width;

      // Draw received points as a complete stroke
      if (data.points.length > 0) {
        ctx.beginPath();
        ctx.moveTo(data.points[0].x, data.points[0].y);

        for (let i = 1; i < data.points.length; i++) {
          ctx.lineTo(data.points[i].x, data.points[i].y);
        }
        ctx.stroke();
      }
    };

    setDrawHandler(handleDrawData);

    return () => {
      setDrawHandler(() => { });
    };
  }, [setDrawHandler]);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  return {
    canvasRef,
    drawState,
    setDrawState,
    startDrawing,
    draw,
    stopDrawing,
    clearCanvas,
    // Add touch-specific handlers
    touchHandlers: {
      onTouchStart: startDrawing,
      onTouchMove: draw,
      onTouchEnd: stopDrawing,
      onTouchCancel: stopDrawing
    }
  };
} 