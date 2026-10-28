import { HOMEWORK_FILE_LIMITS, homeworkClosed, homeworkPublishError, applyHomeworkChange, validateHomeworkChange, homeworkSubmissionReceipt, homeworkOriginalError, HomeworkFileReadiness } from './homeworkGrading';
import type { ManagedHomework, HomeworkManagementAction, HomeworkChangeInput } from './homeworkGrading';
import type { AnswerStandard } from './homeworkGrading';
import { holdManualResult, confirmManualResult, gradingStatistics, answersEquivalent, initializeAnswerStandards, confirmAnswerStandard, startStandardGrading, completeMockStandardGrading, standardPhase, isFormalGrade, demoQuestionContent, demoPhotoPath, realPhotoQuestions, gradingSignature, gradingProgress, releaseQuestion } from './homeworkGrading';
import { DEMO_CLASSES, DEMO_STUDENTS, GUARDIAN_STUDENT_ID, DEMO_GUARDIAN_CHILD_IDS, formatHomeworkTitle } from './schoolDemoRoster';
import { getHomeworkWorksheet } from './homeworkWorksheets';
export { DEMO_CLASSES, DEMO_STUDENTS, GUARDIAN_STUDENT_ID } from './schoolDemoRoster';

export type HomeworkKind = 'homework' | 'checkin';
export type SubmitType = 'file' | 'photo' | 'video' | 'audio' | 'none';
export type GradeState = 'confirmed' | 'review' | 'unreadable' | 'no-answer' | 'queued' | 'processing' | 'failed';

export interface HomeworkItem { id: string; title: string; instruction: string; submitType: SubmitType; required: boolean; gradingEnabled?: boolean; expectedPages?: number }
export interface HomeworkAttachment extends HomeworkFileReadiness { id: string; name: string; type: 'image' | 'video' | 'audio' | 'file'; path: string; size: number; source: string }
export interface HomeworkTask extends Omit<ManagedHomework, 'items'> { gradingPolicyVersion?:number; needsAnswerConfirmation?:boolean; answerStandards?:AnswerStandard[]; id: string; title: string; description: string; materialPhoto?: string; attachments?: HomeworkAttachment[]; kind: HomeworkKind; classIds: string[]; targetStudentIds: string[] | null; targetSnapshotIds?: string[]; schoolId?: string; subject?: string; items: HomeworkItem[]; deadline: string; submitDeadline: string; parentVisible: boolean; publishedAt: string; publishedBy?: string; seriesId?: string; cycleId?: string; cycleCount?: number }
export interface HomeworkStudent { id: string; name: string; classId: string }
export interface GradeQuestion { pageIndex?:number; explanationInvalidated?:boolean; aiUnavailable?:boolean;aiCorrect?:boolean;aiState?:string;aiAnswer?:string;aiExplanation?:string;reviewReason?:'answer-changed'|'manual-hold';decisionSource?:'ai'|'teacher'; standardStatus?:'pending'|'processing'|'ready';standardVersion?:number;recognizedFinalAnswer?:string; region?: { x: number; y: number; width: number; height: number }; stem?: string; analysis?: string; explanation?: string; keyPoint?: string; knowledge?: string; knowledgeVideoUrl?: string; releasedSignature?: string; releasedAt?: string; estimatedMinutes?: number; id: string; questionVersion?: number; label: string; answer: string; answerVersion?: number; studentAnswer?: string; correct: boolean; state: GradeState; reviewedAt?: string; reviewHistory?: { at: string; before: GradeState; after: GradeState; correct: boolean; reason: string; reviewerId: string }[] }
export interface SubmissionPhoto { path:string; name:string; size?:number; saved?:boolean; error?:string }
export interface ItemSubmission extends HomeworkFileReadiness { receivedAt?:number; requestId?:string; gradingResult?: import('./homeworkGrading').SubmissionGradingImages; photos?: SubmissionPhoto[]; gradingError?: string; studentId: string; taskId: string; itemId: string; submittedAt: string; late?: boolean; operatorId?: string; operatorName?: string; mediaLabel: string; mediaPath?: string; isMock?: boolean; version?: number; questions: GradeQuestion[] }
export interface HomeworkStudentRow { student: HomeworkStudent; status: 'completed' | 'partial' | 'missing'; submissions: ItemSubmission[]; wrongQuestions: GradeQuestion[]; latestSubmittedAt: string }
interface Store { tasks: HomeworkTask[]; submissions: ItemSubmission[] }

const STORAGE_KEY = 'demo_homework_v1';
const latestSubmissions = (rows: ItemSubmission[]) => [...rows].sort((a, b) => (a.version || 1) - (b.version || 1) || a.submittedAt.localeCompare(b.submittedAt)).reduce((latest, row) => {
  latest.set(`${row.taskId}:${row.studentId}:${row.itemId}`, row);
  return latest;
}, new Map<string, ItemSubmission>());
const currentRows = (rows: ItemSubmission[]) => [...latestSubmissions(rows).values()];
export const SUBMIT_LABEL: Record<SubmitType, string> = { file: '文件', photo: '图片', video: '视频', audio: '录音', none: '线下完成' };
export const FILE_LIMITS = HOMEWORK_FILE_LIMITS;
const addDays = (value: string, days: number) => { const date = new Date(value.replace(' ', 'T')); date.setDate(date.getDate() + days); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`; };

const seededTasks: HomeworkTask[] = [
  { id: 'task-demo-1', title: '数学周末练习', description: '完成纸质练习第 3 页，录制一道题的讲解，并确认线下朗读。', kind: 'homework', schoolId: 'luohu-demo', subject: '数学', classIds: ['c1', 'c2'], targetStudentIds: null, deadline: '2026-10-11 20:00', submitDeadline: '2026-10-18 20:00', parentVisible: false, publishedAt: '2026-10-09 09:00', publishedBy: 'teacher-demo-001', items: [{ id: 'item-photo', title: '练习题拍照', instruction: '拍摄清晰完整的答题页', submitType: 'photo', required: true }, { id: 'item-video', title: '讲解视频', instruction: '讲解你选择的一道题', submitType: 'video', required: true }, { id: 'item-offline', title: '线下朗读', instruction: '完成后由家长确认', submitType: 'none', required: true }] },
  ...[1, 2, 3].map(day => ({ id: day === 1 ? 'task-demo-2' : `task-demo-2-cycle-${day}`, title: day === 1 ? '每日阅读打卡' : `每日阅读打卡 · 第${day}期`, description: '阅读 20 分钟，记录今天读的内容。', kind: 'checkin' as const, schoolId: 'luohu-demo', subject: '语文', seriesId: 'task-demo-2', cycleId: `cycle-${day}`, cycleCount: 3, classIds: ['c1'], targetStudentIds: null, deadline: `2026-10-${18 + day} 21:00`, submitDeadline: `2026-10-${25 + day} 21:00`, parentVisible: false, publishedAt: '2026-10-18 08:00', publishedBy: 'other-teacher-demo', items: [{ id: 'item-checkin', title: '阅读记录', instruction: '拍下阅读记录页', submitType: 'photo' as const, required: true }] })),
];

function mockExternalGrade(taskId: string, itemId: string, studentId: string): GradeQuestion[] {
  if (taskId === 'grading-demo-v1') return realPhotoQuestions(itemId, taskId+':'+itemId+':');
  const number = Number(studentId.slice(-2)) || 1;
  return [
    { id: `${taskId}:${itemId}:q1`, questionVersion: 1, label: '第 1 题 · 分数计算', answer: '3/4', answerVersion: 1, studentAnswer: number % 3 !== 0 ? '3/4' : '2/4', correct: number % 3 !== 0, ...demoQuestionContent('q1'), state: number % 13 === 0 ? 'review' : 'confirmed' },
    { id: `${taskId}:${itemId}:q2`, questionVersion: 1, label: '第 2 题 · 应用题', answer: number % 17 === 0 ? '' : '24 人', answerVersion: 1, studentAnswer: number % 4 !== 0 ? '24 人' : '18 人', correct: number % 4 !== 0, ...demoQuestionContent('q2'), state: number % 17 === 0 ? 'no-answer' : number % 11 === 0 ? 'unreadable' : 'confirmed' },
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
      submissions.push({ studentId: student.id, taskId: task.id, itemId: item.id, submittedAt: `${task.id === 'task-demo-1' ? '2026-10-10' : '2026-10-18'} ${String(14 + index % 5).padStart(2, '0')}:${String(index * 7 % 60).padStart(2, '0')}`, operatorId: `guardian-demo-${String(index % 3 + 1).padStart(3, '0')}`, operatorName: ['王女士', '李先生', '张女士'][index % 3], mediaLabel: item.submitType === 'none' ? '家长确认已完成' : `演示${SUBMIT_LABEL[item.submitType]}提交`, mediaPath: item.submitType === 'photo' ? '/assets/homework-demo-paper.png' : '', isMock: true, questions: (item.submitType === 'photo'||item.submitType==='file') && item.gradingEnabled!==false && task.kind === 'homework' ? mockExternalGrade(task.id, item.id, student.id) : [] });
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

function ensureSharedCombinationDemo(store: Store): boolean {
  const date = new Date();
  const now = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} 18:00`;
  const specs: Array<{ id: string; title: string; subject: string; kind: HomeworkKind; publisher: string; classIds: string[]; dueIn: number; description: string; items: Array<[string, string, string, SubmitType]>; doneForGuardian: string[] }> = [
    { id: 'shared-combo-math-v1', title: '分数单元综合练习', subject: '数学', kind: 'homework', publisher: 'teacher-demo-001', classIds: ['c1', 'c2'], dueIn: 3, description: '完成纸质练习，按要求提交照片、讲解视频和练习文档，并确认线下订正。', items: [['math-photo', '练习答题页', '拍摄完整、清晰的答题页。', 'photo'], ['math-video', '错题讲解', '选择一道错题录制讲解视频。', 'video'], ['math-file', '订正记录', '上传订正后的 PDF 或 Word 文件。', 'file'], ['math-confirm', '线下订正确认', '订正完成后由家长确认。', 'none']], doneForGuardian: ['math-confirm'] },
    { id: 'shared-combo-english-v1', title: '英语阅读与写作', subject: '英语', kind: 'homework', publisher: 'teacher-demo-001', classIds: ['c1', 'c2'], dueIn: 4, description: '提交阅读记录照片和作文文档，两项分别完成。', items: [['english-photo', '阅读记录', '拍摄阅读记录页。', 'photo'], ['english-file', '英语小作文', '上传 PDF 或 Word 文档。', 'file']], doneForGuardian: [] },
    { id: 'shared-combo-reading-v1', title: '朗读与阅读打卡', subject: '语文', kind: 'checkin', publisher: 'other-teacher-demo', classIds: ['c1'], dueIn: 5, description: '录制朗读视频，完成阅读后由家长确认。', items: [['reading-video', '朗读视频', '录制一段朗读视频。', 'video'], ['reading-confirm', '阅读完成确认', '阅读完成后由家长确认。', 'none']], doneForGuardian: ['reading-confirm'] },
  ];
  let changed = false;
  for (const spec of specs) {
    if (store.tasks.some(task => task.id === spec.id)) continue;
    const targetSnapshotIds = DEMO_STUDENTS.filter(student => spec.classIds.includes(student.classId)).map(student => student.id);
    const deadline = addDays(now, spec.dueIn);
    const task: HomeworkTask = { id: spec.id, title: spec.title, subject: spec.subject, kind: spec.kind, schoolId: 'luohu-demo', classIds: spec.classIds, targetStudentIds: null, targetSnapshotIds, publishedBy: spec.publisher, publishedAt: now, deadline, submitDeadline: addDays(deadline, 7), parentVisible: false, description: spec.description, items: spec.items.map(([id, title, instruction, submitType]) => ({ id, title, instruction, submitType, required: true })) };
    store.tasks.push(task);
    targetSnapshotIds.forEach((studentId, index) => task.items.forEach((item, itemIndex) => {
      if (DEMO_GUARDIAN_CHILD_IDS.includes(studentId) ? !spec.doneForGuardian.includes(item.id) : index % 4 === 0 || index % 5 === 0 && itemIndex > 0) return;
      store.submissions.push({ taskId: task.id, itemId: item.id, studentId, submittedAt: now, operatorId: 'guardian-demo-001', operatorName: '演示家长', mediaLabel: item.submitType === 'none' ? '家长确认已完成' : `演示${SUBMIT_LABEL[item.submitType]}提交`, mediaPath: item.submitType === 'photo' ? '/assets/homework-demo-paper.png' : '', isMock: true, version: 1, questions: [] });
    }));
    changed = true;
  }
  return changed;
}

function ensureGradingDemo(store: Store): boolean {
  if (store.tasks.some(task => task.id === 'grading-demo-v1')) return false;
  const day = new Date(); day.setDate(day.getDate() + 2);
  const deadline = day.toISOString().slice(0,10) + ' 20:00';
  const task: HomeworkTask = { id:'grading-demo-v1', title:'分数计算与应用题', subject:'数学', kind:'homework', classIds:['c1','c2'], targetStudentIds:null, targetSnapshotIds:DEMO_STUDENTS.filter(s => ['c1','c2'].includes(s.classId)).map(s=>s.id), description:'完成两页分数练习，每页分别拍照提交。', attachments:[{id:'demo-grading-paper',name:'分数练习样张.png',type:'image',path:'/assets/homework-demo-paper.png',size:0,source:'演示附件'}], deadline, submitDeadline:addDays(deadline,7), parentVisible:false, publishedAt:addDays(deadline,-3), publishedBy:'teacher-demo-001', items:[1,2].map(n=>({id:'grading-page-'+n,title:'第 '+n+' 页练习',instruction:'拍摄完整答题页',submitType:'photo' as const,required:true})) };
  store.tasks.push(task);
  targetStudents(task).forEach((student,i)=>{if(i%6===0&&!DEMO_GUARDIAN_CHILD_IDS.includes(student.id))return;task.items.forEach(item=>store.submissions.push({studentId:student.id,taskId:task.id,itemId:item.id,submittedAt:addDays(deadline,-2),mediaLabel:'分数练习作业原图',mediaPath:demoPhotoPath(item.id),isMock:true,version:1,questions:mockExternalGrade(task.id,item.id,student.id)}));});
  return true;
}

function ensureWorksheetFlowDemo(store: Store): boolean {
  const id = 'worksheet-flow-grade5-v1';
  const worksheet = getHomeworkWorksheet('math-application-grade7');
  if (!worksheet) return false;
  const questionSpecs = [
    { label: '有理数混合运算', answer: '-18', stem: '计算：（-3）×［2－（-4）］。', knowledge: '有理数混合运算' },
    { label: '一元一次方程', answer: 'x=7', stem: '解方程：3x＋5＝26。', knowledge: '解一元一次方程' },
    { label: '整式求值', answer: '15', stem: '当 a＝-2 时，求 2a²－3a＋1 的值。', knowledge: '整式求值' },
    { label: '线段关系', answer: '6厘米', stem: 'AB＝24 厘米，AC∶CB＝1∶3，求 AC。', knowledge: '线段关系' },
  ];
  const existing = store.tasks.find(task => task.id === id);
  if (existing) {
    let changed = false;
    if (existing.title !== worksheet.title || existing.description !== worksheet.description || existing.attachments?.[0]?.path !== worksheet.blankPath) {
      existing.title = worksheet.title;
      existing.description = worksheet.description;
      existing.attachments = [{ id: 'worksheet-grade5-blank', name: '七年级数学应用题（空白作业）.png', type: 'image', path: worksheet.blankPath, size: 0, source: '作业素材库' }];
      const item = existing.items.find(row => row.id === 'worksheet-grade5-photo');
      if (item) item.instruction = worksheet.requirement;
      changed = true;
    }
    store.submissions.filter(row => row.taskId === id && /math-grade5-application-answered\.webp$/.test(row.mediaPath || '')).forEach(row => {
      row.mediaLabel = '七年级数学应用题作答页';
      row.mediaPath = worksheet.answeredPath;
      row.questions.forEach((question, index) => {
        const spec = questionSpecs[index];
        if (!spec) return;
        Object.assign(question, { label: `第 ${index + 1} 题 · ${spec.label}`, answer: spec.answer, studentAnswer: question.correct ? spec.answer : '11', stem: spec.stem, knowledge: spec.knowledge, region: { x: .14, y: .25 + index * .19, width: .78, height: .10 } });
      });
      changed = true;
    });
    return changed;
  }
  const current = new Date();
  const now = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')} 18:00`;
  const deadline = addDays(now, 3), itemId = 'worksheet-grade5-photo';
  const targetSnapshotIds = DEMO_STUDENTS.filter(student => ['c1', 'c2'].includes(student.classId)).map(student => student.id);
  const task: HomeworkTask = {
    id, title: worksheet.title, description: worksheet.description, kind: 'homework', schoolId: 'luohu-demo', subject: worksheet.subject,
    classIds: ['c1', 'c2'], targetStudentIds: null, targetSnapshotIds, deadline, submitDeadline: addDays(deadline, 7), parentVisible: false,
    publishedAt: now, publishedBy: 'teacher-demo-001', needsAnswerConfirmation: false,
    attachments: [{ id: 'worksheet-grade5-blank', name: '七年级数学应用题（空白作业）.png', type: 'image', path: worksheet.blankPath, size: 0, source: '作业素材库' }],
    items: [{ id: itemId, title: '提交整张作答页', instruction: worksheet.requirement, submitType: 'photo', required: true }],
  };
  store.tasks.unshift(task);
  targetSnapshotIds.forEach((studentId, index) => {
    if (studentId === DEMO_GUARDIAN_CHILD_IDS[0] || index % 7 === 0) return;
    const correct = index % 4 !== 0;
    const questions: GradeQuestion[] = questionSpecs.map((spec, questionIndex) => {
      const questionCorrect = questionIndex !== 2 || correct;
      return { id: `${id}:q${questionIndex + 1}`, label: `第 ${questionIndex + 1} 题 · ${spec.label}`, answer: spec.answer, studentAnswer: questionCorrect ? spec.answer : '11', correct: questionCorrect, state: questionCorrect ? 'confirmed' : 'review', stem: spec.stem, knowledge: spec.knowledge, region: { x: .14, y: .25 + questionIndex * .19, width: .78, height: .10 } };
    });
    store.submissions.push({ studentId, taskId: id, itemId, submittedAt: addDays(now, 1), operatorId: 'guardian-demo-001', operatorName: '演示家长', mediaLabel: '七年级数学应用题作答页', mediaPath: worksheet.answeredPath, isMock: false, version: 1, questions });
  });
  return true;
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
      task.items.forEach(item=>{if(item.gradingEnabled===undefined){item.gradingEnabled=task.kind==='homework'&&item.submitType==='photo';changed=true;}});
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
    stored.submissions.forEach(row => { if(row.isMock)(row.questions||[]).forEach(q=>{if(!q.stem){Object.assign(q,demoQuestionContent(q.id));changed=true;}}); const id = studentId(row.studentId); if (id !== row.studentId) { row.studentId = id; changed = true; } if (!row.operatorName) { row.operatorId = row.operatorId || 'guardian-demo-001'; row.operatorName = '王女士'; changed = true; } if (row.isMock === undefined && row.mediaLabel.startsWith('演示')) { row.isMock = true; changed = true; } if (row.isMock && !row.mediaPath && taskPhotoItem(stored.tasks, row)) { row.mediaPath = '/assets/homework-demo-paper.png'; changed = true; } });
    if (stored.tasks.some(task => task.id === 'task-demo-2')) {
      for (const phase of seededTasks.filter(task => task.id === 'task-demo-2-cycle-2' || task.id === 'task-demo-2-cycle-3')) {
        if (!stored.tasks.some(task => task.id === phase.id)) { stored.tasks.push({ ...phase, items: phase.items.map(item => ({ ...item })) }); changed = true; }
      }
      const first = stored.tasks.find(task => task.id === 'task-demo-2');
      if (first && first.cycleCount !== 3) { first.cycleCount = 3; changed = true; }
    }
    if (ensureGradingDemo(stored)) changed = true;
    stored.submissions.filter(row=>row.taskId==='grading-demo-v1'&&row.isMock).forEach(row=>{if(!row.questions.some(q=>q.label.startsWith('第 21 题')||q.label.startsWith('第 23 题'))){row.questions=mockExternalGrade(row.taskId,row.itemId,row.studentId);row.mediaPath=demoPhotoPath(row.itemId);changed=true;}});
    const currentSample=stored.tasks.find(t=>t.id==='grading-demo-v1');if(currentSample){if(!currentSample.needsAnswerConfirmation){currentSample.needsAnswerConfirmation=true;changed=true;}if(!Array.isArray(currentSample.attachments)){currentSample.attachments=[{id:'demo-grading-paper',name:'分数练习样张.png',type:'image',path:'/assets/homework-demo-paper.png',size:0,source:'演示附件'}];changed=true;}}
    stored.tasks.filter(t=>t.needsAnswerConfirmation).forEach(t=>{const before=JSON.stringify(t.answerStandards||[]);initializeAnswerStandards(t,currentRows(stored.submissions.filter(r=>r.taskId===t.id)));if(before!==JSON.stringify(t.answerStandards||[]))changed=true;});
    if (ensureGuardianStatusDemo(stored)) changed = true;
    if (ensureTeacherHistoryDemo(stored)) changed = true;
    if (ensureSharedCombinationDemo(stored)) changed = true;
    if (ensureWorksheetFlowDemo(stored)) changed = true;
    if (changed) saveStore(stored);
    return stored;
  }
  const seed = seedStore();
  ensureGradingDemo(seed);
  const answerSample=seed.tasks.find(t=>t.id==='grading-demo-v1');if(answerSample){answerSample.needsAnswerConfirmation=true;initializeAnswerStandards(answerSample,currentRows(seed.submissions.filter(r=>r.taskId===answerSample.id)));}
  ensureGuardianStatusDemo(seed);
  ensureTeacherHistoryDemo(seed);
  ensureSharedCombinationDemo(seed);
  ensureWorksheetFlowDemo(seed);
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
    const required = task.items;
    const status = !mine.length ? 'missing' : required.every(item => mine.some(row => row.itemId === item.id)) ? 'completed' : 'partial';
    return { student, status, submissions: mine, wrongQuestions: mine.flatMap(row => row.questions || []).filter(question => isFormalGrade(question) && !question.correct), latestSubmittedAt: mine.map(row => row.submittedAt).sort().pop() || '' };
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
  const error = homeworkPublishError(input); if(error) throw new Error(error);
  const generatedTitle = input.title.trim() || formatHomeworkTitle(input.subject || '', input.kind, now);
  const publishedAt = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const seriesId = `task-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  const count = input.kind === 'checkin' ? Math.max(1, Math.min(30, input.cycleCount || 1)) : 1;
  const tasks = Array.from({ length: count }, (_, index) => {
    const deadline = new Date(input.deadline.replace(' ', 'T'));
    deadline.setDate(deadline.getDate() + index);
    const due = `${deadline.getFullYear()}-${String(deadline.getMonth() + 1).padStart(2, '0')}-${String(deadline.getDate()).padStart(2, '0')} ${String(deadline.getHours()).padStart(2, '0')}:${String(deadline.getMinutes()).padStart(2, '0')}`;
    const submitDeadline = addDays(input.submitDeadline, index);
    return { ...input,items:input.items.map(item=>({...item,required:true,gradingEnabled:input.kind==='homework'&&['photo','file'].includes(item.submitType)&&item.gradingEnabled!==false})),needsAnswerConfirmation:input.kind==='homework'&&input.items.some(i=>(i.submitType==='photo'||i.submitType==='file')&&i.gradingEnabled!==false), notification:{status:'pending' as const,message:'本地演示：作业已保存，通知待服务接入后发送。',attempts:0}, parentVisible: false, id: count === 1 ? seriesId : `${seriesId}-cycle-${index + 1}`, seriesId, cycleId: input.kind === 'checkin' ? `cycle-${index + 1}` : undefined, title: count === 1 ? generatedTitle : `${generatedTitle} · 第${index + 1}期`, targetSnapshotIds: DEMO_STUDENTS.filter(student => input.classIds.includes(student.classId) && (!input.targetStudentIds || input.targetStudentIds.includes(student.id))).map(student => student.id), schoolId: input.schoolId || 'luohu-demo', deadline: due, submitDeadline, publishedAt };
  });
  store.tasks.unshift(...tasks);
  saveStore(store);
  return tasks[0];
}

export function submitHomeworkItem(taskId: string, itemId: string, studentId: string, file?: { path: string; name: string; photos?:SubmissionPhoto[]; expectedVersion?:number; requestId?:string } & HomeworkFileReadiness, operator?: { id: string; name: string }): ItemSubmission {
  const receivedAt=Date.now();
  const store = readStore();
  const task = store.tasks.find(row => row.id === taskId);
  const item = task?.items.find(row => row.id === itemId);
  if (!task || !item || !targetStudents(task).some(student => student.id === studentId)) throw new Error('任务或接收范围不存在');
  const replay=file?.requestId&&store.submissions.find(r=>r.taskId===taskId&&r.itemId===itemId&&r.studentId===studentId&&r.requestId===file.requestId);if(replay)return replay;
  if(file){const error=homeworkOriginalError(file);if(error)throw new Error(error);}
  const latest=getStudentSubmissions(taskId,studentId).find(r=>r.itemId===itemId);
  if(file?.expectedVersion!==undefined && file.expectedVersion!==(latest?.version||0))throw new Error('已有新版本，请查看最新内容后再决定合并或替换。');
  if(file?.photos && (!file.photos.length||file.photos.length>9||file.photos.some(p=>p.error||!p.path)))throw new Error('请处理失败图片；每项最多 9 张。');
  if(item.submitType==='file'&&item.gradingEnabled!==false&&file&&!/\.(pdf|docx?)$/i.test(file.name))throw new Error('本项需自动批改，仅支持 PDF、Word。');
  if (item.submitType !== 'none' && !file?.path) throw new Error('请先选择对应的提交文件');
  const receipt=homeworkSubmissionReceipt(task,receivedAt);
  const version = store.submissions.filter(row => row.studentId === studentId && row.taskId === taskId && row.itemId === itemId).reduce((max, row) => Math.max(max, row.version || 1), 0) + 1;
  const submission: ItemSubmission = { studentId, taskId, itemId, ...receipt, requestId:file?.requestId, uploadState:'complete',previewState:file?.previewState||(item.submitType==='file'?'pending':'ready'), operatorId: operator?.id, operatorName: operator?.name, mediaLabel: file?.name || (item.submitType === 'none' ? '家长确认已完成' : `模拟${SUBMIT_LABEL[item.submitType]}提交`), photos: file?.photos, mediaPath: file?.path || (item.submitType === 'photo' ? demoPhotoPath(itemId) : ''), isMock: !file && item.submitType !== 'none', version, questions: item.submitType === 'photo' && task.kind === 'homework' ? mockExternalGrade(taskId, itemId, studentId).map(q => ({ ...q, state: 'queued' as const, estimatedMinutes: 2 })) : [] };
  if(file?.photos?.length)submission.questions=file.photos.flatMap((photo,page)=>mockExternalGrade(taskId,itemId,studentId).map(q=>({...q,id:page===0?q.id:q.id+'-page-'+page,label:'第 '+(page+1)+' 页 · '+q.label,pageIndex:page,state:'queued' as const,estimatedMinutes:2}))).filter(()=>item.gradingEnabled!==false&&task.kind==='homework');
  if(item.submitType==='file'&&item.gradingEnabled!==false){submission.questions=[];submission.gradingError='当前演示未接入文档转页与批改服务；提交已保留。';}
  store.submissions.push(submission);
  if(task.needsAnswerConfirmation){initializeAnswerStandards(task,currentRows(store.submissions.filter(r=>r.taskId===taskId)));startStandardGrading(task,currentRows(store.submissions.filter(r=>r.taskId===taskId)));}
  saveStore(store);
  return submission;
}

export function summarizeHomework(task: HomeworkTask) {
  const students = targetStudents(task);
  const submissions = currentRows(readStore().submissions.filter(row => row.taskId === task.id && students.some(student => student.id === row.studentId)));
  const completed = students.filter(student => task.items.every(item => submissions.some(row => row.studentId === student.id && row.itemId === item.id))).length;
  const partial = students.filter(student => submissions.some(row => row.studentId === student.id) && !task.items.every(item => submissions.some(row => row.studentId === student.id && row.itemId === item.id))).length;
  const questions = submissions.flatMap(row => row.questions);
  const confirmed = questions.filter(isFormalGrade);
  const questionRows = [...new Set(questions.map(question => question.id))].map(id => {
    const rows = questions.filter(question => question.id === id && isFormalGrade(question));
    const first = questions.find(question => question.id === id)!;
    return { id, ...gradingStatistics(questions.filter(q=>q.id===id)), wrong: rows.filter(question => !question.correct).length,  pending: questions.filter(q => q.id === id && (q.state === "queued" || q.state === "processing")).length, noAnswer: questions.filter(q => q.id === id && q.state === "no-answer").length, failed: questions.filter(q => q.id === id && q.state === "failed").length, label: (task.items.find(i=>submissions.some(s=>s.itemId===i.id&&s.questions.some(q=>q.id===id)))?.title||'作业')+' · '+first.label, answer: first.answer || '暂无标准答案', graded: rows.length, correct: rows.filter(question => question.correct).length, review: questions.filter(question => question.id === id && question.state === 'review').length, unreadable: questions.filter(question => question.id === id && question.state === 'unreadable').length, rate: rows.length ? Math.round(rows.filter(question => question.correct).length / rows.length * 100) : 0 };
  });
  return { grading: gradingProgress(questions), target: students.length, completed, partial, missing: students.length - completed - partial, completionRate: students.length ? Math.round(completed / students.length * 100) : 0, graded: confirmed.length, correct: confirmed.filter(question => question.correct).length, ...gradingStatistics(questions), review: questions.filter(question => question.state === 'review').length, unreadable: questions.filter(question => question.state === 'unreadable').length, noAnswer: questions.filter(question => question.state === 'no-answer').length, questionRows };
}

export function confirmMockReview(taskId: string, questionId: string, correct: boolean|null, reason: string, reviewerId: string, allowedStudentIds?: string[], expected?: {itemId:string;version:number;signature:string}): boolean {
  if (!reason.trim()) return false;
  const store = readStore();
  for (const submission of currentRows(store.submissions)) {
    if (submission.taskId !== taskId || allowedStudentIds && !allowedStudentIds.includes(submission.studentId)) continue;
    if(expected&&(submission.itemId!==expected.itemId||(submission.version||1)!==expected.version))continue;
    const question = submission.questions.find(row => row.id === questionId && ['review','confirmed','unreadable','no-answer'].includes(row.state));
    if(question&&expected&&gradingSignature(question)!==expected.signature)return false;
    if (!question) continue;
    const at = new Date().toISOString();
    question.reviewHistory = [...(question.reviewHistory || []), { at, before: question.state, after: 'confirmed', correct:correct??question.correct, reason: reason.trim(), reviewerId }];
    const task=store.tasks.find(t=>t.id===taskId);if(!task||task.publishedBy!==reviewerId)return false;
    if(correct===null)holdManualResult(question,at);else confirmManualResult(task,currentRows(store.submissions.filter(r=>r.taskId===taskId)),question,correct,at);
    saveStore(store);
    return true;
  }
  return false;
}

export function releaseHomeworkResults(task: HomeworkTask): number {
  const store = readStore(); const targets = new Set(targetStudents(task).map(s=>s.id)); let count=0;
  currentRows(store.submissions.filter(s=>s.taskId===task.id&&targets.has(s.studentId))).forEach(s=>s.questions.forEach(q=>{if(releaseQuestion(q,new Date().toISOString()))count++;}));
  saveStore(store); return count;
}
/** Explicit mock response adapter; production must replace it with the grading service response. */
export function applyMockGradingResponse(taskId: string, studentId: string): void {
  const store=readStore(); const task=store.tasks.find(t=>t.id===taskId); if(!task)return;
  currentRows(store.submissions.filter(s=>s.taskId===taskId&&s.studentId===studentId)).forEach(s=>{s.questions=mockExternalGrade(taskId,s.itemId,studentId);});if(task.needsAnswerConfirmation){initializeAnswerStandards(task,currentRows(store.submissions.filter(r=>r.taskId===taskId)));startStandardGrading(task,currentRows(store.submissions.filter(r=>r.taskId===taskId)));}saveStore(store);
}

export function enableHomeworkAnswerWorkflow(taskId:string,by:string,conflicts=false){const store=readStore(),task=store.tasks.find(t=>t.id===taskId);if(!task||task.publishedBy!==by)return false;task.needsAnswerConfirmation=true;initializeAnswerStandards(task,currentRows(store.submissions.filter(r=>r.taskId===taskId)),conflicts);saveStore(store);return true;}
export function approveHomeworkAnswer(taskId:string,id:string,source:'teacher'|'ai'|'custom',by:string,answer='',explanation=''){const store=readStore(),task=store.tasks.find(t=>t.id===taskId);if(!task||task.publishedBy!==by)return false;const records=currentRows(store.submissions.filter(r=>r.taskId===taskId));if(!confirmAnswerStandard(task,records,id,source,by,answer,explanation))return false;saveStore(store);return true;}
export function approveMatchingHomeworkAnswers(taskId:string,by:string){const store=readStore(),task=store.tasks.find(t=>t.id===taskId);if(!task||task.publishedBy!==by)return false;const records=currentRows(store.submissions.filter(r=>r.taskId===taskId));task.answerStandards?.filter(s=>s.status==='pending'&&answersEquivalent(s.teacherAnswer,s.aiAnswer)).forEach(s=>confirmAnswerStandard(task,records,s.questionId,'teacher',by));saveStore(store);return true;}
export function refreshMockHomeworkAnswerGrading(taskId:string,by:string){const store=readStore(),task=store.tasks.find(t=>t.id===taskId);if(!task||task.publishedBy!==by)return false;const changed=completeMockStandardGrading(task,currentRows(store.submissions.filter(r=>r.taskId===taskId)));if(changed)saveStore(store);return changed;}

export function manageHomework(taskId:string,action:HomeworkManagementAction,input:HomeworkChangeInput,actor:string,allowed:string[],expectedRevision:number):HomeworkTask {
  const store=readStore(),task=store.tasks.find(t=>t.id===taskId);if(!task)throw new Error('任务不存在');
  if((task.revision||0)!==expectedRevision)throw new Error('任务已更新，请重新核对后操作。');
  const error=validateHomeworkChange(task,action,input,actor,allowed);if(error)throw new Error(error);
  const affected=action==='stop'?store.tasks.filter(t=>t.seriesId===task.seriesId&&Number(t.cycleId?.replace('cycle-',''))>=Number(input.fromCycle)): [task];
  if(!affected.length)throw new Error('没有可终止的期次');
  for(const row of affected){const failure=validateHomeworkChange(row,action,input,actor,allowed);if(failure)throw new Error(failure);}
  const at=new Date().toISOString();affected.forEach(t=>applyHomeworkChange(t,action,input,actor,at));saveStore(store);return task;
}
export function retryHomeworkNotification(taskId:string,actor:string,failed=false){const store=readStore(),task=store.tasks.find(t=>t.id===taskId);if(!task||task.publishedBy!==actor)throw new Error('无权发送通知');task.notification={status:failed?'failed':'pending',message:failed?'模拟通知失败，可重试；任务变更已保存。':'本地演示：已重新排队，尚未实际发送。',attempts:(task.notification?.attempts||0)+1};saveStore(store);}

export function retryHomeworkItemGrading(taskId:string,itemId:string,studentId:string){const store=readStore(),task=store.tasks.find(t=>t.id===taskId);if(!task||!targetStudents(task).some(s=>s.id===studentId))throw new Error('无权查看本项提交');const row=currentRows(store.submissions).find(r=>r.taskId===taskId&&r.itemId===itemId&&r.studentId===studentId);if(!row)return;row.gradingError='已重试，等待批改服务处理；提交状态保持已完成。';saveStore(store);}
