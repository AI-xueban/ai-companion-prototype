import React from 'react';
import { Star } from 'lucide-react';

export const DIFFICULTY_BADGE: Record<number, string> = {
  1: '容易',
  2: '较易',
  3: '适中',
  4: '较难',
  5: '困难',
};

export const getDifficultyColor = (level: number) => {
  if (level <= 1) return 'bg-emerald-50 text-emerald-600 border-emerald-100';
  if (level <= 3) return 'bg-amber-50 text-amber-600 border-amber-100';
  return 'bg-rose-50 text-rose-600 border-rose-100';
};

export const DifficultyStars: React.FC<{ level?: number; size?: number; className?: string }> = ({
  level = 2,
  size = 14,
  className,
}) => {
  const filledCount = Math.min(5, Math.max(1, Number(level) || 2));
  return (
    <div
      className={['flex items-center gap-0.5', className].filter(Boolean).join(' ')}
      aria-label={`难度 ${DIFFICULTY_BADGE[filledCount] ?? filledCount}`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          className={i < filledCount ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}
        />
      ))}
    </div>
  );
};

interface QuestionBadgesProps {
  typeLabel?: string;
  difficulty?: number;
  category?: string;
  categoryLabel?: string;
  knowledgePoints?: string[];
  maxKnowledgeBadges?: number;
  className?: string;
  typeClassName?: string;
  difficultyClassName?: string;
  categoryClassName?: string;
  knowledgeClassName?: string;
  showDifficultyStars?: boolean;
}

const getDefaultCategoryLabel = (category?: string) => {
  if (!category) return undefined;
  if (category === 'textbook') return '课本原题';
  if (category === 'synchronous') return '同步题';
  if (category === 'finale') return '压轴题';
  if (category === 'typical') return '经典例题';
  return '经典例题';
};

export const QuestionBadges: React.FC<QuestionBadgesProps> = ({
  typeLabel,
  difficulty,
  category,
  categoryLabel,
  knowledgePoints = [],
  maxKnowledgeBadges = 1,
  className,
  typeClassName,
  difficultyClassName,
  categoryClassName,
  knowledgeClassName,
  showDifficultyStars = true,
}) => {
  const containerClassName = ['flex items-center gap-2 flex-wrap', className]
    .filter(Boolean)
    .join(' ');

  const knowledgeList = knowledgePoints.slice(0, Math.max(maxKnowledgeBadges, 0));
  const resolvedCategoryLabel = categoryLabel ?? getDefaultCategoryLabel(category);

  return (
    <div className={containerClassName}>
      {typeLabel && (
        <span
          className={
            typeClassName ??
            'px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100 text-[11px] font-bold'
          }
        >
          {typeLabel}
        </span>
      )}

      {typeof difficulty !== 'undefined' && (
        <span
          className={
            difficultyClassName ??
            `px-2.5 py-1 rounded-full border text-[11px] font-bold ${getDifficultyColor(difficulty)}`
          }
        >
          {DIFFICULTY_BADGE[difficulty] ?? difficulty}
        </span>
      )}

      {showDifficultyStars && typeof difficulty !== 'undefined' && (
        <DifficultyStars level={difficulty} />
      )}

      {resolvedCategoryLabel && (
        <span
          className={
            categoryClassName ??
            'px-2.5 py-1 rounded-full bg-slate-50 text-slate-500 border border-slate-100 text-[11px] font-bold'
          }
        >
          {resolvedCategoryLabel}
        </span>
      )}

      {knowledgeList.map((kp) => (
        <span
          key={kp}
          className={
            knowledgeClassName ??
            'px-2.5 py-1 rounded-full bg-purple-50 text-purple-600 border border-purple-100 text-[11px] font-bold'
          }
        >
          {kp}
        </span>
      ))}
    </div>
  );
};
