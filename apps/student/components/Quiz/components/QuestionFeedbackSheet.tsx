import React, { useEffect, useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, X } from 'lucide-react';
import {
  QUESTION_FEEDBACK_REASON_GROUPS,
  QUESTION_FEEDBACK_REASON_META,
  QuestionFeedbackReason,
} from '../../../types/questionFeedback';

export interface QuestionFeedbackSheetPayload {
  reasons: QuestionFeedbackReason[];
  description?: string;
}

interface QuestionFeedbackSheetProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: QuestionFeedbackSheetPayload) => Promise<void>;
}

export const QuestionFeedbackSheet: React.FC<QuestionFeedbackSheetProps> = ({
  open,
  onClose,
  onSubmit,
}) => {
  const [reasons, setReasons] = useState<QuestionFeedbackReason[]>([]);
  const [description, setDescription] = useState('');
  const descriptionId = useId();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const portalTarget =
    document.getElementById('app-viewport') ||
    document.getElementById('modal-root') ||
    document.body;

  useEffect(() => {
    if (!open) {
      setReasons([]);
      setDescription('');
      setError('');
    }
  }, [open]);

  const toggleReason = (reasonKey: QuestionFeedbackReason) => {
    setReasons((current) => {
      if (current.includes(reasonKey)) return current.filter((item) => item !== reasonKey);
      if (current.length >= 3) return current;
      return [...current, reasonKey];
    });
  };

  const handleSubmit = async () => {
    if (!reasons.length || pending) return;
    setPending(true);
    setError('');
    try {
      await onSubmit({
        reasons,
        description: description.trim() || undefined,
      });
    } catch {
      setError('提交失败，已保留填写内容，请重试。');
    } finally {
      setPending(false);
    }
  };

  if (!open) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[180] bg-gray-900/35 backdrop-blur-[1px]"
            onClick={pending ? undefined : onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="pointer-events-none absolute inset-0 z-[190] flex min-h-0 justify-end"
          >
            <div className="pointer-events-auto flex h-full max-h-full min-h-0 w-1/2 min-w-[420px] max-w-[720px] flex-col overflow-hidden rounded-l-3xl border-y border-l border-gray-100 bg-white shadow-2xl max-[840px]:w-full max-[840px]:min-w-0 max-[840px]:max-w-none max-[840px]:rounded-none">
              <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-6 py-5">
                <h3 className="text-xl font-black text-gray-800">纠错 / 超纲反馈</h3>
                <button
                  type="button"
                  onClick={pending ? undefined : onClose}
                  className="rounded-xl bg-slate-100 p-2 text-gray-500 transition-colors hover:bg-slate-200"
                  aria-label="关闭"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-6 py-5">
                <div className="space-y-2.5">
                  <h4 className="text-sm font-bold text-slate-800">选择反馈类型</h4>
                  {QUESTION_FEEDBACK_REASON_GROUPS.map((group) => (
                    <div key={group.title} className="space-y-1.5">
                      <p className="text-[11px] font-bold text-slate-400 px-0.5">{group.title}</p>
                      <div className="grid grid-cols-2 gap-2">
                        {group.reasons.map((reasonKey) => {
                          const option = QUESTION_FEEDBACK_REASON_META[reasonKey];
                          const selected = reasons.includes(reasonKey);
                          const limitReached = reasons.length >= 3 && !selected;
                          return (
                            <button
                              key={reasonKey}
                              type="button"
                              aria-pressed={selected}
                              disabled={pending || limitReached}
                              onClick={() => toggleReason(reasonKey)}
                              className={`flex items-center gap-2 px-2.5 py-2 rounded-xl border text-left transition-all min-h-[42px] disabled:cursor-not-allowed ${
                                selected
                                  ? 'border-indigo-500 bg-indigo-50'
                                  : limitReached
                                    ? 'border-slate-100 bg-slate-50/60 opacity-50'
                                    : 'border-slate-200 bg-slate-50 hover:border-indigo-200'
                              }`}
                            >
                              <span
                                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                                  selected ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-slate-300 bg-white text-transparent'
                                }`}
                              >
                                {selected && <Check size={12} strokeWidth={3} />}
                              </span>
                              <span className="text-[13px] font-semibold leading-snug text-gray-800">
                                {option.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <label htmlFor={descriptionId} className="block text-sm font-bold text-slate-700">
                    问题描述 <span className="font-normal text-slate-400">（选填）</span>
                  </label>
                  <textarea id={descriptionId} disabled={pending}
                    value={description}
                    maxLength={200}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="请描述你发现的问题，方便我们核实…"
                    rows={5}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-gray-700 outline-none transition-colors focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-500/15 resize-none"
                  />
                  <p className="text-right text-xs text-slate-400">{description.length} / 200 字</p>
                </div>
              </div>
              <div className="shrink-0 space-y-2 border-t border-gray-100 bg-white px-6 py-4">
                {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={pending ? undefined : onClose} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50">取消</button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!reasons.length || pending}
                    className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-indigo-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {pending ? '正在提交…' : '提交反馈'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    portalTarget,
  );
};
