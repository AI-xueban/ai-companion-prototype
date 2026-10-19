import { copyFile, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = fileURLToPath(new URL('.', import.meta.url));
const services = join(root, '..', 'miniprogram', 'services');
const compile = async name => ts.transpileModule(await readFile(join(services, name), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;

const roster = await compile('schoolDemoRoster.ts');
const learning = await compile('learningMock.ts');
const dataScript = `(function(){const sources={roster:${JSON.stringify(roster)},learning:${JSON.stringify(learning)}};const cache={};function load(name){if(cache[name])return cache[name];const exports={};cache[name]=exports;new Function('require','exports',sources[name])((path)=>load(path==='./schoolDemoRoster'?'roster':path),exports);return exports}window.schoolDemoRoster=load('roster');window.learningData=load('learning')})();`;
await writeFile(join(root, 'learning-data.js'), dataScript, 'utf8');

const index = await readFile(join(root, 'index.html'), 'utf8');
let offline = index.replace("let stage=params.get('page')||'home'", "let stage=params.get('page')||'teacherDesk'");
if (offline === index) throw new Error('无法定位预览首页的默认页面设置');
for (const name of ['parent-prototype.css', 'homework-prototype.css', 'learning-prototype.css']) {
  const marker = offline.match(new RegExp(`<link rel="stylesheet" href="${name.replaceAll(".", "\\.")}(?:\\?[^"]*)?"\\s*/>`))?.[0];
  if (!marker || !offline.includes(marker)) throw new Error(`无法定位样式文件：${name}`);
  offline = offline.replace(marker, `<style data-offline-source="${name}">\n${await readFile(join(root, name), 'utf8')}\n</style>`);
}
for (const name of ['learning-data.js', 'learning-prototype.js', 'workbench-prototype.js', 'homework-prototype.js', 'parent-prototype.js']) {
  const marker = offline.match(new RegExp(`<script src="${name.replaceAll(".", "\\.")}(?:\\?[^"]*)?"></script>`))?.[0];
  if (!marker || !offline.includes(marker)) throw new Error(`无法定位脚本文件：${name}`);
  const source = (await readFile(join(root, name), 'utf8')).replace(/<\/script/gi, '<\\/script');
  offline = offline.replace(marker, `<script data-offline-source="${name}">\n${source}\n</script>`);
}
await writeFile(join(root, 'homework-preview.html'), offline, 'utf8');
await copyFile(join(root, '..', 'miniprogram', 'assets', 'teacher-login-illustration.png'), join(root, 'assets', 'teacher-login-illustration.png'));
console.log('已生成内嵌最新样式和脚本的离线预览：preview/homework-preview.html');
