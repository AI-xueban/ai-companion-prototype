import React from 'react';
import { Check, Loader2, Sparkles } from 'lucide-react';
import type { PaperTaskSnapshot } from './PaperTaskCard';

const steps = [
    { phase: 'understanding', label: '理解组卷要求' },
    { phase: 'composing', label: '生成题目' },
    { phase: 'checking', label: '检查题目' },
    { phase: 'assembling', label: '组成试卷' },
    { phase: 'validating', label: '校验整卷' },
] as const;

interface PaperAgentProgressProps {
    task: PaperTaskSnapshot;
}

export const PaperAgentProgress: React.FC<PaperAgentProgressProps> = ({ task }) => {
    const currentIndex = steps.findIndex((step) => step.phase === task.phase);

    return (
        <section className="w-full max-w-[520px] rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-[0_8px_24px_rgba(38,32,78,0.1)] sm:px-5" aria-label="小晤组卷进程" role="status" aria-live="polite">
            <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600"><Sparkles size={19} /></span>
                <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold leading-6 text-slate-900">小晤正在准备试卷</h3>
                    <p className="mt-0.5 text-xs leading-5 text-slate-500">{task.seed.title} · 目标 {task.seed.questionCount} 道题</p>
                </div>
            </div>
            <ol className="ml-5 mt-4 border-l border-slate-200 pl-7">
                {steps.map((step, index) => {
                    const done = index < currentIndex;
                    const active = index === currentIndex;
                    return (
                        <li key={step.phase} className={`relative pb-3 text-xs leading-5 last:pb-0 ${active ? 'font-semibold text-violet-700' : done ? 'text-slate-700' : 'text-slate-400'}`}>
                            <span className={`absolute -left-[36px] top-0 flex h-5 w-5 items-center justify-center rounded-full border ${done ? 'border-emerald-500 bg-emerald-500 text-white' : active ? 'border-violet-200 bg-violet-50 text-violet-600' : 'border-slate-200 bg-white'}`}>
                                {done ? <Check size={12} strokeWidth={2.5} /> : active ? <Loader2 size={12} className="animate-spin" /> : null}
                            </span>
                            {step.label}
                        </li>
                    );
                })}
            </ol>
            <p className="mt-3 border-t border-slate-100 pt-3 text-[11px] text-slate-400">完成后可查看全部题目，再决定保存或打印。</p>
        </section>
    );
};
