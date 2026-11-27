import React, { useEffect, useState } from 'react';
import type { Point } from './bookLearningGraph';
import { getPointHealth, pointStatusLabels } from '../../services/bookKnowledgeProgress';
import { PointKnowledgeInfo } from './PointKnowledgeInfo';
import type { PointKnowledgeDetails } from './pointKnowledgeDetails';
import { ArrowRight, BookOpen } from 'lucide-react';

export const pointColors = { unknown: '#a2a7b7', exploring: '#6d9ee8', weak: '#ed6b75', reviewing: '#e4b342', mastered: '#42b7ad' };

type Props = {
  point: Point;
  health: ReturnType<typeof getPointHealth>;
  commonTypes?: string[];
  details?: PointKnowledgeDetails;
  academicLabel?: string;
  chapterLabel?: string;
  academicLocations?: [string, string, string][];
  recommended?: boolean;
  onLearn: () => void;
  onTrace?: () => void;
};

export function PointLearningCard({ point, health, commonTypes, details, academicLabel, chapterLabel, academicLocations, recommended, onLearn, onTrace }: Props) {
  const [locationIndex, setLocationIndex] = useState(0);
  useEffect(() => setLocationIndex(0), [point.id]);
  const location = academicLocations?.[locationIndex] ?? academicLocations?.[0];
  return <section className={`bkl-mastery${recommended ? ' is-recommended' : ''}`} aria-label="知识点详情">
    {recommended && <span className="bkl-card-recommend">推荐学习</span>}
    <div className="bkl-point-title"><b>{point.name}</b><span>{pointStatusLabels[health.status]}</span></div>
    {(location || academicLabel) && <div className="bkl-point-academic"><strong>{location ? `${location[0]} · ${location[1]}` : academicLabel}</strong>{(location?.[2] || chapterLabel) && <span>{location?.[2] ?? chapterLabel}</span>}
      {academicLocations && academicLocations.length > 1 && <label className="bkl-affiliation-picker">共 {academicLocations.length} 处教材归属 <span>切换查看 ›</span><select aria-label="选择知识点的教材归属" value={locationIndex} onChange={event => setLocationIndex(Number(event.target.value))}>{academicLocations.map((item, i) => <option key={i} value={i}>{item.join(' · ')}</option>)}</select></label>}
    </div>}
    {!!commonTypes?.length && <p className="bkl-common-types">常考：{commonTypes.join('、')}</p>}
    <PointKnowledgeInfo pointId={point.id} name={point.name} details={details} />
    <div className="bkl-mastery-body"><div className="bkl-ring" style={{ background: pointColors[health.status] }}><div><strong>{health.score == null ? '—' : Math.round(health.score * 10) / 10}</strong><small>健康分</small></div></div>{onTrace && <button className="bkl-trace-link" onClick={onTrace}>知识点溯源 <span aria-hidden="true">›</span></button>}</div>
    {health.score == null && <p>{health.status === 'exploring' ? '已有练习记录，逐题状态不足' : '暂无做题记录'}</p>}
    <div className="bkl-detail-actions"><button className="bkl-selected-learn" onClick={onLearn}><BookOpen size={18} aria-hidden="true" /><span>去学习</span><ArrowRight size={18} aria-hidden="true" /></button></div>
  </section>;
}
