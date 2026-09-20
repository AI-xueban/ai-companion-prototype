import { BoardLineStyle } from './tutorTeachingScript';
import type { AISolveQuestion } from './aiSolveMockData';

export interface TutorQuestionMeta {
  typeLabel: string;
  typeTags: string[];
  /** @deprecated 不在板书展示，保留供脚本参考 */
  approachSummary: string;
  /** @deprecated 板书不再展示 */
  reminder: string;
}

export interface QuickOutlineStep {
  id: string;
  label: string;
  /** 本步要做什么（短标题） */
  title: string;
  /** 怎么算、用什么数——不含本步最终结果 */
  skeleton: string;
}

export interface GuideFillLine {
  text: string;
  style?: BoardLineStyle;
}

export interface GuideStep {
  id: string;
  question: string;
  hint: string;
  /** 用户回答包含任一关键词即视为正确（原型） */
  acceptKeywords: string[];
  fillLines: GuideFillLine[];
  successSpeech: string;
}

export interface TutorScriptPack {
  scriptKey: string;
  meta: TutorQuestionMeta;
  quickSteps: QuickOutlineStep[];
  guideSteps: GuideStep[];
}

/** 第 27 题 · 题型与解题路径（题外信息） */
export const PAINT_WALL_TUTOR_META: TutorQuestionMeta = {
  typeLabel: '应用题',
  typeTags: ['长方形面积', '复合图形', '乘除混合', '实际费用'],
  approachSummary: '读图拿尺寸 → 单面可刷（墙减窗）→ 40 面放大 → 换涂料千克 → 算总费用',
  reminder: '读题先圈出已知量；算可刷面积时，记得把窗户面积从墙面里减掉。',
};

/**
 * 快速解题骨架：说清思路与算式，可写已知数值，但不写各步答案。
 * 具体结果留到 1 对 1 讲题由学生填数。
 */
export const PAINT_WALL_QUICK_STEPS: QuickOutlineStep[] = [
  {
    id: 's1',
    label: '第1步',
    title: '读题，整理已知条件',
    skeleton:
      '从图读取：墙长 8 m、宽 6 m；窗长 2 m、高 1.2 m。题目还给：40 面墙、涂料 0.4 kg/m²、单价 10 元/kg。先分清「求什么」——40 面墙（除去窗户）共需多少元。',
  },
  {
    id: 's2',
    label: '第2步',
    title: '算一面墙的可刷面积',
    skeleton:
      '墙面积 = 8 × 6；窗面积 = 2 × 1.2。窗户不刷涂料，所以单面可刷 = 墙面积 − 窗面积。这一步只算面积（m²），还不算钱。',
  },
  {
    id: 's3',
    label: '第3步',
    title: '算 40 面墙的总可刷面积与涂料用量',
    skeleton:
      '总可刷面积 = 单面可刷 × 40。涂料用量（kg）= 总可刷面积 × 0.4（题目给的单位用量）。先得到要刷的总面积，再换成涂料千克数。',
  },
  {
    id: 's4',
    label: '第4步',
    title: '求总费用',
    skeleton:
      '总费用（元）= 涂料千克数 × 10（题目给的单价）。注意单位：面积 → 千克 → 元，三步不要跳步。',
  },
];

export const PAINT_WALL_GUIDE_STEPS: GuideStep[] = [
  {
    id: 'g1',
    question: '先读题：墙面和窗户的长宽分别是多少？试着列出来。',
    hint: '看看图中的标注，墙面底边和左侧、窗户下方和左侧的数值。',
    acceptKeywords: ['8', '6', '2', '1.2', '长', '宽', '米', 'm'],
    fillLines: [
      { text: '墙：长 8m，宽 6m', style: 'normal' },
      { text: '窗：长 2m，高 1.2m', style: 'normal' },
    ],
    successSpeech: '读题很准确！接下来算一面墙能刷多大面积。',
  },
  {
    id: 'g2',
    question: '一面墙要先算什么？列式算算看（墙面积、窗面积、可刷面积）。',
    hint: '窗户不用刷涂料：先算 S墙=8×6，再算 S窗=2×1.2，最后用减法。',
    acceptKeywords: ['面积', '减', '窗', '48', '2.4', '45.6', 'S', '×', '乘'],
    fillLines: [
      { text: 'S墙 = 8 × 6 = 48（m²）', style: 'formula' },
      { text: 'S窗 = 2 × 1.2 = 2.4（m²）', style: 'formula' },
      { text: 'S刷 = 48 − 2.4 = 45.6（m²）', style: 'emphasis' },
    ],
    successSpeech: '对了！窗户区域要减掉。现在想想 40 面墙怎么算。',
  },
  {
    id: 'g3',
    question: '40 面墙的总可刷面积和涂料用量怎么列式？',
    hint: '总可刷 = 单面可刷 × 40；涂料 kg = 总可刷 × 0.4。',
    acceptKeywords: ['45.6', '40', '乘', '×', '1824', '729.6', '0.4'],
    fillLines: [
      { text: 'S总 = 45.6 × 40 = 1824（m²）', style: 'formula' },
      { text: '涂料用量：0.4 kg/m²', style: 'normal' },
      { text: 'M = 1824 × 0.4 = 729.6（kg）', style: 'emphasis' },
    ],
    successSpeech: '总量算出来了！最后一步：怎么求总费用？',
  },
  {
    id: 'g4',
    question: '每千克 10 元，总费用怎么求？',
    hint: '用涂料总千克数乘以每千克单价。',
    acceptKeywords: ['729.6', '10', '乘', '×', '7296', '元', '费用'],
    fillLines: [
      { text: '费用 = 729.6 × 10 = 7296（元）', style: 'answer' },
    ],
    successSpeech: '太棒了！40 面墙（除去窗户）共需 7296 元，你完全掌握了！',
  },
];

const ENGLISH_TUTOR_META: TutorQuestionMeta = {
  typeLabel: '英语题',
  typeTags: ['读题定位', '语境判断', '答案表达', '复核'],
  approachSummary: '读题定位任务 → 提炼语境线索 → 给出答案并说明依据 → 检查表达是否成立',
  reminder: '先说清题目问什么，再给答案和理由。',
};

const ENGLISH_QUICK_STEPS: QuickOutlineStep[] = [
  {
    id: 's1',
    label: '第1步',
    title: '读题，明确任务',
    skeleton: '先看题干和空格/问题，确认要选答案、填词还是改写，圈出限制条件。',
  },
  {
    id: 's2',
    label: '第2步',
    title: '定位语境与线索',
    skeleton: '回到上下文找关键词，关注时态、主谓一致、固定搭配和逻辑连接词。',
  },
  {
    id: 's3',
    label: '第3步',
    title: '给出答案并说明依据',
    skeleton: '先说你选哪一个/填什么，再说明“为什么这个更符合语境和语法”。',
  },
  {
    id: 's4',
    label: '第4步',
    title: '复查表达是否通顺',
    skeleton: '把答案带回原句通读，检查语法、逻辑和语义是否都成立。',
  },
];

const ENGLISH_GUIDE_STEPS: GuideStep[] = [
  {
    id: 'g1',
    question: '这道英语题要你完成什么任务？先用一句话说清楚。',
    hint: '可以从“选项选择 / 短文填空 / 改写句子”里先判断类型。',
    acceptKeywords: ['选', '填', '任务', '题干', '空格', '问题', '问', '句子'],
    fillLines: [{ text: '任务：先说清“这题要做什么”', style: 'normal' }],
    successSpeech: '很好，任务明确了。下一步找语境线索。',
  },
  {
    id: 'g2',
    question: '你准备抓哪几个线索来判断答案？',
    hint: '可从时态、主谓一致、固定搭配、上下文逻辑里选 1-2 个。',
    acceptKeywords: ['时态', '主谓', '搭配', '上下文', '逻辑', '关键词', '语境'],
    fillLines: [{ text: '线索：时态 / 搭配 / 逻辑 / 上下文', style: 'formula' }],
    successSpeech: '思路对了！现在给出答案和理由。',
  },
  {
    id: 'g3',
    question: '请给出你的答案，并说一句依据。',
    hint: '格式可用：“我选（填）___，因为___。”',
    acceptKeywords: ['因为', '所以', '选', '填', 'a', 'b', 'c', 'd'],
    fillLines: [{ text: '答案：___；依据：符合语境与语法', style: 'emphasis' }],
    successSpeech: '回答很完整！最后做个复查。',
  },
  {
    id: 'g4',
    question: '把答案代回原句后，是否通顺、语法正确？',
    hint: '如果读起来别扭，优先回看搭配或时态。',
    acceptKeywords: ['通顺', '正确', '复查', '检查', '确认', '成立'],
    fillLines: [{ text: '复查：语法正确，语义通顺', style: 'answer' }],
    successSpeech: '很好，这道题的解题链条已经完整了！',
  },
];

const CHINESE_TUTOR_META: TutorQuestionMeta = {
  typeLabel: '语文题',
  typeTags: ['审题', '定位信息', '组织表达', '复核'],
  approachSummary: '明确题目要求 → 回文定位依据 → 组织答案 → 复核是否贴合题意',
  reminder: '先答“问什么”，再答“怎么答”。',
};

const CHINESE_QUICK_STEPS: QuickOutlineStep[] = [
  {
    id: 's1',
    label: '第1步',
    title: '审题，明确作答要求',
    skeleton: '先看题干关键词，弄清是“选择正确项”还是“改写/赏析/概括”。',
  },
  {
    id: 's2',
    label: '第2步',
    title: '回文定位答题依据',
    skeleton: '回到原文对应句段，圈出支撑答案的关键词句，避免脱离文本作答。',
  },
  {
    id: 's3',
    label: '第3步',
    title: '组织答案表达',
    skeleton: '先给结论，再补一句依据；选择题要说明排除理由，主观题要语言完整。',
  },
  {
    id: 's4',
    label: '第4步',
    title: '复核是否贴合题意',
    skeleton: '检查是否答到点、表述是否通顺、是否遗漏题干限定条件。',
  },
];

const CHINESE_GUIDE_STEPS: GuideStep[] = [
  {
    id: 'g1',
    question: '先说说这道语文题具体让你做什么？',
    hint: '可先判断：选择题、改写句子、阅读分析等。',
    acceptKeywords: ['选择', '改写', '阅读', '分析', '题意', '要求', '问'],
    fillLines: [{ text: '任务：先把“问什么”说清楚', style: 'normal' }],
    successSpeech: '好，题意明确了。下一步去文中找依据。',
  },
  {
    id: 'g2',
    question: '你准备从原文哪一处找答题依据？',
    hint: '可先说关键词句，或说“第几段/哪一句”。',
    acceptKeywords: ['原文', '关键词', '句子', '段', '依据', '定位', '文中'],
    fillLines: [{ text: '依据：定位原文关键词句', style: 'formula' }],
    successSpeech: '很好，依据找到了。现在组织你的答案。',
  },
  {
    id: 'g3',
    question: '请给出你的答案，并补一句依据。',
    hint: '格式可用：“我认为___，依据是___。”',
    acceptKeywords: ['我认为', '依据', '因为', '所以', '应该', '是'],
    fillLines: [{ text: '答案：___；依据：___', style: 'emphasis' }],
    successSpeech: '表达很清楚！最后做一次复核。',
  },
  {
    id: 'g4',
    question: '再检查下：你的答案是否完全对应题干要求？',
    hint: '看是否遗漏限制条件，语言是否简洁通顺。',
    acceptKeywords: ['对应', '完整', '通顺', '简洁', '检查', '复核', '符合'],
    fillLines: [{ text: '复核：答到点，表达清楚', style: 'answer' }],
    successSpeech: '非常好，这道语文题已经讲清楚了！',
  },
];

export function matchGuideAnswer(text: string, step: GuideStep): boolean {
  const normalized = text.replace(/\s/g, '').toLowerCase();
  if (normalized.length < 1) return false;
  return step.acceptKeywords.some((kw) => normalized.includes(kw.replace(/\s/g, '').toLowerCase()));
}

/** 跳步进入某步前的轻量前置确认（index 0 无此项） */
export interface GuideJumpPrereq {
  prompt: string;
  hint: string;
  acceptKeywords: string[];
  /** 确认不过时回退到哪一步（0-based） */
  fallbackStepIndex: number;
}

export const GUIDE_JUMP_PREREQ: Partial<Record<string, GuideJumpPrereq>> = {
  g2: {
    prompt: '好，从算单面面积开始。读题那部分应该没问题了吧？',
    hint: '墙面 8×6、窗户 2×1.2，这些数对上了就回「会了」。',
    acceptKeywords: ['8', '6', '2', '1.2', '会', '懂', '对', '没问题', '清楚', '读过'],
    fallbackStepIndex: 0,
  },
  g3: {
    prompt: '从前两步过来～单面可刷面积大约是 45.6 m²，你这边算对了吗？',
    hint: '要是还没算出来，咱们从第 2 步单面面积讲起。',
    acceptKeywords: ['45.6', '45', '会', '懂', '对', '算过', '没问题', '清楚', '减', '窗'],
    fallbackStepIndex: 1,
  },
  g4: {
    prompt: '前面的数如果 OK，涂料总量大约是 729.6 kg，你算出来了吗？',
    hint: '总可刷 × 0.4 得到千克数，不确定就从第 3 步讲起。',
    acceptKeywords: ['729.6', '729', '1824', '会', '懂', '对', '算过', '没问题', '0.4', '40'],
    fallbackStepIndex: 2,
  },
};

export function matchPrereqAnswer(text: string, prereq: GuideJumpPrereq): boolean {
  const normalized = text.replace(/\s/g, '').toLowerCase();
  if (normalized.length < 1) return false;
  return prereq.acceptKeywords.some((kw) => normalized.includes(kw.replace(/\s/g, '').toLowerCase()));
}

/** 从语音/文字解析想从哪一步开始（0-based），解析失败返回 null */
export function parseGuideStartStepIndex(text: string): number | null {
  const t = text.replace(/\s/g, '');
  if (/都不|全不懂|没懂|不太懂|从头|过一遍|全流程|重新讲|第一步|第1步|第1[^0-9]|读题|题意|已知|条件/.test(t)) {
    return 0;
  }
  if (/第[二2]步|单面|可刷|减窗|墙.*面积|窗.*面积|算面积|一面墙|45\.?6|S刷/.test(t)) return 1;
  if (/第[三3]步|40面|四十面|涂料|1824|729\.?6|0\.4|总量|千克/.test(t)) return 2;
  if (/第[四4]步|费用|7296|总价|乘10|多少钱|几元/.test(t)) return 3;
  const m = t.match(/第([1-4])步/);
  if (m) return parseInt(m[1], 10) - 1;
  if (/不懂|不明白|不清楚|卡住|卡了/.test(t)) return 0;
  return null;
}

export function parseGenericGuideStartStepIndex(text: string): number | null {
  const t = text.replace(/\s/g, '');
  if (/从头|第一步|第1步|重新讲|都不|没懂|卡住/.test(t)) return 0;
  if (/第([1-4])步/.test(t)) {
    const m = t.match(/第([1-4])步/);
    if (m) return parseInt(m[1], 10) - 1;
  }
  if (/读题|审题|题意|题干/.test(t)) return 0;
  if (/方法|线索|定位|思路|语境|依据/.test(t)) return 1;
  if (/答案|作答|列式|推理|为什么/.test(t)) return 2;
  if (/复查|检查|验证|结果|通顺|完整/.test(t)) return 3;
  return null;
}

export function getTutorScriptPack(question?: AISolveQuestion | null): TutorScriptPack {
  if (!question) {
    return {
      scriptKey: 'paint-wall',
      meta: PAINT_WALL_TUTOR_META,
      quickSteps: PAINT_WALL_QUICK_STEPS,
      guideSteps: PAINT_WALL_GUIDE_STEPS,
    };
  }

  const subject = question.subject ?? '';
  const text = question.text ?? '';
  const isPaintWall = question.id === 'q27' || /涂料|墙|窗户|每平方米|40面/.test(text);
  if (isPaintWall) {
    return {
      scriptKey: 'paint-wall',
      meta: PAINT_WALL_TUTOR_META,
      quickSteps: PAINT_WALL_QUICK_STEPS,
      guideSteps: PAINT_WALL_GUIDE_STEPS,
    };
  }

  if (/英语/.test(subject) || /birthday|填空|选项|grade|class/i.test(text)) {
    return {
      scriptKey: 'english-generic',
      meta: ENGLISH_TUTOR_META,
      quickSteps: ENGLISH_QUICK_STEPS,
      guideSteps: ENGLISH_GUIDE_STEPS,
    };
  }

  if (/语文/.test(subject) || /阅读|句子|词语|改写|文中/.test(text)) {
    return {
      scriptKey: 'chinese-generic',
      meta: CHINESE_TUTOR_META,
      quickSteps: CHINESE_QUICK_STEPS,
      guideSteps: CHINESE_GUIDE_STEPS,
    };
  }

  return {
    scriptKey: 'generic',
    meta: {
      typeLabel: `${subject || '通用'}题`,
      typeTags: ['审题', '定位', '作答', '复核'],
      approachSummary: '明确题意 → 提炼关键条件 → 给出答案 → 检查结果',
      reminder: '先说思路，再给答案。',
    },
    quickSteps: ENGLISH_QUICK_STEPS,
    guideSteps: ENGLISH_GUIDE_STEPS,
  };
}

export type TutorPhase = 'quick' | 'quick_done' | 'guide' | 'guide_done';

export interface StepBoardView {
  id: string;
  label: string;
  title: string;
  skeleton: string;
  titleRevealed: number;
  /** 标题书写动画已结束，锁定展示完整标题 */
  titleComplete: boolean;
  skeletonRevealed: number;
  skeletonComplete: boolean;
  fills: {
    id: string;
    text: string;
    style?: BoardLineStyle;
    revealed: number;
    complete: boolean;
    justFilled?: boolean;
  }[];
  status: 'pending' | 'active' | 'done';
  /** 刚填完的算式行高亮 */
  justFilled?: boolean;
}
