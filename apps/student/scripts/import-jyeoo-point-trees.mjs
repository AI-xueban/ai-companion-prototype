import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const source = process.argv[2];
if (!source) throw new Error('Usage: node scripts/import-jyeoo-point-trees.mjs <point-cache-root>');
const destination = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../data/learning-books/point-trees');
fs.mkdirSync(destination, { recursive: true });
let count = 0;
for (const folder of fs.readdirSync(source, { withFileTypes: true })) {
  if (!folder.isDirectory() || !folder.name.startsWith('jye_')) continue;
  const dir = path.join(source, folder.name);
  for (const file of fs.readdirSync(dir).filter(name => /_point2_.*\.json$/.test(name))) {
    const code = file.split('_point2_')[0];
    const { response } = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8').replace(/^\uFEFF/, ''));
    const seen = new Set();
    const compact = node => {
      const id = String(node.No);
      if (seen.has(id)) throw new Error(`Duplicate point ${code}/${id}`);
      seen.add(id);
      return { id, name: node.Name, children: (node.Children ?? []).map(compact) };
    };
    fs.writeFileSync(path.join(destination, `${code}.json`), JSON.stringify(response.map(compact)) + '\n');
    count++;
  }
}
console.log(`Imported ${count} point trees, preserving IDs, parentage and sibling order.`);
