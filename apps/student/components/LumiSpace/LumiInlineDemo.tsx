import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, FileText, Loader2, Printer, RefreshCw, Sparkles, X } from 'lucide-react';
import { INLINE_DEMO_ANSWER_SUGGESTIONS, INLINE_DEMO_PROMPTS, INLINE_DEMO_QUESTIONS, type LumiInlineDemoKind } from '../../data/lumiInlineDemos';
import { createCombinedPaperDocument } from './lumiPaperPdf';
import { listPrintedFiles, savePaperDocument, retryPrintedFile } from '../../services/printedFileService';
import { PaperPdfViewer } from './PaperPdfViewer';
import moonCat from '../../assets/lumi-demo-moon-cat.png';
import starCat from '../../assets/lumi-demo-star-cat.png';

type Turn = { id: number; prompt: string; state: 'generating' | 'ready' | 'cancelled'; variant: number; answerTo?: number };
type Output = { pdf: Blob; previewPages: Blob[]; fileId: string; title?: string };
type SaveKind = 'paper' | 'answers';
type GroupOutputs = { groupNumber: number; paper?: Output; answers?: Output };
export interface InlineDemoSnapshot { turns: Turn[]; groups?: Record<number, GroupOutputs>; output?: Output | null; answerOutput?: Output | null }
interface Props {
  kind: LumiInlineDemoKind;
  initial?: InlineDemoSnapshot;
  onSnapshot: (snapshot: InlineDemoSnapshot) => void;
  registerSend: (send: ((text: string) => void) | null) => void;
  onPrefill: (text: string) => void;
  onContentChange: () => void;
  suggestionHost: HTMLDivElement | null;
  onStopChange: (stop: (() => void) | null) => void;
}
const title = '一元一次方程专项练习';
const documentTitleFor = (groupNumber: number, target: SaveKind) => `${title}-${String(groupNumber).padStart(2, '0')}-${target === 'answers' ? '答案解析' : '题目'}`;
const nextGroupNumber = (groups: Record<number, GroupOutputs>) => 1 + Math.max(0,
  ...Object.values(groups).map(group => group.groupNumber),
  ...listPrintedFiles().map(file => Number(file.title.match(/^一元一次方程专项练习-(\d+)-(?:题目|答案解析)$/)?.[1] ?? 0)));
const smallButton = 'inline-flex items-center justify-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-slate-600 shadow-sm hover:bg-sky-50 disabled:opacity-50 disabled:cursor-wait';
const DemoProgressLine: React.FC<{ text: string }> = ({ text }) => <div role="status" aria-live="polite" aria-atomic="true" className="flex w-fit max-w-full items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs text-slate-600"><Loader2 className="shrink-0 animate-spin text-sky-500" size={14} /><span>{text}</span></div>;
const ImageGenerationProgress: React.FC = () => {
  const [progress, setProgress] = useState(1);
  useEffect(() => {
    const startedAt = Date.now();
    // Demo-only progress; never imply completion before the image is ready.
    const timer = setInterval(() => setProgress(Math.min(99, Math.round(1 + 98 * (Date.now() - startedAt) / 2600))), 80);
    return () => clearInterval(timer);
  }, []);
  return <div role="status" aria-label="图片正在生成中" className="flex aspect-square w-[260px] max-w-full flex-col justify-between rounded-2xl bg-white p-5 text-slate-600">
    <div className="flex items-center gap-2 text-xs"><Loader2 className="animate-spin text-sky-500" size={14} /><span>正在生成图片…</span></div>
    <div className="relative flex flex-1 flex-col items-center justify-center gap-3">
      <div aria-hidden="true" className="absolute h-24 w-24 animate-pulse rounded-full bg-sky-50" />
      <Sparkles aria-hidden="true" size={28} className="relative animate-pulse text-sky-400" />
      <span aria-hidden="true" className="relative text-3xl font-semibold tabular-nums text-sky-600">{progress}<span className="ml-0.5 text-sm">%</span></span>
    </div>
  </div>;
};

export const LumiInlineDemo: React.FC<Props> = ({ kind, initial, onSnapshot, registerSend, onPrefill, onContentChange, suggestionHost, onStopChange }) => {
  const [turns, setTurns] = useState<Turn[]>(() => initial?.turns.map(t => t.state === 'generating' ? { ...t, state: 'cancelled' } : t) ?? []);
  const [groups, setGroups] = useState<Record<number, GroupOutputs>>(() => {
    if (initial?.groups) return initial.groups;
    const question = initial?.turns.filter(turn => !turn.answerTo && turn.state === 'ready').at(-1);
    if (!question || (!initial?.output && !initial?.answerOutput)) return {};
    const savedFiles = listPrintedFiles();
    const restore = (output?: Output | null) => output ? { ...output, title: output.title ?? savedFiles.find(file => file.id === output.fileId)?.title ?? title } : undefined;
    return { [question.id]: { groupNumber: 0, paper: restore(initial.output), answers: restore(initial.answerOutput) } };
  });
  const groupsRef = useRef(groups);
  groupsRef.current = groups;
  const [saving, setSaving] = useState(false);
  const [saveKind, setSaveKind] = useState<SaveKind>('paper');
  const [savingGroupId, setSavingGroupId] = useState<number | null>(null);
  const [saveStage, setSaveStage] = useState<'extract' | 'generate' | 'store'>('extract');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [viewer, setViewer] = useState<{ groupId: number; kind: SaveKind; action: 'preview' | 'print' } | null>(null);
  const [zoom, setZoom] = useState<string | null>(null);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  const mounted = useRef(true);
  const saveLock = useRef(false);
  const sequence = useRef(Date.now());
  const turnsRef = useRef(turns);
  turnsRef.current = turns;
  const callbacks = useRef({ onSnapshot, onContentChange, onPrefill, onStopChange });
  callbacks.current = { onSnapshot, onContentChange, onPrefill, onStopChange };
  useEffect(() => {
    if (!turnsRef.current.length) callbacks.current.onPrefill(INLINE_DEMO_PROMPTS[kind]);
  }, [kind]);

  const send = (prompt: string, answerTo?: number) => {
    if (!prompt.trim()) return;
    // One active generation per demo conversation; preserve completed versions.
    if (turnsRef.current.some(t => t.state === 'generating')) {
      setNotice('正在生成，请稍等，或先停止本次生成。');
      return;
    }
    const id = ++sequence.current;
    const variant = /星空|流星|晚上|夜空/.test(prompt) ? 1 : turnsRef.current.at(-1)?.variant ?? 0;
    const questionTurn = kind === 'print' && /答案|解析/.test(prompt)
      ? [...turnsRef.current].reverse().find(t => t.state === 'ready' && !t.answerTo)
      : undefined;
    const next: Turn = { id, prompt, state: 'generating', variant, answerTo: answerTo ?? questionTurn?.id };
    turnsRef.current = [...turnsRef.current, next];
    setTurns(turnsRef.current);
    setNotice('');
    const timer = setTimeout(() => {
      timers.current.delete(id);
      setTurns(current => current.map(t => t.id === id ? { ...t, state: 'ready' } : t));
    }, kind === 'image' ? 3000 : 1600);
    timers.current.set(id, timer);
  };
  useEffect(() => { registerSend(send); return () => registerSend(null); });
  useEffect(() => {
    callbacks.current.onSnapshot({ turns, groups });
    callbacks.current.onContentChange();
  }, [turns, groups, saving, error]);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; timers.current.forEach(clearTimeout); timers.current.clear(); };
  }, []);

  const cancel = (id: number) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setTurns(current => current.map(t => t.id === id ? { ...t, state: 'cancelled' } : t));
  };
  useEffect(() => {
    const activeTurn = turns.find(turn => turn.state === 'generating');
    callbacks.current.onStopChange(activeTurn ? () => cancel(activeTurn.id) : null);
    return () => callbacks.current.onStopChange(null);
  }, [turns]);
  const savePdf = async (target: SaveKind, groupId: number) => {
    if (saveLock.current || groupsRef.current[groupId]?.[target]) return;
    saveLock.current = true;
    setSaving(true);
    setSaveKind(target);
    setSavingGroupId(groupId);
    setSaveStage('extract');
    setError('');
    const group = groupsRef.current[groupId];
    const groupNumber = group?.groupNumber || nextGroupNumber(groupsRef.current);
    groupsRef.current = { ...groupsRef.current, [groupId]: { ...group, groupNumber } };
    setGroups(groupsRef.current);
    const documentTitle = documentTitleFor(groupNumber, target);
    const contentMode = target === 'answers' ? 'paper_answer_analysis' : 'paper_only';
    try {
      // Context extraction is simulated with the demo's structured questions.
      const stageDelay = () => new Promise<void>(resolve => setTimeout(resolve, 1200));
      await stageDelay();
      if (!mounted.current) return;
      setSaveStage('generate');
      const [document] = await Promise.all([
        createCombinedPaperDocument({ title: documentTitle, scope: '数学 · 一元一次方程', duration: '15分钟', difficulty: '基础', version: 1, questions: INLINE_DEMO_QUESTIONS, withAnswers: target === 'answers', contentMode }),
        stageDelay(),
      ]);
      if (!mounted.current) return;
      setSaveStage('store');
      const [file] = await Promise.all([
        savePaperDocument({ title: documentTitle, subject: '数学', source: 'lumi_space', questionCount: 3, pageCount: document.previewPages.length, version: 1, contentMode, status: 'saved', statusLabel: '已保存' }, document),
        stageDelay(),
      ]);
      if (mounted.current) {
        groupsRef.current = { ...groupsRef.current, [groupId]: { ...groupsRef.current[groupId], [target]: { ...document, fileId: file.id, title: documentTitle } } };
        setGroups(groupsRef.current);
      }
    } catch (cause) {
      if (mounted.current) setError(`${cause instanceof Error ? cause.message : 'PDF 保存失败。'} 题目已保留，请重试。`);
    } finally {
      saveLock.current = false;
      if (mounted.current) setSaving(false);
    }
  };
  const saveAction = (target: SaveKind, groupId: number) => {
    if (groups[groupId]?.[target]) return null;
    const active = saving && saveKind === target && savingGroupId === groupId;
    return <div className="flex items-center justify-between gap-3"><p className="whitespace-nowrap text-[10px] text-slate-400">保存后可打印</p><button disabled={saving} onClick={() => void savePdf(target, groupId)} className={`${smallButton} shrink-0 !border-sky-500 !bg-sky-500 !text-white`}>{active ? <Loader2 size={12} className="animate-spin" /> : <FileText size={12} />}{active ? '正在保存 PDF…' : error && saveKind === target ? '重试保存 PDF' : '保存 PDF'}</button></div>;
  };
  const viewerOutput = viewer ? groups[viewer.groupId]?.[viewer.kind] : undefined;
  const viewerTitle = viewerOutput?.title ?? title;
  const latestTurn = turns.at(-1);
  const showAnswerSuggestion = kind === 'print' && latestTurn?.state === 'ready' && !latestTurn.answerTo && !saving && !error;
  const suggestionIndex = Math.max(0, turns.filter(t => t.state === 'ready' && !t.answerTo).length - 1) + (latestTurn && groups[latestTurn.id]?.paper ? 1 : 0);
  return <div className="w-full space-y-3 text-slate-700" data-testid={`inline-${kind}-demo`}>
    <p className="text-center text-[10px] text-slate-500">演示会话 · {kind === 'image' ? '使用本地样图模拟生成与修改' : '示例题目，可保存 PDF 并演示打印'}</p>
    {!turns.length && <div className="space-y-3">
      <p className="w-fit rounded-2xl rounded-tl-sm bg-white px-4 py-3 text-sm shadow-sm">{kind === 'print' ? '想练什么题？可以修改输入框里的示例，点击发送就好。' : '想画什么？可以修改输入框里的示例，点击发送就好。'}</p>
    </div>}
    {turns.map(turn => <div key={turn.id} className="space-y-3">
      <div className="flex justify-end"><p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tr-sm bg-brand px-4 py-3 text-sm text-white shadow-sm">{turn.prompt}</p></div>
      {turn.state === 'generating' ? kind === 'image' ? <ImageGenerationProgress /> : <DemoProgressLine text={turn.answerTo ? '正在整理答案和解析…' : '正在生成试题…'} /> : turn.state === 'cancelled' ? <div className="flex items-center gap-2 text-xs text-slate-500">已停止生成<button className={smallButton} onClick={() => send(turn.prompt, turn.answerTo)}>重新生成</button></div>
        : kind === 'print' && turn.answerTo ? <section className="w-full max-w-[420px] rounded-2xl rounded-tl-sm border border-white/60 bg-white/95 p-4 shadow-sm">
          <p className="mb-3 text-xs">好，下面是这 3 道题的答案和解析。</p>
          <h3 className="text-sm font-bold">答案与解析</h3>
          <ol className="mt-3 space-y-4 text-xs">{INLINE_DEMO_QUESTIONS.map((q, i) => <li key={q.id} className="space-y-2 border-b border-slate-100 pb-3 last:border-0 last:pb-0">
            <p className="font-semibold">{i + 1}. {q.stem}</p>
            <p><span className="font-semibold text-sky-700">答案：</span>{q.answer}</p>
            <p className="leading-relaxed"><span className="font-semibold">解析：</span>{q.explanation}</p>
          </li>)}</ol>
          <div className="mt-3 border-t border-slate-100 pt-3">{saveAction('answers', turn.answerTo)}</div>
        </section>
        : kind === 'print' ? <section className="w-full max-w-[420px] rounded-2xl border border-white/60 bg-white/95 p-4 shadow-sm">
          <h3 className="text-sm font-bold">{title}</h3><p className="mt-1 text-[10px] text-slate-400">数学 · 3 道题</p>
          <ol className="my-3 space-y-3 text-xs">{INLINE_DEMO_QUESTIONS.map((q, i) => <li key={q.id} className="border-b border-slate-100 pb-3">{i + 1}. {q.stem}</li>)}</ol>
          {saveAction('paper', turn.id)}
        </section> : <div className="w-fit max-w-full space-y-2">
          <p className="w-fit rounded-2xl bg-white px-4 py-2.5 text-xs">{turn.variant ? '好，保留小猫和水彩风格，调整为星空背景。' : '画好啦！月球上的小小阅读家。'}</p>
          <button onClick={() => setZoom(turn.variant ? starCat : moonCat)} className="relative block overflow-hidden rounded-2xl" aria-label="查看生成图片大图"><img src={turn.variant ? starCat : moonCat} alt={turn.variant ? '星空与流星下看书的月球小猫' : '月球上看书的水彩小猫'} className="aspect-square w-[260px] max-w-full object-cover" /><span className="absolute bottom-2 right-2 rounded bg-black/40 px-1.5 py-0.5 text-[9px] text-white">小晤AI生成</span></button>
          <button className="inline-flex items-center justify-center gap-1 rounded-full border border-slate-200/60 bg-white/60 px-2.5 py-1 text-[10px] font-normal text-slate-500 transition-colors hover:bg-white/90 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300" onClick={() => send(turn.prompt)}><RefreshCw size={11} strokeWidth={1.5} />再生成</button>
        </div>}
    </div>)}
    {saving && <DemoProgressLine text={saveStage === 'extract' ? saveKind === 'answers' ? '正在整理题目及答案解析…' : '正在提取试题，去除无关内容…' : saveStage === 'generate' ? saveKind === 'answers' ? '正在排版答案解析 PDF…' : '正在排版试题 PDF…' : '正在保存到「我的文件」…'} />}
    {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
    {Object.entries(groups).flatMap(([groupId, group]) => (['paper', 'answers'] as const).map(target => {
      const file = group[target];
      if (!file) return null;
      return <section key={`${groupId}-${target}`} className="w-full max-w-[420px] space-y-2 rounded-2xl bg-white/95 p-3 shadow-sm"><p className="text-xs">PDF 已保存，可以去打印啦。</p><div className="flex items-center gap-2"><FileText size={26} className="shrink-0 text-red-500" /><div className="min-w-0"><p className="break-all text-xs font-semibold">{file.title ?? documentTitleFor(group.groupNumber, target)}.pdf</p><p className="mt-1 flex items-center gap-1 text-[10px] text-slate-500"><Check size={11} className="text-emerald-500" />已保存到「我的文件」</p></div></div><div className="flex gap-2"><button className={smallButton} onClick={() => setViewer({ groupId: Number(groupId), kind: target, action: 'preview' })}>查看 PDF</button><button className={`${smallButton} !border-sky-500 !bg-sky-500 !text-white`} onClick={() => setViewer({ groupId: Number(groupId), kind: target, action: 'print' })}><Printer size={12} />去打印</button></div></section>;
    }))}
    {notice && <p role="status" className="text-[10px] text-slate-500">{notice}</p>}
    {showAnswerSuggestion && latestTurn && suggestionHost && createPortal(<button type="button" onClick={() => send('需要，请补充这几道题的答案和解析。', latestTurn.id)} className="block w-fit max-w-full rounded-full border border-sky-100 bg-white/95 px-3 py-2 text-left text-[10px] text-sky-700 shadow-sm transition-colors hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300">{INLINE_DEMO_ANSWER_SUGGESTIONS[suggestionIndex % INLINE_DEMO_ANSWER_SUGGESTIONS.length]}</button>, suggestionHost)}
    {viewer && viewerOutput && <PaperPdfViewer key={`${viewer.groupId}-${viewer.kind}-${viewer.action}`} pdf={viewerOutput.pdf} pages={viewerOutput.previewPages} title={viewerTitle} version={1} contentMode={viewer.kind === 'answers' ? 'paper_answer_analysis' : 'paper_only'} initialPrintOpen={viewer.action === 'print'} onPrint={() => retryPrintedFile(viewerOutput.fileId, 'unknown')} onClose={() => setViewer(null)} />}
    {zoom && <div role="dialog" aria-label="生成图片预览" className="fixed inset-0 z-[450] flex items-center justify-center bg-slate-950/80 p-8" onClick={() => setZoom(null)}><img src={zoom} alt="生成图片大图" className="max-h-full max-w-full rounded-xl object-contain" /><button aria-label="关闭大图" className="absolute right-4 top-4 rounded-full bg-white p-2" onClick={() => setZoom(null)}><X size={18} /></button></div>}
  </div>;
};
