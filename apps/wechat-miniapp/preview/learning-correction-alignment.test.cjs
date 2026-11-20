const assert=require('assert/strict'),fs=require('fs'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,f);
const l=require('../miniprogram/services/learningMock.ts'),c=require('../miniprogram/services/correctionLearning.ts');
const report=c.correctionSource(l.queryLearning('30d','all','all','all',true),'all'),school={role:'school',subject:'all',days:7};
for(const page of ['progress','class','activity']){
 const v=c.correctionPage(report,school,{page,classId:'c1',days:7});
 assert.equal(v.scope,'七年级(2)班 · 全科');
 if(page==='progress'||page==='activity'){assert(v.cards[1].rows.every(r=>['数学','语文','英语'].includes(r.title)));assert(!JSON.stringify(v.cards).includes('八年级(1)班'));if(page==='progress')assert(v.cards[1].rows.every(r=>r.route.classId==='c1'));}
}
const extra={...report,activities:[...report.activities,{...report.activities[0],id:'other-class-subject',classId:'c2',subject:'物理',day:0},{...report.activities[0],id:'old-subject',classId:'c1',subject:'历史',day:15}]};
assert(!c.correctionPage(extra,school,{page:'class',classId:'c1',days:7}).cards[1].rows.some(r=>['物理','历史'].includes(r.title)));
assert.deepEqual(c.correctionPage(report,school,{page:'class',classId:'c1',subject:'数学',days:7}).cards[1].rows.map(r=>r.title),['数学']);
assert.equal(c.correctionPage(report,school).cards[1].rows.length,3,'school still shows all scoped classes');
const source=c.correctionSource(l.queryLearning('30d','c1','数学','all',true),'数学'),id='c1-s01';
const a=source.answers.find(a=>a.studentId===id&&a.kind==='首次'&&!a.correct),act=source.activities.find(x=>x.id===a.activityId);
const originals=[{...a,id:'original',activityId:'a0'},{...a,id:'outside',activityId:'a2'}];
const correction={...a,id:'r0',activityId:'a1',kind:'订正',originalAttemptId:'original',correct:true,answerText:'跨期订正'};
const data={...source,activities:[{...act,id:'a0',day:2},{...act,id:'a1',day:0},{...act,id:'a2',day:0}],answers:[...originals,correction],pendingAnswers:[]};
const range=l.personalLearningRange('custom','2026-10-10','2026-10-11');
const values=v=>[v.summary.correctCount,v.summary.wrongCount,v.summary.correctedCount];
const v=c.correctionPersonalView(data,id,range);
assert.deepEqual(values(v),[0,1,1]);assert.equal(v.visible[0].students[0].status,'fixed');
assert.equal(v.visible[0].students[0].chains.length,1,'later independent error is outside original cohort');
assert.equal(v.visible[0].students[0].chains[0].latest.date,'2026-10-12');
assert.equal(v.activities.some(x=>x.id==='a1'),false,'activity remains bounded by T');
assert.equal(l.personalLearningView(data,id,range).summary.correctedCount,0,'legacy shared query remains unchanged');
const pending={...data,answers:originals,pendingAnswers:[correction]};const p=c.correctionPersonalView(pending,id,range,'corrected');
assert.deepEqual(values(p),[0,1,1]);assert.equal(p.counts.corrected,1);assert.equal(p.topics[0].corrected,1);assert.equal(p.visible[0].students[0].status,'pending');assert.equal(p.visible[0].students[0].chains[0].latest.pending,true);assert.equal(p.visible[0].students[0].chains[0].latest.correct,false);
const repeated=c.correctionPersonalView(data,id,l.personalLearningRange('7d'));assert.deepEqual(values(repeated),[0,1,1]);assert.equal(repeated.visible[0].students[0].status,'still');
const latestPending={...data,pendingAnswers:[{...correction,id:'r1'}]};assert.equal(c.correctionPersonalView(latestPending,id,range).visible[0].students[0].status,'pending');
const onlyCorrection={...data,answers:[originals[0],correction]};assert.deepEqual(values(c.correctionPersonalView(onlyCorrection,id,l.personalLearningRange('1d'))),[0,0,0]);
assert.equal(c.correctionPersonalView(data,id,l.personalLearningRange('term')).complete,false);
for(const days of [1,7,14,30]){const r=l.personalLearningRange(days+'d'),personal=c.correctionPersonalView(pending,id,r).summary;const group=c.correctionPeople(c.correctionGroups(pending,days)).find(p=>p.id===id);assert.equal(personal.wrongCount,group?.questions||0);assert.equal(personal.correctedCount,group?.submitted||0);}
let def;global.Page=x=>def=x;global.wx={getStorageSync:()=>({expiresAt:Date.now()+600000,profile:{userId:'test',displayName:'老师',roles:['teacher'],teachingAssignments:[{subject:'数学',classIds:['c1']}]}}),pageScrollTo(){},reLaunch(){}};require('../miniprogram/pages/teacher/learning/index.ts');
const native={...def,data:structuredClone(def.data),correctionTrail:[],setData(x,cb){Object.assign(this.data,x);cb?.()}};native.onShow();native.changeView({currentTarget:{dataset:{view:'subject'}}});
for(const days of [1,7,14,30]){native.correctionGo({currentTarget:{dataset:{route:{page:'student',studentId:id,days}}}});native.correctionGo({currentTarget:{dataset:{route:{page:'legacy-student',studentId:id,days}}}});assert.equal(native.data.personalRange.mode,days+'d');native.backFromDetail();assert.equal(native.data.correctionRoute.days,days);}
console.log('PASS A1/A2/A6: native period inheritance, scoped classes/subjects, cross-period and pending corrections, repeated chains, teacher-only isolation and count parity.');
