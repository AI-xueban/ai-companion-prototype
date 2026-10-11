/** 常规行为日上限（答题、任务、攻克等合计） */
export const COINS_DAILY_CAP = 150;
export const REWARD_RULE_VERSION = 'final-2026-10';

/** 基础答题：每答对一题 +2，与难度无关 */
export const COIN_PER_CORRECT = 2;
/** 错题本 · 每日攻克 */
export const COIN_DAILY_CONQUER = 20;

export type RewardSceneId =
  | 'wrong_first_right'
  | 'variant_correction'
  | 'path_clear'
  | 'path_hidden_drop'
  | 'daily_first_perfect'
  | 'micro_course_first_pass'
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
  invalidLearning?: boolean;
  receiptId?: string;
  title?: string;
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
  taskId?: string;
  isDailyTask?: boolean;
  title?: string;
  isInvalidLearning?: boolean;
  dailyTaskOrdinal?: number;
  questionTimesSec?: number[];
  sessionId: string;
  quizSetId: string;
  correctCount: number;
  totalCount: number;
  questions: { difficulty?: number; isCorrect: boolean; questionId?: string }[];
  totalTimeSec?: number;
  isDailyConquer?: boolean;
  isWrongPractice?: boolean;
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
  isPerfect?: boolean;
  isInvalidLearning?: boolean;
}
