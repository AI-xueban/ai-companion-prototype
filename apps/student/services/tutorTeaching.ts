import type { AISolveQuestion } from '../data/aiSolveMockData';
import { getBoardLesson } from '../data/tutorBoardLessons';

// Local teaching scenarios. Unknown questions are explicitly left ungraded.
export interface TeachingProgress { step: number; perWall: boolean; hints: number; windowHelp: boolean; finished: boolean; remainingBagsFirst?: boolean }
export const newTeachingProgress = (): TeachingProgress => ({ step: 0, perWall: false, hints: 0, windowHelp: false, finished: false });
export interface TeachingReply { progress: TeachingProgress; feedback: string; lines: string[]; hold: boolean; accepted?: boolean; restart?: boolean; answeredQuestion?: boolean }
export function teachingPrompt(q: AISolveQuestion, partId: string, p: TeachingProgress) {
  if (p.finished) return '还有哪里想再想一想？可以继续问我。';
  if (p.windowHelp) return '先看窗户：长2米、高1.2米，面积是多少平方米？';
  return getBoardLesson(q, partId, p.perWall, p.remainingBagsFirst).steps[p.step]?.prompt || '说说你的想法。';
}
export function teachingConditions(q: AISolveQuestion, partId: string): string[] {
  if (q.id === 'q27') return ['墙面：长8米，高6米；窗户：长2米，高1.2米', '共40面墙；每平方米用涂料0.4千克；每千克10元'];
  if (q.id === 'tutor-apples') return ['苹果总数：48 个', '平均装成 6 袋', '卖出 2 袋'];
  if (q.id === 'tutor-umbrella') return ['雨越下越大。', '小林把伞往同学那边挪，自己的半边肩膀却湿透了。'];
  return q.subQuestions?.find(p => p.id === partId)?.conditions || [];
}
export function recommendedQuestions(q: AISolveQuestion): string[] {
  if (q.id === 'tutor-apples') return ['为什么用 48 除以 6？', '可以先算剩下几袋吗？'];
  if (q.id === 'tutor-umbrella') return ['为什么要提到肩膀湿透？', '怎么把判断和原文连起来？'];
  return q.id === 'q27' ? ['为什么要先减去窗户面积？', '先算一面墙的费用，也可以吗？'] : ['这道题最容易漏掉哪个条件？', '为什么要用这个数量关系？'];
}

export function explainBoardLine(line: string): string {
  if (line.startsWith('墙面：8')) return '先用长乘高，求出整面墙的面积。注意这里还包括窗户。';
  if (line.startsWith('窗户：2')) return '窗户也是长方形，用它自己的长和高相乘。';
  if (line.startsWith('一面墙实际粉刷：')) return '从整面墙中扣掉不粉刷的窗户，剩下的才是实际粉刷面积。';
  if (line.startsWith('40面墙：')) return '每面墙的粉刷面积相同，用一面墙的面积乘墙的数量。';
  if (line.startsWith('涂料：') || line.startsWith('一面墙涂料：')) return '每平方米都需要零点四千克涂料，所以用粉刷面积乘每平方米用量。';
  if (line.startsWith('一面墙费用：') || line.startsWith('费用：')) return '已经知道涂料用量，再乘每千克的价格，就得到费用。';
  if (line.startsWith('40面墙费用：')) return '按你选择的方法，先得到一面墙的费用，最后乘四十就能算出全部费用。';
  if (line.startsWith('周长：')) return '围一圈要算四条边，先把长和宽相加，再乘二。';
  if (line.startsWith('围栏：')) return '入口不安装围栏，要从整个周长中扣去入口宽度。';
  if (line.startsWith('小路：')) return '小路南北贯通，长度对应花园的南北边，别把另一条边当作路长。';
  if (line.startsWith('种植区：')) return '从花园的总面积中扣除不能种植的小路面积。';
  if (line.startsWith('总费用：')) return '两项分别计价，先核对各自单位，再把费用相加。';
  if (line.startsWith('答：')) return '最后把结果放回原题，检查回答的数量和单位。';
  return line;
}

/** Small arithmetic parser: never executes student input. */
export function arithmetic(source: string): number | undefined {
  const s = source.replace(/\s/g, '').replace(/[×xX]/g, '*').replace(/÷/g, '/').replace(/[－−]/g, '-').replace(/（/g, '(').replace(/）/g, ')');
  if (!s || !/^[\d.+*/()\-]+$/.test(s) || s.length > 120) return undefined;
  const tokens = s.match(/\d+(?:\.\d+)?|[()+*/-]/g) || []; let i = 0;
  if (tokens.join('') !== s) return undefined;
  function atom(): number { const t = tokens[i++]; if (t === '-') return -atom(); if (t === '(') { const n = sum(); if (tokens[i++] !== ')') throw Error(); return n; } if (!t || !/^\d/.test(t)) throw Error(); return Number(t); }
  function product(): number { let n = atom(); while (tokens[i] === '*' || tokens[i] === '/') { const op = tokens[i++]; const v = atom(); n = op === '*' ? n * v : n / v; } return n; }
  function sum(): number { let n = product(); while (tokens[i] === '+' || tokens[i] === '-') { const op = tokens[i++]; const v = product(); n = op === '+' ? n + v : n - v; } return n; }
  try { const n = sum(); return i === tokens.length && Number.isFinite(n) ? n : undefined; } catch { return undefined; }
}
const same = (a: number | undefined, b: number) => a !== undefined && Math.abs(a - b) < .000001;

export function respondToStudent(q: AISolveQuestion, partId: string, state: TeachingProgress, raw: string): TeachingReply {
  const text = raw.trim().replace(/[０-９]/g, c => String(c.charCodeAt(0) - 0xff10)).replace(/＝/g, '=');
  const p = { ...state };
  const reply = (feedback: string, lines: string[] = [], hold = true): TeachingReply => ({ progress: p, feedback, lines, hold });
  const answerQuestion = (feedback: string): TeachingReply => ({ ...reply(feedback), answeredQuestion: true });
  if (q.id === 'q27' && /求什么|算什么|问什么|没看清题|没看懂题|题意|题目.*意思/.test(text)) {
    return answerQuestion('这道题问粉刷40面墙一共要花多少钱。每面墙上的窗户不用刷。');
  }
  if (/^(重新开始|从头再讲|重新讲这道题|重讲)[吧。！!]*$/.test(text)) return { progress: newTeachingProgress(), feedback: '好，从已知条件重新想起。', lines: [], hold: false, restart: true };
  if (/^(先到这里|结束讲题|不讲了|今天到这)[吧。！!]*$/.test(text)) return reply('好，先停在这里。板书保留着，想继续时告诉我。');
  if (/^(继续|继续吧|懂了|明白了|知道了|好|好的|嗯)[，,。！!]*(继续)?$/.test(text)) return reply(p.finished ? '可以回看板书，也可以继续问一个问题。' : '好，我们接着想这一问。', [], false);
  const lesson = getBoardLesson(q, partId, p.perWall, p.remainingBagsFirst);
  if (q.id === 'q27' && /为什么|为何|不也是|需要.*减|要.*扣/.test(text) && /窗|减|扣/.test(text)) return answerQuestion('窗户不涂刷。8×6算的是整面墙的面积，所以要扣掉窗户占的2×1.2平方米。');
  if (q.id === 'q27' && /为什么|什么意思|怎么理解/.test(text) && /0.4|用量|涂料/.test(text)) return answerQuestion('0.4千克表示每平方米要用的涂料。用粉刷面积乘0.4，就能算出要用多少千克涂料。');
  if (q.id === 'q27' && /先.*一面|一面.*先/.test(text)) {
    if (p.finished) return answerQuestion('可以。先算一面墙：45.6×0.4×10＝182.4元，再乘40得7296元。两条路径只是先后顺序不同，每个条件都只用一次。');
    if (p.step <= 1) { p.perWall = true; if (p.step === 0) p.step = 1; return { ...reply('可以，就按你的方法：先求一面墙的实际粉刷面积，再算一面墙费用，最后乘40。', ['解题思路：一面墙实际面积 → 一面墙涂料 → 一面墙费用 → 40面墙费用'], false), accepted: true }; }
    return answerQuestion('可以先算一面墙。我们已写下的数量也适用：一面墙45.6平方米，费用45.6×0.4×10，再乘40。你可以继续当前计算，或说“重新开始”按这个思路来。');
  }
  if (q.id === 'tutor-apples') {
    const remainingFirst = /剩.{0,5}(?:几袋|多少袋|\d+\s*袋|[一二三四五六七八九十]+袋|袋数)|6\s*[-−－]\s*2/.test(text);
    const isQuestion = /为什么|为何|怎么|能不能|可不可以|吗[。？?]?$|[？?]/.test(text);
    if (remainingFirst && p.finished) return answerQuestion('可以。剩下 6 减 2 等于 4 袋，每袋 8 个，所以还剩 32 个。');
    if (remainingFirst && p.step === 0 && !isQuestion) {
      p.remainingBagsFirst = true; p.step++; p.hints = 0;
      const hasCorrectCount = /(?:还剩|剩下|剩)\s*(?:4|四)\s*袋|6\s*[-−－]\s*2\s*=\s*4(?![\d.])/.test(text);
      if (hasCorrectCount) {
        p.step++;
        return { ...reply('对，还剩四袋。接下来想想每袋有几个。', getBoardLesson(q, partId, false, true).steps[1].lines, false), accepted: true };
      }
      return { ...reply('可以，我们先求剩下的袋数。', [], false), accepted: true };
    }
    if (remainingFirst && isQuestion) return answerQuestion('可以先求剩下几袋，再想怎样用每袋的数量把袋数换成苹果个数。');
    if (/(?:除以|÷|\/)\s*2|为什么.*(?:除|6|六)/.test(text)) {
      const explanation = '6 袋是全部苹果平均分成的袋数，2 袋是卖出的袋数。求每袋有几个，要用 48 除以 6。';
      return isQuestion ? answerQuestion(explanation) : reply('两袋是卖出的袋数。你想先算卖出的数量，还是先算每袋的数量？');
    }
  }
  if (q.id === 'tutor-umbrella' && /为什么|怎么/.test(text)) {
    if (/肩|湿/.test(text)) return answerQuestion('肩膀湿透是小林把伞挪给同学后的结果，和挪伞的动作一起说明他在为同学着想。');
    if (/判断|原文|连起来/.test(text)) return answerQuestion('先说你对小林的判断，再用他把伞挪给同学、自己肩膀湿透这两处细节说明。');
  }
  if (p.finished) {
    if (/单位/.test(text)) return answerQuestion('面积用平方米，用量用千克，费用用元。每次相乘前，把对应的“每平方米”或“每千克”核对一遍。');
    if (/漏|条件|数量关系|为什么/.test(text)) return answerQuestion(lesson.summary);
    return answerQuestion(`我们刚用到的方法是：${lesson.summary} 你想问其中哪个数量或哪一行算式？`);
  }
  const step = lesson.steps[p.step];
  if (!lesson.scripted) return reply('先把你依据的原文或条件说清楚。这道题当前还没有接入自动讲解，我会保留你的思路，不作对错判定。');
  if (/跳过|直接.*答案|示范|告诉我答案/.test(text)) {
    if (p.windowHelp) { p.windowHelp = false; return reply('窗户面积是2×1.2＝2.4平方米。再从整面墙的48平方米中扣掉它，你算一下。', ['窗户：2 × 1.2 = 2.4（平方米）']); }
    p.step++; p.hints = 0; p.finished = p.step >= lesson.steps.length;
    return { ...reply(`这一步我来示范：${step.lines.join('；')}。${p.finished ? '我们一起回顾方法。' : '读完后说“继续”，再接着想。'}`, step.lines), accepted: true };
  }
  if (/不懂|不会|不知道|不确定|提示|怎么做|没听清|再讲|再说/.test(text)) {
    const hint = step.hints[p.hints % step.hints.length]; p.hints++;
    return answerQuestion(`${hint} ${p.hints > step.hints.length ? '也可以告诉我具体卡住的数量。' : '想好后直接回答；需要继续讲解时告诉我。'}`);
  }
  if (/为什么|怎么|吗[？?]?$|[？?]/.test(text)) return answerQuestion(`这一问的依据是：${step.hints[0]}。你是对哪个条件或哪一步计算有疑问？`);
  if (step.strategy) {
    if (!step.strategy.test(text)) return reply(step.retry || '我还没理解你准备怎样求。可以说“先求什么，再求什么”，我们一起核对条件。');
    p.step++; p.hints = 0; p.finished = p.step >= lesson.steps.length;
    return { ...reply(step.feedback || '可以，我们沿着这个数量关系往下算。', step.lines, false), accepted: true };
  }
  const numberText = q.id === 'tutor-apples' && p.remainingBagsFirst && p.step === 1
    ? text.replace(/四(?=袋|[。！!\s]*$)/, '4')
    : text;
  const numeric = numberText.match(/[-\d.＋+×xX*÷/()（）－−\s=]+/g)?.map(s => s.trim()).filter(s => /\d/.test(s)) || [];
  if (numeric.length !== 1) return reply('把这一问的算式或结果单独说一次吧，我想先确认你算的是哪个数量。');
  const expression = numeric[0].replace(/＋/g, '+');
  const sides = expression.split('=');
  const values = sides.map(arithmetic);
  if (values.some(v => v === undefined) || (sides.length > 1 && values.some(v => !same(v, values[0]!)))) return reply('算式两边还没有对应上。先保留你的列式，检查乘法和减法的计算结果。');
  const value = values.at(-1);
  if (q.id === 'q27' && p.step === 1 && same(value, 48)) { p.windowHelp = true; return reply('48平方米是整面墙的面积，这一步算对了；还包含不用粉刷的窗户。先把窗户的面积算出来。', ['墙面：8 × 6 = 48（平方米）']); }
  if (p.windowHelp && same(value, 2.4)) { p.windowHelp = false; return reply('对，窗户是2.4平方米。现在从48平方米中减去它，实际粉刷多少？', ['窗户：2 × 1.2 = 2.4（平方米）'], false); }
  if (p.windowHelp && !same(value, 45.6)) return reply('先只算窗户这块长方形，用2米乘1.2米。注意乘积的小数点位置。');
  const expected = step.expected!;
  if (same(value, expected)) {
    if (sides.length === 1 && /[+×xX*÷/－−-]/.test(expression)) return reply('这个算式的数量关系正确。把它算完，告诉我结果是多少。');
    const wrongUnit = step.title.includes('面积') ? /千克|公斤|元/.test(text) : step.title.includes('涂料') ? /平方米|元/.test(text) : step.title.includes('费用') ? /平方米|千克|公斤/.test(text) : false;
    if (wrongUnit) return reply('数值对上了，再看单位：这一问求的是' + step.title + '。请把结果和对应单位一起说一次。');
    p.step++; p.hints = 0; p.windowHelp = false; p.finished = p.step >= lesson.steps.length;
    return { ...reply(`对，${step.title}是${expected}。${p.finished ? '把这条解题思路串起来看一遍。' : '接着用这个结果往下想。'}`, step.lines, false), accepted: true };
  }
  if (q.id === 'q27' && p.step === 2 && !p.perWall && same(value, 1824)) return reply('1824是40面墙的总面积，单位是平方米。求涂料还要乘每平方米0.4千克，再算一步。', ['40面墙：45.6 × 40 = 1824（平方米）']);
  return reply(`先检查${step.title}这一步：${step.hints[Math.min(p.hints++, step.hints.length - 1)]}`);
}
