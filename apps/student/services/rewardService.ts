import {
  COINS_DAILY_CAP,
  COIN_PER_CORRECT,
  COIN_COMBO_BONUS,
  COMBO_STREAK_THRESHOLD,
  COIN_TASK_MIN,
  COIN_TASK_MAX,
  COIN_ALL_TASKS_BONUS,
  COIN_DAILY_CONQUER,
  REWARD_RULE_VERSION,
  RewardGrantResult,
  RewardBreakdownItem,
  CoinBreakdownItem,
  QuizRewardInput,
  VideoRewardInput,
  TaskCompleteRewardInput,
  RewardSceneId,
} from '../types/reward';

const LEDGER_KEY = 'ai_friend_reward_ledger_v1';

interface RewardLedger {
  date: string;
  coinsToday: number;
  dailyConquerGranted: boolean;
  dailyTasksGrandPrizeGranted: boolean;
  completedTaskIds: string[];
  videoCompleted: string[];
  quizSetCounts: Record<string, number>;
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function loadLedger(): RewardLedger {
  const empty: RewardLedger = {
    date: todayKey(),
    coinsToday: 0,
    dailyConquerGranted: false,
    dailyTasksGrandPrizeGranted: false,
    completedTaskIds: [],
    videoCompleted: [],
    quizSetCounts: {},
  };
  try {
    const raw = localStorage.getItem(LEDGER_KEY);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as Partial<RewardLedger>;
    if (parsed.date !== todayKey()) return empty;
    return {
      ...empty,
      ...parsed,
      date: todayKey(),
      completedTaskIds: parsed.completedTaskIds ?? [],
      videoCompleted: parsed.videoCompleted ?? [],
      quizSetCounts: parsed.quizSetCounts ?? {},
    };
  } catch {
    return empty;
  }
}

function saveLedger(ledger: RewardLedger): void {
  localStorage.setItem(LEDGER_KEY, JSON.stringify(ledger));
}

function difficultyMultiplier(d: number): number {
  if (d <= 2) return 1.0;
  if (d <= 4) return 1.2;
  return 1.5;
}

function videoXpByDuration(durationSec: number): number {
  if (durationSec < 180) return 15;
  if (durationSec <= 480) return 20;
  return 25;
}

const CAP_EXEMPT_SCENES: RewardSceneId[] = ['welcome_gift', 'achievement'];

function tryGrantCoins(
  ledger: RewardLedger,
  scene: RewardSceneId,
  label: string,
  amount: number,
  skipped: string[],
): { granted: number; item?: CoinBreakdownItem } {
  if (amount <= 0) return { granted: 0 };
  const bypassCap = CAP_EXEMPT_SCENES.includes(scene);
  if (!bypassCap) {
    const remaining = COINS_DAILY_CAP - ledger.coinsToday;
    if (remaining <= 0) {
      skipped.push(`今日金币已达上限 ${COINS_DAILY_CAP}`);
      return { granted: 0 };
    }
    const granted = Math.min(amount, remaining);
    ledger.coinsToday += granted;
    if (granted < amount) {
      skipped.push(`部分金币因日上限未发放（${amount - granted}）`);
    }
    return { granted, item: { scene, label, value: granted } };
  }
  ledger.coinsToday += amount;
  return { granted: amount, item: { scene, label, value: amount } };
}

function buildResult(
  xp: number,
  xpBreakdown: RewardBreakdownItem[],
  coinBreakdown: CoinBreakdownItem[],
  ledger: RewardLedger,
  skipped: string[],
): RewardGrantResult {
  saveLedger(ledger);
  const coins = coinBreakdown.reduce((s, c) => s + c.value, 0);
  return {
    xp,
    xpBreakdown,
    coins,
    coinBreakdown,
    coinsToday: ledger.coinsToday,
    coinsDailyCap: COINS_DAILY_CAP,
    skippedReasons: skipped,
    ruleVersion: REWARD_RULE_VERSION,
  };
}

/** 按题序计算基础答题 + 连对加成金币（与难度无关） */
function calcAnswerCoins(
  questions: { isCorrect: boolean }[],
): { base: number; combo: number; correctCount: number; comboCount: number } {
  let streak = 0;
  let base = 0;
  let combo = 0;
  let correctCount = 0;
  let comboCount = 0;

  for (const q of questions) {
    if (q.isCorrect) {
      correctCount += 1;
      streak += 1;
      base += COIN_PER_CORRECT;
      if (streak >= COMBO_STREAK_THRESHOLD) {
        combo += COIN_COMBO_BONUS;
        comboCount += 1;
      }
    } else {
      streak = 0;
    }
  }

  return { base, combo, correctCount, comboCount };
}

function taskCoinAmount(durationMinutes = 15): number {
  const extra = Math.min(COIN_TASK_MAX - COIN_TASK_MIN, Math.floor(durationMinutes / 10));
  return COIN_TASK_MIN + extra;
}

export function mergeRewardResults(
  a: RewardGrantResult,
  b: RewardGrantResult,
): RewardGrantResult {
  return {
    xp: a.xp + b.xp,
    xpBreakdown: [...a.xpBreakdown, ...b.xpBreakdown],
    coins: a.coins + b.coins,
    coinBreakdown: [...a.coinBreakdown, ...b.coinBreakdown],
    coinsToday: Math.max(a.coinsToday, b.coinsToday),
    coinsDailyCap: a.coinsDailyCap,
    skippedReasons: [...a.skippedReasons, ...b.skippedReasons],
    ruleVersion: REWARD_RULE_VERSION,
  };
}

export function grantQuizSessionReward(input: QuizRewardInput): RewardGrantResult {
  const ledger = loadLedger();
  const skipped: string[] = [];
  const xpBreakdown: RewardBreakdownItem[] = [];
  const coinBreakdown: CoinBreakdownItem[] = [];

  const correctRate = input.totalCount > 0
    ? Math.round((input.correctCount / input.totalCount) * 100)
    : 0;

  const prevCount = ledger.quizSetCounts[input.quizSetId] ?? 0;
  const isRepeat = prevCount >= 1;
  ledger.quizSetCounts[input.quizSetId] = prevCount + 1;

  const expectedSec = input.totalCount * 45;
  const isOvertime = (input.totalTimeSec ?? 0) > expectedSec * 1.5;

  let xp = 0;

  if (correctRate < 20) {
    xp = 30;
    xpBreakdown.push({ label: '保底经验（建议先复习）', value: 30 });
  } else {
    let baseXp = 0;
    input.questions.forEach((q, i) => {
      const perQ = Math.round(10 * difficultyMultiplier(q.difficulty ?? 3));
      baseXp += perQ;
      xpBreakdown.push({ label: `第 ${i + 1} 题`, value: perQ });
    });

    let perfMul = 1;
    let perfLabel = '';
    if (correctRate >= 100) {
      perfMul = 1.2;
      perfLabel = '满分加成 +20%';
    } else if (correctRate >= 90) {
      perfMul = 1.1;
      perfLabel = '高正确率 +10%';
    }

    xp = Math.round(baseXp * perfMul);
    if (perfLabel) {
      xpBreakdown.push({ label: perfLabel, value: xp - baseXp });
    }
    if (isOvertime) {
      const before = xp;
      xp = Math.round(xp * 0.9);
      xpBreakdown.push({ label: '超时提交 -10%', value: xp - before });
    }
    if (isRepeat) {
      const before = xp;
      xp = Math.round(xp * 0.5);
      xpBreakdown.push({ label: '重复练习减半', value: xp - before });
      skipped.push('重复刷题不再发放金币');
    }
  }

  if (!isRepeat) {
    const { base, combo, correctCount, comboCount } = calcAnswerCoins(input.questions);

    if (base > 0) {
      const c = tryGrantCoins(
        ledger,
        'quiz_correct',
        `基础答题（${correctCount} 题）`,
        base,
        skipped,
      );
      if (c.item) coinBreakdown.push(c.item);
    }

    if (combo > 0) {
      const c = tryGrantCoins(
        ledger,
        'quiz_combo',
        `连对加成（${comboCount} 题 ×${COIN_COMBO_BONUS}）`,
        combo,
        skipped,
      );
      if (c.item) coinBreakdown.push(c.item);
    }

    if (input.isDailyConquer) {
      if (!ledger.dailyConquerGranted) {
        ledger.dailyConquerGranted = true;
        const c = tryGrantCoins(ledger, 'daily_conquer', '每日攻克', COIN_DAILY_CONQUER, skipped);
        if (c.item) coinBreakdown.push(c.item);
      } else {
        skipped.push('今日每日攻克金币已领取');
      }
    }
  }

  return buildResult(xp, xpBreakdown, coinBreakdown, ledger, skipped);
}

/** 完成单条今日任务；若 3/3 全完成则额外发放大满贯奖励 */
export function grantTaskCompleteReward(input: TaskCompleteRewardInput): RewardGrantResult {
  const ledger = loadLedger();
  const skipped: string[] = [];
  const coinBreakdown: CoinBreakdownItem[] = [];

  if (ledger.completedTaskIds.includes(input.taskId)) {
    skipped.push('该任务今日金币已领取');
    return buildResult(0, [], coinBreakdown, ledger, skipped);
  }

  ledger.completedTaskIds.push(input.taskId);

  const amount = taskCoinAmount(input.durationMinutes);
  const c = tryGrantCoins(ledger, 'task_complete', '完成今日任务', amount, skipped);
  if (c.item) coinBreakdown.push(c.item);

  const planIds = input.dayPlanTaskIds ?? [];
  const allDone = planIds.length > 0
    && planIds.every((id) => ledger.completedTaskIds.includes(id));

  if (allDone && !ledger.dailyTasksGrandPrizeGranted) {
    ledger.dailyTasksGrandPrizeGranted = true;
    const g = tryGrantCoins(
      ledger,
      'task_all_complete',
      `今日任务全完成 (${planIds.length}/${planIds.length})`,
      COIN_ALL_TASKS_BONUS,
      skipped,
    );
    if (g.item) coinBreakdown.push(g.item);
  }

  return buildResult(0, [], coinBreakdown, ledger, skipped);
}

export function grantVideoReward(input: VideoRewardInput): RewardGrantResult {
  const ledger = loadLedger();
  const skipped: string[] = [];
  const xpBreakdown: RewardBreakdownItem[] = [];

  const threshold = input.requiredWatchRatio ?? 80;

  if (input.effectiveWatchRatio < threshold) {
    skipped.push(`有效观看 ${Math.round(input.effectiveWatchRatio)}%，需达到 ${threshold}%`);
    return buildResult(0, [], [], ledger, skipped);
  }

  const videoKey = input.videoId;
  if (ledger.videoCompleted.includes(videoKey)) {
    skipped.push('该视频奖励已领取');
    return buildResult(0, [], [], ledger, skipped);
  }

  ledger.videoCompleted.push(videoKey);

  let xp = videoXpByDuration(input.durationSec);
  xpBreakdown.push({ label: '知识点视频完成', value: xp });

  if (input.isMicroLesson) {
    xp += 5;
    xpBreakdown.push({ label: '微课加成', value: 5 });
  }

  return buildResult(xp, xpBreakdown, [], ledger, skipped);
}

export function grantWelcomeGift(): RewardGrantResult {
  const ledger = loadLedger();
  const skipped: string[] = [];
  const c = tryGrantCoins(ledger, 'welcome_gift', '见面礼', 300, skipped);
  const coinBreakdown: CoinBreakdownItem[] = c.item ? [c.item] : [];
  return buildResult(200, [{ label: '见面礼经验', value: 200 }], coinBreakdown, ledger, skipped);
}

/** 演示用：重置今日账本 */
export function resetRewardLedgerForDemo(): void {
  localStorage.removeItem(LEDGER_KEY);
}

/** 演示用：构造满分测验奖励 */
export function demoPerfectQuizReward(): RewardGrantResult {
  resetRewardLedgerForDemo();
  return grantQuizSessionReward({
    sessionId: `demo_${Date.now()}`,
    quizSetId: 'demo_perfect_set',
    correctCount: 10,
    totalCount: 10,
    questions: Array.from({ length: 10 }).map(() => ({ difficulty: 3, isCorrect: true })),
    totalTimeSec: 300,
  });
}

/** 演示用：每日攻克 */
export function demoDailyConquerReward(): RewardGrantResult {
  resetRewardLedgerForDemo();
  return grantQuizSessionReward({
    sessionId: `demo_conquer_${Date.now()}`,
    quizSetId: 'demo_conquer_set',
    correctCount: 5,
    totalCount: 5,
    questions: Array.from({ length: 5 }).map(() => ({ difficulty: 3, isCorrect: true })),
    isDailyConquer: true,
  });
}

/** 演示用：视频观看达标 */
export function demoVideoReward(): RewardGrantResult {
  resetRewardLedgerForDemo();
  return grantVideoReward({
    videoId: 'demo_math_lesson',
    durationSec: 180,
    effectiveWatchRatio: 85,
  });
}
