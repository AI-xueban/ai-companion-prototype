/* 教职员工统一工作台：演示常见的双重职责，菜单只列出当前账号获授权的视角。 */
window.workbenchPrototype = (() => {
  const learning = window.learningData, roster = window.schoolDemoRoster;
  const { reportPracticeDays: practiceDays, reportIssueGroups: groupIssues } = learning;
  const dayIssues = (scope, day) => learning.reportDayIssues(scope, day, state.view === 'subject' ? 'question' : 'step');
  const state = { view: 'homeroom', grade: 'all', classId: 'c1', period: '7d', tab: 'overview', studentId: '', knowledge: '', questionId: '', activityId: '', rankingBy: 'people', day:0, followup:false, pairId:'', weekEvidence:false, dayQuestion:'', studentPeriod:'30d' };
  const isHomeroomRoster = () => state.view === 'homeroom' && state.tab === 'students' && !state.studentId;
  let focusPage = null;
  let issueBrowse = null;
  let rosterReturn = null;
  let rosterPeriodOverride = '';
  let rosterSubject = '';
  let rosterName = '';
  let rosterFrom = 'overview';
  let rosterFilter = 'all';
  let focusStudentId = '';
  let focusScroll = 0;
  let subjectPeriod = '7d';
  let personalRange = null, personalFilter = 'all', personalTopic = 'all', personalExpanded = [];
  let personalDatesOpen = false, personalDraftStart = '', personalDraftEnd = '', personalDateError = '';
  let studentOriginScroll = 0;
  let rosterOriginScroll = 0;
  let activityOriginScroll = 0;
  let granted = ['school', 'homeroom', 'subject'];
  const names = { school: '学校管理员', homeroom: '班主任', subject: '任课老师' };
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const teachingAssignments = roster.getDemoTeachingAssignments('teacher-demo-001');
  const subjectClassIds = new Set(teachingAssignments.flatMap(row => row.classIds));
  const learningSubjects = [...new Set(teachingAssignments.filter(row => row.classIds.some(id => roster.getDemoClass(id))).map(row => row.subject))];
  const defaultLearningSubject = learningSubjects.includes('数学') ? '数学' : learningSubjects[0] || '';
  let learningSubject = defaultLearningSubject;
  const learningClasses = () => roster.DEMO_CLASSES.filter(row => subjectClassIds.has(row.id));
  const classSubjects = () => [...new Set(teachingAssignments.filter(row => row.classIds.includes(state.classId)).map(row => row.subject))];
  const normalizeSubject = () => { if (!classSubjects().includes(learningSubject)) learningSubject = classSubjects()[0] || ''; };
  const classes = () => state.view === 'school' ? roster.DEMO_CLASSES.filter(row => state.grade === 'all' || row.grade === Number(state.grade)) : state.view === 'homeroom' ? roster.DEMO_CLASSES.filter(row => row.id === 'c1') : roster.DEMO_CLASSES.filter(row => subjectClassIds.has(row.id));
  const classIds = () => state.view === 'school' ? classes().filter(row => state.classId === 'all' || row.id === state.classId).map(row => row.id) : state.view === 'homeroom' ? ['c1'] : [state.classId];
  const scopeName = () => state.classId !== 'all' ? roster.getDemoClass(state.classId)?.name || '' : state.grade === 'all' ? roster.SCHOOL_NAME : `${state.grade}年级`;
  const subjectName = () => state.view === 'subject' ? learningSubject : '全科';
  const isSubjectHome = () => state.view === 'subject' && state.tab === 'overview' && !state.studentId && !issueBrowse && !focusPage;
  function subjectScopePicker() {
    const options = learningClasses();
    if (!options.length) return '';
    const subjects = classSubjects();
    const tabs = options.map(item => `<button type="button" role="tab" aria-selected="${item.id === state.classId}" onclick="workbenchPrototype.selectLearningClass('${item.id}')">${esc(item.name)}</button>`).join('');
    const picker = subjects.length > 1 ? `<select aria-label="任教学科" onchange="workbenchPrototype.changeLearningSubject(Number(this.value))">${subjects.map((name,index) => `<option value="${index}" ${name === learningSubject ? 'selected' : ''}>${esc(name)}</option>`).join('')}</select>` : `<span class="lr-preview-subject-static">${esc(learningSubject)}</span>`;
    return `<div class="lr-preview-learning-scope"><div class="lr-preview-class-tabs" role="tablist" aria-label="任教班级">${tabs}</div>${picker}</div>`;
  }
  const report = (studentId = 'all', period = state.view === 'subject' ? subjectPeriod : state.period) => {
    const full = learning.queryLearning(period, 'all', state.view === 'subject' ? learningSubject : 'all', studentId, state.view !== 'school');
    const ids = classIds();
    const rosterRows = full.roster.filter(row => ids.includes(row.classId));
    const activities = full.activities.filter(row => ids.includes(row.classId));
    const operations = full.operations.filter(row => ids.includes(row.classId));
    const answers = full.answers.filter(row => ids.includes(row.classId));
    const solveRequests = full.solveRequests.filter(row => ids.includes(row.classId));
    const scoped = { roster: rosterRows, activities, operations, answers, solveRequests, usedIds: new Set(operations.map(row => row.studentId)), learnedIds: new Set(activities.map(row => row.studentId)), minutes: activities.reduce((sum, row) => sum + row.minutes, 0) };
    return state.view === 'subject' ? learning.withSubjectMaterialData(scoped, learningSubject, period) : scoped;
  };
  const chip = (text, method, selected) => `<button class="lp-chip${selected ? ' active' : ''}" onclick="workbenchPrototype.${method}">${text}</button>`;
  const stat = (value, label) => `<div class="lp-stat"><strong>${esc(value)}</strong><span>${label}</span></div>`;
  const empty = label => `<div class="lp-empty">${esc(label)}</div>`;
  const panel = (title, content) => `<div class="lp-title"><h3>${title}</h3></div><section class="lp-card">${content || '<div class="lp-empty">当前范围暂无记录。</div>'}</section>`;
  const focusPanel = (eyebrow, title, content) => `<section class="wb-focus"><div class="wb-focus-heading"><span>${eyebrow}</span><h2>${title}</h2></div><div class="wb-focus-list">${content || '<div class="lp-empty">当前范围暂无记录。</div>'}</div></section>`;
  const row = (label, value, detail = '') => `<div class="lp-row"><span>${esc(label)}${detail ? `<small>${esc(detail)}</small>` : ''}</span><strong>${esc(value)}</strong></div>`;
  const learningPeriodControl = () => `<div class="wb-period">${chip('近 7 天', "period('7d')", state.period === '7d')}${chip('近 30 天', "period('30d')", state.period === '30d')}</div>`;
  const header = (domain, title, showControls = true) => {
    const roleChoices = [['school','学校管理员'],['homeroom','班主任'],['subject','任课老师']].filter(([id]) => granted.includes(id) && (domain !== 'homework' || id !== 'school'));
    const role = roleChoices.length > 1 ? `<details class="wb-role-menu"><summary aria-label="切换工作身份，当前${names[state.view]}">${names[state.view]}<span class="wb-chevron" aria-hidden="true"></span></summary><div class="wb-role-menu-list"><small>切换到</small>${roleChoices.filter(([id]) => id !== state.view).map(([id,label]) => `<button class="wb-role-option" type="button" onclick="workbenchPrototype.view('${id}')">${label}<span>›</span></button>`).join('')}</div></details>` : '';
    const designation = names[state.view];
    const grades = state.view === 'school' ? `<div class="wb-filter-row"><span class="wb-filter-label">年级</span><div class="wb-filter-options">${[['all','全校'],['7','七年级'],['8','八年级']].map(([id,label]) => chip(label, `grade('${id}')`, state.grade === id)).join('')}</div></div>` : '';
    const classChoices = state.view === 'school' ? chip('全部班级', "class('all')", state.classId === 'all') : '';
    const classRow = state.view === 'homeroom' ? '' : `<div class="wb-filter-row"><span class="wb-filter-label">班级</span><div class="wb-filter-options wb-class-options">${classChoices}${classes().map(item => chip(item.name, `class('${item.id}')`, state.classId === item.id)).join('')}</div></div>`;
    const period = domain === 'learning' && (state.view === 'school' || (state.view !== 'homeroom' && !['overview', 'week'].includes(state.tab))) ? learningPeriodControl() : '';
    const selectedScope = state.view === 'school' ? state.classId === 'all' ? state.grade === 'all' ? '全校' : state.grade + '年级' : scopeName() : state.view === 'homeroom' ? '七年级(2)班' : domain === 'homework' ? scopeName() : `${scopeName()} · ${subjectName()}`;
    const scopeFilter = grades || classRow ? `<details class="wb-scope-details"><summary aria-label="调整查看范围，当前${esc(selectedScope)}"><span class="wb-scope-key">范围</span><strong>${esc(selectedScope)}</strong><span class="wb-chevron" aria-hidden="true"></span></summary><div class="wb-scope-options">${grades}${classRow}</div></details>` : `<div class="wb-scope-static"><span class="wb-scope-key">范围</span><strong>${esc(selectedScope)}</strong></div>`;


    const controls = domain === 'homework' ? showControls ? `<div class="wb-condition-row wb-homework-toolbar"><div class="wb-homework-identity">${role||'<span>'+designation+'</span>'}</div>${state.view==='school'?'<div class="wb-homework-context"><span class="wb-readonly">只读</span>'+scopeFilter+'</div>':''}${state.view!=='school'?'<button class="hp-my-drafts-entry" onclick="homeworkPrototype.openTeacherDrafts()"><span class="hp-draft-entry-icon" aria-hidden="true"></span>我的草稿<span class="hp-draft-count">'+(window.homeworkPrototype?.getTeacherDraftCount?.()||0)+'</span><span aria-hidden="true">›</span></button>':''}</div>` : '' : state.studentId || focusPage || issueBrowse || isHomeroomRoster() || (state.view === 'subject' && state.tab === 'students') ? '' : isSubjectHome()
      ? `<div class="wb-condition-row wb-learning-toolbar lr-preview-subject-role"><span class="ml-scope-label">任教学情 · 演示数据</span>${role}</div>${subjectScopePicker()}`
      : `<div class="wb-condition-row wb-learning-toolbar">${scopeFilter}${role}</div>${period ? `<div class="wb-condition-row">${period}</div>` : ''}`;
    const pageClass = domain === 'homework' ? ' wb-homework-page' : state.view === 'subject' ? ' wb-subject-learning' + ((isSubjectHome() || issueBrowse?.materialRoute) && !state.studentId ? ' ml-page' : '') : '';
    return `<div class="lp-page wb-page${pageClass}">${controls}`;
  };
  const timeline = data => panel('学习轨迹', learning.timelineRows(data).slice(0, 20).map(item => `<button class="lp-evidence-entry" onclick="workbenchPrototype.activity('${item.id}')"><div><strong>${esc(item.subject)} · ${esc(item.feature)}</strong><b>${item.minutes} 分钟 ›</b></div><small>${item.date} ${item.start} · ${esc(item.title)} · ${item.status}</small></button>`).join(''));
  const reportCard = (title, body, hero = false, headerAction = '') => `<section class="lr-preview-card${hero?' lr-preview-hero':''}">${headerAction ? `<div class="lr-preview-card-header"><h3>${title}</h3>${headerAction}</div>` : `<h3>${title}</h3>`}${body}</section>`;
  const reportLink = (label, action, detail = '') => `<button class="lr-preview-link" onclick="workbenchPrototype.${action}"><span>${label}</span><b>${esc(detail)} ›</b></button>`;
  const reportMetrics = rows => `<div class="lr-preview-metrics">${rows.map(([value,label])=>`<div><strong>${esc(value)}</strong><small>${label}</small></div>`).join('')}</div>`;
  const weekReport = () => learning.reportWeeklyComparison(report('all','7d'));
  const clearDetails = () => { focusPage = null; issueBrowse = null; rosterReturn = null; rosterPeriodOverride = ''; rosterSubject = ''; rosterName = ''; rosterFrom = 'overview'; rosterFilter = 'all'; focusStudentId = ''; focusScroll = 0; return Object.assign(state,{ studentId:'', knowledge:'', questionId:'', activityId:'', followup:false, pairId:'', weekEvidence:false, dayQuestion:'' }); };
  function periodDates(period) {
    if (period === '1d') return learning.learningReportDays[0];
    return learning.learningReportDays[period === '30d' ? 29 : period === '14d' ? 13 : 6] + ' 至 ' + learning.learningReportDays[0];
  }
  function renderHomeroom(result, weekly) {
    const period = weekly ? '7d' : state.period;
    const subjects = learning.reportSubjects(result);
    const coverage = `<p>${result.learnedIds.size} / ${result.roster.length} 名在册学生有学伴活动记录</p>`;
    const rows = subjects.map(item => `<div class="lr-preview-evidence"><strong>${esc(item.subject)}</strong>
      <p>${item.people} 人有活动记录 · ${item.count} 项活动</p>
      <p class="lr-preview-muted">${esc(item.contents)}</p></div>`).join('');
    return reportCard(weekly ? '本周学习情况' : '班级阶段概况',
      `<p class="lr-preview-muted">${periodDates(period)}</p>` + coverage +
      (rows || '<p>所选区间暂无学伴活动记录</p>') +
      '<p class="lr-preview-muted">仅展示所选区间内学伴已有记录的学科。</p>', true, weekly ? '' : learningPeriodControl()) +
      reportCard('全班学生',reportLink('查看学生学情', "openClassRoster()", result.roster.length+' 人'));
  }
  function renderSchool(result) {
    const byClass = classes().filter(item => state.classId === 'all' || item.id === state.classId).map(item => {
      const roster = result.roster.filter(student => student.classId === item.id);
      return { ...item, enrolled: roster.length, counted: roster.filter(student => result.learnedIds.has(student.id)).length };
    });
    if (state.classId !== 'all') {
      const total = result.roster.length;
      const subjects = learning.subjectRows(result);
      const sources = new Map();
      for (const activity of result.activities) {
        const count = sources.get(activity.feature) || 0;
        sources.set(activity.feature, count + 1);
      }
      return reportCard(esc(scopeName()),
        `<p class="lr-preview-muted">${periodDates(state.period)}</p>` +
        reportMetrics([[total+' 人','在册'],[result.learnedIds.size+' 人','有学伴学习记录'],[(total-result.learnedIds.size)+' 人','暂无学伴学习记录']]), true) +
        reportCard('各科学习覆盖', subjects.length ? subjects.map(item =>
          `<p>${esc(item.subject)} · ${item.people} / ${total} 人有记录</p>`
        ).join('') : '<p>所选区间暂无学科学习记录</p>') +
        reportCard('学习活动来源', sources.size ? [...sources].map(([name,count]) =>
          `<p>${esc(name)} · ${count} 项活动</p>`
        ).join('') : '<p>所选区间暂无学习活动</p>');
    }
    byClass.sort((a,b) => (a.enrolled ? a.counted/a.enrolled : 0) - (b.enrolled ? b.counted/b.enrolled : 0));
    const classLinks = byClass.map(item => reportLink(esc(item.name),
      `class('${item.id}')`,
      `${item.counted} / ${item.enrolled} 人有记录`)).join('');
    return reportCard('校级学习覆盖',
      `<p class="lr-preview-muted">${periodDates(state.period)}</p>` +
      reportMetrics([[byClass.filter(item => item.counted > 0).length+' / '+byClass.length,'有学习记录的班级'],[result.learnedIds.size+' / '+result.roster.length,'有学伴学习记录']]), true) +
      reportCard('各班学习覆盖', classLinks) +
      reportCard('应用使用', `<p>${result.usedIds.size} 名学生有应用使用记录</p>`);
  }
  function practiceDayLinks(scope, days) {
    return days.map(day => {
      const issues = dayIssues(scope, day);
      const detail = issues.length ? `${issues.length} 道题有误` : '暂无有误题目';
      return reportLink(learning.learningReportDays[day], `openPracticeDay(${day})`, detail);
    }).join('');
  }
  function renderOverview() { return renderMaterialHome(); }
  function renderWeek() {
    const week=weekReport();
    if (!week) return reportCard('本周作答变化',`<p class="lr-preview-muted">${periodDates('7d')}</p><p>本周暂无同一批学生的可比作答，无法判断变化。</p>`);
    if(state.followup) return reportCard('本周跟进名单',`<h2>${week.repeated.length} 人两次${esc(week.label)}有误</h2><p>从两次都有可比记录的 ${week.size} 名学生中筛出。</p>`,true)+
      reportCard('学生名单',week.repeated.map(row=>reportLink(`<strong>${esc(row.name)}</strong><small>${esc(row.before.step)} · ${esc(row.after.step)}</small>`,`pair('${row.studentId}')`,'两次作答')).join(''));
    const bars = [[week.beforeDate,week.beforeWrong],[week.afterDate,week.afterWrong]].map(([date,count],index)=>
      `<div class="lr-preview-bar-row"><small>${esc(date)}</small><div class="lr-preview-bar-track"><div class="${index===0?'earlier':''}" style="width:${learning.pct(count,week.size)}%"></div></div><b>${count} 人</b></div>`).join('');
    return `<p class="lr-preview-muted">${learning.learningReportDays[6]} 至 ${learning.learningReportDays[0]} · 近 7 天</p>`+
      reportCard('本周变化',`<h2>${esc(week.label)}有误：${week.beforeWrong} 人 → ${week.afterWrong} 人</h2><p>同一批 ${week.size} 人，两次同类检查。</p>${bars}`,true)+
      reportCard(`下周优先跟进 · ${week.repeated.length} 人`,
        reportMetrics([[week.improved+' 人','由错到对'],[week.repeated.length+' 人','两次都错'],[week.newlyWrong+' 人','由对到错']])+
        (week.repeated.length ? `<p>${esc(week.repeated.slice(0,3).map(row=>row.name).join('、'))}${week.repeated.length>3?'等':''}</p>`+
          reportLink('查看跟进名单','openFollowup()',week.repeated.length+' 人'):'')+
        reportLink(state.weekEvidence?'收起检查依据':'看两次检查的依据','toggleWeekEvidence()')+
        (state.weekEvidence?`<div class="lr-preview-evidence"><p>${esc(week.beforeDate)} · ${esc(week.pairs[0].before.stem)}</p><p>${esc(week.afterDate)} · ${esc(week.pairs[0].after.stem)}</p><p>仅纳入两次都完成可比作答的 ${week.size} 人。</p></div>`:''));
  }
  const evidenceOverlay = result => {
    if (state.pairId) {
      const rows = state.studentId ? learning.reportWeeklyComparison(report(state.studentId,state.studentPeriod))?.pairs : weekReport()?.repeated;
      const pair=rows?.find(row=>row.studentId===state.pairId);
      if(!pair)return '';
      const evidence=row=>`<div class="lp-evidence-question"><strong>${esc(row.date)} · ${esc(row.step)}</strong><p>${esc(row.stem)}</p><p>学生作答：${esc(row.answer)} · ${esc(row.result)}</p></div>`;
      return `<div class="lp-evidence-mask" onclick="workbenchPrototype.pair('')"><section class="lp-evidence-sheet" role="dialog" aria-label="两次作答" onclick="event.stopPropagation()"><button class="lp-evidence-close" onclick="workbenchPrototype.pair('')">关闭 ×</button><h3>${esc(pair.name)} · 两次作答</h3>${evidence(pair.before)}${evidence(pair.after)}${state.studentId?'':reportLink('查看学生个人学情',`student('${pair.studentId}')`)}</section></div>`;
    }
    if (state.activityId && state.studentId) {
      const evidence = learning.activityEvidence(state.view==='subject'?personalScope():report(state.studentId,state.studentPeriod), state.activityId);
      return evidence ? `<div class="lp-evidence-mask" onclick="workbenchPrototype.activity('')"><section class="lp-evidence-sheet" onclick="event.stopPropagation()"><button class="lp-evidence-close" onclick="workbenchPrototype.activity('')">关闭 ×</button><h3>${esc(evidence.activity.feature)} · 活动详情</h3><p>${evidence.date} ${evidence.activity.start} · ${esc(evidence.activity.title)} · ${evidence.activity.minutes} 分钟 · ${esc(evidence.activity.status)}</p><h4>原题与作答</h4>${evidence.questions.length ? evidence.questions.map(item => `<div class="lp-evidence-question"><strong>${esc(item.stem)}</strong><p>${item.kind}作答：${esc(item.answer)} · ${item.result}</p><p>参考答案：${esc(item.reference)} · ${esc(item.scoring)} · ${esc(item.version)}</p></div>`).join('') : '<p>本次活动没有关联逐题作答。</p>'}</section></div>` : '';
    }
    if (!state.questionId) return '';
    const question = learning.getLearningQuestion(state.questionId);
    const scope = state.dayQuestion ? report('all','30d') : result;
    const attempts = state.dayQuestion ? learning.learningOnDay(scope,state.day).answers : result.answers;
    const focus = state.dayQuestion ? learning.reportDayFocus(scope,state.day) : null;
    const affected = state.dayQuestion==='affected' ? new Set(focus?.students.map(row=>row.id)) : null;
    const context = focus ? `<p>${esc([focus.date,scopeName(),focus.subject,focus.knowledge,focus.checkName].join(' · '))}</p>` : '';
    if (question && focus && !affected) {
      const title = focus.representative ? '原题与作答示例' : '原题';
      return `<div class="lp-evidence-mask" onclick="workbenchPrototype.question('')"><section class="lp-evidence-sheet" role="dialog" aria-label="${title}" onclick="event.stopPropagation()"><button class="lp-evidence-close" onclick="workbenchPrototype.question('')">关闭 ×</button><h3>${title}</h3>${context}<div class="lp-evidence-question"><strong>${esc(question.stem)}</strong><p>参考答案：${esc(question.answer)}</p></div>${focus.representative ? `<div class="lp-evidence-question"><p>作答示例：${esc(focus.representative.answer)}</p><p>判定：${esc(focus.finding)}</p></div>` : ''}</section></div>`;
    }
    const first = [...new Map(attempts.filter(item => item.questionId === state.questionId && item.kind === '首次' && (!affected || affected.has(item.id))).map(row=>[row.studentId,row])).values()];
    if (!question || !first.length) return '';
    return `<div class="lp-evidence-mask" onclick="workbenchPrototype.question('')"><section class="lp-evidence-sheet" role="dialog" aria-label="原题与学生作答" onclick="event.stopPropagation()"><button class="lp-evidence-close" onclick="workbenchPrototype.question('')">关闭 ×</button><h3>${affected ? '出现该问题的学生 · '+first.length+' 人' : '原题与学生作答'}</h3>${context}<div class="lp-evidence-question"><strong>${esc(question.stem)}</strong><p>参考答案：${esc(question.answer)} · ${esc(question.scoring)} · ${esc(question.version)}</p></div><h4>首次作答与订正 · ${first.length} 人</h4>${first.map(item => {
      const student=scope.roster.find(row=>row.id===item.studentId);
      const correction=scope.answers.find(row=>row.kind==='订正'&&row.originalAttemptId===item.id&&row.studentId===item.studentId&&row.questionId===item.questionId);
      const step=item.check?` · ${esc(item.check.label)}${item.check.correct?'正确':'有误'}`:'';
      return `<button class="lp-evidence-entry" onclick="workbenchPrototype.student('${item.studentId}')"><div><strong>${esc(student?.name || '学生')}</strong><b>查看学生 ›</b></div><small>首次作答：${esc(item.answerText || '原始作答暂缺')} · ${item.correct ? '整题答对' : '整题答错'}${step}<br>${correction ? `有订正记录 · ${correction.correct?'本次答对':'本次仍错'}` : '暂无订正记录'}</small></button>`;
    }).join('')}</section></div>`;
  };
  function issueGroupLinks(groups, action, showSubject = true) {
    return groups.map((group, index) => {
      const count = group.questionCount;
      const label = showSubject ? group.name : group.knowledge;
      return reportLink(esc(label), action(index), `${count} 道题 · ${group.people.size} 人有误`);
    }).join('');
  }
  function reviewIssues(scope, days) {
    return Array.from({length:days}, (_,day) => dayIssues(scope,day)).flat();
  }

  function subjectBrowse(days, recent, groupIndex = null) {
    const scope = report('all', days + 'd');
    const all = learning.subjectAnswerQuestions(scope);
    const issues = recent ? all.filter(q => q.wrongPeople) : all;
    const groups = [...new Set(issues.map(q => q.knowledge))].map(knowledge => ({ knowledge, questions: issues.filter(q => q.knowledge === knowledge) }));
    return { materialRoute: {kind: recent ? 'list' : 'stage', mode:'source', onlyWrong: recent}, materialTrail: [], result:'wrong', modern: true, issues, groups, reviewDays: days, recent, groupIndex, selected: null, search: '', correction: 'all', expanded: [], questionCollapsed: false,
      direct: groupIndex !== null, overviewScroll: document.getElementById('teacher-tab-panel')?.scrollTop || 0 };
  }
  const attemptBlock = (label, item) => '<section class="lr-answer-block"><div><strong>'+label+'</strong><span class="lr-answer-status '+(item.correct?'fixed':'still')+'">'+(item.correct?'答对':label==='首次作答'?'答错':'仍错')+'</span></div><small>'+esc(item.date)+' '+esc(item.time)+'</small><p>'+esc(item.answer)+'</p></section>';
  function answerChains(student) {
    return student.chains.map((chain,index) => '<div class="lr-answer-chain">'+(student.chains.length>1?'<p class="lr-preview-muted">作答记录 '+(index+1)+'</p>':'')+attemptBlock('首次作答',chain)+(chain.latest?attemptBlock('最近一次订正',chain.latest):'<p class="lr-preview-muted">暂无订正记录</p>')+(chain.corrections.length>1?'<details class="lr-correction-history"><summary>查看全部 '+chain.corrections.length+' 次订正</summary>'+chain.corrections.map((c,i)=>attemptBlock('第 '+(i+1)+' 次订正',c)).join('')+'</details>':'')+'</div>').join('');
  }
  function renderSubjectBrowse() { return renderMaterialBrowse(); }

  // Subject-teacher material views. All values come from the authorized shared report.
  const mlButton = (label, route, cls='ml-entry') => `<button class="${cls}" onclick="workbenchPrototype.materialGo(${esc(JSON.stringify(route))})">${label}</button>`;
  const mlMetric = (n,label,unit='') => `<div class="ml-metric"><strong>${n}<em>${unit}</em></strong><span>${label}</span></div>`;
  const mlCard = body => '<section class="ml-card">'+body+'</section>';
  const mlEmpty = label => '<div class="ml-empty">'+label+'</div>';
  const mlContext = days => '<div class="ml-context">'+esc(scopeName()+' · '+subjectName())+'<br>'+periodDates(days+'d')+'</div>';
  const mlModel = (days,selection={}) => learning.subjectMaterialView(report('all',days+'d'),days,selection);
  function mlMetrics(v) { const n=v.stats;return '<div class="ml-metrics">'+mlMetric(n.people+'/'+v.enrolled,'有判定学生')+mlMetric(n.questions,'有判定题目','道')+mlMetric(n.attempts,'有效作答','次')+'</div>'; }
  function mlUnknown(v,wrong=false) {
    const qs=v.unknown.filter(q=>!wrong||q.wrongPeople),n=learning.subjectMaterialStats(qs);
    if(!qs.length)return '';
    return mlButton(`<span><strong>${wrong?'其他错题':'知识点暂未明确的题目'}</strong><small>${wrong?'知识点暂未明确':'已有判定结果，可按来源查看'}</small></span><b>${n.questions}道${wrong?' · '+n.bad+'人答错':''} ›</b>`,{kind:'list',unknown:true,onlyWrong:wrong},'ml-unknown-entry');
  }
  function mlKnowledge(v,wrong=false) {
    return v.groups.filter(g=>!wrong||g.stats.bad).slice(0,wrong?5:999).map(g=>{
      const n=learning.subjectMaterialStats(g.questions.filter(q=>!wrong||q.wrongPeople));
      return mlButton(`<span><strong>${esc(g.name)}</strong><small>${n.people}人有判定 · ${n.questions}道题${wrong?'有误':' · 答对'+n.correct+'/'+n.attempts+'题次'}</small></span><b>${wrong?n.bad+'人答错':'查看题目'} ›</b>`,{kind:'list',knowledge:g.name,onlyWrong:wrong},'ml-knowledge-row');
    }).join('');
  }
  function renderMaterialHome() {
    if(!learningClasses().length)return mlEmpty('暂无可查看的任教学情');
    const days=subjectPeriod==='1d'?1:7,v=mlModel(days);
    return '<div class="ml-learning ml-home"><div class="ml-home-period"><span class="ml-date">'+periodDates(subjectPeriod).replaceAll('2026-','')+'</span><div class="ml-period">'+[1,7].map(d=>`<button class="${d===days?'ml-on':''}" onclick="workbenchPrototype.subjectPeriod('${d}d')">${d===1?'今天':'近7天'}</button>`).join('')+'</div></div>'+mlCard('<div class="ml-card-head"><h2 class="ml-rail">班级错题</h2>'+mlButton('查看全部 ›',{kind:'list',onlyWrong:true},'ml-link')+'</div>'+mlKnowledge(v,true)+mlUnknown(v,true)+(!v.stats.wrongQuestions?mlEmpty(v.stats.pending?'已有作答，结果待复核':'当前时段暂无已判定错题'):''))+mlCard('<div class="ml-card-head"><h2>学科作答概况</h2></div>'+mlMetrics(v)+mlButton('<span>阶段回顾<small>按作业、练习或知识点查看</small></span><b>按阶段查看 ›</b>',{kind:'stage',mode:'source'})+'<button class="ml-entry" onclick="workbenchPrototype.tab(\'students\')"><span>学生学情</span><b>'+v.enrolled+'人 ›</b></button>')+'</div>';
  }
  function mlSources(v) { return v.sources.map(s=>mlButton(`<div class="ml-source-top"><span class="ml-source-icon">${s.kind==='上传资料'?'▤':'✎'}</span><strong>${esc(s.name)}</strong><span class="ml-chevron">›</span></div><div class="ml-sub">${esc(s.date.slice(5))} · ${esc(s.kind)}</div><div class="ml-source-stats"><span>${s.stats.questions}道题有判定</span><b>${s.stats.wrongQuestions}道有误 · ${s.stats.bad}人答错</b></div>${s.stats.questions>s.stats.linked?'<div class="ml-quiet">'+(s.stats.questions-s.stats.linked)+'道题的知识点暂未明确</div>':''}${!s.stats.questions&&s.stats.pending?'<div class="ml-quiet">结果待复核，暂不统计对错</div>':''}`,{kind:'list',sourceId:s.id},'ml-source-row')).join(''); }
  function mlQuestionCard(q) { return '<section class="ml-question-card"><div class="ml-q-label"><span>'+esc(q.title)+'</span><span class="ml-tag">'+esc(q.knowledge||'知识点暂未明确')+'</span></div><p class="ml-q-stem">'+esc(q.stem)+'</p><div class="ml-q-foot"><span>'+q.people+'人有判定 · <strong>'+q.wrongPeople+'人答错</strong></span>'+mlButton('查看学生 ›',{kind:'question',qid:q.id},'ml-link')+'</div>'+(q.pendingPeople?'<div class="ml-quiet">'+q.pendingPeople+'人待复核，未计入对错人数</div>':'')+'</section>'; }
  function mlStudentMatches(q) { const b=issueBrowse;return q.allStudents.filter(s=>(b.result==='all'||b.result==='wrong'&&s.wrong||b.result==='correct'&&s.chains.length&&!s.wrong||b.result==='pending'&&s.pendingAttempts.length)&&s.name.includes(b.search)&&(b.correction==='all'||s.status===b.correction)); }
  function mlPairs(s) {
    return s.chains.map(c=>'<div class="ml-answer-pair"><div><small>'+esc(c.date.slice(5)+' '+c.time)+' · 作答</small><b class="'+(c.correct?'ml-good':'')+'">'+esc(c.answer)+'</b><span>'+(c.correct?'答对':'答错')+'</span></div><span class="ml-arrow">→</span><div><small>'+(c.latest?esc(c.latest.date.slice(5)+' '+c.latest.time)+' · 订正':'订正')+'</small><b class="'+(c.latest?.correct?'ml-good':'')+'">'+esc(c.latest?.answer||'—')+'</b><span>'+(c.latest?(c.latest.correct?'本次答对':'本次仍错'):'暂无订正记录')+'</span></div></div>'+(c.corrections.length>1?'<details class="lr-correction-history"><summary>查看全部 '+c.corrections.length+' 次订正</summary>'+c.corrections.map((x,i)=>attemptBlock('第'+(i+1)+'次订正',x)).join('')+'</details>':'')).join('')+s.pendingAttempts.map(p=>'<div class="ml-reference">'+esc(p.date+' '+p.time)+' · 待复核<br>'+esc(p.answer)+'<br>不计入对错</div>').join('');
  }
  function mlStudentRows(q) { const b=issueBrowse;return mlStudentMatches(q).map(s=>'<div class="ml-student-row"><button class="ml-student-toggle" onclick="workbenchPrototype.materialExpand(\''+s.id+'\')"><span><strong>'+esc(s.name)+'</strong><small>'+esc(s.date.slice(5))+' · '+(s.chains.length?(s.wrong?'答错':'答对'):'待复核')+'</small></span><span class="ml-student-right"><span class="ml-tag ml-'+s.status+'">'+s.statusLabel+'</span><i>'+(b.expanded.includes(s.id)?'⌃':'⌄')+'</i></span></button>'+(b.expanded.includes(s.id)?mlPairs(s)+'<button class="ml-student-personal" onclick="workbenchPrototype.student(\''+s.id+'\')">查看'+esc(s.name)+'个人学情 ›</button>':'')+'</div>').join('')||mlEmpty('没有符合条件的学生'); }
  function renderMaterialBrowse() {
    const b=issueBrowse,r=b.materialRoute,v=mlModel(b.reviewDays,r),n=v.stats;
    let body=mlContext(b.reviewDays);
    if(r.kind==='stage') {
      body='<div class="ml-context">'+esc(scopeName()+' · '+subjectName())+'</div><div class="ml-period">'+[1,7,14,30].map(d=>`<button class="${d===b.reviewDays?'ml-on':''}" onclick="workbenchPrototype.setReviewDays(${d})">${d===1?'今天':'近'+d+'天'}</button>`).join('')+'</div><div class="ml-date">'+periodDates(b.reviewDays+'d')+'</div>';
      body+=mlCard('<div class="ml-card-head"><h2>阶段作答概况</h2></div>'+mlMetrics(v)+'<div class="ml-mini-line">答对 '+n.correct+' 题次 · 答错 '+n.wrongAttempts+' 题次</div><div class="ml-coverage"><p>'+(n.questions?n.questions+'道题中，'+n.linked+'道已明确知识点，'+(n.questions-n.linked)+'道暂未明确。':'当前时段暂无有判定的题目。')+'</p>'+(n.questions>n.linked?mlButton('查看这'+(n.questions-n.linked)+'道题 ›',{kind:'list',unknown:true},'ml-coverage-action'):'')+'</div>'+(n.pending?'<div class="ml-quiet">另有 '+n.pending+' 条作答待复核，未计入以上结果</div>':''));
      body+='<div class="ml-view-tabs">'+[['source','作业与练习'],['knowledge','知识点']].map(([k,t])=>'<button class="'+(r.mode===k?'ml-on':'')+'" onclick="workbenchPrototype.materialMode(\''+k+'\')">'+t+'</button>').join('')+'</div>';
      body+=r.mode==='knowledge'?mlCard('<div class="ml-card-head"><h2>知识点情况</h2><span class="ml-sub">覆盖 '+n.linked+'/'+n.questions+' 道题</span></div><div class="ml-quiet">仅统计知识点已明确的题目</div>'+mlUnknown(v)+mlKnowledge(v)+(!n.linked?mlEmpty('暂无可分析的知识点结果，可按作业与练习查看题目'):'')):mlCard(mlSources(v)||mlEmpty('当前时段暂无作答记录'));
      body+=mlCard('<button class="ml-entry" onclick="workbenchPrototype.openStageRoster()"><span>查看本阶段学生学情</span><b>'+v.enrolled+'人 ›</b></button>');
    } else if(r.kind==='list') {
      if(r.sourceId){const s=v.matches[0]?.source,t=v.selectionStats;body+=mlCard('<h2>'+esc(s?.name||'作业与练习')+'</h2><p class="ml-sub">'+esc(s?.kind||'')+' · '+esc(s?.date||'')+'</p><div class="ml-mini-line">'+t.questions+'道题有判定 · '+t.wrongQuestions+'道有误 · '+t.bad+'人答错</div>');}
      body+='<div class="ml-result-tabs ml-question-tabs">'+[[false,'全部 '+v.matches.length],[true,'有学生答错 '+v.selectionStats.wrongQuestions]].map(([w,t])=>'<button class="'+(!!r.onlyWrong===w?'ml-on':'')+'" onclick="workbenchPrototype.materialOnlyWrong('+w+')">'+t+'</button>').join('')+'</div>';
      body+=v.sources.map(s=>(r.sourceId?'':'<div class="ml-list-heading"><b>'+esc(s.name)+'</b><span>'+esc(s.date.slice(5))+' · '+s.questions.length+'道</span></div>')+s.questions.map(mlQuestionCard).join('')).join('')||mlEmpty('当前范围暂无题目');
    } else {
      const q=v.questions.find(q=>q.id===r.qid);if(!q)return '<div class="ml-learning">'+mlEmpty('当前时段暂无本题作答')+'</div>';
      body='<div class="ml-sticky-context"><button onclick="workbenchPrototype.materialTop()">查看原题 ↑</button><strong>'+esc(q.source.name+' · '+q.title)+'</strong><span>'+q.people+'人有判定 · '+q.wrongPeople+'人答错 · '+q.pendingPeople+'人待复核</span></div>'+body;
      body+=mlCard('<div class="ml-q-label"><span>'+esc(q.title)+'</span><span class="ml-tag">'+esc(q.source.kind)+'</span></div><div class="ml-sub">'+esc(q.source.name)+'</div><p class="ml-q-stem">'+esc(q.stem)+'</p><div class="ml-q-meta"><span class="ml-tag">'+esc(q.knowledge||'知识点暂未明确')+'</span></div><div class="ml-reference">参考答案　'+esc(q.reference)+'</div>');
      body+=mlCard('<div class="ml-counts-row"><div><strong>'+q.people+'</strong><span>人有有效判定</span></div><div class="ml-amber"><strong>'+q.wrongPeople+'</strong><span>人答错</span></div><div><strong>'+q.pendingPeople+'</strong><span>人待复核</span></div></div><div class="ml-quiet">待复核不计入对错；答错学生中'+q.students.filter(s=>s.wrong&&s.hasCorrection).length+'人有订正记录。</div>');
      body+=mlCard('<div class="ml-card-head"><h2>学生作答</h2><span class="ml-sub">点姓名展开</span></div><div class="ml-result-tabs">'+[['wrong','答错',q.wrongPeople],['correct','答对',q.correctPeople],['pending','待复核',q.pendingPeople],['all','全部',q.allStudents.length]].map(([k,t,n])=>'<button class="'+(b.result===k?'ml-on':'')+'" onclick="workbenchPrototype.materialResult(\''+k+'\')">'+t+' '+n+'</button>').join('')+'</div><input class="ml-search" aria-label="按姓名查找本题学生" placeholder="按姓名查找学生" value="'+esc(b.search)+'" oninput="workbenchPrototype.materialSearch(this.value)"><div class="ml-filter-line"><span class="ml-visible-count">当前显示 '+mlStudentMatches(q).length+' 人</span><select aria-label="订正状态" onchange="workbenchPrototype.materialCorrection(this.value)">'+[['all','全部订正状态'],['missing','暂无订正'],['fixed','订正答对'],['still','订正仍错']].map(([k,t])=>'<option value="'+k+'" '+(k===b.correction?'selected':'')+'>'+t+'</option>').join('')+'</select></div><div class="ml-student-list">'+mlStudentRows(q)+'</div>');
    }
    return '<div class="ml-learning">'+body+'</div>';
  }
  function mlRefresh(keep=false){const p=document.getElementById('teacher-tab-panel'),y=keep?p?.scrollTop||0:0;refresh();if(p)p.scrollTop=y;}

  const personalScope = () => learning.personalLearningReport(report(state.studentId,'30d'), personalRange || learning.personalLearningRange(state.studentPeriod));
  function personalView() { return learning.personalLearningView(report(state.studentId,'30d'),state.studentId,personalRange || learning.personalLearningRange(state.studentPeriod),personalFilter,personalTopic); }
  function personalPair(chain) {
    const last=chain.latest;
    return '<div class="pl-pair"><div><small>'+esc(chain.date.slice(5)+' '+chain.time)+' 作答</small><strong class="'+(chain.answer.length>12?'pl-long':'')+'">'+esc(chain.answer)+'</strong><span>'+(chain.correct?'答对':'答错')+'</span></div><span class="pl-arrow">→</span><div><small>'+(last?esc(last.date.slice(5)+' '+last.time)+' 订正':'订正')+'</small><strong class="'+(last?.correct?'pl-fixed ':'')+(last?.answer.length>12?'pl-long':'')+'">'+(last?esc(last.answer):'—')+'</strong><span>'+(last?last.correct?'本次答对':'本次仍错':'暂无记录')+'</span></div></div>';
  }
  function personalDateSheet() {
    if(!personalDatesOpen)return '';
    return '<div class="pl-date-mask" onclick="workbenchPrototype.closePersonalDates()"><section class="pl-sheet" role="dialog" aria-modal="true" aria-label="选择查看时段" onclick="event.stopPropagation()"><div class="pl-handle"></div><div class="pl-sheet-head"><h2>选择查看时段</h2><button aria-label="关闭日期选择" onclick="workbenchPrototype.closePersonalDates()">×</button></div><p>总览、知识点、题目和活动将同步切换。</p><div class="pl-date-field"><label for="personal-start">开始日期</label><input id="personal-start" type="date" min="'+learning.learningReportDays[29]+'" max="'+learning.learningReportDays[0]+'" value="'+personalDraftStart+'" oninput="workbenchPrototype.personalDraft(\'start\',this.value)"></div><div class="pl-date-field"><label for="personal-end">结束日期</label><input id="personal-end" type="date" min="'+learning.learningReportDays[29]+'" max="'+learning.learningReportDays[0]+'" value="'+personalDraftEnd+'" oninput="workbenchPrototype.personalDraft(\'end\',this.value)"></div><div class="pl-validation" role="status">'+esc(personalDateError)+'</div><button class="pl-apply" onclick="workbenchPrototype.applyPersonalDates()">查看所选时段</button></section></div>';
  }
  function renderSubjectStudent(detail, student) {
    const v=personalView(),c=v.summary,range=v.range,complete=v.complete;
    const title=range.start+' 至 '+range.end;
    const metric=(key,value,label,cls='')=>'<button class="pl-metric '+cls+'" onclick="workbenchPrototype.personalQuestionFilter(\''+key+'\',true)"><strong>'+value+'<em>道</em></strong><span>'+label+'<i>›</i></span></button>';
    const questionRows=v.visible.map(q=>{
      const person=q.students[0],expanded=personalExpanded.includes(q.id);
      return '<details class="pl-qrow" data-personal-question="'+esc(q.id)+'" '+(expanded?'open':'')+' ontoggle="workbenchPrototype.personalRememberQuestion(\''+q.id+'\',this.open)"><summary><span class="pl-qhead"><b>'+esc(q.knowledge||'知识点暂未明确')+'</b><span class="pl-tag '+(person.status==='fixed'?'pl-fixed':'')+'">'+esc(person.statusLabel)+' ⌄</span></span><span class="pl-qstem">'+esc(q.stem)+'</span></summary><small>'+esc(person.date)+' · '+(person.wrong?'答错':'答对')+'</small>'+person.chains.map((chain,index)=>(person.chains.length>1?'<p class="pl-subline">作答记录 '+(index+1)+'</p>':'')+personalPair(chain)+(chain.corrections.length>1?'<details class="pl-history"><summary>全部 '+chain.corrections.length+' 次订正</summary>'+chain.corrections.map(r=>'<p>'+esc(r.date+' '+r.time)+' · '+esc(r.answer)+' · '+(r.correct?'答对':'仍错')+'</p>').join('')+'</details>':'')).join('')+'<div class="pl-reference">参考答案　'+esc(q.reference)+'</div></details>';
    }).join('');
    return '<div class="pl-personal"><div class="pl-compact"><strong>'+esc(student.name+' · '+student.className+' · '+subjectName())+'</strong><button onclick="workbenchPrototype.personalToTop()">'+v.label+' ⌃</button><p>'+title+'</p></div><div class="pl-identity"><div class="pl-avatar">'+esc(student.name.slice(0,1))+'</div><div><h2>'+esc(student.name)+'</h2><small>'+esc(student.className)+'</small></div><span class="pl-subject">'+esc(subjectName())+'</span></div><div class="pl-range-control"><div class="pl-seg">'+[['7d','近7天'],['30d','近30天'],['term','本学期'],['custom','自选日期']].map(([key,label])=>'<button class="'+(range.mode===key||(key==='custom'&&['1d','14d'].includes(range.mode))?'pl-active':'')+'" onclick="workbenchPrototype.personalMode(\''+key+'\')">'+label+'</button>').join('')+'</div><div class="pl-period-caption">'+title+'</div></div>'+
      (!complete?'<div class="pl-demo-notice">当前只有 '+learning.learningReportDays[29]+' 至 '+learning.learningReportDays[0]+' 的记录，暂不生成完整学期结论。</div>':'')+
      '<section class="pl-card"><div class="pl-section-head"><h2 class="pl-rail">时段总览</h2><small>'+v.label+'</small></div><p class="pl-subline">'+(complete?'练过 '+c.totalCount+' 道题 · 涉及 '+v.topics.length+' 个知识点':'当前尚无完整学期统计')+'</p><div class="pl-metrics">'+metric('correct',complete?c.correctCount:'—','答对')+metric('wrong',complete?c.wrongCount:'—','答错','pl-wrong')+metric('corrected',complete?c.correctedCount:'—','已订正','pl-corrected')+'</div><div class="pl-micro-note">订正单独统计，不抵扣答错题数。</div></section>'+
      (v.unknownCount?'<div class="pl-topic-help">其中 '+v.unknownCount+' 道题的知识点暂未明确，已计入总览。</div>':'')+'<section class="pl-card"><div class="pl-section-head"><h2>知识点情况</h2><small>全部练过的知识点</small></div>'+(v.topics.length?'<table class="pl-knowledge-table"><thead><tr><th>知识点</th><th>答对</th><th>答错</th><th>已订正</th><th></th></tr></thead><tbody>'+v.topics.map((t,i)=>'<tr tabindex="0" class="pl-data-row" onclick="workbenchPrototype.personalKnowledge('+i+',true)" onkeydown="if(event.key===\'Enter\')workbenchPrototype.personalKnowledge('+i+',true)"><td>'+esc(t.name)+'</td><td>'+t.correct+'</td><td class="pl-wrong-number">'+t.wrong+'</td><td class="pl-fixed-number">'+t.corrected+'</td><td>›</td></tr>').join('')+'</tbody></table><div class="pl-topic-help">数量单位：道 · 点知识点查看对应题目</div>':'<div class="pl-empty">'+(complete?(v.unknownCount?'已有作答结果，知识点暂未明确':'这个时段暂无作答记录'):'完整学期数据暂缺')+'</div>')+'</section>'+
      '<section class="pl-card" id="personal-questions"><div class="pl-section-head"><h2>题目与作答</h2><small>'+v.visible.length+' 道题</small></div><div class="pl-q-tabs">'+[['all','全部'],['correct','答对'],['wrong','答错'],['corrected','已订正']].map(([key,label])=>'<button class="'+(key===personalFilter?'pl-active':'')+'" onclick="workbenchPrototype.personalQuestionFilter(\''+key+'\')">'+label+' '+v.counts[key]+'</button>').join('')+'</div><div class="pl-topic-select"><span>知识点</span><select aria-label="筛选知识点" onchange="workbenchPrototype.personalKnowledge(Number(this.value))">'+v.topicOptions.map((t,i)=>'<option value="'+(i-1)+'" '+((i===0?v.selectedTopic==='all':v.selectedTopic===t)?'selected':'')+'>'+esc(t)+'</option>').join('')+'</select></div>'+(questionRows||'<div class="pl-empty">'+(complete?'这个时段暂无'+({all:'作答',correct:'答对',wrong:'答错',corrected:'订正'}[personalFilter])+'记录':'完整学期数据暂缺')+'</div>')+'</section>'+
      '<section class="pl-card"><details class="pl-activities"><summary>其他学习活动 · '+(complete?v.activities.length:'—')+' 项</summary>'+v.activities.map(a=>'<button class="pl-activity" onclick="workbenchPrototype.activity(\''+a.id+'\')"><span>'+esc(a.date+' · '+a.feature)+'</span><b>查看 ›</b></button>').join('')+'</details></section>'+personalDateSheet()+'</div>';
  }

  function renderIssueBrowse() {
    if (state.view === 'subject' && issueBrowse.modern) return renderSubjectBrowse();
    const { issues, groups, groupIndex, mode, selected } = issueBrowse;
    const context = `<p class="lr-preview-muted">${esc([scopeName(), issueBrowse.subject || rosterSubject || subjectName()].join(' · '))}</p>`;
    const date = issueBrowse.reviewDays === 1 ? learning.learningReportDays[0] : issueBrowse.practiceList ? learning.learningReportDays[issueBrowse.practiceDays - 1] + ' 至 ' + learning.learningReportDays[0] : issueBrowse.reviewDays
      ? learning.learningReportDays[issueBrowse.reviewDays - 1] + ' 至 ' + learning.learningReportDays[0]
      : learning.learningReportDays[issueBrowse.practiceDay ?? state.day];
    const filters = issueBrowse.reviewDays && !issueBrowse.recent && !issueBrowse.subject && groupIndex === null ? `<div class="lr-preview-tabs">${[1,7,14,30].map(days =>
      chip(days === 1 ? '今天' : '近 '+days+' 天', `setReviewDays(${days})`, days === issueBrowse.reviewDays)
    ).join('')}</div>` : '';
    const range = `<p class="lr-preview-muted">${esc(date)}</p>`;
    if (issueBrowse.reviewFollowup) {
      const week = weekReport();
      const pair = week?.repeated.find(item => item.studentId === issueBrowse.reviewStudent);
      if (pair) {
        const answers = [pair.before, pair.after].map(item => reportCard(esc(item.date),
          `<p>${esc(item.stem)}</p><p>首答　${esc(item.answer)}</p><p>${esc([item.step, item.result].filter(Boolean).join(' · '))}</p>`
        )).join('');
        return context + reportCard(esc(pair.name) + ' · 两次作答', `<p>${esc(week.label)}</p>`) + answers;
      }
      return context + reportCard('两次都有误的学生', (week?.repeated || []).map(item =>
        reportLink(esc(item.name), `openReviewFollowup('${item.studentId}')`, '两次作答')
      ).join(''));
    }
    if (issueBrowse.practiceList) {
      const scope = report('all','30d');
      const period = `<div class="lr-preview-tabs">${[7,14,30].map(days =>
        chip('近 '+days+' 天', `setPracticeDays(${days})`, days === issueBrowse.practiceDays)
      ).join('')}</div>`;
      return context + period + range + reportCard('按日期查看班级错题',
        practiceDayLinks(scope, practiceDays(scope).filter(day => day < issueBrowse.practiceDays)) || '<p>暂无首次作答记录</p>');
    }
    if (selected !== null) {
      const issue = issues[selected];
      if (state.view === 'subject') {
        const groups = issue.answerGroups.map((group, index) => {
          const sample = group.students.find(student => student.answer !== '原始作答暂缺');
          const content = `<strong>${esc(group.label)}</strong>${sample ? `<small>首答示例　${esc(sample.answer)}</small>` : ''}`;
          return reportLink(content, `dayEvidence('affected', ${index})`, group.students.length + ' 人');
        }).join('');
        const step = issue.checkType === 'step' ? `<p class="lr-preview-muted">${issue.judged} 人有步骤判定，${issue.wrong} 人该步骤有误</p>` : '';
        return context + `<p class="lr-preview-muted">${esc(issue.date)}</p>` +
          reportCard(esc(issue.knowledge), `<p>${esc(issue.stem)}</p><p>检查项　${esc(issue.checkName)}</p><p><strong>${issue.answered} 人首答 · ${issue.wholeWrong} 人整题答错</strong></p>${step}<p>参考答案　${esc(issue.reference)}</p>`) +
          (groups ? reportCard('按判定查看学生', groups) : '');
      }
      return context + `<p class="lr-preview-muted">${esc(issue.date)}</p>` + reportCard(esc(issue.knowledge), `<p>${esc(issue.stem)}</p><p>检查项：${esc(issue.checkName)}</p><p>${esc(issue.checkLabel)} · ${issue.judged} 人有判定结果，${issue.wrong} 人有误</p><p>参考答案：${esc(issue.reference)}</p>${issue.representative ? `<p>作答示例：${esc(issue.representative.answer)}</p>` : ''}` +
        reportLink(`查看 ${issue.wrong} 名有误学生`, "dayEvidence('affected')"));
    }
    const questionLinks = (rows, highlightFirst = false) => rows.map((issue, index) => {
      const title = `<strong>${esc(issue.stem)}</strong>`;
      const datePrefix = issueBrowse.reviewDays ? esc(issue.date) + ' · ' : '';
      const detail = state.view === 'subject'
        ? `${issue.answered} 人首答 · ${issue.wholeWrong} 人整题答错`
        : `${esc(issue.checkName)} · ${esc(issue.checkLabel)} · ${issue.wrong}/${issue.judged} 人有误`;
      const featured = highlightFirst && index === 0 && issue.wholeWrong > 0;
      const label = featured ? `<small class="lr-preview-featured-label">重点题</small>${title}` : title;
      const button = reportLink(label + `<small>${datePrefix}${detail}</small>`, `openIssue(${issues.indexOf(issue)})`);
      return featured ? `<div class="lr-preview-featured-question">${button}</div>` : button;
    }).join('');
    if (groupIndex !== null) {
      const group = groups[groupIndex];
      let summary = '';
      if (issueBrowse.reviewDays) {
        const wrongQuestions = new Map();
        for (const issue of group.issues) {
          for (const student of issue.students) {
            const questions = wrongQuestions.get(student.studentId) || new Set();
            questions.add(issue.questionId);
            wrongQuestions.set(student.studentId, questions);
          }
        }
        const questionCount = new Set(group.issues.map(issue => issue.questionId)).size;
        const repeated = [...wrongQuestions.values()].filter(questions => questions.size > 1).length;
        summary = `<p>${questionCount} 道题有误，涉及 ${group.people.size} 人。${repeated ? '其中 '+repeated+' 人在至少两道题上有误。' : ''}</p>`;
      }
      const highlight = state.view === 'subject' && !issueBrowse.reviewDays;
      const ordered = highlight ? learning.rankReportQuestions(group.issues) : group.issues;
      return context + range + reportCard(esc(state.view === 'subject' ? group.knowledge : group.name), summary + questionLinks(ordered, highlight));
    }
    if (issueBrowse.reviewDays) {
      const week = state.view === 'subject' && !issueBrowse.recent && issueBrowse.reviewDays >= 7 ? weekReport() : null;
      return context + filters + range + reportCard('按知识点查看有误题目',
        issueGroupLinks(groups, index => `openIssueGroup(${index})`, state.view !== 'subject') || '<p>所选区间暂无有误题目</p>') +
        (week ? reportCard('近 7 天 · 两次可比作答',
          `<p>${esc(week.label)} · ${week.size} 名学生两次均有判定</p><p>${esc(week.beforeDate)} · ${week.beforeWrong} 人有误<br>${esc(week.afterDate)} · ${week.afterWrong} 人有误</p>` +
          (week.repeated.length ? reportLink('查看两次都有误的学生', 'openReviewFollowup()', week.repeated.length + ' 人') : '')) : '');
    }
    const tabs = `<div class="lr-preview-tabs">${chip('按知识点',"issueMode('knowledge')",mode==='knowledge')}${chip('按题看',"issueMode('question')",mode==='question')}</div>`;
    const body = mode === 'question' ? questionLinks(issues) : issueGroupLinks(groups, index => `openIssueGroup(${index})`, state.view !== 'subject');
    const availableDates = state.view === 'subject' && !issueBrowse.fromPracticeList ? practiceDays(report('all','30d')) : [];
    const dateControl = availableDates.length > 1
      ? `<div class="lr-preview-date"><strong>作答日期</strong><select aria-label="作答日期" onchange="workbenchPrototype.changeIssueDate(Number(this.value))">${availableDates.map(day =>
        `<option value="${day}" ${day === issueBrowse.practiceDay ? 'selected' : ''}>${esc(learning.learningReportDays[day])}</option>`
      ).join('')}</select></div>` : range;
    return context + dateControl + tabs + reportCard('当天错题', body || '<p>该日期暂无错题记录</p>');
  }
  function renderFocusPage() {
    const { focus, scope, context, group } = focusPage;
    const list = group?.students || focus.students;
    const question = learning.getLearningQuestion(focus.questionId);
    const row = list.find(item => item.studentId === focusStudentId);
    const contextLine = `<p class="lr-preview-muted">${esc(context)}</p>`;
    const check = `<p>检查项：${esc(focus.checkName)}</p>`;
    if (!row) {
      const students = list.map(item => reportLink(
        `<strong>${esc(item.name)}</strong><small>首次作答：${esc(item.answer)}</small><small>${esc(group ? [item.step, item.result].filter(Boolean).join(' · ') : focus.finding)}</small>`,
        `openFocusStudent('${item.studentId}')`
      )).join('');
      const summary = group ? `${focus.answered} 人首答 · ${focus.wholeWrong} 人整题答错` : `${focus.judged} 人有判定结果，其中 ${focus.wrong} 人有误。`;
      return contextLine + reportCard('本题与检查项',
        `<p>${esc(focus.stem)}</p>${check}<p>${summary}</p>`
      ) + reportCard(`${esc(group?.label || '有误学生')} · ${list.length} 人`, students);
    }
    const corrections = scope.answers.filter(item => item.kind === '订正' && item.originalAttemptId === row.id && item.studentId === row.studentId && item.questionId === row.questionId);
    const evidence = corrections.flatMap(item => {
      const activity = scope.activities.find(record => record.id === item.activityId);
      return activity ? [learning.reportAttemptEvidence(item, activity)] : [];
    }).sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
    const correction = evidence.length ? evidence.map(item =>
      `<div class="lr-preview-evidence"><p>${esc(item.date)} ${esc(item.time)} · ${esc(item.result)}</p><p>${esc(item.answer)}</p></div>`
    ).join('') : '<p>暂无订正记录</p>';
    return contextLine + reportCard(esc(row.name), `<p>${esc(focus.stem)}</p>${check}`) +
      reportCard('首次作答', `<p>${esc(row.answer)}</p>${row.step ? `<p>检查项判定　${esc(row.step)}</p>` : ''}<p>整题判定：${esc(row.result)}</p><p>参考答案：${esc(question?.answer || '参考答案暂缺')}</p>`) +
      reportCard('订正记录', correction) +
      reportCard('更多学习记录', reportLink('查看个人学情', `student('${row.studentId}')`));
  }
  const renderLearning = () => {
    if (focusPage && !state.studentId) {
      return `${header('learning', '学情')}${renderFocusPage()}</div>`;
    }
    if (issueBrowse && !state.studentId) return `${header('learning', '学情')}${renderIssueBrowse()}</div>`;
    if (state.view === 'subject' && !learningClasses().some(row => row.id === state.classId)) {
      state.classId = learningClasses()[0]?.id ?? '';
    }
    if (state.view === 'subject') normalizeSubject();
    const rosterPeriod = rosterPeriodOverride || (state.view === 'homeroom' && state.tab === 'students' && rosterFrom === 'week' ? '7d' : state.view === 'subject' ? subjectPeriod : state.period);
    const result = report('all', rosterPeriod); const first = result.answers.filter(item => item.kind === '首次');
    const title = state.view === 'school' ? '学校学情' : state.view === 'homeroom' ? '班级学情' : '学科学情';
    let body = '';
    if (state.studentId) {
      const student = roster.getDemoStudent(state.studentId);
      const detail = report(state.studentId,state.studentPeriod), summary = learning.getStudentLearning(detail, state.studentId);
      const pair=state.view==='subject' ? learning.reportWeeklyComparison(detail)?.pairs[0] : null;
      body = `<p class="lr-preview-muted">${esc(student.className)} · ${esc(subjectName())} · 演示数据</p><p class="lr-preview-muted">${periodDates(state.studentPeriod)}</p><div class="lr-preview-tabs">${state.view === 'subject' ? chip('今天',"studentPeriod('1d')",state.studentPeriod==='1d') : ''}${chip('近 7 天',"studentPeriod('7d')",state.studentPeriod==='7d')}${state.view === 'subject' ? chip('近 14 天',"studentPeriod('14d')",state.studentPeriod==='14d') : ''}${chip('近 30 天',"studentPeriod('30d')",state.studentPeriod==='30d')}</div>`+
        reportCard(student.name+'的学习情况',reportMetrics([[detail.activities.length+' 项','学习活动'],...(state.view==='subject'?[[`${summary.firstCount-summary.firstWrong} / ${summary.firstCount}`,'首次答对题次']]:[]),[summary.days+' 天','有学习记录']]),true)+
        learning.reportSubjects(detail).map(row=>reportCard(esc(row.subject)+' · 学过的内容',`<p>${esc(row.contents)}</p>${row.corrections?`<p>订正答对 ${row.correctionCorrect} / ${row.corrections} 次</p>`:''}`)).join('')+
        (pair?reportCard('两次作答对照',`<p>${esc(pair.before.step)} → ${esc(pair.after.step)}</p>`+reportLink('查看两次作答',`pair('${state.studentId}')`)):'')+
        timeline(detail);
      if (state.view === 'subject') body = renderSubjectStudent(detail,student);
    } else if (state.view === 'school') {
      body = renderSchool(result);
    } else if (state.view === 'homeroom' && ['overview','week'].includes(state.tab)) {
      const weekly = state.tab === 'week';
      const tabs = state.followup ? '' : `<div class="lr-preview-tabs">${chip('班级总览',"tab('overview')",!weekly)}${chip('周报',"tab('week')",weekly)}</div>`;
      body = tabs + `<p class="lr-preview-muted">${esc(scopeName())} · 全科 · 演示数据</p>` +
        renderHomeroom(weekly ? report('all','7d') : result, weekly);
    } else if (state.tab === 'overview' || state.tab === 'week') {
      const weekly = state.tab === 'week';
      body = weekly ? renderWeek() : renderOverview();
    } else {
      if (state.tab === 'students') {

        const subjectActivities = result.activities.filter(item => item.subject === rosterSubject);
        const subjectLearners = new Set(subjectActivities.map(item => item.studentId));
        const learners = rosterSubject ? subjectLearners : result.learnedIds;
        const students = result.roster.filter(item =>
          rosterFilter === 'all' || (rosterFilter === 'wrong' ? learning.subjectStudentCounts(result,item.id).wrongCount>0 : learners.has(item.id) === (rosterFilter === 'recorded')));
        const scopeLabel = isHomeroomRoster() ? esc(scopeName()) : rosterSubject ? esc(rosterSubject)+' · 学生名册' : rosterFilter === 'missing' ? '暂无学伴记录' : state.view === 'subject' ? esc(scopeName() + ' · ' + subjectName()) : '全班学生';
        const sourceCounts = new Map();
        for (const item of subjectActivities) sourceCounts.set(item.feature,(sourceCounts.get(item.feature) || 0)+1);
        const sourceLine = sourceCounts.size ? `<p class="lr-preview-muted">记录来源：${[...sourceCounts].map(([name,count]) => esc(name)+' '+count+' 项').join(' · ')}</p>` : '';
        const rosterFilters = state.view === 'subject' ? `<div class="lr-preview-tabs">${chip('全班 '+result.roster.length,"filterRoster('all')",rosterFilter==='all')}${chip('答错学生 '+new Set(first.filter(r=>!r.correct).map(r=>r.studentId)).size,"filterRoster('wrong')",rosterFilter==='wrong')}</div>` : rosterSubject ? `<div class="lr-preview-tabs">${[['all','全部'],['recorded','有记录'],['missing','暂无记录']].map(([id,label]) =>
          chip(label, `filterRoster('${id}')`, rosterFilter===id)).join('')}</div>` : '';
        const lastRecords = rosterFilter === 'missing' ? learning.timelineRows(report('all','30d')).filter(item => !rosterSubject || item.subject === rosterSubject) : [];
        const search = '<input type="search" class="lr-roster-search" aria-label="按姓名查找学生" placeholder="按姓名查找学生" value="'+esc(rosterName)+'" oninput="workbenchPrototype.searchRoster(this.value)">';
        const subjectIssues = rosterSubject ? reportLink('查看本学科错题',"openSubjectIssues()") : '';
        const rosterCount = isHomeroomRoster() ? result.roster.length : students.length;
        body += panel(scopeLabel+' · '+rosterCount+' 人',
          `<p class="lr-preview-muted">${periodDates(rosterPeriod)}</p>${sourceLine}${rosterFilters}${search}${subjectIssues}` +
          students.map(item => {
            if (state.view === 'subject') { const c=learning.subjectStudentCounts(result,item.id); return `<button class="lp-list-button lr-subject-student-row" data-roster-name="${esc(item.name)}" style="${item.name.includes(rosterName)?'':'display:none'}" onclick="workbenchPrototype.student('${item.id}')"><span><strong>${esc(item.name)}</strong><small>${c.totalCount ? `答对 ${c.correctCount} 道 · 答错 ${c.wrongCount} 道 · 已订正 ${c.correctedCount} 道` : '所选区间暂无作答记录'}</small></span><b>查看学情 ›</b></button>`; }
            const learned = learners.has(item.id);
            const last = lastRecords.find(row => row.studentId === item.id);
            const lastText = last ? ' · 最近记录 '+last.date+' '+last.subject+'·'+last.feature : rosterFilter === 'missing' ? ' · 近 30 天无记录' : '';
            return `<button class="lp-list-button" data-roster-name="${esc(item.name)}" style="${item.name.includes(rosterName) ? '' : 'display:none'}" onclick="workbenchPrototype.student('${item.id}')"><span><strong>${esc(item.name)}</strong><small>${esc(item.className)} · ${learned ? '有学伴学习记录' : '暂无学伴学习记录'}${esc(lastText)}</small></span><b>查看学情 ›</b></button>`;
          }).join('') + `<p data-roster-empty style="${students.some(item=>item.name.includes(rosterName)) ? 'display:none' : ''}">未找到学生</p>`);
      } else {
        const knowledge = learning.knowledgeRows(result);
        body += `<div class="lp-summary">${stat(first.length,'首次作答题次')}${stat(new Set(first.map(item=>item.studentId)).size,'作答学生')}${stat(new Set(first.filter(item=>!item.correct).map(item=>item.studentId)).size,'首次答错学生')}</div>${panel('知识点与题目',knowledge.map(item=>`<div class="lp-event"><button class="lp-list-button" onclick="workbenchPrototype.knowledge('${item.key}')"><span><strong>${esc(item.subject)} · ${esc(item.knowledge)}</strong><small>${item.students} 人练过 · ${item.questions} 道题 · 首次错误涉及 ${item.wrongPeople} 人</small></span><b>查看 ›</b></button>${state.knowledge===item.key ? [...new Set(first.filter(answer=>`${answer.subject}:${answer.knowledge}`===item.key).map(answer=>answer.questionId))].map(id=>{const rows=first.filter(answer=>answer.questionId===id);return `<button class="lp-evidence-entry" onclick="workbenchPrototype.question('${id}')"><strong>${esc(learning.getLearningQuestion(id)?.stem || '原题暂缺')}</strong><small>${new Set(rows.map(answer=>answer.studentId)).size} 人作答，${new Set(rows.filter(answer=>!answer.correct).map(answer=>answer.studentId)).size} 人首次答错 · 查看原题 ›</small></button>`}).join(''):''}</div>`).join(''))}`;
      }
    }
    return `${header('learning',state.studentId ? `${esc(roster.getDemoStudent(state.studentId)?.name)}的学习记录` : '学情')}${body}${evidenceOverlay(result)}</div>`;
  };
  const renderHomework = () => {
    window.homeworkPrototype?.setScope({ view: state.view, grade: state.grade, classId: state.classId, classIds: classIds(), teacherId: 'teacher-demo-001', teachingAssignments: roster.getDemoTeachingAssignments('teacher-demo-001') });
    return `${header('homework','作业与打卡',window.homeworkPrototype?.getTeacherMode?.() === 'list')}${window.homeworkPrototype?.renderTeacher() || ''}</div>`;
  };
  const refresh = () => {
    if (typeof teacherDesk === 'function') teacherDesk();
    const personalPanel=document.getElementById('teacher-tab-panel'), personalRoot=document.querySelector('.pl-personal');
    const mlRoot=document.querySelector('.ml-learning');if(personalPanel&&mlRoot){const sync=()=>mlRoot.classList.toggle('ml-scrolled',personalPanel.scrollTop>230);personalPanel.addEventListener('scroll',sync,{passive:true});sync();}
    if(personalPanel && personalRoot){const sync=()=>personalRoot.classList.toggle('pl-scrolled',personalPanel.scrollTop>230);personalPanel.addEventListener('scroll',sync,{passive:true});sync();}
    const tabs = document.querySelector('.lr-preview-class-tabs');
    const selected = tabs?.querySelector('[aria-selected="true"]');
    if (selected) {
      const list = tabs.getBoundingClientRect(), item = selected.getBoundingClientRect();
      if (item.left < list.left) tabs.scrollLeft += item.left - list.left;
      else if (item.right > list.right) tabs.scrollLeft += item.right - list.right;
    }
  };
  if (typeof document !== 'undefined') {
    document.addEventListener('click', event => {
      const openMenu = document.querySelector('.wb-role-menu[open]');
      if (openMenu && !openMenu.contains(event.target)) openMenu.open = false;
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        const openMenu = document.querySelector('.wb-role-menu[open]');
        if (openMenu) openMenu.open = false;
      }
    });
  }
  return { renderLearning, renderHomework, getScope: () => ({ ...state, classIds: classIds() }), getGrantedViews: () => [...granted],
    getLearningNavigation() {
      if(state.view==='subject'&&issueBrowse?.materialRoute&&!state.studentId){const r=issueBrowse.materialRoute;return{title:r.kind==='stage'?'阶段回顾':r.kind==='question'?'题目与学生作答':r.unknown?(r.unknownFromMistakes?'其他错题':'其他题目'):r.knowledge|| (r.onlyWrong&&!r.sourceId?'班级错题':'作业题目'),back:true};}
      if (state.view === 'school') {
        return state.classId === 'all' ? { title: '学情', back: false } : { title: '班级学习覆盖', back: true };
      }
      if (state.view !== 'school' && state.tab === 'students' && !state.studentId) {
        return { title: '学生学情', back: true };
      }
      return { title: state.studentId ? '学生个人学情' : focusStudentId ? '学生本题作答' : focusPage ? '本题有误学生' : issueBrowse ? issueBrowse.selected !== null ? (state.view === 'subject' ? '原题与学生作答' : '本题详情') : issueBrowse.groupIndex !== null ? '知识点错题' : issueBrowse.reviewFollowup ? (issueBrowse.reviewStudent ? '学生两次作答' : '两次都有误的学生') : issueBrowse.reviewDays ? issueBrowse.recent ? '班级错题' : issueBrowse.subject ? '各科作答情况' : '知识点回顾' : issueBrowse.practiceList ? '班级错题' : '当天错题与知识点' : state.followup ? '周报跟进名单' : '学情', back: Boolean(state.studentId||state.followup||focusPage||issueBrowse) }; },
    backLearning() {
      if (state.view === 'subject') {
        if (state.studentId && personalDatesOpen) { this.closePersonalDates(); return; }
        if (state.activityId) { this.activity(''); return; }
        if (state.pairId) { this.pair(''); return; }
        if (state.questionId) { this.question(''); return; }
      }
      if (state.view === 'school') { this.class('all'); return; }
      if (state.view !== 'school' && state.tab === 'students' && !state.studentId) {
        if (rosterReturn) { issueBrowse=rosterReturn; rosterReturn=null; rosterPeriodOverride=''; state.tab='overview'; refresh(); const p=document.getElementById('teacher-tab-panel'); if(p)p.scrollTop=rosterOriginScroll; return; }
        this.tab(state.view === 'homeroom' ? rosterFrom : 'overview');
        const panel = document.getElementById('teacher-tab-panel');
        if (state.view === 'subject' && panel) panel.scrollTop = rosterOriginScroll;
        return;
      }
      if (state.view === 'subject' && state.studentId) { this.student(''); return; }
      if(state.view==='subject'&&issueBrowse?.materialRoute){const previous=issueBrowse.materialTrail.pop();const y=previous?.scroll??issueBrowse.overviewScroll;if(previous){const trail=issueBrowse.materialTrail;issueBrowse={...previous,materialTrail:trail};}else issueBrowse=null;refresh();const p=document.getElementById('teacher-tab-panel');if(p)p.scrollTop=y;return;}
      if (!focusPage && issueBrowse) {
        const browse = issueBrowse;
        let position = browse.overviewScroll;
        if (browse.reviewStudent) {
          browse.reviewStudent = '';
          position = browse.reviewStudentScroll;
        } else if (browse.reviewFollowup) {
          browse.reviewFollowup = false;
          position = browse.reviewFollowupScroll;
        } else if (browse.selected !== null) { browse.selected = null; position = browse.questionScroll; }
        else if (browse.groupIndex !== null && !browse.direct) { browse.groupIndex = null; position = browse.groupScroll; }
        else if (browse.fromPracticeList) {
          issueBrowse = browse.fromPracticeList;
          position = browse.practiceListScroll;
        } else issueBrowse = null;
        refresh();
        const panel = document.getElementById('teacher-tab-panel');
        if (panel) panel.scrollTop = position;
        return;
      }
      if (!focusPage) return this.student('');
      if (state.studentId) { this.student(''); return; }
      if (focusStudentId) {
        focusStudentId = '';
        refresh();
        const panel = document.getElementById('teacher-tab-panel');
        if (panel) panel.scrollTop = focusScroll;
        return;
      }
      const overviewScroll = focusPage.overviewScroll;
      focusPage = null;
      refresh();
      const panel = document.getElementById('teacher-tab-panel');
      if (panel) panel.scrollTop = overviewScroll;
    },
    openFocusStudent(id) {
      const students = focusPage?.group?.students || focusPage?.focus.students;
      if (!students?.some(row => row.studentId === id)) return;
      focusScroll = document.getElementById('teacher-tab-panel')?.scrollTop || 0;
      focusStudentId = id;
      refresh();
    },
    navigateLearningHome() { state.tab='overview'; if (state.view==='school') state.classId='all'; clearDetails(); refresh(); },
    demoIdentity(value) { const choices={all:['school','homeroom','subject'],school:['school'],homeroom:['homeroom'],subject:['subject']};if(!choices[value])return;granted=choices[value];state.view=granted[0];state.grade='all';state.classId=state.view==='school'?'all':'c1';state.tab='overview';clearDetails();window.homeworkPrototype?.toTeacherListWithoutRefresh?.();if(typeof stage!=='undefined'&&stage==='teacherDesk'){teacherTab='learning';refresh();} },
    view(value) { if (!granted.includes(value)) return; state.view=value; state.grade='all'; state.classId=value==='school'?'all':'c1'; state.tab='overview'; clearDetails(); window.homeworkPrototype?.toTeacherListWithoutRefresh?.(); refresh(); },
    grade(value) { if (state.view!=='school'||!['all','7','8'].includes(value))return; state.grade=value; state.classId='all'; clearDetails(); refresh(); },
    class(value) { if (value!=='all'&&!classes().some(row=>row.id===value))return;if(value==='all'&&state.view!=='school')return;state.classId=value;clearDetails();refresh(); },
    selectLearningClass(id) {
      if (!isSubjectHome() || !learningClasses().some(row => row.id === id)) return;
      state.classId = id; normalizeSubject(); clearDetails(); refresh();
    },
    subjectPeriod(value) { if (!isSubjectHome() || !['1d','7d'].includes(value)) return; subjectPeriod = value; clearDetails(); refresh(); },
    changeLearningSubject(index) {
      const next = classSubjects()[index];
      if (!isSubjectHome() || !next || next === learningSubject) return;
      learningSubject = next;
      if (!learningClasses().some(row => row.id === state.classId)) state.classId = learningClasses()[0]?.id ?? '';
      clearDetails();
      refresh();
    },
    moveSubjectClass(step) {
      if (!isSubjectHome() || (step !== -1 && step !== 1)) return;
      const options = learningClasses();
      const target = options[options.findIndex(row => row.id === state.classId) + step];
      if (target) this.class(target.id);
    },
    period(value) { if(value!=='7d'&&value!=='30d')return;state.period=value;state.questionId='';state.activityId='';refresh(); },
    tab(value) {
      if (!['overview','students','questions','week'].includes(value) ||
        (value === 'week' && state.view !== 'homeroom') || (state.view === 'school' && value !== 'overview')) return;
      if (isSubjectHome() && value === 'students') rosterOriginScroll = document.getElementById('teacher-tab-panel')?.scrollTop || 0;
      state.tab = value;
      clearDetails();
      refresh();
    },
    ranking(value) { if(value!=='people'&&value!=='count')return;state.rankingBy=value;refresh(); },
    student(id) {
      if (state.view === 'school' || (id && !report().roster.some(row => row.id === id))) return;
      const restore = !id && state.studentId && state.view === 'subject';
      if (id && state.view === 'subject') studentOriginScroll = document.getElementById('teacher-tab-panel')?.scrollTop || 0;
      if (!id && !state.studentId) state.followup = false;
      state.studentId = id;
      state.studentPeriod = state.view === 'subject' ? (id && issueBrowse?.reviewDays ? issueBrowse.reviewDays + 'd' : rosterPeriodOverride || subjectPeriod) : state.view === 'homeroom' && rosterFrom === 'week' ? '7d' : state.period;
      if(id && state.view==='subject'){personalRange=learning.personalLearningRange(state.studentPeriod);personalFilter='all';personalTopic='all';personalExpanded=[];}
      personalDatesOpen=false;
      state.questionId = ''; state.dayQuestion = ''; state.activityId = ''; state.pairId = '';
      refresh();
      const panel = document.getElementById('teacher-tab-panel');
      if (restore && panel) panel.scrollTop = studentOriginScroll;
    },

    personalMode(mode) {
      if(state.view!=='subject'||!state.studentId)return;
      if(mode==='custom'){this.openPersonalDates();return;}
      const next=learning.personalLearningRange(mode);if(!next)return;
      personalRange=next;personalTopic='all';personalFilter='all';personalExpanded=[];personalDatesOpen=false;state.activityId='';state.pairId='';
      if(['1d','7d','14d','30d'].includes(mode))state.studentPeriod=mode;
      refresh();this.personalToTop();
    },
    personalToTop() { if(state.view!=='subject'||!state.studentId)return;const p=document.getElementById('teacher-tab-panel');if(p)p.scrollTop=0; },
    personalPositionQuestions() {
      const p=document.getElementById('teacher-tab-panel'),q=document.getElementById('personal-questions'),root=document.querySelector('.pl-personal');
      if(p&&q&&root){root.style.paddingBottom=Math.max(20,p.clientHeight-q.offsetHeight-140)+'px';p.scrollTop+=q.getBoundingClientRect().top-p.getBoundingClientRect().top-74;}
    },
    personalQuestionFilter(value,resetTopic=false) { if(state.view!=='subject'||!state.studentId||!['all','correct','wrong','corrected'].includes(value))return;personalFilter=value;if(resetTopic)personalTopic='all';personalExpanded=value==='corrected'?personalView().visible.map(q=>q.id):[];refresh();this.personalPositionQuestions(); },
    personalKnowledge(index,reset=false) { if(state.view!=='subject'||!state.studentId)return;const v=personalView();personalTopic=v.topicOptions[index+1]||'all';if(reset)personalFilter='all';personalExpanded=[];refresh();this.personalPositionQuestions(); },
    personalRememberQuestion(id,open) { if(state.view!=='subject'||!state.studentId)return;personalExpanded=personalExpanded.filter(x=>x!==id);if(open)personalExpanded.push(id); },
    openPersonalDates() { if(state.view!=='subject'||!state.studentId)return;const r=personalView().range;personalDraftStart=r.start<learning.learningReportDays[29]?learning.learningReportDays[29]:r.start;personalDraftEnd=r.end;personalDateError='';personalDatesOpen=true;const p=document.getElementById('teacher-tab-panel'),y=p?.scrollTop||0;refresh();const next=document.getElementById('teacher-tab-panel');if(next)next.scrollTop=y; },
    closePersonalDates() { personalDatesOpen=false;const p=document.getElementById('teacher-tab-panel'),y=p?.scrollTop||0;refresh();const next=document.getElementById('teacher-tab-panel');if(next)next.scrollTop=y; },
    personalDraft(key,value) { if(!personalDatesOpen)return;if(key==='start')personalDraftStart=value;else if(key==='end')personalDraftEnd=value; },
    applyPersonalDates() { if(state.view!=='subject'||!state.studentId||!personalDatesOpen)return;const r=learning.personalLearningRange('custom',personalDraftStart,personalDraftEnd);if(!r){personalDateError=personalDraftStart>personalDraftEnd?'开始日期不能晚于结束日期':'请选择现有记录范围内的有效日期';const el=document.querySelector('.pl-validation');if(el)el.textContent=personalDateError;return;}personalRange=r;personalDatesOpen=false;personalTopic='all';personalFilter='all';personalExpanded=[];state.activityId='';state.pairId='';refresh();this.personalToTop(); },

    studentPeriod(period) { if(state.view==='subject'){this.personalMode(period);return;} if(state.studentId&&(state.view === 'subject' ? ['1d','7d','14d','30d'] : ['7d','30d']).includes(period)){state.studentPeriod=period;state.activityId='';state.pairId='';refresh();} },
    knowledge(key) { state.knowledge=state.knowledge===key?'':key;refresh(); },
    focusKnowledge(key) { state.tab='questions';state.knowledge=key;state.questionId='';refresh(); },
    question(id) { state.questionId=id;state.dayQuestion='';refresh(); },
    activity(id) {
      if (id && !(state.view==='subject'?personalScope():report(state.studentId, state.studentPeriod)).activities.some(row => row.id === id)) return;
      if (state.view === 'subject' && id) activityOriginScroll = document.getElementById('teacher-tab-panel')?.scrollTop || 0;
      state.activityId = id;
      refresh();
      const panel = document.getElementById('teacher-tab-panel');
      if (state.view === 'subject' && panel) panel.scrollTop = activityOriginScroll;
    },
    day(value) { const day=Number(value);if(Number.isInteger(day)&&day>=0&&day<learning.learningReportDays.length){state.day=day;clearDetails();refresh();} },
    openClassRoster() {
      if (state.view !== 'homeroom') return;
      const from = state.tab === 'week' ? 'week' : 'overview';
      clearDetails();
      rosterFrom = from;
      state.tab = 'students';
      refresh();
    },
    openHomeroomEvidence(index) {
      if (state.view !== 'homeroom') return;
      const scope = report('all','30d');
      const subject = [...new Set(scope.activities.map(item => item.subject))][index];
      if (!subject) return;
      const reviewDays = state.period === '30d' ? 30 : 7;
      const issues = reviewIssues(scope,reviewDays).filter(issue => issue.subject === subject);
      issueBrowse = { issues, groups: groupIssues(issues), subject, reviewDays, selected: null, groupIndex: null,
        overviewScroll: document.getElementById('teacher-tab-panel')?.scrollTop || 0 };
      refresh();
    },
    openMissingRoster() {
      clearDetails();
      rosterFilter = 'missing';
      state.tab = 'students';
      refresh();
    },
    openSubjectRoster(index) {
      const subjects = [...new Set(report('all','30d').activities.map(item => item.subject))];
      if (!subjects[index]) return;
      clearDetails();
      state.tab = 'students';
      rosterSubject = subjects[index];
      refresh();
    },
    filterRoster(value) {
      if (!(state.view==='subject'?['all','wrong']:rosterSubject?['all','recorded','missing']:[]).includes(value)) return;
      rosterFilter = value;
      refresh();
    },
    searchRoster(value) {
      rosterName = value.trim();
      let found = false;
      for (const row of document.querySelectorAll('[data-roster-name]')) {
        const matches = row.dataset.rosterName.includes(rosterName);
        row.style.display = matches ? '' : 'none';
        found ||= matches;
      }
      const empty = document.querySelector('[data-roster-empty]');
      if (empty) empty.style.display = found ? 'none' : '';
    },
    openPractice() {
      const [latest] = practiceDays(report('all','30d'));
      issueBrowse = { practiceList: true, practiceDays: latest >= 7 ? 30 : 7, selected: null, groupIndex: null,
        overviewScroll: document.getElementById('teacher-tab-panel')?.scrollTop || 0 };
      refresh();
    },
    setPracticeDays(days) {
      if (!issueBrowse?.practiceList || ![7,14,30].includes(days)) return;
      issueBrowse.practiceDays = days;
      refresh();
    },
    openPracticeDay(day) {
      const scope = report('all', '30d');
      if (!practiceDays(scope).includes(day)) return;
      const previous = issueBrowse?.practiceList ? issueBrowse : null;
      const position = document.getElementById('teacher-tab-panel')?.scrollTop || 0;
      const issues = dayIssues(scope, day);
      issueBrowse = { issues, groups: groupIssues(issues), mode: 'knowledge', practiceDay: day, selected: null, groupIndex: null,
        fromPracticeList: previous, practiceListScroll: position, overviewScroll: position };
      refresh();
    },

    materialGo(route) { if(state.view!=='subject'||!['stage','list','question'].includes(route.kind))return;
      if(!issueBrowse)issueBrowse=subjectBrowse(subjectPeriod==='1d'?1:7,route.kind!=='stage');
      else issueBrowse.materialTrail.push({...issueBrowse,materialTrail:undefined,scroll:document.getElementById('teacher-tab-panel')?.scrollTop||0});
      issueBrowse.materialRoute={mode:'source',...route,unknownFromMistakes:route.unknown && !!route.onlyWrong};Object.assign(issueBrowse,{search:'',correction:'all',expanded:[],result:'wrong',selected:null});
      if(route.kind==='question'){const q=mlModel(issueBrowse.reviewDays).questions.find(q=>q.id===route.qid);if(q)issueBrowse.result=q.wrongPeople?'wrong':q.people?'correct':'pending';}
      mlRefresh();
    },
    materialMode(mode){if(issueBrowse?.materialRoute.kind!=='stage'||!['source','knowledge'].includes(mode))return;issueBrowse.materialRoute.mode=mode;mlRefresh(true);},
    materialOnlyWrong(value){if(issueBrowse?.materialRoute.kind!=='list')return;issueBrowse.materialRoute.onlyWrong=!!value;mlRefresh(true);},
    materialResult(value){if(!['wrong','correct','pending','all'].includes(value)||!issueBrowse)return;issueBrowse.result=value;issueBrowse.correction='all';issueBrowse.expanded=[];mlRefresh(true);},
    materialSearch(value){if(!issueBrowse)return;issueBrowse.search=value.trim();issueBrowse.expanded=[];const q=mlModel(issueBrowse.reviewDays).questions.find(q=>q.id===issueBrowse.materialRoute.qid);if(!q)return;const list=document.querySelector('.ml-student-list');if(list)list.innerHTML=mlStudentRows(q);const count=document.querySelector('.ml-visible-count');if(count)count.textContent='当前显示 '+mlStudentMatches(q).length+' 人';},
    materialCorrection(value){if(!issueBrowse||!['all','missing','fixed','still'].includes(value))return;issueBrowse.correction=value;issueBrowse.expanded=[];mlRefresh(true);},
    materialExpand(id){if(!issueBrowse)return;issueBrowse.expanded=issueBrowse.expanded.includes(id)?[]:[id];mlRefresh(true);},
    materialTop(){const p=document.getElementById('teacher-tab-panel');if(p)p.scrollTop=0;},
    openRecentIssues(groupIndex = null) {
      if (!isSubjectHome()) return;
      const days = subjectPeriod === '1d' ? 1 : 7;
      const knowledge=groupIndex===null?null:groupIssues(reviewIssues(report('all',subjectPeriod),days))[groupIndex]?.knowledge;
      if(groupIndex!==null&&!knowledge)return;
      issueBrowse = subjectBrowse(days, true);
      if(knowledge){issueBrowse.groupIndex=issueBrowse.groups.findIndex(g=>g.knowledge===knowledge);issueBrowse.direct=true;}
      refresh();
    },
    openKnowledgeReview() {
      const days = subjectPeriod === '1d' ? 1 : 7;
      issueBrowse = subjectBrowse(days, false);
      refresh();
    },
    openReviewFollowup(studentId = '') {
      if (!issueBrowse?.reviewDays || state.view !== 'subject') return;
      const repeated = weekReport()?.repeated;
      if (!repeated?.length || (studentId && !repeated.some(item => item.studentId === studentId))) return;
      const position = document.getElementById('teacher-tab-panel')?.scrollTop || 0;
      if (studentId) issueBrowse.reviewStudentScroll = position;
      else issueBrowse.reviewFollowupScroll = position;
      issueBrowse.reviewFollowup = true;
      issueBrowse.reviewStudent = studentId;
      refresh();
    },
    setReviewDays(days) {
      if (!issueBrowse?.reviewDays || issueBrowse.recent || ![1,7,14,30].includes(days)) return;
      if(issueBrowse.materialRoute){issueBrowse.reviewDays=days;mlRefresh();return;}
      const issues = reviewIssues(report('all','30d'), days);
      Object.assign(issueBrowse, { reviewDays: days, issues, groups: groupIssues(issues), selected: null, groupIndex: null });
      refresh();
    },
    openSubjectIssues() { if (rosterSubject) this.openIssueBrowse(); },
    openIssueBrowse(groupIndex = null, day = state.day) {
      const issues = dayIssues(report('all','30d'), day).filter(issue => !rosterSubject || issue.subject === rosterSubject);
      const groups = groupIssues(issues);
      if (groupIndex !== null && !groups[groupIndex]) return;
      issueBrowse = { issues, groups, practiceDay: day, groupIndex, direct: groupIndex !== null, mode: 'knowledge', selected: null,
        overviewScroll: document.getElementById('teacher-tab-panel')?.scrollTop || 0 };
      refresh();
    },
    changeIssueDate(day) {
      if (state.view !== 'subject' || !issueBrowse || issueBrowse.groupIndex !== null || issueBrowse.selected !== null) return;
      const scope = report('all', '30d');
      if (!practiceDays(scope).includes(day)) return;
      const issues = dayIssues(scope, day);
      Object.assign(issueBrowse, { practiceDay: day, issues, groups: groupIssues(issues) });
      refresh();
    },
    issueMode(mode) { if (issueBrowse) { issueBrowse.mode = mode; refresh(); } },
    openIssueGroup(index) {
      if (!issueBrowse?.groups[index]) return;
      issueBrowse.groupScroll = document.getElementById('teacher-tab-panel')?.scrollTop || 0;
      issueBrowse.groupIndex = index;
      refresh();
    },
    openStageRoster() { if(!issueBrowse?.modern)return; rosterReturn=issueBrowse;rosterPeriodOverride=issueBrowse.reviewDays+'d';rosterOriginScroll=document.getElementById('teacher-tab-panel')?.scrollTop||0;issueBrowse=null;state.tab='students';rosterName='';rosterFilter='all';refresh(); },
    rememberAnswerOpen(id,open) { if(!issueBrowse?.modern)return; issueBrowse.expanded=issueBrowse.expanded.filter(x=>x!==id);if(open)issueBrowse.expanded.push(id); },
    toggleSubjectQuestion() { if(!issueBrowse?.modern)return;issueBrowse.questionCollapsed=!issueBrowse.questionCollapsed;refresh();this.applyQuestionFilter(); },
    searchQuestionStudents(value) { if(!issueBrowse?.modern)return;issueBrowse.search=value.trim();this.applyQuestionFilter(); },
    filterQuestionStudents(value) { if(!issueBrowse?.modern||!['all','missing','still','fixed'].includes(value))return;issueBrowse.correction=value;this.applyQuestionFilter(); },
    applyQuestionFilter() { if(!issueBrowse?.modern)return;let visible=0;for(const row of document.querySelectorAll('[data-question-name]')){const show=row.dataset.questionName.includes(issueBrowse.search)&&(issueBrowse.correction==='all'||row.dataset.correction===issueBrowse.correction);row.hidden=!show;if(show)visible++;}const empty=document.querySelector('[data-question-empty]');if(empty)empty.hidden=!!visible; },
    openIssue(index) {
      if (!issueBrowse?.issues[index]) return;
      issueBrowse.questionScroll = document.getElementById('teacher-tab-panel')?.scrollTop || 0;
      issueBrowse.selected = index;
      issueBrowse.search=''; issueBrowse.correction='all'; issueBrowse.expanded=[]; issueBrowse.questionCollapsed=false;
      refresh();
    },
    dayEvidence(mode, groupIndex) {
      const scope = report('all', '30d');
      const focus = issueBrowse && issueBrowse.selected !== null ? issueBrowse.issues[issueBrowse.selected] : learning.reportDayFocus(scope, state.day);
      if (!focus) return;
      if (mode === 'affected') {
        const group = groupIndex === undefined ? null : focus.answerGroups[groupIndex];
        if (groupIndex !== undefined && !group) return;
        focusPage = { focus, scope, group, overviewScroll: document.getElementById('teacher-tab-panel')?.scrollTop || 0, context: [focus.date, scopeName(), focus.subject, focus.knowledge].join(' · ') };
        focusStudentId = '';
        focusScroll = 0;
      } else {
        state.dayQuestion = mode;
        state.questionId = focus.questionId;
      }
      refresh();
    },
    openFollowup() { if(state.tab==='week'&&weekReport()?.repeated.length){state.followup=true;state.pairId='';refresh();} },
    toggleWeekEvidence() { state.weekEvidence=!state.weekEvidence;refresh(); },
    pair(id) { state.pairId=id;refresh(); },
  };
})();

// Direct review link for the authorized subject-teacher personal page only.
document.addEventListener('DOMContentLoaded', () => {
  const query = new URLSearchParams(location.search), id = query.get('personalStudent');
  const screen = query.get('materialScreen'), api = window.workbenchPrototype;
  if (screen && query.get('page') === 'teacherDesk' && query.get('tab') === 'learning' && api.getScope().view === 'subject') {
    api.openKnowledgeReview(); api.setReviewDays([1,7,14,30].includes(Number(query.get('days'))) ? Number(query.get('days')) : 30);
    if (screen === 'knowledge') api.materialMode('knowledge');
    else if (screen === 'unknown' || screen === 'unknown-wrong') api.materialGo({kind:'list',unknown:true,onlyWrong:screen==='unknown-wrong'});
    else if (screen === 'source') api.materialGo({kind:'list',sourceId:query.get('source') || 'w1'});
    else if (screen === 'question' || screen === 'expanded') {
      api.materialGo({kind:'list',unknown:true});api.materialGo({kind:'question',qid:query.get('question') || 'material:u1'});
      if(screen==='expanded')api.materialExpand('c1-s01');
    }
    return;
  }
  if (!id || query.get('page') !== 'teacherDesk' || query.get('tab') !== 'learning' || window.workbenchPrototype.getScope().view !== 'subject') return;
  if (query.get('personalPeriod') === '30d') {
    window.workbenchPrototype.openKnowledgeReview();
    window.workbenchPrototype.setReviewDays(30);
    window.workbenchPrototype.openStageRoster();
  } else window.workbenchPrototype.tab('students');
  window.workbenchPrototype.student(id);
});
