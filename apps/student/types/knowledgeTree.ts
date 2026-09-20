/** 原始知识树 JSON（学科网 pipeline 导出） */

export type KnowledgeTreeNodeType =
  | 'KnowledgeNode'
  | 'KnowledgePoint'
  | 'TestingPoint';

export interface RawKnowledgeTreeNode {
  node_id: number;
  name: string;
  type: KnowledgeTreeNodeType;
  catalog_name: string;
  catalog_id: number;
  parent_id: number;
  children: RawKnowledgeTreeNode[];
}

export interface RawCatalogNode {
  catalog_id: number;
  name: string;
  ordinal: number;
  parent_id: number;
  children: RawCatalogNode[];
  knowledge_points: RawKnowledgeTreeNode[];
}

export interface TextbookKnowledgeTree {
  textbook_id: number;
  textbook_name: string;
  course_id: number;
  course_name: string;
  grade: number;
  term: string;
  statistics: {
    total_nodes: number;
    total_catalogs: number;
    root_nodes: number;
    catalog_roots: number;
    knowledge_points: number;
    testing_points: number;
    knowledge_nodes: number;
  };
  catalog_tree: RawCatalogNode[];
  knowledge_tree: RawKnowledgeTreeNode[];
}

export interface DemoChapterMeta {
  catalog_id: number;
  name: string;
  ordinal: number;
  section_count: number;
  sections: { catalog_id: number; name: string; ordinal: number }[];
}

export interface DemoTextbookMeta {
  subject: 'chinese' | 'math' | 'english';
  subject_label: string;
  textbook_id: number;
  textbook_name: string;
  grade: number;
  term: string;
  file: string;
  statistics: TextbookKnowledgeTree['statistics'];
  chapters: DemoChapterMeta[];
}

export interface DemoTextbookIndex {
  generated_at: string;
  textbooks: DemoTextbookMeta[];
}

export interface ChapterScope {
  textbookId: number;
  chapterCatalogId: number;
  sectionCatalogId?: number;
}
