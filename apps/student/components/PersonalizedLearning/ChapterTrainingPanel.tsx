import React from 'react';
import { Video, PlayCircle, NotebookPen, ChevronRight, Target, Layers, Rocket } from 'lucide-react';
import type { KnowledgeVideo } from '../../data/bookKnowledgeResources';
import { getKnowledgeVideoWatch } from './knowledgeVideoProgress';
import { getTeacherAd } from '../SubjectMap/SyncTeacherAdCard';
import type { PointStatus } from '../../services/bookKnowledgeProgress';

export const chapterTrainingId = (chapterId: string, difficulty: string) => `chapter-training:${encodeURIComponent(chapterId)}:${difficulty}`;
const options = [
  { name: '基础', label: '专项攻克', caption: '理解概念，掌握基础方法', icon: Target },
  { name: '进阶', label: '巩固强化', caption: '巩固方法，提升综合应用', icon: Layers },
  { name: '拓展', label: '挑战高阶', caption: '复杂推理，挑战迁移应用', icon: Rocket },
] as const;
export type TextTrainingDifficulty = typeof options[number]['name'];
export const pointTrainingLabels: Record<TextTrainingDifficulty, string> = { 基础: '专项攻克', 进阶: '巩固强化', 拓展: '挑战高阶' };

export function ChapterTrainingPanel({ context, chapterId, subject, videos, onVideo, onTraining, fixedDifficulty, pointStatus }: { context: string; chapterId: string; subject: string; videos: KnowledgeVideo[]; onVideo: () => void; onTraining: (difficulty: TextTrainingDifficulty) => void; fixedDifficulty?: TextTrainingDifficulty; pointStatus?: PointStatus }) {
  const recommendedDifficulty = fixedDifficulty ?? (pointStatus === 'mastered' ? '拓展' : pointStatus === 'reviewing' ? '进阶' : pointStatus ? '基础' : undefined);
  const teachers = getTeacherAd(subject)?.teachers ?? [];
  const uniqueVideos = [...new Map(videos.map(video => [video.id, video])).values()];
  const videoWatches = uniqueVideos.map((video, index) => getKnowledgeVideoWatch(context, chapterId, video, index));
  const watchedCount = videoWatches.filter(watch => watch.status === '已学完').length;
  const videoAction = videoWatches.some(watch => watch.ratio > 0) ? '继续学习' : '去学习';
  return <div className="bkl-text-modules bkl-learning-modules">
    <section className="bkl-text-video-module" aria-label="知识精讲">
      <h2><Video size={19} />知识精讲</h2>
      <span className="bkl-video-study-count" aria-live="polite">已学习 <strong>{watchedCount}/{uniqueVideos.length}</strong></span>
      <button type="button" disabled={!uniqueVideos.length} className="bkl-video-entry" aria-label={`${videoAction}当前知识精讲，直接观看，已学习${watchedCount}/${uniqueVideos.length}`} onClick={onVideo}>
        <span className="bkl-video-teachers" style={{ gridTemplateColumns: `repeat(${Math.max(1, teachers.length)}, minmax(0,1fr))` }}>{teachers.map((teacher, index) => <span className="bkl-video-portrait" key={`${teacher.name}-${index}`}><img src={teacher.image} alt="" /><span>{teacher.name}</span></span>)}</span>
        <span className="bkl-video-teacher-title">清北名师讲解</span>
        <span className="bkl-video-entry-caption"><PlayCircle size={26} /><span>{uniqueVideos.length ? videoAction : '暂无视频'}</span><ChevronRight size={19} /></span>
      </button>
    </section>
    <section className="bkl-chapter-training" aria-label="阶段练习"><h2><NotebookPen size={19} />阶段练习</h2>
      <div className="bkl-practice-options">{options.filter(option => !fixedDifficulty || option.name === fixedDifficulty).map((option, index) => {
        const Icon = option.icon;
        const recommended = option.name === recommendedDifficulty;
        return <button type="button" key={option.name} className={`bkl-practice-option bkl-training-level-${index}${recommended ? ' is-recommended' : ''}`} aria-label={`${option.label}，${option.name}难度${recommended ? '，推荐学习' : ''}`} onClick={() => onTraining(option.name)}>
          {recommended && <span className="bkl-practice-recommend">推荐学习</span>}
          <span className="bkl-practice-icon" aria-hidden="true"><Icon size={27} /></span>
          <span className="bkl-practice-copy"><strong>{option.label}</strong><small>{option.caption}</small></span>
          <span className="bkl-practice-difficulty">{option.name}难度</span><ChevronRight size={18} aria-hidden="true" />
        </button>;
      })}</div>
    </section>
  </div>;
}
