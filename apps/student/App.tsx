
import React, { useEffect, useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MoodRecordModal } from './components/Dashboard/MoodRecordModal';
import { TopStatusBar } from './components/Layout/TopStatusBar';
import { ModeSwitchRail } from './components/Layout/ModeSwitchRail';
import { SubjectMap } from './components/SubjectMap/SubjectMap';
import {
  SubjectMap as PersonalizedLearningSubjectMap,
  type ExpeditionScreen,
} from './components/PersonalizedLearning/SubjectMap';
import { isExpeditionNodeId } from './components/PersonalizedLearning/expeditionMapNodes';
import { expeditionSession } from './components/PersonalizedLearning/expeditionSessionBridge';
import { MistakeVault } from './components/MistakeVault/MistakeVault';
import { GrowthProfile } from './components/Growth/GrowthProfile';
import { AchievementUnlockOverlay } from './components/Growth/AchievementUnlockOverlay';
import { BottomNav } from './components/Layout/BottomNav';
import { LearningFlow } from './components/Learning/LearningFlow'; 
import { isKgMicroLessonTask, KG_SCOPE_SECTION_PRACTICE } from './utils/kgMicroLesson';
import { AssessmentFlow } from './components/Assessment/AssessmentFlow';
import { CoinStoreModal } from './components/Store/CoinStoreModal';
import { DemoControls } from './components/Demo/DemoControls'; 
import { EssayLabContainer } from './components/EssayLab/EssayLabContainer';  
import { LumiSpace } from './components/LumiSpace/LumiSpace';
import { generateDailyPlan, setMockPersona, getUserGrowthData, completeMockAssessment, setMockNewbieCalibrated, resetMockStateForDemo } from './services/geminiService';
import { DEFAULT_USER_STATS, NEWBIE_USER_STATS, getDemoPersonaProgress } from './data/demoUserProfiles';
import { DEMO_STUDENT_ACADEMIC } from './data/studentAcademicProfile';

// New Onboarding Components
import { AuthScreen } from './components/Onboarding/AuthScreen';
import { StartupAnimation } from './components/Onboarding/StartupAnimation';
import { SplashScreen } from './components/Onboarding/SplashScreen';
import { AcademicCompass } from './components/Onboarding/AcademicCompass';
import { AssessmentGate } from './components/Onboarding/AssessmentGate';
import { OnboardingOverlay } from './components/Onboarding/OnboardingOverlay';
import { WelcomeGift } from './components/Dashboard/WelcomeGift';
import { AssessmentResult } from './components/Assessment/AssessmentResult';
import { TeacherApp } from './components/Teacher/TeacherApp';
import { recordNodePracticeComplete, KG_PRACTICE_PENDING_KEY, kgReturnNodeKey } from './services/knowledgeTreeService';
import { DashboardImmersive, type HomeRailTool } from './components/Dashboard/DashboardImmersive';
import { PracticeReturnChoice } from './components/Dashboard/PracticeReturnChoice';
import { inferSubjectLearningEntry, type LearningEntry, type LearningExitReason, type SubjectResumeView } from './types/learningReturn';
import { isJuniorGrade, type UiSchoolSystem } from './data/juniorDemoCatalog';
import { getGradeSubjects } from './data/subjectCatalog';
import { loadAcademicContext, saveAcademicContext, getDefaultAcademicContext } from './services/academicContextStore';
import { saveTextbookVersion } from './services/textbookVersionStore';
import { SelfPracticePage } from './components/Dashboard/SelfPracticePage';
import { AfterclassPracticePage } from './components/Dashboard/AfterclassPracticePage';
import { SyncStudyPickerPage } from './components/Dashboard/SyncStudyPickerPage';
import { SyncStudySubjectPage } from './components/Dashboard/SyncStudySubjectPage';
import { SettingsModal } from './components/Settings/SettingsModal';
import { AITutorLayer } from './components/Dashboard/AITutorLayer';
import { QuestionBankModal } from './components/Quiz/QuestionBankModal';
import { QuizPage } from './components/Quiz/QuizPage';
import { SteppingQuizPage } from './components/Quiz/SteppingQuizPage';
import { UniversalQuizQuestion } from './components/Quiz/UniversalQuizView';
import { UniversalQuizResult, MOCK_PRACTICE_STATE_SESSION } from './components/Quiz/UniversalQuizResult';
import { InternalAdminApp } from './components/InternalAdmin/InternalAdminApp';
import { RewardGainOverlay } from './components/Rewards/RewardGainOverlay';
import { RewardGrantResult } from './types/reward';
import {
  demoDailyConquerReward,
  demoPerfectQuizReward,
  demoVideoReward,
  grantWelcomeGift,
} from './services/rewardService';
import { setDonationStageDemoStatus, type DonationStageStatus } from './data/charityStage';

import { MockProblemView } from './components/Dashboard/ProblemPaperView';
import type { AISolveQuestion } from './data/aiSolveMockData';
import { APP_CONFIG, TABLET_DESIGN_HEIGHT, TABLET_DESIGN_SCALE } from './config/appConfig';
import { useTabletScale } from './hooks/useTabletScale';
import { resetDemoPersistentState } from './services/demoStateService';
import type {
  AcademicProfile,
  Achievement,
  DayPlan,
  LumiAccessory,
  MapMode,
  MoodOption,
  SubjectType,
  Task,
  UserJourneyPhase,
  UserPersona,
  UserStats,
} from './types';
import { findAchievementDemo } from './data/achievementDemo';

function taskFromStartInfo(
  taskInfo: Partial<Task>,
  fallback: { subject: string; idPrefix: string; reasoning: string },
): Task {
  return {
    id: taskInfo.id || `${fallback.idPrefix}-${Date.now()}`,
    title: taskInfo.title || '自选课程',
    subject: taskInfo.subject || fallback.subject,
    durationMinutes: taskInfo.durationMinutes || 15,
    completed: taskInfo.completed || false,
    aiReasoning: taskInfo.aiReasoning || fallback.reasoning,
    levelType: taskInfo.levelType,
    quizType: taskInfo.quizType,
    questionCount: taskInfo.questionCount,
    practiceDifficulty: taskInfo.practiceDifficulty,
    practiceDifficultyLabel: taskInfo.practiceDifficultyLabel,
    practiceScenario: taskInfo.practiceScenario,
    practiceScenarioLabel: taskInfo.practiceScenarioLabel,
    syncPracticeMark: taskInfo.syncPracticeMark,
    syncLesson: taskInfo.syncLesson,
    sectionVideoPlaylist: taskInfo.sectionVideoPlaylist,
    sectionPractice: taskInfo.sectionPractice,
  };
}

// Push Transition Variants
const pushVariants = {
  initial: { x: '100%', opacity: 0.5 },
  animate: { x: 0, opacity: 1 },
  exit: { x: '-100%', opacity: 0.5 }
};

const fadeVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
};

const DEMO_TOOL_RAIL_WIDTH = 96;

const App: React.FC = () => {
  // --- Global Mode State ---
  const [appMode, setAppMode] = useState<'student' | 'teacher' | 'internal'>('student');

  // --- Global Journey State ---
  const [journeyPhase, setJourneyPhase] = useState<UserJourneyPhase>('dashboard');
  const [showOnboardingOverlay, setShowOnboardingOverlay] = useState(false);
  const [userName, setUserName] = useState(DEMO_STUDENT_ACADEMIC.name); 
  const [userGrade, setUserGrade] = useState(() => loadAcademicContext().grade);
  const [textbookTerm, setTextbookTerm] = useState(() => loadAcademicContext().term);
  const [schoolSystem, setSchoolSystem] = useState<UiSchoolSystem>(() => loadAcademicContext().schoolSystem); 
  const [showWelcomeGift, setShowWelcomeGift] = useState(false);
  
  // New State for Review Mode
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isEyeCareMode, setIsEyeCareMode] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isAITutorOpen, setIsAITutorOpen] = useState(false);
  const [tutorQuestion, setTutorQuestion] = useState<AISolveQuestion | null>(null);

  // --- Dashboard State ---
  const [dayPlan, setDayPlan] = useState<DayPlan | null>(null);
  const [activeTab, setActiveTab] = useState('today');
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [forceQuizOnly, setForceQuizOnly] = useState(false); // 控制是否跳过视频，直接做题
  const [activeSubject, setActiveSubject] = useState<SubjectType>('数学');
  const [mapMode, setMapMode] = useState<MapMode>('pro');
  const [personalizedScreen, setPersonalizedScreen] = useState<ExpeditionScreen>('main');
  const [personalizedLearningSignal, setPersonalizedLearningSignal] = useState(0);
  const [currentUserPersona, setCurrentUserPersona] = useState<UserPersona>('average');
  const [learningStrategy, setLearningStrategy] = useState<'sync-mode' | 'exam-mode'>('sync-mode');
  const [isStoreOpen, setIsStoreOpen] = useState(false);
  const [isMoodModalOpen, setIsMoodModalOpen] = useState(false);
  const [selectedMoods, setSelectedMoods] = useState<MoodOption[]>([]);
  const [isEssayLabOpen, setIsEssayLabOpen] = useState(false);
  const [lumiAccessory, setLumiAccessory] = useState<LumiAccessory>('none');
  const [userStats, setUserStats] = useState<UserStats>(DEFAULT_USER_STATS);
  const [isAssessed, setIsAssessed] = useState(true);
  const [dataVersion, setDataVersion] = useState(0);
  const [showQuestionBankModal, setShowQuestionBankModal] = useState(false);
  const [questionBankSubject, setQuestionBankSubject] = useState<'math' | 'chinese' | 'english'>('math');
  const [openCharitySignal, setOpenCharitySignal] = useState(0);
  const [showQuizResultDemo, setShowQuizResultDemo] = useState(false);
  const [remedialQuestions, setRemedialQuestions] = useState<UniversalQuizQuestion[] | null>(null);
  const [showRemedialQuiz, setShowRemedialQuiz] = useState(false);
  const [showSteppingQuiz, setShowSteppingQuiz] = useState(false);
  const [steppingSubject, setSteppingSubject] = useState<'math' | 'chinese' | 'english'>('math');
  // Daily Conquer overlay state (hide BottomNav when true)
  const [isDailyConquerActive, setIsDailyConquerActive] = useState(false);
  const [isMistakeVaultDetailOpen, setIsMistakeVaultDetailOpen] = useState(false);
  const [mistakeNotificationOpenSignal, setMistakeNotificationOpenSignal] = useState(0);
  const [isSyncSectionPageOpen, setIsSyncSectionPageOpen] = useState(false);
  const [isCameraFlowOpen, setIsCameraFlowOpen] = useState(false);
  const [isTutorLayerOpen, setIsTutorLayerOpen] = useState(false);
  const [isNotificationLayerOpen, setIsNotificationLayerOpen] = useState(false);
  const [isDiscoveryFullPageOpen, setIsDiscoveryFullPageOpen] = useState(false);
  const [isCharityPageOpen, setIsCharityPageOpen] = useState(false);
  const [isTextbooksPageOpen, setIsTextbooksPageOpen] = useState(false);
  const [textbooksRevision, setTextbooksRevision] = useState(0);
  const [rewardOverlay, setRewardOverlay] = useState<RewardGrantResult | null>(null);
  const [achievementOverlay, setAchievementOverlay] = useState<Achievement | null>(null);
  const [achievementUnlockOverrides, setAchievementUnlockOverrides] = useState<Record<string, boolean>>({});
  const [lastQuizDemoResult, setLastQuizDemoResult] = useState<RewardGrantResult | null>(null);
  const [newbieLeagueOpenSignal, setNewbieLeagueOpenSignal] = useState(0);
  // 星光学榜·状态 C：已获得 XP，但当前年级人数不足 19 人，本周榜单暂未开启
  const [leagueSparse, setLeagueSparse] = useState(false);
  const [shouldSkipMapWizard, setShouldSkipMapWizard] = useState(false);
  const [openFocusSignal, setOpenFocusSignal] = useState(0);
  const [isSelfPracticeOpen, setIsSelfPracticeOpen] = useState(false);
  const [isLessonPracticeOpen, setIsLessonPracticeOpen] = useState(false);
  const [isSyncStudyPickerOpen, setIsSyncStudyPickerOpen] = useState(false);
  const [isSyncStudySubjectOpen, setIsSyncStudySubjectOpen] = useState(false);
  const [learningEntry, setLearningEntry] = useState<LearningEntry | null>(null);
  const [practiceReturnChoice, setPracticeReturnChoice] = useState<'home' | 'subject' | null>(null);
  const [resumeView, setResumeView] = useState<SubjectResumeView | null>(null);
  const [resumeViewSignal, setResumeViewSignal] = useState(0);
  const [isLumiChromeHidden, setIsLumiChromeHidden] = useState(false);
  const constraintsRef = useRef<HTMLDivElement>(null);
  const tabletHostRef = useRef<HTMLDivElement>(null);
  const tabletScale = useTabletScale(
    tabletHostRef,
    APP_CONFIG.tablet.stageWidth,
    APP_CONFIG.tablet.stageHeight,
    APP_CONFIG.features.demoControls ? DEMO_TOOL_RAIL_WIDTH : 0,
  );
  const personaProgress = getDemoPersonaProgress(currentUserPersona);

  const handleRewardGranted = (result: RewardGrantResult) => {
    if (result.xp <= 0 && result.coins <= 0) return;
    setUserStats((prev) => ({
      ...prev,
      xpToday: Math.min(prev.xpTarget, prev.xpToday + result.xp),
      weeklyXp: prev.weeklyXp + result.xp,
      coins: prev.coins + result.coins,
    }));
    setRewardOverlay(result);
    // 订正弹窗进行中时跳过 dataVersion 刷新，避免 MistakeVault 重挂载导致弹窗被关掉
    if (!isDailyConquerActive) {
      setDataVersion((v) => v + 1);
    }
  };

  const wasDailyConquerActiveRef = useRef(false);
  useEffect(() => {
    if (wasDailyConquerActiveRef.current && !isDailyConquerActive) {
      setDataVersion((v) => v + 1);
    }
    wasDailyConquerActiveRef.current = isDailyConquerActive;
  }, [isDailyConquerActive]);

  useEffect(() => {
    let cancelled = false;
    getUserGrowthData().then(data => {
        if (cancelled) return;
        setUserStats((prev) => ({
            xpToday: data.currentXp % 2000,
            xpTarget: 2000,
            studyMinutesToday: data.level * 10,
            streakDays: data.level > 10 ? 365 : data.level * 3,
            coins: data.coins,
            // weeklyXp 仅由 persona 切换 / 学习奖励更新，避免异步回写覆盖
            weeklyXp: prev.weeklyXp,
        }));
        setIsAssessed(!!data.assessmentResult);
    });
    return () => { cancelled = true; };
  }, [dataVersion]);

  useEffect(() => {
    if (activeTab !== 'mistake') {
      setIsMistakeVaultDetailOpen(false);
    }
  }, [activeTab]);

  useEffect(() => {
    let cancelled = false;
    generateDailyPlan().then((plan) => {
      if (!cancelled) setDayPlan(plan);
    });
    return () => { cancelled = true; };
  }, []);

  // --- Onboarding Journey Handlers ---
  
  const handleLoginSuccess = () => {
      setJourneyPhase('splash');
  };

  const handleStartupComplete = () => {
      setJourneyPhase('auth');
  };

  const handleSplashComplete = (name: string, grade: string) => {
      setUserName(name);
      setUserGrade(grade);
      saveAcademicContext({ grade, term: textbookTerm, schoolSystem });
      setJourneyPhase('calibration'); // Step 1: Force Calibration
  };

  const applyAcademicGrade = (grade: string) => {
      setUserGrade(grade);
      saveAcademicContext({ grade, term: textbookTerm, schoolSystem });
      const subjects = getGradeSubjects(grade, schoolSystem);
      if (!subjects.includes(activeSubject)) setActiveSubject('语文');
      setTextbooksRevision((value) => value + 1);
  };

  const applyAcademicTerm = (term: string) => {
      setTextbookTerm(term);
      saveAcademicContext({ grade: userGrade, term, schoolSystem });
      setTextbooksRevision((value) => value + 1);
  };

  const applyAcademicSystem = (system: UiSchoolSystem) => {
      const nextGrade = isJuniorGrade(userGrade, system) ? userGrade : (system === '五四制' ? '六年级' : '七年级');
      setSchoolSystem(system);
      if (nextGrade !== userGrade) setUserGrade(nextGrade);
      saveAcademicContext({ grade: nextGrade, term: textbookTerm, schoolSystem: system });
      const subjects = getGradeSubjects(nextGrade, system);
      if (!subjects.includes(activeSubject)) setActiveSubject('语文');
      setTextbooksRevision((value) => value + 1);
  };

  const handleCalibrationComplete = (profile: AcademicProfile) => {
      completeMockAssessment(profile);
      setJourneyPhase('assessment_gate'); // Step 2: Assessment Invitation
  };

  const handleSkipAssessment = () => {
      setJourneyPhase('dashboard');
      setShowOnboardingOverlay(true);
      setUserStats((prev) => (
        currentUserPersona === 'newbie' ? { ...prev, weeklyXp: 0 } : prev
      ));
      setDataVersion(v => v + 1);
  };

  const handleStartAssessment = () => {
      setJourneyPhase('assessment');
  };

  const handleAssessmentComplete = () => {
      setJourneyPhase('dashboard');
      setShowOnboardingOverlay(true); 
      setDataVersion(v => v + 1);
  };

  // --- Standard Handlers ---

  const handleAssessmentCancel = () => {
      setJourneyPhase('dashboard');
  };

  const handleRetakeAssessment = () => {
      setIsReportOpen(false);
      setJourneyPhase('assessment');
  };

  // --- Demo Control Handlers ---
  const resetBlockingOverlays = () => {
      setShowQuizResultDemo(false);
      setShowRemedialQuiz(false);
      setRemedialQuestions(null);
      setRewardOverlay(null);
      setAchievementOverlay(null);
      setShowQuestionBankModal(false);
      setIsStoreOpen(false);
      setIsReportOpen(false);
      setIsEssayLabOpen(false);
      setIsMoodModalOpen(false);
      setIsSettingsOpen(false);
      setIsAITutorOpen(false);
      setIsSelfPracticeOpen(false);
      setIsLessonPracticeOpen(false);
      setIsSyncStudyPickerOpen(false);
      setIsSyncStudySubjectOpen(false);
      setIsLumiChromeHidden(false);
      setShouldSkipMapWizard(false);
  };

  const handlePersonaSwitch = (type: UserPersona, calibrated = false, grade?: string) => {
      resetBlockingOverlays();
      setAppMode('student');
      setCurrentUserPersona(type);
      setLeagueSparse(false);
      setJourneyPhase('dashboard');
      setCurrentTask(null);
      setForceQuizOnly(false);
      setActiveTab('today');
      if (type !== 'ace') setMapMode('pro');
      if (type === 'average' && grade) {
          setUserGrade(grade);
          saveAcademicContext({ grade, term: textbookTerm, schoolSystem });
      }

      if (type === 'newbie' && calibrated) {
          setMockNewbieCalibrated();
          setUserGrade('七年级');
          saveAcademicContext({ grade: '七年级', term: textbookTerm, schoolSystem });
          setShowOnboardingOverlay(true); 
          setIsAssessed(true);
          setLumiAccessory('none');
          setUserStats({ ...NEWBIE_USER_STATS, xpToday: 200 });
      } else {
          setMockPersona(type); 
          if (type === 'newbie') {
              setUserGrade('七年级');
              saveAcademicContext({ grade: '七年级', term: textbookTerm, schoolSystem });
              setShowOnboardingOverlay(false);
              setLumiAccessory('none');
              setIsAssessed(false);
              setUserStats(NEWBIE_USER_STATS);
              setNewbieLeagueOpenSignal((s) => s + 1);
          } else {
              setShowOnboardingOverlay(false); 
              if (type === 'ace') {
                  setUserName('Hermione');
                  setLumiAccessory('glasses'); 
              } else {
                  setUserName('李华');
                  setLumiAccessory('none');
              }
              setIsAssessed(true);
              setUserStats(DEFAULT_USER_STATS);
          }
      }
      generateDailyPlan().then(setDayPlan);
      setDataVersion(prev => prev + 1); 
  };

  const handleResetDemoData = () => {
      resetDemoPersistentState();
      resetMockStateForDemo();
      setDonationStageDemoStatus('募集中');
      resetBlockingOverlays();
      setAchievementUnlockOverrides({});

      setAppMode('student');
      setJourneyPhase('dashboard');
      setCurrentUserPersona('average');
      setUserName(DEMO_STUDENT_ACADEMIC.name);
      setUserGrade(DEMO_STUDENT_ACADEMIC.grade);
      setTextbookTerm(DEMO_STUDENT_ACADEMIC.term);
      setSchoolSystem(DEMO_STUDENT_ACADEMIC.schoolSystem);
      saveAcademicContext(getDefaultAcademicContext());
      setUserStats(DEFAULT_USER_STATS);
      setIsAssessed(true);
      generateDailyPlan().then(setDayPlan);
      setCurrentTask(null);
      setForceQuizOnly(false);
      setActiveTab('today');
      setActiveSubject('数学');
      setMapMode('pro');
      setLearningStrategy('sync-mode');
      setSelectedMoods([]);
      setLumiAccessory('none');
      setIsEyeCareMode(false);
      setIsFocusMode(false);
      setShowOnboardingOverlay(false);
      setShowWelcomeGift(false);
      setShowSteppingQuiz(false);
      setIsDailyConquerActive(false);
      setIsMistakeVaultDetailOpen(false);
      setIsCameraFlowOpen(false);
      setIsTutorLayerOpen(false);
      setIsCharityPageOpen(false);
      setOpenCharitySignal(0);
      setNewbieLeagueOpenSignal(0);
      setLeagueSparse(false);
      setDataVersion((version) => version + 1);
  };

  // 演示：星光学榜·状态 C —— 已获得 XP，但年级人数不足 19 人，本周榜单暂未开启
  const handleDemoLeagueSparse = () => {
      resetBlockingOverlays();
      setAppMode('student');
      setCurrentUserPersona('average');
      setMockPersona('average');
      setUserName('李华');
      setLumiAccessory('none');
      setIsAssessed(true);
      setUserStats(DEFAULT_USER_STATS);
      setLeagueSparse(true);
      setJourneyPhase('dashboard');
      setActiveTab('today');
      setMapMode('pro');
      setNewbieLeagueOpenSignal((s) => s + 1);
      generateDailyPlan().then(setDayPlan);
      setDataVersion((version) => version + 1);
  };

  const handleJumpToMap = () => {
      resetBlockingOverlays();
      // 切换到普通学生画像以确保有数据
      setCurrentUserPersona('average');
      setMockPersona('average');
      setUserName('李华');
      setLumiAccessory('none');
      
      // 设置状态为已评估，直接进入仪表盘的地图页
      setIsAssessed(true);
      setJourneyPhase('dashboard');
      setActiveTab('subject');
      setShowOnboardingOverlay(false);
      setShouldSkipMapWizard(true); // 明确告知 SubjectMap 需要跳过向导
      setMapMode('pro');
      
      // 刷新数据
      setDataVersion(prev => prev + 1);
  };

  const handleJumpToSubject = (subject: 'math' | 'chinese' | 'english') => {
      resetBlockingOverlays();
      // 保证有数据画像
      setCurrentUserPersona('average');
      setMockPersona('average');
      setUserName('李华');
      setLumiAccessory('none');
      setIsAssessed(true);
      setJourneyPhase('dashboard');
      setActiveTab('subject');
      setShowOnboardingOverlay(false);
      setShouldSkipMapWizard(true);
      // 设置题库弹窗学科
      setQuestionBankSubject(subject);
      setShowQuestionBankModal(true);
  };

  const handleJumpToSteppingQuiz = (subject: 'math' | 'chinese' | 'english' = 'math') => {
      resetBlockingOverlays();
      setCurrentUserPersona('average');
      setMockPersona('average');
      setUserName('李华');
      setIsAssessed(true);
      setJourneyPhase('dashboard');
      setShowOnboardingOverlay(false);
      setSteppingSubject(subject);
      setShowSteppingQuiz(true);
  };

  const handleJumpToQuizResult = () => {
      const result = demoPerfectQuizReward();
      setLastQuizDemoResult(result);
      handleRewardGranted(result);
      setShowQuizResultDemo(true);
  };

  const handleDemoVideoReward = () => {
      handleRewardGranted(demoVideoReward());
  };

  const handleDemoDailyConquerReward = () => {
      const result = demoDailyConquerReward();
      handleRewardGranted(result);
      setActiveTab('mistake');
      setJourneyPhase('dashboard');
  };

  const handleDemoAchievement = (achievementId: string) => {
      const achievement = findAchievementDemo(achievementId);
      if (!achievement) return;
      resetBlockingOverlays();
      setAppMode('student');
      setCurrentUserPersona('average');
      setMockPersona('average');
      setUserName('李华');
      setIsAssessed(true);
      setJourneyPhase('dashboard');
      setActiveTab('me');
      setShowOnboardingOverlay(false);
      // 演示从“未点亮”开始；领取动作才使成就墙改变状态。
      setAchievementUnlockOverrides((current) => ({ ...current, [achievement.id]: false }));
      setAchievementOverlay(achievement);
  };

  const handleAchievementClaim = (achievement: Achievement) => {
      setAchievementUnlockOverrides((current) => ({ ...current, [achievement.id]: true }));
      setAchievementOverlay(null);
  };

  const handleOpenHomeTool = (tool: HomeRailTool) => {
      if (tool === 'mistake') {
          setActiveTab('mistake');
          setMistakeNotificationOpenSignal((signal) => signal + 1);
          return;
      }
      if (tool === 'practice') {
          setIsSelfPracticeOpen(true);
          return;
      }
      if (tool === 'lesson-practice') {
          setIsLessonPracticeOpen(true);
          return;
      }
      setIsSyncStudyPickerOpen(true);
  };

  const handleCharityStageDemo = (status: DonationStageStatus) => {
      resetBlockingOverlays();
      setDonationStageDemoStatus(status);
      setAppMode('student');
      setCurrentUserPersona('average');
      setMockPersona('average');
      setUserName('李华');
      setLumiAccessory('none');
      setIsAssessed(true);
      setJourneyPhase('dashboard');
      setActiveTab('me');
      setShowOnboardingOverlay(false);
      setOpenCharitySignal(v => v + 1);
      setDataVersion(v => v + 1);
  };

  const handleStartRemedial = (qs: UniversalQuizQuestion[]) => {
      if (!qs || qs.length === 0) return;
      setRemedialQuestions(qs);
      setShowRemedialQuiz(true);
  };

  const handleTaskComplete = (task: Task) => {
    setDayPlan((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        tasks: prev.tasks.map((t) =>
          t.id === task.id ? { ...t, completed: true } : t,
        ),
      };
    });
    if (isExpeditionNodeId(task.id)) {
      expeditionSession.pendingLevelSuccess = true;
      expeditionSession.returnScreen = 'path';
    }
  };

  const handleLearningExit = (reason: LearningExitReason = 'abort') => {
      if (reason === 'lesson-practice' && currentTask?.sectionPractice) {
          const practice = currentTask.sectionPractice;
          setForceQuizOnly(true);
          setCurrentTask({
              id: practice.id,
              title: practice.title,
              subject: currentTask.subject,
              durationMinutes: practice.durationMinutes ?? 10,
              completed: false,
              aiReasoning: KG_SCOPE_SECTION_PRACTICE,
              levelType: 'practice',
              quizType: 'standard',
              questionCount: practice.questionCount,
              practiceDifficulty: practice.practiceDifficulty,
              practiceDifficultyLabel: practice.practiceDifficultyLabel,
              practiceScenario: practice.practiceScenario,
              practiceScenarioLabel: practice.practiceScenarioLabel,
              syncPracticeMark: practice.syncPracticeMark,
          });
          setJourneyPhase('learning');
          return;
      }
      try {
          const raw = sessionStorage.getItem(KG_PRACTICE_PENDING_KEY);
          if (raw) {
              const pending = JSON.parse(raw) as {
                  nodeId: string;
                  status?: string;
                  textbookId: number;
              };
              recordNodePracticeComplete(
                  pending.nodeId,
                  pending.status as import('./knowledgeGraphTypes').KnowledgeNode['status']
              );
              sessionStorage.setItem(kgReturnNodeKey(pending.textbookId), pending.nodeId);
              sessionStorage.removeItem(KG_PRACTICE_PENDING_KEY);
              setDataVersion(v => v + 1);
          }
      } catch {
          /* ignore */
      }
      const entry = learningEntry;
      const shouldReturnToPersonalizedPath =
          !!currentTask?.id && isExpeditionNodeId(currentTask.id);
      setLearningEntry(null);
      setCurrentTask(null);
      setForceQuizOnly(false);
      setJourneyPhase('dashboard');

      if (shouldReturnToPersonalizedPath) {
          expeditionSession.returnScreen = 'path';
          setPersonalizedLearningSignal((value) => value + 1);
          setPersonalizedScreen('path');
          setMapMode('sync');
          setActiveTab('subject');
          return;
      }

      if (!entry) return;

      if (entry.from === 'home-sync') {
          setActiveTab('today');
          setIsSyncStudyPickerOpen(false);
          setIsSyncStudySubjectOpen(true);
          return;
      }
      if (entry.from === 'home-practice') {
          setActiveTab('today');
          if (reason === 'abort') {
              setIsSelfPracticeOpen(true);
          } else {
              setPracticeReturnChoice('home');
          }
          return;
      }
      if (entry.from === 'subject-practice') {
          setActiveTab('subject');
          if (reason === 'abort') {
              setResumeView('practice');
              setResumeViewSignal((value) => value + 1);
          } else {
              setPracticeReturnChoice('subject');
          }
          return;
      }
      if (entry.from === 'subject-special') {
          setActiveTab('subject');
          setResumeView(entry.special);
          setResumeViewSignal((value) => value + 1);
          return;
      }
      setActiveTab('subject');
      setResumeView(null);
  };

  const handleSubjectMapStartLevel = (taskInfo: Partial<Task>) => {
      const isMicroLesson = isKgMicroLessonTask(taskInfo as Task);
      const task = taskFromStartInfo(taskInfo, {
          subject: activeSubject,
          idPrefix: 'map',
          reasoning: '来自学科地图的自主探索',
      });
      if (isExpeditionNodeId(task.id)) {
          expeditionSession.returnScreen = 'path';
      }
      setLearningEntry(inferSubjectLearningEntry(task.id, task.aiReasoning));
      setForceQuizOnly(!isMicroLesson);
      setCurrentTask(task);
      setJourneyPhase('learning');
  };

  const statusBarVariant = (activeTab === 'today' || activeTab === 'partner') ? 'dark' : 'light';

  const handleTaskStart = (task: Task) => {
        const microLesson = isKgMicroLessonTask(task);
        setForceQuizOnly(!microLesson);
        if (task.id === 'task-assess') {
            setJourneyPhase('assessment');
        } else if (task.subject === '数学') {
            // Force math tasks to go to learning flow immediately
            setCurrentTask(task);
            setJourneyPhase('learning');
        } else if (task.title.includes('见面礼') && task.quizType !== 'reading') {
            // Fix: Ensure reading cards (which utilize 'chest' icon) don't trigger welcome gift
            setShowWelcomeGift(true);
        } else {
            setCurrentTask(task);
            setJourneyPhase('learning');
        }
    };

  const handleWelcomeGiftClaim = () => {
      setShowWelcomeGift(false);
      handleRewardGranted(grantWelcomeGift());
  };

  const handleOpenAITutor = () => {
      setTutorQuestion(null);
      setIsAITutorOpen(true);
  };

  const handleStartAISolveFromLumi = (question: AISolveQuestion) => {
      setTutorQuestion(question);
      setIsAITutorOpen(true);
  };

  const handleMoodToggle = (mood: MoodOption) => {
    setSelectedMoods(prev => {
        const exists = prev.find(m => m.value === mood.value);
        if (exists) {
            return prev.filter(m => m.value !== mood.value);
        }
        if (prev.length >= 3) return prev; // Max 3
        return [...prev, mood];
    });
  };

  const demoControls = APP_CONFIG.features.demoControls ? (
    <DemoControls
      onSwitchPersona={handlePersonaSwitch}
      onSwitchMode={setAppMode}
      onJumpToMap={handleJumpToMap}
      currentMode={appMode}
      onJumpToSubject={handleJumpToSubject}
      onJumpToQuizResult={handleJumpToQuizResult}
      onJumpToSteppingQuiz={handleJumpToSteppingQuiz}
      onDemoVideoReward={handleDemoVideoReward}
      onDemoDailyConquerReward={handleDemoDailyConquerReward}
      onSetCharityStageStatus={handleCharityStageDemo}
      onResetDemoData={handleResetDemoData}
      onDemoLeagueSparse={handleDemoLeagueSparse}
      onDemoAchievement={handleDemoAchievement}
    />
  ) : null;

  if (appMode === 'teacher') {
      return (
          <>
            <TeacherApp onSwitchBack={() => setAppMode('student')} />
            {demoControls}
            <QuestionBankModal
                isOpen={showQuestionBankModal}
                onClose={() => setShowQuestionBankModal(false)}
                onSelectQuestion={() => setShowQuestionBankModal(false)}
                subject={questionBankSubject}
                title="题库"
            />
          </>
      );
  }

  if (appMode === 'internal') {
      return (
          <>
            <InternalAdminApp onSwitchBack={() => setAppMode('student')} />
            {demoControls}
          </>
      );
  }

  return (
    <div
      ref={tabletHostRef}
      className="h-[100dvh] w-full flex justify-center items-center bg-gray-900 font-sans overflow-hidden"
      style={{ paddingRight: APP_CONFIG.features.demoControls ? DEMO_TOOL_RAIL_WIDTH : 0 }}
    >
      <div
        className="relative shrink-0"
        style={{
          width: APP_CONFIG.tablet.stageWidth * tabletScale,
          height: APP_CONFIG.tablet.stageHeight * tabletScale,
        }}
      >
      <div
        id="tablet-stage"
        ref={constraintsRef}
        className="bg-brand shadow-2xl relative overflow-hidden rounded-[40px] border-[8px] border-gray-800"
        style={{
          width: APP_CONFIG.tablet.stageWidth,
          height: APP_CONFIG.tablet.stageHeight,
          transform: `scale(${tabletScale})`,
          transformOrigin: 'top left',
        }}
      >
        <div
          id="app-viewport"
          className="app-design-surface absolute left-0 top-0 overflow-hidden"
          style={{
            width: APP_CONFIG.tablet.designWidth,
            height: TABLET_DESIGN_HEIGHT,
            transform: `scale(${TABLET_DESIGN_SCALE})`,
            transformOrigin: 'top left',
          }}
        >
        
        <AnimatePresence mode="popLayout" initial={false}>
            {journeyPhase === 'startup_animation' && (
                <motion.div key="startup" variants={fadeVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.5 }} className="absolute inset-0">
                    <StartupAnimation onComplete={handleStartupComplete} />
                </motion.div>
            )}

            {journeyPhase === 'auth' && (
                <motion.div key="auth" variants={fadeVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.5 }} className="absolute inset-0">
                    <AuthScreen onLogin={handleLoginSuccess} />
                </motion.div>
            )}

            {journeyPhase === 'splash' && (
                <motion.div key="splash" variants={pushVariants} initial="initial" animate="animate" exit="exit" transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="absolute inset-0">
                    <SplashScreen onComplete={handleSplashComplete} />
                </motion.div>
            )}

            {journeyPhase === 'calibration' && (
                <motion.div key="calibration" variants={pushVariants} initial="initial" animate="animate" exit="exit" transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="absolute inset-0">
                    <AcademicCompass grade={userGrade} onComplete={handleCalibrationComplete} />
                </motion.div>
            )}

            {journeyPhase === 'assessment_gate' && (
                <motion.div key="assessment_gate" variants={pushVariants} initial="initial" animate="animate" exit="exit" transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="absolute inset-0">
                    <AssessmentGate 
                        nickname={userName} 
                        onStartAssessment={handleStartAssessment} 
                        onSkip={handleSkipAssessment} 
                    />
                </motion.div>
            )}

            {journeyPhase === 'assessment' && (
                <motion.div key="assessment" variants={pushVariants} initial="initial" animate="animate" exit="exit" transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="absolute inset-0">
                    <AssessmentFlow 
                        onComplete={handleAssessmentComplete}
                        onCancel={handleAssessmentCancel}
                        userName={userName}
                        grade={userGrade}
                    />
                </motion.div>
            )}

            {journeyPhase === 'learning' && (
                <motion.div key="learning" variants={pushVariants} initial="initial" animate="animate" exit="exit" transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="absolute inset-0">
                    <LearningFlow 
                        key={currentTask?.id}
                        onExit={handleLearningExit} 
                        task={currentTask}
                        showVideo={!forceQuizOnly}
                        onStartRemedial={handleStartRemedial}
                        onRewardGranted={handleRewardGranted}
                        onTaskComplete={handleTaskComplete}
                        todayTaskIds={dayPlan?.tasks.map((t) => t.id)}
                        userStats={userStats}
                    />
                </motion.div>
            )}

            {journeyPhase === 'dashboard' && (
                <motion.div key="dashboard" variants={pushVariants} initial="initial" animate="animate" exit="exit" transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="absolute inset-0 flex flex-col">
                    {activeTab !== 'today' && activeTab !== 'me' && activeTab !== 'partner' && (
                        <TopStatusBar 
                            key={`status-${dataVersion}`} 
                            stats={userStats} 
                            activeSubject={activeSubject}
                            onSubjectChange={setActiveSubject}
                            currentGrade={userGrade}
                            textbookTerm={textbookTerm}
                            schoolSystem={schoolSystem}
                            showSubjectSwitcher={activeTab === 'subject'} 
                            variant={statusBarVariant}
                            learningStrategy={learningStrategy}
                            onStrategyChange={activeTab === 'subject' ? setLearningStrategy : undefined}
                            mapMode={mapMode}
                            onModeChange={setMapMode}
                        />
                    )}

                    {activeTab === 'today' ? (
                        <div className="flex-1 relative overflow-hidden">
                            <DashboardImmersive 
                                key={`immersive-${currentUserPersona}-${newbieLeagueOpenSignal}-${dataVersion}`}
                                userName={userName}
                                userLevel={personaProgress.level}
                                nextLevelXp={personaProgress.nextLevelXp}
                                xp={userStats.xpToday}
                                coins={userStats.coins}
                                weeklyXp={currentUserPersona === 'newbie' ? userStats.weeklyXp : (userStats.weeklyXp || 2100)}
                                userPersona={currentUserPersona}
                                userGrade={userGrade}
                                schoolSystem={schoolSystem}
                                openLeagueSignal={newbieLeagueOpenSignal}
                                leagueSparse={leagueSparse}
                                dayPlan={dayPlan}
                                onStartQuiz={handleTaskStart}
                                onOpenStore={() => setIsStoreOpen(true)}
                                onOpenMood={() => setIsMoodModalOpen(true)}
                                selectedMoods={selectedMoods}
                                onOpenCharity={() => {
                                    setActiveTab('me');
                                    setOpenCharitySignal(v => v + 1);
                                }}
                                onCameraFlowOpenChange={setIsCameraFlowOpen}
                                onTutorLayerOpenChange={setIsTutorLayerOpen}
                                onNotificationLayerOpenChange={setIsNotificationLayerOpen}
                                onDiscoveryFullPageOpenChange={setIsDiscoveryFullPageOpen}
                                onOpenHomeTool={handleOpenHomeTool}
                                onGoStudy={() => {
                                    if (isJuniorGrade(userGrade, schoolSystem)) {
                                        setIsSyncStudyPickerOpen(true);
                                    } else {
                                        setActiveTab('subject');
                                    }
                                }}
                            />
                        </div>
                    ) : (
                    <div className="flex-1 min-h-0 bg-surface relative z-10 overflow-hidden flex flex-col shadow-[0_-20px_60px_rgba(0,0,0,0.2)]">
                    {activeTab === 'subject' ? (
                        mapMode === 'sync' ? (
                        <div className="relative h-full min-h-0 w-full pl-14 bg-[#F5F7FA]">
                            <div className="absolute left-0 top-0 bottom-0 z-30 w-14 bg-[#FAF9F6] pointer-events-none">
                                <div className="relative pt-[72px] pointer-events-auto">
                                    <ModeSwitchRail
                                        mapMode="sync"
                                        onModeChange={setMapMode}
                                        variant="light"
                                    />
                                </div>
                            </div>
                            <PersonalizedLearningSubjectMap
                                key={`personalized-map-${activeSubject}-${dataVersion}`}
                                activeSubject={activeSubject}
                                isAssessed={isAssessed}
                                mapMode="sync"
                                onModeChange={setMapMode}
                                userPersona={currentUserPersona}
                                learningStrategy={learningStrategy}
                                onStrategyChange={setLearningStrategy}
                                onStartLevel={handleSubjectMapStartLevel}
                                demoMapEvent={null}
                                skipWizard={shouldSkipMapWizard}
                                userName={userName}
                                learningSessionSignal={personalizedLearningSignal}
                                onReturnHome={() => setActiveTab('today')}
                                onExpeditionScreenChange={setPersonalizedScreen}
                            />
                        </div>
                        ) : (
                        <SubjectMap 
                            key={`map-${activeSubject}-${dataVersion}-${textbooksRevision}`}
                            activeSubject={activeSubject}
                            onSubjectChange={setActiveSubject}
                            isAssessed={isAssessed} 
                            mapMode={mapMode}
                            onModeChange={setMapMode}
                            userPersona={currentUserPersona}
                            learningStrategy={learningStrategy}
                            onStrategyChange={setLearningStrategy}
                            onOpenEssayLab={() => {
                                setIsEssayLabOpen(true);
                            }} 
                            onDetailModeChange={setIsSyncSectionPageOpen}
                            onStartLevel={handleSubjectMapStartLevel}
                            demoMapEvent={null}
                            skipWizard={shouldSkipMapWizard}
                            userName={userName}
                            userGrade={userGrade}
                            textbookTerm={textbookTerm}
                            onTextbookTermChange={setTextbookTerm}
                            schoolSystem={schoolSystem}
                            openFocusSignal={openFocusSignal}
                            resumeView={resumeView}
                            resumeViewSignal={resumeViewSignal}
                        />
                        )
                    ) : activeTab === 'partner' ? (
                        <LumiSpace 
                            key={`lumi-${dataVersion}`}
                            onStartAISolve={handleStartAISolveFromLumi}
                            onCameraFlowOpenChange={setIsCameraFlowOpen}
                            onChromeHiddenChange={setIsLumiChromeHidden}
                        />
                    ) : activeTab === 'mistake' ? (
                        <MistakeVault 
                            key={`vault-${dataVersion}`} 
                            onOpenAITutor={handleOpenAITutor}
                            onDailyConquerOpenChange={setIsDailyConquerActive}
                            onDetailModeChange={setIsMistakeVaultDetailOpen}
                            openPendingListSignal={mistakeNotificationOpenSignal}
                            onPendingListOpened={() => setMistakeNotificationOpenSignal(0)}
                            onRewardGranted={handleRewardGranted}
                            userStats={userStats}
                            userGrade={userGrade}
                            schoolSystem={schoolSystem}
                        />
                    ) : activeTab === 'me' ? (
                        <GrowthProfile 
                            key={`growth-${dataVersion}`}
                            onStartAssessment={() => setJourneyPhase('assessment')} 
                            onOpenStore={() => setIsStoreOpen(true)}
                            onViewReport={() => setIsReportOpen(true)}
                            onOpenSettings={() => setIsSettingsOpen(true)}
                            coins={userStats.coins}
                            openCharitySignal={openCharitySignal}
                            onCharityOpenChange={setIsCharityPageOpen}
                            userGrade={userGrade}
                            textbookTerm={textbookTerm}
                            schoolSystem={schoolSystem}
                            onGradeChange={applyAcademicGrade}
                            onTextbookTermChange={applyAcademicTerm}
                            onSchoolSystemChange={applyAcademicSystem}
                            onTextbooksOpenChange={setIsTextbooksPageOpen}
                            onTextbookVersionChange={() => setTextbooksRevision((value) => value + 1)}
                            achievementUnlockOverrides={achievementUnlockOverrides}
                        />
                    ) : null}
                    </div>
                    )}
                    {!isDailyConquerActive && !isMistakeVaultDetailOpen && !isSyncSectionPageOpen && !(activeTab === 'subject' && mapMode === 'sync' && personalizedScreen !== 'main') && !isCharityPageOpen && !isTextbooksPageOpen && !isCameraFlowOpen && !isTutorLayerOpen && !isNotificationLayerOpen && !isDiscoveryFullPageOpen && !isSettingsOpen && !isStoreOpen && !isReportOpen && !isMoodModalOpen && !isEssayLabOpen && !showQuestionBankModal && !isSelfPracticeOpen && !isLessonPracticeOpen && !isSyncStudyPickerOpen && !isSyncStudySubjectOpen && !isLumiChromeHidden && (
                        <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
                    )}
                </motion.div>
            )}
        </AnimatePresence>

        {showOnboardingOverlay && (
            <OnboardingOverlay 
                onComplete={() => setShowOnboardingOverlay(false)} 
                onSwitchTab={setActiveTab} 
            />
        )}

        {showWelcomeGift && (
            <WelcomeGift 
                onClose={() => setShowWelcomeGift(false)} 
                onClaim={handleWelcomeGiftClaim}
            />
        )}

        <AnimatePresence>
            {isReportOpen && (
                <AssessmentResult 
                    onFinish={() => setIsReportOpen(false)} 
                    onRetake={handleRetakeAssessment}
                    mode="review"
                    userName={userName}
                />
            )}
        </AnimatePresence>

        <SettingsModal 
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            isEyeCareMode={isEyeCareMode}
            onToggleEyeCare={() => setIsEyeCareMode(!isEyeCareMode)}
            isFocusMode={isFocusMode}
            onToggleFocus={() => setIsFocusMode(!isFocusMode)}
        />

        <AnimatePresence>
            {isAITutorOpen && (
                <AITutorLayer 
                    onClose={() => {
                        setIsAITutorOpen(false);
                        setTutorQuestion(null);
                    }}
                    question={tutorQuestion}
                    mockProblemComponent={tutorQuestion ? undefined : <MockProblemView className="w-full" />}
                />
            )}
        </AnimatePresence>

        {/* Global Eye Care Filter */}
        <AnimatePresence>
            {isEyeCareMode && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 z-[50] pointer-events-none mix-blend-multiply bg-[#F59E0B]"
                    style={{ opacity: 0.15 }}
                />
            )}
        </AnimatePresence>

        <CoinStoreModal 
            isOpen={isStoreOpen} 
            onClose={() => setIsStoreOpen(false)} 
            coins={userStats.coins}
            onCoinsChange={(newCoins) => setUserStats(prev => ({ ...prev, coins: newCoins }))}
        />

        <MoodRecordModal
            isOpen={isMoodModalOpen}
            onClose={() => setIsMoodModalOpen(false)}
            selectedMoods={selectedMoods}
            onMoodToggle={handleMoodToggle}
        />

        <EssayLabContainer 
            isOpen={isEssayLabOpen}
            onClose={() => setIsEssayLabOpen(false)}
            defaultSubject={activeSubject}
            demoTrigger={null} 
        />

        <SelfPracticePage
            open={isSelfPracticeOpen}
            grade={userGrade}
            term={textbookTerm}
            schoolSystem={schoolSystem}
            initialSubject={activeSubject}
            onBack={() => setIsSelfPracticeOpen(false)}
            onStart={(task) => {
                setActiveSubject(task.subject as SubjectType);
                setLearningEntry({ from: 'home-practice' });
                setIsSelfPracticeOpen(false);
                setForceQuizOnly(true);
                setCurrentTask(task);
                setJourneyPhase('learning');
            }}
        />

        {isLessonPracticeOpen && (
          <div className="absolute inset-0 z-[110]">
            <AfterclassPracticePage
              grade={userGrade}
              term={textbookTerm}
              schoolSystem={schoolSystem}
              initialSubject={activeSubject}
              onBack={() => setIsLessonPracticeOpen(false)}
              onStart={(selection) => {
                setActiveSubject(selection.subject);
                saveTextbookVersion(selection.subject, selection.textbook);
                setLearningEntry({ from: 'home-practice' });
                setIsLessonPracticeOpen(false);
                setForceQuizOnly(true);
                setCurrentTask({
                  id: `home-lesson-practice-${Date.now()}`,
                  title: selection.scope === 'chapter' ? '单元测' : '一课一练',
                  subject: selection.subject,
                  durationMinutes: selection.scope === 'chapter' ? 20 : 15,
                  completed: false,
                  aiReasoning: selection.scope === 'chapter'
                    ? `${selection.chapterLabel} 单元测`
                    : `${selection.sectionLabel} 一课一练`,
                });
                setJourneyPhase('learning');
              }}
              onStartAssessment={(selection) => {
                setActiveSubject(selection.subject);
                saveTextbookVersion(selection.subject, selection.textbook);
                setLearningEntry({ from: 'home-practice' });
                setIsLessonPracticeOpen(false);
                setForceQuizOnly(true);
                setCurrentTask({
                  id: `home-primary-assessment-${Date.now()}`,
                  title: '精准练习',
                  subject: selection.subject,
                  durationMinutes: 20,
                  completed: false,
                  aiReasoning: `自选范围测评 · ${selection.sectionIds.length} 课时`,
                });
                setJourneyPhase('learning');
              }}
            />
          </div>
        )}

        <SyncStudyPickerPage
            open={isSyncStudyPickerOpen}
            grade={userGrade}
            term={textbookTerm}
            schoolSystem={schoolSystem}
            onBack={() => setIsSyncStudyPickerOpen(false)}
            onSelectSubject={(subject) => {
                setActiveSubject(subject);
                setMapMode('pro');
                setIsSyncStudyPickerOpen(false);
                setIsSyncStudySubjectOpen(true);
            }}
        />

        <SyncStudySubjectPage
            open={isSyncStudySubjectOpen}
            subject={activeSubject}
            grade={userGrade}
            term={textbookTerm}
            schoolSystem={schoolSystem}
            userName={userName}
            userPersona={currentUserPersona}
            isAssessed={isAssessed}
            onBack={() => {
                setIsSyncStudySubjectOpen(false);
                setIsSyncSectionPageOpen(false);
                setIsSyncStudyPickerOpen(true);
            }}
            onTextbookTermChange={setTextbookTerm}
            onDetailModeChange={setIsSyncSectionPageOpen}
            onOpenEssayLab={() => setIsEssayLabOpen(true)}
            onStartLevel={(taskInfo) => {
                const isMicroLesson = isKgMicroLessonTask(taskInfo as Task);
                const task = taskFromStartInfo(taskInfo, {
                    subject: activeSubject,
                    idPrefix: 'sync-home',
                    reasoning: '来自首页课本同步',
                });
                setActiveSubject(task.subject as SubjectType);
                setLearningEntry({ from: 'home-sync' });
                setIsSyncStudySubjectOpen(false);
                setIsSyncStudyPickerOpen(false);
                setIsSyncSectionPageOpen(false);
                setForceQuizOnly(!isMicroLesson);
                setCurrentTask(task);
                setJourneyPhase('learning');
            }}
        />

        <PracticeReturnChoice
            open={practiceReturnChoice !== null}
            onGoSubject={() => {
                const fromHome = practiceReturnChoice === 'home';
                setPracticeReturnChoice(null);
                if (fromHome) {
                    setActiveTab('today');
                    setIsSyncStudyPickerOpen(false);
                    setIsSyncStudySubjectOpen(true);
                    return;
                }
                setActiveTab('subject');
                setResumeView(null);
            }}
            onGoHome={() => {
                setPracticeReturnChoice(null);
                setActiveTab('today');
                setIsSelfPracticeOpen(false);
                setIsSyncStudySubjectOpen(false);
                setIsSyncStudyPickerOpen(false);
            }}
        />

        {demoControls}

        {showRemedialQuiz && (
          <QuizPage
            onExit={() => {
              setShowRemedialQuiz(false);
              setRemedialQuestions(null);
            }}
            overrideQuestions={remedialQuestions || []}
            onStartRemedial={handleStartRemedial}
            onRewardGranted={handleRewardGranted}
            userStats={userStats}
          />
        )}

        {showSteppingQuiz && (
          <SteppingQuizPage
            subject={steppingSubject}
            grade={userGrade}
            knowledgePointLabel="未知知识点探索"
            userStats={userStats}
            onExit={() => setShowSteppingQuiz(false)}
          />
        )}

        {showQuizResultDemo && (
          <div className="absolute inset-0 z-[120]">
            <UniversalQuizResult
              initialData={{
                ...MOCK_PRACTICE_STATE_SESSION,
                rewards: {
                  baseXp: lastQuizDemoResult?.xp ?? MOCK_PRACTICE_STATE_SESSION.rewards.baseXp,
                  bonusXp: 0,
                  coins: lastQuizDemoResult?.coins ?? MOCK_PRACTICE_STATE_SESSION.rewards.coins,
                },
                grantResult: lastQuizDemoResult ?? undefined,
              }}
              userStats={userStats}
              onClose={() => setShowQuizResultDemo(false)}
              onNext={() => setShowQuizResultDemo(false)}
              onRestart={() => setShowQuizResultDemo(false)}
              onStartRemedial={handleStartRemedial}
            />
          </div>
        )}

        <RewardGainOverlay
          result={rewardOverlay}
          onClose={() => setRewardOverlay(null)}
        />

        <AchievementUnlockOverlay
          achievement={achievementOverlay}
          onClaim={handleAchievementClaim}
        />

        <QuestionBankModal
            isOpen={showQuestionBankModal}
            onClose={() => setShowQuestionBankModal(false)}
            onSelectQuestion={() => setShowQuestionBankModal(false)}
            subject={questionBankSubject}
            title="题库"
        />
        
      </div>
      </div>
      </div>
    </div>
  );
};

export default App;
