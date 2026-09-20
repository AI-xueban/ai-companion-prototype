export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;

export type SteppingScenario = 'daily_task' | 'star_track';

export type SteppingStopReason =
  | 'target_reached'
  | 'consecutive_wrong_3'
  | 'micro_lesson_required'
  | 'time_exhausted';

export interface SteppingSession {
  uLevel: DifficultyLevel;
  currentDiff: DifficultyLevel;
  combo: number;
  consecutiveWrong: number;
  l1WrongCount: number;
  answeredCount: number;
  targetCount: number;
  l1RetryLimit: number;
  scenario: SteppingScenario;
  timeRemainingSec?: number;
  doneQuestionIds: string[];
  knowledgePointId?: string;
}

export interface SteppingStepResult {
  session: SteppingSession;
  shouldStop: boolean;
  stopReason?: SteppingStopReason;
  nextDiff?: DifficultyLevel;
}

export const L1_RETRY_LIMIT = 2;
export const DEFAULT_TARGET_COUNT = 6;

/** unknown 冷启动：默认 L2，按年级微调 */
export function resolveULevelFromGrade(grade?: number | string | null): DifficultyLevel {
  if (grade == null || grade === '') return 2;

  const numeric =
    typeof grade === 'number'
      ? grade
      : parseInt(String(grade).replace(/[^\d]/g, ''), 10);

  if (!Number.isFinite(numeric) || numeric <= 0) return 2;
  if (numeric <= 3) return 1;
  if (numeric <= 7) return 2;
  if (numeric <= 9) return 3;
  if (numeric <= 10) return 3;
  return 4;
}

export function initSteppingSession(options: {
  grade?: number | string | null;
  uLevel?: DifficultyLevel;
  targetCount?: number;
  scenario?: SteppingScenario;
  timeRemainingSec?: number;
  knowledgePointId?: string;
}): SteppingSession {
  const uLevel = options.uLevel ?? resolveULevelFromGrade(options.grade);
  const firstDiff = Math.max(1, Math.floor(uLevel) - 1) as DifficultyLevel;

  return {
    uLevel,
    currentDiff: firstDiff,
    combo: 0,
    consecutiveWrong: 0,
    l1WrongCount: 0,
    answeredCount: 0,
    targetCount: options.targetCount ?? DEFAULT_TARGET_COUNT,
    l1RetryLimit: L1_RETRY_LIMIT,
    scenario: options.scenario ?? 'daily_task',
    timeRemainingSec: options.timeRemainingSec,
    doneQuestionIds: [],
    knowledgePointId: options.knowledgePointId,
  };
}

export function afterSteppingSubmit(
  session: SteppingSession,
  lastR: 0 | 1,
): SteppingStepResult {
  const next: SteppingSession = {
    ...session,
    answeredCount: session.answeredCount + 1,
  };

  if (lastR === 0) {
    next.combo = 0;
    next.consecutiveWrong += 1;
  } else {
    next.combo += 1;
    next.consecutiveWrong = 0;
    next.l1WrongCount = 0;
  }

  if (next.answeredCount >= next.targetCount) {
    return { session: next, shouldStop: true, stopReason: 'target_reached' };
  }

  if (next.consecutiveWrong >= 3) {
    return { session: next, shouldStop: true, stopReason: 'consecutive_wrong_3' };
  }

  if (next.timeRemainingSec != null && next.timeRemainingSec <= 0) {
    return { session: next, shouldStop: true, stopReason: 'time_exhausted' };
  }

  if (lastR === 0) {
    if (next.currentDiff > 1) {
      next.currentDiff = (next.currentDiff - 1) as DifficultyLevel;
      return { session: next, shouldStop: false, nextDiff: next.currentDiff };
    }

    next.l1WrongCount += 1;

    if (next.scenario === 'star_track') {
      next.currentDiff = 1;
      return { session: next, shouldStop: false, nextDiff: 1 };
    }

    if (next.l1WrongCount <= next.l1RetryLimit) {
      next.currentDiff = 1;
      return { session: next, shouldStop: false, nextDiff: 1 };
    }

    return { session: next, shouldStop: true, stopReason: 'micro_lesson_required' };
  }

  if (next.combo >= 2 && next.currentDiff < 5) {
    next.currentDiff = (next.currentDiff + 1) as DifficultyLevel;
  }

  return { session: next, shouldStop: false, nextDiff: next.currentDiff };
}

export function pickQuestionByDifficulty<T extends { id: string; difficulty?: number }>(
  pool: T[],
  difficulty: DifficultyLevel,
  excludeIds: string[],
): T | null {
  const exact = pool.filter(
    (q) => q.difficulty === difficulty && !excludeIds.includes(q.id),
  );
  if (exact.length > 0) {
    return exact[Math.floor(Math.random() * exact.length)];
  }

  for (const delta of [1, -1, 2, -2]) {
    const alt = (difficulty + delta) as DifficultyLevel;
    if (alt < 1 || alt > 5) continue;
    const matches = pool.filter(
      (q) => q.difficulty === alt && !excludeIds.includes(q.id),
    );
    if (matches.length > 0) {
      return matches[Math.floor(Math.random() * matches.length)];
    }
  }

  const fallback = pool.filter((q) => !excludeIds.includes(q.id));
  return fallback.length > 0 ? fallback[0] : null;
}
