import React, { useState } from 'react';
import {
  X,
  Search,
  CheckCircle2,
  MessageSquare,
  Activity,
  Heart,
  Shield,
  ArrowRight,
  FileText,
  Inbox
} from 'lucide-react';
import { messages as defaultMessages } from '../data/mockTeacherData';
import { TeacherMessage } from '../../../types';

interface MessageDrawerProps {
  open: boolean;
  onClose: () => void;
}

export const MessageDrawer: React.FC<MessageDrawerProps> = ({ open, onClose }) => {
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

  if (!open) return null;

  return (
    <>
      {/* 遮罩层 */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* 右侧抽屉 */}
      <div className="fixed right-0 top-0 h-full w-full md:w-[480px] lg:w-[600px] bg-white shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Inbox size={20} className="text-indigo-600" /> 消息中心
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="p-3 flex gap-2 overflow-x-auto no-scrollbar shrink-0 bg-slate-50/50 border-b border-slate-100">
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

        {/* Message List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredMessages.length > 0 ? (
            filteredMessages.map(msg => {
              const isHighPriority = msg.type === 'PSYCHOLOGY' || (msg.level === 'high' && msg.status === 'open');
              return (
                <div
                  key={msg.id}
                  onClick={() => setSelectedId(msg.id)}
                  className={`p-4 rounded-xl cursor-pointer transition-all border group relative ${
                    selectedId === msg.id
                      ? 'bg-indigo-50 border-indigo-200 shadow-sm'
                      : isHighPriority
                      ? 'bg-red-50 border-red-200 hover:shadow-sm'
                      : 'bg-white border-slate-100 hover:bg-slate-50'
                  }`}
                >
                  {msg.status === 'open' && (
                    <div className={`absolute top-4 right-4 w-2 h-2 rounded-full ${
                      msg.level === 'high' ? 'bg-red-500 animate-pulse' : 'bg-amber-500'
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
                        <span className={`text-sm font-bold truncate ${
                          selectedId === msg.id ? 'text-indigo-900' : isHighPriority ? 'text-red-700' : 'text-slate-800'
                        }`}>
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
              );
            })
          ) : (
            <div className="py-20 flex flex-col items-center justify-center text-slate-300">
              <Shield size={40} strokeWidth={1} className="mb-2 opacity-20" />
              <p className="text-xs font-bold">暂无相关消息</p>
            </div>
          )}
        </div>

        {/* Detail Panel (if message selected) */}
        {selectedMessage && (
          <div className="absolute inset-0 bg-white z-10 flex flex-col animate-in slide-in-from-right duration-200">
            <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0">
              <button
                onClick={() => setSelectedId(null)}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowRight size={20} className="rotate-180 text-slate-600" />
              </button>
              <div className="flex gap-2">
                {selectedMessage.status === 'open' && (
                  <button
                    onClick={() => handleMarkHandled(selectedMessage.id)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-500 transition-colors shadow-sm"
                  >
                    <CheckCircle2 size={14} /> 标记处理
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="mb-4">
                <h3 className="font-bold text-slate-900 text-lg leading-tight mb-2">{selectedMessage.title}</h3>
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

              {selectedMessage.type === 'PSYCHOLOGY' ? (
                <PsychologyContent data={selectedMessage.psychologyData!} studentName={selectedMessage.student?.name || ''} />
              ) : selectedMessage.type === 'REDEEM' ? (
                <RedeemContent data={selectedMessage.redeemData!} studentName={selectedMessage.student?.name || ''} />
              ) : (
                <ReportContent data={selectedMessage.reportData!} summary={selectedMessage.summary} />
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

// --- Sub-components ---

const PsychologyContent = ({ data, studentName }: { data: any, studentName: string }) => (
  <div className="space-y-6">
    <div className="bg-white rounded-xl p-5 border border-slate-100">
      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
        <MessageSquare size={14} /> 关键对话摘录
      </h4>
      <div className="space-y-3">
        {data.chatLogs.map((log: any, i: number) => (
          <div key={i} className={`flex flex-col ${log.role === 'ai' ? 'items-start' : 'items-end'}`}>
            <div className={`max-w-[85%] p-3 rounded-xl text-sm leading-relaxed ${
              log.role === 'ai' ? 'bg-slate-50 text-slate-700 rounded-tl-none border border-slate-100' : 'bg-slate-900 text-white rounded-tr-none'
            }`}>
              {log.content}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 px-1 font-medium">{log.time}</span>
          </div>
        ))}
      </div>
    </div>

    <div className="space-y-4">
      <div className="bg-rose-50 p-5 rounded-xl border border-rose-100">
        <h4 className="text-xs font-black text-rose-700 uppercase tracking-widest mb-2 flex items-center gap-2">
          <Activity size={14} /> AI 心理诊断分析
        </h4>
        <p className="text-sm text-slate-800 leading-relaxed font-medium">{data.diagnosis}</p>
      </div>
      <div className="bg-amber-50 p-5 rounded-xl border border-amber-100">
        <h4 className="text-xs font-black text-amber-700 uppercase tracking-widest mb-3 flex items-center gap-2">
          <Heart size={14} /> 建议干预方案
        </h4>
        <ul className="space-y-2">
          {data.suggestions.map((s: string, i: number) => (
            <li key={i} className="text-sm text-slate-700 flex gap-2">
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
  <div className="bg-white rounded-xl p-6 border border-slate-100 text-center">
    <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-500">
      <Inbox size={32} />
    </div>
    <h4 className="text-lg font-black text-slate-900 mb-2">{studentName} 提交了兑换申请</h4>
    <p className="text-slate-500 text-sm mb-6">请确认学生已满足兑换条件并完成线下核销</p>

    <div className="bg-slate-50 rounded-lg p-5 mb-6 grid grid-cols-2 gap-4 text-left">
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

    <button className="flex items-center gap-2 mx-auto text-indigo-600 font-bold hover:gap-3 transition-all text-sm">
      去核销中心处理 <ArrowRight size={16} />
    </button>
  </div>
);

const ReportContent = ({ data, summary }: { data: any, summary: string }) => (
  <div className="bg-white rounded-xl p-6 border border-slate-100">
    <div className="flex items-start gap-4 mb-6">
      <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center text-blue-500 shrink-0">
        <FileText size={28} />
      </div>
      <div>
        <h4 className="text-lg font-black text-slate-900 mb-2">{data.period} 班级学情周报</h4>
        <p className="text-slate-500 text-sm leading-relaxed">{summary}</p>
      </div>
    </div>

    <div className="p-8 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center bg-slate-50/50">
      <p className="text-slate-400 text-sm font-bold mb-3">报告详情模块正在生成中...</p>
      <button className="px-5 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-all">
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
