const CONTENT_LIMIT = 5;

function mockCoverSvg(text, bg = '#1677ff', fg = '#ffffff') {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180"><rect width="320" height="180" fill="${bg}"/><text x="160" y="98" text-anchor="middle" fill="${fg}" font-size="24" font-family="Arial,sans-serif">${text}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** 柜机广告区素材预览图（1080×600 比例） */
function mockAdMediaSvg(text, bg = '#1677ff', fg = '#ffffff') {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="600" viewBox="0 0 1080 600"><rect width="1080" height="600" fill="${bg}"/><text x="540" y="310" text-anchor="middle" fill="${fg}" font-size="48" font-family="Arial,sans-serif">${text}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const CABINET_CAROUSEL_LIMIT = 3;
const CABINET_AD_SIZE = { width: 1080, height: 600 };

const DEFAULT_DATA = {
  tags: [
    { id: 1, name: '标签1', contentCount: 12, status: 'enabled', createdAt: '2026-12-23 12:12:32', updatedAt: '2026-12-23 12:12:32' },
    { id: 2, name: '标签2', contentCount: 8, status: 'enabled', createdAt: '2026-12-22 10:00:00', updatedAt: '2026-12-22 10:00:00' },
    { id: 3, name: '标签3', contentCount: 5, status: 'disabled', createdAt: '2026-12-21 09:30:00', updatedAt: '2026-12-21 09:30:00' },
    { id: 4, name: '标签4', contentCount: 3, status: 'enabled', createdAt: '2026-12-20 14:20:00', updatedAt: '2026-12-20 14:20:00' },
    { id: 5, name: '标签5', contentCount: 0, status: 'enabled', createdAt: '2026-12-19 11:00:00', updatedAt: '2026-12-19 11:00:00' },
  ],
  channels: [
    { id: 2, name: '双语新知', parentId: null, parentName: '--', type: '图文', contentCount: 45, sort: 1, status: 'enabled', updatedAt: '2026-05-20 19:43:31', publishedAt: '2026-05-20 19:43:31', fixed: true },
    { id: 7, name: '每日一词', parentId: 2, parentName: '双语新知', type: '图文', contentCount: 0, sort: 2, status: 'enabled', updatedAt: '2026-05-20 19:43:31', publishedAt: '2026-05-20 19:43:31', fixed: true, noEdit: true },
    { id: 1, name: '时事速递', parentId: null, parentName: '--', type: '图文', contentCount: 32, sort: 3, status: 'enabled', updatedAt: '2026-05-19 15:20:00', publishedAt: '2026-05-18 09:00:00' },
    { id: 3, name: '科普探秘', parentId: null, parentName: '--', type: '图文', contentCount: 28, sort: 4, status: 'enabled', updatedAt: '2026-05-18 10:30:00', publishedAt: '2026-05-18 10:30:00' },
    { id: 4, name: '视频科普', parentId: 3, parentName: '科普探秘', type: '视频', contentCount: 8, sort: 5, status: 'draft', updatedAt: '2026-05-17 09:00:00', publishedAt: null },
    { id: 5, name: '校园热点', parentId: null, parentName: '--', type: '图文', contentCount: 20, sort: 6, status: 'disabled', updatedAt: '2026-05-16 14:00:00', publishedAt: null },
  ],
  contents: [
    { id: 101, title: '天亮为什么会有鸡鸣？', content: '公鸡为什么在清晨打鸣？其实这和它们的生物钟有关…', source: '新华社', type: '图文', channel: '科普探秘', channelId: 3, tags: ['标签1', '标签2'], status: 'enabled', views: 657, ctr: '34%', duration: '2分钟', importTime: '2026-05-20 19:43:31', hasImage: true, hasVideo: false, hasCover: true, coverName: 'cover-rooster.jpg', coverUrl: mockCoverSvg('鸡鸣', '#fa8c16') },
    { id: 102, title: '天空为什么会有彩虹？', content: '彩虹是阳光照射到空气中的小水滴时，发生折射和反射…', source: '新华社', type: '图文', channel: '科普探秘', channelId: 3, tags: ['标签1'], status: 'draft', views: 3455, ctr: '12.2%', duration: '3分钟', importTime: '2026-05-20 19:43:31', hasImage: true, hasVideo: false, hasCover: true, coverName: 'cover-rainbow.jpg', coverUrl: mockCoverSvg('彩虹', '#722ed1') },
    { id: 103, title: '大象的鼻子为什么那么长？', content: '大象的鼻子不仅是呼吸器官，还是它们最重要的工具…', source: '新华社', type: '视频', channel: '视频科普', channelId: 4, tags: ['标签2'], status: 'enabled', views: 1200, ctr: '28%', duration: '5分钟', importTime: '2026-05-20 19:43:31', hasImage: false, hasVideo: true, hasCover: true, coverName: 'cover-elephant.jpg', coverUrl: mockCoverSvg('大象', '#52c41a') },
    { id: 104, title: '2026春季校运会圆满落幕', content: '为期三天的春季运动会于昨日圆满结束…', source: '深圳新闻网', type: '图文', channel: '时事速递', channelId: 1, tags: ['标签1', '标签3'], status: 'draft', views: 890, ctr: '18%', duration: '2分钟', importTime: '2026-05-19 10:00:00', hasImage: true, hasVideo: false },
    { id: 105, title: '人工智能前沿讲座回顾', content: '计算机学院邀请知名学者开展AI专题讲座…', source: '校园新闻网', type: '视频', channel: '视频科普', channelId: 4, tags: ['标签2'], status: 'enabled', views: 2100, ctr: '22%', duration: '8分钟', importTime: '2026-05-18 14:30:00', hasImage: false, hasVideo: true, hasCover: true, coverName: 'cover-ai.jpg', coverUrl: mockCoverSvg('AI讲座', '#1677ff') },
    { id: 106, title: '图书馆延长开放时间通知', content: '期末期间图书馆延长开放至23:00…', source: '学校公告', type: '图文', channel: '时事速递', channelId: 1, tags: ['标签4'], status: 'disabled', views: 450, ctr: '15%', duration: '1分钟', importTime: '2026-05-17 08:00:00', hasImage: true, hasVideo: false },
    { id: 107, title: '为什么海水是咸的？', content: '海水中的盐分主要来自陆地上的岩石和矿物…', source: '新华社', type: '图文', channel: '科普探秘', channelId: 3, tags: ['标签1'], status: 'draft', views: 980, ctr: '21%', duration: '2分钟', importTime: '2026-05-20 19:43:31', hasImage: true, hasVideo: false },
    { id: 108, title: '校园摄影大赛作品展示', content: '2026年度校园摄影大赛优秀作品选登…', source: '深圳新闻网', type: '图文', channel: '校园热点', channelId: 5, tags: ['标签3'], status: 'draft', views: 760, ctr: '19%', duration: '3分钟', importTime: '2026-05-20 19:43:31', hasImage: true, hasVideo: false, hasCover: true, coverName: 'cover-photo.jpg', coverUrl: mockCoverSvg('摄影', '#eb2f96') },
    { id: 109, title: '编程马拉松大赛启动', content: '年度编程马拉松大赛正式启动报名…', source: '校园新闻网', type: '图文', channel: '时事速递', channelId: 1, tags: ['标签2'], status: 'disabled', views: 1120, ctr: '25%', duration: '2分钟', importTime: '2026-05-20 19:43:31', hasImage: true, hasVideo: false },
    { id: 110, title: '蝴蝶为什么会变色？', content: '蝴蝶翅膀上的鳞片含有特殊结构，能对光线产生干涉和衍射…', source: '新华社', type: '视频', channel: '视频科普', channelId: 4, tags: ['标签1', '标签2'], status: 'disabled', views: 1580, ctr: '26%', duration: '4分钟', importTime: '2026-05-21 10:15:00', hasImage: false, hasVideo: true, hasCover: true, coverName: 'cover-butterfly.jpg', coverUrl: mockCoverSvg('蝴蝶', '#13c2c2') },
    { id: 111, title: '火山是怎么喷发的？', content: '地球内部炽热的岩浆在巨大压力下冲破地壳，形成壮观的火山喷发…', source: '新华社', type: '视频', channel: '视频科普', channelId: 4, tags: ['标签2'], status: 'disabled', views: 2340, ctr: '31%', duration: '6分钟', importTime: '2026-05-21 11:20:00', hasImage: false, hasVideo: true },
    { id: 112, title: '太阳系八大行星探秘', content: '从水星到海王星，带你了解太阳系各行星的独特面貌与运行规律…', source: '科普中国', type: '视频', channel: '视频科普', channelId: 4, tags: ['标签1'], status: 'enabled', views: 3120, ctr: '35%', duration: '7分钟', importTime: '2026-05-22 09:00:00', hasImage: false, hasVideo: true, hasCover: true, coverName: 'cover-planets.jpg', coverUrl: mockCoverSvg('行星', '#2f54eb') },
    { id: 113, title: '地球的自转与昼夜交替', content: '地球每24小时自转一周，面向太阳的一侧为白天，背向的一侧为夜晚…', source: '科普中国', type: '视频', channel: '视频科普', channelId: 4, tags: ['标签2'], status: 'enabled', views: 1890, ctr: '29%', duration: '5分钟', importTime: '2026-05-22 14:30:00', hasImage: false, hasVideo: true },
    { id: 114, title: '恐龙为什么灭绝了？', content: '主流观点认为，约6600万年前的小行星撞击引发了全球气候剧变…', source: '新华社', type: '视频', channel: '视频科普', channelId: 4, tags: ['标签1', '标签2'], status: 'enabled', views: 2760, ctr: '33%', duration: '6分钟', importTime: '2026-05-23 16:00:00', hasImage: false, hasVideo: true, hasCover: true, coverName: 'cover-dino.jpg', coverUrl: mockCoverSvg('恐龙', '#fa541c') },
    { id: 115, title: '光的折射与彩虹形成', content: '阳光进入水滴后发生折射、反射和色散，不同颜色的光偏折角度不同…', source: '科普中国', type: '视频', channel: '视频科普', channelId: 4, tags: ['标签1'], status: 'enabled', views: 1420, ctr: '27%', duration: '4分钟', importTime: '2026-05-24 08:45:00', hasImage: false, hasVideo: true },
  ],
  sections: [
    { id: 1, sort: 1, name: '每日一词', subtitle: '每天学一个词', type: '图文', source: '自动·每日一词', sourceType: 'auto', displayLimit: 1, contentCount: 1, status: 'enabled', updatedAt: '2026-03-23 18:13:31', publishedAt: '2026-03-23 18:13:31', fixed: true },
    { id: 2, sort: 2, name: '头条推荐', subtitle: '—', type: '图文', source: '手动·时事速递', sourceType: 'manual', contentCount: 2, linkedContentIds: [106, 109], status: 'enabled', updatedAt: '2026-03-18 16:00:00', publishedAt: '2026-03-20 09:00:00' },
    { id: 3, sort: 3, name: '科普视频', subtitle: '探索科学奥秘', type: '视频', source: '自动·科普探秘', sourceType: 'auto', displayLimit: 5, contentCount: 3, status: 'enabled', updatedAt: '2026-03-22 10:00:00', publishedAt: '2026-03-22 10:00:00' },
    { id: 4, sort: 4, name: '校园热点', subtitle: '—', type: '图文', source: '自动·校园热点', sourceType: 'auto', displayLimit: 5, contentCount: 5, status: 'disabled', updatedAt: '2026-03-21 09:00:00', publishedAt: null },
    { id: 5, sort: 5, name: '学习加油站', subtitle: '优质学习资源', type: '图文', source: '手动·双语新知', sourceType: 'manual', contentCount: 0, linkedContentIds: [], status: 'draft', updatedAt: '2026-03-20 16:00:00', publishedAt: null },
  ],
  dailyWords: [
    { grade: '一年级', wordCount: 1500, updatedAt: '2026-05-20 19:43:31', importTime: '2026-05-01 10:00:00' },
    { grade: '二年级', wordCount: 2500, updatedAt: '2026-05-20 19:43:31', importTime: '2026-05-01 10:00:00' },
    { grade: '三年级', wordCount: 4000, updatedAt: '2026-05-20 19:43:31', importTime: '2026-05-01 10:00:00' },
    { grade: '四年级', wordCount: 0, updatedAt: '2024-05-20 19:43:31', importTime: '' },
    { grade: '五年级', wordCount: 0, updatedAt: '2024-05-20 19:43:31', importTime: '' },
    { grade: '六年级', wordCount: 0, updatedAt: '2024-05-20 19:43:31', importTime: '' },
    { grade: '七年级', wordCount: 0, updatedAt: '2024-05-20 19:43:31', importTime: '' },
    { grade: '八年级', wordCount: 0, updatedAt: '2024-05-20 19:43:31', importTime: '' },
    { grade: '九年级', wordCount: 0, updatedAt: '2024-05-20 19:43:31', importTime: '' },
  ],
  wordLists: {
    '一年级': [
      { id: 1, word: 'a / an', phonetic: '/ə; eɪ/', definition: 'art. 一个（件）', example: 'I have a book.', exampleCn: '我有一本书。', effectiveTime: '2026-05-20 19:43:31', importTime: '2026-05-01 10:00:00' },
      { id: 2, word: 'a.m. / am', phonetic: '/ˌeɪ ˈem/', definition: 'adv. 上午', example: 'School starts at 8 a.m.', exampleCn: '学校上午8点开始。', effectiveTime: '2026-05-20 19:43:31', importTime: '2026-05-01 10:00:00' },
      { id: 3, word: 'able', phonetic: '/ˈeɪbl/', definition: 'adj. 能够; 有能力的', example: 'He is able to swim across the pool.', exampleCn: '他能游过游泳池。', effectiveTime: '2026-05-27 19:43:31', importTime: '2026-05-01 10:00:00' },
    ],
    '二年级': [],
    '三年级': [],
  },
  lastPublishedAt: '2026-03-23 18:13:31',
  draftStatus: '草稿中',
  hotRecommend: {
    sourceType: 'auto',
    displayLimit: 3,
    channelFilter: '全部',
    sortBy: '阅读量',
    autoFreq: '每日0点刷新',
    linkedContentIds: [],
    status: 'enabled',
    publishedAt: '2026-05-20 10:00:00',
    updatedAt: '2026-05-20 10:00:00',
  },

  /* 柜机广告轮播（按柜机下发，展示区 1080×600） */
  cabinetCarouselImageDurationSec: 5,
  cabinetCarousels: {
    'CAB-001': {
      items: [
        { id: 'cc-001-1', type: 'image', name: '开学季欢迎海报.jpg', url: mockAdMediaSvg('开学季欢迎', '#1677ff') },
        { id: 'cc-001-2', type: 'image', name: '借还操作引导.jpg', url: mockAdMediaSvg('借还引导', '#001529') },
        { id: 'cc-001-3', type: 'image', name: '文明用机提示.jpg', url: mockAdMediaSvg('文明用机', '#13c2c2') },
      ],
      updatedAt: '2026-06-08 11:20:00',
    },
    'CAB-002': {
      items: [
        { id: 'cc-002-1', type: 'image', name: '教学楼活动宣传.jpg', url: mockAdMediaSvg('活动宣传', '#722ed1') },
        { id: 'cc-002-2', type: 'image', name: '安全须知.jpg', url: mockAdMediaSvg('安全须知', '#fa8c16') },
      ],
      updatedAt: '2026-06-07 16:40:00',
    },
  },

  /* 设备管理 · 学习平板借租柜 */
  cabinets: [
    { id: 'CAB-001', name: '图书馆一楼借租柜', location: '图书馆 1F 大厅东侧', totalSlots: 24, usedSlots: 6, online: true, lastHeartbeat: '2026-06-08 14:32:05', boundPhone: '13800001001', manager: '李老师', managerContact: '13800138001' },
    { id: 'CAB-002', name: '教学楼A座借租柜', location: '教学楼 A 座 3F 走廊', totalSlots: 16, usedSlots: 4, online: true, lastHeartbeat: '2026-06-08 14:31:58', boundPhone: '13800001002', manager: '王老师', managerContact: '13900139002' },
    { id: 'CAB-003', name: '实验楼借租柜', location: '实验楼 2F 入口', totalSlots: 12, usedSlots: 3, online: false, lastHeartbeat: '2026-06-08 09:15:00', boundPhone: '13800001003', manager: '张老师', managerContact: '13700137003' },
  ],
  tablets: [
    /* CAB-001 · 格口状态样例柜：已绑定平板=已激活，损坏设备=异常（体现在设备状态），未绑定平板=未激活 */
    { id: 'TAB-007', sn: 'SN20260301007', model: '学习平板 Pro 10', cabinetId: 'CAB-001', slotNo: 1, battery: 100, status: 'in_cabinet', charging: true, doorStatus: 'closed', slotState: 'charging', qrCode: 'QR-TAB-007', lastInspection: '2026-06-07 16:20:10', condition: 'normal', initialScreenPhoto: { url: '#', label: '初始入柜屏幕照', capturedAt: '2026-03-04 09:00:00', aiResult: 'normal' } },
    { id: 'TAB-008', sn: 'SN20260301008', model: '学习平板 Pro 10', cabinetId: 'CAB-001', slotNo: 2, battery: 62, status: 'in_cabinet', charging: true, doorStatus: 'closed', slotState: 'charging', qrCode: 'QR-TAB-008', lastInspection: '2026-06-08 10:22:00', condition: 'normal', initialScreenPhoto: { url: '#', label: '初始入柜屏幕照', capturedAt: '2026-03-04 09:15:00', aiResult: 'normal' } },
    { id: 'TAB-003', sn: 'SN20260301003', model: '学习平板 Pro 10', cabinetId: 'CAB-001', slotNo: 3, battery: 100, status: 'in_cabinet', charging: false, doorStatus: 'closed', slotState: 'available', qrCode: 'QR-TAB-003', lastInspection: '2026-06-08 13:06:00', condition: 'normal', initialScreenPhoto: { url: '#', label: '初始入柜屏幕照', capturedAt: '2026-03-02 09:00:00', aiResult: 'normal' } },
    { id: 'TAB-010', sn: 'SN20260301010', model: '学习平板 Pro 10', cabinetId: 'CAB-001', slotNo: 4, battery: 35, status: 'borrowed', charging: false, doorStatus: null, slotState: null, qrCode: 'QR-TAB-010', lastInspection: '2026-06-08 12:05:00', condition: 'normal', currentStudentId: '2024010444', currentStudentName: '张伟', initialScreenPhoto: { url: '#', label: '初始入柜屏幕照', capturedAt: '2026-03-05 10:30:00', aiResult: 'normal' } },
    { id: 'TAB-005', sn: 'SN20260301005', model: '学习平板 Pro 10', cabinetId: 'CAB-001', slotNo: 5, battery: 78, status: 'maintenance', charging: false, doorStatus: 'closed', slotState: 'maintenance', qrCode: 'QR-TAB-005', lastInspection: '2026-06-07 16:40:22', condition: 'damaged', initialScreenPhoto: { url: '#', label: '初始入柜屏幕照', capturedAt: '2026-03-03 11:00:00', aiResult: 'normal' } },
    { id: 'TAB-001', sn: 'SN20260301001', model: '学习平板 Pro 10', cabinetId: 'CAB-001', slotNo: 6, battery: 68, status: 'in_cabinet', charging: true, doorStatus: 'open', slotState: 'charging', qrCode: 'QR-TAB-001', lastInspection: '2026-06-07 11:00:05', condition: 'normal', initialScreenPhoto: { url: '#', label: '初始入柜屏幕照', capturedAt: '2026-03-01 10:00:00', aiResult: 'normal' } },
    /* CAB-001 借出中（不在格口网格） */
    { id: 'TAB-002', sn: 'SN20260301002', model: '学习平板 Pro 10', cabinetId: 'CAB-001', slotNo: 8, battery: 86, status: 'borrowed', charging: false, doorStatus: null, slotState: null, qrCode: 'QR-TAB-002', lastInspection: '2026-06-07 18:20:00', condition: 'normal', currentStudentId: '2024010156', currentStudentName: '李明', initialScreenPhoto: { url: '#', label: '初始入柜屏幕照', capturedAt: '2026-03-01 10:05:00', aiResult: 'normal' } },
    { id: 'TAB-006', sn: 'SN20260301006', model: '学习平板 Pro 10', cabinetId: 'CAB-001', slotNo: 12, battery: 15, status: 'borrowed', isOverdue: true, charging: false, doorStatus: null, slotState: null, qrCode: 'QR-TAB-006', lastInspection: '2026-06-05 09:00:00', condition: 'normal', currentStudentId: '2024020088', currentStudentName: '王芳', initialScreenPhoto: { url: '#', label: '初始入柜屏幕照', capturedAt: '2026-03-03 11:30:00', aiResult: 'normal' } },
    { id: 'TAB-009', sn: 'SN20260301009', model: '学习平板 Air 8', cabinetId: 'CAB-001', slotNo: 9, battery: 67, status: 'borrowed', charging: false, doorStatus: null, slotState: null, qrCode: 'QR-TAB-009', lastInspection: '2026-06-08 11:30:00', condition: 'normal', currentStudentId: '2024010888', currentStudentName: '冯雪', initialScreenPhoto: { url: '#', label: '初始入柜屏幕照', capturedAt: '2026-03-05 10:00:00', aiResult: 'normal' } },
    { id: 'TAB-011', sn: 'SN20260301011', model: '学习平板 Pro 10', cabinetId: 'CAB-001', slotNo: 7, battery: 54, status: 'borrowed', charging: false, doorStatus: null, slotState: null, qrCode: 'QR-TAB-011', lastInspection: '2026-06-08 08:45:00', condition: 'normal', currentStudentId: '2024010789', currentStudentName: '周杰', initialScreenPhoto: { url: '#', label: '初始入柜屏幕照', capturedAt: '2026-03-06 11:00:00', aiResult: 'normal' } },
    { id: 'TAB-012', sn: 'SN20260301012', model: '学习平板 Air 8', cabinetId: 'CAB-001', slotNo: 10, battery: 18, status: 'borrowed', charging: false, doorStatus: null, slotState: null, qrCode: 'QR-TAB-012', lastInspection: '2026-06-08 13:40:00', condition: 'normal', currentStudentId: '2024010999', currentStudentName: '陈晨', initialScreenPhoto: { url: '#', label: '初始入柜屏幕照', capturedAt: '2026-03-06 11:30:00', aiResult: 'normal' } },
    /* CAB-002 */
    { id: 'TAB-004', sn: 'SN20260301004', model: '学习平板 Pro 10', cabinetId: 'CAB-002', slotNo: 2, battery: 100, status: 'in_cabinet', charging: false, doorStatus: 'closed', slotState: 'available', qrCode: 'QR-TAB-004', lastInspection: '2026-06-08 07:55:00', condition: 'normal', initialScreenPhoto: { url: '#', label: '初始入柜屏幕照', capturedAt: '2026-03-02 09:30:00', aiResult: 'normal' } },
    { id: 'TAB-013', sn: 'SN20260301013', model: '学习平板 Pro 10', cabinetId: 'CAB-002', slotNo: 1, battery: 61, status: 'borrowed', charging: false, doorStatus: null, slotState: null, qrCode: 'QR-TAB-013', lastInspection: '2026-06-08 09:20:00', condition: 'normal', currentStudentId: '2024020312', currentStudentName: '吴敏', initialScreenPhoto: { url: '#', label: '初始入柜屏幕照', capturedAt: '2026-03-07 09:00:00', aiResult: 'normal' } },
    { id: 'TAB-014', sn: 'SN20260301014', model: '学习平板 Pro 10', cabinetId: 'CAB-002', slotNo: 3, battery: 100, status: 'in_cabinet', charging: true, doorStatus: 'closed', slotState: 'charging', qrCode: 'QR-TAB-014', lastInspection: '2026-06-08 09:35:22', condition: 'normal', initialScreenPhoto: { url: '#', label: '初始入柜屏幕照', capturedAt: '2026-03-07 09:30:00', aiResult: 'normal' } },
    { id: 'TAB-015', sn: 'SN20260301015', model: '学习平板 Air 8', cabinetId: 'CAB-002', slotNo: 4, battery: 52, status: 'in_cabinet', charging: true, doorStatus: 'closed', slotState: 'charging', qrCode: 'QR-TAB-015', lastInspection: '2026-06-08 08:55:00', condition: 'normal', initialScreenPhoto: { url: '#', label: '初始入柜屏幕照', capturedAt: '2026-03-08 10:00:00', aiResult: 'normal' } },
    { id: 'TAB-016', sn: 'SN20260301016', model: '学习平板 Pro 10', cabinetId: 'CAB-002', slotNo: 5, battery: 95, status: 'borrowed', isOverdue: true, charging: false, doorStatus: null, slotState: null, qrCode: 'QR-TAB-016', lastInspection: '2026-06-08 10:40:00', condition: 'normal', currentStudentId: '2024020777', currentStudentName: '林涛', initialScreenPhoto: { url: '#', label: '初始入柜屏幕照', capturedAt: '2026-03-08 10:30:00', aiResult: 'normal' } },
    { id: 'TAB-017', sn: 'SN20260301017', model: '学习平板 Pro 10', cabinetId: 'CAB-002', slotNo: 7, battery: 45, status: 'in_cabinet', charging: true, doorStatus: 'open', slotState: 'charging', qrCode: 'QR-TAB-017', lastInspection: '2026-06-08 11:15:00', condition: 'normal', initialScreenPhoto: { url: '#', label: '初始入柜屏幕照', capturedAt: '2026-03-09 09:00:00', aiResult: 'normal' } },
    /* CAB-003 */
    { id: 'TAB-018', sn: 'SN20260301018', model: '学习平板 Air 8', cabinetId: 'CAB-003', slotNo: 1, battery: 100, status: 'in_cabinet', charging: true, doorStatus: 'closed', slotState: 'charging', qrCode: 'QR-TAB-018', lastInspection: '2026-06-06 17:10:00', condition: 'normal', initialScreenPhoto: { url: '#', label: '初始入柜屏幕照', capturedAt: '2026-03-10 10:00:00', aiResult: 'normal' } },
    { id: 'TAB-019', sn: 'SN20260301019', model: '学习平板 Pro 10', cabinetId: 'CAB-003', slotNo: 3, battery: 72, status: 'in_cabinet', charging: true, doorStatus: 'closed', slotState: 'charging', qrCode: 'QR-TAB-019', lastInspection: '2026-06-07 17:30:00', condition: 'normal', initialScreenPhoto: { url: '#', label: '初始入柜屏幕照', capturedAt: '2026-03-10 10:30:00', aiResult: 'normal' } },
    { id: 'TAB-020', sn: 'SN20260301020', model: '学习平板 Pro 10', cabinetId: 'CAB-003', slotNo: 5, battery: 58, status: 'in_cabinet', charging: true, doorStatus: 'closed', slotState: 'charging', qrCode: 'QR-TAB-020', lastInspection: '2026-06-07 18:00:00', condition: 'normal', initialScreenPhoto: { url: '#', label: '初始入柜屏幕照', capturedAt: '2026-03-11 09:00:00', aiResult: 'normal' } },
  ],
  usageRecords: [
    /* —— 共 20 条：开门中 / 已归还 / 借出中 / 归还异常 / 已逾期 / 取消借用，便于使用记录页对照 —— */
    {
      id: 'UR-20260724001', tabletId: 'TAB-001', sn: 'SN20260301001', studentId: '2024010666', studentName: '黄蕾', grade: '四年级2班',
      cabinetBorrow: 'CAB-001', slotBorrow: 6, borrowAt: '2026-07-24 09:10:00',
      returnAt: null, cabinetReturn: 'CAB-001', slotReturn: 6, status: 'cancelled',
      cancelReason: 'charger_connected', cancelledAt: '2026-07-24 09:12:18',
      beforeCondition: { aiResult: 'normal', compareLabel: '初始入柜照', compareWith: 'initial' },
      returnInspection: null, overdue: false,
      cancelDetection: {
        reason: 'charger_connected', completedAt: '2026-07-24 09:12:18',
        steps: [
          { time: '2026-07-24 09:10:00', action: '编号密码验证成功，确认借取后柜门打开' },
          { time: '2026-07-24 09:12:18', action: '设备未拔充电器，关门后取消借用' },
        ],
      },
    },
    {
      id: 'UR-20260724002', tabletId: 'TAB-001', sn: 'SN20260301001', studentId: '2024010777', studentName: '马超', grade: '五年级1班',
      cabinetBorrow: 'CAB-001', slotBorrow: 6, borrowAt: '2026-07-24 10:05:00',
      returnAt: null, cabinetReturn: 'CAB-001', slotReturn: 6, status: 'cancelled',
      cancelReason: 'charger_connected', cancelledAt: '2026-07-24 10:08:42',
      beforeCondition: { aiResult: 'normal', compareLabel: '初始入柜照', compareWith: 'initial' },
      returnInspection: null, overdue: false,
      cancelDetection: {
        reason: 'charger_connected', completedAt: '2026-07-24 10:08:42',
        steps: [
          { time: '2026-07-24 10:05:00', action: '编号密码验证成功，确认借取后柜门打开' },
          { time: '2026-07-24 10:08:42', action: '设备未拔充电器，关门后取消借用' },
        ],
      },
    },
    {
      id: 'UR-20260724003', tabletId: 'TAB-004', sn: 'SN20260301004', studentId: '2024010111', studentName: '何雨', grade: '三年级2班',
      cabinetBorrow: 'CAB-002', slotBorrow: 2, borrowAt: '2026-07-24 08:20:00',
      returnAt: null, cabinetReturn: 'CAB-002', slotReturn: 2, status: 'cancelled',
      cancelReason: 'charger_connected', cancelledAt: '2026-07-24 08:21:05',
      beforeCondition: { aiResult: 'normal', compareLabel: '初始入柜照', compareWith: 'initial' },
      returnInspection: null, overdue: false,
      cancelDetection: {
        reason: 'charger_connected', completedAt: '2026-07-24 08:21:05',
        steps: [
          { time: '2026-07-24 08:20:00', action: '编号密码验证成功，确认借取后柜门打开' },
          { time: '2026-07-24 08:21:05', action: '设备未拔充电器，关门后取消借用' },
        ],
      },
    },
    {
      id: 'UR-20260608001', tabletId: 'TAB-002', sn: 'SN20260301002', studentId: '2024010156', studentName: '李明', grade: '四年级2班',
      cabinetBorrow: 'CAB-001', slotBorrow: 8, borrowAt: '2026-07-24 09:15:33',
      returnAt: null, cabinetReturn: null, status: 'borrowed',
      beforeCondition: { aiResult: 'normal', compareLabel: '初始入柜照', compareWith: 'initial' },
      returnInspection: null, overdue: false,
    },
    {
      id: 'UR-20260608006', tabletId: 'TAB-011', sn: 'SN20260301011', studentId: '2024010789', studentName: '周杰', grade: '五年级3班',
      cabinetBorrow: 'CAB-001', slotBorrow: 7, borrowAt: '2026-07-24 09:40:00',
      returnAt: null, cabinetReturn: null, status: 'borrowed',
      beforeCondition: { aiResult: 'normal', compareLabel: '初始入柜照', compareWith: 'initial' },
      returnInspection: null, overdue: false,
    },
    {
      id: 'UR-20260608007', tabletId: 'TAB-013', sn: 'SN20260301013', studentId: '2024020312', studentName: '吴敏', grade: '六年级1班',
      cabinetBorrow: 'CAB-002', slotBorrow: 1, borrowAt: '2026-07-24 10:20:00',
      returnAt: null, cabinetReturn: null, status: 'borrowed',
      beforeCondition: { aiResult: 'normal', compareLabel: '初始入柜照', compareWith: 'initial' },
      returnInspection: null, overdue: false,
    },
    {
      id: 'UR-20260608009', tabletId: 'TAB-009', sn: 'SN20260301009', studentId: '2024010888', studentName: '冯雪', grade: '四年级5班',
      cabinetBorrow: 'CAB-001', slotBorrow: 9, borrowAt: '2026-07-24 11:00:00',
      returnAt: null, cabinetReturn: 'CAB-001', slotReturn: 9, status: 'borrowed',
      beforeCondition: { aiResult: 'normal', compareLabel: '初始入柜照', compareWith: 'initial' },
      returnScan: { screenQrMatched: true, qrCode: 'QR-TAB-009', scannedAt: '2026-07-24 12:10:00' },
      returnScreenPhoto: { url: '#', label: '归还扫码屏拍照', capturedAt: '2026-07-24 12:10:01' },
      returnInspection: null, overdue: false,
      returnAttempt: { status: 'pending', issue: 'not_charging', at: '2026-07-24 12:12:00' },
    },
    {
      id: 'UR-20260724004', tabletId: 'TAB-012', sn: 'SN20260301012', studentId: '2024010999', studentName: '陈晨', grade: '五年级4班',
      cabinetBorrow: 'CAB-001', slotBorrow: 10, borrowAt: '2026-07-24 11:30:00',
      returnAt: null, cabinetReturn: null, status: 'borrowed',
      beforeCondition: { aiResult: 'normal', compareLabel: '初始入柜照', compareWith: 'initial' },
      returnInspection: null, overdue: false,
      returnAttempt: { status: 'cancelled', issue: 'misplaced', at: '2026-07-24 13:05:00', doorReopened: true },
    },
    {
      id: 'UR-20260605003', tabletId: 'TAB-006', sn: 'SN20260301006', studentId: '2024020088', studentName: '王芳', grade: '三年级3班',
      cabinetBorrow: 'CAB-001', slotBorrow: 12, borrowAt: '2026-07-23 10:05:00',
      returnAt: null, cabinetReturn: null, status: 'borrowed',
      beforeCondition: { aiResult: 'normal', compareLabel: '初始入柜照', compareWith: 'initial' },
      returnInspection: null, overdue: true,
      preAlertAt: '2026-07-24 09:55:00',
      forceLogoutAt: '2026-07-24 10:05:00',
      lastUserNote: '借出满24小时未归还；已提前10分钟通知学生端，并执行强制退出登录',
    },
    {
      id: 'UR-20260605004', tabletId: 'TAB-016', sn: 'SN20260301016', studentId: '2024020777', studentName: '林涛', grade: '六年级2班',
      cabinetBorrow: 'CAB-002', slotBorrow: 5, borrowAt: '2026-07-23 11:30:00',
      returnAt: null, cabinetReturn: null, status: 'borrowed',
      beforeCondition: { aiResult: 'normal', compareLabel: '初始入柜照', compareWith: 'initial' },
      returnInspection: null, overdue: true,
      preAlertAt: '2026-07-24 11:20:00',
      forceLogoutAt: '2026-07-24 11:30:00',
      lastUserNote: '借出满24小时未归还；已提前10分钟通知学生端，并执行强制退出登录',
    },
    {
      id: 'UR-20260608004', tabletId: 'TAB-001', sn: 'SN20260301001', studentId: '2024010201', studentName: '陈静', grade: '四年级1班',
      cabinetBorrow: 'CAB-001', slotBorrow: 6, borrowAt: '2026-07-24 13:30:00',
      returnAt: '2026-07-24 14:45:22', cabinetReturn: 'CAB-001', slotReturn: 6, status: 'returned',
      beforeCondition: { aiResult: 'normal', compareLabel: '初始入柜照', compareWith: 'initial' },
      returnScan: { screenQrMatched: true, qrCode: 'QR-TAB-001', scannedAt: '2026-07-24 14:44:30' },
      returnScreenPhoto: { url: '#', label: '归还扫码屏拍照', capturedAt: '2026-07-24 14:44:31' },
      returnInspection: { url: '#', label: '归还外观对比', capturedAt: '2026-07-24 14:45:22', aiResult: 'normal', detail: '外观无新增损伤' }, overdue: false,
      placementDetection: {
        result: 'success', doorStatus: 'closed', charging: true, completedAt: '2026-07-24 14:45:22', reportedToBackend: true,
        steps: [
          { time: '2026-07-24 14:44:50', action: '扫码拍照后打开绑定格口' },
          { time: '2026-07-24 14:45:10', action: '设备已充电，用户关闭柜门' },
          { time: '2026-07-24 14:45:22', action: '确认归还，归还完成', doorStatus: 'closed', charging: true, reported: true },
        ],
      },
    },
    {
      id: 'UR-20260609006', tabletId: 'TAB-010', sn: 'SN20260301010', studentId: '2024010444', studentName: '张伟', grade: '四年级3班',
      cabinetBorrow: 'CAB-001', slotBorrow: 4, borrowAt: '2026-07-24 12:00:00',
      returnAt: null, cabinetReturn: 'CAB-001', slotReturn: 4, status: 'borrowed',
      beforeCondition: { aiResult: 'normal', compareLabel: '初始入柜照', compareWith: 'initial' },
      returnScan: { screenQrMatched: true, qrCode: 'QR-TAB-010', scannedAt: '2026-07-24 12:38:30' },
      returnScreenPhoto: { url: '#', label: '归还扫码屏拍照', capturedAt: '2026-07-24 12:38:31' },
      returnInspection: null, overdue: false,
      returnAttempt: { status: 'pending', issue: 'door_open', at: '2026-07-24 12:40:22' },
    },
    {
      id: 'UR-20260607002', tabletId: 'TAB-005', sn: 'SN20260301005', studentId: '2024030123', studentName: '赵强', grade: '五年级1班',
      cabinetBorrow: 'CAB-001', slotBorrow: 5, borrowAt: '2026-07-24 14:20:10',
      returnAt: '2026-07-24 16:38:55', cabinetReturn: 'CAB-001', slotReturn: 5, status: 'returned',
      beforeCondition: { aiResult: 'normal', compareLabel: '初始入柜照', compareWith: 'initial' },
      returnScan: { screenQrMatched: true, qrCode: 'QR-TAB-005', scannedAt: '2026-07-24 16:37:50' },
      returnScreenPhotos: [
        { url: '#', label: '归还扫码屏拍照', capturedAt: '2026-07-24 16:37:52' },
        { url: '#', label: '归还扫码屏拍照', capturedAt: '2026-07-24 16:37:54' },
      ],
      returnInspection: { url: '#', label: '归还外观对比', capturedAt: '2026-07-24 16:40:22', aiResult: 'scratch', compareWith: 'initial', compareLabel: '与初始入柜照对比', detail: '屏幕右下边缘新增擦伤' },
      overdue: false, alertId: 'ALT-001', workorderId: 'WO-001', returnAlertIds: ['ALT-004'],
      placementDetection: {
        result: 'success', doorStatus: 'closed', charging: true, completedAt: '2026-07-24 16:38:55', reportedToBackend: true,
        steps: [
          { time: '2026-07-24 16:37:20', action: '扫码拍照后打开绑定格口', doorStatus: 'open', charging: false, reported: false },
          { time: '2026-07-24 16:38:30', action: '连接充电器后关闭柜门', doorStatus: 'closed', charging: true, reported: false },
          { time: '2026-07-24 16:38:55', action: '确认归还，归还完成', doorStatus: 'closed', charging: true, reported: true },
        ],
      },
    },
    {
      id: 'UR-20260724005', tabletId: 'TAB-019', sn: 'SN20260301019', studentId: '2024020888', studentName: '许诺', grade: '六年级3班',
      cabinetBorrow: 'CAB-003', slotBorrow: 3, borrowAt: '2026-07-24 08:50:00',
      returnAt: '2026-07-24 15:22:10', cabinetReturn: 'CAB-003', slotReturn: 3, status: 'returned',
      beforeCondition: { aiResult: 'normal', compareLabel: '初始入柜照', compareWith: 'initial' },
      returnScan: { screenQrMatched: true, qrCode: 'QR-TAB-019', scannedAt: '2026-07-24 15:20:00' },
      returnScreenPhotos: [
        { url: '#', label: '归还扫码屏拍照', capturedAt: '2026-07-24 15:20:02' },
        { url: '#', label: '归还扫码屏拍照', capturedAt: '2026-07-24 15:20:04' },
      ],
      returnInspection: { url: '#', label: '归还外观对比', capturedAt: '2026-07-24 15:22:10', aiResult: 'crack', compareWith: 'initial', compareLabel: '与初始入柜照对比', detail: '屏幕中部出现划痕/破裂' },
      overdue: false, alertId: 'ALT-011',
      placementDetection: {
        result: 'success', doorStatus: 'closed', charging: true, completedAt: '2026-07-24 15:22:10', reportedToBackend: true,
        steps: [
          { time: '2026-07-24 15:21:00', action: '用户将设备放入格口，插上充电线', doorStatus: 'open', charging: true, alert: null, reported: false },
          { time: '2026-07-24 15:22:10', action: '关闭 + 充电中，归还完成', doorStatus: 'closed', charging: true, alert: null, reported: true },
        ],
      },
    },
    {
      id: 'UR-20260608005', tabletId: 'TAB-003', sn: 'SN20260301003', studentId: '2024010333', studentName: '刘洋', grade: '五年级2班',
      cabinetBorrow: 'CAB-001', slotBorrow: 3, borrowAt: '2026-07-24 07:20:00',
      returnAt: '2026-07-24 13:05:18', cabinetReturn: 'CAB-001', slotReturn: 3, status: 'returned',
      beforeCondition: { aiResult: 'normal', compareLabel: '初始入柜照', compareWith: 'initial' },
      returnScan: { screenQrMatched: true, qrCode: 'QR-TAB-003', scannedAt: '2026-07-24 13:03:30' },
      returnScreenPhotos: [
        { url: '#', label: '归还扫码屏拍照', capturedAt: '2026-07-24 13:03:32' },
        { url: '#', label: '归还扫码屏拍照', capturedAt: '2026-07-24 13:03:34' },
        { url: '#', label: '归还扫码屏拍照', capturedAt: '2026-07-24 13:03:35' },
      ],
      returnInspection: { url: '#', label: '归还外观对比', capturedAt: '2026-07-24 13:06:00', aiResult: 'normal', compareWith: 'initial', compareLabel: '与初始入柜照对比', detail: '外观无新增损伤' },
      overdue: false, returnAlertIds: ['ALT-005'],
      placementDetection: {
        result: 'success', doorStatus: 'closed', charging: true, completedAt: '2026-07-24 13:05:18', reportedToBackend: true,
        steps: [
          { time: '2026-07-24 13:03:40', action: '用户放入设备并插电，但门未关紧', doorStatus: 'open', charging: true, alert: '请关闭柜门', reported: true },
          { time: '2026-07-24 13:05:18', action: '关闭 + 充电中，归还完成并上报', doorStatus: 'closed', charging: true, alert: null, reported: true },
        ],
      },
    },
    {
      id: 'UR-20260607003', tabletId: 'TAB-007', sn: 'SN20260301007', studentId: '2024010555', studentName: '郑浩', grade: '三年级1班',
      cabinetBorrow: 'CAB-001', slotBorrow: 1, borrowAt: '2026-07-24 08:30:00',
      returnAt: '2026-07-24 16:20:10', cabinetReturn: 'CAB-001', slotReturn: 1, status: 'returned',
      beforeCondition: { aiResult: 'normal', compareLabel: '初始入柜照', compareWith: 'initial' },
      returnScan: { screenQrMatched: true, qrCode: 'QR-TAB-007', scannedAt: '2026-07-24 16:18:00' },
      returnScreenPhotos: [
        { url: '#', label: '归还扫码屏拍照', capturedAt: '2026-07-24 16:18:02' },
        { url: '#', label: '归还扫码屏拍照', capturedAt: '2026-07-24 16:18:04' },
        { url: '#', label: '归还扫码屏拍照', capturedAt: '2026-07-24 16:18:05' },
      ],
      returnInspection: { url: '#', label: '归还外观对比', capturedAt: '2026-07-24 16:20:10', aiResult: 'normal', compareWith: 'initial', compareLabel: '与初始入柜照对比', detail: '外观无新增损伤' },
      overdue: false,
      placementDetection: {
        result: 'success', doorStatus: 'closed', charging: true, completedAt: '2026-07-24 16:20:10', reportedToBackend: true,
        steps: [
          { time: '2026-07-24 16:19:20', action: '用户将设备放入格口，插上充电线', doorStatus: 'open', charging: true, alert: null, reported: false },
          { time: '2026-07-24 16:19:50', action: '用户关闭柜门', doorStatus: 'closed', charging: true, alert: null, reported: false },
          { time: '2026-07-24 16:20:10', action: '关闭 + 充电中，归还完成', doorStatus: 'closed', charging: true, alert: null, reported: true },
        ],
      },
    },
    {
      id: 'UR-20260608008', tabletId: 'TAB-014', sn: 'SN20260301014', studentId: '2024020666', studentName: '孙丽', grade: '四年级4班',
      cabinetBorrow: 'CAB-002', slotBorrow: 3, borrowAt: '2026-07-24 07:00:00',
      returnAt: '2026-07-24 09:35:22', cabinetReturn: 'CAB-002', slotReturn: 3, status: 'returned',
      beforeCondition: { aiResult: 'normal', compareLabel: '初始入柜照', compareWith: 'initial' },
      returnScan: { screenQrMatched: true, qrCode: 'QR-TAB-014', scannedAt: '2026-07-24 09:33:10' },
      returnScreenPhoto: { url: '#', label: '归还扫码屏拍照', capturedAt: '2026-07-24 09:33:15' },
      returnInspection: { url: '#', label: '归还外观对比', capturedAt: '2026-07-24 09:35:22', aiResult: 'normal', compareWith: 'initial', compareLabel: '与初始入柜照对比', detail: '外观无新增损伤' },
      overdue: false,
      placementDetection: {
        result: 'success', doorStatus: 'closed', charging: true, completedAt: '2026-07-24 09:35:22', reportedToBackend: true,
        steps: [
          { time: '2026-07-24 09:34:00', action: '用户将设备放入格口，插上充电线', doorStatus: 'open', charging: true, alert: null, reported: false },
          { time: '2026-07-24 09:35:22', action: '关闭 + 充电中，归还完成', doorStatus: 'closed', charging: true, alert: null, reported: true },
        ],
      },
    },
    {
      id: 'UR-20260606001', tabletId: 'TAB-018', sn: 'SN20260301018', studentId: '2024010998', studentName: '钱进', grade: '五年级4班',
      cabinetBorrow: 'CAB-003', slotBorrow: 1, borrowAt: '2026-07-24 14:00:00',
      returnAt: '2026-07-24 17:10:00', cabinetReturn: 'CAB-003', slotReturn: 1, status: 'returned',
      beforeCondition: { aiResult: 'normal', compareLabel: '初始入柜照', compareWith: 'initial' },
      returnScan: { screenQrMatched: true, qrCode: 'QR-TAB-018', scannedAt: '2026-07-24 17:08:00' },
      returnScreenPhoto: { url: '#', label: '归还扫码屏拍照', capturedAt: '2026-07-24 17:08:05' },
      returnInspection: { url: '#', label: '归还外观对比', capturedAt: '2026-07-24 17:10:00', aiResult: 'normal', compareWith: 'initial', compareLabel: '与初始入柜照对比', detail: '外观无新增损伤' },
      overdue: false,
      placementDetection: {
        result: 'success', doorStatus: 'closed', charging: true, completedAt: '2026-07-24 17:10:00', reportedToBackend: true,
        steps: [
          { time: '2026-07-24 17:09:30', action: '关闭 + 充电中，归还完成', doorStatus: 'closed', charging: true, alert: null, reported: true },
        ],
      },
    },
    {
      id: 'UR-20260724006', tabletId: 'TAB-008', sn: 'SN20260301008', studentId: '2024010222', studentName: '高远', grade: '四年级6班',
      cabinetBorrow: 'CAB-001', slotBorrow: 2, borrowAt: '2026-07-24 09:50:00',
      returnAt: '2026-07-24 11:15:00', cabinetReturn: 'CAB-001', slotReturn: 2, status: 'returned',
      beforeCondition: { aiResult: 'normal', compareLabel: '初始入柜照', compareWith: 'initial' },
      returnScan: { screenQrMatched: true, qrCode: 'QR-TAB-008', scannedAt: '2026-07-24 11:13:00' },
      returnScreenPhoto: { url: '#', label: '归还扫码屏拍照', capturedAt: '2026-07-24 11:13:05' },
      returnInspection: { url: '#', label: '归还外观对比', capturedAt: '2026-07-24 11:15:00', aiResult: 'normal', compareWith: 'initial', compareLabel: '与初始入柜照对比', detail: '外观无新增损伤' },
      overdue: false,
      placementDetection: {
        result: 'success', doorStatus: 'closed', charging: true, completedAt: '2026-07-24 11:15:00', reportedToBackend: true,
        steps: [
          { time: '2026-07-24 11:14:20', action: '关闭 + 充电中，归还完成', doorStatus: 'closed', charging: true, alert: null, reported: true },
        ],
      },
    },
    {
      id: 'UR-20260724007', tabletId: 'TAB-015', sn: 'SN20260301015', studentId: '2024020555', studentName: '曹颖', grade: '三年级4班',
      cabinetBorrow: 'CAB-002', slotBorrow: 4, borrowAt: '2026-07-24 10:45:00',
      returnAt: '2026-07-24 12:10:00', cabinetReturn: 'CAB-002', slotReturn: 4, status: 'returned',
      beforeCondition: { aiResult: 'normal', compareLabel: '初始入柜照', compareWith: 'initial' },
      returnScan: { screenQrMatched: true, qrCode: 'QR-TAB-015', scannedAt: '2026-07-24 12:08:00' },
      returnScreenPhotos: [
        { url: '#', label: '归还扫码屏拍照', capturedAt: '2026-07-24 12:08:02' },
        { url: '#', label: '归还扫码屏拍照', capturedAt: '2026-07-24 12:08:03' },
      ],
      returnInspection: { url: '#', label: '归还外观对比', capturedAt: '2026-07-24 12:10:00', aiResult: 'normal', compareWith: 'initial', compareLabel: '与初始入柜照对比', detail: '外观无新增损伤' },
      overdue: false,
      placementDetection: {
        result: 'success', doorStatus: 'closed', charging: true, completedAt: '2026-07-24 12:10:00', reportedToBackend: true,
        steps: [
          { time: '2026-07-24 12:09:00', action: '扫码开门 #4，放入绑定格口并插电关门', doorStatus: 'closed', charging: true, alert: null, reported: true },
        ],
      },
    },
  ],
  inspections: [
    { id: 'INS-000', tabletId: 'TAB-001', sn: 'SN20260301001', type: 'initial', cabinetId: 'CAB-001', slotNo: 3, capturedAt: '2026-03-01 10:00:00', aiResult: 'normal', scratches: 0, cracks: 0, photoLabel: '初始入柜屏幕照', detail: '设备全新入柜时拍摄' },
    { id: 'INS-002', tabletId: 'TAB-005', sn: 'SN20260301005', type: 'return', cabinetId: 'CAB-001', slotNo: 5, capturedAt: '2026-06-07 16:40:22', aiResult: 'scratch', scratches: 2, cracks: 0, photoLabel: '赵强归还外观照', detail: '与初始入柜照对比，屏幕边缘新增擦伤', compareWith: 'initial', usageRecordId: 'UR-20260607002' },
    { id: 'INS-003', tabletId: 'TAB-003', sn: 'SN20260301003', type: 'return', cabinetId: 'CAB-001', slotNo: 8, capturedAt: '2026-06-08 13:06:00', aiResult: 'normal', scratches: 0, cracks: 0, photoLabel: '刘洋归还外观照', detail: '与初始入柜照对比，无新增损伤', compareWith: 'initial', usageRecordId: 'UR-20260608005' },
    { id: 'INS-005', tabletId: 'TAB-007', sn: 'SN20260301007', type: 'initial', cabinetId: 'CAB-001', slotNo: 1, capturedAt: '2026-03-04 09:00:00', aiResult: 'normal', scratches: 0, cracks: 0, photoLabel: '初始入柜屏幕照', detail: '设备全新入柜时拍摄' },
    { id: 'INS-006', tabletId: 'TAB-007', sn: 'SN20260301007', type: 'return', cabinetId: 'CAB-001', slotNo: 1, capturedAt: '2026-06-07 16:20:10', aiResult: 'normal', scratches: 0, cracks: 0, photoLabel: '郑浩归还外观照', detail: '与初始入柜照对比，无新增损伤', compareWith: 'initial', usageRecordId: 'UR-20260607003' },
    { id: 'INS-007', tabletId: 'TAB-014', sn: 'SN20260301014', type: 'return', cabinetId: 'CAB-002', slotNo: 3, capturedAt: '2026-06-08 09:35:22', aiResult: 'normal', scratches: 0, cracks: 0, photoLabel: '孙丽归还外观照', detail: '与初始入柜照对比，无新增损伤', compareWith: 'initial', usageRecordId: 'UR-20260608008' },
    { id: 'INS-008', tabletId: 'TAB-018', sn: 'SN20260301018', type: 'return', cabinetId: 'CAB-003', slotNo: 1, capturedAt: '2026-06-06 17:10:00', aiResult: 'normal', scratches: 0, cracks: 0, photoLabel: '钱进归还外观照', detail: '与初始入柜照对比，无新增损伤', compareWith: 'initial', usageRecordId: 'UR-20260606001' },
  ],
  deviceAlerts: [
    { id: 'ALT-001', tabletId: 'TAB-005', sn: 'SN20260301005', type: 'damage', severity: 'high', title: '外观损坏', message: '外观对比发现损坏', status: 'pending', createdAt: '2026-07-24 16:40:25', inspectionId: 'INS-002', workorderId: 'WO-001' },
    { id: 'ALT-002', tabletId: 'TAB-006', sn: 'SN20260301006', type: 'overdue', severity: 'medium', title: '逾期提醒', message: '借出满24小时未归还', status: 'pending', createdAt: '2026-07-24 10:05:00', workorderId: null },
    { id: 'ALT-006', tabletId: 'TAB-016', sn: 'SN20260301016', type: 'overdue', severity: 'medium', title: '逾期提醒', message: '借出满24小时未归还', status: 'pending', createdAt: '2026-07-24 11:30:00', workorderId: null },
    { id: 'ALT-003', tabletId: '—', sn: '—', cabinetId: 'CAB-003', type: 'cabinet_offline', severity: 'low', title: '柜机离线', message: '柜机心跳超时', status: 'resolved', createdAt: '2026-06-08 09:20:00', workorderId: null },
    { id: 'ALT-004', tabletId: 'TAB-005', sn: 'SN20260301005', type: 'return_door_open', severity: 'medium', title: '归还异常', message: '未关门', status: 'resolved', createdAt: '2026-07-24 16:37:21', usageRecordId: 'UR-20260607002', workorderId: null },
    { id: 'ALT-005', tabletId: 'TAB-003', sn: 'SN20260301003', type: 'return_door_open', severity: 'medium', title: '归还异常', message: '未关门', status: 'resolved', createdAt: '2026-07-24 13:03:41', usageRecordId: 'UR-20260608005', workorderId: null },
    { id: 'ALT-007', tabletId: 'TAB-009', sn: 'SN20260301009', type: 'return_not_charging', severity: 'medium', title: '归还异常', message: '未充电', status: 'pending', createdAt: '2026-07-24 12:12:00', usageRecordId: 'UR-20260608009', workorderId: null },
    { id: 'ALT-008', tabletId: 'TAB-010', sn: 'SN20260301010', type: 'return_door_open', severity: 'medium', title: '归还异常', message: '未关门', status: 'pending', createdAt: '2026-07-24 12:40:22', usageRecordId: 'UR-20260609006', workorderId: null },
    { id: 'ALT-009', tabletId: 'TAB-010', sn: 'SN20260301010', type: 'return_door_open', severity: 'medium', title: '归还异常', message: '未关门', status: 'pending', createdAt: '2026-06-08 12:05:00', workorderId: null },
    { id: 'ALT-010', tabletId: 'TAB-017', sn: 'SN20260301017', type: 'return_door_open', severity: 'medium', title: '归还异常', message: '未关门', status: 'pending', createdAt: '2026-06-08 11:15:00', workorderId: null },
    { id: 'ALT-011', tabletId: 'TAB-019', sn: 'SN20260301019', type: 'damage', severity: 'high', title: '外观损坏', message: '外观对比发现损坏', status: 'pending', createdAt: '2026-07-24 15:22:15', usageRecordId: 'UR-20260724005', workorderId: null },
    { id: 'ALT-012', tabletId: 'TAB-010', sn: 'SN20260301010', slotNo: 4, type: 'manual_feedback', severity: 'medium', title: '人工问题反馈', message: '门关不上', status: 'pending', createdAt: '2026-07-24 13:20:00', workorderId: null },
    { id: 'ALT-013', tabletId: 'TAB-017', sn: 'SN20260301017', slotNo: 7, type: 'manual_feedback', severity: 'medium', title: '人工问题反馈', message: '充电线损坏', status: 'pending', createdAt: '2026-07-24 11:45:00', workorderId: null },
    { id: 'ALT-014', tabletId: 'TAB-005', sn: 'SN20260301005', slotNo: 5, type: 'manual_feedback', severity: 'medium', title: '人工问题反馈', message: '格口内有异物', status: 'resolved', createdAt: '2026-07-24 10:30:00', workorderId: null },
    { id: 'ALT-015', tabletId: 'TAB-019', sn: 'SN20260301019', slotNo: 3, type: 'manual_feedback', severity: 'high', title: '人工问题反馈', message: '设备损坏', status: 'pending', createdAt: '2026-07-24 16:05:00', workorderId: null },
  ],
  workorders: [
    { id: 'WO-001', alertId: 'ALT-001', tabletId: 'TAB-005', sn: 'SN20260301005', type: 'damage_repair', title: '平板外观损坏检修', description: '归还入柜AI检测发现屏幕边缘擦伤，需现场核验并维修', status: 'in_progress', priority: 'high', assignee: '设备运维-刘工', createdAt: '2026-06-07 16:41:00', updatedAt: '2026-06-08 09:00:00' },
  ],

  /* 操作配置 · 时间管控 */
  timeControlClasses: [
    { id: 'CLS-301', name: '三年级(1)班', grade: '三年级', studentCount: 32 },
    { id: 'CLS-302', name: '三年级(2)班', grade: '三年级', studentCount: 30 },
    { id: 'CLS-401', name: '四年级(1)班', grade: '四年级', studentCount: 35 },
    { id: 'CLS-501', name: '五年级(1)班', grade: '五年级', studentCount: 33 },
  ],
  timeControl: {
    defaultRule: {
      enabled: true,
      updatedAt: '2026-06-08 10:00:00',
      updatedBy: '超管',
      continuous: {
        enabled: true,
        thresholdMin: 60,
        restMin: 15,
        warnBeforeMin: 5,
      },
      daily: {
        enabled: true,
        thresholdMin: 180,
        warnBeforeMin: 10,
        bufferExamVideo: true,
      },
      periods: {
        enabled: true,
        slots: [
          { id: 1, weekdays: [1, 2, 3, 4, 5], start: '07:00', end: '22:00' },
          { id: 2, weekdays: [6, 7], start: '08:00', end: '20:00' },
        ],
      },
    },
    overrides: [
      {
        id: 'TC-001',
        scope: 'class',
        targetId: 'CLS-301',
        targetName: '三年级(1)班',
        enabled: true,
        continuous: { enabled: true, thresholdMin: 45, restMin: 15, warnBeforeMin: 5 },
        daily: { enabled: true, thresholdMin: 120, warnBeforeMin: 10, bufferExamVideo: true },
        periods: {
          enabled: true,
          slots: [{ id: 1, weekdays: [1, 2, 3, 4, 5], start: '08:00', end: '21:00' }],
        },
        updatedAt: '2026-06-07 16:30:00',
        syncStatus: 'synced',
        deviceCount: 32,
      },
      {
        id: 'TC-002',
        scope: 'device',
        targetId: 'TAB-002',
        targetName: 'TAB-002 / SN20260301002',
        enabled: true,
        continuous: { enabled: false, thresholdMin: 60, restMin: 15, warnBeforeMin: 5 },
        daily: { enabled: true, thresholdMin: 240, warnBeforeMin: 10, bufferExamVideo: true },
        periods: { enabled: false, slots: [] },
        updatedAt: '2026-06-08 09:15:00',
        syncStatus: 'pending',
        deviceCount: 1,
      },
    ],
  },

  /* 金币运营 · 捐赠与爱心池 */
  lovePoolMatchingRate: 1,
  loveProject: {
    name: '改善乡村学校上课环境 · 江西省上饶市广丰区莲王柏中学·智想10台空调',
    periodStart: '2025-08-27',
    periodEnd: '2025-09-17',
    status: 'preparing',
    raisedCoins: 160,
    targetCoins: 5000000,
    history: [
      {
        id: 'STG-001',
        name: '改善乡村学校上课环境 · 江西省上饶市广丰区湖丰镇中学 · 捐赠20台空调',
        period: '2026年5月-2026年7月',
        periodStart: '2026-05-01',
        periodEnd: '2026-07-31',
        raisedCoins: 150,
        targetCoins: 5000000,
        status: 'closed',
        published: false,
        publishedAt: null,
        closedAt: '2026-08-01 09:00:00',
      },
    ],
  },
  loveProjects: [
    {
      id: 'LPJ-001',
      name: '改善乡村学校上课环境·捐赠20台空调',
      school: '江西省上饶市广丰区湖丰镇中学',
      desc: '为乡村学校教室安装空调，改善夏季上课环境。',
      periodStart: '2023-08-01',
      periodEnd: '2023-10-31',
      status: 'ongoing',
      raisedYuan: 51,
      studentVisible: true,
      outcome: '',
      outcomeMedia: [],
      imageName: 'classroom-ac.jpg',
      imageUrl: mockCoverSvg('教室空调', '#1677ff'),
      updatedAt: '2026-08-18 11:30:00',
    },
    {
      id: 'LPJ-002',
      name: '乡村小学图书角建设',
      school: '云南省昭通市镇雄县坡头小学',
      desc: '捐赠课外读物与书架，建设班级图书角。',
      periodStart: '2026-03-01',
      periodEnd: '2026-06-30',
      status: 'ongoing',
      raisedYuan: 20,
      studentVisible: true,
      outcome: '',
      outcomeMedia: [],
      imageName: 'book-corner.jpg',
      imageUrl: mockCoverSvg('图书角', '#52c41a'),
      updatedAt: '2026-08-18 14:00:00',
    },
    {
      id: 'LPJ-003',
      name: '爱心午餐计划',
      school: '甘肃省临夏州东乡县河滩小学',
      desc: '为寄宿学生提供营养午餐补贴。',
      periodStart: '2025-09-01',
      periodEnd: '2026-01-31',
      status: 'done',
      raisedYuan: 30,
      studentVisible: true,
      outcome: '已为河滩小学寄宿学生发放营养午餐补贴。',
      outcomeMedia: [
        { id: 'om-003-1', type: 'image', name: '午餐发放现场.jpg', url: mockCoverSvg('发放现场', '#fa8c16') },
        { id: 'om-003-2', type: 'video', name: '学生用餐.mp4', url: mockCoverSvg('视频', '#001529') },
      ],
      imageName: 'love-lunch.jpg',
      imageUrl: mockCoverSvg('爱心午餐', '#fa8c16'),
      updatedAt: '2026-08-18 13:00:00',
    },
    {
      id: 'LPJ-004',
      name: '乡村操场修缮计划',
      school: '贵州省毕节市威宁县草海小学',
      desc: '修缮破损操场，铺设塑胶跑道。',
      periodStart: '2025-03-01',
      periodEnd: '2025-08-31',
      status: 'cancelled',
      prevStatus: 'ongoing',
      raisedYuan: 0,
      studentVisible: false,
      outcome: '',
      outcomeMedia: [],
      imageName: 'playground.jpg',
      imageUrl: mockCoverSvg('操场修缮', '#722ed1'),
      updatedAt: '2026-08-10 15:20:00',
      cancelledAt: '2026-08-10 15:20:00',
    },
  ],
  donations: [
    { id: '2097964124342072392', studentId: '1001021', studentName: '李明', school: '实验中学', className: '1班', coins: 50, balanceAfter: 25, fundedProject: '', donatedAt: '2026-09-10 17:42:12' },
    { id: '20979656814243789039', studentId: '1000002', studentName: '张伟', school: '培英小学', className: '1班', coins: 50, balanceAfter: 125, fundedProject: '', donatedAt: '2026-09-09 22:26:40' },
    { id: '2097965602678446447', studentId: '1000003', studentName: '王芳', school: '培英小学', className: '1班', coins: 50, balanceAfter: 185, fundedProject: '', donatedAt: '2026-09-09 23:56:26' },
    { id: '2097964124000000104', studentId: '1001024', studentName: '周杰', school: '实验中学', className: '2班', coins: 50, balanceAfter: 80, fundedProject: '', donatedAt: '2026-09-08 10:12:00' },
    { id: '2097963000000000001', studentId: '1000888', studentName: '林涛', school: '湖丰镇中学', className: '1班', coins: 50, balanceAfter: 220, fundedProject: '改善乡村学校上课环境 · 江西省上饶市广丰区湖丰镇中学 · 捐赠20台空调', fundedStageId: 'STG-001', donatedAt: '2026-07-15 09:47:11' },
    { id: '2097963000000000002', studentId: '1000889', studentName: '冯雪', school: '湖丰镇中学', className: '2班', coins: 100, balanceAfter: 80, fundedProject: '改善乡村学校上课环境 · 江西省上饶市广丰区湖丰镇中学 · 捐赠20台空调', fundedStageId: 'STG-001', donatedAt: '2026-07-20 14:03:27' },
    ...Array.from({ length: 23 }, (_, i) => {
      const names = ['陈晨', '吴敏', '赵磊', '孙悦', '周婷', '马超'];
      const day = String(1 + (i % 28)).padStart(2, '0');
      const hour = String(8 + (i % 10)).padStart(2, '0');
      const min = String((i * 7) % 60).padStart(2, '0');
      return {
        id: `2097963000000000${String(i + 3).padStart(3, '0')}`,
        studentId: `1001${String(30 + i).padStart(3, '0')}`,
        studentName: names[i % names.length],
        school: i % 2 ? '培英小学' : '实验中学',
        className: `${(i % 4) + 1}班`,
        coins: [50, 100, 200][i % 3],
        balanceAfter: 80 + i * 5,
        fundedProject: '改善乡村学校上课环境 · 江西省上饶市广丰区湖丰镇中学 · 捐赠20台空调',
        fundedStageId: 'STG-001',
        donatedAt: `2026-07-${day} ${hour}:${min}:00`,
      };
    }),
  ],
  loveExchanges: [
    { id: 'EX-20260910001', studentId: '1001021', studentName: '李明', school: '实验中学', className: '1班', coins: 100, loveValue: 1, exchangedAt: '2026-09-10 18:02:11' },
    { id: 'EX-20260909002', studentId: '1000002', studentName: '张伟', school: '培英小学', className: '1班', coins: 200, loveValue: 2, exchangedAt: '2026-09-09 21:15:40' },
  ],
  loveLedger: [
    { id: 'LP-20260818003', type: 'donate', summary: '学生捐赠入账 · DN-20260818003', coins: 100, amountYuan: 1, balanceYuan: 102, createdAt: '2026-08-18 11:28:41' },
    { id: 'LP-20260818002', type: 'donate', summary: '学生捐赠入账 · DN-20260818002', coins: 500, amountYuan: 5, balanceYuan: 100, createdAt: '2026-08-18 10:05:18' },
    { id: 'LP-20260818001', type: 'donate', summary: '学生捐赠入账 · DN-20260818001', coins: 200, amountYuan: 2, balanceYuan: 90, createdAt: '2026-08-18 09:12:33' },
    { id: 'LP-20260817012', type: 'donate', summary: '学生捐赠入账 · DN-20260817012', coins: 1000, amountYuan: 10, balanceYuan: 86, createdAt: '2026-08-17 16:40:09' },
    { id: 'LP-20260816008', type: 'donate', summary: '学生捐赠入账 · DN-20260816008', coins: 200, amountYuan: 2, balanceYuan: 66, createdAt: '2026-08-16 08:55:02' },
    { id: 'LP-20260810004', type: 'donate', summary: '学生捐赠入账 · DN-20260810004', coins: 2000, amountYuan: 20, balanceYuan: 62, createdAt: '2026-08-10 19:21:55' },
    { id: 'LP-20260801001', type: 'match', summary: '平台配套资助 · 2026年7月', coins: 0, amountYuan: 11, balanceYuan: 22, createdAt: '2026-08-01 00:05:00' },
    { id: 'LP-20260728006', type: 'donate', summary: '学生捐赠入账 · DN-20260728006', coins: 300, amountYuan: 3, balanceYuan: 11, createdAt: '2026-07-28 14:03:27' },
    { id: 'LP-20260715002', type: 'donate', summary: '学生捐赠入账 · DN-20260715002', coins: 800, amountYuan: 8, balanceYuan: 8, createdAt: '2026-07-15 09:47:11' },
  ],
  loveMonthlyReports: [
    { id: 'MR-202608', month: '2026-08', donateCoins: 4000, participants: 6, poolBalanceYuan: 102, status: 'draft', publishedAt: null },
    { id: 'MR-202607', month: '2026-07', donateCoins: 1100, participants: 2, poolBalanceYuan: 22, status: 'published', publishedAt: '2026-08-01 10:00:00' },
    { id: 'MR-202606', month: '2026-06', donateCoins: 0, participants: 0, poolBalanceYuan: 0, status: 'published', publishedAt: '2026-07-01 10:00:00' },
  ],
};

const STORAGE_KEY = 'ai_study_prototype_v47';

function getDefaultHotRecommend() {
  return JSON.parse(JSON.stringify(DEFAULT_DATA.hotRecommend));
}

function getDefaultCabinetCarousels() {
  return JSON.parse(JSON.stringify(DEFAULT_DATA.cabinetCarousels || {}));
}

function getDefaultLovePoolData() {
  return {
    lovePoolMatchingRate: DEFAULT_DATA.lovePoolMatchingRate ?? 1,
    loveProject: JSON.parse(JSON.stringify(DEFAULT_DATA.loveProject)),
    loveProjects: JSON.parse(JSON.stringify(DEFAULT_DATA.loveProjects)),
    donations: JSON.parse(JSON.stringify(DEFAULT_DATA.donations)),
    loveExchanges: JSON.parse(JSON.stringify(DEFAULT_DATA.loveExchanges || [])),
    loveLedger: JSON.parse(JSON.stringify(DEFAULT_DATA.loveLedger)),
    loveMonthlyReports: JSON.parse(JSON.stringify(DEFAULT_DATA.loveMonthlyReports)),
  };
}

function syncLovePoolData(data) {
  const d = getDefaultLovePoolData();
  if (data.lovePoolMatchingRate == null) data.lovePoolMatchingRate = d.lovePoolMatchingRate;
  if (!data.loveProject || typeof data.loveProject !== 'object') {
    data.loveProject = d.loveProject;
  } else {
    const def = d.loveProject || {};
    if (!data.loveProject.name) data.loveProject.name = def.name;
    if (!data.loveProject.periodStart) data.loveProject.periodStart = def.periodStart;
    if (!data.loveProject.periodEnd) data.loveProject.periodEnd = def.periodEnd;
    if (!data.loveProject.status) data.loveProject.status = def.status || 'preparing';
    if (data.loveProject.targetCoins == null) data.loveProject.targetCoins = def.targetCoins || 5000000;
    if (data.loveProject.raisedCoins == null) data.loveProject.raisedCoins = def.raisedCoins ?? 0;
    if (!Array.isArray(data.loveProject.history)) data.loveProject.history = [];
    (data.loveProject.history || []).forEach(s => {
      if (s.published == null) s.published = false;
    });
  }
  if (!Array.isArray(data.loveProjects)) data.loveProjects = d.loveProjects;
  (data.loveProjects || []).forEach(p => {
    if (p.status === 'executing' || p.status === 'raising') p.status = 'ongoing';
    if (p.prevStatus === 'executing' || p.prevStatus === 'raising') p.prevStatus = 'ongoing';
    if (p.studentVisible == null) p.studentVisible = true;
    if (p.raisedYuan == null) {
      if (p.allocatedYuan != null) p.raisedYuan = Number(p.allocatedYuan) || 0;
      else if (p.raisedCoins) p.raisedYuan = Math.round((Number(p.raisedCoins) || 0) / 100);
      else p.raisedYuan = 0;
    }
    if (!Array.isArray(p.outcomeMedia)) p.outcomeMedia = [];
    if (p.outcome == null) p.outcome = '';
  });
  const defaultProjectsById = Object.fromEntries((d.loveProjects || []).map(p => [p.id, p]));
  (data.loveProjects || []).forEach(p => {
    const def = defaultProjectsById[p.id];
    if (!def) return;
    if (def.imageUrl && !p.imageUrl) {
      p.imageUrl = def.imageUrl;
      p.imageName = def.imageName;
    }
    if (def.outcomeMedia?.length && !p.outcomeMedia.length) p.outcomeMedia = JSON.parse(JSON.stringify(def.outcomeMedia));
  });
  if (Array.isArray(data.loveProjectTrash) && data.loveProjectTrash.length) {
    data.loveProjectTrash.forEach(p => {
      if (data.loveProjects.some(x => x.id === p.id)) return;
      data.loveProjects.push({
        ...p,
        status: 'cancelled',
        prevStatus: p.status === 'done' ? 'done' : 'ongoing',
        cancelledAt: p.deletedAt || p.cancelledAt || now(),
      });
    });
    data.loveProjectTrash = [];
  }
  if (!Array.isArray(data.donations)) data.donations = d.donations;
  if (!Array.isArray(data.loveExchanges)) data.loveExchanges = d.loveExchanges;
  if (!Array.isArray(data.loveLedger)) data.loveLedger = d.loveLedger;
  if (!Array.isArray(data.loveMonthlyReports)) data.loveMonthlyReports = d.loveMonthlyReports;
}

function syncHotRecommend(data) {
  if (!data.hotRecommend) {
    data.hotRecommend = getDefaultHotRecommend();
    return;
  }
  const d = getDefaultHotRecommend();
  const hr = data.hotRecommend;
  Object.keys(d).forEach(k => {
    if (hr[k] === undefined) hr[k] = d[k];
  });
  if (hr.status !== 'enabled') hr.publishedAt = null;
}

function syncCabinetCarousels(data) {
  if (!data.cabinetCarousels || typeof data.cabinetCarousels !== 'object') {
    data.cabinetCarousels = getDefaultCabinetCarousels();
  }
  if (data.cabinetCarouselImageDurationSec == null || Number.isNaN(Number(data.cabinetCarouselImageDurationSec))) {
    data.cabinetCarouselImageDurationSec = DEFAULT_DATA.cabinetCarouselImageDurationSec ?? 5;
  } else {
    data.cabinetCarouselImageDurationSec = Number(data.cabinetCarouselImageDurationSec);
  }
}

function getCabinetCarouselImageDuration() {
  const n = Number(data?.cabinetCarouselImageDurationSec);
  return n > 0 ? n : (DEFAULT_DATA.cabinetCarouselImageDurationSec ?? 5);
}

function syncContentCovers(data) {
  const defaultsById = Object.fromEntries((DEFAULT_DATA.contents || []).map(c => [c.id, c]));
  (data.contents || []).forEach(c => {
    const def = defaultsById[c.id];
    if (!def?.coverUrl || c.coverUrl) return;
    c.hasCover = def.hasCover;
    c.coverUrl = def.coverUrl;
    c.coverName = def.coverName;
  });
}

/** 实际发布时间：仅已启用有值；草稿/已停用强制为 null（板块与频道共用） */
function syncEntityPublishedAt(list, defaultsList) {
  const defaultsById = Object.fromEntries((defaultsList || []).map(s => [s.id, s]));
  (list || []).forEach(s => {
    if (s.status !== 'enabled') {
      s.publishedAt = null;
      return;
    }
    if (s.publishedAt) return;
    const def = defaultsById[s.id];
    s.publishedAt = def?.publishedAt || s.updatedAt || null;
  });
}

function syncSectionPublishedAt(data) {
  syncEntityPublishedAt(data.sections, DEFAULT_DATA.sections);
}

function syncChannelPublishedAt(data) {
  syncEntityPublishedAt(data.channels, DEFAULT_DATA.channels);
}

function loadData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      syncTabletOverdueFlags(data);
      syncContentCovers(data);
      syncSectionPublishedAt(data);
      syncChannelPublishedAt(data);
      syncHotRecommend(data);
      syncCabinetCarousels(data);
      syncLovePoolData(data);
      return data;
    }
  } catch (e) { /* ignore */ }
  return JSON.parse(JSON.stringify(DEFAULT_DATA));
}

function syncTabletOverdueFlags(data) {
  const defaultsById = Object.fromEntries((DEFAULT_DATA.tablets || []).map(t => [t.id, t]));
  (data.tablets || []).forEach(t => {
    const def = defaultsById[t.id];
    if (t.status === 'borrowed' && def?.isOverdue) {
      t.isOverdue = true;
    }
  });
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function now() {
  const d = new Date();
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function getChannelById(channels, id) {
  return channels.find(c => c.id === +id || c.id === id);
}

function esc(str) {
  if (str == null) return '';
  const d = document.createElement('div');
  d.textContent = String(str);
  return d.innerHTML;
}

function renderPagination(current = 3) {
  const pages = [1, 2, 3, 4, 5, 6, 7, '...', 50];
  return `
    <div class="pagination">
      <span class="page-btn disabled">‹</span>
      ${pages.map(p => typeof p === 'number'
        ? `<span class="page-btn ${p === current ? 'active' : ''}">${p}</span>`
        : `<span style="padding:0 4px;color:#999">...</span>`
      ).join('')}
      <span class="page-btn">›</span>
      <span class="page-jump">跳至 <input class="input sm" value="${current}"> 页</span>
    </div>
  `;
}

function statusTag(status) {
  const map = {
    enabled: '<span class="status-enabled">已启用</span>',
    disabled: '<span class="status-disabled">已停用</span>',
    draft: '<span class="status-draft">草稿中</span>',
  };
  return map[status] || esc(status);
}

function sectionStatusTag(status) {
  const map = {
    enabled: '<span class="tag tag-green">已启用</span>',
    disabled: '<span class="tag tag-red">已停用</span>',
    draft: '<span class="tag tag-gray">草稿中</span>',
  };
  return map[status] || esc(status);
}
