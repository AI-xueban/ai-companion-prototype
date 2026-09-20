
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, Gamepad2, Sparkles, X, ArrowRight, Menu, Camera, Image, Plus, MessageSquare, History, Settings, Edit2, Trash2, Check, Volume2, Loader2, AlertCircle, RotateCcw, ChevronLeft, RefreshCw } from 'lucide-react';
import bgVideo from '@/assets/AIfriend-talking-v0.1.mp4';
import bgFallback from '@/assets/AIfriend-v0.1-frame1.png';
import { ShredderGame } from './Games/ShredderGame';
import { BreathingGame } from './Games/BreathingGame';
import { DayPlan, Task } from '../../types';
import {
  loadAutoPlayVoice,
  saveAutoPlayVoice,
  speakLumiText,
  stopLumiSpeech,
  STREAM_CHAR_MS,
} from './lumiChatSpeech';
import { LumiCameraOverlay, type LumiCameraConfirmResult } from './LumiCameraOverlay';
import { SessionFeedbackSheet, SessionFeedbackPayload } from './SessionFeedbackSheet';
import { LumiPhotoTriageCard } from './LumiPhotoTriageCard';
import { CitedSearchText } from './LumiSearchCitations';
import { runLumiWebSearch, type SearchSource } from './lumiWebSearch';
import {
    buildPhotoReplyContent,
    canImageStartSolve,
    classifyLumiPhoto,
    resolveSolveAction,
    type PhotoClassification,
    type PhotoReplyAction,
    type PhotoReplyButton,
    type PhotoTriageItem,
} from './lumiPhotoClassify';
import type { AISolveQuestion } from '../../data/aiSolveMockData';
import { flattenQuestionsFromShots, needsQuestionPicker } from '../../data/aiSolveMockData';
import { AISolveProcessingOverlay } from '../Dashboard/AISolveProcessingOverlay';
import { QuestionPickerOverlay } from '../Dashboard/QuestionPickerOverlay';
import { LumiHubStage } from './LumiHubStage';
import {
    CURIOSITY_PACKS,
    FREE_CHAT_OPENER,
    type HubCuriosityCard,
    type HubSpark,
} from './lumiHubData';

// Chat Data Types
interface Message {
    id: string;
    sender: 'lumi' | 'user';
    text: string;
    type?: 'text' | 'system' | 'game-recommendation' | 'image' | 'quick-reply' | 'search-status' | 'search-answer';
    imageUrl?: string;
    imageUrls?: string[];
    /** 发送时各张图的分类 */
    imageClassifications?: PhotoClassification[];
    /** 图片回复下的行动按钮（如「试试讲讲」） */
    photoActionButtons?: PhotoReplyButton[];
    /** 题目分拣卡片 */
    photoTriageItems?: PhotoTriageItem[];
    photoTriageUrls?: string[];
    onPhotoAction?: (action: PhotoReplyAction) => void;
    gameId?: 'shredder' | 'breathing' | 'highlight';
    quickReplies?: string[];
    onQuickReply?: (reply: string) => void;
    /** 联网搜索过程指示：思考中 → 正在帮你查一下（单一指示器，直接替换） */
    searchPhase?: 'loading' | 'searching';
    searchCount?: number;
    searchSources?: SearchSource[];
    /** 搜索使用的查询词，渲染为回答气泡顶部小字「关于「xxx」」 */
    searchQuery?: string;
}

const INITIAL_MESSAGES: Message[] = [
    { id: '1', sender: 'lumi', text: '嗨！今天过得怎么样？', type: 'text' }
];

const CHECK_IN_INITIAL_MESSAGES: Message[] = [
    { id: '1', sender: 'lumi', text: '嗨！准备好开始今天的学习计划了吗？✨', type: 'text' }
];

interface HistoryItem {
    id: string;
    title: string;
    date: string;
    preview: string;
    messages?: Message[];
    /** 演示：打开后本会话还剩 N 轮用户消息，发完后输入锁定 */
    sessionTurnRemaining?: number;
    /** 演示：打开后图片额度已满（50/50），禁拍照、可文字聊 */
    imageQuotaLocked?: boolean;
    /** 侧栏展示「演示」标签 */
    isDemo?: boolean;
}

const isQuotaDemoHistory = (item: HistoryItem) =>
    Boolean(
        item.isDemo
        || typeof item.sessionTurnRemaining === 'number'
        || item.imageQuotaLocked
        || item.id === 'h-token-session'
        || item.id === 'h-token-image',
    );

const previewFromMessages = (msgs: Message[]) => {
    const last = [...msgs].reverse().find((msg) => (msg.text || '').trim());
    return (last?.text || '新的对话').replace(/\s+/g, ' ').slice(0, 40);
};

/** Token 消耗演示：单会话用户回合上限 */
const SESSION_TURN_LIMIT = 100;
/** Token 消耗演示：图片上传累计上限（本登录周期） */
const IMAGE_UPLOAD_LIMIT = 50;
/** 会话回合演示：从「还剩 2 轮」起演，发完两条后锁定 */
const SESSION_TURN_DEMO_REMAINING = 2;
/** 图片额度演示会话：从「今日上传图片额度还剩 3 张」起演 */
const IMAGE_QUOTA_DEMO_REMAINING = 3;

const countUserTurns = (msgs: Message[]) =>
    msgs.filter((msg) => msg.sender === 'user').length;

const INITIAL_HISTORY: HistoryItem[] = [
    {
        id: 'h-token-session',
        title: '会话回合额度已满',
        date: '今天',
        preview: '本会话还剩 2 轮，发完就满啦',
        isDemo: true,
        sessionTurnRemaining: SESSION_TURN_DEMO_REMAINING,
        messages: [
            { id: 'hts-1', sender: 'lumi', text: '我们继续聊配方法？你卡在配方还是求根公式？', type: 'text' },
            { id: 'hts-2', sender: 'user', text: '配方后面平方老是算错……', type: 'text' },
            { id: 'hts-3', sender: 'lumi', text: '那我们放慢一步：先把一次项系数除以 2，再平方。要不要我举个具体数字？', type: 'text' },
            { id: 'hts-4', sender: 'user', text: '好，用 x² + 6x + 5 = 0 讲一遍。', type: 'text' },
            {
                id: 'hts-5',
                sender: 'lumi',
                text: '可以。一次项系数 6，一半是 3，平方是 9。你先自己算一下常数项，再跟我对一下～',
                type: 'text',
            },
        ],
    },
    {
        id: 'h-token-image',
        title: '图片上传额度已满',
        date: '今天',
        preview: '今日上传图片额度还剩 3 张，拍完就满了',
        isDemo: true,
        imageQuotaLocked: true,
        messages: [
            { id: 'hti-1', sender: 'lumi', text: '把题目拍给我，我帮你看看卡在哪。', type: 'text' },
            { id: 'hti-2', sender: 'user', text: '今天已经传了好多图，不知道还能不能再拍。', type: 'text' },
            {
                id: 'hti-3',
                sender: 'lumi',
                text: '还可以再拍几张。打开相机后，额度快用完时会提醒你还剩几张～',
                type: 'text',
            },
        ],
    },
    {
        id: 'h1',
        title: '关于一元二次方程的讨论',
        date: '昨天',
        preview: '那如果 delta 小于 0 呢？',
        messages: [
            { id: 'h1-1', sender: 'lumi', text: '一元二次方程你卡在哪一步了？', type: 'text' },
            { id: 'h1-2', sender: 'user', text: '判别式算出来是负数，不知道怎么办。', type: 'text' },
            { id: 'h1-3', sender: 'lumi', text: '那如果 delta 小于 0，方程在实数范围没有实根。你可以写成「无实数解」。', type: 'text' },
            { id: 'h1-4', sender: 'user', text: '那如果 delta 小于 0 呢？', type: 'text' },
        ],
    },
    {
        id: 'h2',
        title: '英语口语练习',
        date: '2天前',
        preview: 'How about the weather?',
        messages: [
            { id: 'h2-1', sender: 'lumi', text: '我们用四句把周末聊完。先从天气开始？', type: 'text' },
            { id: 'h2-2', sender: 'user', text: 'How about the weather?', type: 'text' },
            { id: 'h2-3', sender: 'lumi', text: 'Nice. You can say: It was sunny, so I went out.', type: 'text' },
        ],
    },
    {
        id: 'h3',
        title: '心情调节：考前焦虑',
        date: '1周前',
        preview: '感觉这次期中考要完蛋了...',
        messages: [
            { id: 'h3-1', sender: 'lumi', text: '今天要是有点闷，要不要先跟我说说？', type: 'text' },
            { id: 'h3-2', sender: 'user', text: '感觉这次期中考要完蛋了...', type: 'text' },
            { id: 'h3-3', sender: 'lumi', text: '先不用把自己判死刑。你最怕的是哪一科？我们只拆一件。', type: 'text' },
        ],
    },
];

type PendingPhotoStatus = 'uploading' | 'success' | 'error';

interface PendingPhoto {
    id: string;
    url: string;
    status: PendingPhotoStatus;
    classification?: PhotoClassification;
}

const simulatePhotoUploadStatus = (_index: number, _total: number): PendingPhotoStatus => 'success';

/** 会话反馈：用户消息数下限、总消息数下限（见 docs/pre-v2.0/01-伙伴-小晤Space/小晤Space-交互需求文档.md §3.5） */
const SESSION_FEEDBACK_MIN_USER_MESSAGES = 2;
const SESSION_FEEDBACK_MIN_TOTAL_MESSAGES = 15;

interface LumiSpaceProps {
    checkInMode?: boolean; // 是否进入晨检模式
    onCheckInComplete?: (data: any) => void; // 晨检完成回调
    existingPlan?: any; // 已存在的任务计划，用于编辑模式
    onStartAISolve?: (question: AISolveQuestion) => void;
    onCameraFlowOpenChange?: (open: boolean) => void;
    /** 二级会话或左侧抽屉打开时，通知外层藏起底栏 */
    onChromeHiddenChange?: (hidden: boolean) => void;
}

const VOICE_WAVE_PATTERN = [8, 16, 26, 12, 32, 22, 10, 28, 36, 18, 10, 24, 34, 14, 8, 20, 30, 12, 26, 10];

const VoiceWaveBars: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={`flex items-center justify-center gap-[3px] h-9 ${className}`}>
        {VOICE_WAVE_PATTERN.map((peak, i) => (
            <motion.div
                key={i}
                className="w-[3px] rounded-full bg-sky-400"
                initial={{ height: 4 }}
                animate={{
                    height: [peak * 0.3, peak, peak * 0.55, peak * 0.9, peak * 0.3],
                }}
                transition={{
                    repeat: Infinity,
                    duration: 0.5 + (i % 4) * 0.12,
                    delay: i * 0.04,
                    ease: 'easeInOut',
                }}
            />
        ))}
    </div>
);

export const LumiSpace: React.FC<LumiSpaceProps> = ({ 
    checkInMode = false,
    onCheckInComplete,
    existingPlan,
    onStartAISolve,
    onCameraFlowOpenChange,
    onChromeHiddenChange,
}) => {
    // --- State ---
    const [messages, setMessages] = useState<Message[]>(checkInMode ? CHECK_IN_INITIAL_MESSAGES : INITIAL_MESSAGES);
    const [inputText, setInputText] = useState('');
    const [lumiEmotion, setLumiEmotion] = useState<'idle' | 'happy' | 'listening' | 'shredding' | 'breathing'>('idle');
    
    // UI State
    const [isDrawerOpen, setIsDrawerOpen] = useState(false); // Side Drawer
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [processingShotIds, setProcessingShotIds] = useState<string[] | null>(null);
    const [capturedShotIds, setCapturedShotIds] = useState<string[]>([]);
    const [isQuestionPickerOpen, setIsQuestionPickerOpen] = useState(false);
    const processingShotIdsRef = useRef<string[]>([]);
    const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
    const photoUploadTimersRef = useRef<number[]>([]);
    const [isListening, setIsListening] = useState(false);
    const [voiceTranscript, setVoiceTranscript] = useState('');
    const speechRecognitionRef = useRef<SpeechRecognition | null>(null);
    const voiceBaseRef = useRef('');
    const voiceTranscriptRef = useRef('');
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
    const sessionFeedbackShownRef = useRef(false);
    const [activeGame, setActiveGame] = useState<'shredder' | 'breathing' | 'highlight' | null>(null);

    // History State
    const [history, setHistory] = useState<HistoryItem[]>(INITIAL_HISTORY);
    const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);
    /** 当前会话用户已发轮次（演示 token：满 100 锁定） */
    const [sessionTurnCount, setSessionTurnCount] = useState(0);
    /** 本登录周期图片上传累计（演示 token：满 50 禁拍照） */
    const [imageUploadCount, setImageUploadCount] = useState(0);
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');

    const [autoPlayVoice, setAutoPlayVoice] = useState(loadAutoPlayVoice);
    const [streamState, setStreamState] = useState<Record<string, { shown: string; done: boolean }>>({});
    const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
    const [busyToast, setBusyToast] = useState<string | null>(null);
    const [isAgentSearching, setIsAgentSearching] = useState(false);
    const [isBackgroundVideoPlaying, setIsBackgroundVideoPlaying] = useState(false);
    const streamTimersRef = useRef<Record<string, ReturnType<typeof setInterval>>>({});
    const busyToastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const autoPlayVoiceRef = useRef(autoPlayVoice);
    autoPlayVoiceRef.current = autoPlayVoice;

    // Check-in State
    const [isInCheckIn, setIsInCheckIn] = useState(checkInMode);
    const [checkInStep, setCheckInStep] = useState(0);
    const [checkInData, setCheckInData] = useState<any>({});
    const [surface, setSurface] = useState<'hub' | 'session'>(checkInMode ? 'session' : 'hub');
    const [sessionTitle, setSessionTitle] = useState<string | null>(null);
    const [curiosityPack, setCuriosityPack] = useState(CURIOSITY_PACKS[0]);
    const [sessionTouched, setSessionTouched] = useState(false);
    const [continueTitle, setContinueTitle] = useState<string | null>(null);
    const isHub = surface === 'hub' && !checkInMode && !activeGame;
    const messagesRef = useRef(messages);
    const sessionTitleRef = useRef(sessionTitle);
    const activeHistoryIdRef = useRef(activeHistoryId);
    messagesRef.current = messages;
    sessionTitleRef.current = sessionTitle;
    activeHistoryIdRef.current = activeHistoryId;

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null); // [新增] 添加容器 ref
    const checkInInitializedRef = useRef(false);

    useEffect(() => {
        const cameraFlowOpen = isCameraOpen || processingShotIds !== null || isQuestionPickerOpen;
        onCameraFlowOpenChange?.(cameraFlowOpen);
        return () => onCameraFlowOpenChange?.(false);
    }, [isCameraOpen, isQuestionPickerOpen, onCameraFlowOpenChange, processingShotIds]);

    useEffect(() => {
        onChromeHiddenChange?.(isDrawerOpen || !isHub);
        return () => onChromeHiddenChange?.(false);
    }, [isDrawerOpen, isHub, onChromeHiddenChange]);

    useEffect(() => {
        if (!activeHistoryId) return;
        setHistory((prev) => prev.map((item) => (
            item.id === activeHistoryId
                ? {
                    ...item,
                    title: sessionTitle || item.title,
                    preview: previewFromMessages(messages),
                    messages,
                }
                : item
        )));
    }, [activeHistoryId, messages, sessionTitle]);

    const handleSolveProcessingComplete = useCallback(() => {
        const shotIds = processingShotIdsRef.current;
        setCapturedShotIds(shotIds);
        const questions = flattenQuestionsFromShots(shotIds);

        if (needsQuestionPicker(shotIds)) {
            setIsQuestionPickerOpen(true);
            requestAnimationFrame(() => {
                requestAnimationFrame(() => setProcessingShotIds(null));
            });
        } else if (questions.length >= 1) {
            onStartAISolve?.(questions[0]);
            requestAnimationFrame(() => {
                requestAnimationFrame(() => setProcessingShotIds(null));
            });
        }
    }, [onStartAISolve]);

    const handleQuestionPickerSelect = (question: AISolveQuestion) => {
        setIsQuestionPickerOpen(false);
        setCapturedShotIds([]);
        onStartAISolve?.(question);
    };

    const handleMessageSolve = (classifications: PhotoClassification[] | undefined) => {
        if (!classifications?.length) return;

        const { shotIds, needsPicker, directQuestion } = resolveSolveAction(classifications);

        if (needsPicker && shotIds.length > 0) {
            processingShotIdsRef.current = shotIds;
            setCapturedShotIds(shotIds);
            setIsQuestionPickerOpen(true);
            return;
        }

        if (directQuestion) {
            onStartAISolve?.(directQuestion);
        }
    };

    const handleSolveAtImageIndex = (
        classifications: PhotoClassification[],
        imageIndex: number,
    ) => {
        const classification = classifications[imageIndex];
        if (!classification || !canImageStartSolve(classification)) return;
        handleMessageSolve([classification]);
    };

    const handlePhotoReplyAction = (
        action: PhotoReplyAction,
        classifications: PhotoClassification[],
    ) => {
        if (action.type === 'solve_image') {
            handleSolveAtImageIndex(classifications, action.imageIndex);
            return;
        }
        handleMessageSolve(classifications);
    };

    const clearAllStreams = () => {
        Object.values(streamTimersRef.current).forEach(clearInterval);
        streamTimersRef.current = {};
    };

    const startMessageStream = (messageId: string, fullText: string, speakAfterStream = false) => {
        if (!fullText.trim()) return;

        if (streamTimersRef.current[messageId]) {
            clearInterval(streamTimersRef.current[messageId]);
            delete streamTimersRef.current[messageId];
        }

        setStreamState((prev) => ({ ...prev, [messageId]: { shown: '', done: false } }));
        setLumiEmotion('happy');

        let index = 0;

        const tick = () => {
            index += 1;
            const shown = fullText.slice(0, index);
            if (index >= fullText.length) {
                clearInterval(streamTimersRef.current[messageId]);
                delete streamTimersRef.current[messageId];
                setStreamState((prev) => ({ ...prev, [messageId]: { shown: fullText, done: true } }));
                setLumiEmotion('idle');
                if (autoPlayVoiceRef.current || speakAfterStream) {
                    playMessageVoice(messageId, fullText);
                }
                return;
            }
            setStreamState((prev) => ({ ...prev, [messageId]: { shown, done: false } }));
        };

        streamTimersRef.current[messageId] = setInterval(tick, STREAM_CHAR_MS);
        if (index === 0) tick();
    };

    const playMessageVoice = (messageId: string, text: string) => {
        const ok = speakLumiText(text, {
            onStart: () => setSpeakingMessageId(messageId),
            onEnd: () => setSpeakingMessageId((id) => (id === messageId ? null : id)),
            onError: () => setSpeakingMessageId((id) => (id === messageId ? null : id)),
        });
        if (!ok) setSpeakingMessageId(null);
    };

    const handlePlayMessage = (messageId: string, text: string) => {
        if (speakingMessageId === messageId) {
            stopLumiSpeech();
            setSpeakingMessageId(null);
            startMessageStream(messageId, text, true);
            return;
        }
        playMessageVoice(messageId, text);
    };

    const getLumiDisplayText = (msg: Message) => {
        if (msg.sender !== 'lumi' || !msg.text) return msg.text;
        const isStreamable = msg.type === 'text' || msg.type === 'quick-reply' || msg.type === 'search-answer';
        const state = streamState[msg.id];
        if (state) return state.shown;
        return isStreamable ? '' : msg.text;
    };

    const isLumiStreamDone = (msg: Message) => {
        if (msg.sender !== 'lumi' || !msg.text) return true;
        if (msg.type !== 'text' && msg.type !== 'quick-reply' && msg.type !== 'search-answer') return true;
        return streamState[msg.id]?.done ?? false;
    };

    const isLumiReplying = isAgentSearching || messages.some(
        (msg) =>
            (msg.type === 'search-status' && (msg.searchPhase === 'loading' || msg.searchPhase === 'searching'))
            || (msg.sender === 'lumi' && !!msg.text && (msg.type === 'text' || msg.type === 'quick-reply' || msg.type === 'search-answer') && !isLumiStreamDone(msg)),
    );

    const isSessionTurnLimited = sessionTurnCount >= SESSION_TURN_LIMIT;
    const isImageUploadLimited = imageUploadCount >= IMAGE_UPLOAD_LIMIT;

    const showBusyToast = (message = '小晤还在说，稍等一下～') => {
        setBusyToast(message);
        if (busyToastTimerRef.current) clearTimeout(busyToastTimerRef.current);
        busyToastTimerRef.current = setTimeout(() => {
            setBusyToast(null);
            busyToastTimerRef.current = null;
        }, 2200);
    };

    const showAgentErrorToast = () => {
        showBusyToast('出了点小状况，请稍后再试～');
    };

    const guardIfLumiReplying = () => {
        if (!isLumiReplying) return false;
        showBusyToast();
        return true;
    };

    useEffect(() => {
        messages.forEach((msg) => {
            const isStreamable =
                msg.sender === 'lumi'
                && !!msg.text
                && (msg.type === 'text' || msg.type === 'quick-reply' || msg.type === 'search-answer');
            if (isStreamable && !streamState[msg.id] && !streamTimersRef.current[msg.id]) {
                startMessageStream(msg.id, msg.text);
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [messages]);

    useEffect(() => {
        return () => {
            clearAllStreams();
            stopLumiSpeech();
            speechRecognitionRef.current?.stop();
            photoUploadTimersRef.current.forEach(clearTimeout);
            if (busyToastTimerRef.current) clearTimeout(busyToastTimerRef.current);
        };
    }, []);

    const handleAutoPlayVoiceChange = (enabled: boolean) => {
        setAutoPlayVoice(enabled);
        saveAutoPlayVoice(enabled);
        if (!enabled) {
            stopLumiSpeech();
            setSpeakingMessageId(null);
        }
    };
    
    // #region agent log
    useEffect(() => {
        const inputEl = document.querySelector('.absolute.bottom-24');
        const mainContainer = document.querySelector('.flex-1.flex.flex-col.relative.z-10');
        const inputRect = inputEl?.getBoundingClientRect();
        const containerRect = mainContainer?.getBoundingClientRect();
        fetch('http://127.0.0.1:7245/ingest/85c68675-85c7-485d-9d2a-58e28774ad7e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'LumiSpace.tsx:84-effect',message:'State change detected',data:{messagesCount:messages.length,inputText:inputText.substring(0,10),activeGame:activeGame,inputRect:inputRect,containerRect:containerRect},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'E'})}).catch(()=>{});
    }, [messages, inputText, activeGame, isDrawerOpen]);
    // #endregion

    // Auto scroll chat
    useEffect(() => {
        // #region agent log
        const inputEl = document.querySelector('.absolute.bottom-24');
        const scrollContainer = document.querySelector('.flex-1.overflow-y-auto');
        const beforeRect = inputEl?.getBoundingClientRect();
        const scrollInfo = scrollContainer ? {top: scrollContainer.scrollTop, height: scrollContainer.scrollHeight} : null;
        fetch('http://127.0.0.1:7245/ingest/85c68675-85c7-485d-9d2a-58e28774ad7e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'LumiSpace.tsx:87',message:'Before scroll effect',data:{messagesCount:messages.length,inputRect:beforeRect,scrollInfo:scrollInfo},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C,D'})}).catch(()=>{});
        // #endregion
        
       // messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
       if (chatContainerRef.current) {
        chatContainerRef.current.scrollTo({
            top: chatContainerRef.current.scrollHeight,
            behavior: 'smooth'
        });
    }
        // #region agent log
        setTimeout(() => {
            const afterEl = document.querySelector('.absolute.bottom-24');
            const afterRect = afterEl?.getBoundingClientRect();
            const afterScrollInfo = scrollContainer ? {top: scrollContainer.scrollTop, height: scrollContainer.scrollHeight} : null;
            fetch('http://127.0.0.1:7245/ingest/85c68675-85c7-485d-9d2a-58e28774ad7e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'LumiSpace.tsx:87-after',message:'After scroll effect',data:{inputRect:afterRect,scrollInfo:afterScrollInfo,positionChanged:beforeRect?.top !== afterRect?.top},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C,D'})}).catch(()=>{});
        }, 100);
        // #endregion
    }, [messages, activeGame]);

    // 晨检模式初始化
    useEffect(() => {
        // 重置标记当 checkInMode 变为 false 时
        if (!checkInMode) {
            checkInInitializedRef.current = false;
            return;
        }
        
        // 如果已经初始化过，不再执行
        if (checkInInitializedRef.current) {
            return;
        }
        
        if (messages.length === 1) { // 只有一条初始消息时
            checkInInitializedRef.current = true; // 标记为已初始化
            setIsInCheckIn(true);
            // 判断是新建还是编辑
            if (existingPlan) {
                // 编辑模式 - 启动完整的编辑流程
                setTimeout(() => {
                    startEditFlow(existingPlan);
                    setIsInCheckIn(true); // 保持在编辑流程中
                }, 500);
            } else {
                // 新建模式 - 开始第一个问题
                startCheckInFlow();
            }
        }
    }, [checkInMode, messages.length, existingPlan]);

    const startCheckInFlow = () => {
        setTimeout(() => {
            askCheckInQuestion(0);
        }, 500);
    };

    const askCheckInQuestion = (step: number) => {
        const questions = [
            {
                text: '早呀！✨ 今天在学校怎么样？',
                description: '了解你今天的学习状态和心情，这样我能为你安排更合适的学习内容~',
                replies: ['挺好的', '有点累', '遇到难题']
            },
            {
                text: '今天哪些科目的内容想巩固一下？',
                description: '告诉我你最想加强的科目，我会为你准备针对性的练习和内容。',
                replies: ['数学', '语文', '英语', '都可以']
            },
            {
                text: '有遇到不太懂的题吗？可以拍照给我看~ 或者直接告诉我也行！',
                description: '把不会的题目告诉我，我会帮你分析问题，并安排相关的复习内容。',
                replies: ['有几道题不会', '没有，跳过']
            },
            {
                text: '今天打算学习多久呀？',
                description: '根据你的时间安排，我会合理分配任务，确保你能高效完成~',
                replies: ['15分钟', '30分钟', '45分钟']
            }
        ];

        if (step < questions.length) {
            const q = questions[step];
            // 合并问题和说明为一个消息
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                sender: 'lumi',
                text: `${q.text}\n\n💡 ${q.description}`,
                type: 'quick-reply',
                quickReplies: q.replies,
                onQuickReply: (reply: string) => handleCheckInReply(step, reply)
            }]);
            setCheckInStep(step);
        } else {
            // 完成所有问题，显示任务预览
            showTaskPreview();
        }
    };

    const handleCheckInReply = (step: number, reply: string) => {
        // 添加用户消息
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            sender: 'user',
            text: reply,
            type: 'text'
        }]);

        // 保存数据
        const newData = { ...checkInData };
        switch(step) {
            case 0: newData.mood = reply; break;
            case 1: newData.subject = reply; break;
            case 2: newData.difficulty = reply; break;
            case 3: newData.studyTime = reply; break;
        }
        setCheckInData(newData);

        // 下一个问题
        setTimeout(() => {
            askCheckInQuestion(step + 1);
        }, 800);
    };

    const showTaskPreview = () => {
        setLumiEmotion('happy');
        setTimeout(() => {
            const previewText = `我懂了！今天我们：
1️⃣ ${checkInData.subject || '数学'} - 重点突破 (15分钟)
2️⃣ 英语 - 听力日常对话 (10分钟) 
3️⃣ ${checkInData.subject || '数学'}地图 - 自由探险

这样安排可以吗？`;
            
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                sender: 'lumi',
                text: previewText,
                type: 'text'
            }]);

            // 添加确认按钮
            setTimeout(() => {
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    sender: 'lumi',
                    text: '',
                    type: 'quick-reply',
                    quickReplies: ['👍 就这样', '💬 我想改改'],
                    onQuickReply: (reply: string) => {
                        if (reply.includes('就这样')) {
                            completeCheckIn();
                        } else {
                            allowAdjustment();
                        }
                    }
                }]);
            }, 500);
        }, 1000);
    };

    const completeCheckIn = () => {
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            sender: 'user',
            text: '👍 就这样',
            type: 'text'
        }]);

        setTimeout(() => {
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                sender: 'lumi',
                text: '好的！任务已经准备好啦，快去看看吧~ ✨',
                type: 'text'
            }]);

            setTimeout(() => {
                if (onCheckInComplete) {
                    onCheckInComplete(checkInData);
                }
            }, 1000);
        }, 500);
    };

    const allowAdjustment = () => {
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            sender: 'user',
            text: '💬 我想改改',
            type: 'text'
        }]);

        setTimeout(() => {
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                sender: 'lumi',
                text: '好的！说说看，想怎么调整？（试试说"数学太难了"或"再加一个语文"）',
                type: 'text'
            }]);
            setIsInCheckIn(false); // 退出结构化流程，进入自由对话
        }, 500);
    };

    // ========== 编辑模式辅助函数 ==========

    /**
     * 格式化任务列表为消息文本
     */
    const formatTaskListForMessage = (plan: DayPlan): string => {
        if (!plan || !plan.tasks || plan.tasks.length === 0) {
            return '📋 当前没有任务安排';
        }
        
        const taskList = plan.tasks.map((task, index) => 
            `${index + 1}️⃣ ${task.subject} - ${task.title} (${task.durationMinutes}分钟)`
        ).join('\n');
        
        return `📋 让我看看你现在的任务安排：\n\n${taskList}\n\n想调整哪部分呢？`;
    };

    /**
     * 解析用户输入的调整意图
     */
    const parseAdjustmentIntent = (userInput: string, currentPlan: DayPlan): {
        action: 'reduce_difficulty' | 'increase_difficulty' | 'change_subject' | 'remove_task' | 'add_task' | 'reduce_time' | 'unknown';
        subject?: string;
        taskIndex?: number;
        details?: string;
    } => {
        const input = userInput.toLowerCase();
        
        // 识别科目
        const subjects = ['数学', '语文', '英语', '物理', '化学', '生物', '历史', '地理', '政治'];
        const mentionedSubject = subjects.find(subj => input.includes(subj.toLowerCase()));
        
        // 识别动作关键词
        if ((input.includes('难') || input.includes('太难') || input.includes('困难')) && mentionedSubject) {
            return { action: 'reduce_difficulty', subject: mentionedSubject };
        }
        
        if ((input.includes('简单') || input.includes('太简单') || input.includes('容易')) && mentionedSubject) {
            return { action: 'increase_difficulty', subject: mentionedSubject };
        }
        
        if ((input.includes('删除') || input.includes('不要') || input.includes('去掉') || input.includes('移除')) && mentionedSubject) {
            return { action: 'remove_task', subject: mentionedSubject };
        }
        
        if ((input.includes('加') || input.includes('增加') || input.includes('添加') || input.includes('再来')) && mentionedSubject) {
            return { action: 'add_task', subject: mentionedSubject };
        }
        
        if (input.includes('时间') && (input.includes('不够') || input.includes('少') || input.includes('减少'))) {
            return { action: 'reduce_time' };
        }
        
        if (input.includes('换') && mentionedSubject) {
            return { action: 'change_subject', subject: mentionedSubject };
        }
        
        return { action: 'unknown', details: userInput };
    };

    /**
     * 处理用户选择的调整原因
     */
    const handleAdjustmentReason = (reason: string, plan: DayPlan) => {
        // 添加用户消息
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            sender: 'user',
            text: reason,
            type: 'text'
        }]);
        
        setTimeout(() => {
            if (reason.includes('太难') || reason.includes('简单点')) {
                // 询问哪个任务
                const taskOptions = plan.tasks.map((task, index) => 
                    `${index + 1}️⃣ ${task.subject}`
                );
                
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    sender: 'lumi',
                    text: '明白了！哪个任务让你觉得难呢？',
                    type: 'quick-reply',
                    quickReplies: [...taskOptions, '都太难了', '其他'],
                    onQuickReply: (reply: string) => handleTaskDifficultySelection(reply, plan)
                }]);
                
            } else if (reason.includes('换') || reason.includes('科目')) {
                // 询问想换成什么
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    sender: 'lumi',
                    text: '好的！想换成什么科目呢？或者告诉我：\n- 想删除哪个任务？\n- 想增加什么内容？',
                    type: 'quick-reply',
                    quickReplies: ['数学', '语文', '英语', '删除任务', '增加任务'],
                    onQuickReply: (reply: string) => handleSubjectChange(reply, plan)
                }]);
                
            } else if (reason.includes('时间') || reason.includes('减少')) {
                // 询问如何减少时间
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    sender: 'lumi',
                    text: '理解！今天时间比较紧张对吧？我们可以：\n- 减少任务数量\n- 缩短单个任务时间\n- 改成快速版本',
                    type: 'quick-reply',
                    quickReplies: ['减少任务数量', '缩短时间', '改成快速版', '其他'],
                    onQuickReply: (reply: string) => handleTimeReduction(reply, plan)
                }]);
                
            } else if (reason.includes('多学') || reason.includes('加任务')) {
                // 询问想加什么
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    sender: 'lumi',
                    text: '好学的精神！想增加什么内容呢？',
                    type: 'quick-reply',
                    quickReplies: ['数学', '语文', '英语', '其他科目'],
                    onQuickReply: (reply: string) => handleAddTask(reply, plan)
                }]);
                
            } else {
                // 其他原因，进入自由对话
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    sender: 'lumi',
                    text: '好的！说说看，想怎么调整？你可以直接告诉我，比如"数学太难了"或"再加一个语文"~',
                    type: 'text'
                }]);
                setIsInCheckIn(false); // 进入自由对话模式
            }
        }, 500);
    };

    /**
     * 处理用户选择的具体任务难度调整
     */
    const handleTaskDifficultySelection = (reply: string, plan: DayPlan) => {
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            sender: 'user',
            text: reply,
            type: 'text'
        }]);
        
        setTimeout(() => {
            if (reply.includes('都太难')) {
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    sender: 'lumi',
                    text: '明白了！我会把所有任务都调简单一点~',
                    type: 'text'
                }]);
                simulateTaskAdjustment(plan, 'reduce_all_difficulty');
            } else {
                const taskIndex = parseInt(reply[0]) - 1;
                if (taskIndex >= 0 && taskIndex < plan.tasks.length) {
                    const task = plan.tasks[taskIndex];
                    setMessages(prev => [...prev, {
                        id: Date.now().toString(),
                        sender: 'lumi',
                        text: `好的！我会把"${task.subject} - ${task.title}"调简单一点~`,
                        type: 'text'
                    }]);
                    simulateTaskAdjustment(plan, 'reduce_difficulty', taskIndex);
                }
            }
        }, 500);
    };

    /**
     * 处理科目变更
     */
    const handleSubjectChange = (reply: string, plan: DayPlan) => {
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            sender: 'user',
            text: reply,
            type: 'text'
        }]);
        
        setTimeout(() => {
            if (reply.includes('删除')) {
                const taskOptions = plan.tasks.map((task, index) => 
                    `${index + 1}️⃣ ${task.subject}`
                );
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    sender: 'lumi',
                    text: '好的！想删除哪个任务呢？',
                    type: 'quick-reply',
                    quickReplies: [...taskOptions, '其他'],
                    onQuickReply: (reply: string) => {
                        const taskIndex = parseInt(reply[0]) - 1;
                        if (taskIndex >= 0 && taskIndex < plan.tasks.length) {
                            const filteredTasks = plan.tasks.filter((_, idx) => idx !== taskIndex);
                            showAdjustedTaskPreview({ ...plan, tasks: filteredTasks });
                        }
                    }
                }]);
            } else if (reply.includes('增加')) {
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    sender: 'lumi',
                    text: '好的！想增加什么科目呢？',
                    type: 'quick-reply',
                    quickReplies: ['数学', '语文', '英语', '其他'],
                    onQuickReply: (reply: string) => handleAddTask(reply, plan)
                }]);
            } else {
                // 直接换科目
                handleAddTask(reply, plan);
            }
        }, 500);
    };

    /**
     * 处理时间减少
     */
    const handleTimeReduction = (reply: string, plan: DayPlan) => {
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            sender: 'user',
            text: reply,
            type: 'text'
        }]);
        
        setTimeout(() => {
            if (reply.includes('减少任务数量')) {
                const taskOptions = plan.tasks.map((task, index) => 
                    `${index + 1}️⃣ ${task.subject}`
                );
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    sender: 'lumi',
                    text: '好的！想删除哪个任务呢？',
                    type: 'quick-reply',
                    quickReplies: [...taskOptions, '其他'],
                    onQuickReply: (reply: string) => {
                        const taskIndex = parseInt(reply[0]) - 1;
                        if (taskIndex >= 0 && taskIndex < plan.tasks.length) {
                            const filteredTasks = plan.tasks.filter((_, idx) => idx !== taskIndex);
                            showAdjustedTaskPreview({ ...plan, tasks: filteredTasks });
                        }
                    }
                }]);
            } else if (reply.includes('缩短时间')) {
                const adjustedTasks = plan.tasks.map(task => ({
                    ...task,
                    durationMinutes: Math.max(5, task.durationMinutes - 5)
                }));
                showAdjustedTaskPreview({ ...plan, tasks: adjustedTasks });
            } else {
                // 改成快速版
                const adjustedTasks = plan.tasks.map(task => ({
                    ...task,
                    title: task.title.replace('突破', '基础练习').replace('进阶', '基础'),
                    durationMinutes: Math.max(5, Math.floor(task.durationMinutes * 0.7))
                }));
                showAdjustedTaskPreview({ ...plan, tasks: adjustedTasks });
            }
        }, 500);
    };

    /**
     * 处理添加任务
     */
    const handleAddTask = (subject: string, plan: DayPlan) => {
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            sender: 'user',
            text: subject,
            type: 'text'
        }]);
        
        setTimeout(() => {
            const newTask: Task = {
                id: `new-${Date.now()}`,
                title: `${subject} - 基础练习`,
                subject: subject,
                durationMinutes: 10,
                completed: false
            };
            showAdjustedTaskPreview({ ...plan, tasks: [...plan.tasks, newTask] });
        }, 500);
    };

    /**
     * 模拟任务调整（MVP阶段）
     */
    const simulateTaskAdjustment = (
        plan: DayPlan, 
        action: string, 
        taskIndex?: number
    ) => {
        setTimeout(() => {
            const adjustedTasks = plan.tasks.map((task, index) => {
                if (action === 'reduce_all_difficulty' || 
                    (action === 'reduce_difficulty' && index === taskIndex)) {
                    return {
                        ...task,
                        title: task.title.replace('突破', '基础练习').replace('进阶', '基础'),
                        durationMinutes: Math.max(5, task.durationMinutes - 5)
                    };
                }
                return task;
            });
            
            const adjustedPlan = { ...plan, tasks: adjustedTasks };
            showAdjustedTaskPreview(adjustedPlan);
        }, 1000);
    };

    /**
     * 显示调整后的任务预览
     */
    const showAdjustedTaskPreview = (adjustedPlan: DayPlan) => {
        setLumiEmotion('happy');
        
        const taskList = adjustedPlan.tasks.map((task, index) => 
            `${index + 1}️⃣ ${task.subject} - ${task.title} (${task.durationMinutes}分钟)`
        ).join('\n');
        
        setTimeout(() => {
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                sender: 'lumi',
                text: `好的！调整后的任务安排：\n\n${taskList}\n\n这样安排可以吗？`,
                type: 'text'
            }]);
            
            setTimeout(() => {
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    sender: 'lumi',
                    text: '',
                    type: 'quick-reply',
                    quickReplies: ['👍 就这样', '💬 再改改', '✅ 确认'],
                    onQuickReply: (reply: string) => {
                        if (reply.includes('就这样') || reply.includes('确认')) {
                            confirmAdjustedPlan(adjustedPlan);
                        } else {
                            // 重新开始调整流程
                            startEditFlow(adjustedPlan);
                        }
                    }
                }]);
            }, 500);
        }, 1000);
    };

    /**
     * 确认调整后的计划
     */
    const confirmAdjustedPlan = (plan: DayPlan) => {
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            sender: 'user',
            text: '👍 就这样',
            type: 'text'
        }]);
        
        setTimeout(() => {
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                sender: 'lumi',
                text: '好的！任务已经调整好啦，快去看看吧~ ✨',
                type: 'text'
            }]);
            
            setTimeout(() => {
                if (onCheckInComplete) {
                    onCheckInComplete({ adjustedPlan: plan });
                }
            }, 1000);
        }, 500);
    };

    /**
     * 启动编辑模式对话流程
     */
    const startEditFlow = (plan: DayPlan) => {
        // 1. 展示当前任务
        setTimeout(() => {
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                sender: 'lumi',
                text: formatTaskListForMessage(plan),
                type: 'text'
            }]);
            
            // 2. 询问调整原因
            setTimeout(() => {
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    sender: 'lumi',
                    text: '💡 告诉我，你主要是想：',
                    type: 'quick-reply',
                    quickReplies: [
                        '太难了，简单点',
                        '太简单了，想挑战',
                        '想换个科目',
                        '时间不够，减少点',
                        '想多学点，加任务',
                        '其他原因'
                    ],
                    onQuickReply: (reply: string) => handleAdjustmentReason(reply, plan)
                }]);
            }, 500);
        }, 500);
    };

    /**
     * 处理解析后的用户意图
     */
    const handleParsedIntent = (intent: any, plan: DayPlan) => {
        switch (intent.action) {
            case 'reduce_difficulty':
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    sender: 'lumi',
                    text: `明白了！我会把${intent.subject}的任务调简单一点~`,
                    type: 'text'
                }]);
                simulateTaskAdjustment(plan, 'reduce_difficulty', 
                    plan.tasks.findIndex(t => t.subject === intent.subject));
                break;
                
            case 'remove_task':
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    sender: 'lumi',
                    text: `好的！我会删除${intent.subject}的任务~`,
                    type: 'text'
                }]);
                const filteredTasks = plan.tasks.filter(t => t.subject !== intent.subject);
                showAdjustedTaskPreview({ ...plan, tasks: filteredTasks });
                break;
                
            case 'add_task':
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    sender: 'lumi',
                    text: `好的！我会为你增加${intent.subject}的任务~`,
                    type: 'text'
                }]);
                const newTask: Task = {
                    id: `new-${Date.now()}`,
                    title: `${intent.subject} - 基础练习`,
                    subject: intent.subject,
                    durationMinutes: 10,
                    completed: false
                };
                showAdjustedTaskPreview({ ...plan, tasks: [...plan.tasks, newTask] });
                break;
                
            default:
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    sender: 'lumi',
                    text: '我没太理解，能再说具体一点吗？比如"数学太难了"或"删除英语任务"~',
                    type: 'text'
                }]);
        }
    };

    // --- Actions ---

    const appendLumiMessage = (text: string, extra?: Partial<Message>) => {
        setLumiEmotion('happy');
        setMessages((prev) => [
            ...prev,
            {
                id: `${Date.now()}-lumi`,
                sender: 'lumi',
                text,
                type: 'text',
                ...extra,
            },
        ]);
        window.setTimeout(() => setLumiEmotion('idle'), 2000);
    };

    const handlePhotoMessageReply = (
        photosToSend: string[],
        classifications: PhotoClassification[],
        userText: string,
    ) => {
        window.setTimeout(() => {
            const { text, buttons, triageItems } = buildPhotoReplyContent(
                photosToSend,
                classifications,
                userText,
            );

            appendLumiMessage(
                text,
                triageItems.length > 0 || buttons.length > 0
                    ? {
                        type: 'quick-reply',
                        photoActionButtons: buttons,
                        photoTriageItems: triageItems,
                        photoTriageUrls: photosToSend,
                        imageClassifications: classifications,
                        onPhotoAction: (action) => handlePhotoReplyAction(action, classifications),
                    }
                    : undefined,
            );
        }, 1500);
    };

    const handleSendMessage = () => {
        if (guardIfLumiReplying()) return;
        if (isSessionTurnLimited) {
            showBusyToast('这个话题聊得够久啦，新建一个会话继续吧～');
            return;
        }
        const userText = inputText.trim();
        const readyPhotos = pendingPhotos.filter((photo) => photo.status === 'success');
        const photosToSend = readyPhotos.map((photo) => photo.url);
        if (!userText && photosToSend.length === 0) return;

        if (photosToSend.length > 0 && imageUploadCount + photosToSend.length > IMAGE_UPLOAD_LIMIT) {
            showBusyToast(`今天图片额度不够用啦（还剩 ${Math.max(0, IMAGE_UPLOAD_LIMIT - imageUploadCount)} 张）`);
            return;
        }

        const classifications = photosToSend.length > 0
            ? readyPhotos.map((photo) => photo.classification ?? classifyLumiPhoto(photo.url))
            : [];

        const newMsg: Message = {
            id: Date.now().toString(),
            sender: 'user',
            text: userText,
            type: photosToSend.length > 0 ? 'image' : 'text',
            imageUrls: photosToSend.length > 0 ? photosToSend : undefined,
            imageClassifications: classifications.length > 0 ? classifications : undefined,
        };
        
        // #region agent log
        const inputEl = document.querySelector('.absolute.bottom-24');
        const beforeRect = inputEl?.getBoundingClientRect();
        fetch('http://127.0.0.1:7245/ingest/85c68675-85c7-485d-9d2a-58e28774ad7e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'LumiSpace.tsx:742',message:'Before message send',data:{messagesCount:messages.length,inputRect:beforeRect,userText:userText.substring(0,20)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C,E'})}).catch(()=>{});
        // #endregion
        
        setMessages(prev => [...prev, newMsg]);
        setInputText('');
        setPendingPhotos([]);
        photoUploadTimersRef.current.forEach(clearTimeout);
        photoUploadTimersRef.current = [];
        setLumiEmotion('listening');
        setSessionTouched(true);
        setSessionTurnCount((prev) => prev + 1);
        if (photosToSend.length > 0) {
            setImageUploadCount((prev) => prev + photosToSend.length);
        }
        
        // #region agent log
        setTimeout(() => {
            const afterEl = document.querySelector('.absolute.bottom-24');
            const afterRect = afterEl?.getBoundingClientRect();
            fetch('http://127.0.0.1:7245/ingest/85c68675-85c7-485d-9d2a-58e28774ad7e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'LumiSpace.tsx:742-after',message:'After message send',data:{messagesCount:messages.length+1,inputRect:afterRect,positionChanged:beforeRect?.top !== afterRect?.top},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'C,E'})}).catch(()=>{});
        }, 50);
        // #endregion

        if (photosToSend.length > 0) {
            handlePhotoMessageReply(photosToSend, classifications, userText);
            return;
        }

        // --- Check if in task adjustment mode ---
        if (existingPlan && isInCheckIn) {
            // 编辑模式 - 尝试解析用户意图
            setTimeout(() => {
                const intent = parseAdjustmentIntent(userText, existingPlan);
                
                if (intent.action !== 'unknown') {
                    // 识别到意图，进行相应处理
                    handleParsedIntent(intent, existingPlan);
                } else {
                    // 未识别到意图，友好提示
                    setMessages(prev => [...prev, {
                        id: Date.now().toString(),
                        sender: 'lumi',
                        text: '我没太理解，能再说具体一点吗？比如"数学太难了"或"删除英语任务"~',
                        type: 'text'
                    }]);
                }
                setTimeout(() => setLumiEmotion('idle'), 2000);
            }, 800);
            return;
        } else if (existingPlan && !isInCheckIn) {
            // 自由对话模式（编辑模式但不在结构化流程中）
            setTimeout(() => {
                const intent = parseAdjustmentIntent(userText, existingPlan);
                
                if (intent.action !== 'unknown') {
                    handleParsedIntent(intent, existingPlan);
                } else {
                    setMessages(prev => [...prev, {
                        id: Date.now().toString(),
                        sender: 'lumi',
                        text: '我理解了！你是想调整任务对吗？可以试试说：\n• "数学太难了，简单点"\n• "再加一个语文"\n• "不想做英语了"',
                        type: 'text'
                    }]);
                }
                setTimeout(() => setLumiEmotion('idle'), 2000);
            }, 800);
            return;
        }

        // --- Proactive Emotion Analysis Logic ---
        const lowerText = userText.toLowerCase();
        let replyText = '收到啦！无论发生什么，我都在这里陪着你。💛';
        let recommendedGame: 'shredder' | 'breathing' | undefined = undefined;

        if (lowerText.includes('烦') || lowerText.includes('生气') || lowerText.includes('讨厌') || lowerText.includes('不开心')) {
            replyText = '感觉到你心情好像不太好，要把这些坏情绪都“粉碎”掉吗？';
            recommendedGame = 'shredder';
        } else if (lowerText.includes('累') || lowerText.includes('焦虑') || lowerText.includes('紧张') || lowerText.includes('难受')) {
            replyText = '抱抱你。深呼吸，我们一起调整一下节奏吧？';
            recommendedGame = 'breathing';
        }

        if (recommendedGame) {
            setTimeout(() => {
                setLumiEmotion('idle');
                setMessages(prev => [...prev, {
                    id: (Date.now()+1).toString(),
                    sender: 'lumi',
                    text: replyText,
                    type: 'text'
                }]);
                setTimeout(() => {
                    setMessages(prev => [...prev, {
                        id: (Date.now()+2).toString(),
                        sender: 'lumi',
                        text: '',
                        type: 'game-recommendation',
                        gameId: recommendedGame
                    }]);
                }, 500);
            }, 1200);
            return;
        }

        // 联网搜索 Agent（默认路径）
        (async () => {
            const statusId = `search-${Date.now()}`;
            setIsAgentSearching(true);
            setLumiEmotion('listening');
            // ① 思考中：三点 + 文案（用户发送后立即出现，不等风控）
            setMessages((prev) => [
                ...prev,
                {
                    id: statusId,
                    sender: 'lumi',
                    text: '小晤正在思考…',
                    type: 'search-status',
                    searchPhase: 'loading',
                },
            ]);

            try {
                await new Promise((resolve) => setTimeout(resolve, 700));

                // ② 联网搜索中（直接替换思考中，单一指示器）
                setMessages((prev) =>
                    prev.map((msg) =>
                        msg.id === statusId
                            ? {
                                ...msg,
                                text: '联网搜索中...',
                                searchPhase: 'searching',
                            }
                            : msg,
                    ),
                );

                const result = await runLumiWebSearch(userText);

                // ③ 搜索完成：移除过程状态气泡，输出带 query 顶部小字的回答气泡
                setMessages((prev) => prev.filter((msg) => msg.id !== statusId));
                setLumiEmotion('happy');
                setMessages((prev) => [
                    ...prev,
                    {
                        id: `answer-${Date.now()}`,
                        sender: 'lumi',
                        text: result.answer,
                        type: 'search-answer',
                        searchSources: result.sources,
                        searchQuery: result.searchQuery,
                    },
                ]);
            } catch {
                setMessages((prev) => prev.filter((msg) => msg.id !== statusId));
                setLumiEmotion('idle');
                showAgentErrorToast();
            } finally {
                setIsAgentSearching(false);
                setTimeout(() => setLumiEmotion('idle'), 2000);
            }
        })();
    };

    const startPendingPhotoUploads = (photos: string[]) => {
        if (isSessionTurnLimited) {
            showBusyToast('这个话题聊得够久啦，新建一个会话继续吧～');
            return;
        }
        if (isImageUploadLimited) {
            showBusyToast('今天不能拍照啦，可以语音或打字聊哦~');
            return;
        }
        const remaining = IMAGE_UPLOAD_LIMIT - imageUploadCount;
        const accepted = photos.slice(0, Math.max(0, remaining));
        if (accepted.length === 0) {
            showBusyToast('今天不能拍照啦，可以语音或打字聊哦~');
            return;
        }
        if (accepted.length < photos.length) {
            showBusyToast(`图片额度只够再传 ${accepted.length} 张啦`);
        }

        photoUploadTimersRef.current.forEach(clearTimeout);
        photoUploadTimersRef.current = [];

        const batchId = Date.now();
        const items: PendingPhoto[] = accepted.map((url, index) => ({
            id: `${batchId}-${index}`,
            url,
            status: 'uploading',
            classification: classifyLumiPhoto(url),
        }));
        setPendingPhotos(items);

        items.forEach((item, index) => {
            const timer = window.setTimeout(() => {
                const status = simulatePhotoUploadStatus(index, items.length);
                const classification = status === 'success' ? classifyLumiPhoto(item.url) : undefined;
                setPendingPhotos((prev) =>
                    prev.map((photo) =>
                        photo.id === item.id
                            ? { ...photo, status, classification }
                            : photo,
                    ),
                );
            }, 900 + index * 500);
            photoUploadTimersRef.current.push(timer);
        });
    };

    const handleCameraConfirm = (result: LumiCameraConfirmResult) => {
        setIsCameraOpen(false);
        if (result.mode === 'ask') {
            startPendingPhotoUploads(result.photos);
            return;
        }
        processingShotIdsRef.current = result.shotIds;
        setProcessingShotIds(result.shotIds);
    };

    const handleRemovePendingPhoto = (id: string) => {
        setPendingPhotos((prev) => prev.filter((photo) => photo.id !== id));
    };

    const handleRetryPendingPhoto = (id: string) => {
        setPendingPhotos((prev) =>
            prev.map((photo) => (photo.id === id ? { ...photo, status: 'uploading' } : photo)),
        );
        const timer = window.setTimeout(() => {
            setPendingPhotos((prev) =>
                prev.map((photo) =>
                    photo.id === id
                        ? { ...photo, status: 'success', classification: classifyLumiPhoto(photo.url) }
                        : photo,
                ),
            );
        }, 1200);
        photoUploadTimersRef.current.push(timer);
    };

    const handleVoiceInput = () => {
        if (isListening) {
            speechRecognitionRef.current?.stop();
            return;
        }
        if (guardIfLumiReplying()) return;

        const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognitionCtor) {
            voiceBaseRef.current = inputText.trim();
            setIsListening(true);
            setVoiceTranscript(voiceBaseRef.current || '聆听中...');
            window.setTimeout(() => {
                const mock = '帮我看看这几道题';
                const merged = voiceBaseRef.current ? `${voiceBaseRef.current} ${mock}` : mock;
                setInputText(merged);
                setVoiceTranscript('');
                voiceTranscriptRef.current = '';
                voiceBaseRef.current = '';
                setIsListening(false);
            }, 1500);
            return;
        }

        const recognition = new SpeechRecognitionCtor();
        recognition.lang = 'zh-CN';
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        voiceBaseRef.current = inputText.trim();
        voiceTranscriptRef.current = voiceBaseRef.current;
        setVoiceTranscript(voiceBaseRef.current || '');

        recognition.onresult = (event) => {
            let finalTranscript = '';
            let interimTranscript = '';
            for (let i = 0; i < event.results.length; i++) {
                const part = event.results[i][0]?.transcript ?? '';
                if (event.results[i].isFinal) {
                    finalTranscript += part;
                } else {
                    interimTranscript += part;
                }
            }
            const recognized = (finalTranscript + interimTranscript).trim();
            const display = voiceBaseRef.current && recognized
                ? `${voiceBaseRef.current} ${recognized}`
                : (recognized || voiceBaseRef.current);
            voiceTranscriptRef.current = display;
            setVoiceTranscript(display);
        };

        recognition.onerror = () => {
            const final = voiceTranscriptRef.current.trim();
            if (final) setInputText(final);
            setVoiceTranscript('');
            voiceTranscriptRef.current = '';
            voiceBaseRef.current = '';
            setIsListening(false);
            speechRecognitionRef.current = null;
        };

        recognition.onend = () => {
            const final = voiceTranscriptRef.current.trim();
            if (final) setInputText(final);
            setVoiceTranscript('');
            voiceTranscriptRef.current = '';
            voiceBaseRef.current = '';
            setIsListening(false);
            speechRecognitionRef.current = null;
        };

        speechRecognitionRef.current = recognition;
        setIsListening(true);
        recognition.start();
    };

    const successfulPendingPhotos = pendingPhotos.filter((photo) => photo.status === 'success');
    const isPhotoUploading = pendingPhotos.some((photo) => photo.status === 'uploading');
    const canSendMessage = Boolean(inputText.trim() || successfulPendingPhotos.length > 0) && !isPhotoUploading;

    const handlePlanComplete = (tasks: Task[]) => {
        if (onCheckInComplete) {
            onCheckInComplete({ tasks }); // Pass tasks back to Dashboard
        }
    };

    const shouldAskSessionFeedback = () => {
        if (sessionFeedbackShownRef.current) return false;
        const userCount = messages.filter((msg) => msg.sender === 'user').length;
        const totalCount = messages.length;
        return (
            userCount >= SESSION_FEEDBACK_MIN_USER_MESSAGES
            && totalCount >= SESSION_FEEDBACK_MIN_TOTAL_MESSAGES
        );
    };

    const openSessionFeedback = () => {
        sessionFeedbackShownRef.current = true;
        setIsDrawerOpen(false);
        setIsFeedbackOpen(true);
    };

    const resetSessionChrome = () => {
        clearAllStreams();
        stopLumiSpeech();
        setSpeakingMessageId(null);
        setStreamState({});
        setPendingPhotos([]);
        photoUploadTimersRef.current.forEach(clearTimeout);
        photoUploadTimersRef.current = [];
        setInputText('');
        setIsDrawerOpen(false);
        setIsFeedbackOpen(false);
        sessionFeedbackShownRef.current = false;
    };

    const commitSessionToHistory = (
        prev: HistoryItem[],
        id: string | null,
        title: string | null,
        currentMessages: Message[],
    ) => {
        if (!id) return prev;
        return prev.map((item) => (
            item.id === id
                ? {
                    ...item,
                    title: title || item.title,
                    preview: previewFromMessages(currentMessages),
                    messages: currentMessages,
                }
                : item
        ));
    };

    const startNewSession = (title: string, nextMessages: Message[]) => {
        resetSessionChrome();
        const currentMessages = messagesRef.current;
        const currentTitle = sessionTitleRef.current;
        const currentId = activeHistoryIdRef.current;
        const newId = `h-${Date.now()}`;
        setHistory((prev) => {
            const saved = commitSessionToHistory(prev, currentId, currentTitle, currentMessages);
            return [
                {
                    id: newId,
                    title,
                    date: '刚刚',
                    preview: previewFromMessages(nextMessages),
                    messages: nextMessages,
                },
                ...saved,
            ];
        });
        setActiveHistoryId(newId);
        setSessionTitle(title);
        setMessages(nextMessages);
        setSessionTurnCount(countUserTurns(nextMessages));
        // 演示：新建会话后图片额度恢复，方便连续演示两条异常
        setImageUploadCount(0);
        setSurface('session');
        setSessionTouched(false);
        setContinueTitle(null);
    };

    const openHistoryItem = (item: HistoryItem) => {
        if (item.id === activeHistoryIdRef.current && surface === 'session') {
            setIsDrawerOpen(false);
            return;
        }
        resetSessionChrome();
        const currentMessages = messagesRef.current;
        const currentTitle = sessionTitleRef.current;
        const currentId = activeHistoryIdRef.current;
        if (currentId && currentId !== item.id) {
            setHistory((prev) => commitSessionToHistory(prev, currentId, currentTitle, currentMessages));
        }
        const loaded: Message[] = item.messages?.length
            ? item.messages
            : [{ id: `${item.id}-l`, sender: 'lumi', text: item.preview || '我们接着聊。', type: 'text' }];
        setActiveHistoryId(item.id);
        setSessionTitle(item.title);
        setMessages(loaded);
        setSessionTurnCount(
            typeof item.sessionTurnRemaining === 'number'
                ? Math.max(0, SESSION_TURN_LIMIT - item.sessionTurnRemaining)
                : countUserTurns(loaded),
        );
        setImageUploadCount(
            item.imageQuotaLocked
                ? Math.max(0, IMAGE_UPLOAD_LIMIT - IMAGE_QUOTA_DEMO_REMAINING)
                : 0,
        );
        setSessionTouched(loaded.some((msg) => msg.sender === 'user'));
        setSurface('session');
        setContinueTitle(null);
        setIsDrawerOpen(false);
    };

    const executeNewChat = () => {
        if (checkInMode) {
            resetSessionChrome();
            setMessages(CHECK_IN_INITIAL_MESSAGES);
            setSessionTurnCount(0);
            setImageUploadCount(0);
            return;
        }
        startNewSession('随便聊聊', [
            { id: `free-${Date.now()}`, sender: 'lumi', text: FREE_CHAT_OPENER, type: 'text' },
        ]);
    };

    const handleNewChat = () => {
        // 回合已满时直接新建，不打断演示去弹反馈
        if (isSessionTurnLimited || shouldAskSessionFeedback()) {
            if (isSessionTurnLimited) {
                executeNewChat();
                return;
            }
            openSessionFeedback();
            return;
        }
        executeNewChat();
    };

    const handleFeedbackSubmit = (payload: SessionFeedbackPayload) => {
        const userCount = messages.filter((msg) => msg.sender === 'user').length;
        console.info('[SessionFeedback]', {
            ...payload,
            trigger: 'new-chat',
            userMessageCount: userCount,
            totalMessageCount: messages.length,
        });
        executeNewChat();
    };

    const handleFeedbackSkip = () => {
        executeNewChat();
    };

    const handleFeedbackClose = () => {
        setIsFeedbackOpen(false);
    };

    const handleGameComplete = (msg?: string) => {
        setActiveGame(null);
        setLumiEmotion('happy');
        if (msg) {
            setMessages(prev => [...prev, { id: Date.now().toString(), sender: 'lumi', text: msg, type: 'system' }]);
        }
        setTimeout(() => setLumiEmotion('idle'), 3000);
    };

    const openHub = () => {
        const currentMessages = messagesRef.current;
        const currentTitle = sessionTitleRef.current;
        const currentId = activeHistoryIdRef.current;
        if (currentId) {
            setHistory((prev) => commitSessionToHistory(prev, currentId, currentTitle, currentMessages));
        }
        const activeItem = currentId ? history.find((item) => item.id === currentId) : undefined;
        const isQuotaDemo = Boolean(activeItem && isQuotaDemoHistory(activeItem));
        // Token 限额演示会话不出现在首页「继续」
        if (!isQuotaDemo && (sessionTouched || currentMessages.some((msg) => msg.sender === 'user'))) {
            setContinueTitle(currentTitle || '刚才的对话');
        } else {
            setContinueTitle(null);
        }
        setSurface('hub');
    };

    const handleOpenFreeChat = () => {
        startNewSession('随便聊聊', [
            { id: `free-${Date.now()}`, sender: 'lumi', text: FREE_CHAT_OPENER, type: 'text' },
        ]);
    };

    const handleShuffleCuriosity = () => {
        setCuriosityPack((prev) => {
            const index = CURIOSITY_PACKS.findIndex((item) => item.id === prev.id);
            return CURIOSITY_PACKS[(index + 1) % CURIOSITY_PACKS.length];
        });
    };

    const handleOpenCuriosity = (card: HubCuriosityCard) => {
        startNewSession(card.text, [
            {
                id: `curious-${card.id}-${Date.now()}`,
                sender: 'lumi',
                text: `${card.text}\n你先猜，还是要我直接讲？`,
                type: 'text',
            },
        ]);
    };

    const handleOpenSpark = (spark: HubSpark) => {
        startNewSession(spark.openerTitle, [
            {
                id: `spark-${spark.id}-${Date.now()}`,
                sender: 'lumi',
                text: spark.openerText,
                type: spark.replies ? 'quick-reply' : 'text',
                quickReplies: spark.replies,
                onQuickReply: spark.replies
                    ? (reply) => {
                        setSessionTouched(true);
                        if (reply === '聊聊别的') {
                            setMessages((prev) => [
                                ...prev,
                                { id: `${Date.now()}`, sender: 'user', text: reply, type: 'text' },
                                { id: `${Date.now()}-l`, sender: 'lumi', text: '好，想聊什么直接说。', type: 'text' },
                            ]);
                            return;
                        }
                        setMessages((prev) => [
                            ...prev,
                            { id: `${Date.now()}`, sender: 'user', text: reply, type: 'text' },
                            { id: `${Date.now()}-l`, sender: 'lumi', text: '好，我们按这个来。中途想换成随便聊，直接说就行。', type: 'text' },
                        ]);
                    }
                    : undefined,
            },
        ]);
    };

    // --- History Edit Actions ---
    const startEditing = (e: React.MouseEvent, item: HistoryItem) => {
        e.stopPropagation();
        setEditingItemId(item.id);
        setEditValue(item.title);
    };

    const saveEditing = (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (editingItemId && editValue.trim()) {
            setHistory(prev => prev.map(h => h.id === editingItemId ? { ...h, title: editValue.trim() } : h));
        }
        setEditingItemId(null);
        setEditValue('');
    };

    const deleteHistoryItem = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (window.confirm('确定要删除这条对话记录吗？')) {
            setHistory(prev => prev.filter(h => h.id !== id));
            if (activeHistoryIdRef.current === id) {
                setActiveHistoryId(null);
                setContinueTitle(null);
                setSurface('hub');
            }
        }
    };

    // --- RENDER ---
    const viewport = typeof document !== 'undefined' ? document.getElementById('app-viewport') : null;

    return (
        <div className="w-full h-full relative overflow-hidden flex flex-col bg-slate-900 text-white">
            
            {/* 1. Scene Background Video */}
            <div className="absolute inset-0 z-0">
                <img
                    src={bgFallback}
                    alt="小晤伴学角色"
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    poster={bgFallback}
                    onPlaying={() => setIsBackgroundVideoPlaying(true)}
                    onPause={() => setIsBackgroundVideoPlaying(false)}
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-200 ${isBackgroundVideoPlaying ? 'opacity-100' : 'opacity-0'}`}
                >
                    <source src={bgVideo} type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-black/10" />
            </div>

            {/* 3. Main Layout Wrapper - New Three-Section Layout */}
            <div 
                className="flex-1 flex flex-col min-h-0 relative z-10 transition-all duration-500 overflow-hidden"
                ref={(el) => {
                    // #region agent log
                    if (el) {
                        const rect = el.getBoundingClientRect();
                        fetch('http://127.0.0.1:7245/ingest/85c68675-85c7-485d-9d2a-58e28774ad7e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'LumiSpace.tsx:931',message:'Main container NEW LAYOUT',data:{containerRect:rect,messagesLength:messages.length},timestamp:Date.now(),sessionId:'debug-session',runId:'layout-fix',hypothesisId:'H,I'})}).catch(()=>{});
                    }
                    // #endregion
                }}
            >
                {/* 移除pb-24，改用新的三段式布局 */}
                {/* 3a. Fixed Top Navigation - Absolutely positioned for stability */}
                <div 
                    className="absolute top-0 left-0 right-0 z-20 px-4 md:px-8 pt-4 pb-2 bg-gradient-to-b from-[#E0F2FE] to-transparent"
                    ref={(el) => {
                        // #region agent log
                        if (el) {
                            const rect = el.getBoundingClientRect();
                            fetch('http://127.0.0.1:7245/ingest/85c68675-85c7-485d-9d2a-58e28774ad7e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'LumiSpace.tsx:nav-fixed',message:'Navigation FIXED position',data:{navRect:rect,stable:rect.top <= 10},timestamp:Date.now(),sessionId:'debug-session',runId:'stability-fix',hypothesisId:'P,Q,R'})}).catch(()=>{});
                        }
                        // #endregion
                    }}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {isHub ? (
                            <button 
                                onClick={() => setIsDrawerOpen(true)}
                                className="p-2 bg-white/60 backdrop-blur-md rounded-full shadow-sm hover:bg-white transition-all text-gray-600 border border-white/50"
                                aria-label="打开菜单"
                            >
                                <Menu size={16} />
                            </button>
                            ) : null}
                            {!isHub && !checkInMode ? (
                                <button
                                    type="button"
                                    onClick={openHub}
                                    aria-label="返回"
                                    className="w-10 h-10 bg-white/60 backdrop-blur-md rounded-full shadow-sm hover:bg-white transition-all text-gray-600 border border-white/50 flex items-center justify-center"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                            ) : null}
                        </div>

                        {!isHub && sessionTitle ? (
                        <p className="absolute left-1/2 -translate-x-1/2 text-sm font-black text-slate-700 drop-shadow-sm pointer-events-none">
                            {sessionTitle}
                        </p>
                        ) : null}

                        {isHub ? (
                            <button
                                type="button"
                                onClick={handleShuffleCuriosity}
                                className="p-2 bg-white/60 backdrop-blur-md rounded-full shadow-sm hover:bg-white transition-all text-gray-600 border border-white/50"
                                aria-label="换今日邀约"
                            >
                                <RefreshCw size={16} />
                            </button>
                        ) : (
                            <span className="w-9 shrink-0" aria-hidden />
                        )}
                    </div>
                </div>

                {isHub ? (
                    <LumiHubStage
                        pack={curiosityPack}
                        continueTitle={
                            continueTitle
                            && !history.some((item) => item.isDemo && item.title === continueTitle)
                                ? continueTitle
                                : null
                        }
                        onOpenCuriosity={handleOpenCuriosity}
                        onOpenSpark={handleOpenSpark}
                        onOpenFreeChat={handleOpenFreeChat}
                        onRefreshInvites={handleShuffleCuriosity}
                        onContinue={() => {
                            setSurface('session');
                        }}
                    />
                ) : null}

                {/* 3b. Fixed Lumi Avatar Area - REMOVED (Now integrated into background video) */}

                {!isHub ? (
                <div 
                  className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-4 md:px-8 pt-[4.75rem] pb-3"
                  ref={(el) => {
                      chatContainerRef.current = el; 
                        // #region agent log
                        if (el) {
                            const rect = el.getBoundingClientRect();
                            const inputBox = document.querySelector('[data-lumi-input-area]');
                            const inputRect = inputBox?.getBoundingClientRect();
                            const gap = inputRect ? inputRect.top - rect.bottom : null;
                            fetch('http://127.0.0.1:7245/ingest/85c68675-85c7-485d-9d2a-58e28774ad7e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'LumiSpace.tsx:scroll-area',message:'Chat flex scroll area',data:{chatRect:rect,inputRect:inputRect,gapBetween:gap,messagesCount:messages.length},timestamp:Date.now(),sessionId:'debug-session',runId:'stability-fix',hypothesisId:'P,R'})}).catch(()=>{});
                        }
                        // #endregion
                    }}
                >
                    <div className="space-y-4 max-w-2xl mx-auto w-full pb-6">
                        {messages.map((msg) => (
                            <motion.div 
                                key={msg.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                            >
                                {/* Image Message — 微信式干净气泡 */}
                                {(msg.type === 'image' || msg.imageUrls?.length || msg.imageUrl) && (() => {
                                    const imageList = msg.imageUrls ?? (msg.imageUrl ? [msg.imageUrl] : []);
                                    const gridCols = imageList.length >= 3 ? 'grid-cols-3' : imageList.length === 2 ? 'grid-cols-2' : 'grid-cols-1';
                                    return (
                                    <div className="flex flex-col items-end gap-2 max-w-[72%]">
                                    <div className="relative p-1.5 bg-white rounded-2xl shadow-sm border border-white/50">
                                        {msg.text.trim() ? (
                                            <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line px-2 pt-1.5 pb-2">
                                                {msg.text}
                                            </p>
                                        ) : null}
                                        <div className={`grid ${gridCols} gap-1 p-0.5`}>
                                            {imageList.map((url, index) => {
                                                const thumbSize = imageList.length === 1
                                                    ? 'w-40 h-40 md:w-44 md:h-44'
                                                    : 'w-[88px] h-[88px] md:w-24 md:h-24';
                                                return (
                                                <div
                                                    key={`${msg.id}-img-${index}`}
                                                    className={`relative rounded-lg overflow-hidden bg-gray-100 ${thumbSize}`}
                                                >
                                                    <img
                                                        src={url}
                                                        alt={`上传图片 ${index + 1}`}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    </div>
                                    );
                                })()}

                                {/* Text / System Message */}
                                {(msg.type === 'text' || msg.type === 'system' || (msg.type === 'quick-reply' && msg.text)) && (
                                    <div className="max-w-[85%]">
                                        <div className={`px-5 py-3 rounded-2xl text-sm font-medium leading-relaxed shadow-sm ${
                                            msg.sender === 'user' 
                                                ? 'bg-brand text-white rounded-tr-sm shadow-brand/20 whitespace-pre-line' 
                                                : msg.type === 'system' 
                                                    ? 'bg-gray-100/80 text-gray-500 text-xs py-2 border border-gray-200 whitespace-pre-line' 
                                                    : 'bg-white text-gray-700 rounded-tl-sm border border-white/50 flex items-center justify-center gap-2'
                                        }`}>
                                            {msg.sender === 'lumi' && msg.text && msg.type !== 'system' && isLumiStreamDone(msg) ? (
                                                <button
                                                    type="button"
                                                    onClick={() => handlePlayMessage(msg.id, msg.text)}
                                                    aria-label={speakingMessageId === msg.id ? '重新播放' : '播放语音'}
                                                    className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                                                        speakingMessageId === msg.id
                                                            ? 'bg-brand text-white shadow-sm shadow-brand/30'
                                                            : 'bg-gray-100/90 text-gray-400 hover:bg-brand/10 hover:text-brand'
                                                    }`}
                                                >
                                                    <Volume2 size={13} className={speakingMessageId === msg.id ? 'animate-pulse' : ''} />
                                                </button>
                                            ) : null}
                                            <div className="whitespace-pre-line">
                                                {msg.sender === 'lumi' && msg.text
                                                    ? (
                                                        <>
                                                            {getLumiDisplayText(msg)}
                                                            {!isLumiStreamDone(msg) ? (
                                                                <span className="inline-block w-[2px] h-[1em] ml-0.5 bg-brand/70 align-middle animate-pulse" />
                                                            ) : null}
                                                        </>
                                                    )
                                                    : msg.text}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* 联网搜索过程指示：思考中（三点）→ 联网搜索中（单一指示器，直接替换） */}
                                {msg.type === 'search-status' ? (
                                    <div className="max-w-[85%]">
                                        {msg.searchPhase === 'loading' ? (
                                            <div
                                                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white/90 border border-white/60 shadow-sm"
                                                aria-label="小晤正在思考"
                                            >
                                                {[0, 1, 2].map((i) => (
                                                    <span
                                                        key={i}
                                                        className="w-1.5 h-1.5 rounded-full bg-brand/70 animate-bounce"
                                                        style={{ animationDelay: `${i * 0.15}s` }}
                                                    />
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/90 border border-white/60 shadow-sm text-gray-600">
                                                <Loader2 size={14} className="text-brand animate-spin shrink-0" />
                                                <p className="text-xs font-bold">联网搜索中...</p>
                                            </div>
                                        )}
                                    </div>
                                ) : null}

                                {/* 搜索回答（顶部 query 小字 + 带来源角标） */}
                                {msg.type === 'search-answer' ? (
                                    <div className="max-w-[85%] rounded-2xl text-sm font-medium leading-relaxed shadow-sm bg-white text-gray-700 rounded-tl-sm border border-white/50 overflow-hidden">
                                        {msg.searchQuery ? (
                                            <div className="px-5 pt-2.5 text-[11px] text-gray-400 font-medium">
                                                关于「{msg.searchQuery}」
                                            </div>
                                        ) : null}
                                        <div className="px-5 py-3 flex items-start gap-2">
                                            {msg.text && isLumiStreamDone(msg) ? (
                                                <button
                                                    type="button"
                                                    onClick={() => handlePlayMessage(msg.id, msg.text)}
                                                    aria-label={speakingMessageId === msg.id ? '重新播放' : '播放语音'}
                                                    className={`shrink-0 w-7 h-7 mt-0.5 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                                                        speakingMessageId === msg.id
                                                            ? 'bg-brand text-white shadow-sm shadow-brand/30'
                                                            : 'bg-gray-100/90 text-gray-400 hover:bg-brand/10 hover:text-brand'
                                                    }`}
                                                >
                                                    <Volume2 size={13} className={speakingMessageId === msg.id ? 'animate-pulse' : ''} />
                                                </button>
                                            ) : null}
                                            <CitedSearchText
                                                text={getLumiDisplayText(msg) || ''}
                                                sources={msg.searchSources}
                                                showCursor={!isLumiStreamDone(msg)}
                                            />
                                        </div>
                                    </div>
                                ) : null}

                                {msg.sender === 'lumi' && msg.photoTriageItems && msg.photoTriageUrls && msg.photoTriageItems.length > 0 && isLumiStreamDone(msg) ? (
                                    <LumiPhotoTriageCard
                                        imageUrls={msg.photoTriageUrls}
                                        items={msg.photoTriageItems}
                                        onAction={(action) => msg.onPhotoAction?.(action)}
                                    />
                                ) : null}

                                {msg.sender === 'lumi' && msg.photoActionButtons && msg.photoActionButtons.length > 0 && isLumiStreamDone(msg) ? (
                                    <div className="flex flex-wrap gap-2 mt-2 max-w-[85%]">
                                        {msg.photoActionButtons.map((btn, idx) => (
                                            <button
                                                key={idx}
                                                type="button"
                                                onClick={() => msg.onPhotoAction?.(btn.action)}
                                                className="px-4 py-2 bg-white border-2 border-brand/30 text-brand rounded-full font-bold text-sm hover:bg-brand hover:text-white hover:border-brand transition-all shadow-sm active:scale-95"
                                            >
                                                {btn.label}
                                            </button>
                                        ))}
                                    </div>
                                ) : null}

                                {/* Quick Reply Buttons */}
                                {msg.type === 'quick-reply' && msg.quickReplies && !msg.photoActionButtons?.length && (
                                    <div className="flex flex-wrap gap-2 mt-2 max-w-[85%]">
                                        {msg.quickReplies.map((reply, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => msg.onQuickReply?.(reply)}
                                                className="px-4 py-2 bg-white border-2 border-brand/30 text-brand rounded-full font-bold text-sm hover:bg-brand hover:text-white hover:border-brand transition-all shadow-sm hover:shadow-md active:scale-95"
                                            >
                                                {reply}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Game Recommendation Card */}
                                {msg.type === 'game-recommendation' && msg.gameId && (
                                    <button 
                                        onClick={() => {
                                            setActiveGame(msg.gameId!);
                                            if (msg.gameId === 'shredder') setLumiEmotion('shredding');
                                            if (msg.gameId === 'breathing') setLumiEmotion('breathing');
                                        }}
                                        className="mt-2 bg-white/90 backdrop-blur-md border border-white/50 p-4 rounded-2xl shadow-lg flex items-center gap-4 group hover:scale-[1.02] transition-transform text-left w-full max-w-[280px]"
                                    >
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-md ${
                                            msg.gameId === 'shredder' ? 'bg-red-500' : 'bg-blue-500'
                                        }`}>
                                            {msg.gameId === 'shredder' ? <Sparkles size={20} /> : <Gamepad2 size={20} />}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-gray-800 text-sm">
                                                {msg.gameId === 'shredder' ? '试试「情绪碎纸机」' : '试试「呼吸共振」'}
                                            </h4>
                                            <p className="text-xs text-gray-500">
                                                {msg.gameId === 'shredder' ? '写下烦恼，一键粉碎' : '平复心情，找回状态'}
                                            </p>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-brand group-hover:text-white transition-colors">
                                            <ArrowRight size={16} />
                                        </div>
                                    </button>
                                )}
                            </motion.div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                </div>
                ) : null}

                {/* Toast：固定在聊天区与输入区之间 */}
                <AnimatePresence>
                    {!isHub && !activeGame && busyToast ? (
                        <motion.div
                            key="busy-toast"
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 6 }}
                            transition={{ duration: 0.2 }}
                            className="shrink-0 z-40 flex justify-center px-4 pb-2 pointer-events-none"
                        >
                            <div className="px-4 py-2.5 rounded-full bg-slate-900/90 text-white text-sm font-bold shadow-lg whitespace-nowrap">
                                {busyToast}
                            </div>
                        </motion.div>
                    ) : null}
                </AnimatePresence>

            {/* 3c. Input Area — 二级会话无底栏，用常规底边距 */}
            {!activeGame && !isHub && (
                <div 
                    className="shrink-0 z-30 px-4 md:px-8 pb-4 flex justify-center pointer-events-auto"
                    data-lumi-input-area
                    ref={(el) => {
                        // #region agent log
                        if (el) {
                            const rect = el.getBoundingClientRect();
                            const bottomNav = document.querySelector('.absolute.bottom-0[class*="z-40"]');
                            const bottomNavRect = bottomNav?.getBoundingClientRect();
                            const clearance = bottomNavRect ? rect.bottom - bottomNavRect.top : null;
                            fetch('http://127.0.0.1:7245/ingest/85c68675-85c7-485d-9d2a-58e28774ad7e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'LumiSpace.tsx:1072',message:'Input BOTTOM-40 + Chat pb-48 vs BottomNav',data:{inputRect:rect,bottomNavRect:bottomNavRect,clearance:clearance,overlap:clearance !== null && clearance > 0},timestamp:Date.now(),sessionId:'debug-session',runId:'final-fix',hypothesisId:'M,N,O'})}).catch(()=>{});
                        }
                        // #endregion
                    }}
                >
                    {/* bottom-24 对应导航栏高度，让输入框紧贴导航栏顶部 */}
                    <div className="w-full max-w-2xl flex flex-col gap-2">
                    <div className={`w-full flex items-end gap-3 ${isSessionTurnLimited ? 'justify-center' : ''}`}>
                        {isSessionTurnLimited ? (
                            <div className="w-[min(100%,28rem)] rounded-2xl border border-amber-200 bg-amber-50/95 shadow-sm px-4 py-2 flex items-center gap-3">
                                <p className="min-w-0 flex-1 text-[12px] font-bold text-amber-900">
                                    这个话题聊得够久啦，新建会话继续吧
                                </p>
                                <button
                                    type="button"
                                    onClick={handleNewChat}
                                    className="shrink-0 px-3 py-1.5 rounded-full bg-brand text-white text-[11px] font-bold hover:brightness-110 active:scale-95 transition-all"
                                >
                                    新建对话
                                </button>
                            </div>
                        ) : (
                        <>
                        {/* Camera Button */}
                        <button 
                            onClick={() => {
                                if (guardIfLumiReplying()) return;
                                if (isImageUploadLimited) {
                                    showBusyToast('今天不能拍照啦，可以语音或打字聊哦~');
                                    return;
                                }
                                setIsCameraOpen(true);
                            }}
                            className={`relative p-3 rounded-full shadow-lg border transition-all shrink-0 mt-1.5 mb-1.5 ${
                                isImageUploadLimited
                                    ? 'bg-slate-700 border-slate-600 text-slate-400 cursor-not-allowed'
                                    : 'bg-white border-gray-100 text-gray-500 hover:text-brand hover:bg-gray-50 active:scale-95'
                            }`}
                            aria-label={isImageUploadLimited ? '今日不能拍照' : '拍照问小晤'}
                            aria-disabled={isImageUploadLimited}
                        >
                            <Camera size={22} />
                        </button>

                        {/* Input Field */}
                        <div
                            className={`flex-1 bg-white rounded-[28px] p-2 pl-5 shadow-xl shadow-gray-200/50 border flex flex-col gap-2 transition-all ${
                            isListening
                                ? 'border-brand/30 ring-2 ring-brand/20'
                                : 'border-gray-100 focus-within:ring-2 focus-within:ring-brand/20'
                        }`}
                            onPointerDownCapture={(e) => {
                                if (!isLumiReplying || isListening) return;
                                const target = e.target as HTMLElement;
                                if (target.closest('button')) return;
                                e.preventDefault();
                                (document.activeElement as HTMLElement | null)?.blur?.();
                                showBusyToast();
                            }}
                        >
                            {pendingPhotos.length > 0 ? (
                                <div className="flex flex-col gap-1.5 pt-1">
                                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                                    {pendingPhotos.map((photo, index) => (
                                        <div
                                            key={photo.id}
                                            className="relative shrink-0 w-16 h-16 rounded-xl overflow-hidden border border-gray-100 bg-gray-50"
                                        >
                                            <img
                                                src={photo.url}
                                                alt={`待发送 ${index + 1}`}
                                                className={`w-full h-full object-cover transition-opacity ${
                                                    photo.status === 'uploading' ? 'opacity-40' : photo.status === 'error' ? 'opacity-30' : ''
                                                }`}
                                            />

                                            {photo.status === 'uploading' ? (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/25 gap-1">
                                                    <Loader2 size={18} className="text-white animate-spin" />
                                                    <span className="text-[9px] font-bold text-white/90">上传中</span>
                                                </div>
                                            ) : null}

                                            {photo.status === 'success' ? (
                                                <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                                                    <Check size={10} strokeWidth={3} />
                                                </div>
                                            ) : null}

                                            {photo.status === 'error' ? (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-500/20 gap-0.5">
                                                    <AlertCircle size={16} className="text-red-500" />
                                                    <span className="text-[9px] font-bold text-red-600">上传失败</span>
                                                </div>
                                            ) : null}

                                            {photo.status === 'error' ? (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRetryPendingPhoto(photo.id)}
                                                    className="absolute bottom-1 left-1 w-5 h-5 rounded-full bg-white/90 text-red-500 flex items-center justify-center shadow-sm hover:bg-white transition-colors"
                                                    aria-label={`重试上传第 ${index + 1} 张图片`}
                                                >
                                                    <RotateCcw size={10} />
                                                </button>
                                            ) : null}

                                            {photo.status !== 'uploading' ? (
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemovePendingPhoto(photo.id)}
                                                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gray-900/80 text-white flex items-center justify-center border border-white/20 hover:bg-gray-900 transition-colors"
                                                    aria-label={`删除第 ${index + 1} 张图片`}
                                                >
                                                    <X size={10} />
                                                </button>
                                            ) : null}
                                        </div>
                                    ))}
                                </div>
                                </div>
                            ) : null}

                            <div className="flex items-center gap-3">
                                <AnimatePresence mode="wait">
                                    {isListening ? (
                                        <motion.div
                                            key="voice-wave"
                                            initial={{ opacity: 0, scale: 0.98 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.98 }}
                                            transition={{ duration: 0.2 }}
                                            className="flex-1 flex flex-col justify-center gap-1.5 min-h-[44px] rounded-2xl bg-sky-50 px-4 py-2 overflow-hidden"
                                        >
                                            <VoiceWaveBars />
                                            <p className="text-[11px] font-medium text-sky-500/80 text-center truncate">
                                                {voiceTranscript || '聆听中...'}
                                            </p>
                                        </motion.div>
                                    ) : (
                                        <motion.input
                                            key="text-input"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.15 }}
                                            type="text"
                                            readOnly={isLumiReplying}
                                            className="flex-1 bg-transparent border-none outline-none text-gray-700 font-bold placeholder:text-gray-400 py-2.5"
                                            placeholder={pendingPhotos.length > 0 ? '补充说明' : '按住说话，或输入...'}
                                            value={inputText}
                                            onChange={(e) => {
                                                if (isLumiReplying) return;
                                                setInputText(e.target.value);
                                            }}
                                            onFocus={(e) => {
                                                if (!isLumiReplying) return;
                                                e.currentTarget.blur();
                                                showBusyToast();
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && canSendMessage) handleSendMessage();
                                            }}
                                        />
                                    )}
                                </AnimatePresence>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                        type="button"
                                        onClick={handleVoiceInput}
                                        className={`p-2.5 rounded-full transition-colors ${
                                            isListening
                                                ? 'bg-brand/10 text-brand'
                                                : 'text-gray-400 hover:bg-gray-100'
                                        }`}
                                        aria-label={isListening ? '停止语音输入' : '语音输入'}
                                    >
                                        <Mic size={20} />
                                    </button>
                                    {canSendMessage && !isListening ? (
                                        <button onClick={handleSendMessage} className="p-2.5 bg-brand text-white rounded-full shadow-md hover:bg-brand-dark transition-all active:scale-90">
                                            <Send size={18} className="ml-0.5" />
                                        </button>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                        </>
                        )}
                    </div>
                    </div>
                </div>
            )}
            </div>

            {/* 5. Navigation Drawer — portal 到视口，盖住底栏 Tab */}
            {viewport
                ? createPortal(
            <AnimatePresence>
                {isDrawerOpen && (
                    <div className="absolute inset-0 z-[980]">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setIsDrawerOpen(false)}
                            className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="absolute top-0 left-0 bottom-0 w-64 bg-white shadow-2xl flex flex-col text-[12px]"
                        >
                            <div className="px-4 pt-4 pb-2 shrink-0">
                                <div className="flex justify-between items-center mb-3">
                                    <h2 className="text-[13px] font-semibold text-gray-800">小晤 Space</h2>
                                    <button onClick={() => setIsDrawerOpen(false)} className="p-1.5 bg-gray-100 rounded-full text-gray-400 hover:bg-gray-200">
                                        <X size={14} />
                                    </button>
                                </div>

                                <label className="flex items-center justify-between gap-2 mb-3 px-2.5 py-2 rounded-lg bg-gray-50 border border-gray-100 cursor-pointer">
                                    <div className="min-w-0">
                                        <p className="text-[12px] font-medium text-gray-800">自动播放语音</p>
                                        <p className="text-[10px] text-gray-400 mt-0.5 leading-snug">关闭后需手动点播放</p>
                                    </div>
                                    <button
                                        type="button"
                                        role="switch"
                                        aria-checked={autoPlayVoice}
                                        onClick={() => handleAutoPlayVoiceChange(!autoPlayVoice)}
                                        className={`relative w-8 h-[18px] rounded-full transition-colors shrink-0 ${autoPlayVoice ? 'bg-brand' : 'bg-gray-300'}`}
                                    >
                                        <span className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-transform ${autoPlayVoice ? 'translate-x-3.5' : ''}`} />
                                    </button>
                                </label>
                                
                                <button 
                                    onClick={handleNewChat}
                                    className="w-full py-2 bg-brand text-white rounded-lg text-[12px] font-medium flex items-center justify-center gap-1.5 hover:bg-brand-dark transition-colors mb-2"
                                >
                                    <Plus size={14} /> 新建对话
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto px-3 py-1 scroll-smooth">
                                <h3 className="text-[10px] font-medium text-gray-400 tracking-wide mb-1.5 px-1.5">最近对话</h3>
                                
                                {history.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-8 text-center opacity-60">
                                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                                            <History size={16} className="text-gray-400" />
                                        </div>
                                        <p className="text-[12px] font-medium text-gray-500">暂无对话记录</p>
                                    </div>
                                ) : (
                                    <div className="space-y-0.5 pb-16">
                                        {history.map((item) => {
                                            const isEditing = editingItemId === item.id;
                                            const showDemoTag = isQuotaDemoHistory(item);
                                            
                                            return (
                                                <div 
                                                    key={item.id} 
                                                    onClick={() => !isEditing && openHistoryItem(item)}
                                                    className={`group relative w-full px-2 py-2 rounded-lg transition-all cursor-pointer border ${isEditing ? 'bg-white border-brand shadow-sm' : activeHistoryId === item.id ? 'bg-sky-50 border-sky-100' : 'bg-transparent border-transparent hover:bg-gray-50'}`}
                                                >
                                                    {isEditing ? (
                                                        <div className="flex items-center gap-1.5">
                                                            <input 
                                                                autoFocus
                                                                type="text"
                                                                value={editValue}
                                                                onChange={(e) => setEditValue(e.target.value)}
                                                                onKeyDown={(e) => e.key === 'Enter' && saveEditing()}
                                                                onBlur={() => saveEditing()}
                                                                className="flex-1 bg-gray-50 px-2 py-1 rounded text-[12px] font-medium text-gray-800 outline-none min-w-0"
                                                            />
                                                            <button onMouseDown={(e) => saveEditing(e)} className="p-1 bg-brand text-white rounded-md hover:bg-brand-dark">
                                                                <Check size={12} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex justify-between items-start">
                                                            <div className="flex-1 min-w-0 pr-5">
                                                                <div className="flex justify-between items-center gap-2 mb-0.5">
                                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                                        <span className="font-medium text-gray-700 text-[12px] truncate">{item.title}</span>
                                                                        {showDemoTag ? (
                                                                            <span className="shrink-0 px-1.5 py-px rounded text-[9px] font-bold leading-none bg-amber-100 text-amber-700 border border-amber-200/80">
                                                                                演示
                                                                            </span>
                                                                        ) : null}
                                                                    </div>
                                                                    <span className="text-[10px] text-gray-400 shrink-0">{item.date}</span>
                                                                </div>
                                                                <p className="text-[10px] text-gray-400 truncate">{item.preview}</p>
                                                            </div>
                                                            
                                                            <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 p-0.5 rounded-md shadow-sm">
                                                                <button 
                                                                    onClick={(e) => startEditing(e, item)}
                                                                    className="p-1 text-gray-400 hover:text-brand hover:bg-brand/10 rounded transition-colors" 
                                                                    title="重命名"
                                                                >
                                                                    <Edit2 size={12} />
                                                                </button>
                                                                <button 
                                                                    onClick={(e) => deleteHistoryItem(e, item.id)}
                                                                    className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors" 
                                                                    title="删除"
                                                                >
                                                                    <Trash2 size={12} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            <div className="px-3 py-2 border-t border-gray-100 bg-white z-10">
                                <button className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-gray-50 text-gray-500 transition-colors font-medium text-[12px]">
                                    <Settings size={14} /> 设置
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>,
            viewport,
            )
            : null}

            {/* 6. Game Overlays */}
            <AnimatePresence>
                {activeGame === 'shredder' && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute inset-4 bottom-24 bg-white/90 backdrop-blur-xl rounded-[40px] shadow-2xl z-[120] overflow-hidden border border-white/50"
                    >
                        <div className="absolute top-6 right-6 z-50">
                            <button onClick={() => setActiveGame(null)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200">
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>
                        <ShredderGame onComplete={() => handleGameComplete("烦恼粉碎成功！现在的你轻装上阵啦。🍃")} />
                    </motion.div>
                )}

                {activeGame === 'breathing' && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-[120] bg-white"
                    >
                        <BreathingGame onComplete={() => handleGameComplete("做的很棒。深呼吸是随时随地的能量补给站。💧")} />
                    </motion.div>
                )}
            </AnimatePresence>

            <LumiCameraOverlay
                open={isCameraOpen}
                onClose={() => setIsCameraOpen(false)}
                onConfirm={handleCameraConfirm}
                maxPhotos={3}
                imageQuotaRemaining={Math.max(0, IMAGE_UPLOAD_LIMIT - imageUploadCount)}
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

            <SessionFeedbackSheet
                open={isFeedbackOpen}
                onClose={handleFeedbackClose}
                onSubmit={handleFeedbackSubmit}
                onSkip={handleFeedbackSkip}
            />

        </div>
    );
};
