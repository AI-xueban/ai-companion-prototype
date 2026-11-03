import { DurationRule, weekdayNames } from './hierarchicalDeviceControl';

export function validateDurationRuleSet(rules: DurationRule[]): string {
  if (!rules.length) return '请至少添加一组时长设置';
  const days = new Set<number>();
  for (const [index, rule] of rules.entries()) {
    const prefix = `第${index + 1}组：`;
    if (!rule.weekdays.length) return prefix + '请至少选择一个星期';
    for (const day of rule.weekdays) {
      if (days.has(day)) return `${weekdayNames[day]}只能设置在一组中`;
      days.add(day);
    }
    if (![rule.continuousMinutes, rule.restMinutes, rule.dailyMinutes].every(value => Number.isInteger(value) && value > 0)) return prefix + '各项时长须为大于0的整数分钟';
    if (rule.dailyMinutes < rule.continuousMinutes) return prefix + '每日累计时长不能短于连续使用时长';
    if (rule.periods.some(period => !period.start || !period.end || period.start >= period.end)) return prefix + '请填写完整且结束晚于开始的可用时段';
    const periods = [...rule.periods].sort((a, b) => a.start.localeCompare(b.start));
    if (periods.some((period, i) => i > 0 && period.start < periods[i - 1].end)) return prefix + '每日可用时段不能重叠';
  }
  return '';
}
