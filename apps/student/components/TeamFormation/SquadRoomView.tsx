import React from 'react';
import { Shield, LogOut, CheckCircle, Crown, UserMinus, AlertCircle } from 'lucide-react';
import { Squad, PBLRole, SquadMember } from './types';

interface SquadRoomViewProps {
  squad: Squad;
  currentUserId: string;
  onUpdateRole: (role: PBLRole) => void;
  onToggleReady: (isReady: boolean) => void;
  onLeaveSquad: () => void;
  onKickMember: (userId: string) => void;
  onLockSquad: () => void; // Request teacher approval
}

export const SquadRoomView: React.FC<SquadRoomViewProps> = ({ 
    squad, 
    currentUserId, 
    onUpdateRole, 
    onToggleReady, 
    onLeaveSquad,
    onKickMember,
    onLockSquad
}) => {
  const isLeader = squad.leaderId === currentUserId;
  const currentUserMember = squad.members.find(m => m.userId === currentUserId);
  const allReady = squad.members.every(m => m.isReady);

  const roleOptions: { value: PBLRole; label: string; icon: string }[] = [
    { value: 'LEADER', label: '统筹/队长', icon: '👑' },
    { value: 'RESEARCHER', label: '资料员', icon: '🔍' },
    { value: 'DESIGNER', label: '美术/设计', icon: '🎨' },
    { value: 'CODER', label: '编程/逻辑', icon: '💻' },
    { value: 'SPEAKER', label: '演讲/展示', icon: '📢' },
  ];

  return (
    <div className="flex flex-col h-full text-white bg-[#0f1115]">
        {/* Header */}
        <div className="p-6 border-b border-white/5 bg-[#14161b]">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-xl font-bold flex items-center gap-2 text-indigo-400">
                        <span className="text-2xl">🚧</span> {squad.name}
                    </h2>
                    <p className="text-xs text-slate-400 mt-1 italic">"{squad.slogan}"</p>
                </div>
                <div className="bg-indigo-500/10 text-indigo-400 text-[10px] font-bold px-2 py-1 rounded border border-indigo-500/20 uppercase tracking-wider">
                    组建中 ({squad.members.length}/{squad.maxMembers})
                </div>
            </div>
            
            <div className="mt-4 flex items-center gap-2 p-3 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs">
                <AlertCircle size={14} className="shrink-0" />
                <p>全员选定角色并点击“准备就绪”后，队长方可提交导师锁定。</p>
            </div>
        </div>

        {/* Member List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {squad.members.map(member => {
                const isMe = member.userId === currentUserId;
                const isMemberLeader = member.userId === squad.leaderId;

                return (
                    <div key={member.userId} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${isMe ? 'bg-white/5 border-indigo-500/30 ring-1 ring-indigo-500/20' : 'bg-transparent border-white/5'}`}>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <img src={member.avatar} alt={member.name} className={`w-10 h-10 rounded-full object-cover border-2 ${member.isReady ? 'border-green-500' : 'border-slate-600'}`} />
                                {isMemberLeader && (
                                    <div className="absolute -top-1 -right-1 bg-yellow-500 text-[8px] rounded-full w-4 h-4 flex items-center justify-center border border-black shadow-sm">👑</div>
                                )}
                            </div>
                            
                            <div className="flex flex-col">
                                <span className={`text-sm font-bold ${isMe ? 'text-white' : 'text-slate-300'}`}>
                                    {member.name} {isMe && <span className="text-slate-500 text-[10px] font-normal">(我)</span>}
                                </span>
                                
                                {isMe ? (
                                    <select 
                                        value={member.role || ''}
                                        onChange={(e) => onUpdateRole(e.target.value as PBLRole)}
                                        className="mt-1 bg-black/20 border border-white/10 rounded text-[10px] text-slate-300 py-0.5 pl-1 pr-6 focus:outline-none focus:border-indigo-500"
                                    >
                                        <option value="" disabled>选择担当...</option>
                                        {roleOptions.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.icon} {opt.label}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="mt-1 flex items-center gap-1">
                                        {member.role ? (
                                            <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-slate-400">
                                                {roleOptions.find(r => r.value === member.role)?.icon} {roleOptions.find(r => r.value === member.role)?.label}
                                            </span>
                                        ) : (
                                            <span className="text-[10px] text-slate-600">未选角色</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Status/Actions */}
                        <div className="flex items-center gap-3">
                            {member.isReady ? (
                                <div className="flex items-center gap-1 text-green-500 text-[10px] font-bold bg-green-500/10 px-2 py-1 rounded-full">
                                    <CheckCircle size={10} />
                                    READY
                                </div>
                            ) : (
                                <span className="text-[10px] text-slate-600 font-bold px-2">...</span>
                            )}

                            {isLeader && !isMe && (
                                <button 
                                    onClick={() => onKickMember(member.userId)}
                                    className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                                    title="移出小队"
                                >
                                    <UserMinus size={14} />
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-white/5 bg-[#14161b]">
            <div className="flex items-center justify-between gap-4">
                {isLeader ? (
                     // Leader Controls
                     <>
                        <button className="text-red-400 text-xs hover:text-red-300 font-bold px-3">
                            解散小队
                        </button>
                        <button 
                            disabled={!allReady}
                            onClick={onLockSquad}
                            className={`flex-1 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                                allReady 
                                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)]' 
                                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            }`}
                        >
                            <Shield size={16} />
                            {allReady ? '提交导师锁定' : '等待全员就绪'}
                        </button>
                     </>
                ) : (
                    // Member Controls
                    <>
                        <button 
                            onClick={onLeaveSquad}
                            className="text-slate-400 text-xs hover:text-white font-bold px-3 flex items-center gap-1"
                        >
                            <LogOut size={14} /> 退出
                        </button>
                        <label className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold cursor-pointer transition-all select-none ${
                            currentUserMember?.isReady 
                            ? 'bg-green-600/20 text-green-400 border border-green-500/50' 
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg'
                        }`}>
                            <input 
                                type="checkbox" 
                                className="hidden" 
                                checked={currentUserMember?.isReady || false}
                                onChange={(e) => onToggleReady(e.target.checked)}
                            />
                            {currentUserMember?.isReady ? (
                                <>
                                    <CheckCircle size={16} /> 已就绪 (点击取消)
                                </>
                            ) : (
                                <>
                                    我准备好了 🚀
                                </>
                            )}
                        </label>
                    </>
                )}
            </div>
        </div>
    </div>
  );
};













