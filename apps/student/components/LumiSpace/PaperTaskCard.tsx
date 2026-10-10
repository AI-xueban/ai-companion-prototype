import React from 'react';
import { ChevronRight, FileText, Loader2 } from 'lucide-react';
import type { PaperDraftSeed } from './PaperDraftWorkspace';
import type { PaperPdfQuestion } from './lumiPaperPdf';

export interface PaperTaskSnapshot {
    seed: PaperDraftSeed;
    questions: PaperPdfQuestion[];
    phase: 'understanding' | 'composing' | 'checking' | 'assembling' | 'validating' | 'pdf' | 'ready' | 'draft' | 'error';
    runId: string;
    selectedQuestionIds?: number[];
    error?: string;
    simulateExportFailure?: boolean;
    exportFailureConsumed?: boolean;
}

interface PaperTaskCardProps {
    task: PaperTaskSnapshot;
    onRetryGeneration: () => void;
    onOpenQuestions: () => void;
}

export const PaperTaskCard: React.FC<PaperTaskCardProps> = ({ task, onRetryGeneration, onOpenQuestions }) => {
    const busy = task.phase === 'understanding' || task.phase === 'composing' || task.phase === 'checking' || task.phase === 'assembling' || task.phase === 'validating' || task.phase === 'pdf';

    return (
        <section className="w-full max-w-[520px] rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(38,32,78,0.1)]" aria-label={`试卷题目：${task.seed.title}`}>
            <button type="button" onClick={task.phase === 'error' ? onRetryGeneration : onOpenQuestions} disabled={busy} className="flex w-full items-start gap-3 rounded-2xl p-4 text-left transition-colors hover:bg-violet-50/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 disabled:cursor-default disabled:hover:bg-white sm:items-center sm:gap-3.5 sm:px-5 sm:py-4">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${task.phase === 'error' ? 'bg-rose-50 text-rose-600' : 'bg-violet-50 text-violet-600'}`}>
                    <FileText size={21} strokeWidth={1.9} />
                </span>

                <span className="min-w-0 flex-1">
                    <span className="block break-words text-[15px] font-bold leading-6 text-slate-900">{task.seed.title}</span>
                    <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs leading-5 text-slate-500">
                        <span>{task.questions.length} 道题</span>
                        <span className="text-slate-300" aria-hidden="true">·</span>
                        <span>{task.seed.duration}</span>
                        {task.seed.assumedTextbook ? <span className="basis-full text-[11px] text-slate-400">教材暂按{task.seed.assumedTextbook}</span> : null}
                    </span>
                    {task.phase === 'error' || busy ? (
                        <span className={`mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium ${task.phase === 'error' ? 'text-rose-600' : 'text-sky-600'}`} role="status" aria-live="polite">
                            {busy ? <Loader2 size={12} className="animate-spin" /> : null}
                            {task.phase === 'error' ? task.error ?? '题目生成失败，可以重试' : task.error ?? '正在生成题目…'}
                        </span>
                    ) : null}
                </span>

                {task.phase === 'error' ? (
                    <span className="shrink-0 self-center rounded-xl bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-700">重试</span>
                ) : busy ? null : (
                    <span className="inline-flex shrink-0 self-center items-center gap-0.5 text-xs font-semibold text-violet-700">
                        <span className="sm:hidden">查看</span><span className="hidden sm:inline">查看题目</span>
                        <ChevronRight size={16} />
                    </span>
                )}
            </button>
        </section>
    );
};
