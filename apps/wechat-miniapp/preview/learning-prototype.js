/* 家长学情：仅在已绑定孩子的数据范围内计算和查看详情。 */
window.learningPrototype = (() => {
  const data = window.learningData;
  const roster = window.schoolDemoRoster;
  const state = { tab:'overview', detail:'home', day:0, period:'30d', subject:'all', activityId:'', mistakeId:'', compare:false };
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const button = (label, action, active) => `<button class="lp-chip${active?' active':''}" onclick="learningPrototype.${action}">${label}</button>`;
  const link = (label, action, value='') => `<button class="lr-preview-link" onclick="learningPrototype.${action}"><span>${label}</span><b>${esc(value)} ›</b></button>`;
  const panel = (label, body, hero=false) => `<section class="lr-preview-card${hero?' lr-preview-hero':''}"><h3>${label}</h3>${body}</section>`;
  const evidence = row => `<div class="lr-preview-evidence"><strong>${esc(row.stem)}</strong><p>孩子作答：${esc(row.answer)}</p><p>${esc(row.step)} ${esc(row.result)}</p></div>`;
  const metrics = rows => `<div class="lr-preview-metrics">${rows.map(([value,label])=>`<div><strong>${esc(value)}</strong><small>${label}</small></div>`).join('')}</div>`;
  const records = rows => rows.length ? rows.map(row=>link(`<strong>${esc(row.title)}</strong><small>${esc(row.date)} ${esc(row.start)} · ${esc(row.feature)}</small>`,`activity('${esc(row.id)}')`)).join('') : '<p class="lr-preview-muted">暂无学习活动记录。</p>';
  const activitySheet = report => {
    const selected = state.activityId && data.activityEvidence(report,state.activityId);
    if (!selected) return '';
    return `<div class="lp-evidence-mask" onclick="learningPrototype.activity('')"><section class="lp-evidence-sheet" role="dialog" aria-label="学习活动详情" onclick="event.stopPropagation()"><button class="lp-evidence-close" onclick="learningPrototype.activity('')">关闭 ×</button><h3>${esc(selected.activity.title)}</h3><p>${esc(selected.date)} ${esc(selected.activity.start)} · ${esc(selected.activity.status)}</p>${selected.questions.length?selected.questions.map(row=>`<div class="lp-evidence-question"><strong>${esc(row.stem)}</strong><p>${esc(row.kind)}作答：${esc(row.answer)} · ${esc(row.result)}</p><p>参考答案：${esc(row.reference)}</p></div>`).join(''):'<p>本次活动暂无逐题作答记录。</p>'}</section></div>`;
  };
  function renderParent(index) {
    const child = roster.getDemoStudent(roster.DEMO_GUARDIAN_CHILD_IDS[index]);
    if (!child) return '<div class="lp-page">当前暂无可查看的孩子。</div>';
    const all = data.queryLearning('30d',child.classId,'all',child.id,true);
    const current = state.period==='30d'?all:data.queryLearning('7d',child.classId,'all',child.id,true);
    const today = data.timelineRows(data.learningOnDay(all,state.day));
    const mistakes = data.reportMistakes(all,state.day);
    const corrected = mistakes.filter(row=>row.correction).length;
    const subjects = data.reportSubjects(current);
    const summary = metrics([[new Set(current.activities.map(row=>row.day)).size+' 天','有学习记录'],[current.activities.length+' 项','学习活动'],[subjects.length+' 科','有记录']]);
    const date = `<div class="lr-preview-date"><strong>${data.learningReportDays[state.day]}</strong><select aria-label="回看日期" onchange="learningPrototype.day(this.value)">${data.learningReportDays.map((value,i)=>`<option value="${i}" ${state.day===i?'selected':''}>${i===0?'今天':value}</option>`).join('')}</select></div>`;
    const tabs = state.detail==='home'?`<div class="lr-preview-tabs">${button('总览',"tab('overview')",state.tab==='overview')}${button('周报',"tab('week')",state.tab==='week')}</div>`:link('‹ 返回学情',"detail('home')");
    const correctionLabel = `${corrected} 道有订正记录 · ${mistakes.length-corrected} 道暂无订正记录`;
    let body;
    if(state.detail==='mistakes'){
      body=date+panel('错题与订正',`<h2>${mistakes.length} 道首次答错</h2><p>${correctionLabel}</p>`,true)+mistakes.map((item,i)=>{
        const expanded=state.mistakeId===item.id||!state.mistakeId&&i===0;
        return panel(esc(item.knowledge),`<p class="lr-preview-muted">${esc(item.time)} · ${esc(item.title)} · ${item.correction?'有订正记录':'暂无订正记录'}</p>`+
          link(expanded?'收起原题与作答':'查看原题与作答',`mistake('${esc(item.id)}',${expanded})`)+
          (expanded?evidence(item)+`<p>参考答案：${esc(item.reference)}</p>`+(item.correction?`<p>订正：${esc(item.correction.answer)} · ${esc(item.correction.result)}</p>`:''):''));
      }).join('');
    }else if(state.detail==='child'){
      const chosen=subjects.filter(row=>state.subject==='all'||row.subject===state.subject);
      body=`<div class="lr-preview-tabs">${button('近 7 天',"period('7d')",state.period==='7d')}${button('近 30 天',"period('30d')",state.period==='30d')}</div>`+
        panel('孩子整体学情',summary,true)+`<div class="lr-preview-subjects">${button('全部学科',"subject('all')",state.subject==='all')}${subjects.map(row=>button(esc(row.subject),`subject('${esc(row.subject)}')`,state.subject===row.subject)).join('')}</div>`+
        chosen.map(row=>panel(`${esc(row.subject)} · ${row.count} 项活动`,`<p>${esc(row.contents)}</p>${row.first?`<p>首次答对 ${row.firstCorrect} / ${row.first} 题次</p>`:''}${row.corrections?`<p>订正答对 ${row.correctionCorrect} / ${row.corrections} 次</p>`:''}`)).join('')+
        panel('学习记录',records(data.timelineRows(current).filter(row=>state.subject==='all'||row.subject===state.subject)));
    }else if(state.detail==='today'){
      body=date+panel('学习记录',records(today));
    }else if(state.tab==='week'){
      const report=data.queryLearning('7d',child.classId,'all',child.id,true);
      const week=data.reportWeeklyComparison(report);
      const pair=week?.pairs[0];
      body=`<p class="lr-preview-muted">${data.learningReportDays[6]} 至 ${data.learningReportDays[0]} · 近 7 天</p>`+
        (pair?panel('这周的变化',`<h2>${esc(week.label)}：${pair.beforeCorrect?'正确':'有误'} → ${pair.afterCorrect?'正确':'有误'}</h2><p>两次同类练习中的表现。</p>`,true)+
          panel('两次作答',`<p>${esc(week.beforeDate)} · ${esc(pair.before.step)} · ${esc(pair.before.result)}</p><p>${esc(week.afterDate)} · ${esc(pair.after.step)} · ${esc(pair.after.result)}</p>`+
            link(state.compare?'收起两次作答':'对照这两次作答','toggleComparison()')+(state.compare?evidence(pair.before)+evidence(pair.after):'')):
          panel('本周学习记录',`<p>本周有 ${report.activities.length} 项学习活动，暂无两次可比较的作答。</p>`))+
        (week?.label==='找整体'?panel('接下来可以这样陪','<p>请孩子挑一道做过的题，说说题里哪个量是整体，为什么这样列式。</p>'):'')+
        panel('孩子的整体学情',link('查看各科学习与作答',"detail('child')"));
    }else{
      const label=state.day===0?'今日':'当天';
      body=date+panel(label+'学习',records(today.slice(0,2))+link('查看学习记录',"detail('today')",today.length+' 项'),true)+
        panel(label+'错题',`<h2>${mistakes.length} 道首次答错</h2><p>${correctionLabel}</p>`+link('查看错题与订正',"detail('mistakes')"))+
        panel('孩子的整体学情',summary+link('查看各科学习与作答',"detail('child')"));
    }
    return `<div class="lp-page pl-page lr-preview lr-preview-parent"><p class="lr-preview-muted">演示数据 · 截至 ${data.learningReportDays[0]}</p>${tabs}${body}${activitySheet(all)}</div>`;
  }
  const refresh=()=>window.parentPrototype?.render();
  return {
    getDemoContext:()=>({...state}), renderParent,
    tab(tab){if(['overview','week'].includes(tab)){state.tab=tab;state.detail='home';state.compare=false;state.activityId='';refresh();}},
    detail(detail){if(['home','today','mistakes','child'].includes(detail)){state.detail=detail;state.mistakeId='';state.subject='all';state.activityId='';refresh();}},
    day(value){const day=Number(value);if(Number.isInteger(day)&&day>=0&&day<data.learningReportDays.length){state.day=day;state.mistakeId='';state.activityId='';refresh();}},
    period(period){if(['7d','30d'].includes(period)){state.period=period;state.subject='all';state.activityId='';refresh();}},
    subject(subject){state.subject=subject;state.activityId='';refresh();},
    mistake(id,expanded){state.mistakeId=expanded?'closed':id;refresh();},
    toggleComparison(){state.compare=!state.compare;refresh();},
    activity(id){state.activityId=id;refresh();},
    resetDetail(){Object.assign(state,{tab:'overview',detail:'home',subject:'all',activityId:'',mistakeId:'',compare:false});},
  };
})();
