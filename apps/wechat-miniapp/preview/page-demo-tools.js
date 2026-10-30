/* One review-only toolbar/sheet for current-page states and exceptions. */
window.pageDemoTools = (() => {
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const attr = code => esc(code);
  let menuOpen = false, previousKey = '', context = null, changingState = false;
  function render(config) {
    const { choices, open, active, label, title, select, close, show, restore } = config;
    const groups = [...new Set(choices.map(c => c.group || '异常情况'))];
    return `<aside class="parent-demo-toolbar" aria-label="页面异常演示工具" ${open?'inert aria-hidden="true"':''}><div class="parent-demo-context"><span class="parent-demo-tag">演示</span><span class="parent-demo-label">${esc(label || '可在当前页面切换异常')}</span></div><div class="parent-demo-tools">${active?`<button class="parent-demo-restore" onclick="${attr(restore)}">恢复正常</button>`:''}<button class="parent-demo-open" aria-haspopup="dialog" aria-expanded="${Boolean(open)}" onclick="${attr(show)}">${active?'切换异常':'异常演示'}</button></div></aside>${open?`<div class="parent-exception-mask" onclick="${attr(close)}" onkeydown="if(event.key==='Escape'){${attr(close)}}"><section class="parent-exception-sheet" role="${window.demoWorkspace?.enabled?'region':'dialog'}" aria-modal="${!window.demoWorkspace?.enabled}" aria-label="当前页状态与异常" onclick="event.stopPropagation()"><header><div><small>${esc(title || '当前页面')}</small><h2>${groups.includes('业务状态')?'选择当前页状态或异常':'选择要演示的异常'}</h2></div><button class="parent-exception-close" aria-label="关闭异常演示" onclick="${attr(close)}">×</button></header><p>仅预览当前页面，可随时恢复原状态；不切换角色或重置完整流程。</p><div class="parent-exception-list">${groups.map(group=>`<h3 class="page-demo-group">${esc(group)}</h3>${choices.filter(c=>(c.group||'异常情况')===group).map(c=>`<button class="parent-exception-option${c.id===active?' is-active':''}" aria-pressed="${c.id===active}" onclick="${attr(select(c.id))}"><span><strong>${esc(c.label)}</strong><small>${esc(c.hint || '预览当前页面的提示与处理方式。')}</small></span><b aria-hidden="true">${c.id===active?'✓':'›'}</b></button>`).join('')}`).join('')}</div><footer><button onclick="${attr(window.demoWorkspace?.enabled?restore:active?restore:close)}">${window.demoWorkspace?.enabled||active?'恢复正常':'暂不演示'}</button></footer></section></div>`:''}`;
  }
  function getContext() {
    if (typeof location==='undefined' || new URLSearchParams(location.search).get('review')!=='1' || typeof stage==='undefined') return null;
    if (stage==='parent' && ['1对1讲题','孩子的错题本'].includes(document.querySelector('#app .wx-title')?.textContent?.trim())) return null;
    const parent = stage==='parent', hw = parent ? window.parentPrototype?.getDemoContext?.().homework : stage==='teacherDesk' && typeof teacherTab!=='undefined' && teacherTab==='homework';
    if (hw && window.homeworkPrototype?.getPageDemoContext) {
      const role=parent?'parent':'teacher', c=window.homeworkPrototype.getPageDemoContext(role);
      // Page tools show only this node's concerns. All 14 end-to-end presets stay in the flow guide.
      const submission=['published','partial','late','closed'];
      const result=['queued','processing','partialGrade','failed','unreleased','partialRelease','released','resubmit','changed'];
      const choices=window.demoWorkspace?.enabled?c.choices.filter(([id])=>c.mode==='detail'?submission.includes(id)||id.startsWith('upload-')||role==='teacher'&&(id.startsWith('grading-wait-')||id.startsWith('grade-overview-')||id==='correction-demo'):role==='parent'&&c.mode==='result'?result.includes(id):true):c.choices;
      return {...c,kind:'homework',choices:choices.map(([id,label,hint,group])=>({id,label,hint,group}))};
    }
    window.homeworkPrototype?.clearPageDemo?.();
    const control=window.controlPageDemo?.context();
    if(control)return {...control,kind:'control'};
    const learning=window.learningPageDemo?.context();
    if(learning)return {...learning,kind:'learning'};
    if(parent&&window.demoWorkspace?.enabled&&window.parentPrototype?.getPageDemoContext)return {...window.parentPrototype.getPageDemoContext(),kind:'parent'};
    if (!parent && typeof currentTeacherBranchOptions==='function') {
      const choices=currentTeacherBranchOptions().filter(([id])=>id!=='normal').map(([id,label])=>({id,label,group:'异常情况',hint:typeof teacherBranchMessages!=='undefined'?teacherBranchMessages[id]||'在当前页面预览处理方式。':''}));
      return {key:'teacher:'+stage,kind:'teacher',title:document.querySelector('.wx-title')?.textContent||'教师登录',choices,active:typeof teacherBranch!=='undefined'&&teacherBranch!=='normal'?teacherBranch:'',label:choices.find(c=>c.id===teacherBranch)?.label||''};
    }
    return null;
  }
  function sync() {
    context=getContext();
    const old=document.getElementById('page-demo-tools-host');
    window.demoWorkspace?.setState(context);
    if(!context?.choices.length){old?.remove();menuOpen=false;previousKey='';document.body.classList.remove('dw-state-open');return;}
    if(context.key!==previousKey&&!changingState)menuOpen=false;
    previousKey=context.key;
    const screen=document.querySelector('#app .screen'); if(!screen)return;
    const external=window.demoWorkspace?.enabled?document.getElementById('dw-state-body'):null;
    let host=old;
    if(!host||!(external||screen).contains(host)){old?.remove();host=document.createElement('div');host.id='page-demo-tools-host';host.className='page-demo-tools-host';if(external)external.append(host);else{const header=screen.querySelector('.wx-header');if(header)header.after(host);else screen.prepend(host);}}
    // Existing parent auth/family pages retain their own controller and snapshots.
    if(context.kind==='homework')screen.querySelectorAll(':scope > .parent-demo-toolbar, :scope > .parent-exception-mask').forEach(el=>el.remove());
    host.innerHTML=render({...context,open:menuOpen,select:id=>'pageDemoTools.select('+JSON.stringify(id)+')',show:'pageDemoTools.open()',close:'pageDemoTools.close()',restore:'pageDemoTools.restore()'});
    if(context.kind==='control' && context.active){
      const choice=context.choices.find(item=>item.id===context.active);
      host.insertAdjacentHTML('beforeend',`<section class="control-demo-detail" role="status" style="padding:14px;line-height:1.7;color:inherit"><strong>${esc(choice.group)} · ${esc(choice.label)}</strong><p>${esc(choice.hint)}</p><small>${choice.id==='classRevoked'?'本地调整权限已关闭，弹窗仅作通知，可在管理员端重新开启。':choice.id==='durationRevoked'?'点“知道了”后同步关闭本地调整权限，可在管理员端重新开启。':'场景说明 · 不修改当前管控设置'}</small></section>`);
    }
    document.getElementById('dw-state-toggle')?.setAttribute('aria-expanded',String(menuOpen));
    document.body.classList.toggle('dw-state-open',Boolean(menuOpen&&external));
    positionPicker();
  }
  function positionPicker(){
    if(!menuOpen||!window.demoWorkspace?.enabled)return;
    const panel=document.querySelector('#dw-state .parent-exception-mask'),canvas=document.getElementById('dw-canvas'),toolbar=document.querySelector('#dw-state .dw-state-heading');
    if(!panel||!canvas||!toolbar)return;
    const bounds=canvas.getBoundingClientRect(),anchor=toolbar.getBoundingClientRect(),gap=16;
    const width=Math.min(320,innerWidth-24);
    panel.style.width=width+'px';
    const height=panel.getBoundingClientRect().height;
    const right=bounds.right+gap,left=bounds.left-gap-width;
    const x=right+width<=innerWidth-12?right:left>=12?left:Math.max(12,Math.min(innerWidth-width-12,anchor.right-width));
    panel.style.left=x+'px';
    panel.style.top=Math.max(12,Math.min(anchor.bottom-height,innerHeight-height-12))+'px';
  }

  function open(){menuOpen=true;sync();document.querySelector('#page-demo-tools-host .parent-exception-close')?.focus({preventScroll:true});}
  function close(){menuOpen=false;sync();(document.getElementById('dw-state-toggle')||document.querySelector('#page-demo-tools-host .parent-demo-open'))?.focus({preventScroll:true});}
  function select(id){const c=getContext();if(!c?.choices.some(choice=>choice.id===id))return;changingState=Boolean(window.demoWorkspace?.enabled);if(!changingState)menuOpen=false;try{if(c.kind==='control'){window.controlPageDemo.select(id);menuOpen=false;}else if(c.kind==='homework')window.homeworkPrototype.applyPageDemo(id,c.role);else if(c.kind==='parent')window.parentPrototype.exception(id);else if(c.kind==='learning')window.learningPageDemo.select(id);else setTeacherBranch(id);sync();}finally{changingState=false;}}
  function restore(){const c=getContext();changingState=Boolean(window.demoWorkspace?.enabled);if(!changingState||c?.kind==='control')menuOpen=false;try{if(c?.kind==='control')window.controlPageDemo.restore();else if(c?.kind==='homework')window.homeworkPrototype.restorePageDemo(c.role);else if(c?.kind==='parent')window.parentPrototype.exception('normal');else if(c?.kind==='learning')window.learningPageDemo.restore();else if(c?.kind==='teacher')setTeacherBranch('normal');sync();if(c?.kind==='control')document.getElementById('dw-state-toggle')?.focus({preventScroll:true});}finally{changingState=false;}}
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&menuOpen)close();});
  window.addEventListener('resize',positionPicker);
  window.addEventListener('scroll',positionPicker,{passive:true});
  return {render,sync,open,close,select,restore,toggle(){if(menuOpen)close();else open();},getContext};
})();
