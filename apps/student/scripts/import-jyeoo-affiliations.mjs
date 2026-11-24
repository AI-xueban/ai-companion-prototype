import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

/** All actual book associations, deduplicated across editions without inventing a single home. */
export function buildPointAffiliations(books) {
  const entries = new Map();
  for (const book of books) {
    const grade = book.GradeName;
    const term = book.TermName?.includes('上') ? '上册' : book.TermName?.includes('下') ? '下册' : book.TermName;
    if (!grade || !term) continue;
    for (const chapter of book.Children ?? []) {
      const visit = node => {
        for (const point of node.Points ?? []) {
          const id = String(point.No);
          if (!entries.has(id)) entries.set(id, new Map());
          const location = [grade, term, chapter.Name];
          entries.get(id).set(JSON.stringify(location), location);
        }
        (node.Children ?? []).forEach(visit);
      };
      visit(chapter);
    }
  }
  const grades = ['一年级','二年级','三年级','四年级','五年级','六年级','七年级','八年级','九年级','高一','高二','高三'];
  return Object.fromEntries([...entries].map(([id, locations]) => [id, [...locations.values()].sort((a, b) =>
    (grades.indexOf(a[0]) < 0 ? 99 : grades.indexOf(a[0])) - (grades.indexOf(b[0]) < 0 ? 99 : grades.indexOf(b[0]))
    || a[0].localeCompare(b[0], 'zh-CN') || (a[1] === '上册' ? 0 : 1) - (b[1] === '上册' ? 0 : 1)
    || a[2].localeCompare(b[2], 'zh-CN', { numeric: true }))]));
}

function main(source) {
  if (!source) throw new Error('Usage: node scripts/import-jyeoo-affiliations.mjs <book-cache-root>');
  const output = {};
  for (const folder of fs.readdirSync(source, { withFileTypes: true })) {
    if (!folder.isDirectory() || !folder.name.startsWith('jye_')) continue;
    const dir = path.join(source, folder.name);
    for (const file of fs.readdirSync(dir).filter(name => /_book2_.*\.json$/.test(name))) {
      const code = file.split('_book2_')[0];
      const { response } = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8').replace(/^\uFEFF/, ''));
      output[code] = buildPointAffiliations(response);
    }
  }
  const destination = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../data/learning-books/point-affiliations');
  fs.mkdirSync(destination, { recursive: true });
  for (const [code, records] of Object.entries(output)) fs.writeFileSync(path.join(destination, `${code}.json`), JSON.stringify(records) + '\n');
  console.log(`Indexed full textbook affiliations for ${Object.keys(output).length} subjects.`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main(process.argv[2]);
