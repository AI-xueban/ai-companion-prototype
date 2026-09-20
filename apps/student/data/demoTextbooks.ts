import demoIndex from './knowledge_trees/demo/index.json';
import type { DemoTextbookIndex, DemoTextbookMeta } from '../types/knowledgeTree';
import type { SubjectType } from '../types';

/** 四年级上册 · 三科演示课本（深圳教材清单） */
export const DEMO_TEXTBOOK_INDEX = demoIndex as DemoTextbookIndex;

const SUBJECT_TO_KEY: Partial<Record<SubjectType, DemoTextbookMeta['subject']>> = {
  语文: 'chinese',
  数学: 'math',
  英语: 'english',
};

export const DEMO_GRADE = 4;
export const DEMO_TERM = '上册';

/** 按 App 学科名获取演示课本元数据 */
export function getDemoTextbookMeta(subject: SubjectType): DemoTextbookMeta | undefined {
  const key = SUBJECT_TO_KEY[subject];
  if (!key) return undefined;
  return DEMO_TEXTBOOK_INDEX.textbooks.find(t => t.subject === key);
}

/** 三科演示课本一览 */
export const DEMO_TEXTBOOKS_SUMMARY = DEMO_TEXTBOOK_INDEX.textbooks.map(t => ({
  subject: t.subject_label as SubjectType,
  textbookId: t.textbook_id,
  name: t.textbook_name,
  chapterCount: t.chapters.length,
  totalNodes: t.statistics.total_nodes,
  version: t.subject === 'chinese'
    ? '部编版'
    : t.subject === 'math'
      ? '北师大版'
      : '沪教牛津深圳',
}));
