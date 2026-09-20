import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Flag, Lightbulb, Sparkles } from 'lucide-react';
import { ExpeditionPlan } from '../../types';
import {
  getPlanCoverageText,
  getPlanDisplayName,
  getPlanExpectedTotalMinutes,
  resolvePlanLevelTitles,
} from './expeditionPlanConfig';
import { buildExpeditionMapNodes } from './expeditionMapNodes';

interface ExpeditionActivePlanCardProps {
  plan: ExpeditionPlan;
  completedCount: number;
  planStatus: 'active' | 'completed';
  onViewPath: () => void;
  onContinue: () => void;
}

export const ExpeditionActivePlanCard: React.FC<ExpeditionActivePlanCardProps> = ({
  plan,
  completedCount,
  planStatus,
  onViewPath,
  onContinue,
}) => {
  const totalLevels = Math.max(1, plan.duration * 7);
  const isAllCleared = planStatus === 'completed' || completedCount >= totalLevels;
  const progressPct = Math.min(100, Math.round((completedCount / totalLevels) * 100));

  const nextLevelTitle = useMemo(() => {
    if (isAllCleared) return '已全部通关';
    const titles = resolvePlanLevelTitles(plan);
    const nodes = buildExpeditionMapNodes(completedCount, {
      titles,
      totalLevels: titles.length || totalLevels,
    });
    const current = nodes.find((n) => n.status === 'current');
    if (current) return current.title;
    return titles[completedCount] ?? '下一关卡';
  }, [plan, completedCount, isAllCleared, totalLevels]);

  const planTitle = getPlanDisplayName(plan);
  const coverage = getPlanCoverageText(plan);
  const expectedMinutes = getPlanExpectedTotalMinutes(plan);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="w-full max-w-lg mx-auto"
    >
      <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#EEF4FF] via-[#F5F8FF] to-white border border-indigo-100/80 shadow-[0_20px_50px_rgba(99,102,241,0.12)]">
        {/* 顶部斜切横幅 */}
        <div className="relative h-11 overflow-hidden">
          <div
            className="absolute inset-0 bg-gradient-to-r from-[#C4B5FD] via-[#A5B4FC] to-[#7DD3FC] opacity-90"
            style={{ clipPath: 'polygon(0 0, 100% 0, 92% 100%, 0 100%)' }}
          />
          <p className="relative z-10 px-5 pt-2.5 text-[13px] font-bold text-white/95 tracking-wide">
            {isAllCleared
              ? '太棒了！本轮训练计划已全部完成。'
              : '学习不中断，接着完成你的训练计划吧！'}
          </p>
        </div>

        <div className="px-5 pt-4 pb-5">
          {/* 标题行 */}
          <div className="flex items-start justify-between gap-3 mb-1.5">
            <div className="flex items-center gap-1.5 min-w-0">
              <h2 className="text-lg font-black text-slate-800 truncate">{planTitle}</h2>
              <Sparkles size={18} className="shrink-0 text-violet-400 fill-violet-300" />
            </div>
            <span className="shrink-0 px-2.5 py-1 rounded-full bg-violet-100 text-violet-600 text-[11px] font-bold whitespace-nowrap">
              {isAllCleared ? '计划已完成' : '计划已开启'}
            </span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed mb-4">{coverage}</p>

          {/* 内层白卡片 */}
          <div className="rounded-2xl bg-white border border-slate-100/90 shadow-sm p-3.5 space-y-3.5">
            {/* 时长提示条 */}
            <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-[#FFF4E6] border border-orange-100/80">
              <div className="shrink-0 w-7 h-7 rounded-full bg-orange-100 flex items-center justify-center">
                <Lightbulb size={15} className="text-amber-500 fill-amber-400" />
              </div>
              <p className="text-xs font-bold text-slate-600 leading-snug">
                当前训练时长为
                <span className="text-slate-800">{plan.duration} 周</span>
                ，预计总时长约
                <span className="text-slate-800">{expectedMinutes} 分钟</span>
              </p>
            </div>

            {/* 进度条 */}
            <div className="flex items-center gap-3">
              <div className="flex-1 relative h-8 flex items-center">
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0 border-t-2 border-dashed border-violet-200 rounded-full" />
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-1 rounded-full bg-gradient-to-r from-violet-500 to-indigo-500"
                  style={{ width: `${progressPct}%` }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10"
                  style={{ left: `${progressPct}%` }}
                >
                  <div className="w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center shadow-md shadow-violet-500/30">
                    <Flag size={12} className="text-white fill-white" />
                  </div>
                </div>
              </div>
              <span className="shrink-0 text-sm font-black text-slate-700 tabular-nums">
                <span className="text-violet-600">{Math.min(completedCount, totalLevels)}</span>/{totalLevels}关卡
              </span>
            </div>

            <p className="text-center text-sm font-bold text-violet-500/90">
              {isAllCleared ? '已全部通关' : `下一关：${nextLevelTitle}`}
            </p>
          </div>

          {/* 操作按钮：全部通关后仅保留「查看学习路径」 */}
          <div className="flex gap-3 mt-5">
            <button
              type="button"
              onClick={onViewPath}
              className={`py-3.5 rounded-2xl bg-violet-100 text-violet-700 text-sm font-black hover:bg-violet-200/80 transition-colors ${
                isAllCleared ? 'w-full' : 'flex-1'
              }`}
            >
              查看学习路径
            </button>
            {!isAllCleared && (
              <button
                type="button"
                onClick={onContinue}
                className="flex-[1.15] py-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-sm font-black shadow-lg shadow-violet-500/30 hover:from-violet-500 hover:to-indigo-500 transition-all"
              >
                继续闯关
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
