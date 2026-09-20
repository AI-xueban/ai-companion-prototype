import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wind, Zap, Target, CheckCircle2, RotateCcw, Clock } from 'lucide-react';

// --- Types ---
export type ModeId = 'calm' | 'energy' | 'focus';

export interface MeditationMode {
  id: ModeId;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ElementType;
  themeColor: string;
  gradient: string;
  rhythm: {
    inhale: number;
    hold: number;
    exhale: number;
  };
  texts: {
    inhale: string[];
    hold: string[];
    exhale: string[];
  };
}

// --- Mock Data ---
const MEDITATION_MODES: MeditationMode[] = [
  {
    id: 'calm',
    title: '平复心境',
    subtitle: '感到焦躁 / 生气',
    description: '4-4-6 舒缓呼吸',
    icon: Wind,
    themeColor: '#60A5FA', // blue-400
    gradient: 'from-blue-400 to-indigo-500',
    rhythm: { inhale: 4, hold: 4, exhale: 6 },
    texts: {
        inhale: ['吸入平静...', '感受清凉...', '缓缓吸气...'],
        hold: ['保持这份宁静...', '感受当下...', '稳住重心...'],
        exhale: ['呼出烦恼...', '肩膀下沉...', '完全放松...']
    }
  },
  {
    id: 'energy',
    title: '注入能量',
    subtitle: '感到疲惫 / 走神',
    description: '4-2-4 平衡呼吸',
    icon: Zap,
    themeColor: '#FBBF24', // amber-400
    gradient: 'from-amber-400 to-orange-500',
    rhythm: { inhale: 4, hold: 2, exhale: 4 },
    texts: {
        inhale: ['吸入活力...', '唤醒身体...', '充满能量...'],
        hold: ['蓄力...', '感受心跳...', '聚集力量...'],
        exhale: ['释放疲惫...', '焕然一新...', '眼神聚焦...']
    }
  },
  {
    id: 'focus',
    title: '找回专注',
    subtitle: '感到压力 / 紧张',
    description: '4-4-4 箱式呼吸',
    icon: Target,
    themeColor: '#8B5CF6', // violet-500
    gradient: 'from-violet-400 to-purple-500',
    rhythm: { inhale: 4, hold: 4, exhale: 4 },
    texts: {
        inhale: ['专注当下...', '清晰思绪...', '吸气...'],
        hold: ['此刻...', '静止...', '定神...'],
        exhale: ['杂念消散...', '沉着冷静...', '呼气...']
    }
  }
];

interface BreathingGameProps {
  onComplete: () => void;
}

export const BreathingGame: React.FC<BreathingGameProps> = ({ onComplete }) => {
  const [sessionState, setSessionState] = useState<'check-in' | 'breathing' | 'summary'>('check-in');
  const [selectedMode, setSelectedMode] = useState<MeditationMode | null>(null);
  
  // Breathing State
  const [stage, setStage] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [guideText, setGuideText] = useState('');
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes total
  const initialTime = 180;
  
  const isMounted = useRef(true);
  const cycleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // Session Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (sessionState === 'breathing') {
        interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    setSessionState('summary');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }
    return () => clearInterval(interval);
  }, [sessionState]);

  // Breathing Cycle Logic
  useEffect(() => {
    if (sessionState !== 'breathing' || !selectedMode) return;

    let isActive = true;

    const runCycle = async () => {
        if (!isActive) return;

        // Inhale
        setStage('inhale');
        setGuideText(getRandomText(selectedMode.texts.inhale));
        await new Promise(r => { cycleTimeoutRef.current = setTimeout(r, selectedMode.rhythm.inhale * 1000); });
        
        if (!isActive) return;

        // Hold
        setStage('hold');
        setGuideText(getRandomText(selectedMode.texts.hold));
        await new Promise(r => { cycleTimeoutRef.current = setTimeout(r, selectedMode.rhythm.hold * 1000); });

        if (!isActive) return;

        // Exhale
        setStage('exhale');
        setGuideText(getRandomText(selectedMode.texts.exhale));
        await new Promise(r => { cycleTimeoutRef.current = setTimeout(r, selectedMode.rhythm.exhale * 1000); });

        if (isActive) runCycle();
    };

    runCycle();

    return () => {
        isActive = false;
        if (cycleTimeoutRef.current) clearTimeout(cycleTimeoutRef.current);
    };
  }, [sessionState, selectedMode]);


  const handleModeSelect = (mode: MeditationMode) => {
    setSelectedMode(mode);
    setSessionState('breathing');
    setTimeLeft(initialTime); 
  };
  
  const handleRestart = () => {
      setSessionState('check-in');
      setSelectedMode(null);
  };

  const getRandomText = (texts: string[]) => texts[Math.floor(Math.random() * texts.length)];

  const getScale = () => {
      if (stage === 'inhale') return 1.5;
      if (stage === 'hold') return 1.5;
      return 1;
  };

  const getDuration = () => {
      if (!selectedMode) return 4;
      return selectedMode.rhythm[stage];
  };
  
  // Format seconds to mm:ss
  const formatTime = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative h-full w-full bg-gray-50/50 overflow-hidden font-sans select-none flex flex-col">
        {/* Background Ambient */}
        <motion.div 
            animate={{ 
                background: selectedMode 
                    ? `radial-gradient(circle at center, ${selectedMode.themeColor}33 0%, rgba(255,255,255,0) 70%)` 
                    : 'radial-gradient(circle at center, rgba(96,165,250,0.2) 0%, rgba(255,255,255,0) 70%)'
            }}
            transition={{ duration: 1 }}
            className="absolute inset-0 opacity-80 pointer-events-none" 
        />
        
        {/* Header / Close Button */}
         <div className="absolute top-6 right-6 z-50">
            <button 
                onClick={onComplete} 
                className="p-2 bg-white/50 backdrop-blur-md rounded-full text-gray-500 hover:bg-white hover:text-gray-800 transition-colors shadow-sm border border-white/40"
            >
                <X size={20} />
            </button>
        </div>

        <AnimatePresence mode="wait">
            {/* 1. Check-in View */}
            {sessionState === 'check-in' && (
                <motion.div
                    key="check-in"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                    className="flex flex-col h-full px-8 pt-12 pb-8 relative z-10"
                >
                    <div className="mb-10 text-center space-y-2">
                        <motion.h2 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-2xl font-black text-gray-800 tracking-tight"
                        >
                            此刻感觉如何？
                        </motion.h2>
                        <motion.p 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-gray-400 text-sm font-medium"
                        >
                            选择一个模式，开始调整身心能量
                        </motion.p>
                    </div>

                    <div className="flex-1 flex flex-col justify-center gap-5 w-full">
                        {MEDITATION_MODES.map((mode, index) => (
                            <motion.button
                                key={mode.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 + index * 0.1 }}
                                whileHover={{ scale: 1.02, backgroundColor: 'rgba(255, 255, 255, 0.8)' }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleModeSelect(mode)}
                                className="group relative flex items-center p-4 rounded-[24px] bg-white/40 backdrop-blur-xl border border-white/60 shadow-[0_4px_20px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300 text-left"
                            >
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm mr-5 bg-gradient-to-br ${mode.gradient} text-white`}>
                                    <mode.icon size={26} strokeWidth={2.5} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="font-black text-lg text-gray-800 tracking-tight">{mode.title}</h3>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/50 border border-white/60 text-gray-400 uppercase tracking-wide`}>
                                            {mode.description.split(' ')[0]}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 font-medium">{mode.subtitle}</p>
                                </div>
                            </motion.button>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* 2. Breathing View */}
            {sessionState === 'breathing' && selectedMode && (
                 <motion.div
                    key="breathing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    className="flex flex-col h-full w-full items-center justify-center relative z-10"
                 >
                    {/* Breathing Orb Area */}
                    <div className="relative w-64 h-64 flex items-center justify-center mb-16">
                        {/* Guide Circle (Static Outline) */}
                        <div className="absolute inset-0 border-4 border-white/40 rounded-full scale-150"></div>
                        <motion.div 
                            animate={{ borderColor: selectedMode.themeColor }}
                            className="absolute inset-0 border-4 rounded-full opacity-30"
                        />

                        {/* Moving Orb */}
                        <motion.div
                            animate={{ 
                                scale: getScale(),
                                backgroundColor: selectedMode.themeColor,
                                opacity: stage === 'hold' ? 0.9 : 1
                            }}
                            transition={{ 
                                duration: getDuration(), 
                                ease: "easeInOut" 
                            }}
                            className="w-32 h-32 rounded-full shadow-[0_0_60px_rgba(0,0,0,0.1)] flex items-center justify-center relative z-10"
                            style={{
                                boxShadow: `0 0 40px ${selectedMode.themeColor}66`
                            }}
                        >
                            <div className="absolute inset-0 bg-white/20 blur-md rounded-full"></div>
                        </motion.div>

                        {/* Ripple Effect on Exhale */}
                        {stage === 'exhale' && (
                            <motion.div 
                                initial={{ scale: 1.5, opacity: 0.5, borderColor: selectedMode.themeColor }}
                                animate={{ scale: 2.5, opacity: 0 }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="absolute inset-0 rounded-full border-2"
                            />
                        )}
                    </div>

                    {/* Instruction Text */}
                    <div className="h-24 flex flex-col items-center gap-3 px-6 text-center">
                        <AnimatePresence mode='wait'>
                            <motion.div
                                key={guideText}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="text-3xl font-black text-gray-700 tracking-tight"
                            >
                                {guideText}
                            </motion.div>
                        </AnimatePresence>
                        
                        <div className="text-gray-400 font-mono text-sm font-medium bg-white/50 px-3 py-1 rounded-full backdrop-blur-sm">
                             {formatTime(timeLeft)}
                        </div>
                    </div>
                    
                    {/* Early Exit (Optional) */}
                    <button 
                        onClick={() => setSessionState('summary')}
                        className="absolute bottom-8 text-gray-400 text-xs font-medium hover:text-gray-600 transition-colors"
                    >
                        结束练习
                    </button>
                 </motion.div>
            )}

            {/* 3. Summary View */}
            {sessionState === 'summary' && selectedMode && (
                <motion.div
                    key="summary"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                    className="flex flex-col h-full items-center justify-center p-8 relative z-10 text-center"
                >
                    <motion.div 
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", damping: 12, delay: 0.1 }}
                        className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-lg mb-8"
                    >
                        <CheckCircle2 size={48} className="text-green-500" />
                    </motion.div>

                    <h2 className="text-3xl font-black text-gray-800 mb-2">做得好!</h2>
                    <p className="text-gray-500 font-medium mb-10 max-w-[200px] leading-relaxed">
                        你刚刚完成了一次了不起的<br/>心理按摩。
                    </p>

                    <div className="bg-white/60 backdrop-blur-md rounded-2xl p-4 w-full mb-8 flex items-center justify-between border border-white/50 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                                <Clock size={20} />
                            </div>
                            <div className="text-left">
                                <div className="text-xs text-gray-400 font-bold uppercase">专注时长</div>
                                <div className="text-lg font-black text-gray-800">
                                    {formatTime(initialTime - timeLeft)}
                                </div>
                            </div>
                        </div>
                         <div className="text-right">
                             <div className="text-xs text-gray-400 font-bold uppercase">模式</div>
                             <div className="text-sm font-bold text-gray-600">{selectedMode.title}</div>
                         </div>
                    </div>

                    <div className="flex gap-3 w-full">
                        <button 
                            onClick={handleRestart}
                            className="flex-1 py-4 bg-white hover:bg-gray-50 text-gray-700 rounded-[20px] font-bold transition-all shadow-sm border border-gray-100 flex items-center justify-center gap-2"
                        >
                            <RotateCcw size={18} />
                            再练一次
                        </button>
                        <button 
                            onClick={onComplete}
                            className="flex-1 py-4 bg-gray-900 hover:bg-gray-800 text-white rounded-[20px] font-bold transition-all shadow-lg hover:shadow-xl active:scale-95"
                        >
                            完成
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
  );
};
