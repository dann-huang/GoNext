'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { useWebSocket } from './webSocket';
import type { DrawPayload } from '@/types/wsTypes';
import { RawSignal } from '@/types/wsTypes';


const MIN_ZOOM = 0.5;
const MAX_ZOOM = 4;
const PAN_BOUNDARY = 0.5;
const DRAW_STROKE_INTERVAL = 50;

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
  color: string;
  width: number;
}

interface DrawData extends Omit<Stroke, 'points'> {
  type: 'draw';
  points: Point[];
}

export interface DrawState {
  color: string;
  lineWidth: number;
  zoom: number;
  offset: {
    x: number;
    y: number;
  };
}

// Helper function to calculate bounded offset
const calculateBoundedOffset = (
  offsetX: number,
  offsetY: number,
  zoom: number,
  canvasWidth: number,
  canvasHeight: number,
  viewportWidth: number,
  viewportHeight: number
) => {
  const maxOffsetX = Math.max(0, (canvasWidth * zoom - viewportWidth) / 2) + viewportWidth * PAN_BOUNDARY;
  const maxOffsetY = Math.max(0, (canvasHeight * zoom - viewportHeight) / 2) + viewportHeight * PAN_BOUNDARY;

  return {
    x: Math.max(-maxOffsetX, Math.min(offsetX, maxOffsetX)),
    y: Math.max(-maxOffsetY, Math.min(offsetY, maxOffsetY))
  };
};

export function useDraw() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawState, setDrawState] = useState<DrawState>({
    color: '#777777',
    lineWidth: 2,
    zoom: 1,
    offset: { x: 0, y: 0 }
  });
  const { sendMessage, setDrawHandler } = useWebSocket();
  const isPanning = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  const currentStroke = useRef<Point[]>([]);
  const lastSendTime = useRef<number>(0);
  const [drawingHistory, setDrawingHistory] = useState<DrawData[]>([]);

  // Use the imported calculateBoundedOffset function

  // Handle wheel event for zooming
  const handleWheel = useCallback((e: WheelEvent) => {
    if (!e.ctrlKey) return;

    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Calculate zoom factor based on wheel direction
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;

    setDrawState(prev => {
      // Calculate new zoom level with bounds
      const newZoom = Math.min(Math.max(prev.zoom * zoomFactor, MIN_ZOOM), MAX_ZOOM);

      // Calculate the mouse position in canvas coordinates
      const canvasX = (mouseX - prev.offset.x) / prev.zoom;
      const canvasY = (mouseY - prev.offset.y) / prev.zoom;

      // Calculate new offset to zoom toward mouse position
      const newOffsetX = mouseX - canvasX * newZoom;
      const newOffsetY = mouseY - canvasY * newZoom;

      // Calculate bounded offset
      const boundedOffset = calculateBoundedOffset(
        newOffsetX,
        newOffsetY,
        newZoom,
        canvas.width,
        canvas.height,
        rect.width,
        rect.height
      );

      return {
        ...prev,
        zoom: newZoom,
        offset: boundedOffset
      };
    });
  }, []);

  // Set up wheel listener for zooming
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const wheelHandler = (e: WheelEvent) => {
      if (e.ctrlKey) {
        handleWheel(e);
      }
    };

    canvas.addEventListener('wheel', wheelHandler, { passive: false });

    return () => {
      canvas.removeEventListener('wheel', wheelHandler);
    };
  }, [handleWheel]);

  // Panning state and handlers
  const stopPan = useCallback(() => {
    isPanning.current = false;
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.cursor = 'crosshair';
    }
  }, []);

  // Set up event listeners for panning and drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseDown = (e: MouseEvent) => {
      // Only handle middle mouse button or ctrl+left click
      if (e.button === 1 || (e.button === 0 && (e.ctrlKey || e.metaKey))) {
        isPanning.current = true;
        lastMousePos.current = { x: e.clientX, y: e.clientY };
        canvas.style.cursor = 'grabbing';

        // Handle mouse move for panning
        const handleMouseMove = (moveEvent: MouseEvent) => {
          if (!isPanning.current) return;

          const dx = moveEvent.clientX - lastMousePos.current.x;
          const dy = moveEvent.clientY - lastMousePos.current.y;

          setDrawState(prev => {
            const canvas = canvasRef.current;
            if (!canvas) return prev;

            const newOffsetX = prev.offset.x + dx;
            const newOffsetY = prev.offset.y + dy;

            // Get canvas and viewport dimensions
            const rect = canvas.getBoundingClientRect();

            // Calculate bounded offset
            const boundedOffset = calculateBoundedOffset(
              newOffsetX,
              newOffsetY,
              prev.zoom,
              canvas.width,
              canvas.height,
              rect.width,
              rect.height
            );

            return {
              ...prev,
              offset: boundedOffset
            };
          });

          lastMousePos.current = {
            x: moveEvent.clientX,
            y: moveEvent.clientY
          };

          moveEvent.preventDefault();
        };

        // Clean up panning on mouse up
        const handleMouseUp = () => {
          isPanning.current = false;
          canvas.style.cursor = 'crosshair';
          document.removeEventListener('mousemove', handleMouseMove);
        };

        // Add event listeners for panning
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp, { once: true });
        document.addEventListener('mouseleave', handleMouseUp, { once: true });

        e.preventDefault();
      }
    };

    // Add mousedown listener for starting pan
    canvas.addEventListener('mousedown', handleMouseDown);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
    };
  }, [stopPan]);

  // Redraw canvas when draw state changes
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply zoom and pan transforms
    ctx.save();
    ctx.translate(drawState.offset.x, drawState.offset.y);
    ctx.scale(drawState.zoom, drawState.zoom);

    // Draw all strokes from history
    drawingHistory.forEach(stroke => {
      if (stroke.points.length < 2) return;

      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const [firstPoint, ...restPoints] = stroke.points;
      ctx.moveTo(firstPoint.x, firstPoint.y);
      restPoints.forEach((point: Point) => {
        ctx.lineTo(point.x, point.y);
      });

      ctx.stroke();
    });

    // Draw current stroke if drawing
    if (isDrawing && currentStroke.current.length > 1) {
      const stroke = currentStroke.current;

      ctx.beginPath();
      ctx.strokeStyle = drawState.color;
      ctx.lineWidth = drawState.lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const [firstPoint, ...restPoints] = stroke;
      ctx.moveTo(firstPoint.x, firstPoint.y);
      restPoints.forEach((point: Point) => {
        ctx.lineTo(point.x, point.y);
      });

      ctx.stroke();
    }

    ctx.restore();
  }, [drawState, isDrawing, drawingHistory]);

  // Redraw when dependencies change
  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  // Handle drawing events
  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    // Don't start drawing if panning
    if (e.button === 1 || (e.button === 0 && (e.ctrlKey || e.metaKey))) {
      return;
    }

    setIsDrawing(true);

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - drawState.offset.x) / drawState.zoom;
    const y = (e.clientY - rect.top - drawState.offset.y) / drawState.zoom;

    currentStroke.current = [];
    currentStroke.current.push({ x, y });

    // Prevent text selection while drawing
    e.preventDefault();
  }, [drawState]);

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - drawState.offset.x) / drawState.zoom;
    const y = (e.clientY - rect.top - drawState.offset.y) / drawState.zoom;

    // Add point to current stroke
    currentStroke.current.push({ x, y });

    // Throttle sending updates
    const now = Date.now();
    if (now - lastSendTime.current > 16) { // ~60fps
      sendStroke();
      lastSendTime.current = now;
    }

    // Redraw to show the current stroke
    redrawCanvas();
  }, [isDrawing, drawState, redrawCanvas]);

  const stopDrawing = useCallback(() => {
    if (!isDrawing) return;

    // Send final stroke if it has enough points
    if (currentStroke.current.length > 1) {
      sendStroke();
    }

    setIsDrawing(false);
  }, [isDrawing]);

  const sendStroke = useCallback(() => {
    if (!currentStroke.current.length) return;

    // Create a new stroke object
    const newStroke: DrawData = {
      type: 'draw',
      points: [...currentStroke.current],
      color: drawState.color,
      width: drawState.lineWidth
    };

    // Add to local history
    setDrawingHistory(prev => [...prev, newStroke]);

    // Send to server
    if (sendMessage) {
      sendMessage({
        type: RawSignal,
        sender: 'draw',
        payload: newStroke
      });
    }

    // Keep the last point for smooth drawing
    if (currentStroke.current.length > 0) {
      const lastPoint = currentStroke.current[currentStroke.current.length - 1];
      currentStroke.current = [lastPoint];
    }
  }, [sendMessage, drawState]);

  // Handle incoming draw data
  const handleDrawData = useCallback((data: DrawPayload) => {
    if (data.type === 'draw') {
      setDrawingHistory(prev => [...prev, data]);
    } else if (data.type === 'clear') {
      setDrawingHistory([]);
    }
  }, []);

  // Handle clear canvas
  const clearCanvas = useCallback(() => {
    setDrawingHistory([]);

    if (sendMessage) {
      sendMessage({
        type: RawSignal,
        sender: 'clear',
        payload: { type: 'clear' }
      });
    }
  }, [sendMessage]);

  // Set up draw handler for incoming messages
  useEffect(() => {
    if (setDrawHandler) {
      setDrawHandler(handleDrawData);
    }

    return () => {
      if (setDrawHandler) {
        setDrawHandler(() => { });
      }
    };
  }, [handleDrawData, setDrawHandler]);

  // Set up initial canvas size and clear
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas size to match container
    const updateCanvasSize = () => {
      const container = canvas.parentElement;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;

      // Center the view
      setDrawState(prev => ({
        ...prev,
        offset: {
          x: (rect.width - canvas.width) / 2,
          y: (rect.height - canvas.height) / 2
        }
      }));
    };

    updateCanvasSize();

    // Handle window resize
    const handleResize = () => {
      updateCanvasSize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Set up keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Zoom in/out with +/-
      if (e.key === '+' || e.key === '=') {
        setDrawState(prev => ({
          ...prev,
          zoom: Math.min(prev.zoom * 1.1, MAX_ZOOM)
        }));
      } else if (e.key === '-' || e.key === '_') {
        setDrawState(prev => ({
          ...prev,
          zoom: Math.max(prev.zoom * 0.9, MIN_ZOOM)
        }));
      }
      // Reset zoom and pan with 0
      else if (e.key === '0') {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        setDrawState(prev => ({
          ...prev,
          zoom: 1,
          offset: {
            x: (rect.width - canvas.width) / 2,
            y: (rect.height - canvas.height) / 2
          }
        }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Zoom controls
  const zoomIn = useCallback(() => {
    setDrawState(prev => ({
      ...prev,
      zoom: Math.min(prev.zoom * 1.2, MAX_ZOOM)
    }));
  }, []);

  const zoomOut = useCallback(() => {
    setDrawState(prev => ({
      ...prev,
      zoom: Math.max(prev.zoom / 1.2, MIN_ZOOM)
    }));
  }, []);

  const resetView = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    setDrawState(prev => ({
      ...prev,
      zoom: 1,
      offset: {
        x: (rect.width - canvas.width) / 2,
        y: (rect.height - canvas.height) / 2
      }
    }));
  }, []);

  // Touch event handlers
  const touchHandlers = {
    onTouchStart: (e: React.TouchEvent<HTMLCanvasElement>) => {
      if (!canvasRef.current) return;

      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY,
        button: 0
      });
      canvasRef.current.dispatchEvent(mouseEvent);
      e.preventDefault();
    },
    onTouchMove: (e: React.TouchEvent<HTMLCanvasElement>) => {
      if (!canvasRef.current) return;

      const touch = e.touches[0];
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      canvasRef.current.dispatchEvent(mouseEvent);
      e.preventDefault();
    },
    onTouchEnd: () => {
      if (!canvasRef.current) return;

      const mouseEvent = new MouseEvent('mouseup');
      canvasRef.current.dispatchEvent(mouseEvent);
    },
    onTouchCancel: () => {
      if (!canvasRef.current) return;

      const mouseEvent = new MouseEvent('mouseup');
      canvasRef.current.dispatchEvent(mouseEvent);
    }
  };

  return {
    canvasRef,
    drawState,
    setDrawState,
    startDrawing,
    draw,
    stopDrawing,
    clearCanvas,
    touchHandlers,
    zoomIn,
    zoomOut,
    resetView,
    handleDrawData
  };

}