import assert from 'node:assert/strict';
import { build } from 'esbuild';
const load = async path => {
  const result = await build({ entryPoints: [path], bundle: true, write: false, format: 'esm', platform: 'node' });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);
};
const { applySchoolDurationRule } = await load('components/Teacher/data/durationApplyScope.ts');
const { groupDurationRules, removeDurationRule } = await load('components/Teacher/data/durationRuleGroups.ts');
const { teacherMayModifyLock } = await load('components/Teacher/data/temporaryDeviceLock.ts');
const rule = { id: 'weekdays', source: 'school', weekdays: [0,1,2,3,4], useDefault: false, continuousMinutes: 40, restMinutes: 15, dailyMinutes: 120, periods: [] };
const weekend = { ...rule, id: 'weekend', weekdays: [5,6], continuousMinutes: 30, dailyMinutes: 90 };
const control = { schedules: [], durationRules: [rule, weekend], answer: false, explanation: false, world: true, locked: false, updated: {} };

// Editing a weekday subset must remove the old rule, not leave ghost weekdays behind.
const edited = applySchoolDurationRule(control, { ...rule, weekdays: [0,1], dailyMinutes: 100 }, 'all', rule);
assert.deepEqual(edited.durationRules.find(r => r.id === 'weekdays').weekdays, [0,1]);
assert.deepEqual(edited.durationRules.find(r => r.id === 'weekend'), weekend);
const fallback = groupDurationRules(['a'], { a: edited }).find(group => group.fallback);
assert.deepEqual(fallback.rule.weekdays, [2,3,4]);

// Adding an overlapping rule preserves every non-overlapping day.
const added = applySchoolDurationRule(control, { ...rule, id: 'wednesday', weekdays: [2], dailyMinutes: 80 }, 'all');
assert.deepEqual(added.durationRules.find(r => r.id === 'weekdays').weekdays, [0,1,3,4]);
assert.deepEqual(added.durationRules.find(r => r.id === 'weekend'), weekend);

// Equivalent configurations from separate saves form one editable group, while source stays distinct.
const b = { ...control, durationRules: [{ ...rule, id: 'independent-id' }, weekend] };
assert.equal(groupDurationRules(['a','b'], { a: control, b }).filter(group => !group.fallback).length, 2);
assert.deepEqual(removeDurationRule(b, rule).durationRules, [weekend]);
const teacherRule = { ...rule, id: 'teacher', source: 'homeroom' };
const teacher = { ...control, durationRules: [teacherRule, weekend], durationTeacherWeekdays: [0,1,2,3,4] };
assert.equal(groupDurationRules(['a','b'], { a: control, b: teacher }).filter(group => !group.fallback).length, 3);
assert.deepEqual(applySchoolDurationRule(teacher, { ...teacherRule, weekdays: [0,1], dailyMinutes: 80 }, 'unmodified', teacherRule), teacher);
assert.deepEqual(removeDurationRule(teacher, teacherRule).durationTeacherWeekdays, []);

// Local release restores teachers immediately despite an active school session.
const session = { active: true };
const locks = { school: { key: 'school', label: '全校', ids: ['still-locked'] } };
assert.equal(teacherMayModifyLock(session, locks, ['released']), true);
assert.equal(teacherMayModifyLock(session, locks, ['still-locked']), false);
assert.equal(teacherMayModifyLock(session, locks, ['released','still-locked']), false);
console.log('Duration rule CRUD, grouping, protected weekdays, and local lock release checks passed.');

// Admin grade policies are independent of homeroom/student effective settings.
const { importSchoolDurationPolicies, schoolDurationGroups, updateSchoolDurationPolicies } = await load('components/Teacher/data/schoolDurationPolicies.ts');
const students = [{ id: 'a', grade: 1 }, { id: 'b', grade: 1 }, { id: 'c', grade: 2 }];
const isolatedTeacherRule = { ...rule, source: 'homeroom', dailyMinutes: 55 };
const effective = { a: control, b: { ...control, durationRules: [isolatedTeacherRule] }, c: control };
const policies = importSchoolDurationPolicies(students, effective);
assert.equal(policies[1].some(r => r.source === 'homeroom'), false);
const beforeTeacherChange = schoolDurationGroups(['a', 'b'], policies[1]);
effective.a = { ...control, durationRules: [isolatedTeacherRule] };
assert.deepEqual(schoolDurationGroups(['a', 'b'], policies[1]), beforeTeacherChange);
const changedPolicies = updateSchoolDurationPolicies(policies, students, ['a', 'b'], { ...rule, dailyMinutes: 88 }, rule);
assert.equal(changedPolicies[1].find(r => r.id === rule.id).dailyMinutes, 88);
assert.deepEqual(changedPolicies[2], policies[2]);
const deletedPolicies = updateSchoolDurationPolicies(changedPolicies, students, ['a', 'b'], changedPolicies[1].find(r => r.id === rule.id), undefined, true);
assert.equal(schoolDurationGroups(['a', 'b'], deletedPolicies[1]).find(g => g.fallback).rule.weekdays.includes(0), true);
assert.deepEqual(effective.a.durationRules, [isolatedTeacherRule]);
console.log('school duration policies: migration, teacher isolation, grade edit/delete and default fallback passed');

const { applySchoolPolicyToStudent, removeSchoolPolicyFromStudent } = await load('components/Teacher/data/schoolDurationPolicies.ts');
const splitControl = { ...control, durationRules: [{ ...rule, weekdays: [0, 1] }, { ...isolatedTeacherRule, weekdays: [2, 3, 4] }] };
assert.deepEqual(removeSchoolPolicyFromStudent(splitControl, rule).durationRules, [{ ...isolatedTeacherRule, weekdays: [2, 3, 4] }]);
const splitEdited = applySchoolPolicyToStudent(splitControl, { ...rule, weekdays: [0], dailyMinutes: 77 }, 'unmodified', rule);
assert.equal(splitEdited.durationRules.some(r => r.source !== 'homeroom' && r.weekdays.includes(1)), false);
assert.equal(splitEdited.durationRules.find(r => r.source === 'homeroom').dailyMinutes, 55);
console.log('split school-rule edit/delete preserves teacher overrides');

const { validateDurationRuleSet } = await load('components/Teacher/data/durationRuleSets.ts');
const { applySchoolPolicySetToStudent, updateSchoolDurationPolicySet } = await load('components/Teacher/data/schoolDurationPolicies.ts');
const durationSet = [{ ...rule, id: 'set-a', weekdays: [0] }, { ...rule, id: 'set-b', weekdays: [1], dailyMinutes: 90 }];
assert.equal(validateDurationRuleSet(durationSet), '');
assert.match(validateDurationRuleSet([durationSet[0], { ...durationSet[1], weekdays: [0] }]), /只能设置在一组/);
assert.match(validateDurationRuleSet([{ ...durationSet[0], weekdays: [] }]), /至少选择/);
assert.match(validateDurationRuleSet([{ ...durationSet[0], dailyMinutes: 1 }]), /不能短于/);
const durationSetApplied = applySchoolPolicySetToStudent(control, durationSet, 'all', rule);
assert.equal(durationSetApplied.durationRules.find(r => r.id === 'set-a').dailyMinutes, rule.dailyMinutes);
assert.equal(durationSetApplied.durationRules.find(r => r.id === 'set-b').dailyMinutes, 90);
assert.deepEqual(durationSetApplied.durationRules.find(r => r.id === 'weekend'), weekend);
assert.equal(durationSetApplied.durationRules.some(r => r.weekdays.includes(2)), false);
const protectedDurationSet = applySchoolPolicySetToStudent({ ...control, durationRules: [{ ...rule, weekdays: [0, 1, 3, 4] }, { ...rule, id: 'teacher-day', source: 'homeroom', weekdays: [2], dailyMinutes: 66 }, weekend] }, [{ ...durationSet[0], weekdays: [0, 2] }, durationSet[1]], 'unmodified', rule);
assert.equal(protectedDurationSet.durationRules.find(r => r.id === 'teacher-day').dailyMinutes, 66);
const gradeSetPolicies = updateSchoolDurationPolicySet(policies, students, ['a', 'b'], durationSet, rule);
assert.equal(gradeSetPolicies[1].find(r => r.id === 'set-a').dailyMinutes, rule.dailyMinutes);
assert.equal(gradeSetPolicies[1].find(r => r.id === 'set-b').dailyMinutes, 90);
assert.deepEqual(gradeSetPolicies[2], policies[2]);
console.log('PASS grouped duration validation, independent day values, atomic set application, original replacement and protected teacher weekdays');

const { occupiedSchoolDurationDays } = await load('components/Teacher/data/schoolDurationPolicies.ts');
assert.deepEqual(occupiedSchoolDurationDays(policies, students, ['a', 'b']), [0,1,2,3,4,5,6]);
assert.deepEqual(occupiedSchoolDurationDays(policies, students, ['a', 'b'], rule), [5,6]);
assert.throws(() => updateSchoolDurationPolicySet(policies, students, ['a', 'b'], [{ ...rule, id: 'duplicate', weekdays: [0] }]), /已有使用时长规则/);
assert.throws(() => updateSchoolDurationPolicySet(policies, students, ['a', 'b'], [{ ...rule, weekdays: [0,5] }], rule), /已有使用时长规则/);
const afterDelete = updateSchoolDurationPolicies(policies, students, ['a', 'b'], rule, undefined, true);
assert.doesNotThrow(() => updateSchoolDurationPolicySet(afterDelete, students, ['a', 'b'], [{ ...rule, id: 'recreated' }]));
assert.throws(() => updateSchoolDurationPolicySet(afterDelete, students, ['a', 'c'], [{ ...rule, id: 'batch-duplicate' }]), /已有使用时长规则/);
console.log('PASS weekday uniqueness, edit exclusion, delete then recreate and atomic mixed-grade rejection');
