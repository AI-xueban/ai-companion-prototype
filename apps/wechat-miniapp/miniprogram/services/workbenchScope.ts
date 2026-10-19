import type { SessionProfile } from '../types/identity';
import { DEMO_CLASSES, DEMO_STUDENTS } from './schoolDemoRoster';
import { queryLearning } from './learningMock';
import type { LearningPeriod } from './learningMock';
import type { HomeworkTask } from './homeworkMock';

export type WorkView = 'school' | 'homeroom' | 'subject';
export interface WorkScope { view: WorkView; period: LearningPeriod; grade: 'all' | 7 | 8; classId: string }
const labels: Record<WorkView, string> = { school: '学校管理员', homeroom: '班主任', subject: '任课老师' };
let owner = '';
let current: WorkScope = { view: 'school', period: '7d', grade: 'all', classId: 'all' };
export function resetWorkScope(): void { owner = ''; current = { view: 'school', period: '7d', grade: 'all', classId: 'all' }; }

export const workViewLabel = (view: WorkView) => labels[view];
export function availableWorkViews(profile: SessionProfile): WorkView[] {
  const views: WorkView[] = [];
  if (profile.roles.includes('school_admin')) views.push('school');
  if (profile.roles.includes('teacher') && profile.userId === 'teacher-demo-001') views.push('homeroom', 'subject');
  else if (profile.roles.includes('teacher')) views.push('subject');
  return views;
}
export function workScope(profile: SessionProfile): WorkScope {
  const views = availableWorkViews(profile);
  if (owner !== profile.userId || !views.includes(current.view)) {
    owner = profile.userId;
    current = { view: views[0] || 'subject', period: '7d', grade: 'all', classId: views[0] === 'school' ? 'all' : 'c1' };
  }
  return { ...current };
}
export function selectWorkView(profile: SessionProfile, view: WorkView): WorkScope {
  if (!availableWorkViews(profile).includes(view)) return workScope(profile);
  const previous = workScope(profile);
  current = { view, period: previous.period, grade: 'all', classId: view === 'school' ? 'all' : 'c1' };
  return workScope(profile);
}
export function selectWorkPeriod(profile: SessionProfile, period: LearningPeriod): WorkScope {
  if (period === '7d' || period === '30d') current = { ...workScope(profile), period };
  return workScope(profile);
}
export function selectWorkGrade(profile: SessionProfile, grade: 'all' | 7 | 8): WorkScope {
  const scope = workScope(profile);
  if (scope.view === 'school' && (grade === 'all' || grade === 7 || grade === 8)) current = { ...scope, grade, classId: 'all' };
  return workScope(profile);
}
export function selectWorkClass(profile: SessionProfile, classId: string): WorkScope {
  const scope = workScope(profile);
  const allowed = scope.view === 'school' ? DEMO_CLASSES.filter(row => scope.grade === 'all' || row.grade === scope.grade).map(row => row.id) : scope.view === 'homeroom' ? ['c1'] : ['c1', 'c2'];
  if (classId === 'all' && scope.view === 'school' || allowed.includes(classId)) current = { ...scope, classId };
  return workScope(profile);
}
export function scopeClassIds(scope: WorkScope): string[] {
  if (scope.view === 'homeroom') return ['c1'];
  if (scope.view === 'subject') return scope.classId === 'c2' ? ['c2'] : ['c1'];
  return DEMO_CLASSES.filter(row => (scope.grade === 'all' || row.grade === scope.grade) && (scope.classId === 'all' || row.id === scope.classId)).map(row => row.id);
}
export function scopeTitle(scope: WorkScope): string {
  if (scope.view === 'school') return scope.classId !== 'all' ? DEMO_CLASSES.find(row => row.id === scope.classId)?.name || '学校' : scope.grade === 'all' ? '罗湖实验学校' : `${scope.grade}年级`;
  return DEMO_CLASSES.find(row => row.id === scope.classId)?.name || '班级';
}
export function scopeSubtitle(scope: WorkScope): string { return `${scopeTitle(scope)} · ${scope.view === 'subject' ? '数学' : '全科'} · ${scope.period === '7d' ? '近 7 天' : '近 30 天'}`; }
export function homeworkScopeSubtitle(scope: WorkScope): string { return `${scopeTitle(scope)} · ${scope.view === 'subject' ? '数学' : '全科'}`; }
export function queryWorkLearning(scope: WorkScope, studentId = 'all') {
  const classes = scopeClassIds(scope);
  const subject = scope.view === 'subject' ? '数学' : 'all';
  const full = queryLearning(scope.period, 'all', subject, studentId);
  const roster = full.roster.filter(row => classes.includes(row.classId));
  const activities = full.activities.filter(row => classes.includes(row.classId));
  const operations = full.operations.filter(row => classes.includes(row.classId));
  const answers = full.answers.filter(row => classes.includes(row.classId));
  const solveRequests = full.solveRequests.filter(row => classes.includes(row.classId));
  return { roster, activities, operations, answers, solveRequests, usedIds: new Set(operations.map(row => row.studentId)), learnedIds: new Set(activities.map(row => row.studentId)), minutes: activities.reduce((sum, row) => sum + row.minutes, 0) };
}
export function taskInScope(task: HomeworkTask, scope: WorkScope, teacherId: string): boolean {
  if (!task.classIds.some(id => scopeClassIds(scope).includes(id))) return false;
  if (scope.view !== 'school' && task.publishedBy !== teacherId) return false;
  return true;
}
export function scopedHomeworkTask(task: HomeworkTask, scope: WorkScope): HomeworkTask {
  const classes = scopeClassIds(scope);
  return { ...task, classIds: task.classIds.filter(id => classes.includes(id)), targetStudentIds: task.targetStudentIds?.filter(id => DEMO_STUDENTS.some(student => student.id === id && classes.includes(student.classId))) || null, targetSnapshotIds: task.targetSnapshotIds?.filter(id => DEMO_STUDENTS.some(student => student.id === id && classes.includes(student.classId))) };
}
