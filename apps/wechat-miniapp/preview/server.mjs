import http from 'node:http';
import { networkInterfaces } from 'node:os';
import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const port = Number(process.env.PORT || 4177);
const host = process.env.PREVIEW_HOST || '0.0.0.0';
const root = fileURLToPath(new URL('.', import.meta.url));
export async function handlePreviewRequest(request, response) {
  try {
    let pathname;
    try { pathname = decodeURIComponent(new URL(request.url || '/', 'http://localhost').pathname); }
    catch { response.writeHead(400); response.end('Invalid preview URL'); return; }
    if (pathname === '/learning-data.js') {
      const sourceRoot = join(root, '..', 'miniprogram', 'services');
      const roster = ts.transpileModule(await readFile(join(sourceRoot, 'schoolDemoRoster.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
      const learning = ts.transpileModule(await readFile(join(sourceRoot, 'learningMock.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
      const grading = ts.transpileModule(await readFile(join(sourceRoot, 'homeworkGrading.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
      const filters = ts.transpileModule(await readFile(join(sourceRoot, 'homeworkFilters.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
      const homeworkLearning = ts.transpileModule(await readFile(join(sourceRoot, 'homeworkLearning.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
      const homeworkTutor = ts.transpileModule(await readFile(join(sourceRoot, 'homeworkTutor.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
      const script = `(function(){const sources={roster:${JSON.stringify(roster)},learning:${JSON.stringify(learning)},grading:${JSON.stringify(grading)},filters:${JSON.stringify(filters)},homeworkLearning:${JSON.stringify(homeworkLearning)},homeworkTutor:${JSON.stringify(homeworkTutor)}};const cache={};function load(name){if(cache[name])return cache[name];const exports={};cache[name]=exports;new Function('require','exports',sources[name])((path)=>load(path==='./schoolDemoRoster'?'roster':path==='./homeworkGrading'?'grading':path),exports);return exports}window.schoolDemoRoster=load('roster');window.learningData=load('learning');window.homeworkGrading=load('grading');window.homeworkFilters=load('filters');window.homeworkLearning=load('homeworkLearning');window.homeworkTutor=load('homeworkTutor')})();`;
      response.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': 'no-store' });
      response.end(script);
      return;
    }
    const assetName = pathname === '/assets/role-selection-approved-role-copy.png'
      ? 'role-selection-approved-role-copy.png'
      : pathname === '/assets/role-selection-approved-description-short.png'
        ? 'role-selection-approved-description-short.png'
      : pathname === '/assets/role-selection-approved-title-smaller.png'
        ? 'role-selection-approved-title-smaller.png'
      : pathname === '/assets/role-selection-approved.png'
        ? 'role-selection-approved.png'
        : null;
    const teacherArt = pathname === '/assets/teacher-login-illustration.png';
    const homeworkPaper = ['/miniprogram/assets/homework-demo-paper.png', '/miniprogram/assets/homework-real-page-1.jpg', '/miniprogram/assets/homework-real-page-2.png'].includes(pathname);
    const parentAsset = ['/homework-tutor.js', '/demo-workspace.js', '/demo-workspace.css', '/learning-demo.js', '/page-demo-tools.js', '/homework-console.js', '/parent-prototype.css', '/parent-prototype.js', '/homework-prototype.css', '/homework-prototype.js', '/homework-flow-lab.css', '/homework-flow-lab.js', '/homework-flow-lab.html', '/homework-preview.html', '/教师发布任务-新版预览.html', '/learning-prototype.css', '/learning-prototype.js', '/workbench-prototype.js', '/control-prototype.html', '/control-prototype.css', '/control-rules.js', '/control-parity.js'].includes(pathname) ? pathname.slice(1) : null;
    if (!assetName && !teacherArt && !homeworkPaper && !parentAsset && pathname !== '/' && pathname !== '/index.html') {
      response.writeHead(404); response.end('Preview page or asset not found'); return;
    }
    const file = homeworkPaper ? join(root, '..', pathname.slice(1)) : teacherArt ? join(root, '..', 'miniprogram', 'assets', 'teacher-login-illustration.png') : assetName ? join(root, 'assets', assetName) : parentAsset ? join(root, parentAsset) : join(root, 'index.html');
    const content = await readFile(file);
    const contentType = pathname.endsWith('.jpg') && homeworkPaper ? 'image/jpeg' : assetName || teacherArt || homeworkPaper ? 'image/png' : parentAsset?.endsWith('.css') ? 'text/css; charset=utf-8' : parentAsset?.endsWith('.js') ? 'text/javascript; charset=utf-8' : 'text/html; charset=utf-8';
    response.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'no-store' });
    response.end(content);
  } catch { response.writeHead(500); response.end('Preview unavailable'); }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
const server = http.createServer(handlePreviewRequest);
server.listen(port, host, () => {
  const addresses = Object.values(networkInterfaces()).flat().filter((item) => item?.family === 'IPv4' && !item.internal).map((item) => item.address);
  console.log(`Local preview: http://127.0.0.1:${port}`);
  if (host === '0.0.0.0') addresses.forEach((address) => console.log(`LAN preview: http://${address}:${port}`));
});
}
