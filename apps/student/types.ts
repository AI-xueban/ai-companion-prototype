
export interface Task {
  id: string;
  title: string;
  subject: string;
  durationMinutes: number;
  completed: boolean;
  aiReasoning?: string; // Why AI suggested this
  // New fields for Phase 1
  levelType?: 'level' | 'chest' | 'boss' | 'practice';
  quizType?: 'listening' | 'speaking' | 'reading' | 'writing' | 'mixed' | 'standard';
  /** 自主练习 / 自主测：学生选定的题量 */
  questionCount?: number;
  /** 自主练习 / 自主测：学生选定的难度（1 较易 → 5 困难） */
  practiceDifficulty?: 1 | 2 | 3 | 4 | 5;
  practiceDifficultyLabel?: string;
  /** 组卷场景：sync 同步练习 / sc 真题 / gc 好题 / rc 常考题 / yc 压轴题 / ec 易错题 */
  practiceScenario?: 'sync' | 'sc' | 'gc' | 'rc' | 'yc' | 'ec';
  practiceScenarioLabel?: string;
  /** 一课一练：回写未练习 / 练习中 / 已练完 */
  syncPracticeMark?: {
    bookKey: string;
    practiceKey: string;
  };
  /** 同步课堂微课 · 学科网课时 */
  syncLesson?: {
    lessonId: number;
    coverUrl: string;
    kpointIds: number[];
    kpointTitles: string[];
    textbookId: number;
    chapterId: number;
    sectionId?: number;
    scopeLabel?: string;
  };
  /** 小节页同步微课列表，播完一集后重播 / 下一集 / 一课一练 */
  sectionVideoPlaylist?: {
    items: Array<{
      id: string;
      title: string;
      durationSec: number;
      /** 小节/知识点名，播放列表与学习路径分开展示 */
      topicTitle?: string;
    }>;
    currentIndex: number;
    /** 播放列表副标题，如 Unit 1 · Section A */
    scopeLabel?: string;
  };
  /** 播完本小节最后一集后进入的一课一练 */
  sectionPractice?: {
    id: string;
    title: string;
    durationMinutes?: number;
    questionCount?: number;
    practiceDifficulty?: 1 | 2 | 3 | 4 | 5;
    practiceDifficultyLabel?: string;
    practiceScenario?: 'sync' | 'sc' | 'gc' | 'rc' | 'yc' | 'ec';
    practiceScenarioLabel?: string;
    syncPracticeMark?: {
      bookKey: string;
      practiceKey: string;
    };
  };
}

export interface DayPlan {
  id: string;
  title: string;
  description: string;
  tasks: Task[];
  totalXp: number;
}

export interface MoodOption {
  value: string;
  label: string;
  scientificLabel?: string; // New field for clearer emotional granularity
  icon: string; // Emoji char
  color: string;
}

export interface UserStats {
  xpToday: number;
  xpTarget: number;
  studyMinutesToday: number;
  streakDays: number;
  coins: number;
  /** 本周联赛 XP，0 时星光学榜未解锁 */
  weeklyXp: number;
}

// --- LEAGUE / RANKING SYSTEM TYPES ---
export type LeagueTierName = 'Stardust' | 'Meteor' | 'Satellite' | 'Planet' | 'Star' | 'Galaxy' | 'Supernova' | 'CosmicLegend';
export type LeagueGrade = 'I' | 'II' | 'III';

export interface LeagueTierConfig {
  name: LeagueTierName;
  label: string;
  color: string;
  icon: string;
  themeGradient: string;
}

export interface UserLeagueStatus {
  tier: LeagueTierName;
  grade: LeagueGrade;
  tierLabel: string;
  totalXp: number;
  xpInCurrentGrade: number;
  xpNeededForNextGrade: number;
}

export interface LeaderboardItem {
  id: string;
  name: string;
  avatar: string;
  xp: number;
  rank: number;
  isMe: boolean;
  trend?: 'up' | 'down' | 'same';
  leagueStatus: UserLeagueStatus;
  topAbilityTag?: string;
}

// New types for Subject Map
export type CoreSubjectType = '数学' | '语文' | '英语';
export type SubjectType =
  | CoreSubjectType
  | '道德与法治'
  | '历史'
  | '生物'
  | '地理'
  | '科学'
  | '物理'
  | '化学';
export const CORE_SUBJECTS: CoreSubjectType[] = ['数学', '语文', '英语'];
export const isCoreSubject = (subject: string): subject is CoreSubjectType =>
  CORE_SUBJECTS.includes(subject as CoreSubjectType);
export type MapMode = 'sync' | 'pro'; // NEW: Mode definition

export type NodeStatus = 'locked' | 'current' | 'completed';

export type QuizType = 'listening' | 'speaking' | 'reading' | 'writing' | 'mixed' | 'standard';

export interface MapNode {
  id: string;
  title: string;
  level: number;
  status: NodeStatus;
  nodeType?: 'level' | 'chest' | 'boss' | 'practice'; // Added 'practice'
  quizType?: QuizType; // Added quizType
  stars?: 0 | 1 | 2 | 3; // For completed or branch nodes
  description?: string;
  duration?: string;
  isBranch?: boolean; // If it sits off the main path
  xOffset?: number; // -100 to 100 range for visual positioning (Sync Mode)
  
  // Pro Mode Specifics
  position?: { x: number; y: number }; // Percentage 0-100 for absolute positioning
  abilityType?: 'logic' | 'spatial' | 'compute' | 'memory' | 'verbal';
  
  // Enhanced properties for detailed chapter nodes
  taskTitle?: string;       // Specific task name like "天平的秘密"
  chapterNodeType?: ChapterNodeType; // intuition, clinic, practice, gatekeeper, application
  durationMinutes?: number; // Duration in minutes  
  learningGoals?: string[]; // Learning objectives
  icon?: string;           // Emoji icon from ChapterMapCanvas
}

export interface SubjectData {
  subject: SubjectType;
  nodes: MapNode[];
}

// Mistake Vault Types
export interface MistakeStats {
  errorCount: number;
  reviewCount: number;
  correctCount: number; // consecutive correct
  mastered: boolean;
  isStarred: boolean;
  lastWrongDate: string;
}

export interface VariantQuestion {
  id: string;
  content: string;
  options?: string[]; // if multiple choice
  correctAnswer: string;
  explanation: string;
}

export interface MistakeItem {
  id: string;
  questionSnippet: string; // Short preview
  fullQuestion: string;   // Full content (supports latex/image logically)
  subject: SubjectType | string;
  topic: string; // e.g., "Quadratic Equations"
  errorType:
    | '审题有误'
    | '概念模糊'
    | '审题不清'
    | '思路卡壳'
    | '知识点忘了'
    | '想不到思路'
    | '计算出错'
    | '公式用错/条件不符'
    | '时间不够做完'
    | '蒙的/不会'
    | '其它'
    | '计算错误'
    | '概念模糊'
    | '思路卡壳'
    | string;
  status: 'new' | 'reviewing' | 'mastered'; // red | yellow | green
  lastReview: string; // Display string like "1天前"
  tags?: string[];
  knowledgePoints?: string[];
  questionType?: string;
  difficulty?: number | string;
  category?: string;
  correctAttempts?: number;
  wrongAttempts?: number;
  totalAttempts?: number;
  lastAttemptAt?: string;
  deadlineLabel?: string;
  dueInDays?: number;
  similarIds?: string[];
  attempts?: Array<{
    id: string;
    name: string;
    studentId: string;
    correct: boolean;
    answer: string;
    duration: string;
    time: string;
  }>;
  
  // Detailed Stats
  stats: MistakeStats;
  
  // Content
  correctAnswer: string;
  userWrongAnswer?: string;
  analysis: string; // AI explanation
}

export interface MistakeGroup {
  topic: string;
  count: number;
  items: MistakeItem[];
}

export interface MistakeSubjectStat {
  subject: SubjectType | string;
  pendingCount: number;
  solvedPercentage: number;
  weak?: number;         // 未掌握
  reviewing?: number;    // 需复习
  mastered?: number;     // 已掌握
  total?: number;        // 总题量（可选，若缺则用 weak+reviewing+mastered 推算）
}

export interface MistakeVaultData {
  totalPending: number;
  subjectStats: MistakeSubjectStat[];
  groups: MistakeGroup[];
}

// Growth / Profile Types
export interface AbilityStats {
  logic: number;
  memory: number;
  focus: number;
  creativity: number;
  grit: number;
}

export interface RadarDimension {
  subject: string;
  score: number;
  fullMark: number;
  analysis?: string; // Detailed breakdown
}

// NEW: Holographic Report Types
export interface PersonaArchetype {
  title: string; // e.g. "结构化建筑师"
  slogan: string; // e.g. "你的大脑喜欢像搭积木一样处理知识"
  iconType: 'architect' | 'explorer' | 'polymath'; // For visual mapping
  colorTheme: string; // Tailwind gradient classes
}

export interface AiPrescription {
  learningMode: string; // e.g. "极速理解模式"
  interactionPref: string; // e.g. "视觉化辅助"
  dailyFocus: string; // e.g. "错题归因训练"
}

export interface GrowthProjection {
  metric: string; // e.g. "计算准确率"
  current: number;
  target: number;
  days: number;
}

export interface AssessmentResultData {
  personaTags: string[]; 
  radarData: RadarDimension[];
  aiEfficiency: {
      removedTasks: number; // percentage
      savedTime: string;
  };
  // New Fields for Holographic Report
  archetype?: PersonaArchetype;
  prescription?: AiPrescription;
  projection?: GrowthProjection;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string; // Emoji or icon name
  unlocked: boolean;
  dateUnlocked?: string;
}

export interface UserProfileData {
  name: string;
  level: number;
  currentXp: number;
  nextLevelXp: number;
  abilities: AbilityStats; // Keep for backward compatibility if needed
  assessmentResult?: AssessmentResultData; // The rich data
  achievements: Achievement[];
  coins: number;
  unlockedOutfitIds: string[]; // NEW: Outfits
  currentOutfit: {             // NEW: Equipped Outfits
    headwear?: string;
    handheld?: string;
    outfit?: string;
    background?: string;
  };
  academicInfo?: AcademicProfile; // NEW: Store academic calibration
  leagueStatus?: UserLeagueStatus; // NEW: Rank
}

// NEW: Academic Calibration Types
export interface AcademicProfile {
  grade: string; // e.g. "七年级上"
  textbookVersion: string; // e.g. "人教版"
  currentTopicId?: string; // e.g. "topic-linear-eq"
}

export interface TopicNode {
  id: string;
  label: string;
  status: 'locked' | 'unlocked' | 'mastered' | 'current'; // Visual state
  x: number; // For layout (0-100%)
  y: number;
  connections: string[]; // IDs of connected nodes
}

export type AssessmentPhase = 'launch' | 'cognitive' | 'weaving' | 'final_result';

// PBL Types
export type PBLStep = 'launch' | 'knowledge' | 'practice' | 'showcase' | 'reflection';

export interface PBLRole {
  id: string;
  title: string;
  icon: string;
  desc: string;
  subjectFocus: string; // e.g., "Engineering", "Math"
}

export interface PBLDiscovery {
  id: string;
  text: string;
  category: string;
}

export interface PBLProject {
  id: string;
  title: string;
  subtitle: string;
  difficulty: 1 | 2 | 3;
  tags: string[]; // e.g., "Engineering", "Art"
  mentor: {
    id: string;
    name: string; // e.g., "Da Vinci"
    avatar: string;
    role: string;
  };
  description: string;
  totalSteps: number;
  themeColor: string; // Tailwind class or hex
  rolePool: PBLRole[]; // New field for specific roles
  discoveryPool?: PBLDiscovery[]; // NEW: Project-specific discoveries
}

export interface PBLMessage {
  id: string;
  sender: 'ai' | 'user';
  content: string;
  type: 'text' | 'image';
  timestamp: number;
}

// NEW: Plaza/Recruitment Types
export type StudentAbilityTag = '计算达人' | '逻辑怪才' | '文案大师' | '翻译专家' | '实验能手' | '资料挖掘机' | '美学顾问';

export interface TeammateCandidate {
    id: string;
    name: string;
    avatar: string;
    level: number;
    status: 'online' | 'busy' | 'away';
    tags: StudentAbilityTag[];
    matchReason?: string; // AI generated
    isAiRecommended?: boolean;
}

// Lifecycle / Demo Types (Step 1)
export type UserJourneyPhase = 'startup_animation' | 'auth' | 'splash' | 'calibration' | 'assessment_gate' | 'assessment' | 'dashboard' | 'learning';
export type UserPersona = 'newbie' | 'average' | 'ace';

// Lumi Types
export type LumiAccessory = 'none' | 'headphones' | 'glasses' | 'hat' | 'scarf';

// --- OUTFIT SYSTEM TYPES ---
export type OutfitCategory = 'headwear' | 'handheld' | 'outfit' | 'background';

export interface OutfitItem {
  id: string;
  name: string;
  category: OutfitCategory;
  target: 'user' | 'lumi'; // 'user' for avatar, 'lumi' for AI companion
  price: number; // 0 means free
  unlockCondition?: string; // e.g. "Lv.5", "7-day streak"
  isLocked: boolean;
  assetUrl: string; // PNG path or css class
  description: string;
}

// Daily Check-in Types
export interface DailyCheckInData {
  mode: 'chat' | 'quick';
  schoolStatus?: 'weekday' | 'weekend' | 'holiday';
  subjects?: SubjectType[];
  difficulties?: string[];
  studyTime?: number;
  energyLevel?: 'low' | 'medium' | 'high';
}

export interface CheckInQuestion {
  id: string;
  question: string;
  quickReplies?: string[];
  allowText: boolean;
  allowPhoto?: boolean;
}

// --- CHAPTER MAP TYPES (For Learning Journey) ---

export interface ExpeditionPlan {
  target: string;
  duration: number; // 1, 2, or 3 weeks
  startDate: string; // ISO string
  topic?: string;
  category?: string;
  focus?: string;
  title?: string;
  expectedTotalMinutes?: number;
  coverage?: string;
  textbook?: string;
  subject?: string;
  selectionMode?: 'knowledge' | 'chapter';
  selectedIds?: string[];
  selectedLabels?: string[];
  levelTitles?: string[];
  rangeSummary?: string;
  continuePromptHandled?: boolean;
}

export interface ExpeditionPlanHistoryRecord {
  id: string;
  planName: string;
  createdAt: string;
  completedAt?: string;
  levelCount: number;
  completedLevels?: number;
  subject: string;
  status: 'active' | 'completed';
  plan?: ExpeditionPlan;
}

// 关卡节点类型
export type ChapterNodeType = 'intuition' | 'clinic' | 'practice' | 'gatekeeper' | 'application';

// 关卡节点状态
export type ChapterNodeStatus = 'completed' | 'recommended' | 'locked' | 'normal';

// 关卡节点
export interface ChapterNode {
  id: string;
  title: string;
  icon: string; // Emoji
  type: ChapterNodeType;
  status: ChapterNodeStatus;
  durationMinutes: number;
  description?: string;
  learningGoals?: string[]; // 学习目标列表
}

// Zone/区域（一个章节包含多个Zone）
export interface ChapterZone {
  id: string;
  title: string;
  description: string;
  nodes: ChapterNode[];
  backgroundColor: string; // Tailwind color class
}

// 章节地图数据
export interface ChapterMapData {
  chapterId: string;
  chapterTitle: string;
  subject: SubjectType;
  zones: ChapterZone[];
}

// --- AI ESSAY LAB TYPES ---

export interface EssayAnnotation {
  id: string;
  type: 'correction' | 'good' | 'suggestion'; // correction=red, good=yellow, suggestion=purple (upgrade)
  originalText: string;
  startIndex: number; // char index
  endIndex: number;
  suggestion?: string; // Primary suggestion (The correct answer)
  alternatives?: string[]; // Kept for legacy compatibility
  distractors?: string[]; // NEW: Wrong options for challenge mode
  contextQuery?: string; // NEW: The question text (e.g. "Which is more formal?")
  explanation?: string;
}

export interface EssayRadarItem {
  dimension: string;
  score: number;
  fullMark: number;
}

export interface EssayAnalysisResult {
  score: number;
  radarData: EssayRadarItem[];
  generalComment: string; // "逻辑清晰..."
  annotations: EssayAnnotation[];
  improvedVersion?: string; // AI rewrite
}

export interface EssayData {
  id: string;
  subject: SubjectType;
  title?: string;
  content: string; // The editable text
  imageUrl?: string; // Original photo
}

// --- TEACHER STUDENT PROFILE TYPES ---

export type MessageType = 'REPORT' | 'PSYCHOLOGY' | 'REDEEM';

export interface ChatLogEntry {
  role: 'student' | 'ai';
  content: string;
  time: string;
}

export interface TeacherMessage {
  id: string;
  type: MessageType;
  title: string;
  summary: string;
  time: string;
  status: 'open' | 'handled';
  level: 'high' | 'medium' | 'low';
  student?: {
    id: string;
    name: string;
    avatar: string;
  };
  // Specific for PSYCHOLOGY (High-risk)
  psychologyData?: {
    keyword: string;
    chatLogs: ChatLogEntry[];
    diagnosis: string;
    suggestions: string[];
  };
  // Specific for REDEEM
  redeemData?: {
    item: string;
    points: number;
    recordId: string;
    note?: string;
  };
  // Specific for REPORT
  reportData?: {
    reportId: string;
    period: string;
  };
}

export interface StudentSummary {
  id: string;
  name: string;
  avatar: string;
  grade: string;
  classNumber: string;
  level?: number;
  status: 'online' | 'offline' | 'away';
  alertLevel: 'none' | 'low' | 'medium' | 'high';
  abilitySnapshot: {
    logic: number;
    calculation: number;
    spatial: number;
    application: number;
    concept: number;
  };
  recentTrend: 'up' | 'down' | 'stable';
  lastActive: string;
  aiInsight?: string;
}

export interface ClassSummaryStats {
  totalStudents: number;
  onlineCount: number;
  attentionNeeded: number;
  excellentPerformance: number;
}
