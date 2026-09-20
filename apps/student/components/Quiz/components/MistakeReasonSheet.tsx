import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import {
  MISTAKE_REASON_GROUPS,
  MISTAKE_REASON_MAX_COUNT,
  MISTAKE_REASON_META,
  MistakeReasonKey,
} from '../../../data/mistakeReasons';

interface MistakeReasonSheetProps {
  open: boolean;
  selectedReasons?: MistakeReasonKey[];
  onClose: () => void;
  onConfirm: (reasons: MistakeReasonKey[]) => void;
}

export const MistakeReasonSheet: React.FC<MistakeReasonSheetProps> = ({
  open,
  selectedReasons = [],
  onClose,
  onConfirm,
}) => {
  const portalTarget =
    document.getElementById('app-viewport') ||
    document.getElementById('modal-root') ||
    document.body;

  const [draft, setDraft] = useState<MistakeReasonKey[]>([]);
  const [limitHint, setLimitHint] = useState(false);

  useEffect(() => {
    if (open) {
      setDraft(selectedReasons);
      setLimitHint(false);
    }
  }, [open, selectedReasons]);

  const toggleReason = (reason: MistakeReasonKey) => {
    setDraft((prev) => {
      if (prev.includes(reason)) {
        setLimitHint(false);
        return prev.filter((item) => item !== reason);
      }
      if (prev.length >= MISTAKE_REASON_MAX_COUNT) {
        setLimitHint(true);
        return prev;
      }
      setLimitHint(false);
      return [...prev, reason];
    });
  };

  const handleConfirm = () => {
    onConfirm(draft);
    onClose();
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
            <div className="max-w-2xl mx-auto bg-white rounded-[28px] shadow-2xl border border-gray-100 overflow-hidden max-h-[min(80vh,640px)] flex flex-col">
              <div className="flex items-center justify-between px-5 pt-4 pb-2 shrink-0">
                <div>
                  <p className="text-[11px] font-bold text-rose-500">错因标记</p>
                  <h3 className="text-lg font-black text-gray-800 mt-0.5">哪里做错了？</h3>
                  <p className="text-[11px] text-slate-400 mt-1">
                    最多选 {MISTAKE_REASON_MAX_COUNT} 项 · 已选 {draft.length}/{MISTAKE_REASON_MAX_COUNT}
                  </p>
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

              <div className="px-5 pb-3 overflow-y-auto min-h-0 space-y-3">
                {MISTAKE_REASON_GROUPS.map((group) => (
                  <div key={group.title} className="space-y-2">
                    <p className="text-[11px] font-bold text-slate-400 px-0.5">{group.title}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {group.reasons.map((reasonKey) => {
                        const option = MISTAKE_REASON_META[reasonKey];
                        const selected = draft.includes(reasonKey);
                        const disabled =
                          !selected && draft.length >= MISTAKE_REASON_MAX_COUNT;
                        return (
                          <button
                            key={reasonKey}
                            type="button"
                            onClick={() => toggleReason(reasonKey)}
                            disabled={disabled}
                            className={`flex items-start gap-2 px-3 py-2.5 rounded-xl border-2 text-left transition-all min-h-[44px] ${
                              selected
                                ? 'border-indigo-500 bg-indigo-50'
                                : disabled
                                  ? 'border-gray-100 bg-gray-50 opacity-45 cursor-not-allowed'
                                  : 'border-gray-100 bg-gray-50 hover:border-indigo-200'
                            }`}
                          >
                            <span
                              className={`w-3.5 h-3.5 rounded-md border-2 shrink-0 mt-0.5 flex items-center justify-center ${
                                selected ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300 bg-white'
                              }`}
                            >
                              {selected && (
                                <span className="w-1.5 h-1.5 rounded-[1px] bg-white block" />
                              )}
                            </span>
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

              <div className="px-5 pb-5 pt-2 shrink-0 space-y-2 border-t border-gray-100">
                {limitHint && (
                  <p className="text-[11px] text-amber-600 font-semibold text-center">
                    最多只能选择 {MISTAKE_REASON_MAX_COUNT} 个错因
                  </p>
                )}
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={draft.length === 0}
                  className="w-full py-3 rounded-2xl bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/20 hover:bg-indigo-500 transition-colors active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  完成
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
