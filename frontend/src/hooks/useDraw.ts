'use client';

import { useRef, useEffect, useState } from 'react';
import { useWebSocket } from './webSocket';
import type { DrawPayload } from '@/types/wsTypes';
import { RawSignal } from '@/types/wsTypes';
import { DRAW_START_COLOR, DRAW_STROKE_INTERVAL, DRAW_START_WIDTH } from '@/config/consts';

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
    color: DRAW_START_COLOR,
    lineWidth: DRAW_START_WIDTH,
  });
  const { sendMessage, setDrawHandler } = useWebSocket();
  const currentStroke = useRef<Point[]>([]);
  const lastSendTime = useRef<number>(0);


  useEffect(() => {
    const handleDrawData = (data: DrawPayload) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.strokeStyle = data.color;
      ctx.lineWidth = data.width;

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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = drawState.color;
    ctx.lineWidth = drawState.lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [drawState.color, drawState.lineWidth]);


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

    const lastPoint = currentStroke.current[currentStroke.current.length - 1];
    currentStroke.current = [lastPoint];
    lastSendTime.current = Date.now();
  };

  const startDrawing = (x: number, y: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(x, y);

    currentStroke.current = [{ x, y }];
    lastSendTime.current = Date.now();
  };

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