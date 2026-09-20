import { MapNode, NodeStatus } from '../../types';

export const GEOMETRY_KNOWLEDGE_POINTS = [
  '全等三角形',
  '相似三角形',
  '等腰三角形',
  '勾股定理',
  '圆的性质',
  '圆的切线',
  '平行四边形',
  '特殊四边形',
  '三角函数',
  '圆与多边形',
  '几何应用',
  '几何综合',
] as const;

export const ALGEBRA_KNOWLEDGE_POINTS = [
  '二次函数',
  '不等式与不等式组',
  '分式方程',
  '一次函数',
  '整式运算',
  '因式分解',
  '方程组',
  '根式运算',
  '函数图像',
  '代数综合',
] as const;

export const STATS_KNOWLEDGE_POINTS = [
  '数据的收集',
  '平均数与中位数',
  '方差与标准差',
  '统计图表',
  '概率初步',
  '古典概型',
  '频率估计',
  '统计综合',
] as const;

export const NUMBER_KNOWLEDGE_POINTS = [
  '有理数运算',
  '实数与数轴',
  '整式加减',
  '因式分解',
  '二次根式',
  '分式运算',
  '数与式综合',
] as const;

export const FUNCTION_KNOWLEDGE_POINTS = [
  '函数的概念',
  '一次函数',
  '一次函数应用',
  '反比例函数',
  '二次函数图像',
  '二次函数性质',
  '函数综合',
] as const;

export const APPLICATION_KNOWLEDGE_POINTS = [
  '行程问题',
  '工程问题',
  '利润折扣',
  '方程建模',
  '几何应用',
  '压轴综合',
] as const;

export const LANGUAGE_KNOWLEDGE_POINTS: Record<string, readonly string[]> = {
  reading: ['把握中心', '圈画关键句', '概括段意', '人物形象', '写作手法', '主旨理解', '阅读综合'],
  writing: ['审题立意', '选材组材', '结构安排', '开头结尾', '细节描写', '修改升格', '习作综合'],
  poetry: ['意象理解', '情感把握', '名句默写', '炼字赏析', '手法识别', '诗词比较', '古诗综合'],
  wenyan: ['实词积累', '虚词用法', '句式翻译', '断句练习', '内容理解', '文言综合'],
  words: ['字音辨析', '字形辨析', '词语搭配', '成语运用', '病句修改', '字词综合'],
  oral: ['倾听要点', '清楚表达', '讨论交流', '转述信息', '口语综合'],
  vocab: ['单元词汇', '高频短语', '词性辨析', '搭配运用', '词汇复习', '词汇综合'],
  grammar: ['时态辨析', '从句结构', '固定搭配', '句型转换', '语法填空', '语法综合'],
  listening: ['抓关键词', '听主旨', '细节理解', '推断态度', '听力综合'],
  speaking: ['日常问答', '看图说话', '朗读语音', '情景表达', '口语综合'],
};

const NODE_OFFSETS = [0, -60, 60, 0, -60, 60, 0, -60, 60, 0, -60, 60];

export function getKnowledgePointsForCategory(category: string, count?: number): string[] {
  let points: readonly string[];
  switch (category) {
    case 'algebra':
      points = ALGEBRA_KNOWLEDGE_POINTS;
      break;
    case 'number':
      points = NUMBER_KNOWLEDGE_POINTS;
      break;
    case 'function':
      points = FUNCTION_KNOWLEDGE_POINTS;
      break;
    case 'stats':
      points = STATS_KNOWLEDGE_POINTS;
      break;
    case 'application':
      points = APPLICATION_KNOWLEDGE_POINTS;
      break;
    default:
      points = LANGUAGE_KNOWLEDGE_POINTS[category] ?? GEOMETRY_KNOWLEDGE_POINTS;
  }
  const total = count ?? points.length;
  if (total <= points.length) return [...points.slice(0, total)];
  return Array.from({ length: total }, (_, i) => points[i] ?? `专项关卡 ${i + 1}`);
}

export interface BuildExpeditionMapNodesOptions {
  titles?: readonly string[];
  totalLevels?: number;
}

/**
 * 演示用默认进度：14 关（2 周）时默认已闯到第 2 周第 6 天（0-based index 12）。
 */
export function getDemoCompletedCountForPlan(durationWeeks: number): number {
  const totalLevels = Math.max(1, durationWeeks * 7);
  if (totalLevels === 14) return 12;
  return Math.min(4, Math.max(0, totalLevels - 1));
}

/** completedCount: 已完成关卡数，下一关为 current */
export function buildExpeditionMapNodes(
  completedCount: number,
  options?: BuildExpeditionMapNodesOptions
): MapNode[] {
  const titles = options?.titles ?? GEOMETRY_KNOWLEDGE_POINTS;
  const totalLevels = options?.totalLevels ?? titles.length;
  const levelTitles = titles.length >= totalLevels
    ? titles.slice(0, totalLevels)
    : Array.from({ length: totalLevels }, (_, i) => titles[i] ?? `专项关卡 ${i + 1}`);

  const capped = Math.min(Math.max(completedCount, 0), totalLevels);

  return levelTitles.map((title, i) => {
    let status: NodeStatus;
    if (i < capped) status = 'completed';
    else if (i === capped && capped < totalLevels) status = 'current';
    else status = 'locked';

    const isLast = i === totalLevels - 1;

    return {
      id: `exp-${i + 1}`,
      level: i + 1,
      title,
      taskTitle: title,
      status,
      nodeType: isLast ? 'boss' : 'level',
      stars: status === 'completed' ? 3 : 0,
      xOffset: NODE_OFFSETS[i % NODE_OFFSETS.length],
      durationMinutes: 15,
      chapterNodeType: 'practice',
      description: `专项突破：${title}`,
      learningGoals: [`掌握${title}核心考点`],
    };
  });
}

export function getExpeditionLastNodeId(totalLevels?: number): string {
  const n = totalLevels ?? GEOMETRY_KNOWLEDGE_POINTS.length;
  return `exp-${n}`;
}

export function isExpeditionNodeId(nodeId: string): boolean {
  return nodeId.startsWith('exp-');
}

/** 根据任务 id 与当前已排关卡数判断是否为路径上的最后一关 */
export function isExpeditionLastLevel(
  nodeId: string | undefined | null,
  durationWeeks?: number,
  scheduledCount?: number
): boolean {
  if (!nodeId || !isExpeditionNodeId(nodeId)) return false;
  const total =
    scheduledCount != null
      ? Math.max(1, scheduledCount)
      : durationWeeks != null
        ? Math.max(1, durationWeeks * 7)
        : GEOMETRY_KNOWLEDGE_POINTS.length;
  return nodeId === getExpeditionLastNodeId(total);
}

/** 与 QuizPage 单关奖励规则一致，汇总本次训练计划全部关卡的累计奖励 */
export function getExpeditionCumulativeRewards() {
  const levelCount = GEOMETRY_KNOWLEDGE_POINTS.length;
  const regularCount = levelCount - 1;
  const baseXp = 50;
  const regularBonusXp = 10;
  const bossBonusXp = 50;
  const coinsPerLevel = 20;

  return {
    totalXp: regularCount * (baseXp + regularBonusXp) + (baseXp + bossBonusXp),
    totalCoins: levelCount * coinsPerLevel,
    studyDays: 12,
    totalLevels: 7,
  };
}
