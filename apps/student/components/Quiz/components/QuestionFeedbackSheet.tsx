import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import {
  QUESTION_FEEDBACK_REASON_GROUPS,
  QUESTION_FEEDBACK_REASON_META,
  QuestionFeedbackReason,
} from '../../../types/questionFeedback';

export interface QuestionFeedbackSheetPayload {
  reason: QuestionFeedbackReason;
  description?: string;
}

interface QuestionFeedbackSheetProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: QuestionFeedbackSheetPayload) => void;
}

export const QuestionFeedbackSheet: React.FC<QuestionFeedbackSheetProps> = ({
  open,
  onClose,
  onSubmit,
}) => {
  const [reason, setReason] = useState<QuestionFeedbackReason | null>(null);
  const [description, setDescription] = useState('');

  const portalTarget =
    document.getElementById('app-viewport') ||
    document.getElementById('modal-root') ||
    document.body;

  useEffect(() => {
    if (!open) {
      setReason(null);
      setDescription('');
    }
  }, [open]);

  const handleSubmit = () => {
    if (!reason) return;
    onSubmit({
      reason,
      description: description.trim() || undefined,
    });
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
            className="absolute inset-0 z-[180] bg-gray-900/45 backdrop-blur-[2px]"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="absolute left-0 right-0 bottom-0 z-[190] px-4 pb-6 pt-2"
          >
            <div className="max-w-2xl mx-auto bg-white rounded-[28px] shadow-2xl border border-gray-100 overflow-hidden max-h-[min(88vh,720px)] flex flex-col">
              <div className="flex items-center justify-between px-5 pt-4 pb-2 shrink-0">
                <div>
                  <p className="text-[11px] font-bold text-indigo-600">题目反馈</p>
                  <h3 className="text-lg font-black text-gray-800 mt-0.5">选择反馈原因</h3>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 rounded-full text-gray-400 hover:bg-gray-100 transition-colors"
                  aria-label="关闭"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="px-5 pb-5 space-y-4 overflow-y-auto min-h-0">
                <div className="space-y-3">
                  {QUESTION_FEEDBACK_REASON_GROUPS.map((group) => (
                    <div key={group.title} className="space-y-2">
                      <p className="text-[11px] font-bold text-slate-400 px-0.5">{group.title}</p>
                      <div className="grid grid-cols-2 gap-2">
                        {group.reasons.map((reasonKey) => {
                          const option = QUESTION_FEEDBACK_REASON_META[reasonKey];
                          const selected = reason === reasonKey;
                          return (
                            <button
                              key={reasonKey}
                              type="button"
                              onClick={() => setReason(reasonKey)}
                              className={`flex items-start gap-2 px-3 py-2.5 rounded-xl border-2 text-left transition-all min-h-[44px] ${
                                selected
                                  ? 'border-indigo-500 bg-indigo-50'
                                  : 'border-gray-100 bg-gray-50 hover:border-indigo-200'
                              }`}
                            >
                              <span
                                className={`w-3.5 h-3.5 rounded-full border-2 shrink-0 mt-0.5 ${
                                  selected ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300 bg-white'
                                }`}
                              />
                              <span className="text-xs font-bold text-gray-800 leading-snug">
                                {option.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 200))}
                  placeholder="补充说明（选填）"
                  rows={2}
                  className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                />

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!reason}
                  className="w-full py-3 rounded-2xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 transition-colors active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  提交反馈
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    portalTarget,
  );
};
