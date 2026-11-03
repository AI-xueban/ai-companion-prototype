import {
  COINS_DAILY_CAP, COIN_PER_CORRECT, COIN_DAILY_CONQUER, REWARD_RULE_VERSION,
  type RewardGrantResult, type RewardBreakdownItem, type CoinBreakdownItem,
  type QuizRewardInput, type VideoRewardInput, type TaskCompleteRewardInput, type RewardSceneId,
} from '../types/reward';

const LEDGER_KEY = 'ai_friend_reward_ledger_v1';
interface RewardLedger {
  date: string; coinsToday: number; dailyConquerGranted: boolean; dailyFirstPerfectGranted: boolean;
  dailyTasksGrandPrizeGranted: boolean; completedTaskIds: string[]; perfectTaskIds: string[];
  videoCompleted: string[]; quizSetCounts: Record<string, number>; moodGranted: boolean;
  firstRightIds: string[];
  knowledgeLitIds: string[];
  reviewedWrongIds: string[];
  correctedVariantIds: string[];
}
function todayKey(): string { return new Date().toLocaleDateString('sv-SE'); }
function loadLedger(): RewardLedger {
  const empty: RewardLedger = { date: todayKey(), coinsToday: 0, dailyConquerGranted: false, dailyFirstPerfectGranted: false, dailyTasksGrandPrizeGranted: false, completedTaskIds: [], perfectTaskIds: [], videoCompleted: [], quizSetCounts: {}, moodGranted: false, firstRightIds: [], knowledgeLitIds: [], reviewedWrongIds: [], correctedVariantIds: [] };
  try {
    const saved = JSON.parse(localStorage.getItem(LEDGER_KEY) || 'null') as Partial<RewardLedger> | null;
    if (!saved) return empty;
    const lifetime = { videoCompleted: saved.videoCompleted ?? [], quizSetCounts: saved.quizSetCounts ?? {}, firstRightIds: saved.firstRightIds ?? [], knowledgeLitIds: saved.knowledgeLitIds ?? [] };
    return saved.date === empty.date ? { ...empty, ...saved, ...lifetime, coinsToday: Math.min(150, saved.coinsToday ?? 0) } : { ...empty, ...lifetime };
  } catch { return empty; }
}
function tryGrantCoins(ledger: RewardLedger, scene: RewardSceneId, label: string, amount: number, skipped: string[]): CoinBreakdownItem | undefined {
  if (amount <= 0) return;
  const granted = Math.min(amount, Math.max(0, COINS_DAILY_CAP - ledger.coinsToday));
  ledger.coinsToday += granted;
  if (granted < amount) skipped.push(`${label}：应得 ${amount}，实际到账 ${granted}；因每日 150 金币上限，未发放 ${amount - granted} 金币。`);
  return granted > 0 ? { scene, label, value: granted } : undefined;
}
function buildResult(xp: number, xpBreakdown: RewardBreakdownItem[], coinBreakdown: CoinBreakdownItem[], ledger: RewardLedger, skippedReasons: string[], title = '学习奖励'): RewardGrantResult {
  localStorage.setItem(LEDGER_KEY, JSON.stringify(ledger));
  return { receiptId: crypto.randomUUID(), title, xp, xpBreakdown, coins: coinBreakdown.reduce((sum, item) => sum + item.value, 0), coinBreakdown, coinsToday: ledger.coinsToday, coinsDailyCap: COINS_DAILY_CAP, skippedReasons, ruleVersion: REWARD_RULE_VERSION };
}
export function getCoinsToday(): number { return loadLedger().coinsToday; }
export function mergeRewardResults(a: RewardGrantResult, b: RewardGrantResult): RewardGrantResult {
  return { ...a, receiptId: crypto.randomUUID(), xp: a.xp + b.xp, coins: a.coins + b.coins, xpBreakdown: [...a.xpBreakdown, ...b.xpBreakdown], coinBreakdown: [...a.coinBreakdown, ...b.coinBreakdown], skippedReasons: [...a.skippedReasons, ...b.skippedReasons], coinsToday: Math.max(a.coinsToday, b.coinsToday) };
}
export function grantQuizSessionReward(input: QuizRewardInput): RewardGrantResult {
  const ledger = loadLedger();
  const skipped: string[] = [];
  const xpBreakdown: RewardBreakdownItem[] = [];
  const coinBreakdown: CoinBreakdownItem[] = [];
  const previous = ledger.quizSetCounts[input.quizSetId] ?? 0;
  const repeat = previous >= 1;
  const extraTask = (input.dailyTaskOrdinal ?? 1) > 3 || Boolean(input.isDailyTask && ledger.completedTaskIds.length >= 3 && !ledger.completedTaskIds.includes(input.taskId || ''));
  ledger.quizSetCounts[input.quizSetId] = previous + 1;
  const rate = input.totalCount > 0 ? input.correctCount / input.totalCount * 100 : 0;
  let xp = 0;
  if (rate < 20) {
    xp = 30; xpBreakdown.push({ label: '正确率低于 20%，保底经验', value: 30 });
  } else {
    input.questions.forEach((question, index) => {
      const level = Math.max(1, Math.min(5, Math.round(question.difficulty ?? 3)));
      const multiplier = [0.8, 1, 1.2, 1.5, 2][level - 1];
      const value = question.isCorrect ? Math.round(10 * multiplier) : 0;
      xp += value;
      xpBreakdown.push({ label: `第 ${index + 1} 题 · L${level} ×${multiplier}${question.isCorrect ? '' : ' · 未答对'}`, value });
    });
    const multiplier = input.totalCount > 1 ? (rate === 100 ? 1.2 : rate >= 90 ? 1.1 : 1) : 1;
    const extra = Math.round(xp * multiplier) - xp;
    if (extra) xpBreakdown.push({ label: rate === 100 ? '满分加成 +20%' : '高正确率加成 +10%', value: extra });
    xp += extra;
  }
  if ((input.totalTimeSec ?? 0) > input.totalCount * 45 * 1.5) {
    const before = xp; xp = Math.round(xp * .9);
    xpBreakdown.push({ label: '超时提交，本次经验 -10%', value: xp - before });
  }
  if (repeat || extraTask) {
    const before = xp; xp = Math.round(xp * .5);
    xpBreakdown.push({ label: repeat ? '重复练习，本次经验减半' : '第 4 个及以上日课，经验减半', value: xp - before });
    skipped.push(repeat ? '重复刷同一套题，不再发放金币。' : '今日已完成 3 个日课，后续定制任务不发放金币。');
  }
  const addCoin = (scene: RewardSceneId, label: string, value: number) => { const item = tryGrantCoins(ledger, scene, label, value, skipped); if (item) coinBreakdown.push(item); };
  if (!repeat && !extraTask) {
    addCoin('quiz_correct', `答对 ${input.correctCount} 题 × ${COIN_PER_CORRECT} 金币`, input.correctCount * COIN_PER_CORRECT);
    if (rate === 100 && input.totalCount > 1) {
      if (!ledger.dailyFirstPerfectGranted) {
        ledger.dailyFirstPerfectGranted = true;
        const average = input.questions.reduce((sum, q) => sum + (q.difficulty ?? 3), 0) / input.totalCount;
        addCoin('daily_first_perfect', '今日首次完美通关', average >= 4 ? 20 : 10);
      } else skipped.push('今日完美通关金币奖励已领取（每日最多一次）。');
    }
    if (input.isDailyConquer || input.isWrongPractice) {
      const mastered = input.questions.filter(q => q.isCorrect);
      const fresh = mastered.filter(q => q.questionId && !ledger.firstRightIds.includes(q.questionId));
      fresh.forEach(q => ledger.firstRightIds.push(q.questionId!));
      if (fresh.length) addCoin('wrong_first_right', `首次消灭 ${fresh.length} 道历史错题 ×5`, fresh.length * 5);
      const extraXp = mastered.length * 20;
      xp += extraXp;
      if (extraXp) xpBreakdown.push({ label: `攻克 ${mastered.length} 道错题 ×20 XP`, value: extraXp });
      if (input.isDailyConquer && input.correctCount === input.totalCount) {
        if (!ledger.dailyConquerGranted) { ledger.dailyConquerGranted = true; addCoin('daily_conquer', '完成每日攻克任务', COIN_DAILY_CONQUER); }
        else skipped.push('今日每日攻克奖励已领取。');
      }
    }
  }
  return buildResult(xp, xpBreakdown, coinBreakdown, ledger, skipped, input.title || (input.isDailyConquer ? '每日攻克' : '答题练习'));
}
export function grantTaskCompleteReward(input: TaskCompleteRewardInput): RewardGrantResult {
  const ledger = loadLedger();
  if (input.isInvalidLearning) return buildResult(0, [], [], ledger, ['无效学习，任务奖励未发放。']);
  if (ledger.completedTaskIds.includes(input.taskId)) return buildResult(0, [], [], ledger, ['该日课任务今日奖励已领取。']);
  ledger.completedTaskIds.push(input.taskId);
  if (input.isPerfect) ledger.perfectTaskIds.push(input.taskId);
  let xp = ledger.completedTaskIds.length > 3 ? 50 : 100;
  const breakdown = [{ label: xp === 50 ? '额外日课任务，完成经验减半' : '完成星轨日课任务', value: xp }];
  const planIds = input.dayPlanTaskIds ?? [];
  if (planIds.length === 3 && planIds.every(id => ledger.perfectTaskIds.includes(id)) && !ledger.dailyTasksGrandPrizeGranted) {
    ledger.dailyTasksGrandPrizeGranted = true; xp += 100;
    breakdown.push({ label: '完美完成全部 3 个任务，全满贯', value: 100 });
  }
  return buildResult(xp, breakdown, [], ledger, [], '星轨日课完成');
}
export function grantMoodCheckInReward(): RewardGrantResult {
  const ledger = loadLedger();
  if (ledger.moodGranted) return buildResult(0, [], [], ledger, ['今日心情签到奖励已领取。']);
  ledger.moodGranted = true;
  return buildResult(20, [{ label: '今日首次心情签到', value: 20 }], [], ledger, [], '心情签到');
}
export function grantKnowledgePointReward(nodeId: string): RewardGrantResult {
  const ledger = loadLedger();
  if (ledger.knowledgeLitIds.includes(nodeId)) return buildResult(0, [], [], ledger, ['该知识点已领取首次点亮奖励。']);
  ledger.knowledgeLitIds.push(nodeId);
  return buildResult(50, [{ label: '首次点亮知识点', value: 50 }], [], ledger, [], '知识图谱探索');
}
/** 调用方需确认已标注错因，并实际打开解析。 */
export function grantWrongReviewReward(questionId: string): RewardGrantResult | undefined {
  const ledger = loadLedger();
  if (ledger.reviewedWrongIds.includes(questionId)) return;
  ledger.reviewedWrongIds.push(questionId);
  return buildResult(5, [{ label: '标注错因并浏览解析', value: 5 }], [], ledger, [], '错题归因与复盘');
}
export function grantVariantCorrectionReward(originalQuestionId: string): RewardGrantResult | undefined {
  const ledger = loadLedger();
  if (!ledger.reviewedWrongIds.includes(originalQuestionId) || ledger.correctedVariantIds.includes(originalQuestionId)) return;
  ledger.correctedVariantIds.push(originalQuestionId);
  const skipped: string[] = [];
  const coin = tryGrantCoins(ledger, 'variant_correction', '深度纠错，做对变式题', 10, skipped);
  return buildResult(10, [{ label: '错因复盘后做对变式题', value: 10 }], coin ? [coin] : [], ledger, skipped, '变式订正');
}
export function grantVideoReward(input: VideoRewardInput): RewardGrantResult {
  const ledger = loadLedger();
  const threshold = input.requiredWatchRatio ?? 80;
  if (input.effectiveWatchRatio < threshold) return buildResult(0, [], [], ledger, [`有效观看需达到 ${threshold}%`]);
  if (ledger.videoCompleted.includes(input.videoId)) return buildResult(0, [], [], ledger, ['该视频奖励已领取。']);
  ledger.videoCompleted.push(input.videoId);
  const base = input.durationSec < 180 ? 15 : input.durationSec <= 480 ? 20 : 25;
  const breakdown = [{ label: '视频有效完成', value: base }];
  if (input.isMicroLesson) breakdown.push({ label: '微课经验加成', value: 5 });
  return buildResult(base + (input.isMicroLesson ? 5 : 0), breakdown, [], ledger, [], input.isMicroLesson ? '微课完成' : '视频有效完成');
}
export function grantWelcomeGift(): RewardGrantResult {
  const ledger = loadLedger();
  const skipped: string[] = [];
  const coin = tryGrantCoins(ledger, 'welcome_gift', '见面礼', 300, skipped);
  return buildResult(200, [{ label: '见面礼经验', value: 200 }], coin ? [coin] : [], ledger, skipped, '见面礼');
}
export function resetRewardLedgerForDemo(): void { localStorage.removeItem(LEDGER_KEY); }
export function demoPerfectQuizReward(): RewardGrantResult {
  resetRewardLedgerForDemo();
  return grantQuizSessionReward({ sessionId: crypto.randomUUID(), quizSetId: 'demo_perfect_set', totalCount: 10, correctCount: 10, questions: Array.from({ length: 10 }, () => ({ difficulty: 3, isCorrect: true })), totalTimeSec: 300 });
}
export function demoDailyConquerReward(): RewardGrantResult {
  resetRewardLedgerForDemo();
  return grantQuizSessionReward({ sessionId: crypto.randomUUID(), quizSetId: 'demo_conquer_set', totalCount: 5, correctCount: 5, questions: Array.from({ length: 5 }, (_, i) => ({ questionId: `demo_wrong_${i}`, difficulty: 3, isCorrect: true })), isDailyConquer: true });
}
export function demoVideoReward(): RewardGrantResult {
  resetRewardLedgerForDemo();
  return grantVideoReward({ videoId: 'demo_math_lesson', durationSec: 180, effectiveWatchRatio: 85 });
}
