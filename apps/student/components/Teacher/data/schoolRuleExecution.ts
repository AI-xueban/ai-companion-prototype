import { defaultDurationRule, DurationRule, StudentControl } from './hierarchicalDeviceControl';
import { teacherDurationWeekdays } from './durationApplyScope';

export type SchoolRuleModulesEnabled = Partial<Record<'duration' | 'durationDefault' | 'homework', boolean>>;

// Stored rules remain unchanged. Execution must read these switches before applying defaults.
export function effectiveSchoolDurationRules(control: StudentControl, enabled: SchoolRuleModulesEnabled = {}): DurationRule[] {
  const teacherDays = new Set(teacherDurationWeekdays(control));
  return Array.from({ length: 7 }, (_, day) => {
    const teacher = teacherDays.has(day);
    const rule = !teacher && enabled.duration === false ? undefined
      : control.durationRules.find(item => item.weekdays.includes(day) && (teacher ? item.source === 'homeroom' : true))
        ?? (teacher ? control.durationRules.find(item => item.weekdays.includes(day)) : undefined);
    if (!teacher && (!rule || rule.useDefault) && enabled.durationDefault !== true) return [];
    return [{ ...(rule ?? { ...defaultDurationRule, id: `default-${day}`, useDefault: true }), weekdays: [day] }];
  }).flat();
}

export function effectiveSchoolHomeworkPermission(control: StudentControl, enabled: SchoolRuleModulesEnabled = {}) {
  return control.homeworkSource === 'teacher' || enabled.homework !== false
    ? { answer: control.answer, explanation: control.explanation }
    : { answer: false, explanation: false };
}
