export type DiscoveryArticleCategory =
  | 'CAMPUS_NEWS'
  | 'CURRENT_EVENTS'
  | 'SCIENCE'
  | 'LITERATURE'
  | 'BILINGUAL'
  | 'WELLNESS'
  | 'CHARITY';

export const DISCOVERY_IMAGE_VERSION = 'title-theme-v4';

export type DiscoveryImageRef = {
  id: string;
  title: string;
  category: DiscoveryArticleCategory;
  shortVideo?: { isShort?: boolean };
};

/** 主题图库（与文章主题一致，可直链） */
const TOPIC = {
  spaceStation: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa',
  rocketLaunch: 'https://images.unsplash.com/photo-1516849841032-87cbac4d88f7',
  astronautEarth: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa',
  nebula: 'https://images.unsplash.com/photo-1462332420958-a05d1e002413',
  blackHole: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564',
  lightSpeed: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
  penguin: 'https://images.unsplash.com/photo-1551969001-9a6223581529',
  rainbow: 'https://images.unsplash.com/photo-1501854140801-50d01698950b',
  bloodCirculation: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8',
  plant: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b',
  dinosaur: 'https://images.unsplash.com/photo-1516912481808-3406841bd33c',
  bee: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64',
  recycling: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b',
  oceanClean: 'https://images.unsplash.com/photo-1621451537084-482c73073a0f',
  scienceFair: 'https://images.unsplash.com/photo-1518770660439-4636190af475',
  olympics: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211',
  deliveryDrone: 'https://images.unsplash.com/photo-1527430253228-e93688616381',
  aiClassroom: 'https://images.unsplash.com/photo-1584697964358-3e14ca57658b',
  riverEco: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
  schoolArt: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f',
  schoolClub: 'https://images.unsplash.com/photo-1523050854058-5079616a0a5e',
  examClass: 'https://images.unsplash.com/photo-1434030218751-7a072f75c938',
  trackRace: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b',
  fieldTrip: 'https://images.unsplash.com/photo-1447750364198-3496a6b2b5c6',
  autumnLeaf: 'https://images.unsplash.com/photo-1508896731775-f6f03f04f1a9',
  summer: 'https://images.unsplash.com/photo-1516054778171-03bfa9a5a5d4',
  lotus: 'https://images.unsplash.com/photo-1474488672901-3a08903c63fe',
  trainStation: 'https://images.unsplash.com/photo-1518709268805-4e9042af9a82',
  clockTime: 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3',
  garden: 'https://images.unsplash.com/photo-1495020689067-958852a7765e',
  englishStudy: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8',
  parisOlympics: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485',
  youthFuture: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac',
  sustainability: 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9',
  starship: 'https://images.unsplash.com/photo-1457364887197-9150188c107b',
  aiBrain: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01',
  greenMountains: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e',
  climateSummit: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7',
  notebook: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8',
  tomatoTimer: 'https://images.unsplash.com/photo-1506784693919-ef06d93c28d2',
  booksCross: 'https://images.unsplash.com/photo-1481627834875-b7833e8f5570',
  teenEmotion: 'https://images.unsplash.com/photo-1499203692895-7f55fd48a31e',
  listening: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac',
  criticalThinking: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40',
  planner: 'https://images.unsplash.com/photo-1506784365847-60b3559f633c',
  faceAi: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01',
  starBirth: 'https://images.unsplash.com/photo-1462332420958-a05d1e002413',
  earthCore: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa',
  libraryCorner: 'https://images.unsplash.com/photo-1481627834875-b7833e8f5570',
  multimediaRoom: 'https://images.unsplash.com/photo-1523050854058-5079616a0a5e',
  deskLamp: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b',
  reportDoc: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40',
  cnFlagSchool: 'https://images.unsplash.com/photo-1770198638064-588d85904c9a',
  cnRedScarf:
    'https://upload.wikimedia.org/wikipedia/commons/0/0e/Young_Pioneers_of_China%2C_School_Opening.jpg',
  cnSzUniform:
    'https://upload.wikimedia.org/wikipedia/commons/b/ba/Shenzhen_Middle_Schools_Summer_Uniform_201709.jpg',
};

/**
 * 每篇文章固定主题封面（优先于关键词规则）
 * 与 mockDiscoveryData 中 title 一一对应
 */
const ARTICLE_COVER_BY_ID: Record<string, string> = {
  'news-001': TOPIC.spaceStation,
  'sci-002': TOPIC.penguin,
  'sci-003': TOPIC.rainbow,
  'sci-004': TOPIC.blackHole,
  'sci-005': TOPIC.bloodCirculation,
  'sci-006': TOPIC.plant,
  'sci-007': TOPIC.dinosaur,
  'curr-001': TOPIC.recycling,
  'curr-002': TOPIC.oceanClean,
  'curr-003': TOPIC.scienceFair,
  'curr-004': TOPIC.olympics,
  'curr-005': TOPIC.deliveryDrone,
  'curr-006': TOPIC.rocketLaunch,
  'curr-007': TOPIC.aiClassroom,
  'curr-008': TOPIC.riverEco,
  'news-002': TOPIC.schoolArt,
  'camp-002': TOPIC.schoolClub,
  'camp-003': TOPIC.examClass,
  'camp-004': TOPIC.trackRace,
  'camp-005': TOPIC.fieldTrip,
  'lit-001': TOPIC.autumnLeaf,
  'lit-002': TOPIC.summer,
  'lit-003': TOPIC.lotus,
  'lit-004': TOPIC.trainStation,
  'lit-005': TOPIC.clockTime,
  'lit-006': TOPIC.garden,
  'bili-001': TOPIC.englishStudy,
  'bili-002': TOPIC.parisOlympics,
  'bili-004': TOPIC.sustainability,
  'bili-005': TOPIC.starship,
  'bili-006': TOPIC.aiBrain,
  'bili-008': TOPIC.climateSummit,
  'well-001': TOPIC.notebook,
  'well-002': TOPIC.tomatoTimer,
  'well-003': TOPIC.booksCross,
  'well-004': TOPIC.teenEmotion,
  'well-005': TOPIC.listening,
  'well-006': TOPIC.criticalThinking,
  'well-007': TOPIC.planner,
  'short-001': TOPIC.faceAi,
  'short-002': TOPIC.starBirth,
  'short-003': TOPIC.bee,
  'short-004': TOPIC.earthCore,
  'short-005': TOPIC.lightSpeed,
  'charity-fb-001': TOPIC.libraryCorner,
  'charity-fb-002': TOPIC.multimediaRoom,
  'charity-fb-003': TOPIC.deskLamp,
  'charity-fb-004': TOPIC.reportDoc,
};

/** 公益反馈（mockCharityData） */
const CHARITY_FEEDBACK_COVERS: Record<string, string> = {
  'fb-001': TOPIC.libraryCorner,
  'fb-002': TOPIC.multimediaRoom,
  'fb-003': TOPIC.deskLamp,
  'fb-004': TOPIC.reportDoc,
};

type TitleRule = { test: RegExp; images: string[] };

const TITLE_RULES: TitleRule[] = [
  { test: /神舟|飞船|太空|宇航|返航|着陆|卫星|火箭|空间站|星舰/, images: [TOPIC.spaceStation, TOPIC.rocketLaunch] },
  { test: /企鹅/, images: [TOPIC.penguin] },
  { test: /彩虹/, images: [TOPIC.rainbow] },
  { test: /黑洞|恒星|宇宙|光速|磁场/, images: [TOPIC.blackHole, TOPIC.nebula, TOPIC.lightSpeed] },
  { test: /血液|人体|循环/, images: [TOPIC.bloodCirculation] },
  { test: /植物|记忆/, images: [TOPIC.plant] },
  { test: /恐龙/, images: [TOPIC.dinosaur] },
  { test: /蜜蜂|舞蹈/, images: [TOPIC.bee] },
  { test: /人脸|AI如何|深度学习/, images: [TOPIC.faceAi, TOPIC.aiBrain] },
  { test: /垃圾分类|环保/, images: [TOPIC.recycling] },
  { test: /海洋|垃圾带/, images: [TOPIC.oceanClean] },
  { test: /创新大赛|科技/, images: [TOPIC.scienceFair] },
  { test: /奥运/, images: [TOPIC.olympics, TOPIC.parisOlympics] },
  { test: /无人配送|配送/, images: [TOPIC.deliveryDrone] },
  { test: /AI写作|人工智能|Artificial/, images: [TOPIC.aiClassroom, TOPIC.aiBrain] },
  { test: /长江|生态|绿水青山/, images: [TOPIC.riverEco, TOPIC.greenMountains] },
  { test: /艺术节|社团|机器人社/, images: [TOPIC.schoolArt, TOPIC.schoolClub] },
  { test: /期中|考试|成绩/, images: [TOPIC.examClass] },
  { test: /运动会|百米|校纪录/, images: [TOPIC.trackRace] },
  { test: /科考|日记/, images: [TOPIC.fieldTrip] },
  { test: /落叶|秋天/, images: [TOPIC.autumnLeaf] },
  { test: /盛夏/, images: [TOPIC.summer] },
  { test: /荷塘/, images: [TOPIC.lotus] },
  { test: /背影/, images: [TOPIC.trainStation] },
  { test: /匆匆/, images: [TOPIC.clockTime] },
  { test: /百草园|三味书屋/, images: [TOPIC.garden] },
  { test: /Innovation|每日一词/, images: [TOPIC.englishStudy] },
  { test: /巴黎|闭幕式|双语资讯/, images: [TOPIC.parisOlympics] },
  { test: /Sustainability|可持续/, images: [TOPIC.sustainability] },
  { test: /马斯克|星舰/, images: [TOPIC.starship] },
  { test: /气候|峰会/, images: [TOPIC.climateSummit] },
  { test: /康奈尔|笔记/, images: [TOPIC.notebook] },
  { test: /番茄/, images: [TOPIC.tomatoTimer] },
  { test: /跨学科|阅读/, images: [TOPIC.booksCross] },
  { test: /情绪|冲动/, images: [TOPIC.teenEmotion] },
  { test: /沟通|倾听/, images: [TOPIC.listening] },
  { test: /批判|思维/, images: [TOPIC.criticalThinking] },
  { test: /时间|象限|焦虑/, images: [TOPIC.planner] },
  { test: /图书|图书角/, images: [TOPIC.libraryCorner] },
  { test: /多媒体|教室/, images: [TOPIC.multimediaRoom] },
  { test: /护眼|台灯/, images: [TOPIC.deskLamp] },
  { test: /资助|月报|公示/, images: [TOPIC.reportDoc] },
  { test: /感谢|公益|爱心/, images: [TOPIC.libraryCorner, TOPIC.cnRedScarf] },
];

const CATEGORY_DEFAULT: Record<DiscoveryArticleCategory, string[]> = {
  CAMPUS_NEWS: [TOPIC.cnFlagSchool, TOPIC.schoolArt, TOPIC.trackRace],
  CURRENT_EVENTS: [TOPIC.cnFlagSchool, TOPIC.scienceFair, TOPIC.olympics],
  SCIENCE: [TOPIC.scienceFair, TOPIC.plant, TOPIC.spaceStation],
  LITERATURE: [TOPIC.garden, TOPIC.lotus, TOPIC.autumnLeaf],
  BILINGUAL: [TOPIC.englishStudy, TOPIC.cnSzUniform, TOPIC.youthFuture],
  WELLNESS: [TOPIC.notebook, TOPIC.planner, TOPIC.teenEmotion],
  CHARITY: [TOPIC.libraryCorner, TOPIC.cnRedScarf, TOPIC.multimediaRoom],
};

const hashSeed = (seed: string): number =>
  seed.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

const resolveArticleId = (seed: string): string => {
  const blockIdx = seed.indexOf('-block-');
  if (blockIdx > 0) return seed.slice(0, blockIdx);
  return seed;
};

const withImageVersion = (url: string): string => {
  try {
    const u = new URL(url);
    u.searchParams.set('dv', DISCOVERY_IMAGE_VERSION);
    return u.toString();
  } catch {
    return url;
  }
};

const lookupCoverById = (articleId: string, variant: number): string | undefined => {
  const direct = ARTICLE_COVER_BY_ID[articleId];
  if (direct) return withImageVersion(direct);

  const charityKey = articleId.replace(/^charity-/, '');
  const charity = CHARITY_FEEDBACK_COVERS[charityKey];
  if (charity) return withImageVersion(charity);

  return undefined;
};

/** 按文章 id / 标题匹配主题配图；variant>0 时跳过固定 id，换同主题备选图 */
export const pickTitleMatchedCover = (
  title: string,
  category: DiscoveryArticleCategory,
  seed = '',
  variant = 0,
  skipNormalized?: string
): string => {
  const articleId = resolveArticleId(seed);
  const normSkip = skipNormalized ? normalizeDiscoveryImageUrl(skipNormalized) : '';

  if (variant === 0) {
    const byId = lookupCoverById(articleId, variant);
    if (byId && normalizeDiscoveryImageUrl(byId) !== normSkip) return byId;
  }

  const rule = TITLE_RULES.find((r) => r.test.test(title));
  const pool = rule?.images ?? CATEGORY_DEFAULT[category] ?? CATEGORY_DEFAULT.CAMPUS_NEWS;
  for (let i = 0; i < pool.length; i++) {
    const idx = (hashSeed(`${title}-${seed}`) + variant + i) % pool.length;
    const url = withImageVersion(pool[idx]);
    if (normalizeDiscoveryImageUrl(url) !== normSkip) return url;
  }

  const fallback = CATEGORY_DEFAULT[category][0];
  return withImageVersion(fallback);
};

export const normalizeDiscoveryImageUrl = (url: string): string => {
  try {
    const u = new URL(url);
    ['w', 'h', 'fit', 'q', 'auto', 'dv', 't'].forEach((k) => u.searchParams.delete(k));
    return u.toString();
  } catch {
    return url.split('?')[0];
  }
};

const buildPollinationsPrompt = (title: string, category: DiscoveryArticleCategory): string => {
  return [
    'Educational illustration for Chinese students ages 8-16,',
    `visual theme must clearly depict: ${title},`,
    `content category: ${category},`,
    'vivid colors, appropriate for school reading app, no text overlay, no watermark',
  ].join(' ');
};

/** 按标题 AI 生成配图（加载失败时的重新生成） */
export const getPollinationsCoverUrl = (
  title: string,
  category: DiscoveryArticleCategory,
  aspect: 'landscape' | 'portrait' = 'landscape',
  retryIndex = 0
): string => {
  const prompt = buildPollinationsPrompt(title, category);
  const w = aspect === 'portrait' ? 600 : 800;
  const h = aspect === 'portrait' ? 1067 : 450;
  const seed = hashSeed(`${title}-${category}-${retryIndex}`);
  const base = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`;
  return withImageVersion(
    `${base}?width=${w}&height=${h}&nologo=true&seed=${seed}&model=flux&enhance=false`
  );
};

/** 最终兜底：本地 SVG，保证永不裂图 */
export const getTopicPlaceholderDataUrl = (
  title: string,
  aspect: 'landscape' | 'portrait' = 'landscape'
): string => {
  const w = aspect === 'portrait' ? 600 : 800;
  const h = aspect === 'portrait' ? 1067 : 450;
  const hue = hashSeed(title) % 360;
  const safe = title.slice(0, 14).replace(/[<>&"']/g, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
  <stop offset="0%" style="stop-color:hsl(${hue},55%,88%)"/>
  <stop offset="100%" style="stop-color:hsl(${(hue + 40) % 360},50%,72%)"/>
  </linearGradient></defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <text x="50%" y="48%" text-anchor="middle" fill="hsl(${hue},35%,35%)" font-size="${aspect === 'portrait' ? 28 : 36}" font-family="sans-serif" font-weight="600">${safe}</text>
  <text x="50%" y="58%" text-anchor="middle" fill="hsl(${hue},25%,50%)" font-size="18" font-family="sans-serif">主题配图</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

/**
 * 加载失败后取下一张可用封面（已失败的 URL 会跳过）
 * 顺序：同主题备选实拍 → 按标题生成图（最多 3 次）→ 本地占位
 */
export const getNextDiscoveryCoverSrc = (
  article: DiscoveryImageRef,
  aspect: 'landscape' | 'portrait',
  failedUrls: ReadonlySet<string>,
  stageIndex: number
): string => {
  const isFailed = (url: string) => failedUrls.has(normalizeDiscoveryImageUrl(url));

  for (let v = 1; v <= 4; v++) {
    const raw = pickTitleMatchedCover(article.title, article.category, article.id, v);
    const sized = aspect === 'portrait' ? toPortraitCoverUrl(raw) : toLandscapeCoverUrl(raw);
    if (!isFailed(sized)) return sized;
  }

  const genStart = Math.max(0, stageIndex - 1);
  for (let g = genStart; g < genStart + 3; g++) {
    const raw = getPollinationsCoverUrl(article.title, article.category, aspect, g);
    const sized = aspect === 'portrait' ? toPortraitCoverUrl(raw) : toLandscapeCoverUrl(raw);
    const bust = `${sized}${sized.includes('?') ? '&' : '?'}t=${Date.now()}-${g}`;
    if (!isFailed(bust)) return bust;
  }

  return getTopicPlaceholderDataUrl(article.title, aspect);
};

export const resolveDiscoveryCoverUrl = (
  article: DiscoveryImageRef,
  variant = 0
): string => {
  const aspect = article.shortVideo?.isShort ? 'portrait' : 'landscape';
  const raw = pickTitleMatchedCover(article.title, article.category, article.id, variant);
  return aspect === 'portrait' ? toPortraitCoverUrl(raw) : toLandscapeCoverUrl(raw);
};

/** @deprecated 请使用 getNextDiscoveryCoverSrc */
export const getDiscoveryCoverFallback = (
  ref: string | DiscoveryImageRef,
  failedSrc?: string,
  attempt = 1
): string => {
  const article: DiscoveryImageRef =
    typeof ref === 'string'
      ? { id: ref, title: ref, category: 'CAMPUS_NEWS' }
      : ref;
  const aspect = article.shortVideo?.isShort ? 'portrait' : 'landscape';
  const failed = new Set<string>();
  if (failedSrc) failed.add(normalizeDiscoveryImageUrl(failedSrc));
  return getNextDiscoveryCoverSrc(article, aspect, failed, attempt);
};

export const toLandscapeCoverUrl = (url: string): string => {
  if (url.includes('pollinations.ai')) return url;
  try {
    const u = new URL(url);
    u.searchParams.set('w', '800');
    u.searchParams.set('h', '450');
    u.searchParams.set('fit', 'crop');
    if (!u.searchParams.has('q')) u.searchParams.set('q', '80');
    return u.toString();
  } catch {
    return url;
  }
};

export const toPortraitCoverUrl = (url: string): string => {
  if (url.includes('pollinations.ai')) return url;
  try {
    const u = new URL(url);
    u.searchParams.set('w', '600');
    u.searchParams.set('h', '1067');
    u.searchParams.set('fit', 'crop');
    if (!u.searchParams.has('q')) u.searchParams.set('q', '80');
    return u.toString();
  } catch {
    return url;
  }
};

export const resolveDiscoveryBlockImageUrl = (
  article: DiscoveryImageRef,
  blockIndex: number
): string =>
  toLandscapeCoverUrl(
    pickTitleMatchedCover(
      article.title,
      article.category,
      `${article.id}-block-${blockIndex}`,
      blockIndex % 2
    )
  );
