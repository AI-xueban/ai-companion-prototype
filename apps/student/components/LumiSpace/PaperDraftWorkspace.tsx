import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowLeft, Check, Eye, Plus, Trash2 } from 'lucide-react';
import { buildPaperQuestions, makePaperQuestion, type PaperPdfQuestion } from './lumiPaperPdf';

export interface PaperDraftSeed {
    title: string;
    scope: string;
    questionCount: number;
    duration: string;
    difficulty: string;
    withAnswers: boolean;
    version: number;
    /** 教材版本由演示默认值补足时，需在题目查看与导出文件中标明。 */
    assumedTextbook?: string;
}

interface PaperDraftWorkspaceProps {
    seed: PaperDraftSeed;
    initialQuestions?: PaperPdfQuestion[];
    onClose: () => void;
    onFinishReview: (version: number, questions: PaperPdfQuestion[]) => void;
    onDraftChange?: (version: number, questions: PaperPdfQuestion[]) => void;
}

export const PaperDraftWorkspace: React.FC<PaperDraftWorkspaceProps> = ({ seed, initialQuestions, onClose, onFinishReview, onDraftChange }) => {
    const [version, setVersion] = useState(seed.version);
    const [questions, setQuestions] = useState(() => initialQuestions ?? buildPaperQuestions(seed.scope, seed.questionCount, seed.difficulty));
    const [phase, setPhase] = useState<'ready' | 'dirty'>('ready');

    useEffect(() => {
        setVersion(seed.version);
        setQuestions(initialQuestions ?? buildPaperQuestions(seed.scope, seed.questionCount, seed.difficulty));
        setPhase('ready');
    }, [seed, initialQuestions]);

    const displayCount = questions.length;
    const totalScore = useMemo(() => questions.reduce((sum, question) => sum + question.score, 0), [questions]);

    const commitEdit = (updater: (current: PaperPdfQuestion[]) => PaperPdfQuestion[]) => {
        const nextQuestions = updater(questions);
        const nextVersion = version + 1;
        setQuestions(nextQuestions);
        setVersion(nextVersion);
        setPhase('dirty');
        onDraftChange?.(nextVersion, nextQuestions);
    };

    const replaceQuestion = (id: number) => {
        commitEdit((current) => current.map((question) => question.id === id
            ? makePaperQuestion(seed.scope, id + current.length, question.score, seed.difficulty)
            : question));
    };

    const removeQuestion = (id: number) => {
        commitEdit((current) => current.filter((question) => question.id !== id));
    };

    const addQuestion = () => {
        commitEdit((current) => [
            ...current,
            makePaperQuestion(seed.scope, Math.max(0, ...current.map((question) => question.id)) + 1, 5, seed.difficulty),
        ]);
    };

    return (
        <div className="fixed inset-0 z-[120] bg-slate-950/45 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-6">
            <section className="relative w-full sm:max-w-5xl h-full max-h-full min-h-0 bg-[#f7f8fb] sm:rounded-[28px] shadow-2xl overflow-hidden flex flex-col">
                <header className="shrink-0 px-5 sm:px-7 py-4 bg-white border-b border-slate-200 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <h2 className="font-black text-slate-900 truncate">{seed.title}</h2>
                            <span className="px-2 py-0.5 rounded-full bg-brand/10 text-brand text-[11px] font-black">V{version}</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">题目预览 · 修改后会创建新版本</p>
                    </div>
                    <button type="button" onClick={onClose} className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200" aria-label="返回聊天">
                        <ArrowLeft size={16} /> 返回聊天
                    </button>
                </header>

                <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-7">
                    <div className="grid lg:grid-cols-[1fr_290px] gap-5">
                        <main className="space-y-4">
                            <div className="bg-white rounded-2xl border border-slate-200 p-4">
                                <p className="text-xs font-black text-slate-500 mb-3">已确认要求</p>
                                <div className="flex flex-wrap gap-2 text-xs font-bold">
                                    {[seed.scope, `${displayCount}题`, seed.duration, seed.difficulty, seed.withAnswers ? '含答案解析' : '不含解析'].map((item) => (
                                        <span key={item} className="px-3 py-1.5 rounded-full bg-slate-100 text-slate-600">{item}</span>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                                    <div>
                                        <h3 className="font-black text-sm text-slate-800">题目预览</h3>
                                        <p className="text-[11px] text-slate-400 mt-0.5">确认题目后，可选择要保存或打印的题目</p>
                                    </div>
                                    <button type="button" onClick={addQuestion} className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-brand/10 text-brand text-xs font-black hover:bg-brand/15">
                                        <Plus size={14} /> 加题
                                    </button>
                                </div>
                                <div className="divide-y divide-slate-100">
                                    {questions.map((question, index) => (
                                        <article key={question.id} className="p-4">
                                            <div className="flex items-start gap-3">
                                                <span className="w-7 h-7 shrink-0 rounded-lg bg-slate-100 text-slate-500 text-xs font-black flex items-center justify-center">{index + 1}</span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-slate-400">
                                                        <span>{question.type}</span><span>·</span><span>{question.score}分</span>
                                                    </div>
                                                    <p className="mt-1.5 text-sm leading-6 text-slate-700">{question.stem}</p>
                                                    <div className="mt-3 flex gap-2">
                                                        <button type="button" onClick={() => replaceQuestion(question.id)} className="px-3 py-1.5 rounded-lg border border-brand/25 text-brand text-xs font-bold hover:bg-brand/5">换一题</button>
                                                        <button type="button" onClick={() => removeQuestion(question.id)} className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 text-xs font-bold hover:bg-slate-50 inline-flex items-center gap-1"><Trash2 size={12} /> 删除</button>
                                                    </div>
                                                </div>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            </div>
                        </main>

                        <aside className="space-y-4">
                            <div className="bg-white rounded-2xl border border-slate-200 p-4 sticky top-0">
                                <div className="flex items-center justify-between gap-2">
                                    <h3 className="font-black text-sm text-slate-800">题目检查</h3>
                                    <span className={`text-[11px] font-black ${phase === 'ready' ? 'text-emerald-600' : 'text-amber-600'}`}>
                                        {phase === 'ready' ? '题目已生成' : '有未确认修改'}
                                    </span>
                                </div>
                                <div className="mt-4 space-y-3">
                                    {[`当前预览共 ${displayCount} 题`, `当前预览合计 ${totalScore} 分`, '题目内容请人工确认'].map((label) => (
                                        <div key={label} className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                            {phase === 'dirty' ? <AlertCircle size={15} className="text-amber-500" /> : <Check size={15} className="text-emerald-500" />}
                                            {label}
                                        </div>
                                    ))}
                                </div>
                                <button type="button" onClick={() => onFinishReview(version, questions)} disabled={questions.length === 0} className="mt-5 w-full py-3 rounded-xl bg-brand text-white text-sm font-black shadow-lg shadow-brand/20 disabled:bg-slate-300 disabled:shadow-none flex items-center justify-center gap-2">
                                    <Eye size={16} /> {phase === 'dirty' ? '更新题目并查看' : '查看全部题目'}
                                </button>
                                {phase === 'dirty' ? <p className="mt-2 text-[11px] leading-5 text-amber-600">修改已更新为 V{version}，保存或打印前还可以继续调整。</p> : null}
                            </div>
                        </aside>
                    </div>
                </div>

            </section>
        </div>
    );
};
