/* Local, reversible page previews. These never write learning or permission data. */
window.learningPageDemo = (() => {
  let preview=null;
  const choices=[['loading','加载中','展示当前页面的加载占位。','加载与失败'],['load-failed','加载失败','失败后可以重试，恢复原页面。','加载与失败'],['empty','当前范围无记录','仅预览空页面，不删除学习记录。','数据状态'],['delayed','数据同步延迟','展示来源暂缺，不将未知指标当作 0。','数据状态'],['denied','当前范围无权限','隐藏本页数据，仅模拟权限提示，不修改实际绑定。','权限变化']].map(([id,label,hint,group])=>({id,label,hint,group}));
  function current(){
    if(!window.demoWorkspace?.enabled||typeof stage==='undefined')return null;
    const p=stage==='parent'?window.parentPrototype?.getDemoContext():null;
    const parent=p?.view==='home'&&p?.tab==='learning';
    const teacher=stage==='teacherDesk'&&typeof teacherTab!=='undefined'&&teacherTab==='learning';
    if(!parent&&!teacher)return null;
    const target=document.querySelector('#app .lp-page');if(!target)return null;
    const scope=parent?{child:p.childIndex,...window.learningPrototype.getDemoContext()}:window.workbenchPrototype.getScope();
    return {target,key:'learning:'+(parent?'parent':'teacher')+':'+JSON.stringify(scope),title:document.querySelector('#app .wx-title')?.textContent||'学情'};
  }
  function context(){const c=current();if(preview&&(!c||c.key!==preview.key||c.target!==preview.target)){restore();}if(!c)return null;return {key:c.key,title:c.title,choices,active:preview?.id||'',label:choices.find(x=>x.id===preview?.id)?.label||''};}
  function select(id){const c=current();if(!c||!choices.some(x=>x.id===id))return;if(preview)restore();preview={...c,id,nodes:[...c.target.childNodes]};
    const content={loading:'<h3>正在加载学习数据</h3><div class="dw-skeleton"></div><div class="dw-skeleton"></div>', 'load-failed':'<h3>学习数据加载失败</h3><p>请检查网络后重试。</p><button onclick="learningPageDemo.restore();pageDemoTools.sync()">重试</button>',empty:'<h3>当前范围暂无学习记录</h3><p>本期未记录到学习活动，不代表没有学习。可恢复后切换时间或查看其他范围。</p>',delayed:'<h3>部分学习数据同步延迟</h3><p>本次同步结果暂缺，请稍后刷新。未知指标不计为 0。</p><p>学习活动：暂缺　首次作答：暂缺</p><button onclick="learningPageDemo.restore();pageDemoTools.sync()">刷新</button>',denied:'<h3>当前范围暂无查看权限</h3><p>无法查看本页的学习数据，请返回有效入口。</p>'}[id];
    c.target.innerHTML='<section class="dw-demo-result">'+content+'</section>';
  }
  function restore(){if(!preview)return;const old=preview;preview=null;old.target.replaceChildren(...old.nodes);}
  return {context,select,restore};
})();
