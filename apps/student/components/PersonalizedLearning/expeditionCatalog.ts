import { ExpeditionPlan, SubjectType } from '../../types';
import {
  AssessmentCatalogNode,
  assessmentShowsKnowledgePoints,
  collectAssessmentLeaves,
  toAssessmentCatalog,
} from '../Dashboard/AssessmentConfigPage';
import {
  getTextbookCatalog,
  isChapterOnlyTextbook,
  STUDENT_STUDY_CONTEXT,
} from '../../data/syncTextbookCatalog';

export type SelectionMode = 'knowledge' | 'chapter';
export type HealthTone = 'none' | 'low' | 'mid' | 'high';
export type ExpeditionSimScenario = 'enough' | 'none' | 'sparse' | 'first-time';

/** 低于 60 红，60～80（不含 80）黄，80 及以上绿，无健康分灰。 */
export function getHealthTone(health?: number): HealthTone {
  if (typeof health !== 'number') return 'none';
  if (health < 60) return 'low';
  if (health < 80) return 'mid';
  return 'high';
}
export type ContinuePromptKind =
  | 'review'
  | 'try-new'
  | 'continue-chapters'
  | 'all-done-math'
  | 'all-done-lang';

export interface SelectableItem {
  id: string;
  label: string;
  sectionId: string;
  sectionLabel: string;
  chapterId: string;
  chapterLabel: string;
  health?: number;
  learned?: boolean;
}

export function knowledgePointId(sectionId: string, point: string) {
  return `${sectionId}::kp::${point}`;
}

export function getPlanQuota(weeks: number) {
  return Math.max(1, weeks * 7);
}

export const THEME_PAGE_SIZE = 6;

export interface TextbookTheme {
  id: string;
  label: string;
  chapterLabel: string;
  knowledgePoints: string[];
}

/** 按教材目录顺序展开主题：有节则用节，只有章则用章。 */
export function getTextbookThemes(subject: string, textbook?: string): TextbookTheme[] {
  const catalog = getTextbookCatalog(subject as SubjectType, textbook);
  const chapterOnly = isChapterOnlyTextbook(subject, textbook);
  const themes: TextbookTheme[] = [];
  for (const chapter of catalog) {
    const sections = chapterOnly || chapter.children.length === 0 ? [chapter] : chapter.children;
    for (const section of sections) {
      themes.push({
        id: section.id,
        label: section.label,
        chapterLabel: chapter.label,
        knowledgePoints: section.knowledgePoints?.length
          ? section.knowledgePoints
          : chapter.knowledgePoints ?? [],
      });
    }
  }
  return themes;
}

/** 从 offset 起取一波主题；不足一波时从本教材开头循环补齐，展示仍按教材顺序。 */
export function takeThemeBatch(
  themes: TextbookTheme[],
  offset: number,
  size = THEME_PAGE_SIZE
): TextbookTheme[] {
  if (themes.length === 0) return [];
  if (themes.length <= size) return themes;
  const picked: TextbookTheme[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < themes.length && picked.length < size; i++) {
    const item = themes[(offset + i) % themes.length];
    if (seen.has(item.id)) break;
    seen.add(item.id);
    picked.push(item);
  }
  return picked;
}

export function nextThemeOffset(total: number, offset: number, size = THEME_PAGE_SIZE): number {
  if (total <= 0 || total <= size) return 0;
  return (offset + size) % total;
}

export function buildThemeLevelTitles(theme: TextbookTheme, quota: number): string[] {
  const points = theme.knowledgePoints;
  if (points.length >= quota) return points.slice(0, quota);
  if (points.length === 0) {
    return Array.from({ length: quota }, (_, i) => `${theme.label} · 第 ${i + 1} 关`);
  }
  return Array.from({ length: quota }, (_, i) => points[i] ?? `${theme.label} · 第 ${i + 1} 关`);
}

export function describeTheme(theme: TextbookTheme): string {
  if (theme.knowledgePoints.length > 0) return theme.knowledgePoints.slice(0, 3).join(' · ');
  return theme.chapterLabel;
}

export function usesKnowledgePoints(subject?: string) {
  return assessmentShowsKnowledgePoints(subject as SubjectType);
}

export function getSelectionMode(subject?: string): SelectionMode {
  return usesKnowledgePoints(subject) ? 'knowledge' : 'chapter';
}

export function buildPlanCatalog(subject: string, textbook?: string): AssessmentCatalogNode[] {
  const raw = getTextbookCatalog(subject as SubjectType, textbook);
  return toAssessmentCatalog(raw, {
    chapterOnly: isChapterOnlyTextbook(subject, textbook),
  });
}

function hashId(id: string) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** 原型学情：enough 多数有分，none/first-time 全无分，sparse 只有少数点有分。 */
export function mockHealthScore(id: string, scenario: ExpeditionSimScenario = 'enough'): number | undefined {
  if (scenario === 'none' || scenario === 'first-time') return undefined;
  const h = hashId(id);
  if (scenario === 'sparse') {
    if (h % 9 !== 0) return undefined;
    return 32 + (h % 45);
  }
  if (h % 5 === 0) return undefined;
  const band = h % 3;
  if (band === 0) return 28 + (h % 30);
  if (band === 1) return 60 + (h % 20);
  return 81 + (h % 18);
}

/** 原型：语文/英语里，约一半章节视为在个性化学习中实际训练过。 */
export function mockChapterLearned(id: string, index: number) {
  return index % 2 === 0 || hashId(id) % 5 === 0;
}

export function flattenSelectableItems(
  catalog: AssessmentCatalogNode[],
  mode: SelectionMode,
  scenario: ExpeditionSimScenario = 'enough'
): SelectableItem[] {
  const items: SelectableItem[] = [];
  catalog.forEach((chapter) => {
    const leaves = collectAssessmentLeaves(chapter);
    leaves.forEach((section) => {
      if (mode === 'knowledge' && section.knowledgePoints.length > 0) {
        section.knowledgePoints.forEach((point) => {
          const id = knowledgePointId(section.id, point);
          items.push({
            id,
            label: point,
            sectionId: section.id,
            sectionLabel: section.label,
            chapterId: chapter.id,
            chapterLabel: chapter.label,
            health: mockHealthScore(id, scenario),
          });
        });
        return;
      }
      items.push({
        id: section.id,
        label: section.label,
        sectionId: section.id,
        sectionLabel: section.label,
        chapterId: chapter.id,
        chapterLabel: chapter.label,
        health: mockHealthScore(section.id, scenario),
      });
    });
  });

  if (mode === 'chapter') {
    items.forEach((item, index) => {
      item.learned = mockChapterLearned(item.id, index);
    });
  }

  return items;
}

export function recommendItemIds(items: SelectableItem[], quota: number): string[] {
  const withHealth = items
    .filter((item) => typeof item.health === 'number')
    .sort((a, b) => (a.health ?? 0) - (b.health ?? 0));
  return withHealth.slice(0, quota).map((item) => item.id);
}

export function itemsByIds(items: SelectableItem[], ids: Iterable<string>) {
  const set = new Set(ids);
  return items.filter((item) => set.has(item.id));
}

/** 顺序1：所选内容按教材目录从上到下排，不按健康分。 */
export function buildSequence1(items: SelectableItem[], selectedIds: Iterable<string>, quota: number) {
  return itemsByIds(items, selectedIds).slice(0, quota);
}

export function summarizeRange(selected: SelectableItem[], mode: SelectionMode) {
  const chapters: string[] = [];
  selected.forEach((item) => {
    const name = item.chapterLabel.replace(/^第.+?单元\s*/, '').replace(/^Unit\s+\d+\s+/, '');
    if (!chapters.includes(name)) chapters.push(name);
  });
  const shown = chapters.slice(0, 3).join('、');
  const extra = chapters.length > 3 ? '等' : '';
  const unit = mode === 'knowledge' ? '个知识点' : '个章节';
  return {
    rangeSummary: shown ? `${shown}${extra}` : '已选范围',
    coverage: shown
      ? `${shown}${extra} · ${selected.length} ${unit}`
      : `已选 ${selected.length} ${unit}`,
  };
}

export function buildPlanTitle(textbook: string | undefined, rangeSummary: string, count: number, mode: SelectionMode) {
  const book = textbook || '当前教材';
  const unit = mode === 'knowledge' ? '个知识点' : '个章节';
  return `${book} · ${rangeSummary} ${count} ${unit}`;
}

export function getContextLabel(textbook?: string) {
  const { stage, grade, schoolSystem, term } = STUDENT_STUDY_CONTEXT;
  const book = textbook ? ` · ${textbook}` : '';
  return `${stage}${grade} · ${schoolSystem} · ${term}${book}`;
}

export function remainingItemsForContinue(
  items: SelectableItem[],
  plan: ExpeditionPlan,
  mode: SelectionMode
): { kind: ContinuePromptKind; extras: SelectableItem[] } {
  const used = new Set(plan.selectedIds ?? []);
  (plan.levelTitles ?? []).forEach((title) => {
    const hit = items.find((item) => item.label === title);
    if (hit) used.add(hit.id);
  });
  const unused = items.filter((item) => !used.has(item.id));

  if (mode === 'chapter') {
    const extras = unused.filter((item) => !item.learned);
    if (extras.length === 0) return { kind: 'all-done-lang', extras: [] };
    return { kind: 'continue-chapters', extras };
  }

  const withHealth = unused.filter((item) => typeof item.health === 'number');
  if (withHealth.length > 0) return { kind: 'review', extras: withHealth };
  if (unused.length > 0) return { kind: 'try-new', extras: unused };
  return { kind: 'all-done-math', extras: [] };
}

export function getContinuePromptCopy(kind: ContinuePromptKind) {
  if (kind === 'review') {
    return {
      title: '所选内容已经学完了',
      body: '所选的内容已经学完了，提前完成了本次学习计划，你真棒！要不要补充复习其他学过的知识点？',
      confirm: '复习其他知识点',
      cancel: '结束本次学习计划',
    };
  }
  if (kind === 'try-new') {
    return {
      title: '所选内容已经学完了',
      body: '所选的内容已经学完了，提前完成了本次学习计划，你真棒！要不要尝试练习其他知识点？',
      confirm: '继续练习其他知识点',
      cancel: '结束本次学习计划',
    };
  }
  if (kind === 'continue-chapters') {
    return {
      title: '所选内容已经学完了',
      body: '所选的内容已经学完了，提前完成了本次学习计划，你真棒！要不要继续学习其他未练章节的内容？',
      confirm: '继续学习其他章节',
      cancel: '结束本次学习计划',
    };
  }
  if (kind === 'all-done-lang') {
    return {
      title: '提前完成了本次学习计划',
      body: '所选章节不足，提前完成了本次学习计划，你真棒！',
      confirm: '',
      cancel: '太好了',
    };
  }
  return {
    title: '提前完成了本次学习计划',
    body: '所选的内容已经学完了，提前完成了本次学习计划，你真棒！',
    confirm: '',
    cancel: '太好了',
  };
}

export function canOfferContinue(plan: ExpeditionPlan) {
  const quota = getPlanQuota(plan.duration);
  const scheduled = plan.levelTitles?.length ?? quota;
  return scheduled < quota && !plan.continuePromptHandled;
}
