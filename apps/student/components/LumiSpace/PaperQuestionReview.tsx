import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Printer, Save, Square, SquareCheck, Eye, EyeOff, Loader2 } from 'lucide-react';
import type { PaperDraftSeed } from './PaperDraftWorkspace';
import type { PaperPdfQuestion } from './lumiPaperPdf';

export interface PaperQuestionReviewTask {
    seed: PaperDraftSeed;
    questions: PaperPdfQuestion[];
    runId: string;
    selectedQuestionIds?: number[];
}

export type PaperPdfProgressStage = 'preparing' | 'rendering' | 'checking';

interface PaperQuestionReviewProps {
    task: PaperQuestionReviewTask;
    onClose: () => void;
    onContinueChat: () => void;
    onSelectionChange: (questionIds: number[]) => void;
    onExport: (questions: PaperPdfQuestion[], mode: 'save' | 'print', onProgress: (stage: PaperPdfProgressStage) => void) => Promise<string | undefined>;
}

export const PaperQuestionReview: React.FC<PaperQuestionReviewProps> = ({ task, onClose, onContinueChat, onSelectionChange, onExport }) => {
    const [showAnswers, setShowAnswers] = useState(false);
    const [busy, setBusy] = useState(false);
    const [pdfStage, setPdfStage] = useState<PaperPdfProgressStage | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [retryMode, setRetryMode] = useState<'save' | 'print'>('save');

    useEffect(() => {
        setShowAnswers(false);
        setError(null);
        setPdfStage(null);
    }, [task.runId]);

    const selectedIds = useMemo(
        () => new Set(task.selectedQuestionIds ?? task.questions.map((question) => question.id)),
        [task.selectedQuestionIds, task.questions],
    );
    const selectedQuestions = useMemo(
        () => task.questions.filter((question) => selectedIds.has(question.id)),
        [task.questions, selectedIds],
    );
    const allSelected = selectedQuestions.length === task.questions.length;

    const toggleQuestion = (id: number) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        onSelectionChange(task.questions.filter((question) => next.has(question.id)).map((question) => question.id));
    };

    const exportSelection = async (mode: 'save' | 'print') => {
        if (!selectedQuestions.length || busy) return;
        setBusy(true);
        setError(null);
        setPdfStage('preparing');
        setRetryMode(mode);
        try {
            await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
            const message = await onExport(selectedQuestions, mode, setPdfStage);
            if (message) setError(message);
        } catch {
            setError('文件生成失败，题目仍已保留。请重试，或返回聊天继续修改。');
        } finally {
            setBusy(false);
            setPdfStage(null);
        }
    };

    return (
        <div className="fixed inset-0 z-[490] flex flex-col bg-slate-50 text-slate-800" aria-label="试卷题目查看">
            <header className="flex shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
                <button type="button" onClick={onClose} className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100">
                    <ArrowLeft size={17} /> 返回聊天
                </button>
                <div className="min-w-0 flex-1">
                    <h1 className="truncate text-sm font-bold text-slate-900 sm:text-base">{task.seed.title}</h1>
                    <p className="mt-0.5 text-xs text-slate-500">V{task.seed.version} · {task.questions.length} 道题 · {task.seed.duration} · 题目已生成</p>
                </div>
                <button type="button" onClick={onContinueChat} className="hidden shrink-0 rounded-xl border border-violet-200 px-3 py-2 text-xs font-bold text-violet-700 transition-colors hover:bg-violet-50 sm:inline-flex">
                    继续和小晤聊天修改
                </button>
            </header>

            <main className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-6 sm:py-6">
                <div className="mx-auto max-w-4xl">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-violet-100 bg-white px-4 py-3 shadow-sm">
                        <p className="text-sm font-semibold text-slate-700">选择要保存或打印的题目 <span className="ml-1 text-xs font-medium text-slate-400">已选 {selectedQuestions.length}/{task.questions.length}</span></p>
                        <div className="flex items-center gap-3">
                            {task.seed.withAnswers ? (
                                <button type="button" onClick={() => setShowAnswers((value) => !value)} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-50">
                                    {showAnswers ? <EyeOff size={14} /> : <Eye size={14} />}{showAnswers ? '隐藏答案解析' : '查看答案解析'}
                                </button>
                            ) : null}
                            <button type="button" onClick={() => onSelectionChange(allSelected ? [] : task.questions.map((question) => question.id))} disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-50 disabled:opacity-50">
                                {allSelected ? <Square size={14} /> : <SquareCheck size={14} />}{allSelected ? '取消全选' : '全选'}
                            </button>
                        </div>
                    </div>

                    {busy && pdfStage ? (
                        <div className="mb-3 rounded-2xl border border-violet-100 bg-white px-4 py-4 shadow-sm" role="status" aria-live="polite">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-2 text-sm font-bold text-slate-800"><Loader2 size={16} className="animate-spin text-violet-600" />正在生成 PDF</div>
                                <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">预计约 {Math.max(1, Math.ceil(selectedQuestions.length / 10))}–{Math.max(1, Math.ceil(selectedQuestions.length / 10)) + 2} 分钟</span>
                            </div>
                            <p className="mt-1.5 text-xs leading-5 text-slate-500">正在处理已选的 {selectedQuestions.length} 道题，完成后会显示{retryMode === 'save' ? '保存结果' : '打印预览'}。时间为预估，实际以完成状态为准。</p>
                            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
                                <span className={pdfStage === 'preparing' ? 'font-semibold text-violet-700' : ''}>① 整理选中题目</span>
                                <span className={pdfStage === 'rendering' ? 'font-semibold text-violet-700' : ''}>② A4 排版</span>
                                <span className={pdfStage === 'checking' ? 'font-semibold text-violet-700' : ''}>③ 检查文件</span>
                            </div>
                        </div>
                    ) : null}

                    {error ? (
                        <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700" role="alert">
                            <span>{error}</span>
                            <button type="button" onClick={() => void exportSelection(retryMode)} disabled={busy} className="shrink-0 rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-60">{retryMode === 'save' ? '重试保存' : '重试打印'}</button>
                        </div>
                    ) : null}

                    <ol className="space-y-3">
                        {task.questions.map((question, index) => {
                            const selected = selectedIds.has(question.id);
                            return (
                                <li key={`${task.runId}-${question.id}`}>
                                    <label className={`flex cursor-pointer gap-3 rounded-2xl border bg-white p-4 shadow-sm transition-colors sm:p-5 ${selected ? 'border-violet-200' : 'border-slate-200 opacity-70'}`}>
                                        <input type="checkbox" checked={selected} onChange={() => toggleQuestion(question.id)} disabled={busy} className="mt-1 h-4 w-4 shrink-0 accent-violet-600 disabled:opacity-50" aria-label={`选择第${index + 1}题`} />
                                        <span className="min-w-0 flex-1">
                                            <span className="mb-2 flex flex-wrap items-center gap-2">
                                                <span className="flex h-6 min-w-6 items-center justify-center rounded-lg bg-violet-50 px-1.5 text-xs font-bold text-violet-700">{index + 1}</span>
                                                <span className="text-xs font-semibold text-slate-500">{question.type}</span>
                                                <span className="text-xs text-slate-400">{question.score} 分</span>
                                            </span>
                                            <span className="block whitespace-pre-wrap text-sm leading-7 text-slate-800">{question.stem}</span>
                                            {showAnswers && task.seed.withAnswers ? (
                                                <span className="mt-3 block rounded-xl bg-slate-50 px-3 py-2.5 text-xs leading-6 text-slate-600">
                                                    <strong className="text-slate-700">答案：{question.answer}</strong><br />解析：{question.explanation}
                                                </span>
                                            ) : null}
                                        </span>
                                    </label>
                                </li>
                            );
                        })}
                    </ol>
                </div>
            </main>

            <footer className="flex shrink-0 flex-col gap-2 border-t border-slate-200 bg-white px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <button type="button" onClick={onContinueChat} className="rounded-xl px-3 py-2.5 text-sm font-semibold text-violet-700 transition-colors hover:bg-violet-50 sm:hidden">
                    继续和小晤聊天修改
                </button>
                <p className="hidden text-xs text-slate-400 sm:block">确认题目后，再保存为 PDF 或打印。</p>
                <div className="flex items-center justify-end gap-2">
                    <button type="button" onClick={() => void exportSelection('save')} disabled={!selectedQuestions.length || busy} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-violet-200 px-4 py-2.5 text-xs font-bold text-violet-700 transition-colors hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-50">
                        {busy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}保存为 PDF
                    </button>
                    <button type="button" onClick={() => void exportSelection('print')} disabled={!selectedQuestions.length || busy} className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50">
                        {busy ? <Loader2 size={14} className="animate-spin" /> : <Printer size={14} />}打印
                    </button>
                </div>
            </footer>
        </div>
    );
};
