import { UniverseData, KnowledgeNode, KnowledgeLink } from '../knowledgeGraphTypes';

// 状态分配池
const statuses = ['mastered', 'weak', 'reviewing', 'exploring', 'unknown'];

const createNode = (id: string, label: string, group: number, val: number, statusOverride?: 'mastered' | 'weak' | 'not_mastered' | 'unknown' | 'exploring' | 'reviewing'): KnowledgeNode => {
  // Mock logic: Use override if provided, otherwise pseudo-randomly assign status based on ID hash
  let status = statusOverride;
  if (!status) {
      // Simple hash to make it deterministic but look random
      let hash = 0;
      for (let i = 0; i < id.length; i++) {
          hash = id.charCodeAt(i) + ((hash << 5) - hash);
      }
      status = statuses[Math.abs(hash) % 5] as any;
  }

  // Generate stats based on the determined status
  let stats;
  if (status === 'unknown') {
    stats = undefined;
  } else if (status === 'exploring') {
    stats = {
      totalQuestions: 3,
      correctCount: 1,
      wrongCount: 2,
      lastPractice: '刚刚',
      masteryScore: 50,
      // 均衡分布，突出“探索中”尚无明显掌握态势
      masteryDistribution: { mastered: 1, review: 1, weak: 1 }
    };
  } else if (status === 'mastered') {
    stats = {
      totalQuestions: 50,
      correctCount: 48,
      wrongCount: 2,
      lastPractice: '1天前',
      masteryScore: 95,
      // 绿占比极大，匹配 mastered 绿色节点
      masteryDistribution: { mastered: 45, review: 3, weak: 0 }
    };
  } else if (status === 'reviewing') {
    stats = {
      totalQuestions: 45,
      correctCount: 33,
      wrongCount: 12,
      lastPractice: '3天前',
      masteryScore: 75,
      // 黄占比最大，少量红
      masteryDistribution: { mastered: 8, review: 35, weak: 2 }
    };
  } else if (status === 'weak') {
    stats = {
      totalQuestions: 36,
      correctCount: 8,
      wrongCount: 28,
      lastPractice: '10分钟前',
      masteryScore: 40,
      // 红占比最大，少量绿黄
      masteryDistribution: { mastered: 2, review: 4, weak: 30 }
    };
  } else {
     // default fallback
     stats = {
      totalQuestions: 5,
      correctCount: 2,
      wrongCount: 3,
      lastPractice: '5天前',
      masteryScore: 50,
      masteryDistribution: { mastered: 1, review: 1, weak: 3 }
    };
  }

  return {
    id,
    label,
    subject: '数学',
    status,
    group,
    val,
    stats
  };
};

const createLink = (source: string, target: string): KnowledgeLink => ({
  source,
  target,
  value: 1
});

// 构建节点列表
const nodes: KnowledgeNode[] = [
  // L0 Core
  createNode('math-root', '数学', 0, 50, 'mastered'),

  // --- Demo showcase nodes for UI states ---
  createNode('demo-mastered', '【示例】已掌握', 1, 12, 'mastered'),
  createNode('demo-review', '【示例】需复习', 1, 12, 'reviewing'),
  createNode('demo-weak', '【示例】未掌握', 1, 12, 'weak'),
  createNode('demo-explore', '【示例】探索中', 1, 12, 'exploring'),
  createNode('demo-unknown', '【示例】未知', 1, 12, 'unknown'),

  // --- L1: 数与式 ---
  createNode('math-num', '数与式', 1, 30, 'mastered'),
    createNode('math-num-1', '有理数', 2, 10, 'mastered'),
    createNode('math-num-2', '有理数的运算', 2, 10, 'exploring'),
    createNode('math-num-3', '实数', 2, 10, 'unknown'),
    createNode('math-num-4', '代数式', 2, 10, 'reviewing'),
    createNode('math-num-5', '因式分解', 2, 10, 'weak'),
    createNode('math-num-6', '分式', 2, 10, 'not_mastered'),
    createNode('math-num-7', '二次根式', 2, 10, 'unknown'),

  // --- L1: 方程与不等式 ---
  createNode('math-eq', '方程与不等式', 1, 30, 'weak'),
    createNode('math-eq-1', '一元一次方程', 2, 10),
    createNode('math-eq-2', '二元一次方程组', 2, 10),
    createNode('math-eq-3', '一元二次方程', 2, 10),
    createNode('math-eq-4', '分式方程', 2, 10),
      // L3 under 分式方程
      createNode('math-eq-4-1', '二项方程', 3, 5),
      createNode('math-eq-4-2', '无理方程', 3, 5),
      createNode('math-eq-4-3', '二元二次方程组及其解法', 3, 5),
    createNode('math-eq-5', '不等式与不等式组', 2, 10),

  // --- L1: 函数 ---
  createNode('math-func', '函数', 1, 30, 'not_mastered'),
    createNode('math-func-1', '平面直角坐标系', 2, 10),
    createNode('math-func-2', '坐标方法的简单应用', 2, 10),
    createNode('math-func-3', '函数基础知识', 2, 10),
    createNode('math-func-4', '一次函数', 2, 10),
    createNode('math-func-5', '二次函数', 2, 10),
    createNode('math-func-6', '反比例函数', 2, 10),

  // --- L1: 图形的性质 ---
  createNode('math-geo-prop', '图形的性质', 1, 30, 'weak'),
    createNode('math-geo-prop-1', '几何图形初步', 2, 10),
    createNode('math-geo-prop-2', '相交线与平行线', 2, 10),
    createNode('math-geo-prop-3', '三角形', 2, 10),
    createNode('math-geo-prop-4', '四边形', 2, 10),
    createNode('math-geo-prop-5', '圆', 2, 10),
    createNode('math-geo-prop-6', '命题与证明', 2, 10),
    createNode('math-geo-prop-7', '限定工具作图', 2, 10),

  // --- L1: 图形的变化 ---
  createNode('math-geo-trans', '图形的变化', 1, 30, 'mastered'),
    createNode('math-geo-trans-1', '平移', 2, 10),
    createNode('math-geo-trans-2', '轴对称', 2, 10),
    createNode('math-geo-trans-3', '旋转', 2, 10),
    createNode('math-geo-trans-4', '中心对称', 2, 10),
    createNode('math-geo-trans-5', '图案设计', 2, 10),
    createNode('math-geo-trans-6', '图形的相似', 2, 10),
    createNode('math-geo-trans-7', '锐角三角函数', 2, 10),
    createNode('math-geo-trans-8', '投影与视图', 2, 10),

  // --- L1: 统计与概率 ---
  createNode('math-stat', '统计与概率', 1, 30, 'mastered'),
    createNode('math-stat-1', '数据的收集与整理', 2, 10),
    createNode('math-stat-2', '数据分析', 2, 10),
    createNode('math-stat-3', '概率', 2, 10),

  // --- L1: 观察、猜想与证明 ---
  createNode('math-logic', '观察、猜想与证明', 1, 30, 'unknown'),
    createNode('math-logic-1', '观察与实验', 2, 10),
    createNode('math-logic-2', '归纳与类比', 2, 10),
    createNode('math-logic-3', '猜想与证明', 2, 10),
    createNode('math-logic-4', '实践与应用', 2, 10),

  // --- L1: 向量的运算 ---
  createNode('math-vec', '向量的运算', 1, 30, 'unknown'),
    createNode('math-vec-1', '向量的相关概念', 2, 10),
    createNode('math-vec-2', '实数与向量相乘', 2, 10),
    createNode('math-vec-3', '向量的线性运算', 2, 10),

  // --- L1: 五四制小学衔接 ---
  createNode('math-bridge', '五四制小学衔接', 1, 30, 'mastered'),
    createNode('math-bridge-1', '数的认识', 2, 10),
    createNode('math-bridge-2', '数的运算', 2, 10),
    createNode('math-bridge-3', '比和比例', 2, 10),
    createNode('math-bridge-4', '常见的数学问题', 2, 10),
    createNode('math-bridge-5', '图形与几何', 2, 10),
    createNode('math-bridge-6', '统计与概率', 2, 10),
    createNode('math-bridge-7', '单位的认识和换算', 2, 10),
    createNode('math-bridge-8', '探索规律', 2, 10),

  // --- L1: 数学竞赛 ---
  createNode('math-comp', '数学竞赛', 1, 30, 'unknown'),
    createNode('math-comp-1', '实数', 2, 10),
    createNode('math-comp-2', '代数式', 2, 10),
    createNode('math-comp-3', '恒等变换', 2, 10),
    createNode('math-comp-4', '方程', 2, 10),
    createNode('math-comp-5', '不等式', 2, 10),
    createNode('math-comp-6', '函数', 2, 10),
    createNode('math-comp-7', '几何', 2, 10),
    createNode('math-comp-8', '逻辑推理', 2, 10),
];

const links: KnowledgeLink[] = [
  // Links from Root to L1
  createLink('math-root', 'math-num'),
  createLink('math-root', 'math-eq'),
  createLink('math-root', 'math-func'),
  createLink('math-root', 'math-geo-prop'),
  createLink('math-root', 'math-geo-trans'),
  createLink('math-root', 'math-stat'),
  createLink('math-root', 'math-logic'),
  createLink('math-root', 'math-vec'),
  createLink('math-root', 'math-bridge'),
  createLink('math-root', 'math-comp'),
  // Demo links
  createLink('math-root', 'demo-mastered'),
  createLink('math-root', 'demo-review'),
  createLink('math-root', 'demo-weak'),
  createLink('math-root', 'demo-explore'),
  createLink('math-root', 'demo-unknown'),

  // Links from L1 to L2 (数与式)
  createLink('math-num', 'math-num-1'),
  createLink('math-num', 'math-num-2'),
  createLink('math-num', 'math-num-3'),
  createLink('math-num', 'math-num-4'),
  createLink('math-num', 'math-num-5'),
  createLink('math-num', 'math-num-6'),
  createLink('math-num', 'math-num-7'),

  // Links from L1 to L2 (方程与不等式)
  createLink('math-eq', 'math-eq-1'),
  createLink('math-eq', 'math-eq-2'),
  createLink('math-eq', 'math-eq-3'),
  createLink('math-eq', 'math-eq-4'),
  createLink('math-eq', 'math-eq-5'),
    // Links from L2 to L3 (分式方程)
    createLink('math-eq-4', 'math-eq-4-1'),
    createLink('math-eq-4', 'math-eq-4-2'),
    createLink('math-eq-4', 'math-eq-4-3'),

  // Links from L1 to L2 (函数)
  createLink('math-func', 'math-func-1'),
  createLink('math-func', 'math-func-2'),
  createLink('math-func', 'math-func-3'),
  createLink('math-func', 'math-func-4'),
  createLink('math-func', 'math-func-5'),
  createLink('math-func', 'math-func-6'),

  // Links from L1 to L2 (图形的性质)
  createLink('math-geo-prop', 'math-geo-prop-1'),
  createLink('math-geo-prop', 'math-geo-prop-2'),
  createLink('math-geo-prop', 'math-geo-prop-3'),
  createLink('math-geo-prop', 'math-geo-prop-4'),
  createLink('math-geo-prop', 'math-geo-prop-5'),
  createLink('math-geo-prop', 'math-geo-prop-6'),
  createLink('math-geo-prop', 'math-geo-prop-7'),

  // Links from L1 to L2 (图形的变化)
  createLink('math-geo-trans', 'math-geo-trans-1'),
  createLink('math-geo-trans', 'math-geo-trans-2'),
  createLink('math-geo-trans', 'math-geo-trans-3'),
  createLink('math-geo-trans', 'math-geo-trans-4'),
  createLink('math-geo-trans', 'math-geo-trans-5'),
  createLink('math-geo-trans', 'math-geo-trans-6'),
  createLink('math-geo-trans', 'math-geo-trans-7'),
  createLink('math-geo-trans', 'math-geo-trans-8'),

  // Links from L1 to L2 (统计与概率)
  createLink('math-stat', 'math-stat-1'),
  createLink('math-stat', 'math-stat-2'),
  createLink('math-stat', 'math-stat-3'),

  // Links from L1 to L2 (观察、猜想与证明)
  createLink('math-logic', 'math-logic-1'),
  createLink('math-logic', 'math-logic-2'),
  createLink('math-logic', 'math-logic-3'),
  createLink('math-logic', 'math-logic-4'),

  // Links from L1 to L2 (向量的运算)
  createLink('math-vec', 'math-vec-1'),
  createLink('math-vec', 'math-vec-2'),
  createLink('math-vec', 'math-vec-3'),

  // Links from L1 to L2 (五四制小学衔接)
  createLink('math-bridge', 'math-bridge-1'),
  createLink('math-bridge', 'math-bridge-2'),
  createLink('math-bridge', 'math-bridge-3'),
  createLink('math-bridge', 'math-bridge-4'),
  createLink('math-bridge', 'math-bridge-5'),
  createLink('math-bridge', 'math-bridge-6'),
  createLink('math-bridge', 'math-bridge-7'),
  createLink('math-bridge', 'math-bridge-8'),

  // Links from L1 to L2 (数学竞赛)
  createLink('math-comp', 'math-comp-1'),
  createLink('math-comp', 'math-comp-2'),
  createLink('math-comp', 'math-comp-3'),
  createLink('math-comp', 'math-comp-4'),
  createLink('math-comp', 'math-comp-5'),
  createLink('math-comp', 'math-comp-6'),
  createLink('math-comp', 'math-comp-7'),
  createLink('math-comp', 'math-comp-8'),
];

export const mockUniverseData: UniverseData = {
  nodes,
  links
};
