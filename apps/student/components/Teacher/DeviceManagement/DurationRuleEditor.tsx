import React, { useEffect, useRef, useState } from 'react';
import { Trash2, X } from 'lucide-react';
import { DurationRule, weekdayNames } from '../data/hierarchicalDeviceControl';
import { isDefaultDurationRuleSet, validateDurationRuleSet } from '../data/durationRuleSets';
import { DeviceControlLayer } from './DeviceControlLayer';
import { ControlValidationNotice } from './ControlValidationNotice';
import { ControlToast } from './ControlToast';

type Props = {
  defaultRulesEnabled?: boolean; creating?: boolean; noAvailableGrades?: boolean; scopeChanged?: boolean; scopeSelector?: React.ReactNode; conflictHint?: string; backToList?: boolean; blockedWeekdays?: number[]; initialApplyScope?: 'all' | 'unmodified'; label: string; count: number; selectedObjects?: string[];
  rule: DurationRule; defaultRule: DurationRule; isDefault?: boolean; requireApplyScope?: boolean;
  onClose: () => void; onSave: (rules: DurationRule[], applyScope?: 'all' | 'unmodified') => void;
};
const copyRule = (rule: DurationRule): DurationRule => ({ ...rule, weekdays: [...rule.weekdays], periods: rule.periods.map(period => ({ ...period })) });
export const DurationRuleEditor: React.FC<Props> = ({ defaultRulesEnabled = false, scopeChanged = false, creating = false, noAvailableGrades = false, scopeSelector, conflictHint, backToList, blockedWeekdays = [], initialApplyScope, label, count, rule, defaultRule, isDefault, requireApplyScope, onClose, onSave }) => {
  const [groups, setGroups] = useState(() => [copyRule(rule)]);
  const blockedKey = blockedWeekdays.join(',');
  useEffect(() => { setGroups(current => current.map(group => ({ ...group, weekdays: group.weekdays.filter(day => !blockedWeekdays.includes(day)) }))); }, [blockedKey]);
  const applyScope = 'unmodified' as const;
  const [error, setError] = useState('');
  const [dismissedConflictHint, setDismissedConflictHint] = useState('');
  const [dismissedNoGrades, setDismissedNoGrades] = useState(false);
  const initial = useRef(JSON.stringify({ groups, applyScope }));
  const update = (index: number, changes: Partial<DurationRule>) => { setError(''); setGroups(current => current.map((group, i) => i === index ? { ...group, ...changes, useDefault: false } : group)); };
  const submit = () => {
    if (noAvailableGrades) return;
    if (scopeSelector && !count) return setError('请选择年级');
    const problem = validateDurationRuleSet(groups);
    if (problem) return setError(problem);
    if (creating && isDefaultDurationRuleSet(groups)) return setError('当前仍为默认规则，无需新增');
    if (groups.some(group => group.weekdays.some(day => blockedWeekdays.includes(day)))) return setError('所选星期已有规则，请修改已有规则或删除后再新增');
    onSave(groups.map(group => ({ ...copyRule(group), useDefault: false, weekdays: [...group.weekdays].sort((a, b) => a - b), periods: [...group.periods].sort((a, b) => a.start.localeCompare(b.start)) })), applyScope ?? undefined);
  };
  return <DeviceControlLayer labelId="duration-rule-editor-title" level={0} onClose={onClose} unsavedChanges={scopeChanged || initial.current !== JSON.stringify({ groups, applyScope })}>{close => <>
    <header className="flex items-center justify-between border-b p-6"><div>{backToList && <button type="button" className="mb-2 text-sm text-indigo-600" onClick={close}>返回规则列表</button>}<h2 id="duration-rule-editor-title" className="text-xl font-bold">设置使用时长规则</h2></div><button type="button" aria-label="关闭设置" onClick={close}><X size={20} /></button></header>
    <div className="dc-panel-body space-y-6">
      {scopeSelector}
      {noAvailableGrades ? (!dismissedNoGrades && <ControlToast message="全部年级已有规则，请编辑或删除后新增" tone="info" onClose={() => setDismissedNoGrades(true)} />) : <>
      {conflictHint && conflictHint !== dismissedConflictHint && <ControlToast key={conflictHint} message={conflictHint} tone="warning" onClose={() => setDismissedConflictHint(conflictHint)} />}
      {!scopeSelector && <p className="text-sm text-slate-600">{label}</p>}
      {groups.map((group, groupIndex) => <section key={group.id} className="space-y-4 rounded-xl bg-slate-50 p-4">
        <div className="flex items-center justify-between"><h3 className="text-sm font-bold">时长组 {groupIndex + 1}</h3>{groups.length > 1 && <button type="button" className="text-sm text-slate-500" onClick={() => { setGroups(current => current.filter((_, index) => index !== groupIndex)); setError(''); }}>删除本组</button>}</div>
        {!isDefault && <fieldset><legend className="mb-3 text-sm font-bold"><span className="mr-1 text-red-500" aria-hidden="true">*</span>选择星期<span className="ml-3 text-sm font-normal text-slate-500">{defaultRulesEnabled ? '未设置的星期执行默认规则' : '未设置的星期不限使用时长'}</span></legend><div className="flex flex-wrap gap-3">{weekdayNames.map((day, index) => <label key={day} className="flex items-center gap-1 text-sm"><input type="checkbox" aria-label={`时长组${groupIndex + 1}${day}`} checked={group.weekdays.includes(index)} disabled={blockedWeekdays.includes(index) || groups.some((other, i) => i !== groupIndex && other.weekdays.includes(index))} onChange={() => update(groupIndex, { weekdays: group.weekdays.includes(index) ? group.weekdays.filter(value => value !== index) : [...group.weekdays, index].sort((a, b) => a - b) })} />{day.replace('星期', '周')}</label>)}</div></fieldset>}
        <div className="space-y-4">{([['continuousMinutes', '连续使用时长'], ['restMinutes', '休息时间'], ['dailyMinutes', '每日累计时长']] as const).map(([key, title]) => <label key={key} className="flex items-center justify-between gap-4 text-sm font-medium text-slate-700"><span><span className="mr-1 text-red-500" aria-hidden="true">*</span>{title}</span><span className="flex items-center gap-2"><input aria-label={`时长组${groupIndex + 1}${title}`} type="number" min="1" step="1" value={group[key]} onChange={event => update(groupIndex, { [key]: Number(event.target.value) })} className="w-24 rounded-lg border border-slate-200 bg-white px-3 py-2 text-right" />分钟</span></label>)}</div>
        <fieldset><legend className="text-sm font-bold">每日可用时段<span className="ml-3 text-sm font-normal text-slate-500">不设置则全天可用</span></legend>
          <div className="mt-3 space-y-3">{group.periods.map((period, index) => <div key={index} className="flex flex-wrap items-center gap-2"><input type="time" aria-label={`时长组${groupIndex + 1}时段${index + 1}开始时间`} value={period.start} onChange={event => update(groupIndex, { periods: group.periods.map((item, i) => i === index ? { ...item, start: event.target.value } : item) })} className="rounded-lg border border-slate-200 bg-white px-3 py-2" /><span>至</span><input type="time" aria-label={`时长组${groupIndex + 1}时段${index + 1}结束时间`} value={period.end} onChange={event => update(groupIndex, { periods: group.periods.map((item, i) => i === index ? { ...item, end: event.target.value } : item) })} className="rounded-lg border border-slate-200 bg-white px-3 py-2" /><button type="button" aria-label={`删除时长组${groupIndex + 1}时段${index + 1}`} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600" onClick={() => update(groupIndex, { periods: group.periods.filter((_, i) => i !== index) })}><Trash2 size={16} aria-hidden="true" /></button>{index === group.periods.length - 1 && <button type="button" className="text-sm text-indigo-600" onClick={() => update(groupIndex, { periods: [...group.periods, { start: '', end: '' }] })}>添加时段</button>}</div>)}{!group.periods.length && <button type="button" className="text-sm text-indigo-600" onClick={() => update(groupIndex, { periods: [...group.periods, { start: '', end: '' }] })}>添加时段</button>}</div>
        </fieldset>
      </section>)}
      {!isDefault && <button type="button" className="dc-btn" disabled={new Set([...blockedWeekdays, ...groups.flatMap(group => group.weekdays)]).size === 7} onClick={() => { setGroups(current => [...current, { ...copyRule(defaultRule), id: crypto.randomUUID(), weekdays: [], useDefault: false }]); setError(''); }}>新增时长组</button>}
      {error && <ControlValidationNotice message={error} onClose={() => setError('')} />}
      </>}
    </div>
    <footer className="flex justify-end gap-3 border-t p-5"><button type="button" className="dc-btn" onClick={close}>取消</button>{!noAvailableGrades && <button type="button" className="dc-btn-primary" onClick={submit}>保存</button>}</footer>
  </>}</DeviceControlLayer>;
};
