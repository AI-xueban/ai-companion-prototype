import { ExpeditionPlan } from '../../types';
import { getKnowledgePointsForCategory } from './expeditionMapNodes';
import { buildThemeLevelTitles, getTextbookThemes } from './expeditionCatalog';

export const MATH_CATEGORY_META: Record<string, { label: string; coverage: string }> = {
  algebra: {
    label: '代数',
    coverage: '覆盖二次函数、不等式、分式方程等 10 个考点',
  },
  geometry: {
    label: '几何',
    coverage: '覆盖全等三角形、圆的性质等 12 个考点',
  },
  geometry_pack: {
    label: '几何',
    coverage: '覆盖全等三角形、圆的性质等 12 个考点',
  },
  stats: {
    label: '统计与概率',
    coverage: '覆盖数据分析、概率初步等 8 个考点',
  },
  number: {
    label: '数与式',
    coverage: '覆盖实数、整式、二次根式等运算基础',
  },
  function: {
    label: '函数',
    coverage: '覆盖一次函数、二次函数与反比例函数',
  },
  application: {
    label: '应用与综合',
    coverage: '覆盖应用题建模与压轴综合题',
  },
  unsure: {
    label: '综合',
    coverage: '基于近期错题智能匹配 12 个核心考点',
  },
  reading: { label: '阅读', coverage: '覆盖课文读懂、方法迁移与关键信息提取' },
  writing: { label: '写作', coverage: '覆盖审题、构思与成文表达' },
  poetry: { label: '古诗词', coverage: '覆盖意象、情感与背诵默写' },
  wenyan: { label: '文言文', coverage: '覆盖字词、句式与翻译' },
  words: { label: '字词积累', coverage: '覆盖字音字形与词语运用' },
  oral: { label: '口语交际', coverage: '覆盖表达、交流与倾听' },
  vocab: { label: '词汇', coverage: '覆盖单元词汇与高频短语' },
  grammar: { label: '语法', coverage: '覆盖时态、句型与搭配' },
  listening: { label: '听力', coverage: '覆盖听音辨义与信息抓取' },
  speaking: { label: '口语', coverage: '覆盖日常交流与朗读表达' },
};

export const FOCUS_LABELS: Record<string, string> = {
  concept: '概念强化',
  calc: '计算特训',
  app: '模型拆解',
};

export interface WizardPlanPayload {
  intent: string;
  duration: number;
  topic?: string;
  focus?: string;
  category?: string;
  topics?: string[];
  textbook?: string;
  subject?: string;
  selectedIds?: string[];
  selectedLabels?: string[];
  levelTitles?: string[];
  selectionMode?: 'knowledge' | 'chapter';
  rangeSummary?: string;
  coverage?: string;
  title?: string;
}

export function getExpectedTotalMinutes(weeks: number): number {
  if (weeks === 1) return 40;
  if (weeks === 2) return 85;
  return 125;
}

export function resolveCategory(payload: WizardPlanPayload): string {
  if (payload.category) return payload.category;
  if (payload.topic === 'geometry_pack') return 'geometry';
  if (payload.topic && MATH_CATEGORY_META[payload.topic]) return payload.topic;
  return 'geometry';
}

export function getPlanTitle(category: string, subject?: string, topics?: string[]): string {
  if (topics && topics.length > 1) return '综合专项突破计划';
  const meta = MATH_CATEGORY_META[category];
  if (meta) return `${meta.label}专项突破计划`;
  if (subject) return `${subject}专项突破计划`;
  return '专项突破计划';
}

export function getPlanCoverage(category: string): string {
  return MATH_CATEGORY_META[category]?.coverage ?? '覆盖核心考点与易错题型';
}

export function resolvePlanLevelTitles(plan: ExpeditionPlan): string[] {
  if (plan.levelTitles && plan.levelTitles.length > 0) return plan.levelTitles;
  const total = Math.max(1, plan.duration * 7);
  return getKnowledgePointsForCategory(plan.category ?? 'geometry', total);
}

export function buildExpeditionPlan(payload: WizardPlanPayload, subject?: string): ExpeditionPlan {
  const resolvedSubject = payload.subject || subject;
  const category = resolveCategory(payload);
  const quota = Math.max(1, payload.duration * 7);
  const levelTitles =
    payload.levelTitles && payload.levelTitles.length > 0
      ? payload.levelTitles.slice(0, quota)
      : getKnowledgePointsForCategory(category, quota);
  const title = payload.title ?? getPlanTitle(category, resolvedSubject, payload.topics);
  const coverage = payload.coverage ?? getPlanCoverage(category);

  return {
    target: payload.intent || 'weakness',
    duration: payload.duration,
    startDate: new Date().toISOString(),
    topic: payload.topic || category,
    category,
    focus: payload.focus,
    title,
    expectedTotalMinutes: getExpectedTotalMinutes(payload.duration),
    coverage,
    textbook: payload.textbook,
    subject: resolvedSubject,
    levelTitles,
  };
}

/** 演示 / skipWizard：按教材顺序取第一个主题生成计划 */
export function buildDefaultExpeditionPlan(
  subject: string,
  textbook: string | undefined,
  duration = 2,
  _options?: { hasLearningData?: boolean }
): ExpeditionPlan {
  const theme = getTextbookThemes(subject, textbook)[0];
  const quota = Math.max(1, duration * 7);
  if (!theme) {
    return buildExpeditionPlan(
      {
        intent: 'weakness',
        duration,
        textbook,
        subject,
        category: 'geometry',
        topic: 'geometry',
        topics: ['geometry'],
      },
      subject
    );
  }
  return buildExpeditionPlan(
    {
      intent: 'weakness',
      duration,
      textbook,
      subject,
      category: theme.id,
      topic: theme.id,
      topics: [theme.id],
      title: `${theme.label}专项突破计划`,
      coverage: theme.knowledgePoints.slice(0, 3).join('、') || `覆盖「${theme.label}」核心内容`,
      levelTitles: buildThemeLevelTitles(theme, quota),
      selectedLabels: [theme.label],
    },
    subject
  );
}

export function getPlanDisplayName(plan: ExpeditionPlan): string {
  return plan.title ?? getPlanTitle(plan.category ?? 'geometry', plan.subject);
}

export function getPlanExpectedTotalMinutes(plan: ExpeditionPlan): number {
  return plan.expectedTotalMinutes ?? getExpectedTotalMinutes(plan.duration);
}

export function getPlanCoverageText(plan: ExpeditionPlan): string {
  if (plan.coverage) return plan.coverage;
  if (plan.textbook && plan.rangeSummary) {
    return `${plan.textbook} · ${plan.rangeSummary}`;
  }
  return getPlanCoverage(plan.category ?? 'geometry');
}
