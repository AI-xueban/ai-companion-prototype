
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles, GraduationCap, ChevronDown, Check } from 'lucide-react';
import { InteractiveLumi } from '../LumiSpace/InteractiveLumi';

import boyAvatar from '../../assets/boy_v0.1-removebg-preview.png';
import girlAvatar from '../../assets/girl_v0.1-removebg-preview.png';

interface SplashScreenProps {
  onComplete: (nickname: string, grade: string) => void;
}

const GRADES = [
    { label: '五年级', value: '5', sub: '小学高年级' },
    { label: '六年级', value: '6', sub: '小学高年级' },
    { label: '七年级', value: '7', sub: '初中阶段' },
    { label: '八年级', value: '8', sub: '初中阶段' },
    { label: '九年级', value: '9', sub: '初中阶段' },
];

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [nickname, setNickname] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const [selectedAvatar, setSelectedAvatar] = useState<'boy' | 'girl' | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [step, setStep] = useState<'intro' | 'setup'>('intro');

  const handleStart = () => {
    setStep('setup');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nickname.trim() && selectedGrade && selectedAvatar) {
      const gradeLabel = GRADES.find(g => g.value === selectedGrade)?.label || '';
      onComplete(nickname.trim(), gradeLabel);
    }
  };

  return (
    <div className="w-full h-full bg-gray-900 flex flex-col items-center justify-center relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand/10 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center w-full max-w-sm px-6">
        
        {/* Step 1: Intro (Post-Login) */}
        <AnimatePresence mode="wait">
            {step === 'intro' ? (
                <motion.div
                    key="intro"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9, y: -20 }}
                    className="flex flex-col items-center text-center"
                >
                    <div className="mb-8 relative">
                        <InteractiveLumi size="lg" variant="hero" emotion="happy" />
                        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-green-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg border border-gray-900 z-20">
                            已连接
                        </div>
                    </div>
                    
                    <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">登录成功</h1>
                    <p className="text-gray-400 font-medium text-sm leading-relaxed mb-10 max-w-[240px]">
                        欢迎进入 学习空间 <br/>首次登录，让我们先完善一下你的档案。
                    </p>

                    <button 
                        onClick={handleStart}
                        className="group relative px-8 py-3.5 bg-brand hover:bg-brand-light text-white rounded-2xl font-bold text-base shadow-lg shadow-brand/20 transition-all flex items-center gap-2"
                    >
                        开启设置 <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </motion.div>
            ) : (
                /* Step 2: Setup (Refactored per PRD) */
                <motion.div
                    key="setup"
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full"
                >
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-black text-white mb-1 tracking-tight">同学，你好！</h2>
                        <p className="text-gray-400 text-xs font-medium">请告诉 小晤 怎么称呼你？</p>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        {/* 0. Character Selection */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">分身 · Character</label>
                            <div className="flex gap-4">
                                {[
                                    { id: 'boy', img: boyAvatar, label: '男生' },
                                    { id: 'girl', img: girlAvatar, label: '女生' }
                                ].map((item) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() => setSelectedAvatar(item.id as 'boy' | 'girl')}
                                        className={`flex-1 relative aspect-[4/3] rounded-[24px] border-2 transition-all overflow-hidden bg-white/5 flex flex-col items-center justify-center p-2 ${
                                            selectedAvatar === item.id 
                                            ? 'border-brand bg-brand/10 scale-[1.02] shadow-lg shadow-brand/20' 
                                            : 'border-white/10 grayscale hover:grayscale-0'
                                        }`}
                                    >
                                        <img src={item.img} alt={item.label} className="w-full h-full object-contain" />
                                        <div className={`absolute bottom-2 right-2 w-5 h-5 rounded-full flex items-center justify-center ${
                                            selectedAvatar === item.id ? 'bg-brand' : 'bg-white/10'
                                        }`}>
                                            {selectedAvatar === item.id && <Check size={12} className="text-white" />}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 1. Name Input */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">昵称 · Nickname</label>
                            <div className="relative group">
                                <input 
                                    type="text" 
                                    value={nickname}
                                    onChange={(e) => setNickname(e.target.value)}
                                    placeholder="输入你的昵称..."
                                    className="w-full bg-white/5 border border-white/10 rounded-[20px] px-5 py-3.5 text-lg font-bold text-white outline-none focus:border-brand/50 focus:bg-white/10 transition-all placeholder:text-gray-700"
                                    autoComplete="off"
                                    autoFocus
                                />
                                <Sparkles className="absolute right-4 top-1/2 -translate-y-1/2 text-brand opacity-0 group-focus-within:opacity-100 transition-opacity w-5 h-5" />
                            </div>
                        </div>

                        {/* 2. Grade Selection (Local Dropdown) */}
                        <div className="space-y-2 relative">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-1">
                                <GraduationCap size={12} /> 年级 · Grade
                            </label>
                            
                            {/* Trigger */}
                            <button
                                type="button"
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className={`w-full flex items-center justify-between px-5 py-3.5 bg-white/5 border rounded-[20px] transition-all ${
                                    isDropdownOpen ? 'border-brand/50 bg-white/10' : 'border-white/10'
                                }`}
                            >
                                <span className={`text-lg font-bold ${selectedGrade ? 'text-white' : 'text-gray-600'}`}>
                                    {selectedGrade ? GRADES.find(g => g.value === selectedGrade)?.label : '选择当前年级'}
                                </span>
                                <ChevronDown size={20} className={`text-gray-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Local Expanded List */}
                            <AnimatePresence>
                                {isDropdownOpen && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="absolute bottom-full left-0 right-0 z-50 bg-gray-800 border border-white/10 rounded-[20px] overflow-hidden flex flex-col mb-2 shadow-2xl backdrop-blur-md"
                                    >
                                        {GRADES.map((grade) => (
                                            <button
                                                key={grade.value}
                                                type="button"
                                                onClick={() => {
                                                    setSelectedGrade(grade.value);
                                                    setIsDropdownOpen(false);
                                                }}
                                                className={`w-full px-5 py-3 text-left flex items-center justify-between transition-colors border-b border-white/5 last:border-0 hover:bg-white/10 ${
                                                    selectedGrade === grade.value ? 'bg-brand/20' : ''
                                                }`}
                                            >
                                                <div>
                                                    <div className="text-white font-bold text-sm">{grade.label}</div>
                                                    <div className="text-[10px] text-gray-500 font-bold uppercase">{grade.sub}</div>
                                                </div>
                                                {selectedGrade === grade.value && <Check size={16} className="text-brand" />}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <motion.button 
                            layout
                            type="submit"
                            disabled={!nickname.trim() || !selectedGrade || !selectedAvatar}
                            className="w-full bg-white text-brand-dark hover:bg-gray-100 py-3.5 rounded-[20px] font-black text-lg shadow-xl disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 mt-2"
                        >
                            完成并校准进度
                        </motion.button>
                    </form>
                </motion.div>
            )}
        </AnimatePresence>

      </div>
    </div>
  );
};
