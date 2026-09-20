import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Image, X, ZoomIn } from 'lucide-react';
import { getPortalRoot } from '../../../utils/portal';

/** 仅用于带试卷原图（originalImageUrl）的个别题目，如 q-math-013 */
export const PaperSourceImageControls: React.FC<{ imageUrl: string }> = ({ imageUrl }) => {
  const [open, setOpen] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setPortalTarget(getPortalRoot());
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const lightbox = (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-[220] flex flex-col bg-black/80 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="shrink-0 flex items-center justify-between gap-3 px-4 py-3 bg-black/40 border-b border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 text-white/90">
              <ZoomIn size={16} />
              <span className="text-sm font-bold">题目原图</span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors"
              aria-label="关闭"
            >
              <X size={18} />
            </button>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="flex-1 min-h-0 overflow-auto p-4 md:p-6 flex items-start justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full max-w-3xl rounded-2xl bg-white p-2 md:p-3 shadow-2xl">
              <img
                src={imageUrl}
                alt="题目原图"
                className="w-full h-auto max-w-full object-contain rounded-xl"
                draggable={false}
              />
            </div>
          </motion.div>

          <p className="shrink-0 pb-4 text-center text-xs text-white/50 font-medium">
            点击空白处关闭
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200/80 bg-white/90 text-xs font-semibold text-slate-600 hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50/60 transition-colors active:scale-[0.98]"
      >
        <Image size={13} className="text-indigo-500 shrink-0" />
        查看原图
      </button>

      {portalTarget ? createPortal(lightbox, portalTarget) : lightbox}
    </>
  );
};
