import assert from 'node:assert/strict';
import { build } from 'esbuild';

const result = await build({ entryPoints: ['components/Teacher/data/hierarchicalDeviceControl.ts'], bundle: true, write: false, format: 'esm', platform: 'node' });
const { policyDisplaySignature, policySignature } = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);
const original = { schedules: [], durationRules: [], answer: true, explanation: true, world: true, locked: false, homeworkSource: 'school', updated: {}, revisions: {} };
const samePermissions = { ...original, homeworkSource: 'teacher', revisions: { homework: 2 }, updated: { homework: { by: 'another operator', at: 'later' } } };
assert.equal(policyDisplaySignature(original, 'homework'), policyDisplaySignature(samePermissions, 'homework'), 'Equal permissions must display as equal despite source, version, or history.');
assert.notEqual(policySignature(original, 'homework'), policySignature(samePermissions, 'homework'), 'Concurrent changes must still invalidate an open editor.');
for (const field of ['answer', 'explanation']) {
  assert.notEqual(policyDisplaySignature(original, 'homework'), policyDisplaySignature({ ...original, [field]: false }, 'homework'), `${field} changes must remain visible.`);
}
const reverted = { ...original, revisions: { homework: 3 } };
assert.equal(policyDisplaySignature(original, 'homework'), policyDisplaySignature(reverted, 'homework'));
assert.notEqual(policySignature(original, 'homework'), policySignature(reverted, 'homework'), 'A change followed by a revert remains a concurrency conflict.');
console.log('PASS permission display equality and independent save-version conflict checks');
