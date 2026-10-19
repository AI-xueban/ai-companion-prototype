import { getSession } from '../../../stores/session';
import { DEMO_CLASSES, DEMO_STUDENTS, SUBMIT_LABEL, confirmMockReview, getHomeworkTask, getTaskStudentRows, listHomeworkTasks, publishHomework, summarizeHomework } from '../../../services/homeworkMock';
import type { HomeworkItem, HomeworkKind, SubmitType } from '../../../services/homeworkMock';
import { availableWorkViews, homeworkScopeSubtitle, scopeClassIds, scopedHomeworkTask, selectWorkClass, taskInScope, workScope } from '../../../services/workbenchScope';
import type { WorkScope } from '../../../services/workbenchScope';

const TYPES: SubmitType[] = ['photo', 'video', 'audio', 'none'];
const SUBJECTS = ['数学', '语文', '英语', '物理'];
const TEACHER_CLASSES = DEMO_CLASSES.filter(row => row.id === 'c1' || row.id === 'c2');
const createItem = (index: number): HomeworkItem => ({ id: `item-${Date.now()}-${index}`, title: '', instruction: '', submitType: 'photo', required: true });
const defaultDeadline = () => { const date = new Date(Date.now() + 2 * 86400000); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} 20:00`; };
const addDays = (value: string, days: number) => { const date = new Date(value.replace(' ', 'T')); date.setDate(date.getDate() + days); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`; };
const emptyDraft = (classId: string) => { const deadline = defaultDeadline(); return { title: '', description: '', materialPhoto: '', kind: 'homework' as HomeworkKind, subject: '数学', cycleCount: 1, classIds: [classId], targetStudentIds: [] as string[], targetMode: 'all', items: [createItem(0)], deadline, submitDeadline: addDays(deadline, 7), parentVisible: false }; };
const DEMO_PASTE = '本周复习：回顾课堂知识\n📚作业：\n1. 完成数学练习第 3 页，拍照上传答题页\n2. 选择一道错题，录制 1 分钟讲解视频\n3. 朗读课文片段，上传录音\n4. 完成 20 分钟课外阅读，由家长确认';

const numberedLine = (line: string): { number: number; style: string; body: string } | null => {
  const value = line.trim();
  let match = value.match(/^(?:[（(](\d{1,2})[）)]|([1-9]\d{0,1})[.．、]|([①②③④⑤⑥⑦⑧⑨⑩])|([一二三四五六七八九十])[、.．])\s*(.+)$/);
  if (!match) return null;
  const circles = '①②③④⑤⑥⑦⑧⑨⑩', chinese = '一二三四五六七八九十';
  const number = match[1] ? Number(match[1]) : match[2] ? Number(match[2]) : match[3] ? circles.indexOf(match[3]) + 1 : chinese.indexOf(match[4]) + 1;
  const style = match[1] ? 'bracket' : match[2] ? 'digit' : match[3] ? 'circle' : 'chinese';
  return { number, style, body: match[5] };
};
const recognizeItems = (description: string): string[] => {
  const lines = description.replace(/\r\n?/g, '\n').split('\n');
  const groups: Array<{ start: number; end: number; style: string; count: number; homework: boolean }> = [];
  let group: typeof groups[number] | null = null;
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    const marker = numberedLine(line);
    if (!marker) continue;
    if (marker.number === 1) {
      if (group && group.count >= 2) groups.push(group);
      group = { start: index, end: index, style: marker.style, count: 1, homework: lines.slice(Math.max(0, index - 2), index).some(row => /作业|任务|练习/.test(row)) };
    } else if (group && marker.style === group.style && marker.number === group.count + 1) {
      group.end = index; group.count++;
    }
  }
  if (group && group.count >= 2) groups.push(group);
  groups.sort((a, b) => Number(b.homework) - Number(a.homework) || b.count - a.count);
  const winner = groups[0];
  if (!winner) return description.trim() ? [description.trim()] : [];
  const starts: number[] = [];
  for (let i = winner.start; i <= winner.end; i++) if (numberedLine(lines[i])?.style === winner.style) starts.push(i);
  return starts.map((start, index) => {
    const end = starts[index + 1] ?? lines.length;
    const first = numberedLine(lines[start])?.body || lines[start];
    return [first, ...lines.slice(start + 1, end)].join('\n').trim();
  }).filter(Boolean);
};

Page({
  data: {
    scope: { view: 'school', period: '7d', grade: 'all', classId: 'all' } as WorkScope,
    scopeLabel: '', readOnly: false, scopeClasses: [] as Array<{ id: string; name: string; selected: boolean }>,
    scopeSummary: { taskCount: 0, target: 0, completed: 0, partial: 0, missing: 0, ongoing: 0, checkinTarget: 0, checkinCompleted: 0 },
    mode: 'list', entryTaskId: '', fromSeries: false,
    tasks: [] as Array<Record<string, unknown>>,
    taskGroups: [] as Array<Record<string, unknown>>,
    selectedTask: null as ReturnType<typeof getHomeworkTask> | null,
    canReview: false,
    summary: null as ReturnType<typeof summarizeHomework> | null,
    wrongCount: 0,
    studentFilter: 'all',
    studentListTitle: '',
    studentRows: [] as Array<{ id: string; name: string; className: string; statusLabel: string; progress: string; wrongCount: number; latestSubmittedAt: string }>,
    selectedStudentName: '',
    selectedStudentMeta: '',
    studentItems: [] as Array<{ id: string; title: string; submitLabel: string; submitted: boolean; submittedAt: string; late: boolean; version: number; operatorLabel: string; mediaLabel: string; mediaPath: string; isPhoto: boolean; isVideo: boolean; isAudio: boolean; isMock: boolean; questions: Array<{ id: string; label: string; result: string; answer: string; studentAnswer: string; reviewCount: number; reviewHistory: Array<{ at: string; result: string; reason: string; reviewer: string }> }> }>,
    draft: emptyDraft(TEACHER_CLASSES[0].id),
    classes: [] as Array<{ id: string; name: string; selected: boolean }>,
    studentOptions: [] as Array<{ id: string; name: string; className: string; selected: boolean }>,
    studentSearch: '',
    draftItems: [] as Array<HomeworkItem & { submitLabel: string; submitIndex: number }>,
    composeStep: 0,
    settingMode: 'uniform',
    uniformType: 'photo' as SubmitType,
    uniformTypeIndex: 0,
    recognizedCount: 0,
    recognitionStale: false,
    demoPasteActive: false,
    composeError: '',
    hasDraft: false,
    deadlineDate: '', deadlineTime: '', submitDeadlineDate: '', submitDeadlineTime: '',
    submitTypeOptions: ['上传图片', '上传视频', '上传录音', '家长确认完成'],
    subjectOptions: SUBJECTS,
    publishedTitle: '', publishedTargetCount: 0, publishedClasses: '', publishedDeadline: '', publishedSubmitDeadline: '', publishedItemCount: 0,
    publishing: false,
    previewOpen: false,
    previewTargetCount: 0,
    previewClasses: '', previewStudents: '', previewItems: [] as Array<{ id: string; title: string; instruction: string; type: string }>,
  },
  onLoad(options: { taskId?: string; fromSeries?: string }) {
    const session = getSession();
    if (!session?.profile || !session.expiresAt || session.expiresAt <= Date.now() || !availableWorkViews(session.profile).length) { wx.reLaunch({ url: '/pages/auth/login/index' }); return; }
    const classId = workScope(session.profile).classId === 'c2' ? 'c2' : 'c1';
    this.setData({ draft: emptyDraft(classId), entryTaskId: options.taskId || '', fromSeries: options.fromSeries === '1' });
    this.refreshDraft();
  },
  onShow() {
    const session = getSession();
    if (!session?.profile || !session.expiresAt || session.expiresAt <= Date.now() || !availableWorkViews(session.profile).length) { wx.reLaunch({ url: '/pages/auth/login/index' }); return; }
    const scope = workScope(session.profile);
    const allowedClasses = scopeClassIds(scope);
    const keepDraft = this.data.hasDraft && this.data.draft.classIds.every(id => allowedClasses.includes(id));
    this.setData({ scope, scopeLabel: homeworkScopeSubtitle(scope), readOnly: scope.view === 'school', mode: keepDraft && this.data.mode === 'compose' && scope.view !== 'school' ? 'compose' : 'list', selectedTask: null, previewOpen: false,
      hasDraft: keepDraft, draft: keepDraft ? this.data.draft : emptyDraft(allowedClasses[0] || 'c1'), composeStep: keepDraft ? this.data.composeStep : 0,
      scopeClasses: DEMO_CLASSES.filter(row => scopeClassIds({ ...scope, classId: 'all' }).includes(row.id)).map(row => ({ id: row.id, name: row.name, selected: row.id === scope.classId })) });
    this.refreshList();
    this.refreshDraft();
    if (this.data.entryTaskId) this.openTask(this.data.entryTaskId);
  },
  changeScopeClass(event: WechatMiniprogram.BaseEvent) {
    const profile = getSession()?.profile;
    if (!profile || this.data.scope.view !== 'school') return;
    const scope = selectWorkClass(profile, String(event.currentTarget.dataset.id));
    this.setData({ scope, scopeLabel: homeworkScopeSubtitle(scope), mode: 'list', selectedTask: null,
      scopeClasses: DEMO_CLASSES.filter(row => scopeClassIds({ ...scope, classId: 'all' }).includes(row.id)).map(row => ({ id: row.id, name: row.name, selected: row.id === scope.classId })) });
    this.refreshList();
  },
  refreshList() {
    const profile = getSession()?.profile;
    if (!profile) return;
    const scope = this.data.scope;
    const tasks = listHomeworkTasks().filter(task => taskInScope(task, scope, profile.userId)).map(task => {
      const visibleTask = scopedHomeworkTask(task, scope);
      const summary = summarizeHomework(visibleTask);
      return { id: task.id, seriesId: task.seriesId || task.id, title: task.title, kind: task.kind, kindLabel: task.kind === 'checkin' ? '打卡' : '作业', classLabel: visibleTask.classIds.map(id => DEMO_CLASSES.find(row => row.id === id)?.name).join('、'), deadline: task.deadline, ongoing: new Date(task.deadline.replace(' ', 'T')).getTime() > Date.now(), target: summary.target, completed: summary.completed, partial: summary.partial, missing: summary.missing, completionRate: summary.completionRate };
    });
    const scopeSummary = tasks.reduce((total, row) => {
      if (row.ongoing) { total.ongoing += 1; return total; }
      if (row.kind === 'checkin') { total.checkinTarget += row.target; total.checkinCompleted += row.completed; return total; }
      total.taskCount += 1; total.target += row.target; total.completed += row.completed; total.partial += row.partial; total.missing += row.missing;
      return total;
    }, { taskCount: 0, target: 0, completed: 0, partial: 0, missing: 0, ongoing: 0, checkinTarget: 0, checkinCompleted: 0 });
    const seen = new Set<string>();
    const taskGroups = tasks.flatMap<Record<string, unknown>>(row => {
      if (seen.has(row.seriesId)) return [];
      seen.add(row.seriesId);
      const phases = tasks.filter(item => item.seriesId === row.seriesId).sort((a, b) => a.deadline.localeCompare(b.deadline));
      if (phases.length === 1) return [{ ...row, isSeries: false }];
      const upcomingIndex = phases.findIndex(phase => phase.ongoing);
      const nextIndex = upcomingIndex >= 0 ? upcomingIndex : phases.length - 1;
      const next = phases[nextIndex] || phases[phases.length - 1];
      const completed = phases.reduce((sum, phase) => sum + phase.completed, 0);
      const target = phases.reduce((sum, phase) => sum + phase.target, 0);
      return [{ id: row.seriesId, isSeries: true, title: row.title.replace(/ · 第\d+期$/, ''), kindLabel: row.kindLabel, classLabel: row.classLabel, phaseCount: phases.length,
        dateRange: `${phases[0].deadline.slice(5, 10)}—${phases[phases.length - 1].deadline.slice(5, 10)}`,
        nextLabel: `最近截止：第${nextIndex + 1}期 · ${next.deadline.slice(5)}`, completed, target }];
    });
    this.setData({ tasks, taskGroups, scopeSummary });
  },
  openSeries(event: WechatMiniprogram.BaseEvent) { const id = String(event.currentTarget.dataset.id); if (id) wx.navigateTo({ url: `/pages/teacher/homework-series/index?seriesId=${encodeURIComponent(id)}` }); },
  refreshDraft() {
    const draft = this.data.draft;
    const allowed = scopeClassIds(this.data.scope);
    const matches = DEMO_STUDENTS.filter(student => allowed.includes(student.classId) && draft.classIds.includes(student.classId) && (!this.data.studentSearch || `${student.name}${student.id}${DEMO_CLASSES.find(row => row.id === student.classId)?.name || ''}`.includes(this.data.studentSearch)));
    this.setData({ classes: DEMO_CLASSES.filter(row => allowed.includes(row.id)).map(row => ({ ...row, selected: draft.classIds.includes(row.id) })), studentOptions: matches.map(student => ({ ...student, className: DEMO_CLASSES.find(row => row.id === student.classId)?.name || '', selected: draft.targetStudentIds.includes(student.id) })), draftItems: draft.items.map(item => ({ ...item, submitLabel: item.submitType === 'none' ? '家长确认完成' : `上传${SUBMIT_LABEL[item.submitType]}`, submitIndex: TYPES.indexOf(item.submitType) })), deadlineDate: draft.deadline.split(' ')[0], deadlineTime: draft.deadline.split(' ')[1] || '20:00', submitDeadlineDate: draft.submitDeadline.split(' ')[0], submitDeadlineTime: draft.submitDeadline.split(' ')[1] || '20:00' });
  },
  startCompose() { if (this.data.readOnly) return; this.setData({ mode: 'compose', draft: this.data.hasDraft ? this.data.draft : emptyDraft(scopeClassIds(this.data.scope)[0] || TEACHER_CLASSES[0].id), composeStep: this.data.hasDraft ? this.data.composeStep : 0, composeError: '', studentSearch: '', previewOpen: false, hasDraft: true }); this.refreshDraft(); },
  backCompose() { if (this.data.composeStep > 0) this.setData({ composeStep: this.data.composeStep - 1, composeError: '' }); else this.backToList(); },
  nextCompose() {
    if (this.data.recognitionStale && this.data.settingMode === 'individual' && (this.data.recognizedCount > 0 || this.data.draft.items.length > 1)) { this.setData({ composeError: '内容已修改，请先确认重新识别，避免覆盖逐条设置' }); return; }
    if (this.data.recognitionStale) this.applyRecognition();
    const draft = this.data.draft;
    const step = this.data.composeStep;
    let error = '';
    if (step === 0) {
      if (!draft.title.trim()) error = '请填写作业名称';
      else if (!draft.description.trim() && !draft.materialPhoto) error = '请写布置说明或添加照片';
      else if (!draft.deadline || Number.isNaN(new Date(draft.deadline.replace(' ', 'T')).getTime()) || new Date(draft.deadline.replace(' ', 'T')).getTime() <= Date.now()) error = '截止时间请选择未来的日期和时间';
      else if (!draft.submitDeadline || new Date(draft.submitDeadline.replace(' ', 'T')).getTime() <= new Date(draft.deadline.replace(' ', 'T')).getTime()) error = '补交截止时间必须晚于原截止时间';
    } else if (step === 1) {
      if (!draft.classIds.length) error = '请至少选择一个班级';
      else if (draft.targetMode === 'selected' && !draft.targetStudentIds.length) error = '请选择要接收作业的学生';
    }
    if (error) { this.setData({ composeError: error }); return; }
    this.setData({ composeError: '' });
    if (step < 1) this.setData({ composeStep: step + 1 }); else this.previewPublish();
  },
  returnToHomeworkHome() { this.setData({ fromSeries: false, mode: 'list', previewOpen: false, selectedTask: null, summary: null }); this.refreshList(); },
  backToList() { if (this.data.fromSeries) { wx.navigateBack({ delta: 1 }); return; } this.setData({ mode: 'list', previewOpen: false, selectedTask: null, summary: null }); this.refreshList(); },
  openLearning() { if (this.data.mode === 'list') wx.redirectTo({ url: '/pages/teacher/learning/index' }); },
  openDetail(event: WechatMiniprogram.BaseEvent) { this.openTask(String(event.currentTarget.dataset.id)); },
  openTask(taskId: string) {
    const profile = getSession()?.profile;
    const task = getHomeworkTask(taskId);
    if (profile && task && taskInScope(task, this.data.scope, profile.userId)) {
      const visibleTask = scopedHomeworkTask(task, this.data.scope);
      this.setData({ mode: 'detail', selectedTask: visibleTask, canReview: this.data.scope.view !== 'school' && task.publishedBy === profile.userId, summary: summarizeHomework(visibleTask), wrongCount: getTaskStudentRows(visibleTask).filter(row => row.wrongQuestions.length).length });
    }
  },
  openStudentList(event: WechatMiniprogram.BaseEvent) {
    const task = this.data.selectedTask;
    if (!task) return;
    const filter = String(event.currentTarget.dataset.filter || 'all');
    const questionId = String(event.currentTarget.dataset.question || '');
    const titles: Record<string, string> = { all: '全部学生', completed: '已完成学生', partial: '部分提交学生', missing: '未提交学生', wrong: '做错学生', questionWrong: '本题做错学生' };
    const rows = getTaskStudentRows(task).filter(row => filter === 'all' || filter === 'wrong' && row.wrongQuestions.length > 0 || filter === 'questionWrong' && row.wrongQuestions.some(question => question.id === questionId) || row.status === filter);
    this.setData({ mode: 'students', studentFilter: filter, studentListTitle: titles[filter] || '学生名单', studentRows: rows.map(row => ({ id: row.student.id, name: row.student.name, className: DEMO_CLASSES.find(item => item.id === row.student.classId)?.name || '', statusLabel: row.status === 'missing' ? '未提交' : row.status === 'partial' ? '部分提交' : '已完成', progress: `${row.submissions.length}/${task.items.length} 项`, wrongCount: row.wrongQuestions.length, latestSubmittedAt: row.latestSubmittedAt || '尚无提交时间' })) });
  },
  openStudent(event: WechatMiniprogram.BaseEvent) {
    const task = this.data.selectedTask;
    if (!task) return;
    const row = getTaskStudentRows(task).find(item => item.student.id === event.currentTarget.dataset.id);
    if (!row) return;
    const schoolReadOnly = this.data.scope.view === 'school';
    const status = row.status === 'missing' ? '未提交' : row.status === 'partial' ? '部分提交' : '已完成';
    this.setData({ mode: 'student', selectedStudentName: row.student.name, selectedStudentMeta: `${DEMO_CLASSES.find(item => item.id === row.student.classId)?.name || ''} · ${status} · 已交 ${row.submissions.length}/${task.items.length} 项 · 做错 ${row.wrongQuestions.length} 题`, studentItems: task.items.map(item => {
      const record = row.submissions.find(submission => submission.itemId === item.id);
      return { id: item.id, title: item.title, submitLabel: SUBMIT_LABEL[item.submitType], submitted: Boolean(record), submittedAt: record?.submittedAt || '', late: Boolean(record?.late), version: record?.version || 1, operatorLabel: record?.operatorName ? `${record.operatorName}${record.operatorId ? `（${record.operatorId}）` : ''}` : '历史演示数据未记录操作账号', mediaLabel: schoolReadOnly ? '' : record?.mediaLabel || '', mediaPath: schoolReadOnly ? '' : record?.mediaPath || '', isPhoto: !schoolReadOnly && item.submitType === 'photo', isVideo: !schoolReadOnly && item.submitType === 'video', isAudio: !schoolReadOnly && item.submitType === 'audio', isMock: !schoolReadOnly && Boolean(record?.isMock), questions: (record?.questions || []).map(question => ({ id: question.id, label: question.label, answer: question.answer || '暂无标准答案', studentAnswer: question.studentAnswer || '未提供', reviewCount: question.reviewHistory?.length || 0, reviewHistory: (question.reviewHistory || []).map(history => ({ at: history.at.replace('T', ' ').slice(0, 16), result: history.correct ? '改判为正确' : '改判为错误', reason: history.reason, reviewer: history.reviewerId })), result: question.state === 'review' ? '待复核' : question.state === 'unreadable' ? '识别不清' : question.state === 'no-answer' ? '无答案' : question.correct ? '正确' : '做错' })) };
    }) });
  },
  backToStudents() { this.setData({ mode: 'students' }); },
  backToStats() { this.setData({ mode: 'detail' }); },
  previewOriginal(event: WechatMiniprogram.BaseEvent) { if (this.data.scope.view === 'school') return; const path = event.currentTarget.dataset.path as string; if (path) wx.previewImage({ urls: [path], current: path }); },
  changeTitle(event: WechatMiniprogram.CustomEvent<{ value: string }>) { this.setData({ draft: { ...this.data.draft, title: event.detail.value } }); },
  changeDescription(event: WechatMiniprogram.CustomEvent<{ value: string }>) { this.setData({ draft: { ...this.data.draft, description: event.detail.value }, recognitionStale: true, demoPasteActive: false }); },
  fillDemoPaste() {
    const apply = () => {
      this.setData({ draft: { ...this.data.draft, title: this.data.draft.title.trim() || '周末综合实践作业', description: DEMO_PASTE }, settingMode: 'individual', demoPasteActive: true, hasDraft: true, composeError: '' });
      this.applyRecognition();
    };
    if (this.data.draft.description.trim()) wx.showModal({ title: '填入演示内容', content: '将替换当前任务描述，是否继续？', success: result => { if (result.confirm) apply(); } });
    else apply();
  },
  recognizeDescription() {
    if (this.data.recognitionStale && this.data.settingMode === 'individual' && (this.data.recognizedCount > 0 || this.data.draft.items.length > 1)) return;
    this.applyRecognition();
  },
  applyRecognition() {
    const texts = recognizeItems(this.data.draft.description);
    const old = this.data.draft.items;
    const items = texts.length ? texts.map((text, index) => ({ ...createItem(index), title: text, instruction: '按上述要求完成', submitType: old.find(item => item.title === text)?.submitType || this.data.uniformType })) : [{ ...createItem(0), title: '题目照片', instruction: '按照片要求完成', submitType: this.data.uniformType }];
    this.setData({ draft: { ...this.data.draft, items }, recognizedCount: texts.length > 1 ? texts.length : 0, recognitionStale: false });
    this.refreshDraft();
  },
  changeSettingMode(event: WechatMiniprogram.BaseEvent) { this.setData({ settingMode: String(event.currentTarget.dataset.mode) }); },
  selectUniformType(event: WechatMiniprogram.BaseEvent) {
    const type = String(event.currentTarget.dataset.type) as SubmitType;
    if (!TYPES.includes(type)) return;
    this.setData({ uniformType: type, uniformTypeIndex: TYPES.indexOf(type), draft: { ...this.data.draft, items: this.data.draft.items.map(item => ({ ...item, submitType: type })) } });
    this.refreshDraft();
  },
  selectItemType(event: WechatMiniprogram.BaseEvent) {
    const index = Number(event.currentTarget.dataset.index);
    const type = String(event.currentTarget.dataset.type) as SubmitType;
    if (!TYPES.includes(type)) return;
    const items = this.data.draft.items.map((item, offset) => offset === index ? { ...item, submitType: type } : item);
    this.setData({ draft: { ...this.data.draft, items } });
    this.refreshDraft();
  },
  changeUniformType(event: WechatMiniprogram.CustomEvent<{ value: string }>) {
    const type = TYPES[Number(event.detail.value)] || 'photo';
    this.setData({ uniformType: type, uniformTypeIndex: TYPES.indexOf(type), draft: { ...this.data.draft, items: this.data.draft.items.map(item => ({ ...item, submitType: type })) } });
    this.refreshDraft();
  },
  chooseMaterialPhoto() {
    wx.showActionSheet({ itemList: ['手机相册或拍照', '微信聊天记录中的图片'], success: result => {
      if (result.tapIndex === 0) {
        wx.chooseMedia({ count: 1, mediaType: ['image'], sourceType: ['album', 'camera'], success: chosen => this.setMaterialPhoto(chosen.tempFiles[0]?.tempFilePath || '') });
      } else {
        wx.chooseMessageFile({ count: 1, type: 'image', success: chosen => this.setMaterialPhoto(chosen.tempFiles[0]?.path || '') });
      }
    } });
  },
  setMaterialPhoto(tempFilePath: string) {
    if (!tempFilePath) return;
    wx.getFileSystemManager().saveFile({ tempFilePath, success: saved => this.setData({ draft: { ...this.data.draft, materialPhoto: saved.savedFilePath }, composeError: '' }), fail: () => this.setData({ draft: { ...this.data.draft, materialPhoto: tempFilePath }, composeError: '' }) });
  },
  removeMaterialPhoto() { this.setData({ draft: { ...this.data.draft, materialPhoto: '' } }); },
  previewMaterialPhoto() { if (this.data.draft.materialPhoto) wx.previewImage({ urls: [this.data.draft.materialPhoto] }); },
  changeDeadlineDate(event: WechatMiniprogram.CustomEvent<{ value: string }>) { const deadline = `${event.detail.value} ${this.data.deadlineTime}`; this.setData({ draft: { ...this.data.draft, deadline, submitDeadline: addDays(deadline, 7) }, composeError: '' }); this.refreshDraft(); },
  changeDeadlineTime(event: WechatMiniprogram.CustomEvent<{ value: string }>) { const deadline = `${this.data.deadlineDate} ${event.detail.value}`; this.setData({ draft: { ...this.data.draft, deadline, submitDeadline: addDays(deadline, 7) }, composeError: '' }); this.refreshDraft(); },
  changeSubmitDeadlineDate(event: WechatMiniprogram.CustomEvent<{ value: string }>) { this.setData({ draft: { ...this.data.draft, submitDeadline: `${event.detail.value} ${this.data.submitDeadlineTime}` }, composeError: '' }); this.refreshDraft(); },
  changeSubmitDeadlineTime(event: WechatMiniprogram.CustomEvent<{ value: string }>) { this.setData({ draft: { ...this.data.draft, submitDeadline: `${this.data.submitDeadlineDate} ${event.detail.value}` }, composeError: '' }); this.refreshDraft(); },
  changeKind(event: WechatMiniprogram.BaseEvent) { this.setData({ draft: { ...this.data.draft, kind: event.currentTarget.dataset.kind as HomeworkKind } }); },
  changeSubject(event: WechatMiniprogram.CustomEvent<{ value: string }>) { this.setData({ draft: { ...this.data.draft, subject: SUBJECTS[Number(event.detail.value)] || '数学' } }); },
  changeCycleCount(event: WechatMiniprogram.CustomEvent<{ value: string }>) { const count = Number(event.detail.value); this.setData({ draft: { ...this.data.draft, cycleCount: Number.isFinite(count) ? Math.max(1, Math.min(30, Math.floor(count))) : 1 } }); },
  toggleClass(event: WechatMiniprogram.BaseEvent) {
    const id = event.currentTarget.dataset.id as string;
    if (!scopeClassIds(this.data.scope).includes(id)) return;
    const classIds = this.data.draft.classIds.includes(id) ? this.data.draft.classIds.filter(value => value !== id) : [...this.data.draft.classIds, id];
    this.setData({ draft: { ...this.data.draft, classIds, targetStudentIds: this.data.draft.targetStudentIds.filter(studentId => DEMO_STUDENTS.some(student => student.id === studentId && classIds.includes(student.classId))) } }); this.refreshDraft();
  },
  changeTargetMode(event: WechatMiniprogram.BaseEvent) { this.setData({ draft: { ...this.data.draft, targetMode: event.currentTarget.dataset.mode } }); this.refreshDraft(); },
  changeStudentSearch(event: WechatMiniprogram.CustomEvent<{ value: string }>) { this.setData({ studentSearch: event.detail.value.trim() }); this.refreshDraft(); },
  toggleStudent(event: WechatMiniprogram.BaseEvent) {
    const id = event.currentTarget.dataset.id as string;
    const ids = this.data.draft.targetStudentIds;
    this.setData({ draft: { ...this.data.draft, targetStudentIds: ids.includes(id) ? ids.filter(value => value !== id) : [...ids, id] } }); this.refreshDraft();
  },
  addItem() { this.setData({ draft: { ...this.data.draft, items: [...this.data.draft.items, { ...createItem(this.data.draft.items.length), title: '补充要求', instruction: '按要求完成', submitType: this.data.uniformType }] }, demoPasteActive: false }); this.refreshDraft(); },
  removeItem(event: WechatMiniprogram.BaseEvent) { if (this.data.draft.items.length === 1) return; this.setData({ draft: { ...this.data.draft, items: this.data.draft.items.filter((_, index) => index !== Number(event.currentTarget.dataset.index)) }, demoPasteActive: false }); this.refreshDraft(); },
  changeItemTitle(event: WechatMiniprogram.CustomEvent<{ value: string }>) { const index = Number(event.currentTarget.dataset.index); const items = this.data.draft.items.map((item, offset) => offset === index ? { ...item, title: event.detail.value } : item); this.setData({ draft: { ...this.data.draft, items }, demoPasteActive: false }); this.refreshDraft(); },
  changeItemInstruction(event: WechatMiniprogram.CustomEvent<{ value: string }>) { const index = Number(event.currentTarget.dataset.index); const items = this.data.draft.items.map((item, offset) => offset === index ? { ...item, instruction: event.detail.value } : item); this.setData({ draft: { ...this.data.draft, items }, demoPasteActive: false }); this.refreshDraft(); },
  changeItemType(event: WechatMiniprogram.CustomEvent<{ value: string }>) { const index = Number(event.currentTarget.dataset.index); const type = TYPES[Number(event.detail.value)]; if (!type) return; const items = this.data.draft.items.map((item, offset) => offset === index ? { ...item, submitType: type } : item); this.setData({ draft: { ...this.data.draft, items }, demoPasteActive: false }); this.refreshDraft(); },
  previewPublish() {
    if (this.data.readOnly) return;
    const draft = this.data.draft;
    if (this.data.recognitionStale) { this.setData({ composeError: '请先重新识别作业内容' }); return; }
    if (!draft.title.trim() || !draft.classIds.length || !draft.deadline.trim() || !draft.submitDeadline.trim() || new Date(draft.submitDeadline.replace(' ', 'T')).getTime() <= new Date(draft.deadline.replace(' ', 'T')).getTime() || !draft.description.trim() && !draft.materialPhoto || draft.items.some(item => !item.title.trim() || !item.instruction.trim()) || draft.targetMode === 'selected' && !draft.targetStudentIds.length) { this.setData({ composeError: '请检查尚未填写的内容和补交截止时间' }); return; }
    const previewTargetCount = draft.targetMode === 'selected' ? draft.targetStudentIds.length : DEMO_STUDENTS.filter(student => draft.classIds.includes(student.classId)).length;
    this.setData({ previewOpen: true, previewTargetCount, previewClasses: draft.classIds.map(id => DEMO_CLASSES.find(row => row.id === id)?.name || id).join('、'), previewStudents: draft.targetMode === 'selected' ? DEMO_STUDENTS.filter(row => draft.targetStudentIds.includes(row.id)).map(row => row.name).join('、') : '所选班级全体', previewItems: draft.items.map(item => ({ id: item.id, title: item.title, instruction: item.instruction, type: item.submitType === 'none' ? '家长确认完成' : `上传${SUBMIT_LABEL[item.submitType]}` })) });
  },
  closePreview() { this.setData({ previewOpen: false }); },
  confirmPublish() {
    if (this.data.readOnly || this.data.publishing) return;
    const draft = this.data.draft;
    if (!draft.classIds.length || !draft.classIds.every(id => scopeClassIds(this.data.scope).includes(id))) { wx.showToast({ title: '接收班级不在当前授权范围', icon: 'none' }); return; }
    this.setData({ publishing: true });
    publishHomework({ title: draft.title.trim(), description: draft.description.trim(), materialPhoto: draft.materialPhoto, kind: draft.kind, subject: draft.subject, cycleCount: draft.cycleCount, classIds: draft.classIds, targetStudentIds: draft.targetMode === 'selected' ? draft.targetStudentIds : null, items: draft.items.map(item => ({ ...item, title: item.title.trim() })), deadline: draft.deadline, submitDeadline: draft.submitDeadline, parentVisible: false, publishedBy: getSession()?.profile.userId });
    this.setData({ hasDraft: false, composeStep: 0 });
    this.setData({ mode: 'success', previewOpen: false, publishing: false, publishedTitle: draft.title, publishedTargetCount: draft.targetMode === 'selected' ? draft.targetStudentIds.length : DEMO_STUDENTS.filter(student => draft.classIds.includes(student.classId)).length, publishedClasses: draft.classIds.map(id => DEMO_CLASSES.find(row => row.id === id)?.name || id).join('、'), publishedDeadline: draft.deadline, publishedSubmitDeadline: draft.submitDeadline, publishedItemCount: draft.items.length });
  },
  confirmReview(event: WechatMiniprogram.BaseEvent) {
    if (!this.data.canReview) return;
    const task = this.data.selectedTask;
    if (!task) return;
    wx.showModal({ title: '填写改判原因', editable: true, placeholderText: '例如：识别结果与原图不一致', confirmText: '确认改判', success: result => {
      const reason = String(result.content || '').trim();
      if (!result.confirm) return;
      if (!reason) { wx.showToast({ title: '请填写改判原因', icon: 'none' }); return; }
      if (confirmMockReview(task.id, event.currentTarget.dataset.id as string, event.currentTarget.dataset.correct === 'true', reason, getSession()?.profile.userId || 'teacher')) {
        this.setData({ summary: summarizeHomework(task), wrongCount: getTaskStudentRows(task).filter(row => row.wrongQuestions.length).length });
        wx.showToast({ title: '已改判并保留记录', icon: 'success' });
      }
    } });
  },
});
