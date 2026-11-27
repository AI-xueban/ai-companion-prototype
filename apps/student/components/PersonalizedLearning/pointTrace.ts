import type { Catalog, Point } from './bookLearningGraph';

export type TracePoint = Point & { previousId?: string; parentId?: string; isLeaf: boolean };
export type PointTree = { id: string; name: string; children: PointTree[] };
export type IntersectionNode = Omit<PointTree, 'children'> & { inBook: boolean; isLeaf: boolean; children: IntersectionNode[] };

/** Keep point-tree structure, but only textbook-associated points can be traced or learned. */
export function buildBookPointIntersection(catalog: Catalog[], pointTree: PointTree[]) {
  const bookIds = new Set<string>();
  const collectPoint = (point: Point) => { bookIds.add(point.id); point.children?.forEach(collectPoint); };
  const collectCatalog = (node: Catalog) => { node.points.forEach(collectPoint); node.children.forEach(collectCatalog); };
  catalog.forEach(collectCatalog);
  const index: Record<string, TracePoint> = {};
  const filterSiblings = (nodes: PointTree[], parentId?: string, path: string[] = []): IntersectionNode[] => {
    const result: IntersectionNode[] = [];
    let previousId: string | undefined;
    for (const node of nodes) {
      const children = filterSiblings(node.children, node.id, [...path, node.name]);
      const inBook = bookIds.has(node.id);
      // Use the original point tree: pruning all children must not turn a category into a traceable leaf.
      const isLeaf = node.children.length === 0;
      if (inBook) {
        index[node.id] = { id: node.id, name: node.name, treePath: path, parentId, isLeaf, previousId: isLeaf ? previousId : undefined };
        if (isLeaf) previousId = node.id;
      }
      // Unmatched ancestors are structure only; never promote their children into another sibling group.
      if (inBook || children.length) result.push({ id: node.id, name: node.name, inBook, isLeaf, children });
    }
    return result;
  };
  return { roots: filterSiblings(pointTree), index };
}
export function hasPointPredecessor(index: Record<string, TracePoint>, id: string): boolean {
  const previousId = index[id]?.previousId;
  return index[id]?.isLeaf === true && !!previousId && previousId !== id
    && index[previousId]?.isLeaf === true && index[previousId].parentId === index[id].parentId;
}
/** Walk previous matched siblings in the current book intersection; never infer prerequisites. */
export function getPointTrace(index: Record<string, TracePoint>, origin: Point): TracePoint[] {
  const source = index[origin.id];
  if (!source?.isLeaf) return [];
  const result: TracePoint[] = [];
  const seen = new Set<string>();
  let current: TracePoint | undefined = index[origin.id];
  while (current?.isLeaf && current.parentId === source.parentId && !seen.has(current.id)) {
    result.push(current);
    seen.add(current.id);
    current = current.previousId ? index[current.previousId] : undefined;
  }
  return result;
}
