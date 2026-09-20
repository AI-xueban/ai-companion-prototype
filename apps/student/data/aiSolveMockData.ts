import problemPaintWallImg from '@/assets/problem-paint-wall-q27.png';
import problemEnglishExamImg from '@/assets/problem-english-exam.png';
import problemChineseExamImg from '@/assets/problem-chinese-exam.png';
import missionMathPhoto from '@/assets/daily-mission/math-scale-question.png';
import missionEnglishPhoto from '@/assets/daily-mission/english-grandparents-page.png';

export interface AISolveQuestion {
  id: string;
  number: string;
  text: string;
  subject: string;
  /** 题目实拍图 */
  imageSrc?: string;
  /** 多题同页时的相对区域（百分比） */
  region?: { top: number; left: number; width: number; height: number };
}

export const DEFAULT_QUESTION: AISolveQuestion = {
  id: 'q27',
  number: '27',
  text: '一间教室的一面墙（如图），如果每平方米用涂料 0.4 千克，每千克涂料 10 元，那么粉刷 40 面墙（除去窗户），共需多少元？',
  subject: '数学',
  imageSrc: problemPaintWallImg,
};

export interface AISolveMockShot {
  id: string;
  label: string;
  multiQuestion: boolean;
  /** 整页实拍图（缩略图 / 切题底图） */
  imageSrc?: string;
  questions: AISolveQuestion[];
}

/** 原型拍照素材：数学应用题 → 英语多题同页 → 语文试卷 */
export const AI_SOLVE_MOCK_SHOTS: AISolveMockShot[] = [
  {
    id: 'shot-paint',
    label: '应用题 · 粉刷墙面',
    multiQuestion: false,
    imageSrc: problemPaintWallImg,
    questions: [DEFAULT_QUESTION],
  },
  {
    id: 'shot-english',
    label: '英语 · 多题同页',
    multiQuestion: true,
    imageSrc: problemEnglishExamImg,
    questions: [
      {
        id: 'en1',
        number: '1',
        text: '—Happy birthday, Bob. —_______（选择最佳选项）',
        subject: '英语',
        imageSrc: problemEnglishExamImg,
        region: { top: 8, left: 3, width: 94, height: 30 },
      },
      {
        id: 'en2',
        number: '2',
        text: '短文填空：Bill and Mike — 用所给单词的正确形式填空',
        subject: '英语',
        imageSrc: problemEnglishExamImg,
        region: { top: 38, left: 3, width: 94, height: 58 },
      },
    ],
  },
  {
    id: 'shot-chinese',
    label: '语文 · 多题同页',
    multiQuestion: true,
    imageSrc: problemChineseExamImg,
    questions: [
      {
        id: 'cn3',
        number: '3',
        text: '下列词语书写有错误的一项是（ ）。',
        subject: '语文',
        imageSrc: problemChineseExamImg,
        region: { top: 7, left: 50, width: 44, height: 22 },
      },
      {
        id: 'cn4',
        number: '4',
        text: '阅读与积累：不改变句意，将文中划线句子「秦王我都不怕，还会怕廉将军吗？」换一种说法。',
        subject: '语文',
        imageSrc: problemChineseExamImg,
        region: { top: 31, left: 49, width: 47, height: 63 },
      },
    ],
  },
];

/** 拍照问小晤素材 */
export const MISSION_DAILY_MOCK_SHOTS: AISolveMockShot[] = [
  {
    id: 'mission-math-unit-conversion',
    label: '数学 · 单位统一换算',
    multiQuestion: false,
    imageSrc: missionMathPhoto,
    questions: [
      {
        id: 'mission-q-unit-conversion',
        number: '7',
        text: '比例尺题：北京到深圳实际距离约 2160 千米，图上距离 20 厘米，定位知识点为“单位统一换算”。',
        subject: '数学',
        imageSrc: missionMathPhoto,
      },
    ],
  },
  {
    id: 'mission-english-grandparents',
    label: '英语 · Module 2 Relationships Unit 4 Grandparents',
    multiQuestion: false,
    imageSrc: missionEnglishPhoto,
    questions: [
      {
        id: 'mission-q-grandparents',
        number: 'Unit 4',
        text: '教材：沪教牛津版小学英语五年级上册（上海教育出版社）；单元：Module 2 Relationships Unit 4 Grandparents。',
        subject: '英语',
        imageSrc: missionEnglishPhoto,
      },
    ],
  },
];

export function getShotById(id: string): AISolveMockShot | undefined {
  return [...AI_SOLVE_MOCK_SHOTS, ...MISSION_DAILY_MOCK_SHOTS].find((s) => s.id === id);
}

export function getQuestionById(id: string): AISolveQuestion | undefined {
  for (const shot of AI_SOLVE_MOCK_SHOTS) {
    const q = shot.questions.find((item) => item.id === id);
    if (q) return q;
  }
  return undefined;
}

export function flattenQuestionsFromShots(shotIds: string[]): AISolveQuestion[] {
  return shotIds.flatMap((id) => getShotById(id)?.questions ?? []);
}

export function needsQuestionPicker(shotIds: string[]): boolean {
  const questions = flattenQuestionsFromShots(shotIds);
  if (questions.length > 1) return true;
  return shotIds.some((id) => getShotById(id)?.multiQuestion);
}
