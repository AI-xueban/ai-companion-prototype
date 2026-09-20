import type { UserPersona, UserStats } from '../types';

export const DEFAULT_USER_STATS: UserStats = {
  xpToday: 350,
  xpTarget: 600,
  studyMinutesToday: 120,
  streakDays: 14,
  coins: 850,
  weeklyXp: 2100,
};

export const NEWBIE_USER_STATS: UserStats = {
  xpToday: 0,
  xpTarget: 2000,
  studyMinutesToday: 0,
  streakDays: 0,
  coins: 0,
  weeklyXp: 0,
};

const PERSONA_LEVELS: Record<UserPersona, { level: number; nextLevelXp: number }> = {
  newbie: { level: 0, nextLevelXp: 200 },
  average: { level: 5, nextLevelXp: 1000 },
  ace: { level: 20, nextLevelXp: 20000 },
};

export function getDemoPersonaProgress(persona: UserPersona) {
  return PERSONA_LEVELS[persona];
}
