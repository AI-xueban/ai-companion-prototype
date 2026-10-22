import { readFileSync } from 'node:fs';
import { runInNewContext, Script } from 'node:vm';
import assert from 'node:assert/strict';

const html = readFileSync(new URL('./index.html', import.meta.url), 'utf8');
const inlineScripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)]
  .map(match => match[1]).filter(source => source.trim());
for (const source of inlineScripts) new Script(source);
const routingFunction = html.match(/    function startRequestedTeacherDemo\(\)\{[\s\S]*?\n    \}/)?.[0];
assert.ok(routingFunction, 'The actual URL routing function must exist');
const flows = ['first', 'returning', 'otherDevice', 'expired', 'replace'];
function route(search) {
  const calls = [];
  const context = {
    params: new URLSearchParams(search),
    teacherFlowSteps: Object.fromEntries(flows.map(name => [name, []])),
    startTeacherFlow: name => calls.push(['flow', name]),
    setTeacherAvailability: name => calls.push(['availability', name])
  };
  const result = runInNewContext(`${routingFunction}; startRequestedTeacherDemo()`, context);
  return { result, calls };
}
for (const flow of flows) {
  assert.deepEqual(route(`review=1&teacherScenario=${flow}`), { result: true, calls: [['flow', flow]] });
  assert.deepEqual(route(`teacherScenario=${flow}`), { result: false, calls: [] });
}
for (const state of ['normal', 'noClasses', 'noStudents', 'deleted']) {
  assert.deepEqual(route(`review=1&availability=${state}`), { result: true, calls: [['availability', state]] });
}
for (const query of ['review=1&teacherScenario=invalid', 'review=1&teacherScenario=toString', 'review=1&teacherScenario=constructor', 'review=1&availability=invalid', 'review=0&availability=deleted', 'page=parent&scenario=second']) {
  assert.deepEqual(route(query), { result: false, calls: [] });
}
assert.deepEqual(route('review=1&teacherScenario=first&availability=deleted'), { result: true, calls: [['flow', 'first']] });

// Exercise the actual unbind and startup handlers: failed verification retains
// access, successful unbinding revokes the session and must survive a reload.
const unbindFunction = html.match(/    function unbindTeacherWechat\(\)\{[\s\S]*?\n    \}/)?.[0];
const restoreFunction = html.match(/    function restoreDemoTeacherOnLaunch\(\)\{[^\n]+/)?.[0];
assert.ok(unbindFunction && restoreFunction);
const teacherStorage = new Map([
  ['ai_companion_demo_teacher_session', '{"userId":"teacher-demo-001","expiresAt":9999999999999}'],
  ['ai_companion_demo_teacher_wechat_binding', 'teacher-demo-001'],
  ['ai_companion_demo_parent_v2', 'parent-kept']
]);
let verificationPassword = 'wrong';
const securityError = { textContent: '' };
const securityContext = {
  document: { getElementById: id => id === 'teacher-reauth' ? { value: verificationPassword } : securityError },
  localStorage: { getItem: key => teacherStorage.get(key) ?? null, setItem: (key, value) => teacherStorage.set(key, value), removeItem: key => teacherStorage.delete(key) },
  teacherDemoSessionKey: 'ai_companion_demo_teacher_session', teacherManualLogoutKey: 'ai_companion_demo_teacher_manual_logout',
  demoTeacherWechatBound: true, teacherAgreementAccepted: true, teacherFirstSmsVerified: true,
  teacherPhoneFromWechat: true, teacherCodeSent: true, teacherPhoneSheetOpen: true,
  teacherQuickNotice: '', stage: 'teacherSecurity', teacherAvailability: 'normal',
  resetTeacherCodeCountdown() {}, go(next) { securityContext.stage = next; },
  history: { replaceState() {} }, location: { pathname: '/' },
  saveDemoTeacherSession() { throw Error('Unbinding must prevent session recreation'); }
};
runInNewContext(`${unbindFunction}; unbindTeacherWechat()`, securityContext);
assert.equal(securityContext.stage, 'teacherSecurity');
assert.equal(securityContext.demoTeacherWechatBound, true);
assert.ok(teacherStorage.has('ai_companion_demo_teacher_session'));
assert.match(securityError.textContent, /二次验证失败/);
verificationPassword = '123456';
runInNewContext('unbindTeacherWechat()', securityContext);
assert.equal(securityContext.stage, 'teacherLogin');
assert.equal(securityContext.demoTeacherWechatBound, false);
assert.equal(securityContext.teacherAgreementAccepted, false);
assert.equal(teacherStorage.has('ai_companion_demo_teacher_session'), false);
assert.equal(teacherStorage.has('ai_companion_demo_teacher_wechat_binding'), false);
assert.equal(teacherStorage.get('ai_companion_demo_teacher_manual_logout'), '1');
assert.equal(teacherStorage.get('ai_companion_demo_parent_v2'), 'parent-kept');
securityContext.stage = 'home';
runInNewContext(`${restoreFunction}; restoreDemoTeacherOnLaunch()`, securityContext);
assert.equal(securityContext.stage, 'teacherLogin');

const parentSource = readFileSync(new URL('./parent-prototype.js', import.meta.url), 'utf8')
  .replace('render, start, scenario,', 'inspect: () => JSON.parse(JSON.stringify(state)), render, start, scenario,');
const storage = new Map();
const context = {
  window: {}, app: { innerHTML: '' }, URLSearchParams, location: { search: '?review=1' },
  document: { getElementById: () => null, querySelector: () => null, querySelectorAll: () => [] },
  localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) },
  syncReview() {}, setTimeout: () => 1, clearTimeout() {}, setInterval: () => 1, clearInterval() {},
  learningPrototype: { resetDetail() {}, renderParent: () => '学习详情' },
  homeworkPrototype: { resetParentView() {}, getParentNavigation: () => ({ detail: false }), renderParent: () => '作业详情' },
  go() { context.window.parentPrototype.render(); }
};
runInNewContext(parentSource, context);
const parent = context.window.parentPrototype;
const parentScenarios = ['first', 'returning', 'duplicateScan', 'twoChildren', 'otherDevice', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'familyManage', 'ordinary', 'wrong', 'lostWechat', 'lostPhone', 'bothLost'];
for (const scenario of parentScenarios) {
  parent.scenario(scenario);
  assert.equal(parent.inspect().flow, scenario);
  assert.ok(context.app.innerHTML.length > 0);
  const baseline = JSON.stringify(parent.inspect());
  parent.input('phone', '13900139000');
  parent.input('code', '123456');
  parent.setAgreement(true);
  parent.restart();
  assert.equal(JSON.stringify(parent.inspect()), baseline, `${scenario} must restart at the same baseline`);
}
parent.scenario('seventh');
assert.equal(parent.inspect().families[0].members.length, 6);
assert.equal(parent.inspect().bound, false);
parent.scenario('first');
assert.equal(parent.inspect().bound, false);
assert.equal(parent.inspect().agreementAccepted, false);
assert.equal(parent.inspect().boundStudents.length, 0);
assert.equal(parent.inspect().families[0].members.length, 0);
console.log('Passed: inline JavaScript syntax; 5 teacher URL flows; 4 account states; review gating, invalid values and precedence; unbind verification, session revocation and reload; 17 parent scenario baselines and repeatable resets.');
