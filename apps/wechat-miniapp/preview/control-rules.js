/* 两端管控的规则语义；与页面渲染分离，便于接入同一服务端。 */
(function (root) {
  const copy = value => JSON.parse(JSON.stringify(value));
  const weekdays = [0, 1, 2, 3, 4, 5, 6];
  const defaultDuration = Object.freeze({ id: 'school-duration-default', weekdays, useDefault: true, continuousMinutes: 60, restMinutes: 15, dailyMinutes: 180, periods: [], fixed: true });
  const schoolDate = (date = new Date()) => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Shanghai' }).format(date);
  const today = () => schoolDate();
  const dateOffset = (value, amount) => {
    const date = new Date(value + 'T12:00:00');
    date.setDate(date.getDate() + amount);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };
  const periods = rule => Array.isArray(rule.periods) ? copy(rule.periods) : rule.start && rule.end ? [{ start: rule.start, end: rule.end }] : [];
  const normalize = (rule, id) => ({ ...copy(rule), id: rule.id || id, weekdays: [...(rule.weekdays || [])].sort(), periods: periods(rule) });
  const prune = (rules, date = today()) => rules.filter(rule => rule.mode !== 'dates' || !rule.endDate || rule.endDate >= date);
  const overlap = (a, b) => a.mode === b.mode && (a.mode === 'weekly' ? a.weekdays.some(day => b.weekdays.includes(day)) : a.startDate <= b.endDate && b.startDate <= a.endDate);
  function mergeBorrow(existing, next, editingId) {
    const retained = existing.filter(rule => rule.id !== editingId).flatMap(rule => {
      if (!overlap(rule, next)) return [copy(rule)];
      if (rule.mode === 'weekly') {
        const days = rule.weekdays.filter(day => !next.weekdays.includes(day));
        return days.length ? [{ ...copy(rule), weekdays: days }] : [];
      }
      const pieces = [];
      if (rule.startDate < next.startDate) pieces.push({ ...copy(rule), id: rule.id + '-before-' + next.id, endDate: dateOffset(next.startDate, -1) });
      if (rule.endDate > next.endDate) pieces.push({ ...copy(rule), id: rule.id + '-after-' + next.id, startDate: dateOffset(next.endDate, 1) });
      return pieces;
    });
    return [...retained, copy(next)];
  }
  function mergeDuration(existing, next, editingId) {
    return [...existing.map(rule => ({ ...copy(rule), id: rule.id === editingId ? rule.id + '-retained' : rule.id, weekdays: rule.weekdays.filter(day => !next.weekdays.includes(day)) })).filter(rule => rule.weekdays.length), copy(next)];
  }
  function effectiveBorrow(student, date, enabled = true) {
    // 旧版总开关不再参与规则执行。
    const day = (new Date(date + 'T12:00:00').getDay() + 6) % 7;
    const rules = prune(student.schedules || [], date);
    const matched = [...rules].reverse().find(rule => rule.mode === 'dates' && rule.startDate <= date && rule.endDate >= date)
      || [...rules].reverse().find(rule => rule.mode === 'weekly' && rule.weekdays.includes(day));
    return matched ? { ...copy(matched), periods: matched.deny ? [] : periods(matched) } : { deny: rules.some(rule => rule.mode === 'weekly'), periods: [], reason: rules.some(rule => rule.mode === 'weekly') ? '当前星期不在借用安排内' : '未设置借用时间，默认随时可借' };
  }
  function effectiveDuration(student, day) {
    const own = [...(student.durationRules || [])].reverse().find(rule => rule.weekdays.includes(day));
    const rule = !own || own.useDefault ? defaultDuration : own;
    return { ...copy(rule), unavailable: false, allDay: periods(rule).length === 0, source: own && !own.useDefault ? '单独规则' : '默认规则' };
  }
  const dayText = days => {
    const values = [...new Set(days)].sort(), names = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'], parts = [];
    for (let i = 0; i < values.length;) {
      let j = i;
      while (j + 1 < values.length && values[j + 1] === values[j] + 1) j++;
      if (j - i >= 2) parts.push(names[values[i]] + '至' + names[values[j]]);
      else for (let k = i; k <= j; k++) parts.push(names[values[k]]);
      i = j + 1;
    }
    return parts.join('、');
  };
  const periodText = rule => rule.deny ? '全天禁止借用' : periods(rule).length ? periods(rule).map(p => p.start + '–' + p.end).join('、') : '全天可用';
  const borrowText = rule => (rule.mode === 'dates' ? rule.startDate + ' 至 ' + rule.endDate : dayText(rule.weekdays)) + ' · ' + periodText(rule);
  const durationText = rule => `连续 ${rule.continuousMinutes} 分钟 · 休息 ${rule.restMinutes} 分钟 · 每日 ${rule.dailyMinutes} 分钟 · ${periodText(rule)}`;
  function durationGroups(student) {
    const groups = [];
    weekdays.forEach(day => {
      const rule = effectiveDuration(student, day), text = rule.source + ' · ' + durationText(rule);
      const group = groups.find(item => item.text === text);
      if (group) group.days.push(day); else groups.push({ text, days: [day] });
    });
    return groups.map(group => dayText(group.days) + '：' + group.text);
  }
  function validatePeriods(value, allowEmpty = false) {
    if (!value.length) return allowEmpty ? '' : '请至少添加一个借用时段';
    if (value.some(p => !p.start || !p.end || p.start >= p.end)) return '请填写完整且结束晚于开始的时段，暂不支持跨日';
    const sorted = [...value].sort((a, b) => a.start.localeCompare(b.start));
    return sorted.some((p, i) => i > 0 && p.start < sorted[i - 1].end) ? '时段之间不能重叠' : '';
  }
  function borrowStatus(rule, now = new Date()) {
    if (rule.mode !== 'dates') return '';
    const date = schoolDate(now);
    if (date < rule.startDate) return '待生效';
    if (date > rule.endDate) return '已失效';
    return '生效中';
  }
  function validateBorrow(rule, now = new Date(), original = null) {
    if (rule.mode === 'weekly' && !rule.weekdays.length) return '请至少选择一个星期';
    if (rule.mode === 'dates') {
      if (!rule.startDate || !rule.endDate || rule.startDate > rule.endDate) return '请选择正确的开始和结束日期';
      const currentDate = schoolDate(now);
      if (original && borrowStatus(original, now) === '生效中') {
        if (rule.startDate !== original.startDate || rule.deny !== original.deny || JSON.stringify(periods(rule)) !== JSON.stringify(periods(original))) return '生效中的规则只能修改结束日期';
        if (rule.endDate < currentDate) return '结束日期不能早于今天';
      } else if (rule.startDate < currentDate) return '生效日期只能选择今天及以后';
      if (rule.deny) return '';
    }
    const error = validatePeriods(rule.periods);
    if (error) return error;
    return '';
  }
  function homeworkValue(student, subject) {
    return student.homeworkSubjects?.[subject] || { answer: Boolean(student.answer), explanation: Boolean(student.explanation) };
  }
  function signature(student, module) {
    const subject = module.startsWith('homework:') ? module.slice('homework:'.length) : null;
    const homework = subject ? homeworkValue(student, subject) : null;
    const value = module === 'borrowing' ? student.schedules || [] : module === 'duration' ? student.durationRules || [] : module === 'homework' ? [student.answer, student.explanation] : subject ? [homework.answer, homework.explanation] : student[module === 'lock' ? 'locked' : 'world'];
    return JSON.stringify([value, student.updated?.[module]?.version ?? (subject ? student.updated?.homework?.version || 0 : 0), module === 'duration' ? student.durationTeacherWeekdays || [] : module === 'world' ? student.worldSource : null]);
  }
  const modified = (student, module) => module === 'world' && student.worldSource !== undefined ? student.worldSource === 'teacher' : Boolean(student.teacherModified?.[module] ?? (module.startsWith('homework:') ? student.teacherModified?.homework : false)) && (module === 'borrowing' ? prune(student.schedules || []).length > 0 : module === 'duration' ? (student.durationRules || []).length > 0 : true);
  function resolve(data, refs) {
    const seen = new Set();
    return refs.filter(ref => { const key = ref.className + ':' + ref.id; if (seen.has(key)) return false; seen.add(key); return true; }).map(ref => {
      const student = data[ref.className]?.find(row => row.id === ref.id);
      if (!student) throw Error('操作对象已发生变化，请刷新后重新操作');
      return { ref, student };
    });
  }
  function prepare(data, refs, module, base, scope = 'all') {
    const rows = resolve(data, refs);
    // 先校验完整原始范围，再计算未单独设置范围；任一冲突整批拒绝。
    if (base && rows.some(({ ref, student }) => base[ref.className + ':' + ref.id] !== signature(student, module))) throw Error('所选学生已被其他老师修改，请刷新后重新操作');
    return rows.filter(({ student }) => scope !== 'unmodified' || !modified(student, module));
  }
  function durationDays(student, days, scope) {
    const marked = [...new Set([...(student.durationTeacherWeekdays || []), ...(student.durationRules || []).filter(rule => rule.source === 'homeroom').flatMap(rule => rule.weekdays)])];
    return scope === 'unmodified' ? days.filter(day => !marked.includes(day)) : [...days];
  }
  function deletionPreview(rows, module, operation) {
    const key = module === 'borrowing' ? 'schedules' : 'durationRules';
    const matches = rule => operation.ruleId ? rule.id === operation.ruleId : operation.mode ? rule.mode === operation.mode : true;
    const affected = rows.filter(({ student }) => (student[key] || []).some(matches));
    const rules = [...new Map(affected.flatMap(({ student }) => student[key].filter(matches)).map(rule => [JSON.stringify(rule), copy(rule)])).values()];
    return { refs: affected.map(row => row.ref), rules, unchanged: rows.length - affected.length };
  }
  function transaction(data, refs, module, base, scope, change, actor) {
    const rows = prepare(data, refs, module, base, scope);
    if (!rows.length) return { data, count: 0 };
    const next = copy(data), at = new Date().toLocaleString('zh-CN', { hour12: false });
    let count = 0;
    rows.forEach(({ ref }) => {
      const student = next[ref.className].find(row => row.id === ref.id);
      const before = signature(student, module);
      if (change(student) === false || (module === 'world' && before === signature(student, module))) return;
      count++;
      student.updated = { ...student.updated, [module]: { ...actor, at, version: (student.updated?.[module]?.version || 0) + 1 } };
      student.teacherModified = { ...student.teacherModified, [module]: actor.role !== 'school' };
      if (module === 'world') student.worldSource = actor.role === 'school' ? 'school' : 'teacher';
      student.operatedAt = { ...student.operatedAt, [module]: Date.now() };
    });
    return { data: next, count };
  }
  const api = { copy, today, defaultDuration, normalize, periods, prune, overlap, mergeBorrow, mergeDuration, effectiveBorrow, effectiveDuration, dayText, periodText, borrowText, borrowStatus, durationText, durationGroups, validatePeriods, validateBorrow, homeworkValue, signature, modified, resolve, prepare, durationDays, deletionPreview, transaction };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.controlRules = api;
})(typeof window !== 'undefined' ? window : globalThis);
