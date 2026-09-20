import {
  buildChineseTextbookAbilityDirectoryGraph,
  buildScopeGraph,
  computeScopeOverview,
} from './knowledgeTreeService';
import { loadChinesePreviewTree, extractChapterMeta } from './chinesePreviewTreeLoader';
import type { UniverseData } from '../knowledgeGraphTypes';
import type { ScopeOverview } from './knowledgeTreeService';
import type { DemoChapterMeta, TextbookKnowledgeTree } from '../types/knowledgeTree';

export async function getChinesePreviewChapterGraph(
  textbookId: number,
  chapterCatalogId: number
): Promise<{
  tree: TextbookKnowledgeTree;
  graph: UniverseData;
  directoryGraph: UniverseData;
  overview: ScopeOverview;
  chapters: DemoChapterMeta[];
} | null> {
  const tree = await loadChinesePreviewTree(textbookId);
  if (!tree) return null;

  const graph = buildScopeGraph(
    tree,
    { textbookId, chapterCatalogId },
    '语文'
  );
  const directoryGraph = buildChineseTextbookAbilityDirectoryGraph(tree, '语文');
  const overview = computeScopeOverview(graph, '语文');
  const chapters = extractChapterMeta(tree.catalog_tree);

  return { tree, graph, directoryGraph, overview, chapters };
}
