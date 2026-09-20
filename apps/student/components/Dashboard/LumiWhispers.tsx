import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Sparkles, CheckCircle2, Star, Quote, X, MessageCircle, Heart, ThumbsUp, PartyPopper } from 'lucide-react';

// --- Types ---
export interface LumiMessage {
    id: string;
    type: 'note' | 'mission' | 'system';
    title: string;
    content: string;
    timestamp: string;
    read: boolean;
    reaction?: 'like' | 'love' | 'party' | null;
    reward?: string;
}

export interface DailyQuote {
    content: string;
    author: string;
    tag: string;
}

// --- Mock Data ---
const INITIAL_MESSAGES: LumiMessage[] = [
    {
        id: '1',
        type: 'note',
        title: '小晤 的观察日记',
        content: '刚才的专注挑战你坚持了25分钟！我注意到你在最后阶段有点分心，但还是坚持下来了，为你骄傲！🌟',
        timestamp: '10分钟前',
        read: false,
    },
    {
        id: '2',
        type: 'mission',
        title: '每日目标达成',
        content: '完成了3个数学练习任务，获得【逻辑小能手】徽章碎片 x1',
        timestamp: '1小时前',
        read: false,
        reward: '50 XP'
    }
];

const DAILY_QUOTE: DailyQuote = {
    content: "学习不是为了填满水桶，而是为了点燃火种。",
    author: "叶芝 (W.B. Yeats)",
    tag: "每日灵感"
};

// --- Component ---
interface LumiWhispersProps {
    isOpen: boolean;
    onClose: () => void;
    anchorRef?: React.RefObject<HTMLElement>;
}

export const LumiWhispers: React.FC<LumiWhispersProps> = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState<'all' | 'note' | 'mission'>('all');
    const [messages, setMessages] = useState<LumiMessage[]>(INITIAL_MESSAGES);
    const [showQuote, setShowQuote] = useState(false);

    // 过滤逻辑：如果没有未读/历史消息，则显示 Quote
    // 这里演示逻辑：如果用户清空了消息，展示Quote
    
    const filteredMessages = activeTab === 'all' 
        ? messages 
        : messages.filter(m => m.type === activeTab);

    const handleReaction = (id: string, reaction: LumiMessage['reaction']) => {
        setMessages(prev => prev.map(msg => {
            if (msg.id === id) {
                // Toggle reaction
                return { ...msg, reaction: msg.reaction === reaction ? null : reaction, read: true };
            }
            return msg;
        }));
    };

    const handleDismiss = (id: string) => {
         setMessages(prev => prev.filter(msg => msg.id !== id));
    };

    // 检查是否为空状态 (仅演示用，实际可能根据 filteredMessages.length === 0 判断)
    const isEmpty = messages.length === 0;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop (Invisible to handle outside clicks, but scoped to prevent blocking too much if needed. 
                        Actually standard popovers use a transparent fixed overlay) */}
                    <div className="fixed inset-0 z-40" onClick={onClose} />

                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute top-full right-0 mt-3 w-[360px] z-50 origin-top-right"
                    >
                        <div className="bg-slate-900/90 backdrop-blur-3xl border border-white/20 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)] overflow-hidden flex flex-col max-h-[500px]">
                            
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 pb-2 border-b border-white/5 bg-white/5">
                                <div className="flex items-center gap-2">
                                    <Sparkles size={16} className="text-yellow-400" />
                                    <h3 className="text-white font-bold text-sm tracking-wide">心语驿站</h3>
                                </div>
                                {/* Tabs */}
                                <div className="flex bg-black/20 rounded-lg p-0.5">
                                    {(['all', 'note', 'mission'] as const).map(tab => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab)}
                                            className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                                                activeTab === tab 
                                                ? 'bg-white/10 text-white shadow-sm' 
                                                : 'text-white/40 hover:text-white/70'
                                            }`}
                                        >
                                            {tab === 'all' ? '全部' : tab === 'note' ? '小晤' : '任务'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto min-h-[200px] p-2 custom-scrollbar">
                                {isEmpty ? (
                                    /* Empty State: Daily Quote */
                                    <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-4">
                                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-2">
                                            <Quote size={20} className="text-white/30" />
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-white/90 font-serif italic text-lg leading-relaxed">
                                                "{DAILY_QUOTE.content}"
                                            </p>
                                            <div className="flex items-center justify-center gap-2 text-xs text-white/40 uppercase tracking-widest">
                                                <span className="w-4 h-[1px] bg-white/20"></span>
                                                {DAILY_QUOTE.author}
                                                <span className="w-4 h-[1px] bg-white/20"></span>
                                            </div>
                                        </div>
                                        <div className="pt-4">
                                            <span className="text-[10px] bg-white/10 text-white/60 px-2 py-1 rounded-full">
                                                {DAILY_QUOTE.tag}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    /* Message List */
                                    <div className="space-y-2">
                                        {filteredMessages.map(msg => (
                                            <motion.div
                                                key={msg.id}
                                                layout
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                className={`
                                                    relative group p-3 rounded-xl border transition-all duration-200
                                                    ${msg.type === 'note' 
                                                        ? 'bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20 hover:border-indigo-500/40' 
                                                        : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'}
                                                `}
                                            >
                                                {/* Dismiss Button (Hover only) */}
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); handleDismiss(msg.id); }}
                                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 hover:bg-white/20 rounded-full transition-all text-white/50 hover:text-white"
                                                >
                                                    <X size={12} />
                                                </button>

                                                <div className="flex items-start gap-3">
                                                    {/* Icon */}
                                                    <div className={`
                                                        mt-1 w-8 h-8 rounded-full flex items-center justify-center shrink-0
                                                        ${msg.type === 'note' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-green-500/20 text-green-300'}
                                                    `}>
                                                        {msg.type === 'note' ? <MessageCircle size={14} /> : <CheckCircle2 size={14} />}
                                                    </div>

                                                    {/* Text */}
                                                    <div className="flex-1 space-y-1">
                                                        <div className="flex items-center justify-between pr-4">
                                                            <h4 className="text-white font-bold text-xs">{msg.title}</h4>
                                                            <span className="text-[10px] text-white/30">{msg.timestamp}</span>
                                                        </div>
                                                        <p className="text-white/70 text-xs leading-relaxed">
                                                            {msg.content}
                                                        </p>
                                                        
                                                        {/* Reward Badge */}
                                                        {msg.reward && (
                                                            <div className="flex items-center gap-1 mt-1.5">
                                                                <span className="text-[10px] bg-yellow-500/20 text-yellow-300 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                                    <Star size={8} fill="currentColor" /> {msg.reward}
                                                                </span>
                                                            </div>
                                                        )}

                                                        {/* Quick Reactions */}
                                                        <div className="flex gap-1 pt-2">
                                                            {[
                                                                { id: 'like', icon: <ThumbsUp size={10} /> },
                                                                { id: 'love', icon: <Heart size={10} /> },
                                                                { id: 'party', icon: <PartyPopper size={10} /> }
                                                            ].map(reaction => (
                                                                <button
                                                                    key={reaction.id}
                                                                    onClick={() => handleReaction(msg.id, reaction.id as any)}
                                                                    className={`
                                                                        p-1.5 rounded-full transition-all
                                                                        ${msg.reaction === reaction.id 
                                                                            ? 'bg-white/20 text-white scale-110' 
                                                                            : 'text-white/20 hover:text-white/60 hover:bg-white/10'}
                                                                    `}
                                                                >
                                                                    {reaction.icon}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            
                            {/* Footer Hint */}
                            <div className="p-2 border-t border-white/5 text-center">
                                <p className="text-[10px] text-white/20">Lumi 正在持续关注你的成长...</p>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};







