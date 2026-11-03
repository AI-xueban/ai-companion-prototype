import { REPORT_STUDENTS, reportDate } from './learningReportData';

export interface SchoolDeviceRecord {
  id: string;
  tabletId: string;
  sn: string;
  studentId: string;
  studentName: string;
  grade: string;
  loginMethod: string;
  cabinetBorrow: string;
  slotBorrow: number;
  borrowAt: string;
  beforeCondition: { aiResult: string };
  overdue: boolean;
  status: 'returned' | 'borrowed';
  returnAt: string | null;
  cabinetReturn: string | null;
  slotReturn: number | null;
  returnInspection?: { aiResult: string };
  screenOnIntervals: Array<{ onAt: string; offAt: string }>;
}

// 固定演示事实：近 7 天 60 笔借用、52 笔归还；更早 23 天 40 笔均已归还。
// 同一来源同时注入设备管理页，并供校级数据看板按日期汇总。
const weekly = [7, 8, 9, 10, 8, 9, 9];
const dailyCounts = Array.from({ length: 30 }, (_, index) => index < 23 ? (index < 17 ? 2 : 1) : weekly[index - 23]);

export const SCHOOL_DEVICE_RECORDS: SchoolDeviceRecord[] = dailyCounts.flatMap((count, index) => {
  const day = 29 - index;
  const date = reportDate(day);
  return Array.from({ length: count }, (_, offset) => {
    const sequence = dailyCounts.slice(0, index).reduce((sum, amount) => sum + amount, 0) + offset;
    const student = REPORT_STUDENTS[sequence % REPORT_STUDENTS.length];
    const tabletNo = sequence % 20 + 1;
    const cabinetNo = Math.floor((tabletNo - 1) / 8) + 1;
    const cabinetId = `CAB-00${cabinetNo}`;
    const returned = day > 0 || offset < count - 8;
    const hour = 8 + Math.floor(offset / 2);
    const startMinute = hour * 60 + (offset % 2 ? 30 : 0);
    const timestampAt = (minuteOffset: number) => {
      const minute = startMinute + minuteOffset;
      return `${date} ${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}:00`;
    };
    return {
      id: `UR-${date.replaceAll('-', '')}-${String(offset + 1).padStart(3, '0')}`,
      tabletId: `TAB-${String(tabletNo).padStart(3, '0')}`,
      sn: `SN20260301${String(tabletNo).padStart(3, '0')}`,
      studentId: student.id,
      studentName: student.name,
      grade: student.className,
      loginMethod: offset % 3 === 0 ? '编号密码' : '人脸识别',
      cabinetBorrow: cabinetId,
      slotBorrow: (tabletNo - 1) % 8 + 1,
      borrowAt: timestampAt(0),
      beforeCondition: { aiResult: 'normal' },
      overdue: false,
      status: returned ? 'returned' as const : 'borrowed' as const,
      returnAt: returned ? timestampAt(60) : null,
      cabinetReturn: returned ? cabinetId : null,
      slotReturn: returned ? (tabletNo - 1) % 8 + 1 : null,
      screenOnIntervals: [
        { onAt: timestampAt(5), offAt: timestampAt(16 + offset % 5) },
        { onAt: timestampAt(25), offAt: timestampAt(38 + offset % 7) },
      ],
      ...(returned ? { returnInspection: { aiResult: 'normal' } } : {}),
    };
  });
});

// 仅累计借用期间真实有亮屏证据的时间段；按借用单裁剪、合并重叠区间后再求和。
export const screenOnMinutes = (records: SchoolDeviceRecord[], fromDate: string, toDateExclusive: string) => {
  const from = new Date(`${fromDate}T00:00:00`).getTime();
  const to = new Date(`${toDateExclusive}T00:00:00`).getTime();
  let milliseconds = 0;
  records.forEach(record => {
    const borrow = new Date(record.borrowAt.replace(' ', 'T')).getTime();
    const returned = record.returnAt ? new Date(record.returnAt.replace(' ', 'T')).getTime() : to;
    const segments = record.screenOnIntervals.map(interval => ({
      start: Math.max(from, borrow, new Date(interval.onAt.replace(' ', 'T')).getTime()),
      end: Math.min(to, returned, new Date(interval.offAt.replace(' ', 'T')).getTime()),
    })).filter(interval => interval.end > interval.start).sort((a, b) => a.start - b.start);
    let activeStart = -1;
    let activeEnd = -1;
    segments.forEach(segment => {
      if (activeStart < 0) { activeStart = segment.start; activeEnd = segment.end; }
      else if (segment.start <= activeEnd) activeEnd = Math.max(activeEnd, segment.end);
      else { milliseconds += activeEnd - activeStart; activeStart = segment.start; activeEnd = segment.end; }
    });
    if (activeStart >= 0) milliseconds += activeEnd - activeStart;
  });
  return Math.round(milliseconds / 60000);
};
