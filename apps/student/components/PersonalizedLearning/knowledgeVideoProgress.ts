import { describeWatchStatus, loadSyncLessonProgress, makeSectionVideoProgressId } from '../../services/syncMicroLessonProgress';
import { readBookPointProgress } from '../../services/bookKnowledgeProgress';

export const knowledgeVideoProgressId = (textId: string, videoId: string) => `knowledge-video:${encodeURIComponent(textId)}:${encodeURIComponent(videoId)}`;
export const knowledgeVideoItemId = (context: string, videoId: string) => `knowledge:${context}:${videoId}`;

export function getKnowledgeVideoWatch(context: string, textId: string, video: { id: string; durationSec: number }, index: number) {
  const saved = loadSyncLessonProgress(makeSectionVideoProgressId(knowledgeVideoItemId(context, video.id), index));
  if (!saved && readBookPointProgress(context, knowledgeVideoProgressId(textId, video.id)).watched) {
    return { status: '已学完', tone: 'done' as const, ratio: 100 };
  }
  return describeWatchStatus(saved, video.durationSec);
}
