import React, { useState } from 'react';
import { 
  Inbox, 
  Search, 
  CheckCircle2, 
  MessageSquare, 
  Activity, 
  Heart,
  ChevronRight,
  Shield,
  ArrowRight,
  FileText
} from 'lucide-react';
import { Card } from '../../UI/Card';
import { messages as defaultMessages } from '../data/mockTeacherData';
import { TeacherMessage } from '../../../types';

export const SmartInbox: React.FC = () => {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [filter, setFilter] = useState<'all' | 'report' | 'todo'>('all');
    const [messages, setMessages] = useState<TeacherMessage[]>(
        () => defaultMessages.filter((message) => message.type !== 'PSYCHOLOGY'),
    );

    const filteredMessages = messages.filter(m => {
        if (filter === 'all') return true;
        if (filter === 'report') return m.type === 'REPORT';
        if (filter === 'todo') return m.type === 'REDEEM';
        return true;
    });

    const selectedMessage = messages.find(m => m.id === selectedId);

    const handleMarkHandled = (id: string) => {
        setMessages(prev => prev.map(m => m.id === id ? { ...m, status: 'handled' } : m));
    };

    return (
        <div className="flex h-full bg-[#F8F9FC] overflow-hidden">
            
            {/* LEFT: Message List */}
            <div className={`w-full md:w-80 lg:w-96 flex flex-col bg-white border-r border-gray-200 ${selectedId ? 'hidden md:flex' : 'flex'}`}>
                
                {/* Header */}
                <div className="p-4 border-b border-gray-100 flex items-center justify-between shrink-0 h-16">
                    <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                        <Inbox size={20} className="text-indigo-600" /> 消息中心
                    </h2>
                    <button className="p-2 text-slate-400 hover:bg-slate-50 rounded-full">
                        <Search size={18} />
                    </button>
                </div>

                {/* Filter Tabs */}
                <div className="p-3 flex gap-2 overflow-x-auto no-scrollbar shrink-0 bg-slate-50/50">
                    <FilterButton 
                        label="全部" 
                        active={filter === 'all'} 
                        onClick={() => setFilter('all')} 
                        color="indigo"
                    />
                    <FilterButton 
                        label="学情" 
                        icon={<FileText size={12}/>} 
                        active={filter === 'report'} 
                        onClick={() => setFilter('report')} 
                        color="blue"
                    />
                    <FilterButton 
                        label="待办" 
                        icon={<Inbox size={12}/>} 
                        active={filter === 'todo'} 
                        onClick={() => setFilter('todo')} 
                        color="amber"
                    />
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {filteredMessages.length > 0 ? (
                        filteredMessages.map(msg => (
                            <div 
                                key={msg.id}
                                onClick={() => setSelectedId(msg.id)}
                                className={`p-4 rounded-xl cursor-pointer transition-all border group relative ${
                                    selectedId === msg.id 
                                        ? 'bg-indigo-50 border-indigo-200 shadow-sm' 
                                        : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-100'
                                }`}
                            >
                                {msg.status === 'open' && (
                                    <div className={`absolute top-4 right-4 w-2 h-2 rounded-full ${
                                        msg.level === 'high' ? 'bg-red-500' : 'bg-amber-500'
                                    }`}></div>
                                )}
                                
                                <div className="flex items-start gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 border ${
                                        selectedId === msg.id ? 'bg-white border-indigo-200' : 'bg-slate-100 border-slate-100'
                                    }`}>
                                        {msg.student?.avatar || (msg.type === 'REPORT' ? '📊' : '📢')}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-0.5">
                                            <span className={`text-sm font-bold truncate ${selectedId === msg.id ? 'text-indigo-900' : 'text-slate-800'}`}>
                                                {msg.student?.name || (msg.type === 'REPORT' ? '班级系统' : '系统通知')}
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-medium shrink-0">{msg.time}</span>
                                        </div>
                                        <div className="text-xs font-bold text-slate-600 mb-1 truncate">{msg.title}</div>
                                        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                                            {msg.summary}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-20 flex flex-col items-center justify-center text-slate-300">
                            <Shield size={40} strokeWidth={1} className="mb-2 opacity-20" />
                            <p className="text-xs font-bold">暂无相关消息</p>
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT: Detail View */}
            <div className={`flex-1 flex flex-col bg-[#F8F9FC] ${selectedId ? 'flex' : 'hidden md:flex'}`}>
                {selectedMessage ? (
                    <div className="flex flex-col h-full overflow-hidden">
                        {/* Detail Header */}
                        <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
                            <div className="flex items-center gap-4">
                                <button onClick={() => setSelectedId(null)} className="md:hidden p-2 -ml-2 text-slate-500">
                                    <ChevronRight size={20} className="rotate-180" />
                                </button>
                                <div>
                                    <h3 className="font-bold text-slate-900 text-lg leading-tight">{selectedMessage.title}</h3>
                                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                        <span className={`px-1.5 py-0.5 rounded font-black uppercase text-[10px] ${
                                            selectedMessage.type === 'PSYCHOLOGY' ? 'bg-rose-100 text-rose-600' : 
                                            selectedMessage.type === 'REDEEM' ? 'bg-amber-100 text-amber-600' : 
                                            'bg-blue-100 text-blue-600'
                                        }`}>
                                            {selectedMessage.type === 'PSYCHOLOGY' ? '心理预警' : 
                                             selectedMessage.type === 'REDEEM' ? '奖励兑换' : 
                                             '班级报告'}
                                        </span>
                                        <span>{selectedMessage.time}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                {selectedMessage.status === 'open' && (
                                    <button 
                                        onClick={() => handleMarkHandled(selectedMessage.id)}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-500 transition-colors shadow-sm shadow-emerald-100"
                                    >
                                        <CheckCircle2 size={14} /> 标记处理
                                    </button>
                                )}
                                {selectedMessage.status === 'handled' && (
                                    <span className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 text-slate-400 rounded-lg text-xs font-bold">
                                        <CheckCircle2 size={14} /> 已处理
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Content Scroll */}
                        <div className="flex-1 overflow-y-auto p-6 md:p-10">
                            <div className="max-w-3xl mx-auto">
                                {selectedMessage.type === 'PSYCHOLOGY' ? (
                                    <PsychologyContent data={selectedMessage.psychologyData!} studentName={selectedMessage.student?.name || ''} />
                                ) : selectedMessage.type === 'REDEEM' ? (
                                    <RedeemContent data={selectedMessage.redeemData!} studentName={selectedMessage.student?.name || ''} />
                                ) : (
                                    <ReportContent data={selectedMessage.reportData!} summary={selectedMessage.summary} />
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                            <Inbox size={40} className="opacity-20" />
                        </div>
                        <p className="font-bold text-slate-400">选择一条消息查看详情</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Sub-components for different content types ---

const PsychologyContent = ({ data, studentName }: { data: any, studentName: string }) => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <MessageSquare size={16} /> 关键对话摘录
            </h4>
            <div className="space-y-4">
                {data.chatLogs.map((log: any, i: number) => (
                    <div key={i} className={`flex flex-col ${log.role === 'ai' ? 'items-start' : 'items-end'}`}>
                        <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
                            log.role === 'ai' ? 'bg-slate-50 text-slate-700 rounded-tl-none border border-slate-100' : 'bg-slate-900 text-white rounded-tr-none shadow-md'
                        }`}>
                            {log.content}
                        </div>
                        <span className="text-[10px] text-slate-400 mt-2 px-1 font-medium">{log.time}</span>
                    </div>
                ))}
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-rose-50 p-6 rounded-2xl border border-rose-100">
                <h4 className="text-xs font-black text-rose-700 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Activity size={16} /> AI 心理诊断分析
                </h4>
                <p className="text-sm text-slate-800 leading-relaxed font-medium">{data.diagnosis}</p>
            </div>
            <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100">
                <h4 className="text-xs font-black text-amber-700 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Heart size={16} /> 建议干预方案
                </h4>
                <ul className="space-y-3">
                    {data.suggestions.map((s: string, i: number) => (
                        <li key={i} className="text-sm text-slate-700 flex gap-3">
                            <span className="w-5 h-5 rounded-full bg-amber-200 text-amber-800 flex items-center justify-center text-[10px] font-black shrink-0">{i+1}</span>
                            <span>{s}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    </div>
);

const RedeemContent = ({ data, studentName }: { data: any, studentName: string }) => (
    <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6 text-amber-500">
            <Inbox size={40} />
        </div>
        <h4 className="text-xl font-black text-slate-900 mb-2">{studentName} 提交了兑换申请</h4>
        <p className="text-slate-500 text-sm mb-8">请确认学生已满足兑换条件并完成线下核销</p>
        
        <div className="bg-slate-50 rounded-xl p-6 mb-8 grid grid-cols-2 gap-4 text-left">
            <div>
                <div className="text-[10px] font-black text-slate-400 uppercase mb-1">兑换项目</div>
                <div className="font-bold text-slate-900">{data.item}</div>
            </div>
            <div>
                <div className="text-[10px] font-black text-slate-400 uppercase mb-1">消耗积分</div>
                <div className="font-bold text-amber-600">{data.points} pts</div>
            </div>
            {data.note && (
                <div className="col-span-2 pt-2 border-t border-slate-200">
                    <div className="text-[10px] font-black text-slate-400 uppercase mb-1">备注信息</div>
                    <div className="text-sm text-slate-600">{data.note}</div>
                </div>
            )}
        </div>
        
        <button className="flex items-center gap-2 mx-auto text-indigo-600 font-bold hover:gap-3 transition-all">
            去核销中心处理 <ArrowRight size={18} />
        </button>
    </div>
);

const ReportContent = ({ data, summary }: { data: any, summary: string }) => (
    <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-start gap-6 mb-8">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 shrink-0">
                <FileText size={32} />
            </div>
            <div>
                <h4 className="text-xl font-black text-slate-900 mb-2">{data.period} 班级学情周报</h4>
                <p className="text-slate-500 text-sm leading-relaxed">{summary}</p>
            </div>
        </div>
        
        <div className="p-10 border-2 border-dashed border-slate-100 rounded-3xl flex flex-col items-center justify-center bg-slate-50/50">
            <p className="text-slate-400 text-sm font-bold mb-4">报告详情模块正在生成中...</p>
            <button className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-lg">
                立即查看完整报表
            </button>
        </div>
    </div>
);

interface FilterButtonProps {
    label: string;
    icon?: React.ReactNode;
    active?: boolean;
    onClick: () => void;
    color: 'indigo' | 'blue' | 'amber';
}

const FilterButton: React.FC<FilterButtonProps> = ({ label, icon, active, onClick, color }) => {
    const colorClasses = {
        indigo: active ? 'bg-white text-indigo-900 border-indigo-100' : 'text-slate-500 hover:text-indigo-600',
        blue: active ? 'bg-white text-blue-600 border-blue-100' : 'text-slate-500 hover:text-blue-600',
        amber: active ? 'bg-white text-amber-600 border-amber-100' : 'text-slate-500 hover:text-amber-600',
    };

    return (
        <button 
            onClick={onClick}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap border ${
                active ? 'shadow-sm' : 'border-transparent hover:bg-white/50'
            } ${colorClasses[color]}`}
        >
            {icon}
            {label}
        </button>
    );
};
