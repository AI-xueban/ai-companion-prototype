import { DEMO_CLASSES, DEMO_STUDENTS, GUARDIAN_STUDENT_ID, DEMO_GUARDIAN_CHILD_IDS, formatHomeworkTitle } from './schoolDemoRoster';
export { DEMO_CLASSES, DEMO_STUDENTS, GUARDIAN_STUDENT_ID } from './schoolDemoRoster';

export type HomeworkKind = 'homework' | 'checkin';
export type SubmitType = 'file' | 'photo' | 'video' | 'audio' | 'none';
export type GradeState = 'confirmed' | 'review' | 'unreadable' | 'no-answer';

export interface HomeworkItem { id: string; title: string; instruction: string; submitType: SubmitType; required: boolean }
export interface HomeworkAttachment { id: string; name: string; type: 'image' | 'video' | 'file'; path: string; size: number; source: string }
export interface HomeworkTask { id: string; title: string; description: string; materialPhoto?: string; attachments?: HomeworkAttachment[]; kind: HomeworkKind; classIds: string[]; targetStudentIds: string[] | null; targetSnapshotIds?: string[]; schoolId?: string; subject?: string; items: HomeworkItem[]; deadline: string; submitDeadline: string; parentVisible: boolean; publishedAt: string; publishedBy?: string; seriesId?: string; cycleId?: string; cycleCount?: number }
export interface HomeworkStudent { id: string; name: string; classId: string }
export interface GradeQuestion { id: string; questionVersion?: number; label: string; answer: string; answerVersion?: number; studentAnswer?: string; correct: boolean; state: GradeState; reviewedAt?: string; reviewHistory?: { at: string; before: GradeState; after: GradeState; correct: boolean; reason: string; reviewerId: string }[] }
export interface ItemSubmission { studentId: string; taskId: string; itemId: string; submittedAt: string; late?: boolean; operatorId?: string; operatorName?: string; mediaLabel: string; mediaPath?: string; isMock?: boolean; version?: number; questions: GradeQuestion[] }
export interface HomeworkStudentRow { student: HomeworkStudent; status: 'completed' | 'partial' | 'missing'; submissions: ItemSubmission[]; wrongQuestions: GradeQuestion[]; latestSubmittedAt: string }
interface Store { tasks: HomeworkTask[]; submissions: ItemSubmission[] }

const STORAGE_KEY = 'demo_homework_v1';
const latestSubmissions = (rows: ItemSubmission[]) => [...rows].sort((a, b) => (a.version || 1) - (b.version || 1) || a.submittedAt.localeCompare(b.submittedAt)).reduce((latest, row) => {
  latest.set(`${row.taskId}:${row.studentId}:${row.itemId}`, row);
  return latest;
}, new Map<string, ItemSubmission>());
const currentRows = (rows: ItemSubmission[]) => [...latestSubmissions(rows).values()];
export const SUBMIT_LABEL: Record<SubmitType, string> = { file: '文件', photo: '图片', video: '视频', audio: '录音', none: '线下完成' };
export const FILE_LIMITS = { file: { bytes: 50 * 1024 * 1024, label: '50MB' }, photo: { bytes: 20 * 1024 * 1024, label: '20MB' }, video: { bytes: 200 * 1024 * 1024, label: '200MB', seconds: 5 * 60 }, audio: { bytes: 50 * 1024 * 1024, label: '50MB', seconds: 10 * 60 } } as const;
const addDays = (value: string, days: number) => { const date = new Date(value.replace(' ', 'T')); date.setDate(date.getDate() + days); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`; };

const seededTasks: HomeworkTask[] = [
  { id: 'task-demo-1', title: '数学周末练习', description: '完成纸质练习第 3 页，录制一道题的讲解，并确认线下朗读。', kind: 'homework', schoolId: 'luohu-demo', subject: '数学', classIds: ['c1', 'c2'], targetStudentIds: null, deadline: '2026-10-11 20:00', submitDeadline: '2026-10-18 20:00', parentVisible: false, publishedAt: '2026-10-09 09:00', publishedBy: 'teacher-demo-001', items: [{ id: 'item-photo', title: '练习题拍照', instruction: '拍摄清晰完整的答题页', submitType: 'photo', required: true }, { id: 'item-video', title: '讲解视频', instruction: '讲解你选择的一道题', submitType: 'video', required: true }, { id: 'item-offline', title: '线下朗读', instruction: '完成后由家长确认', submitType: 'none', required: true }] },
  ...[1, 2, 3].map(day => ({ id: day === 1 ? 'task-demo-2' : `task-demo-2-cycle-${day}`, title: day === 1 ? '每日阅读打卡' : `每日阅读打卡 · 第${day}期`, description: '阅读 20 分钟，记录今天读的内容。', kind: 'checkin' as const, schoolId: 'luohu-demo', subject: '语文', seriesId: 'task-demo-2', cycleId: `cycle-${day}`, cycleCount: 3, classIds: ['c1'], targetStudentIds: null, deadline: `2026-10-${18 + day} 21:00`, submitDeadline: `2026-10-${25 + day} 21:00`, parentVisible: false, publishedAt: '2026-10-18 08:00', publishedBy: 'other-teacher-demo', items: [{ id: 'item-checkin', title: '阅读记录', instruction: '拍下阅读记录页', submitType: 'photo' as const, required: true }] })),
];

function mockExternalGrade(taskId: string, itemId: string, studentId: string): GradeQuestion[] {
  const number = Number(studentId.slice(-2)) || 1;
  return [
    { id: `${taskId}:${itemId}:q1`, questionVersion: 1, label: '第 1 题 · 分数计算', answer: '3/4', answerVersion: 1, studentAnswer: number % 3 !== 0 ? '3/4' : '2/4', correct: number % 3 !== 0, state: number % 13 === 0 ? 'review' : 'confirmed' },
    { id: `${taskId}:${itemId}:q2`, questionVersion: 1, label: '第 2 题 · 应用题', answer: number % 17 === 0 ? '' : '24 人', answerVersion: 1, studentAnswer: number % 4 !== 0 ? '24 人' : '18 人', correct: number % 4 !== 0, state: number % 17 === 0 ? 'no-answer' : number % 11 === 0 ? 'unreadable' : 'confirmed' },
  ];
}

function targetStudents(task: HomeworkTask): HomeworkStudent[] {
  return DEMO_STUDENTS.filter(student => task.targetSnapshotIds ? task.targetSnapshotIds.includes(student.id) : task.classIds.includes(student.classId) && (!task.targetStudentIds || task.targetStudentIds.includes(student.id)));
}

function seedStore(): Store {
  const submissions: ItemSubmission[] = [];
  seededTasks.filter(task => task.id !== 'task-demo-2-cycle-2' && task.id !== 'task-demo-2-cycle-3').forEach(task => targetStudents(task).forEach((student, index) => {
    if (student.id === GUARDIAN_STUDENT_ID || index % 6 === 0) return;
    task.items.forEach((item, itemIndex) => {
      if (index % 5 === 0 && itemIndex > 0) return;
      submissions.push({ studentId: student.id, taskId: task.id, itemId: item.id, submittedAt: `${task.id === 'task-demo-1' ? '2026-10-10' : '2026-10-18'} ${String(14 + index % 5).padStart(2, '0')}:${String(index * 7 % 60).padStart(2, '0')}`, operatorId: `guardian-demo-${String(index % 3 + 1).padStart(3, '0')}`, operatorName: ['王女士', '李先生', '张女士'][index % 3], mediaLabel: item.submitType === 'none' ? '家长确认已完成' : `演示${SUBMIT_LABEL[item.submitType]}提交`, mediaPath: item.submitType === 'photo' ? '/assets/homework-demo-paper.png' : '', isMock: true, questions: item.submitType === 'photo' && task.kind === 'homework' ? mockExternalGrade(task.id, item.id, student.id) : [] });
    });
  }));
  return { tasks: seededTasks, submissions };
}

function ensureTeacherHistoryDemo(store: Store): boolean {
  let changed = false;
  const day = (delta: number) => { const date = new Date(); date.setDate(date.getDate() + delta); return formatDay(date) + ' 20:00'; };
  function formatDay(date: Date) { return date.getFullYear() + '-' + String(date.getMonth()+1).padStart(2,'0') + '-' + String(date.getDate()).padStart(2,'0'); }
  for (const completed of [true, false]) {
    const id = completed ? 'teacher-history-completed' : 'teacher-history-pending';
    if (store.tasks.some(task => task.id === id)) continue;
    const task: HomeworkTask = { id, subject:'数学', kind:'homework', title:completed ? '数学口算练习' : '数学应用题练习', description:'完成练习后由家长确认。', publishedAt:day(-6), deadline:day(completed ? -4 : -1), submitDeadline:day(completed ? -2 : 6), classIds:['c1','c2'], targetStudentIds:null, targetSnapshotIds:DEMO_STUDENTS.filter(row => ['c1','c2'].includes(row.classId)).map(row => row.id), schoolId:'luohu-demo', parentVisible:false, publishedBy:'teacher-demo-001', items:[{id:id+'-item',title:'完成练习',instruction:'完成后由家长确认',submitType:'none',required:true}] };
    store.tasks.push(task);
    if (completed) targetStudents(task).forEach(student => store.submissions.push({taskId:id,itemId:task.items[0].id,studentId:student.id,submittedAt:day(-5),operatorId:'guardian-demo-001',operatorName:'王女士',mediaLabel:'家长确认已完成',isMock:true,questions:[]}));
    changed = true;
  }
  return changed;
}

function ensureGuardianStatusDemo(store: Store): boolean {
  let changed = false;
  const date = new Date();
  const now = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0') + ' 18:00';
  const specs: Array<[string, string, string, HomeworkKind, string]> = [["pending-math","有理数计算练习","数学","homework","pending"],["pending-read","课外阅读打卡","语文","checkin","pending"],["completed-english","英语词汇巩固","英语","homework","completed"],["completed-read","朗读背诵打卡","语文","checkin","completed"],["ended-math","数学基础巩固","数学","homework","ended"],["ended-english","英语听力打卡","英语","checkin","ended"]];
  for (const [suffix, title, subject, kind, status] of specs) {
    const id = 'guardian-demo-status-v1-' + suffix;
    if (store.tasks.some(task => task.id === id)) continue;
    const childIds = [...DEMO_GUARDIAN_CHILD_IDS];
    const past = status !== 'pending';
    const itemId = id + '-item';
    store.tasks.push({ id, title, subject, kind, schoolId: 'luohu-demo', classIds: ['c1', 'c2'], targetStudentIds: childIds, targetSnapshotIds: childIds, publishedAt: addDays(now, -5), publishedBy: 'teacher-demo-001', parentVisible: false, deadline: addDays(now, past ? -3 : 2), submitDeadline: addDays(now, past ? -1 : 9), description: status === 'completed' ? '完成线下学习后由家长确认，当前为已完成演示记录。' : status === 'ended' ? '本期任务已结束，可查看完成要求与历史进度。' : '完成老师安排的学习内容，并上传学习记录。', items: [{ id: itemId, title: status === 'completed' ? '线下学习确认' : '学习记录', instruction: status === 'completed' ? '由家长确认孩子已完成本次学习。' : '拍摄清晰的学习记录后提交。', submitType: status === 'completed' ? 'none' : 'photo', required: true }] });
    if (status === 'completed') for (const studentId of childIds) store.submissions.push({ taskId: id, itemId, studentId, submittedAt: addDays(now, -4), operatorId: 'guardian-demo-001', operatorName: '演示家长', mediaLabel: '家长确认已完成', isMock: true, version: 1, questions: [] });
    changed = true;
  }
  return changed;
}

function readStore(): Store {
  const stored = wx.getStorageSync(STORAGE_KEY) as Store | undefined;
  if (stored?.tasks && stored?.submissions) {
    const classId = (id: string) => id === 'class-g5-2' ? 'c1' : id === 'class-g5-3' ? 'c2' : id;
    const studentId = (id: string) => id.replace(/^class-g5-2-(\d+)$/, (_, number: string) => `c1-s${number.padStart(2, '0')}`).replace(/^class-g5-3-(\d+)$/, (_, number: string) => `c2-s${number.padStart(2, '0')}`);
    let changed = false;
    const historicalDemo = stored.tasks.find(task => task.id === 'task-demo-1');
    if (historicalDemo && historicalDemo.deadline === '2026-10-20 20:00') {
      historicalDemo.publishedAt = '2026-10-09 09:00'; historicalDemo.deadline = '2026-10-11 20:00'; historicalDemo.submitDeadline = '2026-10-18 20:00';
      stored.submissions.filter(row => row.taskId === historicalDemo.id && row.isMock && row.submittedAt.startsWith('2026-10-18')).forEach(row => { row.submittedAt = row.submittedAt.replace('2026-10-18', '2026-10-10'); });
      changed = true;
    }
    stored.tasks.forEach(task => {
      if (task.parentVisible) { task.parentVisible = false; changed = true; }
      const classes = task.classIds.map(classId);
      if (classes.some((id, index) => id !== task.classIds[index])) { task.classIds = classes; changed = true; }
      if (task.targetStudentIds) {
        const ids = task.targetStudentIds.map(studentId);
        if (ids.some((id, index) => id !== task.targetStudentIds![index])) { task.targetStudentIds = ids; changed = true; }
      }
      if (task.id === 'task-demo-1' && !task.items.some(item => item.id === 'item-offline')) {
        task.items.push({ id: 'item-offline', title: '线下朗读', instruction: '完成后由家长确认', submitType: 'none', required: true });
        changed = true;
      }
      if (!task.publishedBy && task.id.startsWith('task-demo-')) { task.publishedBy = task.id === 'task-demo-1' ? 'teacher-demo-001' : 'other-teacher-demo'; changed = true; }
      if (!task.schoolId) { task.schoolId = 'luohu-demo'; changed = true; }
      if (!task.subject && task.id.startsWith('task-demo-')) { task.subject = task.id === 'task-demo-1' ? '数学' : '语文'; changed = true; }
      if (!task.targetSnapshotIds) { task.targetSnapshotIds = DEMO_STUDENTS.filter(student => task.classIds.includes(student.classId) && (!task.targetStudentIds || task.targetStudentIds.includes(student.id))).map(student => student.id); changed = true; }
      if (!task.submitDeadline) { task.submitDeadline = addDays(task.deadline, 7); changed = true; }
      if (task.kind === 'checkin' && !task.cycleId) { task.seriesId = task.seriesId || task.id; task.cycleId = 'cycle-1'; changed = true; }
    });
    stored.submissions.forEach(row => { const id = studentId(row.studentId); if (id !== row.studentId) { row.studentId = id; changed = true; } if (!row.operatorName) { row.operatorId = row.operatorId || 'guardian-demo-001'; row.operatorName = '王女士'; changed = true; } if (row.isMock === undefined && row.mediaLabel.startsWith('演示')) { row.isMock = true; changed = true; } if (row.isMock && !row.mediaPath && taskPhotoItem(stored.tasks, row)) { row.mediaPath = '/assets/homework-demo-paper.png'; changed = true; } });
    if (stored.tasks.some(task => task.id === 'task-demo-2')) {
      for (const phase of seededTasks.filter(task => task.id === 'task-demo-2-cycle-2' || task.id === 'task-demo-2-cycle-3')) {
        if (!stored.tasks.some(task => task.id === phase.id)) { stored.tasks.push({ ...phase, items: phase.items.map(item => ({ ...item })) }); changed = true; }
      }
      const first = stored.tasks.find(task => task.id === 'task-demo-2');
      if (first && first.cycleCount !== 3) { first.cycleCount = 3; changed = true; }
    }
    if (ensureGuardianStatusDemo(stored)) changed = true;
    if (ensureTeacherHistoryDemo(stored)) changed = true;
    if (changed) saveStore(stored);
    return stored;
  }
  const seed = seedStore();
  ensureGuardianStatusDemo(seed);
  ensureTeacherHistoryDemo(seed);
  wx.setStorageSync(STORAGE_KEY, seed);
  return seed;
}

function saveStore(store: Store): void { wx.setStorageSync(STORAGE_KEY, store); }
export function listHomeworkTasks(): HomeworkTask[] { return readStore().tasks; }
export function getHomeworkTask(id: string): HomeworkTask | undefined { return readStore().tasks.find(task => task.id === id); }
export function getTargetStudents(task: HomeworkTask): HomeworkStudent[] { return targetStudents(task); }
export function listStudentTasks(studentId: string): HomeworkTask[] { return readStore().tasks.filter(task => targetStudents(task).some(student => student.id === studentId)); }
export function getStudentSubmissions(taskId: string, studentId: string): ItemSubmission[] { return currentRows(readStore().submissions.filter(row => row.taskId === taskId && row.studentId === studentId)); }
export function getSubmissionHistory(taskId: string, itemId: string, studentId: string): ItemSubmission[] { return readStore().submissions.filter(row => row.taskId === taskId && row.itemId === itemId && row.studentId === studentId).sort((a, b) => (b.version || 1) - (a.version || 1)); }
function taskPhotoItem(tasks: HomeworkTask[], row: ItemSubmission): boolean { return tasks.find(task => task.id === row.taskId)?.items.find(item => item.id === row.itemId)?.submitType === 'photo'; }
export function getTaskStudentRows(task: HomeworkTask): HomeworkStudentRow[] {
  const submissions = currentRows(readStore().submissions.filter(row => row.taskId === task.id));
  return targetStudents(task).map(student => {
    const mine = submissions.filter(row => row.studentId === student.id);
    const required = task.items.filter(item => item.required);
    const status = !mine.length ? 'missing' : required.every(item => mine.some(row => row.itemId === item.id)) ? 'completed' : 'partial';
    return { student, status, submissions: mine, wrongQuestions: mine.flatMap(row => row.questions || []).filter(question => question.state === 'confirmed' && !question.correct), latestSubmittedAt: mine.map(row => row.submittedAt).sort().pop() || '' };
  });
}
export function listSharedSubmissions(task: HomeworkTask, studentId: string) {
  if (!task.parentVisible) return [];
  const students = targetStudents(task);
  if (!students.some(student => student.id === studentId)) return [];
  return currentRows(readStore().submissions).filter(row => row.taskId === task.id && row.studentId !== studentId && students.some(student => student.id === row.studentId)).slice(0, 8).map(row => ({ ...row, id: `${row.studentId}:${row.itemId}`, studentName: students.find(student => student.id === row.studentId)?.name || '同学', itemTitle: task.items.find(item => item.id === row.itemId)?.title || '任务项' }));
}

export function publishHomework(input: Omit<HomeworkTask, 'id' | 'publishedAt'>): HomeworkTask {
  const store = readStore();
  const now = new Date();
  const generatedTitle = formatHomeworkTitle(input.subject || '', input.kind, now);
  const publishedAt = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const seriesId = `task-${Date.now()}`;
  const count = input.kind === 'checkin' ? Math.max(1, Math.min(30, input.cycleCount || 1)) : 1;
  const tasks = Array.from({ length: count }, (_, index) => {
    const deadline = new Date(input.deadline.replace(' ', 'T'));
    deadline.setDate(deadline.getDate() + index);
    const due = `${deadline.getFullYear()}-${String(deadline.getMonth() + 1).padStart(2, '0')}-${String(deadline.getDate()).padStart(2, '0')} ${String(deadline.getHours()).padStart(2, '0')}:${String(deadline.getMinutes()).padStart(2, '0')}`;
    const submitDeadline = addDays(input.submitDeadline, index);
    return { ...input, parentVisible: false, id: count === 1 ? seriesId : `${seriesId}-cycle-${index + 1}`, seriesId, cycleId: input.kind === 'checkin' ? `cycle-${index + 1}` : undefined, title: count === 1 ? generatedTitle : `${generatedTitle} · 第${index + 1}期`, targetSnapshotIds: DEMO_STUDENTS.filter(student => input.classIds.includes(student.classId) && (!input.targetStudentIds || input.targetStudentIds.includes(student.id))).map(student => student.id), schoolId: input.schoolId || 'luohu-demo', deadline: due, submitDeadline, publishedAt };
  });
  store.tasks.unshift(...tasks);
  saveStore(store);
  return tasks[0];
}

export function submitHomeworkItem(taskId: string, itemId: string, studentId: string, file?: { path: string; name: string }, operator?: { id: string; name: string }): ItemSubmission {
  const store = readStore();
  const task = store.tasks.find(row => row.id === taskId);
  const item = task?.items.find(row => row.id === itemId);
  if (!task || !item || !targetStudents(task).some(student => student.id === studentId)) throw new Error('任务或接收范围不存在');
  if (Date.now() > new Date(task.submitDeadline.replace(' ', 'T')).getTime()) throw new Error('补交期限已结束，任务仅供查看');
  if (item.submitType !== 'none' && !file?.path) throw new Error('请先选择对应的提交文件');
  const now = new Date();
  const submittedAt = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const version = store.submissions.filter(row => row.studentId === studentId && row.taskId === taskId && row.itemId === itemId).reduce((max, row) => Math.max(max, row.version || 1), 0) + 1;
  const submission: ItemSubmission = { studentId, taskId, itemId, submittedAt, late: submittedAt > task.deadline, operatorId: operator?.id, operatorName: operator?.name, mediaLabel: file?.name || (item.submitType === 'none' ? '家长确认已完成' : `模拟${SUBMIT_LABEL[item.submitType]}提交`), mediaPath: file?.path || (item.submitType === 'photo' ? '/assets/homework-demo-paper.png' : ''), isMock: !file && item.submitType !== 'none', version, questions: item.submitType === 'photo' && task.kind === 'homework' ? mockExternalGrade(taskId, itemId, studentId) : [] };
  store.submissions.push(submission);
  saveStore(store);
  return submission;
}

export function summarizeHomework(task: HomeworkTask) {
  const students = targetStudents(task);
  const submissions = currentRows(readStore().submissions.filter(row => row.taskId === task.id && students.some(student => student.id === row.studentId)));
  const completed = students.filter(student => task.items.filter(item => item.required).every(item => submissions.some(row => row.studentId === student.id && row.itemId === item.id))).length;
  const partial = students.filter(student => submissions.some(row => row.studentId === student.id) && !task.items.filter(item => item.required).every(item => submissions.some(row => row.studentId === student.id && row.itemId === item.id))).length;
  const questions = submissions.flatMap(row => row.questions);
  const confirmed = questions.filter(question => question.state === 'confirmed');
  const questionRows = [...new Set(questions.map(question => question.id))].map(id => {
    const rows = questions.filter(question => question.id === id && question.state === 'confirmed');
    const first = questions.find(question => question.id === id)!;
    return { id, label: first.label, answer: first.answer || '暂无标准答案', graded: rows.length, correct: rows.filter(question => question.correct).length, review: questions.filter(question => question.id === id && question.state === 'review').length, unreadable: questions.filter(question => question.id === id && question.state === 'unreadable').length, rate: rows.length ? Math.round(rows.filter(question => question.correct).length / rows.length * 100) : 0 };
  });
  return { target: students.length, completed, partial, missing: students.length - completed - partial, completionRate: students.length ? Math.round(completed / students.length * 100) : 0, graded: confirmed.length, correct: confirmed.filter(question => question.correct).length, correctness: confirmed.length ? Math.round(confirmed.filter(question => question.correct).length / confirmed.length * 100) : 0, review: questions.filter(question => question.state === 'review').length, unreadable: questions.filter(question => question.state === 'unreadable').length, noAnswer: questions.filter(question => question.state === 'no-answer').length, questionRows };
}

export function confirmMockReview(taskId: string, questionId: string, correct: boolean, reason: string, reviewerId: string): boolean {
  if (!reason.trim()) return false;
  const store = readStore();
  for (const submission of currentRows(store.submissions)) {
    if (submission.taskId !== taskId) continue;
    const question = submission.questions.find(row => row.id === questionId && row.state === 'review');
    if (!question) continue;
    const at = new Date().toISOString();
    question.reviewHistory = [...(question.reviewHistory || []), { at, before: question.state, after: 'confirmed', correct, reason: reason.trim(), reviewerId }];
    question.correct = correct;
    question.state = 'confirmed';
    question.reviewedAt = at;
    saveStore(store);
    return true;
  }
  return false;
}
