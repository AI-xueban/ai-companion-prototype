
import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Ghost, ArrowRight, Clock, ShieldCheck, ChevronRight, Sparkles } from 'lucide-react';

interface AssessmentGateProps {
  nickname: string;
  onStartAssessment: () => void;
  onSkip: () => void;
}

export const AssessmentGate: React.FC<AssessmentGateProps> = ({ nickname, onStartAssessment, onSkip }) => {
  return (
    <div className="w-full h-full bg-[#0A0B1A] flex flex-col relative overflow-hidden p-6 md:p-8">
      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-[#0A0B1A] to-[#14162E]"></div>
          <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-brand/10 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-500/5 rounded-full blur-[100px]"></div>
      </div>
      
      {/* Header Text */}
      <div className="mt-16 mb-12 text-center z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl font-black text-white mb-4 tracking-tight">
                你好，<span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-light to-cyan-300">{nickname}</span>! 👋
            </h1>
            <p className="text-white/40 text-lg font-medium max-w-md mx-auto leading-relaxed">
                为了为你定制最适合的“超能力”成长路径，建议进行一次快速能力画像。
            </p>
          </motion.div>
      </div>

      {/* Cards Container */}
      <div className="flex-1 flex flex-col md:flex-row gap-8 items-center justify-center max-w-5xl mx-auto w-full z-10 pb-20">
          
          {/* Card A: Start Assessment (Holographic Breathing) */}
          <motion.button 
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
              whileHover={{ scale: 1.02, y: -5 }}
              whileTap={{ scale: 0.98 }}
              onClick={onStartAssessment}
              className="flex-1 w-full max-w-sm aspect-[4/5] md:aspect-auto md:h-[420px] relative rounded-[40px] p-1 group overflow-hidden"
          >
              {/* Animated Holographic Border/Glow */}
              <motion.div 
                animate={{ 
                    rotate: [0, 360],
                    background: [
                        'conic-gradient(from 0deg, #6C5DD3, #22D3EE, #8B5CF6, #6C5DD3)',
                        'conic-gradient(from 360deg, #6C5DD3, #22D3EE, #8B5CF6, #6C5DD3)'
                    ]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute inset-[-100%] z-0 opacity-40 blur-2xl group-hover:opacity-80 transition-opacity"
              />

              <div className="bg-[#14162E] h-full rounded-[39px] p-8 flex flex-col relative z-10 border border-white/10 overflow-hidden">
                  {/* Subtle Rainbow Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-brand/20 via-transparent to-cyan-500/10 pointer-events-none"></div>
                  
                  <div className="w-16 h-16 bg-white rounded-[24px] flex items-center justify-center text-brand mb-8 shadow-[0_0_30px_rgba(108,93,211,0.4)] group-hover:scale-110 transition-transform duration-500">
                      <Brain size={36} strokeWidth={2.5} />
                  </div>
                  
                  <h3 className="text-3xl font-black text-white mb-3 tracking-tight">开启能力测评</h3>
                  <p className="text-white/50 text-sm mb-8 leading-relaxed font-medium">
                      小晤深度分析你的逻辑、记忆与专注力，生成专属六边形能力图谱。
                  </p>
                  
                  <div className="mt-auto space-y-3">
                      <div className="flex items-center gap-3 text-xs text-brand-light font-black bg-brand/10 w-fit px-4 py-2 rounded-full border border-brand/20">
                          <Clock size={14} /> 耗时约 3 分钟
                      </div>
                      <div className="flex items-center gap-3 text-xs text-cyan-300 font-black bg-cyan-400/10 w-fit px-4 py-2 rounded-full border border-cyan-400/20">
                          <Sparkles size={14} /> 解锁专属画像
                      </div>
                  </div>

                  <div className="absolute bottom-8 right-8 w-12 h-12 rounded-full bg-white text-gray-900 flex items-center justify-center group-hover:translate-x-2 transition-transform shadow-xl">
                      <ArrowRight size={24} strokeWidth={3} />
                  </div>
              </div>
          </motion.button>

          {/* Card B: Skip (iOS Ghost Button) */}
          <motion.button 
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 100 }}
              whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.05)' }}
              whileTap={{ scale: 0.98 }}
              onClick={onSkip}
              className="flex-1 w-full max-w-sm aspect-[4/5] md:aspect-auto md:h-[420px] bg-white/[0.02] border border-white/10 rounded-[40px] p-8 flex flex-col text-left group transition-all"
          >
              <div className="w-14 h-14 bg-white/5 rounded-[22px] flex items-center justify-center text-white/30 mb-8 border border-white/10 group-hover:text-white group-hover:border-white/30 transition-all">
                  <Ghost size={28} />
              </div>
              
              <h3 className="text-2xl font-bold text-white/60 mb-3 group-hover:text-white transition-colors">以后再说</h3>
              <p className="text-white/30 text-sm mb-8 leading-relaxed font-medium group-hover:text-white/40 transition-colors">
                  直接进入学习空间。你可以随时在「我的」页面补测能力画像。
              </p>
              
              <div className="mt-auto pt-6 border-t border-white/5 flex items-center justify-between text-white/30 text-xs font-black uppercase tracking-widest group-hover:text-white transition-colors">
                  <span>跳过并加载标准课程</span>
                  <ChevronRight size={18} />
              </div>
          </motion.button>

      </div>

      <div className="absolute bottom-10 left-0 right-0 text-center opacity-20">
          <p className="text-[10px] font-black text-white uppercase tracking-[0.4em]">Propulsion System Ready // No: 24-B</p>
      </div>
    </div>
  );
};
