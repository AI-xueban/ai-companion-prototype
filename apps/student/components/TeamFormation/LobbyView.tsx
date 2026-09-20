import React, { useState } from 'react';
import { User, Plus, Users, Search } from 'lucide-react';
import { Squad, PBLRole } from './types';

interface LobbyViewProps {
  squads: Squad[];
  onCreateSquad: (name: string, slogan: string, requiredRoles: PBLRole[]) => void;
  onJoinSquad: (squadId: string) => void;
}

export const LobbyView: React.FC<LobbyViewProps> = ({ squads, onCreateSquad, onJoinSquad }) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSquadName, setNewSquadName] = useState('');
  const [newSquadSlogan, setNewSquadSlogan] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<PBLRole[]>([]);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSquadName && newSquadSlogan) {
      onCreateSquad(newSquadName, newSquadSlogan, selectedRoles);
      setShowCreateForm(false);
    }
  };

  const toggleRole = (role: PBLRole) => {
    if (selectedRoles.includes(role)) {
      setSelectedRoles(selectedRoles.filter(r => r !== role));
    } else {
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  const roleOptions: { value: PBLRole; label: string; icon: string }[] = [
    { value: 'RESEARCHER', label: '资料员', icon: '🔍' },
    { value: 'DESIGNER', label: '美术/设计', icon: '🎨' },
    { value: 'CODER', label: '编程/逻辑', icon: '💻' },
    { value: 'SPEAKER', label: '演讲/展示', icon: '📢' },
  ];

  if (showCreateForm) {
    return (
      <div className="flex flex-col h-full p-6 text-white animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">创建新的探险小队</h2>
            <button onClick={() => setShowCreateForm(false)} className="text-sm text-slate-400 hover:text-white">取消</button>
        </div>
        
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">小队名称</label>
            <input 
              type="text" 
              value={newSquadName}
              onChange={(e) => setNewSquadName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              placeholder="例如：火星殖民先锋队"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">任务口号</label>
            <input 
              type="text" 
              value={newSquadSlogan}
              onChange={(e) => setNewSquadSlogan(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              placeholder="我们的目标是星辰大海！"
            />
          </div>
          
          <div>
             <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">我们需要什么样的伙伴？(多选)</label>
             <div className="grid grid-cols-2 gap-2">
                {roleOptions.map(option => (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => toggleRole(option.value)}
                        className={`flex items-center gap-2 px-3 py-2 rounded border text-sm transition-all ${selectedRoles.includes(option.value) ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300' : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'}`}
                    >
                        <span>{option.icon}</span>
                        <span>{option.label}</span>
                    </button>
                ))}
             </div>
          </div>

          <button 
            type="submit"
            className="w-full mt-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 rounded transition-colors"
          >
            发布招募令 🚀
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full text-white">
      {/* Header */}
      <div className="p-6 pb-2 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="text-2xl">🛡️</span> 集结大厅
            </h2>
            <p className="text-xs text-slate-400 mt-1">寻找志同道合的伙伴，组建最强PBL战队</p>
          </div>
          <button 
            onClick={() => setShowCreateForm(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors shadow-lg shadow-indigo-900/50"
          >
            <Plus size={14} />
            创建新小队
          </button>
        </div>

        {/* Filter/Search Mock */}
        <div className="relative mb-4">
            <Search className="absolute left-3 top-2.5 text-slate-500" size={14} />
            <input 
                type="text" 
                placeholder="搜索感兴趣的小队..." 
                className="w-full bg-slate-900/50 border border-white/10 rounded-full pl-9 pr-4 py-2 text-sm text-slate-300 focus:outline-none focus:border-indigo-500/50"
            />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-3 custom-scrollbar">
        {squads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-500">
                <Users size={32} className="mb-2 opacity-50" />
                <p className="text-sm">暂无小队，快来创建第一个吧！</p>
            </div>
        ) : (
            squads.map(squad => (
                <div key={squad.id} className="bg-[#1a1d24] border border-white/5 hover:border-indigo-500/30 rounded-xl p-4 transition-all group">
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <h3 className="font-bold text-slate-200 group-hover:text-white transition-colors">{squad.name}</h3>
                            <p className="text-xs text-slate-500 italic">"{squad.slogan}"</p>
                        </div>
                        <div className="text-xs font-mono bg-black/20 px-2 py-1 rounded text-slate-400">
                            {squad.members.length}/{squad.maxMembers}
                        </div>
                    </div>
                    
                    {/* Slots Visualization */}
                    <div className="flex items-center gap-2 mb-4">
                        {/* Existing Members */}
                        {squad.members.map(member => (
                            <div key={member.userId} className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 overflow-hidden relative" title={member.name}>
                                <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                                {member.userId === squad.leaderId && (
                                    <div className="absolute -top-1 -right-1 bg-yellow-500 text-[8px] rounded-full w-3 h-3 flex items-center justify-center">👑</div>
                                )}
                            </div>
                        ))}
                        
                        {/* Empty Slots */}
                        {Array.from({ length: Math.max(0, squad.maxMembers - squad.members.length) }).map((_, i) => (
                            <div key={`empty-${i}`} className="w-8 h-8 rounded-full border border-dashed border-slate-600 flex items-center justify-center text-slate-600 bg-white/5 text-[10px]">
                                ?
                            </div>
                        ))}
                    </div>

                    {/* Requirements Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                        {squad.requiredRoles.map(role => {
                             const roleInfo = roleOptions.find(r => r.value === role);
                             return roleInfo ? (
                                 <span key={role} className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                     急需 {roleInfo.icon} {roleInfo.label}
                                 </span>
                             ) : null;
                        })}
                    </div>

                    <button 
                        onClick={() => onJoinSquad(squad.id)}
                        className="w-full py-2 rounded bg-white/5 hover:bg-indigo-600/20 text-indigo-300 hover:text-indigo-200 text-xs font-bold transition-all border border-indigo-500/10 hover:border-indigo-500/50"
                    >
                        申请对接
                    </button>
                </div>
            ))
        )}
      </div>
    </div>
  );
};













