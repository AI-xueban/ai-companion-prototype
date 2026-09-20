const fs = require('fs');
const path = require('path');

const source =
  'c:/Users/谭江庆/Documents/AI伴学/outputs/split_video_samples/初中-语文-视频样例.xlsx.inspect.ndjson';
const lines = fs.readFileSync(source, 'utf8').split(/\n/).filter(Boolean);
const table = JSON.parse(lines.find((line) => line.includes('"kind":"table"')));
const header = table.values[0];
const rows = table.values.slice(1);
const col = (name) => header.indexOf(name);

function parseZipName(zipName) {
  const match = String(zipName).match(/^(.*?)-初中-语文-(七年级|八年级|九年级)-(上学期|下学期)-(\d+)版$/);
  if (!match) return null;
  return {
    version: match[1],
    grade: match[2],
    term: match[3] === '上学期' ? '上册' : '下册',
    year: Number(match[4]),
  };
}

function cleanText(value) {
  return String(value || '')
    .replace(/<[^>]+>/g, '')
    .replace(/[　]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const latest = new Map();
rows.forEach((row) => {
  const parsed = parseZipName(row[col('大同步zip包名')]);
  if (!parsed || !parsed.version.includes('人教')) return;
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
  const catalog = cleanText(row[col('目录')]);
  const unit = cleanText(row[col('单元')]);
  const jie = cleanText(row[col('节')]);
  const label = cleanText(row[col('视频标签')]);
  const name = cleanText(row[col('视频名称')]) || label;
  if (!catalog || (!unit && !jie)) return;
  const section = jie || unit;
  const task = jie ? unit : '';
  const key = [parsed.version, parsed.grade, parsed.term, catalog, task, section].join('|');
  if (!grouped.has(key)) {
    grouped.set(key, {
      version: parsed.version,
      grade: parsed.grade,
      term: parsed.term,
      catalog,
      task,
      section,
      videos: [],
      seen: new Set(),
    });
  }
  const topic = grouped.get(key);
  const videoKey = `${label}|${name}`;
  if (topic.seen.has(videoKey)) return;
  topic.seen.add(videoKey);
  topic.videos.push({ tag: label || name, title: name });
});

const topics = [...grouped.values()].map(({ seen, ...topic }) => topic);
const outPath = path.join(__dirname, '../data/juniorChineseSyncVideos.ts');
const file = `export interface JuniorChineseSyncVideo {
  tag: string;
  title: string;
}

export interface JuniorChineseSyncTopic {
  version: string;
  grade: string;
  term: string;
  catalog: string;
  task: string;
  section: string;
  videos: JuniorChineseSyncVideo[];
}

/** 来源：初中-语文-视频样例.xlsx，取人教版各年级学期最新版。目录=章，单元=课文/任务，节有值时作为课文入口。 */
export const JUNIOR_CHINESE_SYNC_TOPICS: JuniorChineseSyncTopic[] = ${JSON.stringify(topics, null, 2)};

export function getJuniorChineseSyncTopics(grade: string, term: string, version = '人教版'): JuniorChineseSyncTopic[] {
  return JUNIOR_CHINESE_SYNC_TOPICS.filter(
    (topic) => topic.grade === grade && topic.term === term && topic.version === version,
  );
}

export function getJuniorChineseTextbookVersions(grade: string, term: string): string[] {
  return [...new Set(
    JUNIOR_CHINESE_SYNC_TOPICS
      .filter((topic) => topic.grade === grade && topic.term === term)
      .map((topic) => topic.version),
  )];
}
`;

fs.writeFileSync(outPath, file);
console.log('topics', topics.length, 'videos', topics.reduce((sum, topic) => sum + topic.videos.length, 0));
console.log('written', outPath);
