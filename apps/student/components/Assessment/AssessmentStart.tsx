
import React from 'react';
import { motion as motionOriginal } from 'framer-motion';
import { ArrowRight, X } from 'lucide-react';
import { InteractiveLumi } from '../LumiSpace/InteractiveLumi';

const motion = motionOriginal as any;

interface AssessmentStartProps {
  onStart: () => void;
  onExit: () => void;
  userName?: string;
}

export const AssessmentStart: React.FC<AssessmentStartProps> = ({ onStart, onExit, userName = '李华' }) => {
  return (
    <div className="w-full h-full relative bg-gray-900 flex flex-col items-center justify-center overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand/30 rounded-full blur-[100px] animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-[80px]"></div>
          
          {/* Grid lines */}
          <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '50px 50px' }}></div>
      </div>

      {/* Exit Button */}
      <button 
        onClick={onExit}
        className="absolute top-8 right-8 z-50 text-white/50 hover:text-white transition-colors bg-white/10 p-2 rounded-full backdrop-blur-sm"
      >
        <X size={24} />
      </button>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-8 max-w-lg">
        
        {/* Breathing AI Orb Replacement */}
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-12 relative"
        >
            <InteractiveLumi size="lg" variant="hero" emotion="breathing" />
        </motion.div>

        {/* Text */}
        <motion.div
             initial={{ y: 20, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             transition={{ delay: 0.3 }}
             className="flex flex-col gap-4 mb-16"
        >
            <h1 className="text-3xl font-extrabold text-white leading-tight">
                你好，{userName}！<br/>
                我是你的专属 AI 伙伴。
            </h1>
            <p className="text-gray-300 text-lg leading-relaxed font-medium">
                为了能更好地帮助你学习，<br/>我需要了解你的“<span className="text-accent font-bold">超能力</span>”属性。
            </p>
        </motion.div>

        {/* Action Button */}
        <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onStart}
            className="w-full bg-accent hover:bg-yellow-300 text-brand-dark font-black text-xl py-5 rounded-[24px] shadow-[0_10px_30px_rgba(255,206,81,0.3)] flex items-center justify-center gap-3 group relative overflow-hidden"
        >
            <span className="relative z-10">开始测评</span>
            <ArrowRight className="relative z-10 group-hover:translate-x-1 transition-transform" strokeWidth={3} />
            
            {/* Shine effect */}
            <div className="absolute top-0 -left-full w-full h-full bg-white/30 skew-x-[-20deg] group-hover:animate-[shine_1s_ease-in-out]"></div>
        </motion.button>
        
        {/* Helper text */}
        <motion.p 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ delay: 1 }}
            className="mt-6 text-white/30 text-xs font-bold"
        >
            预计耗时 3 分钟 · AI 实时分析
        </motion.p>
      </div>

    </div>
  );
};
