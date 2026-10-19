import { getSession } from '../../../stores/session';
import { DEMO_CLASSES, listHomeworkTasks, summarizeHomework } from '../../../services/homeworkMock';
import { availableWorkViews, scopedHomeworkTask, taskInScope, workScope } from '../../../services/workbenchScope';

Page({
  data: {
    seriesId: '', hasSeries: false, title: '', meta: '', description: '', completed: 0, target: 0,
    phases: [] as Array<{ id: string; phaseNo: number; date: string; time: string; status: string; completed: number; target: number; rate: number }>,
  },
  onLoad(options: { seriesId?: string }) { this.setData({ seriesId: options.seriesId || '' }); },
  onShow() {
    const session = getSession();
    if (!session?.profile || !session.expiresAt || session.expiresAt <= Date.now() || !availableWorkViews(session.profile).length) { wx.reLaunch({ url: '/pages/auth/login/index' }); return; }
    const scope = workScope(session.profile);
    const tasks = listHomeworkTasks().filter(task => task.seriesId === this.data.seriesId && taskInScope(task, scope, session.profile.userId)).sort((a, b) => a.deadline.localeCompare(b.deadline));
    if (!tasks.length) { this.setData({ hasSeries: false, phases: [] }); return; }
    const phases = tasks.map((task, index) => {
      const visible = scopedHomeworkTask(task, scope);
      const summary = summarizeHomework(visible);
      return { id: task.id, phaseNo: index + 1, date: task.deadline.slice(5, 10), time: task.deadline.slice(11), status: new Date(task.deadline.replace(' ', 'T')).getTime() > Date.now() ? '进行中' : '已截止', completed: summary.completed, target: summary.target, rate: summary.completionRate };
    });
    const classLabel = scopedHomeworkTask(tasks[0], scope).classIds.map(id => DEMO_CLASSES.find(row => row.id === id)?.name || id).join('、');
    this.setData({ hasSeries: true, title: tasks[0].title.replace(/ · 第\d+期$/, ''), meta: `${classLabel} · ${phases[0].date}—${phases[phases.length - 1].date} · 共 ${phases.length} 期`, description: tasks[0].description || '', completed: phases.reduce((sum, row) => sum + row.completed, 0), target: phases.reduce((sum, row) => sum + row.target, 0), phases });
  },
  openPhase(event: WechatMiniprogram.BaseEvent) {
    const id = String(event.currentTarget.dataset.id || '');
    if (this.data.phases.some(row => row.id === id)) wx.navigateTo({ url: `/pages/teacher/homework/index?taskId=${encodeURIComponent(id)}&fromSeries=1` });
  },
  back() { wx.navigateBack({ delta: 1 }); },
});
