import http from 'node:http';
import { networkInterfaces } from 'node:os';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const port = Number(process.env.PORT || 4177);
const root = fileURLToPath(new URL('.', import.meta.url));
const server = http.createServer(async (request, response) => {
  try {
    const pathname = new URL(request.url || '/', 'http://localhost').pathname;
    if (pathname === '/learning-data.js') {
      const sourceRoot = join(root, '..', 'miniprogram', 'services');
      const roster = ts.transpileModule(await readFile(join(sourceRoot, 'schoolDemoRoster.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
      const learning = ts.transpileModule(await readFile(join(sourceRoot, 'learningMock.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
      const script = `(function(){const sources={roster:${JSON.stringify(roster)},learning:${JSON.stringify(learning)}};const cache={};function load(name){if(cache[name])return cache[name];const exports={};cache[name]=exports;new Function('require','exports',sources[name])((path)=>load(path==='./schoolDemoRoster'?'roster':path),exports);return exports}window.schoolDemoRoster=load('roster');window.learningData=load('learning')})();`;
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
    const homeworkPaper = pathname === '/miniprogram/assets/homework-demo-paper.png';
    const parentAsset = ['/parent-prototype.css', '/parent-prototype.js', '/homework-prototype.css', '/homework-prototype.js', '/homework-flow-lab.css', '/homework-flow-lab.js', '/homework-flow-lab.html', '/learning-prototype.css', '/learning-prototype.js', '/workbench-prototype.js', '/control-prototype.html'].includes(pathname) ? pathname.slice(1) : null;
    const file = homeworkPaper ? join(root, '..', 'miniprogram', 'assets', 'homework-demo-paper.png') : teacherArt ? join(root, '..', 'miniprogram', 'assets', 'teacher-login-illustration.png') : assetName ? join(root, 'assets', assetName) : parentAsset ? join(root, parentAsset) : join(root, 'index.html');
    const content = await readFile(file);
    const contentType = assetName || teacherArt || homeworkPaper ? 'image/png' : parentAsset?.endsWith('.css') ? 'text/css; charset=utf-8' : parentAsset?.endsWith('.js') ? 'text/javascript; charset=utf-8' : 'text/html; charset=utf-8';
    response.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'no-store' });
    response.end(content);
  } catch { response.writeHead(500); response.end('Preview unavailable'); }
});
server.listen(port, '0.0.0.0', () => {
  const addresses = Object.values(networkInterfaces()).flat().filter((item) => item?.family === 'IPv4' && !item.internal).map((item) => item.address);
  console.log(`Local preview: http://127.0.0.1:${port}`);
  addresses.forEach((address) => console.log(`LAN preview: http://${address}:${port}`));
});
