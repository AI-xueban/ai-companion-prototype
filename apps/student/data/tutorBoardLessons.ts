import type { AISolveQuestion } from './aiSolveMockData';

export interface BoardStep {
  title: string;
  prompt: string;
  hints: string[];
  lines: string[];
  expected?: number;
  strategy?: RegExp;
  feedback?: string;
  retry?: string;
}
export interface BoardLesson { steps: BoardStep[]; summary: string; scripted: boolean }

const calculate = (title: string, prompt: string, expected: number, lines: string[], hints: string[]): BoardStep => ({ title, prompt, expected, lines, hints });
const strategy = (prompt: string, match: RegExp, lines: string[], hints: string[]): BoardStep => ({ title: '先想一想', prompt, strategy: match, lines, hints });

const appleStrategy: BoardStep = {
  ...strategy('要求还剩几个苹果，你准备先求什么？', /每袋|一袋|一包|48\s*(?:÷|\/|除以)\s*6/, [], ['先想想题目给了总数和袋数，可以用它们求什么。']),
  feedback: '可以，知道每袋有几个，就能把袋数换成苹果个数。',
  retry: '我还没听清。你想先求哪个数量？',
};
const perBag = calculate('每袋的苹果数', '48 个平均装成 6 袋，每袋有几个？', 8,
  ['每袋：48 ÷ 6 = 8（个）'], ['用总数除以平均分成的袋数。']);
const apples: BoardLesson = {
  scripted: true,
  summary: '先求出每袋有几个，再把袋数换成苹果个数。用总数减去卖出的个数，或用剩下的袋数乘每袋个数，都能求出剩下的苹果。',
  steps: [
    appleStrategy,
    perBag,
    calculate('卖出的苹果数', '卖出了 2 袋，一共卖出几个苹果？', 16, ['卖出：8 × 2 = 16（个）'], ['每袋 8 个，卖出了两袋。']),
    calculate('剩下的苹果数', '从 48 个里面去掉卖出的 16 个，还剩几个？', 32, ['剩下：48 − 16 = 32（个）'], ['用总数减去卖出的个数。']),
  ],
};
const applesByRemainingBags: BoardLesson = {
  ...apples,
  steps: [
    appleStrategy,
    calculate('剩下的袋数', '原来有 6 袋，卖出 2 袋，还剩几袋？', 4,
      ['剩下的袋数：6 − 2 = 4（袋）'], ['用原来的袋数减去卖出的袋数。']),
    perBag,
    calculate('剩下的苹果数', '剩下 4 袋，每袋有 8 个，一共还剩几个？', 32, ['剩下：4 × 8 = 32（个）'], ['用剩下的袋数乘每袋的苹果数。']),
  ],
};
const umbrella: BoardLesson = {
  scripted: true,
  summary: '先从原文找到动作和结果，再用这些细节说明小林怎样对待同学。',
  steps: [
    {
      ...strategy('哪两处描写能帮你判断小林是怎样的人？', /(?:伞.*(?:肩|湿)|(?:肩|湿).*伞)/,
        ['动作：把伞往同学那边挪', '结果：自己的半边肩膀却湿透了'],
        ['找找小林做了什么，以及他自己后来怎么样了。']),
      feedback: '你找到了两个细节。把小林做的事和他自己遇到的结果放在一起看。',
      retry: '再读一遍这句话，找找小林做了什么，后来发生了什么。',
    },
    {
      ...strategy('把这两个细节连起来，能看出小林怎样对待同学？', /体贴|关心|关爱|照顾|为.{0,5}着想|舍己为人|乐于助人/,
        ['人物判断：小林体贴同学，会为同学着想。'],
        ['他宁愿自己的肩膀被淋湿，也把伞往同学那边挪。想想这体现了什么。']),
      feedback: '对，他在照顾同学。回答时把这个判断和挪伞、肩膀淋湿的细节连起来。',
      retry: '试着说具体一点：他宁愿自己的肩膀淋湿，也把伞往同学那边挪，说明他怎样对待同学？',
    },
  ],
};

const paint: BoardLesson = {
  scripted: true,
  steps: [
    strategy('看图想一想，怎样求一面墙实际要刷的面积？', /面积|墙.*窗|窗.*墙|^(?:是|那块|黑色的)?窗[户子]?(?:不用刷|不刷)?[。！!]*$/, ['先求实际粉刷面积，再求涂料用量，最后求费用。'], ['先看图里标着2米和1.2米的那一块。', '墙上的窗户需要粉刷吗？先想实际粉刷面积。', '可以从“一面墙面积 − 窗户面积”开始。']),
    calculate('实际粉刷面积', '一面墙除去窗户后，需要粉刷多少平方米？', 45.6, ['墙面：8 × 6 = 48（平方米）', '窗户：2 × 1.2 = 2.4（平方米）', '一面墙实际粉刷：48 − 2.4 = 45.6（平方米）'], ['先分别算出整面墙和窗户的面积。', '墙长8米、高6米；窗户长2米、高1.2米。', '试着计算 8 × 6 − 2 × 1.2。']),
    calculate('涂料用量', '40面这样的墙，一共需要多少千克涂料？', 729.6, ['40面墙：45.6 × 40 = 1824（平方米）', '涂料：1824 × 0.4 = 729.6（千克）'], ['先求40面墙的实际粉刷面积。', '每平方米用0.4千克涂料，用总面积乘每平方米用量。', '试着计算 45.6 × 40 × 0.4。']),
    calculate('粉刷费用', '每千克涂料10元，总费用是多少？', 7296, ['费用：729.6 × 10 = 7296（元）', '答：共需7296元。'], ['总价 = 用量 × 单价。', '已求出涂料用量729.6千克。', '试着计算 729.6 × 10。']),
  ],
  summary: '先扣掉不粉刷的窗户，再用实际面积求涂料用量和费用。留意平方米、千克、元的对应关系。',
};

const garden: Record<string, BoardLesson> = {
  fence: { scripted: true, summary: '围栏长度等于长方形周长减去入口宽度。', steps: [
    strategy('围栏要围一圈，入口处需要怎么处理？', /减|扣|不.*围|不.*安装|周长/, ['围栏长度 = 花园周长 − 入口宽度。'], ['先看围栏围在哪里。', '入口处不安装围栏。', '可以先求周长，再减去4米。']),
    calculate('围栏长度', '需要安装多少米围栏？', 80, ['周长：(24 + 18) × 2 = 84（米）', '围栏：84 − 4 = 80（米）'], ['长方形周长 =（长 + 宽）× 2。', '入口宽4米，需要从周长中扣除。', '试着计算 (24 + 18) × 2 − 4。']),
  ] },
  area: { scripted: true, summary: '种植面积 = 花园面积 − 小路面积。小路南北贯通，长18米；入口只影响围栏，不另外扣面积。', steps: [
    strategy('种植区域的面积，可以用哪两部分面积得到？', /减|扣|花园.*小路|总.*路|整.*路/, ['种植面积 = 花园面积 − 小路面积。'], ['把整个花园分成种植区和小路。', '小路不能种植，要从总面积中减掉。', '先列出“花园面积 − 小路面积”。']),
    calculate('花园面积', '整个长方形花园的面积是多少？', 432, ['花园：24 × 18 = 432（平方米）'], ['长方形面积 = 长 × 宽。', '图1中，花园长24米、宽18米。', '试着计算 24 × 18。']),
    calculate('小路面积', '小路南北贯通，它的面积是多少？', 36, ['小路：18 × 2 = 36（平方米）'], ['看小路连接花园的哪两条边。', '小路长18米、宽2米，不是24米长。', '试着计算 18 × 2。']),
    calculate('种植面积', '除去小路，能种植的面积是多少？', 396, ['种植区：432 − 36 = 396（平方米）', '答：种植区域的面积是396平方米。'], ['从整个花园面积中扣掉小路面积。', '入口不额外占用种植面积。', '试着计算 432 − 36。']),
  ] },
  cost: { scripted: true, summary: '分别用围栏长度、小路面积乘对应单价，再相加。不同计价单位不能混用。', steps: [
    strategy('总预算要把哪两部分费用合起来？', /围栏.*小路|小路.*围栏|两.*费用|围栏.*铺|铺.*围栏/, ['总费用 = 围栏费用 + 小路铺装费用。'], ['题目说只计算两项施工费用。', '图1给尺寸，图2给单价。', '分别求围栏费用和小路铺装费用，再相加。']),
    calculate('围栏费用', '结合图1和图2，围栏费用是多少元？', 1440, ['围栏：(24 + 18) × 2 − 4 = 80（米）', '围栏费用：80 × 18 = 1440（元）'], ['先算周长减入口，再乘围栏每米的单价。', '围栏80米，单价18元/米。', '试着计算 80 × 18。']),
    calculate('小路费用', '小路铺装费用是多少元？', 1260, ['小路：18 × 2 = 36（平方米）', '小路费用：36 × 35 = 1260（元）'], ['小路按面积计价。', '小路36平方米，单价35元/平方米。', '试着计算 36 × 35。']),
    calculate('总费用', '两项施工费合起来是多少元？', 2700, ['总费用：1440 + 1260 = 2700（元）', '答：一共需要2700元。'], ['把两项费用相加。', '围栏1440元，小路1260元。', '试着计算 1440 + 1260。']),
  ] },
};

export function getBoardLesson(question: AISolveQuestion, partId: string, perWall = false, remainingBagsFirst = false): BoardLesson {
  if (question.id === 'tutor-apples') return remainingBagsFirst ? applesByRemainingBags : apples;
  if (question.id === 'tutor-umbrella') return umbrella;
  if (question.id === 'q27' && perWall) return { ...paint, steps: [
    { ...paint.steps[0], lines: ['先求一面墙的粉刷费用，再乘40。'] }, paint.steps[1],
    calculate('一面墙的涂料', '一面墙需要多少千克涂料？', 18.24, ['一面墙涂料：45.6 × 0.4 = 18.24（千克）'], ['面积乘每平方米用量。', '一面墙45.6平方米，每平方米用0.4千克。', '试着计算45.6 × 0.4。']),
    calculate('一面墙的费用', '一面墙的涂料费用是多少元？', 182.4, ['一面墙费用：18.24 × 10 = 182.4（元）'], ['用量乘单价。', '每千克10元。', '试着计算18.24 × 10。']),
    calculate('40面墙的费用', '最后，40面这样的墙共需要多少元？', 7296, ['40面墙费用：182.4 × 40 = 7296（元）', '答：共需7296元。'], ['一面墙费用乘墙的数量。', '每面182.4元，共40面。', '试着计算182.4 × 40。']),
  ] };
  if (question.id === 'q27') return paint;
  if (question.id === 'tutor-garden' && garden[partId]) return garden[partId];
  return {
    scripted: false,
    summary: '回到原题检查：回答是否符合题意，是否写清依据。',
    steps: [{ title: '整理思路', prompt: '先说说你读懂了什么，以及卡在哪一步。', hints: ['先找题目要你回答的问题。', '把支持你想法的原文、选项或数量指出来。', '可以先写“我知道……，要解决……”。'], lines: [] }],
  };
}

/** 只检查演示题的确定数值，不用包含某个数字就判对；不执行输入代码。 */
export function matchesBoardStep(step: BoardStep, input: string): boolean {
  if (/不知道|不懂|不会|不确定|看不懂/.test(input)) return false;
  if (step.strategy) return step.strategy.test(input);
  if (step.expected === undefined) return false;
  const normalized = input.replace(/[０-９]/g, c => String(c.charCodeAt(0) - 0xff10)).replace(/[，,]/g, '');
  if (/[+×*÷/]/.test(normalized) && !/[=＝]/.test(normalized)) return false;
  const numbers = normalized.match(/-?\d+(?:\.\d+)?/g);
  // Require an explicit result. Calculations without a result receive guidance, not a false grade.
  if (!numbers?.length) return false;
  return Math.abs(Number(numbers[numbers.length - 1]) - step.expected) < 0.000001 && !/[?？]/.test(input);
}
