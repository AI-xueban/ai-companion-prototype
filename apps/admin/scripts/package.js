const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = path.join(__dirname, '..');
const dist = path.join(root, 'dist');
const zipName = `万象视界管理平台原型-dist-${formatDate()}.zip`;
const zipPath = path.join(root, zipName);

if (!fs.existsSync(dist)) {
  console.error('dist 目录不存在，请先运行 npm run build');
  process.exit(1);
}

if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

// Windows 使用 tar 打包 zip
execSync(`tar -a -c -f "${zipPath}" -C "${root}" dist`, { stdio: 'inherit' });

console.log('');
console.log('✓ 打包完成');
console.log(`  文件路径: ${zipPath}`);

function formatDate() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`;
}
