import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Check, Sparkles, MapPin, Calculator, Languages, Scroll, Book, Rocket, Lock } from 'lucide-react';
import { AcademicProfile, CoreSubjectType } from '../../types';

// --- MOCK DATA FOR PROTOTYPE ---
const TEXTBOOK_VERSIONS = ['人教版', '北师大版', '苏科版', '华师大版'];

const MOCK_CHAPTERS: Record<CoreSubjectType, any[]> = {
    '数学': [
        { id: 'not_started', label: '还没开始', subtitle: '准备预习 / 零基础启航', type: 'start' },
        { id: 'ch1', label: '第一章 有理数', subtitle: '正数负数 · 数轴 · 绝对值', type: 'chapter' },
        { id: 'ch2', label: '第二章 整式的加减', subtitle: '单项式 · 多项式 · 合并', type: 'chapter' },
        { id: 'ch3', label: '第三章 一元一次方程', subtitle: '移项 · 去分母 · 应用', type: 'chapter' },
        { id: 'ch4', label: '第四章 几何图形初步', subtitle: '立体图形 · 线段 · 角', type: 'chapter' },
    ],
    '英语': [
        { id: 'not_started', label: '还没开始', subtitle: 'Starter Units 1-3', type: 'start' },
        { id: 'u1', label: 'Unit 1', subtitle: "My name's Gina", type: 'chapter' },
        { id: 'u2', label: 'Unit 2', subtitle: 'This is my sister', type: 'chapter' },
        { id: 'u3', label: 'Unit 3', subtitle: 'Is this your pencil?', type: 'chapter' },
    ],
    '语文': [
        { id: 'not_started', label: '还没开始', subtitle: '第一单元预习', type: 'start' },
        { id: 'u1', label: '第一单元', subtitle: '春 · 济南的冬天', type: 'chapter' },
        { id: 'u2', label: '第二单元', subtitle: '秋天的怀念 · 散步', type: 'chapter' },
        { id: 'u3', label: '第三单元', subtitle: '从百草园到三味书屋', type: 'chapter' },
    ]
};

interface AcademicCompassProps {
  onComplete: (profile: AcademicProfile) => void;
  grade: string;
}

const SUBJECTS: { id: CoreSubjectType, icon: any, label: string }[] = [
    { id: '数学', icon: Calculator, label: '数学' },
    { id: '英语', icon: Languages, label: '英语' },
    { id: '语文', icon: Scroll, label: '语文' },
];

export const AcademicCompass: React.FC<AcademicCompassProps> = ({ onComplete, grade }) => {
  const [activeSubTab, setActiveSubTab] = useState<CoreSubjectType>('数学');
  const [textbookVersion, setTextbookVersion] = useState('人教版');
  const [showVersionMenu, setShowVersionMenu] = useState(false);
  
  // Track selections for each subject
  const [selections, setSelections] = useState<Record<CoreSubjectType, string | null>>({
      '数学': 'not_started', 
      '英语': 'not_started',
      '语文': 'not_started'
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  const handleNodeClick = (id: string) => {
      setSelections(prev => ({ ...prev, [activeSubTab]: id }));
  };

  const completedCount = Object.values(selections).filter(v => v !== null).length;
  // Prototype: consider it "completed" enough to proceed anytime since we have defaults
  const isAllCompleted = true; 

  const handleConfirm = () => {
      onComplete({
          grade: grade,
          textbookVersion: textbookVersion, 
          currentTopicId: selections['数学']! 
      });
  };

  // Helper to determine node state
  const getNodeState = (subject: CoreSubjectType, nodeId: string, index: number) => {
      const currentSelectionId = selections[subject];
      const chapters = MOCK_CHAPTERS[subject];
      const selectedIndex = chapters.findIndex(c => c.id === currentSelectionId);
      
      if (nodeId === currentSelectionId) return 'current';
      if (index < selectedIndex) return 'completed';
      return 'locked';
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-[#0A0B1A] text-white overflow-hidden font-sans">
      {/* 1. Deep Space Background */}
      <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A0B1A] via-[#14162E] to-[#1E2145]"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand/5 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.15) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
      </div>

      {/* 2. Header Area */}
      <div className="pt-12 px-8 z-20 shrink-0">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center text-center"
          >
              <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]"></div>
                  <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.3em]">Core Calibration</span>
              </div>
              <h1 className="text-3xl font-black mb-3 tracking-tight">校准星图坐标</h1>
              <p className="text-white/40 text-sm font-medium mb-4">请找到你各学科目前所在的「星体」位置</p>
              
              {/* Textbook Version Selector */}
              <div className="relative">
                  <button 
                    onClick={() => setShowVersionMenu(!showVersionMenu)}
                    className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-white/70 hover:bg-white/10 hover:text-white transition-all"
                  >
                      <Book size={12} />
                      <span>{textbookVersion}</span>
                      <span className="opacity-50 text-[10px]">▼</span>
                  </button>
                  
                  {showVersionMenu && (
                      <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-32 bg-[#1E2145] border border-white/10 rounded-xl shadow-xl overflow-hidden z-50 py-1">
                          {TEXTBOOK_VERSIONS.map(v => (
                              <button
                                  key={v}
                                  onClick={() => {
                                      setTextbookVersion(v);
                                      setShowVersionMenu(false);
                                  }}
                                  className={`w-full text-left px-4 py-2 text-xs font-medium hover:bg-white/10 ${v === textbookVersion ? 'text-brand' : 'text-white/60'}`}
                              >
                                  {v}
                              </button>
                          ))}
                      </div>
                  )}
              </div>
          </motion.div>

          {/* Subject Tabs */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-8 flex justify-center"
          >
              <div className="bg-white/5 backdrop-blur-2xl p-1.5 rounded-[24px] flex gap-2 border border-white/10 shadow-2xl">
                  {SUBJECTS.map((s) => {
                      const isSelected = activeSubTab === s.id;
                      return (
                          <button
                              key={s.id}
                              onClick={() => setActiveSubTab(s.id)}
                              className={`px-8 py-3 rounded-xl text-xs font-black transition-all flex items-center gap-2 relative overflow-hidden ${
                                  isSelected 
                                      ? 'bg-white text-gray-900 shadow-xl' 
                                      : 'text-white/40 hover:text-white/60'
                              }`}
                          >
                              <s.icon size={14} className={isSelected ? 'text-brand' : ''} />
                              {s.label}
                          </button>
                      );
                  })}
              </div>
          </motion.div>
      </div>

      {/* 3. The Star Field Area */}
      <div className="flex-1 relative flex items-center justify-center w-full">
          <AnimatePresence mode="wait">
            <motion.div 
                key={activeSubTab}
                initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
                className="relative w-full max-w-6xl px-12 h-96 flex items-center overflow-x-auto no-scrollbar snap-x py-10 gap-8 md:gap-16"
            >
                {/* Connecting Line */}
                <div className="absolute top-1/2 left-0 right-0 h-px bg-white/5 -translate-y-1/2 pointer-events-none" />

                {MOCK_CHAPTERS[activeSubTab].map((node, index) => {
                    const state = getNodeState(activeSubTab, node.id, index);
                    const isSelected = state === 'current';
                    const isCompleted = state === 'completed';
                    const isStartNode = node.type === 'start';
                    
                    return (
                        <div key={node.id} className="relative flex-shrink-0 snap-center z-10">
                            {/* Orbital Ring Background for Selected */}
                            {isSelected && (
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 border border-white/5 rounded-full pointer-events-none animate-spin-slow"></div>
                            )}

                            <button
                                onClick={() => handleNodeClick(node.id)}
                                className="relative flex flex-col items-center gap-6 group outline-none"
                            >
                                {/* The Star Body */}
                                <div className="relative">
                                    {/* Pulse Effect */}
                                    <AnimatePresence>
                                        {isSelected && (
                                            <motion.div 
                                                initial={{ scale: 0.8, opacity: 0 }}
                                                animate={{ scale: [1, 2], opacity: [0.3, 0] }}
                                                transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
                                                className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full pointer-events-none ${isStartNode ? 'bg-orange-500' : 'bg-brand'}`}
                                            />
                                        )}
                                    </AnimatePresence>

                                    <div className={`w-20 h-20 rounded-full flex items-center justify-center border-2 transition-all duration-500 relative z-10 
                                        ${isSelected 
                                            ? (isStartNode ? 'bg-orange-500 border-orange-400 shadow-[0_0_40px_rgba(249,115,22,0.4)] scale-110' : 'bg-brand border-brand-light shadow-[0_0_40px_rgba(108,93,211,0.4)] scale-110')
                                            : isCompleted
                                                ? 'bg-brand/20 border-brand/40 text-brand'
                                                : 'bg-[#1E2145] border-white/5 group-hover:border-white/20'
                                        }
                                    `}>
                                        {isStartNode ? (
                                            <Rocket size={28} className={isSelected ? 'text-white' : 'text-orange-400 opacity-50 group-hover:opacity-100'} />
                                        ) : isCompleted ? (
                                            <Check size={24} strokeWidth={3} />
                                        ) : isSelected ? (
                                            <MapPin size={28} className="text-white fill-white/20" />
                                        ) : (
                                            <div className="w-2 h-2 bg-white/10 rounded-full group-hover:bg-white/30 transition-colors"></div>
                                        )}

                                        {/* Lock icon for future nodes */}
                                        {state === 'locked' && !isStartNode && (
                                            <div className="absolute -top-1 -right-1">
                                                <Lock size={12} className="text-white/10" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Star Label */}
                                <div className={`text-center transition-all duration-500 ${isSelected ? 'scale-105 opacity-100' : isCompleted ? 'opacity-50' : 'opacity-30 group-hover:opacity-80'}`}>
                                    <h3 className={`font-black text-sm md:text-base whitespace-nowrap tracking-wide mb-1 ${isSelected ? 'text-white' : 'text-white/70'}`}>
                                        {node.label}
                                    </h3>
                                    <p className="text-[10px] text-white/50 font-medium max-w-[120px] mx-auto leading-tight">
                                        {node.subtitle}
                                    </p>
                                    
                                    {isSelected && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={`text-[9px] font-black px-2 py-0.5 rounded-full mt-2 uppercase tracking-[0.1em] inline-block border ${
                                                isStartNode 
                                                    ? 'bg-orange-500/20 text-orange-300 border-orange-500/20' 
                                                    : 'bg-brand/20 text-brand-light border-brand/20'
                                            }`}
                                        >
                                            Current Location
                                        </motion.div>
                                    )}
                                </div>
                            </button>
                        </div>
                    );
                })}
            </motion.div>
          </AnimatePresence>
      </div>

      {/* 4. Footer Area */}
      <div className="p-8 pb-12 z-20 bg-black/40 backdrop-blur-3xl border-t border-white/5">
          <div className="max-w-md mx-auto">
              <button 
                  onClick={handleConfirm}
                  className="w-full py-5 rounded-[24px] font-black text-lg transition-all flex items-center justify-center gap-3 group relative overflow-hidden active:scale-95 bg-white text-gray-900 shadow-[0_20px_50px_rgba(255,255,255,0.1)] hover:shadow-[0_20px_60px_rgba(255,255,255,0.2)]"
              >
                  <Sparkles size={20} className="text-brand animate-pulse" />
                  <span>确认坐标并启航</span>
                  <ChevronRight size={20} className="opacity-40 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <p className="mt-6 text-center text-white/20 text-[9px] font-bold tracking-widest uppercase">
                  Precision calibration ensures optimal AI pathfinding
              </p>
          </div>
      </div>

    </div>
  );
};