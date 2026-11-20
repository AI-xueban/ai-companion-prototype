import { getLearningQuestion, learningReportDays, withSubjectMaterialData, personalLearningView } from './learningMock';
import type { LearningReport, LearningAttempt, PersonalLearningRange, PersonalQuestionFilter } from './learningMock';
import { DEMO_CLASSES, REPORT_END } from './schoolDemoRoster';

export type CorrectionRole = 'subject' | 'homeroom' | 'school';
export type CorrectionState = 'none' | 'pending' | 'follow' | 'fixed';
export type CorrectionRoute = { page: 'home'|'progress'|'wrong'|'question'|'student'|'timeline'|'class'|'aggregate'|'activity'|'activity-student'|'roster'|'week'|'explain'|'legacy-stage'|'legacy-roster'|'legacy-student'; days?: number; classId?: string; subject?: string; knowledge?: string; questionId?: string; studentId?: string; filter?: string; search?: string; start?:string; end?:string; weekOffset?:number; originalId?:string; eventId?:string };
export type CorrectionContext = { role: CorrectionRole; subject: string; days: number };
export const correctionLabels: Record<CorrectionState,string> = {none:'暂无订正',pending:'结果待确认',follow:'仍需跟进',fixed:'全部改对'};
type Event = {id:string; date:string; time:string; answer:string; result:'correct'|'wrong'|'pending'};
type Chain = Event & {corrections:Event[]};
type Group = {id:string;questionId:string;studentId:string;name:string;classId:string;subject:string;knowledge:string;stem:string;reference:string;source:string;chains:Chain[]};
const unique = <T>(list:T[]) => [...new Set(list)];
const order = (a:Event,b:Event) => a.date.localeCompare(b.date)||a.time.localeCompare(b.time)||a.id.localeCompare(b.id);
const dateAt = (day:number) => new Date(Date.parse(REPORT_END+'T00:00:00Z')-day*86400000).toISOString().slice(0,10);
export function correctionWeek(offset=0) {
  const back=(new Date(REPORT_END+'T00:00:00Z').getUTCDay()+6)%7+1+Math.max(0,offset)*7;
  return {start:dateAt(back+6),end:dateAt(back)};
}
// The input is already authorized by workbenchScope. Use the same existing source
// fixtures for all three roles, without mutating guardian or legacy report data.
export function correctionSource(report:LearningReport, subject:string) {
  return subject==='all'||subject==='数学' ? withSubjectMaterialData(report,'数学','30d') : report;
}
export function correctionGroups(report:LearningReport,days:number,start?:string,end=REPORT_END):Group[] {
  const activities=new Map(report.activities.map(a=>[a.id,a]));
  const allowed=new Map(report.roster.map(s=>[s.id,s]));
  const originals=report.answers.filter(a=>{const act=activities.get(a.activityId);return a.kind==='首次'&&!a.correct&&allowed.has(a.studentId)&&act&&act.classId===a.classId&&act.studentId===a.studentId&&act.subject===a.subject&&allowed.get(a.studentId)!.classId===a.classId&&act.day>=0&&(start?dateAt(act.day)>=start&&dateAt(act.day)<=end:act.day<days);});
  const all=[...report.answers,...report.pendingAnswers||[]];
  const pending=new Set((report.pendingAnswers||[]).map(a=>a.id));
  const event=(a:LearningAttempt):Event=>{const act=activities.get(a.activityId)!;return{id:a.id,date:dateAt(act.day),time:act.start,answer:a.answerText||'原始作答内容暂缺',result:pending.has(a.id)?'pending':a.correct?'correct':'wrong'};};
  const groups=new Map<string,Group>();
  for(const a of originals){const student=allowed.get(a.studentId)!,key=a.studentId+'|'+a.questionId,q=a.question||getLearningQuestion(a.questionId);
    let g=groups.get(key);if(!g){g={id:key,questionId:a.questionId,studentId:a.studentId,name:student.name,classId:student.classId,subject:a.subject,knowledge:a.knowledge,stem:q?.stem||'原题暂缺',reference:q?.answer||'参考答案暂缺',source:q?.source?`${q.source.name} · 第${q.source.number}题`:'自主练习',chains:[]};groups.set(key,g);}
    // Corrections are linked to the original attempt, not filtered to the error
    // period. Snapshot is end-of-day REPORT_END. Pending latest results stay pending.
    const corrections=all.filter(c=>{const act=activities.get(c.activityId);return c.kind==='订正'&&c.originalAttemptId===a.id&&c.studentId===a.studentId&&c.questionId===a.questionId&&c.classId===a.classId&&c.subject===a.subject&&act&&act.studentId===c.studentId&&act.classId===c.classId&&act.subject===c.subject&&act.day>=0;}).map(event).filter(c=>c.date<=REPORT_END&&(c.date>event(a).date||c.date===event(a).date&&c.time>=event(a).time)).sort(order);
    g.chains.push({...event(a),corrections:[...new Map(corrections.map(c=>[c.id,c])).values()]});
  }
  return [...groups.values()].map(g=>({...g,chains:g.chains.sort(order)}));
}
export function correctionState(gs:Group[]):CorrectionState {
  const latest=gs.flatMap(g=>g.chains.map(c=>c.corrections[c.corrections.length-1]));
  if(!latest.some(Boolean))return 'none';
  if(latest.some(c=>c?.result==='pending'))return 'pending';
  return latest.every(c=>c?.result==='correct')?'fixed':'follow';
}
export function correctionPeople(gs:Group[]) {
  return unique(gs.map(g=>g.studentId)).map(id=>{const groups=gs.filter(g=>g.studentId===id);return{id,name:groups[0].name,classId:groups[0].classId,groups,state:correctionState(groups),questions:groups.length,submitted:groups.filter(g=>g.chains.some(c=>c.corrections.length)).length,fixed:groups.filter(g=>correctionState([g])==='fixed').length};});
}
export function correctionSummary(gs:Group[]) {
  const people=correctionPeople(gs);return{questions:unique(gs.map(g=>g.questionId)).length,people:people.length,submitted:people.filter(p=>p.groups.some(g=>g.chains.some(c=>c.corrections.length))).length,fixed:people.filter(p=>p.state==='fixed').length,none:people.filter(p=>p.state==='none').length,pending:people.filter(p=>p.state==='pending').length,follow:people.filter(p=>p.state==='follow').length};
}

// Teacher-only adapter: keep original answers in T, read linked corrections up to D.
// The guardian and stage-report queries retain their existing behavior.
export function correctionPersonalView(report:LearningReport,studentId:string,range:PersonalLearningRange,filter:PersonalQuestionFilter='all',topic='all') {
  const base=personalLearningView(report,studentId,range,filter,topic);
  const groups=correctionGroups(report,30).filter(g=>g.studentId===studentId).map(g=>({...g,
    chains:g.chains.filter(c=>range.mode!=='term'&&c.date>=range.start&&c.date<=range.end)
  })).filter(g=>g.chains.length);
  const questions=base.summary.questions.map(q=>({...q,students:q.students.map(s=>{
    const g=groups.find(g=>g.questionId===q.id&&g.studentId===s.id);
    const chains=s.chains.map(chain=>{
      const linked=g?.chains.find(c=>c.id===chain.id);
      const corrections=linked?linked.corrections.map(e=>({...e,correct:e.result==='correct',pending:e.result==='pending'}))
        :chain.corrections.map(e=>({...e,pending:false}));
      return {...chain,corrections,latest:corrections[corrections.length-1]||null};
    });
    const state=g?correctionState([g]):null;
    return {...s,chains,hasCorrection:!!g?.chains.some(c=>c.corrections.length),
      status:state?({none:'missing',pending:'pending',follow:'still',fixed:'fixed'}[state]):s.status,
      statusLabel:state?({none:'暂无订正记录',pending:'结果待确认',follow:'仍需跟进',fixed:'已改对'}[state]):s.statusLabel};
  })}));
  const count=(qs:typeof questions)=>({all:qs.length,correct:qs.filter(q=>!q.wrongPeople).length,
    wrong:qs.filter(q=>q.wrongPeople>0).length,corrected:qs.filter(q=>q.students.some(s=>s.hasCorrection)).length});
  const summary={...base.summary,questions,correctedCount:count(questions).corrected};
  const topics=base.topics.map(t=>({...t,...count(questions.filter(q=>q.knowledge===t.name))}));
  const selected=questions.filter(q=>base.selectedTopic==='all'||(base.selectedTopic==='知识点暂未明确'?!q.knowledge:q.knowledge===base.selectedTopic));
  const visible=selected.filter(q=>filter==='all'||(filter==='correct'?!q.wrongPeople:filter==='wrong'?q.wrongPeople>0:q.students.some(s=>s.hasCorrection)));
  return {...base,summary,topics,visible,counts:count(selected),correctionAsOf:REPORT_END};
}
type Row = {title:string;detail?:string;value?:string;route?:CorrectionRoute;state?:string};
type Card = {title:string;action?:string;route?:CorrectionRoute;summary?:ReturnType<typeof correctionSummary>;rows:Row[];note?:string;states?:{id:string;label:string;value:number;active:boolean;route:CorrectionRoute}[];text?:string;layout?:'entries'};
export type CorrectionPage = {title:string;home:boolean;scope:string;days:number;date:string;compactDate:string;snapshot:string;periods:number[];cards:Card[];search:boolean;query:string;filters:{id:string;label:string;active:boolean;route:CorrectionRoute}[];footer:Row[];blocked?:boolean;week?:{label:string;previous:CorrectionRoute;next:CorrectionRoute|null}};
const matches=(p:ReturnType<typeof correctionPeople>[number],f:string)=>f==='all'||(f==='open'?p.state!=='fixed':f==='submitted'?p.submitted>0:p.state===f);
export function correctionPage(report:LearningReport,ctx:CorrectionContext,route:CorrectionRoute={page:'home'}):CorrectionPage {
  const days=[1,7,14,30].includes(route.days||ctx.days)?route.days||ctx.days:7;
  const weekOffset=Math.max(0,route.weekOffset||0),week=correctionWeek(weekOffset);
  const start=route.page==='week'?week.start:route.start||dateAt(days-1),end=route.page==='week'?week.end:route.end||REPORT_END;
  // Full authorized evidence is used only for event-to-original tracing, never to widen the error cohort.
  let full=correctionGroups(report,Infinity),groups=correctionGroups(report,days,start,end);
  const narrowed=(g:Group)=>(!route.classId||g.classId===route.classId)&&(!route.subject||g.subject===route.subject);
  full=full.filter(narrowed);groups=groups.filter(narrowed);
  const classIds=unique(report.roster.map(s=>s.classId)).filter(id=>!route.classId||id===route.classId),className=(id:string)=>DEMO_CLASSES.find(c=>c.id===id)?.name||'';
  const role=ctx.role,home=route.page==='home',subject=route.subject||ctx.subject;
  const scope=(route.classId?className(route.classId):classIds.length===1?className(classIds[0]):'全校')+' · '+(subject==='all'?'全科':subject);
  const vm:CorrectionPage={title:'学情',home,scope,days,date:start+' 至 '+end,compactDate:start.slice(5)+' 至 '+end.slice(5),snapshot:'订正进展截至 '+REPORT_END+' · 演示数据',periods:route.start||route.page==='week'?[]:home?(role==='subject'?[1,7]:[7,30]):[1,7,14,30],cards:[],search:false,query:route.search||'',filters:[],footer:[]};
  const context={days,classId:route.classId,subject:route.subject,...(route.start||route.page==='week'?{start,end,weekOffset}: {})};
  const to=(page:CorrectionRoute['page'],extra:Partial<CorrectionRoute>={}):CorrectionRoute=>({...context,page,...extra});
  const add=(title:string,rows:Row[]=[],extra:Partial<Card>={})=>vm.cards.push({title,rows,...extra});
  const summary=(gs:Group[])=>add('错题概况',[],{summary:correctionSummary(gs),route:to('progress'),action:'统计说明'});
  const subjectRows=(gs:Group[],target:'progress'|'aggregate',filter='all')=>unique([...report.activities.filter(a=>classIds.some(id=>id===a.classId)&&dateAt(a.day)>=start&&dateAt(a.day)<=end).map(a=>a.subject),...gs.map(g=>g.subject)]).filter(s=>(ctx.subject==='all'||s===ctx.subject)&&(!route.subject||s===route.subject)).map(s=>{const sub=gs.filter(g=>g.subject===s),n=correctionSummary(sub);return{title:s,value:target==='progress'&&role==='school'?correctionPeople(sub).filter(p=>matches(p,filter)).length+'人':`${n.questions}道 · ${n.people}人`,route:to(target,{subject:s,filter})};});
  const person=(p:ReturnType<typeof correctionPeople>[number]):Row=>({title:p.name,detail:`错题${p.questions}道 · 有订正${p.submitted}道 · 已改对${p.fixed}道`,value:correctionLabels[p.state],state:p.state,route:to('student',{studentId:p.id})});
  const knowledgeRows=()=>unique(groups.map(g=>g.knowledge)).map(k=>{const gs=groups.filter(g=>g.knowledge===k),n=correctionSummary(gs);return{title:k||'其他错题',detail:k?'':'知识点暂未明确',value:`${n.questions}道 · ${n.people}人`,people:n.people,open:n.people-n.fixed,unknown:!k,route:to('wrong',{knowledge:k||'__unknown'})};}).sort((a,b)=>Number(a.unknown)-Number(b.unknown)||b.people-a.people||b.open-a.open||a.title.localeCompare(b.title,'zh-CN'));
  const followPeople=()=>correctionPeople(groups).filter(p=>p.state!=='fixed').map(p=>({...p,openGroups:p.groups.filter(g=>correctionState([g])!=='fixed')})).sort((a,b)=>unique(b.openGroups.map(g=>g.subject)).length-unique(a.openGroups.map(g=>g.subject)).length||b.openGroups.length-a.openGroups.length||a.id.localeCompare(b.id));
  const followRows=()=>followPeople().slice(0,2).map(p=>({...person(p),detail:unique(p.openGroups.map(g=>g.subject)).join('、')+'待跟进',value:unique(p.openGroups.map(g=>g.subject)).length+'科'}));
  const classRows=(target:'class'|'progress',filter='all')=>classIds.map(id=>{const gs=groups.filter(g=>g.classId===id),n=correctionSummary(gs);return{title:className(id),value:target==='class'?`${n.questions}道 · ${n.people}人`:correctionPeople(gs).filter(p=>matches(p,filter)).length+'人',route:to(target,{classId:id,filter})};});
  if(role==='school'&&['student','question','timeline','wrong','roster','week','activity-student','legacy-roster','legacy-student','legacy-stage'].includes(route.page)||role!=='subject'&&['question','timeline','wrong'].includes(route.page)||role!=='homeroom'&&route.page==='week') {vm.title='无权查看';vm.blocked=true;add('当前角色无权查看此类明细',[],{note:'请返回授权范围内查看汇总。'});return vm;}
  if(home){summary(groups);if(role==='subject'){const all=knowledgeRows(),unknown=all.find(r=>r.unknown);add('班级错题',[...all.filter(r=>!r.unknown).slice(0,unknown?4:5),...(unknown?[unknown]:[])],{action:'查看全部',route:to('wrong')});add('',[{title:'阶段回顾',value:'按阶段查看',route:to('legacy-stage')},{title:'学生学情',value:'按姓名查看',route:to('legacy-roster')}]);}
    if(role==='homeroom'){add('各科错题',subjectRows(groups,'progress'),{note:'点学科查看订正情况'});add('需要关注的学生',followRows(),{action:'查看名单',route:to('progress',{filter:'open'})});add('',[{title:'学生学情',detail:`全班${report.roster.length}人 · 按姓名查看`,route:to('roster')},{title:'班级周报',detail:'按完整周查看',route:to('week')}],{layout:'entries'});}
    if(role==='school'){if(classIds.length===1)add('各科错题',subjectRows(groups,'aggregate').map(r=>({...r,route:{...r.route!,classId:classIds[0]}})));else add('各班错题',classRows('class'),{action:'查看全部',route:to('progress'),note:'点班级查看订正；按班序展示，不作排名。'});add('数据范围',[],{note:'覆盖当前授权范围内已接入的班级作答。学生明细由对应教师在授权范围内查看。'});}
    vm.footer.push({title:'期间订正活动与时间线',route:to('activity')});return vm;}
  if(route.page==='explain'){vm.title='统计说明';vm.periods=[];add('错题和人数',[],{text:'错题数量：所选范围内至少有一次正式答错的来源题目ID去重数。同题多人答错只计一道，改对后不扣减。\n涉及学生：上述作答中的学生ID去重数。知识点不明的题目也计入。'});add('订正人数',[],{text:'有订正：涉及学生中，至少一道所选错题已有成功保存的关联订正的人数。\n全部改对：当前范围内每道错题、每条被选错误作答链的最新订正均已正式判对的人数。\n全部改对 ≤ 有订正 ≤ 涉及学生，三者不能相加。'});add('时间与重复作答',[],{text:'时间筛选选取原错误发生区间；订正状态读取至页面数据截至日，允许跨期订正。同题多次做错保留各次错误链，不能用一次改对覆盖其他未改对记录。\n“期间订正活动”按订正提交时间查询，可包含更早的错题。各科人数、各班来源题目数不能直接相加。'});add('数据边界',[],{note:'待复核原作答不算已确认错题。姓名不作为去重键；无稳定同题标识不自动合并。当前为本地模拟数据，无真实批改或上传服务。'});return vm;}
  if(route.page==='week'){
    vm.title='班级周报';vm.week={label:weekOffset?'往期完整周':'最近完整周',previous:to('week',{weekOffset:weekOffset+1,start:undefined,end:undefined}),next:weekOffset?to('week',{weekOffset:weekOffset-1,start:undefined,end:undefined}):null};
    if(start<learningReportDays[29]){add('该周数据不完整',[],{note:'当前演示未覆盖这一完整周，不以零错题或零订正代替缺失数据。'});vm.week.previous={...vm.week.previous,weekOffset};return vm;}
    add('该周错题与订正',[],{summary:correctionSummary(groups),route:to('progress'),action:'统计说明'});add('各科情况',subjectRows(groups,'progress'));add('需要跟进',followRows(),{action:'查看名单',route:to('progress',{filter:'open'})});vm.footer.push({title:'全班学生学情',route:to('roster')});add('',[],{note:'当前未提供连续两周的完整采集证明，暂不作周间比较。'});return vm;
  }
  if(route.page==='roster'){
    vm.title='学生学情';vm.search=true;const f=route.filter||'all';
    const activities=new Map(report.activities.map(a=>[a.id,a]));
    const answered=new Set([...report.answers,...report.pendingAnswers||[]].filter(a=>{const act=activities.get(a.activityId);return a.kind==='首次'&&act&&classIds.some(id=>id===a.classId)&&(!route.subject||a.subject===route.subject)&&dateAt(act.day)>=start&&dateAt(act.day)<=end;}).map(a=>a.studentId));
    const people=correctionPeople(groups),students=report.roster.filter(s=>classIds.includes(s.classId));
    add(`全班学生 · ${students.length}人`,[],{note:'包含暂无作答的学生。未发现错题不代表没有作答。'});
    vm.filters=[['all','全班'],['wrong','有错题'],['empty','暂无作答']].map(([id,label])=>({id,label,active:id===f,route:to('roster',{filter:id,search:route.search})}));
    add('学生名单',students.filter(s=>s.name.includes(route.search||'')&&(f==='all'||f==='wrong'&&people.some(p=>p.id===s.id)||f==='empty'&&!answered.has(s.id))).map(s=>{const p=people.find(p=>p.id===s.id);return{title:s.name,detail:p?(p.state==='fixed'?'本期错题已改对':unique(p.groups.filter(g=>correctionState([g])!=='fixed').map(g=>g.subject)).join('、')+'有待跟进记录'):answered.has(s.id)?'本期有作答，暂无已确认错题':'本期暂无作答',route:to('student',{studentId:s.id})};}));return vm;
  }
  if(route.page==='progress'){vm.title=role==='subject'?'学生订正情况':role==='homeroom'?'班级订正情况':'订正情况汇总';const n=correctionSummary(groups),f=route.filter||'all';add('学生订正状态',[],{text:`这${n.people}名答错学生，已有${n.submitted}人提交订正，其中${n.fixed}人全部改对。`,states:(['none','pending','follow','fixed'] as CorrectionState[]).map(id=>({id,label:correctionLabels[id],value:n[id],active:f===id,route:to('progress',{filter:id,search:route.search})})),note:'每名学生只归入一种状态；有任一最新结果待确认时优先归入待确认。'});vm.filters=[['all','全部'],['submitted','已有订正'],['open','未全部改对']].map(([id,label])=>({id,label,active:f===id,route:to('progress',{filter:id,search:route.search})}));if(role==='school'){if(classIds.length>1)add('按班级查看',classRows('progress',f));else if(!route.subject)add('按学科查看',subjectRows(groups,'progress',f).map(r=>({...r,route:{...r.route!,classId:classIds[0]}})),{note:'学科人数按各科独立去重，不能相加作为班级人数。'});else add('当前学科',[],{text:`${subject} · ${correctionPeople(groups).filter(p=>matches(p,f)).length}人符合当前筛选`,note:'仅显示班级、学科汇总，不展示学生姓名。'});}else{vm.search=true;const people=role==='homeroom'&&f==='open'?followPeople():correctionPeople(groups);add('学生名单',people.filter(p=>matches(p,f)&&p.name.includes(route.search||'')).map(person));}vm.footer.push({title:'查看订正活动与时间线',route:to('activity')});return vm;}
  if(route.page==='class'||route.page==='aggregate'){vm.title=route.page==='class'?'班级错题与订正':'学科错题与订正';summary(groups);if(route.page==='class')add('各科错题',subjectRows(groups,'aggregate'));return vm;}
  if(route.page==='wrong'){vm.title=route.knowledge==='__unknown'?'其他错题':route.knowledge||'班级错题';if(!route.knowledge){add('全部错题分组',knowledgeRows());return vm;}groups=groups.filter(g=>g.knowledge===(route.knowledge==='__unknown'?'':route.knowledge));add('题目列表',unique(groups.map(g=>g.questionId)).map(id=>{const gs=groups.filter(g=>g.questionId===id),n=correctionSummary(gs);return{title:gs[0].stem,detail:gs[0].source+' · '+(gs[0].knowledge||'知识点暂未明确'),value:`${n.people}人答错 · ${n.submitted}人有订正`,route:to('question',{questionId:id})};}));return vm;}
  if(route.page==='question'){vm.title='题目与学生';groups=groups.filter(g=>g.questionId===route.questionId);const first=groups[0];if(first){add(first.knowledge||'其他题目',[],{text:first.stem,note:first.source+'\n参考答案：'+first.reference});const n=correctionSummary(groups);add('本题错题与订正',[],{text:`${n.people}人答错 · ${n.submitted}人有订正 · ${n.fixed}人已改对`,note:'答错人数不会因订正而扣减。'});const f=route.filter||'all';vm.search=true;vm.filters=[['all','全部'],['none','暂无订正'],['pending','待确认'],['follow','仍需跟进'],['fixed','已改对']].map(([id,label])=>({id,label,active:id===f,route:to('question',{questionId:route.questionId,filter:id,search:route.search})}));add('答错学生',correctionPeople(groups).filter(p=>matches(p,f)&&p.name.includes(route.search||'')).map(p=>({...person(p),route:to('timeline',{questionId:route.questionId,studentId:p.id})})));}else add('所选时间暂无已确认错题');return vm;}
  if(route.page==='student'){vm.title='学生错题与订正';groups=groups.filter(g=>g.studentId===route.studentId);const p=correctionPeople(groups)[0],student=report.roster.find(s=>s.id===route.studentId);add(student?.name||'学生',[],{text:`错题 ${p?.questions||0} 道 · 有订正 ${p?.submitted||0} 道 · 已改对 ${p?.fixed||0} 道`,note:'同题去重；有订正不代表已改对。当前统计所选时间发生的错题。'});if(role==='subject'){add('错题与订正记录',groups.map(g=>({title:g.knowledge||'其他题目',detail:g.source+' · '+g.stem,value:correctionLabels[correctionState([g])],route:to('timeline',{studentId:g.studentId,questionId:g.questionId})})));vm.footer.push({title:'查看个人学情总览',route:to('legacy-student',{studentId:route.studentId})});}else add('各科错题与订正',unique(groups.map(g=>g.subject)).map(s=>{const gs=groups.filter(g=>g.subject===s);return{title:s,detail:`错题${gs.length}道 · 有订正${gs.filter(g=>g.chains.some(c=>c.corrections.length)).length}道 · 已改对${gs.filter(g=>correctionState([g])==='fixed').length}道`};}));return vm;}
  if(route.page==='timeline'){vm.title='作答与订正时间线';const historical=!!route.originalId;
    groups=(historical?full:groups).filter(g=>g.studentId===route.studentId&&g.questionId===route.questionId).map(g=>({...g,chains:g.chains.filter(c=>!historical||c.id===route.originalId&&c.corrections.some(e=>e.id===route.eventId&&e.date>=start&&e.date<=end))})).filter(g=>g.chains.length);
    const g=groups[0];if(g){vm.periods=[];if(historical){vm.date='订正提交区间：'+vm.date;vm.compactDate=vm.date;}add(g.name+' · '+(g.knowledge||'其他题目'),[],{text:g.stem,note:g.source+'\n参考答案：'+g.reference});g.chains.forEach((c,i)=>add(historical?'本次订正对应的原作答':'作答记录 '+(i+1),[{title:c.date+' '+c.time+' · 答错',detail:c.answer},...c.corrections.map(e=>({title:e.date+' '+e.time+' · 订正',detail:e.answer,value:e.result==='correct'?'答对':e.result==='pending'?'待确认':'仍错'}))],{note:c.corrections.length?'':'暂无关联订正记录'}));if(!historical)vm.footer.push({title:'查看学生错题与订正',route:to('student',{studentId:g.studentId})});}else add('暂未找到对应原作答',[],{note:'原作答缺失或不在当前授权范围内，不能用其他题目或其他时间记录代替。'});return vm;}
  if(route.page==='activity'||route.page==='activity-student'){
    vm.title=route.page==='activity-student'?'学生订正进展':'订正活动与时间线';vm.snapshot='按订正提交时间查询 · 数据截至 '+REPORT_END+' · 演示数据';
    const entries=full.filter(g=>route.page!=='activity-student'||g.studentId===route.studentId).flatMap(g=>g.chains.flatMap(c=>c.corrections.filter(e=>e.date>=start&&e.date<=end).map(e=>({g,c,e}))));
    const events=[...new Map(entries.map(x=>[x.e.id,x])).values()].sort((a,b)=>order(b.e,a.e));
    add(route.page==='activity-student'?(report.roster.find(s=>s.id===route.studentId)?.name||'学生'):'期间提交订正',[],{text:`${unique(events.map(x=>x.g.studentId)).length}人 · ${events.length}次提交`,note:'按订正提交时间统计，可能包含更早的错题；不与首页的错误发生区间混算。'});
    if(role==='school'){
      if(classIds.length>1)add('各班订正活动',classIds.map(id=>{const es=events.filter(x=>x.g.classId===id);return{title:className(id),value:`${unique(es.map(x=>x.g.studentId)).length}人 · ${es.length}次`,route:to('activity',{classId:id})};}));
      else add('各科订正活动',unique(events.map(x=>x.g.subject)).map(s=>{const es=events.filter(x=>x.g.subject===s);return{title:s,value:`${unique(es.map(x=>x.g.studentId)).length}人 · ${es.length}次`};}),{note:'仅展示班级与学科汇总，不提供学生个人入口。'});
    }else if(role==='homeroom'&&route.page==='activity-student'){
      add('本期提交涉及的学科',unique(events.map(x=>x.g.subject)).map(s=>{const es=events.filter(x=>x.g.subject===s),linked=[...new Map(es.map(x=>[x.g.id,x.g])).values()].map(g=>({...g,chains:g.chains.filter(c=>es.some(x=>x.c.id===c.id))}));return{title:s,detail:`本期${es.length}次提交 · 涉及${unique(es.map(x=>x.g.questionId)).length}道历史错题`,value:correctionLabels[correctionState(linked)]};}),{note:'进展只对应本期提交关联的错误链，读取至数据截至日；不代表学生全部历史错题均已改对。'});
      add('提交时间线',events.map(({g,e})=>({title:e.date+' '+e.time,detail:g.subject+' · 提交订正',value:e.result==='correct'?'本次答对':e.result==='pending'?'待确认':'本次仍错'})));
    }else add('时间线',events.map(({g,c,e})=>({title:e.date+' '+e.time+' · '+g.name,detail:role==='subject'?g.source+' · '+(g.knowledge||'其他题目')+'\n原作答：'+c.date:g.subject+' · 提交订正',value:e.result==='correct'?'本次答对':e.result==='pending'?'待确认':'本次仍错',route:role==='subject'?to('timeline',{studentId:g.studentId,questionId:g.questionId,originalId:c.id,eventId:e.id}):to('activity-student',{studentId:g.studentId})})));return vm;
  }
  return vm;
}
