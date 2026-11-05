/* CTL-001: class schedules, school temporary restrictions and class bans are independent. */
(function (root) {
  const R = typeof module !== 'undefined' && module.exports ? require('./control-rules.js') : root.controlRules;
  const initial = () => ({ revision: 0, classRules: {}, schoolTemporaryActive: false, temporaryClasses: {}, classBans: {} });
  const denied = (state, name) => state.temporaryClasses[name] ?? state.schoolTemporaryActive;
  const signature = rule => JSON.stringify({ mode: rule.mode, days: rule.mode === 'weekly' ? [...rule.weekdays].sort() : [rule.startDate, rule.endDate], deny: Boolean(rule.deny), periods: rule.deny ? [] : rule.mode === 'weekly' ? Object.fromEntries(rule.weekdays.map(day => [day, R.borrowDayPeriods(rule, day).map(p => p.start + '-' + p.end)])) : R.periods(rule).map(p => p.start + '-' + p.end).sort() });
  function groups(state, names, mode) {
    const result = new Map();
    names.forEach(name => (state.classRules[name] || []).filter(r => r.mode === mode).forEach(rule => {
      const key = (name.match(/^[一二三四五六七八九]+年级/)?.[0] || name) + ':' + signature(rule);
      if (!result.has(key)) result.set(key, { rule, names: [], ids: {} });
      result.get(key).names.push(name); result.get(key).ids[name] = rule.id;
    }));
    return [...result.values()];
  }
  function summary(state, names, mode, now = new Date()) {
    // Expired date rules remain manageable, but do not affect the current card comparison.
    const rows = names.map(name => (state.classRules[name] || []).filter(r => r.mode === mode && (mode !== 'dates' || R.borrowStatus(r, now) !== '已失效')));
    const configured = rows.filter(r => r.length);
    if (!configured.length) return { rules: [], note: '未设置规则' };
    if (configured.length !== rows.length) return { rules: [], note: '部分班级未设置规则' };
    const key = rules => JSON.stringify(rules.map(signature).sort());
    return rows.every(rules => key(rules) === key(rows[0])) ? { rules: rows[0], note: '' } : { rules: [], note: '各班规则不同' };
  }
  function preview(state, names, now = new Date()) {
    const weekly = summary(state, names, 'weekly', now), dates = summary(state, names, 'dates', now);
    const priority = { '生效中':0, '待生效':1, '已失效':2 };
    const upcoming = dates.rules.filter(rule => R.borrowStatus(rule, now) !== '已失效').sort((a,b) => priority[R.borrowStatus(a,now)] - priority[R.borrowStatus(b,now)] || a.startDate.localeCompare(b.startDate));
    const anyDate = names.some(name => (state.classRules[name] || []).some(rule => rule.mode === 'dates' && R.borrowStatus(rule,now) !== '已失效'));
    const dateDiffers = dates.note && dates.note !== '未设置规则' && anyDate;
    const active = upcoming.filter(rule => R.borrowStatus(rule, now) === '生效中');
    let rules;
    if (!weekly.rules.length) rules = upcoming.slice(0, 2);
    else if (active.length) rules = [active[0], weekly.rules[0]];
    else if (weekly.rules.length > 1) rules = weekly.rules.slice(0, 2);
    else rules = [...weekly.rules, ...upcoming.slice(0, 1)];
    const notes = [];
    if (weekly.note && weekly.note !== '未设置规则') notes.push('每周规则：' + weekly.note);
    if (dateDiffers) notes.push('指定日期规则：' + dates.note);
    if (!rules.length && !notes.length) {
      const expiredOnly = names.some(name => (state.classRules[name] || []).some(rule => rule.mode === 'dates' && R.borrowStatus(rule, now) === '已失效'));
      notes.push(expiredOnly ? '当前无生效规则' : '未设置借用规则');
    }
    const hiddenWeekly = weekly.rules.filter(rule => !rules.includes(rule));
    return { rules, notes, more: weekly.rules.length + upcoming.length - rules.length, moreMode: hiddenWeekly.length ? 'weekly' : 'dates' };
  }
  function change(state, operation) {
    const next = R.copy(state);
    if (operation.type === 'temporary') {
      if (operation.school) { next.schoolTemporaryActive = operation.value; next.temporaryClasses = {}; }
      else operation.names.forEach(name => { next.temporaryClasses[name] = operation.value; });
    } else if (operation.type === 'class') {
      next.classBans ||= {};
      operation.names.forEach(name => { next.classBans[name] = operation.value; });
    } else if (operation.type === 'save' || operation.type === 'delete') operation.names.forEach(name => {
      const rules = next.classRules[name] || [];
      next.classRules[name] = operation.type === 'delete' ? rules.filter(r => r.id !== operation.editingIds[name]) : operation.rule.mode === 'weekly' ? [...rules.filter(r => r.mode !== 'weekly'), R.copy(operation.rule)] : [...rules.filter(r => r.id !== operation.editingIds?.[name]), R.copy(operation.rule)];
    });
    else throw Error('不支持的借用操作');
    next.revision++;
    return next;
  }
  const targets = (data, names) => JSON.stringify([...names].sort().map(name => [name, (data[name] || []).map(s => String(s.id)).sort()]));
  const gradeOf = name => name.match(/^[一二三四五六七八九]+年级/)?.[0] || name;
  function commit(state, operation, data, role, associatedClasses) {
    if (!operation.names.length || operation.names.some(name => !Array.isArray(data[name]) || !data[name].length)) throw Error('所选范围包含没有学生的班级，请重新选择');
    if (state.revision !== operation.revision) throw Error('借用设置已被其他人修改，请重新设置');
    if (targets(data, operation.names) !== operation.targets) throw Error('所选班级或学生有变化，请重新选择');
    if (operation.type === 'class') {
      if (role !== 'homeroom' || operation.names.length !== 1 || operation.names.some(name => !associatedClasses.includes(name))) throw Error('当前没有这个班级的管理权限');
      if (operation.names.some(name => denied(state, name))) throw Error('学校正在临时禁止借用，暂时无法修改');
    } else if (!['save','delete','temporary'].includes(operation.type) || role !== 'school') throw Error('只有学校管理员可以修改借用时间和临时禁借');
    if (role === 'school' && !operation.school && ['save', 'temporary'].includes(operation.type)) {
      const grades = [...new Set(operation.names.map(gradeOf))];
      if (grades.length !== 1) throw Error('请选择一个年级');
      const eligible = Object.keys(data).filter(name => gradeOf(name) === grades[0] && Array.isArray(data[name]) && data[name].length);
      if (eligible.some(name => !operation.names.includes(name)) || operation.names.some(name => !eligible.includes(name))) throw Error('学校管理员只能按年级设置');
    }
    if (operation.type === 'save') {
      for (const name of operation.names) {
        const original = (state.classRules[name] || []).find(rule => rule.id === operation.editingIds?.[name]);
        const error = R.validateBorrow(operation.rule, new Date(), original);
        if (error) throw Error(error);
        const others = (state.classRules[name] || []).filter(rule => rule.id !== operation.editingIds?.[name]);
        if (operation.rule.mode === 'weekly' && others.some(rule => rule.mode === 'weekly')) throw Error('该年级已有每周规则，请编辑现有规则');
        if (operation.rule.mode === 'dates' && others.some(rule => rule.mode === 'dates' && R.overlap(rule, operation.rule))) throw Error('所选日期已有规则，请重新选择');
      }
    }
    return change(state, operation);
  }
  function result(state, name, id, now = new Date()) {
    if (denied(state, name)) return '学校临时禁止借用';
    if (state.classBans?.[name]) return '班主任已禁止借用';
    const date = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Shanghai' }).format(now);
    const time = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Shanghai', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(now);
    const rule = R.effectiveBorrow({ schedules: state.classRules[name] || [] }, date);
    return rule.deny ? '当前禁止借用' : !rule.periods.length || rule.periods.some(p => p.start <= time && time < p.end) ? '当前可借用' : '当前不在借用时段';
  }
  const api = { initial, denied, signature, groups, summary, preview, change, targets, commit, result };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.borrowingModel = api;
})(typeof window !== 'undefined' ? window : globalThis);
