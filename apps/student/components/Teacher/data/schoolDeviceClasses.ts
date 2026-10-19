// 设备管控列表使用40个班级，保留现有班级编号；不影响学情及账号数据。
import { PORTAL_CLASSES } from './teacherAccess';

export const schoolDeviceClasses = [
  ...PORTAL_CLASSES,
  ...[7, 8, 9].flatMap(grade =>
    Array.from({ length: grade === 9 ? 14 : 13 }, (_, index) => {
      const number = index + 1;
      return { id: `device-class-${grade}-${number}`, name: `${grade === 7 ? '七' : grade === 8 ? '八' : '九'}年级(${number})班`, grade, alertCount: 0 };
    }).filter(item => !PORTAL_CLASSES.some(existing => existing.name === item.name)),
  ),
].sort((a, b) => a.grade - b.grade || Number(a.name.match(/\((\d+)\)/)?.[1]) - Number(b.name.match(/\((\d+)\)/)?.[1]));
