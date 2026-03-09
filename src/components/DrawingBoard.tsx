'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';

interface DrawingBoardProps {
  color?: string;
  brushSize?: number;
  isDrawingMode?: boolean;
  roomId?: string;
  socket?: Socket;
  tool?: 'brush' | 'eraser' | 'fill';
  history?: any[];
}

const generateStrokeId = () => `stroke_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export default function DrawingBoard({ 
  color = '#000000', 
  brushSize = 5, 
  isDrawingMode = true,
  roomId,
  socket,
  tool = 'brush',
  history = []
}: DrawingBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const currentStrokeId = useRef<string | null>(null);

  const drawFromData = (data: any, ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    const w = canvas.width;
    const h = canvas.height;

    if (data.tool === 'fill') {
      // This is a placeholder for a proper flood fill implementation.
      // For now, we will draw a small circle to indicate where the fill was attempted.
      ctx.beginPath();
      ctx.arc(data.x * w, data.y * h, 10, 0, 2 * Math.PI, false);
      ctx.fillStyle = data.color;
      ctx.fill();
    } else {
      ctx.lineWidth = data.size;
      ctx.lineCap = 'round';
      ctx.strokeStyle = data.tool === 'eraser' ? '#ffffff' : data.color;
      ctx.beginPath();
      ctx.moveTo(data.prevX * w, data.prevY * h);
      ctx.lineTo(data.x * w, data.y * h);
      ctx.stroke();
    }
  };

  // Effect for resizing and redrawing history
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const redrawHistory = () => {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      history.forEach(item => drawFromData(item, ctx, canvas));
    };

    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        redrawHistory();
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [history]);

  const getCoords = (e: React.MouseEvent | React.TouchEvent): {x: number, y: number} | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawingMode) return;
    
    const canvas = canvasRef.current;
    const coords = getCoords(e);
    if (!canvas || !coords) return;

    const data = {
      x: coords.x / canvas.width,
      y: coords.y / canvas.height,
      color,
      tool,
      strokeId: generateStrokeId()
    };

    if (tool === 'fill') {
      if (socket && roomId) {
        socket.emit('draw', { roomId, data });
      }
      return;
    }

    setIsDrawing(true);
    currentStrokeId.current = data.strokeId;
    lastPos.current = { x: data.x, y: data.y };
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    currentStrokeId.current = null;
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing || !isDrawingMode) return;

    const canvas = canvasRef.current;
    const coords = getCoords(e);
    if (!canvas || !coords) return;

    const data = {
      x: coords.x / canvas.width,
      y: coords.y / canvas.height,
      prevX: lastPos.current.x,
      prevY: lastPos.current.y,
      color,
      size: brushSize,
      tool,
      strokeId: currentStrokeId.current
    };

    // Draw locally immediately
    const ctx = canvas.getContext('2d');
    if (ctx) {
      drawFromData(data, ctx, canvas);
    }

    // Send to server
    if (socket && roomId && currentStrokeId.current) {
      socket.emit('draw', { roomId, data });
    }

    lastPos.current = { x: data.x, y: data.y };
  };

  const clearCanvas = () => {
    if (socket && roomId) {
      socket.emit('clear_canvas', roomId);
    }
  };

  return (
    <div className="relative w-full h-full bg-white rounded-lg overflow-hidden touch-none border-2 border-gray-200">
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        className="block cursor-crosshair"
      />
      {isDrawingMode && (
        <button 
          onClick={clearCanvas}
          className="absolute bottom-2 right-2 bg-red-500 text-white px-3 py-1 rounded-md text-sm font-bold shadow-md hover:bg-red-600 transition-colors"
        >
          Clear
        </button>
      )}
    </div>
  );
}
