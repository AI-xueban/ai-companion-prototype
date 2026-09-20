import { SubjectType } from './types';

export type KnowledgeNodeStatus = 'mastered' | 'weak' | 'not_mastered' | 'unknown' | 'exploring' | 'reviewing';

/** 原始知识树节点类型；KnowledgeNode 为分类容器，不可直接练题 */
export type GraphNodeType = 'KnowledgeNode' | 'KnowledgePoint' | 'TestingPoint';

/** 画布展示角色（方案 D 三层视觉） */
export type GraphDisplayRole = 'theme' | 'knowledge' | 'testing';

export interface KnowledgeNode {
  id: string;
  label: string;
  subject: SubjectType;
  status: KnowledgeNodeStatus;
  group: number; // 0 for root, 1 for galaxy center, 2 for planet
  val: number; // Size/Mass of the node
  /** 原始树节点类型 */
  nodeType?: GraphNodeType;
  parentId?: string;
  catalogId?: number;
  catalogName?: string;
  childCount?: number;
  /** 是否可进入测学练闭环（知识点 / 考点） */
  isPracticable?: boolean;
  /** 画布展示角色 */
  displayRole?: GraphDisplayRole;
  /** 是否可聚焦下钻（有子节点且为分类容器） */
  isDrillable?: boolean;
  depth?: number;
  // Coordinates (optional, for initial layout hints)
  fx?: number;
  fy?: number;
  fz?: number;
  x?: number;
  y?: number;

  // Stats for the Diagnosis Card
  stats?: {
    totalQuestions: number;
    correctCount: number;
    wrongCount: number;
    lastPractice: string;
    // New Mastery State
    masteryScore?: number; // 0-100
    masteryDistribution?: {
      mastered: number;
      review: number;
      weak: number;
    };
    // Health breakdown for PRD 可视化：用于仪表盘与阈值判断
    health?: {
      score: number;
      total: number;
      mastered: number;
      review: number;
      weak: number;
      status: KnowledgeNodeStatus;
    };
  };

  // Error patterns (Simulated AI analysis)
  errorPatterns?: string[]; // e.g., ["Calculation Error", "Concept Confusion"]
  
  // Representative wrong question (Mock ID)
  sampleWrongQuestionId?: string;
}

export interface KnowledgeLink {
  source: string;
  target: string;
  value: number; // Connection strength (thickness)
  isDirectional?: boolean; // For flow animation
}

export interface UniverseData {
  nodes: KnowledgeNode[];
  links: KnowledgeLink[];
}


















