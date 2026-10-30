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
