import React, { useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { MistakeItem } from '../../types';

interface BatchCorrectionSelectionPageProps {
  items: MistakeItem[];
  subject: string;
  maxQuestions: number;
  onBack: () => void;
  onStart: (items: MistakeItem[]) => void;
}

export const BatchCorrectionSelectionPage: React.FC<BatchCorrectionSelectionPageProps> = ({ items, subject, maxQuestions, onBack, onStart }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const selectedItems = items.filter((item) => selectedIds.has(item.id));
  const allSelected = selectedIds.size === Math.min(items.length, maxQuestions);

  const toggleSelection = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else if (next.size < maxQuestions) next.add(id);
      return next;
    });
  };

  return (
    <section className="flex flex-1 min-h-0 flex-col bg-gray-50" aria-label="批量订正选题">
      <header className="shrink-0 border-b border-slate-100 bg-white px-4 py-4 md:px-6 lg:px-8">
        <div className="mx-auto flex max-w-4xl items-center gap-3">
          <button type="button" onClick={onBack} aria-label="返回错题列表" className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-600"><ChevronLeft size={20} /></button>
          <div><h2 className="text-lg font-semibold text-slate-900">选择订正题目</h2><p className="mt-1 text-xs text-slate-500">{subject} · 勾选本次想订正的错题，最多 {maxQuestions} 题</p></div>
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-3">
          <div className="flex items-center justify-between text-sm"><span className="text-slate-500">共 {items.length} 道可订正题目</span><button type="button" onClick={() => setSelectedIds(allSelected ? new Set() : new Set(items.slice(0, maxQuestions).map((item) => item.id)))} className="font-semibold text-indigo-600">{allSelected ? '取消全选' : items.length > maxQuestions ? `选择前 ${maxQuestions} 题` : '全选'}</button></div>
          {items.map((item, index) => {
            const selected = selectedIds.has(item.id);
            const disabled = !selected && selectedIds.size >= maxQuestions;
            return (
              <label key={item.id} className={`flex items-start gap-4 rounded-2xl border p-5 transition-colors ${selected ? 'border-indigo-400 bg-indigo-50/60' : 'border-slate-200 bg-white'} ${disabled ? 'opacity-50' : 'cursor-pointer'}`}>
                <input type="checkbox" checked={selected} disabled={disabled} onChange={() => toggleSelection(item.id)} aria-label={`选择第 ${index + 1} 题：${item.questionSnippet}`} className="mt-1 h-5 w-5 shrink-0 accent-indigo-600" />
                <div className="min-w-0 flex-1"><div className="mb-3 flex items-center gap-2 text-xs"><span className="rounded-lg bg-slate-100 px-2 py-1 font-semibold text-slate-600">第 {index + 1} 题</span><span className="rounded-lg bg-amber-50 px-2 py-1 text-amber-700">难度 {item.difficulty}</span><span className="text-slate-400">{item.status === 'reviewing' ? '待复习' : '待攻克'}</span></div><p className="text-sm font-medium leading-relaxed text-slate-900">{item.questionSnippet}</p></div>
              </label>
            );
          })}
        </div>
      </div>
      <footer className="shrink-0 border-t border-slate-200 bg-white px-4 py-4 md:px-6 lg:px-8">
        <div className="mx-auto flex max-w-4xl items-center gap-4"><div className="mr-auto"><p className="text-sm font-semibold text-slate-800" aria-live="polite">已选 {selectedItems.length} 题</p><p className="mt-1 text-xs text-slate-400">{selectedIds.size >= maxQuestions ? '已达到单次选题上限' : '选好题目后开始订正'}</p></div><button type="button" disabled={!selectedItems.length} onClick={() => onStart(selectedItems)} className="rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 px-8 py-3 text-sm font-semibold text-white disabled:opacity-40">开始订正{selectedItems.length ? `（${selectedItems.length}）` : ''}</button></div>
      </footer>
    </section>
  );
};
