import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDown, ArrowUp, X } from 'lucide-react';
import type { PracticeDifficulty } from '../../data/juniorSyncAssessment';

export type PracticeShortageVariant =
  | 'below_count'
  | 'no_new'
  | 'empty_bank'
  | 'daily_limit'
  | 'subject_daily_limit';

interface PracticeShortageDialogProps {
  open: boolean;
  variant: PracticeShortageVariant;
  scopeLabel: string;
  difficulty: PracticeDifficulty;
  scenarioLabel: string;
  availableCount?: number;
  requestedCount?: number;
  canLower: boolean;
  canRaise: boolean;
  showRetryDone?: boolean;
  cancelLabel?: string;
  onLower: () => void;
  onRaise: () => void;
  onUseAvailable?: () => void;
  onRetryDone?: () => void;
  onCancel: () => void;
}

export const PracticeShortageDialog: React.FC<PracticeShortageDialogProps> = ({
  open,
  variant,
  scopeLabel,
  difficulty,
  scenarioLabel,
  availableCount = 0,
  requestedCount = 0,
  canLower,
  canRaise,
  showRetryDone = false,
  cancelLabel,
  onLower,
  onRaise,
  onUseAvailable,
  onRetryDone,
  onCancel,
}) => {
  const isHardBlock = variant === 'empty_bank'
    || variant === 'daily_limit'
    || variant === 'subject_daily_limit';
  const resolvedCancelLabel = cancelLabel
    ?? (isHardBlock ? '知道了' : '先不练了');
  const title = variant === 'daily_limit'
    ? '今日练习次数已经达到上限啦'
    : variant === 'subject_daily_limit'
      ? '今日本学科练习次数已经达到上限啦'
      : variant === 'empty_bank'
        ? '抱歉，当前章节下没有题目'
        : variant === 'no_new'
          ? `${scopeLabel}没有新题了`
          : `目前只能出 ${availableCount} 题`;
  const body = variant === 'daily_limit'
    ? '今天已经练习很久啦，要不休息一下？明天再来继续加油吧。'
    : variant === 'subject_daily_limit'
      ? '这门学科今天已经练得很认真啦，要不先休息一下，或者换一门试试？明天再来继续加油吧。'
      : variant === 'empty_bank'
        ? `${scopeLabel === '当前小节' ? '当前章节' : scopeLabel}还没有可练的题，请先换其他内容再试。`
        : variant === 'no_new'
          ? `${scopeLabel}「${difficulty} · ${scenarioLabel}」的题你都做过了。可以换一档难度继续做新题。`
          : `${scopeLabel}「${difficulty} · ${scenarioLabel}」还剩 ${availableCount} 道新题，不够 ${requestedCount} 道。可以先做，或换难度试试。`;

  return (
    <AnimatePresence>
      {open && (
        <div className="absolute inset-0 z-30 flex items-center justify-center px-4">
          <motion.button
            type="button"
            aria-label="关闭"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="practice-shortage-title"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className="relative z-10 w-full max-w-[400px] overflow-hidden rounded-3xl border border-white/80 bg-white shadow-[0_24px_64px_rgba(15,23,42,0.18)]"
          >
            <div className="flex items-start justify-between px-5 pb-1 pt-4">
              <div className="min-w-0">
                <h2 id="practice-shortage-title" className="text-[16px] font-semibold text-slate-900">
                  {title}
                </h2>
                <p className="mt-1.5 text-[12px] leading-5 text-slate-500">{body}</p>
              </div>
              <button
                type="button"
                onClick={onCancel}
                aria-label="关闭"
                className="ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            {!isHardBlock && (
              <div className="space-y-2 px-5 pb-2 pt-3">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={!canLower}
                    onClick={onLower}
                    className="flex h-11 items-center justify-center gap-1.5 rounded-2xl border border-slate-200 text-[13px] font-semibold text-slate-700 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <ArrowDown size={14} />
                    {variant === 'below_count' ? '降低难度再看看' : '降一档出新题'}
                  </button>
                  <button
                    type="button"
                    disabled={!canRaise}
                    onClick={onRaise}
                    className="flex h-11 items-center justify-center gap-1.5 rounded-2xl border border-slate-200 text-[13px] font-semibold text-slate-700 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <ArrowUp size={14} />
                    {variant === 'below_count' ? '提高难度再看看' : '升一档出新题'}
                  </button>
                </div>
                {variant === 'below_count' && onUseAvailable && (
                  <button
                    type="button"
                    onClick={onUseAvailable}
                    className="flex h-11 w-full items-center justify-center rounded-2xl bg-violet-600 text-[13px] font-semibold text-white transition hover:bg-violet-700"
                  >
                    确认按 {availableCount} 题开始
                  </button>
                )}
                {variant === 'no_new' && showRetryDone && onRetryDone && (
                  <button
                    type="button"
                    onClick={onRetryDone}
                    className="flex h-11 w-full items-center justify-center rounded-2xl bg-violet-600 text-[13px] font-semibold text-white transition hover:bg-violet-700"
                  >
                    再练做过的题
                  </button>
                )}
              </div>
            )}

            <div className="px-5 pb-4 pt-2">
              <button
                type="button"
                onClick={onCancel}
                className={`h-10 w-full rounded-2xl text-[13px] font-semibold transition ${
                  isHardBlock
                    ? 'bg-violet-600 text-white hover:bg-violet-700'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {resolvedCancelLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
