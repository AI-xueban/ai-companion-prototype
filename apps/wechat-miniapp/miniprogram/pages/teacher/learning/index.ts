import { getSession } from '../../../stores/session';
import { activityEvidence, featureRows, getLearningQuestion, getStudentLearning, knowledgeRows, pct, subjectRows, timelineRows } from '../../../services/learningMock';
import type { LearningPeriod } from '../../../services/learningMock';
import { DEMO_CLASSES, getDemoStudent, REPORT_END, SCHOOL_NAME } from '../../../services/schoolDemoRoster';
import { availableWorkViews, queryWorkLearning, scopeClassIds, scopeTitle, selectWorkClass, selectWorkGrade, selectWorkPeriod, selectWorkView, workScope, workViewLabel } from '../../../services/workbenchScope';
import type { WorkScope, WorkView } from '../../../services/workbenchScope';

type LearningTab = 'overview' | 'students' | 'questions' | 'time';
const TABS: LearningTab[] = ['overview', 'students', 'questions', 'time'];

Page({
  data: {
    scope: { view: 'school', period: '7d', grade: 'all', classId: 'all' } as WorkScope,
    tab: 'overview' as LearningTab, asOf: REPORT_END, schoolName: SCHOOL_NAME, title: '', viewLabel: '', scopeLabel: '', filterSummary: '', filtersOpen: false,
    greetingName: '', teacherDesignation: '', views: [] as Array<{ id: WorkView; label: string; selected: boolean }>, switchableViews: [] as Array<{ id: WorkView; label: string }>, roleMenuOpen: false,
    classes: [] as Array<{ id: string; name: string; selected: boolean }>, selectedStudentId: '', selectedStudentName: '', selectedKnowledge: '',
    rankingBy: 'people' as 'people' | 'count', enrolled: 0, used: 0, learned: 0, coverage: 0, minutes: 0, average: 0,
    answeredStudents: 0, firstQuestions: 0, wrongPeople: 0,
    subjects: [] as ReturnType<typeof subjectRows>, knowledge: [] as ReturnType<typeof knowledgeRows>,
    students: [] as Array<ReturnType<typeof getStudentLearning> & { name: string; className: string }>, ranking: [] as ReturnType<typeof featureRows>,
    selectedTimeline: [] as ReturnType<typeof timelineRows>, selectedSummary: null as ReturnType<typeof getStudentLearning> | null,
    timeRows: [] as Array<ReturnType<typeof timelineRows>[number] & { studentName: string; className: string }>, timeDays: 0,
    questionEvidence: [] as Array<{ id: string; label: string; answered: number; wrong: number }>,
    selectedQuestion: null as null | { stem: string; reference: string; scoring: string; version: string; rows: Array<{ studentId: string; name: string; answer: string; result: string; correction: string }> },
    selectedActivity: null as ReturnType<typeof activityEvidence>,
    classComparisons: [] as Array<{ id: string; name: string; learned: number; enrolled: number; coverage: number }>,
    attentionStudents: [] as Array<{ studentId: string; name: string; used: boolean }>,
    focusKnowledge: [] as ReturnType<typeof knowledgeRows>,
  },
  onLoad(options: { tab?: LearningTab }) { if (TABS.includes(options.tab as LearningTab)) this.setData({ tab: options.tab }); },
  onShow() {
    const session = getSession();
    if (!session?.profile || !session.expiresAt || session.expiresAt <= Date.now() || !availableWorkViews(session.profile).length) { wx.reLaunch({ url: '/pages/auth/login/index' }); return; }
    const profile = session.profile;
    const authorized = availableWorkViews(profile);
    const displayName = profile.displayName || '老师';
    const greetingName = displayName.endsWith('老师') ? displayName : `${displayName}老师`;
    const teacherDesignation = profile.professionalTitles?.filter(Boolean).join('、') || (authorized.includes('homeroom') ? '班主任' : authorized.includes('subject') ? '任课老师' : '学校管理员');
    this.setData({ scope: workScope(profile), greetingName, teacherDesignation, views: authorized.map(id => ({ id, label: workViewLabel(id), selected: false })), roleMenuOpen: false, selectedStudentId: '', selectedKnowledge: '', selectedQuestion: null, selectedActivity: null });
    this.refresh();
  },
  toggleRoleMenu() { if (this.data.views.length > 1) this.setData({ roleMenuOpen: !this.data.roleMenuOpen }); },
  closeRoleMenu() { this.setData({ roleMenuOpen: false }); },
  changeView(event: WechatMiniprogram.BaseEvent) {
    const profile = getSession()?.profile;
    const view = event.currentTarget.dataset.view as WorkView;
    if (!profile || !availableWorkViews(profile).includes(view)) return;
    this.setData({ scope: selectWorkView(profile, view), tab: 'overview', roleMenuOpen: false, filtersOpen: false, selectedStudentId: '', selectedKnowledge: '', selectedQuestion: null, selectedActivity: null });
    this.refresh();
  },
  changeClass(event: WechatMiniprogram.BaseEvent) {
    const profile = getSession()?.profile;
    if (!profile) return;
    this.setData({ scope: selectWorkClass(profile, String(event.currentTarget.dataset.id)), selectedStudentId: '', selectedKnowledge: '', selectedQuestion: null, selectedActivity: null }); this.refresh();
  },
  changeGrade(event: WechatMiniprogram.BaseEvent) {
    const profile = getSession()?.profile;
    if (!profile) return;
    const grade = event.currentTarget.dataset.grade;
    this.setData({ scope: selectWorkGrade(profile, grade === 'all' ? 'all' : Number(grade) as 7 | 8), selectedStudentId: '', selectedKnowledge: '', selectedQuestion: null, selectedActivity: null }); this.refresh();
  },
  changePeriod(event: WechatMiniprogram.BaseEvent) {
    const profile = getSession()?.profile;
    if (!profile) return;
    this.setData({ scope: selectWorkPeriod(profile, event.currentTarget.dataset.period as LearningPeriod), selectedStudentId: '', selectedKnowledge: '', selectedQuestion: null, selectedActivity: null }); this.refresh();
  },
  toggleFilters() { this.setData({ filtersOpen: !this.data.filtersOpen }); },
  changeTab(event: WechatMiniprogram.BaseEvent) { const tab = event.currentTarget.dataset.tab as LearningTab; if (TABS.includes(tab)) this.setData({ tab, selectedStudentId: '', selectedKnowledge: '', selectedQuestion: null, selectedActivity: null }); },
  changeRanking(event: WechatMiniprogram.BaseEvent) { const rankingBy = event.currentTarget.dataset.by as 'people' | 'count'; if (rankingBy === 'people' || rankingBy === 'count') { this.setData({ rankingBy }); this.refresh(); } },
  openHomework() { if (!this.data.selectedStudentId) wx.redirectTo({ url: '/pages/teacher/homework/index' }); },
  refresh() {
    const scope = this.data.scope;
    const report = queryWorkLearning(scope);
    const first = report.answers.filter(row => row.kind === '首次');
    const ranking = featureRows(report).sort((a, b) => b[this.data.rankingBy] - a[this.data.rankingBy] || a.name.localeCompare(b.name, 'zh-CN'));
    const classes = DEMO_CLASSES.filter(row => scope.view === 'school' ? scope.grade === 'all' || row.grade === scope.grade : scope.view === 'homeroom' ? row.id === 'c1' : row.id === 'c1' || row.id === 'c2');
    const studentRows = report.roster.map(student => ({ ...getStudentLearning(report, student.id), name: student.name, className: student.className }));
    const classComparisons = scope.view === 'school' && scope.classId === 'all' ? classes.map(row => {
      const classmates = studentRows.filter(student => report.roster.find(person => person.id === student.studentId)?.classId === row.id);
      return { id: row.id, name: row.name, learned: classmates.filter(student => student.learned).length, enrolled: classmates.length, coverage: pct(classmates.filter(student => student.learned).length, classmates.length) };
    }).sort((a, b) => a.coverage - b.coverage) : [];
    this.setData({
      title: scope.view === 'school' ? '学校学情' : scope.view === 'homeroom' ? '班级学情' : '学科学情', viewLabel: workViewLabel(scope.view), views: this.data.views.map(item => ({ ...item, selected: item.id === scope.view })), switchableViews: this.data.views.filter(item => item.id !== scope.view).map(({ id, label }) => ({ id, label })), scopeLabel: `${scopeTitle(scope)} · ${scope.view === 'subject' ? '数学' : '全科'}`,
      filterSummary: scope.view === 'school' ? scope.classId === 'all' ? scope.grade === 'all' ? '全校' : scope.grade + '年级' : scopeTitle(scope) : scope.view === 'subject' ? `${scopeTitle(scope)} · 数学` : scopeTitle(scope),
      classes: classes.map(row => ({ id: row.id, name: row.name, selected: row.id === scope.classId })),
      enrolled: report.roster.length, used: report.usedIds.size, learned: report.learnedIds.size, coverage: pct(report.learnedIds.size, report.roster.length),
      minutes: report.minutes, average: report.learnedIds.size ? Math.round(report.minutes / report.learnedIds.size) : 0,
      answeredStudents: new Set(first.map(row => row.studentId)).size, firstQuestions: first.length, wrongPeople: new Set(first.filter(row => !row.correct).map(row => row.studentId)).size,
      subjects: subjectRows(report), knowledge: knowledgeRows(report), focusKnowledge: knowledgeRows(report).slice(0, 3), ranking,
      students: studentRows, classComparisons,
      timeRows: timelineRows(report).map(row => ({ ...row, studentName: report.roster.find(student => student.id === row.studentId)?.name || '学生', className: report.roster.find(student => student.id === row.studentId)?.className || '' })),
      timeDays: new Set(report.activities.map(row => row.day)).size,
      attentionStudents: scope.view === 'homeroom' ? studentRows.filter(student => !student.learned).slice(0, 4).map(student => ({ studentId: student.studentId, name: student.name, used: student.used })) : [],
    });
  },
  openStudent(event: WechatMiniprogram.BaseEvent) {
    const studentId = String(event.currentTarget.dataset.id);
    const student = getDemoStudent(studentId);
    if (!student || !scopeClassIds(this.data.scope).includes(student.classId)) return;
    const report = queryWorkLearning(this.data.scope, studentId);
    this.setData({ selectedStudentId: studentId, selectedStudentName: student.name, selectedSummary: getStudentLearning(report, studentId), selectedTimeline: timelineRows(report).slice(0, 20), selectedQuestion: null, selectedActivity: null });
  },
  closeStudent() { this.setData({ selectedStudentId: '', selectedTimeline: [], selectedSummary: null, selectedActivity: null }); },
  openActivity(event: WechatMiniprogram.BaseEvent) {
    if (!this.data.selectedStudentId) return;
    const report = queryWorkLearning(this.data.scope, this.data.selectedStudentId);
    this.setData({ selectedActivity: activityEvidence(report, String(event.currentTarget.dataset.id)) });
  },
  closeActivity() { this.setData({ selectedActivity: null }); },
  openQuestion(event: WechatMiniprogram.BaseEvent) {
    const id = String(event.currentTarget.dataset.id);
    const report = queryWorkLearning(this.data.scope);
    const question = getLearningQuestion(id);
    if (!question) return;
    const first = report.answers.filter(row => row.questionId === id && row.kind === '首次');
    if (!first.length) return;
    this.setData({ selectedQuestion: {
      stem: question.stem, reference: question.answer, scoring: question.scoring, version: question.version,
      rows: first.map(row => {
        const student = report.roster.find(item => item.id === row.studentId);
        const correction = report.answers.find(item => item.questionId === id && item.studentId === row.studentId && item.kind === '订正');
        return { studentId: row.studentId, name: student?.name || '学生', answer: row.correct ? question.answer : question.wrong, result: row.correct ? '正确' : '错误', correction: correction ? `已订正 · ${correction.correct ? '本次答对' : '本次仍错'}` : '暂无订正记录' };
      }),
    } });
  },
  closeQuestion() { this.setData({ selectedQuestion: null }); },
  noop() {},
  openKnowledge(event: WechatMiniprogram.BaseEvent) {
    const key = String(event.currentTarget.dataset.key);
    const report = queryWorkLearning(this.data.scope);
    const answers = report.answers.filter(row => row.kind === '首次' && `${row.subject}:${row.knowledge}` === key);
    const questionEvidence = [...new Set(answers.map(row => row.questionId))].map(id => {
      const rows = answers.filter(row => row.questionId === id);
      return { id, label: getLearningQuestion(id)?.stem || '原题暂缺', answered: new Set(rows.map(row => row.studentId)).size, wrong: new Set(rows.filter(row => !row.correct).map(row => row.studentId)).size };
    });
    this.setData({ selectedKnowledge: key === this.data.selectedKnowledge ? '' : key, questionEvidence });
  },
  openFocusKnowledge(event: WechatMiniprogram.BaseEvent) { this.setData({ selectedKnowledge: '' }); this.openKnowledge(event); this.setData({ tab: 'questions' }); },
});
