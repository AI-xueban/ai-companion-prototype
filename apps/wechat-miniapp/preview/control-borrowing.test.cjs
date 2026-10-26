const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('./control-borrowing-model.js');
const R = require('./control-rules.js');
const data = () => ({ A: [{ id: 1 }], B: [{ id: 2 }] });
const weekly = (id = 'w', days = [0]) => ({ id, mode: 'weekly', weekdays: days, periods: [{ start: '08:00', end: '17:30' }] });
const dated = (id, startDate, endDate, deny = true) => ({ id, mode: 'dates', weekdays: [], startDate, endDate, deny, periods: deny ? [] : [{ start: '10:00', end: '11:00' }] });
const op = (s, fields, d = data()) => ({ names: ['A'], ...fields, revision: s.revision, targets: M.targets(d, fields.names || ['A']) });
test('总览直接编辑删除两类时间，详情仅复用锁屏年级列表布局', () => {
  const fs = require('node:fs'), vm = require('node:vm');
  const s = M.initial(); s.classRules['五年级 2 班'] = [weekly(), dated('d','2099-01-01','2099-01-02')];
  const context = { controlRules:R, borrowingModel:M, schoolControlClasses:['五年级 2 班'], schoolGrades:()=>['五年级'],
    controlData:{'五年级 2 班':[{id:1}], schoolSettings:{borrowing:s}}, controlDemoRole:'admin', controlWorkView:'school',
    controlView:'module', controlModule:'borrowing', adminLevel:'school', adminModuleRoot:'school', adminSelectedGrade:'',
    selectedTeacherClass:'五年级 2 班', stage:'other', teacherTab:'control', app:{innerHTML:''},
    localStorage:{getItem:()=>null}, header:t=>'<span></span><h2>'+t+'</h2>', syncReview(){},
    openControlModule(){}, enterAdminModule(){}, renderControl(){}, document:{querySelector:()=>null} };
  context.window=context; vm.createContext(context);
  vm.runInContext(fs.readFileSync(require.resolve('./control-borrowing.js'),'utf8'),context);
  assert.match(context.borrowing.entryCard(), /class="control-entry-lock"/);
  assert.match(context.borrowing.entryCard(), /一键临时禁借/);
  context.borrowing.render();
  assert.match(context.app.innerHTML,/每周固定借用时间/); assert.match(context.app.innerHTML,/指定日期借用时间/);
  assert.doesNotMatch(context.app.innerHTML,/role="tab|borrowing-scope-row|新增规则|学校借用安排/);
  assert.match(context.app.innerHTML,/borrowing.edit\(0\)/); assert.match(context.app.innerHTML,/borrowing.remove\(1\)/);
  context.borrowing.mode('weekly');
  assert.match(context.app.innerHTML,/每周固定借用时间/); assert.doesNotMatch(context.app.innerHTML,/新增规则|parity-borrow-section/); assert.match(context.app.innerHTML,/admin-level-row/);
  assert.doesNotMatch(context.app.innerHTML,/2099-01-01/);
  context.borrowing.back(); assert.match(context.app.innerHTML,/指定日期借用时间/);
  context.borrowing.mode('dates'); assert.doesNotMatch(context.app.innerHTML,/2099-01-01|周一 · 08:00/);
  context.borrowing.manage(['五年级 2 班']); assert.match(context.app.innerHTML,/2099-01-01/); assert.match(context.app.innerHTML,/新增规则/);
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
test('全校临时会话支持单班解除和重新禁止，结束清除全部例外但保留学生禁借', () => {
  let s = M.initial(); s.studentBans[1] = true; s.classRules.A = [weekly()];
  s = M.change(s,{type:'temporary',school:true,names:['A','B'],value:true});
  s = M.change(s,{type:'temporary',names:['A'],value:false});
  assert.equal(s.schoolTemporaryActive,true); assert.equal(M.denied(s,'A'),false); assert.equal(M.denied(s,'B'),true);
  s = M.change(s,{type:'temporary',names:['A'],value:true}); assert.equal(M.denied(s,'A'),true);
  s = M.change(s,{type:'temporary',school:true,names:['A','B'],value:false});
  assert.deepEqual(s.temporaryClasses,{}); assert.equal(s.studentBans[1],true); assert.equal(s.classRules.A.length,1);
});
test('按班级保存及覆盖，空班规则保留、新学生执行当前班级规则', () => {
  let s = M.initial(); s.classRules.A = [weekly('old',[0,1,2])];
  s = M.commit(s,op(s,{type:'save',rule:weekly('next',[0])}),data(),'school',[]);
  assert.deepEqual(s.classRules.A[0].weekdays,[1,2]); assert.equal(s.classRules.B,undefined);
  assert.equal(M.result(s,'A',999,new Date('2026-10-19T09:00:00+08:00')),'当前可借用');
  assert.equal(M.result(s,'A',999,new Date('2026-10-19T20:00:00+08:00')),'当前不在借用时段');
});
test('班主任可禁借本班、任课老师和跨班拒绝，临时禁借期间最终提交拒绝', () => {
  let s = M.initial(), operation = op(s,{type:'student',ids:[1],value:true});
  assert.throws(()=>M.commit(s,operation,data(),'subject',['A']),/权限/);
  assert.throws(()=>M.commit(s,operation,data(),'homeroom',['B']),/权限/);
  s = M.commit(s,operation,data(),'homeroom',['A']); assert.equal(s.studentBans[1],true);
  s.temporaryClasses.A = true;
  assert.throws(()=>M.commit(s,op(s,{type:'student',ids:[1],value:false}),data(),'homeroom',['A']),/临时禁止/);
  s.temporaryClasses.A = false;
  s = M.commit(s,op(s,{type:'student',ids:[1],value:false}),data(),'homeroom',['A']); assert.equal(s.studentBans[1],false);
});
test('学生禁借随学生转班，不随班级规则清除；新增学生不继承历史学生禁借', () => {
  let s = M.initial(); s.studentBans[1] = true;
  s = M.change(s,{type:'save',names:['B'],rule:weekly()});
  assert.equal(M.result(s,'B',1),'班主任已禁止借用');
  assert.equal(M.result(s,'C',3),'当前可借用');
});
test('版本及对象变动整批拒绝，包括修改后改回，原状态不被改变', () => {
  const s = M.initial(), operation = op(s,{type:'temporary',names:['A','B'],value:true});
  const changed = M.change(M.change(s,{type:'temporary',names:['A'],value:true}),{type:'temporary',names:['A'],value:false});
  assert.throws(()=>M.commit(changed,operation,data(),'school',[]),/其他人修改/);
  assert.throws(()=>M.commit(s,operation,{A:[{id:1}],B:[{id:3}]},'school',[]),/学生有变化/);
  assert.equal(s.revision,0); assert.deepEqual(s.temporaryClasses,{});
});
test('规则比较忽略ID和排序，部分未设置优先；合并规则保留各班编辑ID', () => {
  const s = M.initial(); s.classRules.A = [weekly('a',[0,1])]; s.classRules.B = [weekly('b',[1,0])];
  assert.equal(M.summary(s,['A','B'],'weekly').note,'');
  const group = M.groups(s,['A','B'],'weekly')[0]; assert.deepEqual(group.ids,{A:'a',B:'b'});
  const next = M.change(s,{type:'delete',names:group.names,editingIds:group.ids});
  assert.deepEqual(next.classRules,{A:[],B:[]});
  assert.equal(M.summary(s,['A','B','C'],'weekly').note,'部分班级未设置规则');
});
test('规则删除后默认可借，保存时间不清除临时及学生禁借，无学生不能提交', () => {
  let s = M.initial(); s.classRules.A=[weekly()]; s.schoolTemporaryActive=true; s.studentBans[1]=true;
  s=M.change(s,{type:'delete',names:['A'],editingIds:{A:'w'}});
  assert.equal(s.schoolTemporaryActive,true); assert.equal(s.studentBans[1],true);
  assert.equal(R.effectiveBorrow({schedules:s.classRules.A},'2026-10-20').deny,false);
  assert.throws(()=>M.commit(s,op(s,{type:'save',rule:weekly()}, {A:[]}),{A:[]},'school',[]),/没有学生/);
});
