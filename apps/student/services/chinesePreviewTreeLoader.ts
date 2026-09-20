import type { DemoChapterMeta, RawCatalogNode, TextbookKnowledgeTree } from '../types/knowledgeTree';
import chineseIndex from '../知识图谱/knowledge_trees/knowledge_trees/index.json';

/** Vite 批量注册语文 18 册 JSON */
const treeModules = import.meta.glob('../知识图谱/knowledge_trees/knowledge_trees/语文/*.json');

export interface ChinesePreviewTextbookMeta {
  textbook_id: number;
  textbook_name: string;
  grade: number;
  term: string;
  file: string;
  stage: 'primary' | 'middle';
}

const indexSubjects = chineseIndex as {
  subjects: {
    语文: {
      textbooks: Array<{
        textbook_id: number;
        grade: number;
        term: string;
        name: string;
        file: string;
      }>;
    };
  };
};

export const CHINESE_PREVIEW_TEXTBOOKS: ChinesePreviewTextbookMeta[] =
  indexSubjects.subjects.语文.textbooks.map(t => ({
    textbook_id: t.textbook_id,
    textbook_name: t.name,
    grade: t.grade,
    term: t.term,
    file: t.file,
    stage: t.grade <= 6 ? 'primary' : 'middle',
  }));

const treeCache = new Map<number, TextbookKnowledgeTree>();

function fileKeyForTextbook(file: string): string | undefined {
  return Object.keys(treeModules).find(k => k.endsWith(`/${file}`));
}

export async function loadChinesePreviewTree(textbookId: number): Promise<TextbookKnowledgeTree | null> {
  if (treeCache.has(textbookId)) return treeCache.get(textbookId)!;

  const meta = CHINESE_PREVIEW_TEXTBOOKS.find(t => t.textbook_id === textbookId);
  if (!meta) return null;

  const key = fileKeyForTextbook(meta.file);
  if (!key || !treeModules[key]) return null;

  const mod = await treeModules[key]();
  const tree = (mod as { default: TextbookKnowledgeTree }).default;
  treeCache.set(textbookId, tree);
  return tree;
}

export function extractChapterMeta(catalogTree: RawCatalogNode[]): DemoChapterMeta[] {
  return catalogTree
    .filter(node => node.parent_id === 0)
    .map(ch => ({
      catalog_id: ch.catalog_id,
      name: ch.name,
      ordinal: ch.ordinal,
      section_count: ch.children?.length ?? 0,
      sections: (ch.children ?? []).map(sec => ({
        catalog_id: sec.catalog_id,
        name: sec.name,
        ordinal: sec.ordinal,
      })),
    }));
}

export function getChineseTextbooksByStage(stage: 'primary' | 'middle'): ChinesePreviewTextbookMeta[] {
  return CHINESE_PREVIEW_TEXTBOOKS.filter(t => t.stage === stage);
}
