import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { handlePreviewRequest } from './server.mjs';

async function request(url) {
  const result = {};
  await handlePreviewRequest({ url }, {
    writeHead(status, headers) { result.status = status; result.headers = headers; },
    end(body) { result.body = String(body); }
  });
  return result;
}
for (const name of ['index.html', 'homework-preview.html', '教师发布任务-新版预览.html', 'homework-flow-lab.html', 'control-prototype.html', 'parent-prototype.js']) {
  const result = await request(`/${encodeURIComponent(name)}?review=1`);
  assert.equal(result.status, 200, name);
  assert.equal(result.body, await readFile(new URL(`./${name}`, import.meta.url), 'utf8'), `Must serve the requested file: ${name}`);
  assert.equal(result.headers['Cache-Control'], 'no-store');
}
assert.equal((await request('/?review=1&page=parent')).body, await readFile(new URL('./index.html', import.meta.url), 'utf8'));
for (const path of ['/missing-page.html', '/assets/missing.js', '/parent-prototype.js/extra', '/%2e%2e/package.json']) {
  const result = await request(path);
  assert.equal(result.status, 404, path);
  assert.doesNotMatch(result.body, /<!doctype/i);
}
assert.equal((await request('/%ZZ')).status, 400);
assert.match((await request('/learning-data.js')).body, /window\.learningData/);
console.log('Passed: exact page contents, encoded Chinese URL, query parameters, no-store headers, missing routes, traversal rejection, malformed URL and dynamic learning data.');

for(const [name,mime] of [['homework-real-page-1.jpg','image/jpeg'],['homework-real-page-2.png','image/png']]){const result=await request('/miniprogram/assets/'+name);assert.equal(result.status,200);assert.equal(result.headers['Content-Type'],mime);}
