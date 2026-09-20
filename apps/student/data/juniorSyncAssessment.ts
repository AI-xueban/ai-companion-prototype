import type { UiSchoolSystem } from './juniorDemoCatalog';
import { buildJyeooSelfTestTree } from './jyeooSelfTest';

export type SelfTestNodeLevel = 'chapter' | 'section' | 'knowledge' | 'subKnowledge';
export type SelfTestNodeKind = 'catalog' | 'knowledge';

export interface SelfTestTreeNode {
  id: string;
  title: string;
  level: SelfTestNodeLevel;
  kind?: SelfTestNodeKind;
  children?: SelfTestTreeNode[];
  questionCount?: number;
  available?: boolean;
}

/** 语文 / 英语教材目录下没有知识点，选题停在课文或课时。 */
export function selfTestHasKnowledgePoints(subject: string) {
  return subject !== '语文' && subject !== '英语';
}

export function selfTestLeafNoun(subject: string) {
  if (subject === '语文') return '篇课文';
  if (subject === '英语') return '个课时';
  return '个知识点';
}

export function selfTestEmptyHint(subject: string) {
  if (subject === '语文') return '请选择你要练习的课文';
  if (subject === '英语') return '请选择你要练习的课时';
  return '请选择你要练习的章节或知识点';
}

export interface UnitTestInfo {
  scopeTitle: string;
  sectionLabel: string;
  questionCount: number;
  durationMinutes: number;
}

const JUNIOR_GRADES = ['六年级', '七年级', '八年级', '九年级'];

export function isSyncAssessmentPilot(
  _subject: string,
  grade: string,
  _term: string,
): boolean {
  return JUNIOR_GRADES.includes(grade);
}

export function buildSelfTestTree(
  subject: string,
  grade: string,
  term: string,
  version: string,
  uiSystem: UiSchoolSystem,
): SelfTestTreeNode[] {
  return buildJyeooSelfTestTree(subject, grade, term, version, uiSystem);
}

export function buildFallbackSelfTestTree(
  units: { id: string; title: string; children: { id: string; title: string }[] }[],
): SelfTestTreeNode[] {
  return units.map((unit) => ({
    id: unit.id,
    title: unit.title,
    level: 'chapter' as const,
    kind: 'catalog' as const,
    children: unit.children.map((child) => ({
      id: child.id,
      title: child.title,
      level: 'section' as const,
      kind: 'catalog' as const,
      available: true,
    })),
  }));
}

export function collectLeafIds(nodes: SelfTestTreeNode[]): string[] {
  const ids: string[] = [];
  const walk = (list: SelfTestTreeNode[]) => {
    list.forEach((node) => {
      if (!node.children?.length) ids.push(node.id);
      else walk(node.children);
    });
  };
  walk(nodes);
  return ids;
}

function normalizeCatalogTitle(title: string) {
  return title
    .replace(/[（(][^）)]*[）)]/g, '')
    .replace(/[　\s·・．.、:：_\-—]/g, '')
    .replace(/第[0-9一二三四五六七八九十百零]+[章节单元课]/g, '')
    .replace(/^unit\d+/i, '')
    .replace(/^[0-9]+(\.[0-9]+)*/g, '')
    .toLowerCase();
}

function catalogTitleScore(nodeTitle: string, hint: string) {
  const a = normalizeCatalogTitle(nodeTitle);
  const b = normalizeCatalogTitle(hint);
  if (!a || !b) return 0;
  if (a === b) return 100;
  if (a.includes(b) || b.includes(a)) {
    return Math.round((80 * Math.min(a.length, b.length)) / Math.max(a.length, b.length));
  }
  return 0;
}

function isCatalogNode(node: SelfTestTreeNode) {
  return node.kind !== 'knowledge' && node.level !== 'knowledge' && node.level !== 'subKnowledge';
}

function bestTitleMatch(nodes: SelfTestTreeNode[], hint: string, deep: boolean) {
  let best: { node: SelfTestTreeNode; score: number } | null = null;
  const visit = (list: SelfTestTreeNode[]) => {
    list.forEach((node) => {
      if (isCatalogNode(node)) {
        const score = catalogTitleScore(node.title, hint);
        if (score > (best?.score ?? 0)) best = { node, score };
      }
      if (deep) node.children?.forEach((child) => visit([child]));
    });
  };
  visit(nodes);
  return best && best.score >= 70 ? best.node : null;
}

function collectExpandIds(node: SelfTestTreeNode): string[] {
  const ids = [node.id];
  if (node.children?.length && node.children.every((child) => child.kind === 'knowledge')) {
    return ids;
  }
  node.children?.forEach((child) => {
    if (child.children?.length) ids.push(...collectExpandIds(child));
  });
  return ids;
}

/** 按教材全解当前章 / 小节，在菁优树上定位并给出应勾选的叶子。 */
export function locateSelfTestTarget(
  tree: SelfTestTreeNode[],
  chapterHint?: string,
  sectionHint?: string,
) {
  const empty = { chapterId: '', sectionId: '', leafIds: [] as string[], expandIds: [] as string[] };
  if (!tree.length) return empty;

  const chapter = chapterHint ? bestTitleMatch(tree, chapterHint, false) : null;
  const sectionPool = chapter?.children?.length ? chapter.children : tree;
  const section = sectionHint ? bestTitleMatch(sectionPool, sectionHint, true) : null;
  const target = section ?? chapter;
  if (!target) return empty;

  const chapterNode = chapter ?? tree.find((item) => {
    const contains = (node: SelfTestTreeNode): boolean =>
      node.id === target.id || Boolean(node.children?.some(contains));
    return contains(item);
  }) ?? null;

  return {
    chapterId: chapterNode?.id ?? '',
    sectionId: section?.id ?? '',
    leafIds: collectLeafIds([target]),
    expandIds: collectExpandIds(chapterNode ?? target),
  };
}

export const PRACTICE_QUESTION_MAX = 20;
export const PRACTICE_QUESTION_MIN = 5;
/** 单元测试独立限量，避免单次测试题量过长。 */
export const UNIT_TEST_QUESTION_MAX = 20;

export type PracticeDifficulty = '较易' | '容易' | '中等' | '较难' | '困难';

export const PRACTICE_DIFFICULTIES: { label: PracticeDifficulty; level: 1 | 2 | 3 | 4 | 5 }[] = [
  { label: '较易', level: 1 },
  { label: '容易', level: 2 },
  { label: '中等', level: 3 },
  { label: '较难', level: 4 },
  { label: '困难', level: 5 },
];

export const PRACTICE_QUESTION_PRESETS = [5, 10, 15, 20] as const;

export type PracticeScenarioCode = 'sync' | 'sc' | 'gc' | 'rc' | 'yc' | 'ec';

export interface PracticeScenario {
  code: PracticeScenarioCode;
  label: string;
}

export const PRACTICE_SCENARIOS: PracticeScenario[] = [
  { code: 'sync', label: '同步练习' },
  { code: 'sc', label: '真题' },
  { code: 'gc', label: '好题' },
  { code: 'rc', label: '常考题' },
  { code: 'yc', label: '压轴题' },
  { code: 'ec', label: '易错题' },
];

export const DEFAULT_PRACTICE_SCENARIO: PracticeScenarioCode = 'sync';

/** 统计已选叶子覆盖了多少个顶层章节（章 / 单元）。 */
export function countSelectedChapters(nodes: SelfTestTreeNode[], selectedLeaves: Set<string>) {
  return nodes.filter((chapter) => {
    const leaves = chapter.children?.length ? collectLeafIds([chapter]) : [chapter.id];
    return leaves.some((id) => selectedLeaves.has(id));
  }).length;
}

/**
 * 自主练习题量推荐（占位）。
 * 之后会按选中知识点 / 章节覆盖细写；本期：每叶子约 2 题，跨章略加量，夹在 5–20。
 */
export function recommendPracticeQuestionCount(
  selectedLeafCount: number,
  selectedChapterCount = 1,
) {
  if (selectedLeafCount <= 0) return 0;
  const chapterBonus = Math.max(0, selectedChapterCount - 1) * 2;
  const raw = selectedLeafCount * 2 + chapterBonus;
  return Math.min(PRACTICE_QUESTION_MAX, Math.max(PRACTICE_QUESTION_MIN, raw));
}

export function estimateQuestionCount(selectedLeafCount: number) {
  return recommendPracticeQuestionCount(selectedLeafCount);
}

export function getMathUnitTestInfo(
  syncLessons: { unit: string; section: string }[],
  chapterTitle: string,
): UnitTestInfo | null {
  const sections = syncLessons.filter((lesson) => lesson.unit === chapterTitle);
  if (!sections.length) return null;
  const questionCount = Math.min(Math.max(sections.length * 3, 8), UNIT_TEST_QUESTION_MAX);
  return {
    scopeTitle: chapterTitle,
    sectionLabel: `${sections.length} 个小节`,
    questionCount,
    durationMinutes: Math.max(10, Math.ceil(questionCount * 1.5)),
  };
}

export function getEnglishUnitTestInfo(unitTitle: string): UnitTestInfo {
  return {
    scopeTitle: unitTitle,
    sectionLabel: '整单元',
    questionCount: 12,
    durationMinutes: 20,
  };
}

export function getGenericUnitTestInfo(scopeTitle: string, childCount = 0): UnitTestInfo {
  const questionCount = childCount
    ? Math.min(Math.max(childCount * 3, 8), UNIT_TEST_QUESTION_MAX)
    : 15;
  return {
    scopeTitle,
    sectionLabel: childCount ? `${childCount} 个小节` : '本章',
    questionCount,
    durationMinutes: Math.max(10, Math.ceil(questionCount * 1.5)),
  };
}

export function getChineseUnitTestInfo(unitTitle: string): UnitTestInfo {
  return {
    scopeTitle: unitTitle,
    sectionLabel: '本单元',
    questionCount: 10,
    durationMinutes: 20,
  };
}
