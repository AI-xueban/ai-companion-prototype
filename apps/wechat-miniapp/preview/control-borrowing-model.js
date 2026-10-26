/* CTL-001: class schedules, school temporary restrictions and student bans are independent. */
(function (root) {
  const R = typeof module !== 'undefined' && module.exports ? require('./control-rules.js') : root.controlRules;
  const initial = () => ({ revision: 0, classRules: {}, schoolTemporaryActive: false, temporaryClasses: {}, studentBans: {} });
  const denied = (state, name) => state.temporaryClasses[name] ?? state.schoolTemporaryActive;
  const signature = rule => JSON.stringify({ mode: rule.mode, days: rule.mode === 'weekly' ? [...rule.weekdays].sort() : [rule.startDate, rule.endDate], deny: Boolean(rule.deny), periods: rule.deny ? [] : R.periods(rule).map(p => p.start + '-' + p.end).sort() });
  function groups(state, names, mode) {
    const result = new Map();
    names.forEach(name => (state.classRules[name] || []).filter(r => r.mode === mode).forEach(rule => {
      const key = signature(rule);
      if (!result.has(key)) result.set(key, { rule, names: [], ids: {} });
      result.get(key).names.push(name); result.get(key).ids[name] = rule.id;
    }));
    return [...result.values()];
  }
  function summary(state, names, mode) {
    const rows = names.map(name => (state.classRules[name] || []).filter(r => r.mode === mode));
    const configured = rows.filter(r => r.length);
    if (!configured.length) return { rules: [], note: '未设置规则' };
    if (configured.length !== rows.length) return { rules: [], note: '部分班级未设置规则' };
    const key = rules => JSON.stringify(rules.map(signature).sort());
    return rows.every(rules => key(rules) === key(rows[0])) ? { rules: rows[0], note: '' } : { rules: [], note: '各班规则不同' };
  }
  function change(state, operation) {
    const next = R.copy(state);
    if (operation.type === 'temporary') {
      if (operation.school) { next.schoolTemporaryActive = operation.value; next.temporaryClasses = {}; }
      else operation.names.forEach(name => { next.temporaryClasses[name] = operation.value; });
    } else if (operation.type === 'student') {
      operation.ids.forEach(id => { next.studentBans[id] = operation.value; });
    } else operation.names.forEach(name => {
      const rules = next.classRules[name] || [];
      next.classRules[name] = operation.type === 'delete' ? rules.filter(r => r.id !== operation.editingIds[name]) : R.mergeBorrow(rules, operation.rule, operation.editingIds?.[name]);
    });
    next.revision++;
    return next;
  }
  const targets = (data, names) => JSON.stringify([...names].sort().map(name => [name, (data[name] || []).map(s => String(s.id)).sort()]));
  function commit(state, operation, data, role, associatedClasses) {
    if (operation.names.some(name => !Array.isArray(data[name])) || !operation.names.length || !operation.names.some(name => data[name]?.length)) throw Error('所选范围没有学生，请重新选择');
    if (state.revision !== operation.revision) throw Error('借用设置已被其他人修改，请重新设置');
    if (targets(data, operation.names) !== operation.targets) throw Error('所选班级或学生有变化，请重新选择');
    if (operation.type === 'student') {
      if (role !== 'homeroom' || operation.names.some(name => !associatedClasses.includes(name))) throw Error('当前没有这个班级的管理权限');
      if (operation.names.some(name => denied(state, name))) throw Error('学校正在临时禁止借用，暂时无法修改');
      const ids = new Set(operation.names.flatMap(name => data[name].map(s => String(s.id))));
      if (!operation.ids.length || operation.ids.some(id => !ids.has(String(id)))) throw Error('所选学生有变化，请重新选择');
    } else if (role !== 'school') throw Error('只有学校管理员可以修改借用时间和临时禁借');
    if (operation.type === 'save') { const error = R.validateBorrow(operation.rule); if (error) throw Error(error); }
    return change(state, operation);
  }
  function result(state, name, id, now = new Date()) {
    if (denied(state, name)) return '学校临时禁止借用';
    if (state.studentBans[id]) return '班主任已禁止借用';
    const date = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Shanghai' }).format(now);
    const time = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Shanghai', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(now);
    const rule = R.effectiveBorrow({ schedules: state.classRules[name] || [] }, date);
    return rule.deny ? '当前禁止借用' : !rule.periods.length || rule.periods.some(p => p.start <= time && time < p.end) ? '当前可借用' : '当前不在借用时段';
  }
  const api = { initial, denied, signature, groups, summary, change, targets, commit, result };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.borrowingModel = api;
})(typeof window !== 'undefined' ? window : globalThis);
