const STORAGE_KEY = 'ai_friend_practiced_questions_v1';

function readIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

function writeIds(ids: string[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...new Set(ids)]));
  } catch {
    /* ignore */
  }
}

export function getPracticedQuestionIds(): Set<string> {
  return new Set(readIds());
}

export function markQuestionsPracticed(ids: string[]) {
  if (!ids.length) return;
  writeIds([...readIds(), ...ids]);
}

function shuffle<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const current = next[i];
    next[i] = next[j];
    next[j] = current;
  }
  return next;
}

/** 先去掉已做并打乱；不够题量用剩余全部；一题都不剩才允许重复抽一套新顺序。 */
export function pickUnseenQuestions<T extends { id: string }>(pool: T[], count: number): T[] {
  if (count <= 0 || pool.length === 0) return pool.slice(0, Math.max(0, count));
  const seen = getPracticedQuestionIds();
  const fresh = shuffle(pool.filter((item) => !seen.has(item.id)));
  if (fresh.length >= count) return fresh.slice(0, count);
  if (fresh.length > 0) return fresh;
  return shuffle(pool).slice(0, count);
}
