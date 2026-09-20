import React, { useMemo, useState } from 'react';
import { Users, Search, AlertCircle, CheckCircle2, RefreshCw, ShieldCheck } from 'lucide-react';
import { Card } from '../../UI/Card';
import { StudentSummary } from '../../../types';
import { classStats, students } from '../data/mockTeacherData';
import { StudentDetailDrawer } from './StudentDetailDrawer';

export const StudentProfiles: React.FC = () => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'attention' | 'excellent' | 'online'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return students.filter((s) => {
      const match = s.name.toLowerCase().includes(keyword) || s.id.toLowerCase().includes(keyword);
      if (!match) return false;
      if (filter === 'attention') return s.alertLevel !== 'none';
      if (filter === 'excellent') {
        const avg = Object.values(s.abilitySnapshot).reduce((a, b) => a + b, 0) / 5;
        return avg >= 85;
      }
      if (filter === 'online') return s.status === 'online';
      return true;
    });
  }, [search, filter]);

  const handleResetPwd = (student: StudentSummary) => {
    const confirmMsg = `确认重置 ${student.name} 的密码为学号后六位？登录后需强制改密（前端提示即可）。`;
    if (!confirm(confirmMsg)) return;
    alert(`已重置 ${student.name} 的密码为学号后六位，请提醒登录后修改密码（演示逻辑）。`);
  };

  const selected = students.find((s) => s.id === selectedId) || null;

  return (
    <div className="h-full flex flex-col p-6 md:p-8 bg-white">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">学生管理</p>
          <h2 className="text-2xl font-black text-slate-900">学生列表</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="按姓名/学号搜索"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">{classStats.totalStudents}</p>
              <p className="text-xs text-slate-500">班级总人数</p>
            </div>
          </div>
        </Card>
        <Card className="p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">{classStats.onlineCount}</p>
              <p className="text-xs text-slate-500">当前在线</p>
            </div>
          </div>
        </Card>
        <Card className="p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <AlertCircle size={18} className="text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">{classStats.attentionNeeded}</p>
              <p className="text-xs text-slate-500">需要关注</p>
            </div>
          </div>
        </Card>
        <Card className="p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <CheckCircle2 size={18} className="text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900">{classStats.excellentPerformance}</p>
              <p className="text-xs text-slate-500">表现优秀</p>
            </div>
          </div>
        </Card>
      </div>

      {/* 筛选 */}
      <div className="flex items-center gap-2 mb-4">
        {[
          { key: 'all', label: `全部 (${students.length})` },
          { key: 'attention', label: `需要关注 (${students.filter((s) => s.alertLevel !== 'none').length})` },
          { key: 'excellent', label: `表现优秀 (${students.filter((s) => Object.values(s.abilitySnapshot).reduce((a, b) => a + b, 0) / 5 >= 85).length})` },
          { key: 'online', label: `在线 (${students.filter((s) => s.status === 'online').length})` },
        ].map((btn) => (
          <button
            key={btn.key}
            onClick={() => setFilter(btn.key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
              filter === btn.key ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* 表格 */}
      <div className="flex-1 overflow-auto border border-slate-200 rounded-xl">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 font-bold">
            <tr>
              <th className="px-4 py-3 text-left">学号</th>
              <th className="px-4 py-3 text-left">姓名</th>
              <th className="px-4 py-3 text-left">等级(1-10)</th>
              <th className="px-4 py-3 text-left">积分</th>
              <th className="px-4 py-3 text-left">今日任务</th>
              <th className="px-4 py-3 text-left">最近登录</th>
              <th className="px-4 py-3 text-left">操作</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => {
              const points = Object.values(s.abilitySnapshot).reduce((a, b) => a + b, 0);
              const levelNumber = s.level ?? Math.min(10, Math.max(1, Math.round(points / 50)));
              const taskStatus = s.recentTrend === 'up' ? '已完成' : '待完成';

              return (
                <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-slate-700">{s.id}</td>
                  <td className="px-4 py-3 font-bold text-slate-900 flex items-center gap-2">
                    <span className="text-lg">{s.avatar}</span>
                    {s.name}
                    {s.alertLevel !== 'none' && (
                      <span className="px-2 py-0.5 text-[10px] rounded-full bg-amber-100 text-amber-700 font-black">关注</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{levelNumber}</td>
                  <td className="px-4 py-3 text-slate-700">{points}</td>
                  <td className="px-4 py-3 text-slate-700">{taskStatus}</td>
                  <td className="px-4 py-3 text-slate-700">{s.lastActive}</td>
                  <td className="px-4 py-3 space-x-2">
                    <button
                      onClick={() => handleResetPwd(s)}
                      className="px-3 py-1 rounded-md text-xs font-bold bg-white border border-slate-200 hover:bg-slate-100 text-slate-700"
                    >
                      重置密码
                    </button>
                    <button
                      onClick={() => setSelectedId(s.id)}
                      className="px-3 py-1 rounded-md text-xs font-bold bg-slate-900 text-white hover:bg-slate-800"
                    >
                      查看详情
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="p-8 text-center text-slate-500">暂无匹配结果</div>
        )}
      </div>

      <StudentDetailDrawer studentId={selected?.id ?? null} studentName={selected?.name ?? ''} onClose={() => setSelectedId(null)} />
    </div>
  );
};
