import { clearSession, getSession } from '../../../stores/session';
import { getDemoTeacherWechatBinding, setDemoTeacherManualLogout, unbindDemoTeacherWechat } from '../../../services/auth';
import { DEMO_CLASSES, SCHOOL_NAME } from '../../../services/schoolDemoRoster';
import { listHomeworkTasks } from '../../../services/homeworkMock';
import { availableWorkViews, queryWorkLearning, scopeSubtitle, selectWorkClass, selectWorkGrade, selectWorkPeriod, selectWorkView, taskInScope, workScope, workViewLabel } from '../../../services/workbenchScope';
import type { WorkScope, WorkView } from '../../../services/workbenchScope';
import type { LearningPeriod } from '../../../services/learningMock';

Page({
  data: {
    teacherName: '', schoolName: SCHOOL_NAME, scope: { view: 'school', period: '7d', grade: 'all', classId: 'all' } as WorkScope,
    views: [] as Array<{ id: WorkView; label: string; selected: boolean }>, classes: [] as Array<{ id: string; name: string; selected: boolean }>,
    scopeLabel: '', headline: '', enrolled: 0, learned: 0, minutes: 0, taskCount: 0,
    securityOpen: false, wechatBound: false, reauthPassword: '',
  },
  onShow() {
    const session = getSession();
    if (!session?.profile || !session.expiresAt || session.expiresAt <= Date.now() || !availableWorkViews(session.profile).length) { wx.reLaunch({ url: '/pages/auth/login/index' }); return; }
    this.setData({ teacherName: session.profile.displayName || '教师' });
    this.refresh();
  },
  refresh() {
    const profile = getSession()?.profile;
    if (!profile) return;
    const scope = workScope(profile);
    const classes = DEMO_CLASSES.filter(row => scope.view === 'school' ? scope.grade === 'all' || row.grade === scope.grade : scope.view === 'homeroom' ? row.id === 'c1' : row.id === 'c1' || row.id === 'c2');
    const report = queryWorkLearning(scope);
    const tasks = listHomeworkTasks().filter(task => taskInScope(task, scope, profile.userId));
    this.setData({ scope, scopeLabel: scopeSubtitle(scope), headline: scope.view === 'school' ? '学校总览' : scope.view === 'homeroom' ? '本班工作台' : '任教学科工作台',
      views: availableWorkViews(profile).map(id => ({ id, label: workViewLabel(id), selected: id === scope.view })),
      classes: classes.map(row => ({ id: row.id, name: row.name, selected: row.id === scope.classId })),
      enrolled: report.roster.length, learned: report.learnedIds.size, minutes: report.minutes, taskCount: tasks.length });
  },
  changeView(event: WechatMiniprogram.BaseEvent) { const profile = getSession()?.profile; if (profile) { selectWorkView(profile, event.currentTarget.dataset.view as WorkView); this.refresh(); } },
  changeGrade(event: WechatMiniprogram.BaseEvent) { const profile = getSession()?.profile; if (profile) { const grade = event.currentTarget.dataset.grade; selectWorkGrade(profile, grade === 'all' ? 'all' : Number(grade) as 7 | 8); this.refresh(); } },
  changeClass(event: WechatMiniprogram.BaseEvent) { const profile = getSession()?.profile; if (profile) { selectWorkClass(profile, String(event.currentTarget.dataset.id)); this.refresh(); } },
  changePeriod(event: WechatMiniprogram.BaseEvent) { const profile = getSession()?.profile; if (profile) { selectWorkPeriod(profile, event.currentTarget.dataset.period as LearningPeriod); this.refresh(); } },
  openLearning() { wx.navigateTo({ url: '/pages/teacher/learning/index' }); },
  openHomework() { wx.navigateTo({ url: '/pages/teacher/homework/index' }); },
  openControl() { wx.showToast({ title: '答案管控页面待接入', icon: 'none' }); },
  openSecurity() { this.setData({ securityOpen: true, wechatBound: getDemoTeacherWechatBinding() === 'teacher-demo-001', reauthPassword: '' }); },
  closeSecurity() { this.setData({ securityOpen: false, reauthPassword: '' }); },
  changeReauthPassword(event: WechatMiniprogram.CustomEvent<{ value: string }>) { this.setData({ reauthPassword: event.detail.value }); },
  confirmUnbind() { try { unbindDemoTeacherWechat('teacher-demo-001', this.data.reauthPassword); this.setData({ wechatBound: false, reauthPassword: '' }); wx.showToast({ title: '已解绑当前微信', icon: 'success' }); } catch (error) { wx.showToast({ title: error instanceof Error ? error.message : '解绑失败', icon: 'none' }); } },
  logout() { setDemoTeacherManualLogout(true); clearSession(); wx.reLaunch({ url: '/pages/auth/login/index' }); },
});
