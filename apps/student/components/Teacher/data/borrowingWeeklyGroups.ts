import { BorrowSchedule, borrowingPeriodsForDay } from './hierarchicalDeviceControl';

export type BorrowingWeekGroup = { days: number[]; periods: { start: string; end: string }[] };
export function borrowingWeekGroups(rule: BorrowSchedule): BorrowingWeekGroup[] {
  const groups = new Map<string, BorrowingWeekGroup>();
  for (const day of [...rule.weekdays].sort((a, b) => a - b)) {
    const periods = borrowingPeriodsForDay(rule, day).map(period => ({ ...period })).sort((a, b) => a.start.localeCompare(b.start));
    const key = JSON.stringify(periods);
    const group = groups.get(key) ?? { days: [], periods };
    group.days.push(day);
    groups.set(key, group);
  }
  return groups.size ? [...groups.values()] : [{ days: [], periods: [{ start: '', end: '' }] }];
}

export function applyBorrowingWeekGroups(rule: BorrowSchedule, groups: BorrowingWeekGroup[]): BorrowSchedule {
  return { ...rule, weekdays: groups.flatMap(group => group.days).sort((a, b) => a - b), periods: [],
    weekdayPeriods: Object.fromEntries(groups.flatMap(group => group.days.map(day => [day, group.periods.map(period => ({ ...period }))]))) };
}
