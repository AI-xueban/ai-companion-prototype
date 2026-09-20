import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import {
  TUTOR_EXPLAIN_FEEDBACK_REASONS,
  TutorExplainFeedbackRating,
  TutorExplainFeedbackReason,
} from '../../data/tutorExplainFeedback';
import { submitTutorExplainFeedback } from '../../services/tutorExplainFeedbackService';

interface TutorExplainFeedbackProps {
  questionId?: string;
  scriptKey?: string;
  className?: string;
}

export const TutorExplainFeedback: React.FC<TutorExplainFeedbackProps> = ({
  questionId,
  scriptKey,
  className = '',
}) => {
  const [submitted, setSubmitted] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [rating, setRating] = useState<TutorExplainFeedbackRating | null>(null);
  const [selectedReasons, setSelectedReasons] = useState<TutorExplainFeedbackReason[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const portalTarget =
    document.getElementById('app-viewport') ||
    document.getElementById('modal-root') ||
    document.body;

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!sheetOpen) {
      setRating(null);
      setSelectedReasons([]);
    }
  }, [sheetOpen]);

  const showToast = (message: string) => {
    setToast(message);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 2400);
  };

  const handleSubmit = (
    nextRating: TutorExplainFeedbackRating,
    reasons: TutorExplainFeedbackReason[] = [],
  ) => {
    submitTutorExplainFeedback({
      questionId,
      scriptKey,
      rating: nextRating,
      reasons,
    });
    setSubmitted(true);
    setSheetOpen(false);
    showToast(nextRating === 'satisfied' ? '感谢反馈！' : '感谢反馈，我们会继续改进');
  };

  const handleSatisfied = () => {
    handleSubmit('satisfied');
  };

  const handleUnsatisfiedClick = () => {
    setRating('unsatisfied');
    setSheetOpen(true);
  };

  const toggleReason = (reason: TutorExplainFeedbackReason) => {
    setSelectedReasons((prev) =>
      prev.includes(reason) ? prev.filter((item) => item !== reason) : [...prev, reason],
    );
  };

  const handleSheetSubmit = () => {
    if (rating !== 'unsatisfied') return;
    handleSubmit('unsatisfied', selectedReasons);
  };

  if (submitted) {
    return toast ? (
      <div className="fixed left-1/2 bottom-24 -translate-x-1/2 z-[220] px-4 py-2.5 rounded-full bg-slate-900/90 text-white text-sm font-bold shadow-lg pointer-events-none">
        {toast}
      </div>
    ) : null;
  }

  return (
    <>
      <div className={`flex items-center justify-center gap-3 pt-2 ${className}`}>
        <button
          type="button"
          onClick={handleSatisfied}
          className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-white border border-slate-200 text-slate-700 text-sm font-bold shadow-sm hover:border-emerald-200 hover:bg-emerald-50 transition-all active:scale-95"
        >
          <span aria-hidden>😊</span>
          满意
        </button>
        <button
          type="button"
          onClick={handleUnsatisfiedClick}
          className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-white border border-slate-200 text-slate-700 text-sm font-bold shadow-sm hover:border-rose-200 hover:bg-rose-50 transition-all active:scale-95"
        >
          <span aria-hidden>😕</span>
          不满意
        </button>
      </div>

      {createPortal(
        <AnimatePresence>
          {sheetOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-[180] bg-gray-900/45 backdrop-blur-[2px]"
                onClick={() => setSheetOpen(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 12 }}
                transition={{ type: 'spring', damping: 26, stiffness: 320 }}
                className="absolute inset-0 z-[190] flex items-center justify-center px-4 pointer-events-none"
              >
                <div
                  className="pointer-events-auto w-full max-w-md bg-white rounded-[28px] shadow-2xl border border-gray-100 overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between px-5 pt-4 pb-2">
                    <h3 className="text-lg font-black text-gray-800">这次讲的怎么样？</h3>
                    <button
                      type="button"
                      onClick={() => setSheetOpen(false)}
                      className="p-2 rounded-full text-gray-400 hover:bg-gray-100 transition-colors"
                      aria-label="关闭"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="px-5 pb-5 space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={handleSatisfied}
                        className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-2xl border-2 border-gray-100 bg-gray-50 hover:border-emerald-200 transition-all"
                      >
                        <span className="text-2xl" aria-hidden>
                          😊
                        </span>
                        <span className="text-sm font-bold text-gray-700">满意</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRating('unsatisfied')}
                        className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-2xl border-2 transition-all ${
                          rating === 'unsatisfied'
                            ? 'border-indigo-500 bg-indigo-50'
                            : 'border-gray-100 bg-gray-50 hover:border-indigo-200'
                        }`}
                      >
                        <span className="text-2xl" aria-hidden>
                          😕
                        </span>
                        <span className="text-sm font-bold text-gray-700">不满意</span>
                      </button>
                    </div>

                    {rating === 'unsatisfied' ? (
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-slate-500">
                          请选择反馈类型（支持多选）
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          {TUTOR_EXPLAIN_FEEDBACK_REASONS.map((option) => {
                            const selected = selectedReasons.includes(option.key);
                            return (
                              <button
                                key={option.key}
                                type="button"
                                onClick={() => toggleReason(option.key)}
                                className={`px-3 py-2.5 rounded-xl border-2 text-xs font-bold text-left transition-all min-h-[44px] ${
                                  selected
                                    ? 'border-indigo-500 bg-indigo-50 text-indigo-900'
                                    : 'border-gray-100 bg-gray-50 text-gray-700 hover:border-indigo-200'
                                }`}
                              >
                                {option.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : null}

                    <button
                      type="button"
                      onClick={handleSheetSubmit}
                      disabled={rating !== 'unsatisfied' || selectedReasons.length === 0}
                      className="w-full py-3 rounded-2xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 transition-colors active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      提交
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        portalTarget,
      )}

      {toast && (
        <div className="fixed left-1/2 bottom-24 -translate-x-1/2 z-[220] px-4 py-2.5 rounded-full bg-slate-900/90 text-white text-sm font-bold shadow-lg pointer-events-none">
          {toast}
        </div>
      )}
    </>
  );
};
