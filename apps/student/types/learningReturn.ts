export type SyncSpecialKind = 'vocab' | 'speaking' | 'grammar' | 'improve';

export type LearningEntry =
  | { from: 'home-sync' }
  | { from: 'home-practice' }
  | { from: 'subject-l1' }
  | { from: 'subject-special'; special: SyncSpecialKind }
  | { from: 'subject-practice' };

export type LearningExitReason = 'complete' | 'abort' | 'lesson-practice';

export type SubjectResumeView = 'practice' | SyncSpecialKind;

export function inferSubjectLearningEntry(taskId: string, aiReasoning?: string): LearningEntry {
  if (aiReasoning === '同步自主测' || taskId.includes('self-practice')) {
    return { from: 'subject-practice' };
  }
  if (taskId.includes('-sync-vocab-')) return { from: 'subject-special', special: 'vocab' };
  if (taskId.includes('-sync-grammar-')) return { from: 'subject-special', special: 'grammar' };
  if (taskId.includes('-sync-speaking-')) return { from: 'subject-special', special: 'speaking' };
  if (taskId.includes('-sync-improve-')) return { from: 'subject-special', special: 'improve' };
  return { from: 'subject-l1' };
}
