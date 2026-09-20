import React from 'react';
import { StepBoardView } from '../../data/tutorTwoPhaseScript';

export type StepVisualState = 'active' | 'done' | 'pending';

export function getStepNumber(stepId: string, steps: StepBoardView[]): number {
  const idx = steps.findIndex((s) => s.id === stepId);
  return idx >= 0 ? idx + 1 : 1;
}

export function StepOrderBadge({
  number,
  state,
  size = 'md',
}: {
  number: number;
  state: StepVisualState;
  size?: 'sm' | 'md';
}) {
  const styles: Record<StepVisualState, string> = {
    active: 'bg-amber-500 text-white ring-2 ring-amber-200/80 shadow-sm',
    done: 'bg-emerald-500 text-white ring-1 ring-emerald-200/70',
    pending: 'bg-slate-200/90 text-slate-500',
  };

  const sizeClass = size === 'sm' ? 'w-4 h-4 text-[9px]' : 'w-[18px] h-[18px] text-[10px]';

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-black tabular-nums leading-none shrink-0 ${sizeClass} ${styles[state]}`}
      aria-label={`第${number}步`}
      title={`第${number}步`}
    >
      {number}
    </span>
  );
}
