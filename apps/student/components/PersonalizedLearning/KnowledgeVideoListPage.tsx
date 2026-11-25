import React from 'react';
import { ArrowLeft, Play, Video } from 'lucide-react';
import type { KnowledgeVideo } from '../../data/bookKnowledgeResources';
import { readBookPointProgress } from '../../services/bookKnowledgeProgress';
import './knowledgeVideoListPage.css';

export const knowledgeVideoProgressId = (textId: string, videoId: string) => `knowledge-video:${encodeURIComponent(textId)}:${encodeURIComponent(videoId)}`;

export function KnowledgeVideoListPage({ title, textId, context, videos, onBack, onPlay }: {
  title: string; textId: string; context: string; videos: KnowledgeVideo[]; onBack: () => void; onPlay: (video: KnowledgeVideo) => void;
}) {
  return <div className="bkl-videos-page">
    <header><button aria-label="返回精准学" onClick={onBack}><ArrowLeft size={20} /></button><h1>{title}</h1></header>
    <main><section aria-label="知识点视频"><h2><Video size={18} />知识点视频</h2>
      {!videos.length ? <p className="bkl-videos-empty">暂无当前课文的知识点视频</p> : <ol>{videos.map((video, index) => {
        const watched = readBookPointProgress(context, knowledgeVideoProgressId(textId, video.id)).watched;
        const duration = `${Math.floor(video.durationSec / 60)}:${String(video.durationSec % 60).padStart(2, '0')}`;
        return <li key={video.id}><span className="bkl-videos-order">{index + 1}</span><button className="bkl-videos-row" onClick={() => onPlay(video)} aria-label={`播放${video.title}`}>
          <span className="bkl-videos-icon"><Video size={20} /></span><span className="bkl-videos-copy"><strong>{video.title}</strong><small>{watched ? '已学习' : '未学习'}</small></span>
          <time>{duration}</time><span className="bkl-videos-play"><Play size={15} fill="currentColor" /></span>
        </button></li>;
      })}</ol>}
    </section></main>
  </div>;
}
