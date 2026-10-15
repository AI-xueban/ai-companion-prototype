import { schoolDeviceClasses } from './schoolDeviceClasses';

export type ControlModule = 'borrowing' | 'homework' | 'world' | 'lock';
export type DeviceStudent = { id: string; number: string; name: string; classId: string; grade: number };
export type BorrowSchedule = { id: string; mode: 'weekly' | 'dates'; weekdays: number[]; startDate: string; endDate: string; deny: boolean; periods: { start: string; end: string }[] };
export type StudentControl = { schedules: BorrowSchedule[]; answer: boolean; explanation: boolean; world: boolean; locked: boolean; updated: Partial<Record<ControlModule, { by: string; at: string }>> };
export const controlGrades = [...new Set(schoolDeviceClasses.map(c => c.grade))].sort((a, b) => a - b);
const surnames = ['李', '王', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴'];
const givenNames = ['明', '梓涵', '宇轩', '诗涵', '一诺', '浩然', '欣怡', '子墨', '雨桐', '沐辰', '若溪', '佳宁', '思远', '可欣', '书瑶', '星宇', '语彤', '嘉言', '晨曦', '安然', '文博', '乐瑶', '奕辰', '心悦', '景行', '知夏', '清越', '亦凡', '舒然', '予安'];
export const deviceControlStudents: DeviceStudent[] = schoolDeviceClasses.flatMap((c, classIndex) => Array.from({ length: 30 }, (_, index) => ({
  id: `${c.id}-student-${index + 1}`, number: `${c.grade}${String(classIndex + 1).padStart(2, '0')}${String(index + 1).padStart(2, '0')}`,
  name: surnames[(index + classIndex) % surnames.length] + givenNames[index], classId: c.id, grade: c.grade,
})));
export const newBorrowSchedule = (mode: BorrowSchedule['mode']): BorrowSchedule => ({ id: `schedule-${Date.now()}`, mode, weekdays: [], startDate: '', endDate: '', deny: false, periods: [{ start: '', end: '' }] });
export const initialStudentControls = (): Record<string, StudentControl> => Object.fromEntries(deviceControlStudents.map(s => [s.id, {
  schedules: [], answer: false, explanation: false, world: true, locked: false, updated: {},
}]));
export const weekdayNames = ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'];
export const scheduleDateText = (s: BorrowSchedule) => s.mode === 'weekly' ? s.weekdays.map(d => weekdayNames[d]).join('、') : `${s.startDate} 至 ${s.endDate}`;
export const schedulePeriodText = (s: BorrowSchedule) => s.deny ? '全天禁止借用' : s.periods.map(p => `${p.start}–${p.end}`).join('、');
export const validateSchedule = (s: BorrowSchedule): string => {
  if (s.mode === 'weekly' && !s.weekdays.length) return '请至少选择一个星期';
  if (s.mode === 'dates' && (!s.startDate || !s.endDate)) return '请选择开始和结束日期';
  if (s.mode === 'dates' && s.startDate > s.endDate) return '结束日期不能早于开始日期';
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
export const policySignature = (s: StudentControl, module: ControlModule) => {
  if (module === 'homework') return `${s.answer}-${s.explanation}`;
  if (module === 'world') return String(s.world);
  if (module === 'lock') return String(s.locked);
  return JSON.stringify(s.schedules.map(({ id: _id, ...schedule }) => schedule).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))));
};
