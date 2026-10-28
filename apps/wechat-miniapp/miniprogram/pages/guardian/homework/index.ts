import { validateHomeworkMedia } from '../../../services/homeworkMedia';
import { submissionImagePages, submissionGradingComplete, submissionImageFailure, demoPhotoPath } from '../../../services/homeworkGrading';
import type { SubmissionImagePage } from '../../../services/homeworkGrading';
import { retryHomeworkItemGrading } from '../../../services/homeworkMock';
import { homeworkPreviewNotice, homeworkClosed, homeworkFileError, homeworkFileExtensions, homeworkDocumentError, homeworkSnapshotText, homeworkChangeLabel } from '../../../services/homeworkGrading';
import { getHomeworkTask } from '../../../services/homeworkMock';
import type { SubmissionPhoto } from '../../../services/homeworkMock';
type PendingPhoto=SubmissionPhoto & { originalPath?:string };
interface PendingUpload { requestId?:string; savedFile?:string; itemId:string;taskId:string;studentId:string;path:string;name:string;type:string;photos?:PendingPhoto[];expectedVersion?:number }
import { homeworkGradingNotice, gradingProgress, isResultReleased, parentGradeLabel, homeworkItemDisplayStatus, hasPendingHomeworkContent } from '../../../services/homeworkGrading';
import { questionMark, questionRegion } from '../../../services/homeworkLearning';
import { FILE_LIMITS, SUBMIT_LABEL, getStudentSubmissions, getSubmissionHistory, listStudentTasks, submitHomeworkItem } from '../../../services/homeworkMock';
import type { HomeworkTask } from '../../../services/homeworkMock';
import { hasRole } from '../../../permissions/access';
import { getSession, linkedGuardianStudents, selectGuardianStudent } from '../../../stores/session';
import { getDemoStudent, isRedundantCompletedHomeworkDemo, isRedundantIncompleteHomeworkDemo } from '../../../services/schoolDemoRoster';
import { getHomeworkWorksheet } from '../../../services/homeworkWorksheets';
import { fileVisual } from '../../../services/fileVisual';

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
    submissionMetrics:null as ReturnType<typeof gradingProgress>|null,submissionPreviewOpen:false,submissionPreviewIndex:0,submissionPreviewPages:[] as SubmissionImagePage[],
    items: [] as Array<{displayPhotos:SubmissionImagePage[];hasGradedImages:boolean;viewOriginal:boolean;noGradedImage:boolean; id: string; displayIndex: string; title: string; instruction: string; submitLabel: string; submitType: string; photos:Array<{path:string;name:string;marks:Array<{id:string;label:string;tone:string;mark:string;style:string}>}>;expectedPages:number;gradingEnabled:boolean;formatHint:string;hasPending:boolean;submitted: boolean; submittedAt: string; late: boolean; version: number; historyOpen:boolean; history: Array<{ version: number; submittedAt: string; operator:string }>; mediaLabel: string; mediaPath: string; fileIconKind: string; fileIconMark: string; demoAnswerPath: string; demoAnswerName: string; statusLabel:string; canRetryGrading:boolean; gradeStatus: string; marks: Array<{ id: string; label: string; tone: string; mark: string; style: string }>; gradeLinks: Array<{ id: string; label: string }> }>,
    completed: false,
    progressLabel: '', completedCount: 0, remainingCount: 0, requiredCount: 0, progressPercent: 0, summaryStatus: '',
    pendingUpload: null as PendingUpload | null,descriptionExpanded:false,changeRows:[] as Array<{at:string;label:string;reason:string;beforeText:string;afterText:string}>,pendingNotice:'',photoSaving:false,versionConflict:false,
    uploadState: 'idle' as 'idle' | 'saving' | 'failed', uploadError: '', hasUploadItems: false, hasVideoItems: false,
  },
  readPendingMap():Record<string,PendingUpload>{try{return wx.getStorageSync(this.pendingStorageKey())||{};}catch{return {};}},
  resumePending(event:WechatMiniprogram.BaseEvent){this.persistPending();const id=String(event.currentTarget.dataset.id),p=this.readPendingMap()[this.data.task!.id+':'+id];if(p?.studentId===this.data.studentId)this.setData({pendingUpload:p,uploadError:''});},
  retryGrading(event:WechatMiniprogram.BaseEvent){try{retryHomeworkItemGrading(this.data.task!.id,String(event.currentTarget.dataset.id),this.data.studentId);this.refreshTask();}catch(error){this.setData({uploadError:error instanceof Error?error.message:'重试失败'});}},
  currentVersion(taskId:string,itemId:string){return getStudentSubmissions(taskId,this.data.studentId).find(r=>r.itemId===itemId)?.version||0;},
  pendingStorageKey(){return 'homework-pending-v2:'+getSession()?.profile.userId+':'+this.data.studentId;},
  persistPending(){const p=this.data.pendingUpload;if(!p||p.studentId!==this.data.studentId)return;try{const all=wx.getStorageSync(this.pendingStorageKey())||{};all[p.taskId+':'+p.itemId]=p;wx.setStorageSync(this.pendingStorageKey(),all);this.setData({items:this.data.items.map(i=>({...i,hasPending:hasPendingHomeworkContent(all[(this.data.task?.id||'')+':'+i.id]),statusLabel:i.submitted?i.statusLabel:hasPendingHomeworkContent(all[(this.data.task?.id||'')+':'+i.id])?'待提交':'未提交'}))});return true;}catch{this.setData({pendingNotice:'暂存失败，请勿关闭页面，可移除部分文件后重试。'});return false;}},
  restorePending(taskId:string):PendingUpload|null{try{const all=wx.getStorageSync(this.pendingStorageKey())||{},entry=Object.values(all).find((p)=>{const row=p as PendingUpload;return row.taskId===taskId&&row.studentId===this.data.studentId;}) as PendingUpload|undefined;return entry||null;}catch{return null;}},
  clearPending(){const p=this.data.pendingUpload;if(!p)return;try{const all=wx.getStorageSync(this.pendingStorageKey())||{};delete all[p.taskId+':'+p.itemId];wx.setStorageSync(this.pendingStorageKey(),all);}catch{}},
  onHide(){this.persistPending();},onUnload(){this.persistPending();},
  toggleDescription(){this.setData({descriptionExpanded:!this.data.descriptionExpanded});},
  switchSubmissionImage(event:WechatMiniprogram.BaseEvent){const id=String(event.currentTarget.dataset.item),original=event.currentTarget.dataset.view==='original';this.setData({items:this.data.items.map(item=>item.id===id?{...item,viewOriginal:original,displayPhotos:item.displayPhotos.map(p=>({...p,path:original||!p.gradedPath?p.originalPath:p.gradedPath,showOriginal:original||!p.gradedPath,imageError:''}))}:item)});},
  submissionImageError(event:WechatMiniprogram.BaseEvent){const id=String(event.currentTarget.dataset.item),page=Number(event.currentTarget.dataset.page);this.setData({items:this.data.items.map(item=>item.id===id?{...item,displayPhotos:item.displayPhotos.map((p,i)=>i===page?submissionImageFailure(p):p)}:item)});},
  toggleSubmissionHistory(event:WechatMiniprogram.BaseEvent){const id=String(event.currentTarget.dataset.id);this.setData({items:this.data.items.map(item=>item.id===id?{...item,historyOpen:!item.historyOpen}:item)});},
  submissionPreviewError(event:WechatMiniprogram.BaseEvent){const index=Number(event.currentTarget.dataset.page);this.setData({submissionPreviewPages:this.data.submissionPreviewPages.map((page,i)=>i===index?submissionImageFailure(page):page)});},
  previewSubmissionPhoto(event:WechatMiniprogram.BaseEvent){const item=this.data.items.find(i=>i.id===String(event.currentTarget.dataset.item));if(!item?.displayPhotos.length)return;this.setData({submissionPreviewPages:item.displayPhotos.map(p=>({...p})),submissionPreviewIndex:Number(event.currentTarget.dataset.page)||0,submissionPreviewOpen:true});},
  changeSubmissionPreview(event:WechatMiniprogram.CustomEvent<{current:number}>){this.setData({submissionPreviewIndex:event.detail.current});},
  toggleSubmissionPreview(){const pages=this.data.submissionPreviewPages,page=pages[this.data.submissionPreviewIndex];if(!page?.gradedPath)return;page.showOriginal=!page.showOriginal;page.path=page.showOriginal?page.originalPath:page.gradedPath;page.imageError='';this.setData({submissionPreviewPages:pages});},
  closeSubmissionPreview(){this.setData({submissionPreviewOpen:false,submissionPreviewPages:[]});},
  zoomSubmissionPreview(){const page=this.data.submissionPreviewPages[this.data.submissionPreviewIndex];if(page?.path)wx.previewImage({urls:[page.path],current:page.path});},
  previewPendingPhoto(event:WechatMiniprogram.BaseEvent){const path=String(event.currentTarget.dataset.path||'');if(!path)return;const data=event.currentTarget.dataset;const item=this.data.items.find(row=>row.id===data.itemId);const paths=data.previewGroup==='submitted'?(item?.photos.length?item.photos.map(photo=>photo.path):[item?.mediaPath||path]):this.data.pendingUpload?.photos?.map(photo=>photo.path)||[path];const urls=paths.filter(Boolean);wx.previewImage({urls:urls.includes(path)?urls:[path],current:path});},
  addPendingPhotos(task:HomeworkTask,itemId:string,photos:PendingPhoto[]){
    this.persistPending();const current=this.data.pendingUpload,p=current?.taskId===task.id&&current.itemId===itemId&&current.studentId===this.data.studentId?current:{taskId:task.id,itemId,studentId:this.data.studentId,type:'photo',path:'',name:'作业照片',photos:[],expectedVersion:this.currentVersion(task.id,itemId)} as PendingUpload;
    const existing=p.photos||[];if(existing.length+photos.length>9){this.setData({uploadError:'每项最多 9 张，当前照片已保留。'});return;}
    const apply=()=>{p.photos=[...existing,...photos];p.path=p.photos[0]?.path||'';this.setData({pendingUpload:p,uploadError:'',uploadState:'idle'});this.persistPending();this.savePhotoDraft();};
    if(photos.some(photo=>existing.some(old=>old.path===photo.path||old.name===photo.name&&old.size===photo.size)))wx.showModal({title:'可能重复添加',content:'部分照片可能已经添加，仍然保留吗？',success:r=>{if(r.confirm)apply();}});else apply();
  },
  appendPhotos(event:WechatMiniprogram.BaseEvent){const task=this.data.task,itemId=String(event.currentTarget.dataset.id);if(!task||homeworkClosed(task))return;const row=getStudentSubmissions(task.id,this.data.studentId).find(r=>r.itemId===itemId);this.persistPending();const photos=row?.photos?.map(p=>({...p,saved:true}))||(row?.mediaPath?[{path:row.mediaPath,name:row.mediaLabel,saved:true}]:[]);this.setData({pendingUpload:{taskId:task.id,itemId,studentId:this.data.studentId,type:'photo',path:photos[0]?.path||'',name:'作业照片',photos,expectedVersion:row?.version||0},uploadError:''});this.persistPending();},
  removePendingPhoto(event:WechatMiniprogram.BaseEvent){if(this.data.photoSaving||this.data.uploadState==='saving')return;const p=this.data.pendingUpload;if(!p?.photos)return;p.photos.splice(Number(event.currentTarget.dataset.index),1);p.path=p.photos[0]?.path||'';this.setData({pendingUpload:{...p}});this.persistPending();},
  movePendingPhoto(event:WechatMiniprogram.BaseEvent){if(this.data.photoSaving||this.data.uploadState==='saving')return;const p=this.data.pendingUpload,i=Number(event.currentTarget.dataset.index),j=i+Number(event.currentTarget.dataset.delta);if(!p?.photos||j<0||j>=p.photos.length)return;[p.photos[i],p.photos[j]]=[p.photos[j],p.photos[i]];p.path=p.photos[0].path;this.setData({pendingUpload:{...p}});this.persistPending();},
  retryPendingPhoto(event:WechatMiniprogram.BaseEvent){const p=this.data.pendingUpload,photo=p?.photos?.[Number(event.currentTarget.dataset.index)];if(!photo)return;photo.error='';photo.saved=false;this.setData({pendingUpload:{...p!}});this.savePhotoDraft();},
  async savePhotoDraft(){
    if(this.data.photoSaving)return;const p=this.data.pendingUpload;if(!p?.photos)return;const child=this.data.studentId;this.setData({photoSaving:true});
    for(const photo of p.photos){if(photo.saved||photo.error)continue;if(photo.path.startsWith('/assets/')){photo.saved=true;continue;}
      try{await new Promise<void>((resolve,reject)=>wx.getImageInfo({src:photo.path,success:()=>resolve(),fail:()=>reject(new Error('图片无法读取，请重新选择。'))}));const saved=await new Promise<string>((resolve,reject)=>wx.getFileSystemManager().saveFile({tempFilePath:photo.originalPath||photo.path,success:r=>resolve(r.savedFilePath),fail:()=>reject(new Error('本张保存失败，请重试；其他照片保留。'))}));photo.originalPath=photo.path;photo.path=saved;photo.saved=true;photo.error='';}catch(error){photo.error=error instanceof Error?error.message:'图片暂存失败，请重试。';}
      if(child===this.data.studentId&&this.data.pendingUpload?.taskId===p.taskId&&this.data.pendingUpload?.itemId===p.itemId){p.path=p.photos[0]?.path||'';this.setData({pendingUpload:{...p}});}
    }
    this.setData({photoSaving:false});if(child===this.data.studentId&&this.data.pendingUpload?.taskId===p.taskId&&this.data.pendingUpload?.itemId===p.itemId){this.setData({pendingUpload:{...p}});this.persistPending();}
  },
  confirmPhotoBatch(){
    const p=this.data.pendingUpload,task=p&&getHomeworkTask(p.taskId),item=task?.items.find(i=>i.id===p?.itemId);if(!p?.photos||!task||!item||p.studentId!==this.data.studentId||this.data.photoSaving||this.data.uploadState==='saving')return;
    if(homeworkClosed(task)){this.setData({uploadError:'任务已撤回、终止或补交已结束，照片已保留，请联系老师。'});return;}
    if(p.expectedVersion!==this.currentVersion(task.id,item.id)){this.refreshTask();this.setData({uploadError:'已有新版本，请查看最新内容后再决定合并或替换。'});return;}
    if(!p.photos.length||p.photos.length>9||p.photos.some(photo=>!photo.saved||photo.error)){this.setData({uploadError:'请先处理失败图片；每项最多 9 张。'});return;}
    const commit=()=>{this.setData({uploadState:'saving'});try{const session=getSession(),profile=session?.profile;if(!profile||!session?.expiresAt||session.expiresAt<=Date.now()||!hasRole(profile,'guardian')||!linkedGuardianStudents(profile).some(c=>c.id===p.studentId)||profile.activeStudentId!==p.studentId)throw new Error('孩子或绑定关系已变化，请重新进入。');submitHomeworkItem(task.id,item.id,p.studentId,{path:p.photos![0].path,name:p.photos!.length+' 张作业照片',photos:p.photos,expectedVersion:p.expectedVersion,requestId:p.requestId ||= 'submit-'+Date.now()+'-'+Math.random().toString(36).slice(2)},{id:profile.userId,name:profile.displayName||'家长'});this.clearPending();this.setData({pendingUpload:null,uploadState:'idle',uploadError:'',pendingNotice:''});this.refreshTask();}catch(error){this.setData({uploadState:'failed',uploadError:error instanceof Error?error.message:'提交失败，照片已保留。'});}};
    const mismatch=item.expectedPages&&item.expectedPages!==p.photos.length;
    if(mismatch||p.expectedVersion)wx.showModal({title:mismatch?'核对提交页数':'确认新的完整版本',content:(mismatch?'老师预计 '+item.expectedPages+' 页，当前 '+p.photos.length+' 张。':'本次 '+p.photos.length+' 张将成为新的完整版本。')+'请核对，旧版本仍保留。',confirmText:'仍然提交',success:r=>{if(r.confirm)commit();}});else commit();
  },
  resolveVersionConflict(event:WechatMiniprogram.BaseEvent){const p=this.data.pendingUpload;if(!p)return;if(!p.photos){if(this.data.uploadState==='saving')return;delete p.requestId;p.expectedVersion=this.currentVersion(p.taskId,p.itemId);this.setData({pendingUpload:{...p},versionConflict:false,uploadError:'已选择使用当前文件，核对后确认重新提交；历史版本保留。'});this.persistPending();this.refreshTask();return;}const latest=getStudentSubmissions(p.taskId,this.data.studentId).find(r=>r.itemId===p.itemId),merge=event.currentTarget.dataset.mode==='merge';wx.showModal({title:merge?'合并最新照片':'替换最新版本',content:'最新提交 '+(latest?.photos?.length||1)+' 张；当前选择 '+p.photos.length+' 张。请先查看最新提交，再确认本次操作。历史版本保留。',success:r=>{if(!r.confirm)return;const photos=merge?[...(latest?.photos||[]).map(photo=>({...photo,saved:true})),...p.photos!.filter(photo=>!latest?.photos?.some(old=>old.path===photo.path))]:p.photos!;if(photos.length>9){this.setData({uploadError:'合并后超过 9 张，请先移除部分照片。'});return;}delete p.requestId;p.photos=photos;p.expectedVersion=latest?.version||0;this.setData({pendingUpload:{...p},uploadError:'已核对最新版本，请再次提交。'});this.persistPending();}});},

  onLoad() { const info = wx.getWindowInfo(); const capsule = wx.getMenuButtonBoundingClientRect(); this.setData({ statusBarHeight: info.statusBarHeight, navBarHeight: capsule.height + Math.max(0, capsule.top - info.statusBarHeight) * 2, capsuleSafeInset: Math.max(96, info.windowWidth - capsule.left + 8) }); },
  leavePending(): boolean {
    if(this.data.photoSaving||this.data.uploadState==='saving'){wx.showToast({title:'正在保存或提交，请稍候',icon:'none'});return false;}
    const map=this.readPendingMap(),p=this.data.pendingUpload;
    if(!p&&!Object.values(map).some(row=>row.studentId===this.data.studentId))return true;
    if(p&&(p.photos?.some(photo=>!photo.saved)||this.persistPending()===false)){wx.showToast({title:'暂存未成功，请重试后离开',icon:'none'});return false;}
    this.setData({pendingNotice:'已暂存，尚未提交。返回原孩子的这份作业可继续提交。'});
    wx.showToast({title:'已暂存，尚未提交',icon:'none'});return true;
  },
  detailHome() { if(!this.leavePending())return;this.setData({ mode: 'list', task: null, pendingUpload: null }); wx.redirectTo({ url: '/pages/guardian/learning/index' }); },
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
    if(!this.leavePending())return;
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
      const required = task.items;
      const count = required.filter(item => submitted.some(row => row.itemId === item.id)).length;
      const completed = count === required.length&&!task.withdrawnAt&&!task.stoppedAt;
      const remaining = new Date(task.deadline.replace(' ', 'T')).getTime() - now;
      const overdue = !completed && remaining < 0;
      const effectiveDue=overdue?new Date(task.submitDeadline.replace(' ','T')).getTime():now+remaining;
      const dueSoon = !completed && effectiveDue-now<=24*60*60*1000;
      const closed = homeworkClosed(task);
      const status = task.withdrawnAt?'老师已撤回':task.stoppedAt?'打卡已终止':completed ? '已完成' : closed ? '补交已结束' : overdue ? '已逾期 · 可补交' : dueSoon ? '临近截止' : count > 0 ? '部分完成' : '待完成';
      return { id: task.id, title: task.title, subject: task.subject || '综合', kindLabel: task.kind === 'checkin' ? '打卡' : '作业', deadline: overdue&&!closed?task.submitDeadline:task.deadline,deadlineLabel:overdue&&!closed?'可补交至':'正常截止', itemTypes: task.items.length > 1 ? `需完成 ${task.items.map(item => item.submitType === 'none' ? '家长确认' : SUBMIT_LABEL[item.submitType]).join('、')}` : '', progress: `${count}/${required.length} 项`, completed, closed, actionLabel: completed || closed ? '查看记录' : count > 0 ? '继续完成' : '去完成', status, statusTone: completed ? 'done' : overdue ? 'overdue' : dueSoon ? 'soon' : count > 0 ? 'partial' : 'todo', effectiveDue,remainingItems:required.length-count,partial:count>0,priority: completed ? 5 : closed ? 4 : 0 };
    });
    tasks.sort((a, b) => a.priority - b.priority || a.effectiveDue-b.effectiveDue || Number(b.partial)-Number(a.partial));
    const completedIds=tasks.filter(task=>task.completed).map(task=>task.id);
    const demoEntries=tasks.map(task=>({id:task.id,kind:task.kindLabel==='打卡'?'checkin':'homework',completed:task.completed,closed:task.closed,completedCount:Number(task.progress.split('/')[0]),endedByDeadline:task.status==='补交已结束'}));
    const keepDemo=(task:{id:string})=>!isRedundantIncompleteHomeworkDemo(demoEntries.find(entry=>entry.id===task.id)!,demoEntries);
    const pendingTasks = tasks.filter(task => !task.completed && !task.closed&&keepDemo(task)), completedTasks = tasks.filter(task => task.completed&&!isRedundantCompletedHomeworkDemo(task.id,completedIds)), endedTasks = tasks.filter(task => !task.completed && task.closed&&keepDemo(task));
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
    if (task) { this.persistPending();this.setData({ items:[],submissionPreviewOpen:false,task, mode: 'detail', pendingUpload: this.restorePending(task.id),descriptionExpanded:false,changeRows:[] as Array<{at:string;label:string;reason:string;beforeText:string;afterText:string}>, uploadState: 'idle', uploadError: '' }); this.refreshTask(); }
  },
  refreshTask() {
    const task = this.data.task && getHomeworkTask(this.data.task.id);
    if (!task) return;
    this.setData({task,changeRows:(task.changes||[]).map(c=>({at:new Date(c.at).toLocaleString('zh-CN',{hour12:false}),label:homeworkChangeLabel(c.action),reason:c.reason,beforeText:homeworkSnapshotText(c.before),afterText:homeworkSnapshotText(c.after)}))});
    const submitted = getStudentSubmissions(task.id, this.data.studentId);
    const items = task.items.map((item, index) => {
      const record = submitted.find(row => row.itemId === item.id);
      const questions = record?.questions || [], released = questions.filter(isResultReleased), progress = gradingProgress(questions, true);
      const marks = released.map(q => { const region = questionRegion(q, questions.indexOf(q), Boolean(record?.isMock)), mark = questionMark(q, true); return region ? { id: q.id, label: q.label, tone: mark.tone, mark: mark.mark, style: `left:${region.x * 100}%;top:${region.y * 100}%;width:${region.width * 100}%;height:${region.height * 100}%;` } : null; }).filter((mark): mark is NonNullable<typeof mark> => Boolean(mark));
      const worksheetId = item.id.startsWith('worksheet-submit-') ? item.id.slice('worksheet-submit-'.length) : task.id === 'worksheet-flow-grade5-v1' ? 'math-application-grade7' : '';
      const worksheet = worksheetId ? getHomeworkWorksheet(worksheetId) : undefined;
      const demoAnswerPath = item.submitType === 'photo' ? worksheet?.answeredPath || '' : '';
      const demoAnswerName = worksheet ? `${worksheet.title} · 学生已作答页` : '';
      const fileIcon = fileVisual(record?.mediaLabel || '', item.submitType);
      const hasPending=hasPendingHomeworkContent(this.readPendingMap()[task.id+':'+item.id]);
      const gradingEnabled=item.gradingEnabled!==false&&task.kind==='homework'&&['photo','file'].includes(item.submitType);
      const previous=this.data.items.find(i=>i.id===item.id),viewOriginal=previous?.version===(record?.version||1)?Boolean(previous?.viewOriginal):false;
      const originals=item.submitType==='photo'?(record?.photos?.length?record.photos.map(p=>p.path):record?.mediaPath?[record.mediaPath]:record?.isMock?[demoPhotoPath(item.id)]:[]):[];
      const displayPhotos=submissionImagePages(record,originals,viewOriginal),hasGradedImages=displayPhotos.some(p=>p.gradedPath);
      const statusLabel=homeworkItemDisplayStatus({submitted:Boolean(record),pending:hasPending,gradingEnabled,questions,gradingError:record?.gradingError,gradingComplete:submissionGradingComplete(record)});
      return {displayPhotos,hasGradedImages,viewOriginal,noGradedImage:statusLabel==='已批改'&&item.submitType==='photo'&&!hasGradedImages,statusLabel,canRetryGrading:Boolean(record&&item.submitType==='file'&&/失败|超时|异常/.test(record.gradingError||'')&&!/未接入|等待|已重试/.test(record.gradingError||'')),hasPending,photos:(record?.photos||[]).map((p,page)=>({...p,marks:marks.filter(m=>(questions.find(q=>q.id===m.id)?.pageIndex||0)===page)})),expectedPages:item.expectedPages||0,gradingEnabled:item.gradingEnabled!==false&&task.kind==='homework'&&['photo','file'].includes(item.submitType),formatHint:item.submitType==='file'?(item.gradingEnabled!==false&&task.kind==='homework'?'仅支持 PDF、Word，≤50MB；提交与批改状态分别展示。':'支持 PDF、Word、PPT、Excel、TXT，≤50MB；仅收集，不批改。'):item.submitType==='video'?'视频≤100MB且≤3分钟。':item.submitType==='audio'?'录音≤20MB且≤5分钟。':item.submitType==='photo'?'每张≤20MB。':'', id: item.id, displayIndex: String(index + 1).padStart(2, '0'), title: item.title, instruction: item.instruction, submitLabel: item.submitType === 'none' ? '家长确认' : `上传${SUBMIT_LABEL[item.submitType]}`, submitType: item.submitType, submitted: Boolean(record), graded: questions.length>0&&questions.every(isResultReleased), submittedAt: record?.submittedAt || '', late: Boolean(record?.late), version: record?.version || 1, historyOpen:Boolean(this.data.items.find(old=>old.id===item.id&&old.version===(record?.version||1))?.historyOpen), history: getSubmissionHistory(task.id, item.id, this.data.studentId).map(row => ({ version: row.version || 1, submittedAt: row.submittedAt||'时间未记录', operator: row.operatorName||'未记录' })), mediaLabel: record?.mediaLabel || '', mediaPath: record?.mediaPath || '', fileIconKind: fileIcon.kind, fileIconMark: fileIcon.mark, demoAnswerPath, demoAnswerName, gradeStatus: [homeworkPreviewNotice(record),homeworkGradingNotice(statusLabel,record?.gradingError)].filter(Boolean).join(' · '), marks, gradeLinks: released.filter(q => !marks.some(mark => mark.id === q.id)).map(q => ({ id: q.id, label: `${q.label} · ${parentGradeLabel(q)}` })) };
    });
    const required = task.items;
    const count = required.filter(item => submitted.some(row => row.itemId === item.id)).length;
    const completed = count === required.length;
    const overdue = Date.now() > new Date(task.deadline.replace(' ', 'T')).getTime();
    const submissionClosed = homeworkClosed(task);
    this.setData({ submissionMetrics:submitted.some(r=>r.questions?.length)?gradingProgress(submitted.flatMap(r=>r.questions||[])):null,hasUploadItems: items.some(item => item.submitType !== 'none'), hasVideoItems: items.some(item => item.submitType === 'video'), items, completed, submissionClosed, progressLabel: `${count}/${required.length} 项`, completedCount: count, remainingCount: required.length - count, requiredCount: required.length, progressPercent: required.length ? Math.round(count / required.length * 100) : 0, summaryStatus: completed ? '已完成' : submissionClosed ? '未完成' : '待完成', deadlineNotice: task.withdrawnAt?'老师已撤回：'+task.managementReason:task.stoppedAt?'打卡已终止：'+task.managementReason:submissionClosed ? '补交已结束，任务仅供查看。' : overdue ? '已过正常截止时间，仍可补交。' : '' });
  },
  openMarkedQuestion(event: WechatMiniprogram.BaseEvent) { const task = this.data.task, id = String(event.currentTarget.dataset.id); if (task && this.data.items.some(item => item.marks.some(mark => mark.id === id) || item.gradeLinks.some(link => link.id === id))) wx.navigateTo({ url: '/pages/homework-result/index?role=guardian&taskId=' + encodeURIComponent(task.id) + '&studentId=' + encodeURIComponent(this.data.studentId) + '&focus=' + encodeURIComponent(id) }); },
  backToList() { if(!this.leavePending())return;this.setData({ mode: 'list', task: null, pendingUpload: null, uploadState: 'idle', uploadError: '' }); this.refreshList(); },
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
  chooseSubmissionMedia(event:WechatMiniprogram.BaseEvent){
    const task=this.data.task,child=this.data.studentId,item=task?.items.find(i=>i.id===event.currentTarget.dataset.id);if(!task||!item||homeworkClosed(task)||this.data.photoSaving||this.data.uploadState==='saving')return;
    if(item.submitType==='photo')wx.showActionSheet({itemList:['手机相册 · 多页照片','微信聊天记录 · 多页照片'],success:choice=>{if(choice.tapIndex===1){wx.chooseMessageFile({count:9,type:'image',success:r=>{if(child!==this.data.studentId||this.data.task?.id!==task.id)return;const photos:PendingPhoto[]=[];for(const f of r.tempFiles){const error=homeworkFileError(f.name||'照片.jpg',f.size,'photo',false);if(error){this.setData({uploadError:f.name+'：'+error});continue;}photos.push({path:f.path,name:f.name||'聊天照片.jpg',size:f.size,saved:false});}this.addPendingPhotos(task,item.id,photos);},fail:e=>{if(!e.errMsg.includes('cancel'))this.setData({uploadError:'未能读取聊天图片，请重试。'});}});}else this.selectSubmissionMediaFromAlbum(task.id,item.id,'photo');}});
    else if(item.submitType==='video')this.selectSubmissionMediaFromAlbum(task.id,item.id,'video');
  },
  selectSubmissionMediaFromAlbum(taskId:string,itemId:string,submitType:'photo'|'video'){
    const task=this.data.task,child=this.data.studentId;if(!task||task.id!==taskId)return;
    wx.chooseMedia({count:submitType==='photo'?9:1,mediaType:[submitType==='photo'?'image':'video'],sourceType:submitType==='photo'?['album']:['album','camera'],success:r=>{
      if(child!==this.data.studentId||this.data.task?.id!==taskId)return;
      if(submitType==='photo'){const photos:PendingPhoto[]=[];for(const f of r.tempFiles){if(f.size>20*1024*1024){this.setData({uploadError:'部分图片超过 20MB，其他选择保留。'});continue;}photos.push({path:f.tempFilePath,name:'作业照片-'+(f.tempFilePath.split('/').pop()||Date.now()+'.jpg'),size:f.size,saved:false});}this.addPendingPhotos(task,itemId,photos);return;}
      const f=r.tempFiles[0];if(!f)return;if(f.size>FILE_LIMITS.video.bytes||!Number.isFinite(f.duration)||f.duration<=0||f.duration>FILE_LIMITS.video.seconds){this.setData({uploadError:'视频上限 100MB、3 分钟，须可读取时长，请剪辑或重新选择。'});return;}
      this.persistPending();this.setData({pendingUpload:{taskId,itemId,studentId:child,path:f.tempFilePath,name:'讲解视频.mp4',type:'video',expectedVersion:this.currentVersion(taskId,itemId)},uploadState:'idle',uploadError:'',versionConflict:false});this.persistPending();
    },fail:e=>{if(!e.errMsg.includes('cancel'))this.setData({uploadError:'未能读取照片或视频，请检查相册权限后重试。'});}});
  },
  chooseAudio(event: WechatMiniprogram.BaseEvent) {
    const task = this.data.task;
    const item = task?.items.find(row => row.id === event.currentTarget.dataset.id);
    if (!task || this.data.uploadState==='saving' || this.data.submissionClosed || !item || item.submitType !== 'audio') return;
    const selectedChild=this.data.studentId;
    wx.chooseMessageFile({ count: 1, type: 'file', extension: ['mp3', 'm4a', 'wav'], success: async result => {
      if(selectedChild!==this.data.studentId||this.data.task?.id!==task.id)return;
      const selected = result.tempFiles[0];
      if (!selected?.path) return;
      if ((selected.size || 0) > FILE_LIMITS.audio.bytes) { this.setData({ uploadState: 'failed', uploadError: '录音不能超过 20MB，请压缩后重新选择。' }); return; }
      try { await validateHomeworkMedia(selected.path,'audio'); } catch(error) { if(selectedChild===this.data.studentId&&this.data.task?.id===task.id)this.setData({uploadError:error instanceof Error?error.message:'无法读取录音时长，请重新选择。'});return; }
      if(selectedChild!==this.data.studentId||this.data.task?.id!==task.id)return;
      this.setData({ pendingUpload: { taskId: task.id, itemId: item.id, studentId: this.data.studentId, path: selected.path, name: selected.name || '家长提交的录音', type: 'audio',expectedVersion:this.currentVersion(task.id,item.id) }, uploadState: 'idle', uploadError: '',versionConflict:false });this.persistPending();
    }, fail: error => { if (!String(error.errMsg || '').includes('cancel')) this.setData({ uploadState: 'failed', uploadError: '未能读取录音文件，请检查文件格式或权限后重试。' }); } });
  },
  chooseSubmissionFile(event: WechatMiniprogram.BaseEvent) {
    const task = this.data.task;
    const item = task?.items.find(row => row.id === event.currentTarget.dataset.id);
    const selectedChild=this.data.studentId;
    if (!task || this.data.uploadState==='saving' || this.data.submissionClosed || item?.submitType !== 'file') return;
    wx.chooseMessageFile({ count: 1, type: 'file', extension: homeworkFileExtensions(item.gradingEnabled!==false&&task.kind==='homework'), success: result => {
      if(selectedChild!==this.data.studentId||this.data.task?.id!==task.id)return;
      const selected = result.tempFiles[0];
      if (!selected?.path) return;
      const formatError=homeworkFileError(selected.name,selected.size,'file',item.gradingEnabled!==false&&task.kind==='homework');if(formatError){this.setData({uploadState:'failed',uploadError:formatError});return;}
      try{const error=homeworkDocumentError(selected.name,new Uint8Array(wx.getFileSystemManager().readFileSync(selected.path) as ArrayBuffer));if(error){this.setData({uploadState:'failed',uploadError:error});return;}}catch{this.setData({uploadState:'failed',uploadError:'文件读取失败，请重新导出或选择。'});return;}
      if ((selected.size || 0) > FILE_LIMITS.file.bytes) { this.setData({ uploadState: 'failed', uploadError: '文件不能超过 50MB，请压缩后重新选择。' }); return; }
      this.setData({ pendingUpload: { taskId: task.id, itemId: item.id, studentId: this.data.studentId, path: selected.path, name: selected.name || '提交文件', type: 'file',expectedVersion:this.currentVersion(task.id,item.id) }, uploadState: 'idle', uploadError: '',versionConflict:false });this.persistPending();
    }, fail: error => { if (!String(error.errMsg || '').includes('cancel')) this.setData({ uploadState: 'failed', uploadError: '未能读取微信会话文件，请重新选择。' }); } });
  },
  openSubmittedFile(event: WechatMiniprogram.BaseEvent) { const filePath = String(event.currentTarget.dataset.path || ''); if (filePath) wx.openDocument({ filePath, showMenu: true,fail:()=>this.setData({uploadError:'文件暂时无法打开，请重试或联系老师。'}) }); },
  reselectPendingUpload(event:WechatMiniprogram.BaseEvent){if(this.data.uploadState==='saving'||this.data.photoSaving)return;const type=this.data.pendingUpload?.type;if(type==='file')this.chooseSubmissionFile(event);else if(type==='audio')this.chooseAudio(event);else this.chooseSubmissionMedia(event);},
  cancelUpload() { this.clearPending();this.setData({ pendingUpload: null, uploadState: 'idle', uploadError: '' });this.refreshTask(); },
  useWorksheetDemoAnswer(event: WechatMiniprogram.BaseEvent) {
    const task = this.data.task;
    const item = this.data.items.find(row => row.id === String(event.currentTarget.dataset.id));
    if (!task || this.data.submissionClosed || !item?.demoAnswerPath) return;
    this.addPendingPhotos(task,item.id,[{path:item.demoAnswerPath,name:item.demoAnswerName||'学生已作答页',saved:true}]);
  },
  confirmUpload() {
    if (this.data.photoSaving||this.data.uploadState==='saving') return;
    if(this.data.pendingUpload?.photos){this.confirmPhotoBatch();return;}
    const pending = this.data.pendingUpload;
    const task = this.data.task;
    if (!pending || !task || this.data.submissionClosed || pending.taskId !== task.id || pending.studentId !== this.data.studentId || !task.items.some(item => item.id === pending.itemId && item.submitType === pending.type)) return;
    this.savePendingUpload(pending);
  },
  async savePendingUpload(pending:PendingUpload){
    const task=this.data.task,account=getSession()?.profile.userId;if(!task||!account||pending.studentId!==this.data.studentId||pending.taskId!==task.id||this.data.pendingUpload!==pending)return;
    this.setData({uploadState:'saving',uploadError:''});
    try{
      const path=pending.savedFile||(pending.path.startsWith('/assets/')?pending.path:await new Promise<string>((resolve,reject)=>wx.getFileSystemManager().saveFile({tempFilePath:pending.path,success:r=>resolve(r.savedFilePath),fail:()=>reject(new Error('文件保存失败，当前选择已保留，请重试。'))})));
      pending.savedFile=path;
      const session=getSession(),profile=session?.profile;if(!session?.expiresAt||session.expiresAt<=Date.now()||!hasRole(profile,'guardian')||profile?.userId!==account||profile.activeStudentId!==pending.studentId||pending.studentId!==this.data.studentId||this.data.task?.id!==task.id)return;
      if(!linkedGuardianStudents(profile).some(c=>c.id===pending.studentId))throw new Error('绑定关系已变化，请重新进入。');
      submitHomeworkItem(task.id,pending.itemId,pending.studentId,{path,name:pending.name,expectedVersion:pending.expectedVersion,requestId:pending.requestId ||= 'submit-'+Date.now()+'-'+Math.random().toString(36).slice(2)},{id:profile.userId,name:profile.displayName||'家长'});
      this.clearPending();this.setData({pendingUpload:null,uploadState:'idle',uploadError:'',pendingNotice:'该项已提交，批改状态单独展示。'});this.refreshTask();wx.showToast({title:'该项已提交',icon:'success'});
    }catch(error){if(this.data.studentId===pending.studentId&&getSession()?.profile.userId===account){this.setData({uploadState:'failed',versionConflict:error instanceof Error&&/新版本/.test(error.message),uploadError:error instanceof Error?error.message:'提交失败，请稍后重试。'});this.persistPending();}}
  },
  clearUploadError(){this.setData({uploadState:'idle',uploadError:''});},
});
