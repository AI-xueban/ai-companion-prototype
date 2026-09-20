const fs = require('fs');
const path = require('path');

const source =
  'c:/Users/谭江庆/Documents/AI伴学/outputs/split_video_samples/初中-数学-视频样例.xlsx.inspect.ndjson';
const lines = fs.readFileSync(source, 'utf8').split(/\n/).filter(Boolean);
const table = JSON.parse(lines.find((line) => line.includes('"kind":"table"')));
const header = table.values[0];
const rows = table.values.slice(1);
const col = (name) => header.indexOf(name);

const TYPE_SUFFIXES = ['知识精讲', '经典题型', '拓展提升', '新课标新考法'];

function parseZipName(zipName) {
  const match = String(zipName).match(/^(.*?)-初中-数学-(七年级|八年级|九年级)-(上学期|下学期)-(\d+)版$/);
  if (!match) return null;
  return {
    version: match[1],
    grade: match[2],
    term: match[3] === '上学期' ? '上册' : '下册',
    year: Number(match[4]),
  };
}

function parseUnitTitle(unit) {
  const first = String(unit).split('——')[0];
  return first.replace(/^\d+\s*/, '').replace(/^\d+　/, '').trim();
}

function formatCatalog(catalog) {
  return String(catalog).replace(/[　\s]+/g, ' · ').replace(/^· /, '');
}

function topicFromLabel(label) {
  for (const suffix of TYPE_SUFFIXES) {
    if (label.endsWith(`-${suffix}`)) return label.slice(0, -(suffix.length + 1));
  }
  return label;
}

const latest = new Map();
rows.forEach((row) => {
  const parsed = parseZipName(row[col('大同步zip包名')]);
  if (!parsed || parsed.version !== '北师大版') return;
  const key = `${parsed.grade}|${parsed.term}`;
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
  const catalog = String(row[col('目录')] ?? '');
  const unit = String(row[col('单元')] ?? '');
  const label = String(row[col('视频标签')] ?? '');
  const name = String(row[col('视频名称')] ?? label);
  const topic = topicFromLabel(label);
  const key = [parsed.grade, parsed.term, catalog, unit, topic].join('|');
  if (!grouped.has(key)) {
    grouped.set(key, {
      version: parsed.version,
      grade: parsed.grade,
      term: parsed.term,
      catalog,
      catalogLabel: formatCatalog(catalog),
      unit,
      unitTitle: parseUnitTitle(unit),
      topic,
      videos: [],
    });
  }
  grouped.get(key).videos.push({ label, name });
});

const topics = [...grouped.values()];
const outPath = path.join(__dirname, '../data/juniorMathSyncVideos.ts');
const file = `export interface JuniorMathSyncVideo {
  label: string;
  name: string;
}

export interface JuniorMathSyncTopic {
  version: string;
  grade: string;
  term: string;
  catalog: string;
  catalogLabel: string;
  unit: string;
  unitTitle: string;
  topic: string;
  videos: JuniorMathSyncVideo[];
}

/** 来源：初中-数学-视频样例.xlsx，取北师大版各年级学期最新版。节字段为空。 */
export const JUNIOR_MATH_SYNC_TOPICS: JuniorMathSyncTopic[] = ${JSON.stringify(topics, null, 2)};

export const JUNIOR_MATH_VIDEO_TYPE_SUFFIXES = ${JSON.stringify(TYPE_SUFFIXES)};

export function formatJuniorMathVideoLabel(label: string): string {
  for (const suffix of JUNIOR_MATH_VIDEO_TYPE_SUFFIXES) {
    if (label.endsWith('-' + suffix)) return label.slice(0, -(suffix.length + 1)) + ' · ' + suffix;
  }
  return label;
}

export function getJuniorMathSyncTopics(grade: string, term: string, version = '北师大版'): JuniorMathSyncTopic[] {
  return JUNIOR_MATH_SYNC_TOPICS.filter(
    (topic) => topic.grade === grade && topic.term === term && topic.version === version,
  );
}
`;

fs.writeFileSync(outPath, file);
console.log('topics', topics.length, 'videos', topics.reduce((sum, topic) => sum + topic.videos.length, 0));
console.log('written', outPath);
