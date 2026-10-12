import type { RewardGrantResult } from '../types/reward';
import type { UserStats } from '../types';

export const REWARD_HISTORY_KEY = 'ai_friend_reward_history_v1';
export interface RewardHistoryEntry {
  id: string;
  timestamp: number;
  title: string;
  coins: number;
  xp: number;
  result?: RewardGrantResult;
  wishApplicationId?: string;
}
export function getRewardHistory(): RewardHistoryEntry[] {
  try {
    const data = JSON.parse(localStorage.getItem(REWARD_HISTORY_KEY) || '[]');
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}
export function recordReward(result: RewardGrantResult, title = '学习奖励'): boolean {
  if (!result.xp && !result.coins) return false;
  const entries = getRewardHistory();
  const id = result.receiptId || crypto.randomUUID();
  if (entries.some(entry => entry.id === id)) return false;
  entries.unshift({ id, timestamp: Date.now(), title: result.title || title, coins: result.coins, xp: result.xp, result });
  localStorage.setItem(REWARD_HISTORY_KEY, JSON.stringify(entries));
  return true;
}

export function saveRewardStats(stats: UserStats, persona: string): void {
  localStorage.setItem(`ai_friend_reward_stats_${persona}`, JSON.stringify({ stats, date: new Date().toLocaleDateString('sv-SE') }));
}
export function loadRewardStats(persona: string): UserStats | null {
  try {
    const saved = JSON.parse(localStorage.getItem(`ai_friend_reward_stats_${persona}`) || 'null');
    if (!saved?.stats) return null;
    return { ...saved.stats, xpToday: saved.date === new Date().toLocaleDateString('sv-SE') ? saved.stats.xpToday : 0 };
  } catch { return null; }
}
export function recordCoinSpend(amount: number, title: string, wishApplicationId?: string): void {
  if (amount <= 0) return;
  const entries = getRewardHistory();
  entries.unshift({ id: crypto.randomUUID(), timestamp: Date.now(), title, coins: -amount, xp: 0, wishApplicationId });
  localStorage.setItem(REWARD_HISTORY_KEY, JSON.stringify(entries));
}
