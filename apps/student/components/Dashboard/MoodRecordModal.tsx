import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { MoodOption } from '../../types';

// --- Configuration ---

export type MoodCategory = 'high' | 'low' | 'complex';

interface CategoryConfig {
  id: MoodCategory;
  label: string;
  icon: string;
  gradient: string; // 选中态的高光渐变
}

export const CATEGORIES: CategoryConfig[] = [
  { id: 'high', label: '能量', icon: '☀️', gradient: 'from-orange-400/20 to-yellow-400/20' },
  { id: 'low', label: '充电', icon: '🌧️', gradient: 'from-blue-400/20 to-indigo-400/20' },
  { id: 'complex', label: '内心', icon: '🌪️', gradient: 'from-purple-400/20 to-pink-400/20' },
];

export const MOOD_DATA: Record<MoodCategory, MoodOption[]> = {
  high: [
    { value: 'happy', label: '开心', scientificLabel: '喜悦', icon: '😆', color: 'bg-yellow-400' },
    { value: 'expect', label: '期待', scientificLabel: '希望', icon: '🥳', color: 'bg-orange-300' },
    { value: 'confident', label: '自信', scientificLabel: '自豪', icon: '😎', color: 'bg-blue-400' },
    { value: 'fire', label: '燃', scientificLabel: '振奋', icon: '🔥', color: 'bg-red-500' },
    { value: 'satisfied', label: '满足', scientificLabel: '安适', icon: '🥰', color: 'bg-pink-300' },
    { value: 'focus', label: '专注', scientificLabel: '投入', icon: '🧠', color: 'bg-purple-400' },
    { value: 'healed', label: '治愈', scientificLabel: '平和', icon: '🍃', color: 'bg-green-400' },
    { value: 'done', label: '搞定', scientificLabel: '成就感', icon: '👌', color: 'bg-emerald-400' },
  ],
  low: [
    { value: 'low_battery', label: '电量低', scientificLabel: '疲惫', icon: '🪫', color: 'bg-gray-400' },
    { value: 'cloudy', label: '多云', scientificLabel: '低落', icon: '☁️', color: 'bg-blue-300' },
    { value: 'tense', label: '紧绷', scientificLabel: '焦虑', icon: '🤯', color: 'bg-red-300' },
    { value: 'fuming', label: '冒烟', scientificLabel: '愤怒', icon: '😡', color: 'bg-red-500' },
    { value: 'standby', label: '待机', scientificLabel: '麻木', icon: '😶', color: 'bg-gray-300' },
    { value: 'nervous', label: '忐忑', scientificLabel: '担忧', icon: '💓', color: 'bg-pink-400' },
    { value: 'comfort', label: '求安慰', scientificLabel: '脆弱', icon: '🥺', color: 'bg-yellow-200' },
    { value: 'quiet', label: '想静静', scientificLabel: '孤独', icon: '🤫', color: 'bg-indigo-300' },
  ],
  complex: [
    { value: 'speechless', label: '离谱', scientificLabel: '震惊', icon: '🙄', color: 'bg-gray-300' },
    { value: 'invisible', label: '想隐身', scientificLabel: '尴尬', icon: '🫣', color: 'bg-gray-400' },
    { value: 'cpu_burn', label: 'CPU烧了', scientificLabel: '困惑', icon: '😵‍💫', color: 'bg-purple-300' },
    { value: 'melon', label: '吃瓜', scientificLabel: '好奇', icon: '🍉', color: 'bg-green-300' },
    { value: 'aggrieved', label: '委屈', scientificLabel: '不公', icon: '💧', color: 'bg-blue-300' },
    { value: 'introvert', label: 'i人时刻', scientificLabel: '害羞', icon: '🤐', color: 'bg-gray-300' },
    { value: 'tangled', label: '纠结', scientificLabel: '矛盾', icon: '⚖️', color: 'bg-yellow-300' },
    { value: 'hard', label: '有点难', scientificLabel: '挫败', icon: '🧩', color: 'bg-blue-400' },
  ]
};

interface MoodRecordModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedMoods: MoodOption[];
    onMoodToggle: (mood: MoodOption) => void;
}

export const MoodRecordModal: React.FC<MoodRecordModalProps> = ({ 
    isOpen, 
    onClose, 
    selectedMoods, 
    onMoodToggle 
}) => {
    const [activeTab, setActiveTab] = useState<MoodCategory>('high');
    const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

    useEffect(() => {
        setPortalTarget(
            document.getElementById('app-viewport') ||
            document.getElementById('modal-root') ||
            null
        );
    }, []);

    if (!portalTarget) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* 点击外部关闭区域 */}
                    <div 
                        onClick={onClose}
                        data-modal-backdrop="true"
                        className="fixed inset-0 z-[980] cursor-default pointer-events-auto"
                    />
                    
                    {/* 
                       Popover Card 
                       设计语言: iOS Glassmorphism
                       定位: 左上角附近，带有轻微的 top 偏移
                    */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.8, y: -20, filter: "blur(10px)" }}
                        animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, scale: 0.8, y: -20, filter: "blur(10px)" }}
                        transition={{ 
                            type: "spring", 
                            stiffness: 350, 
                            damping: 25,
                            mass: 0.8 
                        }}
                        data-modal-surface="true"
                        className="absolute top-[65px] left-[140px] w-[320px] origin-top-left z-[990] pointer-events-auto"
                    >
                        {/* 玻璃容器本体 */}
                        <div className="relative overflow-hidden rounded-[24px] bg-[#1c1c1e] border border-white/10 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5)] ring-1 ring-white/5">
                            
                            {/* 顶部装饰光 - 增加立体感 */}
                            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                            {/* Header & Tabs Area */}
                            <div className="p-4 pb-2">
                                {/* iOS Style Segmented Control */}
                                <div className="flex bg-black/20 p-1 rounded-xl relative">
                                    {/* 滑动背景块 */}
                                    <motion.div 
                                        className="absolute top-1 bottom-1 bg-white/10 rounded-[10px] shadow-sm border border-white/5"
                                        layoutId="activeTabBackground"
                                        initial={false}
                                        animate={{
                                            left: activeTab === 'high' ? '4px' : activeTab === 'low' ? '33.3%' : '66.6%',
                                            width: 'calc(33.3% - 5px)',
                                            x: activeTab === 'high' ? 0 : activeTab === 'low' ? 2 : 4
                                        }}
                                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    />
                                    
                                    {CATEGORIES.map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setActiveTab(cat.id)}
                                            className="flex-1 relative z-10 py-1.5 flex items-center justify-center gap-1.5 text-xs font-bold transition-colors duration-200"
                                        >
                                            <span className="text-sm filter drop-shadow-sm">{cat.icon}</span>
                                            <span className={activeTab === cat.id ? 'text-white' : 'text-white/40'}>
                                                {cat.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Content Grid */}
                            <div className="px-4 pb-4 pt-1 h-[280px] overflow-y-auto custom-scrollbar">
                                <motion.div 
                                    key={activeTab}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="grid grid-cols-4 gap-2"
                                >
                                    {MOOD_DATA[activeTab].map((mood, idx) => {
                                        const isSelected = selectedMoods.some(m => m.value === mood.value);
                                        return (
                                            <motion.button
                                                key={mood.value}
                                                layout
                                                onClick={() => onMoodToggle(mood)}
                                                whileTap={{ scale: 0.9 }}
                                                className="group relative flex flex-col items-center gap-1.5 p-1"
                                            >
                                                {/* Icon Container - Squircle Shape */}
                                                <div className={`
                                                    relative w-14 h-14 rounded-[18px] flex items-center justify-center text-2xl transition-all duration-300
                                                    ${isSelected 
                                                        ? 'bg-white/10 shadow-[0_0_15px_rgba(255,255,255,0.15)] ring-1 ring-white/20' 
                                                        : 'bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10'
                                                    }
                                                `}>
                                                    {/* 背景光晕 (选中时出现) */}
                                                    {isSelected && (
                                                        <motion.div 
                                                            layoutId={`glow-${mood.value}`}
                                                            className={`absolute inset-0 rounded-[18px] opacity-20 ${mood.color}`}
                                                        />
                                                    )}
                                                    
                                                    {/* 图标 */}
                                                    <span className={`relative z-10 transform transition-transform duration-300 ${isSelected ? 'scale-110' : 'group-hover:scale-110'}`}>
                                                        {mood.icon}
                                                    </span>

                                                    {/* 选中时的对号角标 - iOS 风格 */}
                                                    <AnimatePresence>
                                                        {isSelected && (
                                                            <motion.div 
                                                                initial={{ scale: 0 }}
                                                                animate={{ scale: 1 }}
                                                                exit={{ scale: 0 }}
                                                                className="absolute -top-1 -right-1 w-5 h-5 bg-brand text-white rounded-full flex items-center justify-center shadow-lg ring-2 ring-[#1c1c1e] z-20"
                                                            >
                                                                <Check size={10} strokeWidth={4} />
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>

                                                {/* Label */}
                                                <span className={`text-[10px] font-medium tracking-wide transition-colors ${isSelected ? 'text-white' : 'text-white/40'}`}>
                                                    {mood.label}
                                                </span>
                                            </motion.button>
                                        );
                                    })}
                                </motion.div>
                            </div>
                            
                            {/* Footer Status - Minimalist */}
                            {selectedMoods.length > 0 && (
                                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#1c1c1e] to-transparent pointer-events-none flex justify-center items-end pb-2">
                                     <div className="px-3 py-0.5 rounded-full bg-brand/20 border border-brand/30 backdrop-blur-md">
                                        <span className="text-[10px] font-bold text-brand-light">
                                            已记录 {selectedMoods.length} 个心情
                                        </span>
                                     </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        portalTarget
    );
};
