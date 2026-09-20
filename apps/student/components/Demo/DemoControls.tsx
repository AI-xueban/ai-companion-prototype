import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, User, Baby, X, ChevronRight, LayoutDashboard, Building2, RotateCcw, CheckCircle2, Trophy, Users, Sparkles } from 'lucide-react';
import { UserPersona } from '../../types';
import type { DonationStageStatus } from '../../data/charityStage';

interface DemoControlsProps {
    onSwitchPersona: (type: UserPersona, calibrated?: boolean, grade?: string) => void;
    onSwitchMode: (mode: 'student' | 'teacher' | 'internal') => void;
    onJumpToMap: () => void;
    currentMode: 'student' | 'teacher' | 'internal';
    onJumpToSubject?: (subject: 'math' | 'chinese' | 'english') => void;
    onJumpToQuizResult?: () => void;
    onJumpToSteppingQuiz?: (subject?: 'math' | 'chinese' | 'english') => void;
    onDemoVideoReward?: () => void;
    onDemoDailyConquerReward?: () => void;
    onSetCharityStageStatus?: (status: DonationStageStatus) => void;
    onResetDemoData?: () => void;
    onDemoLeagueSparse?: () => void;
    onDemoAchievement?: (achievementId: string) => void;
}

export const DemoControls: React.FC<DemoControlsProps> = ({ 
    onSwitchPersona, 
    onSwitchMode,
    onJumpToMap,
    currentMode,
    onJumpToSubject,
    onJumpToQuizResult,
    onJumpToSteppingQuiz,
    onDemoVideoReward,
    onDemoDailyConquerReward,
    onSetCharityStageStatus,
    onResetDemoData,
    onDemoLeagueSparse,
    onDemoAchievement,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [resetComplete, setResetComplete] = useState(false);

    const handlePersonaClick = (p: UserPersona, calibrated = false, grade?: string) => {
        onSwitchPersona(p, calibrated, grade);
        setIsOpen(false);
    };

    const handleModeSwitch = (mode: 'student' | 'teacher' | 'internal') => {
        onSwitchMode(mode);
        setIsOpen(false);
    };

    const handleResetDemoData = () => {
        onResetDemoData?.();
        setResetComplete(true);
        window.setTimeout(() => setResetComplete(false), 1800);
    };

    if (typeof document === 'undefined') return null;

    return createPortal(
        <div className="fixed bottom-6 right-6 z-[9999] pointer-events-auto font-sans">
            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="absolute bottom-14 right-0 bg-gray-900/95 backdrop-blur-xl border border-white/10 p-5 rounded-2xl shadow-2xl w-80 flex flex-col gap-5 max-h-[80vh] overflow-y-auto no-scrollbar"
                    >
                        <div className="flex justify-between items-center border-b border-white/10 pb-3">
                            <h3 className="text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                                <Settings size={14} className="text-brand-light" />
                                演示控制台
                            </h3>
                            <button type="button" onClick={() => setIsOpen(false)} aria-label="关闭演示控制台" className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white transition-colors"><X size={16} /></button>
                        </div>

                        <div className="p-1 bg-white/10 rounded-xl grid grid-cols-3 gap-1">
                            <button 
                                type="button"
                                onClick={() => handleModeSwitch('student')}
                                disabled={currentMode === 'student'}
                                className={`py-2 text-[11px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1 ${
                                    currentMode === 'student' 
                                        ? 'bg-brand text-white shadow-sm cursor-default' 
                                        : 'text-gray-400 hover:bg-white/10 hover:text-white'
                                }`}
                            >
                                <User size={12} /> 学生端
                            </button>
                            <button 
                                type="button"
                                onClick={() => handleModeSwitch('teacher')}
                                disabled={currentMode === 'teacher'}
                                className={`py-2 text-[11px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1 ${
                                    currentMode === 'teacher'
                                        ? 'bg-brand text-white shadow-sm cursor-default' 
                                        : 'text-gray-400 hover:bg-white/10 hover:text-white'
                                }`}
                            >
                                <LayoutDashboard size={12} /> 教师端
                            </button>
                            <button 
                                type="button"
                                onClick={() => handleModeSwitch('internal')}
                                disabled={currentMode === 'internal'}
                                className={`py-2 text-[11px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1 ${
                                    currentMode === 'internal'
                                        ? 'bg-brand text-white shadow-sm cursor-default' 
                                        : 'text-gray-400 hover:bg-white/10 hover:text-white'
                                }`}
                            >
                                <Building2 size={12} /> 内部管理
                            </button>
                        </div>

                        {/* Scenario Switcher */}
                        <div className="space-y-3 pt-2 border-t border-white/10">
                            {onResetDemoData ? (
                              <button
                                type="button"
                                onClick={handleResetDemoData}
                                className="w-full flex items-center gap-3 p-3 rounded-xl bg-slate-500/10 hover:bg-slate-500/20 border border-white/10 transition-all group"
                              >
                                <div className="w-8 h-8 rounded-lg bg-slate-700 text-white flex items-center justify-center shrink-0">
                                  {resetComplete ? <CheckCircle2 size={18} /> : <RotateCcw size={18} />}
                                </div>
                                <div className="flex-1 text-left">
                                  <div className="text-white text-xs font-bold">
                                    {resetComplete ? '基准数据已恢复' : '重置演示数据'}
                                  </div>
                                  <div className="text-gray-400 text-[10px]">恢复普通学生 · 清除本地进度</div>
                                </div>
                              </button>
                            ) : null}

                            <button 
                                onClick={() => handlePersonaClick('newbie')}
                                className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all group"
                            >
                                <div className="w-8 h-8 rounded-lg bg-green-500/20 text-green-400 flex items-center justify-center shrink-0">
                                    <Baby size={18} />
                                </div>
                                <div className="flex-1 text-left">
                                    <div className="text-white text-xs font-bold">我是萌新</div>
                                    <div className="text-gray-500 text-[10px]">0数据 · 直达首页 · 联赛未解锁</div>
                                </div>
                                <ChevronRight size={14} className="text-gray-600 group-hover:text-white" />
                            </button>

                            <button
                                onClick={() => handlePersonaClick('average', false, '七年级')}
                                className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all group"
                            >
                                <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                                    <User size={18} />
                                </div>
                                <div className="flex-1 text-left">
                                    <div className="text-white text-xs font-bold">初中七年级学生</div>
                                    <div className="text-gray-500 text-[10px]">Level 5 · 正常数据流</div>
                                </div>
                                <ChevronRight size={14} className="text-gray-600 group-hover:text-white" />
                            </button>
                        </div>

                        <div className="space-y-3 pt-2 border-t border-white/10">
                            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                                <Sparkles size={11} className="text-amber-300" />
                                勋章动效演示
                            </p>
                            <p className="text-gray-400 text-[10px] leading-relaxed">达成后立即播放动效；点击“收下勋章”才会点亮我的星迹。</p>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { id: 'a1', icon: '🌅', label: '早起鸟' },
                                    { id: 'a2', icon: '📐', label: '数学之星' },
                                    { id: 'a3', icon: '🧘', label: '专注大师' },
                                ].map((achievement) => (
                                    <button
                                        key={achievement.id}
                                        type="button"
                                        onClick={() => {
                                            onDemoAchievement?.(achievement.id);
                                            setIsOpen(false);
                                        }}
                                        className="flex min-h-16 flex-col items-center justify-center rounded-xl border border-amber-300/20 bg-amber-400/10 px-1 text-center transition-colors hover:bg-amber-400/20"
                                    >
                                        <span className="text-lg leading-none">{achievement.icon}</span>
                                        <span className="mt-1 text-[10px] font-bold text-white">{achievement.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 星光学榜·状态演示 */}
                        <div className="space-y-3 pt-2 border-t border-white/10">
                            <p className="text-gray-500 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                                <Trophy size={11} className="text-amber-400/70" />
                                星光学榜 · 状态 C 演示
                            </p>
                            <button
                                onClick={() => {
                                    onDemoLeagueSparse?.();
                                    setIsOpen(false);
                                }}
                                className="w-full flex items-center gap-3 p-3 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 hover:border-indigo-400/50 transition-all group"
                            >
                                <div className="w-8 h-8 rounded-lg bg-indigo-500/25 text-indigo-300 flex items-center justify-center shrink-0">
                                    <Users size={18} />
                                </div>
                                <div className="flex-1 text-left">
                                    <div className="text-white text-xs font-bold">已获XP · 本周暂未开启</div>
                                    <div className="text-gray-400 text-[10px]">年级不足19人 · 下周自动上榜</div>
                                </div>
                                <ChevronRight size={14} className="text-gray-400 group-hover:text-white" />
                            </button>
                            <p className="text-gray-600 text-[9px] leading-relaxed">
                                状态 A（未解锁）与 B（已上榜）见上方「我是萌新 / 初中七年级学生」入口。
                            </p>
                        </div>

                    </motion.div>
                )}
            </AnimatePresence>

            <button 
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                aria-label={isOpen ? '关闭演示控制台' : '打开演示控制台'}
                aria-expanded={isOpen}
                className={`flex items-center gap-2 pl-4 pr-5 py-3 rounded-full shadow-2xl transition-all border-2 border-gray-900 text-base font-bold ${isOpen ? 'bg-brand text-white scale-105' : 'bg-gray-800 text-white hover:bg-gray-700 animate-pulse-slow'}`}
            >
                <Settings size={28} className={isOpen ? "animate-spin-slow" : ""} />
                <span className="whitespace-nowrap tracking-wide">{isOpen ? '收起控制台' : '演示控制台'}</span>
            </button>
        </div>,
        document.body,
    );
};
