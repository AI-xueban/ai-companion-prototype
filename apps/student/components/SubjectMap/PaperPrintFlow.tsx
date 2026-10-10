import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Check, CheckCircle2, ChevronLeft, ChevronRight, FileText, LoaderCircle, Minus, Plus, Printer, RefreshCw, Search, Wifi, X } from 'lucide-react';
import type { QuestionTypeCount } from './PracticeSetupDialog';
import { savePrintedFile } from '../../services/printedFileService';
import { getRealPrintQuestionSamples } from '../../data/realPrintQuestionSamples';

export interface PaperPrintJob {
  title: string;
  questionCount: number;
  subject: string;
  questionTypeCounts?: QuestionTypeCount[];
  includeAnswerAnalysis?: boolean;
  answerMode?: 'paper_only' | 'paper_answer' | 'paper_answer_analysis';
  questionItems?: Array<{
    id: string;
    type: string;
    text: string;
    options?: string[];
    knowledgePoint?: string;
    sourceLabel?: string;
    imageUrl?: string;
    errorReason?: string;
    correctAnswer?: string;
    explanation?: string;
  }>;
  printExceptionDemo?: 'paper_shortage' | 'pdf_save_failed' | 'daily_limit';
}

interface PaperPrintFlowProps { job: PaperPrintJob | null; onClose: () => void; onModify?: () => void; onOpenMyFiles?: () => void; }
type Stage = 'assembling' | 'review' | 'saving' | 'print' | 'completed' | 'failed' | 'shortage' | 'saveFailed' | 'dailyLimit' | 'selectionLimit' | 'unavailableQuestions' | 'previewFailed';
type DeviceState = 'idle' | 'searching' | 'results' | 'empty' | 'connecting' | 'connected' | 'connectFailed';

interface PreviewQuestion { id: string; type: string; text: string; selected: boolean; options?: string[]; knowledgePoint?: string; sourceLabel?: string; imageUrl?: string; errorReason?: string; correctAnswer?: string; explanation?: string; }

function buildQuestions(job: PaperPrintJob): PreviewQuestion[] {
  if (job.questionItems?.length) return job.questionItems.map((item) => ({ ...item, selected: true }));
  const enabledTypes = new Set(job.questionTypeCounts?.map((item) => item.name) ?? []);
  const subjectSamples = getRealPrintQuestionSamples(job.subject);
  const matchingSamples = subjectSamples.filter((item) => enabledTypes.size === 0 || enabledTypes.has(item.type));
  const samples = matchingSamples.length > 0 ? matchingSamples : subjectSamples;
  return Array.from({ length: job.questionCount }, (_, index) => ({
    id: `${samples[index % samples.length].sourceId}-${index + 1}`,
    type: samples[index % samples.length].type,
    text: samples[index % samples.length].stem,
    options: samples[index % samples.length].options,
    knowledgePoint: samples[index % samples.length].knowledgePoint,
    sourceLabel: samples[index % samples.length].sourceLabel,
    imageUrl: samples[index % samples.length].imageUrl,
    selected: true,
  }));
}

export const PaperPrintFlow: React.FC<PaperPrintFlowProps> = ({ job, onClose, onModify, onOpenMyFiles }) => {
  const [stage, setStage] = useState<Stage>('assembling');
  const [questions, setQuestions] = useState<PreviewQuestion[]>([]);
  const [deviceState, setDeviceState] = useState<DeviceState>('connected');
  const [showDevices, setShowDevices] = useState(false);
  const [showExceptionDemos, setShowExceptionDemos] = useState(false);
  const [printerName, setPrinterName] = useState('EPSON AM-C5000 Series');
  const [copies, setCopies] = useState(1);
  const [range, setRange] = useState('全部页面');
  const [orientation, setOrientation] = useState('纵向');
  const [paperSize, setPaperSize] = useState('A4');
  const [duplex, setDuplex] = useState('单面');
  const [color, setColor] = useState('黑白');
  const [zoom, setZoom] = useState(88);
  const [savedFileId, setSavedFileId] = useState<string | null>(null);

  useEffect(() => {
    if (!job) return;
    setQuestions(buildQuestions(job));
    setSavedFileId(null);
    setStage(job.printExceptionDemo === 'daily_limit' ? 'dailyLimit' : 'assembling');
    if (job.printExceptionDemo === 'daily_limit') return;
    const timer = window.setTimeout(() => setStage(job.printExceptionDemo === 'paper_shortage' ? 'shortage' : 'review'), 850);
    return () => window.clearTimeout(timer);
  }, [job]);

  const selected = questions.filter((item) => item.selected);
  const isMistakePrint = Boolean(job?.questionItems?.length);
  const answerMode = job?.answerMode ?? (job?.includeAnswerAnalysis ? 'paper_answer_analysis' : 'paper_only');
  const pages = Math.max(1, Math.ceil(selected.length / 6) + (answerMode === 'paper_only' ? 0 : 1));

  if (!job || typeof document === 'undefined') return null;
  const viewport = document.getElementById('app-viewport') || document.body;

  const generatePdf = () => {
    if (selected.length === 0) return;
    setStage('saving');
    window.setTimeout(() => setStage(job.printExceptionDemo === 'pdf_save_failed' ? 'saveFailed' : 'print'), 900);
  };

  const retryPreview = () => {
    setStage('assembling');
    window.setTimeout(() => setStage('review'), 850);
  };

  const submitPrint = (simulateFailure = false) => {
    const record = savePrintedFile({
      title: job.title,
      subject: job.subject,
      questionCount: selected.length,
      pageCount: pages,
      status: simulateFailure ? 'failed' : 'success',
      statusLabel: simulateFailure ? '打印失败' : '打印成功',
      failureReason: simulateFailure ? '打印机连接中断' : undefined,
      printerName,
      includeAnswerAnalysis: job.includeAnswerAnalysis,
    });
    setSavedFileId(record.id);
    setStage(simulateFailure ? 'failed' : 'completed');
  };

  if (stage === 'assembling') return createPortal(<LoadingCard title={job.questionItems?.length ? '正在生成错题卷' : '正在组卷'} description={job.questionItems?.length ? `正在整理 ${job.questionCount} 道已选错题…` : `正在按已保存题型生成 ${job.questionCount} 道${job.subject}试题…`} />, viewport);
  if (stage === 'dailyLimit') return createPortal(<IssueDialog title="今日组卷次数已达上限" description="今日组卷机会已用完，请明日再来。" primary="知道了" onPrimary={onClose} />, viewport);
  if (stage === 'shortage') return createPortal(<IssueDialog title="可用试题不足" description={`当前题型、知识范围和难度下仅找到 ${Math.max(1, job.questionCount - 6)} 道题。不会自动使用你关闭的题型。`} primary="按实际题量预览" secondary="返回修改" onPrimary={() => { setQuestions(buildQuestions({ ...job, questionCount: Math.max(1, job.questionCount - 6) })); setStage('review'); }} onSecondary={() => onModify?.() ?? onClose()} />, viewport);
  if (stage === 'selectionLimit') return createPortal(<IssueDialog title="已达到 50 题上限" description="单次最多打印 50 道错题。请取消部分已选题，或分批完成打印。" primary="返回继续选择" onPrimary={() => { if (onModify) onModify(); else setStage('review'); }} />, viewport);
  if (stage === 'unavailableQuestions') return createPortal(<IssueDialog title="部分错题暂不可打印" description="有 2 道题的题干或图片资源已失效，系统不会将它们加入试卷，其余已选题会保留。" primary="跳过并继续" secondary="返回挑题" onPrimary={() => setStage('review')} onSecondary={() => { if (onModify) onModify(); else setStage('review'); }} />, viewport);
  if (stage === 'previewFailed') return createPortal(<IssueDialog title="错题卷预览生成失败" description="当前选择结果已保留。请检查网络后重试，或返回调整错题范围。" primary="重试生成" secondary="返回挑题" onPrimary={retryPreview} onSecondary={() => { if (onModify) onModify(); else setStage('review'); }} />, viewport);
  if (stage === 'saveFailed') return createPortal(<IssueDialog title="PDF 生成失败" description="尚未生成可用文件，因此不会写入“我的文件”。你可以重试或返回挑题。" primary="重试生成" secondary="返回挑题" onPrimary={generatePdf} onSecondary={() => setStage('review')} />, viewport);
  if (stage === 'completed') return createPortal(<IssueDialog success title="打印成功" description="试卷已打印，并保存在当前账户的“我的文件”中。" primary="返回学习" onPrimary={onClose} footnote={savedFileId ? '可在“我的 → 我的文件”中查看本次试卷' : undefined} />, viewport);

  return createPortal(
    <div className="absolute inset-0 z-[760] flex flex-col bg-slate-100 text-slate-900">
      {stage === 'review' || stage === 'saving' ? (
        <>
          <header className="flex h-[76px] shrink-0 items-center gap-4 border-b border-slate-200 bg-white px-5">
            <button type="button" onClick={() => onModify?.() ?? onClose()} aria-label={job.questionItems?.length ? '返回错题选择' : '返回组卷设置'} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-700 transition hover:bg-slate-100"><ChevronLeft size={22} /></button>
            <div className="min-w-0 flex-1"><h1 className="truncate text-[16px] font-semibold leading-6 text-slate-900">{job.title}</h1><p className="mt-0.5 truncate text-[10px] text-slate-400">试题列表</p></div>
            <div className="shrink-0 border-l border-slate-200 pl-4 text-right"><p className="whitespace-nowrap text-[12px] font-semibold text-violet-700">已保留 {selected.length}/{questions.length} 题</p><p className="mt-0.5 whitespace-nowrap text-[10px] text-slate-400">预计 {pages} 页</p></div>
            <button type="button" disabled={selected.length === 0} onClick={generatePdf} className="h-11 w-[150px] shrink-0 rounded-2xl bg-violet-600 px-5 text-[13px] font-semibold text-white shadow-sm shadow-violet-200 transition hover:bg-violet-700 disabled:opacity-40">生成 PDF</button>
          </header>
          <div className="h-10 shrink-0 border-b border-slate-100 bg-white px-5">
            <div className="mx-auto flex h-full max-w-[860px] items-center">
              <button type="button" onClick={() => { const shouldSelect = selected.length !== questions.length; setQuestions((items) => items.map((item) => ({ ...item, selected: shouldSelect }))); }} className="ml-auto px-2 py-1 text-[10px] font-medium text-slate-500 transition hover:text-violet-600">{selected.length === questions.length ? '取消全选' : '全选'}</button>
            </div>
          </div>
          <main className="min-h-0 flex-1 overflow-y-auto bg-gradient-to-b from-[#eef2ff] via-[#f7f8ff] to-slate-100 p-5">
            <section className="mx-auto flex w-full max-w-[860px] flex-col gap-3 pb-4">
              {questions.map((question, index) => <button key={question.id} type="button" aria-pressed={question.selected} onClick={() => setQuestions((items) => items.map((item) => item.id === question.id ? { ...item, selected: !item.selected } : item))} className={`group w-full rounded-[24px] border bg-white p-4 text-left shadow-sm transition-all hover:shadow-md ${question.selected ? 'border-white hover:border-violet-200' : 'border-slate-200 opacity-50'}`}><span className="flex items-start justify-between gap-4"><span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-2 text-[11px] font-semibold"><span className="mr-1 text-[14px] font-bold tabular-nums text-slate-800">{index + 1}.</span><span className="rounded-full bg-slate-900 px-2.5 py-0.5 text-white">{question.type}</span><span className="rounded-full border border-amber-100 bg-amber-50 px-2.5 py-0.5 text-amber-700">难度 中等</span>{question.knowledgePoint ? <span className="rounded-full border border-indigo-100 bg-indigo-50 px-2.5 py-0.5 text-indigo-600">{question.knowledgePoint}</span> : null}{question.errorReason ? <span className="rounded-full border border-rose-100 bg-rose-50 px-2.5 py-0.5 text-rose-600">错因：{question.errorReason}</span> : null}<span className="ml-auto shrink-0 whitespace-nowrap text-slate-400">{question.sourceLabel}</span></span>{question.imageUrl ? <img src={question.imageUrl} alt="题目配图" className="mt-3 max-h-[180px] max-w-full rounded-xl object-contain" /> : null}<span className="mt-3 block whitespace-pre-line text-[13px] font-medium leading-6 text-slate-800">{question.text}</span><QuestionPreviewBody type={question.type} options={question.options} /></span><span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border ${question.selected ? 'border-violet-600 bg-violet-600 text-white' : 'border-slate-300 bg-white'}`}>{question.selected ? <Check size={14} /> : null}</span></span></button>)}
            </section>
          </main>
        </>
      ) : (
        <>
          <header className="shrink-0 border-b border-slate-200 bg-white px-5 py-3">
            <div className="flex items-center gap-3"><button type="button" onClick={() => setStage('review')} aria-label="返回" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-700 hover:bg-slate-100"><ChevronLeft size={20} /></button><div className="mr-auto"><h1 className="text-[16px] font-semibold text-slate-900">打印预览</h1><p className="mt-0.5 text-[10px] text-slate-400">确认打印设置后开始打印</p></div><button type="button" onClick={() => setShowDevices(true)} className="flex h-10 min-w-[250px] items-center rounded-xl border border-slate-200 bg-white px-3 text-left"><Printer size={16} className="mr-2 text-blue-600" /><span className="min-w-0 flex-1"><span className="block truncate text-[12px] font-semibold">{printerName}</span><span className="block text-[9px] text-emerald-600">{deviceState === 'connected' ? '已连接 · IPP Everywhere' : '选择打印机'}</span></span><ChevronRight size={16} /></button><button type="button" onClick={() => submitPrint(false)} disabled={deviceState !== 'connected'} className="h-10 rounded-xl bg-blue-600 px-5 text-[13px] font-semibold text-white disabled:opacity-40">开始打印</button></div>
            <div className="mt-3 flex items-center gap-2 rounded-xl bg-slate-50 p-1.5"><CompactSetting label="份数" value={`${copies}`} onMinus={() => setCopies(Math.max(1, copies - 1))} onPlus={() => setCopies(Math.min(99, copies + 1))} /><SelectSetting label="范围" value={range} options={['全部页面', '当前页']} onChange={setRange} /><SelectSetting label="方向" value={orientation} options={['纵向', '横向']} onChange={setOrientation} /><SelectSetting label="纸张" value={paperSize} options={['A4', 'A3']} onChange={setPaperSize} /><SelectSetting label="单双面" value={duplex} options={['单面', '双面（长边）', '双面（短边）']} onChange={setDuplex} /><SelectSetting label="色彩" value={color} options={['黑白', '彩色']} onChange={setColor} /><div className="relative ml-auto shrink-0"><button type="button" aria-expanded={showExceptionDemos} onClick={() => setShowExceptionDemos((open) => !open)} className="flex h-9 items-center gap-1.5 rounded-lg px-3 text-[10px] font-medium text-slate-500 hover:bg-white hover:text-rose-500"><AlertTriangle size={13} />异常演示<ChevronRight size={11} className={`transition ${showExceptionDemos ? 'rotate-90' : ''}`} /></button>{showExceptionDemos ? <div className="absolute right-0 top-11 z-40 w-[230px] rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">{isMistakePrint ? <><p className="px-2 pb-1 pt-0.5 text-[9px] font-semibold text-slate-400">选题与预览</p><DemoAction label="达到 50 题上限" onClick={() => { setShowExceptionDemos(false); setStage('selectionLimit'); }} /><DemoAction label="部分题目不可打印" onClick={() => { setShowExceptionDemos(false); setStage('unavailableQuestions'); }} /><DemoAction label="预览生成失败" onClick={() => { setShowExceptionDemos(false); setStage('previewFailed'); }} /></> : <><p className="px-2 pb-1 pt-0.5 text-[9px] font-semibold text-slate-400">组卷</p><DemoAction label="组卷试题不足" onClick={() => { setShowExceptionDemos(false); setStage('shortage'); }} /><DemoAction label="今日组卷次数已达上限" onClick={() => { setShowExceptionDemos(false); setStage('dailyLimit'); }} /></>}<p className="mt-1 border-t border-slate-100 px-2 pb-1 pt-2 text-[9px] font-semibold text-slate-400">文件生成</p><DemoAction label="PDF 生成失败" onClick={() => { setShowExceptionDemos(false); setStage('saveFailed'); }} /><p className="mt-1 border-t border-slate-100 px-2 pb-1 pt-2 text-[9px] font-semibold text-slate-400">设备与打印</p><DemoAction label="打印机未连接" onClick={() => { setShowExceptionDemos(false); setDeviceState('idle'); setShowDevices(true); }} /><DemoAction label="未搜索到打印机" onClick={() => { setShowExceptionDemos(false); setDeviceState('empty'); setShowDevices(true); }} /><DemoAction label="连接打印机失败" onClick={() => { setShowExceptionDemos(false); setDeviceState('connectFailed'); setShowDevices(true); }} /><DemoAction label="打印中断失败" onClick={() => { setShowExceptionDemos(false); submitPrint(true); }} /></div> : null}</div></div>
          </header>
          <main className="relative flex min-h-0 flex-1 justify-center overflow-auto bg-slate-200/70 p-5"><div className="fixed bottom-6 right-5 z-10 rounded-xl bg-white/95 px-3 py-2 text-[11px] font-medium text-slate-600 shadow-sm">共 {selected.length} 题 · {pages} 页</div><div className="fixed bottom-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3 rounded-full bg-slate-900 px-4 py-2 text-white shadow-xl"><button onClick={() => setZoom(Math.max(55, zoom - 10))}><Minus size={15} /></button><span className="w-12 text-center text-[11px]">{zoom}%</span><button onClick={() => setZoom(Math.min(130, zoom + 10))}><Plus size={15} /></button></div><PaperSheet job={job} questions={selected} scale={zoom / 100} paperSize={paperSize} answerMode={answerMode} /></main>
        </>
      )}
      {stage === 'saving' ? <LoadingCard title="正在生成 PDF" description={`正在排版 ${selected.length} 道题…`} /> : null}
      {stage === 'failed' ? <IssueDialog title="打印失败，文件已保存" description="打印机连接中断，可稍后在“我的文件”中重新打印。" primary="查看我的文件" secondary="留在打印页" onPrimary={() => { onClose(); onOpenMyFiles?.(); }} onSecondary={() => setStage('print')} /> : null}
      {showDevices ? <DevicePanel state={deviceState} setState={setDeviceState} connectedPrinter={deviceState === 'connected' ? printerName : null} onSelect={(name) => { setPrinterName(name); setDeviceState('connecting'); window.setTimeout(() => { setDeviceState('connected'); setShowDevices(false); }, 700); }} onClose={() => setShowDevices(false)} /> : null}
    </div>, viewport,
  );
};

const LoadingCard = ({ title, description }: { title: string; description: string }) => <div className="absolute inset-0 z-[780] flex items-center justify-center bg-slate-950/35 backdrop-blur-[2px]"><div className="w-[360px] rounded-3xl bg-white p-7 text-center shadow-2xl"><LoaderCircle size={30} className="mx-auto animate-spin text-violet-600" /><h2 className="mt-4 text-[17px] font-semibold">{title}</h2><p className="mt-2 text-[13px] text-slate-500">{description}</p></div></div>;
const IssueDialog = ({ title, description, primary, secondary, onPrimary, onSecondary, success, footnote }: { title: string; description: string; primary: string; secondary?: string; onPrimary: () => void; onSecondary?: () => void; success?: boolean; footnote?: string }) => <div className="absolute inset-0 z-[790] flex items-center justify-center bg-slate-950/35 backdrop-blur-[2px]"><div className="w-[410px] rounded-3xl bg-white p-7 text-center shadow-2xl"><span className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${success ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{success ? <CheckCircle2 size={28} /> : <AlertTriangle size={28} />}</span><h2 className="mt-4 text-[19px] font-semibold">{title}</h2><p className="mt-2 text-[13px] leading-6 text-slate-500">{description}</p>{footnote ? <p className="mt-2 text-[11px] text-violet-600">{footnote}</p> : null}<button onClick={onPrimary} className="mt-6 h-11 w-full rounded-xl bg-blue-600 text-[14px] font-semibold text-white">{primary}</button>{secondary ? <button onClick={onSecondary} className="mt-2 h-10 w-full rounded-xl text-[13px] text-slate-600 hover:bg-slate-100">{secondary}</button> : null}</div></div>;
const CompactSetting = ({ label, value, onMinus, onPlus }: { label: string; value: string; onMinus: () => void; onPlus: () => void }) => <div className="flex h-9 shrink-0 items-center rounded-lg bg-slate-100 px-2"><span className="mr-2 text-[9px] text-slate-400">{label}</span><button onClick={onMinus}><Minus size={12} /></button><span className="w-6 text-center text-[11px] font-semibold">{value}</span><button onClick={onPlus}><Plus size={12} /></button></div>;
const DemoAction = ({ label, onClick }: { label: string; onClick: () => void }) => <button type="button" onClick={onClick} className="flex h-9 w-full items-center rounded-lg px-2 text-left text-[11px] font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-600"><AlertTriangle size={12} className="mr-2 shrink-0" />{label}</button>;
const SelectSetting = ({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) => {
  const [open, setOpen] = useState(false);
  return <div className="relative shrink-0"><button type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)} className="h-9 rounded-lg bg-slate-100 px-3 text-left"><span className="mr-2 text-[9px] text-slate-400">{label}</span><span className="text-[11px] font-semibold">{value}</span><ChevronRight size={11} className={`ml-1 inline transition ${open ? 'rotate-90' : ''}`} /></button>{open ? <div className="absolute left-0 top-11 z-30 min-w-full overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-xl">{options.map((option) => <button key={option} type="button" onClick={() => { onChange(option); setOpen(false); }} className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[11px] font-semibold ${option === value ? 'bg-violet-50 text-violet-700' : 'text-slate-600 hover:bg-slate-50'}`}><span>{option}</span>{option === value ? <Check size={12} /> : null}</button>)}</div> : null}</div>;
};

const QuestionPreviewBody = ({ type, options }: { type: string; options?: string[] }) => {
  if (options?.length) return <span className="mt-3 grid grid-cols-2 gap-x-8 gap-y-2 text-[12px] leading-6 text-slate-600">{options.map((option, index) => <span key={`${option}-${index}`}>{String.fromCharCode(65 + index)}. {option.replace(/<[^>]+>/g, '')}</span>)}</span>;
  if (type.includes('判断')) return <span className="mt-3 flex gap-8 text-[12px] text-slate-600"><span>○ 正确</span><span>○ 错误</span></span>;
  if (type.includes('填空')) return <span className="mt-5 block w-2/3 border-b border-slate-300" />;
  return <span className="mt-4 block space-y-4"><span className="block border-b border-dashed border-slate-300" /><span className="block border-b border-dashed border-slate-300" /></span>;
};

const PaperSheet = ({ job, questions, scale, paperSize, answerMode }: { job: PaperPrintJob; questions: PreviewQuestion[]; scale: number; paperSize: string; answerMode: 'paper_only' | 'paper_answer' | 'paper_answer_analysis' }) => <div style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }} className={`${paperSize === 'A3' ? 'min-h-[1470px] w-[1040px]' : 'min-h-[1040px] w-[735px]'} bg-white px-16 py-14 shadow-xl transition-[width,min-height]`}><h1 className="text-center text-xl font-bold">{job.title}</h1><div className="mt-3 flex justify-between border-b border-slate-800 pb-3 text-[11px]"><span>姓名：__________</span><span>{job.subject} · {paperSize} · 共 {questions.length} 题</span></div>{questions.map((question, index) => <div key={question.id} className="mt-6"><p className="text-[13px] font-semibold">{index + 1}. <span className="mr-2 rounded bg-slate-100 px-1.5 py-0.5 text-[9px] text-slate-500">{question.type}</span>{question.errorReason ? <span className="mr-2 rounded bg-rose-50 px-1.5 py-0.5 text-[9px] text-rose-600">错因：{question.errorReason}</span> : null}{question.text}</p>{question.options?.length ? <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-slate-600">{question.options.map((option, optionIndex) => <span key={`${question.id}-${optionIndex}`}>{String.fromCharCode(65 + optionIndex)}. {option.replace(/<[^>]+>/g, '')}</span>)}</div> : null}<div className="mt-3 h-10 border-b border-dashed border-slate-300" /></div>)}{answerMode !== 'paper_only' ? <section className="mt-12 border-t-2 border-slate-800 pt-5"><h2 className="text-center text-[16px] font-bold">参考答案{answerMode === 'paper_answer_analysis' ? '与解析' : ''}</h2><div className="mt-5 space-y-4">{questions.map((question, index) => <div key={`answer-${question.id}`} className="text-[11px] leading-5"><p><strong>{index + 1}.</strong> {question.correctAnswer || '答案略'}</p>{answerMode === 'paper_answer_analysis' ? <p className="mt-1 text-slate-500">解析：{question.explanation || '暂无解析'}</p> : null}</div>)}</div></section> : null}</div>;

const DevicePanel = ({ state, setState, connectedPrinter, onSelect, onClose }: { state: DeviceState; setState: (state: DeviceState) => void; connectedPrinter: string | null; onSelect: (name: string) => void; onClose: () => void }) => {
  const [pendingPrinter, setPendingPrinter] = useState<string | null>(null);
  const choosePrinter = (name: string) => {
    if (!connectedPrinter) { onSelect(name); return; }
    if (name === connectedPrinter) { onClose(); return; }
    setPendingPrinter(name);
  };
  return <div className="absolute inset-0 z-20 bg-slate-100"><header className="flex h-16 items-center border-b border-slate-200 bg-white px-5"><button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-slate-100"><X size={20} /></button><div className="ml-3"><h2 className="text-[17px] font-semibold">连接打印机</h2><p className="text-[10px] text-slate-400">{connectedPrinter ? `当前已连接：${connectedPrinter}` : '尚未连接打印机'} · 当前 Wi-Fi：AI-Classroom</p></div><button onClick={() => { setState('searching'); window.setTimeout(() => setState('results'), 900); }} className="ml-auto flex h-9 items-center gap-2 rounded-xl bg-blue-600 px-4 text-[12px] font-semibold text-white"><RefreshCw size={14} />重新搜索</button></header><main className="mx-auto max-w-[900px] p-6">{state === 'searching' ? <div className="rounded-2xl bg-white p-12 text-center"><Search size={32} className="mx-auto animate-pulse text-blue-600" /><p className="mt-3 text-sm font-semibold">正在搜索同一 Wi-Fi 下的打印机…</p></div> : state === 'empty' ? <div className="rounded-2xl bg-white p-10 text-center"><Wifi size={34} className="mx-auto text-slate-300" /><h3 className="mt-3 font-semibold">没有找到打印机</h3><p className="mt-2 text-[12px] leading-6 text-slate-500">请确认打印机已开机、与本机连接同一 Wi-Fi，或打开 Wi-Fi Direct 后重试。</p><button onClick={() => setState('results')} className="mt-4 rounded-xl bg-blue-600 px-5 py-2.5 text-[12px] font-semibold text-white">重新搜索</button></div> : state === 'connectFailed' ? <div className="rounded-2xl bg-white p-10 text-center"><AlertTriangle size={34} className="mx-auto text-amber-500" /><h3 className="mt-3 font-semibold">打印机连接失败</h3><p className="mt-2 text-[12px] leading-6 text-slate-500">设备无响应或网络连接已中断。请确认打印机在线，并保持在同一 Wi-Fi 下。</p><button onClick={() => { setState('searching'); window.setTimeout(() => setState('results'), 900); }} className="mt-4 rounded-xl bg-blue-600 px-5 py-2.5 text-[12px] font-semibold text-white">重新搜索</button></div> : <div className="space-y-3"><DeviceRow name="EPSON AM-C5000 Series" meta="IPP Everywhere · 在线 · 支持双面/彩色" connected={connectedPrinter === 'EPSON AM-C5000 Series'} onClick={() => choosePrinter('EPSON AM-C5000 Series')} /><DeviceRow name="HP LaserJet Pro MFP" meta="Mopria / IPPS · 在线 · 黑白" connected={connectedPrinter === 'HP LaserJet Pro MFP'} onClick={() => choosePrinter('HP LaserJet Pro MFP')} /></div>}</main>{pendingPrinter ? <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/35"><div className="w-[380px] rounded-3xl bg-white p-6 text-center shadow-2xl"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><Printer size={24} /></span><h3 className="mt-4 text-[17px] font-semibold">切换连接的打印机？</h3><p className="mt-2 text-[12px] leading-6 text-slate-500">当前已连接 {connectedPrinter}<br />确认切换到 {pendingPrinter}？</p><div className="mt-6 flex gap-3"><button type="button" onClick={() => setPendingPrinter(null)} className="h-10 flex-1 rounded-xl bg-slate-100 text-[13px] font-semibold text-slate-600">取消</button><button type="button" onClick={() => { const name = pendingPrinter; setPendingPrinter(null); onSelect(name); }} className="h-10 flex-1 rounded-xl bg-blue-600 text-[13px] font-semibold text-white">确认切换</button></div></div></div> : null}</div>;
};
const DeviceRow = ({ name, meta, connected, onClick }: { name: string; meta: string; connected?: boolean; onClick: () => void }) => <button onClick={onClick} className={`flex w-full items-center rounded-2xl border bg-white p-5 text-left shadow-sm ${connected ? 'border-emerald-200 ring-1 ring-emerald-100' : 'border-slate-100'}`}><span className={`flex h-11 w-11 items-center justify-center rounded-xl ${connected ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}><Printer size={22} /></span><span className="ml-4"><span className="flex items-center gap-2 text-[14px] font-semibold">{name}{connected ? <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-semibold text-emerald-600">已连接</span> : null}</span><span className="mt-1 block text-[11px] text-slate-400">{meta}</span></span>{connected ? <Check size={18} className="ml-auto text-emerald-500" /> : <ChevronRight className="ml-auto text-slate-400" />}</button>;
