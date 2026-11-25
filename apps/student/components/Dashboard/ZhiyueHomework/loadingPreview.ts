// Prototype-only frames. Replace with actual per-image events when the API is connected.
export interface LoadingFrame {
  pageIndex: number;
  phase: 'recognition' | 'grading' | 'finalizing' | 'done';
  completed: number;
  total: number;
  duration: number;
}

export const createLoadingPreview = (pageCount: number): LoadingFrame[] => {
  const totals = [5, 8, 6];
  const frames: LoadingFrame[] = [];
  for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
    const total = totals[pageIndex % totals.length];
    frames.push({ pageIndex, phase: 'recognition', completed: 0, total: 0, duration: 1800 });
    for (const completed of [...new Set([1, Math.ceil(total / 2), total - 1, total])]) {
      frames.push({ pageIndex, phase: 'grading', completed, total, duration: 900 });
    }
  }
  frames.push({ pageIndex: pageCount - 1, phase: 'finalizing', completed: 0, total: 0, duration: 1800 });
  frames.push({ pageIndex: pageCount - 1, phase: 'done', completed: 0, total: 0, duration: 0 });
  return frames;
};
