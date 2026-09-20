const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const context = vm.createContext({
  data: {
    donations: [
      { id: 'D1', studentId: 'U1', coins: 100, donatedAt: '2026-06-01 00:00:00', fundedProject: 'A' },
      { id: 'D2', studentId: 'U1', coins: 200, donatedAt: '2026-06-30 23:59:59', fundedProject: 'B' },
      { id: 'D3', studentId: 'U2', coins: 50, donatedAt: '2026-07-01 00:00:00', fundedProject: 'A' },
    ],
    loveMonthlyReports: [],
    loveLedger: [
      { id: 'L1', type: 'donate', summary: 'D1', coins: 100, amountYuan: 1, balanceYuan: 1, createdAt: '2026-06-01 00:00:00' },
      { id: 'L2', type: 'donate', summary: 'D2', coins: 200, amountYuan: 2, balanceYuan: 3, createdAt: '2026-06-30 23:59:59' },
      { id: 'L3', type: 'payout', summary: '公益支出', amountYuan: 1, balanceYuan: 2, createdAt: '2026-08-15 10:00:00' },
      { id: 'L4', type: 'donate', summary: '学生捐赠', amountYuan: 2, balanceYuan: 4, createdAt: '2026-09-01 10:00:00' },
      { id: 'L5', type: 'match', summary: '平台配套', amountYuan: 1, balanceYuan: 5, createdAt: '2026-09-02 10:00:00' },
    ],
  },
  saveData() {}, navigate() {}, toast() {},
  esc: value => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'),
});
const source = fs.readFileSync(path.join(__dirname, '../prototype/assets/js/mall-pages.js'), 'utf8');
vm.runInContext(source, context);
vm.runInContext("mallTodayYmd = () => '2026-09-16';", context);
const run = code => vm.runInContext(code, context);

run('ensureMallMonthlyRecords()');
assert.equal(run('data.loveMonthlyReports.length'), 3);
assert.equal(run("data.loveMonthlyReports.find(r => r.month === '2026-06').donateCoins"), 300);
assert.equal(run("data.loveMonthlyReports.find(r => r.month === '2026-06').participants"), 1);
assert.equal(run("data.loveMonthlyReports.find(r => r.month === '2026-07').donateCoins"), 50);
assert.equal(run("data.loveMonthlyReports.find(r => r.month === '2026-08').donateCoins"), 0);
run('ensureMallMonthlyRecords()');
assert.equal(run('data.loveMonthlyReports.length'), 3);
assert.equal(run("mallMonthlyPeriod('2024-02')"), '2024-02-01 — 2024-02-29');

assert.equal(run('getMallLedgerRows().length'), 4);
assert.equal(run('getMallLedgerSummary().opening'), 2);
assert.equal(run('getMallLedgerSummary().incoming'), 2);
assert.equal(run('getMallLedgerSummary().ending'), 4);
run("mallPageState.ledgerType = 'payout'");
assert.equal(run('filterMallLedger().length'), 1);
run("mallPageState.ledgerType = 'all'; mallPageState.keyword = 'L4'");
assert.equal(run('filterMallLedger().length'), 1);
run("mallPageState.keyword = ''");
assert(run('mallLedgerDescription(data.loveLedger[0])').includes('U1'));

const ledger = run('renderMallLedgerTable()');
assert.equal((ledger.match(/<th>/g) || []).length, 4);
for (const label of ['期初余额', '学生捐赠汇入', '项目支出', '期末余额', '编号 / 说明', '池子余额', '导出台账']) assert(ledger.includes(label));
const monthly = run('renderMallMonthlyTable()');
assert.equal((monthly.match(/<th>/g) || []).length, 7);
for (const label of ['爱心月报', '月报标题', '统计周期', '参与人数', '>编辑<', '>预览<', '>发布<']) assert(monthly.includes(label));
assert(!monthly.includes('爱心池余额'));
console.log('PASS: ledger/monthly rendering, filters, summaries, unique monthly generation, month boundaries and participant deduplication');
