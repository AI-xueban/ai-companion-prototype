import { SubjectType } from '../types';

export const DEFAULT_SUBJECT_TEXTBOOK: Record<SubjectType, string> = {
  数学: '北师大版',
  语文: '人教版',
  英语: '沪教版',
  道德与法治: '人教版',
  历史: '人教版',
  科学: '浙教版',
  地理: '人教版',
  生物: '人教版',
  物理: '人教版',
  化学: '人教版',
};

export const SUBJECT_TEXTBOOKS: Record<SubjectType, string> = { ...DEFAULT_SUBJECT_TEXTBOOK };

export function applySubjectTextbook(subject: SubjectType, textbook: string) {
  SUBJECT_TEXTBOOKS[subject] = textbook;
}

export function isEnglishHujiaoTextbook(subject: SubjectType | string, textbook?: string) {
  return subject === '英语' && (textbook || '').includes('沪教');
}

/** 没有二级课时：一级目录下直接是视频。上线后按目录数据判断；原型用英语沪教版举例。 */
export function isChapterOnlyTextbook(subject: SubjectType | string, textbook?: string) {
  return isEnglishHujiaoTextbook(subject, textbook);
}

export const CORE_SYNC_SUBJECTS: SubjectType[] = ['数学', '语文', '英语', '科学'];
export const WU_SI_ONLY_SUBJECTS: SubjectType[] = ['地理', '生物'];

export function isWuSiOnlySubject(subject: SubjectType | string) {
  return subject === '地理' || subject === '生物';
}

export function getSubjectsForSchoolSystem(schoolSystem?: string): SubjectType[] {
  if ((schoolSystem || '').includes('五四')) {
    return [...CORE_SYNC_SUBJECTS, ...WU_SI_ONLY_SUBJECTS];
  }
  return [...CORE_SYNC_SUBJECTS];
}

export interface CatalogNode {
  id: string;
  label: string;
  children: CatalogNode[];
  knowledgePoints?: string[];
}

export interface StudentStudyContext {
  stage: string;
  grade: string;
  schoolSystem: string;
  term: string;
}

export interface LastStudyRecord {
  subject: SubjectType;
  textbook: string;
  chapterId: string;
  sectionId: string;
}

export const STUDENT_STUDY_CONTEXT: StudentStudyContext = {
  stage: '小学',
  grade: '六年级',
  schoolSystem: '六三制',
  term: '上学期',
};

export function applyStudyContext(next: Partial<StudentStudyContext>) {
  Object.assign(STUDENT_STUDY_CONTEXT, next);
}

export const STUDY_TEXTBOOK_OPTIONS = ['人教版', '北师大版', '沪教版', '部编版', '浙教版'];

const LAST_STUDY_KEY = 'dashboard:last-study:v1';

const n = (id: string, label: string, children: CatalogNode[] = [], knowledgePoints: string[] = []): CatalogNode => ({
  id,
  label,
  children,
  knowledgePoints,
});

export const TEXTBOOK_CATALOGS: Record<SubjectType, CatalogNode[]> = {
  数学: [
    n('math-unit-1', '第一单元 负数', [
      n('math-unit-1-section-1', '负数（一）', [], ['负数的意义', '正数和负数', '相反意义的量']),
      n('math-unit-1-section-2', '负数（二）', [], ['负数的比较', '数轴上的负数', '负数的实际应用']),
    ]),
    n('math-unit-2', '第二单元 百分数（二）', [
      n('math-unit-2-section-1', '折扣', [], ['折扣的意义', '折扣问题', '折扣的综合应用']),
      n('math-unit-2-section-2', '成数', [], ['成数的意义', '成数问题', '成数与百分数']),
      n('math-unit-2-section-3', '税率', [], ['税率的意义', '应纳税额', '税率应用']),
      n('math-unit-2-section-4', '利率', [], ['利率的意义', '利息计算', '本金与利息']),
      n('math-unit-2-section-5', '解决实际问题', [], ['百分数实际问题', '数量关系', '综合应用']),
      n('math-unit-2-section-6', '整理与复习', [], ['单元知识梳理', '易错题复习', '综合训练']),
    ]),
    n('math-unit-3', '第三单元 圆柱与圆锥', [
      n('math-unit-3-section-1', '圆柱', [], ['圆柱的认识', '圆柱的表面积', '圆柱的体积']),
      n('math-unit-3-section-2', '圆锥', [], ['圆锥的认识', '圆锥的体积', '圆柱与圆锥']),
      n('math-unit-3-section-3', '整理与复习', [], ['单元知识梳理', '图形体积比较', '综合应用']),
    ]),
  ],
  语文: [
    n('unit-1', '第一单元', [
      n('unit-1-l1', '1 草原', [], ['草原风光描写', '民族团结', '比喻与排比']),
      n('unit-1-l2', '2 丁香结', [], ['丁香意象', '借景抒情', '人生况味']),
      n('unit-1-l3', '3 古诗词三首_宿建德江', [], ['羁旅愁思', '以景结情', '五言绝句']),
      n('unit-1-l4', '3 古诗词三首_六月二十七日望湖楼醉书', [], ['夏日骤雨', '动态描写', '七言绝句']),
      n('unit-1-l5', '3 古诗词三首_西江月·夜行黄沙道中', [], ['乡村夜景', '词牌常识', '丰收喜悦']),
      n('unit-1-l6', '习作：变形记', [], ['想象作文', '情节安排', '细节描写']),
      n('unit-1-l7', '语文园地一', [], ['日积月累', '交流平台', '词句段运用']),
      n('unit-1-l8', '单元总结一', [], ['单元主题回顾', '写法梳理', '综合运用']),
    ]),
    n('unit-2', '第二单元', [
      n('unit-2-l1', '4 七律·长征', [], ['长征精神', '七律对仗', '夸张与比喻']),
      n('unit-2-l2', '5 狼牙山五壮士', [], ['英雄事迹', '场面描写', '详略安排']),
      n('unit-2-l3', '6 开国大典', [], ['记叙顺序', '场面描写', '家国情怀']),
      n('unit-2-l4', '7 我的战友邱少云', [], ['严守纪律', '人物品质', '环境烘托']),
      n('unit-2-l5', '口语交际：演讲', [], ['演讲结构', '口语表达', '仪态与语气']),
      n('unit-2-l6', '习作：多彩的活动', [], ['活动记叙', '重点突出', '感受表达']),
      n('unit-2-l7', '语文园地二', [], ['日积月累', '交流平台', '词句段运用']),
      n('unit-2-l8', '单元总结二', [], ['革命传统主题', '写法梳理', '综合运用']),
    ]),
  ],
  英语: [
    n('english-unit-1', 'Unit 1  Amazing places', [
      n('english-unit-1-intro', '走进单元', [], ['单元目标', '核心词汇预览', '话题导入']),
      n('english-unit-1-part-a', 'Part A  What famous places do you know?', [], ['著名景点词汇', '问路与介绍', '特殊疑问句']),
      n('english-unit-1-part-b', 'Part B  What makes a trip special?', [], ['旅行经历', '形容词比较', '故事复述']),
      n('english-unit-1-part-c', 'Part C  Project: Make a holiday scrapbook', [], ['项目策划', '图文表达', '展示交流']),
      n('english-unit-1-review', '单元复习', [], ['词汇复习', '句型巩固', '综合运用']),
    ]),
    n('english-unit-2', 'Unit 2  Getting together', [
      n('english-unit-2-intro', '走进单元', [], ['单元目标', '节日话题', '核心句型预览']),
      n('english-unit-2-part-a', 'Part A  How can festivals bring us together?', [], ['节日词汇', '庆祝活动', '一般现在时']),
      n('english-unit-2-part-b', 'Part B  How can big events bring us together?', [], ['大型活动', '过去时叙述', '感受表达']),
      n('english-unit-2-part-c', 'Part C  Project: Present photos from school events', [], ['照片说明', '口头展示', '合作表达']),
    ]),
  ],
  科学: [
    n('science-unit-1', '第1单元 小小工程师', [
      n('science-unit-1-section-1', '1.1 了解我们的住房', [], ['住房的基本功能', '住房结构', '工程与生活']),
      n('science-unit-1-section-2', '1.2 认识工程', [], ['工程的含义', '工程的要素', '工程师的工作']),
      n('science-unit-1-section-3', '1.3 建造塔台', [], ['塔台设计', '结构稳定性', '材料选择']),
      n('science-unit-1-section-4', '1.4 设计塔台模型', [], ['方案设计', '模型制作', '设计改进']),
      n('science-unit-1-section-5', '1.5 制作塔台模型', [], ['模型搭建', '分工合作', '制作规范']),
      n('science-unit-1-section-6', '1.6 测试塔台模型', [], ['模型测试', '承重测试', '稳定性测试']),
      n('science-unit-1-section-7', '1.7 评估改进塔台模型', [], ['项目评估', '问题分析', '迭代改进']),
    ]),
    n('science-unit-2', '第2单元 生物的多样性', [
      n('science-unit-2-section-1', '2.1 校园生物大搜索', [], ['校园生物观察', '生物分类', '调查记录']),
      n('science-unit-2-section-2', '2.2 制作校园生物分布图', [], ['分布图制作', '信息整理', '生物多样性']),
    ]),
  ],
  地理: [
    n('geography-chapter-7', '第七章 我们生活的大洲——亚洲', [
      n('geography-chapter-7-section-1', '第一节 自然环境_第1课时 世界第一大洲 地势起伏大，长河众多', [], ['亚洲位置范围', '地形地势', '长河分布']),
      n('geography-chapter-7-section-2', '第一节 自然环境_第2课时 多样的气候', [], ['气候类型', '季风气候', '气候差异']),
      n('geography-chapter-7-section-3', '第二节 人文环境', [], ['人口与城市', '文化多样性', '经济发展']),
    ]),
    n('geography-chapter-8', '第八章 我们邻近的地区和国家', [
      n('geography-chapter-8-section-1', '第一节 日本_第1课时 多火山、地震的岛国', [], ['岛国位置', '火山地震', '地形特征']),
      n('geography-chapter-8-section-2', '第一节 日本_第2课时 人口老龄化社会 对外依赖强的经济', [], ['人口老龄化', '资源短缺', '外向型经济']),
      n('geography-chapter-8-section-3', '第二节 东南亚_第1课时 “十字路口”的位置 热带气候与农业生产', [], ['交通位置', '热带气候', '农业生产']),
      n('geography-chapter-8-section-4', '第二节 东南亚_第2课时 山河相间与城市分布', [], ['山河相间', '城市分布', '交通与城市']),
      n('geography-chapter-8-section-5', '第三节 印度_第1课时 世界人口大国', [], ['人口大国', '人口分布', '人口增长']),
      n('geography-chapter-8-section-6', '第三节 印度_第2课时 热带季风气候与粮食生产 发展迅速的服务外包产业', [], ['热带季风', '粮食生产', '服务外包']),
    ]),
  ],
  生物: [
    n('biology-chapter-1', '第三单元 生物圈中的绿色植物_第一章 生物圈中有哪些绿色植物', [
      n('biology-chapter-1-section-1', '第一节 藻类植物', [], ['藻类特征', '生活环境', '与人类关系']),
      n('biology-chapter-1-section-2', '第二节 苔藓和蕨类植物', [], ['苔藓特征', '蕨类特征', '生活环境比较']),
      n('biology-chapter-1-section-3', '第三节 种子植物', [], ['种子植物特征', '裸子植物', '被子植物']),
    ]),
    n('biology-chapter-2', '第三单元 生物圈中的绿色植物_第二章 被子植物的一生', [
      n('biology-chapter-2-section-1', '第一节 种子的萌发', [], ['萌发条件', '萌发过程', '种子结构']),
      n('biology-chapter-2-section-2', '第二节 植株的生长', [], ['根的生长', '芽的发育', '植株生长需要']),
      n('biology-chapter-2-section-3', '第三节 开花和结果', [], ['花的结构', '传粉与受精', '果实和种子']),
    ]),
    n('biology-chapter-3', '第三单元 生物圈中的绿色植物_第三章 绿色植物与生物圈的水循环', [
      n('biology-chapter-3-section-1', '第一节 水分进入植物体内的途径', [], ['根吸水', '导管运输', '蒸腾作用']),
      n('biology-chapter-3-section-2', '第二节 绿色植物参与生物圈的水循环', [], ['蒸腾与降水', '水循环过程', '植物的作用']),
    ]),
  ],
  道德与法治: [],
  历史: [],
  物理: [],
  化学: [],
};

export const SUBJECT_VIDEO_TEMPLATES: Record<SubjectType, { id: string; title: string }[]> = {
  数学: [
    { id: 'textbook-knowledge', title: '教材知识精讲' },
    { id: 'textbook-exercises', title: '教材习题精讲' },
    { id: '53-lectures', title: '5·3精讲' },
  ],
  语文: [
    { id: 'cn-preview', title: '课前预习' },
    { id: 'cn-classroom', title: '课堂学习' },
    { id: 'cn-review', title: '课后复习' },
    { id: 'cn-extend', title: '课外拓展' },
    { id: 'cn-new-standard', title: '新课标新考法' },
  ],
  英语: [
    { id: 'unit-goal-guide', title: '单元目标导学' },
    { id: 'happy-vocabulary', title: '单词快乐学' },
    { id: 'easy-textbook', title: '课文轻松学' },
    { id: 'reading-writing', title: '阅读与写作' },
    { id: 'sync-foundation-practice', title: '同步基础练' },
    { id: 'phonetics-lab', title: '语音实验室' },
  ],
  科学: [
    { id: 'science-lecture-1', title: '知识精讲第1讲' },
    { id: 'science-lecture-2', title: '知识精讲第2讲' },
    { id: 'science-key-practice', title: '重难点练习' },
  ],
  地理: [
    { id: 'textbook-knowledge', title: '第一课' },
    { id: 'textbook-exercises', title: '第二课' },
    { id: '53-lectures', title: '第三课' },
  ],
  生物: [
    { id: 'bio-video-1', title: '绿色植物的类群_知识精讲' },
    { id: 'bio-video-2', title: '藻类、苔藓和蕨类植物_重难点练习' },
    { id: 'bio-video-3', title: '藻类、苔藓和蕨类植物_易错误区辨析' },
    { id: 'bio-video-4', title: '藻类、苔藓和蕨类植物_综合提升' },
    { id: 'bio-video-5', title: '苔藓植物_知识精讲' },
    { id: 'bio-video-6', title: '蕨类植物_知识精讲' },
  ],
  道德与法治: [],
  历史: [],
  物理: [],
  化学: [],
};

export function englishHujiaoVideoName(_unitLabel: string, videoTitle: string) {
  return videoTitle;
}

export function englishHujiaoSectionId(chapterId: string, videoId: string) {
  return `${chapterId}-${videoId}`;
}

export function getEnglishHujiaoVideoModuleId(sectionId: string) {
  const hit = SUBJECT_VIDEO_TEMPLATES.英语.find(
    (item) => sectionId === item.id || sectionId.endsWith(`-${item.id}`)
  );
  return hit?.id || sectionId;
}

export function buildEnglishHujiaoCatalog(units: CatalogNode[] = TEXTBOOK_CATALOGS.英语): CatalogNode[] {
  return units.map((unit) => ({
    ...unit,
    children: SUBJECT_VIDEO_TEMPLATES.英语.map((video) =>
      n(
        englishHujiaoSectionId(unit.id, video.id),
        englishHujiaoVideoName(unit.label, video.title),
        [],
        [video.title]
      )
    ),
  }));
}

export function getTextbookCatalog(subject: SubjectType, textbook?: string): CatalogNode[] {
  // 原型：英语沪教版作为「只有一级目录」的示例数据。上线后按各版本目录校验。
  if (isEnglishHujiaoTextbook(subject, textbook)) {
    return buildEnglishHujiaoCatalog();
  }
  return TEXTBOOK_CATALOGS[subject] || [];
}

export function findCatalogNode(nodes: CatalogNode[], id: string): CatalogNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const hit = findCatalogNode(node.children, id);
    if (hit) return hit;
  }
  return null;
}

export function getFirstSection(nodes: CatalogNode[]): { chapter: CatalogNode; section: CatalogNode } | null {
  const chapter = nodes[0];
  if (!chapter) return null;
  const section = chapter.children[0] || chapter;
  return { chapter, section };
}

export function getLastStudyRecord(): LastStudyRecord | null {
  try {
    const raw = localStorage.getItem(LAST_STUDY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LastStudyRecord;
    if (!parsed?.subject || !parsed.chapterId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveLastStudyRecord(record: LastStudyRecord) {
  localStorage.setItem(LAST_STUDY_KEY, JSON.stringify(record));
}

export function getDefaultStudySelection(): LastStudyRecord {
  const saved = getLastStudyRecord();
  const allowed = getSubjectsForSchoolSystem(STUDENT_STUDY_CONTEXT.schoolSystem);
  if (saved && allowed.includes(saved.subject)) {
    const textbook = saved.textbook || DEFAULT_SUBJECT_TEXTBOOK[saved.subject];
    const catalog = getTextbookCatalog(saved.subject, textbook);
    const chapter = findCatalogNode(catalog, saved.chapterId);
    const section = saved.sectionId ? findCatalogNode(catalog, saved.sectionId) : null;
    if (chapter) {
      return {
        ...saved,
        textbook,
        sectionId: section?.id || chapter.children[0]?.id || chapter.id,
      };
    }
  }

  const fallback = getFirstSection(TEXTBOOK_CATALOGS['数学']);
  return {
    subject: '数学',
    textbook: DEFAULT_SUBJECT_TEXTBOOK['数学'],
    chapterId: fallback?.chapter.id || 'math-unit-1',
    sectionId: fallback?.section.id || 'math-unit-1-section-1',
  };
}

export const PRACTICE_VIDEO_MODULE_IDS = new Set([
  'cn-new-standard',
  '53-lectures',
  'sync-foundation-practice',
  'science-key-practice',
  'bio-video-2',
  'bio-video-4',
]);

export function isPracticeVideoModule(id: string) {
  return PRACTICE_VIDEO_MODULE_IDS.has(id);
}

export function buildSectionPlaylist(subject: SubjectType) {
  return (SUBJECT_VIDEO_TEMPLATES[subject] || SUBJECT_VIDEO_TEMPLATES['数学']).map((item) => ({
    ...item,
    group: isPracticeVideoModule(item.id) ? ('practice' as const) : ('learn' as const),
  }));
}

export function buildEnglishHujiaoPlaylist(chapterLabel: string, chapterId?: string) {
  return SUBJECT_VIDEO_TEMPLATES.英语.map((item) => ({
    id: chapterId ? englishHujiaoSectionId(chapterId, item.id) : item.id,
    title: englishHujiaoVideoName(chapterLabel, item.title),
    subtitle: item.title,
    group: isPracticeVideoModule(item.id) ? ('practice' as const) : ('learn' as const),
  }));
}
