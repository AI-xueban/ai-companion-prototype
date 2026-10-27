/* 家长学习报告 UI 预览，读取现有学情与任务演示数据。 */
window.learningPrototype = (() => {
  const data = window.learningData;
  const roster = window.schoolDemoRoster;
  const state = { period: 'day', activityId: '', showAllTimeline: false, featureOpen: false };
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const button = (label, value) => `<button class="lp-chip${state.period === value ? ' active' : ''}" aria-pressed="${state.period === value}" onclick="learningPrototype.period('${value}')">${label}</button>`;
  const heading = (title, note = '') => `<div class="pr-section-heading"><h3>${title}</h3>${note ? `<small>${note}</small>` : ''}</div>`;
  const empty = text => `<div class="pr-empty">${text}</div>`;
  const evidenceSheet = report => {
    const item = state.activityId && data.activityEvidence(report, state.activityId);
    if (!item) return '';
    return `<div class="lp-evidence-mask" onclick="learningPrototype.activity('')"><section class="lp-evidence-sheet" role="dialog" aria-modal="true" aria-label="学习活动详情" onclick="event.stopPropagation()"><button class="lp-evidence-close" onclick="learningPrototype.activity('')">关闭 ×</button><h3>${esc(item.activity.feature)} · 活动详情</h3><p>${item.date} ${item.activity.start} · ${esc(item.activity.title)} · ${item.activity.minutes} 分钟 · ${esc(item.activity.status)}</p><h4>原题与作答</h4>${item.questions.length ? item.questions.map(q => `<div class="lp-evidence-question"><strong>${esc(q.stem)}</strong><p>${q.kind}作答：${esc(q.answer)} · ${q.result}</p><p>参考答案：${esc(q.reference)} · ${esc(q.scoring)} · ${esc(q.version)}</p></div>`).join('') : '<p>本次活动没有关联逐题作答。</p>'}</section></div>`;
  };
  const renderParent = index => {
    const child = roster.getDemoStudent(roster.DEMO_GUARDIAN_CHILD_IDS[index] || roster.GUARDIAN_STUDENT_ID);
    const full = data.queryLearning(state.period === '30d' ? '30d' : '7d', child.classId, 'all', child.id);
    const report = state.period === 'day' ? data.learningOnDay(full, 0) : full;
    const summary = data.getStudentLearning(report, child.id);
    const subjects = data.subjectRows(report);
    const rows = data.timelineRows(report);
    const first = report.answers.filter(row => row.kind === '首次');
    const wrong = first.filter(row => !row.correct);
    const corrections = report.answers.filter(row => row.kind === '订正');
    const corrected = corrections.filter(row => row.correct).length;
    const features = data.featureRows(report);
    const chat = features.find(row => row.name === '小晤问答');
    const solve = features.find(row => row.name === 'AI解题');
    const tasks = window.homeworkPrototype?.getParentTaskSummary(index) || { pending: 0, dueSoon: 0, overdue: 0 };
    const periodLabel = state.period === 'day' ? '今日' : state.period === '7d' ? '近 7 天' : '近 30 天';
    const knowledge = new Map();
    wrong.forEach(row => { const key = `${row.subject}:${row.knowledge}`; const entry = knowledge.get(key) || { subject: row.subject, title: row.knowledge || '练习内容', count: 0, activityId: row.activityId }; entry.count++; knowledge.set(key, entry); });
    const focus = [...knowledge.values()].sort((a,b) => b.count - a.count);
    const brief = summary.learned ? `${periodLabel}学习了${subjects.map(row => row.subject).join('、')}，有 ${rows.length} 条学习活动。${first.length ? `首次作答 ${first.length} 题次，答对 ${first.length - wrong.length} 题次。` : '本期暂无练习作答记录。'}` : summary.used ? `${periodLabel}有学伴使用记录，暂未记录到学习活动。` : `${periodLabel}暂无学伴学习记录。可切换时间范围，查看近期学习情况。`;
    const taskText = tasks.dueSoon ? `${tasks.pending} 项待完成，其中 ${tasks.dueSoon} 项将在 24 小时内截止` : tasks.overdue ? `${tasks.pending} 项待完成，其中 ${tasks.overdue} 项仍可补交` : `${tasks.pending} 项作业与打卡待完成`;
    const taskAction = tasks.overdue ? '进入作业查看并补交' : tasks.pending ? '进入作业查看待完成任务' : '进入作业查看全部任务';
    const taskAttention = `<button class="pr-attention-row" onclick="learningPrototype.openTasks()"><span class="pr-attention-mark">${tasks.pending ? tasks.dueSoon ? '临期' : '待办' : '任务'}</span><span><strong>${tasks.pending ? taskText : '当前暂无待完成任务'}</strong><small>${taskAction} ›</small></span></button>`;
    const wrongAttention = wrong.length ? `<button class="pr-attention-row" onclick="learningPrototype.activity('${esc(focus[0].activityId)}')"><span class="pr-attention-mark practice">练习</span><span><strong>${wrong.length} 题次首次答错，值得一起回看</strong><small>集中在：${esc(focus.slice(0,2).map(row => row.title).join('、'))}</small></span><b>›</b></button>` : `<div class="pr-attention-row"><span class="pr-attention-mark neutral">练习</span><span><strong>${first.length ? '本期首次作答未出现答错记录' : '本期暂无练习作答，暂不判断掌握情况'}</strong><small>${first.length ? '可结合后续练习继续观察' : '学习情况以已记录的活动为准'}</small></span></div>`;
    return `<div class="lp-page pl-page pr-report">
      <div class="lp-hero pl-hero"><div class="pl-inline-periods"><div class="lp-switch">${button('今日','day')}${button('近 7 天','7d')}${button('近 30 天','30d')}</div></div></div>
      <section class="pr-overview"><div class="pr-overview-heading"><h2>${state.period === 'day' ? '今日学习概况' : state.period === '7d' ? '近 7 天学习概况' : '近 30 天学习概况'}</h2><small>${state.period === 'day' ? roster.REPORT_END.slice(5) : `截至 ${roster.REPORT_END.slice(5)}`}</small></div><p>${brief}</p><div class="pr-metrics"><div><strong>${summary.minutes}<small>分钟</small></strong><span>学习投入</span></div><div><strong>${rows.length}<small>条</small></strong><span>学习活动</span></div><div><strong>${first.length ? `${first.length - wrong.length}/${first.length}` : '—'}</strong><span>${first.length ? '首次答对 / 作答' : '暂无练习作答'}</span></div></div></section>
      ${heading('需要关注','先看需要家长留意的事')}<section class="pr-card pr-attention">${taskAttention}${wrongAttention}</section>
      ${heading('学科表现','学习内容与练习结果')}<section class="pr-card">${subjects.length ? subjects.map(row => { const answers = first.filter(item => item.subject === row.subject); const errors = answers.filter(item => !item.correct); const topics = [...new Set(report.answers.filter(item=>item.subject===row.subject).map(item=>item.knowledge).filter(Boolean))]; return `<div class="pr-subject"><div class="pr-subject-heading"><strong>${esc(row.subject)}</strong><span>${row.minutes} 分钟 · ${row.count} 条活动</span></div><p>${topics.length ? esc(topics.join('、')) : esc([...new Set(report.activities.filter(item=>item.subject===row.subject).map(item=>item.feature))].join('、'))}</p>${answers.length ? `<div class="pr-subject-results"><span>首次答对 <b>${answers.length-errors.length}/${answers.length}</b> 题次</span><span class="${errors.length ? 'has-errors' : ''}">${errors.length ? `首次答错 ${errors.length} 题次` : '本期未见首次答错'}</span></div>` : '<small class="pr-subject-note">本期无练习作答记录</small>'}</div>`; }).join('') : empty('本期暂无学科学习记录，暂不评价学习效果。')}</section>
      ${corrections.length ? `<div class="pr-correction-note">本期有 ${corrections.length} 题次订正作答，其中 ${corrected} 题次答对。一次订正答对不代表稳定掌握。</div>` : ''}
      ${heading('最近学习记录','点开可查看学习内容与作答')}<section class="pr-card pr-timeline">${rows.length ? rows.slice(0,state.showAllTimeline?12:3).map(row => `<button class="pr-record" onclick="learningPrototype.activity('${row.id}')"><span class="pr-record-dot"></span><span><strong>${esc(row.subject)} · ${esc(row.feature)}</strong><small>${row.date.slice(5)} ${row.start} · ${row.status}</small></span><b>${row.minutes} 分钟 ›</b></button>`).join('') : empty('本期暂无学伴学习记录。')}</section>${rows.length>3 ? `<button class="pr-text-action" onclick="learningPrototype.timelineToggle()">${state.showAllTimeline ? '收起记录 ⌃' : `查看更多记录（${Math.min(rows.length,12)} 条）⌄`}</button>` : ''}
      <button class="pr-usage-toggle" aria-expanded="${state.featureOpen}" onclick="learningPrototype.featuresToggle()"><span>辅助使用信息<small>小晤问答与 AI 解题</small></span><b>${state.featureOpen ? '收起 ⌃' : '展开 ⌄'}</b></button>${state.featureOpen ? `<section class="pr-card"><div class="lp-row"><span>小晤问答</span><strong>${chat?.count || 0} 次</strong></div><div class="lp-row"><span>AI 解题<small>${solve?.problems || 0} 道题 · ${solve?.count || 0} 次解题</small></span><strong>${solve?.questions || 0} 次问答</strong></div></section>` : ''}
      <p class="pr-footnote">仅展示学伴内已记录的学习；时长不含小晤问答。未记录到活动，不代表孩子没有学习。</p>${evidenceSheet(report)}</div>`;
  };
  return {
    getDemoContext:()=>({...state}),
    renderParent,
    openTasks() { window.homeworkPrototype?.resetParentView(); window.homeworkPrototype?.changeParentTaskTab('pending'); window.parentPrototype?.tab('homework'); },
    period(value) { if(!['day','7d','30d'].includes(value)) return; state.period=value; state.activityId=''; state.showAllTimeline=false; window.parentPrototype?.render(); },
    timelineToggle() { state.showAllTimeline=!state.showAllTimeline; window.parentPrototype?.render(); },
    featuresToggle() { state.featureOpen=!state.featureOpen; window.parentPrototype?.render(); },
    activity(id) { state.activityId=id; window.parentPrototype?.render(); },
    resetDetail() { state.activityId=''; state.showAllTimeline=false; state.featureOpen=false; }
  };
})();
