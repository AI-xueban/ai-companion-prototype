import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Play, Gift, Clock, Zap, CirclePlay } from 'lucide-react';

// Use same MapNode interface as parent, or import shared type
// Assuming simplified internal interface for this component based on usage
interface NodeDetailModalProps {
    node: any; // Using any for now to avoid tight coupling during extraction, in real app import MapNode
    onClose: () => void;
    onStart: () => void;
    onWatchVideo?: () => void;
    readOnly?: boolean;
}

export const NodeDetailModal: React.FC<NodeDetailModalProps> = ({
    node,
    onClose,
    onStart,
    onWatchVideo,
    readOnly = false,
}) => {
    // Portal target check - Target the specific app viewport to stay within "iPad" bounds
    // Fallback to modal-root or body if viewport not found (though it should be there)
    const [mounted, setMounted] = React.useState(false);
    
    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    const portalTarget = document.getElementById('app-viewport') || document.getElementById('modal-root') || document.body;

    return createPortal(
        <AnimatePresence>
            {node && (
                <>
                    {/* Backdrop - Absolute to fill the container */}
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/10 z-[100] backdrop-blur-sm"
                    />
                    
                    {/* Bottom Sheet Modal - Absolute positioning relative to container */}
                    <motion.div 
                        initial={{ y: '100%' }} 
                        animate={{ y: 0 }} 
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="absolute bottom-0 left-0 right-0 z-[101] flex flex-col pointer-events-none" 
                    >
                        {/* Actual Card Content */}
                        <div className="w-full bg-white rounded-t-[48px] shadow-[0_-20px_80px_rgba(0,0,0,0.1)] flex flex-col max-h-[min(60vh,520px)] min-h-[40vh] border-t border-white/80 pointer-events-auto pb-[env(safe-area-inset-bottom,0px)]">
                            <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mt-4 mb-2 shrink-0" />
                            
                            <button 
                                onClick={onClose} 
                                className="absolute top-6 right-5 sm:top-8 sm:right-8 z-10 p-2 rounded-full bg-slate-50 text-slate-400 hover:bg-slate-100 transition-colors"
                            >
                                <X size={20} />
                            </button>

                            {/* Scrollable Content Area */}
                            <div className="px-5 sm:px-10 py-6 sm:py-8 flex-1 overflow-y-auto no-scrollbar min-h-0">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-6 sm:mb-8 pr-10 sm:pr-0">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-3">
                                            {/* Smart Status Label - Replaces static nodeType labels */}
                                            {(() => {
                                                const statusConfig = {
                                                    mastered: { bg: 'bg-[#34C759]/10', text: 'text-[#34C759]', border: 'border-[#34C759]/20', label: '已掌握' },
                                                    reviewing: { bg: 'bg-[#FFD60A]/10', text: 'text-[#FFD60A]', border: 'border-[#FFD60A]/20', label: '需复习' },
                                                    weak: { bg: 'bg-[#FF3B30]/10', text: 'text-[#FF3B30]', border: 'border-[#FF3B30]/20', label: '未掌握' },
                                                    exploring: { bg: 'bg-[#0A84FF]/10', text: 'text-[#0A84FF]', border: 'border-[#0A84FF]/20', label: '探索中' },
                                                    unknown: { bg: 'bg-slate-100', text: 'text-slate-400', border: 'border-slate-200', label: '待探索' },
                                                    not_mastered: { bg: 'bg-[#FF3B30]/10', text: 'text-[#FF3B30]', border: 'border-[#FF3B30]/20', label: '未掌握' } // Legacy fallback
                                                };
                                                // Fallback to unknown if status not found
                                                const conf = statusConfig[node.status as keyof typeof statusConfig] || statusConfig.unknown;
                                                
                                                return (
                                                    <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider border shadow-sm ${conf.bg} ${conf.text} ${conf.border}`}>
                                                        {conf.label}
                                                    </span>
                                                );
                                            })()}
                                            
                                            {/* Optional: Keep Bonus/Boss tags if really needed, but secondary */}
                                            {node.nodeType === 'chest' && (
                                                <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-amber-50 text-amber-600 border border-amber-200 uppercase">BONUS</span>
                                            )}
                                        </div>
                                        <h2 className="text-2xl sm:text-3xl font-black leading-tight mb-2 text-slate-800 break-words">
                                            {node.taskTitle || node.title}
                                        </h2>
                                        {node.nodeType !== 'chest' && (
                                            <div className="flex items-center gap-1.5">
                                                {[1, 2, 3].map((s: number) => (
                                                    <Star key={s} size={16} fill={s <= (node.stars || 0) ? "#FBBF24" : "#F1F5F9"} className={s <= (node.stars || 0) ? "text-yellow-400" : "text-slate-200"} />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    
                                    {readOnly ? (
                                      <div className="w-full sm:w-24 h-16 sm:h-24 rounded-[24px] sm:rounded-[32px] bg-emerald-50 border-2 border-emerald-200 text-emerald-600 flex flex-row sm:flex-col items-center justify-center gap-2 sm:gap-1 shrink-0">
                                        <Star size={24} className="sm:hidden" fill="currentColor" />
                                        <Star size={28} className="hidden sm:block" fill="currentColor" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">
                                          {node.status === 'completed' ? '已通关' : node.status === 'current' ? '进行中' : '未解锁'}
                                        </span>
                                      </div>
                                    ) : node.status === 'completed' ? (
                                      <div className="flex flex-row sm:flex-col gap-2 shrink-0 w-full sm:w-auto">
                                        {onWatchVideo && (
                                          <button
                                            type="button"
                                            onClick={onWatchVideo}
                                            className="flex-1 sm:flex-none sm:w-24 h-14 sm:h-[4.25rem] rounded-2xl sm:rounded-[28px] bg-indigo-600 text-white flex flex-row sm:flex-col items-center justify-center gap-2 sm:gap-1 shadow-xl shadow-indigo-300/40 hover:scale-[1.02] active:scale-95 transition-transform"
                                          >
                                            <CirclePlay size={22} className="sm:hidden" />
                                            <CirclePlay size={28} className="hidden sm:block" />
                                            <span className="text-[10px] font-black tracking-widest">看视频</span>
                                          </button>
                                        )}
                                        <button
                                          type="button"
                                          onClick={onStart}
                                          className="flex-1 sm:flex-none sm:w-24 h-14 sm:h-[4.25rem] rounded-2xl sm:rounded-[28px] bg-slate-900 text-white flex flex-row sm:flex-col items-center justify-center gap-2 sm:gap-1 shadow-2xl shadow-slate-300 hover:scale-[1.02] active:scale-95 transition-transform"
                                        >
                                          <Play size={22} className="sm:hidden" fill="currentColor" />
                                          <Play size={28} className="hidden sm:block" fill="currentColor" />
                                          <span className="text-[10px] font-black uppercase tracking-widest">回顾</span>
                                        </button>
                                      </div>
                                    ) : (
                                    <button 
                                        onClick={onStart}
                                        className="group w-full sm:w-24 h-14 sm:h-24 rounded-2xl sm:rounded-[32px] bg-slate-900 text-white flex flex-row sm:flex-col items-center justify-center gap-2 sm:gap-1 shadow-2xl shadow-slate-300 hover:scale-[1.02] active:scale-95 transition-transform"
                                    >
                                        {node.nodeType === 'chest' ? <Gift size={28} className="text-amber-400 sm:hidden" /> : <Play size={28} className="sm:hidden" fill="currentColor" />}
                                        {node.nodeType === 'chest' ? <Gift size={32} className="text-amber-400 hidden sm:block group-hover:rotate-12 transition-transform" /> : <Play size={32} className="hidden sm:block" fill="currentColor" />}
                                        <span className="text-[10px] font-black uppercase tracking-widest sm:mt-1">开始</span>
                                    </button>
                                    )}
                                </div>

                                <div className="p-6 rounded-[32px] bg-slate-50 border border-slate-100 mb-8">
                                    <p className="text-sm font-bold text-slate-600 leading-relaxed mb-4">
                                        {node.description || '通关后可获得金币与神秘碎片。'}
                                    </p>
                                    {node.learningGoals && node.learningGoals.length > 0 && (
                                        <div className="mt-4">
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Core Objectives</h4>
                                            <div className="space-y-2">
                                                {node.learningGoals.map((goal: string, index: number) => (
                                                    <div key={index} className="flex items-center gap-3 text-xs text-slate-600 font-bold bg-white/50 p-2 rounded-xl border border-white">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                                                        <span>{goal}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {node.nodeType !== 'chest' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col items-center">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Duration</span>
                                            <div className="flex items-center gap-2">
                                                <Clock size={16} className="text-slate-400" />
                                                <span className="text-xl font-black text-slate-800">
                                                    {node.durationMinutes ? `${node.durationMinutes}` : (node.duration?.replace(' min', '') || '15')}<span className="text-xs font-bold text-slate-400 ml-1">min</span>
                                                </span>
                                            </div>
                                        </div>
                                        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col items-center">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">XP Bonus</span>
                                            <div className="flex items-center gap-2">
                                                <Zap size={16} className="text-indigo-400" fill="currentColor" />
                                                <span className="text-xl font-black text-indigo-500">
                                                    +{node.nodeType === 'boss' ? '200' : '50'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        portalTarget
    );
};

