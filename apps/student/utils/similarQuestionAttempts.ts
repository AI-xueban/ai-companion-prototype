export type SimilarAttemptStatus = 'unattempted' | 'correct' | 'wrong';

const STORAGE_KEY = 'ai_friend_similar_attempts';
const ATTEMPT_EVENT = 'similar-attempt-recorded';

type AttemptRecord = Record<string, 'correct' | 'wrong'>;

const readStoredAttempts = (): AttemptRecord => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AttemptRecord) : {};
  } catch {
    return {};
  }
};

const writeStoredAttempts = (record: AttemptRecord) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  window.dispatchEvent(new CustomEvent(ATTEMPT_EVENT));
};

export const getSimilarAttemptStatus = (
  questionId: string,
  bankStats?: { correctCount?: number; wrongCount?: number },
): SimilarAttemptStatus => {
  const stored = readStoredAttempts()[questionId];
  if (stored) return stored;

  const correct = bankStats?.correctCount ?? 0;
  const wrong = bankStats?.wrongCount ?? 0;
  const total = correct + wrong;
  if (total === 0) return 'unattempted';
  if (wrong === 0) return 'correct';
  if (correct === 0) return 'wrong';
  return correct >= wrong ? 'correct' : 'wrong';
};

export const recordSimilarAttempt = (questionId: string, isCorrect: boolean) => {
  const record = readStoredAttempts();
  record[questionId] = isCorrect ? 'correct' : 'wrong';
  writeStoredAttempts(record);
};

export const SIMILAR_ATTEMPT_EVENT = ATTEMPT_EVENT;
