import type { GradeQuestion } from './homeworkMock';

export const TASK_STATUS_GROUPS = [
  { id: 'submission', label: '提交情况', options: [
    { id: 'unsubmitted', label: '未交齐' }, { id: 'submitted', label: '已交齐' },
  ] },
  { id: 'grading', label: '批改进度', options: [
    { id: 'queued', label: '等待批改' }, { id: 'processing', label: '批改中' }, { id: 'graded', label: '批改完成' },
  ] },
];
export const ALL_TASK_STATUSES = TASK_STATUS_GROUPS.flatMap(group => group.options.map(option => option.id));
export function normalizeTaskStatuses(ids: string[]): string[] { return ALL_TASK_STATUSES.filter(id => ids.includes(id)); }
export function matchesTaskStatuses(selected: string[], states: string[]): boolean {
  const ids = normalizeTaskStatuses(selected);
  if (!ids.length) return false;
  return TASK_STATUS_GROUPS.every(group => {
    const choices = group.options.filter(option => ids.includes(option.id));
    // An untouched/all-selected group and an empty group both mean no restriction.
    return !choices.length || choices.length === group.options.length || choices.some(option => states.includes(option.id));
  });
}
export function taskStatusKeys(summary: { target: number; completed: number; partial: number }, questions: GradeQuestion[]): string[] {
  const states: string[] = [];
  if (summary.target > 0) states.push(summary.completed === summary.target ? 'submitted' : 'unsubmitted');
  if (questions.length) {
    const pending = questions.filter(q => q.state === 'queued' || q.state === 'processing');
    states.push(pending.length === questions.length && pending.every(q => q.state === 'queued') ? 'queued' : pending.length ? 'processing' : 'graded');
  }
  return states;
}
