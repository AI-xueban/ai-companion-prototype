import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { KnowledgeNode } from '../../../knowledgeGraphTypes';
import { X, ChevronRight, AlertCircle, CheckCircle, HelpCircle, ChevronLeft, Target, RefreshCw, AlertTriangle, Sparkles, Rocket, Crown } from 'lucide-react';
import { QuestionBankModal } from '../../Quiz/QuestionBankModal';
import { QuickQuizModal } from '../../Quiz/QuickQuizModal';

interface DiagnosisCardProps {
  node: KnowledgeNode;
  onClose: () => void;
  onAction?: (action: string) => void;
}

const mapSubjectToQuestionBank = (subject?: string) => {
  if (subject === '英语') return 'english';
  if (subject === '语文') return 'chinese';
  return 'math';
};

const DiagnosisCard: React.FC<DiagnosisCardProps> = ({ node, onClose, onAction }) => {
  const [viewLevel, setViewLevel] = useState<'overview' | 'mistakes'>('overview');
  // State for Modals
  const [showQuestionBank, setShowQuestionBank] = useState(false);
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);

  // 状态样式与文案映射（5 态 + 兼容 not_mastered）
  const STATUS_MAP: Record<
    string,
    { label: string; className: string; icon: React.ReactNode }
  > = {
    mastered: {
      label: '已掌握',
      className: 'text-[#34C759] bg-[#34C759]/10 border-[#34C759]/20',
      icon: <CheckCircle size={16} />
    },
    reviewing: {
      label: '需复习',
      className: 'text-[#FFD60A] bg-[#FFD60A]/10 border-[#FFD60A]/20',
      icon: <AlertCircle size={16} />
    },
    weak: {
      label: '未掌握',
      className: 'text-[#FF3B30] bg-[#FF3B30]/10 border-[#FF3B30]/20',
      icon: <AlertCircle size={16} />
    },
    not_mastered: {
      label: '未掌握',
      className: 'text-[#FF3B30] bg-[#FF3B30]/10 border-[#FF3B30]/20',
      icon: <AlertCircle size={16} />
    },
    exploring: {
      label: '探索中',
      className: 'text-[#0A84FF] bg-[#0A84FF]/10 border-[#0A84FF]/20',
      icon: <HelpCircle size={16} />
    },
    unknown: {
      label: '未知',
      className: 'text-slate-400 bg-slate-100/10 border-slate-200/30',
      icon: <HelpCircle size={16} />
    }
  };

  const derivedStatus = node.stats?.health?.status || (node.status === 'not_mastered' ? 'weak' : node.status);
  const statusConf = STATUS_MAP[derivedStatus] || STATUS_MAP.unknown;

  // Mock Mistake Data for Level 2
  const mockMistakes = [
    { id: '1', question: '解方程 2x + 5 = 15', yourAns: 'x=6', correctAns: 'x=5', tag: '计算错误' },
    { id: '2', question: '3(x-2) = 9', yourAns: '3x-2=9', correctAns: '3x-6=9', tag: '去括号漏乘' },
    { id: '3', question: '-x = 5', yourAns: 'x=5', correctAns: 'x=-5', tag: '符号错误' },
  ];

  // Donut Chart Logic
  const distribution = node.stats?.health
    ? { mastered: node.stats.health.mastered, review: node.stats.health.review, weak: node.stats.health.weak }
    : (node.stats?.masteryDistribution || { mastered: 0, review: 0, weak: 0 });
  const totalRaw = node.stats?.health?.total ?? (distribution.mastered + distribution.review + distribution.weak);
  const total = totalRaw || 1; // avoid division by zero
  const hasData = totalRaw > 0;
  const healthScore = node.stats?.health?.score ?? node.stats?.masteryScore ?? 0;
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  
  // Calculate segments
  const segments = [
    { key: 'mastered', value: distribution.mastered, color: '#34C759' },
    { key: 'review', value: distribution.review, color: '#FFD60A' },
    { key: 'weak', value: distribution.weak, color: '#FF3B30' }
  ];

  let currentOffset = 0;

  return (
    <>
      <motion.div
        initial={{ x: '100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="absolute top-[66px] right-4 h-[580px] w-96 rounded-[32px] overflow-hidden z-50 shadow-2xl border border-white/20"
        style={{
          background: 'rgba(20, 20, 30, 0.6)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.1)'
        }}
      >
        <div className="relative w-full h-full flex flex-col">
          {/* Header (Shared) */}
          <div className="flex justify-between items-center p-6 pb-2">
              {viewLevel === 'mistakes' ? (
                  <button 
                      onClick={() => setViewLevel('overview')}
                      className="flex items-center gap-1 text-white/60 hover:text-white transition-colors text-sm font-bold"
                  >
                      <ChevronLeft size={16} /> 返回
                  </button>
              ) : (
                  <div className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center gap-1.5 ${statusConf.className}`}>
                      {statusConf.icon}
                      {statusConf.label}
                  </div>
              )}
              <button onClick={onClose} className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors">
                  <X size={20} />
              </button>
          </div>

          {/* Content Stack */}
          <div className="flex-1 relative overflow-hidden">
              <AnimatePresence mode="popLayout" initial={false} custom={viewLevel === 'mistakes' ? 1 : -1}>
                  
                  {/* LEVEL 1: OVERVIEW */}
                  {viewLevel === 'overview' && (
                      <motion.div
                          key="overview"
                          custom={-1}
                          initial={{ x: '-100%' }}
                          animate={{ x: 0 }}
                          exit={{ x: '-100%' }}
                          transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
                          className="absolute inset-0 px-6 overflow-y-auto no-scrollbar"
                      >
                          <h2 className="text-3xl font-black text-white mb-6 leading-tight">{node.label}</h2>
                          
                          {/* Cognitive Spectrum Dashboard */}
                          <div className="flex gap-4 mb-8 bg-white/5 rounded-3xl p-4 border border-white/5">
                            {/* Left: Cognitive Donut Chart */}
                            <div className="relative w-28 h-28 flex-shrink-0">
                                <svg width="100%" height="100%" viewBox="0 0 100 100" className="-rotate-90">
                                    {/* Background Circle */}
                                    <circle
                                      cx="50"
                                      cy="50"
                                      r={radius}
                                      fill="none"
                                      stroke="rgba(255,255,255,0.1)"
                                      strokeWidth="12"
                                    />
                                    
                                    {/* Segments */}
                                    {hasData &&
                                      segments.map((segment) => {
                                        const dash = (segment.value / total) * circumference;
                                        if (segment.value === 0) return null;

                                        const element = (
                                          <motion.circle
                                            key={segment.key}
                                            cx="50"
                                            cy="50"
                                            r={radius}
                                            fill="none"
                                            stroke={segment.color}
                                            strokeWidth="12"
                                            strokeDasharray={`${dash} ${circumference}`}
                                            strokeDashoffset={-currentOffset}
                                            strokeLinecap="round"
                                            initial={{ strokeDasharray: `0 ${circumference}` }}
                                            animate={{ strokeDasharray: `${dash} ${circumference}` }}
                                            transition={{ duration: 1, ease: 'easeOut' }}
                                          />
                                        );
                                        currentOffset += dash;
                                        return element;
                                      })}
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-3xl font-black text-white leading-none">
                                        {healthScore}
                                    </span>
                                    <span className="text-[9px] text-white/40 font-bold uppercase mt-0.5">健康分</span>
                                </div>
                            </div>

                            {/* Right: Key Metrics */}
                            <div className="flex-1 flex flex-col justify-center gap-2">
                                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-transparent w-full">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 rounded-lg bg-[#FF3B30]/20 text-[#FF3B30]">
                                            <AlertTriangle size={14} />
                                        </div>
                                        <div className="flex flex-col items-start">
                                            <span className="text-[10px] text-white/40 font-bold uppercase">待攻克</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="text-lg font-black text-[#FF3B30]">{distribution.weak}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-transparent w-full">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 rounded-lg bg-[#FFD60A]/20 text-[#FFD60A]">
                                            <RefreshCw size={14} />
                                        </div>
                                        <span className="text-[10px] text-white/40 font-bold uppercase">需复习</span>
                                    </div>
                                    <span className="text-lg font-black text-[#FFD60A]">{distribution.review}</span>
                                </div>

                                {!hasData && (
                                  <div className="text-xs text-white/50 mt-1">暂无做题记录</div>
                                )}
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="space-y-3 pb-8">
                              {/* Primary action per status */}
                              {node.status === 'unknown' && (
                                <button
                                  onClick={() => onAction && onAction('practice')}
                                  className="w-full py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-[#4F46E5] via-[#6366F1] to-[#22D3EE] shadow-[0_12px_30px_-12px_rgba(79,70,229,0.65)] border border-white/15 transition-all duration-180 active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                  <span className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
                                    <Rocket size={18} />
                                  </span>
                                  <span>开始探索</span>
                                </button>
                              )}

                              {node.status === 'exploring' && (
                                <button
                                  onClick={() => onAction && onAction('practice')}
                                  className="w-full py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-[#4F46E5] via-[#6366F1] to-[#22D3EE] shadow-[0_12px_30px_-12px_rgba(79,70,229,0.65)] border border-white/15 transition-all duration-180 active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                  <span className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
                                    <Rocket size={18} />
                                  </span>
                                  <span>开始探索</span>
                                </button>
                              )}

                              {(node.status === 'weak' || node.status === 'not_mastered') && (
                                <button
                                  onClick={() => onAction && onAction('practice')}
                                  className="w-full py-4 bg-gradient-to-r from-rose-500 to-orange-500 rounded-2xl font-bold text-white shadow-lg shadow-amber-500/30 active:scale-95 transition-transform flex items-center justify-center gap-2"
                                >
                                  <Target size={18} />
                                  <span>专项攻克</span>
                                </button>
                              )}

                              {node.status === 'reviewing' && (
                                <button
                                  onClick={() => onAction && onAction('practice')}
                                  className="w-full py-4 bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl font-bold text-white shadow-lg shadow-amber-500/30 active:scale-95 transition-transform flex items-center justify-center gap-2"
                                >
                                  <RefreshCw size={18} />
                                  <span>巩固强化</span>
                                </button>
                              )}

                              {node.status === 'mastered' && (
                                <button
                                  onClick={() => onAction && onAction('practice')}
                                  className="w-full py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-2xl font-bold text-white shadow-lg shadow-emerald-500/30 active:scale-95 transition-transform flex items-center justify-center gap-2"
                                >
                                  <Crown size={18} />
                                  <span>挑战高阶</span>
                                </button>
                              )}

                              {/* Secondary: My Question Bank */}
                              {node.status !== 'unknown' && (
                                <button
                                  onClick={() => setShowQuestionBank(true)}
                                  className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl font-bold text-white/70 hover:bg-white/10 active:scale-95 transition-all"
                                >
                                  我的题库
                                </button>
                              )}
                          </div>
                      </motion.div>
                  )}

                  {/* LEVEL 2: MISTAKES LIST */}
                  {viewLevel === 'mistakes' && (
                      <motion.div
                          key="mistakes"
                          custom={1}
                          initial={{ x: '100%' }}
                          animate={{ x: 0 }}
                          exit={{ x: '100%' }}
                          transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
                          className="absolute inset-0 px-6 overflow-y-auto no-scrollbar"
                      >
                          <h2 className="text-xl font-bold text-white mb-1">错题本</h2>
                          <p className="text-xs text-white/40 mb-6">{node.label} · 共 {mockMistakes.length} 题</p>

                          <div className="space-y-4 pb-8">
                              {mockMistakes.map((mistake, i) => (
                                  <div key={mistake.id} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                                      <div className="flex justify-between items-start mb-2">
                                          <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 text-[10px] font-bold border border-rose-500/30">{mistake.tag}</span>
                                          <span className="text-[10px] text-white/30">#{i+1}</span>
                                      </div>
                                      <div className="text-sm text-white/90 mb-3 font-medium">{mistake.question}</div>
                                      <div className="bg-black/30 rounded-lg p-2 text-xs space-y-1">
                                          <div className="flex gap-2">
                                              <span className="text-rose-400 font-bold">你的答案:</span>
                                              <span className="text-rose-200 line-through decoration-rose-400">{mistake.yourAns}</span>
                                          </div>
                                          <div className="flex gap-2">
                                              <span className="text-emerald-400 font-bold">正确答案:</span>
                                              <span className="text-emerald-200">{mistake.correctAns}</span>
                                          </div>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </motion.div>
                  )}
              </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* -- Modals are rendered here to overlay the DiagnosisCard -- */}
      {/* 1. Full Question Bank */}
      <QuestionBankModal 
        isOpen={showQuestionBank}
        onClose={() => setShowQuestionBank(false)}
        onSelectQuestion={(id) => setActiveQuizId(id)}
        title={`${node.label} · 题库`}
        subject={mapSubjectToQuestionBank(node.subject as any)}
      />

      {/* 2. Quick Quiz Popup */}
      <QuickQuizModal 
        questionId={activeQuizId}
        onClose={() => setActiveQuizId(null)}
        subject={mapSubjectToQuestionBank(node.subject as any)}
      />
    </>
  );
};

export default DiagnosisCard;