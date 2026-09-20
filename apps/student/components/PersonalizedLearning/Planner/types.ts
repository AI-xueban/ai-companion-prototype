export type PlannerMode = 'easy' | 'standard' | 'intense';
export type PlanType = 'weakness' | 'exam' | 'preview';

export interface KnowledgeNode {
  id: string;
  name: string;
  mastery: number; // 0-100
  status: 'locked' | 'unlocked' | 'mastered';
  category: string;
}

export interface PlanConfig {
  mode: PlannerMode;
  type: PlanType;
  selectedTopics: string[]; // IDs
  durationDays: number;
  dailyMinutes: number;
}

export interface PlannerState {
  currentStep: 1 | 2 | 3;
  config: PlanConfig;
  diagnosis: {
    weaknessCount: number;
    predictedScoreBoost: number;
    recommendedTopics: KnowledgeNode[];
  };
}

export const MOCK_DIAGNOSIS = {
  weaknessCount: 12,
  predictedScoreBoost: 15,
  recommendedTopics: [
    { id: 't1', name: '二次函数图像', mastery: 30, status: 'unlocked', category: '代数' },
    { id: 't2', name: '韦达定理', mastery: 45, status: 'unlocked', category: '代数' },
    { id: 't3', name: '圆的切线', mastery: 20, status: 'unlocked', category: '几何' },
    { id: 't4', name: '相似三角形', mastery: 50, status: 'unlocked', category: '几何' },
    { id: 't5', name: '概率基础', mastery: 40, status: 'unlocked', category: '统计' },
  ] as KnowledgeNode[]
};

