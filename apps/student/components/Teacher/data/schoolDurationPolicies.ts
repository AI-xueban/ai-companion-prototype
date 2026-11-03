import { DeviceStudent, DurationRule, StudentControl } from './hierarchicalDeviceControl';
import { DurationRuleGroup, durationRuleKey, groupDurationRules } from './durationRuleGroups';
import { applySchoolDurationRule, DurationApplyScope, teacherDurationWeekdays } from './durationApplyScope';

const emptyControl: StudentControl = { schedules: [], durationRules: [], answer: false, explanation: false, world: true, locked: false, updated: {} };

export type SchoolDurationPolicies = Record<string, DurationRule[]>;

// Default fallback is not a saved rule. Editing releases only the original rule's days.
export function occupiedSchoolDurationDays(policies: SchoolDurationPolicies, students: DeviceStudent[], ids: string[], original?: DurationRule): number[] {
  const selected = new Set(ids);
  const grades = new Set(students.filter(student => selected.has(student.id)).map(student => student.grade));
  return [...new Set([...grades].flatMap(grade => (policies[grade] ?? [])
    .filter(rule => !original || durationRuleKey(rule) !== durationRuleKey(original))
    .flatMap(rule => rule.weekdays)))].sort((a, b) => a - b);
}

export function removeSchoolPolicyFromStudent(control: StudentControl, original: DurationRule, scope: DurationApplyScope = 'all'): StudentControl {
  const protectedDays = scope === 'unmodified' ? teacherDurationWeekdays(control) : [];
  return { ...control, durationRules: control.durationRules.flatMap(existing => {
    // Keeping teacher settings can split a school rule into fewer weekdays.
    if (existing.source === 'homeroom' || durationRuleKey({ ...existing, weekdays: original.weekdays }) !== durationRuleKey(original)) return [existing];
    const remaining = existing.weekdays.filter(day => !original.weekdays.includes(day) || protectedDays.includes(day));
    return remaining.length ? [{ ...existing, weekdays: remaining }] : [];
  }) };
}

export function applySchoolPolicyToStudent(control: StudentControl, rule: DurationRule, scope: DurationApplyScope, original?: DurationRule): StudentControl {
  return applySchoolDurationRule(original ? removeSchoolPolicyFromStudent(control, original, scope) : control, rule, scope);
}

// One-time import of identifiable school rules from the old student-only storage.
// Never import homeroom rules or continuously reconcile against student settings.
export function importSchoolDurationPolicies(students: DeviceStudent[], controls: Record<string, StudentControl>): SchoolDurationPolicies {
  const result: SchoolDurationPolicies = {};
  for (const student of students) {
    const rules = result[student.grade] ?? (result[student.grade] = []);
    for (const rule of controls[student.id]?.durationRules ?? []) {
      if (rule.source !== 'homeroom' && !rules.some(existing => durationRuleKey(existing) === durationRuleKey(rule))) {
        rules.push({ ...rule, source: 'school', weekdays: [...rule.weekdays], periods: rule.periods.map(period => ({ ...period })) });
      }
    }
  }
  return result;
}

export function schoolDurationGroups(ids: string[], rules: DurationRule[]): DurationRuleGroup[] {
  if (!ids.length) return [];
  const base = emptyControl;
  return groupDurationRules(['school-policy'], { 'school-policy': { ...base, durationRules: rules } })
    .map(group => ({ ...group, ids: [...ids] }));
}

export function updateSchoolDurationPolicies(policies: SchoolDurationPolicies, students: DeviceStudent[], ids: string[], rule: DurationRule, original?: DurationRule, remove = false): SchoolDurationPolicies {
  const selected = new Set(ids);
  const grades = new Set(students.filter(student => selected.has(student.id)).map(student => student.grade));
  const next = { ...policies };
  const base = emptyControl;
  for (const grade of grades) {
    const current = policies[grade] ?? [];
    next[grade] = remove
      ? current.filter(existing => durationRuleKey(existing) !== durationRuleKey(rule))
      : applySchoolDurationRule({ ...base, durationRules: current }, rule, 'all', original).durationRules;
  }
  return next;
}

// A submitted set is applied together; the edited original is removed only once.
export function applySchoolPolicySetToStudent(control: StudentControl, rules: DurationRule[], scope: DurationApplyScope, original?: DurationRule): StudentControl {
  return rules.reduce((current, rule, index) => applySchoolPolicyToStudent(current, rule, scope, index === 0 ? original : undefined), control);
}
export function updateSchoolDurationPolicySet(policies: SchoolDurationPolicies, students: DeviceStudent[], ids: string[], rules: DurationRule[], original?: DurationRule): SchoolDurationPolicies {
  const occupied = occupiedSchoolDurationDays(policies, students, ids, original);
  if (rules.some(rule => rule.weekdays.some(day => occupied.includes(day)))) throw new Error('所选星期已有使用时长规则，请修改已有规则或删除后再新增');
  return rules.reduce((current, rule, index) => updateSchoolDurationPolicies(current, students, ids, rule, index === 0 ? original : undefined), policies);
}
