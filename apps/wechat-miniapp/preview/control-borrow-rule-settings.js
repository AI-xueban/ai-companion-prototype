/* School borrowing rules use the same list/item interaction as duration settings. */
(() => {
 const R=controlRules,M=schoolControlModel,key='teacher-control-prototype-v1',copy=R.copy;
 let mode='dates',selected=null,field=null,gradePicker=null,createSetting=null;
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const allowed=()=>controlDemoRole==='admin'&&controlModule==='borrowing'&&controlView==='borrowRules';
 const read=()=>{const r=M.clean(JSON.parse(localStorage.getItem(key)||'null')||controlData);if(r.changed){localStorage.setItem(key,JSON.stringify(r.data));controlData=r.data;}return r.data;};
 const write=d=>{localStorage.setItem(key,JSON.stringify(d));controlData=d;};
 const button=(label,action,secondary=false)=>`<button type="button" class="control-${secondary?'secondary':'primary'}" onclick="schoolBorrowRulesUI.${action}">${label}</button>`;
 const enabled=d=>d.schoolSettings.borrowing[mode==='weekly'?'weeklyRestrictionEnabled':'dateRestrictionEnabled']??Object.values(d.schoolSettings.borrowing.classRules).some(rules=>rules.some(r=>r.mode===mode));
 function groups(d){
  const list=[];
  for(const grade of M.grades(d)){
   const names=M.names(d,[grade]);
   for(const rule of d.schoolSettings.borrowing.classRules[names[0]]||[]){
    if(rule.mode!==mode)continue;
    const sig=M.borrowKey(rule);let group=list.find(p=>p.sig===sig);
    if(!group){group={sig,grades:[],ids:{},rule:copy(rule)};list.push(group);}
    group.grades.push(grade);names.forEach(name=>{const match=(d.schoolSettings.borrowing.classRules[name]||[]).find(r=>M.borrowKey(r)===sig);if(match)group.ids[name]=match.id;});
   }
  }return list;
 }
 function page(title,body,footer=''){
  const top=header(title,false).replace('<span></span><h2','<button class="wx-back" aria-label="返回上一页" onclick="schoolBorrowRulesUI.back()">‹</button><h2');
  app.innerHTML=`<main class="screen control-screen school-mobile duration-item-screen rule-form-screen">${top}<section class="control-content">${body}</section>${footer}<div id="control-overlay"></div><div id="control-toast" role="status"></div></main>`;syncReview();
 }
 const row=(label,value,action,disabled=false)=>`<button type="button" class="duration-setting-row" ${disabled?'disabled':''} onclick="schoolBorrowRulesUI.${action}"><b>${label}</b><span>${esc(value)}</span><i aria-hidden="true">›</i></button>`;
 function render(){
  if(!allowed())return;
  const d=read(),list=groups(d),current=list.find(p=>p.sig===selected),on=enabled(d);
  if(window.controlRuleFormUI){
   const F=controlRuleFormUI,title=mode==='dates'?'日期规则':'每周规则';
   const body='<div class="school-panel-heading duration-list-heading"><h3>'+title+'</h3><button type="button" class="school-weekly-switch" role="switch" aria-label="'+title+'" aria-checked="'+on+'" onclick="schoolBorrowRulesUI.toggle('+!on+')"><span aria-hidden="true"></span></button></div>'+list.map((p,i)=>'<section class="control-module-panel rule-form-card"><h3>'+title+(i+1)+'</h3>'+F.row('适用年级',p.grades.join('、'))+(mode==='dates'?F.row('开始日期',p.rule.startDate.replaceAll('-','/'))+F.row('结束日期',p.rule.endDate.replaceAll('-','/'))+F.row('借用状态','全天停止借用'):F.groups(R.settingGroups(p.rule,'borrowing'),false))+F.actions('schoolBorrowRulesUI.editRule('+i+')','schoolBorrowRulesUI.deleteRule('+i+')',!on)+'</section>').join('')+(!list.length?'<p class="control-empty">暂无'+title+'</p>':'');
   page(title,body,on?'<footer class="control-fixed-select rule-form-footer">'+button(mode==='dates'?'新增日期规则':'新增每周规则','create()')+'</footer>':'');document.querySelector?.('main.school-mobile')?.classList?.add('rule-form-screen');return;
  }
  if(selected&&!current)selected=null;
  if(current){
   const title=(mode==='dates'?'日期':'每周')+'规则'+(list.indexOf(current)+1);
   const settings=mode==='dates'?row('开始日期',current.rule.startDate.replaceAll('-','/'),"editField('startDate')",!on)+row('结束日期',current.rule.endDate.replaceAll('-','/'),"editField('endDate')",!on)+'<div class="duration-setting-row"><b>借用状态</b><span>全天停止借用</span></div>':R.settingGroups(current.rule,'borrowing').map((g,i)=>`<section class="duration-item-group"><div class="control-group-heading"><h3>时段组${i+1}</h3>${on&&R.settingGroups(current.rule,'borrowing').length>1?button('删除',`editField('removeGroup',${i})`,true):''}</div>${row('选择星期',R.dayText(g.weekdays),`editField('weekdays',${i})`,!on)}${row('借用时段',g.value.periods.length?g.value.periods.map(p=>p.start+'–'+p.end).join('、'):'全天可借',`editField('periods',${i})`,!on)}</section>`).join('');
   page(title,`<section class="control-module-panel duration-settings-panel">${row('适用年级',current.grades.join('、'),"editField('grades')",!on)}${settings}${on&&mode==='weekly'?'<div class="control-add-group rule-add-group">'+button('＋ 添加时段组',"editField('addGroup')",true)+'</div>':''}</section>${!on?'<p class="parity-note">该类规则已关闭，配置保留。</p>':''}`,on?'<footer class="control-fixed-select rule-detail-footer">'+button('删除规则',"editField('delete')",true)+'</footer>':'');return;
  }
  const title=mode==='dates'?'日期规则':'每周固定规则';
  page(mode==='dates'?'日期规则':'每周规则',`<div class="school-panel-heading duration-list-heading"><h3>${title}</h3><button type="button" class="school-weekly-switch" role="switch" aria-label="${title}" aria-checked="${on}" onclick="schoolBorrowRulesUI.toggle(${!on})"><span aria-hidden="true"></span></button></div><section class="control-module-panel duration-rule-lines">${list.map((p,i)=>row('规则'+(i+1),p.grades.join('、'),`open(${i})`)).join('')||'<p class="parity-note">暂无'+title+'</p>'}</section>${on?'<div class="control-add-group">'+button(mode==='dates'?'＋ 新增日期规则':'＋ 新增每周规则','create()',true)+'</div>':''}`);
 }
 function gradeDisabled(d,g,f){
  if(!M.rows(d,[g]).length)return true;
  return M.names(d,[g]).some(name=>(d.schoolSettings.borrowing.classRules[name]||[]).some(r=>r.id!==f.original?.ids?.[name]&&(mode==='weekly'?r.mode==='weekly':r.mode==='dates'&&f.value.rule.startDate&&f.value.rule.endDate&&R.overlap(r,f.value.rule))));
 }
 function openField(kind,index=0){
  if(!allowed())return;
  const d=read(),original=groups(d).find(p=>p.sig===selected);
  if(!enabled(d))return controlToast('请先启用该类规则');
  if(kind!=='create'&&!original)return;
  const value=original?copy(original):{grades:[],rule:{id:'school-'+crypto.randomUUID(),mode,deny:mode==='dates',startDate:'',endDate:'',weekdays:[],periods:[]}};
  const settingGroups=mode==='weekly'?(original?R.settingGroups(value.rule,'borrowing'):[{weekdays:[],value:{periods:[]}}]):null;
  if(kind==='addGroup'){
   const weekdays=[0,1,2,3,4,5,6].filter(day=>!settingGroups.some(g=>g.weekdays.includes(day)));
   if(!weekdays.length)return controlToast('请先在已有时段组中取消需要分组的星期');
   index=settingGroups.length;settingGroups.push({weekdays,value:{periods:[]}});
  }
  field={kind,index,value,settingGroups,original:original?copy(original):null,base:M.signature(d,'borrowing')};
  field.initial=JSON.stringify([value.grades,value.rule,settingGroups]);
  if(['startDate','endDate'].includes(kind))return pickDate(kind,true);
  showField();
 }
 function showField(error=''){
  if(error)return controlToast(error);
  const f=field;if(!f)return;
  if(f.kind==='create')return renderCreate(error);
  if(f.kind==='grades')return pickGrades(error);
  const title={create:mode==='weekly'?'新增每周规则':'新增日期规则',grades:'适用年级',weekdays:'选择星期',addGroup:'添加时段组',periods:'借用时段',delete:'删除规则？',removeGroup:'删除时段组？',startDate:'开始日期',endDate:'结束日期'}[f.kind];
  let body='';
  if(mode==='weekly'&&['weekdays','addGroup','create'].includes(f.kind))body+='<div class="school-weekdays">'+[0,1,2,3,4,5,6].map(day=>`<label><input type="checkbox" data-borrow-item-day value="${day}" ${f.settingGroups[f.index].weekdays.includes(day)?'checked':''} ${f.settingGroups.some((g,i)=>i!==f.index&&g.weekdays.includes(day))?'disabled':''}>${R.dayText([day])}</label>`).join('')+'</div>';
  if(mode==='dates'&&['create','startDate','endDate'].includes(f.kind))body+=['startDate','endDate'].map(k=>row(k==='startDate'?'开始日期':'结束日期',f.value.rule[k]?f.value.rule[k].replaceAll('-','/'):'请选择日期',`pickDate('${k}')`)).join('')+'<p class="parity-note">指定日期全天停止借用</p>';
  if(f.kind==='periods')body+=f.settingGroups[f.index].value.periods.map((p,i)=>`<div class="control-date-row"><button type="button" class="school-period-value" onclick="schoolBorrowRulesUI.period(${i})">${esc(p.start)}–${esc(p.end)} ›</button>${button('删除',`removePeriod(${i})`,true)}</div>`).join('')+button('＋ 添加时段','period()',true)+'<p class="parity-note">未设置则全天可借</p>';
  if(f.kind==='delete')body='<p>删除后按其他有效规则执行，学校临时停止借用和班主任设置保留。</p>';
  if(f.kind==='removeGroup')body='<p>删除后，该组星期不再包含在此每周借用安排内。</p>';
  controlOverlay(title,body+'<p id="borrow-item-error" class="control-error" role="alert">'+esc(error)+'</p>',button('取消','cancelField()',true)+button('确认','confirmField()'));
  const shade=document.querySelector?.('#control-overlay .control-shade');if(shade){shade.onclick=e=>{if(e.target===shade)schoolBorrowRulesUI.cancelField();};const close=shade.querySelector('.control-sheet-head button');if(close)close.onclick=()=>schoolBorrowRulesUI.cancelField();}
 }
 function gradeRows(){
  if(!field||!gradePicker)return '';const d=read();
  return M.grades(d).map(g=>{const disabled=gradeDisabled(d,g,field);return '<label class="daily-lock-row'+(disabled?' control-student-unavailable':'')+'"><span><b>'+esc(g)+'</b>'+(disabled?'<small>'+(M.rows(d,[g]).length?'已有规则，不可选择':'暂无可操作班级')+'</small>':'')+'</span><input type="checkbox" aria-label="选择'+esc(g)+'" value="'+esc(g)+'" '+(gradePicker.ids.has(g)?'checked':'')+' '+(disabled?'disabled':'')+' onchange="schoolBorrowRulesUI.selectGrade(this.value,this.checked)"></label>';}).join('')||'<p class="parity-note">没有匹配年级</p>';
 }
 function renderGrades(error=''){
  if(!gradePicker)return;
  controlOverlay('选择年级','<div class="control-grade-picker"><div class="daily-lock-picker-count"><span>选择适用年级</span><b id="borrow-grade-count">'+gradePicker.ids.size+'/'+M.grades(read()).length+' 个年级</b></div><div id="borrow-grade-options" class="control-grade-options">'+gradeRows()+'</div></div>','<button type="button" class="control-select-all" onclick="schoolBorrowRulesUI.toggleAllGrades()">'+(M.grades(read()).filter(g=>!gradeDisabled(read(),g,field)).every(g=>gradePicker.ids.has(g))?'取消全选':'全选')+'</button>'+button('取消','cancelGrades()',true)+button('确定','confirmGrades()').replace('onclick=',(gradePicker.ids.size?'':'disabled ')+'onclick='));
  const shade=document.querySelector?.('#control-overlay .control-shade');if(shade){shade.onclick=e=>{if(e.target===shade)schoolBorrowRulesUI.cancelGrades();};const close=shade.querySelector('.control-sheet-head button');if(close)close.onclick=()=>schoolBorrowRulesUI.cancelGrades();}
  if(error)controlToast(error);
 }
 function pickGrades(error=''){
  if(!allowed()||!field)return;if(!gradePicker)gradePicker={ids:new Set(field.value.grades)};renderGrades(typeof error==='string'?error:'');
 }
 function cancelGrades(){
  const creation=field?.kind==='create';gradePicker=null;closeControlOverlay(true);if(creation)showField();else{field=null;render();}
 }
 function confirmGrades(){
  if(!allowed()||!field||!gradePicker||!gradePicker.ids.size)return;
  const d=read(),invalid=[...gradePicker.ids].filter(g=>!M.grades(d).includes(g)||gradeDisabled(d,g,field));if(invalid.length){invalid.forEach(g=>gradePicker.ids.delete(g));return renderGrades('年级规则已变化，请重新选择');}
  field.value.grades=M.grades(d).filter(g=>gradePicker.ids.has(g));gradePicker=null;closeControlOverlay(true);if(field.kind==='create')showField();else confirm();
 }
 function cancelCreate(){
  if(!field)return;
  if(field.initial===JSON.stringify([field.value.grades,field.value.rule,field.settingGroups])){field=null;render();return;}
  controlOverlay('放弃未保存的修改？','<p>放弃后，本次修改不会保存。</p>',button('继续设置','continueCreate()',true)+button('放弃','discardCreate()'));
 }
 function renderCreate(error=''){
  if(error)return controlToast(error);
  const f=field,d=read();f.value.grades=f.value.grades.filter(g=>!gradeDisabled(d,g,f));
  const grades=row('适用年级 *',f.value.grades.length?'已选 '+f.value.grades.length+' 个年级':'请选择年级','pickGrades()');
  let body=grades;
  if(mode==='dates')body+=['startDate','endDate'].map(k=>row(k==='startDate'?'开始日期':'结束日期',f.value.rule[k]?f.value.rule[k].replaceAll('-','/'):'请选择日期',"pickDate('"+k+"')")).join('')+'<div class="duration-setting-row"><b>借用状态</b><span>全天停止借用</span></div>';
  else body+=f.settingGroups.map((g,i)=>'<section class="duration-item-group"><div class="control-group-heading"><h3>时段组'+(i+1)+'</h3>'+(f.settingGroups.length>1?(window.controlRuleFormUI?controlRuleFormUI.trash('schoolBorrowRulesUI.removeCreateGroup('+i+')'):button('删除','removeCreateGroup('+i+')',true)):'')+'</div>'+row('选择星期',g.weekdays.length?R.dayText(g.weekdays):'请选择',"editCreateSetting('weekdays',"+i+")")+row('借用时段',g.value.periods.length?g.value.periods.map(p=>p.start+'–'+p.end).join('、'):'全天可借',"editCreateSetting('periods',"+i+")")+'</section>').join('')+'<div class="control-add-group rule-add-group">'+button('＋ 添加时段组','addCreateGroup()',true)+'</div>';
  page((f.original?'编辑':'新增')+(mode==='dates'?'日期规则':'每周规则'),'<section class="control-module-panel duration-settings-panel" id="borrow-create-form">'+body+'<p id="borrow-item-error" class="control-error" role="alert">'+esc(error)+'</p></section>','<footer class="borrow-editor-actions">'+button('取消','cancelCreate()',true)+button('保存','confirmField()')+'</footer>');
 }
 function editCreateSetting(kind,index){
  if(!allowed()||field?.kind!=='create'||!['weekdays','periods'].includes(kind)||!field.settingGroups[index])return;
  createSetting={kind,index,group:copy(field.settingGroups[index])};showCreateSetting();
 }
 function showCreateSetting(error=''){
  if(error)return controlToast(error);
  const f=field,s=createSetting;if(f?.kind!=='create'||!s)return;
  let body='';
  if(s.kind==='weekdays')body='<div class="school-weekdays">'+[0,1,2,3,4,5,6].map(day=>'<label><input type="checkbox" data-create-setting-day value="'+day+'" '+(s.group.weekdays.includes(day)?'checked':'')+' '+(f.settingGroups.some((g,i)=>i!==s.index&&g.weekdays.includes(day))?'disabled':'')+'>'+R.dayText([day])+'</label>').join('')+'</div>';
  else body=s.group.value.periods.map((p,i)=>'<div class="control-date-row"><button type="button" class="school-period-value" onclick="schoolBorrowRulesUI.createPeriod('+s.index+','+i+')">'+esc(p.start)+'–'+esc(p.end)+' ›</button>'+button('删除','removeCreatePeriod('+s.index+','+i+')',true)+'</div>').join('')+button('＋ 添加时段','createPeriod('+s.index+')',true)+'<p class="parity-note">未设置则全天可借</p>';
  controlOverlay(s.kind==='weekdays'?'选择星期':'借用时段',body+'<p class="control-error" role="alert">'+esc(error)+'</p>',button('取消','cancelCreateSetting()',true)+button('确认','confirmCreateSetting()'));
  const shade=document.querySelector?.('#control-overlay .control-shade');if(shade){shade.onclick=e=>{if(e.target===shade)cancelCreateSetting();};const close=shade.querySelector('.control-sheet-head button');if(close)close.onclick=cancelCreateSetting;}
 }
 function cancelCreateSetting(){createSetting=null;closeControlOverlay(true);if(field?.kind==='create')renderCreate();}
 function confirmCreateSetting(){
  if(!allowed()||field?.kind!=='create'||!createSetting)return;
  const s=createSetting;if(s.kind==='weekdays')s.group.weekdays=[...document.getElementById('control-overlay').querySelectorAll('[data-create-setting-day]:checked')].map(n=>Number(n.value));
  const groups=copy(field.settingGroups);groups[s.index]=copy(s.group);let error=R.validatePeriods(s.group.value.periods,true);
  if(s.kind==='weekdays'){if(!s.group.weekdays.length)error='请选择星期';else if(s.group.weekdays.some(day=>![0,1,2,3,4,5,6].includes(day)||groups.some((g,i)=>i!==s.index&&g.weekdays.includes(day))))error='同一星期不能归属多个组';}
  if(error)return showCreateSetting(error);
  field.settingGroups=groups;cancelCreateSetting();
 }
 function createPeriod(group,index){
  if(field?.kind!=='create'||createSetting?.kind!=='periods'||createSetting.index!==group)return;const f=field,s=createSetting,cancel=schoolControl.cancelTime;
  schoolControl.cancelTime=()=>{schoolControl.cancelTime=cancel;cancel.call(schoolControl);if(field===f&&createSetting===s)showCreateSetting();};
  schoolControl.pickExternalTime(s.group.value.periods,index,periods=>{schoolControl.cancelTime=cancel;if(field!==f||createSetting!==s)return;s.group.value.periods=copy(periods);showCreateSetting();});
 }
 function pickDate(part,immediate=false){
  if(!field)return;const f=field;
  const candidate=value=>{const r=copy(f.value.rule);r[part]=value;if(part==='startDate'&&r.endDate&&r.endDate<value)r.endDate=value;return r;};
  const validate=value=>{const r=candidate(value);if(!r.startDate||!r.endDate){if(part==='startDate'&&!f.original&&value<R.today())return '生效日期只能选择今天及以后';if(part==='endDate'&&value<R.today())return '结束日期不能早于今天';return '';}return R.validateBorrow(r,new Date(),f.original?.rule,{allowDateRangeEdit:!!f.original});};
  schoolControl.pickExternalDate(f.value.rule[part]||f.value.rule.startDate||R.today(),value=>{if(field!==f)return;f.value.rule=candidate(value);if(immediate)confirm();else showField();},()=>{if(immediate){field=null;render();}else showField();},validate);
 }
 function confirm(){
  if(!field||!allowed()||createSetting)return;
  const f=field;
  try{
   if(mode==='weekly'&&['weekdays','addGroup'].includes(f.kind))f.settingGroups[f.index].weekdays=[...document.getElementById('control-overlay').querySelectorAll('[data-borrow-item-day]:checked')].map(n=>Number(n.value));
   const submitted=copy(f.value),settings=copy(f.settingGroups);
   if(f.kind==='removeGroup'){if(settings.length<=1)throw Error('至少保留一组规则');settings.splice(f.index,1);}
   if(mode==='weekly')submitted.rule=R.expandSettingGroups(submitted.rule,settings,'borrowing');
   if(mode==='dates'){submitted.rule.deny=true;submitted.rule.periods=[];if(f.kind!=='delete'){const error=R.validateBorrow(submitted.rule,new Date(),f.original?.rule,{allowDateRangeEdit:!!f.original});if(error)throw Error(error);}}
   const op={module:'borrowing',action:f.kind==='delete'?'delete':'save',grades:submitted.grades,rule:submitted.rule,original:f.original,base:f.base};
   const next=M.apply(read(),op);write(next);selected=f.kind==='delete'?null:M.borrowKey(submitted.rule);field=null;closeControlOverlay(true);render();controlToast(f.kind==='delete'?'规则已删除':'已生效');
  }catch(error){showField(error.message);}
 }
 window.schoolBorrowRulesUI={render,editRule(i){if(!allowed())return;selected=groups(read())[i]?.sig||null;if(selected)openField('create');},deleteRule(i){if(!allowed())return;selected=groups(read())[i]?.sig||null;if(selected)openField('delete');},editCreateSetting,confirmCreateSetting,cancelCreateSetting,pickGrades,cancelGrades,confirmGrades,toggleAllGrades(){if(!gradePicker)return;const d=read(),available=M.grades(d).filter(g=>!gradeDisabled(d,g,field)),all=available.length&&available.every(g=>gradePicker.ids.has(g));gradePicker.ids=new Set(all?[]:available);renderGrades();},selectGrade(grade,checked){if(!allowed()||!field||!gradePicker)return;const d=read();if(checked&&(!M.grades(d).includes(grade)||gradeDisabled(d,grade,field)))return;checked?gradePicker.ids.add(grade):gradePicker.ids.delete(grade);const count=document.getElementById('borrow-grade-count');if(count)count.textContent=gradePicker.ids.size+'/'+M.grades(d).length+' 个年级';const allButton=document.querySelector?.('#control-overlay .control-select-all');if(allButton)allButton.textContent=M.grades(d).filter(g=>!gradeDisabled(d,g,field)).every(g=>gradePicker.ids.has(g))?'取消全选':'全选';const next=document.querySelector?.('#control-overlay .control-primary');if(next)next.disabled=!gradePicker.ids.size;},cancelCreate,discardCreate(){createSetting=null;gradePicker=null;field=null;closeControlOverlay(true);render();},continueCreate(){closeControlOverlay(true);},addCreateGroup(){if(!field)return;const weekdays=[0,1,2,3,4,5,6].filter(day=>!field.settingGroups.some(g=>g.weekdays.includes(day)));if(!weekdays.length)return controlToast('请先取消已有时段组的星期');field.settingGroups.push({weekdays:[],value:{periods:[]}});showField();},removeCreateGroup(i){if(!field||field.settingGroups.length<=1)return;field.settingGroups.splice(i,1);showField();},createPeriod,removeCreatePeriod(g,i){if(field?.kind!=='create'||createSetting?.kind!=='periods'||createSetting.index!==g)return;createSetting.group.value.periods.splice(i,1);showCreateSetting();},reset(m='dates'){mode=m;selected=null;field=null;gradePicker=null;createSetting=null;},busy:()=>!!field,tab(m){if(!['dates','weekly'].includes(m)||field||!allowed())return;mode=m;selected=null;render();},open(i){if(!allowed())return;selected=groups(read())[i]?.sig||null;render();},back(){if(createSetting)return cancelCreateSetting();if(gradePicker)return cancelGrades();if(field?.kind==='create')return cancelCreate();if(window.controlRuleFormUI){selected=null;return schoolControl.back();}if(selected){selected=null;render();}else schoolControl.back();},editField:openField,confirmField:confirm,cancelField(){if(createSetting)return cancelCreateSetting();if(gradePicker)return cancelGrades();if(field?.kind==='create')return cancelCreate();field=null;closeControlOverlay(true);},create(){if(!allowed())return;const d=read();if(mode==='weekly'&&M.grades(d).every(g=>!M.rows(d,[g]).length||M.names(d,[g]).some(n=>(d.schoolSettings.borrowing.classRules[n]||[]).some(r=>r.mode==='weekly'))))return controlToast('全部年级已有规则，请编辑或删除后新增');selected=null;openField('create');},pickDate,period(index){if(!field)return;const f=field,cancel=schoolControl.cancelTime;schoolControl.cancelTime=()=>{schoolControl.cancelTime=cancel;cancel.call(schoolControl);if(field===f)showField();};schoolControl.pickExternalTime(f.settingGroups[f.index].value.periods,index,periods=>{schoolControl.cancelTime=cancel;if(field!==f)return;f.settingGroups[f.index].value.periods=periods;showField();});},removePeriod(i){if(!field)return;field.settingGroups[field.index].value.periods.splice(i,1);showField();},toggle(value){if(!allowed()||field)return;const d=read();d.schoolSettings.borrowing[mode==='weekly'?'weeklyRestrictionEnabled':'dateRestrictionEnabled']=!!value;d.schoolSettings.borrowing.revision++;write(d);render();controlToast(value?'已开启':'已关闭');}};
 addEventListener('keydown',e=>{if(!e.defaultPrevented&&e.key==='Escape'&&field){e.preventDefault();schoolBorrowRulesUI.cancelField();}});
})();
