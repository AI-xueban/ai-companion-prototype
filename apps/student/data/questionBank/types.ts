export type QuestionType =
  | 'single_choice'
  | 'multiple_choice'
  | 'fill_in_blank'
  | 'true_false'
  // 英语专项题型
  | 'listening_choice'
  | 'listening_blank'
  | 'listening_match'
  | 'listening_judge'
  | 'listening_sort'
  | 'phonics'
  | 'spelling'
  | 'grammar_choice'
  | 'word_choice'
  | 'cloze_choice'
  | 'sentence_completion'
  | 'situation'
  | 'reading_comp'
  | 'task_reading'
  | 'short_cloze'
  | 'dialogue_fill'
  | 'translation'
  | 'correction'
  // 语文专项
  | 'accumulation'
  | 'dictation'
  | 'integrated_learning'
  | 'classical_reading'
  | 'poem_reading';
export type DifficultyLevel = 1 | 2 | 3 | 4 | 5; // 1: 容易 -> 5: 困难
export type QuestionCategory = 'typical' | 'textbook' | 'synchronous' | 'finale';
export type SubjectType = 'chinese' | 'math' | 'english';

// 新增：认知状态类型（与知识图谱状态挂钩）
export type CognitiveState = 
  | 'GAP'       // 🔴 断口环 (需攻克)
  | 'MASTERED'  // 🟢 实心环 (已掌握)
  | 'FADED';    // 🟡 双层环 (需复习)

export interface OptionItem {
  id: string;
  label: string;
  content: string;
  isCorrect?: boolean;
}

export interface ResultItem {
  correctAnswer: string | string[]; // 支持多选/填空
  explanation: string;
  detail?: string;
}

export interface QuestionItem {
  id: string;
  subject: SubjectType;
  type: QuestionType;
  difficulty: DifficultyLevel;
  category: QuestionCategory;
  knowledgePoints: string[]; // 对应知识图谱节点 ID
  tags: string[]; // 用于 UI 徽章（可含题型/场景）
  content: {
    stem: string;
    stemImages?: string[];
    /** 个别图片题：试卷扫描原图，配合「查看原图」使用 */
    originalImageUrl?: string;
    /** 演示/预置：提交时若作答区无笔迹，用此图作为作答快照（如手写作答百分比） */
    presetAnswerDraftUrl?: string;
    /** 学科网 HTML 题干（含表格、填空），优先于 stemImages */
    htmlStem?: string;
    /** 学科网 HTML 解析 */
    htmlExplanation?: string;
    /** 需手动批改的空：参考答案公式/图片 URL（学科网） */
    manualGradeReferenceImageUrl?: string;
    /** 错题本列表预览：image=仅图，text=仅题干文案 */
    mistakeCardPreview?: 'image' | 'text';
    options?: string[]; // 保留字符串选项，兼容现有组件
    audioUrl?: string; // 听力音频
    transcript?: string; // 听力原文或字幕
    examRules?: {
      allowSeek?: boolean; // 考试模式是否允许拖动
      maxReplays?: number | null; // 最大播放次数，null 代表无限
      subtitlesAllowed?: boolean; // 是否允许显示字幕/原文
    };
    subQuestions?: {
      question: string;
      options?: string[];
      answer?: string;
      manualGrade?: boolean;
    }[];
    manualGradeBlankIndex?: number;
  };
  options?: OptionItem[]; // 结构化选项，便于后续扩展
  result?: ResultItem;
  correctCount?: number;
  wrongCount?: number;
  similarIds?: string[];
  sparkGroup?: string; // 关联思维火花分组
  bookmarked?: boolean;
  source?: string;
  cognitiveState?: CognitiveState; // 认知状态
  /** 业务侧题目 ID（学科网等） */
  externalQuestionId?: string;
}
