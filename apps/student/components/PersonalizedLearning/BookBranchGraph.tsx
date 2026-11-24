import React, { useCallback, useEffect, useRef, useState } from 'react';
import { type GraphGroup, type Point } from './bookLearningGraph';

export function BookBranchGraph({ groups, selected, onSelect, onClearSelection, statuses = {}, recommendedId }: { groups: GraphGroup[]; selected: string | undefined; onSelect: (point: Point) => void; onClearSelection?: () => void; statuses?: Record<string, string>; recommendedId?: string }) {
  // Keep the imported catalog/Points order; alternate row direction for a continuous reading path.
  const orderedPoints = groups.flatMap(g => g.points);
  const columns = Math.min(3, Math.max(1, orderedPoints.length));
  const width = columns * 150 + 30;
  const height = Math.ceil(orderedPoints.length / columns) * 125 + 40;
  const pointNodes = orderedPoints.map((point, index) => {
    const row = Math.floor(index / columns);
    const column = row % 2 ? columns - 1 - index % columns : index % columns;
    return { point, index, x: 90 + column * 150, y: 85 + row * 125 };
  });
  const viewport = useRef<HTMLDivElement>(null);
  const [camera, setCamera] = useState({ x: 0, y: 0, scale: 1 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef({ moved: false, distance: 0, pointId: '' });
  const positions = pointNodes;
  const left = Math.min(...positions.map(p => p.x)) - 85;
  const top = Math.min(...positions.map(p => p.y)) - 72;
  const right = Math.max(...positions.map(p => p.x)) + 85;
  const bottom = Math.max(...positions.map(p => p.y)) + 65;
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
      else onClearSelection?.();
    }
    pointers.current.delete(event.pointerId);
    gesture.current.distance = 0;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  return <div ref={viewport} className="bkl-branch-viewport" aria-label="可拖动缩放的知识点图谱" tabIndex={0} onKeyDown={event => { if (event.key === 'Escape') onClearSelection?.(); }}
    onPointerDown={event => {
      if (event.button !== 0) return;
      const p = localPoint(event.clientX, event.clientY);
      if (!pointers.current.size) gesture.current = { moved: false, distance: 0, pointId: (event.target as HTMLElement).closest('[data-point-id]')?.getAttribute('data-point-id') ?? '' };
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
        if (Math.abs(dx) + Math.abs(dy) > 2) gesture.current.moved = true;
        setCamera(old => ({ ...old, x: old.x + dx, y: old.y + dy }));
      }
    }}
    onPointerUp={event => endPointer(event)} onPointerCancel={event => endPointer(event, true)}
    onLostPointerCapture={event => { pointers.current.delete(event.pointerId); }}>
    <div className="bkl-branch-world" style={{ width, height, transform: `translate(${camera.x}px, ${camera.y}px) scale(${camera.scale})` }}>
      <svg width={width} height={height} aria-hidden="true" className="bkl-branch-lines">
        <defs><marker id="bkl-order-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7Z" fill="#a592f2" /></marker></defs>
        {pointNodes.slice(1).map((node, i) => {
          const previous = pointNodes[i];
          const dx = node.x - previous.x, dy = node.y - previous.y;
          const distance = Math.hypot(dx, dy);
          return <path key={node.point.id} data-order-from={previous.point.id} data-order-to={node.point.id}
            d={`M${previous.x + dx / distance * 31},${previous.y - 20 + dy / distance * 31} L${node.x - dx / distance * 34},${node.y - 20 - dy / distance * 34}`}
            fill="none" stroke="#b4a4ef" strokeWidth="2" markerEnd="url(#bkl-order-arrow)" />;
        })}
      </svg>
      {pointNodes.map(n => <button key={n.point.id} data-point-id={n.point.id} className={`bkl-branch-point ${statuses[n.point.id] ?? 'new'} ${selected === n.point.id ? 'is-selected' : ''}`} style={{ left: n.x, top: n.y }} title={n.point.treePath?.length ? [...n.point.treePath, n.point.name].join(' / ') : undefined} aria-pressed={selected === n.point.id} onClick={event => { if (event.detail === 0) onSelect(n.point); }}>
        {n.point.id === recommendedId && <span className="bkl-recommend-badge">推荐学习</span>}
        <span className="bkl-gem"><span /></span><span className="bkl-branch-name">{n.point.name}</span>
      </button>)}
    </div>
  </div>;
}
