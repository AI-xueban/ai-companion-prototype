/* 教职员工统一工作台：演示常见的双重职责，菜单只列出当前账号获授权的视角。 */
window.workbenchPrototype = (() => {
  const learning = window.learningData, roster = window.schoolDemoRoster;
  const state = { view: 'homeroom', grade: 'all', classId: 'c1', period: '7d', tab: 'overview', studentId: '', knowledge: '', questionId: '', activityId: '', rankingBy: 'people' };
  let granted = ['school', 'homeroom', 'subject'];
  const names = { school: '学校管理员', homeroom: '班主任', subject: '任课老师' };
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const classes = () => state.view === 'school' ? roster.DEMO_CLASSES.filter(row => state.grade === 'all' || row.grade === Number(state.grade)) : state.view === 'homeroom' ? roster.DEMO_CLASSES.filter(row => row.id === 'c1') : roster.DEMO_CLASSES.filter(row => row.id === 'c1' || row.id === 'c2');
  const classIds = () => state.view === 'school' ? classes().filter(row => state.classId === 'all' || row.id === state.classId).map(row => row.id) : state.view === 'homeroom' ? ['c1'] : [state.classId === 'c2' ? 'c2' : 'c1'];
  const scopeName = () => state.classId !== 'all' ? roster.getDemoClass(state.classId)?.name || '' : state.grade === 'all' ? roster.SCHOOL_NAME : `${state.grade}年级`;
  const subjectName = () => state.view === 'subject' ? '数学' : '全科';
  const report = (studentId = 'all') => {
    const full = learning.queryLearning(state.period, 'all', state.view === 'subject' ? '数学' : 'all', studentId);
    const ids = classIds();
    const rosterRows = full.roster.filter(row => ids.includes(row.classId));
    const activities = full.activities.filter(row => ids.includes(row.classId));
    const operations = full.operations.filter(row => ids.includes(row.classId));
    const answers = full.answers.filter(row => ids.includes(row.classId));
    const solveRequests = full.solveRequests.filter(row => ids.includes(row.classId));
    return { roster: rosterRows, activities, operations, answers, solveRequests, usedIds: new Set(operations.map(row => row.studentId)), learnedIds: new Set(activities.map(row => row.studentId)), minutes: activities.reduce((sum, row) => sum + row.minutes, 0) };
  };
  const chip = (text, method, selected) => `<button class="lp-chip${selected ? ' active' : ''}" onclick="workbenchPrototype.${method}">${text}</button>`;
  const stat = (value, label) => `<div class="lp-stat"><strong>${esc(value)}</strong><span>${label}</span></div>`;
  const empty = label => `<div class="lp-empty">${esc(label)}</div>`;
  const panel = (title, content) => `<div class="lp-title"><h3>${title}</h3></div><section class="lp-card">${content || '<div class="lp-empty">当前范围暂无记录。</div>'}</section>`;
  const focusPanel = (eyebrow, title, content) => `<section class="wb-focus"><div class="wb-focus-heading"><span>${eyebrow}</span><h2>${title}</h2></div><div class="wb-focus-list">${content || '<div class="lp-empty">当前范围暂无记录。</div>'}</div></section>`;
  const row = (label, value, detail = '') => `<div class="lp-row"><span>${esc(label)}${detail ? `<small>${esc(detail)}</small>` : ''}</span><strong>${esc(value)}</strong></div>`;
  const header = (domain, title, showControls = true) => {
    const role = granted.length > 1 ? `<details class="wb-role-menu"><summary aria-label="切换工作身份，当前${names[state.view]}">${names[state.view]}<span class="wb-chevron" aria-hidden="true"></span></summary><div class="wb-role-menu-list"><small>切换到</small>${[['school','学校管理员'],['homeroom','班主任'],['subject','任课老师']].filter(([id]) => granted.includes(id) && id !== state.view).map(([id,label]) => `<button class="wb-role-option" type="button" onclick="workbenchPrototype.view('${id}')">${label}<span>›</span></button>`).join('')}</div></details>` : '';
    const designation = names[state.view];
    const grades = state.view === 'school' ? `<div class="wb-filter-row"><span class="wb-filter-label">年级</span><div class="wb-filter-options">${[['all','全校'],['7','七年级'],['8','八年级']].map(([id,label]) => chip(label, `grade('${id}')`, state.grade === id)).join('')}</div></div>` : '';
    const classChoices = state.view === 'school' ? chip('全部班级', "class('all')", state.classId === 'all') : '';
    const classRow = state.view === 'homeroom' ? '' : `<div class="wb-filter-row"><span class="wb-filter-label">班级</span><div class="wb-filter-options wb-class-options">${classChoices}${classes().map(item => chip(item.name, `class('${item.id}')`, state.classId === item.id)).join('')}</div></div>`;
    const period = domain === 'learning' ? `<div class="wb-period">${chip('近 7 天', "period('7d')", state.period === '7d')}${chip('近 30 天', "period('30d')", state.period === '30d')}</div>` : '';
    const selectedScope = state.view === 'school' ? state.classId === 'all' ? state.grade === 'all' ? '全校' : state.grade + '年级' : scopeName() : state.view === 'homeroom' ? '七年级(2)班' : domain === 'homework' ? scopeName() : `${scopeName()} · 数学`;
    const scopeFilter = grades || classRow ? `<details class="wb-scope-details"><summary aria-label="调整查看范围，当前${esc(selectedScope)}"><span class="wb-scope-key">范围</span><strong>${esc(selectedScope)}</strong><span class="wb-chevron" aria-hidden="true"></span></summary><div class="wb-scope-options">${grades}${classRow}</div></details>` : `<div class="wb-scope-static"><span class="wb-scope-key">范围</span><strong>${esc(selectedScope)}</strong></div>`;
    const detailTitle = title === '学情' || title === '作业与打卡' ? '' : `<h1>${title}</h1>`;
    const overviewHeader = domain === 'learning' && !state.studentId ? `<div class="lp-hero teacher wb-hero"><div class="wb-heading">${role}<div class="wb-greeting"><strong>陈老师，你好</strong><small>${roster.SCHOOL_NAME} · ${designation}</small>${detailTitle}</div></div></div>` : '';
    const controls = domain === 'homework' ? showControls ? `<div class="wb-condition-row wb-homework-toolbar"><div class="wb-homework-identity">${role||'<span>'+designation+'</span>'}</div>${state.view==='school'?'<div class="wb-homework-context"><span class="wb-readonly">只读</span>'+scopeFilter+'</div>':''}${state.view!=='school'?'<button class="hp-my-drafts-entry" onclick="homeworkPrototype.openTeacherDrafts()"><span class="hp-draft-entry-icon" aria-hidden="true"></span>我的草稿<span class="hp-draft-count">'+(window.homeworkPrototype?.getTeacherDraftCount?.()||0)+'</span><span aria-hidden="true">›</span></button>':''}</div>` : '' : state.studentId ? '' : `<div class="wb-condition-row">${scopeFilter}${period}</div>`;
    return `<div class="lp-page wb-page${domain === 'homework' ? ' wb-homework-page' : ''}">${overviewHeader}${controls}`;
  };
  const timeline = data => panel('学习轨迹', learning.timelineRows(data).slice(0, 20).map(item => `<button class="lp-evidence-entry" onclick="workbenchPrototype.activity('${item.id}')"><div><strong>${esc(item.subject)} · ${esc(item.feature)}</strong><b>${item.minutes} 分钟 ›</b></div><small>${item.date} ${item.start} · ${esc(item.title)} · ${item.status}</small></button>`).join(''));
  const evidenceOverlay = result => {
    if (state.activityId && state.studentId) {
      const evidence = learning.activityEvidence(report(state.studentId), state.activityId);
      return evidence ? `<div class="lp-evidence-mask" onclick="workbenchPrototype.activity('')"><section class="lp-evidence-sheet" onclick="event.stopPropagation()"><button class="lp-evidence-close" onclick="workbenchPrototype.activity('')">关闭 ×</button><h3>${esc(evidence.activity.feature)} · 活动详情</h3><p>${evidence.date} ${evidence.activity.start} · ${esc(evidence.activity.title)} · ${evidence.activity.minutes} 分钟 · ${esc(evidence.activity.status)}</p><h4>原题与作答</h4>${evidence.questions.length ? evidence.questions.map(item => `<div class="lp-evidence-question"><strong>${esc(item.stem)}</strong><p>${item.kind}作答：${esc(item.answer)} · ${item.result}</p><p>参考答案：${esc(item.reference)} · ${esc(item.scoring)} · ${esc(item.version)}</p></div>`).join('') : '<p>本次活动没有关联逐题作答。</p>'}</section></div>` : '';
    }
    if (!state.questionId) return '';
    const question = learning.getLearningQuestion(state.questionId);
    const first = result.answers.filter(item => item.questionId === state.questionId && item.kind === '首次');
    if (!question || !first.length) return '';
    return `<div class="lp-evidence-mask" onclick="workbenchPrototype.question('')"><section class="lp-evidence-sheet" onclick="event.stopPropagation()"><button class="lp-evidence-close" onclick="workbenchPrototype.question('')">关闭 ×</button><h3>原题与学生作答</h3><div class="lp-evidence-question"><strong>${esc(question.stem)}</strong><p>参考答案：${esc(question.answer)} · ${esc(question.scoring)} · ${esc(question.version)}</p></div><h4>首次作答与订正</h4>${first.map(item => { const student = result.roster.find(row => row.id === item.studentId); const correction = result.answers.find(row => row.questionId === item.questionId && row.studentId === item.studentId && row.kind === '订正'); return `<button class="lp-evidence-entry" onclick="workbenchPrototype.student('${item.studentId}')"><div><strong>${esc(student?.name || '学生')}</strong><b>查看学生 ›</b></div><small>首次作答：${esc(item.correct ? question.answer : question.wrong)} · ${item.correct ? '正确' : '错误'}<br>${correction ? `已订正 · ${correction.correct ? '本次答对' : '本次仍错'}` : '暂无订正记录'}</small></button>`; }).join('')}</section></div>`;
  };
  const renderLearning = () => {
    const result = report(); const first = result.answers.filter(item => item.kind === '首次');
    const title = state.view === 'school' ? '学校学情' : state.view === 'homeroom' ? '班级学情' : '学科学情';
    let body = '';
    if (state.studentId) {
      const student = roster.getDemoStudent(state.studentId);
      const detail = report(state.studentId), summary = learning.getStudentLearning(detail, state.studentId);
      body = `<p class="hp-muted">${esc(student.className)}</p><div class="lp-summary">${stat(summary.minutes, '学习分钟')}${stat(summary.days, '学习天数')}${stat(summary.firstCount, '首次作答')}</div>${timeline(detail)}`;
    } else {
      const tabs = [['overview','概览'],['students','学生'],['questions','题目']];
      body = `<div class="lp-tabs">${tabs.map(([id,label]) => `<button class="${state.tab === id ? 'active' : ''}" onclick="workbenchPrototype.tab('${id}')">${label}</button>`).join('')}</div>`;
      if (state.tab === 'overview') {
        const features = learning.featureRows(result).sort((a,b) => b[state.rankingBy] - a[state.rankingBy] || a.name.localeCompare(b.name,'zh-CN'));
        const students = result.roster.map(item => ({ ...item, ...learning.getStudentLearning(result,item.id) }));
        const knowledge = learning.knowledgeRows(result).sort((a,b) => b.wrongPeople-a.wrongPeople).slice(0,3);
        const classRows = state.classId === 'all' ? classes().map(item => { const classReport = learning.queryLearning(state.period,item.id,'all'); return { ...item, learned: classReport.learnedIds.size, enrolled: classReport.roster.length, coverage: learning.pct(classReport.learnedIds.size,classReport.roster.length) }; }).sort((a,b) => a.coverage-b.coverage) : [];
        const focus = state.view === 'school' ? focusPanel('校级优先看', '班级覆盖差异',classRows.map((item,index)=>`<button class="lp-list-button" onclick="workbenchPrototype.class('${item.id}')"><span><strong><i>${index+1}</i>${esc(item.name)}</strong><small>${item.learned} / ${item.enrolled} 人发生学习</small></span><b>${item.coverage}% ›</b></button>`).join('') || empty('当前已选具体班级，可查看学生明细。')) : state.view === 'homeroom' ? focusPanel('班主任优先看', '需要核对的学生',students.filter(item=>!item.learned).slice(0,4).map(item=>`<button class="lp-list-button" onclick="workbenchPrototype.student('${item.id}')"><span><strong>${esc(item.name)}</strong><small>${item.used?'仅有使用记录':'暂无使用记录'}</small></span><b>查看 ›</b></button>`).join('') || empty('本期本班学生均有学伴学习活动。')) : focusPanel('任课老师优先看', '错误集中的知识点',knowledge.map(item=>`<button class="lp-list-button" onclick="workbenchPrototype.focusKnowledge('${item.key}')"><span><strong>${esc(item.knowledge)}</strong><small>${item.students} 人练过 · ${item.questions} 道题</small></span><b>${item.wrongPeople} 人首次答错 ›</b></button>`).join('') || empty('当前范围暂无逐题作答。'));
        body += `<div class="lp-primary full"><small>${state.view==='school'?'学校学习覆盖':state.view==='homeroom'?'本班学习参与':'任教学科学习参与'}</small><strong>${learning.pct(result.learnedIds.size,result.roster.length)}%</strong><span>${result.learnedIds.size} / ${result.roster.length} 人发生学习</span></div>${focus}<div class="lp-summary">${state.view==='subject'?stat(first.length,'首次作答题次')+stat(new Set(first.filter(item=>!item.correct).map(item=>item.studentId)).size,'首次答错学生'):stat(result.minutes,'学习分钟')+stat(state.view==='school'?result.usedIds.size:result.learnedIds.size?Math.round(result.minutes/result.learnedIds.size):0,state.view==='school'?'应用使用人数':'学习者人均分钟')}${stat(state.view==='subject'?result.minutes:new Set(first.map(item=>item.studentId)).size,state.view==='subject'?'学习分钟':'首次作答学生')}</div>${state.view==='subject'?'':panel('各科学习',learning.subjectRows(result).map(item=>row(item.subject,`${item.people} 人 · ${item.minutes} 分钟`)).join(''))}${state.view==='school'?`<div class="lp-title"><h3>功能使用</h3><div class="lp-switch compact">${chip('人数',"ranking('people')",state.rankingBy==='people')}${chip('次数',"ranking('count')",state.rankingBy==='count')}</div></div><section class="lp-card">${features.map(item=>row(item.name,`${item[state.rankingBy]} ${state.rankingBy==='people'?'人':'次'}`)).join('')}</section>`:''}`;
      } else if (state.tab === 'students') {
        const students = result.roster.map(item => ({ ...item, ...learning.getStudentLearning(result,item.id) }));
        body += panel(`当前范围 · ${students.length} 名学生`,students.map(item=>`<button class="lp-list-button" onclick="workbenchPrototype.student('${item.id}')"><span><strong>${esc(item.name)}</strong><small>${esc(item.className)} · ${item.learned ? item.minutes+' 分钟 · '+item.days+' 天' : item.used ? '仅有使用记录' : '暂无使用记录'}</small></span><b>查看 ›</b></button>`).join(''));
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
  const refresh = () => { if (typeof teacherDesk === 'function') teacherDesk(); };
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
    getLearningNavigation() { return { title: state.studentId ? `${roster.getDemoStudent(state.studentId)?.name || '学生'}的学习记录` : '学情', back: Boolean(state.studentId) }; },
    navigateLearningHome() { state.tab='overview'; state.studentId=''; state.knowledge=''; state.questionId=''; state.activityId=''; refresh(); },
    demoIdentity(value) { const choices={all:['school','homeroom','subject'],school:['school'],homeroom:['homeroom'],subject:['subject']};if(!choices[value])return;granted=choices[value];state.view=granted[0];state.grade='all';state.classId=state.view==='school'?'all':'c1';state.studentId='';state.questionId='';state.activityId='';window.homeworkPrototype?.toTeacherListWithoutRefresh?.();if(typeof stage!=='undefined'&&stage==='teacherDesk'){teacherTab='learning';refresh();} },
    view(value) { if (!granted.includes(value)) return; state.view=value; state.grade='all'; state.classId=value==='school'?'all':'c1'; state.studentId=''; state.knowledge=''; state.questionId=''; state.activityId=''; window.homeworkPrototype?.toTeacherListWithoutRefresh?.(); refresh(); },
    grade(value) { if (state.view!=='school'||!['all','7','8'].includes(value))return; state.grade=value; state.classId='all'; state.studentId=''; state.questionId=''; state.activityId=''; refresh(); },
    class(value) { if (value!=='all'&&!classes().some(row=>row.id===value))return;if(value==='all'&&state.view!=='school')return;state.classId=value;state.studentId='';state.questionId='';state.activityId='';refresh(); },
    period(value) { if(value!=='7d'&&value!=='30d')return;state.period=value;state.questionId='';state.activityId='';refresh(); },
    tab(value) { if(!['overview','students','questions'].includes(value))return;state.tab=value;state.studentId='';state.questionId='';state.activityId='';refresh(); },
    ranking(value) { if(value!=='people'&&value!=='count')return;state.rankingBy=value;refresh(); },
    student(id) { if(id&&!report().roster.some(row=>row.id===id))return;state.studentId=id;state.questionId='';state.activityId='';refresh(); },
    knowledge(key) { state.knowledge=state.knowledge===key?'':key;refresh(); },
    focusKnowledge(key) { state.tab='questions';state.knowledge=key;state.questionId='';refresh(); },
    question(id) { state.questionId=id;refresh(); },
    activity(id) { if(id&&!report(state.studentId).activities.some(row=>row.id===id))return;state.activityId=id;refresh(); },
  };
})();
