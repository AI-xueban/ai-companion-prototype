import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import ts from 'typescript';

const storage=new Map(),cache=new Map();let writeFailure=false, imageFailure=true;
const wx={getStorageSync:k=>structuredClone(storage.get(k)),setStorageSync:(k,v)=>{if(writeFailure)throw Error('storage full');storage.set(k,structuredClone(v));},removeStorageSync:k=>storage.delete(k),showToast(){},showModal:o=>o.success?.({confirm:true}),pageScrollTo(){},redirectTo(){},navigateTo(){},reLaunch(){},previewImage(){},getImageInfo:o=>o.success({width:600,height:900}),getFileSystemManager:()=>({saveFile:o=>{if(o.tempFilePath.includes('fail')&&imageFailure){imageFailure=false;o.fail?.({});}else o.success({savedFilePath:'/saved/'+o.tempFilePath.split('/').pop()});}})};
function load(name){if(cache.has(name))return cache.get(name);const exports={};cache.set(name,exports);vm.runInNewContext(ts.transpileModule(readFileSync(new URL(`../miniprogram/services/${name}.ts`,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports,Error,require:p=>load(p.split('/').pop()),wx});return exports;}
const rules=load('homeworkGrading'),native=load('homeworkMock'),roster=load('schoolDemoRoster'),scope=load('workbenchScope');
const day=(days)=>{const d=new Date(Date.now()+days*86400000);return d.toISOString().slice(0,10)+' 20:00';};
const teacher={userId:'teacher-demo-001',displayName:'陈老师',roles:['teacher','school_admin'],teachingAssignments:roster.getDemoTeachingAssignments('teacher-demo-001')};
let profile=teacher,view={view:'subject',classId:'c1',period:'7d',grade:'all'};
const child=roster.DEMO_STUDENTS.find(s=>s.classId==='c1').id;
const input=(kind='homework')=>({title:'自定义多页任务',description:'总说明：第 8—9 页，须写过程。',kind,subject:'数学',classIds:['c1'],targetStudentIds:[child],deadline:day(2),submitDeadline:day(9),parentVisible:false,publishedBy:teacher.userId,items:[{id:'photo',title:'两页练习',instruction:'照片按页排序',submitType:'photo',required:true,gradingEnabled:true,expectedPages:2}]});
const event=(data={},value='')=>({currentTarget:{dataset:data},detail:{value}});
function page(name){let def;vm.runInNewContext(ts.transpileModule(readFileSync(new URL(`../miniprogram/pages/${name}/index.ts`,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports:{},Error,Page:d=>def=d,require:p=>p.endsWith('/stores/session')?{getSession:()=>({profile,expiresAt:Date.now()+3600000}),linkedGuardianStudents:()=>[{id:child,name:'孩子',className:'本班'}],selectGuardianStudent:()=>true}:p.endsWith('/permissions/access')?{hasRole:()=>true}:p.endsWith('/moduleNavigation')?{returnToHomeworkModuleHome(){}}:p.endsWith('/workbenchScope')?{...scope,workScope:()=>view}:load(p.split('/').pop()),wx,setTimeout:()=>1,clearTimeout(){}});const result={...def,data:structuredClone(def.data),setData(values){for(const [key,value] of Object.entries(values)){const keys=key.replaceAll('[','.').replaceAll(']','').split('.');let target=this.data;for(const k of keys.slice(0,-1))target=target[k];target[keys.at(-1)]=value;}}};return result;}

// Shared rules: temporal boundaries, format/container validation and management permissions.
assert.equal(rules.homeworkPublishError(input()),'');
assert.match(rules.homeworkPublishError({...input(),deadline:day(-1)}),/截止时间已过/);
assert.match(rules.homeworkFileError('book.pptx',20,'file',true),/仅支持 PDF、Word/);
assert.equal(rules.homeworkFileError('book.pptx',20,'file',false),'');
assert.match(rules.homeworkFileError('x.jpg',21*1024*1024,'photo',false),/20MB/);
assert.equal(rules.homeworkPublishError({...input(),allowSupplement:false,submitDeadline:input().deadline}),'');
assert.match(rules.homeworkPublishError({...input(),submitDeadline:input().deadline}),/开启补交/);
const bytes=t=>new Uint8Array(Buffer.from(t));
assert.equal(rules.homeworkDocumentError('a.pdf',bytes('%PDF-1.7\n%%EOF')),'');
assert.match(rules.homeworkDocumentError('a.pdf',bytes('%PDF-1.7 /Encrypt 1\n%%EOF')),/加密/);
assert.match(rules.homeworkDocumentError('a.docx',bytes('this is not word')),/损坏|格式不符/);
const task=native.publishHomework(input());assert.equal(task.title,'自定义多页任务');
let record=native.submitHomeworkItem(task.id,'photo',child,{path:'/saved/a.jpg',name:'2 张作业照片',photos:[{path:'/saved/a.jpg',name:'a.jpg'},{path:'/saved/b.jpg',name:'b.jpg'}],expectedVersion:0});
assert.equal(native.summarizeHomework(native.getHomeworkTask(task.id)).completed,1);
assert.equal(record.photos.length,2);assert.ok(record.questions.some(q=>q.pageIndex===1));
assert.throws(()=>native.submitHomeworkItem(task.id,'photo',child,{path:'/saved/c.jpg',name:'c.jpg',expectedVersion:0}),/新版本/);
const original=JSON.stringify(native.getStudentSubmissions(task.id,child));
native.manageHomework(task.id,'correct',{reason:'补充文字说明',description:'更正后的总要求',itemTexts:[{id:'photo',title:'两页练习（含过程）',instruction:'先第8页，再第9页'}]},teacher.userId,['c1'],0);
assert.equal(JSON.stringify(native.getStudentSubmissions(task.id,child)),original);
assert.throws(()=>native.manageHomework(task.id,'withdraw',{reason:'测试'},'other',['c1'],1),/权限/);
assert.throws(()=>native.manageHomework(task.id,'withdraw',{reason:'测试'},teacher.userId,['c1'],0),/任务已更新/);
native.manageHomework(task.id,'extend',{reason:'延长',deadline:day(3),submitDeadline:day(10)},teacher.userId,['c1'],1);
assert.throws(()=>native.manageHomework(task.id,'extend',{reason:'缩短',deadline:day(1),submitDeadline:day(10)},teacher.userId,['c1'],2),/只允许延长/);
native.manageHomework(task.id,'withdraw',{reason:'发错班级'},teacher.userId,['c1'],2);
assert.equal(JSON.stringify(native.getStudentSubmissions(task.id,child)),original);
assert.throws(()=>native.submitHomeworkItem(task.id,'photo',child,{path:'/saved/a.jpg',name:'a.jpg'}),/撤回/);
native.retryHomeworkNotification(task.id,teacher.userId,true);assert.equal(native.getHomeworkTask(task.id).notification.status,'failed');
native.retryHomeworkNotification(task.id,teacher.userId);assert.equal(native.getHomeworkTask(task.id).notification.status,'pending');

// Native teacher: custom title, mixed per-class recipients and time edits.
const t=page('teacher/homework');t.data.scope=view;t.data.readOnly=false;t.data.draft={...t.data.draft,...input(),titleCustomized:true,classIds:['c1','c2'],recipientModes:{c1:'all',c2:'selected'},targetStudentIds:[]};
// Draft lifecycle: another draft retains the first, storage failure cannot replace it.
const drafts=page('teacher/homework');drafts.data.scope=view;drafts.data.readOnly=false;drafts.startCompose();drafts.changeTitle(event({},'第一份草稿'));drafts.newTeacherDraft();
assert.equal(drafts.data.otherDrafts.length,1);assert.equal(drafts.data.otherDrafts[0].title,'第一份草稿');
drafts.changeTitle(event({},'第二份草稿'));drafts.resumeOtherDraft(event({id:drafts.data.otherDrafts[0].id}));assert.equal(drafts.data.draft.title,'第一份草稿');assert.equal(drafts.data.otherDrafts[0].title,'第二份草稿');
writeFailure=true;drafts.newTeacherDraft();assert.equal(drafts.data.draft.title,'第一份草稿');writeFailure=false;
drafts.deleteTeacherDraft();assert.equal(drafts.data.hasDraft,true);assert.equal(drafts.data.draftDeleteOpen,true);assert.equal(drafts.data.draftDeleteTitle,'第一份草稿');drafts.closeDraftOverlay();assert.equal(drafts.data.hasDraft,true);drafts.deleteTeacherDraft();drafts.confirmDraftDeletion();assert.equal(drafts.data.hasDraft,false);
drafts.openTeacherDrafts();assert.equal(drafts.data.draftRows.length,1);const nativeDraftId=drafts.data.draftRows[0].id;
drafts.openDraftMenu(event({id:nativeDraftId}));drafts.requestDraftDeletion();writeFailure=true;drafts.confirmDraftDeletion();assert.equal(drafts.data.draftDeleteOpen,true);assert.match(drafts.data.draftDeleteError,/仍保留/);assert.equal(drafts.data.draftRows.length,1);writeFailure=false;drafts.closeDraftOverlay();
drafts.deleteOtherDraft(event({id:nativeDraftId}));const nativeArchiveKey=[...storage.keys()].find(k=>k.endsWith(':archive')&&k.includes(teacher.userId)),nativeBank=storage.get(nativeArchiveKey);nativeBank[0].saved.updatedAt=Date.now()+1;storage.set(nativeArchiveKey,nativeBank);drafts.confirmDraftDeletion();assert.match(drafts.data.draftDeleteError,/已变化/);drafts.closeDraftOverlay();drafts.deleteOtherDraft(event({id:nativeDraftId}));drafts.confirmDraftDeletion();assert.equal(drafts.data.draftRows.length,0);
drafts.data.readOnly=true;drafts.openTeacherDrafts();drafts.deleteTeacherDraft();assert.equal(drafts.data.draftDeleteOpen,false);drafts.data.readOnly=false;
storage.set(nativeArchiveKey,'invalid');drafts.refreshOtherDrafts();assert.match(drafts.data.draftListError,/无法读取/);storage.set(nativeArchiveKey,[]);drafts.retryDraftList();assert.equal(drafts.data.draftListError,'');
drafts.data.draft.deadline=day(-1);drafts.data.hasDraft=true;drafts.data.composeStep=1;drafts.startCompose();assert.equal(drafts.data.composeStep,0);assert.equal(drafts.data.deadlineExpired,true);drafts.quickDeadline(event({days:1}));assert.ok(new Date(drafts.data.draft.deadline.replace(' ','T')).getTime()>Date.now());
// Catch unmatched native template tags and missing interaction handlers, which tsc cannot check.
for(const [name,controller] of [['teacher/homework',t],['guardian/homework',page('guardian/homework')]]){
  const template=readFileSync(new URL(`../miniprogram/pages/${name}/index.wxml`,import.meta.url),'utf8'),stack=[];
  for(const match of template.matchAll(/<(\/?)([\w-]+)((?:"[^"]*"|'[^']*'|[^'">])*)>/g)){
    const [,closing,tag,attributes]=match;if(closing)assert.equal(stack.pop(),tag,`${name}: mismatched ${tag}`);else if(!/\/\s*$/.test(attributes))stack.push(tag);
  }
  assert.equal(stack.length,0,`${name}: unclosed tags ${stack.join(',')}`);
  for(const binding of template.matchAll(/(?:bind(?:tap|change|input|blur|load|touchstart|touchend|touchcancel)|catchtap|bind:[\w-]+)="([a-zA-Z]\w*)"/g))assert.equal(typeof controller[binding[1]],'function',`${name}: missing handler ${binding[1]}`);
}
t.refreshDraft();assert.equal(t.data.draft.title,'自定义多页任务');t.previewPublish();assert.match(t.data.composeError,/至少选择一人/);
const c2=roster.DEMO_STUDENTS.find(s=>s.classId==='c2').id;t.data.draft.targetStudentIds=[c2];t.data.recognitionStale=false;t.previewPublish();assert.equal(t.data.previewTargetCount,roster.DEMO_STUDENTS.filter(s=>s.classId==='c1').length+1);assert.match(t.data.previewStudents,/部分 · 1 人/);
t.data.draft.supplementTouched=true;t.data.draft.submitDeadline=day(15);t.data.datePickerTarget='deadline';t.data.datePickerValue=day(4);t.confirmDatePicker();assert.equal(t.data.draft.submitDeadline,day(15));
t.data.previewOpen=true;t.data.draft.deadline=day(-1);t.confirmPublish();assert.equal(t.data.previewOpen,false);assert.match(t.data.composeError,/截止时间已过/);

// Native family: failed second photo is recoverable, and one atomic submission counts once.
const active=native.publishHomework(input());profile={userId:'guardian-demo-001',displayName:'家长',roles:['guardian'],activeStudentId:child};
const f=page('guardian/homework');f.data.studentId=child;f.data.task=active;f.data.mode='detail';
f.addPendingPhotos(active,'photo',[{path:'/tmp/a.jpg',name:'a.jpg',size:100,saved:false},{path:'/tmp/fail.jpg',name:'b.jpg',size:100,saved:false}]);
for(let i=0;i<12;i++)await Promise.resolve();
assert.equal(f.data.pendingUpload.photos[0].saved,true);assert.ok(f.data.pendingUpload.photos[1].error);
f.backToList();assert.equal(f.data.mode,'detail','Unsaved photo must block leaving');
f.confirmUpload();assert.match(f.data.uploadError,/失败图片/);assert.equal(native.getStudentSubmissions(active.id,child).length,0);
f.retryPendingPhoto(event({index:1}));for(let i=0;i<12;i++)await Promise.resolve();assert.equal(f.data.pendingUpload.photos[1].saved,true);const nativeSelectedBefore=JSON.stringify(f.data.pendingUpload.photos);f.addPendingPhotos(active,'photo',Array.from({length:8},(_,i)=>({path:'/tmp/overflow-'+i+'.jpg',name:'overflow-'+i+'.jpg',saved:true})));assert.equal(JSON.stringify(f.data.pendingUpload.photos),nativeSelectedBefore);assert.match(f.data.uploadError,/每项最多 9 张/);
f.movePendingPhoto(event({index:1,delta:-1}));assert.equal(f.data.pendingUpload.photos[0].name,'b.jpg');
writeFailure=true;f.backToList();assert.equal(f.data.mode,'detail','Quota failure must block leaving');writeFailure=false;
f.persistPending();f.backToList();f.openTask(event({id:active.id}));assert.equal(f.data.pendingUpload.photos.length,2);
assert.match(f.data.pendingNotice,/尚未提交/);
const anotherChild=roster.DEMO_STUDENTS.find(s=>s.id!==child).id;f.changeChild(event({id:anotherChild}));assert.equal(f.data.pendingUpload,null);assert.equal(f.restorePending(active.id),null,'Another child must not see this draft');f.changeChild(event({id:child}));f.openTask(event({id:active.id}));assert.equal(f.data.pendingUpload.photos.length,2,'Original child retains the pending photos');
f.confirmUpload();assert.equal(f.data.pendingUpload,null);assert.equal(native.getStudentSubmissions(active.id,child)[0].photos.length,2);assert.equal(f.data.completed,true);
f.appendPhotos(event({id:'photo'}));native.submitHomeworkItem(active.id,'photo',child,{path:'/saved/other.jpg',name:'other.jpg',photos:[{path:'/saved/other.jpg',name:'other.jpg'}],expectedVersion:1});f.confirmUpload();assert.match(f.data.uploadError,/新版本/);
f.resolveVersionConflict(event({mode:'merge'}));assert.equal(f.data.pendingUpload.expectedVersion,2);assert.equal(f.data.pendingUpload.photos.length,3);
f.confirmUpload();assert.equal(native.getStudentSubmissions(active.id,child)[0].version,3);

// Files: a grading service failure must preserve completion and the selected media.
const doc=native.publishHomework({...input(),items:[{...input().items[0],id:'file',submitType:'file',expectedPages:0}]});
native.submitHomeworkItem(doc.id,'file',child,{path:'/saved/a.pdf',name:'a.pdf',expectedVersion:0});
assert.equal(native.summarizeHomework(native.getHomeworkTask(doc.id)).completed,1);assert.match(native.getStudentSubmissions(doc.id,child)[0].gradingError,/提交已保留/);

// Recurring tasks: stop from phase 2 preserves phase 1 and all existing records.
profile=teacher;const series=native.publishHomework({...input('checkin'),cycleCount:3});
native.manageHomework(series.id,'stop',{reason:'课程调整',fromCycle:2},teacher.userId,['c1'],0);
const phases=native.listHomeworkTasks().filter(t=>t.seriesId===series.seriesId);assert.equal(phases.length,3);assert.equal(phases.filter(t=>t.stoppedAt).length,2);assert.equal(native.getHomeworkTask(series.id).stoppedAt,undefined);

// Browser controllers: the same recipient/time/management rules and multi-photo versions.
const webStorage=new Map();let full=false;const web={document:{body:{},addEventListener(){},querySelector:()=>null,querySelectorAll:()=>[],getElementById:()=>null},MutationObserver:class{observe(){}},setTimeout:()=>1,clearTimeout(){},window:{homeworkGrading:rules,homeworkFilters:load('homeworkFilters'),homeworkLearning:load('homeworkLearning'),homeworkTutor:load('homeworkTutor'),confirm:()=>true,prompt:()=>''},schoolDemoRoster:roster,location:{search:'?review=1'},URLSearchParams,localStorage:{getItem:k=>webStorage.get(k)||null,setItem:(k,v)=>{if(full)throw Error('quota');webStorage.set(k,v);},removeItem:k=>webStorage.delete(k)},teacherDesk(){},parentRefresh(){},alert(){},URL:{}};
let source=readFileSync(new URL('./homework-prototype.js',import.meta.url),'utf8').replace('    renderTeacher() {','    browseMediaForTest:()=>studentPhotoPages(), inspect:()=>store, draft:()=>draft, pending:()=>pendingUpload, stageSingleForTest:row=>{pendingUpload=row;uploadMessage="";}, renderTeacher() {');vm.runInNewContext(source,web);const p=web.window.homeworkPrototype;p.setScope({view:'subject',classIds:['c1','c2'],teacherId:teacher.userId});p.compose();p.setSubject('英语');p.setField('description','完成两页练习');p.applyRecognition();p.setUniformType('photo');p.setTitle('浏览器双页验收');p.setSubmitDeadline(day(14));p.setDeadline(day(4));assert.equal(p.draft().submitDeadline,day(14));p.nextCompose();p.nextCompose();p.publish();const wt=p.inspect().tasks.find(t=>t.title==='浏览器双页验收');assert.ok(wt);assert.ok(!wt.items[0].expectedPages);
p.openParent(wt.id);assert.match(p.renderParent('孩子'),/hp-inline-instructions/);p.useParentChatDemoPhoto(0); // No source sheet is open; should be a no-op.
p.fillParentDemoPhoto(wt.id,wt.items[0].id);p.useParentChatDemoPhoto(0);p.openParentPhotoSource(wt.id,wt.items[0].id);p.showParentChatPhotos(true);p.useParentChatDemoPhoto(1);assert.equal(p.pending().photos.length,2);
p.movePendingPhoto(1,-1);assert.match(p.pending().photos[0].name,/语文/);
full=true;p.confirmUpload();assert.ok(p.pending());assert.equal(p.inspect().submissions.filter(r=>r.taskId===wt.id).length,0);full=false;p.confirmUpload();assert.equal(p.pending(),null);assert.equal(p.inspect().submissions.filter(r=>r.taskId===wt.id)[0].photos.length,2);assert.match(p.renderParent('孩子'),/共 2 张/);assert.doesNotMatch(p.renderParent('孩子'),/本项已提交，共|批改状态单独显示/);
const restarted={...web,window:{...web.window}};vm.runInNewContext(source,restarted);const restored=restarted.window.homeworkPrototype;restored.openParent(wt.id);restored.renderParent('孩子');assert.equal(restored.inspect().submissions.find(r=>r.taskId===wt.id).photos.length,2);assert.ok(restored.inspect().submissions.find(r=>r.taskId===wt.id).questions.length,'Non-math multi-photo results must survive reload');
p.openTeacher(wt.id);p.openTaskManagement();p.chooseManagement('withdraw');p.setManagementField('reason','验收撤回');p.saveTaskManagement();p.saveTaskManagement();assert.ok(p.inspect().tasks.find(t=>t.id===wt.id).withdrawnAt);p.openParent(wt.id);assert.match(p.renderParent('孩子'),/老师已撤回/);assert.doesNotMatch(p.renderParent('孩子'),/onclick="homeworkPrototype.confirmUpload/);
// Browser draft navigation and quota failure mirror native behavior.
web.confirm=()=>{throw Error('Native browser confirm must not be used for draft deletion');};p.compose();p.setTitle('网页第一稿');p.newTeacherDraft();p.setTitle('网页第二稿');p.toTeacherList();assert.doesNotMatch(p.renderTeacher(),/网页第一稿|新建另一份|删除当前草稿/);assert.match(p.renderTeacher(),/发布作业或打卡/);p.openTeacherDrafts();assert.match(p.renderTeacher(),/网页第一稿/);assert.match(p.renderTeacher(),/最近编辑排序/);assert.equal(p.getTeacherNavigation().title,'我的草稿');
const archiveEntry=[...webStorage.entries()].find(([k])=>k.endsWith(':archive'));let bank=JSON.parse(archiveEntry[1]);p.resumeOtherDraft(bank[0].id);assert.equal(p.draft().title,'网页第一稿');full=true;p.newTeacherDraft();assert.equal(p.draft().title,'网页第一稿');full=false;
p.deleteTeacherDraft();assert.equal(p.draft().title,'网页第一稿');assert.match(p.renderTeacher(),/role="dialog"/);assert.match(p.renderTeacher(),/网页第一稿/);p.closeDraftOverlay();assert.equal(p.draft().title,'网页第一稿');p.deleteTeacherDraft();p.confirmDraftDeletion();assert.notEqual(p.draft().title,'网页第一稿');
bank=JSON.parse(webStorage.get(archiveEntry[0]));const webDraftId=bank[0].id,countBefore=p.getTeacherDraftCount(),tasksBefore=p.inspect().tasks.length;p.openDraftMenu(webDraftId);p.requestDraftDeletion();full=true;p.confirmDraftDeletion();assert.match(p.renderTeacher(),/删除失败，草稿仍保留/);assert.match(p.renderTeacher(),/role="dialog"/);assert.equal(p.getTeacherDraftCount(),countBefore);full=false;p.closeDraftOverlay();
p.deleteOtherDraft(webDraftId);bank[0].saved.updatedAt=Date.now()+2;webStorage.set(archiveEntry[0],JSON.stringify(bank));p.confirmDraftDeletion();assert.match(p.renderTeacher(),/已变化/);p.closeDraftOverlay();p.deleteOtherDraft(webDraftId);p.confirmDraftDeletion();assert.equal(p.getTeacherDraftCount(),countBefore-1);assert.equal(p.inspect().tasks.length,tasksBefore,'Draft deletion must preserve published tasks');
const survivingArchive=webStorage.get(archiveEntry[0]);webStorage.set(archiveEntry[0],'invalid-json');p.retryDraftList();assert.match(p.renderTeacher(),/草稿暂时无法读取/);webStorage.set(archiveEntry[0],survivingArchive);p.retryDraftList();assert.doesNotMatch(p.renderTeacher(),/草稿暂时无法读取/);
p.compose();p.setTitle('过期稿');p.setDeadline(day(-1));p.toTeacherList();p.compose();assert.match(p.renderTeacher(),/这份草稿的截止时间已过/);p.quickDeadline(1);assert.ok(new Date(p.draft().deadline.replace(' ','T')).getTime()>Date.now());
// Urgency uses the live deadline, including supplements; the list has no daily summary banner.
const fmt=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
const endToday=new Date();endToday.setHours(23,59,0,0);const tomorrow=new Date(endToday);tomorrow.setDate(tomorrow.getDate()+1);
const todayTask=native.publishHomework({...input(),title:'今日紧急',deadline:fmt(endToday),submitDeadline:fmt(endToday),allowSupplement:false});
const tomorrowTask=native.publishHomework({...input(),title:'明日部分完成',deadline:fmt(tomorrow),submitDeadline:fmt(tomorrow),allowSupplement:false,items:[...input().items,{...input().items[0],id:'another'}]});
native.submitHomeworkItem(tomorrowTask.id,'photo',child,{path:'/saved/t.jpg',name:'t.jpg',expectedVersion:0});f.refreshList();assert.ok(f.data.pendingTasks.findIndex(t=>t.id===todayTask.id)<f.data.pendingTasks.findIndex(t=>t.id===tomorrowTask.id));
const webChild=roster.DEMO_GUARDIAN_CHILD_IDS[0],webItems=[{id:'x',title:'确认一',type:'none'},{id:'y',title:'确认二',type:'none'}];
p.inspect().tasks.push({id:'today-urgent',title:'今日紧急',classIds:['c1'],targetStudentIds:[webChild],deadline:fmt(endToday),submitDeadline:fmt(endToday),items:webItems},{id:'tomorrow-partial',title:'明日部分完成',classIds:['c1'],targetStudentIds:[webChild],deadline:fmt(tomorrow),submitDeadline:fmt(tomorrow),items:webItems});
p.inspect().submissions.push({taskId:'tomorrow-partial',itemId:'x',studentId:webChild,version:1,submittedAt:new Date().toISOString()});p.toParentList();let list=p.renderParent('孩子');assert.ok(list.indexOf('今日紧急')<list.indexOf('明日部分完成'));assert.doesNotMatch(list,/今天还剩|hp-today-summary/);
p.inspect().tasks.find(t=>t.id==='today-urgent').description='完整要求\n第二行';p.openParent('today-urgent');const compact=p.renderParent('孩子');assert.match(compact,/<div class="hp-inline-instructions"><p>完整要求/);assert.match(compact,/完整要求\n第二行/);assert.doesNotMatch(compact,/hp-card hp-teacher-instructions|hp-instructions-summary|<summary>老师的要求/);p.inspect().tasks.find(t=>t.id==='today-urgent').items[0].type='photo';p.fillParentDemoPhoto('today-urgent','x');p.showParentChatPhotos(true);p.useParentChatDemoPhoto(0);assert.ok(p.pending());full=true;assert.equal(p.resetParentView(),false);assert.ok(p.pending());full=false;p.toParentList();assert.doesNotMatch(p.renderParent('孩子'),/返回原孩子|今天还剩/);p.openParent('today-urgent');p.renderParent('孩子');assert.ok(p.pending(),'Unsubmitted content is restored');
// Photo selection actions follow the current scenario: single, multiple, limit and empty.
let photoPanel=p.renderParent('孩子').match(/<div class="hp-pending hp-photo-selection hp-compact-photos">[\s\S]*?<\/div><\/section>/)?.[0]||p.renderParent('孩子');
assert.doesNotMatch(photoPanel,/>前移<|>后移<|>取消选择</);assert.match(photoPanel,/添加照片/);assert.match(photoPanel,/>提交</);assert.doesNotMatch(photoPanel,/每项最多 9 张/);
const selectedPhotos=p.pending().photos,firstPhoto={...selectedPhotos[0]};selectedPhotos.push({...firstPhoto,id:'second'});
photoPanel=p.renderParent('孩子');assert.doesNotMatch(photoPanel,/>前移<|>后移</);
while(selectedPhotos.length<9)selectedPhotos.push({...firstPhoto,id:'extra-'+selectedPhotos.length});
photoPanel=p.renderParent('孩子');assert.doesNotMatch(photoPanel,/class="hp-photo-add"/);assert.doesNotMatch(photoPanel,/class="hp-photo-add"/);const selectedBefore=JSON.stringify(selectedPhotos);p.submitFile('today-urgent','x',{files:[{name:'extra.jpg',type:'image/jpeg',size:100}],value:''});assert.equal(JSON.stringify(selectedPhotos),selectedBefore,'Over-limit selection must preserve the nine selected photos');assert.match(p.renderParent('孩子'),/每项最多 9 张，当前选择已保留/);
selectedPhotos.splice(0);photoPanel=p.renderParent('孩子');assert.match(photoPanel,/<button class="hp-primary" disabled onclick="homeworkPrototype.confirmUpload\(\)">提交/);
selectedPhotos.push(firstPhoto);
p.resetParentView();p.renderParent('另一个孩子',1);assert.equal(p.pending(),null);p.openParent('today-urgent');p.renderParent('原孩子',0);assert.ok(p.pending(),'Switching children must preserve the original child draft');
// Collection-only photos must never acquire demo grades.
p.inspect().tasks.push({id:'collect-photo-only',title:'仅收集照片',kind:'homework',subject:'英语',classIds:['c1'],targetStudentIds:[webChild],deadline:fmt(tomorrow),submitDeadline:fmt(tomorrow),items:[{id:'collect-photo',title:'阅读记录',type:'photo',gradingEnabled:false}]});p.openParent('collect-photo-only');p.renderParent('孩子');p.fillParentDemoPhoto('collect-photo-only','collect-photo');p.useParentChatDemoPhoto(0);p.confirmUpload();assert.equal(p.inspect().submissions.find(r=>r.taskId==='collect-photo-only').questions.length,0);assert.doesNotMatch(p.renderParent('孩子'),/点击题框查看单题/);
// A released question must not inherit the pending banner from other questions.
p.openParent('demo-multi-requirements-v2');p.renderParent('孩子');const partialGradeRecord=p.inspect().submissions.find(r=>r.taskId==='demo-multi-requirements-v2'&&r.studentId===webChild&&r.questions?.some(rules.isResultReleased));assert.ok(partialGradeRecord);const releasedQuestion=partialGradeRecord.questions.find(rules.isResultReleased);p.openParentQuestion(partialGradeRecord.itemId,releasedQuestion.id);assert.doesNotMatch(p.renderParent('孩子'),/<div class="hp-result-alert">等待批改/);
// Single-media actions and submission failures preserve selection and version history.
web.window.confirm=()=>{throw new Error('Single-media submission must not open a native browser confirmation');};
for(const type of ['file','video','audio']){
  const id='single-'+type,itemId=id+'-item',name=type==='file'?'练习.pdf':type==='video'?'讲解.mp4':'朗读.mp3';
  const single={id,title:'单项'+type,classIds:['c1'],targetStudentIds:[webChild],deadline:fmt(tomorrow),submitDeadline:fmt(tomorrow),items:[{id:itemId,title:type,type,gradingEnabled:type==='file'}]};
  p.inspect().tasks.push(single);p.openParent(id);p.renderParent('孩子');
  const choice={taskId:id,itemId,studentId:webChild,type,name,media:'/saved/'+name,path:'/saved/'+name,expectedVersion:0};
  p.stageSingleForTest(choice);let rendered=p.renderParent('孩子');assert.match(rendered,/hp-single-reselect/);assert.match(rendered,/提交本项/);assert.doesNotMatch(rendered,/>取消选择</);
  p.reselectPendingUpload();assert.equal(p.pending(),choice,'Cancelled reselect must keep the current selection');
  full=true;p.confirmUpload();assert.equal(p.pending(),choice);assert.equal(p.inspect().submissions.filter(r=>r.taskId===id).length,0);full=false;p.confirmUpload();assert.equal(p.pending(),null);
  rendered=p.renderParent('孩子');assert.match(rendered,/重新提交/);assert.doesNotMatch(rendered,/有问题？/);if(type==='file')assert.doesNotMatch(rendered,/>重试批改</,'Waiting for the service offers no redundant retry');
  p.stageSingleForTest({...choice,requestId:undefined,expectedVersion:0});p.confirmUpload();rendered=p.renderParent('孩子');assert.match(rendered,/使用当前文件/);assert.equal(p.inspect().submissions.filter(r=>r.taskId===id).length,1);
  p.acknowledgePendingVersion();assert.equal(p.pending().expectedVersion,1);p.confirmUpload();assert.equal(p.inspect().submissions.filter(r=>r.taskId===id).length,2);
  p.inspect().tasks.find(t=>t.id===id).withdrawnAt=new Date().toISOString();rendered=p.renderParent('孩子');assert.doesNotMatch(rendered,/class="hp-single-reselect"|class="hp-upload hp-resubmit-button"/);
}
profile={userId:'guardian-demo-001',displayName:'家长',roles:['guardian'],activeStudentId:child};
for(const type of ['file','video','audio']){
  const single=native.publishHomework({...input(),items:[{...input().items[0],id:type,submitType:type,gradingEnabled:false}]});
  const family=page('guardian/homework');family.data.studentId=child;family.data.task=single;family.data.mode='detail';family.refreshTask();
  const choice={taskId:single.id,itemId:type,studentId:child,type,name:'提交.'+(type==='file'?'pdf':type==='video'?'mp4':'mp3'),path:'/tmp/single-'+type,expectedVersion:0};family.data.pendingUpload=choice;
  const originalChooser=wx.chooseMessageFile;wx.chooseMessageFile=o=>o.fail?.({errMsg:'cancel'});const originalMediaChooser=wx.chooseMedia;wx.chooseMedia=o=>o.fail?.({errMsg:'cancel'});
  family.reselectPendingUpload(event({id:type}));assert.equal(family.data.pendingUpload,choice);wx.chooseMessageFile=originalChooser;wx.chooseMedia=originalMediaChooser;
  family.confirmUpload();for(let i=0;i<12;i++)await Promise.resolve();assert.equal(family.data.pendingUpload,null);assert.equal(native.getStudentSubmissions(single.id,child)[0].version,1);
  family.data.pendingUpload={...choice,requestId:undefined,expectedVersion:0};family.confirmUpload();for(let i=0;i<12;i++)await Promise.resolve();assert.equal(family.data.versionConflict,true);assert.ok(family.data.pendingUpload);
  family.resolveVersionConflict(event({mode:'replace'}));assert.equal(family.data.pendingUpload.expectedVersion,1);family.confirmUpload();for(let i=0;i<12;i++)await Promise.resolve();assert.equal(native.getStudentSubmissions(single.id,child)[0].version,2);
}
// Shared five-stage labels, with submission and grading remaining independent.
const stage=rules.homeworkItemDisplayStatus;
assert.equal(stage({submitted:false,pending:false,gradingEnabled:true}),'未提交');
assert.equal(stage({submitted:false,pending:true,gradingEnabled:true}),'待提交');
assert.equal(stage({submitted:true,pending:false,gradingEnabled:false}),'已提交');
assert.equal(stage({submitted:true,pending:false,gradingEnabled:true,questions:[]}),'待批改');
const readyQuestion={id:'stage-ready',label:'题目',state:'confirmed',correct:true,answer:'1'};
assert.equal(stage({submitted:true,pending:false,gradingEnabled:true,questions:[readyQuestion]}),'已批改');
assert.equal(stage({submitted:true,pending:false,gradingEnabled:true,questions:[readyQuestion,{...readyQuestion,id:'stage-queued',state:'queued'}]}),'待批改');
assert.equal(stage({submitted:true,pending:true,gradingEnabled:true,questions:[readyQuestion]}),'已批改','An unsubmitted replacement must not erase the current result');
assert.equal(rules.hasPendingHomeworkContent({photos:[],path:'/old/photo.jpg'}),false);
// Native preview passes the full item gallery and the tapped current image.
const previewPage=page('guardian/homework'),previewCalls=[],originalPreview=wx.previewImage;wx.previewImage=args=>previewCalls.push(args);
previewPage.data.items=[{id:'gallery',photos:[{path:'/a.jpg'},{path:'/b.jpg'}],mediaPath:'/a.jpg'}];
previewPage.previewPendingPhoto(event({path:'/b.jpg',itemId:'gallery',previewGroup:'submitted'}));assert.deepEqual(Array.from(previewCalls[0].urls),['/a.jpg','/b.jpg']);assert.equal(previewCalls[0].current,'/b.jpg');
previewPage.data.pendingUpload={photos:[{path:'/c.jpg'},{path:'/d.jpg'}]};previewPage.previewPendingPhoto(event({path:'/d.jpg',itemId:'gallery',previewGroup:'pending'}));assert.deepEqual(Array.from(previewCalls[1].urls),['/c.jpg','/d.jpg']);wx.previewImage=originalPreview;
// Browser page changes clamp at both ends and reset zoom/scroll for the new image.
const imageNode={style:{}},viewportNode={style:{},scrollTop:60,scrollLeft:40},counterNode={},zoomNode={},pageButtons=[{},{}];
const pagerNode={querySelector:()=>counterNode,querySelectorAll:()=>pageButtons};
const viewer={_paperPages:[{src:'a',alt:'a'},{src:'b',alt:'b'},{src:'c',alt:'c'}],_paperIndex:1,dataset:{zoom:'1'},querySelector:key=>key==='img'?imageNode:key==='output'?zoomNode:key==='.hp-paper-pager'?pagerNode:viewportNode};
p.changePaperPage(0,viewer);assert.equal(imageNode.src,'b');assert.equal(counterNode.textContent,'2 / 3');p.changePaperPage(1,viewer);assert.equal(imageNode.src,'c');assert.equal(pageButtons[1].disabled,true);p.changePaperPage(1,viewer);assert.equal(viewer._paperIndex,2);p.zoomPaper(.5,viewer);assert.equal(viewer.dataset.zoom,'1.5');p.changePaperPage(-1,viewer);assert.equal(viewer.dataset.zoom,'1');assert.equal(viewportNode.scrollLeft,0);p.changePaperPage(-1,viewer);assert.equal(pageButtons[0].disabled,true);

// Two-axis teacher browsing: stay in the current class and filtered roster;
// vertical media order stays inside a student, horizontal changes the student.
profile=teacher;
const classChildren=roster.DEMO_STUDENTS.filter(row=>row.classId==='c1').slice(0,2),otherChild=roster.DEMO_STUDENTS.find(row=>row.classId==='c2');
const galleryTask=native.publishHomework({...input(),classIds:['c1','c2'],targetStudentIds:[...classChildren.map(row=>row.id),otherChild.id],items:[{id:'gallery-photo',title:'照片页',submitType:'photo',required:true,gradingEnabled:false},{id:'gallery-video',title:'过程视频',submitType:'video',required:true,gradingEnabled:false}]});
for(const student of [...classChildren,otherChild]){
 native.submitHomeworkItem(galleryTask.id,'gallery-photo',student.id,{path:'/gallery/'+student.id+'-1.jpg',name:'两张照片',photos:[{path:'/gallery/'+student.id+'-1.jpg',name:'1.jpg'},{path:'/gallery/'+student.id+'-2.jpg',name:'2.jpg'}],expectedVersion:0});
 native.submitHomeworkItem(galleryTask.id,'gallery-video',student.id,{path:'/gallery/'+student.id+'.mp4',name:'过程视频.mp4',expectedVersion:0});
}
const galleryTeacher=page('teacher/homework');galleryTeacher.data.scope=view;galleryTeacher.data.selectedTask=galleryTask;galleryTeacher.openStudentList(event({filter:'all'}));galleryTeacher.openStudent(event({id:classChildren[0].id}));
assert.equal(galleryTeacher.data.studentBrowseCount,2);assert.equal(galleryTeacher.data.selectedStudentClassName,'七年级(2)班');galleryTeacher.moveStudent(-1);assert.equal(galleryTeacher.data.selectedStudentId,classChildren[0].id);
galleryTeacher.previewOriginal(event({item:'gallery-photo',page:1,path:'/gallery/'+classChildren[0].id+'-2.jpg'}));assert.equal(galleryTeacher.data.studentPhotoIndex,1);assert.equal(galleryTeacher.data.studentPhotoGroups.length,2);assert.equal(galleryTeacher.data.studentPhotoGroups[0].media.length,3);assert.equal(galleryTeacher.data.studentPhotoGroups[0].media[2].type,'video');assert.ok(galleryTeacher.data.studentPhotoPages.every(page=>page.studentId!==otherChild.id));
let paused=0;wx.createVideoContext=()=>({pause(){paused++;}});
galleryTeacher.changeStudentMedia({...event({group:0}),detail:{current:2}});assert.equal(galleryTeacher.data.studentPhotoPages[galleryTeacher.data.studentPhotoIndex].type,'video');galleryTeacher.changeStudentPhoto({detail:{current:1}});assert.equal(paused,1,'Changing student pauses the previous video');assert.equal(galleryTeacher.data.studentPhotoPages[galleryTeacher.data.studentPhotoIndex].studentId,classChildren[1].id);galleryTeacher.closeStudentPhoto();
galleryTeacher.moveStudent(1);assert.equal(galleryTeacher.data.selectedStudentId,classChildren[1].id);galleryTeacher.moveStudent(1);assert.equal(galleryTeacher.data.selectedStudentId,classChildren[1].id);galleryTeacher.data.scope={...view,view:'school'};galleryTeacher.previewOriginal(event({item:'gallery-photo',path:'/blocked.jpg'}));assert.equal(galleryTeacher.data.studentPhotoOpen,false);
const webGallery={id:'teacher-media-axis-test',title:'双向媒体测试',publishedBy:teacher.userId,subject:'数学',classIds:['c1','c2'],targetStudentIds:[...classChildren.map(row=>row.id),otherChild.id],deadline:day(1),submitDeadline:day(3),items:[{id:'web-photo',title:'照片页',type:'photo'},{id:'web-video',title:'过程视频',type:'video'}]};
p.inspect().tasks.push(webGallery);
for(const student of [...classChildren,otherChild]) for(const item of webGallery.items)p.inspect().submissions.push({taskId:webGallery.id,itemId:item.id,studentId:student.id,submittedAt:day(-1),media:'/gallery/'+student.id+(item.type==='photo'?'.jpg':'.mp4'),photos:item.type==='photo'?[{path:'/gallery/'+student.id+'-1.jpg'},{path:'/gallery/'+student.id+'-2.jpg'}]:undefined,questions:[]});
p.openTeacher(webGallery.id);p.openStudents('all');p.openStudent(classChildren[0].id);assert.match(p.renderTeacher(),/第 1 位 \/ 共 2 位/);assert.equal(p.getTeacherNavigation().title,classChildren[0].name);assert.match(p.renderTeacher(),/hp-student-chevron/);assert.doesNotMatch(p.renderTeacher(),/>‹ 上一位|>下一位 ›/);assert.match(p.renderTeacher(),/hp-record-overview/);assert.doesNotMatch(p.renderTeacher(),/本项提交记录|逐项提交记录|本项已提交/);let browserMedia=p.browseMediaForTest();assert.equal(browserMedia.length,6);assert.ok(browserMedia.every(page=>page.studentId!==otherChild.id));assert.equal(browserMedia[2].type,'video');p.changeStudent(1);assert.equal(p.getTeacherNavigation().title,classChildren[1].name);p.changeStudent(1);assert.equal(p.getTeacherNavigation().title,classChildren[1].name);

const galleryImage={style:{},removeAttribute(name){if(name==='src')this.src='';}},galleryViewport={style:{}},galleryCounter={},galleryButtons=[{},{}],galleryFooter={},galleryVideo={pause(){this.paused=(this.paused||0)+1;},removeAttribute(){}};
const galleryViewer={_studentGallery:true,_paperPages:browserMedia,_paperIndex:0,dataset:{zoom:'1'},querySelector:key=>key==='img'?galleryImage:key==='video'?galleryVideo:key==='.hp-paper-viewport'?galleryViewport:key==='.hp-paper-pager'?{querySelector:()=>galleryCounter,querySelectorAll:()=>galleryButtons}:key==='footer'?galleryFooter:{}};
const oldFind=web.document.getElementById;web.document.getElementById=()=>galleryViewer;
p.changePaperMedia(-1);assert.equal(galleryViewer._paperIndex,0);p.changePaperMedia(1);assert.equal(galleryViewer._paperIndex,1);p.changePaperMedia(1);assert.equal(galleryVideo.src,browserMedia[2].src);assert.equal(galleryImage.hidden,true);assert.equal(galleryImage.src,'','A video URL must never be assigned to the hidden image element');assert.equal(galleryImage.onerror,null,'Video switching must not enter image failure recovery');assert.equal(galleryFooter.hidden,true);p.changePaperMedia(1);assert.equal(galleryViewer._paperIndex,2,'Vertical movement cannot cross into another student');p.changePaperStudent(1);assert.equal(galleryViewer._paperIndex,3);assert.equal(galleryImage.hidden,false);assert.ok(galleryVideo.paused>=2);p.changePaperStudent(1);assert.equal(galleryViewer._paperIndex,3);p.changePaperStudent(-1);assert.equal(galleryViewer._paperIndex,0);web.document.getElementById=oldFind;


// Native resume entry names the question/class, restores the view filter and ignores stale/other-teacher positions.
profile=teacher;
const resumeTask=native.publishHomework({...input(),title:'查看位置验收'});native.submitHomeworkItem(resumeTask.id,'photo',child,{path:'/resume.jpg',name:'照片',expectedVersion:0});
const resumeTeacher=page('teacher/homework');resumeTeacher.data.scope=view;resumeTeacher.openTask(resumeTask.id);resumeTeacher.openItemGrades(event({id:'photo'}));assert.equal(resumeTeacher.data.resumeReviewLabel,'');
const resumeQuestion=resumeTeacher.data.summary.questionRows[0];assert.ok(resumeQuestion);resumeTeacher.openGradeQuestion(event({id:resumeQuestion.id}));resumeTeacher.filterGradeStudents(event({filter:'wrong'}));resumeTeacher.backToStats();resumeTeacher.openItemGrades(event({id:'photo'}));assert.match(resumeTeacher.data.resumeReviewLabel,/七年级/);assert.equal(resumeTeacher.data.resumeReviewQuestionId,resumeQuestion.id);resumeTeacher.resumeReview();assert.equal(resumeTeacher.data.mode,'question');assert.equal(resumeTeacher.data.gradeFilter,'wrong');
profile={...teacher,userId:'another-teacher'};resumeTeacher.refreshReviewResume();assert.equal(resumeTeacher.data.resumeReviewLabel,'');profile=teacher;resumeTeacher.data.summary={...resumeTeacher.data.summary,questionRows:[]};resumeTeacher.refreshReviewResume();assert.equal(resumeTeacher.data.resumeReviewLabel,'');


// Student records lead with media; traceability stays collapsed and only appears for multiple submissions.
galleryTeacher.data.scope=view;galleryTeacher.showStudent(classChildren[0].id);let studentRecord=galleryTeacher.data.studentItems.find(item=>item.id==='gallery-photo');assert.equal(studentRecord.historyRows.length,1);assert.equal(studentRecord.historyOpen,false);assert.ok(studentRecord.submittedTimeLabel);
native.submitHomeworkItem(galleryTask.id,'gallery-photo',classChildren[0].id,{path:'/gallery/replaced.jpg',name:'重交照片.jpg',photos:[{path:'/gallery/replaced.jpg',name:'重交照片.jpg'}],expectedVersion:1},{id:'guardian-private-id',name:'王女士'});galleryTeacher.showStudent(classChildren[0].id);studentRecord=galleryTeacher.data.studentItems.find(item=>item.id==='gallery-photo');assert.equal(studentRecord.historyRows.length,2);assert.equal(studentRecord.historyRows[0].operator,'王女士');galleryTeacher.toggleSubmissionHistory(event({id:'gallery-photo'}));assert.equal(galleryTeacher.data.studentItems.find(item=>item.id==='gallery-photo').historyOpen,true);
p.openTeacher(webGallery.id);p.openStudents('all');p.openStudent(classChildren[0].id);let recordHTML=p.renderTeacher();assert.doesNotMatch(recordHTML,/操作账号：|演示数据 · 图片为模拟样张|<small>文件：/);assert.doesNotMatch(recordHTML,/提交记录 · 1 次/);assert.match(recordHTML,/hp-submission-meta/);assert.ok(recordHTML.indexOf('hp-submission-meta')<recordHTML.indexOf('hp-paper-preview'));
const prior=p.inspect().submissions.find(record=>record.taskId===webGallery.id&&record.studentId===classChildren[0].id&&record.itemId==='web-photo');p.inspect().submissions.push({...prior,version:2,submittedBy:'guardian-private-id · 王女士',submittedAt:day(0)});recordHTML=p.renderTeacher();assert.match(recordHTML,/提交记录 · 2 次/);assert.match(recordHTML,/提交人：王女士/);assert.doesNotMatch(recordHTML,/guardian-private-id/);assert.match(recordHTML,/重新提交/);

console.log('PASS teacher gallery: class/filter scope, student boundaries, multi-photo/video order, tapped position, video pause and school media restrictions.');

console.log('PASS homework v2: native/browser drafts, delete cancellation, quota failures, expired dates, deadline urgency, leave/restore feedback, multi-photo retry, stale versions, withdrawal/history, notification retry and submitted-vs-grading state.');
export {p as homeworkUIForLayout};

// Inline correction results: actual image sources, version isolation, same rules in both roles.
const correctionRecord={version:3,gradingResult:{submissionVersion:3,photos:[{pageIndex:0,path:'/returned/graded-1.jpg'}]}};
let correctionPages=rules.submissionImagePages(correctionRecord,['/original/1.jpg','/original/2.jpg']);
assert.equal(correctionPages[0].path,'/returned/graded-1.jpg');assert.equal(correctionPages[1].path,'/original/2.jpg');
assert.equal(rules.submissionImagePages(correctionRecord,['/original/1.jpg'],true)[0].path,'/original/1.jpg');
assert.equal(rules.submissionImagePages({...correctionRecord,version:4},['/original/1.jpg'])[0].path,'/original/1.jpg','Resubmission cannot reuse old graded images');
assert.equal(stage({submitted:true,pending:false,gradingEnabled:true,questions:[],gradingComplete:true}),'已批改');
assert.equal(stage({submitted:true,pending:false,gradingEnabled:true,questions:[],gradingError:'服务超时'}),'批改失败');
assert.equal(stage({submitted:true,pending:false,gradingEnabled:true,questions:[{...readyQuestion,state:'failed'}]}),'批改失败');
const correctionNativeStore=storage.get('demo_homework_v1'),correctionNativeTask=correctionNativeStore.tasks.find(t=>t.id===galleryTask.id);
correctionNativeTask.items[0].gradingEnabled=true;
const correctionNativeRecord=correctionNativeStore.submissions.filter(r=>r.taskId===galleryTask.id&&r.itemId==='gallery-photo'&&r.studentId===child).sort((a,b)=>(b.version||1)-(a.version||1))[0];
correctionNativeRecord.gradingResult={submissionVersion:correctionNativeRecord.version||1,complete:true,photos:[{pageIndex:0,path:'/returned/native-1.jpg'}]};storage.set('demo_homework_v1',correctionNativeStore);
const correctedTeacher=page('teacher/homework');correctedTeacher.data.scope=view;correctedTeacher.data.selectedTask=native.getHomeworkTask(galleryTask.id);correctedTeacher.openStudentList(event({filter:'all'}));correctedTeacher.showStudent(child);
assert.equal(correctedTeacher.data.studentItems[0].statusLabel,'已批改');assert.equal(correctedTeacher.data.studentItems[0].displayPhotos[0].path,'/returned/native-1.jpg');
correctedTeacher.switchSubmissionImage(event({item:'gallery-photo',view:'original'}));assert.equal(correctedTeacher.data.studentItems[0].displayPhotos[0].path,correctionNativeRecord.photos[0].path);
correctedTeacher.switchSubmissionImage(event({item:'gallery-photo',view:'graded'}));correctedTeacher.previewOriginal(event({item:'gallery-photo',page:0}));correctedTeacher.toggleStudentPhotoView();assert.equal(correctedTeacher.data.studentPhotoPages[0].path,correctionNativeRecord.photos[0].path);correctedTeacher.closeStudentPhoto();
const correctedParent=page('guardian/homework');correctedParent.data.studentId=child;correctedParent.data.task=native.getHomeworkTask(galleryTask.id);correctedParent.refreshTask();assert.equal(correctedParent.data.items[0].displayPhotos[0].path,'/returned/native-1.jpg');assert.equal(correctedParent.data.items[0].statusLabel,'已批改');
correctedParent.switchSubmissionImage(event({item:'gallery-photo',view:'original'}));assert.equal(correctedParent.data.items[0].displayPhotos[0].path,correctionNativeRecord.photos[0].path);correctedParent.switchSubmissionImage(event({item:'gallery-photo',view:'graded'}));correctedParent.previewSubmissionPhoto(event({item:'gallery-photo',page:0}));correctedParent.toggleSubmissionPreview();assert.equal(correctedParent.data.submissionPreviewPages[0].path,correctionNativeRecord.photos[0].path);correctedParent.changeSubmissionPreview({detail:{current:1}});assert.equal(correctedParent.data.submissionPreviewIndex,1);correctedParent.closeSubmissionPreview();
webGallery.kind='homework';webGallery.items[0].gradingEnabled=true;prior.gradingResult={submissionVersion:1,photos:[{pageIndex:0,path:'/stale/grade.jpg'}]};
const latestCorrection=p.inspect().submissions.filter(r=>r.taskId===webGallery.id&&r.studentId===child&&r.itemId==='web-photo').at(-1);
latestCorrection.gradingResult={submissionVersion:latestCorrection.version||1,photos:[{pageIndex:0,path:'/returned/browser-1.jpg'}]};
p.openTeacher(webGallery.id);p.openStudents('all');p.openStudent(child);assert.match(p.renderTeacher(),/src="\/returned\/browser-1.jpg"/);assert.doesNotMatch(p.renderTeacher(),/stale\/grade|查看批改 ›|hp-paper-region/);
p.switchSubmissionImage('teacher','web-photo','original');assert.doesNotMatch(p.renderTeacher(),/src="\/returned\/browser-1.jpg"/);assert.equal(p.browseMediaForTest()[0].src,latestCorrection.photos[0].path);p.switchSubmissionImage('teacher','web-photo','graded');assert.equal(p.browseMediaForTest()[0].src,'/returned/browser-1.jpg');
p.openParent(webGallery.id);assert.match(p.renderParent('李涵'),/src="\/returned\/browser-1.jpg"/);p.switchSubmissionImage('parent','web-photo','original');assert.doesNotMatch(p.renderParent('李涵'),/src="\/returned\/browser-1.jpg"/);
console.log('PASS inline correction: native/browser status, default result, original switch, partial/missing result, version isolation and role agreement.');

// Demo curation changes only the completed-list presentation, never stored business history.
assert.equal(roster.isRedundantCompletedHomeworkDemo('guardian-demo-status-v1-completed-english'),true);
assert.equal(roster.isRedundantCompletedHomeworkDemo('grading-demo-v1',[]),false,'Keep the only photo grading example on native baseline');
assert.equal(roster.isRedundantCompletedHomeworkDemo('grading-demo-v1',['homework-console-v1']),true);
assert.equal(roster.isRedundantCompletedHomeworkDemo('task-user-created',['homework-console-v1']),false);
const beforeCuration=JSON.stringify(storage.get('demo_homework_v1'));
const curatedParent=page('guardian/homework');curatedParent.data.studentId=child;curatedParent.refreshList();
assert.ok(curatedParent.data.completedTasks.every(t=>!roster.isRedundantCompletedHomeworkDemo(t.id,curatedParent.data.tasks.filter(r=>r.completed).map(r=>r.id))));
assert.equal(JSON.stringify(storage.get('demo_homework_v1')),beforeCuration,'Curation does not delete or edit task/submission records');
console.log('PASS completed demo curation: exact built-in IDs, representative fallback, custom tasks and persistent records preserved.');

// Pending/ended demo curation preserves distinct states and the only remaining example.
const incompleteDemo=(id,kind='homework',closed=false,count=0,expired=false)=>({id,kind,completed:false,closed,completedCount:count,endedByDeadline:expired});
const pendingSeed=incompleteDemo('guardian-demo-status-v1-pending-read','checkin');
assert.equal(roster.isRedundantIncompleteHomeworkDemo(pendingSeed,[pendingSeed]),false);
assert.equal(roster.isRedundantIncompleteHomeworkDemo(pendingSeed,[pendingSeed,incompleteDemo('custom-checkin','checkin')]),true);
assert.equal(roster.isRedundantIncompleteHomeworkDemo(pendingSeed,[pendingSeed,incompleteDemo('partial-checkin','checkin',false,1)]),false,'Partial completion is a different scenario');
const endedSeed=incompleteDemo('guardian-demo-status-v1-ended-math','homework',true,0,true);
assert.equal(roster.isRedundantIncompleteHomeworkDemo(endedSeed,[endedSeed,incompleteDemo('custom-withdrawn','homework',true,0,false)]),false,'Withdrawal must not substitute for deadline expiry');
assert.equal(roster.isRedundantIncompleteHomeworkDemo(endedSeed,[endedSeed,incompleteDemo('demo-math','homework',true,0,true)]),true);
assert.equal(roster.isRedundantIncompleteHomeworkDemo(incompleteDemo('task-user-created'),[pendingSeed]),false);
for(const base of ['demo-read','task-demo-2']){const cycle=incompleteDemo(base+'-cycle-2','checkin',true,0,true);assert.equal(roster.isRedundantIncompleteHomeworkDemo(cycle,[cycle,incompleteDemo(base,'checkin',true,0,true)]),true);assert.equal(roster.isRedundantIncompleteHomeworkDemo(cycle,[cycle]),false);}
const incompleteBefore=JSON.stringify(storage.get('demo_homework_v1'));curatedParent.refreshList();assert.equal(JSON.stringify(storage.get('demo_homework_v1')),incompleteBefore);
assert.ok(curatedParent.data.pendingTasks.every(t=>!t.completed&&!t.closed));assert.ok(curatedParent.data.endedTasks.every(t=>!t.completed&&t.closed));
console.log('PASS pending/ended curation: only built-ins, unique/partial/withdrawn scenarios and stored records preserved.');

// Alignment regression: result completeness is not inferred from available pictures.
assert.equal(stage({submitted:true,pending:false,gradingEnabled:true,questions:[]}), '待批改');
assert.equal(stage({submitted:true,pending:false,gradingEnabled:true,questions:[readyQuestion],gradingComplete:false}), '待批改');
assert.equal(stage({submitted:true,pending:false,gradingEnabled:true,questions:[{...readyQuestion,state:'queued'}],gradingComplete:true}), '待批改');
assert.equal(rules.submissionGradingComplete({version:2,gradingResult:{submissionVersion:1,complete:true,photos:[]}}),undefined);
for(const complete of [undefined,false,true]){
 const store=storage.get('demo_homework_v1'),record=store.submissions.filter(r=>r.taskId===galleryTask.id&&r.itemId==='gallery-photo'&&r.studentId===child).sort((a,b)=>(b.version||1)-(a.version||1))[0];
 record.questions=[];record.gradingResult={submissionVersion:record.version||1,complete,photos:[{pageIndex:0,path:'/partial-native.jpg'}]};storage.set('demo_homework_v1',store);
 correctedTeacher.showStudent(child);correctedParent.refreshTask();
 assert.equal(correctedTeacher.data.studentItems[0].statusLabel,complete===true?'已批改':'待批改');
 assert.equal(correctedParent.data.items[0].statusLabel,complete===true?'已批改':'待批改');
 latestCorrection.questions=[];latestCorrection.gradingResult={submissionVersion:latestCorrection.version||1,complete,photos:[{pageIndex:0,path:'/partial-web.jpg'}]};
 p.openTeacher(webGallery.id);p.openStudents('all');p.openStudent(child);
 assert.equal(p.renderTeacher().match(/hp-record-state[^>]*>([^<]+)/)[1],complete===true?'已批改':'待批改');
 p.openParent(webGallery.id);assert.match(p.renderParent('李涵'),new RegExp('>'+ (complete===true?'已批改':'待批改')+'<'));
}
// The history disclosure has the same collapsed default and no internal account IDs.
const parentHistory=p.renderParent('李涵');assert.match(parentHistory,/<details class="hp-submission-history">/);assert.doesNotMatch(parentHistory,/<details class="hp-submission-history" open/);
assert.match(parentHistory,/提交人：/);assert.doesNotMatch(parentHistory,/提交人：guardian-/);
const historyItem=correctedParent.data.items.find(i=>i.history.length>1);assert.ok(historyItem);assert.equal(historyItem.historyOpen,false);
const beforeHistory=JSON.stringify(native.getStudentSubmissions(galleryTask.id,child));
correctedParent.toggleSubmissionHistory(event({id:historyItem.id}));assert.equal(correctedParent.data.items.find(i=>i.id===historyItem.id).historyOpen,true);
correctedParent.toggleSubmissionHistory(event({id:historyItem.id}));assert.equal(JSON.stringify(native.getStudentSubmissions(galleryTask.id,child)),beforeHistory);
const guardianTemplate=readFileSync(new URL('../miniprogram/pages/guardian/homework/index.wxml',import.meta.url),'utf8');
assert.doesNotMatch(guardianTemplate,/异常演示|parent-hw-demo-toolbar|parent-hw-demo-mask/);assert.match(guardianTemplate,/item.history.length > 1/);assert.match(guardianTemplate,/binderror="submissionPreviewError"/);
// Both roles fall back once, then show a terminal original-image error; no grading facts change.
correctedParent.switchSubmissionImage(event({item:'gallery-photo',view:'graded'}));correctedParent.previewSubmissionPhoto(event({item:'gallery-photo',page:0}));
const parentStage=correctedParent.data.items[0].statusLabel;
correctedParent.submissionPreviewError(event({page:0}));assert.equal(correctedParent.data.submissionPreviewPages[0].showOriginal,true);assert.match(correctedParent.data.submissionPreviewPages[0].imageError,/已显示原图/);
correctedParent.submissionPreviewError(event({page:0}));assert.equal(correctedParent.data.submissionPreviewPages[0].path,'');assert.match(correctedParent.data.submissionPreviewPages[0].imageError,/原图加载失败/);assert.equal(correctedParent.data.items[0].statusLabel,parentStage);
correctedTeacher.previewOriginal(event({item:'gallery-photo',page:0}));const groupIndex=correctedTeacher.data.studentPhotoGroupIndex,mediaIndex=correctedTeacher.data.studentPhotoGroups[groupIndex].current;
correctedTeacher.studentPreviewError(event({group:groupIndex,media:mediaIndex}));assert.match(correctedTeacher.data.studentPhotoPages[correctedTeacher.data.studentPhotoIndex].imageError,/已显示原图/);
correctedTeacher.studentPreviewError(event({group:groupIndex,media:mediaIndex}));assert.equal(correctedTeacher.data.studentPhotoPages[correctedTeacher.data.studentPhotoIndex].path,'');assert.equal(correctedTeacher.data.studentPhotoGroups[groupIndex].media[mediaIndex].path,'');
imageNode.removeAttribute=()=>{delete imageNode.src;};viewer._paperPages=[{src:'/graded.jpg',originalPath:'/original.jpg',gradedPath:'/graded.jpg',showOriginal:false}];viewer._paperIndex=0;p.changePaperPage(0,viewer);imageNode.onerror();assert.equal(imageNode.src,'/original.jpg');imageNode.onerror();assert.equal(imageNode.hidden,true);assert.match(viewer._paperPages[0].imageError,/原图加载失败/);
console.log('PASS alignment: browser/native partial versus complete states, stale versions, collapsed history, demo removal, two-stage image failure and unchanged grading facts.');

// Re-audit combinations: change view/fallback, move away, then return to the same media.
correctedTeacher.showStudent(child);correctedTeacher.previewOriginal(event({item:'gallery-photo',page:0}));
const returnGroup=correctedTeacher.data.studentPhotoGroupIndex;
correctedTeacher.toggleStudentPhotoView();
correctedTeacher.changeStudentMedia({currentTarget:{dataset:{group:returnGroup}},detail:{current:1}});
correctedTeacher.changeStudentMedia({currentTarget:{dataset:{group:returnGroup}},detail:{current:0}});
assert.ok(correctedTeacher.data.studentPhotoIndex>=0,'Returning to a copied gallery media must keep a valid flat index');
assert.equal(correctedTeacher.data.studentPhotoPages[correctedTeacher.data.studentPhotoIndex].page,0);
correctedTeacher.toggleStudentPhotoView();assert.equal(correctedTeacher.data.studentPhotoGroups[returnGroup].media[0].showOriginal,false);
correctedTeacher.studentPreviewError(event({group:returnGroup,media:0}));
correctedTeacher.changeStudentMedia({currentTarget:{dataset:{group:returnGroup}},detail:{current:1}});
correctedTeacher.changeStudentMedia({currentTarget:{dataset:{group:returnGroup}},detail:{current:0}});
assert.ok(correctedTeacher.data.studentPhotoIndex>=0);assert.match(correctedTeacher.data.studentPhotoPages[correctedTeacher.data.studentPhotoIndex].imageError,/已显示原图/);
correctedTeacher.toggleStudentPhotoView();assert.equal(correctedTeacher.data.studentPhotoGroups[returnGroup].media[0].showOriginal,false);
// Badge and supporting copy agree even when every returned question is final but the item is incomplete.
const copyStore=storage.get('demo_homework_v1'),copyRow=copyStore.submissions.filter(r=>r.taskId===galleryTask.id&&r.itemId==='gallery-photo'&&r.studentId===child).sort((a,b)=>(b.version||1)-(a.version||1))[0];
copyRow.questions=[readyQuestion];copyRow.gradingResult={submissionVersion:copyRow.version||1,complete:false,photos:[]};storage.set('demo_homework_v1',copyStore);correctedParent.refreshTask();
assert.equal(correctedParent.data.items[0].statusLabel,'待批改');assert.doesNotMatch(correctedParent.data.items[0].gradeStatus,/已批改/);assert.match(correctedParent.data.items[0].gradeStatus,/尚未全部完成/);
webGallery.items.push({id:'audit-file',title:'AUDIT FILE',type:'file',gradingEnabled:true,required:true});
const copyFile={taskId:webGallery.id,studentId:child,itemId:'audit-file',version:1,questions:[],media:'/audit.pdf',label:'audit.pdf',submittedAt:'2026-10-27 12:00',gradingResult:{submissionVersion:1,complete:true,photos:[]}};p.inspect().submissions.push(copyFile);p.openParent(webGallery.id);
const copyHtml=p.renderParent('李涵'),copyCard=copyHtml.slice(copyHtml.indexOf('AUDIT FILE'),copyHtml.indexOf('</section>',copyHtml.indexOf('AUDIT FILE')));
assert.match(copyCard,/已批改/);assert.doesNotMatch(copyCard,/等待|尚未全部完成|文档等待转页/);
copyFile.gradingResult.complete=false;assert.match(p.renderParent('李涵'),/已提交，批改结果尚未全部完成/);
assert.equal(rules.homeworkGradingNotice('已提交','等待批改'),'','Unneeded grading must not show a processing notice');
// A view toggle preserves zoom and scroll, including after async image layout; media changes reset them.
viewer._paperPages=[{src:'/graded-a.jpg',originalPath:'/original-a.jpg',gradedPath:'/graded-a.jpg',showOriginal:false},{src:'/original-b.jpg',originalPath:'/original-b.jpg',showOriginal:true}];viewer._paperIndex=0;
p.changePaperPage(0,viewer);p.zoomPaper(.5,viewer);viewportNode.scrollTop=125;viewportNode.scrollLeft=36;
p.togglePaperImage(viewer);assert.equal(viewer.dataset.zoom,'1.5');assert.equal(viewportNode.scrollTop,125);assert.equal(viewportNode.scrollLeft,36);assert.equal(imageNode.src,'/original-a.jpg');
const pendingRestore=imageNode.onload;viewportNode.scrollTop=0;viewportNode.scrollLeft=0;pendingRestore();assert.equal(viewportNode.scrollTop,125);assert.equal(viewportNode.scrollLeft,36);
p.togglePaperImage(viewer);assert.equal(viewer.dataset.zoom,'1.5');assert.equal(viewportNode.scrollTop,125);assert.equal(imageNode.src,'/graded-a.jpg');
p.changePaperPage(1,viewer);assert.equal(viewer.dataset.zoom,'1');assert.equal(viewportNode.scrollTop,0);pendingRestore();assert.equal(viewportNode.scrollTop,0,'A delayed old image load must not restore scroll on another media');
console.log('PASS re-audit: gallery identity after view/failure changes, aligned grading copy, complete file results, zoom/scroll retention and stale-load isolation.');

// Question-result entry must initialize its own roster and preserve the originating filter on return.
profile=teacher;view={view:'subject',classId:'c1',period:'7d',grade:'all'};
for(const filter of ['all','correct','wrong','pending']){
 const route=page('teacher/homework');route.data.scope=view;route.openTask('grading-demo-v1');let found=false;
 for(const q of route.data.summary.questionRows){route.openGradeQuestion(event({id:q.id}));route.filterGradeStudents(event({filter}));if(route.data.gradeStudents.length<2)continue;
  const ids=route.data.gradeStudents.map(row=>row.id),first=ids[0];route.data.studentRows=[{id:'stale-other-task'}];route.data.browseItemId='stale-other-item';
  route.openWholeGrade(event({id:first}));assert.equal(route.data.mode,'student');assert.equal(route.data.browseItemId,'');assert.equal(route.data.studentBrowseIndex,0);assert.ok(route.data.studentBrowseCount>=2);
  const allowed=route.studentBrowseRows().map(row=>row.id);assert.ok(allowed.every(id=>ids.includes(id)));route.moveStudent(1);assert.equal(route.data.selectedStudentId,allowed[1]);assert.equal(route.data.studentBrowseIndex,1);
  route.previewOriginal(event({item:route.data.studentItems.find(i=>i.isPhoto).id,page:0}));assert.ok(route.data.studentPhotoGroups.every(group=>allowed.includes(group.studentId)));route.closeStudentPhoto();
  route.backToStudents();assert.equal(route.data.mode,'question');assert.equal(route.data.gradeFilter,filter);assert.deepEqual(Array.from(route.data.gradeStudents.map(row=>row.id)),Array.from(ids));found=true;break;
 }assert.ok(found,'A representative native question is required for '+filter);
}
// Browser follows the same filtered question roster; normal task rosters still reset the context.
const webQuestionIds=[...new Set(p.inspect().submissions.filter(r=>r.taskId==='grading-demo-v1').flatMap(r=>r.questions||[]).map(q=>q.id))];
for(const filter of ['all','correct','wrong','pending']){let found=false;
 for(const q of webQuestionIds){p.openTeacher('grading-demo-v1');p.openGradeQuestion(q);p.filterGradeStudents(filter);const html=p.renderTeacher(),ids=Array.from(html.matchAll(/openGradedStudent\((?:'|&quot;)([^'&]+)/g),m=>m[1]);if(ids.length<2)continue;
  p.openGradedStudent(ids[0]);assert.equal(p.getTeacherMode(),'student');assert.match(p.renderTeacher(),/第 1 位 \/ 共 [1-9]\d* 位/);assert.ok(p.browseMediaForTest().every(media=>ids.includes(media.studentId)));
  p.changeStudent(1);assert.match(p.renderTeacher(),/第 2 位/);p.backToStudents();assert.equal(p.getTeacherMode(),'question');assert.equal(p.renderTeacher(),html);found=true;break;
 }assert.ok(found,'A representative browser question is required for '+filter);
}
// Photo failure details agree, while only file failures expose the existing retry capability.
const photoError='批改服务处理失败，请稍后重试。';latestCorrection.gradingError=photoError;p.openParent(webGallery.id);let failureHtml=p.renderParent('李涵');assert.match(failureHtml,/批改失败/);assert.ok(failureHtml.includes(photoError));
const photoCard=failureHtml.slice(failureHtml.indexOf('web-photo'),failureHtml.indexOf('</section>',failureHtml.indexOf('web-photo')));assert.doesNotMatch(photoCard,/重试批改/);
const failureStore=storage.get('demo_homework_v1'),failureRow=failureStore.submissions.filter(r=>r.taskId===galleryTask.id&&r.itemId==='gallery-photo'&&r.studentId===child).sort((a,b)=>(b.version||1)-(a.version||1))[0];failureRow.gradingError=photoError;storage.set('demo_homework_v1',failureStore);correctedParent.refreshTask();assert.equal(correctedParent.data.items[0].gradeStatus,photoError);assert.equal(correctedParent.data.items[0].statusLabel,'批改失败');assert.equal(correctedParent.data.items[0].canRetryGrading,false);
latestCorrection.gradingError='';latestCorrection.gradingResult.complete=false;p.openParent(webGallery.id);assert.ok(p.renderParent('李涵').includes(rules.homeworkGradingNotice('待批改')));
console.log('PASS question entry: all/correct/wrong/pending scope, stale-roster isolation, student/media switching, return-to-question, and matching photo failure details without fake retry.');

// Confirmed decisions: actual teacher controller accepts audio in both type-setting modes.
profile=teacher;view={view:'subject',classId:'c1',period:'7d',grade:'all'};
const audioTeacher=page('teacher/homework');audioTeacher.data.scope=view;audioTeacher.data.readOnly=false;
audioTeacher.data.draft={...audioTeacher.data.draft,...input(),title:'原生录音发布验收',titleCustomized:true,recipientModes:{c1:'all'},attachments:[{id:'ready-document',name:'要求.pdf',path:'/saved/要求.pdf',type:'file',size:10,source:'微信',uploadState:'complete',previewState:'pending'}]};
audioTeacher.selectUniformType(event({type:'audio'}));assert.equal(audioTeacher.data.draft.items[0].submitType,'audio');assert.equal(audioTeacher.data.draft.items[0].gradingEnabled,false);
audioTeacher.selectItemType(event({index:0,type:'photo'}));audioTeacher.data.draft.items[0].gradingEnabled=true;audioTeacher.selectItemType(event({index:0,type:'audio'}));assert.equal(audioTeacher.data.draft.items[0].gradingEnabled,false);
audioTeacher.previewPublish();assert.equal(audioTeacher.data.previewOpen,true);assert.doesNotMatch(audioTeacher.data.previewItems[0].type,/自动批改/);audioTeacher.confirmPublish();assert.equal(audioTeacher.data.mode,'success');
const audioNative=native.listHomeworkTasks().find(task=>task.title==='原生录音发布验收');assert.equal(audioNative.items[0].submitType,'audio');assert.equal(audioNative.attachments[0].previewState,'pending');
p.setScope({view:'subject',classIds:['c1','c2'],teacherId:teacher.userId});p.compose();p.setField('description','朗读课文并提交录音');p.applyRecognition();p.setUniformType('audio');p.setTitle('浏览器录音发布验收');p.quickDeadline(2);p.nextCompose();p.nextCompose();p.publish();const audioWeb=p.inspect().tasks.find(task=>task.title==='浏览器录音发布验收');assert.equal(audioWeb.items[0].type,'audio');assert.equal(audioWeb.items[0].gradingEnabled,false);assert.equal(audioWeb.items[0].required,true);
console.log('PASS confirmed audio controllers: browser/native teacher publishing, uniform/per-item choices, no grading, all-required and READY-original/pending-preview publish.');

// Preview-only gallery states are isolated from business submission and persistent storage.
const filePreviewTask={...audioWeb,id:'preview-state-isolation',title:'文档预览隔离验收',attachments:[{id:'preview-file',name:'要求.pdf',type:'file',path:'/assets/homework-demo-files/campus-intro.pdf',size:1024,uploadState:'complete',previewState:'pending'}],items:[{id:'document',title:'提交文档',type:'file',required:true,gradingEnabled:false}]};
p.inspect().tasks.push(filePreviewTask);p.openParent(filePreviewTask.id);p.renderParent('孩子');
// Use the current guardian's identity from the existing browser fixture.
p.inspect().submissions.push({taskId:filePreviewTask.id,itemId:'document',studentId:webChild,label:'作业.pdf',media:'/assets/homework-demo-files/campus-intro.pdf',submittedAt:'2026-10-28 10:00',version:1,questions:[],uploadState:'complete',previewState:'pending'});
const previewStorageBefore=JSON.stringify([...webStorage.entries()]);
for(const [state,copy] of [['pending','已提交，预览生成中'],['failed','预览生成失败，提交已保留'],['ready','查看文件']]){
 p.applyPageDemo('upload-preview-'+state,'parent');const html=p.renderParent('孩子');assert.ok(html.includes(copy),state);assert.match(html,/已提交/);assert.doesNotMatch(html,/批改失败|原件上传失败/);assert.equal(p.inspect().tasks.find(task=>task.id===filePreviewTask.id).attachments[0].previewState,state);
 assert.equal(p.inspect().submissions.find(r=>r.taskId===filePreviewTask.id).version,1);assert.equal(JSON.stringify([...webStorage.entries()]),previewStorageBefore);
}
p.restorePageDemo('parent');assert.equal(p.inspect().tasks.find(task=>task.id===filePreviewTask.id).attachments[0].previewState,'pending');assert.equal(p.inspect().submissions.find(r=>r.taskId===filePreviewTask.id).previewState,'pending');
console.log('PASS preview-state gallery: pending/failed/ready UI, submission preservation, no persistence and restore.');

// Completion estimates are current-version service data, not QPS arithmetic or per-question seeds.
const waitNow=Date.now(),unknownWait='正在排队批改，完成时间暂无法估算';
const waitingRecord={taskId:'t',itemId:'i',studentId:'s',version:1,questions:[{state:'queued',estimatedMinutes:2}]};
const estimate=(record,min=3,max=5)=>({taskId:record.taskId,itemId:record.itemId,studentId:record.studentId,submissionVersion:record.version||1,minMinutes:min,maxMinutes:max,expiresAt:new Date(waitNow+60000).toISOString()});
assert.equal(rules.gradingWaitNotice([waitingRecord],waitNow),unknownWait,'Old 2-minute question seeds cannot promise completion');
const reliable={...waitingRecord,gradingWaitEstimate:estimate(waitingRecord)};
assert.equal(rules.gradingWaitNotice([reliable],waitNow),'批改预计还需3—5分钟完成');
assert.equal(rules.gradingWaitNotice([{...reliable,gradingWaitEstimate:estimate(reliable,10,15)}],waitNow),'批改预计还需10—15分钟完成');
for(const invalid of [{...reliable,version:2},{...reliable,studentId:'another'},{...reliable,itemId:'other'},{...reliable,gradingWaitEstimate:{...estimate(reliable),minMinutes:0}},{...reliable,gradingWaitEstimate:{...estimate(reliable),minMinutes:10,maxMinutes:3}},{...reliable,gradingWaitEstimate:{...estimate(reliable),expiresAt:new Date(waitNow-1).toISOString()}}])assert.equal(rules.gradingWaitNotice([invalid],waitNow),unknownWait);
assert.equal(rules.gradingWaitNotice([reliable,{...waitingRecord,studentId:'unknown'}],waitNow),unknownWait,'Unknown remaining work cannot be hidden by a known estimate');
for(const state of ['confirmed','review','unreadable','no-answer','failed'])assert.equal(rules.gradingWaitNotice([{...reliable,questions:[{state}]}],waitNow),'','No wait hint after automatic processing stops');
assert.equal(rules.gradingWaitNotice([{...reliable,questions:[],gradingQueueState:'processing'}],waitNow),'批改预计还需3—5分钟完成','Queue receipt can precede question extraction');
assert.equal(rules.gradingWaitNotice([{...reliable,questions:[],gradingQueueState:'processing',gradingError:'批改处理失败'}],waitNow),'');
assert.equal(rules.gradingWaitNotice([{...reliable,questions:[],gradingQueueState:'processing',gradingResult:{submissionVersion:1,complete:true,photos:[]}}],waitNow),'');

profile=teacher;view={view:'subject',classId:'c1',period:'7d',grade:'all'};
const etaTask=native.publishHomework(input());native.submitHomeworkItem(etaTask.id,'photo',child,{path:'/saved/eta.jpg',name:'等待时间验收'});
const etaPage=page('teacher/homework');etaPage.data.scope=view;etaPage.data.readOnly=false;
for(const [min,max,copy] of [[3,5,'批改预计还需3—5分钟完成'],[10,15,'批改预计还需10—15分钟完成'],[null,null,unknownWait]]){
  const stored=storage.get('demo_homework_v1'),record=stored.submissions.find(r=>r.taskId===etaTask.id&&r.studentId===child);
  record.questions.forEach(q=>{q.state='queued';});record.gradingWaitEstimate=min?estimate(record,min,max):undefined;
  etaPage.openTask(etaTask.id);assert.equal(etaPage.data.gradingWaitText,copy,'Native task overview');
  etaPage.showStudent(child);assert.equal(etaPage.data.studentItems[0].gradingWaitText,copy,'Native student submission');
}
const completedEta=storage.get('demo_homework_v1').submissions.find(r=>r.taskId===etaTask.id&&r.studentId===child);completedEta.questions.forEach(q=>{q.state='confirmed';delete q.reviewReason;});
etaPage.openTask(etaTask.id);assert.equal(etaPage.data.gradingWaitText,'');etaPage.showStudent(child);assert.equal(etaPage.data.studentItems[0].gradingWaitText,'');
console.log('PASS grading wait: three states, task/student bindings, version/expiry guards, unknown aggregation, completion hiding and native/browser shared rules.');
