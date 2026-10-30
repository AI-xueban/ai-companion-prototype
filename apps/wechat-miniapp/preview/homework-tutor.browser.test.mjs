import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { handlePreviewRequest } from './server.mjs';

const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
await page.route('**/learning-data.js', async route => {
  let body, status = 200, headers = {};
  await handlePreviewRequest({ url: '/learning-data.js' }, {
    writeHead(code, values) { status = code; headers = values; },
    end(value) { body = value; },
  });
  await route.fulfill({ status, headers, body });
});
try {
  await page.goto(new URL('./index.html?review=1&demo=hw-parent-result', import.meta.url).href);
  await page.waitForFunction(() => window.homeworkPrototype && window.homeworkTutorUI);
  assert.equal(await page.locator('.hp-result-sheet').count(), 1);
  assert.match(await page.locator('.hp-result-reading').innerText(), /24 ÷ 4/);
  const slider = page.getByRole('slider', { name: '拖动调整解析高度' });
  await slider.press('Home');
  assert.equal(await page.locator('.hp-result-sheet.is-minimized').count(), 1);
  await slider.press('End');
  assert.equal(await page.locator('.hp-result-sheet.is-full').count(), 1);
  await page.locator('.hp-result-question-nav button').nth(1).click();
  assert.match(await page.locator('.hp-result-answer').innerText(), /15.7/);
  await page.locator('.hp-result-question-nav button').first().click();
  await page.getByRole('button', { name: 'AI 解题', exact: true }).click();
  assert.equal(await page.locator('.tv-root').count(), 1);
  assert.match(await page.locator('.tv-root').innerText(), /1 对 1 讲题/);
  await page.getByRole('button', { name: '查看原题' }).click();
  assert.equal(await page.getByRole('dialog', { name: '查看原题' }).count(), 1);
  await page.getByRole('button', { name: '关闭原题' }).click();
  await page.evaluate(() => homeworkTutorUI.close());
  assert.equal(await page.locator('.hp-result-sheet').count(), 1);
  assert.deepEqual(errors, []);
  console.log('PASS parent result slider, question switch, tutor entry, original question and return');
} finally {
  await browser.close();
}
