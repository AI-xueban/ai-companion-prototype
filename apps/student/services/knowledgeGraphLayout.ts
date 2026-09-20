import type { GraphDisplayRole, KnowledgeLink, KnowledgeNode, UniverseData } from '../knowledgeGraphTypes';

export interface KnowledgeCluster {
  parentId: string;
  childIds: string[];
}

export interface LayoutPosition {
  x: number;
  y: number;
  fx: number;
  fy: number;
}

/** 层级列间距（左 → 右） */
const COL_GAP = 112;
/** 簇内父节点与子节点列间距 */
const CLUSTER_COL_GAP = 96;
/** 兄弟子树纵向间距 */
const SUBTREE_GAP = 26;
const SLOT_HEIGHT = 54;
const CLUSTER_SLOT_HEIGHT = 50;
const LEAF_SLOT_HEIGHT = 46;
const LEFT_MARGIN = 56;
const TOP_MARGIN = 48;

function linkEndpoints(link: KnowledgeLink): { source: string; target: string } {
  const source = typeof link.source === 'object' ? (link.source as KnowledgeNode).id : link.source;
  const target = typeof link.target === 'object' ? (link.target as KnowledgeNode).id : link.target;
  return { source, target };
}

function nodeRadius(role?: GraphDisplayRole): number {
  if (role === 'theme') return 15;
  if (role === 'testing') return 6;
  if (role === 'knowledge') return 10;
  return 8;
}

/** 父节点直接子节点数 ≥ 此值时才成簇（虚线圈 + 簇内布局） */
export const KG_CLUSTER_MIN_CHILDREN = 3;

/** 识别可画虚线圈的「父 + 直接子」簇（子节点数 ≥ 3） */
export function computeKnowledgeClusters(graph: UniverseData): KnowledgeCluster[] {
  const nodeMap = new Map(graph.nodes.map(n => [n.id, n]));
  const childrenMap = buildChildrenMap(graph);

  const clusters: KnowledgeCluster[] = [];

  childrenMap.forEach((childIds, parentId) => {
    if (childIds.length < KG_CLUSTER_MIN_CHILDREN) return;
    if (!nodeMap.get(parentId)) return;
    clusters.push({ parentId, childIds: [...childIds] });
  });

  return clusters;
}

export function buildChildrenMap(graph: UniverseData): Map<string, string[]> {
  const childrenMap = new Map<string, string[]>();
  graph.links.forEach(link => {
    const { source, target } = linkEndpoints(link);
    if (!childrenMap.has(source)) childrenMap.set(source, []);
    childrenMap.get(source)!.push(target);
  });
  return childrenMap;
}

export function findClusterByParent(clusters: KnowledgeCluster[], parentId: string): KnowledgeCluster | undefined {
  return clusters.find(c => c.parentId === parentId);
}

export function findClusterContainingNode(
  clusters: KnowledgeCluster[],
  nodeId: string
): KnowledgeCluster | undefined {
  return clusters.find(c => c.parentId === nodeId || c.childIds.includes(nodeId));
}

function slotHeightForNode(node: KnowledgeNode | undefined, childCount: number): number {
  if (!node) return SLOT_HEIGHT;
  if (childCount >= KG_CLUSTER_MIN_CHILDREN) {
    return Math.max(CLUSTER_SLOT_HEIGHT, childCount * CLUSTER_SLOT_HEIGHT);
  }
  if ((node.childCount ?? 0) === 0) return LEAF_SLOT_HEIGHT;
  return SLOT_HEIGHT;
}

/** 预估子树纵向占位（保证兄弟子树不重叠） */
export function measureSubtreeHeight(
  nodeId: string,
  nodeMap: Map<string, KnowledgeNode>,
  childrenMap: Map<string, string[]>
): number {
  const node = nodeMap.get(nodeId);
  const children = childrenMap.get(nodeId) ?? [];
  if (children.length === 0) return slotHeightForNode(node, 0);

  if (children.length >= KG_CLUSTER_MIN_CHILDREN) {
    return children.reduce((sum, cid) => {
      const grand = childrenMap.get(cid) ?? [];
      const base = CLUSTER_SLOT_HEIGHT;
      if (grand.length === 0) return sum + base;
      return sum + Math.max(base, measureSubtreeHeight(cid, nodeMap, childrenMap));
    }, 0);
  }

  return children.reduce(
    (sum, cid, i) =>
      sum + measureSubtreeHeight(cid, nodeMap, childrenMap) + (i > 0 ? SUBTREE_GAP : 0),
    0
  );
}

interface LayoutBounds {
  right: number;
}

function colX(depth: number, isClusterChild = false): number {
  if (depth === 0) return LEFT_MARGIN;
  if (isClusterChild) return LEFT_MARGIN + depth * COL_GAP;
  return LEFT_MARGIN + depth * COL_GAP;
}

function layoutSubtree(
  nodeId: string,
  topY: number,
  depth: number,
  nodeMap: Map<string, KnowledgeNode>,
  childrenMap: Map<string, string[]>,
  positions: Map<string, LayoutPosition>
): { height: number; bounds: LayoutBounds } {
  const node = nodeMap.get(nodeId);
  const children = childrenMap.get(nodeId) ?? [];
  const x = colX(depth);

  if (children.length === 0) {
    const h = slotHeightForNode(node, 0);
    const y = topY + h / 2;
    positions.set(nodeId, { x, y, fx: x, fy: y });
    return { height: h, bounds: { right: x + nodeRadius(node?.displayRole) + 20 } };
  }

  if (children.length >= KG_CLUSTER_MIN_CHILDREN) {
    const childHeights = children.map(cid => {
      const grand = childrenMap.get(cid) ?? [];
      if (grand.length === 0) return CLUSTER_SLOT_HEIGHT;
      return Math.max(CLUSTER_SLOT_HEIGHT, measureSubtreeHeight(cid, nodeMap, childrenMap));
    });
    const totalH = childHeights.reduce((a, b) => a + b, 0);
    const parentY = topY + totalH / 2;
    positions.set(nodeId, { x, y: parentY, fx: x, fy: parentY });

    const childX = x + CLUSTER_COL_GAP;
    let cursorY = topY;
    let maxRight = x + CLUSTER_COL_GAP + 20;

    children.forEach((cid, i) => {
      const ch = childHeights[i];
      const childTop = cursorY;
      cursorY += ch;

      const grand = childrenMap.get(cid) ?? [];
      if (grand.length === 0) {
        const cy = childTop + ch / 2;
        positions.set(cid, { x: childX, y: cy, fx: childX, fy: cy });
        const childNode = nodeMap.get(cid);
        maxRight = Math.max(maxRight, childX + nodeRadius(childNode?.displayRole) + 24);
      } else {
        const nested = layoutSubtree(cid, childTop, depth + 1, nodeMap, childrenMap, positions);
        maxRight = Math.max(maxRight, nested.bounds.right);
      }
    });

    return { height: totalH + 20, bounds: { right: maxRight } };
  }

  let cursorY = topY;
  let maxRight = x;
  const childLayouts = children.map((cid, i) => {
    const sub = layoutSubtree(cid, cursorY, depth + 1, nodeMap, childrenMap, positions);
    cursorY += sub.height + (i < children.length - 1 ? SUBTREE_GAP : 0);
    maxRight = Math.max(maxRight, sub.bounds.right);
    return sub;
  });
  const totalH = childLayouts.reduce((s, l) => s + l.height, 0) + SUBTREE_GAP * Math.max(0, children.length - 1);
  const parentY = topY + totalH / 2;
  positions.set(nodeId, { x, y: parentY, fx: x, fy: parentY });

  return {
    height: Math.max(totalH, slotHeightForNode(node, children.length)),
    bounds: { right: maxRight },
  };
}

/** 确定性层级树布局：从左到右，同层兄弟纵向排开 */
export function layoutKnowledgeGraph(
  graph: UniverseData,
  viewportWidth: number,
  viewportHeight: number
): Map<string, LayoutPosition> {
  const positions = new Map<string, LayoutPosition>();
  const nodeMap = new Map(graph.nodes.map(n => [n.id, n]));
  const childrenMap = buildChildrenMap(graph);

  const hasParent = new Set<string>();
  graph.links.forEach(link => {
    hasParent.add(linkEndpoints(link).target);
  });

  let roots = graph.nodes.filter(n => !hasParent.has(n.id));
  if (roots.length === 0) {
    roots = [...graph.nodes].sort((a, b) => (a.depth ?? a.group) - (b.depth ?? b.group));
    roots = roots.filter((n, i, arr) => (n.depth ?? n.group) === (arr[0].depth ?? arr[0].group));
  }
  roots.sort((a, b) => a.label.localeCompare(b.label, 'zh-CN'));

  let cursorY = TOP_MARGIN;
  let maxRight = LEFT_MARGIN;
  roots.forEach((root, i) => {
    const sub = layoutSubtree(root.id, cursorY, 0, nodeMap, childrenMap, positions);
    cursorY += sub.height + (i < roots.length - 1 ? SUBTREE_GAP * 2 : 0);
    maxRight = Math.max(maxRight, sub.bounds.right);
  });

  const orphans = graph.nodes.filter(n => !positions.has(n.id));
  if (orphans.length > 0) {
    let oy = cursorY;
    orphans.forEach(n => {
      const h = slotHeightForNode(n, 0);
      const y = oy + h / 2;
      const ox = maxRight + COL_GAP;
      positions.set(n.id, { x: ox, y, fx: ox, fy: y });
      oy += h + SUBTREE_GAP;
      maxRight = Math.max(maxRight, ox + 20);
    });
  }

  if (positions.size === 0) return positions;

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  positions.forEach(p => {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  });

  const graphW = maxX - minX || 1;
  const graphH = maxY - minY || 1;
  const padX = 48;
  const padY = 44;
  const scaleX = graphW > viewportWidth - padX * 2 ? (viewportWidth - padX * 2) / graphW : 1;
  const scaleY = graphH > viewportHeight - padY * 2 ? (viewportHeight - padY * 2) / graphH : 1;
  const scale = Math.min(scaleX, scaleY, 1);
  const offsetX = (viewportWidth - graphW * scale) / 2 - minX * scale;
  const offsetY = (viewportHeight - graphH * scale) / 2 - minY * scale;

  positions.forEach((p, id) => {
    const next = {
      x: p.x * scale + offsetX,
      y: p.y * scale + offsetY,
      fx: p.x * scale + offsetX,
      fy: p.y * scale + offsetY,
    };
    positions.set(id, next);
  });

  return positions;
}
