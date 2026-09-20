import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { ContinuePromptKind, getContinuePromptCopy } from './expeditionCatalog';

export function ExpeditionContinuePrompt({
  open,
  kind,
  onConfirm,
  onEnd,
}: {
  open: boolean;
  kind: ContinuePromptKind | null;
  onConfirm: () => void;
  onEnd: () => void;
}) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  if (!mounted || !kind) return null;

  const copy = getContinuePromptCopy(kind);
  const canContinue = Boolean(copy.confirm);
  const portalTarget =
    document.getElementById('app-viewport') ||
    document.getElementById('modal-root') ||
    document.body;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[200] bg-slate-950/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            className="absolute inset-0 z-[201] flex items-center justify-center p-6 pointer-events-none"
          >
            <div className="pointer-events-auto w-full max-w-sm rounded-[28px] bg-white p-6 text-center shadow-[0_24px_80px_rgba(0,0,0,0.25)]">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50">
                <Sparkles size={26} className="text-amber-500" />
              </div>
              <h3 className="text-lg font-black text-slate-800">{copy.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{copy.body}</p>
              <div className="mt-6 flex flex-col gap-2.5">
                {canContinue ? (
                  <button
                    type="button"
                    onClick={onConfirm}
                    className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 text-sm font-black text-white shadow-lg shadow-violet-500/25"
                  >
                    {copy.confirm}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={onEnd}
                  className={`w-full rounded-2xl py-3 text-sm font-black ${
                    canContinue ? 'bg-slate-100 text-slate-600' : 'bg-violet-600 text-white'
                  }`}
                >
                  {copy.cancel}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    portalTarget
  );
}
