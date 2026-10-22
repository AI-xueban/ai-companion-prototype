/* The existing controllers own business behavior. This shell only routes review tools. */
window.demoWorkspace = (() => {
  // Login restoration can replace the address before this script runs. Keep the original review request.
  const query = new URLSearchParams(typeof params!=='undefined'?params.toString():location.search);
  const enabled = query.get('review') === '1';
  const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const entry = (id,label,kind,value,extra={}) => ({id,label,kind,value,...extra});
  const parentLogin = [entry('p-first','首次登录与绑定','parent','first'),entry('p-returning','再次登录','parent','returning'),entry('p-device','换设备登录','parent','otherDevice'),entry('p-second','第二位家长申请','parent','second'),entry('p-full','绑定人数已满','parent','seventh'),entry('p-wechat','找回：原微信丢失','parent','lostWechat'),entry('p-phone','找回：手机号丢失','parent','lostPhone'),entry('p-both','找回：两者都丢失','parent','bothLost')];
  const teacherLogin = [entry('t-first','首次登录与绑定微信','teacher','first'),entry('t-returning','再次登录','teacher','returning'),entry('t-device','换设备登录','teacher','otherDevice'),entry('t-expired','会话过期恢复','teacher','expired'),entry('t-replace','更换绑定微信','teacher','replace')];
  const catalog = [
    {id:'login',label:'登录与绑定',roles:[{id:'parent',label:'家长',items:parentLogin},{id:'teacher',label:'教师',items:teacherLogin}]},
    {id:'learning',label:'学情',items:[entry('learn-parent','孩子学情','parentTab','learning'),entry('learn-subject','任教学情','learning','subject'),entry('learn-class','班主任学情','learning','homeroom'),entry('learn-school','学校学情','learning','school'),entry('learn-students','学生学情','learning','students')]},
    {id:'homework',label:'作业与打卡',items:[entry('hw-new-flow','新版作业批改体验','homeworkExperience','new'),entry('hw-new-teacher','继续教师处理','homeworkCurrent','teacher'),entry('hw-new-parent','查看家长同步结果','homeworkCurrent','parent'),entry('hw-list','教师作业列表','homework','teacher'),entry('hw-publish','发布作业／打卡','homework','publish'),entry('hw-parent','家长提交与结果','homework','parent'),entry('hw-answers','参考答案独立维护','homeworkState','answerConflict'),entry('hw-answer-review','修改参考答案','homeworkState','answerChanged'),entry('hw-review','批改与复核','homeworkState','review'),entry('hw-release','结果同步与查看','homeworkState','unreleased'),entry('hw-flow','体验完整流程','flow','homework'),entry('hw-lab','专项参考：独立全流程','reference','homework-flow-lab.html')]},
    {id:'control',label:'管控',items:[entry('ctl-teacher','教师管控','control','teacher'),entry('ctl-admin','学校管理员管控','control','admin'),...Object.entries({borrowing:'借用管控',duration:'使用时长管控',homework:'智阅作业权限',world:'万象视界',lock:'锁屏'}).map(([key,label])=>entry('ctl-'+key,label,'controlModule',key))]},
    {id:'mine',label:'我的',roles:[{id:'parent',label:'家长',items:[entry('mine-parent','我的首页','parentTab','mine'),entry('mine-children','孩子与绑定关系','parentChildren','mine'),entry('mine-unbind','解绑孩子','parent','wrong'),entry('mine-two','两个孩子','parent','twoChildren'),entry('mine-family','家长管理','parent','familyManage'),entry('mine-ordinary','普通家长权限','parent','ordinary'),entry('mine-security','账号与安全','parentSecurity','mine')]},{id:'teacher',label:'教师',items:[entry('mine-teacher','我的首页','teacherTab','mine'),entry('mine-teacher-security','账号与安全','teacherSecurity','mine')]}]}
  ];
  const entries = catalog.flatMap(g=>g.roles?g.roles.flatMap(r=>r.items):g.items);
  let selected='', activeFlow='',flowRole='',stateInfo=null;
  const loginUiKey='twj-review-login-ui';
  let loginUiMode=(()=>{try{return sessionStorage.getItem(loginUiKey)==='legacy'?'legacy':'new';}catch{return 'new';}})();
  const isControl = () => location.pathname.endsWith('control-prototype.html');
  const get = id => document.getElementById(id);
  const button = item => `<button data-dw-entry="${item.id}" class="${item.kind==='flow'?'dw-full-flow':''}" type="button">${esc(item.label)}</button>`;
  function revealEntry(id){const target=document.querySelector(`[data-dw-entry="${id}"]`);for(let node=target?.parentElement;node&&node.id!=='demo-workspace';node=node.parentElement)if(node.tagName==='DETAILS')node.open=true;}
  function mainRoute(id) { const url=new URL('index.html',location.href);url.search='';url.searchParams.set('review','1');url.searchParams.set('demo',id);location.assign(url.href); }
  function parentReady() { if(!parentPrototype.hasGuardianAccess())parentPrototype.scenario('twoChildren');go('parent'); }
  function teacherReady(){if(teacherAvailability!=='normal')setTeacherAvailability('normal');teacherBranch='normal';go('teacherDesk');}
  function select(id){
    const item=entries.find(e=>e.id===id);if(!item)return;
    if(isControl()&&!['control','controlModule'].includes(item.kind)){mainRoute(id);return;}
    window.pageDemoTools?.restore();selected=id;activeFlow='';flowRole='';document.body.classList.remove('dw-flow-open');
    if(item.kind==='parent'){activeFlow='parent';flowRole='parent';parentPrototype.scenario(item.value);if(item.id==='mine-two')parentPrototype.tab('mine');if(innerWidth>1000)document.body.classList.add('dw-flow-open');}
    else if(item.kind==='teacher'){activeFlow='teacher';flowRole='teacher';startTeacherFlow(item.value);if(innerWidth>1000)document.body.classList.add('dw-flow-open');}
    else if(item.kind==='parentTab'||item.kind==='parentSecurity'){parentReady();parentPrototype.tab(item.value);if(item.kind==='parentSecurity')document.querySelector('#app .parent-main .parent-card:last-of-type')?.scrollIntoView({block:'center'});}
    else if(item.kind==='parentChildren'){parentReady();parentPrototype.tab('mine');parentPrototype.openChildDetail(parentPrototype.getDemoContext().childIndex);}
    else if(item.kind==='teacherTab'){teacherReady();switchTeacherTab(item.value);}
    else if(item.kind==='teacherSecurity'){teacherReady();teacherTab='mine';go('teacherSecurity');}
    else if(item.kind==='learning'){teacherReady();workbenchPrototype.demoIdentity('all');workbenchPrototype.view(item.value==='students'?'subject':item.value);teacherTab='learning';go('teacherDesk');if(item.value==='students')workbenchPrototype.tab('students');}
    else if(item.kind==='homework'){if(item.value==='parent'){parentReady();homeworkPrototype.resetParentView();parentPrototype.tab('homework');}else if(item.value==='publish')startHomeworkPublishDemo();else showHomeworkTeacherDemo();}
    else if(item.kind==='homeworkCurrent'){activeFlow='homework';homeworkDemoConsole.role(item.value,true,item.value==='parent');}
    else if(item.kind==='homeworkExperience'){activeFlow='homework';homeworkDemoConsole.role('teacher',false);homeworkPrototype.prepareWorkflowExperience();}
    else if(item.kind==='homeworkState'){activeFlow='homework';homeworkDemoConsole.role('teacher',false);homeworkDemoConsole.start(item.value);}
    else if(item.kind==='flow'){activeFlow='homework';flowRole='teacher';homeworkDemoConsole.publish();if(innerWidth>1000)document.body.classList.add('dw-flow-open');}
    else if(item.kind==='reference'){location.assign(new URL(item.value,location.href));return;}
    else if(item.kind==='control'||item.kind==='controlModule'){
      if(!isControl()){const url=new URL('control-prototype.html',location.href);url.search='?review=1&page=teacherDesk&tab=control&identity=all';url.searchParams.set('demo',id);location.assign(url.href);return;}
      if(item.kind==='control')switchControlDemoRole(item.value);else{teacherTab='control';stage='teacherDesk';openControlModule(item.value);}
    }
    revealEntry(id);sync();
  }
  function syncFlow(){
    if(!enabled||!get('dw-flow-body'))return;
    const parent=typeof stage!=='undefined'&&stage==='parent';
    const hw=window.homeworkDemoConsole?.isActive();
    let title='当前流程',html='';
    if(activeFlow==='homework'&&hw){title='作业完整流程';const pane=get('homework-demo-pane');if(pane){const copy=pane.cloneNode(true);copy.querySelectorAll('[data-workspace-duplicate]').forEach(e=>e.remove());html=copy.innerHTML;}html+='<details><summary>跳转流程节点</summary>'+[['answerConflict','参考答案独立维护'],['answerChanged','修改参考答案'],['published','未提交'],['partial','部分提交'],['queued','等待批改'],['processing','正在批改'],['partialGrade','部分完成'],['failed','批改失败'],['review','待复核'],['unreleased','结果已同步'],['partialRelease','部分结果可见'],['released','全部批改完成'],['resubmit','重新提交'],['changed','人工纠正已同步'],['late','逾期可补交'],['closed','补交已结束']].map(([id,label])=>`<button data-homework-state="${id}" onclick="homeworkDemoConsole.start('${id}')">${label}</button>`).join('')+'</details>';}
    else if(parent&&activeFlow==='parent'){title='家长流程';html=['parent-review-context','parent-review-steps','parent-review-actions'].map(id=>{const node=get(id);return node?`<${node.tagName.toLowerCase()}>${node.innerHTML}</${node.tagName.toLowerCase()}>`:''}).join('');html+=`<details><summary>演示数据</summary>${get('parent-review-detail')?.innerHTML||''}</details>`;}
    else if(!parent&&activeFlow==='teacher'){title='教师登录流程';html=`<ol>${get('teacher-review-steps')?.innerHTML||''}</ol><div id="dw-flow-actions">${get('teacher-review-action')?.innerHTML||''}</div><p>${get('teacher-review-detail')?.innerHTML||''}</p><details><summary>演示账号</summary><p>手机号：13800138000<br>验证码：123456<br>密码：123456</p></details>`;}
    else{html='<p>从左侧选择登录场景，或进入“作业与打卡”体验完整流程。</p>';}
    get('dw-flow-title').textContent=title;
    const extra=activeFlow&&activeFlow!=='homework'?'<button type="button" onclick="demoWorkspace.restart()">重启本流程</button><details><summary>清除登录与绑定缓存</summary><p>沿用原控制台的缓存清理范围，不清除作业与管控数据。</p><button onclick="clearDemoCacheAndRestart()">清除缓存重新演示</button></details>':'';
    const target=get('dw-flow-body');if(target.innerHTML!==html+extra)target.innerHTML=html+extra;
  }
  function sync(){
    if(!enabled||!get('dw-context'))return;
    const parent=typeof stage!=='undefined'&&stage==='parent';const title=document.querySelector('#app .wx-title')?.textContent||'身份选择';
    get('dw-context').textContent=(parent?'家长':typeof stage!=='undefined'&&stage.startsWith('teacher')?'教师':'小程序')+' · '+title;
    document.querySelectorAll('[data-dw-entry]').forEach(b=>{const active=b.dataset.dwEntry===selected;b.classList.toggle('active',active);if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
    const accountStates=get('dw-account-states');if(accountStates)accountStates.hidden=parent||stage==='home';
    syncLoginUi();
    syncFlow();
  }
  function syncLoginUi(){
    const selector=get('dw-login-ui');if(!selector)return;
    selector.hidden=!document.querySelector('#app .parent-login-screen,#app .teacher-login-screen');
    document.body.classList.toggle('dw-login-ui-new',loginUiMode==='new');
    selector.querySelectorAll('[data-dw-login-ui]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.dwLoginUi===loginUiMode)));
  }
  function setLoginUi(mode){
    if(!['new','legacy'].includes(mode))return;
    loginUiMode=mode;
    try{sessionStorage.setItem(loginUiKey,mode);}catch{}
    syncLoginUi();
  }
  function setState(context){stateInfo=context;const dock=get('dw-state');if(!dock)return;dock.hidden=!context?.choices?.length;get('dw-state-title').textContent='当前页：'+(context?.title||'');get('dw-state-active').textContent=context?.active?'正在演示：'+(context.label||context.active):'正常';get('dw-state-restore').hidden=!context?.active;}
  function restart(){window.pageDemoTools?.restore();if(activeFlow==='homework')homeworkDemoConsole.start('published');else if(flowRole==='parent')parentPrototype.restart();else if(flowRole==='teacher')restartTeacherScenario();sync();}
  async function copyLink(){const url=new URL(location.href);if(selected)url.searchParams.set('demo',selected);url.searchParams.delete('demoState');try{await navigator.clipboard.writeText(url.href);get('dw-copy').textContent='已复制';setTimeout(()=>get('dw-copy').textContent='复制场景入口',1500);}catch{prompt('复制场景入口',url.href);}}
  function init(){
    if(!enabled)return;document.body.classList.add('demo-workspace');
    const root=document.createElement('div');root.id='demo-workspace';root.innerHTML=`<header class="dw-header"><div><button type="button" onclick="document.body.classList.toggle('dw-nav-open')" aria-label="展开功能目录">☰</button><strong>小程序演示台</strong><small>方案预览</small></div><div><button onclick="demoWorkspace.focus()" id="dw-focus">专注预览</button><button onclick="demoWorkspace.copyLink()" id="dw-copy">复制场景入口</button></div></header><nav class="dw-sidebar" aria-label="演示功能目录"><input class="dw-search" id="dw-search" type="search" placeholder="搜索功能或流程" aria-label="搜索功能或流程">${catalog.map(g=>`<details data-dw-group="${g.id}" ${g.id==='login'?'open':''}><summary>${g.label}</summary>${g.roles?g.roles.map(r=>`<details class="dw-role" ${r.id==='parent'?'open':''}><summary>${r.label}</summary><div class="dw-items">${r.items.map(button).join('')}</div></details>`).join(''):`<div class="dw-items">${g.items.map(button).join('')}</div>`}</details>`).join('')}</nav><section class="dw-center"><div class="dw-context" id="dw-context"></div><div class="dw-login-ui" id="dw-login-ui" hidden aria-label="登录页视觉版本"><span>登录页视觉</span><div class="dw-login-ui-options"><button type="button" data-dw-login-ui="new" onclick="demoWorkspace.setLoginUi('new')">新版</button><button type="button" data-dw-login-ui="legacy" onclick="demoWorkspace.setLoginUi('legacy')">原版</button></div></div><div id="dw-canvas"></div><section class="dw-state" id="dw-state" hidden aria-label="当前页状态演示"><div class="dw-state-heading"><span id="dw-state-title"></span><span id="dw-state-active"></span><button id="dw-state-restore" onclick="pageDemoTools.restore()" hidden>恢复</button><button onclick="pageDemoTools.toggle()" id="dw-state-toggle" aria-expanded="false">状态与异常 ▾</button></div><div id="dw-state-body"></div></section></section><button class="dw-flow-toggle" onclick="demoWorkspace.toggleFlow()" aria-controls="dw-flow" aria-expanded="false">‹ 流程</button><aside class="dw-flow" id="dw-flow" aria-label="当前流程辅助"><div class="dw-flow-head"><span id="dw-flow-title">当前流程</span><button onclick="demoWorkspace.toggleFlow()" aria-label="收起流程">›</button></div><div id="dw-flow-body"></div><details id="dw-account-states"><summary>账号与数据演示</summary><p>这些状态沿用原控制台，会改变教师演示账号和数据范围。</p>${Object.entries({noClasses:'当前教师无班级',noStudents:'当前班级无学生',deleted:'离职后账号已删除',normal:'恢复正常账号与数据'}).map(([id,label])=>`<button data-availability="${id}" onclick="demoWorkspace.availability('${id}')">${label}</button>`).join('')}</details></aside>`;
    document.body.append(root);get('dw-canvas').append(document.querySelector('.device'));
    root.querySelectorAll('[data-dw-entry]').forEach(b=>b.addEventListener('click',()=>{select(b.dataset.dwEntry);if(innerWidth<=650)document.body.classList.remove('dw-nav-open');}));
    let searchOpen=null;
    get('dw-search').addEventListener('input',event=>{const text=event.target.value.trim().toLowerCase();if(text&&!searchOpen)searchOpen=new Map([...root.querySelectorAll('.dw-sidebar details')].map(d=>[d,d.open]));root.querySelectorAll('[data-dw-entry]').forEach(b=>b.hidden=Boolean(text)&&!b.textContent.toLowerCase().includes(text));root.querySelectorAll('.dw-sidebar details').forEach(d=>{d.hidden=Boolean(text)&&![...d.querySelectorAll('[data-dw-entry]')].some(b=>!b.hidden);if(text)d.open=true;else if(searchOpen)d.open=searchOpen.get(d);});if(!text)searchOpen=null;});
    const legacy=get('demo-console-panel');if(legacy){legacy.hidden=true;new MutationObserver(()=>syncFlow()).observe(legacy,{subtree:true,childList:true,characterData:true});}
    new MutationObserver(()=>{window.pageDemoTools?.sync();sync();}).observe(get('app'),{childList:true});
    // Remove the first render's in-canvas review chrome before installing the external provider.
    document.querySelectorAll('#app .parent-demo-toolbar,#app .parent-exception-mask,#app #page-demo-tools-host').forEach(e=>e.remove());
    const requested=query.get('demo');if(entries.some(e=>e.id===requested)){root.querySelectorAll('.dw-sidebar details').forEach(d=>d.open=false);select(requested);}else if(typeof teacherScenario!=='undefined'&&teacherScenario){activeFlow='teacher';flowRole='teacher';}else if(typeof stage!=='undefined'&&stage==='parent'){activeFlow='parent';flowRole='parent';}
    window.pageDemoTools?.sync();sync();if(query.get('demoState'))window.pageDemoTools?.select(query.get('demoState'));
  }
  const api={enabled,catalog,entries,select,sync,syncFlow,setState,setLoginUi,restart,copyLink,init,toggleFlow(){if(window.homeworkDemoConsole?.isActive())activeFlow='homework';document.body.classList.toggle('dw-flow-open');document.querySelector('.dw-flow-toggle')?.setAttribute('aria-expanded',String(document.body.classList.contains('dw-flow-open')));syncFlow();},focus(){const on=document.body.classList.toggle('dw-focus');get('dw-focus').textContent=on?'退出专注':'专注预览';},availability(value){if(isControl()){const url=new URL('index.html',location.href);url.search='?review=1&availability='+value;location.assign(url.href);return;}window.pageDemoTools?.restore();setTeacherAvailability(value);sync();}};
  return api;
})();
window.demoWorkspace.init();
