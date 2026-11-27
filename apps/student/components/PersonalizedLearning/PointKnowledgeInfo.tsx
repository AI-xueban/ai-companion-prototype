import React, { useEffect, useId, useMemo, useRef } from 'react';
import { Lightbulb, Star, X } from 'lucide-react';
import { getPointDifficulty, sanitizePointDescription, type PointKnowledgeDetails } from './pointKnowledgeDetails';

export function PointKnowledgeInfo({ pointId, name, details }: { pointId: string; name: string; details?: PointKnowledgeDetails }) {
  const descriptionDialog = useRef<HTMLDialogElement>(null);
  const uid = useId();
  const difficulty = getPointDifficulty(details);
  const description = useMemo(() => details?.desc ? sanitizePointDescription(details.desc) : '', [details?.desc]);
  useEffect(() => { descriptionDialog.current?.close(); }, [pointId]);
  const closeBackdrop = (event: React.MouseEvent<HTMLDialogElement>) => {
    if (event.target !== event.currentTarget) return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) event.currentTarget.close();
  };
  return <>
    <div className="bkl-point-knowledge-info">
      {difficulty.stars != null ? <div className="bkl-point-stars" aria-label={`知识点难度${difficulty.stars}星，1星最容易，5星最难`}>
        <span>难度分布</span><span className="bkl-star-icons" aria-hidden="true">{difficulty.counts.map((_, index) => <i key={index}><Star size={13} fill="currentColor" /><b style={{ width: index < difficulty.stars! ? '100%' : '0%' }}><Star size={13} fill="currentColor" /></b></i>)}</span><strong>{difficulty.stars}</strong>
      </div> : <span className="bkl-point-no-difficulty">暂无难度分布</span>}
      <button type="button" className="bkl-point-description-trigger" disabled={!description} aria-label={`查看${name}知识点说明`} title={description ? '查看概念、性质和方法' : '暂无知识点说明'} onClick={() => descriptionDialog.current?.showModal()}><Lightbulb size={18} /></button>
    </div>
    <dialog ref={descriptionDialog} className="bkl-knowledge-dialog" aria-labelledby={`${uid}-description`} onClick={closeBackdrop}>
      <header><div><h2 id={`${uid}-description`}><Lightbulb size={19} />{name}</h2><p>概念 · 性质 · 方法</p></div><button type="button" aria-label="关闭知识点说明" onClick={() => descriptionDialog.current?.close()}><X size={20} /></button></header>
      <div className="bkl-point-description-content" dangerouslySetInnerHTML={{ __html: description }} />
    </dialog>
  </>;
}
