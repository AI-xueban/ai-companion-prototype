// MOCK DATA FOR "万象视界" (Myriad Horizon) Module

export type ArticleCategory =
  | 'CAMPUS_NEWS'
  | 'CURRENT_EVENTS'
  | 'SCIENCE'
  | 'LITERATURE'
  | 'BILINGUAL'      // 双语新知
  | 'WELLNESS'      // 素养成长
  | 'CHARITY';      // 爱心公告栏

export interface Vocabulary {
  word: string;
  pinyin: string;
  definition: string;
}

export type BilingualCardType = '每日一词' | '双语资讯';

export const BILINGUAL_CARD_TYPES: BilingualCardType[] = ['每日一词', '双语资讯'];

export interface BilingualCardData {
  type: BilingualCardType;
  english: string;        // 英文句 / 词
  chinese: string;        // 中文对照 / 释义
  pronunciation?: string; // 音标，仅每日一词
  exampleSentence?: string; // 例句，仅每日一词
  exampleTranslation?: string; // 例句释义，仅每日一词
}

export interface VideoCardData {
  duration: string;   // 例: "04:23"
  views: string;      // 例: "1.2万"
  likes: string;      // 例: "3200"
  favorites: string;  // 例: "1800"
  isVideo: true;
  portraitCover?: boolean; // 竖版封面居中裁切（瀑布流卡内展示短视频风格）
}

export interface WellnessCardData {
  gradeRange: string; // 例: "7-9年级"
  icon: string;       // emoji 图标
  colorClass: string; // Tailwind bg color class
}

export interface ShortVideoData {
  isShort: true;
  views: string;    // "5.6万"
  likes: string;    // "1.2万"
  favorites: string; // "6800"
  tags: string[];   // ["#科技", "#AI"]
  author: string;   // "@科技日报"
}

export interface Article {
  id: string;
  title: string;
  coverImage: string;
  category: ArticleCategory;
  publishDate: string;
  readCount: number;
  author: string;
  readTime: string;

  // Detail content
  content: string;
  blocks?: any[];

  vocabulary: Vocabulary[];
  relatedArticles: string[];

  // 双语新知专用
  bilingualCard?: BilingualCardData;

  // 科普探秘视频卡专用
  videoCard?: VideoCardData;

  // 素养成长专用
  wellnessCard?: WellnessCardData;

  // 科普短视频专用
  shortVideo?: ShortVideoData;
}

import {
  DISCOVERY_IMAGE_VERSION,
  toLandscapeCoverUrl,
  toPortraitCoverUrl,
  getDiscoveryCoverFallback,
  resolveDiscoveryCoverUrl,
  resolveDiscoveryBlockImageUrl,
  pickTitleMatchedCover,
} from './discoveryCoverImages';

export {
  DISCOVERY_IMAGE_VERSION,
  toLandscapeCoverUrl,
  toPortraitCoverUrl,
  getDiscoveryCoverFallback,
  resolveDiscoveryCoverUrl,
  resolveDiscoveryBlockImageUrl,
  pickTitleMatchedCover,
};

/** @deprecated 使用 resolveDiscoveryCoverUrl；保留兼容旧引用 */
export const pickChildDiscoveryImage = (
  seed: string,
  category: ArticleCategory,
  aspect: 'landscape' | 'portrait' = 'landscape'
): string =>
  pickTitleMatchedCover(seed, category, seed, aspect === 'portrait' ? 1 : 0);

const applyChildFriendlyImages = (article: Article) => {
  article.coverImage = resolveDiscoveryCoverUrl(article);

  article.blocks?.forEach((block, idx) => {
    if (block?.type === 'image' && block.src) {
      block.src = resolveDiscoveryBlockImageUrl(article, idx);
    }
  });
};

export const MOCK_ARTICLES: Article[] = [
  // ==================== SCIENCE 科普探秘 ====================
  {
    id: 'news-001',
    title: '神舟飞船的"太空快递"签收指南',
    coverImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000',
    category: 'SCIENCE',
    publishDate: '2小时前',
    readCount: 1230,
    author: '阳光少年报',
    readTime: '3分钟',
    vocabulary: [
      { word: '浩瀚', pinyin: 'hào hàn', definition: '形容广大或繁多，通常形容水势或苍天。' },
      { word: '辐射', pinyin: 'fú shè', definition: '能量以波或粒子的形式向外扩散。' }
    ],
    relatedArticles: ['sci-003', 'sci-004'],
    blocks: [
      { type: 'intro', content: '想象一下，你在网上下了一单外卖，结果骑手是... 火箭？🚀' },
      { type: 'text', content: '就在昨天，我们的"天舟八号"货运飞船成功发射，正在去往空间站的路上。这可不是一次普通的送货，它可是带着全村（地球村）的希望去的！' },
      { type: 'image', src: 'https://images.unsplash.com/photo-1516849841032-87cbac4d88f7?q=80&w=1000', caption: '天舟八号货运飞船正在对接' },
      { type: 'text', content: '这次天舟八号带了 6 吨物资！不仅有宇航员的"春节大礼包"，还有几块特殊的"太空砖"。这些"太空砖"将接受浩瀚宇宙的考验。' }
    ],
    content: ''
  },
  {
    id: 'sci-002',
    title: '为什么企鹅不怕冷？',
    coverImage: 'https://images.unsplash.com/photo-1598439210625-5067c578f3f6?q=80&w=1000',
    category: 'SCIENCE',
    publishDate: '1周前',
    readCount: 3400,
    author: '十万个为什么',
    readTime: '4分钟',
    vocabulary: [
      { word: '隔热', pinyin: 'gé rè', definition: '阻挡热量的传递。' }
    ],
    relatedArticles: ['news-001'],
    blocks: [
      { type: 'intro', content: '生活在南极的企鹅，每天都踩在冰上，它们不冷吗？' },
      { type: 'text', content: '其实企鹅有厚厚的脂肪层，就像穿了一件羽绒服，起到了很好的隔热作用。而且企鹅的羽毛非常特别，可以将空气锁在羽毛之间，形成隔热层。' },
      { type: 'text', content: '此外，企鹅的脚底有特殊的血管网络，可以减少热量散失，这种机制叫做"逆流热交换"。' }
    ],
    content: ''
  },
  {
    id: 'sci-003',
    title: '为什么彩虹总是弯的？',
    coverImage: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?q=80&w=1000',
    category: 'SCIENCE',
    publishDate: '3天前',
    readCount: 5600,
    author: '科学大爆炸',
    readTime: '5分钟',
    videoCard: { duration: '04:23', views: '5.6万', likes: '3200', favorites: '1800', isVideo: true },
    vocabulary: [
      { word: '折射', pinyin: 'zhé shè', definition: '光线从一种介质进入另一种介质时，传播方向发生改变的现象。' }
    ],
    relatedArticles: ['sci-004', 'sci-005'],
    blocks: [
      { type: 'intro', content: '雨后的彩虹为什么总是弯弯的弧形？今天我们用3分钟讲清楚！' },
      { type: 'text', content: '彩虹是阳光通过水滴发生折射和反射形成的。当白光进入水滴时，不同颜色的光折射角度不同，因此被分散成七种颜色。' },
      { type: 'image', src: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?q=80&w=1000', caption: '彩虹的形成原理示意图' },
      { type: 'text', content: '而之所以是弧形，是因为每个水滴都在特定的42度角方向反射最强的光。所有满足这个角度的水滴连起来，恰好形成一个圆弧。' }
    ],
    content: ''
  },
  {
    id: 'sci-004',
    title: '黑洞是如何形成的？',
    coverImage: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=1000',
    category: 'SCIENCE',
    publishDate: '5天前',
    readCount: 8900,
    author: '宇宙探索频道',
    readTime: '6分钟',
    videoCard: { duration: '06:15', views: '8.9万', likes: '5600', favorites: '2900', isVideo: true },
    vocabulary: [
      { word: '坍缩', pinyin: 'tān suō', definition: '物体因引力等原因向内收缩塌陷。' },
      { word: '奇点', pinyin: 'qí diǎn', definition: '物理定律失效的一个无限密度的点。' }
    ],
    relatedArticles: ['sci-003', 'news-001'],
    blocks: [
      { type: 'intro', content: '宇宙中存在着一种连光都无法逃脱的天体——黑洞。它是怎么形成的？' },
      { type: 'text', content: '当一颗质量足够大的恒星耗尽核燃料时，它会发生剧烈的超新星爆炸。爆炸后，如果剩余核心的质量超过太阳质量的3倍，引力会将物质压缩到极点，形成黑洞。' },
      { type: 'text', content: '黑洞的中心是一个密度无限大的"奇点"，周围有一个叫做"事件视界"的边界，任何物质和光一旦越过这个边界，就无法逃脱。' }
    ],
    content: ''
  },
  {
    id: 'sci-005',
    title: '人体血液循环之旅',
    coverImage: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?q=80&w=1000',
    category: 'SCIENCE',
    publishDate: '1周前',
    readCount: 4200,
    author: '人体奥秘',
    readTime: '4分钟',
    vocabulary: [
      { word: '循环', pinyin: 'xún huán', definition: '往复不断地运转或运行。' },
      { word: '毛细血管', pinyin: 'máo xì xuè guǎn', definition: '最细小的血管，连接小动脉和小静脉。' }
    ],
    relatedArticles: ['sci-002', 'sci-007'],
    blocks: [
      { type: 'intro', content: '你的心脏每天跳动约10万次，把血液泵到全身。跟我一起踏上这趟神奇的旅程！' },
      { type: 'text', content: '血液从心脏出发，通过动脉流向全身各个组织，为细胞带去氧气和营养物质。然后通过静脉回流到心脏，再到肺部进行气体交换，获得新的氧气，开始下一个循环。' }
    ],
    content: ''
  },
  {
    id: 'sci-006',
    title: '植物也有记忆吗？',
    coverImage: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?q=80&w=1000',
    category: 'SCIENCE',
    publishDate: '2周前',
    readCount: 6700,
    author: '植物科学研究所',
    readTime: '5分钟',
    videoCard: { duration: '05:02', views: '6.7万', likes: '4100', favorites: '2200', isVideo: true },
    vocabulary: [
      { word: '应激性', pinyin: 'yìng jī xìng', definition: '生物体对外界刺激做出反应的能力。' }
    ],
    relatedArticles: ['sci-005', 'sci-003'],
    blocks: [
      { type: 'intro', content: '含羞草被触碰会闭合，这只是应激反应，还是某种"记忆"？科学家发现了惊人的答案。' },
      { type: 'text', content: '研究人员发现，含羞草经过反复"学习"后，对无害刺激会逐渐停止反应。这意味着植物可能具有某种形式的学习和记忆能力，尽管没有神经系统。' }
    ],
    content: ''
  },
  {
    id: 'sci-007',
    title: '恐龙灭绝的7种假说',
    coverImage: 'https://images.unsplash.com/photo-1516912481808-3406841bd33c?q=80&w=1000',
    category: 'SCIENCE',
    publishDate: '3周前',
    readCount: 9100,
    author: '古生物学家说',
    readTime: '7分钟',
    vocabulary: [
      { word: '假说', pinyin: 'jiǎ shuō', definition: '对未经证实的现象所做的推测性解释。' },
      { word: '陨石', pinyin: 'yǔn shí', definition: '来自宇宙空间、落到地球表面的天体碎片。' }
    ],
    relatedArticles: ['sci-004', 'news-001'],
    blocks: [
      { type: 'intro', content: '6600万年前，地球上的霸主——恐龙突然消失了。科学家提出了7种假说，哪一种你觉得最可信？' },
      { type: 'text', content: '最主流的观点是陨石撞击说：一颗直径约10公里的小行星撞击地球，引发了"核冬天"，植被大量死亡，恐龙因失去食物来源而灭绝。' },
      { type: 'text', content: '其他假说包括：火山大爆发说、气候变迁说、海平面变化说、疾病说、植物变化说以及宇宙射线说。每种假说都有一定的证据支持。' }
    ],
    content: ''
  },

  // ==================== CURRENT_EVENTS 时事速递 ====================
  {
    id: 'curr-001',
    title: '环保新规：垃圾分类再升级',
    coverImage: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=1000',
    category: 'CURRENT_EVENTS',
    publishDate: '5小时前',
    readCount: 990,
    author: '城市早报',
    readTime: '3分钟',
    vocabulary: [],
    relatedArticles: ['curr-002'],
    blocks: [
      { type: 'intro', content: '从下个月开始，垃圾分类将实行新的标准，大家准备好了吗？' },
      { type: 'text', content: '这次的新规主要针对电子垃圾的处理，旧手机、旧电脑等电子产品将有专门的回收渠道。' },
      { type: 'text', content: '新规还规定，大型商场和学校必须设置专门的电子垃圾回收点，方便市民就近投放。' }
    ],
    content: ''
  },
  {
    id: 'curr-002',
    title: '海洋清理计划：清理太平洋垃圾带',
    coverImage: 'https://images.unsplash.com/photo-1621451537084-482c73073a0f?q=80&w=1000',
    category: 'CURRENT_EVENTS',
    publishDate: '1天前',
    readCount: 1500,
    author: '环球科学',
    readTime: '6分钟',
    vocabulary: [
      { word: '生态系统', pinyin: 'shēng tài xì tǒng', definition: '生物群落及其地理环境相互作用的自然系统。' }
    ],
    relatedArticles: ['curr-001'],
    blocks: [
      { type: 'intro', content: '太平洋垃圾带是海洋污染的重灾区，面积已经超过法国的3倍。' },
      { type: 'text', content: '最近，一项新的海洋清理计划启动了，使用特制的U形浮筒和网络系统，有望清除大量海洋垃圾，希望能逐步恢复海洋的生态系统。' }
    ],
    content: ''
  },
  {
    id: 'curr-003',
    title: '全国青少年科技创新大赛今日开幕',
    coverImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1000',
    category: 'CURRENT_EVENTS',
    publishDate: '3小时前',
    readCount: 2300,
    author: '科技日报',
    readTime: '3分钟',
    vocabulary: [
      { word: '创新', pinyin: 'chuàng xīn', definition: '创立或创造新事物。' }
    ],
    relatedArticles: ['curr-007', 'camp-003'],
    blocks: [
      { type: 'intro', content: '一年一度的全国青少年科技创新大赛今天在北京正式开幕，来自全国31个省市的600余支队伍参赛。' },
      { type: 'text', content: '今年大赛新增了人工智能、碳中和两个专题赛道，参赛选手年龄最小的只有9岁。' },
      { type: 'text', content: '大赛评委表示，今年选手的整体水平明显提升，很多作品已经具备了实际应用价值。' }
    ],
    content: ''
  },
  {
    id: 'curr-004',
    title: '中国奥运健儿载誉归来',
    coverImage: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=1000',
    category: 'CURRENT_EVENTS',
    publishDate: '昨天',
    readCount: 4700,
    author: '体育周报',
    readTime: '4分钟',
    vocabulary: [
      { word: '载誉', pinyin: 'zài yù', definition: '带着荣誉。' }
    ],
    relatedArticles: ['curr-003'],
    blocks: [
      { type: 'intro', content: '中国奥运代表团以傲人的成绩结束征程，运动员们今天回到北京，受到热烈欢迎。' },
      { type: 'text', content: '这届奥运会，中国代表团共斩获金牌40枚，奖牌总数创历史新高。多位年轻选手首次参加奥运会就摘得金牌。' }
    ],
    content: ''
  },
  {
    id: 'curr-005',
    title: '北京率先启动无人配送试点',
    coverImage: 'https://images.unsplash.com/photo-1527430253228-e93688616381?q=80&w=1000',
    category: 'CURRENT_EVENTS',
    publishDate: '2天前',
    readCount: 3100,
    author: '科技前线',
    readTime: '4分钟',
    vocabulary: [
      { word: '试点', pinyin: 'shì diǎn', definition: '在小范围内进行试验，积累经验后再推广。' }
    ],
    relatedArticles: ['curr-007', 'bili-006'],
    blocks: [
      { type: 'intro', content: '不需要骑手，快递自己会来！北京朝阳区今日正式启动无人配送机器人试点项目。' },
      { type: 'text', content: '这批无人配送机器人可以自主规划路线、识别红绿灯，还能乘坐电梯进入楼栋，将快递送到指定楼层。' }
    ],
    content: ''
  },
  {
    id: 'curr-006',
    title: '神舟十八号顺利返航，三名宇航员安全着陆',
    coverImage: 'https://images.unsplash.com/photo-1516849841032-87cbac4d88f7?q=80&w=1000',
    category: 'CURRENT_EVENTS',
    publishDate: '3天前',
    readCount: 5200,
    author: '新华社',
    readTime: '3分钟',
    vocabulary: [
      { word: '返航', pinyin: 'fǎn háng', definition: '飞行器返回出发地或基地。' }
    ],
    relatedArticles: ['news-001', 'curr-003'],
    blocks: [
      { type: 'intro', content: '经过半年的太空飞行任务，神舟十八号载人飞船今天成功返回地球，三名宇航员状态良好。' },
      { type: 'text', content: '这次任务创造了多项纪录：完成了我国第一次太空3D打印实验，还在太空养活了一条小鱼！' }
    ],
    content: ''
  },
  {
    id: 'curr-007',
    title: 'AI写作工具进入中学课堂，老师们怎么看？',
    coverImage: 'https://images.unsplash.com/photo-1584697964358-3e14ca57658b?q=80&w=1000',
    category: 'CURRENT_EVENTS',
    publishDate: '4天前',
    readCount: 6800,
    author: '教育观察',
    readTime: '5分钟',
    vocabulary: [
      { word: '辅助', pinyin: 'fǔ zhù', definition: '从旁协助，起辅助作用。' }
    ],
    relatedArticles: ['bili-006', 'well-006'],
    blocks: [
      { type: 'intro', content: '当AI会写作文，学生还要练习写作吗？这个问题正在全国各地的中学引发热烈讨论。' },
      { type: 'text', content: '部分学校已开始试点将AI写作工具作为"作文助手"引入课堂，让学生与AI协作完成写作任务，老师则重点教授思维和立意。' },
      { type: 'text', content: '但也有专家担忧，过度依赖AI可能导致学生失去独立思考和表达的能力。这场关于AI与教育的争论，才刚刚开始。' }
    ],
    content: ''
  },
  {
    id: 'curr-008',
    title: '长江流域生态保护十年，水清鱼跃重现',
    coverImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1000',
    category: 'CURRENT_EVENTS',
    publishDate: '1周前',
    readCount: 2900,
    author: '生态中国',
    readTime: '5分钟',
    vocabulary: [
      { word: '生态', pinyin: 'shēng tài', definition: '生物在一定的自然环境下生存和发展的状态。' }
    ],
    relatedArticles: ['curr-002', 'bili-008'],
    blocks: [
      { type: 'intro', content: '十年禁渔令实施后，长江生态正在悄然恢复。江豚、中华鲟等珍稀物种的种群数量明显回升。' },
      { type: 'text', content: '数据显示，长江鱼类种群恢复速度超出预期。当地渔民也从"捕鱼人"变成了"护鱼人"，用监测和旅游代替捕捞，收入反而增加了。' }
    ],
    content: ''
  },

  // ==================== CAMPUS_NEWS 校园 ====================
  {
    id: 'news-002',
    title: '校园艺术节：六年级二班斩获金奖',
    coverImage: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f',
    category: 'CAMPUS_NEWS',
    publishDate: '昨天',
    readCount: 856,
    author: '校广播站',
    readTime: '2分钟',
    videoCard: { duration: '02:18', views: '1.2万', likes: '860', favorites: '420', isVideo: true },
    vocabulary: [
      { word: '斩获', pinyin: 'zhǎn huò', definition: '获得；收获（多指胜利、成果等）。' }
    ],
    relatedArticles: ['camp-002', 'camp-004'],
    blocks: [
      { type: 'intro', content: '昨天的艺术节汇演简直太精彩了！现场座无虚席，掌声雷动。' },
      { type: 'text', content: '六年级二班的合唱《虫儿飞》感动了全场观众，最终斩获了本次艺术节的金奖。评委老师表示，这是近十年来最有感染力的一次演出。' },
      { type: 'image', src: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1000', caption: '颁奖现场，同学们喜笑颜开' }
    ],
    content: ''
  },
  {
    id: 'camp-002',
    title: '社团招募开始！机器人社、话剧社等七大社团虚席以待',
    coverImage: 'https://images.unsplash.com/photo-1523050854058-5079616a0a5e',
    category: 'CAMPUS_NEWS',
    publishDate: '今天',
    readCount: 1340,
    author: '校学生会',
    readTime: '2分钟',
    vocabulary: [],
    relatedArticles: ['news-002', 'camp-003'],
    blocks: [
      { type: 'intro', content: '本学期社团招募今日正式开始！7大社团同时招新，快来看看有没有你心仪的那一个。' },
      { type: 'text', content: '今年新增了天文社和编程社两个新社团。机器人社已连续三年获得全市比赛一等奖，话剧社即将排演经典剧目《威尼斯商人》。' },
      { type: 'text', content: '招募截止时间为本周五，有意向的同学请找班级联络员报名，每人最多参加两个社团。' }
    ],
    content: ''
  },
  {
    id: 'camp-003',
    title: '期中考试成绩出炉！数学平均分历史最高',
    coverImage: 'https://images.unsplash.com/photo-1434030218751-7a072f75c938',
    category: 'CAMPUS_NEWS',
    publishDate: '2天前',
    readCount: 2100,
    author: '教务处',
    readTime: '3分钟',
    vocabulary: [],
    relatedArticles: ['camp-002', 'news-002'],
    blocks: [
      { type: 'intro', content: '本次期中考试成绩已出炉。总体来看，同学们的成绩有了明显进步。' },
      { type: 'text', content: '数学科目全年级平均分达到82.3分，创下历史新高。英语科目进步最大的同学来自七年级三班，整体提升超过15分。' },
      { type: 'text', content: '老师提醒同学们：考试成绩只是学习的一个参考，查漏补缺、总结方法才是最重要的。' }
    ],
    content: ''
  },
  {
    id: 'camp-004',
    title: '运动会百米决赛：打破校纪录！',
    coverImage: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b',
    category: 'CAMPUS_NEWS',
    publishDate: '3天前',
    readCount: 3200,
    author: '体育部',
    readTime: '2分钟',
    vocabulary: [],
    relatedArticles: ['news-002', 'camp-005'],
    blocks: [
      { type: 'intro', content: '啊！八年级二班的王同学以11.2秒的成绩夺得百米冠军，打破了学校保持8年的记录！' },
      { type: 'text', content: '决赛现场可以说是万人空巷，加油声震耳欲聋。王同学赛后表示："我每天早上5点就起床训练，这个成绩是对我努力的最好回报。"' }
    ],
    content: ''
  },
  {
    id: 'camp-005',
    title: '同学说 | 五年级李同学的暑假科考日记',
    coverImage: 'https://images.unsplash.com/photo-1447750364198-3496a6b2b5c6',
    category: 'CAMPUS_NEWS',
    publishDate: '1周前',
    readCount: 1800,
    author: '李晓明同学',
    readTime: '4分钟',
    vocabulary: [
      { word: '科考', pinyin: 'kē kǎo', definition: '科学考察的简称，对自然界某一方面进行系统调查研究。' }
    ],
    relatedArticles: ['camp-004', 'sci-006'],
    blocks: [
      { type: 'intro', content: '暑假期间，我和爸爸妈妈参加了一次去云南西双版纳的科学考察活动，记录下了很多珍贵的见闻。' },
      { type: 'text', content: '在热带雨林里，我们发现了三种书上没有记录的昆虫。导师说这可能是尚未被命名的新品种！那一刻，我感觉自己真的像一个科学家。' },
      { type: 'text', content: '如果你也对大自然感兴趣，暑假不妨放下手机，去户外看看那个真实的、比屏幕更精彩的世界吧。' }
    ],
    content: ''
  },

  // ==================== LITERATURE 美文悦读 ====================
  {
    id: 'lit-001',
    title: '秋天的第一片落叶',
    coverImage: 'https://images.unsplash.com/photo-1508896731775-f6f03f04f1a9',
    category: 'LITERATURE',
    publishDate: '3天前',
    readCount: 2100,
    author: '林清玄',
    readTime: '5分钟',
    vocabulary: [
      { word: '萧瑟', pinyin: 'xiāo sè', definition: '形容风吹树木的声音，也形容景色凄凉。' }
    ],
    relatedArticles: ['lit-002', 'lit-003'],
    blocks: [
      { type: 'intro', content: '秋天总是悄无声息地来临，就像一个不打招呼的老朋友。' },
      { type: 'text', content: '当我看到第一片落叶飘落在脚边时，我才惊觉，那个热烈的夏天已经过去了。风中带着一丝萧瑟的味道，却也携来了成熟的馨香。' },
      { type: 'text', content: '每一片落叶都是一首诗，每一阵秋风都是一段记忆。让我们在这个季节，慢下来，听听内心的声音。' }
    ],
    content: ''
  },
  {
    id: 'lit-002',
    title: '那年盛夏',
    coverImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=1000',
    category: 'LITERATURE',
    publishDate: '5天前',
    readCount: 1760,
    author: '汪曾祺',
    readTime: '4分钟',
    vocabulary: [
      { word: '氤氲', pinyin: 'yīn yūn', definition: '形容云烟弥漫的样子，也形容香气浓郁。' }
    ],
    relatedArticles: ['lit-001', 'lit-003'],
    blocks: [
      { type: 'intro', content: '那年盛夏，热得让人慵懒，却也慷慨地给了我们最丰盛的记忆。' },
      { type: 'text', content: '清晨的薄雾氤氲在荷花池上，蜻蜓还没睡醒，懒洋洋地停在荷叶尖端。午后的蝉鸣声声，把整个村子都晒成了金黄色。' },
      { type: 'text', content: '那时候的快乐很简单：一根冰棍、一场大雨、一个能抓萤火虫的夏夜。如今回想起来，那些细碎的日子，竟是最好的时光。' }
    ],
    content: ''
  },
  {
    id: 'lit-003',
    title: '荷塘月色（节选）',
    coverImage: 'https://images.unsplash.com/photo-1518709268805-4e9042af9a82',
    category: 'LITERATURE',
    publishDate: '1周前',
    readCount: 4300,
    author: '朱自清',
    readTime: '5分钟',
    vocabulary: [
      { word: '弥望', pinyin: 'mí wàng', definition: '满眼都是，充满视野。' },
      { word: '蓊郁', pinyin: 'wěng yù', definition: '形容树木茂盛的样子。' }
    ],
    relatedArticles: ['lit-004', 'lit-001'],
    blocks: [
      { type: 'intro', content: '这几天心里颇不宁静。今晚在院子里坐着乘凉，忽然想起日日走过的荷塘，在这满月的光里，总该另有一番样子吧。' },
      { type: 'text', content: '沿着荷塘，是一条曲折的小煤屑路。这是一条幽僻的路；白天也少人走，夜晚更加寂寞。荷塘四面，长着许多树，蓊蓊郁郁的。' },
      { type: 'text', content: '月光如流水一般，静静地泻在这一片叶子和花上。薄薄的青雾浮起在荷塘里。叶子和花仿佛在牛乳中洗过一样，又像笼着轻纱的梦。' }
    ],
    content: ''
  },
  {
    id: 'lit-004',
    title: '背影（节选）',
    coverImage: 'https://images.unsplash.com/photo-1474488672901-3a08903c63fe',
    category: 'LITERATURE',
    publishDate: '10天前',
    readCount: 5900,
    author: '朱自清',
    readTime: '6分钟',
    vocabulary: [
      { word: '踌躇', pinyin: 'chóu chú', definition: '犹豫不决，反复考虑。' },
      { word: '蹒跚', pinyin: 'pán shān', definition: '腿脚不灵便，走路缓慢、摇摆的样子。' }
    ],
    relatedArticles: ['lit-003', 'lit-005'],
    blocks: [
      { type: 'intro', content: '我最不能忘记的是他的背影。那年冬天，祖母死了，父亲的差使也交卸了，正是祸不单行的日子。' },
      { type: 'text', content: '他用两手攀着上面，两脚再向上缩；他肥胖的身子向左微倾，显出努力的样子。这时我看见他的背影，我的泪很快地流下来了。' },
      { type: 'text', content: '我赶紧拭干了泪，怕他看见，也怕别人看见。他买橘子回来时，我赶紧去搀他。他和我走到车上，将橘子一股脑儿放在我的皮大衣上。于是扑扑衣上的泥土，心里很轻松似的，过一会说："我走了，到那边来信！"' }
    ],
    content: ''
  },
  {
    id: 'lit-005',
    title: '匆匆',
    coverImage: 'https://images.unsplash.com/photo-1516054778171-03bfa9a5a5d4',
    category: 'LITERATURE',
    publishDate: '2周前',
    readCount: 7200,
    author: '朱自清',
    readTime: '4分钟',
    vocabulary: [
      { word: '徘徊', pinyin: 'pái huái', definition: '在一个地方来回地走，也指犹豫不决。' },
      { word: '挪移', pinyin: 'nuó yí', definition: '移动位置。' }
    ],
    relatedArticles: ['lit-004', 'lit-006'],
    blocks: [
      { type: 'intro', content: '燕子去了，有再来的时候；杨柳枯了，有再青的时候；桃花谢了，有再开的时候。但是，聪明的，你告诉我，我们的日子为什么一去不复返呢？' },
      { type: 'text', content: '在逃去如飞的日子里，在千门万户的世界里的我能做什么呢？只有徘徊罢了，只有匆匆罢了。' },
      { type: 'text', content: '你聪明的，告诉我，我们的日子为什么一去不复返呢？' }
    ],
    content: ''
  },
  {
    id: 'lit-006',
    title: '从百草园到三味书屋（节选）',
    coverImage: 'https://images.unsplash.com/photo-1465146633827-37f23bddab2e',
    category: 'LITERATURE',
    publishDate: '3周前',
    readCount: 6100,
    author: '鲁迅',
    readTime: '5分钟',
    vocabulary: [
      { word: '确凿', pinyin: 'què záo', definition: '真实可靠，十分肯定。' },
      { word: '菜畦', pinyin: 'cài qí', definition: '种蔬菜的田畦，指小块整齐的菜地。' }
    ],
    relatedArticles: ['lit-005', 'lit-001'],
    blocks: [
      { type: 'intro', content: '不必说碧绿的菜畦，光滑的石井栏，高大的皂荚树，紫红的桑葚……' },
      { type: 'text', content: '单是周围的短短的泥墙根一带，就有无限趣味。油蛉在这里低唱，蟋蟀们在这里弹琴。翻开断砖来，有时会遇见蜈蚣；还有斑蝥，倘若用手指按住它的脊梁，便会啪的一声，从后窍喷出一阵烟雾。' }
    ],
    content: ''
  },

  // ==================== BILINGUAL 双语新知 ====================
  {
    id: 'bili-001',
    title: '每日一词：Innovation 创新',
    coverImage: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=1000',
    category: 'BILINGUAL',
    publishDate: '今天',
    readCount: 2100,
    author: '双语知识局',
    readTime: '2分钟',
    bilingualCard: {
      type: '每日一词',
      english: 'Innovation',
      chinese: '创新',
      pronunciation: '/ˌɪnəˈveɪʃən/',
      exampleSentence: 'China is becoming a global leader in innovation.',
      exampleTranslation: '中国正在成为全球创新领导者。',
    },
    vocabulary: [],
    relatedArticles: ['bili-006', 'curr-003'],
    blocks: [],
    content: ''
  },
  {
    id: 'bili-002',
    title: '双语资讯：巴黎奥运会闭幕式精彩回顾',
    coverImage: 'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?q=80&w=1000',
    category: 'BILINGUAL',
    publishDate: '今天',
    readCount: 3400,
    author: '双语时代',
    readTime: '3分钟',
    bilingualCard: {
      type: '双语资讯',
      chinese: '巴黎奥运会于2024年8月11日圆满落幕，向全世界展示了法国的文化与体育精神。',
      english: 'The Paris Olympics concluded on August 11, 2024, showcasing French culture and the spirit of sportsmanship to the world.',
    },
    vocabulary: [
      { word: 'sportsmanship', pinyin: '', definition: '体育精神，运动员风度' }
    ],
    relatedArticles: ['curr-004', 'bili-001'],
    blocks: [
      { type: 'intro', content: '2024年巴黎奥运会圆满落幕。用中英文来了解这场体育盛事吧！' },
      { type: 'text', content: '中：本届奥运会共有206个代表团、约10500名运动员参赛，是史上规模最大的奥运会之一。' },
      { type: 'text', content: 'EN：This edition of the Olympics featured 206 delegations and approximately 10,500 athletes, making it one of the largest in history.' }
    ],
    content: ''
  },
  {
    id: 'bili-004',
    title: '每日一词：Sustainability 可持续发展',
    coverImage: 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?q=80&w=1000',
    category: 'BILINGUAL',
    publishDate: '3天前',
    readCount: 1900,
    author: '双语知识局',
    readTime: '2分钟',
    bilingualCard: {
      type: '每日一词',
      english: 'Sustainability',
      chinese: '可持续性；可持续发展',
      pronunciation: '/səˌsteɪnəˈbɪlɪti/',
      exampleSentence: 'Sustainability is key to solving the climate crisis.',
      exampleTranslation: '可持续性是解决气候危机的关键。',
    },
    vocabulary: [],
    relatedArticles: ['curr-002', 'bili-008'],
    blocks: [],
    content: ''
  },
  {
    id: 'bili-005',
    title: '双语资讯：马斯克星舰成功完成轨道飞行',
    coverImage: 'https://images.unsplash.com/photo-1457364887197-9150188c107b?q=80&w=1000',
    category: 'BILINGUAL',
    publishDate: '4天前',
    readCount: 4100,
    author: '科技双语周刊',
    readTime: '3分钟',
    bilingualCard: {
      type: '双语资讯',
      chinese: 'SpaceX 的"星舰"飞船成功完成首次完整轨道飞行，标志着人类可重复使用大型火箭技术的重大突破。',
      english: "SpaceX's Starship successfully completed its first full orbital flight, marking a major breakthrough in reusable large rocket technology."
    },
    vocabulary: [
      { word: 'orbital', pinyin: '', definition: '轨道的；与轨道有关的' },
      { word: 'breakthrough', pinyin: '', definition: '突破，重大进展' }
    ],
    relatedArticles: ['news-001', 'curr-006'],
    blocks: [
      { type: 'intro', content: '马斯克说要去火星，他的星舰又进了一步！让我们用双语了解这次历史性飞行。' },
      { type: 'text', content: '中：星舰是迄今为止人类建造的最大、推力最强的火箭，设计用于将人类送往月球和火星。' },
      { type: 'text', content: 'EN: Starship is the largest and most powerful rocket ever built by humans, designed to carry people to the Moon and Mars.' }
    ],
    content: ''
  },
  {
    id: 'bili-006',
    title: '每日一词：Artificial Intelligence 人工智能',
    coverImage: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=1000',
    category: 'BILINGUAL',
    publishDate: '5天前',
    readCount: 5600,
    author: '双语知识局',
    readTime: '2分钟',
    bilingualCard: {
      type: '每日一词',
      english: 'Artificial Intelligence',
      chinese: '人工智能',
      pronunciation: '/ˌɑːrtɪˈfɪʃəl ɪnˈtelɪdʒəns/',
      exampleSentence: 'AI is transforming the way we live and work.',
      exampleTranslation: '人工智能正在改变我们的生活和工作方式。',
    },
    vocabulary: [],
    relatedArticles: ['curr-007', 'curr-005'],
    blocks: [],
    content: ''
  },
  {
    id: 'bili-009',
    title: '每日一词：Resilience 韧性',
    coverImage: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=1000',
    category: 'BILINGUAL',
    publishDate: '昨天',
    readCount: 1850,
    author: '双语知识局',
    readTime: '2分钟',
    bilingualCard: {
      type: '每日一词',
      english: 'Resilience',
      chinese: '韧性；恢复力',
      pronunciation: '/rɪˈzɪliəns/',
      exampleSentence: 'Resilience helps us bounce back from setbacks.',
      exampleTranslation: '韧性帮助我们从挫折中重新站起来。',
    },
    vocabulary: [],
    relatedArticles: ['bili-001', 'bili-010'],
    blocks: [],
    content: ''
  },
  {
    id: 'bili-010',
    title: '每日一词：Collaboration 合作',
    coverImage: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1000',
    category: 'BILINGUAL',
    publishDate: '2天前',
    readCount: 1720,
    author: '双语知识局',
    readTime: '2分钟',
    bilingualCard: {
      type: '每日一词',
      english: 'Collaboration',
      chinese: '合作；协作',
      pronunciation: '/kəˌlæbəˈreɪʃən/',
      exampleSentence: 'Great projects often start with good collaboration.',
      exampleTranslation: '伟大的项目往往始于良好的合作。',
    },
    vocabulary: [],
    relatedArticles: ['bili-009', 'bili-004'],
    blocks: [],
    content: ''
  },
  {
    id: 'bili-011',
    title: '每日一词：Perspective 视角',
    coverImage: 'https://images.unsplash.com/photo-1434030216411-0b793fe4bc95?q=80&w=1000',
    category: 'BILINGUAL',
    publishDate: '4天前',
    readCount: 1680,
    author: '双语知识局',
    readTime: '2分钟',
    bilingualCard: {
      type: '每日一词',
      english: 'Perspective',
      chinese: '视角；观点',
      pronunciation: '/pərˈspektɪv/',
      exampleSentence: 'Try to see the problem from a different perspective.',
      exampleTranslation: '试着从不同的视角看这个问题。',
    },
    vocabulary: [],
    relatedArticles: ['bili-006', 'bili-012'],
    blocks: [],
    content: ''
  },
  {
    id: 'bili-012',
    title: '每日一词：Empathy 共情',
    coverImage: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=1000',
    category: 'BILINGUAL',
    publishDate: '6天前',
    readCount: 1950,
    author: '双语知识局',
    readTime: '2分钟',
    bilingualCard: {
      type: '每日一词',
      english: 'Empathy',
      chinese: '共情；同理心',
      pronunciation: '/ˈempəθi/',
      exampleSentence: 'Empathy makes us better friends and classmates.',
      exampleTranslation: '共情让我们成为更好的朋友和同学。',
    },
    vocabulary: [],
    relatedArticles: ['bili-010', 'bili-013'],
    blocks: [],
    content: ''
  },
  {
    id: 'bili-013',
    title: '每日一词：Curiosity 好奇心',
    coverImage: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1000',
    category: 'BILINGUAL',
    publishDate: '7天前',
    readCount: 2040,
    author: '双语知识局',
    readTime: '2分钟',
    bilingualCard: {
      type: '每日一词',
      english: 'Curiosity',
      chinese: '好奇心',
      pronunciation: '/ˌkjʊriˈɑːsəti/',
      exampleSentence: 'Curiosity is the engine of learning.',
      exampleTranslation: '好奇心是学习的引擎。',
    },
    vocabulary: [],
    relatedArticles: ['bili-012', 'bili-014'],
    blocks: [],
    content: ''
  },
  {
    id: 'bili-014',
    title: '每日一词：Perseverance 坚持',
    coverImage: 'https://images.unsplash.com/photo-1488190211105-414b0bd67c77?q=80&w=1000',
    category: 'BILINGUAL',
    publishDate: '8天前',
    readCount: 1810,
    author: '双语知识局',
    readTime: '2分钟',
    bilingualCard: {
      type: '每日一词',
      english: 'Perseverance',
      chinese: '坚持不懈；毅力',
      pronunciation: '/ˌpɜːrsəˈvɪrəns/',
      exampleSentence: 'Perseverance turns small steps into big achievements.',
      exampleTranslation: '坚持把小步积累成大成就。',
    },
    vocabulary: [],
    relatedArticles: ['bili-009', 'bili-015'],
    blocks: [],
    content: ''
  },
  {
    id: 'bili-015',
    title: '每日一词：Integrity 正直',
    coverImage: 'https://images.unsplash.com/photo-1516979187456-69a6509a1c5e?q=80&w=1000',
    category: 'BILINGUAL',
    publishDate: '9天前',
    readCount: 1760,
    author: '双语知识局',
    readTime: '2分钟',
    bilingualCard: {
      type: '每日一词',
      english: 'Integrity',
      chinese: '正直；诚信',
      pronunciation: '/ɪnˈteɡrəti/',
      exampleSentence: 'Integrity means doing the right thing even when no one is watching.',
      exampleTranslation: '正直意味着即使无人监督也做正确的事。',
    },
    vocabulary: [],
    relatedArticles: ['bili-014', 'bili-016'],
    blocks: [],
    content: ''
  },
  {
    id: 'bili-016',
    title: '每日一词：Gratitude 感恩',
    coverImage: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=1000',
    category: 'BILINGUAL',
    publishDate: '10天前',
    readCount: 1690,
    author: '双语知识局',
    readTime: '2分钟',
    bilingualCard: {
      type: '每日一词',
      english: 'Gratitude',
      chinese: '感恩；感激',
      pronunciation: '/ˈɡrætɪtuːd/',
      exampleSentence: 'Gratitude helps us appreciate the good things in life.',
      exampleTranslation: '感恩让我们珍惜生活中的美好。',
    },
    vocabulary: [],
    relatedArticles: ['bili-015', 'bili-017'],
    blocks: [],
    content: ''
  },
  {
    id: 'bili-017',
    title: '每日一词：Courage 勇气',
    coverImage: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1000',
    category: 'BILINGUAL',
    publishDate: '11天前',
    readCount: 1880,
    author: '双语知识局',
    readTime: '2分钟',
    bilingualCard: {
      type: '每日一词',
      english: 'Courage',
      chinese: '勇气',
      pronunciation: '/ˈkʌrɪdʒ/',
      exampleSentence: 'It takes courage to speak up for what is right.',
      exampleTranslation: '为正确的事发声需要勇气。',
    },
    vocabulary: [],
    relatedArticles: ['bili-016', 'bili-018'],
    blocks: [],
    content: ''
  },
  {
    id: 'bili-018',
    title: '每日一词：Diversity 多样性',
    coverImage: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1000',
    category: 'BILINGUAL',
    publishDate: '12天前',
    readCount: 1630,
    author: '双语知识局',
    readTime: '2分钟',
    bilingualCard: {
      type: '每日一词',
      english: 'Diversity',
      chinese: '多样性；多元',
      pronunciation: '/daɪˈvɜːrsəti/',
      exampleSentence: 'Diversity makes our community richer and stronger.',
      exampleTranslation: '多样性让我们的社区更丰富、更有力量。',
    },
    vocabulary: [],
    relatedArticles: ['bili-017', 'bili-019'],
    blocks: [],
    content: ''
  },
  {
    id: 'bili-019',
    title: '每日一词：Leadership 领导力',
    coverImage: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1000',
    category: 'BILINGUAL',
    publishDate: '13天前',
    readCount: 1580,
    author: '双语知识局',
    readTime: '2分钟',
    bilingualCard: {
      type: '每日一词',
      english: 'Leadership',
      chinese: '领导力',
      pronunciation: '/ˈliːdərʃɪp/',
      exampleSentence: 'Good leadership is about serving others, not just giving orders.',
      exampleTranslation: '好的领导力在于服务他人，而不只是发号施令。',
    },
    vocabulary: [],
    relatedArticles: ['bili-018', 'bili-006'],
    blocks: [],
    content: ''
  },
  {
    id: 'bili-008',
    title: '双语资讯：全球气候峰会达成新协议',
    coverImage: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?q=80&w=1000',
    category: 'BILINGUAL',
    publishDate: '2周前',
    readCount: 2700,
    author: '国际时事双语',
    readTime: '3分钟',
    bilingualCard: {
      type: '双语资讯',
      chinese: '联合国气候变化大会达成历史性协议，190多个国家承诺在2035年前将可再生能源产能翻三倍。',
      english: 'The UN Climate Change Conference reached a historic agreement, with over 190 countries pledging to triple renewable energy capacity by 2035.'
    },
    vocabulary: [
      { word: 'pledging', pinyin: '', definition: '承诺，保证' },
      { word: 'renewable energy', pinyin: '', definition: '可再生能源' }
    ],
    relatedArticles: ['curr-008', 'bili-004'],
    blocks: [
      { type: 'intro', content: '气候变化是人类面临的共同挑战。这次峰会上，各国达成了哪些重要共识？' },
      { type: 'text', content: '中：会议还决定建立"气候损失与损害基金"，帮助受气候变化影响最严重的发展中国家应对灾害。' },
      { type: 'text', content: 'EN: The conference also decided to establish a "Loss and Damage Fund" to help developing countries most severely affected by climate change cope with disasters.' }
    ],
    content: ''
  },

  // ==================== WELLNESS 素养成长 ====================
  {
    id: 'well-001',
    title: '康奈尔笔记法：让你的笔记利用率提升300%',
    coverImage: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8',
    category: 'WELLNESS',
    publishDate: '今天',
    readCount: 3200,
    author: '学习方法研究所',
    readTime: '5分钟',
    wellnessCard: { gradeRange: '6-9年级', icon: '📒', colorClass: 'bg-violet-500' },
    vocabulary: [],
    relatedArticles: ['well-002', 'well-003'],
    blocks: [
      { type: 'intro', content: '同样是记笔记，为什么有人考试前翻一遍就够，有人翻了三遍还是没用？秘诀在于笔记的结构。' },
      { type: 'text', content: '康奈尔笔记法将笔记本分为三个区域：右侧主栏（记录课堂内容）、左侧线索栏（记录关键词和问题）、底部总结栏（用自己的话概括）。' },
      { type: 'text', content: '研究表明，使用这种方法的学生复习效率比普通笔记提升约3倍，考试成绩也明显更好。' }
    ],
    content: ''
  },
  {
    id: 'well-002',
    title: '番茄工作法：25分钟改变你的专注力',
    coverImage: 'https://images.unsplash.com/photo-1506784693919-ef06d93c28d2?q=80&w=600&h=1067&fit=crop',
    category: 'WELLNESS',
    publishDate: '昨天',
    readCount: 4100,
    author: '效率实验室',
    readTime: '4分钟',
    videoCard: { duration: '03:42', views: '4.1万', likes: '2800', favorites: '1500', isVideo: true, portraitCover: true },
    wellnessCard: { gradeRange: '5-9年级', icon: '⏱', colorClass: 'bg-red-400' },
    vocabulary: [],
    relatedArticles: ['well-001', 'well-007'],
    blocks: [
      { type: 'intro', content: '手机一拿就停不下来？学习总是三心二意？番茄工作法可能是你需要的。' },
      { type: 'video', caption: '3分钟视频：手把手教你用番茄钟提升专注力' },
      { type: 'text', content: '番茄工作法的核心：专注25分钟（一个番茄钟）→ 休息5分钟 → 重复4次 → 长休息15-30分钟。' },
      { type: 'text', content: '关键在于：这25分钟内，手机放到另一个房间，不做任何与任务无关的事。坚持两周，你会发现自己的专注力大幅提升。' }
    ],
    content: ''
  },
  {
    id: 'well-003',
    title: '跨学科阅读：数学思维如何让语文更好？',
    coverImage: 'https://images.unsplash.com/photo-1481627834875-b7833e8f5570?q=80&w=1000',
    category: 'WELLNESS',
    publishDate: '2天前',
    readCount: 2700,
    author: '跨界学习社',
    readTime: '5分钟',
    wellnessCard: { gradeRange: '7-9年级', icon: '🔗', colorClass: 'bg-blue-500' },
    vocabulary: [],
    relatedArticles: ['well-001', 'well-006'],
    blocks: [
      { type: 'intro', content: '很多同学觉得数学和语文是两个极端，其实它们有一个共同的灵魂：逻辑。' },
      { type: 'text', content: '数学培养的"条件→推论"思维，用在作文中就是"论据→论点"的议论结构。数学中的"穷举法"用在语文中，就是"多角度分析"。' },
      { type: 'text', content: '试试这个：下次写议论文时，把你的论证过程像数学证明题一样列出来，你会发现论证更严密了。' }
    ],
    content: ''
  },
  {
    id: 'well-004',
    title: '情绪管理：为什么青少年特别容易冲动？',
    coverImage: 'https://images.unsplash.com/photo-1499203692895-7f55fd48a31e',
    category: 'WELLNESS',
    publishDate: '3天前',
    readCount: 5800,
    author: '青少年心理研究中心',
    readTime: '5分钟',
    wellnessCard: { gradeRange: '6-9年级', icon: '🧠', colorClass: 'bg-pink-400' },
    vocabulary: [],
    relatedArticles: ['well-005', 'well-006'],
    blocks: [
      { type: 'intro', content: '为什么遇到一点小事就想发火？为什么事后总后悔？这不是性格问题，而是大脑发育的必经阶段。' },
      { type: 'text', content: '神经科学研究发现，青少年大脑的"理性中枢"（前额叶皮层）要到25岁才完全成熟，而负责情绪反应的"杏仁核"却非常活跃。这就造成了冲动行为多于理性思考。' },
      { type: 'text', content: '应对方法：当情绪激动时，先做3次深呼吸（这真的有效），给大脑5秒冷静时间，再决定是否行动。' }
    ],
    content: ''
  },
  {
    id: 'well-005',
    title: '沟通的艺术：倾听比说话更重要',
    coverImage: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?q=80&w=1000',
    category: 'WELLNESS',
    publishDate: '5天前',
    readCount: 3300,
    author: '社交技能训练营',
    readTime: '4分钟',
    wellnessCard: { gradeRange: '5-9年级', icon: '💬', colorClass: 'bg-green-500' },
    vocabulary: [],
    relatedArticles: ['well-004', 'well-006'],
    blocks: [
      { type: 'intro', content: '你有没有这样的经历：说了很多，对方却觉得你不理解他？问题可能出在"听"上，而不是"说"上。' },
      { type: 'text', content: '真正的倾听不是等待自己开口的机会，而是全身心理解对方的意思和感受。研究表明，好的倾听者往往在沟通中赢得更多信任，解决问题的能力也更强。' },
      { type: 'text', content: '练习方法：在对话中，先把对方的意思用自己的话复述一遍，确认理解正确后再发表意见。' }
    ],
    content: ''
  },
  {
    id: 'well-006',
    title: '批判性思维：不要轻信第一眼看到的',
    coverImage: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40',
    category: 'WELLNESS',
    publishDate: '1周前',
    readCount: 4900,
    author: '思维训练营',
    readTime: '6分钟',
    wellnessCard: { gradeRange: '7-9年级', icon: '🔍', colorClass: 'bg-amber-500' },
    vocabulary: [],
    relatedArticles: ['well-003', 'curr-007'],
    blocks: [
      { type: 'intro', content: '网上的信息良莠不齐，如何在海量内容中找到真相？批判性思维是你最重要的武器。' },
      { type: 'text', content: '批判性思维的4个核心问题：① 这个说法的来源是谁？② 有没有相反的证据？③ 这个结论跳跃了哪些步骤？④ 我的情绪有没有影响我的判断？' },
      { type: 'text', content: '下次看到令你愤怒或兴奋的新闻，先暂停3秒，问问自己这4个问题。你会发现，很多"确定无疑"的事情其实没那么确定。' }
    ],
    content: ''
  },
  {
    id: 'well-007',
    title: '时间管理：4象限法则让你不再焦虑',
    coverImage: 'https://images.unsplash.com/photo-1506784365847-60b3559f633c?q=80&w=1000',
    category: 'WELLNESS',
    publishDate: '2周前',
    readCount: 6200,
    author: '高效学习实验室',
    readTime: '5分钟',
    wellnessCard: { gradeRange: '6-9年级', icon: '📅', colorClass: 'bg-teal-500' },
    vocabulary: [],
    relatedArticles: ['well-002', 'well-001'],
    blocks: [
      { type: 'intro', content: '作业堆成山、补课排不完、还想打游戏……感觉时间永远不够用？4象限法则帮你理清思路。' },
      { type: 'text', content: '把所有任务按"紧急度"和"重要度"分成4个象限：① 紧急+重要（立刻做） ② 不紧急+重要（计划做） ③ 紧急+不重要（委托或快速处理） ④ 不紧急+不重要（最后做或不做）' },
      { type: 'text', content: '关键洞见：大多数人把时间花在第①③象限（救火），而高效的人把时间花在第②象限（预防火灾）。提前规划，才能掌控生活。' }
    ],
    content: ''
  }
];

// ==================== SHORT VIDEO MOCK DATA ====================
// Injected into MOCK_ARTICLES at module level
const SHORT_VIDEO_ARTICLES: Article[] = [
  {
    id: 'short-001',
    title: 'AI如何识别人脸？深度学习揭秘',
    coverImage: 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?q=80&w=600&h=1067&fit=crop',
    category: 'SCIENCE',
    publishDate: '昨天',
    readCount: 98700,
    author: '科技日报',
    readTime: '3分钟',
    shortVideo: {
      isShort: true,
      views: '9.8万',
      likes: '2.1万',
      favorites: '6800',
      tags: ['#科技', '#AI', '#人工智能'],
      author: '@科技日报',
    },
    vocabulary: [],
    relatedArticles: ['news-001', 'sci-007'],
    blocks: [
      { type: 'intro', content: '手机解锁、安检闸机、甚至超市收银……人脸识别已经悄悄渗透进我们生活的每个角落。它背后到底是什么原理？' },
      { type: 'text', content: '人脸识别的核心是"深度卷积神经网络"（CNN）。简单说，就是让计算机模拟人类大脑的视觉皮层，自动提取人脸上的特征点：眼距、鼻梁高度、下颌角度……' },
      { type: 'text', content: '训练一个识别率超过99%的人脸模型，需要数百万张标注图片。你每次解锁手机，都在帮AI"练习"呢！' }
    ],
    content: ''
  },
  {
    id: 'short-002',
    title: '一颗恒星的诞生：宇宙婴儿是怎么长大的',
    coverImage: 'https://images.unsplash.com/photo-1462332420958-a05d1e002413?q=80&w=600&h=1067&fit=crop',
    category: 'SCIENCE',
    publishDate: '2天前',
    readCount: 67400,
    author: '宇宙探索频道',
    readTime: '4分钟',
    shortVideo: {
      isShort: true,
      views: '6.7万',
      likes: '1.5万',
      favorites: '4200',
      tags: ['#宇宙', '#天文', '#恒星'],
      author: '@宇宙探索频道',
    },
    vocabulary: [],
    relatedArticles: ['news-001'],
    blocks: [
      { type: 'intro', content: '太阳已经燃烧了46亿年，它是怎么诞生的？所有恒星的起点，都是一片飘渺的星云。' },
      { type: 'text', content: '星际空间中漂浮着大量气体和尘埃，主要是氢和氦。当一片区域密度足够大，自身引力开始占主导，气体开始向中心"坍缩"。' },
      { type: 'text', content: '随着物质不断聚集，核心温度持续升高。当温度达到约1000万摄氏度时，氢核聚变点火——一颗新的恒星就这样诞生了！' },
    ],
    content: ''
  },
  {
    id: 'short-003',
    title: '蜜蜂的舞蹈语言：大自然最精确的GPS',
    coverImage: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=600&h=1067&fit=crop',
    category: 'SCIENCE',
    publishDate: '3天前',
    readCount: 45200,
    author: '自然奥秘探索',
    readTime: '3分钟',
    shortVideo: {
      isShort: true,
      views: '4.5万',
      likes: '8900',
      favorites: '3100',
      tags: ['#生物', '#蜜蜂', '#自然'],
      author: '@自然奥秘探索',
    },
    vocabulary: [],
    relatedArticles: ['sci-005'],
    blocks: [
      { type: 'intro', content: '蜜蜂找到蜜源后，如何"告诉"同伴在哪里？答案是——跳舞！而且这支舞精确到能传达方向和距离。' },
      { type: 'text', content: '奥地利科学家弗里希发现了蜜蜂的"摆尾舞"：蜜蜂画出一个类似"8"字的路径，摆尾段的方向表示蜜源相对太阳的角度，持续时间表示距离。' },
      { type: 'text', content: '误差率不到1%！这让弗里希获得了1973年的诺贝尔生理学或医学奖。' },
    ],
    content: ''
  },
  {
    id: 'short-004',
    title: '地球磁场：看不见的保护罩',
    coverImage: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=600&h=1067&fit=crop',
    category: 'SCIENCE',
    publishDate: '4天前',
    readCount: 52800,
    author: '地球科学频道',
    readTime: '4分钟',
    shortVideo: {
      isShort: true,
      views: '5.3万',
      likes: '1.1万',
      favorites: '3600',
      tags: ['#地球', '#物理', '#科学'],
      author: '@地球科学频道',
    },
    vocabulary: [],
    relatedArticles: [],
    blocks: [
      { type: 'intro', content: '如果地球没有磁场，太阳风会把大气层一点一点吹走，就像火星一样。磁场是地球生命的"隐形守护者"。' },
      { type: 'text', content: '地球磁场来自地球内部的液态铁镍核，高速旋转的导电液体产生"发电机效应"，形成强大的磁场向外延伸数万千米。' },
      { type: 'text', content: '有趣的是，地球磁极会定期"翻转"——历史上已经发生了数百次！上一次翻转大约在78万年前。' },
    ],
    content: ''
  },
  {
    id: 'short-005',
    title: '光速到底有多快？一个让人头晕的数字',
    coverImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=600&h=1067&fit=crop',
    category: 'SCIENCE',
    publishDate: '5天前',
    readCount: 81300,
    author: '物理达人说',
    readTime: '3分钟',
    shortVideo: {
      isShort: true,
      views: '8.1万',
      likes: '1.9万',
      favorites: '5200',
      tags: ['#物理', '#光速', '#宇宙'],
      author: '@物理达人说',
    },
    vocabulary: [],
    relatedArticles: ['short-002'],
    blocks: [
      { type: 'intro', content: '光速是每秒约30万千米——1秒能绕地球7.5圈。但放在宇宙尺度下，光速其实"慢得可怜"。' },
      { type: 'text', content: '从地球到月球，光需要约1.3秒；到太阳需要8分20秒；到最近的恒星比邻星，需要4.2年。' },
      { type: 'card', icon: '💡', title: '为什么光速是宇宙极限？', content: '根据爱因斯坦的狭义相对论，任何有质量的物体都无法达到光速——加速到光速所需的能量是无穷大。' },
    ],
    content: ''
  },
];

// ==================== CHARITY 爱心公告栏（成果反馈详情） ====================
const CHARITY_FEEDBACK_ARTICLES: Article[] = [
  {
    id: 'charity-fb-001',
    title: '感谢视频｜云南守望小学图书角落成',
    coverImage: 'https://images.unsplash.com/photo-1497633760303-59a0f8e7882e',
    category: 'CHARITY',
    publishDate: '2026年3月20日',
    readCount: 5200,
    author: '通晤纪公益组',
    readTime: '2分钟',
    vocabulary: [],
    relatedArticles: ['charity-fb-002', 'charity-fb-003'],
    blocks: [
      { type: 'intro', content: '【隐私说明】本素材已隐去学生姓名及正面肖像，仅保留书本、教室环境与背影画面，经校方书面确认后发布。' },
      { type: 'text', content: '3月18日，「守望乡图书角」项目正式验收。6 组书架与 1200 余册读物入驻三年级至六年级教室走廊。' },
      { type: 'text', content: '视频中，孩子们以背影出镜写下感谢卡：「谢谢远方的哥哥姐姐，我们更喜欢下课去看书了。」' },
      { type: 'image', src: 'https://images.unsplash.com/photo-1481627834875-b7833e8f5570', caption: '图书角一角（无学生正面）' },
    ],
    content: ''
  },
  {
    id: 'charity-fb-002',
    title: '图文报告｜青海洪水镇多媒体教室启用',
    coverImage: 'https://images.unsplash.com/photo-1523050854058-5079616a0a5e',
    category: 'CHARITY',
    publishDate: '2026年3月27日',
    readCount: 4100,
    author: '通晤纪公益组',
    readTime: '4分钟',
    vocabulary: [],
    relatedArticles: ['charity-fb-001', 'charity-fb-003'],
    blocks: [
      { type: 'intro', content: '【隐私说明】报道中不出现学生正面肖像，姓名均已化名；配图均为教室全景与教师指导场景。' },
      { type: 'text', content: '多媒体教室配备投影仪、音响与宽带接入，首堂「云端公开课」连线省会名师，覆盖 612 名学生。' },
      { type: 'text', content: '校方反馈：课堂互动明显提升，尤其英语与科学学科学生举手率提高。' },
    ],
    content: ''
  },
  {
    id: 'charity-fb-003',
    title: '感谢视频｜甘肃岷县护眼灯送达现场',
    coverImage: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b',
    category: 'CHARITY',
    publishDate: '2026年3月30日',
    readCount: 6800,
    author: '通晤纪公益组',
    readTime: '2分钟',
    vocabulary: [],
    relatedArticles: ['charity-fb-001', 'charity-fb-004'],
    blocks: [
      { type: 'intro', content: '【隐私说明】视频经监护人授权采集，仅展示侧影、手部特写与课桌台灯，无清晰正脸。' },
      { type: 'text', content: '120 盏护眼 LED 台灯在晚自习前全部安装完毕，平均每张课桌一盏，照度达到阅读标准。' },
      { type: 'text', content: '孩子们手写感谢信特写入镜：「眼睛不累了，谢谢爱心公告栏的哥哥姐姐！」' },
    ],
    content: ''
  },
  {
    id: 'charity-fb-004',
    title: '资助简报｜3月爱心池支出明细公示',
    coverImage: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40',
    category: 'CHARITY',
    publishDate: '2026年4月1日',
    readCount: 2900,
    author: '通晤纪公益组',
    readTime: '3分钟',
    vocabulary: [],
    relatedArticles: ['charity-fb-002'],
    blocks: [
      { type: 'intro', content: '本月爱心池收入：用户捐赠积分折算 ¥18,200，通晤纪配捐 ¥28,600；支出 ¥42,400，结余 ¥156,800。' },
      { type: 'text', content: '支出科目：教学设备采购 78%、物流与验收 12%、项目运营与审计 10%。' },
      { type: 'text', content: '附：三所学校的验收纪要编号与发票摘要（脱敏）已在月报中同步公示。' },
    ],
    content: ''
  },
];

// Merge short videos into main array
MOCK_ARTICLES.push(...SHORT_VIDEO_ARTICLES);
MOCK_ARTICLES.push(...CHARITY_FEEDBACK_ARTICLES);

MOCK_ARTICLES.forEach(applyChildFriendlyImages);

export const isBilingualToday = (publishDate: string): boolean =>
  publishDate === '今天' || publishDate === '今日';

/** 解析每日一词相对发布日期为距今天数；无法解析时返回 null */
export const getDailyWordDaysAgo = (publishDate: string): number | null => {
  const d = publishDate.trim();
  if (d === '今天' || d === '今日') return 0;
  if (d === '昨天') return 1;
  const days = d.match(/^(\d+)天前$/);
  if (days) return Number(days[1]);
  const weeks = d.match(/^(\d+)周前$/);
  if (weeks) return Number(weeks[1]) * 7;
  return null;
};

/** 每日一词往期上限：不含今天，最多 13 天（加上今日共两周） */
export const DAILY_WORD_ARCHIVE_MAX_DAYS = 13;

export const isWithinDailyWordArchiveWindow = (publishDate: string): boolean => {
  const days = getDailyWordDaysAgo(publishDate);
  return days !== null && days >= 1 && days <= DAILY_WORD_ARCHIVE_MAX_DAYS;
};

export const getBilingualArticles = (): Article[] =>
  MOCK_ARTICLES.filter(a => a.category === 'BILINGUAL' && a.bilingualCard);

export const getTodayBilingualByType = (): Partial<Record<BilingualCardType, Article>> => {
  const map: Partial<Record<BilingualCardType, Article>> = {};
  for (const type of BILINGUAL_CARD_TYPES) {
    const article = MOCK_ARTICLES.find(
      a => a.category === 'BILINGUAL' && a.bilingualCard?.type === type && isBilingualToday(a.publishDate)
    );
    if (article) map[type] = article;
  }
  return map;
};

export const getArticleExcerpt = (article: Article, maxLen = 48): string => {
  const raw =
    article.blocks?.find(b => b.type === 'intro' || b.type === 'text')?.content ||
    article.content ||
    '';
  const text = String(raw).replace(/\s+/g, ' ').trim();
  if (!text) return '点击查看详情...';
  return text.length > maxLen ? `${text.slice(0, maxLen)}...` : text;
};

export const isPlayableVideoArticle = (article: Article): boolean =>
  !!article.shortVideo?.isShort || !!article.videoCard?.isVideo;

export const isPortraitVideoArticle = (article: Article): boolean =>
  !!article.shortVideo?.isShort || !!article.videoCard?.portraitCover;

export const getArticleBodyPlainText = (article: Article): string => {
  const parts =
    article.blocks
      ?.filter(b => b.type === 'intro' || b.type === 'text')
      .map(b => String(b.content ?? ''))
      .filter(Boolean) ?? [];
  return parts.join(' ').replace(/\s+/g, ' ').trim();
};

export const getVideoViewsLabel = (article: Article): string =>
  article.shortVideo?.views ?? article.videoCard?.views ?? '';

export const getVideoLikesLabel = (article: Article): string =>
  article.shortVideo?.likes ?? article.videoCard?.likes ?? '';

export const getVideoFavoritesLabel = (article: Article): string =>
  article.shortVideo?.favorites ?? article.videoCard?.favorites ?? '';

export const getVideoAuthorLabel = (article: Article): string =>
  article.shortVideo?.author ?? article.author;

export const getVideoDurationLabel = (article: Article): string =>
  article.videoCard?.duration ?? article.readTime;

/** 时事速递「热门精选」随机视频文案池 */
const NEWS_HOT_SPOT_SEEDS = [
  { title: '神舟飞船发射全程回顾', author: '央视新闻', duration: '2:18', views: '4.2万' },
  { title: '巴黎气候大会最新进展', author: '环球视野', duration: '1:45', views: '2.8万' },
  { title: '全国高考放榜日现场直击', author: '教育快讯', duration: '3:02', views: '5.6万' },
  { title: '台风路径实时追踪解读', author: '气象在线', duration: '1:30', views: '3.1万' },
  { title: '联合国青少年峰会精彩瞬间', author: '国际观察', duration: '2:55', views: '1.9万' },
  { title: '新能源汽车销量创新高', author: '财经日报', duration: '2:12', views: '2.4万' },
  { title: '长江禁渔成效首次发布', author: '生态中国', duration: '1:58', views: '3.7万' },
  { title: '亚洲杯决赛高燃集锦', author: '体育周报', duration: '2:40', views: '6.8万' },
  { title: 'AI辅助教学试点校探访', author: '科技日报', duration: '1:36', views: '1.5万' },
  { title: '世界遗产保护新规解读', author: '文化之声', duration: '2:08', views: '9800' },
  { title: '城市地铁新线开通实况', author: '城市早报', duration: '1:22', views: '2.1万' },
  { title: '青少年机器人大赛幕后', author: '创新前沿', duration: '2:33', views: '4.5万' },
] as const;

const shuffleArray = <T,>(items: T[]): T[] => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const parseHotReadingViewCount = (views: string): number => {
  const wan = views.match(/^([\d.]+)万$/);
  if (wan) return Math.round(Number(wan[1]) * 10000);
  const num = Number(views.replace(/,/g, ''));
  return Number.isFinite(num) ? num : 1200;
};

/** 从竖版视频池随机抽取并套用时事向文案，供「热门精选」展示 */
export const pickNewsHotSpotItems = (
  sourceArticles: Article[],
  count = 4,
  excludeIds: string[] = []
): Article[] => {
  const exclude = new Set(excludeIds);
  const videoPool = sourceArticles.filter(
    a =>
      !exclude.has(a.id) &&
      (a.shortVideo?.isShort || (a.videoCard?.isVideo && a.videoCard.portraitCover))
  );
  const shuffledVideos = shuffleArray(videoPool);
  const seeds = shuffleArray([...NEWS_HOT_SPOT_SEEDS]).slice(0, count);

  return seeds.map((seed, i) => {
    const base = shuffledVideos[i] ?? shuffledVideos[i % Math.max(shuffledVideos.length, 1)];
    if (!base) {
      return {
        id: `news-hot-video-${i}`,
        title: seed.title,
        coverImage: '',
        category: 'CURRENT_EVENTS' as ArticleCategory,
        publishDate: '今天',
        readCount: parseHotReadingViewCount(seed.views),
        author: seed.author,
        readTime: seed.duration,
        content: '',
        vocabulary: [],
        relatedArticles: [],
        videoCard: {
          duration: seed.duration,
          views: seed.views,
          likes: '1200',
          favorites: '800',
          isVideo: true,
          portraitCover: true,
        },
      };
    }

    const authorTag = seed.author.startsWith('@') ? seed.author : `@${seed.author}`;
    return {
      ...base,
      title: seed.title,
      author: seed.author,
      readCount: parseHotReadingViewCount(seed.views),
      videoCard: {
        duration: seed.duration,
        views: seed.views,
        likes: base.shortVideo?.likes ?? base.videoCard?.likes ?? '1200',
        favorites: base.shortVideo?.favorites ?? base.videoCard?.favorites ?? '800',
        isVideo: true,
        portraitCover: true,
      },
      shortVideo: base.shortVideo
        ? { ...base.shortVideo, views: seed.views, author: authorTag }
        : undefined,
    };
  });
};

/** @deprecated 使用 pickNewsHotSpotItems */
export const pickNewsHotReadingVideos = pickNewsHotSpotItems;

/** 发布时间新旧排序：数值越大越新 */
export const getArticleRecencyScore = (publishDate: string): number => {
  const d = publishDate.trim();
  if (d === '今天' || d === '今日') return 1_000_000;
  if (d === '昨天') return 999_000;

  const hoursAgo = d.match(/^(\d+)小时前$/);
  if (hoursAgo) return 1_000_000 - Number(hoursAgo[1]) * 10;

  const daysAgo = d.match(/^(\d+)天前$/);
  if (daysAgo) return 990_000 - Number(daysAgo[1]) * 1_000;

  const weeksAgo = d.match(/^(\d+)周前$/);
  if (weeksAgo) return 900_000 - Number(weeksAgo[1]) * 10_000;

  const cnDate = d.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  if (cnDate) {
    const ts = new Date(Number(cnDate[1]), Number(cnDate[2]) - 1, Number(cnDate[3])).getTime();
    return ts > 0 ? ts : 0;
  }

  return 0;
};

const offsetDaysToCnDate = (daysAgo: number, ref = new Date()): string => {
  const dt = new Date(ref);
  dt.setDate(dt.getDate() - daysAgo);
  return `${dt.getFullYear()}年${dt.getMonth() + 1}月${dt.getDate()}日`;
};

/** 每日一词日期：仅「昨天」保留相对表述，其余显示年月日 */
export const formatDailyWordDateLabel = (publishDate: string, ref = new Date()): string => {
  const d = publishDate.trim();
  if (d === '昨天') return '昨天';

  const daysAgo = getDailyWordDaysAgo(d);
  if (daysAgo !== null) {
    return offsetDaysToCnDate(daysAgo, ref);
  }

  const cnDate = d.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  if (cnDate) {
    return `${cnDate[1]}年${Number(cnDate[2])}月${Number(cnDate[3])}日`;
  }

  return d;
};

/** 列表展示用：几分钟前 / 几小时前 / 几天前（最多3天）/ 年月日 */
export const formatPublishDateLabel = (publishDate: string): string => {
  const d = publishDate.trim();

  const minutes = d.match(/^(\d+)分钟前$/);
  if (minutes) return `${minutes[1]}分钟前`;

  const hours = d.match(/^(\d+)小时前$/);
  if (hours) return `${hours[1]}小时前`;

  if (d === '今天' || d === '今日') return '2小时前';
  if (d === '昨天') return '1天前';

  const days = d.match(/^(\d+)天前$/);
  if (days) {
    const n = Number(days[1]);
    if (n <= 3) return `${n}天前`;
    return offsetDaysToCnDate(n);
  }

  const weeks = d.match(/^(\d+)周前$/);
  if (weeks) return offsetDaysToCnDate(Number(weeks[1]) * 7);

  const cnDate = d.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  if (cnDate) {
    return `${cnDate[1]}年${Number(cnDate[2])}月${Number(cnDate[3])}日`;
  }

  return d;
};

export const getCategoryColor = (category: ArticleCategory): string => {
  switch (category) {
    case 'CAMPUS_NEWS': return 'bg-sky-500';
    case 'CURRENT_EVENTS': return 'bg-red-500';
    case 'SCIENCE': return 'bg-emerald-500';
    case 'LITERATURE': return 'bg-amber-500';
    case 'BILINGUAL': return 'bg-blue-500';
    case 'WELLNESS': return 'bg-violet-500';
    case 'CHARITY': return 'bg-rose-500';
    default: return 'bg-gray-500';
  }
};

export const getCategoryLabel = (category: ArticleCategory): string => {
  switch (category) {
    case 'CAMPUS_NEWS': return '校园';
    case 'CURRENT_EVENTS': return '时事';
    case 'SCIENCE': return '科普';
    case 'LITERATURE': return '美文';
    case 'BILINGUAL': return '双语';
    case 'WELLNESS': return '素养';
    case 'CHARITY': return '爱心';
    default: return '其他';
  }
};
