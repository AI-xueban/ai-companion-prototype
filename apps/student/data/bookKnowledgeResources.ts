import type { UniversalQuizQuestion } from '../components/Quiz/UniversalQuizView';

type Item = [string, string[], number, string];
type Resource = { steps: string[]; questions: Item[] };
/** Explicit prototype samples; remaining points receive clearly labeled workflow simulations. */
const math: Record<string, Resource> = {
  '认识立体图形': { steps: ['立体图形有长、宽、高三个方向。', '长方体、正方体、圆柱、圆锥和球都是常见立体图形。', '观察物体的面、棱与顶点，辨认不同的立体图形。'], questions: [
    ['下列图形中，属于立体图形的是？', ['圆', '三角形', '球', '正方形'], 2, '球是立体图形，圆是平面图形。'],
    ['正方体共有多少个面？', ['4', '6', '8', '12'], 1, '正方体有6个面。'],
    ['下列物体的形状最接近圆柱的是？', ['足球', '易拉罐', '魔方', '三角尺'], 1, '易拉罐的形状接近圆柱。'],
  ] },
  '点、线、面、体': { steps: ['点没有大小，线有长度，面有面积，体占据空间。', '点动成线，线动成面，面动成体。', '面与面相交形成线，线与线相交形成点。'], questions: [
    ['两条相交直线的公共部分是？', ['面', '体', '线', '点'], 3, '两条相交直线的公共部分是点。'],
    ['点运动留下的轨迹通常形成？', ['线', '体', '球', '正方体'], 0, '点动成线。'],
    ['长方体的两个相邻面相交形成？', ['点', '线', '面', '体'], 1, '两个相邻面相交形成一条棱，是线。'],
  ] },
  '几何体的表面积': { steps: ['表面积是几何体所有外表面的面积之和。', '长方体表面积：2×（长×宽＋长×高＋宽×高）。', '正方体表面积：6×棱长²。'], questions: [
    ['棱长为2的正方体表面积是？', ['8', '12', '24', '48'], 2, '6×2²＝24。'],
    ['长、宽、高分别为3、2、1的长方体表面积是？', ['6', '11', '18', '22'], 3, '2×（3×2＋3×1＋2×1）＝22。'],
    ['棱长为1的正方体表面积是？', ['1', '4', '6', '8'], 2, '6×1²＝6。'],
  ] },
  '有理数': { steps: ['整数与分数统称为有理数。', '整数包括正整数、零和负整数。', '有限小数可以写成分数，因此也是有理数。'], questions: [
    ['下列说法正确的是？', ['0不是有理数', '整数和分数统称有理数', '负数都不是有理数', '只有正数是有理数'], 1, '整数与分数统称为有理数。'],
    ['下列数中属于整数的是？', ['0.5', '−2', '1/3', '2.4'], 1, '−2是负整数。'],
    ['0属于？', ['正数', '负数', '整数', '正分数'], 2, '0是整数，既不是正数也不是负数。'],
  ] },
  '数轴': { steps: ['数轴规定了原点、正方向和单位长度。', '数轴上右边的数大于左边的数。', '负数在原点左侧，正数在原点右侧。'], questions: [
    ['数轴的三要素是？', ['原点、正方向、单位长度', '端点、长度、宽度', '中心、半径、直径', '原点、面积、体积'], 0, '数轴三要素是原点、正方向和单位长度。'],
    ['数轴上−3位于0的哪一侧？', ['右侧', '左侧', '同一点', '无法判断'], 1, '负数在原点左侧。'],
    ['数轴上表示2的点向左移动5个单位后表示？', ['7', '−7', '−3', '3'], 2, '2−5＝−3。'],
  ] },
  '相反数': { steps: ['只有符号不同的两个数，互为相反数。', '互为相反数的两个数在数轴上到原点的距离相等。', '0的相反数仍然是0；a的相反数是−a。'], questions: [
    ['−5的相反数是？', ['−5', '5', '1/5', '0'], 1, '−5与5只有符号不同。'],
    ['0的相反数是？', ['1', '−1', '不存在', '0'], 3, '0的相反数是0。'],
    ['互为相反数的两个数之和为？', ['1', '−1', '0', '不确定'], 2, 'a＋（−a）＝0。'],
  ] },
  '绝对值': { steps: ['绝对值表示数轴上的点到原点的距离。', '正数的绝对值是它本身；负数的绝对值是它的相反数。', '0的绝对值是0，绝对值不小于0。'], questions: [
    ['|−4|等于？', ['−4', '4', '0', '8'], 1, '−4到原点的距离是4。'],
    ['|0|等于？', ['0', '1', '−1', '不存在'], 0, '原点到自身的距离是0。'],
    ['绝对值等于3的数有？', ['只有3', '只有−3', '3和−3', '0和3'], 2, '3和−3到原点的距离都是3。'],
  ] },
  '非负数的性质：绝对值': { steps: ['任意数的绝对值都大于或等于0。', '几个非负数的和为0，则每个数都必须为0。', '|a|＋|b|＝0时，a＝0且b＝0。'], questions: [
    ['|a|的取值一定满足？', ['小于0', '大于或等于0', '等于1', '小于−1'], 1, '绝对值是非负数。'],
    ['若|a|＋|b|＝0，则？', ['a＝b＝0', 'a＝1，b＝−1', 'a＝b＝1', '无法判断'], 0, '两个非负数之和为0，各自都为0。'],
    ['若|x−2|＝0，则x＝？', ['−2', '0', '1', '2'], 3, '绝对值为0，则x−2＝0。'],
  ] },
  '有理数大小比较': { steps: ['正数大于0，0大于负数。', '两个负数比较大小，绝对值大的反而小。', '也可以利用数轴判断：右边的数更大。'], questions: [
    ['下列关系正确的是？', ['−3＞−2', '−3＜−2', '−3＝−2', '0＜−2'], 1, '两个负数中绝对值大的反而小。'],
    ['下列数中最大的是？', ['−5', '0', '−1', '−3'], 1, '0大于所有负数。'],
    ['−1、2、0从小到大排列为？', ['2＜0＜−1', '0＜−1＜2', '−1＜0＜2', '−1＜2＜0'], 2, '负数小于0，0小于正数。'],
  ] },
};

export function getBookPointResource(subject: string, point: { id: string; name: string }) {
  const sample = subject === '数学' && Object.prototype.hasOwnProperty.call(math, point.name) ? math[point.name] : undefined;
  const simulated = !sample;
  const resource: Resource = sample ?? {
    steps: [
      `${subject} · ${point.name}：本节为模拟讲解，用于体验知识点学习流程。`,
      `这里将展示「${point.name}」的概念、方法与例题。当前内容为占位演示，不代表真实课程。`,
      `接下来进入「${point.name}」模拟练习，提交后查看结果，再返回原章节图谱。`,
    ],
    questions: [
      [`【流程模拟题】本节正在学习哪个知识点？`, [point.name, '设备使用设置', '消息通知', '账号绑定'], 0, `本节当前知识点是「${point.name}」。本题仅用于体验答题流程，不评估学科掌握情况。`],
      [`【流程模拟题】完成「${point.name}」讲解后，下一步是？`, ['退出账号', '进入对应练习', '更换设备', '修改教材版本'], 1, '本学习流程按讲解、练习、结果、返回图谱依次进行。'],
      [`【流程模拟题】「${point.name}」模拟练习提交后，可以在哪里继续选择知识点？`, ['设备设置', '消息中心', '原章节知识图谱', '账号管理'], 2, '查看结果后返回原章节图谱，可以继续选择知识点学习。模拟得分不代表真实知识掌握度。'],
    ],
  };
  const seed = Array.from(`${subject}:${point.id}`).reduce((sum, c) => sum + c.charCodeAt(0), 0);
  const questions: UniversalQuizQuestion[] = resource.questions.map(([stem, options, answer, explanation], index) => ({
    id: simulated ? `book-point-mock-${encodeURIComponent(subject)}-${point.id}-${index + 1}` : `book-point-${point.id}-${index + 1}`,
    type: 'single_choice', subject, difficulty: simulated ? 1 : 2,
    tags: simulated ? ['流程模拟题'] : ['样例练习'],
    knowledgePoints: [point.name], content: { stem, options: simulated ? [...options.slice((seed + index) % options.length), ...options.slice(0, (seed + index) % options.length)] : options },
    result: { correctAnswer: options[answer], explanation },
  }));
  return { steps: resource.steps, questions, simulated };
}

/** Chapter-level player preview for subjects without a point graph. */
export function getBookChapterVideoResource(subject: string, chapterName: string): ReturnType<typeof getBookPointResource> {
  return {
    steps: [
      subject + ' · ' + chapterName + '：当前为课文讲解流程演示，不代表真实课程。',
      '当前课文的讲解视频由基础、进阶、拓展三种训练共用，后续将替换为对应的正式课程。',
      '观看完成后返回精准学页面，可以自主选择当前课文的训练难度。',
    ],
    questions: [],
    simulated: true,
  };
}

export type KnowledgeVideo = { id: string; title: string; durationSec: number; steps: string[]; simulated: boolean };

/** Temporary source record; use each source title verbatim, without sync video categories. */
export function getBookTextVideos(subject: string, textId: string, textName: string): KnowledgeVideo[] {
  return [{
    id: `text-video-demo:${encodeURIComponent(subject)}:${textId}`,
    title: '知识点视频演示', durationSec: 20, simulated: true,
    steps: getBookChapterVideoResource(subject, textName).steps,
  }];
}
