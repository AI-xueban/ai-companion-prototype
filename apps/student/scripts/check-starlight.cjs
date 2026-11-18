const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const file = path.resolve(__dirname, '../services/starlightLeague.ts');
const compiled = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const model = { exports: {} }; new Function('exports', 'module', 'require', compiled)(model.exports, model, require);
const { groupSizes, evaluateLeague, getVsSummary, createLeagueDemo, weekWindow, sumSettledXp, matchGrade } = model.exports;
let checks = 0;
function test(name, fn) { fn(); checks++; console.log('PASS', name); }
function members(scores, tiers = []) { return scores.map((xp, i) => ({ id: `m${i}`, name: `同学${i}`, xp, tier: tiers[i] ?? 2, avatar: '🙂', totalXp: 3000 - i * 50, minutes: [20, 0, 0, 0, 0, 0, 0], dailyXp: [xp, 0, 0, 0, 0, 0, 0] })); }
test('人数示例和浮动分组覆盖 0～300 人', () => {
  for (let n = 0; n <= 300; n++) { const groups = groupSizes(n); assert.equal(groups.reduce((a, b) => a + b, 0), n); if (n >= 8) { assert(groups.every(size => size >= 8 && size <= 15)); assert(Math.max(...groups) - Math.min(...groups) <= 1); } }
  assert.deepEqual(groupSizes(16), [8, 8]); assert.deepEqual(groupSizes(25), [13, 12]); assert.deepEqual(groupSizes(29), [15, 14]); assert.deepEqual(groupSizes(30), [10, 10, 10]);
});
test('晋级后不会按段位拆成停赛池', () => { const group = members([800, 700, 600, 500, 400, 300, 200, 100], [9, 2, 2, 2, 2, 2, 2, 2]); assert.equal(matchGrade(group).length, 1); assert.equal(matchGrade(group)[0].length, 8); });
test('最高段位不占名额', () => { const r = evaluateLeague(members([100, 90, 80, 70], [9, 2, 2, 2])); assert.equal(r.E, 3); assert.equal(r.K, 1); assert.deepEqual([...r.promoted], ['m1']); assert.equal(r.champion, 'm0'); });
test('完整同分批次可以晋级', () => { const r = evaluateLeague(members([100, 100, 60, 50, 40, 30, 20, 10])); assert.deepEqual([...r.promoted], ['m0', 'm1']); assert.equal(r.champion, null); assert.deepEqual(r.rows.slice(0, 3).map(m => m.rank), [1, 1, 3]); });
test('部分晋级、边界同分不递补', () => { const r = evaluateLeague(members([100, 90, 90, 80, 70, 60, 50, 40])); assert.equal(r.K, 2); assert.deepEqual([...r.promoted], ['m0']); assert(r.rows[1].reason.includes('同分')); });
test('全部同分、全零和单一正分不晋级', () => { for (const scores of [[10, 10, 10], [0, 0, 0], [100, 0, 0]]) { const r = evaluateLeague(members(scores)); assert.equal(r.promoted.size, 0); assert.equal(r.champion, null); assert(r.rows.every(m => m.nextTier >= m.tier)); } });
test('P 和 E 分离，冠军可有但无人晋级', () => { for (const tiers of [[9, 9], [9, 2]]) { const r = evaluateLeague(members([100, 90], tiers)); assert.equal(r.P, 2); assert.equal(r.promoted.size, 0); assert.equal(r.champion, 'm0'); } });
test('不同段位都可同时夺冠并晋级', () => { const r = evaluateLeague(members([100, 90, 0], [2, 3, 9])); assert.equal(r.champion, 'm0'); assert(r.promoted.has('m0')); assert.equal(r.rows[0].nextTier, 3); });
test('结算基于固定快照、顺序与重试不影响结果', () => { const input = members([100, 90, 80, 70], [8, 2, 2, 2]); const before = JSON.stringify(input); const a = evaluateLeague(input); const b = evaluateLeague([...input].reverse()); assert.equal(JSON.stringify(input), before); assert.deepEqual([...a.promoted], [...b.promoted]); assert.equal(evaluateLeague(input).rows[0].nextTier, 9); });
test('跨周按到账、半开区间且同一 ID 不重复', () => {
  const week = weekWindow(Date.parse('2026-11-04T12:00:00+08:00')); assert.equal(week.start, Date.parse('2026-11-02T00:00:00+08:00'));
  const rows = [{id:'old',settledAt:week.start-1,xp:20,status:'success'}, {id:'new',settledAt:week.start,xp:30,status:'success'}, {id:'new',settledAt:week.start+1,xp:30,status:'success'}, {id:'next',settledAt:week.end,xp:40,status:'success'}, {id:'pending',settledAt:week.start,xp:50,status:'pending'}];
  assert.equal(sumSettledXp(rows, week.start, week.end), 30);
});
test('VS 数据对应双方且仅白名单输出', () => {
  const s = createLeagueDemo('normal', '我', 2100, 3200, 'avatar', '2026-11-02'); const [me, peer] = getVsSummary(s, 'me', 'peer-0', s.seasonId);
  assert.notEqual(me.xp, peer.xp); assert.notDeepEqual(me.dailyXp, peer.dailyXp); assert.deepEqual(Object.keys(me).sort(), ['id','name','xp','minutes','days','dailyXp','dailyMinutes'].sort()); assert.equal(me.dailyXp.reduce((a,b)=>a+b), me.xp);
  assert.throws(() => getVsSummary(s, 'me', 'outside', s.seasonId)); assert.throws(() => getVsSummary(s, 'me', 'peer-0', 'next-week')); assert.throws(() => getVsSummary({...s, eligible:false}, 'me', 'peer-0', s.seasonId));
});
console.log(`星光学榜 ${checks} 组规则验证通过`);
