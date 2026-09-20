
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion as motionOriginal, AnimatePresence } from 'framer-motion';
import { MistakeVaultData, MistakeItem } from '../../types';
import { getMistakeVaultData } from '../../services/geminiService';
import { allQuestions } from '../../data/questionBank';
import { Card } from '../UI/Card';
import { AlertCircle, CheckCircle2, ChevronRight, Filter, Zap, ArrowRight, Bookmark, Star, Flag, Trophy, X, Circle, Crown, Sparkles, Bot, RotateCcw, XCircle, ChevronDown, ChevronUp, Play, Pause, PackageOpen, Inbox, BookOpen, Calculator, Languages, Atom, FlaskConical, Scale, Landmark, Leaf, Globe, Microscope, type LucideIcon } from 'lucide-react';
import { getMistakeVaultSubjects } from '../../data/subjectCatalog';
import { DailyConquerModal, DAILY_CONQUER_MAX } from './DailyConquerModal';
import { QuestionPreviewModal } from '../Quiz/QuestionPreviewModal';
import { UniversalQuizQuestion, UniversalQuizView, normalizeQuizSubmitPayload } from '../Quiz/UniversalQuizView';
import { UniversalQuizResult, QuizSessionResult, QuizResultItem, enrichQuizResultWithPracticeStates } from '../Quiz/UniversalQuizResult';
import { SingleQuestionResultCard } from '../Quiz/SingleQuestionResultCard';
import { PaperSelfGrade } from '../Quiz/components/PaperSourceAnalysisPanel';
import { resolveQuestionCorrectness } from '../../utils/manualGrade';
import { getPortalRoot } from '../../utils/portal';
import { RewardGrantResult } from '../../types/reward';
import { UserStats } from '../../types';

const motion = motionOriginal as any;

type SubjectVisual = {
  short: string;
  Icon: LucideIcon;
  text: string;
  iconBg: string;
  soft: string;
  border: string;
};

const SUBJECT_VISUALS: Record<string, SubjectVisual> = {
  语文: { short: '语文', Icon: BookOpen, text: 'text-rose-600', iconBg: 'bg-rose-500', soft: 'bg-rose-50', border: 'border-rose-100' },
  数学: { short: '数学', Icon: Calculator, text: 'text-indigo-600', iconBg: 'bg-indigo-500', soft: 'bg-indigo-50', border: 'border-indigo-100' },
  英语: { short: '英语', Icon: Languages, text: 'text-sky-600', iconBg: 'bg-sky-500', soft: 'bg-sky-50', border: 'border-sky-100' },
  物理: { short: '物理', Icon: Atom, text: 'text-blue-600', iconBg: 'bg-blue-500', soft: 'bg-blue-50', border: 'border-blue-100' },
  化学: { short: '化学', Icon: FlaskConical, text: 'text-teal-600', iconBg: 'bg-teal-500', soft: 'bg-teal-50', border: 'border-teal-100' },
  道德与法治: { short: '道法', Icon: Scale, text: 'text-amber-600', iconBg: 'bg-amber-500', soft: 'bg-amber-50', border: 'border-amber-100' },
  历史: { short: '历史', Icon: Landmark, text: 'text-orange-600', iconBg: 'bg-orange-500', soft: 'bg-orange-50', border: 'border-orange-100' },
  生物: { short: '生物', Icon: Leaf, text: 'text-green-600', iconBg: 'bg-green-500', soft: 'bg-green-50', border: 'border-green-100' },
  地理: { short: '地理', Icon: Globe, text: 'text-lime-700', iconBg: 'bg-lime-500', soft: 'bg-lime-50', border: 'border-lime-100' },
  科学: { short: '科学', Icon: Microscope, text: 'text-cyan-600', iconBg: 'bg-cyan-500', soft: 'bg-cyan-50', border: 'border-cyan-100' },
};

const DEFAULT_SUBJECT_VISUAL: SubjectVisual = SUBJECT_VISUALS['数学'];

const getMistakeTimeValue = (item: MistakeItem) => {
  const raw = item.lastAttemptAt || item.stats?.lastWrongDate || item.lastReview || '';
  if (raw.includes('刚刚')) return Date.now();
  if (raw.includes('今天')) return Date.now() - 1000 * 60 * 30;
  if (raw.includes('昨天')) return Date.now() - 1000 * 60 * 60 * 24;
  const daysMatch = raw.match(/(\d+)\s*天前/);
  if (daysMatch) return Date.now() - Number(daysMatch[1]) * 1000 * 60 * 60 * 24;
  const parsed = Date.parse(raw);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const getSubjectVisual = (subject: string) => SUBJECT_VISUALS[subject] || DEFAULT_SUBJECT_VISUAL;

const getMemoryReviewMeta = (item: MistakeItem) => {
  if (item.status === 'mastered') {
    return {
      dot: 'bg-emerald-500',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      label: '已掌握',
      stage: '30天防遗忘抽查',
      nextReview: item.deadlineLabel || '30天后抽查',
    };
  }

  if (item.status === 'reviewing') {
    const stage = Math.min(3, Math.max(1, item.stats?.reviewCount || item.correctAttempts || 1));
    const nextReview = item.deadlineLabel || (stage === 1 ? '明天复习' : stage === 2 ? '3天后复习' : '7天后复习');
    return {
      dot: 'bg-yellow-400',
      badge: 'bg-yellow-50 text-yellow-700 border-yellow-100',
      label: '待复习',
      stage: `Stage ${stage}`,
      nextReview,
    };
  }

  return {
    dot: 'bg-red-500',
    badge: 'bg-red-50 text-red-600 border-red-100',
    label: '待攻克',
    stage: '答错重置',
    nextReview: item.deadlineLabel || '今日攻克',
  };
};

const isDueToday = (item: MistakeItem) => {
  if (item.status === 'mastered') return false;
  if (typeof item.dueInDays === 'number') return item.dueInDays <= 0;
  return true;
};

interface MistakeVaultProps {
  onOpenAITutor?: () => void;
  onDailyConquerOpenChange?: (open: boolean) => void;
  onDetailModeChange?: (open: boolean) => void;
  /** 首页消息入口要求直接展示全科待办错题列表。 */
  openPendingListSignal?: number;
  onPendingListOpened?: () => void;
  onRewardGranted?: (result: RewardGrantResult) => void;
  userStats?: UserStats;
  userGrade?: string;
  schoolSystem?: '六三制' | '五四制';
}

export const MistakeVault: React.FC<MistakeVaultProps> = ({
  onOpenAITutor,
  onDailyConquerOpenChange,
  onDetailModeChange,
  openPendingListSignal = 0,
  onPendingListOpened,
  onRewardGranted,
  userStats,
  userGrade = '七年级',
  schoolSystem = '六三制',
}) => {
  const [data, setData] = useState<MistakeVaultData | null>(null);
  const [previewQuestion, setPreviewQuestion] = useState<UniversalQuizQuestion | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  // Filtering State
  const [activeSubjectFilter, setActiveSubjectFilter] = useState<string | 'All'>('All');
  // Status Filter: 'all' shows every mistake in a subject; 'pending' excludes mastered
  const [activeStatusFilter, setActiveStatusFilter] = useState<'all' | 'pending' | 'new' | 'reviewing' | 'mastered'>('pending');
  const [activeReasonFilter, setActiveReasonFilter] = useState<'All' | string>('All');
  const [isReasonDropdownOpen, setIsReasonDropdownOpen] = useState(false);
  const [editingReasonId, setEditingReasonId] = useState<string | null>(null);
  const [starOnly, setStarOnly] = useState(false);
  const [showGlobalMistakeList, setShowGlobalMistakeList] = useState(false);
  const [showMemoryRule, setShowMemoryRule] = useState(false);
  
  // State for Confirmation Modal
  const [confirmAction, setConfirmAction] = useState<{ item: MistakeItem; type: 'master' | 'unmaster' } | null>(null);

  // State for Daily Challenge
  const [isDailyChallengeOpen, setIsDailyChallengeOpen] = useState(false);
  const [isBatchConquerOpen, setIsBatchConquerOpen] = useState(false);
  const [batchConquerItems, setBatchConquerItems] = useState<MistakeItem[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  // Sync daily conquer open state to parent (用于隐藏底部导航)
  useEffect(() => {
    onDailyConquerOpenChange?.(isDailyChallengeOpen || isBatchConquerOpen);
  }, [isDailyChallengeOpen, isBatchConquerOpen, onDailyConquerOpenChange]);

  // Drill (举一反三) quiz state
  const [drillQuestions, setDrillQuestions] = useState<UniversalQuizQuestion[] | null>(null);
  const [isDrillOpen, setIsDrillOpen] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  const [drillPhase, setDrillPhase] = useState<'quiz' | 'result'>('quiz');
  const [drillAnswers, setDrillAnswers] = useState<Record<string, any> | null>(null);
  const [drillPaperDrafts, setDrillPaperDrafts] = useState<Record<string, string | null>>({});
  const [drillPaperSelfGrades, setDrillPaperSelfGrades] = useState<Record<string, PaperSelfGrade>>({});
  const [drillResult, setDrillResult] = useState<QuizSessionResult | null>(null);

  useEffect(() => {
    getMistakeVaultData().then(setData);
  }, []);

  useEffect(() => {
    setPortalTarget(getPortalRoot());
  }, []);

  const isDetailMode = activeSubjectFilter !== 'All' || showGlobalMistakeList;
  useEffect(() => {
    onDetailModeChange?.(isDetailMode);
  }, [isDetailMode, onDetailModeChange]);

  const updateMistakeReason = (itemId: string, reason: MistakeItem['errorType']) => {
      if (!data) return;
      const newGroups = data.groups.map(g => ({
          ...g,
          items: g.items.map(i => i.id === itemId ? { ...i, errorType: reason } : i)
      }));
      setData({ ...data, groups: newGroups });
  };

  const handleStarToggle = (item: MistakeItem) => {
      if (!data) return;
      const newGroups = data.groups.map(g => ({
          ...g,
          items: g.items.map(i => i.id === item.id ? { 
              ...i, 
              stats: { ...i.stats, isStarred: !i.stats.isStarred } 
          } : i)
      }));
      setData({ ...data, groups: newGroups });
  };

  const handleFlagClick = (item: MistakeItem) => {
      setConfirmAction({
          item,
          type: item.status === 'mastered' ? 'unmaster' : 'master'
      });
  };

  const confirmFlagChange = () => {
      if (!data || !confirmAction) return;
      const { item, type } = confirmAction;
      
      const newStatus = type === 'master' ? 'mastered' : 'reviewing';
      
      const newGroups = data.groups.map(g => ({
          ...g,
          items: g.items.map(i => i.id === item.id ? { 
              ...i, 
              status: newStatus as any,
              stats: { ...i.stats, mastered: type === 'master' }
          } : i)
      }));

      // Update pending count logic
      let newPending = data.totalPending;
      if (type === 'master' && item.status !== 'mastered') newPending = Math.max(0, newPending - 1);
      if (type === 'unmaster' && item.status === 'mastered') newPending = newPending + 1;

      setData({ ...data, groups: newGroups, totalPending: newPending });
      setConfirmAction(null);
  };

  const handleDailyChallengeComplete = ({
    masteredIds,
  }: {
    masteredIds: string[];
    xpEarned: number;
    coinsEarned: number;
  }) => {
      if (!data) return;
      
      // Batch update status to mastered
      const newGroups = data.groups.map(g => ({
          ...g,
          items: g.items.map(i => masteredIds.includes(i.id) ? {
              ...i,
              status: 'mastered' as any,
              stats: { ...i.stats, mastered: true }
          } : i)
      }));

      const newPending = Math.max(0, data.totalPending - masteredIds.length);
      setData({ ...data, groups: newGroups, totalPending: newPending });
  };

  const openGlobalMistakeList = (status: 'pending' | 'new' | 'reviewing') => {
    setActiveSubjectFilter('All');
    setActiveStatusFilter(status);
    setActiveReasonFilter('All');
    setStarOnly(false);
    setShowGlobalMistakeList(true);
  };

  useEffect(() => {
    if (openPendingListSignal <= 0) return;
    openGlobalMistakeList('pending');
    onPendingListOpened?.();
  }, [openPendingListSignal, onPendingListOpened]);

  // --- Filtering Logic (Revised) ---
  const getFilteredGroups = () => {
      if (!data) return [];
      
      return data.groups.map(group => {
          const filteredItems = group.items.filter(item => {
              // 1. Subject Filter
              const matchSubject = activeSubjectFilter === 'All' || item.subject === activeSubjectFilter;
              
              // 2. Status Filter
              let matchStatus = true;
              if (activeStatusFilter === 'pending') {
                  // Show New + Reviewing (Hide Mastered)
                  matchStatus = item.status !== 'mastered';
              } else if (activeStatusFilter === 'all') {
                  matchStatus = true;
              } else if (activeStatusFilter === 'mastered') {
                  matchStatus = item.status === 'mastered';
              } else {
                  matchStatus = item.status === activeStatusFilter;
              }

              // 3. Reason Filter
              const matchReason = activeReasonFilter === 'All' || item.errorType === activeReasonFilter;

              // 4. Star Filter
              const matchStar = !starOnly || item.stats?.isStarred;

              return matchSubject && matchStatus && matchReason && matchStar;
          });
          return { ...group, items: filteredItems };
      }).filter(group => group.items.length > 0); 
  };

  const filteredGroups = getFilteredGroups();

  if (!data) return <div className="p-8 text-center text-gray-400">加载错题本...</div>;

  const REASONS: MistakeItem['errorType'][] = [
    '审题有误',
    '知识点忘了',
    '想不到思路',
    '计算出错',
    '公式用错/条件不符',
    '时间不够做完',
    '蒙的/不会',
    '概念模糊',
    '审题不清',
    '思路卡壳',
    '其它'
  ];

  const allMistakeItems = data.groups
    .flatMap(group => group.items)
    .sort((a, b) => getMistakeTimeValue(b) - getMistakeTimeValue(a));

  const stageSubjects = getMistakeVaultSubjects(userGrade, schoolSystem);
  const stageItems = allMistakeItems.filter(item => stageSubjects.includes(item.subject));
  const stagePending = stageItems.filter(item => item.status !== 'mastered').length;
  const stageZeroState = stagePending === 0;
  const stageNewUser = stageItems.length === 0;

  const memoryPlan = {
    weak: stageItems.filter(item => item.status === 'new').length,
    reviewing: stageItems.filter(item => item.status === 'reviewing').length,
    mastered: stageItems.filter(item => item.status === 'mastered').length,
    dueToday: stageItems.filter(isDueToday).length,
    tomorrowPush: stageItems.filter(item => item.status === 'new').length,
  };

  const dailyConquerCount = Math.min(memoryPlan.dueToday, DAILY_CONQUER_MAX);
  const subjectSummaries = stageSubjects.map((subject) => {
    const subjectItems = stageItems.filter(item => item.subject === subject);
    const pending = subjectItems.filter(item => item.status !== 'mastered').length;
    const weak = subjectItems.filter(item => item.status === 'new').length;
    const reviewing = subjectItems.filter(item => item.status === 'reviewing').length;
    const mastered = subjectItems.filter(item => item.status === 'mastered').length;
    const dueToday = subjectItems.filter(isDueToday).length;
    const recent = subjectItems[0];
    const topReasons = REASONS
      .map(reason => ({
        reason,
        count: subjectItems.filter(item => item.errorType === reason).length,
      }))
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 2);

    return {
      subject,
      items: subjectItems,
      total: subjectItems.length,
      pending,
      weak,
      reviewing,
      mastered,
      dueToday,
      recent,
      topReasons,
    };
  });

  const sortedSubjectSummaries = [...subjectSummaries].sort(
    (a, b) => b.pending - a.pending || stageSubjects.indexOf(a.subject) - stageSubjects.indexOf(b.subject),
  );

  const openSubjectDetail = (subject: string) => {
    setActiveSubjectFilter(subject);
    setActiveStatusFilter('all');
    setActiveReasonFilter('All');
    setStarOnly(false);
    setShowGlobalMistakeList(false);
    setIsEditMode(false);
    setShowAdvancedFilters(false);
  };

  const selectedSubjectItems = allMistakeItems.filter(item => {
    const matchSubject = activeSubjectFilter === 'All'
      ? showGlobalMistakeList && stageSubjects.includes(item.subject)
      : item.subject === activeSubjectFilter;

    let matchStatus = true;
    if (activeStatusFilter === 'all') {
      matchStatus = true;
    } else if (activeStatusFilter === 'pending') {
      matchStatus = item.status !== 'mastered';
    } else if (activeStatusFilter === 'mastered') {
      matchStatus = item.status === 'mastered';
    } else {
      matchStatus = item.status === activeStatusFilter;
    }

    const matchReason = activeReasonFilter === 'All' || item.errorType === activeReasonFilter;
    const matchStar = !starOnly || item.stats?.isStarred;

    return matchSubject && matchStatus && matchReason && matchStar;
  });

  const activeSubjectSummary = subjectSummaries.find(summary => summary.subject === activeSubjectFilter);
  const isEmptyDetailMode = isDetailMode && selectedSubjectItems.length === 0;

  const handleBackToOverview = () => {
    setActiveSubjectFilter('All');
    setActiveStatusFilter('pending');
    setActiveReasonFilter('All');
    setStarOnly(false);
    setShowGlobalMistakeList(false);
    setIsEditMode(false);
    setShowAdvancedFilters(false);
    setIsStatusDropdownOpen(false);
  };

  const getStatusFilterLabel = () => {
    if (activeStatusFilter === 'all') return '全部';
    if (activeStatusFilter === 'pending') return '待办';
    if (activeStatusFilter === 'new') return '未掌握';
    if (activeStatusFilter === 'reviewing') return '待复习';
    if (activeStatusFilter === 'mastered') return '已掌握';
    return '全部';
  };

  const getListTitle = () => {
    const statusSuffix =
      activeStatusFilter === 'pending'
        ? '待办'
        : activeStatusFilter === 'new'
          ? '未掌握'
          : activeStatusFilter === 'reviewing'
            ? '待复习'
            : activeStatusFilter === 'mastered'
              ? '已掌握'
              : null;

    if (activeSubjectFilter === 'All') {
      if (statusSuffix) return `${statusSuffix}错题`;
      return '全部错题';
    }

    if (statusSuffix) return `${activeSubjectFilter} · ${statusSuffix}`;
    return `${activeSubjectFilter}错题`;
  };

  const batchPendingItems = selectedSubjectItems.filter(item => item.status !== 'mastered');

  const isSubjectMistakeListView =
    isDetailMode &&
    !isEmptyDetailMode &&
    activeSubjectFilter !== 'All';

  const showBatchCorrectionButton =
    isSubjectMistakeListView &&
    batchPendingItems.length > 0 &&
    !isBatchConquerOpen &&
    !isDailyChallengeOpen &&
    !isDrillOpen &&
    !isPreviewOpen &&
    !confirmAction;

  const startMistakeQuiz = (items: MistakeItem[]) => {
    if (items.length === 0) return;
    setBatchConquerItems(items);
    setIsBatchConquerOpen(true);
  };

  const startBatchCorrection = () => {
    startMistakeQuiz(batchPendingItems);
  };

  const getSubjectEmptyGuide = (subject: string) => {
    const visual = getSubjectVisual(subject);
    return {
      hint: '练习中需要复盘的错题会出现在这里',
      action: '完成练习后自动收录',
      tone: `${visual.soft} ${visual.border} ${visual.text} ${visual.iconBg}`,
    };
  };

  const getDetailEmptyCopy = () => {
    if (activeSubjectFilter !== 'All') {
      const guide = getSubjectEmptyGuide(activeSubjectFilter);
      return {
        title: `${activeSubjectFilter}还没有错题`,
        desc: guide.hint,
        primary: guide.action,
      };
    }
    if (starOnly) {
      return {
        title: '还没有收藏错题',
        desc: '遇到特别想复盘的题，可以点星标收藏，之后会集中出现在这里。',
        primary: '先看看全部错题',
      };
    }
    return {
      title: activeStatusFilter === 'new' ? '没有未掌握错题' : activeStatusFilter === 'reviewing' ? '没有待复习题目' : activeStatusFilter === 'mastered' ? '暂无已掌握错题' : '当前没有符合条件的错题',
      desc: '换个筛选条件，或者继续完成练习，系统会自动把需要复盘的题收进来。',
      primary: '重置筛选',
    };
  };

  const mapMistakeToQuestion = (item: MistakeItem): UniversalQuizQuestion => {
    // 从错题 ID 中提取原始题目 ID（去掉 'mist-' 前缀）
    const originalId = item.id.startsWith('mist-') ? item.id.replace('mist-', '') : item.id;
    const originalQuestion = allQuestions.find(q => q.id === originalId);

    const cognitiveState = item.status === 'mastered' ? 'MASTERED' : item.status === 'reviewing' ? 'FADED' : 'GAP';
    return {
      id: item.id,
      type: (item.questionType as any) || 'fill_in_blank',
      content: {
        stem: originalQuestion?.content?.originalImageUrl
          ? (originalQuestion.content.stem || '')
          : (item.fullQuestion || item.questionSnippet),
        // 从原始题目中提取选项和音频
        options: originalQuestion?.content?.options || (item.questionType === 'single_choice' || item.questionType === 'multiple_choice' ? [] : undefined),
        audioUrl: originalQuestion?.content?.audioUrl,
        transcript: originalQuestion?.content?.transcript,
        examRules: originalQuestion?.content?.examRules,
            subQuestions: originalQuestion?.content?.subQuestions,
            stemImages: originalQuestion?.content?.stemImages,
            originalImageUrl: originalQuestion?.content?.originalImageUrl,
            htmlStem: originalQuestion?.content?.htmlStem,
            htmlExplanation: originalQuestion?.content?.htmlExplanation,
            manualGradeReferenceImageUrl: originalQuestion?.content?.manualGradeReferenceImageUrl,
            manualGradeBlankIndex: originalQuestion?.content?.manualGradeBlankIndex,
      },
      result: {
        correctAnswer: item.correctAnswer || '',
        explanation: item.analysis || '',
      },
      tags: item.tags,
      difficulty: typeof item.difficulty === 'number' ? item.difficulty : undefined,
      category: item.category,
      knowledgePoints: item.knowledgePoints || (item.topic ? [item.topic] : []),
      cognitiveState,
      bookmarked: item.stats?.isStarred,
      similarIds: item.similarIds,
      userAnswer: item.userWrongAnswer,
      subject: item.subject,
    };
  };

  // 构造举一反三题单：优先用 similarIds 萃取同类题，至少包含当前题
  const buildDrillQuestions = (q: UniversalQuizQuestion | null): UniversalQuizQuestion[] => {
    if (!q) return [];
    const allItems = data?.groups.flatMap(g => g.items) || [];
    const similarPool = (q.similarIds || []).map(id => allItems.find(it => it.id === id)).filter(Boolean) as MistakeItem[];
    const mappedSimilar = similarPool.map(mapMistakeToQuestion);
    const uniqById = (arr: UniversalQuizQuestion[]) => {
      const seen = new Set<string>();
      return arr.filter(item => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });
    };
    const combined = uniqById([q, ...mappedSimilar]);
    // 至少 1 道
    return combined.length > 0 ? combined : [q];
  };

  // 构造结果（复用每日攻克的字段）
  const buildDrillResult = (
    questions: UniversalQuizQuestion[],
    userAnswers: Record<string, any>,
    paperSelfGrades: Record<string, PaperSelfGrade> = {},
  ): QuizSessionResult => {
    const totalCount = questions.length;
    let correctCount = 0;
    const resultQuestions: QuizResultItem[] = questions.map((q, idx) => {
      const correct = resolveQuestionCorrectness(
        q.content?.manualGradeBlankIndex,
        q.result?.correctAnswer,
        userAnswers[q.id],
        paperSelfGrades[q.id],
      );
      if (correct) correctCount += 1;
      return {
        questionId: q.id,
        index: idx + 1,
        isCorrect: !!correct,
        timeSpentSec: 0,
        difficulty: q.difficulty || 1,
        stemSummary: (q.content.stem || '').slice(0, 50),
        correctAnswer: Array.isArray(q.result?.correctAnswer) ? (q.result?.correctAnswer as any[]).join('、') : (q.result?.correctAnswer as any) ?? '',
        userAnswer: Array.isArray(userAnswers[q.id]) ? (userAnswers[q.id] as any[]).join('、') : (userAnswers[q.id] ?? ''),
        subject: (q as any).subject ?? 'math',
        knowledgePoint: q.knowledgePoints?.[0] || '',
        questionType: q.type,
        options: q.content.options,
        explanation: q.result?.explanation,
        knowledgePoints: q.knowledgePoints,
        rawCorrectAnswer: q.result?.correctAnswer,
        rawUserAnswer: userAnswers[q.id],
      };
    });
    const score = Math.round((correctCount / totalCount) * 100);
    return {
      sessionId: `drill-${Date.now()}`,
      timestamp: Date.now(),
      totalTimeSec: 0,
      score,
      correctCount,
      totalCount,
      rewards: { baseXp: 50 + correctCount * 10, bonusXp: 0, coins: 0 },
      skillChanges: [],
      aiComment: '举一反三完成，建议对错题再练 1-2 道变式。',
      questions: enrichQuizResultWithPracticeStates(resultQuestions),
    };
  };

  return (
    <div className={`flex-1 min-h-0 no-scrollbar bg-gray-50/50 relative ${
      isDetailMode ? 'overflow-hidden flex flex-col' : 'overflow-y-hidden'
    }`}>
      <div className={`w-full px-4 md:px-6 lg:px-8 max-w-4xl mx-auto flex flex-col ${isDetailMode ? 'flex-1 min-h-0 overflow-y-auto scroll-smooth gap-2 pt-3 pb-4 justify-start' : 'h-full min-h-0 pt-6 pb-20 justify-start overflow-hidden'}`}>
        
        {/* 3.1 Stats Header - REIMPLEMENTED: DASHBOARD GAUGE + CAMERA ACTION */}
        {!isDetailMode && (
        <div className="flex flex-1 min-h-0 flex-col gap-2.5 overflow-hidden">
            <Card 
                className={`w-full shrink-0 border flex flex-col relative overflow-hidden
                    ${stageNewUser 
                        ? 'bg-gradient-to-br from-white via-indigo-50 to-orange-50 border-indigo-100'
                        : stageZeroState 
                            ? 'bg-gradient-to-br from-green-400 to-emerald-600 border-emerald-400' 
                            : 'bg-white border-gray-100 shadow-sm'
                    }
                `}
                noPadding
            >
                <div className="flex w-full relative z-10">
                    <div className="flex-1 px-4 py-3 flex flex-col gap-2.5">
                        {stageNewUser ? (
                            <div className="flex w-full items-start justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-[15px] font-semibold text-gray-900">错题本还很干净</h3>
                                    <p className="mt-1 text-[13px] font-medium text-gray-500 leading-relaxed">
                                        练习里做错的题会自动收录，方便按学科复习。
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => setShowMemoryRule(true)}
                                        className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-indigo-600"
                                    >
                                        了解复习规则
                                        <ArrowRight size={12} />
                                    </button>
                                </div>
                                <div className="w-12 h-12 rounded-2xl bg-white/80 border border-indigo-100 flex items-center justify-center shrink-0">
                                    <PackageOpen size={24} className="text-indigo-300" strokeWidth={1.7} />
                                </div>
                            </div>
                        ) : stageZeroState ? (
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <h3 className="text-[15px] font-semibold text-white">今日任务已完成</h3>
                                    <p className="mt-0.5 text-[13px] text-green-100">待办错题已全部消灭，继续保持。</p>
                                </div>
                                <Crown size={28} className="text-white fill-white/20 shrink-0" />
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between gap-4">
                                    <div className="min-w-0">
                                        <h3 className="text-[15px] font-semibold text-gray-900">今日复习</h3>
                                        <p className="mt-0.5 text-[13px] text-gray-500">
                                            还有 <span className="font-bold text-gray-800">{stagePending}</span> 道题待过关
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsDailyChallengeOpen(true)}
                                        className="shrink-0 h-10 pl-4 pr-1.5 rounded-full bg-gray-900 text-white flex items-center gap-2.5 hover:bg-gray-800 active:scale-[0.98] transition"
                                    >
                                        <span className="text-[13px] font-semibold tracking-wide">开始复习</span>
                                        <span className="h-7 min-w-7 px-2.5 rounded-full bg-white text-gray-900 text-xs font-black tabular-nums flex items-center justify-center">
                                            {dailyConquerCount}
                                        </span>
                                    </button>
                                </div>

                                <div className="flex items-center justify-between gap-2 text-xs font-bold">
                                    <div className="flex items-center gap-2 min-w-0 flex-wrap">
                                        <button
                                            type="button"
                                            onClick={() => openGlobalMistakeList('new')}
                                            className="text-red-500 hover:text-red-600 transition"
                                        >
                                            待攻克 {memoryPlan.weak}
                                        </button>
                                        <span className="text-gray-200">·</span>
                                        <button
                                            type="button"
                                            onClick={() => openGlobalMistakeList('reviewing')}
                                            className="text-amber-600 hover:text-amber-700 transition"
                                        >
                                            待复习 {memoryPlan.reviewing}
                                        </button>
                                        <span className="text-gray-200">·</span>
                                        <button
                                            type="button"
                                            onClick={() => openGlobalMistakeList('pending')}
                                            className="text-gray-400 hover:text-gray-600 transition"
                                        >
                                            全部待办
                                        </button>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowMemoryRule(true)}
                                        className="shrink-0 text-indigo-600 hover:text-indigo-700"
                                    >
                                        规则
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                </div>
            </Card>

            <div className="flex min-h-0 w-full flex-1 flex-col">
                <div className="flex items-center justify-between px-0.5 mb-1.5 shrink-0">
                    <h4 className="text-[13px] font-semibold text-gray-800">按学科查看</h4>
                    <span className="text-[11px] font-bold text-gray-400">{stageSubjects.length} 科</span>
                </div>
                <div className="grid min-h-0 flex-1 grid-cols-5 grid-rows-2 gap-1.5">
                    {sortedSubjectSummaries.map((summary) => {
                    const visual = getSubjectVisual(summary.subject);
                    const SubjectIcon = visual.Icon;
                    const pending = summary.pending;
                    return (
                            <button
                                key={summary.subject}
                                type="button"
                                onClick={() => openSubjectDetail(summary.subject)}
                                className={`flex h-full min-h-0 flex-col items-center justify-center gap-1.5 rounded-2xl border bg-white px-2 py-2 text-center transition hover:shadow-md active:scale-[0.98]
                                    ${pending > 0 ? `${visual.border} hover:border-brand/40` : 'border-gray-100 hover:border-brand/30'}`}
                            >
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${visual.soft} ${visual.text}`}>
                                    <SubjectIcon size={15} strokeWidth={2.2} />
                                </div>
                                <span className="text-[12px] font-semibold text-gray-800 leading-none">{visual.short}</span>
                                <span className={`text-[11px] font-bold tabular-nums leading-none ${pending > 0 ? 'text-gray-700' : 'text-gray-400'}`}>
                                    {stageNewUser ? '0' : pending}
                                </span>
                            </button>
                    );
                })}
                </div>
            </div>
        </div>
        )}

        {/* 3.3 Subject Mistake List */}
        {isDetailMode && (
        <div className="relative">
            <div className="sticky top-0 z-20 -mx-1 px-1 pt-1 pb-3 mb-2 bg-gradient-to-b from-[#eef2ff] via-[#f5f7ff] to-transparent">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    type="button"
                    onClick={handleBackToOverview}
                    className="w-9 h-9 shrink-0 bg-white border border-gray-200 text-gray-700 rounded-full shadow-sm hover:border-brand/30 hover:text-brand flex items-center justify-center transition"
                    aria-label="返回"
                  >
                    <ChevronRight size={13} className="rotate-180" />
                  </button>
                  <div className="min-w-0 flex items-baseline gap-2">
                    <h2 className="text-[15px] font-semibold text-gray-900 truncate">
                      {getListTitle()}
                    </h2>
                    <span className="text-[11px] font-medium text-gray-400 shrink-0">共{selectedSubjectItems.length}道</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsStatusDropdownOpen(v => !v)}
                      className="h-9 px-3 rounded-xl bg-white border border-gray-200 text-[11px] font-semibold text-gray-700 shadow-sm flex items-center gap-1"
                    >
                      {getStatusFilterLabel()}
                      <ChevronDown size={12} className={`transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isStatusDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-32 bg-white rounded-2xl border border-gray-100 shadow-2xl z-30 overflow-hidden">
                        {([
                          ['all', '全部'],
                          ['pending', '待办'],
                          ['new', '未掌握'],
                          ['reviewing', '待复习'],
                          ['mastered', '已掌握'],
                        ] as const).map(([value, label]) => (
                          <button
                            key={value}
                            type="button"
                            className={`w-full text-left px-4 py-2.5 text-[11px] font-semibold hover:bg-gray-50 ${activeStatusFilter === value ? 'text-indigo-600 bg-indigo-50' : 'text-gray-600'}`}
                            onClick={() => {
                              setActiveStatusFilter(value);
                              setIsStatusDropdownOpen(false);
                            }}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAdvancedFilters(v => !v)}
                    className={`h-9 px-3 rounded-xl border text-[11px] font-semibold flex items-center gap-1 transition-all ${showAdvancedFilters ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-gray-200 text-gray-700'}`}
                  >
                    <Filter size={13} />
                    筛选
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditMode(v => !v)}
                    className={`h-9 px-3 rounded-xl border text-[11px] font-semibold transition-all ${isEditMode ? 'bg-gray-900 border-gray-900 text-white' : 'bg-white border-gray-200 text-gray-700'}`}
                  >
                    编辑
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-5 text-[11px] font-medium text-gray-500 px-1 mt-3">
                <button type="button" onClick={() => setActiveStatusFilter('new')} className="flex items-center gap-1.5 hover:text-red-500 transition-colors">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 ring-4 ring-red-100" />
                  未掌握
                </button>
                <button type="button" onClick={() => setActiveStatusFilter('reviewing')} className="flex items-center gap-1.5 hover:text-amber-500 transition-colors">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 ring-4 ring-amber-100" />
                  待复习
                </button>
                <button type="button" onClick={() => setActiveStatusFilter('mastered')} className="flex items-center gap-1.5 hover:text-emerald-600 transition-colors">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
                  已掌握
                </button>
              </div>

              {showAdvancedFilters && (
                <div className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl bg-white/80 border border-white p-3 shadow-sm">
                  <button
                    onClick={() => setStarOnly((v) => !v)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${starOnly ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-gray-200 text-gray-600'}`}
                  >
                    <Star size={14} className={starOnly ? 'fill-amber-500 text-amber-500' : ''} />
                    已收藏
                  </button>
                  <div className="relative">
                    <button
                      onClick={() => setIsReasonDropdownOpen((v) => !v)}
                      className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-white border border-gray-200 text-gray-700 flex items-center gap-1 min-w-[120px]"
                    >
                      <span className="truncate max-w-[120px]">
                        {activeReasonFilter === 'All' ? '全部错因' : activeReasonFilter}
                      </span>
                      <ChevronDown size={12} className={`transition-transform ${isReasonDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isReasonDropdownOpen && (
                      <div className="absolute left-0 mt-2 w-56 bg-white rounded-2xl border border-gray-100 shadow-2xl z-30 overflow-hidden max-h-64 overflow-y-auto">
                        <button
                          className={`w-full text-left px-4 py-2 text-[11px] font-semibold hover:bg-gray-50 ${activeReasonFilter === 'All' ? 'text-gray-900' : 'text-gray-600'}`}
                          onClick={() => { setActiveReasonFilter('All'); setIsReasonDropdownOpen(false); }}
                        >
                          全部错因
                        </button>
                        {REASONS.map((r) => (
                          <button
                            key={r}
                            className={`w-full text-left px-4 py-2 text-[11px] font-semibold hover:bg-gray-50 ${activeReasonFilter === r ? 'text-indigo-600' : 'text-gray-600'}`}
                            onClick={() => { setActiveReasonFilter(r); setIsReasonDropdownOpen(false); }}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Subject Timeline */}
            <div className="flex flex-col gap-3">
                {selectedSubjectItems.length === 0 ? (
                    <div className="py-6">
                        <div className="mx-auto max-w-md rounded-2xl bg-white border border-gray-100 shadow-sm p-5 text-center overflow-hidden relative">
                            <div className="relative">
                                <div className="w-12 h-12 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                    <Inbox size={22} className="text-gray-300" strokeWidth={1.6} />
                                </div>
                                {(() => {
                                    const copy = getDetailEmptyCopy();
                                    return (
                                      <>
                                        <h3 className="font-semibold text-[13px] text-gray-900">{copy.title}</h3>
                                        <p className="mt-1.5 text-[11px] text-gray-500 font-medium leading-relaxed">{copy.desc}</p>
                                      </>
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3 pb-2">
                        {selectedSubjectItems.map((item) => (
                            <SwipeableMistakeCard 
                                key={item.id} 
                                item={item}
                                variant="compact"
                                isEditMode={isEditMode}
                                onClick={() => startMistakeQuiz([item])} 
                                onStar={handleStarToggle}
                                onFlag={handleFlagClick}
                                onReasonChange={updateMistakeReason}
                                editingReasonId={editingReasonId}
                                setEditingReasonId={setEditingReasonId}
                            />
                        ))}
                    </div>
                )}
            </div>

        </div>
        )}
      </div>

      {showBatchCorrectionButton && (
        <div className="shrink-0 w-full">
          <div className="w-full px-4 md:px-6 lg:px-8 max-w-4xl mx-auto pb-4 pt-2">
            <button
              type="button"
              onClick={startBatchCorrection}
              className="w-full py-3 rounded-[22px] bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-semibold text-[13px] shadow-xl shadow-indigo-500/30 hover:scale-[1.01] active:scale-[0.98] transition-all"
            >
              批量订正
            </button>
          </div>
        </div>
      )}

      {/* Daily Challenge Modal */}
      {isDailyChallengeOpen && data && (
          <DailyConquerModal 
            items={stageItems}
            onClose={() => setIsDailyChallengeOpen(false)}
            onComplete={handleDailyChallengeComplete}
            onRewardGranted={onRewardGranted}
            userStats={userStats}
            mode="daily"
            onOpenAITutor={onOpenAITutor}
          />
      )}

      {isBatchConquerOpen && batchConquerItems.length > 0 && (
          <DailyConquerModal
            items={batchConquerItems}
            onClose={() => {
              setIsBatchConquerOpen(false);
              setBatchConquerItems([]);
            }}
            onComplete={handleDailyChallengeComplete}
            onRewardGranted={onRewardGranted}
            userStats={userStats}
            mode="batch"
            subjectLabel={activeSubjectFilter === 'All' ? undefined : activeSubjectFilter}
            onOpenAITutor={onOpenAITutor}
          />
      )}

      <AnimatePresence>
        {showMemoryRule && (
          <div className="absolute inset-0 z-[85] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-[2px]"
              onClick={() => setShowMemoryRule(false)}
            />
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 10 }}
              className="relative z-10 w-full max-w-sm rounded-[28px] bg-white p-5 shadow-2xl border border-white/70"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-[15px] font-semibold text-gray-900">错题复习规则</h3>
                  <p className="text-[11px] font-medium text-gray-400 mt-1">基于艾宾浩斯间隔复习自动安排</p>
                </div>
                <button
                  onClick={() => setShowMemoryRule(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="space-y-2">
                {[
                  ['🔴 待攻克', '答错会回到待攻克，下一次优先复习。'],
                  ['🟡 第1次答对', '进入待复习，按间隔再练。'],
                  ['🟡 第2次连对', '间隔拉长到 3 天后。'],
                  ['🟡 第3次连对', '间隔拉长到 7 天后。'],
                  ['🟢 已掌握', '彻底掌握后，30 天后做防遗忘抽查。'],
                ].map(([title, desc]) => (
                  <div key={title} className="rounded-2xl bg-gray-50 border border-gray-100 px-3 py-2">
                    <div className="text-[13px] font-semibold text-gray-800">{title}</div>
                    <div className="text-[11px] font-medium text-gray-500 mt-0.5">{desc}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {confirmAction && (
             <div className="absolute inset-0 z-[80] flex items-center justify-center p-4">
                 <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-gray-900/40 backdrop-blur-[2px]" 
                    onClick={() => setConfirmAction(null)} 
                 />
                 <motion.div 
                    initial={{ scale: 0.9, opacity: 0, y: 10 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 10 }}
                    className="bg-white rounded-[32px] p-6 shadow-2xl relative z-10 w-full max-w-sm text-center border border-white/50"
                 >
                     <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg ${confirmAction.type === 'master' ? 'bg-green-100 text-green-500' : 'bg-orange-100 text-orange-500'}`}>
                         {confirmAction.type === 'master' ? <Trophy size={32} strokeWidth={2} /> : <Zap size={32} strokeWidth={2} />}
                     </div>
                     
                     <h3 className="text-[15px] font-semibold text-gray-800 mb-2">
                        {confirmAction.type === 'master' ? '确认已掌握？' : '撤销掌握状态？'}
                     </h3>
                     <p className="text-[13px] text-gray-500 font-medium leading-relaxed mb-8">
                        {confirmAction.type === 'master' 
                           ? '太棒了！标记为【已掌握】后，该题将移出待复习列表，并为你增加 20 XP。' 
                           : '该题将重新回到【需复习】列表，方便你再次巩固知识点。'
                        }
                     </p>
                     
                     <div className="flex gap-3">
                         <button 
                            onClick={() => setConfirmAction(null)}
                            className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 font-bold hover:bg-gray-200 transition-colors"
                         >
                             再想想
                         </button>
                         <button 
                            onClick={confirmFlagChange}
                            className={`flex-1 py-3 rounded-xl text-white font-bold shadow-lg transition-transform active:scale-95 ${confirmAction.type === 'master' ? 'bg-green-500 shadow-green-200' : 'bg-orange-500 shadow-orange-200'}`}
                         >
                             {confirmAction.type === 'master' ? '确认掌握' : '确认撤销'}
                         </button>
                     </div>
                 </motion.div>
             </div>
        )}
      </AnimatePresence>

      {/* Question Preview Bottom Sheet (题库样式) */}
      <QuestionPreviewModal 
        isOpen={isPreviewOpen} 
        question={previewQuestion} 
        onClose={() => { setIsPreviewOpen(false); setPreviewQuestion(null); }}
        onStartChallenge={() => setIsPreviewOpen(false)}
        source="mistake"
        onStartDrill={(q) => {
          const list = buildDrillQuestions(q);
          setDrillQuestions(list);
          setIsPreviewOpen(false);
          setDrillPhase('quiz');
          setDrillAnswers(null);
          setDrillResult(null);
          setIsDrillOpen(true);
        }}
        onViewAnalysis={() => setIsPreviewOpen(false)}
      />

      {/* 举一反三：全屏复用通用答题视图（每日攻克同款体验） */}
      {portalTarget && createPortal(
        <AnimatePresence>
          {isDrillOpen && drillQuestions && drillQuestions.length > 0 && (
            <motion.div
              className="absolute inset-0 z-[120] bg-white"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {drillPhase === 'quiz' && (
                <UniversalQuizView
                  mode="practice"
                  questions={drillQuestions}
                  onClose={() => { setIsDrillOpen(false); setDrillQuestions(null); setDrillResult(null); }}
                  onSubmit={(payload) => {
                    const { answers: ans, paperDraftSnapshots, paperSelfGrades } = normalizeQuizSubmitPayload(payload);
                    const res = buildDrillResult(drillQuestions, ans, paperSelfGrades ?? {});
                    setDrillAnswers(ans);
                    setDrillPaperDrafts(paperDraftSnapshots ?? {});
                    setDrillPaperSelfGrades(paperSelfGrades ?? {});
                    setDrillResult(res);
                    setDrillPhase('result');
                  }}
                  variant="mistake-daily"
                />
              )}

              {drillPhase === 'result' && drillResult && (
                drillQuestions.length === 1 ? (
                  <div className="absolute inset-0 bg-gray-900/95 backdrop-blur-xl flex items-center justify-center p-4 z-[100] pointer-events-auto">
                    {(() => {
                      const q = drillQuestions[0];
                      const drillIsCorrect = resolveQuestionCorrectness(
                        q.content?.manualGradeBlankIndex,
                        q.result?.correctAnswer,
                        drillAnswers?.[q.id],
                        drillPaperSelfGrades[q.id],
                      );
                      return (
                    <SingleQuestionResultCard
                      questionId={drillQuestions[0].id}
                      questionType={drillQuestions[0].type}
                      subject={(drillQuestions[0] as any).subject ?? 'math'}
                      difficulty={drillQuestions[0].difficulty}
                      stem={drillQuestions[0].content.stem}
                      options={drillQuestions[0].content.options?.map(opt => ({
                        label: opt,
                        text: opt,
                        isCorrect: Array.isArray(drillQuestions[0].result?.correctAnswer)
                          ? (drillQuestions[0].result?.correctAnswer as any[]).includes(opt)
                          : drillQuestions[0].result?.correctAnswer === opt,
                        userSelected: Array.isArray(drillAnswers?.[drillQuestions[0].id])
                          ? (drillAnswers?.[drillQuestions[0].id] as any[]).includes(opt)
                          : drillAnswers?.[drillQuestions[0].id] === opt,
                      }))}
                      userAnswerPreview={drillAnswers ? (Array.isArray(drillAnswers[drillQuestions[0].id]) ? (drillAnswers[drillQuestions[0].id] as any[]).join('、') : (drillAnswers[drillQuestions[0].id] ?? '')) : ''}
                      correctAnswerPreview={Array.isArray(drillQuestions[0].result?.correctAnswer) ? (drillQuestions[0].result?.correctAnswer as any[]).join('、') : (drillQuestions[0].result?.correctAnswer as any)}
                      explanationText={drillQuestions[0].result?.explanation}
                      knowledgePoints={drillQuestions[0].knowledgePoints?.map(k => ({ id: k, label: k, color: '#6C5DD3' }))}
                      status={drillIsCorrect ? 'correct' : 'wrong'}
                      timeUsedSec={0}
                      attemptStats={{ totalAttempts: 1, correctCount: drillIsCorrect ? 1 : 0, wrongCount: drillIsCorrect ? 0 : 1 }}
                      paperDraftImageUrl={drillPaperDrafts[drillQuestions[0].id] ?? null}
                      paperSelfGrade={drillPaperSelfGrades[drillQuestions[0].id] ?? null}
                      onPaperSelfGrade={(grade) => setDrillPaperSelfGrades((prev) => ({ ...prev, [drillQuestions[0].id]: grade }))}
                      onOpenAITutor={onOpenAITutor}
                      onClose={() => { setIsDrillOpen(false); setDrillQuestions(null); setDrillResult(null); }}
                    />
                      );
                    })()}
                  </div>
                ) : (
                  <UniversalQuizResult
                    initialData={drillResult}
                    onClose={() => { setIsDrillOpen(false); setDrillQuestions(null); setDrillResult(null); }}
                  />
                )
              )}
            </motion.div>
          )}
        </AnimatePresence>,
        portalTarget
      )}
    </div>
  );
};

const getCategoryLabel = (category?: string) => {
    if (!category) return undefined;
    if (category === 'textbook') return '课本原题';
    if (category === 'synchronous') return '同步题';
    if (category === 'finale') return '压轴题';
    return '典型题';
};

/** 错题列表 · 图片题预览（固定高度裁切，避免 contain 留白） */
const MistakeCardImagePreview: React.FC<{ src: string; heightClass?: string }> = ({
  src,
  heightClass = 'h-[92px]',
}) => (
  <div
    className={`relative w-full ${heightClass} overflow-hidden rounded-2xl border border-slate-100 bg-slate-200/50`}
  >
    <img
      src={src}
      alt="题目图片"
      className="absolute inset-0 h-full w-full object-cover object-[50%_38%] scale-[1.12]"
      loading="lazy"
      draggable={false}
    />
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-black/[0.06] to-transparent" />
  </div>
);

const SwipeableMistakeCard: React.FC<{ 
    item: MistakeItem; 
    onClick: () => void; 
    onStar: (item: MistakeItem) => void; 
    onFlag: (item: MistakeItem) => void; 
    onReasonChange: (id: string, reason: MistakeItem['errorType']) => void;
    editingReasonId: string | null;
    setEditingReasonId: (id: string | null) => void;
    variant?: 'default' | 'compact';
    isEditMode?: boolean;
}> = ({ item, onClick, onStar, onFlag, onReasonChange, editingReasonId, setEditingReasonId, variant = 'default', isEditMode = false }) => {
    const REASONS: MistakeItem['errorType'][] = [
        '审题有误',
        '知识点忘了',
        '想不到思路',
        '计算出错',
        '公式用错/条件不符',
        '时间不够做完',
        '蒙的/不会',
        '概念模糊',
        '审题不清',
        '思路卡壳',
        '其它'
    ];
    const reasonColor = (reason: string) => {
        // 统一使用红色系风格
        return 'bg-red-50 text-red-600 border-red-100';
    };

    const categoryToChinese = (category: string) => getCategoryLabel(category) || category;

    // 检查题目是否有音频
    const originalId = item.id.startsWith('mist-') ? item.id.replace('mist-', '') : item.id;
    const originalQuestion = allQuestions.find(q => q.id === originalId);
    const hasAudio = Boolean(originalQuestion?.content?.audioUrl);
    const readingLikeTypes = ['reading_comp', 'task_reading', 'short_cloze', 'dialogue_fill', 'poem_reading', 'classical_reading'];
    const questionType = (originalQuestion?.type || item.questionType) as string | undefined;
    const isReadingLike = questionType ? readingLikeTypes.includes(questionType as any) : false;
    const subQuestions = originalQuestion?.content?.subQuestions;
    const stemImages = originalQuestion?.content?.stemImages;
    const stemText = originalQuestion?.content?.stem || item.fullQuestion || item.questionSnippet;
    const isImageQuestion = Boolean(stemImages && stemImages.length > 0);
    const cardPreviewMode =
      originalQuestion?.content?.mistakeCardPreview ?? (isImageQuestion ? 'image' : 'text');
    const showCardImage = cardPreviewMode === 'image' && Boolean(stemImages?.[0]);

    // 音频播放状态
    const [cardAudio, setCardAudio] = useState<HTMLAudioElement | null>(null);
    const [isCardAudioPlaying, setIsCardAudioPlaying] = useState(false);
    const [cardAudioProgress, setCardAudioProgress] = useState(0);
    const [cardAudioDuration, setCardAudioDuration] = useState(0);
    const [customReason, setCustomReason] = useState('');

    // 清理音频资源
    useEffect(() => {
        return () => {
            if (cardAudio) {
                cardAudio.pause();
                cardAudio.src = '';
            }
        };
    }, [cardAudio]);

    // 音频播放控制逻辑
    const handleCardAudioPlay = () => {
        if (!originalQuestion?.content?.audioUrl) return;

        if (cardAudio) {
            if (!cardAudio.paused) {
                cardAudio.pause();
                setIsCardAudioPlaying(false);
                return;
            } else if (cardAudio.src === originalQuestion.content.audioUrl) {
                cardAudio.play().then(() => setIsCardAudioPlaying(true)).catch(() => {});
                return;
            }
        }

        const audio = new Audio(originalQuestion.content.audioUrl);
        setCardAudio(audio);
        audio.onloadedmetadata = () => {
            setCardAudioDuration(audio.duration || 0);
        };
        audio.ontimeupdate = () => {
            setCardAudioProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0);
        };
        audio.onended = () => {
            setIsCardAudioPlaying(false);
            setCardAudioProgress(0);
        };
        audio.onerror = () => {
            setIsCardAudioPlaying(false);
        };
        audio.play()
            .then(() => setIsCardAudioPlaying(true))
            .catch(() => setIsCardAudioPlaying(false));
    };

    const statusColorClass =
      item.status === 'new'
        ? 'bg-red-500'
        : item.status === 'reviewing'
        ? 'bg-yellow-400'
        : item.status === 'mastered'
        ? 'bg-emerald-500'
        : 'bg-gray-300';
    const memoryMeta = getMemoryReviewMeta(item);
    const knowledgeTags = (item.knowledgePoints && item.knowledgePoints.length > 0
      ? item.knowledgePoints
      : item.topic ? [item.topic] : []
    ).slice(0, 3);

    if (variant === 'compact') {
        return (
            <Card onClick={onClick} className="relative overflow-hidden group cursor-pointer border border-white bg-white hover:border-brand/20 hover:shadow-md transition-all p-4 rounded-[24px]">
                <div className={`flex items-start gap-3 mb-3 ${isImageQuestion ? 'justify-end' : 'justify-between'}`}>
                    {!isImageQuestion && (
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold">
                                {item.questionType && (
                                    <span className="px-2 py-0.5 rounded-full bg-gray-900 text-white">
                                        {item.questionType === 'single_choice' ? '单选' :
                                         item.questionType === 'multiple_choice' ? '多选' :
                                         item.questionType === 'fill_in_blank' ? '填空' :
                                         item.questionType === 'true_false' ? '判断' : '题目'}
                                    </span>
                                )}
                                {item.difficulty !== undefined && (
                                    <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                                        难度 {item.difficulty}
                                    </span>
                                )}
                                {item.category && (
                                    <span className="px-2 py-0.5 rounded-full bg-slate-50 text-slate-600 border border-slate-100">
                                        {categoryToChinese(item.category)}
                                    </span>
                                )}
                    </div>
                    )}
                    <span className="text-[11px] font-medium text-gray-400 shrink-0">{item.lastReview || item.lastAttemptAt || '刚刚'}</span>
                </div>

                {showCardImage ? (
                  <div className="mb-3">
                    <MistakeCardImagePreview src={stemImages![0]} />
                  </div>
                ) : (
                  <h4 className="font-medium text-gray-900 text-[13px] leading-5 whitespace-pre-line line-clamp-3 mb-3">
                    {stemText || '（暂无题干）'}
                  </h4>
                )}

                {(!isImageQuestion && knowledgeTags.length > 0) && (
                    <div className="flex flex-wrap gap-2">
                        {knowledgeTags.map((tag) => (
                            <span key={tag} className="text-[11px] font-medium text-indigo-500">#{tag}</span>
                        ))}
                    </div>
                )}

                {isEditMode && (
                    <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                            type="button"
                            onClick={() => setEditingReasonId(editingReasonId === item.id ? null : item.id)}
                            className={`px-3 py-1.5 rounded-full border text-[11px] font-bold ${reasonColor(item.errorType)}`}
                        >
                            {item.errorType}
                        </button>
                        <button
                            type="button"
                            onClick={() => onStar(item)}
                            className={`px-3 py-1.5 rounded-full border text-[11px] font-bold ${item.stats.isStarred ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-gray-200 text-gray-500'}`}
                        >
                            {item.stats.isStarred ? '已收藏' : '收藏'}
                        </button>
                        <button
                            type="button"
                            onClick={() => onFlag(item)}
                            className="px-3 py-1.5 rounded-full border border-gray-200 text-[11px] font-bold text-gray-600"
                        >
                            {item.status === 'mastered' ? '撤销掌握' : '标记掌握'}
                        </button>
                    </div>
                )}

                {isEditMode && editingReasonId === item.id && (
                    <div className="mt-3 flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                        {REASONS.map((r) => (
                            <button
                                key={r}
                                type="button"
                                onClick={() => { onReasonChange(item.id, r); setEditingReasonId(null); }}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${reasonColor(r)} ${r === item.errorType ? 'ring-2 ring-offset-1 ring-indigo-200' : ''}`}
                            >
                                {r}
                            </button>
                        ))}
                    </div>
                )}
            </Card>
        );
    }

    return (
        <Card onClick={onClick} className="relative overflow-hidden group cursor-pointer border border-gray-100 hover:border-brand/20 transition-all p-4">
            <span
              aria-hidden
              className={`absolute right-0 top-0 h-full w-[6px] ${statusColorClass} rounded-r-[18px]`}
            />
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-gray-500 mb-2">
                {!isImageQuestion && (
                    <>
                        {item.questionType && (
                            <span className="px-2 py-1 rounded-full bg-gray-900 text-white">
                                {item.questionType === 'single_choice' ? '单选' :
                                 item.questionType === 'multiple_choice' ? '多选' :
                                 item.questionType === 'fill_in_blank' ? '填空' :
                                 item.questionType === 'true_false' ? '判断' : '题目'}
                            </span>
                        )}
                        {item.difficulty !== undefined && (
                            <span className="px-2 py-1 rounded-full bg-white border text-gray-600">
                                难度 {item.difficulty}
                            </span>
                        )}
                        {item.category && (
                            <span className="px-2 py-1 rounded-full bg-white border text-gray-500">
                                {categoryToChinese(item.category)}
                            </span>
                        )}
                    </>
                )}
                <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setEditingReasonId(editingReasonId === item.id ? null : item.id); }}
                    className={`px-3 py-1 rounded-full border text-[11px] font-bold transition-all flex items-center gap-1 ${reasonColor(item.errorType)}`}
                >
                    {item.errorType}
                    <ChevronDown size={10} />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onStar(item); }}
                    className={`ml-auto transition-colors ${item.stats.isStarred ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 hover:text-yellow-400'}`}
                >
                    <Star size={18} fill={item.stats.isStarred ? "currentColor" : "none"} />
                </button>
            </div>

            <div className="space-y-2 mb-3">
                <div className={`flex flex-wrap items-center gap-2 rounded-2xl border px-3 py-2 ${memoryMeta.badge}`}>
                    <span className={`w-2.5 h-2.5 rounded-full ${memoryMeta.dot}`} />
                    <span className="text-[11px] font-black">{memoryMeta.label}</span>
                    <span className="text-[11px] font-bold opacity-80">{memoryMeta.stage}</span>
                    <span className="ml-auto text-[11px] font-black">{memoryMeta.nextReview}</span>
                </div>
                {/* 先展示题干，保证阅读/语文题能看到主干内容 */}
                {showCardImage ? (
                  <MistakeCardImagePreview src={stemImages![0]} heightClass="h-[104px]" />
                ) : (
                  <h4 className="font-bold text-gray-800 text-[15px] leading-6 whitespace-pre-line line-clamp-4">
                    {stemText || '（暂无题干）'}
                  </h4>
                )}

                {/* 子题预览：阅读/完形/听力等包含 subQuestions 的场景 */}
                {subQuestions && subQuestions.length > 0 && (
                    <div className="space-y-2 text-[12px] text-slate-600">
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 font-semibold">
                            <ChevronDown size={12} />
                            <span>小题预览（{subQuestions.length} 题）</span>
                        </div>
                        {subQuestions.slice(0, 2).map((sq, idx) => {
                            const options = Array.isArray(sq.options) ? sq.options : [];
                            const showOptions = options.length > 0;
                            return (
                                <div key={idx} className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-2">
                                    <div className="text-[13px] font-semibold text-slate-800 leading-6 line-clamp-2">
                                        {idx + 1}. {sq.question}
                                    </div>
                                    {showOptions && (
                                        <div className={`${isReadingLike ? 'space-y-1' : 'flex flex-wrap gap-2'} text-[11px] text-slate-600`}>
                                            {options.slice(0, 4).map((opt, oidx) => (
                                                <div
                                                    key={oidx}
                                                    className={isReadingLike ? 'leading-snug' : 'px-2 py-1 rounded-lg bg-white border border-slate-100'}
                                                >
                                                    {isReadingLike ? `${String.fromCharCode(65 + oidx)}. ${opt}` : opt}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        {subQuestions.length > 2 && (
                            <div className="text-[11px] text-indigo-500 font-semibold">
                                ... 共 {subQuestions.length} 小题
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 听力播放器 - 仅在有音频时显示 */}
            {hasAudio && (
                <div className="flex items-center gap-3 text-[11px] text-slate-600 mb-3">
                    <button
                        onClick={(e) => { e.stopPropagation(); handleCardAudioPlay(); }}
                        className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 active:scale-95 transition"
                    >
                        {isCardAudioPlaying ? <Pause size={10} /> : <Play size={10} className="translate-x-[0.5px]" />}
                    </button>
                    <div className="flex-1 h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div
                            className="h-full bg-[#0A84FF] transition-all duration-200"
                            style={{ width: `${isCardAudioPlaying ? cardAudioProgress : 0}%` }}
                        />
                    </div>
                    <span className="font-mono min-w-[50px] text-right text-slate-500">
                        {cardAudioDuration
                            ? `${Math.floor((cardAudioDuration * (cardAudioProgress / 100)) / 60).toString().padStart(2, '0')}:${Math.floor((cardAudioDuration * (cardAudioProgress / 100)) % 60).toString().padStart(2, '0')}`
                            : '00:00'}
                        {' / '}
                        {cardAudioDuration ? `${Math.floor(cardAudioDuration / 60).toString().padStart(2, '0')}:${Math.floor(cardAudioDuration % 60).toString().padStart(2, '0')}` : '--:--'}
                    </span>
                </div>
            )}

            {editingReasonId === item.id && (
                <div className="mt-3 flex flex-wrap gap-2">
                    {!REASONS.includes(item.errorType) && item.errorType && (
                        <div className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${reasonColor(item.errorType)} ring-2 ring-offset-1 ring-indigo-200`}>
                            {item.errorType}（当前）
                        </div>
                    )}
                    {REASONS.map((r) => {
                        const active = r === item.errorType;

                        if (r === '其它') {
                            const handleSubmit = (e?: React.FormEvent) => {
                                if (e) {
                                    e.preventDefault();
                                    e.stopPropagation();
                                }
                                const trimmed = customReason.trim();
                                if (!trimmed) return;
                                onReasonChange(item.id, trimmed);
                                setCustomReason('');
                                setEditingReasonId(null);
                            };

                            return (
                                <form
                                    key="custom-reason"
                                    onSubmit={handleSubmit}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border border-dashed border-slate-200 bg-slate-50 transition-all"
                                >
                                    <input
                                        value={customReason}
                                        onChange={(e) => setCustomReason(e.target.value)}
                                        placeholder="输入自定义错因"
                                        maxLength={20}
                                        className="bg-transparent outline-none text-xs font-bold text-slate-700 w-full placeholder:text-slate-300"
                                    />
                                    <button
                                        type="submit"
                                        className="px-2 py-1 rounded-lg bg-slate-900 text-white font-bold text-[11px] disabled:opacity-40"
                                        disabled={!customReason.trim()}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        保存
                                    </button>
                                </form>
                            );
                        }

                        return (
                            <button
                                key={r}
                                type="button"
                                onClick={(e) => { e.stopPropagation(); onReasonChange(item.id, r); setEditingReasonId(null); }}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${reasonColor(r)} ${active ? 'ring-2 ring-offset-1 ring-indigo-200' : 'opacity-90 hover:opacity-100'}`}
                            >
                                {r}
                            </button>
                        );
                    })}
                </div>
            )}

            <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                    <div className="flex items-center gap-1" title="练习统计">
                        <CheckCircle2 size={12} className="text-emerald-500" /> 对 {item.correctAttempts ?? item.stats.correctCount}
                    </div>
                    <div className="flex items-center gap-1" title="练习统计">
                        <XCircle size={12} className="text-rose-500" /> 错 {item.wrongAttempts ?? item.stats.errorCount}
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-gray-400">{item.topic}</span>
                    <span className="text-[11px] font-bold text-gray-400">{item.lastReview}</span>
                </div>
            </div>
        </Card>
    );
};
