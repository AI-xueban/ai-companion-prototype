import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Printer, Save, RotateCcw, Square, SquareCheck, Eye, EyeOff, Loader2, X, Wifi, WifiOff, Check } from 'lucide-react';
import { PAPER_CONTENT_LABELS, type PaperContentMode } from '../../services/printedFileService';
import type { PaperDraftSeed } from './PaperDraftWorkspace';
import type { PaperPdfQuestion } from './lumiPaperPdf';
import { MyPrintedFilesPage } from '../Growth/MyPrintedFilesPage';
import { PdfCapacityDialog } from '../Growth/PdfCapacityDialog';

export interface PaperQuestionReviewTask {
    seed: PaperDraftSeed;
    questions: PaperPdfQuestion[];
    runId: string;
    selectedQuestionIds?: number[];
    simulateExportFailure?: boolean;
}

export type PaperPdfProgressStage = 'preparing' | 'rendering' | 'checking';
export type PaperPdfFailureDemo = 'timeout' | 'validation' | 'storage_full' | 'write_failed' | 'network_failed' | 'network_disconnected' | 'file_too_large' | 'file_count_limit';
export interface PaperPdfExportFailure {
    code: 'STORAGE_FULL' | 'FILE_TOO_LARGE' | 'FILE_COUNT_LIMIT';
    message: string;
}

interface PaperQuestionReviewProps {
    task: PaperQuestionReviewTask;
    onContinueChat: () => void;
    onSelectionChange: (questionIds: number[]) => void;
    onResetFailureDemo?: () => void;
    onExport: (questions: PaperPdfQuestion[], mode: 'save' | 'print', onProgress: (stage: PaperPdfProgressStage) => void, contentMode: PaperContentMode, failureDemo?: PaperPdfFailureDemo) => Promise<string | PaperPdfExportFailure | undefined>;
}

export const PaperQuestionReview: React.FC<PaperQuestionReviewProps> = ({ task, onContinueChat, onSelectionChange, onResetFailureDemo, onExport }) => {
    const [showAnswers, setShowAnswers] = useState(false);
    const [busy, setBusy] = useState(false);
    const [pdfStage, setPdfStage] = useState<PaperPdfProgressStage | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [retryMode, setRetryMode] = useState<'save' | 'print'>('save');
    const [printDialogOpen, setPrintDialogOpen] = useState(false);
    const [contentMode, setContentMode] = useState<PaperContentMode>(task.seed.withAnswers ? 'paper_answer_analysis' : 'paper_only');
    const [failureDialogOpen, setFailureDialogOpen] = useState(false);
    const [storageFull, setStorageFull] = useState(false);
    const [fileCountLimit, setFileCountLimit] = useState(false);
    const [capacityDemoOpen, setCapacityDemoOpen] = useState(false);
    const [filesOpen, setFilesOpen] = useState(false);
    const [networkPageOpen, setNetworkPageOpen] = useState(false);
    const [selectedNetwork, setSelectedNetwork] = useState('AI-Classroom');
    const [failureDemo, setFailureDemo] = useState<PaperPdfFailureDemo>('timeout');

    useEffect(() => {
        setShowAnswers(false);
        setError(null);
        setPdfStage(null);
        setPrintDialogOpen(false);
        setContentMode(task.seed.withAnswers ? 'paper_answer_analysis' : 'paper_only');
        setFailureDialogOpen(false);
        setStorageFull(false);
        setFileCountLimit(false);
        setCapacityDemoOpen(false);
        setFilesOpen(false);
        setNetworkPageOpen(false);
        setSelectedNetwork('AI-Classroom');
        setFailureDemo('timeout');
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
    const saveFailed = Boolean(error) && retryMode === 'save';
    const printFailed = Boolean(error) && retryMode === 'print';

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
        setFailureDialogOpen(false);
        setStorageFull(false);
        setFileCountLimit(false);
        setPdfStage('preparing');
        setRetryMode(mode);
        try {
            await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
            const failure = await onExport(selectedQuestions, mode, setPdfStage, contentMode, task.simulateExportFailure ? failureDemo : undefined);
            if (failure) {
                setError(typeof failure === 'string' ? failure : failure.message);
                setStorageFull(typeof failure !== 'string' && failure.code === 'STORAGE_FULL');
                setFileCountLimit(typeof failure !== 'string' && failure.code === 'FILE_COUNT_LIMIT');
                setFailureDialogOpen(true);
            }
        } catch {
            setError('失败原因：文件处理发生异常，暂时无法完成导出。题目和选择已保留，请使用底部按钮重试。');
            setFailureDialogOpen(true);
        } finally {
            setBusy(false);
            setPdfStage(null);
        }
    };

    return (
        <div className="fixed inset-0 z-[490] flex flex-col bg-slate-50 text-slate-800" aria-label="试卷题目查看">
            <header className="flex shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
                <button type="button" onClick={onContinueChat} aria-label="返回" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-800 transition-colors hover:bg-slate-200">
                    <ArrowLeft size={20} />
                </button>
                <div className="min-w-0 flex-1">
                    <h1 className="truncate text-sm font-bold text-slate-900 sm:text-base">{task.seed.title}</h1>
                    <p className="mt-0.5 text-xs text-slate-500">{task.questions.length} 道题 · {task.seed.duration}</p>
                </div>
                {task.seed.withAnswers ? (
                    <button type="button" onClick={() => setShowAnswers((value) => !value)} aria-pressed={showAnswers} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2.5 text-xs font-semibold text-violet-700 transition-colors hover:bg-violet-50">
                        {showAnswers ? <EyeOff size={14} /> : <Eye size={14} />}{showAnswers ? '隐藏答案解析' : '查看答案解析'}
                    </button>
                ) : null}
            </header>

            <main className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-6 sm:py-6">
                <div className="mx-auto max-w-4xl">
                    {task.simulateExportFailure ? (
                        <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                            <div className="flex flex-wrap items-center gap-3">
                                <label className="flex items-center gap-2 text-xs font-semibold text-amber-900">保存失败演示
                                    <select aria-label="保存失败演示原因" value={failureDemo} disabled={busy} onChange={(event) => {
                                        setFailureDemo(event.target.value as PaperPdfFailureDemo);
                                        setError(null); setStorageFull(false); setFileCountLimit(false); setFailureDialogOpen(false);
                                        onResetFailureDemo?.();
                                    }} className="rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs text-slate-700 disabled:opacity-50">
                                        <option value="timeout">PDF 生成超时</option>
                                        <option value="validation">PDF 文件校验失败</option>
                                        <option value="storage_full">存储空间不足</option>
                                        <option value="write_failed">文件写入失败</option>
                                        <option value="network_failed">网络连接失败</option>
                                        <option value="network_disconnected">设备断网</option>
                                        <option value="file_too_large">PDF 文件过大</option>
                                        <option value="file_count_limit">超过 100 份上限</option>
                                    </select>
                                </label>
                                <button type="button" disabled={busy} onClick={() => { setError(null); setStorageFull(false); setFileCountLimit(false); setFailureDialogOpen(false); onResetFailureDemo?.(); }} className="rounded-lg border border-amber-200 bg-white px-3 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-50">重新触发此失败</button>
                            </div>
                            <p className="mt-2 text-xs leading-5 text-amber-800">选择原因后点击“保存为 PDF”触发模拟失败；点击“重试”演示恢复。切换原因或重新触发可重复演示。</p>
                        </div>
                    ) : null}

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

            <footer className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-white px-3 py-3 sm:px-6">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <button type="button" aria-pressed={allSelected} onClick={() => onSelectionChange(allSelected ? [] : task.questions.map((question) => question.id))} disabled={busy} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-2.5 text-xs font-semibold text-violet-700 hover:bg-violet-50 disabled:opacity-50">
                        {allSelected ? <SquareCheck size={14} /> : <Square size={14} />}{allSelected ? '取消全选' : '全选'}
                    </button>
                    <span className="text-xs font-medium text-slate-500">已选 {selectedQuestions.length}/{task.questions.length}</span>
                </div>
                <div className="ml-auto flex items-center justify-end gap-2">
                    <button type="button" onClick={() => void exportSelection('save')} disabled={!selectedQuestions.length || busy} className={`inline-flex items-center justify-center gap-1.5 rounded-xl border px-4 py-2.5 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${saveFailed ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100' : 'border-violet-200 text-violet-700 hover:bg-violet-50'}`}>
                        {busy && retryMode === 'save' ? <Loader2 size={14} className="animate-spin" /> : saveFailed ? <RotateCcw size={14} /> : <Save size={14} />}{busy && retryMode === 'save' ? '正在保存 PDF' : saveFailed ? '重试保存 PDF' : '保存为 PDF'}
                    </button>
                    <button type="button" onClick={() => { setFailureDialogOpen(false); setCapacityDemoOpen(true); }} disabled={busy} className="rounded-xl border border-dashed border-violet-200 px-3 py-2.5 text-xs font-medium text-violet-600 hover:bg-violet-50 disabled:opacity-50">保存异常演示</button>
                    <button type="button" onClick={() => printFailed ? void exportSelection('print') : setPrintDialogOpen(true)} disabled={!selectedQuestions.length || busy} className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50">
                        {busy && retryMode === 'print' ? <Loader2 size={14} className="animate-spin" /> : printFailed ? <RotateCcw size={14} /> : <Printer size={14} />}{busy && retryMode === 'print' ? '正在准备打印' : printFailed ? '重试打印' : '打印'}
                    </button>
                </div>
            </footer>
            {capacityDemoOpen ? (
                <PdfCapacityDialog message="“我的文件”剩余容量不足，无法保存这份 PDF。" onClose={() => setCapacityDemoOpen(false)} onGoToFiles={() => { setCapacityDemoOpen(false); setFilesOpen(true); }} />
            ) : failureDialogOpen && error && fileCountLimit ? (
                <PdfCapacityDialog title="保存失败，文件份数已达上限" message={error} recoveryHint="请前往“我的文件”删除不需要的文件，再返回重试保存。" onClose={() => setFailureDialogOpen(false)} onGoToFiles={() => { setFailureDialogOpen(false); setFilesOpen(true); }} />
            ) : failureDialogOpen && error && storageFull ? (
                <PdfCapacityDialog message={error} onClose={() => setFailureDialogOpen(false)} onRetry={() => void exportSelection(retryMode)} onGoToFiles={() => { setFailureDialogOpen(false); setFilesOpen(true); }} />
            ) : failureDialogOpen && error ? (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900/40 p-4" onKeyDown={(event) => {
                    if (event.key === 'Escape') { event.stopPropagation(); setFailureDialogOpen(false); }
                    if (event.key === 'Tab') {
                        const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button'));
                        const first = buttons[0], last = buttons[buttons.length - 1];
                        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
                        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
                    }
                }}>
                    <section role="alertdialog" aria-modal="true" aria-labelledby="paper-failure-title" aria-describedby="paper-failure-reason" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                        <h2 id="paper-failure-title" className="text-lg font-bold text-slate-900">{retryMode === 'save' && failureDemo === 'network_disconnected' && task.simulateExportFailure ? '网络已断开，保存失败' : retryMode === 'save' ? 'PDF 保存失败' : '打印文件生成失败'}</h2>
                        <p id="paper-failure-reason" className="mt-3 text-sm leading-6 text-slate-600">{error}</p>
                        <div className="mt-6 flex flex-wrap justify-end gap-2">
                            <button type="button" autoFocus onClick={() => setFailureDialogOpen(false)} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">取消</button>
                            <button type="button" onClick={() => {
                                if (retryMode === 'save' && (failureDemo === 'network_failed' || failureDemo === 'network_disconnected') && task.simulateExportFailure) {
                                    setFailureDialogOpen(false);
                                    setNetworkPageOpen(true);
                                } else void exportSelection(retryMode);
                            }} disabled={busy || !selectedQuestions.length} className="rounded-xl border border-violet-200 px-4 py-2.5 text-sm font-semibold text-violet-700 hover:bg-violet-50 disabled:opacity-50">{retryMode === 'save' && failureDemo === 'network_disconnected' && task.simulateExportFailure ? '去联网' : retryMode === 'save' && failureDemo === 'network_failed' && task.simulateExportFailure ? '联网重试' : '重试'}</button>
                        </div>
                    </section>
                </div>
            ) : null}
            {filesOpen ? (
                <div className="absolute inset-0 z-30 bg-slate-50">
                    <MyPrintedFilesPage onBack={() => setFilesOpen(false)} />
                </div>
            ) : null}
            {networkPageOpen ? (
                <div className="absolute inset-0 z-30 flex flex-col bg-slate-50">
                    <header className="flex h-14 shrink-0 items-center border-b border-slate-200 bg-white px-4 sm:px-6">
                        <button type="button" onClick={() => setNetworkPageOpen(false)} aria-label="返回题目查看" className="flex h-9 w-9 items-center justify-center rounded-full text-slate-700 hover:bg-slate-100"><ArrowLeft size={20} /></button>
                        <h2 className="ml-3 text-sm font-bold text-slate-900">网络连接</h2>
                    </header>
                    <main className="flex-1 overflow-y-auto px-4 py-8 sm:px-6">
                        <section className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                            <div className="flex items-center gap-3">
                                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600"><WifiOff size={22} /></span>
                                <div><h3 className="text-base font-bold text-slate-900">网络连接不可用</h3><p className="mt-1 text-xs text-slate-500">连接网络后，可继续重试保存 PDF。</p></div>
                            </div>
                            <div className="mt-6">
                                <h4 className="mb-2 text-xs font-semibold text-slate-600">可用网络</h4>
                                <div className="space-y-2">
                                    {['AI-Classroom', 'Guest-WiFi'].map((network) => (
                                        <button key={network} type="button" onClick={() => setSelectedNetwork(network)} aria-pressed={selectedNetwork === network} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors ${selectedNetwork === network ? 'border-violet-300 bg-violet-50' : 'border-slate-200 hover:border-slate-300'}`}>
                                            <Wifi size={18} className={selectedNetwork === network ? 'text-violet-600' : 'text-slate-400'} />
                                            <span className="flex-1 text-sm font-medium text-slate-800">{network}</span>
                                            {selectedNetwork === network ? <Check size={16} className="text-violet-600" /> : null}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <button type="button" disabled={!selectedNetwork || busy} onClick={() => { setNetworkPageOpen(false); void exportSelection('save'); }} className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50">连接 {selectedNetwork} 并重试保存</button>
                            <p className="mt-3 text-center text-[11px] leading-5 text-slate-400">联网后将返回当前试卷并重新保存，题目和选择会保留。</p>
                        </section>
                    </main>
                </div>
            ) : null}
            {printDialogOpen ? (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/40 p-4">
                    <section role="dialog" aria-modal="true" aria-labelledby="paper-print-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                        <div className="flex items-center justify-between"><h2 id="paper-print-title" className="text-lg font-bold">打印试卷</h2><button type="button" autoFocus aria-label="关闭打印弹窗" onClick={() => setPrintDialogOpen(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={18} /></button></div>
                        <p className="mt-1 text-sm text-slate-500">已选 {selectedQuestions.length} 道题 · A4 纸张</p>
                        <fieldset className="mt-5 space-y-2"><legend className="mb-2 text-sm font-semibold">打印内容</legend>
                            {(Object.keys(PAPER_CONTENT_LABELS) as PaperContentMode[]).map((value) => (
                                <label key={value} className={`flex items-center gap-3 rounded-xl border p-3 text-sm ${contentMode === value ? 'border-violet-400 bg-violet-50' : 'border-slate-200'} ${!task.seed.withAnswers && value !== 'paper_only' ? 'opacity-40' : 'cursor-pointer'}`}>
                                    <input type="radio" name="paper-print-content" value={value} checked={contentMode === value} onChange={() => setContentMode(value)} disabled={!task.seed.withAnswers && value !== 'paper_only'} className="accent-violet-600" />{PAPER_CONTENT_LABELS[value]}
                                </label>
                            ))}
                        </fieldset>
                        {!task.seed.withAnswers ? <p className="mt-2 text-xs text-slate-500">当前试卷不含答案，仅支持打印试卷。</p> : null}
                        <p className="mt-4 text-xs leading-5 text-slate-500">生成的文档会自动存入“我的文件”。随后打开打印预览，确认后可选择打印机。</p>
                        <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setPrintDialogOpen(false)} className="rounded-xl px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-100">取消</button><button type="button" onClick={() => { setPrintDialogOpen(false); void exportSelection('print'); }} className="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-700">生成打印预览</button></div>
                    </section>
                </div>
            ) : null}
        </div>
    );
};
