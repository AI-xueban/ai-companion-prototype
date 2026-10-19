/* 浏览器预览直接读取小程序 TypeScript 学情事实；身份与权限为本地演示。 */
window.learningPrototype = (() => {
  const data = window.learningData;
  const roster = window.schoolDemoRoster;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const state = { period: 'day', day: 0, activityId: '', showAllTimeline: false, featureOpen: false };
  const button = (label, action, active = false) => `<button class="lp-chip${active ? ' active' : ''}" onclick="learningPrototype.${action}">${label}</button>`;
  const periods = () => `<div class="lp-switch">${button('按日', "period('day')", state.period === 'day')}${button('近 7 天', "period('7d')", state.period === '7d')}${button('近 30 天', "period('30d')", state.period === '30d')}</div>`;
  const empty = label => `<div class="lp-empty">${label}</div>`;
  const timeline = (report, limit = 12) => {
    const rows = data.timelineRows(report).slice(0, limit);
    return `<section class="lp-card">${rows.length ? rows.map(row => `<button class="lp-evidence-entry" onclick="learningPrototype.activity('${row.id}')"><div><strong>${esc(row.subject)} · ${esc(row.feature)}</strong><b>${row.minutes} 分钟 ›</b></div><small>${row.date} ${row.start} · ${esc(row.title)}<br>${row.status}${row.answers ? ` · 首次作答 ${row.answers} 题` : ''}</small></button>`).join('') : empty('当前范围暂无学习活动。')}</section>`;
  };
  const renderParent = index => {
    const childId = roster.DEMO_GUARDIAN_CHILD_IDS[index] || roster.GUARDIAN_STUDENT_ID;
    const child = roster.getDemoStudent(childId);
    const full = data.queryLearning(state.period === '30d' ? '30d' : '7d', child.classId, 'all', child.id);
    const report = state.period === 'day' ? data.learningOnDay(full, state.day) : full;
    const summary = data.getStudentLearning(report, child.id);
    const subjects = data.subjectRows(report);
    const features = data.featureRows(report);
    const chat = features.find(row => row.name === '小晤问答');
    const solve = features.find(row => row.name === 'AI解题');
    const studyStatus = summary.learned ? `学习 ${summary.days} 天` : summary.used ? '仅有应用使用记录' : '暂无应用使用记录';
    const activityCount = data.timelineRows(report).length;
    const periodLabel = state.period === 'day' ? state.day === 0 ? '今天' : roster.reportDate(state.day) : state.period === '7d' ? '近 7 天' : '近 30 天';
    const brief = summary.learned ? `${periodLabel}有 ${activityCount} 条学习活动，学习 ${summary.minutes} 分钟；首次作答 ${summary.firstCount} 题，其中首次答错 ${summary.firstWrong} 题。` : summary.used ? `${periodLabel}有应用使用记录，暂无学伴学习活动。` : `${periodLabel}暂无学伴学习活动。`;
    return `<div class="lp-page pl-page">
      <div class="lp-hero pl-hero"><div class="pl-heading"><small>${esc(child.name)} · ${esc(child.className)}</small>${periods()}</div><p>${state.period === 'day' ? roster.reportDate(state.day) : `统计截至 ${roster.REPORT_END}`} · 模拟数据</p>${state.period === 'day' ? `<div class="lp-day-options">${Array.from({length:7},(_,day)=>button(day===0?'今日':roster.reportDate(day).slice(5),`day(${day})`,state.day===day)).join('')}</div>` : ''}</div>
      <section class="lp-card lp-brief"><small>本期摘要</small><strong>${brief}</strong></section>
      <div class="lp-title"><h3>最近学习记录</h3></div>${timeline(report,state.showAllTimeline ? 12 : 3)}${activityCount > 3 ? `<button class="lp-link" onclick="learningPrototype.timelineToggle()">${state.showAllTimeline ? '收起记录' : `查看全部记录（最多 12 条）`} ›</button>` : ''}
      <div class="lp-title"><h3>学科情况</h3></div><section class="lp-card">${subjects.length ? subjects.map(row => `<div class="lp-row"><span>${row.subject}<small>${row.count} 条学习活动</small></span><strong>${row.minutes} 分钟</strong></div>`).join('') : empty('本期暂无学习活动。')}</section>
      <button class="lp-link" onclick="learningPrototype.featuresToggle()">${state.featureOpen ? '收起' : '查看'}问答与解题使用 ›</button>${state.featureOpen ? `<section class="lp-card"><div class="lp-row"><span>小晤问答<small>仅计应用使用，不计学习分钟</small></span><strong>${chat?.count || 0} 次</strong></div><div class="lp-row"><span>AI 解题<small>${solve?.problems || 0} 道题 · ${solve?.count || 0} 次解题</small></span><strong>${solve?.questions || 0} 次问答</strong></div></section>` : ''}<button class="lp-link" onclick="parentPrototype.tab('homework')">查看作业与打卡 ›</button><p class="lp-note">学习分钟按学习活动统计，不含小晤问答。</p>${state.activityId ? (() => { const evidence = data.activityEvidence(report,state.activityId); return evidence ? `<div class="lp-evidence-mask" onclick="learningPrototype.activity('')"><section class="lp-evidence-sheet" onclick="event.stopPropagation()"><button class="lp-evidence-close" onclick="learningPrototype.activity('')">关闭 ×</button><h3>${esc(evidence.activity.feature)} · 活动详情</h3><p>${evidence.date} ${evidence.activity.start} · ${esc(evidence.activity.title)} · ${evidence.activity.minutes} 分钟 · ${esc(evidence.activity.status)}</p><h4>原题与作答</h4>${evidence.questions.length ? evidence.questions.map(item => `<div class="lp-evidence-question"><strong>${esc(item.stem)}</strong><p>${item.kind}作答：${esc(item.answer)} · ${item.result}</p><p>参考答案：${esc(item.reference)} · ${esc(item.scoring)} · ${esc(item.version)}</p></div>`).join('') : '<p>本次活动没有关联逐题作答。</p>'}</section></div>` : ''; })() : ''}</div>`;
  };
  return {
    renderParent,
    period(value) { if (!['day','7d','30d'].includes(value)) return; state.period = value; state.activityId = ''; state.showAllTimeline = false; window.parentPrototype?.render(); },
    day(value) { if (!Number.isInteger(value) || value < 0 || value > 6) return; state.day = value; state.period = 'day'; state.activityId = ''; state.showAllTimeline = false; window.parentPrototype?.render(); },
    timelineToggle() { state.showAllTimeline = !state.showAllTimeline; window.parentPrototype?.render(); },
    featuresToggle() { state.featureOpen = !state.featureOpen; window.parentPrototype?.render(); },
    activity(id) { state.activityId = id; window.parentPrototype?.render(); },
    resetDetail() { state.activityId = ''; },
  };
})();
