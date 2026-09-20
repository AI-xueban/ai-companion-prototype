
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Play, Pause, ChevronRight, RotateCcw, Volume2, Settings, BookOpen, AlertTriangle, Languages, PenTool, Highlighter, ChevronDown, Check, Mic, MessageCircle, Zap, X, PanelLeft, ListMusic, SkipBack, SkipForward, ClipboardList } from 'lucide-react';
import { Task } from '../../types';
import { grantVideoReward } from '../../services/rewardService';
import { RewardGrantResult } from '../../types/reward';
import { isKgMicroLessonTask, isKgScopeMicroLessonTask, saveSyncLessonHighlight, getMicroLessonWatchThreshold } from '../../utils/kgMicroLesson';
import { fetchSyncMicroLessons } from '../../services/syncMicroLessonService';
import { getDemoSyncMicroLessons } from '../../data/mockSyncMicroLessons';
import type { SyncMicroLesson } from '../../types/syncMicroLesson';
import SyncMicroLessonPlaylist from './SyncMicroLessonPlaylist';
import {
  loadSyncLessonProgress,
  saveSyncLessonProgress,
  makeSectionVideoProgressId,
  getWatchRatio,
  SYNC_MICRO_LESSON_COMPLETE_RATIO,
} from '../../services/syncMicroLessonProgress';
import { getSyncLessonDurationSec } from '../../utils/syncLessonDuration';
import {
  matchPlaybackErrorDemo,
  playbackErrorDemoOf,
  type PlaybackErrorKind,
} from '../../data/playbackErrorDemo';

export interface VideoPlaylistItem {
  id: string;
  title: string;
  subtitle?: string;
  group?: 'learn' | 'practice';
}

interface VideoLessonProps {
  onComplete: (action?: 'lesson-practice') => void;
  onExit: () => void;
  task?: Task | null;
  mode?: 'learn' | 'review';
  onRewardGranted?: (result: RewardGrantResult) => void;
  playlist?: VideoPlaylistItem[];
  currentVideoId?: string;
  onSelectVideo?: (video: VideoPlaylistItem) => void;
  actionLabel?: string;
}

// --- Data Models ---

type SubjectType = '数学' | '语文' | '英语';

interface BaseLessonPoint {
  time: number; // Seconds to jump to
  id: string;
}

interface MathFormula extends BaseLessonPoint {
  latex: string; // For prototype we use text representation
  explanation: string;
  isKeyStep?: boolean;
}

interface ChineseLine extends BaseLessonPoint {
  text: string;
  translation: string;
  notes?: string[];
}

interface EnglishDialogue extends BaseLessonPoint {
  speaker: string;
  role: 'A' | 'B'; // A is usually left/interviewer, B is right/interviewee
  avatar: string;
  text: string;
  translation?: string;
}

interface LessonData {
  subject: SubjectType;
  title: string;
  duration: number;
  tabs: { id: string; label: string }[];
  content: {
    // Math
    formulas?: MathFormula[];
    pitfalls?: { title: string; desc: string }[];
    // Chinese
    poem?: { title: string; author: string; dynasty: string; lines: ChineseLine[] };
    appreciation?: { title: string; content: string }[];
    // English
    dialogue?: EnglishDialogue[];
    vocab?: { word: string; phonetics: string; meaning: string }[];
  };
}

// --- Mock Data ---

const LESSON_DB: Record<string, LessonData> = {
  '数学': {
    subject: '数学',
    title: '一元一次方程：移项与合并',
    duration: 180,
    tabs: [{ id: 'board', label: '板书笔记' }, { id: 'pitfalls', label: '易错陷阱' }],
    content: {
      formulas: [
        { id: 'step1', time: 5, latex: '2x + 5 = 15', explanation: '原方程' },
        { id: 'step2', time: 15, latex: '2x = 15 - 5', explanation: '移项：+5 变 -5', isKeyStep: true },
        { id: 'step3', time: 35, latex: '2x = 10', explanation: '合并同类项' },
        { id: 'step4', time: 50, latex: 'x = 5', explanation: '系数化为 1', isKeyStep: true },
      ],
      pitfalls: [
        { title: '移项忘记变号', desc: '这是最常见的错误！把数从等号一边移到另一边时，正号要变负号，负号变正号。' },
        { title: '等号对齐', desc: '书写步骤时，注意等号上下对齐，保持卷面整洁逻辑清晰。' }
      ]
    }
  },
  '语文': {
    subject: '语文',
    title: '古诗鉴赏：次北固山下',
    duration: 150,
    tabs: [{ id: 'poem', label: '原文精读' }, { id: 'analysis', label: '名师赏析' }],
    content: {
      poem: {
        title: '次北固山下',
        author: '王湾',
        dynasty: '唐',
        lines: [
          { id: 'l1', time: 5, text: '客路青山外，行舟绿水前。', translation: '旅途在青山之外，行舟于绿水之中。', notes: ['客路：旅途', '青山：指北固山'] },
          { id: 'l2', time: 15, text: '潮平两岸阔，风正一帆悬。', translation: '潮水上涨，两岸之间水面宽阔；顺风行船，一片白帆高高挂起。' },
          { id: 'l3', time: 30, text: '海日生残夜，江春入旧年。', translation: '夜幕还没有褪尽，旭日已在江上冉冉升起；还在旧年时分，江南已有了春天的气息。' },
          { id: 'l4', time: 45, text: '乡书何处达？归雁洛阳边。', translation: '寄出去的家信不知何时才能到达？希望北归的大雁捎到洛阳去。' },
        ]
      },
      appreciation: [
        { title: '写作背景', content: '诗人王湾往来于吴、楚间，途经北固山下，见大江直流，波平浪静，景色壮阔，遂有此作。' },
        { title: '哲理升华', content: '“海日生残夜，江春入旧年”不仅写景逼真，叙事确切，而且表现出具有普遍意义的生活真理，给人以乐观、积极、向上的艺术鼓舞力量。' }
      ]
    }
  },
  '英语': {
    subject: '英语',
    title: 'Unit 3: Daily Routine',
    duration: 120,
    tabs: [{ id: 'script', label: '情景对话' }, { id: 'vocab', label: '核心词汇' }],
    content: {
      dialogue: [
        { id: 'd1', time: 2, speaker: 'Rick', role: 'A', avatar: '👦', text: 'Hi Scott. What time do you usually get up?', translation: '嗨 Scott，你通常几点起床？' },
        { id: 'd2', time: 8, speaker: 'Scott', role: 'B', avatar: '🧑‍🦱', text: 'I usually get up at six thirty.', translation: '我通常六点半起床。' },
        { id: 'd3', time: 14, speaker: 'Rick', role: 'A', avatar: '👦', text: 'That\'s early! Do you exercise?', translation: '真早啊！你会锻炼吗？' },
        { id: 'd4', time: 19, speaker: 'Scott', role: 'B', avatar: '🧑‍🦱', text: 'Yes. I usually run at seven o\'clock.', translation: '是的，我通常七点钟跑步。' },
        { id: 'd5', time: 26, speaker: 'Rick', role: 'A', avatar: '👦', text: 'Then what time do you go to school?', translation: '那你几点去学校？' },
        { id: 'd6', time: 32, speaker: 'Scott', role: 'B', avatar: '🧑‍🦱', text: 'At eight o\'clock. I take the bus.', translation: '八点。我坐公交车去。' },
      ],
      vocab: [
        { word: 'usually', phonetics: '/ˈjuːʒuəli/', meaning: 'adv. 通常地；一般地' },
        { word: 'get up', phonetics: '/ɡet ʌp/', meaning: 'phr. 起床；站起' },
        { word: 'exercise', phonetics: '/ˈeksəsaɪz/', meaning: 'v. & n. 锻炼；练习' },
        { word: 'o\'clock', phonetics: '/əˈklɒk/', meaning: 'adv. …点钟' },
        { word: 'take the bus', phonetics: '-', meaning: 'phr. 乘公交车' },
      ]
    }
  }
};

export const VideoLesson: React.FC<VideoLessonProps> = ({ onComplete, onExit, task, onRewardGranted }) => {
  // 1. Identify Subject & Load Data
  const subjectStr = task?.subject || '数学';
  // Fallback map for loose matching
  const mapSubject = (s: string): SubjectType => {
      // Fix: Check for English first because "英语" contains "语" which would match Chinese
      if (s.includes('英')) return '英语'; 
      if (s.includes('数')) return '数学';
      if (s.includes('语') || s.includes('诗')) return '语文';
      return '数学';
  };
  const activeSubject = mapSubject(subjectStr);
  const data = LESSON_DB[activeSubject];
  const isScopeSyncLesson = isKgScopeMicroLessonTask(task);
  const [activeSyncLesson, setActiveSyncLesson] = useState<SyncMicroLesson | null>(null);
  const [syncPlaylist, setSyncPlaylist] = useState<SyncMicroLesson[]>([]);
  const [playlistLoading, setPlaylistLoading] = useState(false);
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const [showEndPrompt, setShowEndPrompt] = useState(false);
  const [playbackError, setPlaybackError] = useState<PlaybackErrorKind | null>(null);
  const [retryFlash, setRetryFlash] = useState(false);
  const sectionPlaylist = task?.sectionVideoPlaylist;

  const displayTitle = isScopeSyncLesson && activeSyncLesson?.title
    ? activeSyncLesson.title
    : isKgMicroLessonTask(task) && task?.title
      ? task.title
      : data.title;
  const syncKpoints = activeSyncLesson
    ? activeSyncLesson.kpoint_list.map((k) => k.title)
    : task?.syncLesson?.kpointTitles ?? [];
  const playbackDuration = isScopeSyncLesson && activeSyncLesson
    ? getSyncLessonDurationSec(activeSyncLesson, task?.durationMinutes ?? 6)
    : data.duration;

  // 2. Player State
  const [isPlaying, setIsPlaying] = useState(() => isKgMicroLessonTask(task));
  const [progress, setProgress] = useState(0); // 0-100
  const [currentTime, setCurrentTime] = useState(0); // seconds
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [videoQuality, setVideoQuality] = useState<'hd' | 'uhd'>('hd');
  const [effectiveWatchedSec, setEffectiveWatchedSec] = useState(0);
  const [watchToast, setWatchToast] = useState<string | null>(null);
  const [thresholdReached, setThresholdReached] = useState(false);
  
  // 3. UI State
  const [activeTabId, setActiveTabId] = useState(data.tabs[0].id);
  const [sidePanelOpen, setSidePanelOpen] = useState(() => !isKgMicroLessonTask(task));
  
  // Ref for auto-scrolling dialogue
  const scrollRef = useRef<HTMLDivElement>(null);

  const effectiveWatchRatio = playbackDuration > 0
    ? Math.min(100, (effectiveWatchedSec / playbackDuration) * 100)
    : 0;
  const requiredWatchRatio = getMicroLessonWatchThreshold(task);
  const requiredWatchSec = (requiredWatchRatio / 100) * playbackDuration;

  const panelTabs = isScopeSyncLesson
    ? [{ id: 'kpoints', label: '本节知识点' }]
    : data.tabs;

  useEffect(() => {
    if (isScopeSyncLesson) {
      setActiveTabId('kpoints');
    }
  }, [isScopeSyncLesson, task?.id]);

  useEffect(() => {
    setSidePanelOpen(!isKgMicroLessonTask(task));
  }, [task?.id, task?.aiReasoning]);

  useEffect(() => {
    setThresholdReached(false);
  }, [task?.id, requiredWatchRatio]);

  useEffect(() => {
    if (!isScopeSyncLesson) {
      setSyncPlaylist([]);
      setActiveSyncLesson(null);
      return;
    }

    if (sectionPlaylist?.items.length) {
      const lessons: SyncMicroLesson[] = sectionPlaylist.items.map((item, index) => {
        return {
          id: makeSectionVideoProgressId(item.id, index),
          title: item.title,
          cover_url: '',
          kpoint_list: [{ id: index + 1, title: item.topicTitle || item.title }],
          duration_sec: item.durationSec > 0 ? item.durationSec : 20,
          topicTitle: item.topicTitle,
        };
      });
      const startIndex = Math.min(Math.max(sectionPlaylist.currentIndex, 0), lessons.length - 1);
      setSyncPlaylist(lessons);
      setActiveSyncLesson(lessons[startIndex] ?? lessons[0]);
      setPlaylistLoading(false);
      return;
    }

    if (!task?.syncLesson) {
      const fallbackId = Math.abs(
        [...(task?.id ?? 'sync-lesson')].reduce((hash, char) => ((hash * 31) + char.charCodeAt(0)) | 0, 0),
      ) || 1;
      const currentFromEntry: SyncMicroLesson = {
        id: fallbackId,
        title: task?.title ?? '同步课堂',
        cover_url: '',
        kpoint_list: [{ id: fallbackId, title: task?.title ?? '同步课堂' }],
        duration_sec: (task?.durationMinutes ?? 8) * 60,
      };
      setSyncPlaylist([currentFromEntry]);
      setActiveSyncLesson(currentFromEntry);
      return;
    }

    const demoPlaylist = getDemoSyncMicroLessons();
    setSyncPlaylist(demoPlaylist);

    const { textbookId, chapterId, sectionId, scopeLabel, kpointIds, lessonId, coverUrl } = task.syncLesson;
    const currentFromTask: SyncMicroLesson = {
      id: lessonId,
      title: task.title,
      cover_url: coverUrl,
      kpoint_list: kpointIds.map((id, i) => ({
        id,
        title: task.syncLesson!.kpointTitles[i] ?? '',
      })),
    };
    const merged = demoPlaylist.some((l) => l.id === currentFromTask.id)
      ? demoPlaylist
      : [currentFromTask, ...demoPlaylist];
    setSyncPlaylist(merged);
    setActiveSyncLesson(merged.find((l) => l.id === lessonId) ?? currentFromTask);

    let cancelled = false;
    setPlaylistLoading(true);
    fetchSyncMicroLessons(
      { textbookId, chapterId: chapterId ?? 0, sectionId, scopeLabel: scopeLabel ?? '' },
      kpointIds.map(String),
    )
      .then((lessons) => {
        if (cancelled) return;
        const playlist = merged.length > 0 ? merged : lessons.length > 0 ? lessons : demoPlaylist;
        setSyncPlaylist(playlist);
        setActiveSyncLesson(playlist.find((l) => l.id === lessonId) ?? currentFromTask);
      })
      .finally(() => {
        if (!cancelled) setPlaylistLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isScopeSyncLesson, task?.id, task?.syncLesson?.lessonId, sectionPlaylist]);

  useEffect(() => {
    if (!activeSyncLesson) return;
    const errorKind = matchPlaybackErrorDemo(activeSyncLesson.title)
      ?? matchPlaybackErrorDemo(task?.title);
    setPlaybackError(errorKind);
    setShowEndPrompt(false);
    if (errorKind) {
      setCurrentTime(0);
      setProgress(0);
      setEffectiveWatchedSec(0);
      setThresholdReached(false);
      setIsPlaying(false);
      return;
    }
    const saved = loadSyncLessonProgress(activeSyncLesson.id);
    const duration = saved?.durationSec || playbackDuration;
    const completed = getWatchRatio(saved, duration) >= SYNC_MICRO_LESSON_COMPLETE_RATIO;
    if (saved && !completed && saved.currentSec > 0) {
      setCurrentTime(Math.min(saved.currentSec, duration || saved.currentSec));
      setEffectiveWatchedSec(saved.effectiveSec);
    } else {
      setCurrentTime(0);
      setEffectiveWatchedSec(saved?.effectiveSec ?? 0);
    }
    setProgress(0);
    setThresholdReached(false);
    setIsPlaying(true);
  }, [activeSyncLesson?.id, task?.title]);

  const persistWatchProgress = (lesson: SyncMicroLesson) => {
    if (matchPlaybackErrorDemo(lesson.title)) return;
    saveSyncLessonProgress(lesson.id, {
      currentSec: currentTime,
      effectiveSec: effectiveWatchedSec,
      durationSec: getSyncLessonDurationSec(lesson, task?.durationMinutes ?? 6),
      updatedAt: Date.now(),
      maxPlayedSec: Math.max(currentTime, effectiveWatchedSec),
    });
  };

  const handleSelectPlaylistLesson = (lesson: SyncMicroLesson) => {
    if (lesson.id === activeSyncLesson?.id) {
      setPlaylistOpen(false);
      return;
    }
    switchToSyncLesson(lesson);
    setPlaylistOpen(false);
  };

  const switchToSyncLesson = (lesson: SyncMicroLesson) => {
    if (activeSyncLesson && activeSyncLesson.id !== lesson.id) {
      persistWatchProgress(activeSyncLesson);
    }
    setShowEndPrompt(false);
    setActiveSyncLesson(lesson);
  };

  const activeLessonIndex = activeSyncLesson
    ? syncPlaylist.findIndex((l) => l.id === activeSyncLesson.id)
    : -1;
  const showPlaylistNav = isScopeSyncLesson && syncPlaylist.length >= 2 && activeLessonIndex >= 0;
  const isFirstInPlaylist = activeLessonIndex === 0;
  const isLastInPlaylist = activeLessonIndex === syncPlaylist.length - 1;
  const hasSectionPractice = Boolean(sectionPlaylist && task?.sectionPractice) && activeSubject !== '英语';
  const endPromptIsLast = !showPlaylistNav || isLastInPlaylist;

  const handleReplayCurrent = () => {
    setShowEndPrompt(false);
    setCurrentTime(0);
    setProgress(0);
    setIsPlaying(true);
  };

  const handleRetryPlayback = () => {
    if (!playbackError) return;
    setRetryFlash(true);
    window.setTimeout(() => setRetryFlash(false), 600);
    setIsPlaying(false);
  };

  const handlePlayNextInSection = () => {
    if (!showPlaylistNav || isLastInPlaylist) return;
    switchToSyncLesson(syncPlaylist[activeLessonIndex + 1]);
  };

  const handlePlaylistPrev = () => {
    if (!showPlaylistNav || isFirstInPlaylist) return;
    switchToSyncLesson(syncPlaylist[activeLessonIndex - 1]);
  };

  const handlePlaylistNext = () => {
    if (!showPlaylistNav) return;
    if (isLastInPlaylist) {
      if (hasSectionPractice) {
        setIsPlaying(false);
        setShowEndPrompt(true);
        return;
      }
      handleCompleteLesson();
      return;
    }
    switchToSyncLesson(syncPlaylist[activeLessonIndex + 1]);
  };

  const videoId = activeSyncLesson
    ? `sync-lesson-${activeSyncLesson.id}`
    : task?.id ?? `video_${activeSubject}_${data.title}`;

  const handleCompleteLesson = () => {
    if (activeSyncLesson) persistWatchProgress(activeSyncLesson);

    if (isScopeSyncLesson) {
      if (effectiveWatchRatio >= requiredWatchRatio) {
        const result = grantVideoReward({
          videoId,
          durationSec: playbackDuration,
          effectiveWatchRatio,
          isMicroLesson: true,
          requiredWatchRatio,
        });
        if (result.xp > 0 || result.coins > 0) {
          onRewardGranted?.(result);
        }
      }
      if (task?.syncLesson) {
        const kpointIds = activeSyncLesson
          ? activeSyncLesson.kpoint_list.map((k) => k.id)
          : task.syncLesson.kpointIds;
        saveSyncLessonHighlight(task.syncLesson.textbookId, kpointIds);
      }
      onComplete(hasSectionPractice ? 'lesson-practice' : undefined);
      return;
    }

    const result = grantVideoReward({
      videoId,
      durationSec: playbackDuration,
      effectiveWatchRatio,
      isMicroLesson: isKgMicroLessonTask(task),
      requiredWatchRatio,
    });
    if (result.xp > 0 || result.coins > 0) {
      onRewardGranted?.(result);
    } else if (effectiveWatchRatio < requiredWatchRatio) {
      const remainMin = Math.max(1, Math.ceil((requiredWatchSec - effectiveWatchedSec) / 60));
      window.alert(`有效观看未达标，再看约 ${remainMin} 分钟即可获得奖励`);
      return;
    }
    onComplete();
  };

  // Auto-Simulation of Video Progress
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (isPlaying && !playbackError) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
           if (prev >= playbackDuration) {
               setIsPlaying(false);
               return playbackDuration;
           }
           return prev + (0.5 * playbackSpeed);
        });
        setEffectiveWatchedSec((prev) => Math.min(playbackDuration, prev + 0.5 * playbackSpeed));
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, playbackDuration, playbackSpeed, playbackError]);

  useEffect(() => {
    if (playbackError) return;
    if (!sectionPlaylist?.items.length || playbackDuration <= 0) return;
    if (currentTime < playbackDuration) return;
    setIsPlaying(false);
    setShowEndPrompt(true);
  }, [currentTime, playbackDuration, sectionPlaylist?.items.length, playbackError]);

  const watchProgressRef = useRef({ currentTime, effectiveWatchedSec, playbackDuration });
  watchProgressRef.current = { currentTime, effectiveWatchedSec, playbackDuration };

  useEffect(() => {
    if (!activeSyncLesson || !isScopeSyncLesson || playbackError) return;
    const persist = () => {
      const snap = watchProgressRef.current;
      saveSyncLessonProgress(activeSyncLesson.id, {
        currentSec: snap.currentTime,
        effectiveSec: snap.effectiveWatchedSec,
        durationSec: snap.playbackDuration,
        updatedAt: Date.now(),
        maxPlayedSec: Math.max(snap.currentTime, snap.effectiveWatchedSec),
      });
    };
    const timer = setInterval(persist, 1000);
    return () => {
      clearInterval(timer);
      persist();
    };
  }, [activeSyncLesson?.id, isScopeSyncLesson, playbackError]);

  useEffect(() => {
    if (!thresholdReached && effectiveWatchRatio >= requiredWatchRatio) {
      setThresholdReached(true);
      const xpPreview = playbackDuration < 180 ? 15 : playbackDuration <= 480 ? 20 : 25;
      setWatchToast(`+${xpPreview} XP，继续加油`);
      const t = setTimeout(() => setWatchToast(null), 2800);
      return () => clearTimeout(t);
    }
  }, [effectiveWatchRatio, thresholdReached, playbackDuration, requiredWatchRatio]);

  // Sync Progress Bar
  useEffect(() => {
      setProgress((currentTime / playbackDuration) * 100);
  }, [currentTime, playbackDuration]);
  
  // Auto-scroll logic for Script
  useEffect(() => {
      if (activeSubject === '英语' && isPlaying) {
          const activeEl = document.getElementById(`dialogue-${Math.floor(currentTime)}`); // approximate mapping or use ID logic
          // A better way is finding the active line ID and scrolling to it
          const currentLine = data.content.dialogue?.find((l, idx, arr) => {
             const next = arr[idx + 1];
             return currentTime >= l.time && (!next || currentTime < next.time);
          });
          
          if (currentLine) {
             const el = document.getElementById(`msg-${currentLine.id}`);
             if (el && scrollRef.current) {
                 // Smooth scroll to element
                 el.scrollIntoView({ behavior: 'smooth', block: 'center' });
             }
          }
      }
  }, [currentTime, activeSubject, isPlaying, data.content.dialogue]);

  const handleSeek = (time: number) => {
      setCurrentTime(time);
      setIsPlaying(true);
  };

  const formatTime = (seconds: number) => {
      const m = Math.floor(seconds / 60);
      const s = Math.floor(seconds % 60);
      return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // --- RENDERERS ---

  // A. The Video Player Area (Subject Specific Visuals)
  const renderPlayerVisual = () => {
    if (task?.syncLesson?.coverUrl || activeSyncLesson?.cover_url) {
      return (
        <div className="absolute inset-0 bg-black overflow-hidden">
          <img
            src={activeSyncLesson?.cover_url ?? task!.syncLesson!.coverUrl}
            alt=""
            className="w-full h-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/40" />
          {isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="px-4 py-2 rounded-full bg-black/50 text-white/90 text-xs font-bold border border-white/20 backdrop-blur-sm">
                同步课堂播放中…
              </div>
            </div>
          )}
        </div>
      );
    }

    // 1. MATH: Logic Board
    if (activeSubject === '数学') {
        const currentFormula = data.content.formulas?.slice().reverse().find(f => f.time <= currentTime);
        return (
            <div className="absolute inset-0 bg-[#1a1d21] flex flex-col items-center justify-center p-8 overflow-hidden">
                {/* Grid Background */}
                <div className="absolute inset-0 opacity-10" 
                     style={{backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px'}}>
                </div>
                
                {/* Simulated Writing Content */}
                <AnimatePresence mode="wait">
                    {currentFormula ? (
                        <motion.div 
                            key={currentFormula.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.1 }}
                            className="text-white text-center z-10"
                        >
                            <div className="text-4xl md:text-5xl font-mono font-bold mb-4 text-blue-100 tracking-wider">
                                {currentFormula.latex}
                            </div>
                            <div className="inline-block px-3 py-1 bg-blue-500/20 text-blue-300 rounded-lg text-sm border border-blue-500/30">
                                {currentFormula.explanation}
                            </div>
                        </motion.div>
                    ) : (
                        <div className="text-gray-500 font-mono text-sm">Waiting for teacher...</div>
                    )}
                </AnimatePresence>

                {/* Teacher Avatar / Cursor Mock */}
                <motion.div 
                    animate={{ x: [0, 10, 0], y: [0, 5, 0] }}
                    transition={{ repeat: Infinity, duration: 4 }}
                    className="absolute bottom-4 right-4 flex items-center gap-2 opacity-50"
                >
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">师</div>
                    <span className="text-xs text-gray-400">正在讲解...</span>
                </motion.div>
            </div>
        );
    }

    // 2. CHINESE: Ink Scroll
    if (activeSubject === '语文') {
        const currentLine = data.content.poem?.lines.find((l, idx, arr) => {
            const next = arr[idx + 1];
            return currentTime >= l.time && (!next || currentTime < next.time);
        });

        return (
            <div className="absolute inset-0 bg-[#fdfbf7] flex flex-col items-center justify-center overflow-hidden">
                {/* Ink Background */}
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/shattered-island.png')]"></div>
                
                {/* Animated Poem Line */}
                <AnimatePresence mode="wait">
                    {currentLine ? (
                        <motion.div 
                            key={currentLine.id}
                            initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                            exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
                            transition={{ duration: 0.8 }}
                            className="z-10 text-center px-8"
                        >
                            <h2 className="text-3xl md:text-4xl font-black text-gray-800 mb-4 font-serif leading-relaxed" style={{ textShadow: '2px 2px 0px rgba(0,0,0,0.05)' }}>
                                {currentLine.text}
                            </h2>
                            <p className="text-gray-500 font-serif italic text-sm md:text-base border-t border-gray-200 pt-4 inline-block px-4">
                                {currentLine.translation}
                            </p>
                        </motion.div>
                    ) : (
                         <div className="z-10 flex flex-col items-center">
                            <span className="text-2xl font-black text-gray-800 font-serif mb-2">{data.content.poem?.title}</span>
                            <span className="text-sm text-gray-500 font-serif bg-red-50 text-red-800 px-2 py-0.5 rounded border border-red-100">{data.content.poem?.dynasty} · {data.content.poem?.author}</span>
                         </div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    // 3. ENGLISH: Immersive Dialogue Mode
    if (activeSubject === '英语') {
        const currentLine = data.content.dialogue?.find((l, idx, arr) => {
             const next = arr[idx + 1];
             return currentTime >= l.time && (!next || currentTime < next.time);
        });

        return (
            <div className="absolute inset-0 bg-gradient-to-br from-teal-900 via-[#0f2e2e] to-emerald-950 flex flex-col items-center justify-center overflow-hidden">
                 {/* Ambient Blobs */}
                 <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-emerald-500/10 rounded-full blur-[80px] animate-pulse"></div>
                 <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-teal-400/10 rounded-full blur-[60px]"></div>

                 {/* Center Stage Content */}
                 <AnimatePresence mode="wait">
                    {currentLine ? (
                        <motion.div 
                            key={currentLine.id}
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            className="flex flex-col items-center z-10 px-8 w-full max-w-2xl text-center"
                        >
                            {/* Avatar with Ring */}
                            <div className="relative mb-8">
                                <motion.div 
                                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                    className="absolute inset-0 rounded-full border-2 border-emerald-400/30"
                                />
                                <div className="w-24 h-24 rounded-full bg-white/10 backdrop-blur-md border border-emerald-400/50 flex items-center justify-center text-5xl shadow-[0_0_30px_rgba(52,211,153,0.2)]">
                                    {currentLine.avatar}
                                </div>
                                <div className="absolute -bottom-3 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-lg">
                                    {currentLine.speaker}
                                </div>
                            </div>

                            {/* Text */}
                            <h2 className="text-2xl md:text-3xl font-black text-white leading-relaxed mb-4 drop-shadow-md">
                                {currentLine.text}
                            </h2>
                            {currentLine.translation && (
                                <p className="text-emerald-200/60 font-medium text-lg">
                                    {currentLine.translation}
                                </p>
                            )}
                        </motion.div>
                    ) : (
                        <div className="z-10 text-white/30 text-center">
                            <Languages size={48} className="mx-auto mb-4 opacity-50" />
                            <p className="font-bold tracking-widest uppercase">Listening Section</p>
                        </div>
                    )}
                 </AnimatePresence>
            </div>
        );
    }
  };

  // B. Content Area (Below Video)
  const renderContentArea = () => {
    if (isScopeSyncLesson) {
      if (syncKpoints.length === 0) {
        return (
          <div className="p-5 pb-40 text-sm text-slate-400 font-medium text-center">
            暂无关联知识点
          </div>
        );
      }
      return (
        <div className="p-5 pb-40 flex flex-col gap-3">
          <p className="text-xs font-bold text-slate-500">本课覆盖知识点</p>
          {syncKpoints.map((title) => (
            <div
              key={title}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-indigo-50 border border-indigo-100 text-sm font-bold text-indigo-900"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
              {title}
            </div>
          ))}
        </div>
      );
    }

    // 1. Math Content
    if (activeSubject === '数学') {
        if (activeTabId === 'board') {
            return (
                <div className="flex flex-col gap-4 p-4 md:p-6 pb-40">
                     {data.content.formulas?.map((formula, idx) => {
                         const isActive = currentTime >= formula.time && (!data.content.formulas![idx+1] || currentTime < data.content.formulas![idx+1].time);
                         return (
                            <button 
                                key={formula.id}
                                onClick={() => handleSeek(formula.time)}
                                className={`group flex items-start gap-4 p-4 rounded-2xl border-2 transition-all text-left ${isActive ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-white border-transparent hover:border-gray-100 hover:bg-gray-50'}`}
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${isActive ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-400 group-hover:bg-blue-100 group-hover:text-blue-500'}`}>
                                    {idx + 1}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className={`text-xs font-bold ${isActive ? 'text-blue-600' : 'text-gray-400'}`}>{formula.explanation}</span>
                                        <span className="text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded font-mono group-hover:text-blue-500">{formatTime(formula.time)}</span>
                                    </div>
                                    <div className={`font-mono text-lg font-bold ${isActive ? 'text-gray-900' : 'text-gray-600'}`}>
                                        {formula.latex}
                                    </div>
                                </div>
                                {formula.isKeyStep && (
                                    <div className="mt-1 text-amber-500">
                                        <PenTool size={16} />
                                    </div>
                                )}
                            </button>
                         )
                     })}
                </div>
            )
        } else {
            return (
                <div className="flex flex-col gap-4 p-4 md:p-6 pb-40">
                    {data.content.pitfalls?.map((pit, idx) => (
                        <div key={idx} className="bg-red-50 border border-red-100 rounded-2xl p-4 flex gap-4">
                            <div className="mt-1 text-red-500 shrink-0">
                                <AlertTriangle size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-red-800 text-base mb-1">{pit.title}</h4>
                                <p className="text-red-700/80 text-sm leading-relaxed">{pit.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )
        }
    }

    // 2. Chinese Content
    if (activeSubject === '语文') {
        if (activeTabId === 'poem') {
            return (
                <div className="flex flex-col items-center py-8 pb-40 px-4 text-center">
                    <h1 className="text-2xl font-black text-gray-900 font-serif mb-2 tracking-widest">{data.content.poem?.title}</h1>
                    <div className="text-xs text-gray-400 font-bold mb-8 bg-gray-100 px-3 py-1 rounded-full">
                        [{data.content.poem?.dynasty}] {data.content.poem?.author}
                    </div>

                    <div className="flex flex-col gap-8 w-full max-w-md">
                        {data.content.poem?.lines.map((line) => {
                             const isActive = currentTime >= line.time && currentTime < (line.time + 10); // Simple duration logic
                             return (
                                <button 
                                    key={line.id}
                                    onClick={() => handleSeek(line.time)}
                                    className={`relative transition-all duration-500 p-4 rounded-xl ${isActive ? 'scale-110 bg-amber-50 shadow-sm' : 'hover:bg-gray-50 opacity-60 hover:opacity-100'}`}
                                >
                                    <p className={`text-xl md:text-2xl font-bold font-serif mb-2 ${isActive ? 'text-gray-900' : 'text-gray-600'}`}>
                                        {line.text}
                                    </p>
                                    {isActive && (
                                        <motion.p 
                                            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                                            className="text-amber-700 text-sm font-medium"
                                        >
                                            {line.translation}
                                        </motion.p>
                                    )}
                                    {line.notes && isActive && (
                                        <div className="flex flex-wrap justify-center gap-2 mt-3">
                                            {line.notes.map((n, i) => (
                                                <span key={i} className="text-[10px] bg-white border border-amber-200 text-amber-600 px-2 py-0.5 rounded shadow-sm">
                                                    {n}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </button>
                             )
                        })}
                    </div>
                </div>
            )
        }
        // Analysis Tab
        return (
            <div className="p-6 pb-40 flex flex-col gap-6">
                {data.content.appreciation?.map((sec, i) => (
                    <div key={i}>
                        <h3 className="font-bold text-gray-800 text-lg mb-2 flex items-center gap-2">
                            <span className="w-1 h-5 bg-red-400 rounded-full"></span>
                            {sec.title}
                        </h3>
                        <p className="text-gray-600 leading-loose text-justify text-sm">
                            {sec.content}
                        </p>
                    </div>
                ))}
            </div>
        )
    }

    // 3. ENGLISH: Chat Stream & Vocab Cards
    if (activeSubject === '英语') {
        if (activeTabId === 'script') {
            return (
                <div ref={scrollRef} className="flex flex-col gap-6 p-6 pb-40">
                     {data.content.dialogue?.map((line) => {
                         const isActive = currentTime >= line.time && currentTime < (line.time + 5); 
                         const isMe = line.role === 'B'; // Let's assume Role B is "Right Side"
                         
                         return (
                             <motion.div 
                                id={`msg-${line.id}`}
                                key={line.id} 
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className={`flex gap-3 w-full ${isMe ? 'flex-row-reverse' : ''}`}
                             >
                                 {/* Avatar */}
                                 <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 border shadow-sm mt-1 transition-all duration-300 ${isActive ? 'ring-2 ring-emerald-400 scale-110 bg-emerald-50 border-emerald-200' : 'bg-white border-gray-100 grayscale opacity-80'}`}>
                                     {line.avatar}
                                 </div>
                                 
                                 {/* Bubble */}
                                 <div className={`flex flex-col max-w-[80%] ${isMe ? 'items-end' : 'items-start'}`}>
                                     <button 
                                         onClick={() => handleSeek(line.time)}
                                         className={`px-5 py-4 text-left shadow-sm transition-all border group relative overflow-hidden ${
                                             isActive 
                                                 ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-200 shadow-md scale-[1.02]' 
                                                 : 'bg-white border-gray-100 hover:bg-gray-50 text-gray-700'
                                         } ${isMe ? 'rounded-2xl rounded-tr-sm' : 'rounded-2xl rounded-tl-sm'}`}
                                     >
                                         <div className="flex items-center justify-between gap-4 mb-1">
                                            <span className={`text-[10px] font-black uppercase tracking-wider ${isActive ? 'text-emerald-200' : 'text-gray-400'}`}>
                                                {line.speaker}
                                            </span>
                                            {isActive && <Volume2 size={12} className="text-white animate-pulse" />}
                                         </div>
                                         <p className={`font-bold text-base md:text-lg leading-relaxed ${isActive ? 'text-white' : 'text-gray-800'}`}>
                                             {line.text}
                                         </p>
                                         {line.translation && (
                                             <p className={`text-sm mt-2 pt-2 border-t border-dashed ${isActive ? 'border-white/20 text-emerald-100' : 'border-gray-100 text-gray-400'}`}>
                                                 {line.translation}
                                             </p>
                                         )}
                                     </button>
                                 </div>
                             </motion.div>
                         )
                     })}
                </div>
            )
        }
        // Vocab Tab - Flashcards Grid
        return (
            <div className="p-4 pb-40 grid grid-cols-1 sm:grid-cols-2 gap-4">
                 {data.content.vocab?.map((v, i) => (
                     <div key={i} className="group bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer flex flex-col justify-between h-32 relative overflow-hidden">
                         <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                 <Volume2 size={16} />
                             </div>
                         </div>
                         <div>
                            <h4 className="font-black text-xl text-gray-800 group-hover:text-emerald-700 transition-colors">{v.word}</h4>
                            <span className="text-xs text-gray-400 font-mono font-bold mt-1 block">{v.phonetics}</span>
                         </div>
                         <div className="pt-3 border-t border-gray-50 mt-2">
                            <span className="text-sm text-gray-600 font-bold bg-gray-50 px-2 py-1 rounded group-hover:bg-emerald-50 group-hover:text-emerald-700 transition-colors">{v.meaning}</span>
                         </div>
                     </div>
                 ))}
            </div>
        )
    }
    
    return null;
  };


  return (
    <div className="w-full h-full flex flex-col lg:flex-row bg-black relative z-40">
        
        {/* === SECTION 1: VIDEO PLAYER === */}
        <div className={`w-full bg-black relative shrink-0 z-20 group flex flex-col justify-center transition-all ${
          sidePanelOpen ? 'lg:flex-[2] lg:h-full aspect-video lg:aspect-auto' : 'flex-1 h-full aspect-auto'
        }`}>
             {/* Main Visual Content */}
             {renderPlayerVisual()}

             <button
               type="button"
               aria-label="返回"
               onClick={() => {
                 if (playbackError) {
                   onExit();
                   return;
                 }
                 if (effectiveWatchRatio < requiredWatchRatio) {
                   const remainMin = Math.ceil((requiredWatchSec - effectiveWatchedSec) / 60);
                   if (remainMin > 0 && window.confirm(`再看约 ${remainMin} 分钟即可获得奖励，确定离开？`)) {
                     onExit();
                   } else if (remainMin <= 0) {
                     onExit();
                   }
                 } else {
                   onExit();
                 }
               }}
               className="absolute left-4 top-4 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-slate-700 shadow-[0_6px_16px_rgba(15,23,42,0.16)] transition hover:bg-white hover:text-slate-900"
             >
               <ChevronLeft size={22} />
             </button>

             <AnimatePresence>
               {playbackError ? (
                 <motion.div
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   exit={{ opacity: 0 }}
                   className="absolute inset-0 z-[33] flex items-center justify-center bg-black/60 px-6"
                 >
                   <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl">
                     <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                       <AlertTriangle size={20} strokeWidth={1.8} />
                     </div>
                     <p className="text-[17px] font-semibold text-slate-900">暂时无法播放</p>
                     <p className="mt-1.5 text-[13px] leading-5 text-slate-500">
                       {retryFlash ? '仍无法播放，请稍后再试或换一条看看。' : playbackErrorDemoOf(playbackError).body}
                     </p>
                     <div className="mt-5 flex flex-col gap-2.5">
                       <button
                         type="button"
                         onClick={handleRetryPlayback}
                         className="flex h-11 items-center justify-center gap-1.5 rounded-2xl bg-indigo-600 text-[14px] font-semibold text-white transition hover:bg-indigo-700"
                       >
                         <RotateCcw size={15} />
                         重试
                       </button>
                       {showPlaylistNav && !isLastInPlaylist ? (
                         <button
                           type="button"
                           onClick={handlePlayNextInSection}
                           className="flex h-11 items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white text-[14px] font-semibold text-slate-700 transition hover:bg-slate-50"
                         >
                           <SkipForward size={15} />
                           播放下一个
                         </button>
                       ) : null}
                       <button
                         type="button"
                         onClick={onExit}
                         className="flex h-11 items-center justify-center rounded-2xl bg-slate-100 text-[14px] font-semibold text-slate-600 transition hover:bg-slate-200"
                       >
                         返回
                       </button>
                     </div>
                   </div>
                 </motion.div>
               ) : null}
             </AnimatePresence>

             <AnimatePresence>
               {showEndPrompt && sectionPlaylist?.items.length ? (
                 <motion.div
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   exit={{ opacity: 0 }}
                   className="absolute inset-0 z-[32] flex items-center justify-center bg-black/55 px-6"
                 >
                   <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl">
                     <p className="text-[17px] font-semibold text-slate-900">
                       {endPromptIsLast ? '当前视频已播放结束' : '本视频已播完'}
                     </p>
                     <p className="mt-1.5 text-[13px] text-slate-500">
                       {endPromptIsLast
                         ? '去做一课一练，巩固这一小节'
                         : '重新播放，或继续看下一集'}
                     </p>
                     <div className="mt-5 flex flex-col gap-2.5">
                       <button
                         type="button"
                         onClick={handleReplayCurrent}
                         className="flex h-11 items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white text-[14px] font-semibold text-slate-700 transition hover:bg-slate-50"
                       >
                         <RotateCcw size={15} />
                         重新播放
                       </button>
                       {endPromptIsLast ? (
                         hasSectionPractice ? (
                         <button
                           type="button"
                           onClick={handleCompleteLesson}
                           className="flex h-11 items-center justify-center gap-1.5 rounded-2xl bg-indigo-600 text-[14px] font-semibold text-white shadow-lg shadow-indigo-200/70 transition hover:bg-indigo-700"
                         >
                           进入一课一练
                           <ChevronRight size={16} />
                         </button>
                         ) : null
                       ) : (
                         <button
                           type="button"
                           onClick={handlePlayNextInSection}
                           className="flex h-11 items-center justify-center gap-1.5 rounded-2xl bg-indigo-600 text-[14px] font-semibold text-white shadow-lg shadow-indigo-200/70 transition hover:bg-indigo-700"
                         >
                           播放下一个
                           <SkipForward size={15} />
                         </button>
                       )}
                     </div>
                   </div>
                 </motion.div>
               ) : null}
             </AnimatePresence>
             
             {/* Top Overlay: Title */}
             <div className="absolute top-0 left-0 right-0 p-4 flex justify-end items-start bg-gradient-to-b from-black/60 to-transparent opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 z-20 pointer-events-none">
                 <div className={`text-right pointer-events-none ${!sidePanelOpen && isScopeSyncLesson ? 'mt-10' : ''}`}>
                     <h2 className="text-white font-bold text-sm md:text-base shadow-sm">{displayTitle}</h2>
                     <span className="text-white/60 text-xs font-mono">{activeSubject}课堂</span>
                 </div>
             </div>

             {!sidePanelOpen && isScopeSyncLesson ? (
               <button
                 type="button"
                 onClick={() => setPlaylistOpen(true)}
                 className="absolute top-4 right-4 z-30 pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 text-white text-xs font-bold border border-white/20 backdrop-blur-md hover:bg-black/70 transition-colors"
               >
                 <ListMusic size={14} />
                 播放列表
                 {syncPlaylist.length > 0 ? (
                   <span className="text-[10px] font-black bg-white/20 rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                     {syncPlaylist.length}
                   </span>
                 ) : null}
               </button>
             ) : !sidePanelOpen ? (
               <button
                 type="button"
                 onClick={() => setSidePanelOpen(true)}
                 className="absolute top-4 right-4 z-30 pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/50 text-white text-xs font-bold border border-white/20 backdrop-blur-md hover:bg-black/70 transition-colors"
               >
                 <PanelLeft size={14} />
                 {panelTabs[0]?.label ?? '笔记'}
               </button>
             ) : null}

             {isScopeSyncLesson ? (
               <SyncMicroLessonPlaylist
                 open={playlistOpen}
                 scopeLabel={sectionPlaylist?.scopeLabel ?? task?.syncLesson?.scopeLabel}
                 lessons={syncPlaylist}
                 activeLessonId={activeSyncLesson?.id}
                 loading={playlistLoading}
                 onClose={() => setPlaylistOpen(false)}
                 onSelect={handleSelectPlaylistLesson}
                 onEnterChapterQuiz={hasSectionPractice ? () => {
                   setPlaylistOpen(false);
                   handleCompleteLesson();
                 } : undefined}
                 footerLabel={hasSectionPractice ? '进入一课一练' : undefined}
                 footerHint={hasSectionPractice ? '看完本小节同步微课后做配套练习' : undefined}
                 practiceMark={task?.sectionPractice?.syncPracticeMark}
                 layout={activeSubject === '英语' ? 'list' : 'path'}
               />
             ) : null}

             {!sidePanelOpen && !isScopeSyncLesson ? (
               <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
                 <motion.button
                   whileHover={{ scale: 1.05 }}
                   whileTap={{ scale: 0.95 }}
                   onClick={handleCompleteLesson}
                   className={`flex items-center gap-2 pl-6 pr-5 py-3 rounded-full text-white font-black shadow-lg ${
                     activeSubject === '语文' ? 'bg-amber-600' :
                     activeSubject === '英语' ? 'bg-emerald-600' :
                     'bg-blue-600'
                   }`}
                 >
                   <span>随堂测验</span>
                   <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                     <ChevronRight size={16} />
                   </div>
                 </motion.button>
               </div>
             ) : null}

             {/* Bottom Overlay: Controls */}
             <div className="absolute bottom-0 left-0 right-0 z-30">
                 <div
                   className="pointer-events-none absolute inset-x-0 bottom-0 h-full bg-gradient-to-t from-black/70 via-black/35 to-transparent"
                   aria-hidden
                 />
                 <div className="relative mx-3 mb-3 mt-8 rounded-2xl bg-black/55 px-3.5 py-3 backdrop-blur-md shadow-[0_8px_28px_rgba(0,0,0,0.28)] flex flex-col gap-2.5">
                 {/* Progress Bar */}
                 <div 
                    className="w-full h-1.5 bg-white/25 rounded-full cursor-pointer relative group/progress"
                    onClick={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const newTime = (x / rect.width) * playbackDuration;
                        handleSeek(newTime);
                    }}
                 >
                     <div 
                        className={`h-full rounded-full relative ${activeSubject === '语文' ? 'bg-amber-500' : activeSubject === '英语' ? 'bg-emerald-500' : 'bg-blue-500'}`} 
                        style={{ width: `${progress}%` }}
                     >
                         <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md scale-0 group-hover/progress:scale-100 transition-transform"></div>
                     </div>
                 </div>

                 <div className="flex justify-between items-center text-white">
                     <div className="flex items-center gap-3">
                         {showPlaylistNav && !isFirstInPlaylist ? (
                           <button
                             type="button"
                             onClick={handlePlaylistPrev}
                             className="p-1.5 rounded-full text-white/90 hover:text-white hover:bg-white/15 transition-colors"
                             aria-label="上一节"
                             title="上一节"
                           >
                             <SkipBack size={18} />
                           </button>
                         ) : null}
                         <button
                           type="button"
                           onClick={() => setIsPlaying(!isPlaying)}
                           className="hover:text-white/80 transition-colors"
                           aria-label={isPlaying ? '暂停' : '播放'}
                         >
                             {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
                         </button>
                         {showPlaylistNav ? (
                           <button
                             type="button"
                             onClick={handlePlaylistNext}
                             className={`p-1.5 rounded-full transition-colors ${
                               isLastInPlaylist
                                 ? 'text-indigo-200 hover:text-white hover:bg-indigo-500/30 ring-1 ring-indigo-300/40'
                                 : 'text-white/90 hover:text-white hover:bg-white/15'
                             }`}
                             aria-label={isLastInPlaylist ? (hasSectionPractice ? '进入一课一练' : '章节小测试') : '下一节'}
                             title={isLastInPlaylist ? (hasSectionPractice ? '进入一课一练' : '章节小测试') : '下一节'}
                           >
                             {isLastInPlaylist ? <ClipboardList size={18} /> : <SkipForward size={18} />}
                           </button>
                         ) : null}
                         <div className="text-xs font-mono font-bold space-x-1 ml-1">
                             <span>{formatTime(currentTime)}</span>
                             <span className="text-white/55">/</span>
                             <span className="text-white/55">{formatTime(playbackDuration)}</span>
                         </div>
                     </div>
                     <div className="flex items-center gap-4">
                         <button
                            type="button"
                            onClick={() => setVideoQuality(q => q === 'hd' ? 'uhd' : 'hd')}
                            className="text-xs font-bold border border-white/40 rounded px-1.5 py-0.5 hover:bg-white/15"
                            aria-label={`清晰度：${videoQuality === 'hd' ? '高清' : '超清'}`}
                         >
                             {videoQuality === 'hd' ? '高清' : '超清'}
                         </button>
                         <button 
                            type="button"
                            onClick={() => setPlaybackSpeed(s => s === 1 ? 1.5 : s === 1.5 ? 2 : 1)}
                            className="text-xs font-bold border border-white/40 rounded px-1.5 py-0.5 hover:bg-white/15"
                         >
                             {playbackSpeed}x
                         </button>
                     </div>
                 </div>
                 </div>
             </div>
        </div>

        {/* === SECTION 2: SMART CONTENT PANEL === */}
        <AnimatePresence initial={false}>
          {sidePanelOpen ? (
        <motion.div
          key="side-panel"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 24 }}
          transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          className="flex-1 flex flex-col min-h-0 bg-white relative lg:rounded-l-[32px] overflow-hidden z-30 max-lg:max-h-[45vh]"
        >
            {/* Tabs Header */}
            <div className="flex items-center px-4 py-3 gap-2 border-b border-gray-100 bg-white shadow-sm z-10 shrink-0">
                <div className="flex flex-1 gap-2 min-w-0">
                {panelTabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTabId(tab.id)}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all relative overflow-hidden ${
                            activeTabId === tab.id 
                                ? 'bg-gray-900 text-white shadow-md' 
                                : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                        }`}
                    >
                        {tab.label}
                        {activeTabId === tab.id && (
                            <motion.div 
                                layoutId="activeTabGlow"
                                className="absolute inset-0 bg-white/10"
                            />
                        )}
                    </button>
                ))}
                </div>
                <button
                  type="button"
                  onClick={() => setSidePanelOpen(false)}
                  className="shrink-0 p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                  aria-label="收起侧栏"
                >
                  <X size={18} />
                </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto scroll-smooth">
                {renderContentArea()}
            </div>

            {/* Floating "Go to Quiz" Action - Persistent at Bottom */}
            <AnimatePresence>
              {watchToast && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-24 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-5 py-3 rounded-2xl bg-slate-900/90 border border-blue-400/30 text-white shadow-2xl backdrop-blur-md"
                >
                  <Zap size={18} className="text-blue-400 fill-blue-400/30" />
                  <span className="text-sm font-bold">{watchToast}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {!isScopeSyncLesson ? (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30">
                <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCompleteLesson}
                    className={`flex items-center gap-2 pl-6 pr-5 py-3 rounded-full text-white font-black shadow-lg transition-all ${
                        activeSubject === '语文' ? 'bg-amber-600 shadow-amber-200' :
                        activeSubject === '英语' ? 'bg-emerald-600 shadow-emerald-200' :
                        'bg-blue-600 shadow-blue-200'
                    }`}
                >
                    <span>随堂测验</span>
                    <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                        <ChevronRight size={16} />
                    </div>
                </motion.button>
            </div>
            ) : null}
        </motion.div>
          ) : null}
        </AnimatePresence>
    </div>
  );
};
