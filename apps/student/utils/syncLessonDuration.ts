import type { SyncMicroLesson } from '../types/syncMicroLesson';

export function getSyncLessonDurationSec(lesson: SyncMicroLesson, fallbackMinutes = 6): number {
  if (lesson.duration_sec && lesson.duration_sec > 0) return lesson.duration_sec;
  return fallbackMinutes * 60;
}
