import React from 'react';
import { motion } from 'framer-motion';
import { StepBoardView } from '../../data/tutorTwoPhaseScript';
import { TutorCharacterTheme } from '../../data/tutorCharacterThemes';
import { normalizeTutorDisplayText } from '../../utils/tutorDisplayText';
import { StepOrderBadge } from './TutorStepOrderBadge';

export interface SkeletonOutlinePanelProps {
  steps: StepBoardView[];
  theme: TutorCharacterTheme;
  activeStepIndex?: number;
  /** guide=1对1左侧导航；full=展示完整骨架 */
  variant?: 'guide' | 'full';
  /** 点击切换当前讲解步骤 */
  onStepSelect?: (index: number) => void;
  className?: string;
}

export const SkeletonOutlinePanel: React.FC<SkeletonOutlinePanelProps> = ({
  steps,
  theme,
  activeStepIndex = -1,
  variant = 'full',
  onStepSelect,
  className = '',
}) => {
  const isGuide = variant === 'guide';

  return (
    <div
      className={`rounded-xl border overflow-hidden flex flex-col min-h-0 ${
        isGuide
          ? `bg-gradient-to-b from-white/95 to-amber-50/40 ${theme.cardBorder}`
          : `bg-white/90 ${theme.cardBorder}`
      } ${className}`}
    >
      <div className={`px-3 py-2.5 border-b ${theme.inputDivider} shrink-0 flex items-center justify-between gap-2`}>
        <p className="text-[11px] font-bold text-slate-700">思路骨架</p>
        {isGuide ? (
          <div className="flex items-center gap-0.5 w-[72px] shrink-0" aria-hidden>
            {steps.map((step, i) => (
              <div
                key={`sk-progress-${step.id}`}
                className={`h-0.5 flex-1 rounded-full transition-colors ${
                  step.status === 'done'
                    ? 'bg-emerald-400/80'
                    : i === activeStepIndex && activeStepIndex >= 0
                      ? 'bg-amber-400/80'
                      : 'bg-slate-200/80'
                }`}
              />
            ))}
          </div>
        ) : null}
      </div>

      <div className="relative flex-1 min-h-0">
        <div className="absolute inset-x-0 top-0 h-3 bg-gradient-to-b from-white/80 to-transparent pointer-events-none z-10" />
        <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-amber-50/90 to-transparent pointer-events-none z-10" />

        <div className="h-full min-h-0 overflow-y-auto custom-scrollbar px-2.5 py-2.5 space-y-2">
          {steps.map((step, i) => {
            const isActive = isGuide && i === activeStepIndex && activeStepIndex >= 0;
            const isDone = isGuide && step.status === 'done';
            const clickable = isGuide && onStepSelect != null;

            const skeletonText = normalizeTutorDisplayText(
              step.skeletonComplete || step.skeletonRevealed >= step.skeleton.length
                ? step.skeleton
                : step.skeleton.slice(0, step.skeletonRevealed),
            );

            const row = (
              <div className="flex items-start gap-2 min-w-0">
                <StepOrderBadge
                  number={i + 1}
                  state={isActive ? 'active' : isDone ? 'done' : 'pending'}
                  size="sm"
                />
                <div className="flex-1 min-w-0 pt-px">
                  <p className="text-[11px] font-bold text-slate-800 leading-snug tabular-nums lining-nums">
                    {normalizeTutorDisplayText(step.title)}
                  </p>
                  {(isGuide || step.skeletonRevealed > 0 || step.skeletonComplete) ? (
                    <p className="mt-1.5 text-[11px] text-slate-600 leading-relaxed tabular-nums lining-nums whitespace-pre-wrap">
                      {skeletonText}
                    </p>
                  ) : null}
                </div>
              </div>
            );

            return (
              <motion.div
                key={step.id}
                layout
                role={clickable ? 'button' : undefined}
                tabIndex={clickable ? 0 : undefined}
                onClick={clickable ? () => onStepSelect(i) : undefined}
                onKeyDown={
                  clickable
                    ? (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onStepSelect(i);
                        }
                      }
                    : undefined
                }
                className={`rounded-lg px-2.5 py-2 transition-colors ${
                  isActive
                    ? 'bg-amber-50/80 ring-1 ring-amber-200/60'
                    : ''
                } ${clickable ? 'cursor-pointer hover:bg-amber-50/40 interactive-control' : ''}`}
              >
                {row}
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
