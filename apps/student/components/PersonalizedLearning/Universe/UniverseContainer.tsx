import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SUBJECT_CONFIGS } from '../../../services/subjectConfig';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  BookMarked,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Clapperboard,
  Feather,
  Info,
  Lightbulb,
  PenLine,
  Play,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  Trees,
  ListChecks,
} from 'lucide-react';
import { SubjectType } from '../../../types';
import { Annotatable } from '../../Prototype/Annotatable';
import { findSampleVideoTitle, resolveLessonSampleVideos } from '../../../data/resolvePrimaryVideos';
import {
  CatalogNode,
  PRACTICE_VIDEO_MODULE_IDS,
  STUDENT_STUDY_CONTEXT,
  getEnglishHujiaoVideoModuleId,
  getTextbookCatalog,
  isChapterOnlyTextbook,
  isEnglishHujiaoTextbook,
  isPracticeVideoModule,
} from '../../../data/syncTextbookCatalog';
import { AssessmentConfigPage, assessmentShowsKnowledgePoints, toAssessmentCatalog } from '../../Dashboard/AssessmentConfigPage';
import { PracticeSetupModal } from '../../Dashboard/PracticeSetupModal';
import teacherPortrait from '@/assets/Avatar-爱因斯坦.jpg';
import teacherTeamImage from '@/assets/teacher-team.png';
import moduleTeacher1 from '@/assets/module-teacher-1.png';
import moduleTeacher2 from '@/assets/module-teacher-2.png';
import moduleTeacher3 from '@/assets/module-teacher-3.png';

interface UniverseContainerProps {
  subject: SubjectType;
  currentGrade?: string;
  currentTextbook?: string;
  onOpenQuestionTraining?: (mode: 'practice' | 'assessment' | 'unit') => void;
  onLearningModuleSubpageChange?: (open: boolean) => void;
  onBack?: () => void;
  onStartLevel?: (nodeId: string, type: string) => void;
  onOpenVideo?: (
    module: { id: string; title: string },
    playlist: { id: string; title: string; subtitle?: string; group?: 'learn' | 'practice' }[],
    options?: {
      actionLabel?: string;
      practiceMode?: 'practice' | 'unit';
      fromLearningPath?: boolean;
    }
  ) => void;
  compactHome?: boolean;
}

const BOTTOM_SAFE = 64;
const TOP_SAFE = 72;
const LEFT_MODE_GUTTER = 80;
const SYNC_DIRECTORY_SELECTION_STORAGE_KEY = 'sync-learning:directory-selection:v1';

interface RawDirNode {
  name: string;
  level?: string;
  children?: RawDirNode[];
}

interface DirTreeNode {
  id: string;
  label: string;
  level: number;
  knowledgePoints: string[];
  children: DirTreeNode[];
}

interface StoredDirectorySelection {
  chapterId?: string;
  sectionId?: string;
  moduleScopeIds?: Record<string, string>;
}

type StoredDirectorySelections = Partial<Record<SubjectType, StoredDirectorySelection>>;

type ModuleId =
  | 'textbook-knowledge'
  | 'textbook-exercises'
  | '53-lectures'
  | 'bio-video-1'
  | 'bio-video-2'
  | 'bio-video-3'
  | 'bio-video-4'
  | 'bio-video-5'
  | 'bio-video-6'
  | 'unit-goal-guide'
  | 'happy-vocabulary'
  | 'easy-textbook'
  | 'reading-writing'
  | 'sync-foundation-practice'
  | 'phonetics-lab'
  | 'sync-improve'
  | 'basic-learn'
  | 'example-learn'
  | 'advanced-learn'
  | 'vocabulary-lecture'
  | 'foreign-teacher-speaking'
  | 'sync-grammar-lecture'
  | 'cn-preview'
  | 'cn-classroom'
  | 'cn-review'
  | 'cn-extend'
  | 'cn-new-standard'
  | 'cn-sync-reading'
  | 'cn-sync-composition'
  | 'cn-hanzi-trace'
  | 'science-concept'
  | 'science-experiment'
  | 'science-phenomenon'
  | 'science-reading'
  | 'science-practice'
  | 'science-lecture-1'
  | 'science-lecture-2'
  | 'science-key-practice';

interface LearningModule {
  id: ModuleId;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  accent: string;
  accentSoft: string;
}

function getWatchStatusIndex(moduleId: string) {
  return Array.from(moduleId).reduce((sum, char) => sum + char.charCodeAt(0), 0) % 3;
}

function WatchStatusBadge({ moduleId, className = '' }: { moduleId: string; className?: string }) {
  const statusIndex = getWatchStatusIndex(moduleId);
  const status = [
    { label: '未学习', className: 'bg-slate-100 text-slate-400' },
    { label: '学习中', className: 'bg-amber-50 text-amber-600' },
    { label: '已学完', className: 'bg-emerald-50 text-emerald-600' },
  ][statusIndex];

  return (
    <span
      className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${status.className} ${className}`}
    >
      {status.label}
    </span>
  );
}

const LAST_PATH_VIDEO_KEY = 'sync:last-path-video:v1';
const LESSON_PRACTICE_KEY = 'sync:lesson-practice:v1';

function lessonRecordKey(subject: string, sectionId: string) {
  return `${subject}::${sectionId}`;
}

function readLocalMap(key: string): Record<string, string> {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

function writeLocalMap(key: string, map: Record<string, string>) {
  localStorage.setItem(key, JSON.stringify(map));
}

function getLastPathVideoId(subject: string, sectionId: string): string | null {
  if (!sectionId) return null;
  return readLocalMap(LAST_PATH_VIDEO_KEY)[lessonRecordKey(subject, sectionId)] || null;
}

function saveLastPathVideoId(subject: string, sectionId: string, videoId: string) {
  const map = readLocalMap(LAST_PATH_VIDEO_KEY);
  map[lessonRecordKey(subject, sectionId)] = videoId;
  writeLocalMap(LAST_PATH_VIDEO_KEY, map);
}

function getLessonPracticeDone(subject: string, sectionId: string): boolean {
  if (!sectionId) return false;
  const map = readLocalMap(LESSON_PRACTICE_KEY);
  const key = lessonRecordKey(subject, sectionId);
  if (key in map) return map[key] === '1';
  return getWatchStatusIndex(key) === 0;
}

function saveLessonPracticeDone(subject: string, sectionId: string) {
  const map = readLocalMap(LESSON_PRACTICE_KEY);
  map[lessonRecordKey(subject, sectionId)] = '1';
  writeLocalMap(LESSON_PRACTICE_KEY, map);
}

function getChapterVideoModules(modules: LearningModule[], chapterId: string, chapters: DirTreeNode[]) {
  if (modules.length <= 2) return modules;

  const chapterIndex = Math.max(0, chapters.findIndex((chapter) => chapter.id === chapterId));
  if (chapterIndex === 0) return modules;

  const minimumCount = 2;
  const countRange = modules.length - minimumCount + 1;
  const videoCount = minimumCount + ((chapterIndex - 1) % countRange);

  return modules.slice(0, videoCount);
}

const TEXTBOOK_MODULES: LearningModule[] = [
  {
    id: 'textbook-knowledge',
    title: '教材知识精讲',
    subtitle: '',
    icon: <BookOpen size={20} strokeWidth={2.4} />,
    accent: '#5B4AD1',
    accentSoft: 'rgba(123, 97, 255, 0.12)',
  },
  {
    id: 'textbook-exercises',
    title: '教材习题精讲',
    subtitle: '',
    icon: <Clapperboard size={20} strokeWidth={2.4} />,
    accent: '#2563EB',
    accentSoft: 'rgba(37, 99, 235, 0.12)',
  },
  {
    id: '53-lectures',
    title: '5·3精讲',
    subtitle: '',
    icon: <Sparkles size={20} strokeWidth={2.4} />,
    accent: '#0D9488',
    accentSoft: 'rgba(13, 148, 136, 0.12)',
  },
];

const ENGLISH_TEXTBOOK_MODULES: LearningModule[] = [
  {
    id: 'unit-goal-guide',
    title: '单元目标导学',
    subtitle: '',
    icon: <Target size={18} strokeWidth={2.4} />,
    accent: '#5B4AD1',
    accentSoft: 'rgba(123, 97, 255, 0.12)',
  },
  {
    id: 'happy-vocabulary',
    title: '单词快乐学',
    subtitle: '',
    icon: <BookMarked size={18} strokeWidth={2.4} />,
    accent: '#2563EB',
    accentSoft: 'rgba(37, 99, 235, 0.12)',
  },
  {
    id: 'easy-textbook',
    title: '课文轻松学',
    subtitle: '',
    icon: <BookOpen size={18} strokeWidth={2.4} />,
    accent: '#0D9488',
    accentSoft: 'rgba(13, 148, 136, 0.12)',
  },
  {
    id: 'reading-writing',
    title: '阅读与写作',
    subtitle: '',
    icon: <Feather size={18} strokeWidth={2.4} />,
    accent: '#DB2777',
    accentSoft: 'rgba(219, 39, 119, 0.12)',
  },
  {
    id: 'sync-foundation-practice',
    title: '同步基础练',
    subtitle: '',
    icon: <Play size={18} strokeWidth={2.4} />,
    accent: '#D97706',
    accentSoft: 'rgba(217, 119, 6, 0.12)',
  },
  {
    id: 'phonetics-lab',
    title: '语音实验室',
    subtitle: '',
    icon: <Clapperboard size={18} strokeWidth={2.4} />,
    accent: '#0284C7',
    accentSoft: 'rgba(2, 132, 199, 0.12)',
  },
];

const SCIENCE_TEXTBOOK_MODULES: LearningModule[] = [
  {
    id: 'science-lecture-1',
    title: '知识精讲第1讲',
    subtitle: '',
    icon: <Lightbulb size={18} strokeWidth={2.4} />,
    accent: '#0891B2',
    accentSoft: 'rgba(8, 145, 178, 0.12)',
  },
  {
    id: 'science-lecture-2',
    title: '知识精讲第2讲',
    subtitle: '',
    icon: <Clapperboard size={18} strokeWidth={2.4} />,
    accent: '#2563EB',
    accentSoft: 'rgba(37, 99, 235, 0.12)',
  },
  {
    id: 'science-key-practice',
    title: '重难点练习',
    subtitle: '',
    icon: <Target size={18} strokeWidth={2.4} />,
    accent: '#0D9488',
    accentSoft: 'rgba(13, 148, 136, 0.12)',
  },
];

const GEOGRAPHY_TEXTBOOK_MODULES: LearningModule[] = [
  {
    id: 'textbook-knowledge',
    title: '第一课',
    subtitle: '',
    icon: <BookOpen size={18} strokeWidth={2.4} />,
    accent: '#D97706',
    accentSoft: 'rgba(217, 119, 6, 0.12)',
  },
  {
    id: 'textbook-exercises',
    title: '第二课',
    subtitle: '',
    icon: <Clapperboard size={18} strokeWidth={2.4} />,
    accent: '#2563EB',
    accentSoft: 'rgba(37, 99, 235, 0.12)',
  },
  {
    id: '53-lectures',
    title: '第三课',
    subtitle: '',
    icon: <Sparkles size={18} strokeWidth={2.4} />,
    accent: '#0D9488',
    accentSoft: 'rgba(13, 148, 136, 0.12)',
  },
];

const BIOLOGY_TEXTBOOK_MODULES: LearningModule[] = [
  { id: 'bio-video-1', title: '绿色植物的类群_知识精讲', subtitle: '', icon: <BookOpen size={18} strokeWidth={2.4} />, accent: '#65A30D', accentSoft: 'rgba(101, 163, 13, 0.12)' },
  { id: 'bio-video-2', title: '藻类、苔藓和蕨类植物_重难点练习', subtitle: '', icon: <Target size={18} strokeWidth={2.4} />, accent: '#D97706', accentSoft: 'rgba(217, 119, 6, 0.12)' },
  { id: 'bio-video-3', title: '藻类、苔藓和蕨类植物_易错误区辨析', subtitle: '', icon: <Lightbulb size={18} strokeWidth={2.4} />, accent: '#DC2626', accentSoft: 'rgba(220, 38, 38, 0.12)' },
  { id: 'bio-video-4', title: '藻类、苔藓和蕨类植物_综合提升', subtitle: '', icon: <TrendingUp size={18} strokeWidth={2.4} />, accent: '#7C3AED', accentSoft: 'rgba(124, 58, 237, 0.12)' },
  { id: 'bio-video-5', title: '苔藓植物_知识精讲', subtitle: '', icon: <BookOpen size={18} strokeWidth={2.4} />, accent: '#0D9488', accentSoft: 'rgba(13, 148, 136, 0.12)' },
  { id: 'bio-video-6', title: '蕨类植物_知识精讲', subtitle: '', icon: <BookOpen size={18} strokeWidth={2.4} />, accent: '#2563EB', accentSoft: 'rgba(37, 99, 235, 0.12)' },
];

const SYNC_IMPROVE_MODULE: LearningModule = {
  id: 'sync-improve',
  title: '同步提高',
  subtitle: '',
  icon: <TrendingUp size={20} strokeWidth={2.4} />,
  accent: '#DC2626',
  accentSoft: 'rgba(220, 38, 38, 0.12)',
};

const ENGLISH_IMPROVE_MODULES: LearningModule[] = [
  {
    id: 'vocabulary-lecture',
    title: '词汇精讲',
    subtitle: '单词与短语精讲',
    icon: <BookOpen size={18} strokeWidth={2.4} />,
    accent: '#2563EB',
    accentSoft: 'rgba(37, 99, 235, 0.12)',
  },
  {
    id: 'foreign-teacher-speaking',
    title: '外教口语',
    subtitle: '情景口语练习',
    icon: <Play size={18} strokeWidth={2.4} />,
    accent: '#DB2777',
    accentSoft: 'rgba(219, 39, 119, 0.12)',
  },
  {
    id: 'sync-grammar-lecture',
    title: '同步语法精讲',
    subtitle: '语法规则精讲',
    icon: <BookOpen size={18} strokeWidth={2.4} />,
    accent: '#7C3AED',
    accentSoft: 'rgba(124, 58, 237, 0.12)',
  },
];

const CHINESE_TEXTBOOK_MODULES: LearningModule[] = [
  {
    id: 'cn-preview',
    title: '课前预习',
    subtitle: '',
    icon: <BookOpen size={18} strokeWidth={2.4} />,
    accent: '#5B4AD1',
    accentSoft: 'rgba(123, 97, 255, 0.12)',
  },
  {
    id: 'cn-classroom',
    title: '课堂学习',
    subtitle: '',
    icon: <Clapperboard size={18} strokeWidth={2.4} />,
    accent: '#2563EB',
    accentSoft: 'rgba(37, 99, 235, 0.12)',
  },
  {
    id: 'cn-review',
    title: '课后复习',
    subtitle: '',
    icon: <RefreshCw size={18} strokeWidth={2.4} />,
    accent: '#0D9488',
    accentSoft: 'rgba(13, 148, 136, 0.12)',
  },
  {
    id: 'cn-extend',
    title: '课外拓展',
    subtitle: '',
    icon: <Trees size={18} strokeWidth={2.4} />,
    accent: '#059669',
    accentSoft: 'rgba(5, 150, 105, 0.12)',
  },
  {
    id: 'cn-new-standard',
    title: '新课标新考法',
    subtitle: '',
    icon: <Lightbulb size={18} strokeWidth={2.4} />,
    accent: '#D97706',
    accentSoft: 'rgba(217, 119, 6, 0.12)',
  },
];

function getTextbookModuleTemplates(subject: SubjectType): LearningModule[] {
  if (subject === '语文') return CHINESE_TEXTBOOK_MODULES;
  if (subject === '英语') return ENGLISH_TEXTBOOK_MODULES;
  if (subject === '科学') return SCIENCE_TEXTBOOK_MODULES;
  if (subject === '地理') return GEOGRAPHY_TEXTBOOK_MODULES;
  if (subject === '生物') return BIOLOGY_TEXTBOOK_MODULES;
  return TEXTBOOK_MODULES;
}

function buildTextbookVideoModules(options: {
  subject: SubjectType;
  chapterLabel: string;
  section: DirTreeNode | null;
  sections: DirTreeNode[];
}): LearningModule[] {
  const templates = getTextbookModuleTemplates(options.subject);
  if (!options.section) return [];
  const samples = resolveLessonSampleVideos({
    subject: options.subject,
    chapterLabel: options.chapterLabel,
    sectionLabel: options.section.label || '',
  });
  const modules = samples.length
    ? templates
    : getChapterVideoModules(templates, options.section.id, options.sections);
  return modules.map((module) => {
    const videoTitle = findSampleVideoTitle(samples, module.title);
    return videoTitle ? { ...module, subtitle: videoTitle } : module;
  });
}

const CHINESE_SIDE_MODULES: LearningModule[] = [
  {
    id: 'cn-sync-reading',
    title: '同步阅读',
    subtitle: '阅读理解训练',
    icon: <BookMarked size={22} strokeWidth={2.4} />,
    accent: '#2563EB',
    accentSoft: 'rgba(37, 99, 235, 0.14)',
  },
  {
    id: 'cn-sync-composition',
    title: '同步作文',
    subtitle: '写作同步练',
    icon: <Feather size={22} strokeWidth={2.4} />,
    accent: '#DB2777',
    accentSoft: 'rgba(219, 39, 119, 0.14)',
  },
  {
    id: 'cn-hanzi-trace',
    title: '汉字描红',
    subtitle: '书写规范练',
    icon: <PenLine size={22} strokeWidth={2.4} />,
    accent: '#D97706',
    accentSoft: 'rgba(234, 88, 12, 0.14)',
  },
];

/** 数学课本同步学：单元 → 节目录（原型） */
const MATH_TEXTBOOK_UNIT_NODES: DirTreeNode[] = [
  {
    id: 'math-unit-1',
    label: '第一单元 负数',
    level: 1,
    knowledgePoints: [],
    children: [
      {
        id: 'math-unit-1-section-1',
        label: '负数（一）',
        level: 2,
        knowledgePoints: ['负数的意义', '正数和负数', '相反意义的量'],
        children: [],
      },
      {
        id: 'math-unit-1-section-2',
        label: '负数（二）',
        level: 2,
        knowledgePoints: ['负数的比较', '数轴上的负数', '负数的实际应用'],
        children: [],
      },
    ],
  },
  {
    id: 'math-unit-2',
    label: '第二单元 百分数（二）',
    level: 1,
    knowledgePoints: [],
    children: [
      { id: 'math-unit-2-section-1', label: '折扣', level: 2, knowledgePoints: ['折扣的意义', '折扣问题', '折扣的综合应用'], children: [] },
      { id: 'math-unit-2-section-2', label: '成数', level: 2, knowledgePoints: ['成数的意义', '成数问题', '成数与百分数'], children: [] },
      { id: 'math-unit-2-section-3', label: '税率', level: 2, knowledgePoints: ['税率的意义', '应纳税额', '税率应用'], children: [] },
      { id: 'math-unit-2-section-4', label: '利率', level: 2, knowledgePoints: ['利率的意义', '利息计算', '本金与利息'], children: [] },
      { id: 'math-unit-2-section-5', label: '解决实际问题', level: 2, knowledgePoints: ['百分数实际问题', '数量关系', '综合应用'], children: [] },
      { id: 'math-unit-2-section-6', label: '整理与复习', level: 2, knowledgePoints: ['单元知识梳理', '易错题复习', '综合训练'], children: [] },
    ],
  },
  {
    id: 'math-unit-3',
    label: '第三单元 圆柱与圆锥',
    level: 1,
    knowledgePoints: [],
    children: [
      { id: 'math-unit-3-section-1', label: '圆柱', level: 2, knowledgePoints: ['圆柱的认识', '圆柱的表面积', '圆柱的体积'], children: [] },
      { id: 'math-unit-3-section-2', label: '圆锥', level: 2, knowledgePoints: ['圆锥的认识', '圆锥的体积', '圆柱与圆锥'], children: [] },
      { id: 'math-unit-3-section-3', label: '整理与复习', level: 2, knowledgePoints: ['单元知识梳理', '图形体积比较', '综合应用'], children: [] },
    ],
  },
];

/** 科学课本同步学：单元 → 节目录（原型） */
const SCIENCE_TEXTBOOK_UNIT_NODES: DirTreeNode[] = [
  {
    id: 'science-unit-1',
    label: '第1单元 小小工程师',
    level: 1,
    knowledgePoints: [],
    children: [
      { id: 'science-unit-1-section-1', label: '1.1 了解我们的住房', level: 2, knowledgePoints: ['住房的基本功能', '住房结构', '工程与生活'], children: [] },
      { id: 'science-unit-1-section-2', label: '1.2 认识工程', level: 2, knowledgePoints: ['工程的含义', '工程的要素', '工程师的工作'], children: [] },
      { id: 'science-unit-1-section-3', label: '1.3 建造塔台', level: 2, knowledgePoints: ['塔台设计', '结构稳定性', '材料选择'], children: [] },
      { id: 'science-unit-1-section-4', label: '1.4 设计塔台模型', level: 2, knowledgePoints: ['方案设计', '模型制作', '设计改进'], children: [] },
      { id: 'science-unit-1-section-5', label: '1.5 制作塔台模型', level: 2, knowledgePoints: ['模型搭建', '分工合作', '制作规范'], children: [] },
      { id: 'science-unit-1-section-6', label: '1.6 测试塔台模型', level: 2, knowledgePoints: ['模型测试', '承重测试', '稳定性测试'], children: [] },
      { id: 'science-unit-1-section-7', label: '1.7 评估改进塔台模型', level: 2, knowledgePoints: ['项目评估', '问题分析', '迭代改进'], children: [] },
    ],
  },
  {
    id: 'science-unit-2',
    label: '第2单元 生物的多样性',
    level: 1,
    knowledgePoints: [],
    children: [
      { id: 'science-unit-2-section-1', label: '2.1 校园生物大搜索', level: 2, knowledgePoints: ['校园生物观察', '生物分类', '调查记录'], children: [] },
      { id: 'science-unit-2-section-2', label: '2.2 制作校园生物分布图', level: 2, knowledgePoints: ['分布图制作', '信息整理', '生物多样性'], children: [] },
    ],
  },
];

/** 地理课本同步学：章节目录 */
const GEOGRAPHY_TEXTBOOK_NODES: DirTreeNode[] = [
  {
    id: 'geography-chapter-7',
    label: '第七章 我们生活的大洲——亚洲',
    level: 1,
    knowledgePoints: [],
    children: [
      {
        id: 'geography-chapter-7-section-1',
        label: '第一节 自然环境_第1课时 世界第一大洲 地势起伏大，长河众多',
        level: 2,
        knowledgePoints: ['亚洲位置范围', '地形地势', '长河分布'],
        children: [],
      },
      {
        id: 'geography-chapter-7-section-2',
        label: '第一节 自然环境_第2课时 多样的气候',
        level: 2,
        knowledgePoints: ['气候类型', '季风气候', '气候差异'],
        children: [],
      },
      { id: 'geography-chapter-7-section-3', label: '第二节 人文环境', level: 2, knowledgePoints: ['人口与城市', '文化多样性', '经济发展'], children: [] },
    ],
  },
  {
    id: 'geography-chapter-8',
    label: '第八章 我们邻近的地区和国家',
    level: 1,
    knowledgePoints: [],
    children: [
      { id: 'geography-chapter-8-section-1', label: '第一节 日本_第1课时 多火山、地震的岛国', level: 2, knowledgePoints: ['岛国位置', '火山地震', '地形特征'], children: [] },
      { id: 'geography-chapter-8-section-2', label: '第一节 日本_第2课时 人口老龄化社会 对外依赖强的经济', level: 2, knowledgePoints: ['人口老龄化', '资源短缺', '外向型经济'], children: [] },
      { id: 'geography-chapter-8-section-3', label: '第二节 东南亚_第1课时 “十字路口”的位置 热带气候与农业生产', level: 2, knowledgePoints: ['交通位置', '热带气候', '农业生产'], children: [] },
      { id: 'geography-chapter-8-section-4', label: '第二节 东南亚_第2课时 山河相间与城市分布', level: 2, knowledgePoints: ['山河相间', '城市分布', '交通与城市'], children: [] },
      { id: 'geography-chapter-8-section-5', label: '第三节 印度_第1课时 世界人口大国', level: 2, knowledgePoints: ['人口大国', '人口分布', '人口增长'], children: [] },
      { id: 'geography-chapter-8-section-6', label: '第三节 印度_第2课时 热带季风气候与粮食生产 发展迅速的服务外包产业', level: 2, knowledgePoints: ['热带季风', '粮食生产', '服务外包'], children: [] },
    ],
  },
];

/** 生物课本同步学：第三单元绿色植物目录 */
const BIOLOGY_TEXTBOOK_NODES: DirTreeNode[] = [
  {
    id: 'biology-chapter-1',
    label: '第三单元 生物圈中的绿色植物_第一章 生物圈中有哪些绿色植物',
    level: 1,
    knowledgePoints: [],
    children: [
      { id: 'biology-chapter-1-section-1', label: '第一节 藻类植物', level: 2, knowledgePoints: ['藻类特征', '生活环境', '与人类关系'], children: [] },
      { id: 'biology-chapter-1-section-2', label: '第二节 苔藓和蕨类植物', level: 2, knowledgePoints: ['苔藓特征', '蕨类特征', '生活环境比较'], children: [] },
      { id: 'biology-chapter-1-section-3', label: '第三节 种子植物', level: 2, knowledgePoints: ['种子植物特征', '裸子植物', '被子植物'], children: [] },
    ],
  },
  {
    id: 'biology-chapter-2',
    label: '第三单元 生物圈中的绿色植物_第二章 被子植物的一生',
    level: 1,
    knowledgePoints: [],
    children: [
      { id: 'biology-chapter-2-section-1', label: '第一节 种子的萌发', level: 2, knowledgePoints: ['萌发条件', '萌发过程', '种子结构'], children: [] },
      { id: 'biology-chapter-2-section-2', label: '第二节 植株的生长', level: 2, knowledgePoints: ['根的生长', '芽的发育', '植株生长需要'], children: [] },
      { id: 'biology-chapter-2-section-3', label: '第三节 开花和结果', level: 2, knowledgePoints: ['花的结构', '传粉与受精', '果实和种子'], children: [] },
    ],
  },
  {
    id: 'biology-chapter-3',
    label: '第三单元 生物圈中的绿色植物_第三章 绿色植物与生物圈的水循环',
    level: 1,
    knowledgePoints: [],
    children: [
      { id: 'biology-chapter-3-section-1', label: '第一节 水分进入植物体内的途径', level: 2, knowledgePoints: ['根吸水', '导管运输', '蒸腾作用'], children: [] },
      { id: 'biology-chapter-3-section-2', label: '第二节 绿色植物参与生物圈的水循环', level: 2, knowledgePoints: ['蒸腾与降水', '水循环过程', '植物的作用'], children: [] },
    ],
  },
];

/** 语文教材同步学：单元 → 课文目录（原型） */
const CHINESE_UNIT_NODES: DirTreeNode[] = [
  {
    id: 'unit-1',
    label: '第一单元',
    level: 1,
    knowledgePoints: [],
    children: [
      { id: 'unit-1-l1', label: '1 草原', level: 2, knowledgePoints: [], children: [] },
      { id: 'unit-1-l2', label: '2 丁香结', level: 2, knowledgePoints: [], children: [] },
      { id: 'unit-1-l3', label: '3 古诗词三首_宿建德江', level: 2, knowledgePoints: [], children: [] },
      { id: 'unit-1-l4', label: '3 古诗词三首_六月二十七日望湖楼醉书', level: 2, knowledgePoints: [], children: [] },
      { id: 'unit-1-l5', label: '3 古诗词三首_西江月·夜行黄沙道中', level: 2, knowledgePoints: [], children: [] },
      { id: 'unit-1-l6', label: '习作：变形记', level: 2, knowledgePoints: [], children: [] },
      { id: 'unit-1-l7', label: '语文园地一', level: 2, knowledgePoints: [], children: [] },
      { id: 'unit-1-l8', label: '单元总结一', level: 2, knowledgePoints: [], children: [] },
    ],
  },
  {
    id: 'unit-2',
    label: '第二单元',
    level: 1,
    knowledgePoints: [],
    children: [
      { id: 'unit-2-l1', label: '4 七律·长征', level: 2, knowledgePoints: [], children: [] },
      { id: 'unit-2-l2', label: '5 狼牙山五壮士', level: 2, knowledgePoints: [], children: [] },
      { id: 'unit-2-l3', label: '6 开国大典', level: 2, knowledgePoints: [], children: [] },
      { id: 'unit-2-l4', label: '7 我的战友邱少云', level: 2, knowledgePoints: [], children: [] },
      { id: 'unit-2-l5', label: '口语交际：演讲', level: 2, knowledgePoints: [], children: [] },
      { id: 'unit-2-l6', label: '习作：多彩的活动', level: 2, knowledgePoints: [], children: [] },
      { id: 'unit-2-l7', label: '语文园地二', level: 2, knowledgePoints: [], children: [] },
      { id: 'unit-2-l8', label: '单元总结二', level: 2, knowledgePoints: [], children: [] },
    ],
  },
];

/** 语文同步阅读：单元主题 → 节目录（原型） */
const CHINESE_SYNC_READING_NODES: DirTreeNode[] = [
  {
    id: 'reading-unit-1',
    label: '第一单元 主次和详略',
    level: 1,
    knowledgePoints: [],
    children: [],
  },
  {
    id: 'reading-unit-2',
    label: '第二单元 梗概、交流感受',
    level: 1,
    knowledgePoints: [],
    children: [],
  },
  {
    id: 'reading-unit-3',
    label: '第三单元 体会情感表达',
    level: 1,
    knowledgePoints: [],
    children: [],
  },
  {
    id: 'reading-unit-4',
    label: '第四单元 体会人物品质',
    level: 1,
    knowledgePoints: [],
    children: [],
  },
  {
    id: 'reading-unit-5',
    label: '第五单元 说明观点',
    level: 1,
    knowledgePoints: [],
    children: [],
  },
  {
    id: 'reading-unit-6',
    label: '第六单元 整理资料',
    level: 1,
    knowledgePoints: [],
    children: [],
  },
];

/** 同步作文：独立主题目录 */
const CHINESE_SYNC_COMPOSITION_NODES: DirTreeNode[] = [
  {
    id: 'composition-unit-1',
    label: '第一单元主题 变形记',
    level: 1,
    knowledgePoints: [],
    children: [],
  },
  {
    id: 'composition-unit-2',
    label: '第二单元主题 多彩的活动',
    level: 1,
    knowledgePoints: [],
    children: [],
  },
  {
    id: 'composition-unit-3',
    label: '第三单元主题 ______让生活更美好',
    level: 1,
    knowledgePoints: [],
    children: [],
  },
];

/** 汉字描红：单元 → 课文目录 */
const CHINESE_HANZI_TRACE_NODES: DirTreeNode[] = [
  {
    id: 'hanzi-unit-1',
    label: '第一单元',
    level: 1,
    knowledgePoints: [],
    children: [
      { id: 'hanzi-unit-1-l1', label: '1 草原', level: 2, knowledgePoints: [], children: [] },
      { id: 'hanzi-unit-1-l2', label: '2 丁香结', level: 2, knowledgePoints: [], children: [] },
      { id: 'hanzi-unit-1-l3', label: '3 古诗词三首', level: 2, knowledgePoints: [], children: [] },
    ],
  },
  {
    id: 'hanzi-unit-2',
    label: '第二单元',
    level: 1,
    knowledgePoints: [],
    children: [
      { id: 'hanzi-unit-2-l1', label: '4 七律·长征', level: 2, knowledgePoints: [], children: [] },
      { id: 'hanzi-unit-2-l2', label: '5 狼牙山五壮士', level: 2, knowledgePoints: [], children: [] },
      { id: 'hanzi-unit-2-l3', label: '6 开国大典', level: 2, knowledgePoints: [], children: [] },
      { id: 'hanzi-unit-2-l4', label: '7 我的战友邱少云', level: 2, knowledgePoints: [], children: [] },
    ],
  },
  {
    id: 'hanzi-unit-3',
    label: '第三单元',
    level: 1,
    knowledgePoints: [],
    children: [
      { id: 'hanzi-unit-3-l1', label: '8 竹节人', level: 2, knowledgePoints: [], children: [] },
    ],
  },
];

/** 英语教材同步学：Module → Unit / Project 目录（原型） */
const ENGLISH_MODULE_NODES: DirTreeNode[] = [
  {
    id: 'english-unit-1',
    label: 'Unit 1  Amazing places',
    level: 1,
    knowledgePoints: [],
    children: [
      { id: 'english-unit-1-intro', label: '走进单元', level: 2, knowledgePoints: [], children: [] },
      { id: 'english-unit-1-part-a', label: 'Part A  What famous places do you know?', level: 2, knowledgePoints: [], children: [] },
      { id: 'english-unit-1-part-b', label: 'Part B  What makes a trip special?', level: 2, knowledgePoints: [], children: [] },
      { id: 'english-unit-1-part-c', label: 'Part C  Project: Make a holiday scrapbook', level: 2, knowledgePoints: [], children: [] },
      { id: 'english-unit-1-review', label: '单元复习', level: 2, knowledgePoints: [], children: [] },
    ],
  },
  {
    id: 'english-unit-2',
    label: 'Unit 2  Getting together',
    level: 1,
    knowledgePoints: [],
    children: [
      { id: 'english-unit-2-intro', label: '走进单元', level: 2, knowledgePoints: [], children: [] },
      { id: 'english-unit-2-part-a', label: 'Part A  How can festivals bring us together?', level: 2, knowledgePoints: [], children: [] },
      { id: 'english-unit-2-part-b', label: 'Part B  How can big events bring us together?', level: 2, knowledgePoints: [], children: [] },
      { id: 'english-unit-2-part-c', label: 'Part C  Project: Present photos from school events', level: 2, knowledgePoints: [], children: [] },
    ],
  },
];

/** 词汇精讲：按教材单元组织 */
const ENGLISH_VOCABULARY_NODES: DirTreeNode[] = [
  { id: 'vocab-unit-1', label: 'Unit 1  Amazing landmarks', level: 1, knowledgePoints: [], children: [] },
  { id: 'vocab-unit-2', label: 'Unit 2  Getting together', level: 1, knowledgePoints: [], children: [] },
  { id: 'vocab-unit-3', label: 'Unit 3  Healthy life', level: 1, knowledgePoints: [], children: [] },
  { id: 'vocab-unit-4', label: 'Unit 4  Managing money well', level: 1, knowledgePoints: [], children: [] },
  { id: 'vocab-unit-5', label: 'Unit 5  Exploring space', level: 1, knowledgePoints: [], children: [] },
  { id: 'vocab-unit-6', label: 'Unit 6  Energy, nature and us', level: 1, knowledgePoints: [], children: [] },
];

/** 外教口语：按教材单元组织 */
const ENGLISH_SPEAKING_NODES: DirTreeNode[] = [
  { id: 'speaking-unit-1', label: 'Unit 1  Amazing landmarks', level: 1, knowledgePoints: [], children: [] },
  { id: 'speaking-unit-2', label: 'Unit 2  Getting together', level: 1, knowledgePoints: [], children: [] },
  { id: 'speaking-unit-3', label: 'Unit 3  Healthy life', level: 1, knowledgePoints: [], children: [] },
  { id: 'speaking-unit-4', label: 'Unit 4  Managing money well', level: 1, knowledgePoints: [], children: [] },
];

function makeNodeId(name: string, parentId?: string) {
  if (!parentId || parentId === 'root') return name;
  return `${parentId}-${name}`;
}

function collectKnowledgePoints(raw: RawDirNode): string[] {
  if (Array.isArray(raw.children) && raw.children.length > 0) {
    return raw.children.map((child) => child.name);
  }
  return [raw.name];
}

function buildDirTree(rawList: RawDirNode[], parentId: string, level: number): DirTreeNode[] {
  return (rawList || []).map((raw) => {
    const id = makeNodeId(raw.name, parentId);
    const atLeafLevel = !raw.children?.length;
    const children =
      !atLeafLevel && Array.isArray(raw.children) && raw.children.length > 0
        ? buildDirTree(raw.children, id, level + 1)
        : [];
    return {
      id,
      label: raw.name,
      level,
      knowledgePoints: atLeafLevel ? collectKnowledgePoints(raw) : [],
      children,
    };
  });
}

function findPathIds(nodes: DirTreeNode[], targetId: string, trail: string[] = []): string[] | null {
  for (const n of nodes) {
    const next = [...trail, n.id];
    if (n.id === targetId) return next;
    if (n.children.length) {
      const hit = findPathIds(n.children, targetId, next);
      if (hit) return hit;
    }
  }
  return null;
}

function findFirstLeaf(nodes: DirTreeNode[]): DirTreeNode | null {
  for (const n of nodes) {
    if (!n.children.length) return n;
    const leaf = findFirstLeaf(n.children);
    if (leaf) return leaf;
  }
  return null;
}

function findNodeById(nodes: DirTreeNode[], id: string): DirTreeNode | null {
  for (const n of nodes) {
    if (n.id === id) return n;
    const hit = findNodeById(n.children, id);
    if (hit) return hit;
  }
  return null;
}

function collectExpandableIds(nodes: DirTreeNode[]): string[] {
  return nodes.flatMap((node) => [
    ...(node.children.length > 0 ? [node.id] : []),
    ...collectExpandableIds(node.children),
  ]);
}

function getStoredDirectorySelections(): StoredDirectorySelections {
  try {
    const raw = window.localStorage.getItem(SYNC_DIRECTORY_SELECTION_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredDirectorySelections) : {};
  } catch {
    return {};
  }
}

function saveStoredDirectorySelections(selections: StoredDirectorySelections) {
  try {
    window.localStorage.setItem(SYNC_DIRECTORY_SELECTION_STORAGE_KEY, JSON.stringify(selections));
  } catch {
    // Local storage may be unavailable in privacy-restricted environments.
  }
}

/** 知识树 L2 作为「章」；若无 L2 则退回 L1 */
function collectChapters(tree: DirTreeNode[]): DirTreeNode[] {
  const chapters: DirTreeNode[] = [];
  tree.forEach((unit) => {
    if (unit.children.length > 0) chapters.push(...unit.children);
    else chapters.push(unit);
  });
  return chapters;
}

/** 章下 L3 作为「节」；若无子节点则章本身即节 */
function collectSections(chapter: DirTreeNode | null): DirTreeNode[] {
  if (!chapter) return [];
  if (chapter.children.length > 0) return chapter.children;
  return [chapter];
}

function recommendedUnitQuestionCount(subject: SubjectType, chapter: DirTreeNode | null, chapterOnly: boolean) {
  const sections = collectSections(chapter);
  if (chapterOnly || sections.length === 0) return 10;
  if (assessmentShowsKnowledgePoints(subject)) {
    const knowledgeCount = sections.reduce((sum, section) => sum + (section.knowledgePoints?.length || 0), 0);
    return Math.min(40, Math.max(1, (knowledgeCount || sections.length) * 2));
  }
  return Math.min(40, Math.max(1, sections.length * 2));
}

const CN_ORDINALS = [
  '一', '二', '三', '四', '五', '六', '七', '八', '九', '十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
];

function ordinalLabel(prefix: '章' | '节', index: number) {
  const n = CN_ORDINALS[index] || String(index + 1);
  return `第${n}${prefix}`;
}

function ChapterSectionPicker({
  chapters,
  chapterId,
  onChapterChange,
}: {
  chapters: DirTreeNode[];
  chapterId: string;
  onChapterChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const chapter = chapters.find((item) => item.id === chapterId) || chapters[0] || null;

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  return (
    <div ref={rootRef} className="relative min-w-0 flex-1">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="flex h-[30px] w-full items-center gap-1.5 rounded-lg border border-white/70 bg-white/55 py-0 pl-2.5 pr-2 text-left transition-colors hover:bg-white/80"
      >
        <span className="flex min-w-0 flex-1 items-center gap-1 text-[13px] font-bold">
          <span className="min-w-0 truncate text-[#7B61FF]">
            {chapter?.label || '选择单元'}
          </span>
          <ChevronDown
            size={12}
            className={`shrink-0 text-[#7B61FF] transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </span>
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-[calc(100%+6px)] z-50 max-h-[340px] min-w-[260px] overflow-y-auto rounded-2xl border border-white/80 bg-white py-2 shadow-[0_16px_40px_rgba(80,90,160,0.18)] no-scrollbar"
            role="listbox"
          >
            {chapters.map((unit) => {
              const selected = unit.id === chapterId;
              return (
                <button
                  key={unit.id}
                  type="button"
                  onClick={() => {
                    onChapterChange(unit.id);
                    setOpen(false);
                  }}
                  className={`mx-2 flex w-[calc(100%-16px)] items-center gap-2 rounded-lg px-2 py-2.5 text-left transition-colors ${
                    selected ? 'bg-[#7B61FF]/10 text-[#5B4AD1]' : 'text-slate-700 hover:bg-[#EEF1F6]'
                  }`}
                >
                  <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">{unit.label}</span>
                  {selected ? <Check size={13} className="shrink-0 text-[#7B61FF]" strokeWidth={3} /> : null}
                </button>
              );
            })}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

const TEACHER_BY_SUBJECT: Partial<Record<
  SubjectType,
  { name: string; title: string; tags: string[]; intro: string; highlight: string }
>> = {
  数学: {
    name: '林启明',
    title: '特级教师 · 数学名师',
    tags: ['教材同步', '思维训练', '中考命题'],
    intro:
      '深耕初中数学二十余年，擅长把抽象概念讲透、把课本例题讲活。课程紧扣教材节奏，带你边看视频边完成训练与测试。',
    highlight: '已帮助 12 万+ 学生建立清晰的数学知识体系',
  },
  语文: {
    name: '苏晚晴',
    title: '高级教师 · 语文名师',
    tags: ['文言精读', '作文提升', '阅读理解'],
    intro:
      '专注初中语文教材精讲与读写训练，善于以课文为锚点串联考点。视频讲解细腻生动，配套训练帮助你扎实过关。',
    highlight: '多年一线教研经验，擅长把课文读成方法',
  },
  英语: {
    name: '陈诺',
    title: '高级教师 · 英语名师',
    tags: ['教材同步', '听说读写', '语法精讲'],
    intro:
      '长期负责初中英语同步课程研发，强调情景化输入与即时训练。跟教材走、跟视频练，稳步提升综合能力。',
    highlight: '同步课覆盖人教版核心单元与重难点',
  },
  科学: {
    name: '周知远',
    title: '高级教师 · 科学名师',
    tags: ['实验探究', '跨学科思维', '现象解析'],
    intro:
      '长期从事初中科学课程研发，以实验和真实现象帮助学生理解核心概念，建立科学探究方法。',
    highlight: '覆盖物质、生命与地球宇宙主题的同步学习',
  },
  地理: {
    name: '许知行',
    title: '高级教师 · 地理名师',
    tags: ['地图阅读', '区域认知', '地理实践'],
    intro: '以地图、案例和真实世界为线索，帮助学生建立空间认知与地理思维。',
    highlight: '覆盖地球、自然环境与人文地理主题的同步学习',
  },
  生物: {
    name: '叶青禾',
    title: '高级教师 · 生物名师',
    tags: ['生命科学', '观察探究', '生态认知'],
    intro: '通过观察、实验和生活案例，带学生认识丰富多彩的生命世界。',
    highlight: '覆盖生物特征、植物动物与生态环境主题的同步学习',
  },
};

function ModuleCard({
  module,
  onClick,
  showWatchStatus = true,
  dense = false,
}: {
  module: LearningModule;
  onClick: () => void;
  showWatchStatus?: boolean;
  dense?: boolean;
}) {
  const isCompact = !module.subtitle;
  const isHorizontal =
    isCompact ||
    module.id.startsWith('cn-') ||
    module.id === 'vocabulary-lecture' ||
    module.id === 'foreign-teacher-speaking' ||
    module.id === 'sync-grammar-lecture';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex min-w-0 flex-1 rounded-2xl border border-slate-100 bg-white text-left shadow-sm transition-all hover:border-violet-200 hover:bg-violet-50/30 active:scale-[0.99] ${
        dense ? 'p-2' : 'p-3.5'
      } ${
        isHorizontal ? 'items-center gap-3' : 'flex-col items-start gap-3'
      }`}
    >
      <div
        className={`flex shrink-0 items-center justify-center ${dense ? 'h-8 w-8 rounded-xl' : 'h-10 w-10 rounded-2xl'}`}
        style={{ backgroundColor: module.accentSoft, color: module.accent }}
      >
        {module.icon}
      </div>
      <div className={`min-w-0 ${isHorizontal ? 'flex-1' : 'w-full'}`}>
        <p className="truncate text-[13px] font-black text-slate-800">{module.title}</p>
        {module.subtitle ? (
          <p className="mt-0.5 line-clamp-2 text-[11px] font-semibold leading-snug text-slate-400">
            {module.subtitle}
          </p>
        ) : null}
      </div>
      {showWatchStatus && isHorizontal ? (
        <WatchStatusBadge moduleId={module.id} />
      ) : showWatchStatus ? (
        <WatchStatusBadge moduleId={module.id} className="absolute right-3.5 top-3.5" />
      ) : null}
    </button>
  );
}

function ModuleBlock({
  title,
  description,
  modules,
  onSelect,
}: {
  title: string;
  description: string;
  modules: LearningModule[];
  onSelect: (m: LearningModule) => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-2.5 shrink-0">
        <h3 className="text-[15px] font-black text-slate-800">{title}</h3>
        <p className="mt-0.5 text-[11px] font-semibold text-slate-400">{description}</p>
      </div>
      <div className="flex min-h-0 flex-1 gap-2.5">
        {modules.map((m) => (
          <ModuleCard key={m.id} module={m} onClick={() => onSelect(m)} />
        ))}
      </div>
    </div>
  );
}

function IndependentModuleRow({
  modules,
  onSelect,
  title,
}: {
  modules: LearningModule[];
  onSelect: (m: LearningModule) => void;
  title?: string;
}) {
  const grid = (
    <div
      className={`grid min-w-0 gap-3 ${title ? 'min-h-[72px]' : 'h-[87px] shrink-0'}`}
      style={{ gridTemplateColumns: `repeat(${modules.length}, minmax(0, 1fr))` }}
    >
      {modules.map((m) => (
        <button
          key={m.id}
          type="button"
          onClick={() => onSelect(m)}
          className="group flex min-h-0 min-w-0 items-center gap-2.5 rounded-2xl border border-slate-100 bg-white px-3.5 py-2.5 text-left shadow-sm transition-all hover:border-violet-200 hover:bg-violet-50/30 active:scale-[0.99]"
        >
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: m.accentSoft, color: m.accent }}
          >
            {m.icon}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-black text-slate-800">{m.title}</p>
            {m.subtitle ? (
              <p className="truncate text-[10px] font-semibold text-slate-400">{m.subtitle}</p>
            ) : null}
          </div>
        </button>
      ))}
    </div>
  );

  if (!title) return grid;

  return (
    <div className="shrink-0 rounded-[24px] border border-white/80 bg-white/55 p-3 shadow-[0_12px_40px_rgba(99,102,241,0.10)]">
      <h3 className="mb-2 px-0.5 text-[13px] font-black text-slate-800">{title}</h3>
      {grid}
    </div>
  );
}

function catalogToDirTree(nodes: CatalogNode[], level = 1): DirTreeNode[] {
  return nodes.map((node) => ({
    id: node.id,
    label: node.label,
    level,
    knowledgePoints: node.knowledgePoints || [],
    children: catalogToDirTree(node.children, level + 1),
  }));
}

function DirectoryListRow({
  label,
  isLastLearned = false,
  onClick,
  variant = 'lesson',
  statusId,
}: {
  label: string;
  isLastLearned?: boolean;
  onClick: () => void;
  variant?: 'lesson' | 'video';
  statusId?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex min-h-[52px] w-full shrink-0 items-center gap-3 rounded-2xl border px-3.5 py-2.5 text-left shadow-sm transition-all hover:border-violet-200 hover:bg-violet-50/30 active:scale-[0.99] ${
        isLastLearned
          ? 'border-[#7B61FF]/35 bg-violet-50/60'
          : 'border-slate-100 bg-white'
      }`}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[rgba(123,97,255,0.12)] text-[#5B4AD1]">
        {variant === 'video' ? (
          <Play size={18} strokeWidth={2.4} fill="currentColor" className="ml-0.5" />
        ) : (
          <BookOpen size={18} strokeWidth={2.4} />
        )}
      </div>
      <p className="min-w-0 flex-1 line-clamp-2 text-[14px] font-black leading-snug text-slate-800">
        {label}
      </p>
      {isLastLearned ? (
        <span className="shrink-0 rounded-full bg-[#7B61FF]/12 px-2 py-0.5 text-[10px] font-black text-[#5B4AD1]">
          上次学到
        </span>
      ) : null}
      {statusId ? <WatchStatusBadge moduleId={statusId} /> : null}
      <ChevronRight size={16} className="shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-[#7B61FF]" />
    </button>
  );
}

function ModuleListRow({
  module,
  onClick,
}: {
  module: LearningModule;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-h-[52px] w-full shrink-0 flex-1 items-center gap-3 rounded-2xl border border-slate-100 bg-white px-3.5 py-2.5 text-left shadow-sm transition-all hover:border-violet-200 hover:bg-violet-50/30 active:scale-[0.99]"
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: module.accentSoft, color: module.accent }}
      >
        {module.icon}
      </div>
      <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-[14px] font-black leading-snug text-slate-800">{module.title}</p>
        {module.subtitle ? (
          <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-400">
            {module.subtitle}
          </p>
        ) : null}
      </div>
      <WatchStatusBadge moduleId={module.id} />
    </button>
  );
}

function ModuleListBlock({
  title,
  description,
  modules,
  onSelect,
  columns = 1,
  visibleRows,
  showHeader = true,
}: {
  title: string;
  description?: string;
  modules: LearningModule[];
  onSelect: (m: LearningModule) => void;
  columns?: 1 | 2;
  visibleRows?: 3 | 5;
  showHeader?: boolean;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {showHeader ? (
        <div className="mb-2.5 flex shrink-0 items-center justify-between gap-3">
          <h3 className="text-[15px] font-black text-slate-800">{title}</h3>
          {description ? (
            <p className="truncate text-[11px] font-semibold text-slate-400">{description}</p>
          ) : null}
        </div>
      ) : null}
      <div
        className={
          columns === 2
            ? 'grid min-h-0 flex-1 auto-rows-[52px] grid-cols-2 grid-rows-3 gap-2 overflow-y-auto rounded-2xl bg-slate-50/70 p-2 no-scrollbar'
            : visibleRows === 5
              ? 'grid min-h-0 flex-1 auto-rows-[17%] grid-cols-1 gap-2 overflow-y-auto pr-1 no-scrollbar'
              : visibleRows === 3
                ? 'grid min-h-0 flex-1 auto-rows-[29%] grid-cols-1 gap-2 overflow-y-auto pr-1 no-scrollbar'
            : 'flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto pr-1 no-scrollbar'
        }
      >
        {modules.length > 0 ? (
          modules.map((m) => (
            <ModuleListRow key={m.id} module={m} onClick={() => onSelect(m)} />
          ))
        ) : (
          <div className="col-span-full flex min-h-[140px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/65 px-4 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-[#7B61FF]">
              <Clapperboard size={21} />
            </span>
            <p className="mt-2.5 text-[13px] font-black text-slate-700">该目录暂无视频</p>
            <p className="mt-1 text-[11px] font-semibold text-slate-400">换个目录看看吧</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ModuleGridBlock({
  title,
  description,
  modules,
  onSelect,
}: {
  title: string;
  description?: string;
  modules: LearningModule[];
  onSelect: (m: LearningModule) => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="mb-2.5 flex shrink-0 items-center justify-between gap-3">
        <h3 className="text-[15px] font-black text-slate-800">{title}</h3>
        {description ? (
          <p className="truncate text-[11px] font-semibold text-slate-400">{description}</p>
        ) : null}
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-3 gap-2.5">
        {modules.map((module) => (
          <ModuleCard key={module.id} module={module} onClick={() => onSelect(module)} />
        ))}
      </div>
    </div>
  );
}

function UnitTestBar({ onUnitTest }: { onUnitTest: () => void }) {
  return (
    <button
      type="button"
      onClick={onUnitTest}
      className="group flex h-[52px] w-full shrink-0 items-center justify-center gap-2 rounded-2xl border border-[#D97706]/20 bg-[linear-gradient(135deg,#FEF3C7_0%,#FDE68A_100%)] px-4 text-[#B45309] shadow-[0_8px_20px_rgba(217,119,6,0.12)] transition-all hover:-translate-y-0.5 active:scale-[0.98]"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/80 transition-transform group-hover:scale-110">
        <ListChecks size={16} strokeWidth={2.6} />
      </span>
      <span className="text-[15px] font-black">单元测</span>
      <span className="text-[10px] font-semibold text-[#B45309]/70">当前单元</span>
    </button>
  );
}

function LearningPathPanel({
  learnModules,
  practiceVideos,
  lastVideoId,
  practiceDone,
  onSelectVideo,
  onPractice,
}: {
  learnModules: LearningModule[];
  practiceVideos: LearningModule[];
  lastVideoId?: string | null;
  practiceDone?: boolean;
  onSelectVideo: (module: LearningModule) => void;
  onPractice: () => void;
}) {
  let step = 0;

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col rounded-[28px] border border-white/80 bg-white/55 p-4 shadow-[0_12px_40px_rgba(99,102,241,0.10)]">
      <div className="min-h-0 flex-1 overflow-y-auto pr-1 no-scrollbar">
        <div className="relative pl-8">
          {learnModules.length > 0 ? (
            <div className="mb-3">
              <h4 className="text-[14px] font-black text-slate-800">名师带你学</h4>
              <p className="mt-0.5 text-[11px] font-semibold text-slate-400">跟着名师学透知识点</p>
            </div>
          ) : null}

          <Annotatable annotationId="subject.sync.textbook-videos" className="flex flex-col gap-2.5">
            {learnModules.map((module) => {
              step += 1;
              return (
                <LearningPathVideoRow
                  key={module.id}
                  step={step}
                  module={module}
                  tag={module.subtitle || '知识精讲'}
                  isLastLearned={module.id === lastVideoId}
                  onClick={() => onSelectVideo(module)}
                />
              );
            })}
          </Annotatable>

          <div className="mb-3 mt-4">
            <h4 className="text-[14px] font-black text-slate-800">同步巩固练</h4>
            <p className="mt-0.5 text-[11px] font-semibold text-slate-400">对点练习，举一反三</p>
          </div>

          <div className="flex flex-col gap-2.5">
            {practiceVideos.map((module) => {
              step += 1;
              return (
                <LearningPathVideoRow
                  key={module.id}
                  step={step}
                  module={module}
                  tag={module.subtitle || '经典题型'}
                  isLastLearned={module.id === lastVideoId}
                  onClick={() => onSelectVideo(module)}
                />
              );
            })}
            <Annotatable annotationId="subject.sync.lesson-practice">
              <LearningPathPracticeRow step={step + 1} practiced={Boolean(practiceDone)} onPractice={onPractice} />
            </Annotatable>
          </div>
        </div>
      </div>
    </section>
  );
}

function LearningPathVideoRow({
  step,
  module,
  tag,
  isLastLearned = false,
  onClick,
}: {
  step: number;
  module: LearningModule;
  tag: string;
  isLastLearned?: boolean;
  onClick: () => void;
}) {
  return (
    <div className="relative">
      <span className="absolute -left-8 top-1/2 flex h-[22px] w-[22px] -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-[11px] font-black text-slate-500">
        {step}
      </span>
      <button
        type="button"
        onClick={onClick}
        className={`group flex w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left shadow-sm transition-all hover:border-violet-200 hover:bg-violet-50/30 active:scale-[0.99] ${
          isLastLearned ? 'border-[#7B61FF]/35 bg-violet-50/60' : 'border-slate-100 bg-white'
        }`}
      >
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: module.accentSoft, color: module.accent }}
        >
          <Clapperboard size={18} strokeWidth={2.4} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-black text-slate-800">{module.title}</p>
          <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-400">{tag}</p>
        </div>
        {isLastLearned ? (
          <span className="shrink-0 rounded-full bg-[#7B61FF]/12 px-2 py-0.5 text-[10px] font-black text-[#5B4AD1]">
            上次学到
          </span>
        ) : null}
        <WatchStatusBadge moduleId={module.id} />
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#3B82F6] text-white shadow-sm transition-transform group-hover:scale-110">
          <Play size={14} fill="currentColor" className="ml-0.5" />
        </span>
      </button>
    </div>
  );
}

function LearningPathPracticeRow({
  step,
  practiced,
  onPractice,
}: {
  step: number;
  practiced: boolean;
  onPractice: () => void;
}) {
  return (
    <div className="relative">
      <span className="absolute -left-8 top-1/2 flex h-[22px] w-[22px] -translate-y-1/2 items-center justify-center rounded-full bg-[#F59E0B] text-[11px] font-black text-white">
        {step}
      </span>
      <button
        type="button"
        onClick={onPractice}
        className="group flex w-full items-center gap-3 rounded-2xl border-[1.5px] border-[#F59E0B]/70 bg-[#FFF7E6] px-3.5 py-3 text-left shadow-sm transition-all hover:border-[#F59E0B] active:scale-[0.99]"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F59E0B]/15 text-[#D97706]">
          <PenLine size={18} strokeWidth={2.4} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-black text-slate-800">一课一练</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black ${
            practiced ? 'bg-emerald-50 text-emerald-600' : 'bg-white/80 text-slate-400'
          }`}
        >
          {practiced ? '已练习' : '未练习'}
        </span>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#F59E0B] text-white shadow-sm transition-transform group-hover:scale-110">
          <ChevronRight size={16} strokeWidth={2.8} />
        </span>
      </button>
    </div>
  );
}

function AssessmentSideCard({ onSelfTest }: { onSelfTest: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelfTest}
      className="group flex h-full min-h-0 w-full flex-col items-center justify-center gap-2 rounded-[22px] border border-[#0D9488]/20 bg-[linear-gradient(135deg,#D5F5EF_0%,#E8FBF7_100%)] px-3 py-4 text-[#08796F] shadow-[0_8px_20px_rgba(13,148,136,0.12)] transition-all hover:-translate-y-0.5 active:scale-[0.98]"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 transition-transform group-hover:scale-110">
        <Check size={22} strokeWidth={2.8} />
      </span>
      <span className="text-[16px] font-black">精准练习</span>
      <span className="text-[10px] font-semibold text-[#08796F]/70">自选范围</span>
    </button>
  );
}

function TeacherIntroCard({
  subject,
}: {
  subject: SubjectType;
}) {
  const teamIntro =
    subject === '语文'
      ? '由多位语文名师协同备课与授课，围绕教材课文设计预习、精讲、复习和表达训练。'
      : subject === '英语'
        ? '由英语名师与外教协同授课，围绕教材单元覆盖词汇、课文、阅读、写作与口语训练。'
        : subject === '科学'
          ? '由多位科学教师协同授课，围绕实验探究、现象解析和科学概念开展同步学习。'
        : '由多位数学名师协同授课，围绕教材章节讲透概念、例题与解题方法。';

  return (
    <Annotatable
      annotationId="subject.sync.teacher-team"
      className="flex min-h-0 min-w-0 flex-col"
    >
      <section className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-[28px] border border-white/80 bg-white/55 shadow-[0_12px_40px_rgba(99,102,241,0.10)]">
      <div className="relative h-2/3 min-h-[160px] shrink-0 overflow-hidden">
        <img
          src={teacherTeamImage}
          alt={`${subject}学科名师团队`}
          className="absolute inset-0 h-full w-full object-contain object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1630]/90 via-[#1a1630]/25 to-transparent" />
      </div>

      <div className="flex min-h-0 flex-1 flex-col justify-center gap-2.5 overflow-y-auto border-t border-white/10 bg-[linear-gradient(145deg,#171326_0%,#211A39_100%)] p-4 no-scrollbar">
        <div>
          <h2 className="text-[18px] font-black text-white">{subject}学科名师团队</h2>
          <p className="mt-0.5 text-[11px] font-semibold text-white/75">多位一线教师联合备课、协同授课</p>
        </div>
        <div className="border-t border-white/10 pt-2.5">
          <p className="text-[11px] font-black tracking-wide text-[#C4B5FD]">团队介绍</p>
          <p className="mt-1 text-[12px] font-medium leading-relaxed text-slate-100">{teamIntro}</p>
        </div>
      </div>
      </section>
    </Annotatable>
  );
}

function TeacherBanner({
  subject,
}: {
  subject: SubjectType;
}) {
  const teacher = TEACHER_BY_SUBJECT[subject];
  const teamFocus =
    subject === '语文'
      ? '多位语文名师协同备课，带你读懂课文、学会表达'
      : subject === '英语'
        ? '多位英语名师与外教协同授课，覆盖听说读写'
        : subject === '科学'
          ? '多位科学教师协同授课，覆盖概念、实验与探究'
        : '多位数学名师协同授课，紧扣教材节奏、学透核心方法';

  return (
    <section className="relative flex h-[32%] min-h-[132px] shrink-0 overflow-hidden rounded-[28px] border border-white/80 bg-[#202542] shadow-[0_12px_40px_rgba(99,102,241,0.16)]">
      <img
        src={teacherPortrait}
        alt={teacher.name}
        className="absolute inset-y-0 right-0 h-full w-[42%] object-cover object-[center_18%] opacity-90"
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,#202542_0%,#25294B_51%,rgba(37,41,75,0.5)_72%,rgba(37,41,75,0.1)_100%)]" />

      <div className="relative flex min-w-0 flex-1 flex-col justify-center px-5 py-4 text-white">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-sky-400/20 px-2.5 py-1 text-[10px] font-bold text-sky-200">
            教材同步名师团队
          </span>
          <span className="text-[11px] font-semibold text-white/60">多位一线教师协同授课</span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <h2 className="text-[23px] font-black">{subject}学科名师团队</h2>
          <span className="text-[12px] font-semibold text-white/70">
            覆盖预习、精讲与训练
          </span>
        </div>
        <p className="mt-2 max-w-[64%] line-clamp-2 text-[12px] font-medium leading-relaxed text-white/75">
          {teamFocus}
        </p>
      </div>
    </section>
  );
}

interface ModuleIntroContent {
  tagline: string;
  audience: string;
}

const MODULE_INTRO_TEACHERS = [
  { src: moduleTeacher2, name: '林启明', title: '特级教师' },
  { src: moduleTeacher1, name: '苏晚晴', title: '高级教师' },
  { src: moduleTeacher3, name: '陈诺', title: '高级教师' },
] as const;

const MODULE_INTRO_CONTENT: Record<string, ModuleIntroContent> = {
  'sync-improve': {
    tagline: '跟着教材进度把每个知识点练到会用、能拔高。',
    audience: '已跟上课本、还想再提高一层的同学',
  },
  'cn-sync-reading': {
    tagline: '按单元主题练阅读方法，把课文读懂、读透。',
    audience: '需要提升阅读理解与概括能力的同学',
  },
  'cn-sync-composition': {
    tagline: '跟着单元习作主题，把审题、构思和成文一次练会。',
    audience: '想把作文写具体、写清楚的同学',
  },
  'cn-hanzi-trace': {
    tagline: '对照课文生字，把笔画、结构和书写习惯练规范。',
    audience: '需要规范汉字书写的同学',
  },
  'vocabulary-lecture': {
    tagline: '把本单元单词和短语讲透，记牢、会用。',
    audience: '需要过关单元词汇的同学',
  },
  'foreign-teacher-speaking': {
    tagline: '外教情景对话，把课本句子说出来。',
    audience: '想练口语、敢开口的同学',
  },
  'sync-grammar-lecture': {
    tagline: '把本册语法点讲清楚，做题时知道为什么对。',
    audience: '语法容易混、需要系统过一遍的同学',
  },
};

function ModuleIntroPanel({
  module,
  grade,
  textbook,
  onBack,
}: {
  module: LearningModule;
  grade: string;
  textbook: string;
  onBack: () => void;
}) {
  const intro = MODULE_INTRO_CONTENT[module.id];
  const tagline = intro?.tagline || module.subtitle || '跟着名师把这门课学明白。';
  const audience = intro?.audience || '正在学习该教材同步内容的同学';

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex shrink-0 items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="返回"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white bg-white/90 text-slate-600 shadow-sm active:scale-95"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-black text-slate-800">{module.title}简介</h2>
          <p className="truncate text-[11px] font-semibold text-slate-400">课程介绍页</p>
        </div>
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden rounded-[28px] border border-white/80 bg-[#0B0B12] shadow-[0_12px_40px_rgba(99,102,241,0.10)]">
        <div className="flex h-full min-h-0">
          <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
            <div className="absolute inset-0 flex items-end justify-center gap-0 px-2">
              {MODULE_INTRO_TEACHERS.map((teacher, index) => (
                <img
                  key={teacher.name}
                  src={teacher.src}
                  alt={teacher.name}
                  className={`h-[98%] w-auto max-w-[38%] object-contain object-bottom ${
                    index === 1 ? 'z-20 -mx-8' : 'z-10'
                  }`}
                />
              ))}
            </div>
            <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-gradient-to-l from-[#0B0B12] to-transparent" />
          </div>

          <div className="relative z-20 flex w-[40%] min-w-[280px] shrink-0 flex-col justify-center px-8 py-8 text-white">
            <span className="inline-flex w-fit rounded-full bg-white/12 px-2.5 py-1 text-[10px] font-bold tracking-wide text-white/80">
              {grade} · {textbook}
            </span>
            <h3 className="mt-4 text-[28px] font-black leading-tight">{module.title}</h3>
            <p className="mt-3 text-[15px] font-medium leading-relaxed text-white/85">{tagline}</p>
            <p className="mt-4 text-[13px] font-medium leading-relaxed text-white/65">
              适合{audience}。由名师团队精讲，把重难点和易错点讲清楚。
            </p>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-1.5">
              {MODULE_INTRO_TEACHERS.map((teacher) => (
                <p key={teacher.name} className="text-[12px] font-semibold text-white/70">
                  {teacher.name}
                  <span className="ml-1.5 font-medium text-white/40">{teacher.title}</span>
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const UniverseContainer: React.FC<UniverseContainerProps> = ({
  subject,
  currentGrade = '七年级上',
  currentTextbook = '人教版',
  onOpenQuestionTraining,
  onLearningModuleSubpageChange,
  onOpenVideo,
  onBack,
  compactHome = false,
}) => {
  const [activeModule, setActiveModule] = useState<LearningModule | null>(null);
  const [activeScopeId, setActiveScopeId] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [selectedChapterId, setSelectedChapterId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [moduleRefreshKey, setModuleRefreshKey] = useState(0);
  const [isAssessmentConfigOpen, setIsAssessmentConfigOpen] = useState(false);
  const [unitSetupOpen, setUnitSetupOpen] = useState(false);
  const [isLessonPageOpen, setIsLessonPageOpen] = useState(false);
  const [isModuleIntroOpen, setIsModuleIntroOpen] = useState(false);
  const [lastPathVideoId, setLastPathVideoId] = useState<string | null>(null);
  const [lessonPracticeDone, setLessonPracticeDone] = useState(false);
  const restoredSubjectsRef = useRef(new Set<SubjectType>());

  const dirTree = useMemo(() => {
    const raw = (SUBJECT_CONFIGS[subject]?.knowledgeTree || []) as RawDirNode[];
    return buildDirTree(raw, 'root', 1);
  }, [subject]);

  const isChapterOnly = isChapterOnlyTextbook(subject, currentTextbook);

  const englishTextbookNodes = useMemo(
    () =>
      isEnglishHujiaoTextbook(subject, currentTextbook)
        ? catalogToDirTree(getTextbookCatalog('英语', currentTextbook))
        : ENGLISH_MODULE_NODES,
    [currentTextbook, subject]
  );

  const chapters = useMemo(() => {
    if (subject === '数学') return MATH_TEXTBOOK_UNIT_NODES;
    if (subject === '科学') return SCIENCE_TEXTBOOK_UNIT_NODES;
    if (subject === '地理') return GEOGRAPHY_TEXTBOOK_NODES;
    if (subject === '生物') return BIOLOGY_TEXTBOOK_NODES;
    if (subject === '语文') {
      if (activeModule?.id === 'cn-sync-reading') return CHINESE_SYNC_READING_NODES;
      if (activeModule?.id === 'cn-sync-composition') return CHINESE_SYNC_COMPOSITION_NODES;
      if (activeModule?.id === 'cn-hanzi-trace') return CHINESE_HANZI_TRACE_NODES;
      return CHINESE_UNIT_NODES;
    }
    if (subject === '英语') {
      if (activeModule?.id === 'vocabulary-lecture') return ENGLISH_VOCABULARY_NODES;
      if (activeModule?.id === 'foreign-teacher-speaking') return ENGLISH_SPEAKING_NODES;
      return englishTextbookNodes;
    }
    return collectChapters(dirTree);
  }, [activeModule?.id, dirTree, englishTextbookNodes, subject]);

  const textbookChapters = useMemo(() => {
    if (subject === '数学') return MATH_TEXTBOOK_UNIT_NODES;
    if (subject === '科学') return SCIENCE_TEXTBOOK_UNIT_NODES;
    if (subject === '地理') return GEOGRAPHY_TEXTBOOK_NODES;
    if (subject === '生物') return BIOLOGY_TEXTBOOK_NODES;
    if (subject === '语文') return CHINESE_UNIT_NODES;
    if (subject === '英语') return englishTextbookNodes;
    return collectChapters(dirTree);
  }, [dirTree, englishTextbookNodes, subject]);

  const currentTextbookSections = useMemo(() => {
    const chapter = textbookChapters.find((item) => item.id === selectedChapterId) || textbookChapters[0] || null;
    return collectSections(chapter);
  }, [selectedChapterId, textbookChapters]);

  const unitRecommendedCount = useMemo(() => {
    const chapter = textbookChapters.find((item) => item.id === selectedChapterId) || textbookChapters[0] || null;
    return recommendedUnitQuestionCount(subject, chapter, isChapterOnly);
  }, [isChapterOnly, selectedChapterId, subject, textbookChapters]);

  const assessmentCatalog = useMemo(
    () => toAssessmentCatalog(textbookChapters, { chapterOnly: isChapterOnly }),
    [isChapterOnly, textbookChapters]
  );

  const textbookVideoModules = useMemo(() => {
    const chapter =
      textbookChapters.find((item) => item.id === selectedChapterId) || textbookChapters[0] || null;
    const section =
      findNodeById(textbookChapters, selectedSectionId) || currentTextbookSections[0] || null;
    return buildTextbookVideoModules({
      subject,
      chapterLabel: chapter?.label || '',
      section,
      sections: currentTextbookSections,
    });
  }, [currentTextbookSections, selectedChapterId, selectedSectionId, subject, textbookChapters]);

  const learnVideoModules = textbookVideoModules.filter((module) => !PRACTICE_VIDEO_MODULE_IDS.has(module.id));
  const practiceVideoModules = textbookVideoModules.filter((module) => PRACTICE_VIDEO_MODULE_IDS.has(module.id));

  useEffect(() => {
    if (!selectedSectionId) return;
    const stored = getLastPathVideoId(subject, selectedSectionId);
    const fallback =
      textbookVideoModules.find((module) => getWatchStatusIndex(module.id) === 1)?.id ||
      textbookVideoModules[0]?.id ||
      null;
    setLastPathVideoId(stored || fallback);
    setLessonPracticeDone(getLessonPracticeDone(subject, selectedSectionId));
  }, [selectedSectionId, subject, textbookVideoModules]);

  /** 视频学习页目录与首页教材目录保持一致 */
  const catalogTree = useMemo(
    () => (
      subject === '数学' || subject === '语文' || subject === '英语' || subject === '科学' || subject === '地理' || subject === '生物'
        ? chapters
        : dirTree
    ),
    [subject, chapters, dirTree]
  );
  const currentStudyTitle =
    findNodeById(catalogTree, selectedSectionId)?.label ||
    chapters.find((chapter) => chapter.id === selectedChapterId)?.label ||
    '';

  /** 切换学科时回到课本全解首页 */
  useEffect(() => {
    setActiveModule(null);
    onLearningModuleSubpageChange?.(false);
    setIsAssessmentConfigOpen(false);
    setIsLessonPageOpen(false);
    setIsModuleIntroOpen(false);
  }, [subject]);

  /** 优先恢复本地记录；没有有效记录时默认定位到第一单元第一节 */
  useEffect(() => {
    if (!chapters.length) {
      setSelectedChapterId('');
      setSelectedSectionId('');
      return;
    }

    const saved = getStoredDirectorySelections()[subject];
    const savedSection = saved?.sectionId ? findNodeById(chapters, saved.sectionId) : null;
    const savedPath = savedSection ? findPathIds(chapters, savedSection.id) : null;
    if (savedPath?.length) {
      setSelectedChapterId(savedPath[0]);
      setSelectedSectionId(savedSection!.id);
      restoredSubjectsRef.current.add(subject);
      return;
    }

    const firstChapter = chapters[0];
    const firstSections = collectSections(firstChapter);
    setSelectedChapterId(firstChapter.id);
    setSelectedSectionId(firstSections[0]?.id || firstChapter.id);
    restoredSubjectsRef.current.add(subject);
  }, [chapters, subject]);

  useEffect(() => {
    if (!isChapterOnly || !isLessonPageOpen) return;
    setIsLessonPageOpen(false);
    onLearningModuleSubpageChange?.(false);
  }, [isChapterOnly, isLessonPageOpen, onLearningModuleSubpageChange]);

  useEffect(() => {
    if (!compactHome || !isLessonPageOpen) return;
    setIsLessonPageOpen(false);
    onLearningModuleSubpageChange?.(false);
  }, [compactHome, isLessonPageOpen, onLearningModuleSubpageChange]);

  useEffect(() => {
    if (!restoredSubjectsRef.current.has(subject) || !selectedChapterId || !selectedSectionId) return;
    const selections = getStoredDirectorySelections();
    const previous = selections[subject] || {};
    saveStoredDirectorySelections({
      ...selections,
      [subject]: {
        ...previous,
        chapterId: selectedChapterId,
        sectionId: selectedSectionId,
      },
    });
  }, [selectedChapterId, selectedSectionId, subject]);

  const handleChapterChange = (chapterId: string) => {
    setSelectedChapterId(chapterId);
    setModuleRefreshKey((key) => key + 1);
  };

  const openAssessmentConfig = () => {
    setIsAssessmentConfigOpen(true);
    onLearningModuleSubpageChange?.(true);
  };

  const closeAssessmentConfig = () => {
    setIsAssessmentConfigOpen(false);
    onLearningModuleSubpageChange?.(false);
  };

  const openLessonPage = (section: DirTreeNode) => {
    setSelectedSectionId(section.id);
    setIsLessonPageOpen(true);
    onLearningModuleSubpageChange?.(true);
  };

  const openLessonVideoDirect = (section: DirTreeNode) => {
    setSelectedSectionId(section.id);
    const chapter =
      textbookChapters.find((item) => item.id === selectedChapterId) || textbookChapters[0] || null;
    const modules = buildTextbookVideoModules({
      subject,
      chapterLabel: chapter?.label || '',
      section,
      sections: currentTextbookSections,
    });
    if (!modules.length) return;
    const stored = getLastPathVideoId(subject, section.id);
    const start = modules.find((module) => module.id === stored) || modules[0];
    saveLastPathVideoId(subject, section.id, start.id);
    setLastPathVideoId(start.id);
    onOpenVideo?.(
      { id: start.id, title: start.title },
      modules.map((item) => ({
        id: item.id,
        title: item.title,
        subtitle: item.subtitle,
        group: PRACTICE_VIDEO_MODULE_IDS.has(item.id) ? 'practice' : 'learn',
      })),
      { fromLearningPath: false }
    );
  };

  const closeLessonPage = () => {
    setIsLessonPageOpen(false);
    onLearningModuleSubpageChange?.(false);
  };

  const openModuleVideo = (module: LearningModule) => {
    if (selectedSectionId) {
      saveLastPathVideoId(subject, selectedSectionId, module.id);
      setLastPathVideoId(module.id);
    }
    onOpenVideo?.(
      { id: module.id, title: module.title },
      textbookVideoModules.map((item) => ({
        id: item.id,
        title: item.title,
        subtitle: item.subtitle,
        group: PRACTICE_VIDEO_MODULE_IDS.has(item.id) ? 'practice' : 'learn',
      }))
    );
  };

  const openChapterOnlyUnitVideo = (section: DirTreeNode) => {
    setSelectedSectionId(section.id);
    const chapter =
      textbookChapters.find((item) => item.id === selectedChapterId) || textbookChapters[0] || null;
    const playlist = collectSections(chapter).map((item) => {
      const moduleId = getEnglishHujiaoVideoModuleId(item.id);
      return {
        id: item.id,
        title: item.label,
        subtitle: ENGLISH_TEXTBOOK_MODULES.find((module) => module.id === moduleId)?.title || '',
        group: isPracticeVideoModule(moduleId) ? ('practice' as const) : ('learn' as const),
      };
    });
    onOpenVideo?.({ id: section.id, title: section.label }, playlist, {
      actionLabel: '单元测',
      practiceMode: 'unit',
      fromLearningPath: false,
    });
  };

  const openLessonFromCatalog = (section: DirTreeNode) => {
    if (isChapterOnly) {
      openChapterOnlyUnitVideo(section);
      return;
    }
    if (compactHome) {
      openLessonVideoDirect(section);
      return;
    }
    openLessonPage(section);
  };

  useEffect(() => {
    if (!activeModule || !catalogTree.length) return;
    const savedScopeId = getStoredDirectorySelections()[subject]?.moduleScopeIds?.[activeModule.id];
    const savedScope = savedScopeId ? findNodeById(catalogTree, savedScopeId) : null;
    const currentNode = selectedSectionId ? findNodeById(catalogTree, selectedSectionId) : null;
    const scopeId = savedScope?.id || currentNode?.id || findFirstLeaf(catalogTree)?.id || '';
    if (!scopeId) return;
    setActiveScopeId(scopeId);
    setExpandedIds(new Set(collectExpandableIds(catalogTree)));
  }, [activeModule, catalogTree, selectedSectionId, subject]);

  useEffect(() => {
    if (!activeScopeId || !catalogTree.length) return;
    const path = findPathIds(catalogTree, activeScopeId);
    if (!path) return;
    setExpandedIds((prev) => {
      const next = new Set(prev);
      path.slice(0, -1).forEach((id) => next.add(id));
      return next;
    });
  }, [activeScopeId, catalogTree]);

  const activeSection = activeScopeId ? findNodeById(catalogTree, activeScopeId) : null;
  const catalogVideoTitles =
    activeModule?.id === 'cn-hanzi-trace'
      ? ['拘', '勤', '稍', '吟', '骏', '鞭', '装', '蹄', '腐', '貌']
      : activeModule?.id === 'cn-sync-composition'
      ? ['小学作文-变形记-审题意', '小学作文-变形记-怎么写', '小学作文-变形记-评范文']
      : activeModule?.id === 'cn-sync-reading'
        ? ['梗概、内容', '关注人物', '关注情节']
        : activeModule?.id === 'vocabulary-lecture'
          ? [
              'younger', 'older', 'taller', 'shorter', 'longer', 'heavier',
              'bigger', 'smaller', 'stronger', 'dinosaur', 'hall', 'metre',
              'than', 'both', 'kilogram', 'countryside', 'lower', 'become',
            ]
          : activeModule?.id === 'foreign-teacher-speaking'
            ? [
                '小学-出行相关-国家与城市',
                '小学-出行相关-外出旅行',
                '小学-时间相关-中国传统节日',
                '小学外教口语之谈论节日',
              ]
            : activeModule?.id === 'sync-grammar-lecture'
              ? ['状态系动词', '人称代词', '元音字母a在单词中的发音', '元音字母e在单词中的发音']
      : activeSection
        ? activeSection.knowledgePoints.length > 0
          ? activeSection.knowledgePoints
          : ['视频精讲', '同步练习', '巩固复习']
        : [];

  const toggleExpand = (nodeId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  };

  const handleSelectLeaf = (node: DirTreeNode) => {
    if (node.children.length > 0) return;
    setActiveScopeId(node.id);
    if (!activeModule) return;
    const selections = getStoredDirectorySelections();
    const previous = selections[subject] || {};
    saveStoredDirectorySelections({
      ...selections,
      [subject]: {
        ...previous,
        moduleScopeIds: {
          ...previous.moduleScopeIds,
          [activeModule.id]: node.id,
        },
      },
    });
  };

  const renderDirRow = (node: DirTreeNode) => {
    const hasChildren = node.children.length > 0;
    const isLeaf = !hasChildren;
    const expanded = expandedIds.has(node.id);
    const selected = isLeaf && node.id === activeScopeId;
    const padLeft = 8 + (node.level - 1) * 12;

    return (
      <div key={node.id}>
        <div
          className={`flex items-center gap-0.5 rounded-xl transition-colors ${
            selected ? 'bg-[#7B61FF]/10' : 'hover:bg-slate-50'
          }`}
          style={{ paddingLeft: padLeft }}
        >
          {hasChildren ? (
            <button
              type="button"
              aria-label={expanded ? '收起' : '展开'}
              onClick={(e) => toggleExpand(node.id, e)}
              className="flex h-8 w-6 shrink-0 items-center justify-center text-slate-400 hover:text-slate-600"
            >
              <ChevronRight
                size={14}
                className={`transition-transform ${expanded ? 'rotate-90' : ''}`}
              />
            </button>
          ) : (
            <span className="w-6 shrink-0" />
          )}

          {isLeaf ? (
            <button
              type="button"
              onClick={() => handleSelectLeaf(node)}
              className={`flex min-w-0 flex-1 items-center gap-2 rounded-lg py-2 pr-2 text-left ${
                selected ? 'text-[#5B4AD1]' : 'text-slate-700'
              }`}
            >
              <span className="min-w-0 flex-1 truncate text-[12px] font-semibold">{node.label}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => toggleExpand(node.id)}
              className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 py-2 pr-2 text-left"
            >
              <span
                className={`min-w-0 flex-1 truncate text-slate-500 ${
                  node.level === 1 ? 'text-[13px] font-bold' : 'text-[12px] font-semibold'
                }`}
              >
                {node.label}
              </span>
            </button>
          )}
        </div>
        {hasChildren && expanded && <div>{node.children.map((child) => renderDirRow(child))}</div>}
      </div>
    );
  };

  const chapterPicker = (
    <Annotatable annotationId="subject.sync.chapter-picker" className="flex min-w-0 flex-1">
      <ChapterSectionPicker
        chapters={textbookChapters}
        chapterId={selectedChapterId}
        onChapterChange={handleChapterChange}
      />
    </Annotatable>
  );

  const selectedTextbookChapter =
    textbookChapters.find((item) => item.id === selectedChapterId) || textbookChapters[0] || null;

  const textbookPanel = (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col rounded-[28px] border border-white/80 bg-white/55 p-4 shadow-[0_12px_40px_rgba(99,102,241,0.10)]">
      <div className="mb-3 flex shrink-0 items-center gap-2">
        <h3 className="shrink-0 text-[16px] font-black text-slate-800">
          课本全解
        </h3>
        <Annotatable annotationId="subject.sync.textbook-version" className="shrink-0">
          <span className="text-[13px] font-bold text-slate-500">{currentTextbook}</span>
        </Annotatable>
        {chapterPicker}
      </div>
      <motion.div
        key={`textbook-sections-${selectedChapterId}-${moduleRefreshKey}`}
        initial={{ opacity: 0.2, y: 10, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="flex min-h-0 flex-1 flex-col gap-3"
      >
        <Annotatable annotationId="subject.sync.textbook-videos" className="flex min-h-0 min-w-0 flex-1">
          <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto pr-1 no-scrollbar">
            {currentTextbookSections.length > 0 ? (
              currentTextbookSections.map((section) => (
                <DirectoryListRow
                  key={section.id}
                  label={section.label}
                  isLastLearned={section.id === selectedSectionId}
                  variant={isChapterOnly ? 'video' : 'lesson'}
                  statusId={isChapterOnly ? section.id : undefined}
                  onClick={() => openLessonFromCatalog(section)}
                />
              ))
            ) : (
              <div className="flex min-h-[140px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/65 px-4 text-center">
                <p className="text-[13px] font-black text-slate-700">
                  {isChapterOnly ? '该单元暂无视频' : '该单元暂无课时'}
                </p>
                <p className="mt-1 text-[11px] font-semibold text-slate-400">换个单元看看吧</p>
              </div>
            )}
          </div>
        </Annotatable>
        <Annotatable annotationId="subject.sync.unit-test" className="shrink-0">
          <UnitTestBar onUnitTest={() => setUnitSetupOpen(true)} />
        </Annotatable>
      </motion.div>
    </section>
  );

  const openIndependentModule = (module: LearningModule) => {
    setIsModuleIntroOpen(false);
    setActiveModule(module);
    onLearningModuleSubpageChange?.(true);
  };

  const secondaryLearningPanel =
    subject === '数学' ? (
      <IndependentModuleRow modules={[SYNC_IMPROVE_MODULE]} onSelect={openIndependentModule} />
    ) : subject === '语文' ? (
      <IndependentModuleRow title="专项提升" modules={CHINESE_SIDE_MODULES} onSelect={openIndependentModule} />
    ) : subject === '英语' ? (
      <IndependentModuleRow title="专项提升" modules={ENGLISH_IMPROVE_MODULES} onSelect={openIndependentModule} />
    ) : null;

  const homeView = (
    <div className="flex h-full min-h-0 flex-col gap-3">
      {compactHome ? (
        <header className="flex shrink-0 items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="返回"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white bg-white/90 text-slate-600 shadow-sm active:scale-95"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-black text-slate-800">课本全解</h2>
            <p className="truncate text-[11px] font-semibold text-slate-400">
              同步课堂 · {subject}
              {' · '}
              {STUDENT_STUDY_CONTEXT.stage}
              {STUDENT_STUDY_CONTEXT.grade}
              {' · '}
              {STUDENT_STUDY_CONTEXT.schoolSystem}
              {' · '}
              {STUDENT_STUDY_CONTEXT.term}
            </p>
          </div>
        </header>
      ) : null}
    <div className="grid h-0 min-h-0 flex-1 grid-cols-[minmax(230px,0.8fr)_minmax(0,2.2fr)] gap-4">
      <TeacherIntroCard subject={subject} />
      <div className="flex min-h-0 min-w-0 flex-col gap-4">
        {compactHome ? (
          <div className="flex min-h-0 flex-1">{textbookPanel}</div>
        ) : (
          <>
            <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(148px,168px)] gap-4">
              {textbookPanel}
              <Annotatable annotationId="subject.sync.textbook-assessment" className="flex min-h-0">
                <AssessmentSideCard onSelfTest={openAssessmentConfig} />
              </Annotatable>
            </div>
            {secondaryLearningPanel ? (
              <Annotatable annotationId="subject.sync.independent-module">
                {secondaryLearningPanel}
              </Annotatable>
            ) : null}
          </>
        )}
      </div>
    </div>
    </div>
  );

  const selectedLesson =
    findNodeById(textbookChapters, selectedSectionId) || currentTextbookSections[0] || null;

  const lessonView = (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex shrink-0 items-center gap-3">
        <button
          type="button"
          onClick={closeLessonPage}
          aria-label="返回"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white bg-white/90 text-slate-600 shadow-sm active:scale-95"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-black text-slate-800">{selectedLesson?.label || '课时学习'}</h2>
          <p className="truncate text-[11px] font-semibold text-slate-400">
            {selectedTextbookChapter?.label || ''}
          </p>
        </div>
      </div>

      <Annotatable annotationId="subject.sync.learning-path" className="flex min-h-0 min-w-0 flex-1">
      <LearningPathPanel
        learnModules={learnVideoModules}
        practiceVideos={practiceVideoModules}
        lastVideoId={lastPathVideoId}
        practiceDone={lessonPracticeDone}
        onSelectVideo={openModuleVideo}
        onPractice={() => {
          if (selectedSectionId) {
            saveLessonPracticeDone(subject, selectedSectionId);
            setLessonPracticeDone(true);
          }
          onOpenQuestionTraining?.('practice');
        }}
      />
      </Annotatable>
    </div>
  );

  const assessmentConfigView = (
    <AssessmentConfigPage
      key={subject}
      catalog={assessmentCatalog}
      onBack={closeAssessmentConfig}
      onStart={() => onOpenQuestionTraining?.('assessment')}
      subject={subject}
      textbook={currentTextbook}
      contextLabel={`${subject} · ${STUDENT_STUDY_CONTEXT.stage}${STUDENT_STUDY_CONTEXT.grade} · ${STUDENT_STUDY_CONTEXT.schoolSystem} · ${STUDENT_STUDY_CONTEXT.term} · ${currentTextbook}`}
    />
  );

  const catalogView = activeModule && (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="grid shrink-0 grid-cols-[190px_minmax(0,1fr)] items-center gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => {
              onLearningModuleSubpageChange?.(false);
              setIsModuleIntroOpen(false);
              setActiveModule(null);
            }}
            aria-label="返回"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white bg-white/90 text-slate-600 shadow-sm active:scale-95"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0">
            <h2 className="truncate text-base font-black text-slate-800">{activeModule.title}</h2>
          </div>
        </div>
        <div className="flex min-w-0 items-center justify-end">
          <Annotatable annotationId="subject.sync.module-intro">
            <button
              type="button"
              onClick={() => setIsModuleIntroOpen(true)}
              className="flex h-[30px] items-center gap-1 rounded-lg border border-white/70 bg-white/80 px-2.5 text-[12px] font-bold text-slate-600 shadow-sm transition-colors hover:bg-white"
            >
              <Info size={13} strokeWidth={2.4} />
              简介
            </button>
          </Annotatable>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[190px_minmax(0,1fr)] gap-4">
        <aside className="flex min-h-0 min-w-0 flex-col rounded-[24px] border border-white/80 bg-white/55 p-3 shadow-[0_12px_40px_rgba(99,102,241,0.10)]">
          <div className="mb-2 flex shrink-0 items-center gap-2 px-1">
            <BookOpen size={15} className="text-[#7B61FF]" />
            <h3 className="text-[13px] font-black text-slate-800">学习目录</h3>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto pr-1 no-scrollbar">
            {catalogTree.map((node) => renderDirRow(node))}
          </div>
        </aside>
        <section
          className={
            subject === '数学'
              ? 'flex min-h-0 min-w-0 flex-col'
              : 'flex min-h-0 min-w-0 flex-col rounded-[28px] border border-white/80 bg-white/55 p-4 shadow-[0_12px_40px_rgba(99,102,241,0.10)]'
          }
        >
          {subject === '数学' ? (
            <div className="grid min-h-0 flex-1 grid-rows-3 gap-2.5">
              {activeSection ? (
                catalogVideoTitles.map((knowledgePoint) => (
                  <div key={knowledgePoint} className="flex min-h-0 flex-col justify-center rounded-2xl border border-slate-100 bg-white p-2.5">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-[13px] font-black text-slate-800">{knowledgePoint}</p>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        {
                          title: '基础课',
                          statusId: 'basic-learn' as ModuleId,
                          icon: <Target size={15} />,
                          color: '#059669',
                          soft: 'rgba(5, 150, 105, 0.10)',
                        },
                        {
                          title: '练习课',
                          statusId: 'example-learn' as ModuleId,
                          icon: <Play size={15} fill="currentColor" />,
                          color: '#D97706',
                          soft: 'rgba(217, 119, 6, 0.10)',
                        },
                        {
                          title: '提高课',
                          statusId: 'advanced-learn' as ModuleId,
                          icon: <TrendingUp size={15} />,
                          color: '#DC2626',
                          soft: 'rgba(220, 38, 38, 0.10)',
                        },
                      ].map((video) => (
                        <button
                          key={video.title}
                          type="button"
                          className="group relative flex min-h-[76px] flex-col items-center justify-center gap-1 rounded-xl border border-slate-100 bg-slate-50/50 px-3 text-center transition-colors hover:border-violet-200 hover:bg-violet-50/40"
                        >
                          <span
                            className="flex h-7 w-7 items-center justify-center rounded-lg"
                            style={{ backgroundColor: video.soft, color: video.color }}
                          >
                            {video.icon}
                          </span>
                          <span className="text-[11px] font-black text-slate-700">{video.title}</span>
                          <WatchStatusBadge
                            moduleId={video.statusId}
                            className="absolute right-2 top-2"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-16 text-center text-sm text-slate-400">请选择目录查看视频</div>
              )}
            </div>
          ) : (
            <div className="grid min-h-0 flex-1 content-start grid-cols-3 gap-3 overflow-y-auto no-scrollbar pr-1">
              {activeSection ? (
                catalogVideoTitles.map((videoTitle, videoIndex) => (
                <button
                  key={`${activeSection.id}-${videoTitle}`}
                  type="button"
                  className="group relative flex min-h-28 flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white text-left shadow-sm transition-colors hover:border-violet-200 hover:bg-violet-50/40"
                >
                  <div
                    className="relative flex h-16 items-center justify-center"
                    style={{ backgroundColor: activeModule.accentSoft }}
                  >
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm"
                      style={{
                        color: activeModule.accent,
                      }}
                    >
                      <Play size={14} fill="currentColor" className="ml-0.5" />
                    </span>
                  </div>
                  <WatchStatusBadge
                    moduleId={(['basic-learn', 'example-learn', 'advanced-learn'][videoIndex % 3] as ModuleId)}
                    className="absolute right-2 top-2"
                  />
                  <div className="flex flex-1 flex-col p-2.5">
                    <p className="line-clamp-2 text-[12px] font-black leading-snug text-slate-800">{videoTitle}</p>
                  </div>
                </button>
                ))
            ) : (
              <div className="col-span-3 py-16 text-center text-sm text-slate-400">
                请选择目录查看视频
              </div>
            )}
          </div>
          )}
        </section>
      </div>
    </div>
  );

  const moduleIntroView = activeModule && (
    <ModuleIntroPanel
      module={activeModule}
      grade={currentGrade}
      textbook={currentTextbook}
      onBack={() => setIsModuleIntroOpen(false)}
    />
  );

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{
        background: 'linear-gradient(165deg, #F0F3FF 0%, #E8EEFF 45%, #F5F7FC 100%)',
      }}
    >
      <div
        className="absolute inset-0 px-4"
        style={{
          paddingTop: compactHome ? 16 : TOP_SAFE,
          paddingBottom: compactHome ? 16 : BOTTOM_SAFE,
          paddingLeft: compactHome ? 16 : LEFT_MODE_GUTTER,
        }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={
              isModuleIntroOpen && activeModule
                ? `intro-${activeModule.id}`
                : activeModule
                  ? `catalog-${activeModule.id}`
                  : isLessonPageOpen && !compactHome
                    ? `lesson-${selectedSectionId}`
                    : 'home'
            }
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="h-full min-h-0"
          >
            {isModuleIntroOpen && activeModule
              ? moduleIntroView
              : activeModule
                ? catalogView
                : isLessonPageOpen && !compactHome
                  ? lessonView
                  : homeView}
          </motion.div>
        </AnimatePresence>
      </div>
      {isAssessmentConfigOpen ? (
        <div className="absolute inset-0 z-30">{assessmentConfigView}</div>
      ) : null}
      <PracticeSetupModal
        open={unitSetupOpen}
        recommendedCount={unitRecommendedCount}
        annotationId="subject.sync.unit-test"
        onClose={() => setUnitSetupOpen(false)}
        onConfirm={() => {
          setUnitSetupOpen(false);
          onOpenQuestionTraining?.('unit');
        }}
      />
    </div>
  );
};

export default UniverseContainer;
