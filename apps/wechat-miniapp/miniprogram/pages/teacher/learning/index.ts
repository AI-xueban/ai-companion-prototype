import { getSession } from '../../../stores/session';
import { correctionPage, correctionSource, correctionPersonalView } from '../../../services/correctionLearning';
import type { CorrectionPage, CorrectionRoute } from '../../../services/correctionLearning';
import { historyDays, subjectLearningHome, subjectLearningPage } from './subjectIssues';
import type { SubjectRoute } from './subjectIssues';
import { withSubjectMaterialData, personalLearningRange, personalLearningReport, personalLearningView, subjectStudentCounts, subjectAnswerQuestions, activityEvidence, featureRows, getLearningQuestion, getStudentLearning, knowledgeRows, learningReportDays, pct, reportSubjects, reportWeeklyComparison, subjectRows, timelineRows } from '../../../services/learningMock';
import type { MaterialQuestion, LearningPeriod, PersonalLearningRange, PersonalQuestionFilter } from '../../../services/learningMock';
import { DEMO_CLASSES, REPORT_END, SCHOOL_NAME } from '../../../services/schoolDemoRoster';
import { availableWorkViews, queryWorkLearning, scopeTitle, selectWorkClass, selectWorkGrade, selectWorkPeriod, selectWorkView, workLearningSubject, workScope, workViewLabel } from '../../../services/workbenchScope';
import type { WorkScope, WorkView } from '../../../services/workbenchScope';
import { teacherAssignments } from '../../../services/workbenchScope';
import type { SessionProfile } from '../../../types/identity';

type LearningTab = 'overview' | 'students' | 'questions' | 'time' | 'week';
const TABS: LearningTab[] = ['overview', 'students', 'questions', 'time', 'week'];
type Comparison = NonNullable<ReturnType<typeof reportWeeklyComparison>>;
type LearningScope = WorkScope & { learningSubject?: string };

function learningClasses(profile: SessionProfile) {
  const assigned = new Set(teacherAssignments(profile).flatMap(row => row.classIds));
  return DEMO_CLASSES.filter(row => assigned.has(row.id));
}
function learningSubjects(profile: SessionProfile, classId: string) {
  return [...new Set(teacherAssignments(profile).filter(row => row.classIds.includes(classId)).map(row => row.subject))];
}
function learningScope(profile: SessionProfile, scope: LearningScope): LearningScope {
  if (scope.view !== 'subject') return scope;
  const classes = learningClasses(profile);
  const classId = (classes.find(row => row.id === scope.classId) ?? classes[0])?.id ?? '';
  const subjects = learningSubjects(profile, classId);
  const preferred = scope.learningSubject || workLearningSubject({ ...scope, classId }, profile);
  return { ...scope, classId, learningSubject: subjects.includes(preferred) ? preferred : subjects[0] ?? '', period: scope.period === '1d' ? '1d' : '7d' };
}

function scopedReport(scope: LearningScope, studentId = 'all') {
  const session = getSession();
  if (!session?.profile || !session.expiresAt || session.expiresAt <= Date.now() || !availableWorkViews(session.profile).includes(scope.view)) return null;
  const report = queryWorkLearning(scope, studentId, session.profile, scope.view !== 'school');
  return scope.view === 'subject' ? withSubjectMaterialData(report, workLearningSubject(scope,session.profile), scope.period) : report;
}

Page({
  correctionTrail: [] as {route:CorrectionRoute|null;scroll:number}[],
  learningOwner: '',
  savedLearningScopes: {} as Partial<Record<WorkView, LearningScope>>,
  scrollTop: 0,
  subjectScrollTrail: [] as number[],
  studentOriginScroll: 0,
  rosterOriginScroll: 0,
  onPageScroll(event: WechatMiniprogram.Page.IPageScrollOption) {
    this.scrollTop = event.scrollTop;
    if(this.data.subjectPage?.material?.question&&!this.data.selectedStudentId&&this.data.materialCompact!==(event.scrollTop>230))this.setData({materialCompact:event.scrollTop>230});
    if (this.data.scope.view === 'subject' && this.data.selectedStudentId && this.data.personalCompact !== (event.scrollTop > 230)) this.setData({ personalCompact: event.scrollTop > 230 });
  },
  data: {
    correctionPage: null as CorrectionPage|null, correctionRoute:null as CorrectionRoute|null, correctionLegacy:false,correctionScopeNames:[] as string[],
    scope: { view: 'school', period: '7d', grade: 'all', classId: 'all' } as LearningScope,
    tab: 'overview' as LearningTab, asOf: REPORT_END, schoolName: SCHOOL_NAME, title: '', viewLabel: '', scopeLabel: '', filterSummary: '', filtersOpen: false,
    greetingName: '', teacherDesignation: '', views: [] as Array<{ id: WorkView; label: string; selected: boolean }>, switchableViews: [] as Array<{ id: WorkView; label: string }>, roleMenuOpen: false,
    classes: [] as Array<{ id: string; name: string; selected: boolean }>, selectedStudentId: '', selectedStudentName: '', selectedKnowledge: '',
    rankingBy: 'people' as 'people' | 'count', enrolled: 0, used: 0, learned: 0, coverage: 0, minutes: 0, average: 0,
    answeredStudents: 0, firstQuestions: 0, wrongPeople: 0,
    subjects: [] as ReturnType<typeof subjectRows>, knowledge: [] as ReturnType<typeof knowledgeRows>,
    rosterFilter: 'all', rosterStagePeriod: '' as '' | LearningPeriod, rosterFromStage: false,
    questionSearch: '', questionFilter: 'all', questionFilterIndex: 0, questionCollapsed: false, expandedStudentId: '', correctionHistoryId: '', personalQuestionId: '',
    questionStudents: [] as Array<ReturnType<typeof subjectAnswerQuestions>[number]['students'][number] & {pendingAttempts?: MaterialQuestion['allStudents'][number]['pendingAttempts']}>,
    materialResult: 'wrong', materialCompact: false,
    selectedCounts: null as ReturnType<typeof subjectStudentCounts> | null,
    rosterName: '', visibleStudents: [] as Array<ReturnType<typeof getStudentLearning> & { name: string; className: string; counts: ReturnType<typeof subjectStudentCounts> }>, rosterFrom: 'overview' as 'overview' | 'week',
    homeroomSubjects: [] as ReturnType<typeof reportSubjects>, weekSubjects: [] as ReturnType<typeof reportSubjects>,
    weekLearned: 0, periodStart: REPORT_END,
    students: [] as Array<ReturnType<typeof getStudentLearning> & { name: string; className: string; counts: ReturnType<typeof subjectStudentCounts> }>, ranking: [] as ReturnType<typeof featureRows>,
    selectedTimeline: [] as ReturnType<typeof timelineRows>, selectedSummary: null as ReturnType<typeof getStudentLearning> | null,
    timeRows: [] as Array<ReturnType<typeof timelineRows>[number] & { studentName: string; className: string }>, timeDays: 0,
    questionEvidence: [] as Array<{ id: string; label: string; answered: number; wrong: number }>,
    selectedQuestion: null as null | { title: string; stem: string; reference: string; scoring: string; version: string; rows: Array<{ studentId: string; name: string; answer: string; result: string; correction: string }> },
    selectedActivity: null as ReturnType<typeof activityEvidence>,
    classComparisons: [] as Array<{ id: string; name: string; learned: number; enrolled: number; coverage: number }>,
    dates: learningReportDays,
    subjectClassName: '', subjectClassCount: 0, previousClassId: '', nextClassId: '', subjectOptions: [] as string[], subjectIndex: 0,
    subjectHome: null as ReturnType<typeof subjectLearningHome> | null, subjectRangeOptions: historyDays,
    subjectTrail: [] as SubjectRoute[], subjectRoute: null as SubjectRoute | null, subjectPage: null as ReturnType<typeof subjectLearningPage>,
    week: null as ReturnType<typeof reportWeeklyComparison>, weekActivities: 0, weekDetails: false, followup: false,
    selectedPair: null as Comparison['pairs'][number] | null,
    personalRange: null as PersonalLearningRange | null, personalView: null as ReturnType<typeof correctionPersonalView> | null,
    personalFilter: 'all' as PersonalQuestionFilter, personalTopic: 'all', personalTopicIndex: 0,
    personalDatesOpen: false, personalDraftStart: '', personalDraftEnd: '', personalDateError: '',
    personalCompact: false, personalNavHeight: 64, personalBottomSpace: 20, personalActivitiesOpen: false, personalClassName: '', personalInitial: '',
    personalModes: [{id:'7d',label:'近7天'},{id:'30d',label:'近30天'},{id:'term',label:'本学期'},{id:'custom',label:'自选日期'}],
    personalFilters: [{id:'all',label:'全部'},{id:'correct',label:'答对'},{id:'wrong',label:'答错'},{id:'corrected',label:'有订正'}],
    studentPeriod: '30d' as LearningPeriod, studentSubjects: [] as ReturnType<typeof reportSubjects>,
    studentWeek: null as ReturnType<typeof reportWeeklyComparison>,
    recordedClasses: 0, schoolActivitySources: [] as Array<{name: string; count: number}>,
    schoolDetail: false,
  },
  onLoad(options: { tab?: LearningTab }) {
    if (TABS.includes(options.tab as LearningTab)) this.setData({ tab: options.tab });
    const info = wx.getWindowInfo(), capsule = wx.getMenuButtonBoundingClientRect();
    const statusHeight = info.statusBarHeight || 20;
    const barHeight = capsule.height > 0 ? Math.max(44, (capsule.top - statusHeight) * 2 + capsule.height) : 44;
    this.setData({ personalNavHeight: statusHeight + barHeight });
  },
  onShow() {
    const session = getSession();
    if (!session?.profile || !session.expiresAt || session.expiresAt <= Date.now() || !availableWorkViews(session.profile).length) { wx.reLaunch({ url: '/pages/auth/login/index' }); return; }
    const profile = session.profile;
    const authorized = availableWorkViews(profile);
    const displayName = profile.displayName || '老师';
    const greetingName = displayName.endsWith('老师') ? displayName : `${displayName}老师`;
    const teacherDesignation = profile.professionalTitles?.filter(Boolean).join('、') || (authorized.includes('homeroom') ? '班主任' : authorized.includes('subject') ? '任课老师' : '学校管理员');
    const sameOwner = this.learningOwner === profile.userId;
    if (!sameOwner) this.savedLearningScopes = {};
    const previous = this.data.scope;
    const scope = learningScope(profile, sameOwner && authorized.includes(previous.view) ? previous : workScope(profile));
    const sameScope = sameOwner && scope.view === previous.view && scope.classId === previous.classId && scope.learningSubject === previous.learningSubject;
    this.learningOwner = profile.userId;
    if (sameScope) {
      this.setData({ scope, greetingName, teacherDesignation, views: authorized.map(id => ({ id, label: workViewLabel(id), selected: false })) });
      this.refresh();
      if (this.data.subjectRoute) {
        const report = scopedReport({ ...scope, period: '30d' });
        const subjectPage = report && subjectLearningPage(report, this.data.subjectRoute);
        if (subjectPage) this.setData({ subjectPage });
        else this.returnToModuleHome();
      }
      if (this.data.selectedStudentId) {
        if (scope.view === 'subject' && this.data.personalRange) this.refreshPersonalView();
        else this.showStudent(this.data.selectedStudentId, this.data.studentPeriod);
      }
      return;
    }
    const tab = (scope.view === 'school') || (scope.view === 'homeroom' && this.data.tab !== 'week') || (scope.view === 'subject' && this.data.tab === 'week') ? 'overview' : this.data.tab;
    this.setData({ scope, tab, rosterStagePeriod:'',rosterFromStage:false,rosterFilter:'all',subjectTrail: [], subjectRoute: null, subjectPage: null, rosterName: '', rosterFrom: 'overview', greetingName, teacherDesignation, views: authorized.map(id => ({ id, label: workViewLabel(id), selected: false })), roleMenuOpen: false, selectedStudentId: '', selectedKnowledge: '', selectedQuestion: null, selectedActivity: null, followup: false, selectedPair: null, weekDetails: false });
    this.refresh();
  },
  toggleRoleMenu() { if (this.data.views.length > 1) this.setData({ roleMenuOpen: !this.data.roleMenuOpen }); },
  closeRoleMenu() { this.setData({ roleMenuOpen: false }); },
  changeView(event: WechatMiniprogram.BaseEvent) {
    const profile = getSession()?.profile;
    const view = event.currentTarget.dataset.view as WorkView;
    if (!profile || !availableWorkViews(profile).includes(view)) return;
    this.correctionTrail=[];this.setData({correctionRoute:null,correctionLegacy:false});
    this.savedLearningScopes[this.data.scope.view] = { ...this.data.scope };
    const initial = selectWorkView(profile, view);
    const scope = learningScope(profile, this.savedLearningScopes[view] ?? initial);
    if (view !== 'subject') {
      selectWorkGrade(profile, scope.grade);
      selectWorkPeriod(profile, scope.period);
      selectWorkClass(profile, scope.classId);
    }
    this.setData({ scope, tab: 'overview', rosterStagePeriod:'',rosterFromStage:false,rosterFilter:'all',subjectTrail: [], subjectRoute: null, subjectPage: null, rosterName: '', rosterFrom: 'overview', roleMenuOpen: false, filtersOpen: false, selectedStudentId: '', selectedKnowledge: '', selectedQuestion: null, selectedActivity: null });
    this.refresh();
  },
  changeLearningSubject(event: WechatMiniprogram.CustomEvent<{ value: string }>) {
    const profile = getSession()?.profile;
    const { scope, tab, subjectRoute, selectedStudentId, subjectOptions } = this.data;
    const learningSubject = subjectOptions[Number(event.detail.value)] || '';
    if (!profile || scope.view !== 'subject' || tab !== 'overview' || subjectRoute || selectedStudentId ||
      learningSubject === scope.learningSubject || !subjectOptions.includes(learningSubject)) return;
    this.setData({
      scope: learningScope(profile, { ...scope, learningSubject }),
      rosterName: '', roleMenuOpen: false, filtersOpen: false,
    });
    this.refresh();
  },
  moveSubjectClass(event: WechatMiniprogram.BaseEvent) {
    this.selectSubjectClass(String(event.currentTarget.dataset.id || ''));
  },
  selectSubjectClass(classId: string) {
    const profile = getSession()?.profile;
    const { scope, tab, selectedStudentId, subjectRoute } = this.data;
    if (!profile || scope.view !== 'subject' || tab !== 'overview' || selectedStudentId || subjectRoute ||
      classId === scope.classId || !learningClasses(profile).some(item => item.id === classId)) return;
    this.setData({
      scope: learningScope(profile, { ...scope, classId }),
      rosterName: '', roleMenuOpen: false, filtersOpen: false,
    });
    this.refresh();
  },
  changeSubjectHomePeriod(event: WechatMiniprogram.BaseEvent) {
    const period = event.currentTarget.dataset.period;
    if (this.data.scope.view !== 'subject' || this.data.tab !== 'overview' || this.data.subjectRoute || this.data.selectedStudentId || (period !== '1d' && period !== '7d')) return;
    this.setData({ scope: { ...this.data.scope, period } });
    this.refresh();
  },
  changeClass(event: WechatMiniprogram.BaseEvent) {
    const profile = getSession()?.profile;
    if (!profile) return;
    const classId = String(event.currentTarget.dataset.id);
    const current = this.data.scope;
    if (current.view === 'subject' && !learningClasses(profile).some(row => row.id === classId)) return;
    const scope = current.view === 'subject' ? learningScope(profile, { ...current, classId }) : selectWorkClass(profile, classId);
    this.setData({ scope, subjectTrail: [], subjectRoute: null, subjectPage: null, selectedStudentId: '', selectedKnowledge: '', selectedQuestion: null, selectedActivity: null });
    this.refresh();
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
  openClassRoster() {
    const rosterFrom = this.data.tab === 'week' ? 'week' : 'overview';
    this.setData({ tab: 'students', rosterFrom, rosterName: '' });
    this.refresh();
  },
  openSubjectReviewFollowup() { this.showSubjectRoute({ kind: 'review-followup' }); },
  openSubjectRoute(event: WechatMiniprogram.BaseEvent) {
    const route = event.currentTarget.dataset.route as SubjectRoute | undefined;
    if (route) this.showSubjectRoute(route);
  },
  changeSubjectIssuePeriod(event: WechatMiniprogram.BaseEvent) {
    const route = this.data.subjectRoute;
    const days = Number(event.currentTarget.dataset.days);
    if (route && (route.kind === 'history' || route.kind === 'review') && historyDays.includes(days)) {
      this.showSubjectRoute({ ...route, days }, true);
    }
  },
  changeSubjectIssueDate(event: WechatMiniprogram.CustomEvent<{ value: string }>) {
    const route = this.data.subjectRoute;
    const next = this.data.subjectPage?.dateOptions?.[Number(event.detail.value)];
    if (route?.kind === 'day' && next) this.showSubjectRoute({ ...route, day: next.day }, true);
  },
  changeSubjectIssueMode(event: WechatMiniprogram.BaseEvent) {
    const route = this.data.subjectRoute;
    if (route?.kind === 'day') this.showSubjectRoute({ ...route, byQuestion: event.currentTarget.dataset.mode === 'question' }, true);
  },
  showSubjectRoute(route: SubjectRoute, replace = false) {
    if (this.data.scope.view !== 'subject') return;
    const report = scopedReport({ ...this.data.scope, period: '30d' });
    const page = report && subjectLearningPage(report, route);
    if (!page) return;
    const trail = this.data.subjectTrail;
    if (!replace) this.subjectScrollTrail = [...this.subjectScrollTrail.slice(0, trail.length), this.scrollTop];
    this.setData({
      subjectTrail: [...(replace ? trail.slice(0, -1) : trail), route],
      subjectRoute: route, subjectPage: page, questionStudents: page.material?.question?.allStudents || page.problem?.students || [], materialResult: page.material?.question?.wrongPeople ? 'wrong' : page.material?.question?.people ? 'correct' : 'pending', materialCompact:false, questionSearch: '', questionFilter: 'all', questionFilterIndex: 0, questionCollapsed: false, expandedStudentId: '', correctionHistoryId: '', filtersOpen: false, roleMenuOpen: false,
    }, () => { this.filterQuestionRows(); if (!replace) wx.pageScrollTo({ scrollTop: 0, duration: 0 }); });
  },
  backFromSubjectIssue() {
    const trail = this.data.subjectTrail.slice(0, -1);
    const route = trail[trail.length - 1];
    const report = route && scopedReport({ ...this.data.scope, period: '30d' });
    const position = this.subjectScrollTrail[trail.length] ?? 0;
    this.subjectScrollTrail = this.subjectScrollTrail.slice(0, trail.length);
    if(!route)this.setData({correctionLegacy:false});
    this.setData({ subjectTrail: trail, subjectRoute: route ?? null, subjectPage: report ? subjectLearningPage(report, route) : null },
      () => wx.pageScrollTo({ scrollTop: position, duration: 0 }));
  },
  searchRoster(event: WechatMiniprogram.CustomEvent<{value: string}>) {
    const rosterName = event.detail.value;
    this.setData({ rosterName }); this.filterStudentRows();
  },
  filterStudentRows() { this.setData({ visibleStudents: this.data.students.filter(row => row.name.includes(this.data.rosterName.trim()) && (this.data.scope.view !== 'subject' || this.data.rosterFilter !== 'wrong' || row.counts.wrongCount > 0)) }); },
  filterRoster(event: WechatMiniprogram.BaseEvent) { const value=event.currentTarget.dataset.filter; if(this.data.scope.view!=='subject'||!['all','wrong'].includes(value))return;this.setData({rosterFilter:value});this.filterStudentRows(); },
  openStageRoster() { const route=this.data.subjectRoute;if(route?.kind!=='review')return;this.rosterOriginScroll=this.scrollTop;this.setData({tab:'students',rosterStagePeriod:(route.days+'d') as LearningPeriod,rosterFromStage:true,subjectRoute:null,subjectPage:null,rosterName:'',rosterFilter:'all'});this.refresh();wx.pageScrollTo({scrollTop:0,duration:0}); },
  toggleSubjectQuestion() { this.setData({questionCollapsed:!this.data.questionCollapsed}); },
  toggleAnswerStudent(event: WechatMiniprogram.BaseEvent) { const id=String(event.currentTarget.dataset.id);this.setData({expandedStudentId:this.data.expandedStudentId===id?'':id,correctionHistoryId:''}); },
  toggleCorrectionHistory(event: WechatMiniprogram.BaseEvent) { const id=String(event.currentTarget.dataset.id);this.setData({correctionHistoryId:this.data.correctionHistoryId===id?'':id}); },
  togglePersonalQuestion(event: WechatMiniprogram.BaseEvent) { const id=String(event.currentTarget.dataset.id);this.setData({personalQuestionId:this.data.personalQuestionId===id?'':id,correctionHistoryId:''}); },
  searchQuestionStudents(event: WechatMiniprogram.CustomEvent<{value:string}>) { this.setData({questionSearch:event.detail.value});this.filterQuestionRows(); },
  filterQuestionStudents(event: WechatMiniprogram.CustomEvent<{value:string}>) { this.setData({questionFilterIndex:Number(event.detail.value),questionFilter:['all','missing','still','fixed'][Number(event.detail.value)]||'all'});this.filterQuestionRows(); },
  filterQuestionRows() {
    const q=this.data.subjectPage?.material?.question,result=this.data.materialResult;
    this.setData({questionStudents:(q?q.allStudents.filter(s=>result==='all'||result==='wrong'&&s.wrong||result==='correct'&&s.chains.length&&!s.wrong||result==='pending'&&s.pendingAttempts.length):this.data.subjectPage?.problem?.students||[]).filter(row=>row.name.includes(this.data.questionSearch.trim())&&(this.data.questionFilter==='all'||row.status===this.data.questionFilter))});
  },
  changeMaterialResult(event:WechatMiniprogram.BaseEvent){const key=event.currentTarget.dataset.key;if(!['wrong','correct','pending','all'].includes(key))return;this.setData({materialResult:key,questionFilter:'all',questionFilterIndex:0,expandedStudentId:''});this.filterQuestionRows();},
  changeMaterialMode(event:WechatMiniprogram.BaseEvent){const route=this.data.subjectRoute,mode=event.currentTarget.dataset.mode;if(route?.kind==='review'&&['source','knowledge'].includes(mode))this.showSubjectRoute({...route,mode},true);},
  changeMaterialList(event:WechatMiniprogram.BaseEvent){const route=event.currentTarget.dataset.route as SubjectRoute;if(route?.kind==='material-list')this.showSubjectRoute(route,true);},
  materialTop(){wx.pageScrollTo({scrollTop:0,duration:0});},
  changeTab(event: WechatMiniprogram.BaseEvent) {
    const tab = event.currentTarget.dataset.tab as LearningTab;
    if (!TABS.includes(tab) || (this.data.scope.view === 'school' && tab !== 'overview') || (tab === 'week' && this.data.scope.view !== 'homeroom')) return;
    const openSubjectRoster = this.data.scope.view === 'subject' && this.data.tab === 'overview' && tab === 'students';
    if (openSubjectRoster) this.rosterOriginScroll = this.scrollTop;
    this.setData({
      tab, rosterName: '', rosterFilter: 'all', rosterFromStage: false, rosterStagePeriod: '', rosterFrom: 'overview', selectedStudentId: '', selectedKnowledge: '', selectedQuestion: null,
      selectedActivity: null, followup: false, selectedPair: null, weekDetails: false,
    }, () => { if (openSubjectRoster) wx.pageScrollTo({ scrollTop: 0, duration: 0 }); });
    this.refresh();
  },
  changeRanking(event: WechatMiniprogram.BaseEvent) { const rankingBy = event.currentTarget.dataset.by as 'people' | 'count'; if (rankingBy === 'people' || rankingBy === 'count') { this.setData({ rankingBy }); this.refresh(); } },
  openHomework() { if (!this.data.selectedStudentId) wx.redirectTo({ url: '/pages/teacher/homework/index' }); },
  refresh() {
    const scope = this.data.scope;
    const period = this.data.rosterStagePeriod || (scope.view === 'homeroom' && this.data.tab === 'students' && this.data.rosterFrom === 'week' ? '7d' : scope.period);
    const report = scopedReport({ ...scope, period });
    if (!report) return;
    const profile = getSession()?.profile;
    const subject = workLearningSubject(scope, profile);
    const full = scope.view === 'school' ? null : scopedReport({ ...scope, period: '30d' });
    const weekly = scope.view === 'school' ? null : scopedReport({ ...scope, period: '7d' });
    const first = report.answers.filter(row => row.kind === '首次');
    const ranking = featureRows(report).sort((a, b) => b[this.data.rankingBy] - a[this.data.rankingBy] || a.name.localeCompare(b.name, 'zh-CN'));
    const classes = scope.view === 'subject' && profile ? learningClasses(profile)
      : DEMO_CLASSES.filter(row => scope.view === 'school' ? scope.grade === 'all' || row.grade === scope.grade : row.id === 'c1');
    const classIndex = classes.findIndex(row => row.id === scope.classId);
    const studentRows = report.roster.map(student => ({ ...getStudentLearning(report, student.id), name: student.name, className: student.className, counts: scope.view==='subject'&&full?correctionPersonalView(full,student.id,personalLearningRange(period)!).summary:subjectStudentCounts(report,student.id) }));
    const classComparisons = scope.view === 'school' && scope.classId === 'all' ? classes.map(row => {
      const classmates = studentRows.filter(student => report.roster.find(person => person.id === student.studentId)?.classId === row.id);
      return { id: row.id, name: row.name, learned: classmates.filter(student => student.learned).length, enrolled: classmates.length, coverage: pct(classmates.filter(student => student.learned).length, classmates.length) };
    }).sort((a, b) => a.coverage - b.coverage) : [];
    const sources = new Map<string, number>();
    if (scope.view === 'school') for (const activity of report.activities) sources.set(activity.feature, (sources.get(activity.feature) || 0) + 1);
    this.setData({
      schoolDetail: scope.view === 'school' && scope.classId !== 'all',
      recordedClasses: classComparisons.filter(row => row.learned > 0).length,
      schoolActivitySources: [...sources].map(([name, count]) => ({name, count})),
      title: scope.view === 'school' ? '学校学情' : scope.view === 'homeroom' ? '班级学情' : '学科学情', viewLabel: workViewLabel(scope.view), views: this.data.views.map(item => ({ ...item, selected: item.id === scope.view })), switchableViews: this.data.views.filter(item => item.id !== scope.view).map(({ id, label }) => ({ id, label })), scopeLabel: `${scopeTitle(scope)} · ${subject === 'all' ? '全科' : subject || '暂无授权学科'}`,
      periodStart: learningReportDays[period === '1d' ? 0 : period === '7d' ? 6 : period === '14d' ? 13 : 29],
      homeroomSubjects: scope.view === 'homeroom' ? reportSubjects(report) : [],
      weekSubjects: scope.view === 'homeroom' && weekly ? reportSubjects(weekly) : [],
      weekLearned: weekly?.learnedIds.size ?? 0,
      subjectHome: scope.view === 'subject' && subject ? subjectLearningHome(report, scope.period === '1d' ? 1 : 7) : null,
      subjectClassName: scopeTitle(scope),
      subjectOptions: scope.view === 'subject' && profile ? learningSubjects(profile, scope.classId) : [],
      subjectIndex: scope.view === 'subject' && profile ? Math.max(0, learningSubjects(profile, scope.classId).indexOf(subject)) : 0,
      subjectClassCount: scope.view === 'subject' ? classes.length : 0,
      previousClassId: classIndex > 0 ? classes[classIndex - 1].id : '',
      nextClassId: classIndex >= 0 ? classes[classIndex + 1]?.id ?? '' : '',
      week: weekly ? reportWeeklyComparison(weekly) : null, weekActivities: weekly?.activities.length ?? 0,
      followup: false, selectedPair: null, weekDetails: false,
      filterSummary: scope.view === 'school' ? scope.classId === 'all' ? scope.grade === 'all' ? '全校' : scope.grade + '年级' : scopeTitle(scope) : scope.view === 'subject' ? `${scopeTitle(scope)} · ${subject || '暂无授权学科'}` : scopeTitle(scope),
      classes: classes.map(row => ({ id: row.id, name: row.name, selected: row.id === scope.classId })),
      enrolled: report.roster.length, used: report.usedIds.size, learned: report.learnedIds.size, coverage: pct(report.learnedIds.size, report.roster.length),
      minutes: report.minutes, average: report.learnedIds.size ? Math.round(report.minutes / report.learnedIds.size) : 0,
      answeredStudents: new Set(first.map(row => row.studentId)).size, firstQuestions: first.length, wrongPeople: new Set(first.filter(row => !row.correct).map(row => row.studentId)).size,
      subjects: subjectRows(report), knowledge: knowledgeRows(report), ranking,
      students: studentRows, visibleStudents: studentRows.filter(row => row.name.includes(this.data.rosterName.trim()) && (scope.view !== 'subject' || this.data.rosterFilter !== 'wrong' || row.counts.wrongCount > 0)), classComparisons,
      timeRows: timelineRows(report).map(row => ({ ...row, studentName: report.roster.find(student => student.id === row.studentId)?.name || '学生', className: report.roster.find(student => student.id === row.studentId)?.className || '' })),
      timeDays: new Set(report.activities.map(row => row.day)).size,
    });
    this.refreshCorrection();
  },
  refreshCorrection() {
    const profile=getSession()?.profile,scope=this.data.scope;
    if(!profile||!availableWorkViews(profile).includes(scope.view)){this.setData({correctionPage:null});return;}
    const subject=workLearningSubject(scope,profile),base=queryWorkLearning({...scope,period:'30d'},'all',profile,true);
    const source=correctionSource(base,scope.view==='subject'?subject:'all');
    this.setData({correctionScopeNames:['全部班级',...this.data.classes.map(c=>c.name)],correctionPage:correctionPage(source,{role:scope.view,subject:scope.view==='subject'?subject:'all',days:parseInt(scope.period)},this.data.correctionRoute||{page:'home'})});
  },
  changeCorrectionClass(event:WechatMiniprogram.CustomEvent<{value:string}>){const n=Number(event.detail.value);if(this.data.scope.view!=='school')return;this.changeClass({currentTarget:{dataset:{id:n?this.data.classes[n-1]?.id:'all'}}} as unknown as WechatMiniprogram.BaseEvent);},
  changeCorrectionGrade(event:WechatMiniprogram.CustomEvent<{value:string}>){const grade=['all','7','8'][Number(event.detail.value)];if(this.data.scope.view!=='school'||!grade)return;this.changeGrade({currentTarget:{dataset:{grade}}} as unknown as WechatMiniprogram.BaseEvent);},
  correctionGo(event:WechatMiniprogram.BaseEvent) {
    const route=event.currentTarget.dataset.route as CorrectionRoute;if(!route?.page)return;
    if(route.page.startsWith('legacy-')&&this.data.scope.view!=='subject')return;
    if(route.page==='legacy-stage'){this.setData({correctionLegacy:true});this.showSubjectRoute({kind:'review',days:route.days||7});return;}
    if(route.page==='legacy-roster'){this.setData({correctionLegacy:true,tab:'students'});this.refresh();return;}
    if(route.page==='legacy-student'){if(this.data.scope.view!=='subject'||!route.studentId)return;this.setData({correctionLegacy:true});this.showStudent(route.studentId,((route.days||7)+'d') as LearningPeriod);return;}
    const current=this.data.correctionRoute;
    if(current?.page!==route.page||current?.classId!==route.classId||current?.subject!==route.subject||current?.knowledge!==route.knowledge||current?.questionId!==route.questionId||current?.studentId!==route.studentId||current?.originalId!==route.originalId||current?.eventId!==route.eventId)this.correctionTrail.push({route:current,scroll:this.scrollTop});
    this.setData({correctionRoute:{...route},roleMenuOpen:false,filtersOpen:false});this.refreshCorrection();wx.pageScrollTo({scrollTop:0,duration:0});
  },
  correctionExplain(){this.correctionGo({currentTarget:{dataset:{route:{...this.data.correctionRoute,page:'explain'}}}} as unknown as WechatMiniprogram.BaseEvent);},
  correctionSearch(event:WechatMiniprogram.CustomEvent<{value:string}>){if(!this.data.correctionRoute)return;this.setData({correctionRoute:{...this.data.correctionRoute,search:event.detail.value.trim()}});this.refreshCorrection();},
  correctionPeriod(event:WechatMiniprogram.BaseEvent){const days=Number(event.currentTarget.dataset.days);if(![1,7,14,30].includes(days))return;if(this.data.correctionRoute)this.setData({correctionRoute:{...this.data.correctionRoute,days}});else{if(!this.data.correctionPage?.periods.includes(days))return;this.setData({scope:{...this.data.scope,period:(days+'d') as LearningPeriod}});}this.refreshCorrection();},
  openStudent(event: WechatMiniprogram.BaseEvent) {
    const sourceRange = [...this.data.subjectTrail].reverse().find(route => 'days' in route);
    const sourcePeriod = sourceRange && 'days' in sourceRange ? (sourceRange.days + 'd') as LearningPeriod : this.data.scope.period;
    const period = this.data.scope.view === 'homeroom'
      ? (this.data.rosterFrom === 'week' ? '7d' : this.data.scope.period)
      : sourcePeriod;
    if (this.data.scope.view === 'subject') this.studentOriginScroll = this.scrollTop;
    this.showStudent(String(event.currentTarget.dataset.id), period);
    if (this.data.scope.view === 'subject' && this.data.selectedStudentId) wx.pageScrollTo({ scrollTop: 0, duration: 0 });
  },
  showStudent(studentId: string, period: LearningPeriod) {
    if (this.data.scope.view === 'school') return;
    const report = scopedReport({ ...this.data.scope, period }, studentId);
    const student = report?.roster.find(row => row.id === studentId);
    if (!student || !report) return;
    this.setData({ studentPeriod: period, studentSubjects: reportSubjects(report), studentWeek: this.data.scope.view === 'homeroom' ? null : reportWeeklyComparison(report),
      selectedCounts: this.data.scope.view==='subject'?subjectStudentCounts(report,studentId):null, personalQuestionId:'', correctionHistoryId:'',
      selectedStudentId: studentId, selectedStudentName: student.name, selectedSummary: getStudentLearning(report, studentId),
      selectedTimeline: timelineRows(report), selectedQuestion: null, selectedActivity: null, selectedPair: null });
    if (this.data.scope.view === 'subject') {
      this.setData({personalRange:personalLearningRange(period),personalFilter:'all',personalTopic:'all',personalDatesOpen:false,personalCompact:false,personalActivitiesOpen:false,personalClassName:student.className,personalInitial:student.name.slice(0,1)});
      this.refreshPersonalView();
    }
  },
  refreshPersonalView(afterRender?: () => void) {
    const {scope,selectedStudentId,personalRange,personalFilter,personalTopic}=this.data;
    if(scope.view!=='subject'||!selectedStudentId||!personalRange)return;
    const report=scopedReport({...scope,period:'30d'},selectedStudentId);
    if(!report || !report.roster.some(s=>s.id===selectedStudentId))return;
    const personalView=correctionPersonalView(report,selectedStudentId,personalRange,personalFilter,personalTopic);
    this.setData({personalView,personalTopic:personalView.selectedTopic,personalTopicIndex:personalView.selectedTopic==='all'?0:personalView.topicOptions.indexOf(personalView.selectedTopic),selectedCounts:personalView.summary,selectedTimeline:personalView.activities},afterRender);
  },
  changePersonalMode(event: WechatMiniprogram.BaseEvent) {
    if(this.data.scope.view!=='subject'||!this.data.selectedStudentId)return;
    const mode=event.currentTarget.dataset.mode;
    if(mode==='custom'){this.openPersonalDates();return;}
    if(!['1d','7d','14d','30d','term'].includes(mode))return;
    const range=personalLearningRange(mode);
    if(range)this.applyPersonalRange(range);
  },
  applyPersonalRange(range: PersonalLearningRange) {
    this.setData({personalRange:range,personalFilter:'all',personalTopic:'all',personalQuestionId:'',correctionHistoryId:'',personalDatesOpen:false,personalActivitiesOpen:false,selectedActivity:null,selectedPair:null});
    if(range.mode!=='term'&&range.mode!=='custom')this.setData({studentPeriod:range.mode});
    this.refreshPersonalView(() => this.personalToTop());
  },
  personalToTop(){this.setData({personalCompact:false,personalBottomSpace:20});wx.pageScrollTo({scrollTop:0,duration:0});},
  personalPositionQuestions(){
    const scroll=()=>wx.pageScrollTo({selector:'#personal-questions',offsetTop:-(this.data.personalNavHeight+76),duration:0});
    wx.createSelectorQuery().select('#personal-questions').boundingClientRect(rect=>{
      if(!rect||Array.isArray(rect))return;
      this.setData({personalBottomSpace:Math.max(20,wx.getWindowInfo().windowHeight-this.data.personalNavHeight-rect.height-140)},scroll);
    }).exec();
  },
  selectPersonalFilter(event: WechatMiniprogram.BaseEvent){
    const filter=event.currentTarget.dataset.filter;
    if(!['all','correct','wrong','corrected'].includes(filter))return;
    this.setData({personalFilter:filter,personalQuestionId:'',correctionHistoryId:'',...(event.currentTarget.dataset.reset?{personalTopic:'all'}:{})});
    this.refreshPersonalView(() => {
      this.setData({personalQuestionId:filter==='corrected'?this.data.personalView?.visible[0]?.id||'':''}, () => this.personalPositionQuestions());
    });
  },
  selectPersonalKnowledge(event: WechatMiniprogram.BaseEvent){
    const topic=this.data.personalView?.topics[Number(event.currentTarget.dataset.index)]?.name;
    if(!topic)return;
    this.setData({personalTopic:topic,personalFilter:'all',personalQuestionId:'',correctionHistoryId:''});this.refreshPersonalView(() => this.personalPositionQuestions());
  },
  changePersonalTopic(event: WechatMiniprogram.CustomEvent<{value:string}>){
    const index=Number(event.detail.value),topic=index===0?'all':this.data.personalView?.topicOptions[index];
    if(!topic)return;
    this.setData({personalTopic:topic,personalQuestionId:'',correctionHistoryId:''});this.refreshPersonalView(() => this.personalPositionQuestions());
  },
  togglePersonalActivities(){this.setData({personalActivitiesOpen:!this.data.personalActivitiesOpen});},
  openPersonalDates(){
    const range=this.data.personalRange;if(!range)return;
    this.setData({personalDatesOpen:true,personalDraftStart:range.start<learningReportDays[29]?learningReportDays[29]:range.start,personalDraftEnd:range.end,personalDateError:''});
  },
  closePersonalDates(){this.setData({personalDatesOpen:false,personalDateError:''});},
  stopPersonalDateTap(){},
  changePersonalDate(event: WechatMiniprogram.CustomEvent<{value:string}>){
    if(event.currentTarget.dataset.field==='start')this.setData({personalDraftStart:event.detail.value,personalDateError:''});
    else this.setData({personalDraftEnd:event.detail.value,personalDateError:''});
  },
  confirmPersonalDates(){
    const range=personalLearningRange('custom',this.data.personalDraftStart,this.data.personalDraftEnd);
    if(!range){this.setData({personalDateError:'请选择有效日期，开始日期不能晚于结束日期。'});return;}
    this.applyPersonalRange(range);
  },
  changeStudentPeriod(event: WechatMiniprogram.BaseEvent) {
    const period = event.currentTarget.dataset.period;
    if (this.data.scope.view === 'subject') { this.changePersonalMode({currentTarget:{dataset:{mode:period}}} as unknown as WechatMiniprogram.BaseEvent); return; }
    if (this.data.selectedStudentId && (period === '7d' || period === '30d')) this.showStudent(this.data.selectedStudentId, period);
  },
  closeStudent() {
    this.setData({ selectedStudentId: '', selectedTimeline: [], selectedSummary: null, selectedActivity: null, selectedPair: null, personalDatesOpen:false, personalCompact:false }, () => {
      if (this.data.scope.view === 'subject') wx.pageScrollTo({ scrollTop: this.studentOriginScroll, duration: 0 });
    });
  },
  returnToModuleHome(position?: number | WechatMiniprogram.BaseEvent) {
    this.correctionTrail=[];this.setData({correctionRoute:null,correctionLegacy:false});
    if (this.data.schoolDetail) {
      this.changeClass({ currentTarget: { dataset: { id: 'all' } } } as unknown as WechatMiniprogram.BaseEvent);
      return;
    }
    this.setData({
      tab: 'overview', rosterFromStage:false,rosterStagePeriod:'',rosterFilter:'all', subjectTrail: [], subjectRoute: null, subjectPage: null, selectedStudentId: '', selectedStudentName: '',
      selectedTimeline: [], selectedSummary: null, selectedKnowledge: '', selectedQuestion: null, selectedActivity: null,
      rosterName: '', filtersOpen: false, roleMenuOpen: false,
    }, () => {
      if (this.data.scope.view === 'subject') wx.pageScrollTo({ scrollTop: typeof position === 'number' ? position : 0, duration: 0 });
    });
    this.refresh();
  },
  openActivity(event: WechatMiniprogram.BaseEvent) {
    if (!this.data.selectedStudentId) return;
    const source = scopedReport({ ...this.data.scope, period: this.data.scope.view === 'subject' ? '30d' : this.data.studentPeriod }, this.data.selectedStudentId);
    const report = source && this.data.scope.view === 'subject' && this.data.personalRange ? personalLearningReport(source,this.data.personalRange) : source;
    if (report) this.setData({ selectedActivity: activityEvidence(report, String(event.currentTarget.dataset.id)) });
  },
  closeActivity() { this.setData({ selectedActivity: null }); },
  openQuestion(event: WechatMiniprogram.BaseEvent) {
    if (this.data.scope.view === 'school') return;
    const id = String(event.currentTarget.dataset.id);
    const report = scopedReport(this.data.scope);
    if (!report) return;
    const question = getLearningQuestion(id);
    if (!question) return;
    const first = [...new Map(report.answers.filter(row => row.questionId === id && row.kind === '首次').map(row => [row.studentId, row])).values()];
    if (!first.length) return;
    this.setData({ selectedQuestion: {
      title: '原题与学生作答',
      stem: question.stem, reference: question.answer, scoring: question.scoring, version: question.version,
      rows: first.map(row => {
        const student = report.roster.find(item => item.id === row.studentId);
        const correction = report.answers.find(item => item.questionId === id && item.studentId === row.studentId && item.kind === '订正' && item.originalAttemptId === row.id);
        const step = row.check ? ` · ${row.check.label}${row.check.correct ? '正确' : '有误'}` : '';
        return { studentId: row.studentId, name: student?.name || '学生', answer: row.answerText || '原始作答暂缺', result: (row.correct ? '整题答对' : '整题答错') + step, correction: correction ? `有订正记录 · ${correction.correct ? '本次答对' : '本次仍错'}` : '暂无订正记录' };
      }),
    } });
  },
  closeQuestion() { this.setData({ selectedQuestion: null }); },
  noop() {},
  openKnowledge(event: WechatMiniprogram.BaseEvent) {
    if (this.data.scope.view === 'school') return;
    const key = String(event.currentTarget.dataset.key);
    const report = scopedReport(this.data.scope);
    if (!report) return;
    const answers = report.answers.filter(row => row.kind === '首次' && `${row.subject}:${row.knowledge}` === key);
    const questionEvidence = [...new Set(answers.map(row => row.questionId))].map(id => {
      const rows = answers.filter(row => row.questionId === id);
      return { id, label: getLearningQuestion(id)?.stem || '原题暂缺', answered: new Set(rows.map(row => row.studentId)).size, wrong: new Set(rows.filter(row => !row.correct).map(row => row.studentId)).size };
    });
    this.setData({ selectedKnowledge: key === this.data.selectedKnowledge ? '' : key, questionEvidence });
  },
  openFollowup() { if (this.data.week?.repeated.length) this.setData({ followup: true, selectedPair: null }); },
  closeFollowup() { this.setData({ followup: false, selectedPair: null }); },
  toggleWeekDetails() { this.setData({ weekDetails: !this.data.weekDetails }); },
  openPair(event: WechatMiniprogram.BaseEvent) {
    const id = String(event.currentTarget.dataset.id);
    const pair = this.data.selectedStudentId ? this.data.studentWeek?.pairs.find(row => row.studentId === id) : this.data.week?.repeated.find(row => row.studentId === id);
    if (pair && scopedReport(this.data.scope, id)?.roster.some(row => row.id === id)) this.setData({ selectedPair: pair });
  },
  closePair() { this.setData({ selectedPair: null }); },
  backFromDetail() {
    if(this.data.correctionRoute&&!this.data.correctionLegacy){const prev=this.correctionTrail.pop();this.setData({correctionRoute:prev?.route||null});this.refreshCorrection();wx.pageScrollTo({scrollTop:prev?.scroll||0,duration:0});return;}
    if(this.data.correctionLegacy&&this.data.selectedStudentId){this.closeStudent();this.setData({correctionLegacy:false});this.refreshCorrection();return;}
    if (this.data.scope.view === 'subject' && this.data.selectedStudentId && this.data.personalDatesOpen) { this.closePersonalDates(); return; }
    if (this.data.scope.view === 'school' && this.data.scope.classId !== 'all') {
      this.changeClass({ currentTarget: { dataset: { id: 'all' } } } as unknown as WechatMiniprogram.BaseEvent);
      return;
    }
    if (this.data.selectedPair) { this.closePair(); return; }
    if (this.data.selectedActivity) { this.closeActivity(); return; }
    if (this.data.selectedQuestion) { this.closeQuestion(); return; }
    if (this.data.selectedStudentId) this.closeStudent();
    else if (this.data.subjectRoute) this.backFromSubjectIssue();
    else if (this.data.scope.view === 'subject' && this.data.tab === 'students') {
      if(this.data.rosterFromStage){const route=this.data.subjectTrail[this.data.subjectTrail.length-1];this.setData({tab:'overview',rosterFromStage:false,rosterStagePeriod:''});if(route)this.showSubjectRoute(route,true);wx.pageScrollTo({scrollTop:this.rosterOriginScroll,duration:0});}
      else this.returnToModuleHome(this.rosterOriginScroll);
    }
    else if (this.data.scope.view === 'homeroom' && this.data.tab === 'students') {
      this.setData({ tab: this.data.rosterFrom, rosterName: '' });
      this.refresh();
    } else this.closeFollowup();
  },
  onBackPress() {
    if (this.data.selectedPair) { this.closePair(); return true; }
    if (this.data.selectedActivity) { this.closeActivity(); return true; }
    if (this.data.selectedQuestion) { this.closeQuestion(); return true; }
    if (this.data.schoolDetail || this.data.selectedStudentId || this.data.followup || this.data.subjectRoute || (this.data.scope.view !== 'school' && this.data.tab === 'students')) { this.backFromDetail(); return true; }
    return false;
  },
});
