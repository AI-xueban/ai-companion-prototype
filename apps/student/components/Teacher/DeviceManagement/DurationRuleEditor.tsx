import React, { useRef, useState } from 'react';
import { X } from 'lucide-react';
import { DurationRule, weekdayNames } from '../data/hierarchicalDeviceControl';
import { validateDurationRuleSet } from '../data/durationRuleSets';
import { DeviceControlLayer } from './DeviceControlLayer';
import { ControlValidationNotice } from './ControlValidationNotice';
import { ControlToast } from './ControlToast';

type Props = {
  blockedWeekdays?: number[]; initialApplyScope?: 'all' | 'unmodified'; label: string; count: number; selectedObjects?: string[];
  rule: DurationRule; defaultRule: DurationRule; isDefault?: boolean; requireApplyScope?: boolean;
  onClose: () => void; onSave: (rules: DurationRule[], applyScope?: 'all' | 'unmodified') => void;
};
const copyRule = (rule: DurationRule): DurationRule => ({ ...rule, weekdays: [...rule.weekdays], periods: rule.periods.map(period => ({ ...period })) });
export const DurationRuleEditor: React.FC<Props> = ({ blockedWeekdays = [], initialApplyScope, label, count, rule, defaultRule, isDefault, requireApplyScope, onClose, onSave }) => {
  const [groups, setGroups] = useState(() => [copyRule(rule)]);
  const [applyScope, setApplyScope] = useState<'all' | 'unmodified' | null>(initialApplyScope ?? null);
  const [error, setError] = useState('');
  const [restoreNotice, setRestoreNotice] = useState(0);
  const initial = useRef(JSON.stringify({ groups, applyScope }));
  const update = (index: number, changes: Partial<DurationRule>) => { setError(''); setGroups(current => current.map((group, i) => i === index ? { ...group, ...changes, useDefault: false } : group)); };
  const submit = () => {
    if (requireApplyScope && !applyScope) return setError('请选择本次修改范围');
    const problem = validateDurationRuleSet(groups);
    if (problem) return setError(problem);
    if (groups.some(group => group.weekdays.some(day => blockedWeekdays.includes(day)))) return setError('所选星期已有规则，请修改已有规则或删除后再新增');
    onSave(groups.map(group => ({ ...copyRule(group), useDefault: false, weekdays: [...group.weekdays].sort((a, b) => a - b), periods: [...group.periods].sort((a, b) => a.start.localeCompare(b.start)) })), applyScope ?? undefined);
  };
  return <DeviceControlLayer labelId="duration-rule-editor-title" level={1} onClose={onClose} unsavedChanges={initial.current !== JSON.stringify({ groups, applyScope })}>{close => <>
    <header className="flex items-center justify-between border-b p-6"><h2 id="duration-rule-editor-title" className="text-xl font-bold">设置使用时长规则</h2><button type="button" aria-label="关闭设置" onClick={close}><X size={20} /></button></header>
    <div className="dc-panel-body space-y-6">
      <div className="rounded-xl bg-indigo-50 p-4 text-sm text-indigo-800"><p className="font-bold">{label}</p><p className="mt-1">本次设置范围共 {count} 名学生</p></div>
      <p className="text-sm text-slate-500">多天可共用一组时长，也可每天单独设置。未设置的星期执行默认规则。已有规则的星期不可重复新增。</p>
      {groups.map((group, groupIndex) => <section key={group.id} className="space-y-4 rounded-xl bg-slate-50 p-4">
        <div className="flex items-center justify-between"><h3 className="text-sm font-bold">时长组 {groupIndex + 1}</h3>{groups.length > 1 && <button type="button" className="text-sm text-slate-500" onClick={() => { setGroups(current => current.filter((_, index) => index !== groupIndex)); setError(''); }}>删除本组</button>}</div>
        {!isDefault && <fieldset><legend className="mb-3 text-sm font-bold">使用星期</legend><div className="dc-weekdays">{weekdayNames.map((day, index) => <label key={day} className="dc-choice"><input type="checkbox" aria-label={`时长组${groupIndex + 1}${day}`} checked={group.weekdays.includes(index)} disabled={blockedWeekdays.includes(index) || groups.some((other, i) => i !== groupIndex && other.weekdays.includes(index))} onChange={() => update(groupIndex, { weekdays: group.weekdays.includes(index) ? group.weekdays.filter(value => value !== index) : [...group.weekdays, index].sort((a, b) => a - b) })} />{day}</label>)}</div></fieldset>}
        <div className="space-y-4">{([['continuousMinutes', '连续使用时长'], ['restMinutes', '休息时间'], ['dailyMinutes', '每日累计时长']] as const).map(([key, title]) => <label key={key} className="flex items-center justify-between gap-4 text-sm font-medium text-slate-700"><span>{title}</span><span className="flex items-center gap-2"><input aria-label={`时长组${groupIndex + 1}${title}`} type="number" min="1" step="1" value={group[key]} onChange={event => update(groupIndex, { [key]: Number(event.target.value) })} className="w-24 rounded-lg border border-slate-200 bg-white px-3 py-2 text-right" />分钟</span></label>)}</div>
        <fieldset><legend className="text-sm font-bold">每日可用时段</legend><p className="mt-1 text-xs text-slate-500">不设置则全天可用。</p>
          <div className="mt-3 space-y-3">{group.periods.map((period, index) => <div key={index} className="flex flex-wrap items-center gap-2"><input type="time" aria-label={`时长组${groupIndex + 1}时段${index + 1}开始时间`} value={period.start} onChange={event => update(groupIndex, { periods: group.periods.map((item, i) => i === index ? { ...item, start: event.target.value } : item) })} className="rounded-lg border border-slate-200 bg-white px-3 py-2" /><span>至</span><input type="time" aria-label={`时长组${groupIndex + 1}时段${index + 1}结束时间`} value={period.end} onChange={event => update(groupIndex, { periods: group.periods.map((item, i) => i === index ? { ...item, end: event.target.value } : item) })} className="rounded-lg border border-slate-200 bg-white px-3 py-2" /><button type="button" className="text-sm text-slate-500" onClick={() => update(groupIndex, { periods: group.periods.filter((_, i) => i !== index) })}>删除时段</button></div>)}<button type="button" className="text-sm text-indigo-600" onClick={() => update(groupIndex, { periods: [...group.periods, { start: '', end: '' }] })}>添加时段</button></div>
        </fieldset>
      </section>)}
      {!isDefault && <button type="button" className="dc-btn" disabled={new Set([...blockedWeekdays, ...groups.flatMap(group => group.weekdays)]).size === 7} onClick={() => { setGroups(current => [...current, { ...copyRule(defaultRule), id: crypto.randomUUID(), weekdays: [], useDefault: false }]); setError(''); }}>新增时长组</button>}
      {requireApplyScope && <fieldset className="rounded-xl border border-slate-200 p-4"><legend className="px-1 text-sm font-bold">本次修改哪些学生？</legend><div className="space-y-4">{([['all', '修改所选范围的所有学生', '将替换班主任在所选星期的设置。'], ['unmodified', '保留班主任的设置，修改其他学生', '班主任已设置的星期保持不变。']] as const).map(([value, title, description]) => <label key={value} className="flex items-start gap-3"><input type="radio" name="duration-apply-scope" checked={applyScope === value} onChange={() => { setApplyScope(value); setError(''); }} className="mt-1" /><span><b className="block text-sm">{title}</b><span className="mt-1 block text-xs text-slate-500">{description}</span></span></label>)}</div></fieldset>}
      {error && <ControlValidationNotice message={error} onClose={() => setError('')} />}
    </div>
    {restoreNotice > 0 && <ControlToast key={restoreNotice} message="已填入默认设置，保存后生效" tone="success" duration={3000} onClose={() => setRestoreNotice(0)} />}
    <footer className="flex justify-end gap-3 border-t p-5">{!isDefault && <button type="button" className="dc-btn mr-auto" onClick={() => { setGroups([{ ...copyRule(defaultRule), id: rule.id, weekdays: [0, 1, 2, 3, 4, 5, 6].filter(day => !blockedWeekdays.includes(day)), useDefault: false }]); setError(''); setRestoreNotice(value => value + 1); }}>填入默认设置</button>}<button type="button" className="dc-btn" onClick={close}>取消</button><button type="button" className="dc-btn-primary" onClick={submit}>保存</button></footer>
  </>}</DeviceControlLayer>;
};
