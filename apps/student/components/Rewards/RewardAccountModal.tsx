import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Coins, Zap, ShoppingBag, ChevronDown, ArrowRight, CircleCheck } from 'lucide-react';
import type { WishApplication } from '../../data/wishPoolStudentData';
import type { UserStats } from '../../types';
import { getRewardHistory } from '../../services/rewardHistoryService';
import { getCoinsToday } from '../../services/rewardService';
import { coinLearningRules, xpLearningRules, coinRewardNotes, xpRewardNotes } from '../../data/rewardRules';
import { RewardBreakdown } from './RewardBreakdown';
import { getDemoCoinExpenseHistory, getDemoCoinIncomeHistory } from '../../data/rewardHistoryDemoData';

export const RewardAccountModal: React.FC<{ asset: 'coins' | 'xp' | null; stats: UserStats; wishApplications: WishApplication[]; onClose: () => void; onOpenStore: () => void }> = ({ asset, stats, wishApplications, onClose, onOpenStore }) => {
  const [tab, setTab] = useState<'records' | 'rules'>('records');
  const [filter, setFilter] = useState<'all' | 'income' | 'expense' | 'frozen'>('all');
  useEffect(() => { setTab('records'); setFilter('all'); }, [asset]);
  if (!asset) return null;
  const coins = asset === 'coins';
  const history = getRewardHistory().filter(entry => {
    const application = coins && entry.wishApplicationId ? wishApplications.find(item => item.id === entry.wishApplicationId) : undefined;
    return !application || application.status === 'done';
  });
  const accountHistory = [...history];
  if (coins && !history.some(entry => entry.coins > 0)) accountHistory.push(...getDemoCoinIncomeHistory());
  if (coins && !history.some(entry => entry.coins < 0)) accountHistory.push(...getDemoCoinExpenseHistory());
  const entries = accountHistory.filter(entry => {
    if (!coins) return entry.xp !== 0;
    return entry.coins !== 0 && (filter === 'all' || (filter === 'income' && entry.coins > 0) || (filter === 'expense' && entry.coins < 0));
  });
  const rules = coins ? coinLearningRules : xpLearningRules;
  const reminders = coins ? coinRewardNotes : xpRewardNotes;
  const todayCoins = Math.min(150, Math.max(0, getCoinsToday()));
  const remainingCoins = 150 - todayCoins;
  const pendingApplications = wishApplications.filter(application => application.status === 'pending');
  const pendingCoins = pendingApplications.reduce((sum, application) => sum + application.price, 0);
  const dateKey = (timestamp: number) => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Shanghai' }).format(timestamp);
  const todayKey = dateKey(Date.now());
  const yesterdayKey = dateKey(Date.now() - 86400000);
  const recordGroups = coins ? ['今天', '昨天', '更早'].map(label => ({ label, entries: entries.filter(entry => {
    const day = dateKey(entry.timestamp);
    return label === '今天' ? day === todayKey : label === '昨天' ? day === yesterdayKey : day !== todayKey && day !== yesterdayKey;
  }).sort((a, b) => b.timestamp - a.timestamp) })).filter(group => group.entries.length) : [{ label: '', entries }];
  const renderRule = ([title, amount, description]: (typeof rules)[number]) => <article key={title} className="rounded-2xl bg-white border border-slate-100 p-4"><div className="flex justify-between gap-4"><b>{title}</b><span className="text-indigo-600 font-black text-sm shrink-0">{amount}</span></div><p className="text-sm text-slate-500 mt-2 leading-relaxed">{description}</p></article>;
  const target = document.getElementById('app-viewport') || document.body;
  return createPortal(
    <div className="absolute inset-0 z-[230] bg-[#F5F7FB] flex flex-col text-slate-800">
      <header className="shrink-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between">
        <button onClick={coins && tab === 'rules' ? () => setTab('records') : onClose} className="flex items-center gap-2 font-black"><ArrowLeft size={20} />{coins ? tab === 'rules' ? '获取规则' : '我的金币' : '我的经验'}</button>
        {coins && tab === 'records' && <button onClick={onOpenStore} className="flex items-center gap-2 text-sm font-bold text-indigo-600"><ShoppingBag size={16} />去兑换</button>}
      </header>
      <main className="flex-1 min-h-0 overflow-y-auto p-6"><div className="max-w-3xl mx-auto space-y-5">
        {!(coins && tab === 'rules') && (coins ? <section className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-6 items-center">
            <div><div className="flex items-center gap-3"><span className="flex items-center gap-1.5 text-xs font-bold text-amber-800"><Coins size={16} />可用金币</span><button onClick={() => setTab('rules')} className="flex items-center gap-0.5 text-[11px] text-amber-700 hover:text-amber-900">获取规则<ArrowRight size={12} /></button></div><p className="mt-1 text-[28px] leading-tight font-black text-amber-900 tabular-nums">{stats.coins}<span className="text-xs ml-1.5">金币</span></p></div>
            <div className="border-l border-amber-200 pl-5"><div className="flex items-center justify-between gap-2 text-xs text-amber-800"><span>今日获得</span><b className="tabular-nums">{todayCoins} / 150</b></div><div className="mt-2 h-1.5 bg-amber-200 rounded-full overflow-hidden"><div className="h-full bg-amber-500 rounded-full" style={{ width: `${todayCoins / 150 * 100}%` }} /></div><div className="mt-2 flex items-center justify-between gap-2"><p className="text-[11px] text-amber-700">{remainingCoins > 0 ? `今日还可获得 ${remainingCoins} 金币` : '今日已达上限，经验继续积累'}</p></div></div>
          </div>
          {pendingCoins > 0 && <button onClick={() => setFilter('frozen')} className="mt-3 flex items-center gap-1 text-xs text-amber-800">冻结中 <b className="tabular-nums">{pendingCoins}</b> 金币<ArrowRight size={12} /></button>}
        </section> : <section className="grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] items-center gap-6 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 px-5 py-4 text-white">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-white/85"><Zap size={16} />终身累计经验</div>
            <p className="mt-1 text-[28px] leading-tight font-black tabular-nums">{stats.totalXp ?? stats.xpToday}<span className="ml-1.5 text-xs font-bold">经验值（XP）</span></p>
          </div>
          <div className="min-w-0 border-l border-white/20 pl-5">
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div><p className="text-white/75">今日获得</p><p className="mt-1 font-bold tabular-nums">{stats.xpToday} 经验值（XP）</p></div>
              <div><p className="text-white/75">本周获得</p><p className="mt-1 font-bold tabular-nums">{stats.weeklyXp} 经验值（XP）</p></div>
              <div><p className="text-white/75">今日目标</p><p className="mt-1 font-bold tabular-nums">{stats.xpTarget} 经验值（XP）</p></div>
            </div>
            <div className="mt-2 h-1 bg-white/25 rounded-full overflow-hidden"><div className="h-full bg-white rounded-full" style={{ width: `${Math.min(100, stats.xpToday / Math.max(1, stats.xpTarget) * 100)}%` }} /></div>
          </div>
        </section>)}
        {!coins && <nav className="flex gap-2" aria-label="奖励账户内容">{(['records', 'rules'] as const).map(value => <button key={value} onClick={() => setTab(value)} className={`rounded-xl px-5 py-2 font-bold ${tab === value ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500'}`}>{value === 'records' ? '经验记录' : '获取规则'}</button>)}</nav>}
        {tab === 'rules' ? <section className="space-y-3">
          <div><h2 className="font-black text-slate-800">{coins ? '认真学，攒金币' : '每一次进步，都在积累经验'}</h2><p className="mt-1 text-sm text-slate-500">{coins ? '答题、复盘、闯关，攒金币兑换喜欢的装扮。' : '经验值（XP） 帮助你提升等级，终身保留，没有每日总上限。'}</p></div>
          {coins && <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800"><b>每天学习最多获得 150 金币</b><p className="mt-1">达到上限后，明天可以继续获取。经验值照常增加哦！</p></div>}
          {(coins ? rules.slice(0, 4) : rules).map(renderRule)}
          {coins && <details className="rounded-2xl bg-white border border-slate-100 p-4"><summary className="cursor-pointer text-sm font-bold text-slate-700">更多金币奖励</summary><div className="mt-3 space-y-3">{rules.slice(4).map(renderRule)}</div></details>}
          {coins ? <section className="border-l-4 border-blue-200 bg-[#EAF4FF] p-4" aria-labelledby="coin-faq-title">
            <div className="mb-4 flex flex-wrap items-center gap-x-5 gap-y-1"><h3 id="coin-faq-title" className="font-bold text-slate-800">常见问题</h3><p className="text-xs text-slate-400">点击问题，了解不同情况下的领取方式</p></div>
            <div className="grid grid-cols-2 gap-4">{reminders.map(([title, amount, description], index) => <details key={title} open className="group rounded-2xl bg-white px-4 py-4">
              <summary className="flex cursor-pointer list-none items-center gap-2 [&::-webkit-details-marker]:hidden"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-sm text-blue-500">{String(index + 1).padStart(2, '0')}</span><h4 className="min-w-0 flex-1 text-sm font-medium text-slate-700">{title}</h4><span className="shrink-0 rounded-full bg-blue-50 px-2 py-1 text-[10px] text-blue-400">{amount}</span></summary>
              <p className="mt-3 border-t border-slate-100 pt-3 text-xs leading-6 text-slate-500">{description}</p>
            </details>)}</div>
          </section> : <details className="rounded-2xl bg-slate-100/70 border border-slate-200 p-4"><summary className="cursor-pointer text-sm font-bold text-slate-600">奖励小提醒 · 限领与练习说明</summary><div className="mt-4 space-y-4">{reminders.map(([title, amount, description]) => <div key={title}><p className="text-sm font-bold text-slate-700">{title}<span className="ml-2 font-medium text-slate-500">{amount}</span></p><p className="mt-1 text-sm text-slate-500 leading-relaxed">{description}</p></div>)}</div></details>}
        </section> : <section className="space-y-3">
          {coins && <nav className="flex gap-2" aria-label="金币明细筛选">{(['all', 'expense', 'income', 'frozen'] as const).map(value => <button key={value} onClick={() => setFilter(value)} aria-pressed={filter === value} className={`px-4 py-1.5 rounded-full text-sm ${filter === value ? 'bg-slate-800 text-white' : 'bg-white text-slate-500'}`}>{value === 'all' ? '全部明细' : value === 'income' ? '获取明细' : value === 'frozen' ? '冻结明细' : '支出明细'}</button>)}</nav>}
          {coins && (filter === 'all' || filter === 'frozen') && pendingApplications.map(application => <details key={application.id} className="group rounded-2xl border border-slate-100 bg-white p-4"><summary className="flex cursor-pointer list-none items-center justify-between gap-4"><div><p className="text-sm font-bold">许愿池兑换 · {application.goodsName}<span className="ml-2 text-[10px] font-normal text-amber-700">待老师确认</span></p><p className="mt-1 text-xs text-slate-400">申请时间 {application.appliedAt}</p></div><div className="flex shrink-0 items-center gap-3"><b className="text-sm text-amber-700 tabular-nums">冻结 {application.price} 金币</b><ChevronDown size={15} className="text-slate-400 transition-transform group-open:rotate-180" /></div></summary><p className="mt-3 text-xs leading-relaxed text-slate-500">申请期间，这些金币暂时不能使用。老师确认后转为支出；未通过时解除冻结，金币退回可用余额。</p></details>)}
          {!entries.length && !(coins && (filter === 'all' || filter === 'frozen') && pendingApplications.length) && <div className="bg-white rounded-2xl py-10 text-center text-sm text-slate-500">{coins ? (filter === 'frozen' ? '暂无冻结记录' : filter === 'income' ? '暂无获取记录' : filter === 'expense' ? '暂无支出记录' : '还没有金币明细') : '暂无经验记录'}<p className="text-xs mt-2">{coins && filter === 'frozen' ? '等待老师确认的兑换申请，会显示在这里。' : coins && filter === 'expense' ? '兑换或捐赠金币后，可以在这里查看。' : '完成学习后，可在这里查看奖励来源。'}</p></div>}
          {recordGroups.map(group => <div key={group.label} className="space-y-2">{group.label && <h2 className="pt-2 px-1 text-xs font-bold text-slate-500">{group.label}</h2>}{group.entries.map(entry => { const completed = entry.title.endsWith('（已完成）') || Boolean(entry.wishApplicationId && wishApplications.some(application => application.id === entry.wishApplicationId && application.status === 'done')); const Record = entry.result ? 'details' : 'div'; const RecordHeader = entry.result ? 'summary' : 'div'; return <Record key={entry.id} className="group rounded-2xl bg-white border border-slate-100 p-4"><RecordHeader className={`${entry.result ? 'cursor-pointer ' : ''}list-none flex items-center justify-between gap-4`}><div className="min-w-0"><p className="flex items-center gap-2 text-sm font-bold"><span>{entry.title.replace(/（已完成）$/, '')}</span>{completed && <span className="inline-flex shrink-0 text-emerald-600" role="img" aria-label="已完成" title="已完成"><CircleCheck size={16} strokeWidth={2.5} aria-hidden="true" /></span>}</p><p className="text-xs text-slate-400 mt-1">{new Date(entry.timestamp).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false, ...(coins && group.label !== '更早' ? { hour: '2-digit', minute: '2-digit' } : { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) })}</p></div><div className="flex items-center gap-3 shrink-0"><b className={`text-sm tabular-nums ${coins ? entry.coins > 0 ? 'text-amber-600' : 'text-slate-600' : 'text-blue-600'}`}>{(coins ? entry.coins : entry.xp) > 0 ? '+' : ''}{coins ? entry.coins : entry.xp}{coins ? ' 金币' : ' 经验值（XP）'}</b>{entry.result && <ChevronDown size={15} className="text-slate-400 transition-transform group-open:rotate-180" />}</div></RecordHeader>{entry.result && <div className="mt-4"><RewardBreakdown result={entry.result} compact /></div>}</Record>; })}</div>)}
        </section>}
      </div></main>
    </div>, target,
  );
};
