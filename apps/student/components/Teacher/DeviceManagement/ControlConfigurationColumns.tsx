import React from 'react';
import { BorrowSchedule, ControlModule, durationRuleText, DurationRule, schedulePeriodText, StudentControl, weekdayNames, weekdayRangeText } from '../data/hierarchicalDeviceControl';
import { borrowDateSummary, groupBorrowConfigurations } from '../data/borrowingOverview';

type HeaderProps = { module: ControlModule; student: boolean; mode: BorrowSchedule['mode'] };
export const configurationColumnCount = ({ module, student, mode }: HeaderProps) => (module === 'duration' ? (student ? 1 : 2) : module === 'borrowing' ? (mode === 'dates' ? 3 : 2) + (student ? 0 : 2) : module === 'homework' ? 2 : 1) + 2;
const heading = 'px-4 py-3 font-medium whitespace-nowrap';
const cell = 'px-4 py-4 align-top text-slate-700';
const durationDayLabel = (days: number[]) => {
  return weekdayRangeText(days);
};

export const ControlConfigurationHeaders: React.FC<HeaderProps> = ({ module, student, mode }) => <>
  {module === 'duration' ? <><th className={heading}>当前生效规则</th>{!student && <><th className={heading}>说明</th></>}</> : module === 'borrowing' ? <><th className={heading}>{mode === 'weekly' ? '适用星期' : '适用日期'}</th>{mode === 'dates' && <th className={heading}>借用方式</th>}<th className={heading}>借用时段</th>{!student && <><th className={heading}>覆盖人数</th><th className={heading}>说明</th></>}</> : module === 'homework' ? <><th className={heading}>查看答案</th><th className={heading}>查看详解</th></> : <th className={heading}>{module === 'world' ? '使用状态' : student ? '锁屏状态' : '临时锁屏状态'}</th>}
  <th className={heading} title="当前范围内该模块最近一次操作的人员">最后操作人</th><th className={heading} title="当前范围内该模块最近一次操作的时间">操作时间</th>
</>;

export const ControlConfigurationCells: React.FC<HeaderProps & {
  ids: string[]; controls: Record<string, StudentControl>; onBorrowOverview: () => void;
  defaultDurationEnabled?: boolean; defaultDurationRule?: DurationRule; temporaryLockState?: "已开启" | "未开启" | "部分开启";
}> = ({ module, student, mode, ids, controls, onBorrowOverview, defaultDurationEnabled = false, defaultDurationRule, temporaryLockState = "未开启" }) => {
  const entries = ids.map(id => controls[id]);
  const modified = entries.reduce<StudentControl['updated'][ControlModule]>((latest, entry) => {
    const operation = entry.updated[module];
    if (!operation) return latest;
    if (!latest) return operation;
    return (Date.parse(operation.at) || 0) > (Date.parse(latest.at) || 0) ? operation : latest;
  }, undefined);
  const operator = modified?.by.match(/^(.*?)\s*([（(][^）)]+[）)])$/);
  const operationCells = <><td className={`${cell} min-w-32 max-w-44 whitespace-normal break-words leading-6`}>{operator ? <>{operator[1]}<span className="block text-xs text-slate-500">{operator[2]}</span></> : modified?.by ?? '—'}</td><td className={`${cell} min-w-44 whitespace-nowrap`}>{modified?.at ?? '—'}</td></>;
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
      {!student && <td className={cell}>{distinct ? '学生规则有差异' : '学生规则一致'}</td>}
      {operationCells}
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
      {!student && <><td className={`${cell} whitespace-nowrap text-slate-500`}>{configuredCount ? main.studentIds.length : 0}/{ids.length} 人</td><td className={`${cell} whitespace-nowrap`}>{differentCount > 0 ? <span className="text-amber-700">另有 {differentCount} 人配置不同</span> : <span className="text-slate-400">—</span>}</td></>}
      {operationCells}
    </>;
  }
  const permissionCell = (field: 'answer' | 'explanation') => {
    const count = entries.filter(s => s[field]).length;
    const state = student
      ? count ? '允许' : '不允许'
      : count === 0 ? '全部不允许' : count === ids.length ? '全部允许' : '部分允许';
    return <td className={cell}><span className={`whitespace-nowrap font-medium ${count > 0 && count < ids.length ? 'text-amber-700' : count ? 'text-emerald-700' : 'text-slate-700'}`}>{state}</span>{!student && count > 0 && count < ids.length && <p className="mt-2 whitespace-nowrap text-xs text-slate-500">{count}/{ids.length} 人</p>}</td>;
  };
  if (module === 'lock' && !student) return <>
    <td className={cell}><span className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-bold ${temporaryLockState === '部分开启' ? 'bg-amber-50 text-amber-700' : temporaryLockState === '已开启' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'}`}>{temporaryLockState}</span></td>
    {operationCells}
  </>;
  const count = entries.filter(s => module === 'world' ? s.world : s.locked).length;

  const state = module === 'world' ? count === 0 ? '禁止使用' : count === ids.length ? '允许使用' : '部分学生允许使用' : student ? count ? '已锁屏' : '未锁屏' : count === 0 ? '全部未锁屏' : count === ids.length ? '全部已锁屏' : '部分已锁屏';
  return <>
    {module === 'homework' ? <>{permissionCell('answer')}{permissionCell('explanation')}</> : <td className={cell}><span className={`whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-bold ${count > 0 && count < ids.length ? 'bg-amber-50 text-amber-700' : module === 'lock' && count ? 'bg-red-50 text-red-600' : count ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{state}</span></td>}
    {operationCells}
  </>;
};
