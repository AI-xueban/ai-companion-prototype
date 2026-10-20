import React, { useEffect, useRef, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import {
  DurationRule,
  weekdayNames,
} from "../data/hierarchicalDeviceControl";
import { DeviceControlLayer } from "./DeviceControlLayer";
import { ControlValidationNotice } from "./ControlValidationNotice";

type Props = {
  label: string;
  count: number;
  selectedObjects?: string[];
  rule: DurationRule;
  defaultRule: DurationRule;
  isDefault?: boolean;
  requireApplyScope?: boolean;
  onClose: () => void;
  onSave: (rule: DurationRule, applyScope?: "all" | "unmodified") => void;
};

export const DurationRuleEditor: React.FC<Props> = ({ label, count, selectedObjects, rule, defaultRule, isDefault, requireApplyScope, onClose, onSave }) => {
  const [draft, setDraft] = useState<DurationRule>({ ...rule, weekdays: [...rule.weekdays], periods: rule.periods.map((period) => ({ ...period })) });
  const [error, setError] = useState("");
  const [restoreNotice, setRestoreNotice] = useState(0);
  useEffect(() => { if (!restoreNotice) return; const timer = window.setTimeout(() => setRestoreNotice(0), 3000); return () => window.clearTimeout(timer); }, [restoreNotice]);
  const [applyScope, setApplyScope] = useState<"all" | "unmodified" | null>(null);
  const initial = useRef(JSON.stringify({ draft, applyScope }));
  const dirty = initial.current !== JSON.stringify({ draft, applyScope });
  const setNumber = (key: "continuousMinutes" | "restMinutes" | "dailyMinutes", value: number) =>
    setDraft((current) => ({ ...current, useDefault: false, [key]: value }));
  const submit = () => {
    if (!isDefault && !draft.weekdays.length) return setError("请至少选择一个星期");
    if (![draft.continuousMinutes, draft.restMinutes, draft.dailyMinutes].every((value) => Number.isInteger(value) && value > 0)) return setError("各项时长须为大于 0 的整数分钟");
    if (draft.dailyMinutes < draft.continuousMinutes) return setError("每日累计时长不能短于连续使用时长");
    if (draft.periods.some((period) => !period.start || !period.end || period.start >= period.end)) return setError("请填写完整且结束晚于开始的可用时段");
    const periods = [...draft.periods].sort((a, b) => a.start.localeCompare(b.start));
    if (periods.some((period, index) => index > 0 && period.start < periods[index - 1].end)) return setError("每日可用时段不能重叠");
    if (requireApplyScope && !applyScope) return setError("请选择本次修改范围");
    onSave({ ...draft, periods }, applyScope ?? undefined);
  };
  const numberInput = (key: "continuousMinutes" | "restMinutes" | "dailyMinutes", title: string) => (
    <label className="flex items-center justify-between gap-4 text-sm font-medium text-slate-700">
      <span>{title}</span>
      <span className="flex items-center gap-2"><input type="number" min="1" step="1" value={draft[key]} onChange={(event) => setNumber(key, Number(event.target.value))} className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-right" />分钟</span>
    </label>
  );
  return <DeviceControlLayer labelId="duration-rule-editor-title" level={1} onClose={onClose} unsavedChanges={dirty}>
    {(close) => <>
      <header className="flex items-center justify-between border-b p-6"><h2 id="duration-rule-editor-title" className="text-xl font-bold text-slate-900">{isDefault ? "设置默认使用时长规则" : "设置使用时长规则"}</h2><button type="button" aria-label="关闭设置" onClick={close} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={20} /></button></header>
      <div className="dc-panel-body space-y-6">
        {!isDefault && <div className="text-sm leading-6 text-slate-500"><p>全校默认规则：周一至周日，不限可用时段；连续使用60分钟、休息15分钟、每日累计180分钟。</p><p>可直接修改。点击“恢复全校默认规则”后，仍需点击“保存”才会生效。</p></div>}
        <div className="dc-target"><p className="font-bold text-indigo-900">{label}</p><p className="mt-1 text-xs text-indigo-700">{isDefault ? "没有其他适用规则时生效" : `本次设置影响 ${count} 名学生`}</p></div>
        {!!selectedObjects?.length && <ul aria-label="本次设置对象列表" className="flex flex-wrap gap-2 text-sm text-slate-600">{selectedObjects.map((name) => <li key={name} className="rounded-lg bg-slate-50 px-3 py-2">{name}</li>)}</ul>}
        {!isDefault && <fieldset><legend className="mb-3 text-sm font-bold text-slate-800"><span className="mr-1 text-red-500">*</span>使用星期</legend><div className="dc-weekdays">{weekdayNames.map((day, index) => <label key={day} className="dc-choice"><input type="checkbox" checked={draft.weekdays.includes(index)} onChange={() => setDraft((current) => ({ ...current, weekdays: current.weekdays.includes(index) ? current.weekdays.filter((value) => value !== index) : [...current.weekdays, index].sort() }))} />{day}</label>)}</div></fieldset>}
        <fieldset  className="space-y-4 rounded-xl bg-slate-50 p-4 disabled:opacity-60">{numberInput("continuousMinutes", "连续使用时长")}{numberInput("restMinutes", "休息时间")}{numberInput("dailyMinutes", "每日累计时长")}</fieldset>
        <fieldset  className="disabled:opacity-60">
          <h3 className="text-sm font-bold text-slate-800">每日可用时段</h3>
          <p className="mt-1 text-xs text-slate-500">不添加时段表示全天可用，仍受时长限制。</p>
          <div className="mt-3 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            {draft.periods.map((period, index) => <div key={index} className="flex flex-wrap items-center gap-3">
              <input aria-label={`第 ${index + 1} 段开始时间`} type="time" value={period.start} onChange={(event) => setDraft((current) => ({ ...current, useDefault: false, periods: current.periods.map((item, i) => i === index ? { ...item, start: event.target.value } : item) }))} className="rounded-lg border border-slate-200 bg-white px-3 py-2" />
              <span className="text-sm text-slate-500">至</span>
              <input aria-label={`第 ${index + 1} 段结束时间`} type="time" value={period.end} onChange={(event) => setDraft((current) => ({ ...current, useDefault: false, periods: current.periods.map((item, i) => i === index ? { ...item, end: event.target.value } : item) }))} className="rounded-lg border border-slate-200 bg-white px-3 py-2" />
              <button type="button" aria-label={`删除第 ${index + 1} 段`} onClick={() => setDraft((current) => ({ ...current, useDefault: false, periods: current.periods.filter((_, i) => i !== index) }))} className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={17} /></button>
              {index === draft.periods.length - 1 && <button type="button" className="flex items-center gap-1 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm text-indigo-600" onClick={() => setDraft((current) => ({ ...current, useDefault: false, periods: [...current.periods, { start: "", end: "" }] }))}><Plus size={15} />添加时段</button>}
            </div>)}
            {!draft.periods.length && <button type="button" className="flex items-center gap-1 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-sm text-indigo-600" onClick={() => setDraft((current) => ({ ...current, useDefault: false, periods: [...current.periods, { start: "", end: "" }] }))}><Plus size={15} />添加时段</button>}
          </div>
        </fieldset>
        {requireApplyScope && <fieldset className="rounded-lg bg-slate-50 p-4"><legend className="text-sm font-bold text-slate-800"><span className="text-red-500">*</span> 修改范围</legend><div className="mt-3 space-y-3"><label className="block cursor-pointer"><span className="flex items-start gap-3"><input type="radio" name="duration-apply-scope" checked={applyScope === "all"} onChange={() => { setApplyScope("all"); setError(""); }} className="mt-1" /><span><b className="block text-sm text-slate-900">{label === "全校" ? "全校修改" : "修改当前范围全部学生"}</b><span className="mt-1 block text-xs leading-5 text-slate-500">覆盖本次范围内全部学生，包括老师此前单独设置的学生。</span></span></span></label><label className="block cursor-pointer"><span className="flex items-start gap-3"><input type="radio" name="duration-apply-scope" checked={applyScope === "unmodified"} onChange={() => { setApplyScope("unmodified"); setError(""); }} className="mt-1" /><span><b className="block text-sm text-slate-900">跳过老师单独设置的学生</b><span className="mt-1 block text-xs leading-5 text-slate-500">保留老师已按班级或学生设置的规则。</span></span></span></label></div></fieldset>}
        {error && <ControlValidationNotice message={error} onClose={() => setError("")} />}
      </div>
      {restoreNotice > 0 && <div role="status" className="dc-feedback" style={{ zIndex: 10200, background: "#0f172a", borderColor: "#0f172a", color: "#fff" }}>已恢复默认规则</div>}
      <footer className="flex justify-end gap-3 border-t p-5">{!isDefault && <button type="button" className="dc-btn mr-auto" onClick={() => { setDraft((current) => ({ ...current, ...defaultRule, id: current.id, weekdays: [0, 1, 2, 3, 4, 5, 6], useDefault: true, periods: defaultRule.periods.map((period) => ({ ...period })) })); setError(""); setRestoreNotice((value) => value + 1); }}>恢复全校默认规则</button>}<button type="button" className="dc-btn" onClick={close}>取消</button><button type="button" className="dc-btn-primary" onClick={submit}>保存</button></footer>
    </>}
  </DeviceControlLayer>;
};
