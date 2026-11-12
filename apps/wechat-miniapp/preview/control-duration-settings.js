/* Administrator duration rules: item confirmation is the persistence boundary. */
(() => {
  const R=controlRules,M=schoolControlModel,key='teacher-control-prototype-v1';
  let selected=null,field=null;
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const copy=R.copy, read=()=>M.init(JSON.parse(localStorage.getItem(key)||'null')||controlData);
  const write=d=>{const next=M.init(d);localStorage.setItem(key,JSON.stringify(next));controlData=next;};
  const policies=d=>d.schoolSettings.adminPolicies.duration;
  const allowed=()=>controlDemoRole==='admin'&&controlModule==='duration';
  const button=(label,action,secondary=false)=>`<button type="button" class="control-${secondary?'secondary':'primary'}" onclick="schoolDurationUI.${action}">${label}</button>`;
  const toggle=(label,value,kind)=>`<button type="button" class="school-weekly-switch" role="switch" aria-label="${label}" aria-checked="${value}" onclick="schoolDurationUI.toggle('${kind}',${!value})"><span aria-hidden="true"></span></button>`;
  function page(title,body,footer=''){
    const top=header(title,false).replace('<span></span><h2','<button class="wx-back" aria-label="返回上一页" onclick="schoolDurationUI.back()">‹</button><h2');
    app.innerHTML=`<main class="screen control-screen school-mobile duration-item-screen">${top}<section class="control-content">${body}</section>${footer}<div id="control-overlay"></div><div id="control-toast" role="status"></div></main>`;syncReview();
  }
  function row(label,value,action,disabled=false){return `<button type="button" class="duration-setting-row" ${disabled?'disabled':''} onclick="schoolDurationUI.${action}"><b>${label}</b><span>${esc(value)}</span><i aria-hidden="true">›</i></button>`;}
  function render(){
    if(!allowed())return;
    const d=read(),list=policies(d),current=list.find(p=>p.id===selected);
    if(window.controlRuleFormUI){
      const F=controlRuleFormUI,enabled=d.schoolSettings.durationRulesEnabled!==false,defaultOn=d.schoolSettings.durationDefaultEnabled!==false;
      const defaults=M.grades(d).filter(g=>!enabled||new Set(list.filter(p=>p.grades.includes(g)).flatMap(p=>p.groups.flatMap(g=>g.weekdays))).size<7);
      const body='<section class="control-module-panel school-default-panel">'+ '<div class="school-panel-heading"><h3>默认规则</h3>'+toggle('默认规则',defaultOn,'default')+'</div><p class="school-default-values">全周 · 连续60分钟 · 休息15分钟 · 每日180分钟 · 全天可用</p><p class="school-default-scope">'+(defaultOn?'适用年级：'+esc(defaults.join('、')||'暂无'):'已关闭，未配置星期不执行学校默认时长限制')+'</p></section><div class="school-panel-heading duration-list-heading"><h3>自定义规则</h3>'+toggle('全部自定义规则',enabled,'custom')+'</div>'+list.map((p,i)=>'<section class="control-module-panel rule-form-card"><h3>规则'+(i+1)+'</h3>'+F.row('适用年级',p.grades.join('、'))+F.groups(p.groups)+F.actions("schoolDurationUI.editRule('"+esc(p.id)+"')","schoolDurationUI.deleteRule('"+esc(p.id)+"')",!enabled)+'</section>').join('')+(!list.length?'<p class="control-empty">暂无自定义规则</p>':'');
      page('使用时长管控',body,enabled?'<footer class="control-fixed-select rule-form-footer">'+button('新增规则','create()')+'</footer>':'');document.querySelector?.('main.school-mobile')?.classList?.add('rule-form-screen');return;
    }
    if(selected&&!current)selected=null;
    if(current){
      const enabled=d.schoolSettings.durationRulesEnabled!==false;
      const rows=current.groups.map((g,i)=>`<section class="duration-item-group"><div class="control-group-heading"><h3>时段组${i+1}</h3>${current.groups.length>1?button('删除',`editField('removeGroup',${i})`,true):''}</div>${row('选择星期',R.dayText(g.weekdays),`editField('weekdays',${i})`,!enabled)}${[['continuousMinutes','连续使用时长'],['restMinutes','休息时长'],['dailyMinutes','每日累计总时长']].map(([k,title])=>row(title,g.value[k]+'分钟',`editField('${k}',${i})`,!enabled)).join('')}${row('可用时段',g.value.periods.length?g.value.periods.map(p=>p.start+'–'+p.end).join('、'):'全天可用',`editField('periods',${i})`,!enabled)}</section>`).join('');
      page('规则'+(list.indexOf(current)+1),`<section class="control-module-panel duration-settings-panel">${row('适用年级',current.grades.join('、'),"editField('grades')",!enabled)}${rows}${enabled?'<div class="control-add-group rule-add-group">'+button('＋ 添加时段组',"editField('addGroup')",true)+'</div>':''}</section>${!enabled?'<p class="parity-note">自定义规则已关闭，配置保留。</p>':''}`,enabled?'<footer class="control-fixed-select rule-detail-footer">'+button('删除规则',"editField('delete')",true)+'</footer>':'');return;
    }
    const enabled=d.schoolSettings.durationRulesEnabled!==false,defaultOn=d.schoolSettings.durationDefaultEnabled!==false;
    const defaults=M.grades(d).filter(g=>!enabled||new Set(list.filter(p=>p.grades.includes(g)).flatMap(p=>p.groups.flatMap(group=>group.weekdays))).size<7);
    page('使用时长管控',`<section class="control-module-panel school-default-panel"><div class="school-panel-heading"><h3>默认规则</h3>${toggle('默认规则',defaultOn,'default')}</div><p class="school-default-values">全周 · 连续60分钟 · 休息15分钟 · 每日180分钟 · 全天可用</p><p class="school-default-scope">${defaultOn?'适用年级：'+esc(defaults.join('、')||'暂无'):'已关闭，未配置星期不执行学校默认时长限制'}</p></section><div class="school-panel-heading duration-list-heading"><h3>自定义规则</h3>${toggle('全部自定义规则',enabled,'custom')}</div><section class="control-module-panel duration-rule-lines">${list.map((p,i)=>row('规则'+(i+1),p.grades.join('、'),`open('${esc(p.id)}')`)).join('')||'<p class="parity-note">暂无自定义规则</p>'}</section>${enabled?'<div class="control-add-group">'+button('＋ 新增规则','create()',true)+'</div>':''}`);
  }
  function openField(kind,index){
    if(!allowed())return;
    const d=read(),original=policies(d).find(p=>p.id===selected);
    if(d.schoolSettings.durationRulesEnabled===false)return controlToast('请先启用自定义规则');
    if(!original)return;
    const value=copy(original);
    if(kind==='addGroup'){
      const weekdays=[0,1,2,3,4,5,6].filter(day=>!value.groups.some(g=>g.weekdays.includes(day)));
      if(!weekdays.length)return controlToast('请先在已有时段组中取消需要分组的星期');
      index=value.groups.length;value.groups.push({weekdays,value:{continuousMinutes:60,restMinutes:15,dailyMinutes:180,periods:[]}});
    }
    field={kind,index:index??0,value,original:original?copy(original):null,base:M.signature(d,'duration')};showField();
  }
  function showField(){
    const f=field;if(!f)return;
    const names={grades:'适用年级',weekdays:'选择星期',addGroup:'添加时段组',continuousMinutes:'连续使用时长',restMinutes:'休息时长',dailyMinutes:'每日累计总时长',periods:'可用时段',removeGroup:'删除时段组？',delete:'删除规则？'};
    let body='';
    if(f.kind==='grades'){
      const d=read();body='<div class="duration-choice-grid">'+M.grades(d).map(g=>{
        const disabled=!M.rows(d,[g]).length||policies(d).some(p=>p.id!==f.original?.id&&p.grades.includes(g));
        return `<label><input type="checkbox" data-item-grade value="${esc(g)}" ${f.value.grades.includes(g)?'checked':''} ${disabled?'disabled':''}>${esc(g)}</label>`;
      }).join('')+'</div>';
    }
    if(['weekdays','addGroup'].includes(f.kind))body+='<div class="school-weekdays">'+[0,1,2,3,4,5,6].map(day=>`<label><input type="checkbox" data-item-day value="${day}" ${f.value.groups[f.index].weekdays.includes(day)?'checked':''} ${f.value.groups.some((g,i)=>i!==f.index&&g.weekdays.includes(day))?'disabled':''}>${R.dayText([day])}</label>`).join('')+'</div>';
    if(['continuousMinutes','restMinutes','dailyMinutes'].includes(f.kind)){
      const k=f.kind;
      body+=`<label class="duration-modal-number"><span class="duration-stepper"><button type="button" aria-label="减少时长" onclick="schoolDurationUI.stepNumber(-1)">−</button><input id="duration-item-number" aria-label="时长分钟数" type="number" inputmode="numeric" min="1" step="1" value="${f.value.groups[f.index].value[k]}"><button type="button" aria-label="增加时长" onclick="schoolDurationUI.stepNumber(1)">＋</button></span>分钟</label>`;
    }
    if(f.kind==='periods')body='<div class="duration-item-periods">'+f.value.groups[f.index].value.periods.map((p,i)=>`<div class="control-date-row"><button type="button" class="school-period-value" onclick="schoolDurationUI.period(${i})">${esc(p.start)}–${esc(p.end)} ›</button>${button('删除',`removePeriod(${i})`,true)}</div>`).join('')+button('＋ 添加时段','period()',true)+'</div><p class="parity-note">未设置则全天可用</p>';
    if(f.kind==='delete')body='<p>删除后执行当前默认规则；老师已有设置保留。</p>';
    if(f.kind==='removeGroup')body='<p>删除后，这些星期执行当前默认规则。</p>';
    controlOverlay(names[f.kind],body+'<p id="duration-item-error" class="control-error" role="alert"></p>',button('取消','cancelField()',true)+button('确认','confirmField()'));
    const shade=document.querySelector?.('#control-overlay .control-shade');
    if(shade){shade.onclick=e=>{if(e.target===shade)schoolDurationUI.cancelField();};const close=shade.querySelector('.control-sheet-head button');if(close)close.onclick=()=>schoolDurationUI.cancelField();}
  }
  function confirm(){
    if(!field||!allowed())return;
    const f=field,d=read(),host=document.getElementById('control-overlay');
    try{
      if(f.kind==='grades')f.value.grades=[...host.querySelectorAll('[data-item-grade]:checked')].map(n=>n.value);
      if(['weekdays','addGroup'].includes(f.kind))f.value.groups[f.index].weekdays=[...host.querySelectorAll('[data-item-day]:checked')].map(n=>Number(n.value));
      if(['continuousMinutes','restMinutes','dailyMinutes'].includes(f.kind))f.value.groups[f.index].value[f.kind]=Number(document.getElementById('duration-item-number').value);
      const submitted=copy(f.value);
      if(f.kind==='removeGroup'){if(submitted.groups.length<=1)throw Error('至少保留一组规则');submitted.groups.splice(f.index,1);}
      const op={module:'duration',action:f.kind==='delete'?'delete':'save',id:submitted.id,grades:submitted.grades,groups:submitted.groups,original:f.original,base:f.base,scope:'unmodified'};
      let next=M.apply(d,op);
      const order=policies(d).map(p=>p.id);policies(next).sort((a,b)=>(order.includes(a.id)?order.indexOf(a.id):order.length)-(order.includes(b.id)?order.indexOf(b.id):order.length));
      write(next);
      selected=f.kind==='delete'?null:policies(next).find(p=>p.grades.includes(submitted.grades[0])&&M.durationKey(p.groups)===M.durationKey(submitted.groups))?.id||null;
      field=null;closeControlOverlay(true);render();controlToast(f.kind==='delete'?'规则已删除':'已生效');
    }catch(error){controlToast(error.message);}
  }
  window.schoolDurationUI={render,editRule(id){const d=read(),original=policies(d).find(p=>p.id===id);if(!allowed()||!original)return;schoolRuleCreateUI.start('duration',original);},deleteRule(id){selected=id;openField('delete');},stepNumber(delta){const input=document.getElementById('duration-item-number');if(!input)return;if(input.value===''||!Number.isFinite(input.valueAsNumber))input.value='1';else if(delta>0)input.stepUp();else if(Number(input.value)>1)input.stepDown();},reset(){selected=null;field=null;},busy:()=>!!field,open(id){if(!allowed())return;selected=id;render();},back(){if(selected){selected=null;render();}else schoolControl.back();},editField:openField,confirmField:confirm,cancelField(){field=null;closeControlOverlay(true);},create(){schoolRuleCreateUI.start('duration');},period(index){if(!field)return;const cancel=schoolControl.cancelTime;schoolControl.cancelTime=()=>{schoolControl.cancelTime=cancel;cancel.call(schoolControl);if(field)showField();};schoolControl.pickExternalTime(field.value.groups[field.index].value.periods,index,values=>{schoolControl.cancelTime=cancel;if(!field)return;field.value.groups[field.index].value.periods=values;showField();});},removePeriod(index){if(!field)return;field.value.groups[field.index].value.periods.splice(index,1);showField();},toggle(kind,value){if(!allowed()||field)return;const d=read();d.schoolSettings[kind==='default'?'durationDefaultEnabled':'durationRulesEnabled']=!!value;write(M.init(d));render();controlToast(value?'已启用':'已关闭');}};
  addEventListener('keydown',e=>{if(!e.defaultPrevented&&e.key==='Escape'&&field){e.preventDefault();schoolDurationUI.cancelField();}});
  if(typeof stage!=='undefined'&&stage==='teacherDesk'&&teacherTab==='control'&&allowed()&&!['entry','home'].includes(controlView))render();
})();
