import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';

interface DrawingCanvasProps {
  width: number;
  height: number;
  isActive: boolean;
  color?: string;
  penSize?: number;
  eraserSize?: number;
  tool?: 'pen' | 'eraser';
  className?: string;
}

export type DrawingCanvasHandle = {
  clearCanvas: () => void;
  getDataUrl: () => string | null;
  isEmpty: () => boolean;
};

export const DrawingCanvas = forwardRef<DrawingCanvasHandle, DrawingCanvasProps>(({ 
  width, 
  height, 
  isActive, 
  color = '#ef4444', // Red default
  penSize = 3,
  eraserSize = 12,
  tool = 'pen',
  className 
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = width;
    canvas.height = height;

    // Reset context on resize to ensure scale is correct (simple implementation)
    const context = canvas.getContext('2d');
    if (context) {
      context.lineCap = 'round';
      context.strokeStyle = color;
      context.lineWidth = penSize;
      contextRef.current = context;
    }
  }, [width, height, penSize, color]);

  useEffect(() => {
    if (contextRef.current) {
        contextRef.current.strokeStyle = color;
    }
  }, [color]);

  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.lineWidth = tool === 'eraser' ? eraserSize : penSize;
      contextRef.current.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
    }
  }, [tool, penSize, eraserSize]);

  const isCanvasEmpty = () => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (!canvas || !ctx || canvas.width === 0 || canvas.height === 0) return true;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return !imageData.data.some((channel, index) => index % 4 === 3 && channel !== 0);
  };

  useImperativeHandle(ref, () => ({
    clearCanvas: () => {
      const canvas = canvasRef.current;
      const ctx = contextRef.current;
      if (!canvas || !ctx) return;
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    },
    getDataUrl: () => {
      const canvas = canvasRef.current;
      if (!canvas || isCanvasEmpty()) return null;
      return canvas.toDataURL('image/png');
    },
    isEmpty: isCanvasEmpty,
  }));

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isActive) return;
    
    // Prevent scrolling when drawing
    // e.preventDefault(); // Note: might block scroll if not handled carefully, but we want to block scroll when drawing

    const { offsetX, offsetY } = getCoordinates(e);
    if (contextRef.current) {
      contextRef.current.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
      contextRef.current.lineWidth = tool === 'eraser' ? eraserSize : penSize;
      contextRef.current.strokeStyle = color;
    }
    contextRef.current?.beginPath();
    contextRef.current?.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !isActive) return;
    
    const { offsetX, offsetY } = getCoordinates(e);
    contextRef.current?.lineTo(offsetX, offsetY);
    contextRef.current?.stroke();
  };

  const stopDrawing = () => {
    contextRef.current?.closePath();
    setIsDrawing(false);
  };

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { offsetX: 0, offsetY: 0 };

    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const rect = canvas.getBoundingClientRect();
    return {
      offsetX: clientX - rect.left,
      offsetY: clientY - rect.top
    };
  };

  return (
    <canvas
      ref={canvasRef}
      className={`${className} ${isActive ? 'cursor-crosshair pointer-events-auto' : 'pointer-events-none'}`}
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={stopDrawing}
      onMouseLeave={stopDrawing}
      onTouchStart={startDrawing}
      onTouchMove={draw}
      onTouchEnd={stopDrawing}
      style={{ touchAction: isActive ? 'none' : 'auto' }}
    />
  );
});









