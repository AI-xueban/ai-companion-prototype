const KEY = 'ai_friend_book_knowledge_progress_v1';
export type BookPointProgress = { watched?: boolean; practiced?: boolean; correctCount?: number; totalCount?: number };
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
