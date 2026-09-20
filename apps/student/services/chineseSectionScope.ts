import type { DemoChapterMeta, TextbookKnowledgeTree } from '../types/knowledgeTree';
import type { KnowledgeNode, UniverseData } from '../knowledgeGraphTypes';
import { buildScopeGraph } from './knowledgeTreeService';

export interface ChineseSectionScopeOption {
  catalogId: number;
  name: string;
  nodeCount: number;
  abilityCount: number;
}

function countChineseAbilityPoints(graph: UniverseData): number {
  return graph.nodes.filter(
    n =>
      (n.nodeType === 'KnowledgePoint' || n.nodeType === 'TestingPoint') &&
      (!!n.catalogId || !!n.catalogName)
  ).length;
}

/** 统计当前单元下各课文/小节的可展示能力点数量 */
export function listChineseSectionScopes(
  tree: TextbookKnowledgeTree,
  chapterCatalogId: number,
  sections: DemoChapterMeta['sections']
): ChineseSectionScopeOption[] {
  return sections.map(sec => {
    const graph = buildScopeGraph(
      tree,
      { textbookId: tree.textbook_id, chapterCatalogId, sectionCatalogId: sec.catalog_id },
      '语文'
    );
    return {
      catalogId: sec.catalog_id,
      name: sec.name,
      nodeCount: graph.nodes.length,
      abilityCount: countChineseAbilityPoints(graph),
    };
  });
}

export function getChineseScopedAbilityCount(graph: UniverseData): number {
  return countChineseAbilityPoints(graph);
}

/** 同单元内找有挂载点的课文，用于空态推荐 */
export function suggestChineseSectionWithContent(
  options: ChineseSectionScopeOption[],
  excludeCatalogId?: number
): ChineseSectionScopeOption | null {
  const ranked = [...options]
    .filter(o => o.catalogId !== excludeCatalogId && o.abilityCount > 0)
    .sort((a, b) => b.abilityCount - a.abilityCount);
  return ranked[0] ?? null;
}
