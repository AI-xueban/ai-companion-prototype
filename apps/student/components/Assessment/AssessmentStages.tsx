
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Brain, MessageSquare, Box, Activity, Music, Users, User, Leaf,
    Check, X, ChevronRight, Zap, Play, Sparkles, Bot, MousePointer2, 
    Clock, Eye, Timer, RefreshCw, Target, Divide, Calculator, ArrowRight
} from 'lucide-react';
import { AssessmentPhase } from '../../types';

// --- Types & Data ---

export type DimensionType = 'linguistic' | 'logic' | 'spatial' | 'bodily' | 'musical' | 'interpersonal' | 'intrapersonal' | 'naturalist';

interface Question {
    id: string;
    dimension: DimensionType;
    type: 'choice' | 'reflex' | 'rhythm' | 'multiselect' | 'visual_rotate' | 'visual_fold';
    visualType?: 'text' | 'analogy' | 'balance' | 'origami' | 'waveform' | 'emoji_mood' | 'image_grid'; // 新增视觉类型
    title: string;
    content?: React.ReactNode; // Optional legacy or custom content
    visualData?: any; // Structured data for visuals
    options?: { id: string; label: string; isCorrect?: boolean; icon?: React.ReactNode; image?: string }[];
    correctIndices?: number[];
}

const DIMENSIONS: { id: DimensionType; label: string; icon: React.FC<any>; color: string; gradient: string }[] = [
    { id: 'linguistic', label: '言语', icon: MessageSquare, color: 'text-blue-400', gradient: 'from-blue-500/20 to-cyan-500/20' },
    { id: 'logic', label: '逻辑', icon: Calculator, color: 'text-purple-400', gradient: 'from-purple-500/20 to-fuchsia-500/20' },
    { id: 'spatial', label: '空间', icon: Box, color: 'text-yellow-400', gradient: 'from-yellow-500/20 to-orange-500/20' },
    { id: 'bodily', label: '动觉', icon: Activity, color: 'text-red-400', gradient: 'from-red-500/20 to-rose-500/20' },
    { id: 'musical', label: '音乐', icon: Music, color: 'text-pink-400', gradient: 'from-pink-500/20 to-rose-500/20' },
    { id: 'interpersonal', label: '人际', icon: Users, color: 'text-indigo-400', gradient: 'from-indigo-500/20 to-violet-500/20' },
    { id: 'intrapersonal', label: '内省', icon: User, color: 'text-cyan-400', gradient: 'from-cyan-500/20 to-sky-500/20' },
    { id: 'naturalist', label: '自然', icon: Leaf, color: 'text-green-400', gradient: 'from-green-500/20 to-emerald-500/20' },
];

const QUESTIONS: Record<DimensionType, Question[]> = {
    linguistic: [
        {
            id: 'ling_1', dimension: 'linguistic', type: 'choice', visualType: 'analogy',
            title: '类比推理',
            visualData: {
                pair1: ['医生', '听诊器'],
                pair2: ['画家', '?'],
            },
            options: [
                { id: 'A', label: '博物馆', icon: <div className="text-xl">🏛️</div> },
                { id: 'B', label: '颜料', icon: <div className="text-xl">🎨</div> },
                { id: 'C', label: '画笔', isCorrect: true, icon: <div className="text-xl">🖌️</div> },
                { id: 'D', label: '欣赏', icon: <div className="text-xl">👀</div> },
            ]
        },
        {
            id: 'ling_2', dimension: 'linguistic', type: 'choice', visualType: 'text',
            title: '异类识别',
            content: <div className="text-lg text-center font-medium">找出逻辑上<br/><span className="text-red-400 font-bold text-xl block mt-2">不属于同类</span><br/>的一个词</div>,
            options: [
                { id: 'A', label: '愤怒 (Anger)' },
                { id: 'B', label: '悲伤 (Sadness)' },
                { id: 'C', label: '颜色 (Color)', isCorrect: true },
                { id: 'D', label: '喜悦 (Joy)' },
            ]
        }
    ],
    logic: [
        {
            id: 'log_1', dimension: 'logic', type: 'choice', visualType: 'text',
            title: '数字规律',
            content: (
                <div className="flex items-center justify-center gap-3 text-3xl font-mono font-bold tracking-wider">
                    <div className="bg-white/5 w-12 h-16 rounded-lg flex items-center justify-center border border-white/10">1</div>
                    <div className="bg-white/5 w-12 h-16 rounded-lg flex items-center justify-center border border-white/10">3</div>
                    <div className="bg-white/5 w-12 h-16 rounded-lg flex items-center justify-center border border-white/10">7</div>
                    <div className="bg-white/5 w-12 h-16 rounded-lg flex items-center justify-center border border-white/10">15</div>
                    <div className="bg-purple-500/20 w-12 h-16 rounded-lg flex items-center justify-center border border-purple-500/50 text-purple-400">?</div>
                </div>
            ),
            options: [
                { id: 'A', label: '29' },
                { id: 'B', label: '31', isCorrect: true },
                { id: 'C', label: '30' },
                { id: 'D', label: '32' },
            ]
        },
        {
            id: 'log_2', dimension: 'logic', type: 'choice', visualType: 'balance',
            title: '图形代数',
            visualData: {
                left: ['🍎', '🍎'],
                right: ['🍉'],
                equation: '1 🍉 = 4 🍓'
            },
            options: [
                { id: 'A', label: '2 颗', isCorrect: true },
                { id: 'B', label: '3 颗' },
                { id: 'C', label: '4 颗' },
            ]
        }
    ],
    spatial: [
        {
            id: 'spa_1', dimension: 'spatial', type: 'visual_rotate',
            title: '心理旋转',
            content: <div className="text-center text-sm text-gray-400 mb-4">左图旋转 90° 后是哪一个？</div>,
        },
        {
            id: 'spa_2', dimension: 'spatial', type: 'choice', visualType: 'origami',
            title: '折纸透视',
            visualData: {}, // Component handles static visuals
            options: [
                { id: 'A', label: '1 个洞' },
                { id: 'B', label: '2 个洞' },
                { id: 'C', label: '4 个洞', isCorrect: true },
            ]
        }
    ],
    bodily: [
        {
            id: 'bod_1', dimension: 'bodily', type: 'reflex',
            title: '极速反应',
            content: null
        },
        {
            id: 'bod_2', dimension: 'bodily', type: 'choice',
            title: '精准制动',
            content: <div className="text-center text-gray-400 text-sm">此题演示版暂用模拟选项</div>,
            visualData: { type: 'slider_demo' }, // Placeholder for slider visual
            visualType: 'text', // Fallback for now
            options: [
                { id: 'A', label: '太早点击' },
                { id: 'B', label: '完美停顿', isCorrect: true },
                { id: 'C', label: '太晚点击' },
            ]
        }
    ],
    musical: [
        {
            id: 'mus_1', dimension: 'musical', type: 'rhythm',
            title: '节奏记忆',
            content: null
        },
        {
            id: 'mus_2', dimension: 'musical', type: 'choice', visualType: 'waveform',
            title: '密度辨识',
            visualData: {
                options: ['sparse', 'dense']
            },
            options: [
                { id: 'A', label: '波形 A (慢)' },
                { id: 'B', label: '波形 B (快)', isCorrect: true },
            ]
        }
    ],
    interpersonal: [
        {
            id: 'inter_1', dimension: 'interpersonal', type: 'choice', visualType: 'emoji_mood',
            title: '情绪识别',
            visualData: { emoji: '😟' },
            options: [
                { id: 'A', label: '兴奋 Excitement' },
                { id: 'B', label: '担忧 Worry', isCorrect: true },
                { id: 'C', label: '生气 Anger' },
            ]
        },
        {
            id: 'inter_2', dimension: 'interpersonal', type: 'choice', visualType: 'text',
            title: '社交决策',
            content: <div className="p-4 bg-white/5 rounded-xl text-center text-sm leading-relaxed">"小组作业中，有一位组员一直不说话也不参与讨论，作为组长你会？"</div>,
            options: [
                { id: 'A', label: '分配简单的独立任务给他', isCorrect: true },
                { id: 'B', label: '直接告诉老师情况' },
                { id: 'C', label: '不管他，自己多做点' },
            ]
        }
    ],
    intrapersonal: [
        {
            id: 'intra_1', dimension: 'intrapersonal', type: 'choice', visualType: 'text',
            title: '动力来源',
            content: <div className="text-center text-lg font-medium">当你攻克一道难题时，<br/>让你最快乐的是？</div>,
            options: [
                { id: 'A', label: '战胜困难的成就感', isCorrect: true },
                { id: 'B', label: '老师或家长的表扬' },
            ]
        },
        {
            id: 'intra_2', dimension: 'intrapersonal', type: 'choice', visualType: 'text',
            title: '逆境应对',
            content: <div className="text-center text-lg font-medium">课上完全听不懂时，<br/>你的第一反应是？</div>,
            options: [
                { id: 'A', label: '很焦虑，强迫自己听' },
                { id: 'B', label: '先记下，课后找资源补', isCorrect: true },
            ]
        }
    ],
    naturalist: [
        {
            id: 'nat_1', dimension: 'naturalist', type: 'multiselect', visualType: 'image_grid',
            title: '生物归类',
            content: <div className="text-center mb-2 text-sm text-gray-400">选出所有<span className="text-green-400 font-bold mx-1">会飞</span>的动物</div>,
            options: [
                { id: 'A', label: '🦁', image: '🦁' },
                { id: 'B', label: '🐟', image: '🐟' },
                { id: 'C', label: '🦅', isCorrect: true, image: '🦅' },
                { id: 'D', label: '🦇', isCorrect: true, image: '🦇' },
            ]
        },
        {
            id: 'nat_2', dimension: 'naturalist', type: 'choice', visualType: 'text',
            title: '细节观察',
            content: (
                <div className="flex justify-center gap-8 mb-4">
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-3xl shadow-lg">🌿</div>
                        <span className="text-xs text-gray-500 mt-2">A</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-green-500 rounded-[20px] flex items-center justify-center text-3xl shadow-lg">🌿</div>
                        <span className="text-xs text-gray-500 mt-2">B</span>
                    </div>
                </div>
            ),
            options: [
                { id: 'A', label: '颜色不同' },
                { id: 'B', label: '边缘形状不同', isCorrect: true },
            ]
        }
    ]
};

// --- Sub-components (Visual Enhancements) ---

const AnalogyVisual: React.FC<{ data: any }> = ({ data }) => (
    <div className="flex flex-col gap-4 items-center justify-center w-full py-4">
        <div className="flex items-center gap-3 w-full justify-center">
            <span className="font-bold text-lg">{data.pair1[0]}</span>
            <div className="h-0.5 w-8 bg-blue-500/50 relative">
                <ChevronRight size={14} className="absolute right-[-6px] top-[-6px] text-blue-500" />
            </div>
            <span className="font-bold text-lg text-blue-400">{data.pair1[1]}</span>
        </div>
        <div className="w-full h-px bg-white/10" />
        <div className="flex items-center gap-3 w-full justify-center">
            <span className="font-bold text-lg">{data.pair2[0]}</span>
            <div className="h-0.5 w-8 bg-gray-600 relative">
                <ChevronRight size={14} className="absolute right-[-6px] top-[-6px] text-gray-500" />
            </div>
            <div className="w-20 h-10 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center animate-pulse">
                <span className="font-bold text-xl text-yellow-400">?</span>
            </div>
        </div>
    </div>
);

const BalanceVisual: React.FC<{ data: any }> = ({ data }) => (
    <div className="w-full py-2">
        {/* Scale SVG Graphic */}
        <div className="relative h-24 w-full flex items-end justify-center mb-4">
            {/* Base */}
            <div className="absolute bottom-0 w-2 h-16 bg-gray-600 rounded-t-full"></div>
            <div className="absolute bottom-0 w-20 h-1 bg-gray-600 rounded-full"></div>
            
            {/* Arm */}
            <motion.div 
                className="w-48 h-1 bg-gray-400 absolute top-4 flex justify-between items-center px-1"
                initial={{ rotate: 0 }}
                animate={{ rotate: [2, -2, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
            >
                {/* Left Pan */}
                <div className="relative flex flex-col items-center">
                    <div className="h-8 w-0.5 bg-gray-500/50 mb-[-2px]"></div>
                    <div className="w-16 h-8 border-b-2 border-l-2 border-r-2 border-gray-500/50 rounded-b-3xl bg-white/5 flex items-center justify-center gap-1 pb-1">
                        {data.left.map((item: string, i: number) => <span key={i} className="text-xl">{item}</span>)}
                    </div>
                </div>
                {/* Right Pan */}
                <div className="relative flex flex-col items-center">
                    <div className="h-8 w-0.5 bg-gray-500/50 mb-[-2px]"></div>
                    <div className="w-16 h-8 border-b-2 border-l-2 border-r-2 border-gray-500/50 rounded-b-3xl bg-white/5 flex items-center justify-center gap-1 pb-1">
                        {data.right.map((item: string, i: number) => <span key={i} className="text-xl">{item}</span>)}
                    </div>
                </div>
            </motion.div>
        </div>
        <div className="text-center text-sm font-medium bg-white/5 py-2 rounded-lg mx-auto max-w-[200px]">
            已知: <span className="text-purple-300">{data.equation}</span>
        </div>
    </div>
);

const OrigamiVisual: React.FC = () => (
    <div className="flex justify-between items-center w-full px-2 py-4">
        {/* Step 1 */}
        <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 border-2 border-dashed border-white/30 bg-white/5 rounded-sm relative">
                <div className="absolute inset-0 border-r border-white/10 w-1/2"></div>
            </div>
            <span className="text-[10px] text-gray-500">对折</span>
        </div>
        <ChevronRight size={16} className="text-gray-600" />
        {/* Step 2 */}
        <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-12 border-2 border-white/50 bg-white/10 rounded-sm relative">
                 <div className="absolute top-1/2 left-0 right-0 border-t border-dashed border-white/30"></div>
            </div>
            <span className="text-[10px] text-gray-500">再对折</span>
        </div>
        <ChevronRight size={16} className="text-gray-600" />
        {/* Step 3 */}
        <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-white/80 bg-white/20 rounded-sm flex items-center justify-center">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            </div>
            <span className="text-[10px] text-gray-500">剪圆</span>
        </div>
    </div>
);

const WaveformVisual: React.FC<{ data: any }> = ({ data }) => (
    <div className="flex flex-col gap-4 w-full">
        <div className="flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/5">
            <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-400 font-bold text-xs">A</div>
            <svg viewBox="0 0 100 20" className="w-full h-8 stroke-pink-400/50 fill-none stroke-2">
                <path d="M0,10 Q12.5,0 25,10 T50,10 T75,10 T100,10" />
            </svg>
        </div>
        <div className="flex items-center gap-4 bg-white/5 p-3 rounded-xl border border-white/5">
            <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-400 font-bold text-xs">B</div>
            <svg viewBox="0 0 100 20" className="w-full h-8 stroke-pink-400 fill-none stroke-2">
                <path d="M0,10 Q6.25,0 12.5,10 T25,10 T37.5,10 T50,10 T62.5,10 T75,10 T87.5,10 T100,10" />
            </svg>
        </div>
    </div>
);

const EmojiVisual: React.FC<{ data: any }> = ({ data }) => (
    <div className="flex flex-col items-center justify-center py-6">
        <motion.div 
            className="text-7xl drop-shadow-2xl"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
        >
            {data.emoji}
        </motion.div>
        <div className="mt-4 text-sm text-gray-400 bg-white/5 px-3 py-1 rounded-full">
            Observe the expression
        </div>
    </div>
);

const FeedbackOverlay: React.FC<{ type: 'correct' | 'wrong' | 'recorded' }> = ({ type }) => (
    <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
    >
        <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.2, opacity: 0 }}
            className={`w-32 h-32 rounded-[2rem] flex items-center justify-center shadow-2xl ${
                type === 'correct' ? 'bg-green-500 text-white' : 
                type === 'wrong' ? 'bg-red-500 text-white' : 
                'bg-white text-brand'
            }`}
        >
            {type === 'correct' ? <Check size={56} strokeWidth={4} /> : 
             type === 'wrong' ? <X size={56} strokeWidth={4} /> :
             <Sparkles size={56} strokeWidth={4} />}
        </motion.div>
    </motion.div>
);

const ReflexGame: React.FC<{ onFinish: (score: number) => void }> = ({ onFinish }) => {
    const [state, setState] = useState<'waiting' | 'ready' | 'go' | 'early'>('waiting');
    const [startTime, setStartTime] = useState(0);
    
    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (state === 'waiting') {
            setState('ready');
            const delay = 2000 + Math.random() * 2000;
            timer = setTimeout(() => {
                setState('go');
                setStartTime(Date.now());
            }, delay);
        }
        return () => clearTimeout(timer);
    }, [state]);

    const handleClick = () => {
        if (state === 'ready') {
            setState('early');
            setTimeout(() => onFinish(50), 1000); 
        } else if (state === 'go') {
            const time = Date.now() - startTime;
            const score = time < 350 ? 100 : time < 600 ? 80 : 60;
            onFinish(score);
        }
    };

    return (
        <div 
            className={`w-full aspect-video rounded-3xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 shadow-xl border-2 ${
                state === 'ready' ? 'bg-gray-800 border-gray-700' :
                state === 'go' ? 'bg-green-500 border-green-400 scale-105' :
                state === 'early' ? 'bg-red-500 border-red-400' : 'bg-gray-800 border-transparent'
            }`}
            onMouseDown={handleClick}
        >
            {state === 'ready' && <div className="text-gray-400 font-bold animate-pulse">Wait for Green...</div>}
            {state === 'go' && <div className="text-white font-black text-4xl tracking-tighter">TAP NOW!</div>}
            {state === 'early' && <div className="text-white font-bold">Too Early!</div>}
        </div>
    );
};

const RhythmGame: React.FC<{ onFinish: (score: number) => void }> = ({ onFinish }) => {
    const [sequence, setSequence] = useState<number[]>([]);
    const [playing, setPlaying] = useState(false);
    const [userIdx, setUserIdx] = useState(0);
    const [activeLight, setActiveLight] = useState<number | null>(null);

    useEffect(() => {
        setSequence([0, 2, 0, 1]); 
        setPlaying(true);
    }, []);

    useEffect(() => {
        if (playing && sequence.length > 0) {
            let i = 0;
            const interval = setInterval(() => {
                if (i >= sequence.length) {
                    clearInterval(interval);
                    setPlaying(false);
                    setActiveLight(null);
                    return;
                }
                setActiveLight(sequence[i]);
                setTimeout(() => setActiveLight(null), 300);
                i++;
            }, 600);
            return () => clearInterval(interval);
        }
    }, [playing, sequence]);

    const handleTap = (idx: number) => {
        if (playing) return;
        
        // Haptic feedback visual
        setActiveLight(idx);
        setTimeout(() => setActiveLight(null), 150);

        if (idx === sequence[userIdx]) {
            if (userIdx + 1 === sequence.length) {
                setTimeout(() => onFinish(100), 300);
            } else {
                setUserIdx(u => u + 1);
            }
        } else {
            onFinish(40);
        }
    };

    const colors = ['bg-rose-500', 'bg-blue-500', 'bg-amber-500'];
    const shadowColors = ['shadow-rose-500/50', 'shadow-blue-500/50', 'shadow-amber-500/50'];

    return (
        <div className="flex flex-col items-center gap-6 py-4">
            <div className="text-sm text-gray-400 font-medium">
                {playing ? "Watch sequence..." : "Repeat sequence!"}
            </div>
            <div className="flex gap-4 justify-center">
                {[0, 1, 2].map(i => (
                    <button
                        key={i}
                        onClick={() => handleTap(i)}
                        className={`w-20 h-20 rounded-2xl border-b-4 transition-all duration-100 ${
                            activeLight === i 
                                ? `${colors[i]} border-transparent scale-95 shadow-[0_0_30px_rgba(0,0,0,0.5)]` 
                                : `bg-gray-800 border-gray-900 ${activeLight !== null ? 'opacity-50' : 'hover:bg-gray-700'}`
                        }`}
                    >
                        <div className={`w-full h-full rounded-2xl opacity-0 transition-opacity ${activeLight === i ? 'opacity-100' : ''} ${shadowColors[i]} shadow-lg`} />
                    </button>
                ))}
            </div>
        </div>
    );
};

const VisualRotateGame: React.FC<{ onFinish: (score: number) => void }> = ({ onFinish }) => {
    return (
        <div className="flex flex-col items-center gap-6">
            <div className="w-32 h-32 bg-white/5 rounded-3xl border border-white/10 flex items-center justify-center shadow-inner">
                <Box size={64} className="text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
            </div>
            <div className="grid grid-cols-3 gap-3 w-full">
                <button onClick={() => onFinish(0)} className="aspect-square bg-gray-800 rounded-2xl hover:bg-gray-700 flex items-center justify-center border border-white/5 group">
                    <Box size={40} className="text-gray-500 rotate-180 group-hover:text-gray-300 transition-colors" />
                </button>
                <button onClick={() => onFinish(100)} className="aspect-square bg-gray-800 rounded-2xl hover:bg-gray-700 flex items-center justify-center border border-white/5 group relative overflow-hidden">
                    <div className="absolute inset-0 bg-yellow-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Box size={40} className="text-gray-500 rotate-90 group-hover:text-yellow-400 transition-colors" />
                </button>
                <button onClick={() => onFinish(0)} className="aspect-square bg-gray-800 rounded-2xl hover:bg-gray-700 flex items-center justify-center border border-white/5 group">
                    <Box size={40} className="text-gray-500 -rotate-45 group-hover:text-gray-300 transition-colors" />
                </button>
            </div>
        </div>
    );
};

// --- Main Components ---

export const AssessmentStageHeader: React.FC<{ currentPhase: AssessmentPhase }> = () => null;

export const MultipleIntelligenceAssessment: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
    const [dimIndex, setDimIndex] = useState(0);
    const [qIndex, setQIndex] = useState(0);
    const [feedback, setFeedback] = useState<'correct' | 'wrong' | 'recorded' | null>(null);
    
    const currentDim = DIMENSIONS[dimIndex];
    const questions = QUESTIONS[currentDim.id];
    const currentQ = questions[qIndex];

    const handleAnswer = (isCorrect: boolean) => {
        setFeedback(isCorrect ? 'correct' : 'wrong');
        setTimeout(() => {
            setFeedback(null);
            nextStep();
        }, 500); // Faster transition for snappier feel
    };

    const handleGameFinish = (score: number) => {
        setFeedback('recorded');
        setTimeout(() => {
            setFeedback(null);
            nextStep();
        }, 500);
    };

    const nextStep = () => {
        if (qIndex + 1 < questions.length) {
            setQIndex(q => q + 1);
        } else {
            if (dimIndex + 1 < DIMENSIONS.length) {
                setDimIndex(d => d + 1);
                setQIndex(0);
            } else {
                onComplete();
            }
        }
    };

    return (
        <div className="flex flex-col h-full relative overflow-hidden">
            {/* Ambient Background Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${currentDim.gradient} opacity-20 blur-3xl transition-colors duration-1000 ease-in-out pointer-events-none`} />

            {/* iOS-style Header */}
            <div className="pt-6 pb-2 px-0 z-10">
                <div className="flex justify-center items-center gap-3 overflow-x-auto no-scrollbar px-6 mask-linear-gradient">
                    {DIMENSIONS.map((d, i) => {
                        const active = i === dimIndex;
                        const done = i < dimIndex;
                        return (
                            <motion.div 
                                key={d.id} 
                                layout
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-300 ${
                                    active ? 'bg-white/10 backdrop-blur-md border border-white/10 shadow-lg' : 
                                    done ? 'opacity-40' : 'opacity-20 grayscale'
                                }`}
                            >
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${active ? d.color : 'text-[var(--tw-ring-offset-color)] border-[rgba(74,74,74,1)]'}`}>
                                    {done ? <Check size={12} strokeWidth={4} className="text-white" /> : <d.icon size={12} className="text-white" />}
                                </div>
                                {active && (
                                    <motion.span 
                                        initial={{ opacity: 0, width: 0 }} 
                                        animate={{ opacity: 1, width: 'auto' }}
                                        className="text-xs font-bold text-white whitespace-nowrap"
                                    >
                                        {d.label}
                                    </motion.span>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Main Stage */}
            <div className="flex-1 flex flex-col items-center px-6 pt-4 pb-24 overflow-y-auto no-scrollbar relative z-0">
                <AnimatePresence mode="wait">
                    {feedback && <FeedbackOverlay type={feedback} />}
                    
                    <motion.div 
                        key={`${dimIndex}-${qIndex}`} // Unique key for every question step
                        initial={{ opacity: 0, x: 20, filter: 'blur(5px)' }}
                        animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, x: -20, filter: 'blur(5px)' }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="w-full max-w-sm"
                    >
                        {/* Question Card */}
                        <div className="bg-gray-900/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-1 shadow-2xl overflow-hidden">
                            {/* Header Image/Visual Area */}
                            <div className="bg-white/5 rounded-[1.8rem] p-6 min-h-[160px] flex flex-col items-center justify-center relative overflow-hidden group">
                                <div className={`absolute top-0 right-0 p-4 opacity-5 ${currentDim.color}`}>
                                    <currentDim.icon size={120} />
                                </div>
                                
                                <h3 className="text-sm font-medium text-gray-400 mb-4 uppercase tracking-widest relative z-10">
                                    {currentQ.title}
                                </h3>
                                
                                <div className="w-full relative z-10">
                                    {currentQ.visualType === 'analogy' && <AnalogyVisual data={currentQ.visualData} />}
                                    {currentQ.visualType === 'balance' && <BalanceVisual data={currentQ.visualData} />}
                                    {currentQ.visualType === 'origami' && <OrigamiVisual />}
                                    {currentQ.visualType === 'waveform' && <WaveformVisual data={currentQ.visualData} />}
                                    {currentQ.visualType === 'emoji_mood' && <EmojiVisual data={currentQ.visualData} />}
                                    
                                    {/* Fallback to custom content or simple text */}
                                    {(!currentQ.visualType || currentQ.visualType === 'text') && currentQ.content && (
                                        <div className="w-full flex justify-center">{currentQ.content}</div>
                                    )}
                                </div>
                            </div>

                            {/* Interaction Area (Bottom Half) */}
                            <div className="p-4 pt-6">
                                {currentQ.type === 'choice' && currentQ.options && (
                                    <div className={`grid gap-3 ${currentQ.visualType === 'image_grid' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                        {currentQ.options.map(opt => (
                                            <button
                                                key={opt.id}
                                                onClick={() => handleAnswer(!!opt.isCorrect)}
                                                className={`
                                                    relative overflow-hidden group transition-all duration-200 active:scale-95
                                                    ${currentQ.visualType === 'image_grid' 
                                                        ? 'aspect-square flex flex-col items-center justify-center gap-2 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10' 
                                                        : 'py-4 px-5 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 text-left flex items-center gap-4'
                                                    }
                                                `}
                                            >
                                                {/* Button Content */}
                                                {currentQ.visualType === 'image_grid' ? (
                                                    <>
                                                        <span className="text-4xl">{opt.image}</span>
                                                        {/* <span className="text-xs font-medium text-gray-400">{opt.label}</span> */}
                                                    </>
                                                ) : (
                                                    <>
                                                        {opt.icon && <span className="opacity-80">{opt.icon}</span>}
                                                        <span className="flex-1 text-gray-200 font-medium text-sm">{opt.label}</span>
                                                        <div className="w-4 h-4 rounded-full border-2 border-gray-600 group-hover:border-gray-400 transition-colors" />
                                                    </>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Interactive Games */}
                                {currentQ.type === 'reflex' && <ReflexGame onFinish={handleGameFinish} />}
                                {currentQ.type === 'rhythm' && <RhythmGame onFinish={handleGameFinish} />}
                                {currentQ.type === 'visual_rotate' && <VisualRotateGame onFinish={handleGameFinish} />}
                                {currentQ.type === 'multiselect' && currentQ.options && (
                                     <div className="grid grid-cols-2 gap-3">
                                        {currentQ.options.map(opt => (
                                            <button
                                                key={opt.id}
                                                onClick={() => handleAnswer(!!opt.isCorrect)}
                                                className="aspect-square bg-white/5 hover:bg-white/10 active:scale-95 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-5xl transition-all"
                                            >
                                                {opt.image || opt.label}
                                            </button>
                                        ))}
                                     </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

// --- Adapters for backward compatibility ---

export const CognitiveStage: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
    return <MultipleIntelligenceAssessment onComplete={onComplete} />;
};

export const StageSummary: React.FC<{ data: { title: string, desc: string }, onNext: () => void }> = ({ data, onNext }) => {
    return (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="h-full flex flex-col items-center justify-center px-8 text-center pb-20">
            <div className="w-32 h-32 bg-gradient-to-tr from-green-400/20 to-emerald-600/20 rounded-full flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(34,197,94,0.2)] border border-green-500/30 backdrop-blur-xl">
                <Check size={64} className="text-green-400" strokeWidth={4} />
            </div>
            <h2 className="text-3xl font-black text-white mb-4 tracking-tight">扫描完成</h2>
            <p className="text-gray-400 leading-relaxed mb-12 max-w-xs text-sm">AI 已根据您的 8 维认知数据<br/>构建了专属的学习模型。</p>
            <button onClick={onNext} className="w-full max-w-xs py-4 bg-white text-gray-900 rounded-2xl font-black hover:bg-gray-200 transition-colors shadow-xl active:scale-95 flex items-center justify-center gap-2">
                进入我的学习宇宙 <ChevronRight size={20} />
            </button>
        </motion.div>
    );
};
