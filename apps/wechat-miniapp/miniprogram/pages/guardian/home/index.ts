import { hasRole } from '../../../permissions/access';
import { getSession, linkedGuardianStudents, selectGuardianStudent } from '../../../stores/session';
import { getDemoStudent, SCHOOL_NAME } from '../../../services/schoolDemoRoster';
import { getStudentLearning, queryLearning } from '../../../services/learningMock';
import { getStudentSubmissions, listStudentTasks } from '../../../services/homeworkMock';

Page({
  data: { studentName: '', className: '', schoolName: SCHOOL_NAME, learnedDays: 0, learningMinutes: 0, homeworkOpenCount: 0, children: [] as Array<{ id: string; name: string; selected: boolean }> },
  onShow() {
    const session = getSession();
    const studentId = session?.profile.activeStudentId || '';
    const student = getDemoStudent(studentId);
    const linked = linkedGuardianStudents(session?.profile);
    if (!hasRole(session?.profile, 'guardian') || !session?.expiresAt || session.expiresAt <= Date.now() || !student || !linked.some(child => child.id === studentId)) {
      wx.reLaunch({ url: '/pages/auth/login/index' });
      return;
    }
    const learning = getStudentLearning(queryLearning('7d', student.classId, 'all', studentId), studentId);
    const homeworkOpenCount = listStudentTasks(studentId).filter(task => task.items.filter(item => item.required).some(item => !getStudentSubmissions(task.id, studentId).some(row => row.itemId === item.id))).length;
    this.setData({ studentName: student.name, className: student.className, children: linked.map(child => ({ id: child.id, name: child.name, selected: child.id === studentId })), learnedDays: learning.days, learningMinutes: learning.minutes, homeworkOpenCount });
  },
  changeChild(event: WechatMiniprogram.BaseEvent) { if (selectGuardianStudent(String(event.currentTarget.dataset.id))) this.onShow(); },
  openHomework() { wx.navigateTo({ url: '/pages/guardian/homework/index' }); },
  openLearning() { wx.navigateTo({ url: '/pages/guardian/learning/index' }); },
});
