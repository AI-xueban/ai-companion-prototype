const fs = require('fs');

function inspect(source, title) {
  const lines = fs.readFileSync(source, 'utf8').split(/\n/).filter(Boolean);
  const table = JSON.parse(lines.find((line) => line.includes('"kind":"table"')));
  const header = table.values[0];
  const rows = table.values.slice(1);
  const col = (name) => header.indexOf(name);
  console.log('\n################', title);
  console.log('header', header);
  console.log('rows', rows.length);

  const zips = new Map();
  const empty = { catalog: 0, unit: 0, jie: 0 };
  rows.forEach((row) => {
    const zip = String(row[col('大同步zip包名')] || '');
    zips.set(zip, (zips.get(zip) || 0) + 1);
    if (!row[col('目录')]) empty.catalog += 1;
    if (!row[col('单元')]) empty.unit += 1;
    if (!row[col('节')]) empty.jie += 1;
  });
  console.log('empty', empty);
  console.log('zips');
  [...zips.keys()].sort((a, b) => a.localeCompare(b, 'zh')).forEach((zip) => console.log(' ', zip, zips.get(zip)));

  function parseZip(zipName) {
    const match = String(zipName).match(/^(.*?)-(小学|初中)-语文-(一年级|二年级|三年级|四年级|五年级|六年级|七年级|八年级|九年级)-(上学期|下学期)-(\d+)版$/);
    if (!match) return null;
    return {
      version: match[1],
      stage: match[2],
      grade: match[3],
      term: match[4] === '上学期' ? '上册' : '下册',
      year: Number(match[5]),
    };
  }

  const latest = new Map();
  rows.forEach((row) => {
    const parsed = parseZip(row[col('大同步zip包名')]);
    if (!parsed) return;
    const key = `${parsed.version}|${parsed.grade}|${parsed.term}`;
    const prev = latest.get(key);
    if (!prev || parsed.year > prev.year) latest.set(key, { ...parsed, zipName: row[col('大同步zip包名')] });
  });

  const targets = [...latest.values()].filter((item) =>
    (item.grade === '七年级' && item.term === '上册' && item.version.includes('人教'))
    || (title.includes('小学') && item.grade === '六年级' && item.term === '上册' && item.version === '人教版'),
  );

  if (!targets.length) {
    console.log('no target books');
    return;
  }

  targets.forEach((book) => {
    const sample = rows.filter((row) => row[col('大同步zip包名')] === book.zipName);
    console.log('\n========', book.zipName, 'rows', sample.length);
    const catalogs = new Map();
    sample.forEach((row) => {
      const catalog = String(row[col('目录')] || '(空目录)');
      const unit = String(row[col('单元')] || '(空单元)');
      const jie = String(row[col('节')] || '(空节)');
      const tag = String(row[col('视频标签')] || '');
      const name = String(row[col('视频名称')] || '');
      if (!catalogs.has(catalog)) catalogs.set(catalog, new Map());
      const units = catalogs.get(catalog);
      if (!units.has(unit)) units.set(unit, []);
      units.get(unit).push({ jie, tag, name });
    });
    console.log('章数', catalogs.size);
    [...catalogs.entries()].forEach(([catalog, units]) => {
      console.log('\n章:', catalog, '| 课文/条目', units.size);
      [...units.entries()].forEach(([unit, videos]) => {
        const tags = [...new Set(videos.map((item) => item.tag))];
        const jies = [...new Set(videos.map((item) => item.jie))];
        console.log('  课文:', unit, '| 节字段', jies.join(','), '| 标签', tags.join(' → '));
      });
    });
  });
}

inspect(
  'c:/Users/谭江庆/Documents/AI伴学/outputs/split_video_samples/小学-语文-视频样例.xlsx.inspect.ndjson',
  '小学语文',
);
inspect(
  'c:/Users/谭江庆/Documents/AI伴学/outputs/split_video_samples/初中-语文-视频样例.xlsx.inspect.ndjson',
  '初中语文',
);
