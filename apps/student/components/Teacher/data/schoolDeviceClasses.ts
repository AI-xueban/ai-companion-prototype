// 设备管控演示学校包含一至九年级；保留原班级ID及各班配置，不影响学情及账号数据。
import { PORTAL_CLASSES } from './teacherAccess';

export const schoolDeviceClasses = [
  ...PORTAL_CLASSES,
  ...Array.from({ length: 9 }, (_, index) => index + 1).flatMap(grade =>
    Array.from({ length: grade === 9 ? 14 : 13 }, (_, index) => {
      const number = index + 1;
      return { id: `device-class-${grade}-${number}`, name: `${['一', '二', '三', '四', '五', '六', '七', '八', '九'][grade - 1]}年级(${number})班`, grade, alertCount: 0 };
    }).filter(item => !PORTAL_CLASSES.some(existing => existing.name === item.name)),
  ),
].sort((a, b) => a.grade - b.grade || Number(a.name.match(/\((\d+)\)/)?.[1]) - Number(b.name.match(/\((\d+)\)/)?.[1]));
