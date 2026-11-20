const assert=require('assert/strict'),fs=require('fs'),ts=require('typescript');
require.extensions['.ts']=(m,f)=>m._compile(ts.transpileModule(fs.readFileSync(f,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,f);
const l=require('../miniprogram/services/learningMock.ts'),c=require('../miniprogram/services/correctionLearning.ts');
const report=c.correctionSource(l.queryLearning('30d','all','all','all',true),'all');
const ctx={role:'subject',subject:'数学',days:7},school={role:'school',subject:'all',days:7},home={role:'homeroom',subject:'all',days:7};
const page=(r,context=ctx,data=report)=>c.correctionPage(data,context,r);
const single=page({page:'progress',classId:'c1',filter:'none'},school);
assert.equal(single.cards[1].title,'按学科查看');
for(const row of single.cards[1].rows){assert.equal(row.route.classId,'c1');assert.equal(row.route.filter,'none');const detail=page(row.route,school);assert.equal(detail.cards[1].title,'当前学科');assert(!JSON.stringify(detail).includes('李涵'));}
const roster=page({page:'roster',classId:'c1'},home);assert.equal(roster.cards[1].rows.length,30);
const withoutLast={...report,answers:report.answers.filter(a=>a.studentId!=='c1-s30'),pendingAnswers:(report.pendingAnswers||[]).filter(a=>a.studentId!=='c1-s30')};
const empty=page({page:'roster',classId:'c1',filter:'empty'},home,withoutLast);assert(empty.cards[1].rows.some(r=>r.route.studentId==='c1-s30'));assert(empty.cards[1].rows.every(r=>r.detail==='本期暂无作答'));assert.equal(page({page:'roster',classId:'c1'},home,withoutLast).cards[1].rows.length,30);
assert.equal(page({page:'roster',classId:'c1',search:'李涵'},home).cards[1].rows.length,1);
assert.deepEqual(c.correctionWeek(),{start:'2026-10-05',end:'2026-10-11'});
const week=page({page:'week',classId:'c1'},home);assert.equal(week.date,'2026-10-05 至 2026-10-11');assert.equal(week.week.next,null);
const weeklyDetail=page(week.cards[0].route,home);assert.equal(weeklyDetail.date,week.date);assert.deepEqual(weeklyDetail.periods,[]);
assert.equal(page(week.week.previous,home).date,'2026-09-28 至 2026-10-04');
assert(page({page:'week',weekOffset:4},home).cards[0].note.includes('不以零错题'));
const template=report.answers.find(a=>a.classId==='c1'&&a.subject==='数学'&&a.kind==='首次'&&!a.correct),act=report.activities.find(a=>a.id===template.activityId);
function fixture(records){return{...report,roster:report.roster.filter(s=>s.classId==='c1'),activities:records.map(r=>({...act,id:r.id,studentId:r.studentId||'c1-s01',classId:'c1',subject:r.subject||'数学',day:r.day,start:r.time||'17:00'})),answers:records.filter(r=>!r.pending).map(r=>({...template,activityId:r.id,studentId:r.studentId||'c1-s01',classId:'c1',subject:r.subject||'数学',kind:'首次',correct:false,questionId:'source:'+r.id,...r})),pendingAnswers:records.filter(r=>r.pending).map(r=>({...template,activityId:r.id,studentId:r.studentId||'c1-s01',classId:'c1',subject:r.subject||'数学',kind:'订正',correct:false,...r}))};}
// More than five knowledge groups: sort by affected people, reserve unknown, stable ties.
const sortedData=fixture(Array.from({length:6},(_,i)=>Array.from({length:i+1},(_,j)=>({id:`k${i}-${j}`,questionId:'k'+i,studentId:`c1-s0${j+1}`,day:1,knowledge:'知识点'+i}))).flat().concat([{id:'unknown',day:1,knowledge:''}]));
const sorted=page({page:'home'},ctx,sortedData).cards[1].rows;
assert.deepEqual(sorted.map(r=>r.title),['知识点5','知识点4','知识点3','知识点2','其他错题']);
const all=page({page:'wrong'},ctx,sortedData);assert.equal(all.cards[0].rows.length,7);
// Homeroom prioritizes subjects, then outstanding question count, never roster position.
const followData=fixture([{id:'a',studentId:'c1-s01',day:1},{id:'b',studentId:'c1-s02',day:1},{id:'c',studentId:'c1-s02',subject:'语文',day:1},{id:'d',studentId:'c1-s03',day:1},{id:'e',studentId:'c1-s03',subject:'语文',day:1},{id:'f',studentId:'c1-s03',subject:'英语',day:1}]);
assert.deepEqual(page({page:'home'},home,followData).cards[2].rows.map(r=>r.route.studentId),['c1-s03','c1-s02']);
// 41-day-old original, today's submission, same source repeated independently.
const archive=fixture([{id:'old',day:41,questionId:'same',answerText:'旧原作答'}, {id:'old-r',day:39,kind:'订正',originalAttemptId:'old',questionId:'same',answerText:'更早订正'}, {id:'recent',day:1,questionId:'same'}, {id:'submit',day:0,kind:'订正',originalAttemptId:'old',questionId:'same',correct:true,answerText:'今天订正'}]);
const events=page({page:'activity',days:1},ctx,archive);assert.equal(events.cards[0].text,'1人 · 1次提交');assert.equal(page({page:'home',days:1},ctx,archive).cards[0].summary.questions,0);
const link=events.cards[1].rows[0].route;assert.equal(link.days,1);assert.equal(link.originalId,'old');assert.equal(link.eventId,'submit');
const trace=page(link,ctx,archive);assert(trace.cards[1].rows[0].title.startsWith('2026-09-01'));assert.equal(trace.cards[1].rows.length,3);assert.equal(trace.cards.length,2);assert(!JSON.stringify(trace).includes('recent'));
assert(page({...link,eventId:'not-found'},ctx,archive).cards[0].title.includes('暂未找到'));
const noAccess={...archive,roster:archive.roster.filter(s=>s.id!=='c1-s01')};assert.equal(page({page:'activity',days:1},ctx,noAccess).cards[0].text,'0人 · 0次提交');
const hp=page({page:'activity',days:1},home,archive);assert.equal(hp.cards[1].rows[0].route.page,'activity-student');const hd=page(hp.cards[1].rows[0].route,home,archive);assert(!JSON.stringify(hd).includes('旧原作答'));assert(hd.cards[1].note.includes('不代表'));
for(const route of [{page:'roster'},{page:'week'},{page:'activity-student',studentId:'c1-s01'}])assert(page(route,school).blocked);
const admin=page({page:'activity',days:1,classId:'c1'},school,archive);assert.equal(admin.cards[1].title,'各科订正活动');assert(!JSON.stringify(admin).includes('李涵'));
// Pending correction counts as a submission and retains pending result, duplicate event IDs count once.
const pending=fixture([{id:'old',day:41,questionId:'same'},{id:'p',day:0,pending:true,kind:'订正',originalAttemptId:'old',questionId:'same'}]);pending.pendingAnswers.push({...pending.pendingAnswers[0]});
const pp=page({page:'activity',days:1},ctx,pending);assert.equal(pp.cards[0].text,'1人 · 1次提交');assert.equal(pp.cards[1].rows[0].value,'待确认');
// Native keeps weekly dates and activity identity across route changes/back.
let def;global.Page=x=>def=x;global.wx={getStorageSync:()=>({expiresAt:Date.now()+600000,profile:{userId:'teacher-demo-001',displayName:'老师',roles:['teacher','school_admin'],teachingAssignments:[{subject:'数学',classIds:['c1']}]}}),pageScrollTo(){},reLaunch(){}};require('../miniprogram/pages/teacher/learning/index.ts');
const native={...def,data:structuredClone(def.data),correctionTrail:[],setData(x,cb){Object.assign(this.data,x);cb?.()}};native.onShow();native.changeView({currentTarget:{dataset:{view:'homeroom'}}});
const go=r=>native.correctionGo({currentTarget:{dataset:{route:r}}});go({page:'week'});const date=native.data.correctionPage.date;go(native.data.correctionPage.cards[0].route);assert.equal(native.data.correctionPage.date,date);native.backFromDetail();assert.equal(native.data.correctionPage.title,'班级周报');
console.log('PASS A2-A5: single-class subject scope, all-student roster, complete week, sort/reserve slot, exact historical chain, role boundaries, pending/deduplication, native navigation');
