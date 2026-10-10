export type PastPaperSubject = '语文' | '数学' | '英语';

export interface PastPaperQuestionPreview {
  id: string;
  number: string;
  type: string;
  stem: string;
  options?: string[];
  answerPreview?: string;
}

export interface PastPaperDemoItem {
  id: string;
  title: string;
  schoolYear: string;
  province: string;
  city: string;
  district: string;
  grade: string;
  semester: '上学期' | '下学期';
  examType: '期中' | '期末';
  subject: PastPaperSubject;
  textbookVersion?: string;
  sourceFileNames: string[];
  availableFormats: Array<'DOCX' | 'PDF'>;
  hasAnswerAndAnalysis: boolean;
  authorizationStatus: 'needs_review';
  deliveryMode: 'prototype_mock';
  sections: string[];
  highlights: string[];
  questionPreviews: PastPaperQuestionPreview[];
}

/**
 * 小晤同学真题搜索 / PDF 交付原型数据。
 *
 * 数据仅从产品提供的本地样卷中抽取少量文本，用于内部交互演示；
 * 不把本机绝对路径、整份试卷正文或源文件打包进前端。
 * 上线接入前必须完成来源、授权与可分发范围复核。
 */
export const PAST_PAPER_DEMO_ITEMS: PastPaperDemoItem[] = [
  {
    id: 'paper-sz-nanshan-g5-math-2024-2025-final-2',
    title: '2024～2025学年广东深圳南山区五年级下学期期末数学试卷',
    schoolYear: '2024～2025学年',
    province: '广东',
    city: '深圳',
    district: '南山区',
    grade: '五年级',
    semester: '下学期',
    examType: '期末',
    subject: '数学',
    textbookVersion: '北师大版',
    sourceFileNames: [
      '2024~2025学年⼴东深圳南⼭区五年级下学期期末数学试卷北师⼤版.docx',
      '2024~2025学年⼴东深圳南⼭区五年级下学期期末数学试卷（北.pdf',
    ],
    availableFormats: ['DOCX', 'PDF'],
    hasAnswerAndAnalysis: true,
    authorizationStatus: 'needs_review',
    deliveryMode: 'prototype_mock',
    sections: ['选择题', '填空题', '计算题', '改错题', '作图题', '解答题'],
    highlights: ['分数运算', '长方体与正方体', '统计图', '方程与实际问题'],
    questionPreviews: [
      {
        id: 'math-q2',
        number: '2',
        type: '单项选择',
        stem: '在下面一组数中，与其他数不同的一个数是（ ）。',
        options: ['4.06m³', '4060dm³', '40600cm³', '4060000cm³'],
        answerPreview: 'C',
      },
      {
        id: 'math-q3',
        number: '3',
        type: '单项选择',
        stem: '奇思将2个西红柿浸没在装有水的容器中（水未溢出），水上升的体积约为（ ）。',
        options: ['400L', '400mL', '40L', '4mL'],
        answerPreview: 'B',
      },
      {
        id: 'math-q5',
        number: '5',
        type: '单项选择',
        stem: '下面的信息适合用复式折线统计图表示的是（ ）。',
        options: [
          '两个班各项目的合格人数',
          '两所学校近五年学生近视人数的变化情况',
          '近十年深圳市公园数量的变化情况',
          '张老师近6个月在课堂中使用人工智能的次数情况',
        ],
        answerPreview: 'B',
      },
      {
        id: 'math-q28',
        number: '28',
        type: '综合应用',
        stem: '设计容积为64升的长方体运输纸箱，在容积不变的前提下比较不同方案的表面积，并继续设计27升纸箱。',
      },
    ],
  },
  {
    id: 'paper-sz-luohu-g4-english-2025-2026-final-1',
    title: '2025～2026学年广东深圳罗湖区四年级上学期期末英语试卷',
    schoolYear: '2025～2026学年',
    province: '广东',
    city: '深圳',
    district: '罗湖区',
    grade: '四年级',
    semester: '上学期',
    examType: '期末',
    subject: '英语',
    textbookVersion: '沪教牛津版（深圳用）（2015）',
    sourceFileNames: [
      '2025～2026学年广东深圳罗湖区四年级上学期期末英语试卷.docx',
      '2025~2026学年⼴东深圳罗湖区四年级上学期期末英语试卷（沪.pdf',
    ],
    availableFormats: ['DOCX', 'PDF'],
    hasAnswerAndAnalysis: true,
    authorizationStatus: 'needs_review',
    deliveryMode: 'prototype_mock',
    sections: ['语音题', '单词题', '单项选择', '补全对话与短文', '书面表达'],
    highlights: ['语音辨析', '节日与生活词汇', '购物情境对话', '阅读安全规则', '社区主题写作'],
    questionPreviews: [
      {
        id: 'english-q1',
        number: '1',
        type: '语音判断',
        stem: '判断 usually / summer、five / mice、late / faster、even / equal 划线部分的发音是否相同。',
        answerPreview: 'F、T、F、T',
      },
      {
        id: 'english-q3',
        number: '3',
        type: '词汇选择',
        stem: 'Children visit their grandparents on _______.',
        options: ['Double Ninth Festival', "Children’s Day", 'Christmas'],
        answerPreview: 'A',
      },
      {
        id: 'english-q7',
        number: '7',
        type: '补全对话',
        stem: 'Kate在商店为妈妈挑选新年礼物，根据上下文补全购物对话。',
        answerPreview: 'E、A、D、B、C',
      },
      {
        id: 'english-q10',
        number: '10',
        type: '书面表达',
        stem: '以“Around my home”为主题，结合居住地、附近场所和日常活动完成不少于35词的短文。',
      },
    ],
  },
  {
    id: 'paper-sz-luohu-g5-chinese-2025-2026-final-1',
    title: '2025～2026学年广东深圳罗湖区五年级上学期期末语文试卷',
    schoolYear: '2025～2026学年',
    province: '广东',
    city: '深圳',
    district: '罗湖区',
    grade: '五年级',
    semester: '上学期',
    examType: '期末',
    subject: '语文',
    textbookVersion: '统编版',
    sourceFileNames: [
      '2025～2026学年广东深圳罗湖区五年级上学期期末语文试卷（统编版）试卷.docx',
      '2025~2026学年⼴东深圳罗湖区五年级上学期期末语⽂试卷（统.pdf',
    ],
    availableFormats: ['DOCX', 'PDF'],
    hasAnswerAndAnalysis: false,
    authorizationStatus: 'needs_review',
    deliveryMode: 'prototype_mock',
    sections: ['基础知识', '积累运用', '现代文阅读'],
    highlights: ['岭南与故乡主题', '民间故事', '方言保护', '深圳移民文化', '观点表达'],
    questionPreviews: [
      {
        id: 'chinese-q3',
        number: '3',
        type: '单项选择',
        stem: '下列句子中，加点成语使用不恰当的一项是（ ）。',
        answerPreview: 'D',
      },
      {
        id: 'chinese-q6',
        number: '6',
        type: '口语表达',
        stem: '向低年级同学推荐一个中国民间故事，写出故事名并说明一个推荐理由。',
      },
      {
        id: 'chinese-q8',
        number: '8',
        type: '观点表达',
        stem: '有人认为科技发达后再读“烽火连三月，家书抵万金”已经过时。你是否同意？请简要说明理由。',
      },
      {
        id: 'chinese-q10',
        number: '10',
        type: '非连续性文本阅读',
        stem: '阅读“来了，就是深圳人”相关材料，用原文词语概括这句观念的核心内涵。',
      },
    ],
  },
];

export const findPastPaperDemoItems = (query: {
  subject?: PastPaperSubject;
  grade?: string;
  district?: string;
  examType?: '期中' | '期末';
}) => PAST_PAPER_DEMO_ITEMS.filter((paper) => (
  (!query.subject || paper.subject === query.subject)
  && (!query.grade || paper.grade === query.grade)
  && (!query.district || paper.district === query.district)
  && (!query.examType || paper.examType === query.examType)
));
