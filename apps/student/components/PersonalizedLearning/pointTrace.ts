import type { Point } from './bookLearningGraph';

export type TracePoint = Point & { previousId?: string };
export function hasPointPredecessor(index: Record<string, TracePoint>, id: string): boolean {
  const previousId = index[id]?.previousId;
  return !!previousId && previousId !== id && !!index[previousId];
}
/** Walk only explicit previous siblings; never infer prerequisites from the book order. */
export function getPointTrace(index: Record<string, TracePoint>, origin: Point): TracePoint[] {
  if (!index[origin.id]) return [];
  const result: TracePoint[] = [];
  const seen = new Set<string>();
  let current: TracePoint | undefined = index[origin.id];
  while (current && !seen.has(current.id)) {
    result.push(current);
    seen.add(current.id);
    current = current.previousId ? index[current.previousId] : undefined;
  }
  return result;
}
