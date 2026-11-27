export type Point = { id: string; name: string; treePath?: string[]; children?: Point[] };
export type Catalog = { id: string; name: string; children: Catalog[]; points: Point[] };
export type KnowledgeNode = { point: Point; children: KnowledgeNode[] };
export type GraphGroup = { catalog: Catalog; points: Point[]; roots: KnowledgeNode[] };


// Match a subsection's named knowledge point, without guessing from point IDs or taxonomy paths.
const catalogTitle = (name: string) => name.replace(/^\s*(?:第[\d一二三四五六七八九十百]+[章节课单元]+\s*|\d+(?:\.\d+)*[.、．]?\s*)/, '').replace(/\s/g, '');

// Confirmed display grouping, also used by editions that flatten subsection Points.
// These are textbook UI relationships, not edges from point2 or prerequisite claims.
const confirmedChildren: Record<string, string[]> = { '22115': ['22116', '22118'] };

/** Mainline order follows the textbook. Branches express textbook grouping, not prerequisites. */
export function buildBookGraph(scope: Catalog): GraphGroup[] {
  const fromPoint = (point: Point): KnowledgeNode => ({ point, children: (point.children ?? []).map(fromPoint) });
  const visit = (node: Catalog, isScope = false): KnowledgeNode[] => {
    const descendants = node.children.flatMap(child => visit(child));
    const own = node.points.map(fromPoint);
    // The selected section is a container. Its named point must not swallow the whole mainline.
    const anchor = (!isScope || !node.children.length)
      ? own.find(n => catalogTitle(n.point.name) === catalogTitle(node.name)) : undefined;
    if (anchor) {
      anchor.children.push(...descendants, ...own.filter(n => n !== anchor));
      return [anchor];
    }
    // The selected directory's explicit Points come first, even when it has subsections.
    // A directory title/ID alone never creates a knowledge point.
    return isScope ? [...own, ...descendants] : [...descendants, ...own];
  };
  const roots: KnowledgeNode[] = [];
  const index = new Map<string, KnowledgeNode>();
  const append = (raw: KnowledgeNode, target: KnowledgeNode[], ancestors: Set<string>) => {
    if (ancestors.has(raw.point.id)) return;
    let node = index.get(raw.point.id);
    if (!node) {
      node = { point: raw.point, children: [] };
      index.set(raw.point.id, node);
      target.push(node);
    }
    const path = new Set([...ancestors, raw.point.id]);
    raw.children.forEach(child => append(child, node!.children, path));
  };
  visit(scope, true).forEach(node => append(node, roots, new Set()));
  Object.entries(confirmedChildren).forEach(([parentId, childIds]) => {
    const parent = index.get(parentId);
    if (!parent) return;
    childIds.forEach(id => {
      const position = roots.findIndex(node => node.point.id === id);
      if (position >= 0) parent.children.push(...roots.splice(position, 1));
    });
  });
  const points: Point[] = [];
  const flatten = (node: KnowledgeNode) => { points.push(node.point); node.children.forEach(flatten); };
  roots.forEach(flatten);
  return points.length ? [{ catalog: scope, points, roots }] : [];
}

export type PositionedKnowledgeNode = { point: Point; depth: number; x: number; y: number };
export type KnowledgeEdge = { from: PositionedKnowledgeNode; to: PositionedKnowledgeNode; kind: 'order' | 'child' };

/** Reserve space for every subtree before positioning it, including third and deeper levels. */
export function layoutBookGraph(groups: GraphGroup[]) {
  const nodes: PositionedKnowledgeNode[] = [];
  const edges: KnowledgeEdge[] = [];
  const roots = groups.flatMap(group => group.roots);
  const mainSpacing = roots.length <= 2 ? 230 : 200;
  const levelSpacing = 180;
  const span = (node: KnowledgeNode): number => Math.max(180, node.children.reduce((sum, child) => sum + span(child), 0));
  const subtreeHeight = (node: KnowledgeNode): number => node.children.length ? levelSpacing + Math.max(...node.children.map(subtreeHeight)) : 0;
  const columns = Math.max(1, Math.min(4, roots.length));
  let rowTop = 45;
  let previous: PositionedKnowledgeNode | undefined;
  for (let start = 0; start < roots.length; start += columns) {
    const row = roots.slice(start, start + columns);
    const widths = row.map(node => Math.max(mainSpacing, span(node)));
    const rowWidth = widths.reduce((sum, width) => sum + width, 0);
    const reversed = Math.floor(start / columns) % 2 === 1;
    let offset = reversed ? rowWidth + 30 : 30;
    row.forEach((root, column) => {
      const width = widths[column];
      const left = reversed ? offset - width : offset;
      const place = (node: KnowledgeNode, x: number, y: number, level: number): PositionedKnowledgeNode => {
        const positioned = { point: node.point, depth: level, x, y };
        nodes.push(positioned);
        let childLeft = x - span(node) / 2;
        node.children.forEach(child => {
          const childWidth = span(child);
          const next = place(child, childLeft + childWidth / 2, y + levelSpacing, level + 1);
          edges.push({ from: positioned, to: next, kind: 'child' });
          childLeft += childWidth;
        });
        return positioned;
      };
      const positioned = place(root, left + width / 2, rowTop, 0);
      if (previous) edges.push({ from: previous, to: positioned, kind: 'order' });
      previous = positioned;
      offset += reversed ? -width : width;
    });
    rowTop += Math.max(...row.map(subtreeHeight)) + 200;
  }
  return { nodes, edges };
}

/** Keep straight segments outside the two-line label and use the outside lane for row changes. */
export function knowledgeEdgePath(edge: KnowledgeEdge, nodes: PositionedKnowledgeNode[], selected: string | undefined, fontSize: number) {
  const { from, to, kind } = edge;
  const radius = (node: PositionedKnowledgeNode, end = false) => (node.depth ? 19 : 23) + (selected === node.point.id ? 9 : 0) + (end ? 3 : 0);
  const dx = to.x - from.x, dy = to.y - from.y;
  if (kind === 'order' && dy > 0 && Math.abs(dx) < 1 && !nodes.some(node => node !== from && node !== to && Math.abs(node.x - from.x) < 90 && node.y > from.y && node.y < to.y)) {
    const labelBottom = (from.depth ? 27 : 30) + 2 * fontSize * 1.4 + 10;
    return `M${from.x},${from.y + labelBottom} L${to.x},${to.y - radius(to, true)}`;
  }
  if (kind === 'order' && dy !== 0) {
    const left = Math.min(...nodes.map(node => node.x)), right = Math.max(...nodes.map(node => node.x));
    const direction = from.x - left < right - from.x ? -1 : 1;
    const corridor = direction < 0 ? left - 120 : right + 120;
    return `M${from.x + direction * radius(from)},${from.y} L${corridor},${from.y} L${corridor},${to.y} L${to.x + direction * radius(to, true)},${to.y}`;
  }
  if (dy > 0) {
    const labelBottom = (from.depth ? 27 : 30) + 2 * fontSize * 1.4 + 10;
    return `M${from.x},${from.y + labelBottom} L${to.x},${to.y - radius(to, true)}`;
  }
  const distance = Math.hypot(dx, dy) || 1;
  return `M${from.x + dx / distance * radius(from)},${from.y + dy / distance * radius(from)} L${to.x - dx / distance * radius(to, true)},${to.y - dy / distance * radius(to, true)}`;
}

