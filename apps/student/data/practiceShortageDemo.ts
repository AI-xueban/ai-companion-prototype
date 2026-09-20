import type { PracticeDifficulty, SelfTestTreeNode } from './juniorSyncAssessment';
import { PRACTICE_DIFFICULTIES } from './juniorSyncAssessment';
import { appendPlaybackErrorDemoToSyncLessons } from './playbackErrorDemo';

export type PracticeShortageKind =
  | 'below_recommended'
  | 'below_selected'
  | 'no_new'
  | 'empty_bank'
  | 'daily_limit'
  | 'subject_daily_limit';

export type PracticeDailyQuotaKind = 'daily_limit' | 'subject_daily_limit';
export type PrintExceptionDemoKind = 'paper_shortage' | 'pdf_save_failed' | 'daily_limit';
/** 打印助手每日最多可组卷次数；设置页在达到上限时即时提示。 */
export const PRINT_DAILY_PAPER_LIMIT = 10;
/** 原型默认展示的当日剩余组卷次数；接入服务后替换为实时额度。 */
export const PRINT_DAILY_PAPER_REMAINING = 8;

export const SHORTAGE_DEMO_CHAPTER_ID = 'shortage-demo-chapter';
export const SHORTAGE_DEMO_CHAPTER_TITLE = '异常数据章节';

/** 教材全解「章/单元下无小节」空态演示用（列表内缺省图 +「该章节下暂无内容」） */
export const EMPTY_STATE_DEMO_CHAPTER_ID = 'empty-state-demo-chapter';
export const EMPTY_STATE_DEMO_CHAPTER_TITLE = '空态演示章节';

export const PRACTICE_SHORTAGE_DEMOS: {
  kind: PracticeShortageKind;
  title: string;
  idSuffix: string;
}[] = [
  { kind: 'below_recommended', title: '不够推荐量', idSuffix: 'shortage-below-recommended' },
  { kind: 'below_selected', title: '不够自选题量', idSuffix: 'shortage-below-selected' },
  { kind: 'no_new', title: '没有新题', idSuffix: 'shortage-no-new' },
  { kind: 'empty_bank', title: '暂时没有题目', idSuffix: 'shortage-empty-bank' },
  { kind: 'daily_limit', title: '当日总次数已达上限', idSuffix: 'shortage-daily-limit' },
  { kind: 'subject_daily_limit', title: '当日本学科次数已达上限', idSuffix: 'shortage-subject-daily-limit' },
];

/** 每本教材末尾“异常数据章节”内的打印流程演示项。 */
export const PRINT_EXCEPTION_DEMOS: {
  kind: PrintExceptionDemoKind;
  title: string;
  idSuffix: string;
}[] = [
  { kind: 'paper_shortage', title: '组卷试题不足', idSuffix: 'print-paper-shortage' },
  { kind: 'pdf_save_failed', title: 'PDF 保存失败', idSuffix: 'print-pdf-save-failed' },
  { kind: 'daily_limit', title: '今日组卷次数已达上限', idSuffix: 'print-daily-limit' },
];

export const ALL_PRACTICE_DEMOS = [...PRACTICE_SHORTAGE_DEMOS, ...PRINT_EXCEPTION_DEMOS];

const STOCK: Record<Exclude<PracticeShortageKind, PracticeDailyQuotaKind>, Record<PracticeDifficulty, number>> = {
  below_recommended: { 较易: 10, 容易: 6, 中等: 3, 较难: 4, 困难: 2 },
  below_selected: { 较易: 20, 容易: 12, 中等: 4, 较难: 3, 困难: 2 },
  no_new: { 较易: 7, 容易: 5, 中等: 0, 较难: 5, 困难: 4 },
  empty_bank: { 较易: 0, 容易: 0, 中等: 0, 较难: 0, 困难: 0 },
};

export function matchShortageDemo(idOrTitle?: string | null): PracticeShortageKind | null {
  if (!idOrTitle) return null;
  // subject 后缀含 shortage-daily-limit，必须先匹配学科额度
  if (
    idOrTitle.includes('shortage-subject-daily-limit')
    || idOrTitle.includes('当日本学科次数已达上限')
    || idOrTitle.includes('本学科次数已满')
  ) return 'subject_daily_limit';
  if (
    idOrTitle.includes('shortage-daily-limit')
    || idOrTitle.includes('当日总次数已达上限')
    || idOrTitle.includes('当日组卷次数已达上限')
    || idOrTitle.includes('当日次数已满')
  ) return 'daily_limit';
  if (idOrTitle.includes('shortage-empty-bank') || idOrTitle.includes('暂时没有题目')) return 'empty_bank';
  if (idOrTitle.includes('shortage-no-new') || idOrTitle.includes('没有新题')) return 'no_new';
  if (idOrTitle.includes('shortage-below-selected') || idOrTitle.includes('不够自选题量')) return 'below_selected';
  if (idOrTitle.includes('shortage-below-recommended') || idOrTitle.includes('不够推荐量')) return 'below_recommended';
  return null;
}

export function matchPrintExceptionDemo(idOrTitle?: string | null): PrintExceptionDemoKind | null {
  if (!idOrTitle) return null;
  if (idOrTitle.includes('print-daily-limit') || idOrTitle.includes('今日组卷次数已达上限')) return 'daily_limit';
  if (idOrTitle.includes('print-pdf-save-failed') || idOrTitle.includes('PDF 保存失败')) return 'pdf_save_failed';
  if (idOrTitle.includes('print-paper-shortage') || idOrTitle.includes('组卷试题不足')) return 'paper_shortage';
  return null;
}

export function printExceptionDemoFromSelectedLeaves(
  tree: SelfTestTreeNode[],
  selected: Iterable<string>,
): PrintExceptionDemoKind | null {
  const ids = selected instanceof Set ? selected : new Set(selected);
  let result: PrintExceptionDemoKind | null = null;
  const walk = (node: SelfTestTreeNode) => {
    if (!node.children?.length && ids.has(node.id)) {
      result ||= matchPrintExceptionDemo(node.id) ?? matchPrintExceptionDemo(node.title);
    }
    node.children?.forEach(walk);
  };
  tree.forEach(walk);
  return result;
}

export function isShortageDemoChapter(idOrTitle?: string | null) {
  return Boolean(
    idOrTitle
    && (idOrTitle.includes(SHORTAGE_DEMO_CHAPTER_ID) || idOrTitle.includes(SHORTAGE_DEMO_CHAPTER_TITLE)),
  );
}

export function isEmptyStateDemoChapter(idOrTitle?: string | null) {
  return Boolean(
    idOrTitle
    && (idOrTitle.includes(EMPTY_STATE_DEMO_CHAPTER_ID) || idOrTitle.includes(EMPTY_STATE_DEMO_CHAPTER_TITLE)),
  );
}

export function isShortageDemoText(idOrTitle?: string | null) {
  return matchShortageDemo(idOrTitle) != null;
}

export function isDailyQuotaShortageKind(
  kind: PracticeShortageKind | null | undefined,
): kind is PracticeDailyQuotaKind {
  return kind === 'daily_limit' || kind === 'subject_daily_limit';
}

export function isHardBlockShortageKind(kind: PracticeShortageKind | null | undefined) {
  return kind === 'empty_bank' || isDailyQuotaShortageKind(kind);
}

export function pickShortageKind(kinds: Array<PracticeShortageKind | null | undefined>): PracticeShortageKind | null {
  if (kinds.includes('daily_limit')) return 'daily_limit';
  if (kinds.includes('subject_daily_limit')) return 'subject_daily_limit';
  if (kinds.includes('empty_bank')) return 'empty_bank';
  if (kinds.includes('no_new')) return 'no_new';
  if (kinds.includes('below_selected')) return 'below_selected';
  if (kinds.includes('below_recommended')) return 'below_recommended';
  return null;
}

export function getDemoStock(kind: PracticeShortageKind, difficulty: PracticeDifficulty) {
  if (isDailyQuotaShortageKind(kind)) return 0;
  return STOCK[kind][difficulty];
}

export function difficultyLevelOf(label: PracticeDifficulty): 1 | 2 | 3 | 4 | 5 {
  return PRACTICE_DIFFICULTIES.find((item) => item.label === label)?.level ?? 3;
}

export function shiftDifficulty(current: PracticeDifficulty, direction: -1 | 1): PracticeDifficulty | null {
  const order: PracticeDifficulty[] = ['较易', '容易', '中等', '较难', '困难'];
  const index = order.indexOf(current);
  return order[index + direction] ?? null;
}

export function shortageKindFromSelectedLeaves(
  tree: SelfTestTreeNode[],
  selected: Iterable<string>,
): PracticeShortageKind | null {
  const ids = selected instanceof Set ? selected : new Set(selected);
  const kinds: PracticeShortageKind[] = [];
  const walk = (node: SelfTestTreeNode) => {
    if (!node.children?.length && ids.has(node.id)) {
      const kind = matchShortageDemo(node.id) ?? matchShortageDemo(node.title);
      if (kind) kinds.push(kind);
    }
    node.children?.forEach(walk);
  };
  tree.forEach(walk);
  return pickShortageKind(kinds);
}

function demoNodes(parentId: string): SelfTestTreeNode[] {
  return ALL_PRACTICE_DEMOS.map((item) => ({
    id: `${parentId}::${item.idSuffix}`,
    title: item.title,
    level: 'section' as const,
    kind: 'catalog' as const,
    available: true,
  }));
}

function ensureShortageDemoChildren(children: SelfTestTreeNode[] | undefined, parentId: string): SelfTestTreeNode[] {
  const existing = (children ?? []).map((node) => {
    const kind = matchShortageDemo(node.id) ?? matchShortageDemo(node.title);
    const canonical = kind ? PRACTICE_SHORTAGE_DEMOS.find((item) => item.kind === kind) : null;
    if (!canonical || node.title === canonical.title) return node;
    return { ...node, title: canonical.title };
  });
  const missing = ALL_PRACTICE_DEMOS.filter(
    (item) => !existing.some((node) => node.id.includes(item.idSuffix) || node.title === item.title),
  );
  if (!missing.length && existing.every((node, index) => node === (children ?? [])[index])) {
    return children ?? [];
  }
  return [
    ...existing,
    ...missing.map((item) => ({
      id: `${parentId}::${item.idSuffix}`,
      title: item.title,
      level: 'section' as const,
      kind: 'catalog' as const,
      available: true,
    })),
  ];
}

export function appendShortageDemosToLastChapter(tree: SelfTestTreeNode[]): SelfTestTreeNode[] {
  if (!tree.length) return tree;
  const existingIndex = tree.findIndex(
    (node) => isShortageDemoChapter(node.id) || isShortageDemoChapter(node.title),
  );
  if (existingIndex >= 0) {
    const chapter = tree[existingIndex];
    const nextChildren = ensureShortageDemoChildren(chapter.children, chapter.id || SHORTAGE_DEMO_CHAPTER_ID);
    if (nextChildren === chapter.children) return tree;
    return tree.map((node, index) => (
      index === existingIndex ? { ...node, children: nextChildren } : node
    ));
  }
  return [
    ...tree,
    {
      id: SHORTAGE_DEMO_CHAPTER_ID,
      title: SHORTAGE_DEMO_CHAPTER_TITLE,
      level: 'chapter',
      kind: 'catalog',
      children: demoNodes(SHORTAGE_DEMO_CHAPTER_ID),
    },
  ];
}

export function appendShortageDemosToLastSyncLessons<T extends { unit: string; section: string }>(
  lessons: T[],
): T[] {
  if (!lessons.length) return lessons;
  const hasChapter = lessons.some((lesson) => isShortageDemoChapter(lesson.unit));
  let renamed = false;
  const nextLessons = lessons.map((lesson) => {
    if (!isShortageDemoChapter(lesson.unit) && !isShortageDemoText(lesson.section)) return lesson;
    const kind = matchShortageDemo(lesson.section) ?? matchShortageDemo(lesson.unit);
    const canonical = kind ? PRACTICE_SHORTAGE_DEMOS.find((item) => item.kind === kind) : null;
    if (!canonical || lesson.section === canonical.title) return lesson;
    renamed = true;
    return { ...lesson, section: canonical.title };
  });
  const missing = ALL_PRACTICE_DEMOS.filter((item) => !nextLessons.some((lesson) => lesson.section === item.title || lesson.section.includes(item.idSuffix)));
  if (hasChapter && !missing.length) return renamed ? nextLessons : lessons;
  const template = nextLessons[nextLessons.length - 1];
  const extras = (hasChapter ? missing : ALL_PRACTICE_DEMOS).map((item) => ({
    ...template,
    unit: SHORTAGE_DEMO_CHAPTER_TITLE,
    section: item.title,
    ...('task' in template ? { task: '' } : {}),
    ...('videos' in template ? { videos: [] } : {}),
    ...('topicGroups' in template ? { topicGroups: [] } : {}),
    ...('sections' in template ? { sections: undefined } : {}),
  })) as T[];
  return [...nextLessons, ...extras];
}

/** 语数英：追加一章空 section，命中教材全解列表空态 */
export function appendEmptyStateDemoToSyncLessons<T extends { unit: string; section: string }>(
  lessons: T[],
): T[] {
  if (!lessons.length) return lessons;
  if (lessons.some((lesson) => isEmptyStateDemoChapter(lesson.unit))) return lessons;
  const template = lessons[lessons.length - 1];
  return [
    ...lessons,
    {
      ...template,
      unit: EMPTY_STATE_DEMO_CHAPTER_TITLE,
      section: '',
      ...('task' in template ? { task: '' } : {}),
      ...('videos' in template ? { videos: [] } : {}),
      ...('topicGroups' in template ? { topicGroups: [] } : {}),
      ...('sections' in template ? { sections: undefined } : {}),
    } as T,
  ];
}

export function appendDemoChaptersToSyncLessons<T extends { unit: string; section: string }>(
  lessons: T[],
): T[] {
  return appendShortageDemosToLastSyncLessons(
    appendEmptyStateDemoToSyncLessons(
      appendPlaybackErrorDemoToSyncLessons(lessons),
    ),
  );
}
