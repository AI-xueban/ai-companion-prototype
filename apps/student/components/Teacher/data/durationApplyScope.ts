import { DurationRule, StudentControl } from './hierarchicalDeviceControl';

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

export const applySchoolDurationRule = (control: StudentControl, rule: DurationRule, scope: DurationApplyScope): StudentControl => {
  const days = durationUpdateDays(control, rule, scope);
  if (!days.length) return control;
  return {
    ...control,
    durationTeacherWeekdays: teacherDurationWeekdays(control).filter((day) => !days.includes(day)),
    durationRules: [
      ...control.durationRules.map((existing) => ({ ...existing, weekdays: existing.weekdays.filter((day) => !days.includes(day)) })).filter((existing) => existing.weekdays.length),
      ...(rule.useDefault ? [] : [{ ...rule, source: 'school' as const, weekdays: days, periods: rule.periods.map((period) => ({ ...period })) }]),
    ],
  };
};
