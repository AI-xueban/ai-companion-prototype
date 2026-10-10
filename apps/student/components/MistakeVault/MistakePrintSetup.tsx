import React, { useMemo, useState } from 'react';
import { Check, ChevronDown, ChevronLeft, FileText, Printer, X } from 'lucide-react';
import type { MistakeItem } from '../../types';
import { allQuestions } from '../../data/questionBank';
import type { PaperPrintJob } from '../SubjectMap/PaperPrintFlow';

type AnswerMode = 'paper_only' | 'paper_answer' | 'paper_answer_analysis';

interface MistakePrintSetupProps {
  items: MistakeItem[];
  initialSubject?: string;
  initialIds?: string[];
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

const mistakeSources = ['智阅作业', '灵镜讲题', '个性化学习', '相似题练习', '精准练习', '一课一练'];
const getMistakeSource = (item: MistakeItem) => {
  if (item.category === 'synchronous') return '一课一练';
  const hash = Array.from(item.id).reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return mistakeSources[hash % (mistakeSources.length - 1)];
};

export const MistakePrintSetup: React.FC<MistakePrintSetupProps> = ({ items, initialSubject, initialIds, onClose, onCreate }) => {
  const availableSubjects = useMemo(() => Array.from(new Set(items.map((item) => item.subject))), [items]);
  const [subject, setSubject] = useState(initialSubject || '全部学科');
  const [status, setStatus] = useState<'all' | 'new' | 'reviewing' | 'mastered'>('all');
  const [reason, setReason] = useState('全部错因');
  const [source, setSource] = useState('全部来源');
  const [answerMode, setAnswerMode] = useState<AnswerMode>('paper_only');
  const [selectionNotice, setSelectionNotice] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    if (initialIds?.length) return new Set(initialIds);
    return new Set(items.filter((item) => !initialSubject || item.subject === initialSubject).slice(0, 50).map((item) => item.id));
  });

  const reasons = useMemo(() => Array.from(new Set(items.map((item) => item.errorType).filter(Boolean))), [items]);
  const filtered = useMemo(() => items.filter((item) => {
    if (subject !== '全部学科' && item.subject !== subject) return false;
    if (status !== 'all' && item.status !== status) return false;
    if (reason !== '全部错因' && item.errorType !== reason) return false;
    if (source !== '全部来源' && getMistakeSource(item) !== source) return false;
    return Boolean(item.fullQuestion || item.questionSnippet);
  }), [items, reason, source, status, subject]);

  const selectedItems = items.filter((item) => selectedIds.has(item.id)).slice(0, 50);
  const allFilteredSelected = filtered.length > 0 && filtered.every((item) => selectedIds.has(item.id));
  const filteredSelectedCount = filtered.filter((item) => selectedIds.has(item.id)).length;
  const estimatedPages = Math.max(1, Math.ceil(selectedItems.length / 6) + (answerMode === 'paper_only' ? 0 : 1));

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
    const date = new Date().toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
    onCreate({
      title: `${selectedSubjects.length === 1 ? selectedSubjects[0] : '综合'}错题复习卷·${date}`,
      questionCount: selectedItems.length,
      subject: selectedSubjects.length === 1 ? selectedSubjects[0] : '综合',
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
    <header className="flex h-16 shrink-0 items-center border-b border-slate-200 bg-white px-5">
      <button type="button" onClick={onClose} aria-label="返回" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-slate-100"><ChevronLeft size={20} /></button>
      <div className="ml-3"><h1 className="text-[17px] font-semibold">打印错题</h1><p className="text-[10px] text-slate-400">选择需要打印的错题范围</p></div>
      <button type="button" onClick={onClose} aria-label="关闭" className="ml-auto flex h-9 w-9 items-center justify-center rounded-full hover:bg-slate-100"><X size={18} /></button>
    </header>

    <div className="shrink-0 border-b border-slate-200 bg-white px-5 py-2.5">
      <div className="flex items-center gap-2 overflow-visible">
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

    <footer className="shrink-0 border-t border-slate-200 bg-white px-5 py-3"><div className="mx-auto flex max-w-[940px] items-center"><div><p className="text-[13px] font-semibold">已选 {selectedItems.length} 题 · 预计 {estimatedPages} 页</p><p className={`mt-0.5 text-[10px] ${selectionNotice ? 'font-medium text-amber-600' : 'text-slate-400'}`}>{selectionNotice || `当前结果已选 ${filteredSelectedCount}/${filtered.length} 题 · 切换筛选会保留已选题`}</p></div><button type="button" onClick={toggleCurrentResults} disabled={!filtered.length} className="ml-auto h-10 px-4 text-[11px] font-semibold text-slate-500 disabled:opacity-40">{allFilteredSelected ? '取消选择当前结果' : '全选当前结果'}</button><button type="button" onClick={createJob} disabled={!selectedItems.length} className="flex h-11 items-center gap-2 rounded-xl bg-indigo-600 px-5 text-[12px] font-semibold text-white disabled:opacity-40"><Printer size={15} />下一步：预览错题</button></div></footer>
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
