const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('./control-borrowing-model.js');
const R = require('./control-rules.js');
const data = () => ({ A: [{ id: 1 }], B: [{ id: 2 }] });
const weekly = (id = 'w', days = [0]) => ({ id, mode: 'weekly', weekdays: days, periods: [{ start: '08:00', end: '17:30' }] });
const dated = (id, startDate, endDate, deny = true) => ({ id, mode: 'dates', weekdays: [], startDate, endDate, deny, periods: deny ? [] : [{ start: '10:00', end: '11:00' }] });
const op = (s, fields, d = data()) => ({ names: ['A'], ...fields, revision: s.revision, targets: M.targets(d, fields.names || ['A']) });
test('借用异常预览从可操作页通知，确认后只读或刷新时间，恢复不写入数据', () => {
  const fs = require('node:fs'), vm = require('node:vm'), className = '五年级 2 班';
  const state = M.initial(); state.classRules[className] = [weekly('w',[0,1,2,3,4])];
  const controlData = {[className]:[{id:1,name:'林小满'}],schoolSettings:{borrowing:state}};
  let overlay, writes=0; const notices=[];
  const context = {controlRules:R,borrowingModel:M,schoolControlClasses:[className],controlClasses:[className],schoolGrades:()=>['五年级'],
    controlData,controlDemoRole:'admin',controlWorkView:'school',controlView:'entry',controlModule:'duration',adminLevel:'school',adminSelectedGrade:'',selectedTeacherClass:className,
    stage:'other',teacherTab:'control',app:{innerHTML:''},header:t=>'<span></span><h2>'+t+'</h2>',syncReview(){},isHeadTeacherClass:()=>true,
    localStorage:{getItem:()=>null,setItem(){writes++;}},controlToast:message=>notices.push(message),
    controlOverlay:(title,body,footer)=>{overlay={title,body,footer};},closeControlOverlay(){},renderControl(){},openControlModule(){},enterAdminModule(){},
    document:{querySelector:()=>null}};
  context.window=context;vm.createContext(context);
  vm.runInContext(fs.readFileSync(require.resolve('./control-borrowing.js'),'utf8'),context);
  context.borrowing.demoStart('temporary');
  assert.equal(overlay.title,'学校已开启临时禁借');
  assert.match(context.app.innerHTML,/设置本班借用状态<\/button>/);
  context.borrowing.demoAcknowledge();
  assert.match(context.app.innerHTML,/学校已临时禁止该班借用/);
  assert.doesNotMatch(context.app.innerHTML,/设置本班借用状态<\/button>/);
  context.borrowing.classChoice();context.borrowing.chooseClass(true);context.borrowing.saveClassChoice();assert.match(notices.at(-1),/异常场景预览/);
  context.borrowing.demoRestore();assert.equal(context.controlDemoRole,'admin');assert.equal(context.controlView,'entry');
  context.borrowing.demoStart('times');assert.equal(overlay.title,'借用时间已更新');
  assert.match(overlay.body,/是否立即查看？/);assert.match(overlay.footer,/暂不查看/);assert.match(overlay.footer,/立即查看/);
  context.borrowing.demoDefer();assert.doesNotMatch(overlay.title,/学校借用时间/);
  context.borrowing.demoRestore();context.borrowing.demoStart('times');
  context.borrowing.demoAcknowledge();assert.equal(overlay.title,'学校借用时间');assert.match(overlay.body,/18:00/);
  context.borrowing.demoRestore();assert.equal(writes,0);assert.deepEqual(state.classRules[className],[weekly('w',[0,1,2,3,4])]);
});
test('合并预览两类规则，单项或整校管理并保留返回层级', () => {
  const fs = require('node:fs'), vm = require('node:vm');
  const s = M.initial(); s.classRules['五年级 2 班'] = [weekly(), dated('d','2099-01-01','2099-01-02')];
  let overlay;
  const context = { controlRules:R, borrowingModel:M, schoolControlClasses:['五年级 2 班'], schoolGrades:()=>['五年级'],
    controlData:{'五年级 2 班':[{id:1}], schoolSettings:{borrowing:s}}, controlDemoRole:'admin', controlWorkView:'school',
    controlView:'module', controlModule:'borrowing', adminLevel:'school', adminModuleRoot:'school', adminSelectedGrade:'',
    selectedTeacherClass:'五年级 2 班', stage:'other', teacherTab:'control', app:{innerHTML:''},
    crypto:require('node:crypto'), localStorage:{getItem:()=>null}, header:t=>'<span></span><h2>'+t+'</h2>', syncReview(){},
    openControlModule(){}, enterAdminModule(){}, renderControl(){}, closeControlOverlay(){}, controlOverlay(title,body,actions){ overlay = {title,body,actions}; }, document:{querySelector:()=>null} };
  context.window=context; vm.createContext(context);
  vm.runInContext(fs.readFileSync(require.resolve('./control-borrowing.js'),'utf8'),context);
  const notices=[]; context.controlToast=message=>notices.push(message);
  context.borrowing.render();
  assert.match(context.app.innerHTML,/年级借用规则/);
  assert.doesNotMatch(context.app.innerHTML,/role="tablist"|aria-label="规则类型"|borrowing.edit\(undefined/);
  assert.match(context.app.innerHTML,/周一/); assert.match(context.app.innerHTML,/2099-01-01/);
  context.borrowing.manage(['五年级 2 班']);
  assert.doesNotMatch(context.app.innerHTML,/aria-label="规则类型"/);
  assert.match(context.app.innerHTML,/每周固定借用规则/);
  assert.match(context.app.innerHTML,/指定日期借用规则/);
  assert.match(context.app.innerHTML,/新增规则/);
  assert.match(context.app.innerHTML,/2099-01-01/);
  assert.doesNotMatch(context.app.innerHTML,/新增指定日期规则<\/button>/);
  assert.match(context.app.innerHTML,/aria-label="编辑规则"/);
  assert.match(context.app.innerHTML,/aria-label="删除规则"/);
  context.borrowing.edit(undefined,'dates'); assert.match(context.app.innerHTML,/id="borrow-start"|新增规则类型/);
  context.borrowing.discard(); assert.match(context.app.innerHTML,/2099-01-01/);
  context.borrowing.back(); assert.match(context.app.innerHTML,/年级借用规则/);
  assert.match(context.app.innerHTML,/设置全校借用规则/);
  assert.doesNotMatch(context.app.innerHTML,/批量设置|全选 · 已选/);
  context.borrowing.manage(['五年级 2 班']);
  context.borrowing.edit(undefined,'dates'); assert.match(context.app.innerHTML,/id="borrow-start"|新增规则类型/);
  assert.doesNotMatch(context.app.innerHTML,/aria-label="规则类型"/);
  context.borrowing.discard(); assert.doesNotMatch(context.app.innerHTML,/已选1项/);
  context.borrowing.back();
  context.borrowing.go('五年级'); assert.match(context.app.innerHTML,/设置借用规则/);
  assert.doesNotMatch(context.app.innerHTML,/aria-label="规则类型"/);
  context.borrowing.back(); assert.equal(context.adminLevel,'school');
  context.borrowing.back(); assert.equal(context.controlView,'entry');
});
test('合并预览最多两条，优先生效或最近日期，忽略过期日期且不将某班规则冒充整级', () => {
  const s=M.initial(), now=new Date('2026-10-20T09:00:00+08:00');
  s.classRules.A=[weekly('w1',[0]),weekly('w2',[1]),dated('later','2099-01-01','2099-01-02'),dated('active','2026-10-20','2026-10-21'),dated('expired','2020-01-01','2020-01-02')];
  let p=M.preview(s,['A'],now);
  assert.deepEqual(p.rules.map(rule=>rule.id),['active','w1']); assert.equal(p.more,2); assert.equal(p.moreMode,'weekly');
  s.classRules.A=s.classRules.A.filter(rule=>['w1','w2','expired'].includes(rule.id));
  p=M.preview(s,['A'],now); assert.deepEqual(p.rules.map(rule=>rule.id),['w1','w2']); assert.equal(p.more,0);
  s.classRules.B=[weekly('different',[3])];
  p=M.preview(s,['A','B'],now); assert.equal(p.rules.length,0); assert.match(p.notes.join(''),/每周规则：各班规则不同/);
  s.classRules.A.push(dated('future','2099-01-01','2099-01-02'));
  p=M.preview(s,['A','B'],now); assert.match(p.notes.join(''),/指定日期规则：部分班级未设置规则/); assert.equal(p.rules.length,0);
  s.classRules.A=[dated('expired','2020-01-01','2020-01-02')]; s.classRules.B=[];
  p=M.preview(s,['A','B'],now); assert.doesNotMatch(p.notes.join(''),/指定日期/); assert.match(p.notes.join(''),/当前无生效规则/); assert.equal(p.more,0);
});
test('借用卡片混合规则无生效日期时先展示每周，纯日期取前两条', () => {
  const s=M.initial(), now=new Date('2026-10-20T09:00:00+08:00');
  s.classRules.A=[weekly('w1',[0]),weekly('w2',[1]),dated('future','2099-01-01','2099-01-02')];
  assert.deepEqual(M.preview(s,['A'],now).rules.map(rule=>rule.id),['w1','w2']);
  s.classRules.A=[weekly('w1',[0]),dated('future','2099-01-01','2099-01-02')];
  assert.deepEqual(M.preview(s,['A'],now).rules.map(rule=>rule.id),['w1','future']);
  s.classRules.A=[dated('future2','2099-03-01','2099-03-02'),dated('future1','2099-01-01','2099-01-02'),dated('old','2020-01-01','2020-01-02')];
  assert.deepEqual(M.preview(s,['A'],now).rules.map(rule=>rule.id),['future1','future2']);
  s.classRules.B=[dated('different-id','2099-03-01','2099-03-02'),dated('another-id','2099-01-01','2099-01-02'),dated('expired','2019-01-01','2019-01-02')];
  assert.equal(M.summary(s,['A','B'],'dates',now).note,'');
});
test('生效中日期规则只允许修改结束日期，最终提交也校验原规则', () => {
  let s=M.initial(); const start=R.today(); const original=dated('active',start,'2099-01-02',false);
  s.classRules.A=[original];
  const changed={...original,endDate:'2099-01-03'};
  assert.equal(R.validateBorrow(changed,new Date(),original),'');
  assert.equal(R.validateBorrow({...changed,startDate:'2099-01-01'},new Date(),original),'生效中的规则只能修改结束日期');
  assert.equal(R.validateBorrow({...changed,deny:true,periods:[]},new Date(),original),'生效中的规则只能修改结束日期');
  assert.equal(R.validateBorrow({...changed,endDate:'2020-01-01'},new Date(),original),'请选择正确的开始和结束日期');
  assert.throws(()=>M.commit(s,op(s,{type:'save',rule:{...changed,periods:[{start:'11:00',end:'12:00'}]},editingIds:{A:'active'}}),data(),'school',[]),/只能修改结束日期/);
  s=M.commit(s,op(s,{type:'save',rule:changed,editingIds:{A:'active'}}),data(),'school',[]);
  assert.equal(s.classRules.A[0].endDate,'2099-01-03');
});
test('生效中的指定日期编辑页仅提供结束日期输入', () => {
  const fs=require('node:fs'),vm=require('node:vm'),name='五年级 2 班',s=M.initial();
  s.classRules[name]=[dated('active',R.today(),'2099-01-02',false)];
  const context={controlRules:R,borrowingModel:M,schoolControlClasses:[name],schoolGrades:()=>['五年级'],controlData:{[name]:[{id:1}],schoolSettings:{borrowing:s}},controlDemoRole:'admin',controlWorkView:'school',controlView:'module',controlModule:'borrowing',adminLevel:'grade',adminModuleRoot:'school',adminSelectedGrade:'五年级',selectedTeacherClass:name,stage:'other',teacherTab:'control',app:{innerHTML:''},header:t=>'<span></span><h2>'+t+'</h2>',syncReview(){},localStorage:{getItem:()=>null},document:{querySelector:()=>null},renderControl(){},openControlModule(){},enterAdminModule(){}};
  context.window=context;vm.createContext(context);vm.runInContext(fs.readFileSync(require.resolve('./control-borrowing.js'),'utf8'),context);
  context.borrowing.manage([name]);context.borrowing.edit(0);
  assert.match(context.app.innerHTML,/只能修改结束日期/);assert.match(context.app.innerHTML,/id="borrow-end"/);
  assert.doesNotMatch(context.app.innerHTML,/id="borrow-start"|id="borrow-way"|id="borrow-periods"/);
});
test('混合临时禁借统一入口，未选状态不保存，取消不写入，两种状态都可保存且保留全校会话', () => {
  const fs = require('node:fs'), vm = require('node:vm');
  for (const value of [true,false]) {
    const s = M.initial(); s.schoolTemporaryActive = true; s.temporaryClasses['五年级 1 班'] = false; s.classBans['五年级 1 班'] = true;
    let saved = null, overlay = '', writes = 0;
    const notices = [], classes = ['五年级 1 班','五年级 2 班'];
    const context = { controlRules:R, borrowingModel:M, schoolControlClasses:classes, schoolGrades:()=>['五年级'],controlClasses:classes,
      controlData:{[classes[0]]:[{id:1}],[classes[1]]:[{id:2}],schoolSettings:{borrowing:s}}, controlDemoRole:'admin',controlWorkView:'school',
      controlView:'module',controlModule:'borrowing',adminLevel:'school',adminModuleRoot:'school',adminSelectedGrade:'',selectedTeacherClass:classes[0],
      stage:'other',teacherTab:'control',app:{innerHTML:''}, header:t=>'<span></span><h2>'+t+'</h2>',syncReview(){},
      localStorage:{getItem:()=>saved,setItem:(key,value)=>{saved=value;writes++;}},
      controlToast:message=>notices.push(message), controlOverlay:(title,body,footer)=>{overlay=title+body+footer;},closeControlOverlay(){overlay='';},
      openControlModule(){},enterAdminModule(){},document:{querySelector:()=>null} };
    context.window=context; vm.createContext(context);
    vm.runInContext(fs.readFileSync(require.resolve('./control-borrowing.js'),'utf8'),context);
    context.borrowing.render(); assert.match(context.app.innerHTML,/设置临时禁借/);
    assert.doesNotMatch(context.app.innerHTML,/borrowing.temporary\([^)]*,false\)/);
    context.borrowing.batch(); context.borrowing.selectAll(true);
    assert.match(context.app.innerHTML,/设置临时禁借/);
    context.borrowing.temporaryChoice(classes);
    assert.match(overlay,/临时禁止借用/); assert.match(overlay,/解除临时禁借/);
    context.borrowing.saveTemporary(); assert.equal(writes,0); assert.equal(notices.at(-1),'请选择设置后的状态');
    context.borrowing.chooseTemporary(value); context.borrowing.cancelTemporary(); assert.equal(writes,0);
    context.borrowing.temporaryChoice(classes); context.borrowing.chooseTemporary(value); context.borrowing.saveTemporary();
    const result=JSON.parse(saved).schoolSettings.borrowing;
    assert.equal(writes,1); assert.equal(M.denied(result,classes[0]),value); assert.equal(M.denied(result,classes[1]),value);
    assert.equal(result.schoolTemporaryActive,true); assert.equal(result.classBans['五年级 1 班'],true);
  }
});

test('班主任只设置全班借用状态，学校临时禁借时只读', () => {
  const fs = require('node:fs'), vm = require('node:vm'), s = M.initial();
  s.studentBans = {2:true}; // Historical per-student data must not create a mixed class state.
  const rowHost = { innerHTML:'' }, footer = { outerHTML:'' }, notices = [];
  let overlay;
  const context = { controlRules:R, borrowingModel:M, schoolControlClasses:['五年级 2 班'], schoolGrades:()=>['五年级'],
    controlData:{'五年级 2 班':[{id:1,name:'林小满'},{id:2,name:'陈子涵'}],schoolSettings:{borrowing:s}},
    selectedTeacherClass:'五年级 2 班', controlDemoRole:'teacher', controlWorkView:'homeroom', isHeadTeacherClass:()=>true,
    controlView:'module', controlModule:'borrowing', stage:'other', teacherTab:'control', app:{innerHTML:''},
    localStorage:{getItem:()=>null}, header:t=>'<span></span><h2>'+t+'</h2>', syncReview(){}, openControlModule(){}, enterAdminModule(){},
    controlToast:message=>notices.push(message), controlOverlay:(title,body,actions)=>{ overlay={title,body,actions}; }, closeControlOverlay(){},
    document:{ getElementById:()=>rowHost, querySelector:()=>footer } };
  context.window=context; vm.createContext(context);
  vm.runInContext(fs.readFileSync(require.resolve('./control-borrowing.js'),'utf8'),context);
  context.borrowing.render(); assert.match(context.app.innerHTML,/本班未禁借/);
  assert.doesNotMatch(context.app.innerHTML,/1人已禁借|1人未禁借/);
  const entry=context.borrowing.teacherEntryCard();
  assert.match(entry,/柜机借用管控/); assert.match(entry,/查看借用时间/);
  assert.match(entry,/设置本班借用状态/); assert.doesNotMatch(entry,/查看详情/);
  assert.match(context.app.innerHTML,/borrowing.classChoice\(\)/);
  assert.doesNotMatch(context.app.innerHTML,/搜索学生|筛选学生|borrowing.studentChoice\(\)/);
  context.borrowing.batch(); assert.doesNotMatch(context.app.innerHTML,/已选 1 名学生/);
  assert.equal(context.borrowing.student,undefined);
  assert.equal(context.borrowing.studentChoice,undefined);
  context.borrowing.classChoice(); assert.equal(overlay.title,'设置本班借用状态');
  assert.match(overlay.body,/全班禁止借用/); assert.match(overlay.body,/解除禁止借用/);
  context.borrowing.saveClassChoice(); assert.equal(notices.at(-1),'请选择设置后的状态');
  context.borrowing.chooseClass(false); context.borrowing.saveClassChoice();
  assert.equal(overlay.title,'确认解除禁止借用？');
  context.controlData.schoolSettings.borrowing.temporaryClasses['五年级 2 班'] = true;
  context.borrowing.render();
  assert.match(context.borrowing.teacherEntryCard(),/学校已临时禁止该班借用/);
  assert.doesNotMatch(context.borrowing.teacherEntryCard(),/borrowing.classChoice\(/);
  assert.match(context.app.innerHTML,/学校临时禁止借用/);
  assert.doesNotMatch(context.app.innerHTML,/borrowing.student\(|borrowing.classChoice\(|borrowing.batch\(/);
});

test('无规则及只有未来或过期日期时默认可借，已设置每周规则但星期不覆盖则禁借', () => {
  const s = M.initial(), now = new Date('2026-10-20T09:00:00+08:00');
  assert.equal(M.result(s, 'A', 1, now), '当前可借用');
  s.classRules.A = [dated('future','2099-01-01','2099-01-03'), dated('past','2020-01-01','2020-01-03')];
  assert.equal(M.result(s,'A',1,now),'当前可借用');
  s.classRules.A.push(weekly()); assert.equal(M.result(s,'A',1,now),'当前禁止借用');
});
test('日期规则优先且时段不叠加；按学校时区判断', () => {
  const s = M.initial(); s.classRules.A = [weekly('w',[0,1,2,3,4,5,6]),dated('d','2026-10-20','2026-10-20',false)];
  assert.equal(M.result(s,'A',1,new Date('2026-10-20T01:00:00Z')), '当前不在借用时段');
  assert.equal(M.result(s,'A',1,new Date('2026-10-20T02:00:00Z')), '当前可借用');
  assert.equal(M.result(s,'A',1,new Date('2026-10-20T03:00:00Z')), '当前不在借用时段');
});
test('全校临时会话支持单班解除和重新禁止，结束清除全部例外但保留班主任整班禁借', () => {
  let s = M.initial(); s.classBans.A = true; s.classRules.A = [weekly()];
  s = M.change(s,{type:'temporary',school:true,names:['A','B'],value:true});
  s = M.change(s,{type:'temporary',names:['A'],value:false});
  assert.equal(s.schoolTemporaryActive,true); assert.equal(M.denied(s,'A'),false); assert.equal(M.denied(s,'B'),true);
  s = M.change(s,{type:'temporary',names:['A'],value:true}); assert.equal(M.denied(s,'A'),true);
  s = M.change(s,{type:'temporary',school:true,names:['A','B'],value:false});
  assert.deepEqual(s.temporaryClasses,{}); assert.equal(s.classBans.A,true); assert.equal(s.classRules.A.length,1);
});
test('每个年级只能有一条每周规则，编辑后新学生按新时段执行', () => {
  let s = M.initial(); s.classRules.A = [weekly('old',[0,1,2])];
  assert.throws(()=>M.commit(s,op(s,{type:'save',rule:weekly('next',[0])}),data(),'school',[]),/已有每周规则/);
  s = M.commit(s,op(s,{type:'save',rule:weekly('next',[0]),editingIds:{A:'old'}}),data(),'school',[]);
  assert.deepEqual(s.classRules.A[0].weekdays,[0]); assert.equal(s.classRules.B,undefined);
  assert.equal(M.result(s,'A',999,new Date('2026-10-19T09:00:00+08:00')),'当前可借用');
  assert.equal(M.result(s,'A',999,new Date('2026-10-19T20:00:00+08:00')),'当前不在借用时段');
});
test('按完整年级保存逐日每周时段；日期可多条但重叠时拒绝且保留原规则', () => {
  const a='五年级 1 班', b='五年级 2 班', roster={ [a]:[{id:1}], [b]:[{id:2}] }, names=[a,b];
  const operation=(state,fields)=>({ names, revision:state.revision, targets:M.targets(roster,names), ...fields });
  let state=M.initial();
  const week={ ...weekly('week',[0,1]), dailyPeriods:{ 0:[{start:'08:00',end:'10:00'}], 1:[{start:'13:00',end:'16:00'}] } };
  state=M.commit(state,operation(state,{type:'save',rule:week}),roster,'school',[]);
  assert.equal(M.result(state,a,1,new Date('2026-10-19T09:00:00+08:00')),'当前可借用');
  assert.equal(M.result(state,b,2,new Date('2026-10-20T09:00:00+08:00')),'当前不在借用时段');
  assert.equal(M.result(state,b,2,new Date('2026-10-20T14:00:00+08:00')),'当前可借用');
  assert.throws(()=>M.commit(state,operation(state,{type:'save',rule:weekly('second',[2])}),roster,'school',[]),/已有每周规则/);
  const first=dated('first','2099-01-01','2099-01-03');
  state=M.commit(state,operation(state,{type:'save',rule:first}),roster,'school',[]);
  const revision=state.revision;
  assert.throws(()=>M.commit(state,operation(state,{type:'save',rule:dated('overlap','2099-01-03','2099-01-05')}),roster,'school',[]),/所选日期已有规则，请重新选择/);
  assert.equal(state.revision,revision);
  assert.deepEqual(state.classRules[a].filter(rule=>rule.mode==='dates').map(rule=>rule.id),['first']);
  state=M.commit(state,operation(state,{type:'save',rule:dated('next','2099-01-04','2099-01-05')}),roster,'school',[]);
  assert.deepEqual(state.classRules[b].filter(rule=>rule.mode==='dates').map(rule=>rule.id),['first','next']);
  const partial={names:[a],revision:state.revision,targets:M.targets(roster,[a]),type:'save',rule:weekly('partial',[3])};
  assert.throws(()=>M.commit(state,partial,roster,'school',[]),/按年级设置/);
});
test('新增规则表单选择类型与年级，日期冲突留在编辑页供重新选择', () => {
  const fs=require('node:fs'), vm=require('node:vm'), name='五年级 1 班', state=M.initial();
  state.classRules[name]=[dated('existing','2099-01-01','2099-01-03')];
  const values={ 'borrow-start':{value:'2099-01-03'}, 'borrow-end':{value:'2099-01-05'}, 'borrow-way':{value:'deny'}, 'borrow-error':{textContent:''} };
  let overlay;
  const context={controlRules:R,borrowingModel:M,schoolControlClasses:[name],schoolGrades:()=>['五年级'],controlData:{[name]:[{id:1}],schoolSettings:{borrowing:state}},controlDemoRole:'admin',controlWorkView:'school',controlView:'module',controlModule:'borrowing',adminLevel:'school',adminModuleRoot:'school',adminSelectedGrade:'',selectedTeacherClass:name,stage:'other',teacherTab:'control',app:{innerHTML:''},crypto:require('node:crypto'),header:t=>'<h2>'+t+'</h2>',syncReview(){},localStorage:{getItem:()=>null},document:{querySelector:()=>null,querySelectorAll:()=>[],getElementById:id=>values[id]||null},renderControl(){},openControlModule(){},enterAdminModule(){},controlOverlay:(title,body)=>{overlay={title,body};}};
  context.window=context; vm.createContext(context); vm.runInContext(fs.readFileSync(require.resolve('./control-borrowing.js'),'utf8'),context);
  context.borrowing.manage([name]); context.borrowing.edit();
  assert.match(context.app.innerHTML,/新增规则类型/); assert.match(context.app.innerHTML,/选择年级/);
  context.borrowing.editorType('dates'); context.borrowing.editorGrade('五年级');
  assert.match(context.app.innerHTML,/value="deny" selected/);
  context.borrowing.save();
  assert.equal(values['borrow-error'].textContent,'所选日期已有规则，请重新选择');
  assert.equal(overlay,undefined);
  assert.match(context.app.innerHTML,/新增借用规则/);
  values['borrow-start'].value='2099-01-04'; context.borrowing.save();
  assert.equal(overlay.title,'确认保存借用规则？');
});
test('班主任仅可整班禁借，任课老师、跨班和逐人操作拒绝，临时禁借期间最终提交拒绝', () => {
  let s = M.initial(), operation = op(s,{type:'class',value:true});
  assert.throws(()=>M.commit(s,operation,data(),'subject',['A']),/权限/);
  assert.throws(()=>M.commit(s,operation,data(),'homeroom',['B']),/权限/);
  assert.throws(()=>M.commit(s,op(s,{type:'student',ids:[1],value:true}),data(),'homeroom',['A']),/只有学校管理员/);
  s = M.commit(s,operation,data(),'homeroom',['A']); assert.equal(s.classBans.A,true);
  s.temporaryClasses.A = true;
  assert.throws(()=>M.commit(s,op(s,{type:'class',value:false}),data(),'homeroom',['A']),/临时禁止/);
  s.temporaryClasses.A = false;
  s = M.commit(s,op(s,{type:'class',value:false}),data(),'homeroom',['A']); assert.equal(s.classBans.A,false);
});
test('班主任禁借跟随班级，新生同样执行；历史逐人禁借字段不再生效', () => {
  let s = M.initial(); s.classBans.A = true; s.studentBans = {2:true};
  s = M.change(s,{type:'save',names:['B'],rule:weekly()});
  assert.equal(M.result(s,'A',1),'班主任已禁止借用');
  assert.equal(M.result(s,'A',3),'班主任已禁止借用');
  assert.equal(M.result(s,'B',2,new Date('2026-10-19T09:00:00+08:00')),'当前可借用');
  assert.equal(M.result(s,'C',3),'当前可借用');
});
test('版本及对象变动整批拒绝，包括修改后改回，原状态不被改变', () => {
  const s = M.initial(), operation = op(s,{type:'temporary',names:['A','B'],value:true});
  const changed = M.change(M.change(s,{type:'temporary',names:['A'],value:true}),{type:'temporary',names:['A'],value:false});
  assert.throws(()=>M.commit(changed,operation,data(),'school',[]),/其他人修改/);
  assert.throws(()=>M.commit(s,operation,{A:[{id:1}],B:[{id:3}]},'school',[]),/学生有变化/);
  assert.equal(s.revision,0); assert.deepEqual(s.temporaryClasses,{});
});
test('同年级规则比较忽略ID和排序，编辑仍保留各班规则ID', () => {
  const first = '五年级 1 班', second = '五年级 2 班', third = '五年级 3 班';
  const s = M.initial(); s.classRules[first] = [weekly('a',[0,1])]; s.classRules[second] = [weekly('b',[1,0])];
  assert.equal(M.summary(s,[first,second],'weekly').note,'');
  const group = M.groups(s,[first,second],'weekly')[0]; assert.deepEqual(group.ids,{[first]:'a',[second]:'b'});
  const next = M.change(s,{type:'delete',names:group.names,editingIds:group.ids});
  assert.deepEqual(next.classRules,{[first]:[],[second]:[]});
  assert.equal(M.summary(s,[first,second,third],'weekly').note,'部分班级未设置规则');
});
test('规则删除后默认可借，保存时间不清除临时及整班禁借，无学生不能提交', () => {
  let s = M.initial(); s.classRules.A=[weekly()]; s.schoolTemporaryActive=true; s.classBans.A=true;
  s=M.change(s,{type:'delete',names:['A'],editingIds:{A:'w'}});
  assert.equal(s.schoolTemporaryActive,true); assert.equal(s.classBans.A,true);
  assert.equal(R.effectiveBorrow({schedules:s.classRules.A},'2026-10-20').deny,false);
  assert.throws(()=>M.commit(s,op(s,{type:'save',rule:weekly()}, {A:[]}),{A:[]},'school',[]),/没有学生/);
});
test('空班级保留只读卡片，年级按学段分组且不提供批量入口', () => {
  const fs=require('node:fs'),vm=require('node:vm');
  const empty='四年级 1 班', filled='七年级 1 班', s=M.initial();
  const context={controlRules:R,borrowingModel:M,schoolControlClasses:[empty,filled],schoolGrades:()=>['四年级','七年级'],
    controlData:{[empty]:[],[filled]:[{id:1}],schoolSettings:{borrowing:s}},controlDemoRole:'admin',controlWorkView:'school',controlView:'module',controlModule:'borrowing',adminLevel:'school',adminModuleRoot:'school',adminSelectedGrade:'',selectedTeacherClass:filled,
    stage:'other',teacherTab:'control',app:{innerHTML:''},header:t=>'<span></span><h2>'+t+'</h2>',syncReview(){},localStorage:{getItem:()=>null},document:{querySelector:()=>null},renderControl(){},openControlModule(){},enterAdminModule(){}};
  context.window=context;vm.createContext(context);vm.runInContext(fs.readFileSync(require.resolve('./control-borrowing.js'),'utf8'),context);
  context.borrowing.render();assert.match(context.app.innerHTML,/control-grade-group-title">小学/);assert.match(context.app.innerHTML,/control-grade-group-title">初中/);
  context.borrowing.batch();assert.doesNotMatch(context.app.innerHTML,/aria-label="选择四年级"|批量设置/);assert.match(context.app.innerHTML,/暂无学生，暂不能设置/);
  context.borrowing.select('四年级',true);assert.doesNotMatch(context.app.innerHTML,/已选1项/);
  context.borrowing.render();assert.doesNotMatch(context.app.innerHTML,/全选 · 已选/);
  assert.throws(()=>M.commit(s,{...op(s,{type:'save',names:[empty,filled],rule:weekly()}, {[empty]:[],[filled]:[{id:1}]})},{[empty]:[],[filled]:[{id:1}]},'school',[]),/没有学生/);
});
