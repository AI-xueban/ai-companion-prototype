import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const source = process.argv[2];
if (!source) throw Error('Pass the local jyeoo cache directory.');
const output = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../data/learning-books/point-details');
fs.mkdirSync(output, { recursive: true });
let nodes = 0;
for (const folder of fs.readdirSync(source, { withFileTypes: true })) {
  if (!folder.isDirectory() || !folder.name.startsWith('jye_')) continue;
  const directory = path.join(source, folder.name);
  for (const file of fs.readdirSync(directory).filter(name => /_point2_.*\.json$/.test(name))) {
    const records = Object.create(null);
    const visit = node => {
      const id = String(node.No);
      if (Object.hasOwn(records, id)) throw Error(`Duplicate knowledge point: ${file}/${id}`);
      const counts = [0, 0, 0, 0, 0];
      for (const row of node.QuesCount ?? []) {
        const level = Number(row.DegreeID) - 11;
        const count = Number(row.Count);
        if (!Number.isFinite(count) || count <= 0) continue;
        if (!Number.isInteger(level) || level < 0 || level > 4) throw Error(`Unknown DegreeID ${row.DegreeID}`);
        counts[level] += count;
      }
      records[id] = { desc: String(node.Desc ?? '').trim(), counts };
      nodes++;
      (node.Children ?? []).forEach(visit);
    };
    const raw = JSON.parse(fs.readFileSync(path.join(directory, file), 'utf8').replace(/^\uFEFF/, ''));
    raw.response.forEach(visit);
    fs.writeFileSync(path.join(output, `${file.split('_point2_')[0]}.json`), JSON.stringify(records) + '\n');
  }
}
console.log(`Imported original descriptions and five-level question counts for ${nodes} points; source files unchanged.`);
