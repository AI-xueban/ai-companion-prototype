const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const R=require('./control-rules.js'),M=require('./control-school-model.js');
function setup(){
 let data=M.init({'一年级 1 班':[{id:1,name:'甲'},{id:2,name:'乙'}],'二年级 1 班':[{id:3,name:'丙'}],'三年级 1 班':[{id:4,name:'丁'}]});
 const group=(n)=>[{weekdays:[0,1,2,3,4],permission:'true',value:{continuousMinutes:n,restMinutes:15,dailyMinutes:180,periods:[]}}];
 data=M.apply(data,{module:'duration',action:'save',id:'one',grades:['一年级'],groups:group(55),base:M.signature(data,'duration')});
 data=M.apply(data,{module:'duration',action:'save',id:'two',grades:['二年级'],groups:group(50),base:M.signature(data,'duration')});
 const teacher=data['一年级 1 班'][0];teacher.durationTeacherWeekdays=[0];teacher.durationRules[0].dailySettings[0].continuousMinutes=30;
 let stored=JSON.stringify(data),dialog,notices=[],calls=0;
 const error={textContent:''},number={value:'45'},selection={grades:['一年级'],days:[0,1,2,3,4]};
 const host={querySelectorAll:s=>(s.includes('data-item-grade')?selection.grades:selection.days).map(value=>({value:String(value)}))};
 const c={controlRules:R,schoolControlModel:M,controlData:data,controlDemoRole:'admin',controlModule:'duration',controlView:'module',controlLabels:{duration:'使用时长'},stage:'other',app:{innerHTML:''},header:t=>'<span></span><h2>'+t+'</h2>',syncReview(){},renderControl(){},enterAdminModule(){},crypto:require('node:crypto'),localStorage:{getItem:()=>stored,setItem:(k,v)=>stored=v},controlOverlay(title,body,actions){dialog={title,body,actions};calls++;},closeControlOverlay(){},controlToast:t=>notices.push(t),document:{getElementById:id=>id==='control-overlay'?host:['duration-item-number','school-create-number'].includes(id)?number:id==='duration-create-restMinutes'?{value:'15'}:id==='duration-create-dailyMinutes'?{value:'180'}:error,querySelector:s=>s.includes('create-permission')?{value:selection.permission}:null,querySelectorAll:()=>[]},addEventListener(){},setInterval(){}};
 c.parity={toggleTemporaryLock(){}};c.borrowing={temporary(){}};c.window=c;for(const file of ['control-school.js','control-duration-settings.js','control-school-create.js'])vm.runInNewContext(fs.readFileSync(require.resolve('./'+file),'utf8'),c);
 return {c,error,number,selection,get data(){return JSON.parse(stored);},set data(v){stored=JSON.stringify(v);},get stored(){return stored;},get dialog(){return dialog;},get calls(){return calls;},notices};
}
test('管理员时长使用新路由、两独立开关和单行规则；单项确认即保存且保护老师设置',()=>{
 const x=setup(),c=x.c;c.schoolControl.module('duration');
 assert.match(c.app.innerHTML,/duration-rule-lines/);assert.match(c.app.innerHTML,/默认规则/);assert.match(c.app.innerHTML,/全部自定义规则/);assert.equal((c.app.innerHTML.match(/role="switch"/g)||[]).length,2);assert.match(c.app.innerHTML,/>规则1</);assert.match(c.app.innerHTML,/>规则2</);
 c.schoolDurationUI.open('one');assert.doesNotMatch(c.app.innerHTML,/保存|school-rule-group/);assert.match(c.app.innerHTML,/选择星期/);assert.match(c.app.innerHTML,/55分钟/);
 const before=x.calls;c.schoolDurationUI.editField('continuousMinutes',0);x.number.value='45';c.schoolDurationUI.confirmField();assert.equal(x.calls,before+1);assert.equal(x.data.schoolSettings.adminPolicies.duration[0].groups[0].value.continuousMinutes,45);assert.equal(R.effectiveDuration(x.data['一年级 1 班'][0],0).continuousMinutes,30);assert.equal(R.effectiveDuration(x.data['一年级 1 班'][1],1).continuousMinutes,45);assert.match(c.app.innerHTML,/规则1/);
 c.schoolDurationUI.editField('dailyMinutes',0);const unchanged=x.stored;x.number.value='10';c.schoolDurationUI.confirmField();assert.equal(x.stored,unchanged);assert.match(x.error.textContent,/每日|累计/);c.schoolDurationUI.cancelField();
 c.schoolDurationUI.editField('restMinutes',0);x.number.value='25';c.schoolDurationUI.cancelField();assert.equal(x.stored,unchanged);
 c.schoolDurationUI.editField('restMinutes',0);const latest=x.data;latest.schoolSettings.durationRulesEnabled=false;x.data=latest;const conflict=x.stored;c.schoolDurationUI.confirmField();assert.equal(x.stored,conflict);assert.match(x.error.textContent,/其他人修改/);
});
test('默认与全部自定义开关分别执行，停用保留配置，老师规则仍生效',()=>{
 const x=setup(),c=x.c;c.schoolControl.module('duration');const policies=JSON.stringify(x.data.schoolSettings.adminPolicies.duration);
 c.schoolDurationUI.toggle('default',false);assert.equal(R.effectiveDuration(x.data['一年级 1 班'][1],6).limitsEnabled,false);assert.equal(R.effectiveDuration(x.data['一年级 1 班'][1],1).continuousMinutes,55);assert.equal(R.effectiveDuration(x.data['一年级 1 班'][0],0).continuousMinutes,30);
 c.schoolDurationUI.toggle('custom',false);assert.equal(R.effectiveDuration(x.data['一年级 1 班'][1],1).limitsEnabled,false);assert.equal(R.effectiveDuration(x.data['一年级 1 班'][0],0).continuousMinutes,30);assert.equal(JSON.stringify(x.data.schoolSettings.adminPolicies.duration),policies);
 c.schoolDurationUI.toggle('default',true);assert.equal(R.effectiveDuration(x.data['一年级 1 班'][1],1).continuousMinutes,60);c.schoolDurationUI.toggle('custom',true);assert.equal(R.effectiveDuration(x.data['一年级 1 班'][1],1).continuousMinutes,55);
 c.schoolDurationUI.toggle('custom',false);c.schoolDurationUI.open('one');c.schoolDurationUI.editField('continuousMinutes',0);assert.equal(x.notices.at(-1),'请先启用自定义规则');
});
test('已有时长单项确认，新建独立子页保存并进入详情，删除保留其他规则',()=>{
 const x=setup(),c=x.c;c.schoolControl.module('duration');c.schoolDurationUI.open('one');
 c.schoolDurationUI.editField('weekdays',0);x.selection.days=[0,1,2,3];c.schoolDurationUI.confirmField();assert.deepEqual(x.data.schoolSettings.adminPolicies.duration[0].groups[0].weekdays,[0,1,2,3]);
 c.schoolDurationUI.editField('addGroup');x.selection.days=[4,5,6];c.schoolDurationUI.confirmField();assert.equal(x.data.schoolSettings.adminPolicies.duration[0].groups.length,2);
 c.schoolDurationUI.editField('periods',0);const unchanged=x.stored;c.schoolDurationUI.period();c.schoolControl.cancelTime();assert.equal(x.dialog.title,'可用时段');assert.equal(x.stored,unchanged);
 c.schoolDurationUI.period();c.schoolControl.confirmTime();assert.equal(x.dialog.title,'可用时段');c.schoolDurationUI.confirmField();assert.deepEqual(x.data.schoolSettings.adminPolicies.duration[0].groups[0].value.periods,[{start:'08:00',end:'17:30'}]);
 c.schoolDurationUI.back();c.schoolDurationUI.create();assert.match(c.app.innerHTML,/新增使用时长规则/);choose(x,['三年级']);c.schoolRuleCreateUI.edit('continuousMinutes');x.number.value='40';c.schoolRuleCreateUI.confirmItem();c.schoolRuleCreateUI.save();assert.equal(x.data.schoolSettings.adminPolicies.duration.length,3);assert.match(c.app.innerHTML,/规则3/);assert.doesNotMatch(c.app.innerHTML,/保存/);
 c.schoolDurationUI.editField('delete');c.schoolDurationUI.confirmField();assert.equal(x.data.schoolSettings.adminPolicies.duration.length,2);
});

test('默认关闭时允许用60/15/180创建自定义限制，暂停的老师规则回到正确学校来源',()=>{const x=setup(),c=x.c;c.schoolControl.module('duration');c.schoolDurationUI.toggle('default',false);c.schoolDurationUI.create();choose(x,['三年级']);c.schoolRuleCreateUI.save();assert.equal(x.data.schoolSettings.adminPolicies.duration.length,3);assert.equal(R.effectiveDuration(x.data['三年级 1 班'][0],6).continuousMinutes,60);const d=x.data;d['一年级 1 班'][0].durationTeacherPaused=true;assert.equal(R.effectiveDuration(d['一年级 1 班'][0],0).continuousMinutes,55);assert.equal(R.effectiveDuration(d['一年级 1 班'][0],6).limitsEnabled,false);});

function choose(x,grades){const a=x.c.schoolRuleCreateUI;a.pickGrades();for(const grade of M.grades(x.data))a.selectGrade(grade,grades.includes(grade));a.confirmGrades();}
test('时长新增逐行设置，字段确认只回填草稿、取消不回填，最终保存保护老师与原规则',()=>{
 const x=setup(),c=x.c,a=c.schoolRuleCreateUI;c.schoolControl.module('duration');const before=x.stored;c.schoolDurationUI.create();assert.match(c.app.innerHTML,/school-create-form/);assert.doesNotMatch(c.app.innerHTML,/type="number"|type="checkbox"/);assert.match(c.app.innerHTML,/60分钟/);a.save();assert.match(c.app.innerHTML,/请选择可操作年级/);assert.equal(x.stored,before);
 a.pickGrades();assert.match(c.app.innerHTML,/value="一年级"[^>]*disabled/);a.selectGrade('一年级',true);a.selectGrade('三年级',true);a.searchGrades('三');a.cancelGrades();assert.match(c.app.innerHTML,/请选择年级/);choose(x,['三年级']);
 a.save();assert.equal(x.notices.at(-1),'已是默认规则，无需保存');assert.equal(x.stored,before);
 a.edit('continuousMinutes');x.number.value='55';a.cancelItem();assert.match(c.app.innerHTML,/60分钟/);a.edit('continuousMinutes');x.number.value='55';a.confirmItem();assert.match(c.app.innerHTML,/55分钟/);assert.equal(x.stored,before);
 a.edit('dailyMinutes');x.number.value='10';a.confirmItem();assert.match(x.dialog.body,/每日|累计/);a.cancelItem();
 a.edit('weekdays');x.selection.days=[0,1,2,3,4];a.confirmItem();a.addGroup();assert.match(c.app.innerHTML,/时段组2/);a.edit('weekdays',1);assert.match(x.dialog.body,/value="0"[^>]*disabled/);x.selection.days=[0,6];a.confirmItem();assert.match(x.dialog.body,/同一星期/);a.cancelItem();
 a.edit('periods',1);a.period();c.schoolControl.confirmTime();assert.equal(x.dialog.title,'可用时段');a.cancelItem();assert.doesNotMatch(c.app.innerHTML,/08:00/);a.edit('periods',1);a.period();c.schoolControl.cancelTime();assert.equal(x.dialog.title,'可用时段');a.period();c.schoolControl.confirmTime();a.confirmItem();assert.match(c.app.innerHTML,/08:00–17:30/);assert.equal(x.stored,before);
 a.cancel();assert.match(x.dialog.title,/放弃未保存/);a.continueEdit();assert.match(c.app.innerHTML,/55分钟/);a.save();assert.equal(x.data.schoolSettings.adminPolicies.duration.length,3);assert.equal(x.data.schoolSettings.adminPolicies.duration[2].groups.length,2);assert.equal(R.effectiveDuration(x.data['一年级 1 班'][0],0).continuousMinutes,30);assert.doesNotMatch(c.app.innerHTML,/school-create-form|>保存</);
});
test('智阅新增逐行权限设置、搜索选择与取消，保存一次创建，其他年级和老师权限保留',()=>{
 const x=setup(),c=x.c,a=c.schoolRuleCreateUI;c.schoolControl.module('homework');const before=x.stored;c.schoolControl.edit(-1);assert.match(c.app.innerHTML,/新增智阅作业规则/);assert.match(c.app.innerHTML,/查看答案/);assert.match(c.app.innerHTML,/查看详解/);assert.doesNotMatch(c.app.innerHTML,/type="radio"|type="checkbox"/);
 choose(x,['三年级']);a.save();assert.equal(x.notices.at(-1),'已是默认规则，无需保存');assert.equal(x.stored,before);
 a.edit('answer');assert.match(x.dialog.body,/school-permission-options/);x.selection.permission='true';a.cancelItem();assert.match(c.app.innerHTML,/查看答案<\/b><span>不允许/);a.edit('explanation');a.confirmItem();assert.match(c.app.innerHTML,/查看详解<\/b><span>允许/);assert.equal(x.stored,before);a.save();assert.equal(x.data.schoolSettings.adminPolicies.homework.length,1);assert.equal(x.data.schoolSettings.adminPolicies.homework[0].answer,false);assert.equal(x.data.schoolSettings.adminPolicies.homework[0].explanation,true);assert.doesNotMatch(c.app.innerHTML,/school-create-form/);
 c.schoolControl.edit(-1);a.pickGrades();assert.match(c.app.innerHTML,/value="三年级"[^>]*disabled/);a.cancelGrades();a.cancel();assert.equal(a.busy(),false);
});
test('新增选择或保存遇外部冲突、角色变化不覆盖，草稿可放弃',()=>{
 const x=setup(),c=x.c,a=c.schoolRuleCreateUI;c.schoolControl.module('homework');c.schoolControl.edit(-1);a.pickGrades();a.selectGrade('三年级',true);let d=x.data;x.data=M.apply(d,{module:'homework',id:'foreign',action:'save',grades:['三年级'],answer:true,explanation:true,base:M.signature(d,'homework')});const before=x.stored;a.confirmGrades();assert.match(c.app.innerHTML,/年级规则已变化/);assert.equal(x.stored,before);a.cancelGrades();choose(x,['二年级']);a.edit('answer');a.confirmItem();d=x.data;d.schoolSettings.adminPolicies.homework[0].explanation=false;x.data=d;const changed=x.stored;a.save();assert.match(c.app.innerHTML,/其他人修改/);assert.equal(x.stored,changed);c.controlDemoRole='teacher';a.save();assert.equal(x.stored,changed);c.controlDemoRole='admin';a.cancel();a.discard();assert.equal(a.busy(),false);
});
