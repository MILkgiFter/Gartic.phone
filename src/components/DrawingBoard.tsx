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
  const currentPathRef = useRef<Array<{x: number, y: number}>>([]);

  // Redraw canvas whenever history prop changes from the server
  useEffect(() => {
    redrawCanvas();
  }, [history]);

  // Update cursor style to be dynamic based on brush size and color
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (!isDrawingMode || (tool !== 'brush' && tool !== 'eraser')) {
      if (tool === 'fill') {
        canvas.style.cursor = 'crosshair'; // Or a specific fill cursor
      } else {
        canvas.style.cursor = 'default';
      }
      return;
    }
    
    const size = Math.max(4, brushSize);
    // A circle with a border, semi-transparent fill for visibility on all backgrounds
    const cursorSvg = `<svg height="${size}" width="${size}" xmlns="http://www.w3.org/2000/svg"><circle cx="${size/2}" cy="${size/2}" r="${size/2 - 1}" stroke="black" stroke-width="1" fill="${tool === 'eraser' ? 'white' : 'rgba(0,0,0,0.2)'}" /></svg>`;
    
    canvas.style.cursor = `url('data:image/svg+xml;utf8,${encodeURIComponent(cursorSvg)}') ${size / 2} ${size / 2}, auto`;

  }, [brushSize, tool, isDrawingMode]);

  const drawShape = (shape: any, ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    if (shape.type === 'path') {
      ctx.strokeStyle = shape.tool === 'eraser' ? '#ffffff' : shape.color;
      ctx.lineWidth = shape.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      if (shape.points.length > 0) {
        ctx.moveTo(shape.points[0].x * canvas.width, shape.points[0].y * canvas.height);
        for (let i = 1; i < shape.points.length; i++) {
          ctx.lineTo(shape.points[i].x * canvas.width, shape.points[i].y * canvas.height);
        }
      }
      ctx.stroke();
    } else if (shape.type === 'fill') {
      // Re-running flood fill from history can be imperfect, but it's the best we can do without storing full canvas states.
      floodFill(ctx, Math.floor(shape.x * canvas.width), Math.floor(shape.y * canvas.height), shape.color);
    }
  };

  const redrawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    history.forEach(shape => drawShape(shape, ctx, canvas));

    // Draw the current path being drawn locally, so it doesn't flicker
    if (currentPathRef.current.length > 1) {
      const currentShape = {
        type: 'path',
        points: currentPathRef.current,
        color: tool === 'eraser' ? '#ffffff' : color,
        size: brushSize,
        tool: tool,
      };
      drawShape(currentShape, ctx, canvas);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resizeCanvas = () => {
      const parent = canvas.parentElement;
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        redrawCanvas();
      }
    };
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);




  const getCoords = (e: React.MouseEvent | React.TouchEvent): {x: number, y: number} | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    return {
      x: (clientX - rect.left) / canvas.width,
      y: (clientY - rect.top) / canvas.height
    };
  }

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawingMode) return;
    const coords = getCoords(e);
    const canvas = canvasRef.current;
    if (!coords || !canvas) return;

    if (tool === 'fill') {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      floodFill(ctx, Math.floor(coords.x * canvas.width), Math.floor(coords.y * canvas.height), color);
      if (socket && roomId) {
        const shape = {
          type: 'fill',
          x: coords.x,
          y: coords.y,
          color,
        };
        socket.emit('draw', { roomId, shape });
      }
      return;
    }

    setIsDrawing(true);
    currentPathRef.current = [coords];
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !isDrawingMode) return;
    const coords = getCoords(e);
    if (!coords) return;

    currentPathRef.current.push(coords);

    // Draw locally for immediate feedback
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    const path = currentPathRef.current;
    if (path.length < 2) return;

    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(path[path.length - 2].x * canvas.width, path[path.length - 2].y * canvas.height);
    ctx.lineTo(path[path.length - 1].x * canvas.width, path[path.length - 1].y * canvas.height);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (currentPathRef.current.length > 1 && socket && roomId) {
      const shape = {
        type: 'path',
        points: currentPathRef.current,
        color,
        size: brushSize,
        tool,
      };
      socket.emit('draw', { roomId, shape });
    }
    currentPathRef.current = [];
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
        className={`block ${isDrawingMode ? 'dot-cursor' : 'cursor-default'}`}
      />
    </div>
  );
}

// --- Flood Fill Algorithm ---

const floodFill = (ctx: CanvasRenderingContext2D, startX: number, startY: number, fillColor: string) => {
  const canvas = ctx.canvas;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const fillRgb = hexToRgb(fillColor);
  if (!fillRgb) return;

  const getPixel = (x: number, y: number): [number, number, number, number] => {
    if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) {
      return [-1, -1, -1, -1]; // Out of bounds
    }
    const offset = (y * canvas.width + x) * 4;
    return [data[offset], data[offset + 1], data[offset + 2], data[offset + 3]];
  };

  const targetColor = getPixel(startX, startY);

  if (targetColor.every((val, i) => val === [fillRgb.r, fillRgb.g, fillRgb.b, 255][i])) {
    return; // Already filled
  }

  const stack: [number, number][] = [[startX, startY]];
  
  while (stack.length > 0) {
    const [x, y] = stack.pop()!;
    const currentColor = getPixel(x, y);

    if (matchColor(currentColor, targetColor)) {
      setPixel(x, y, fillRgb, data, canvas.width);
      if (x + 1 < canvas.width) stack.push([x + 1, y]);
      if (x - 1 >= 0) stack.push([x - 1, y]);
      if (y + 1 < canvas.height) stack.push([x, y + 1]);
      if (y - 1 >= 0) stack.push([x, y - 1]);
    }
  }

  ctx.putImageData(imageData, 0, 0);
};

const matchColor = (c1: number[], c2: number[]) => {
  return c1[0] === c2[0] && c1[1] === c2[1] && c1[2] === c2[2] && c1[3] === c2[3];
};

const setPixel = (x: number, y: number, color: {r: number, g: number, b: number}, data: Uint8ClampedArray, width: number) => {
  const offset = (y * width + x) * 4;
  data[offset] = color.r;
  data[offset + 1] = color.g;
  data[offset + 2] = color.b;
  data[offset + 3] = 255;
};

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};
