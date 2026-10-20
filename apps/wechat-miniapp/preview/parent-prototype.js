/* 家长登录与学生关联浏览器原型；所有身份、二维码和验证码均为演示状态。 */
window.parentPrototype = (() => {
  const students = [
    { name: '李涵', school: '罗湖实验学校', className: '七年级(2)班' },
    { name: '王博', school: '罗湖实验学校', className: '七年级(4)班' }
  ];
  const MAX_GUARDIANS_PER_STUDENT = 6;
  let student = students[0];
  const savedKey = 'ai_companion_demo_parent_v2';
  const fresh = () => ({ view: 'entry', loggedOut: false, agreementAccepted: false, agreementKind: '', flow: 'first', actor: 'applicant', currentWechatLinked: true, bound: false, boundStudents: [], guardianCounts: [0, 0], activeStudent: 0, addingChild: false, homeTab: 'learning', verifiedPhone: '', phoneDraft: '', codeDraft: '', codeSent: false, error: '', notice: '', invite: false, request: 'none', card: 'valid', phonePurpose: 'bind', phoneSheetOpen: false, phoneAuthorizationHandled: false, exceptionMode: '', exceptionMenuOpen: false, originalDeviceKicked: false, currentId: 'owner', families: {}, applicantName: '', applicantRelation: '妈妈', customRelationMode: false, selectedMember: '', transferForUnbind: false, inviteStatus: 'valid' });
  let state = fresh();
  try {
    const saved = JSON.parse(localStorage.getItem(savedKey) || 'null');
    if (saved) {
      // 账号和已验证手机号独立于孩子绑定保存；兼容旧版退出缓存。
      state.loggedOut = saved.loggedOut ?? (saved.bound === false && Boolean(saved.boundStudents?.length) && saved.currentWechatLinked !== false);
      state.verifiedPhone = saved.phone || '';
      state.currentId = saved.currentId || 'owner';
      state.currentWechatLinked = saved.currentWechatLinked !== false;
      state.boundStudents = Array.isArray(saved.boundStudents) ? saved.boundStudents.filter(index => students[index]) : saved.bound ? [0] : [];
      state.guardianCounts = saved.guardianCounts || students.map((_, index) => Number(state.boundStudents.includes(index)));
      state.activeStudent = students[saved.activeStudent] ? saved.activeStudent : state.boundStudents[0] || 0;
      state.families = saved.families || {};
      state.bound = Boolean(saved.bound) && state.currentWechatLinked && !state.loggedOut;
      state.flow = 'returning';
      student = students[state.activeStudent];
      const request = family().applications[state.currentId];
      if (request) family().application = request;
      state.request = request?.status || 'none';
      state.view = state.loggedOut ? 'entry' : state.bound ? 'home' : request ? 'pending' : 'entry';
    }
  } catch (_) { /* 演示缓存损坏时从入口开始 */ }
  const esc = value => String(value || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const mask = phone => phone ? `${phone.slice(0, 3)}****${phone.slice(-4)}` : '';
  const save = () => localStorage.setItem(savedKey, JSON.stringify({ bound: state.bound, loggedOut: Boolean(state.loggedOut), boundStudents: state.boundStudents, guardianCounts: state.guardianCounts, activeStudent: state.activeStudent, currentWechatLinked: state.currentWechatLinked, phone: state.verifiedPhone, families: state.families, currentId: state.currentId }));
  const chooseStudent = index => { state.activeStudent = index; student = students[index]; state.request = state.families?.[index]?.application?.status || 'none'; };
  const guardianCount = () => family().members.length;
  const capacityFull = () => guardianCount() >= MAX_GUARDIANS_PER_STUDENT;
  const finishStudentBind = () => { if (!state.boundStudents.includes(state.activeStudent)) { if (capacityFull()) return false; const f = family(); if (!f.members.some(m => m.id === state.currentId)) f.members.push({id: state.currentId, name: '李先生', relation: '爸爸', phone: state.verifiedPhone || ''}); if (!f.primaryId) f.primaryId = state.currentId; state.boundStudents.push(state.activeStudent); state.guardianCounts[state.activeStudent] = f.members.length; } state.bound = true; state.loggedOut = false; state.addingChild = false; save(); return true; };
  const clearMessage = () => { state.error = ''; state.notice = ''; };
  const bar = (title, detail = false) => `<header class="wx-header wx-header--home"><div class="wx-status"><span>9:41</span><span class="wx-status-icons"><span class="wx-signal"><i></i><i></i><i></i><i></i></span><span class="wx-wifi"></span><span class="wx-battery"></span></span></div><div class="wx-nav${detail ? ' parent-detail-nav' : ''}"><button class="wx-back" aria-label="返回" onclick="parentPrototype.back()"><i></i></button>${detail ? `<button class="parent-nav-home" aria-label="家长首页" onclick="parentPrototype.detailHome()"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10.5 12 3l9 7.5M5.5 9v12h5v-7h3v7h5V9"/></svg></button>` : ''}<h2 class="wx-title" title="${esc(title)}">${esc(title)}</h2><span class="wx-menu"><span class="wx-dots">•••</span><span class="wx-divider"></span><span class="wx-circle"></span></span></div></header>`;
  const hero = (title, subtitle) => `<div class="parent-hero"><span class="parent-symbol">家</span><h1>${title}</h1>${subtitle ? `<p>${subtitle}</p>` : ''}</div>`;
  const studentCard = () => `<section class="parent-card parent-student"><span class="parent-avatar">${student.name.slice(0, 1)}</span><div><strong>${student.name}</strong><small>${student.school}<br>${student.className}</small></div></section>`;
  let childPickerOpen = false;
  const childSwitcher = () => `<div class="parent-child-context parent-child-row"><strong class="parent-current-child"><span>${esc(student.name)}</span><small>· ${esc(student.className)}</small></strong>${state.boundStudents.length > 1 ? '<button class="parent-child-modal-trigger" aria-haspopup="dialog" onclick="parentPrototype.openChildPicker()">切换孩子 ⌄</button>' : ''}</div>`;
  const childPickerDialog = () => !childPickerOpen ? '' : `<div class="parent-child-modal-mask" onclick="parentPrototype.closeChildPicker()" onkeydown="if(event.key==='Escape')parentPrototype.closeChildPicker()"><section class="parent-child-modal" role="dialog" aria-modal="true" aria-label="切换孩子" onclick="event.stopPropagation()"><header><strong>切换孩子</strong><button aria-label="关闭" onclick="parentPrototype.closeChildPicker()">×</button></header><div class="parent-child-options" aria-label="当前家长绑定的孩子">${state.boundStudents.map(index => `<button class="${state.activeStudent === index ? 'active' : ''}" aria-pressed="${state.activeStudent === index}" onclick="parentPrototype.selectChild(${index})"><span class="parent-option-name">${esc(students[index].name)}</span><span class="parent-option-meta"><small>${esc(students[index].className)}</small><b>${state.activeStudent === index ? '✓' : ''}</b></span></button>`).join('')}</div><button class="parent-child-modal-cancel" onclick="parentPrototype.closeChildPicker()">取消</button></section></div>`;
  const button = (label, action, kind = 'primary') => `<button class="parent-${kind}" onclick="parentPrototype.action('${action}')">${label}</button>`;
  const agreementDocs={"service":{"title":"用户协议","sections":["协议内容示意","本页用于演示协议阅读交互，正式协议正文待接入。","账号与孩子关联","请使用本人微信登录，可按需绑定本人手机号，按照学校二维码或家庭邀请流程关联孩子。关联成功前不展示孩子的学习详情。","服务使用","家长仅在已授权范围内查看关联孩子的学情、作业和提交记录。具体服务规则以正式协议为准。"]},"privacy":{"title":"隐私政策","sections":["政策内容示意","本页用于演示隐私政策阅读交互，正式政策正文待接入。","信息与用途","微信身份、手机号和孩子关联信息用于账号登录、关联验证与授权访问。","权限与管理","相册、拍摄及文件选择在用户主动操作时使用。信息处理范围、保存期限、联系及权利申请方式以正式政策为准。"]}};
  const agreementRow=()=>`<div class="teacher-agreement-row parent-agreement-row"><label><input type="checkbox" aria-label="同意用户协议和隐私政策" ${state.agreementAccepted?'checked':''} onchange="parentPrototype.setAgreement(this.checked)">我已阅读并同意</label><button type="button" onclick="parentPrototype.openAgreement('service')">《用户协议》</button><span>和</span><button type="button" onclick="parentPrototype.openAgreement('privacy')">《隐私政策》</button></div>`;
  const agreementDialog=()=>{const doc=agreementDocs[state.agreementKind];return !doc?'':`<div class="teacher-agreement-mask parent-agreement-mask" role="dialog" aria-modal="true" aria-label="${doc.title}"><section class="teacher-agreement-detail"><header><strong>${doc.title}</strong><button type="button" onclick="parentPrototype.closeAgreement()">关闭</button></header><div class="teacher-agreement-body">${doc.sections.map((text,index)=>index%2===0?'<h3>'+esc(text)+'</h3>':'<p>'+esc(text)+'</p>').join('')}</div>${button('返回登录','closeAgreement')}</section></div>`};
  const actions = (...items) => `<div class="parent-actions">${items.join('')}</div>`;
  const card = (title, body) => `<section class="parent-card"><h2>${title}</h2><p>${body}</p></section>`;
  const notice = () => `${state.error ? `<p class="parent-error" role="alert">${esc(state.error)}</p>` : ''}${state.notice ? `<div class="parent-info">${esc(state.notice)}</div>` : ''}`;
  const roleSwitchEntry = () => typeof canSwitchToTeacherRole === 'function' && canSwitchToTeacherRole() ? '<button class="parent-profile-switch" aria-label="切换到教师端" onclick="switchToTeacherRole()">切换教师端 ›</button>' : '';
  const demoFillBubble = (field, label) => new URLSearchParams(location.search).get('review') === '1' ? `<button type="button" class="parent-demo-fill" onclick="parentPrototype.fillDemo('${field}')">${label}</button>` : '';
  let scanTimer = null;
  const clearScanTimer = () => { if (scanTimer) clearTimeout(scanTimer); scanTimer = null; };
  let codeCountdownUntil = 0;
  let codeCountdownTimer = null;
  const codeRemaining = () => Math.max(0, Math.ceil((codeCountdownUntil - Date.now()) / 1000));
  function updateCodeButton() { const button = document.getElementById('parent-send-code'); const remaining = codeRemaining(); if (button) { button.disabled = remaining > 0; button.textContent = remaining ? `${remaining}s 后重发` : '获取验证码'; } if (!remaining && codeCountdownTimer) { clearInterval(codeCountdownTimer); codeCountdownTimer = null; } }
  function resetCodeCountdown() { codeCountdownUntil = 0; if (codeCountdownTimer) clearInterval(codeCountdownTimer); codeCountdownTimer = null; updateCodeButton(); }
  function startCodeCountdown() { codeCountdownUntil = Date.now() + 60000; if (codeCountdownTimer) clearInterval(codeCountdownTimer); codeCountdownTimer = setInterval(updateCodeButton, 1000); updateCodeButton(); }
  const baseExceptionChoices = () => ({ inviteLanding: [['expiredInvite', '邀请已过期'], ['revokedInvite', '邀请已撤回'], ['full', '绑定人数已满']], inviter: family().application?.status==='pending' && isManager() ? [['slotTaken','审核前最后名额被占']] : [], scan: [['foreign', '不是本产品的学生码'], ['invalid', '二维码失效'], ['disabled', '学生账号已禁用'], ['deleted', '学生账号已删除']], confirm: [...(state.flow === 'second' ? [['noInvite', '没有家长邀请'], ['full', '关联人数已满'], ['lastSlot', '只剩最后一个名额']] : []), ['disabled', '确认时账号被禁用'], ['deleted', '确认时账号被删除']], phone: [['codeExpired', '验证码错误或过期'], ['phoneConflict', '手机号不可用'], ['disabled', '验证时账号被禁用'], ['deleted', '验证时账号被删除']], pending: state.request === 'pending' ? [['slotTaken', '确认前名额被占']] : [] })[state.view] || [];
  let pageExceptionSnapshot=null, exceptionOriginChoices=[], activeExceptionKey='', activeExceptionLabel='';
  const pageExceptionChoices = () => ({entry:[['loginFailed','微信登录失败']], scan:[...(state.boundStudents.includes(state.activeStudent)?[]:[['alreadyLinked','孩子已被其他家长绑定']]),['cameraDenied','相机权限被拒绝'],['scanNetwork','识别时网络异常']],confirm:[['alreadyLinked','已有其他家长绑定'],['firstBindRace','同时首次绑定冲突']],phone:[...(state.phonePurpose==='bind'?[['firstBindRace','验证前被其他家长先绑定']]:[]),['smsLimited','短信发送过于频繁'],['submitNetwork','提交时网络异常']], needInvite:[['bindingDispute','不认识已绑定家长 / 怀疑误绑定']],inviter:family().application?.status==='pending'&&isManager()?[['managerChanged','主管理已转交，旧审核页失效'],['studentUnavailable','审核时学生账号已禁用']]:[],requestForm:[['duplicateRequest','同一账号重复申请']],home:state.bound?[['bindingRemoved','查看期间被解除绑定']]:[],familyManage:state.bound?[['bindingRemoved','当前家长绑定被解除']]:[]})[state.view] || [];
  const exceptionChoices=()=>[...baseExceptionChoices(),...pageExceptionChoices()];
  function injectPageException(name){
    if(name==='normal'&&pageExceptionSnapshot){state=JSON.parse(pageExceptionSnapshot);pageExceptionSnapshot=null;exceptionOriginChoices=[];activeExceptionKey='';activeExceptionLabel='';student=students[state.activeStudent];state.exceptionMenuOpen=false;clearMessage();save();render();return true;}
    if(!pageExceptionChoices().some(([key])=>key===name))return false;
    if(!pageExceptionSnapshot)pageExceptionSnapshot=JSON.stringify(state);
    state.exceptionMenuOpen=false;clearMessage();state.exceptionMode=name;
    if(name==='alreadyLinked'||name==='firstBindRace'){
      const f=family();if(!f.members.length){f.members.push({id:'other-manager',name:'李先生',relation:'爸爸',phone:'13800138000'});f.primaryId='other-manager';}state.guardianCounts[state.activeStudent]=f.members.length;
      state.view=capacityFull()?'capReached':'needInvite';
    }
    if(name==='bindingDispute')state.notice='不认识已绑定家长或疑似误绑定，请联系学校协助处理。';
    if(name==='managerChanged'){const f=family();let next=f.members.find(m=>m.id!==state.currentId);if(!next){next={id:'demo-successor',name:'另一位已绑定家长',relation:'家庭成员',phone:'13500135000'};f.members.push(next);}f.primaryId=next.id;state.guardianCounts[state.activeStudent]=f.members.length;state.notice='主管理身份已转交，你现在是普通家长。待审核申请将由新主管理家长处理。';}
    if(name==='duplicateRequest'){const f=family();const request={id:state.currentId,name:state.applicantName.trim()||'申请人',relation:state.applicantRelation||'家庭成员',phone:state.verifiedPhone||'13900139000',status:'pending',time:new Date().toLocaleString('zh-CN',{hour12:false})};f.applications[state.currentId] ||= request;f.application=f.applications[state.currentId];state.request=f.application.status;state.view='pending';state.notice='你已提交申请，无需重复提交。';}
    if(name==='bindingRemoved'){const f=family();f.members=f.members.filter(m=>m.id!==state.currentId);f.primaryId=f.members.some(m=>m.id===f.primaryId)?f.primaryId:(f.members[0]?.id||'');const r=f.applications[state.currentId]||{id:state.currentId,name:'当前家长',relation:'家庭成员',phone:state.verifiedPhone};r.status='removed';f.applications[state.currentId]=r;f.application=r;state.boundStudents=state.boundStudents.filter(i=>i!==state.activeStudent);state.bound=state.boundStudents.length>0;state.guardianCounts[state.activeStudent]=f.members.length;state.request='removed';state.view='pending';}
    if(name==='studentUnavailable')state.error='学生账号已禁用，暂不能同意绑定；你仍可拒绝申请。请联系学校协助处理。';
    if(name==='loginFailed')state.error='微信登录暂未成功，请重试，也可使用原手机号找回账号。';
    if(name==='cameraDenied')state.error='未获得相机权限。请在微信设置中允许使用相机，或从相册选择二维码。';
    if(name==='scanNetwork')state.error='二维码识别失败，请检查网络后重试；当前绑定关系未改变。';
    if(name==='smsLimited')state.error='验证码发送过于频繁，请稍后再试。';
    if(name==='submitNetwork')state.error='网络异常，暂未提交成功。恢复网络后可重试，不会重复建立绑定。';
    save();render();return true;
  }
  const exceptionHints={
    loginFailed:'立即显示登录失败提示，可恢复后重新登录。', foreign:'直接查看无法识别二维码的页面。', invalid:'直接查看二维码失效和重新扫码入口。', disabled:'账号暂时停用，联系学校恢复后可重试。', deleted:'原账号已删除，请联系学校重新获取绑定码。',
    alreadyLinked:'查看主管理家长信息及联系学校的提示。',cameraDenied:'查看权限提示，也可继续从相册选择。',scanNetwork:'查看识别失败提示；恢复后可重新识别。',firstBindRace:'预览另一位家长先绑定后，本次操作的拦截结果。',
    codeExpired:'直接显示验证码错误或过期。',phoneConflict:'直接显示号码冲突，不修改当前账号。',smsLimited:'直接显示短信发送频繁提示。',submitNetwork:'显示提交失败；恢复后保留表单继续提交。',
    expiredInvite:'直接查看邀请已过期的结果。',revokedInvite:'直接查看邀请已撤回的结果。',full:'直接查看绑定人数已满的结果。',slotTaken:'保留审核页，点击同意可查看最后名额已被占的结果。',
    noInvite:'直接查看联系主管理家长获取邀请的提示。',lastSlot:'继续申请，体验只剩最后一个名额的流程。',bindingDispute:'在当前页面提示联系学校协助处理。',managerChanged:'直接查看旧审核页失效，并保留原待审核申请。',studentUnavailable:'禁止同意绑定，仍可拒绝申请。',duplicateRequest:'直接返回已有的待审核申请。',bindingRemoved:'立即展示解绑结果；其他孩子的绑定保留。'
  };
  const exceptionPageNames={entry:'登录页',scan:'扫码页',confirm:'核对孩子页',phone:'手机号页',inviteLanding:'邀请页',inviter:'审核页',requestForm:'申请页',needInvite:'已有绑定提示页',home:'家长首页',familyManage:'家长管理页',pending:'申请结果页'};
  const exceptionPanel = () => {
    const choices=exceptionChoices();
    if(new URLSearchParams(location.search).get('review')!=='1'||state.phoneSheetOpen||state.agreementKind||(!choices.length&&!pageExceptionSnapshot))return '';
    const active=Boolean(pageExceptionSnapshot), available=[...choices,...exceptionOriginChoices.filter(([key])=>!choices.some(([id])=>id===key))];
    return `<aside class="parent-demo-toolbar" aria-label="页面异常演示工具" ${state.exceptionMenuOpen?'inert aria-hidden="true"':''}><div class="parent-demo-context"><span class="parent-demo-tag">演示</span><span class="parent-demo-label">${active?esc(activeExceptionLabel):'可在当前页面切换异常'}</span></div><div class="parent-demo-tools">${active?'<button class="parent-demo-restore" onclick="parentPrototype.exception(\'normal\')">恢复正常</button>':''}<button class="parent-demo-open" aria-haspopup="dialog" aria-expanded="${state.exceptionMenuOpen}" onclick="parentPrototype.toggleExceptionMenu(true)">${active?'切换异常':'异常演示'}</button></div></aside>${state.exceptionMenuOpen?`<div class="parent-exception-mask" onclick="parentPrototype.toggleExceptionMenu(false)" onkeydown="if(event.key==='Escape')parentPrototype.toggleExceptionMenu(false)"><section class="parent-exception-sheet" role="dialog" aria-modal="true" aria-label="异常演示" onclick="event.stopPropagation()"><header><div><small>${esc(exceptionPageNames[state.view]||'当前页面')}</small><h2>选择要演示的异常</h2></div><button class="parent-exception-close" aria-label="关闭异常演示" onclick="parentPrototype.toggleExceptionMenu(false)">×</button></header><p>点击选项预览；演示结束后可一键恢复。</p><div class="parent-exception-list">${available.map(([key,label])=>`<button class="parent-exception-option${key===activeExceptionKey?' is-active':''}" aria-pressed="${key===activeExceptionKey}" onclick="parentPrototype.exception('${key}')"><span><strong>${esc(label)}</strong><small>${esc(exceptionHints[key]||'在当前流程中预览这个异常。')}</small></span><b aria-hidden="true">${key===activeExceptionKey?'✓':'›'}</b></button>`).join('')}</div><footer>${active?'<button onclick="parentPrototype.exception(\'normal\')">恢复正常</button>':'<button onclick="parentPrototype.toggleExceptionMenu(false)">暂不演示</button>'}</footer></section></div>`:''}`;
  };
  const qrPattern = () => { let cells = ''; for (let y = 0; y < 25; y++) for (let x = 0; x < 25; x++) { const finder = [[0, 0], [18, 0], [0, 18]].find(([fx, fy]) => x >= fx && x < fx + 7 && y >= fy && y < fy + 7); let dark; if (finder) { const dx = x - finder[0], dy = y - finder[1]; dark = dx === 0 || dx === 6 || dy === 0 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4); } else dark = ((x * 17 + y * 31 + x * y * 7) % 11) < 5; cells += `<i${dark ? ' class="dark"' : ''}></i>`; } return cells; };
  const qrCard = () => `<div class="parent-qr-card"><div class="parent-qr-pattern" aria-hidden="true">${qrPattern()}</div><strong>${student.name}</strong><small>${student.school} · ${student.className}</small></div>`;
  const tabIcons = {
    learning: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 19h18M5 15v-5m5 5V5m5 10v-3m5 3V8"/></svg>',
    homework: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>',
    mine: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3"/><path d="M5 20c.5-3.5 3-5.5 7-5.5s6.5 2 7 5.5"/></svg>'
  };
  const tabBar = () => `<nav class="parent-tabbar" aria-label="家长端导航">${[['learning', '学习报告'], ['homework', '作业'], ['mine', '我的']].map(([key, label]) => `<button aria-selected="${state.homeTab === key}" onclick="parentPrototype.tab('${key}')"><span class="parent-tab-icon">${tabIcons[key]}</span><span>${label}</span></button>`).join('')}</nav>`;

  const phoneSheet = () => !state.phoneSheetOpen ? '' : `<div class="teacher-phone-shade" onclick="parentPrototype.action('denyWechatPhone')"></div><section class="teacher-phone-sheet" role="dialog" aria-modal="true" aria-label="家长微信手机号授权"><div class="teacher-phone-app"><span class="teacher-phone-app-mark">家</span><span>通晤纪AI伴学</span><span class="teacher-phone-info">i</span></div><h2>使用微信绑定的手机号</h2><p>继续验证家长账号</p><button class="teacher-phone-number" onclick="parentPrototype.action('approveWechatPhone')"><strong>138****8000</strong><span>微信绑定的手机号</span></button><button class="teacher-phone-deny" onclick="parentPrototype.action('denyWechatPhone')">不允许</button><button class="teacher-phone-other" onclick="parentPrototype.action('otherWechatPhone')">使用其他手机号登录</button></section>`;

  function family() {
    if (!state.families[state.activeStudent]) {
      const count = Math.min(MAX_GUARDIANS_PER_STUDENT, state.guardianCounts[state.activeStudent] || 0);
      const seed = [
        {id:'owner',name:'李先生',relation:'爸爸',phone:'13800138000'},
        {id:'member2',name:'王女士',relation:'妈妈',phone:'13900139000'},
        {id:'member3',name:'李爷爷',relation:'爷爷',phone:'13600136000'},
        {id:'member4',name:'张奶奶',relation:'奶奶',phone:'13500135000'},
        {id:'member5',name:'王外公',relation:'外公',phone:'13400134000'},
        {id:'member6',name:'刘外婆',relation:'外婆',phone:'13300133000'}
      ];
      state.families[state.activeStudent] = {primaryId:count ? 'owner' : '', members:seed.slice(0,count), application:null, inviteStatus:'valid'};
    }
    const record=state.families[state.activeStudent];
    if(record.members.length===1)record.primaryId=record.members[0].id;
    if(!record.members.length)record.primaryId='';
    record.applications ||= {};
    if(record.application) {
      record.applications[record.application.id] ||= record.application;
      record.application=record.applications[record.application.id];
    }
    return record;
  }
  function isManager(index = state.activeStudent) { return state.bound && state.families[index]?.primaryId === state.currentId; }
  function memberRow(m, editable = false) {
    const manager = family().primaryId === m.id;
    return '<div class="parent-guardian-row"><span class="parent-guardian-avatar">'+esc(m.name.slice(0,1))+'</span><div class="family-member-info"><strong>'+esc(m.name)+(m.id===state.currentId?'（我）':'')+'</strong><small>'+esc(m.relation)+' · '+(m.phone?mask(m.phone):'手机号未绑定')+'</small><small>'+(manager?'主管理家长':'普通家长')+'</small></div>'+(editable && !manager ? '<button class="family-remove" onclick="parentPrototype.familySelect(\''+m.id+'\',\'remove\')">解除绑定</button>' : '')+'</div>';
  }
  function activateFamilyMember(id) {
    state.currentId=id;state.loggedOut=false;
    if(family().applications[id])family().application=family().applications[id];
    state.boundStudents=Object.keys(state.families).map(Number).filter(index=>state.families[index].members.some(m=>m.id===id));
    state.bound=state.boundStudents.length>0;
    state.currentWechatLinked=true;
    state.actor=family().primaryId===id?'inviter':'applicant';
    state.verifiedPhone=family().members.find(m=>m.id===id)?.phone || family().application?.phone || '';
    state.request=family().application?.status || 'none';
    state.homeTab='mine';
  }
  function familySelect(id, purpose) {
    if(!isManager() || id===family().primaryId || !family().members.some(m=>m.id===id))return;
    state.selectedMember=id;
    if(purpose==='transfer') { action(state.transferForUnbind?'unbind':'transferMember'); return; }
    state.view='removeConfirm'; clearMessage(); render();
  }
  function familyReview(role) {
    clearMessage();
    const f=family();
    if(role==='recipient' || role==='newRecipient') {
      if(!f.application || role==='newRecipient') {
        f.nextGuestId=(f.nextGuestId || 0)+1;
        state.currentId='guest'+state.activeStudent+'_'+f.nextGuestId; state.bound=false; state.boundStudents=[]; state.verifiedPhone=''; state.actor='applicant'; state.applicantName=''; state.customRelationMode=false; state.applicantRelation=f.members.length===1?'妈妈':f.members.length===2?'爷爷':'奶奶'; state.view='inviteLanding'; state.request='none';
      } else { activateFamilyMember(f.application.id); state.view='pending'; }
    } else {
      activateFamilyMember(f.primaryId); state.view='familyManage';
    }
    save(); render();
  }
  function familyInput(field,value) { if(field==='name')state.applicantName=value.slice(0,20); if(field==='relation')state.applicantRelation=value.slice(0,12); if(field==='relationChoice'){state.customRelationMode=value==='其他';state.applicantRelation=state.customRelationMode?'':value;state.error='';render();} }
  function familySelectRequest(id) {
    if(!isManager() || !family().applications[id])return;
    family().application=family().applications[id];state.view='inviter';clearMessage();render();
  }
  function familyRequestList() {
    const f=family(), pending=Object.values(f.applications).filter(r=>r.status==='pending');
    if(pending.length<=1)return '';
    return '<section class="parent-card family-section"><h2>待审核申请 '+pending.length+' 条</h2>'+pending.map(r=>'<button class="family-transfer-row" onclick="parentPrototype.familySelectRequest(\''+esc(r.id)+'\')">'+esc(r.name)+' · '+esc(r.relation)+'<span>'+(f.application?.id===r.id?'当前申请':'查看 ›')+'</span></button>').join('')+'</section>';
  }
  let familyMenuOpen=false;
  function familyMenu() {
    if(!familyMenuOpen)return '';
    return `<div class="family-menu-mask" onclick="parentPrototype.action('closeFamilyMenu')"><section class="family-menu-sheet" role="dialog" aria-modal="true" aria-label="家长管理操作" onclick="event.stopPropagation()"><h2>管理操作</h2>${isManager()?'<button onclick="parentPrototype.action(\'transfer\')">转交主管理身份</button>':''}<button class="family-menu-danger" onclick="parentPrototype.action('unbindConfirm')">解除自己的绑定</button><button class="family-menu-cancel" onclick="parentPrototype.action('closeFamilyMenu')">取消</button></section></div>`;
  }
  function familyAction(name) {
    const f=family(), appRequest=f.application;
    if(name==='familyMenu' || name==='closeFamilyMenu'){familyMenuOpen=name==='familyMenu'?!familyMenuOpen:false;render();return true;}
    familyMenuOpen=false;
    const restricted=['invite','shareInvite','inviter','approve','reject','removeMember','transfer','transferMember','revokeInvite'];
    if(restricted.includes(name) && !isManager()) {state.error=state.exceptionMode==='managerChanged'?'主管理权限已变更，请由现任主管理家长处理申请。':'只有主管理家长可以邀请、审核和管理其他家长。';render();return true;}
    if(name==='familyManage' || name==='childDetail') {if(!state.boundStudents.includes(state.activeStudent))return true;state.transferForUnbind=false;state.view='familyManage';render();return true;}
    if(name==='invite') {state.view=capacityFull()?'capReached':'invite';render();return true;}
    if(name==='shareInvite') {f.inviteStatus='valid';state.view='shareInvite';state.notice='邀请卡片已生成，请分享给需要绑定的家人。';save();render();return true;}
    if(name==='revokeInvite') {f.inviteStatus='revoked';Object.values(f.applications).filter(r=>r.status==='pending').forEach(r=>r.status='revoked');state.view='familyManage';state.notice='邀请已撤回，未完成的申请已失效。';save();render();return true;}
    if(name==='beginRequest') {
      if(f.inviteStatus!=='valid'){state.view='inviteUnavailable';render();return true;}
      if(f.members.some(m=>m.id===state.currentId)){state.view='home';state.notice='你已绑定该孩子，无需重复申请。';render();return true;}
      if(capacityFull()){state.view='capReached';render();return true;}
      if(appRequest?.id===state.currentId && appRequest.status==='pending'){state.view='pending';render();return true;}
      state.view='requestForm';render();return true;
    }
    if(name==='submitFamilyRequest') {
      if(f.applications[state.currentId]?.status==='pending'){f.application=f.applications[state.currentId];state.request='pending';state.view='pending';state.notice='你已提交申请，无需重复提交。';render();return true;}
      if(!state.applicantName.trim()){state.error='请填写申请人姓名，便于主管理家长核对。';render();return true;}
      if(!state.applicantRelation.trim()){state.error='请填写与孩子的关系。';render();return true;}
      state.applicantRelation=state.applicantRelation.trim();
      state.phonePurpose='request';state.phoneDraft='';state.codeDraft='';state.codeSent=false;resetCodeCountdown();state.view='phone';render();return true;
    }
    if(name==='inviter') {if(appRequest?.status!=='pending')f.application=Object.values(f.applications).find(r=>r.status==='pending') || appRequest;state.view='inviter';render();return true;}
    if(name==='approve' || name==='reject') {
      if(appRequest?.status!=='pending'){state.error='该申请已处理，请返回家长管理查看最新状态。';render();return true;}
      if(name==='approve' && state.exceptionMode==='studentUnavailable'){state.error='学生账号已禁用，暂不能同意绑定；你仍可拒绝申请。请联系学校协助处理。';render();return true;}
      if(f.inviteStatus!=='valid')appRequest.status='revoked';
      else if(name==='reject')appRequest.status='rejected';
      else if(capacityFull())appRequest.status='full';
      else {appRequest.status='approved';if(!f.members.some(m=>m.id===appRequest.id))f.members.push({id:appRequest.id,name:appRequest.name,relation:appRequest.relation,phone:appRequest.phone});state.guardianCounts[state.activeStudent]=f.members.length;}
      state.request=appRequest.status;state.view='familyManage';state.notice=({approved:'已同意绑定，该家长现在可以查看孩子的学习详情。',rejected:'已拒绝申请，对方无法查看孩子的学习详情。',full:'名额已满，本次申请未通过。',revoked:'邀请已失效，本次申请未通过。'})[appRequest.status];save();render();return true;
    }
    if(name==='refreshRequest') {state.request=appRequest?.status || 'none';state.view='pending';render();return true;}
    if(name==='cancelRequest') {if(appRequest?.id===state.currentId && appRequest.status==='pending')appRequest.status='cancelled';state.request=appRequest?.status || 'none';save();render();return true;}
    if(name==='removeMember') {
      const target=f.members.find(m=>m.id===state.selectedMember);if(!target || target.id===f.primaryId)return true;
      f.members=f.members.filter(m=>m.id!==target.id);state.guardianCounts[state.activeStudent]=f.members.length;
      if(f.applications[target.id])f.applications[target.id].status='removed';
      state.view='familyManage';state.notice='已解除'+target.name+'与'+student.name+'的绑定，已收回查看权限，孩子学习记录保留。';save();render();return true;
    }
    if(name==='transfer') {state.transferForUnbind=false;state.view='transfer';render();return true;}
    if(name==='transferMember') {
      const target=f.members.find(m=>m.id===state.selectedMember && m.id!==state.currentId);
      if(!target)return true;
      f.primaryId=target.id;state.transferForUnbind=false;state.actor='applicant';state.view='familyManage';state.notice='已将主管理身份转交给'+target.name+'，立即生效，无需对方确认。你仍可查看孩子的学习详情。';save();render();return true;
    }
    if(name==='unbindConfirm') {
      state.selectedMember='';state.transferForUnbind=isManager() && f.members.length>2;
      state.view=state.transferForUnbind?'transfer':'unbindConfirm';render();return true;
    }
    if(name==='unbind') {
      if(!f.members.some(m=>m.id===state.currentId))return true;
      if(isManager() && f.members.length>2) {
        const target=f.members.find(m=>m.id===state.selectedMember && m.id!==state.currentId);
        if(!state.transferForUnbind || !target){state.transferForUnbind=true;state.view='transfer';state.error='请选择一位接任家长，再解除自己的绑定。';render();return true;}
        f.primaryId=target.id;
      }
      f.members=f.members.filter(m=>m.id!==state.currentId);
      if(f.members.length===1)f.primaryId=f.members[0].id;
      if(!f.members.length){f.primaryId='';f.inviteStatus='revoked';Object.values(f.applications).filter(r=>r.status==='pending').forEach(r=>r.status='revoked');}
      if(f.applications[state.currentId])f.applications[state.currentId].status='removed';
      state.transferForUnbind=false;
    }
    if(name==='home' && (!state.bound || !f.members.some(m=>m.id===state.currentId))) {state.view=appRequest?.id===state.currentId?'pending':'entry';state.error='当前没有该孩子的有效绑定，无法查看学习详情。';render();return true;}
    return false;
  }

  const views = {
    entry() { const canQuickEnter = state.boundStudents.length && state.currentWechatLinked; return `${hero('查看孩子的学习情况', canQuickEnter ? '当前微信已关联孩子，可直接进入。' : '首次使用，请扫描学校发给家庭的孩子专属二维码进行绑定。')}${notice()}${actions(canQuickEnter ? button('使用当前微信继续', 'quick') : button(state.verifiedPhone || state.phoneAuthorizationHandled ? '扫描孩子专属二维码' : '微信登录', 'scan'), '<button class="parent-link" onclick="parentPrototype.action(\'recover\')">家长账号登录有问题？</button>', agreementRow())}`; },
    deviceConfirm() { return `${hero('此账号正在另一设备使用', '继续登录后，原设备将退出登录。')}${actions(button('继续登录', 'continueDeviceLogin'), button('取消', 'cancelDeviceLogin', 'secondary'))}`; },
    deviceKicked() { return `${hero('账号已在另一设备登录', '本设备已退出登录。重新登录后，另一设备也将退出。')}${actions(button('重新登录', 'retryAfterKick'))}`; },
    scan() { return `${hero('扫描孩子专属二维码', '请使用学校发给家庭的二维码。')}<div class="parent-info">扫描后，请核对孩子姓名、学校和班级。</div>${notice()}${actions(button('扫一扫', 'startScan'), button('从相册选择二维码', 'scanResult', 'secondary'), button('取消', 'cancelScan', 'secondary'))}`; },
    scanning() { return `${hero('正在扫描二维码', '请将孩子专属二维码放入框内。')}<div class="parent-scanner" aria-hidden="true"><div class="parent-scanner-frame"><span class="parent-scanner-corner tl"></span><span class="parent-scanner-corner tr"></span><span class="parent-scanner-corner bl"></span><span class="parent-scanner-corner br"></span><span class="parent-scanner-qr"><svg viewBox="0 0 100 100"><path d="M10 10h24v24H10zM66 10h24v24H66zM10 66h24v24H10zM18 18h8v8h-8zM74 18h8v8h-8zM18 74h8v8h-8zM50 12v15M44 35h18M72 48h18M45 55h14M56 72v18M75 72h15M85 62v12"/></svg></span><span class="parent-scanner-line"></span></div></div><p class="parent-scanner-status" role="status">正在识别二维码…</p>${actions(button('取消扫描', 'cancelScan', 'secondary'))}`; },
    alreadyBound() { return `${hero('你已绑定该孩子', '无需重复绑定，可直接查看孩子的学习情况。')}${studentCard()}${actions(button('进入孩子首页','enterBoundChild'),button('返回','cancelScan','secondary'))}`; },
    confirm() { const alreadyVerified = state.verifiedPhone && guardianCount() === 0; return `${hero('核对孩子信息', '')}${studentCard()}${notice()}${actions(button(alreadyVerified ? '确认并关联孩子' : '确认并继续', 'confirm'), button('不是我的孩子', 'cancelScan', 'secondary'))}`; },
    phone() { const changing = state.phonePurpose === 'change'; const recovery = state.phonePurpose === 'recover'; const requesting = state.phonePurpose === 'request'; const title = changing ? (state.verifiedPhone?'更换手机号':'绑定本人手机号') : recovery ? '找回家长账号' : requesting ? '验证手机号' : '绑定手机号'; const optional=['bind','request'].includes(state.phonePurpose); const subtitle = recovery ? '输入原账号的手机号，验证后找回孩子关联。' : changing ? '验证本人手机号后绑定到当前家长账号，不改变孩子绑定和主管理身份。' : requesting ? '手机号可选。可验证后提交，也可跳过，由主管理家长核对姓名和关系后审核。' : '手机号可选，用于以后找回账号。你可以先跳过，之后在“我的”中绑定。'; const submit = recovery ? '验证并找回账号' : changing ? (state.verifiedPhone?'验证并更换号码':'验证并绑定手机号') : requesting ? '验证并提交申请' : '验证并绑定手机号'; return `${hero(title, subtitle)}<label class="parent-field">手机号<input id="parent-phone" inputmode="tel" maxlength="11" value="${esc(state.phoneDraft)}" placeholder="请输入 11 位手机号" oninput="parentPrototype.input('phone',this.value)"></label>${demoFillBubble('phone', '填入演示手机号')}<div class="parent-code-row"><label class="parent-field">短信验证码<input id="parent-code" inputmode="numeric" maxlength="6" value="${esc(state.codeDraft)}" placeholder="请输入验证码" oninput="parentPrototype.input('code',this.value)"></label><button id="parent-send-code" type="button" onclick="parentPrototype.action('sendCode')">获取验证码</button></div>${demoFillBubble('code', '填入演示验证码')}${notice()}${recovery?'<p class="parent-info">未绑定手机号或原手机号无法使用？请联系学校协助处理。</p>':''}${actions(button(submit, 'verifyPhone'),optional?button(requesting?'跳过手机号，提交申请':'暂不绑定手机号，继续','skipPhone','secondary'):'', button('返回', 'back', 'secondary'), !state.bound ? agreementRow() : '')}`; },
    bindSuccess() { return `${hero('绑定成功', '现在可以查看这位孩子的学习情况。')}${studentCard()}${actions(button('进入家长首页', 'home'))}`; },
    childDetail() { return views.familyManage(); },
    home() {
      if (state.homeTab === 'mine') return `<section class="parent-card parent-profile"><span class="parent-profile-avatar">家</span><div class="parent-profile-info"><strong>家长用户</strong><small>${state.verifiedPhone?"已绑定手机号 "+mask(state.verifiedPhone):"手机号未绑定"}</small><small>当前微信已关联</small></div>${roleSwitchEntry()}</section><section class="parent-card"><div class="parent-children-heading"><h2>我的孩子</h2>${state.boundStudents.length < students.length ? '<button class="parent-add-child" onclick="parentPrototype.action(\'addChild\')">＋ 添加孩子</button>' : ''}</div>${state.boundStudents.map(index => `<div class="parent-child-group"><button class="parent-list-button parent-child-entry" onclick="parentPrototype.openChildDetail(${index})"><span><strong>${students[index].name}</strong><small>${students[index].school} · ${students[index].className}</small></span><span aria-hidden="true">›</span></button><div class="parent-child-footer"><span class="parent-child-count">已绑定 ${state.families[index]?.members.length || 0}/${MAX_GUARDIANS_PER_STUDENT} 位家长</span>${state.families[index]?.primaryId===state.currentId?`<button class="parent-child-invite" onclick="parentPrototype.inviteChild(${index})">邀请家长</button>`:''}</div></div>`).join('')}</section><section class="parent-card"><h2>账号与安全</h2><button class="parent-list-button" onclick="parentPrototype.action('changePhone')">${state.verifiedPhone?"更换手机号":"绑定本人手机号"} <span>›</span></button><button class="parent-list-button" onclick="parentPrototype.action('changeWechat')">更换登录微信 <span>›</span></button><button class="parent-list-button" onclick="parentPrototype.action('logout')">退出登录 <span>›</span></button></section>${notice()}`;
      if (state.homeTab === 'homework') { const navigation = homeworkPrototype.getParentNavigation(state.activeStudent); return (navigation.detail ? `<div class="parent-detail-child">${esc(student.name)} · ${esc(student.className)}</div>` : childSwitcher(true)) + homeworkPrototype.renderParent(student.name, state.activeStudent); }
      return childSwitcher(true) + learningPrototype.renderParent(state.activeStudent);
    },
    invite() { return `${hero('邀请家长', '把小程序邀请卡片分享给家人，对方申请后由你审核。')}${studentCard()}${card('由主管理家长统一管理', `已绑定 ${guardianCount()}/${MAX_GUARDIANS_PER_STUDENT} 位家长，含你自己。其余家长无需扫码，审核同意后才能查看学习详情。`)}${notice()}${actions(button('生成微信邀请卡片', 'shareInvite'), button('查看绑定申请', 'inviter', 'secondary'), button('返回家长管理', 'familyManage', 'secondary'))}`; },
    inviter() { if(!isManager())return `${hero('主管理权限已变更','你现在是普通家长，不能继续处理绑定申请。')}${studentCard()}${card('请由现任主管理家长审核','待审核申请仍然保留，不会因主管理身份转交而自动通过或拒绝。')}${notice()}${actions(button('返回家长管理','familyManage','secondary'))}`; const r=family().application; const pending=r?.status==='pending'; return `${hero('家长绑定申请', `同意后，该家长可查看${student.name}的学习详情。`)}${studentCard()}${familyRequestList()}${pending ? card('待审核申请', `${esc(r.name)} · ${esc(r.relation)}<br>手机号 ${(r.phone?mask(r.phone):'未绑定（可选）')}<br>申请时间：${esc(r.time)}<br>请通过家庭沟通核对申请人身份。`) : card('暂无待审核申请', '家人通过邀请卡片提交申请后，会出现在这里。')}${notice()}${actions(pending ? button('同意绑定', 'approve')+button('拒绝申请', 'reject', 'secondary') : '', button('返回家长管理', 'familyManage', 'secondary'))}`; },
    pending() { const r=family().application; const status=r?.status || state.request; const titles={pending:'等待主管理家长审核',approved:'绑定成功',rejected:'申请未通过',cancelled:'申请已撤回',revoked:'邀请已失效',full:'绑定人数已满',removed:'绑定已解除',none:'尚未提交申请'}; return `${hero(titles[status] || titles.none, status==='approved'?'你现在可以查看孩子的学习情况。':status==='pending'?'审核通过前，无法查看孩子的学习详情。':status==='removed'?'你已失去该孩子的查看权限，孩子学习记录仍然保留。':'本次申请未建立有效绑定，无法查看学习详情。')}${studentCard()}${r ? card('申请信息', `${esc(r.name)} · ${esc(r.relation)}<br>手机号 ${r.phone?mask(r.phone):'未绑定（可选）'}<br>由主管理家长审核`) : ''}${notice()}${actions(status==='approved'?button('进入家长首页','home'):status==='pending'?button('刷新审核结果','refreshRequest')+button('撤回申请','cancelRequest','secondary'):status==='rejected'||status==='cancelled'?button('重新申请绑定','beginRequest'):'', status==='removed'&&state.boundStudents.length?button('查看其他已绑定孩子','remainingChildren'):'',button('返回登录入口','entry','secondary'))}`; },
    needInvite() { const manager=family().members.find(m=>m.id===family().primaryId); return `${hero('该孩子已有家长绑定','')}${studentCard()}${manager?card('已绑定的主管理家长',esc(manager.name)+' · '+esc(manager.relation)+'<br>手机号：'+(manager.phone?mask(manager.phone):'暂未绑定手机号')+'<br>认识对方：请联系其分享邀请卡片。<br>不认识或疑似误绑定：请联系学校协助处理。'):''}${card('通过家庭邀请申请','请联系已绑定的主管理家长，在“我的 → 孩子 → 家长管理”中分享邀请卡片。打开邀请后申请，无需再次扫描学生二维码。')}${notice()}${actions(button('我知道了','entry'))}`; },
    capReached() { return `${hero('绑定人数已满', '每个孩子最多绑定 6 位家长，含主管理家长。')}${studentCard()}${card('暂时无法新增家长', '请主管理家长核对已绑定名单，解除不再需要的绑定后，再分享邀请卡片。待审核申请不占用名额。')}${actions(button('返回', state.bound?'familyManage':'inviteLanding','secondary'))}`; },
    manage() { return `${hero('管理孩子绑定', '解除自己的绑定后，将无法继续查看该孩子的学习详情。')}${studentCard()}${notice()}${actions(button('查看家长管理','familyManage'),button('解除自己的绑定','unbindConfirm','secondary'))}`; },
    unbindConfirm() { const f=family(); const next=f.members.find(m=>m.id!==state.currentId); const copy=isManager() && f.members.length===2?'解除后，'+esc(next.name)+'将自动成为主管理家长，无需对方确认。':f.members.length===1?'你是最后一位绑定家长。解除后，该孩子将没有家长绑定；后续需重新走首位家长绑定流程。':'解除后，主管理家长及其他家长的绑定不受影响。'; return `${hero('确定解除自己的绑定？', '解除后，你将无法继续查看'+student.name+'的学习详情和作业。')}${studentCard()}<div class="parent-info">${copy}</div>${actions(button('确认解除绑定','unbind'),button('取消','familyManage','secondary'))}`; },

    familyManage() { const f=family(); const r=f.application; const pending=Object.values(f.applications).filter(item=>item.status==='pending').length; return `<div class="family-hero">${hero('家长管理', isManager()?(f.members.length===1?'当前仅你一位家长，你自动担任主管理家长。':'你是主管理家长，可邀请、审核和解除其他家长的绑定。'):'你是普通家长，家长邀请和审核由主管理家长负责。')}<button class="family-manage-trigger" aria-haspopup="dialog" aria-expanded="${familyMenuOpen}" onclick="parentPrototype.action('familyMenu')">更多</button></div>${studentCard()}<section class="parent-card family-section"><div class="family-section-head"><h2>已绑定家长</h2><span>${f.members.length}/${MAX_GUARDIANS_PER_STUDENT} 位</span></div>${f.members.map(m=>memberRow(m,isManager())).join('')}</section>${isManager()?'<button class="parent-list-button family-request-entry" onclick="parentPrototype.action(\'inviter\')"><span>绑定申请'+(pending?' <b class="family-badge">'+pending+' 条待审核</b>':'')+'</span><span>›</span></button>':''}${notice()}${isManager()?actions(button('邀请家长','invite')):''}${familyMenu()}`; },
    shareInvite() { return `${hero('分享邀请卡片', '请将卡片通过微信发给需要绑定的家人。')}<section class="parent-card family-share"><span class="family-share-label">小程序 · 家长服务</span><h2>邀请你一起关注${student.name}的成长</h2><p>${student.school} · ${student.className}</p><div class="family-share-bottom"><span class="parent-avatar">家</span><p>打开后申请绑定<br>主管理家长审核后生效</p></div></section><div class="parent-info">邀请仅供家庭成员使用。你可以撤回邀请，使未完成的申请失效。</div>${notice()}${actions(button('撤回本次邀请','revokeInvite','secondary'),button('返回家长管理','familyManage','secondary'))}`; },
    inviteLanding() { const f=family(); if(f.inviteStatus!=='valid')return views.inviteUnavailable(); return `${hero('收到家长绑定邀请', '主管理家长邀请你一起关注孩子的学习。')}${studentCard()}${card('申请后由主管理家长审核', '请填写本人姓名和与孩子的关系，手机号可选。主管理家长同意后才能查看学习详情，无需扫码。')}${notice()}${actions(button('申请绑定','beginRequest'),button('暂不申请','entry','secondary'))}`; },
    inviteUnavailable() { return `${hero('邀请已失效', '这张邀请卡片已被撤回或已过期。')}${card('请重新获取邀请', '联系主管理家长重新分享小程序邀请卡片后，再申请绑定。')}${actions(button('返回登录入口','entry','secondary'))}`; },
    requestForm() { return `${hero('申请绑定孩子', '请填写本人信息，方便主管理家长核对。')}${studentCard()}<label class="parent-field">申请人姓名<input maxlength="20" value="${esc(state.applicantName)}" placeholder="请输入本人姓名" oninput="parentPrototype.familyInput('name',this.value)"></label><fieldset class="family-relation-field"><legend>与孩子的关系</legend><div class="family-relation-options" role="group" aria-label="与孩子的关系">${['爸爸','妈妈','爷爷','奶奶','外公','外婆','其他'].map(value=>{const selected=value==='其他'?state.customRelationMode:!state.customRelationMode&&value===state.applicantRelation;return `<button type="button" class="family-relation-option${selected?' is-selected':''}" aria-pressed="${selected}" onclick="parentPrototype.familyInput('relationChoice','${value}')">${value}</button>`;}).join('')}</div>${state.customRelationMode?`<label class="family-relation-custom">请填写关系<input maxlength="12" value="${esc(state.applicantRelation)}" placeholder="例如：姑姑、舅舅" oninput="parentPrototype.familyInput('relation',this.value)"></label>`:''}</fieldset>${notice()}${actions(button('下一步','submitFamilyRequest'),button('返回','inviteLanding','secondary'))}`; },
    removeConfirm() { const m=family().members.find(m=>m.id===state.selectedMember); return `${hero('确定解除绑定？', '请核对要解除绑定的家长。')}${studentCard()}${m?card(esc(m.name)+' · '+esc(m.relation), (m.phone?mask(m.phone):'手机号未绑定')):''}<div class="parent-info parent-danger">解除后，对方将立即无法查看${student.name}的学习详情和作业。孩子的学习记录及其他家长的绑定不受影响。</div>${actions(button('确认解除绑定','removeMember'),button('取消','familyManage','secondary'))}`; },
    transfer() { const members=family().members.filter(m=>m.id!==state.currentId); const leaving=Boolean(state.transferForUnbind); return `${hero(leaving?'选择接任家长':'转交主管理身份', leaving?'选择后立即由对方接任，并解除你与该孩子的绑定。':'选择后立即转交，无需对方确认；你将成为普通家长。')}${studentCard()}<section class="parent-card family-section"><h2>选择已绑定家长</h2>${members.length?members.map(m=>'<button class="family-transfer-row" onclick="parentPrototype.familySelect(\''+m.id+'\',\'transfer\')"><span>'+esc(m.name)+' · '+esc(m.relation)+'<small class="family-transfer-phone">'+(m.phone?mask(m.phone):'手机号未绑定')+'</small></span><span>'+(leaving?'接任并解绑 ›':'直接转交 ›')+'</span></button>').join(''):'<p>当前只有你一位家长，你自动担任主管理家长；绑定其他家长后可直接转交。</p>'}</section>${notice()}${actions(button('取消，返回家长管理','familyManage','secondary'))}`; },
    wechatGuide() { return `${hero('更换登录微信', '请在要使用的新微信中打开通晤纪AI伴学小程序。')}${card('用原手机号找回', `在新微信中使用原已验证手机号 ${mask(state.verifiedPhone)} 接收验证码，找到原家长账号后确认改绑。孩子关联会保留，原微信将失去快捷登录资格。`)}<div class="parent-info">微信账号不能在小程序内直接切换。请先在微信中切换账号，或使用登录了新微信的设备。</div>${notice()}${actions(button('返回“我的”', 'home', 'secondary'))}`; },
    newWechat() { return `${hero('确认使用新微信', '手机号验证成功，已找到你的原家长账号。')}${card('原账号与孩子关联将保留', '确认后，这个微信将用于快捷登录；原微信会失去该账号的快捷登录资格。')}${actions(button('确认关联当前微信', 'replaceWechat'), button('取消', 'entry', 'secondary'))}`; },
    blocked() { return `${hero('暂时无法找回账号', '原微信和已验证的手机号都无法使用时，不能在小程序中自助接管原账号。')}${card('请联系学校协助处理', '原微信和手机号均无法使用时，请联系学校协助处理。学生二维码不能用于找回原家长账号。')}${actions(button('返回登录入口', 'entry', 'secondary'))}`; },
    cardError() { const foreign = state.card === 'foreign'; const invalid = state.card === 'invalid'; const disabled=state.card==='disabled', deleted=state.card==='deleted'; const title = foreign ? '无法识别这个二维码' : invalid ? '二维码无法使用' : disabled ? '学生账号已禁用' : deleted ? '学生账号已删除' : '暂无法关联孩子'; const detail = foreign ? '这不是通晤纪AI伴学的学生二维码。请扫描学校发给家庭的二维码。' : invalid ? '二维码可能已作废，请联系学校重新获取。' : disabled ? '该学生账号暂时停用，当前无法绑定。请联系学校恢复账号后重试。' : deleted ? '该学生账号已删除，原绑定二维码已无法使用。请联系学校核实学生资料并重新获取绑定码。' : '这位学生的账号当前无法关联，请联系学校确认。'; return `${hero(title, detail)}${actions(button('重新扫码', 'retryScan'), button('返回', 'cancelScan', 'secondary'))}`; }
  };
  const flowNames = { first: '首位家长绑定', returning: '已绑定家长再次进入', duplicateScan:'已绑定家长重复扫码', twoChildren: '两个孩子的学情与作业', otherDevice: '同一微信在另一设备登录', second: '第二位家长申请', third:'第三位家长申请', fourth:'第四位家长申请', fifth:'第五位家长申请', sixth:'第六位家长申请', seventh:'第七位家长申请（人数已满）', familyManage:'主管理家长管理', ordinary:'普通家长权限', wrong: '解除孩子关联', lostWechat: '原微信丢失后找回', lostPhone: '原手机号丢失后更换', bothLost: '微信和手机号均丢失' };
  const flowSteps = {
    first: ['微信登录（手机号授权可跳过）', '扫描并核对孩子', '绑定手机号（可跳过）', '关联成功并查看学情'],
    duplicateScan: ['已绑定孩子，再次扫码','识别已有绑定，不重复申请','直接进入孩子首页'],
    returning: ['已有孩子关联', '当前微信快捷进入', '查看家长首页'],
    twoChildren: ['两个孩子均已关联', '切换孩子查看学情', '保留当前孩子查看作业'],
    otherDevice: ['新设备发现账号已在另一设备登录', '确认继续登录', '新设备进入，原设备退出', '原设备看到下线提示'],
    second: ['打开邀请卡片', '填写本人信息（手机号可跳过）', '等待主管理家长审核', '主管理家长同意或拒绝', '申请方查看结果'],
    third: ['打开邀请卡片','填写本人信息（手机号可跳过）','等待主管理家长审核','主管理家长同意或拒绝','申请方查看结果'],
    fifth: ['打开邀请卡片','填写本人信息（手机号可跳过）','等待主管理家长审核','主管理家长同意或拒绝','申请方查看结果'],
    sixth: ['打开邀请卡片','填写本人信息（手机号可跳过）','等待主管理家长审核','主管理家长同意或拒绝','申请方查看结果'],
    seventh: ['孩子已绑定 6 位家长','第七位家长无法申请绑定','联系主管理家长释放名额后重试'],
    fourth: ['打开邀请卡片','填写本人信息（手机号可跳过）','等待主管理家长审核','主管理家长同意或拒绝','申请方查看结果'],
    familyManage: ['查看家长名单','审核或邀请家长','解除误绑定或转交身份'],
    ordinary: ['查看家长名单','仅可解除自己的绑定'],
    wrong: ['进入已关联账号', '打开绑定管理', '确认解除关联', '返回未关联状态'],
    lostWechat: ['从新微信发起找回', '验证原手机号', '确认改绑', '查看原孩子关联'],
    lostPhone: ['原微信进入账号', '打开更换手机号', '验证新手机号'],
    bothLost: ['发起找回', '查看无法自助接管提示']
  };
  function reviewStep() {
    const view = state.view, flow = state.flow;
    if (['second','third','fourth','fifth','sixth'].includes(flow)) {
      if (state.request === 'approved' || state.request === 'rejected' || state.request === 'full') return 4;
      if (view === 'needInvite') return 4;
      if (state.actor === 'inviter') return 3;
      return ({ entry: 0, inviteLanding:0, requestForm:1, phone: 1, pending: 2, familyManage:3, inviter:3, capReached: 4 })[view] ?? 0;
    }
    if(flow==='seventh')return view==='capReached'?1:0;
    const maps = {
      familyManage: { familyManage:0, invite:1, shareInvite:1, inviter:1, removeConfirm:2, transfer:2 }, ordinary:{familyManage:0,unbindConfirm:1,entry:1},
      first: { entry: 0, scan: 1, scanning: 1, cardError: 1, confirm: 1, phone: 2, bindSuccess: 3, home: 3 },
      duplicateScan: { scan:0, scanning:0, confirm:1, alreadyBound:1, home:2 },
      returning: { home: 2, entry: 0 }, twoChildren: { home: 1, entry: 0 },
      otherDevice: { entry: 0, deviceConfirm: 1, home: 2, deviceKicked: 3 },
      wrong: { home: 1, manage: 2, unbindConfirm: 2, entry: state.boundStudents.length ? 0 : 3 },
      lostWechat: { entry: 0, phone: 1, newWechat: 2, home: 3 },
      lostPhone: { entry: 0, home: state.verifiedPhone === '13800138000' ? 1 : 2, phone: 2 },
      bothLost: { entry: 0, blocked: 1 }
    };
    return maps[flow]?.[view] ?? 0;
  }
  function syncParentReview() {
    document.querySelectorAll('[data-parent-scenario]').forEach(b => b.classList.toggle('active', b.dataset.parentScenario === state.flow));
    const context = document.getElementById('parent-review-context');
    const steps = document.getElementById('parent-review-steps');
    const actions = document.getElementById('parent-review-actions');
    const detail = document.getElementById('parent-review-detail');
    if (!context || !steps || !actions || !detail) return;
    const count = guardianCount();
    const actor = state.actor === 'inviter' ? '邀请方家长' : ['second','third','fourth','fifth','sixth','seventh'].includes(state.flow) ? '申请方家长' : '当前家长';
    context.innerHTML = `<strong>${esc(flowNames[state.flow])}</strong><br>${actor}${['second','seventh'].includes(state.flow) ? ` · ${esc(student.name)} · 已关联 ${count}/${MAX_GUARDIANS_PER_STUDENT} 位` : ''}`;
    const current = reviewStep();
    steps.innerHTML = (flowSteps[state.flow] || flowSteps.first).map((label, index) => `<li class="${index < current ? 'done' : index === current ? 'current' : ''}">${index + 1}. ${label}</li>`).join('');
    let available = '';
    if (family().application?.status === 'pending' && !isManager()) {
      available += '<button onclick="parentPrototype.familyReview(&quot;manager&quot;)">切换主管理家长审核 →</button>';
    }
    if(isManager() && state.view==='shareInvite') available += '<button onclick="parentPrototype.familyReview(&quot;newRecipient&quot;)">模拟家人打开微信邀请卡片 →</button>';
    if(isManager() && family().application) available += '<button onclick="parentPrototype.familyReview(&quot;recipient&quot;)">切换申请家长查看结果 →</button>';
    if(!isManager() && family().primaryId && family().application?.status!=='pending') available += '<button onclick="parentPrototype.familyReview(&quot;manager&quot;)">切换主管理家长 →</button>';
    if (state.view === 'wechatGuide') available += '<button onclick="parentPrototype.action(\'continueNewWechat\')">模拟从新微信继续换绑 →</button>';
    if (state.flow === 'otherDevice' && state.view === 'home') available += '<button onclick="parentPrototype.action(\'showOriginalDevice\')">查看原设备的下线提示 →</button>';
    actions.innerHTML = available || '<p class="parent-review-hint">请在手机画面继续操作，进度会自动更新。</p>';
    detail.innerHTML = state.flow === 'otherDevice' ? '演示条件：两台设备使用同一微信。新设备确认登录后，原设备会话失效。' : '演示验证码：123456';
  }
  function render() { if (typeof app === 'undefined') return; family(); if(state.view==='home' && (!state.bound || !family().members.some(m=>m.id===state.currentId))) state.view=family().application?.id===state.currentId?'pending':'entry'; const name = state.view in views ? state.view : 'entry'; const taskNavigation = name === 'home' && state.homeTab === 'homework' ? homeworkPrototype.getParentNavigation(state.activeStudent) : null; const detail = Boolean(taskNavigation?.detail); const title = detail ? taskNavigation.title : name === 'home' ? ({ learning: '学习报告', homework: '作业', mine: '我的' })[state.homeTab] : ({ entry: '家长登录', childDetail: '孩子绑定', scanning: '扫描二维码', confirm: '确认孩子', phone: '手机号验证', deviceConfirm: '确认登录', deviceKicked: '登录已退出' })[name] || '家长服务'; app.innerHTML = `<main class="screen parent-screen">${bar(title, detail)}${exceptionPanel()}<section class="parent-main${name === 'home' && !detail ? ' parent-main--tabbed' : ''}">${views[name]()}</section>${name === 'home' && !detail ? tabBar() : ''}${childPickerDialog()}${phoneSheet()}${agreementDialog()}</main>`; syncReview(); syncParentReview(); updateCodeButton(); if(state.exceptionMenuOpen)document.querySelector('.parent-exception-close')?.focus(); }
  function tab(name) { childPickerOpen = false; if (!state.bound || !['learning', 'homework', 'mine'].includes(name)) return; state.homeTab = name; state.view = 'home'; clearMessage(); render(); }
  function selectChild(index) { if (!state.boundStudents.includes(index)) return; childPickerOpen = false; if (state.activeStudent !== index) { homeworkPrototype.resetParentView(); learningPrototype.resetDetail(); } chooseStudent(index); if (state.homeTab === 'mine') state.homeTab = 'learning'; save(); render(); }
  function openChildDetail(index) { if (!state.boundStudents.includes(index)) return; chooseStudent(index); state.homeTab = 'mine'; state.view = 'childDetail'; save(); render(); }
  function inviteChild(index) { if (!state.boundStudents.includes(index)) return; chooseStudent(index); save(); action('invite'); }
  function start() { clearScanTimer(); clearMessage(); if(!state.loggedOut && !state.bound && family().application?.id===state.currentId){state.view='pending';go('parent');return;} state.view = state.loggedOut ? 'entry' : state.originalDeviceKicked ? 'deviceKicked' : state.bound && state.currentWechatLinked ? 'home' : 'entry'; go('parent'); }
  function scenario(name) { pageExceptionSnapshot=null;exceptionOriginChoices=[];activeExceptionKey='';activeExceptionLabel='';familyMenuOpen=false; if (!(name in flowSteps)) return; clearScanTimer(); resetCodeCountdown(); localStorage.removeItem(savedKey); state = fresh(); chooseStudent(0); state.flow = name; if (name === 'returning' || name === 'duplicateScan' || name === 'wrong' || name === 'lostPhone') { state.bound = true; state.boundStudents = [0]; state.guardianCounts[0] = 1; state.verifiedPhone = '13800138000'; } if(name==='duplicateScan'){state.view='scan';state.addingChild=true;} if (name === 'twoChildren') { state.bound = true; state.boundStudents = [0, 1]; state.guardianCounts = [1, 1]; state.verifiedPhone = '13800138000'; state.view = 'home'; save(); } if (name === 'otherDevice') { state.boundStudents = [0]; state.guardianCounts[0] = 1; state.verifiedPhone = '13800138000'; state.view = 'deviceConfirm'; } if (name === 'wrong' || name === 'lostPhone') state.homeTab = 'mine'; if (['second','third','fourth','fifth','sixth','seventh','familyManage','ordinary'].includes(name)) { state.invite = true; state.guardianCounts[0] = ({second:1,third:2,fourth:3,fifth:4,sixth:5,seventh:6,familyManage:3,ordinary:2})[name]; family(); if(name==='familyManage'||name==='ordinary'){activateFamilyMember(name==='ordinary'?'member2':'owner');state.view='familyManage';}else{state.currentId='member'+(state.guardianCounts[0]+1);state.view=name==='seventh'?'capReached':'inviteLanding';state.applicantRelation=({second:'妈妈',third:'爷爷',fourth:'奶奶',fifth:'外公',sixth:'外婆',seventh:'姑姑'})[name];} } if (name === 'lostWechat' || name === 'bothLost') { state.verifiedPhone = name === 'lostWechat' ? '13800138000' : ''; state.boundStudents = [0]; state.guardianCounts[0] = 1; state.currentWechatLinked = false; } for(const index of state.boundStudents){const active=state.activeStudent;state.activeStudent=index;family();state.activeStudent=active;} save(); go('parent'); }
  function back() { if(state.exceptionMenuOpen){state.exceptionMenuOpen=false;render();return;}  if(familyMenuOpen){familyMenuOpen=false;render();return;} if (state.phoneSheetOpen) { action('denyWechatPhone'); return; } if(state.view==='transfer')state.transferForUnbind=false; if (childPickerOpen) { childPickerOpen = false; render(); return; } if (state.view === 'home' && state.homeTab === 'homework' && homeworkPrototype.getParentNavigation(state.activeStudent).detail) { homeworkPrototype.toParentList(); return; } if(state.view==='alreadyBound'){state.addingChild=false;state.homeTab='mine';state.view='home';clearMessage();render();return;} if (state.view === 'entry' || state.view === 'home' || state.view === 'deviceKicked') { go('home'); return; } if (state.view === 'deviceConfirm') { state.view = 'entry'; } else if (state.view === 'phone' && state.phonePurpose === 'request') state.view = 'requestForm'; else if (state.view === 'phone') state.view = state.phonePurpose === 'change' ? 'home' : state.phonePurpose === 'recover' ? 'entry' : 'confirm'; else if (state.view === 'confirm') state.view = 'scan'; else if (state.view === 'childDetail' || state.view === 'familyManage') { state.homeTab = 'mine'; state.view = 'home'; } else if (state.view === 'scan' || state.view === 'scanning') { action('cancelScan'); return; } else if (['inviter','invite','removeConfirm','transfer','shareInvite','manage'].includes(state.view)) state.view = 'familyManage'; else if (state.view === 'requestForm') state.view = 'inviteLanding'; else if (state.view === 'pending' && !state.bound) state.view = 'entry'; else state.view = state.bound ? 'home' : 'entry'; clearMessage(); render(); }
  function input(field, value) { if (field === 'phone') { const phone = value.replace(/\D/g, '').slice(0, 11); if (phone !== state.phoneDraft) { state.codeSent = false; resetCodeCountdown(); } state.phoneDraft = phone; } if (field === 'code') state.codeDraft = value.replace(/\D/g, '').slice(0, 6); state.error = ''; }
  function fillDemo(field) { if (state.view !== 'phone') return; if (field === 'phone') { const phone = state.phonePurpose === 'recover' ? state.verifiedPhone || '13800138000' : state.phonePurpose==='request' ? ['13900139000','13600136000','13500135000','13400134000','13300133000','13200132000'].find(phone=>!family().members.some(m=>m.phone===phone)) || '13400134000' : state.phonePurpose==='change' ? '13900139000' : '13800138000'; if (state.phoneDraft !== phone) { state.codeSent = false; state.codeDraft = ''; resetCodeCountdown(); } state.phoneDraft = phone; } else if (field === 'code') state.codeDraft = '123456'; else return; clearMessage(); render(); }
  function exception(name) {
    if(name!=='normal'){
      const current=exceptionChoices(), origin=exceptionOriginChoices.find(([key])=>key===name);
      if(!current.some(([key])=>key===name)&&!origin)return;
      if(pageExceptionSnapshot&&origin){state=JSON.parse(pageExceptionSnapshot);student=students[state.activeStudent];clearMessage();}
      else{pageExceptionSnapshot=JSON.stringify({...state,exceptionMenuOpen:false});exceptionOriginChoices=current;}
      activeExceptionKey=name;activeExceptionLabel=(current.find(([key])=>key===name)||origin)[1];
    }
    if(injectPageException(name))return; if (name==='normal' && ['inviteLanding','inviter','pending','inviteUnavailable','capReached'].includes(state.view)) { const f=family(); f.inviteStatus='valid'; f.members=f.members.filter(m=>!m.simulated); state.guardianCounts[state.activeStudent]=f.members.length; clearMessage(); state.view=state.bound?'inviter':'inviteLanding';render();return; } if (['expiredInvite','revokedInvite','full','slotTaken'].includes(name) && exceptionChoices().some(([key])=>key===name)) { const f=family(); state.exceptionMenuOpen=false; if(name==='expiredInvite'||name==='revokedInvite'){f.inviteStatus=name==='expiredInvite'?'expired':'revoked';state.view='inviteUnavailable';}else{while(f.members.length<MAX_GUARDIANS_PER_STUDENT)f.members.push({id:'simulated'+f.members.length,name:'其他已绑定家长',relation:'家庭成员',phone:'13600136000',simulated:true});state.guardianCounts[state.activeStudent]=f.members.length;if(name==='full')state.view='capReached';else state.notice='演示：另一条申请先占用了最后名额，本次审核将无法通过。';}save();render();return; } if (name !== 'normal' && !exceptionChoices().some(([key]) => key === name)) return; state.exceptionMenuOpen = false; state.exceptionMode = name === 'normal' ? '' : name; clearMessage(); if (name === 'normal') state.card = 'valid'; if (state.view === 'scan') {state.card = ['foreign', 'invalid', 'disabled', 'deleted'].includes(name) ? name : 'valid';if(state.card!=='valid')state.view='cardError';} if (state.view === 'confirm') state.notice = ({ noInvite: '演示：确认后会提示需要已绑定家长邀请。', full: '演示：确认后会提示关联人数已满。', lastSlot: '演示：确认后进入最后一个名额的申请流程。' })[name] || ''; if (state.view === 'phone') state.error = ({ codeExpired: '验证码错误或已过期', phoneConflict: '该号码暂无法用于当前账号，请核对或联系客服处理' })[name] || ''; if (name === 'slotTaken') { state.guardianCounts[state.activeStudent] = MAX_GUARDIANS_PER_STUDENT; state.request = 'full'; } render(); }
  function action(name) {
    clearMessage();
    state.exceptionMenuOpen = false;
    if (name === 'closeAgreement') { state.agreementKind = ''; return render(); }
    if (!state.bound && ['scan','quick','recover','verifyPhone','continueDeviceLogin','retryAfterKick'].includes(name) && !state.agreementAccepted) { state.error = '请先阅读并勾选同意协议'; if (['deviceConfirm','deviceKicked'].includes(state.view)) state.view = 'entry'; return render(); }
    if(name==='remainingChildren'){const index=state.boundStudents.find(i=>state.families[i]?.members.some(m=>m.id===state.currentId));if(index===undefined)return;chooseStudent(index);state.bound=true;state.homeTab='learning';state.view='home';save();return render();}
    if (name === 'back') return back();
    if (familyAction(name)) return;
    if(name==='scan'&&state.exceptionMode==='loginFailed'){state.error='微信登录暂未成功，请重试，或使用原手机号找回账号。';return render();}
    if (name === 'scan' && !state.verifiedPhone && !state.phoneAuthorizationHandled) { state.phoneSheetOpen = true; return render(); }
    if (name === 'denyWechatPhone') { state.phoneSheetOpen = false; state.phoneAuthorizationHandled=true;state.view='scan';state.notice = '已跳过手机号授权，可继续扫码绑定孩子，之后在“我的”补绑手机号。'; return render(); }
    if (name === 'approveWechatPhone' || name === 'otherWechatPhone') { if (!state.phoneSheetOpen) return; state.phoneSheetOpen = false; state.phoneAuthorizationHandled = true; state.phoneDraft = name === 'approveWechatPhone' ? '13800138000' : ''; state.codeDraft = ''; state.codeSent = false; resetCodeCountdown(); state.view = 'scan'; return render(); }
    if (name === 'continueDeviceLogin' && state.flow === 'otherDevice') { state.bound = true; state.loggedOut = false; state.originalDeviceKicked = false; state.view = 'home'; save(); return render(); }
    if (name === 'cancelDeviceLogin' && state.flow === 'otherDevice') { state.view = 'entry'; return render(); }
    if (name === 'showOriginalDevice' && state.flow === 'otherDevice' && state.view === 'home') { state.originalDeviceKicked = true; state.view = 'deviceKicked'; return render(); }
    if (name === 'retryAfterKick' && state.flow === 'otherDevice') { state.bound = false; state.originalDeviceKicked = false; state.view = 'deviceConfirm'; return render(); }
    if (name === 'retryScan' && pageExceptionSnapshot) { exception('normal');return; }
    if (name === 'retryScan') { state.card = 'valid'; state.exceptionMode = ''; state.view = 'scan'; return render(); }
    if (name === 'cancelScan') { clearScanTimer(); if (state.addingChild && state.boundStudents.length) { chooseStudent(state.boundStudents[0]); state.addingChild = false; state.homeTab = 'mine'; state.view = 'home'; } else state.view = 'entry'; return render(); }
    if (name === 'quick') { if (state.flow === 'otherDevice') { state.view = 'deviceConfirm'; return render(); } if (state.boundStudents.length && state.currentWechatLinked) { state.bound = true; state.loggedOut = false; state.view = 'home'; save(); } else { state.error = '当前微信还没有关联孩子，请先扫描学校发放的二维码，或用原手机号找回账号。'; } return render(); }
    if (name === 'startScan') { if(state.exceptionMode==='cameraDenied'){state.error='请先在微信设置中允许使用相机，或从相册选择二维码。';return render();} clearScanTimer(); state.view = 'scanning'; render(); scanTimer = setTimeout(() => { scanTimer = null; if (state.view === 'scanning') action('scanResult'); }, 1800); return; }
    if (name === 'scanResult') { clearScanTimer();if(state.exceptionMode==='scanNetwork'){state.view='scan';state.error='二维码识别失败，请检查网络后重试。';return render();} state.view = state.card !== 'valid' ? 'cardError' : state.boundStudents.includes(state.activeStudent) && family().members.some(m=>m.id===state.currentId) ? 'alreadyBound' : capacityFull()?'capReached':guardianCount()>0?'needInvite':'confirm'; return render(); }
    if(name==='enterBoundChild'){if(!state.boundStudents.includes(state.activeStudent)||!family().members.some(m=>m.id===state.currentId)){state.view='scan';return render();}state.bound=true;state.addingChild=false;state.homeTab='learning';state.view='home';save();return render();}
    if (name === 'confirm') { if (['disabled', 'deleted'].includes(state.exceptionMode)) { state.card = state.exceptionMode; state.view = 'cardError'; } else if (state.boundStudents.includes(state.activeStudent) && family().members.some(m=>m.id===state.currentId)) state.view='alreadyBound'; else if (state.exceptionMode === 'full') state.view = 'capReached'; else if (state.exceptionMode === 'noInvite') state.view = 'needInvite'; else { if (state.exceptionMode === 'lastSlot') { state.guardianCounts[state.activeStudent] = MAX_GUARDIANS_PER_STUDENT - 1; state.invite = true; } if (capacityFull() && !state.boundStudents.includes(state.activeStudent)) state.view = 'capReached'; else if (guardianCount() > 0 && !state.boundStudents.includes(state.activeStudent) && !state.invite) state.view = 'needInvite'; else if (guardianCount() > 0 && !state.boundStudents.includes(state.activeStudent) && state.invite) { state.view = 'needInvite'; } else if (state.verifiedPhone) { state.view = finishStudentBind() ? 'bindSuccess' : 'capReached'; } else { state.phonePurpose = 'bind'; state.view = 'phone'; } } state.exceptionMode = ''; return render(); }
    if(name==='skipPhone'){
      if(state.view!=='phone')return;
      if(!['bind','request'].includes(state.phonePurpose))return;
      if(!state.bound&&!state.agreementAccepted){state.error='请先阅读并勾选同意协议';return render();}
      if(state.exceptionMode==='submitNetwork'){state.error='网络异常，暂未提交成功，请检查网络后重试。';return render();}
      if(['disabled','deleted'].includes(state.exceptionMode)){state.card=state.exceptionMode;state.view='cardError';return render();}
      const f=family();if(state.phonePurpose==='request'){
        if(!state.applicantName.trim()||!state.applicantRelation.trim()){state.view='requestForm';state.error='请填写本人姓名和与孩子的关系。';return render();}
        if(f.members.some(m=>m.id===state.currentId)){state.view='alreadyBound';return render();}
        if(f.applications[state.currentId]?.status==='pending'){f.application=f.applications[state.currentId];state.request='pending';state.view='pending';return render();}
        const status=f.inviteStatus!=='valid'?'revoked':capacityFull()?'full':'pending';f.application={id:state.currentId,name:state.applicantName.trim(),relation:state.applicantRelation.trim(),phone:state.verifiedPhone||'',status,time:new Date().toLocaleString('zh-CN',{hour12:false})};f.applications[state.currentId]=f.application;state.request=status;state.view='pending';
      }else if(f.members.some(m=>m.id===state.currentId)){state.view='alreadyBound';}
      else if(capacityFull()){state.view='capReached';}
      else if(f.members.length){state.view='needInvite';}
      else{state.view=finishStudentBind()?'bindSuccess':'capReached';}
      resetCodeCountdown();save();return render();
    }
    if (name === 'sendCode') {if(state.exceptionMode==='smsLimited'){state.error='验证码发送过于频繁，请稍后再试。';return render();} if (codeRemaining()) return; const phone = (document.getElementById('parent-phone')?.value || state.phoneDraft).trim(); if (!/^1\d{10}$/.test(phone)) state.error = '请输入有效的 11 位手机号'; else { state.phoneDraft = phone; state.codeSent = true; state.notice = `验证码已发送至 ${mask(phone)}`; startCodeCountdown(); } return render(); }
    if (name === 'verifyPhone') { if(state.exceptionMode==='submitNetwork'){state.error='网络异常，暂未提交成功。请检查网络后重试。';return render();} const phone = (document.getElementById('parent-phone')?.value || state.phoneDraft).trim(); const code = (document.getElementById('parent-code')?.value || state.codeDraft).trim(); if (state.exceptionMode === 'codeExpired') state.error = '验证码错误或已过期'; else if (state.exceptionMode === 'phoneConflict') state.error = '该号码暂无法用于当前账号，请核对或联系客服处理'; else if (!/^1\d{10}$/.test(phone)) state.error = '请输入有效的 11 位手机号'; else if (!state.codeSent) state.error = '请先获取验证码'; else if (code !== '123456') state.error = '验证码错误或已过期'; else if (phone === '13700137000' && state.phonePurpose !== 'recover') state.error = '该号码暂无法用于当前账号，请核对或联系客服处理'; else if (state.phonePurpose === 'recover' && phone !== state.verifiedPhone) state.error = '未找到该手机号对应的家长账号'; else if (state.phonePurpose === 'recover') state.view = 'newWechat'; else if (state.phonePurpose === 'change') { state.verifiedPhone = phone; state.view = 'home'; state.homeTab = 'mine'; state.notice = '本人手机号已验证并绑定，可用于找回当前家长账号。';for(const f of Object.values(state.families)){const member=f.members.find(m=>m.id===state.currentId);if(member)member.phone=phone;const request=f.applications?.[state.currentId];if(request)request.phone=phone;} save(); } else if (['disabled', 'deleted'].includes(state.exceptionMode)) { state.card = state.exceptionMode; state.view = 'cardError'; } else if (state.phonePurpose==='request' && family().members.some(m=>m.phone===phone && m.id!==state.currentId)) { state.error='该手机号对应的家长已绑定此孩子，无需重复申请。'; } else if (state.phonePurpose === 'request') { const f=family(); const status=f.inviteStatus!=='valid'?'revoked':capacityFull()?'full':'pending'; f.application={id:state.currentId,name:state.applicantName.trim(),relation:state.applicantRelation,phone,status,time:new Date().toLocaleString('zh-CN',{hour12:false})}; f.applications[state.currentId]=f.application; state.verifiedPhone=phone; state.request=status; state.view='pending'; save(); } else if(state.phonePurpose==='bind' && guardianCount()>0 && !family().members.some(m=>m.id===state.currentId)){state.verifiedPhone=phone;state.view=capacityFull()?'capReached':'needInvite';save();} else { state.verifiedPhone = phone; state.view = finishStudentBind() ? 'bindSuccess' : 'capReached'; } return render(); }
    if (name === 'recover') { resetCodeCountdown(); state.phonePurpose = 'recover'; state.view = state.flow === 'bothLost' ? 'blocked' : 'phone'; state.phoneDraft = ''; state.codeDraft = ''; state.codeSent = false; return render(); }
    if (name === 'changePhone') { resetCodeCountdown(); state.phonePurpose = 'change'; state.phoneDraft = ''; state.codeDraft = ''; state.codeSent = false; state.view = 'phone'; return render(); }
    if (name === 'changeWechat') { if(!state.verifiedPhone){state.view='phone';state.phonePurpose='change';state.notice='请先绑定本人手机号，再通过手机号找回原账号并更换微信。';state.phoneDraft='';state.codeDraft='';state.codeSent=false;resetCodeCountdown();return render();} state.view = 'wechatGuide'; return render(); }
    if (name === 'continueNewWechat') { if (state.view !== 'wechatGuide') return; resetCodeCountdown(); state.phonePurpose = 'recover'; state.phoneDraft = ''; state.codeDraft = ''; state.codeSent = false; state.view = 'phone'; return render(); }
    if (name === 'replaceWechat') { state.currentWechatLinked = true; state.loggedOut = false; state.bound = state.boundStudents.length > 0; state.view = 'home'; state.homeTab = 'mine'; state.notice = '已关联当前微信，原微信的快捷登录已失效。'; save(); return render(); }
    if (name === 'approve' || name === 'reject') { if (state.actor !== 'inviter' || state.request !== 'pending') return; state.request = name === 'reject' ? 'rejected' : capacityFull() ? 'full' : 'approved'; state.view = 'pending'; if (state.request === 'approved') { state.verifiedPhone = state.phoneDraft || '13900139000'; if (!finishStudentBind()) state.request = 'full'; } state.actor = 'applicant'; return render(); }
    if (name === 'invite') { state.view = capacityFull() ? 'capReached' : 'invite'; return render(); }
    if (name === 'addChild') { chooseStudent(state.boundStudents.includes(0) ? 1 : 0); state.flow = 'first'; state.addingChild = true; state.view = 'scan'; return render(); }
    if (name === 'unbind') { const removedName = student.name; learningPrototype.resetDetail(); if (state.boundStudents.includes(state.activeStudent)) state.guardianCounts[state.activeStudent] = family().members.length; state.boundStudents = state.boundStudents.filter(index => index !== state.activeStudent); state.bound = state.boundStudents.length > 0; state.invite = false; state.request = 'none'; chooseStudent(state.boundStudents[0] ?? 0); state.view = state.bound ? 'home' : 'entry'; state.homeTab = 'mine'; state.notice = `已解除你与${removedName}的关联，相关学习详情已不可查看。`; save(); return render(); }
    if (name === 'logout') { showLogoutConfirm(() => action('confirmLogout')); return; }
    if (name === 'confirmLogout') { state.agreementAccepted = false; state.loggedOut = true; state.bound = false; state.view = 'entry'; state.notice = '已退出登录。'; save(); return render(); }
    if (name in views) { if (name === 'home') state.homeTab = state.homeTab || 'learning'; state.view = name; return render(); }
  }
  return { setAgreement(value) { state.agreementAccepted = Boolean(value); state.error = ''; const error = document.querySelector('.parent-error'); if(error)error.remove(); }, openAgreement(kind) { if (!agreementDocs[kind]) return; state.agreementKind = kind; render(); }, closeAgreement() { state.agreementKind = ''; render(); }, render, start, scenario, familySelect, familyReview, familyInput, familySelectRequest, openChildPicker() { if (state.boundStudents.length > 1) { childPickerOpen = true; render(); } }, closeChildPicker() { childPickerOpen = false; render(); }, detailHome() { homeworkPrototype.resetParentView(); tab('learning'); }, action, back, input, fillDemo, tab, selectChild, openChildDetail, inviteChild, exception, hasGuardianAccess: () => state.bound && state.currentWechatLinked, switchRole: () => { if (!state.bound || !state.currentWechatLinked) return; state.homeTab = 'learning'; start(); }, toggleExceptionMenu: open => { state.exceptionMenuOpen = typeof open==='boolean'?open:!state.exceptionMenuOpen; render(); }, restart: () => scenario(state.flow), reset: () => scenario('first'), demoApprove: () => familyReview('manager') };
})();
