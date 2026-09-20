const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const sourceDir = path.join(root, 'prototype');
const sourceHtmlPath = path.join(sourceDir, 'index.html');
const outputDir = path.join(root, '可下载打开地址');
const outputPath = path.join(outputDir, '万象视界管理后台原型.html');

let html = fs.readFileSync(sourceHtmlPath, 'utf8');

html = html.replace(
  /<link\s+rel=["']stylesheet["']\s+href=["']([^"']+)["']\s*\/?>/gi,
  (tag, href) => {
    const cleanHref = href.split('?')[0].split('#')[0];
    const cssPath = path.join(sourceDir, cleanHref);
    const css = fs.readFileSync(cssPath, 'utf8').replace(/<\/style/gi, '<\\/style');
    return `<style data-source="${cleanHref}">\n${css}\n</style>`;
  }
);

html = html.replace(
  /<script\s+src=["']([^"']+)["']\s*><\/script>/gi,
  (tag, src) => {
    const cleanSrc = src.split('?')[0].split('#')[0];
    const jsPath = path.join(sourceDir, cleanSrc);
    const js = fs.readFileSync(jsPath, 'utf8').replace(/<\/script/gi, '<\\/script');
    new vm.Script(js, { filename: cleanSrc });
    return `<script data-source="${cleanSrc}">\n${js}\n</script>`;
  }
);

const remainingAssets = html.match(/(?:src|href)=["']assets\//gi);
if (remainingAssets) {
  throw new Error(`仍有 ${remainingAssets.length} 个本地资源引用未内联`);
}

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(outputPath, html, 'utf8');

console.log(`✓ 单文件原型已生成：${outputPath}`);
console.log(`  文件大小：${fs.statSync(outputPath).size} bytes`);
