import React, { useRef, useState } from 'react';
import { Check, ChevronLeft, RotateCw } from 'lucide-react';

interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

type DragMode = 'move' | 'nw' | 'ne' | 'sw' | 'se';

interface ZhiyueCropPageProps {
  imageSrc: string;
  onBack: () => void;
  onConfirm: () => void;
}

const DEFAULT_CROP: CropRect = { x: 16, y: 18, w: 68, h: 52 };
const MIN_SIZE = 18;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const ZhiyueCropPage = ({ imageSrc, onBack, onConfirm }: ZhiyueCropPageProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ mode: DragMode; startX: number; startY: number; start: CropRect } | null>(null);
  const [crop, setCrop] = useState<CropRect>(DEFAULT_CROP);
  const [rotation, setRotation] = useState(0);

  const updateCrop = (next: CropRect) => {
    const w = clamp(next.w, MIN_SIZE, 100);
    const h = clamp(next.h, MIN_SIZE, 100);
    const x = clamp(next.x, 0, 100 - w);
    const y = clamp(next.y, 0, 100 - h);
    setCrop({ x, y, w, h });
  };

  const handlePointerDown = (mode: DragMode) => (event: React.PointerEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = { mode, startX: event.clientX, startY: event.clientY, start: crop };
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const box = containerRef.current;
    if (!drag || !box) return;

    const rect = box.getBoundingClientRect();
    const dx = ((event.clientX - drag.startX) / rect.width) * 100;
    const dy = ((event.clientY - drag.startY) / rect.height) * 100;
    const { start, mode } = drag;

    if (mode === 'move') {
      updateCrop({ ...start, x: start.x + dx, y: start.y + dy });
      return;
    }

    if (mode === 'se') {
      updateCrop({ ...start, w: start.w + dx, h: start.h + dy });
    } else if (mode === 'ne') {
      updateCrop({ x: start.x, y: start.y + dy, w: start.w + dx, h: start.h - dy });
    } else if (mode === 'sw') {
      updateCrop({ x: start.x + dx, y: start.y, w: start.w - dx, h: start.h + dy });
    } else {
      updateCrop({ x: start.x + dx, y: start.y + dy, w: start.w - dx, h: start.h - dy });
    }
  };

  const handlePointerUp = () => {
    dragRef.current = null;
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
    setCrop(DEFAULT_CROP);
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-black text-white">
      <div
        ref={containerRef}
        className="absolute inset-0 touch-none"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <img
          src={imageSrc}
          alt="作业照片"
          draggable={false}
          className="w-full h-full object-cover select-none"
          style={{ transform: `rotate(${rotation}deg)` }}
        />

        <div
          className="absolute rounded-2xl border-[3px] border-[#7b6cff] cursor-move"
          style={{
            left: `${crop.x}%`,
            top: `${crop.y}%`,
            width: `${crop.w}%`,
            height: `${crop.h}%`,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
          }}
          onPointerDown={handlePointerDown('move')}
        >
          <div className="absolute inset-1.5 rounded-xl border border-dashed border-white/90 pointer-events-none" />
          {(['nw', 'ne', 'sw', 'se'] as DragMode[]).map(corner => (
            <span
              key={corner}
              onPointerDown={handlePointerDown(corner)}
              className={`absolute w-4 h-4 rounded-sm bg-white border-2 border-[#7b6cff] ${
                corner === 'nw'
                  ? 'left-[-6px] top-[-6px] cursor-nwse-resize'
                  : corner === 'ne'
                    ? 'right-[-6px] top-[-6px] cursor-nesw-resize'
                    : corner === 'sw'
                      ? 'left-[-6px] bottom-[-6px] cursor-nesw-resize'
                      : 'right-[-6px] bottom-[-6px] cursor-nwse-resize'
              }`}
            />
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={onBack}
        aria-label="返回拍照"
        className="absolute top-5 left-5 z-20 w-11 h-11 rounded-full bg-black/45 border border-white/20 flex items-center justify-center text-white hover:bg-black/60 transition-colors"
      >
        <ChevronLeft size={22} />
      </button>

      <div className="absolute right-6 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-4">
        <button
          type="button"
          onClick={onConfirm}
          aria-label="确认裁剪"
          className="w-[68px] h-[68px] rounded-full bg-[#5b67f5] shadow-[0_8px_24px_rgba(91,103,245,0.45)] flex items-center justify-center hover:bg-[#6b75f7] active:scale-95 transition-transform"
        >
          <Check size={32} strokeWidth={3} className="text-white" />
        </button>
        <button
          type="button"
          onClick={handleRotate}
          aria-label="旋转照片"
          className="w-12 h-12 rounded-full bg-black/45 border border-white/25 flex items-center justify-center text-white hover:bg-black/60 transition-colors"
        >
          <RotateCw size={20} />
        </button>
      </div>

      <p className="absolute bottom-7 left-1/2 -translate-x-1/2 z-20 text-white text-base font-bold drop-shadow-md">
        请裁剪想要截取的内容
      </p>
    </div>
  );
};
