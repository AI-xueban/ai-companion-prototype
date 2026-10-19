import { hasRole } from '../../../permissions/access';
import { getSession, linkedGuardianStudents, selectGuardianStudent } from '../../../stores/session';
import { activityEvidence, featureRows, getStudentLearning, learningOnDay, queryLearning, subjectRows, timelineRows } from '../../../services/learningMock';
import { getDemoStudent, reportDate, REPORT_END } from '../../../services/schoolDemoRoster';

type ParentPeriod = 'day' | '7d' | '30d';

Page({
  data: {
    period: 'day' as ParentPeriod, day: 0,
    dayOptions: Array.from({ length: 7 }, (_, day) => ({ day, label: day === 0 ? '今日' : reportDate(day).slice(5) })),
    studentId: '', studentName: '', className: '', dateLabel: '',
    children: [] as Array<{ id: string; name: string; className: string; selected: boolean }>, childPickerOpen: false,
    used: false, learned: false, minutes: 0, days: 0, firstCount: 0, firstWrong: 0,
    subjects: [] as ReturnType<typeof subjectRows>,
    timeline: [] as ReturnType<typeof timelineRows>, visibleTimeline: [] as ReturnType<typeof timelineRows>, summaryLine: '', showAllTimeline: false, featureOpen: false,
    selectedActivity: null as ReturnType<typeof activityEvidence>,
    chatCount: 0, solveCount: 0, solveProblems: 0, solveQuestions: 0,
  },
  onShow() {
    const session = getSession();
    const studentId = session?.profile.activeStudentId || '';
    const student = getDemoStudent(studentId);
    const linked = linkedGuardianStudents(session?.profile);
    if (!hasRole(session?.profile, 'guardian') || !session?.expiresAt || session.expiresAt <= Date.now() || !student || !linked.some(child => child.id === studentId)) {
      wx.reLaunch({ url: '/pages/auth/login/index' }); return;
    }
    this.setData({ studentId, studentName: student.name, className: student.className, children: linked.map(child => ({ id: child.id, name: child.name, className: child.className, selected: child.id === studentId })), childPickerOpen: false });
    this.refresh();
  },
  toggleChildPicker() { if (this.data.children.length > 1) this.setData({ childPickerOpen: !this.data.childPickerOpen }); },
  changeChild(event: WechatMiniprogram.BaseEvent) {
    const studentId = String(event.currentTarget.dataset.id);
    if (!selectGuardianStudent(studentId)) return;
    const student = getDemoStudent(studentId);
    if (!student) return;
    this.setData({ studentId, studentName: student.name, className: student.className, childPickerOpen: false, children: this.data.children.map(child => ({ ...child, selected: child.id === studentId })), subjects: [], timeline: [], selectedActivity: null, showAllTimeline: false, featureOpen: false });
    this.refresh();
  },
  changePeriod(event: WechatMiniprogram.BaseEvent) {
    const period = event.currentTarget.dataset.period as ParentPeriod;
    if (period !== 'day' && period !== '7d' && period !== '30d') return;
    this.setData({ period, selectedActivity: null, showAllTimeline: false });
    this.refresh();
  },
  changeDay(event: WechatMiniprogram.BaseEvent) {
    const day = Number(event.currentTarget.dataset.day);
    if (!Number.isInteger(day) || day < 0 || day > 6) return;
    this.setData({ period: 'day', day, selectedActivity: null, showAllTimeline: false });
    this.refresh();
  },
  openActivity(event: WechatMiniprogram.BaseEvent) {
    const student = getDemoStudent(this.data.studentId);
    if (!student) return;
    const report = queryLearning(this.data.period === '30d' ? '30d' : '7d', student.classId, 'all', student.id);
    const data = this.data.period === 'day' ? learningOnDay(report, this.data.day) : report;
    this.setData({ selectedActivity: activityEvidence(data, String(event.currentTarget.dataset.id)) });
  },
  closeActivity() { this.setData({ selectedActivity: null }); },
  toggleTimeline() { this.setData({ showAllTimeline: !this.data.showAllTimeline, visibleTimeline: this.data.showAllTimeline ? this.data.timeline.slice(0, 3) : this.data.timeline }); },
  toggleFeatures() { this.setData({ featureOpen: !this.data.featureOpen }); },
  noop() {},
  refresh() {
    const student = getDemoStudent(this.data.studentId);
    if (!student) return;
    const report = queryLearning(this.data.period === '30d' ? '30d' : '7d', student.classId, 'all', student.id);
    const data = this.data.period === 'day' ? learningOnDay(report, this.data.day) : report;
    const summary = getStudentLearning(data, student.id);
    const features = featureRows(data);
    const chat = features.find(row => row.name === '小晤问答');
    const solve = features.find(row => row.name === 'AI解题');
    const allRows = timelineRows(data);
    const rows = allRows.slice(0, 12);
    const periodLabel = this.data.period === 'day' ? this.data.day === 0 ? '今天' : reportDate(this.data.day) : this.data.period === '7d' ? '近 7 天' : '近 30 天';
    const summaryLine = summary.learned ? `${periodLabel}有 ${allRows.length} 条学习活动，累计 ${summary.minutes} 分钟；首次作答 ${summary.firstCount} 题次，其中首次答错 ${summary.firstWrong} 题次。` : summary.used ? `${periodLabel}暂无学伴学习活动，有应用使用记录。` : `${periodLabel}暂无学伴学习活动记录。`;
    this.setData({
      dateLabel: `${this.data.period === 'day' ? reportDate(this.data.day) : `统计截至 ${REPORT_END}`} · 模拟数据`,
      used: summary.used, learned: summary.learned, minutes: summary.minutes, days: summary.days,
      firstCount: summary.firstCount, firstWrong: summary.firstWrong,
      subjects: subjectRows(data), timeline: rows, visibleTimeline: this.data.showAllTimeline ? rows : rows.slice(0, 3), summaryLine,
      chatCount: chat?.count || 0,
      solveCount: solve?.count || 0, solveProblems: solve?.problems || 0, solveQuestions: solve?.questions || 0,
    });
  },
  openHomework() { wx.redirectTo({ url: '/pages/guardian/homework/index' }); },
});
