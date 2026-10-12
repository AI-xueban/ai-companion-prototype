import React from 'react';
import type { RewardGrantResult } from '../../types/reward';

function summarizeXp(result: RewardGrantResult) {
  const questions = result.xpBreakdown.filter(item => /^第 \d+ 题/.test(item.label));
  const others = result.xpBreakdown.filter(item => !/^第 \d+ 题/.test(item.label));
  return questions.length ? [{ label: '答题基础经验（按题目难度）', value: questions.reduce((sum, item) => sum + item.value, 0) }, ...others] : others;
}

export const RewardBreakdown: React.FC<{ result: RewardGrantResult; compact?: boolean }> = ({ result, compact }) => (
  <div className="space-y-3 text-sm">
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-2xl bg-amber-50 border border-amber-100 p-3 text-slate-700">
        <p className="font-black text-amber-700 mb-2">金币 +{result.coins}</p>
        {result.coinBreakdown.length ? result.coinBreakdown.map((item, index) => <div key={index} className="flex justify-between gap-3 py-1"><span>{item.label}</span><b className="shrink-0">+{item.value}</b></div>) : <p className="text-xs">本次未获得金币</p>}
      </div>
      <div className="rounded-2xl bg-blue-50 border border-blue-100 p-3 text-slate-700">
        <p className="font-black text-blue-700 mb-2">经验 +{result.xp} XP</p>
        {compact && summarizeXp(result).map((item, index) => <div key={index} className="flex justify-between gap-3 py-1"><span>{item.label}</span><b className="shrink-0">{item.value >= 0 ? '+' : ''}{item.value}</b></div>)}
        <details open={!compact}>
          <summary className="cursor-pointer text-xs font-bold">经验计算明细</summary>
          <div className="max-h-36 overflow-y-auto mt-2">{result.xpBreakdown.map((item, index) => <div key={index} className="flex justify-between gap-3 py-1"><span>{item.label}</span><b className="shrink-0">{item.value >= 0 ? '+' : ''}{item.value}</b></div>)}</div>
        </details>
      </div>
    </div>
    <p className="text-xs text-slate-500">今日已获得 {result.coinsToday} / {result.coinsDailyCap} 金币 · 每日金币总上限 150</p>
    {result.skippedReasons.length > 0 && <div className="rounded-xl bg-orange-50 p-3 text-xs text-orange-700 space-y-1">{result.skippedReasons.map((reason, index) => <p key={index}>{reason}</p>)}</div>}
  </div>
);
