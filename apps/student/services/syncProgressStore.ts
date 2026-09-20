const STORAGE_KEY = 'ai_friend_sync_progress_v1';

export type SyncBookKey = string;
export type SyncPracticeStatus = '未练习' | '练习中' | '已练完';
export type SyncPracticeStatusTone = 'muted' | 'active' | 'done';

export interface SyncBookProgress {
  catalog?: string;
  section?: string;
  catalogLessonId?: string;
  videos: Record<string, number>;
  /** 已练完：提交完成本次一课一练的时间戳 */
  practices: Record<string, number>;
  /** 练习中：作答过至少一题但未提交完成本次练习的时间戳 */
  practiceStarted?: Record<string, number>;
}

type ProgressMap = Record<SyncBookKey, SyncBookProgress>;

let progressVersion = 0;
const progressListeners = new Set<() => void>();

function notifyProgressListeners() {
  progressVersion += 1;
  progressListeners.forEach((listener) => listener());
}

export function getSyncBookProgressVersion() {
  return progressVersion;
}

export function subscribeSyncBookProgress(listener: () => void) {
  progressListeners.add(listener);
  return () => {
    progressListeners.delete(listener);
  };
}

export function makeSyncBookKey(
  subject: string,
  version: string,
  grade: string,
  term: string,
): SyncBookKey {
  return `${subject}|${version}|${grade}|${term}`;
}

function emptyBook(): SyncBookProgress {
  return { videos: {}, practices: {}, practiceStarted: {} };
}

function normalizeBook(book?: SyncBookProgress | null): SyncBookProgress {
  return {
    catalog: book?.catalog,
    section: book?.section,
    catalogLessonId: book?.catalogLessonId,
    videos: book?.videos ?? {},
    practices: book?.practices ?? {},
    practiceStarted: book?.practiceStarted ?? {},
  };
}

function readMap(): ProgressMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as ProgressMap;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeMap(map: ProgressMap) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    notifyProgressListeners();
  } catch {
    /* ignore */
  }
}

export function getSyncBookProgress(bookKey: SyncBookKey): SyncBookProgress {
  return normalizeBook(readMap()[bookKey]);
}

export function getSyncPracticeStatus(
  bookKey: SyncBookKey,
  practiceKey: string,
): SyncPracticeStatus {
  const book = getSyncBookProgress(bookKey);
  if (book.practices[practiceKey]) return '已练完';
  if (book.practiceStarted?.[practiceKey]) return '练习中';
  return '未练习';
}

export function describeSyncPracticeStatus(status: SyncPracticeStatus): {
  status: SyncPracticeStatus;
  tone: SyncPracticeStatusTone;
} {
  if (status === '已练完') return { status, tone: 'done' };
  if (status === '练习中') return { status, tone: 'active' };
  return { status, tone: 'muted' };
}

export function saveLastSyncLesson(
  bookKey: SyncBookKey,
  catalog: string,
  section: string,
  catalogLessonId?: string,
) {
  const map = readMap();
  const current = map[bookKey] ?? emptyBook();
  map[bookKey] = {
    ...normalizeBook(current),
    catalog,
    section,
    catalogLessonId,
  };
  writeMap(map);
}

export function markSyncVideoPlayed(bookKey: SyncBookKey, videoKey: string) {
  const map = readMap();
  const current = map[bookKey] ?? emptyBook();
  map[bookKey] = {
    ...normalizeBook(current),
    videos: { ...normalizeBook(current).videos, [videoKey]: Date.now() },
  };
  writeMap(map);
}

export function markSyncPracticeStarted(bookKey: SyncBookKey, practiceKey: string) {
  const map = readMap();
  const current = normalizeBook(map[bookKey]);
  if (current.practices[practiceKey]) return;
  map[bookKey] = {
    ...current,
    practiceStarted: { ...current.practiceStarted, [practiceKey]: Date.now() },
  };
  writeMap(map);
}

export function markSyncPracticeDone(bookKey: SyncBookKey, practiceKey: string) {
  const map = readMap();
  const current = normalizeBook(map[bookKey]);
  const nextStarted = { ...current.practiceStarted };
  delete nextStarted[practiceKey];
  map[bookKey] = {
    ...current,
    practices: { ...current.practices, [practiceKey]: Date.now() },
    practiceStarted: nextStarted,
  };
  writeMap(map);
}

export function makeSyncVideoKey(section: string, title: string, index: number) {
  return `${section}|${title}|${index}`;
}
