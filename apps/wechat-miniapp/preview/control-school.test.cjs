const test=require('node:test'),assert=require('node:assert/strict'),M=require('./control-school-model'),R=require('./control-rules');
const roster=()=>({ '四年级 1 班':[{id:1,world:true,durationRules:[],homeworkSubjects:{数学:{answer:true,explanation:false}},teacherModified:{'homework:数学':true},updated:{}}], '五年级 1 班':[{id:2,world:true,durationRules:[],updated:{}}],schoolSettings:{}});
const op=(d,module,fields)=>({module,action:'save',grades:['四年级'],id:'r1',base:M.signature(d,module),scope:'all',...fields});
const group=(days,value=30)=>({weekdays:days,value:{continuousMinutes:value,restMinutes:15,dailyMinutes:180,periods:[]}});
test('每周全天可借、唯一规则与多选年级迁移整批校验',()=>{let d=roster();const rule=R.expandSettingGroups({id:'w',mode:'weekly'},[{weekdays:[0,1],value:{periods:[]}}],'borrowing');d=M.apply(d,op(d,'borrowing',{rule,grades:['四年级','五年级']}));assert.equal(d.schoolSettings.borrowing.classRules['五年级 1 班'][0].weekdays.length,2);assert.throws(()=>M.apply(d,op(d,'borrowing',{rule})),/已有/);const original={grades:['四年级','五年级'],ids:{'四年级 1 班':'w','五年级 1 班':'w'}};d=M.apply(d,op(d,'borrowing',{original,rule,grades:['五年级']}));assert.equal(d.schoolSettings.borrowing.classRules['四年级 1 班'].length,0);});
test('日期起始可保留过去，过期清理幂等持久化候选不改禁借',()=>{let d=roster();d=M.apply(d,op(d,'borrowing',{rule:{id:'d',mode:'dates',startDate:R.today(),endDate:'2099-01-01'}}));const rule={id:'d',mode:'dates',startDate:'2020-01-01',endDate:'2099-01-01'};d=M.apply(d,op(d,'borrowing',{rule,original:{grades:['四年级'],ids:{'四年级 1 班':'d'}}}));d.schoolSettings.borrowing.classBans['四年级 1 班']=true;const cleaned=M.clean(d,'2100-01-01');assert.equal(cleaned.changed,true);assert.equal(M.clean(cleaned.data,'2100-01-01').changed,false);assert.equal(cleaned.data.schoolSettings.borrowing.classBans['四年级 1 班'],true);});
test('时长保留老师星期，学校列表独立保存，删除恢复默认并保留老师',()=>{let d=roster();const st=d['四年级 1 班'][0];st.durationTeacherWeekdays=[0];const week=R.durationWeek(st);week.dailySettings[0].continuousMinutes=45;st.durationRules=[week];d=M.apply(d,op(d,'duration',{groups:[group([0,1])],scope:'all'}));assert.equal(R.effectiveDuration(d['四年级 1 班'][0],0).continuousMinutes,45);assert.equal(R.effectiveDuration(d['四年级 1 班'][0],1).continuousMinutes,30);assert.equal(d.schoolSettings.adminPolicies.duration[0].groups[0].value.continuousMinutes,30);const original=d.schoolSettings.adminPolicies.duration[0];d=M.apply(d,op(d,'duration',{action:'delete',original,scope:'all'}));assert.equal(R.effectiveDuration(d['四年级 1 班'][0],0).continuousMinutes,45);assert.equal(R.effectiveDuration(d['四年级 1 班'][0],1).continuousMinutes,60);});
test('时长纯默认不新增、无需选择修改方式、不同学校规则星期冲突拒绝',()=>{let d=roster();assert.throws(()=>M.apply(d,op(d,'duration',{groups:[group([0],60)]})),/默认/);assert.doesNotThrow(()=>M.apply(d,op(d,'duration',{groups:[group([0])],scope:null})));d=M.apply(d,op(d,'duration',{groups:[group([0])]}));assert.throws(()=>M.apply(d,op(d,'duration',{groups:[group([0],45)]})),/已有/);});
test('智阅保留老师逐科权限、默认无变更、删除回默认',()=>{let d=roster();assert.throws(()=>M.apply(d,op(d,'homework',{answer:false,explanation:false})),/无需重复保存/);d=M.apply(d,op(d,'homework',{answer:false,explanation:true,scope:'unmodified'}));assert.equal(d['四年级 1 班'][0].homeworkSubjects.数学.answer,true);assert.equal(d['四年级 1 班'][0].homeworkSubjects.语文.explanation,true);d=M.apply(d,op(d,'homework',{action:'delete',original:d.schoolSettings.adminPolicies.homework[0],scope:'all'}));assert.equal(d.schoolSettings.adminPolicies.homework.length,0);assert.equal(d['四年级 1 班'][0].homeworkSubjects.数学.answer,true);});
test('停止恢复及临时锁屏不改老师配置，版本冲突整批拒绝',()=>{let d=roster();d['四年级 1 班'][0].locked=true;d=M.apply(d,op(d,'lock',{action:'stop'}));assert.equal(d.schoolSettings.temporaryClassStates['四年级 1 班'],true);d=M.apply(d,op(d,'lock',{action:'resume'}));assert.equal(d['四年级 1 班'][0].locked,true);const pending=op(d,'world',{action:'stop'});d['五年级 1 班'].push({id:3,world:true});assert.throws(()=>M.apply(d,pending),/其他人/);});
test('编辑时长迁移年级移除旧范围，新增成员继承且只初始化一次',()=>{let d=roster();d=M.apply(d,op(d,'duration',{groups:[group([0,1])]}));const original=d.schoolSettings.adminPolicies.duration[0];d=M.apply(d,op(d,'duration',{original,grades:['五年级'],groups:[group([0,1],45)]}));assert.equal(R.effectiveDuration(d['四年级 1 班'][0],0).continuousMinutes,60);d['五年级 1 班'].push({id:3,durationRules:[],updated:{}});d=M.init(d);assert.equal(R.effectiveDuration(d['五年级 1 班'][1],0).continuousMinutes,45);assert.equal(M.init(d).schoolSettings.adminPolicies.roster.length,3);});
test('万象保留老师状态且只更新实际变化对象的版本',()=>{let d=roster();d['四年级 1 班'][0].worldSource='teacher';const before=R.signature(d['四年级 1 班'][0],'world');d=M.apply(d,op(d,'world',{action:'stop',scope:'all',grades:['四年级','五年级']}));assert.equal(d['四年级 1 班'][0].world,true);assert.equal(R.signature(d['四年级 1 班'][0],'world'),before);assert.equal(d['五年级 1 班'][0].world,false);});
test('手机停止借用选范围后一次确认执行，无修改返回不多弹窗且模块页无快捷tab',()=>{const fs=require('fs'),vm=require('vm');let stored=JSON.stringify(roster()),dialogs=0;const c={controlRules:R,schoolControlModel:M,controlData:roster(),controlDemoRole:'admin',controlView:'entry',controlModule:'borrowing',controlLabels:{borrowing:'借用',duration:'时长',world:'万象',lock:'锁屏',homework:'智阅'},app:{innerHTML:''},header:t=>'<span></span><h2>'+t+'</h2>',syncReview(){},renderControl(){},enterAdminModule(){},parity:{toggleTemporaryLock(){}},borrowing:{temporary(){}},crypto:require('crypto'),localStorage:{getItem:()=>stored,setItem:(k,v)=>stored=v},controlOverlay(){dialogs++;},closeControlOverlay(){},controlToast(){},document:{getElementById:()=>null},addEventListener(){},setInterval(){}};c.window=c;vm.runInNewContext(fs.readFileSync(require.resolve('./control-school.js'),'utf8'),c);c.schoolControl.module('borrowing');assert.match(c.app.innerHTML,/data-rule-mode="dates"/);assert.doesNotMatch(c.app.innerHTML,/data-rule-mode="weekly"/);assert.match(c.app.innerHTML,/暂无日期规则/);c.schoolControl.borrowTab('weekly');assert.match(c.app.innerHTML,/data-rule-mode="weekly"/);assert.doesNotMatch(c.app.innerHTML,/新增日期规则/);assert.match(c.app.innerHTML,/暂无每周规则/);c.schoolControl.action('stop','四年级');assert.equal(dialogs,1);c.schoolControl.save();assert.equal(dialogs,1);assert.equal(JSON.parse(stored).schoolSettings.borrowing.temporaryClasses['四年级 1 班'],true);c.schoolControl.module('duration');assert.doesNotMatch(c.app.innerHTML,/school-module-nav/);c.schoolControl.edit(-1);c.schoolControl.group(0);assert.equal((c.app.innerHTML.match(/data-school-group=/g)||[]).length,1);assert.doesNotMatch(c.app.innerHTML,/control-group-delete/);assert.doesNotMatch(c.app.innerHTML,/school-scope|本次如何修改|本次修改哪些学生|替换老师设置|填入默认设置/);c.schoolControl.cancel();assert.equal(dialogs,1);assert.doesNotMatch(c.app.innerHTML,/id="school-form"/);c.schoolControl.module('borrowing');c.schoolControl.edit(-1,'weekly');c.schoolControl.group(0);assert.equal((c.app.innerHTML.match(/data-school-group=/g)||[]).length,1);c.schoolControl.group();assert.equal((c.app.innerHTML.match(/data-school-group=/g)||[]).length,2);c.schoolControl.group(1);assert.equal((c.app.innerHTML.match(/data-school-group=/g)||[]).length,1);c.schoolControl.group(0);assert.equal((c.app.innerHTML.match(/data-school-group=/g)||[]).length,1);c.schoolControl.cancel();c.schoolControl.module('homework');assert.match(c.app.innerHTML,/设置权限/);});


test('管理员范围只有全校和年级，补齐九年级数据时保留旧班级与学生ID',()=>{
  const fs=require('node:fs'),vm=require('node:vm');
  const html=fs.readFileSync(require.resolve('./control-prototype.html'),'utf8');
  const line=prefix=>html.split('\n').find(l=>l.trim().startsWith(prefix));
  const original=Array.from({length:42},(_,i)=>({id:4001+i,name:'原学生',world:false}));
  const c={controlData:{'五年级 2 班':original},controlDemoRole:'admin',controlWorkView:'school',controlEntryGrade:'',controlEntryClass:'四年级 1 班',selectedTeacherClass:'五年级 2 班',renderControl(){},controlClasses:['五年级 2 班'],controlStudents:()=>original};
  vm.createContext(c);
  vm.runInContext([line('const schoolGradeOrder='),line('const schoolControlClasses='),line('schoolControlClasses.forEach((name,c)=>'),line('const schoolGrades=')].join('\n'),c);
  const scope=html.slice(html.indexOf('    function controlEntryScopeName()'),html.indexOf("    document.addEventListener('click',event=>document.querySelectorAll('.control-workbench-tools"));
  vm.runInContext(scope,c);
  assert.equal(c.controlData['五年级 2 班'],original);
  assert.equal(original[0].id,4001);assert.equal(original[0].world,false);
  assert.deepEqual(Array.from(M.grades(c.controlData)),['一年级','二年级','三年级','四年级','五年级','六年级','七年级','八年级','九年级']);
  const all=Object.values(c.controlData).flat();assert.equal(new Set(all.map(s=>s.id)).size,all.length);
  assert.equal(c.controlEntryScopeName(),'全校');assert.equal(c.controlEntryStudents().length,all.length);
  const menu=c.controlScopeSwitcher();assert.doesNotMatch(menu,/全部班级|selectControlEntryClass/);assert.match(menu,/一年级/);assert.match(menu,/九年级/);
  c.selectControlEntryClass('九年级 2 班');assert.equal(c.controlEntryScopeName(),'九年级');assert.equal(c.controlEntryClass,'');assert.equal(c.controlEntryStudents().length,80);
  c.controlWorkView='subject';c.controlDemoRole='teacher';assert.match(c.controlScopeSwitcher(),/changeControlClass/);
});


test('年级右侧解除只预选该年级，部分班级锁屏也可解除',()=>{
 const fs=require('node:fs'),vm=require('node:vm');let d=roster();d['四年级 2 班']=[{id:3,world:true}];d=M.init(d);d.schoolSettings.temporaryClassStates={'四年级 1 班':true,'四年级 2 班':false,'五年级 1 班':true};let stored=JSON.stringify(d);
 const c={controlRules:R,schoolControlModel:M,controlData:d,controlDemoRole:'admin',controlView:'entry',controlModule:'lock',controlLabels:{lock:'锁屏'},app:{innerHTML:''},header:t=>'<span></span><h2>'+t+'</h2>',syncReview(){},renderControl(){},enterAdminModule(){},parity:{toggleTemporaryLock(){}},borrowing:{temporary(){}},crypto:require('crypto'),localStorage:{getItem:()=>stored,setItem:(k,v)=>stored=v},controlOverlay(){},closeControlOverlay(){},controlToast(){},document:{getElementById:()=>null},addEventListener(){},setInterval(){}};c.window=c;
 vm.runInNewContext(fs.readFileSync(require.resolve('./control-school.js'),'utf8'),c);c.schoolControl.module('lock');
 assert.match(c.app.innerHTML,/已临时锁屏/);assert.ok(c.app.innerHTML.includes("openAction('lock','resume')"));assert.doesNotMatch(c.app.innerHTML,/school-grade-status/);assert.match(c.app.innerHTML,/部分班级/);
 c.schoolControl.action('resume','四年级');c.schoolControl.save();
 const after=JSON.parse(stored);assert.equal(after.schoolSettings.temporaryClassStates['四年级 1 班'],false);assert.equal(after.schoolSettings.temporaryClassStates['五年级 1 班'],true);
 c.schoolControl.module('duration');assert.ok(c.app.innerHTML.indexOf('school-default-panel')<c.app.innerHTML.indexOf('规则列表'));
 c.schoolControl.module('homework');assert.ok(c.app.innerHTML.indexOf('school-default-panel')<c.app.innerHTML.indexOf('规则列表'));
});


test('首页只有状态切换大按钮，年级弹窗可取消或保存且保存后留在首页',()=>{
 const fs=require('node:fs'),vm=require('node:vm');let d=M.init(roster()),stored=JSON.stringify(d),writes=0,dialog;
 const c={controlRules:R,schoolControlModel:M,controlData:d,controlDemoRole:'admin',controlView:'entry',controlModule:'lock',controlLabels:{lock:'锁屏'},app:{innerHTML:''},header:t=>'<span></span><h2>'+t+'</h2>',syncReview(){},renderControl(){},enterAdminModule(){},parity:{toggleTemporaryLock(){}},borrowing:{temporary(){}},crypto:require('crypto'),localStorage:{getItem:()=>stored,setItem:(k,v)=>{stored=v;writes++;}},controlOverlay:(title,body,footer)=>dialog={title,body,footer},closeControlOverlay(){},controlToast(){},document:{getElementById:()=>null},addEventListener(){},setInterval(){}};c.window=c;
 vm.runInNewContext(fs.readFileSync(require.resolve('./control-school.js'),'utf8'),c);
 assert.match(c.schoolControl.entryCard('lock'),/全校临时锁屏/);assert.match(c.schoolControl.entryCard('borrowing'),/全校停止借用/);c.schoolControl.openAction('lock','stop');assert.equal(c.controlView,'entry');assert.equal(dialog.title,'临时锁屏');assert.match(dialog.body,/四年级/);assert.match(dialog.footer,/保存设置/);c.schoolControl.cancel();assert.equal(writes,0);
 c.schoolControl.openAction('lock','stop');c.schoolControl.all(true);c.schoolControl.save();assert.equal(c.controlView,'entry');assert.equal(JSON.parse(stored).schoolSettings.temporaryClassStates['四年级 1 班'],true);assert.doesNotMatch(c.schoolControl.entryCard('lock'),/school-entry-status|四年级、五年级/);assert.match(c.schoolControl.entryCard('lock'),/全校解除临时锁屏/);c.schoolControl.openAction('lock','stop');assert.doesNotMatch(dialog.body,/data-school-grade/);assert.doesNotMatch(dialog.body,/school-action-options/);c.schoolControl.cancel();c.schoolControl.openAction('lock','resume');assert.match(dialog.body,/value="四年级"/);assert.match(dialog.body,/value="五年级"/);assert.match(dialog.body,/ checked[ >]/);c.schoolControl.cancel();
 c.schoolControl.openAction('borrowing','stop');c.schoolControl.all(true);c.schoolControl.save();assert.doesNotMatch(c.schoolControl.entryCard('borrowing'),/school-entry-status|四年级、五年级/);assert.match(c.schoolControl.entryCard('borrowing'),/全校恢复借用/);stored=JSON.stringify(M.apply(JSON.parse(stored),op(JSON.parse(stored),'lock',{action:'resume',grades:['四年级']})));assert.match(c.schoolControl.entryCard('lock'),/全校临时锁屏/);assert.doesNotMatch(c.schoolControl.entryCard('lock'),/全校解除临时锁屏/);stored=JSON.stringify(M.apply(JSON.parse(stored),op(JSON.parse(stored),'borrowing',{action:'resume',grades:['四年级']})));assert.match(c.schoolControl.entryCard('borrowing'),/全校停止借用/);c.schoolControl.module('lock');assert.match(c.app.innerHTML,/school-entry-status/);assert.match(c.app.innerHTML,/五年级/);const worldData=JSON.parse(stored);worldData['四年级 1 班'][0].world=true;worldData['四年级 1 班'][0].worldSource='teacher';worldData['五年级 1 班'][0].world=false;stored=JSON.stringify(worldData);c.schoolControl.module('world');assert.doesNotMatch(c.app.innerHTML,/school-grade-status/);assert.match(c.app.innerHTML,/school-entry-status/);c.schoolControl.openAction('world','resume');assert.match(dialog.title,/恢复使用万象视界/);assert.match(dialog.body,/value="五年级"/);assert.doesNotMatch(dialog.body,/value="四年级"/);c.schoolControl.save();assert.equal(JSON.parse(stored)['五年级 1 班'][0].world,true);assert.equal(JSON.parse(stored)['四年级 1 班'][0].worldSource,'teacher');
});


test('学校编辑迁移及恢复默认保留老师班级模板与逐日时长',()=>{
 let d=roster();const teacher=R.durationWeek({durationRules:[]});teacher.dailySettings[0].continuousMinutes=45;
 d.schoolSettings.durationClasses={'四年级 1 班':R.copy(teacher)};d['四年级 1 班'][0].durationRules=[R.copy(teacher)];d['四年级 1 班'][0].durationTeacherWeekdays=[0];
 d=M.apply(d,op(d,'duration',{groups:[group([0,1])],scope:'all'}));let original=d.schoolSettings.adminPolicies.duration[0];
 d=M.apply(d,op(d,'duration',{original,groups:[group([0,1],60)],scope:'all'}));original=d.schoolSettings.adminPolicies.duration[0];
 d=M.apply(d,op(d,'duration',{action:'delete',original,scope:'all'}));
 assert.deepEqual(d.schoolSettings.durationClasses['四年级 1 班'],teacher);assert.equal(R.effectiveDuration(d['四年级 1 班'][0],0).continuousMinutes,45);assert.equal(R.effectiveDuration(d['四年级 1 班'][0],1).continuousMinutes,60);assert.deepEqual(d['四年级 1 班'][0].durationTeacherWeekdays,[0]);
});


test('默认规则保存提示统一，已有自定义可恢复默认但不可重复保存默认',()=>{
 let d=roster();for(const module of ['duration','homework'])assert.throws(()=>M.apply(d,op(d,module,module==='duration'?{groups:[group([0],60)]}:{answer:false,explanation:false})),{message:'已是默认规则，无需重复保存'});
 d=M.apply(d,op(d,'duration',{groups:[group([0])]}));let original=d.schoolSettings.adminPolicies.duration[0];d=M.apply(d,op(d,'duration',{original,groups:[group([0],60)]}));original=d.schoolSettings.adminPolicies.duration[0];assert.throws(()=>M.apply(d,op(d,'duration',{original,groups:[group([0],60)]})),{message:'已是默认规则，无需重复保存'});
});


test('同效时长跨分组顺序合并年级并可整组删除，不同星期不合并',()=>{
 let d=roster();d=M.apply(d,op(d,'duration',{groups:[group([0,1])] }));d=M.apply(d,op(d,'duration',{id:'r2',grades:['五年级'],groups:[group([1]),group([0])] }));
 assert.equal(d.schoolSettings.adminPolicies.duration.length,1);assert.deepEqual(d.schoolSettings.adminPolicies.duration[0].grades,['四年级','五年级']);
 const original=d.schoolSettings.adminPolicies.duration[0];d=M.apply(d,op(d,'duration',{action:'delete',original,grades:original.grades}));assert.equal(d.schoolSettings.adminPolicies.duration.length,0);assert.equal(R.effectiveDuration(d['五年级 1 班'][0],0).continuousMinutes,60);
 assert.notEqual(M.durationKey([group([0,1])]),M.durationKey([group([0,1,2])]));
});
test('同效借用忽略ID及字段顺序，日期和星期或时段不同时不合并',()=>{
 const a=R.expandSettingGroups({id:'a',mode:'weekly'},[{weekdays:[0,1],value:{periods:[{start:'08:00',end:'10:00'}]}}],'borrowing');
 const b=R.expandSettingGroups({mode:'weekly',id:'b'},[{weekdays:[1],value:{periods:[{end:'10:00',start:'08:00'}]}},{weekdays:[0],value:{periods:[{start:'08:00',end:'10:00'}]}}],'borrowing');
 assert.equal(M.borrowKey(a),M.borrowKey(b));assert.notEqual(M.borrowKey(a),M.borrowKey({...b,weekdays:[0]}));assert.notEqual(M.borrowKey({mode:'dates',startDate:'2026-11-05',endDate:'2026-11-06'}),M.borrowKey({mode:'dates',startDate:'2026-11-05',endDate:'2026-11-07'}));
});


test('全部年级已有规则时新增直接提示且保留列表，已有规则仍可编辑',()=>{
 const fs=require('node:fs'),vm=require('node:vm');
 for(const module of ['duration','homework','borrowing']){
  let d=roster();const fields=module==='duration'?{groups:[group([0])]}:module==='homework'?{answer:true,explanation:true}:{rule:R.expandSettingGroups({id:'weekly',mode:'weekly'},[{weekdays:[0],value:{periods:[]}}],'borrowing')};d=M.apply(d,op(d,module,{grades:['四年级','五年级'],...fields}));let stored=JSON.stringify(d),toast='';
  const c={controlRules:R,schoolControlModel:M,controlData:d,controlDemoRole:'admin',controlView:'entry',controlModule:module,controlLabels:{},app:{innerHTML:''},header:t=>'<span></span><h2>'+t+'</h2>',syncReview(){},renderControl(){},enterAdminModule(){},parity:{toggleTemporaryLock(){}},borrowing:{temporary(){}},crypto:require('crypto'),localStorage:{getItem:()=>stored,setItem:(k,v)=>stored=v},controlOverlay(){},closeControlOverlay(){},controlToast:t=>toast=t,document:{getElementById:()=>null},addEventListener(){},setInterval(){}};c.window=c;vm.runInNewContext(fs.readFileSync(require.resolve('./control-school.js'),'utf8'),c);
  c.schoolControl.module(module);const before=c.app.innerHTML;c.schoolControl.edit(-1,module==='borrowing'?'weekly':undefined);assert.equal(toast,'全部年级已有规则，请编辑或删除后新增');assert.equal(c.app.innerHTML,before);assert.doesNotMatch(c.app.innerHTML,/id="school-form"/);c.schoolControl.edit(0);assert.match(c.app.innerHTML,/id="school-form"/);
 }
});
