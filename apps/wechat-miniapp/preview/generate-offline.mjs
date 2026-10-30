import { copyFile, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = fileURLToPath(new URL('.', import.meta.url));
const checkOnly = process.argv.includes('--check');
const outdated = [];
const normalize = text => text.replaceAll('\r\n', '\n');
async function saveOrCheck(name, content) {
  const path = join(root, name);
  let existing;
  try { existing = await readFile(path, 'utf8'); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (existing !== undefined && normalize(existing) === normalize(content)) return;
  if (checkOnly) outdated.push(name);
  else await writeFile(path, content, 'utf8');
}
const services = join(root, '..', 'miniprogram', 'services');
const compile = async name => ts.transpileModule(await readFile(join(services, name), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;

const roster = await compile('schoolDemoRoster.ts');
const learning = await compile('learningMock.ts');
const grading = await compile('homeworkGrading.ts');
const filters = await compile('homeworkFilters.ts');
const homeworkLearning = await compile('homeworkLearning.ts');
const homeworkTutor = await compile('homeworkTutor.ts');
const homeworkWorksheets = await compile('homeworkWorksheets.ts');
const dataScript = `(function(){const sources={roster:${JSON.stringify(roster)},learning:${JSON.stringify(learning)},grading:${JSON.stringify(grading)},filters:${JSON.stringify(filters)},homeworkLearning:${JSON.stringify(homeworkLearning)},homeworkTutor:${JSON.stringify(homeworkTutor)},homeworkWorksheets:${JSON.stringify(homeworkWorksheets)}};const cache={};function load(name){if(cache[name])return cache[name];const exports={};cache[name]=exports;new Function('require','exports',sources[name])((path)=>load(path==='./schoolDemoRoster'?'roster':path==='./homeworkGrading'?'grading':path),exports);return exports}window.schoolDemoRoster=load('roster');window.learningData=load('learning');window.homeworkGrading=load('grading');window.homeworkFilters=load('filters');window.homeworkLearning=load('homeworkLearning');window.homeworkTutor=load('homeworkTutor');window.homeworkWorksheets=load('homeworkWorksheets')})();`;
await saveOrCheck('learning-data.js', dataScript);

const index = await readFile(join(root, 'index.html'), 'utf8');
let offline = index.replace("let stage=params.get('page')||'home'", "let stage=params.get('page')||'teacherDesk'");
if (offline === index) throw new Error('无法定位预览首页的默认页面设置');
for (const name of ['parent-prototype.css', 'homework-prototype.css', 'learning-prototype.css', 'demo-workspace.css']) {
  const marker = offline.match(new RegExp(`<link rel="stylesheet" href="${name.replaceAll(".", "\\.")}(?:\\?[^"]*)?"\\s*/>`))?.[0];
  if (!marker || !offline.includes(marker)) throw new Error(`无法定位样式文件：${name}`);
  offline = offline.replace(marker, `<style data-offline-source="${name}">\n${await readFile(join(root, name), 'utf8')}\n</style>`);
}
for (const name of ['learning-data.js', 'learning-prototype.js', 'workbench-prototype.js', 'homework-tutor.js', 'homework-prototype.js', 'page-demo-tools.js', 'homework-console.js', 'parent-prototype.js', 'learning-demo.js', 'homework-tutor-walkthrough.js', 'demo-workspace.js']) {
  const marker = offline.match(new RegExp(`<script src="${name.replaceAll(".", "\\.")}(?:\\?[^"]*)?"></script>`))?.[0];
  if (!marker || !offline.includes(marker)) throw new Error(`无法定位脚本文件：${name}`);
  const source = (name === 'learning-data.js' ? dataScript : await readFile(join(root, name), 'utf8')).replace(/<\/script/gi, '<\\/script');
  offline = offline.replace(marker, `<script data-offline-source="${name}">\n${source}\n</script>`);
}
await saveOrCheck('homework-preview.html', offline);

// Keep the specialist page's own layout while updating only declared shared
// blocks, so a UI revision does not silently keep stale login or family logic.
const specialistName = '教师发布任务-新版预览.html';
let specialist = await readFile(join(root, specialistName), 'utf8');
const sharedNames = ['parent-prototype.css', 'homework-prototype.css', 'learning-prototype.css', 'learning-data.js', 'learning-prototype.js', 'workbench-prototype.js', 'homework-tutor.js', 'homework-prototype.js', 'page-demo-tools.js', 'homework-console.js', 'parent-prototype.js'];
for (const name of sharedNames) {
  const tag = name.endsWith('.css') ? 'style' : 'script';
  const escapedName = name.replaceAll('.', '\\.');
  if (name === 'homework-tutor.js' && !specialist.includes('data-offline-source="homework-tutor.js"')) specialist = specialist.replace('<script data-offline-source="homework-prototype.js">', '<script data-offline-source="homework-tutor.js"></script>\n<script data-offline-source="homework-prototype.js">');
  if (name === 'page-demo-tools.js' && !specialist.includes('data-offline-source="page-demo-tools.js"')) specialist = specialist.replace('<script data-offline-source="parent-prototype.js">', '<script data-offline-source="page-demo-tools.js"></script>\n<script data-offline-source="parent-prototype.js">');
  if (name === 'homework-console.js' && !specialist.includes('data-offline-source="homework-console.js"')) specialist = specialist.replace('<script data-offline-source="parent-prototype.js">', '<script data-offline-source="homework-console.js"></script>\n<script data-offline-source="parent-prototype.js">');
  const block = new RegExp(`(<${tag} data-offline-source="${escapedName}">)[\\s\\S]*?(</${tag}>)`);
  if (!block.test(specialist)) throw new Error(`独立预览缺少共享块：${name}`);
  const raw = name === 'learning-data.js' ? dataScript : await readFile(join(root, name), 'utf8');
  const content = tag === 'script' ? raw.replace(/<\/script/gi, '<\\/script') : raw;
  specialist = specialist.replace(block, (_, open, close) => `${open}\n${content}\n${close}`);
}
specialist = specialist.replace(/function syncReview\(\)\{(?!\s*window\.homeworkDemoConsole)/, 'function syncReview(){\n      window.homeworkDemoConsole?.sync();').replace("function chooseDemoDomain(domain){if(domain==='parent')", "function chooseDemoDomain(domain){if(window.homeworkDemoConsole?.isActive()){window.homeworkDemoConsole.role(domain);return;}if(domain==='parent')");
specialist = specialist.replace(/    function injectTeacherExceptionPanel\(\)\{[^\n]+/, '    function injectTeacherExceptionPanel(){window.pageDemoTools?.sync();}');
const roleEntry = index.match(/    function enterDemoRole\(role\)\{[\s\S]*?\n    \}/)?.[0];
if (!roleEntry) throw new Error('无法定位默认已登录角色入口');
specialist = specialist.includes('function enterDemoRole(role)')
  ? specialist.replace(/    function enterDemoRole\(role\)\{[\s\S]*?\n    \}/, () => roleEntry)
  : specialist.replace('    function saveDemoTeacherSession()', () => roleEntry + '\n    function saveDemoTeacherSession()');
specialist = specialist
  .replace('class="role-card role-teacher" onclick="go(\'teacherLogin\')"', 'class="role-card role-teacher" onclick="enterDemoRole(\'teacher\')"')
  .replace('class="role-card role-parent" onclick="parentPrototype.start()"', 'class="role-card role-parent" onclick="enterDemoRole(\'parent\')"')
  .replace("stage='parent';restoreDemoTeacherOnLaunch();", "stage='parent';if(params.get('page')!=='home')restoreDemoTeacherOnLaunch();")
  .replace('else parentPrototype.start();', "else enterDemoRole('parent');");
for (const name of ['switchToParentRole', 'switchToTeacherRole']) {
  const pattern = new RegExp(`    function ${name}\\(\\)\\{[^\\n]+`);
  const source = index.match(pattern)?.[0];
  if (!source || !pattern.test(specialist)) throw new Error(`无法定位角色切换：${name}`);
  specialist = specialist.replace(pattern, () => source);
}
const reloadPattern = /    function restoreDefaultTeacherPageOnReload\(\)\{[\s\S]*?\n    \}/;
const reloadSource = index.match(reloadPattern)?.[0];
if (!reloadSource) throw new Error('无法定位教师刷新默认入口');
if (reloadPattern.test(specialist)) specialist = specialist.replace(reloadPattern, () => reloadSource);
else specialist = specialist.replace("    if(params.has('workView'))", () => reloadSource + "\n    restoreDefaultTeacherPageOnReload();\n    if(params.has('workView'))");
await saveOrCheck(specialistName, specialist);
if (checkOnly) {
  if (outdated.length) {
    console.error(`离线页面待同步：${outdated.join('、')}。运行 node preview/generate-offline.mjs 后重新检查。`);
    process.exitCode = 1;
  } else console.log('离线共享脚本、样式与生成预览一致。');
} else {
  await copyFile(join(root, '..', 'miniprogram', 'assets', 'teacher-login-illustration.png'), join(root, 'assets', 'teacher-login-illustration.png'));
  console.log('已同步离线预览及独立视觉稿中的共享脚本和样式，保留独立视觉稿布局。');
}
