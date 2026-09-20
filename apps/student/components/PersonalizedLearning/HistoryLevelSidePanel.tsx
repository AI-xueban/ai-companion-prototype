import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Star, Lock, Trophy, CirclePlay } from 'lucide-react';
import { ExpeditionPlanHistoryRecord } from '../../types';
import { getKnowledgeTitlesForHistory } from './expeditionPlanHistory';
import { buildHistoryLevelQuizResult } from './expeditionHistoryQuizResult';
import { Annotatable } from '../Prototype/Annotatable';

/** 关卡难度五档 */
export const LEVEL_DIFFICULTIES = ['易', '较易', '中等', '较难', '难'] as const;
export type LevelDifficulty = (typeof LEVEL_DIFFICULTIES)[number];

const LEVEL_DIFFICULTY_STYLE: Record<LevelDifficulty, string> = {
  易: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  较易: 'bg-lime-50 text-lime-700 border-lime-100',
  中等: 'bg-amber-50 text-amber-700 border-amber-100',
  较难: 'bg-orange-50 text-orange-700 border-orange-100',
  难: 'bg-rose-50 text-rose-600 border-rose-100',
};

/** 按关卡位置递进分配难度；BOSS 关固定为「难」 */
export function getLevelDifficulty(
  levelIndex: number,
  totalLevels: number,
  isBoss = false
): LevelDifficulty {
  if (isBoss) return '难';
  if (totalLevels <= 1) return '中等';
  const tier = Math.round((levelIndex / Math.max(totalLevels - 1, 1)) * 4);
  return LEVEL_DIFFICULTIES[Math.min(4, Math.max(0, tier))];
}

interface HistoryLevelPanelProps {
  record: ExpeditionPlanHistoryRecord;
  onReviewLevel: (levelIndex: number, levelTitle: string) => void;
  onWatchLevelVideo: (levelIndex: number, levelTitle: string) => void;
}

export const HistoryLevelPanel: React.FC<HistoryLevelPanelProps> = ({
  record,
  onReviewLevel,
  onWatchLevelVideo,
}) => {
  const levelTitles = getKnowledgeTitlesForHistory(record);
  const completedCount =
    record.status === 'completed' ? record.levelCount : (record.completedLevels ?? 0);

  return (
    <div className="h-full flex flex-col bg-[#F5F7FA]/60">
      <div className="shrink-0 px-5 pt-4 pb-3 border-b border-slate-200/50">
        <h2 className="text-sm font-black text-slate-800 truncate">{record.planName}</h2>
        <p className="text-[11px] text-slate-400 font-medium mt-0.5">{record.subject}</p>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-3">
        <p className="text-xs font-bold text-slate-400 px-1 mb-3">
          已通关关卡可观看微课视频，或回顾做题结果
        </p>

        <Annotatable annotationId="subject.expedition-history" className="space-y-2.5">
          {levelTitles.map((title, index) => {
            const cleared = index < completedCount;
            const isBoss = index === record.levelCount - 1;
            const preview = cleared ? buildHistoryLevelQuizResult(record, index, title) : null;

            return (
              <LevelReviewCard
                key={`${record.id}-${index}`}
                index={index}
                title={title}
                cleared={cleared}
                isBoss={isBoss}
                difficulty={getLevelDifficulty(index, record.levelCount, isBoss)}
                score={preview?.score}
                onReview={() => onReviewLevel(index, title)}
                onWatchVideo={() => onWatchLevelVideo(index, title)}
              />
            );
          })}
        </Annotatable>
      </div>
    </div>
  );
};

const LevelReviewCard: React.FC<{
  index: number;
  title: string;
  cleared: boolean;
  isBoss: boolean;
  difficulty: LevelDifficulty;
  score?: number;
  onReview: () => void;
  onWatchVideo: () => void;
}> = ({ index, title, cleared, isBoss, difficulty, score, onReview, onWatchVideo }) => {
  const difficultyBadge = (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-1.5 py-0.5 text-[10px] font-black leading-none ${LEVEL_DIFFICULTY_STYLE[difficulty]}`}
    >
      {difficulty}
    </span>
  );

  if (!cleared) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-[20px] bg-slate-50/80 border border-slate-100 opacity-60">
        <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center shrink-0">
          <Lock size={16} className="text-slate-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <p className="text-sm font-bold text-slate-400 truncate min-w-0 flex-1">
              第 {index + 1} 关 · {title}
            </p>
            {difficultyBadge}
          </div>
          <p className="text-[11px] text-slate-300 mt-0.5">未通关</p>
        </div>
      </div>
    );
  }

  const starCount = score !== undefined ? (score >= 90 ? 3 : score >= 70 ? 2 : score >= 50 ? 1 : 0) : 0;

  return (
    <motion.div
      whileTap={{ scale: 0.99 }}
      className="w-full flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-[20px] bg-white border border-slate-200/60 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all"
    >
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
          isBoss
            ? 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white'
            : 'bg-indigo-50 text-indigo-600'
        }`}
      >
        {isBoss ? <Trophy size={18} /> : <span className="text-sm font-black">{index + 1}</span>}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <p className="text-sm font-black text-slate-800 truncate min-w-0 flex-1">{title}</p>
          {difficultyBadge}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3].map((s) => (
              <Star
                key={s}
                size={11}
                className={
                  s <= starCount ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                }
              />
            ))}
          </div>
          {score !== undefined && (
            <span className="text-[11px] font-bold text-indigo-600">{score}%</span>
          )}
        </div>
      </div>
      <div className="flex flex-row gap-1.5 shrink-0 w-full sm:w-auto">
        <button
          type="button"
          onClick={onWatchVideo}
          className="flex-1 sm:flex-none flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-600 text-white text-[11px] font-bold hover:bg-indigo-500 transition-colors whitespace-nowrap"
        >
          <CirclePlay size={13} className="shrink-0" />
          看视频
        </button>
        <button
          type="button"
          onClick={onReview}
          className="flex-1 sm:flex-none flex items-center justify-center gap-0.5 px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-indigo-600 text-[11px] font-bold hover:bg-indigo-50 transition-colors whitespace-nowrap"
        >
          回顾
          <ChevronRight size={13} className="shrink-0" />
        </button>
      </div>
    </motion.div>
  );
};
