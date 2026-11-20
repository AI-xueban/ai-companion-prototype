export type Point = { id: string; name: string; treePath?: string[] };
export type Catalog = { id: string; name: string; children: Catalog[]; points: Point[] };
export type GraphGroup = { catalog: Catalog; points: Point[] };

/** Directory order is a reading order, not an inferred prerequisite relationship. */
export function buildBookGraph(scope: Catalog): GraphGroup[] {
  const groups: GraphGroup[] = [];
  const seen = new Set<string>();
  const visit = (node: Catalog) => {
    if (node.children.length) node.children.forEach(visit);
    const points = node.points.filter(p => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
    if (points.length) groups.push({ catalog: node, points });
  };
  visit(scope);
  return groups;
}
