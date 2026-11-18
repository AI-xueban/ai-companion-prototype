import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Scroll, Sparkles, BarChart2, Trophy, Coins, SmilePlus, ChevronDown, Zap, Timer, Crown, Medal, TrendingUp, Activity, Clock, Rocket, AlertCircle, X, Star, ArrowUp, ChevronRight, ChevronLeft, Brain, Telescope, ArrowRight, Lock, Heart, BadgeCheck, PiggyBank, ClipboardCheck, BookOpen } from 'lucide-react';
import { TaskStream } from './TaskStream';
import { DiscoveryFullPage } from './DiscoveryFullPage';
import { StudentNotificationRail } from './StudentNotificationRail';
import { ThirdPartyAppRail } from './ThirdPartyAppRail';
import { ZhiyueHomeworkFlow } from './ZhiyueHomework/ZhiyueHomeworkFlow';
import { ArticleReader } from '../Learning/ArticleReader';
import bgFallback from '@/assets/AIfriend-v0.1-frame1.png';
import { DayPlan, Task, MoodOption, UserPersona } from '../../types';
import { StarlightLeague } from './StarlightLeague';
import { createLeagueDemo, evaluateLeague, weekWindow } from '../../services/starlightLeague';
import userAvatar from '@/assets/girl_v0.1-head.png';
import { applyStageDonation, getStageStudentLabel, isCharityCampaignRunning, useDonationStage, validateStageDonation } from '../../data/charityStage';
import { isJuniorGrade, type UiSchoolSystem } from '../../data/juniorDemoCatalog';
import { STUDENT_NOTIFICATION_DEMO, type StudentNotification } from '../../data/studentNotifications';
import { THIRD_PARTY_APPS, type ThirdPartyApp } from '../../data/thirdPartyApps';

import { AITutorLayer } from './AITutorLayer';
import { VoiceTranscriptionBubble } from './VoiceTranscriptionBubble';
import { AISolveCameraOverlay } from './AISolveCameraOverlay';
import { AISolveProcessingOverlay } from './AISolveProcessingOverlay';
import { QuestionPickerOverlay } from './QuestionPickerOverlay';
import {
  AISolveQuestion,
  flattenQuestionsFromShots,
  needsQuestionPicker,
} from '../../data/aiSolveMockData';
import { ResponsiveContainer, AreaChart, XAxis, Tooltip, Area } from 'recharts';

export type HomeRailTool = 'sync' | 'practice' | 'lesson-practice' | 'mistake';
type HomeRailEntry = {
  id: HomeRailTool;
  label: string;
  subtitle: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  borderColor: string;
  iconGradient: string;
  buttonShadow: string;
  iconShadow: string;
};

const JUNIOR_HOME_RAIL: HomeRailEntry[] = [
  {
    id: 'sync',
    label: '同步课堂',
    subtitle: '名师精讲，教材同步',
    Icon: BookOpen,
    borderColor: '#E8D4FF',
    iconGradient: 'linear-gradient(135deg, #D4B4FF 0%, #9B6DFF 100%)',
    buttonShadow: '0 6px 18px rgba(155,109,255,0.16)',
    iconShadow: '0 3px 10px rgba(155,109,255,0.35)',
  },
  {
    id: 'practice',
    label: '精准练习',
    subtitle: '多维选练，精准匹配',
    Icon: ClipboardCheck,
    borderColor: '#B8F0E8',
    iconGradient: 'linear-gradient(135deg, #7EE0D0 0%, #2BB8A6 100%)',
    buttonShadow: '0 6px 18px rgba(43,184,166,0.16)',
    iconShadow: '0 3px 10px rgba(43,184,166,0.35)',
  },
];

const ELEMENTARY_HOME_RAIL: HomeRailEntry[] = [
  {
    id: 'sync',
    label: '同步课堂',
    subtitle: '名师精讲，教材同步',
    Icon: BookOpen,
    borderColor: '#E8D4FF',
    iconGradient: 'linear-gradient(135deg, #D4B4FF 0%, #9B6DFF 100%)',
    buttonShadow: '0 6px 18px rgba(155,109,255,0.16)',
    iconShadow: '0 3px 10px rgba(155,109,255,0.35)',
  },
  {
    id: 'lesson-practice',
    label: '一课一练',
    subtitle: '随堂巩固，课时专练',
    Icon: ClipboardCheck,
    borderColor: '#FFD7B5',
    iconGradient: 'linear-gradient(135deg, #FDBA74 0%, #F97316 100%)',
    buttonShadow: '0 6px 18px rgba(249,115,22,0.16)',
    iconShadow: '0 3px 10px rgba(249,115,22,0.35)',
  },
];

interface DashboardImmersiveProps {
  showMoreAppsEntry?: boolean;
  userName: string;
  userLevel?: number;
  nextLevelXp?: number;
  xp?: number;
  totalXp?: number;
  coins?: number;
  weeklyXp?: number;
  userPersona?: UserPersona;
  userGrade?: string;
  schoolSystem?: string;
  dayPlan: DayPlan | null;
  onStartQuiz: (task: Task) => void;
  onOpenStore?: () => void;
  onOpenRewardAccount?: () => void;
  onOpenMyExperience?: () => void;
  isRewardAccountOpen?: boolean;
  onCoinSpend?: (amount: number, title: string) => void;
  onOpenMood?: () => void;
  selectedMoods?: MoodOption[];
  onOpenCharity?: () => void;
  openLeagueSignal?: number;
  leagueSparse?: boolean;
  onCameraFlowOpenChange?: (open: boolean) => void;
  onTutorLayerOpenChange?: (open: boolean) => void;
  /** 消息抽屉打开时，由页面壳隐藏底部 Tab，保证其为当前页面最高层。 */
  onNotificationLayerOpenChange?: (open: boolean) => void;
  /** 万象视界全屏页打开时，由页面壳隐藏底部 Tab。 */
  onDiscoveryFullPageOpenChange?: (open: boolean) => void;
  worldLocked?: boolean;
  onOpenHomeTool?: (tool: HomeRailTool) => void;
  onGoStudy?: () => void;
}

export const DashboardImmersive: React.FC<DashboardImmersiveProps> = ({
  showMoreAppsEntry = true,
  userName,
  userLevel = 5,
  nextLevelXp = 1000,
  xp = 850,
  totalXp = 3200,
  coins = 850,
  dayPlan,
  onStartQuiz,
  onOpenStore,
  onOpenRewardAccount,
  onOpenMyExperience,
  isRewardAccountOpen = false,
  onCoinSpend,
  onOpenMood,
  selectedMoods = [],
  onOpenCharity,
  weeklyXp = 2100,
  userPersona = 'average',
  userGrade,
  schoolSystem = '六三制',
  openLeagueSignal = 0,
  leagueSparse = false,
  onCameraFlowOpenChange,
  onTutorLayerOpenChange,
  onNotificationLayerOpenChange,
  onDiscoveryFullPageOpenChange,
  worldLocked = false,
  onOpenHomeTool,
  onGoStudy,
}) => {


  const isNewbiePersona = userPersona === 'newbie';
  const isPreL1 = userLevel < 1;
  const isJuniorStudent = isJuniorGrade(userGrade || '', schoolSystem as UiSchoolSystem);
  const homeRightEntries = isJuniorStudent ? JUNIOR_HOME_RAIL : ELEMENTARY_HOME_RAIL;
  const [activePanel, setActivePanel] = useState<'tasks' | 'league' | 'stats' | 'tutor' | 'discovery_full' | null>(null);
  const [worldLockDialogOpen, setWorldLockDialogOpen] = useState(false);
  const [worldLockToast, setWorldLockToast] = useState(false);
  const [isThirdPartyOpen, setIsThirdPartyOpen] = useState(false);
  const [readingArticleId, setReadingArticleId] = useState<string | null>(null);
  const [readerHideNav, setReaderHideNav] = useState(false);
  const [fromVideoFeed, setFromVideoFeed] = useState(false);
  const resumeVideoFeedRef = React.useRef<(() => void) | null>(null);
  const [isCharityOpen, setIsCharityOpen] = useState(false);
  const [charityViewState, setCharityViewState] = useState<'OVERVIEW' | 'RECORDS' | 'CERTIFICATE'>('OVERVIEW');
  const [charityInput, setCharityInput] = useState(100);
  const [charityJustDonated, setCharityJustDonated] = useState(false);
  const [charityStageHint, setCharityStageHint] = useState('');
  const { activeStage: charityStage, progress: charityStageProgress } = useDonationStage();
  const isCharityRunning = isCharityCampaignRunning(charityStage);

  useEffect(() => {
    onTutorLayerOpenChange?.(activePanel === 'tutor');
    return () => onTutorLayerOpenChange?.(false);
  }, [activePanel, onTutorLayerOpenChange]);

  useEffect(() => {
    onDiscoveryFullPageOpenChange?.(activePanel === 'discovery_full');
    return () => onDiscoveryFullPageOpenChange?.(false);
  }, [activePanel, onDiscoveryFullPageOpenChange]);

  useEffect(() => {
    if (worldLocked && (activePanel === 'discovery_full' || readingArticleId)) setWorldLockDialogOpen(true);
    if (!worldLocked) setWorldLockDialogOpen(false);
  }, [worldLocked, activePanel, readingArticleId]);

  useEffect(() => {
    if (!worldLockToast) return;
    const timer = window.setTimeout(() => setWorldLockToast(false), 2500);
    return () => window.clearTimeout(timer);
  }, [worldLockToast]);

  const handleCharityDonate = () => {
    const stageCheck = validateStageDonation(charityInput);
    if (!stageCheck.ok) {
      setCharityStageHint(stageCheck.message ?? '当前无法捐赠');
      return;
    }
    if (charityInput > coins) {
      setCharityStageHint('金币不足，去完成任务');
      return;
    }
    if (!applyStageDonation(charityInput)) {
      setCharityStageHint('捐赠未成功，请稍后重试');
      return;
    }
    onCoinSpend?.(charityInput, '爱心大使捐赠');
    setCharityStageHint('');
    setCharityJustDonated(true);
    setCharityViewState('CERTIFICATE');
  };
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  useEffect(() => {
    onNotificationLayerOpenChange?.(isMessageOpen);
    return () => onNotificationLayerOpenChange?.(false);
  }, [isMessageOpen, onNotificationLayerOpenChange]);
  const notifications = STUDENT_NOTIFICATION_DEMO;
  const messageAttentionCount = notifications.filter(
    (item) => item.isUnread || item.isPersistentRisk,
  ).length;
  const handleMessageToggle = useCallback(() => {
    setIsMessageOpen((isOpen) => !isOpen);
  }, []);
  const xpToNextLevel = Math.max(0, nextLevelXp - xp);
  const currentLevelProgress = isPreL1 ? 0 : Math.min(100, (xp / nextLevelXp) * 100);

  useEffect(() => { if (openLeagueSignal > 0) setActivePanel('league'); }, [openLeagueSignal]);

  // --- AI 解题 / 拍照 State ---
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [cameraDefaultMode, setCameraDefaultMode] = useState<'ask' | 'mirror' | 'homework'>('mirror');
  const [isQuestionPickerOpen, setIsQuestionPickerOpen] = useState(false);
  const [isZhiyueOpen, setIsZhiyueOpen] = useState(false);
  const [capturedShotIds, setCapturedShotIds] = useState<string[]>([]);
  const [processingShotIds, setProcessingShotIds] = useState<string[] | null>(null);
  const processingShotIdsRef = useRef<string[]>([]);
  const [selectedSolveQuestion, setSelectedSolveQuestion] = useState<AISolveQuestion | null>(null);
  const cameraPurposeRef = useRef<'solve' | 'homework'>('solve');

  useEffect(() => {
    const cameraFlowOpen = isCameraOpen || processingShotIds !== null || isQuestionPickerOpen || isZhiyueOpen;
    onCameraFlowOpenChange?.(cameraFlowOpen);
    return () => onCameraFlowOpenChange?.(false);
  }, [isCameraOpen, isQuestionPickerOpen, isZhiyueOpen, onCameraFlowOpenChange, processingShotIds]);

  const handleGoStudy = () => {
    if (onGoStudy) {
      onGoStudy();
    } else {
      setActivePanel('tasks');
    }
  };

  // 模拟数据 (通常从 props 或 service 获取)
  const statsData = {
    weeklyXp,
    studyHours: 3.5,
    chartData: [
        { name: '一', xp: 300 }, { name: '二', xp: 450 }, { name: '三', xp: 200 },
        { name: '四', xp: 600 }, { name: '五', xp: 400 }, { name: '六', xp: 100 }, { name: '七', xp: 50 }
    ],
    // Mock user details
    focusScore: 85,
    streak: 14,
    radarData: [
        { subject: '逻辑', score: 85, fullMark: 100 },
        { subject: '记忆', score: 70, fullMark: 100 },
        { subject: '专注', score: 90, fullMark: 100 },
        { subject: '创造', score: 75, fullMark: 100 },
        { subject: '坚毅', score: 80, fullMark: 100 },
        { subject: '规划', score: 65, fullMark: 100 },
        { subject: '速度', score: 88, fullMark: 100 },
        { subject: '准确', score: 92, fullMark: 100 },
    ],
    weeklyTrend: [
        { day: 'Mon', xp: 1200 }, { day: 'Tue', xp: 1350 }, { day: 'Wed', xp: 1500 },
        { day: 'Thu', xp: 1800 }, { day: 'Fri', xp: 2100 }, { day: 'Sat', xp: 2300 }, { day: 'Sun', xp: 2450 }
    ]
  };

  const homeLeague = evaluateLeague(createLeagueDemo(userPersona === 'newbie' ? 'new' : leagueSparse ? 'solo' : 'normal', userName, weeklyXp, totalXp, userAvatar, weekWindow().id).members);
  const homeLeagueMe = homeLeague.rows.find(member => member.id === 'me')!;
  const handleCameraPress = () => {
    cameraPurposeRef.current = 'solve';
    setCameraDefaultMode('mirror');
    setIsCameraOpen(true);
  };

  const enterSolveFlow = (question: AISolveQuestion) => {
    setSelectedSolveQuestion(question);
    setIsQuestionPickerOpen(false);
    setCapturedShotIds([]);
    setActivePanel('tutor');
  };

  const handleSolveProcessingComplete = useCallback(() => {
    const shotIds = processingShotIdsRef.current;
    setCapturedShotIds(shotIds);
    const questions = flattenQuestionsFromShots(shotIds);

    if (needsQuestionPicker(shotIds)) {
      // 先挂载切题层，再关闭处理层，避免闪过主页
      setIsQuestionPickerOpen(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setProcessingShotIds(null);
        });
      });
    } else if (questions.length >= 1) {
      // 先挂载讲题层（仍在加载遮罩下方），再关闭遮罩，避免闪回首页
      enterSolveFlow(questions[0]);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setProcessingShotIds(null);
        });
      });
    }
  }, []);

  const handleSolveCameraConfirm = (shotIds: string[]) => {
    setIsCameraOpen(false);
    if (cameraPurposeRef.current === 'homework') return;
    processingShotIdsRef.current = shotIds;
    setProcessingShotIds(shotIds);
  };

  const handleQuestionPickerSelect = (question: AISolveQuestion) => {
    enterSolveFlow(question);
  };

  const handleOpenAISolve = () => {
    setActivePanel(null);
    cameraPurposeRef.current = 'solve';
    setCameraDefaultMode('mirror');
    setIsCameraOpen(true);
  };

  const handleOpenHomeworkGrade = () => {
    setActivePanel(null);
    setIsZhiyueOpen(true);
  };

  const togglePanel = (panel: 'tasks' | 'league' | 'discovery_full') => {
    // 如果当前在 tutor 模式，先退出
    if (activePanel === 'tutor') {
        setActivePanel(panel);
        return;
    }
    setActivePanel(activePanel === panel ? null : panel);
  };

  return (
    <div className="relative w-full h-full overflow-hidden font-sans select-none bg-slate-900 text-white">
      
      {/* ================= Layer 0: Scene Background ================= */}
      <div className="absolute inset-0 z-0">
        <img src={bgFallback} alt="小晤伴学角色" className="absolute inset-0 w-full h-full object-cover" />
        {import.meta.env.VITE_LUMI_IDLE_VIDEO_URL && (
          <video
            autoPlay
            muted
            loop
            playsInline
            poster={bgFallback}
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src={import.meta.env.VITE_LUMI_IDLE_VIDEO_URL} type="video/mp4" />
          </video>
        )}
      </div>

      {/* ================= Layer 2: HUD Interface ================= */}
      {/* 用户菜单打开时抬到 z-50，高于左侧工具栏 z-30，避免弹窗被挡住 */}
      <div className={`relative w-full h-full flex flex-col justify-between pointer-events-none overflow-hidden p-6 pt-6 pb-20 lg:px-8 lg:pt-6 ${
        isUserMenuOpen ? 'z-[50]' : 'z-20'
      }`}>
        
        {/* --- Top HUD --- */}
        <header className="flex justify-between items-start w-full max-w-5xl mx-auto pointer-events-auto">
           {/* Left: User & Mood */}
           <div className="flex items-center gap-3">
               {/* User + League fused pill */}
               <div className="relative z-[100]">
                   <div
                        className={`flex items-center gap-1 backdrop-blur-2xl border rounded-full p-1 pr-1.5 shadow-[0_4px_24px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.2)] ring-1 ring-white/10 transition-all duration-200
                            ${isUserMenuOpen || activePanel === 'league'
                                ? 'bg-white/20 border-white/40 shadow-[0_6px_28px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.3)]'
                                : 'bg-white/10 border-white/30 hover:bg-white/15 hover:border-white/35 hover:shadow-[0_6px_28px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.25)]'}
                        `}
                   >
                       <button
                            type="button"
                            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                            aria-label={`${userName}，等级 ${userLevel}`}
                            aria-expanded={isUserMenuOpen}
                            className="flex items-center gap-2.5 rounded-full pl-0 pr-2 py-0 cursor-pointer"
                       >
                           <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center shadow-lg ring-2 ring-white/20 bg-white/5">
                               <img
                                   src={userAvatar}
                                   alt={userName}
                                   className="w-full h-full object-cover"
                               />
                           </div>
                           <div className="flex flex-col items-start">
                               <span className={`text-xs font-bold tracking-wider ${isPreL1 ? 'text-white/40' : 'text-white/60'}`}>
                                   LV.{userLevel}
                               </span>
                               <div className="w-14 h-1.5 bg-white/20 rounded-full overflow-hidden mt-0.5">
                                   <div
                                        className={`h-full transition-all duration-500 ${isPreL1 ? 'bg-white/25' : 'bg-brand shadow-[0_0_8px_rgba(108,93,211,0.5)]'}`}
                                        style={{ width: `${currentLevelProgress}%` }}
                                   ></div>
                               </div>
                           </div>
                       </button>

                       <div className="w-px h-7 bg-white/20 mx-0.5" />

                       <button type="button" onClick={() => { setIsUserMenuOpen(false); togglePanel('league'); }} aria-label="打开星光学榜" aria-pressed={activePanel === 'league'} className="flex items-center gap-2 rounded-full px-3 py-2 hover:bg-amber-400/20">
                         <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-400 text-lg">🏆</span>
                         <span className="flex flex-col items-start"><span className="text-[11px] font-bold text-amber-100">星光学榜</span><span className="text-[12px] font-black text-white">{userPersona === 'newbie' ? '下周参赛' : leagueSparse ? '个人周成绩' : `第 ${homeLeagueMe.rank} 名`}</span></span>
                       </button>
                   </div>

                   {/* User Menu Popover */}
                   <AnimatePresence>
                        {isUserMenuOpen && (
                            <>
                                <div 
                                    className="fixed inset-0 z-[60] bg-transparent"
                                    onClick={() => setIsUserMenuOpen(false)}
                                />
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute top-full left-0 mt-2 w-72 origin-top-left bg-[#1a1f2e]/95 backdrop-blur-2xl border border-white/20 rounded-2xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)] z-[70] flex flex-col gap-4 ring-1 ring-white/5"
                                >
                                    {/* Arrow Pointer */}
                                    <div className="absolute left-8 -top-2 w-4 h-4 bg-[#1a1f2e]/95 border-l border-t border-white/20 rotate-45 transform backdrop-blur-2xl" />

                                    {/* 1. Identity Header */}
                                    <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                                        <div className="w-14 h-14 rounded-full p-0.5 border border-white/30 shadow-[0_0_20px_rgba(108,93,211,0.3)] bg-white/5">
                                            <img 
                                                src={userAvatar} 
                                                alt={userName} 
                                                className="w-full h-full object-cover rounded-full"
                                            />
                                        </div>
                                        <div>
                                            <h3 className="text-white font-bold text-lg tracking-wide">{userName}</h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${
                                                    isPreL1
                                                        ? 'bg-white/10 text-white/45 border-white/15'
                                                        : 'bg-brand/20 text-[#a78bfa] border-brand/30'
                                                }`}>
                                                    LV.{userLevel}
                                                </span>
                                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-white/60 border border-white/10">
                                                    七年级
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 2. Level Progress */}
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex justify-between items-end text-xs mb-0.5">
                                            <span className="text-white/50 font-bold">{isPreL1 ? '成长等级' : '距离下一级'}</span>
                                            <span className="text-white font-black">{isPreL1 ? `${xp}/${nextLevelXp} XP` : `${xpToNextLevel} XP`}</span>
                                        </div>
                                        <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden shadow-inner">
                                            <div 
                                                className={`h-full rounded-full transition-all duration-1000 ${isPreL1 ? 'bg-white/20' : 'bg-gradient-to-r from-brand to-purple-400 shadow-[0_0_10px_rgba(167,139,250,0.5)]'}`}
                                                style={{ width: `${currentLevelProgress}%` }}
                                            />
                                        </div>
                                        <p className="text-[10px] text-white/40 text-right mt-1 font-medium">
                                            {isPreL1 ? '积累经验升至 Lv.1，参与星光学榜' : `当前进度 ${xp} / ${nextLevelXp}`}
                                        </p>
                                    </div>

                                    {/* 3. Daily Stats */}
                                    <div className="bg-white/5 rounded-xl p-3 flex items-center justify-between border border-white/5">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 border border-green-500/30">
                                                <TrendingUp size={14} strokeWidth={3} />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-white/50 font-bold">今日获取</span>
                                                <span className="text-xs font-black text-white">+{xp} XP</span>
                                            </div>
                                        </div>
                                        {/* Decorative Arrow */}
                                        <div className="text-green-400 font-bold text-xs animate-pulse">
                                            ▲
                                        </div>
                                    </div>

                                </motion.div>
                            </>
                        )}
                   </AnimatePresence>
               </div>

               {/* Mood Pill */}
               <div className="relative">
                   <button 
                        id="guide-mood-checkin"
                        onClick={onOpenMood}
                        aria-label={selectedMoods.length === 0 ? '记录心情' : `修改心情，已记录 ${selectedMoods.length} 项`}
                        className={`group flex items-center gap-1.5 backdrop-blur-2xl rounded-full pl-3 pr-2.5 py-1.5 transition-all duration-200 active:scale-95 shadow-[0_4px_24px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.2)] ring-1 ring-white/10 ${
                            selectedMoods.length === 0 
                                ? 'bg-white/10 border-white/25 hover:bg-white/15 hover:border-white/35 border-dashed'
                                : 'bg-white/10 border-white/30 hover:bg-white/15 hover:border-white/35 border-solid'
                        }`}
                   >
                       {selectedMoods.length === 0 ? (
                           <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100">
                               <SmilePlus size={18} className="text-white" />
                               <span className="text-sm font-bold">记录心情</span>
                           </div>
                       ) : (
                           <div className="flex items-center -space-x-1 px-1">
                               {selectedMoods.map((m, i) => (
                                   <span key={m.value} className="text-lg leading-none filter drop-shadow-sm relative z-[1]" style={{ zIndex: selectedMoods.length - i }}>
                                       {m.icon}
                                   </span>
                               ))}
                           </div>
                       )}
                       <ChevronDown size={14} className="text-white/60 group-hover:text-white transition-colors" />
                   </button>
               </div>
           </div>

           {/* Right: Stats & Notification */}
           <div className="flex items-center gap-3">
               <button 
                    onClick={onOpenRewardAccount || onOpenStore}
                    aria-label={`查看我的金币，当前 ${coins} 金币`}
                    className="h-9 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 select-none backdrop-blur-2xl bg-white/10 border border-white/30 pl-3 pr-3 gap-2 shadow-[0_4px_24px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.2)] ring-1 ring-white/10 hover:bg-white/15 hover:border-white/35 hover:shadow-[0_6px_28px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.25)]"
                >
                   <div className="relative">
                       <div className="absolute inset-0 bg-yellow-400 blur-[8px] opacity-40 animate-pulse"></div>
                       <Coins size={16} className="text-yellow-400 relative z-10" strokeWidth={2.5} />
                   </div>
                   <span className="text-xs font-black text-yellow-100 tracking-tight">{coins}</span>
               </button>

               <button
                    onClick={() => {
                        setActivePanel(null);
                        onOpenCharity?.();
                    }}
                    aria-label={`打开爱心公益，当前${isCharityRunning ? '进行中' : '已结束'}`}
                    className={`h-9 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 select-none backdrop-blur-2xl pl-3 pr-3 gap-2 ring-1 ring-white/10 ${
                      isCharityRunning
                        ? 'bg-rose-500/15 border border-rose-300/30 shadow-[0_4px_24px_rgba(244,63,94,0.24),inset_0_1px_0_rgba(255,255,255,0.2)] hover:bg-rose-500/25 hover:border-rose-200/45 hover:shadow-[0_6px_28px_rgba(244,63,94,0.32),inset_0_1px_0_rgba(255,255,255,0.25)]'
                        : 'bg-white/8 border border-white/15 shadow-[0_4px_24px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.12)] hover:bg-white/12 hover:border-white/25'
                    }`}
                >
                   <div className="relative">
                       {isCharityRunning ? (
                         <div className="absolute inset-0 bg-rose-400 blur-[8px] opacity-40 animate-pulse" />
                       ) : null}
                       <Heart
                         size={16}
                         className={`relative z-10 ${isCharityRunning ? 'text-rose-200' : 'text-white/35'}`}
                         fill="currentColor"
                         strokeWidth={2.5}
                       />
                   </div>
                   <div className="flex flex-col items-start leading-none gap-0.5">
                       <span className={`text-[10px] font-black tracking-tight ${isCharityRunning ? 'text-rose-100' : 'text-white/55'}`}>爱心</span>
                       <span className={`text-[9px] font-bold ${isCharityRunning ? 'text-emerald-200' : 'text-white/40'}`}>
                         {isCharityRunning ? '进行中' : '已结束'}
                       </span>
                   </div>
               </button>
               
               <div className="relative">
                   <button
                       type="button"
                       onClick={handleMessageToggle}
                       aria-label={messageAttentionCount > 0 ? `查看消息，${messageAttentionCount} 条需关注` : '查看消息'}
                       aria-expanded={isMessageOpen}
                       aria-controls="student-notification-rail"
                       className={`relative z-50 flex h-12 w-12 cursor-pointer touch-manipulation items-center justify-center rounded-full border border-white/30 bg-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.2)] ring-1 ring-white/10 backdrop-blur-2xl transition-all duration-200 hover:border-white/35 hover:bg-white/15 hover:shadow-[0_6px_28px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.25)] active:scale-95 group ${isMessageOpen ? 'bg-white/20 border-white/40 shadow-glow-sm' : ''}`}
                   >
                       <Bell size={20} className="text-white/80 group-hover:text-white" />
                       {messageAttentionCount > 0 && (
                         <span className="pointer-events-none absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full border border-white/80 bg-red-500 px-1 text-[9px] font-bold leading-none text-white shadow-[0_0_5px_rgba(239,68,68,0.5)]">
                           {messageAttentionCount > 9 ? '9+' : messageAttentionCount}
                         </span>
                       )}
                   </button>
               </div>
           </div>
        </header>

        {/* --- Bottom: iOS Style Voice Interaction --- */}
        {/* 侧栏打开时隐藏，避免叠在联赛/任务面板上 */}
        {activePanel !== 'league' && activePanel !== 'tasks' && activePanel !== 'stats' && (
        <div className="flex flex-col items-center pb-0 pointer-events-auto gap-4 relative z-20">
            <VoiceTranscriptionBubble 
              onCameraPress={handleCameraPress}
            />
        </div>
        )}

      </div>

      {/* ================= Layer 3: Context Panels OR Tutor Layer ================= */}
      <AnimatePresence>
          {isCharityOpen && (
              <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-[260] bg-[#FFF7FA]"
              >
                  <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      transition={{ type: 'spring', damping: 24, stiffness: 260 }}
                      className="w-full h-full bg-[#FFF7FA] overflow-hidden flex flex-col relative text-slate-900"
                  >
                      <div className="absolute inset-0 pointer-events-none overflow-hidden">
                          <motion.div
                              animate={{ y: [0, -18, 0], x: [0, 8, 0] }}
                              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                              className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-rose-500/20 blur-3xl"
                          />
                          <motion.div
                              animate={{ y: [0, 22, 0], x: [0, -10, 0] }}
                              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                              className="absolute top-24 right-0 w-48 h-48 rounded-full bg-pink-500/10 blur-3xl"
                          />
                      </div>

                      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5 relative z-10">
                          <div>
                              <p className="text-[10px] uppercase tracking-[0.3em] text-rose-300 font-black">公益爱心大使</p>
                              <h2 className="text-lg font-black text-white mt-1">爱心公益</h2>
                          </div>
                          <button onClick={() => setIsCharityOpen(false)} className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center active:scale-95 transition-transform">
                              <X size={18} />
                          </button>
                      </div>

                      <div className="flex items-center gap-2 px-4 md:px-6 py-3 overflow-x-auto no-scrollbar bg-white/5 border-b border-white/5 relative z-10">
                          {[
                              { key: 'OVERVIEW', label: '总览', icon: Heart },
                              { key: 'RECORDS', label: '记录', icon: Scroll },
                              { key: 'CERTIFICATE', label: '证书', icon: BadgeCheck },
                          ].map(tab => {
                              const Icon = tab.icon;
                              const active = charityViewState === tab.key;
                              return (
                                  <motion.button
                                      key={tab.key}
                                      whileTap={{ scale: 0.95 }}
                                      onClick={() => setCharityViewState(tab.key as any)}
                                      className={`shrink-0 px-4 py-2 rounded-full text-xs font-black flex items-center gap-1.5 border transition-all ${active ? 'bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/20' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'}`}
                                  >
                                      <Icon size={13} /> {tab.label}
                                  </motion.button>
                              );
                          })}
                      </div>

                      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 bg-slate-950 relative z-10">
                          <AnimatePresence mode="wait">
                              {charityViewState === 'OVERVIEW' && (
                                  <motion.div
                                      key="overview"
                                      initial={{ opacity: 0, y: 16 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, y: -16 }}
                                      transition={{ duration: 0.25 }}
                                      className="grid grid-cols-1 md:grid-cols-2 gap-4"
                                  >
                                      <motion.div
                                          whileHover={{ y: -3, scale: 1.01 }}
                                          className="rounded-[28px] p-5 bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-2xl shadow-rose-500/20 relative overflow-hidden"
                                      >
                                          <motion.div animate={{ rotate: 360 }} transition={{ duration: 18, repeat: Infinity, ease: 'linear' }} className="absolute -right-8 -top-8 w-28 h-28 rounded-full border border-white/10" />
                                          <p className="text-[10px] uppercase tracking-[0.25em] font-black text-rose-100">学习金币兑爱心</p>
                                          <h3 className="text-2xl font-black mt-2">公益爱心大使</h3>
                                          <p className="text-rose-50/90 text-sm leading-relaxed mt-3">学习即行善，学生自愿将学习金币转化为爱心助学基金，参与公益也能收获荣誉。</p>
                                          {charityStage && charityStageProgress ? (
                                              <div className="mt-4 rounded-2xl bg-white/10 border border-white/15 p-3 backdrop-blur-sm">
                                                  <div className="flex justify-between text-[10px] text-rose-100/90 font-bold mb-2">
                                                      <span>{getStageStudentLabel(charityStage)}</span>
                                                      <span>{charityStageProgress.isFull ? '已满' : `剩余 ${charityStageProgress.remaining.toLocaleString()} 金币`}</span>
                                                  </div>
                                                  <div className="h-1.5 rounded-full bg-white/15 overflow-hidden">
                                                      <div className={`h-full rounded-full ${charityStageProgress.isFull ? 'bg-amber-300' : 'bg-white'}`} style={{ width: `${charityStageProgress.percent}%` }} />
                                                  </div>
                                              </div>
                                          ) : null}
                                          <div className="grid grid-cols-2 gap-3 mt-5">
                                              <div className="bg-white/15 rounded-2xl p-3 backdrop-blur-sm">
                                                  <p className="text-[10px] text-rose-100/80">可捐赠金币</p>
                                                  <p className="text-xl font-black mt-1">{coins}</p>
                                              </div>
                                              <div className="bg-white/15 rounded-2xl p-3 backdrop-blur-sm">
                                                  <p className="text-[10px] text-rose-100/80">本次点亮</p>
                                                  <p className="text-xl font-black mt-1">{charityInput}</p>
                                              </div>
                                          </div>
                                          <div className="mt-5 rounded-3xl bg-white/15 border border-white/20 p-3 backdrop-blur-sm">
                                              <div className="flex items-center justify-between gap-2 mb-3">
                                                  {[50, 100, 200, 500].map(amount => {
                                                      const overBalance = amount > coins;
                                                      const overStage = charityStageProgress ? amount > charityStageProgress.remaining : false;
                                                      const disabled = overBalance || overStage || charityStageProgress?.isFull;
                                                      return (
                                                      <motion.button
                                                          key={amount}
                                                          whileTap={!disabled ? { scale: 0.92 } : undefined}
                                                          disabled={disabled}
                                                          onClick={() => { setCharityInput(amount); setCharityStageHint(''); }}
                                                          className={`flex-1 h-10 rounded-2xl text-xs font-black border transition-all ${charityInput === amount && !disabled ? 'bg-white text-rose-600 border-white shadow-lg' : disabled ? 'bg-white/10 text-white/35 border-white/10 grayscale' : 'bg-white/10 text-white border-white/15'}`}
                                                      >
                                                          {amount}
                                                      </motion.button>
                                                      );
                                                  })}
                                              </div>
                                              <motion.button
                                                  whileTap={!charityStageProgress?.isFull && charityInput <= coins ? { scale: 0.96 } : undefined}
                                                  disabled={charityStageProgress?.isFull || charityInput > coins || (charityStageProgress ? charityInput > charityStageProgress.remaining : false)}
                                                  onClick={handleCharityDonate}
                                                  className={`w-full py-3.5 rounded-2xl font-black shadow-xl flex items-center justify-center gap-2 ${charityStageProgress?.isFull ? 'bg-white/20 text-white/45' : charityInput <= coins ? 'bg-white text-rose-600' : 'bg-white/20 text-white/45'}`}
                                              >
                                                  <Heart size={16} fill="currentColor" /> {charityStageProgress?.isFull ? '本阶段已满，感谢参与' : charityInput <= coins ? '一键点亮爱心' : '金币不足，去完成任务'}
                                              </motion.button>
                                              {charityStageHint ? <p className="text-[10px] text-amber-200 text-center mt-2 font-bold">{charityStageHint}</p> : null}
                                              <p className="text-[10px] text-rose-50/80 text-center mt-2 font-bold">小小金币汇入爱心池，一起把善意慢慢传出去</p>
                                          </div>
                                      </motion.div>
                                      <div className="grid gap-4">
                                          <motion.div whileHover={{ y: -2 }} className="rounded-[28px] p-5 bg-white/5 border border-white/10 text-white">
                                              <div className="flex items-center justify-between mb-3"><p className="font-black">爱心池总览</p><PiggyBank size={18} className="text-rose-300" /></div>
                                              <div className="grid grid-cols-2 gap-3 text-sm">
                                                  <div><p className="text-white/40 text-[10px]">累计捐赠金币</p><p className="font-black text-lg">128,800</p></div>
                                                  <div><p className="text-white/40 text-[10px]">参与人数</p><p className="font-black text-lg">3,642</p></div>
                                                  <div><p className="text-white/40 text-[10px]">企业配捐</p><p className="font-black text-lg">¥12,880</p></div>
                                                  <div><p className="text-white/40 text-[10px]">爱心池余额</p><p className="font-black text-lg">¥28,600</p></div>
                                              </div>
                                          </motion.div>
                                          <motion.div whileHover={{ y: -2 }} className="rounded-[28px] p-5 bg-white/5 border border-white/10 text-white">
                                              <p className="font-black mb-2">爱心大使荣誉</p>
                                              <div className="flex items-center gap-3 flex-wrap">
                                                  <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-200 text-xs font-black">爱心小星星</span>
                                                  <span className="px-3 py-1 rounded-full bg-sky-500/20 text-sky-200 text-xs font-black">爱心小天使</span>
                                                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs font-black">爱心大使</span>
                                              </div>
                                          </motion.div>
                                      </div>
                                  </motion.div>
                              )}
                              {charityViewState === 'RECORDS' && (
                                  <motion.div
                                      key="records"
                                      initial={{ opacity: 0, y: 16 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, y: -16 }}
                                      className="space-y-3 max-w-2xl mx-auto text-white"
                                  >
                                      {[
                                          { date: '2026-06-03 19:42', points: 300, amount: 3 },
                                          { date: '2026-06-05 20:18', points: 100, amount: 1 },
                                          { date: '2026-06-09 18:06', points: charityInput, amount: charityInput / 100 },
                                      ].map((record, index) => (
                                          <motion.div key={`${record.date}-${index}`} whileHover={{ x: 4 }} className="rounded-[24px] p-4 bg-white/5 border border-white/10">
                                              <div className="flex items-start justify-between gap-4">
                                                  <div>
                                                      <p className="text-[10px] text-white/40 font-bold mb-1">捐赠时间</p>
                                                      <p className="font-black text-white">{record.date}</p>
                                                  </div>
                                                  <div className="text-right">
                                                      <p className="text-[10px] text-white/40 font-bold mb-1">折算金额</p>
                                                      <p className="font-black text-rose-200">¥{record.amount.toFixed(2)}</p>
                                                  </div>
                                              </div>
                                              <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                                                  <span className="text-xs text-white/45 font-bold">捐赠金币</span>
                                                  <span className="text-lg font-black text-white">{record.points} 金币</span>
                                              </div>
                                          </motion.div>
                                      ))}
                                  </motion.div>
                              )}
                              {charityViewState === 'CERTIFICATE' && (
                                  <motion.div
                                      key="certificate"
                                      initial={{ opacity: 0, y: 16, scale: 0.98 }}
                                      animate={{ opacity: 1, y: 0, scale: 1 }}
                                      exit={{ opacity: 0, y: -16, scale: 0.98 }}
                                      className="max-w-2xl mx-auto rounded-[32px] p-8 bg-gradient-to-br from-rose-50 to-white text-slate-900 border border-rose-100 shadow-2xl relative overflow-hidden"
                                  >
                                      {charityJustDonated && (
                                          <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                              {[0, 1, 2, 3, 4, 5].map(i => (
                                                  <motion.div
                                                      key={i}
                                                      initial={{ opacity: 0, y: 70, scale: 0.5 }}
                                                      animate={{ opacity: [0, 1, 0], y: -180, scale: [0.5, 1.1, 0.8], rotate: i % 2 ? 18 : -18 }}
                                                      transition={{ duration: 1.8, delay: i * 0.12, ease: 'easeOut' }}
                                                      className="absolute bottom-10 text-rose-400"
                                                      style={{ left: `${16 + i * 13}%` }}
                                                  >
                                                      <Heart size={18 + i * 2} fill="currentColor" />
                                                  </motion.div>
                                              ))}
                                          </div>
                                      )}
                                      <motion.div initial={{ scale: 0.6, rotate: -8 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', damping: 12, stiffness: 180 }} className="w-20 h-20 mx-auto rounded-[28px] bg-rose-500 text-white flex items-center justify-center shadow-2xl shadow-rose-300/50 mb-5">
                                          <Heart size={36} fill="currentColor" />
                                      </motion.div>
                                      <p className="text-center text-rose-500 font-black tracking-[0.2em] text-xs">{charityJustDonated ? '点亮成功' : '爱心捐赠证书'}</p>
                                      <h3 className="text-center text-2xl font-black mt-3">你为爱心池添了一点光</h3>
                                      <p className="text-center mt-4 leading-relaxed text-slate-600">这是一份小小的助力，会和更多同学的心意一起汇聚起来。谢谢你的参与。</p>
                                      <div className="mt-6 rounded-3xl border-2 border-dashed border-rose-200 p-6 text-center bg-white/70">
                                          <p className="text-sm font-bold">本次点亮：{charityInput} 金币</p>
                                          <p className="text-sm mt-2">折算爱心值：¥{(charityInput / 100).toFixed(2)}</p>
                                          <p className="text-sm mt-2">日期：2026-06-09</p>
                                      </div>
                                      <div className="mt-5 grid grid-cols-2 gap-3">
                                          <motion.button whileTap={{ scale: 0.96 }} onClick={() => setCharityViewState('RECORDS')} className="py-3 rounded-2xl bg-rose-50 text-rose-600 font-black border border-rose-100">查看爱心记录</motion.button>
                                          <motion.button whileTap={{ scale: 0.96 }} onClick={() => { setCharityJustDonated(false); setCharityViewState('OVERVIEW'); }} className="py-3 rounded-2xl bg-rose-500 text-white font-black shadow-lg shadow-rose-200">继续点亮</motion.button>
                                      </div>
                                  </motion.div>
                              )}
                          </AnimatePresence>
                      </div>
                  </motion.div>
              </motion.div>
          )}
      </AnimatePresence>
      <AnimatePresence mode="wait">
          {/* 新增: AI Tutor Full Layer */}
          {activePanel === 'tutor' && (
              <AITutorLayer 
                  key="tutor-layer"
                  onClose={() => {
                    setActivePanel(null);
                    setSelectedSolveQuestion(null);
                  }}
                  question={selectedSolveQuestion}
              />
          )}

          {activePanel && activePanel !== 'tutor' && activePanel !== 'discovery_full' && activePanel !== 'league' && (
              <motion.div 
                  key={activePanel}
                  initial={{ opacity: 0, x: -50, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -50, scale: 0.95 }}
                  transition={{ type: "spring", damping: 25, stiffness: 280 }}
                  className="absolute left-28 w-full md:w-[400px] z-[45] flex flex-col top-24 bottom-24"
              >
                  <div className="flex-1 min-h-0 border border-white/15 rounded-[28px] shadow-[0_24px_80px_rgba(0,0,0,0.55)] overflow-hidden flex flex-col bg-slate-900/85 backdrop-blur-2xl">
                      
                      {/* Panel Header */}
                              <div className="flex items-center justify-between px-5 border-b border-white/8 shrink-0 py-4">
                                  <h2 className="text-sm font-black text-white flex items-center gap-2.5 tracking-tight">
                                      {activePanel === 'tasks' && <div className="p-1.5 bg-brand/20 rounded-lg"><Scroll size={16} className="text-brand-light" /></div>}
                                      <span className="opacity-95">
                                        {activePanel === 'tasks' ? '今日任务' : '万象视界'}
                                      </span>
                                  </h2>
                                  <button 
                                      onClick={() => setActivePanel(null)}
                                      className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center hover:bg-white/15 transition-all border border-white/10 active:scale-90 group"
                                  >
                                      <X size={14} className="text-white/50 group-hover:text-white transition-colors" />
                                  </button>
                              </div>
                      
                      <div className="flex-1 min-h-0 overflow-y-auto p-5 custom-scrollbar">
                          {activePanel === 'tasks' && (
                                  <div className="flex flex-col gap-5">
                                      {dayPlan ? (
                                      <div className="flex items-center justify-between px-1">
                                          <div className="flex items-center gap-2">
                                              <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">
                                                  Progress
                                              </span>
                                              <div className="flex items-center gap-1.5 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                                                  <span className="text-[10px] font-black text-brand-light">{dayPlan.tasks.filter(t => t.completed).length}</span>
                                                  <span className="text-[10px] font-black text-white/20">/</span>
                                                  <span className="text-[10px] font-black text-white/40">{dayPlan.tasks.length}</span>
                                              </div>
                                          </div>
                                      </div>
                                      ) : null}
                                      <TaskStream 
                                          plan={dayPlan} 
                                          onStartQuiz={onStartQuiz}
                                      />
                                  </div>
                          )}

                          {activePanel === 'stats' && (
                              <div className="space-y-6">
                                  {/* Top Analysis Card */}
                                  <div className="bg-white/5 rounded-3xl p-6 border border-white/5 relative overflow-hidden group">
                                      <div className="absolute top-0 right-0 p-8 opacity-5 -mr-4 -mt-4">
                                          <TrendingUp size={80} />
                                      </div>
                                      
                                      <div className="flex justify-between items-start mb-8 relative z-10">
                                          <div>
                                                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1 flex items-center gap-2">
                                                      本周数据 <TrendingUp size={10} className="text-blue-400" />
                                                  </p>
                                              <div className="flex items-baseline gap-2">
                                                  <h3 className="text-5xl font-black text-blue-400 tracking-tighter">{statsData.weeklyXp.toLocaleString()}</h3>
                                                  <span className="text-xs font-bold text-blue-400/60 uppercase">XP</span>
                                              </div>
                                          </div>
                                          <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400 border border-blue-500/20 shadow-lg shadow-blue-500/10">
                                              <Zap size={24} fill="currentColor" />
                                          </div>
                                      </div>

                                      {/* Enhanced Chart Visualization */}
                                      <div className="flex items-end justify-between h-28 gap-2 px-1 mb-8 relative z-10" style={{ paddingTop: '116px' }}>
                                          {statsData.chartData.map((d, i) => (
                                              <div key={i} className="flex-1 flex flex-col items-center gap-2 group/bar">
                                                  <div className="relative w-full flex flex-col justify-end h-full bg-white/5 rounded-t-xl overflow-visible">
                                                      <motion.div 
                                                          initial={{ height: 0 }}
                                                          animate={{ height: `${(d.xp / 600) * 100}%` }}
                                                          transition={{ duration: 0.8, ease: "backOut", delay: i * 0.05 }}
                                                          className={`w-full rounded-t-lg relative ${
                                                              i === 3 
                                                              ? 'bg-gradient-to-t from-blue-500 to-cyan-400 shadow-[0_0_20px_rgba(59,130,246,0.5)] z-20' 
                                                              : 'bg-blue-400/40 group-hover/bar:bg-blue-400/60 z-10'
                                                          }`}
                                                          style={i === 3 ? { marginTop: '67px' } : { paddingTop: '36px', paddingBottom: '36px' }}
                                                      />
                                                      {/* Tooltip Label - Force positioning with high z-index and absolute viewport positioning if needed */}
                                                      <div 
                                                          className={`absolute -top-8 left-1/2 -translate-x-1/2 bg-blue-500 text-[10px] font-black px-2 py-0.5 rounded-full shadow-[0_4px_10px_rgba(0,0,0,0.5)] transition-all duration-300 z-50 whitespace-nowrap border border-white/20 ${i === 3 ? 'opacity-100 scale-110' : 'opacity-0 group-hover/bar:opacity-100 scale-100'}`}
                                                          style={{ pointerEvents: 'none' }}
                                                      >
                                                          {d.xp} XP
                                                      </div>
                                                  </div>
                                                  <span className={`text-[8px] font-bold tracking-tighter ${i === 3 ? 'text-blue-400' : 'text-white/30'}`}>{d.name}</span>
                                              </div>
                                          ))}
                                      </div>

                                      <div className="h-px bg-white/5 w-full mb-6"></div>

                                      <div className="flex justify-between items-center">
                                          <div className="flex items-center gap-3">
                                              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/60 border border-white/5">
                                                  <Clock size={18} />
                                              </div>
                                              <div>
                                                  <p className="text-[9px] font-black text-white/40 tracking-widest">学习时长</p>
                                                  <p className="text-xl font-black text-white">{statsData.studyHours}<span className="text-xs font-normal text-white/40 ml-1">小时</span></p>
                                              </div>
                                          </div>
                                          <div className="flex gap-1">
                                              {[1, 2, 3, 4, 5].map((i) => (
                                                  <div key={i} className={`w-1.5 h-6 rounded-full ${i <= 3 ? 'bg-blue-400' : 'bg-white/10'}`}></div>
                                              ))}
                                          </div>
                                      </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                      <div className="bg-white/5 rounded-[32px] p-6 border border-white/5 group hover:bg-white/10 transition-colors">
                                          <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400 mb-3 border border-orange-500/20">
                                              <Activity size={16} />
                                          </div>
                                          <p className="text-[9px] font-black text-white/40 tracking-widest mb-1">专注得分</p>
                                          <p className="text-3xl font-black text-white">85</p>
                                      </div>
                                      <div className="bg-white/5 rounded-[32px] p-6 border border-white/5 group hover:bg-white/10 transition-colors">
                                          <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400 mb-3 border border-green-500/20">
                                              <Sparkles size={16} />
                                          </div>
                                          <p className="text-[9px] font-black text-white/40 tracking-widest mb-1">连续学习</p>
                                          <p className="text-3xl font-black text-white">{statsData.streak}<span className="text-xs font-normal text-white/40 ml-1">天</span></p>
                                      </div>
                                  </div>
                              </div>
                          )}

                      </div>
                  </div>
              </motion.div>
          )}
      </AnimatePresence>

      <ThirdPartyAppRail
        showEntry={showMoreAppsEntry && activePanel === null && !readingArticleId && !isCharityOpen && !isUserMenuOpen && !isMessageOpen && !isCameraOpen && processingShotIds === null && !isQuestionPickerOpen && !isZhiyueOpen}
        isOpen={isThirdPartyOpen}
        apps={THIRD_PARTY_APPS}
        onToggle={() => setIsThirdPartyOpen((open) => !open)}
        onClose={() => setIsThirdPartyOpen(false)}
        onOpenApp={(app: ThirdPartyApp) => {
          if (app.launchUrl) {
            window.location.href = app.launchUrl;
          } else {
            window.alert('即将打开' + app.name + '。接入平板原生能力后将通过包名 ' + (app.packageName || '—') + ' 启动应用。');
          }
        }}
      />

      {/* --- LEFT SIDEBAR: 独立层级（讲题页/联赛侧栏打开时隐藏，避免叠压） --- */}
      {activePanel !== 'tutor' && activePanel !== 'league' && (
      <div className="absolute left-4 top-0 bottom-16 flex flex-col justify-center gap-3.5 pointer-events-auto z-30">
        <button
          type="button"
          onClick={handleOpenHomeworkGrade}
          aria-label="智阅作业"
          className="group flex items-center gap-3 rounded-2xl border bg-white px-3 py-2.5 ring-1 ring-white transition-all duration-300 active:scale-[0.97]"
          style={{ borderColor: '#B8F0D4', boxShadow: '0 6px 18px rgba(16,185,129,0.14)' }}
        >
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
            style={{ background: 'linear-gradient(135deg, #6EE7B7 0%, #10B981 100%)', boxShadow: '0 3px 10px rgba(16,185,129,0.35)' }}
          >
            <ClipboardCheck size={22} className="text-white" />
          </span>
          <span className="pr-1 text-[14px] font-bold leading-none text-slate-800">智阅作业</span>
        </button>

        <button
          type="button"
          onClick={handleOpenAISolve}
          aria-label="灵镜讲题"
          className="group flex items-center gap-3 rounded-2xl border bg-white px-3 py-2.5 ring-1 ring-white transition-all duration-300 active:scale-[0.97]"
          style={{ borderColor: '#B8DEFF', boxShadow: '0 6px 18px rgba(91,168,255,0.14)' }}
        >
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
            style={{ background: 'linear-gradient(135deg, #8EC8FF 0%, #4A9EFF 100%)', boxShadow: '0 3px 10px rgba(74,158,255,0.35)' }}
          >
            <Brain size={22} className="text-white" />
          </span>
          <span className="pr-1 text-[14px] font-bold leading-none text-slate-800">灵镜讲题</span>
        </button>

        <button
          type="button"
          onClick={() => worldLocked ? setWorldLockToast(true) : togglePanel('discovery_full')}
          aria-label="打开万象视界"
          aria-pressed={activePanel === 'discovery_full'}
          className={`group flex items-center gap-3 rounded-2xl border bg-white px-3 py-2.5 ring-1 transition-all duration-300 active:scale-[0.97] ${
            activePanel === 'discovery_full' ? 'ring-[#FFE0D6]' : 'ring-white'
          }`}
          style={{
            borderColor: activePanel === 'discovery_full' ? '#FFAB91' : '#FFD5C8',
            boxShadow: '0 6px 18px rgba(255,143,107,0.14)',
          }}
        >
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
            style={{ background: 'linear-gradient(135deg, #FFB08A 0%, #FF7A59 100%)', boxShadow: '0 3px 10px rgba(255,122,89,0.35)' }}
          >
            <Telescope size={22} className="text-white" />
          </span>
          <span className="pr-1 text-[14px] font-bold leading-none text-slate-800">万象视界</span>
        </button>
      </div>
      )}

      {/* --- RIGHT SIDEBAR: 学段高频工具，跳转已有流程 --- */}
      {activePanel !== 'tutor' && !isMessageOpen && homeRightEntries.length > 0 && (
      <div className="pointer-events-none absolute right-4 top-0 bottom-16 z-30 flex w-max flex-col items-stretch justify-center gap-5">
        {homeRightEntries.map((entry) => {
          const Icon = entry.Icon;
          return (
            <button
              key={entry.id}
              type="button"
              aria-label={entry.label}
              onClick={() => onOpenHomeTool?.(entry.id)}
              className="pointer-events-auto group flex w-full flex-row-reverse items-center justify-between gap-3 rounded-2xl border bg-white px-3 py-2.5 ring-1 ring-white transition-all duration-300 active:scale-[0.97]"
              style={{ borderColor: entry.borderColor, boxShadow: entry.buttonShadow }}
            >
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                style={{ background: entry.iconGradient, boxShadow: entry.iconShadow }}
              >
                <Icon size={22} className="text-white" />
              </span>
              <span className="min-w-0 flex-1 pl-1 text-left leading-none">
                <span className="block text-[14px] font-bold text-slate-800">{entry.label}</span>
                <span className="mt-1 block text-[10px] font-medium leading-tight text-slate-400">{entry.subtitle}</span>
              </span>
            </button>
          );
        })}
      </div>
      )}

      <StudentNotificationRail
        isOpen={isMessageOpen}
        items={notifications}
        onClose={() => setIsMessageOpen(false)}
        onAction={(action) => {
          setIsMessageOpen(false);
          onOpenHomeTool?.(action);
        }}
      />

      <AnimatePresence>
        {isZhiyueOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-0 z-[360] bg-[#14102e]"
          >
            <ZhiyueHomeworkFlow onBack={() => setIsZhiyueOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= Layer 4: AI 解题拍照 & 切题 ================= */}
      <AISolveCameraOverlay
        open={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onConfirm={handleSolveCameraConfirm}
        maxPhotos={3}
        defaultMode={cameraDefaultMode}
      />

      <AISolveProcessingOverlay
        open={processingShotIds !== null}
        shotIds={processingShotIds ?? []}
        onComplete={handleSolveProcessingComplete}
      />

      <QuestionPickerOverlay
        open={isQuestionPickerOpen}
        shotIds={capturedShotIds}
        onClose={() => {
          setIsQuestionPickerOpen(false);
          setCapturedShotIds([]);
        }}
        onSelect={handleQuestionPickerSelect}
      />

      {/* ================= Layer 6: Full Discovery Center (Full Screen) ================= */}
      <AnimatePresence>
          {activePanel === 'discovery_full' && (
              <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="absolute inset-0 z-[150] bg-slate-50"
              >
                  <DiscoveryFullPage 
                      onBack={() => setActivePanel(null)}
                      onArticleClick={(id, options) => {
                        setReaderHideNav(!!options?.hideNav);
                        resumeVideoFeedRef.current = options?.onResumeVideoFeed ?? null;
                        setFromVideoFeed(!!options?.onResumeVideoFeed);
                        setReadingArticleId(id);
                      }}
                  />
              </motion.div>
          )}
      </AnimatePresence>

      {/* ================= Layer 5: Article Reader Overlay (Full Screen) ================= */}
      <AnimatePresence>
          {readingArticleId && (
              <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className={`absolute inset-0 bg-white ${fromVideoFeed ? 'z-[350]' : 'z-[200]'}`}
              >
                  <ArticleReader 
                      articleId={readingArticleId}
                      hideArticleNav={readerHideNav}
                      onResumeVideoFeed={fromVideoFeed ? () => {
                        resumeVideoFeedRef.current?.();
                        resumeVideoFeedRef.current = null;
                        setFromVideoFeed(false);
                        setReadingArticleId(null);
                        setReaderHideNav(false);
                      } : undefined}
                      onExit={() => {
                        setReadingArticleId(null);
                        setReaderHideNav(false);
                        setFromVideoFeed(false);
                        resumeVideoFeedRef.current = null;
                      }}
                      onComplete={() => {
                          setReadingArticleId(null);
                          setReaderHideNav(false);
                          setFromVideoFeed(false);
                          resumeVideoFeedRef.current = null;
                      }}
                  />
              </motion.div>
          )}
      </AnimatePresence>

      <StarlightLeague open={activePanel === 'league'} onClose={() => setActivePanel(null)} userName={userName} userAvatar={userAvatar} weeklyXp={weeklyXp} totalXp={totalXp} grade={userGrade || '同年级'} persona={userPersona} solo={leagueSparse} suspended={isRewardAccountOpen} onExperience={onOpenMyExperience} onStudy={handleGoStudy} />
      {worldLockToast && !worldLockDialogOpen && (
        <div role="status" className="pointer-events-none absolute inset-x-0 top-24 z-[520] flex justify-center px-4">
          <div className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white shadow-xl">万象视界已被老师锁定，暂时无法进入</div>
        </div>
      )}
      {worldLockDialogOpen && (
        <div className="absolute inset-0 z-[550] flex items-center justify-center bg-slate-900/60 p-6">
          <div role="alertdialog" aria-modal="true" aria-labelledby="world-lock-dialog-title" aria-describedby="world-lock-dialog-description" className="w-full max-w-md rounded-2xl bg-white p-7 text-center text-slate-800 shadow-2xl">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600"><Lock size={27} /></span>
            <h2 id="world-lock-dialog-title" className="mt-4 text-xl font-bold">万象视界已被老师锁定</h2>
            <p id="world-lock-dialog-description" className="mt-2 text-sm leading-6 text-slate-600">现在无法继续浏览万象视界，请等待老师解锁。</p>
            <button type="button" className="mt-6 w-full rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white" onClick={() => {
              setWorldLockDialogOpen(false);
              setReadingArticleId(null);
              setFromVideoFeed(false);
              resumeVideoFeedRef.current = null;
              setActivePanel(null);
            }}>我知道了</button>
          </div>
        </div>
      )}

    </div>
  );
};
