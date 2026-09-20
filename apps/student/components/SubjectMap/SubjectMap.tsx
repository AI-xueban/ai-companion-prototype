import React, { useState, useEffect, useRef, useLayoutEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion as motionOriginal, AnimatePresence } from 'framer-motion';
import { MapNode, SubjectType, SubjectData, MapMode, Task, UserPersona, ExpeditionPlan, isCoreSubject } from '../../types';
import { getSubjectMapData } from '../../services/geminiService';
import { Lock, Star, Play, X, Gift, Crown, Sword, BookOpen, BookA, Layers, Scroll, Headphones, Brain, Zap, PenTool, Check, Rocket, Sparkles, ChevronRight, GraduationCap, ChevronDown, Lightbulb, Stethoscope, Target, Shield, Puzzle, Circle, Clock, Flag, Calendar, Trophy, Flame, AlertTriangle, Timer, Mic } from 'lucide-react';
import { InteractiveLumi } from '../LumiSpace/InteractiveLumi';
import { LumiConfigChat } from './LumiConfigChat';
import { LumiExpeditionWizard } from './LumiExpeditionWizard';
import { PlannerContainer } from './Planner/PlannerContainer';
import { TopBarController } from './TopBarController';
import { ModeSwitchRail } from '../Layout/ModeSwitchRail';
import { KG_SCOPE_MICRO_LESSON, KG_SCOPE_UNIT_TEST, KG_SCOPE_SELF_TEST, sectionPracticeQuizFields } from '../../utils/kgMicroLesson';
import { formatJuniorMathVideoLabel } from '../../data/juniorMathSyncVideos';
import { getJuniorChineseSyncTopics, getJuniorChineseTextbookVersions, splitChineseLessonTopics } from '../../data/juniorChineseSyncVideos';
import { JUNIOR_MATH_IMPROVE_G7A } from '../../data/juniorMathImproveG7A';
import { getEnglishGrammarUnits, getEnglishSpeakingUnits, getEnglishVocabUnits } from '../../data/juniorEnglishSpecial';
import {
  getDemoCatalogBook,
  getDemoEnglishTopics,
  getDemoMathTopics,
  getDemoTerms,
  getDemoTextbookVersions,
  getPlaceholderChapterTitles,
  isJuniorGrade,
  resolveCatalogTerm,
  type CatalogLayout,
  type UiSchoolSystem,
} from '../../data/juniorDemoCatalog';
import { SyncSectionPage, getPathStyle } from './SyncSectionPage';
import { SyncImprovePage } from './SyncImprovePage';
import { SyncVocabPage } from './SyncVocabPage';
import { SyncSpeakingPage } from './SyncSpeakingPage';
import { SyncGrammarPage } from './SyncGrammarPage';
import { SyncTeacherAdCard, getTeacherAd } from './SyncTeacherAdCard';
import type { CatalogLessonView } from './SyncCatalogLessonPage';
import { SyncSelfTestPage } from './SyncSelfTestPage';
import { PracticeSetupDialog, type QuestionTypeCount } from './PracticeSetupDialog';
import { PaperPrintFlow, type PaperPrintJob } from './PaperPrintFlow';
import { PracticeShortageDialog } from './PracticeShortageDialog';
import {
  appendDemoChaptersToSyncLessons,
  appendShortageDemosToLastChapter,
  difficultyLevelOf,
  getDemoStock,
  isDailyQuotaShortageKind,
  isEmptyStateDemoChapter,
  isHardBlockShortageKind,
  isShortageDemoChapter,
  isShortageDemoText,
  matchShortageDemo,
  shiftDifficulty,
  type PracticeShortageKind,
} from '../../data/practiceShortageDemo';
import {
  isPlaybackErrorDemoChapter,
  isPlaybackErrorDemoText,
  matchPlaybackErrorDemo,
} from '../../data/playbackErrorDemo';
import { isVideoPendingUnit } from '../../data/videoPendingDemo';
import {
  buildFallbackSelfTestTree,
  buildSelfTestTree,
  DEFAULT_PRACTICE_SCENARIO,
  getChineseUnitTestInfo,
  getEnglishUnitTestInfo,
  getGenericUnitTestInfo,
  getMathUnitTestInfo,
  isSyncAssessmentPilot,
  UNIT_TEST_QUESTION_MAX,
  type PracticeDifficulty,
  type PracticeScenarioCode,
} from '../../data/juniorSyncAssessment';
import { resolveTextbookVersion } from '../../services/textbookVersionStore';
import {
  getSyncBookProgress,
  makeSyncBookKey,
  makeSyncVideoKey,
  markSyncPracticeDone,
  markSyncVideoPlayed,
  saveLastSyncLesson,
} from '../../services/syncProgressStore';
import { makeSectionVideoItemId } from '../../services/syncMicroLessonProgress';

const motion = motionOriginal as any;


// Stage Context Configuration - Updated for Bright Tech Theme
const SUBJECT_STAGE_CONFIG = {
    '数学': {
        grade: '七年级上',
        textbook: '人教版',
        chapter: '第三章：一元一次方程',
        icon: Layers,
        themeColor: 'text-indigo-600',
        subColor: 'text-indigo-400',
        bgGradient: 'from-indigo-50 to-blue-50',
        iconBg: 'bg-indigo-100 text-indigo-600',
        shadow: 'shadow-[0_15px_30px_-5px_rgba(99,102,241,0.15)]'
    },
    '语文': {
        grade: '七年级上',
        textbook: '部编版',
        chapter: '第二单元：古诗文诵读',
        icon: Scroll,
        themeColor: 'text-red-600',
        subColor: 'text-red-400',
        bgGradient: 'from-red-50 to-orange-50',
        iconBg: 'bg-red-100 text-red-600',
        shadow: 'shadow-[0_15px_30px_-5px_rgba(239,68,68,0.15)]'
    },
    '英语': {
        grade: '七年级上',
        textbook: '人教版 (Go For It!)',
        chapter: 'Unit 3: What time do you go to school?',
        icon: Headphones,
        themeColor: 'text-emerald-600',
        subColor: 'text-emerald-400',
        bgGradient: 'from-emerald-50 to-teal-50',
        iconBg: 'bg-emerald-100 text-emerald-600',
        shadow: 'shadow-[0_15px_30px_-5px_rgba(16,185,129,0.15)]'
    }
};

function getSyncFilterLabels(subject: string, layout: CatalogLayout): { parent: string; child: string | null } {
    if (subject === '语文') return { parent: '单元', child: '课文' };
    if (subject === '数学') return { parent: '章', child: '小节' };
    if (subject === '英语') return { parent: '单元', child: null };
    if (subject === '化学') return { parent: '单元', child: '课题' };
    if (subject === '历史' || subject === '道德与法治') return { parent: '单元', child: '课' };
    if (layout === 'unit-chapters') return { parent: '单元', child: '章' };
    if (layout === 'chapter-sections') return { parent: '章', child: '节' };
    return { parent: '单元', child: '课' };
}

const DEFAULT_STAGE_CONFIG = {
    grade: '七年级上',
    textbook: '',
    chapter: '',
    icon: BookOpen,
    themeColor: 'text-slate-600',
    subColor: 'text-slate-400',
    bgGradient: 'from-slate-50 to-gray-50',
    iconBg: 'bg-slate-100 text-slate-600',
    shadow: 'shadow-[0_15px_30px_-5px_rgba(100,116,139,0.12)]'
};

import { NodeDetailModal } from './NodeDetailModal';

// Mock Data for Syllabus
const MOCK_CHAPTERS = [
    { id: 'c1', title: '第一章：有理数', status: 'completed', progress: 100 },
    { id: 'c2', title: '第二章：整式的加减', status: 'completed', progress: 100 },
    { id: 'c3', title: '第三章：一元一次方程', status: 'current', progress: 45 },
    { id: 'c4', title: '第四章：几何图形初步', status: 'locked', progress: 0 },
];

interface SubjectMapProps {
    activeSubject: SubjectType;
    onSubjectChange?: (subject: SubjectType) => void;
    onStartLevel?: (taskInfo: Partial<Task>) => void;
    onOpenEssayLab?: () => void; 
    isAssessed?: boolean;
    mapMode?: MapMode;
    onModeChange?: (mode: MapMode) => void;
    onBlockingOverlayChange?: (active: boolean) => void;
    onDetailModeChange?: (open: boolean) => void;
    userPersona?: UserPersona;
    learningStrategy?: 'sync-mode' | 'exam-mode';
    onStrategyChange?: (strategy: 'sync-mode' | 'exam-mode') => void;
    demoMapEvent?: 'remedial' | 'bonus' | null;
    skipWizard?: boolean; // 新增：是否跳过向导直接显示地图
    userName?: string;
    userGrade?: string;
    textbookTerm?: string;
    onTextbookTermChange?: (term: string) => void;
    schoolSystem?: UiSchoolSystem;
    openFocusSignal?: number;
    /** 首页课本同步等浮层内嵌：无模式栏、无 Tab/底栏预留边距 */
    embedded?: boolean;
    resumeView?: 'practice' | 'vocab' | 'speaking' | 'grammar' | 'improve' | null;
    resumeViewSignal?: number;
}


const ENGLISH_SPECIAL_ENTRIES = [
  { id: 'vocab', title: '同步词汇', icon: BookA },
  { id: 'speaking', title: '外教口语', icon: Mic },
  { id: 'grammar', title: '语法精讲', icon: Lightbulb },
];

const MathImproveBar: React.FC<{ onOpen: () => void }> = ({ onOpen }) => (
  <button
    type="button"
    onClick={onOpen}
    className="group flex w-full shrink-0 items-center gap-2.5 rounded-xl border border-indigo-100 bg-white/90 px-3 py-2.5 text-left shadow-[0_4px_16px_rgba(99,102,241,0.05)] transition hover:border-indigo-300 hover:bg-indigo-50/50"
  >
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-[0_4px_12px_rgba(99,102,241,0.35)]">
      <Rocket size={18} />
    </span>
    <span className="min-w-0 flex-1">
      <span className="block text-[13px] font-semibold text-slate-800">同步提高</span>
      <span className="block text-[11px] text-slate-400">章节拓展精练</span>
    </span>
    <span className="flex shrink-0 items-center gap-0.5 text-[12px] font-semibold text-indigo-600">
      进入学习
      <ChevronRight size={14} className="transition group-hover:translate-x-0.5" />
    </span>
  </button>
);

const EnglishSpecialBar: React.FC<{
  onOpenVocab: () => void;
  onOpenSpeaking: () => void;
  onOpenGrammar: () => void;
}> = ({ onOpenVocab, onOpenSpeaking, onOpenGrammar }) => (
  <div className="flex shrink-0 items-stretch gap-2 rounded-xl border border-indigo-100 bg-white/90 px-2.5 py-1.5 shadow-[0_4px_16px_rgba(99,102,241,0.05)]">
    <div className="flex w-[4.5rem] shrink-0 flex-col items-center justify-center gap-0.5 border-r border-indigo-100/80 pr-2">
      <Sparkles size={14} className="shrink-0 text-indigo-500" />
      <span className="text-[12px] font-semibold leading-none text-slate-800">专项提升</span>
    </div>
    <div className="grid min-w-0 flex-1 grid-cols-3 gap-1.5">
      {ENGLISH_SPECIAL_ENTRIES.map((entry) => {
        const Icon = entry.icon;
        return (
          <button
            key={entry.id}
            type="button"
            onClick={() => {
              if (entry.id === 'vocab') onOpenVocab();
              if (entry.id === 'speaking') onOpenSpeaking();
              if (entry.id === 'grammar') onOpenGrammar();
            }}
            className="group flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg border border-indigo-100 bg-white px-2 py-1.5 text-center transition hover:border-indigo-300 hover:bg-indigo-50/70"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-500 transition group-hover:bg-indigo-100">
              <Icon size={14} />
            </span>
            <span className="text-[11px] font-medium text-slate-700">{entry.title}</span>
          </button>
        );
      })}
    </div>
  </div>
);

const extractSyncTopicLabel = (title: string) =>
  title.replace(/^第[一二三四五六七八九十百\d]+(单元|章|节|课|课时|课题)\s*/, '').replace(/^[Uu]nit\s+\d+\s*/, '');

/** 筛选器已展示小节/课文名时，去掉视频标题里重复的前缀 */
const compactVideoDisplayLabel = (videoTitle: string, contextTitle?: string | null): string => {
  if (!contextTitle?.trim()) return videoTitle;
  const topic = extractSyncTopicLabel(contextTitle.trim());
  if (!topic) return videoTitle;

  if (videoTitle.startsWith(`${topic}_`)) return videoTitle.slice(topic.length + 1);
  if (videoTitle.startsWith(`${topic}-`)) return videoTitle.slice(topic.length + 1);
  if (videoTitle.startsWith(`${topic} · `)) return videoTitle.slice(topic.length + 3);
  if (videoTitle === topic) return videoTitle;
  if (videoTitle.startsWith(topic)) {
    const rest = videoTitle.slice(topic.length);
    if (/^[_-]/.test(rest) || rest.startsWith('的')) return rest.replace(/^[_-]/, '').replace(/^的/, '') || videoTitle;
  }
  return videoTitle;
};

const GENERIC_MATH_STEP_LABEL = /^视频精讲\d*$/;

const mathVideoDisplayLabel = (video: { tag: string; title: string }, contextTitle?: string | null): string => {
  if (!GENERIC_MATH_STEP_LABEL.test(video.tag.trim())) {
    return compactVideoDisplayLabel(video.tag, contextTitle);
  }
  const typed = video.title.match(/^(知识点|题型|易错|拓展)[：:](.+?)R?$/);
  if (typed) return `${typed[2].trim()} · ${typed[1]}`;
  const trimmed = video.title.replace(/R$/, '').trim();
  if (trimmed.length > 0) return trimmed.length > 36 ? `${trimmed.slice(0, 36)}…` : trimmed;
  return video.tag;
};

const CHINESE_TASK_TITLE_RE = /^任务[一二三四五六七八九十百\d]+/;
const isChineseTaskTitle = (name: string) => CHINESE_TASK_TITLE_RE.test(name.trim());

/** 活动·探究：有 task 的课文归入分组标题；任务二/三等叶子行不分组。普通单元不显示任务。 */
const chineseTaskGroupLabel = (
  lesson: { task?: string },
  unitLessons: { task?: string }[],
): string | undefined => {
  if (!unitLessons.some((item) => item.task?.trim())) return undefined;
  return lesson.task?.trim() || undefined;
};

const SyncEmptySectionState: React.FC<{ parent: string; variant?: 'empty' | 'videoPending' }> = ({ parent, variant = 'empty' }) => (
  <div className="flex h-full min-h-0 flex-col items-center justify-center px-3 py-6 text-center">
    <div className="relative mb-3 flex h-[72px] w-[72px] items-center justify-center">
      <span className="absolute inset-0 rounded-[22px] bg-indigo-50" />
      <span className="absolute inset-1 rounded-[18px] border border-dashed border-indigo-200/80" />
      <svg width="40" height="36" viewBox="0 0 40 36" fill="none" aria-hidden="true" className="relative">
        <rect x="4" y="6" width="32" height="24" rx="6" fill="#EEF2FF" stroke="#C7D2FE" strokeWidth="1.4" />
        <path d="M10 13h12.5M10 18h8" stroke="#A5B4FC" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="28.5" cy="24.5" r="6.5" fill="#EEF2FF" stroke="#A5B4FC" strokeWidth="1.4" />
        <path d="M26.2 24.5h4.6" stroke="#818CF8" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
    {variant === 'videoPending' ? (
      <>
        <p className="text-[13px] font-medium text-slate-700">视频正在上架中</p>
        <p className="mt-1 text-[11px] leading-4 text-slate-400">本课视频还在准备中，上架后自动开放。</p>
      </>
    ) : (
      <>
        <p className="text-[13px] font-medium text-slate-500">该章节下暂无内容</p>
        <p className="mt-1 text-[11px] leading-4 text-slate-400">内容即将开放，可先切换其他{parent}</p>
      </>
    )}
  </div>
);

const SyncChildEntryList: React.FC<{
  items: { id: string; title: string; group?: string; lastHere?: boolean; done?: boolean; demo?: boolean }[];
  onOpen: (item: { id: string; title: string }, index: number) => void;
}> = ({ items, onOpen }) => (
  <div className="flex h-full min-h-0 flex-col gap-1 overflow-y-auto">
    {items.map((item, index) => {
      const showGroup = Boolean(item.group) && item.group !== items[index - 1]?.group;
      return (
        <React.Fragment key={item.id}>
          {showGroup ? (
            <div className={`px-1 text-[11px] font-medium text-slate-400 ${index === 0 ? 'pt-0' : 'pt-1.5'}`}>
              {item.group}
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => onOpen(item, index)}
            className={`group flex min-h-9 w-full shrink-0 items-center gap-2 rounded-lg border px-2.5 py-1 text-left transition ${
              item.demo
                ? 'border-amber-200 bg-amber-50/80 hover:border-amber-300 hover:bg-amber-100/80'
                : 'border-indigo-100/80 bg-white hover:border-indigo-200 hover:bg-indigo-50/60 active:bg-indigo-50'
            }`}
          >
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${
              item.demo ? 'bg-amber-100 text-amber-600' : 'bg-indigo-50 text-indigo-500 group-hover:bg-indigo-100'
            }`}>
              <BookOpen size={15} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5">
                <span className={`truncate text-[14px] font-medium ${item.demo ? 'text-amber-900' : 'text-slate-800'}`}>{item.title}</span>
                {item.demo ? (
                  <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">演示</span>
                ) : null}
              </span>
              {item.lastHere ? (
                <span className="block text-[10px] font-medium text-indigo-500">上次学到这里</span>
              ) : null}
            </span>
            {item.done ? <Check size={14} className="shrink-0 text-emerald-500" /> : null}
            <ChevronRight size={14} className={`shrink-0 transition group-hover:translate-x-0.5 ${item.demo ? 'text-amber-400 group-hover:text-amber-600' : 'text-indigo-300 group-hover:text-indigo-500'}`} />
          </button>
        </React.Fragment>
      );
    })}
  </div>
);

const EnglishSkillGrid: React.FC<{
  videos: { tag: string; title: string }[];
  onPlayVideo: (video: { tag: string; title: string }, index: number) => void;
}> = ({ videos, onPlayVideo }) => (
  <div className="grid grid-cols-5 content-start items-start gap-1">
    {videos.map((video, index) => {
      const style = getPathStyle(video.tag, index);
      const Icon = style.Icon;
      return (
        <button
          key={`${video.tag}-${index}`}
          type="button"
          onClick={() => onPlayVideo(video, index)}
          className="group flex h-[52px] min-w-0 flex-col items-center justify-center gap-0.5 rounded-lg border border-indigo-100/70 bg-white px-1 py-1 text-center transition hover:border-indigo-200 hover:bg-indigo-50/60 active:bg-indigo-50"
        >
          <span
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md transition group-hover:scale-105"
            style={{ background: style.from, color: style.accent }}
          >
            <Icon size={13} strokeWidth={1.8} />
          </span>
          <span className="w-full truncate text-[10px] font-medium leading-4 text-slate-700">{video.tag}</span>
        </button>
      );
    })}
  </div>
);

type EnglishSectionView = {
  id: string;
  title: string;
  videos: { tag: string; title: string }[];
};

const SyncUnitTestFooter: React.FC<{
  onStart: () => void;
}> = ({ onStart }) => (
  <div className="mt-1 flex gap-1.5">
    <button type="button" onClick={onStart} className="group flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50/80 px-2.5 text-left transition hover:border-indigo-200 hover:bg-indigo-100"><Layers size={12} className="shrink-0 text-indigo-600" /><span className="min-w-0 flex-1 truncate text-[12px] font-semibold text-indigo-900">单元测试</span><ChevronRight size={13} className="shrink-0 text-indigo-300 transition group-hover:translate-x-0.5 group-hover:text-indigo-500" /></button>
  </div>
);

// Week Section Component
interface WeekSectionProps {
  week: any;
  children: React.ReactNode;
}

const WeekSection: React.FC<WeekSectionProps> = ({ week, children }) => {
  return (
    <div className={`relative w-full ${week.theme.bg} transition-colors duration-700`}>
      {/* Decorative Borders */}
      <div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-slate-900/5 to-transparent pointer-events-none`} />
      
      <div className="relative py-12">
        {/* Week Label */}
        <div className="absolute left-6 top-6 z-0">
          <div className={`flex flex-col ${week.theme.accent}`}>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Expedition</span>
            <span className="text-2xl font-black tracking-tight">{week.weekLabel}</span>
            <span className="text-xs font-medium opacity-80 mt-1">{week.theme.name}</span>
          </div>
        </div>
        
        {/* Nodes Container */}
        {children}
      </div>
      
      {/* Connector / Bridge to next section */}
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-900/5 to-transparent pointer-events-none" />
    </div>
  );
};

export const SubjectMap: React.FC<SubjectMapProps> = ({ 
    activeSubject,
    onSubjectChange,
    onStartLevel, 
    onOpenEssayLab, 
    isAssessed = true,
    mapMode = 'pro', 
    onModeChange,
    onBlockingOverlayChange,
    onDetailModeChange,
    userPersona = 'average',
    learningStrategy = 'sync-mode',
    onStrategyChange,
    demoMapEvent,
    skipWizard = false, // 默认为 false，保证正常流程显示向导
    userName = '同学',
    userGrade = '七年级',
    textbookTerm = '上册',
    onTextbookTermChange,
    schoolSystem = '六三制',
    openFocusSignal = 0,
    embedded = false,
    resumeView = null,
    resumeViewSignal = 0,
}) => {
  const [mapData, setMapData] = useState<SubjectData | null>(null);
  const [selectedNode, setSelectedNode] = useState<MapNode | null>(null);
  const [isGradeMenuOpen, setIsGradeMenuOpen] = useState(false);
  const [isConfigChatOpen, setIsConfigChatOpen] = useState(false);
  const [isPlannerOpen, setIsPlannerOpen] = useState(false);
  const [showThinkingProcess, setShowThinkingProcess] = useState(false);
  const [thinkingStage, setThinkingStage] = useState(0);
  const [examConfig, setExamConfig] = useState<any>(null);
  const [textbookVersion, setTextbookVersion] = useState(() => resolveTextbookVersion('语文', ['人教版'], schoolSystem));
  const [mathTextbookVersion, setMathTextbookVersion] = useState(() => resolveTextbookVersion('数学', ['北师大版', '人教版'], schoolSystem));
    const [isLessonSwitcherOpen, setIsLessonSwitcherOpen] = useState(false);
    const [lessonSwitcherAnchor, setLessonSwitcherAnchor] = useState<{ left: number; top: number } | null>(null);
    const lessonSwitcherRef = useRef<HTMLDivElement>(null);
    const [selectedChineseLesson, setSelectedChineseLesson] = useState(0);
    const [selectedSyncTopic, setSelectedSyncTopic] = useState<string | null>(null);
    const [isImprovePageOpen, setIsImprovePageOpen] = useState(false);
    const [isVocabPageOpen, setIsVocabPageOpen] = useState(false);
    const [isSpeakingPageOpen, setIsSpeakingPageOpen] = useState(false);
    const [isGrammarPageOpen, setIsGrammarPageOpen] = useState(false);
    const [isSelfPracticeOpen, setIsSelfPracticeOpen] = useState(false);
    const [isUnitTestSetupOpen, setIsUnitTestSetupOpen] = useState(false);
    const [isAssemblingPaper, setIsAssemblingPaper] = useState(false);
    const [unitTestMode, setUnitTestMode] = useState<'online' | 'print'>('online');
    const [printJob, setPrintJob] = useState<PaperPrintJob | null>(null);
    const assemblePaperTimerRef = useRef<number | null>(null);
    useEffect(() => () => {
      if (assemblePaperTimerRef.current) window.clearTimeout(assemblePaperTimerRef.current);
    }, []);
    const [unitSetupDifficulty, setUnitSetupDifficulty] = useState<PracticeDifficulty>('中等');
    const [unitSetupScenario, setUnitSetupScenario] = useState<PracticeScenarioCode>(DEFAULT_PRACTICE_SCENARIO);
    const [englishShortageKind, setEnglishShortageKind] = useState<PracticeShortageKind | null>(null);
    const [shortageOverlay, setShortageOverlay] = useState<{
      source: 'unit' | 'section';
      kind: PracticeShortageKind;
      variant: 'below_count' | 'no_new' | 'empty_bank' | 'daily_limit' | 'subject_daily_limit';
      difficulty: PracticeDifficulty;
      scenario: PracticeScenarioCode;
      scenarioLabel: string;
      availableCount: number;
      requestedCount: number;
      sectionKey?: string;
      sectionTitle?: string;
    } | null>(null);
    const [catalogUnitId, setCatalogUnitId] = useState('');
    const [syncSectionFilter, setSyncSectionFilter] = useState<string | null>(null);
    const [catalogLessonFilterId, setCatalogLessonFilterId] = useState<string | null>(null);
    const [selectedCatalogLesson, setSelectedCatalogLesson] = useState<(CatalogLessonView & { id: string }) | null>(null);
    const [progressTick, setProgressTick] = useState(0);
    const [englishTextbookVersion, setEnglishTextbookVersion] = useState(() => resolveTextbookVersion('英语', ['沪教版', '人教版'], schoolSystem));
    const [catalogVersion, setCatalogVersion] = useState(() => resolveTextbookVersion(activeSubject, ['人教版'], schoolSystem));
    const chineseTextbookVersions = useMemo(
      () => getJuniorChineseTextbookVersions(userGrade, textbookTerm),
      [userGrade, textbookTerm],
    );
    const isCatalogSubject = activeSubject === '道德与法治' || activeSubject === '历史' || activeSubject === '生物' || activeSubject === '地理' || activeSubject === '物理' || activeSubject === '化学' || activeSubject === '科学';
    const syncTextbookVersion = activeSubject === '数学'
      ? mathTextbookVersion
      : activeSubject === '英语'
        ? englishTextbookVersion
        : isCatalogSubject
          ? catalogVersion
          : textbookVersion;
    const syncTextbookVersions = activeSubject === '语文'
      ? (chineseTextbookVersions.length ? chineseTextbookVersions : ['人教版'])
      : getDemoTextbookVersions(activeSubject, userGrade, textbookTerm, schoolSystem);
    const setSyncTextbookVersion = activeSubject === '数学'
      ? setMathTextbookVersion
      : activeSubject === '英语'
        ? setEnglishTextbookVersion
        : isCatalogSubject
          ? setCatalogVersion
          : setTextbookVersion;
    const availableTerms = useMemo(
      () => (activeSubject === '语文' ? ['上册', '下册'] : getDemoTerms(activeSubject, userGrade, syncTextbookVersion, schoolSystem)),
      [activeSubject, userGrade, syncTextbookVersion, schoolSystem],
    );
    const activeTerm = resolveCatalogTerm(activeSubject, userGrade, textbookTerm, syncTextbookVersion, schoolSystem);
    const catalogBook = useMemo(
      () => getDemoCatalogBook(activeSubject, userGrade, activeTerm, syncTextbookVersion, schoolSystem),
      [activeSubject, userGrade, activeTerm, syncTextbookVersion, schoolSystem],
    );
    const catalogUnits = catalogBook.units;
    const catalogLayout = catalogBook.layout;
    const filterLabels = getSyncFilterLabels(activeSubject, catalogLayout);
    const teacherAd = getTeacherAd(activeSubject);
    const catalogUnit = catalogUnits.find((unit) => unit.id === catalogUnitId) ?? catalogUnits[0];
    const mathSyncLessons = useMemo(() => {
      const grouped = new Map<string, {
        unit: string;
        task: string;
        section: string;
        videos: { tag: string; title: string }[];
        topicGroups: { section: string; videos: { tag: string; title: string }[] }[];
      }>();
      getDemoMathTopics(userGrade, activeTerm, syncTextbookVersion, schoolSystem).forEach((topic) => {
        const key = `${topic.catalogLabel}|${topic.unit}`;
        if (!grouped.has(key)) {
          grouped.set(key, {
            unit: topic.catalogLabel,
            task: '',
            section: topic.unit.replace(/[　\s]+/g, ' '),
            videos: [],
            topicGroups: [],
          });
        }
        const lesson = grouped.get(key);
        if (!lesson) return;
        const videos = topic.videos.map((video) => ({
          tag: formatJuniorMathVideoLabel(video.label),
          title: video.name,
        }));
        lesson.topicGroups.push({ section: topic.topic, videos });
        lesson.videos.push(...videos);
      });
      return appendDemoChaptersToSyncLessons([...grouped.values()]);
    }, [userGrade, activeTerm, syncTextbookVersion, schoolSystem]);
    const englishSyncLessons = useMemo(
      () =>
        appendDemoChaptersToSyncLessons(
          getDemoEnglishTopics(userGrade, activeTerm, syncTextbookVersion, schoolSystem).map((topic) => ({
            unit: topic.catalog,
            task: '',
            section: topic.catalog,
            videos: topic.videos.map((video) => ({
              tag: video.skill,
              title: video.name,
            })),
            sections: topic.sections?.map((section) => ({
              id: section.id,
              title: section.title,
              videos: section.videos.map((video) => ({
                tag: video.skill,
                title: video.name,
              })),
            })),
          })),
        ),
      [userGrade, activeTerm, syncTextbookVersion, schoolSystem],
    );
    const englishVocabUnits = useMemo(
      () => getEnglishVocabUnits(userGrade, activeTerm, englishTextbookVersion, schoolSystem),
      [userGrade, activeTerm, englishTextbookVersion, schoolSystem],
    );
    const englishSpeakingUnits = useMemo(
      () => getEnglishSpeakingUnits(userGrade, activeTerm, englishTextbookVersion, schoolSystem),
      [userGrade, activeTerm, englishTextbookVersion, schoolSystem],
    );
    const englishGrammarUnits = useMemo(
      () => getEnglishGrammarUnits(userGrade, activeTerm, englishTextbookVersion, schoolSystem),
      [userGrade, activeTerm, englishTextbookVersion, schoolSystem],
    );
    const chineseSyncLessons = useMemo(
      () => {
        const topics = getJuniorChineseSyncTopics(userGrade, textbookTerm, syncTextbookVersion);
        const lessons = topics.length
          ? topics.map((topic) => ({
            unit: topic.catalog,
            task: topic.task,
            section: topic.section,
            videos: topic.videos,
          }))
          : getPlaceholderChapterTitles('语文').map((title) => ({
            unit: title,
            task: '',
            section: '',
            videos: [] as { tag: string; title: string }[],
          }));
        return appendDemoChaptersToSyncLessons(lessons);
      },
      [userGrade, textbookTerm, syncTextbookVersion],
    );
    const syncLessons = activeSubject === '数学'
      ? mathSyncLessons
      : activeSubject === '英语'
        ? englishSyncLessons
        : chineseSyncLessons;
    const currentSyncLesson = syncLessons[Math.min(selectedChineseLesson, Math.max(syncLessons.length - 1, 0))] ?? syncLessons[0];
    const syncCatalogs = useMemo(() => [...new Set(syncLessons.map((lesson) => lesson.unit))], [syncLessons]);
    const syncLessonsByUnit = useMemo(() => {
      const grouped = new Map<string, typeof syncLessons>();
      syncLessons.forEach((lesson) => {
        const list = grouped.get(lesson.unit) ?? [];
        list.push(lesson);
        grouped.set(lesson.unit, list);
      });
      return grouped;
    }, [syncLessons]);
    const currentChapterTopics = useMemo(
      () => syncLessons.filter((lesson) => lesson.unit === currentSyncLesson?.unit),
      [syncLessons, currentSyncLesson?.unit],
    );
    const listedChapterTopics = useMemo(
      () => currentChapterTopics.filter((lesson) => lesson.section.trim()),
      [currentChapterTopics],
    );
    const currentEnglishSections = (currentSyncLesson as { sections?: EnglishSectionView[] } | undefined)?.sections ?? [];
    const visibleChapterTopics = syncSectionFilter
      ? currentChapterTopics.filter((lesson) => lesson.section === syncSectionFilter)
      : currentChapterTopics;
    const syncBookKey = makeSyncBookKey(activeSubject, syncTextbookVersion, userGrade, activeTerm);
    const syncProgress = useMemo(
      () => getSyncBookProgress(syncBookKey),
      [syncBookKey, progressTick],
    );
    const currentParentTitle = isCatalogSubject ? (catalogUnit?.title ?? '') : (currentSyncLesson?.unit ?? '');
    // §7.8.3 视频未上线 / 正在上架中：当前单元是否整体未上线（演示：九年级上册语文第六单元）
    const currentUnitVideoPending = isVideoPendingUnit(activeSubject, userGrade, activeTerm, currentParentTitle);
    const hasSyncUnits = isCatalogSubject ? catalogUnits.length > 0 : syncLessons.length > 0;
    const currentChildTitle = isCatalogSubject
      ? ((catalogUnit?.lessons ?? []).find((lesson) => lesson.id === catalogLessonFilterId)?.title ?? '')
      : (syncSectionFilter ?? '');
    const currentShortageKind = matchShortageDemo(currentChildTitle)
      ?? matchShortageDemo(catalogLessonFilterId)
      ?? (isShortageDemoChapter(currentParentTitle) ? matchShortageDemo(currentSyncLesson?.section) : null)
      ?? (activeSubject === '英语' ? englishShortageKind : null);
    const currentFilteredLesson = visibleChapterTopics[0] ?? currentSyncLesson;
    const showSyncAssessment = isSyncAssessmentPilot(activeSubject, userGrade, activeTerm);
    const selfPracticeTree = useMemo(() => {
      const fromJyeoo = showSyncAssessment
        ? buildSelfTestTree(activeSubject, userGrade, activeTerm, syncTextbookVersion, schoolSystem)
        : [];
      if (fromJyeoo.length) return fromJyeoo;
      if (!showSyncAssessment) return [];
      if (isCatalogSubject) {
        return appendShortageDemosToLastChapter(
          buildFallbackSelfTestTree(
            catalogUnits.map((unit) => ({
              id: unit.id,
              title: unit.title,
              children: unit.lessons.map((lesson) => ({ id: lesson.id, title: lesson.title })),
            })),
          ),
        );
      }
      return appendShortageDemosToLastChapter(
        buildFallbackSelfTestTree(
          syncCatalogs.map((catalog, index) => ({
            id: `unit-${index}`,
            title: catalog,
            children: (syncLessonsByUnit.get(catalog) ?? []).map((lesson, lessonIndex) => ({
              id: `unit-${index}-s-${lessonIndex}`,
              title: lesson.section || catalog,
            })),
          })),
        ),
      );
    }, [showSyncAssessment, activeSubject, userGrade, activeTerm, syncTextbookVersion, schoolSystem, isCatalogSubject, catalogUnits, syncCatalogs, syncLessonsByUnit]);
    const unitTestInfo = useMemo(() => {
      if (!showSyncAssessment) return null;
      if (activeSubject === '数学') {
        return getMathUnitTestInfo(syncLessons, currentParentTitle) ?? getGenericUnitTestInfo(currentParentTitle || '当前章', currentChapterTopics.length);
      }
      if (activeSubject === '英语') {
        return getEnglishUnitTestInfo(currentSyncLesson?.unit ?? '当前 Unit');
      }
      if (activeSubject === '语文') {
        return getChineseUnitTestInfo(currentParentTitle || '当前单元');
      }
      const childCount = isCatalogSubject
        ? (catalogUnit?.lessons.length ?? 0)
        : currentChapterTopics.length;
      return getGenericUnitTestInfo(currentParentTitle || '当前章', childCount);
    }, [showSyncAssessment, activeSubject, syncLessons, currentParentTitle, currentSyncLesson?.unit, currentChapterTopics.length, isCatalogSubject, catalogUnit?.lessons.length]);
    const sectionPageTopics = (() => {
      if (!selectedSyncTopic) return [];
      if (activeSubject === '语文') {
        const lesson = currentChapterTopics.find((item) => item.section === selectedSyncTopic)
          ?? currentChapterTopics.find((item) =>
            splitChineseLessonTopics(item).some((topic) => topic.section === selectedSyncTopic),
          )
          ?? currentFilteredLesson;
        if (!lesson) return [];
        const splits = splitChineseLessonTopics(lesson);
        if (lesson.section === selectedSyncTopic || splits.length <= 1) {
          return splits.map((topic) => ({
            section: topic.section === lesson.section ? lesson.section : topic.section,
            videos: topic.videos,
          }));
        }
        const match = splits.find((topic) => topic.section === selectedSyncTopic);
        return match ? [{ section: match.section, videos: match.videos }] : splits.map((topic) => ({
          section: topic.section,
          videos: topic.videos,
        }));
      }
      if (activeSubject === '数学') {
        const lesson = currentChapterTopics.find((item) => item.section === selectedSyncTopic);
        if (!lesson) return [];
        if ('topicGroups' in lesson && Array.isArray(lesson.topicGroups) && lesson.topicGroups.length) {
          return lesson.topicGroups.map((group: { section: string; videos: { tag: string; title: string }[] }) => ({
            section: group.section,
            videos: group.videos.map((video) => ({
              tag: mathVideoDisplayLabel(video, lesson.section),
              title: video.title,
            })),
          }));
        }
        return [{
          section: lesson.section,
          videos: lesson.videos.map((video) => ({
            tag: mathVideoDisplayLabel(video, lesson.section),
            title: video.title,
          })),
        }];
      }
      if (activeSubject === '英语') {
        const match = currentEnglishSections.find((item) => item.title === selectedSyncTopic || item.id === selectedSyncTopic);
        if (match) return [{ section: match.title, videos: match.videos }];
        return [{ section: selectedSyncTopic, videos: currentSyncLesson?.videos ?? [] }];
      }
      if (!currentFilteredLesson) return [];
      return [{ section: selectedSyncTopic, videos: currentFilteredLesson.videos }];
    })();
    const isSyncSubPageOpen = !!selectedSyncTopic || isImprovePageOpen || isVocabPageOpen || isSpeakingPageOpen || isGrammarPageOpen || isSelfPracticeOpen || !!selectedCatalogLesson;
    const selectSyncCatalog = (catalog: string, close = true) => {
      const index = syncLessons.findIndex((lesson) => lesson.unit === catalog);
      if (index >= 0) setSelectedChineseLesson(index);
      setSyncSectionFilter(null);
      setSelectedSyncTopic(null);
      setEnglishShortageKind(null);
      setIsImprovePageOpen(false);
      setIsVocabPageOpen(false);
      setIsSpeakingPageOpen(false);
      setIsGrammarPageOpen(false);
      setSelectedCatalogLesson(null);
      if (close) setIsLessonSwitcherOpen(false);
    };
    const selectCatalogUnit = (unitId: string, close = true) => {
      setCatalogUnitId(unitId);
      setCatalogLessonFilterId(null);
      setSelectedCatalogLesson(null);
      if (close) setIsLessonSwitcherOpen(false);
    };
    const closeLessonSwitcher = () => {
      setIsLessonSwitcherOpen(false);
    };
    const formatSectionLabel = (name: string, index: number) => (
      /^\d/.test(name.trim()) || /^Unit\s+\d+/i.test(name.trim()) || isChineseTaskTitle(name) ? name : `${index + 1} ${name}`
    );
    const startSectionPractice = (
      sectionKey: string,
      sectionTitle: string,
      override?: { questionCount: number; difficulty: PracticeDifficulty },
    ) => {
      if (activeSubject === '英语') return;
      const practiceKey = `section:${sectionKey}`;
      const kind = matchShortageDemo(sectionKey) ?? matchShortageDemo(sectionTitle);
      if (kind && !override) {
        const difficulty: PracticeDifficulty = '中等';
        const requestedCount = 5;
        if (isDailyQuotaShortageKind(kind)) {
          setShortageOverlay({
            source: 'section',
            kind,
            variant: kind,
            difficulty,
            scenario: DEFAULT_PRACTICE_SCENARIO,
            scenarioLabel: '同步练习',
            availableCount: 0,
            requestedCount,
            sectionKey,
            sectionTitle,
          });
          return;
        }
        if (kind === 'empty_bank') {
          setShortageOverlay({
            source: 'section',
            kind,
            variant: 'empty_bank',
            difficulty,
            scenario: DEFAULT_PRACTICE_SCENARIO,
            scenarioLabel: '同步练习',
            availableCount: 0,
            requestedCount,
            sectionKey,
            sectionTitle,
          });
          return;
        }
        const availableCount = getDemoStock(kind, difficulty);
        if (availableCount <= 0) {
          setShortageOverlay({
            source: 'section',
            kind,
            variant: 'no_new',
            difficulty,
            scenario: DEFAULT_PRACTICE_SCENARIO,
            scenarioLabel: '同步练习',
            availableCount: 0,
            requestedCount,
            sectionKey,
            sectionTitle,
          });
          return;
        }
        if (availableCount < requestedCount) {
          setShortageOverlay({
            source: 'section',
            kind,
            variant: 'below_count',
            difficulty,
            scenario: DEFAULT_PRACTICE_SCENARIO,
            scenarioLabel: '同步练习',
            availableCount,
            requestedCount,
            sectionKey,
            sectionTitle,
          });
          return;
        }
      }
      onStartLevel?.({
        id: `${activeSubject}-section-practice-${sectionKey}-${Date.now()}`,
        title: `${sectionTitle} · 同步练习`,
        subject: activeSubject,
        ...sectionPracticeQuizFields(),
        ...(override ? {
          questionCount: override.questionCount,
          practiceDifficulty: difficultyLevelOf(override.difficulty),
          practiceDifficultyLabel: override.difficulty,
        } : {}),
        syncPracticeMark: { bookKey: syncBookKey, practiceKey },
      });
    };
    const startSelfPractice = (payload: {
      selectedIds: string[];
      questionCount: number;
      title: string;
      difficulty: string;
      difficultyLevel: 1 | 2 | 3 | 4 | 5;
      scenario: 'sync' | 'sc' | 'gc' | 'rc' | 'yc' | 'ec';
      scenarioLabel: string;
    }) => {
      onStartLevel?.({
        id: `${activeSubject}-self-practice-${payload.selectedIds.length}-${Date.now()}`,
        title: payload.title,
        subject: activeSubject,
        durationMinutes: Math.max(Math.ceil(payload.questionCount * 1.5), 10),
        levelType: 'practice',
        quizType: 'standard',
        questionCount: payload.questionCount,
        practiceDifficulty: payload.difficultyLevel,
        practiceDifficultyLabel: payload.difficulty,
        practiceScenario: payload.scenario,
        practiceScenarioLabel: payload.scenarioLabel,
        aiReasoning: KG_SCOPE_SELF_TEST,
      });
      setIsSelfPracticeOpen(false);
    };
    const startUnitTest = (
      setup: {
        questionCount: number;
        difficulty: string;
        difficultyLevel: 1 | 2 | 3 | 4 | 5;
        scenario: 'sync' | 'sc' | 'gc' | 'rc' | 'yc' | 'ec';
        scenarioLabel: string;
        paperTitle?: string;
        questionTypeCounts?: QuestionTypeCount[];
        includeAnswerAnalysis?: boolean;
      },
      options?: { ignoreStock?: boolean; mode?: 'online' | 'print' },
    ) => {
      if (!unitTestInfo) return;
      const finishStart = () => {
        const kind = currentShortageKind;
        const difficulty = setup.difficulty as PracticeDifficulty;
        if (kind && !options?.ignoreStock) {
          if (isDailyQuotaShortageKind(kind)) {
            setShortageOverlay({
              source: 'unit',
              kind,
              variant: kind,
              difficulty,
              scenario: setup.scenario,
              scenarioLabel: setup.scenarioLabel,
              availableCount: 0,
              requestedCount: setup.questionCount,
            });
            return;
          }
          if (kind === 'empty_bank') {
            setShortageOverlay({
              source: 'unit',
              kind,
              variant: 'empty_bank',
              difficulty,
              scenario: setup.scenario,
              scenarioLabel: setup.scenarioLabel,
              availableCount: 0,
              requestedCount: setup.questionCount,
            });
            return;
          }
          const availableCount = getDemoStock(kind, difficulty);
          if (availableCount <= 0) {
            setShortageOverlay({
              source: 'unit',
              kind,
              variant: 'no_new',
              difficulty,
              scenario: setup.scenario,
              scenarioLabel: setup.scenarioLabel,
              availableCount: 0,
              requestedCount: setup.questionCount,
            });
            return;
          }
          if (availableCount < setup.questionCount) {
            setShortageOverlay({
              source: 'unit',
              kind,
              variant: 'below_count',
              difficulty,
              scenario: setup.scenario,
              scenarioLabel: setup.scenarioLabel,
              availableCount,
              requestedCount: setup.questionCount,
            });
            return;
          }
        }
        const task: Partial<Task> & { title: string } = {
          id: `${activeSubject}-unit-test-${unitTestInfo.scopeTitle}`,
          title: `${unitTestInfo.scopeTitle} · 单元测试 · ${setup.questionCount}题 · ${setup.difficulty} · ${setup.scenarioLabel}`,
          subject: activeSubject,
          durationMinutes: Math.max(Math.ceil(setup.questionCount * 1.5), 10),
          levelType: 'practice',
          quizType: 'standard',
          questionCount: setup.questionCount,
          practiceDifficulty: setup.difficultyLevel,
          practiceDifficultyLabel: setup.difficulty,
          practiceScenario: setup.scenario,
          practiceScenarioLabel: setup.scenarioLabel,
          aiReasoning: KG_SCOPE_UNIT_TEST,
        };
        setIsUnitTestSetupOpen(false);
        setShortageOverlay(null);
        if (options?.mode === 'print') {
          setPrintJob({ title: setup.paperTitle || task.title, questionCount: setup.questionCount, subject: activeSubject, questionTypeCounts: setup.questionTypeCounts, includeAnswerAnalysis: setup.includeAnswerAnalysis });
          return;
        }
        onStartLevel?.(task);
        markSyncPracticeDone(syncBookKey, `unit:${unitTestInfo.scopeTitle}`);
        setProgressTick((tick) => tick + 1);
      };
      if (options?.ignoreStock || options?.mode === 'print') {
        finishStart();
        return;
      }
      if (assemblePaperTimerRef.current) window.clearTimeout(assemblePaperTimerRef.current);
      setIsAssemblingPaper(true);
      assemblePaperTimerRef.current = window.setTimeout(() => {
        setIsAssemblingPaper(false);
        assemblePaperTimerRef.current = null;
        finishStart();
      }, 700);
    };
    const openUnitTest = (mode: 'online' | 'print' = 'online') => {
      if (!unitTestInfo) return;
      if (isDailyQuotaShortageKind(currentShortageKind)) {
        setShortageOverlay({
          source: 'unit',
          kind: currentShortageKind,
          variant: currentShortageKind,
          difficulty: '中等',
          scenario: DEFAULT_PRACTICE_SCENARIO,
          scenarioLabel: '同步练习',
          availableCount: 0,
          requestedCount: 0,
        });
        return;
      }
      setUnitSetupDifficulty('中等');
      setUnitSetupScenario(DEFAULT_PRACTICE_SCENARIO);
      setUnitTestMode(mode);
      setIsAssemblingPaper(false);
      setIsUnitTestSetupOpen(true);
    };
    const openChineseOrMathVideos = (lesson: { unit: string; section: string }) => {
      const lessonIndex = syncLessons.findIndex((item) => item.unit === lesson.unit && item.section === lesson.section);
      if (lessonIndex >= 0) setSelectedChineseLesson(lessonIndex);
      setSelectedSyncTopic(lesson.section);
      saveLastSyncLesson(syncBookKey, lesson.unit, lesson.section);
      setProgressTick((tick) => tick + 1);
    };
    const openLessonPicker = () => {
      if (isLessonSwitcherOpen) {
        closeLessonSwitcher();
        return;
      }
      const popupWidth = 320;
      if (lessonSwitcherRef.current) setLessonSwitcherAnchor(getViewportAnchor(lessonSwitcherRef.current, 8, 288, popupWidth, 'right'));
      setIsLessonSwitcherOpen(true);
    };
    const getViewportAnchor = (element: HTMLElement, verticalOffset: number, popupHeight: number, popupWidth = 288, align: 'left' | 'right' = 'left') => {
      const viewport = document.getElementById('app-viewport');
      const rect = element.getBoundingClientRect();
      const viewportRect = viewport?.getBoundingClientRect();
      if (!viewport || !viewportRect) return null;
      const scaleX = viewportRect.width / viewport.offsetWidth;
      const scaleY = viewportRect.height / viewport.offsetHeight;
      const pad = 16;
      const rawLeft = align === 'right'
        ? (rect.right - viewportRect.left) / scaleX - popupWidth
        : (rect.left - viewportRect.left) / scaleX;
      const rawTop = (rect.bottom - viewportRect.top) / scaleY + verticalOffset;
      const maxLeft = Math.max(pad, viewport.offsetWidth - popupWidth - pad);
      const maxTop = Math.max(pad, viewport.offsetHeight - popupHeight - pad);
      return {
        left: Math.min(Math.max(rawLeft, pad), maxLeft),
        top: Math.min(Math.max(rawTop, pad), maxTop),
      };
    };
    const toggleLessonSwitcher = () => openLessonPicker();

    useEffect(() => {
      setSelectedSyncTopic(null);
      setIsImprovePageOpen(false);
      setIsVocabPageOpen(false);
      setIsSpeakingPageOpen(false);
      setIsGrammarPageOpen(false);
      setCatalogLessonFilterId(null);
      setSelectedCatalogLesson(null);
      setIsSelfPracticeOpen(false);
      setIsUnitTestSetupOpen(false);

      const saved = getSyncBookProgress(makeSyncBookKey(activeSubject, syncTextbookVersion, userGrade, activeTerm));
      if (isCatalogSubject) {
        setSelectedChineseLesson(0);
        setSyncSectionFilter(null);
        setCatalogUnitId(saved.catalog || '');
        if (saved.catalogLessonId) setCatalogLessonFilterId(saved.catalogLessonId);
        return;
      }
      setCatalogUnitId('');
      if (saved.catalog) {
        const index = syncLessons.findIndex((item) =>
          item.unit === saved.catalog && (!saved.section || item.section === saved.section),
        );
        setSelectedChineseLesson(index >= 0 ? index : 0);
        setSyncSectionFilter(saved.section || null);
        return;
      }
      setSelectedChineseLesson(0);
      setSyncSectionFilter(null);
    }, [activeSubject, userGrade, textbookTerm, syncTextbookVersion, schoolSystem, activeTerm, isCatalogSubject, syncLessons]);

    useEffect(() => {
      if (openFocusSignal <= 0) return;
      setIsSelfPracticeOpen(false);
      setIsVocabPageOpen(false);
      setIsSpeakingPageOpen(false);
      setIsGrammarPageOpen(false);
      setSelectedSyncTopic(null);
      setSelectedCatalogLesson(null);
      setIsImprovePageOpen(activeSubject === '数学');
    }, [openFocusSignal]);

    useEffect(() => {
      if (resumeViewSignal <= 0 || !resumeView) return;
      const timer = window.setTimeout(() => {
        setSelectedSyncTopic(null);
        setSelectedCatalogLesson(null);
        setIsUnitTestSetupOpen(false);
        setIsSelfPracticeOpen(resumeView === 'practice');
        setIsVocabPageOpen(resumeView === 'vocab');
        setIsSpeakingPageOpen(resumeView === 'speaking');
        setIsGrammarPageOpen(resumeView === 'grammar');
        setIsImprovePageOpen(resumeView === 'improve');
      }, 50);
      return () => window.clearTimeout(timer);
    }, [resumeViewSignal, resumeView]);

    useEffect(() => {
      const pool = syncTextbookVersions.length ? syncTextbookVersions : ['人教版'];
      const next = resolveTextbookVersion(activeSubject, pool, schoolSystem);
      if (next !== syncTextbookVersion) setSyncTextbookVersion(next);
    }, [activeSubject, userGrade, schoolSystem, syncTextbookVersions.join('|')]);

    useEffect(() => {
      if (availableTerms.length && !availableTerms.includes(textbookTerm)) {
        onTextbookTermChange?.(availableTerms[0]);
      }
    }, [availableTerms.join('|'), textbookTerm, onTextbookTermChange]);

    useEffect(() => {
      onDetailModeChange?.(isSyncSubPageOpen);
    }, [isSyncSubPageOpen, onDetailModeChange]);

    useEffect(() => {
      return () => onDetailModeChange?.(false);
    }, [onDetailModeChange]);
  
  // Expedition State
  const [expeditionPlan, setExpeditionPlan] = useState<ExpeditionPlan | null>(null);

  // Layout & State
  const [pathD, setPathD] = useState('');
  const [isMapReady, setIsMapReady] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const contentContainerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const thinkingTimersRef = useRef<NodeJS.Timeout[]>([]);
  
  const stageConfig = SUBJECT_STAGE_CONFIG[activeSubject as keyof typeof SUBJECT_STAGE_CONFIG] ?? DEFAULT_STAGE_CONFIG;
  const [currentGrade, setCurrentGrade] = useState(stageConfig.grade);
  const [currentTextbook, setCurrentTextbook] = useState(stageConfig.textbook);

  useEffect(() => {
      setCurrentGrade(stageConfig.grade);
      setCurrentTextbook(stageConfig.textbook);
  }, [activeSubject, stageConfig]);

  // 每次 SubjectMap 首次挂载 / 页面刷新时，根据 skipWizard 状态决定是否显示规划向导
  useEffect(() => {
      if (skipWizard && isAssessed) {
          // 只有当明确要求跳过向导（skipWizard=true）且已评估时，才自动生成计划
          setExpeditionPlan({
              target: 'consolidate',
              duration: 30,
              startDate: new Date()
          } as any);
          setIsPlannerOpen(false);
      } else {
          // 默认显示 LumiExpeditionWizard；Planner 弹窗仅在用户主动打开时再置 true
          setExpeditionPlan(null);
          setIsPlannerOpen(false);
      }
  }, [skipWizard, isAssessed]);

  useEffect(() => {
    setIsMapReady(false); 
    setMapData(null);
    setPathD('');

    // 课本同步学仅保留顶部学科切换，不再加载知识图谱或学科地图数据。
    if (mapMode === 'pro' || !isCoreSubject(activeSubject)) return;
    
    // Simulate slight delay to allow smooth transition
    setTimeout(() => {
        getSubjectMapData(activeSubject, mapMode as MapMode).then(data => {
            setMapData(data);
        });
    }, 100);
  }, [activeSubject, mapMode, isAssessed, expeditionPlan]);

  // Open config chat when switching to exam-mode
  useEffect(() => {
    if (learningStrategy === 'exam-mode') {
      setIsConfigChatOpen(true);
    }
  }, [learningStrategy]);

  const hideModeRail =
    showThinkingProcess ||
    !isAssessed ||
    isConfigChatOpen ||
    (mapMode === 'sync' && !!selectedNode) ||
    isSyncSubPageOpen;

  const modeRailVariant =
    mapMode === 'pro' || learningStrategy !== 'exam-mode' ? 'light' : 'dark';

  // 弹窗/Sheet 打开时隐藏左侧模式切换栏
  useEffect(() => {
    onBlockingOverlayChange?.(hideModeRail);
  }, [hideModeRail, onBlockingOverlayChange]);

  useEffect(() => {
    return () => onBlockingOverlayChange?.(false);
  }, [onBlockingOverlayChange]);

  // Cleanup thinking timers on unmount
  useEffect(() => {
    return () => {
      thinkingTimersRef.current.forEach(clearTimeout);
      thinkingTimersRef.current = [];
    };
  }, []);

  // --- 1. Pre-calculate Display Nodes with Consistent Offsets ---
  const displayNodes = useMemo(() => {
      if (!mapData?.nodes) return [];
      
      const sorted = [...mapData.nodes].sort((a, b) => b.level - a.level);
      
      return sorted.map((node, index) => {
          const reverseIdx = sorted.length - 1 - index;
          const isBase = reverseIdx === 0;
          const baseOffset = 40; // Increased for rail
          let xOffset = isBase ? 0 : (reverseIdx % 2 === 0 ? -baseOffset : baseOffset);
          if (node.xOffset !== undefined) xOffset = node.xOffset; 

          return { ...node, xOffset };
      });
  }, [mapData]);

  // --- 1.2 Galaxy Layout Calculation (Pro Mode) ---
  const galaxyNodes = useMemo(() => {
      if (mapMode !== 'pro' || !mapData?.nodes) return { sun: null, planets: [], all: [] };

      const nodes = [...mapData.nodes];
      const sunNode = nodes.find(n => n.nodeType === 'boss' || n.id === 'pboss') || nodes[nodes.length - 1];
      const planets = nodes.filter(n => n.id !== sunNode.id);

      const computedNodes: any[] = [];

      if (sunNode) {
        computedNodes.push({
            ...sunNode,
            style: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 20 },
            isSun: true
        });
      }

      const totalPlanets = planets.length;
      const radius = 28; 
      
      planets.forEach((node, i) => {
          const angleDeg = (360 / totalPlanets) * i - 90; 
          const angleRad = (angleDeg * Math.PI) / 180;
          
          const left = 50 + radius * Math.cos(angleRad); 
          const top = 50 + radius * Math.sin(angleRad);  
          
          computedNodes.push({
              ...node,
              style: { 
                  top: `${top}%`, 
                  left: `${left}%`, 
                  transform: 'translate(-50%, -50%)',
                  zIndex: 10
              },
              angle: angleDeg 
          });
      });

      return { sun: sunNode, planets, all: computedNodes };
  }, [mapData, mapMode]);


  // --- 1.5 Sprint Groups Calculation (Weekly Themes) ---
  const sprintGroups = useMemo(() => {
    if (displayNodes.length === 0) return [];
    
    // Sort nodes by level to ensure correct order
    const nodes = [...displayNodes].sort((a, b) => a.level - b.level);
    const weeks: any[] = [];
    const DAYS_PER_WEEK = 7;
    
    // Theme configuration
    const WEEKLY_THEMES = [
      { id: 'forest', name: 'Magic Forest', bg: 'bg-green-50/20', accent: 'text-green-600', border: 'border-green-200' },
      { id: 'desert', name: 'Golden Desert', bg: 'bg-amber-50/20', accent: 'text-amber-600', border: 'border-amber-200' },
      { id: 'ice', name: 'Crystal Ice', bg: 'bg-cyan-50/20', accent: 'text-cyan-600', border: 'border-cyan-200' },
      { id: 'volcano', name: 'Fire Mountain', bg: 'bg-orange-50/20', accent: 'text-orange-600', border: 'border-orange-200' },
      { id: 'cyber', name: 'Cyber City', bg: 'bg-slate-900/20', accent: 'text-purple-400', border: 'border-purple-500/30' }
    ];

    const getThemeForWeek = (weekIndex: number) => {
      return WEEKLY_THEMES[weekIndex % WEEKLY_THEMES.length];
    };
    
    let nodeIdx = 0;
    let weekCount = 0;
    
    while (nodeIdx < nodes.length) {
        // Slice 7 nodes for a week
        const chunk = nodes.slice(nodeIdx, nodeIdx + DAYS_PER_WEEK);
        
        if (chunk.length === 0) break;
        
        const isAllCompleted = chunk.every(n => n.status === 'completed');
        const hasCurrent = chunk.some(n => n.status === 'current');
        
        let status = 'locked';
        if (isAllCompleted) status = 'completed';
        else if (hasCurrent) status = 'current';
        
        weeks.push({
            id: `week-${weekCount}`,
            weekLabel: `Week ${weekCount + 1}`,
            theme: getThemeForWeek(weekCount),
            status,
            nodes: chunk.map((node, index) => ({
                ...node,
                dayIndex: index + 1, // 1-7
                isWeekend: index >= 5 
            }))
        });
        
        nodeIdx += DAYS_PER_WEEK;
        weekCount++;
    }
    
    return weeks.reverse();
  }, [displayNodes, learningStrategy]);

  // --- 2. Core Layout Engine (Path Drawing) ---
  useLayoutEffect(() => {
      if (sprintGroups.length === 0 || !contentContainerRef.current) return;

      const timer = setTimeout(() => {
          if (!contentContainerRef.current || !nodeRefs.current) return;
          
          const containerRect = contentContainerRef.current.getBoundingClientRect();
          const points: { x: number; y: number }[] = [];
          
          // Flatten nodes from groups logic.
          // sprintGroups is [Week N ... Week 1] (Top to Bottom visually)
          // We want to trace path from Level 1 (Bottom) to Level N (Top).
          // So we iterate sprintGroups in reverse (Week 1 -> Week N).
          const logicalWeeks = [...sprintGroups].reverse();
          
          logicalWeeks.forEach(week => {
              // Within a week, nodes are [Day 1, Day 2 ...].
              // Rendered as flex-col-reverse, so Day 1 is Bottom.
              // Logic path: Day 1 -> Day 2 -> ...
              week.nodes.forEach((node: any) => {
                  const el = nodeRefs.current.get(node.id);
                  if (el) {
                      const elRect = el.getBoundingClientRect();
                      
                      // Calculate center relative to contentContainer
                      // We add scrollTop because the container is scrollable, and we want absolute coordinates within the scrollable area
                      const actualY = elRect.top - containerRect.top + elRect.height / 2 + contentContainerRef.current.scrollTop;

                      // FIX: Use Calculated Offset instead of DOM position to ensure S-Curve
                      // The DOM position might be centered initially due to flex layout timing
                      const offsets = [0, -60, 60, 0, -60, 60, 0];
                      const dayIdx = (node.dayIndex - 1) % 7;
                      const calculatedOffset = offsets[dayIdx];
                      // Container Center + Offset
                      const actualX = (containerRect.width / 2) + calculatedOffset;

                      points.push({ x: actualX, y: actualY });
                  }
              });
          });

          if (points.length < 2) {
              setPathD('');
              setIsMapReady(true);
              return;
          }

          let d = `M ${points[0].x} ${points[0].y}`;
          for (let i = 0; i < points.length - 1; i++) {
              const p1 = points[i];
              const p2 = points[i + 1];
              const tension = 0.4; 
              const distY = p2.y - p1.y; 
              // Control points for smooth S-curve
              const cp1 = { x: p1.x, y: p1.y + distY * tension }; 
              const cp2 = { x: p2.x, y: p2.y - distY * tension };
              d += ` C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${p2.x} ${p2.y}`;
          }

          setPathD(d);
          
          // Scroll to current
          const currentNode = displayNodes.find(n => n.status === 'current');
          if (currentNode) {
              const el = nodeRefs.current.get(currentNode.id);
              if (el) {
                  el.scrollIntoView({ block: 'center', behavior: 'smooth' });
              }
          } else {
             contentContainerRef.current.scrollTop = contentContainerRef.current.scrollHeight;
          }

          requestAnimationFrame(() => setIsMapReady(true));

      }, 100);

      return () => clearTimeout(timer);
  }, [sprintGroups, displayNodes]);


  const handleNodeClick = (node: MapNode) => {
    if (node.status !== 'locked') {
      setSelectedNode(node);
    } 
  };

  const handleStart = () => {
      if (selectedNode && onStartLevel) {
          const dur = selectedNode.duration ? parseInt(selectedNode.duration.replace(/\D/g, '')) : 15;
          onStartLevel({
              id: selectedNode.id,
              title: selectedNode.title,
              subject: activeSubject,
              durationMinutes: isNaN(dur) ? 15 : dur,
              completed: selectedNode.status === 'completed',
              levelType: selectedNode.nodeType,
              quizType: selectedNode.quizType
          });
      }
      setSelectedNode(null);
  };

  const setMapMode = (mode: MapMode) => {
      if (onModeChange) onModeChange(mode);
  };

  const handleConfigComplete = (config: any) => {
    setExamConfig(config); 
    thinkingTimersRef.current.forEach(clearTimeout);
    thinkingTimersRef.current = [];
    
    setIsConfigChatOpen(false);
    setShowThinkingProcess(true);
    setThinkingStage(0);
    
    const stages = [
      { delay: 0, stage: 0 },
      { delay: 2000, stage: 1 },
      { delay: 4000, stage: 2 },
      { delay: 6000, stage: 3 },
    ];
    
    const timers = stages.map(s => 
      setTimeout(() => setThinkingStage(s.stage), s.delay)
    );
    
    const hideTimer = setTimeout(() => {
      setShowThinkingProcess(false);
    }, 8000);
    
    thinkingTimersRef.current = [...timers, hideTimer];
  };

  // Thinking messages configuration
  const thinkingMessages = [
    { 
      icon: '💭', 
      title: learningStrategy === 'exam-mode' ? '正在分析你的错题历史...' : '正在分析你的学习数据...', 
      sub: '扫描错题记录 · 识别薄弱环节' 
    },
    { 
      icon: '🔍', 
      title: '检测到关键薄弱点...', 
      sub: '计算类易错 · 概念理解偏差' 
    },
    { 
      icon: '⚡', 
      title: learningStrategy === 'exam-mode' ? '生成备考冲刺方案...' : '生成针对性训练方案...', 
      sub: '设计题型梯度 · 规划学习节奏' 
    },
    { 
      icon: '✨', 
      title: '地图构建完成！', 
      sub: learningStrategy === 'exam-mode' ? '为你准备了冲刺关卡' : '为你准备了个性化关卡' 
    },
  ];

  const showModeRail = !embedded && !hideModeRail && !!onModeChange;
  const syncChromeInset = embedded
    ? 'absolute inset-x-0 top-0 bottom-0 flex min-h-0 px-5 pt-3 pb-3'
    : 'absolute inset-x-0 top-0 bottom-16 flex min-h-0 px-5 pt-[72px] pb-3';

  return (
    <div className={`relative w-full h-full min-h-0 flex flex-col overflow-hidden transition-colors duration-700 ${
        showModeRail ? 'pl-14' : ''
    } ${
        mapMode === 'pro' ? 'bg-[#FAF9F6]' :
        learningStrategy === 'exam-mode' ? 'bg-slate-900' : 
        'bg-[#F5F7FA]'
    }`}>

      {/* 左侧通栏：与 SubjectMap 同高，顶底贴边 */}
      {showModeRail && (
        <div className="absolute left-0 top-0 bottom-0 w-14 z-30 pointer-events-none">
          <div
            className={`absolute inset-0 ${
              modeRailVariant === 'dark'
                ? 'bg-[#1c1c2e]/95 border-r border-white/10 backdrop-blur-xl'
                : 'bg-[#FAF9F6]'
            }`}
          />
          <div className="relative pointer-events-auto pt-[72px]">
            <ModeSwitchRail
              mapMode={mapMode}
              onModeChange={onModeChange}
              variant={modeRailVariant}
            />
          </div>
        </div>
      )}
      
      {/* Thinking Process Overlay */}
      {showThinkingProcess && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 bg-gradient-to-b from-[#F5F7FA] to-[#E0F2FE] flex flex-col items-center justify-center"
        >
          <div className="mb-8">
            <InteractiveLumi size="lg" emotion="thinking" />
          </div>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={thinkingStage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="bg-white/60 backdrop-blur-md rounded-3xl p-6 border border-white/50 shadow-lg max-w-md mx-4 text-center"
            >
              <div className="text-4xl mb-3">{thinkingMessages[thinkingStage].icon}</div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                {thinkingMessages[thinkingStage].title}
              </h3>
              <p className="text-sm text-gray-500">
                {thinkingMessages[thinkingStage].sub}
              </p>
            </motion.div>
          </AnimatePresence>
          
          <div className="mt-8 flex gap-2">
            {[0, 1, 2, 3].map(i => (
              <motion.div 
                key={i}
                initial={{ scale: 0.75 }}
                animate={{ 
                  scale: i <= thinkingStage ? 1 : 0.75,
                  backgroundColor: i <= thinkingStage ? '#06b6d4' : '#d1d5db'
                }}
                transition={{ duration: 0.3 }}
                className="w-2 h-2 rounded-full"
              />
            ))}
          </div>

          <div className="absolute inset-0 pointer-events-none -z-10">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand/10 rounded-full blur-[120px] animate-pulse"></div>
          </div>
        </motion.div>
      )}
      
      {/* Unassessed Lock Overlay */}
      {!isAssessed && (
          <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center text-center p-8 pointer-events-auto">
              <motion.div 
                 initial={{ scale: 0.9, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 className="bg-gray-900/90 border border-white/10 rounded-[32px] p-8 max-w-sm shadow-2xl relative overflow-hidden text-white"
              >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand to-purple-500"></div>
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-white/50 border border-white/10">
                      <Lock size={32} />
                  </div>
                  <h3 className="text-xl font-black mb-2">地图待解锁</h3>
                  <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                      小晤 需要先了解你的能力，才能为你配置最合适的关卡难度。
                  </p>
                  <div className="flex items-center justify-center gap-2 text-brand-light font-bold text-xs bg-brand/10 py-2 rounded-lg border border-brand/20">
                      <Zap size={14} fill="currentColor" />
                      请先在首页完成能力测评
                  </div>
              </motion.div>
          </div>
      )}

      {/* Background Ambience (Bright Tech Style) */}
      {mapMode === 'pro' ? (
          <div className="absolute inset-0 pointer-events-none bg-[#FAF9F6]" />
      ) : mapMode === 'sync' && learningStrategy === 'sync-mode' ? (
          <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-b from-[#F5F7FA] via-[#F0F4F8] to-[#Eef2f6]"></div>
              
              {/* Diffused Orbs - Soft Bright Colors */}
              <div className="absolute top-[-10%] left-[-20%] w-[70%] h-[50%] bg-blue-400/10 rounded-full blur-[120px] animate-pulse"></div>
              <div className="absolute bottom-[-10%] right-[-20%] w-[70%] h-[60%] bg-purple-400/10 rounded-full blur-[120px] animate-pulse" style={{animationDelay: '2s'}}></div>
              <div className="absolute top-[40%] left-[20%] w-[60%] h-[60%] bg-cyan-400/10 rounded-full blur-[100px] opacity-60"></div>
              
              {/* Refined Dot Pattern */}
              <div className="absolute inset-0 opacity-[0.2]" style={{ backgroundImage: 'radial-gradient(#94A3B8 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
          </div>
      ) : learningStrategy === 'exam-mode' ? (
        <div className="absolute inset-0 pointer-events-none">
             <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900"></div>
             <div className="absolute inset-0 opacity-20" style={{ 
                 backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(255, 255, 255, .05) 25%, rgba(255, 255, 255, .05) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, .05) 75%, rgba(255, 255, 255, .05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(255, 255, 255, .05) 25%, rgba(255, 255, 255, .05) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, .05) 75%, rgba(255, 255, 255, .05) 76%, transparent 77%, transparent)',
                 backgroundSize: '50px 50px'
             }}></div>
             <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-indigo-900/40 to-transparent blur-3xl"></div>
        </div>
      ) : (
          <div className="absolute inset-0 pointer-events-none overflow-hidden bg-slate-900">
               <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(100,116,139,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(100,116,139,0.3) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
          </div>
      )}

      {/* --- CONTENT LAYER --- */}
      {learningStrategy === 'exam-mode' ? (
          <div className="flex-1 overflow-y-auto no-scrollbar relative z-10 w-full" ref={scrollContainerRef}>
              <div className="min-h-full pb-32 pt-16 flex flex-col items-center w-full max-w-md mx-auto relative px-4">
                  <div className="relative z-10 flex flex-col items-center mb-12">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-amber-300 to-orange-500 p-1 shadow-[0_0_50px_rgba(245,158,11,0.5)] animate-pulse">
                          <div className="w-full h-full rounded-full bg-black/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                              <Flag size={40} className="text-white fill-white" />
                          </div>
                      </div>
                      <div className="mt-4 bg-slate-800/80 backdrop-blur-md border border-amber-500/30 px-6 py-2 rounded-xl text-center">
                          <h2 className="text-amber-400 font-black text-lg tracking-wider uppercase">Final Exam</h2>
                          <div className="text-white/60 text-xs font-bold">Target Date: {examConfig?.examDate ? `${examConfig.examDate.getMonth()+1}/${examConfig.examDate.getDate()}` : 'TBD'}</div>
                      </div>
                  </div>

                  <div className="w-full space-y-8 flex flex-col items-center">
                      {sprintGroups.map((group, idx) => (
                          <div key={group.id} className={`relative w-full transition-all duration-500 ${
                              group.isToday ? 'scale-105' : 'scale-95 opacity-80'
                          }`}>
                              <div className={`absolute left-4 -top-3 z-20 px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border backdrop-blur-md shadow-sm ${
                                  group.isToday 
                                    ? 'bg-indigo-500 text-white border-indigo-400' 
                                    : 'bg-slate-800 text-slate-400 border-slate-700'
                              }`}>
                                  {group.dayLabel} · {group.date}
                              </div>

                              <div className={`
                                  relative w-full rounded-[24px] p-2 border backdrop-blur-xl transition-all
                                  ${group.isToday 
                                      ? 'bg-slate-800/60 border-indigo-500/50 shadow-[0_10px_40px_-10px_rgba(99,102,241,0.3)]' 
                                      : 'bg-slate-900/40 border-white/5'
                                  }
                              `}>
                                  <div className="absolute inset-0 rounded-[24px] bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
                                  <div className="flex justify-around items-center py-4 px-2">
                                      {group.nodes.map((node: MapNode) => (
                                          <div key={node.id} className="relative z-10 transform scale-90">
                                              <GameNodeComponent node={node} onClick={() => handleNodeClick(node)} />
                                          </div>
                                      ))}
                                  </div>
                                  {group.isToday && (
                                      <div className="absolute -bottom-3 right-4 bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1 animate-bounce">
                                          <Zap size={12} fill="currentColor" />
                                          CURRENT MISSION
                                      </div>
                                  )}
                              </div>
                          </div>
                      ))}
                  </div>

                  <div className="mt-16 flex flex-col items-center opacity-50 relative z-10">
                       <div className="w-2 h-16 bg-gradient-to-b from-indigo-500/50 to-transparent rounded-full mb-2"></div>
                       <div className="px-4 py-2 rounded-full bg-slate-800 border border-slate-700 text-slate-500 text-xs font-bold uppercase tracking-widest">
                           Start Point
                       </div>
                  </div>
              </div>
          </div>
      ) : mapMode === 'sync' ? (
          <>
            {/* Top Bar Controller - UNIFIED */}
            <TopBarController
                expeditionPlan={expeditionPlan}
                activeSubject={activeSubject}
                currentGrade={currentGrade}
                currentTextbook={currentTextbook}
                stageConfig={stageConfig}
                onOpenSyllabus={() => {}}
                mode="sync"
                onModeChange={(m) => setMapMode(m)}
            />

            <div 
                className={`flex-1 min-h-0 overflow-x-hidden no-scrollbar relative z-0 ${
                    expeditionPlan ? 'overflow-y-auto scroll-smooth pb-20' : 'overflow-hidden pt-[72px] pb-20'
                }`}
                ref={scrollContainerRef}
            >
                {!expeditionPlan ? (
                    <div className="h-full min-h-0 w-full flex items-center justify-center overflow-hidden">
                        <LumiExpeditionWizard 
                            subject={activeSubject}
                            onComplete={(plan) => {
                                setTimeout(() => {
                                    setExpeditionPlan({
                                        target: plan.intent,
                                        duration: plan.duration,
                                        startDate: new Date(),
                                    } as any);
                                    
                                    // Trigger map refresh/animation
                                    setIsMapReady(false);
                                    setTimeout(() => setIsMapReady(true), 600);
                                }, 300);
                            }}
                        />
                    </div>
                ) : (
                    <motion.div 
                        ref={contentContainerRef}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: isMapReady ? 1 : 0 }}
                        transition={{ duration: 0.5 }}
                        className="min-h-[120%] pb-6 w-full relative flex flex-col items-center pt-72"
                    >
                        {/* MAGLEV RAIL SVG */}
                        {/* 
                           BUG FIX: 
                           Use a dedicated container that spans the entire scrollable height.
                           The previous absolute positioning on the parent was clipping the SVG.
                           Now we put the SVG inside the flow of the document (behind the nodes) 
                           but absolutely positioned relative to the full content container.
                        */}
                        <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-10">
                           <svg className="w-full h-full overflow-visible" style={{ border: '2px solid rgba(255, 0, 0, 0.0)' }}> {/* DEBUG: Red Border Removed */}
                               <defs>
                                 {/* Dynamic Theme Gradient based on Weeks */}
                                 <linearGradient id="themeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                    {sprintGroups.length > 0 ? sprintGroups.map((group, i) => {
                                        const themeColors: any = {
                                            forest: '#22c55e', // green-500
                                            desert: '#f59e0b', // amber-500
                                            ice: '#06b6d4',    // cyan-500
                                            volcano: '#f97316', // orange-500
                                            cyber: '#8b5cf6'   // violet-500
                                        };
                                        const color = themeColors[group.theme.id] || '#cbd5e1';
                                        // Calculate offset based on week position (Top to Bottom)
                                        const offset = `${(i / (Math.max(sprintGroups.length - 1, 1))) * 100}%`;
                                        return <stop key={group.id} offset={offset} stopColor={color} />;
                                    }) : (
                                        <>
                                            <stop offset="0%" stopColor="#06b6d4" />
                                            <stop offset="100%" stopColor="#3b82f6" />
                                        </>
                                    )}
                                 </linearGradient>

                                 <linearGradient id="energyFill" x1="0%" y1="0%" x2="0%" y2="100%">
                                   <stop offset="0%" stopColor="white" stopOpacity="0.8" />
                                   <stop offset="100%" stopColor="white" stopOpacity="0.1" />
                                 </linearGradient>
                                 
                                 {/* Soft Glow Filter */}
                                 <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                                    <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
                                    <feMerge>
                                        <feMergeNode in="coloredBlur"/>
                                        <feMergeNode in="SourceGraphic"/>
                                    </feMerge>
                                 </filter>
                               </defs>
                               
                               {/* LAYER 1: The Halo (Atmosphere) - Uses Theme Gradient */}
                               <path 
                                   d={pathD} 
                                   fill="none" 
                                   stroke="url(#themeGradient)" 
                                   strokeOpacity="0.5" 
                                   strokeWidth="40" 
                                   strokeLinecap="round" 
                                   filter="url(#glow)" 
                               />

                               {/* LAYER 2: The Glass Tube (Structure) */}
                               <path 
                                   d={pathD} 
                                   fill="none" 
                                   stroke="white" 
                                   strokeOpacity="0.4" 
                                   strokeWidth="12" 
                                   strokeLinecap="round" 
                                   className="backdrop-blur-sm"
                               />
                               
                               {/* LAYER 3: The Energy Core (Flow) */}
                               <motion.path 
                                  d={pathD} 
                                  fill="none" 
                                  stroke="url(#energyFill)" 
                                  strokeWidth="4" 
                                  strokeLinecap="round"
                                  strokeDasharray="20 40"
                                  animate={{ strokeDashoffset: [0, -60] }}
                                  transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                               />
                            </svg>
                        </div>

                        {/* Time Drone */}

                        {/* TOP ANCHOR */}
                        <div className="mb-24 flex flex-col items-center opacity-60 mt-32 relative z-10">
                            <div className="w-20 h-20 rounded-full border-2 border-dashed border-indigo-200 flex items-center justify-center animate-spin-slow">
                                <Sparkles size={24} className="text-indigo-300" />
                            </div>
                            <div className="w-1 h-12 bg-gradient-to-t from-indigo-300/50 to-transparent rounded-full mt-2"></div>
                            <span className="text-[10px] font-black text-indigo-300 mt-2 tracking-widest uppercase">Chapter Complete</span>
                        </div>

                        {/* Nodes Loop - Refactored for Weekly View */}
                        {sprintGroups.length > 0 ? (
                            <div className="flex flex-col w-full pb-6">
                                {sprintGroups.map((week, wIndex) => (
                                    <WeekSection key={week.id} week={week}>
                                        <div className="flex flex-col-reverse items-center w-full relative z-10 gap-20 pb-12 pt-12">
                                            {week.nodes.map((node: any, dayIdx: number) => {
                                                // Zig-zag offset pattern for 7 days
                                                // Pattern: Center(0), Left(-60), Right(60), Center(0), Left(-60), Right(60), Center(0)
                                                const offsets = [0, -60, 60, 0, -60, 60, 0];
                                                const xOffset = offsets[dayIdx % 7];
                                                const isStart = dayIdx === 0;
                                                const isEnd = dayIdx === week.nodes.length - 1;
                                                
                                                return (
                                                    <div 
                                                        key={node.id} 
                                                        ref={el => { if(el) nodeRefs.current.set(node.id, el); }}
                                                        id={node.status === 'current' ? 'guide-map-node' : undefined}
                                                        className="relative flex justify-center items-center w-full z-20"
                                                    >
                                                        {/* Day Tag */}
                                                        <div className={`absolute ${xOffset > 0 ? 'left-1/2 -ml-36' : 'left-1/2 ml-24'} top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400/60 uppercase tracking-widest transition-opacity hover:opacity-100 pointer-events-none`}>
                                                            Day {node.dayIndex}
                                                        </div>
                                                        
                                                        <div style={{ transform: `translateX(${xOffset}px)` }} className="relative z-10">
                                                            <GameNodeComponent node={node} onClick={() => handleNodeClick(node)} />
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </WeekSection>
                                ))}
                            </div>
                        ) : (
                        displayNodes.map((node, index) => {
                              const xOffset = node.xOffset || 0; 
                              const isWeekGate = index === 7 || index === 14;

                              return (
                                  <React.Fragment key={node.id}>
                                    {isWeekGate && (
                                      <div className="relative z-20 w-full flex justify-center mb-24">
                                         <div className="w-64 h-16 relative flex items-center justify-center">
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent blur-xl" />
                                            <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent" />
                                            <div className="absolute px-4 py-1 rounded-full bg-white/80 backdrop-blur-md border border-cyan-200 shadow-sm flex items-center gap-2">
                                               <Lock size={12} className="text-cyan-500" />
                                               <span className="text-[10px] font-black text-cyan-600 uppercase tracking-[0.2em]">Week {index === 7 ? '1' : '2'} Terminal</span>
                                            </div>
                                         </div>
                                      </div>
                                    )}
                                    <div 
                                       ref={el => { if(el) nodeRefs.current.set(node.id, el); }}
                                       id={node.status === 'current' ? 'guide-map-node' : undefined}
                                       className="relative flex justify-center items-center z-10 mb-24 last:mb-0 w-full"
                                    >
                                       <div style={{ transform: `translateX(${xOffset}px)` }} className="flex justify-center items-center perspective-1000">
                                          <GameNodeComponent node={node} onClick={() => handleNodeClick(node)} />
                                       </div>
                                    </div>
                                  </React.Fragment>
                              )
                        }))}
                        
                        {/* BOTTOM ANCHOR */}
                        <div className="mt-20 flex flex-col items-center relative z-10">
                            <div className="w-1 h-12 bg-gradient-to-b from-blue-300/50 to-transparent rounded-full mb-2"></div>
                            <div className="w-24 h-8 bg-blue-50 border border-blue-200 rounded-[100%] flex items-center justify-center shadow-sm">
                                <Rocket size={14} className="text-blue-400 rotate-[-45deg]" />
                            </div>
                            <span className="text-[10px] font-black text-blue-400 mt-2 uppercase tracking-widest">Base Camp</span>
                        </div>

                        <AnimatePresence>
                            {demoMapEvent === 'remedial' && (
                                <motion.div 
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    transition={{ type: 'spring', damping: 15, stiffness: 200 }}
                                    className="absolute top-[40%] left-[15%] z-30 flex flex-col items-center"
                                    onClick={() => onStartLevel && onStartLevel({ 
                                        id: 'remedial-1', 
                                        title: '计算急救站', 
                                        levelType: 'practice', 
                                        quizType: 'standard' 
                                    })}
                                >
                                    <div className="relative">
                                        <div className="absolute -inset-4 bg-red-500/20 rounded-full animate-ping"></div>
                                        <div className="w-16 h-16 rounded-2xl bg-white shadow-xl border-2 border-red-100 flex items-center justify-center relative z-10 cursor-pointer hover:scale-105 transition-transform">
                                            <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center border border-white">
                                                <AlertTriangle size={10} className="text-white" />
                                            </div>
                                            <Stethoscope size={28} className="text-red-500" />
                                        </div>
                                    </div>
                                    <div className="mt-2 bg-white/90 backdrop-blur-md px-3 py-1 rounded-lg shadow-md border border-red-100 flex flex-col items-center">
                                        <span className="text-[10px] font-black text-red-500 uppercase tracking-wider">EMERGENCY</span>
                                        <span className="text-xs font-bold text-gray-800">计算急救站</span>
                                    </div>
                                </motion.div>
                            )}

                            {demoMapEvent === 'bonus' && (
                                <motion.div 
                                    initial={{ scale: 0, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0, opacity: 0 }}
                                    transition={{ type: 'spring', damping: 15, stiffness: 200 }}
                                    className="absolute z-30 flex flex-col items-center"
                                    style={{ top: '1334px', left: '337px', width: '683px' }}
                                    onClick={() => onStartLevel && onStartLevel({ 
                                        id: 'bonus-1', 
                                        title: '极速挑战擂台', 
                                        levelType: 'chest', 
                                        quizType: 'standard' 
                                    })}
                                >
                                    <div className="relative">
                                        <div className="absolute -inset-4 bg-yellow-400/20 rounded-full animate-pulse"></div>
                                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-300 to-amber-500 shadow-xl border-2 border-white flex items-center justify-center relative z-10 cursor-pointer hover:scale-105 transition-transform">
                                            <Trophy size={28} className="text-white drop-shadow-md" />
                                            <div className="absolute -bottom-1 -right-1">
                                                <Flame size={16} className="text-orange-600 fill-orange-600 animate-bounce" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-2 bg-white/90 backdrop-blur-md px-3 py-1 rounded-lg shadow-md border border-amber-100 flex flex-col items-center">
                                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-wider">BONUS STAGE</span>
                                        <span className="text-xs font-bold text-gray-800">极速擂台</span>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </div>
          </>
      ) : (
          /* 课本同步学：保留顶部语文 / 数学 / 英语 Tab，移除三科知识图谱功能与数据展示。 */
          <div className="relative z-10 flex-1 w-full min-h-0 bg-[#FAF9F6]">
            {(((activeSubject === '语文' || activeSubject === '数学' || activeSubject === '英语') || isCatalogSubject) && isJuniorGrade(userGrade, schoolSystem)) ? (
              <div className={`${syncChromeInset} items-stretch justify-center overflow-hidden`}>
                <div className="flex h-full min-h-0 w-full max-w-5xl items-stretch gap-2">
                  {teacherAd && (
                    <SyncTeacherAdCard
                      ad={teacherAd}
                    />
                  )}
                  <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col gap-2">
                    <div className="flex min-h-0 min-w-0 flex-1 gap-2">
                    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-1.5">
                  <div className={`flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-indigo-100 bg-white/90 px-3.5 py-3 shadow-[0_8px_24px_rgba(99,102,241,0.06)]`}>
                    <div className="flex h-9 min-w-0 shrink-0 items-center gap-2">
                      <BookOpen size={16} className="shrink-0 text-indigo-500" />
                      <h2 className="shrink-0 text-[15px] font-semibold leading-none text-slate-900">教材全解</h2>
                      <span className="shrink-0 whitespace-nowrap text-[10px] font-normal leading-none text-slate-400/90" title="教材版本请到「我的 · 我的课本」修改">{syncTextbookVersion}</span>
                      <div ref={lessonSwitcherRef} className="relative min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={hasSyncUnits ? toggleLessonSwitcher : undefined}
                          disabled={!hasSyncUnits}
                          aria-label={hasSyncUnits ? `切换${filterLabels.parent}` : `暂无${filterLabels.parent}`}
                          aria-expanded={hasSyncUnits ? isLessonSwitcherOpen : undefined}
                          className={`flex h-8 w-full min-w-0 items-center gap-1.5 rounded-lg border px-2.5 text-left shadow-[0_2px_8px_rgba(99,102,241,0.06)] ${
                            hasSyncUnits
                              ? 'border-indigo-100 bg-indigo-50/80 transition hover:border-indigo-200 hover:bg-indigo-50'
                              : 'cursor-default border-slate-100 bg-slate-50'
                          }`}
                        >
                          <span className={`min-w-0 flex-1 truncate text-[12px] font-semibold leading-none ${hasSyncUnits ? 'text-indigo-700' : 'text-slate-400'}`}>
                            {currentParentTitle || `暂无${filterLabels.parent}`}
                          </span>
                          {hasSyncUnits && (
                            <ChevronDown size={13} className={`shrink-0 text-indigo-400 ${isLessonSwitcherOpen ? 'rotate-180 transition-transform' : 'transition-transform'}`} />
                          )}
                        </button>
                        {isLessonSwitcherOpen && (
                          createPortal(<>
                          <div className="absolute inset-0 z-[980] bg-slate-950/35" onClick={closeLessonSwitcher} aria-hidden="true" />
                          <div role="dialog" aria-label={`${filterLabels.parent}切换`} style={{ left: lessonSwitcherAnchor?.left ?? 0, top: lessonSwitcherAnchor?.top ?? 0 }} className="absolute z-[990] flex h-80 w-80 max-h-[calc(100%-32px)] max-w-[calc(100%-32px)] flex-col overflow-hidden rounded-2xl border border-indigo-100 bg-white shadow-[0_18px_45px_rgba(67,56,202,0.18)]">
                            <div className="shrink-0 px-2.5 py-2 text-[11px] font-semibold text-slate-400">
                              {filterLabels.parent}
                            </div>
                            <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-1.5 pb-2">
                              {isCatalogSubject
                                ? catalogUnits.map((unit) => {
                                  const isCurrent = catalogUnit?.id === unit.id;
                                  return (
                                    <button
                                      key={unit.id}
                                      type="button"
                                      onClick={() => selectCatalogUnit(unit.id)}
                                      className={`flex w-full items-center rounded-lg border px-2 py-1.5 text-left text-[12px] font-medium transition ${
                                        isCurrent
                                          ? 'border-indigo-500 bg-indigo-500 text-white'
                                          : 'border-slate-100 bg-slate-50/80 text-slate-600 hover:border-indigo-100 hover:bg-indigo-50 hover:text-indigo-600'
                                      }`}
                                    >
                                      <span className="min-w-0 flex-1 truncate">{unit.title}</span>
                                    </button>
                                  );
                                })
                                : syncCatalogs.map((catalog) => {
                                  const isCurrent = currentSyncLesson?.unit === catalog;
                                  return (
                                    <button
                                      key={catalog}
                                      type="button"
                                      onClick={() => selectSyncCatalog(catalog)}
                                      className={`flex w-full items-center rounded-lg border px-2 py-1.5 text-left text-[12px] font-medium transition ${
                                        isCurrent
                                          ? 'border-indigo-500 bg-indigo-500 text-white'
                                          : 'border-slate-100 bg-slate-50/80 text-slate-600 hover:border-indigo-100 hover:bg-indigo-50 hover:text-indigo-600'
                                      }`}
                                    >
                                      <span className="min-w-0 flex-1 truncate">{catalog}</span>
                                    </button>
                                  );
                                })}
                            </div>
                          </div>
                          </>, document.getElementById('app-viewport') || document.body)
                        )}
                      </div>
                    </div>
                    {isCatalogSubject ? (
                    <div className="mt-2 flex min-h-0 flex-1 flex-col">
                    <div className="min-h-0 flex-1 overflow-hidden">
                    {(catalogUnit?.lessons ?? []).length === 0 ? (
                      <SyncEmptySectionState parent={filterLabels.parent} />
                    ) : (
                      <SyncChildEntryList
                        items={(catalogUnit?.lessons ?? []).map((lesson) => ({
                          id: lesson.id,
                          title: lesson.title,
                          demo: isShortageDemoText(lesson.title) || isShortageDemoText(lesson.id),
                        }))}
                        onOpen={(item) => {
                          const lesson = (catalogUnit?.lessons ?? []).find((entry) => entry.id === item.id);
                          if (!lesson) return;
                          setCatalogLessonFilterId(lesson.id);
                          setSelectedCatalogLesson({
                            id: lesson.id,
                            title: lesson.title,
                            sections: lesson.sections,
                          });
                        }}
                      />
                    )}
                    </div>
                    </div>
                    ) : activeSubject === '英语' ? (
                    <div className="mt-2 flex min-h-0 flex-1 flex-col">
                    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                    {(isShortageDemoChapter(currentSyncLesson?.unit) ? (
                      <SyncChildEntryList
                        items={currentChapterTopics.map((lesson, index) => ({
                          id: `${lesson.unit}-${lesson.section}-${index}`,
                          title: lesson.section,
                          demo: true,
                        }))}
                        onOpen={(item) => {
                          const lesson = currentChapterTopics.find((entry, index) => `${entry.unit}-${entry.section}-${index}` === item.id);
                          if (!lesson) return;
                          setEnglishShortageKind(matchShortageDemo(lesson.section));
                          setSyncSectionFilter(lesson.section);
                        }}
                      />
                    ) : (currentSyncLesson?.videos ?? []).length === 0 && !currentEnglishSections.length || currentUnitVideoPending ? (
                      <SyncEmptySectionState parent={filterLabels.parent} variant={currentUnitVideoPending ? 'videoPending' : 'empty'} />
                    ) : currentEnglishSections.length ? (
                      <SyncChildEntryList
                        items={currentEnglishSections.map((section) => ({
                          id: `${currentSyncLesson?.unit}-${section.id}`,
                          title: section.title,
                          lastHere: syncProgress.catalog === currentSyncLesson?.unit && syncProgress.section === section.title,
                        }))}
                        onOpen={(item) => {
                          const section = currentEnglishSections.find((entry) => `${currentSyncLesson?.unit}-${entry.id}` === item.id);
                          if (!section) return;
                          setSelectedSyncTopic(section.title);
                          saveLastSyncLesson(syncBookKey, currentSyncLesson?.unit ?? '', section.title);
                          setProgressTick((tick) => tick + 1);
                        }}
                      />
                    ) : (
                      <EnglishSkillGrid
                        videos={(currentSyncLesson?.videos ?? []).map((video) => ({ tag: video.tag, title: video.title }))}
                        onPlayVideo={(video, videoIndex) => {
                          const lesson = currentSyncLesson;
                          const videos = lesson?.videos ?? [];
                          markSyncVideoPlayed(syncBookKey, makeSyncVideoKey(lesson?.section ?? '', video.title || video.tag, videoIndex));
                          saveLastSyncLesson(syncBookKey, lesson?.unit ?? '', lesson?.section ?? '');
                          setProgressTick((tick) => tick + 1);
                          const items = videos.map((item, index) => ({
                            id: `${activeSubject}-sync-basic-${lesson?.section}-${item.tag}-${index}`,
                            title: item.tag || item.title,
                            durationSec: 20,
                          }));
                          const currentIndex = Math.min(Math.max(videoIndex, 0), Math.max(items.length - 1, 0));
                          onStartLevel?.({
                            id: items[currentIndex]?.id ?? `${activeSubject}-sync-basic-${lesson?.section}-${video.tag}-${videoIndex}`,
                            title: video.tag || video.title,
                            subject: activeSubject,
                            durationMinutes: 8,
                            levelType: 'practice',
                            aiReasoning: KG_SCOPE_MICRO_LESSON,
                            sectionVideoPlaylist: {
                              items,
                              currentIndex,
                              scopeLabel: lesson?.unit || lesson?.section,
                            },
                          });
                        }}
                      />
                    ))}
                    </div>
                    </div>
                    ) : (
                    <div className="mt-2 flex min-h-0 flex-1 flex-col">
                    <div className="min-h-0 flex-1 overflow-hidden">
                    {listedChapterTopics.length === 0 ? (
                      <SyncEmptySectionState parent={filterLabels.parent} />
                    ) : (
                      <SyncChildEntryList
                        items={listedChapterTopics.map((lesson, index) => ({
                          id: `${lesson.unit}-${lesson.section}-${index}`,
                          title: isShortageDemoText(lesson.section) ? lesson.section : formatSectionLabel(lesson.section, index),
                          group: activeSubject === '语文' ? chineseTaskGroupLabel(lesson, listedChapterTopics) : undefined,
                          lastHere: syncProgress.catalog === lesson.unit && syncProgress.section === lesson.section,
                          done: !!syncProgress.practices[`section:${lesson.section}`],
                          demo: isShortageDemoText(lesson.section),
                        }))}
                        onOpen={(item) => {
                          const lesson = listedChapterTopics.find((entry, index) => `${entry.unit}-${entry.section}-${index}` === item.id);
                          if (!lesson) return;
                          openChineseOrMathVideos(lesson);
                        }}
                      />
                    )}
                    </div>
                    </div>
                    )}
                    {showSyncAssessment && unitTestInfo && (
                      <SyncUnitTestFooter onStart={() => openUnitTest('online')} />
                    )}
                  </div>
                  </div>

                {showSyncAssessment && !embedded && (
                  <button
                    type="button"
                    onClick={() => setIsSelfPracticeOpen(true)}
                    className="group flex w-[108px] shrink-0 flex-col items-center justify-between rounded-2xl border border-violet-100 bg-white/90 px-2.5 py-3 text-center shadow-[0_8px_24px_rgba(139,92,246,0.08)] transition hover:border-violet-300 hover:bg-violet-50/40"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-[0_4px_12px_rgba(139,92,246,0.35)]">
                      <BookOpen size={18} />
                    </span>
                    <div className="mt-2 flex min-h-0 flex-1 flex-col items-center justify-center">
                      <h2 className="text-[14px] font-semibold leading-tight text-slate-900">自主练习</h2>
                    </div>
                    <span className="mt-2 flex items-center gap-0.5 text-[11px] font-semibold text-violet-600">
                      进入练习
                      <ChevronRight size={12} className="transition group-hover:translate-x-0.5" />
                    </span>
                  </button>
                )}
                    </div>

                {!embedded && activeSubject === '英语' && ['七年级', '八年级', '九年级'].includes(userGrade) ? (
                  <EnglishSpecialBar
                    onOpenVocab={() => setIsVocabPageOpen(true)}
                    onOpenSpeaking={() => setIsSpeakingPageOpen(true)}
                    onOpenGrammar={() => setIsGrammarPageOpen(true)}
                  />
                ) : !embedded && activeSubject === '数学' ? (
                  <MathImproveBar onOpen={() => setIsImprovePageOpen(true)} />
                ) : null}

                  </div>
                </div>
              </div>
            ) : (
              <div className={`${syncChromeInset} items-center justify-center`}>
                <p className="text-[13px] text-slate-400">该学科内容即将开放</p>
              </div>
            )}
          </div>
      )}

      {isUnitTestSetupOpen && unitTestInfo && createPortal(
        <div className="absolute inset-0 z-[600]">
          <PracticeSetupDialog
            open
            selectedCount={isCatalogSubject ? (catalogUnit?.lessons.length ?? 0) : currentChapterTopics.length}
            chapterCount={1}
            leafNoun={activeSubject === '语文' ? '篇课文' : activeSubject === '英语' ? '个课时' : '个小节'}
            subject={activeSubject}
            selectedScopeLabels={[unitTestInfo.scopeTitle]}
            paperTitleContext={{ version: syncTextbookVersion, grade: userGrade, term: activeTerm }}
            recommendedCount={unitTestInfo.questionCount}
            questionMax={unitTestMode === 'print' ? 20 : UNIT_TEST_QUESTION_MAX}
            startLabel={unitTestMode === 'print' ? '生成并打印' : '开始测试'}
            cancelLabel="暂不测试"
            title={unitTestMode === 'print' ? '试卷设置' : '开始单元测试，先选好题量、难度和场景'}
            guideText={undefined}
            assembling={isAssemblingPaper}
            initialDifficulty={unitSetupDifficulty}
            initialScenario={unitSetupScenario}
            onBackToScope={() => {
              if (assemblePaperTimerRef.current) window.clearTimeout(assemblePaperTimerRef.current);
              setIsAssemblingPaper(false);
              setIsUnitTestSetupOpen(false);
            }}
            onClose={() => {
              if (assemblePaperTimerRef.current) window.clearTimeout(assemblePaperTimerRef.current);
              setIsAssemblingPaper(false);
              setIsUnitTestSetupOpen(false);
            }}
            onConfirm={(setup) => startUnitTest(setup, { mode: unitTestMode })}
          />
        </div>,
        document.getElementById('app-viewport') || document.body,
      )}

      <PaperPrintFlow
        job={printJob}
        onClose={() => setPrintJob(null)}
        onModify={() => {
          setPrintJob(null);
          setIsUnitTestSetupOpen(true);
        }}
      />

      {shortageOverlay && createPortal(
        <div className="absolute inset-0 z-[620]">
          <PracticeShortageDialog
            open
            variant={shortageOverlay.variant}
            scopeLabel={shortageOverlay.source === 'section' ? '当前小节' : (activeSubject === '英语' ? '本单元' : '本章')}
            difficulty={shortageOverlay.difficulty}
            scenarioLabel={shortageOverlay.scenarioLabel}
            availableCount={shortageOverlay.availableCount}
            requestedCount={shortageOverlay.requestedCount}
            canLower={Boolean(shiftDifficulty(shortageOverlay.difficulty, -1))}
            canRaise={Boolean(shiftDifficulty(shortageOverlay.difficulty, 1))}
            showRetryDone={shortageOverlay.variant === 'no_new'}
            cancelLabel={
              isHardBlockShortageKind(shortageOverlay.kind)
                ? '知道了'
                : shortageOverlay.source === 'unit' && isUnitTestSetupOpen
                  ? '返回修改'
                  : '先不练了'
            }
            onLower={() => {
              if (isHardBlockShortageKind(shortageOverlay.kind)) return;
              const next = shiftDifficulty(shortageOverlay.difficulty, -1);
              if (!next) return;
              const availableCount = getDemoStock(shortageOverlay.kind, next);
              if (shortageOverlay.source === 'section') {
                if (availableCount <= 0) {
                  setShortageOverlay({ ...shortageOverlay, difficulty: next, variant: 'no_new', availableCount: 0 });
                  return;
                }
                if (availableCount < 5) {
                  setShortageOverlay({ ...shortageOverlay, difficulty: next, variant: 'below_count', availableCount });
                  return;
                }
                startSectionPractice(shortageOverlay.sectionKey ?? '', shortageOverlay.sectionTitle ?? '', {
                  questionCount: 5,
                  difficulty: next,
                });
                setShortageOverlay(null);
                return;
              }
              setUnitSetupDifficulty(next);
              if (availableCount <= 0) {
                setShortageOverlay({ ...shortageOverlay, difficulty: next, variant: 'no_new', availableCount: 0 });
                setIsUnitTestSetupOpen(true);
                return;
              }
              setShortageOverlay(null);
              setIsUnitTestSetupOpen(true);
            }}
            onRaise={() => {
              if (isHardBlockShortageKind(shortageOverlay.kind)) return;
              const next = shiftDifficulty(shortageOverlay.difficulty, 1);
              if (!next) return;
              const availableCount = getDemoStock(shortageOverlay.kind, next);
              if (shortageOverlay.source === 'section') {
                if (availableCount <= 0) {
                  setShortageOverlay({ ...shortageOverlay, difficulty: next, variant: 'no_new', availableCount: 0 });
                  return;
                }
                if (availableCount < 5) {
                  setShortageOverlay({ ...shortageOverlay, difficulty: next, variant: 'below_count', availableCount });
                  return;
                }
                startSectionPractice(shortageOverlay.sectionKey ?? '', shortageOverlay.sectionTitle ?? '', {
                  questionCount: 5,
                  difficulty: next,
                });
                setShortageOverlay(null);
                return;
              }
              setUnitSetupDifficulty(next);
              if (availableCount <= 0) {
                setShortageOverlay({ ...shortageOverlay, difficulty: next, variant: 'no_new', availableCount: 0 });
                setIsUnitTestSetupOpen(true);
                return;
              }
              setShortageOverlay(null);
              setIsUnitTestSetupOpen(true);
            }}
            onUseAvailable={shortageOverlay.variant === 'below_count' ? () => {
              if (shortageOverlay.source === 'section') {
                startSectionPractice(shortageOverlay.sectionKey ?? '', shortageOverlay.sectionTitle ?? '', {
                  questionCount: Math.max(1, shortageOverlay.availableCount),
                  difficulty: shortageOverlay.difficulty,
                });
                setShortageOverlay(null);
                return;
              }
              startUnitTest({
                questionCount: Math.max(1, shortageOverlay.availableCount),
                difficulty: shortageOverlay.difficulty,
                difficultyLevel: difficultyLevelOf(shortageOverlay.difficulty),
                scenario: shortageOverlay.scenario,
                scenarioLabel: shortageOverlay.scenarioLabel,
              }, { ignoreStock: true });
            } : undefined}
            onRetryDone={() => {
              const questionCount = shortageOverlay.requestedCount || 5;
              if (shortageOverlay.source === 'section') {
                startSectionPractice(shortageOverlay.sectionKey ?? '', shortageOverlay.sectionTitle ?? '', {
                  questionCount,
                  difficulty: shortageOverlay.difficulty,
                });
                setShortageOverlay(null);
                return;
              }
              startUnitTest({
                questionCount,
                difficulty: shortageOverlay.difficulty,
                difficultyLevel: difficultyLevelOf(shortageOverlay.difficulty),
                scenario: shortageOverlay.scenario,
                scenarioLabel: shortageOverlay.scenarioLabel,
              }, { ignoreStock: true });
            }}
            onCancel={() => {
              setShortageOverlay(null);
              if (
                isHardBlockShortageKind(shortageOverlay.kind)
                || shortageOverlay.source === 'section'
                || !isUnitTestSetupOpen
              ) {
                setIsUnitTestSetupOpen(false);
              }
            }}
          />
        </div>,
        document.getElementById('app-viewport') || document.body,
      )}

      <SyncSelfTestPage
        open={!embedded && isSelfPracticeOpen}
        subject={activeSubject}
        grade={userGrade}
        term={activeTerm}
        version={syncTextbookVersion}
        tree={selfPracticeTree}
        currentChapterHint={currentParentTitle || undefined}
        currentSectionHint={
          activeSubject === '英语'
            ? undefined
            : (currentChildTitle
              || (isCatalogSubject ? catalogUnit?.lessons[0]?.title : visibleChapterTopics[0]?.section)
              || undefined)
        }
        pageTitle="自主练习"
        startLabel="开始练习"
        onBack={() => setIsSelfPracticeOpen(false)}
        onStart={startSelfPractice}
      />

      <SyncSectionPage
        open={!!selectedSyncTopic || !!selectedCatalogLesson}
        unitTitle={(() => {
          if (selectedCatalogLesson) return selectedCatalogLesson.title;
          if (!selectedSyncTopic) return '';
          if (activeSubject === '数学' || activeSubject === '语文') {
            const index = currentChapterTopics.findIndex((lesson) => lesson.section === selectedSyncTopic);
            return formatSectionLabel(selectedSyncTopic, Math.max(index, 0));
          }
          return selectedSyncTopic;
        })()}
        topics={selectedCatalogLesson
          ? selectedCatalogLesson.sections.map((section) => ({
              section: section.title,
              videos: section.videos.map((video) => ({ tag: video.title, title: video.title })),
            }))
          : sectionPageTopics}
        layout={activeSubject === '语文' ? 'path' : 'grid'}
        preferVideoName={activeSubject !== '语文'}
        subject={activeSubject}
        catalogUnitTitle={catalogUnit?.title ?? currentSyncLesson?.unit}
        periodSwitcher={activeSubject === '道德与法治' && userGrade === '八年级' && activeTerm === '上册'}
        lastStudiedSection={
          selectedCatalogLesson && syncProgress.catalogLessonId === selectedCatalogLesson.id
            ? syncProgress.section
            : undefined
        }
        videoPending={currentUnitVideoPending}
        lessonNoun={
          activeSubject === '英语' ? '课时'
            : activeSubject === '语文' ? '课文'
              : '小节'
        }
        practiceMark={(() => {
          if (selectedCatalogLesson) {
            return { bookKey: syncBookKey, practiceKey: `section:${selectedCatalogLesson.id}` };
          }
          if (!selectedSyncTopic) return undefined;
          const lesson = currentChapterTopics.find((item) => item.section === selectedSyncTopic);
          return lesson
            ? { bookKey: syncBookKey, practiceKey: `section:${lesson.unit}-${lesson.section}` }
            : undefined;
        })()}
        onBack={() => {
          setSelectedSyncTopic(null);
          setSelectedCatalogLesson(null);
        }}
        onPlayVideo={(topic, video, index, playlist) => {
          const isPlaybackErrorClip = matchPlaybackErrorDemo(video.title) != null || matchPlaybackErrorDemo(video.tag) != null;
          if (!isPlaybackErrorClip) {
            markSyncVideoPlayed(syncBookKey, makeSyncVideoKey(topic.section, video.title, index));
            setProgressTick((tick) => tick + 1);
          }
          const items = playlist.map((item) => ({
            id: makeSectionVideoItemId(item.topic.section, item.video.title || item.video.tag, item.videoIndex),
            title: item.title,
            topicTitle: item.topicTitle,
            durationSec: 20,
          }));
          const currentIndex = Math.max(
            0,
            playlist.findIndex((item) =>
              item.topic.section === topic.section
              && item.videoIndex === index
              && (item.video.title === video.title || item.video.tag === video.tag),
            ),
          );
          const sectionPractice = (() => {
            if (activeSubject === '英语') return undefined;
            if (selectedCatalogLesson && isShortageDemoText(selectedCatalogLesson.title)) return undefined;
            if (selectedSyncTopic && isShortageDemoText(selectedSyncTopic)) return undefined;
            if (selectedCatalogLesson && isPlaybackErrorDemoText(selectedCatalogLesson.title)) return undefined;
            if (selectedSyncTopic && isPlaybackErrorDemoText(selectedSyncTopic)) return undefined;
            if (isPlaybackErrorDemoChapter(currentSyncLesson?.unit) || isPlaybackErrorDemoChapter(catalogUnit?.title)) return undefined;
            const quiz = sectionPracticeQuizFields();
            if (selectedCatalogLesson) {
              const practiceKey = `section:${selectedCatalogLesson.id}`;
              return {
                id: `${activeSubject}-section-practice-${selectedCatalogLesson.id}-${Date.now()}`,
                title: `${selectedCatalogLesson.title} · 同步练习`,
                ...quiz,
                syncPracticeMark: { bookKey: syncBookKey, practiceKey },
              };
            }
            if (!selectedSyncTopic) return undefined;
            const lesson = currentChapterTopics.find((item) => item.section === selectedSyncTopic);
            if (!lesson) return undefined;
            const lessonIndex = currentChapterTopics.findIndex((item) => item.section === lesson.section);
            const practiceKey = `section:${lesson.unit}-${lesson.section}`;
            return {
              id: `${activeSubject}-section-practice-${lesson.unit}-${lesson.section}-${Date.now()}`,
              title: `${formatSectionLabel(lesson.section, Math.max(lessonIndex, 0))} · 同步练习`,
              ...quiz,
              syncPracticeMark: { bookKey: syncBookKey, practiceKey },
            };
          })();
          if (selectedCatalogLesson) {
            const section = selectedCatalogLesson.sections.find((item) => item.title === topic.section)
              ?? selectedCatalogLesson.sections[0];
            const matched = section?.videos[index];
            saveLastSyncLesson(syncBookKey, catalogUnit?.title ?? selectedCatalogLesson.title, topic.section, selectedCatalogLesson.id);
            onStartLevel?.({
              id: `${activeSubject}-sync-${selectedCatalogLesson.id}-${section?.id ?? topic.section}-${matched?.id ?? index}`,
              title: video.title,
              subject: activeSubject,
              durationMinutes: 8,
              levelType: 'practice',
              aiReasoning: KG_SCOPE_MICRO_LESSON,
              sectionVideoPlaylist: { items, currentIndex },
              sectionPractice,
            });
            return;
          }
          onStartLevel?.({
            id: `${activeSubject}-sync-basic-${currentSyncLesson?.unit}-${topic.section}-${index}`,
            title: video.title,
            subject: activeSubject,
            durationMinutes: 8,
            levelType: 'practice',
            aiReasoning: KG_SCOPE_MICRO_LESSON,
            sectionVideoPlaylist: {
              items,
              currentIndex,
              scopeLabel: activeSubject === '英语'
                ? `${currentSyncLesson?.unit ?? ''} · ${topic.section}`
                : undefined,
            },
            sectionPractice,
          });
        }}
        onStartPractice={activeSubject === '英语'
          || isPlaybackErrorDemoChapter(currentSyncLesson?.unit)
          || isPlaybackErrorDemoChapter(catalogUnit?.title)
          || isPlaybackErrorDemoText(selectedSyncTopic)
          || isPlaybackErrorDemoText(selectedCatalogLesson?.title)
          ? undefined
          : selectedCatalogLesson
          ? () => startSectionPractice(selectedCatalogLesson.id, selectedCatalogLesson.title)
          : selectedSyncTopic
            ? () => {
                const lesson = currentChapterTopics.find((item) => item.section === selectedSyncTopic);
                if (!lesson) return;
                const index = currentChapterTopics.findIndex((item) => item.section === lesson.section);
                startSectionPractice(
                  `${lesson.unit}-${lesson.section}`,
                  formatSectionLabel(lesson.section, Math.max(index, 0)),
                );
              }
            : undefined}
      />

      <SyncVocabPage
        open={isVocabPageOpen}
        units={englishVocabUnits}
        onBack={() => setIsVocabPageOpen(false)}
        onPlayWord={(unit, section, word) => {
          const playWords = section.words.length > 0 ? section.words : [section.title];
          const startWord = playWords.includes(word) ? word : playWords[0];
          const items = playWords.map((item) => ({
            id: `英语-sync-vocab-${unit.id}-${section.id}-${item}`,
            title: `${item} · 单词讲解`,
            durationSec: 20,
          }));
          const currentIndex = Math.max(0, playWords.indexOf(startWord));
          onStartLevel?.({
            id: items[currentIndex].id,
            title: items[currentIndex].title,
            subject: activeSubject,
            durationMinutes: 5,
            levelType: 'practice',
            aiReasoning: KG_SCOPE_MICRO_LESSON,
            sectionVideoPlaylist: {
              items,
              currentIndex,
              scopeLabel: `${unit.title} · ${section.title}`,
            },
          });
        }}
      />

      <SyncGrammarPage
        open={isGrammarPageOpen}
        units={englishGrammarUnits}
        onBack={() => setIsGrammarPageOpen(false)}
        onPlayTopic={(unit, section, topic) => {
          const items = section.topics.map((item) => ({
            id: `英语-sync-grammar-${unit.id}-${section.id}-${item.id}`,
            title: `${unit.title} · ${item.title}`,
            durationSec: 20,
          }));
          const currentIndex = Math.max(0, section.topics.findIndex((item) => item.id === topic.id));
          onStartLevel?.({
            id: items[currentIndex]?.id ?? `英语-sync-grammar-${unit.id}-${section.id}-${topic.id}`,
            title: items[currentIndex]?.title ?? `${unit.title} · ${topic.title}`,
            subject: activeSubject,
            durationMinutes: 8,
            levelType: 'practice',
            aiReasoning: KG_SCOPE_MICRO_LESSON,
            sectionVideoPlaylist: {
              items,
              currentIndex,
              scopeLabel: `${unit.title} · ${section.title}`,
            },
          });
        }}
      />

      <SyncSpeakingPage
        open={isSpeakingPageOpen}
        units={englishSpeakingUnits}
        onBack={() => setIsSpeakingPageOpen(false)}
        onPlayLesson={(unit, lesson) => {
          const items = unit.lessons.map((item) => ({
            id: `英语-sync-speaking-${unit.id}-${item.id}`,
            title: `${unit.title} · ${item.title}`,
            durationSec: 20,
          }));
          const currentIndex = Math.max(0, unit.lessons.findIndex((item) => item.id === lesson.id));
          onStartLevel?.({
            id: items[currentIndex]?.id ?? `英语-sync-speaking-${unit.id}-${lesson.id}`,
            title: items[currentIndex]?.title ?? `${unit.title} · ${lesson.title}`,
            subject: activeSubject,
            durationMinutes: 8,
            levelType: 'practice',
            aiReasoning: KG_SCOPE_MICRO_LESSON,
            sectionVideoPlaylist: {
              items,
              currentIndex,
              scopeLabel: unit.title,
            },
          });
        }}
      />

      <SyncImprovePage
        open={isImprovePageOpen}
        chapters={JUNIOR_MATH_IMPROVE_G7A}
        bookName={`${syncTextbookVersion} · ${userGrade}${activeTerm}`}
        onBack={() => setIsImprovePageOpen(false)}
        onPlayVideo={(video, path) => onStartLevel?.({
          id: `数学-sync-improve-${path}`,
          title: video.title,
          subject: activeSubject,
          durationMinutes: 8,
          levelType: 'practice',
          aiReasoning: KG_SCOPE_MICRO_LESSON,
        })}
      />

      {/* Node Detail Bottom Sheet - Using Portal */}
      <NodeDetailModal 
        node={selectedNode} 
        onClose={() => setSelectedNode(null)} 
        onStart={handleStart} 
      />

      <LumiConfigChat
        isOpen={isConfigChatOpen}
        onClose={() => setIsConfigChatOpen(false)}
        mode={learningStrategy}
        onConfigComplete={handleConfigComplete}
      />
    </div>
  );
};

// Helper functions for enhanced node display
const getChapterNodeTypeLabel = (type?: string) => {
  const typeMap = {
    'intuition': '直觉站',
    'clinic': '诊所站',
    'practice': '练习站', 
    'gatekeeper': '守门员',
    'application': '应用站'
  } as Record<string, string>;
  return type ? typeMap[type] || '关卡' : '';
};

const getLinearIcon = (type?: string, size: number = 24) => {
  const iconMap: Record<string, React.ReactNode> = {
    'intuition': <Lightbulb size={size} />,
    'clinic': <Stethoscope size={size} />,
    'practice': <Target size={size} />,
    'gatekeeper': <Shield size={size} />,
    'application': <Puzzle size={size} />
  };
  return type ? iconMap[type] || <Circle size={size} /> : null;
};

// === REFACTORED 2.5D GEM & GLASS NODE COMPONENT (BRIGHT TECH) ===
const GameNodeComponent: React.FC<{ node: MapNode, onClick: () => void, variant?: 'standard' | 'planet' }> = ({ node, onClick, variant = 'standard' }) => {
   const isCompleted = node.status === 'completed';
   const isCurrent = node.status === 'current';
   const isLocked = node.status === 'locked';
   const isPractice = node.nodeType === 'practice';
   const isPlanet = variant === 'planet';

   // --- PLANET VARIANT (GALAXY MODE) ---
   if (isPlanet) {
       const isSun = node.nodeType === 'boss' || node.id === 'pboss'; 
       
       return (
           <div className="flex flex-col items-center group cursor-pointer relative" onClick={onClick}>
               {!isLocked && !isSun && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap z-20">
                         <div className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase border backdrop-blur-md shadow-lg transition-all ${
                             isCurrent 
                                ? 'bg-white text-indigo-600 border-white shadow-[0_0_15px_rgba(99,102,241,0.5)] scale-110' 
                                : 'bg-slate-800/80 text-slate-300 border-white/20'
                         }`}>
                            {node.abilityType || node.title}
                         </div>
                    </div>
               )}

               <div className={`relative transition-all duration-700 flex items-center justify-center rounded-full
                  ${isSun 
                      ? 'w-32 h-32 animate-[spin_60s_linear_infinite]' 
                      : isCurrent 
                          ? 'w-20 h-20 scale-110' 
                          : 'w-16 h-16 opacity-80 hover:opacity-100 hover:scale-110' 
                  }
               `}>
                  {isSun && (
                      <>
                        <div className="absolute inset-[-20%] rounded-full border border-indigo-500/20 animate-[spin_10s_linear_infinite_reverse]"></div>
                        <div className="absolute inset-[-40%] rounded-full border border-purple-500/10 animate-[spin_15s_linear_infinite]"></div>
                      </>
                  )}

                  <div className={`absolute inset-0 rounded-full blur-[20px] transition-all duration-1000 ${
                      isSun ? 'bg-orange-500/30' :
                      isCurrent ? 'bg-cyan-400/40' :
                      isLocked ? 'bg-transparent' :
                      'bg-indigo-500/20'
                  }`}></div>

                  <div className={`
                      relative w-full h-full rounded-full flex items-center justify-center overflow-hidden border shadow-inner
                      ${isSun 
                          ? 'bg-gradient-to-br from-amber-500 via-orange-600 to-rose-600 border-orange-400/50 shadow-[0_0_50px_rgba(249,115,22,0.4)]'
                          : isLocked
                              ? 'bg-slate-800/50 backdrop-blur-md border-white/10'
                              : isCurrent
                                  ? 'bg-gradient-to-br from-cyan-400 to-blue-600 border-cyan-300/50 shadow-[0_0_30px_rgba(34,211,238,0.4)]'
                                  : isCompleted
                                      ? 'bg-gradient-to-br from-indigo-500 to-purple-700 border-indigo-400/30 shadow-[0_0_20px_rgba(99,102,241,0.2)]'
                                      : 'bg-slate-700 border-slate-600'
                      }
                  `}>
                      {!isLocked && (
                          <div className="absolute inset-0 opacity-30" style={{
                              backgroundImage: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8), transparent 20%)'
                          }}></div>
                      )}
                      
                      <div className={`relative z-10 ${isSun ? 'animate-[spin_60s_linear_infinite_reverse]' : ''}`}> 
                          {isSun ? <Brain size={40} className="text-white drop-shadow-lg" /> :
                           isLocked ? <Lock size={20} className="text-slate-500" /> :
                           isCompleted ? <Check size={24} className="text-white/80" strokeWidth={3} /> :
                           <div className="text-white font-black text-xl">{node.level}</div>
                          }
                      </div>
                  </div>
               </div>
           </div>
       );
   }

   // --- CHEST NODE (Glass Container) ---
   if (node.nodeType === 'chest') {
       return (
           <div className="group cursor-pointer flex flex-col items-center" onClick={onClick}>
               <div className={`w-20 h-20 rounded-[32px] flex items-center justify-center relative transition-transform hover:scale-105 active:scale-95 duration-300 ${
                   isLocked 
                        ? 'bg-white/40 backdrop-blur-md border border-white/60' 
                   : isCompleted 
                        ? 'bg-amber-50/80 backdrop-blur-md border border-amber-200 shadow-sm' 
                   : 'bg-gradient-to-br from-amber-300 to-yellow-500 shadow-[0_12px_24px_rgba(245,158,11,0.3)] border border-white/40'
               }`}>
                   {!isLocked && !isCompleted && <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-white/40 to-transparent pointer-events-none"></div>}
                   
                   {isLocked ? <Lock size={22} className="text-slate-300" /> : 
                    isCompleted ? <Check size={28} className="text-amber-600" strokeWidth={3} /> : 
                    <Gift size={32} className="text-white drop-shadow-md animate-bounce" />
                   }
               </div>
               {!isLocked && !isCompleted && (
                   <div className="mt-2 bg-amber-500/90 backdrop-blur-md text-white text-[9px] font-black px-2.5 py-1 rounded-full shadow-md border border-white/20">BONUS</div>
               )}
           </div>
       )
   }

   // --- BOSS NODE (Large Glass Orb) ---
   if (node.nodeType === 'boss') {
       return (
           <div className="group cursor-pointer flex flex-col items-center" onClick={onClick}>
                <div className="relative">
                    {!isLocked && (
                        <div className="absolute inset-0 rounded-full bg-rose-500/20 animate-ping duration-[2000ms]"></div>
                    )}
                    <div className={`w-28 h-28 rounded-full flex items-center justify-center relative overflow-hidden transition-transform hover:scale-105 active:scale-95 duration-300 border-[6px] ${
                        isLocked 
                            ? 'bg-white/30 backdrop-blur-md border-white/40' 
                            : 'bg-gradient-to-br from-rose-500 to-red-600 border-white/30 shadow-[0_20px_50px_rgba(225,29,72,0.3)]'
                    }`}>
                        {!isLocked && (
                            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/30 to-transparent rounded-t-full pointer-events-none"></div>
                        )}
                        
                        {isLocked ? <Lock size={28} className="text-slate-300" /> : <Crown size={48} className="text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.2)]" />}
                        
                        {!isLocked && (
                            <div className="absolute bottom-4 bg-white/90 backdrop-blur text-rose-600 px-3 py-1 rounded-full flex items-center gap-1 shadow-sm text-[9px] font-black tracking-[0.2em] uppercase">
                                FINAL
                            </div>
                        )}
                    </div>
                </div>
           </div>
       )
   }

   // --- STANDARD / PRACTICE NODE ---
   return (
      <div className="flex flex-col items-center group cursor-pointer relative" onClick={onClick}>
         
         <div className={`relative transition-all duration-500 z-10 flex items-center justify-center
            ${isCurrent 
                ? 'w-24 h-24' 
                : 'w-16 h-16' 
            }
         `}>
            
            {/* LOCKED: Ceramic / Frosted Glass */}
            {isLocked && (
                <div className="w-16 h-16 rounded-[24px] bg-white/40 backdrop-blur-md border border-white/60 flex items-center justify-center shadow-sm hover:bg-white/60 transition-colors">
                    <Lock size={20} className="text-slate-300" />
                </div>
            )}

            {/* COMPLETED: Ceramic Gem */}
            {isCompleted && (
                <div className="w-16 h-16 rounded-[22px] bg-white shadow-[0_12px_24px_rgba(0,0,0,0.05)] border-2 border-emerald-100 flex flex-col items-center justify-center relative overflow-hidden group-hover:scale-110 transition-transform">
                    <div className="text-emerald-500">
                        {node.chapterNodeType ? getLinearIcon(node.chapterNodeType, 20) : (
                            <div className="font-black text-lg">{node.level}</div>
                        )}
                    </div>
                    <div className="absolute bottom-1 w-full flex justify-center gap-0.5">
                         {[1,2,3].map(i => <div key={i} className={`w-1 h-1 rounded-full ${i <= (node.stars||0) ? 'bg-amber-400' : 'bg-slate-100'}`} />)}
                    </div>
                </div>
            )}

            {/* CURRENT: 2.5D Holographic Gem */}
            {isCurrent && (
                <div className="relative w-full h-full">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-indigo-400/20 rounded-full blur-[40px] animate-pulse"></div>
                    
                    <div className={`
                        absolute inset-0 rounded-[32px] flex items-center justify-center shadow-[0_20px_40px_rgba(99,102,241,0.25)]
                        ${isPractice ? 'bg-gradient-to-br from-blue-400 to-indigo-600' : 'bg-gradient-to-br from-indigo-500 to-violet-700'}
                        animate-[float_4s_ease-in-out_infinite] border border-white/30
                    `}>
                        <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-white/40 via-transparent to-black/10 pointer-events-none"></div>
                        <div className="absolute inset-[2px] rounded-[30px] border border-white/20 pointer-events-none"></div>
                        
                        <div className="flex flex-col items-center z-10 text-white drop-shadow-md">
                            {node.chapterNodeType ? (
                                <div className="text-white">
                                    {getLinearIcon(node.chapterNodeType, 32)}
                                </div>
                            ) : isPractice ? (
                                <div className="p-2 bg-white/20 rounded-full mb-1 backdrop-blur-sm">
                                    {node.quizType === 'listening' ? <Headphones size={24} /> : <PenTool size={24} />}
                                </div>
                            ) : (
                                <Play size={32} fill="white" className="ml-1" />
                            )}
                        </div>
                    </div>
                    
                </div>
            )}
         </div>

         {!isLocked && (
             <div className="mt-5 flex flex-col items-center gap-1.5 max-w-28">
                 <div className={`px-4 py-2 rounded-2xl text-[10px] font-black text-center backdrop-blur-md border transition-all shadow-sm ${
                     isCurrent 
                        ? 'bg-white text-indigo-600 border-indigo-100 shadow-indigo-100 scale-105 translate-y-2' 
                        : 'bg-white/60 text-slate-500 border-white/60 hover:bg-white hover:text-slate-800'
                 }`}>
                    {node.taskTitle || node.title}
                 </div>
                 
                 {node.chapterNodeType && (
                     <div className="px-2.5 py-1 rounded-full bg-slate-100/50 border border-slate-200">
                         <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                             {getChapterNodeTypeLabel(node.chapterNodeType)}
                         </span>
                     </div>
                 )}
             </div>
         )}
      </div>
   );
};

export default SubjectMap;
