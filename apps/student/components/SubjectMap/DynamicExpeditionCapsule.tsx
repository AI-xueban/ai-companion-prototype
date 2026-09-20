import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Zap, Target, Gift, ChevronDown, Flame, Timer, Check, Info } from 'lucide-react';
import { ExpeditionPlan } from '../../types';

interface DynamicCapsuleProps {
  plan: ExpeditionPlan;
}

export const DynamicExpeditionCapsule: React.FC<DynamicCapsuleProps> = ({ plan }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Calculate remaining days (mock)
  const daysLeft = 5; 
  const progress = 35; // %
  const totalTasks = 12;
  const completedTasks = 4;
  
  // Dynamic color based on urgency
  const urgencyColor = daysLeft <= 2 ? 'text-rose-400' : daysLeft <= 5 ? 'text-amber-400' : 'text-emerald-400';
  const urgencyBg = daysLeft <= 2 ? 'bg-rose-500' : daysLeft <= 5 ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <motion.div 
        layoutId="top-capsule"
        initial={{ opacity: 0, y: -20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className={`relative z-50 w-full max-w-sm transition-all duration-500 ease-spring ${isExpanded ? 'max-w-md' : 'max-w-sm'}`}
    >
        {/* Main Capsule Container */}
        <motion.div 
            onClick={() => setIsExpanded(!isExpanded)}
            whileTap={{ scale: 0.98 }}
            className={`
                relative overflow-hidden cursor-pointer
                bg-slate-900/90 backdrop-blur-xl border border-white/10 shadow-2xl
                transition-all duration-500
                ${isExpanded ? 'rounded-[32px]' : 'rounded-full'}
            `}
        >
            {/* Mesh Gradient Background Effect */}
            <div className="absolute inset-0 opacity-30 pointer-events-none">
                 <div className="absolute top-0 left-0 w-3/4 h-3/4 bg-indigo-500/20 blur-[60px] animate-pulse" />
                 <div className="absolute bottom-0 right-0 w-3/4 h-3/4 bg-purple-500/20 blur-[60px] animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            {/* Glowing Border Edge */}
            <div className="absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/10 pointer-events-none" />
            
            {/* CAPSULE CONTENT (Compact View) */}
            <div className="relative flex items-center justify-between p-1.5 pr-2 h-[60px]">
                
                {/* LEFT: Time Dilation (Countdown) */}
                <div className="flex items-center gap-3 pl-1">
                    <div className="relative w-11 h-11 flex items-center justify-center">
                        {/* Progress Ring SVG */}
                        <svg className="absolute inset-0 w-full h-full -rotate-90">
                            <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                            <motion.circle 
                                cx="22" cy="22" r="18" fill="none" stroke="currentColor" strokeWidth="3"
                                strokeDasharray="113"
                                strokeDashoffset={113 - (113 * (daysLeft/14))} // assuming 2 weeks max
                                strokeLinecap="round"
                                className={urgencyColor}
                                initial={{ strokeDashoffset: 113 }}
                                animate={{ strokeDashoffset: 113 - (113 * (daysLeft/14)) }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                            />
                        </svg>
                        <div className="flex flex-col items-center justify-center leading-none mt-0.5">
                            <span className={`text-sm font-black ${urgencyColor}`}>{daysLeft}</span>
                            <span className="text-[7px] font-bold text-white/40 uppercase">Days</span>
                        </div>
                    </div>
                </div>

                {/* CENTER: Focus Anchor */}
                <div className="flex-1 flex flex-col items-start justify-center px-2 border-l border-white/5 mx-2 h-8">
                     <div className="flex items-center gap-1.5 mb-0.5">
                         <span className="text-white font-bold text-sm tracking-wide">
                             {plan.target === 'weakness' ? '几何攻坚战' : plan.target === 'preview' ? '超前预习' : '期末冲刺'}
                         </span>
                         {daysLeft <= 2 && (
                             <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[8px] font-black uppercase animate-pulse">
                                 Urgent
                             </span>
                         )}
                     </div>
                     <div className="w-full flex items-center gap-2">
                         <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                             <motion.div 
                                className={`h-full rounded-full ${urgencyBg}`}
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 1 }}
                             />
                         </div>
                         <span className="text-[9px] font-medium text-white/50 whitespace-nowrap">
                             {completedTasks}/{totalTasks} 关卡
                         </span>
                     </div>
                </div>

                {/* RIGHT: Incentive (Chest) */}
                <div className="relative shrink-0 w-10 h-10 flex items-center justify-center bg-white/5 rounded-full border border-white/10 group-hover:bg-white/10 transition-colors">
                     <Gift size={20} className="text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)] animate-[bounce_3s_infinite]" />
                     <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border border-slate-900 animate-ping" />
                     <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border border-slate-900" />
                </div>
            </div>

            {/* EXPANDED DETAILS PANEL */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="px-5 pb-5 pt-2 border-t border-white/10"
                    >
                         <div className="grid grid-cols-2 gap-3 mb-4">
                             <div className="bg-white/5 rounded-xl p-3 flex flex-col gap-1">
                                 <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">截止时间</span>
                                 <div className="flex items-center gap-2 text-white font-medium text-xs">
                                     <Timer size={14} className="text-indigo-400" />
                                     12月31日 23:59
                                 </div>
                             </div>
                             <div className="bg-white/5 rounded-xl p-3 flex flex-col gap-1">
                                 <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">通关奖励</span>
                                 <div className="flex items-center gap-2 text-white font-medium text-xs">
                                     <Flame size={14} className="text-amber-400" />
                                     几何大师勋章
                                 </div>
                             </div>
                         </div>
                         
                         <div className="text-center">
                             <button className="text-[10px] text-white/30 hover:text-rose-400 font-medium transition-colors flex items-center justify-center gap-1 mx-auto">
                                 放弃本次特训
                             </button>
                         </div>
                         
                         {/* Collapse Chevron */}
                         <div className="absolute bottom-1 left-1/2 -translate-x-1/2 text-white/10">
                             <ChevronDown size={12} className="rotate-180" />
                         </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </motion.div>
    </motion.div>
  );
};



















