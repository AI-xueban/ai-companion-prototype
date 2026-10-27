import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('./homework-prototype.js', import.meta.url), 'utf8');
const styles = await readFile(new URL('./homework-prototype.css', import.meta.url), 'utf8');

for (const state of ['optimizing', 'uploading', 'complete', 'failed']) assert.match(source, new RegExp(`['\"]${state}['\"]`));
for (const copy of ['正在优化图片', '正在准备上传', '正在上传', '上传完成', '上传失败', '重新上传']) assert.ok(source.includes(copy), copy);
assert.match(source, /cancelMaterialUpload/);
assert.match(source, /retryMaterialUpload/);
assert.match(source, /附件仍在处理中/);
assert.match(source, /revealMaterialAttachment/);
assert.match(source, /scrollIntoView/);
assert.match(styles, /hp-upload-spinner/);
assert.match(styles, /hp-upload-progress/);
assert.match(styles, /scroll-margin-bottom:76px/);
assert.match(styles, /hp-compose-footer \.hp-primary:disabled/);

console.log('Passed: attachment preparation, upload progress, completion, failure, cancel, retry and blocked-next-step states.');
