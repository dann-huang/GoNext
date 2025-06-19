'use client';

import { useRef, useEffect, useState } from 'react';
import { useWebSocket } from './webSocket';
import type { DrawPayload } from '@/types/wsTypes';
import { GameState, RawSignal } from '@/types/wsTypes';
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

  // Start a new drawing stroke at the given coordinates
  const startDrawing = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(x, y);

    // Start new stroke
    currentStroke.current = [{ x, y }];
    lastSendTime.current = Date.now();
  };

  // Continue drawing to the given coordinates
  const draw = (x: number, y: number) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(x, y);
    ctx.stroke();

    currentStroke.current.push({ x, y });

    if (Date.now() - lastSendTime.current >= DRAW_STROKE_INTERVAL) {
      sendStroke();
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (currentStroke.current.length > 0) {
      sendStroke();
    }
  };

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
  };
} 