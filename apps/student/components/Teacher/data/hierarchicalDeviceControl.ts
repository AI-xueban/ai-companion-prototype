import { schoolDeviceClasses } from './schoolDeviceClasses';

export type ControlModule = 'borrowing' | 'duration' | 'homework' | 'world' | 'lock';
export type DeviceStudent = { id: string; number: string; name: string; classId: string; grade: number };
export type BorrowSchedule = { id: string; mode: 'weekly' | 'dates'; weekdays: number[]; startDate: string; endDate: string; deny: boolean; periods: { start: string; end: string }[] };
export type DurationRule = { source?: 'school' | 'homeroom'; id: string; weekdays: number[]; useDefault: boolean; continuousMinutes: number; restMinutes: number; dailyMinutes: number; periods: { start: string; end: string }[] };
export const defaultDurationRule: Omit<DurationRule, 'id' | 'weekdays' | 'useDefault'> = { continuousMinutes: 60, restMinutes: 15, dailyMinutes: 180, periods: [] };
export const newDurationRule = (): DurationRule => ({ id: `duration-${Date.now()}`, weekdays: [0, 1, 2, 3, 4, 5, 6], useDefault: true, ...defaultDurationRule, periods: [] });
export const durationRuleText = (rule: DurationRule) => `${rule.useDefault ? '默认规则 · ' : ''}连续 ${rule.continuousMinutes} 分钟 · 休息 ${rule.restMinutes} 分钟 · 每日累计 ${rule.dailyMinutes} 分钟 · ${rule.periods.length ? rule.periods.map(p => `${p.start}–${p.end}`).join('、') : '不限可用时段'}`;
export type StudentControl = { revisions?: Partial<Record<ControlModule, number>>; homeworkSource?: 'school' | 'teacher'; worldSource?: 'school' | 'teacher'; durationTeacherWeekdays?: number[]; schedules: BorrowSchedule[]; durationRules: DurationRule[]; answer: boolean; explanation: boolean; world: boolean; locked: boolean; updated: Partial<Record<ControlModule, { by: string; at: string }>> };
export const controlGrades = [...new Set(schoolDeviceClasses.map(c => c.grade))].sort((a, b) => a - b);
const surnames = ['李', '王', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴'];
const givenNames = ['明', '梓涵', '宇轩', '诗涵', '一诺', '浩然', '欣怡', '子墨', '雨桐', '沐辰', '若溪', '佳宁', '思远', '可欣', '书瑶', '星宇', '语彤', '嘉言', '晨曦', '安然', '文博', '乐瑶', '奕辰', '心悦', '景行', '知夏', '清越', '亦凡', '舒然', '予安'];
export const deviceControlStudents: DeviceStudent[] = schoolDeviceClasses.flatMap((c, classIndex) => Array.from({ length: 30 }, (_, index) => ({
  id: `${c.id}-student-${index + 1}`, number: `${c.grade}${String(classIndex + 1).padStart(2, '0')}${String(index + 1).padStart(2, '0')}`,
  name: surnames[(index + classIndex) % surnames.length] + givenNames[index], classId: c.id, grade: c.grade,
})));
export const newBorrowSchedule = (mode: BorrowSchedule['mode']): BorrowSchedule => ({ id: `schedule-${Date.now()}`, mode, weekdays: [], startDate: '', endDate: '', deny: false, periods: [{ start: '', end: '' }] });
export const initialStudentControls = (): Record<string, StudentControl> => Object.fromEntries(deviceControlStudents.map(s => [s.id, {
  schedules: [], durationRules: [], answer: false, explanation: false, world: true, locked: false, updated: {},
}]));
export const weekdayNames = ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'];
export const weekdayRangeText = (weekdays: number[]) => {
  const names = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  const days = [...new Set(weekdays)].sort((a, b) => a - b);
  const parts: string[] = [];
  for (let start = 0; start < days.length;) {
    let end = start;
    while (end + 1 < days.length && days[end + 1] === days[end] + 1) end += 1;
    const length = end - start + 1;
    if (length >= 3) parts.push(`${names[days[start]]}至${names[days[end]]}`);
    else for (let index = start; index <= end; index += 1) parts.push(names[days[index]]);
    start = end + 1;
  }
  return parts.join('、');
};
export const scheduleDateText = (s: BorrowSchedule) => s.mode === 'weekly' ? weekdayRangeText(s.weekdays) : `${s.startDate} 至 ${s.endDate}`;
export const schedulePeriodText = (s: BorrowSchedule) => s.deny ? '全天禁止借用' : s.periods.map(p => `${p.start}–${p.end}`).join('、');
// 生命周期按包含起止日期的有效期判断，借用时段只决定当前能否借出。
export const schoolDate = (now = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
export const borrowScheduleStatus = (s: BorrowSchedule, now = new Date()): '待生效' | '生效中' | '已失效' => {
  const date = schoolDate(now);
  if (date < s.startDate) return '待生效';
  if (date > s.endDate) return '已失效';
  return '生效中';
};
export const validateSchedule = (s: BorrowSchedule, now = new Date(), preservedStartDate?: string): string => {
  if (s.mode === 'weekly' && !s.weekdays.length) return '请至少选择一个星期';
  if (s.mode === 'dates' && (!s.startDate || !s.endDate)) return '请选择开始和结束日期';
  if (s.mode === 'dates' && s.startDate > s.endDate) return '结束日期不能早于开始日期';
  const today = schoolDate(now);
  if (s.mode === 'dates' && s.startDate < today && s.startDate !== preservedStartDate) return '生效日期只能选择当天及之后';
  if (s.mode === 'dates' && s.endDate < today) return '结束日期不能早于今天';
  if (s.mode === 'dates' && s.deny) return '';
  if (!s.periods.length || s.periods.some(p => !p.start || !p.end)) return '请填写完整的借用时段';
  if (s.periods.some(p => p.start >= p.end)) return '结束时间须晚于开始时间，暂不支持跨日';
  const sorted = [...s.periods].sort((a, b) => a.start.localeCompare(b.start));
  if (sorted.some((p, i) => i > 0 && p.start < sorted[i - 1].end)) return '同一借用规则中的借用时段不能重叠';
  return '';
};
export const schedulesConflict = (a: BorrowSchedule, b: BorrowSchedule) => a.mode === b.mode && (a.mode === 'weekly' ? a.weekdays.some(d => b.weekdays.includes(d)) : a.startDate <= b.endDate && b.startDate <= a.endDate);
const offsetDate = (date: string, offset: number) => { const d = new Date(`${date}T12:00:00`); d.setDate(d.getDate() + offset); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
// 同类只替换冲突日期；不同类型始终共存。指定日期删除后自然恢复每周借用规则。
export const mergeBorrowSchedule = (existing: BorrowSchedule[], next: BorrowSchedule, editingId?: string): BorrowSchedule[] => {
  const retained = existing.filter(s => s.id !== editingId).flatMap(s => {
    if (!schedulesConflict(s, next)) return [s];
    if (s.mode === 'weekly') { const weekdays = s.weekdays.filter(d => !next.weekdays.includes(d)); return weekdays.length ? [{ ...s, weekdays }] : []; }
    const pieces: BorrowSchedule[] = [];
    if (s.startDate < next.startDate) pieces.push({ ...s, id: `${s.id}-before-${next.id}`, endDate: offsetDate(next.startDate, -1) });
    if (s.endDate > next.endDate) pieces.push({ ...s, id: `${s.id}-after-${next.id}`, startDate: offsetDate(next.endDate, 1) });
    return pieces;
  });
  return [...retained, { ...next, weekdays: [...next.weekdays], periods: next.periods.map(p => ({ ...p })) }];
};
// Display equality concerns effective values only; ownership and save history still
// participate separately in the optimistic-concurrency signature below.
export const policyDisplaySignature = (s: StudentControl, module: ControlModule) => {
  if (module === 'homework') return JSON.stringify([s.answer, s.explanation]);
  if (module === 'world') return String(s.world);
  if (module === 'lock') return String(s.locked);
  return JSON.stringify((module === 'duration' ? s.durationRules : s.schedules).map(({ id: _id, ...rule }) => rule).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))));
};
const policyContentSignature = (s: StudentControl, module: ControlModule) => {
  if (module === 'duration') return JSON.stringify(s.durationTeacherWeekdays ?? []) + JSON.stringify(s.durationRules.map(({ id: _id, ...rule }) => rule).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))));
  if (module === 'homework') return `${s.answer}-${s.explanation}:${s.homeworkSource ?? 'school'}`;
  if (module === 'world') return `${s.world}:${s.worldSource ?? 'school'}`;
  if (module === 'lock') return String(s.locked);
  return JSON.stringify(s.schedules.map(({ id: _id, ...schedule }) => schedule).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))));
};

// Include operation metadata so a change followed by a revert still invalidates an open editor.
export const policySignature = (s: StudentControl, module: ControlModule) => policyContentSignature(s, module) + JSON.stringify([s.revisions?.[module] ?? 0, s.updated[module] ?? null]);
