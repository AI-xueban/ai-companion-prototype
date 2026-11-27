import React, { useCallback, useEffect, useRef, useState } from 'react';
import { layoutBookGraph, knowledgeEdgePath, type GraphGroup, type Point } from './bookLearningGraph';

export function BookBranchGraph({ groups, selected, onSelect, onBackgroundClick, statuses = {}, recommendedId }: { groups: GraphGroup[]; selected: string | undefined; onSelect: (point: Point) => void; onBackgroundClick?: () => void; statuses?: Record<string, string>; recommendedId?: string }) {
  const { nodes: pointNodes, edges } = layoutBookGraph(groups);
  const statusNames: Record<string, string> = { unknown: '未知', new: '未知', exploring: '探索中', weak: '待攻克', reviewing: '待复习', mastered: '已掌握' };
  const statusColors: Record<string, string> = { unknown: '#a7a6bd', new: '#a7a6bd', exploring: '#7da5e9', weak: '#ed7b88', reviewing: '#e7ba58', mastered: '#59bdb5' };
  const viewport = useRef<HTMLDivElement>(null);
  const [camera, setCamera] = useState({ x: 0, y: 0, scale: 1 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef({ moved: false, distance: 0, pointId: '', startX: 0, startY: 0 });
  const positions = pointNodes;
  const left = Math.min(0, ...positions.map(p => p.x - 140));
  const top = Math.min(0, ...positions.map(p => p.y - 50));
  const right = Math.max(160, ...positions.map(p => p.x + 140));
  const bottom = Math.max(130, ...positions.map(p => p.y + 90));
  const width = right - left;
  const height = bottom - top;
  const fit = useCallback(() => {
    const el = viewport.current;
    if (!el || !el.clientWidth || !el.clientHeight) return;
    const scale = Math.max(0.3, Math.min((el.clientWidth - 28) / (right - left), (el.clientHeight - 28) / (bottom - top), 1));
    setCamera({ scale, x: (el.clientWidth - (right - left) * scale) / 2 - left * scale, y: (el.clientHeight - (bottom - top) * scale) / 2 - top * scale });
  }, [left, top, right, bottom]);
  const localPoint = (x: number, y: number) => {
    const el = viewport.current!;
    const rect = el.getBoundingClientRect();
    return { x: (x - rect.left) * el.clientWidth / rect.width, y: (y - rect.top) * el.clientHeight / rect.height };
  };
  const zoom = useCallback((factor: number, x: number, y: number) => setCamera(old => {
    const scale = Math.max(0.3, Math.min(1, old.scale * factor));
    const ratio = scale / old.scale;
    return { scale, x: x - (x - old.x) * ratio, y: y - (y - old.y) * ratio };
  }), []);
  useEffect(() => {
    const el = viewport.current;
    if (!el) return;
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      const p = localPoint(event.clientX, event.clientY);
      zoom(Math.exp(-Math.max(-100, Math.min(100, event.deltaY)) * 0.004), p.x, p.y);
    };
    el.addEventListener('wheel', wheel, { passive: false });
    fit();
    return () => { observer.disconnect(); el.removeEventListener('wheel', wheel); };
  }, [fit, zoom]);
  const endPointer = (event: React.PointerEvent<HTMLDivElement>, cancelled = false) => {
    if (!pointers.current.has(event.pointerId)) return;
    if (!cancelled && pointers.current.size === 1 && !gesture.current.moved) {
      const node = pointNodes.find(n => n.point.id === gesture.current.pointId);
      if (node) onSelect(node.point);
      else onBackgroundClick?.();
    }
    pointers.current.delete(event.pointerId);
    gesture.current.distance = 0;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  return <div ref={viewport} className="bkl-branch-viewport" aria-label="可拖动缩放的知识点图谱" tabIndex={0}
    onPointerDown={event => {
      if (event.button !== 0) return;
      const p = localPoint(event.clientX, event.clientY);
      if (!pointers.current.size) gesture.current = { moved: false, distance: 0, pointId: (event.target as HTMLElement).closest('[data-point-id]')?.getAttribute('data-point-id') ?? '', startX: p.x, startY: p.y };
      pointers.current.set(event.pointerId, p);
      if (pointers.current.size > 1) gesture.current.moved = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }}
    onPointerMove={event => {
      const previous = pointers.current.get(event.pointerId);
      if (!previous) return;
      const next = localPoint(event.clientX, event.clientY);
      const oldPoints = [...pointers.current.values()];
      pointers.current.set(event.pointerId, next);
      const nextPoints = [...pointers.current.values()];
      if (nextPoints.length > 1) {
        const distance = (ps: { x: number; y: number }[]) => Math.hypot(ps[0].x - ps[1].x, ps[0].y - ps[1].y);
        const oldDistance = distance(oldPoints), newDistance = distance(nextPoints);
        const center = { x: (nextPoints[0].x + nextPoints[1].x) / 2, y: (nextPoints[0].y + nextPoints[1].y) / 2 };
        const dx = center.x - (oldPoints[0].x + oldPoints[1].x) / 2;
        const dy = center.y - (oldPoints[0].y + oldPoints[1].y) / 2;
        setCamera(old => ({ ...old, x: old.x + dx, y: old.y + dy }));
        if (oldDistance > 0) zoom(newDistance / oldDistance, center.x, center.y);
      } else {
        const dx = next.x - previous.x, dy = next.y - previous.y;
        if (Math.hypot(next.x - gesture.current.startX, next.y - gesture.current.startY) > 4) gesture.current.moved = true;
        setCamera(old => ({ ...old, x: old.x + dx, y: old.y + dy }));
      }
    }}
    onPointerUp={event => endPointer(event)} onPointerCancel={event => endPointer(event, true)}
    onLostPointerCapture={event => { pointers.current.delete(event.pointerId); }}>
    <div className="bkl-branch-world" style={{ width, height, transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})` }}>
      <svg width={width} height={height} aria-hidden="true" className="bkl-branch-lines">
        <defs><marker id="bkl-order-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7Z" fill="#a592f2" /></marker></defs>
        {edges.map(edge => {
          const { from: previous, to: node, kind } = edge;
          return <path key={`${kind}-${previous.point.id}-${node.point.id}`} data-edge-kind={kind} data-order-from={previous.point.id} data-order-to={node.point.id}
            d={knowledgeEdgePath(edge, pointNodes, selected, Math.min(24, Math.max(12, 11 / camera.scale)))}
            fill="none" stroke="#b4a4ef" strokeWidth={kind === 'order' ? 1.6 : 1.2} markerEnd="url(#bkl-order-arrow)" />;
        })}
      </svg>
      {pointNodes.map(n => <button key={n.point.id} data-point-id={n.point.id} data-depth={n.depth} className={`bkl-branch-point ${n.depth === 0 ? 'is-mainline' : 'is-child'} ${statuses[n.point.id] ?? 'new'} ${selected === n.point.id ? 'is-selected' : ''}`} style={{ left: n.x, top: n.y }} title={n.point.treePath?.length ? [...n.point.treePath, n.point.name].join(' / ') : undefined} aria-label={`${n.point.name}，${statusNames[statuses[n.point.id] ?? 'unknown']}`} aria-pressed={selected === n.point.id} onClick={event => { if (event.detail === 0) onSelect(n.point); }}>
        {n.point.id === recommendedId && <span className="bkl-recommend-badge">推荐学习</span>}
        <span className="bkl-gem" aria-hidden="true" style={{ background: 'transparent', color: statusColors[statuses[n.point.id] ?? 'unknown'] ?? statusColors.unknown }}>
          <svg className="bkl-node-hexagon" viewBox="0 0 40 44"><path d="M17.5 2.5Q20 1 22.5 2.5L35 9.7Q37.5 11.2 37.5 14V30Q37.5 32.8 35 34.3L22.5 41.5Q20 43 17.5 41.5L5 34.3Q2.5 32.8 2.5 30V14Q2.5 11.2 5 9.7Z" fill="currentColor" stroke="white" strokeWidth="3" strokeLinejoin="round" /><path d="M6 12L20 4L34 12L20 22Z" fill="white" opacity=".18" /><path d="M20 22L34 14V30L20 38Z" fill="#514879" opacity=".09" /></svg>
          {selected === n.point.id && <svg className="bkl-selection-anchor" viewBox="0 0 56 56"><circle cx="28" cy="28" r="23" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M28 0V7M28 49V56M0 28H7M49 28H56" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>}
        </span><span className="bkl-branch-name" title={n.point.name} style={{ fontSize: Math.min(24, Math.max(12, 11 / camera.scale)) }}>{n.point.name}</span>
      </button>)}
    </div>
  </div>;
}
