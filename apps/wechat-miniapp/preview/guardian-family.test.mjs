import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import assert from 'node:assert/strict';

// Exercise the real prototype controller without a browser or external services.
const source = readFileSync(new URL('./parent-prototype.js', import.meta.url), 'utf8')
  .replace('return { render, start, scenario,', 'return { inspect: () => JSON.parse(JSON.stringify(state)), render, start, scenario,');
function create(storage = new Map()) {
  const context = {
    window: {}, app: { innerHTML: '' }, URLSearchParams, location: { search: '?review=1' },
    document: { getElementById: () => null, querySelectorAll: () => [] },
    localStorage: { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) },
    syncReview() {}, setTimeout: () => 1, clearTimeout() {}, setInterval: () => 1, clearInterval() {},
    learningPrototype: { resetDetail() {}, renderParent: () => '学习详情' },
    homeworkPrototype: { resetParentView() {}, getParentNavigation: () => ({ detail: false }), renderParent: () => '作业详情' },
    go() { context.window.parentPrototype.render(); }
  };
  runInNewContext(source, context);
  const controller = context.window.parentPrototype;
  return { p: controller, state: () => controller.inspect(), html: () => context.app.innerHTML, storage };
}
function submit(demo, scenario = 'second') {
  const { p } = demo;
  if (scenario) p.scenario(scenario);
  p.action('beginRequest');
  p.familyInput('name', '王女士');
  p.action('submitFamilyRequest');
  const usedPhones=demo.state().families[0].members.map(m=>m.phone);
  p.input('phone', ['13900139000','13600136000','13500135000','13400134000','13300133000','13200132000'].find(phone=>!usedPhones.includes(phone)));
  p.action('sendCode');
  p.input('code', '123456');
  p.action('verifyPhone');
  assert.equal(demo.state().request, 'pending');
  assert.equal(demo.state().bound, false);
  assert.match(demo.html(), /等待主管理家长审核/);
}

for (const [scenario, count] of [['second', 2], ['third', 3], ['fourth', 4], ['fifth', 5], ['sixth', 6]]) {
  const demo = create();
  submit(demo, scenario);
  demo.p.action('home');
  assert.equal(demo.state().view, 'pending', 'Pending applicant must not access learning data');
  demo.p.familyReview('manager');
  demo.p.action('approve');
  assert.equal(demo.state().families[0].members.length, count);
  assert.equal(demo.state().currentId, 'owner', 'Approval keeps the manager signed in');
  demo.p.action('approve');
  assert.equal(demo.state().families[0].members.length, count, 'Duplicate approval must not add a slot');
  demo.p.familyReview('recipient');
  assert.equal(demo.state().bound, true);
  demo.p.action('home');
  assert.equal(demo.state().view, 'home');
  demo.p.familyReview('manager');
  demo.p.familySelect(demo.state().families[0].application.id, 'remove');
  assert.equal(demo.state().view, 'removeConfirm');
  demo.p.action('removeMember');
  assert.equal(demo.state().families[0].members.length, count - 1);
  demo.p.familyReview('recipient');
  assert.equal(demo.state().bound, false);
  assert.match(demo.html(), /绑定已解除/);
  demo.p.action('home');
  assert.equal(demo.state().view, 'pending');
}

for (const outcome of ['reject', 'cancelRequest', 'revokeInvite']) {
  const demo = create();
  submit(demo);
  if (outcome !== 'cancelRequest') demo.p.familyReview('manager');
  demo.p.action(outcome);
  if (outcome !== 'cancelRequest') demo.p.familyReview('recipient');
  assert.equal(demo.state().bound, false);
  assert.equal(demo.state().families[0].members.length, 1);
  demo.p.action('home');
  assert.notEqual(demo.state().view, 'home');
}

{
  const demo = create();
  submit(demo, 'sixth');
  demo.p.familyReview('manager');
  demo.p.action('inviter');
  demo.p.exception('slotTaken');
  demo.p.action('approve');
  assert.equal(demo.state().families[0].application.status, 'full');
  assert.equal(demo.state().families[0].members.length, 6);
  demo.p.familyReview('recipient');
  assert.equal(demo.state().bound, false, 'Losing the last slot must not grant access');
}
{
  const demo=create();
  demo.p.scenario('sixth'); demo.p.familyReview('manager');
  demo.p.action('invite'); demo.p.action('shareInvite'); demo.p.familyReview('newRecipient');
  submit(demo,null);
  const first=demo.state().currentId;
  demo.p.familyReview('manager');
  demo.p.action('invite'); demo.p.action('shareInvite'); demo.p.familyReview('newRecipient');
  submit(demo,null);
  const second=demo.state().currentId;
  demo.p.familyReview('manager'); demo.p.action('inviter');
  assert.match(demo.html(), /待审核申请 2 条/);
  demo.p.familySelectRequest(first); demo.p.action('approve');
  demo.p.familySelectRequest(second); demo.p.action('approve');
  assert.equal(demo.state().families[0].applications[first].status,'approved');
  assert.equal(demo.state().families[0].applications[second].status,'full');
  assert.equal(demo.state().families[0].members.length,6,'Concurrent requests cannot exceed capacity');
}
for (const exception of ['expiredInvite', 'revokedInvite', 'full']) {
  const demo = create();
  demo.p.scenario('second');
  demo.p.exception(exception);
  demo.p.action('beginRequest');
  assert.notEqual(demo.state().view, 'requestForm');
}

{
  const demo = create();
  demo.p.scenario('ordinary');
  assert.doesNotMatch(demo.html(), /class="family-remove"/);
  demo.p.action('invite');
  assert.match(demo.html(), /只有主管理家长/);
  demo.p.familySelect('owner', 'remove');
  assert.notEqual(demo.state().view, 'removeConfirm');
  demo.p.action('unbindConfirm');
  demo.p.action('unbind');
  assert.equal(demo.state().bound, false);
  assert.equal(demo.state().families[0].members.length, 1);
}
{
  const demo = create();
  demo.p.scenario('familyManage');
  demo.p.action('unbindConfirm');
  assert.equal(demo.state().view,'transfer');
  assert.match(demo.html(), /选择接任家长/);
  demo.p.action('familyManage');
  demo.p.familySelect('member2', 'transfer');
  assert.equal(demo.state().families[0].primaryId, 'member2', 'Selection transfers immediately without confirmation');
  assert.equal(demo.state().view,'familyManage');
  assert.doesNotMatch(demo.html(), /class="family-remove"/);
  demo.p.action('invite');
  assert.match(demo.html(), /只有主管理家长/);
}
{
  const demo = create();
  submit(demo);
  const restored = create(demo.storage);
  restored.p.start();
  assert.equal(restored.state().view, 'pending', 'Reload preserves a pending application');
  restored.p.familyReview('manager');
  restored.p.action('approve');
  assert.equal(restored.state().families[0].members.length, 2);
}
{
  const demo = create();
  demo.p.scenario('twoChildren');
  demo.p.openChildDetail(0);
  demo.p.action('invite');
  demo.p.action('shareInvite');
  demo.p.familyReview('newRecipient');
  submit(demo, null);
  demo.p.familyReview('manager');
  demo.p.action('approve');
  assert.equal(demo.state().families[0].members.length, 2);
  assert.equal(demo.state().families[1].members.length, 1, 'Each child has an independent family');
}
{
  const demo = create();
  demo.p.scenario('first');
  demo.p.action('scanResult');
  demo.p.action('confirm');
  demo.p.input('phone', '13800138000');
  demo.p.action('sendCode');
  demo.p.input('code', '123456');
  demo.p.action('verifyPhone');
  assert.equal(demo.state().view, 'bindSuccess');
  assert.equal(demo.state().families[0].primaryId, 'owner');
}
{
  const demo=create();
  demo.p.scenario('familyManage');
  demo.p.action('unbindConfirm');
  demo.p.familySelect('member3','transfer');
  assert.equal(demo.state().families[0].primaryId,'member3');
  assert.equal(demo.state().families[0].members.some(m=>m.id==='owner'),false);
  assert.equal(demo.state().bound,false,'Selecting a successor completes the manager exit');
}
{
  const demo=create();
  demo.p.scenario('ordinary');
  demo.p.familyReview('manager');
  demo.p.action('unbindConfirm');
  assert.equal(demo.state().view,'unbindConfirm');
  assert.match(demo.html(),/王女士将自动成为主管理家长/);
  demo.p.action('unbind');
  assert.equal(demo.state().families[0].primaryId,'member2');
  assert.equal(demo.state().families[0].members.length,1);
  demo.p.familyReview('manager');
  assert.match(demo.html(),/你自动担任主管理家长/);
  demo.p.action('unbindConfirm');
  assert.match(demo.html(),/最后一位绑定家长/);
  demo.p.action('unbind');
  assert.equal(demo.state().families[0].primaryId,'');
  assert.equal(demo.state().families[0].members.length,0);
  assert.equal(demo.state().bound,false);
}
{
  const demo=create();
  demo.p.scenario('ordinary');
  const key='ai_companion_demo_parent_v2';
  const saved=JSON.parse(demo.storage.get(key));
  saved.families[0].members=saved.families[0].members.filter(m=>m.id==='member2');
  saved.families[0].primaryId='unavailable';
  demo.storage.set(key,JSON.stringify(saved));
  const restored=create(demo.storage);
  restored.p.start();
  assert.equal(restored.state().families[0].primaryId,'member2','A sole remaining guardian automatically manages the child');
}
{
  const demo=create();
  demo.p.scenario('familyManage');
  demo.p.action('unbindConfirm');
  demo.p.action('familyManage');
  assert.equal(demo.state().families[0].members.length,3,'Cancelling successor selection preserves binding');
  assert.equal(demo.state().families[0].primaryId,'owner');
}
console.log('Passed: 6-person capacity, direct transfer, sole guardian promotion, manager exit with one/many/no successors, cancellation, persistence, and existing invitation/approval/access flows.');
