import { ExpeditionPlan, ExpeditionPlanHistoryRecord } from '../../types';
import { getPlanDisplayName, resolvePlanLevelTitles } from './expeditionPlanConfig';

const STORAGE_KEY = 'expedition_plan_history_v4';

function getLevelCountForPlan(plan: ExpeditionPlan): number {
  const weeks = plan.duration ?? 2;
  return weeks * 7;
}

function inferCategoryFromName(planName: string): string {
  if (planName.includes('代数')) return 'algebra';
  if (planName.includes('统计')) return 'stats';
  return 'geometry';
}

function loadRecords(): ExpeditionPlanHistoryRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ExpeditionPlanHistoryRecord[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return getDefaultHistoryRecords();
}

function saveRecords(records: ExpeditionPlanHistoryRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function getDefaultHistoryRecords(): ExpeditionPlanHistoryRecord[] {
  return [
    {
      id: 'hist_demo_cross_year',
      planName: '期末冲刺综合计划',
      createdAt: '2025-12-18T10:00:00.000Z',
      completedAt: '2026-01-08T18:00:00.000Z',
      levelCount: 14,
      completedLevels: 14,
      subject: '数学',
      status: 'completed',
      plan: {
        target: 'weakness',
        duration: 2,
        startDate: '2025-12-18T10:00:00.000Z',
        category: 'algebra',
        title: '期末冲刺综合计划',
        expectedTotalMinutes: 85,
        coverage: '覆盖代数、几何综合复习等 14 个考点',
      },
    },
    {
      id: 'hist_demo_1',
      planName: '几何专项突破计划',
      createdAt: '2025-05-18T10:00:00.000Z',
      completedAt: '2025-06-02T18:30:00.000Z',
      levelCount: 14,
      completedLevels: 14,
      subject: '数学',
      status: 'completed',
      plan: {
        target: 'weakness',
        duration: 2,
        startDate: '2025-05-18T10:00:00.000Z',
        category: 'geometry',
        topic: 'geometry_pack',
        title: '几何专项突破计划',
        expectedTotalMinutes: 85,
        coverage: '覆盖全等三角形、圆的性质等 14 个考点',
      },
    },
    {
      id: 'hist_demo_4',
      planName: '阅读理解专项突破计划',
      createdAt: '2025-05-10T09:30:00.000Z',
      completedAt: '2025-05-24T19:00:00.000Z',
      levelCount: 7,
      completedLevels: 7,
      subject: '语文',
      status: 'completed',
      plan: {
        target: 'weakness',
        duration: 1,
        startDate: '2025-05-10T09:30:00.000Z',
        category: 'reading',
        title: '阅读理解专项突破计划',
        expectedTotalMinutes: 40,
        coverage: '覆盖记叙文阅读、说明文阅读、议论文阅读等 7 个考点',
      },
    },
    {
      id: 'hist_demo_5',
      planName: '语法专项突破计划',
      createdAt: '2025-04-28T14:00:00.000Z',
      completedAt: '2025-05-12T20:15:00.000Z',
      levelCount: 21,
      completedLevels: 21,
      subject: '英语',
      status: 'completed',
      plan: {
        target: 'weakness',
        duration: 3,
        startDate: '2025-04-28T14:00:00.000Z',
        category: 'grammar',
        title: '语法专项突破计划',
        expectedTotalMinutes: 125,
        coverage: '覆盖时态语态、从句结构、非谓语动词等 21 个考点',
      },
    },
    {
      id: 'hist_demo_2',
      planName: '代数专项突破计划',
      createdAt: '2025-04-01T09:00:00.000Z',
      completedAt: '2025-04-15T20:00:00.000Z',
      levelCount: 14,
      completedLevels: 14,
      subject: '数学',
      status: 'completed',
      plan: {
        target: 'weakness',
        duration: 2,
        startDate: '2025-04-01T09:00:00.000Z',
        category: 'algebra',
        title: '代数专项突破计划',
        expectedTotalMinutes: 85,
        coverage: '覆盖二次函数、不等式、分式方程等 14 个考点',
      },
    },
    {
      id: 'hist_demo_6',
      planName: '作文提分专项计划',
      createdAt: '2025-03-22T11:00:00.000Z',
      completedAt: '2025-04-05T17:40:00.000Z',
      levelCount: 7,
      completedLevels: 7,
      subject: '语文',
      status: 'completed',
      plan: {
        target: 'weakness',
        duration: 1,
        startDate: '2025-03-22T11:00:00.000Z',
        category: 'writing',
        title: '作文提分专项计划',
        expectedTotalMinutes: 85,
        coverage: '覆盖审题立意、结构布局、语言润色等 7 个考点',
      },
    },
  ];
}

export function getExpeditionPlanHistory(): ExpeditionPlanHistoryRecord[] {
  return loadRecords()
    .filter((r) => r.status === 'completed')
    .sort(
      (a, b) =>
        new Date(getHistoryTimelineDate(b)).getTime() - new Date(getHistoryTimelineDate(a)).getTime()
    );
}

export function getExpeditionPlanHistoryById(id: string): ExpeditionPlanHistoryRecord | undefined {
  return getExpeditionPlanHistory().find((r) => r.id === id);
}

export function resolveHistoryPlan(record: ExpeditionPlanHistoryRecord): ExpeditionPlan {
  if (record.plan) return record.plan;
  const category = inferCategoryFromName(record.planName);
  return {
    target: 'weakness',
    duration: 2,
    startDate: record.createdAt,
    category,
    title: record.planName,
    expectedTotalMinutes: 85,
  };
}

export function getKnowledgeTitlesForHistory(record: ExpeditionPlanHistoryRecord): string[] {
  return resolvePlanLevelTitles(resolveHistoryPlan(record));
}

export function addExpeditionPlanHistory(
  plan: ExpeditionPlan,
  subject: string,
  completedLevels: number
): ExpeditionPlanHistoryRecord {
  const records = loadRecords();
  const record: ExpeditionPlanHistoryRecord = {
    id: `hist_${Date.now()}`,
    planName: getPlanDisplayName(plan),
    createdAt: plan.startDate,
    completedAt: new Date().toISOString(),
    levelCount: getLevelCountForPlan(plan),
    completedLevels,
    subject,
    status: 'completed',
    plan: { ...plan },
  };
  records.unshift(record);
  saveRecords(records);
  return record;
}

export function formatPlanHistoryDate(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${y}.${m}.${day} ${h}:${min}`;
}

export function formatTimelineDate(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}

export function formatTimelineDateShort(iso: string): string {
  const d = new Date(iso);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${m}.${day}`;
}

export function formatTimelineMonth(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}年${d.getMonth() + 1}月`;
}

export function getTimelineMonthKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}`;
}

/** 历史时间轴主时间：优先用完成时间（成就记录），无则回退创建时间 */
export function getHistoryTimelineDate(record: ExpeditionPlanHistoryRecord): string {
  return record.completedAt ?? record.createdAt;
}

/** 累计学习天数：从计划开始到完成，按自然日计（首尾均计入，至少 1 天） */
export function getPlanLearningDays(record: ExpeditionPlanHistoryRecord): number {
  const start = new Date(record.createdAt);
  const end = new Date(record.completedAt ?? record.createdAt);
  const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  const diffDays = Math.floor((endUtc - startUtc) / 86400000);
  return Math.max(1, diffDays + 1);
}

/** 计划周期文案：同年省略年份；跨年则起止均显示完整年份 */
export function formatPlanPeriodLabel(record: ExpeditionPlanHistoryRecord): string {
  const startDate = new Date(record.createdAt);
  const endDate = new Date(record.completedAt ?? record.createdAt);
  const crossYear = startDate.getFullYear() !== endDate.getFullYear();

  const start = crossYear ? formatTimelineDate(record.createdAt) : formatTimelineDateShort(record.createdAt);
  const end = crossYear
    ? formatTimelineDate(record.completedAt ?? record.createdAt)
    : formatTimelineDateShort(record.completedAt ?? record.createdAt);

  if (start === end) return `${start} 完成`;
  return `${start} 开始 → ${end} 完成`;
}
