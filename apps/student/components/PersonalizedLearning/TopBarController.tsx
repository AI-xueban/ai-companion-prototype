import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExpeditionPlan } from '../../types';
import { DynamicExpeditionCapsule } from './DynamicExpeditionCapsule';
import { BookOpen, Brain, ChevronDown } from 'lucide-react';

interface TopBarControllerProps {
  expeditionPlan: ExpeditionPlan | null;
  activeSubject: string;
  currentGrade: string;
  currentTextbook: string;
  stageConfig: any;
  onOpenSyllabus: () => void;
  mode?: 'sync' | 'pro'; // New Prop for Mode
  onModeChange?: (mode: 'sync' | 'pro') => void;
}

export const TopBarController: React.FC<TopBarControllerProps> = ({
  expeditionPlan,
  activeSubject,
  currentGrade,
  currentTextbook,
  onOpenSyllabus,
  mode = 'sync',
  onModeChange
}) => {
  const isPro = mode === 'pro';

  // Dynamic Styles based on Mode
  const glassStyle = isPro 
    ? "bg-black/20 backdrop-blur-xl border-white/10 text-white" 
    : "bg-white/80 backdrop-blur-md border-slate-200/60 text-slate-800";
    
  const textPrimary = isPro ? "text-white" : "text-slate-900";
  const textSecondary = isPro ? "text-white/60" : "text-slate-500";
  const buttonHover = isPro ? "hover:bg-white/10" : "hover:bg-slate-100";

  return (
    <div className="absolute top-0 w-full z-[60] pt-4 px-4 pointer-events-none flex flex-col items-center">
      
      {/* --- LEVEL 1: NAVIGATION BAR --- */}
      <div className="w-full flex justify-between items-start pointer-events-auto max-w-screen-xl mx-auto">
          
      </div>

      {/* --- LEVEL 2: EXPEDITION CAPSULE (Only in Sync Mode) --- */}
      <div className="pointer-events-auto mt-[58px] w-full flex justify-center">
        <AnimatePresence mode="wait">
          {mode === 'sync' && expeditionPlan && (
            <motion.div
                key="expedition-container"
                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="w-full flex justify-center"
            >
                <DynamicExpeditionCapsule plan={expeditionPlan} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
};
