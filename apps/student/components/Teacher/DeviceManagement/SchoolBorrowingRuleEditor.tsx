import React, { useRef, useState } from 'react';
import { X } from 'lucide-react';
import { BorrowSchedule, borrowingPeriodsForDay, schoolDate, validateSchedule, weekdayNames } from '../data/hierarchicalDeviceControl';
import { applyBorrowingWeekGroups, borrowingWeekGroups, BorrowingWeekGroup } from '../data/borrowingWeeklyGroups';
import { DeviceControlLayer } from './DeviceControlLayer';

type GradeOption = { grade: number; label: string; count: number; disabled?: boolean; hasWeeklyRule?: boolean };
export const SchoolBorrowingRuleEditor: React.FC<{
  rule: BorrowSchedule; grades: GradeOption[]; initialGrades: number[]; editing: boolean;
  error: string; onClearError: () => void; onClose: () => void;
  onSave: (rule: BorrowSchedule, grades: number[]) => string | undefined;
}> = ({ rule, grades, initialGrades, editing, error, onClearError, onClose, onSave }) => {
  const hydrate = (value: BorrowSchedule): BorrowSchedule => value.mode === 'dates'
    ? { ...value, deny: true, periods: [], weekdays: [], weekdayPeriods: undefined }
    : { ...value, deny: false, weekdayPeriods: Object.fromEntries(value.weekdays.map(day => [day, borrowingPeriodsForDay(value, day).map(period => ({ ...period }))])) };
  const [draft, setDraft] = useState(() => hydrate(rule));
  const selected = initialGrades;
  const [weekGroups, setWeekGroups] = useState(() => borrowingWeekGroups(rule));
  const [problem, setProblem] = useState('');
  const initial = useRef(JSON.stringify({ draft, selected, weekGroups }));
  const changed = () => { setProblem(''); onClearError(); };
  const update = (value: Partial<BorrowSchedule>) => { changed(); setDraft(current => ({ ...current, ...value })); };
  const updateGroup = (index: number, value: Partial<BorrowingWeekGroup>) => { changed(); setWeekGroups(current => current.map((group, position) => position === index ? { ...group, ...value } : group)); };
  const input = 'rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm';
  const submit = () => {
    if (!selected.length) { setProblem('请选择年级'); return; }
    if (draft.mode === 'weekly' && weekGroups.some(group => !group.days.length)) { setProblem('请为每组时段选择适用星期'); return; }
    const next = draft.mode === 'weekly' ? applyBorrowingWeekGroups(draft, weekGroups) : draft;
    const validation = validateSchedule(next, new Date(), undefined, editing);
    if (validation) { setProblem(validation); return; }
    setProblem(onSave(next, selected) ?? '');
  };
  return <DeviceControlLayer labelId="school-borrow-rule-title" level={1} onClose={onClose} unsavedChanges={initial.current !== JSON.stringify({ draft, selected, weekGroups })}>{close => <>
    <header className="flex items-center justify-between border-b p-6"><h2 id="school-borrow-rule-title" className="text-xl font-bold">{editing ? '编辑借用规则' : '设置借用规则'}</h2><button type="button" aria-label="关闭设置" onClick={close}><X size={20} /></button></header>
    <div className="dc-panel-body space-y-6">
      <div className="rounded-xl bg-slate-50 p-4"><p className="text-sm font-bold text-slate-800">{grades.filter(grade => selected.includes(grade.grade)).map(grade => grade.label).join('、')} · {draft.mode === 'weekly' ? '每周固定规则' : '指定日期规则'}</p><p className="mt-2 text-sm text-slate-500">影响 {grades.filter(grade => selected.includes(grade.grade)).reduce((sum, grade) => sum + grade.count, 0)} 名学生</p></div>
      {draft.mode === 'weekly' ? <section><h3 className="text-sm font-bold">每周借用时段</h3><p className="mb-4 mt-2 text-sm text-slate-500">多天可共用一组时段，也可分开设置。未选的星期不可借用。</p>
        <div className="space-y-4">{weekGroups.map((group, groupIndex) => <fieldset key={groupIndex} className="rounded-xl bg-slate-50 p-4"><legend className="text-sm font-bold">时段组 {groupIndex + 1}</legend>
          <div className="mb-3 flex flex-wrap gap-3">{weekdayNames.map((name, day) => <label key={day} className="flex items-center gap-1 text-sm"><input type="checkbox" aria-label={`时段组${groupIndex + 1}${name}`} checked={group.days.includes(day)} disabled={weekGroups.some((other, index) => index !== groupIndex && other.days.includes(day))} onChange={event => updateGroup(groupIndex, { days: event.target.checked ? [...group.days, day].sort((a, b) => a - b) : group.days.filter(value => value !== day) })} />{name.replace('星期', '周')}</label>)}</div>
          <div className="space-y-2">{group.periods.map((period, index) => <div key={index} className="flex flex-wrap items-center gap-2"><input className={input} type="time" aria-label={`时段组${groupIndex + 1}时段${index + 1}开始时间`} value={period.start} onChange={event => updateGroup(groupIndex, { periods: group.periods.map((value, position) => position === index ? { ...value, start: event.target.value } : value) })} /><span>至</span><input className={input} type="time" aria-label={`时段组${groupIndex + 1}时段${index + 1}结束时间`} value={period.end} onChange={event => updateGroup(groupIndex, { periods: group.periods.map((value, position) => position === index ? { ...value, end: event.target.value } : value) })} /><button type="button" className="text-sm text-slate-500" aria-label={`删除时段组${groupIndex + 1}时段${index + 1}`} disabled={group.periods.length === 1} onClick={() => updateGroup(groupIndex, { periods: group.periods.filter((_, position) => position !== index) })}>删除</button></div>)}</div>
          <div className="mt-3 flex justify-between"><button type="button" className="text-sm text-indigo-600" onClick={() => updateGroup(groupIndex, { periods: [...group.periods, { start: '', end: '' }] })}>新增时段</button>{weekGroups.length > 1 && <button type="button" className="text-sm text-slate-500" onClick={() => { changed(); setWeekGroups(current => current.filter((_, index) => index !== groupIndex)); }}>删除本组</button>}</div>
        </fieldset>)}</div>
        <button type="button" className="dc-btn mt-4" disabled={weekGroups.flatMap(group => group.days).length === 7} onClick={() => { changed(); setWeekGroups(current => [...current, { days: [], periods: [{ start: '', end: '' }] }]); }}>新增时段组</button>
      </section> : <section><h3 className="mb-3 text-sm font-bold">适用日期</h3><div className="flex flex-wrap items-center gap-3"><input className={input} type="date" aria-label="开始日期" min={editing ? undefined : schoolDate()} value={draft.startDate} onChange={event => update({ startDate: event.target.value })} /><span>至</span><input className={input} type="date" aria-label="结束日期" min={editing ? draft.startDate || undefined : draft.startDate > schoolDate() ? draft.startDate : schoolDate()} value={draft.endDate} onChange={event => update({ endDate: event.target.value })} /></div><p className="mt-3 text-sm font-medium text-slate-700">所选日期全天禁止借用</p><p className="mt-2 text-sm text-slate-500">指定日期内按日期规则执行，每周规则暂不生效。日期不能与所选年级已有日期规则重叠。</p></section>}
      {(problem || error) && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{problem || error}</p>}
    </div><footer className="flex justify-end gap-3 border-t p-5"><button type="button" className="dc-btn" onClick={close}>取消</button><button type="button" className="dc-btn-primary" onClick={submit}>保存规则</button></footer>
  </>}</DeviceControlLayer>;
};
