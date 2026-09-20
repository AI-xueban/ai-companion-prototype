import { mathKnowledgeDir } from '../data/math_knowledge_dir';
import { KnowledgeNode, KnowledgeLink, UniverseData } from '../knowledgeGraphTypes';
import { SUBJECT_CONFIGS } from '../services/subjectConfig';
import { SubjectType } from '../types';

// Define interface for the new data structure
interface RawNode {
  name: string;
  level: string;
  children?: RawNode[];
}

// === 解耦方案：手动定义旧数据的状态映射表 ===
// 我们不再 import mockKnowledgeGraph.ts，而是直接在这里定义我们需要保留的“老节点状态”
// 这样可以彻底避免模块依赖和加载报错的问题。
const LEGACY_NODE_STATES: Record<string, Partial<KnowledgeNode>> = {
  // L0 Core
  '数学': { status: 'mastered', val: 50 },
  // L1
  '数与式': { status: 'mastered', val: 30 },
  '方程与不等式': { status: 'weak', val: 30 },
  '函数': { status: 'not_mastered', val: 30 },
  '图形的性质': { status: 'weak', val: 30 },
  '图形的变化': { status: 'mastered', val: 30 },
  '统计与概率': { status: 'mastered', val: 30 },
  // L2 (部分示例)
  '有理数': { status: 'mastered', val: 10 },
  '一元一次方程': { status: 'mastered', val: 10 },
  '一元二次方程': { status: 'weak', val: 10 },
  '二次函数': { status: 'not_mastered', val: 10 },
  '全等三角形': { status: 'weak', val: 10 }, // 注意：新数据里可能叫“三角形”或“全等三角形”
  '三角形': { status: 'weak', val: 10 },
  '圆': { status: 'not_mastered', val: 10 },
  '概率': { status: 'mastered', val: 10 }
};

// 状态池：覆盖 PRD 定义的 5 种状态（已掌握/需复习/未掌握/探索中/待探索）
const STATUS_POOL = ['mastered', 'reviewing', 'weak', 'exploring', 'unknown'] as const;

// 稳定哈希：用节点 id 生成稳定的伪随机分布，避免 Math.random 带来的刷新抖动
const hashString = (input: string) => {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = input.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
};

/**
 * Generates a unique ID for a node based on its path
 */
const generateId = (name: string, parentId?: string) => {
  if (!parentId || parentId === 'root') return name;
  return `${parentId}-${name}`;
};

/**
 * Creates a merged node combining new structure with old data attributes
 */
const createMergedNode = (
  name: string, 
  parentId: string, 
  depth: number,
  subject: SubjectType,
  parentNodeStatus?: string // Pass parent status down
): KnowledgeNode => {
  // 1. Generate ID based on new structure
  const id = generateId(name, parentId);
  
  // 2. Try to find legacy state for this node (by name)
  const legacyState = LEGACY_NODE_STATES[name];

  // 3. Calculate base visual size based on depth
  // Increased base sizes for better touch targets
  const baseVal = Math.max(8, 60 - depth * 10); 

  // Build deterministic mock stats with mastery distribution + PRD 健康度
  const buildStats = (status: string | undefined, seed: string) => {
    const h = Math.abs(hashString(seed));
    const pick = (arr: string[]) => arr[h % arr.length];

    // Unknown/未学：返回空数据，供 UI 渲染灰圈
    if (!status || status === 'unknown') {
      return {
        totalQuestions: 0,
        correctCount: 0,
        wrongCount: 0,
        lastPractice: '未开始',
        masteryScore: 0,
        masteryDistribution: { mastered: 0, review: 0, weak: 0 },
        health: { score: 0, total: 0, mastered: 0, review: 0, weak: 0, status: 'unknown' as const }
      };
    }

    // Base buckets per status to bias colors
    let mastered = 0;
    let review = 0;
    let weak = 0;
    if (status === 'mastered') {
      mastered = 40 + (h % 12);     // 40-51
      review   = 3 + (h % 6);       // 3-8
      weak     = h % 2;             // 0-1
    } else if (status === 'reviewing') {
      mastered = 10 + (h % 8);      // 10-17
      review   = 25 + (h % 12);     // 25-36
      weak     = 2 + (h % 6);       // 2-7
    } else if (status === 'weak' || status === 'not_mastered') {
      mastered = 2 + (h % 6);       // 2-7
      review   = 4 + (h % 8);       // 4-11
      weak     = 20 + (h % 16);     // 20-35
    } else if (status === 'exploring') {
      mastered = 1 + (h % 3);       // 1-3
      review   = 1 + (h % 3);       // 1-3
      weak     = 1 + (h % 3);       // 1-3
    } else {
      mastered = 5 + (h % 6);
      review   = 5 + (h % 6);
      weak     = 5 + (h % 6);
    }

    const total = mastered + review + weak;
    const healthScore = total === 0 ? 0 : Math.round(((mastered * 100) + (review * 60)) / total);

    // PRD 状态阈值
    let derivedStatus: typeof STATUS_POOL[number] | 'weak' = 'unknown';
    if (total === 0) {
      derivedStatus = 'unknown';
    } else if (total < 2) {
      derivedStatus = 'exploring';
    } else if (healthScore >= 80) {
      derivedStatus = 'mastered';
    } else if (healthScore >= 60) {
      derivedStatus = 'reviewing';
    } else {
      derivedStatus = 'weak';
    }

    const correctCount = mastered + Math.floor(review * 0.5);
    const wrongCount = weak + Math.ceil(review * 0.5);
    const lastPractice = pick(['刚刚', '1天前', '3天前', '5天前', '1周前']);

    return {
      totalQuestions: total,
      correctCount,
      wrongCount,
      lastPractice,
      masteryScore: healthScore,
      masteryDistribution: { mastered, review, weak },
      health: {
        score: healthScore,
        total,
        mastered,
        review,
        weak,
        status: derivedStatus as any
      }
    };
  };

  if (legacyState) {
    // === Case A: Node is a known legacy node ===
    const stats = buildStats(legacyState.status as string, id);
    const finalStatus = stats?.health?.status || legacyState.status || 'unknown';
    return {
      id: id,
      label: name,
      subject,
      group: depth,
      val: legacyState.val ? legacyState.val * 1.5 : baseVal, // Scale up old values
      status: finalStatus as any,
      stats
    };
  } else {
    // === Case B: New node ===
    // 目标：五色均匀分布，同时保留与父节点的轻度相关性
    const baseHash = hashString(id);

    // 基于 hash 均匀分配 5 种状态，确保刷新不抖动
    let pooledStatus = STATUS_POOL[Math.abs(baseHash) % STATUS_POOL.length];

    // 轻度继承父节点趋势：如果父节点是 mastered/weak/not_mastered，稍作偏置
    if (parentNodeStatus === 'mastered') {
      // 强势父节点：偏绿/黄
      pooledStatus = STATUS_POOL[Math.abs(baseHash + 1) % STATUS_POOL.length]; // 向前平移一点
    } else if (parentNodeStatus === 'weak' || parentNodeStatus === 'not_mastered') {
      // 弱势父节点：偏红/黄/灰
      pooledStatus = STATUS_POOL[Math.abs(baseHash + 3) % STATUS_POOL.length]; // 向后平移
    }

    const newStatus = pooledStatus;
    const stats = buildStats(newStatus, id);
    const finalStatus = stats?.health?.status || newStatus;

    return {
      id,
      label: name,
      subject,
      group: depth,
      val: baseVal,
      status: finalStatus as any,
      stats
    };
  }
};

/**
 * Recursively processes the raw tree data
 */
const processTree = (
  raw: RawNode, 
  parentId: string, 
  nodes: KnowledgeNode[], 
  links: KnowledgeLink[],
  depth: number,
  subject: SubjectType,
  parentStatus?: string // Track parent status
) => {
  // Create current node
  const node = createMergedNode(raw.name, parentId, depth, subject, parentStatus);
  
  // Fix center node position
  if (depth === 0 || node.id === 'root') {
      node.fx = 0;
      node.fy = 0;
  }
  
  nodes.push(node);

  // Create link to parent (Allow connection to root now!)
  if (parentId) {
    links.push({
      source: parentId,
      target: node.id,
      value: 1
    });
  }

  // Recurse children
  if (raw.children && Array.isArray(raw.children)) {
    raw.children.forEach((child: any) => {
      processTree(child, node.id, nodes, links, depth + 1, subject, node.status);
    });
  }
};

/**
 * Main export function to get the combined graph data
 */
export const getMergedUniverseData = (subject: SubjectType = '数学'): UniverseData => {
  const nodes: KnowledgeNode[] = [];
  const links: KnowledgeLink[] = [];

  // 1. Create the Root Node
  const rootId = 'root';
  nodes.push({
    id: rootId,
    label: subject === '数学' ? '初中数学' : `${subject}知识图谱`,
    subject,
    group: 0,
    val: 80,
    status: 'mastered'
  });

  // 2. Process the subject-specific directory data（使用确定性分布避免颜色抖动）
  const tree = (SUBJECT_CONFIGS[subject]?.knowledgeTree || mathKnowledgeDir) as any[];
  tree.forEach(child => {
    processTree(child, rootId, nodes, links, 1, subject, 'mastered'); // Start with mastered root status
  });

  console.log(`Knowledge Graph Merged (Decoupled): ${nodes.length} nodes created.`);
  
  return { nodes, links };
};
