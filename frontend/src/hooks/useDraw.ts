'use client';

import { useRef, useEffect, useState } from 'react';
import { useWebSocket } from './webSocket';
import type { DrawPayload } from '@/types/wsTypes';
import { GameState } from '@/types/wsTypes';

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
    color: '#000000',
    lineWidth: 2
  });
  const { sendMessage, setDrawHandler } = useWebSocket();
  
  // Store points for current stroke
  const currentStroke = useRef<Point[]>([]);

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
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(x, y);
    
    // Start new stroke
    currentStroke.current = [{ x, y }];
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.lineTo(x, y);
    ctx.stroke();
    
    // Add point to current stroke
    currentStroke.current.push({ x, y });
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    // Send complete stroke through WebSocket
    if (currentStroke.current.length > 0) {
      const drawData: DrawPayload = {
        type: 'draw',
        points: currentStroke.current,
        color: drawState.color,
        width: drawState.lineWidth
      };
      
      sendMessage({
        type: GameState,
        sender: 'drawer', // Set a meaningful sender ID
        payload: drawData
      });
      
      // Clear current stroke
      currentStroke.current = [];
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
      setDrawHandler(() => {});
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
    clearCanvas
  };
} 