import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronUp, ChevronRight, Compass } from 'lucide-react';
import type { Point } from './bookLearningGraph';
import { getPointTrace, type TracePoint } from './pointTrace';
import { PointLearningCard, pointColors } from './PointLearningCard';
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
  const selected = chain.find(node => node.id === props.selected.id);
  const selectedNode = useRef<HTMLButtonElement>(null);
  const routeScroll = useRef<HTMLDivElement>(null);
  const lastVisibleNode = useRef<HTMLLIElement>(null);
  const revealNext = useRef(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [visibleCount, setVisibleCount] = useState(2);
  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError(false);
    import('../../data/learning-books/point-trace-index.json').then(module => {
      if (cancelled) return;
      const index = (module.default as Record<string, Record<string, TracePoint>>)[props.code] ?? {};
      const nextChain = getPointTrace(index, props.origin);
      setChain(nextChain);
      setVisibleCount(Math.max(2, nextChain.findIndex(node => node.id === props.selected.id) + 1));
    }).catch(() => { if (!cancelled) setError(true); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [props.code, props.origin.id, retry]);
  useEffect(() => {
    selectedNode.current?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
  }, [chain, props.selected.id, loading]);
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
      if (chain.findIndex(node => node.id === props.selected.id) > index) props.onSelect(chain[index]);
    } else {
      revealNext.current = true;
      setVisibleCount(index + 2);
    }
  };
  return <div className="bkl-trace-page">
    <header className="bkl-trace-header"><button onClick={props.onBack} aria-label="返回知识图谱"><ArrowLeft size={20} /></button><div><h1>知识点溯源</h1><p>沿着知识脉络，回顾前序知识点</p></div><span><Compass size={19} />精准学</span></header>
    <div className="bkl-trace-layout">
      <aside className="bkl-trace-aside">
        <div className="bkl-sidebar">{selected ? <PointLearningCard point={selected} health={health} academicLocations={affiliations[selected.id]} academicLabel={affiliationLoading ? '正在读取教材归属…' : '暂无教材归属数据'} commonTypes={props.commonTypes[selected.id]} mistakeCount={pending.length} onLearn={() => props.onLearn(selected)} onCorrect={() => props.onCorrect(selected)} /> : <p className="bkl-trace-empty">{loading ? '正在读取知识点…' : '暂无该知识点的 point 数据'}</p>}</div>
      </aside>
      <main className="bkl-trace-route" aria-label="同级前序知识点路径">
        <div className="bkl-trace-route-heading"><div><span>溯源知识路径</span><h2>{chain[0]?.name ?? '知识点回溯'}</h2></div><small>{loading ? '加载中' : `${Math.max(0, chain.length - 1)} 个前序知识点`}</small></div>
        <div ref={routeScroll} className="bkl-trace-route-scroll">
          {loading ? <p className="bkl-trace-empty">正在读取知识路径…</p> : error ? <div className="bkl-trace-empty"><p>知识路径加载失败</p><button onClick={() => setRetry(n => n + 1)}>重新加载</button></div> : !chain.length ? <p className="bkl-trace-empty">暂无该知识点的溯源数据</p> : <>
            <ol>{chain.slice(0, visibleCount).map((node, i) => {
              const status = getPointHealth(readBookPointProgress(props.context, node.id)).status;
              const isSelected = selected?.id === node.id;
              const isOrigin = node.id === props.origin.id;
              return <li key={node.id} ref={i === Math.min(visibleCount, chain.length) - 1 ? lastVisibleNode : undefined}><button ref={isSelected ? selectedNode : undefined} className={`bkl-trace-step ${isSelected ? 'is-selected' : ''}`} aria-label={`${node.name}${isOrigin ? '，当前学习' : ''}`} aria-pressed={isSelected} onClick={() => props.onSelect(node)}>
                {isOrigin && <span className="bkl-trace-node-badges"><span className="bkl-trace-origin">当前学习</span></span>}
                <i className="bkl-trace-orb" style={{ background: pointColors[status] }} />
                <strong title={node.name}>{node.name}</strong>
                <ChevronRight className="bkl-trace-node-chevron" size={18} aria-hidden="true" />
              </button>{i < chain.length - 1 && <span className={`bkl-trace-connector ${i + 1 < visibleCount ? 'is-expanded' : 'is-collapsed'}`}><button className="bkl-trace-toggle" aria-expanded={i + 1 < visibleCount} aria-label={`${i + 1 < visibleCount ? '收起' : '展开'}${node.name}的前序知识点`} onClick={() => toggleNext(i)}>{i + 1 < visibleCount ? <ChevronUp size={17} /> : <ChevronDown size={17} />}</button></span>}</li>;
            })}</ol>
          </>}
        </div>
      </main>
    </div>
  </div>;
}
