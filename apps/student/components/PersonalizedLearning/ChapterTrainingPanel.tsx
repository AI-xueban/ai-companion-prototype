import React from 'react';
import { Video, PlayCircle, NotebookPen, ChevronRight } from 'lucide-react';
import { getPointHealth, readBookPointProgress } from '../../services/bookKnowledgeProgress';
import { pointColors } from './PointLearningCard';
import type { KnowledgeVideo } from '../../data/bookKnowledgeResources';
import { knowledgeVideoProgressId } from './KnowledgeVideoListPage';
import chineseVideoArt from './assets/text-video-chinese.png';
import englishVideoArt from './assets/text-video-english.png';

// chapterId is the selected text/lesson ID; retain the storage prefix for compatibility.
export const chapterTrainingId = (chapterId: string, difficulty: string) => `chapter-training:${encodeURIComponent(chapterId)}:${difficulty}`;
const options = [
  { name: '基础', caption: '理解概念，掌握基础方法' },
  { name: '进阶', caption: '巩固方法，提升综合应用' },
  { name: '拓展', caption: '复杂推理，挑战迁移应用' },
] as const;
export type TextTrainingDifficulty = typeof options[number]['name'];

// Stable display-only examples: changing lessons varies the sample without writing progress.
const demoHealthScores = (context: string, chapterId: string) => {
  const seed = Array.from(`${context}|${chapterId}`).reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 0);
  return [84 + seed % 13, 62 + (seed >>> 4) % 16, 36 + (seed >>> 8) % 21];
};

export function ChapterTrainingPanel({ context, chapterId, subject, videos, onVideo, onTraining }: { context: string; chapterId: string; subject: string; videos: KnowledgeVideo[]; onVideo: () => void; onTraining: (difficulty: TextTrainingDifficulty) => void }) {
  const demoScores = demoHealthScores(context, chapterId);
  const uniqueVideos = [...new Map(videos.map(video => [video.id, video])).values()];
  const watchedCount = uniqueVideos.filter(video => readBookPointProgress(context, knowledgeVideoProgressId(chapterId, video.id)).watched).length;
  return <div className="bkl-text-modules">
    <section className="bkl-chapter-training" aria-label="课文难度训练"><h2><NotebookPen size={19} />难度训练</h2>
    <div className="bkl-chapter-cards">{options.map((option, index) => {
      const health = getPointHealth(readBookPointProgress(context, chapterTrainingId(chapterId, option.name)));
      const isDemo = health.score == null;
      const score = isDemo ? demoScores[index] : Math.round(health.score! * 10) / 10;
      const color = isDemo ? pointColors[score < 60 ? 'weak' : score < 80 ? 'reviewing' : 'mastered'] : pointColors[health.status];
      return <button type="button" key={option.name} className={`bkl-chapter-card bkl-module-card bkl-training-level-${index}`} aria-label={`开始${option.name}训练`} onClick={() => onTraining(option.name)}>
        <span className="bkl-training-blocks" aria-hidden="true"><i /><i /><i /></span>
        <div><h3>{option.name}</h3><p>{option.caption}</p></div>
        <div className="bkl-chapter-health" style={{ '--bkl-health-color': color } as React.CSSProperties}><strong style={{ color }}>{score}</strong><span>健康分{isDemo && <small className="bkl-health-demo">演示</small>}</span><span className="bkl-health-track" aria-hidden="true"><span style={{ width: `${score}%`, background: color }} /></span></div>
        <ChevronRight className="bkl-card-entry-hint" size={16} aria-hidden="true" />
        {option.name !== '拓展' && <ChevronRight className="bkl-training-order" size={19} aria-hidden="true" />}
      </button>;
    })}</div>
    </section>
    <section className="bkl-text-video-module" aria-label="知识点视频">
      <h2><Video size={19} />知识点视频</h2>
      <span className="bkl-video-study-count" aria-live="polite">已学习 <strong>{watchedCount}/{uniqueVideos.length}</strong></span>
      <button type="button" className="bkl-video-entry" aria-label={`查看当前课文知识点视频，已学习${watchedCount}/${uniqueVideos.length}`} onClick={onVideo}>
        <img src={subject === '英语' ? englishVideoArt : chineseVideoArt} alt="" />
        <span className="bkl-video-entry-caption"><PlayCircle size={26} /><span>当前课文</span><ChevronRight size={19} /></span>
      </button>
    </section>
  </div>;
}
