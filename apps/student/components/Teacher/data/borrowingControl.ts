import { BorrowSchedule, borrowingPeriodsForDay, deviceControlStudents, mergeBorrowSchedule, schoolDate } from './hierarchicalDeviceControl';
import { schoolDeviceClasses } from './schoolDeviceClasses';

export const borrowingStorageKey = (schoolId: string) => `ai-companion-borrowing-v3:${schoolId}`;
export type BorrowingHistory = { id: string; at: string; operator: string; title: string; scope: string; classIds?: string[]; before: string[]; after: string[] };
export type BorrowingState = {
  revision: number;
  classRules: Record<string, BorrowSchedule[]>;
  schoolTemporaryActive: boolean;
  temporaryClasses: Record<string, boolean>;
  // 学生禁借随学生保留，由当前关联班主任管理，不随班级规则写入或清除。
  studentBans: Record<string, boolean>;
  history: BorrowingHistory[];
};
export const initialBorrowingState = (): BorrowingState => ({ revision: 0, classRules: {}, schoolTemporaryActive: false, temporaryClasses: {}, studentBans: {}, history: [] });
export const readBorrowingState = (schoolId: string): BorrowingState => {
  const raw = localStorage.getItem(borrowingStorageKey(schoolId));
  if (raw) return { ...initialBorrowingState(), ...JSON.parse(raw) };
  const state = initialBorrowingState();
  // 迁移旧演示的学校借用时间，不改动旧模块或老师的其他设置。
  const legacy = JSON.parse(localStorage.getItem('ai-companion-device-controls-v2') ?? 'null');
  if (legacy?.borrow) for (const group of schoolDeviceClasses) {
    const student = deviceControlStudents.find(item => item.classId === group.id);
    state.classRules[group.id] = student ? legacy.borrow[student.id]?.schedules ?? [] : [];
  }
  const history = JSON.parse(localStorage.getItem('ai-companion-device-control-history-v2') ?? '[]');
  if (Array.isArray(history)) state.history = history
    .filter(record => record.module === 'borrowing' && record.source === 'teacher-portal' && record.operatorRole === 'school-admin')
    .slice(0, 100).map(record => ({ id: record.id, at: record.time, operator: record.operator, title: record.title, scope: record.scope, before: record.before, after: record.after,
      classIds: [...new Set(deviceControlStudents.filter(student => record.ids?.includes(student.id)).map(student => student.classId))] }));
  return state;
};
export const classTemporarilyDenied = (state: BorrowingState, classId: string) => state.temporaryClasses[classId] ?? state.schoolTemporaryActive;
export const setTemporaryBorrowing = (state: BorrowingState, classIds: string[], denied: boolean, schoolAction = false): BorrowingState => {
  if (schoolAction) return { ...state, schoolTemporaryActive: denied, temporaryClasses: {} };
  return { ...state, temporaryClasses: { ...state.temporaryClasses, ...Object.fromEntries(classIds.map(id => [id, denied])) } };
};
export const saveClassBorrowingRule = (state: BorrowingState, classIds: string[], rule: BorrowSchedule, editingId?: string): BorrowingState => ({
  ...state,
  classRules: { ...state.classRules, ...Object.fromEntries(classIds.map(id => [id, mergeBorrowSchedule(state.classRules[id] ?? [], rule, editingId)])) },
});
export type BorrowingRuleEntry = { classId: string; ruleId: string };
export const saveGroupedBorrowingRule = (state: BorrowingState, entries: BorrowingRuleEntry[], rule: BorrowSchedule, targetClassIds = entries.map(entry => entry.classId)): BorrowingState => ({
  ...state,
  classRules: { ...state.classRules, ...Object.fromEntries(targetClassIds.map(classId => {
    const original = entries.find(entry => entry.classId === classId);
    return [classId, mergeBorrowSchedule(state.classRules[classId] ?? [], { ...rule, id: original?.ruleId ?? rule.id }, original?.ruleId ?? rule.id)];
  })) },
});
export const deleteGroupedBorrowingRule = (state: BorrowingState, entries: BorrowingRuleEntry[]): BorrowingState => ({
  ...state,
  classRules: { ...state.classRules, ...Object.fromEntries(entries.map(({ classId, ruleId }) => [classId,
    (state.classRules[classId] ?? []).filter(item => item.id !== ruleId)])) },
});
export const borrowingResult = (state: BorrowingState, student: { id: string; classId: string }, now = new Date()) => {
  if (classTemporarilyDenied(state, student.classId)) return '学校临时禁止借用';
  if (state.studentBans[student.id]) return '班主任已禁止借用';
  const date = schoolDate(now);
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Shanghai', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(now);
  const weekday = (new Date(`${date}T12:00:00+08:00`).getUTCDay() + 6) % 7;
  const rules = state.classRules[student.classId] ?? [];
  const rule = rules.find(item => item.mode === 'dates' && item.startDate <= date && item.endDate >= date)
    ?? rules.find(item => item.mode === 'weekly' && item.weekdays.includes(weekday));
  if (!rule) return rules.some(item => item.mode === 'weekly') ? '当前不在借用时段' : '当前可借用';
  if (rule.deny) return '指定日期禁止借用';
  const periods = rule.mode === 'weekly' ? borrowingPeriodsForDay(rule, weekday) : rule.periods;
  return periods.some(period => period.start <= parts && parts < period.end) ? '当前可借用' : '当前不在借用时段';
};

export const borrowingRuleSignature = (rule: BorrowSchedule) => JSON.stringify({
  mode: rule.mode,
  days: rule.mode === 'weekly' ? [...rule.weekdays].sort() : [rule.startDate, rule.endDate],
  deny: rule.mode === 'dates' && rule.deny,
  periods: rule.mode === 'dates' && rule.deny ? [] : rule.mode === 'weekly'
    ? [...rule.weekdays].sort().map(day => [day, borrowingPeriodsForDay(rule, day).map(p => p.start + '-' + p.end).sort()])
    : rule.periods.map(p => p.start + '-' + p.end).sort(),
});

// Date ranges include both endpoints; a rejected save must not alter any grade.
export function gradeBorrowingDateConflict(state: BorrowingState, classIds: string[], rule: BorrowSchedule, originals: BorrowingRuleEntry[] = []): boolean {
  return rule.mode === 'dates' && classIds.some(classId => (state.classRules[classId] ?? []).some(existing =>
    existing.mode === 'dates' && !originals.some(entry => entry.classId === classId && entry.ruleId === existing.id)
    && existing.startDate <= rule.endDate && rule.startDate <= existing.endDate));
}

export function saveGradeBorrowingRule(state: BorrowingState, classIds: string[], rule: BorrowSchedule, originals: BorrowingRuleEntry[] = [], confirmWeeklyChange = false): BorrowingState {
  if (rule.mode === 'weekly' && !confirmWeeklyChange && !originals.length && classIds.some(classId => (state.classRules[classId] ?? []).some(existing => existing.mode === 'weekly'))) throw new Error('所选年级已有每周固定规则，请编辑已有规则或删除后再新增');
  if (gradeBorrowingDateConflict(state, classIds, rule, originals)) throw new Error('所选日期已有规则，请重新选择');
  const normalized: BorrowSchedule = rule.mode === 'dates' ? { ...rule, deny: true, periods: [], weekdays: [], weekdayPeriods: undefined } : { ...rule, deny: false };
  return { ...state, classRules: { ...state.classRules, ...Object.fromEntries(classIds.map(classId => [classId,
    [...(state.classRules[classId] ?? []).filter(existing => rule.mode === 'weekly'
      ? existing.mode !== 'weekly'
      : !originals.some(entry => entry.classId === classId && entry.ruleId === existing.id)), structuredClone(normalized)],
  ])) } };
}
export const groupBorrowingRules = (state: BorrowingState, classIds: string[], mode: BorrowSchedule['mode']) => {
  const groups = new Map<string, { key: string; rule: BorrowSchedule; entries: BorrowingRuleEntry[] }>();
  classIds.forEach(classId => (state.classRules[classId] ?? []).filter(rule => rule.mode === mode).forEach(rule => {
    const key = borrowingRuleSignature(rule);
    const group = groups.get(key) ?? { key, rule, entries: [] };
    group.entries.push({ classId, ruleId: rule.id });
    groups.set(key, group);
  }));
  return [...groups.values()];
};
// Compare configuration content independently of rule IDs and creation order.
export const borrowingListSummary = (state: BorrowingState, classIds: string[], mode: BorrowSchedule['mode'], includeRule: (rule: BorrowSchedule) => boolean = () => true) => {
  const configurations = classIds.map(id => (state.classRules[id] ?? []).filter(rule => rule.mode === mode && includeRule(rule)));
  const configured = configurations.filter(rules => rules.length);
  if (!configured.length) return { rules: [] as BorrowSchedule[], note: '未设置规则' };
  if (configured.length !== configurations.length) return { rules: [] as BorrowSchedule[], note: '部分班级未设置规则' };
  const signature = (rules: BorrowSchedule[]) => JSON.stringify(rules.map(borrowingRuleSignature).sort());
  const first = signature(configured[0]);
  return configured.every(rules => signature(rules) === first)
    ? { rules: configured[0], note: '—' }
    : { rules: [] as BorrowSchedule[], note: '各班规则不同' };
};
