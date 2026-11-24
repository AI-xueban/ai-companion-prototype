import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const source = process.argv[2];
if (!source) throw new Error('Usage: node scripts/import-jyeoo-trace.mjs <point-cache-root>');
const output = {};
for (const folder of fs.readdirSync(source, { withFileTypes: true })) {
  if (!folder.isDirectory() || !folder.name.startsWith('jye_')) continue;
  const dir = path.join(source, folder.name);
  for (const file of fs.readdirSync(dir).filter(name => /_point2_.*\.json$/.test(name))) {
    const code = file.split('_point2_')[0];
    const { response } = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8').replace(/^\uFEFF/, ''));
    const records = output[code] = {};
    const visit = nodes => nodes.forEach((node, i) => {
      records[node.No] = { id: String(node.No), name: node.Name, ...(i ? { previousId: String(nodes[i - 1].No) } : {}) };
      visit(node.Children ?? []);
    });
    visit(response);
  }
}
const destination = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../data/learning-books/point-trace-index.json');
fs.writeFileSync(destination, JSON.stringify(output) + '\n');
console.log(`Imported sibling order from ${Object.keys(output).length} point trees.`);
