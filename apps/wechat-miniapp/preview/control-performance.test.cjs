const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const R=require('./control-rules.js'),M=require('./control-school-model.js');
test('年级勾选及全选不重建弹窗，保持焦点所在的控件',()=>{
 let stored,dialogs=0;
 const inputs=[{value:'四年级',checked:true},{value:'五年级',checked:true}],all={checked:true},save={disabled:false};
 const root={querySelectorAll(selector){return selector==='[data-school-grade]:checked'?inputs.filter(i=>i.checked):selector==='[data-school-grade]'?inputs:[];},querySelector(){return all;}};
 const d=M.init({'四年级 1 班':[{id:1,world:true}],'五年级 1 班':[{id:2,world:true}]});
 const c={controlRules:R,schoolControlModel:M,controlData:d,controlDemoRole:'admin',controlView:'entry',controlModule:'lock',controlLabels:{},app:{innerHTML:''},header:t=>'<span></span><h2>'+t+'</h2>',syncReview(){},renderControl(){},enterAdminModule(){},parity:{toggleTemporaryLock(){}},borrowing:{temporary(){}},crypto:require('crypto'),localStorage:{getItem:()=>stored||JSON.stringify(d),setItem:(k,v)=>stored=v},controlOverlay(){dialogs++;},closeControlOverlay(){},controlToast(){},document:{getElementById:()=>root,querySelector:s=>s.includes('control-primary')?save:null},addEventListener(){},setInterval(){}};c.window=c;
 vm.runInNewContext(fs.readFileSync(require.resolve('./control-school.js'),'utf8'),c);
 c.schoolControl.action('stop');assert.equal(dialogs,1);
 inputs[0].checked=false;c.schoolControl.changed();assert.equal(dialogs,1);assert.equal(all.checked,false);assert.equal(save.disabled,false);
 inputs[1].checked=false;c.schoolControl.changed();assert.equal(save.disabled,true);assert.equal(dialogs,1);
 c.schoolControl.all(true);assert.ok(inputs.every(i=>i.checked));assert.equal(all.checked,true);assert.equal(save.disabled,false);assert.equal(dialogs,1);
});
test('清理后的入口脚本可编译，基础页面无重复的渲染函数声明',()=>{
 const html=fs.readFileSync(require.resolve('./control-prototype.html'),'utf8');
 for(const name of ['renderControlRows','renderControlDetailRows'])assert.equal((html.match(new RegExp('function '+name+'\\(','g'))||[]).length,1);
 for(const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(match[1]);
});
test('后台刷新同日不扫描，跨页变更编辑期间延后且只重绘一次',()=>{
 const source=fs.readFileSync(require.resolve('./control-parity.js'),'utf8');
 const start=source.indexOf('  const borrowStates ='),end=source.indexOf("  if (window.controlPrototypeReady",start);
 let reads=0,renders=0,stored={班级:[]},busy=false,day='2026-11-05';const events={},timers=[];
 const c={storageKey:'teacher-control-prototype-v1',R:{today:()=>day,borrowStatus:()=>''},schoolControlClasses:['班级'],controlData:{班级:[]},stage:'teacherDesk',teacherTab:'control',ui:{},document:{hidden:false,querySelector:()=>null},loadLatest(){reads++;return structuredClone(stored);},setInterval(fn,ms){timers.push({fn,ms});}};c.window={addEventListener:(name,fn)=>events[name]=fn,renderControl:()=>renders++,schoolControl:{busy:()=>busy}};
 vm.runInNewContext(source.slice(start,end),c);
 assert.equal(timers[0].ms,60000);for(let i=0;i<60;i++)timers[0].fn();assert.equal(reads,0);assert.equal(renders,0);
 events.focus();assert.equal(reads,1);assert.equal(renders,0);
 busy=true;stored={班级:[],changed:true};events.storage({key:'teacher-control-prototype-v1'});assert.equal(reads,1);
 busy=false;timers[0].fn();assert.equal(reads,2);assert.equal(renders,1);timers[0].fn();assert.equal(renders,1);
 day='2026-11-06';timers[0].fn();assert.equal(reads,3);assert.equal(renders,1);
});

test('管控首屏等待模块接管，初始化期间不调用旧版渲染',()=>{
 const html=fs.readFileSync(require.resolve('./control-prototype.html'),'utf8');
 assert.doesNotMatch(html,/function (renderControl|renderAdminControl)\(/);
 const start=html.indexOf('    window.controlPrototypeReady=false;');
 const boot=html.slice(start,html.indexOf('</script>',start));
 let legacy=0,current=0;
 const c={stage:'teacherDesk',teacherTab:'control',restoreDefaultTeacherPageOnReload:()=>false,restoreDemoTeacherOnLaunch(){},document:{querySelectorAll:()=>[]},teacherDesk(){c.window.renderControl();},renderControl:()=>legacy++};c.window=c;
 for(const name of ['home','auth','code','confirm','pending','approved','teacherLaunch','teacherLogin','teacherPhoneLogin','teacherBind','teacherSecurity'])c[name]=()=>{};
 vm.runInNewContext(boot,c);assert.equal(legacy,0);assert.equal(c.controlPrototypeReady,false);
 for(const file of ['control-parity.js','control-borrowing.js','control-school.js']){
  const source=fs.readFileSync(require.resolve('./'+file),'utf8');
  const trigger=source.split('\n').find(line=>line.includes('controlPrototypeReady')&&line.includes('renderControl();'));
  assert.ok(trigger,file+' must defer startup');vm.runInNewContext(trigger,c);
 }
 assert.equal(legacy,0);
 c.renderControl=()=>current++;c.startControlPrototype();assert.equal(current,1);assert.equal(legacy,0);
 assert.ok(html.indexOf('src="control-school.js')<html.indexOf('<script>window.startControlPrototype();'));
 assert.ok(html.indexOf('href="control-homework-ui.css')<html.indexOf('<script>window.startControlPrototype();'));
});

test('管控四Tab导航保留职责范围，其他Tab委托给原工作台且刷新不重置',()=>{
 const html=fs.readFileSync(require.resolve('./control-prototype.html'),'utf8');
 const navigation=html.slice(html.indexOf('    function teacherTabBar()'),html.indexOf('    // 跳转后由管控页展示'));
 for(const view of ['school','homeroom','subject']){
  const navigated=[],c={URL,params:new URLSearchParams('review=1&classId=c2&availability=noStudents'),controlWorkView:view,controlDemoRole:view==='school'?'admin':'teacher',teacherTab:'control',stage:'teacherDesk',location:{href:'http://localhost/control-prototype.html',assign:url=>navigated.push(new URL(url))}};
  vm.runInNewContext(navigation,c);
  const labels=[...c.teacherTabBar().matchAll(/<span>([^<]+)<\/span>/g)].map(m=>m[1]);assert.deepEqual(labels,['学情','作业','管控','我的']);
  for(const tab of ['learning','homework','mine']){
   c.teacherTab='control';c.switchTeacherTab(tab);const url=navigated.at(-1);
   assert.equal(url.pathname,'/index.html');assert.equal(url.searchParams.get('tab'),tab);assert.equal(url.searchParams.get('workView'),view);assert.equal(url.searchParams.get('classId'),view==='school'?'all':view==='subject'?'c2':'c1');assert.equal(url.searchParams.get('review'),'1');assert.equal(url.searchParams.get('availability'),'noStudents');
  }
 }
 assert.doesNotMatch(html,/function renderAdminControl\(|function renderControl\(|restoreDefaultTeacherPageOnReload/);
});
test('首屏必须等演示台布局及主题初始化后才显示',()=>{
 const html=fs.readFileSync(require.resolve('./control-prototype.html'),'utf8');
 assert.match(html,/<html[^>]+class="control-initializing"/);
 assert.match(html,/html\.control-initializing body\s*\{visibility:hidden;/);
 assert.ok(html.indexOf('<script defer blocking="render" src="demo-workspace.js')<html.indexOf('</head>'));
 assert.equal((html.match(/src="demo-workspace.js/g)||[]).length,1);
 const script=[...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]).find(s=>s.includes("classList.remove('control-initializing')"));
 let callback,revealed=0;
 vm.runInNewContext(script,{document:{addEventListener(event,fn,options){assert.equal(event,'DOMContentLoaded');assert.equal(options.once,true);callback=fn;},documentElement:{classList:{remove(name){assert.equal(name,'control-initializing');revealed++;}}}}});
 assert.equal(revealed,0);callback();assert.equal(revealed,1);
});
test('时长步进按钮支持直接输入、每次一分且不低于一分',()=>{
 const source=fs.readFileSync(require.resolve('./control-parity.js'),'utf8'),start=source.indexOf('window.controlDurationInput='),end=source.indexOf('(() => {',start);let events=0;const minus={disabled:false};
 const input={value:'60',min:'1',get valueAsNumber(){return this.value===''?NaN:Number(this.value);},stepUp(){this.value=String(Number(this.value)+1);},stepDown(){this.value=String(Math.max(1,Number(this.value)-1));},closest(){return stepper;},dispatchEvent(event){assert.equal(event.type,'input');assert.equal(event.bubbles,true);events++;}};
 const stepper={querySelector:s=>s==='input'?input:minus},button={closest:()=>stepper};const c={Event:class{constructor(type,options){this.type=type;this.bubbles=options.bubbles;}}};c.window=c;
 vm.runInNewContext(source.slice(start,end),c);c.controlDurationStep(button,1);assert.equal(input.value,'61');c.controlDurationStep(button,-1);assert.equal(input.value,'60');input.value='1';c.controlDurationInput(input);assert.equal(minus.disabled,true);c.controlDurationStep(button,-1);assert.equal(input.value,'1');input.value='90';c.controlDurationInput(input);assert.equal(minus.disabled,false);input.value='';c.controlDurationStep(button,1);assert.equal(input.value,'1');assert.equal(events,4);
});
