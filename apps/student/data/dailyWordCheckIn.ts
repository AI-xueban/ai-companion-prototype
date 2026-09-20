import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'ai_friend_daily_word_check_ins';
export const DAILY_WORD_CHECK_IN_EVENT = 'daily-word-check-in';

export function getCheckedInDailyWordIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export function isDailyWordCheckedIn(articleId: string): boolean {
  return getCheckedInDailyWordIds().includes(articleId);
}

export function checkInDailyWord(articleId: string): void {
  const ids = getCheckedInDailyWordIds();
  if (!ids.includes(articleId)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids, articleId]));
  }
  window.dispatchEvent(new CustomEvent(DAILY_WORD_CHECK_IN_EVENT, { detail: { articleId } }));
}

export function useDailyWordCheckIns(): Set<string> {
  const [ids, setIds] = useState(() => new Set(getCheckedInDailyWordIds()));

  const refresh = useCallback(() => {
    setIds(new Set(getCheckedInDailyWordIds()));
  }, []);

  useEffect(() => {
    window.addEventListener(DAILY_WORD_CHECK_IN_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(DAILY_WORD_CHECK_IN_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [refresh]);

  return ids;
}

export function useDailyWordCheckIn(articleId: string | undefined): boolean {
  const allIds = useDailyWordCheckIns();
  return articleId ? allIds.has(articleId) : false;
}
