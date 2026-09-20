const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '_docx_extract');
const outFile = path.join(__dirname, '..', 'data', 'juniorTextbookChapters.ts');

const SUBJECT_FILE = {
  '化学学科.txt': '化学',
  '历史学科.txt': '历史',
  '地理学科.txt': '地理',
  '数学学科.txt': '数学',
  '物理学科.txt': '物理',
  '生物学科.txt': '生物',
  '英语学科.txt': '英语',
  '道德与法治学科.txt': '道德与法治',
  '初中科学学科.txt': '科学',
};

function displayVersion(raw) {
  const text = String(raw || '').trim();
  if (/人教版（统编版）/.test(text)) return '人教版';
  const matched = text.match(/^(.+?)（(.+)）$/);
  if (matched) return matched[2].endsWith('版') ? matched[2] : matched[1];
  return text;
}

function parseVolume(volume) {
  const text = String(volume || '').trim();
  const hit = text.match(/^(六年级|七年级|八年级|九年级)(上册|下册|全一册)$/);
  if (!hit) return null;
  return { grade: hit[1], term: hit[2] };
}

const rows = [];
let lastVolume = '';

for (const [file, subject] of Object.entries(SUBJECT_FILE)) {
  const lines = fs.readFileSync(path.join(srcDir, file), 'utf8').split(/\r?\n/);
  lastVolume = '';
  for (const line of lines) {
    if (!line.includes('|') || line.startsWith('学科|') || line.startsWith('#')) continue;
    const parts = line.split('|').map((item) => item.trim());
    if (parts.length < 5) continue;
    const [, versionRaw, systemRaw, volumeRaw, chapter] = parts;
    if (!chapter) continue;
    const volume = volumeRaw || lastVolume;
    if (volumeRaw) lastVolume = volumeRaw;
    const parsed = parseVolume(volume);
    if (!parsed) continue;
    const system = systemRaw === '五四学制' ? '五四学制' : '六三学制';
    rows.push({
      subject,
      version: displayVersion(versionRaw),
      system,
      grade: parsed.grade,
      term: parsed.term,
      chapter,
    });
  }
}

const unique = [];
const seen = new Set();
for (const row of rows) {
  const key = [row.subject, row.version, row.system, row.grade, row.term, row.chapter].join('|');
  if (seen.has(key)) continue;
  seen.add(key);
  unique.push(row);
}

const body = unique.map((row) =>
  `  ${JSON.stringify(row)}`,
).join(',\n');

const file = `export type SchoolSystemType = '六三学制' | '五四学制';

export interface JuniorTextbookChapter {
  subject: string;
  version: string;
  system: SchoolSystemType;
  grade: string;
  term: string;
  chapter: string;
}

/** 来源：初中学科数据 docx。人教版（统编版）已统一显示为人教版。 */
export const JUNIOR_TEXTBOOK_CHAPTERS: JuniorTextbookChapter[] = [
${body}
];
`;

fs.writeFileSync(outFile, file, 'utf8');
console.log(`wrote ${unique.length} chapters -> ${outFile}`);
const subjects = [...new Set(unique.map((row) => row.subject))];
for (const subject of subjects) {
  const versions = [...new Set(unique.filter((row) => row.subject === subject).map((row) => `${row.system}/${row.version}`))];
  console.log(subject, versions.join(' | '));
}
