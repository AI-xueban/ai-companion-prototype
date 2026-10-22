import { gradingProgress } from '../../../services/homeworkGrading';
import { FILE_LIMITS, SUBMIT_LABEL, getStudentSubmissions, getSubmissionHistory, listStudentTasks, submitHomeworkItem } from '../../../services/homeworkMock';
import type { HomeworkTask } from '../../../services/homeworkMock';
import { hasRole } from '../../../permissions/access';
import { getSession, linkedGuardianStudents, selectGuardianStudent } from '../../../stores/session';
import { getDemoStudent } from '../../../services/schoolDemoRoster';

Page({
  data: {
    mode: 'list', statusBarHeight: 24, navBarHeight: 44, capsuleSafeInset: 100,
    studentId: '',
    studentLabel: '', studentName: '', className: '',
    children: [] as Array<{ id: string; name: string; className: string; selected: boolean }>, childPickerOpen: false,
    tasks: [] as Array<{ id: string; title: string; subject: string; kindLabel: string; deadline: string; progress: string; completed: boolean; status: string; statusTone: string; priority: number; closed: boolean; actionLabel: string }>,
    pendingTasks: [] as Array<{ id: string; title: string; subject: string; kindLabel: string; deadline: string; progress: string; completed: boolean; status: string; statusTone: string; priority: number; closed: boolean; actionLabel: string }>,
    completedTasks: [] as Array<{ id: string; title: string; subject: string; kindLabel: string; deadline: string; progress: string; completed: boolean; status: string; statusTone: string; priority: number; closed: boolean; actionLabel: string }>,
    endedTasks: [] as Array<{ id: string; title: string; subject: string; kindLabel: string; deadline: string; progress: string; completed: boolean; status: string; statusTone: string; priority: number; closed: boolean; actionLabel: string }>,
    taskTab: 'pending' as 'pending' | 'completed' | 'ended',
    visibleTasks: [] as Array<{ id: string; title: string; subject: string; kindLabel: string; deadline: string; progress: string; completed: boolean; status: string; statusTone: string; priority: number; closed: boolean; actionLabel: string }>, deadlineNotice: '', submissionClosed: false,
    task: null as HomeworkTask | null,
    items: [] as Array<{ id: string; title: string; instruction: string; submitLabel: string; submitType: string; submitted: boolean; submittedAt: string; late: boolean; version: number; history: Array<{ version: number; submittedAt: string; late: boolean; mediaLabel: string }>; mediaLabel: string; mediaPath: string; questions: Array<{ id: string; label: string; result: string; answer: string; studentAnswer: string }> }>,
    grading: gradingProgress([]),
    completed: false,
    progressLabel: '',
    pendingUpload: null as { itemId: string; taskId: string; studentId: string; path: string; name: string; type: string } | null,
    uploadState: 'idle' as 'idle' | 'saving' | 'failed', uploadError: '', demoExceptionOpen: false, demoExceptionItemId: '', demoActive: false, demoOriginalError: '', demoOriginalState: 'idle' as 'idle' | 'saving' | 'failed', hasUploadItems: false, hasVideoItems: false,
  },
  onLoad() { const info = wx.getWindowInfo(); const capsule = wx.getMenuButtonBoundingClientRect(); this.setData({ statusBarHeight: info.statusBarHeight, navBarHeight: capsule.height + Math.max(0, capsule.top - info.statusBarHeight) * 2, capsuleSafeInset: Math.max(96, info.windowWidth - capsule.left + 8) }); },
  detailHome() { this.setData({ mode: 'list', task: null, pendingUpload: null }); wx.redirectTo({ url: '/pages/guardian/learning/index' }); },
  navigationBack() { if (this.data.mode === 'detail') this.backToList(); else wx.redirectTo({ url: '/pages/guardian/home/index' }); },
  onShow() {
    const session = getSession();
    const studentId = session?.profile.activeStudentId || '';
    const student = getDemoStudent(studentId);
    const linked = linkedGuardianStudents(session?.profile);
    if (!hasRole(session?.profile, 'guardian') || !session?.expiresAt || session.expiresAt <= Date.now() || !student || !linked.some(child => child.id === studentId)) { wx.reLaunch({ url: '/pages/auth/login/index' }); return; }
    const childChanged = Boolean(this.data.studentId && this.data.studentId !== studentId);
    const task = !childChanged && this.data.mode === 'detail' ? listStudentTasks(studentId).find(row => row.id === this.data.task?.id) || null : null;
    this.setData({ studentId, studentLabel: `${student.name} · ${student.className}`, studentName: student.name, className: student.className, children: linked.map(child => ({ id: child.id, name: child.name, className: child.className, selected: child.id === studentId })), childPickerOpen: false, task, mode: task ? 'detail' : 'list', items: childChanged ? [] : this.data.items, pendingUpload: childChanged ? null : this.data.pendingUpload?.studentId === studentId ? this.data.pendingUpload : null, uploadState: 'idle', uploadError: '' });
    this.refreshList();
    if (task) this.refreshTask();
  },
  closeChildPicker() { this.setData({ childPickerOpen: false }); },
  stopChildDialogTap() {},
  toggleChildPicker() { if (this.data.mode === 'list' && this.data.children.length > 1) this.setData({ childPickerOpen: !this.data.childPickerOpen }); },
  changeChild(event: WechatMiniprogram.BaseEvent) {
    const studentId = String(event.currentTarget.dataset.id);
    if (!selectGuardianStudent(studentId)) return;
    const student = getDemoStudent(studentId);
    if (!student) return;
    this.setData({ studentId, studentLabel: `${student.name} · ${student.className}`, studentName: student.name, className: student.className, children: this.data.children.map(child => ({ ...child, selected: child.id === studentId })), childPickerOpen: false, mode: 'list', task: null, tasks: [], items: [], pendingUpload: null, uploadState: 'idle', uploadError: '' });
    this.refreshList();
  },
  refreshList() {
    const now = Date.now();
    const tasks = listStudentTasks(this.data.studentId).map(task => {
      const submitted = getStudentSubmissions(task.id, this.data.studentId);
      const required = task.items.filter(item => item.required);
      const count = required.filter(item => submitted.some(row => row.itemId === item.id)).length;
      const completed = count === required.length;
      const remaining = new Date(task.deadline.replace(' ', 'T')).getTime() - now;
      const overdue = !completed && remaining < 0;
      const dueSoon = !completed && !overdue && remaining <= 24 * 60 * 60 * 1000;
      const closed = !completed && now > new Date(task.submitDeadline.replace(' ', 'T')).getTime();
      const status = completed ? '已完成' : closed ? '补交已结束' : overdue ? '已逾期 · 可补交' : dueSoon ? '临近截止' : count > 0 ? '部分完成' : '待完成';
      return { id: task.id, title: task.title, subject: task.subject || '综合', kindLabel: task.kind === 'checkin' ? '打卡' : '作业', deadline: task.deadline, progress: `${count}/${required.length} 项`, completed, closed, actionLabel: completed || closed ? '查看记录' : count > 0 ? '继续完成' : '去完成', status, statusTone: completed ? 'done' : overdue ? 'overdue' : dueSoon ? 'soon' : count > 0 ? 'partial' : 'todo', priority: completed ? 4 : overdue ? 0 : dueSoon ? 1 : count > 0 ? 2 : 3 };
    });
    tasks.sort((a, b) => a.priority - b.priority || a.deadline.localeCompare(b.deadline));
    const pendingTasks = tasks.filter(task => !task.completed && !task.closed), completedTasks = tasks.filter(task => task.completed), endedTasks = tasks.filter(task => !task.completed && task.closed);
    this.setData({ tasks, pendingTasks, completedTasks, endedTasks, visibleTasks: { pending: pendingTasks, completed: completedTasks, ended: endedTasks }[this.data.taskTab] });
  },
  taskTouchStart: null as { x: number; y: number } | null,
  changeTaskTab(event: WechatMiniprogram.BaseEvent) { this.selectTaskTab(String(event.currentTarget.dataset.tab)); },
  selectTaskTab(value: string) {
    if (value !== 'pending' && value !== 'completed' && value !== 'ended') return;
    this.taskTouchStart = null;
    this.setData({ taskTab: value, visibleTasks: { pending: this.data.pendingTasks, completed: this.data.completedTasks, ended: this.data.endedTasks }[value] });
    wx.pageScrollTo({ scrollTop: 0, duration: 0 });
  },
  startTaskSwipe(event: WechatMiniprogram.TouchEvent) { const touch = event.touches[0]; this.taskTouchStart = event.touches.length === 1 ? { x: touch.clientX, y: touch.clientY } : null; },
  cancelTaskSwipe() { this.taskTouchStart = null; },
  endTaskSwipe(event: WechatMiniprogram.TouchEvent) {
    const start = this.taskTouchStart, touch = event.changedTouches[0]; this.taskTouchStart = null;
    if (!start || !touch) return;
    const dx = touch.clientX - start.x, dy = touch.clientY - start.y;
    if (Math.abs(dx) < 50 || Math.abs(dx) <= Math.abs(dy) * 1.3) return;
    const tabs = ['pending', 'completed', 'ended']; const next = tabs.indexOf(this.data.taskTab) + (dx < 0 ? 1 : -1);
    if (next >= 0 && next < tabs.length) this.selectTaskTab(tabs[next]);
  },
  openTask(event: WechatMiniprogram.BaseEvent) {
    const task = listStudentTasks(this.data.studentId).find(row => row.id === event.currentTarget.dataset.id);
    if (task) { this.setData({ task, mode: 'detail', pendingUpload: null, uploadState: 'idle', uploadError: '', demoExceptionOpen: false, demoActive: false }); this.refreshTask(); }
  },
  refreshTask() {
    const task = this.data.task;
    if (!task) return;
    const submitted = getStudentSubmissions(task.id, this.data.studentId);
    const items = task.items.map(item => {
      const record = submitted.find(row => row.itemId === item.id);
      return { id: item.id, title: item.title, instruction: item.instruction, submitLabel: item.submitType === 'none' ? '家长确认' : `上传${SUBMIT_LABEL[item.submitType]}`, submitType: item.submitType, submitted: Boolean(record), submittedAt: record?.submittedAt || '', late: Boolean(record?.late), version: record?.version || 1, history: getSubmissionHistory(task.id, item.id, this.data.studentId).map(row => ({ version: row.version || 1, submittedAt: row.submittedAt, late: Boolean(row.late), mediaLabel: row.mediaLabel })), mediaLabel: record?.mediaLabel || '', mediaPath: record?.mediaPath || '', questions: [] };
    });
    const required = task.items.filter(item => item.required);
    const count = required.filter(item => submitted.some(row => row.itemId === item.id)).length;
    const completed = count === required.length;
    const overdue = Date.now() > new Date(task.deadline.replace(' ', 'T')).getTime();
    const submissionClosed = Date.now() > new Date(task.submitDeadline.replace(' ', 'T')).getTime();
    this.setData({ hasUploadItems: items.some(item => item.submitType !== 'none'), hasVideoItems: items.some(item => item.submitType === 'video'), grading: gradingProgress(submitted.flatMap(row=>row.questions||[]),true), items, completed, submissionClosed, progressLabel: `${count}/${required.length} 项`, deadlineNotice: submissionClosed ? `补交期限已于 ${task.submitDeadline} 结束，任务仅供查看。` : overdue ? `已过原截止时间，可补交至 ${task.submitDeadline}；提交记录会标注为补交。` : completed ? '所有必做项目已完成，可在提交期限内重新提交。' : `请在 ${task.deadline} 前完成；最晚可补交至 ${task.submitDeadline}。` });
  },
  openGradingResult() { const task=this.data.task; if(task && gradingProgress(getStudentSubmissions(task.id,this.data.studentId).flatMap(row=>row.questions||[]),true).released > 0)wx.navigateTo({url:'/pages/homework-result/index?role=guardian&taskId='+encodeURIComponent(task.id)+'&studentId='+encodeURIComponent(this.data.studentId)}); },
  backToList() { this.setData({ mode: 'list', task: null, pendingUpload: null, uploadState: 'idle', uploadError: '', demoExceptionOpen: false, demoActive: false }); this.refreshList(); },
  openLearning() { if (this.data.mode === 'list') wx.redirectTo({ url: '/pages/guardian/learning/index' }); },
  submitItem(event: WechatMiniprogram.BaseEvent) {
    const task = this.data.task;
    if (!task || this.data.submissionClosed) return;
    try {
      const item = task.items.find(row => row.id === event.currentTarget.dataset.id);
      if (!item || item.submitType !== 'none') return;
      const profile = getSession()?.profile;
      submitHomeworkItem(task.id, item.id, this.data.studentId, undefined, profile ? { id: profile.userId, name: profile.displayName || '家长' } : undefined);
      this.refreshTask();
      wx.showToast({ title: '已确认完成', icon: 'success' });
    } catch (error) { wx.showToast({ title: error instanceof Error ? error.message : '提交失败', icon: 'none' }); }
  },
  chooseSubmissionMedia(event: WechatMiniprogram.BaseEvent) {
    const task = this.data.task;
    const item = task?.items.find(row => row.id === event.currentTarget.dataset.id);
    if (!task || this.data.submissionClosed || !item || (item.submitType !== 'photo' && item.submitType !== 'video')) return;
    const submitType = item.submitType;
    if (submitType === 'photo') {
      wx.showActionSheet({ itemList: ['手机相册 · 图片', '微信聊天记录 · 图片'], success: choice => {
        if (choice.tapIndex === 1) {
          wx.chooseMessageFile({ count: 1, type: 'image', success: result => {
            const selected = result.tempFiles[0];
            if (!selected?.path) return;
            if (!/\.(png|jpe?g|webp|gif|bmp|heic)$/i.test(selected.name || '') && selected.type !== 'image') { this.setData({ uploadState: 'failed', uploadError: '请选择图片文件后重试。' }); return; }
            if ((selected.size || 0) > FILE_LIMITS.photo.bytes) { this.setData({ uploadState: 'failed', uploadError: `图片不能超过 ${FILE_LIMITS.photo.label}，请压缩后重新选择。` }); return; }
            this.setData({ pendingUpload: { taskId: task.id, itemId: item.id, studentId: this.data.studentId, path: selected.path, name: selected.name || '微信聊天记录图片', type: 'photo' }, uploadState: 'idle', uploadError: '' });
          }, fail: error => { if (!String(error.errMsg || '').includes('cancel')) this.setData({ uploadState: 'failed', uploadError: '未能读取微信聊天记录中的图片，请重新选择。' }); } });
          return;
        }
        this.selectSubmissionMediaFromAlbum(task.id, item.id, 'photo');
      } });
      return;
    }
    this.selectSubmissionMediaFromAlbum(task.id, item.id, 'video');
  },
  selectSubmissionMediaFromAlbum(taskId: string, itemId: string, submitType: 'photo' | 'video') {
    wx.chooseMedia({ count: 1, mediaType: [submitType === 'photo' ? 'image' : 'video'], sourceType: submitType === 'photo' ? ['album'] : ['album', 'camera'], success: result => {
      const selected = result.tempFiles[0];
      if (!selected?.tempFilePath) return;
      const limit = FILE_LIMITS[submitType];
      if ((selected.size || 0) > limit.bytes) { this.setData({ uploadState: 'failed', uploadError: `${submitType === 'photo' ? '图片' : '视频'}不能超过 ${limit.label}，请压缩后重新选择。` }); return; }
      if (submitType === 'video' && (selected.duration || 0) > FILE_LIMITS.video.seconds) { this.setData({ uploadState: 'failed', uploadError: '视频不能超过 5 分钟，请剪辑后重新选择。' }); return; }
      this.setData({ pendingUpload: { taskId, itemId, studentId: this.data.studentId, path: selected.tempFilePath, name: submitType === 'photo' ? '家长提交的作业原图' : '家长提交的讲解视频', type: submitType }, uploadState: 'idle', uploadError: '' });
    }, fail: error => { if (!String(error.errMsg || '').includes('cancel')) this.setData({ uploadState: 'failed', uploadError: '未能读取照片或视频，请检查相册权限后重试。' }); } });
  },
  chooseAudio(event: WechatMiniprogram.BaseEvent) {
    const task = this.data.task;
    const item = task?.items.find(row => row.id === event.currentTarget.dataset.id);
    if (!task || this.data.submissionClosed || !item || item.submitType !== 'audio') return;
    wx.chooseMessageFile({ count: 1, type: 'file', extension: ['mp3', 'm4a', 'wav'], success: result => {
      const selected = result.tempFiles[0];
      if (!selected?.path) return;
      if ((selected.size || 0) > FILE_LIMITS.audio.bytes) { this.setData({ uploadState: 'failed', uploadError: '录音不能超过 50MB，请压缩后重新选择。' }); return; }
      this.setData({ pendingUpload: { taskId: task.id, itemId: item.id, studentId: this.data.studentId, path: selected.path, name: selected.name || '家长提交的录音', type: 'audio' }, uploadState: 'idle', uploadError: '' });
    }, fail: error => { if (!String(error.errMsg || '').includes('cancel')) this.setData({ uploadState: 'failed', uploadError: '未能读取录音文件，请检查文件格式或权限后重试。' }); } });
  },
  chooseSubmissionFile(event: WechatMiniprogram.BaseEvent) {
    const task = this.data.task;
    const item = task?.items.find(row => row.id === event.currentTarget.dataset.id);
    if (!task || this.data.submissionClosed || item?.submitType !== 'file') return;
    wx.chooseMessageFile({ count: 1, type: 'file', extension: ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt'], success: result => {
      const selected = result.tempFiles[0];
      if (!selected?.path) return;
      if ((selected.size || 0) > FILE_LIMITS.file.bytes) { this.setData({ uploadState: 'failed', uploadError: '文件不能超过 50MB，请压缩后重新选择。' }); return; }
      this.setData({ pendingUpload: { taskId: task.id, itemId: item.id, studentId: this.data.studentId, path: selected.path, name: selected.name || '提交文件', type: 'file' }, uploadState: 'idle', uploadError: '' });
    }, fail: error => { if (!String(error.errMsg || '').includes('cancel')) this.setData({ uploadState: 'failed', uploadError: '未能读取微信会话文件，请重新选择。' }); } });
  },
  openSubmittedFile(event: WechatMiniprogram.BaseEvent) { const filePath = String(event.currentTarget.dataset.path || ''); if (filePath) wx.openDocument({ filePath, showMenu: true }); },
  cancelUpload() { this.setData({ pendingUpload: null, uploadState: 'idle', uploadError: '' }); },
  confirmUpload() {
    if (this.data.demoActive) return;
    const pending = this.data.pendingUpload;
    const task = this.data.task;
    if (!pending || !task || this.data.submissionClosed || pending.taskId !== task.id || pending.studentId !== this.data.studentId || !task.items.some(item => item.id === pending.itemId && item.submitType === pending.type)) return;
    if (getStudentSubmissions(task.id, this.data.studentId).some(row => row.itemId === pending.itemId)) {
      wx.showModal({ title: '确认重新提交', content: '新文件会成为当前展示版本，之前的提交仍保留在提交记录中。', confirmText: '确认提交', success: result => { if (result.confirm) this.savePendingUpload(pending); } });
      return;
    }
    this.savePendingUpload(pending);
  },
  savePendingUpload(pending: { itemId: string; taskId: string; studentId: string; path: string; name: string; type: string }) {
    const task = this.data.task;
    if (!task || this.data.pendingUpload?.path !== pending.path || pending.taskId !== task.id || pending.studentId !== this.data.studentId) return;
    this.setData({ uploadState: 'saving', uploadError: '' });
    wx.getFileSystemManager().saveFile({ tempFilePath: pending.path, success: saved => {
      try { const profile = getSession()?.profile; submitHomeworkItem(task.id, pending.itemId, this.data.studentId, { path: saved.savedFilePath, name: pending.name }, profile ? { id: profile.userId, name: profile.displayName || '家长' } : undefined); this.setData({ pendingUpload: null, uploadState: 'idle', uploadError: '' }); this.refreshTask(); wx.showToast({ title: '该项已提交', icon: 'success' }); }
      catch (error) { this.setData({ uploadState: 'failed', uploadError: error instanceof Error ? error.message : '提交失败，请稍后重试。' }); }
    }, fail: () => this.setData({ uploadState: 'failed', uploadError: '文件保存失败，已保留当前选择，请重试。' }) });
  },
  toggleDemoExceptions() { this.setData({ demoExceptionOpen: !this.data.demoExceptionOpen }); },
  closeDemoExceptions() { this.setData({ demoExceptionOpen: false }); },
  simulateUploadException(event: WechatMiniprogram.BaseEvent) {
    const messages: Record<string, string> = { format: '文件格式不支持，请选择 JPG、PNG、MP4、MOV、MP3、M4A 或 WAV。', size: '文件超过当前类型大小限制，请压缩后重新选择。', duration: '视频超过 5 分钟，请剪辑后重新选择。', network: '网络连接中断，当前选择已保留，请恢复网络后重试。' };
    if (!this.data.demoActive) this.setData({ demoOriginalError: this.data.uploadError, demoOriginalState: this.data.uploadState });
    this.setData({ demoActive: true, uploadState: 'failed', uploadError: messages[String(event.currentTarget.dataset.type)] || '提交失败，请重试。', demoExceptionOpen: false });
  },
  clearUploadError() { this.setData({ uploadState: this.data.demoActive ? this.data.demoOriginalState : 'idle', uploadError: this.data.demoActive ? this.data.demoOriginalError : '', demoActive: false, demoExceptionOpen: false }); },
});
