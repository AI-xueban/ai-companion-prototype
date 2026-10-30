import { DurationRule, StudentControl } from './hierarchicalDeviceControl';
import { durationRuleKey, removeDurationRule } from './durationRuleGroups';

export type DurationApplyScope = 'all' | 'unmodified';

// Explicit weekday markers also preserve a teacher's deliberate reset to default.
export const teacherDurationWeekdays = (control: StudentControl): number[] => [...new Set([
  ...(control.durationTeacherWeekdays ?? []),
  ...control.durationRules.filter((rule) => rule.source === 'homeroom').flatMap((rule) => rule.weekdays),
])];

export const durationUpdateDays = (control: StudentControl, rule: DurationRule, scope: DurationApplyScope): number[] => {
  const protectedDays = new Set(scope === 'unmodified' ? teacherDurationWeekdays(control) : []);
  return rule.weekdays.filter((day) => !protectedDays.has(day));
};

export const applySchoolDurationRule = (control: StudentControl, rule: DurationRule, scope: DurationApplyScope, original?: DurationRule): StudentControl => {
  const days = durationUpdateDays(control, rule, scope);
  const originalDays = original ? durationUpdateDays(control, original, scope) : [];
  if (!days.length && !originalDays.length) return control;
  // Editing replaces the selected rule, including weekdays removed from its form.
  const base = original && originalDays.length
    ? { ...removeDurationRule(control, original), durationRules: control.durationRules.flatMap(existing => {
      if (durationRuleKey(existing) !== durationRuleKey(original)) return [existing];
      const retained = existing.weekdays.filter(day => !originalDays.includes(day));
      return retained.length ? [{ ...existing, weekdays: retained }] : [];
    }) }
    : control;
  return {
    ...base,
    durationTeacherWeekdays: teacherDurationWeekdays(control).filter((day) => !days.includes(day) && !originalDays.includes(day)),
    durationRules: [
      ...base.durationRules.map((existing) => ({ ...existing, weekdays: existing.weekdays.filter((day) => !days.includes(day)) })).filter((existing) => existing.weekdays.length),
      ...(rule.useDefault ? [] : [{ ...rule, source: 'school' as const, weekdays: days, periods: rule.periods.map((period) => ({ ...period })) }]),
    ],
  };
};
