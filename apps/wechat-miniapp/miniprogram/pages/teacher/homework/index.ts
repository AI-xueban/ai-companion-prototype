import { submissionImagePages, submissionGradingComplete, submissionImageFailure, homeworkItemDisplayStatus } from '../../../services/homeworkGrading';
import type { SubmissionImagePage } from '../../../services/homeworkGrading';
import { homeworkClosed, homeworkPublishError, homeworkTime, validateHomeworkChange, homeworkSnapshotText, homeworkChangeLabel } from '../../../services/homeworkGrading';
import type { HomeworkManagementAction, HomeworkChangeInput } from '../../../services/homeworkGrading';
import { manageHomework, retryHomeworkNotification, getSubmissionHistory } from '../../../services/homeworkMock';
import type { AnswerStandard } from '../../../services/homeworkGrading';
import { questionRegion } from '../../../services/homeworkLearning';
import type { QuestionRegion } from '../../../services/homeworkLearning';
import { TASK_STATUS_GROUPS, ALL_TASK_STATUSES, normalizeTaskStatuses, matchesTaskStatuses, taskStatusKeys } from '../../../services/homeworkFilters';
import { gradingProgress, gradeLabel, demoPhotoPath, gradingSignature, isFormalGrade, standardPhase, answersEquivalent } from '../../../services/homeworkGrading';
import type { GradeQuestion } from '../../../services/homeworkMock';
import { getSession } from '../../../stores/session';
import { DEMO_CLASSES, DEMO_STUDENTS, SUBMIT_LABEL, enableHomeworkAnswerWorkflow, approveHomeworkAnswer, approveMatchingHomeworkAnswers, refreshMockHomeworkAnswerGrading, releaseHomeworkResults, confirmMockReview, getHomeworkTask, getTaskStudentRows, listHomeworkTasks, publishHomework, summarizeHomework } from '../../../services/homeworkMock';
import type { HomeworkTask, HomeworkAttachment, HomeworkItem, HomeworkKind, SubmitType } from '../../../services/homeworkMock';
import { availableWorkViews, homeworkScopeSubtitle, scopeClassIds, scopedHomeworkTask, selectWorkClass, taskInScope, workScope, teachingSubjectOptions, subjectClassIds, publishingClassIds } from '../../../services/workbenchScope';
import type { SessionProfile } from '../../../types/identity';
import { selectWorkView } from '../../../services/workbenchScope';
import type { WorkScope, WorkView } from '../../../services/workbenchScope';
import { returnToHomeworkModuleHome } from '../../../services/moduleNavigation';
import { formatHomeworkTitle } from '../../../services/schoolDemoRoster';
import { HOMEWORK_WORKSHEET_LIBRARY, getHomeworkWorksheet } from '../../../services/homeworkWorksheets';

const taskInClasses = (task: HomeworkTask, ids: string[]): HomeworkTask => ({...task,classIds:task.classIds.filter(id=>ids.includes(id)),targetSnapshotIds:task.targetSnapshotIds?.filter(id=>DEMO_STUDENTS.some(s=>s.id===id&&ids.includes(s.classId))),targetStudentIds:task.targetStudentIds?.filter(id=>DEMO_STUDENTS.some(s=>s.id===id&&ids.includes(s.classId)))||null});
const canManageDetail = (task: HomeworkTask, scope: WorkScope, profile: SessionProfile) => availableWorkViews(profile).includes(scope.view) && scope.view !== 'school' && task.publishedBy === profile.userId && task.classIds.length > 0 && task.classIds.every(id => (scope.view === 'subject' ? subjectClassIds(profile,scope,task.subject||'数学') : scopeClassIds(scope)).includes(id));
const TYPES: SubmitType[] = ['file', 'photo', 'video', 'none'];
const TEACHER_CLASSES = DEMO_CLASSES.filter(row => row.id === 'c1' || row.id === 'c2');
type DraftItem = Omit<HomeworkItem, 'submitType'> & { submitType: SubmitType | '' };
const createItem = (index: number): DraftItem => ({ id: `item-${Date.now()}-${index}`, title: '', instruction: '', submitType: '', required: true, gradingEnabled:false, expectedPages:0 });
const defaultDeadline = () => { const date = new Date(Date.now() + 2 * 86400000); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} 20:00`; };
const addDays = (value: string, days: number) => { const date = new Date(value.replace(' ', 'T')); date.setDate(date.getDate() + days); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`; };
const formatDateTime = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
const displayDateTime = (value: string) => { const date = new Date(value.replace(' ', 'T')); return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 周${'日一二三四五六'[date.getDay()]} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`; };
const calendarFor = (value: string) => { const date = new Date(value.replace(' ', 'T')); const year = date.getFullYear(), month = date.getMonth(); const offset = (new Date(year, month, 1).getDay() + 6) % 7; const count = new Date(year, month + 1, 0).getDate(); return { title: `${year}年${month + 1}月`, days: [...Array.from({ length: offset }, (_, index) => ({ key: `empty-${index}`, day: 0, empty: true, selected: false })), ...Array.from({ length: count }, (_, index) => ({ key: `day-${index + 1}`, day: index + 1, empty: false, disabled:new Date(year,month,index+1,23,59,59).getTime()<Date.now(), selected: date.getDate() === index + 1 }))] }; };
const emptyDraft = (classId: string) => { const deadline = defaultDeadline(); return { title: '', titleCustomized:false, allowSupplement:true, supplementTouched:false, recipientModes:{} as Record<string,'all'|'selected'>, description: '', materialPhoto: '', attachments: [] as HomeworkAttachment[], kind: 'homework' as HomeworkKind, subject: '数学', cycleCount: 1, classIds: [classId], targetStudentIds: [] as string[], targetMode: 'all', items: [createItem(0)], deadline, submitDeadline: addDays(deadline, 7), parentVisible: false }; };
const teacherDraftKey = (userId: string) => `ai_companion_teacher_homework_draft_v1:${userId}`;
interface SavedTeacherDraft { updatedAt?:number; draft: ReturnType<typeof emptyDraft>; composeStep: number; settingMode: string; uniformType: SubmitType | ''; recognizedCount: number; recognitionStale: boolean }
const draftHasContent=(draft:ReturnType<typeof emptyDraft>)=>Boolean(draft.titleCustomized||draft.description.trim()||draft.attachments.length||draft.items.some(i=>i.title||i.instruction)||draft.kind==='checkin');
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
    listSubject: 'all', listClassId: 'all', listClassLabel: '班级', listStatuses: [...ALL_TASK_STATUSES], listStatusLabel: '状态', listTaskCount: 0, taskFilterSheet: '', taskFilterTitle: '', taskFilterOptions: [] as Array<{id:string;label:string;selected:boolean}>, taskStatusDraft: [...ALL_TASK_STATUSES], taskStatusAll: true, taskFilterError: '', taskStatusGroups: TASK_STATUS_GROUPS.map(group=>({...group,options:group.options.map(option=>({...option,selected:true}))})),
    scopeLabel: '', readOnly: false, scopeClasses: [] as Array<{ id: string; name: string; selected: boolean }>,
    scopeSummary: { taskCount: 0, target: 0, completed: 0, partial: 0, missing: 0, ongoing: 0, checkinTarget: 0, checkinCompleted: 0 },
    questionPhoto:null as {path:string;source:string;region:QuestionRegion|null;style:string}|null,questionPhotoHeight:180,questionTextOpen:false,
    answerPhase:'legacy',answerOpen:'',answerError:'',answerRows:[] as Array<AnswerStandard & {reviewCount:number;conflict:boolean;open:boolean;customAnswer:string;customExplanation:string;photoPath:string}>,
    reviewDraft:null as {studentId:string;itemId:string;version:number;questionId:string;signature:string;studentName:string;className:string;label:string;path:string;style:string;mock:boolean;studentAnswer:string;answer:string;explanation:string;aiCorrect:boolean|null;correct:string;reason:string;error:string;aiAnswer:string;referenceAnswer:string;region:QuestionRegion|null}|null,reviewPhotoHeight:180,
    resumeReviewLabel:'',resumeReviewQuestionId:'',
    gradeQuestionId: '', gradeFilter: 'wrong', selectedGradeQuestion: null as GradeQuestion | null, gradeQuestionStats: null as ReturnType<typeof summarizeHomework>['questionRows'][number] | null, gradeQuestionSections: [] as Array<{title:string; text:string; open:boolean}>, gradeStudents: [] as Array<{id:string; name:string; answer:string; result:string}>,
    mode: 'list', entryTaskId: '', fromSeries: false,
    tasks: [] as Array<Record<string, unknown>>,
    taskGroups: [] as Array<Record<string, unknown>>,
    returningFromWholeGrade: false, detailClassId: 'all', detailClassOptions: [] as Array<{id:string;name:string;completed:number;target:number}>,
    selectedTask: null as ReturnType<typeof getHomeworkTask> | null, attachmentCount: 0,
    requirementRows: [] as Array<{id:string;index:number;title:string;typeLabel:string;metaLabel:string;count:number;target:number;resultLabel:string}>,
    canReview: false, canManageTask:false, familyPreview:false, gradingItemOptions:[] as Array<{id:string;title:string}>,gradingItemId:'', recipientPickerOpen:false, rosterSignature:'',
    managementDeadlineDate:'',managementDeadlineTime:'',managementEndDate:'',managementEndTime:'',changeRows:[] as Array<{at:string;label:string;reason:string;beforeText:string;afterText:string}>,managementOpen:false, managementAction:'' as HomeworkManagementAction|'', managementInput:{reason:''} as HomeworkChangeInput, managementRevision:0, managementError:'', managementConfirmed:false, managementAffected:0,
    uniformGradingEnabled:false,deadlineExpired:false,

    summary: null as ReturnType<typeof summarizeHomework> | null,
    wrongCount: 0,
    detailStatus: '', detailStatusTone: 'ended', detailClassLabel: '', detailOngoing: false, detailCanSupplement: false, descriptionOpen: false, attachmentListOpen: false, attachmentAudio: null as HomeworkAttachment | null,
    studentEntryOrigin:'list',studentBrowseIndex:0,studentBrowseCount:0,studentPhotoOpen:false,studentPhotoIndex:0,studentPhotoPages:[] as Array<{path:string;title:string;studentId:string;page:number;itemId:string;type:string;originalPath?:string;gradedPath?:string;showOriginal?:boolean;imageError?:string}>,studentPhotoGroups:[] as Array<{studentId:string;media:Array<{path:string;title:string;studentId:string;page:number;itemId:string;type:string;originalPath?:string;gradedPath?:string;showOriginal?:boolean;imageError?:string}>;current:number}>,studentPhotoGroupIndex:0,browseItemId:'',
    studentFilter: 'all',
    studentListTitle: '',
    studentRows: [] as Array<{ id: string; name: string; className: string; statusLabel: string; progress: string; wrongCount: number; latestSubmittedAt: string }>,
    selectedStudentId: '', selectedStudentName: '', selectedStudentClassName:'',
    selectedStudentMeta: '',submissionMetrics:null as ReturnType<typeof gradingProgress>|null,
    studentItems: [] as Array<{statusLabel:string;displayPhotos:SubmissionImagePage[];hasGradedImages:boolean;viewOriginal:boolean;noGradedImage:boolean; displayNumber:string;photoCount:number;id: string; title: string; submitLabel: string; submitted: boolean; submittedAt: string; submittedTimeLabel:string; historyOpen:boolean; historyRows:Array<{version:number;at:string;operator:string}>;late: boolean; version: number; operatorLabel: string; mediaLabel: string; mediaPath: string; photos: Array<{path:string;name:string}>; isFile:boolean; gradingEnabled:boolean;gradingError:string;isPhoto: boolean; isVideo: boolean; isAudio: boolean; isMock: boolean; questions: Array<{ id: string; label: string; result: string; answer: string; studentAnswer: string; reviewCount: number; reviewHistory: Array<{ at: string; result: string; reason: string; reviewer: string }> }> }>,
    draft: emptyDraft(TEACHER_CLASSES[0].id),
    classes: [] as Array<{ id: string; name: string; selected: boolean; recipientMode:string; count:number }>,
    studentGroups: [] as Array<{ id: string; name: string; selectedCount: number; total: number; students: Array<{ id: string; name: string; selected: boolean }> }>,
    studentOptions: [] as Array<{ id: string; name: string; className: string; selected: boolean }>,
    recipientClassId:'',recipientTabs:[] as Array<{id:string;name:string;total:number;selectedCount:number}>,recipientSelectedClassCount:0,
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
    draftRows:[] as Array<{id:string;title:string;subject:string;kindLabel:string;itemCount:number;classLabel:string;deadline:string;expired:boolean;editedLabel:string;updatedAt:number}>,draftListError:'',draftFeedback:'',draftReturnMode:'list',draftMenuId:'',draftMenuTitle:'',draftDeleteOpen:false,draftDeleteId:'',draftDeleteTitle:'',draftDeleteError:'',draftDeleteSnapshot:'',draftDeleteTeacher:'',
    otherDrafts: [] as Array<{id:string;title:string;deadline:string;expired:boolean}>,
    attachmentSaving: false,
    worksheetLibraryOpen: false,
    worksheetTemplates: HOMEWORK_WORKSHEET_LIBRARY.map(item => ({ ...item, available: true })),
    deadlineDate: '', deadlineTime: '', submitDeadlineDate: '', submitDeadlineTime: '',
    submitTypeOptions: ['上传文件', '上传图片', '上传视频', '家长确认完成'],
    expandedItemIndex: 0,
    datePickerOpen: false, datePickerTarget: '' as 'deadline' | 'submitDeadline' | '', datePickerValue: '', calendarTitle: '',
    calendarDays: [] as Array<{ key: string; day: number; empty: boolean; selected: boolean; disabled?:boolean }>, weekdays: ['一', '二', '三', '四', '五', '六', '日'],
    hourOptions: Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0')), minuteOptions: Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0')),
    pickerHour: '20', pickerMinute: '00', pickerHourIndex: 20, pickerMinuteIndex: 0, deadlineDisplay: '', submitDeadlineDisplay: '', previewTargetCount: 0,
    subjectOptions: [] as string[], subjectIndex: 0,
    publishedTitle: '', publishedTargetCount: 0, publishedClasses: '', publishedDeadline: '', publishedSubmitDeadline: '', publishedItemCount: 0,
    publishing: false,
    previewOpen: false,
    previewClasses: '', previewStudents: '', previewItems: [] as Array<{ id: string; title: string; instruction: string; type: string }>,
  },
  draftRecipients(draft:ReturnType<typeof emptyDraft>){return DEMO_STUDENTS.filter(s=>draft.classIds.includes(s.classId)&&(draft.recipientModes[s.classId]!=='selected'||draft.targetStudentIds.includes(s.id)));},
  currentRosterSignature(){const draft=this.data.draft,profile=getSession()?.profile;return JSON.stringify({teacherId:profile?.userId,allowed:profile?subjectClassIds(profile,this.data.scope,draft.subject):[],students:this.draftRecipients(draft).map(s=>({id:s.id,name:s.name,classId:s.classId}))});},
  changeTitle(event:WechatMiniprogram.CustomEvent<{value:string}>){this.setData({draft:{...this.data.draft,title:event.detail.value,titleCustomized:true},hasDraft:true});this.saveTeacherDraft();},
  changeExpectedPages(event:WechatMiniprogram.CustomEvent<{value:string}>){const index=Number(event.currentTarget.dataset.index),items=this.data.draft.items.map((i,n)=>n===index?{...i,expectedPages:event.detail.value?Number(event.detail.value):0}:i);this.setData({draft:{...this.data.draft,items}});this.refreshDraft();},
  toggleGrading(event:WechatMiniprogram.CustomEvent<{value:boolean}>){const index=Number(event.currentTarget.dataset.index),items=this.data.draft.items.map((i,n)=>n===index?{...i,gradingEnabled:event.detail.value}:i);this.setData({draft:{...this.data.draft,items}});this.refreshDraft();},
  toggleSupplement(event:WechatMiniprogram.CustomEvent<{value:boolean}>){const d=this.data.draft;this.setData({draft:{...d,allowSupplement:event.detail.value,supplementTouched:false,submitDeadline:event.detail.value?addDays(d.deadline,7):d.deadline}});this.refreshDraft();},
  setClassRecipients(event:WechatMiniprogram.BaseEvent){const id=String(event.currentTarget.dataset.id),mode=String(event.currentTarget.dataset.mode) as 'all'|'selected';if(!this.data.draft.classIds.includes(id))return;this.setData({draft:{...this.data.draft,recipientModes:{...this.data.draft.recipientModes,[id]:mode}},recipientClassId:id,recipientPickerOpen:mode==='selected',studentSearch:''});this.refreshDraft();},
  closeRecipientPicker(){this.setData({recipientPickerOpen:false});},
  previewFamily(){this.setData({familyPreview:true});},closeFamilyPreview(){this.setData({familyPreview:false});},
  openItemGrades(event:WechatMiniprogram.BaseEvent){const task=this.data.selectedTask,item=task?.items.find(i=>i.id===event.currentTarget.dataset.id);if(!task||!item||!['photo','file'].includes(item.submitType)||item.gradingEnabled===false)return;if(this.data.gradingItemId)this.openTask(task.id,true);const summary=summarizeHomework({...task,items:[item]});this.setData({gradingItemOptions:task.items.filter(row=>['photo','file'].includes(row.submitType)&&row.gradingEnabled!==false).map(row=>({id:row.id,title:row.title})),gradingItemId:item.id,summary,answerRows:this.data.answerRows.filter(a=>summary.questionRows.some(q=>q.id===a.questionId))});this.refreshReviewResume();},
  openManagement(){const task=getHomeworkTask(this.data.selectedTask?.id||'');if(!task||!this.data.canManageTask)return;this.setData({managementOpen:true,managementAction:'',managementRevision:task.revision||0,managementError:'',managementConfirmed:false});},
  closeManagement(){this.setData({managementOpen:false});},
  chooseManagement(event:WechatMiniprogram.BaseEvent){const action=String(event.currentTarget.dataset.action),task=getHomeworkTask(this.data.selectedTask?.id||'');if(!task)return;
    if(action==='copy'){if(!this.archiveCurrentDraft())return;const draft={...emptyDraft(task.classIds[0]),title:task.title+'（副本）',titleCustomized:true,description:task.description,attachments:task.attachments||[],kind:task.kind,subject:task.subject||'数学',cycleCount:task.cycleCount||1,classIds:[...task.classIds],recipientModes:Object.fromEntries(task.classIds.map(id=>[id,'all' as const])),items:task.items.map(i=>({...i}))};this.setData({draft,hasDraft:true,composeStep:0,settingMode:'individual',recognitionStale:false,previewOpen:false,changeRows:[] as Array<{at:string;label:string;reason:string;beforeText:string;afterText:string}>,managementOpen:false,mode:'compose'});this.refreshDraft();this.saveTeacherDraft();return;}
    this.setData({managementDeadlineDate:task.deadline.split(' ')[0],managementDeadlineTime:task.deadline.split(' ')[1],managementEndDate:task.submitDeadline.split(' ')[0],managementEndTime:task.submitDeadline.split(' ')[1],managementAction:action as HomeworkManagementAction,managementInput:{reason:'',deadline:task.deadline,submitDeadline:task.submitDeadline,description:task.description,itemTexts:task.items.map(i=>({id:i.id,title:i.title,instruction:i.instruction})),fromCycle:Number(task.cycleId?.replace('cycle-',''))||1},managementError:'',managementConfirmed:false});
  },
  changeManagementTime(event:WechatMiniprogram.CustomEvent<{value:string}>){const field=String(event.currentTarget.dataset.field),part=String(event.currentTarget.dataset.part),value=this.data.managementInput[field as 'deadline'|'submitDeadline']||'',pieces=value.split(' ');pieces[part==='date'?0:1]=event.detail.value;const input={...this.data.managementInput,[field]:pieces.join(' ')};this.setData({managementInput:input,managementDeadlineDate:input.deadline!.split(' ')[0],managementDeadlineTime:input.deadline!.split(' ')[1],managementEndDate:input.submitDeadline!.split(' ')[0],managementEndTime:input.submitDeadline!.split(' ')[1],managementConfirmed:false});},
  changeManagement(event:WechatMiniprogram.CustomEvent<{value:string}>){const key=String(event.currentTarget.dataset.field);this.setData({managementInput:{...this.data.managementInput,[key]:key==='fromCycle'?Number(event.detail.value):event.detail.value.replace(key==='deadline'||key==='submitDeadline'?'T':'\u0000',' ')},managementConfirmed:false});},
  changeManagementItem(event:WechatMiniprogram.CustomEvent<{value:string}>){const index=Number(event.currentTarget.dataset.index),field=String(event.currentTarget.dataset.field),itemTexts=this.data.managementInput.itemTexts?.map((i,n)=>n===index?{...i,[field]:event.detail.value}:i);this.setData({managementInput:{...this.data.managementInput,itemTexts},managementConfirmed:false});},
  saveManagement(){
    const task=getHomeworkTask(this.data.selectedTask?.id||''),profile=getSession()?.profile;if(!task||!profile||this.data.scope.view==='school'||!this.data.canManageTask)return;
    const action=this.data.managementAction;if(!action)return;const error=validateHomeworkChange(task,action,this.data.managementInput,profile.userId,subjectClassIds(profile,this.data.scope,task.subject||'数学'));if(error){this.setData({managementError:error});return;}
    const commit=()=>{try{manageHomework(task.id,action,this.data.managementInput,profile.userId,subjectClassIds(profile,this.data.scope,task.subject||'数学'),this.data.managementRevision);this.setData({managementOpen:false});this.openTask(task.id,true);}catch(error){this.setData({managementError:error instanceof Error?error.message:'保存失败，请重试。'});}};
    wx.showModal({title:'确认任务变更',content:'已有 '+getTaskStudentRows(task).filter(s=>s.submissions.length).length+' 人提交。'+(action==='stop'?'从第 '+this.data.managementInput.fromCycle+' 期起终止，':'')+'已有提交和历史结果保留；变更将记录原因。',confirmText:'确认执行',success:result=>{if(result.confirm)commit();}});
  },
  retryNotification(){const profile=getSession()?.profile;if(!profile||!this.data.canManageTask)return;try{retryHomeworkNotification(this.data.selectedTask!.id,profile.userId);this.openTask(this.data.selectedTask!.id,true);}catch(error){wx.showToast({title:error instanceof Error?error.message:'重试失败',icon:'none'});}},

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
    const resumeTaskId=this.data.returningFromWholeGrade?this.data.selectedTask?.id:'';
    const resumeQuestion=this.data.mode==='question';
    this.setData({returningFromWholeGrade:false});
    const scope = workScope(session.profile);
    if(scope.view!==this.data.scope.view)this.setData({listSubject:'all',listClassId:'all',listStatuses:[...ALL_TASK_STATUSES],taskFilterSheet:''});
    const allowedClasses = scopeClassIds(scope);
    const keepDraft = this.data.hasDraft && this.data.draft.classIds.every(id => publishingClassIds(session.profile, scope).includes(id));
    this.setData({draftMenuId:'',draftDeleteOpen:false, scope, scopeLabel: homeworkScopeSubtitle(scope), readOnly: scope.view === 'school', mode: keepDraft && this.data.mode === 'compose' && scope.view !== 'school' ? 'compose' : 'list', selectedTask: null, previewOpen: false,
      hasDraft: keepDraft, draft: keepDraft ? this.data.draft : emptyDraft(allowedClasses[0] || 'c1'), composeStep: keepDraft ? this.data.composeStep : 0,
      scopeClasses: DEMO_CLASSES.filter(row => scopeClassIds({ ...scope, classId: 'all' }).includes(row.id)).map(row => ({ id: row.id, name: row.name, selected: row.id === scope.classId })) });
    this.refreshList();
    this.refreshDraft();
    if(resumeTaskId){this.openTask(resumeTaskId,true);if(resumeQuestion&&this.data.mode==='detail')this.loadGradeQuestion();}
    else if (this.data.entryTaskId) this.openTask(this.data.entryTaskId);
  },
  onHide() { this.pauseStudentVideo();this.saveTeacherDraft(); },
  draftScrollTop:0,
  onPageScroll(event:{scrollTop:number}){if(this.data.mode==='drafts')this.draftScrollTop=event.scrollTop;},
  onUnload() { this.pauseStudentVideo();this.saveTeacherDraft(); },
  saveTeacherDraft() {
    const userId = getSession()?.profile.userId;
    if (!userId || !this.data.hasDraft) return;
    const { draft, composeStep, settingMode, uniformType, recognizedCount, recognitionStale } = this.data;
    try { wx.setStorageSync(teacherDraftKey(userId), { draft, composeStep, settingMode, uniformType, recognizedCount, recognitionStale,updatedAt:JSON.stringify((wx.getStorageSync(teacherDraftKey(userId)) as SavedTeacherDraft|undefined)?.draft)===JSON.stringify(draft)?(wx.getStorageSync(teacherDraftKey(userId)) as SavedTeacherDraft|undefined)?.updatedAt||0:Date.now() } as SavedTeacherDraft); return true; }
    catch { this.setData({composeError:'草稿保存失败，请保留当前页面，移除部分附件后重试。'});wx.showToast({title:'草稿保存失败，请保留当前页面',icon:'none'}); return false; }
  },
  changeScopeClass(event: WechatMiniprogram.BaseEvent) {
    const profile = getSession()?.profile;
    if (!profile || this.data.scope.view !== 'school') return;
    const scope = selectWorkClass(profile, String(event.currentTarget.dataset.id));
    this.setData({ scope, scopeLabel: homeworkScopeSubtitle(scope), mode: 'list', selectedTask: null,
      scopeClasses: DEMO_CLASSES.filter(row => scopeClassIds({ ...scope, classId: 'all' }).includes(row.id)).map(row => ({ id: row.id, name: row.name, selected: row.id === scope.classId })) });
    this.refreshList();
  },
  listAllowedClasses(subject?: string): string[] {subject=subject??this.data.listSubject;const profile=getSession()?.profile;if(!profile)return [];return this.data.scope.view==='subject'?[...new Set(teachingSubjectOptions(profile,this.data.scope).filter(s=>subject==='all'||s===subject).flatMap(s=>subjectClassIds(profile,this.data.scope,s)))]:scopeClassIds(this.data.scope);},
  listSubjects(): string[] {const profile=getSession()?.profile;return !profile?[]:this.data.scope.view==='school'?[...new Set(listHomeworkTasks().map(task=>task.subject||'综合'))]:teachingSubjectOptions(profile,this.data.scope);},
  openTaskFilter(event: WechatMiniprogram.BaseEvent) {const kind=String(event.currentTarget.dataset.kind);if(!['subject','class','status'].includes(kind))return;const options=kind==='subject'?[{id:'all',label:'全部学科'},...this.listSubjects().map(subject=>({id:subject,label:subject}))]:[{id:'all',label:'全部班级'},...DEMO_CLASSES.filter(c=>this.listAllowedClasses().includes(c.id)).map(c=>({id:c.id,label:c.name}))];this.setData({taskFilterSheet:kind,taskFilterTitle:kind==='subject'?'选择学科':kind==='class'?'选择班级':'任务状态',taskFilterError:'',taskStatusDraft:[...this.data.listStatuses],taskFilterOptions:options.map(option=>({...option,selected:(kind==='subject'?this.data.listSubject:this.data.listClassId)===option.id}))});this.updateTaskStatusDraft();},
  closeTaskFilter(){this.setData({taskFilterSheet:'',taskFilterError:''});},
  selectTaskFilter(event: WechatMiniprogram.BaseEvent){const id=String(event.currentTarget.dataset.id);if(!this.data.taskFilterOptions.some(option=>option.id===id))return;if(this.data.taskFilterSheet==='subject')this.setData({listSubject:id});else if(this.data.taskFilterSheet==='class')this.setData({listClassId:id});else return;this.closeTaskFilter();this.refreshList();},
  updateTaskStatusDraft(){this.setData({taskStatusAll:this.data.taskStatusDraft.length===ALL_TASK_STATUSES.length,taskStatusGroups:TASK_STATUS_GROUPS.map(group=>({...group,options:group.options.map(option=>({...option,selected:this.data.taskStatusDraft.includes(option.id)}))}))});},
  toggleTaskStatus(event: WechatMiniprogram.BaseEvent){const id=String(event.currentTarget.dataset.id);if(!ALL_TASK_STATUSES.includes(id))return;this.setData({taskStatusDraft:this.data.taskStatusDraft.includes(id)?this.data.taskStatusDraft.filter(value=>value!==id):[...this.data.taskStatusDraft,id],taskFilterError:''});this.updateTaskStatusDraft();},
  toggleAllTaskStatuses(){this.setData({taskStatusDraft:this.data.taskStatusAll?[]:[...ALL_TASK_STATUSES],taskFilterError:''});this.updateTaskStatusDraft();},
  resetTaskStatusDraft(){this.setData({taskStatusDraft:[...ALL_TASK_STATUSES],taskFilterError:''});this.updateTaskStatusDraft();},
  confirmTaskStatuses(){if(!this.data.taskStatusDraft.length){this.setData({taskFilterError:'请至少选择一个状态'});return;}this.setData({listStatuses:normalizeTaskStatuses(this.data.taskStatusDraft)});this.closeTaskFilter();this.refreshList();},
  resetTaskFilters(){this.setData({listSubject:'all',listClassId:'all',listStatuses:[...ALL_TASK_STATUSES]});this.closeTaskFilter();this.refreshList();},
  refreshList() {
    this.refreshOtherDrafts();
    const profile = getSession()?.profile;
    if (!profile) return;
    const scope = this.data.scope;
    if(this.data.listSubject!=='all'&&!this.listSubjects().includes(this.data.listSubject))this.setData({listSubject:'all'});
    if(this.data.listClassId!=='all'&&!this.listAllowedClasses().includes(this.data.listClassId))this.setData({listClassId:'all'});
    const tasks = listHomeworkTasks().filter(task=>(scope.view==='school'||task.publishedBy===profile.userId)&&(this.data.listSubject==='all'||(task.subject||'综合')===this.data.listSubject)).flatMap(task => {
      const allowed=scope.view==='subject'?subjectClassIds(profile,scope,task.subject||'数学'):scopeClassIds(scope);
      const visibleTask=taskInClasses(task,allowed.filter(id=>this.data.listClassId==='all'||id===this.data.listClassId));
      if(!visibleTask.classIds.length)return [];
      const questions=getTaskStudentRows(visibleTask).flatMap(row=>row.submissions.flatMap(s=>s.questions));
      const summary = summarizeHomework(visibleTask);
      if(!matchesTaskStatuses(this.data.listStatuses,taskStatusKeys(summary,questions)))return [];
      const ongoing = new Date(task.deadline.replace(' ', 'T')).getTime() > Date.now();
      const assignedClassCount = task.classIds.filter(id=>(scope.view==='subject'?subjectClassIds(profile,scope,task.subject||'数学'):scopeClassIds(scope)).includes(id)).length;
      const allSubmitted = summary.target > 0 && summary.completed === summary.target;
      const canSupplement = new Date(task.submitDeadline.replace(' ', 'T')).getTime() > Date.now();
      const shortTime = (value: string) => value.slice(5).replace('-', '月').replace(' ', '日 ');
      const timeLabel = allSubmitted || !ongoing && !canSupplement ? '' : ongoing ? `${shortTime(task.deadline)} 截止` : `补交至 ${shortTime(task.submitDeadline)}`;
      const attentionLabel = summary.review ? `待复核 ${summary.review} 题次` : '';
      const submissionRemainder = summary.target > summary.completed ? `未交齐 ${summary.target-summary.completed}` : '';
      return [{ itemCount:task.items.length,itemTypes:[...new Set(task.items.map(item=>item.submitType==='none'?'家长确认':SUBMIT_LABEL[item.submitType]))].join('、'),subject:task.subject||'综合', timeLabel, attentionLabel, submissionRemainder, listProgressLabel: assignedClassCount > visibleTask.classIds.length ? '本班交齐' : '交齐', id: task.id, seriesId: task.seriesId || task.id, title: task.title, kind: task.kind, kindLabel: task.kind === 'checkin' ? '打卡' : '作业', classLabel: visibleTask.classIds.map(id => DEMO_CLASSES.find(row => row.id === id)?.name).join('、') + (assignedClassCount > 1 ? ` · 共 ${assignedClassCount} 个班` : ''), publishedAt: task.publishedAt || '', deadline: task.deadline, submitDeadline: task.submitDeadline, ongoing, statusLabel: task.withdrawnAt?'老师已撤回':task.stoppedAt?'打卡已终止':allSubmitted ? this.data.listClassId!=='all'&&assignedClassCount>1?'本班已交齐':'全部已交' : ongoing ? '进行中' : canSupplement ? '补交中' : '已结束', target: summary.target, completed: summary.completed, partial: summary.partial, missing: summary.missing, completionRate: summary.completionRate }];
    });
    const scopeSummary = tasks.reduce((total, row) => {
      const source=getHomeworkTask(String(row.id));if(source?.withdrawnAt||source?.stoppedAt)return total;
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
        publishedAt: phases.map(phase=>phase.publishedAt).sort().pop() || '', deadline: phases[phases.length - 1].deadline, ongoing: upcomingIndex >= 0,
        dateRange: `${phases[0].deadline.slice(0, 10)} — ${phases[phases.length - 1].deadline.slice(0, 10)}`,
        nextLabel: `${upcomingIndex >= 0 ? '最近截止' : '最后截止'}：第${nextIndex + 1}期 · ${next.deadline}`, completed, target }];
    });
    taskGroups.sort((a, b) => Number(Boolean(b.ongoing)) - Number(Boolean(a.ongoing)) || String(b.publishedAt || '').localeCompare(String(a.publishedAt || '')));
    let previousSection = '';
    taskGroups.forEach(group => { const section = group.ongoing ? '当前任务' : '历史任务'; group.sectionLabel = section === previousSection || section==='当前任务' ? '' : section; previousSection = section; });
    this.setData({ tasks, taskGroups, scopeSummary, listTaskCount:taskGroups.length,listClassLabel:this.data.listClassId==='all'?'班级':DEMO_CLASSES.find(c=>c.id===this.data.listClassId)?.name||'班级',listStatusLabel:this.data.listStatuses.length===ALL_TASK_STATUSES.length?'状态':`状态·${this.data.listStatuses.length}` });
  },
  openSeries(event: WechatMiniprogram.BaseEvent) { const id = String(event.currentTarget.dataset.id); if (id) wx.navigateTo({ url: `/pages/teacher/homework-series/index?seriesId=${encodeURIComponent(id)}` }); },
  refreshDraft() {
    const profile = getSession()?.profile;
    const subjectOptions = profile ? teachingSubjectOptions(profile, this.data.scope) : [];
    const subject = subjectOptions.includes(this.data.draft.subject) ? this.data.draft.subject : subjectOptions[0] || '';
    const allowed = profile ? subjectClassIds(profile, this.data.scope, subject) : [];
    const selected = this.data.draft.classIds.filter(id => allowed.includes(id));
    const classIds = !selected.length && this.data.draft.subject !== subject ? allowed.slice(0, 1) : selected;
    const draft = { ...this.data.draft, recipientModes:this.data.draft.recipientModes||{}, subject, title: this.data.draft.titleCustomized?this.data.draft.title:formatHomeworkTitle(subject, this.data.draft.kind), classIds, targetStudentIds: this.data.draft.targetStudentIds.filter(id => DEMO_STUDENTS.some(student => student.id === id && classIds.includes(student.classId))) };
    draft.classIds.forEach(id=>{if(!draft.recipientModes[id])draft.recipientModes[id]=draft.targetMode==='selected'?'selected':'all';});
    draft.items.forEach(item=>{if(item.gradingEnabled===undefined)item.gradingEnabled=draft.kind==='homework'&&['photo','file'].includes(item.submitType);});
    this.setData({ deadlineExpired:homeworkTime(draft.deadline)<=Date.now(),uniformGradingEnabled:draft.items.every(i=>i.gradingEnabled===true),draft, subjectOptions, subjectIndex: Math.max(0, subjectOptions.indexOf(subject)) });
    const matches = DEMO_STUDENTS.filter(student => allowed.includes(student.classId) && draft.classIds.includes(student.classId) && (!this.data.studentSearch || `${student.name}${student.id}${DEMO_CLASSES.find(row => row.id === student.classId)?.name || ''}`.includes(this.data.studentSearch)));
    const recipientClassId=draft.classIds.includes(this.data.recipientClassId)?this.data.recipientClassId:draft.classIds[0]||'';
    const recipientTabs=DEMO_CLASSES.filter(c=>draft.classIds.includes(c.id)).map(c=>({id:c.id,name:c.name,total:DEMO_STUDENTS.filter(student=>student.classId===c.id).length,selectedCount:draft.targetStudentIds.filter(id=>DEMO_STUDENTS.some(student=>student.id===id&&student.classId===c.id)).length}));
    this.setData({recipientClassId,recipientTabs,recipientSelectedClassCount:recipientTabs.filter(c=>c.selectedCount>0).length, studentGroups: DEMO_CLASSES.filter(row => row.id===recipientClassId).map(row => ({ id: row.id, name: row.name, total: DEMO_STUDENTS.filter(student => student.classId === row.id).length, selectedCount: draft.targetStudentIds.filter(id => DEMO_STUDENTS.some(student => student.id === id && student.classId === row.id)).length, students: matches.filter(student => student.classId === row.id).map(student => ({ ...student, selected: draft.targetStudentIds.includes(student.id) })) })), classes: DEMO_CLASSES.filter(row => allowed.includes(row.id)).map(row => ({ ...row, selected: draft.classIds.includes(row.id),recipientMode:draft.recipientModes[row.id]||'all',count:draft.recipientModes[row.id]==='selected'?draft.targetStudentIds.filter(id=>DEMO_STUDENTS.some(s=>s.id===id&&s.classId===row.id)).length:DEMO_STUDENTS.filter(s=>s.classId===row.id).length })), studentOptions: matches.map(student => ({ ...student, className: DEMO_CLASSES.find(row => row.id === student.classId)?.name || '', selected: draft.targetStudentIds.includes(student.id) })), draftItems: draft.items.map(item => ({ ...item, submitLabel: item.submitType === 'none' ? '线下完成' : item.submitType ? SUBMIT_LABEL[item.submitType] : '请选择', submitIndex: item.submitType ? TYPES.indexOf(item.submitType) : -1 })), deadlineDate: draft.deadline.split(' ')[0], deadlineTime: draft.deadline.split(' ')[1] || '20:00', submitDeadlineDate: draft.submitDeadline.split(' ')[0], submitDeadlineTime: draft.submitDeadline.split(' ')[1] || '20:00', deadlineDisplay: displayDateTime(draft.deadline), submitDeadlineDisplay: displayDateTime(draft.submitDeadline), previewTargetCount: this.draftRecipients(draft).length });
  },
  readTeacherDraftArchive(): Array<{id:string;saved:SavedTeacherDraft}>{
    const id=getSession()?.profile.userId;if(!id)return [];
    const rows=wx.getStorageSync(teacherDraftKey(id)+':archive')||[];
    if(!Array.isArray(rows)||rows.some(row=>!row?.id||!row.saved?.draft||!Array.isArray(row.saved.draft.items)||!Array.isArray(row.saved.draft.classIds)))throw Error('草稿数据无法读取');
    return rows;
  },
  toggleHomeworkRole(){const profile=getSession()?.profile;if(!profile)return;const views=availableWorkViews(profile),labels={school:'学校管理员',homeroom:'班主任',subject:'任课老师'};wx.showActionSheet({itemList:views.map(view=>labels[view]),success:r=>{if(this.saveTeacherDraft()===false)return;selectWorkView(profile,views[r.tapIndex] as WorkView);this.setData({mode:'list',draftMenuId:'',draftDeleteOpen:false});this.onShow();}});},
  refreshOtherDrafts(){
    const id=getSession()?.profile.userId;if(!id)return;
    try{const rows=this.readTeacherDraftArchive();const all=[...rows];if(this.data.hasDraft&&draftHasContent(this.data.draft))all.push({id:'current',saved:{draft:this.data.draft,composeStep:this.data.composeStep,settingMode:this.data.settingMode,uniformType:this.data.uniformType,recognizedCount:this.data.recognizedCount,recognitionStale:this.data.recognitionStale,updatedAt:(wx.getStorageSync(teacherDraftKey(id)) as SavedTeacherDraft|undefined)?.updatedAt||0}});
      const draftRows=all.map(row=>{const d=row.saved.draft;return {id:row.id,title:d.title||'未命名作业',subject:d.subject||'综合',kindLabel:d.kind==='checkin'?'打卡':'作业',itemCount:d.items.length,classLabel:d.classIds.map(id=>DEMO_CLASSES.find(c=>c.id===id)?.name||id).join('、')||'待选择班级',deadline:d.deadline||'待设置',expired:homeworkTime(d.deadline)<=Date.now(),editedLabel:row.saved.updatedAt?'最近编辑 '+formatDateTime(new Date(row.saved.updatedAt)):'历史草稿 · 编辑时间未记录',updatedAt:row.saved.updatedAt||0};}).sort((a,b)=>b.updatedAt-a.updatedAt);
      this.setData({otherDrafts:rows.map(row=>({id:row.id,title:row.saved.draft.title||'未命名作业',deadline:row.saved.draft.deadline,expired:homeworkTime(row.saved.draft.deadline)<=Date.now()})),draftRows,draftListError:''});
    }catch{this.setData({draftListError:'草稿暂时无法读取，请重试；原内容仍保留。'});}
  },
  openTeacherDrafts(){if(this.data.readOnly)return;if(this.saveTeacherDraft()===false)return;this.setData({mode:'drafts',draftFeedback:'',draftMenuId:'',draftDeleteOpen:false});this.refreshOtherDrafts();wx.pageScrollTo({scrollTop:this.draftScrollTop,duration:0});},
  retryDraftList(){this.setData({draftFeedback:''});this.refreshOtherDrafts();},
  archiveCurrentDraft():boolean {
    const id=getSession()?.profile.userId;if(!id||!this.data.hasDraft||!draftHasContent(this.data.draft))return true;
    try{if(this.saveTeacherDraft()===false)return false;const rows=this.readTeacherDraftArchive();rows.unshift({id:'draft-'+Date.now()+'-'+Math.random().toString(36).slice(2),saved:wx.getStorageSync(teacherDraftKey(id)) as SavedTeacherDraft});wx.setStorageSync(teacherDraftKey(id)+':archive',rows);return true;}
    catch{this.setData({draftFeedback:'草稿保存失败，请重试；当前内容仍保留。'});return false;}
  },
  newTeacherDraft(){if(this.data.readOnly)return;const origin=this.data.mode==='drafts'?'drafts':'list';if(!this.archiveCurrentDraft())return;try{const id=getSession()?.profile.userId;if(id)wx.removeStorageSync(teacherDraftKey(id));}catch{this.setData({draftFeedback:'草稿存储不可用，请重试。'});return;}this.setData({draftReturnMode:origin,hasDraft:false,recognizedCount:0,recognitionStale:false});this.startCompose();this.refreshOtherDrafts();},
  openSavedDraft(event:WechatMiniprogram.BaseEvent){if(this.data.readOnly)return;this.setData({draftReturnMode:'drafts',draftFeedback:''});if(String(event.currentTarget.dataset.id)==='current')this.startCompose();else this.resumeOtherDraft(event);},
  openDraftMenu(event:WechatMiniprogram.BaseEvent){if(this.data.readOnly)return;const row=this.data.draftRows.find(row=>row.id===String(event.currentTarget.dataset.id));if(row)this.setData({draftMenuId:row.id,draftMenuTitle:row.title});},
  closeDraftOverlay(){this.setData({draftMenuId:'',draftDeleteOpen:false,draftDeleteError:''});},
  requestDraftDeletion(){this.openDraftDelete(this.data.draftMenuId);},
  deleteTeacherDraft(){this.openDraftDelete('current');},
  deleteOtherDraft(event:WechatMiniprogram.BaseEvent){this.openDraftDelete(String(event.currentTarget.dataset.id));},
  openDraftDelete(id:string){
    const userId=getSession()?.profile.userId;if(!userId||this.data.readOnly||!id)return;
    try{const row=id==='current'?{saved:wx.getStorageSync(teacherDraftKey(userId)) as SavedTeacherDraft}:this.readTeacherDraftArchive().find(row=>row.id===id);if(!row)throw Error();this.setData({draftDeleteOpen:true,draftMenuId:'',draftDeleteId:id,draftDeleteTitle:row.saved.draft.title||'未命名作业',draftDeleteSnapshot:JSON.stringify(row.saved),draftDeleteTeacher:userId,draftDeleteError:''});}
    catch{this.setData({draftFeedback:'草稿已变化或无法读取，请刷新后重试。'});}
  },
  confirmDraftDeletion(){
    if(!this.data.draftDeleteOpen)return;const userId=getSession()?.profile.userId;
    if(!userId||this.data.readOnly||userId!==this.data.draftDeleteTeacher){this.closeDraftOverlay();this.setData({draftFeedback:'工作身份已变化，请重新进入我的草稿。'});return;}
    try{const id=this.data.draftDeleteId,key=teacherDraftKey(userId);if(id==='current'){
      if(JSON.stringify(wx.getStorageSync(key))!==this.data.draftDeleteSnapshot)throw Error('这份草稿已更新，请取消后重新核对。');wx.removeStorageSync(key);this.setData({hasDraft:false,draft:emptyDraft('c1'),composeStep:0});
    }else{const rows=this.readTeacherDraftArchive(),row=rows.find(row=>row.id===id);if(!row||JSON.stringify(row.saved)!==this.data.draftDeleteSnapshot)throw Error('这份草稿已变化，请取消后重新核对。');wx.setStorageSync(key+':archive',rows.filter(row=>row.id!==id));}
      this.closeDraftOverlay();this.setData({mode:'drafts',draftFeedback:'草稿已删除'});this.refreshOtherDrafts();
    }catch(error){const message=error instanceof Error?error.message:'';this.setData({draftDeleteError:message.includes('已')?message:'删除失败，草稿仍保留，请重试。'});}
  },
  resumeOtherDraft(event:WechatMiniprogram.BaseEvent){if(this.data.readOnly)return;const userId=getSession()?.profile.userId;if(!userId)return;
    try{const key=teacherDraftKey(userId),row=this.readTeacherDraftArchive().find(r=>r.id===String(event.currentTarget.dataset.id));if(!row){this.setData({draftFeedback:'这份草稿已不存在，请刷新列表。'});return;}if(!row.saved.draft.classIds.every(id=>publishingClassIds(getSession()!.profile,this.data.scope).includes(id))){this.setData({draftFeedback:'接收范围已变化，请核对工作身份后继续。'});return;}if(!this.archiveCurrentDraft())return;wx.setStorageSync(key,row.saved);wx.setStorageSync(key+':archive',this.readTeacherDraftArchive().filter(r=>r.id!==row.id));this.setData({...row.saved,hasDraft:true,previewOpen:false,mode:'compose'});this.refreshDraft();this.refreshOtherDrafts();if(this.data.deadlineExpired)this.setData({composeStep:0});}
    catch{this.setData({draftFeedback:'草稿切换失败，内容仍保留，请重试。'});}
  },
  quickDeadline(event:WechatMiniprogram.BaseEvent) {const date=new Date();date.setDate(date.getDate()+Number(event.currentTarget.dataset.days));date.setHours(20,0,0,0);if(date.getTime()<=Date.now()){wx.showToast({title:'今天20点已过，请选更晚时间',icon:'none'});this.setData({datePickerTarget:'deadline',datePickerOpen:true});this.updateDatePicker(formatDateTime(new Date(Date.now()+3600000)));return;}this.setData({datePickerTarget:'deadline',datePickerValue:formatDateTime(date)});this.confirmDatePicker();},
  quickPickerDate(event:WechatMiniprogram.BaseEvent) {const old=new Date(this.data.datePickerValue.replace(' ','T')),date=new Date();date.setDate(date.getDate()+Number(event.currentTarget.dataset.days));date.setHours(old.getHours(),old.getMinutes(),0,0);this.updateDatePicker(formatDateTime(date));},
  startCompose() {
    if(this.data.readOnly)return;
    const existing=this.data.hasDraft,profile=getSession()?.profile;
    const draft=existing?this.data.draft:emptyDraft(this.data.listClassId!=='all'?this.data.listClassId:scopeClassIds(this.data.scope)[0]||TEACHER_CLASSES[0].id);
    if(!existing&&profile&&this.data.listSubject!=='all'&&teachingSubjectOptions(profile,this.data.scope).includes(this.data.listSubject)){draft.subject=this.data.listSubject;const allowed=subjectClassIds(profile,this.data.scope,draft.subject);draft.classIds=draft.classIds.filter(id=>allowed.includes(id));if(!draft.classIds.length)draft.classIds=allowed.slice(0,1);draft.title=formatHomeworkTitle(draft.subject,draft.kind);}
    this.setData({mode:'compose',draft,composeStep:existing&&homeworkTime(draft.deadline)>Date.now()?this.data.composeStep:0,uniformType:existing?this.data.uniformType:'',settingMode:existing?this.data.settingMode:'uniform',composeError:'',studentSearch:'',previewOpen:false,hasDraft:true});this.refreshDraft();
  },
  backCompose() { if (this.data.composeStep > 0) this.setData({ composeStep: this.data.composeStep - 1, composeError: '' }); else if(this.data.draftReturnMode==='drafts')this.openTeacherDrafts();else this.backToList(); },
  navigateBack() {if(this.data.studentPhotoOpen){this.closeStudentPhoto();return;}
    if(this.data.draftDeleteOpen||this.data.draftMenuId){this.closeDraftOverlay();return;}
    if (this.data.previewOpen) { this.closePreview(); return; }
    if (this.data.mode === 'question') this.backToStats();
    else if (this.data.mode === 'student') this.backToStudents();
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
      else if (!draft.submitDeadline || new Date(draft.submitDeadline.replace(' ', 'T')).getTime() < new Date(draft.deadline.replace(' ', 'T')).getTime()) error = '补交截止时间必须晚于原截止时间';
    } else if (step === 1) {
      if (!draft.classIds.length) error = '请至少选择一个班级';
      else if (draft.classIds.some(id=>draft.recipientModes[id]==='selected'&&!DEMO_STUDENTS.some(s=>s.classId===id&&draft.targetStudentIds.includes(s.id)))) error = '请选择要接收作业的学生';
    }
    if (error) { this.setData({ composeError: error }); return; }
    this.setData({ composeError: '' });
    if (step < 1) this.setData({ composeStep: step + 1 }); else this.previewPublish();
  },
  returnToHomeworkHome() { if(this.saveTeacherDraft()===false)return; this.setData({ fromSeries: false, entryTaskId: '', mode: 'list', previewOpen: false, selectedTask: null, summary: null, datePickerOpen: false }); returnToHomeworkModuleHome(); this.refreshList(); },
  backToList() { if(this.data.mode==='compose'&&this.saveTeacherDraft()===false)return;if (this.data.fromSeries) { wx.navigateBack({ delta: 1 }); return; } this.setData({ mode: 'list', previewOpen: false, selectedTask: null, summary: null }); this.refreshList(); },
  openLearning() { if (this.data.mode === 'list') wx.redirectTo({ url: '/pages/teacher/learning/index' }); },
  openDetail(event: WechatMiniprogram.BaseEvent) { this.setData({detailClassId:this.data.listClassId});this.openTask(String(event.currentTarget.dataset.id),true); },
  openTask(taskId: string, keepClass = false) {
    const profile = getSession()?.profile;
    let task = getHomeworkTask(taskId);
    if(profile&&task?.needsAnswerConfirmation&&!task.answerStandards?.length&&task.publishedBy===profile.userId){enableHomeworkAnswerWorkflow(taskId,profile.userId);task=getHomeworkTask(taskId);}
    if (profile && task && (this.data.scope.view==='school'?taskInScope(task,this.data.scope,profile.userId):task.publishedBy===profile.userId&&task.classIds.some(id=>this.listAllowedClasses(task.subject||'数学').includes(id)))) {
      const allowed=this.data.scope.view==='subject'?subjectClassIds(profile,this.data.scope,task.subject||'数学'):scopeClassIds(this.data.scope);
      const baseTask = taskInClasses(task,allowed);
      const classId = keepClass && (this.data.detailClassId === 'all' || baseTask.classIds.includes(this.data.detailClassId)) ? this.data.detailClassId : scopeClassIds(this.data.scope).length===1?scopeClassIds(this.data.scope)[0]:'all';
      const visibleTask = classId === 'all' ? baseTask : taskInClasses(baseTask,[classId]);
      const detailClassOptions = [{id:'all',name:'全部班级',task:baseTask},...baseTask.classIds.map(id=>({id,name:DEMO_CLASSES.find(c=>c.id===id)?.name||id,task:taskInClasses(baseTask,[id])}))].map(option=>{const stats=summarizeHomework(option.task);return {id:option.id,name:option.name,completed:stats.completed,target:stats.target};});
      this.setData({detailClassId:classId,detailClassOptions,gradingItemId:'',resumeReviewLabel:'',resumeReviewQuestionId:''});
      const ongoing = new Date(task.deadline.replace(' ', 'T')).getTime() > Date.now();
      const canSupplement = new Date(task.submitDeadline.replace(' ', 'T')).getTime() > Date.now();
      this.setData({ detailStatus: ongoing ? '进行中' : canSupplement ? '可补交' : '已结束', detailStatusTone: ongoing ? 'active' : canSupplement ? 'late' : 'ended', detailOngoing: ongoing, detailCanSupplement: canSupplement, descriptionOpen: false, detailClassLabel: visibleTask.classIds.map(id => DEMO_CLASSES.find(row => row.id === id)?.name || id).join('、') });
      const detailRows=getTaskStudentRows(visibleTask),detailSummary=summarizeHomework(visibleTask);
      this.setData({canManageTask:this.data.scope.view!=='school'&&task.publishedBy===profile.userId&&task.classIds.every(id=>subjectClassIds(profile,this.data.scope,task.subject||'数学').includes(id)),detailStatus:task.withdrawnAt?'老师已撤回':task.stoppedAt?'打卡已终止':this.data.detailStatus});
      const requirementRows=visibleTask.items.map((item,index)=>{const submissions=detailRows.filter(row=>row.submissions.some(record=>record.itemId===item.id));const graded=['photo','file'].includes(item.submitType)&&item.gradingEnabled!==false&&submissions.some(row=>row.submissions.some(record=>record.itemId===item.id&&record.questions.length));return {id:item.id,index:index+1,title:item.title,typeLabel:item.submitType==='none'?'家长确认':SUBMIT_LABEL[item.submitType],metaLabel:['photo','file'].includes(item.submitType)&&item.gradingEnabled!==false?'自动批改':item.submitType==='photo'||item.submitType==='file'?'仅收集，不批改':item.required===false?'选交':'提交记录',count:submissions.length,target:detailSummary.target,resultLabel:item.submitType==='none'?'已完成':'已交'};});
      this.setData({answerPhase:standardPhase(task),answerRows:(task.answerStandards||[]).map(standard=>{const record=getTaskStudentRows(task).flatMap(row=>row.submissions).find(r=>r.questions.some(q=>q.id===standard.questionId));return {...standard,reviewCount:detailRows.flatMap(row=>row.submissions).flatMap(r=>r.questions).filter(q=>q.id===standard.questionId&&q.state==='review').length,conflict:!answersEquivalent(standard.teacherAnswer,standard.aiAnswer),open:this.data.answerOpen===standard.questionId,customAnswer:standard.source==='custom'?standard.answer:standard.teacherAnswer,customExplanation:standard.source==='custom'?standard.explanation:standard.teacherExplanation,photoPath:record?(record.isMock?demoPhotoPath(record.itemId):record.mediaPath||''):''};}), changeRows:(task.changes||[]).map(c=>({at:new Date(c.at).toLocaleString('zh-CN',{hour12:false}),label:homeworkChangeLabel(c.action),reason:c.reason,beforeText:homeworkSnapshotText(c.before),afterText:homeworkSnapshotText(c.after)})),mode: 'detail', selectedTask: visibleTask, attachmentCount: visibleTask.attachments?.length || 0, requirementRows, attachmentListOpen: false, attachmentAudio: null, canReview: this.data.scope.view !== 'school' && task.publishedBy === profile.userId, summary: detailSummary, wrongCount: detailRows.filter(row => row.wrongQuestions.length).length });
    }
  },
  selectDetailClass(event: WechatMiniprogram.BaseEvent) {
    const id=String(event.currentTarget.dataset.id),task=this.data.selectedTask;
    if(!task||!this.data.detailClassOptions.some(option=>option.id===id))return;
    const question=this.data.mode==='question';this.setData({detailClassId:id});this.openTask(task.id,true);if(question)this.loadGradeQuestion();
  },
  openStudentList(event: WechatMiniprogram.BaseEvent) {
    const task = this.data.selectedTask;
    if (!task) return;
    const filter = String(event.currentTarget.dataset.filter || 'all');
    const questionId = String(event.currentTarget.dataset.question || '');
    const titles: Record<string, string> = { all: '全部学生', completed: '已完成学生', partial: '未交齐学生', missing: '未交齐学生', wrong: '答错学生', questionWrong: '本题答错学生' };
    const rows = getTaskStudentRows(task).filter(row => filter === 'all' || filter === 'wrong' && row.wrongQuestions.length > 0 || filter === 'questionWrong' && row.wrongQuestions.some(question => question.id === questionId) || filter === 'missing' && row.status !== 'completed' || row.status === filter);
    this.setData({ studentEntryOrigin:'list',browseItemId:'',mode: 'students', studentFilter: filter, studentListTitle: titles[filter] || '学生名单', studentRows: rows.map(row => ({ id: row.student.id, name: row.student.name, className: DEMO_CLASSES.find(item => item.id === row.student.classId)?.name || '', statusLabel: row.status === 'completed' ? '已交齐' : '未交齐', progress: `${row.submissions.length}/${task.items.length} 项`, wrongCount: row.wrongQuestions.length, latestSubmittedAt: row.latestSubmittedAt || '尚无提交时间' })) });
  },
  openItemStudents(event: WechatMiniprogram.BaseEvent) {
    const task=this.data.selectedTask,itemId=String(event.currentTarget.dataset.id||'');
    if(!task)return;
    const item=task.items.find(row=>row.id===itemId),rows=getTaskStudentRows(task).filter(row=>row.submissions.some(record=>record.itemId===itemId));
    this.setData({studentEntryOrigin:'list',browseItemId:itemId,mode:'students',studentFilter:'item',studentListTitle:`${item?.title||'本项'}提交`,studentRows:rows.map(row=>({id:row.student.id,name:row.student.name,className:DEMO_CLASSES.find(entry=>entry.id===row.student.classId)?.name||'',statusLabel:row.status==='completed'?'已交齐':'未交齐',progress:`${row.submissions.length}/${task.items.length} 项`,wrongCount:row.wrongQuestions.length,latestSubmittedAt:row.latestSubmittedAt||'尚无提交时间'}))});
  },
  openGradeQuestion(event: WechatMiniprogram.BaseEvent) { this.setData({gradeQuestionId:String(event.currentTarget.dataset.id),gradeFilter:'all'});this.loadGradeQuestion(); },
  loadGradeQuestion() {
    const task=this.data.selectedTask;if(!task)return;if(['answers','grading'].includes(this.data.answerPhase)){this.setData({mode:'detail'});return;}
    const rows=getTaskStudentRows(task).map(row=>({row,q:row.submissions.flatMap(s=>s.questions).find(q=>q.id===this.data.gradeQuestionId)})).filter(entry=>entry.q);
    const q=rows.find(entry=>entry.q?.state==='confirmed')?.q||rows[0]?.q;if(!q)return;
    const photos=getTaskStudentRows(task).flatMap(student=>student.submissions.map(record=>{const index=record.questions.findIndex(q=>q.id===this.data.gradeQuestionId);if(index<0)return null;const region=questionRegion(record.questions[index],index,Boolean(record.isMock));const path=record.isMock?demoPhotoPath(record.itemId):record.mediaPath;return path?{path,source:student.student.name+' · '+(task.items.find(item=>item.id===record.itemId)?.title||'作业提交')+' · 第 '+(record.version||1)+' 版'+(record.isMock?' · 演示样张':''),region,style:region?`width:${100/region.width}%;height:${100/region.height}%;left:${-100*region.x/region.width}%;top:${-100*region.y/region.height}%;`:''}:null;})).filter((photo):photo is NonNullable<typeof photo>=>Boolean(photo));
    this.setData({questionPhoto:this.data.scope.view==='school'?null:photos.find(photo=>photo.region)||photos[0]||null,questionPhotoHeight:180,questionTextOpen:false});
    const stats=summarizeHomework(task).questionRows.find(q=>q.id===this.data.gradeQuestionId);
    this.setData({mode:'question',selectedGradeQuestion:{...q,label:q.label},gradeQuestionStats:stats||null,gradeQuestionSections: q.answer ? [{title:'分析',text:q.analysis||'暂无分析',open:true},{title:'答案',text:q.answer||'暂无答案',open:true},{title:'详解',text:q.explanation||'暂无详解',open:true},{title:'点睛',text:q.keyPoint||'暂无点睛',open:false},{title:'知识点',text:q.knowledge||'暂无知识点',open:false}] : [],gradeStudents:rows.filter(({q})=>this.data.gradeFilter==='all'||this.data.gradeFilter==='wrong'&&q&&isFormalGrade(q)&&!q.correct||this.data.gradeFilter==='correct'&&q&&isFormalGrade(q)&&q.correct||this.data.gradeFilter==='pending'&&q&&!isFormalGrade(q)).map(({row,q})=>({id:row.student.id,name:row.student.name,answer:'请对照原图查看',result:gradeLabel(q!)}))});
    this.rememberReviewPosition();
  },
  reviewPositionKey() {return 'homework-review-position:'+getSession()?.profile.userId+':'+this.data.selectedTask?.id;},
  rememberReviewPosition() {if(!this.data.selectedTask||!this.data.selectedGradeQuestion)return;try{wx.setStorageSync(this.reviewPositionKey(),{questionId:this.data.gradeQuestionId,classId:this.data.detailClassId,filter:this.data.gradeFilter});}catch{}},
  refreshReviewResume() {
    const task=this.data.selectedTask;let label='',questionId='';
    try{const position=wx.getStorageSync(this.reviewPositionKey());if(task&&position&&(position.classId==='all'||task.classIds.includes(position.classId))&&(this.data.detailClassId==='all'||position.classId===this.data.detailClassId)){const question=this.data.summary?.questionRows.find(row=>row.id===position.questionId);if(question){const className=position.classId==='all'?(task.classIds.length===1?DEMO_CLASSES.find(row=>row.id===task.classIds[0])?.name:'全部班级'):DEMO_CLASSES.find(row=>row.id===position.classId)?.name;label=(question.label.match(/第\s*\d+\s*题/)?.[0]||question.label)+' · '+(className||'当前班级');questionId=question.id;}}}catch{}
    this.setData({resumeReviewLabel:label,resumeReviewQuestionId:questionId});
  },
  resumeReview() {
    this.refreshReviewResume();if(!this.data.resumeReviewQuestionId)return;
    const position=wx.getStorageSync(this.reviewPositionKey()),task=this.data.selectedTask;if(!task)return;
    this.setData({detailClassId:position.classId});this.openTask(task.id,true);this.setData({gradeQuestionId:position.questionId,gradeFilter:['all','wrong','correct','pending'].includes(position.filter)?position.filter:'all'});this.loadGradeQuestion();
  },
  loadQuestionPhoto(event: WechatMiniprogram.CustomEvent<{width:number;height:number}>){const photo=this.data.questionPhoto,region=photo?.region;if(!region||String(event.currentTarget.dataset.path)!==photo.path||event.detail.width<=0||event.detail.height<=0)return;this.setData({questionPhotoHeight:642*region.height*event.detail.height/(region.width*event.detail.width)});},
  toggleQuestionText(){this.setData({questionTextOpen:!this.data.questionTextOpen});},
  filterGradeStudents(event: WechatMiniprogram.BaseEvent) { this.setData({gradeFilter:String(event.currentTarget.dataset.filter)});this.loadGradeQuestion(); },
  toggleGradeSection(event: WechatMiniprogram.BaseEvent) {const index=Number(event.currentTarget.dataset.index);this.setData({gradeQuestionSections:this.data.gradeQuestionSections.map((s,i)=>i===index?{...s,open:!s.open}:s)});},
  openSubmittedDocument(event:WechatMiniprogram.BaseEvent){if(this.data.readOnly)return;const path=String(event.currentTarget.dataset.path||'');if(path)wx.openDocument({filePath:path,showMenu:true,fail:()=>wx.showToast({title:'文件暂时无法打开，请重试',icon:'none'})});},
  openItemStudentGrade(){this.showStudent(this.data.selectedStudentId);},
  openWholeGrade(event:WechatMiniprogram.BaseEvent){
    const task=this.data.selectedTask,id=String(event.currentTarget.dataset.id||'');if(!task||!this.data.gradeStudents.some(row=>row.id===id))return;
    const allowed=new Set(this.data.gradeStudents.map(row=>row.id)),rows=getTaskStudentRows(task).filter(row=>allowed.has(row.student.id));
    if(!rows.some(row=>row.student.id===id))return;
    this.setData({studentEntryOrigin:'question',browseItemId:'',studentRows:rows.map(row=>({id:row.student.id,name:row.student.name,className:DEMO_CLASSES.find(c=>c.id===row.student.classId)?.name||'',statusLabel:row.status==='completed'?'已交齐':'未交齐',progress:`${row.submissions.length}/${task.items.length} 项`,wrongCount:row.wrongQuestions.length,latestSubmittedAt:row.latestSubmittedAt||'尚无提交时间'}))});
    this.showStudent(id);
  },
  enableAnswerWorkflow(){const task=this.data.selectedTask,profile=getSession()?.profile;if(!task||!profile||!this.data.canReview||!canManageDetail(task,this.data.scope,profile))return;enableHomeworkAnswerWorkflow(task.id,profile.userId,true);this.openTask(task.id,true);},
  toggleAnswer(event:WechatMiniprogram.BaseEvent){const id=String(event.currentTarget.dataset.id);this.setData({answerOpen:this.data.answerOpen===id?'':id,answerRows:this.data.answerRows.map(row=>({...row,open:row.questionId===id?!row.open:row.open}))});},
  setCustomAnswer(event:WechatMiniprogram.CustomEvent<{value:string}>){const index=Number(event.currentTarget.dataset.index),field=String(event.currentTarget.dataset.field);if(!this.data.answerRows[index]||!['customAnswer','customExplanation'].includes(field))return;this.setData({['answerRows['+index+'].'+field]:event.detail.value});},
  approveAnswer(event:WechatMiniprogram.BaseEvent){const task=this.data.selectedTask,profile=getSession()?.profile,id=String(event.currentTarget.dataset.id),source=String(event.currentTarget.dataset.source),row=this.data.answerRows.find(r=>r.questionId===id);if(!task||!profile||!row||!this.data.canReview||!canManageDetail(task,this.data.scope,profile)||!['teacher','ai','custom'].includes(source))return;const ok=approveHomeworkAnswer(task.id,id,source as 'teacher'|'ai'|'custom',profile.userId,row.customAnswer,row.customExplanation);this.setData({answerError:ok?'参考答案已保存，学生判定与统计保持不变':'请填写完整答案与解析',answerOpen:id});this.openTask(task.id,true);},
  confirmMatchingAnswers(){const task=this.data.selectedTask,profile=getSession()?.profile;if(!task||!profile||!this.data.canReview||!canManageDetail(task,this.data.scope,profile))return;approveMatchingHomeworkAnswers(task.id,profile.userId);this.openTask(task.id,true);},
  refreshAnswerGrading(){const task=this.data.selectedTask,profile=getSession()?.profile;if(!task||!profile||!this.data.canReview||!canManageDetail(task,this.data.scope,profile))return;refreshMockHomeworkAnswerGrading(task.id,profile.userId);this.openTask(task.id,true);},
  releaseGradeResults() {const task=this.data.selectedTask,profile=getSession()?.profile;if(!task||!profile||!this.data.canReview||!canManageDetail(task,this.data.scope,profile))return;wx.showModal({title:'确认开放批改结果？',content:`开放范围：${task.classIds.map(id=>DEMO_CLASSES.find(c=>c.id===id)?.name||id).join('、')}。仅向这些班级对应家长开放已确认结果、答案与解析；其他班级保持原状态，待处理和待复核题目继续保留。`,confirmText:'确认开放',success:result=>{const current=getSession();if(result.confirm&&current?.profile.userId===profile.userId&&(current.expiresAt||0)>Date.now()&&canManageDetail(task,workScope(current.profile),current.profile)){const count=releaseHomeworkResults(task);this.openTask(task.id,true);wx.showToast({title:count?'已开放有效结果':'暂无有效结果',icon:'none'});}}});},
  toggleTaskDescription() { this.setData({ descriptionOpen: !this.data.descriptionOpen }); },
  openTaskAttachments() {
    const files = this.data.selectedTask?.attachments || [];
    if (files.length === 1) { this.openPublishedAttachment(files[0]); return; }
    if (files.length > 1) this.setData({ attachmentListOpen: true });
  },
  closeTaskAttachments() { this.setData({ attachmentListOpen: false }); },
  openPublishedAttachment(file: HomeworkAttachment) {
    const files = this.data.selectedTask?.attachments || [];
    if (file.type === 'image') { wx.previewImage({ current: file.path, urls: files.filter(row => row.type === 'image').map(row => row.path) }); return; }
    if (file.type === 'video') { wx.previewMedia({ sources: [{ url: file.path, type: 'video' }] }); return; }
    if (file.type === 'audio') { this.setData({ attachmentListOpen: false, attachmentAudio: file }); return; }
    if (/\.txt$/i.test(file.name)) { wx.getFileSystemManager().readFile({ filePath: file.path, encoding: 'utf8', success: result => wx.showModal({ title: file.name, content: String(result.data).slice(0, 6000) || '文件内容为空', showCancel: false, confirmText: '关闭' }), fail: () => wx.showToast({ title: '文件暂时无法打开', icon: 'none' }) }); return; }
    const fileType = (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'pdf'] as const).find(type => type === file.name.split('.').pop()?.toLowerCase());
    wx.openDocument({ filePath: file.path, fileType, showMenu: true, fail: () => wx.showToast({ title: '文件暂时无法打开', icon: 'none' }) });
  },
  closeTaskAudio() { this.setData({ attachmentAudio: null }); },
  openStudent(event: WechatMiniprogram.BaseEvent) {this.showStudent(String(event.currentTarget.dataset.id));},
  showStudent(id:string) {
    const task = this.data.selectedTask;
    if (!task) return;
    const row = getTaskStudentRows(task).find(item => item.student.id === id);
    if (!row) return;
    const browse=this.studentBrowseRows(row.student.id),position=browse.findIndex(item=>item.id===row.student.id);this.setData({studentBrowseIndex:position,studentBrowseCount:browse.length});
    const schoolReadOnly = this.data.scope.view === 'school';
    const status = row.status === 'completed' ? '已交齐' : '未交齐';
    this.setData({ mode: 'student', submissionMetrics:row.submissions.some(record=>record.questions?.length)?gradingProgress(row.submissions.flatMap(record=>record.questions||[])):null, selectedStudentId: row.student.id, selectedStudentName: row.student.name, selectedStudentClassName:DEMO_CLASSES.find(item=>item.id===row.student.classId)?.name||'学生提交详情',selectedStudentMeta: `${DEMO_CLASSES.find(item => item.id === row.student.classId)?.name || ''} · ${status} · 已交 ${row.submissions.length}/${task.items.length} 项`, studentItems: task.items.filter(item=>!this.data.browseItemId||item.id===this.data.browseItemId).map(item => {
      const record = row.submissions.find(submission => submission.itemId === item.id);
      const viewOriginal=this.data.selectedStudentId===id&&this.data.studentItems.find(i=>i.id===item.id)?.version===(record?.version||1)?Boolean(this.data.studentItems.find(i=>i.id===item.id)?.viewOriginal):false;
      const originals=schoolReadOnly||item.submitType!=='photo'?[]:record?.photos?.length?record.photos.map(p=>p.path):record?.mediaPath?[record.mediaPath]:record?.isMock?[demoPhotoPath(item.id)]:[];
      const displayPhotos=submissionImagePages(record,originals,viewOriginal),hasGradedImages=displayPhotos.some(p=>p.gradedPath);
      const statusLabel=homeworkItemDisplayStatus({submitted:Boolean(record),pending:false,gradingEnabled:task.kind==='homework'&&item.gradingEnabled!==false&&['photo','file'].includes(item.submitType),questions:record?.questions,gradingError:record?.gradingError,gradingComplete:submissionGradingComplete(record)});
      return {statusLabel,displayPhotos,hasGradedImages,viewOriginal,noGradedImage:statusLabel==='已批改'&&item.submitType==='photo'&&!hasGradedImages, displayNumber:String(task.items.indexOf(item)+1).padStart(2,'0'),photoCount:record?.photos?.length||(record&&(record.mediaPath||record.isMock)&&item.submitType==='photo'?1:0),id: item.id, title: item.title, submitLabel: SUBMIT_LABEL[item.submitType], submitted: Boolean(record), submittedAt: record?.submittedAt || '', submittedTimeLabel:record?.submittedAt?record.submittedAt.slice(record.submittedAt.startsWith(String(new Date().getFullYear()))?5:0,16):'时间未记录',historyOpen:false,historyRows:getSubmissionHistory(task.id,item.id,row.student.id).map(entry=>({version:entry.version||1,at:entry.submittedAt||'时间未记录',operator:entry.operatorName||'未记录'})),late: Boolean(record?.late||record?.submittedAt&&record.submittedAt>task.deadline), version: record?.version || 1, operatorLabel: record?.operatorName ? `${record.operatorName}${record.operatorId ? `（${record.operatorId}）` : ''}` : '历史演示数据未记录操作账号', mediaLabel: schoolReadOnly ? '' : record?.mediaLabel || '', mediaPath: schoolReadOnly ? '' : record?.mediaPath || (record?.isMock&&item.submitType==='photo'?demoPhotoPath(item.id):''), photos:schoolReadOnly?[]:record?.photos||[],isFile:item.submitType==='file',gradingEnabled:item.gradingEnabled!==false&&['photo','file'].includes(item.submitType),gradingError:record?.gradingError||'', isPhoto: !schoolReadOnly && item.submitType === 'photo', isVideo: !schoolReadOnly && item.submitType === 'video', isAudio: !schoolReadOnly && item.submitType === 'audio', isMock: !schoolReadOnly && Boolean(record?.isMock), questions: (record?.questions || []).map(question => ({ id: question.id, label: question.label, answer: question.answer || '暂无标准答案', studentAnswer: question.studentAnswer || '未提供', reviewCount: question.reviewHistory?.length || 0, reviewHistory: (question.reviewHistory || []).map(history => ({ at: history.at.replace('T', ' ').slice(0, 16), result: history.correct ? '改判为答对' : '改判为答错', reason: history.reason, reviewer: history.reviewerId })), result: gradeLabel(question) })) };
    }) });
  },
  switchSubmissionImage(event:WechatMiniprogram.BaseEvent){const id=String(event.currentTarget.dataset.item),original=event.currentTarget.dataset.view==='original';this.setData({studentItems:this.data.studentItems.map(item=>item.id===id?{...item,viewOriginal:original,displayPhotos:item.displayPhotos.map(p=>({...p,path:original||!p.gradedPath?p.originalPath:p.gradedPath,showOriginal:original||!p.gradedPath,imageError:''}))}:item)});},
  studentImageError(event:WechatMiniprogram.BaseEvent){const id=String(event.currentTarget.dataset.item),page=Number(event.currentTarget.dataset.page);this.setData({studentItems:this.data.studentItems.map(item=>item.id===id?{...item,displayPhotos:item.displayPhotos.map((p,i)=>i===page?submissionImageFailure(p):p)}:item)});},
  toggleSubmissionHistory(event:WechatMiniprogram.BaseEvent) {const id=String(event.currentTarget.dataset.id);this.setData({studentItems:this.data.studentItems.map(item=>item.id===id?{...item,historyOpen:!item.historyOpen}:item)});},
  backToStudents() { if(this.data.studentEntryOrigin==='question'){this.loadGradeQuestion();return;}this.setData({ mode: 'students' }); },
  backToStats() { this.setData({ mode: 'detail' }); },
  studentBrowseRows(id?:string) {
    const current=DEMO_STUDENTS.find(row=>row.id===(id||this.data.selectedStudentId));return this.data.studentRows.filter(row=>DEMO_STUDENTS.some(student=>student.id===row.id&&student.classId===current?.classId));
  },
  changeStudent(event:WechatMiniprogram.BaseEvent) {this.moveStudent(Number(event.currentTarget.dataset.delta));},
  moveStudent(delta:number) {const rows=this.studentBrowseRows(),index=rows.findIndex(row=>row.id===this.data.selectedStudentId),next=index+delta;if(next<0||next>=rows.length)return;this.data.studentItems.filter(i=>i.isVideo).forEach(i=>wx.createVideoContext('hw-inline-video-'+i.id,this).pause());this.showStudent(rows[next].id);wx.pageScrollTo({scrollTop:0,duration:0});},
  studentTouch:null as {x:number;y:number}|null,
  studentPhotoTouchStart(event:WechatMiniprogram.TouchEvent) {const point=event.touches[0];this.studentTouch=event.touches.length===1?{x:point.clientX,y:point.clientY}:null;},
  studentPhotoTouchEnd(event:WechatMiniprogram.TouchEvent) {const start=this.studentTouch;this.studentTouch=null;const point=event.changedTouches[0];if(!start||!point)return;const dx=point.clientX-start.x,dy=point.clientY-start.y;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.4)this.moveStudent(dx<0?1:-1);},
  studentPhotoTouchCancel() {this.studentTouch=null;},
  previewOriginal(event: WechatMiniprogram.BaseEvent) {
    if(this.data.scope.view==='school')return;const path=String(event.currentTarget.dataset.path||''),itemId=String(event.currentTarget.dataset.item||'');
    if(this.data.mode!=='student'||!itemId){if(path)wx.previewImage({urls:[path],current:path});return;}
    const task=this.data.selectedTask;if(!task)return;
    const allowed=this.studentBrowseRows(),rows=getTaskStudentRows(task),items=task.items.filter(item=>(!this.data.browseItemId||item.id===this.data.browseItemId)&&['photo','video'].includes(item.submitType));
    const pages=allowed.flatMap(student=>items.flatMap(item=>{const record=rows.find(row=>row.student.id===student.id)?.submissions.find(record=>record.itemId===item.id);if(!record)return [];const originals=record.photos?.length?record.photos.map(photo=>photo.path):[record.mediaPath||(record.isMock&&item.submitType==='photo'?demoPhotoPath(item.id):'')];const selected=this.data.studentItems.find(i=>i.id===item.id);const mediaPages=item.submitType==='photo'?submissionImagePages(record,originals,student.id===this.data.selectedStudentId&&Boolean(selected?.viewOriginal)):originals.map((path,page)=>({path,page,originalPath:path,gradedPath:'',showOriginal:true}));const paths=mediaPages.map(p=>p.path);return mediaPages.flatMap((media,page)=>media.path?[{...media,path:media.path,title:student.name+' · '+item.title+' · '+(page+1)+' / '+paths.length,studentId:student.id,itemId:item.id,type:item.submitType,page}]:[]);}));
    if(!pages.length)return;
    const groups=allowed.map(student=>({studentId:student.id,media:pages.filter(page=>page.studentId===student.id),current:0})).filter(group=>group.media.length);
    const groupIndex=groups.findIndex(group=>group.studentId===this.data.selectedStudentId);if(groupIndex<0)return;
    groups[groupIndex].current=Math.max(0,groups[groupIndex].media.findIndex(page=>page.itemId===itemId&&page.page===Number(event.currentTarget.dataset.page||0)));
    const index=pages.indexOf(groups[groupIndex].media[groups[groupIndex].current]);this.setData({studentPhotoPages:pages,studentPhotoGroups:groups,studentPhotoGroupIndex:groupIndex,studentPhotoIndex:index,studentPhotoOpen:true});
  },
  pauseStudentVideo() {const group=this.data.studentPhotoGroups[this.data.studentPhotoGroupIndex],media=group?.media[group.current];if(media?.type==='video')wx.createVideoContext('hw-gallery-video-'+this.data.studentPhotoGroupIndex+'-'+group.current,this).pause();},
  changeStudentPhoto(event:WechatMiniprogram.CustomEvent<{current:number}>) {this.pauseStudentVideo();const group=this.data.studentPhotoGroups[event.detail.current];if(!group)return;this.setData({studentPhotoGroupIndex:event.detail.current,studentPhotoIndex:this.data.studentPhotoPages.findIndex(page=>page.studentId===group.studentId&&page.itemId===group.media[group.current].itemId&&page.page===group.media[group.current].page)});},
  changeStudentMedia(event:WechatMiniprogram.CustomEvent<{current:number}>) {this.pauseStudentVideo();const groups=this.data.studentPhotoGroups,index=Number(event.currentTarget.dataset.group),group=groups[index];if(!group?.media[event.detail.current])return;const media=group.media[event.detail.current],pageIndex=this.data.studentPhotoPages.findIndex(page=>page.studentId===media.studentId&&page.itemId===media.itemId&&page.page===media.page);if(pageIndex<0)return;group.current=event.detail.current;this.setData({studentPhotoGroups:groups,studentPhotoIndex:pageIndex});},
  studentPreviewError(event:WechatMiniprogram.BaseEvent){const group=this.data.studentPhotoGroups[Number(event.currentTarget.dataset.group)],media=group?.media[Number(event.currentTarget.dataset.media)];if(!media)return;const failed=submissionImageFailure(media);this.setData({studentPhotoPages:this.data.studentPhotoPages.map(p=>p.studentId===media.studentId&&p.itemId===media.itemId&&p.page===media.page?{...p,...failed}:p),studentPhotoGroups:this.data.studentPhotoGroups.map(g=>({...g,media:g.media.map(p=>p.studentId===media.studentId&&p.itemId===media.itemId&&p.page===media.page?{...p,...failed}:p)}))});},
  toggleStudentPhotoView(){const page=this.data.studentPhotoPages[this.data.studentPhotoIndex];if(!page?.gradedPath)return;page.showOriginal=!page.showOriginal;page.path=page.showOriginal?page.originalPath||page.path:page.gradedPath;page.imageError='';const groups=this.data.studentPhotoGroups.map(group=>({...group,media:group.media.map(media=>media.studentId===page.studentId&&media.itemId===page.itemId&&media.page===page.page?{...media,...page}:media)}));this.setData({studentPhotoPages:this.data.studentPhotoPages,studentPhotoGroups:groups});},
  closeStudentPhoto() {this.pauseStudentVideo();this.setData({studentPhotoOpen:false,studentPhotoPages:[],studentPhotoGroups:[]});},
  zoomStudentPhoto() {const photo=this.data.studentPhotoPages[this.data.studentPhotoIndex];if(photo?.type==='photo'&&photo.path)wx.previewImage({urls:[photo.path],current:photo.path});},
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
    const items = texts.length ? texts.map((text, index) => ({ ...createItem(index),...old.find(item=>item.title===text), title: text, instruction: '按上述要求完成', gradingEnabled:old.find(item=>item.title===text)?.gradingEnabled??(['photo','file'].includes(this.data.uniformType)&&this.data.draft.kind==='homework'), submitType: old.find(item => item.title === text)?.submitType || (this.data.settingMode === 'uniform' ? this.data.uniformType : '') })) : [{ ...createItem(0), title: '完成作业', instruction: '按任务要求完成', submitType: this.data.settingMode === 'uniform' ? this.data.uniformType : '' }];
    this.setData({ draft: { ...this.data.draft, items }, recognizedCount: texts.length > 1 ? texts.length : 0, recognitionStale: false });
    this.refreshDraft();
  },
  changeSettingMode(event: WechatMiniprogram.BaseEvent) { const mode = String(event.currentTarget.dataset.mode); const items = this.data.draft.items; const uniformType = mode === 'uniform' && this.data.settingMode !== mode ? (items.length && items.every(item => item.submitType === items[0].submitType) ? items[0].submitType : '') : this.data.uniformType; this.setData({ settingMode: mode, uniformType, expandedItemIndex: 0 }); },
  applyUniformToAll() { this.setData({ settingMode: 'uniform', draft: { ...this.data.draft, items: this.data.draft.items.map(item => ({ ...item, submitType: this.data.uniformType,gradingEnabled:['photo','file'].includes(this.data.uniformType)&&this.data.draft.kind==='homework' })) } }); this.refreshDraft(); },
  toggleItemOptions(event: WechatMiniprogram.BaseEvent) { const index = Number(event.currentTarget.dataset.index); this.setData({ expandedItemIndex: this.data.expandedItemIndex === index ? -1 : index }); },
  selectUniformType(event: WechatMiniprogram.BaseEvent) {
    const type = String(event.currentTarget.dataset.type) as SubmitType;
    if (!TYPES.includes(type)) return;
    this.setData({ uniformType: type, uniformTypeIndex: TYPES.indexOf(type), draft: { ...this.data.draft, items: this.data.draft.items.map(item => ({ ...item, submitType: type,gradingEnabled:this.data.draft.kind==='homework'&&['photo','file'].includes(type) })) } });
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
  updateDatePicker(value: string) {
    const date=new Date(value.replace(' ','T')),now=new Date(),today=date.toDateString()===now.toDateString();
    if(today&&date.getTime()<=now.getTime()){date.setTime(Math.ceil((now.getTime()+60000)/60000)*60000);value=formatDateTime(date);}
    const same=date.toDateString()===now.toDateString();
    const hourOptions=Array.from({length:24},(_,i)=>String(i).padStart(2,'0')).filter(h=>!same||Number(h)>=now.getHours());
    const minuteOptions=Array.from({length:60},(_,i)=>String(i).padStart(2,'0')).filter(m=>!same||date.getHours()!==now.getHours()||Number(m)>now.getMinutes());
    const calendar=calendarFor(value),hour=String(date.getHours()).padStart(2,'0'),minute=String(date.getMinutes()).padStart(2,'0');
    this.setData({datePickerValue:value,calendarTitle:calendar.title,calendarDays:calendar.days,hourOptions,minuteOptions,pickerHour:hour,pickerMinute:minute,pickerHourIndex:Math.max(0,hourOptions.indexOf(hour)),pickerMinuteIndex:Math.max(0,minuteOptions.indexOf(minute))});
  },
  shiftDateMonth(event: WechatMiniprogram.BaseEvent) { const date = new Date(this.data.datePickerValue.replace(' ', 'T')); const day = date.getDate(); date.setDate(1); date.setMonth(date.getMonth() + Number(event.currentTarget.dataset.delta)); date.setDate(Math.min(day, new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate())); this.updateDatePicker(formatDateTime(date)); },
  chooseDateDay(event: WechatMiniprogram.BaseEvent) { const day = Number(event.currentTarget.dataset.day); if (!day) return; const date = new Date(this.data.datePickerValue.replace(' ', 'T')); date.setDate(day);if(date.getTime()<new Date().setHours(0,0,0,0))return; this.updateDatePicker(formatDateTime(date)); },
  changePickerHour(event: WechatMiniprogram.CustomEvent<{ value: string }>) { const date = new Date(this.data.datePickerValue.replace(' ', 'T')); date.setHours(Number(this.data.hourOptions[Number(event.detail.value)])); this.updateDatePicker(formatDateTime(date)); },
  changePickerMinute(event: WechatMiniprogram.CustomEvent<{ value: string }>) { const date = new Date(this.data.datePickerValue.replace(' ', 'T')); date.setMinutes(Number(this.data.minuteOptions[Number(event.detail.value)])); this.updateDatePicker(formatDateTime(date)); },
  confirmDatePicker() {
    const value = this.data.datePickerValue, selected = new Date(value.replace(' ', 'T')).getTime();
    if (!Number.isFinite(selected)) { wx.showToast({ title: '请选择有效时间', icon: 'none' }); return; }
    if (this.data.datePickerTarget === 'deadline' && selected <= Date.now()) { wx.showToast({ title: '首次截止须晚于当前时间', icon: 'none' }); return; }
    if (this.data.datePickerTarget === 'submitDeadline' && selected <= new Date(this.data.draft.deadline.replace(' ', 'T')).getTime()) { wx.showToast({ title: '补交截止须晚于首次截止', icon: 'none' }); return; }
    const previous=this.data.draft;
    const draft = this.data.datePickerTarget === 'deadline' ? { ...previous, deadline: value, submitDeadline: previous.allowSupplement===false?value:previous.supplementTouched?previous.submitDeadline:addDays(value,7) } : { ...previous, submitDeadline: value,supplementTouched:true };
    if(homeworkTime(draft.submitDeadline)<homeworkTime(draft.deadline)){this.setData({composeError:'补交截止早于正常截止，请调整补交时间。'});}
    this.setData({ draft, datePickerOpen: false, datePickerTarget: '', composeError:homeworkTime(draft.submitDeadline)<homeworkTime(draft.deadline)?'补交截止早于正常截止，请调整补交时间。':!previous.supplementTouched&&previous.allowSupplement!==false?'补交时间已随截止时间调整。':'' }); this.refreshDraft();
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
        wx.chooseMessageFile({ count: 9, type: 'all', success: chosen => this.saveMaterialAttachments(chosen.tempFiles.map(file => ({ path: file.path, name: file.name, type: file.type === 'image' || /\.(png|jpe?g|webp|gif|bmp|heic)$/i.test(file.name) ? 'image' : file.type === 'video' || /\.(mp4|mov|m4v|webm)$/i.test(file.name) ? 'video' : /\.(mp3|m4a|wav|aac|ogg)$/i.test(file.name) ? 'audio' : 'file', size: file.size || 0, source: '微信聊天记录' }))), fail: failed });
      } else {
        const source = result.tapIndex === 0 ? '手机相册' : '拍照或拍摄';
        wx.chooseMedia({ count: 9, mediaType: ['image', 'video'], sourceType: [result.tapIndex === 0 ? 'album' : 'camera'], success: chosen => this.saveMaterialAttachments(chosen.tempFiles.map((file, index) => ({ path: file.tempFilePath, name: `${file.fileType === 'video' ? '视频' : '图片'}_${index + 1}.${file.tempFilePath.split('.').pop() || (file.fileType === 'video' ? 'mp4' : 'jpg')}`, type: file.fileType === 'video' ? 'video' : 'image', size: file.size || 0, source }))), fail: failed });
      }
    } });
  },
  openWorksheetLibrary() {
    const availableSubjects = this.data.subjectOptions;
    this.setData({ worksheetLibraryOpen: true, worksheetTemplates: HOMEWORK_WORKSHEET_LIBRARY.map(item => ({ ...item, available: availableSubjects.includes(item.subject) })) });
  },
  closeWorksheetLibrary() { this.setData({ worksheetLibraryOpen: false }); },
  applyWorksheetTemplate(event: WechatMiniprogram.BaseEvent) {
    const template = getHomeworkWorksheet(String(event.currentTarget.dataset.id));
    if (!template) return;
    if (!this.data.subjectOptions.includes(template.subject)) { wx.showToast({ title: `当前账号暂无${template.subject}任教范围`, icon: 'none' }); return; }
    const profile = getSession()?.profile;
    if (!profile) return;
    const allowed = subjectClassIds(profile, this.data.scope, template.subject);
    const classIds = this.data.draft.classIds.filter(id => allowed.includes(id));
    const attachment: HomeworkAttachment = { id: `worksheet-${template.id}`, name: `${template.title}（空白）.webp`, type: 'image', path: template.blankPath, size: 0, source: '作业素材库' };
    const attachments = [...this.data.draft.attachments.filter(file => !file.id.startsWith('worksheet-')), attachment];
    this.setData({
      worksheetLibraryOpen: false,
      settingMode: 'uniform', uniformType: 'photo', uniformTypeIndex: TYPES.indexOf('photo'), recognizedCount: 1, recognitionStale: false, expandedItemIndex: 0,
      draft: { ...this.data.draft, subject: template.subject, title: template.title, description: template.description, attachments, classIds: classIds.length ? classIds : allowed.slice(0, 1), targetStudentIds: [], items: [{ id: `worksheet-submit-${template.id}`, title: '提交整张作答页', instruction: template.requirement, submitType: 'photo', required: true }] },
    });
    this.refreshDraft(); this.saveTeacherDraft();
    wx.showToast({ title: '已套用作业素材', icon: 'success' });
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
  changeDeadlineDate(event: WechatMiniprogram.CustomEvent<{ value: string }>) { const deadline = `${event.detail.value} ${this.data.deadlineTime}`; this.setData({ draft: { ...this.data.draft, deadline, submitDeadline:this.data.draft.allowSupplement===false?deadline:this.data.draft.supplementTouched?this.data.draft.submitDeadline:addDays(deadline,7) }, composeError: '' }); this.refreshDraft(); },
  changeDeadlineTime(event: WechatMiniprogram.CustomEvent<{ value: string }>) { const deadline = `${this.data.deadlineDate} ${event.detail.value}`; this.setData({ draft: { ...this.data.draft, deadline, submitDeadline:this.data.draft.allowSupplement===false?deadline:this.data.draft.supplementTouched?this.data.draft.submitDeadline:addDays(deadline,7) }, composeError: '' }); this.refreshDraft(); },
  changeSubmitDeadlineDate(event: WechatMiniprogram.CustomEvent<{ value: string }>) { this.setData({ draft: { ...this.data.draft, supplementTouched:true,submitDeadline: `${event.detail.value} ${this.data.submitDeadlineTime}` }, composeError: '' }); this.refreshDraft(); },
  changeSubmitDeadlineTime(event: WechatMiniprogram.CustomEvent<{ value: string }>) { this.setData({ draft: { ...this.data.draft, supplementTouched:true,submitDeadline: `${this.data.submitDeadlineDate} ${event.detail.value}` }, composeError: '' }); this.refreshDraft(); },
  changeKind(event: WechatMiniprogram.BaseEvent) { this.setData({ draft: { ...this.data.draft, kind: event.currentTarget.dataset.kind as HomeworkKind } }); this.refreshDraft(); },
  changeSubject(event:WechatMiniprogram.CustomEvent<{value:string}>){const subject=this.data.subjectOptions[Number(event.detail.value)],profile=getSession()?.profile;if(!subject||!profile)return;const allowed=subjectClassIds(profile,this.data.scope,subject),removed=this.data.draft.classIds.filter(id=>!allowed.includes(id));const apply=()=>{const selected=this.data.draft.classIds.filter(id=>allowed.includes(id));this.setData({draft:{...this.data.draft,subject,classIds:selected.length?selected:allowed.slice(0,1)}});this.refreshDraft();this.saveTeacherDraft();};if(removed.length)wx.showModal({title:'核对接收范围变化',content:'切换学科将取消 '+removed.map(id=>DEMO_CLASSES.find(c=>c.id===id)?.name||id).join('、')+' 及其学生选择，作业内容和自定义标题保留。',success:r=>{if(r.confirm)apply();}});else apply();},
  changeCycleCount(event: WechatMiniprogram.CustomEvent<{ value: string }>) { const count = Number(event.detail.value); this.setData({ draft: { ...this.data.draft, cycleCount: Number.isFinite(count) ? Math.max(1, Math.min(30, Math.floor(count))) : 1 } }); },
  toggleClass(event: WechatMiniprogram.BaseEvent) {
    const id = event.currentTarget.dataset.id as string;
    const profile = getSession()?.profile; if (!profile || !subjectClassIds(profile, this.data.scope, this.data.draft.subject).includes(id)) return;
    const removing=this.data.draft.classIds.includes(id);const recipientModes={...this.data.draft.recipientModes};delete recipientModes[id];if(!removing)recipientModes[id]='all';
    const classIds = this.data.draft.classIds.includes(id) ? this.data.draft.classIds.filter(value => value !== id) : [...this.data.draft.classIds, id];
    this.setData({ draft: { ...this.data.draft, recipientModes, classIds, targetStudentIds: this.data.draft.targetStudentIds.filter(studentId => DEMO_STUDENTS.some(student => student.id === studentId && classIds.includes(student.classId))) } }); this.refreshDraft();
  },
  changeTargetMode(event: WechatMiniprogram.BaseEvent) { this.setData({ draft: { ...this.data.draft, targetMode: event.currentTarget.dataset.mode } }); this.refreshDraft(); },
  selectRecipientClass(event:WechatMiniprogram.BaseEvent){const id=String(event.currentTarget.dataset.id);if(!this.data.draft.classIds.includes(id))return;this.setData({recipientClassId:id,studentSearch:''});this.refreshDraft();},
  selectRecipientClassAll(event:WechatMiniprogram.BaseEvent){const cls=this.data.recipientClassId,profile=getSession()?.profile,draft=this.data.draft;if(!profile||!draft.classIds.includes(cls)||!subjectClassIds(profile,this.data.scope,draft.subject).includes(cls))return;const ids=DEMO_STUDENTS.filter(student=>student.classId===cls).map(student=>student.id),selected=String(event.currentTarget.dataset.selected)==='true';this.setData({draft:{...draft,targetStudentIds:selected?[...new Set([...draft.targetStudentIds,...ids])]:draft.targetStudentIds.filter(id=>!ids.includes(id))}});this.refreshDraft();},
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
    this.refreshDraft();if(this.data.readOnly)return;
    const draft=this.data.draft,error=homeworkPublishError(draft);
    if(error){this.setData({composeError:error,composeStep:0});return;}
    if(!draft.classIds.length||draft.classIds.some(id=>draft.recipientModes[id]==='selected'&&!DEMO_STUDENTS.some(s=>s.classId===id&&draft.targetStudentIds.includes(s.id)))){this.setData({composeError:'每个选择部分学生的班级，至少选择一人。'});return;}
    this.setData({previewOpen:true,rosterSignature:this.currentRosterSignature(),previewTargetCount:this.draftRecipients(draft).length,previewClasses:draft.classIds.map(id=>DEMO_CLASSES.find(c=>c.id===id)?.name||id).join('、'),previewStudents:draft.classIds.map(id=>{const selected=DEMO_STUDENTS.filter(s=>s.classId===id&&(draft.recipientModes[id]!=='selected'||draft.targetStudentIds.includes(s.id)));return (DEMO_CLASSES.find(c=>c.id===id)?.name||id)+' · '+(draft.recipientModes[id]==='selected'?'部分':'全班')+' · '+selected.length+' 人'+(draft.recipientModes[id]==='selected'?'：'+selected.map(s=>s.name).join('、'):'');}).join('；'),previewItems:draft.items.map(i=>({id:i.id,title:i.title,instruction:i.instruction,type:(i.submitType==='none'?'家长确认':SUBMIT_LABEL[i.submitType as SubmitType])+' · '+(i.gradingEnabled&&draft.kind==='homework'?'自动批改':'仅收集，不批改')+(i.expectedPages?' · 预计 '+i.expectedPages+' 页':'')}))});
  },
  closePreview(){this.setData({previewOpen:false,familyPreview:false});},
  confirmPublish(){
    if(this.data.readOnly||this.data.publishing)return;
    const session=getSession(),profile=session?.profile;if(!profile||!session?.expiresAt||session.expiresAt<=Date.now())return;
    const draft=this.data.draft,allowed=subjectClassIds(profile,this.data.scope,draft.subject),error=homeworkPublishError(draft);
    if(error){this.setData({composeError:error,composeStep:0,previewOpen:false});return;}
    if(!draft.classIds.length||!draft.classIds.every(id=>allowed.includes(id))||this.currentRosterSignature()!==this.data.rosterSignature){this.setData({composeError:'接收名单或任教权限已变化，请重新核对班级和学生。',previewOpen:false,composeStep:1});return;}
    const ids=this.draftRecipients(draft).map(s=>s.id);if(!ids.length||draft.classIds.some(id=>draft.recipientModes[id]==='selected'&&!DEMO_STUDENTS.some(s=>s.classId===id&&ids.includes(s.id)))){this.setData({composeError:'请为每个班级选择有效接收人。',previewOpen:false});return;}
    this.setData({publishing:true});
    try{
      const published=publishHomework({allowSupplement:draft.allowSupplement,title:draft.title,description:draft.description.trim(),attachments:draft.attachments.map(f=>({...f})),kind:draft.kind,subject:draft.subject,cycleCount:draft.cycleCount,classIds:[...draft.classIds],targetStudentIds:draft.classIds.every(id=>draft.recipientModes[id]==='all')?null:ids,items:draft.items.map(i=>({...i,submitType:i.submitType as SubmitType,gradingEnabled:draft.kind==='homework'&&['photo','file'].includes(i.submitType)&&i.gradingEnabled!==false,title:i.title.trim()})),deadline:draft.deadline,submitDeadline:draft.submitDeadline,parentVisible:false,publishedBy:profile.userId});
      wx.removeStorageSync(teacherDraftKey(profile.userId));this.setData({hasDraft:false,composeStep:0,mode:'success',previewOpen:false,publishing:false,publishedTitle:published.title,publishedTargetCount:ids.length,publishedClasses:published.classIds.map(id=>DEMO_CLASSES.find(c=>c.id===id)?.name||id).join('、'),publishedDeadline:published.deadline,publishedSubmitDeadline:published.submitDeadline,publishedItemCount:published.items.length});
    }catch(error){this.setData({publishing:false,composeError:error instanceof Error?error.message:'发布失败，草稿已保留，请重试。'});}
  },
  confirmReview(event: WechatMiniprogram.BaseEvent) {
    const task=this.data.selectedTask,profile=getSession()?.profile;if(!task||!profile||!this.data.canReview||!canManageDetail(task,this.data.scope,profile))return;
    const id=String(event.currentTarget.dataset.id),studentId=String(event.currentTarget.dataset.student||''),student=getTaskStudentRows(task).find(row=>(!studentId||row.student.id===studentId)&&row.submissions.some(r=>r.questions.some(q=>q.id===id&&['review','confirmed','unreadable','no-answer'].includes(q.state)))),record=student?.submissions.find(r=>r.questions.some(q=>q.id===id&&['review','confirmed','unreadable','no-answer'].includes(q.state))),q=record?.questions.find(q=>q.id===id&&['review','confirmed','unreadable','no-answer'].includes(q.state));if(!student||!record||!q)return;
    const region=questionRegion(q,record.questions.indexOf(q),Boolean(record.isMock)),path=record.photos?.[q.pageIndex||0]?.path||(record.isMock?demoPhotoPath(record.itemId):record.mediaPath||'');
    this.setData({reviewPhotoHeight:180,reviewDraft:{studentId:student.student.id,itemId:record.itemId,version:record.version||1,questionId:id,signature:gradingSignature(q),studentName:student.student.name,className:DEMO_CLASSES.find(c=>c.id===student.student.classId)?.name||'',label:q.label,path,style:region?`width:${100/region.width}%;height:${100/region.height}%;left:${-100*region.x/region.width}%;top:${-100*region.y/region.height}%;`:'',region,mock:Boolean(record.isMock),studentAnswer:q.studentAnswer||'未识别',answer:q.answer||'暂无可靠答案',explanation:q.explanation||q.analysis||'暂无解析',aiCorrect:q.aiUnavailable?null:q.aiCorrect??q.correct,aiAnswer:q.aiAnswer||q.answer,referenceAnswer:task.answerStandards?.find(s=>s.questionId===id)?.answer||'暂无教师参考',correct:'',reason:'已对照学生原图核对',error:''}});
  },
  holdReview(){const d=this.data.reviewDraft,task=this.data.selectedTask,session=getSession();if(!d||!task||!session?.profile||!session.expiresAt||session.expiresAt<=Date.now()||!this.data.canReview||!canManageDetail(task,workScope(session.profile),session.profile))return;if(confirmMockReview(task.id,d.questionId,null,'教师暂缓本题',session.profile.userId,[d.studentId],{itemId:d.itemId,version:d.version,signature:d.signature})){this.setData({reviewDraft:null});this.openTask(task.id,true);wx.showToast({title:'已暂缓，统计已更新',icon:'none'});}},
  closeReview(){this.setData({reviewDraft:null});},
  setReviewDecision(event:WechatMiniprogram.BaseEvent){if(this.data.reviewDraft)this.setData({reviewDraft:{...this.data.reviewDraft,correct:String(event.currentTarget.dataset.value),error:''}});},
  setReviewReason(event:WechatMiniprogram.CustomEvent<{value:string}>){if(this.data.reviewDraft)this.setData({'reviewDraft.reason':event.detail.value});},
  loadReviewPhoto(event:WechatMiniprogram.CustomEvent<{width:number;height:number}>){const d=this.data.reviewDraft,r=d?.region;if(!r||String(event.currentTarget.dataset.path)!==d.path||event.detail.width<=0||event.detail.height<=0)return;this.setData({reviewPhotoHeight:610*r.height*event.detail.height/(r.width*event.detail.width)});},
  saveReview(event?:WechatMiniprogram.BaseEvent){
    const d=this.data.reviewDraft,task=this.data.selectedTask,session=getSession();if(!d||!task||!session?.profile||!session.expiresAt||session.expiresAt<=Date.now()||!this.data.canReview||!canManageDetail(task,workScope(session.profile),session.profile))return;
    const record=getTaskStudentRows(task).find(row=>row.student.id===d.studentId)?.submissions.find(r=>r.itemId===d.itemId&&(r.version||1)===d.version),q=record?.questions.find(q=>q.id===d.questionId&&['review','confirmed','unreadable','no-answer'].includes(q.state));
    if(!q||gradingSignature(q)!==d.signature){this.setData({'reviewDraft.error':'作答已更新，请关闭后重新核对最新提交'});return;}
    if(!d.path){this.setData({'reviewDraft.error':'原图不可用，请保留待复核'});return;}
    if(!['true','false'].includes(d.correct)){this.setData({'reviewDraft.error':'请先选择判对或判错'});return;}
    if(!d.reason.trim()){this.setData({'reviewDraft.error':'请填写复核说明'});return;}
    if(confirmMockReview(task.id,d.questionId,d.correct==='true',d.reason,session.profile.userId,[d.studentId],{itemId:d.itemId,version:d.version,signature:d.signature})){
      const question=this.data.mode==='question';this.setData({reviewDraft:null});this.openTask(task.id,true);if(question)this.loadGradeQuestion();if(String(event?.currentTarget.dataset.next)==='true'){const next=getTaskStudentRows(task).find(row=>row.submissions.some(r=>r.questions.some(q=>q.id===d.questionId&&q.state==='review')));if(next)this.confirmReview({currentTarget:{dataset:{id:d.questionId,student:next.student.id}}} as unknown as WechatMiniprogram.BaseEvent);}wx.showToast({title:'统计与家长结果已更新',icon:'none'});
    }
  },

});
