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
import { LEAGUE_TIER_CONFIGS } from '../../services/geminiService';
import userAvatar from '@/assets/girl_v0.1-head.png';
import { applyStageDonation, getStageStudentLabel, isCharityCampaignRunning, useDonationStage, validateStageDonation } from '../../data/charityStage';
import { isJuniorGrade, type UiSchoolSystem } from '../../data/juniorDemoCatalog';
import { STUDENT_NOTIFICATION_DEMO } from '../../data/studentNotifications';
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

const LEAGUE_UNLOCK_HINTS = [
  { icon: BookOpen, text: '进入「同步课堂」跟学名师微课' },
  { icon: Brain, text: '一课一练、单元测试、精准练习' },
  { icon: Zap, text: '每次有效学习都会累计本周联赛 XP' },
] as const;

const LeagueLockedPanel: React.FC<{
  compact?: boolean;
  isNewbie?: boolean;
  onGoStudy: () => void;
}> = ({ compact, isNewbie, onGoStudy }) => (
  <motion.div
    initial={{ opacity: 0, y: compact ? 8 : 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    className={`relative overflow-hidden ${
      compact
        ? 'rounded-[32px] border border-amber-200/50 bg-gradient-to-b from-[#FFF8E1]/85 via-[#FFFDF0]/75 to-[#FFF3D0]/65 p-6'
        : 'rounded-[40px] border border-amber-200/50 bg-gradient-to-b from-[#FFF8E1]/80 via-[#FFFDF0]/70 to-[#FFF3D0]/55 p-10 min-h-[420px] flex flex-col items-center justify-center'
    }`}
  >
    {/* 星光背景 */}
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-200/40 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-32 h-32 bg-amber-100/50 rounded-full blur-2xl" />
      {[...Array(compact ? 6 : 10)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-amber-400 rounded-full"
          style={{
            left: `${12 + (i * 17) % 76}%`,
            top: `${8 + (i * 23) % 84}%`,
            opacity: 0.15 + (i % 3) * 0.15,
          }}
          animate={{ opacity: [0.2, 0.6, 0.2], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 2 + (i % 3), repeat: Infinity, delay: i * 0.3 }}
        />
      ))}
    </div>

    <div className={`relative z-10 w-full ${compact ? '' : 'max-w-sm text-center'}`}>
      {/* 图标 */}
      <div className={`relative mx-auto ${compact ? 'w-16 h-16 mb-4' : 'w-24 h-24 mb-6'}`}>
        <div className="absolute inset-0 bg-amber-300/30 rounded-full blur-xl animate-pulse" />
        <div
          className={`relative w-full h-full rounded-[28px] bg-gradient-to-br from-[#FFE566] via-[#FFC93A] to-[#FF9F2E] border border-amber-200 flex items-center justify-center shadow-[0_8px_24px_rgba(245,158,11,0.25)] ${
            compact ? 'rounded-2xl' : 'rounded-[28px]'
          }`}
        >
          <div className="relative">
            <Star size={compact ? 26 : 36} className="text-amber-500 fill-amber-300/50" />
            <Lock
              size={compact ? 12 : 14}
              className="absolute -bottom-1 -right-1 text-amber-600 bg-white rounded-full p-0.5 border border-amber-200"
            />
          </div>
        </div>
      </div>

      <p className={`font-black text-amber-600 uppercase tracking-[0.25em] mb-2 ${compact ? 'text-[9px]' : 'text-[10px]'}`}>
        星光学榜
      </p>
      <h3 className={`font-black text-slate-900 leading-snug mb-3 ${compact ? 'text-base' : 'text-xl'}`}>
        {isNewbie ? '完成第一次学习即可上榜' : '本周榜单待开启'}
      </h3>
      <p className={`text-slate-500 leading-relaxed ${compact ? 'text-xs mb-5' : 'text-sm mb-8'}`}>
        {isNewbie ? (
          <>
            学习获得经验值，即可解锁
            <span className="text-amber-700 font-bold"> 本周星光学榜 </span>
            ，与同段位的伙伴一起进步。
          </>
        ) : (
          <>
            新一周的星光探索已开启！
            <span className="text-amber-700 font-bold"> 学习获得经验值，解锁本周星光学榜。</span>
          </>
        )}
      </p>

      {/* 进度提示 */}
      <div
        className={`flex items-center justify-between rounded-2xl bg-white/70 border border-amber-200/60 mb-5 ${
          compact ? 'px-3 py-2.5' : 'px-4 py-3'
        }`}
      >
        <div className="flex items-center gap-2">
          <Zap size={compact ? 12 : 14} className="text-amber-500" fill="currentColor" />
          <span className={`text-slate-400 font-bold ${compact ? 'text-[10px]' : 'text-xs'}`}>本周联赛 XP</span>
        </div>
        <span className={`font-black text-slate-700 tabular-nums ${compact ? 'text-sm' : 'text-base'}`}>0</span>
      </div>

      <button
        type="button"
        onClick={onGoStudy}
        className={`group w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#FF9F2E] via-[#FF8A1A] to-[#FF7A1A] text-white font-black rounded-2xl shadow-[0_10px_28px_rgba(255,122,26,0.32)] hover:shadow-[0_14px_36px_rgba(255,122,26,0.42)] active:scale-[0.98] transition-all ${
          compact ? 'py-3 text-xs' : 'py-4 text-sm'
        }`}
      >
        去学习获取经验
        <ArrowRight size={compact ? 14 : 16} className="group-hover:translate-x-0.5 transition-transform" />
      </button>

      {/* 底部参与指引 */}
      <div className={`mt-4 pt-4 border-t border-amber-200/60 ${compact ? '' : 'text-left'}`}>
        <p className={`font-black text-slate-400 uppercase tracking-wider mb-2.5 ${compact ? 'text-[9px]' : 'text-[10px]'}`}>
          怎样参与星光学榜？
        </p>
        <ul className={`space-y-2 ${compact ? '' : 'space-y-2.5'}`}>
          {(compact ? LEAGUE_UNLOCK_HINTS.slice(0, 2) : LEAGUE_UNLOCK_HINTS).map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-start gap-2">
              <div className={`shrink-0 rounded-lg bg-white/70 border border-amber-200/60 flex items-center justify-center ${compact ? 'w-5 h-5 mt-0.5' : 'w-6 h-6'}`}>
                <Icon size={compact ? 10 : 12} className="text-amber-500" />
              </div>
              <span className={`text-slate-500 leading-snug font-medium ${compact ? 'text-[10px]' : 'text-xs'}`}>
                {text}
              </span>
            </li>
          ))}
        </ul>
        {compact && (
          <p className="text-[9px] text-slate-400 mt-2.5 leading-relaxed">
            有效学习获得经验值后，本周榜单自动解锁。
          </p>
        )}
      </div>
    </div>
  </motion.div>
);

export type HomeRailTool = 'sync' | 'practice' | 'lesson-practice' | 'mistake';

// 状态 C：已获得 XP，但当前年级参与人数不足 19 人，本周榜单暂未开启，下周自动进入星光学榜
const LeagueSparsePanel: React.FC<{
  compact?: boolean;
  weeklyXp: number;
  onGoStudy: () => void;
}> = ({ compact, weeklyXp, onGoStudy }) => (
  <motion.div
    initial={{ opacity: 0, y: compact ? 8 : 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    className={`relative overflow-hidden ${
      compact
        ? 'rounded-[28px] border border-indigo-200/50 bg-gradient-to-b from-[#EEF2FF]/85 via-[#F5F7FF]/75 to-[#E0E7FF]/65 p-5'
        : 'rounded-[40px] border border-indigo-200/50 bg-gradient-to-b from-[#EEF2FF]/80 via-[#F5F7FF]/70 to-[#E0E7FF]/55 p-10 min-h-[420px] flex flex-col items-center justify-center'
    }`}
  >
    {/* 星光背景 */}
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-48 bg-indigo-200/40 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-32 h-32 bg-indigo-100/50 rounded-full blur-2xl" />
      {[...Array(compact ? 6 : 10)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-indigo-400 rounded-full"
          style={{
            left: `${12 + (i * 17) % 76}%`,
            top: `${8 + (i * 23) % 84}%`,
            opacity: 0.15 + (i % 3) * 0.15,
          }}
          animate={{ opacity: [0.2, 0.6, 0.2], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 2 + (i % 3), repeat: Infinity, delay: i * 0.3 }}
        />
      ))}
    </div>

    <div className={`relative z-10 w-full ${compact ? 'text-center' : 'max-w-sm text-center'}`}>
      {/* 图标：已获得 XP，下周开启 */}
      <div className={`relative mx-auto ${compact ? 'w-14 h-14 mb-3' : 'w-24 h-24 mb-6'}`}>
        <div className={`absolute inset-0 bg-indigo-300/30 rounded-full ${compact ? 'blur-lg' : 'blur-xl'} animate-pulse`} />
        <div
          className={`relative w-full h-full bg-gradient-to-br from-[#A5B4FC] via-[#818CF8] to-[#6366F1] border border-indigo-200 flex items-center justify-center shadow-[0_8px_24px_rgba(99,102,241,0.25)] ${
            compact ? 'rounded-2xl' : 'rounded-[28px]'
          }`}
        >
          <Sparkles size={compact ? 24 : 36} className="text-indigo-100" />
        </div>
      </div>

      <p className={`font-black text-indigo-600 uppercase tracking-[0.25em] mb-2 ${compact ? 'text-[8px]' : 'text-[10px]'}`}>
        星光学榜
      </p>
      <h3 className={`font-black text-slate-900 leading-snug mb-2 ${compact ? 'text-sm' : 'text-xl'}`}>
        本周榜单暂未开启
      </h3>
      <p className={`text-slate-500 leading-relaxed ${compact ? 'text-[11px] mb-3' : 'text-sm mb-8'}`}>
        你已累计本周学习经验值，
        <span className="text-indigo-700 font-bold"> 下周即可进入星光学榜，与同段位的伙伴一起进步。</span>
      </p>

      {/* 已获得 XP 提示 + 按钮 */}
      {compact ? (
        <>
          <div className="flex items-center justify-between rounded-2xl bg-white/70 border border-indigo-200/60 mb-3 px-3.5 py-2.5">
            <div className="flex items-center gap-1.5">
              <Zap size={12} className="text-indigo-500" fill="currentColor" />
              <span className="text-slate-400 font-bold text-[10px]">本周已获得 XP</span>
            </div>
            <span className="font-black text-indigo-700 tabular-nums text-sm">{weeklyXp}</span>
          </div>
          <button
            type="button"
            onClick={onGoStudy}
            className="group w-full flex items-center justify-center gap-1.5 bg-gradient-to-r from-[#6366F1] via-[#5B5BF0] to-[#4F46E5] text-white font-black rounded-2xl shadow-[0_8px_24px_rgba(99,102,241,0.32)] hover:shadow-[0_12px_32px_rgba(99,102,241,0.42)] active:scale-[0.98] transition-all py-3 text-xs"
          >
            继续学习攒经验
            <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between rounded-2xl bg-white/70 border border-indigo-200/60 mb-5 px-4 py-3">
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-indigo-500" fill="currentColor" />
              <span className="text-slate-400 font-bold text-xs">本周已获得 XP</span>
            </div>
            <span className="font-black text-indigo-700 tabular-nums text-base">{weeklyXp}</span>
          </div>

          <button
            type="button"
            onClick={onGoStudy}
            className="group w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#6366F1] via-[#5B5BF0] to-[#4F46E5] text-white font-black rounded-2xl shadow-[0_10px_28px_rgba(99,102,241,0.32)] hover:shadow-[0_14px_36px_rgba(99,102,241,0.42)] active:scale-[0.98] transition-all py-4 text-sm"
          >
            继续学习攒经验
            <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </>
      )}

      {/* 底部下周上榜指引 */}
      {compact ? (
        <div className="pt-2.5 border-t border-indigo-200/60 flex items-center gap-1.5">
          <Clock size={11} className="text-indigo-400 shrink-0" />
          <p className="text-[10px] text-slate-500 leading-snug font-medium">
            下周榜单开启后，你将自动进入对应段位联赛参与排名。
          </p>
        </div>
      ) : (
        <div className="mt-4 pt-4 border-t border-indigo-200/60 text-left">
          <p className="font-black text-slate-400 uppercase tracking-wider mb-2.5 text-[10px]">
            下周自动上榜
          </p>
          <ul className="space-y-2.5">
            {LEAGUE_UNLOCK_HINTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-2">
                <div className="shrink-0 rounded-lg bg-white/70 border border-indigo-200/60 flex items-center justify-center w-6 h-6">
                  <Icon size={12} className="text-indigo-500" />
                </div>
                <span className="text-slate-500 leading-snug font-medium text-xs">
                  {text}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  </motion.div>
);

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
  userName: string;
  userLevel?: number;
  nextLevelXp?: number;
  xp?: number;
  coins?: number;
  weeklyXp?: number;
  userPersona?: UserPersona;
  userGrade?: string;
  schoolSystem?: string;
  dayPlan: DayPlan | null;
  onStartQuiz: (task: Task) => void;
  onOpenStore?: () => void;
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
  onOpenHomeTool?: (tool: HomeRailTool) => void;
  onGoStudy?: () => void;
}

export const DashboardImmersive: React.FC<DashboardImmersiveProps> = ({
  userName,
  userLevel = 5,
  nextLevelXp = 1000,
  xp = 850,
  coins = 850,
  dayPlan,
  onStartQuiz,
  onOpenStore,
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
  onOpenHomeTool,
  onGoStudy,
}) => {
  const isLeagueLocked = weeklyXp === 0;
  // 状态 C：已获得 XP，但年级人数不足 19 人，本周榜单暂未开启
  const isLeagueSparse = leagueSparse && !isLeagueLocked;
  const isNewbiePersona = userPersona === 'newbie';
  const isPreL1 = userLevel < 1;
  const isJuniorStudent = isJuniorGrade(userGrade || '', schoolSystem as UiSchoolSystem);
  const homeRightEntries = isJuniorStudent ? JUNIOR_HOME_RAIL : ELEMENTARY_HOME_RAIL;
  const [activePanel, setActivePanel] = useState<'tasks' | 'league' | 'stats' | 'tutor' | 'discovery_full' | null>(null);
  const [isThirdPartyOpen, setIsThirdPartyOpen] = useState(false);
  const [readingArticleId, setReadingArticleId] = useState<string | null>(null);
  const [readerHideNav, setReaderHideNav] = useState(false);
  const [fromVideoFeed, setFromVideoFeed] = useState(false);
  const resumeVideoFeedRef = React.useRef<(() => void) | null>(null);
  const [isFullLeagueOpen, setIsFullLeagueOpen] = useState(false);
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
  const messageAttentionCount = STUDENT_NOTIFICATION_DEMO.filter(
    (item) => item.isUnread || item.isPersistentRisk,
  ).length;
  const handleMessageToggle = useCallback(() => {
    setIsMessageOpen((isOpen) => !isOpen);
  }, []);
  const xpToNextLevel = Math.max(0, nextLevelXp - xp);
  const currentLevelProgress = isPreL1 ? 0 : Math.min(100, (xp / nextLevelXp) * 100);

  // New State for League View
  const [leagueViewState, setLeagueViewState] = useState<'LEAGUE_LIST' | 'USER_DETAIL' | 'COMPARE_DETAIL'>('LEAGUE_LIST');

  useEffect(() => {
    if (openLeagueSignal > 0 && (isLeagueLocked || isLeagueSparse)) {
      setActivePanel('league');
      setIsFullLeagueOpen(false);
      setLeagueViewState('LEAGUE_LIST');
    }
  }, [openLeagueSignal, isLeagueLocked, isLeagueSparse]);

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
    setIsFullLeagueOpen(false);
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

  const leagueData = useMemo(() => [
    { rank: 1, name: '林小明', xp: 3200, avatar: '🦊', isMe: false, leagueStatus: { tier: 'Meteor', tierLabel: '陨石联赛 I' } },
    { rank: 2, name: 'Sarah', xp: 3150, avatar: '🐱', isMe: false, leagueStatus: { tier: 'Meteor', tierLabel: '陨石联赛 I' } },
    { rank: 3, name: 'Mike', xp: 3100, avatar: '🦁', isMe: false, leagueStatus: { tier: 'Meteor', tierLabel: '陨石联赛 I' } },
    { rank: 4, name: 'Anna', xp: 3050, avatar: '🐰', isMe: false, leagueStatus: { tier: 'Meteor', tierLabel: '陨石联赛 I' } },
    { rank: 5, name: userName, xp: 2100, avatar: userAvatar, isMe: true, leagueStatus: { tier: 'Meteor', tierLabel: '陨石联赛 I' } },
    { rank: 6, name: '陈同学', xp: 1950, avatar: '🐨', isMe: false, leagueStatus: { tier: 'Meteor', tierLabel: '陨石联赛 I' } },
    { rank: 7, name: 'David', xp: 1900, avatar: '🐼', isMe: false, leagueStatus: { tier: 'Meteor', tierLabel: '陨石联赛 I' } },
    { rank: 8, name: 'Lisa', xp: 1850, avatar: '🐯', isMe: false, leagueStatus: { tier: 'Meteor', tierLabel: '陨石联赛 I' } },
    { rank: 9, name: 'Tom', xp: 1800, avatar: '🐸', isMe: false, leagueStatus: { tier: 'Meteor', tierLabel: '陨石联赛 I' } },
    { rank: 10, name: 'Jerry', xp: 1750, avatar: '🐹', isMe: false, leagueStatus: { tier: 'Meteor', tierLabel: '陨石联赛 I' } },
    { rank: 11, name: 'Bob', xp: 1700, avatar: '🐻', isMe: false, leagueStatus: { tier: 'Meteor', tierLabel: '陨石联赛 I' } },
    { rank: 12, name: 'Alice', xp: 1650, avatar: '🐔', isMe: false, leagueStatus: { tier: 'Meteor', tierLabel: '陨石联赛 I' } },
    { rank: 13, name: 'Kevin', xp: 1600, avatar: '🐺', isMe: false, leagueStatus: { tier: 'Meteor', tierLabel: '陨石联赛 I' } },
    { rank: 14, name: 'Lucy', xp: 1550, avatar: '🐗', isMe: false, leagueStatus: { tier: 'Meteor', tierLabel: '陨石联赛 I' } },
    { rank: 15, name: 'John', xp: 1500, avatar: '🐴', isMe: false, leagueStatus: { tier: 'Meteor', tierLabel: '陨石联赛 I' } },
    { rank: 16, name: 'Emma', xp: 1450, avatar: '🦄', isMe: false, leagueStatus: { tier: 'Meteor', tierLabel: '陨石联赛 I' } },
  ], [userName]);

  const [selectedCompareUser, setSelectedCompareUser] = useState<(typeof leagueData)[number] | null>(null);

  const top3 = useMemo(() => leagueData.slice(0, 3), [leagueData]);
  const restList = useMemo(() => leagueData.slice(3), [leagueData]);
  const currentTierName = 'Meteor';
  const currentTier = LEAGUE_TIER_CONFIGS.find((tier) => tier.name === currentTierName);
  const myLeagueRank = leagueData.find((user) => user.isMe)?.rank;

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

                       <button
                            type="button"
                            onClick={() => {
                                setIsUserMenuOpen(false);
                                togglePanel('league');
                            }}
                            aria-label={isLeagueLocked ? '星际联赛，待解锁' : isLeagueSparse ? '星光学榜，本周暂未开启，下周自动上榜' : `打开星际联赛，${currentTier?.label ?? '联赛'}，当前第 ${myLeagueRank} 名`}
                            aria-pressed={activePanel === 'league'}
                            className={`flex items-center gap-1.5 rounded-full pl-1.5 pr-2.5 py-1.5 transition-colors ${
                                activePanel === 'league' ? (isLeagueSparse ? 'bg-indigo-400/20' : 'bg-amber-400/20') : 'hover:bg-white/10'
                            }`}
                       >
                           <span
                               className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base shadow-inner ${
                                   isLeagueLocked
                                       ? 'bg-white/10 grayscale opacity-70'
                                       : isLeagueSparse
                                          ? 'bg-gradient-to-br from-indigo-300 to-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.35)]'
                                          : 'bg-gradient-to-br from-amber-300 to-orange-500 shadow-[0_0_12px_rgba(251,191,36,0.35)]'
                               }`}
                           >
                               {currentTier?.icon ?? '🏆'}
                               {isLeagueLocked && (
                                   <span className="absolute -right-1 -bottom-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-slate-900 text-amber-200 border border-white/20">
                                       <Lock size={8} strokeWidth={3} />
                                   </span>
                               )}
                           </span>
                           <span className="flex flex-col items-start leading-none">
                               <span className={`text-[10px] font-black tracking-tight ${isLeagueLocked ? 'text-white/40' : isLeagueSparse ? 'text-indigo-100' : 'text-amber-100'}`}>
                                   {isLeagueLocked ? '待解锁' : isLeagueSparse ? '待开启' : (currentTier?.label.replace('联赛', '') ?? '联赛')}
                               </span>
                               <span className={`text-[11px] font-black mt-0.5 ${isLeagueLocked ? 'text-white/30' : isLeagueSparse ? 'text-white/80' : 'text-white'}`}>
                                   {isLeagueLocked ? '联赛' : isLeagueSparse ? `${weeklyXp}XP` : `#${myLeagueRank}`}
                               </span>
                           </span>
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
                    onClick={onOpenStore}
                    aria-label={`打开金币商店，当前 ${coins} 金币`}
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
          onClick={() => togglePanel('discovery_full')}
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
        items={STUDENT_NOTIFICATION_DEMO}
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

      {/* ================= Layer 3.5: 星光学榜右侧抽屉 + 蒙层 ================= */}
      {typeof document !== 'undefined' && createPortal(
          <AnimatePresence>
              {activePanel === 'league' && (
                  <>
                      <motion.div
                          key="league-drawer-mask"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.22 }}
                          onClick={() => setActivePanel(null)}
                          className="absolute inset-0 z-[620] bg-black/45 pointer-events-auto"
                          aria-hidden="true"
                      />
                      <motion.aside
                          key="league-right-drawer"
                          role="dialog"
                          aria-modal="true"
                          aria-label="星光学榜"
                          initial={{ x: '100%' }}
                          animate={{ x: 0 }}
                          exit={{ x: '100%' }}
                          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                          className="absolute top-0 right-0 bottom-0 z-[630] flex w-[min(380px,86%)] flex-col pointer-events-auto"
                      >
                          <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-l-[28px] border border-r-0 border-slate-200/80 bg-[#F7F6F3] shadow-[-18px_0_50px_rgba(15,23,42,0.28)]">
                              <div className="flex shrink-0 items-start justify-between gap-3 px-5 pt-5 pb-3">
                                  <div className="min-w-0">
                                      <h2 className="text-[22px] font-black tracking-tight text-slate-900">星光学榜</h2>
                                      <p className="mt-1 text-[13px] font-medium text-slate-400">快来冲榜突破自己吧</p>
                                  </div>
                                  <button
                                      type="button"
                                      onClick={() => setActivePanel(null)}
                                      aria-label="关闭星光学榜"
                                      className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-200/70 hover:text-slate-600"
                                  >
                                      <X size={18} />
                                  </button>
                              </div>

                              <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-5 custom-scrollbar">
                                  <button
                                      type="button"
                                      onClick={() => setIsFullLeagueOpen(true)}
                                      className={`relative mb-3 flex w-full items-center overflow-hidden rounded-[22px] px-4 py-3.5 text-left transition active:scale-[0.98] ${
                                        isLeagueLocked
                                          ? 'bg-gradient-to-r from-white/90 via-[#FFFDF5]/85 to-[#FFF6E0]/80 border border-amber-300/90 shadow-[0_2px_8px_rgba(245,158,11,0.08)]'
                                          : isLeagueSparse
                                            ? 'bg-gradient-to-r from-white/90 via-[#F5F7FF]/85 to-[#E8ECFF]/80 border border-indigo-300/90 shadow-[0_2px_8px_rgba(99,102,241,0.08)]'
                                            : 'bg-gradient-to-r from-[#FFE566] via-[#FFC93A] to-[#FF9F2E] shadow-[0_10px_28px_rgba(245,158,11,0.28)]'
                                      }`}
                                  >
                                      <div className="relative z-10 min-w-0 flex-1 pr-16">
                                          <div className="flex items-center gap-2">
                                              <h3 className="text-[17px] font-black text-slate-900">
                                                {currentTier?.label ?? '陨石联赛 I'}
                                              </h3>
                                              {!isLeagueLocked && !isLeagueSparse && (
                                                <span className="rounded-md bg-white/55 px-1.5 py-0.5 text-[10px] font-black text-amber-700">
                                                  周赛排行
                                                </span>
                                              )}
                                              {isLeagueLocked && (
                                                <span className="rounded-md bg-white/55 px-1.5 py-0.5 text-[10px] font-black text-slate-600">
                                                  未解锁
                                                </span>
                                              )}
                                              {isLeagueSparse && (
                                                <span className="rounded-md bg-white/55 px-1.5 py-0.5 text-[10px] font-black text-indigo-700">
                                                  待开启
                                                </span>
                                              )}
                                          </div>
                                          <p className="mt-1 text-[12px] font-bold text-slate-700/80">
                                            距离赛季结束: 2天14h
                                          </p>
                                      </div>
                                      <div className="absolute right-3 top-1/2 z-10 -translate-y-1/2 text-[42px] leading-none drop-shadow-md">
                                        🏆
                                      </div>
                                      <ChevronRight size={18} className="absolute right-2 top-2 text-slate-800/35" />
                                  </button>

                                  {isLeagueLocked ? (
                                    <div className="rounded-2xl border border-slate-200 bg-white p-3">
                                      <LeagueLockedPanel
                                        compact
                                        isNewbie={isNewbiePersona}
                                        onGoStudy={handleGoStudy}
                                      />
                                    </div>
                                  ) : isLeagueSparse ? (
                                    <div className="rounded-2xl border border-indigo-200 bg-white p-3">
                                      <LeagueSparsePanel
                                        compact
                                        weeklyXp={weeklyXp}
                                        onGoStudy={handleGoStudy}
                                      />
                                    </div>
                                  ) : (
                                    <div className="flex flex-col gap-2">
                                      {leagueData.slice(0, 8).map((user, idx) => {
                                        const prevUser = idx > 0 ? leagueData[idx - 1] : null;
                                        const rowTone =
                                          user.rank === 1
                                            ? 'bg-[#FFF8E8] border-[#F6E2B0]'
                                            : user.rank === 2
                                              ? 'bg-[#F3F7FF] border-[#D7E3F8]'
                                              : user.rank === 3
                                                ? 'bg-[#FFF4EC] border-[#F3D7C2]'
                                                : user.isMe
                                                  ? 'bg-indigo-50 border-indigo-200'
                                                  : 'bg-white border-slate-100';

                                        return (
                                          <div
                                            key={user.rank}
                                            className={`flex items-center gap-3 rounded-2xl border px-3 py-2.5 shadow-[0_4px_14px_rgba(15,23,42,0.04)] ${rowTone}`}
                                          >
                                            <div className="flex w-7 shrink-0 items-center justify-center">
                                              {user.rank === 1 ? (
                                                <span className="text-[20px] leading-none">🥇</span>
                                              ) : user.rank === 2 ? (
                                                <span className="text-[20px] leading-none">🥈</span>
                                              ) : user.rank === 3 ? (
                                                <span className="text-[20px] leading-none">🥉</span>
                                              ) : (
                                                <span className="text-[14px] font-black text-slate-400">{user.rank}</span>
                                              )}
                                            </div>

                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white bg-slate-100 text-lg shadow-sm">
                                              {user.isMe ? (
                                                <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                                              ) : (
                                                user.avatar
                                              )}
                                            </div>

                                            <div className="min-w-0 flex-1">
                                              <p className="truncate text-[14px] font-black text-slate-800">
                                                {user.name}
                                                {user.isMe && (
                                                  <span className="ml-1.5 rounded bg-indigo-500 px-1 py-px text-[9px] font-black text-white align-middle">
                                                    ME
                                                  </span>
                                                )}
                                              </p>
                                              <p className="mt-0.5 text-[11px] font-semibold text-slate-400">
                                                {prevUser ? `距上一名${prevUser.xp - user.xp + 1}XP` : '领跑者'}
                                              </p>
                                            </div>

                                            <div className="flex shrink-0 items-center gap-0.5">
                                              <Zap size={13} className="text-amber-400" fill="currentColor" />
                                              <span className="text-[13px] font-black tabular-nums text-slate-700">
                                                {user.xp}
                                                <span className="ml-0.5 text-[10px] font-bold text-slate-400">XP</span>
                                              </span>
                                            </div>
                                          </div>
                                        );
                                      })}

                                      <button
                                        type="button"
                                        onClick={() => setIsFullLeagueOpen(true)}
                                        className="mt-1 w-full rounded-2xl border border-slate-200 bg-white py-2.5 text-[12px] font-black text-slate-500 transition hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700"
                                      >
                                        查看完整榜单 · 共 {leagueData.length} 人
                                      </button>
                                    </div>
                                  )}
                              </div>
                          </div>
                      </motion.aside>
                  </>
              )}
          </AnimatePresence>,
          document.getElementById('app-viewport') ||
          document.getElementById('modal-root') ||
          document.body
      )}

      {/* ================= Layer 4: Full Leaderboard Modal (iPadOS Style) ================= */}
      {typeof document !== 'undefined' && createPortal(
          <AnimatePresence>
              {isFullLeagueOpen && (
                  <>
                      {/* Background Backdrop */}
                      <motion.div 
                          initial={{ opacity: 0 }} 
                          animate={{ opacity: 1 }} 
                          exit={{ opacity: 0 }} 
                          onClick={() => setIsFullLeagueOpen(false)} 
                          className="absolute inset-0 bg-black/80 backdrop-blur-2xl z-[640] pointer-events-auto" 
                      />
                      
                      {/* Main Modal Container */}
                      <motion.div 
                          initial={{ opacity: 0, scale: 0.9, y: 40 }} 
                          animate={{ opacity: 1, scale: 1, y: 0 }} 
                          exit={{ opacity: 0, scale: 0.9, y: 40 }} 
                          className="absolute inset-4 md:inset-10 m-auto w-auto md:max-w-3xl h-auto max-h-[90%] bg-slate-900/60 backdrop-blur-3xl rounded-[48px] shadow-[0_40px_120px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden pointer-events-auto z-[650] border border-white/10 ring-1 ring-white/5"
                      >
                          {/* 1. Fixed Header: Title & Tier Roadmap - Only show in League List */}
                          {leagueViewState === 'LEAGUE_LIST' && (
                              <div className="shrink-0 bg-white/5 p-8 border-b border-white/5 relative overflow-hidden">
                                  {/* Background Glow */}
                                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-yellow-500/10 blur-3xl rounded-full" />
                                  
                                  <div className="flex justify-between items-center relative z-10 mb-8">
                                      <div className="flex items-center gap-4">
                                          <div className="w-12 h-12 bg-yellow-500/20 rounded-2xl flex items-center justify-center text-2xl shadow-inner border border-yellow-500/20 ring-1 ring-white/10">🏆</div>
                                          <div>
                                              <h2 className="text-3xl font-black text-white leading-none tracking-tight">星际联赛</h2>
                                              <div className="flex items-center gap-2 mt-2">
                                                  <div className="flex items-center gap-1.5 px-3 py-1 bg-red-500/10 rounded-full border border-red-500/20">
                                                      <Timer size={12} className="text-red-400 animate-pulse" />
                                                      <span className="text-red-400 text-[10px] font-black tracking-widest">2天14小时后结算</span>
                                                  </div>
                                                  <span className="text-white/20 text-xs font-bold">|</span>
                                                  <span className="text-white/40 text-[10px] font-black tracking-widest">陨石联赛 I</span>
                                              </div>
                                          </div>
                                      </div>
                                      <button 
                                          onClick={() => setIsFullLeagueOpen(false)} 
                                          aria-label="关闭星际联赛"
                                          className="w-12 h-12 bg-white/5 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-all flex items-center justify-center border border-white/5 active:scale-90"
                                      >
                                          <X size={24} />
                                      </button>
                                  </div>

                                  {/* Tier Roadmap (Horizontal Scroll) */}
                                  <div className="relative px-2">
                                      <div className="absolute top-7 left-10 right-10 h-[1px] bg-white/5 -z-0" />
                                      <div className="flex gap-10 overflow-x-auto no-scrollbar pb-2 relative z-10">
                                          {LEAGUE_TIER_CONFIGS.map((tier, idx) => {
                                              const currentTierIdx = LEAGUE_TIER_CONFIGS.findIndex(t => t.name === currentTierName);
                                              const isReached = idx <= currentTierIdx;
                                              const isCurrent = idx === currentTierIdx;
                                              return (
                                                  <div key={tier.name} className="flex flex-col items-center gap-3 shrink-0">
                                                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-all duration-700 relative overflow-hidden ${
                                                          isReached 
                                                          ? `bg-gradient-to-br ${tier.themeGradient} border-white/20 shadow-lg shadow-black/30` 
                                                          : 'bg-white/5 border-white/5 grayscale opacity-30'
                                                      }`}>
                                                          <span className="text-2xl drop-shadow-md z-10">{tier.icon}</span>
                                                          {isCurrent && (
                                                              <motion.div 
                                                                  layoutId="tier-glow" 
                                                                  className="absolute -inset-1 border-2 border-yellow-400 rounded-2xl animate-pulse shadow-[0_0_15px_rgba(250,204,21,0.5)]" 
                                                              />
                                                          )}
                                                      </div>
                                                      <span className={`text-[9px] font-black tracking-tighter uppercase ${isReached ? 'text-white' : 'text-white/20'}`}>{tier.label}</span>
                                                  </div>
                                              );
                                          })}
                                      </div>
                                  </div>
                              </div>
                          )}

                          {/* 2. Unified Scroll Content */}
                          <div className={`flex-1 overflow-y-auto custom-scrollbar ${leagueViewState === 'LEAGUE_LIST' ? 'p-8 bg-black/20' : 'p-0'} pb-24 relative overflow-x-hidden`}>
                              <AnimatePresence mode="popLayout" initial={false}>
                                  {leagueViewState === 'LEAGUE_LIST' ? (
                                      <motion.div
                                          key="league-list"
                                          initial={{ opacity: 0, x: -20 }}
                                          animate={{ opacity: 1, x: 0 }}
                                          exit={{ opacity: 0, x: -20 }}
                                          transition={{ duration: 0.3 }}
                                      >
                                          {isLeagueLocked ? (
                                            <LeagueLockedPanel
                                              isNewbie={isNewbiePersona}
                                              onGoStudy={handleGoStudy}
                                            />
                                          ) : isLeagueSparse ? (
                                            <LeagueSparsePanel
                                              weeklyXp={weeklyXp}
                                              onGoStudy={handleGoStudy}
                                            />
                                          ) : (
                                          <>
                                          {/* PODIUM (Hero Islands) */}
                                          <div className="flex items-end justify-center gap-8 h-64 mb-16 relative">
                                              {/* 2nd Place */}
                                              {top3[1] && (
                                                  <div className="flex flex-col items-center gap-4 w-1/3 group cursor-pointer"
                                                      onClick={() => {
                                                          if (top3[1].isMe) {
                                                              setLeagueViewState('USER_DETAIL');
                                                          } else {
                                                              setSelectedCompareUser(top3[1]);
                                                              setLeagueViewState('COMPARE_DETAIL');
                                                          }
                                                      }}
                                                  >
                                                      <div className="relative">
                                                          <div className="w-24 h-24 rounded-[32px] bg-slate-800 border-2 border-slate-500/30 flex items-center justify-center text-5xl shadow-2xl relative z-10 transition-transform group-hover:-translate-y-2 overflow-hidden">
                                                              {top3[1].isMe ? (
                                                                  <img src={top3[1].avatar} alt={top3[1].name} className="w-full h-full object-cover" />
                                                              ) : (
                                                                  top3[1].avatar
                                                              )}
                                                              {/* Hover Overlay */}
                                                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                  <span className="text-[10px] font-bold text-white bg-white/20 px-2 py-1 rounded-full backdrop-blur-sm">查看详情</span>
                                                              </div>
                                                          </div>
                                                          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-slate-400 text-slate-900 rounded-xl flex items-center justify-center font-black text-sm shadow-xl border-2 border-[#0F172A] z-20">2</div>
                                                      </div>
                                                      <div className="text-center">
                                                          <p className="text-white font-bold text-xs truncate w-24 mb-1">{top3[1].name}</p>
                                                          <p className="text-blue-400 text-[10px] font-black">{top3[1].xp} XP</p>
                                                      </div>
                                                      <div className="w-full h-12 bg-gradient-to-b from-slate-500/10 to-transparent border-t border-slate-500/20 rounded-t-[40%]" />
                                                  </div>
                                              )}

                                              {/* 1st Place */}
                                              {top3[0] && (
                                                  <div className="flex flex-col items-center gap-5 w-1/3 mb-8 group cursor-pointer"
                                                      onClick={() => {
                                                          if (top3[0].isMe) {
                                                              setLeagueViewState('USER_DETAIL');
                                                          } else {
                                                              setSelectedCompareUser(top3[0]);
                                                              setLeagueViewState('COMPARE_DETAIL');
                                                          }
                                                      }}
                                                  >
                                                      <div className="relative">
                                                          <div className="absolute -inset-12 bg-yellow-500/10 rounded-full blur-3xl animate-pulse" />
                                                          <div className="w-32 h-32 rounded-[48px] bg-slate-800 border-4 border-yellow-500/40 flex items-center justify-center text-6xl shadow-[0_0_50px_rgba(234,179,8,0.2)] relative z-10 transition-transform group-hover:-translate-y-2 overflow-hidden">
                                                              {top3[0].isMe ? (
                                                                  <img src={top3[0].avatar} alt={top3[0].name} className="w-full h-full object-cover" />
                                                              ) : (
                                                                  top3[0].avatar
                                                              )}
                                                              {/* Hover Overlay */}
                                                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                  <span className="text-xs font-bold text-white bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-sm">查看详情</span>
                                                              </div>
                                                          </div>
                                                          <div className="absolute -top-12 left-1/2 -translate-x-1/2">
                                                              <Crown size={40} className="text-yellow-400 fill-yellow-400/20 animate-bounce" />
                                                          </div>
                                                          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-yellow-400 text-slate-900 rounded-[14px] flex items-center justify-center font-black text-xl shadow-xl border-2 border-[#0F172A] z-20">1</div>
                                                      </div>
                                                      <div className="text-center">
                                                          <p className="text-white font-black text-base truncate w-32 mb-1">{top3[0].name}</p>
                                                          <div className="bg-yellow-400/20 px-3 py-1 rounded-full border border-yellow-400/20 inline-block">
                                                              <p className="text-yellow-400 text-[11px] font-black">{top3[0].xp} XP</p>
                                                          </div>
                                                      </div>
                                                      <div className="w-full h-20 bg-gradient-to-b from-yellow-500/20 to-transparent border-t border-yellow-500/30 rounded-t-[50%]" />
                                                  </div>
                                              )}

                                              {/* 3rd Place */}
                                              {top3[2] && (
                                                  <div className="flex flex-col items-center gap-4 w-1/3 group cursor-pointer"
                                                      onClick={() => {
                                                          if (top3[2].isMe) {
                                                              setLeagueViewState('USER_DETAIL');
                                                          } else {
                                                              setSelectedCompareUser(top3[2]);
                                                              setLeagueViewState('COMPARE_DETAIL');
                                                          }
                                                      }}
                                                  >
                                                      <div className="relative">
                                                          <div className="w-20 h-20 rounded-[28px] bg-slate-800 border-2 border-orange-500/30 flex items-center justify-center text-4xl shadow-2xl relative z-10 transition-transform group-hover:-translate-y-2 overflow-hidden">
                                                              {top3[2].isMe ? (
                                                                  <img src={top3[2].avatar} alt={top3[2].name} className="w-full h-full object-cover" />
                                                              ) : (
                                                                  top3[2].avatar
                                                              )}
                                                              {/* Hover Overlay */}
                                                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                  <span className="text-[10px] font-bold text-white bg-white/20 px-2 py-1 rounded-full backdrop-blur-sm">查看详情</span>
                                                              </div>
                                                          </div>
                                                          <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-orange-400 text-slate-900 rounded-lg flex items-center justify-center font-black text-xs shadow-xl border-2 border-[#0F172A] z-20">3</div>
                                                      </div>
                                                      <div className="text-center">
                                                          <p className="text-white font-bold text-[11px] truncate w-24 mb-1">{top3[2].name}</p>
                                                          <p className="text-blue-400 text-[9px] font-black">{top3[2].xp} XP</p>
                                                      </div>
                                                      <div className="w-full h-10 bg-gradient-to-b from-orange-500/10 to-transparent border-t border-orange-500/20 rounded-t-[40%]" />
                                                  </div>
                                              )}
                                          </div>

                                          {/* PROMOTION DIVIDER */}
                                          <div className="flex items-center gap-4 px-6 py-4 bg-cyan-400/5 rounded-3xl border border-cyan-400/10 mb-6">
                                              <Rocket size={18} className="text-cyan-400 animate-pulse" />
                                              <span className="text-xs font-black text-cyan-400 tracking-[0.2em]">晋级区 · 赛季结束后升级</span>
                                          </div>

                                          {/* RANK LIST (#4+) */}
                                          <div className="space-y-4 pb-24">
                                              {restList.map((student, idx) => (
                                                  <motion.div 
                                                      key={student.rank}
                                                      initial={{ opacity: 0, x: -20 }}
                                                      animate={{ opacity: 1, x: 0 }}
                                                      transition={{ delay: idx * 0.05 }}
                                                      onClick={() => {
                                                          if (student.isMe) {
                                                              setLeagueViewState('USER_DETAIL');
                                                          } else {
                                                              setSelectedCompareUser(student);
                                                              setLeagueViewState('COMPARE_DETAIL');
                                                          }
                                                      }}
                                                      className={`flex items-center p-6 rounded-[36px] border transition-all relative overflow-hidden group/item cursor-pointer ${
                                                          student.isMe 
                                                          ? 'bg-brand/20 border-brand/50 ring-2 ring-brand/40 shadow-[0_0_40px_rgba(108,93,211,0.2)] scale-[1.02] z-10' 
                                                          : 'bg-white/5 border-white/5 hover:bg-white/10'
                                                      }`}
                                                  >
                                                      {student.isMe && (
                                                          <motion.div 
                                                              className="absolute inset-0 bg-gradient-to-r from-brand/10 via-transparent to-brand/10"
                                                              animate={{ x: ['-100%', '100%'] }}
                                                              transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                                                          />
                                                      )}

                                                      <div className="w-12 flex justify-center shrink-0">
                                                          <span className={`font-black italic text-xl ${student.isMe ? 'text-white' : 'text-white/20'}`}>#{student.rank}</span>
                                                      </div>
                                                      
                                                      <div className="flex-1 flex items-center gap-5 ml-4">
                                                          <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-white/5 relative z-10 overflow-hidden">
                                                              {student.isMe ? (
                                                                  <img src={student.avatar} alt={student.name} className="w-full h-full object-cover" />
                                                              ) : (
                                                                  student.avatar
                                                              )}
                                                          </div>
                                                          <div>
                                                              <div className="flex items-center gap-3">
                                                                  <span className={`font-black text-lg ${student.isMe ? 'text-white' : 'text-white/80'}`}>{student.name}</span>
                                                                  {student.isMe && <span className="text-[10px] bg-brand text-white px-2 py-0.5 rounded-lg font-black">ME</span>}
                                                              </div>
                                                              <div className="flex items-center gap-2 mt-1 opacity-60">
                                                                  <div className="w-4 h-4 rounded bg-yellow-500/20 flex items-center justify-center">
                                                                      <Zap size={10} className="text-yellow-500" fill="currentColor" />
                                                                  </div>
                                                                  <span className="text-xs font-bold text-white/60">{student.xp} XP</span>
                                                              </div>
                                                          </div>
                                                      </div>

                                                      <div className="text-right">
                                                          <div className="flex items-center gap-2 justify-end mb-1">
                                                              <TrendingUp size={14} className="text-green-500" />
                                                              <span className="text-[10px] text-white/30 font-black uppercase tracking-tighter">
                                                                  {idx > 0 ? `距上一名 ${restList[idx-1].xp - student.xp + 1} XP` : `距前三名 ${top3[2].xp - student.xp + 1} XP`}
                                                              </span>
                                                          </div>
                                                          {/* Hover Hint */}
                                                          <span className="text-[10px] text-white/50 opacity-0 group-hover/item:opacity-100 transition-opacity font-bold">查看详情 &gt;</span>
                                                      </div>
                                                  </motion.div>
                                              ))}

                                              {/* DANGER ZONE (Mocked for Demo) */}
                                              <div className="flex items-center gap-4 px-6 py-4 bg-red-400/5 rounded-3xl border border-red-400/10 mt-8">
                                                  <AlertCircle size={18} className="text-red-400" />
                                                  <span className="text-xs font-black text-red-400 tracking-[0.2em]">降级风险区 · 赛季结束后可能降级</span>
                                              </div>
                                          </div>
                                          </>
                                          )}
                                      </motion.div>
                                  ) : (
                                      <motion.div
                                          key="user-detail"
                                          initial={{ opacity: 0, x: 20 }}
                                          animate={{ opacity: 1, x: 0 }}
                                          exit={{ opacity: 0, x: 20 }}
                                          transition={{ duration: 0.3 }}
                                          className="flex flex-col h-full"
                                      >
                                          {/* Detail View Header - Full Width with Close Button */}
                                          <div className="shrink-0 bg-white/5 p-8 border-b border-white/5 relative">
                                              <div className="flex items-center justify-between">
                                                  <div className="flex items-center gap-4">
                                                      <button 
                                                          onClick={() => setLeagueViewState('LEAGUE_LIST')}
                                                          aria-label="返回联赛排行榜"
                                                          className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                                                      >
                                                          <ChevronLeft size={20} className="text-white" />
                                                      </button>
                                                      <h2 className="text-2xl font-black text-white">
                                                          {leagueViewState === 'USER_DETAIL' ? '我的数据' : `VS ${selectedCompareUser?.name}`}
                                                      </h2>
                                                  </div>
                                                  <button 
                                                      onClick={() => setIsFullLeagueOpen(false)} 
                                                      aria-label="关闭星际联赛"
                                                      className="w-12 h-12 bg-white/5 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-all flex items-center justify-center border border-white/5 active:scale-90"
                                                  >
                                                      <X size={24} />
                                                  </button>
                                              </div>
                                          </div>
                                          
                                          {/* Stats Content - Full Height Scrollable */}
                                          <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-black/20">

                                              <div className="space-y-6 pb-12">
                                              {/* 1. Top Analysis Card (Original Stats Content) */}
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

                                                  {/* Weekly Bar Chart - Ultra Simple */}
                                                  <div className="flex items-end justify-between h-28 gap-2 px-1 mb-8 relative z-10">
                                                      {/* 周一 - 300 XP */}
                                                      <div className="flex-1 flex flex-col items-center gap-2">
                                                          <div className="w-full flex flex-col justify-end h-full">
                                                              <div 
                                                                  style={{ height: '50%' }}
                                                                  className="w-full bg-blue-400 rounded"
                                                              />
                                                          </div>
                                                          <span className="text-[8px] font-bold tracking-tighter text-white/30">一</span>
                                                      </div>

                                                      {/* 周二 - 450 XP */}
                                                      <div className="flex-1 flex flex-col items-center gap-2">
                                                          <div className="w-full flex flex-col justify-end h-full">
                                                              <div 
                                                                  style={{ height: '75%' }}
                                                                  className="w-full bg-blue-400 rounded"
                                                              />
                                                          </div>
                                                          <span className="text-[8px] font-bold tracking-tighter text-white/30">二</span>
                                                      </div>

                                                      {/* 周三 - 200 XP */}
                                                      <div className="flex-1 flex flex-col items-center gap-2">
                                                          <div className="w-full flex flex-col justify-end h-full">
                                                              <div 
                                                                  style={{ height: '33%' }}
                                                                  className="w-full bg-blue-400 rounded"
                                                              />
                                                          </div>
                                                          <span className="text-[8px] font-bold tracking-tighter text-white/30">三</span>
                                                      </div>

                                                      {/* 周四 - 600 XP (最高) */}
                                                      <div className="flex-1 flex flex-col items-center gap-2">
                                                          <div className="w-full flex flex-col justify-end h-full">
                                                              <div 
                                                                  style={{ height: '100%' }}
                                                                  className="w-full bg-gradient-to-t from-blue-500 to-cyan-400 rounded"
                                                              />
                                                          </div>
                                                          <span className="text-[8px] font-bold tracking-tighter text-blue-400">四</span>
                                                      </div>

                                                      {/* 周五 - 400 XP */}
                                                      <div className="flex-1 flex flex-col items-center gap-2">
                                                          <div className="w-full flex flex-col justify-end h-full">
                                                              <div 
                                                                  style={{ height: '67%' }}
                                                                  className="w-full bg-blue-400 rounded"
                                                              />
                                                          </div>
                                                          <span className="text-[8px] font-bold tracking-tighter text-white/30">五</span>
                                                      </div>

                                                      {/* 周六 - 100 XP */}
                                                      <div className="flex-1 flex flex-col items-center gap-2">
                                                          <div className="w-full flex flex-col justify-end h-full">
                                                              <div 
                                                                  style={{ height: '25%' }}
                                                                  className="w-full bg-blue-400 rounded"
                                                              />
                                                          </div>
                                                          <span className="text-[8px] font-bold tracking-tighter text-white/30">六</span>
                                                      </div>

                                                      {/* 周日 - 50 XP */}
                                                      <div className="flex-1 flex flex-col items-center gap-2">
                                                          <div className="w-full flex flex-col justify-end h-full">
                                                              <div 
                                                                  style={{ height: '15%' }}
                                                                  className="w-full bg-blue-400 rounded"
                                                              />
                                                          </div>
                                                          <span className="text-[8px] font-bold tracking-tighter text-white/30">七</span>
                                                      </div>
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

                                              {/* 2. Key Metrics Grid */}
                                              <div className="grid grid-cols-2 gap-4">
                                                  <div className="bg-white/5 rounded-[32px] p-6 border border-white/5 group hover:bg-white/10 transition-colors">
                                                      <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400 mb-3 border border-orange-500/20">
                                                          <Activity size={16} />
                                                      </div>
                                                      <p className="text-[9px] font-black text-white/40 tracking-widest mb-1">专注得分</p>
                                                      <p className="text-3xl font-black text-white">{statsData.focusScore}</p>
                                                  </div>
                                                  <div className="bg-white/5 rounded-[32px] p-6 border border-white/5 group hover:bg-white/10 transition-colors">
                                                      <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400 mb-3 border border-green-500/20">
                                                          <Sparkles size={16} />
                                                      </div>
                                                      <p className="text-[9px] font-black text-white/40 tracking-widest mb-1">连续学习</p>
                                                      <p className="text-3xl font-black text-white">{statsData.streak}<span className="text-xs font-normal text-white/40 ml-1">天</span></p>
                                                  </div>
                                              </div>

                                              {/* 3. New: Weekly Trend (Line/Area Chart) */}
                                              <div className="bg-white/5 rounded-3xl p-6 border border-white/5 relative overflow-hidden">
                                                  <div className="flex items-center gap-3 mb-6">
                                                      <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 border border-cyan-500/20">
                                                          <TrendingUp size={16} />
                                                      </div>
                                                      <h3 className="text-sm font-black text-white uppercase tracking-wider">成长趋势</h3>
                                                  </div>
                                                  <div className="h-48 w-full">
                                                      <ResponsiveContainer width="100%" height="100%">
                                                          <AreaChart data={statsData.weeklyTrend}>
                                                              <defs>
                                                                  <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                                                                      <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.3}/>
                                                                      <stop offset="95%" stopColor="#22D3EE" stopOpacity={0}/>
                                                                  </linearGradient>
                                                              </defs>
                                                              <XAxis 
                                                                  dataKey="day" 
                                                                  axisLine={false} 
                                                                  tickLine={false} 
                                                                  tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} 
                                                                  dy={10}
                                                              />
                                                              <Tooltip 
                                                                  contentStyle={{ backgroundColor: '#0F172A', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                                                  itemStyle={{ color: '#22D3EE', fontWeight: 'bold' }}
                                                                  labelStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', marginBottom: '4px' }}
                                                              />
                                                              <Area 
                                                                  type="monotone" 
                                                                  dataKey="xp" 
                                                                  stroke="#22D3EE" 
                                                                  strokeWidth={3}
                                                                  fillOpacity={1} 
                                                                  fill="url(#colorXp)" 
                                                              />
                                                          </AreaChart>
                                                      </ResponsiveContainer>
                                                  </div>
                                              </div>
                                          </div>
                                          </div>
                                      </motion.div>
                                  )}
                              </AnimatePresence>
                          </div>
                          
                          {/* Sticky Footer for League List */}
                          <AnimatePresence>
                              {leagueViewState === 'LEAGUE_LIST' && !isLeagueLocked && !isLeagueSparse && (
                                  <motion.div 
                                      initial={{ y: 100 }}
                                      animate={{ y: 0 }}
                                      exit={{ y: 100 }}
                                      className="absolute bottom-0 left-0 right-0 p-4 bg-slate-900/80 backdrop-blur-xl border-t border-white/10 z-50"
                                  >
                                      <div 
                                          onClick={() => setLeagueViewState('USER_DETAIL')}
                                          className="flex items-center p-4 rounded-3xl bg-brand/20 border border-brand/40 shadow-lg cursor-pointer hover:bg-brand/30 transition-colors group"
                                      >
                                          <div className="w-10 flex justify-center shrink-0">
                                              <span className="font-black italic text-lg text-white">#{leagueData.find(u => u.isMe)?.rank}</span>
                                          </div>
                                          <div className="w-12 h-12 rounded-xl bg-white/10 mx-4 overflow-hidden border border-white/10">
                                              <img src={userAvatar} alt={userName} className="w-full h-full object-cover" />
                                          </div>
                                          <div className="flex-1">
                                              <div className="flex items-center gap-2">
                                                  <span className="font-black text-white">{userName}</span>
                                                  <span className="text-[9px] bg-brand text-white px-1.5 py-0.5 rounded font-black">ME</span>
                                              </div>
                                              <span className="text-xs font-bold text-white/60">{statsData.weeklyXp.toLocaleString()} XP</span>
                                          </div>
                                          <div className="flex items-center gap-2 text-brand-light font-bold text-xs group-hover:translate-x-1 transition-transform">
                                              <span>查看详情</span>
                                              <ChevronRight size={14} />
                                          </div>
                                      </div>
                                  </motion.div>
                              )}
                          </AnimatePresence>

                      </motion.div>
                  </>
              )}
          </AnimatePresence>,
          document.getElementById('app-viewport') ||
          document.getElementById('app-viewport') ||
          document.getElementById('modal-root') ||
          document.body
      )}

    </div>
  );
};
