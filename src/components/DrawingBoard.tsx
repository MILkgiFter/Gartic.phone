'use client';

import React, { useRef, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = 1200; // A larger canvas to allow for scrolling
      canvas.height = 800;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, []);

  // Redraw canvas whenever history changes
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    // Clear canvas before redrawing
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const redraw = (data: any) => {
      if (data.tool === 'fill') {
        // Flood fill can be complex to re-apply from history, for now we will skip re-filling
        // A better approach would be to save the canvas state (imageData) after fill
      } else {
        ctx.lineWidth = data.size;
        ctx.lineCap = 'round';
        ctx.strokeStyle = data.tool === 'eraser' ? '#ffffff' : data.color;
        ctx.beginPath();
        ctx.moveTo(data.prevX, data.prevY);
        ctx.lineTo(data.x, data.y);
        ctx.stroke();
      }
    }

    history.forEach(item => redraw(item));

  }, [history]);

  const lastPos = useRef({ x: 0, y: 0 });

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawingMode) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = (e as React.MouseEvent).clientX - rect.left;
      y = (e as React.MouseEvent).clientY - rect.top;
    }

    if (tool === 'fill') {
      floodFill(ctx, Math.floor(x), Math.floor(y), color);
      if (socket && roomId) {
        socket.emit('draw', {
          roomId,
          data: { x, y, color, tool: 'fill' }
        });
      }
      return;
    }

    setIsDrawing(true);
    lastPos.current = { x, y };
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !isDrawingMode) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = (e as React.MouseEvent).clientX - rect.left;
      y = (e as React.MouseEvent).clientY - rect.top;
    }

    const prevX = lastPos.current.x;
    const prevY = lastPos.current.y;

    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;

    ctx.beginPath();
    ctx.moveTo(prevX, prevY);
    ctx.lineTo(x, y);
    ctx.stroke();

    // Emit drawing event
    if (socket && roomId) {
      socket.emit('draw', {
        roomId,
        data: { x, y, prevX, prevY, color, size: brushSize, tool }
      });
    }

    lastPos.current = { x, y }
  };

  const floodFill = (ctx: CanvasRenderingContext2D, startX: number, startY: number, fillColor: string) => {
    const canvas = ctx.canvas;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    const getPixel = (x: number, y: number) => {
      if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) return [-1, -1, -1, -1];
      const offset = (y * canvas.width + x) * 4;
      return [data[offset], data[offset + 1], data[offset + 2], data[offset + 3]];
    };

    const targetColor = getPixel(startX, startY);
    const fillRgb = hexToRgb(fillColor);

    if (!fillRgb || (targetColor[0] === fillRgb.r && targetColor[1] === fillRgb.g && targetColor[2] === fillRgb.b)) {
      return;
    }

    const stack: [number, number][] = [[startX, startY]];
    
    while (stack.length > 0) {
      const [x, y] = stack.pop()!;
      let currentY = y;

      while (currentY >= 0 && matchColor(getPixel(x, currentY), targetColor)) {
        currentY--;
      }
      currentY++;

      let reachLeft = false;
      let reachRight = false;

      while (currentY < canvas.height && matchColor(getPixel(x, currentY), targetColor)) {
        setPixel(x, currentY, fillRgb, data, canvas.width);

        if (x > 0) {
          if (matchColor(getPixel(x - 1, currentY), targetColor)) {
            if (!reachLeft) {
              stack.push([x - 1, currentY]);
              reachLeft = true;
            }
          } else if (reachLeft) {
            reachLeft = false;
          }
        }

        if (x < canvas.width - 1) {
          if (matchColor(getPixel(x + 1, currentY), targetColor)) {
            if (!reachRight) {
              stack.push([x + 1, currentY]);
              reachRight = true;
            }
          } else if (reachRight) {
            reachRight = false;
          }
        }

        currentY++;
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

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (socket && roomId) {
        socket.emit('clear_canvas', roomId);
      }
    }
  };

  return (
    <div className="relative w-full h-full bg-white rounded-lg overflow-auto border-4 border-black/5 shadow-inner">
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        className="block cursor-crosshair touch-none"
      />
      {isDrawingMode && (
        <button 
          onClick={clearCanvas}
          className="absolute bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg font-bold shadow-lg hover:bg-red-600 transition-colors"
        >
          Clear
        </button>
      )}
    </div>
  );
}