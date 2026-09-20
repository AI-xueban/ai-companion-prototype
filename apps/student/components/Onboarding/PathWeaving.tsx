
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Zap, Brain, CheckCircle2, Star, Target } from 'lucide-react';

interface PathWeavingProps {
  onComplete: () => void;
}

export const PathWeaving: React.FC<PathWeavingProps> = ({ onComplete }) => {
  const [stage, setStage] = useState<'gathering' | 'weaving' | 'done'>('gathering');

  useEffect(() => {
    // Sequence timing
    const t1 = setTimeout(() => setStage('weaving'), 2000); // 2s gathering
    const t2 = setTimeout(() => setStage('done'), 5000); // 3s weaving animation

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // Particles config for "Gathering" phase
  const particles = [
    { id: 1, startX: '10%', startY: '20%', color: 'bg-blue-400', icon: Brain, delay: 0 },
    { id: 2, startX: '90%', startY: '15%', color: 'bg-purple-400', icon: Zap, delay: 0.2 },
    { id: 3, startX: '15%', startY: '85%', color: 'bg-yellow-400', icon: Star, delay: 0.4 },
    { id: 4, startX: '85%', startY: '80%', color: 'bg-pink-400', icon: Target, delay: 0.6 },
    { id: 5, startX: '50%', startY: '10%', color: 'bg-cyan-400', icon: Sparkles, delay: 0.8 },
  ];

  return (
    <div className="absolute inset-0 z-50 bg-[#2D1B69] flex flex-col items-center justify-center overflow-hidden">
        {/* Background Ambience */}
        <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand/20 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.2) 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
        </div>

        {/* 1. Gathering Phase: Particles converging to center */}
        {stage === 'gathering' && (
            <>
                {particles.map((p) => (
                    <motion.div
                        key={p.id}
                        initial={{ left: p.startX, top: p.startY, opacity: 0, scale: 0 }}
                        animate={{ 
                            left: '50%', 
                            top: '50%', 
                            opacity: [0, 1, 1, 0], 
                            scale: [0.5, 1.2, 0.2, 0],
                            x: '-50%',
                            y: '-50%'
                        }}
                        transition={{ duration: 1.8, ease: "easeInOut", delay: p.delay }}
                        className={`absolute w-12 h-12 rounded-full ${p.color} flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.4)] z-20`}
                    >
                        <p.icon className="text-white" size={24} />
                    </motion.div>
                ))}
                
                {/* Central Absorption Core */}
                <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-white/10 rounded-full blur-xl z-10"
                />

                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="absolute bottom-20 text-white/70 font-bold text-lg tracking-widest uppercase z-30"
                >
                    正在汇聚你的思维能量...
                </motion.div>
            </>
        )}

        {/* 2. Weaving Phase: Drawing the Path */}
        {(stage === 'weaving' || stage === 'done') && (
            <div className="relative w-full max-w-md aspect-square flex items-center justify-center">
                {/* Central Core */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    className="absolute z-20 w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-[0_0_60px_rgba(255,255,255,0.6)]"
                >
                    <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 border-[3px] border-dashed border-brand/30 rounded-full" 
                    />
                    <Brain size={40} className="text-brand" />
                </motion.div>

                {/* SVG Paths growing out */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" viewBox="0 0 400 400">
                    <defs>
                        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#60A5FA" />
                            <stop offset="100%" stopColor="#A78BFA" />
                        </linearGradient>
                    </defs>
                    
                    {/* Path 1: Top Left */}
                    <motion.path
                        d="M 200 200 C 200 150, 100 200, 80 120"
                        fill="transparent"
                        stroke="url(#grad1)"
                        strokeWidth="4"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.5, delay: 0.2, ease: "easeInOut" }}
                    />
                    {/* Path 2: Top Right */}
                    <motion.path
                        d="M 200 200 C 200 150, 300 200, 320 120"
                        fill="transparent"
                        stroke="#F472B6"
                        strokeWidth="4"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.5, delay: 0.4, ease: "easeInOut" }}
                    />
                    {/* Path 3: Bottom Left */}
                    <motion.path
                        d="M 200 200 C 200 250, 100 200, 80 280"
                        fill="transparent"
                        stroke="#34D399"
                        strokeWidth="4"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.5, delay: 0.6, ease: "easeInOut" }}
                    />
                    {/* Path 4: Bottom Right */}
                    <motion.path
                        d="M 200 200 C 200 250, 300 200, 320 280"
                        fill="transparent"
                        stroke="#FBBF24"
                        strokeWidth="4"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.5, delay: 0.8, ease: "easeInOut" }}
                    />
                    
                    {/* Path 5: Top Vertical */}
                    <motion.path
                        d="M 200 200 L 200 80"
                        fill="transparent"
                        stroke="#fff"
                        strokeWidth="2"
                        strokeDasharray="4 4"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.2, delay: 1 }}
                    />

                    {/* Nodes appearing at ends */}
                    {stage === 'done' && (
                        <>
                            <motion.circle initial={{scale:0}} animate={{scale:1}} cx="80" cy="120" r="12" fill="#60A5FA" className="drop-shadow-[0_0_10px_#60A5FA]" />
                            <motion.circle initial={{scale:0}} animate={{scale:1}} cx="320" cy="120" r="12" fill="#F472B6" className="drop-shadow-[0_0_10px_#F472B6]" />
                            <motion.circle initial={{scale:0}} animate={{scale:1}} cx="80" cy="280" r="12" fill="#34D399" className="drop-shadow-[0_0_10px_#34D399]" />
                            <motion.circle initial={{scale:0}} animate={{scale:1}} cx="320" cy="280" r="12" fill="#FBBF24" className="drop-shadow-[0_0_10px_#FBBF24]" />
                            <motion.circle initial={{scale:0}} animate={{scale:1}} cx="200" cy="80" r="8" fill="#fff" className="drop-shadow-[0_0_10px_#fff]" />
                        </>
                    )}
                </svg>
            </div>
        )}

        {/* 3. Done Phase: Result Text & CTA */}
        {stage === 'done' && (
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="absolute bottom-16 w-full px-8 text-center z-40"
            >
                <div className="flex flex-col items-center gap-4 bg-black/20 backdrop-blur-md p-6 rounded-[32px] border border-white/10 max-w-md mx-auto">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-black text-white mb-1">专属路径已生成</h2>
                        <p className="text-white/60 text-sm">Lumi 为你规划了从「能力」到「满分」的最优路线</p>
                    </div>
                    
                    <button 
                        onClick={onComplete}
                        className="w-full bg-white text-brand px-12 py-4 rounded-2xl font-black text-lg shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
                    >
                        <CheckCircle2 size={24} className="text-accent" />
                        开启旅程
                        <div className="absolute inset-0 bg-white/20 rounded-2xl animate-pulse"></div>
                    </button>
                </div>
            </motion.div>
        )}
    </div>
  );
};
