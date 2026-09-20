const fs = require('fs');
const path = require('path');

const source =
  'c:/Users/谭江庆/Documents/AI伴学/outputs/split_video_samples/初中-英语-视频样例.xlsx.inspect.ndjson';
const lines = fs.readFileSync(source, 'utf8').split(/\n/).filter(Boolean);
const table = JSON.parse(lines.find((line) => line.includes('"kind":"table"')));
const header = table.values[0];
const rows = table.values.slice(1);
const col = (name) => header.indexOf(name);

function parseZipName(zipName) {
  const match = String(zipName).match(/^(.*?)-初中-英语-(七年级|八年级|九年级)-(上学期|下学期)-(\d+)版$/);
  if (!match) return null;
  return {
    version: match[1],
    grade: match[2],
    term: match[3] === '上学期' ? '上册' : '下册',
    year: Number(match[4]),
  };
}

function skillFromName(name) {
  const parts = String(name).split('_').filter(Boolean);
  return parts[parts.length - 1] || String(name);
}

const latest = new Map();
rows.forEach((row) => {
  const parsed = parseZipName(row[col('大同步zip包名')]);
  if (!parsed) return;
  const key = `${parsed.version}|${parsed.grade}|${parsed.term}`;
  const prev = latest.get(key);
  if (!prev || parsed.year > prev.year) latest.set(key, { ...parsed, zipName: row[col('大同步zip包名')] });
});

const allowedZips = new Set([...latest.values()].map((item) => item.zipName));
const grouped = new Map();

rows.forEach((row) => {
  const zipName = row[col('大同步zip包名')];
  if (!allowedZips.has(zipName)) return;
  const parsed = parseZipName(zipName);
  if (!parsed) return;
  const catalog = String(row[col('目录')] ?? '').trim();
  if (!catalog) return;
  const name = String(row[col('视频名称')] ?? '');
  const label = String(row[col('视频标签')] ?? '');
  const skill = skillFromName(name);
  const key = [parsed.version, parsed.grade, parsed.term, catalog].join('|');
  if (!grouped.has(key)) {
    grouped.set(key, {
      version: parsed.version,
      grade: parsed.grade,
      term: parsed.term,
      catalog,
      videos: [],
      seen: new Set(),
    });
  }
  const topic = grouped.get(key);
  if (topic.seen.has(name)) return;
  topic.seen.add(name);
  topic.videos.push({ label, skill, name });
});

const topics = [...grouped.values()].map(({ seen, ...topic }) => topic);
const outPath = path.join(__dirname, '../data/juniorEnglishSyncVideos.ts');
const file = `export interface JuniorEnglishSyncVideo {
  label: string;
  skill: string;
  name: string;
}

export interface JuniorEnglishSyncTopic {
  version: string;
  grade: string;
  term: string;
  catalog: string;
  videos: JuniorEnglishSyncVideo[];
}

/** 来源：初中-英语-视频样例.xlsx。单元/节为空，目录=Unit，学习步骤取视频名称后缀。 */
export const JUNIOR_ENGLISH_SYNC_TOPICS: JuniorEnglishSyncTopic[] = ${JSON.stringify(topics, null, 2)};

export function getJuniorEnglishSyncTopics(grade: string, term: string, version = '沪教版'): JuniorEnglishSyncTopic[] {
  return JUNIOR_ENGLISH_SYNC_TOPICS.filter(
    (topic) => topic.grade === grade && topic.term === term && topic.version === version,
  );
}

export function getJuniorEnglishTextbookVersions(grade: string, term: string): string[] {
  return [...new Set(
    JUNIOR_ENGLISH_SYNC_TOPICS
      .filter((topic) => topic.grade === grade && topic.term === term)
      .map((topic) => topic.version),
  )];
}
`;

fs.writeFileSync(outPath, file);
console.log('units', topics.length, 'videos', topics.reduce((sum, topic) => sum + topic.videos.length, 0));
console.log('written', outPath);
