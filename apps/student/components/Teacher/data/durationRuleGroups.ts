import { defaultDurationRule, DurationRule, StudentControl } from './hierarchicalDeviceControl';

export const durationRuleKey = (rule: DurationRule) => JSON.stringify([
  [...rule.weekdays].sort(), rule.source ?? 'school', rule.useDefault,
  rule.continuousMinutes, rule.restMinutes, rule.dailyMinutes,
  [...rule.periods].sort((a, b) => a.start.localeCompare(b.start)),
]);
export type DurationRuleGroup = { key: string; rule: DurationRule; ids: string[]; fallback: boolean };

// Group exact configurations, never substitute a majority rule for a different class.
export function groupDurationRules(ids: string[], controls: Record<string, StudentControl>): DurationRuleGroup[] {
  const groups = new Map<string, DurationRuleGroup>();
  for (const id of ids) {
    const rules = controls[id]?.durationRules ?? [];
    const missing = [0, 1, 2, 3, 4, 5, 6].filter(day => !rules.some(rule => rule.weekdays.includes(day)));
    const entries = rules.map(rule => ({ rule, fallback: false }));
    if (missing.length) entries.push({ rule: { ...defaultDurationRule, id: 'default-duration', weekdays: missing, useDefault: false }, fallback: true });
    for (const { rule, fallback } of entries) {
      const key = `${fallback ? 'default:' : ''}${durationRuleKey(rule)}`;
      const group = groups.get(key);
      if (group) { if (!group.ids.includes(id)) group.ids.push(id); }
      else groups.set(key, { key, rule, ids: [id], fallback });
    }
  }
  return [...groups.values()].sort((a, b) => Number(a.fallback) - Number(b.fallback) || a.rule.weekdays[0] - b.rule.weekdays[0]);
}

export function removeDurationRule(control: StudentControl, original: DurationRule): StudentControl {
  const key = durationRuleKey(original);
  const rules = control.durationRules.filter(rule => durationRuleKey(rule) !== key);
  return { ...control, durationRules: rules,
    durationTeacherWeekdays: (control.durationTeacherWeekdays ?? []).filter(day =>
      !original.weekdays.includes(day) || rules.some(rule => rule.source === 'homeroom' && rule.weekdays.includes(day))),
  };
}
