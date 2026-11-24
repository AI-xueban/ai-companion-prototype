import React, { useEffect, useState } from 'react';
import type { Point } from './bookLearningGraph';
import { getPointHealth, pointStatusLabels } from '../../services/bookKnowledgeProgress';

export const pointColors = { unknown: '#a2a7b7', exploring: '#6d9ee8', weak: '#ed6b75', reviewing: '#e4b342', mastered: '#42b7ad' };

type Props = {
  point: Point;
  health: ReturnType<typeof getPointHealth>;
  commonTypes?: string[];
  academicLabel?: string;
  chapterLabel?: string;
  academicLocations?: [string, string, string][];
  masteredCount?: number;
  totalCount?: number;
  mistakeCount: number;
  onLearn: () => void;
  onCorrect: () => void;
  onTrace?: () => void;
  onClear?: () => void;
};

export function PointLearningCard({ point, health, commonTypes, academicLabel, chapterLabel, academicLocations, masteredCount, totalCount, mistakeCount, onLearn, onCorrect, onTrace, onClear }: Props) {
  const [locationIndex, setLocationIndex] = useState(0);
  useEffect(() => setLocationIndex(0), [point.id]);
  const location = academicLocations?.[locationIndex] ?? academicLocations?.[0];
  return <section className="bkl-mastery" aria-label="知识点详情">
    <div className="bkl-section-progress">{totalCount == null ? '知识点详情' : <>已掌握 <strong>{masteredCount}/{totalCount}</strong></>}{onClear && <button aria-label="取消选中知识点" onClick={onClear}>×</button>}</div>
    <div className="bkl-point-title"><b>{point.name}</b><span>{pointStatusLabels[health.status]}</span></div>
    {(location || academicLabel) && <div className="bkl-point-academic"><strong>{location ? `${location[0]} · ${location[1]}` : academicLabel}</strong>{(location?.[2] || chapterLabel) && <span>{location?.[2] ?? chapterLabel}</span>}
      {academicLocations && academicLocations.length > 1 && <label className="bkl-affiliation-picker">共 {academicLocations.length} 处教材归属 <span>切换查看 ›</span><select aria-label="选择知识点的教材归属" value={locationIndex} onChange={event => setLocationIndex(Number(event.target.value))}>{academicLocations.map((item, i) => <option key={i} value={i}>{item.join(' · ')}</option>)}</select></label>}
    </div>}
    {!!commonTypes?.length && <p className="bkl-common-types">常考：{commonTypes.join('、')}</p>}
    <div className="bkl-mastery-body"><div className="bkl-ring" style={{ background: pointColors[health.status] }}><div><strong>{health.score == null ? '—' : Math.round(health.score * 10) / 10}</strong><small>健康分</small></div></div>{onTrace && <button className="bkl-trace-link" onClick={onTrace}>知识点溯源 <span aria-hidden="true">›</span></button>}</div>
    <div className="bkl-mastery-numbers"><div><span><strong>{health.weak}</strong>待攻克</span><span><strong>{health.reviewing}</strong>待复习</span><span><strong>{health.mastered}</strong>已掌握</span></div></div>
    {health.score == null && <p>{health.status === 'exploring' ? '已有练习记录，逐题状态不足' : '暂无做题记录'}</p>}
    <div className="bkl-detail-actions">{!!mistakeCount && <button onClick={onCorrect}>订正错题（{mistakeCount}）</button>}<button className="bkl-selected-learn" onClick={onLearn}>去学习 →</button></div>
  </section>;
}
