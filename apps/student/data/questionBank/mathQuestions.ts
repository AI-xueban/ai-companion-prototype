import { QuestionItem } from './types';
import {
  SURVEY_Q015_STEM_HTML,
  SURVEY_Q015_EXPLANATION_HTML,
  SURVEY_Q015_FORMULA_URL,
} from './xkwSurveyQ015';

const floorTilePatternImg = new URL('./images/mistake-floor-tile-pattern.png', import.meta.url).href;
const floorTileSourceSheetImg = new URL('./images/mistake-floor-tile-source-sheet.png', import.meta.url).href;

const FLOOR_TILE_PATTERN_EXPLANATION = `【分析】此题考查了找规律。解题思路：观察每层正三角形的数量变化，找出其规律，从而得出第 n 层正三角形的数量表达式。

【解答】解：（1）第 1 层有 6 个正三角形，第 2 层有 18 个正三角形，第 2 层比第 1 层多 18－6=12 个正三角形；那么第 3 层比第 2 层也多 12 个正三角形，所以第 3 层正三角形的数量为 18+12=30 个。故答案为 30。

（2）第 1 层正三角形数量：6=6+12×（1-1）；第 2 层正三角形数量：18=6+12×（2-1）；以此类推，第 n 层正三角形的数量为 6+12×（n－1），化简可得 6+12n-12=12n-6。故答案为 12n-6。

（3）已知第 n 层有 2022 个正三角形，根据（2）中得出的规律 12n-6=2022，移项可得 12n=2022+6=2028，两边同时除以 12，n=169。故答案为 169。`;

const FLOOR_TILE_STEM =
  '如图，这是用地板砖铺设的部分图案，中央是一块正六边形的地板砖，周围是正三角形和正方形的地板砖，从里向外的第1层包括6个正方形和6个正三角形，第2层包括6个正方形和18个正三角形，.....依次递推。';

const SURVEY_ACTIVITY_EXPLANATION = `【分析】
（1）从统计表中直接通过比较即可得到。
（2）利用统计表，找到对音乐感兴趣的人数，再用对音乐感兴趣的人数除以全班人数，求出对应的百分比。

【详解】
解：从统计表分析人数可得到结论。由表可得：
（1）体育运动小组人数最多，所以全班同学最感兴趣的课外活动项目是体育运动；
（2）对音乐感兴趣的人数是 10，占全班人数的百分比是 10÷50=20%。

故答案为：（1）体育运动；（2）10，20%。

【点睛】
本题主要是统计表的相关知识，如何读懂统计表，从统计表获取信息是关键。`;

// 原 mockQuestionBank 迁移：数学题库
export const mathQuestions: QuestionItem[] = [
  {
    id: 'q-math-001',
    subject: 'math',
    type: 'single_choice',
    difficulty: 2,
    category: 'textbook',
    knowledgePoints: ['勾股定理', '直角三角形斜边上的中线'],
    tags: ['课本原题', '基础', '直角三角形'],
    content: {
      stem: '在直角三角形 ABC 中，∠C = 90°，AC = 3，BC = 4，则 AB 的长度为：',
      options: ['A. 5', 'B. 6', 'C. 7', 'D. 25']
    },
    result: { correctAnswer: 'A', explanation: '勾股定理：AB = √(3²+4²) = 5' },
    correctCount: 18,
    wrongCount: 4,
    similarIds: ['q-math-009'],
    sparkGroup: 'geometry_basics',
    bookmarked: false,
    source: '人教版九年级',
    cognitiveState: 'MASTERED'
  },
  {
    id: 'q-math-013',
    subject: 'math',
    type: 'fill_in_blank',
    difficulty: 4,
    category: 'finale',
    knowledgePoints: ['找规律', '列代数式'],
    tags: ['压轴题', '规律探究', '图片题'],
    content: {
      stem: FLOOR_TILE_STEM,
      stemImages: [floorTilePatternImg],
      originalImageUrl: floorTileSourceSheetImg,
      mistakeCardPreview: 'image',
      subQuestions: [
        { question: '（1）第 3 层有 6 个正方形和______个正三角形。', answer: '30' },
        { question: '（2）第 n 层有 6 个正方形和______个正三角形。（用含 n 的式子表示）', answer: '12n-6' },
        { question: '（3）已知第 n 层有 2022 个正三角形，则 n=______。', answer: '169' },
      ],
    },
    result: {
      correctAnswer: '30;12n-6;169',
      explanation: FLOOR_TILE_PATTERN_EXPLANATION,
    },
    correctCount: 4,
    wrongCount: 9,
    sparkGroup: 'pattern_algebra',
    bookmarked: true,
    cognitiveState: 'GAP',
  },
  {
    id: 'q-math-014',
    subject: 'math',
    type: 'fill_in_blank',
    difficulty: 4,
    category: 'finale',
    knowledgePoints: ['找规律', '列代数式'],
    tags: ['压轴题', '规律探究', '图片题'],
    content: {
      stem: FLOOR_TILE_STEM,
      stemImages: [floorTilePatternImg],
      originalImageUrl: floorTileSourceSheetImg,
      mistakeCardPreview: 'text',
      subQuestions: [
        { question: '（1）第 3 层有 6 个正方形和______个正三角形。', answer: '30' },
        { question: '（2）第 n 层有 6 个正方形和______个正三角形。（用含 n 的式子表示）', answer: '12n-6' },
        { question: '（3）已知第 n 层有 2022 个正三角形，则 n=______。', answer: '169' },
      ],
    },
    result: {
      correctAnswer: '30;12n-6;169',
      explanation: FLOOR_TILE_PATTERN_EXPLANATION,
    },
    correctCount: 3,
    wrongCount: 8,
    sparkGroup: 'pattern_algebra',
    bookmarked: false,
    cognitiveState: 'GAP',
  },
  {
    id: 'q-math-002',
    subject: 'math',
    type: 'fill_in_blank',
    difficulty: 3,
    category: 'typical',
    knowledgePoints: ['菱形的性质', '菱形的判定'],
    tags: ['典型题', '代数', '易错'],
    content: {
      stem: '已知 x + y = 5，xy = 6，则 x² + y² = ______。'
    },
    result: { correctAnswer: '13', explanation: 'x²+y² = (x+y)² - 2xy = 25 - 12 = 13' },
    correctCount: 12,
    wrongCount: 11,
    sparkGroup: 'algebra_basics',
    similarIds: ['q-math-003'],
    bookmarked: false,
    cognitiveState: 'GAP'
  },
  {
    id: 'q-math-003',
    subject: 'math',
    type: 'true_false',
    difficulty: 1,
    category: 'typical',
    knowledgePoints: ['平方根', '实数范围'],
    tags: ['概念辨析', '基础'],
    content: {
      stem: '负数的平方根是负数。（对/错）'
    },
    result: { correctAnswer: '错', explanation: '实数范围内无负数平方根，需引入虚数单位 i。' },
    correctCount: 26,
    wrongCount: 6,
    sparkGroup: 'algebra_basics',
    similarIds: ['q-math-001'],
    cognitiveState: 'MASTERED'
  },
  {
    id: 'q-math-005',
    subject: 'math',
    type: 'single_choice',
    difficulty: 3,
    category: 'synchronous',
    knowledgePoints: ['一次函数', '斜率截距式'],
    tags: ['同步题', '图像理解'],
    content: {
      stem: '一次函数 y = kx + b 过点 (2,3) 且与 y 轴交点为 (0,-1)，则 k = ？',
      options: ['A. 1', 'B. 2', 'C. -2', 'D. 4']
    },
    result: { correctAnswer: 'B', explanation: '代入 (0,-1) 得 b=-1；代入 (2,3) 解 k=2。' },
    correctCount: 14,
    wrongCount: 9,
    sparkGroup: 'algebra_line',
    similarIds: ['q-math-006'],
    cognitiveState: 'FADED'
  },
  {
    id: 'q-math-006',
    subject: 'math',
    type: 'multiple_choice',
    difficulty: 3,
    category: 'typical',
    knowledgePoints: ['因式分解', '提公因式', '公式法'],
    tags: ['多选', '代数', '技巧'],
    content: {
      stem: '下列可直接用公式法分解的是：',
      options: ['A. x² - 9', 'B. x² + 2x + 1', 'C. x² - 5x', 'D. x² + 4x + 4']
    },
    result: { correctAnswer: ['A', 'B', 'D'], explanation: 'A 平方差，B/D 完全平方；C 需提公因式。' },
    correctCount: 9,
    wrongCount: 12,
    sparkGroup: 'algebra_basics',
    similarIds: ['q-math-002'],
    bookmarked: true,
    cognitiveState: 'GAP'
  },
  {
    id: 'q-math-007',
    subject: 'math',
    type: 'single_choice',
    difficulty: 4,
    category: 'finale',
    knowledgePoints: ['三角形性质', '角平分线定理'],
    tags: ['压轴题', '几何'],
    content: {
      stem: '在三角形 ABC 中，AD 为角平分线，若 AB=6，AC=9，BD=3，则 DC = ？',
      options: ['A. 4.5', 'B. 4', 'C. 6', 'D. 7.5']
    },
    result: { correctAnswer: 'A', explanation: '角平分线定理：BD/DC = AB/AC = 6/9 → DC = 4.5。' },
    correctCount: 6,
    wrongCount: 14,
    sparkGroup: 'geometry_basics',
    similarIds: ['q-math-001'],
    cognitiveState: 'GAP'
  },
  {
    id: 'q-math-008',
    subject: 'math',
    type: 'fill_in_blank',
    difficulty: 2,
    category: 'synchronous',
    knowledgePoints: ['函数值域', '配方法'],
    tags: ['同步题', '函数'],
    content: {
      stem: '函数 f(x) = (x-2)² - 3 的最小值为 ______。'
    },
    result: { correctAnswer: '-3', explanation: '顶点式直接读最小值 -3。' },
    correctCount: 20,
    wrongCount: 5,
    sparkGroup: 'function_basic',
    similarIds: ['q-math-002'],
    cognitiveState: 'FADED'
  },
  {
    id: 'q-math-009',
    subject: 'math',
    type: 'true_false',
    difficulty: 2,
    category: 'textbook',
    knowledgePoints: ['相似三角形的判定', '相似三角形的性质'],
    tags: ['课本原题', '几何'],
    content: {
      stem: '两直角三角形若一个锐角相等，则它们相似。（对/错）'
    },
    result: { correctAnswer: '对', explanation: 'AA 相似判定成立。' },
    correctCount: 17,
    wrongCount: 6,
    sparkGroup: 'geometry_basics',
    similarIds: ['q-math-001'],
    cognitiveState: 'MASTERED'
  },
  {
    id: 'q-math-010',
    subject: 'math',
    type: 'single_choice',
    difficulty: 3,
    category: 'typical',
    knowledgePoints: ['一元二次方程的定义', '根的判别式'],
    tags: ['典型题', '判别式'],
    content: {
      stem: '方程 x² - 4x + m = 0 有两个相等实根，则 m = ？',
      options: ['A. 4', 'B. 0', 'C. -4', 'D. 8']
    },
    result: { correctAnswer: 'A', explanation: '判别式 Δ=0 → (-4)² - 4m = 0 → m = 4。' },
    correctCount: 11,
    wrongCount: 7,
    sparkGroup: 'algebra_basics',
    similarIds: ['q-math-002', 'q-math-006'],
    cognitiveState: 'FADED'
  },
  {
    id: 'q-math-012',
    subject: 'math',
    type: 'multiple_choice',
    difficulty: 2,
    category: 'textbook',
    knowledgePoints: ['概率', '独立事件'],
    tags: ['概率', '多选'],
    content: {
      stem: '掷一枚均匀骰子两次，下列事件独立的是：',
      options: ['A. 第一次为 1，第二次为 6', 'B. 和为 7，第一次为 1', 'C. 第一次为奇数，和为 12', 'D. 第一次为 6，和为 6']
    },
    result: { correctAnswer: ['A', 'C'], explanation: '独立性需 P(A∩B)=P(A)P(B)；验证可得 A、C 独立。' },
    correctCount: 13,
    wrongCount: 10,
    sparkGroup: 'probability_basic',
    cognitiveState: 'FADED'
  },
  {
    id: 'q-math-015',
    externalQuestionId: '2883704765931520',
    subject: 'math',
    type: 'fill_in_blank',
    difficulty: 1,
    category: 'textbook',
    knowledgePoints: ['统计表'],
    tags: ['填空', '统计表'],
    content: {
      stem: '某同学对全班50名同学感兴趣的课外活动项目进行了调查，绘制下表：',
      htmlStem: SURVEY_Q015_STEM_HTML,
      htmlExplanation: SURVEY_Q015_EXPLANATION_HTML,
      mistakeCardPreview: 'text',
      manualGradeBlankIndex: 2,
      manualGradeReferenceImageUrl: SURVEY_Q015_FORMULA_URL,
      subQuestions: [
        { question: '（1）全班同学最感兴趣的课外活动项目是______', answer: '体育运动' },
        { question: '（2）对音乐感兴趣的人数是______', answer: '10' },
        { question: '占全班人数的百分比是______', answer: '20%', manualGrade: true },
      ],
    },
    result: {
      correctAnswer: ['体育运动', '10', '20%'],
      explanation: SURVEY_ACTIVITY_EXPLANATION,
    },
    correctCount: 0,
    wrongCount: 2,
    bookmarked: false,
    cognitiveState: 'GAP',
    source: '学科网',
  },
];
