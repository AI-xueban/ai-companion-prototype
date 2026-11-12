/* New administrator rules remain drafts until the page Save action. */
(() => {
 const R=controlRules,M=schoolControlModel,key='teacher-control-prototype-v1',copy=R.copy;
 let draft=null,item=null,picker=null;
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const read=()=>M.init(JSON.parse(localStorage.getItem(key)||'null')||controlData);
 const allowed=()=>!!draft&&controlDemoRole==='admin'&&controlModule===draft.module;
 const button=(text,action,secondary=false)=>'<button type="button" class="control-'+(secondary?'secondary':'primary')+'" onclick="schoolRuleCreateUI.'+action+'">'+text+'</button>';
 const row=(name,value,action)=>'<button type="button" class="duration-setting-row" onclick="schoolRuleCreateUI.'+action+'"><b>'+name+'</b><span>'+esc(value)+'</span><i aria-hidden="true">›</i></button>';
 const unavailable=(d,g)=>!M.rows(d,[g]).length||d.schoolSettings.adminPolicies[draft.module].some(p=>p.id!==draft.original?.id&&p.grades.includes(g));
 const snapshot=()=>JSON.stringify(draft.value);
 function page(title,body,actions){
  const top=header(title,false).replace('<span></span><h2','<button class="wx-back" aria-label="返回上一页" onclick="schoolRuleCreateUI.back()">‹</button><h2');
  app.innerHTML='<main class="screen control-screen school-mobile duration-item-screen rule-form-screen'+(picker?' control-student-picker':'')+'">'+top+'<section class="control-content">'+body+'</section><footer class="borrow-editor-actions">'+actions+'</footer><div id="control-overlay"></div><div id="control-toast" role="status"></div></main>';syncReview();
 }
 function render(error=''){
  if(!allowed())return;
  if(picker)return renderGrades(error);
  const v=draft.value;
  let body=row('适用年级 *',v.grades.length?'已选 '+v.grades.length+' 个年级':'请选择年级','pickGrades()');
  if(draft.module==='duration')body+=v.groups.map((g,i)=>'<section class="duration-item-group"><div class="control-group-heading"><h3>时段组'+(i+1)+'</h3>'+(v.groups.length>1?(window.controlRuleFormUI?controlRuleFormUI.trash('schoolRuleCreateUI.removeGroup('+i+')'):button('删除','removeGroup('+i+')',true)):'')+'</div>'+row('选择星期',R.dayText(g.weekdays),"edit('weekdays',"+i+")")+[['continuousMinutes','连续使用时长'],['restMinutes','休息时长'],['dailyMinutes','每日累计总时长']].map(([k,name])=>row(name,g.value[k]+'分钟',"edit('"+k+"',"+i+")")).join('')+row('可用时段',g.value.periods.length?g.value.periods.map(p=>p.start+'–'+p.end).join('、'):'全天可用',"edit('periods',"+i+")")+'</section>').join('')+'<div class="control-add-group rule-add-group">'+button('＋ 添加时段组','addGroup()',true)+'</div>';
  else body+='<div class="duration-setting-row"><b>适用科目</b><span>全科</span></div>'+[['answer','查看答案'],['explanation','查看详解']].map(([k,name])=>(window.controlRuleFormUI?controlRuleFormUI.permissionSwitch(name,!!v[k],"schoolRuleCreateUI.togglePermission('"+k+"')"):row(name,v[k]?'允许':'不允许',"edit('"+k+"')"))).join('');
  page((draft.original?'编辑':'新增')+(draft.module==='duration'?'使用时长规则':'智阅作业规则'),'<section class="control-module-panel duration-settings-panel" id="school-create-form">'+body+'<p class="control-error" role="alert">'+esc(error)+'</p></section>',button('取消','cancel()',true)+button('保存','save()'));
 }
 function start(module,original=null){
  if(controlDemoRole!=='admin'||controlModule!==module||!['duration','homework'].includes(module))return;
  const d=read();if(module==='duration'&&d.schoolSettings.durationRulesEnabled===false)return controlToast('请先启用自定义规则');
  const policies=d.schoolSettings.adminPolicies[module];if(!original&&M.grades(d).every(g=>!M.rows(d,[g]).length||policies.some(p=>p.grades.includes(g))))return controlToast('全部年级已有规则，请编辑或删除后新增');
  draft={module,base:M.signature(d,module),value:{id:'school-'+crypto.randomUUID(),grades:[],...(module==='duration'?{groups:[{weekdays:[0,1,2,3,4,5,6],value:{continuousMinutes:60,restMinutes:15,dailyMinutes:180,periods:[]}}]}:{answer:false,explanation:false})}};
  draft.original=original?copy(original):null;if(original)draft.value=copy(original);draft.initial=snapshot();item=null;picker=null;render();
 }
 function gradeRows(){const d=read();return M.grades(d).filter(g=>g.includes(picker.query.trim())).map(g=>{const disabled=unavailable(d,g);return '<label class="daily-lock-row'+(disabled?' control-student-unavailable':'')+'"><span><b>'+esc(g)+'</b>'+(disabled?'<small>'+(M.rows(d,[g]).length?'已有规则，不可选择':'暂无可操作班级')+'</small>':'')+'</span><input type="checkbox" aria-label="选择'+esc(g)+'" value="'+esc(g)+'" '+(picker.ids.has(g)?'checked':'')+' '+(disabled?'disabled':'')+' onchange="schoolRuleCreateUI.selectGrade(this.value,this.checked)"></label>';}).join('')||'<p class="parity-note">没有匹配年级</p>';}
 function renderGrades(error=''){
  page('选择年级','<div class="daily-lock-picker"><div class="daily-lock-picker-count"><span>选择适用年级</span><b id="create-grade-count">'+picker.ids.size+'/'+M.grades(read()).length+' 个年级</b></div><input type="search" aria-label="搜索年级" placeholder="搜索年级" oninput="schoolRuleCreateUI.searchGrades(this.value)"><div id="create-grade-options">'+gradeRows()+'</div><p class="control-error" role="alert">'+esc(error)+'</p></div>',button('取消','cancelGrades()',true)+button('确定','confirmGrades()').replace('onclick=',(picker.ids.size?'':'disabled ')+'onclick='));
 }
 function pickGrades(){if(!allowed())return;picker={ids:new Set(draft.value.grades),query:''};renderGrades();}
 function cancelGrades(){picker=null;render();}
 function confirmGrades(){
  if(!allowed()||!picker||!picker.ids.size)return;
  const d=read(),invalid=[...picker.ids].filter(g=>!M.grades(d).includes(g)||unavailable(d,g));
  if(invalid.length){invalid.forEach(g=>picker.ids.delete(g));return renderGrades('年级规则已变化，请重新选择');}
  draft.value.grades=M.grades(d).filter(g=>picker.ids.has(g));picker=null;render();
 }
 function edit(kind,index=0){
  if(!allowed()||!['weekdays','continuousMinutes','restMinutes','dailyMinutes','periods','answer','explanation'].includes(kind))return;
  item={kind,index,value:copy(draft.value)};showItem();
 }
 function showItem(error=''){
  if(!allowed()||!item)return;
  const {kind,index,value}=item,names={weekdays:'选择星期',continuousMinutes:'连续使用时长',restMinutes:'休息时长',dailyMinutes:'每日累计总时长',periods:'可用时段',answer:'查看答案',explanation:'查看详解'};
  let body='';
  if(kind==='weekdays')body='<div class="school-weekdays">'+[0,1,2,3,4,5,6].map(day=>'<label><input type="checkbox" data-create-day value="'+day+'" '+(value.groups[index].weekdays.includes(day)?'checked':'')+' '+(value.groups.some((g,i)=>i!==index&&g.weekdays.includes(day))?'disabled':'')+'>'+R.dayText([day])+'</label>').join('')+'</div>';
  else if(['answer','explanation'].includes(kind))body='<div class="school-permission-options">'+[true,false].map(v=>'<label><input type="radio" name="create-permission" value="'+v+'" '+(value[kind]===v?'checked':'')+'><span>'+(v?'允许':'不允许')+'</span></label>').join('')+'</div>';
  else if(kind==='periods')body=value.groups[index].value.periods.map((p,i)=>'<div class="control-date-row"><button type="button" class="school-period-value" onclick="schoolRuleCreateUI.period('+i+')">'+esc(p.start)+'–'+esc(p.end)+' ›</button>'+button('删除','removePeriod('+i+')',true)+'</div>').join('')+button('＋ 添加时段','period()',true)+'<p class="parity-note">未设置则全天可用</p>';
  else body='<label class="duration-modal-number"><span class="duration-stepper"><button type="button" aria-label="减少时长" onclick="schoolRuleCreateUI.step(-1)">−</button><input id="school-create-number" aria-label="时长分钟数" type="number" inputmode="numeric" min="1" step="1" value="'+value.groups[index].value[kind]+'"><button type="button" aria-label="增加时长" onclick="schoolRuleCreateUI.step(1)">＋</button></span>分钟</label>';
  controlOverlay(names[kind],body+'<p class="control-error" role="alert">'+esc(error)+'</p>',button('取消','cancelItem()',true)+button('确认','confirmItem()'));
  const shade=document.querySelector?.('#control-overlay .control-shade');if(shade){shade.onclick=e=>{if(e.target===shade)cancelItem();};const close=shade.querySelector('.control-sheet-head button');if(close)close.onclick=cancelItem;}
 }
 function cancelItem(){item=null;closeControlOverlay(true);render();}
 function confirmItem(){
  if(!allowed()||!item)return;const {kind,index,value}=item;
  if(kind==='weekdays')value.groups[index].weekdays=[...document.getElementById('control-overlay').querySelectorAll('[data-create-day]:checked')].map(n=>Number(n.value));
  else if(['answer','explanation'].includes(kind)){const chosen=document.querySelector('input[name="create-permission"]:checked');if(!chosen)return showItem('请选择权限');value[kind]=chosen.value==='true';}
  else if(kind!=='periods')value.groups[index].value[kind]=Number(document.getElementById('school-create-number').value);
  const error=draft.module==='duration'?R.validateSettingGroups(value.groups,'duration'):'';if(error)return showItem(error);
  draft.value=copy(value);cancelItem();
 }
 function period(index){
  if(!allowed()||item?.kind!=='periods')return;const current=item,owner=draft,cancel=schoolControl.cancelTime;
  schoolControl.cancelTime=()=>{schoolControl.cancelTime=cancel;cancel.call(schoolControl);if(item===current&&draft===owner)showItem();};
  schoolControl.pickExternalTime(current.value.groups[current.index].value.periods,index,values=>{schoolControl.cancelTime=cancel;if(item!==current||draft!==owner)return;current.value.groups[current.index].value.periods=copy(values);showItem();});
 }
 function leave(){draft=null;item=null;picker=null;closeControlOverlay(true);schoolControl.module(controlModule);}
 function cancel(){if(!allowed())return;if(item)return cancelItem();if(picker)return cancelGrades();if(snapshot()===draft.initial)return leave();controlOverlay('放弃未保存的修改？','<p>放弃后，本次修改不会保存。</p>',button('继续设置','continueEdit()',true)+button('放弃','discard()'));const shade=document.querySelector?.('#control-overlay .control-shade');if(shade){shade.onclick=e=>{if(e.target===shade)schoolRuleCreateUI.continueEdit();};const close=shade.querySelector('.control-sheet-head button');if(close)close.onclick=()=>schoolRuleCreateUI.continueEdit();}}
 function save(){
  if(!allowed()||item||picker)return;
  try{
   const d=read(),v=copy(draft.value);if(v.grades.some(g=>unavailable(d,g)))throw Error('年级规则已变化，请重新选择');
   const next=M.apply(d,{module:draft.module,action:'save',...v,original:draft.original,base:draft.base,scope:'unmodified'}),module=draft.module;
   localStorage.setItem(key,JSON.stringify(next));controlData=next;const id=module==='duration'?next.schoolSettings.adminPolicies.duration.find(p=>p.grades.includes(v.grades[0])&&M.durationKey(p.groups)===M.durationKey(v.groups))?.id:null;
   draft=null;item=null;picker=null;schoolControl.module(module);if(!window.controlRuleFormUI&&module==='duration'&&id)schoolDurationUI.open(id);controlToast('已生效');
  }catch(error){render(error.message);if(error.message==='已是默认规则，无需保存')controlToast(error.message);}
 }
 window.schoolRuleCreateUI={start,render,togglePermission(key){if(!allowed()||draft.module!=='homework'||item||picker||!['answer','explanation'].includes(key))return;draft.value[key]=!draft.value[key];render();},busy:()=>!!draft,reset(){draft=null;item=null;picker=null;},pickGrades,cancelGrades,confirmGrades,edit,cancelItem,confirmItem,period,save,cancel,back:cancel,discard:leave,continueEdit(){closeControlOverlay(true);render();},searchGrades(query){if(!picker)return;picker.query=query;const host=document.getElementById('create-grade-options');if(host)host.innerHTML=gradeRows();},selectGrade(g,checked){if(!allowed()||!picker)return;const d=read();if(checked&&(!M.grades(d).includes(g)||unavailable(d,g)))return;checked?picker.ids.add(g):picker.ids.delete(g);const count=document.getElementById('create-grade-count');if(count)count.textContent=picker.ids.size+'/'+M.grades(d).length+' 个年级';const confirm=document.querySelector?.('.control-student-picker .control-primary');if(confirm)confirm.disabled=!picker.ids.size;},step(delta){const n=document.getElementById('school-create-number');if(!n)return;if(n.value===''||!Number.isFinite(n.valueAsNumber))n.value='1';else if(delta>0)n.stepUp();else if(Number(n.value)>1)n.stepDown();},removePeriod(i){if(!allowed()||item?.kind!=='periods')return;item.value.groups[item.index].value.periods.splice(i,1);showItem();},addGroup(){if(!allowed()||draft.module!=='duration')return;const weekdays=[0,1,2,3,4,5,6].filter(day=>!draft.value.groups.some(g=>g.weekdays.includes(day)));if(!weekdays.length)return controlToast('请先在已有时段组中取消需要分组的星期');draft.value.groups.push({weekdays,value:{continuousMinutes:60,restMinutes:15,dailyMinutes:180,periods:[]}});render();},removeGroup(i){if(!allowed()||draft.module!=='duration'||draft.value.groups.length<=1)return;draft.value.groups.splice(i,1);render();}};
 addEventListener('keydown',e=>{if(!e.defaultPrevented&&e.key==='Escape'&&allowed()){e.preventDefault();cancel();}});
})();
