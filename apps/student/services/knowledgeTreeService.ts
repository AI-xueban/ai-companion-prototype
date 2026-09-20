import type {
  ChapterScope,
  DemoChapterMeta,
  RawCatalogNode,
  RawKnowledgeTreeNode,
  TextbookKnowledgeTree,
} from '../types/knowledgeTree';
import type { KnowledgeLink, KnowledgeNode, UniverseData } from '../knowledgeGraphTypes';
import { KG_CHINESE_TREE_ONLY_ENABLED, KG_COLLAPSE_NODE_THRESHOLD, KG_ENGLISH_VOCAB_LIST_THRESHOLD, KG_MAX_THEME_ANCESTOR_DEPTH } from '../config/knowledgeGraphFeatures';
import type { SubjectType } from '../types';
import { getDemoTextbookMeta } from '../data/demoTextbooks';

const MIN_NODES_MATH = 6;
const MIN_NODES_ENGLISH = 8;

const MASTERY_OVERRIDE_KEY = 'kg-mastery-overrides';
export const KG_PRACTICE_PENDING_KEY = 'kg-practice-pending';
export const kgReturnNodeKey = (textbookId: number) => `kg-return-node-${textbookId}`;

const TREE_LOADERS: Record<number, () => Promise<TextbookKnowledgeTree>> = {
  4686: () => import('../data/knowledge_trees/demo/1_4_上册_4686.json').then(m => m.default as TextbookKnowledgeTree),
  2964: () => import('../data/knowledge_trees/demo/2_4_上册_2964.json').then(m => m.default as TextbookKnowledgeTree),
  5275: () => import('../data/knowledge_trees/demo/3_4_上册_5275.json').then(m => m.default as TextbookKnowledgeTree),
};

const treeCache = new Map<number, TextbookKnowledgeTree>();

export async function loadTextbookTree(textbookId: number): Promise<TextbookKnowledgeTree> {
  if (treeCache.has(textbookId)) return treeCache.get(textbookId)!;
  const loader = TREE_LOADERS[textbookId];
  if (!loader) throw new Error(`未找到课本数据: ${textbookId}`);
  const tree = await loader();
  treeCache.set(textbookId, tree);
  return tree;
}

export async function loadTextbookTreeBySubject(subject: SubjectType): Promise<TextbookKnowledgeTree | null> {
  const meta = getDemoTextbookMeta(subject);
  if (!meta) return null;
  return loadTextbookTree(meta.textbook_id);
}

/** 收集章/节下所有 catalog_id */
export function collectCatalogIds(
  catalogTree: RawCatalogNode[],
  chapterCatalogId: number,
  sectionCatalogId?: number
): Set<number> {
  const ids = new Set<number>();

  const walk = (node: RawCatalogNode) => {
    ids.add(node.catalog_id);
    node.children?.forEach(walk);
  };

  const chapter = catalogTree.find(c => c.catalog_id === chapterCatalogId);
  if (!chapter) return ids;

  if (sectionCatalogId) {
    const section = findCatalogNode(chapter, sectionCatalogId);
    if (section) walk(section);
    else ids.add(sectionCatalogId);
  } else {
    walk(chapter);
  }

  return ids;
}

function findCatalogNode(root: RawCatalogNode, catalogId: number): RawCatalogNode | null {
  if (root.catalog_id === catalogId) return root;
  for (const child of root.children ?? []) {
    const found = findCatalogNode(child, catalogId);
    if (found) return found;
  }
  return null;
}

/** 扁平化 knowledge_tree */
export function flattenKnowledgeTree(roots: RawKnowledgeTreeNode[]): Map<number, RawKnowledgeTreeNode> {
  const map = new Map<number, RawKnowledgeTreeNode>();
  const visit = (node: RawKnowledgeTreeNode) => {
    map.set(node.node_id, node);
    node.children?.forEach(visit);
  };
  roots.forEach(visit);
  return map;
}

/** 从 catalog_tree 收集 scope 内挂载的知识点 */
function collectCatalogKnowledgePoints(
  catalogTree: RawCatalogNode[],
  catalogIds: Set<number>
): RawKnowledgeTreeNode[] {
  const points: RawKnowledgeTreeNode[] = [];

  const visit = (node: RawCatalogNode) => {
    if (catalogIds.has(node.catalog_id)) {
      points.push(...(node.knowledge_points ?? []));
    }
    node.children?.forEach(visit);
  };

  catalogTree.forEach(visit);
  return points;
}

const STATUS_POOL = ['mastered', 'reviewing', 'weak', 'exploring', 'unknown'] as const;

function hashString(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = input.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
}

function mockStatus(nodeId: number): KnowledgeNode['status'] {
  return STATUS_POOL[Math.abs(hashString(String(nodeId))) % STATUS_POOL.length];
}

function readMasteryOverrides(): Record<string, KnowledgeNode['status']> {
  try {
    const raw = localStorage.getItem(MASTERY_OVERRIDE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeMasteryOverrides(overrides: Record<string, KnowledgeNode['status']>) {
  localStorage.setItem(MASTERY_OVERRIDE_KEY, JSON.stringify(overrides));
}

function getNodeStatus(nodeId: number, overrides: Record<string, KnowledgeNode['status']>): KnowledgeNode['status'] {
  return overrides[String(nodeId)] ?? mockStatus(nodeId);
}

function nextStatusAfterPractice(current: KnowledgeNode['status']): KnowledgeNode['status'] {
  switch (current) {
    case 'weak':
    case 'not_mastered':
      return 'mastered';
    case 'reviewing':
      return 'mastered';
    case 'exploring':
      return 'reviewing';
    case 'unknown':
      return 'exploring';
    default:
      return 'mastered';
  }
}

/** 练题完成后更新节点掌握态（原型 mock，持久化到 localStorage） */
export function recordNodePracticeComplete(
  nodeId: string,
  previousStatus?: KnowledgeNode['status']
): KnowledgeNode['status'] {
  const overrides = readMasteryOverrides();
  const current = overrides[nodeId] ?? previousStatus ?? 'weak';
  const next = nextStatusAfterPractice(current);
  overrides[nodeId] = next;
  writeMasteryOverrides(overrides);
  return next;
}

function countScopeNodes(
  tree: TextbookKnowledgeTree,
  subject: SubjectType,
  chapterCatalogId: number,
  sectionCatalogId?: number
): number {
  return buildScopeGraph(
    tree,
    { textbookId: tree.textbook_id, chapterCatalogId, sectionCatalogId },
    subject,
    readMasteryOverrides()
  ).nodes.length;
}

export interface ResolvedScope {
  chapterCatalogId: number;
  sectionCatalogId?: number;
}

/** 英语课本 scope 仅展示 Unit 课时，排除 Revision / Project / 综合测试等 */
export function isEnglishUnitSection(name: string): boolean {
  return /^Unit\s+\d+/i.test(name.trim());
}

export interface EnglishUnitScope {
  chapterCatalogId: number;
  sectionCatalogId: number;
  name: string;
}

export function listEnglishUnits(chapters: DemoChapterMeta[]): EnglishUnitScope[] {
  const units: EnglishUnitScope[] = [];
  for (const ch of chapters) {
    for (const sec of ch.sections) {
      if (isEnglishUnitSection(sec.name)) {
        units.push({
          chapterCatalogId: ch.catalog_id,
          sectionCatalogId: sec.catalog_id,
          name: sec.name,
        });
      }
    }
  }
  return units;
}

function listEnglishUnitsFromTree(tree: TextbookKnowledgeTree): Array<{
  chapterCatalogId: number;
  sectionCatalogId: number;
}> {
  const units: Array<{ chapterCatalogId: number; sectionCatalogId: number }> = [];
  for (const ch of tree.catalog_tree) {
    for (const sec of ch.children ?? []) {
      if (isEnglishUnitSection(sec.name)) {
        units.push({ chapterCatalogId: ch.catalog_id, sectionCatalogId: sec.catalog_id });
      }
    }
  }
  return units;
}

function resolveEnglishDefaultScope(
  tree: TextbookKnowledgeTree,
  saved?: { chapterId: number; sectionId?: number }
): ResolvedScope {
  const units = listEnglishUnitsFromTree(tree);
  const firstChapter = getDefaultChapter(tree);
  if (units.length === 0) return { chapterCatalogId: firstChapter };

  if (saved?.sectionId) {
    const savedUnit = units.find(
      u => u.chapterCatalogId === saved.chapterId && u.sectionCatalogId === saved.sectionId
    );
    if (savedUnit) {
      const n = countScopeNodes(tree, '英语', savedUnit.chapterCatalogId, savedUnit.sectionCatalogId);
      if (n > 0) {
        return {
          chapterCatalogId: savedUnit.chapterCatalogId,
          sectionCatalogId: savedUnit.sectionCatalogId,
        };
      }
    }
  }

  for (const u of units) {
    const n = countScopeNodes(tree, '英语', u.chapterCatalogId, u.sectionCatalogId);
    if (n >= MIN_NODES_ENGLISH) {
      return { chapterCatalogId: u.chapterCatalogId, sectionCatalogId: u.sectionCatalogId };
    }
  }

  for (const u of units) {
    const n = countScopeNodes(tree, '英语', u.chapterCatalogId, u.sectionCatalogId);
    if (n > 0) {
      return { chapterCatalogId: u.chapterCatalogId, sectionCatalogId: u.sectionCatalogId };
    }
  }

  return { chapterCatalogId: units[0].chapterCatalogId, sectionCatalogId: units[0].sectionCatalogId };
}

/**
 * 分学科默认 scope：语文=章；数学/英语=小节（节点数达标）
 * 数学仅课时级，不上卷到整章
 */
export function resolveDefaultScope(
  subject: SubjectType,
  tree: TextbookKnowledgeTree,
  saved?: { chapterId: number; sectionId?: number }
): ResolvedScope {
  const firstChapter = getDefaultChapter(tree);

  if (subject === '语文') {
    const chapterId = saved?.chapterId ?? firstChapter;
    if (saved?.sectionId) {
      return { chapterCatalogId: chapterId, sectionCatalogId: saved.sectionId };
    }
    return { chapterCatalogId: chapterId };
  }

  if (subject === '英语') {
    return resolveEnglishDefaultScope(tree, saved);
  }

  const minNodes = MIN_NODES_MATH;

  const trySectionScope = (chapterId: number, sectionId: number): ResolvedScope | null => {
    const n = countScopeNodes(tree, subject, chapterId, sectionId);
    if (n === 0) return null;
    return { chapterCatalogId: chapterId, sectionCatalogId: sectionId };
  };

  const firstSectionInChapter = (chapterId: number): ResolvedScope | null => {
    const ch = tree.catalog_tree.find(c => c.catalog_id === chapterId);
    for (const sec of ch?.children ?? []) {
      const resolved = trySectionScope(chapterId, sec.catalog_id);
      if (resolved) return resolved;
    }
    return null;
  };

  if (saved?.chapterId) {
    if (saved.sectionId) {
      const resolved = trySectionScope(saved.chapterId, saved.sectionId);
      if (resolved) return resolved;
    }
    const fromChapter = firstSectionInChapter(saved.chapterId);
    if (fromChapter) return fromChapter;
  }

  for (const ch of tree.catalog_tree) {
    for (const sec of ch.children ?? []) {
      const n = countScopeNodes(tree, subject, ch.catalog_id, sec.catalog_id);
      if (n >= minNodes) {
        return { chapterCatalogId: ch.catalog_id, sectionCatalogId: sec.catalog_id };
      }
    }
  }

  for (const ch of tree.catalog_tree) {
    for (const sec of ch.children ?? []) {
      const resolved = trySectionScope(ch.catalog_id, sec.catalog_id);
      if (resolved) return resolved;
    }
  }

  const firstCh = tree.catalog_tree.find(c => c.catalog_id === firstChapter) ?? tree.catalog_tree[0];
  const firstSec = firstCh?.children?.[0];
  return {
    chapterCatalogId: firstCh?.catalog_id ?? firstChapter,
    sectionCatalogId: firstSec?.catalog_id,
  };
}

/** 下一节/下一章（weak=0 引导用） */
export function getNextScope(
  chapters: DemoChapterMeta[],
  chapterId: number,
  sectionId: number | undefined,
  subject: SubjectType
): ResolvedScope | null {
  const chIdx = chapters.findIndex(c => c.catalog_id === chapterId);
  if (chIdx === -1) return null;

  if (subject === '语文') {
    const ch = chapters[chIdx];
    if (sectionId) {
      const secIdx = ch.sections.findIndex(s => s.catalog_id === sectionId);
      if (secIdx !== -1 && secIdx < ch.sections.length - 1) {
        return { chapterCatalogId: chapterId, sectionCatalogId: ch.sections[secIdx + 1].catalog_id };
      }
    }
    const nextCh = chapters[chIdx + 1];
    return nextCh ? { chapterCatalogId: nextCh.catalog_id } : null;
  }

  if (subject === '英语') {
    if (!sectionId) return null;
    const units = listEnglishUnits(chapters);
    const idx = units.findIndex(
      u => u.chapterCatalogId === chapterId && u.sectionCatalogId === sectionId
    );
    const next = units[idx + 1];
    return next
      ? { chapterCatalogId: next.chapterCatalogId, sectionCatalogId: next.sectionCatalogId }
      : null;
  }

  const ch = chapters[chIdx];
  if (sectionId) {
    const secIdx = ch.sections.findIndex(s => s.catalog_id === sectionId);
    if (secIdx !== -1 && secIdx < ch.sections.length - 1) {
      return { chapterCatalogId: chapterId, sectionCatalogId: ch.sections[secIdx + 1].catalog_id };
    }
  }

  const nextCh = chapters[chIdx + 1];
  if (!nextCh) return null;
  return {
    chapterCatalogId: nextCh.catalog_id,
    sectionCatalogId: nextCh.sections[0]?.catalog_id,
  };
}

function toDisplayRole(nodeType: RawKnowledgeTreeNode['type']): KnowledgeNode['displayRole'] {
  if (nodeType === 'KnowledgeNode') return 'theme';
  if (nodeType === 'TestingPoint') return 'testing';
  return 'knowledge';
}

function rawToGraphNode(
  node: RawKnowledgeTreeNode,
  subject: SubjectType,
  depth: number,
  overrides: Record<string, KnowledgeNode['status']>
): KnowledgeNode {
  const status = getNodeStatus(node.node_id, overrides);
  const nodeType = node.type;
  const displayRole = toDisplayRole(nodeType);
  const childCount = node.children?.length ?? 0;
  return {
    id: String(node.node_id),
    label: node.name,
    subject,
    group: depth,
    val: Math.max(8, 28 - depth * 3),
    status,
    nodeType,
    displayRole,
    depth,
    parentId: node.parent_id !== 0 ? String(node.parent_id) : undefined,
    catalogId: node.catalog_id || undefined,
    catalogName: node.catalog_name || undefined,
    isPracticable: nodeType === 'KnowledgePoint' || nodeType === 'TestingPoint',
    isDrillable: nodeType === 'KnowledgeNode' && childCount > 0,
    childCount,
  };
}

/** 是否可直接练题（非分类容器节点） */
export function isPracticableGraphNode(node: KnowledgeNode): boolean {
  return node.isPracticable === true || node.nodeType === 'KnowledgePoint' || node.nodeType === 'TestingPoint';
}

/**
 * 向上补齐有限层主题祖先，避免「数与代数」等跨课本分类拉长图谱。
 * 仅补齐 KnowledgeNode，最多 KG_MAX_THEME_ANCESTOR_DEPTH 层。
 */
function ensureLimitedAncestors(
  nodeId: number,
  includedIds: Set<number>,
  flatTree: Map<number, RawKnowledgeTreeNode>
): void {
  if (KG_MAX_THEME_ANCESTOR_DEPTH <= 0) return;

  let current = flatTree.get(nodeId);
  let themeLayersAdded = 0;

  while (current && current.parent_id !== 0) {
    const parent = flatTree.get(current.parent_id);
    if (!parent || includedIds.has(parent.node_id)) break;

    if (parent.type === 'KnowledgeNode') {
      if (themeLayersAdded >= KG_MAX_THEME_ANCESTOR_DEPTH) break;
      includedIds.add(parent.node_id);
      themeLayersAdded += 1;
      current = parent;
      continue;
    }

    includedIds.add(parent.node_id);
    break;
  }
}

/** 语文能力地图需要完整分类归属，用于展示「阅读鉴赏 / 写作训练」等主题。 */
function ensureFullAncestorChain(
  nodeId: number,
  includedIds: Set<number>,
  flatTree: Map<number, RawKnowledgeTreeNode>
): void {
  let current = flatTree.get(nodeId);
  while (current && current.parent_id !== 0) {
    const parent = flatTree.get(current.parent_id);
    if (!parent || includedIds.has(parent.node_id)) break;
    includedIds.add(parent.node_id);
    current = parent;
  }
}

/** 英语：单字母索引桶（A/B/C…），不应作为学习目标展示 */
function isEnglishLetterBucket(node: RawKnowledgeTreeNode): boolean {
  return /^[A-Za-z]$/.test(node.name.trim());
}

/** 英语 Unit 词汇：纯英文单词标签（不含中文） */
export function isEnglishVocabLabel(name: string): boolean {
  const trimmed = name.trim();
  if (!trimmed) return false;
  const latin = (trimmed.match(/[A-Za-z]/g) || []).length;
  const cjk = (trimmed.match(/[\u4e00-\u9fff]/g) || []).length;
  if (latin === 0 || cjk > 0) return false;
  return true;
}

/** 画布节点：英文单词考点 */
export function isEnglishVocabGraphNode(node: KnowledgeNode): boolean {
  return node.nodeType === 'TestingPoint' && isEnglishVocabLabel(node.label);
}

/** 画布节点：语法 / 语音 / 功能话题（中文 KP 或中文 TP） */
export function isEnglishSkillGraphNode(node: KnowledgeNode): boolean {
  if (node.nodeType === 'KnowledgePoint') return true;
  return node.nodeType === 'TestingPoint' && !isEnglishVocabLabel(node.label);
}

export type EnglishUnitDisplayMode = 'vocab_circle' | 'mixed_blocks' | 'skill_focus';

/** 按 Unit 内容结构选择英语展示模式 */
export function getEnglishUnitDisplayMode(graph: UniverseData): EnglishUnitDisplayMode {
  const vocab = graph.nodes.filter(isEnglishVocabGraphNode);
  const skill = graph.nodes.filter(isEnglishSkillGraphNode);
  if (skill.length > 0 && vocab.length > 0) return 'mixed_blocks';
  if (vocab.length > 0) return 'vocab_circle';
  return 'skill_focus';
}

/** 英语是否使用专用画布（替代数学关系图） */
export function shouldUseEnglishCanvasLayout(subject: SubjectType, graph: UniverseData): boolean {
  if (subject !== '英语') return false;
  return graph.nodes.some(
    n => isEnglishVocabGraphNode(n) || isEnglishSkillGraphNode(n)
  );
}

/** @deprecated 保留兼容；等价于 shouldUseEnglishCanvasLayout */
export function shouldUseEnglishVocabList(subject: SubjectType, graph: UniverseData): boolean {
  return shouldUseEnglishCanvasLayout(subject, graph);
}

/**
 * 英语 scope 后处理：去掉字母桶、无课文挂载的分类节点，并移除无意义连线。
 */
function refineEnglishScopeGraph(
  graph: UniverseData,
  flatTree: Map<number, RawKnowledgeTreeNode>,
  catalogIds: Set<number>,
  catalogPointIds: Set<number>
): UniverseData {
  const keepIds = new Set<string>();

  graph.nodes.forEach(node => {
    const raw = flatTree.get(Number(node.id));
    if (!raw) {
      if (catalogPointIds.has(Number(node.id))) keepIds.add(node.id);
      return;
    }
    if (isEnglishLetterBucket(raw)) return;
    if (raw.type === 'TestingPoint' && !isEnglishVocabLabel(raw.name)) {
      if (catalogPointIds.has(raw.node_id)) keepIds.add(node.id);
      return;
    }
    if (raw.catalog_id !== 0 && catalogIds.has(raw.catalog_id)) {
      keepIds.add(node.id);
      return;
    }
    if (catalogPointIds.has(raw.node_id)) {
      keepIds.add(node.id);
    }
  });

  const nodes = graph.nodes
    .filter(n => keepIds.has(n.id))
    .map(n => {
      const isVocab = n.nodeType === 'TestingPoint' && isEnglishVocabLabel(n.label);
      return {
        ...n,
        depth: 0,
        group: 0,
        childCount: 0,
        isDrillable: false,
        displayRole: isVocab ? ('knowledge' as const) : ('knowledge' as const),
      };
    });

  return { nodes, links: [] };
}

/**
 * 按章/节 scope 构建知识图谱
 * - 节点：knowledge_tree 中 catalog_id 命中的子树（语文/数学）；catalog 挂载点（英语）
 * - 边：parent_id 父子关系
 * - 祖先链：最多补齐 KG_MAX_THEME_ANCESTOR_DEPTH 层主题父节点
 * - 语文（KG_CHINESE_TREE_ONLY_ENABLED）：仅查当前课本 knowledge_tree，用 catalog_id 匹配 scope；不读 catalog_tree.knowledge_points
 * - 英语：仅保留课文 catalog 挂载点，过滤字母桶与跨单元分类
 */
export function buildScopeGraph(
  tree: TextbookKnowledgeTree,
  scope: ChapterScope,
  subject: SubjectType,
  masteryOverrides?: Record<string, KnowledgeNode['status']>
): UniverseData {
  const overrides = masteryOverrides ?? readMasteryOverrides();
  const catalogIds = collectCatalogIds(tree.catalog_tree, scope.chapterCatalogId, scope.sectionCatalogId);
  const flatTree = flattenKnowledgeTree(tree.knowledge_tree);

  const catalogPoints = collectCatalogKnowledgePoints(tree.catalog_tree, catalogIds);
  const catalogPointIds = new Set(catalogPoints.map(p => p.node_id));
  const includedIds = new Set<number>();
  const chineseKnowledgeTreeScope = subject === '语文' && KG_CHINESE_TREE_ONLY_ENABLED;

  if (!chineseKnowledgeTreeScope) {
    catalogPoints.forEach(p => includedIds.add(p.node_id));
  }

  if (chineseKnowledgeTreeScope || subject !== '英语') {
    const addSubtree = (node: RawKnowledgeTreeNode) => {
      includedIds.add(node.node_id);
      node.children?.forEach(addSubtree);
    };

    flatTree.forEach(node => {
      if (node.catalog_id !== 0 && catalogIds.has(node.catalog_id)) {
        addSubtree(node);
      }
    });

    [...includedIds].forEach(id => {
      if (chineseKnowledgeTreeScope) ensureFullAncestorChain(id, includedIds, flatTree);
      else ensureLimitedAncestors(id, includedIds, flatTree);
    });
  }

  const nodes: KnowledgeNode[] = [];
  const links: KnowledgeLink[] = [];
  const depthMap = new Map<number, number>();

  const calcDepth = (nodeId: number): number => {
    if (depthMap.has(nodeId)) return depthMap.get(nodeId)!;
    const node = flatTree.get(nodeId);
    if (!node || node.parent_id === 0 || !includedIds.has(node.parent_id)) {
      depthMap.set(nodeId, 0);
      return 0;
    }
    const d = calcDepth(node.parent_id) + 1;
    depthMap.set(nodeId, d);
    return d;
  };

  includedIds.forEach(id => {
    const raw = flatTree.get(id);
    if (!raw) {
      const cp = catalogPoints.find(p => p.node_id === id);
      if (cp) {
        nodes.push(rawToGraphNode(cp, subject, subject === '英语' ? 0 : 1, overrides));
      }
      return;
    }
    const depth = subject === '英语' ? 0 : calcDepth(id);
    nodes.push(rawToGraphNode(raw, subject, depth, overrides));
    if (subject !== '英语' && raw.parent_id !== 0 && includedIds.has(raw.parent_id)) {
      links.push({
        source: String(raw.parent_id),
        target: String(raw.node_id),
        value: 1,
        isDirectional: true,
      });
    }
  });

  const childCounts = new Map<string, number>();
  links.forEach(link => {
    const s = typeof link.source === 'string' ? link.source : (link.source as KnowledgeNode).id;
    childCounts.set(s, (childCounts.get(s) ?? 0) + 1);
  });
  nodes.forEach(node => {
    const count = childCounts.get(node.id) ?? 0;
    node.childCount = count;
    node.isDrillable = node.nodeType === 'KnowledgeNode' && count > 0;
  });

  let graph = { nodes, links };
  if (subject === '英语') {
    graph = refineEnglishScopeGraph(graph, flatTree, catalogIds, catalogPointIds);
  }

  return graph;
}

/** 语文整册能力目录图：不按章节 scope 过滤，用当前课本 knowledge_tree 的顶层能力树展示目录感。 */
export function buildChineseTextbookAbilityDirectoryGraph(
  tree: TextbookKnowledgeTree,
  subject: SubjectType = '语文',
  masteryOverrides?: Record<string, KnowledgeNode['status']>
): UniverseData {
  const overrides = masteryOverrides ?? readMasteryOverrides();
  const nodes: KnowledgeNode[] = [];
  const links: KnowledgeLink[] = [];

  const visit = (raw: RawKnowledgeTreeNode, depth: number) => {
    nodes.push(rawToGraphNode(raw, subject, depth, overrides));
    if (raw.parent_id !== 0) {
      links.push({
        source: String(raw.parent_id),
        target: String(raw.node_id),
        value: 1,
        isDirectional: true,
      });
    }
    raw.children?.forEach(child => visit(child, depth + 1));
  };

  tree.knowledge_tree.forEach(root => visit(root, 0));
  return { nodes, links };
}

/** 是否默认折叠到主题层（方案 D） */
export function shouldDefaultCollapseGraph(subject: SubjectType, totalNodes: number): boolean {
  return subject === '语文' && totalNodes > KG_COLLAPSE_NODE_THRESHOLD;
}

export function isDrillableGraphNode(node: KnowledgeNode): boolean {
  return node.isDrillable === true || (node.nodeType === 'KnowledgeNode' && (node.childCount ?? 0) > 0);
}

function filterGraph(graph: UniverseData, nodeIds: Set<string>): UniverseData {
  const nodes = graph.nodes.filter(n => nodeIds.has(n.id));
  const links = graph.links.filter(link => {
    const s = typeof link.source === 'string' ? link.source : (link.source as KnowledgeNode).id;
    const t = typeof link.target === 'string' ? link.target : (link.target as KnowledgeNode).id;
    return nodeIds.has(s) && nodeIds.has(t);
  });
  return { nodes, links };
}

/** 折叠态：仅主题层 KnowledgeNode */
export function getCollapsedGraph(graph: UniverseData): UniverseData {
  const ids = new Set(graph.nodes.filter(n => n.nodeType === 'KnowledgeNode').map(n => n.id));
  return filterGraph(graph, ids);
}

/** 下钻一层：焦点节点 + 直接子节点 */
export function getDrillDownGraph(graph: UniverseData, focusNodeId: string): UniverseData {
  const ids = new Set<string>([focusNodeId]);
  graph.links.forEach(link => {
    const s = typeof link.source === 'string' ? link.source : (link.source as KnowledgeNode).id;
    const t = typeof link.target === 'string' ? link.target : (link.target as KnowledgeNode).id;
    if (s === focusNodeId) ids.add(t);
  });
  return filterGraph(graph, ids);
}

/**
 * 根据下钻栈解析可见子图
 * drillStack 为空 → 折叠态（若应折叠）或全量
 * drillStack 非空 → 最后一级焦点 + 直接子节点
 */
export function resolveVisibleGraph(
  graph: UniverseData,
  subject: SubjectType,
  drillStack: string[],
  schemeDEnabled: boolean
): UniverseData {
  if (!schemeDEnabled) return graph;

  if (drillStack.length > 0) {
    const focusId = drillStack[drillStack.length - 1];
    return getDrillDownGraph(graph, focusId);
  }

  if (shouldDefaultCollapseGraph(subject, graph.nodes.length)) {
    const collapsed = getCollapsedGraph(graph);
    if (collapsed.nodes.length > 0) return collapsed;
  }

  return graph;
}

export interface ScopeOverview {
  masteryRate: number;
  total: number;
  masteryDist: Record<(typeof STATUS_POOL)[number], number>;
  weakPoints: { id: string; label: string }[];
}

export function computeScopeOverview(graph: UniverseData, subject?: SubjectType): ScopeOverview {
  const dist = { mastered: 0, reviewing: 0, weak: 0, exploring: 0, unknown: 0 };
  const practicableNodes = graph.nodes.filter(node => {
    if (!isPracticableGraphNode(node)) return false;
    if (subject === '语文') return !!node.catalogId || !!node.catalogName;
    return true;
  });
  const statNodes = practicableNodes.length > 0 ? practicableNodes : graph.nodes;

  statNodes.forEach(n => {
    const key = (n.status === 'not_mastered' ? 'weak' : n.status) as keyof typeof dist;
    if (key in dist) dist[key]++;
  });
  const identified = statNodes.length - dist.unknown;
  const masteryRate = identified === 0 ? 0 : Math.round((dist.mastered / identified) * 100);

  return {
    masteryRate,
    total: statNodes.length,
    masteryDist: dist,
    weakPoints: statNodes
      .filter(n => n.status === 'weak' || n.status === 'not_mastered')
      .slice(0, 5)
      .map(n => ({ id: n.id, label: n.label })),
  };
}

export async function getChapterGraph(
  subject: SubjectType,
  chapterCatalogId: number,
  sectionCatalogId?: number
): Promise<{ graph: UniverseData; overview: ScopeOverview; tree: TextbookKnowledgeTree } | null> {
  const tree = await loadTextbookTreeBySubject(subject);
  if (!tree) return null;
  const graph = buildScopeGraph(
    tree,
    { textbookId: tree.textbook_id, chapterCatalogId, sectionCatalogId },
    subject
  );
  return { graph, overview: computeScopeOverview(graph, subject), tree };
}

/** 获取默认第一章（或第一个有知识点的章） */
export function getDefaultChapter(tree: TextbookKnowledgeTree): number {
  return tree.catalog_tree[0]?.catalog_id ?? 0;
}
