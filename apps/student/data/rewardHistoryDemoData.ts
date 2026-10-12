import type { RewardHistoryEntry } from '../services/rewardHistoryService';
import { COINS_DAILY_CAP, REWARD_RULE_VERSION, type CoinBreakdownItem } from '../types/reward';

/** Empty-income preview fixtures. These never enter the reward ledger or change balances. */
export function getDemoCoinIncomeHistory(): RewardHistoryEntry[] {
  const now = Date.now();
  const create = (id: string, title: string, minutesAgo: number, items: CoinBreakdownItem[], coinsToday: number, xp: number): RewardHistoryEntry => {
    const coins = items.reduce((sum, item) => sum + item.value, 0);
    return {
      id: `demo-coin-${id}`, title, timestamp: now - minutesAgo * 60000, coins, xp,
      result: {
        title, coins, xp, coinBreakdown: items,
        xpBreakdown: [{ label: '学习经验', value: xp }],
        coinsToday, coinsDailyCap: COINS_DAILY_CAP, skippedReasons: [], ruleVersion: REWARD_RULE_VERSION,
      },
    };
  };
  return [
    create('conquer', '完成每日攻克', 10, [{ scene: 'daily_conquer', label: '每日攻克任务完成', value: 20 }], 47, 100),
    create('practice', '数学练习 · 有理数', 30, [{ scene: 'quiz_correct', label: '答对 10 道题 × 2 金币', value: 20 }], 27, 100),
    create('wrong', '首次攻克旧错题', 60, [{ scene: 'quiz_correct', label: '答对 1 道题', value: 2 }, { scene: 'wrong_first_right', label: '旧错题首次答对', value: 5 }], 7, 30),
    create('variant', '错题复盘 · 变式挑战', 1440 + 30, [{ scene: 'quiz_correct', label: '答对 1 道变式题', value: 2 }, { scene: 'variant_correction', label: '标注错因、看解析后答对变式', value: 10 }], 12, 20),
    create('path', '学习路径 · L2 通关', 4320 + 60, [{ scene: 'quiz_correct', label: '答对 5 道题 × 2 金币', value: 10 }, { scene: 'path_clear', label: 'L2 关卡通关奖励', value: 10 }], 20, 80),
  ];
}
