import React, { useEffect, useRef, useState } from 'react';
import { Check, FileText, Loader2, Printer, RefreshCw, X } from 'lucide-react';
import { INLINE_DEMO_PROMPTS, INLINE_DEMO_QUESTIONS, type LumiInlineDemoKind } from '../../data/lumiInlineDemos';
import { createCombinedPaperDocument } from './lumiPaperPdf';
import { savePaperDocument, retryPrintedFile } from '../../services/printedFileService';
import { PaperPdfViewer } from './PaperPdfViewer';
import moonCat from '../../assets/lumi-demo-moon-cat.png';
import starCat from '../../assets/lumi-demo-star-cat.png';

type Turn = { id: number; prompt: string; state: 'generating' | 'ready' | 'cancelled'; variant: number };
type Output = { pdf: Blob; previewPages: Blob[]; fileId: string };
export interface InlineDemoSnapshot { turns: Turn[]; output: Output | null }
interface Props {
  kind: LumiInlineDemoKind;
  initial?: InlineDemoSnapshot;
  onSnapshot: (snapshot: InlineDemoSnapshot) => void;
  registerSend: (send: ((text: string) => void) | null) => void;
  onPrefill: (text: string) => void;
  onContentChange: () => void;
}
const title = '一元一次方程专项练习';
const smallButton = 'inline-flex items-center justify-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-semibold text-slate-600 shadow-sm hover:bg-sky-50 disabled:opacity-50 disabled:cursor-wait';

export const LumiInlineDemo: React.FC<Props> = ({ kind, initial, onSnapshot, registerSend, onContentChange }) => {
  const [turns, setTurns] = useState<Turn[]>(() => initial?.turns.map(t => t.state === 'generating' ? { ...t, state: 'cancelled' } : t) ?? []);
  const [output, setOutput] = useState<Output | null>(initial?.output ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [viewer, setViewer] = useState<'preview' | 'print' | null>(null);
  const [zoom, setZoom] = useState<string | null>(null);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  const mounted = useRef(true);
  const saveLock = useRef(false);
  const sequence = useRef(Date.now());
  const turnsRef = useRef(turns);
  turnsRef.current = turns;
  const callbacks = useRef({ onSnapshot, onContentChange });
  callbacks.current = { onSnapshot, onContentChange };

  const send = (prompt: string) => {
    if (!prompt.trim()) return;
    // One active generation per demo conversation; preserve completed versions.
    if (turnsRef.current.some(t => t.state === 'generating')) {
      setNotice('正在生成，请稍等，或先取消本次生成。');
      return;
    }
    const id = ++sequence.current;
    const variant = /星空|流星|晚上|夜空/.test(prompt) ? 1 : turnsRef.current.at(-1)?.variant ?? 0;
    const next: Turn = { id, prompt, state: 'generating', variant };
    turnsRef.current = [...turnsRef.current, next];
    setTurns(turnsRef.current);
    setNotice('');
    const timer = setTimeout(() => {
      timers.current.delete(id);
      setTurns(current => current.map(t => t.id === id ? { ...t, state: 'ready' } : t));
    }, 1600);
    timers.current.set(id, timer);
  };
  useEffect(() => { registerSend(send); return () => registerSend(null); });
  useEffect(() => {
    callbacks.current.onSnapshot({ turns, output });
    callbacks.current.onContentChange();
  }, [turns, output, saving, error]);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; timers.current.forEach(clearTimeout); timers.current.clear(); };
  }, []);

  const cancel = (id: number) => {
    clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setTurns(current => current.map(t => t.id === id ? { ...t, state: 'cancelled' } : t));
  };
  const savePdf = async () => {
    if (saveLock.current || output) return;
    saveLock.current = true;
    setSaving(true);
    setError('');
    const startedAt = Date.now();
    try {
      const document = await createCombinedPaperDocument({ title, scope: '数学 · 一元一次方程', duration: '15分钟', difficulty: '基础', version: 1, questions: INLINE_DEMO_QUESTIONS, withAnswers: false, contentMode: 'paper_only' });
      if (!mounted.current) return;
      const file = await savePaperDocument({ title, subject: '数学', source: 'lumi_space', questionCount: 3, pageCount: document.previewPages.length, version: 1, contentMode: 'paper_only', status: 'saved', statusLabel: '已保存' }, document);
      // Keep the demo's progress visible even when local PDF storage completes quickly.
      const remaining = 2000 - (Date.now() - startedAt);
      if (remaining > 0) await new Promise<void>(resolve => setTimeout(resolve, remaining));
      if (mounted.current) setOutput({ ...document, fileId: file.id });
    } catch (cause) {
      if (mounted.current) setError(`${cause instanceof Error ? cause.message : 'PDF 保存失败。'} 题目已保留，请重试。`);
    } finally {
      saveLock.current = false;
      if (mounted.current) setSaving(false);
    }
  };
  return <div className="w-full space-y-3 text-slate-700" data-testid={`inline-${kind}-demo`}>
    <p className="text-center text-[10px] text-slate-500">演示会话 · {kind === 'image' ? '使用本地样图模拟生成与修改' : '示例题目，可保存 PDF 并演示打印'}</p>
    {!turns.length && <div className="space-y-3">
      <p className="w-fit rounded-2xl rounded-tl-sm bg-white px-4 py-3 text-sm shadow-sm">{kind === 'print' ? '想练什么题？告诉我，也可以试试下面的示例。' : '想画什么？告诉我就好，也可以试试下面的示例。'}</p>
      <button className={smallButton} onClick={() => send(INLINE_DEMO_PROMPTS[kind])}>{INLINE_DEMO_PROMPTS[kind]} <span className="text-sky-600">发送</span></button>
    </div>}
    {turns.map(turn => <div key={turn.id} className="space-y-3">
      <div className="flex justify-end"><p className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-tr-sm bg-brand px-4 py-3 text-sm text-white shadow-sm">{turn.prompt}</p></div>
      {turn.state === 'generating' ? <div className="w-fit space-y-2">
        <div role="status" className="flex h-36 w-64 flex-col items-center justify-center gap-3 rounded-2xl bg-white/90 text-xs"><Loader2 className="animate-spin text-sky-500" size={24} />{kind === 'print' ? '正在准备题目…' : '图片生成中…'}</div>
        <button className="inline-flex items-center justify-center gap-0.5 rounded-full border border-slate-200/70 bg-white/80 px-2 py-1 text-[9px] font-normal leading-3 text-slate-500 transition-colors hover:bg-white hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300" onClick={() => cancel(turn.id)}><X size={10} strokeWidth={1.5} />取消生成</button>
      </div> : turn.state === 'cancelled' ? <div className="flex items-center gap-2 text-xs text-slate-500">已取消本次生成<button className={smallButton} onClick={() => send(turn.prompt)}>重新生成</button></div>
        : kind === 'print' ? <section className="w-full max-w-[420px] rounded-2xl border border-white/60 bg-white/95 p-4 shadow-sm">
          <h3 className="text-sm font-bold">{title}</h3><p className="mt-1 text-[10px] text-slate-400">数学 · 3 道题</p>
          <ol className="my-3 space-y-3 text-xs">{INLINE_DEMO_QUESTIONS.map((q, i) => <li key={q.id} className="border-b border-slate-100 pb-3">{i + 1}. {q.stem}</li>)}</ol>
          {!output && <div className="flex items-center justify-between gap-3"><p className="whitespace-nowrap text-[10px] text-slate-400">保存后可打印</p><button disabled={saving} onClick={savePdf} className={`${smallButton} shrink-0 !border-sky-500 !bg-sky-500 !text-white`}>{saving ? <Loader2 size={12} className="animate-spin" /> : <FileText size={12} />}{saving ? '正在保存 PDF…' : error ? '重试保存 PDF' : '保存 PDF'}</button></div>}
        </section> : <div className="w-fit max-w-full space-y-2">
          <p className="w-fit rounded-2xl bg-white px-4 py-2.5 text-xs">{turn.variant ? '好，保留小猫和水彩风格，调整为星空背景。' : '画好啦！月球上的小小阅读家。'}</p>
          <button onClick={() => setZoom(turn.variant ? starCat : moonCat)} className="relative block overflow-hidden rounded-2xl" aria-label="查看生成图片大图"><img src={turn.variant ? starCat : moonCat} alt={turn.variant ? '星空与流星下看书的月球小猫' : '月球上看书的水彩小猫'} className="aspect-square w-[260px] max-w-full object-cover" /><span className="absolute bottom-2 right-2 rounded bg-black/40 px-1.5 py-0.5 text-[9px] text-white">小晤AI生成</span></button>
          <button className="inline-flex items-center justify-center gap-1 rounded-full border border-slate-200/60 bg-white/60 px-2.5 py-1 text-[10px] font-normal text-slate-500 transition-colors hover:bg-white/90 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300" onClick={() => send(turn.prompt)}><RefreshCw size={11} strokeWidth={1.5} />再生成</button>
        </div>}
    </div>)}
    {saving && <div role="status" aria-live="polite" className="flex h-36 w-64 flex-col items-center justify-center gap-3 rounded-2xl bg-white/90 text-xs"><Loader2 className="animate-spin text-sky-500" size={24} />正在保存 PDF…</div>}
    {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
    {output && <section className="w-full max-w-[420px] space-y-2 rounded-2xl bg-white/95 p-3 shadow-sm"><p className="text-xs">PDF 已保存，可以去打印啦。</p><div className="flex items-center gap-2"><FileText size={26} className="shrink-0 text-red-500" /><div className="min-w-0"><p className="break-all text-xs font-semibold">{title}.pdf</p><p className="mt-1 flex items-center gap-1 text-[10px] text-slate-500"><Check size={11} className="text-emerald-500" />已保存到「我的文件」</p></div></div><div className="flex gap-2"><button className={smallButton} onClick={() => setViewer('preview')}>查看 PDF</button><button className={`${smallButton} !border-sky-500 !bg-sky-500 !text-white`} onClick={() => setViewer('print')}><Printer size={12} />去打印</button></div></section>}
    {notice && <p role="status" className="text-[10px] text-slate-500">{notice}</p>}
    {viewer && output && <PaperPdfViewer key={viewer} pdf={output.pdf} pages={output.previewPages} title={title} version={1} contentMode="paper_only" initialPrintOpen={viewer === 'print'} onPrint={() => retryPrintedFile(output.fileId, 'unknown')} onClose={() => setViewer(null)} />}
    {zoom && <div role="dialog" aria-label="生成图片预览" className="fixed inset-0 z-[450] flex items-center justify-center bg-slate-950/80 p-8" onClick={() => setZoom(null)}><img src={zoom} alt="生成图片大图" className="max-h-full max-w-full rounded-xl object-contain" /><button aria-label="关闭大图" className="absolute right-4 top-4 rounded-full bg-white p-2" onClick={() => setZoom(null)}><X size={18} /></button></div>}
  </div>;
};
