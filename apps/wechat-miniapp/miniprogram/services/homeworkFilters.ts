import { isResultReleased } from './homeworkGrading';
import type { GradeQuestion } from './homeworkMock';

export const TASK_STATUS_GROUPS = [
  { id: 'submission', label: '提交情况', options: [
    { id: 'unsubmitted', label: '未交齐' }, { id: 'submitted', label: '已交齐' },
  ] },
  { id: 'grading', label: '处理进度', options: [
    { id: 'processing', label: '批改中' }, { id: 'failed', label: '批改失败' }, { id: 'review', label: '待教师复核' },
    { id: 'unreleased', label: '待教师开放' }, { id: 'partialRelease', label: '部分开放' }, { id: 'released', label: '全部开放' },
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
  if (questions.some(q => q.state === 'queued' || q.state === 'processing')) states.push('processing');
  if (questions.some(q => q.state === 'failed')) states.push('failed');
  if (questions.some(q => q.state === 'review')) states.push('review');
  if (questions.some(q => q.state === 'confirmed' && !isResultReleased(q))) states.push('unreleased');
  const released = questions.filter(isResultReleased).length;
  if (released) states.push(released === questions.length ? 'released' : 'partialRelease');
  return states;
}
