import { questionRegion, questionMark, NOTEBOOK_KEY, MISTAKE_REASONS, notebookKey, addNotebookEntry } from '../../services/homeworkLearning';
import type { NotebookEntry } from '../../services/homeworkLearning';
import type { GradeQuestion, ItemSubmission } from '../../services/homeworkMock';
import { getSession, linkedGuardianStudents } from '../../stores/session';
import { getHomeworkTask, getStudentSubmissions, getTargetStudents } from '../../services/homeworkMock';
import { gradingProgress, isFormalGrade, demoPhotoPath, gradeLabel, parentGradeLabel, isResultReleased, teacherReference, canUseAIExplanation } from '../../services/homeworkGrading';
import { availableWorkViews, taskInScope, workScope, scopeClassIds, subjectClassIds } from '../../services/workbenchScope';
import { getDemoStudent } from '../../services/schoolDemoRoster';
import { TUTOR_STORAGE_KEY, createTutor, tutorPlan, tutorCurrent, tutorReduce, tutorText, tutorCells, tutorDelay, tutorSummary, tutorTransfer, tutorFingerprint, tutorKey } from '../../services/homeworkTutor';
import type { TutorSession, TutorAction, TutorSource, TutorEvent } from '../../services/homeworkTutor';

const readNotebook = (): NotebookEntry[] => {const entries=wx.getStorageSync(NOTEBOOK_KEY);return Array.isArray(entries)?entries:[];};
Page({
  tutorTimer: undefined as ReturnType<typeof setTimeout>|undefined,
  lessonPlan: [] as TutorAction[],
  lessonSource: null as TutorSource|null,
  resultScroll: 0, tutorTyping:false, tutorIdleEpoch:-1,
  data: {
    tutor: null as TutorSession|null, tutorAction:null as TutorAction|null, tutorCaption:'',tutorPrompt:'',tutorOptions:[] as string[], tutorCells:[] as ReturnType<typeof tutorCells>, tutorSummary:[] as ReturnType<typeof tutorSummary>, tutorCellWidth:'100%',tutorCellHeight:'140px',lessonLength:0, tutorEditor:false, tutorCanAnswer:false, tutorLive:false,tutorNotice:'',tutorSheet:'',
    learningMode:'result',reasonOpen:false,mistakeReason:MISTAKE_REASONS[0],mistakeReasons:MISTAKE_REASONS,learningError:'',notebookEntries:[] as NotebookEntry[],regionCount:0,
    taskId: '', studentId: '', role: 'guardian', focus: '', studentName: '', taskTitle: '', denied: false,
    statusBarHeight: 24, navBarHeight: 44, pageIndex: 0, wrongOnly: false, hideOriginal: false,
    progress: gradingProgress([]), pages: [] as Array<{ id: string; title: string; path: string; mock: boolean; selected: boolean }>,
    questions: [] as Array<{ id: string; label: string; result: string; stem: string; studentAnswer: string; mark: string; selected: boolean; wrong: boolean; regionStyle:string; tone:string; boxLabel:string }>,
    selected: null as { id: string; label: string; result: string; stem: string; studentAnswer: string; allowed: boolean; explanationAllowed:boolean; referenceAnswer:string; referenceExplanation:string; referenceNotice:string; wrong: boolean; videoUrl: string; saved:boolean; sections: Array<{ title: string; text: string; open: boolean }> } | null,
  },
  onLoad(options: { taskId?: string; studentId?: string; role?: string; focus?: string }) {
    const info = wx.getWindowInfo(), capsule = wx.getMenuButtonBoundingClientRect();
    this.setData({ taskId: options.taskId || '', studentId: options.studentId || '', role: options.role === 'teacher' ? 'teacher' : 'guardian', focus: options.focus || '', statusBarHeight: info.statusBarHeight, navBarHeight: capsule.height + Math.max(0, capsule.top - info.statusBarHeight) * 2 });
  },
  onShow() { this.refreshResult(); if(this.data.learningMode==='tutor')this.ensureTutor(); },
  onHide() { if(this.data.learningMode==='tutor')this.tutorDispatch({type:'pause'}); },
  onUnload() { this.stopTutorTimer();this.saveTutor(); },
  onPageScroll(event:{scrollTop:number}) { if(this.data.learningMode==='result')this.resultScroll=event.scrollTop; },
  refreshResult() {
    const session = getSession(), task = getHomeworkTask(this.data.taskId), parent = this.data.role === 'guardian';
    if (!session?.profile || !session.expiresAt || session.expiresAt <= Date.now()) { wx.reLaunch({ url: '/pages/auth/login/index' }); return; }
    const profile = session.profile, scope = workScope(profile);
    const allowed = task && getTargetStudents(task).some(s => s.id === this.data.studentId) && (parent
      ? profile.roles.includes('guardian') && linkedGuardianStudents(profile).some(s => s.id === this.data.studentId)
      : availableWorkViews(profile).includes(scope.view) && (scope.view === 'subject' ? task.publishedBy === profile.userId && subjectClassIds(profile,scope,task.subject||'数学').includes(getDemoStudent(this.data.studentId)?.classId || '') : taskInScope(task, scope, profile.userId) && scopeClassIds(scope).includes(getDemoStudent(this.data.studentId)?.classId || '')));
    if (!task || !allowed) { this.setData({ denied: true, pages: [], questions: [], selected: null, learningMode:'result',reasonOpen:false,notebookEntries:[] }); return; }
    const records = getStudentSubmissions(task.id, this.data.studentId).filter(r => r.questions.length);
    const focusIndex = this.data.focus ? records.findIndex(r => r.questions.some(q => q.id === this.data.focus)) : -1;
    const pageIndex = focusIndex >= 0 ? focusIndex : Math.max(0, Math.min(this.data.pageIndex, records.length - 1));
    const current = records[pageIndex];
    const questions = (current?.questions || []).map((q,index) => {const region=questionRegion(q,index,Boolean(current?.isMock)),mark=questionMark(q,parent);return {id:q.id,label:q.label,result:mark.label,stem:q.stem||'题目内容暂未返回，请查看提交原图。',studentAnswer:q.studentAnswer||'未识别',mark:mark.mark,tone:mark.tone,boxLabel:mark.label,regionStyle:region?`left:${region.x*100}%;top:${region.y*100}%;width:${region.width*100}%;height:${region.height*100}%;`:'',selected:q.id===this.data.focus,wrong:mark.tone==='wrong'};});
    const candidates = questions.filter(q => !this.data.wrongOnly || q.wrong);
    const chosen = candidates.find(q => q.id === this.data.focus) || candidates[0];
    const q = current?.questions.find(q => q.id === chosen?.id);
    const reference = q ? teacherReference(task,q.id,parent) : null;
    const visible = q && q.state === 'confirmed' && (!parent || isResultReleased(q));
    const explanationVisible=visible&&(!parent||!!q&&canUseAIExplanation(q));
    if(this.data.learningMode==='tutor'&&!explanationVisible)this.setData({learningMode:'result'});
    if(this.data.learningMode!=='result'&&!visible)this.setData({learningMode:'result',reasonOpen:false});
    this.setData({ regionCount:questions.filter(q=>q.regionStyle).length,notebookEntries:readNotebook().filter(entry=>entry.studentId===this.data.studentId),denied: false, focus: '', pageIndex, studentName: getDemoStudent(this.data.studentId)?.name || '学生', taskTitle: task.title, hideOriginal: !parent && scope.view === 'school', progress: gradingProgress(records.flatMap(r => r.questions), parent), pages: records.map((r, i) => ({ id: r.itemId, title: task.items.find(item => item.id === r.itemId)?.title || `第 ${i + 1} 页`, path: r.isMock ? demoPhotoPath(r.itemId) : r.mediaPath || '', mock: Boolean(r.isMock), selected: i === pageIndex })), questions: questions.map(item => ({ ...item, selected: item.id === q?.id })), selected: q ? { id: q.id, label: q.label, result: parent ? parentGradeLabel(q) : gradeLabel(q), stem: q.stem || '题目内容暂未返回，请查看提交原图。', studentAnswer: q.studentAnswer || '未识别', saved:readNotebook().some(entry=>entry.key===notebookKey(this.data.studentId,this.data.taskId,current!.itemId,q.id)),videoUrl: explanationVisible ? q.knowledgeVideoUrl || '' : '', referenceAnswer:reference?.answer||'',referenceExplanation:reference?.explanation||'',referenceNotice:reference?.locked?(reference.availableAt?'首次截止后可查看 · '+reference.availableAt:'参考资料查看时间待设置'):'',allowed: Boolean(visible), explanationAllowed:Boolean(explanationVisible), wrong: Boolean(visible && !q.correct), sections: explanationVisible ? [{title:'判定来源',text:q.decisionSource==='teacher'?'教师已复核':'AI 批改',open:true},{ title: '分析', text: q.analysis || '暂无分析', open: true }, { title: '本次 AI 答案', text: q.answer || '暂无答案', open: true }, { title: '详解', text: q.explanation || '暂无详解', open: true }, { title: '点睛', text: q.keyPoint || '暂无点睛', open: false }, { title: '知识点', text: q.knowledge || '暂无知识点', open: false }] : [] } : null });
  },
  changePage(event: WechatMiniprogram.BaseEvent) { this.setData({ learningMode:'result',reasonOpen:false,pageIndex: Number(event.currentTarget.dataset.index), focus: '' }); this.refreshResult(); },
  selectQuestion(event: WechatMiniprogram.BaseEvent) { this.setData({ learningMode:'result',reasonOpen:false,wrongOnly:false,focus: String(event.currentTarget.dataset.id) }); this.refreshResult(); wx.createSelectorQuery().select('#result-detail').boundingClientRect(rect => { if (rect && !Array.isArray(rect)) wx.pageScrollTo({ selector: '#result-detail', duration: 180 }); }).exec(); },
  toggleWrong() { this.setData({ wrongOnly: !this.data.wrongOnly, focus: '' }); this.refreshResult(); },
  toggleSection(event: WechatMiniprogram.BaseEvent) { const selected = this.data.selected; if (!selected) return; const index = Number(event.currentTarget.dataset.index); this.setData({ selected: { ...selected, sections: selected.sections.map((section, i) => i === index ? { ...section, open: !section.open } : section) } }); },
  previewOriginal() { if (this.data.hideOriginal) return; const page = this.data.pages[this.data.pageIndex]; if (page?.path) wx.previewImage({ urls: this.data.pages.filter(p => p.path).map(p => p.path), current: page.path }); },
  getLearningContext(): {question:GradeQuestion;record:ItemSubmission}|null {
    const id=this.data.selected?.id;if(!id||this.data.role!=='guardian')return null;
    this.setData({focus:id});this.refreshResult();if(this.data.denied||!this.data.selected?.allowed)return null;
    const record=getStudentSubmissions(this.data.taskId,this.data.studentId).filter(r=>r.questions.length)[this.data.pageIndex],question=record?.questions.find(q=>q.id===id);
    return question&&isResultReleased(question)&&(this.data.learningMode!=='tutor'||canUseAIExplanation(question))?{record,question}:null;
  },
  openMistakeReason(){if(!this.getLearningContext())return;this.setData({reasonOpen:true,learningError:''});},
  closeMistakeReason(){this.setData({reasonOpen:false});},
  chooseMistakeReason(event: WechatMiniprogram.BaseEvent){const reason=String(event.currentTarget.dataset.reason);if(MISTAKE_REASONS.includes(reason))this.setData({mistakeReason:reason});},
  saveMistake(){const c=this.getLearningContext();if(!c)return;try{wx.setStorageSync(NOTEBOOK_KEY,addNotebookEntry(readNotebook(),{studentId:this.data.studentId,taskId:this.data.taskId,itemId:c.record.itemId,version:c.record.version||1,imagePath:c.record.isMock?'/assets/homework-demo-paper.png':c.record.mediaPath,taskTitle:this.data.taskTitle},c.question,this.data.mistakeReason));this.setData({reasonOpen:false,focus:c.question.id});this.refreshResult();wx.showToast({title:'已加入孩子的错题本',icon:'success'});}catch{this.setData({learningError:'保存失败，请稍后重试'});}},
  openNotebook(){if(!this.getLearningContext())return;this.setData({learningMode:'notebook'});},
  stopTutorTimer(){if(this.tutorTimer!==undefined)clearTimeout(this.tutorTimer);this.tutorTimer=undefined;},
  saveTutor(){if(!this.data.tutor)return;try{let all=wx.getStorageSync(TUTOR_STORAGE_KEY);if(!all||Array.isArray(all)||typeof all!=='object')all={};all[this.data.tutor.key]=this.data.tutor;Object.keys(all).sort((a,b)=>(all[b].updatedAt||0)-(all[a].updatedAt||0)).slice(30).forEach(k=>delete all[k]);wx.setStorageSync(TUTOR_STORAGE_KEY,all);}catch{this.setData({tutorNotice:'进度保存失败，本次位置可能无法保留。请稍后重试。'});}},
  ensureTutor(){
    if(!this.lessonSource||!this.data.tutor)return false;
    const c=this.getLearningContext(),accountId=getSession()?.profile.userId;
    if(!c||!canUseAIExplanation(c.question)||getSession()?.profile.activeStudentId&&getSession()?.profile.activeStudentId!==this.data.studentId||accountId!==this.lessonSource.accountId||tutorFingerprint({...this.lessonSource,submissionVersion:c.record.version||1,question:c.question})!==this.data.tutor.fingerprint){this.stopTutorTimer();this.setData({learningMode:'result',tutor:null,tutorNotice:'题目状态已更新，请重新进入讲题。'});return false;}
    return true;
  },
  syncTutor(){const s=this.data.tutor;if(!s)return;const a=tutorCurrent(s,this.lessonPlan),quiz=s.phase==='transfer'||s.phase==='paused'&&s.returnPhase==='transfer'?tutorTransfer(this.lessonPlan):null;this.setData({tutorPrompt:quiz?.prompt||a?.prompt||'',tutorOptions:quiz?.options||a?.options||[],tutorAction:a||null,tutorCaption:tutorText(s,this.lessonPlan),tutorCells:a?tutorCells(a.board):[],tutorCellWidth:a?.board.columns?100/a.board.columns+'%':'100%',tutorCellHeight:a?.board.rows?140/a.board.rows+'px':'140px',lessonLength:this.lessonPlan.length,tutorSummary:tutorSummary(s,this.lessonPlan),tutorCanAnswer:!!quiz||s.phase==='waiting'||s.phase==='choice'||s.phase==='paused'&&s.returnPhase==='waiting',tutorLive:['playing','feedback','remedial'].includes(s.phase)});this.saveTutor();},
  scheduleTutor(){this.stopTutorTimer();const s=this.data.tutor;if(!s||this.data.tutorEditor||this.tutorTyping)return;if(this.data.tutorSheet&&['feedback','remedial','aside'].includes(s.phase))return;if(s.phase==='waiting'&&!s.draft&&this.tutorIdleEpoch!==s.epoch){this.tutorTimer=setTimeout(()=>{if(this.data.tutor?.phase==='waiting'&&this.data.tutor.epoch===s.epoch&&this.ensureTutor()){this.tutorIdleEpoch=s.epoch;this.setData({tutorNotice:'可以写下想法、给点提示，或先继续讲。'});}},30000);return;}if(!['playing','feedback','remedial'].includes(s.phase))return;const epoch=s.epoch;this.tutorTimer=setTimeout(()=>{if(this.data.learningMode==='tutor'&&this.data.tutor?.epoch===epoch)this.tutorDispatch({type:'tick',epoch});},tutorDelay(tutorText(s,this.lessonPlan)));},
  tutorDispatch(event:TutorEvent){this.stopTutorTimer();if(!this.ensureTutor()||!this.data.tutor)return;const tutor=tutorReduce(this.data.tutor,this.lessonPlan,event);this.setData({tutor,tutorSheet:['waiting','choice','transfer'].includes(tutor.phase)?'answer':['done','playing'].includes(tutor.phase)?'':this.data.tutorSheet});this.syncTutor();this.scheduleTutor();},
  openTutor(){const c=this.getLearningContext();if(!c)return;if(!canUseAIExplanation(c.question)){wx.showToast({title:'讲解暂未核实，请稍后再试',icon:'none'});return;}
    const accountId=getSession()?.profile.userId;if(!accountId)return;
    this.lessonSource={accountId,studentId:this.data.studentId,taskId:this.data.taskId,itemId:c.record.itemId,submissionVersion:c.record.version||1,question:JSON.parse(JSON.stringify(c.question))};
    this.lessonPlan=tutorPlan(c.question);let previous;try{previous=wx.getStorageSync(TUTOR_STORAGE_KEY)?.[tutorKey(this.lessonSource)];}catch{}
    const tutor=createTutor(this.lessonSource,previous);this.setData({learningMode:'tutor',tutor,tutorEditor:false,tutorSheet:['waiting','choice','transfer'].includes(tutor.phase)?'answer':'',tutorNotice:''});this.syncTutor();wx.pageScrollTo({scrollTop:0,duration:0});this.scheduleTutor();
  },
  beginGuide(){this.setData({tutorEditor:false,tutorSheet:''});this.tutorDispatch({type:'restart'});},
  pauseTutor(){this.tutorDispatch({type:'pause'});},
  resumeTutor(){this.setData({tutorEditor:false,tutorSheet:''});this.tutorDispatch({type:'resume'});},
  nextTutor(){this.tutorDispatch({type:'tick'});},
  skipTutor(){if(this.data.tutor?.phase==='choice')this.setData({'tutor.phase':'waiting'});this.setData({tutorEditor:false});this.tutorDispatch({type:'skip'});},
  tutorHint(){this.setData({tutorEditor:false,tutorSheet:'help'});this.tutorDispatch({type:'hint'});},
  tutorBack(){this.setData({tutorEditor:false,tutorSheet:''});this.tutorDispatch({type:'back'});},
  openTutorAsk(){if(this.data.tutor?.phase==='playing')this.tutorDispatch({type:'pause',input:true});this.setData({tutorSheet:'ask',tutorEditor:false});},
  reopenTutorSheet(){this.setData({tutorSheet:this.data.tutor?.phase==='aside'?'help':'answer'});},
  closeTutorSheet(){this.setData({tutorSheet:'',tutorEditor:false});this.scheduleTutor();},
  continueTutorSheet(){this.tutorDispatch({type:'tick'});},
  tutorExplain(){this.tutorDispatch({type:'ask',text:'这一步怎么理解'});},
  tutorDirect(){this.setData({tutorEditor:false});this.tutorDispatch({type:'direct'});},
  tutorParent(){this.setData({tutorEditor:false});this.tutorDispatch({type:'parent'});},
  editTutor(){if(this.data.tutor?.phase==='playing')this.tutorDispatch({type:'pause',input:true});this.setData({tutorSheet:this.data.tutorSheet||'ask',tutorEditor:true});},
  cancelTutorInput(){this.tutorTyping=false;this.setData({tutorEditor:false});this.scheduleTutor();},
  blurTutor(){this.tutorTyping=false;this.scheduleTutor();},
  focusTutor(){this.tutorTyping=true;this.stopTutorTimer();if(this.data.tutor?.phase==='playing')this.tutorDispatch({type:'pause',input:true});},
  changeTutorAnswer(event:WechatMiniprogram.CustomEvent<{value:string}>){this.stopTutorTimer();if(!this.data.tutor)return;this.setData({tutor:tutorReduce(this.data.tutor,this.lessonPlan,{type:'draft',text:event.detail.value})});this.saveTutor();},
  tutorOption(event:WechatMiniprogram.BaseEvent){this.tutorTyping=false;if(this.data.tutor?.phase==='choice')this.setData({'tutor.phase':'waiting'});this.setData({tutorEditor:false});this.tutorDispatch({type:'answer',text:String(event.currentTarget.dataset.answer)});},
  transferTutor(){this.setData({tutorEditor:false});this.tutorDispatch({type:'transfer'});},
  submitTutorInput(){if(this.data.tutorCanAnswer&&this.data.tutorSheet!=='ask')this.advanceTutor();else this.askTutor();},
  advanceTutor(){this.tutorTyping=false;const text=this.data.tutor?.draft||'';this.setData({tutorEditor:false});if(this.data.tutor?.phase==='choice')this.setData({'tutor.phase':'waiting'});this.tutorDispatch({type:'answer',text});},
  askTutor(){this.tutorTyping=false;const text=this.data.tutor?.draft||'';this.setData({tutorEditor:false});this.tutorDispatch({type:'ask',text});},
  voiceTutor(){this.tutorDispatch({type:'pause',input:true});this.setData({tutorEditor:true,tutorNotice:'当前小程序未接入语音识别，已切换文字输入。'});},
  soundTutor(){this.tutorDispatch({type:'pause'});this.setData({tutorNotice:'原生语音合成尚未接入，当前可使用无声阅读与分步交互。'});},
  tutorOriginal(){this.tutorDispatch({type:'original'});},
  closeTutorOriginal(){this.tutorDispatch({type:'closeOriginal'});},
  closeLearning(){this.stopTutorTimer();if(this.data.tutor){this.setData({tutor:tutorReduce(this.data.tutor,this.lessonPlan,{type:'pause'})});this.saveTutor();}this.setData({learningMode:'result',reasonOpen:false,tutorEditor:false,tutorSheet:''});wx.pageScrollTo({scrollTop:this.resultScroll,duration:0});},
  stopReasonTap(){},
  goBack() { if(this.data.learningMode==='tutor'&&this.data.tutor?.originalOpen){this.closeTutorOriginal();return;}if(this.data.reasonOpen){this.closeMistakeReason();return;}if(this.data.learningMode!=='result'){this.closeLearning();return;}wx.navigateBack({ delta: 1 }); },
});
