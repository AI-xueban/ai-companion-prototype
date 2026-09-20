export interface SyncLessonWatchProgress {
  currentSec: number;
  effectiveSec: number;
  durationSec: number;
  updatedAt: number;
  /** 已播到的最远位置（含倍速），只增不减 */
  maxPlayedSec?: number;
}

const STORAGE_PREFIX = 'sync-lesson-progress-';

/** 同步微课列表「已学完」线：播放进度 ≥ 80%（含倍速） */
export const SYNC_MICRO_LESSON_COMPLETE_RATIO = 80;

function storageKey(lessonId: number) {
  return `${STORAGE_PREFIX}${lessonId}`;
}

export function loadSyncLessonProgress(lessonId: number): SyncLessonWatchProgress | null {
  try {
    const raw = localStorage.getItem(storageKey(lessonId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SyncLessonWatchProgress;
    if (typeof parsed.currentSec !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

const PROGRESS_EVENT = 'sync-lesson-progress';
let progressVersion = 0;
const progressListeners = new Set<() => void>();

function notifyProgressListeners() {
  progressVersion += 1;
  progressListeners.forEach((listener) => listener());
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(PROGRESS_EVENT));
  }
}

export function getPlayedSec(progress: SyncLessonWatchProgress | null): number {
  if (!progress) return 0;
  return Math.max(progress.maxPlayedSec ?? 0, progress.currentSec, progress.effectiveSec);
}

export function getWatchRatio(progress: SyncLessonWatchProgress | null, durationSec: number): number {
  if (!progress || durationSec <= 0) return 0;
  return Math.min(100, Math.round((getPlayedSec(progress) / durationSec) * 100));
}

export function saveSyncLessonProgress(lessonId: number, progress: SyncLessonWatchProgress) {
  try {
    const prev = loadSyncLessonProgress(lessonId);
    const maxPlayedSec = Math.max(getPlayedSec(prev), getPlayedSec(progress));
    const next: SyncLessonWatchProgress = {
      ...progress,
      maxPlayedSec,
    };
    localStorage.setItem(storageKey(lessonId), JSON.stringify(next));
    notifyProgressListeners();
  } catch {
    /* ignore */
  }
}

export function subscribeSyncLessonProgress(listener: () => void) {
  progressListeners.add(listener);
  if (typeof window !== 'undefined') {
    window.addEventListener('focus', listener);
    window.addEventListener('storage', listener);
  }
  return () => {
    progressListeners.delete(listener);
    if (typeof window !== 'undefined') {
      window.removeEventListener('focus', listener);
      window.removeEventListener('storage', listener);
    }
  };
}

export function getSyncLessonProgressVersion() {
  return progressVersion;
}

export function makeSectionVideoItemId(section: string, title: string, videoIndex: number) {
  return `${section}-${title}-${videoIndex}`;
}

export function makeSectionVideoProgressId(itemId: string, playlistIndex: number) {
  const hash = Math.abs(
    [...itemId].reduce((acc, char) => ((acc * 31) + char.charCodeAt(0)) | 0, 0),
  );
  return (playlistIndex + 1) * 100000 + (hash % 100000);
}

export type WatchStatusTone = 'active' | 'done' | 'progress' | 'muted';

export function describeWatchStatus(
  progress: SyncLessonWatchProgress | null,
  durationSec: number,
  completeThreshold = SYNC_MICRO_LESSON_COMPLETE_RATIO,
  isActive = false,
): { status: string; tone: WatchStatusTone; ratio: number } {
  const ratio = getWatchRatio(progress, durationSec);
  const status = formatWatchStatus(progress, durationSec, completeThreshold);
  if (isActive) {
    return {
      status: status === '已学完' ? '已学完' : '学习中',
      tone: status === '已学完' ? 'done' : 'active',
      ratio,
    };
  }
  if (status === '已学完') return { status, tone: 'done', ratio };
  if (status === '未学习') return { status, tone: 'muted', ratio };
  return { status, tone: 'progress', ratio };
}

export function formatDurationLabel(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = Math.floor(totalSec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export function formatWatchStatus(
  progress: SyncLessonWatchProgress | null,
  durationSec: number,
  completeThreshold = SYNC_MICRO_LESSON_COMPLETE_RATIO,
): string {
  const playedSec = getPlayedSec(progress);
  if (playedSec <= 0) return '未学习';
  const ratio = getWatchRatio(progress, durationSec);
  if (ratio >= completeThreshold) return '已学完';
  return '学习中';
}
