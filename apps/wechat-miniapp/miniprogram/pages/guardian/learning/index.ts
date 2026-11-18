import { hasRole } from '../../../permissions/access';
import { getSession, linkedGuardianStudents, selectGuardianStudent } from '../../../stores/session';
import {
  activityEvidence, learningOnDay, learningReportDays, queryLearning, reportMistakes,
  reportSubjects, reportWeeklyComparison, timelineRows,
} from '../../../services/learningMock';
import { getDemoStudent } from '../../../services/schoolDemoRoster';

type Detail = 'home' | 'today' | 'mistakes' | 'child';

function guardianScope() {
  const session = getSession();
  if (!session?.expiresAt || session.expiresAt <= Date.now() || !hasRole(session.profile, 'guardian')) return null;
  const children = linkedGuardianStudents(session.profile);
  const student = getDemoStudent(session.profile.activeStudentId || '');
  return student && children.some(child => child.id === student.id) ? { student, children } : null;
}

Page({
  data: {
    tab: 'overview' as 'overview' | 'week', detail: 'home' as Detail,
    day: 0, dates: learningReportDays, date: learningReportDays[0],
    period: '30d' as '7d' | '30d', subject: 'all',
    studentId: '', studentName: '', className: '',
    children: [] as Array<{ id: string; name: string; className: string; selected: boolean }>, childPickerOpen: false,
    today: [] as ReturnType<typeof timelineRows>, timeline: [] as ReturnType<typeof timelineRows>,
    mistakes: [] as ReturnType<typeof reportMistakes>, corrected: 0, expandedMistake: '',
    subjects: [] as ReturnType<typeof reportSubjects>, childDays: 0, activities: 0, subjectCount: 0,
    week: null as ReturnType<typeof reportWeeklyComparison>, weekDetails: false, weekActivities: 0,
    selectedActivity: null as ReturnType<typeof activityEvidence>,
  },
  onShow() {
    const scope = guardianScope();
    if (!scope) { wx.reLaunch({ url: '/pages/auth/login/index' }); return; }
    const { student, children } = scope;
    if (student.id !== this.data.studentId) {
      this.setData({ detail: 'home', tab: 'overview', subject: 'all', selectedActivity: null, expandedMistake: '', weekDetails: false });
    }
    this.setData({ studentId: student.id, studentName: student.name, className: student.className, childPickerOpen: false,
      children: children.map(child => ({ ...child, selected: child.id === student.id })) });
    this.refresh();
  },
  toggleChildPicker() { if (this.data.children.length > 1) this.setData({ childPickerOpen: !this.data.childPickerOpen }); },
  closeChildPicker() { this.setData({ childPickerOpen: false }); },
  changeChild(event: WechatMiniprogram.BaseEvent) {
    if (guardianScope() && selectGuardianStudent(String(event.currentTarget.dataset.id))) this.onShow();
  },
  changeTab(event: WechatMiniprogram.BaseEvent) {
    const tab = event.currentTarget.dataset.tab;
    if (tab === 'overview' || tab === 'week') this.setData({ tab, detail: 'home', weekDetails: false, selectedActivity: null });
  },
  changeDay(event: WechatMiniprogram.CustomEvent<{ value: string }>) {
    const day = Number(event.detail.value);
    if (!Number.isInteger(day) || day < 0 || day >= learningReportDays.length) return;
    this.setData({ day, date: learningReportDays[day], expandedMistake: '', selectedActivity: null });
    this.refresh();
  },
  openDetail(event: WechatMiniprogram.BaseEvent) {
    const detail = event.currentTarget.dataset.detail;
    if (!['today', 'mistakes', 'child'].includes(detail)) return;
    this.setData({ detail, expandedMistake: detail === 'mistakes' ? this.data.mistakes[0]?.id || '' : '', subject: 'all' });
    this.refresh();
  },
  closeDetail() { this.setData({ detail: 'home', selectedActivity: null, expandedMistake: '' }); },
  changePeriod(event: WechatMiniprogram.BaseEvent) {
    const period = event.currentTarget.dataset.period;
    if (period !== '7d' && period !== '30d') return;
    this.setData({ period, subject: 'all', selectedActivity: null });
    this.refresh();
  },
  changeSubject(event: WechatMiniprogram.BaseEvent) {
    const subject = String(event.currentTarget.dataset.subject);
    if (subject !== 'all' && !this.data.subjects.some(row => row.subject === subject)) return;
    this.setData({ subject, selectedActivity: null });
    this.refresh();
  },
  toggleMistake(event: WechatMiniprogram.BaseEvent) {
    const id = String(event.currentTarget.dataset.id);
    if (this.data.mistakes.some(row => row.id === id)) this.setData({ expandedMistake: this.data.expandedMistake === id ? '' : id });
  },
  toggleWeekDetails() { this.setData({ weekDetails: !this.data.weekDetails }); },
  openActivity(event: WechatMiniprogram.BaseEvent) {
    const scope = guardianScope();
    if (!scope) return;
    const id = String(event.currentTarget.dataset.id);
    const list = this.data.detail === 'today' || this.data.detail === 'home' ? this.data.today : this.data.timeline;
    if (!list.some(row => row.id === id)) return;
    this.setData({ selectedActivity: activityEvidence(queryLearning('30d', scope.student.classId, 'all', scope.student.id, true), id) });
  },
  closeActivity() { this.setData({ selectedActivity: null }); },
  onBackPress() {
    if (this.data.selectedActivity) { this.closeActivity(); return true; }
    if (this.data.childPickerOpen) { this.closeChildPicker(); return true; }
    if (this.data.detail !== 'home') { this.closeDetail(); return true; }
    return false;
  },
  noop() {},
  refresh() {
    const scope = guardianScope();
    if (!scope || scope.student.id !== this.data.studentId) return;
    const { student } = scope;
    const all = queryLearning('30d', student.classId, 'all', student.id, true);
    const child = this.data.period === '30d' ? all : queryLearning('7d', student.classId, 'all', student.id, true);
    const weekly = queryLearning('7d', student.classId, 'all', student.id, true);
    const mistakes = reportMistakes(all, this.data.day);
    const timeline = timelineRows(child);
    const subjects = reportSubjects(child);
    this.setData({
      today: timelineRows(learningOnDay(all, this.data.day)), mistakes, corrected: mistakes.filter(row => row.correction).length,
      subjects, timeline: this.data.subject === 'all' ? timeline : timeline.filter(row => row.subject === this.data.subject),
      childDays: new Set(child.activities.map(row => row.day)).size, activities: child.activities.length, subjectCount: subjects.length,
      week: reportWeeklyComparison(weekly), weekActivities: weekly.activities.length,
    });
  },
  openHomework() { wx.redirectTo({ url: '/pages/guardian/homework/index' }); },
});
