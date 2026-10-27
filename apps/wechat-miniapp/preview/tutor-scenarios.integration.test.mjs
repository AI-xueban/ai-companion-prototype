import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { handlePreviewRequest } from './server.mjs';

const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on('pageerror', error => errors.push(error.stack));
await page.route('**/learning-data.js', async route => {
  let body, status = 200, headers = {};
  await handlePreviewRequest({ url: '/learning-data.js' }, {
    writeHead(code, values) { status = code; headers = values; },
    end(value) { body = value; },
  });
  await route.fulfill({ status, headers, body });
});
try {
  await page.goto(new URL('./index.html?review=1&page=parent', import.meta.url).href);
  await page.waitForFunction(() => window.parentPrototype && window.homeworkPrototype && window.homeworkTutor);
  for (let index = 0; index < 8; index++) {
    await page.evaluate(i => openTutorScenarioDemo(i), index);
    const cards = page.locator('.hp-parent-item');
    assert.equal(await cards.count(), 8);
    const photo = cards.nth(index).locator('.hp-record-photo img');
    assert.equal(await photo.count(), 1);
    assert.equal(await photo.evaluate(img => img.complete && img.naturalWidth > 0), true);
    await photo.click();
    assert.equal(await page.locator('#hp-paper-dialog[open] img').count(), 1);
    await page.getByRole('button', { name: '关闭原图' }).click();
    await page.evaluate(i => homeworkPrototype.openParentQuestion('tutor-scenario-' + (i + 1), 'tutor-scenario-' + (i + 1) + '-q1'), index);
    assert.equal(await page.locator('.hp-result-sheet').count(), 1);
    assert.match(await page.locator('.hp-result-detail').innerText(), /解析/);
    await page.getByRole('button', { name: 'AI 解题', exact: true }).click();
    assert.equal(await page.locator('.ht-root').count(), 1);
    assert.match(await page.locator('.ht-root').innerText(), /1 对 1 讲题/);
    await page.evaluate(() => homeworkTutorUI.close());
    assert.equal(await page.locator('.hp-result-sheet').count(), 1);
    await page.evaluate(() => homeworkPrototype.closeHomeworkLearning());
  }
  assert.deepEqual(errors, []);
  console.log('PASS eight tutor scenarios: parent photo, released result, explanation and return');
} finally {
  await browser.close();
}
