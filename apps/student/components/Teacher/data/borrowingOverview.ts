import type { BorrowSchedule, StudentControl } from './hierarchicalDeviceControl';

export type BorrowConfigurationGroup = { key: string; schedules: BorrowSchedule[]; studentIds: string[] };
const periodKey = (schedule: BorrowSchedule) => schedule.deny ? 'deny' : JSON.stringify([...schedule.periods].sort((a, b) => a.start.localeCompare(b.start)).map(p => [p.start, p.end]));
const nextDate = (date: string) => { const d = new Date(`${date}T12:00:00`); d.setDate(d.getDate() + 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

// 只比较实际配置；忽略规则ID、保存批次，并合并相同内容的星期或相邻日期。
export const normalizeBorrowSchedules = (schedules: BorrowSchedule[], mode: BorrowSchedule['mode']): BorrowSchedule[] => {
  const selected = schedules.filter(s => s.mode === mode).map(s => ({ ...s, weekdays: [...s.weekdays].sort(), periods: s.deny ? [] : s.periods.map(p => ({ ...p })).sort((a, b) => a.start.localeCompare(b.start)) }));
  if (mode === 'weekly') {
    const byContent = new Map<string, BorrowSchedule>();
    selected.forEach(s => { const key = periodKey(s), existing = byContent.get(key); if (existing) existing.weekdays = [...new Set([...existing.weekdays, ...s.weekdays])].sort(); else byContent.set(key, { ...s, id: key, startDate: '', endDate: '' }); });
    return [...byContent.values()].sort((a, b) => a.weekdays[0] - b.weekdays[0]);
  }
  const result: BorrowSchedule[] = [];
  selected.sort((a, b) => a.startDate.localeCompare(b.startDate)).forEach(s => {
    const last = result[result.length - 1];
    if (last && periodKey(last) === periodKey(s) && nextDate(last.endDate) === s.startDate) last.endDate = s.endDate;
    else result.push({ ...s, id: `${s.startDate}-${periodKey(s)}`, weekdays: [] });
  });
  return result;
};
export const borrowingConfigurationKey = (schedules: BorrowSchedule[], mode: BorrowSchedule['mode']) => JSON.stringify(normalizeBorrowSchedules(schedules, mode).map(s => ({ weekdays: s.weekdays, startDate: s.startDate, endDate: s.endDate, deny: s.deny, periods: s.periods })));
export const groupBorrowConfigurations = (ids: string[], controls: Record<string, StudentControl>, mode: BorrowSchedule['mode']): BorrowConfigurationGroup[] => {
  const groups = new Map<string, BorrowConfigurationGroup>();
  ids.forEach(id => {
    const key = borrowingConfigurationKey(controls[id].schedules, mode), group = groups.get(key);
    if (group) group.studentIds.push(id);
    else groups.set(key, { key, schedules: normalizeBorrowSchedules(controls[id].schedules, mode), studentIds: [id] });
  });
  return [...groups.values()].sort((a, b) => Number(b.schedules.length > 0) - Number(a.schedules.length > 0) || b.studentIds.length - a.studentIds.length || a.key.localeCompare(b.key));
};
export const borrowDateSummary = (s: BorrowSchedule) => {
  if (s.mode === 'dates') return `${s.startDate} 至 ${s.endDate}`;
  const names = ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'];
  const pieces: string[] = [];
  for (let i = 0; i < s.weekdays.length; i++) {
    let end = i;
    while (end + 1 < s.weekdays.length && s.weekdays[end + 1] === s.weekdays[end] + 1) end++;
    pieces.push(end - i >= 2 ? `${names[s.weekdays[i]]}至${names[s.weekdays[end]]}` : s.weekdays.slice(i, end + 1).map(d => names[d]).join('、'));
    i = end;
  }
  return pieces.join('、');
};
