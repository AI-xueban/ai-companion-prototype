import { MistakeItem, StudentSummary, ClassSummaryStats, TeacherMessage } from '../../../types';
import { buildTeacherKnowledgeFromStudent } from './knowledgeAdapter';

// 稳定生成 1-10 的 mock 等级
const levelSeed: Record<string, number> = {};
const genLevel = (id: string) => {
  if (levelSeed[id]) return levelSeed[id];
  const codeSum = id.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const level = ((codeSum * 7) % 10) + 1;
  levelSeed[id] = level;
  return level;
};

// 统一消息中心数据 (Updated)
export const messages: TeacherMessage[] = [
  {
    id: 'msg-001',
    type: 'PSYCHOLOGY',
    title: '高危心理预警',
    student: { id: 'stu-003', name: '王强', avatar: '👦' },
    summary: '检测到对话中包含敏感词汇“没意思”、“不想上学”及消极倾向。',
    time: '今天 10:20',
    status: 'open',
    level: 'high',
    psychologyData: {
      keyword: '人生无意义、逃避',
      chatLogs: [
        { role: 'ai', content: '强强，今天看起来心情不太好，愿意跟我聊聊吗？', time: '10:15:02' },
        { role: 'student', content: '我觉得每天读书真的没意思，努力也没结果，感觉人生一眼望到头。', time: '10:15:45' },
        { role: 'ai', content: '听到你这么说我很担心，这种感觉持续很久了吗？', time: '10:16:10' },
        { role: 'student', content: '有一阵子了。有时候真想消失掉。', time: '10:16:35' },
      ],
      diagnosis: '学生表现出明显的习得性无助和轻度抑郁倾向，存在逃避现实的心理动机。',
      suggestions: [
        '建议班主任在 24 小时内进行面对面谈话，侧重倾听而非说教。',
        '观察该生近期社交状态，是否出现孤立现象。',
        '必要时联系家长了解家庭环境是否存在重大变动。'
      ]
    }
  },
  {
    id: 'msg-002',
    type: 'REPORT',
    title: '班级周报已生成',
    summary: '七年级(2)班上周学习效能分析报告已完成。',
    time: '今天 08:00',
    status: 'open',
    level: 'medium',
    reportData: { reportId: 'rep-2026-w4', period: '2026 第 4 周' }
  },
  {
    id: 'msg-003',
    type: 'REDEEM',
    title: '实物奖励申请',
    student: { id: 'stu-001', name: '李明', avatar: '👦' },
    summary: '申请兑换“定制笔记本”一份。',
    time: '昨天 17:10',
    status: 'open',
    level: 'low',
    redeemData: { item: '定制笔记本', points: 500, recordId: 'rec-998' }
  },
  {
    id: 'msg-004',
    type: 'PSYCHOLOGY',
    title: '心理敏感词提醒',
    student: { id: 'stu-005', name: '孙尚香', avatar: '👧' },
    summary: '对话提及“压力大”、“睡不着”，可能存在阶段性焦虑。',
    time: '昨天 15:40',
    status: 'handled',
    level: 'medium',
    psychologyData: {
      keyword: '压力、失眠',
      chatLogs: [
        { role: 'ai', content: '最近学习压力大吗？', time: '15:30:00' },
        { role: 'student', content: '特别大，晚上老是睡不着，总在想那道数学题。', time: '15:30:45' },
      ],
      diagnosis: '阶段性学业压力导致的轻度焦虑，睡眠质量受损。',
      suggestions: [
        '指导学生进行简单的放松训练（如深呼吸）。',
        '建议适当降低近期练习难度，帮助其找回自信。'
      ]
    }
  }
];

// 为了保持向下兼容，暂时保留 alerts 和 alertTodos 的引用，但映射到新的 messages
export const alerts = messages.filter(m => m.type === 'PSYCHOLOGY' || m.type === 'REPORT');
export const alertTodos = messages.filter(m => m.type === 'REDEEM');

// 班级总览指标
export const classOverview = {
  activeRate: 0.82, // 今日活跃率
  taskCompletionRate: 0.74, // 今日任务达标率
  alertCount: messages.filter((m) => m.status !== 'handled' && m.level === 'high').length, // 未处理高危预警数
  avgPoints: 1280, // 班级平均积分
  periodLabel: '今日',
  updateTime: '10:00',
};

// 班级能力雷达（班级均值 + 上月对照）
export const classRadar = [
  { subject: '逻辑', score: 86, prevScore: 81, fullMark: 100 },
  { subject: '言语', score: 78, prevScore: 75, fullMark: 100 },
  { subject: '空间', score: 83, prevScore: 79, fullMark: 100 },
  { subject: '动觉', score: 69, prevScore: 68, fullMark: 100 },
  { subject: '音乐', score: 64, prevScore: 63, fullMark: 100 },
  { subject: '人际', score: 80, prevScore: 78, fullMark: 100 },
  { subject: '内省', score: 76, prevScore: 74, fullMark: 100 },
  { subject: '自然', score: 58, prevScore: 57, fullMark: 100 },
];

// 知识图谱（按科目分组，带状态列）- 由学生端知识数据生成
export const knowledgeGraphBySubject = buildTeacherKnowledgeFromStudent();

// 核心风险预警（可选按学科，默认全量取 Top N）
export const getTopRiskNodes = (subject?: string, limit = 3, includeGreen = false) => {
  const groups = subject
    ? knowledgeGraphBySubject.filter((g) => g.subject === subject)
    : knowledgeGraphBySubject;
  const allNodes = groups.flatMap((g: any) => g.allNodes ?? g.nodes ?? []);
  const filtered = includeGreen ? allNodes : allNodes.filter((n: any) => n.status !== 'green');
  return [...filtered]
    .sort((a: any, b: any) => (b.riskScore ?? 0) - (a.riskScore ?? 0))
    .slice(0, limit);
};

export const topRiskNodes = getTopRiskNodes();

// Top 5 聚合视图（兼容旧用法）
export const weakPoints = knowledgeGraphBySubject.flatMap((g) =>
  g.nodes
    .filter((n) => n.status !== 'green')
    .sort((a, b) => b.riskScore - a.riskScore || b.unmasteredCount - a.unmasteredCount)
    .slice(0, 2)
    .map((n) => ({ knowledgePoint: n.knowledgePoint, subject: g.subject, unmasteredCount: n.unmasteredCount })),
);

// 高频错题榜（Top 5）
export const highFreqMistakes: MistakeItem[] = [
  {
    id: 'q-math-001',
    questionSnippet: '一次函数斜率与截距判断',
    fullQuestion: '已知一次函数 y = kx + b 经过点 A(2,3)、B(4,7)，求 k、b 并判断函数图像与 y 轴正方向的夹角是否大于 60°。',
    subject: '数学',
    topic: '一次函数',
    errorType: '计算+概念混淆',
    status: 'new',
    lastReview: '今天',
    tags: ['函数', '斜率', '几何意义'],
    knowledgePoints: ['一次函数与斜率'],
    questionType: '解答',
    difficulty: 3,
    category: '典型题',
    correctAttempts: 5,
    wrongAttempts: 16,
    totalAttempts: 21,
    lastAttemptAt: '今天',
    deadlineLabel: '今日 23:59',
    dueInDays: 0,
    stats: { errorCount: 16, reviewCount: 0, correctCount: 5, mastered: false, isStarred: false, lastWrongDate: '今天' },
    correctAnswer: 'k=2, b=-1；斜率 tanθ=2，与 y 轴夹角约 63.4°，大于 60°。',
    userWrongAnswer: 'k=1, b=1',
    analysis: '常见错误：代入点算斜率时遗漏差分；忽略斜率与夹角关系 tanθ=k。',
  },
  {
    id: 'q-cn-001',
    questionSnippet: '文言文虚词“而”用法判别',
    fullQuestion: '阅读选段，判断“而”在句子“学而时习之，不亦说乎”中的用法，并翻译全句。',
    subject: '语文',
    topic: '文言文虚词',
    errorType: '语法理解',
    status: 'reviewing',
    lastReview: '1天前',
    tags: ['文言文', '虚词', '翻译'],
    knowledgePoints: ['文言文虚词与句式'],
    questionType: '翻译',
    difficulty: 2,
    category: '同步题',
    correctAttempts: 9,
    wrongAttempts: 14,
    totalAttempts: 23,
    lastAttemptAt: '昨天',
    deadlineLabel: '本周内',
    dueInDays: 5,
    stats: { errorCount: 14, reviewCount: 1, correctCount: 9, mastered: false, isStarred: false, lastWrongDate: '昨天' },
    correctAnswer: '“而”表承接；译：学习并且按时温习，不也很快乐吗？',
    userWrongAnswer: '转折用法',
    analysis: '易把承接误判成转折；提醒结合上下文语气判断。',
  },
  {
    id: 'q-en-001',
    questionSnippet: '定语从句关系词选择',
    fullQuestion: '选用正确关系词完成句子：The girl ___ won the first prize is my cousin. 说明原因。',
    subject: '英语',
    topic: '定语从句',
    errorType: '语法选择',
    status: 'new',
    lastReview: '今天',
    tags: ['从句', '关系代词'],
    knowledgePoints: ['定语从句引导词'],
    questionType: '单选',
    difficulty: 2,
    category: '同步题',
    correctAttempts: 12,
    wrongAttempts: 10,
    totalAttempts: 22,
    lastAttemptAt: '今天',
    deadlineLabel: '本周内',
    dueInDays: 5,
    stats: { errorCount: 10, reviewCount: 0, correctCount: 12, mastered: false, isStarred: true, lastWrongDate: '今天' },
    correctAnswer: 'who；先行词为人且作主语，用 who。',
    userWrongAnswer: 'which',
    analysis: '强化先行词类型与句子成分判断；对比 who/whom/which/that 用法。',
  },
  {
    id: 'q-en-002',
    questionSnippet: '完形填空语篇一致性',
    fullQuestion: '完形填空：围绕“团队合作”主题，选择最合理的连词/代词，保证语篇逻辑连贯（段落给出 10 空）。',
    subject: '英语',
    topic: '语篇理解',
    errorType: '语篇逻辑',
    status: 'reviewing',
    lastReview: '2天前',
    tags: ['完形填空', '衔接', '逻辑'],
    knowledgePoints: ['完形填空语篇理解'],
    questionType: '完形',
    difficulty: 3,
    category: '模拟题',
    correctAttempts: 6,
    wrongAttempts: 15,
    totalAttempts: 21,
    lastAttemptAt: '2天前',
    deadlineLabel: 'D3 内完成',
    dueInDays: 3,
    stats: { errorCount: 15, reviewCount: 1, correctCount: 6, mastered: false, isStarred: false, lastWrongDate: '2天前' },
    correctAnswer: '需结合上下文选择衔接词（however/therefore/so 等），代词指代一致；答案详见讲评稿。',
    userWrongAnswer: '多处指代混乱',
    analysis: '强调先通读全文，找语篇主线与指代对象，再回填空。',
  },
];

// 学生列表（复用现有 StudentSummary 类型）
export const classStats: ClassSummaryStats = {
  totalStudents: 32,
  onlineCount: 28,
  attentionNeeded: 5,
  excellentPerformance: 12,
};

export const students: StudentSummary[] = [
  {
    id: 'stu-001',
    name: '李明',
    avatar: '👦',
    grade: '七年级',
    classNumber: '2班',
    level: genLevel('stu-001'),
    status: 'online',
    alertLevel: 'medium',
    abilitySnapshot: { logic: 85, calculation: 60, spatial: 90, application: 75, concept: 80 },
    recentTrend: 'up',
    lastActive: '10分钟前',
    aiInsight: '空间几何突出，代数需巩固',
  },
  {
    id: 'stu-002',
    name: '张小花',
    avatar: '👧',
    grade: '七年级',
    classNumber: '2班',
    level: genLevel('stu-002'),
    status: 'online',
    alertLevel: 'none',
    abilitySnapshot: { logic: 95, calculation: 92, spatial: 88, application: 90, concept: 98 },
    recentTrend: 'up',
    lastActive: '5分钟前',
    aiInsight: '全面发展，可带组内答疑',
  },
  {
    id: 'stu-003',
    name: '王强',
    avatar: '👦',
    grade: '七年级',
    classNumber: '2班',
    level: genLevel('stu-003'),
    status: 'away',
    alertLevel: 'high',
    abilitySnapshot: { logic: 60, calculation: 65, spatial: 50, application: 55, concept: 70 },
    recentTrend: 'down',
    lastActive: '2小时前',
    aiInsight: '基础薄弱，需要个别辅导',
  },
  {
    id: 'stu-004',
    name: '赵云',
    avatar: '👦',
    grade: '七年级',
    classNumber: '2班',
    level: genLevel('stu-004'),
    status: 'online',
    alertLevel: 'none',
    abilitySnapshot: { logic: 90, calculation: 88, spatial: 95, application: 92, concept: 90 },
    recentTrend: 'stable',
    lastActive: '刚刚',
    aiInsight: '表现稳定，可挑战拔高题',
  },
  {
    id: 'stu-005',
    name: '孙尚香',
    avatar: '👧',
    grade: '七年级',
    classNumber: '2班',
    level: genLevel('stu-005'),
    status: 'online',
    alertLevel: 'low',
    abilitySnapshot: { logic: 75, calculation: 80, spatial: 70, application: 85, concept: 80 },
    recentTrend: 'up',
    lastActive: '15分钟前',
    aiInsight: '应用能力强，逻辑需提升',
  },
];

// 学生详情（雷达、记录、错题/知识/时间线）
export const studentDetailMap = {
  'stu-001': {
    radar: [
      { subject: '逻辑', score: 85, prevScore: 80, fullMark: 100, analysis: '推理流畅，代数细节需练习' },
      { subject: '言语', score: 72, prevScore: 70, fullMark: 100, analysis: '描述简练，可增加论证' },
      { subject: '空间', score: 90, prevScore: 86, fullMark: 100, analysis: '空间想象突出，可多做立体几何' },
      { subject: '动觉', score: 65, prevScore: 64, fullMark: 100, analysis: '动手实验兴趣一般' },
      { subject: '音乐', score: 60, prevScore: 60, fullMark: 100, analysis: '节奏感一般' },
      { subject: '人际', score: 78, prevScore: 76, fullMark: 100, analysis: '小组协作良好' },
      { subject: '内省', score: 74, prevScore: 72, fullMark: 100, analysis: '复盘习惯已建立' },
      { subject: '自然', score: 55, prevScore: 55, fullMark: 100, analysis: '需更多实验观察' },
    ],
    timeline: [
      { time: '10-24 16:30', type: '每日任务', subject: '数学', summary: '正确率 82%，+50 积分，用时 18min' },
      { time: '10-24 15:10', type: '专项练习', subject: '数学', summary: '几何专项，正确率 76%' },
      { time: '10-23 20:05', type: '错题攻克', subject: '物理', summary: '复盘 3 道错题，新增 1 道 mastered' },
    ],
    mistakes: highFreqMistakes.slice(0, 2),
    knowledge: knowledgeGraphBySubject.find((g) => g.subject === '数学')?.allNodes ?? [],
  },
};

// 激励 - 商品配置
export const incentiveGoods = [
  { id: 'g-001', name: '免做卡', cost: 150, stock: 12, status: 'on', limitPerUser: 1 },
  { id: 'g-002', name: '早退 10 分钟', cost: 200, stock: 8, status: 'off', limitPerUser: 1 },
  { id: 'g-003', name: '课堂加分 +5', cost: 80, stock: 30, status: 'on', limitPerUser: 2 },
];

// 激励 - 兑换记录
export const redemptionRecords = [
  { id: 'r-001', student: '李明', item: '免做卡', points: 150, time: '10-24 10:20', status: 'pending', handler: '', handledAt: '', reason: '' },
  { id: 'r-002', student: '王强', item: '课堂加分 +5', points: 80, time: '10-24 09:50', status: 'done', handler: '赵老师', handledAt: '10-24 10:00', reason: '' },
  { id: 'r-003', student: '张小花', item: '早退 10 分钟', points: 200, time: '10-23 17:10', status: 'rejected', handler: '赵老师', handledAt: '10-23 18:00', reason: '未满足积分规则' },
];
