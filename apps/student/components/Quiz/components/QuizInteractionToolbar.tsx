import React from 'react';
import { Clock, Pen, Eraser, Keyboard, RotateCcw } from 'lucide-react';
import type { AnswerInputMode } from './BlankAnswerSlots';

interface QuizInteractionToolbarProps {
  elapsedLabel: string;
  onTimerClick?: () => void;
  isDraftMode: boolean;
  onToggleDraft: () => void;
  /** 答题输入模式：键盘 / 手写（填空等） */
  answerInputMode?: AnswerInputMode;
  onAnswerInputModeChange?: (mode: AnswerInputMode) => void;
  showAnswerInputModes?: boolean;
  draftTool?: 'pen' | 'eraser';
  onDraftToolChange?: (tool: 'pen' | 'eraser') => void;
  penColor?: string;
  onPenColorChange?: (color: string) => void;
  penSize?: number;
  onPenSizeChange?: (size: number) => void;
  onClearDraft?: () => void;
  extraTools?: React.ReactNode;
  hideDraftToggle?: boolean;
  /** 是否展示笔色 / 橡皮（手写作答或草稿开启时） */
  showInkTools?: boolean;
}

const PEN_COLORS = ['#64748B', '#7C3AED', '#A78BFA', '#FF3B30', '#0EA5E9', '#111827'];
const PEN_SIZES = [2, 3, 5, 8];

export const QuizInteractionToolbar: React.FC<QuizInteractionToolbarProps> = ({
  elapsedLabel,
  onTimerClick,
  isDraftMode,
  onToggleDraft,
  answerInputMode = 'handwrite',
  onAnswerInputModeChange,
  showAnswerInputModes = false,
  draftTool = 'pen',
  onDraftToolChange,
  penColor = '#7C3AED',
  onPenColorChange,
  penSize = 3,
  onPenSizeChange,
  onClearDraft,
  extraTools,
  hideDraftToggle = false,
  showInkTools = false,
}) => {
  const inkActive = showInkTools || isDraftMode;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={onTimerClick}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-bold text-slate-600"
        >
          <Clock size={13} className="text-slate-400" />
          <span>用时: {elapsedLabel}</span>
        </button>

        <div className="flex items-center gap-1.5 ml-auto flex-wrap justify-end">
          {extraTools}

          {!hideDraftToggle && (
            <button
              type="button"
              onClick={onToggleDraft}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-bold transition ${
                isDraftMode
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-violet-50 text-violet-700 border border-violet-100'
              }`}
            >
              <Pen size={13} />
              <span>{isDraftMode ? '退出草稿' : '草稿'}</span>
            </button>
          )}

          {showAnswerInputModes && !isDraftMode && (
            <>
              <button
                type="button"
                aria-label="键盘输入"
                onClick={() => onAnswerInputModeChange?.('keyboard')}
                className={`flex h-8 w-8 items-center justify-center rounded-xl border transition ${
                  answerInputMode === 'keyboard'
                    ? 'bg-violet-500 text-white border-violet-500 shadow-sm'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-violet-200'
                }`}
              >
                <Keyboard size={15} />
              </button>
              <button
                type="button"
                aria-label="手写输入"
                onClick={() => onAnswerInputModeChange?.('handwrite')}
                className={`flex h-8 w-8 items-center justify-center rounded-xl border transition ${
                  answerInputMode === 'handwrite'
                    ? 'bg-violet-500 text-white border-violet-500 shadow-sm'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-violet-200'
                }`}
              >
                <Pen size={15} />
              </button>
            </>
          )}

          {inkActive && (
            <>
              <div className="flex items-center gap-1 px-1">
                {PEN_COLORS.slice(0, 3).map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={`笔色 ${c}`}
                    onClick={() => onPenColorChange?.(c)}
                    className={`h-5 w-5 rounded-full border transition ${
                      penColor === c ? 'ring-2 ring-offset-1 ring-violet-400 scale-110' : 'border-white shadow-sm'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <button
                type="button"
                aria-label="橡皮"
                onClick={() => onDraftToolChange?.(draftTool === 'eraser' ? 'pen' : 'eraser')}
                className={`flex h-8 w-8 items-center justify-center rounded-xl border transition ${
                  draftTool === 'eraser'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                }`}
              >
                <Eraser size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      {isDraftMode && (
        <div className="flex flex-wrap items-center gap-2 p-2 rounded-2xl bg-slate-50 border border-slate-100">
          <button
            type="button"
            onClick={() => onDraftToolChange?.(draftTool === 'eraser' ? 'pen' : 'eraser')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-semibold border ${
              draftTool === 'eraser'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200'
            }`}
          >
            {draftTool === 'eraser' ? <Eraser size={12} /> : <Pen size={12} />}
            {draftTool === 'eraser' ? '橡皮' : '画笔'}
          </button>

          <div className="flex items-center gap-1">
            {PEN_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onPenColorChange?.(c)}
                className={`w-5 h-5 rounded-full border ${penColor === c ? 'ring-2 ring-offset-1 ring-indigo-400' : 'border-slate-200'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          <div className="flex items-center gap-1">
            {PEN_SIZES.map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => onPenSizeChange?.(size)}
                className={`px-2 py-1 rounded-full text-[10px] font-semibold border ${
                  penSize === size ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                {size}px
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onClearDraft}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-semibold bg-white border border-slate-200 text-slate-700"
          >
            <RotateCcw size={12} />
            清空
          </button>
        </div>
      )}
    </div>
  );
};
