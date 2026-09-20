import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Pencil, Check } from 'lucide-react';
import { ExpeditionPlan } from '../../types';
import { GEOMETRY_KNOWLEDGE_POINTS } from './expeditionMapNodes';
import { getPlanDisplayName } from './expeditionPlanConfig';

interface ExpeditionCompletionModalProps {
  isOpen: boolean;
  plan: ExpeditionPlan;
  onClose: () => void;
  onRedesign: () => void;
  onReviewPath: () => void;
  onReturnHome?: () => void;
  stats?: {
    clearedCount: number;
    totalCount: number;
    daysAhead: number;
    accuracy: number;
  };
}

export const ExpeditionCompletionModal: React.FC<ExpeditionCompletionModalProps> = ({
  isOpen,
  plan,
  onClose,
  onRedesign,
  onReviewPath,
  onReturnHome,
  stats,
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

  const total = stats?.totalCount ?? GEOMETRY_KNOWLEDGE_POINTS.length;
  const cleared = stats?.clearedCount ?? total;
  const daysAhead = stats?.daysAhead ?? 2;
  const accuracy = stats?.accuracy ?? 96;
  const planName = getPlanDisplayName(plan);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[200] bg-slate-950/70 backdrop-blur-md"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="absolute inset-0 z-[201] flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="pointer-events-auto w-full max-w-md max-h-[90vh] overflow-y-auto no-scrollbar rounded-[32px] bg-gradient-to-b from-slate-900 to-slate-950 border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.6)]"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={onClose}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/5 text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>

              <div className="px-6 pt-10 pb-6 text-center">
                <div className="relative w-24 h-24 mx-auto mb-5">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400/30 to-violet-500/30 blur-xl animate-pulse" />
                  <div className="absolute inset-0 rounded-full border-2 border-transparent bg-gradient-to-br from-cyan-400 to-violet-500 p-[2px]">
                    <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center">
                      <Trophy size={40} className="text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]" />
                    </div>
                  </div>
                  <span className="absolute -top-1 -left-1 text-amber-300 text-xs">✦</span>
                  <span className="absolute top-2 -right-2 text-cyan-300 text-[10px]">✦</span>
                  <span className="absolute -bottom-1 right-4 text-violet-300 text-xs">✦</span>
                </div>

                <h2 className="text-2xl font-black text-white mb-2">
                  真厉害，<span className="text-amber-400">全部通关</span>
                </h2>
                <p className="text-sm text-white/55 leading-relaxed mb-6 px-2">
                  本次计划的知识点已全部通关，提前完成了学习计划
                </p>

                <div className="grid grid-cols-3 gap-2 mb-5">
                  <div className="rounded-2xl bg-white/5 border border-white/8 px-2 py-3">
                    <p className="text-lg font-black text-amber-400">
                      {cleared}/{total}
                    </p>
                    <p className="text-[10px] text-white/45 font-medium mt-0.5">知识点通关</p>
                  </div>
                  <div className="rounded-2xl bg-white/5 border border-white/8 px-2 py-3">
                    <p className="text-lg font-black text-cyan-400">提前{daysAhead}天</p>
                    <p className="text-[10px] text-white/45 font-medium mt-0.5">完成计划</p>
                  </div>
                  <div className="rounded-2xl bg-white/5 border border-white/8 px-2 py-3">
                    <p className="text-lg font-black text-cyan-400">{accuracy}%</p>
                    <p className="text-[10px] text-white/45 font-medium mt-0.5">平均正确率</p>
                  </div>
                </div>

                <div className="mb-5 text-left">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-white/50">学习计划完成度</span>
                    <span className="text-xs font-black text-cyan-400">100%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full w-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500" />
                  </div>
                </div>

                <div className="mb-6 text-left">
                  <p className="text-xs font-bold text-white/50 mb-3">已通关知识点</p>
                  <div className="flex flex-wrap gap-2">
                    {GEOMETRY_KNOWLEDGE_POINTS.map((point) => (
                      <span
                        key={point}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 border border-white/8 text-[11px] font-medium text-white/75"
                      >
                        <Check size={10} className="text-emerald-400 shrink-0" />
                        {point}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    onClick={onRedesign}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-violet-600 text-white font-black text-sm shadow-[0_12px_40px_rgba(6,182,212,0.35)] flex items-center justify-center gap-2"
                  >
                    <Pencil size={16} />
                    重新定制计划
                  </motion.button>

                  <button
                    type="button"
                    onClick={onReviewPath}
                    className="w-full py-3.5 rounded-2xl border border-white/15 text-white/80 font-bold text-sm hover:bg-white/5 transition-colors"
                  >
                    回顾当前路线
                  </button>

                  {onReturnHome && (
                    <button
                      type="button"
                      onClick={onReturnHome}
                      className="w-full py-2 text-white/35 text-xs font-medium hover:text-white/55 transition-colors"
                    >
                      返回首页
                    </button>
                  )}
                </div>

                <p className="mt-4 text-[10px] text-white/30">
                  {planName} · 计划结束后可随时重新定制新的学习计划
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    portalTarget
  );
};
