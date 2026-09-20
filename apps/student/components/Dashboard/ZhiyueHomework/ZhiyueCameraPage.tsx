import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronLeft, Clock, Flashlight, X } from 'lucide-react';
import { ZhiyueCapturedPage, ZhiyueMode } from './types';

const MAX_PAGES = 3;
const PART_HINTS = ['拍作业第一部分', '拍作业第二部分', '拍作业第三部分'] as const;

interface ZhiyueCameraPageProps {
  mode: ZhiyueMode;
  flashOn: boolean;
  capturedPages: ZhiyueCapturedPage[];
  onModeChange: (mode: ZhiyueMode) => void;
  onToggleFlash: () => void;
  onShutter: () => void;
  onSubmit: () => void;
  onDeletePage: (id: string) => void;
  onReorderPages: (from: number, to: number) => void;
  onOpenHistory: () => void;
  onBack: () => void;
}

export const ZhiyueCameraPage = ({
  mode,
  flashOn,
  capturedPages,
  onModeChange,
  onToggleFlash,
  onShutter,
  onSubmit,
  onDeletePage,
  onReorderPages,
  onOpenHistory,
  onBack,
}: ZhiyueCameraPageProps) => {
  const [shutterFlash, setShutterFlash] = useState(false);
  const shutterTimerRef = useRef<number | null>(null);
  const dragFromRef = useRef<number | null>(null);
  const count = capturedPages.length;
  const atLimit = count >= MAX_PAGES;
  const isMulti = mode === 'multi';
  const showModeSwitch = !isMulti || count === 0;
  const showHistory = !isMulti || count === 0;
  const hint = isMulti ? (atLimit ? '最多可拍三张，已达上限' : PART_HINTS[count]) : '平行于纸面拍照后批改';

  useEffect(
    () => () => {
      if (shutterTimerRef.current != null) {
        window.clearTimeout(shutterTimerRef.current);
      }
    },
    []
  );

  const handleShutter = () => {
    if (shutterFlash || (isMulti && atLimit)) return;
    setShutterFlash(true);
    shutterTimerRef.current = window.setTimeout(() => {
      setShutterFlash(false);
      onShutter();
    }, 140);
  };

  const iconBtnClass = isMulti
    ? `w-11 h-11 flex items-center justify-center rounded-full bg-black/35 border border-white/20 transition-colors ${
        flashOn ? 'text-amber-100 bg-amber-300/20' : 'text-white/90 hover:bg-white/10'
      }`
    : `w-11 h-11 flex items-center justify-center rounded-lg border border-dashed transition-colors ${
        flashOn ? 'border-amber-200 bg-amber-300/20 text-amber-100' : 'border-white/70 text-white/90 hover:bg-white/10'
      }`;

  return (
    <div className="relative w-full h-full overflow-hidden bg-gradient-to-b from-[#2a2158] via-[#1c1544] to-[#14102e] text-white">
      {(flashOn || shutterFlash) && (
        <div
          className={`absolute inset-0 pointer-events-none z-10 ${
            shutterFlash
              ? 'bg-white'
              : 'bg-[radial-gradient(ellipse_at_center,rgba(255,255,220,0.22),transparent_62%)]'
          }`}
        />
      )}

      <div className="absolute top-5 left-5 right-5 z-20 flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          aria-label="返回"
          className={
            isMulti
              ? 'w-11 h-11 flex items-center justify-center rounded-full bg-black/35 border border-white/20 text-white/90 hover:bg-white/10 transition-colors'
              : 'w-11 h-11 flex items-center justify-center rounded-lg border border-dashed border-white/70 text-white/90 hover:bg-white/10 transition-colors'
          }
        >
          <ChevronLeft size={22} />
        </button>
        {showHistory && (
          <button
            type="button"
            onClick={onOpenHistory}
            className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-full bg-white/10 border border-white/25 text-sm font-bold text-white hover:bg-white/15 transition-colors"
          >
            <Clock size={15} />
            批改记录
          </button>
        )}
      </div>

      <div
        className={`absolute inset-0 flex items-center justify-center pl-16 pr-28 ${
          isMulti && atLimit ? 'pt-16 pb-32' : 'py-16'
        }`}
      >
        <div className="relative w-full h-full max-h-[78%] border-2 border-dashed border-white/80 rounded-[28px] flex items-center justify-center">
          <p className="text-white text-lg font-bold tracking-wide drop-shadow-md px-6 text-center">{hint}</p>

          {isMulti && count > 0 && count < MAX_PAGES && (
            <div className="absolute right-4 bottom-4 w-[72px] h-[72px] rounded-xl overflow-hidden border border-white/40 shadow-lg">
              <img src={capturedPages[count - 1].src} alt="" className="w-full h-full object-cover" />
              <span className="absolute inset-0 m-auto w-10 h-10 rounded-full bg-black/55 text-white text-[11px] font-bold flex items-center justify-center">
                {count}张
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="absolute right-6 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-6">
        <button
          type="button"
          onClick={onToggleFlash}
          aria-label={flashOn ? '关闭闪光灯' : '打开闪光灯'}
          className={iconBtnClass}
        >
          <Flashlight size={20} />
        </button>
        <button
          type="button"
          onClick={handleShutter}
          aria-label="拍照"
          disabled={isMulti && atLimit}
          className={`rounded-full transition-transform ${
            isMulti
              ? `w-[76px] h-[76px] border-[3px] border-white flex items-center justify-center ${
                  atLimit ? 'opacity-40 cursor-not-allowed' : 'active:scale-95'
                }`
              : 'w-[72px] h-[72px] bg-[#d4c4f8] shadow-[0_0_24px_rgba(212,196,248,0.45)] hover:bg-[#ddd0fb] active:scale-95'
          }`}
        >
          {isMulti ? <span className="w-[58px] h-[58px] rounded-full bg-[#d4c4f8]" /> : null}
        </button>
        {isMulti && count > 0 && (
          <button type="button" onClick={onSubmit} className="flex flex-col items-center gap-1.5">
            <span className="w-12 h-12 rounded-full bg-[#7b6cff] flex items-center justify-center shadow-[0_6px_18px_rgba(123,108,255,0.45)] hover:bg-[#8b7dff] active:scale-95 transition-transform">
              <Check size={22} strokeWidth={3} className="text-white" />
            </span>
            <span className="text-xs font-bold text-white/90">去批改</span>
          </button>
        )}
      </div>

      {isMulti && atLimit && (
        <div className="absolute left-10 right-28 bottom-5 z-20 flex items-center gap-4">
          <div className="flex items-center gap-3">
            {capturedPages.map((page, index) => (
              <div
                key={page.id}
                draggable
                onDragStart={() => {
                  dragFromRef.current = index;
                }}
                onDragOver={event => event.preventDefault()}
                onDrop={() => {
                  const from = dragFromRef.current;
                  if (from == null || from === index) return;
                  onReorderPages(from, index);
                  dragFromRef.current = null;
                }}
                className="relative w-[72px] h-[72px] rounded-xl overflow-hidden border border-white/35 cursor-grab active:cursor-grabbing"
              >
                <img src={page.src} alt={`第${index + 1}张`} className="w-full h-full object-cover" />
                <span className="absolute inset-0 m-auto w-10 h-10 rounded-full bg-black/55 text-white text-[11px] font-bold flex items-center justify-center pointer-events-none">
                  {index + 1}张
                </span>
                <button
                  type="button"
                  aria-label={`删除第${index + 1}张`}
                  onClick={() => onDeletePage(page.id)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow"
                >
                  <X size={12} strokeWidth={3} />
                </button>
              </div>
            ))}
          </div>
          <p className="text-sm font-bold text-white/85">长按拖动图片顺序</p>
        </div>
      )}

      {showModeSwitch && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
          <div className="flex items-center rounded-full bg-black/35 p-1 border border-white/10">
            <button
              type="button"
              onClick={() => onModeChange('single')}
              className={`px-5 py-2 rounded-full text-sm font-bold transition-colors ${
                mode === 'single' ? 'bg-[#d4c4f8] text-slate-800' : 'text-white/75 hover:text-white'
              }`}
            >
              单页批改
            </button>
            <button
              type="button"
              onClick={() => onModeChange('multi')}
              className={`px-5 py-2 rounded-full text-sm font-bold transition-colors ${
                mode === 'multi' ? 'bg-[#d4c4f8] text-slate-800' : 'text-white/75 hover:text-white'
              }`}
            >
              多页批改
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
