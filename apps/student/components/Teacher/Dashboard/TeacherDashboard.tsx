import React, { useMemo } from 'react';
import { Sparkles, TrendingUp, Activity, ArrowRight, AlertTriangle, BookOpen, Clock3 } from 'lucide-react';
import { ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Card } from '../../UI/Card';
import { classOverview, highFreqMistakes, alerts, getTopRiskNodes } from '../data/mockTeacherData';

export const TeacherDashboard: React.FC<{ onNavigateAnalytics?: () => void }> = ({
  onNavigateAnalytics,
}) => {
  const pendingAlertCount = useMemo(() => alerts.filter((a) => a.status !== 'handled').length, []);
  const coreRiskNodes = useMemo(() => getTopRiskNodes(undefined, 3), []);

  const metrics = [
    { label: '今日活跃率', value: `${Math.round(classOverview.activeRate * 100)}%`, trend: '+3%', icon: Activity, tone: 'up' },
    { label: '任务达标率', value: `${Math.round(classOverview.taskCompletionRate * 100)}%`, trend: '+5%', icon: TrendingUp, tone: 'up' },
    { label: '待处理预警', value: pendingAlertCount.toString(), trend: '-1', icon: AlertTriangle, tone: pendingAlertCount ? 'down' : 'up' },
    { label: '班级平均积分', value: classOverview.avgPoints.toString(), trend: '+20', icon: Sparkles, tone: 'up' },
  ];

  const handleOpenAnalytics = () => {
    if (onNavigateAnalytics) {
      onNavigateAnalytics();
      return;
    }
    window.dispatchEvent(new CustomEvent('teacher-nav', { detail: { page: 'analytics' } }));
  };

  return (
    <div className="h-full w-full flex flex-col bg-white overflow-hidden">
      {/* 顶部 */}
      <div className="flex items-center justify-between px-8 pt-8 pb-6 border-b border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-900 mt-1"> 工作台 </h1>
          <p className="text-sm text-slate-500">聚焦学情、预警与激励 · {classOverview.periodLabel} · 更新 {classOverview.updateTime}</p>
        </div>
      </div>

      {/* 可滚动主体 */}
      <div className="flex-1 overflow-y-auto px-8 pb-10">
        {/* 指标卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {metrics.map((m) => (
            <Card key={m.label} className="p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
                  <m.icon size={18} />
                </div>
                <span className={`text-xs font-black ${m.tone === 'up' ? 'text-emerald-500' : 'text-red-500'}`}>{m.trend}</span>
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-tight mt-3">{m.label}</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{m.value}</p>
              <p className="text-[11px] text-slate-400 mt-1">周期：{classOverview.periodLabel} · 更新 {classOverview.updateTime}</p>
            </Card>
          ))}
        </div>

        {/* 下方分栏 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 知识薄弱点 */}
          <Card
            className="lg:col-span-2 p-6 border border-slate-100 shadow-sm cursor-pointer"
            role="button"
            onClick={handleOpenAnalytics}
            tabIndex={0}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">核心风险预警</p>
                <h3 className="text-lg font-black text-slate-900">共性薄弱点 · Top 3</h3>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenAnalytics();
                }}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-500 flex items-center gap-1"
              >
                查看学情分析 <ArrowRight size={14} />
              </button>
            </div>
            <div className="text-[11px] text-slate-400 font-bold mb-3">与学情分析页“核心风险预警”同步</div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={coreRiskNodes} layout="vertical" margin={{ left: 80, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="knowledgePoint" type="category" tick={{ fill: '#475569', fontSize: 12, fontWeight: 700 }} width={140} />
                  <Bar dataKey="unmasteredCount" fill="#ef4444" radius={[4, 4, 4, 4]} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* 高频错题榜 */}
          <Card className="p-6 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen size={16} className="text-blue-500" />
              <h4 className="text-sm font-black text-slate-900">高频错题榜</h4>
              <span className="text-[11px] text-slate-400 font-bold">周期：近7天</span>
            </div>
            <div className="space-y-3">
              {highFreqMistakes.slice(0, 3).map((item) => (
                <div key={item.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-900">{item.questionSnippet}</p>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-black flex items-center gap-1">
                      <Clock3 size={12} /> 截止：{item.deadlineLabel || '本周'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">错误人数 {item.wrongAttempts} · 正确 {item.correctAttempts}</p>
                  <p className="text-xs text-slate-500">知识点：{item.knowledgePoints?.join('、')}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
