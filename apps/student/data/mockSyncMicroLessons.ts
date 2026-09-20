import type { SyncMicroLesson, SyncMicroLessonResponse } from '../types/syncMicroLesson';

/** 真实接口样例 · 整章课时列表（与用户提供的 JSON 一致） */
export const MOCK_SYNC_LESSONS_SAMPLE: SyncMicroLesson[] = [
  {
    id: 35444834,
    title: '1.1 亿以内数的认识',
    cover_url:
      'https://vodsource.xkw.com/xkw-media/c38c11b3-452e-488e-8ce1-7ad13970ad9a/da5be658-6f28-48ee-ade7-e9f75fb99191-00001.jpg?auth_key=1782388925-0_972015edd96c4341b2e5760df6becdab_0-2aa8c26828c7eaf6b87604df3fd41a64-547c9250801eb6027809fcc97760109c',
    kpoint_list: [
      { id: 73923, title: '数十万以内的数' },
      { id: 73925, title: '亿以内数的组成' },
    ],
  },
  {
    id: 35444850,
    title: '1.2 亿以内的数的读法',
    cover_url:
      'https://vodsource.xkw.com/xkw-media/b26c1842-d83f-4a88-9fe1-3e1c1d74aab0/33c515c8-26db-4556-a6eb-74101809bad1-00001.jpg?auth_key=1782388925-0_17cc8e2218bb4fea940bfe006a9c81a3_0-2aa8c26828c7eaf6b87604df3fd41a64-2e27acde703ef9286f2dee367129b9fb',
    kpoint_list: [{ id: 73924, title: '亿以内数的读、写法' }],
  },
  {
    id: 35477235,
    title: '1.3 亿以内的数的写法',
    cover_url:
      'https://vodsource.xkw.com/xkw-media/acd6a9ce-8653-42df-863b-332f54d5ae8b/9e0a8b7c-7524-4cf5-a804-1e2380d2bb0e-00001.jpg?auth_key=1782388925-0_207f293dafeb4579b5110a916b0adc87_0-2aa8c26828c7eaf6b87604df3fd41a64-46a7a34f60cfb0c46e54b7ce12302fc9',
    kpoint_list: [{ id: 73924, title: '亿以内数的读、写法' }],
  },
  {
    id: 35444864,
    title: '1.4 亿以内的数的比较大小',
    cover_url:
      'https://vodsource.xkw.com/xkw-media/81760576-b8d3-4ebe-a081-9b71c7332111/75f4566e-48e1-4e69-a707-eff616138663-00001.jpg?auth_key=1782388925-0_1533e10697f844f384f22e16cdc9d5bd_0-2aa8c26828c7eaf6b87604df3fd41a64-995206dd816a6561371b5c1748289b19',
    kpoint_list: [
      { id: 66789, title: '整数大小的比较' },
      { id: 73933, title: '大数的比较' },
    ],
  },
  {
    id: 35444873,
    title: '1.5 将数改写成以万作单位的数',
    cover_url:
      'https://vodsource.xkw.com/xkw-media/2b5a597e-9406-4981-9d8b-0b087c7104bb/a1185c78-84c6-4b7b-ba03-f27e9bde3ecc-00001.jpg?auth_key=1782388925-0_6af916d72b10435f9749739819d83541_0-2aa8c26828c7eaf6b87604df3fd41a64-42d1cb8f522eb9ff0887f1113004c1e0',
    kpoint_list: [{ id: 73931, title: '整数的数级、数位和计数单位的认识' }],
  },
  {
    id: 35476973,
    title: '1.6 近似数',
    cover_url:
      'https://vodsource.xkw.com/xkw-media/6851ff36-7a4d-4490-9bb1-cc72f9b50da8/a09cc584-0681-4afd-bc85-625c0d2e45ba-00001.jpg?auth_key=1782388925-0_9b2c78137e704154aad61c174296d1c9_0-2aa8c26828c7eaf6b87604df3fd41a64-7e137168c20571dd1cf2af432dd7d1e4',
    kpoint_list: [
      { id: 73923, title: '数十万以内的数' },
      { id: 73924, title: '亿以内数的读、写法' },
      { id: 73925, title: '亿以内数的组成' },
      { id: 73931, title: '整数的数级、数位和计数单位的认识' },
      { id: 73958, title: '整数的改写' },
      { id: 73959, title: '整数的近似数' },
    ],
  },
];

/** 完整 API 响应样例 · { code, msg, data } */
export const MOCK_SYNC_LESSON_API_RESPONSE: SyncMicroLessonResponse = {
  code: 2000000,
  msg: 'success',
  data: MOCK_SYNC_LESSONS_SAMPLE,
};

function withDuration(lessons: SyncMicroLesson[]): SyncMicroLesson[] {
  return lessons.map((lesson) => ({
    ...lesson,
    duration_sec: lesson.duration_sec ?? 240 + (lesson.id % 5) * 60,
  }));
}

/** 原型默认播放列表 · 任意章节无数据时回退 */
export function getDemoSyncMicroLessons(): SyncMicroLesson[] {
  return withDuration(MOCK_SYNC_LESSON_API_RESPONSE.data);
}

export function parseSyncMicroLessonResponse(payload: SyncMicroLessonResponse): SyncMicroLesson[] {
  if (payload.code !== 2000000 || !Array.isArray(payload.data)) return [];
  return withDuration(payload.data);
}

/** 为演示播放列表预置观看进度 */
export function seedDemoSyncLessonProgress() {
  const demoRatios = [0.82, 0.38, 0, 0.55, 0.12, 0];
  getDemoSyncMicroLessons().forEach((lesson, index) => {
    const key = `sync-lesson-progress-${lesson.id}`;
    if (localStorage.getItem(key)) return;
    const durationSec = lesson.duration_sec ?? 360;
    const ratio = demoRatios[index] ?? 0;
    if (ratio <= 0) return;
    localStorage.setItem(
      key,
      JSON.stringify({
        currentSec: Math.round(durationSec * ratio),
        effectiveSec: Math.round(durationSec * ratio),
        durationSec,
        maxPlayedSec: Math.round(durationSec * ratio),
        updatedAt: Date.now() - (index + 1) * 86400000,
      }),
    );
  });
}

/** 四年级上 · 三乘法 · 卫星运行时间（catalog 117513） */
const MOCK_LESSONS_SATELLITE: SyncMicroLesson[] = [
  {
    id: 9001001,
    title: '卫星运行时间 · 笔算乘法',
    cover_url: MOCK_SYNC_LESSONS_SAMPLE[0].cover_url,
    kpoint_list: [
      { id: 74152, title: '三位数与两位数的乘法' },
      { id: 74154, title: '三位数乘两位数，乘数末尾有0' },
    ],
  },
  {
    id: 9001002,
    title: '卫星运行时间 · 估算与应用',
    cover_url: MOCK_SYNC_LESSONS_SAMPLE[3].cover_url,
    kpoint_list: [
      { id: 74197, title: '三位数乘两位数的估算' },
      { id: 74156, title: '三位数乘两位数的实际问题' },
    ],
  },
];

/** 有多少名观众 · 单课时直进播放 */
const MOCK_LESSON_AUDIENCE: SyncMicroLesson[] = [
  {
    id: 9002001,
    title: '有多少名观众 · 估算策略',
    cover_url: MOCK_SYNC_LESSONS_SAMPLE[1].cover_url,
    kpoint_list: [{ id: 105250, title: '用估算解决实际问题（乘法）' }],
  },
];

const CATALOG_LESSON_MAP: Record<string, SyncMicroLesson[]> = {
  '2964-117513': MOCK_LESSONS_SATELLITE,
  '2964-117516': MOCK_LESSON_AUDIENCE,
  /** 一 认识更大的数 · 整章 */
  '2964-117464': MOCK_SYNC_LESSONS_SAMPLE,
  /** 认识更大的数 · 节 */
  '2964-117469': [MOCK_SYNC_LESSONS_SAMPLE[0]],
  '2964-117480': [MOCK_SYNC_LESSONS_SAMPLE[5]],
};

export function getMockLessonsForCatalog(
  textbookId: number,
  chapterId: number,
  sectionId?: number,
): SyncMicroLesson[] {
  const sectionKey = sectionId ? `${textbookId}-${sectionId}` : null;
  if (sectionKey && CATALOG_LESSON_MAP[sectionKey]) {
    return withDuration(CATALOG_LESSON_MAP[sectionKey]);
  }
  const chapterKey = `${textbookId}-${chapterId}`;
  if (CATALOG_LESSON_MAP[chapterKey]) {
    return withDuration(CATALOG_LESSON_MAP[chapterKey]);
  }
  if (textbookId === 2964) {
    return getDemoSyncMicroLessons();
  }
  return getDemoSyncMicroLessons();
}
