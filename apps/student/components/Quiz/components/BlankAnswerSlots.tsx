import React, { useEffect, useRef, useState } from 'react';
import { PenTool } from 'lucide-react';
import { DrawingCanvas, DrawingCanvasHandle } from '../DrawingCanvas';

export type AnswerInputMode = 'keyboard' | 'handwrite';

interface BlankAnswerSlotsProps {
  gapCount: number;
  values: string[];
  activeIndex: number | null;
  inputMode: AnswerInputMode;
  disabled?: boolean;
  penColor: string;
  penSize: number;
  eraserSize?: number;
  draftTool: 'pen' | 'eraser';
  feedback?: Array<'default' | 'correct' | 'wrong'>;
  onSelectGap: (index: number) => void;
  onChangeGap: (index: number, value: string) => void;
}

const SLOT_H = 64;

/** 单空手写槽：抬笔后短延迟做原型级「识别」回填文本 */
const HandwriteSlot: React.FC<{
  index: number;
  value: string;
  isActive: boolean;
  disabled?: boolean;
  penColor: string;
  penSize: number;
  eraserSize: number;
  tool: 'pen' | 'eraser';
  state: 'default' | 'correct' | 'wrong';
  onSelect: () => void;
  onRecognized: (text: string) => void;
}> = ({
  index,
  value,
  isActive,
  disabled,
  penColor,
  penSize,
  eraserSize,
  tool,
  state,
  onSelect,
  onRecognized,
}) => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<DrawingCanvasHandle | null>(null);
  const [size, setSize] = useState({ width: 280, height: SLOT_H });
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasInk = useRef(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => {
      const { width, height } = el.getBoundingClientRect();
      if (width > 0 && height > 0) setSize({ width: Math.floor(width), height: Math.floor(height) });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!value) {
      canvasRef.current?.clearCanvas();
      hasInk.current = false;
    }
  }, [value]);

  const scheduleRecognize = () => {
    if (disabled) return;
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      if (!canvasRef.current || canvasRef.current.isEmpty()) return;
      hasInk.current = true;
      // 原型：抬笔后回填占位文本证明左右联动；真实 OCR 后续接入，用户可切键盘改写
      if (!value.trim()) onRecognized(`空${index + 1}`);
    }, 700);
  };

  const border =
    state === 'correct'
      ? 'border-emerald-400 bg-emerald-50/40'
      : state === 'wrong'
        ? 'border-rose-400 bg-rose-50/40'
        : isActive
          ? 'border-violet-400 bg-violet-50/30 ring-2 ring-violet-200/80'
          : 'border-violet-100 bg-white';

  return (
    <div className="flex items-stretch gap-2.5">
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center self-center rounded-lg text-[12px] font-black ${
          isActive ? 'bg-violet-500 text-white' : 'bg-violet-50 text-violet-500'
        }`}
      >
        {index + 1}
      </div>
      <div
        ref={wrapRef}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={onSelect}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') onSelect();
        }}
        onPointerUp={scheduleRecognize}
        onTouchEnd={scheduleRecognize}
        className={`relative h-[64px] min-w-0 flex-1 overflow-hidden rounded-xl border-2 text-left transition ${border} ${
          disabled ? 'opacity-60' : 'cursor-pointer'
        }`}
      >
        {!value && (
          <span className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center text-violet-200">
            <PenTool size={20} strokeWidth={1.5} />
          </span>
        )}
        {value && (
          <span className="pointer-events-none absolute inset-x-3 top-2 z-20 truncate text-[13px] font-bold text-violet-600">
            {value}
          </span>
        )}
        <DrawingCanvas
          ref={canvasRef}
          isActive={!disabled && isActive}
          width={size.width}
          height={size.height}
          color={penColor}
          penSize={penSize}
          eraserSize={eraserSize}
          tool={tool}
          className="absolute inset-0 z-10 h-full w-full touch-none"
        />
      </div>
    </div>
  );
};

export const BlankAnswerSlots: React.FC<BlankAnswerSlotsProps> = ({
  gapCount,
  values,
  activeIndex,
  inputMode,
  disabled,
  penColor,
  penSize,
  eraserSize = 12,
  draftTool,
  feedback,
  onSelectGap,
  onChangeGap,
}) => {
  if (gapCount <= 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: gapCount }).map((_, idx) => {
        const value = values[idx] || '';
        const isActive = activeIndex === idx;
        const state = feedback?.[idx] ?? 'default';

        if (inputMode === 'handwrite') {
          return (
            <HandwriteSlot
              key={idx}
              index={idx}
              value={value}
              isActive={isActive}
              disabled={disabled}
              penColor={penColor}
              penSize={penSize}
              eraserSize={eraserSize}
              tool={draftTool}
              state={state}
              onSelect={() => onSelectGap(idx)}
              onRecognized={(text) => onChangeGap(idx, text)}
            />
          );
        }

        const border =
          state === 'correct'
            ? 'border-emerald-400 bg-emerald-50'
            : state === 'wrong'
              ? 'border-rose-400 bg-rose-50'
              : isActive
                ? 'border-violet-400 bg-violet-50/40 ring-2 ring-violet-200/80'
                : 'border-violet-100 bg-white';

        return (
          <div key={idx} className="flex items-stretch gap-2.5">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center self-center rounded-lg text-[12px] font-black ${
                isActive ? 'bg-violet-500 text-white' : 'bg-violet-50 text-violet-500'
              }`}
            >
              {idx + 1}
            </div>
            <button
              type="button"
              onClick={() => onSelectGap(idx)}
              disabled={disabled}
              className={`flex h-[64px] min-w-0 flex-1 items-center rounded-xl border-2 px-3 text-left transition ${border}`}
            >
              <span className={`text-sm font-semibold tracking-wide ${value ? 'text-slate-800' : 'text-violet-200'}`}>
                {value || '点击输入…'}
              </span>
            </button>
          </div>
        );
      })}
    </div>
  );
};
