import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Zap, Star } from 'lucide-react';
import { ExpeditionPlan } from '../../types';
import { getPlanDisplayName } from './expeditionPlanConfig';

interface DynamicCapsuleProps {
  plan: ExpeditionPlan;
  /** 与首页胶囊共享 layout 动画；路径页应关闭，避免盖住顶栏按钮 */
  sharedLayout?: boolean;
  className?: string;
  /** 已通关关卡数 */
  completedLevels?: number;
  /** 计划实际已消耗天数（days 环中心数字） */
  elapsedDays?: number;
  /** 累计经验 XP */
  xp?: number;
  /** 累计金币 */
  coins?: number;
}

export const DynamicExpeditionCapsule: React.FC<DynamicCapsuleProps> = ({
  plan,
  sharedLayout = true,
  className = '',
  completedLevels = 0,
  elapsedDays,
  xp = 80,
  coins = 50,
}) => {
  const planTitle = getPlanDisplayName(plan).replace('计划', '');

  // 关卡数 = 周期天数（7 天 → 7 关）；进度与下方路线通关数同步
  const totalLevels = Math.max(1, plan.duration * 7);
  const cleared = Math.min(Math.max(0, completedLevels), totalLevels);
  const progressPct = Math.min(100, Math.round((cleared / totalLevels) * 100));

  // 实际完成天数：默认与已通关关卡一致（一天一关）
  const doneDays = Math.min(
    totalLevels,
    Math.max(0, elapsedDays ?? cleared)
  );

  // 截止时间动态计算：卡住不前进的天数会顺延截止日
  // 落后天数 = 实际消耗天数 - 已通关关卡数（每天预期通 1 关）
  const delayDays = Math.max(0, doneDays - cleared);
  const deadlineDays = totalLevels + delayDays;

  const start = new Date(plan.startDate);
  const deadline = new Date(start);
  deadline.setDate(start.getDate() + deadlineDays);
  const deadlineText = Number.isNaN(deadline.getTime())
    ? '—'
    : `${deadline.getMonth() + 1}月${deadline.getDate()}号 23:59`;

  // days 环：按实际完成天数 / 总天数推进
  const ringCircumference = 2 * Math.PI * 24;
  const ringPct = Math.min(1, doneDays / totalLevels);

  return (
    <motion.div
      layoutId={sharedLayout ? 'top-capsule' : undefined}
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`relative z-50 w-full max-w-md ${className}`}
    >
      <div className="relative overflow-hidden bg-white rounded-3xl border border-slate-100 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
        <div className="relative flex flex-col gap-2 p-3 min-w-0">
          {/* Row 1: 标题 + 进度 + days 环 */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="truncate font-black text-sm sm:text-[15px] bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
                  {planTitle}
                </span>
                <Sparkles size={15} className="shrink-0 text-violet-400 fill-violet-300" />
              </div>

              <div className="flex items-center gap-2 min-w-0">
                <div className="flex-1 min-w-0 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-400"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </div>
                <span className="text-[10px] sm:text-xs font-bold text-slate-400 shrink-0 whitespace-nowrap">
                  <span className="text-slate-700">{cleared}</span>/{totalLevels}关卡
                </span>
              </div>
            </div>

            <div className="shrink-0 relative w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="24" fill="none" stroke="#F1F5F9" strokeWidth="5" />
                <motion.circle
                  cx="28" cy="28" r="24" fill="none" stroke="#FB923C" strokeWidth="5"
                  strokeDasharray={ringCircumference}
                  strokeLinecap="round"
                  initial={{ strokeDashoffset: ringCircumference }}
                  animate={{ strokeDashoffset: ringCircumference * (1 - ringPct) }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                />
              </svg>
              <div className="flex flex-col items-center leading-none">
                <span className="text-base sm:text-lg font-black text-slate-700">{doneDays}</span>
                <span className="text-[8px] font-bold text-slate-400 lowercase">days</span>
              </div>
            </div>
          </div>

          {/* Row 2: 截止时间 + 累计奖励 */}
          <div className="flex items-center justify-between gap-2 min-w-0 pt-0.5 border-t border-slate-50">
            <div className="text-[10px] sm:text-[11px] font-medium text-slate-400 truncate min-w-0">
              截止时间：{deadlineText}
            </div>
            <div className="shrink-0 flex items-center gap-2 sm:gap-3">
              <span className="flex items-center gap-0.5 text-xs sm:text-sm font-black text-slate-700">
                <Zap size={14} className="text-amber-400 fill-amber-400 shrink-0" />
                {xp}
              </span>
              <span className="flex items-center gap-0.5 text-xs sm:text-sm font-black text-slate-700">
                <span className="w-4 h-4 rounded-full bg-gradient-to-br from-amber-300 to-yellow-500 flex items-center justify-center shadow-sm shrink-0">
                  <Star size={9} className="text-white fill-white" />
                </span>
                {coins}
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
