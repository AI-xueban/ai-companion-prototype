import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';
import type { Point } from './bookLearningGraph';
import { getPointTrace, type TracePoint } from './pointTrace';
import { pointColors } from './PointLearningCard';
import { getPointHealth, readBookPointProgress } from '../../services/bookKnowledgeProgress';
import { selectPointMistakes } from '../../services/knowledgePointMistakes';
import type { MistakeItem } from '../../types';
import './knowledgeTracePage.css';

const affiliationLoaders = import.meta.glob('../../data/learning-books/point-affiliations/*.json');

type Props = {
  origin: Point; selected: Point; onSelect: (point: Point) => void; subject: string; code: string;
  context: string; commonTypes: Record<string, string[]>; mistakes: MistakeItem[];
  onBack: () => void; onLearn: (point: Point) => void; onCorrect: (point: Point) => void;
};

export function KnowledgeTracePage(props: Props) {
  const [affiliations, setAffiliations] = useState<Record<string, [string, string, string][]>>({});
  const [affiliationLoading, setAffiliationLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    setAffiliations({}); setAffiliationLoading(true);
    const loader = affiliationLoaders[`../../data/learning-books/point-affiliations/${props.code}.json`];
    (loader ? loader() : Promise.resolve({ default: {} })).then(module => { if (!cancelled) setAffiliations((module as { default: Record<string, [string, string, string][]> }).default); }).catch(() => { if (!cancelled) setAffiliations({}); }).finally(() => { if (!cancelled) setAffiliationLoading(false); });
    return () => { cancelled = true; };
  }, [props.code]);
  const [chain, setChain] = useState<TracePoint[]>([]);
  const selectedNode = useRef<HTMLLIElement>(null);
  const routeScroll = useRef<HTMLDivElement>(null);
  const lastVisibleNode = useRef<HTMLLIElement>(null);
  const revealNext = useRef(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [visibleCount, setVisibleCount] = useState(2);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const selected = chain.slice(1, visibleCount).find(node => node.id === props.selected.id);
  const locations = selected ? affiliations[selected.id] : undefined;
  const location = locations?.[0];
  useEffect(() => {
    setDetailsOpen(true);
  }, [props.selected.id]);
  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError(false);
    import('../../data/learning-books/point-trace-index.json').then(module => {
      if (cancelled) return;
      const index = (module.default as Record<string, Record<string, TracePoint>>)[props.code] ?? {};
      const nextChain = getPointTrace(index, props.origin);
      setChain(nextChain);
      const nextSelected = nextChain.slice(1).find(node => node.id === props.selected.id) ?? nextChain[1];
      setVisibleCount(Math.max(2, nextChain.findIndex(node => node.id === nextSelected?.id) + 1));
      if (nextSelected && nextSelected.id !== props.selected.id) props.onSelect(nextSelected);
    }).catch(() => { if (!cancelled) setError(true); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [props.code, props.origin.id, retry]);
  useEffect(() => {
    if (revealNext.current) return;
    selectedNode.current?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
  }, [chain, props.selected.id, loading, detailsOpen]);
  useEffect(() => {
    if (!revealNext.current) return;
    revealNext.current = false;
    const viewport = routeScroll.current;
    const node = lastVisibleNode.current;
    if (!viewport || !node) return;
    const distance = node.getBoundingClientRect().bottom - viewport.getBoundingClientRect().bottom + 14;
    if (distance > 0) viewport.scrollBy({ top: distance, behavior: 'smooth' });
  }, [visibleCount]);
  const health = getPointHealth(selected ? readBookPointProgress(props.context, selected.id) : {});
  const pending = selected ? selectPointMistakes(props.mistakes, props.subject, selected.name) : [];
  const toggleNext = (index: number) => {
    if (index + 1 < visibleCount) {
      revealNext.current = false;
      setVisibleCount(index + 1);
      if (chain.findIndex(node => node.id === props.selected.id) > index) props.onSelect(chain[Math.max(1, index)]);
    } else {
      revealNext.current = true;
      setVisibleCount(index + 2);
      setDetailsOpen(true);
      props.onSelect(chain[index + 1]);
    }
  };
  return <div className="bkl-trace-page">
    <header className="bkl-trace-header"><button onClick={props.onBack} aria-label="返回知识图谱"><ArrowLeft size={20} /></button><h1>知识点溯源</h1><small>{loading ? '加载中' : `${Math.max(0, chain.length - 1)} 个前序知识点`}</small></header>
      <main className="bkl-trace-route" aria-label="溯源知识路径">
        <div ref={routeScroll} className="bkl-trace-route-scroll">
          {loading ? <p className="bkl-trace-empty">正在读取知识路径…</p> : error ? <div className="bkl-trace-empty"><p>知识路径加载失败</p><button onClick={() => setRetry(n => n + 1)}>重新加载</button></div> : !chain.length ? <p className="bkl-trace-empty">暂无该知识点的溯源数据</p> : <>
            <ol>{chain.slice(0, visibleCount).map((node, i) => {
              const status = getPointHealth(readBookPointProgress(props.context, node.id)).status;
              const isSelected = selected?.id === node.id;
              const isOrigin = node.id === props.origin.id;
              const isExpanded = i + 1 < visibleCount;
              const hasNext = i < chain.length - 1;
              const isDetailOpen = isSelected && detailsOpen;
              return <li key={node.id} className={`${hasNext ? 'has-next' : ''} ${isExpanded ? 'is-path-open' : ''} ${isOrigin ? 'is-origin' : ''}`} ref={element => { if (isSelected) selectedNode.current = element; if (i === Math.min(visibleCount, chain.length) - 1) lastVisibleNode.current = element; }}>
                <i className="bkl-trace-dot" style={{ background: isOrigin ? '#b9bbc5' : pointColors[status] }} aria-hidden="true" />
                <article className={`bkl-trace-point ${isSelected ? 'is-selected' : ''} ${isOrigin ? 'is-origin' : ''}`}>
                <button className="bkl-trace-step" aria-label={`${node.name}${isOrigin ? '，当前学习' : ''}`} aria-pressed={isSelected} aria-expanded={isOrigin ? undefined : isDetailOpen} disabled={isOrigin} onClick={isOrigin ? undefined : () => { if (isSelected) setDetailsOpen(open => !open); else { setDetailsOpen(true); props.onSelect(node); } }}>
                <strong title={node.name}>{node.name}</strong>
                {isOrigin ? <span className="bkl-trace-origin">当前学习</span> : isDetailOpen ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
                </button>
                {isDetailOpen && selected && <div className="bkl-trace-details" aria-label={`${node.name}学习详情`}>
                  <div className="bkl-trace-academic">{location ? <><strong>{location[0]} · {location[1]}</strong></> : <span>{affiliationLoading ? '正在读取教材归属…' : '暂无教材归属数据'}</span>}</div>
                  <div className="bkl-trace-detail-bottom"><div className="bkl-trace-summary"><div><span>健康分 <b style={{ color: pointColors[health.status] }}>{health.score == null ? '—' : Math.round(health.score * 10) / 10}</b></span>{!!props.commonTypes[selected.id]?.length && <span>常考：{props.commonTypes[selected.id].join('、')}</span>}</div><p>待攻克 {health.weak}　待复习 {health.reviewing}　已掌握 {health.mastered}</p></div><div className="bkl-trace-actions">{!!pending.length && <button onClick={() => props.onCorrect(selected)}>订正错题（{pending.length}）</button>}<button className="bkl-trace-learn" onClick={() => props.onLearn(selected)}>去学习 →</button></div></div>
                </div>}
                </article>
                {hasNext && <button className="bkl-trace-toggle" aria-expanded={isExpanded} aria-label={`${isExpanded ? '收起' : '展开'}${node.name}的前序知识点`} onClick={() => toggleNext(i)}>{isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</button>}
              </li>;
            })}</ol>
          </>}
        </div>
      </main>
  </div>;
}
