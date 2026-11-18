import React, { useEffect, useRef, useState } from 'react';
import { Minus, Plus, X } from 'lucide-react';
import type { AISolveQuestion } from '../../data/aiSolveMockData';

export interface TutorFigure { type: 'image'; id: string; src: string; caption: string }
export function getTutorFigures(question: AISolveQuestion): TutorFigure[] {
  const figures = question.materials?.filter((m): m is TutorFigure => m.type === 'image') || [];
  return figures.length ? figures : question.imageSrc ? [{ type: 'image', id: 'original', src: question.imageSrc, caption: '原题图片' }] : [];
}

/** On a multi-question page, quote only the existing selected region on the board. */
export function TutorFigurePreview({ figure, region }: { figure: TutorFigure; region?: AISolveQuestion['region'] }) {
  const [ratio, setRatio] = useState(1);
  if (!region || region.width <= 0 || region.height <= 0) return <img src={figure.src} alt={figure.caption} />;
  return <div className="tb-source-crop" style={{ aspectRatio: ratio * region.width / region.height }}>
    <img src={figure.src} alt="当前题目在原页中的区域" onLoad={e => setRatio(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight)} style={{ position: 'absolute', width: `${10000 / region.width}%`, maxWidth: 'none', maxHeight: 'none', height: 'auto', left: `${-region.left / region.width * 100}%`, top: `${-region.top / region.height * 100}%` }} />
  </div>;
}

interface OriginalProps {
  id: string;
  question: AISolveQuestion;
  active: string;
  completed: string[];
  scrollPosition: React.MutableRefObject<number>;
  customContent?: React.ReactNode;
  onOpenImage: (index: number) => void;
  onSelect: (id: string) => void;
}

export function TutorOriginalPanel({ id, question, active, completed, scrollPosition, customContent, onOpenImage, onSelect }: OriginalProps) {
  const scroll = useRef<HTMLDivElement>(null);
  const figures = getTutorFigures(question);
  useEffect(() => {
    if (scroll.current) scroll.current.scrollTop = scrollPosition.current;
  }, [scrollPosition]);

  return <section id={id} className="tb-original-panel" aria-label="完整原题" ref={scroll}
    onScroll={event => { scrollPosition.current = event.currentTarget.scrollTop; }} tabIndex={0}>
    {customContent || <>
      {!question.materials?.some(material => material.type === 'text') && <p className="tb-original-stem">{question.text}</p>}
      {question.materials ? question.materials.map((material, index) => material.type === 'text'
        ? <p key={index}>{material.text}</p>
        : <figure key={material.id}>
          <button type="button" onClick={() => onOpenImage(figures.findIndex(figure => figure.id === material.id))} aria-label={`放大${material.caption}`}>
            <img src={material.src} alt={material.caption} />
          </button>
          <figcaption>{material.caption}</figcaption>
        </figure>
      ) : figures.map((figure, index) => <figure key={figure.id}>
        <button type="button" onClick={() => onOpenImage(index)} aria-label={`放大${figure.caption}`}><img src={figure.src} alt={figure.caption} /></button>
      </figure>)}
      {question.materials?.some(material => material.type === 'text') && <p className="tb-original-stem">{question.text}</p>}
    </>}
    {question.subQuestions?.map(part => <div className="tb-original-question" key={part.id}>
      <strong>{part.label}</strong><p>{part.text}</p>
      <button type="button" className="tb-button" onClick={() => onSelect(part.id)}>{active === part.id ? '回到这一问' : `讲解${part.label}`}{completed.includes(part.id) ? ' · 已完成' : ''}</button>
    </div>)}
  </section>;
}

export function TutorImageViewer({ question, imageIndex, onClose }: { question: AISolveQuestion; imageIndex: number; onClose: () => void }) {
  const [selectedImage, setSelectedImage] = useState(imageIndex);
  const [zoom, setZoom] = useState(1);
  const dialog = useRef<HTMLDivElement>(null);
  const figures = getTutorFigures(question);
  const figure = figures[selectedImage];

  useEffect(() => {
    dialog.current?.querySelector<HTMLButtonElement>('button')?.focus();
  }, []);

  if (!figure) return null;
  return <div className="tb-reader" ref={dialog} role="dialog" aria-modal="true" aria-label="查看原图" onKeyDown={event => {
    if (event.key === 'Escape') { event.stopPropagation(); onClose(); }
    if (event.key === 'Tab') {
      const items = Array.from(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled),[tabindex="0"]') || []);
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  }}>
    <header className="tb-reader-header">
      <button type="button" className="tb-icon" aria-label="关闭原图" onClick={onClose}><X size={20} /></button>
      <strong>{figure.caption}</strong>
    </header>
    <nav className="tb-image-tools" aria-label="图片工具">
      {figures.length > 1 && <div className="tb-row">{figures.map((item, index) => <button key={item.id} className="tb-button" aria-pressed={selectedImage === index} onClick={() => { setSelectedImage(index); setZoom(1); }}>{item.caption}</button>)}</div>}
      <div className="tb-row">
        <button className="tb-icon" aria-label="缩小图片" disabled={zoom <= 1} onClick={() => setZoom(value => Math.max(1, value - .25))}><Minus size={18} /></button>
        <button className="tb-button" aria-label="还原图片比例" onClick={() => setZoom(1)}>{Math.round(zoom * 100)}%</button>
        <button className="tb-icon" aria-label="放大图片" disabled={zoom >= 3} onClick={() => setZoom(value => Math.min(3, value + .25))}><Plus size={18} /></button>
      </div>
    </nav>
    <div className="tb-image-scroll" key={selectedImage} tabIndex={0}><img src={figure.src} alt={figure.caption} style={{ width: `${zoom * 100}%`, maxWidth: 'none' }} /></div>
  </div>;
}