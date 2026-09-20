import type { Task } from '../types';

export const KG_SCOPE_MICRO_LESSON = '同步课堂微课';
export const KG_KNOWLEDGE_MICRO_LESSON = '知识点微课';
export const KG_SCOPE_SECTION_PRACTICE = '同步课时练习';
export const KG_SCOPE_UNIT_TEST = '同步单元测试';
export const KG_SCOPE_SELF_TEST = '同步自主测';

/** 一课一练：全学科固定 5 题，不按叶子数浮动 */
export const SECTION_PRACTICE_QUESTION_COUNT = 5;
export const SECTION_PRACTICE_DIFFICULTY = 3 as const;
export const SECTION_PRACTICE_DIFFICULTY_LABEL = '中等';
export const SECTION_PRACTICE_SCENARIO = 'sync' as const;
export const SECTION_PRACTICE_SCENARIO_LABEL = '同步练习';

export function sectionPracticeQuizFields() {
  return {
    questionCount: SECTION_PRACTICE_QUESTION_COUNT,
    practiceDifficulty: SECTION_PRACTICE_DIFFICULTY,
    practiceDifficultyLabel: SECTION_PRACTICE_DIFFICULTY_LABEL,
    practiceScenario: SECTION_PRACTICE_SCENARIO,
    practiceScenarioLabel: SECTION_PRACTICE_SCENARIO_LABEL,
    durationMinutes: 10,
    levelType: 'practice' as const,
    quizType: 'standard' as const,
    aiReasoning: KG_SCOPE_SECTION_PRACTICE,
  };
}

/** 同步课堂微课 · 有效观看达标线 */
export const KG_SCOPE_MICRO_LESSON_WATCH_THRESHOLD = 45;
/** 知识点微课 · 有效观看达标线 */
export const KG_KNOWLEDGE_MICRO_LESSON_WATCH_THRESHOLD = 80;
/** 普通视频课默认达标线 */
export const DEFAULT_VIDEO_WATCH_THRESHOLD = 80;

export function isKgMicroLessonTask(task?: Task | null): boolean {
  const reasoning = task?.aiReasoning;
  return reasoning === KG_SCOPE_MICRO_LESSON || reasoning === KG_KNOWLEDGE_MICRO_LESSON;
}

export function isKgScopeMicroLessonTask(task?: Task | null): boolean {
  return task?.aiReasoning === KG_SCOPE_MICRO_LESSON;
}

export function isKgKnowledgeMicroLessonTask(task?: Task | null): boolean {
  return task?.aiReasoning === KG_KNOWLEDGE_MICRO_LESSON;
}

export function isSectionPracticeTask(task?: Task | null): boolean {
  return task?.aiReasoning === KG_SCOPE_SECTION_PRACTICE;
}

export function getMicroLessonWatchThreshold(task?: Task | null): number {
  if (isKgScopeMicroLessonTask(task)) return KG_SCOPE_MICRO_LESSON_WATCH_THRESHOLD;
  if (isKgKnowledgeMicroLessonTask(task)) return KG_KNOWLEDGE_MICRO_LESSON_WATCH_THRESHOLD;
  return DEFAULT_VIDEO_WATCH_THRESHOLD;
}

export function kgSyncLessonHighlightKey(textbookId: number) {
  return `kg-sync-lesson-kpoints-${textbookId}`;
}

export function saveSyncLessonHighlight(textbookId: number, kpointIds: number[]) {
  try {
    sessionStorage.setItem(kgSyncLessonHighlightKey(textbookId), JSON.stringify(kpointIds));
  } catch {
    /* ignore */
  }
}

export function readSyncLessonHighlight(textbookId: number): number[] | null {
  try {
    const raw = sessionStorage.getItem(kgSyncLessonHighlightKey(textbookId));
    if (!raw) return null;
    const ids = JSON.parse(raw) as number[];
    sessionStorage.removeItem(kgSyncLessonHighlightKey(textbookId));
    return Array.isArray(ids) ? ids : null;
  } catch {
    return null;
  }
}
