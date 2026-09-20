import React, { useEffect, useState } from 'react';
import { Card } from '../../UI/Card';
import { incentiveGoods, redemptionRecords } from '../data/mockTeacherData';
import { Plus, Check, XCircle, Power } from 'lucide-react';

export const ClassIncentives: React.FC = () => {
  const [tab, setTab] = useState<'store' | 'redeem'>('store');
  const [goods, setGoods] = useState(incentiveGoods);
  const [records, setRecords] = useState(redemptionRecords);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  useEffect(() => {
    const handleHighlight = (event: any) => {
      if (!event?.detail) return;
      setTab('redeem');
      setHighlightId(event.detail.recordId || null);
    };
    window.addEventListener('teacher-incentive-highlight', handleHighlight as any);
    return () => window.removeEventListener('teacher-incentive-highlight', handleHighlight as any);
  }, []);

  const toggleGoodsStatus = (id: string) => {
    setGoods((prev) =>
      prev.map((g) =>
        g.id === id
          ? {
              ...g,
              status: g.status === 'on' ? 'off' : 'on',
            }
          : g,
      ),
    );
  };

  const handleToggleGoods = (id: string, name: string, status: string) => {
    const next = status === 'on' ? '下架' : '上架';
    if (!confirm(`确认${next}「${name}」？`)) return;
    toggleGoodsStatus(id);
  };

  const handleApprove = (id: string) => {
    setRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'done', handler: '赵老师', handledAt: '立即', reason: '' } : r)),
    );
    alert('已确认核销，状态更新为已完成（前端模拟）');
  };

  const handleReject = (id: string) => {
    const reason = prompt('填写拒绝理由（必填）：', '积分规则不满足');
    if (reason === null || reason.trim() === '') return;
    setRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'rejected', reason, handler: '赵老师', handledAt: '立即' } : r)),
    );
    alert('已拒绝，积分已退回（前端模拟）');
  };

  return (
    <div className="h-full flex flex-col p-6 md:p-8 bg-white">
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">班级激励</p>
          <h2 className="text-2xl font-black text-slate-900">许愿池配置 & 兑换核销</h2>
          <p className="text-sm text-slate-500">PRD: Tab1 商品管理 · Tab2 兑换记录</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-bold flex items-center gap-2">
            <Plus size={16} /> 新建商品
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setTab('store')}
          className={`px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${
            tab === 'store' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          许愿池配置
        </button>
        <button
          onClick={() => setTab('redeem')}
          className={`px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${
            tab === 'redeem' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          兑换核销记录
        </button>
      </div>

      {tab === 'store' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {goods.map((g) => (
            <Card key={g.id} className="p-5 border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-black text-slate-900">{g.name}</h3>
                <span className={`px-2 py-0.5 text-[10px] rounded-full font-black ${g.status === 'on' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  {g.status === 'on' ? '上架' : '下架'}
                </span>
              </div>
              <p className="text-sm text-slate-600 mb-1">所需积分：{g.cost}</p>
              <p className="text-sm text-slate-600 mb-1">库存：{g.stock}</p>
              <p className="text-sm text-slate-600 mb-3">每人限兑：{g.limitPerUser} 次</p>
              <div className="flex items-center gap-2 text-xs font-bold">
                <button className="px-3 py-2 rounded-md bg-slate-900 text-white">编辑</button>
                <button
                  onClick={() => handleToggleGoods(g.id, g.name, g.status)}
                  className="px-3 py-2 rounded-md border border-slate-200 text-slate-700 bg-white flex items-center gap-1"
                >
                  <Power size={14} /> {g.status === 'on' ? '下架' : '上架'}
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === 'redeem' && (
        <div className="overflow-auto border border-slate-200 rounded-xl">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 font-bold">
              <tr>
                <th className="px-4 py-3 text-left">学生</th>
                <th className="px-4 py-3 text-left">兑换商品</th>
                <th className="px-4 py-3 text-left">消耗积分</th>
                <th className="px-4 py-3 text-left">时间</th>
                <th className="px-4 py-3 text-left">状态</th>
                <th className="px-4 py-3 text-left">处理人/时间</th>
                <th className="px-4 py-3 text-left">操作</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => {
                const isPending = r.status === 'pending';
                const rowHighlight = highlightId && highlightId === r.id ? 'bg-amber-50' : '';
                return (
                  <tr key={r.id} className={`border-t border-slate-100 hover:bg-slate-50 ${rowHighlight}`}>
                    <td className="px-4 py-3 text-slate-800 font-bold">{r.student}</td>
                    <td className="px-4 py-3 text-slate-700">{r.item}</td>
                    <td className="px-4 py-3 text-slate-700">{r.points}</td>
                    <td className="px-4 py-3 text-slate-700">{r.time}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {r.status === 'pending' && <span className="px-2 py-0.5 text-[10px] rounded-full bg-amber-100 text-amber-700 font-black">待核销</span>}
                      {r.status === 'done' && <span className="px-2 py-0.5 text-[10px] rounded-full bg-emerald-100 text-emerald-700 font-black">已完成</span>}
                      {r.status === 'rejected' && <span className="px-2 py-0.5 text-[10px] rounded-full bg-red-100 text-red-700 font-black">已拒绝</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-600 text-xs">
                      {r.handler ? `${r.handler} · ${r.handledAt || '刚刚'}` : '-'}
                      {r.reason && <p className="text-[11px] text-red-500 mt-1">理由：{r.reason}</p>}
                    </td>
                    <td className="px-4 py-3 space-x-2">
                      <button
                        disabled={!isPending}
                        onClick={() => handleApprove(r.id)}
                        className="px-3 py-1 rounded-md text-xs font-bold bg-emerald-600 text-white flex items-center gap-1 disabled:opacity-50"
                      >
                        <Check size={14} /> 确认
                      </button>
                      <button
                        disabled={!isPending}
                        onClick={() => handleReject(r.id)}
                        className="px-3 py-1 rounded-md text-xs font-bold bg-white border border-slate-200 text-slate-700 flex items-center gap-1 disabled:opacity-50"
                      >
                        <XCircle size={14} /> 拒绝
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
