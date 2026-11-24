import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Count across every difficulty, keeping all question categories tied for maximum.
export function mostCommonQuestionTypes(rows, names) {
  const totals = new Map();
  for (const row of rows ?? []) {
    if (!Number.isFinite(row.Count) || row.Count <= 0) continue;
    const id = String(row.CateID);
    totals.set(id, (totals.get(id) ?? 0) + row.Count);
  }
  const max = Math.max(0, ...totals.values());
  const winners = [...totals].filter(([, count]) => count === max).map(([id]) => id);
  // An unmapped winner must not silently turn a runner-up into the most common type.
  if (winners.some(id => !names[id])) return [];
  return [...new Set(winners.sort((a, b) => Number(a) - Number(b)).map(id => names[id]))];
}

function main(source) {
  const data = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../data');
  const { types } = JSON.parse(fs.readFileSync(path.join(data, 'jyeooQuestionTypes.json'), 'utf8'));
  const output = {};
  let count = 0;
  for (const folder of fs.readdirSync(source, { withFileTypes: true })) {
    if (!folder.isDirectory() || !folder.name.startsWith('jye_')) continue;
    const dir = path.join(source, folder.name);
    for (const file of fs.readdirSync(dir).filter(name => /_point2_.*\.json$/.test(name))) {
      const code = file.split('_point2_')[0];
      if (!types[code]) throw new Error(`Missing question type dictionary: ${code}`);
      const { response } = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8').replace(/^\uFEFF/, ''));
      const records = output[code] = {};
      const visit = nodes => {
        for (const node of nodes) {
          const common = mostCommonQuestionTypes(node.QuesCount, types[code]);
          if (common.length) { records[node.No] = common; count++; }
          visit(node.Children ?? []);
        }
      };
      visit(response);
    }
  }
  fs.writeFileSync(path.join(data, 'learning-books/common-question-types.json'), JSON.stringify(output) + '\n');
  console.log(`Imported most common question types for ${count} points across ${Object.keys(output).length} subjects.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  if (!process.argv[2]) throw new Error('Usage: node scripts/import-jyeoo-common-types.mjs <cache-root>');
  main(process.argv[2]);
}
