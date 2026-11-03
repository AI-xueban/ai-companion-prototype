import fs from 'node:fs';
import assert from 'node:assert/strict';
import ts from 'typescript';

const memory = new Map();
globalThis.localStorage = {
  getItem: key => memory.get(key) ?? null,
  setItem: (key, value) => memory.set(key, value),
  removeItem: key => memory.delete(key),
};
const root = new URL('../', import.meta.url);
const read = path => fs.readFileSync(new URL(path, root), 'utf8');
async function load(source) {
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  return import('data:text/javascript;base64,' + Buffer.from(compiled).toString('base64'));
}
const service = await load(read('types/reward.ts') + '\n' + read('services/rewardService.ts').replace(/import\s*\{[\s\S]*?from '\.\.\/types\/reward';/, ''));
const history = await load(read('services/rewardHistoryService.ts').replace(/import type[^;]*;/g, ''));
const quiz = (id, count = 5, difficulty = 3, times) => service.grantQuizSessionReward({ sessionId: id, quizSetId: id, correctCount: count, totalCount: count, questions: Array.from({ length: count }, () => ({ difficulty, isCorrect: true })), questionTimesSec: times });

for (const [level, expected] of [[1, 48], [2, 60], [3, 72], [4, 90], [5, 120]]) {
  service.resetRewardLedgerForDemo();
  const result = quiz('difficulty-' + level, 5, level);
  assert.equal(result.xp, expected);
  assert.equal(result.xpBreakdown.reduce((sum, item) => sum + item.value, 0), result.xp);
}
service.resetRewardLedgerForDemo();
let result = quiz('repeat');
assert.equal(result.coins, 20);
assert.equal(quiz('repeat').coins, 0);
assert.equal(quiz('repeat').xp, 36);

for (const times of [[1, 2, 3, 6, 7], [0, 0, 0, 0, 0], [6, 6, 6, 6, 6]]) {
  service.resetRewardLedgerForDemo();
  result = quiz('fast-answer', 5, 3, times);
  assert.notEqual(result.invalidLearning, true);
  assert.equal(result.xp, 72);
  assert.equal(result.coins, 20);
  assert.equal(quiz('fast-answer', 5, 3, times).coins, 0);
}

service.resetRewardLedgerForDemo();
quiz('large', 67);
assert.equal(service.getCoinsToday(), 144);
result = quiz('cap', 10);
assert.equal(result.coins, 6);
assert.equal(result.coinsToday, 150);
assert.ok(result.skippedReasons.some(reason => reason.includes('未发放')));
assert.equal(quiz('after-cap').coins, 0);
assert.ok(quiz('unlimited-xp', 200).xp > 2000);

service.resetRewardLedgerForDemo();
assert.equal(service.grantMoodCheckInReward().xp, 20);
assert.equal(service.grantMoodCheckInReward().xp, 0);
assert.equal(service.grantKnowledgePointReward('knowledge-one').xp, 50);
assert.equal(service.grantKnowledgePointReward('knowledge-one').xp, 0);
assert.equal(service.grantVariantCorrectionReward('wrong-one'), undefined);
assert.equal(service.grantWrongReviewReward('wrong-one').xp, 5);
assert.equal(service.grantWrongReviewReward('wrong-one'), undefined);
assert.equal(service.grantVariantCorrectionReward('wrong-one').coins, 10);
assert.equal(service.grantVariantCorrectionReward('wrong-one'), undefined);
const batch = service.grantQuizSessionReward({ sessionId: 'batch', quizSetId: 'batch', isWrongPractice: true, totalCount: 1, correctCount: 1, questions: [{ questionId: 'old-wrong', difficulty: 3, isCorrect: true }] });
assert.equal(batch.xp, 32);
assert.equal(batch.coins, 7);
assert.ok(!batch.coinBreakdown.some(item => item.scene === 'daily_conquer'));
const failedConquer = service.grantQuizSessionReward({ sessionId: 'conquer', quizSetId: 'conquer', isDailyConquer: true, totalCount: 2, correctCount: 1, questions: [{ questionId: 'wrong-two', isCorrect: true }, { questionId: 'wrong-three', isCorrect: false }] });
assert.ok(!failedConquer.coinBreakdown.some(item => item.scene === 'daily_conquer'));
for (const taskId of ['a', 'b', 'c']) result = service.grantTaskCompleteReward({ taskId, isPerfect: true, dayPlanTaskIds: ['a', 'b', 'c'] });
assert.equal(result.xp, 200);
assert.equal(result.coins, 0);
assert.equal(service.grantTaskCompleteReward({ taskId: 'c' }).xp, 0);
const extra = service.grantQuizSessionReward({ sessionId: 'fourth', quizSetId: 'fourth', taskId: 'fourth', isDailyTask: true, totalCount: 5, correctCount: 5, questions: Array.from({ length: 5 }, () => ({ difficulty: 3, isCorrect: true })) });
assert.equal(extra.coins, 0);
assert.equal(extra.xp, 36);

assert.equal(history.recordReward(result), true);
assert.equal(history.recordReward(result), false);
history.recordCoinSpend(100, '爱心捐赠');
assert.equal(history.getRewardHistory().length, 2);
assert.equal(history.getRewardHistory()[0].coins, -100);
assert.equal(history.getRewardHistory()[1].result.ruleVersion, 'final-2026-10');
service.resetRewardLedgerForDemo();
assert.equal(service.grantWelcomeGift().coins, 150);
assert.equal(service.grantWelcomeGift().coins, 0);
console.log('PASS: difficulty, breakdown totals, repeats, fast-answer rewards, daily cap truncation, uncapped XP, daily rewards, extra tasks, persistent receipts and spend records.');
