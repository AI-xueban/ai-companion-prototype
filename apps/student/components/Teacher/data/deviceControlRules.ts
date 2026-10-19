export type AvailablePeriod = { id: number; start: string; end: string };
export type BorrowingRule = { accessMode?: 'allow' | 'deny'; exclusions?: import('./controlRuleConflicts').ScheduleExclusion[]; scheduleMode?: 'weekly' | 'dates'; startDate?: string; endDate?: string; targetGrades?: string[]; targetClassIds?: string[]; id: number; scope: 'school' | 'grade' | 'class'; grade: string; classId: string; weekdays: number[]; periods: AvailablePeriod[] };
export const weekdayLabels = ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'];
export const createBorrowingRule = (id: number): BorrowingRule => ({ id, scheduleMode: 'weekly', startDate: '', endDate: '', scope: 'school', grade: '', classId: '', weekdays: [], periods: [{ id: 1, start: '', end: '' }] });
export type LockRule = { id: number; scope: 'school' | 'grade' | 'class'; grade: string; classId: string; enabled: boolean };
export const createLockRule = (id: number): LockRule => ({ id, scope: 'school', grade: '', classId: '', enabled: false });

export const borrowingSchedulesOverlap = (a: BorrowingRule, b: BorrowingRule): boolean => {
  const dayOf = (date: string) => (new Date(date + 'T12:00:00').getDay() + 6) % 7;
  const includesWeekday = (range: BorrowingRule, weekly: BorrowingRule) => {
    if (!range.startDate || !range.endDate) return false;
    const start = new Date(range.startDate + 'T12:00:00');
    const days = Math.floor((new Date(range.endDate + 'T12:00:00').getTime() - start.getTime()) / 86400000);
    if (days >= 6) return weekly.weekdays.length > 0;
    return Array.from({length: Math.max(0, days + 1)}, (_,i)=>(dayOf(range.startDate!) + i) % 7).some(d=>weekly.weekdays.includes(d));
  };
  if (a.scheduleMode === 'dates' && b.scheduleMode === 'dates') return !!(a.startDate && a.endDate && b.startDate && b.endDate && a.startDate <= b.endDate && b.startDate <= a.endDate);
  if (a.scheduleMode === 'dates') return includesWeekday(a,b);
  if (b.scheduleMode === 'dates') return includesWeekday(b,a);
  return a.weekdays.some(d => b.weekdays.includes(d));
};
