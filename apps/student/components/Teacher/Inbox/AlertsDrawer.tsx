import React, { useState } from 'react';
import { 
  X, 
  AlertTriangle, 
  Inbox, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Shield, 
  FileText, 
  MessageSquare, 
  Activity, 
  Heart,
  ChevronRight
} from 'lucide-react';
import { Card } from '../../UI/Card';
import { messages as defaultMessages } from '../data/mockTeacherData';
import { TeacherMessage } from '../../../types';

interface AlertsDrawerProps {
  open: boolean;
  messages?: TeacherMessage[];
  initialMessageId?: string;
  initialTab?: 'risk' | 'todo';
  onClose: () => void;
  onMarkHandled?: (id: string) => void;
  onTodoNavigate?: (recordId?: string) => void;
}

export const AlertsDrawer: React.FC<AlertsDrawerProps> = ({
  open,
  messages = defaultMessages,
  initialMessageId,
  initialTab = 'risk',
  onClose,
  onMarkHandled,
  onTodoNavigate,
}) => {
  const [tab, setTab] = useState<'risk' | 'todo'>(initialTab);
  const [selectedMessage, setSelectedMessage] = useState<TeacherMessage | null>(null);

  // 当打开抽屉且有初始消息ID时，自动定位到该消息
  React.useEffect(() => {
    if (open && initialMessageId) {
      const message = messages.find(m => m.id === initialMessageId);
      if (message) {
        // 设置对应的tab
        if (message.type === 'REDEEM') {
          setTab('todo');
        } else {
          setTab('risk');
          // 如果是心理预警，直接显示详情
          if (message.type === 'PSYCHOLOGY') {
            setSelectedMessage(message);
          }
        }
      }
    } else if (open) {
      // 如果没有初始消息ID，使用初始tab
      setTab(initialTab);
    }
  }, [open, initialMessageId, initialTab, messages]);

  // 关闭时重置状态
  React.useEffect(() => {
    if (!open) {
      setSelectedMessage(null);
    }
  }, [open]);

  if (!open) return null;

  // 过滤消息
  const riskMessages = messages.filter(m => m.type === 'PSYCHOLOGY' || m.type === 'REPORT');
  const todoMessages = messages.filter(m => m.type === 'REDEEM');

  const renderPsychologyDetail = (message: TeacherMessage) => {
    const data = message.psychologyData;
    if (!data) return null;

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
        <button 
          onClick={() => setSelectedMessage(null)}
          className="flex items-center gap-1 text-slate-500 hover:text-slate-900 text-sm font-bold mb-4"
        >
          <ChevronRight size={16} className="rotate-180" /> 返回列表
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h4 className="text-lg font-black text-slate-900">{message.student?.name} · 心理预警详情</h4>
            <p className="text-xs text-slate-500">触发词：<span className="text-rose-600 font-bold">{data.keyword}</span></p>
          </div>
        </div>

        {/* 聊天记录 */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
          <h5 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <MessageSquare size={14} /> 关键对话摘录 (已脱敏)
          </h5>
          <div className="space-y-4">
            {data.chatLogs.map((log, i) => (
              <div key={i} className={`flex flex-col ${log.role === 'ai' ? 'items-start' : 'items-end'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                  log.role === 'ai' ? 'bg-white text-slate-700 rounded-tl-none border border-slate-100' : 'bg-slate-900 text-white rounded-tr-none'
                }`}>
                  {log.content}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1">{log.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI 诊断 */}
        <div className="bg-rose-50 p-5 rounded-xl border border-rose-100">
          <h5 className="text-xs font-black text-rose-700 uppercase tracking-wider mb-2 flex items-center gap-2">
            <Activity size={14} /> AI 心理诊断建议
          </h5>
          <p className="text-sm text-slate-800 leading-relaxed font-medium">
            {data.diagnosis}
          </p>
        </div>

        {/* 干预建议 */}
        <div className="bg-amber-50 p-5 rounded-xl border border-amber-100">
          <h5 className="text-xs font-black text-amber-700 uppercase tracking-wider mb-3 flex items-center gap-2">
            <Heart size={14} /> 教师干预引导
          </h5>
          <ul className="space-y-3">
            {data.suggestions.map((s, i) => (
              <li key={i} className="text-sm text-slate-700 flex gap-3">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-200 text-amber-700 flex items-center justify-center text-[10px] font-black">{i+1}</span>
                <span className="flex-1">{s}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="pt-4">
          {message.status !== 'handled' ? (
            <button
              onClick={() => {
                onMarkHandled?.(message.id);
                setSelectedMessage(null);
              }}
              className="w-full py-4 rounded-xl bg-emerald-600 text-white font-black hover:bg-emerald-500 shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={18} /> 我已介入并关怀
            </button>
          ) : (
            <div className="w-full py-4 rounded-xl bg-slate-100 text-slate-400 font-black text-center flex items-center justify-center gap-2">
              <CheckCircle2 size={18} /> 已完成关怀跟进
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="w-full max-w-xl h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">预警中心</p>
            <h3 className="text-xl font-black text-slate-900">
              {selectedMessage ? '预警详情回顾' : '风险预警 & 兑换待办'}
            </h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400">
            <X size={20} />
          </button>
        </div>

        {!selectedMessage && (
          <div className="px-6 pt-4">
            <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl">
              <button
                onClick={() => setTab('risk')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  tab === 'risk' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <AlertTriangle size={16} />
                风险预警
                {riskMessages.filter(m => m.status === 'open').length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                )}
              </button>
              <button
                onClick={() => setTab('todo')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                  tab === 'todo' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <Inbox size={16} />
                兑换待办
                {todoMessages.filter(m => m.status === 'open').length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                )}
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6">
          {selectedMessage ? (
            renderPsychologyDetail(selectedMessage)
          ) : (
            <div className="space-y-3">
              {tab === 'risk' &&
                riskMessages.map((m) => (
                  <Card 
                    key={m.id} 
                    className={`p-4 border shadow-sm transition-all cursor-pointer ${
                      m.status === 'open' ? 'border-slate-200 hover:border-indigo-300' : 'border-slate-100 opacity-60'
                    }`}
                    onClick={() => m.type === 'PSYCHOLOGY' && setSelectedMessage(m)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          m.type === 'PSYCHOLOGY' ? 'bg-rose-50 text-rose-500' : 'bg-blue-50 text-blue-500'
                        }`}>
                          {m.type === 'PSYCHOLOGY' ? <AlertTriangle size={18} /> : <FileText size={18} />}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900">
                            {m.student?.name ? `${m.student.name} · ` : ''}{m.title}
                          </p>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{m.summary}</p>
                          <div className="flex items-center gap-2 mt-3 text-[10px] font-black uppercase">
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">{m.time}</span>
                            <span className={`px-2 py-0.5 rounded-full ${
                              m.level === 'high' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'
                            }`}>{m.level === 'high' ? '紧急' : '普通'}</span>
                            {m.type === 'PSYCHOLOGY' && (
                              <span className="text-indigo-600 flex items-center gap-1">点击查看对话详情 <ArrowRight size={10} /></span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}

              {tab === 'todo' &&
                todoMessages.map((m) => (
                  <Card key={m.id} className="p-4 border border-slate-100 shadow-sm hover:border-blue-200 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-50 text-amber-500">
                          <Inbox size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900">
                            {m.student?.name} · {m.redeemData?.item}
                          </p>
                          <p className="text-xs text-slate-500 mt-1">
                            消耗 {m.redeemData?.points} 积分 · {m.time}
                          </p>
                          {m.redeemData?.note && (
                            <p className="text-[11px] text-slate-400 mt-1 italic">备注：{m.redeemData.note}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => onTodoNavigate?.(m.redeemData?.recordId)}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
                      >
                        去核销
                      </button>
                    </div>
                  </Card>
                ))}

              {tab === 'todo' && todoMessages.length === 0 && (
                <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                  <Clock size={40} strokeWidth={1} className="mb-4 opacity-20" />
                  <p className="text-sm font-bold">暂无待办事项</p>
                </div>
              )}

              {tab === 'risk' && riskMessages.length === 0 && (
                <div className="py-20 flex flex-col items-center justify-center text-emerald-500">
                  <Shield size={40} strokeWidth={1} className="mb-4 opacity-20" />
                  <p className="text-sm font-bold">所有风险均已排除</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
