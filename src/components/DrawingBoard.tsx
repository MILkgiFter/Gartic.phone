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

// Utility to generate a simple unique ID
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
      // Re-applying flood fill from history is complex and can be inaccurate
      // A better system would involve snapshotting canvas state, which is too heavy for this app
      // For now, we'll just ignore fill events in history redrawing to prevent errors
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

  // Effect for resizing and redrawing
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

    if (tool === 'fill') {
      if (socket && roomId) {
        socket.emit('draw', {
          roomId,
          data: { 
            x: coords.x / canvas.width,
            y: coords.y / canvas.height,
            color,
            tool: 'fill'
          }
        });
      }
      return;
    }

    setIsDrawing(true);
    currentStrokeId.current = generateStrokeId(); // Generate a new ID for this stroke
    lastPos.current = { x: coords.x / canvas.width, y: coords.y / canvas.height };
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    currentStrokeId.current = null; // End of stroke
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!isDrawing || !isDrawingMode) return;

    const canvas = canvasRef.current;
    const coords = getCoords(e);
    if (!canvas || !coords) return;

    const x_rel = coords.x / canvas.width;
    const y_rel = coords.y / canvas.height;

    if (socket && roomId && currentStrokeId.current) {
      socket.emit('draw', {
        roomId,
        data: { 
          x: x_rel, 
          y: y_rel, 
          prevX: lastPos.current.x, 
          prevY: lastPos.current.y, 
          color, 
          size: brushSize, 
          tool,
          strokeId: currentStrokeId.current // Include the stroke ID
        }
      });
    }

    lastPos.current = { x: x_rel, y: y_rel };
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
