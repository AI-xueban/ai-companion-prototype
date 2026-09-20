import { CoreSubjectType, SubjectType } from '../types';
import chineseKg from '../data/chinese_knowlege_dir';
import englishKg from '../data/english_knowlege_dir';
import { mathKnowledgeDir as mathKg } from '../data/math_knowledge_dir';

export interface SubjectConfig {
  knowledgeTree: any[];
  mapBuilder?: (mode: 'sync' | 'pro', helpers: MapBuilderHelpers) => any[];
}

export interface MapBuilderHelpers {
  flattenKnowledgeToNodes: (tree: any[], subject: SubjectType, opts?: { mode?: 'sync' | 'pro'; limit?: number }) => any[];
  mathProNodes: any[];
  mathSyncNodes: any[];
}

export const SUBJECT_CONFIGS: Record<CoreSubjectType, SubjectConfig> = {
  数学: {
    knowledgeTree: mathKg,
    mapBuilder: (mode, { mathProNodes, mathSyncNodes }) => (mode === 'pro' ? mathProNodes : mathSyncNodes),
  },
  语文: {
    knowledgeTree: chineseKg,
    mapBuilder: (mode, { flattenKnowledgeToNodes }) => {
      return flattenKnowledgeToNodes(chineseKg as any[], '语文', { mode, limit: mode === 'pro' ? 120 : undefined });
    }
  },
  英语: {
    knowledgeTree: englishKg,
    mapBuilder: (mode, { flattenKnowledgeToNodes }) => {
      return flattenKnowledgeToNodes(englishKg as any[], '英语', { mode, limit: mode === 'pro' ? 120 : undefined });
    }
  },
};

