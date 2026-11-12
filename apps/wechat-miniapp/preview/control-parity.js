/* 小程序管控页面：复用教师端规则语义，保留手机子页面及直接开关交互。 */
// Keep numeric edits local; the existing form input listener updates the draft/reset state.
window.controlDurationInput=function(input){const minus=input.closest('.duration-stepper')?.querySelector('[data-step-minus]');if(minus)minus.disabled=Number(input.value)<=Number(input.min||1);};
window.controlDurationStep=function(button,delta){const input=button.closest('.duration-stepper').querySelector('input');if(input.value===''||!Number.isFinite(input.valueAsNumber))input.value=input.min||'1';else if(delta>0)input.stepUp();else input.stepDown();controlDurationInput(input);input.dispatchEvent(new Event('input',{bubbles:true}));};
(() => {
  const R = window.controlRules;
  const storageKey = 'teacher-control-prototype-v1';
  const ui = { editor: null, pending: null, borrowMode: 'weekly', boolean: null, teacherLockDraft: null, homeworkSubject: '数学' };
  const homeworkSubjects = ['语文', '数学', '英语'];
  const managedHomeworkSubjects = () => controlDemoRole === 'admin' ? [] : controlWorkView === 'subject' ? ['数学'] : homeworkSubjects;
  const homeworkSubject = () => managedHomeworkSubjects().includes(ui.homeworkSubject) ? ui.homeworkSubject : managedHomeworkSubjects()[0];
  const homeworkModule = subject => 'homework:' + subject;
  const operationModule = operation => operation.module === 'homework' && operation.subject ? homeworkModule(operation.subject) : operation.module;
  const homeworkValue = student => controlDemoRole === 'admin' ? { answer: Boolean(student.answer), explanation: Boolean(student.explanation) } : R.homeworkValue(student, homeworkSubject());
  const homeworkTabs = () => {
    const subjects = managedHomeworkSubjects();
    return subjects.length === 1
      ? `<p class="control-subject-label" aria-label="当前科目">${subjects[0]}</p>`
      : `<div class="control-subject-tabs" role="tablist" aria-label="智阅作业科目">${subjects.map(subject => `<button type="button" role="tab" aria-selected="${homeworkSubject() === subject}" onclick="parity.homeworkSubject('${subject}')">${subject}</button>`).join('')}</div>`;
  };
  let renderingDemo = false;
  // 总开关已撤销，历史值不再限制规则编辑或执行。
  schoolBorrowingEnabled = true;
  const legacyCloseOverlay = window.closeControlOverlay;
  window.closeControlOverlay = (force = false) => {
    if (ui.roster) {
      document.getElementById('control-overlay').replaceChildren(...ui.roster.nodes);
      ui.roster.trigger?.focus(); ui.roster = null; return;
    }
    if (!force && ui.boolean && (ui.boolean.value !== null || needScope(ui.boolean.refs) && ui.boolean.scope !== null)) return controlOverlay('放弃未保存的修改？', '<p>本次修改不会保存。</p>', button('继续编辑', 'parity.renderBoolean()', true) + button('放弃修改', 'parity.cancelBoolean()'));
    if (!force && ui.editor?.modal) {
      if (ui.pending) { ui.pending = null; return renderEditor(); }
      return parity.cancelEditor();
    }
    ui.pending = null; ui.boolean = null; ui.teacherLockDraft = null; ui.lockPicker=null; ui.durationSelection=null; ui.worldPicker=null; ui.durationRemoval=null; ui.durationRoster=null; ui.homeworkRemoval=null; legacyCloseOverlay();
  };
  const stateLabels = () => controlModule === 'borrowing' ? ['已设置', '未设置'] : controlModule === 'duration' ? ['有单独规则', '默认规则'] : controlModule === 'homework' ? ['有开放权限', '均不允许'] : controlModule === 'world' && controlDemoRole !== 'admin' ? ['已开放', '未开放'] : controlModule === 'world' ? ['部分班级开放', '全部禁止使用'] : ['部分班级已锁屏', '全部未锁屏'];
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => 'rule-' + crypto.randomUUID();
  const actor = () => ({ by: controlWorkView === 'school' ? '学校管理员' : '陈老师', phone: '13800138000', role: controlWorkView });
  const allRefs = () => schoolControlClasses.flatMap(className => controlData[className].map(s => ({ className, id: s.id })));
  const classRefs = () => controlStudents().map(s => ({ className: selectedTeacherClass, id: s.id }));
  const wholeTeacherClass = refs => refs.length === classRefs().length && refs.every(ref => ref.className === selectedTeacherClass && classRefs().some(item => item.id === ref.id));
  const targetRefs = target => target === 'school' ? allRefs() : target === 'adminSelected' ? R.copy(adminBulkRefs) : classRefs().filter(ref => target === 'all' || target === 'selected' && controlSelected.has(ref.id) || target === ref.id);
  const scopeRefs = key => (adminLevel === 'school' ? schoolControlClasses.filter(name => name.startsWith(key)) : [key]).flatMap(className => controlData[className].map(s => ({ className, id: s.id })));
  const stageOf = label => /^[一二三四五六]年级/.test(label) ? '小学' : /^[七八九]年级/.test(label) ? '初中' : '';
  const activeRefs = () => controlDemoRole === 'admin' ? adminLevel === 'school' ? allRefs() : adminLevel === 'grade' ? schoolControlClasses.filter(name => name.startsWith(adminSelectedGrade)).flatMap(className => controlData[className].map(s => ({ className, id: s.id }))) : classRefs() : classRefs();
  const scopeLabel = () => controlDemoRole !== 'admin' || adminLevel === 'class' ? selectedTeacherClass : adminLevel === 'grade' ? adminSelectedGrade : '全校';
  const needScope = (refs, module = controlModule) => controlDemoRole === 'admin' && refs.length > 1 && ['homework'].includes(module);
  const canEdit = (module = controlModule) => controlDemoRole === 'admin' || module !== 'borrowing' && (module !== 'lock' || !refLocked({className: selectedTeacherClass})) && (module !== 'duration' || controlWorkView === 'homeroom');
  const schoolDateRule = item => controlDemoRole === 'admin' && (item.module || controlModule) === 'borrowing' && (item.rule?.mode || item.value?.mode) === 'dates';
  const temporaryLockActive = (data = controlData) => Boolean(data.schoolSettings?.temporaryLock?.active);
  const scopedLocks = (data = controlData) => data.schoolSettings?.temporaryLocks || {};
  const refLocked = (ref, data = controlData) => data.schoolSettings?.temporaryClassStates?.[ref.className] ?? (temporaryLockActive(data) || Object.values(scopedLocks(data)).some(lock => lock.active && lock.refs.some(item => item.className === ref.className)));
  const isLocked = student => Boolean(student.locked) || schoolControlClasses.some(className => controlData[className].includes(student) && refLocked({ className, id: student.id }));
  const scopeLockKey = key => (schoolControlClasses.includes(key) ? 'class:' : 'grade:') + key;
  const studentLockKey = ref => 'student:' + ref.className + ':' + ref.id;
  const ownTemporaryLock = key => {
    const name = key.replace(/^(class|grade):/, '');
    const classes = schoolControlClasses.filter(item => item === name || item.startsWith(name));
    return classes.length > 0 && classes.every(className => refLocked({ className }));
  };
  const selectionLockEntries = () => controlDemoRole === 'admin' ? [...adminSelectedScopes].map(key => ({ key: scopeLockKey(key), refs: scopeRefs(key) })) : currentSelectedRefs().map(ref => ({ key: studentLockKey(ref), refs: [ref] }));
  const lockNotice = () => {
    const refs = activeRefs();
    return refs.some(ref => refLocked(ref)) ? `<p class="parity-note" role="status">当前班级临时锁屏管控中，老师暂不可修改锁屏。</p>` : '';
  };
  function teacherLockAction(locked,total){
    const value=locked<total;
    return button(value?'全班锁屏':'解除锁屏',`parity.toggleClassLock(${value})`,false,!total||classRefs().some(ref=>refLocked(ref))).replace('class="control-primary"','class="control-primary control-action-'+(value?'restrict':'release')+'"');
  }
  function lockToggle(module, on, action, label) {
    if ((module === 'world' || module === 'lock') && controlDemoRole === 'admin') return button(module === 'world' ? '设置' : on ? '解除临时锁屏' : '设置临时锁屏', action, true);
    const html = binaryToggleButton(module, on, action, label);
    return module === 'lock' && controlDemoRole !== 'admin' && refLocked({className: selectedTeacherClass}) ? html.replace('<button ', '<button disabled aria-disabled="true" ') : html;
  }
  function assertPermission(refs, module, subject = homeworkSubject()) {
    if (controlDemoRole === 'admin') {
      const rows = R.resolve(controlData, refs);
      if (schoolControlClasses.some(className => {
        const ids = new Set(rows.filter(row => row.ref.className === className).map(row => row.ref.id));
        return ids.size > 0 && ids.size !== controlData[className].length;
      })) throw Error('学校管理员仅支持全校或年级操作');
      const classes = [...new Set(refs.map(ref => ref.className))], all = schoolControlClasses.filter(name => controlData[name]?.length);
      const grades = [...new Set(classes.map(name => name.match(/^[一二三四五六七八九]+年级/)?.[0] || name))];
      const expected = grades.length === 1 ? all.filter(name => name.startsWith(grades[0])) : all;
      if ((grades.length > 1 && classes.length !== all.length) || expected.some(name => !classes.includes(name))) throw Error('学校管理员仅支持全校或年级操作');
      return;
    }
    const latest = loadLatest();
    if (module === 'borrowing') throw Error('借用规则由学校管理员统一设置，老师仅可查看');
    if (!refs.length || refs.some(ref => ref.className !== selectedTeacherClass || !classRefs().some(item=>item.id===ref.id))) throw Error('当前身份没有该学生的管控权限');
    if (module === 'homework' && !managedHomeworkSubjects().includes(subject)) throw Error('任课老师只能管理自己任教的科目');
    if (module === 'lock' && refs.some(ref => refLocked(ref, latest))) throw Error('学校管理员正在进行临时锁屏管控，暂时无法修改锁屏状态。');
    const classes = controlWorkView === 'homeroom' ? [controlClasses[0]] : controlClasses;
    if (refs.some(ref => !classes.includes(ref.className)) || ['borrowing', 'duration'].includes(module) && controlWorkView !== 'homeroom') throw Error('当前身份没有该范围的管控权限');
  }
  const baseFor = (refs, module = controlModule, subject = controlDemoRole === 'admin' ? null : homeworkSubject()) => Object.fromEntries(R.resolve(controlData, refs).map(({ ref, student }) => [ref.className + ':' + ref.id, R.signature(student, module === 'homework' && subject ? homeworkModule(subject) : module)]));
  const card = (title, body) => `<section class="control-module-panel"><h3>${title}</h3>${body}</section>`;
  const button = (text, action, secondary = false, disabled = false) => `<button type="button" class="control-${secondary ? 'secondary' : 'primary'}" onclick="${action}" ${disabled || controlDemoRole !== 'admin' && controlModule === 'lock' && refLocked({className: selectedTeacherClass}) && /selectedBoolean|confirmControl|scopeBoolean/.test(action) ? 'disabled' : ''}>${text}</button>`;
  function ruleIconButton(kind, action, disabled = false) {
    if (!canEdit()) return '';
    const label = kind === 'edit' ? '编辑规则' : '删除规则';
    const path = kind === 'edit' ? '<path d="m15 4 5 5M4 20l5-1L21 7a2.1 2.1 0 0 0-5-5L4 14z"/>' : '<path d="M3 6h18M9 6V4h6v2M5 6l1 14h12l1-14M10 10v6M14 10v6"/>';
    return `<button type="button" class="parity-rule-icon ${kind === 'delete' ? 'parity-danger' : ''}" aria-label="${label}" title="${label}" onclick="${action}" ${disabled ? 'disabled' : ''}><svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${path}</svg></button>`;
  }
  const pageTop = (title, back) => header(title, false).replace('<span></span><h2', `<button class="wx-back" aria-label="返回上一页" onclick="${back}"><i></i></button><h2`);
  function shell(title, content, back = 'parity.back()', footer = '', classes = '') {
    app.innerHTML = `<main class="screen control-screen ${classes}">${pageTop(title, back)}<section class="control-content">${controlModule === 'lock' ? lockNotice() : ''}${content}</section>${footer}<div id="control-overlay"></div><div id="control-toast" role="status"></div></main>`;
    syncReview();
  }
  function normalizeWorld(data) {
    data.schoolSettings ||= {};
    const states = data.schoolSettings.worldClasses ||= {};
    schoolControlClasses.forEach(name => {
      const students = data[name] || [];
      if (!students.length) return;
      if (typeof states[name] !== 'boolean') states[name] = students.every(student => student.world === true);
      students.forEach(student => { if (!student.worldIndividual) student.world = states[name]; });
    });
    Object.entries(data.schoolSettings.durationClasses || {}).forEach(([name, rule]) => {
      (data[name] || []).forEach(student => { if (!student.durationIndividual) student.durationRules = [{...R.copy(rule),source:rule.source||'homeroom'}]; });
    });
    schoolControlClasses.forEach(name=>{const inherited=gradeDurationWeek(data,name);(data[name]||[]).forEach(student=>{student.durationDefaultEnabled=data.schoolSettings.durationDefaultEnabled!==false;student.durationSchoolWeekdays=(data.schoolSettings.adminPolicies?.duration||[]).filter(p=>p.grades.includes(name.match(/^[一二三四五六七八九]+年级/)?.[0])).flatMap(p=>p.groups.flatMap(g=>g.weekdays));student.durationSchoolPaused=data.schoolSettings.durationRulesEnabled===false;student.durationTeacherPaused=data.schoolSettings.durationClassEnabled?.[name]===false;student.durationGradeSettings=inherited.dailySettings;});});
    return data;
  }
  function loadLatest() {
    if (renderingDemo) return controlData;
    const stored = localStorage.getItem(storageKey);
    if (!stored) return controlData;
    const latest = JSON.parse(stored);
    if (!schoolControlClasses.every(name => Array.isArray(latest[name]))) throw Error('当前数据已变化，请刷新后重试');
    return normalizeWorld(latest);
  }
  function persist(next) {
    normalizeWorld(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
    controlData = next;
  }
  // 为历史演示数据补齐规则 ID 和分模块操作信息，不清空用户已做的设置。
  schoolControlClasses.forEach(className => controlData[className].forEach(student => {
    student.schedules = (student.schedules || []).map((rule, i) => R.normalize(rule, 'borrow-' + student.id + '-' + i));
    student.durationRules = (student.durationRules || []).map((rule, i) => R.normalize(rule, 'duration-' + student.id + '-' + i));
    // 旧版初始化样例没有操作记录；与基础规则相同的种子不是学生单独规则。
    const untouchedSeed = student.by === '学校管理员' && student.at === '今天 08:30';
    if (untouchedSeed && !student.operatedAt?.duration) student.durationRules = [];
    student.updated ||= {};
    student.teacherModified ||= {};
    Object.keys(student.operatedAt || {}).forEach(module => {
      student.updated[module] ||= { by: student.by || '学校管理员', phone: '', at: student.at || '—', role: student.by === '学校管理员' ? 'school' : 'homeroom', version: 1 };
      if (student.teacherModified[module] === undefined) student.teacherModified[module] = student.updated[module].role !== 'school';
    });
  }));
  controlData.schoolSettings ||= { borrowingRules: R.copy(controlData[schoolControlClasses[0]][0]?.schedules || []) };
  controlData.schoolSettings.borrowingRules ||= R.copy(controlData[schoolControlClasses[0]][0]?.schedules || []);
  if (!controlData.schoolSettings.schoolBorrowUnified) {
    // 旧版个人借用样例仅作迁移备份，不再参与学校统一规则执行。
    schoolControlClasses.forEach(className => controlData[className].forEach(student => {
      student.legacyBorrowingRules ??= R.copy(student.schedules);
      student.schedules = R.copy(controlData.schoolSettings.borrowingRules);
    }));
    controlData.schoolSettings.schoolBorrowUnified = true;
  }
  try { persist(controlData); } catch { /* 后续保存会明确报告失败，保留当前会话数据。 */ }
  function summary(student, module = controlModule) {
    if (module === 'lock' && controlDemoRole === 'admin') {
      const className = schoolControlClasses.find(name => controlData[name].includes(student));
      return [refLocked({className}) ? '已开启临时锁屏' : '未开启临时锁屏'];
    }
    if (module === 'borrowing') return student.schedules.length ? student.schedules.map(rule => R.borrowText(rule) + (rule.mode === 'dates' ? ' · ' + R.borrowStatus(rule) : '')) : ['未设置借用规则，没有有效规则时不能借用'];
    if (module === 'duration') return R.durationGroups(student).map(text => text.replace(/(?:单独规则|默认规则) · /g, ''));
    if (module === 'homework') { const value = homeworkValue(student); return [`${controlDemoRole === 'admin' ? '' : homeworkSubject() + ' · '}答案${value.answer ? '允许' : '不允许'} · 详解${value.explanation ? '允许' : '不允许'}`]; }
    return [module === 'world' ? student.world ? '允许使用' : '禁止使用' : isLocked(student) ? '已锁屏' : '未锁屏'];
  }
  function configurationKey(student, module = controlModule) {
    return JSON.stringify(module === 'duration' ? R.durationGroups(student) : module === 'borrowing' ? R.prune(student.schedules).map(rule => { const { id, ...value } = rule; return value; }).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))) : summary(student, module));
  }
  function groups(refs) {
    const grouped = new Map();
    R.resolve(controlData, refs).forEach(({ ref, student }) => {
      const key = configurationKey(student);
      if (!grouped.has(key)) grouped.set(key, { refs: [], student });
      grouped.get(key).refs.push(ref);
    });
    return [...grouped.values()].sort((a, b) => b.refs.length - a.refs.length);
  }
  function modifiedInfo(student) {
    // 小程序所有角色均隐藏最近操作，数据仍保留供同步和版本校验。
    return '';
  }
  function scopeModifiedInfo(students) {
    const latest = students.reduce((current, student) => {
      const update = student.updated?.[controlModule];
      if (!update) return current;
      const time = student.operatedAt?.[controlModule] || Date.parse(update.at) || 0;
      return !current || time > current.time ? { update, time } : current;
    }, null);
    return modifiedInfo({ updated: latest ? { [controlModule]: latest.update } : {} });
  }
  function recordTemporaryLock(data, refs) {
    const time = Date.now(), operator = actor(), at = new Date(time).toLocaleString('zh-CN', { hour12: false });
    R.resolve(data, refs).forEach(({ student }) => {
      student.updated = { ...student.updated, lock: { ...operator, at, version: (student.updated?.lock?.version || 0) + 1 } };
      student.operatedAt = { ...student.operatedAt, lock: time };
    });
  }
  function defaultCard() {
    if (controlModule === 'borrowing') return card('借用规则说明', '<p>指定日期规则优先，到期或删除后恢复每周规则。没有有效规则时不能借用。</p>');
    if (controlModule === 'duration') return card('全校默认配置说明', `<p>${R.dayText(R.defaultDuration.weekdays)} · ${R.durationText(R.defaultDuration)}</p>`);
    if (controlModule === 'homework') return card('当前查看权限', controlDemoRole === 'admin' ? `<p>${scopeOverview(activeRefs(), 'homework').join(' · ')}</p><p class="parity-note">默认不允许查看答案和详解；包含老师已设置的科目。</p>` : `<p>${homeworkSubject()}：${scopeOverview(activeRefs(), 'homework').join(' · ')}</p>`);
    const students = R.resolve(controlData, activeRefs()).map(row => row.student), count = students.filter(s => controlModule === 'world' ? s.world : isLocked(s)).length;
    if (controlModule === 'lock' && controlDemoRole === 'admin') return temporaryLockScopeCard();
    return card(scopeLabel() + '当前状态', `<p>${scopeOverview(activeRefs(), controlModule).join(' · ')}</p>`);
  }
  const temporaryLockDescription = () => '<details class="control-description-fold"><summary aria-label="临时锁屏说明"><span>管控说明</span><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg></summary><div class="control-description-body"><p class="parity-note">临时锁屏期间，相关班级的老师不能修改锁屏。解除后恢复日常锁屏状态和老师原有操作权限。</p></div></details>';
  function temporaryLockScopeCard() {
    const classes = adminLevel === 'school' ? schoolControlClasses : adminLevel === 'grade' ? schoolControlClasses.filter(name => name.startsWith(adminSelectedGrade)) : [selectedTeacherClass];
    const locked = classes.filter(className => refLocked({ className })).length;
    const school = adminLevel === 'school', mixed = locked > 0 && locked < classes.length;
    const scope = scopeLabel().replace(/\s/g, '');
    const label = school ? temporaryLockActive() ? '结束全校临时锁屏' : '一键锁屏全校' : mixed ? '设置临时锁屏' : locked ? `解除${scope}临时锁屏` : `一键锁屏${scope}`;
    const status = school && temporaryLockActive() ? '全校临时锁屏中' + (locked < classes.length ? '，部分班级已解除' : '') : locked === classes.length && classes.length ? '已开启临时锁屏' : mixed ? '部分班级临时锁屏中' : '未开启临时锁屏';
    return `<section class="control-entry-lock"><div class="control-entry-lock-head"><div><h3>${esc(scopeLabel())}临时锁屏</h3><p>${status}</p></div></div>${temporaryLockDescription()}<div class="control-actions">${button(label, 'parity.currentScopeLock()', false, !activeRefs().length)}</div></section>`;
  }
  function scopeOverview(refs, module) {
    const students = R.resolve(controlData, refs).map(row => row.student);
    if (!students.length) return ['暂无可管控班级'];
    if (module === 'duration') {
      const count = students.filter(student => student.durationRules?.length).length;
      const variants = new Set(students.map(student => JSON.stringify(R.durationGroups(student))));
      return variants.size > 1 ? ['部分班级规则有差异'] : R.durationGroups(students[0]).slice(0, 2).concat(R.durationGroups(students[0]).length > 2 ? ['还有更多规则'] : []);
    }
    if (module === 'homework') {
      const values = students.map(student => {
        const subjects = controlDemoRole === 'admin' ? [...new Set([...homeworkSubjects, ...Object.keys(student.homeworkSubjects || {})])] : [homeworkSubject()];
        return { answer: subjects.some(subject => R.homeworkValue(student, subject).answer), explanation: subjects.some(subject => R.homeworkValue(student, subject).explanation) };
      });
      const status = field => values.every(value => value[field]) ? '允许' : values.every(value => !value[field]) ? '不允许' : '设置不一致';
      return [`答案${status('answer')}`, `详解${status('explanation')}`];
    }
    if (module === 'world') {
      const allowed = students.filter(student => student.world).length;
      return [allowed === students.length ? '开放' : allowed === 0 ? '关闭' : '部分班级开放'];
    }
    return [];
  }
  function schoolStatus(module) {
    const students = adminAllStudents();
    if (module === 'lock') {
      const states = allRefs().map(ref => Boolean(refLocked(ref)));
      return states.length && states.every(Boolean) ? '临时锁屏全部开启' : states.some(Boolean) ? '临时锁屏部分开启' : '临时锁屏未开启';
    }
    if (['duration', 'homework', 'world'].includes(module)) return scopeOverview(allRefs(), module).join(' · ');
    const mixed = new Set(students.map(student => configurationKey(student, module))).size > 1;
    const subjectDifference = module === 'homework' && students.some(student => Object.values(student.homeworkSubjects || {}).some(value => Boolean(value.answer) !== Boolean(student.answer) || Boolean(value.explanation) !== Boolean(student.explanation)));
    return mixed || subjectDifference ? '班级规则有差异' : module === 'homework' && !students.some(student => student.answer || student.explanation) ? '答案、详解均不允许' : '班级规则一致';
  }
  function selectedStudentsLink(refs) {
    return esc([...new Set(refs.map(ref => ref.className))].join('、'));
  }
  function teacherBorrowSummary() {
    const rules = controlData.schoolSettings?.borrowingRules || [];
    const sections = [['weekly', '每周借用时间'], ['dates', '指定日期借用时间']].map(([mode, title]) => {
      const items = rules.filter(rule => rule.mode === mode);
      if (!items.length) return '';
      return `<div class="parity-borrow-heading"><h3>${title}</h3></div>${items.map(rule => `<p>${esc(R.borrowText(rule))}${mode === 'dates' ? ` · ${R.borrowStatus(rule)}` : ''}</p>`).join('')}`;
    }).join('');
    return `${sections || '<p>暂无借用安排</p>'}<p class="parity-note">指定日期优先，无有效规则时不能借用。</p>`;
  }
  function renderEntry() {
    ui.homeworkDrill=null;
    if (window.controlPageDemo?.emptyClass?.() === selectedTeacherClass && controlDemoRole !== 'admin') {
      app.innerHTML = `<main class="screen control-screen">${header('管控', false)}${controlRoleSwitcher()}<section class="control-entry" id="teacher-tab-panel" role="tabpanel"><div class="control-empty"><h3>当前班级暂无可管控班级</h3><p>可切换其他班级查看。</p></div></section>${teacherTabBar()}<div id="control-overlay"></div><div id="control-toast" role="status"></div></main>`;
      syncReview(); return;
    }
    const admin = controlDemoRole === 'admin', students = admin ? adminAllStudents() : controlStudents(), locked = students.filter(s => isLocked(s)).length;
    const temporary = admin ? temporaryLockActive() : classRefs().some(ref => refLocked(ref));
    const lockActions = admin ? button(temporary ? '结束全校临时锁屏' : '一键锁屏全校', 'parity.toggleTemporaryLock()', temporary) : temporary ? button('本班临时锁屏中', '', true, true) : teacherLockAction(locked, students.length);
    const lockDescription = admin ? temporaryLockDescription() : lockNotice();
    const lockCard = admin && window.schoolControl ? schoolControl.entryCard('lock') : `<section class="control-entry-lock"><div class="control-entry-lock-head"><div><h3>${admin ? '全校临时锁屏' : '平板锁屏'}</h3>${admin ? '<p>'+schoolStatus('lock')+'</p>' : locked ? '<p>已锁屏 '+locked+'/'+students.length+' 人</p>' : ''}</div>${admin ? '<button onclick="enterAdminModule(\'lock\')">查看详情 ›</button>' : '<button onclick="parity.openStudentLocks()">设置学生锁屏 ›</button>'}</div>${lockDescription}<div class="control-actions">${lockActions}</div></section>`;
    const borrowCard = window.borrowing ? admin ? window.schoolControl ? schoolControl.entryCard('borrowing') : borrowing.entryCard() : borrowing.teacherEntryCard() : '';
    const entries = [...(admin || isHeadTeacherClass() ? [['duration', '使用时长管控']] : []), ['homework', '智阅作业管控'], ['world', '万象视界管控']];
    const list = entries.map(([module, title]) => `<button class="control-entry-card" onclick="${admin ? 'enterAdminModule' : 'openControlModule'}('${module}')"><span class="control-entry-icon ${module}">${controlCardIcon(module)}</span><span class="control-entry-copy"><h3>${title}</h3>${admin||['homework','world'].includes(module) ? '' : `<p class="parity-school-status" role="status">${esc((admin ? scopeOverview(allRefs(), module) : scopeOverview(classRefs(), module)).join(' · ').replace(/(^|：)单独规则 · /g, '$1'))}</p>`}</span><span class="control-entry-action">›</span></button>`).join('');
    app.innerHTML = `<main class="screen control-screen">${header('管控', false)}${controlRoleSwitcher()}<section class="control-entry" id="teacher-tab-panel" role="tabpanel">${lockCard}${borrowCard}<div class="control-entry-subtitle">其他管控</div><div class="control-entry-list">${list}</div></section>${teacherTabBar()}<div id="control-overlay"></div><div id="control-toast" role="status"></div></main>`;
    syncReview();
  }
  function scopeRows() {
    const keys = [...new Set(schoolControlClasses.map(name => name.match(/^[一二三四五六七八九]+年级/)?.[0] || name))];
    let previousStage = '';
    return keys.map(key => {
      const refs = scopeRefs(key), students = R.resolve(controlData, refs).map(row => row.student);
      const empty = students.length === 0, stage = adminLevel === 'school' ? stageOf(key) : '';
      const heading = stage && stage !== previousStage ? `<div class="control-grade-group-title">${stage}</div>` : '';
      if (stage) previousStage = stage;
      const navigate = '';
      const select = adminBatchMode && !empty ? `<label class="parity-scope-check"><input type="checkbox" aria-label="选择${key}" ${adminSelectedScopes.has(key) ? 'checked' : ''} onchange="parity.selectScope('${key}',this.checked)"></label>` : '';
      const locked = refs.filter(ref => refLocked(ref)).length;
      const lockedText = !locked ? '未开启' : locked === refs.length ? '已开启' : '部分班级已开启';
      const permissionText = field => {
        const count = students.filter(student => field === 'world' ? student.world : field === 'answer' || field === 'explanation' ? [...new Set([...homeworkSubjects, ...Object.keys(student.homeworkSubjects || {})])].some(subject => R.homeworkValue(student, subject)[field]) : false).length;
        return count === 0 ? '不允许' : count === students.length ? '允许' : '部分允许';
      };
      let rules = '';
      if (empty) rules = `<p class="parity-scope-empty">${adminLevel === 'school' ? '该年级' : '该班级'}暂无可管控班级</p>`;
      else if (controlModule === 'duration') {
        const grouped = groups(refs), mixed = grouped.length > 1;
        rules = mixed ? `<div class="parity-scope-rule"><b>使用时长规则</b><span>${schoolControlClasses.includes(key) ? '班级规则有差异' : '部分班级有差异'}</span></div>` : R.durationGroups(students[0]).slice(0, 2).map(text => {
          const [days, ...details] = text.split('：');
          return `<div class="parity-scope-rule"><b>${esc(days)}</b><span>${esc(details.join('：'))}</span></div>`;
        }).join('');
        if (!adminBatchMode && (mixed || R.durationGroups(students[0]).length > 2)) rules += `<button type="button" class="parity-scope-more" onclick="parity.showScopeRules('${key}')">查看全部规则 ›</button>`;
      } else if (controlModule === 'homework') {
        rules = `<div class="parity-scope-rule"><b>查看答案</b><span>${permissionText('answer')}</span></div><div class="parity-scope-rule"><b>查看详解</b><span>${permissionText('explanation')}</span></div>`;
      } else if (controlModule === 'world') {
        const allowed = students.filter(student => student.world).length;
        rules = `<div class="parity-scope-rule"><b>万象视界使用状态</b><span>${allowed === 0 ? '关闭' : allowed === students.length ? '开放' : '部分班级开放'}</span></div>`;
      } else if (controlModule === 'lock') rules = `<div class="parity-scope-rule"><b>临时锁屏</b><span>${lockedText}</span></div>`;
      const on = controlModule === 'world' ? students.every(student => student.world) : locked === refs.length;
      const action = controlModule === 'lock' ? button(on ? '解除临时锁屏' : locked ? '设置临时锁屏' : '临时锁屏', `parity.scopeBoolean('${key}',null)`, true) : controlModule === 'world' ? lockToggle('world', on, `parity.scopeBoolean('${key}',${!on})`, '设置使用状态') : `<button type="button" class="control-secondary" onclick="parity.editScope('${key}')">${controlModule === 'duration' ? '设置规则' : '设置权限'}</button>`;
      return `${heading}<article class="parity-scope-card" ${adminBatchMode && !empty ? `role="checkbox" aria-checked="${adminSelectedScopes.has(key)}" tabindex="0" onclick="if(!event.target.closest('label,button'))parity.selectScope('${key}',!adminSelectedScopes.has('${key}'))" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();parity.selectScope('${key}',!adminSelectedScopes.has('${key}'))}"` : ''}><div class="parity-scope-card-head">${select}<h3>${esc(key)}</h3>${navigate}</div><div class="parity-scope-card-rules">${rules}</div>${!adminBatchMode && !empty ? `<div class="parity-scope-card-footer">${action}</div>` : ''}</article>`;
    }).join('') || '<div class="control-empty">没有符合条件的年级或班级</div>';
  }
  function selectionFooter(admin = false) {
    const refs = admin ? adminSelectionRefs() : targetRefs('selected'), selected = admin ? adminSelectedScopes.size : controlSelected.size;
    let actions;
    if (!admin && controlModule === 'world') {
      actions = button('开放所选学生', 'parity.selectedBoolean(true)', false, !selected);
    } else if ((controlModule === 'world' || controlModule === 'lock') && controlDemoRole === 'admin') {
      const states = R.resolve(controlData, refs).map(({ ref, student }) => controlModule === 'world' ? student.world : Boolean(refLocked(ref)));
      const mixed = states.some(Boolean) && states.some(value => !value);
      const action = mixed ? 'null' : String(!states.every(Boolean));
      actions = button(controlModule === 'world' ? '设置使用状态' : mixed ? '设置临时锁屏' : states.every(Boolean) ? '解除临时锁屏' : '开启临时锁屏', `parity.booleanEditor(parity.selectedRefs(),'所选对象',${controlModule === 'world' ? 'null' : action})`, false, !selected);
    } else if (controlModule === 'lock' || controlModule === 'world') {
      const states = R.resolve(controlData, refs).map(({ student }) => controlModule === 'lock' ? isLocked(student) : student.world);
      const blocked = controlModule === 'lock' && refs.some(ref => refLocked(ref));
      actions = controlModule === 'lock' && !blocked
        ? states.length ? teacherLockAction(states.filter(Boolean).length, states.length, 'selected') : button('设置锁屏', "parity.teacherLockChoice('selected')", false)
        : controlModule === 'world' && states.some(Boolean) && states.some(value => !value)
          ? button('设置使用状态', "parity.booleanEditor(parity.selectedRefs(),'所选对象',null)")
          : (states.some(Boolean) ? button(controlModule === 'lock' ? '解锁' : '禁止使用', 'parity.selectedBoolean(false)', true, blocked) : '')
            + (states.some(value => !value) ? button(controlModule === 'lock' ? '锁屏' : '允许使用', 'parity.selectedBoolean(true)', false, blocked) : '');
    } else actions = button(controlModule === 'borrowing' ? '设置规则' : controlModule === 'duration' ? '设置时长' : '设置权限', 'parity.selectedEdit()', false, !selected || !canEdit());
    const visible = admin ? visibleScopeKeys() : filteredControlStudents().map(s => s.id), set = admin ? adminSelectedScopes : controlSelected;
    return `<footer class="admin-batchbar parity-batchbar"><label class="control-footer-select"><input type="checkbox" aria-label="全选" ${visible.length && visible.every(key => set.has(key)) ? 'checked' : ''} onchange="parity.selectAll(this.checked)"><span>全选</span><small>${selected}/${visible.length}</small></label><div class="admin-batch-actions">${button('取消', 'parity.cancelSelection()', true)}${actions}</div><small class="parity-affected">${selectedStudentsLink(refs)}</small></footer>`;
  }
  function scopePage() {
    adminBatchMode = false; adminSelectedScopes.clear();
    const schoolAction = adminLevel === 'school' && ['duration', 'homework', 'world'].includes(controlModule)
      ? `<button type="button" onclick="parity.editSchool()">设置全校${controlModule === 'duration' ? '使用时长' : controlModule === 'homework' ? '查看权限' : '使用状态'}</button>` : '';
    shell(controlLabels[controlModule], `${defaultCard()}<div class="admin-scope-summary"><b>按${adminLevel === 'school' ? '年级' : '班级'}查看</b>${schoolAction}</div><div id="parity-scope-rows" class="parity-scope-card-list">${scopeRows()}</div>`, 'parity.back()');
  }
  function filteredControlStudents() {
    return controlStudents().filter(s => {
      if (!s.name.includes(controlQuery) && !String(s.id).padStart(6, '0').includes(controlQuery)) return false;
      const active = controlModule === 'duration' ? s.durationRules.length > 0 : controlModule === 'borrowing' ? R.prune(s.schedules).length > 0 : controlModule === 'homework' ? homeworkValue(s).answer || homeworkValue(s).explanation : controlModule === 'world' ? s.world : isLocked(s);
      return controlFilter === 'all' || (controlFilter === 'yes' ? active : !active);
    }).sort((a, b) => (b.operatedAt?.[controlModule] || 0) - (a.operatedAt?.[controlModule] || 0));
  }
  function homeworkSwitch(student, key, label) {
    const on = Boolean(homeworkValue(student)[key]);
    return `<span class="homework-permission-toggle"><span>${label}</span><button type="button" class="permission-mini-switch" role="switch" aria-checked="${on}" aria-label="${on ? '关闭' : '开放'}${esc(student.name)}的${homeworkSubject()}${label}权限" onclick="toggleHomeworkPermission(${esc(JSON.stringify(student.id))},'${key}',${!on})"></button></span>`;
  }
  function studentRows() {
    return filteredControlStudents().map(s => {
      const selection = controlView === 'students', rules = controlModule === 'borrowing' || controlModule === 'duration';
      const main = `<b>${esc(s.name)}</b>${rules || selection ? `<span>${summary(s).map(esc).join('<br>')}</span>` : ''}${modifiedInfo(s)}`;
      if (selection) return `<button class="control-student-row ${controlSelected.has(s.id) ? 'selected' : ''}" onclick="parity.selectStudent(${s.id})"><span class="parity-student-main">${main}</span><span class="control-check">${controlSelected.has(s.id) ? '✓' : ''}</span></button>`;
      const direct = controlModule === 'lock' || controlModule === 'world', on = controlModule === 'lock' ? isLocked(s) : s.world;
      const action = controlModule === 'lock' && !canEdit() ? '' : controlModule === 'lock' && controlDemoRole === 'admin' ? lockToggle('lock', ownTemporaryLock(studentLockKey({ className: selectedTeacherClass, id: s.id })), `parity.studentTemporaryLock(${s.id})`, (ownTemporaryLock(studentLockKey({ className: selectedTeacherClass, id: s.id })) ? '解除临时锁屏：' : '临时锁屏：') + s.name) : direct ? lockToggle(controlModule, on, `confirmControl(${s.id},${!on})`, (on ? '关闭' : '开启') + s.name + controlLabels[controlModule]).replace('<button ', controlModule === 'lock' && refLocked({ className: selectedTeacherClass, id: s.id }) ? '<button disabled ' : '<button ') : controlModule === 'homework' ? `<span class="homework-inline-permissions">${homeworkSwitch(s, 'answer', '答案')}${homeworkSwitch(s, 'explanation', '详解')}</span>` : '<span class="control-detail-arrow">›</span>';
      return `<div class="parity-student-row"><button class="parity-student-main" onclick="openControlStudentDetail(${s.id})">${main}${direct ? `<span>${esc(summary(s)[0])}</span>` : ''}</button>${action}</div>`;
    }).join('') || '<div class="control-empty">没有符合条件的学生</div>';
  }
  function studentPage() {
    if (controlModule === 'lock' && !canEdit() && controlView === 'students') {
      controlView = 'module'; controlSelected.clear();
    }
    const selection = controlView === 'students';
    const reset = '';
    const filters = `<div class="control-list-tools"><label class="borrow-list-search"><input aria-label="搜索学生姓名或编号" placeholder="搜索学生姓名或编号" value="${esc(controlQuery)}" oninput="parity.studentFilter(this.value,null)"></label><select class="borrow-status-filter" aria-label="${controlModule === 'homework' ? '筛选学生权限状态' : '筛选学生规则状态'}" onchange="parity.studentFilter(null,this.value)">${[['all', '全部'], ['yes', stateLabels()[0]], ['no', stateLabels()[1]]].map(([id, label]) => `<option value="${id}" ${controlFilter === id ? 'selected' : ''}>${label}</option>`).join('')}</select></div>`;
    const listHead = `<div class="borrow-list-head">${canEdit() ? button('设置全班','parity.editClass()',true) : ''}<b>${selection ? '选择要开放的学生' : controlModule === 'homework' ? '学生权限' : '学生规则'}</b></div>`;
    const subjectHeader = controlModule === 'homework' ? homeworkTabs() : '';
    shell(selection ? '选择学生' : controlLabels[controlModule], `<div class="parity-context">${selectedTeacherClass}${selection ? ' · 可多选' : ''}</div>${subjectHeader}${selection ? '' : defaultCard()}${reset ? `<div class="control-actions">${reset}</div>` : ''}${listHead}${filters}<div class="parity-student-list" id="parity-student-rows">${studentRows()}</div>`, 'parity.back()', selection ? selectionFooter() : '', selection ? 'control-student-screen' : '');
  }
  function teacherClassPage() {
    const refs = classRefs(), students = R.resolve(controlData, refs).map(({ student }) => student);
    const count = students.length, subjectHeader = controlModule === 'homework' ? homeworkTabs() : '';
    const overview = scopeOverview(refs, controlModule).join(' · ');
    let actions = '';
    if (controlModule === 'lock') {
      const locked = students.filter(isLocked).length;
      actions = canEdit('lock') ? teacherLockAction(locked, count) : '<p class="parity-note">学校正在临时锁屏，暂时不能修改本班锁屏。</p>';
    } else if (controlModule === 'duration') {
      actions = canEdit('duration') && count ? button('设置本班使用时长', 'parity.editClass()') : `<p class="parity-note">${count ? '使用时长由班主任和学校管理员设置，当前仅可查看。' : '本班暂无可管控班级'}</p>`;
    } else if (controlModule === 'homework') {
      actions = count ? button('设置本班查看权限', 'parity.editClass()') : '';
    } else if (controlModule === 'world') {
      const open = students.every(student => student.world);
      actions = count ? button(open ? '关闭' : '开放', `parity.toggleClassWorld(${!open})`, open) : '';
    }
    const durationGroups = controlModule === 'duration' ? [...new Set(students.map(student => JSON.stringify(R.durationGroups(student))))] : [];
    const durationSummary = durationGroups.length > 1 ? '<p>本班当前规则有差异，整班设置后统一生效。</p>' : students.length ? R.durationGroups(students[0]).map(text => `<p>${esc(text.replace(/单独规则 · /g, ''))}</p>`).join('') : '';
    shell(controlLabels[controlModule], `<div class="parity-context">${esc(selectedTeacherClass)}</div>${subjectHeader}<section class="control-module-panel teacher-class-control"><h3>${esc(selectedTeacherClass)}当前状态</h3>${controlModule === 'duration' ? '' : `<p class="parity-note">${esc(overview || '暂无可管控班级')}</p>`}${controlModule === 'duration' ? `<div class="teacher-class-rule-summary">${durationSummary}</div>` : ''}<div class="control-actions">${actions}${button('按学生设置', 'parity.showIndividuals()', true)}</div></section>`, 'parity.back()');
  }
  function selectedStudentsSummary(editor){return '<button type="button" class="control-student-field" onclick="parity.pickEditorStudents()"><span>选择学生 <em>*</em></span><span>'+ (editor.refs.length?'已选 '+editor.refs.length+' 名学生':'请选择学生')+' <i aria-hidden="true">›</i></span></button>';}
  function inheritedHomeworkPermission(data=controlData){
    const grade=selectedTeacherClass.match(/^[一二三四五六七八九]+年级/)?.[0];
    const policy=(data.schoolSettings?.adminPolicies?.homework||[]).find(p=>p.grades.includes(grade));
    return {answer:!!policy?.answer,explanation:!!policy?.explanation};
  }
  function teacherInheritedRuleCard(module){
    const grade=selectedTeacherClass.match(/^[一二三四五六七八九]+年级/)?.[0];
    if(module==='homework'){
      const policy=(controlData.schoolSettings?.adminPolicies?.homework||[]).find(p=>p.grades.includes(grade)),value=inheritedHomeworkPermission();
      return card(policy?'年级规则':'学校默认规则','<div class="inherited-permission-values"><p>答案：'+(value.answer?'允许查看':'不允许查看')+'</p><p>解析：'+(value.explanation?'允许查看':'不允许查看')+'</p></div>');
    }
    const stopped=controlData.schoolSettings?.adminWorldClasses?.[selectedTeacherClass]===true;
    return card(stopped?'年级规则':'学校默认规则','<p>万象视界：'+(stopped?'停止使用':'允许使用')+'</p>');
  }
  function homeworkControlPage(){
    const students=controlStudents(),subject=ui.homeworkDrill&&managedHomeworkSubjects().includes(ui.homeworkDrill)?ui.homeworkDrill:null;
    if(subject&&window.controlRuleFormUI&&controlWorkView==='homeroom'){
      const F=controlRuleFormUI,rules=teacherHomeworkGroups();
      const body='<p class="parity-context">'+esc(selectedTeacherClass)+' · '+esc(subject)+'</p>'+teacherInheritedRuleCard('homework')+rules.map((g,i)=>'<section class="control-module-panel rule-form-card"><h3>规则'+(i+1)+'</h3>'+F.row('适用学生','已选 '+g.students.length+' 名学生','<button type="button" class="rule-form-link" onclick="parity.showHomeworkStudents('+i+')">查看学生</button>')+F.row('适用科目',subject)+F.row('查看答案',g.value.answer?'允许':'不允许')+F.row('查看详解',g.value.explanation?'允许':'不允许')+F.actions('parity.editHomeworkRule('+i+')','parity.removeHomeworkRule('+i+')')+'</section>').join('')+(!rules.length?'<p class="control-empty">暂无自定义规则</p>':'');
      shell('智阅作业',body,'parity.closeHomeworkSubject()','<footer class="control-fixed-select rule-form-footer">'+button('新增学生规则',"parity.chooseDurationStudents('homework')",false,!students.length)+'</footer>','school-mobile rule-form-screen');return;
    }
    if(subject){
      const baseline=inheritedHomeworkPermission(),different=students.filter(s=>{const value=R.homeworkValue(s,subject);return value.answer!==baseline.answer||value.explanation!==baseline.explanation;});
      const rows=different.map(s=>`<div class="daily-lock-row homework-exception-row"><b>${esc(s.name)}</b><div class="homework-inline-permissions">${homeworkSwitch(s,'answer','答案')}${homeworkSwitch(s,'explanation','解析')}</div></div>`).join('');
      shell(subject+'作业权限',`<div class="parity-context">${esc(selectedTeacherClass)}</div>${teacherInheritedRuleCard('homework')}<section class="control-module-panel"><h3>学生权限（${different.length}人）</h3>${rows||'<p class="parity-note">暂无与默认规则不同的学生</p>'}</section>`,'parity.closeHomeworkSubject()',`<footer class="control-fixed-select">${button('设置学生权限',"parity.chooseDurationStudents('homework')",false,!students.length)}</footer>`,'school-mobile');return;
    }
    const cards=(subject?[subject]:managedHomeworkSubjects()).map(name=>'<article class="homework-subject-card">'+(!subject?'<button type="button" class="homework-subject-entry" onclick="parity.openHomeworkSubject(\''+name+'\')">':'')+'<h3>'+esc(name)+'</h3>'+(!subject?'<span aria-hidden="true">›</span></button>':'')+'<div class="duration-parameter-list">'+[['answer','允许查看答案'],['explanation','允许查看详解']].map(([key,title])=>'<span>'+title+'<b>'+students.filter(s=>R.homeworkValue(s,name)[key]).length+'/'+students.length+' 人</b></span>').join('')+'</div></article>').join('');
    shell(subject?subject+'作业权限':'智阅作业管控',`<div class="parity-context">${esc(selectedTeacherClass)}</div><section class="control-module-panel"><h3>${subject?'当前科目权限':'智阅作业权限'}</h3>${cards}</section>`,subject?'parity.closeHomeworkSubject()':'parity.back()',subject?`<footer class="control-fixed-select">${button('设置学生权限',"parity.chooseDurationStudents('homework')",false,!students.length)}</footer>`:'','school-mobile');
  }
  function teacherHomeworkGroups(){
    const subject=homeworkSubject(),baseline=inheritedHomeworkPermission(),groups=[];
    controlStudents().filter(student=>studentHasRule(student,'homework',subject)||['answer','explanation'].some(k=>R.homeworkValue(student,subject)[k]!==baseline[k])).forEach(student=>{const value=R.homeworkValue(student,subject);let group=groups.find(g=>g.value.answer===value.answer&&g.value.explanation===value.explanation);if(!group){group={value,students:[]};groups.push(group);}group.students.push(student);});return groups;
  }
  function worldControlPage(){const stopped=controlStudents().filter(s=>!s.world);const rows=stopped.map(s=>`<div class="daily-lock-row"><b>${esc(s.name)}</b><button type="button" class="daily-unlock-icon" onclick="parity.restoreStudentWorld(${esc(JSON.stringify(s.id))})" aria-label="恢复${esc(s.name)}使用万象视界"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 10V7a4 4 0 0 1 7.5-2M6 10h12v11H6zM12 14v3"/></svg><span>恢复使用</span></button></div>`).join('');shell('万象视界',`<div class="parity-context">${esc(selectedTeacherClass)}</div>${teacherInheritedRuleCard('world')}<section class="control-module-panel"><h3>已停止使用学生（${stopped.length}人）</h3>${rows||'<p class="parity-note">暂无已停止使用学生</p>'}</section>`,'parity.back()',`<footer class="control-fixed-select">${button('选择停止使用学生','parity.chooseWorldStudents()',false,!controlStudents().some(s=>s.world))}</footer>`,'school-mobile');}
  function worldPickerRows(){const p=ui.worldPicker;if(!p)return '';return controlStudents().filter(s=>s.world&&(s.name.includes(p.query)||String(s.id).includes(p.query))).map(s=>`<label class="daily-lock-row"><b>${esc(s.name)}</b><input type="checkbox" aria-label="选择${esc(s.name)}" value="${esc(s.id)}" ${p.ids.has(String(s.id))?'checked':''} onchange="parity.selectWorldStudent(this.value,this.checked)"></label>`).join('')||'<p class="parity-note">没有可选学生</p>';}
  function studentHasRule(student,module,subject){return module==='duration'?[0,1,2,3,4,5,6].some(day=>!R.durationDays(student,[day],'unmodified').length):R.modified(student,homeworkModule(subject));}
  function selectableRuleStudents(draft){return controlStudents().filter(student=>draft.originalIds?.has(String(student.id))||!studentHasRule(student,draft.module,draft.subject));}
  function durationSelectionRows(){
    const draft=ui.durationSelection;if(!draft)return '';
    const allowed=new Set(selectableRuleStudents(draft).map(s=>String(s.id)));
    return controlStudents().filter(s=>s.name.includes(draft.query)||String(s.id).includes(draft.query)).map(s=>{
      const disabled=!allowed.has(String(s.id));
      return `<label class="daily-lock-row${disabled?' control-student-unavailable':''}"><span><b>${esc(s.name)}</b>${disabled?'<small>已设置规则</small>':''}</span><input type="checkbox" aria-label="选择${esc(s.name)}" value="${esc(s.id)}" ${draft.ids.has(String(s.id))&&!disabled?'checked':''} ${disabled?'disabled':''} onchange="parity.selectDurationStudent(this.value,this.checked)"></label>`;
    }).join('')||'<p class="parity-note">没有匹配学生</p>';
  }
  function durationRosterRows(){
    const roster=ui.durationRoster;if(!roster)return '';
    const query=roster.query.trim().toLocaleLowerCase();
    const students=roster.students.filter(s=>s.name.toLocaleLowerCase().includes(query)||String(s.id).includes(query));
    return students.map(s=>'<span role="listitem">'+esc(s.name)+'</span>').join('')||'<p class="duration-roster-empty" role="status">没有匹配学生</p>';
  }
  function gradeDurationWeek(data=controlData,className=selectedTeacherClass){
    const week=R.durationWeek({durationRules:[]}),grade=className.match(/^[一二三四五六七八九]+年级/)?.[0];
    if(data.schoolSettings?.durationRulesEnabled!==false)(data.schoolSettings?.adminPolicies?.duration||[]).filter(p=>p.grades.includes(grade)).forEach(p=>p.groups.forEach(g=>g.weekdays.forEach(day=>week.dailySettings[day]=R.copy(g.value))));
    return week;
  }
  function schoolEnabledDurationSummary(){
    if(controlData.schoolSettings?.durationRulesEnabled===false)return '';
    const grade=selectedTeacherClass.match(/^[一二三四五六七八九]+年级/)?.[0];
    return (controlData.schoolSettings?.adminPolicies?.duration||[]).filter(p=>p.grades.includes(grade)).flatMap(p=>p.groups).map(g=>'<p>'+esc(R.dayText(g.weekdays))+'：连续'+g.value.continuousMinutes+'分钟 · 休息'+g.value.restMinutes+'分钟 · 每日'+g.value.dailyMinutes+'分钟 · '+(g.value.periods.length?g.value.periods.map(p=>esc(p.start)+'–'+esc(p.end)).join('、'):'全天可用')+'</p>').join('');
  }
  function matchesGradeDuration(rule,data){
    if(data.schoolSettings?.durationDefaultEnabled===false){const days=data.schoolSettings.durationRulesEnabled===false?[]:(data.schoolSettings.adminPolicies?.duration||[]).filter(p=>p.grades.includes(selectedTeacherClass.match(/^[一二三四五六七八九]+年级/)?.[0])).flatMap(p=>p.groups.flatMap(g=>g.weekdays));if(new Set(days).size<7)return false;}
    const values=week=>[0,1,2,3,4,5,6].map(day=>{const v=week.dailySettings[day];return [Number(v.continuousMinutes),Number(v.restMinutes),Number(v.dailyMinutes),(v.periods||[]).map(p=>[p.start,p.end]).sort((a,b)=>a[0].localeCompare(b[0]))];});
    return JSON.stringify(values(R.durationWeek({durationRules:[rule]})))===JSON.stringify(values(gradeDurationWeek(data)));
  }
  function durationRuleSummary(week){return R.settingGroups(week,'duration').map(g=>'<div class="duration-rule-summary"><p>'+esc(R.dayText(g.weekdays))+'</p><div class="duration-parameter-list">'+[['continuousMinutes','连续使用'],['restMinutes','休息'],['dailyMinutes','每日上限']].map(([key,title])=>'<span>'+title+'<b>'+esc(g.value[key])+'分钟</b></span>').join('')+'</div><p class="duration-period-summary">可用时段：'+(g.value.periods.length?g.value.periods.map(p=>esc(p.start)+'–'+esc(p.end)).join('、'):'全天可用')+'</p></div>').join('');}
  function compactDurationSummary(week){
    return R.settingGroups(week,'duration').map(g=>'<div class="duration-compact-group"><span class="duration-day-label">'+esc(R.dayText(g.weekdays))+'</span><p class="duration-compact-values">'+[['continuousMinutes','连续'],['restMinutes','休息'],['dailyMinutes','每日上限']].map(([key,label])=>'<span>'+label+' <b>'+esc(g.value[key])+'分钟</b></span>').join('<i aria-hidden="true">·</i>')+'</p><p class="duration-compact-periods">可用时段：'+(g.value.periods.length?g.value.periods.map(p=>esc(p.start)+'–'+esc(p.end)).join('、'):'全天可用')+'</p></div>').join('');
  }
  function teacherDurationGroups(){const grouped=new Map();controlStudents().filter(s=>[0,1,2,3,4,5,6].some(day=>!R.durationDays(s,[day],'unmodified').length)).forEach(s=>{const week=R.durationWeek({...R.copy(s),durationTeacherPaused:false}),key=JSON.stringify(week.dailySettings);if(!grouped.has(key))grouped.set(key,{week,students:[]});grouped.get(key).students.push(s);});return [...grouped.values()];}
  function durationPage(){
    const students=controlStudents(),enabled=controlData.schoolSettings?.durationClassEnabled?.[selectedTeacherClass]!==false,editable=canEdit('duration');
    const rules=teacherDurationGroups().map((g,i)=>window.controlRuleFormUI&&controlWorkView==='homeroom'?'<article class="rule-form-card"><h3>规则'+(i+1)+'</h3>'+controlRuleFormUI.row('适用学生','已选 '+g.students.length+' 名学生','<button type="button" class="rule-form-link" onclick="parity.showDurationStudents('+i+')">查看学生</button>')+controlRuleFormUI.groups(R.settingGroups(g.week,'duration'))+controlRuleFormUI.actions('parity.editStudentDuration('+i+')','parity.removeStudentDuration('+i+')',!editable)+'</article>':'<article class="duration-compact-card"><div class="duration-compact-heading"><div class="duration-compact-students"><span>适用学生 '+g.students.length+' 人</span><button type="button" class="duration-view-students" onclick="parity.showDurationStudents('+i+')">查看学生 ›</button></div><div class="duration-compact-actions">'+button('编辑','parity.editStudentDuration('+i+')',true,!editable)+button('删除','parity.removeStudentDuration('+i+')',true,!editable).replace('control-secondary','control-secondary parity-danger')+'</div></div>'+compactDurationSummary(g.week)+'</article>').join('');
    shell('使用时长管控',`<div class="parity-context">${esc(selectedTeacherClass)}</div><section class="control-module-panel"><h3>年级规则</h3>${controlData.schoolSettings?.durationDefaultEnabled===false?'<p class="parity-note">学校默认规则已关闭，未配置星期不执行学校时长限制。</p>'+schoolEnabledDurationSummary():durationRuleSummary(gradeDurationWeek())}</section><section class="control-module-panel school-weekly-settings"><div class="school-panel-heading"><h3>使用时长规则</h3><button type="button" class="school-weekly-switch" role="switch" aria-label="本班使用时长规则" aria-checked="${enabled}" ${!editable||!students.length?'disabled':''} onclick="parity.toggleClassDuration(${!enabled})"><span aria-hidden="true"></span></button></div>${!enabled?'<p class="parity-note">学生规则已关闭，年级规则仍生效。</p>':''}<fieldset class="school-weekly-rules" ${!enabled?'disabled':''}>${rules||'<p class="parity-note">暂无自定义规则</p>'}</fieldset></section>${editable&&!(window.controlRuleFormUI&&controlWorkView==='homeroom')?'<div class="school-weekly-add-below">'+button('新增学生规则',"parity.chooseDurationStudents('duration')",false,!enabled||!students.length)+'</div>':''}`,'parity.back()',window.controlRuleFormUI&&controlWorkView==='homeroom'&&editable?'<footer class="control-fixed-select rule-form-footer">'+button('新增学生规则',"parity.chooseDurationStudents('duration')",false,!enabled||!students.length)+'</footer>':'','school-mobile'+(window.controlRuleFormUI&&controlWorkView==='homeroom'?' rule-form-screen':''));
  }

  function ruleCards(student) {
    if (controlModule === 'duration') return R.durationGroups(student).map(text=>'<p>'+esc(text)+'</p>').join('');
    const rules = controlModule === 'borrowing' ? student.schedules : student.durationRules;
    return rules.map(rule => `<article class="parity-rule"><b>${esc(controlModule === 'borrowing' ? R.borrowText(rule) : R.dayText(rule.weekdays))}</b>${controlModule === 'borrowing' && rule.mode === 'dates' ? `<span class="parity-rule-status">${R.borrowStatus(rule)}</span>` : ''}${controlModule === 'duration' ? `<p>${esc(R.durationText(rule.useDefault ? R.defaultDuration : rule))}</p>` : ''}<div class="parity-rule-actions">${controlModule === 'borrowing' && R.borrowStatus(rule) === '已失效' ? '' : ruleIconButton('edit', `parity.editStudentRule(${student.id},'${rule.id}')`)}${ruleIconButton('delete', `parity.deleteStudentRule(${student.id},'${rule.id}')`)}</div></article>`).join('') || `<p class="parity-note">${controlModule === 'borrowing' ? '未设置借用规则，暂不能借用。' : '未单独设置，使用学校默认规则。'}</p>`;
  }
  function detailPage() {
    const student = controlStudents().find(s => s.id === controlStudentDetailId);
    if (!student) { controlView = 'module'; return renderControl(); }
    let footer = '';
    let body = `<section class="control-student-detail-card"><div class="control-student-detail-name"><h3>${esc(student.name)}</h3></div><div class="control-student-detail-content">${summary(student).map(text => `<p>${esc(text)}</p>`).join('')}${modifiedInfo(student)}</div>`;
    if (controlModule === 'borrowing' || controlModule === 'duration') {
      if (controlModule === 'borrowing') { const effective = R.effectiveBorrow(student, R.today(), schoolBorrowingEnabled); body += `<p class="parity-note">今日生效：${esc(effective.reason || R.periodText(effective))}</p>`; }
      body += ruleCards(student);
      if (controlModule === 'borrowing') footer = `<footer class="borrow-editor-actions parity-detail-actions">${button('新增借用规则', `openControlEditor(${student.id})`, false, !schoolBorrowingEnabled)}</footer>`;
      if (controlModule === 'duration' && canEdit()) footer = `<footer class="borrow-editor-actions parity-detail-actions">${button('设置使用时长', `openControlEditor(${student.id})`)}</footer>`;
    } else if (controlModule === 'homework') body += `<span class="homework-inline-permissions">${homeworkSwitch(student, 'answer', '答案')}${homeworkSwitch(student, 'explanation', '详解')}</span>`;
    else if (controlModule === 'lock' && controlDemoRole === 'admin') {
      const active = ownTemporaryLock(studentLockKey({ className: selectedTeacherClass, id: student.id }));
      body += button(active ? '解除临时锁屏' : '临时锁屏', `parity.studentTemporaryLock(${student.id})`, active);
    } else if (controlModule === 'world' && controlDemoRole !== 'admin') {
      body += lockToggle('world', student.world, `confirmControl(${student.id},${!student.world})`, (student.world ? '关闭' : '开启') + student.name + '的万象视界');
    } else { const value = controlModule === 'lock' ? !isLocked(student) : !student.world; body += button(controlModule === 'lock' ? value ? '锁屏平板' : '解锁平板' : '设置使用状态', `confirmControl(${student.id},${value})`, false, controlModule === 'lock' && refLocked({ className: selectedTeacherClass, id: student.id })); }
    shell(controlLabels[controlModule] + '详情', `<div class="parity-context">${selectedTeacherClass}</div>${body}</section>`, "controlView='module';renderControl()", footer);
  }
  function schoolBorrowPage() {
    const rules = controlData.schoolSettings?.borrowingRules || [];
    const sections = [['weekly', '每周固定借用规则', '每周在所选时间可借用。'], ['dates', '指定日期借用规则', '所选日期优先执行，到期或删除后恢复每周规则。']].map(([mode, title, note]) => {
      const items = rules.filter(rule => rule.mode === mode);
      return `<section class="parity-borrow-section" aria-label="${title}"><div class="parity-borrow-heading"><h3>${title}</h3></div><p class="parity-note">${note}</p>${items.map(rule => `<article class="parity-rule"><b>${esc(R.borrowText(rule))}</b>${rule.mode === 'dates' ? `<span class="parity-rule-status">${R.borrowStatus(rule)}</span>` : ''}<div class="parity-rule-actions">${R.borrowStatus(rule) === '已失效' ? '' : ruleIconButton('edit', "parity.schoolBorrowEdit('" + rule.id + "')", !schoolBorrowingEnabled)}${ruleIconButton('delete', "parity.schoolBorrowDelete('" + rule.id + "')", !schoolBorrowingEnabled)}</div></article>`).join('') || '<p class="parity-borrow-empty">尚未设置' + title + '</p>'}</section>`;
    }).join('');
    const content = `<p class="parity-note">${canEdit() ? '无有效规则时不能借用。' : '由学校管理员统一设置，仅可查看。'}</p>${sections}`;
    shell('柜机借用管控', content, 'leaveControlCenter()', canEdit() ? `<div class="parity-borrow-floating">${button('＋ 新增规则', 'parity.newBorrowRule()')}</div>` : '', 'parity-school-borrow');
  }
  function studentLockPage(){
    const students=controlStudents(),locked=students.filter(s=>s.locked),blocked=!canEdit('lock');
    const rows=locked.map(s=>`<div class="daily-lock-row"><div><b>${esc(s.name)}</b></div><button type="button" class="daily-unlock-icon" title="解锁" aria-label="解锁${esc(s.name)}" onclick="parity.unlockStudent(${esc(JSON.stringify(s.id))})" ${blocked?'disabled':''}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 10V7a4 4 0 0 1 7.5-2M6 10h12v11H6zM12 14v3"/></svg><span>解锁</span></button></div>`).join('');
    shell('平板锁屏',`<section class="control-module-panel"><div class="daily-lock-heading"><h3>已锁屏学生（${locked.length}人）</h3></div>${rows||'<p class="parity-note">暂无已锁屏学生</p>'}</section>`,'leaveControlCenter()',`<footer class="control-fixed-select">${button('选择锁屏学生','parity.chooseLockStudents()',false,blocked||locked.length===students.length)}</footer>`);
  }
  function lockPickerRows(){
    const picker=ui.lockPicker;if(!picker)return '';
    const students=controlStudents().filter(s=>!s.locked&&(s.name.includes(picker.query)||String(s.id).includes(picker.query)));
    return students.map(s=>`<label class="daily-lock-row"><span><b>${esc(s.name)}</b></span><input type="checkbox" aria-label="选择${esc(s.name)}" value="${esc(s.id)}" ${picker.ids.has(String(s.id))?'checked':''} onchange="parity.toggleLockStudent(this.value,this.checked)"></label>`).join('')||'<p class="parity-note">没有可选学生</p>';
  }
  function renderControl() {
    normalizeWorld(controlData);
    if (!renderingDemo && !window.controlPageDemo?.isActive() && controlWorkView === 'homeroom' && controlModule === 'duration' && !ui.editor) controlData = loadLatest();
    if (typeof renderControlAvailability === 'function' && renderControlAvailability()) return;
    if (window.borrowing && controlModule === 'borrowing' && !['entry', 'home'].includes(controlView)) return borrowing.render();
    if (controlDemoRole !== 'admin' && controlModule === 'borrowing') {
      ui.editor = null; ui.pending = null; controlView = 'entry';
      return renderEntry();
    }
    if(controlDemoRole!=='admin'&&controlModule==='lock'){if(controlView==='studentLocks')return studentLockPage();controlView='entry';return renderEntry();}
    if (controlView === 'entry' || controlView === 'home') return renderEntry();
    if (controlView === 'ruleEditor') return renderEditor();
    if (controlDemoRole !== 'admin' && controlView === 'studentDetail' && !['homework','world'].includes(controlModule)) return detailPage();
    if (controlModule === 'borrowing') return schoolBorrowPage();
    if (controlDemoRole === 'admin') {
      adminLevel = 'school';
      if (controlView === 'students' || controlView === 'studentDetail') { controlView = 'module'; controlSelected.clear(); }
      return scopePage();
    }
    if(controlModule==='homework'){controlView='module';return homeworkControlPage();}
    if(controlModule==='world'){controlView='module';return worldControlPage();}
    if (controlView === 'individuals'&&controlModule==='duration'){controlView='module';return durationPage();}
    if (controlView === 'individuals') return studentPage();
    if (controlModule === 'lock') return studentPage();
    if (controlView === 'students') { controlView = 'module'; controlSelected.clear(); }
    if(controlModule==='duration')return durationPage();
    teacherClassPage();
  }
  function scopeFields(editor) {
    if (controlModule === 'borrowing') return '<p class="control-form-note">默认对全校班级生效。</p>';
    const duration = controlModule === 'duration';
    return needScope(editor.refs) ? `<fieldset class="parity-apply-scope"><legend>本次修改哪些班级？</legend><label><input type="radio" name="parity-apply-scope" value="all" ${editor.scope === 'all' ? 'checked' : ''}>修改${editor.label === '全校' ? '全校' : '所选范围的'}所有班级<small>将替换${duration ? '班主任在所选星期' : '老师此前'}的设置。</small></label><label><input type="radio" name="parity-apply-scope" value="unmodified" ${editor.scope === 'unmodified' ? 'checked' : ''}>保留${duration ? '班主任' : '老师'}的设置，修改其他班级<small>${duration ? '班主任已设置的星期保持不变。' : '老师已设置的班级保持不变。'}</small></label></fieldset>` : '';
  }
  function daysFields(value) { return `<div class="control-weekdays" id="parity-days">${['一', '二', '三', '四', '五', '六', '日'].map((label, day) => `<button type="button" data-day="${day}" aria-pressed="${value.includes(day)}" onclick="this.setAttribute('aria-pressed',this.getAttribute('aria-pressed')!=='true')">${label}</button>`).join('')}</div>`; }
  function periodFields(value) { return `<div id="parity-periods" class="control-period-list">${value.map((period, index) => periodRow(period, index)).join('')}</div><button class="control-add-period" onclick="parity.addPeriod()">＋ 添加时段</button>`; }
  function periodRow(period, index) { return `<div class="control-period-row" data-period-row><input type="time" aria-label="第${index + 1}个时段开始时间" value="${period.start}"><span>至</span><input type="time" aria-label="第${index + 1}个时段结束时间" value="${period.end}"><button type="button" class="control-period-remove" aria-label="删除第${index + 1}个时段" onclick="this.closest('[data-period-row]').remove()"><svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M9 6V4h6v2M5 6l1 14h12l1-14M10 10v6M14 10v6"/></svg></button></div>`; }
  function collectEditor() {
    const editor = ui.editor, form = document.getElementById('parity-rule-form');
    if (!editor || !form) return;
    if (editor.subjectValues) {
      form.querySelectorAll('[data-homework-subject]:checked').forEach(input => {
        if(editor.subjects.includes(input.dataset.homeworkSubject)&&['answer','explanation'].includes(input.dataset.homeworkField))editor.subjectValues[input.dataset.homeworkSubject][input.dataset.homeworkField] = input.value;
      });
      return;
    }
    if (controlModule === 'duration' && editor.rule.dailySettings) {
      form.querySelectorAll('[data-duration-group]').forEach(section => {
        const group = editor.rule.settingGroups[section.dataset.durationGroup], setting = group.value;
        group.weekdays = [...section.querySelectorAll('[data-group-day]:checked')].map(input => Number(input.value));
        ['continuousMinutes', 'restMinutes', 'dailyMinutes'].forEach(key => { setting[key] = Number(section.querySelector('[data-duration-field="' + key + '"]').value); });
        setting.periods = [...section.querySelectorAll('[data-period-row]')].map(row => { const fields = row.querySelectorAll('input'); return { start: fields[0].value, end: fields[1].value }; });
      });
      editor.rule = R.expandSettingGroups(editor.rule, editor.rule.settingGroups, 'duration');
      editor.scope = 'all'; return;
    }
    const days = [...form.querySelectorAll('#parity-days [aria-pressed=true]')].map(node => Number(node.dataset.day));
    editor.scope = schoolDateRule(editor) ? 'all' : form.querySelector('[name=parity-apply-scope]:checked')?.value || null;
    const periodRows = [...form.querySelectorAll('#parity-periods [data-period-row]')].map(row => { const inputs = row.querySelectorAll('input'); return { start: inputs[0].value, end: inputs[1].value }; });
    if (controlModule === 'borrowing') {
      editor.rule.weekdays = days;
      editor.rule.startDate = form.querySelector('#parity-date-start')?.value || editor.rule.startDate;
      editor.rule.endDate = form.querySelector('#parity-date-end')?.value || editor.rule.endDate;
      editor.rule.deny = editor.rule.mode === 'dates';
      if (editor.rule.deny) editor.rule.periods = [];
      if (form.querySelector('#parity-periods')) editor.rule.periods = periodRows;
    } else if (controlModule === 'duration') {
      editor.rule.weekdays = days;
      if (!editor.rule.useDefault) {
        ['continuousMinutes', 'restMinutes', 'dailyMinutes'].forEach(key => editor.rule[key] = Number(form.querySelector('#parity-' + key).value));
        editor.rule.periods = periodRows;
      }
    } else {
      editor.value.answer = form.querySelector('[name=parity-answer]:checked')?.value;
      editor.value.explanation = form.querySelector('[name=parity-explanation]:checked')?.value;
    }
  }
  function durationIsDefault(rule) {
    if (rule.dailySettings) return Object.values(rule.dailySettings).every(setting => ['continuousMinutes','restMinutes','dailyMinutes'].every(key => setting[key] === R.defaultDuration[key]) && !setting.periods.length);
    const defaults = R.defaultDuration;
    return JSON.stringify([...(rule.weekdays || [])].sort()) === JSON.stringify([...defaults.weekdays].sort())
      && ['continuousMinutes', 'restMinutes', 'dailyMinutes'].every(key => Number(rule[key]) === defaults[key])
      && (rule.periods || []).length === 0;
  }
  function updateDefaultButton() {
    if (controlModule !== 'duration' || !ui.editor) return;
    collectEditor();
    const button = document.getElementById('parity-fill-default');
    if (button) button.disabled = durationIsDefault(ui.editor.rule);
  }
  const homeworkPermissionFields = editor => [['answer', '查看答案'], ['explanation', '查看详解']].map(([key, label]) => `<fieldset class="parity-permission"><legend>${label}</legend>${[['true', '允许'], ['false', '不允许']].map(([value, text]) => `<label><input type="radio" name="parity-${key}" value="${value}" ${String(editor.value[key]) === value ? 'checked' : ''}>${text}</label>`).join('')}</fieldset>`).join('');
  function renderDurationEditor(editor) {
    const rule = editor.rule;
    rule.settingGroups ||= durationIsDefault(rule) ? [] : R.settingGroups(rule,'duration');
    const days = rule.settingGroups.map((group,day) => {
      const setting = group.value, name = '时段组' + (day+1);
      const choices=[0,1,2,3,4,5,6].map(value => '<label><input type="checkbox" data-group-day value="' + value + '" ' + (group.weekdays.includes(value)?'checked ':'') + (rule.settingGroups.some((other,index)=>index!==day && other.weekdays.includes(value))?'disabled ':'') + ' onchange="parity.durationGroupChanged()">' + ['一','二','三','四','五','六','日'][value] + '</label>').join('');
      return '<section class="control-form-section" data-duration-group="' + day + '"><div class="control-group-heading"><h3>' + name + '</h3>' + (rule.settingGroups.length>1?'<button type="button" class="control-group-delete" aria-label="删除第'+(day+1)+'组" onclick="parity.removeDurationGroup('+day+')">'+"<svg viewBox=\"0 0 24 24\" aria-hidden=\"true\"><path d=\"M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 10v7M14 10v7\"/></svg>"+'</button>':'') + '</div><div class="school-weekdays school-weekdays-compact"><span class="school-weekday-caption">选择星期：</span>' + choices + '</div>' +
        [['continuousMinutes','连续使用时长'],['restMinutes','休息时长'],['dailyMinutes','每日累计总时长']].map(([key,label]) => '<div class="control-number-row duration-number-row"><label for="duration-' + day + '-' + key + '">' + label + '</label><div class="duration-number-control"><div class="duration-stepper"><button type="button" data-step-minus aria-label="减少'+label+'" onclick="controlDurationStep(this,-1)" '+(setting[key]<=1?'disabled':'')+'>−</button><input id="duration-' + day + '-' + key + '" aria-label="' + name + label + '" data-duration-field="' + key + '" type="number" inputmode="numeric" min="1" step="1" value="' + setting[key] + '" oninput="controlDurationInput(this)"><button type="button" aria-label="增加'+label+'" onclick="controlDurationStep(this,1)">＋</button></div><small>分钟</small></div></div>').join('') +
        '<div class="control-period-heading">可用时段 <small>未设置则全天可用</small></div><div class="control-period-list">' + setting.periods.map((p,j)=>'<div class="control-period-row" data-period-row><input type="hidden" value="'+p.start+'"><input type="hidden" value="'+p.end+'"><button type="button" class="school-period-value" onclick="parity.pickDurationPeriod('+day+','+j+')">'+p.start+' 至 '+p.end+' ›</button><button type="button" class="control-period-remove" aria-label="删除时段" onclick="this.closest(\'[data-period-row]\').remove()"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"><path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 10v7M14 10v7"/></svg></button></div>').join('') + '</div>' + '<button type="button" class="weekly-editor-icon" title="添加时段" aria-label="添加时段" onclick="parity.pickDurationPeriod('+day+')"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg></button>' + '<p class="control-form-note">不设时段，全天可用，仍受时长限制。</p>'   + '</section>';
    }).join('');
    const selectionSummary=selectedStudentsSummary(editor);
    const form = '<div id="parity-rule-form">'+selectionSummary+(editor.durationMixed?'<p class="parity-note duration-mixed-note">所选学生规则有差异，保存后按本次设置统一生效。</p>':'')+days+'<div class="control-add-group">'+button('添加时段组','parity.addDurationGroup()',true,rule.settingGroups.flatMap(group=>group.weekdays).length>=7)+'</div><p id="parity-error" class="control-error" role="alert"></p></div>';
    app.innerHTML = '<main class="screen control-screen borrow-editor-screen school-mobile">' + pageTop('设置使用时长规则','parity.cancelEditor()') + '<section class="borrow-editor-content">' + form + '</section><footer class="borrow-editor-actions parity-editor-actions">' + button('取消','parity.cancelEditor()',true) + button('保存','parity.saveEditor()') + '</footer><div id="control-overlay"></div><div id="control-toast" role="status"></div></main>';
    const formNode = document.getElementById('parity-rule-form');
    ['input', 'change'].forEach(event => formNode?.addEventListener?.(event, updateDefaultButton));
    syncReview();
  }
  function renderEditor() {
    const editor = ui.editor;
    if(window.controlRuleFormUI&&controlWorkView==='homeroom'&&controlDemoRole!=='admin'&&editor&&['duration','homework'].includes(controlModule))return controlRuleFormUI.teacherEditor(editor,renderEditor);
    if (!editor) { controlView = 'module'; return renderControl(); }
    if (controlModule === 'duration' && editor.rule.dailySettings) return renderDurationEditor(editor);
    if (editor.subjectValues) {
      const fields = editor.subjects.map(subject => `<section class="homework-subject-card"><h3>${esc(subject)}</h3>${[['answer','查看答案'],['explanation','查看详解']].map(([field,label]) => `<div class="homework-subject-setting"><span>${label}</span><div class="homework-setting-options" role="radiogroup" aria-label="${esc(subject)}${label}">${[['true','允许'],['false','不允许']].map(([value,text]) => `<label><input type="radio" name="homework-${subject}-${field}" data-homework-subject="${esc(subject)}" data-homework-field="${field}" value="${value}" ${editor.subjectValues[subject][field] === value ? 'checked' : ''}><span>${text}</span></label>`).join('')}</div></div>`).join('')}</section>`).join('');
      return shell('设置智阅作业查看权限', `<div id="parity-rule-form" class="homework-subject-form">${selectedStudentsSummary(editor)}<p class="parity-context">科目：${esc(editor.subjects[0])}</p>${fields||'<p class="parity-note">请选择科目</p>'}<p id="parity-error" class="control-error" role="alert"></p></div>`, 'parity.cancelEditor()', `<footer class="borrow-editor-actions parity-editor-actions">${button('取消', 'parity.cancelEditor()', true)}${button('保存并生效', 'parity.saveEditor()')}</footer>`, 'homework-subject-screen school-mobile');
    }
    if (editor.modal) {
      const form = `<p class="control-scope">${esc(editor.label)} · ${selectedStudentsLink(editor.refs)}</p><div id="parity-rule-form">${homeworkPermissionFields(editor)}${button('恢复全校默认规则', 'parity.fillDefault()', true)}${scopeFields(editor)}<p id="parity-error" class="control-error" role="alert"></p></div>`;
      return controlOverlay('设置智阅作业', form, button('取消', 'parity.cancelEditor()', true) + button('保存', 'parity.saveEditor()'));
    }
    const rule = editor.rule;
    let form = `<p class="control-scope">${esc(editor.label)}${controlModule === 'homework' && editor.subject ? ' · ' + esc(editor.subject) : ''} · ${selectedStudentsLink(editor.refs)}</p><div id="parity-rule-form" class="borrow-editor-card">`;
    if (controlModule === 'borrowing') {
      if (!editor.editingId && !editor.schoolRule) form += `<div class="control-form-section"><b class="control-form-title">规则类型</b><div class="control-segment">${[['weekly', '每周固定'], ['dates', '指定日期']].map(([mode, label]) => `<button aria-pressed="${rule.mode === mode}" onclick="parity.editorMode('${mode}')">${label}</button>`).join('')}</div></div>`;
      form += `<p class="control-form-note">指定日期规则优先，到期或删除后恢复每周规则。</p>`;
      form += rule.mode === 'weekly' ? `<div class="control-form-section"><b class="control-form-title">适用星期</b>${daysFields(rule.weekdays)}</div>` : `<div class="control-form-section"><b class="control-form-title">适用日期（包含起止日期）</b><div class="control-date-row"><input id="parity-date-start" aria-label="开始日期" type="date" onchange="parity.borrowDateChanged()" min="${R.today()}" value="${rule.startDate}"><span>至</span><input id="parity-date-end" aria-label="结束日期" type="date" onchange="parity.borrowDateChanged()" min="${rule.startDate && rule.startDate > R.today() ? rule.startDate : R.today()}" value="${rule.endDate}"></div><p class="control-form-note">所选日期内全天停止借用。</p></div>`;
      if (rule.mode !== 'dates') form += `<div class="control-form-section"><b class="control-form-title">借用时段</b>${periodFields(rule.periods)}</div>`;
    } else if (controlModule === 'duration') {
      form += `<div class="control-form-section"><b class="control-form-title">适用星期</b>${daysFields(rule.weekdays)}</div>`;
      if (rule.useDefault) form += `<p class="parity-note">${R.durationText(R.defaultDuration)}</p>`;
      else form += `<div class="control-form-section">${[['continuousMinutes', '连续使用时长'], ['restMinutes', '休息时间'], ['dailyMinutes', '每日累计时长']].map(([key, label]) => `<div class="control-number-row"><label for="parity-${key}">${label}</label><span><input id="parity-${key}" type="number" min="1" step="1" value="${rule[key]}">分钟</span></div>`).join('')}</div><div class="control-form-section"><b class="control-form-title">每日可用时段</b>${periodFields(rule.periods)}<p class="control-form-note">不设时段，全天可用，仍受时长限制。</p></div>`;
    } else form += homeworkPermissionFields(editor);
    if (controlModule === 'duration' || controlModule === 'homework') form += button(controlModule === 'duration' ? '填入默认设置' : '恢复全校默认规则', 'parity.fillDefault()', true, controlModule === 'duration' && durationIsDefault(rule)).replace('<button ', '<button id="parity-fill-default" ');
    form += `${scopeFields(editor)}<p id="parity-error" class="control-error" role="alert"></p></div>`;
    const title = controlModule === 'borrowing' && (editor.editingId || editor.schoolRule) ? (editor.editingId ? '编辑' : '新增') + (rule.mode === 'weekly' ? '每周固定借用规则' : '指定日期借用规则') : '设置' + controlLabels[controlModule];
    app.innerHTML = `<main class="screen control-screen borrow-editor-screen">${pageTop(title, 'parity.cancelEditor()')}<section class="borrow-editor-content">${form}</section><footer class="borrow-editor-actions parity-editor-actions">${button('取消', 'parity.cancelEditor()', true)}${button(controlModule === 'borrowing' && rule.mode === 'dates' ? '保存' : '保存并生效', 'parity.saveEditor()')}</footer><div id="control-overlay"></div><div id="control-toast" role="status"></div></main>`;
    if (controlModule === 'duration') {
      const formNode = document.getElementById('parity-rule-form');
      ['input', 'change', 'click'].forEach(event => formNode?.addEventListener?.(event, updateDefaultButton));
    }
    syncReview();
  }
  function openEditor(refs, label, ruleId, schoolRule = false, studentRule = false) {
    if (!refs.length) return;
    try { assertPermission(refs, controlModule); } catch (error) { return controlToast(error.message); }
    controlData = loadLatest();
    if (controlModule === 'homework' && controlDemoRole !== 'admin') {
      const subjects = [homeworkSubject()], students = R.resolve(controlData, refs).map(row => row.student);
      const subjectValues = Object.fromEntries(subjects.map(subject => [subject, Object.fromEntries(['answer','explanation'].map(field => {
        const values = new Set(students.map(student => Boolean(R.homeworkValue(student, subject)[field])));
        return [field, values.size === 1 ? String(values.values().next().value) : ''];
      }))]));
      const baseBySubject = Object.fromEntries(subjects.map(subject => [subject, baseFor(refs, 'homework', subject)]));
      ui.editor = { refs:R.copy(refs), originalStudentIds:refs.map(ref=>String(ref.id)), label, subjects:[...subjects], subjectValues, baseBySubject, classWide:wholeTeacherClass(refs), returnView:controlView==='entry'?'module':controlView };
      ui.editor.initial = JSON.stringify(ui.editor.subjectValues);
      controlView = 'ruleEditor'; renderControl(); return;
    }
    if (controlModule === 'duration') {
      const students = R.resolve(controlData, refs).map(row => row.student);
      const weeks = students.map(student => R.durationWeek(student));
      const durationMixed = new Set(weeks.map(rule => JSON.stringify(rule.dailySettings))).size > 1;
      const rule = durationMixed ? R.durationWeek({ durationRules: [] }, uid()) : { ...weeks[0], id: students[0].durationRules?.[0]?.id || uid(), ...(students[0].durationRules?.[0]?.settingGroups ? {settingGroups:R.copy(students[0].durationRules[0].settingGroups)} : {}) };
      rule.settingGroups ||= R.settingGroups(rule,'duration');
      ui.editor = { refs: R.copy(refs), originalStudentIds:refs.map(ref=>String(ref.id)), label, base: baseFor(refs), scope: 'all', rule, value: {}, durationMixed, studentRule, returnView: controlView };
      ui.editor.initial = JSON.stringify([rule, {}, 'all']);
      controlView = 'ruleEditor'; renderControl(); return;
    }
    const first = R.resolve(controlData, refs)[0].student, key = controlModule === 'borrowing' ? 'schedules' : 'durationRules';
    const existing = ruleId ? (schoolRule ? controlData.schoolSettings?.borrowingRules || [] : first[key]).find(rule => rule.id === ruleId) : null;
    if (controlModule === 'borrowing' && existing && R.borrowStatus(existing) === '已失效') return controlToast('已失效规则只能删除');
    const rule = existing ? R.copy(existing) : controlModule === 'borrowing' ? { id: uid(), mode: schoolRule ? ui.borrowMode : 'weekly', weekdays: [], startDate: '', endDate: '', deny: false, periods: [{ start: '', end: '' }] } : { ...R.copy(R.defaultDuration), id: uid(), weekdays: [], useDefault: false, fixed: false };
    if (controlModule === 'duration') {
      if (rule.useDefault) Object.assign(rule, R.copy(R.defaultDuration), { id: rule.id, weekdays: rule.weekdays });
      rule.useDefault = false;
      if (!existing) rule.weekdays = [0, 1, 2, 3, 4, 5, 6];
    }
    const selectedStudents = R.resolve(controlData, refs).map(row => row.student);
    const subject = controlModule === 'homework' && controlDemoRole !== 'admin' ? homeworkSubject() : null;
    const permissionValue = key => {
      const values = new Set(selectedStudents.map(student => Boolean(subject ? R.homeworkValue(student, subject)[key] : student[key])));
      return values.size === 1 ? String(values.values().next().value) : null;
    };
    ui.editor = { schoolRule, refs: R.copy(refs), label, subject, base: baseFor(refs), scope: controlDemoRole === 'admin' && controlModule === 'borrowing' && rule.mode === 'dates' ? 'all' : needScope(refs) ? null : 'all', editingId: existing?.id, returnView: controlView, modal: controlDemoRole === 'admin' && controlModule === 'homework', rule, value: { answer: permissionValue('answer'), explanation: permissionValue('explanation') } };
    ui.editor.initial = JSON.stringify([ui.editor.rule, ui.editor.value, ui.editor.scope]);
    if (ui.editor.modal) renderEditor();
    else { controlView = 'ruleEditor'; renderControl(); }
  }
  function clearHomeworkSubjects(student) {
    student.homeworkSubjects = {};
    for (const field of ['updated', 'teacherModified', 'operatedAt']) {
      if (!student[field]) continue;
      student[field] = Object.fromEntries(Object.entries(student[field]).filter(([key]) => !key.startsWith('homework:')));
    }
  }
  function operationChange(operation) {
    return student => {
      if (operation.module === 'duration') student.durationIndividual = operation.studentRule || !operation.classWide;
      if (operation.module === 'world') student.worldIndividual = !operation.classWide;
      if (operation.kind === 'save') {
        if (operation.module === 'borrowing') student.schedules = R.mergeBorrow(student.schedules, operation.value, operation.editingId);
        else if (operation.module === 'duration') {
          const days = R.durationDays(student, operation.value.weekdays, operation.scope);
          if (!days.length) return false;
          student.durationRules = R.mergeDuration(student.durationRules, { ...operation.value, weekdays: days, source: controlDemoRole === 'admin' ? 'school' : 'homeroom' }, operation.editingId);
          const marks = student.durationTeacherWeekdays || R.durationDays(student, [0,1,2,3,4,5,6], 'all').filter(day => !R.durationDays(student, [day], 'unmodified').length);
          student.durationTeacherWeekdays = controlDemoRole === 'admin' ? marks.filter(day => !days.includes(day)) : [...new Set([...marks, ...days])];
        }
        else if (operation.module === 'homework') {
          if (operation.subject) student.homeworkSubjects = { ...student.homeworkSubjects, [operation.subject]: { ...operation.value } };
          else { Object.assign(student, operation.value); clearHomeworkSubjects(student); }
        }
        else Object.assign(student, operation.value);
      } else if (operation.kind === 'delete') {
        const key = operation.module === 'borrowing' ? 'schedules' : 'durationRules';
        student[key] = student[key].filter(rule => operation.ruleId ? rule.id !== operation.ruleId : operation.mode ? rule.mode !== operation.mode : false);
      } else if (operation.kind === 'reset') {
        if (operation.module === 'duration') student.durationRules = [];
        else if (operation.module === 'homework') {
          if (operation.subject) student.homeworkSubjects = { ...student.homeworkSubjects, [operation.subject]: { answer: false, explanation: false } };
          else { student.answer = false; student.explanation = false; clearHomeworkSubjects(student); }
        }
      } else student[operation.module === 'lock' ? 'locked' : 'world'] = operation.value;
    };
  }
  function request(operation) {
    try {
      if (operation.module === 'world' || operation.module === 'duration') operation.scope = 'all';
      if (schoolDateRule(operation)) operation.scope = 'all';
      assertPermission(operation.refs, operation.module, operation.subject);
      if (operation.kind === 'save' && operation.module === 'borrowing') {
        const error = R.validateBorrow(operation.value);
        if (error) throw Error(error);
      }
      if (!operation.refs.length) return controlToast('请先选择操作对象');
      if (operation.kind !== 'delete' && needScope(operation.refs, operation.module) && !operation.scope) {
        ui.pending = operation;
        controlOverlay('选择修改范围', `<p class="control-scope">${esc(operation.label)}</p>${scopeFields(operation)}<p id="parity-error" class="control-error" role="alert"></p>`, button('取消', 'closeControlOverlay()', true) + button('继续', 'parity.confirmScope()'));
        return;
      }
      const latest = loadLatest(), rows = operationRows(latest, operation);
      if (!rows.length) { renderControl(); return controlToast('没有符合修改范围的班级，已有单独设置均已保留'); }
      if (operation.kind === 'delete') {
        const preview = R.deletionPreview(rows, operation.module, operation);
        if (!preview.refs.length) return controlToast('所选范围内没有这条规则，无需删除');
        const borrowing = operation.module === 'borrowing';
        const modes = new Set(preview.rules.map(rule => rule.mode));
        const outcome = !borrowing ? '删除后，对应星期恢复默认使用时长规则。' : modes.size === 1 && modes.has('dates') ? '删除后，对应日期恢复每周固定借用规则；没有每周固定规则时不能借用。' : '删除后，对应日期没有其他有效借用规则时不能借用。';
        const title = operation.schoolRule ? '确认删除全校借用规则？' : borrowing ? '确认删除借用规则？' : '确认删除使用时长规则？';
        const rules = [...new Set(preview.rules.map(rule => borrowing ? (rule.mode === 'dates' ? '指定日期：' : '每周固定：') + R.borrowText(rule) : R.dayText(rule.weekdays) + ' · ' + R.durationText(rule.useDefault ? R.defaultDuration : rule)))];
        ui.pending = operation;
        controlOverlay(title, `<p class="control-scope">${esc(operation.label)}</p><p class="control-confirm-copy">将删除以下${rules.length === 1 ? '' : rules.length + '条'}规则：</p><div class="parity-rule">${rules.map(text => `<p>${esc(text)}</p>`).join('')}</div><p class="control-confirm-copy">${outcome}其他规则不受影响。</p>`, button('取消', 'closeControlOverlay()', true) + `<button type="button" class="control-primary parity-delete-confirm" onclick="parity.apply()">确认删除</button>`);
        return;
      }
      // 确认内容只取本次操作，学校管理员与班主任共用，不汇总学生原有规则。
      let texts;
      if (operation.kind === 'reset') texts = operation.module === 'duration' ? [R.durationText(R.defaultDuration)] : ['答案不允许 · 详解不允许'];
      else if (operation.module === 'borrowing') texts = [R.borrowText(operation.value)];
      else if (operation.module === 'duration') texts = operation.value.dailySettings ? R.durationGroups({durationRules:[operation.value]}) : [R.dayText(operation.value.weekdays) + ' · ' + R.durationText(operation.value.useDefault ? R.defaultDuration : operation.value)];
      else if (operation.module === 'homework') texts = [`答案${operation.value.answer ? '允许' : '不允许'} · 详解${operation.value.explanation ? '允许' : '不允许'}`];
      else texts = [operation.module === 'lock' ? operation.value ? '平板已锁屏' : '平板未锁屏' : operation.value ? '万象视界允许使用' : '万象视界禁止使用'];
      const restoringDuration = operation.module === 'duration' && operation.kind === 'save' && operation.value.settingGroups?.length === 0;
      const label = restoringDuration ? '恢复全周默认规则' : operation.kind === 'delete' ? '删除规则' : operation.kind === 'reset' ? '恢复默认规则' : operation.module === 'lock' ? operation.value ? '锁屏' : '解除锁屏' : operation.module === 'world' ? operation.value ? '开放万象视界' : '关闭万象视界' : '保存' + controlLabels[operation.module];
      ui.pending = operation;
      controlOverlay(`确认${label}？`, operation.module === 'duration' && operation.kind === 'save' ? '' : `<p class="control-scope">${esc(operation.label)}${operation.module === 'homework' && operation.subject ? ' · ' + esc(operation.subject) : ''}</p><div class="parity-preview">${texts.map(text => `<p>${esc(operation.module === 'duration' ? text.replace(/(^|：)单独规则 · /g, '$1') : text)}</p>`).join('')}</div>`, button('取消', 'closeControlOverlay()', true) + button(operation.kind === 'save' && operation.module === 'borrowing' && operation.value.mode === 'dates' ? '保存' : '确认生效', 'parity.apply()'));
    } catch (error) { conflict(error); }
  }
  function conflict(error) {
    ui.pending = null; ui.editor = null; ui.boolean = null;
    try { controlData = loadLatest(); } catch { /* 保留会话数据供用户刷新。 */ }
    if (controlView === 'ruleEditor') controlView = 'module';
    renderControl(); controlToast(error.message || '保存失败，原配置已保留');
  }
  function apply() {
    const operation = ui.pending;
    if (!operation) return;
    try {
      assertPermission(operation.refs, operation.module, operation.subject);
      if (operation.kind === 'save' && operation.module === 'borrowing') {
        const error = R.validateBorrow(operation.value);
        if (error) throw Error(error);
      }
      if (operation.module === 'duration' && operation.kind === 'save' && operation.value.dailySettings) { const error = (operation.value.settingGroups ? R.validateSettingGroups(operation.value.settingGroups,'duration') : '') || R.validateDurationWeek(operation.value); if (error) throw Error(error); }
      const latest = loadLatest();
      if (operation.module === 'duration' && operation.classWide) {
        for (const name of new Set(operation.refs.map(ref => ref.className))) {
          const selected = operation.refs.filter(ref => ref.className === name).map(ref => ref.id).sort().join(',');
          if (selected !== (latest[name] || []).map(student => student.id).sort().join(',')) throw Error('所选班级信息有变化，请刷新后重新设置');
        }
      }
      // 完整范围先做版本校验；删除只写入确实包含目标规则的学生。
      const rows = operationRows(latest, operation);
      const refs = operation.kind === 'delete' ? R.deletionPreview(rows, operation.module, operation).refs : rows.map(row => row.ref);
      const result = R.transaction(latest, refs, operationModule(operation), null, 'all', operationChange(operation), actor());
      if (result.count) {
        if (operation.module === 'duration' && operation.classWide && !operation.studentRule) {
          result.data.schoolSettings ||= {};
          result.data.schoolSettings.durationClasses ||= {};
          [...new Set(refs.map(ref => ref.className))].forEach(name => {
            if (operation.kind === 'save' && operation.value.dailySettings) result.data.schoolSettings.durationClasses[name] = R.copy(operation.value);
            else delete result.data.schoolSettings.durationClasses[name];
          });
        }
        if (operation.module === 'world' && operation.classWide) {
          result.data.schoolSettings ||= {};
          result.data.schoolSettings.worldClasses ||= {};
          refs.forEach(ref => { result.data.schoolSettings.worldClasses[ref.className] = operation.value; });
        }
        if (operation.schoolRule) {
          const rules = result.data.schoolSettings?.borrowingRules || [];
          result.data.schoolSettings = { ...result.data.schoolSettings, borrowingRules: operation.kind === 'save' ? R.mergeBorrow(rules, operation.value, operation.editingId) : rules.filter(rule => rule.id !== operation.ruleId) };
        }
        try { persist(result.data); }
        catch {
          ui.pending = null;
          if (ui.editor) renderEditor(); else renderControl();
          controlToast('保存失败，请重试');
          return;
        }
      }
      const returnView = ui.editor?.returnView;
      ui.pending = null; ui.editor = null; ui.boolean = null;
      if (controlView === 'ruleEditor') controlView = returnView === 'studentDetail' ? 'studentDetail' : 'module';
      adminBatchMode = false; controlSelected.clear(); adminSelectedScopes.clear();
      renderControl(); controlToast(result.count ? operation.module==='world'&&operation.kind==='boolean'?(operation.value?'已恢复使用':'已停止使用'):operation.module === 'lock' && operation.kind === 'boolean' ? (operation.value ? '已锁屏' : '已解锁') : operation.kind === 'save' && operation.module === 'borrowing' && operation.value.mode === 'dates' ? '已保存' : `${operation.kind === 'delete' ? '删除成功' : '已生效'}` : '没有符合修改范围的班级，原规则保留');
    } catch (error) { conflict(error); }
  }
  function restoreTeacherDuration(editor){
    assertPermission(editor.refs,'duration');const latest=loadLatest();R.prepare(latest,editor.refs,'duration',editor.base);const week=gradeDurationWeek(latest);
    const result=R.transaction(latest,editor.refs,'duration',null,'all',student=>{student.durationRules=[R.copy(week)];student.durationTeacherWeekdays=[];student.durationIndividual=true;},actor());
    R.resolve(result.data,editor.refs).forEach(({student})=>{student.teacherModified||={};student.teacherModified.duration=false;});
    if((result.data[selectedTeacherClass]||[]).every(student=>R.durationDays(student,[0,1,2,3,4,5,6],'unmodified').length===7)&&result.data.schoolSettings?.durationClasses)delete result.data.schoolSettings.durationClasses[selectedTeacherClass];
    try{persist(result.data);}catch{return controlToast('保存失败，请重试');}ui.editor=null;controlView=editor.returnView||'module';renderControl();controlToast('已恢复默认规则');
  }
  function saveHomeworkSubjects(editor) {
    if(!editor.subjects.length){document.getElementById('parity-error').textContent='请选择科目';return;}
    if (editor.subjects.some(subject => ['answer','explanation'].some(field => !['true','false'].includes(editor.subjectValues[subject][field])))) {
      document.getElementById('parity-error').textContent = '请为每个科目选择答案和详解权限';
      return;
    }
    let restoreDefault=false;
    if(controlWorkView==='homeroom'){
      try{const baseline=inheritedHomeworkPermission(loadLatest());const same=editor.subjects.every(subject=>['answer','explanation'].every(key=>(editor.subjectValues[subject][key]==='true')===baseline[key]));if(same){if(!editor.originalStudentIds?.length)return controlToast('已是默认规则，无需保存');restoreDefault=true;}}catch(error){return controlToast(error.message);}
    }
    const original = JSON.parse(editor.initial), changes = editor.subjects.map(subject => {
      const fields = Object.fromEntries(['answer','explanation'].filter(field => editor.subjectValues[subject][field] !== '' && (restoreDefault || editor.selectionChanged || editor.subjectValues[subject][field] !== original[subject][field])).map(field => [field, editor.subjectValues[subject][field] === 'true']));
      return { subject, fields };
    }).filter(item => Object.keys(item.fields).length);
    if (!changes.length) return controlToast('没有需要修改的权限');
    try {
      const latest = loadLatest();
      const before = (latest[selectedTeacherClass] || []).map(student => student.id).sort().join(',');
      const selected = editor.refs.map(ref => ref.id).sort().join(',');
      if (editor.classWide && before !== selected) throw Error('所选班级信息有变化，请刷新后重新设置');
      changes.forEach(({subject}) => {
        assertPermission(editor.refs, 'homework', subject);
        R.prepare(latest, editor.refs, homeworkModule(subject), editor.baseBySubject[subject]);
      });
      let next = latest, count = 0;
      changes.forEach(({subject, fields}) => {
        const result = R.transaction(next, editor.refs, homeworkModule(subject), null, 'all', student => {
          const current = R.homeworkValue(student, subject);
          const value = { ...current, ...fields };
          if (!restoreDefault && value.answer === current.answer && value.explanation === current.explanation) return false;
          student.homeworkSubjects = { ...student.homeworkSubjects, [subject]: value };
        }, actor());
        if(restoreDefault)R.resolve(result.data,editor.refs).forEach(({student})=>{student.teacherModified||={};student.teacherModified[homeworkModule(subject)]=false;});
        next = result.data; count += result.count;
      });
      if (count) {
        try { persist(next); }
        catch { return controlToast('保存失败，请重试'); }
      }
      ui.editor = null; controlView = editor.returnView || 'module'; renderControl();
      controlToast(count ? '已保存并生效' : '当前选择无需修改');
    } catch (error) { conflict(error); }
  }
  function makeOperation(refs, label, kind, value, extra = {}) { return { refs, label, kind, value, classWide: controlDemoRole === 'admin' || wholeTeacherClass(refs), studentRule: !!ui.editor?.studentRule, module: controlModule, subject: controlModule === 'homework' && controlDemoRole !== 'admin' ? homeworkSubject() : null, base: baseFor(refs), ...extra }; }
  function operationRows(data, operation) {
    if (operation.module === 'duration' && operation.kind === 'save') return R.prepare(data, operation.refs, operation.module, operation.base, 'all').filter(({student}) => R.durationDays(student, operation.value.weekdays, operation.scope).length);
    if (operation.module === 'lock' && operation.kind === 'boolean') return R.prepare(data, operation.refs, operationModule(operation), operation.base, operation.scope || 'all').filter(({student}) => isLocked(student) !== operation.value);
    return R.prepare(data, operation.refs, operationModule(operation), operation.base, operation.scope || 'all');
  }
  function currentSelectedRefs() { return controlDemoRole === 'admin' ? adminSelectionRefs() : targetRefs('selected'); }
  function visibleScopeKeys() {
    const container = document.getElementById('parity-scope-rows');
    const keys = adminLevel === 'class' ? [selectedTeacherClass] : adminVisibleScopeKeys();
    if (!container) return keys.filter(key => scopeRefs(key).length);
    return keys.filter(key => scopeRefs(key).length && [...container.querySelectorAll('.admin-level-copy b')].some(node => node.textContent === key));
  }
  window.parity = {
    classRefs,
    editSchool() {
      if (controlDemoRole !== 'admin' || adminLevel !== 'school') return;
      const refs = allRefs();
      if (!refs.length) return controlToast('当前没有可管控班级');
      if (controlModule === 'world') return this.booleanEditor(refs, '全校', null);
      if (['duration', 'homework'].includes(controlModule)) openEditor(refs, '全校');
    },
    openHomeworkSubject(subject){if(!managedHomeworkSubjects().includes(subject))return;ui.homeworkDrill=subject;ui.homeworkSubject=subject;controlView='module';homeworkControlPage();},
    closeHomeworkSubject(){ui.homeworkDrill=null;homeworkControlPage();},
    showHomeworkStudents(index){return this.showDurationStudents(index);},
    editHomeworkRule(index){const g=teacherHomeworkGroups()[index];if(!g||controlWorkView!=='homeroom')return;openEditor(g.students.map(s=>({className:selectedTeacherClass,id:s.id})),selectedTeacherClass);},
    removeHomeworkRule(index){const g=teacherHomeworkGroups()[index];if(!g||controlWorkView!=='homeroom')return;ui.homeworkRemoval={refs:g.students.map(s=>({className:selectedTeacherClass,id:s.id})),subject:homeworkSubject(),base:baseFor(g.students.map(s=>({className:selectedTeacherClass,id:s.id})),'homework',homeworkSubject())};controlOverlay('确认删除智阅作业规则？','<p>删除后执行当前年级权限。</p>',button('取消','closeControlOverlay()',true)+button('确认删除','parity.confirmRemoveHomeworkRule()'));},
    confirmRemoveHomeworkRule(){const d=ui.homeworkRemoval;if(!d||controlModule!=='homework'||d.subject!==homeworkSubject())return;try{assertPermission(d.refs,'homework',d.subject);const latest=loadLatest(),baseline=inheritedHomeworkPermission(latest);const result=R.transaction(latest,d.refs,homeworkModule(d.subject),d.base,'all',student=>{student.homeworkSubjects={...student.homeworkSubjects,[d.subject]:R.copy(baseline)};},actor());R.resolve(result.data,d.refs).forEach(({student})=>{student.teacherModified||={};student.teacherModified[homeworkModule(d.subject)]=false;});persist(result.data);ui.homeworkRemoval=null;closeControlOverlay(true);renderControl();controlToast('已删除');}catch(error){conflict(error);}},
    showDurationStudents(index){
      if(!['duration','homework'].includes(controlModule)||controlDemoRole==='admin')return;
      const group=(controlModule==='duration'?teacherDurationGroups():teacherHomeworkGroups())[index];if(!group)return;
      ui.durationRoster={students:group.students.map(s=>({id:s.id,name:s.name})),query:''};
      controlOverlay('适用学生（'+group.students.length+'人）','<div class="duration-roster-body"><input type="search" aria-label="搜索姓名或学号" placeholder="搜索姓名或学号" oninput="parity.searchDurationRoster(this.value)"><div id="duration-roster-list" class="duration-roster-list" role="list" aria-label="适用学生名单" tabindex="0">'+durationRosterRows()+'</div></div>','');
      document.querySelector?.('#control-overlay .control-sheet')?.classList?.add('duration-roster-sheet');
    },
    searchDurationRoster(query){
      if(!ui.durationRoster)return;ui.durationRoster.query=query;
      const list=document.getElementById('duration-roster-list');if(list){list.innerHTML=durationRosterRows();list.scrollTop=0;}
    },
    editStudentDuration(index){const g=teacherDurationGroups()[index];if(!g)return;openEditor(g.students.map(s=>({className:selectedTeacherClass,id:s.id})),selectedTeacherClass,null,false,true);},
    removeStudentDuration(index){const g=teacherDurationGroups()[index];if(!g)return;const refs=g.students.map(s=>({className:selectedTeacherClass,id:s.id}));ui.durationRemoval={refs,base:baseFor(refs,'duration')};controlOverlay('删除学生规则？','<p>删除后按年级规则执行。</p>',button('取消','closeControlOverlay()',true)+button('确认删除','parity.confirmRemoveStudentDuration()'));},
    confirmRemoveStudentDuration(){const draft=ui.durationRemoval;if(!draft)return;try{assertPermission(draft.refs,'duration');const d=loadLatest();R.prepare(d,draft.refs,'duration',draft.base);const week=gradeDurationWeek(d);const result=R.transaction(d,draft.refs,'duration',null,'all',student=>{student.durationRules=[R.copy(week)];student.durationTeacherWeekdays=[];student.durationIndividual=true;student.teacherModified||={};student.teacherModified.duration=false;},actor());R.resolve(result.data,draft.refs).forEach(({student})=>student.teacherModified.duration=false);if((result.data[selectedTeacherClass]||[]).every(s=>R.durationDays(s,[0,1,2,3,4,5,6],'unmodified').length===7)&&result.data.schoolSettings?.durationClasses)delete result.data.schoolSettings.durationClasses[selectedTeacherClass];persist(result.data);ui.durationRemoval=null;closeControlOverlay(true);renderControl();controlToast('已删除');}catch(error){conflict(error);}},
    chooseDurationStudents(module='duration'){
      if(!['duration','homework'].includes(module))return;controlModule=module;
      if(controlDemoRole==='admin'||!canEdit(module))return controlToast('当前不能修改本班设置');
      controlData=loadLatest();
      const eligible=selectableRuleStudents({module,subject:homeworkSubject()});
      if(!controlStudents().length)return controlToast('暂无可设置的学生');
      openEditor([{className:selectedTeacherClass,id:(eligible[0]||controlStudents()[0]).id}],selectedTeacherClass,null,false,module==='duration');
      if(!ui.editor)return;
      ui.editor.refs=[];ui.editor.originalStudentIds=[];ui.editor.classWide=false;ui.editor.selectionChanged=true;
      ui.editor.base=baseFor(classRefs());
      if(ui.editor.subjects)ui.editor.baseBySubject=Object.fromEntries(ui.editor.subjects.map(subject=>[subject,baseFor(classRefs(),'homework',subject)]));
      if(module==='duration'){ui.editor.rule={...R.copy(gradeDurationWeek()),id:uid()};ui.editor.rule.settingGroups=R.settingGroups(ui.editor.rule,'duration');ui.editor.durationMixed=false;ui.editor.initial=JSON.stringify([ui.editor.rule,ui.editor.value,ui.editor.scope]);}
      renderEditor();
    },
    pickEditorStudents(){
      if(!ui.editor)return;collectEditor();
      const editor=ui.editor;
      ui.durationSelection={ids:new Set(editor.refs.map(ref=>String(ref.id))),originalIds:new Set(editor.originalStudentIds||[]),query:'',className:selectedTeacherClass,module:controlModule,subject:controlModule==='homework'?homeworkSubject():null};
      this.renderStudentPicker();
    },
    renderStudentPicker(){
      const d=ui.durationSelection;if(!d)return;
      shell('选择'+d.className+'学生',`<div class="daily-lock-picker"><div class="daily-lock-picker-count"><span>选择需要设置${d.module==='homework'?'权限':'时长'}的学生</span><b id="duration-selection-count">${d.ids.size}/${controlStudents().length} 人</b></div><input type="search" placeholder="搜索姓名或学号" aria-label="搜索姓名或学号" oninput="parity.searchDurationStudents(this.value)"><div id="duration-selection-options">${durationSelectionRows()}</div></div>`,'parity.cancelStudentPicker()',`<footer class="borrow-editor-actions">${button('取消','parity.cancelStudentPicker()',true)}${button('确定','parity.confirmDurationStudents()',false,!d.ids.size)}</footer>`,'school-mobile control-student-picker');
    },
    cancelStudentPicker(){ui.durationSelection=null;renderEditor();},
    searchDurationStudents(query){if(!ui.durationSelection)return;ui.durationSelection.query=query;const rows=document.getElementById('duration-selection-options');if(rows)rows.innerHTML=durationSelectionRows();},
    selectDurationStudent(id,checked){
      const d=ui.durationSelection;if(!d)return;
      if(checked&&!selectableRuleStudents(d).some(s=>String(s.id)===String(id)))return;
      checked?d.ids.add(String(id)):d.ids.delete(String(id));
      const count=document.getElementById('duration-selection-count');if(count)count.textContent=d.ids.size+'/'+controlStudents().length+' 人';
      const next=document.querySelector?.('.control-student-picker .control-primary');if(next)next.disabled=!d.ids.size;
    },
    confirmDurationStudents(){
      const d=ui.durationSelection,editor=ui.editor;if(!d||!editor||!d.ids.size)return;
      if(d.className!==selectedTeacherClass||d.module!==controlModule||d.module==='homework'&&d.subject!==homeworkSubject())return controlToast('班级或科目已变化，请重新选择');
      controlData=loadLatest();
      if([...d.ids].some(id=>!selectableRuleStudents(d).some(s=>String(s.id)===id)))return controlToast(d.module==='duration'?'学生规则已变化，请重新选择':'学生权限已变化，请重新选择');
      const refs=classRefs().filter(ref=>d.ids.has(String(ref.id)));
      if(refs.length!==d.ids.size)return controlToast('学生名单已变化，请重新选择');
      try{assertPermission(refs,controlModule);}catch(error){return controlToast(error.message);}
      editor.selectionChanged ||= JSON.stringify(editor.refs.map(r=>String(r.id)).sort())!==JSON.stringify([...d.ids].sort());
      editor.refs=refs;editor.classWide=wholeTeacherClass(refs);
      editor.base={...baseFor(refs),...editor.base};
      if(editor.subjects)editor.subjects.forEach(subject=>{editor.baseBySubject[subject]={...baseFor(refs,'homework',subject),...editor.baseBySubject[subject]};});
      ui.durationSelection=null;renderEditor();
    },
    durationDetails(open){if(ui.editor)ui.editor.studentsExpanded=open;},
    editClass() {
      if (controlDemoRole === 'admin' || !['duration', 'homework'].includes(controlModule)) return;
      if (!canEdit()) return controlToast('当前不能修改本班设置');
      if(['duration','homework'].includes(controlModule))return this.chooseDurationStudents(controlModule);
      openEditor(classRefs(), selectedTeacherClass);
    },
    showScopeRules(key) {
      const grouped = new Map();
      R.resolve(controlData, scopeRefs(key)).forEach(({ ref, student }) => R.durationGroups(student).forEach(rule => {
        if (!grouped.has(rule)) grouped.set(rule, []);
        grouped.get(rule).push(ref);
      }));
      const body = [...grouped].map(([rule, refs]) => {
        const classes = [...new Set(refs.map(ref => ref.className))];
        const scope = classes.map(className => {
          const inGroup = refs.filter(ref => ref.className === className).length;
          return esc(className) + (inGroup < controlData[className].length ? '（规则有差异）' : '');
        }).join('、');
        return `<div class="parity-scope-rule-group"><b>${scope}</b><p>${esc(rule)}</p></div>`;
      }).join('');
      controlOverlay(`${key}使用时长规则`, body || '<p>暂无可管控班级</p>', button('关闭', 'closeControlOverlay()', true));
    },
    homeworkSubject(subject) {
      if (controlModule !== 'homework' || !managedHomeworkSubjects().includes(subject)) return;
      ui.homeworkSubject = subject;
      controlSelected.clear(); adminSelectedScopes.clear();
      renderControl();
    },
    showEmptyClassDemo() {
      if (controlDemoRole === 'admin') { controlDemoRole = 'teacher'; controlWorkView = 'subject'; }
      controlView = 'entry'; controlBatch = false;
      renderControl();
    },
    renderEmptyAdminDemo(kind) {
      const grade = schoolGrades()[0] || '五年级';
      const school = kind === 'adminNoGrades';
      const priorModule = controlModule;
      controlModule = 'borrowing';
      shell('柜机借用管控', `<p class="parity-context">${school ? '全校' : esc(grade)}</p>${card((school ? '全校' : esc(grade)) + '柜机借用管控', '<p class="parity-note">未开启临时停止借用</p>')}<div class="admin-scope-summary"><b>${school ? '年级' : '班级'}借用规则</b></div><div class="control-empty">${school ? '暂无年级，请联系学校管理员配置。' : '该年级暂无班级，添加班级后可设置管控。'}</div>`, 'controlPageDemo.restore()');
      controlModule = priorModule;
    },
    renderDemoPage(kind, closeEditor = false) {
      const saved = {data: controlData, role: controlDemoRole, work: controlWorkView, module: controlModule, view: controlView, batch: controlBatch, editor: ui.editor, pending: ui.pending};
      try {
        renderingDemo = true;
        controlData = R.copy(controlData);
        controlDemoRole = 'teacher'; controlWorkView = 'homeroom'; controlBatch = false;
        ui.editor = null; ui.pending = null;
        controlModule = kind === 'lockStarted' ? 'lock' : 'duration';
        controlView = ['classRevoked', 'accountRemoved'].includes(kind) ? 'entry' : 'module';
        if (kind === 'lockStarted') {
          controlData.schoolSettings.temporaryLock = {active: false};
          controlData.schoolSettings.temporaryLocks = {};
          controlData.schoolSettings.temporaryClassStates = {};
        }
        renderControl();
        if (!closeEditor && ['saveFailed', 'changed', 'removed'].includes(kind)) {
          // Demo editor opens against copied control data.
          openEditor(classRefs(), selectedTeacherClass);
        }
      } finally {
        renderingDemo = false;
        controlData = saved.data; controlDemoRole = saved.role; controlWorkView = saved.work;
        controlModule = saved.module; controlView = saved.view; controlBatch = saved.batch;
        ui.editor = saved.editor; ui.pending = saved.pending;
      }
    },
    acknowledgeTemporaryLock() {
      const latest = R.copy(loadLatest());
      latest.schoolSettings.temporaryLock = {active: true, by: '学校管理员', role: 'school'};
      latest.schoolSettings.temporaryLocks = {};
      latest.schoolSettings.temporaryClassStates = Object.fromEntries(schoolControlClasses.map(name => [name, true]));
      persist(latest);
      ui.editor = null; ui.pending = null; ui.boolean = null;
      controlDemoRole = 'teacher';
      if (!['homeroom', 'subject'].includes(controlWorkView)) controlWorkView = 'homeroom';
      controlModule = 'lock'; controlView = 'module'; controlBatch = false; controlSelected.clear();
      renderControl();
    },
    showSelectedStudents(encoded) {
      const refs = JSON.parse(decodeURIComponent(encoded));
      const students = R.resolve(controlData, refs).map(row => row.student);
      const host = document.getElementById('control-overlay');
      ui.roster = { nodes: [...host.childNodes], trigger: document.activeElement };
      controlOverlay('所选学生（' + students.length + '名）', `<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px 10px;max-height:50vh;overflow-y:auto;padding:12px 0" role="list">${students.map(student => `<span role="listitem" style="overflow-wrap:anywhere">${esc(student.name)}</span>`).join('') || '<p>暂无所选学生</p>'}</div>`, button('关闭', 'closeControlOverlay()', true));
    },
    showBorrowTimes() {
      if (window.borrowing) return borrowing.showTimes();
      controlOverlay('学校借用时间', teacherBorrowSummary(), button('关闭', 'closeControlOverlay()', true));
    },
    cancelBoolean() { closeControlOverlay(true); },
    chooseWorldStudents(){controlModule='world';if(controlDemoRole==='admin')return;controlData=loadLatest();ui.worldPicker={ids:new Set(),query:'',className:selectedTeacherClass};controlOverlay('选择'+selectedTeacherClass+'学生',`<div class="daily-lock-picker"><div class="daily-lock-picker-count"><span>选择需要停止使用万象视界的学生</span><b id="world-selected-count">0 人</b></div><input type="search" aria-label="搜索姓名或学号" placeholder="搜索姓名或学号" oninput="parity.searchWorldStudents(this.value)"><div id="world-student-options">${worldPickerRows()}</div></div>`,button('取消','closeControlOverlay()',true)+button('停止所选学生使用','parity.saveWorldStudents()',false,true));document.querySelector?.('#control-overlay .control-sheet')?.classList?.add('daily-lock-sheet');},
    searchWorldStudents(query){if(!ui.worldPicker)return;ui.worldPicker.query=query;const host=document.getElementById('world-student-options');if(host)host.innerHTML=worldPickerRows();},
    selectWorldStudent(id,checked){const p=ui.worldPicker;if(!p)return;checked?p.ids.add(String(id)):p.ids.delete(String(id));const count=document.getElementById('world-selected-count');if(count)count.textContent=p.ids.size+' 人';const save=document.querySelector?.('#control-overlay .control-primary');if(save)save.disabled=!p.ids.size;},
    saveWorldStudents(){const p=ui.worldPicker;if(!p||!p.ids.size)return;if(p.className!==selectedTeacherClass)return controlToast('班级已变化，请重新选择');const refs=classRefs().filter(ref=>p.ids.has(String(ref.id)));if(refs.length!==p.ids.size)return controlToast('学生名单已变化，请重新选择');this.applyWorldStudents(refs,false);},
    restoreStudentWorld(id){this.applyWorldStudents(classRefs().filter(ref=>String(ref.id)===String(id)),true);},
    applyWorldStudents(refs,value){if(controlDemoRole==='admin')return;controlModule='world';try{assertPermission(refs,'world');if(!refs.length)return;ui.pending=makeOperation(refs,selectedTeacherClass,'boolean',value,{scope:'all'});ui.worldPicker=null;apply();}catch(error){conflict(error);}},
    openStudentLocks(){controlModule='lock';controlView='studentLocks';renderControl();},
    chooseLockStudents(){
      controlModule='lock';if(!canEdit('lock'))return controlToast('学校临时锁屏期间不能修改日常锁屏');
      controlData=loadLatest();ui.lockPicker={ids:new Set(),query:'',className:selectedTeacherClass};
      controlOverlay('选择'+selectedTeacherClass+'学生',`<div class="daily-lock-picker"><div class="daily-lock-picker-count"><span>选择需要锁屏的学生</span><b id="daily-lock-count">0/${controlStudents().filter(s=>!s.locked).length} 人</b></div><input type="search" placeholder="搜索姓名或学号" aria-label="搜索姓名或学号" oninput="parity.filterLockStudents(this.value)"><div id="daily-lock-options">${lockPickerRows()}</div></div>`,button('取消','closeControlOverlay()',true)+button('锁屏所选学生','parity.saveLockStudents()',false,true));
      document.querySelector?.('#control-overlay .control-sheet')?.classList.add('daily-lock-sheet');
    },
    filterLockStudents(query){if(!ui.lockPicker)return;ui.lockPicker.query=query;const rows=document.getElementById('daily-lock-options');if(rows)rows.innerHTML=lockPickerRows();},
    toggleLockStudent(id,checked){const p=ui.lockPicker;if(!p)return;checked?p.ids.add(String(id)):p.ids.delete(String(id));const count=document.getElementById('daily-lock-count');if(count)count.textContent=p.ids.size+'/'+controlStudents().filter(s=>!s.locked).length+' 人';const save=document.querySelector?.('#control-overlay .control-primary');if(save)save.disabled=!p.ids.size;},
    saveLockStudents(){const p=ui.lockPicker;if(!p||!p.ids.size)return;if(p.className!==selectedTeacherClass)return controlToast('班级已变化，请重新选择');this.applyStudentLocks(classRefs().filter(ref=>p.ids.has(String(ref.id))),true);},
    unlockStudent(id){this.applyStudentLocks(classRefs().filter(ref=>String(ref.id)===String(id)),false);},
    applyStudentLocks(refs,value){
      if(controlDemoRole==='admin')return;controlModule='lock';
      try{assertPermission(refs,'lock');if(!refs.length)return controlToast('请选择学生');ui.pending=makeOperation(refs,selectedTeacherClass,'boolean',value,{scope:'all'});ui.lockPicker=null;apply();}catch(error){conflict(error);}
    },
    toggleClassLock(value) {
      if(controlDemoRole==='admin')return;
      controlModule='lock';
      try {
        controlData=loadLatest();
        const refs=classRefs();
        assertPermission(refs,'lock');
        if(!refs.length)return controlToast('当前班级暂无学生');
        ui.pending=makeOperation(refs,selectedTeacherClass,'boolean',value,{scope:'all'});
        apply();
      }catch(error){conflict(error);}
    },
    teacherLockChoice(target = 'all') {
      controlModule = 'lock';
      if (controlDemoRole === 'admin' || !canEdit('lock')) return controlToast('学校管理员正在进行临时锁屏管控，暂时无法修改锁屏状态');

      if (!targetRefs(target).length) return controlToast('请选择设置对象');
      ui.teacherLockDraft = { target, value: null };
      this.renderTeacherLockChoice();
    },
    renderTeacherLockChoice() {
      const draft = ui.teacherLockDraft;
      if (!draft) return;
      const students = R.resolve(controlData, targetRefs(draft.target)).map(row => row.student);
      const locked = students.filter(isLocked).length;
      const prefix = draft.target === 'all' ? '全班' : '';
      const options = [false, true].map(value => `<label class="parity-borrow-option"><input type="radio" name="teacher-lock-choice" ${draft.value === value ? 'checked' : ''} onchange="parity.chooseTeacherLock(${value})"><span class="parity-borrow-option-body"><span><b>${prefix}${value ? '锁屏' : '解锁'}</b><small>${value ? students.length - locked : locked} 人将${value ? '锁屏' : '解锁'}</small></span><i>✓</i></span></label>`).join('');
      controlOverlay('设置锁屏', `<p class="control-scope">${esc(selectedTeacherClass)} · 已锁屏 ${locked} 人 · 未锁屏 ${students.length - locked} 人</p><fieldset class="parity-borrow-choice">${options}</fieldset>`, button('取消', 'parity.cancelTeacherLock()', true) + button('保存', 'parity.saveTeacherLock()'));
    },
    chooseTeacherLock(value) { if (!ui.teacherLockDraft) return; ui.teacherLockDraft.value = value; this.renderTeacherLockChoice(); },
    cancelTeacherLock() { ui.teacherLockDraft = null; closeControlOverlay(); },
    saveTeacherLock() {
      const draft = ui.teacherLockDraft;
      if (!draft) return;
      if (draft.value === null) return controlToast('请选择设置后的状态');
      ui.teacherLockDraft = null;
      confirmControl(draft.target, draft.value);
    },
    selectedRefs: currentSelectedRefs,
    fillDefault() {
      collectEditor();
      if (controlModule === 'duration' && durationIsDefault(ui.editor.rule)) return;
      if (controlModule === 'duration') ui.editor.rule = R.expandSettingGroups(R.durationWeek({durationRules:[]}, ui.editor.rule.id), [], 'duration');
      else ui.editor.value = { answer: 'false', explanation: 'false' };
      renderEditor(); controlToast('已填入默认设置，保存后生效');
    },
    toggleClassWorld(value) {
      if (controlDemoRole === 'admin' || controlModule !== 'world' || typeof value !== 'boolean' || !classRefs().length) return;
      request(makeOperation(classRefs(), selectedTeacherClass, 'boolean', value, { scope: 'all' }));
    },
    booleanEditor(refs, label, value = null, school = false) {
      if (!refs.length) return controlToast('请先选择操作对象');

      const lock = controlModule === 'lock' && controlDemoRole === 'admin';
      if (label === '所选对象') label = controlDemoRole === 'admin' ? [...adminSelectedScopes].join('、') : selectedTeacherClass;
      if (lock && value !== null) {
        ui.lockConfirmation = R.copy(refs);
        ui.pending = null;
        const changed = refs.filter(ref => Boolean(refLocked(ref)) !== value).length;
        const text = value ? '开启临时锁屏' : '解除临时锁屏';
        return controlOverlay('确认' + text + '？', `<p class="control-scope">${esc(label)}</p><p>${school && !value ? '结束全校临时管控，恢复日常锁屏和老师操作权限。' : '解除后恢复日常锁屏状态。'}${!school && temporaryLockActive() && !value ? '解除后，该班老师恢复原有锁屏操作权限。' : ''}</p>`, button('取消', 'closeControlOverlay()', true) + button('确认', school ? `parity.toggleTemporaryLock(${value},true)` : `parity.commitScopedLock(${value})`));
      }
      ui.boolean = { refs: R.copy(refs), label, value, scope: needScope(refs) ? null : 'all', lock, school };
      this.renderBoolean();
    },
    commitScopedLock(value) { if (ui.lockConfirmation) this.setTemporaryLocks([{key:'selection',refs:ui.lockConfirmation}], value, true); },
    renderBoolean() {
      const b = ui.boolean, rows = R.resolve(loadLatest(), b.refs);
      const eligible = rows.filter(({ student }) => b.scope !== 'unmodified' || !R.modified(student, 'world'));
      const changed = b.value === null ? 0 : eligible.filter(({ ref, student }) => (b.lock ? refLocked(ref) : student.world) !== b.value).length;
      const classes = [...new Set(b.refs.map(ref => ref.className))];
      const options = [true, false].map(value => {
        const count = classes.filter(className => Boolean(refLocked({ className })) !== value).length;
        return `<label class="parity-borrow-option"><input type="radio" name="parity-boolean" ${b.value === value ? 'checked' : ''} onchange="parity.chooseBoolean(${value})"><span class="parity-borrow-option-body"><span><b>${b.lock ? value ? '开启临时锁屏' : '解除临时锁屏' : value ? '开放' : '关闭'}</b><small>${b.lock ? `${count}个班${value ? '未开启' : '已开启'}` : `所选班级将${value ? '开放' : '关闭'}`}</small></span><i>✓</i></span></label>`;
      }).join('');
      controlOverlay(b.lock ? '设置临时锁屏' : '设置万象视界', `<p class="control-scope">${esc(b.label)} · ${selectedStudentsLink(b.refs)}</p><fieldset class="parity-borrow-choice">${options}</fieldset>${b.value !== null && b.scope ? `<p>${changed ? '所选班级将按当前设置生效。' : '当前选择无需修改。'}</p>` : ''}${b.lock && temporaryLockActive() && !b.school ? '<p>解除临时锁屏后，该班老师恢复原有锁屏操作权限。</p>' : ''}<p id="parity-error" class="control-error"></p>`, button('取消', 'parity.cancelBoolean()', true) + button('保存', 'parity.saveBoolean()', false, b.value !== null && b.scope && !changed && !b.school));
      const overlay = document.getElementById('control-overlay');
      overlay?.querySelectorAll?.('[name=parity-apply-scope]').forEach(input => input.onchange = () => { b.scope = input.value; this.renderBoolean(); });
    },
    chooseBoolean(value) { ui.boolean.value = value; this.renderBoolean(); },
    saveBoolean() {
      const b = ui.boolean;
      if (b.value === null || !b.scope) return controlToast(b.value === null ? '请选择设置后的状态' : '请选择本次修改范围');
      if (b.lock) {
        if (b.school) return this.toggleTemporaryLock(b.value, true);
        return this.setTemporaryLocks([{ key: 'selection', refs: b.refs }], b.value, true);
      }
      ui.pending = makeOperation(b.refs, b.label, 'boolean', b.value, { scope: b.scope }); apply();
    },
    setTemporaryLocks(entries, active, confirmed = false) {
      try {
        controlModule = 'lock';
        if (controlDemoRole !== 'admin') throw Error('仅学校管理员可操作临时锁屏');
        if (entries.some(entry => entry.key.startsWith('student:') || entry.key.startsWith('class:'))) throw Error('学校管理员仅支持全校或年级操作');
        if (!entries.length) return controlToast('请先选择操作对象');
        if (!confirmed) return this.booleanEditor(entries.flatMap(entry => entry.refs), entries.map(entry => entry.key.replace(/^(class|grade):/, '')).join('、'), active);
        const latest = loadLatest();
        entries.forEach(entry => R.resolve(latest, entry.refs));
        latest.schoolSettings ||= {};
        latest.schoolSettings.temporaryLocks ||= {};
        const changed = entries.filter(entry => entry.refs.some(ref => Boolean(refLocked(ref, latest)) !== active));
        if (!changed.length) return controlToast(active ? '所选范围已开启临时锁屏' : '所选范围未开启临时锁屏');
        latest.schoolSettings.temporaryClassStates ||= {};
        const changedRefs = changed.flatMap(entry => entry.refs).filter(ref => Boolean(refLocked(ref, latest)) !== active);
        changed.forEach(entry => entry.refs.forEach(ref => latest.schoolSettings.temporaryClassStates[ref.className] = active));
        recordTemporaryLock(latest, changedRefs);
        persist(latest); ui.pending = null; closeControlOverlay(true); renderControl();
        controlToast(active ? '已开启所选范围临时锁屏' : '已解除临时锁屏');
      } catch (error) { conflict(error); }
    },
    studentTemporaryLock(id) {
      const refs = targetRefs(id), key = studentLockKey(refs[0]);
      this.setTemporaryLocks([{ key, refs }], !ownTemporaryLock(key));
    },
    toggleTemporaryLock(value, confirmed = false) {
      try {
        controlModule = 'lock';
        if (controlDemoRole !== 'admin') throw Error('仅学校管理员可操作全校临时锁屏');
        const latest = loadLatest(), active = typeof value === 'boolean' ? value : !temporaryLockActive(latest);
        if (!confirmed) return this.booleanEditor(allRefs(), '全校', active, true);
        if (active === temporaryLockActive(latest)) return controlToast(active ? '已开启全校临时锁屏' : '已解除临时锁屏');
        // 只叠加临时状态，保留原有锁屏配置；最近操作信息独立更新。
        latest.schoolSettings ||= {};
        latest.schoolSettings.temporaryLocks = {};
        latest.schoolSettings.temporaryClassStates = Object.fromEntries(schoolControlClasses.map(className => [className, active]));
        latest.schoolSettings.temporaryLock = { active, ...actor(), at: new Date().toLocaleString('zh-CN', { hour12: false }) };
        recordTemporaryLock(latest, allRefs());
        persist(latest);
        ui.pending = null;
        closeControlOverlay(true);
        renderControl();
        controlToast(active ? '已开启全校临时锁屏' : '已解除临时锁屏');
      } catch (error) { conflict(error); }
    },
    newBorrowRule() {
      if (!canEdit('borrowing')) return controlToast('借用规则由学校管理员统一设置');
      controlOverlay('新增借用规则', `<div class="parity-borrow-type-actions">${button('每周固定借用规则', "parity.chooseBorrowType('weekly')", true)}${button('指定日期借用规则', "parity.chooseBorrowType('dates')", true)}</div>`, button('取消', 'closeControlOverlay()', true));
    },
    chooseBorrowType(mode) { closeControlOverlay(); this.schoolBorrowEdit(null, mode); },
    schoolBorrowEdit(id, mode) { if (mode) ui.borrowMode = mode; openEditor(allRefs(), '全校', id, true); },
    schoolBorrowDelete(ruleId) { request(makeOperation(allRefs(), '全校', 'delete', null, { ruleId, schoolRule: true, scope: 'all' })); },
    showIndividuals(){if(['duration','homework'].includes(controlModule))return this.chooseDurationStudents(controlModule);if(controlModule==='world'){controlView='module';return worldControlPage();}controlView='individuals';renderControl();},
    back() { ui.homeworkDrill=null; if(controlView==='individuals' || controlView==='studentDetail') { controlView='module';return renderControl(); } if (controlView === 'students') { controlView = 'module'; controlSelected.clear(); return renderControl(); } if (controlDemoRole === 'admin') return adminBack(); leaveControlCenter(); },
    startSelection() { return controlToast('请在全校或年级分别设置'); },
    cancelSelection() { adminBatchMode = false; controlSelected.clear(); adminSelectedScopes.clear(); controlView = 'module'; renderControl(); },
    selectScope(key, value) { if (!scopeRefs(key).length) return; value ? adminSelectedScopes.add(key) : adminSelectedScopes.delete(key); renderControl(); },
    selectStudent(id) { if (controlDemoRole !== 'admin' && (controlModule !== 'world' || controlView !== 'students')) return; controlSelected.has(id) ? controlSelected.delete(id) : controlSelected.add(id); this.renderRows(); },
    selectAll(value) { const admin = controlDemoRole === 'admin', set = admin ? adminSelectedScopes : controlSelected; (admin ? visibleScopeKeys() : filteredControlStudents().map(s => s.id)).forEach(key => value ? set.add(key) : set.delete(key)); if(admin)renderControl();else this.renderRows(); },
    studentFilter(query, filter) { if (query !== null) controlQuery = query; if (filter !== null) controlFilter = filter; controlSelected.clear(); this.renderRows(); },
    renderRows() { const rows = document.getElementById('parity-student-rows'); if (rows) rows.innerHTML = studentRows(); const footer = document.querySelector('.parity-batchbar'); if (footer) footer.outerHTML = selectionFooter(); },
    editScope(key) { if (controlDemoRole === 'admin' && /班/.test(key) && schoolControlClasses.includes(key)) return controlToast('学校管理员仅支持全校或年级操作'); openEditor(scopeRefs(key), key); },
    selectedEdit() { if (controlDemoRole !== 'admin') return controlToast('老师仅可设置整个班级'); const refs = currentSelectedRefs(); const names = [...adminSelectedScopes]; openEditor(refs, names.join('、')); },
    currentScopeLock() {
      if (controlDemoRole !== 'admin' || controlModule !== 'lock') return;
      if (adminLevel === 'school') return this.toggleTemporaryLock();
      const refs = activeRefs(), states = refs.map(ref => Boolean(refLocked(ref)));
      return this.booleanEditor(refs, scopeLabel(), states.some(Boolean) && states.some(value => !value) ? null : !states.every(Boolean));
    },
    scopeBoolean(key, value) { if (controlDemoRole === 'admin' && /班/.test(key) && schoolControlClasses.includes(key)) return controlToast('学校管理员仅支持全校或年级操作'); const refs = scopeRefs(key); const states = refs.map(ref => Boolean(refLocked(ref))); return this.booleanEditor(refs, key, controlModule === 'world' || states.some(Boolean) && states.some(v => !v) ? null : !states.every(Boolean)); },
    selectedBoolean(value) {
      if (controlDemoRole !== 'admin') return controlToast('老师仅可设置整个班级');
      if (!currentSelectedRefs().length) return controlToast('请选择要开放的学生');
      if (controlModule === 'lock' && controlDemoRole === 'admin') return this.setTemporaryLocks(selectionLockEntries(), value);
      request(makeOperation(currentSelectedRefs(), '所选学生', 'boolean', value));
    },
    selectedReset() {
      if (controlDemoRole !== 'admin') return controlToast('老师仅可设置整个班级');
      const refs = currentSelectedRefs(); if (!refs.length) return;
      if (controlModule === 'borrowing') { this.borrowDeleteChoice(refs, '所选对象'); return; }
      request(makeOperation(refs, '所选对象', 'reset', null));
    },
    resetCurrent() { request(makeOperation(activeRefs(), scopeLabel(), 'reset', null)); },
    resetStudent(id) { if (controlDemoRole !== 'admin') return controlToast('老师仅可设置班级'); request(makeOperation(targetRefs(id), selectedTeacherClass, 'reset', null)); },
    borrowDeleteChoice(refs, label) {
      try {
        assertPermission(refs, 'borrowing');
        const modes = [...new Set(R.resolve(loadLatest(), refs).flatMap(({ student }) => student.schedules.map(rule => rule.mode)))];
        if (!modes.length) return controlToast('所选范围内没有有效借用规则，无需删除');
        const operation = makeOperation(refs, label, 'delete', null);
        if (modes.length === 1) return request({ ...operation, mode: modes[0] });
        ui.pending = operation;
        controlOverlay('删除哪类借用规则？', '<p class="control-confirm-copy">删除所选类型的借用规则，另一类型规则保留。没有有效规则时不能借用。</p>', button('取消', 'closeControlOverlay()', true) + button('每周固定', "parity.deleteMode('weekly')", true) + button('指定日期', "parity.deleteMode('dates')"));
      } catch (error) { conflict(error); }
    },
    deleteMode(mode) { const operation = { ...ui.pending, mode }; request(operation); },
    editStudentRule(id, ruleId) { openEditor(targetRefs(id), selectedTeacherClass + ' · ' + controlStudents().find(s => s.id === id).name, ruleId); },
    deleteStudentRule(id, ruleId) { if (controlDemoRole !== 'admin') return controlToast('老师仅可设置班级'); request(makeOperation(targetRefs(id), selectedTeacherClass + ' · ' + controlStudents().find(s => s.id === id).name, 'delete', null, { ruleId })); },
    cancelEditor(force = false) {
      collectEditor();
      if (!force && ui.editor && (ui.editor.formRows&&ui.editor.selectionChanged || ui.editor.initial !== (ui.editor.subjectValues ? JSON.stringify(ui.editor.subjectValues) : JSON.stringify([ui.editor.rule, ui.editor.value, ui.editor.scope])))) return controlOverlay('放弃未保存的修改？', '<p>放弃后，本次修改不会保存。</p>', button('继续编辑', ui.editor.modal ? 'parity.renderEditor()' : 'closeControlOverlay()', true) + button('放弃修改', 'parity.cancelEditor(true)'));
      const view = ui.editor?.returnView; ui.editor = null; ui.pending = null; controlView = view || 'module'; renderControl();
    },
    renderEditor,
    editorMode(mode) { if (!ui.editor || ui.editor.editingId || ui.editor.schoolRule) return; collectEditor(); ui.editor.rule.mode = mode; ui.editor.rule.deny = mode === 'dates'; renderEditor(); },
    borrowWay() { collectEditor(); renderEditor(); },
    borrowDateChanged() {
      const start = document.getElementById('parity-date-start'), end = document.getElementById('parity-date-end'), error = document.getElementById('parity-error');
      start.min = R.today();
      if (start.value && start.value < start.min) { start.value = ''; error.textContent = '生效日期只能选择今天及以后'; }
      end.min = start.value && start.value > R.today() ? start.value : R.today();
      if (end.value && end.value < end.min) { end.value = ''; error.textContent = '结束日期不能早于今天或开始日期'; }
    },
    durationGroupChanged() { collectEditor(); renderEditor(); },
    addDurationGroup() { collectEditor(); const groups=ui.editor.rule.settingGroups, days=[0,1,2,3,4,5,6].filter(day=>!groups.some(group=>group.weekdays.includes(day))); if(!days.length) return controlToast('请先从已有组取消需要分组的星期'); groups.push({weekdays:days,value:R.durationWeek({durationRules:[]}).dailySettings[0]}); renderEditor(); },
    removeDurationGroup(index) { collectEditor(); if(ui.editor.rule.settingGroups.length<=1)return controlToast('至少保留一组规则');ui.editor.rule.settingGroups.splice(index,1); ui.editor.rule=R.expandSettingGroups(ui.editor.rule,ui.editor.rule.settingGroups,'duration'); renderEditor(); },
    durationPeriod(day){return this.pickDurationPeriod(day);},
    pickDurationPeriod(group,index){collectEditor();if(!ui.editor)return;schoolControl.pickExternalTime(ui.editor.rule.settingGroups[group].value.periods,index,periods=>{if(!ui.editor)return;ui.editor.rule.settingGroups[group].value.periods=periods;renderEditor();});},
    toggleClassDuration(value){controlModule='duration';try{assertPermission(classRefs(),'duration');const d=loadLatest();d.schoolSettings.durationClassEnabled||={};d.schoolSettings.durationClassEnabled[selectedTeacherClass]=!!value;persist(d);renderControl();controlToast(value?'已开启本班时长规则':'已关闭本班时长规则');}catch(error){conflict(error);}},
    durationType(value) { collectEditor(); ui.editor.rule.useDefault = value; renderEditor(); },
    addPeriod() { const host = document.getElementById('parity-periods'); host.insertAdjacentHTML('beforeend', periodRow({ start: '', end: '' }, host.children.length)); },
    saveEditor() {
      collectEditor(); const editor = ui.editor, rule = editor.rule, error = document.getElementById('parity-error');
      if(controlDemoRole!=='admin'&&['duration','homework'].includes(controlModule)&&!editor.refs.length){error.textContent='请选择学生';return;}
      if(controlDemoRole!=='admin'&&['duration','homework'].includes(controlModule)){
        try{
          const latest=loadLatest(),original=new Set(editor.originalStudentIds||[]);
          const duplicate=R.resolve(latest,editor.refs).some(({ref,student})=>!original.has(String(ref.id))&&studentHasRule(student,controlModule,homeworkSubject()));
          if(duplicate){error.textContent='所选学生已有规则，请重新选择';return;}
        }catch(problem){error.textContent=problem.message||'学生名单或规则已变化，请重新选择';return;}
      }
      if (editor.subjectValues) return saveHomeworkSubjects(editor);
      if (needScope(editor.refs) && !editor.scope) { error.textContent = '请选择本次修改范围'; return; }
      if (controlModule === 'borrowing') {
        const problem = R.validateBorrow(rule); if (problem) { error.textContent = problem; return; }
      } else if (controlModule === 'duration' && rule.dailySettings) {
        const problem = R.validateSettingGroups(rule.settingGroups,'duration') || R.validateDurationWeek(rule); if (problem) { error.textContent = problem; return; }
      } else if (controlModule === 'duration') {
        if (!rule.weekdays.length) { error.textContent = '请至少选择一个星期'; return; }
        if (!rule.useDefault && (![rule.continuousMinutes, rule.restMinutes, rule.dailyMinutes].every(value => Number.isInteger(value) && value > 0) || rule.dailyMinutes < rule.continuousMinutes)) { error.textContent = '时长须为正整数，每日累计不能短于连续使用时长'; return; }
        const problem = R.validatePeriods(rule.periods, true); if (problem && !rule.useDefault) { error.textContent = problem; return; }
      } else if (!['true', 'false'].includes(String(editor.value.answer)) || !['true', 'false'].includes(String(editor.value.explanation))) { error.textContent = '请选择答案和详解权限'; return; }
      if(controlModule==='duration'&&editor.studentRule){
        try{if(matchesGradeDuration(rule,loadLatest())){if(!editor.originalStudentIds?.length)return controlToast('已是默认规则，无需保存');return restoreTeacherDuration(editor);}}catch(problem){return conflict(problem);}
      }
      const value = controlModule === 'homework' ? { answer: String(editor.value.answer) === 'true', explanation: String(editor.value.explanation) === 'true' } : R.copy(rule);
      const operation = makeOperation(editor.refs, editor.label, 'save', value, { subject: editor.subject, base: editor.base, scope: editor.scope, editingId: editor.editingId, schoolRule: editor.schoolRule });
      if (editor.modal||editor.formRows) { ui.pending = operation; return apply(); }
      request(operation);
    },
    confirmScope() { const scope = document.querySelector('[name=parity-apply-scope]:checked')?.value; if (!scope) { document.getElementById('parity-error').textContent = '请选择本次修改范围'; return; } request({ ...ui.pending, scope }); },
    apply,
  };
  window.renderControl = renderControl;
  window.filteredControlStudents = filteredControlStudents;
  window.openControlEditor = target => {
    if (controlDemoRole === 'admin' && typeof target === 'number') return controlToast('学校管理员仅支持全校或年级操作');

    openEditor(targetRefs(target), target === 'adminSelected' ? '所选对象' : selectedTeacherClass + (typeof target === 'number' ? ' · ' + (controlStudents().find(s => s.id === target)?.name || '') : ''));
  };
  window.confirmControl = (target, value) => {
    if(controlDemoRole!=='admin'&&controlModule==='lock')return parity.toggleClassLock(value);
    if (controlDemoRole === 'admin' && typeof target === 'number') return controlToast('学校管理员仅支持全校或年级操作');

    if (controlModule === 'lock' && controlDemoRole === 'admin') return parity.setTemporaryLocks([{ key: scopeLockKey(selectedTeacherClass), refs: classRefs() }], value);
    if (controlModule === 'world') return parity.booleanEditor(targetRefs(target), selectedTeacherClass + (typeof target === 'number' ? ' · ' + (controlStudents().find(s => s.id === target)?.name || '') : ''), null);
    request(makeOperation(targetRefs(target), selectedTeacherClass + (typeof target === 'number' ? ' · ' + (controlStudents().find(student=>student.id===target)?.name || '') : ''), 'boolean', value));
  };
  window.adminBatchAction = (module, value) => { controlModule = module; if (module === 'lock') return parity.toggleTemporaryLock(value); request(makeOperation(allRefs(), '全校', 'boolean', value)); };
  window.toggleHomeworkPermission = (id, key, value) => {
    if(!['answer','explanation'].includes(key)||typeof value!=='boolean')return;

    const refs = targetRefs(id);
    try {
      const subject = homeworkSubject();
      assertPermission(refs, 'homework', subject);
      const result = R.transaction(loadLatest(), refs, homeworkModule(subject), null, 'all', student => {
        const current = R.homeworkValue(student, subject);
        student.homeworkSubjects = { ...student.homeworkSubjects, [subject]: { ...current, [key]: value } };
      }, actor());
      persist(result.data); renderControl(); controlToast('权限已' + (value ? '开启' : '关闭'));
    } catch (error) { conflict(error); }
  };
  window.toggleSchoolBorrowing = () => controlOverlay(`确认${schoolBorrowingEnabled ? '关闭' : '开启'}全校柜机借用管控？`, `<p class="control-confirm-copy">${schoolBorrowingEnabled ? '关闭后，所有班级均不能从柜机借用平板，已有规则保留。' : '开启后，仅允许在有效规则允许的时段借用，没有有效规则时不能借用。'}</p>`, button('取消', 'closeControlOverlay()', true) + button('确认生效', `applySchoolBorrowing(${!schoolBorrowingEnabled})`));
  const borrowStates = data => JSON.stringify([...schoolControlClasses.flatMap(name => (data[name] || []).flatMap(student => student.schedules || [])), ...(data.schoolSettings?.borrowingRules || [])].filter(rule => rule.mode === 'dates').map(rule => [rule.id, R.borrowStatus(rule)]));
  let displayedBorrowStates = borrowStates(controlData), checkedDate = R.today(), refreshPending = false;
  const overlayOpen = () => typeof document !== 'undefined' && Boolean(document.querySelector?.('#control-overlay .control-shade'));
  const refreshBlocked = () => stage !== 'teacherDesk' || teacherTab !== 'control' || document.hidden || window.controlPageDemo?.isActive() || ui.editor || ui.pending || ui.boolean || ui.teacherLockDraft || ui.lockPicker || ui.durationSelection || ui.worldPicker || window.schoolControl?.busy?.() || window.borrowing?.busy() || overlayOpen();
  const refreshExpiredRules = (external = false) => {
    if (external) refreshPending = true;
    if (refreshBlocked()) return;
    // Date-rule status changes at midnight. Other tabs notify through storage events.
    const today = R.today();
    if (!refreshPending && today === checkedDate) return;
    try {
      const latest = loadLatest(), states = borrowStates(latest);
      checkedDate = today;
      const changed = states !== displayedBorrowStates;
      displayedBorrowStates = states;
      if (changed || refreshPending && JSON.stringify(latest) !== JSON.stringify(controlData)) { controlData = latest; window.renderControl(); }
      refreshPending = false;
    } catch { /* Keep current UI when stored data cannot be read. */ }
  };
  window.addEventListener('focus', () => refreshExpiredRules(true));
  setInterval(refreshExpiredRules, 60000);
  window.addEventListener('storage', event => {
    if (event.key !== storageKey && event.key !== null) return;
    refreshExpiredRules(true);
  });
  if (window.controlPrototypeReady !== false && stage === 'teacherDesk' && teacherTab === 'control') renderControl();
})();
