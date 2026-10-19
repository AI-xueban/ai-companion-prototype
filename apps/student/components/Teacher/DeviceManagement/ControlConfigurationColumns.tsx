import React from 'react';
import { BorrowSchedule, ControlModule, durationRuleText, DurationRule, schedulePeriodText, StudentControl, weekdayNames, weekdayRangeText } from '../data/hierarchicalDeviceControl';
import { borrowDateSummary, groupBorrowConfigurations } from '../data/borrowingOverview';

type HeaderProps = { module: ControlModule; student: boolean; mode: BorrowSchedule['mode'] };
export const configurationColumnCount = ({ module, student, mode }: HeaderProps) => module === 'duration' ? (student ? 3 : 2) : module === 'borrowing' ? (mode === 'dates' ? 3 : 2) + 2 : module === 'homework' ? 2 + (student ? 2 : 0) : student ? 3 : 2;
const heading = 'px-4 py-3 font-medium whitespace-nowrap';
const cell = 'px-4 py-4 align-top text-slate-700';
const durationDayLabel = (days: number[]) => {
  return weekdayRangeText(days);
};

export const ControlConfigurationHeaders: React.FC<HeaderProps> = ({ module, student, mode }) => <>
  {module === 'duration' ? <><th className={heading}>当前生效规则</th>{!student && <><th className={heading}>说明</th></>}</> : module === 'borrowing' ? <><th className={heading}>{mode === 'weekly' ? '适用星期' : '适用日期'}</th>{mode === 'dates' && <th className={heading}>借用方式</th>}<th className={heading}>借用时段</th>{!student && <><th className={heading}>覆盖人数</th><th className={heading}>说明</th></>}</> : module === 'homework' ? <><th className={heading}>查看答案</th><th className={heading}>查看详解</th></> : <th className={heading}>{module === 'world' ? '权限状态' : '锁屏状态'}</th>}
  {student ? <><th className={heading}>最后操作人</th><th className={heading}>操作时间</th></> : (module === 'world' || module === 'lock') && <th className={heading}>{module === 'world' ? '已开放人数' : '已锁屏人数'}</th>}
</>;

export const ControlConfigurationCells: React.FC<HeaderProps & {
  ids: string[]; controls: Record<string, StudentControl>; onBorrowOverview: () => void;
  defaultDurationEnabled?: boolean; defaultDurationRule?: DurationRule;
}> = ({ module, student, mode, ids, controls, onBorrowOverview, defaultDurationEnabled = false, defaultDurationRule }) => {
  const entries = ids.map(id => controls[id]);
  const modified = entries[0]?.updated[module];
  if (module === 'duration') {
    const effectiveRules = entries.map(entry => weekdayNames.map((_, day) => {
      const rule = entry.durationRules.find(item => item.weekdays.includes(day)) ?? (defaultDurationEnabled ? defaultDurationRule : undefined);
      return rule ? durationRuleText(rule) : '连续 60 分钟 · 休息 15 分钟 · 每日累计 180 分钟 · 不限可用时段';
    }));
    const sample = (effectiveRules[0] ?? []).reduce<Array<{ text: string; days: number[] }>>((groups, text, day) => {
      const group = groups.find(item => item.text === text);
      if (group) group.days.push(day);
      else groups.push({ text, days: [day] });
      return groups;
    }, []);
    const distinct = new Set(effectiveRules.map(rules => JSON.stringify(rules))).size > 1;
    return <>
      <td className={`${cell} min-w-72 max-w-[420px]`}>{sample.map(rule => <div key={`${rule.text}-${rule.days.join('-')}`} className="border-b border-slate-100 py-2 first:pt-0 last:border-0 last:pb-0"><p className="font-semibold text-slate-800">{durationDayLabel(rule.days)}</p><p className="mt-1 text-sm leading-6 text-slate-600">{rule.text}</p></div>)}</td>
      {student ? <><td className={`${cell} whitespace-nowrap`}>{modified?.by ?? '—'}</td><td className={`${cell} min-w-36`}>{modified?.at ?? '—'}</td></> : <><td className={cell}>{distinct ? '学生规则有差异' : '学生规则一致'}</td></>}
    </>;
  }
  if (module === 'borrowing') {
    const groups = groupBorrowConfigurations(ids, controls, mode), main = groups[0];
    const schedules = main?.schedules ?? [], preview = schedules.slice(0, 2), differentCount = ids.length - (main?.studentIds.length ?? 0);
    const configuredCount = entries.filter(s => s.schedules.some(item => item.mode === mode)).length;
    return <>
      <td className={`${cell} min-w-44 max-w-64`}>{preview.length ? <>{preview.map((s, i) => <div key={i} className="flex h-16 items-center border-b border-slate-100 py-2 last:border-0"><span title={borrowDateSummary(s)} className="line-clamp-2">{borrowDateSummary(s)}</span></div>)}{schedules.length > 2 && <button type="button" onClick={onBorrowOverview} className="mt-2 text-xs font-bold text-indigo-600">还有 {schedules.length - 2} 条借用规则 · 查看全部</button>}</> : <span className="text-slate-400">{student ? '未设置借用规则' : '—'}</span>}</td>
      {mode === 'dates' && <td className={`${cell} whitespace-nowrap`}>{preview.length ? preview.map((s, i) => <div key={i} className="flex h-16 items-center border-b border-slate-100 py-2 last:border-0">{s.deny ? '全天禁止借用' : '按时段借用'}</div>) : <span className="text-slate-400">—</span>}</td>}
      <td className={`${cell} min-w-40 max-w-60`}>{preview.length ? preview.map((s, i) => <div key={i} className="flex h-16 items-center border-b border-slate-100 py-2 last:border-0"><span className="line-clamp-2" title={s.deny ? undefined : schedulePeriodText(s)}>{s.deny ? '—' : schedulePeriodText(s)}</span></div>) : <span className="text-slate-400">—</span>}</td>
      {student ? <><td className={`${cell} whitespace-nowrap`}>{modified?.by ?? '—'}</td><td className={`${cell} min-w-36`}>{modified?.at ?? '—'}</td></> : <><td className={`${cell} whitespace-nowrap text-slate-500`}>{configuredCount ? main.studentIds.length : 0}/{ids.length} 人</td><td className={`${cell} whitespace-nowrap`}>{differentCount > 0 ? <span className="text-amber-700">另有 {differentCount} 人配置不同</span> : <span className="text-slate-400">—</span>}</td></>}
    </>;
  }
  const permissionCell = (field: 'answer' | 'explanation') => {
    const count = entries.filter(s => s[field]).length;
    const state = student
      ? count ? '允许' : '不允许'
      : count === 0 ? '全部不允许' : count === ids.length ? '全部允许' : '部分允许';
    return <td className={cell}><span className={`whitespace-nowrap font-medium ${count > 0 && count < ids.length ? 'text-amber-700' : count ? 'text-emerald-700' : 'text-slate-700'}`}>{state}</span>{!student && count > 0 && count < ids.length && <p className="mt-2 whitespace-nowrap text-xs text-slate-500">{count}/{ids.length} 人</p>}</td>;
  };
  const count = entries.filter(s => module === 'world' ? s.world : s.locked).length;
  const word = module === 'world' ? '开放' : '锁屏';
  const state = student ? count ? `已${word}` : module === 'world' ? '已关闭' : '未锁屏' : count === 0 ? module === 'world' ? '全部已关闭' : '全部未锁屏' : count === ids.length ? `全部已${word}` : `部分已${word}`;
  return <>
    {module === 'homework' ? <>{permissionCell('answer')}{permissionCell('explanation')}</> : <td className={cell}><span className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-bold ${count > 0 && count < ids.length ? 'bg-amber-50 text-amber-700' : module === 'lock' && count ? 'bg-red-50 text-red-600' : count ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{state}</span></td>}
    {student ? <><td className={`${cell} whitespace-nowrap`}>{modified?.by ?? '—'}</td><td className={`${cell} min-w-36`}>{modified?.at ?? '—'}</td></> : module !== 'homework' && <td className={`${cell} whitespace-nowrap`}>{count}/{ids.length} 人</td>}
  </>;
};
