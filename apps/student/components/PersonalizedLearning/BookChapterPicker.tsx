import React, { useRef, useState } from 'react';
import { BookOpen, ChevronDown, ChevronRight, RotateCcw, X } from 'lucide-react';
import type { Catalog } from './bookLearningGraph';

export function BookChapterPicker({ chapters, selectedId, onSelect, onClearChapter }: {
  chapters: Catalog[]; selectedId?: string; onSelect: (section: Catalog) => void; onClearChapter?: (chapter: Catalog) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const selectedChapter = chapters.find(chapter => chapter.id === selectedId || chapter.children.some(section => section.id === selectedId));
  const selectedSection = selectedChapter?.children.find(section => section.id === selectedId) ?? selectedChapter;
  const [browsingId, setBrowsingId] = useState('');
  const chapter = chapters.find(item => item.id === browsingId) ?? selectedChapter ?? chapters[0];
  const sections = chapter ? (chapter.children.length ? chapter.children : [chapter]) : [];
  return <>
    <button type="button" className="bkl-chapter-selector" aria-label="选择章节" aria-haspopup="dialog" onClick={() => {
      setBrowsingId(selectedChapter?.id ?? chapters[0]?.id ?? '');
      dialog.current?.showModal();
    }}>
      <BookOpen size={19} aria-hidden="true" />
      <span title={selectedSection?.name}>
        <strong>{selectedSection?.name ?? '选择章节'}</strong>
      </span>
      <span className="bkl-selector-hint">切换</span><ChevronDown size={15} aria-hidden="true" />
    </button>
    <dialog ref={dialog} className="bkl-chapter-dialog" aria-labelledby="bkl-chapter-picker-title" onClick={event => {
      if (event.target !== event.currentTarget) return;
      const rect = event.currentTarget.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) event.currentTarget.close();
    }}>
      <header><div><h2 id="bkl-chapter-picker-title">教材目录</h2><p>先选章节，再选择要学习的内容</p></div><button type="button" aria-label="关闭教材目录" onClick={() => dialog.current?.close()}><X size={19} /></button></header>
      <div className="bkl-chapter-picker-body">
        <nav aria-label="章节列表">{chapters.map(item => <button key={item.id} type="button" aria-pressed={chapter?.id === item.id} onClick={() => setBrowsingId(item.id)}>{item.name}<ChevronRight size={14} aria-hidden="true" /></button>)}</nav>
        <section aria-label="课节列表"><div className="bkl-chapter-section-heading"><h3>{chapter?.name}</h3>{chapter && onClearChapter && <button type="button" className="bkl-clear-chapter" title="原型演示：将本章知识点恢复为未知状态" onClick={() => { onClearChapter(chapter); dialog.current?.close(); }}><RotateCcw size={13} aria-hidden="true" />清空本章学习状态（演示用）</button>}</div>{sections.map(section => <button key={section.id} type="button" aria-pressed={selectedId === section.id} onClick={() => { onSelect(section); dialog.current?.close(); }}><span>{section.name}</span><ChevronRight size={15} aria-hidden="true" /></button>)}</section>
      </div>
    </dialog>
  </>;
}
