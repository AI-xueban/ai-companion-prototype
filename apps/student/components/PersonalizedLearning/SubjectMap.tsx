import React, { useState, useEffect, useRef, useLayoutEffect, useMemo } from 'react';
import { motion as motionOriginal, AnimatePresence } from 'framer-motion';
import { MapNode, SubjectType, SubjectData, MapMode, Task, UserPersona, ExpeditionPlan } from '../../types';
import { getSubjectMapData } from '../../services/geminiService';
import { Lock, Star, Play, X, Gift, Crown, Sword, BookOpen, Layers, Scroll, Headphones, FlaskConical, Globe2, Dna, Brain, Zap, PenTool, Check, Rocket, Sparkles, ChevronRight, GraduationCap, ChevronDown, Lightbulb, Stethoscope, Target, Shield, Puzzle, Circle, Clock, Flag, Calendar, Trophy, Flame, AlertTriangle, Timer } from 'lucide-react';
import { InteractiveLumi } from '../LumiSpace/InteractiveLumi';
import { LumiConfigChat } from './LumiConfigChat';
import { LumiExpeditionWizard } from './LumiExpeditionWizard';
import { PlannerContainer } from './Planner/PlannerContainer';
import { TopBarController } from './TopBarController';
import UniverseContainer from './Universe/UniverseContainer';
import VideoLearningPage from './Universe/VideoLearningPage';
import { VideoLesson, VideoPlaylistItem } from '../Learning/VideoLesson';
import { PracticeSetupModal } from '../Dashboard/PracticeSetupModal';
import { buildEnglishHujiaoPlaylist, buildSectionPlaylist, isChapterOnlyTextbook } from '../../data/syncTextbookCatalog';
import { ExpeditionPathPage } from './ExpeditionPathPage';
import { ExpeditionPlanHistoryPage } from './ExpeditionPlanHistoryPage';
import { ExpeditionActivePlanCard } from './ExpeditionActivePlanCard';
import { buildExpeditionPlan, buildDefaultExpeditionPlan, resolvePlanLevelTitles } from './expeditionPlanConfig';
import { buildExpeditionMapNodes, getDemoCompletedCountForPlan } from './expeditionMapNodes';
import { expeditionSession } from './expeditionSessionBridge';
import {
  addExpeditionPlanHistory,
} from './expeditionPlanHistory';
import { buildHistoryLevelQuizResult } from './expeditionHistoryQuizResult';
import { ExpeditionPlanHistoryRecord } from '../../types';
import { UniversalQuizResult } from '../Quiz/UniversalQuizResult';
import { GameNodeComponent } from './GameNode';
import { usePrototypeAnnotationOptional } from '../../context/PrototypeAnnotationContext';

const motion = motionOriginal as any;


// Stage Context Configuration - Updated for Bright Tech Theme
const SUBJECT_STAGE_CONFIG = {
    '数学': {
        grade: '六年级上',
        textbook: '北师大版',
        chapter: '第三章：一元一次方程',
        icon: Layers,
        themeColor: 'text-indigo-600',
        subColor: 'text-indigo-400',
        bgGradient: 'from-indigo-50 to-blue-50',
        iconBg: 'bg-indigo-100 text-indigo-600',
        shadow: 'shadow-[0_15px_30px_-5px_rgba(99,102,241,0.15)]'
    },
    '语文': {
        grade: '六年级上',
        textbook: '人教版',
        chapter: '第二单元：古诗文诵读',
        icon: Scroll,
        themeColor: 'text-red-600',
        subColor: 'text-red-400',
        bgGradient: 'from-red-50 to-orange-50',
        iconBg: 'bg-red-100 text-red-600',
        shadow: 'shadow-[0_15px_30px_-5px_rgba(239,68,68,0.15)]'
    },
    '英语': {
        grade: '六年级上',
        textbook: '沪教版',
        chapter: 'Unit 3: What time do you go to school?',
        icon: Headphones,
        themeColor: 'text-emerald-600',
        subColor: 'text-emerald-400',
        bgGradient: 'from-emerald-50 to-teal-50',
        iconBg: 'bg-emerald-100 text-emerald-600',
        shadow: 'shadow-[0_15px_30px_-5px_rgba(16,185,129,0.15)]'
    },
    '科学': {
        grade: '七年级上',
        textbook: '浙教版',
        chapter: '第一章：科学入门',
        icon: FlaskConical,
        themeColor: 'text-cyan-600',
        subColor: 'text-cyan-400',
        bgGradient: 'from-cyan-50 to-sky-50',
        iconBg: 'bg-cyan-100 text-cyan-600',
        shadow: 'shadow-[0_15px_30px_-5px_rgba(8,145,178,0.15)]'
    },
    '地理': {
        grade: '六年级上',
        textbook: '人教版',
        chapter: '第一单元：认识地球',
        icon: Globe2,
        themeColor: 'text-amber-600',
        subColor: 'text-amber-400',
        bgGradient: 'from-amber-50 to-orange-50',
        iconBg: 'bg-amber-100 text-amber-600',
        shadow: 'shadow-[0_15px_30px_-5px_rgba(217,119,6,0.15)]'
    },
    '生物': {
        grade: '六年级上',
        textbook: '人教版',
        chapter: '第一单元：认识生物',
        icon: Dna,
        themeColor: 'text-lime-600',
        subColor: 'text-lime-400',
        bgGradient: 'from-lime-50 to-emerald-50',
        iconBg: 'bg-lime-100 text-lime-600',
        shadow: 'shadow-[0_15px_30px_-5px_rgba(101,163,13,0.15)]'
    }
};

import { NodeDetailModal } from './NodeDetailModal';

// Mock Data for Syllabus
const MOCK_CHAPTERS = [
    { id: 'c1', title: '第一章：有理数', status: 'completed', progress: 100 },
    { id: 'c2', title: '第二章：整式的加减', status: 'completed', progress: 100 },
    { id: 'c3', title: '第三章：一元一次方程', status: 'current', progress: 45 },
    { id: 'c4', title: '第四章：几何图形初步', status: 'locked', progress: 0 },
];

export type HomeVideoLaunch = {
    id: number;
    subject: SubjectType;
    textbook: string;
    chapterLabel: string;
    sectionLabel: string;
};

interface SubjectMapProps {
    activeSubject: SubjectType;
    onStartLevel?: (taskInfo: Partial<Task>) => void;
    onOpenEssayLab?: () => void; 
    isAssessed?: boolean;
    mapMode?: MapMode;
    onModeChange?: (mode: MapMode) => void;
    userPersona?: UserPersona;
    learningStrategy?: 'sync-mode' | 'exam-mode';
    onStrategyChange?: (strategy: 'sync-mode' | 'exam-mode') => void;
    demoMapEvent?: 'remedial' | 'bonus' | null;
    skipWizard?: boolean;
    userName?: string;
    learningSessionSignal?: number;
    onReturnHome?: () => void;
    onOpenQuestionTraining?: (mode: 'practice' | 'assessment' | 'unit') => void;
    onExpeditionScreenChange?: (screen: ExpeditionScreen) => void;
    historyOpenSignal?: number;
    currentTextbook?: string;
    onTextbookChange?: (textbook: string) => void;
    homeVideoLaunch?: HomeVideoLaunch | null;
    compactHome?: boolean;
    onBackFromCompact?: () => void;
}

export type ExpeditionScreen =
  | 'main'
  | 'path'
  | 'history'
  | 'history-level-result'
  | 'video-learning'
  | 'textbook-video'
  | 'learning-module';

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
    onStartLevel, 
    onOpenEssayLab, 
    isAssessed = true,
    mapMode = 'pro', 
    onModeChange,
    userPersona = 'average',
    learningStrategy = 'sync-mode',
    onStrategyChange,
    demoMapEvent,
    skipWizard = false,
    userName = '同学',
    learningSessionSignal = 0,
    onReturnHome,
    onOpenQuestionTraining,
    onExpeditionScreenChange,
    historyOpenSignal = 0,
    currentTextbook: textbookProp,
    onTextbookChange,
    homeVideoLaunch,
    compactHome = false,
    onBackFromCompact,
}) => {
  const [mapData, setMapData] = useState<SubjectData | null>(null);
  const [selectedNode, setSelectedNode] = useState<MapNode | null>(null);
  const [isGradeMenuOpen, setIsGradeMenuOpen] = useState(false);
  const [isConfigChatOpen, setIsConfigChatOpen] = useState(false);
  const [isPlannerOpen, setIsPlannerOpen] = useState(false);
  const [showThinkingProcess, setShowThinkingProcess] = useState(false);
  const [thinkingStage, setThinkingStage] = useState(0);
  const [examConfig, setExamConfig] = useState<any>(null);
  
  // Expedition State
  const [expeditionPlan, setExpeditionPlan] = useState<ExpeditionPlan | null>(null);
  const [expeditionScreen, setExpeditionScreen] = useState<
    'main' | 'path' | 'history' | 'history-level-result' | 'video-learning' | 'textbook-video' | 'learning-module'
  >('main');
  const [textbookVideoTask, setTextbookVideoTask] = useState<Task | null>(null);
  const [textbookVideoPlaylist, setTextbookVideoPlaylist] = useState<VideoPlaylistItem[]>([]);
  const [textbookCurrentVideoId, setTextbookCurrentVideoId] = useState('');
  const [textbookVideoReturnHome, setTextbookVideoReturnHome] = useState(false);
  const [textbookVideoPracticeAction, setTextbookVideoPracticeAction] = useState<{
    label: string;
    mode: 'practice' | 'unit';
  } | null>({ label: '一课一练', mode: 'practice' });
  const [textbookVideoReturnToPath, setTextbookVideoReturnToPath] = useState(true);
  const [unitSetupOpen, setUnitSetupOpen] = useState(false);
  const [expeditionCompletedCount, setExpeditionCompletedCount] = useState(
    () => expeditionSession.completedCount
  );
  const [expeditionPlanStatus, setExpeditionPlanStatus] = useState<'active' | 'completed'>('active');
  const [showExpeditionExitConfirm, setShowExpeditionExitConfirm] = useState(false);
  const [historyReviewRecord, setHistoryReviewRecord] = useState<ExpeditionPlanHistoryRecord | null>(null);
  const [historySelectedLevel, setHistorySelectedLevel] = useState<{
    index: number;
    title: string;
  } | null>(null);
  /** 向导入口：default=有推荐主题；first-time=无推荐、自选主题 */
  const [wizardEntryMode, setWizardEntryMode] = useState<'default' | 'first-time'>('default');

  // Layout & State
  const [pathD, setPathD] = useState('');
  const [isMapReady, setIsMapReady] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const contentContainerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const thinkingTimersRef = useRef<NodeJS.Timeout[]>([]);
  
  const stageConfig = SUBJECT_STAGE_CONFIG[activeSubject as keyof typeof SUBJECT_STAGE_CONFIG]
    ?? SUBJECT_STAGE_CONFIG['数学'];
  const isChineseOrEnglish = activeSubject === '语文' || activeSubject === '英语';
  const [currentGrade, setCurrentGrade] = useState(stageConfig.grade);
  const [internalTextbook, setInternalTextbook] = useState(stageConfig.textbook);
  const currentTextbook = textbookProp ?? internalTextbook;
  const setCurrentTextbook = onTextbookChange ?? setInternalTextbook;

  useEffect(() => {
      setCurrentGrade(stageConfig.grade);
      if (!textbookProp) setInternalTextbook(stageConfig.textbook);
  }, [activeSubject, stageConfig, textbookProp]);

  useEffect(() => {
    expeditionSession.lastScreen = expeditionScreen;
    onExpeditionScreenChange?.(expeditionScreen);
  }, [expeditionScreen, onExpeditionScreenChange]);

  useEffect(() => {
    if (historyOpenSignal > 0) {
      setExpeditionScreen('history');
    }
  }, [historyOpenSignal]);

  // 每次 SubjectMap 首次挂载 / 页面刷新时，根据 skipWizard 状态决定是否显示规划向导
  useEffect(() => {
      // 已有定制计划：原样恢复计划与离开前子页（切首页再回来仍停在计划卡/路线等）
      if (expeditionSession.activePlan && expeditionSession.activePlan.subject === activeSubject) {
          setExpeditionPlan(expeditionSession.activePlan);
          setExpeditionCompletedCount(expeditionSession.completedCount);
          setExpeditionScreen(
            expeditionSession.returnScreen ??
              expeditionSession.lastScreen ??
              'main'
          );
          setIsPlannerOpen(false);
          // returnScreen 仅用于「从学习会话返回」，消费一次；lastScreen 持续保留
          if (expeditionSession.returnScreen) {
            expeditionSession.lastScreen = expeditionSession.returnScreen;
            expeditionSession.returnScreen = null;
          }
          return;
      }

      if (skipWizard && isAssessed) {
          // 仅在尚无计划时自动生成一份演示计划
          const plan = buildDefaultExpeditionPlan(activeSubject, currentTextbook, 2, {
              hasLearningData: true,
          });
          const demoCount = getDemoCompletedCountForPlan(plan.duration);
          setExpeditionPlan(plan);
          setExpeditionCompletedCount(demoCount);
          expeditionSession.completedCount = demoCount;
          setExpeditionScreen(expeditionSession.lastScreen || 'main');
          setIsPlannerOpen(false);
      } else {
          // 默认情况下重置计划，显示 LumiExpeditionWizard 向导
          setExpeditionPlan(null);
          setExpeditionScreen('main');
          setIsPlannerOpen(true);
      }
  }, [skipWizard, isAssessed]);

  useEffect(() => {
    if (!homeVideoLaunch) return;
    const isChapterOnly = isChapterOnlyTextbook(homeVideoLaunch.subject, homeVideoLaunch.textbook);
    const playlist = isChapterOnly
      ? buildEnglishHujiaoPlaylist(homeVideoLaunch.chapterLabel)
      : buildSectionPlaylist(homeVideoLaunch.subject);
    const first =
      playlist.find((item) => item.title === homeVideoLaunch.sectionLabel) || playlist[0];
    if (!first) return;
    setTextbookVideoReturnHome(true);
    setTextbookVideoPracticeAction(
      isChapterOnly ? { label: '单元测', mode: 'unit' } : { label: '一课一练', mode: 'practice' }
    );
    setTextbookVideoReturnToPath(!isChapterOnly);
    setTextbookVideoPlaylist(playlist);
    setTextbookCurrentVideoId(first.id);
    setTextbookVideoTask({
      id: `home-video-${first.id}`,
      title: first.title,
      subject: homeVideoLaunch.subject,
      completed: false,
      durationMinutes: 15,
      levelType: 'level',
      quizType: 'mixed',
    });
    setExpeditionScreen('textbook-video');
  }, [homeVideoLaunch]);

  useEffect(() => {
    // 仅在确有计划时写入；避免 remount 初始 null 冲掉会话中的定制计划
    if (expeditionPlan) {
      expeditionSession.activePlan = expeditionPlan;
    }
  }, [expeditionPlan]);

  useEffect(() => {
    expeditionSession.completedCount = expeditionCompletedCount;
  }, [expeditionCompletedCount]);

  useEffect(() => {
    setIsMapReady(false); 
    setMapData(null);
    setPathD('');
    
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

  const handleNewExpeditionPlan = () => {
      setExpeditionPlan(null);
      setExpeditionScreen('main');
      setExpeditionCompletedCount(0);
      expeditionSession.completedCount = 0;
      setExpeditionPlanStatus('active');
      setIsMapReady(false);
      expeditionSession.pendingNodeId = null;
      expeditionSession.pendingLevelSuccess = false;
      expeditionSession.continueNextAfterResult = false;
      expeditionSession.progressSyncedFromApp = false;
      expeditionSession.planCompleted = false;
      expeditionSession.requestNewPlan = false;
      expeditionSession.needsContinuePrompt = false;
      expeditionSession.activePlan = null;
      setWizardEntryMode('default');
  };

  const annotation = usePrototypeAnnotationOptional();
  const expeditionSimScenario = annotation?.expeditionSimScenario ?? 'enough';
  const prevExpeditionSimRef = useRef(expeditionSimScenario);
  useEffect(() => {
    if (prevExpeditionSimRef.current === expeditionSimScenario) return;
    prevExpeditionSimRef.current = expeditionSimScenario;
    handleNewExpeditionPlan();
    setWizardEntryMode(expeditionSimScenario === 'first-time' ? 'first-time' : 'default');
  }, [expeditionSimScenario]);

  // 主动结束当前定制计划：清空未完成关卡，已获得的成就与进度保留
  const handleExitExpeditionPlan = () => {
      setShowExpeditionExitConfirm(false);
      setExpeditionPlan(null);
      setExpeditionScreen('main');
      setExpeditionCompletedCount(0);
      expeditionSession.completedCount = 0;
      setExpeditionPlanStatus('active');
      setIsMapReady(false);
      expeditionSession.pendingNodeId = null;
      expeditionSession.pendingLevelSuccess = false;
      expeditionSession.continueNextAfterResult = false;
      expeditionSession.progressSyncedFromApp = false;
      expeditionSession.planCompleted = false;
      expeditionSession.requestNewPlan = false;
      expeditionSession.needsContinuePrompt = false;
      expeditionSession.activePlan = null;
  };

  const lastLearningSignalRef = useRef(learningSessionSignal);
  const expeditionPlanRef = useRef(expeditionPlan);
  expeditionPlanRef.current = expeditionPlan;

  const startExpeditionLevelAtCount = (count: number) => {
    const plan = expeditionPlanRef.current;
    if (!plan || !onStartLevel) {
      setExpeditionScreen('path');
      return;
    }
    const titles = resolvePlanLevelTitles(plan);
    const nodes = buildExpeditionMapNodes(count, { titles, totalLevels: titles.length || Math.max(1, plan.duration * 7) });
    const current = nodes.find((n) => n.status === 'current');
    if (!current) {
      setExpeditionScreen('path');
      return;
    }
    expeditionSession.pendingNodeId = current.id;
    onStartLevel({
      id: current.id,
      title: current.title,
      subject: activeSubject,
      durationMinutes: current.durationMinutes ?? 15,
      completed: false,
      levelType: current.nodeType,
      quizType: current.quizType,
    });
  };

  useEffect(() => {
    const signalChanged = learningSessionSignal !== lastLearningSignalRef.current;
    lastLearningSignalRef.current = learningSessionSignal;

    const hasPending =
      expeditionSession.planCompleted ||
      expeditionSession.pendingLevelSuccess ||
      expeditionSession.continueNextAfterResult ||
      expeditionSession.progressSyncedFromApp ||
      expeditionSession.returnScreen != null ||
      expeditionSession.requestNewPlan;

    // 从学习页返回时 SubjectMap 会重新挂载，signal 相对当前初始值未必变化，需靠 pending 标志兜底
    if (!signalChanged && !hasPending) return;

    if (expeditionSession.activePlan && !expeditionPlanRef.current) {
      setExpeditionPlan(expeditionSession.activePlan);
    }

    let keepReturnScreen = false;

    if (expeditionSession.planCompleted) {
      const plan = expeditionPlanRef.current ?? expeditionSession.activePlan;
      const doneCount = plan ? resolvePlanLevelTitles(plan).length || plan.duration * 7 : expeditionSession.completedCount;
      setExpeditionCompletedCount(doneCount);
      setExpeditionPlanStatus('completed');
      if (plan) {
        addExpeditionPlanHistory(plan, activeSubject, doneCount);
      }
      expeditionSession.planCompleted = false;
      expeditionSession.pendingLevelSuccess = false;
      expeditionSession.continueNextAfterResult = false;
      expeditionSession.progressSyncedFromApp = false;
      expeditionSession.pendingNodeId = null;
    } else if (expeditionSession.progressSyncedFromApp) {
      // App「继续闯关」已推进进度并进下一关，这里只同步数字
      expeditionSession.progressSyncedFromApp = false;
      expeditionSession.pendingLevelSuccess = false;
      expeditionSession.continueNextAfterResult = false;
      setExpeditionCompletedCount(expeditionSession.completedCount);
      keepReturnScreen = true;
    } else if (expeditionSession.pendingLevelSuccess) {
      const shouldContinue = expeditionSession.continueNextAfterResult;
      keepReturnScreen = shouldContinue;
      expeditionSession.pendingLevelSuccess = false;
      expeditionSession.continueNextAfterResult = false;
      expeditionSession.pendingNodeId = null;
      setExpeditionCompletedCount((c) => {
        const next = c + 1;
        expeditionSession.completedCount = next;
        if (shouldContinue) {
          queueMicrotask(() => startExpeditionLevelAtCount(next));
        }
        return next;
      });
    } else if (expeditionSession.continueNextAfterResult) {
      keepReturnScreen = true;
      expeditionSession.continueNextAfterResult = false;
      setExpeditionCompletedCount((c) => {
        queueMicrotask(() => startExpeditionLevelAtCount(c));
        return c;
      });
    }

    if (expeditionSession.requestNewPlan) {
      handleNewExpeditionPlan();
    }
    if (expeditionSession.returnScreen != null) {
      setExpeditionScreen(expeditionSession.returnScreen);
      expeditionSession.lastScreen = expeditionSession.returnScreen;
      // 「继续闯关」会马上再进下一关，保留来源页供最终「<」返回
      if (!keepReturnScreen) {
        expeditionSession.returnScreen = null;
      }
    }
  }, [learningSessionSignal]);

  const handleContinueExpedition = () => {
    startExpeditionLevelAtCount(expeditionCompletedCount);
  };

  const handleEnterExpeditionPath = (plan: ReturnType<typeof buildExpeditionPlan>) => {
      setExpeditionPlan(plan);
      setExpeditionCompletedCount(0);
      expeditionSession.completedCount = 0;
      expeditionSession.activePlan = plan;
      setExpeditionPlanStatus('active');
      setExpeditionScreen('path');
      setIsMapReady(false);
      setTimeout(() => setIsMapReady(true), 600);
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

  return (
    <div className={`relative w-full h-full flex flex-col overflow-hidden transition-colors duration-700 ${
        expeditionScreen === 'video-learning' || expeditionScreen === 'textbook-video' ? 'bg-[#EEF1FF]' :
        mapMode === 'pro' ? 'bg-[#EEF1FF]' : 
        learningStrategy === 'exam-mode' ? 'bg-slate-900' : 
        'bg-[#F5F7FA]'
    }`}>
      
      {expeditionScreen === 'video-learning' && (
        <VideoLearningPage
          subject={activeSubject}
          onBack={() => setExpeditionScreen('main')}
        />
      )}
      {expeditionScreen === 'textbook-video' && textbookVideoTask && (
        <div className="absolute inset-0 z-[100] bg-white">
          <VideoLesson
            mode="learn"
            task={textbookVideoTask}
            playlist={textbookVideoPlaylist}
            currentVideoId={textbookCurrentVideoId}
            actionLabel={textbookVideoPracticeAction?.label}
            onSelectVideo={(video) => {
              setTextbookCurrentVideoId(video.id);
              setTextbookVideoTask((previous) =>
                previous
                  ? { ...previous, id: `textbook-video-${video.id}`, title: video.title }
                  : previous
              );
            }}
            onComplete={() => {
              const practiceAction = textbookVideoPracticeAction;
              if (practiceAction?.mode === 'unit') {
                setUnitSetupOpen(true);
                return;
              }
              const returnHome = textbookVideoReturnHome;
              const returnToPath = textbookVideoReturnToPath;
              setTextbookVideoTask(null);
              setTextbookVideoPlaylist([]);
              setTextbookCurrentVideoId('');
              setTextbookVideoReturnHome(false);
              setTextbookVideoPracticeAction({ label: '一课一练', mode: 'practice' });
              setTextbookVideoReturnToPath(true);
              if (returnHome) {
                if (practiceAction) onOpenQuestionTraining?.(practiceAction.mode);
                else onReturnHome?.();
                return;
              }
              setExpeditionScreen(returnToPath ? 'learning-module' : 'main');
              if (practiceAction) onOpenQuestionTraining?.(practiceAction.mode);
            }}
            onExit={() => {
              const returnHome = textbookVideoReturnHome;
              const returnToPath = textbookVideoReturnToPath;
              setTextbookVideoTask(null);
              setTextbookVideoPlaylist([]);
              setTextbookCurrentVideoId('');
              setTextbookVideoReturnHome(false);
              setTextbookVideoPracticeAction({ label: '一课一练', mode: 'practice' });
              setTextbookVideoReturnToPath(true);
              if (returnHome) {
                onReturnHome?.();
                return;
              }
              setExpeditionScreen(returnToPath ? 'learning-module' : 'main');
            }}
          />
        </div>
      )}
      <PracticeSetupModal
        open={unitSetupOpen}
        recommendedCount={10}
        annotationId="subject.sync.unit-test"
        overlayClassName="absolute inset-0 z-[110] flex items-center justify-center bg-slate-900/40 px-4 py-6"
        onClose={() => setUnitSetupOpen(false)}
        onConfirm={() => {
          setUnitSetupOpen(false);
          const returnHome = textbookVideoReturnHome;
          const returnToPath = textbookVideoReturnToPath;
          setTextbookVideoTask(null);
          setTextbookVideoPlaylist([]);
          setTextbookCurrentVideoId('');
          setTextbookVideoReturnHome(false);
          setTextbookVideoPracticeAction({ label: '一课一练', mode: 'practice' });
          setTextbookVideoReturnToPath(true);
          if (returnHome) {
            onOpenQuestionTraining?.('unit');
            return;
          }
          setExpeditionScreen(returnToPath ? 'learning-module' : 'main');
          onOpenQuestionTraining?.('unit');
        }}
      />

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
      {mapMode === 'sync' && learningStrategy === 'sync-mode' ? (
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
                                  {group.dayLabel} 路 {group.date}
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
            <AnimatePresence mode="wait">
              {isChineseOrEnglish ? (
                <motion.div
                  key={`expedition-coming-soon-${activeSubject}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar relative scroll-smooth z-0 pt-0"
                  ref={scrollContainerRef}
                >
                  <div className="min-h-full w-full flex items-center justify-center">
                    <LumiExpeditionWizard
                      key={`wizard-coming-soon-${activeSubject}`}
                      subject={activeSubject}
                      textbook={currentTextbook}
                      entryMode={wizardEntryMode}
                      onComplete={() => undefined}
                    />
                  </div>
                </motion.div>
              ) : (expeditionScreen === 'history' || expeditionScreen === 'history-level-result') ? (
                <motion.div
                  key="expedition-history"
                  initial={{ x: '100%', opacity: 0.6 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: '100%', opacity: 0.6 }}
                  transition={{ type: 'spring', damping: 28, stiffness: 280 }}
                  className="absolute inset-0"
                >
                  <ExpeditionPlanHistoryPage
                    onBack={() => setExpeditionScreen('main')}
                    onReviewLevel={(record, index, title) => {
                      setHistoryReviewRecord(record);
                      setHistorySelectedLevel({ index, title });
                      setExpeditionScreen('history-level-result');
                    }}
                  />
                  <AnimatePresence>
                    {expeditionScreen === 'history-level-result' &&
                    historyReviewRecord &&
                    historySelectedLevel ? (
                      <motion.div
                        key={`history-level-${historyReviewRecord.id}-${historySelectedLevel.index}`}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 12 }}
                        className="absolute inset-0 z-40 bg-white"
                      >
                        <UniversalQuizResult
                          reviewMode
                          initialData={buildHistoryLevelQuizResult(
                            historyReviewRecord,
                            historySelectedLevel.index,
                            historySelectedLevel.title
                          )}
                          onClose={() => {
                            setHistorySelectedLevel(null);
                            setExpeditionScreen('history');
                          }}
                        />
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </motion.div>
              ) : expeditionScreen === 'path' && expeditionPlan ? (
                <ExpeditionPathPage
                  key="expedition-path"
                  plan={expeditionPlan}
                  activeSubject={activeSubject}
                  learningSessionSignal={learningSessionSignal}
                  completedCount={expeditionCompletedCount}
                  planStatus={expeditionPlanStatus}
                  onCompletedCountChange={setExpeditionCompletedCount}
                  onPlanStatusChange={setExpeditionPlanStatus}
                  onBack={() => setExpeditionScreen('main')}
                  onStartLevel={onStartLevel}
                  onNewPlan={handleNewExpeditionPlan}
                  onExitPlan={handleExitExpeditionPlan}
                  onReturnHome={onReturnHome}
                  mapOptions={(() => {
                    const titles = resolvePlanLevelTitles(expeditionPlan);
                    return {
                      totalLevels: titles.length || Math.max(1, expeditionPlan.duration * 7),
                      titles,
                    };
                  })()}
                  onExtendPlan={({ levelTitles, selectedIds }) => {
                    setExpeditionPlan((prev) =>
                      prev
                        ? {
                            ...prev,
                            levelTitles,
                            selectedIds,
                            selectedLabels: levelTitles,
                            coverage: `${prev.textbook ? `${prev.textbook} · ` : ''}${levelTitles.slice(0, 3).join('、')} · ${levelTitles.length} ${prev.selectionMode === 'chapter' ? '个章节' : '个知识点'}`,
                          }
                        : prev
                    );
                  }}
                  onFinishEarly={() => {
                    setExpeditionPlan((prev) => (prev ? { ...prev, continuePromptHandled: true } : prev));
                    setExpeditionPlanStatus('completed');
                    if (expeditionPlan) {
                      addExpeditionPlanHistory(
                        { ...expeditionPlan, continuePromptHandled: true },
                        activeSubject,
                        expeditionCompletedCount
                      );
                    }
                  }}
                />
              ) : (
                <motion.div
                  key="expedition-main"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar relative scroll-smooth z-0 pt-0"
                  ref={scrollContainerRef}
                >
                  {!expeditionPlan ? (
                    <div className="min-h-full w-full flex items-center justify-center">
                      <LumiExpeditionWizard
                        key={`wizard-${wizardEntryMode}-${expeditionSimScenario}-${activeSubject}-${currentTextbook}`}
                        subject={activeSubject}
                        textbook={currentTextbook}
                        entryMode={wizardEntryMode}
                        onComplete={(plan) => {
                          setWizardEntryMode('default');
                          setTimeout(() => {
                            handleEnterExpeditionPath(buildExpeditionPlan(plan, activeSubject));
                          }, 300);
                        }}
                      />
                    </div>
                  ) : (
                    <div className="min-h-full w-full flex items-center justify-center px-6 py-8">
                      <ExpeditionActivePlanCard
                        plan={expeditionPlan}
                        completedCount={expeditionCompletedCount}
                        planStatus={expeditionPlanStatus}
                        onViewPath={() => setExpeditionScreen('path')}
                        onContinue={handleContinueExpedition}
                      />
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </>
      ) : (
          /* --- UNIVERSE MODE (Step 4 Integration) --- */
          <div className="flex-1 w-full relative overflow-hidden bg-[#EEF1FF]">
              {!compactHome ? (
              <TopBarController
                expeditionPlan={expeditionPlan}
                activeSubject={activeSubject}
                currentGrade={currentGrade}
                currentTextbook={currentTextbook}
                stageConfig={stageConfig}
                onOpenSyllabus={() => {}}
                mode='pro'
                onModeChange={(m) => setMapMode(m)}
            />
              ) : null}
              
              <UniverseContainer 
                subject={activeSubject}
                currentGrade={currentGrade}
                currentTextbook={currentTextbook}
                onOpenQuestionTraining={onOpenQuestionTraining}
                compactHome={compactHome}
                onBack={compactHome ? onBackFromCompact : () => setMapMode('sync')}
                onLearningModuleSubpageChange={(open) =>
                  onExpeditionScreenChange?.(open ? 'learning-module' : 'main')
                }
                onOpenVideo={(module, playlist, options) => {
                  setTextbookVideoReturnHome(false);
                  setTextbookVideoPracticeAction({
                    label: options?.actionLabel ?? '一课一练',
                    mode: options?.practiceMode ?? 'practice',
                  });
                  setTextbookVideoReturnToPath(options?.fromLearningPath !== false);
                  setTextbookVideoPlaylist(playlist);
                  setTextbookCurrentVideoId(module.id);
                  setTextbookVideoTask({
                    id: `textbook-video-${module.id}`,
                    title: module.title,
                    subject: activeSubject,
                    completed: false,
                    durationMinutes: 15,
                    levelType: 'level',
                    quizType: 'mixed',
                  });
                  setExpeditionScreen('textbook-video');
                }}
                 onStartLevel={(nodeId, type) => {
                     // Translate Universe Action to Task
                     const newTask: Partial<Task> = {
                         id: nodeId,
                         title: 'Knowledge Node', // In a real app, find title from data
                         subject: activeSubject,
                         levelType: type === 'practice' ? 'practice' : 'level',
                         quizType: type === 'quiz' ? 'standard' : 'mixed',
                         durationMinutes: 15
                     };
                     
                     if (onStartLevel) {
                         onStartLevel(newTask);
                     }
                 }}
              />
          </div>
      )}

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

      <AnimatePresence>
        {showExpeditionExitConfirm && (
          <motion.div
            key="expedition-exit-confirm-main"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[80] flex items-center justify-center px-6 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setShowExpeditionExitConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 12 }}
              transition={{ type: 'spring', damping: 24, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xs bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 text-center"
            >
              <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center">
                <AlertTriangle size={26} className="text-rose-500" />
              </div>
              <h3 className="text-lg font-black text-slate-800">确定结束该学习计划？</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                结束后计划结束，未完成的关卡将清空，已获得的成就和进度会保留。
              </p>
              <div className="mt-6 flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={handleExitExpeditionPlan}
                  className="w-full py-3 rounded-2xl bg-rose-500 text-white text-sm font-black shadow-lg shadow-rose-500/25 hover:bg-rose-600 transition-colors"
                >
                  确认结束
                </button>
                <button
                  type="button"
                  onClick={() => setShowExpeditionExitConfirm(false)}
                  className="w-full py-3 rounded-2xl bg-slate-100 text-slate-600 text-sm font-bold hover:bg-slate-200 transition-colors"
                >
                  暂不结束
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SubjectMap;
