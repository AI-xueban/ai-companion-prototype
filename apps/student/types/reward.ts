/** 常规行为日上限（答题、任务、攻克等合计） */
export const COINS_DAILY_CAP = 150;
export const REWARD_RULE_VERSION = 'v1.1';

/** 基础答题：每答对一题 +5，与难度无关 */
export const COIN_PER_CORRECT = 5;
/** 连对加成：连对 ≥3 题后，每题额外 +2 */
export const COIN_COMBO_BONUS = 2;
export const COMBO_STREAK_THRESHOLD = 3;

/** 单条今日任务完成 */
export const COIN_TASK_MIN = 10;
export const COIN_TASK_MAX = 20;
/** 今日任务全部完成 (3/3) 大满贯 */
export const COIN_ALL_TASKS_BONUS = 50;
/** 错题本 · 每日攻克 */
export const COIN_DAILY_CONQUER = 20;

export type RewardSceneId =
  | 'quiz_correct'
  | 'quiz_combo'
  | 'quiz_session'
  | 'daily_conquer'
  | 'video_complete'
  | 'task_complete'
  | 'task_all_complete'
  | 'achievement'
  | 'welcome_gift';

export interface RewardBreakdownItem {
  label: string;
  value: number;
}

export interface CoinBreakdownItem extends RewardBreakdownItem {
  scene: RewardSceneId;
}

export interface RewardGrantResult {
  xp: number;
  xpBreakdown: RewardBreakdownItem[];
  coins: number;
  coinBreakdown: CoinBreakdownItem[];
  coinsToday: number;
  coinsDailyCap: number;
  skippedReasons: string[];
  ruleVersion: string;
}

export interface QuizRewardInput {
  sessionId: string;
  quizSetId: string;
  correctCount: number;
  totalCount: number;
  questions: { difficulty?: number; isCorrect: boolean }[];
  totalTimeSec?: number;
  isDailyConquer?: boolean;
}

export interface VideoRewardInput {
  videoId: string;
  durationSec: number;
  effectiveWatchRatio: number;
  isMicroLesson?: boolean;
  /** 有效观看达标百分比，默认 80 */
  requiredWatchRatio?: number;
}

export interface TaskCompleteRewardInput {
  taskId: string;
  durationMinutes?: number;
  /** 今日计划中的全部 task id，用于判定 3/3 大满贯 */
  dayPlanTaskIds?: string[];
}
