import React from 'react';
import { Check, Loader2 } from 'lucide-react';
import type { PaperTaskSnapshot } from './PaperTaskCard';

const steps = [
    { phase: 'understanding', label: '理解要求与规划试卷' },
    { phase: 'composing', label: '生成候选题目' },
    { phase: 'checking', label: '校验题目、答案与解析' },
    { phase: 'assembling', label: '用合格题组成试卷' },
    { phase: 'validating', label: '完成整卷校验' },
] as const;

interface PaperAgentProgressProps {
    task: PaperTaskSnapshot;
}

export const PaperAgentProgress: React.FC<PaperAgentProgressProps> = ({ task }) => {
    const currentStep = steps.find((step) => step.phase === task.phase);
    const completed = task.phaseStatus === 'completed';

    return (
        <section className="inline-flex max-w-full items-center gap-2.5 rounded-full border border-violet-100 bg-white/95 px-4 py-3 text-xs font-semibold text-violet-700 shadow-sm" aria-label="小晤组卷进程" role="status" aria-live="polite" aria-atomic="true">
            {completed ? <Check size={16} strokeWidth={2.5} className="shrink-0 text-emerald-600" aria-hidden="true" /> : <Loader2 size={16} className="shrink-0 animate-spin" aria-hidden="true" />}
            <span className="min-w-0 truncate">{currentStep?.label ?? '生成试卷'} · {completed ? '已完成' : '进行中'}</span>
        </section>
    );
};
