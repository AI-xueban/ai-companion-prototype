import React from 'react';
import { ChevronLeft, Check, X } from 'lucide-react';

export type QuestionNavStatus = 'current' | 'default' | 'answered' | 'correct' | 'wrong' | 'reviewed';

export interface QuestionNavItem {
  id: string;
  index: number;
  status: QuestionNavStatus;
}

interface QuizNavHeaderProps {
  showStepper: boolean;
  items: QuestionNavItem[];
  currentIndex: number;
  onBack: () => void;
  onSelectQuestion?: (index: number) => void;
  primaryLabel: string;
  onPrimaryAction: () => void;
  primaryDisabled?: boolean;
  primaryVariant?: 'default' | 'success';
  showPrimaryAction?: boolean;
  summaryLabel?: string;
  onSummaryClick?: () => void;
  showSummary?: boolean;
}

const statusRing: Record<QuestionNavStatus, string> = {
  current: 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/30',
  default: 'bg-white text-slate-500 border-slate-200 hover:border-indigo-200',
  answered: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  correct: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  wrong: 'bg-rose-50 text-rose-700 border-rose-200',
  reviewed: 'bg-amber-50 text-amber-700 border-amber-200',
};

export const QuizNavHeader: React.FC<QuizNavHeaderProps> = ({
  showStepper,
  items,
  currentIndex,
  onBack,
  onSelectQuestion,
  primaryLabel,
  onPrimaryAction,
  primaryDisabled = false,
  primaryVariant = 'default',
  showPrimaryAction = true,
  summaryLabel = '总结',
  onSummaryClick,
  showSummary = false,
}) => {
  return (
    <div className="flex-none px-3 py-1.5 flex items-center gap-2 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100">
      <button
        type="button"
        onClick={onBack}
        className="shrink-0 w-8 h-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 transition"
        aria-label="返回"
      >
        <ChevronLeft size={16} />
      </button>

      {showSummary && onSummaryClick && (
        <button
          type="button"
          onClick={onSummaryClick}
          className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100"
        >
          {summaryLabel}
        </button>
      )}

      {showStepper && (
        <div className="flex-1 min-w-0 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 px-0.5 py-0.5 min-h-[32px]">
            {items.map((item) => {
              const isCurrent = item.index === currentIndex;
              const status = isCurrent ? 'current' : item.status;
              const canJump = Boolean(onSelectQuestion) && !isCurrent;

              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={!canJump}
                  onClick={() => canJump && onSelectQuestion?.(item.index)}
                  className={`relative shrink-0 w-7 h-7 rounded-full border text-[12px] font-black transition-all ${statusRing[status]} ${
                    canJump ? 'cursor-pointer' : 'cursor-default'
                  } ${isCurrent ? 'shadow-[0_0_0_2px_rgba(99,102,241,0.28)]' : ''}`}
                >
                  {item.status === 'correct' && !isCurrent ? (
                    <Check size={12} className="mx-auto" strokeWidth={3} />
                  ) : item.status === 'wrong' && !isCurrent ? (
                    <X size={12} className="mx-auto" strokeWidth={3} />
                  ) : (
                    item.index + 1
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {!showStepper && <div className="flex-1" />}

      {showPrimaryAction && (
      <button
        type="button"
        onClick={onPrimaryAction}
        disabled={primaryDisabled}
        className={`shrink-0 px-4 py-1.5 rounded-full font-black text-[12px] text-white shadow-md transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none ${
          primaryVariant === 'success'
            ? 'bg-emerald-500 shadow-emerald-500/25 hover:bg-emerald-600'
            : 'bg-indigo-600 shadow-indigo-500/25 hover:bg-indigo-700'
        }`}
      >
        {primaryLabel}
      </button>
      )}
    </div>
  );
};
