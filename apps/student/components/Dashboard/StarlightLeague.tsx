import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ArrowRight, ChevronRight, Clock, Trophy, X, Zap, Users, RefreshCw, BarChart3 } from 'lucide-react';
import { createLeagueDemo, evaluateLeague, getVsSummary, LEAGUE_SCENARIOS, weekWindow, type LeagueScenario, type LeagueMember } from '../../services/starlightLeague';

type Props = { open: boolean; onClose: () => void; userName: string; userAvatar: string; weeklyXp: number; totalXp: number; grade: string; persona: string; solo: boolean; suspended: boolean; onExperience: () => void; onStudy: () => void };
const tierLabel = (tier: number) => tier === 9 ? '第 10 阶 · 星光传奇' : `第 ${tier + 1} 阶`;
const sum = (numbers: number[]) => numbers.reduce((a, b) => a + b, 0);
const days = ['一', '二', '三', '四', '五', '六', '日'];
const button = 'rounded-2xl px-6 py-4 text-[22px] font-bold transition hover:brightness-95 focus-visible:ring-4 focus-visible:ring-amber-300';
function Avatar({ member }: { member: LeagueMember }) { return member.avatar.includes('/') ? <img className="h-14 w-14 rounded-2xl object-cover" src={member.avatar} alt={member.name} /> : <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-[32px]">{member.avatar}</span>; }

export function StarlightLeague(props: Props) {
  const defaultScenario: LeagueScenario = props.persona === 'newbie' ? 'new' : props.solo ? 'solo' : 'normal';
  const [scenario, setScenario] = useState<LeagueScenario>(defaultScenario);
  const [view, setView] = useState<'drawer' | 'board' | 'mine' | 'vs' | 'result'>('drawer');
  const [source, setSource] = useState<'drawer' | 'board'>('drawer');
  const [target, setTarget] = useState('');
  const [review, setReview] = useState(false);
  const [retried, setRetried] = useState(false);
  const [clock, setClock] = useState(Date.now());
  const drawerScroll = useRef<HTMLDivElement>(null); const boardScroll = useRef<HTMLDivElement>(null);
  const scrollPositions = useRef({ drawer: 0, board: 0 });
  const season = weekWindow(clock);
  const snapshot = useMemo(() => createLeagueDemo(scenario, props.userName, props.weeklyXp, props.totalXp, props.userAvatar, season.id), [scenario, props.userName, props.weeklyXp, props.totalXp, props.userAvatar, season.id]);
  const result = useMemo(() => evaluateLeague(snapshot.members), [snapshot]);
  const me = result.rows.find(m => m.id === 'me')!;
  const competing = snapshot.eligible && snapshot.members.length > 1;
  const error = scenario === 'error' && !retried;
  const settling = scenario === 'settling';
  const previous = useMemo(() => {
    const demo = createLeagueDemo('normal', props.userName, 3050, props.totalXp, props.userAvatar, weekWindow(season.start - 1).id);
    return evaluateLeague(demo.members.map(m => m.id === 'me' ? { ...m, tier: 2 } : m));
  }, [props.userName, props.totalXp, props.userAvatar, season.start]);
  useEffect(() => { if (!props.open) { setView('drawer'); setTarget(''); setReview(false); scrollPositions.current = { drawer: 0, board: 0 }; } }, [props.open]);
  useEffect(() => { const id = window.setInterval(() => setClock(Date.now()), 30_000); return () => clearInterval(id); }, []);
  useEffect(() => {
    const element = view === 'drawer' ? drawerScroll.current : view === 'board' ? boardScroll.current : null;
    if (element) element.scrollTop = scrollPositions.current[view as 'drawer' | 'board'];
  }, [view, props.suspended]);
  const details = (m: LeagueMember, from: 'drawer' | 'board') => { setSource(from); setTarget(m.id); setView(m.id === 'me' ? 'mine' : 'vs'); };
  const choose = (next: LeagueScenario) => { setScenario(next); setRetrriedAndView(); };
  function setRetrriedAndView() { setRetried(false); setView('board'); setTarget(''); scrollPositions.current = { drawer: 0, board: 0 }; }
  const displayDate = (time: number) => new Date(time).toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai', month: 'numeric', day: 'numeric' });
  const remaining = Math.max(0, season.end - clock); const remainingDays = Math.floor(remaining / 86400_000); const remainingHours = Math.floor(remaining / 3600_000) % 24;
  const totalMinutes = sum(me.minutes); const effectiveDays = me.minutes.filter(v => v > 0).length;

  const row = (m: typeof me, from: 'drawer' | 'board') => <button key={m.id} onClick={() => details(m, from)} aria-label={m.id === 'me' ? '查看我的学习详情' : `与${m.name}对比`} className={`flex w-full items-center gap-5 rounded-2xl border px-6 py-4 text-left ${m.id === 'me' ? 'border-amber-300 bg-amber-50' : 'border-slate-100 bg-white hover:bg-slate-50'}`}>
    <span className="w-12 text-[26px] font-black text-slate-400">{m.rank}</span><Avatar member={m} />
    <span className="min-w-0 flex-1"><span className="flex items-center gap-3 text-[24px] font-bold text-slate-800">{m.name}{m.id === 'me' && <small className="rounded-lg bg-amber-200 px-2 py-1 text-[15px] text-amber-900">我</small>}</span>
      <span className="mt-1 block text-[18px] text-slate-500">{tierLabel(m.tier)} · {m.gap === undefined ? '当前最高分' : `距上一档 ${m.gap - m.xp} XP`}{result.rows.some(o => o.id !== m.id && o.xp === m.xp) ? ' · 并列' : ''}</span></span>
    <span className="text-right"><b className="block text-[28px] text-slate-900">{m.xp.toLocaleString()} <small className="text-[17px] text-slate-400">XP</small></b><span className={`text-[17px] ${m.promote ? 'text-emerald-600' : 'text-slate-400'}`}>{m.promote ? '预计晋级' : m.tier === 9 ? '最高段位' : '段位保持'}</span></span><ChevronRight size={22} className="text-slate-300" />
  </button>;
  const noContest = <div className="rounded-3xl border border-amber-100 bg-amber-50/70 px-10 py-12 text-center"><Users className="mx-auto mb-5 text-amber-500" size={50} /><h3 className="text-[32px] font-black text-slate-800">{snapshot.eligible ? '暂时只有你一位参赛同学' : '积累经验，开启下一周的比赛'}</h3><p className="mx-auto mt-5 max-w-3xl text-[23px] leading-relaxed text-slate-500">{snapshot.eligible ? '本周展示个人成绩，已有段位保留。下周重新匹配同年级伙伴，不生成虚拟对手。' : '上周没有到账 XP，本周不临时入组。签到或学习获得 XP 后，最早下周参赛，已有段位保留。'}</p><div className="my-8 text-[44px] font-black text-amber-600">{me.xp.toLocaleString()} <span className="text-[22px]">本周 XP</span></div><button className={`${button} bg-slate-900 text-white`} onClick={() => { props.onClose(); props.onStudy(); }}>去学习获得经验 <ArrowRight className="inline" size={22} /></button></div>;
  const loading = <div className="rounded-3xl bg-slate-50 p-12 text-center"><RefreshCw className="mx-auto animate-spin text-amber-500" size={48} /><h3 className="mt-6 text-[30px] font-bold">赛季结算中</h3><p className="mt-4 text-[22px] text-slate-500">正在确认上一周赛果并生成新分组。本周到账 XP 正常累计，不会丢失。</p><button className={`${button} mt-8 bg-white text-slate-700`} onClick={() => choose('normal')}>刷新本周榜单</button></div>;
  const failed = <div role="alert" className="rounded-3xl bg-rose-50 p-12 text-center"><h3 className="text-[30px] font-bold text-slate-800">暂时无法获取本周榜单</h3><p className="mt-4 text-[22px] text-slate-500">请求失败不表示你没有参赛资格，请重试。</p><button className={`${button} mt-8 bg-slate-900 text-white`} onClick={() => setRetried(true)}>重试榜单</button></div>;
  const overview = <div className="grid grid-cols-3 gap-5">{[...new Set(result.rows.filter(m => m.rank <= 3).map(m => m.xp))].map(score => {
    const tied = result.rows.filter(m => m.xp === score); return <div key={score} style={{ background: 'linear-gradient(180deg, #fffbeb, #ffffff)' }} className="rounded-3xl border border-amber-100 px-7 py-6"><div className="flex items-center gap-3 text-[20px] font-bold text-amber-700"><Trophy size={23} />{tied[0].rank === 1 ? '领先成绩' : `第 ${tied[0].rank} 名`}</div><b className="mt-3 block text-[38px] text-slate-900">{score.toLocaleString()} <small className="text-[19px] text-slate-400">XP</small></b><p className="mt-2 text-[19px] text-slate-500">{tied.length > 1 ? `${tied.length} 人并列第 ${tied[0].rank} 名` : tied[0].name}</p></div>;
  })}</div>;
  const rule = <div className="rounded-2xl bg-indigo-50 px-7 py-5 text-[19px] leading-relaxed text-indigo-800"><b>只升不降</b> · 正分且未满级的候选 {result.E} 人，本周最多 {result.K} 人晋级。边界同分保持，空缺不递补。<span className="block text-indigo-500">按当前成绩预计，最终以结算为准。榜单第一不一定晋级，周冠军按全组成绩独立评定。</span></div>;

  function profile() {
    let summaries: ReturnType<typeof getVsSummary> = [];
    let failure = '';
    if (view === 'vs') {
      try {
        if (scenario === 'vsError' && !retried) throw new Error('暂时无法获取对比数据，请重试');
        summaries = getVsSummary(snapshot, 'me', target, scenario === 'expired' ? `${season.id}-updated` : season.id);
      } catch (e) { failure = (e as Error).message; }
    } else summaries = [{ id: 'me', name: props.userName, xp: me.xp, minutes: totalMinutes, days: effectiveDays, dailyXp: me.dailyXp, dailyMinutes: me.minutes }];
    if (failure) return <div role="alert" className="rounded-3xl bg-rose-50 p-12 text-center"><h3 className="text-[30px] font-bold">{failure}</h3><button className={`${button} mt-8 bg-slate-900 text-white`} onClick={() => scenario === 'expired' ? choose('normal') : setRetried(true)}>{scenario === 'expired' ? '返回本周榜单' : '重试对比'}</button></div>;
    const other = summaries[1];
    return <><div className={`grid gap-7 ${other ? 'grid-cols-2' : 'grid-cols-1'}`}>{summaries.map(s => <section key={s.id} className="rounded-3xl border border-slate-100 bg-white p-8"><div className="mb-7 flex items-center justify-between"><h3 className="text-[30px] font-black">{s.id === 'me' ? '我' : s.name}</h3><span className="rounded-xl bg-slate-100 px-4 py-2 text-[17px] text-slate-500">本周汇总</span></div><div className="grid grid-cols-3 gap-5"><Metric label="赛事 XP" value={s.xp.toLocaleString()} unit="XP" /><Metric label="学习时长" value={String(s.minutes)} unit="分钟" /><Metric label="有效学习" value={String(s.days)} unit="天" /></div></section>)}</div>
      {other && <div className="my-6 rounded-2xl bg-amber-50 px-8 py-5 text-[22px] text-amber-900">与 {other.name} 的差距：XP {me.xp - other.xp >= 0 ? '+' : ''}{me.xp - other.xp} · 学习时长 {totalMinutes - other.minutes >= 0 ? '+' : ''}{totalMinutes - other.minutes} 分钟 · 有效学习 {effectiveDays - other.days >= 0 ? '+' : ''}{effectiveDays - other.days} 天</div>}
      <div className="mt-7 grid grid-cols-2 gap-7">{(['xp', 'minutes'] as const).map(kind => <div key={kind} className="rounded-3xl border border-slate-100 bg-white p-8"><h3 className="text-[25px] font-bold">{kind === 'xp' ? '每日到账 XP' : '每日学习时长（分钟）'}</h3><p className="mt-2 text-[17px] text-slate-400">{kind === 'xp' ? '按到账日期统计' : '按实际学习日期统计'}</p><div className="mt-6 flex gap-5 text-[17px]">{summaries.map((s, i) => <span key={s.id} className={i === 0 ? 'text-indigo-600' : 'text-amber-600'}>● {s.id === 'me' ? '我' : s.name}</span>)}</div><div className="mt-8 flex h-64 items-end gap-4">{days.map((day, i) => <div key={day} className="flex flex-1 flex-col items-center gap-3"><div className="flex h-52 w-full items-end justify-center gap-1.5">{summaries.map((s, index) => {
        const data = kind === 'xp' ? s.dailyXp : s.dailyMinutes; const maximum = Math.max(1, ...summaries.flatMap(v => kind === 'xp' ? v.dailyXp : v.dailyMinutes));
        return <div key={s.id} title={`${s.name} 周${day}：${data[i]}`} className={`relative w-5 rounded-t-lg ${index === 0 ? 'bg-indigo-400' : 'bg-amber-400'}`} style={{ height: `${data[i] / maximum * 85}%`, minHeight: data[i] ? 5 : 0 }}><span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[14px] text-slate-500">{data[i]}</span></div>;
      })}</div><span className="text-[18px] text-slate-400">{day}</span></div>)}</div></div>)}</div>
      <p className="mt-7 text-[19px] text-slate-400">{!other && <span className="mr-6">历史累计学习 14 天（演示）</span>}{other ? '仅展示当前同组成员的本周汇总，不开放答题、错题、聊天、联系方式或经验流水。' : '学习时间与经验到账时间可能不同，离线 XP 同步到账后计入到账当天。'}</p></>;
  }

  const priorMe = previous.rows.find(m => m.id === 'me')!;
  const content = view === 'result' ? <><div style={{ background: 'linear-gradient(135deg, #fef3c7, #fff7ed, #ffffff)' }} className="rounded-3xl p-12 text-center"><span className="text-[22px] font-bold text-amber-700">上一赛季 · {displayDate(season.start - 7 * 86400_000)}—{displayDate(season.start - 1)}</span><Trophy size={70} className="mx-auto my-7 text-amber-500" /><h3 className="text-[44px] font-black">{priorMe.promote ? '上周晋一级，继续向前！' : '已有段位保留，下一周再出发'}</h3><p className="mt-4 text-[25px] text-slate-600">{tierLabel(priorMe.tier)} <ArrowRight className="mx-4 inline" /> {tierLabel(priorMe.nextTier)}</p><div className="mx-auto mt-9 grid max-w-3xl grid-cols-3 gap-7"><Metric label="最终名次" value={`第 ${priorMe.rank}`} unit="名" /><Metric label="最终 XP" value={String(priorMe.xp)} unit="XP" /><Metric label="晋级结果" value={priorMe.promote ? '晋一级' : '保持'} unit="" /></div><p className="mt-8 text-[23px] text-emerald-700">{priorMe.reason}</p><p className="mt-3 text-[22px] text-slate-500">{previous.championReason}</p><p className="mt-3 text-[21px] text-slate-500">本周状态：{!snapshot.eligible ? '未参赛' : competing ? '已加入同年级小组' : '个人周成绩'} · 历史赛果不因查看或刷新重复发奖</p></div><p className="mt-6 text-[18px] text-slate-400">赛果为独立的上一周演示快照，不将当前尚未结束的比赛提前结算。</p></> : view === 'mine' || view === 'vs' ? profile() : error ? failed : settling ? loading : !competing ? noContest : <div className="space-y-6">{view === 'board' && overview}{rule}<div className="space-y-3">{(view === 'drawer' ? result.rows.slice(0, 6) : result.rows).map(m => row(m, view === 'drawer' ? 'drawer' : 'board'))}</div></div>;
  if (!props.open || props.suspended) return null;
  const drawer = view === 'drawer';
  return createPortal(<div className="absolute left-0 top-0 z-[630] font-sans text-slate-800" style={{ width: '300%', height: '300%', transform: 'scale(0.3333333333)', transformOrigin: 'top left' }}><button aria-label="关闭星光学榜遮罩" onClick={props.onClose} className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" />
    <section role="dialog" aria-modal="true" aria-label={view === 'vs' ? '同组 VS 对比' : '星光学榜'} className={`absolute flex flex-col overflow-hidden border border-white/60 bg-[#F8FAFC] shadow-2xl ${drawer ? 'inset-y-0 right-0 w-[820px] rounded-l-[40px]' : 'inset-12 rounded-[40px]'}`}>
      <header className="shrink-0 border-b border-slate-100 bg-white px-10 py-7"><div className="flex items-center justify-between gap-5"><div className="flex items-center gap-5">{!drawer && <button className="rounded-2xl bg-slate-100 p-4" aria-label="返回来源榜单" onClick={() => setView(view === 'board' ? 'drawer' : source)}><ArrowLeft size={30} /></button>}<div><h2 className="text-[36px] font-black tracking-tight">{view === 'vs' ? `我 VS ${snapshot.members.find(m => m.id === target)?.name ?? '同组成员'}` : view === 'mine' ? '我的学习详情' : view === 'result' ? '赛季结果' : '星光学榜'}</h2><p className="mt-2 flex items-center gap-3 text-[20px] text-slate-500"><Clock size={20} />{props.grade || '同年级'} · {view === 'result' ? `上一赛季 ${displayDate(season.start - 7 * 86400_000)}—${displayDate(season.start - 1)}` : `${displayDate(season.start)}—${displayDate(season.end - 1)} · ${remainingDays} 天 ${remainingHours} 小时后结束`}</p></div></div><button aria-label="关闭星光学榜" onClick={props.onClose} className="rounded-2xl bg-slate-100 p-4"><X size={30} /></button></div>
        <div className="mt-6 flex items-center justify-between"><div className="flex gap-3"><span className="rounded-xl bg-amber-50 px-4 py-2 text-[19px] font-bold text-amber-700">{tierLabel(me.tier)} · 只升不降</span><span className="rounded-xl bg-slate-100 px-4 py-2 text-[18px] text-slate-500">{competing ? `${snapshot.members.length} 人小组` : '个人周成绩'}</span></div><span className="text-[16px] text-slate-400">交互演示数据</span></div>
      {view === 'board' && <div aria-label="学榜段位晋级路径" className="mt-5 flex items-center gap-3">{Array.from({length:10},(_,i)=><span key={i} className={`flex h-8 w-8 items-center justify-center rounded-full text-[15px] font-bold ${i === me.tier ? 'bg-amber-400 text-slate-900' : i < me.tier ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-400'}`}>{i+1}</span>)}<span className="ml-2 text-[17px] text-slate-400">晋级路径 · 每周最多升一级</span></div>}
      </header>
      <div ref={drawer ? drawerScroll : boardScroll} onScroll={e => { if (view === 'drawer' || view === 'board') scrollPositions.current[view] = e.currentTarget.scrollTop; }} className="min-h-0 flex-1 overflow-y-auto px-10 py-7">{content}</div>
      <footer className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-t border-slate-100 bg-white px-10 py-5"><div className="flex gap-3"><button className={`${button} bg-slate-100 text-slate-600`} onClick={() => { setSource(drawer ? 'drawer' : 'board'); setView('result'); }}>上周赛果</button><button className={`${button} bg-slate-100 text-slate-600`} onClick={props.onExperience}>我的经验</button></div>{drawer && <button className={`${button} bg-slate-900 text-white`} onClick={() => setView('board')}>查看完整榜单 <ChevronRight className="inline" size={23} /></button>}{import.meta.env.DEV && <button className="text-[16px] text-slate-400 underline" onClick={() => setReview(v => !v)}>演示状态</button>}</footer>
      {review && <div className="shrink-0 border-t border-indigo-100 bg-indigo-50 px-10 py-5"><p className="mb-3 text-[18px] font-bold text-indigo-700">验收控制区 · 不属于学生业务界面</p><div className="flex flex-wrap gap-2">{LEAGUE_SCENARIOS.map(([id, label]) => <button key={id} aria-pressed={scenario === id} className={`rounded-lg px-4 py-2 text-[17px] ${scenario === id ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-700'}`} onClick={() => choose(id)}>{label}</button>)}</div></div>}
    </section></div>, document.getElementById('app-viewport') || document.body);
}
function Metric({ label, value, unit }: { label: string; value: string; unit: string }) { return <div><p className="text-[18px] text-slate-400">{label}</p><p className="mt-3 text-[36px] font-black text-slate-900">{value}<small className="ml-2 text-[17px] font-medium text-slate-400">{unit}</small></p></div>; }
