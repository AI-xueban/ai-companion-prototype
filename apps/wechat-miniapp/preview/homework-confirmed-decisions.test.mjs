import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

let now=new Date('2030-10-28T19:00:00').getTime(),readDelay=0,failWrite=false;
class Clock extends Date { constructor(...args){super(...(args.length?args:[now]));} static now(){return now;} }
const storage=new Map(),cache=new Map();
function load(name){
  if(cache.has(name))return cache.get(name);
  const exports={};cache.set(name,exports);
  vm.runInNewContext(ts.transpileModule(readFileSync(new URL(`../miniprogram/services/${name}.ts`,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports,Date:Clock,require:p=>load(p.split('/').pop()),wx:{getStorageSync:key=>{now+=readDelay;return structuredClone(storage.get(key));},setStorageSync:(key,value)=>{if(failWrite)throw Error('storage full');storage.set(key,structuredClone(value));}}});
  return exports;
}
const g=load('homeworkGrading'),native=load('homeworkMock'),roster=load('schoolDemoRoster');
const child=roster.DEMO_STUDENTS.find(s=>s.classId==='c1').id;
const due=new Date('2030-10-28T20:00:00').getTime();
const draft={title:'录音提交验收',description:'朗读课文并提交录音',kind:'homework',subject:'语文',classIds:['c1'],targetStudentIds:[child],deadline:'2030-10-28 20:00',submitDeadline:'2030-10-29 20:00',allowSupplement:true,parentVisible:false,publishedBy:'teacher-demo-001',items:[{id:'audio',title:'课文朗读',instruction:'提交录音',submitType:'audio',required:false,gradingEnabled:true}],attachments:[{id:'doc',name:'要求.pdf',type:'file',path:'/saved/要求.pdf',size:30,source:'微信',uploadState:'complete',previewState:'pending'}]};
const task=native.publishHomework(draft);
assert.equal(task.items[0].required,true,'Publishing cannot introduce elective items');
assert.equal(task.items[0].gradingEnabled,false,'Audio collection never starts automatic grading');
assert.equal(g.homeworkPublishError({...draft,attachments:[{...draft.attachments[0],previewState:'failed'}]}),'','A preview conversion failure must not block a valid original');
assert.match(g.homeworkPublishError({...draft,attachments:[{...draft.attachments[0],uploadState:'failed'}]}),/原件/);
assert.match(g.homeworkPublishError({...draft,attachments:[{...draft.attachments[0],validationError:'文件已加密'}]}),/加密/);
const file={path:'/saved/reading.mp3',name:'reading.mp3',uploadState:'complete',previewState:'pending',expectedVersion:0,requestId:'received-before-due'};
assert.equal(native.getStudentSubmissions(task.id,child).length,0,'Upload readiness alone is not a business submission');

// The mock service receives a valid request before the deadline; storage/response processing crosses it.
now=due-1;readDelay=10;
const ontime=native.submitHomeworkItem(task.id,'audio',child,file);
readDelay=0;
assert.ok(now>due);assert.equal(ontime.receivedAt,due-1);assert.equal(ontime.late,false);
assert.equal(ontime.questions.length,0);assert.equal(g.homeworkPreviewNotice(ontime),'已提交，预览生成中');
assert.equal(g.homeworkItemDisplayStatus({submitted:true,gradingEnabled:false,questions:ontime.questions}),'已提交');
assert.equal(g.homeworkTime(ontime.submittedAt),due-1000,'Display seconds while retaining exact receipt time separately');
now=due+86400001;
assert.equal(native.submitHomeworkItem(task.id,'audio',child,file).version,1,'A successful response-timeout retry recovers the same version even after closing');
assert.equal(native.getSubmissionHistory(task.id,'audio',child).length,1);

now=due;
assert.equal(g.homeworkSubmissionReceipt(task).late,false,'Exactly at the deadline is on time');
now=due+1;
const late=native.submitHomeworkItem(task.id,'audio',child,{...file,requestId:'new-late-request',expectedVersion:1,previewState:'failed'});
assert.equal(late.late,true);assert.equal(late.version,2);
assert.match(g.homeworkPreviewNotice(late),/提交已保留/);
assert.throws(()=>g.homeworkSubmissionReceipt({...task,allowSupplement:false}),/结束/);
assert.throws(()=>native.submitHomeworkItem(task.id,'audio',child,{...file,requestId:'unfinished',expectedVersion:2,uploadState:'uploading'}),/仍在上传/);
assert.equal(native.getSubmissionHistory(task.id,'audio',child).length,2);

// A failed transaction reserves no successful receipt. A subsequent request uses its new arrival time.
now=due-100;failWrite=true;
assert.throws(()=>native.submitHomeworkItem(task.id,'audio',child,{...file,requestId:'retry-failure',expectedVersion:2}));
failWrite=false;now=due+100;
const retry=native.submitHomeworkItem(task.id,'audio',child,{...file,requestId:'retry-failure',expectedVersion:2});
assert.equal(retry.late,true);assert.equal(retry.receivedAt,due+100);assert.equal(retry.version,3);

// Parent reference access follows grading of this effective item, independent of deadlines and other pupils.
const question={id:'q',label:'题目',state:'confirmed',correct:true,answer:'3',explanation:'解析',decisionSource:'ai'};
const referenceTask={deadline:'2099-01-01 20:00',answerStandards:[{questionId:'q',source:'teacher',teacherAnswer:'3',teacherExplanation:'教师解析'}]};
const record={version:2,questions:[question]};
assert.equal(g.teacherReference(referenceTask,'q',true,record).answer,'3');
assert.equal(g.teacherReference({...referenceTask,deadline:'2000-01-01 20:00'},'q',true,{questions:[{...question,state:'processing'}]}).answer,'');
assert.equal(g.teacherReference(referenceTask,'q',true,{...record,questions:[question,{...question,id:'other',state:'review'}]}).locked,true);
assert.equal(g.teacherReference(referenceTask,'q',true,{...record,gradingResult:{submissionVersion:2,complete:false,photos:[]}}).locked,true);
assert.equal(g.teacherReference(referenceTask,'q',true).locked,true);
assert.equal(g.canUseAIExplanation(question),true);assert.equal(g.canUseAIExplanation({...question,correct:false}),true);
assert.equal(question.decisionSource,'ai','An available AI result does not imply teacher review');
g.confirmManualResult(referenceTask,[record],question,true,'saved-review');
assert.equal(question.decisionSource,'teacher');assert.ok(g.isResultReleased(question));
console.log('PASS confirmed decisions: required items, audio submission without grading, receipt-time deadlines, timeout replay, failed retries, original/preview independence, grading-gated references, AI entry and teacher source.');
