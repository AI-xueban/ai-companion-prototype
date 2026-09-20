const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const src = path.join(root, 'prototype');
const dist = path.join(root, 'dist');

function rmDir(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) rmDir(p);
    else fs.unlinkSync(p);
  }
  fs.rmdirSync(dir);
}

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const srcPath = path.join(from, entry.name);
    const destPath = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(srcPath, destPath);
    else fs.copyFileSync(srcPath, destPath);
  }
}

rmDir(dist);
copyDir(src, dist);

const shareHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>万象视界管理后台 - 分享入口</title>
  <style>
    body { font-family: "Microsoft YaHei", sans-serif; max-width: 640px; margin: 60px auto; padding: 0 24px; color: #333; line-height: 1.8; }
    h1 { font-size: 22px; margin-bottom: 8px; }
    .url { display: block; background: #e6f4ff; border: 1px solid #91caff; padding: 12px 16px; border-radius: 8px; color: #1677ff; text-decoration: none; word-break: break-all; margin: 16px 0; }
    .url:hover { background: #bae0ff; }
    .btn { display: inline-block; margin-top: 12px; padding: 10px 24px; background: #1677ff; color: #fff; border-radius: 6px; text-decoration: none; }
    .btn:hover { background: #4096ff; }
    p { color: #666; font-size: 14px; }
    code { background: #f5f5f5; padding: 2px 6px; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>万象视界管理后台原型</h1>
  <p>AI学伴管理后台 · 万象视界管理模块（可交互原型）</p>
  <p><strong>本地预览地址：</strong></p>
  <a class="url" href="./index.html">./index.html</a>
  <a class="btn" href="./index.html">进入原型</a>
  <p style="margin-top:32px"><strong>分享给他人打开：</strong></p>
  <p>1. 将整个 <code>dist</code> 文件夹部署到静态服务器（如 Nginx、OSS、GitHub Pages）</p>
  <p>2. 分享部署后的网址，例如：<code>https://你的域名/index.html</code></p>
  <p>3. 或在对方电脑解压后，用浏览器直接打开 <code>index.html</code></p>
  <p style="margin-top:24px;font-size:12px;color:#999">构建时间：${new Date().toLocaleString('zh-CN')}</p>
</body>
</html>
`;

fs.writeFileSync(path.join(dist, 'share.html'), shareHtml, 'utf8');

const readme = `万象视界管理后台原型 - dist 发布包
========================================

【快速打开】
  双击 share.html 或 index.html

【本地服务器预览（推荐）】
  在项目根目录执行：
    npm run preview
  浏览器访问：http://localhost:8080

【分享网址】
  将 dist 文件夹上传到静态网站托管后，分享：
    https://你的域名/index.html

  本地局域网分享（同一 WiFi）：
    npm run preview
    将 http://你的电脑IP:8080 发给同事

构建时间：${new Date().toLocaleString('zh-CN')}
`;

fs.writeFileSync(path.join(dist, '打开说明.txt'), readme, 'utf8');

console.log('✓ 已构建 dist 目录');
console.log('  入口: dist/index.html');
console.log('  分享: dist/share.html');
