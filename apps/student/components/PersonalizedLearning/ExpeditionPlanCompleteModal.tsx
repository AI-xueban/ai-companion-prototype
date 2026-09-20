import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, BarChart3, Sparkles, Coins, CalendarDays, Flag } from 'lucide-react';
import { Annotatable } from '../Prototype/Annotatable';

interface ExpeditionPlanCompleteModalProps {
  isOpen: boolean;
  onViewResult: () => void;
  totalXp: number;
  totalCoins: number;
  studyDays: number;
  totalLevels: number;
}

export const ExpeditionPlanCompleteModal: React.FC<ExpeditionPlanCompleteModalProps> = ({
  isOpen,
  onViewResult,
  totalXp,
  totalCoins,
  studyDays,
  totalLevels,
}) => {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const portalTarget =
    document.getElementById('app-viewport') ||
    document.getElementById('modal-root') ||
    document.body;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[200] bg-slate-950/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="absolute inset-0 z-[201] flex items-center justify-center p-6 pointer-events-none"
          >
            <div
              className="pointer-events-auto w-full max-w-sm rounded-[28px] bg-white shadow-[0_24px_80px_rgba(0,0,0,0.25)] border border-slate-100 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <Annotatable annotationId="subject.expedition-complete-modal">
              <div className="px-6 pt-8 pb-6 text-center">
                <div className="relative w-20 h-20 mx-auto mb-5">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-200/60 to-indigo-200/60 blur-xl animate-pulse" />
                  <div className="relative w-full h-full rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                    <Trophy size={36} className="text-white drop-shadow-sm" />
                  </div>
                </div>

                <h2 className="text-xl font-black text-slate-900 mb-2 leading-snug">
                  真棒！完成了本次训练计划的全部关卡！
                </h2>
                <p className="text-sm text-slate-500 mb-4">
                  所有知识点已通关，点击查看本次闯关详情
                </p>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="rounded-2xl bg-slate-50 border border-slate-100 py-3 px-3">
                    <div className="flex items-center justify-center gap-1.5 text-slate-400 mb-1">
                      <CalendarDays size={13} />
                      <span className="text-[10px] font-bold">累计学习</span>
                    </div>
                    <p className="text-lg font-black text-slate-800">
                      {studyDays}
                      <span className="text-xs font-bold text-slate-500 ml-0.5">天</span>
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 border border-slate-100 py-3 px-3">
                    <div className="flex items-center justify-center gap-1.5 text-slate-400 mb-1">
                      <Flag size={13} />
                      <span className="text-[10px] font-bold">通关关卡</span>
                    </div>
                    <p className="text-lg font-black text-slate-800">
                      {totalLevels}
                      <span className="text-xs font-bold text-slate-500 ml-0.5">关</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-3 mb-6">
                  <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-indigo-50 border border-indigo-100">
                    <Sparkles size={14} className="text-indigo-500" />
                    <span className="text-sm font-black text-indigo-600">+{totalXp} XP</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-amber-50 border border-amber-100">
                    <Coins size={14} className="text-amber-500 fill-amber-400" />
                    <span className="text-sm font-black text-amber-600">+{totalCoins}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onViewResult}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-black text-sm shadow-lg shadow-indigo-500/25 hover:opacity-95 transition-opacity flex items-center justify-center gap-2"
                >
                  <BarChart3 size={16} />
                  查看本次闯关结果
                </button>
              </div>
              </Annotatable>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    portalTarget
  );
};
