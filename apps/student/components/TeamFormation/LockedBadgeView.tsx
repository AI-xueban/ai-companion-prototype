import React from 'react';
import { ShieldCheck, MessageSquare } from 'lucide-react';
import { Squad } from './types';

interface LockedBadgeViewProps {
  squad: Squad;
}

export const LockedBadgeView: React.FC<LockedBadgeViewProps> = ({ squad }) => {
  return (
    <div className="flex flex-col h-full items-center justify-center p-8 text-center bg-gradient-to-br from-indigo-900/40 to-slate-900 text-white border-2 border-indigo-500/30 rounded-2xl relative overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"></div>
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/20 blur-3xl rounded-full pointer-events-none"></div>

        <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(99,102,241,0.3)]">
            <ShieldCheck size={32} className="text-indigo-400" />
        </div>

        <h2 className="text-2xl font-bold mb-2">{squad.name}</h2>
        <p className="text-sm text-slate-400 italic mb-8">"{squad.slogan}"</p>

        <div className="flex justify-center -space-x-3 mb-8">
            {squad.members.map(m => (
                <div key={m.userId} className="relative group cursor-help">
                    <img 
                        src={m.avatar} 
                        alt={m.name} 
                        className="w-10 h-10 rounded-full border-2 border-[#0f1115] object-cover transition-transform group-hover:scale-110 group-hover:z-10" 
                    />
                    <div className="absolute opacity-0 group-hover:opacity-100 bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/80 text-white text-[10px] px-2 py-1 rounded transition-opacity">
                        {m.name} ({m.role})
                    </div>
                </div>
            ))}
        </div>

        <div className="w-full max-w-xs space-y-3">
            <button className="w-full py-3 bg-white/10 hover:bg-white/15 border border-white/5 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2">
                <MessageSquare size={16} />
                进入小组协作空间
            </button>
            <p className="text-[10px] text-slate-500">
                小组已由导师锁定，如需调整请线下联系老师。
            </p>
        </div>
    </div>
  );
};













