/* 小程序管控页面：复用教师端规则语义，保留手机子页面及直接开关交互。 */
(() => {
  const R = window.controlRules;
  const storageKey = 'teacher-control-prototype-v1';
  const ui = { editor: null, pending: null, borrowMode: 'weekly', boolean: null };
  // 总开关已撤销，历史值不再限制规则编辑或执行。
  schoolBorrowingEnabled = true;
  const legacyCloseOverlay = window.closeControlOverlay;
  window.closeControlOverlay = (force = false) => {
    if (ui.roster) {
      document.getElementById('control-overlay').replaceChildren(...ui.roster.nodes);
      ui.roster.trigger?.focus(); ui.roster = null; return;
    }
    if (!force && ui.boolean && (ui.boolean.value !== null || needScope(ui.boolean.refs) && ui.boolean.scope !== null)) return controlOverlay('放弃未保存的修改？', '<p>本次修改不会保存。</p>', button('继续编辑', 'parity.renderBoolean()', true) + button('放弃修改', 'parity.cancelBoolean()'));
    ui.pending = null; ui.boolean = null; legacyCloseOverlay();
  };
  const stateLabels = () => controlModule === 'borrowing' ? ['已设置', '未设置'] : controlModule === 'duration' ? ['有单独规则', '默认规则'] : controlModule === 'homework' ? ['有开放权限', '均不允许'] : controlModule === 'world' ? ['有允许使用学生', '全部禁止使用'] : ['有已锁屏学生', '全部未锁屏'];
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const uid = () => 'rule-' + crypto.randomUUID();
  const actor = () => ({ by: controlWorkView === 'school' ? '学校管理员' : '陈老师', phone: '13800138000', role: controlWorkView });
  const allRefs = () => schoolControlClasses.flatMap(className => controlData[className].map(s => ({ className, id: s.id })));
  const classRefs = () => controlStudents().map(s => ({ className: selectedTeacherClass, id: s.id }));
  const targetRefs = target => target === 'school' ? allRefs() : target === 'adminSelected' ? R.copy(adminBulkRefs) : classRefs().filter(ref => target === 'all' || target === 'selected' && controlSelected.has(ref.id) || target === ref.id);
  const scopeRefs = key => (adminLevel === 'school' ? schoolControlClasses.filter(name => name.startsWith(key)) : [key]).flatMap(className => controlData[className].map(s => ({ className, id: s.id })));
  const activeRefs = () => controlDemoRole === 'admin' ? adminLevel === 'school' ? allRefs() : adminLevel === 'grade' ? schoolControlClasses.filter(name => name.startsWith(adminSelectedGrade)).flatMap(className => controlData[className].map(s => ({ className, id: s.id }))) : classRefs() : classRefs();
  const scopeLabel = () => controlDemoRole !== 'admin' || adminLevel === 'class' ? selectedTeacherClass : adminLevel === 'grade' ? adminSelectedGrade : '全校';
  const needScope = (refs, module = controlModule) => controlDemoRole === 'admin' && refs.length > 1 && ['duration', 'homework', 'world'].includes(module);
  const durationAllowed = (data = controlData) => data.schoolSettings?.homeroomDurationEnabled === true;
  const canEdit = (module = controlModule) => controlDemoRole === 'admin' || module !== 'borrowing' && (module !== 'lock' || !temporaryLockActive()) && (module !== 'duration' || controlWorkView === 'homeroom' && durationAllowed());
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
    return temporaryLockActive() || refs.some(ref => refLocked(ref)) ? `<p class="parity-note" role="status">${temporaryLockActive() ? '全校' : ''}临时锁屏管控中，老师暂不可修改锁屏。</p>` : '';
  };
  function lockToggle(module, on, action, label) {
    if ((module === 'world' || module === 'lock') && controlDemoRole === 'admin') return button(module === 'world' ? '设置' : on ? '解除临时锁屏' : '设置临时锁屏', action, true);
    const html = binaryToggleButton(module, on, action, label);
    return module === 'lock' && controlDemoRole !== 'admin' && temporaryLockActive() ? html.replace('<button ', '<button disabled aria-disabled="true" ') : html;
  }
  function assertPermission(refs, module) {
    if (controlDemoRole === 'admin') {
      const rows = R.resolve(controlData, refs);
      if (schoolControlClasses.some(className => {
        const ids = new Set(rows.filter(row => row.ref.className === className).map(row => row.ref.id));
        return ids.size > 0 && ids.size !== controlData[className].length;
      })) throw Error('学校管理员仅支持全校、年级或班级操作');
      return;
    }
    const latest = loadLatest();
    if (module === 'borrowing') throw Error('借用规则由学校管理员统一设置，老师仅可查看');
    if (module === 'duration' && !durationAllowed(latest)) throw Error('学校暂未开放班主任调整使用时长');
    if (module === 'lock' && (temporaryLockActive(latest) || refs.some(ref => refLocked(ref, latest)))) throw Error('学校管理员正在进行临时锁屏管控，暂时无法修改锁屏状态。');
    const classes = controlWorkView === 'homeroom' ? [controlClasses[0]] : controlClasses;
    if (refs.some(ref => !classes.includes(ref.className)) || ['borrowing', 'duration'].includes(module) && controlWorkView !== 'homeroom') throw Error('当前身份没有该范围的管控权限');
  }
  const baseFor = (refs, module = controlModule) => Object.fromEntries(R.resolve(controlData, refs).map(({ ref, student }) => [ref.className + ':' + ref.id, R.signature(student, module)]));
  const card = (title, body) => `<section class="control-module-panel"><h3>${title}</h3>${body}</section>`;
  const button = (text, action, secondary = false, disabled = false) => `<button type="button" class="control-${secondary ? 'secondary' : 'primary'}" onclick="${action}" ${disabled || controlDemoRole !== 'admin' && controlModule === 'lock' && temporaryLockActive() && /selectedBoolean|confirmControl|scopeBoolean/.test(action) ? 'disabled' : ''}>${text}</button>`;
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
  function loadLatest() {
    const stored = localStorage.getItem(storageKey);
    if (!stored) return controlData;
    const latest = JSON.parse(stored);
    if (!schoolControlClasses.every(name => Array.isArray(latest[name]))) throw Error('当前数据已变化，请刷新后重试');
    return latest;
  }
  function persist(next) {
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
    if (module === 'duration') return R.durationGroups(student);
    if (module === 'homework') return [`答案${student.answer ? '允许' : '不允许'} · 详解${student.explanation ? '允许' : '不允许'}`];
    return [module === 'world' ? student.world ? '万象视界允许使用' : '万象视界禁止使用' : isLocked(student) ? '平板已锁屏' : '平板未锁屏'];
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
    if (controlModule === 'duration') return card('全校默认配置说明', `<p>${R.dayText(R.defaultDuration.weekdays)} · ${R.durationText(R.defaultDuration)}</p>`) + (controlDemoRole === 'admin' && adminLevel === 'school' ? card('允许班主任调整本班使用时长', `<p>开放后可调整；关闭后不能修改，已有设置继续生效。</p>${button(durationAllowed() ? '关闭调整权限' : '开放调整权限', 'parity.durationPermission()', true)}`) : controlDemoRole !== 'admin' && !durationAllowed() ? '<p class="parity-note">学校暂未开放调整权限，仅可查看。</p>' : '');
    if (controlModule === 'homework') return card('学生权限', '<p>默认所有学生不能查看答案和详解。</p>');
    const students = R.resolve(controlData, activeRefs()).map(row => row.student), count = students.filter(s => controlModule === 'world' ? s.world : isLocked(s)).length;
    if (controlModule === 'lock' && controlDemoRole === 'admin') return card('临时锁屏', '<p>解除后恢复日常锁屏状态。<b>临时锁屏老师不可操作。</b></p>');
    return card(scopeLabel() + '当前状态', `<p>${count}人${controlModule === 'world' ? '允许使用' : '已锁屏'} · ${students.length - count}人${controlModule === 'world' ? '禁止使用' : '未锁屏'}</p>${controlDemoRole === 'admin' && controlModule === 'world' && adminLevel === 'school' ? button('设置全校使用状态', "parity.schoolWorld()") : ''}`);
  }
  function schoolStatus(module) {
    const students = adminAllStudents();
    if (module === 'lock') {
      const states = allRefs().map(ref => Boolean(refLocked(ref)));
      return states.length && states.every(Boolean) ? '临时锁屏全部开启' : states.some(Boolean) ? '临时锁屏部分开启' : '临时锁屏未开启';
    }
    if (module === 'world') {
      const allowed = students.filter(student => student.world).length;
      return `允许使用 ${allowed} 人 · 禁止使用 ${students.length - allowed} 人`;
    }
    const mixed = new Set(students.map(student => configurationKey(student, module))).size > 1;
    return mixed ? '学生规则有差异' : module === 'homework' && !students.some(student => student.answer || student.explanation) ? '答案、详解均不允许' : '学生规则一致';
  }
  function selectedStudentsLink(refs) {
    return `已选 ${refs.length} 名学生 <button type="button" aria-label="查看所选学生名单" style="border:0;background:none;color:inherit;padding:4px 8px;cursor:pointer" onclick="parity.showSelectedStudents('${encodeURIComponent(JSON.stringify(refs))}')">›</button>`;
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
    const admin = controlDemoRole === 'admin', students = admin ? adminAllStudents() : controlStudents(), locked = students.filter(s => isLocked(s)).length;
    const lockScope = admin ? '全校' : '全班', lockAction = admin ? "adminBatchAction('lock'," : "controlModule='lock';confirmControl('all',";
    const temporary = admin ? temporaryLockActive() : temporaryLockActive() || classRefs().some(ref => refLocked(ref));
    const lockActions = admin ? button(temporary ? '解除临时锁屏' : '一键临时锁屏', 'parity.toggleTemporaryLock()', temporary) : temporary ? button('全校临时锁屏中', '', true, true) : button(lockScope + '解锁', lockAction + 'false)', true, !locked) + button(lockScope + '锁屏', lockAction + 'true)', false, locked === students.length);
    const lockDescription = admin ? '<p class="parity-note">解除后恢复日常锁屏状态。<b>临时锁屏老师不可操作。</b></p>' : lockNotice();
    const lockCard = `<section class="control-entry-lock"><div class="control-entry-lock-head"><div><h3>${admin ? '全校临时锁屏' : '平板锁屏'}</h3><p>${admin ? schoolStatus('lock') : locked + '人已锁屏 · ' + (students.length - locked) + '人未锁屏'}</p></div><button onclick="${admin ? "enterAdminModule('lock')" : "openControlModule('lock')"}">查看详情 ›</button></div>${lockDescription}<div class="control-actions">${lockActions}</div></section>`;
    const borrowCard = admin ? `<section class="admin-school-toggle" onclick="enterAdminModule('borrowing')"><div class="admin-school-toggle-top"><div><h3>全校借用管控</h3><p>按学校设置的日期和时段借用</p></div><span class="admin-detail-link">查看详情 ›</span></div></section>` : '';
    const entries = [...(admin || isHeadTeacherClass() ? [['duration', '使用时长管控', '设置使用时长、休息和每日可用时段']] : []), ['homework', '智阅作业', '设置答案和详解的查看权限'], ['world', '万象视界', '允许或禁止学生进入']];
    const list = entries.map(([module, title, description]) => `<button class="control-entry-card" onclick="${admin ? 'enterAdminModule' : 'openControlModule'}('${module}')"><span class="control-entry-icon ${module}">${controlCardIcon(module)}</span><span class="control-entry-copy"><h3>${title}</h3>${admin ? `<p class="parity-school-status" role="status">${schoolStatus(module)}</p>` : ''}<p>${description}</p></span><span class="control-entry-action">›</span></button>`).join('');
    app.innerHTML = `<main class="screen control-screen">${header('管控', false)}${controlRoleSwitcher()}<section class="control-entry" id="teacher-tab-panel" role="tabpanel">${lockCard}${admin ? '' : `<div class="control-actions">${button('查看借用时间', 'parity.showBorrowTimes()', true)}</div>`}${borrowCard}<div class="control-entry-subtitle">其他管控</div><div class="control-entry-list">${list}</div></section>${teacherTabBar()}<div id="control-overlay"></div><div id="control-toast" role="status"></div></main>`;
    syncReview();
  }
  function scopeRows() {
    const keys = adminLevel === 'class' ? [selectedTeacherClass] : adminVisibleScopeKeys();
    return keys.map(key => {
      const refs = scopeRefs(key), students = R.resolve(controlData, refs).map(row => row.student);
      const next = adminLevel === 'school' ? `enterAdminGrade('${key}')` : '';
      const count = students.filter(s => controlModule === 'duration' ? s.durationRules.length : controlModule === 'borrowing' ? s.schedules.length : controlModule === 'homework' ? s.answer || s.explanation : controlModule === 'world' ? s.world : isLocked(s)).length;
      const direct = controlModule === 'world' || controlModule === 'lock', on = students.every(s => controlModule === 'world' ? s.world : isLocked(s));
      return `<div class="admin-level-row">${adminBatchMode ? `<label><input class="admin-level-check" type="checkbox" aria-label="选择${key}" ${adminSelectedScopes.has(key) ? 'checked' : ''} onchange="parity.selectScope('${key}',this.checked)"></label>` : ''}<button class="admin-level-link" ${!adminBatchMode && adminLevel !== 'school' ? 'disabled' : ''} onclick="${adminBatchMode ? `parity.selectScope('${key}',!adminSelectedScopes.has('${key}'))` : next}"><span class="admin-level-copy"><b>${key}</b><small>${students.length}名学生${controlModule === 'lock' ? ' · ' + (refs.every(ref => refLocked(ref)) ? '已开启临时锁屏' : refs.some(ref => refLocked(ref)) ? '部分开启临时锁屏' : '未开启临时锁屏') : ''}</small>${scopeModifiedInfo(students)}</span>${adminLevel === 'school' ? '<i>›</i>' : ''}</button>${!adminBatchMode ? `<div class="parity-scope-actions">${controlModule === 'lock' ? button(refs.every(ref => refLocked(ref)) ? '解除临时锁屏' : refs.some(ref => refLocked(ref)) ? '设置临时锁屏' : '临时锁屏', `parity.scopeBoolean('${key}',null)`, true) : direct ? lockToggle(controlModule, on, `parity.scopeBoolean('${key}',${!on})`, (on ? '关闭' : '开启') + key + controlLabels[controlModule]) : `<button onclick="parity.editScope('${key}')">设置</button>`}</div>` : ''}</div>`;
    }).join('') || '<div class="control-empty">没有符合条件的年级或班级</div>';
  }
  function selectionFooter(admin = false) {
    const refs = admin ? adminSelectionRefs() : targetRefs('selected'), selected = admin ? adminSelectedScopes.size : controlSelected.size;
    let actions;
    if ((controlModule === 'world' || controlModule === 'lock') && controlDemoRole === 'admin') {
      const states = R.resolve(controlData, refs).map(({ ref, student }) => controlModule === 'world' ? student.world : Boolean(refLocked(ref)));
      const mixed = states.some(Boolean) && states.some(value => !value);
      const action = mixed ? 'null' : String(!states.every(Boolean));
      actions = button(controlModule === 'world' ? '设置使用状态' : mixed ? '设置临时锁屏' : states.every(Boolean) ? '解除临时锁屏' : '开启临时锁屏', `parity.booleanEditor(parity.selectedRefs(),'所选对象',${controlModule === 'world' ? 'null' : action})`, false, !selected);
    } else if (controlModule === 'lock' || controlModule === 'world') {
      const states = R.resolve(controlData, refs).map(({ student }) => controlModule === 'lock' ? isLocked(student) : student.world);
      const blocked = controlModule === 'lock' && refs.some(ref => refLocked(ref));
      actions = (states.some(Boolean) ? button(controlModule === 'lock' ? '解锁' : '禁止使用', 'parity.selectedBoolean(false)', true, blocked) : '')
        + (states.some(value => !value) ? button(controlModule === 'lock' ? '锁屏' : '允许使用', 'parity.selectedBoolean(true)', false, blocked) : '');
    } else actions = button(controlModule === 'borrowing' ? '设置规则' : controlModule === 'duration' ? '设置时长' : '设置权限', 'parity.selectedEdit()', false, !selected || !canEdit());
    const visible = admin ? visibleScopeKeys() : filteredControlStudents().map(s => s.id), set = admin ? adminSelectedScopes : controlSelected;
    return `<footer class="admin-batchbar parity-batchbar"><label class="control-footer-select"><input type="checkbox" aria-label="全选" ${visible.length && visible.every(key => set.has(key)) ? 'checked' : ''} onchange="parity.selectAll(this.checked)"><span>全选</span><small>${selected}/${visible.length}</small></label><div class="admin-batch-actions">${button('取消', 'parity.cancelSelection()', true)}${actions}</div><small class="parity-affected">${selectedStudentsLink(refs)}</small></footer>`;
  }
  function scopePage() {
    const footer = adminBatchMode ? selectionFooter(true) : '';
    shell(controlLabels[controlModule], `${defaultCard()}<div class="admin-scope-summary"><b>${adminBatchMode ? '选择' : '按'}${adminLevel === 'school' ? '年级' : '班级'}${adminBatchMode ? '' : '查看'}</b>${adminBatchMode ? '' : '<button onclick="parity.startSelection()">批量设置</button>'}</div><div id="parity-scope-rows" class="admin-level-list">${scopeRows()}</div>`, 'parity.back()', footer);
  }
  function filteredControlStudents() {
    return controlStudents().filter(s => {
      if (!s.name.includes(controlQuery) && !String(s.id).padStart(6, '0').includes(controlQuery)) return false;
      const active = controlModule === 'duration' ? s.durationRules.length > 0 : controlModule === 'borrowing' ? R.prune(s.schedules).length > 0 : controlModule === 'homework' ? s.answer || s.explanation : controlModule === 'world' ? s.world : isLocked(s);
      return controlFilter === 'all' || (controlFilter === 'yes' ? active : !active);
    }).sort((a, b) => (b.operatedAt?.[controlModule] || 0) - (a.operatedAt?.[controlModule] || 0));
  }
  function studentRows() {
    return filteredControlStudents().map(s => {
      const selection = controlView === 'students', rules = controlModule === 'borrowing' || controlModule === 'duration';
      const main = `<b>${esc(s.name)}</b>${rules || selection ? `<span>${summary(s).map(esc).join('<br>')}</span>` : ''}${modifiedInfo(s)}`;
      if (selection) return `<button class="control-student-row ${controlSelected.has(s.id) ? 'selected' : ''}" onclick="parity.selectStudent(${s.id})"><span class="parity-student-main">${main}</span><span class="control-check">${controlSelected.has(s.id) ? '✓' : ''}</span></button>`;
      const direct = controlModule === 'lock' || controlModule === 'world', on = controlModule === 'lock' ? isLocked(s) : s.world;
      const action = controlModule === 'lock' && !canEdit() ? '' : controlModule === 'lock' && controlDemoRole === 'admin' ? lockToggle('lock', ownTemporaryLock(studentLockKey({ className: selectedTeacherClass, id: s.id })), `parity.studentTemporaryLock(${s.id})`, (ownTemporaryLock(studentLockKey({ className: selectedTeacherClass, id: s.id })) ? '解除临时锁屏：' : '临时锁屏：') + s.name) : direct ? lockToggle(controlModule, on, `confirmControl(${s.id},${!on})`, (on ? '关闭' : '开启') + s.name + controlLabels[controlModule]).replace('<button ', controlModule === 'lock' && refLocked({ className: selectedTeacherClass, id: s.id }) ? '<button disabled ' : '<button ') : controlModule === 'homework' ? `<span class="homework-inline-permissions">${permissionMiniSwitch(s, 'answer', '答案')}${permissionMiniSwitch(s, 'explanation', '详解')}</span>` : '<span class="control-detail-arrow">›</span>';
      return `<div class="parity-student-row"><button class="parity-student-main" onclick="openControlStudentDetail(${s.id})">${main}${direct ? `<span>${esc(summary(s)[0])}</span>` : ''}</button>${action}</div>`;
    }).join('') || '<div class="control-empty">没有符合条件的学生</div>';
  }
  function studentPage() {
    if (controlModule === 'lock' && !canEdit() && controlView === 'students') {
      controlView = 'module'; controlSelected.clear();
    }
    const selection = controlView === 'students';
    const reset = '';
    shell(selection ? '选择学生' : controlLabels[controlModule], `<div class="parity-context">${selectedTeacherClass}${selection ? ' · 可多选' : ''}</div>${selection ? '' : defaultCard()}${reset ? `<div class="control-actions">${reset}</div>` : ''}<div class="borrow-list-head"><b>${selection ? '选择学生' : controlModule === 'homework' ? '学生权限' : '学生规则'}</b>${selection || !canEdit() ? '' : `<button onclick="openControlStudents('${controlModule}')">批量设置</button>`}</div><div class="control-list-tools"><label class="borrow-list-search"><input aria-label="搜索学生姓名或编号" placeholder="搜索学生姓名或编号" value="${esc(controlQuery)}" oninput="parity.studentFilter(this.value,null)"></label><select class="borrow-status-filter" aria-label="筛选学生规则状态" onchange="parity.studentFilter(null,this.value)">${[['all', '全部'], ['yes', stateLabels()[0]], ['no', stateLabels()[1]]].map(([id, label]) => `<option value="${id}" ${controlFilter === id ? 'selected' : ''}>${label}</option>`).join('')}</select></div><div class="parity-student-list" id="parity-student-rows">${studentRows()}</div>`, 'parity.back()', selection ? selectionFooter() : '', selection ? 'control-student-screen' : '');
  }
  function ruleCards(student) {
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
      if (controlModule === 'duration' && canEdit()) footer = `<footer class="borrow-editor-actions parity-detail-actions">${button('新增使用时长规则', `openControlEditor(${student.id})`)}</footer>`;
    } else if (controlModule === 'homework') body += `<span class="homework-inline-permissions">${permissionMiniSwitch(student, 'answer', '答案')}${permissionMiniSwitch(student, 'explanation', '详解')}</span>`;
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
    shell('借用管控', content, 'leaveControlCenter()', canEdit() ? `<div class="parity-borrow-floating">${button('＋ 新增规则', 'parity.newBorrowRule()')}</div>` : '', 'parity-school-borrow');
  }
  function renderControl() {
    if (controlDemoRole !== 'admin' && controlModule === 'borrowing') {
      ui.editor = null; ui.pending = null; controlView = 'entry';
      return renderEntry();
    }
    if (controlView === 'entry' || controlView === 'home') return renderEntry();
    if (controlView === 'ruleEditor') return renderEditor();
    if (controlView === 'studentDetail' && controlDemoRole !== 'admin') return detailPage();
    if (controlModule === 'borrowing') return schoolBorrowPage();
    if (controlDemoRole === 'admin') {
      if (controlView === 'students' || controlView === 'studentDetail') { controlView = 'module'; controlSelected.clear(); }
      return scopePage();
    }
    return studentPage();
  }
  function scopeFields(editor) {
    if (controlModule === 'borrowing') return '<p class="control-form-note">默认对全校学生生效。</p>';
    const duration = controlModule === 'duration';
    return needScope(editor.refs) ? `<fieldset class="parity-apply-scope"><legend>本次修改哪些学生？</legend><label><input type="radio" name="parity-apply-scope" value="all" ${editor.scope === 'all' ? 'checked' : ''}>修改${editor.label === '全校' ? '全校' : '所选范围的'}所有学生<small>将替换${duration ? '班主任在所选星期' : '老师此前'}的设置。</small></label><label><input type="radio" name="parity-apply-scope" value="unmodified" ${editor.scope === 'unmodified' ? 'checked' : ''}>保留${duration ? '班主任' : '老师'}的设置，修改其他学生<small>${duration ? '班主任已设置的星期保持不变。' : '老师已设置的学生保持不变。'}</small></label></fieldset>` : '';
  }
  function daysFields(value) { return `<div class="control-weekdays" id="parity-days">${['一', '二', '三', '四', '五', '六', '日'].map((label, day) => `<button type="button" data-day="${day}" aria-pressed="${value.includes(day)}" onclick="this.setAttribute('aria-pressed',this.getAttribute('aria-pressed')!=='true')">${label}</button>`).join('')}</div>`; }
  function periodFields(value) { return `<div id="parity-periods" class="control-period-list">${value.map((period, index) => periodRow(period, index)).join('')}</div><button class="control-add-period" onclick="parity.addPeriod()">＋ 添加时段</button>`; }
  function periodRow(period, index) { return `<div class="control-period-row" data-period-row><input type="time" aria-label="第${index + 1}个时段开始时间" value="${period.start}"><span>至</span><input type="time" aria-label="第${index + 1}个时段结束时间" value="${period.end}"><button type="button" class="control-period-remove" aria-label="删除第${index + 1}个时段" onclick="this.closest('[data-period-row]').remove()"><svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M9 6V4h6v2M5 6l1 14h12l1-14M10 10v6M14 10v6"/></svg></button></div>`; }
  function collectEditor() {
    const editor = ui.editor, form = document.getElementById('parity-rule-form');
    if (!editor || !form) return;
    const days = [...form.querySelectorAll('#parity-days [aria-pressed=true]')].map(node => Number(node.dataset.day));
    editor.scope = schoolDateRule(editor) ? 'all' : form.querySelector('[name=parity-apply-scope]:checked')?.value || null;
    const periodRows = [...form.querySelectorAll('#parity-periods [data-period-row]')].map(row => { const inputs = row.querySelectorAll('input'); return { start: inputs[0].value, end: inputs[1].value }; });
    if (controlModule === 'borrowing') {
      editor.rule.weekdays = days;
      editor.rule.startDate = form.querySelector('#parity-date-start')?.value || editor.rule.startDate;
      editor.rule.endDate = form.querySelector('#parity-date-end')?.value || editor.rule.endDate;
      editor.rule.deny = form.querySelector('[name=parity-borrow-way]:checked')?.value === 'deny';
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
  function renderEditor() {
    const editor = ui.editor;
    if (!editor) { controlView = 'module'; return renderControl(); }
    const rule = editor.rule;
    let form = `<p class="control-scope">${esc(editor.label)} · ${selectedStudentsLink(editor.refs)}</p><div id="parity-rule-form" class="borrow-editor-card">`;
    if (controlModule === 'borrowing') {
      if (!editor.editingId && !editor.schoolRule) form += `<div class="control-form-section"><b class="control-form-title">规则类型</b><div class="control-segment">${[['weekly', '每周固定'], ['dates', '指定日期']].map(([mode, label]) => `<button aria-pressed="${rule.mode === mode}" onclick="parity.editorMode('${mode}')">${label}</button>`).join('')}</div></div>`;
      form += `<p class="control-form-note">指定日期规则优先，到期或删除后恢复每周规则。</p>`;
      form += rule.mode === 'weekly' ? `<div class="control-form-section"><b class="control-form-title">适用星期</b>${daysFields(rule.weekdays)}</div>` : `<div class="control-form-section"><b class="control-form-title">适用日期（包含起止日期）</b><div class="control-date-row"><input id="parity-date-start" aria-label="开始日期" type="date" onchange="parity.borrowDateChanged()" min="${R.today()}" value="${rule.startDate}"><span>至</span><input id="parity-date-end" aria-label="结束日期" type="date" onchange="parity.borrowDateChanged()" min="${rule.startDate && rule.startDate > R.today() ? rule.startDate : R.today()}" value="${rule.endDate}"></div><fieldset class="parity-borrow-choice"><legend class="control-form-title">借用方式</legend>${[['periods', '按时段借用', '仅在下方设置的时段内可借用'], ['deny', '全天禁止借用', '所选日期全天不能借用平板']].map(([value, label, note]) => `<label class="parity-borrow-option"><input type="radio" name="parity-borrow-way" value="${value}" ${rule.deny === (value === 'deny') ? 'checked' : ''} onchange="parity.borrowWay()"><span class="parity-borrow-option-body"><span><b>${label}</b><small>${note}</small></span><i aria-hidden="true">✓</i></span></label>`).join('')}</fieldset></div>`;
      if (!(rule.mode === 'dates' && rule.deny)) form += `<div class="control-form-section"><b class="control-form-title">借用时段</b>${periodFields(rule.periods)}</div>`;
    } else if (controlModule === 'duration') {
      form += `<div class="control-form-section"><b class="control-form-title">适用星期</b>${daysFields(rule.weekdays)}</div>`;
      if (rule.useDefault) form += `<p class="parity-note">${R.durationText(R.defaultDuration)}</p>`;
      else form += `<div class="control-form-section">${[['continuousMinutes', '连续使用时长'], ['restMinutes', '休息时间'], ['dailyMinutes', '每日累计时长']].map(([key, label]) => `<div class="control-number-row"><label for="parity-${key}">${label}</label><span><input id="parity-${key}" type="number" min="1" step="1" value="${rule[key]}">分钟</span></div>`).join('')}</div><div class="control-form-section"><b class="control-form-title">每日可用时段</b>${periodFields(rule.periods)}<p class="control-form-note">不设时段，全天可用，仍受时长限制。</p></div>`;
    } else form += [['answer', '查看答案'], ['explanation', '查看详解']].map(([key, label]) => `<fieldset class="parity-permission"><legend>${label}</legend>${[['true', '允许'], ['false', '不允许']].map(([value, text]) => `<label><input type="radio" name="parity-${key}" value="${value}" ${String(editor.value[key]) === value ? 'checked' : ''}>${text}</label>`).join('')}</fieldset>`).join('');
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
  function openEditor(refs, label, ruleId, schoolRule = false) {
    if (!refs.length) return;
    try { assertPermission(refs, controlModule); } catch (error) { return controlToast(error.message); }
    controlData = loadLatest();
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
    const permissionValue = () => 'false';
    ui.editor = { schoolRule, refs: R.copy(refs), label, base: baseFor(refs), scope: controlDemoRole === 'admin' && controlModule === 'borrowing' && rule.mode === 'dates' ? 'all' : needScope(refs) ? null : 'all', editingId: existing?.id, returnView: controlView, rule, value: { answer: permissionValue('answer'), explanation: permissionValue('explanation') } };
    ui.editor.initial = JSON.stringify([ui.editor.rule, ui.editor.value, ui.editor.scope]);
    controlView = 'ruleEditor'; renderControl();
  }
  function operationChange(operation) {
    return student => {
      if (operation.kind === 'save') {
        if (operation.module === 'borrowing') student.schedules = R.mergeBorrow(student.schedules, operation.value, operation.editingId);
        else if (operation.module === 'duration') {
          const days = R.durationDays(student, operation.value.weekdays, operation.scope);
          if (!days.length) return false;
          student.durationRules = R.mergeDuration(student.durationRules, { ...operation.value, weekdays: days, source: controlDemoRole === 'admin' ? 'school' : 'homeroom' }, operation.editingId);
          const marks = student.durationTeacherWeekdays || R.durationDays(student, [0,1,2,3,4,5,6], 'all').filter(day => !R.durationDays(student, [day], 'unmodified').length);
          student.durationTeacherWeekdays = controlDemoRole === 'admin' ? marks.filter(day => !days.includes(day)) : [...new Set([...marks, ...days])];
        }
        else Object.assign(student, operation.value);
      } else if (operation.kind === 'delete') {
        const key = operation.module === 'borrowing' ? 'schedules' : 'durationRules';
        student[key] = student[key].filter(rule => operation.ruleId ? rule.id !== operation.ruleId : operation.mode ? rule.mode !== operation.mode : false);
      } else if (operation.kind === 'reset') {
        if (operation.module === 'duration') student.durationRules = [];
        else if (operation.module === 'homework') { student.answer = false; student.explanation = false; }
      } else student[operation.module === 'lock' ? 'locked' : 'world'] = operation.value;
    };
  }
  function request(operation) {
    try {
      if (schoolDateRule(operation)) operation.scope = 'all';
      assertPermission(operation.refs, operation.module);
      if (operation.kind === 'save' && operation.module === 'borrowing') {
        const error = R.validateBorrow(operation.value);
        if (error) throw Error(error);
      }
      if (!operation.refs.length) return controlToast('请先选择操作对象');
      if (operation.kind !== 'delete' && needScope(operation.refs, operation.module) && !operation.scope) {
        ui.pending = operation;
        controlOverlay('选择修改范围', `<p class="control-scope">${esc(operation.label)} · 已选 ${operation.refs.length} 名学生</p>${scopeFields(operation)}<p id="parity-error" class="control-error" role="alert"></p>`, button('取消', 'closeControlOverlay()', true) + button('继续', 'parity.confirmScope()'));
        return;
      }
      const latest = loadLatest(), rows = operationRows(latest, operation);
      if (!rows.length) { renderControl(); return controlToast('没有符合修改范围的学生，已有单独设置均已保留'); }
      if (operation.kind === 'delete') {
        const preview = R.deletionPreview(rows, operation.module, operation);
        if (!preview.refs.length) return controlToast('所选范围内没有这条规则，无需删除');
        const borrowing = operation.module === 'borrowing';
        const modes = new Set(preview.rules.map(rule => rule.mode));
        const outcome = !borrowing ? '删除后，对应星期恢复默认使用时长规则。' : modes.size === 1 && modes.has('dates') ? '删除后，对应日期恢复每周固定借用规则；没有每周固定规则时不能借用。' : '删除后，对应日期没有其他有效借用规则时不能借用。';
        const title = operation.schoolRule ? '确认删除全校借用规则？' : borrowing ? '确认删除借用规则？' : '确认删除使用时长规则？';
        const rules = [...new Set(preview.rules.map(rule => borrowing ? (rule.mode === 'dates' ? '指定日期：' : '每周固定：') + R.borrowText(rule) : R.dayText(rule.weekdays) + ' · ' + R.durationText(rule.useDefault ? R.defaultDuration : rule)))];
        ui.pending = operation;
        controlOverlay(title, `<p class="control-scope">${esc(operation.label)} · 所选 ${operation.refs.length} 名学生</p><p class="control-confirm-copy">将删除以下${rules.length === 1 ? '' : rules.length + '条'}规则：</p><div class="parity-rule">${rules.map(text => `<p>${esc(text)}</p>`).join('')}</div><p class="control-confirm-copy">${outcome}其他规则不受影响。</p><p class="parity-note">实际影响 ${preview.refs.length} 名学生；${operation.refs.length - preview.refs.length} 名学生未匹配该规则或保留单独设置，不作修改。</p>`, button('取消', 'closeControlOverlay()', true) + `<button type="button" class="control-primary parity-delete-confirm" onclick="parity.apply()">确认删除</button>`);
        return;
      }
      // 确认内容只取本次操作，学校管理员与班主任共用，不汇总学生原有规则。
      let texts;
      if (operation.kind === 'reset') texts = operation.module === 'duration' ? [R.durationText(R.defaultDuration)] : ['答案不允许 · 详解不允许'];
      else if (operation.module === 'borrowing') texts = [R.borrowText(operation.value)];
      else if (operation.module === 'duration') texts = [R.dayText(operation.value.weekdays) + ' · ' + R.durationText(operation.value.useDefault ? R.defaultDuration : operation.value)];
      else if (operation.module === 'homework') texts = [`答案${operation.value.answer ? '允许' : '不允许'} · 详解${operation.value.explanation ? '允许' : '不允许'}`];
      else texts = [operation.module === 'lock' ? operation.value ? '平板已锁屏' : '平板未锁屏' : operation.value ? '万象视界允许使用' : '万象视界禁止使用'];
      const label = operation.kind === 'delete' ? '删除规则' : operation.kind === 'reset' ? '恢复默认规则' : operation.module === 'lock' ? operation.value ? '锁屏' : '解除锁屏' : operation.module === 'world' ? operation.value ? '开放万象视界' : '关闭万象视界' : '保存' + controlLabels[operation.module];
      ui.pending = operation;
      controlOverlay(`确认${label}？`, `<p class="control-scope">${esc(operation.label)} · 实际影响 ${rows.length} 名学生</p><div class="parity-preview">${texts.map(text => `<p>${esc(text)}</p>`).join('')}</div>`, button('取消', 'closeControlOverlay()', true) + button(operation.kind === 'save' && operation.module === 'borrowing' && operation.value.mode === 'dates' ? '保存' : '确认生效', 'parity.apply()'));
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
      assertPermission(operation.refs, operation.module);
      if (operation.kind === 'save' && operation.module === 'borrowing') {
        const error = R.validateBorrow(operation.value);
        if (error) throw Error(error);
      }
      const latest = loadLatest();
      // 完整范围先做版本校验；删除只写入确实包含目标规则的学生。
      const rows = operationRows(latest, operation);
      const refs = operation.kind === 'delete' ? R.deletionPreview(rows, operation.module, operation).refs : rows.map(row => row.ref);
      const result = R.transaction(latest, refs, operation.module, null, 'all', operationChange(operation), actor());
      if (result.count) {
        if (operation.schoolRule) {
          const rules = result.data.schoolSettings?.borrowingRules || [];
          result.data.schoolSettings = { ...result.data.schoolSettings, borrowingRules: operation.kind === 'save' ? R.mergeBorrow(rules, operation.value, operation.editingId) : rules.filter(rule => rule.id !== operation.ruleId) };
        }
        persist(result.data);
      }
      const returnView = ui.editor?.returnView;
      ui.pending = null; ui.editor = null; ui.boolean = null;
      if (controlView === 'ruleEditor') controlView = returnView === 'studentDetail' ? 'studentDetail' : 'module';
      adminBatchMode = false; controlSelected.clear(); adminSelectedScopes.clear();
      renderControl(); controlToast(result.count ? operation.kind === 'save' && operation.module === 'borrowing' && operation.value.mode === 'dates' ? '已保存' : `${operation.kind === 'delete' ? '删除成功' : '已生效'} · ${result.count}名学生` : '没有符合修改范围的学生，原规则保留');
    } catch (error) { conflict(error); }
  }
  function makeOperation(refs, label, kind, value, extra = {}) { return { refs, label, kind, value, module: controlModule, base: baseFor(refs), ...extra }; }
  function operationRows(data, operation) {
    if (operation.module === 'duration' && operation.kind === 'save') return R.prepare(data, operation.refs, operation.module, operation.base, 'all').filter(({student}) => R.durationDays(student, operation.value.weekdays, operation.scope).length);
    return R.prepare(data, operation.refs, operation.module, operation.base, operation.scope || 'all');
  }
  function currentSelectedRefs() { return controlDemoRole === 'admin' ? adminSelectionRefs() : targetRefs('selected'); }
  function visibleScopeKeys() {
    const container = document.getElementById('parity-scope-rows');
    const keys = adminLevel === 'class' ? [selectedTeacherClass] : adminVisibleScopeKeys();
    if (!container) return keys;
    return keys.filter(key => [...container.querySelectorAll('.admin-level-copy b')].some(node => node.textContent === key));
  }
  window.parity = {
    showSelectedStudents(encoded) {
      const refs = JSON.parse(decodeURIComponent(encoded));
      const students = R.resolve(controlData, refs).map(row => row.student);
      const host = document.getElementById('control-overlay');
      ui.roster = { nodes: [...host.childNodes], trigger: document.activeElement };
      controlOverlay('所选学生（' + students.length + '名）', `<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px 10px;max-height:50vh;overflow-y:auto;padding:12px 0" role="list">${students.map(student => `<span role="listitem" style="overflow-wrap:anywhere">${esc(student.name)}</span>`).join('') || '<p>暂无所选学生</p>'}</div>`, button('关闭', 'closeControlOverlay()', true));
    },
    showBorrowTimes() {
      controlOverlay('学校借用时间', teacherBorrowSummary(), button('关闭', 'closeControlOverlay()', true));
    },
    cancelBoolean() { closeControlOverlay(true); },
    selectedRefs: currentSelectedRefs,
    schoolWorld() { this.booleanEditor(allRefs(), '全校'); },
    fillDefault() {
      collectEditor();
      if (controlModule === 'duration' && durationIsDefault(ui.editor.rule)) return;
      if (controlModule === 'duration') Object.assign(ui.editor.rule, R.copy(R.defaultDuration), { id: ui.editor.rule.id, useDefault: false, fixed: false });
      else ui.editor.value = { answer: 'false', explanation: 'false' };
      renderEditor(); controlToast(controlModule === 'duration' ? '已填入默认设置，保存后生效' : '已恢复默认规则');
    },
    durationPermission(value) {
      if (controlDemoRole !== 'admin') return;
      if (typeof value !== 'boolean') return controlOverlay('调整班主任权限？', '<p>关闭后不能继续修改，已有设置继续生效。</p>', button('取消', 'closeControlOverlay()', true) + button('确认', `parity.durationPermission(${!durationAllowed()})`));
      const next = R.copy(loadLatest()); next.schoolSettings ||= {}; next.schoolSettings.homeroomDurationEnabled = value;
      persist(next); closeControlOverlay(); renderControl(); controlToast(value ? '已开放班主任调整权限' : '已关闭班主任调整权限');
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
        return controlOverlay('确认' + text + '？', `<p class="control-scope">${esc(label)} · 共${refs.length}名学生</p><p>${school && !value ? '结束全校临时管控，恢复日常锁屏和老师操作权限。' : '解除后恢复日常锁屏状态。'}${!school && temporaryLockActive() && !value ? '全校管控尚未结束，老师仍不可修改锁屏。' : ''}</p><p>${changed}名学生将${text}。</p>`, button('取消', 'closeControlOverlay()', true) + button('确认', school ? `parity.toggleTemporaryLock(${value},true)` : `parity.commitScopedLock(${value})`));
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
        return `<label class="parity-borrow-option"><input type="radio" name="parity-boolean" ${b.value === value ? 'checked' : ''} onchange="parity.chooseBoolean(${value})"><span class="parity-borrow-option-body"><span><b>${b.lock ? value ? '开启临时锁屏' : '解除临时锁屏' : value ? '允许使用万象视界' : '禁止使用万象视界'}</b>${b.lock ? `<small>${count}个班${value ? '未开启' : '已开启'}</small>` : ''}</span><i>✓</i></span></label>`;
      }).join('');
      controlOverlay(b.lock ? '设置临时锁屏' : '设置万象视界', `<p class="control-scope">${esc(b.label)} · ${selectedStudentsLink(b.refs)}</p><fieldset class="parity-borrow-choice">${options}</fieldset>${b.lock ? '' : scopeFields(b)}${b.value !== null && b.scope ? `<p>${changed ? changed + '名学生将修改，' + (rows.length - changed) + '名学生保持不变。' : '当前选择无需修改。'}</p>` : ''}${b.lock && temporaryLockActive() && !b.school ? '<p>全校管控未结束，老师仍不可修改锁屏。</p>' : ''}<p id="parity-error" class="control-error"></p>`, button('取消', 'parity.cancelBoolean()', true) + button('保存', 'parity.saveBoolean()', false, b.value !== null && b.scope && !changed && !b.school));
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
        if (entries.some(entry => entry.key.startsWith('student:'))) throw Error('学校管理员仅支持全校、年级或班级操作');
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
    back() { if (controlView === 'students') { controlView = 'module'; controlSelected.clear(); return renderControl(); } if (controlDemoRole === 'admin') return adminBack(); leaveControlCenter(); },
    startSelection() { adminBatchMode = true; adminSelectedScopes.clear(); renderControl(); },
    cancelSelection() { adminBatchMode = false; controlSelected.clear(); adminSelectedScopes.clear(); controlView = 'module'; renderControl(); },
    selectScope(key, value) { value ? adminSelectedScopes.add(key) : adminSelectedScopes.delete(key); renderControl(); },
    selectStudent(id) { controlSelected.has(id) ? controlSelected.delete(id) : controlSelected.add(id); renderControl(); },
    selectAll(value) { const admin = controlDemoRole === 'admin', set = admin ? adminSelectedScopes : controlSelected; (admin ? visibleScopeKeys() : filteredControlStudents().map(s => s.id)).forEach(key => value ? set.add(key) : set.delete(key)); renderControl(); },
    studentFilter(query, filter) { if (query !== null) controlQuery = query; if (filter !== null) controlFilter = filter; controlSelected.clear(); this.renderRows(); },
    renderRows() { const rows = document.getElementById('parity-student-rows'); if (rows) rows.innerHTML = studentRows(); const footer = document.querySelector('.parity-batchbar'); if (footer) footer.outerHTML = selectionFooter(); },
    editScope(key) { openEditor(scopeRefs(key), key); },
    selectedEdit() { const refs = currentSelectedRefs(); const names = controlDemoRole === 'admin' ? [...adminSelectedScopes] : [selectedTeacherClass]; openEditor(refs, names.join('、')); },
    scopeBoolean(key, value) { const refs = scopeRefs(key); const states = refs.map(ref => Boolean(refLocked(ref))); return this.booleanEditor(refs, key, controlModule === 'world' || states.some(Boolean) && states.some(v => !v) ? null : !states.every(Boolean)); },
    selectedBoolean(value) { if (controlModule === 'lock' && controlDemoRole === 'admin') return this.setTemporaryLocks(selectionLockEntries(), value); request(makeOperation(currentSelectedRefs(), '所选对象', 'boolean', value)); },
    selectedReset() {
      const refs = currentSelectedRefs(); if (!refs.length) return;
      if (controlModule === 'borrowing') { this.borrowDeleteChoice(refs, '所选对象'); return; }
      request(makeOperation(refs, '所选对象', 'reset', null));
    },
    resetCurrent() { request(makeOperation(activeRefs(), scopeLabel(), 'reset', null)); },
    resetStudent(id) { request(makeOperation(targetRefs(id), selectedTeacherClass, 'reset', null)); },
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
    deleteStudentRule(id, ruleId) { request(makeOperation(targetRefs(id), selectedTeacherClass + ' · ' + controlStudents().find(s => s.id === id).name, 'delete', null, { ruleId })); },
    cancelEditor(force = false) {
      collectEditor();
      if (!force && ui.editor && ui.editor.initial !== JSON.stringify([ui.editor.rule, ui.editor.value, ui.editor.scope])) return controlOverlay('放弃未保存的修改？', '<p>放弃后，本次修改不会保存。</p>', button('继续编辑', 'closeControlOverlay()', true) + button('放弃修改', 'parity.cancelEditor(true)'));
      const view = ui.editor?.returnView; ui.editor = null; ui.pending = null; controlView = view || 'module'; renderControl();
    },
    editorMode(mode) { if (!ui.editor || ui.editor.editingId || ui.editor.schoolRule) return; collectEditor(); ui.editor.rule.mode = mode; ui.editor.rule.deny = false; renderEditor(); },
    borrowWay() { collectEditor(); renderEditor(); },
    borrowDateChanged() {
      const start = document.getElementById('parity-date-start'), end = document.getElementById('parity-date-end'), error = document.getElementById('parity-error');
      start.min = R.today();
      if (start.value && start.value < start.min) { start.value = ''; error.textContent = '生效日期只能选择今天及以后'; }
      end.min = start.value && start.value > R.today() ? start.value : R.today();
      if (end.value && end.value < end.min) { end.value = ''; error.textContent = '结束日期不能早于今天或开始日期'; }
    },
    durationType(value) { collectEditor(); ui.editor.rule.useDefault = value; renderEditor(); },
    addPeriod() { const host = document.getElementById('parity-periods'); host.insertAdjacentHTML('beforeend', periodRow({ start: '', end: '' }, host.children.length)); },
    saveEditor() {
      collectEditor(); const editor = ui.editor, rule = editor.rule, error = document.getElementById('parity-error');
      if (needScope(editor.refs) && !editor.scope) { error.textContent = '请选择本次修改范围'; return; }
      if (controlModule === 'borrowing') {
        const problem = R.validateBorrow(rule); if (problem) { error.textContent = problem; return; }
      } else if (controlModule === 'duration') {
        if (!rule.weekdays.length) { error.textContent = '请至少选择一个星期'; return; }
        if (!rule.useDefault && (![rule.continuousMinutes, rule.restMinutes, rule.dailyMinutes].every(value => Number.isInteger(value) && value > 0) || rule.dailyMinutes < rule.continuousMinutes)) { error.textContent = '时长须为正整数，每日累计不能短于连续使用时长'; return; }
        const problem = R.validatePeriods(rule.periods, true); if (problem && !rule.useDefault) { error.textContent = problem; return; }
      } else if (!['true', 'false'].includes(String(editor.value.answer)) || !['true', 'false'].includes(String(editor.value.explanation))) { error.textContent = '请选择答案和详解权限'; return; }
      const value = controlModule === 'homework' ? { answer: String(editor.value.answer) === 'true', explanation: String(editor.value.explanation) === 'true' } : R.copy(rule);
      request(makeOperation(editor.refs, editor.label, 'save', value, { base: editor.base, scope: editor.scope, editingId: editor.editingId, schoolRule: editor.schoolRule }));
    },
    confirmScope() { const scope = document.querySelector('[name=parity-apply-scope]:checked')?.value; if (!scope) { document.getElementById('parity-error').textContent = '请选择本次修改范围'; return; } request({ ...ui.pending, scope }); },
    apply,
  };
  window.renderControl = renderControl;
  window.filteredControlStudents = filteredControlStudents;
  window.openControlEditor = target => {
    if (controlDemoRole === 'admin' && typeof target === 'number') return controlToast('学校管理员仅支持全校、年级或班级操作');
    openEditor(targetRefs(target), target === 'adminSelected' ? '所选对象' : selectedTeacherClass + (typeof target === 'number' ? ' · ' + (controlStudents().find(s => s.id === target)?.name || '') : ''));
  };
  window.confirmControl = (target, value) => {
    if (controlDemoRole === 'admin' && typeof target === 'number') return controlToast('学校管理员仅支持全校、年级或班级操作');
    if (controlModule === 'world' && controlDemoRole !== 'admin' && typeof target === 'number') {
      const refs = targetRefs(target);
      try {
        assertPermission(refs, 'world');
        const result = R.transaction(loadLatest(), refs, 'world', null, 'all', student => student.world = Boolean(value), actor());
        persist(result.data); renderControl(); controlToast(value ? '已允许使用万象视界' : '已禁止使用万象视界');
      } catch (error) { conflict(error); }
      return;
    }
    if (controlModule === 'lock' && controlDemoRole === 'admin') return parity.setTemporaryLocks([{ key: scopeLockKey(selectedTeacherClass), refs: classRefs() }], value);
    if (controlModule === 'world') return parity.booleanEditor(targetRefs(target), selectedTeacherClass + (typeof target === 'number' ? ' · ' + (controlStudents().find(s => s.id === target)?.name || '') : ''), null);
    request(makeOperation(targetRefs(target), selectedTeacherClass, 'boolean', value));
  };
  window.adminBatchAction = (module, value) => { controlModule = module; if (module === 'lock') return parity.toggleTemporaryLock(value); request(makeOperation(allRefs(), '全校', 'boolean', value)); };
  window.toggleHomeworkPermission = (id, key, value) => {
    const refs = targetRefs(id);
    try {
      assertPermission(refs, 'homework');
      const result = R.transaction(loadLatest(), refs, 'homework', null, 'all', student => student[key] = value, actor());
      persist(result.data); renderControl(); controlToast('权限已' + (value ? '开启' : '关闭'));
    } catch (error) { conflict(error); }
  };
  window.toggleSchoolBorrowing = () => controlOverlay(`确认${schoolBorrowingEnabled ? '关闭' : '开启'}全校借用管控？`, `<p class="control-confirm-copy">${schoolBorrowingEnabled ? '关闭后，所有学生均不能从柜机借用平板，已有规则保留。' : '开启后，仅允许在有效规则允许的时段借用，没有有效规则时不能借用。'}</p>`, button('取消', 'closeControlOverlay()', true) + button('确认生效', `applySchoolBorrowing(${!schoolBorrowingEnabled})`));
  let displayedBorrowStates = '';
  const overlayOpen = () => typeof document !== 'undefined' && Boolean(document.querySelector?.('#control-overlay .control-shade'));
  const refreshExpiredRules = () => {
    try {
      const latest = loadLatest();
      const states = JSON.stringify([...schoolControlClasses.flatMap(className => latest[className].flatMap(student => student.schedules)), ...(latest.schoolSettings?.borrowingRules || [])].filter(rule => rule.mode === 'dates').map(rule => [rule.id, R.borrowStatus(rule)]));
      if (states !== displayedBorrowStates && !ui.editor && !ui.pending && !ui.boolean && !overlayOpen()) { displayedBorrowStates = states; controlData = latest; renderControl(); }
    } catch { /* 不在后台覆盖失败数据；用户再次保存时会得到错误提示。 */ }
  };
  window.addEventListener('focus', refreshExpiredRules);
  setInterval(refreshExpiredRules, 1000);
  window.addEventListener('storage', event => {
    if (event.key === storageKey) { try { controlData = loadLatest(); } catch { return; } }
    if (event.key === 'school-borrowing-enabled') schoolBorrowingEnabled = true;
    if ((event.key === storageKey || event.key === 'school-borrowing-enabled') && !ui.editor && !ui.pending && !ui.boolean && !overlayOpen()) renderControl();
  });
  if (stage === 'teacherDesk' && teacherTab === 'control') renderControl();
})();
