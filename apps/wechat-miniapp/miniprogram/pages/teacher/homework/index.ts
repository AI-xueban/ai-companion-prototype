import { getSession } from '../../../stores/session';
import { DEMO_CLASSES, DEMO_STUDENTS, SUBMIT_LABEL, confirmMockReview, getHomeworkTask, getTaskStudentRows, listHomeworkTasks, publishHomework, summarizeHomework } from '../../../services/homeworkMock';
import type { HomeworkAttachment, HomeworkItem, HomeworkKind, SubmitType } from '../../../services/homeworkMock';
import { availableWorkViews, homeworkScopeSubtitle, scopeClassIds, scopedHomeworkTask, selectWorkClass, taskInScope, workScope, teachingSubjectOptions, subjectClassIds, publishingClassIds } from '../../../services/workbenchScope';
import type { WorkScope } from '../../../services/workbenchScope';
import { returnToHomeworkModuleHome } from '../../../services/moduleNavigation';
import { formatHomeworkTitle } from '../../../services/schoolDemoRoster';

const TYPES: SubmitType[] = ['file', 'photo', 'video', 'none'];
const TEACHER_CLASSES = DEMO_CLASSES.filter(row => row.id === 'c1' || row.id === 'c2');
type DraftItem = Omit<HomeworkItem, 'submitType'> & { submitType: SubmitType | '' };
const createItem = (index: number): DraftItem => ({ id: `item-${Date.now()}-${index}`, title: '', instruction: '', submitType: '', required: true });
const defaultDeadline = () => { const date = new Date(Date.now() + 2 * 86400000); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} 20:00`; };
const addDays = (value: string, days: number) => { const date = new Date(value.replace(' ', 'T')); date.setDate(date.getDate() + days); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`; };
const formatDateTime = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
const displayDateTime = (value: string) => { const date = new Date(value.replace(' ', 'T')); return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 周${'日一二三四五六'[date.getDay()]} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`; };
const calendarFor = (value: string) => { const date = new Date(value.replace(' ', 'T')); const year = date.getFullYear(), month = date.getMonth(); const offset = (new Date(year, month, 1).getDay() + 6) % 7; const count = new Date(year, month + 1, 0).getDate(); return { title: `${year}年${month + 1}月`, days: [...Array.from({ length: offset }, (_, index) => ({ key: `empty-${index}`, day: 0, empty: true, selected: false })), ...Array.from({ length: count }, (_, index) => ({ key: `day-${index + 1}`, day: index + 1, empty: false, selected: date.getDate() === index + 1 }))] }; };
const emptyDraft = (classId: string) => { const deadline = defaultDeadline(); return { title: '', description: '', materialPhoto: '', attachments: [] as HomeworkAttachment[], kind: 'homework' as HomeworkKind, subject: '数学', cycleCount: 1, classIds: [classId], targetStudentIds: [] as string[], targetMode: 'all', items: [createItem(0)], deadline, submitDeadline: addDays(deadline, 7), parentVisible: false }; };
const teacherDraftKey = (userId: string) => `ai_companion_teacher_homework_draft_v1:${userId}`;
interface SavedTeacherDraft { draft: ReturnType<typeof emptyDraft>; composeStep: number; settingMode: string; uniformType: SubmitType | ''; recognizedCount: number; recognitionStale: boolean }
const DEMO_PASTE = '本周复习：回顾课堂知识\n📚作业：\n1. 完成数学练习第 3 页，拍照上传答题页\n2. 选择一道错题，录制 1 分钟讲解视频\n3. 填写练习文档并上传文件\n4. 完成 20 分钟课外阅读，由家长确认';

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
    detailStatus: '', detailStatusTone: 'ended', detailClassLabel: '', detailOngoing: false, detailCanSupplement: false, descriptionOpen: false,
    studentFilter: 'all',
    studentListTitle: '',
    studentRows: [] as Array<{ id: string; name: string; className: string; statusLabel: string; progress: string; wrongCount: number; latestSubmittedAt: string }>,
    selectedStudentName: '',
    selectedStudentMeta: '',
    studentItems: [] as Array<{ id: string; title: string; submitLabel: string; submitted: boolean; submittedAt: string; late: boolean; version: number; operatorLabel: string; mediaLabel: string; mediaPath: string; isPhoto: boolean; isVideo: boolean; isAudio: boolean; isMock: boolean; questions: Array<{ id: string; label: string; result: string; answer: string; studentAnswer: string; reviewCount: number; reviewHistory: Array<{ at: string; result: string; reason: string; reviewer: string }> }> }>,
    draft: emptyDraft(TEACHER_CLASSES[0].id),
    classes: [] as Array<{ id: string; name: string; selected: boolean }>,
    studentGroups: [] as Array<{ id: string; name: string; selectedCount: number; total: number; students: Array<{ id: string; name: string; selected: boolean }> }>,
    studentOptions: [] as Array<{ id: string; name: string; className: string; selected: boolean }>,
    studentSearch: '',
    draftItems: [] as Array<DraftItem & { submitLabel: string; submitIndex: number }>,
    composeStep: 0,
    settingMode: 'uniform',
    uniformType: '' as SubmitType | '',
    uniformTypeIndex: 0,
    recognizedCount: 0,
    recognitionStale: false,
    demoPasteActive: false,
    composeError: '',
    hasDraft: false,
    attachmentSaving: false,
    deadlineDate: '', deadlineTime: '', submitDeadlineDate: '', submitDeadlineTime: '',
    submitTypeOptions: ['上传文件', '上传图片', '上传视频', '家长确认完成'],
    expandedItemIndex: 0,
    datePickerOpen: false, datePickerTarget: '' as 'deadline' | 'submitDeadline' | '', datePickerValue: '', calendarTitle: '',
    calendarDays: [] as Array<{ key: string; day: number; empty: boolean; selected: boolean }>, weekdays: ['一', '二', '三', '四', '五', '六', '日'],
    hourOptions: Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0')), minuteOptions: Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0')),
    pickerHour: '20', pickerMinute: '00', pickerHourIndex: 20, pickerMinuteIndex: 0, deadlineDisplay: '', submitDeadlineDisplay: '', previewTargetCount: 0,
    subjectOptions: [] as string[], subjectIndex: 0,
    publishedTitle: '', publishedTargetCount: 0, publishedClasses: '', publishedDeadline: '', publishedSubmitDeadline: '', publishedItemCount: 0,
    publishing: false,
    previewOpen: false,
    previewClasses: '', previewStudents: '', previewItems: [] as Array<{ id: string; title: string; instruction: string; type: string }>,
  },
  onLoad(options: { taskId?: string; fromSeries?: string }) {
    const session = getSession();
    if (!session?.profile || !session.expiresAt || session.expiresAt <= Date.now() || !availableWorkViews(session.profile).length) { wx.reLaunch({ url: '/pages/auth/login/index' }); return; }
    const classId = workScope(session.profile).classId === 'c2' ? 'c2' : 'c1';
    this.setData({ draft: emptyDraft(classId), entryTaskId: options.taskId || '', fromSeries: options.fromSeries === '1' });
    const saved = wx.getStorageSync(teacherDraftKey(session.profile.userId)) as SavedTeacherDraft | undefined;
    const allowed = publishingClassIds(session.profile, workScope(session.profile));
    if (saved?.draft && Array.isArray(saved.draft.classIds) && Array.isArray(saved.draft.items) && saved.draft.classIds.every(id => allowed.includes(id))) {
      if (!Array.isArray(saved.draft.attachments)) saved.draft.attachments = saved.draft.materialPhoto ? [{ id: 'legacy-material', name: '题目图片', type: 'image', path: saved.draft.materialPhoto, size: 0, source: '历史草稿' }] : [];
      saved.draft.materialPhoto = '';
      this.setData({ draft: saved.draft, composeStep: saved.composeStep === 1 ? 1 : 0, settingMode: saved.settingMode === 'individual' ? 'individual' : 'uniform', uniformType: saved.uniformType && TYPES.includes(saved.uniformType) ? saved.uniformType : '', recognizedCount: saved.recognizedCount || 0, recognitionStale: Boolean(saved.recognitionStale), hasDraft: true });
    }
    this.refreshDraft();
  },
  onShow() {
    const session = getSession();
    if (!session?.profile || !session.expiresAt || session.expiresAt <= Date.now() || !availableWorkViews(session.profile).length) { wx.reLaunch({ url: '/pages/auth/login/index' }); return; }
    const scope = workScope(session.profile);
    const allowedClasses = scopeClassIds(scope);
    const keepDraft = this.data.hasDraft && this.data.draft.classIds.every(id => publishingClassIds(session.profile, scope).includes(id));
    this.setData({ scope, scopeLabel: homeworkScopeSubtitle(scope), readOnly: scope.view === 'school', mode: keepDraft && this.data.mode === 'compose' && scope.view !== 'school' ? 'compose' : 'list', selectedTask: null, previewOpen: false,
      hasDraft: keepDraft, draft: keepDraft ? this.data.draft : emptyDraft(allowedClasses[0] || 'c1'), composeStep: keepDraft ? this.data.composeStep : 0,
      scopeClasses: DEMO_CLASSES.filter(row => scopeClassIds({ ...scope, classId: 'all' }).includes(row.id)).map(row => ({ id: row.id, name: row.name, selected: row.id === scope.classId })) });
    this.refreshList();
    this.refreshDraft();
    if (this.data.entryTaskId) this.openTask(this.data.entryTaskId);
  },
  onHide() { this.saveTeacherDraft(); },
  onUnload() { this.saveTeacherDraft(); },
  saveTeacherDraft() {
    const userId = getSession()?.profile.userId;
    if (!userId || !this.data.hasDraft) return;
    const { draft, composeStep, settingMode, uniformType, recognizedCount, recognitionStale } = this.data;
    wx.setStorageSync(teacherDraftKey(userId), { draft, composeStep, settingMode, uniformType, recognizedCount, recognitionStale } as SavedTeacherDraft);
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
      const ongoing = new Date(task.deadline.replace(' ', 'T')).getTime() > Date.now();
      return { id: task.id, seriesId: task.seriesId || task.id, title: task.title, kind: task.kind, kindLabel: task.kind === 'checkin' ? '打卡' : '作业', classLabel: visibleTask.classIds.map(id => DEMO_CLASSES.find(row => row.id === id)?.name).join('、'), publishedAt: task.publishedAt || '历史记录未保存', deadline: task.deadline, submitDeadline: task.submitDeadline, ongoing, statusLabel: summary.target > 0 && summary.completed === summary.target ? '全部完成' : ongoing ? '待完成' : new Date(task.submitDeadline.replace(' ', 'T')).getTime() > Date.now() ? '待完成 · 可补交' : '已结束 · 未完成', target: summary.target, completed: summary.completed, partial: summary.partial, missing: summary.missing, completionRate: summary.completionRate };
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
        publishedAt: phases[0].publishedAt, deadline: phases[phases.length - 1].deadline, ongoing: upcomingIndex >= 0,
        dateRange: `${phases[0].deadline.slice(0, 10)} — ${phases[phases.length - 1].deadline.slice(0, 10)}`,
        nextLabel: `${upcomingIndex >= 0 ? '最近截止' : '最后截止'}：第${nextIndex + 1}期 · ${next.deadline}`, completed, target }];
    });
    taskGroups.sort((a, b) => Number(Boolean(b.ongoing)) - Number(Boolean(a.ongoing)) || String(b.deadline).localeCompare(String(a.deadline)));
    let previousSection = '';
    taskGroups.forEach(group => { const section = group.ongoing ? '当前任务' : '历史任务'; group.sectionLabel = section === previousSection ? '' : section; previousSection = section; });
    this.setData({ tasks, taskGroups, scopeSummary });
  },
  openSeries(event: WechatMiniprogram.BaseEvent) { const id = String(event.currentTarget.dataset.id); if (id) wx.navigateTo({ url: `/pages/teacher/homework-series/index?seriesId=${encodeURIComponent(id)}` }); },
  refreshDraft() {
    const profile = getSession()?.profile;
    const subjectOptions = profile ? teachingSubjectOptions(profile, this.data.scope) : [];
    const subject = subjectOptions.includes(this.data.draft.subject) ? this.data.draft.subject : subjectOptions[0] || '';
    const allowed = profile ? subjectClassIds(profile, this.data.scope, subject) : [];
    const selected = this.data.draft.classIds.filter(id => allowed.includes(id));
    const classIds = !selected.length && this.data.draft.subject !== subject ? allowed.slice(0, 1) : selected;
    const draft = { ...this.data.draft, subject, title: formatHomeworkTitle(subject, this.data.draft.kind), classIds, targetStudentIds: this.data.draft.targetStudentIds.filter(id => DEMO_STUDENTS.some(student => student.id === id && classIds.includes(student.classId))) };
    this.setData({ draft, subjectOptions, subjectIndex: Math.max(0, subjectOptions.indexOf(subject)) });
    const matches = DEMO_STUDENTS.filter(student => allowed.includes(student.classId) && draft.classIds.includes(student.classId) && (!this.data.studentSearch || `${student.name}${student.id}${DEMO_CLASSES.find(row => row.id === student.classId)?.name || ''}`.includes(this.data.studentSearch)));
    this.setData({ studentGroups: DEMO_CLASSES.filter(row => draft.classIds.includes(row.id)).map(row => ({ id: row.id, name: row.name, total: DEMO_STUDENTS.filter(student => student.classId === row.id).length, selectedCount: draft.targetStudentIds.filter(id => DEMO_STUDENTS.some(student => student.id === id && student.classId === row.id)).length, students: matches.filter(student => student.classId === row.id).map(student => ({ ...student, selected: draft.targetStudentIds.includes(student.id) })) })).filter(group => group.students.length > 0), classes: DEMO_CLASSES.filter(row => allowed.includes(row.id)).map(row => ({ ...row, selected: draft.classIds.includes(row.id) })), studentOptions: matches.map(student => ({ ...student, className: DEMO_CLASSES.find(row => row.id === student.classId)?.name || '', selected: draft.targetStudentIds.includes(student.id) })), draftItems: draft.items.map(item => ({ ...item, submitLabel: item.submitType === 'none' ? '线下完成' : item.submitType ? SUBMIT_LABEL[item.submitType] : '请选择', submitIndex: item.submitType ? TYPES.indexOf(item.submitType) : -1 })), deadlineDate: draft.deadline.split(' ')[0], deadlineTime: draft.deadline.split(' ')[1] || '20:00', submitDeadlineDate: draft.submitDeadline.split(' ')[0], submitDeadlineTime: draft.submitDeadline.split(' ')[1] || '20:00', deadlineDisplay: displayDateTime(draft.deadline), submitDeadlineDisplay: displayDateTime(draft.submitDeadline), previewTargetCount: DEMO_STUDENTS.filter(student => draft.classIds.includes(student.classId)).length });
  },
  startCompose() { if (this.data.readOnly) return; this.setData({ mode: 'compose', draft: this.data.hasDraft ? this.data.draft : emptyDraft(scopeClassIds(this.data.scope)[0] || TEACHER_CLASSES[0].id), composeStep: this.data.hasDraft ? this.data.composeStep : 0, uniformType: this.data.hasDraft ? this.data.uniformType : '', settingMode: this.data.hasDraft ? this.data.settingMode : 'uniform', composeError: '', studentSearch: '', previewOpen: false, hasDraft: true }); this.refreshDraft(); },
  backCompose() { if (this.data.composeStep > 0) this.setData({ composeStep: this.data.composeStep - 1, composeError: '' }); else this.backToList(); },
  navigateBack() {
    if (this.data.previewOpen) { this.closePreview(); return; }
    if (this.data.mode === 'student') this.backToStudents();
    else if (this.data.mode === 'students') this.backToStats();
    else if (this.data.mode === 'compose') this.backCompose();
    else if (this.data.mode === 'success') this.returnToHomeworkHome();
    else this.backToList();
  },
  nextCompose() {
    if (this.data.attachmentSaving) return;
    this.refreshDraft();
    if (this.data.recognitionStale && this.data.settingMode === 'individual' && (this.data.recognizedCount > 0 || this.data.draft.items.length > 1)) { this.setData({ composeError: '内容已修改，请先确认重新识别，避免覆盖逐条设置' }); return; }
    if (this.data.recognitionStale) this.applyRecognition();
    const draft = this.data.draft;
    const step = this.data.composeStep;
    let error = '';
    if (step === 0) {
      if (!this.data.subjectOptions.includes(draft.subject)) error = '暂无可发布学科，请核对任教关系';
      else if (!draft.description.trim() && !draft.attachments.length) error = '请填写任务描述或添加附件';
      else if (draft.items.some(item => !item.submitType || !TYPES.includes(item.submitType))) error = '请为每条要求选择提交方式';
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
  returnToHomeworkHome() { this.saveTeacherDraft(); this.setData({ fromSeries: false, entryTaskId: '', mode: 'list', previewOpen: false, selectedTask: null, summary: null, datePickerOpen: false }); returnToHomeworkModuleHome(); this.refreshList(); },
  backToList() { if (this.data.fromSeries) { wx.navigateBack({ delta: 1 }); return; } this.setData({ mode: 'list', previewOpen: false, selectedTask: null, summary: null }); this.refreshList(); },
  openLearning() { if (this.data.mode === 'list') wx.redirectTo({ url: '/pages/teacher/learning/index' }); },
  openDetail(event: WechatMiniprogram.BaseEvent) { this.openTask(String(event.currentTarget.dataset.id)); },
  openTask(taskId: string) {
    const profile = getSession()?.profile;
    const task = getHomeworkTask(taskId);
    if (profile && task && taskInScope(task, this.data.scope, profile.userId)) {
      const visibleTask = scopedHomeworkTask(task, this.data.scope);
      const ongoing = new Date(task.deadline.replace(' ', 'T')).getTime() > Date.now();
      const canSupplement = new Date(task.submitDeadline.replace(' ', 'T')).getTime() > Date.now();
      this.setData({ detailStatus: ongoing ? '进行中' : canSupplement ? '可补交' : '已结束', detailStatusTone: ongoing ? 'active' : canSupplement ? 'late' : 'ended', detailOngoing: ongoing, detailCanSupplement: canSupplement, descriptionOpen: false, detailClassLabel: visibleTask.classIds.map(id => DEMO_CLASSES.find(row => row.id === id)?.name || id).join('、') });
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
  toggleTaskDescription() { this.setData({ descriptionOpen: !this.data.descriptionOpen }); },
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
  changeDescription(event: WechatMiniprogram.CustomEvent<{ value: string }>) { this.setData({ draft: { ...this.data.draft, description: event.detail.value }, recognitionStale: true, demoPasteActive: false }); },
  fillDemoPaste() {
    const apply = () => {
      this.setData({ draft: { ...this.data.draft, description: DEMO_PASTE }, settingMode: 'individual', demoPasteActive: true, hasDraft: true, composeError: '' });
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
    const items = texts.length ? texts.map((text, index) => ({ ...createItem(index), title: text, instruction: '按上述要求完成', submitType: old.find(item => item.title === text)?.submitType || (this.data.settingMode === 'uniform' ? this.data.uniformType : '') })) : [{ ...createItem(0), title: '完成作业', instruction: '按任务要求完成', submitType: this.data.settingMode === 'uniform' ? this.data.uniformType : '' }];
    this.setData({ draft: { ...this.data.draft, items }, recognizedCount: texts.length > 1 ? texts.length : 0, recognitionStale: false });
    this.refreshDraft();
  },
  changeSettingMode(event: WechatMiniprogram.BaseEvent) { const mode = String(event.currentTarget.dataset.mode); const items = this.data.draft.items; const uniformType = mode === 'uniform' && this.data.settingMode !== mode ? (items.length && items.every(item => item.submitType === items[0].submitType) ? items[0].submitType : '') : this.data.uniformType; this.setData({ settingMode: mode, uniformType, expandedItemIndex: 0 }); },
  applyUniformToAll() { this.setData({ settingMode: 'uniform', draft: { ...this.data.draft, items: this.data.draft.items.map(item => ({ ...item, submitType: this.data.uniformType })) } }); this.refreshDraft(); },
  toggleItemOptions(event: WechatMiniprogram.BaseEvent) { const index = Number(event.currentTarget.dataset.index); this.setData({ expandedItemIndex: this.data.expandedItemIndex === index ? -1 : index }); },
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
    this.setData({ draft: { ...this.data.draft, items }, expandedItemIndex: -1 });
    this.refreshDraft();
  },
  openDatePicker(event: WechatMiniprogram.BaseEvent) {
    const target = String(event.currentTarget.dataset.target) as 'deadline' | 'submitDeadline';
    if (target !== 'deadline' && target !== 'submitDeadline') return;
    const value = this.data.draft[target], calendar = calendarFor(value), time = value.split(' ')[1] || '20:00';
    this.setData({ datePickerOpen: true, datePickerTarget: target, datePickerValue: value, calendarTitle: calendar.title, calendarDays: calendar.days, pickerHour: time.slice(0, 2), pickerMinute: time.slice(3, 5), pickerHourIndex: Number(time.slice(0, 2)), pickerMinuteIndex: Number(time.slice(3, 5)) });
  },
  closeDatePicker() { this.setData({ datePickerOpen: false, datePickerTarget: '' }); },
  stopDatePickerTap() {},
  updateDatePicker(value: string) { const calendar = calendarFor(value), time = value.split(' ')[1] || '20:00'; this.setData({ datePickerValue: value, calendarTitle: calendar.title, calendarDays: calendar.days, pickerHour: time.slice(0, 2), pickerMinute: time.slice(3, 5), pickerHourIndex: Number(time.slice(0, 2)), pickerMinuteIndex: Number(time.slice(3, 5)) }); },
  shiftDateMonth(event: WechatMiniprogram.BaseEvent) { const date = new Date(this.data.datePickerValue.replace(' ', 'T')); const day = date.getDate(); date.setDate(1); date.setMonth(date.getMonth() + Number(event.currentTarget.dataset.delta)); date.setDate(Math.min(day, new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate())); this.updateDatePicker(formatDateTime(date)); },
  chooseDateDay(event: WechatMiniprogram.BaseEvent) { const day = Number(event.currentTarget.dataset.day); if (!day) return; const date = new Date(this.data.datePickerValue.replace(' ', 'T')); date.setDate(day); this.updateDatePicker(formatDateTime(date)); },
  changePickerHour(event: WechatMiniprogram.CustomEvent<{ value: string }>) { const date = new Date(this.data.datePickerValue.replace(' ', 'T')); date.setHours(Number(event.detail.value)); this.updateDatePicker(formatDateTime(date)); },
  changePickerMinute(event: WechatMiniprogram.CustomEvent<{ value: string }>) { const date = new Date(this.data.datePickerValue.replace(' ', 'T')); date.setMinutes(Number(event.detail.value)); this.updateDatePicker(formatDateTime(date)); },
  confirmDatePicker() {
    const value = this.data.datePickerValue, selected = new Date(value.replace(' ', 'T')).getTime();
    if (!Number.isFinite(selected)) { wx.showToast({ title: '请选择有效时间', icon: 'none' }); return; }
    if (this.data.datePickerTarget === 'deadline' && selected <= Date.now()) { wx.showToast({ title: '首次截止须晚于当前时间', icon: 'none' }); return; }
    if (this.data.datePickerTarget === 'submitDeadline' && selected <= new Date(this.data.draft.deadline.replace(' ', 'T')).getTime()) { wx.showToast({ title: '补交截止须晚于首次截止', icon: 'none' }); return; }
    const draft = this.data.datePickerTarget === 'deadline' ? { ...this.data.draft, deadline: value, submitDeadline: addDays(value, 7) } : { ...this.data.draft, submitDeadline: value };
    this.setData({ draft, datePickerOpen: false, datePickerTarget: '', composeError: '' }); this.refreshDraft();
  },
  changeUniformType(event: WechatMiniprogram.CustomEvent<{ value: string }>) {
    const type = TYPES[Number(event.detail.value)] || 'photo';
    this.setData({ uniformType: type, uniformTypeIndex: TYPES.indexOf(type), draft: { ...this.data.draft, items: this.data.draft.items.map(item => ({ ...item, submitType: type })) } });
    this.refreshDraft();
  },
  chooseMaterialAttachment() {
    if (this.data.attachmentSaving) return;
    const failed = (error: { errMsg: string }) => { if (!error.errMsg.includes('cancel')) wx.showToast({ title: '未能读取附件，请重试', icon: 'none' }); };
    wx.showActionSheet({ itemList: ['手机相册 · 图片或视频', '拍照或拍摄视频', '微信聊天记录 · 图片、视频或文件'], success: result => {
      if (result.tapIndex === 2) {
        wx.chooseMessageFile({ count: 9, type: 'all', success: chosen => this.saveMaterialAttachments(chosen.tempFiles.map(file => ({ path: file.path, name: file.name, type: file.type === 'image' || /\.(png|jpe?g|webp|gif|bmp|heic)$/i.test(file.name) ? 'image' : file.type === 'video' || /\.(mp4|mov|m4v|webm)$/i.test(file.name) ? 'video' : 'file', size: file.size || 0, source: '微信聊天记录' }))), fail: failed });
      } else {
        const source = result.tapIndex === 0 ? '手机相册' : '拍照或拍摄';
        wx.chooseMedia({ count: 9, mediaType: ['image', 'video'], sourceType: [result.tapIndex === 0 ? 'album' : 'camera'], success: chosen => this.saveMaterialAttachments(chosen.tempFiles.map((file, index) => ({ path: file.tempFilePath, name: `${file.fileType === 'video' ? '视频' : '图片'}_${index + 1}.${file.tempFilePath.split('.').pop() || (file.fileType === 'video' ? 'mp4' : 'jpg')}`, type: file.fileType === 'video' ? 'video' : 'image', size: file.size || 0, source }))), fail: failed });
      }
    } });
  },
  async saveMaterialAttachments(files: Array<Omit<HomeworkAttachment, 'id'>>) {
    if (this.data.attachmentSaving) return;
    const valid = files.filter(file => {
      const limit = file.type === 'image' ? 20 : file.type === 'video' ? 200 : 50;
      return file.path && file.size <= limit * 1024 * 1024 && (file.type !== 'file' || /\.(pdf|docx?|pptx?|xlsx?|txt)$/i.test(file.name));
    });
    if (valid.length !== files.length) wx.showToast({ title: '部分附件格式不支持或超过大小限制', icon: 'none' });
    if (!valid.length) return;
    this.setData({ attachmentSaving: true }); wx.showLoading({ title: '正在添加附件', mask: true });
    const added: HomeworkAttachment[] = [];
    let failures = 0;
    for (const file of valid) {
      try {
        const path = await new Promise<string>((resolve, reject) => wx.getFileSystemManager().saveFile({ tempFilePath: file.path, success: saved => resolve(saved.savedFilePath), fail: reject }));
        added.push({ ...file, path, id: `attachment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` });
      } catch { failures++; }
    }
    this.setData({ draft: { ...this.data.draft, attachments: [...this.data.draft.attachments, ...added] }, attachmentSaving: false, composeError: '' });
    wx.hideLoading();
    if (!this.data.draft.items.some(item => item.title.trim())) this.applyRecognition();
    this.saveTeacherDraft();
    if (failures) wx.showToast({ title: '部分附件保存失败，请重新添加', icon: 'none' });
  },
  removeMaterialAttachment(event: WechatMiniprogram.CustomEvent<{ id: string }>) { this.setData({ draft: { ...this.data.draft, attachments: this.data.draft.attachments.filter(file => file.id !== event.detail.id) } }); this.saveTeacherDraft(); },
  changeDeadlineDate(event: WechatMiniprogram.CustomEvent<{ value: string }>) { const deadline = `${event.detail.value} ${this.data.deadlineTime}`; this.setData({ draft: { ...this.data.draft, deadline, submitDeadline: addDays(deadline, 7) }, composeError: '' }); this.refreshDraft(); },
  changeDeadlineTime(event: WechatMiniprogram.CustomEvent<{ value: string }>) { const deadline = `${this.data.deadlineDate} ${event.detail.value}`; this.setData({ draft: { ...this.data.draft, deadline, submitDeadline: addDays(deadline, 7) }, composeError: '' }); this.refreshDraft(); },
  changeSubmitDeadlineDate(event: WechatMiniprogram.CustomEvent<{ value: string }>) { this.setData({ draft: { ...this.data.draft, submitDeadline: `${event.detail.value} ${this.data.submitDeadlineTime}` }, composeError: '' }); this.refreshDraft(); },
  changeSubmitDeadlineTime(event: WechatMiniprogram.CustomEvent<{ value: string }>) { this.setData({ draft: { ...this.data.draft, submitDeadline: `${this.data.submitDeadlineDate} ${event.detail.value}` }, composeError: '' }); this.refreshDraft(); },
  changeKind(event: WechatMiniprogram.BaseEvent) { this.setData({ draft: { ...this.data.draft, kind: event.currentTarget.dataset.kind as HomeworkKind } }); this.refreshDraft(); },
  changeSubject(event: WechatMiniprogram.CustomEvent<{ value: string }>) { const subject = this.data.subjectOptions[Number(event.detail.value)]; const profile = getSession()?.profile; if (!subject || !profile) return; const allowed = subjectClassIds(profile, this.data.scope, subject); const selected = this.data.draft.classIds.filter(id => allowed.includes(id)); this.setData({ draft: { ...this.data.draft, subject, classIds: selected.length ? selected : allowed.slice(0, 1) } }); this.refreshDraft(); this.saveTeacherDraft(); },
  changeCycleCount(event: WechatMiniprogram.CustomEvent<{ value: string }>) { const count = Number(event.detail.value); this.setData({ draft: { ...this.data.draft, cycleCount: Number.isFinite(count) ? Math.max(1, Math.min(30, Math.floor(count))) : 1 } }); },
  toggleClass(event: WechatMiniprogram.BaseEvent) {
    const id = event.currentTarget.dataset.id as string;
    const profile = getSession()?.profile; if (!profile || !subjectClassIds(profile, this.data.scope, this.data.draft.subject).includes(id)) return;
    const classIds = this.data.draft.classIds.includes(id) ? this.data.draft.classIds.filter(value => value !== id) : [...this.data.draft.classIds, id];
    this.setData({ draft: { ...this.data.draft, classIds, targetStudentIds: this.data.draft.targetStudentIds.filter(studentId => DEMO_STUDENTS.some(student => student.id === studentId && classIds.includes(student.classId))) } }); this.refreshDraft();
  },
  changeTargetMode(event: WechatMiniprogram.BaseEvent) { this.setData({ draft: { ...this.data.draft, targetMode: event.currentTarget.dataset.mode } }); this.refreshDraft(); },
  changeStudentSearch(event: WechatMiniprogram.CustomEvent<{ value: string }>) { this.setData({ studentSearch: event.detail.value.trim() }); this.refreshDraft(); },
  toggleStudent(event: WechatMiniprogram.BaseEvent) {
    const id = event.currentTarget.dataset.id as string;
    if (!DEMO_STUDENTS.some(row => row.id === id && this.data.draft.classIds.includes(row.classId))) return;
    const ids = this.data.draft.targetStudentIds;
    this.setData({ draft: { ...this.data.draft, targetStudentIds: ids.includes(id) ? ids.filter(value => value !== id) : [...ids, id] } }); this.refreshDraft();
  },
  addItem() { this.setData({ draft: { ...this.data.draft, items: [...this.data.draft.items, { ...createItem(this.data.draft.items.length), title: '补充要求', instruction: '按要求完成', submitType: this.data.settingMode === 'uniform' ? this.data.uniformType : '' }] }, demoPasteActive: false }); this.refreshDraft(); },
  removeItem(event: WechatMiniprogram.BaseEvent) { if (this.data.draft.items.length === 1) return; this.setData({ draft: { ...this.data.draft, items: this.data.draft.items.filter((_, index) => index !== Number(event.currentTarget.dataset.index)) }, demoPasteActive: false }); this.refreshDraft(); },
  changeItemTitle(event: WechatMiniprogram.CustomEvent<{ value: string }>) { const index = Number(event.currentTarget.dataset.index); const items = this.data.draft.items.map((item, offset) => offset === index ? { ...item, title: event.detail.value } : item); this.setData({ draft: { ...this.data.draft, items }, demoPasteActive: false }); this.refreshDraft(); },
  changeItemInstruction(event: WechatMiniprogram.CustomEvent<{ value: string }>) { const index = Number(event.currentTarget.dataset.index); const items = this.data.draft.items.map((item, offset) => offset === index ? { ...item, instruction: event.detail.value } : item); this.setData({ draft: { ...this.data.draft, items }, demoPasteActive: false }); this.refreshDraft(); },
  changeItemType(event: WechatMiniprogram.CustomEvent<{ value: string }>) { const index = Number(event.currentTarget.dataset.index); const type = TYPES[Number(event.detail.value)]; if (!type) return; const items = this.data.draft.items.map((item, offset) => offset === index ? { ...item, submitType: type } : item); this.setData({ draft: { ...this.data.draft, items }, demoPasteActive: false }); this.refreshDraft(); },
  previewPublish() {
    this.refreshDraft();
    if (this.data.readOnly) return;
    const draft = this.data.draft;
    if (this.data.recognitionStale) { this.setData({ composeError: '请先重新识别作业内容' }); return; }
    if (!draft.title.trim() || !draft.classIds.length || !draft.deadline.trim() || !draft.submitDeadline.trim() || new Date(draft.submitDeadline.replace(' ', 'T')).getTime() <= new Date(draft.deadline.replace(' ', 'T')).getTime() || !draft.description.trim() && !draft.attachments.length || draft.items.some(item => !item.title.trim() || !item.instruction.trim()) || draft.targetMode === 'selected' && !draft.targetStudentIds.length) { this.setData({ composeError: '请检查尚未填写的内容和补交截止时间' }); return; }
    const previewTargetCount = draft.targetMode === 'selected' ? draft.targetStudentIds.length : DEMO_STUDENTS.filter(student => draft.classIds.includes(student.classId)).length;
    this.setData({ previewOpen: true, previewTargetCount, previewClasses: draft.classIds.map(id => DEMO_CLASSES.find(row => row.id === id)?.name || id).join('、'), previewStudents: draft.targetMode === 'selected' ? DEMO_STUDENTS.filter(row => draft.targetStudentIds.includes(row.id)).map(row => row.name).join('、') : '所选班级全体', previewItems: draft.items.map(item => ({ id: item.id, title: item.title, instruction: item.instruction, type: item.submitType === 'none' ? '家长确认完成' : `上传${item.submitType ? SUBMIT_LABEL[item.submitType] : ''}` })) });
  },
  closePreview() { this.setData({ previewOpen: false }); },
  confirmPublish() {
    if (this.data.readOnly || this.data.publishing) return;
    this.refreshDraft();
    const draft = this.data.draft;
    const profile = getSession()?.profile;
    const allowed = profile ? subjectClassIds(profile, this.data.scope, draft.subject) : [];
    if (!draft.classIds.length || !this.data.subjectOptions.includes(draft.subject) || !draft.classIds.every(id => allowed.includes(id))) { wx.showToast({ title: '学科或班级不在任教范围', icon: 'none' }); return; }
    this.setData({ publishing: true });
    const published = publishHomework({ title: draft.title, description: draft.description.trim(), attachments: draft.attachments.map(file => ({ ...file })), kind: draft.kind, subject: draft.subject, cycleCount: draft.cycleCount, classIds: draft.classIds, targetStudentIds: draft.targetMode === 'selected' ? draft.targetStudentIds : null, items: draft.items.map(item => ({ ...item, submitType: item.submitType as SubmitType, title: item.title.trim() })), deadline: draft.deadline, submitDeadline: draft.submitDeadline, parentVisible: false, publishedBy: profile?.userId });
    this.setData({ hasDraft: false, composeStep: 0 });
    const userId = getSession()?.profile.userId;
    if (userId) wx.removeStorageSync(teacherDraftKey(userId));
    this.setData({ mode: 'success', previewOpen: false, publishing: false, publishedTitle: published.title, publishedTargetCount: draft.targetMode === 'selected' ? draft.targetStudentIds.length : DEMO_STUDENTS.filter(student => draft.classIds.includes(student.classId)).length, publishedClasses: draft.classIds.map(id => DEMO_CLASSES.find(row => row.id === id)?.name || id).join('、'), publishedDeadline: draft.deadline, publishedSubmitDeadline: draft.submitDeadline, publishedItemCount: draft.items.length });
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
