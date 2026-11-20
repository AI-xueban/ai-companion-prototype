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
const reviewUi = Object.fromEntries(['parent-review-context','parent-review-steps','parent-review-actions','parent-review-detail'].map(id => [id, { innerHTML: '' }]));
const context = {
  window: {}, app: { innerHTML: '' }, URLSearchParams, location: { search: '?review=1' },
  document: { getElementById: id => reviewUi[id] ?? null, querySelector: () => null, querySelectorAll: () => [] },
  localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) },
  syncReview() {}, setTimeout: () => 1, clearTimeout() {}, setInterval: () => 1, clearInterval() {},
  learningPrototype: { resetDetail() {}, renderParent: () => '学习详情' },
  homeworkPrototype: { resetParentView() {}, getParentNavigation: () => ({ detail: false }), renderParent: () => '作业详情' },
  go() { context.window.parentPrototype.render(); }
};
runInNewContext(parentSource, context);
const parent = context.window.parentPrototype;
const parentScenarios = ['first', 'wechatScan', 'returning', 'duplicateScan', 'twoChildren', 'otherDevice', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'familyManage', 'ordinary', 'wrong', 'lostWechat', 'lostPhone', 'bothLost'];
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
parent.scenario('lostWechat');
parent.setAgreement(true);
parent.action('recover');
assert.equal(parent.inspect().view, 'recoveryIssues');
assert.match(context.app.innerHTML, /遇到了什么问题/);
assert.match(context.app.innerHTML, /原微信和原手机号都无法使用/);
parent.action('recoveryPhone');
assert.equal(parent.inspect().view, 'phone');
assert.match(context.app.innerHTML, /验证原绑定手机号/);
assert.doesNotMatch(context.app.innerHTML, /同意用户协议和隐私政策/);
parent.fillDemo('phone');
parent.action('sendCode');
parent.fillDemo('code');
parent.action('verifyPhone');
assert.equal(parent.inspect().view, 'newWechat');
assert.doesNotMatch(context.app.innerHTML, /parent-recovery-background|parent-recovery-mask/);
assert.match(context.app.innerHTML, /确认使用当前微信/);
parent.action('replaceWechat');
assert.equal(parent.inspect().view, 'home');
assert.equal(parent.inspect().boundStudents.length, 1);
parent.scenario('bothLost');
parent.setAgreement(true);
parent.action('recover');
parent.action('schoolHelp');
assert.equal(parent.inspect().view, 'schoolHelp');
assert.doesNotMatch(context.app.innerHTML, /parent-phone|parent-code/);
parent.back();
assert.equal(parent.inspect().view, 'recoveryIssues');
parent.scenario('lostPhone');
parent.action('recover');
parent.action('lostPhoneHelp');
assert.match(context.app.innerHTML, /我的 → 账号与安全 → 更换手机号/);
parent.action('quick');
assert.equal(parent.inspect().view, 'home');
const scheduled = [];
context.setTimeout = callback => { scheduled.push(callback); return scheduled.length; };
parent.scenario('first');
parent.setAgreement(true);
parent.action('scanResult');
assert.equal(parent.inspect().view, 'confirm');
parent.action('confirm');
assert.equal(parent.inspect().view, 'firstGuardianForm');
assert.equal(parent.inspect().families[0].members.length, 0);
parent.action('submitFirstGuardian');
assert.match(context.app.innerHTML, /请填写本人姓名/);
parent.familyInput('name', '王女士');
parent.action('submitFirstGuardian');
assert.match(context.app.innerHTML, /请选择或填写与孩子的关系/);
parent.familyInput('relationChoice', '妈妈');
parent.back();
assert.equal(parent.inspect().view, 'confirm');
parent.action('confirm');
assert.equal(parent.inspect().applicantName, '王女士');
assert.equal(parent.inspect().applicantRelation, '妈妈');
parent.action('submitFirstGuardian');
assert.equal(parent.inspect().view, 'binding');
assert.equal(parent.inspect().families[0].members.length, 0);
scheduled.shift()();
assert.equal(parent.inspect().view, 'bindSuccess');
assert.equal(parent.inspect().families[0].members[0].name, '王女士');
assert.equal(parent.inspect().families[0].members[0].relation, '妈妈');
scheduled.shift()();
assert.equal(parent.inspect().view, 'home');
parent.scenario('invitationJourney');
assert.equal(parent.inspect().view, 'home');
assert.equal(parent.inspect().homeTab, 'mine');
assert.match(context.app.innerHTML, /我的孩子/);
assert.doesNotMatch(context.app.innerHTML, /parent-child-invite|inviteChild/);
parent.openChildDetail(0);
assert.equal(parent.inspect().view, 'childDetail');
assert.match(context.app.innerHTML, /<h2 class="wx-title" title="家长管理">家长管理<\/h2>/);
assert.doesNotMatch(context.app.innerHTML, /A 手机 · 主管理家长|B 手机 · 受邀家长|原型演示 · 角色切换/);
assert.match(reviewUi['parent-review-context'].innerHTML, /A 手机 · 主管理家长/);
parent.action('invite');
assert.equal(parent.inspect().view, 'familyManage');
assert.equal(parent.inspect().inviteConfirmOpen, true);
assert.match(context.app.innerHTML, /确认邀请家长绑定/);
assert.match(context.app.innerHTML, /邀请并分享/);
assert.doesNotMatch(context.app.innerHTML, /生成微信邀请卡片|微信分享示意/);
parent.action('cancelInvite');
assert.equal(parent.inspect().inviteConfirmOpen, false);
assert.equal(parent.inspect().inviteShareStarted, false);
parent.action('invite');
parent.action('requestInviteShare');
assert.equal(parent.inspect().view, 'familyManage');
assert.equal(parent.inspect().inviteConfirmOpen, false);
assert.equal(parent.inspect().inviteShareStarted, true);
assert.doesNotMatch(context.app.innerHTML, /分享家长邀请|邀请卡片已分享|微信分享示意/);
assert.doesNotMatch(context.app.innerHTML, /切换到 B 手机 · 打开邀请/);
assert.match(reviewUi['parent-review-actions'].innerHTML, /切换到 B 手机 · 打开邀请/);
parent.action('openInviteLink');
assert.equal(parent.inspect().view, 'inviteLanding');
assert.equal(parent.inspect().bound, false);
assert.doesNotMatch(context.app.innerHTML, /B 手机 · 受邀家长/);
assert.match(reviewUi['parent-review-context'].innerHTML, /B 手机 · 受邀家长/);
assert.match(context.app.innerHTML, /接受邀请，申请绑定/);
assert.doesNotMatch(context.app.innerHTML, /接受邀请后仍需审核|以本人微信填写姓名和与孩子的关系/);
parent.action('beginRequest');
parent.familyInput('name', '陈女士');
parent.familyInput('relationChoice', '妈妈');
parent.action('submitFamilyRequest');
parent.setAgreement(true);
parent.action('skipPhone');
assert.equal(parent.inspect().view, 'pending');
assert.equal(parent.inspect().families[0].members.some(member => member.name === '陈女士'), false);
assert.doesNotMatch(context.app.innerHTML, /模拟 A 点击绑定申请通知/);
assert.match(reviewUi['parent-review-actions'].innerHTML, /模拟 A 点击绑定申请通知/);
parent.action('openManagerRequestNoticeForDemo');
assert.equal(parent.inspect().view, 'inviter');
assert.match(context.app.innerHTML, /陈女士/);
assert.match(context.app.innerHTML, /同意绑定|拒绝申请/);
parent.action('approve');
assert.equal(parent.inspect().families[0].members.some(member => member.name === '陈女士'), true);
assert.doesNotMatch(context.app.innerHTML, /模拟 B 点击绑定成功通知/);
assert.match(reviewUi['parent-review-actions'].innerHTML, /模拟 B 点击绑定成功通知/);
parent.action('switchRecipientForDemo');
assert.equal(parent.inspect().view, 'pending');
parent.action('home');
assert.equal(parent.inspect().view, 'home');
parent.scenario('invitationJourney');
assert.equal(parent.inspect().view, 'home');
parent.openChildDetail(0);
parent.action('invite');
parent.action('requestInviteShare');
parent.action('openInviteLink');
parent.action('beginRequest');
parent.familyInput('name', '周先生');
parent.familyInput('relationChoice', '爸爸');
parent.action('submitFamilyRequest');
parent.setAgreement(true);
parent.action('skipPhone');
parent.action('openManagerRequestNoticeForDemo');
assert.equal(parent.inspect().view, 'inviter');
parent.action('reject');
assert.equal(parent.inspect().families[0].members.some(member => member.name === '周先生'), false);
assert.match(reviewUi['parent-review-actions'].innerHTML, /模拟 B 点击申请拒绝通知/);
parent.action('openRejectionNoticeForDemo');
assert.equal(parent.inspect().view, 'pending');
assert.match(context.app.innerHTML, /申请未通过/);
assert.doesNotMatch(context.app.innerHTML, /进入家长首页/);
console.log('Passed: inline JavaScript syntax; 5 teacher URL flows; 4 account states; review gating, invalid values and precedence; unbind verification, session revocation and reload; 18 parent scenario baselines and repeatable resets; 3 parent recovery solutions and return paths; first guardian identity before binding; invitation link to approval and access.');
