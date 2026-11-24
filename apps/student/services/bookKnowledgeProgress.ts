const KEY = 'ai_friend_book_knowledge_progress_v1';
export type PointStatus = 'unknown' | 'exploring' | 'weak' | 'reviewing' | 'mastered';
export type QuestionHealthState = 'mastered' | 'reviewing' | 'weak';
export type BookPointProgress = { watched?: boolean; practiced?: boolean; correctCount?: number; totalCount?: number; questionStates?: Record<string, QuestionHealthState>; lastHealthSessionId?: string };
export const pointStatusLabels: Record<PointStatus, string> = { unknown: '未知', exploring: '探索中', weak: '待攻克', reviewing: '待复习', mastered: '已掌握' };
/** PRD: aggregate current question states, never substitute session accuracy or completion. */
export function getPointHealth(progress: BookPointProgress) {
  const states = Object.values(progress.questionStates ?? {});
  const mastered = states.filter(s => s === 'mastered').length;
  const reviewing = states.filter(s => s === 'reviewing').length;
  const weak = states.filter(s => s === 'weak').length;
  const total = mastered + reviewing + weak;
  const score = total ? (mastered * 100 + reviewing * 60) / total : null;
  const status: PointStatus = score === null ? (progress.practiced ? 'exploring' : 'unknown') : score < 60 ? 'weak' : score < 80 ? 'reviewing' : 'mastered';
  return { score, status, mastered, reviewing, weak, total };
}
export const bookPointKey = (context: string, pointId: string) => `${context}|${pointId}`;
export function readBookPointProgress(context: string, pointId: string): BookPointProgress {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}')[bookPointKey(context, pointId)] || {}; } catch { return {}; }
}
export function writeBookPointProgress(context: string, pointId: string, update: BookPointProgress) {
  try {
    const records = JSON.parse(localStorage.getItem(KEY) || '{}');
    const key = bookPointKey(context, pointId);
    records[key] = { ...records[key], ...update };
    localStorage.setItem(KEY, JSON.stringify(records));
  } catch { /* private mode / storage unavailable */ }
}

/** Two consecutive correct attempts per unique question. A wrong attempt resets it. */
export function applyPointPractice(
  previous: BookPointProgress,
  result: { sessionId: string; correctCount: number; totalCount: number; questions: { questionId: string; isCorrect: boolean }[] },
  simulated = false
): BookPointProgress {
  if (previous.lastHealthSessionId === result.sessionId) return previous;
  const questionStates = { ...previous.questionStates };
  // Flow placeholder questions contain no subject evidence and must not certify mastery.
  if (!simulated) {
    const uniqueQuestions = new Map(result.questions.map(q => [q.questionId, q]));
    for (const q of uniqueQuestions.values()) {
      if (!q.questionId || typeof q.isCorrect !== 'boolean') continue;
      const current = questionStates[q.questionId];
      questionStates[q.questionId] = !q.isCorrect ? 'weak'
        : current === 'reviewing' || current === 'mastered' ? 'mastered' : 'reviewing';
    }
  }
  return { ...previous, practiced: true, correctCount: result.correctCount, totalCount: result.totalCount,
    questionStates, lastHealthSessionId: result.sessionId };
}
