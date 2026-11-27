import React, { useSyncExternalStore } from 'react';
import { ArrowLeft, Video } from 'lucide-react';
import type { KnowledgeVideo } from '../../data/bookKnowledgeResources';
import { LearningPathStepList } from '../SubjectMap/SyncSectionPage';
import { getSyncLessonProgressVersion, subscribeSyncLessonProgress, formatDurationLabel } from '../../services/syncMicroLessonProgress';
import { getKnowledgeVideoWatch } from './knowledgeVideoProgress';
import './knowledgeVideoListPage.css';

export { knowledgeVideoProgressId } from './knowledgeVideoProgress';

export function KnowledgeVideoListPage({ title, textId, context, videos, onBack, onPlay, backLabel = '返回知识精准学' }: {
  title: string; textId: string; context: string; videos: KnowledgeVideo[]; onBack: () => void; onPlay: (video: KnowledgeVideo) => void; backLabel?: string;
}) {
  useSyncExternalStore(subscribeSyncLessonProgress, getSyncLessonProgressVersion, () => 0);
  return <div className="bkl-videos-page">
    <header><button aria-label={backLabel} onClick={onBack}><ArrowLeft size={20} /></button><h1>{title}</h1></header>
    <main><section aria-label="知识精讲"><h2><Video size={18} />知识精讲</h2>
      {!videos.length ? <p className="bkl-videos-empty">暂无可用的知识点视频</p> : <LearningPathStepList knowledgeTitle={title}
        steps={videos.map((video, index) => {
          const watch = getKnowledgeVideoWatch(context, textId, video, index);
          return { key: video.id, label: video.title, topicTitle: video.topicTitle,
            duration: formatDurationLabel(video.durationSec), phase: 'learn', status: watch.status,
            statusTone: watch.tone, progressRatio: watch.ratio };
        })} onSelect={index => onPlay(videos[index])} />}
    </section></main>
  </div>;
}
