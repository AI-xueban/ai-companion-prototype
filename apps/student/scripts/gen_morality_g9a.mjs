// 一次性生成脚本：从 九年级上 道德与法治 JSON 生成 TS 数据文件
import fs from 'node:fs';
import path from 'node:path';

const SRC = path.resolve(
  'e:/通晤纪/原型文件/AI学伴_0812/开发给的数据8.22/youxuepai_knowledge_tree_and_videos/videos_道德与法治_人教版_八年级_上学期.json',
);
const OUT = path.resolve(
  'e:/通晤纪/原型文件/AI学伴_0812/ai_friend_v2.0/data/juniorMoralitySyncG8A.ts',
);

const raw = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const data = raw.data;

// 按 unit -> lesson -> period(funCatalog) 分组，保留顺序
const units = [];
const unitMap = new Map();
for (const row of data) {
  const uTitle = row.unit;
  if (!unitMap.has(uTitle)) {
    const u = { title: uTitle, lessons: [] };
    unitMap.set(uTitle, u);
    units.push(u);
  }
  const u = unitMap.get(uTitle);
  let lesson = u.lessons.find((l) => l.title === row.lesson);
  if (!lesson) {
    lesson = { title: row.lesson, periods: [] };
    u.lessons.push(lesson);
  }
  const allVideos = (row.videos || []).flatMap((m) => (m.videoList || []).map((v) => ({
    id: v.videoId,
    title: v.videoTag,
  })));
  lesson.periods.push({
    title: row.funCatalog || row.lesson,
    videos: allVideos,
  });
}

// 生成 id
const cnNum = ['一', '二', '三', '四', '五', '六', '七', '八'];
const tsUnits = units.map((u, ui) => {
  const uid = `u${ui + 1}`;
  return {
    id: uid,
    title: u.title,
    lessons: u.lessons.map((l, li) => {
      const lid = `${uid}-l${li + 1}`;
      return {
        id: lid,
        title: l.title,
        periods: l.periods.map((p, pi) => ({
          id: `${lid}-p${pi + 1}`,
          title: p.title,
          videos: p.videos,
        })),
      };
    }),
  };
});

const lines = [];
lines.push(`// 自动生成自 videos_道德与法治_人教版_八年级_上学期.json`);
lines.push(`// 八年级上册 道德与法治（人教版）同步视频数据：单元 → 课 → 课时(funCatalog) → 视频(真实 videoId / videoTag)`);
lines.push(`import type { MoralityUnit } from './juniorMoralitySyncG7A';`);
lines.push('');
lines.push(`export const JUNIOR_MORALITY_SYNC_G8A: MoralityUnit[] = ${JSON.stringify(tsUnits, null, 2)};`);
lines.push('');

fs.writeFileSync(OUT, lines.join('\n'), 'utf8');
console.log('written:', OUT, 'units:', tsUnits.length);
