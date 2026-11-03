import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { RewardGrantResult } from '../../types/reward';

function shortRewardLabel(label: string) {
  if (/^第 \d+ 题/.test(label)) return '答题经验';
  if (label.includes('保底经验')) return '练习鼓励';
  if (label.includes('重复练习')) return '重复练习减半';
  if (label.includes('经验减半')) return '额外日课减半';
  if (label.includes('超时提交')) return '超时减少 10%';
  if (label.includes('满分加成')) return '全对奖励';
  if (label.includes('高正确率加成')) return '高正确率奖励';
  if (/^攻克 \d+ 道错题/.test(label)) return '订正奖励';
  if (/^首次消灭/.test(label)) return '首次订正奖励';
  if (/^答对 \d+ 题/.test(label)) return label.split(' ×')[0];
  if (label === '今日首次完美通关') return '今日首次全对';
  if (label === '完成每日攻克任务') return '完成每日复习';
  return label;
}

function shortReason(reason: string) {
  if (reason.includes('重复刷')) return '同一套题的金币已领取';
  if (reason.includes('上限')) return '今日金币已达上限';
  if (reason.includes('已完成 3 个日课')) return '今日 3 次日课金币已领完';
  if (reason.includes('完美通关')) return '今日全对奖励已领取';
  if (reason.includes('每日攻克')) return '今日复习奖励已领取';
  return reason;
}

function summarizeRows(items: { label: string; value: number }[]) {
  const rows = new Map<string, number>();
  items.forEach(item => {
    const label = shortRewardLabel(item.label);
    rows.set(label, (rows.get(label) ?? 0) + item.value);
  });
  return Array.from(rows, ([label, value]) => ({ label, value })).filter(item => item.value !== 0);
}

export function RewardDetailsDialog({ result, onClose }: { result: RewardGrantResult; onClose: () => void }) {
  const target = document.getElementById('app-viewport') || document.body;
  const reasons = [...new Set(result.skippedReasons.map(shortReason))];
  const coinRows = summarizeRows(result.coinBreakdown);
  const xpRows = summarizeRows(result.xpBreakdown);
  return createPortal(
    <div className="absolute inset-0 z-[980] flex items-center justify-center bg-slate-900/40 p-6" onClick={onClose} onKeyDown={event => { if (event.key === 'Escape') onClose(); }}>
      <section role="dialog" aria-modal="true" aria-label="奖励明细" className="relative max-h-full w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-6 shadow-xl" onClick={event => event.stopPropagation()}>
        <button autoFocus type="button" aria-label="关闭奖励明细" onClick={onClose} className="absolute right-4 top-4 rounded-full p-2 text-slate-500 hover:bg-slate-100"><X size={20} /></button>
        <h2 className="mb-5 pr-10 text-lg font-black text-slate-800">奖励明细</h2>
        <div className="grid grid-cols-2 gap-3 text-sm text-slate-700">
          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
            <p className="mb-3 font-bold text-amber-700">金币 +{result.coins}</p>
            {coinRows.map(item => <div key={item.label} className="flex justify-between gap-3 py-1"><span>{item.label}</span><b>+{item.value}</b></div>)}
            {!coinRows.length && !reasons.length && <p className="text-xs text-slate-500">{result.invalidLearning ? '认真作答后再领取奖励' : '本次暂无金币'}</p>}
            {reasons.map(reason => <p key={reason} className="mt-2 text-xs leading-relaxed text-amber-700">{reason}</p>)}
          </div>
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <p className="mb-3 font-bold text-blue-700">经验 +{result.xp} XP</p>
            {xpRows.map(item => <div key={item.label} className="flex justify-between gap-3 py-1"><span>{item.label}</span><b className="shrink-0">{item.value > 0 ? '+' : ''}{item.value}</b></div>)}
            {!xpRows.length && <p className="text-xs text-slate-500">本次暂无经验</p>}
          </div>
        </div>
        <p className="mt-4 text-xs text-slate-500">今日金币 {result.coinsToday} / {result.coinsDailyCap}</p>
      </section>
    </div>, target,
  );
}
