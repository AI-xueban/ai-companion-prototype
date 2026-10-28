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
  tutorSourceTouch:null as {x:number;y:number;swiped:boolean}|null,
  resultSheetTouch:null as {x:number;y:number;height:number;moved:boolean}|null,
  resultSheetBounds:{min:138,max:640},
  resultSheetScroll:0,
  resultSheetSwiped:false,
  tutorTimer: undefined as ReturnType<typeof setTimeout>|undefined,
  lessonPlan: [] as TutorAction[],
  lessonSource: null as TutorSource|null,
  resultScroll: 0, tutorTyping:false, tutorIdleEpoch:-1,
  data: {
    tutorBoardLines:[] as string[], tutorNeedsHelp:false,tutorRatio:false, tutor: null as TutorSession|null, tutorAction:null as TutorAction|null, tutorCaption:'',tutorPrompt:'',tutorOptions:[] as string[], tutorCells:[] as ReturnType<typeof tutorCells>, tutorSummary:[] as ReturnType<typeof tutorSummary>, tutorCellWidth:'100%',tutorCellHeight:'140px',lessonLength:0, tutorEditor:false, tutorCanAnswer:false, tutorLive:false,tutorNotice:'',tutorSheet:'',
    resultSheetRatio:.55,resultSheetMinimized:false,resultSheetFull:false,learningMode:'result',reasonOpen:false,resultSheetExpanded:false,resultSheetScrollTop:0,tutorResume:false,tutorCompleted:false,tutorRecordExists:false,mistakeReason:MISTAKE_REASONS[0],mistakeReasons:MISTAKE_REASONS,learningError:'',notebookEntries:[] as NotebookEntry[],tutorHistory:null as {status:string;updated:string}|null,regionCount:0,
    itemId:'',taskId: '', studentId: '', role: 'guardian', focus: '', studentName: '', taskTitle: '', denied: false,
    statusBarHeight: 24, navBarHeight: 44, pageIndex: 0, wrongOnly: false, hideOriginal: false,
    progress: gradingProgress([]), pages: [] as Array<{ id: string; title: string; path: string; mock: boolean; selected: boolean }>,
    questions: [] as Array<{ id: string; label: string; result: string; stem: string; studentAnswer: string; mark: string; selected: boolean; wrong: boolean; released:boolean; regionStyle:string; tone:string; boxLabel:string }>,
    questionNav: [] as Array<{id:string;itemId:string;number:string;mark:string;tone:string;result:string;selected:boolean}>,
    selected: null as { id: string; label: string; result: string; stem: string; studentAnswer: string; answer:string; explanation:string; allowed: boolean; explanationAllowed:boolean; referenceAnswer:string; referenceExplanation:string; referenceNotice:string; wrong: boolean; reviewed:boolean; videoUrl: string; saved:boolean; originalPath:string; originalRegionRatio:number; originalLocated:boolean; originalCropStyle:string; originalMock:boolean; sections: Array<{ title: string; text: string; open: boolean }> } | null,
  },
  onLoad(options: { taskId?: string; studentId?: string; role?: string; focus?: string;itemId?:string }) {
    const info = wx.getWindowInfo(), capsule = wx.getMenuButtonBoundingClientRect();
    this.resultSheetBounds.max=info.windowHeight-info.statusBarHeight-capsule.height-Math.max(0,capsule.top-info.statusBarHeight)*2;
    this.setData({itemId:options.itemId||'', taskId: options.taskId || '', studentId: options.studentId || '', role: options.role === 'teacher' ? 'teacher' : 'guardian', focus: options.focus || '', statusBarHeight: info.statusBarHeight, navBarHeight: capsule.height + Math.max(0, capsule.top - info.statusBarHeight) * 2 });
  },
  onResize(){this.measureResultSheet();},
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
    const records = getStudentSubmissions(task.id, this.data.studentId).filter(r => r.questions.length&&(!this.data.itemId||r.itemId===this.data.itemId));
    const focusIndex = this.data.focus ? records.findIndex(r => r.questions.some(q => q.id === this.data.focus)) : -1;
    const pageIndex = focusIndex >= 0 ? focusIndex : Math.max(0, Math.min(this.data.pageIndex, records.length - 1));
    const current = records[pageIndex];
    const questions = (current?.questions || []).map((q,index) => {const region=questionRegion(q,index,Boolean(current?.isMock)),mark=questionMark(q,parent);return {id:q.id,label:q.label,result:mark.label,stem:q.stem||'题目内容暂未返回，请查看提交原图。',studentAnswer:q.studentAnswer||'暂无作答内容',mark:mark.mark,tone:mark.tone,boxLabel:mark.label,regionStyle:region?`left:${region.x*100}%;top:${region.y*100}%;width:${region.width*100}%;height:${region.height*100}%;`:'',selected:q.id===this.data.focus,wrong:mark.tone==='wrong',released:!parent||isResultReleased(q)};});
    const candidates = questions.filter(q => q.released&&(!this.data.wrongOnly || q.wrong));
    const chosen = candidates.find(q => q.id === (this.data.focus||this.data.selected?.id)) || candidates[0];
    const q = current?.questions.find(q => q.id === chosen?.id);
    const originalPath=current?(current.isMock&&/^(?:grading|console)-page-[12]$/.test(current.itemId)?demoPhotoPath(current.itemId):current.photos?.[q?.pageIndex||0]?.path||(current.isMock?demoPhotoPath(current.itemId):current.mediaPath||'')):'';
    const originalRegion=q&&current?questionRegion(q,current.questions.indexOf(q),Boolean(current.isMock)):null;
    const originalCropStyle=originalRegion?`width:${100/originalRegion.width}%;height:${100/originalRegion.height}%;left:${-100*originalRegion.x/originalRegion.width}%;top:${-100*originalRegion.y/originalRegion.height}%;`:'width:100%;height:auto;left:0;top:0;';
    const reference = q ? teacherReference(task,q.id,parent,current) : null;
    const visible = q && q.state === 'confirmed' && (!parent || isResultReleased(q));
    const explanationVisible=visible&&(!parent||!!q&&canUseAIExplanation(q));
    const tutorSource=q&&current?{accountId:profile.userId,studentId:this.data.studentId,taskId:this.data.taskId,itemId:current.itemId,submissionVersion:current.version||1,question:q}:null;
    let savedTutor:TutorSession|undefined;try{if(tutorSource)savedTutor=wx.getStorageSync(TUTOR_STORAGE_KEY)?.[tutorKey(tutorSource)];}catch{}
    const savedTutorValid=Boolean(tutorSource&&savedTutor?.fingerprint===tutorFingerprint(tutorSource));
    if(this.data.learningMode==='tutor'&&!explanationVisible)this.setData({learningMode:'result'});
    if(this.data.learningMode!=='result'&&!visible)this.setData({learningMode:'result',reasonOpen:false});
    this.setData({ regionCount:questions.filter(q=>q.regionStyle).length,notebookEntries:readNotebook().filter(entry=>entry.studentId===this.data.studentId),denied: false, focus: '', pageIndex, studentName: getDemoStudent(this.data.studentId)?.name || '学生', taskTitle: task.title, hideOriginal: !parent && scope.view === 'school', progress: gradingProgress(records.flatMap(r => r.questions), parent), pages: records.map((r, i) => ({ id: r.itemId, title: task.items.find(item=>item.id===r.itemId)?.title || `第 ${i + 1} 页`, path: r.isMock ? demoPhotoPath(r.itemId) : r.mediaPath || '', mock: Boolean(r.isMock), selected: i === pageIndex })), questions: questions.map(item => ({ ...item, selected: item.id === q?.id })), questionNav:parent?records.flatMap(r=>r.questions.filter(isResultReleased).map(question=>({id:question.id,itemId:r.itemId,mark:questionMark(question,true).mark,tone:questionMark(question,true).tone,result:parentGradeLabel(question),number:question.label.match(/第\s*[^题]+题/)?.[0].replace(/\s/g,'')||question.label,selected:question.id===q?.id}))):[], tutorResume:Boolean(savedTutorValid&&savedTutor?.phase!=='done'),tutorCompleted:Boolean(savedTutorValid&&savedTutor?.phase==='done'),tutorRecordExists:savedTutorValid, selected: q ? { id: q.id, label: parent?(q.label.match(/第\s*[^题]+题/)?.[0].replace(/\s/g,'')||q.label):q.label, result: parent ? parentGradeLabel(q) : gradeLabel(q), stem: q.stem || '题目文字暂未提取，请查看上方原图。', studentAnswer: q.studentAnswer || '暂无作答内容', answer:explanationVisible?q.answer||'暂无答案':'',  explanation:explanationVisible?q.explanation||'暂无详解':'',  saved:readNotebook().some(entry=>entry.key===notebookKey(this.data.studentId,this.data.taskId,current!.itemId,q.id)),videoUrl: explanationVisible ? q.knowledgeVideoUrl || '' : '', originalPath,originalRegionRatio:originalRegion?originalRegion.height/originalRegion.width:1,originalLocated:Boolean(originalRegion),originalCropStyle,originalMock:Boolean(current?.isMock),referenceAnswer:reference?.answer||'',referenceExplanation:reference?.explanation||'',referenceNotice:reference?.locked?'本项批改完成后可查看':'',allowed: Boolean(visible), explanationAllowed:Boolean(explanationVisible), wrong: Boolean(visible && !q.correct), reviewed: q.decisionSource === 'teacher', sections: explanationVisible ? [{title:'判定来源',text:q.decisionSource==='teacher'?'教师已复核':'AI 批改',open:true},{ title: '分析', text: q.analysis || '', open: true }, { title: '本次 AI 答案', text: q.answer || '暂无答案', open: true }, { title: '详解', text: q.explanation || '暂无详解', open: true }, { title: '点睛', text: q.keyPoint || '', open: false }, { title: '知识点', text: q.knowledge || '', open: false }].filter(section=>section.text.trim()) : [] } : null });
  },
  changePage(event: WechatMiniprogram.BaseEvent) { this.setData({ learningMode:'result',reasonOpen:false,pageIndex: Number(event.currentTarget.dataset.index), focus: '' }); this.refreshResult(); },
  selectQuestion(event: WechatMiniprogram.BaseEvent) { this.setData({ learningMode:'result',reasonOpen:false,wrongOnly:false,focus: String(event.currentTarget.dataset.id) }); this.refreshResult(); wx.createSelectorQuery().select('#result-detail').boundingClientRect(rect => { if (rect && !Array.isArray(rect)) wx.pageScrollTo({ selector: '#result-detail', duration: 180 }); }).exec(); },
  selectSheetQuestion(event:WechatMiniprogram.BaseEvent){const itemId=String(event.currentTarget.dataset.item),id=String(event.currentTarget.dataset.id),index=this.data.pages.findIndex(page=>page.id===itemId);if(index<0)return;this.resultSheetScroll=0;this.setData({pageIndex:index,focus:id,reasonOpen:false,resultSheetScrollTop:0});this.refreshResult();},
  onReady(){this.measureResultSheet();},
  measureResultSheet(){wx.createSelectorQuery().select('.result-stage').boundingClientRect().select('.result-handle').boundingClientRect().select('.result-sheet-top').boundingClientRect().select('.result-sheet-footer').boundingClientRect().exec(rects=>{if(!rects[0])return;const max=rects[0].height,min=rects.slice(1).reduce((sum:number,rect:{height:number}|null)=>sum+(rect?.height||0),0);this.resultSheetBounds={max,min:Math.min(min||138,max)};});},
  setResultHeight(height:number){const {min,max}=this.resultSheetBounds;let value=Math.max(min,Math.min(max,height));if(value>max-4)value=max;this.setData({resultSheetRatio:value/max,resultSheetMinimized:value<=min+8,resultSheetFull:value>=max-1,resultSheetExpanded:value>min+8});},
  showResultOriginal(){this.setResultHeight(this.resultSheetBounds.min);},
  toggleResultSheet(){if(this.resultSheetSwiped)return;const {min,max}=this.resultSheetBounds,height=this.data.resultSheetRatio*max;this.setResultHeight(height<=min+8?max*.55:height<max-4?max:min);},
  expandResultSheet(){this.setResultHeight(this.resultSheetBounds.max);},
  onResultSheetScroll(event:{detail:{scrollTop:number}}){this.resultSheetScroll=event.detail.scrollTop;},
  sheetTouchStart(event:WechatMiniprogram.TouchEvent){const t=event.touches[0];if(t)this.resultSheetTouch={x:t.clientX,y:t.clientY,height:this.data.resultSheetRatio*this.resultSheetBounds.max,moved:false};},
  sheetTouchMove(event:WechatMiniprogram.TouchEvent){const t=event.touches[0],start=this.resultSheetTouch;if(!t||!start)return;const dy=start.y-t.clientY,dx=t.clientX-start.x;if(!start.moved&&(Math.abs(dy)<4||Math.abs(dy)<Math.abs(dx)))return;start.moved=true;this.setResultHeight(start.height+dy);},
  sheetTouchEnd(event:WechatMiniprogram.TouchEvent){const start=this.resultSheetTouch,t=event.changedTouches[0];if(!start)return;if(start.moved&&t)this.setResultHeight(start.height+start.y-t.clientY);this.resultSheetTouch=null;if(start.moved){this.resultSheetSwiped=true;setTimeout(()=>{this.resultSheetSwiped=false;},400);}},
  sheetTouchCancel(){if(this.resultSheetTouch?.moved){this.resultSheetSwiped=true;setTimeout(()=>{this.resultSheetSwiped=false;},400);}this.resultSheetTouch=null;},
  toggleWrong() { this.setData({ wrongOnly: !this.data.wrongOnly, focus: '' }); this.refreshResult(); },
  toggleSection(event: WechatMiniprogram.BaseEvent) { const selected = this.data.selected; if (!selected) return; const index = Number(event.currentTarget.dataset.index); this.setData({ selected: { ...selected, sections: selected.sections.map((section, i) => i === index ? { ...section, open: !section.open } : section) } }); },
  previewOriginal() { if (this.data.hideOriginal) return; const page = this.data.pages[this.data.pageIndex]; if (page?.path) wx.previewImage({ urls: this.data.pages.filter(p => p.path).map(p => p.path), current: page.path }); },
  getLearningContext(): {question:GradeQuestion;record:ItemSubmission}|null {
    const id=this.data.selected?.id;if(!id||this.data.role!=='guardian')return null;
    this.setData({focus:id});this.refreshResult();if(this.data.denied||!this.data.selected?.allowed)return null;
    const record=getStudentSubmissions(this.data.taskId,this.data.studentId).filter(r=>r.questions.length&&(!this.data.itemId||r.itemId===this.data.itemId))[this.data.pageIndex],question=record?.questions.find(q=>q.id===id);
    return question&&isResultReleased(question)&&(this.data.learningMode!=='tutor'||canUseAIExplanation(question))?{record,question}:null;
  },
  openMistakeReason(){if(!this.getLearningContext())return;this.setData({reasonOpen:true,learningError:''});},
  closeMistakeReason(){this.setData({reasonOpen:false});},
  chooseMistakeReason(event: WechatMiniprogram.BaseEvent){const reason=String(event.currentTarget.dataset.reason);if(MISTAKE_REASONS.includes(reason))this.setData({mistakeReason:reason});},
  saveMistake(){const c=this.getLearningContext();if(!c)return;try{wx.setStorageSync(NOTEBOOK_KEY,addNotebookEntry(readNotebook(),{studentId:this.data.studentId,taskId:this.data.taskId,itemId:c.record.itemId,version:c.record.version||1,imagePath:c.record.photos?.[c.question.pageIndex||0]?.path||(c.record.isMock?'/assets/homework-demo-paper.png':c.record.mediaPath),taskTitle:this.data.taskTitle},c.question,this.data.mistakeReason));this.setData({reasonOpen:false,focus:c.question.id});this.refreshResult();wx.showToast({title:'已加入孩子的错题本',icon:'success'});}catch{this.setData({learningError:'保存失败，请稍后重试'});}},
  openNotebook(){if(!this.getLearningContext())return;this.setData({learningMode:'notebook'});},
  openTutorHistory(){const c=this.getLearningContext();if(!c)return;const source: TutorSource={accountId:getSession()?.profile.userId||'',studentId:this.data.studentId,taskId:this.data.taskId,itemId:c.record.itemId,submissionVersion:c.record.version||1,question:c.question};let session: TutorSession|undefined;try{session=wx.getStorageSync(TUTOR_STORAGE_KEY)?.[tutorKey(source)];}catch{}const valid=session?.fingerprint===tutorFingerprint(source);this.setData({learningMode:'history',tutorHistory:valid?{status:session?.phase==='done'?'已讲完':'未讲完，可继续',updated:new Date(session!.updatedAt).toLocaleString('zh-CN')}:null});},
  stopTutorTimer(){if(this.tutorTimer!==undefined)clearTimeout(this.tutorTimer);this.tutorTimer=undefined;},
  saveTutor(){if(!this.data.tutor)return;try{let all=wx.getStorageSync(TUTOR_STORAGE_KEY);if(!all||Array.isArray(all)||typeof all!=='object')all={};all[this.data.tutor.key]=this.data.tutor;Object.keys(all).sort((a,b)=>(all[b].updatedAt||0)-(all[a].updatedAt||0)).slice(30).forEach(k=>delete all[k]);wx.setStorageSync(TUTOR_STORAGE_KEY,all);}catch{this.setData({tutorNotice:'进度保存失败，本次位置可能无法保留。请稍后重试。'});}},
  ensureTutor(){
    if(!this.lessonSource||!this.data.tutor)return false;
    const c=this.getLearningContext(),accountId=getSession()?.profile.userId;
    if(!c||!canUseAIExplanation(c.question)||getSession()?.profile.activeStudentId&&getSession()?.profile.activeStudentId!==this.data.studentId||accountId!==this.lessonSource.accountId||tutorFingerprint({...this.lessonSource,submissionVersion:c.record.version||1,question:c.question})!==this.data.tutor.fingerprint){this.stopTutorTimer();this.setData({learningMode:'result',tutor:null,tutorNotice:'题目状态已更新，请重新进入讲题。'});return false;}
    return true;
  },
  syncTutor(){const s=this.data.tutor;if(!s)return;const a=tutorCurrent(s,this.lessonPlan),quiz=s.phase==='transfer'||s.phase==='paused'&&s.returnPhase==='transfer'?tutorTransfer(this.lessonPlan):null;this.setData({tutorNeedsHelp:s.phase==='aside'&&s.detail.startsWith('暂时无法回答'),tutorRatio:!!a&&/24/.test(this.lessonSource?.question.stem||'')&&/7份/.test((this.lessonSource?.question.stem||'').replace(/\s/g,'')),tutorPrompt:quiz?.prompt||a?.prompt||'',tutorOptions:quiz?.options||a?.options||[],tutorBoardLines:this.lessonSource?.question.stem?.includes('24')&&/7份/.test((this.lessonSource.question.stem||'').replace(/\s/g,''))?({known:['男生24人，对应4份'],one:['24 ÷ 4 = ？（人）'],all:['6 × 7 = ？（人）'],method:['24 ÷ 4 × 7 = 42（人）','答：全班有42人。']} as Record<string,string[]>)[a?.id||'']||a?.board.lines||[]:a?.board.lines||[],tutorAction:a||null,tutorCaption:tutorText(s,this.lessonPlan),tutorCells:a?tutorCells(a.board):[],tutorCellWidth:a?.board.columns?100/a.board.columns+'%':'100%',tutorCellHeight:a?.board.rows?140/a.board.rows+'px':'140px',lessonLength:this.lessonPlan.length,tutorSummary:tutorSummary(s,this.lessonPlan),tutorCanAnswer:!!quiz||s.phase==='waiting'||s.phase==='choice'||s.phase==='paused'&&s.returnPhase==='waiting',tutorLive:['playing','feedback','remedial'].includes(s.phase)});this.saveTutor();},
  scheduleTutor(){this.stopTutorTimer();const s=this.data.tutor;if(!s||this.data.tutorEditor||this.tutorTyping||s.originalOpen)return;if(this.data.tutorSheet&&['feedback','remedial','aside'].includes(s.phase))return;if(s.phase==='waiting'&&!s.draft&&this.tutorIdleEpoch!==s.epoch){this.tutorTimer=setTimeout(()=>{if(this.data.tutor?.phase==='waiting'&&this.data.tutor.epoch===s.epoch&&this.ensureTutor()){this.tutorIdleEpoch=s.epoch;this.setData({tutorNotice:'可以选择答案，或点“我还不懂”。'});}},30000);return;}if(!['playing','feedback','remedial'].includes(s.phase))return;const epoch=s.epoch;this.tutorTimer=setTimeout(()=>{if(this.data.learningMode==='tutor'&&this.data.tutor?.epoch===epoch)this.tutorDispatch({type:'tick',epoch});},tutorDelay(tutorText(s,this.lessonPlan)));},
  tutorDispatch(event:TutorEvent){this.stopTutorTimer();if(!this.ensureTutor()||!this.data.tutor)return;const tutor=tutorReduce(this.data.tutor,this.lessonPlan,event);this.setData({tutor,tutorNotice:'',tutorSheet:['waiting','choice','transfer'].includes(tutor.phase)?'answer':['done','playing'].includes(tutor.phase)?'':this.data.tutorSheet});this.syncTutor();this.scheduleTutor();},
  openTutor(){const c=this.getLearningContext();if(!c)return;if(!canUseAIExplanation(c.question)){wx.showToast({title:'讲解暂未核实，请稍后再试',icon:'none'});return;}
    const accountId=getSession()?.profile.userId;if(!accountId)return;
    this.lessonSource={accountId,studentId:this.data.studentId,taskId:this.data.taskId,itemId:c.record.itemId,submissionVersion:c.record.version||1,question:JSON.parse(JSON.stringify(c.question))};
    this.lessonPlan=tutorPlan(c.question);let previous;try{previous=wx.getStorageSync(TUTOR_STORAGE_KEY)?.[tutorKey(this.lessonSource)];}catch{}
    const tutor=createTutor(this.lessonSource,previous);this.setData({learningMode:'tutor',tutor,tutorEditor:false,tutorSheet:['waiting','choice','transfer'].includes(tutor.phase)?'answer':'',tutorNotice:''});this.syncTutor();wx.pageScrollTo({scrollTop:0,duration:0});this.scheduleTutor();
  },
  beginGuide(){this.setData({tutorEditor:false,tutorSheet:''});this.tutorDispatch({type:'restart'});},
  pauseTutor(){this.tutorDispatch({type:'pause'});},
  resumeTutor(){this.tutorTyping=false;if(this.data.tutor?.originalOpen)this.setData({tutor:tutorReduce(this.data.tutor,this.lessonPlan,{type:'closeOriginal'})});this.setData({tutorEditor:false,tutorSheet:''});this.tutorDispatch({type:'resume'});},
  nextTutor(){this.tutorDispatch({type:'tick'});},
  skipTutor(){if(this.data.tutor?.phase==='choice')this.setData({'tutor.phase':'waiting'});this.setData({tutorEditor:false});this.tutorDispatch({type:'skip'});},
  tutorHint(){this.setData({tutorEditor:false,tutorSheet:'help'});this.tutorDispatch({type:'hint'});},
  tutorBack(){this.setData({tutorEditor:false,tutorSheet:''});this.tutorDispatch({type:'back'});},
  openTutorAsk(){this.setData({tutorNotice:''});if(this.data.tutor?.phase==='playing')this.tutorDispatch({type:'pause',input:true});this.setData({tutorSheet:'ask',tutorEditor:true});},
  reopenTutorSheet(){if(this.data.tutor?.phase==='paused'&&['feedback','remedial'].includes(this.data.tutor.returnPhase))this.tutorDispatch({type:'resume'});this.setData({tutorSheet:this.data.tutor?.phase==='aside'?'help':'answer'});},
  closeTutorSheet(){this.tutorTyping=false;this.stopTutorTimer();this.setData({tutorSheet:'',tutorEditor:false});},
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
  askTutor(){this.tutorTyping=false;const text=this.data.tutor?.draft||'';if(!text.trim()){this.setData({tutorEditor:true,tutorNotice:'先写下你的问题。'});return;}this.setData({tutorEditor:false});this.tutorDispatch({type:'ask',text});},
  voiceTutor(){this.tutorDispatch({type:'pause',input:true});this.setData({tutorEditor:true,tutorNotice:'当前小程序未接入语音识别，已切换文字输入。'});},
  soundTutor(){this.tutorDispatch({type:'pause'});this.setData({tutorNotice:'原生语音合成尚未接入，当前可使用无声阅读与分步交互。'});},
  tutorOriginal(){this.setData({tutorSheet:''});this.tutorDispatch({type:'original'});},
  toggleTutorOriginal(){if(this.tutorSourceTouch?.swiped){this.tutorSourceTouch=null;return;}if(this.data.tutor?.originalOpen)this.closeTutorOriginal();else this.tutorOriginal();},
  sourceTouchStart(event:WechatMiniprogram.TouchEvent){const t=event.touches[0];if(t)this.tutorSourceTouch={x:t.clientX,y:t.clientY,swiped:false};},
  sourceTouchEnd(event:WechatMiniprogram.TouchEvent){const t=event.changedTouches[0],start=this.tutorSourceTouch;if(!t||!start)return;const dy=t.clientY-start.y,dx=t.clientX-start.x;if(Math.abs(dy)<35||Math.abs(dy)<Math.abs(dx))return;start.swiped=true;if(dy>0&&!this.data.tutor?.originalOpen)this.tutorOriginal();else if(dy<0&&this.data.tutor?.originalOpen)this.closeTutorOriginal();},
  closeTutorOriginal(){this.tutorDispatch({type:'closeOriginal'});},
  finishTutor(){this.closeLearning();wx.navigateBack({delta:1});},
  closeLearning(){this.stopTutorTimer();if(this.data.tutor){this.setData({tutor:tutorReduce(this.data.tutor,this.lessonPlan,{type:'pause'})});this.saveTutor();}this.setData({learningMode:'result',reasonOpen:false,tutorEditor:false,tutorSheet:'',resultSheetScrollTop:this.resultSheetScroll});this.refreshResult();wx.pageScrollTo({scrollTop:this.resultScroll,duration:0});},
  stopReasonTap(){},
  goBack() { if(this.data.learningMode==='tutor'&&this.data.tutor?.originalOpen){this.closeTutorOriginal();return;}if(this.data.reasonOpen){this.closeMistakeReason();return;}if(this.data.learningMode!=='result'){this.closeLearning();return;}wx.navigateBack({ delta: 1 }); },
});
