
import React from 'react';
import { motion } from 'framer-motion';
import { Trash2, Wind, Star, X, Sparkles, ChevronRight, Zap } from 'lucide-react';

interface MindGymMenuProps {
  onSelectGame: (gameId: 'shredder' | 'breathing' | 'highlight') => void;
  onClose: () => void;
}

export const MindGymMenu: React.FC<MindGymMenuProps> = ({ onSelectGame, onClose }) => {
  const games = [
    {
        id: 'shredder',
        title: '情绪碎纸机',
        desc: '写下烦恼，物理粉碎',
        icon: Trash2,
        iconColor: 'text-rose-500',
        iconBg: 'bg-rose-50',
        gradient: 'from-rose-400 to-red-500'
    },
    {
        id: 'breathing',
        title: '静心能量球',
        desc: '3 分钟正念冥想，找回内在力量',
        icon: Wind,
        iconColor: 'text-blue-500',
        iconBg: 'bg-blue-50',
        gradient: 'from-blue-400 to-indigo-500'
    },
    {
        id: 'highlight',
        title: '优点捕捉瓶',
        desc: '收集今日份的小确幸',
        icon: Star,
        iconColor: 'text-amber-500',
        iconBg: 'bg-amber-50',
        gradient: 'from-amber-300 to-yellow-500',
        locked: true
    }
  ];

  return (
    <div className="absolute inset-0 bg-gray-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-6 pointer-events-auto" onClick={onClose}>
        <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md h-[545px] bg-white/80 backdrop-blur-2xl rounded-[64px] shadow-[0_30px_100px_rgba(0,0,0,0.1)] border border-white/60 overflow-hidden flex flex-col"
        >
            {/* Header */}
            <div className="p-8 pb-4 flex justify-between items-start">
                <div className="space-y-1">
                    <h3 className="text-2xl font-black text-gray-800 flex items-center gap-2">
                        🧩 心灵健身房
                    </h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Mind Wellness Hub</p>
                </div>
                <button onClick={onClose} className="p-2 bg-gray-100/50 hover:bg-gray-100 rounded-full transition-colors">
                    <X size={20} className="text-gray-400" />
                </button>
            </div>

            {/* Games List */}
            <div className="p-6 pt-2 space-y-3">
                {games.map((game) => (
                    <button
                        key={game.id}
                        onClick={() => !game.locked && onSelectGame(game.id as any)}
                        disabled={game.locked}
                        className={`w-full group relative flex items-center gap-4 p-5 rounded-[28px] border transition-all duration-300 text-left overflow-hidden ${
                            game.locked 
                                ? 'bg-gray-50/50 border-gray-100 grayscale opacity-60' 
                                : 'bg-white border-white/80 shadow-sm hover:shadow-xl hover:scale-[1.02] hover:border-brand/20 active:scale-98'
                        }`}
                    >
                        {/* Status Icon */}
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner relative z-10 transition-transform group-hover:scale-110 ${game.iconBg}`}>
                            <game.icon size={28} className={game.iconColor} />
                        </div>
                        
                        <div className="flex-1 min-w-0 relative z-10">
                            <h4 className="font-black text-gray-800 text-lg mb-0.5 group-hover:text-brand transition-colors">{game.title}</h4>
                            <p className="text-gray-400 text-xs font-bold leading-tight line-clamp-1">{game.desc}</p>
                        </div>

                        {game.locked ? (
                            <div className="relative z-10 p-2 bg-gray-200/50 rounded-xl">
                                <Zap size={16} className="text-gray-400" />
                            </div>
                        ) : (
                            <div className="relative z-10 w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-brand group-hover:text-white transition-all shadow-sm">
                                <ChevronRight size={20} strokeWidth={3} />
                            </div>
                        )}

                        {/* Subtle Gradient Accent on Hover */}
                        {!game.locked && (
                            <div className={`absolute top-0 left-0 bottom-0 w-1.5 bg-gradient-to-b ${game.gradient} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                        )}
                    </button>
                ))}
            </div>

            {/* Footer Advice */}
            <div className="p-8 pt-2 pb-8">
                <div className="bg-brand/5 rounded-3xl p-4 border border-brand/10 flex gap-3 items-center">
                    <div className="w-8 h-8 rounded-xl bg-brand text-white flex items-center justify-center shrink-0 shadow-lg shadow-brand/20">
                        <Sparkles size={16} />
                    </div>
                    <p className="text-[11px] font-bold text-brand-dark leading-relaxed">
                        小晤 贴士：每天进行 3 分钟的正念练习，能显著提升学习时的专注力哦！
                    </p>
                </div>
            </div>
        </motion.div>
    </div>
  );
};
