import React, { useMemo, useState } from 'react';
import { Check, ChevronDown, ChevronLeft, FileText, Printer } from 'lucide-react';
import type { MistakeItem } from '../../types';
import { allQuestions } from '../../data/questionBank';
import { loadAcademicContext } from '../../services/academicContextStore';
import type { PaperPrintJob } from '../SubjectMap/PaperPrintFlow';

type AnswerMode = 'paper_only' | 'paper_answer' | 'paper_answer_analysis';

interface MistakePrintSetupProps {
  items: MistakeItem[];
  initialSubject?: string;
  onClose: () => void;
  onCreate: (job: PaperPrintJob) => void;
}

const answerOptions: Array<{ value: AnswerMode; label: string }> = [
  { value: 'paper_only', label: '仅试题' },
  { value: 'paper_answer', label: '试题 + 答案' },
  { value: 'paper_answer_analysis', label: '试题 + 答案 + 解析' },
];

const questionTypeLabel = (type?: string) => {
  if (type === 'single_choice') return '单选题';
  if (type === 'multiple_choice') return '多选题';
  if (type === 'fill_in_blank') return '填空题';
  if (type === 'true_false') return '判断题';
  return '题目';
};

const mistakeSources = ['智阅作业', '灵镜讲题', '个性化学习', '举一反三练习', '精准练习', '一课一练'];
const getMistakeSource = (item: MistakeItem) => {
  if (item.category === 'synchronous') return '一课一练';
  const hash = Array.from(item.id).reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return mistakeSources[hash % (mistakeSources.length - 1)];
};

export const MistakePrintSetup: React.FC<MistakePrintSetupProps> = ({ items, initialSubject, onClose, onCreate }) => {
  const availableSubjects = useMemo(() => Array.from(new Set(items.map((item) => item.subject))), [items]);
  const [subject, setSubject] = useState(initialSubject || '全部学科');
  const [status, setStatus] = useState<'all' | 'new' | 'reviewing' | 'mastered'>('all');
  const [reason, setReason] = useState('全部错因');
  const [source, setSource] = useState('全部来源');
  const [answerMode, setAnswerMode] = useState<AnswerMode>('paper_only');
  const [selectionNotice, setSelectionNotice] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set((initialIds ?? []).slice(0, 50)));

  const reasons = useMemo(() => Array.from(new Set(items.map((item) => item.errorType).filter(Boolean))), [items]);
  const filtered = useMemo(() => items.filter((item) => {
    if (subject !== '全部学科' && item.subject !== subject) return false;
    if (status !== 'all' && item.status !== status) return false;
    if (reason !== '全部错因' && item.errorType !== reason) return false;
    if (source !== '全部来源' && getMistakeSource(item) !== source) return false;
    return Boolean(item.fullQuestion || item.questionSnippet);
  }), [items, reason, source, status, subject]);

  const selectedItems = items.filter((item) => selectedIds.has(item.id)).slice(0, 50);
  const totalItems = items.filter((item) => (!initialSubject || item.subject === initialSubject) && Boolean(item.fullQuestion || item.questionSnippet)).length;
  const allFilteredSelected = filtered.length > 0 && filtered.every((item) => selectedIds.has(item.id));

  const toggleItem = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else if (next.size < 50) {
        next.add(id);
        setSelectionNotice(null);
      } else setSelectionNotice('单次最多打印 50 题，请取消部分已选题后再添加。');
      return next;
    });
  };

  const toggleCurrentResults = () => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (allFilteredSelected) {
        filtered.forEach((item) => next.delete(item.id));
        setSelectionNotice(null);
        return next;
      }
      let skipped = 0;
      filtered.forEach((item) => {
        if (next.has(item.id)) return;
        if (next.size < 50) next.add(item.id);
        else skipped += 1;
      });
      setSelectionNotice(skipped > 0 ? `已选满 50 题，另有 ${skipped} 题未加入。可取消部分已选题后再添加。` : null);
      return next;
    });
  };

  const clearFilters = () => {
    if (!initialSubject) setSubject('全部学科');
    setStatus('all');
    setReason('全部错因');
    setSource('全部来源');
  };

  const createJob = () => {
    if (!selectedItems.length) return;
    const selectedSubjects = Array.from(new Set(selectedItems.map((item) => item.subject)));
    const grade = loadAcademicContext().grade.trim() || '未设年级';
    const subjectLabel = selectedSubjects.length === 1 ? selectedSubjects[0] : '综合学科';
    const now = new Date();
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    onCreate({
      title: `${grade}·${subjectLabel}错题复习卷·${date}`,
      questionCount: selectedItems.length,
      subject: subjectLabel,
      answerMode,
      includeAnswerAnalysis: answerMode === 'paper_answer_analysis',
      questionItems: selectedItems.map((item) => {
        const originalId = item.id.startsWith('mist-') ? item.id.replace('mist-', '') : item.id;
        const original = allQuestions.find((question) => question.id === originalId);
        return {
          id: item.id,
          type: questionTypeLabel(item.questionType),
          text: original?.content?.stem || item.fullQuestion || item.questionSnippet,
          options: original?.content?.options,
          imageUrl: original?.content?.originalImageUrl || original?.content?.stemImages?.[0],
          knowledgePoint: item.knowledgePoints?.[0] || item.topic,
          sourceLabel: getMistakeSource(item),
          errorReason: item.errorType,
          correctAnswer: item.correctAnswer,
          explanation: item.analysis,
        };
      }),
    });
  };

  return <div className="absolute inset-0 z-[740] flex flex-col bg-[#f5f7fb] text-slate-900">
    <header className="flex min-h-[76px] shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-5 py-2">
      <button type="button" onClick={onClose} aria-label="返回" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200"><ChevronLeft size={20} /></button>
      <h1 className="min-w-[160px] text-[17px] font-semibold">打印错题</h1>
      <div className="ml-auto min-w-0 text-right">
        <p aria-label={`已选 ${selectedItems.length} 题，共 ${totalItems} 题`} className="text-[15px] font-semibold tabular-nums"><span className="font-bold text-indigo-600">{selectedItems.length}</span><span className="text-slate-600">/{totalItems}</span></p>
        {selectionNotice ? <p role="status" className="text-[10px] font-medium leading-4 text-amber-600">{selectionNotice}</p> : null}
      </div>
      <button type="button" onClick={createJob} disabled={!selectedItems.length} className="flex h-10 shrink-0 items-center gap-2 rounded-xl bg-indigo-600 px-4 text-[12px] font-semibold text-white disabled:opacity-40"><Printer size={15} />生成并预览PDF</button>
    </header>

    <div className="shrink-0 border-b border-slate-200 bg-white px-5 py-2.5">
      <div className="flex items-center gap-2 overflow-visible">
        <button type="button" onClick={toggleCurrentResults} disabled={!filtered.length} className="h-9 shrink-0 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-semibold text-indigo-600 transition-colors hover:border-indigo-200 hover:bg-indigo-50 disabled:text-slate-300">{allFilteredSelected ? '取消全选' : '全选'}</button>
        <FilterSelect label="学科" value={subject} disabled={Boolean(initialSubject)} options={initialSubject ? [initialSubject] : ['全部学科', ...availableSubjects]} onChange={setSubject} />
        <FilterSelect label="状态" value={status} options={['all', 'new', 'reviewing', 'mastered']} optionLabels={['全部状态', '未掌握', '待复习', '已掌握']} onChange={(value) => setStatus(value as typeof status)} />
        <FilterSelect label="错因" value={reason} options={['全部错因', ...reasons]} onChange={setReason} />
        <FilterSelect label="来源" value={source} options={['全部来源', ...mistakeSources]} onChange={setSource} />
        <AnswerModeSelect value={answerMode} onChange={setAnswerMode} />
      </div>
    </div>

    <main className="min-h-0 flex-1 overflow-y-auto p-5">
      {filtered.length ? <div className="mx-auto flex max-w-[940px] flex-col gap-3">{filtered.map((item) => {
        const selected = selectedIds.has(item.id);
        return <button key={item.id} type="button" onClick={() => toggleItem(item.id)} className={`rounded-2xl border bg-white p-4 text-left shadow-sm transition ${selected ? 'border-indigo-300 ring-2 ring-indigo-100' : 'border-slate-100'}`}>
          <span className="flex items-start gap-3"><span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${selected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300'}`}>{selected ? <Check size={13} /> : null}</span><span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-1.5 text-[9px]"><span className="rounded bg-slate-900 px-2 py-0.5 text-white">{item.subject}</span><span className="rounded bg-rose-50 px-2 py-0.5 text-rose-600">{item.errorType}</span><span className="rounded bg-sky-50 px-2 py-0.5 text-sky-600">{getMistakeSource(item)}</span><span className="text-slate-400">错 {item.wrongAttempts ?? item.stats?.errorCount ?? 1} 次</span></span><span className="mt-2 block line-clamp-3 text-[12px] font-medium leading-5 text-slate-800">{item.fullQuestion || item.questionSnippet}</span><span className="mt-2 block text-[10px] text-indigo-500">#{item.knowledgePoints?.[0] || item.topic}</span></span></span>
        </button>;
      })}</div> : <div className="mx-auto mt-20 max-w-sm text-center"><FileText size={32} className="mx-auto text-slate-300" /><h2 className="mt-3 text-[15px] font-semibold">当前条件下没有错题</h2><p className="mt-1 text-[11px] text-slate-400">请调整筛选条件后再试</p><button type="button" onClick={clearFilters} className="mt-4 h-9 rounded-xl bg-indigo-50 px-4 text-[11px] font-semibold text-indigo-600">清除筛选</button></div>}
    </main>

  </div>;
};

const FilterSelect = ({ label, value, options, optionLabels, disabled, onChange }: { label: string; value: string; options: string[]; optionLabels?: string[]; disabled?: boolean; onChange: (value: string) => void }) => {
  const [open, setOpen] = useState(false);
  const selectedIndex = Math.max(0, options.indexOf(value));
  const selectedLabel = optionLabels?.[selectedIndex] || value;
  return <div className={`relative shrink-0 ${disabled ? 'opacity-70' : ''}`}>
    <button type="button" disabled={disabled} aria-expanded={open} onClick={() => setOpen((current) => !current)} className="flex h-9 items-center rounded-lg bg-slate-100 px-2.5 text-left disabled:cursor-not-allowed"><span className="mr-1.5 text-[9px] text-slate-400">{label}</span><span className="max-w-[145px] truncate text-[10px] font-semibold text-slate-800">{selectedLabel}</span><ChevronDown size={12} className={`ml-1.5 text-slate-500 transition ${open ? 'rotate-180' : ''}`} /></button>
    {open ? <div className="absolute left-0 top-11 z-50 min-w-full w-max max-w-[240px] rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">{options.map((option, index) => { const optionLabel = optionLabels?.[index] || option; const active = option === value; return <button key={option} type="button" onClick={() => { onChange(option); setOpen(false); }} className={`flex h-9 w-full items-center rounded-lg px-3 text-left text-[10px] font-semibold ${active ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}><span className="flex-1 whitespace-nowrap">{optionLabel}</span>{active ? <Check size={12} className="ml-3" /> : null}</button>; })}</div> : null}
  </div>;
};

const AnswerModeSelect = ({ value, onChange }: { value: AnswerMode; onChange: (value: AnswerMode) => void }) => {
  const [open, setOpen] = useState(false);
  const current = answerOptions.find((option) => option.value === value) ?? answerOptions[0];
  return <div className="relative shrink-0">
    <button type="button" aria-expanded={open} onClick={() => setOpen((currentOpen) => !currentOpen)} className="flex h-9 items-center rounded-lg bg-slate-100 px-2.5 text-left"><span className="mr-1.5 text-[9px] text-slate-400">打印内容</span><span className="text-[10px] font-semibold text-slate-800">{current.label}</span><ChevronDown size={12} className={`ml-1.5 text-slate-500 transition ${open ? 'rotate-180' : ''}`} /></button>
    {open ? <div className="absolute right-0 top-11 z-50 w-[180px] rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">{answerOptions.map((option) => <button key={option.value} type="button" onClick={() => { onChange(option.value); setOpen(false); }} className={`flex h-9 w-full items-center rounded-lg px-3 text-left text-[10px] font-semibold ${option.value === value ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}><span className="flex-1">{option.label}</span>{option.value === value ? <Check size={12} /> : null}</button>)}</div> : null}
  </div>;
};
