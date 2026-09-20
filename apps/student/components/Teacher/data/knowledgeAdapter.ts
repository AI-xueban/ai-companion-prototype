import { mockUniverseData } from '../../../data/mockKnowledgeGraph';
import { KnowledgeNode, KnowledgeNodeStatus, UniverseData } from '../../../knowledgeGraphTypes';
import { buildMathUniverseFromDir } from './knowledgeGenerator';

type TrafficStatus = 'red' | 'yellow' | 'green';

export interface TeacherKnowledgeNode {
  id: string;
  knowledgePoint: string;
  status: TrafficStatus;
  unmasteredCount: number;
  reviewing?: number;
  mastered?: number;
  totalStudents: number;
  coverage: number; // 未掌握人数占比 (0-100)
  riskScore: number;
  healthScore?: number;
  importance?: number;
  level: number; // 1=章, 2=节, 3=点
  parentId?: string;
  lastPractice?: string;
  lastActivityDays?: number;
}

export interface TeacherKnowledgeGroup {
  subject: string;
  summary: { red: number; yellow: number; green: number };
  nodes: TeacherKnowledgeNode[];
  allNodes: TeacherKnowledgeNode[];
}

const statusMap: Record<KnowledgeNodeStatus, TrafficStatus> = {
  weak: 'red',
  not_mastered: 'red',
  reviewing: 'yellow',
  exploring: 'yellow',
  unknown: 'yellow',
  mastered: 'green',
};

const importanceFromVal = (val?: number) => {
  if (!val) return 0.6;
  // 将 val (通常是 1-100) 映射到 0.3-1.0
  return Number(Math.min(1, Math.max(0.3, val / 100)).toFixed(2));
};

const getDaysFromLabel = (label?: string) => {
  if (!label) return 14; // 默认 14 天没练
  if (label.includes('刚刚') || label.includes('分钟')) return 0;
  if (label.includes('小时')) return 0;
  const dayMatch = label.match(/(\d+)\s*天/);
  if (dayMatch) return Number(dayMatch[1]);
  if (label.includes('昨天')) return 1;
  return 7;
};

const calcRiskScore = (unmastered: number, total: number, importance: number, days: number) => {
  if (total === 0) return 0;
  const ratio = unmastered / total;
  // 遗忘系数: 0-3天: 1.0, 7天: 1.2, 14天+: 1.5
  let decay = 1.0;
  if (days > 14) decay = 1.5;
  else if (days > 7) decay = 1.2;
  else if (days > 3) decay = 1.1;

  return Number((ratio * 100 * importance * decay).toFixed(2));
};

const toTeacherNode = (node: KnowledgeNode): TeacherKnowledgeNode => {
  const dist = node.stats?.masteryDistribution;
  const totalStudents = 32; // Mock 班级总人数
  const unmastered = dist?.weak ?? node.stats?.wrongCount ?? 0;
  const reviewing = dist?.review ?? 0;
  const mastered = dist?.mastered ?? node.stats?.correctCount ?? 0;
  const importance = importanceFromVal(node.val);
  const days = getDaysFromLabel(node.stats?.lastPractice);
  
  const riskScore = calcRiskScore(unmastered, totalStudents, importance, days);
  
  // 映射 level: group 0 -> L1, 1 -> L2, 2 -> L3, 3 -> L4
  const level = (node.group ?? 0) + 1;

  // 根据健康分映射状态
  let status: TrafficStatus = 'yellow';
  const health = node.stats?.masteryScore ?? 0;
  if (health >= 80) status = 'green';
  else if (health < 60) status = 'red';

  return {
    id: node.id,
    knowledgePoint: node.label,
    status,
    unmasteredCount: unmastered,
    reviewing,
    mastered,
    totalStudents,
    coverage: Number(((unmastered / totalStudents) * 100).toFixed(1)),
    riskScore: node.label.includes('示例') ? 0 : riskScore, // 示例节点风险分为0，或者直接过滤
    healthScore: health,
    importance,
    level,
    lastPractice: node.stats?.lastPractice,
    lastActivityDays: days,
  };
};

const summarize = (nodes: TeacherKnowledgeNode[]) =>
  nodes.reduce(
    (acc, n) => {
      acc[n.status] += 1;
      return acc;
    },
    { red: 0, yellow: 0, green: 0 } as { red: number; yellow: number; green: number },
  );

export const buildTeacherKnowledgeFromStudent = (data: UniverseData = buildMathUniverseFromDir()): TeacherKnowledgeGroup[] => {
  const grouped = new Map<string, TeacherKnowledgeNode[]>();
  (data.nodes || [])
    .filter(node => !node.label.includes('示例')) // 核心过滤：去掉示例节点
    .forEach((node) => {
      const subject = node.subject || '综合';
      const list = grouped.get(subject) || [];
      list.push(toTeacherNode(node));
      grouped.set(subject, list);
    });

  return Array.from(grouped.entries()).map(([subject, allNodes]) => {
    // 默认展示 L2 (章节) 层级的摘要
    const l2Nodes = allNodes.filter(n => n.level === 2);
    // 如果没有 L2，则回退到 L1 或 L3
    const summaryNodes = l2Nodes.length > 0 ? l2Nodes : allNodes.filter(n => n.level === 1);
    
    return {
      subject,
      summary: summarize(summaryNodes.length > 0 ? summaryNodes : allNodes),
      nodes: allNodes
        .filter(n => n.level >= 3) // 风险预警针对原子点或小节
        .sort((a, b) => b.riskScore - a.riskScore)
        .slice(0, 10), 
      allNodes,
    };
  });
};
