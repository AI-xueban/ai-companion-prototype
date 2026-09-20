import React from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';

interface PracticeReturnChoiceProps {
  open: boolean;
  onGoSubject: () => void;
  onGoHome: () => void;
}

export const PracticeReturnChoice: React.FC<PracticeReturnChoiceProps> = ({
  open,
  onGoSubject,
  onGoHome,
}) => {
  const viewport = typeof document !== 'undefined' ? document.getElementById('app-viewport') : null;
  if (!viewport) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="absolute inset-0 z-[700] flex items-center justify-center px-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/40"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="practice-return-title"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            className="relative z-10 w-full max-w-[360px] rounded-3xl border border-white/80 bg-white p-5 shadow-[0_24px_64px_rgba(15,23,42,0.18)]"
          >
            <h2 id="practice-return-title" className="text-[16px] font-semibold text-slate-900">
              这组练习完成了
            </h2>
            <p className="mt-1 text-[12px] leading-relaxed text-slate-400">
              下一步想回科目页继续学，还是回首页？
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={onGoSubject}
                className="h-11 rounded-2xl bg-violet-600 text-[13px] font-semibold text-white transition hover:bg-violet-700"
              >
                回科目页
              </button>
              <button
                type="button"
                onClick={onGoHome}
                className="h-11 rounded-2xl bg-slate-100 text-[13px] font-semibold text-slate-600 transition hover:bg-slate-200"
              >
                回首页
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    viewport,
  );
};
