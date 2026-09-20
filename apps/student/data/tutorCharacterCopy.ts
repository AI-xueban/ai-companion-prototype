import { TutorCharacterId } from './tutorCharacterThemes';

type CharCopy = Partial<Record<TutorCharacterId, string>> & { default: string };

function pick(copy: CharCopy, id: TutorCharacterId): string {
  return copy[id] ?? copy.default;
}

export const TUTOR_PHASE_HEADER = {
  quick: '快速解题',
  guide: '1对1解题',
} as const;

export const QUICK_STEP_SPEECH: Record<string, CharCopy> = {
  s1: {
    default: '先把已知条件理清楚：墙面、窗户尺寸，还有涂料用量和单价。',
    change: '月宫做题也要先读清题意，把这些数一个个圈出来。',
    holmes: '观察现场——墙、窗、涂料，每个数据都是线索。',
    nezha: '别急，先把图里的数全捞出来！',
    einstein: '像做实验一样，先列出所有已知量。',
  },
  s2: {
    default: '窗户不用刷，所以单面可刷面积 = 墙面积 − 窗面积。',
    change: '窗是镂空的，刷漆时要把它从墙面里「让」出来。',
    holmes: '排除法：可刷区域 = 整面墙 − 窗户占据的部分。',
    nezha: '窗户那块不刷，减掉它就对啦！',
    einstein: '建立模型：总面积减去不可刷区域。',
  },
  s3: {
    default: '40 面墙要放大，再换成涂料千克数，注意单位别跳步。',
    change: '单面算清楚后，乘 40 就得到全部可刷面积啦。',
    holmes: '由单面推广到 40 面，再乘以单位用量。',
    nezha: '一面搞定，40 面就是乘上去！',
    einstein: '比例放大：S总 = S单 × 40，再求质量。',
  },
  s4: {
    default: '最后一步：千克数 × 单价，就得到总费用。',
    change: '算到这儿，离答案只差一次乘法咯～',
    holmes: '证据链的最后一环：费用 = 涂料千克 × 单价。',
    nezha: '最后一脚油门，乘上 10 元/kg！',
    einstein: '完成计算：总费用 = 质量 × 单价。',
  },
};

export const QUICK_DONE_SPEECH: CharCopy = {
  default: '思路骨架已经梳好了！想自己填数的话，咱们一步步来。',
  change: '四轮梳理完成～接下来换你来填关键数。',
  holmes: '推理框架已就绪。建议进入逐步验证。',
  nezha: '骨架搭完！该你出手填数啦！',
  einstein: '理论框架建立完毕，进入演算阶段吧。',
};

export const DEEP_THINKING_STEPS = ['复述你的回答', '核对关键条件', '准备反馈'];

export function getQuickStepSpeech(stepId: string, charId: TutorCharacterId): string {
  return pick(QUICK_STEP_SPEECH[stepId] ?? { default: '' }, charId);
}

export function getQuickDoneSpeech(charId: TutorCharacterId): string {
  return pick(QUICK_DONE_SPEECH, charId);
}

export function getGuideQuestion(stepId: string, charId: TutorCharacterId, base: string): string {
  const prefix: Partial<Record<TutorCharacterId, string>> = {
    change: '慢慢来，',
    holmes: '请推理：',
    nezha: '来！',
    einstein: '思考一下：',
  };
  const p = prefix[charId];
  return p ? `${p}${base}` : base;
}

export function getPrereqPrompt(charId: TutorCharacterId, base: string): string {
  const wrap: CharCopy = {
    default: base,
    change: `嗯，${base}`,
    holmes: `先核对一下：${base}`,
    nezha: `等等，${base}`,
    einstein: `验证前置条件：${base}`,
  };
  return pick(wrap, charId);
}

export function getPrereqRetry(charId: TutorCharacterId, hint: string): string {
  const wrap: CharCopy = {
    default: `还不太确定？${hint}`,
    change: `没关系，${hint}`,
    holmes: `证据不足。${hint}`,
    nezha: `别急！${hint}`,
    einstein: `需要补一步。${hint}`,
  };
  return pick(wrap, charId);
}

export function getPrereqFallback(charId: TutorCharacterId, stepNumber: number): string {
  const wrap: CharCopy = {
    default: `那咱们从第 ${stepNumber} 步慢慢讲清楚。`,
    change: `好呀，从第 ${stepNumber} 步一起算～`,
    holmes: `回退至第 ${stepNumber} 步，重新建立推理链。`,
    nezha: `行！第 ${stepNumber} 步咱们再来一遍！`,
    einstein: `从第 ${stepNumber} 步重新推导更稳妥。`,
  };
  return pick(wrap, charId);
}

export function getGuideIntakeSpeech(charId: TutorCharacterId): string {
  const wrap: CharCopy = {
    default: '咱们 1 对 1 来讲。你在解题思路里卡在哪一步了？哪里不太懂，跟我说说～',
    change: '来啦～你卡在哪个环节啦？是读题、算面积，还是后面几步？跟我说说。',
    holmes: '请描述你当前的推理断点：哪个环节无法继续？',
    nezha: '别害羞！卡在哪一步？读题、算面积、还是算总量？',
    einstein: '请指出当前困难：是理解题意、列式计算，还是后续推导？',
  };
  return pick(wrap, charId);
}

export function getGuideIntakeUnclear(charId: TutorCharacterId): string {
  const wrap: CharCopy = {
    default: '没太听清～可以说「第几步」，或者说「读题」「算面积」「算总量」「算费用」。',
    change: '嗯？你可以说「第 2 步」或者「单面面积那块不懂」～',
    holmes: '请更具体：第几步，或哪个关键词（读题/面积/40面/费用）。',
    nezha: '再说清楚点！比如「第三步不会」！',
    einstein: '请指明步骤编号或环节名称，以便定位问题。',
  };
  return pick(wrap, charId);
}

/** @deprecated 使用 getGuideIntakeSpeech */
export function getGuideEntrySpeech(charId: TutorCharacterId): string {
  return getGuideIntakeSpeech(charId);
}

export function getWrongFeedback(
  wrongCount: number,
  hint: string,
  charId: TutorCharacterId,
): { speech: string; showHint: boolean } {
  if (wrongCount === 1) {
    const m: CharCopy = {
      default: '方向再想想～是不是漏看了图中的数？',
      holmes: '线索似乎不对，重新检查已知条件。',
      nezha: '不对不对，再瞅一眼图！',
    };
    return { speech: pick(m, charId), showHint: false };
  }
  if (wrongCount === 2) {
    return { speech: '接近了！再靠近一点点。', showHint: false };
  }
  return { speech: `试试这样：${hint}`, showHint: true };
}

const FREE_ASK_RULES: { pattern: RegExp; replies: CharCopy }[] = [
  {
    pattern: /窗|窗户/,
    replies: {
      default: '窗户不用粉刷，所以要从墙面积里减掉窗户面积。',
      holmes: '窗户是排除项——必须从墙面积中扣除。',
    },
  },
  {
    pattern: /40|面墙/,
    replies: {
      default: '40 面墙 = 单面可刷面积 × 40，别忘记这一步放大。',
      nezha: '对！40 面就是单面面积乘 40！',
    },
  },
  {
    pattern: /单位|千克|kg|元/,
    replies: {
      default: '单位链条：m² → kg → 元，三步不要跳。',
      einstein: '注意量纲：面积、质量、货币依次转换。',
    },
  },
  {
    pattern: /0\.4|涂料/,
    replies: {
      default: '0.4 kg/m² 是题目给的涂料用量，乘在面积上得到千克数。',
    },
  },
];

export function getFreeAskReply(text: string, charId: TutorCharacterId): string {
  for (const rule of FREE_ASK_RULES) {
    if (rule.pattern.test(text)) return pick(rule.replies, charId);
  }
  return pick(
    {
      default: '好问题！你可以对照板书上的步骤再看看，还有哪里不清楚？',
      change: '嗯嗯，你提到的点很重要，再对照骨架想一想～',
      holmes: '值得追问。建议回到第二步的减法逻辑。',
      nezha: '问得好！哪一步卡住了告诉我！',
      einstein: '有趣的提问。试着把已知量代进式子里验证。',
    },
    charId,
  );
}
