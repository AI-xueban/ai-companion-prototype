import { ControlModule, StudentControl } from './hierarchicalDeviceControl';
import { teacherDurationWeekdays } from './durationApplyScope';

/** School edits never replace a teacher's saved settings, including explicit defaults. */
export function preserveTeacherSettings(before: StudentControl, next: StudentControl, module: ControlModule): StudentControl {
  if (module === 'homework' && before.homeworkSource === 'teacher') return before;
  if (module === 'world' && before.worldSource === 'teacher') return before;
  if (module !== 'duration') return next;
  const days = new Set(teacherDurationWeekdays(before));
  if (!days.size) return next;
  if (days.size === 7) return before;
  return { ...next, durationTeacherWeekdays: [...days].sort((a, b) => a - b), durationRules: [
    ...next.durationRules.map(rule => ({ ...rule, weekdays: rule.weekdays.filter(day => !days.has(day)) })).filter(rule => rule.weekdays.length),
    ...before.durationRules.map(rule => ({ ...rule, weekdays: rule.weekdays.filter(day => days.has(day)) })).filter(rule => rule.weekdays.length),
  ] };
}
