
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';
import { InteractiveLumi } from '../LumiSpace/InteractiveLumi';

interface OnboardingStep {
    id: string;
    tab: string;
    targetId: string | null;
    title: string;
    desc: string;
    preferredPlacement: string;
    emotion: 'idle' | 'happy' | 'listening' | 'shredding' | 'breathing' | 'analyzing' | 'thinking';
}

const STEPS: OnboardingStep[] = [
    {
        id: 'step-1-task',
        tab: 'today',
        targetId: 'guide-task-first',
        title: '每日任务流',
        desc: '查看今天的学习任务，跟着小晤一步步完成。',
        preferredPlacement: 'bottom', 
        emotion: 'happy'
    },
    {
        id: 'step-mood-checkin',
        tab: 'today', 
        targetId: 'guide-mood-checkin',
        title: '情绪气象站',
        desc: '记录每天的心情，让 小晤 更懂你。不仅是学习助手，更是你的知心伙伴。',
        preferredPlacement: 'bottom',
        emotion: 'listening'
    },
    {
        id: 'step-lumi-lab',
        tab: 'today',
        targetId: 'guide-lumi-lab',
        title: '小晤 LAB 创新工坊',
        desc: '这里是你与伙伴们协作的创意空间。你可以参与火星生态瓶设计，收集情报并推进阶段进度。不仅能学到新知识，还能体验团队协作的乐趣！',
        preferredPlacement: 'top',
        emotion: 'happy'
    },
    {
        id: 'step-league-rank',
        tab: 'today',
        targetId: 'guide-league-rank',
        title: '星际联赛排行',
        desc: '不断学习获得XP经验值来提升段位！每周结算一次，前三名可以升级到下一个段位哦，加油向着顶峰进发！',
        preferredPlacement: 'top',
        emotion: 'happy'
    },
    {
        id: 'step-2-map',
        tab: 'subject',
        targetId: 'guide-map-node',
        title: '学科地图',
        desc: '告别枯燥刷题！在这里，学习就像打怪升级。点亮节点，解锁新知识和宝箱。',
        preferredPlacement: 'top',
        emotion: 'idle'
    },
    {
        id: 'step-learning-mode',
        tab: 'subject', 
        targetId: 'guide-learning-mode', 
        title: '备考模式',
        desc: '马上有考试了？切换到"冲刺模式"，小晤和你一起高效备考。',
        preferredPlacement: 'bottom',
        emotion: 'analyzing' 
    },
    {
        id: 'step-3-mistake',
        tab: 'mistake',
        targetId: 'guide-mistake-entry',
        title: '举一反三',
        desc: '拍下错题，小晤 为你讲解错题，并生成精准的‘变式训练’。不再盲目刷题，真正做到错一题、会一类。',
        preferredPlacement: 'top',
        emotion: 'analyzing'
    },
    {
        id: 'step-4-partner',
        tab: 'partner',
        targetId: 'guide-lumi-avatar', 
        title: '情绪加油站',
        desc: '累了？焦虑了？随时来找我聊聊。我有“情绪碎纸机”和“呼吸放松”小游戏，帮你找回元气。',
        preferredPlacement: 'bottom',
        emotion: 'happy'
    },
    {
        id: 'step-5-profile',
        tab: 'me',
        targetId: 'guide-growth-radar', 
        title: '六边形战士',
        desc: '见证你的每一次成长。通过多维能力图谱，精准发现你的强项与潜力。',
        preferredPlacement: 'bottom',
        emotion: 'happy'
    },
    {
        id: 'step-6-final',
        tab: 'today',
        targetId: null, // Center screen
        title: '准备启航',
        desc: '准备好开启你的学霸之旅了吗？Let\'s go!',
        preferredPlacement: 'center',
        emotion: 'happy'
    }
];

// Layout Constants
const BUBBLE_WIDTH = 280; 
const BUBBLE_HEIGHT_ESTIMATE = 160; 
const VIEWPORT_MARGIN = 16; 
const TARGET_GAP = 12; 

interface TargetRect {
    top: number;
    left: number;
    width: number;
    height: number;
    bottom: number;
    right: number;
}

interface CalculatedLayout {
    bubbleX: number;
    bubbleY: number;
    arrowX: number;
    placement: 'top' | 'bottom' | 'center';
}

interface OnboardingOverlayProps {
  onComplete: () => void;
  onSwitchTab: (tabId: string) => void;
}

export const OnboardingOverlay: React.FC<OnboardingOverlayProps> = ({ onComplete, onSwitchTab }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [layout, setLayout] = useState<CalculatedLayout | null>(null);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [isTargetReady, setIsTargetReady] = useState(false);
  
  const step = STEPS[stepIndex];

  // --- 1. Switch Tab & Auto Scroll Effect ---
  useEffect(() => {
      // Whenever step changes, ensure we are on the right tab
      if (step.tab) {
          onSwitchTab(step.tab);
          // Reset readiness when switching steps/tabs to wait for mount
          setIsTargetReady(false);
          setLayout(null); 
          setTargetRect(null);
      }

      // Auto-scroll to target
      const scrollTimer = setTimeout(() => {
          if (step.targetId) {
              const targetElement = document.getElementById(step.targetId);
              if (targetElement) {
                  targetElement.scrollIntoView({
                      behavior: 'smooth',
                      block: 'center',
                  });
              }
          }
      }, 300);

      return () => clearTimeout(scrollTimer);
  }, [stepIndex, step.tab, step.targetId, onSwitchTab]);

  // --- 2. Core Positioning Engine ---
  const updateLayout = useCallback(() => {
      const container = document.getElementById('app-viewport');
      
      // Handle "Center" steps (No target)
      if (!step.targetId) {
          if (container) {
              const cRect = container.getBoundingClientRect();
              // Center in the container
              setLayout({
                  bubbleX: cRect.width / 2 - BUBBLE_WIDTH / 2,
                  bubbleY: cRect.height / 2 - 100, 
                  arrowX: 0,
                  placement: 'center'
              });
              setTargetRect(null);
              setIsTargetReady(true);
          }
          return;
      }

      const target = document.getElementById(step.targetId);
      
      // If target not found yet (e.g. tab switching animation), return and keep waiting
      if (!container || !target) {
          return;
      }

      // Target found!
      setIsTargetReady(true);

      const cRect = container.getBoundingClientRect();
      const tRect = target.getBoundingClientRect();

      // Border Compensation
      const borderTop = container.clientTop || 0;
      const borderLeft = container.clientLeft || 0;

      // Base Relative Coordinates
      let finalTop = tRect.top - cRect.top - borderTop;
      let finalLeft = tRect.left - cRect.left - borderLeft;
      let finalWidth = tRect.width;
      let finalHeight = tRect.height;

      // Smart Focus Box Sizing (Center-Lock Logic)
      if (step.targetId.startsWith('guide-nav-')) {
          const SQUARE_SIZE = 48; 
          const centerX = finalLeft + finalWidth / 2;
          const centerY = finalTop + finalHeight / 2;
          finalLeft = centerX - SQUARE_SIZE / 2;
          finalTop = centerY - SQUARE_SIZE / 2;
          finalWidth = SQUARE_SIZE;
          finalHeight = SQUARE_SIZE;
      }

      const padding = 4; 
      const currentTargetRect = {
          top: finalTop - padding,
          left: finalLeft - padding,
          width: finalWidth + (padding * 2),
          height: finalHeight + (padding * 2),
          bottom: (finalTop - padding) + (finalHeight + padding * 2),
          right: (finalLeft - padding) + (finalWidth + padding * 2)
      };
      setTargetRect(currentTargetRect);

      // Vertical Placement Logic (Auto-Flip)
      const containerHeight = container.clientHeight; 
      const spaceBelow = containerHeight - currentTargetRect.bottom;
      const spaceAbove = currentTargetRect.top;
      
      let placement = step.preferredPlacement;

      if (placement === 'bottom' && spaceBelow < BUBBLE_HEIGHT_ESTIMATE + TARGET_GAP) {
          placement = 'top';
      } else if (placement === 'top' && spaceAbove < BUBBLE_HEIGHT_ESTIMATE + TARGET_GAP) {
          placement = 'bottom';
      }

      // Calculate Y Position
      let bubbleY = 0;
      if (placement === 'top') {
          bubbleY = currentTargetRect.top - TARGET_GAP;
      } else {
          bubbleY = currentTargetRect.bottom + TARGET_GAP;
      }

      // Horizontal Positioning (Clamping)
      const targetCenter = currentTargetRect.left + (currentTargetRect.width / 2);
      let bubbleX = targetCenter - (BUBBLE_WIDTH / 2);

      const containerWidth = container.clientWidth;
      const maxLeft = containerWidth - BUBBLE_WIDTH - VIEWPORT_MARGIN;
      const minLeft = VIEWPORT_MARGIN;
      bubbleX = Math.max(minLeft, Math.min(bubbleX, maxLeft));

      // Smart Arrow Positioning
      let arrowX = targetCenter - bubbleX;
      const ARROW_SAFE_MARGIN = 24; 
      arrowX = Math.max(ARROW_SAFE_MARGIN, Math.min(arrowX, BUBBLE_WIDTH - ARROW_SAFE_MARGIN));

      setLayout({
          bubbleX,
          bubbleY,
          arrowX,
          placement: placement as 'top' | 'bottom'
      });

  }, [step.targetId, step.preferredPlacement]);

  // --- Lifecycle ---
  useEffect(() => {
      const interval = setInterval(updateLayout, 100); 
      window.addEventListener('resize', updateLayout);

      return () => {
          clearInterval(interval);
          window.removeEventListener('resize', updateLayout);
      };
  }, [updateLayout]);

  const handleNext = () => {
      if (stepIndex < STEPS.length - 1) {
          setStepIndex(prev => prev + 1);
      } else {
          onComplete();
      }
  };

  if (!layout || !isTargetReady) return null;

  return (
    <div className="absolute inset-0 z-[200] overflow-hidden pointer-events-auto font-sans">
        {/* Transparent Shield */}
        <div className="absolute inset-0 bg-transparent cursor-default" />

        {/* Skip Button */}
        <div className="absolute top-6 right-6 z-[220]">
            <button 
                onClick={onComplete}
                className="px-4 py-1.5 bg-white/80 backdrop-blur rounded-full text-[12px] font-bold text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm h-[37px] w-[83px] my-[54px]"
            >
                跳过引导
            </button>
        </div>

        <AnimatePresence mode="wait">
            <motion.div
                key={step.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 pointer-events-none"
            >
                {/* --- 1. Focus Highlight (Brackets) --- */}
                {targetRect && (
                    <div 
                        className="absolute z-10 transition-all duration-300 ease-out"
                        style={{
                            top: targetRect.top,
                            left: targetRect.left,
                            width: targetRect.width,
                            height: targetRect.height,
                        }}
                    >
                        <motion.div 
                            initial={{ scale: 1.1, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            className="w-full h-full relative"
                        >
                            {/* Brackets */}
                            <div className="absolute top-0 left-0 w-3 h-3 border-t-[3px] border-l-[3px] border-brand rounded-tl-lg shadow-sm"></div>
                            <div className="absolute top-0 right-0 w-3 h-3 border-t-[3px] border-r-[3px] border-brand rounded-tr-lg shadow-sm"></div>
                            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-[3px] border-l-[3px] border-brand rounded-bl-lg shadow-sm"></div>
                            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-[3px] border-r-[3px] border-brand rounded-br-lg shadow-sm"></div>
                            
                            <motion.div 
                                animate={{ opacity: [0, 0.1, 0] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="absolute inset-0 bg-brand rounded-lg"
                            />
                        </motion.div>
                    </div>
                )}

                {/* --- 2. Information Popover --- */}
                <motion.div
                    className="absolute z-20 pointer-events-auto"
                    style={{
                        width: BUBBLE_WIDTH,
                        left: layout.bubbleX,
                        top: layout.bubbleY,
                        transform: layout.placement === 'top' ? 'translateY(-100%)' : 'none'
                    }}
                    initial={{ opacity: 0, scale: 0.9, y: layout.placement === 'top' ? 10 : -10 }} 
                    animate={{ 
                        opacity: 1, 
                        scale: 1, 
                        y: 0,
                        transform: layout.placement === 'top' ? 'translateY(-100%)' : 'none' 
                    }} 
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                >
                    <div className="bg-white/95 backdrop-blur-xl p-5 rounded-[24px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] border border-white/50 ring-1 ring-black/5 relative">
                        
                        {/* Dynamic Arrow */}
                        {layout.placement !== 'center' && (
                            <div 
                                className={`absolute w-4 h-4 bg-white transform rotate-45 border-r border-b border-black/5 ${
                                    layout.placement === 'top' 
                                        ? '-bottom-2 border-r border-b shadow-[2px_2px_2px_rgba(0,0,0,0.02)]' 
                                        : '-top-2 border-l border-t shadow-[-1px_-1px_1px_rgba(0,0,0,0.01)]'
                                }`}
                                style={{ 
                                    left: layout.arrowX,
                                    marginLeft: -8, 
                                    borderRight: layout.placement === 'top' ? '1px solid rgba(0,0,0,0.05)' : 'none',
                                    borderBottom: layout.placement === 'top' ? '1px solid rgba(0,0,0,0.05)' : 'none',
                                    borderLeft: layout.placement === 'bottom' ? '1px solid rgba(0,0,0,0.05)' : 'none',
                                    borderTop: layout.placement === 'bottom' ? '1px solid rgba(0,0,0,0.05)' : 'none',
                                }}
                            />
                        )}

                        <div className="flex gap-4 relative z-10">
                            {/* Icon Replacement: 3D InteractiveLumi Micro */}
                            <div className="shrink-0">
                                <InteractiveLumi size="xs" variant="micro" emotion={step.emotion} className="w-10 h-10" />
                            </div>
                            
                            <div className="flex-1">
                                <h3 className="font-black text-gray-800 text-sm mb-1">{step.title}</h3>
                                <p className="text-xs text-gray-500 font-medium leading-relaxed mb-4">
                                    {step.desc}
                                </p>
                                
                                <div className="flex justify-end">
                                    <button 
                                        onClick={handleNext}
                                        className="flex items-center gap-1.5 bg-gray-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-black transition-colors shadow-md active:scale-95"
                                    >
                                        {stepIndex === STEPS.length - 1 ? '开始探索' : '下一步'}
                                        {stepIndex === STEPS.length - 1 ? <Check size={12} /> : <ArrowRight size={12} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    </div>
  );
};
