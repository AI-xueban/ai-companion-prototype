import React from 'react';
import { BookOpen, ChevronRight, ClipboardList, Layers } from 'lucide-react';

export interface AssessmentScope {
  label: string;
  title: string;
}

interface SyncAssessmentCardProps {
  unitTest: AssessmentScope;
  selfTest: AssessmentScope;
  onUnitTest: () => void;
  onSelfTest: () => void;
  variant?: 'bar' | 'sidebar';
  hideUnitTest?: boolean;
  hideSelfTest?: boolean;
}

const ENTRIES = [
  {
    key: 'unit',
    name: '单元测试',
    Icon: Layers,
    tone: 'border-indigo-100 bg-indigo-50/80 text-indigo-900 hover:bg-indigo-100',
    accent: 'text-indigo-600',
  },
  {
    key: 'self',
    name: '自主测',
    Icon: BookOpen,
    tone: 'border-violet-100 bg-violet-50/80 text-violet-900 hover:bg-violet-100',
    accent: 'text-violet-600',
  },
] as const;

export const SyncAssessmentCard: React.FC<SyncAssessmentCardProps> = ({
  unitTest,
  selfTest,
  onUnitTest,
  onSelfTest,
  variant = 'bar',
  hideUnitTest = false,
  hideSelfTest = false,
}) => {
  const visibleEntries = ENTRIES.filter((entry) => {
    if (entry.key === 'unit' && hideUnitTest) return false;
    if (entry.key === 'self' && hideSelfTest) return false;
    return true;
  });
  const scopes = [unitTest, selfTest];
  const handlers = [onUnitTest, onSelfTest];

  if (visibleEntries.length === 0) return null;

  if (variant === 'sidebar') {
    return (
      <div className="relative flex h-full min-h-0 w-[120px] shrink-0 flex-col overflow-hidden rounded-2xl border border-indigo-100 bg-white/90 px-2 py-2.5 shadow-[0_8px_24px_rgba(99,102,241,0.06)]">
        <div className="flex shrink-0 items-center justify-center gap-1">
          <ClipboardList size={14} className="shrink-0 text-indigo-500" />
          <h2 className="text-[13px] font-semibold text-slate-900">同步测评</h2>
        </div>
        <div className={`mt-2 grid min-h-0 flex-1 gap-1 ${visibleEntries.length > 1 ? 'grid-rows-2' : 'grid-rows-1'}`}>
          {visibleEntries.map((entry) => {
            const index = ENTRIES.findIndex((item) => item.key === entry.key);
            const Icon = entry.Icon;
            return (
              <button
                key={entry.key}
                type="button"
                onClick={handlers[index]}
                className={`group flex min-h-0 flex-col items-center justify-center gap-0.5 rounded-xl border px-1 py-1.5 text-center transition ${entry.tone}`}
              >
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/80 ${entry.accent}`}>
                  <Icon size={13} />
                </span>
                <span className={`text-[11px] font-semibold leading-tight ${entry.accent}`}>
                  {entry.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="shrink-0 rounded-xl border border-indigo-100 bg-white/90 px-3 py-2 shadow-[0_4px_16px_rgba(99,102,241,0.05)]">
      <div className="mb-1.5 flex items-center gap-1.5">
        <ClipboardList size={14} className="shrink-0 text-indigo-500" />
        <span className="text-[13px] font-semibold text-slate-800">同步提高</span>
      </div>
      <div className={`grid gap-1.5 ${visibleEntries.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {visibleEntries.map((entry) => {
          const index = ENTRIES.findIndex((item) => item.key === entry.key);
          const scope = scopes[index];
          const Icon = entry.Icon;
          return (
            <button
              key={entry.key}
              type="button"
              onClick={handlers[index]}
              className={`group flex min-h-[44px] min-w-0 flex-col justify-center rounded-lg border px-2 py-1.5 text-left transition ${entry.tone}`}
            >
              <span className="flex w-full min-w-0 items-center gap-1">
                <Icon size={12} className={`shrink-0 ${entry.accent}`} />
                <span className="min-w-0 flex-1 truncate text-[12px] font-semibold">
                  <span className={`${entry.accent} font-bold`}>{scope.label}</span>
                  <span className="mx-0.5 font-normal opacity-40">·</span>
                  {entry.name}
                </span>
                <ChevronRight size={12} className="shrink-0 opacity-40 transition group-hover:translate-x-0.5" />
              </span>
              <span className="mt-0.5 w-full truncate pl-[16px] text-[10px] leading-4 text-slate-500">
                {scope.title}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
