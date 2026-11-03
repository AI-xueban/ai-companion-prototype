import React, { useState } from "react";
import { X } from "lucide-react";
import { DeviceControlLayer } from "./DeviceControlLayer";
import { ControlValidationNotice } from "./ControlValidationNotice";

export const WorldUsageEditor: React.FC<{
  initialSelection?: { value: boolean; scope: "all" | "unmodified" };
  label: string;
  selectedObjects?: string[];
  total: number;
  allowed: number;
  teacherTotal: number;
  teacherAllowed: number;
  onClose: () => void;
  onSave: (allowed: boolean, scope: "all" | "unmodified") => void;
}> = ({ initialSelection, label, selectedObjects, total, allowed, teacherTotal, teacherAllowed, onClose, onSave }) => {
  const [scope, setScope] = useState<"all" | "unmodified" | null>(initialSelection?.scope ?? null);
  const [error, setError] = useState("");
  const [value, setValue] = useState<boolean | null>(initialSelection?.value ?? null);
  const eligible = total - (scope === "unmodified" ? teacherTotal : 0);
  const eligibleAllowed = allowed - (scope === "unmodified" ? teacherAllowed : 0);
  const changed = value === null ? 0 : value ? eligible - eligibleAllowed : eligibleAllowed;
  const state = value ? "允许使用" : "禁止使用";
  return <DeviceControlLayer labelId="world-usage-title" onClose={onClose} unsavedChanges={value !== null || scope !== null}>
    {(close, closeAfterSave) => <>
      <header className="flex items-center justify-between"><h2 id="world-usage-title" className="text-xl font-bold text-slate-900">设置这 {total} 名学生的万象视界使用状态</h2><button type="button" aria-label="关闭设置" onClick={close}><X size={20} /></button></header>
      <div className="dc-panel-body">
        <p className="mt-3 text-sm text-slate-600">设置范围：{label}</p>
        <p className="mt-2 text-sm text-slate-500">当前允许使用 {allowed} 人，禁止使用 {total - allowed} 人</p>
        {!!selectedObjects?.length && <ul aria-label="本次设置对象列表" className="mt-3 flex flex-wrap gap-2 text-sm">{selectedObjects.map((name) => <li key={name} className="rounded bg-slate-50 px-2 py-1">{name}</li>)}</ul>}
        <fieldset className="mt-6 space-y-3">
          <legend className="mb-3 font-bold">请选择设置后的状态</legend>
          {[true, false].map((option) => <label key={String(option)} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 ${value === option ? "border-indigo-500 bg-indigo-50" : "border-slate-200"}`}>
            <input type="radio" name="world-usage" checked={value === option} onChange={() => setValue(option)} />
            <span>{option ? "允许使用万象视界" : "禁止使用万象视界"}</span>
          </label>)}
        </fieldset>
        <fieldset className="mt-6 space-y-4 rounded-xl border border-slate-200 p-4">
          <legend className="px-1 text-sm font-bold text-slate-800"><span className="text-red-500">*</span> 本次修改哪些学生？</legend>
          {([['all', label === '全校' ? '修改全校所有学生' : label.startsWith('已选') ? '修改所选范围的所有学生' : `修改${label}的所有学生`, '将替换老师此前设置的使用状态。'], ['unmodified', '保留老师的设置，修改其他学生', '老师已设置的学生保持不变，其余学生按本次设置修改。']] as const).map(([option, title, description]) => <label key={option} className="flex cursor-pointer items-start gap-3"><input type="radio" name="world-scope" checked={scope === option} onChange={() => { setScope(option); setError(''); }} className="mt-1" /><span><b className="block text-sm text-slate-900">{title}</b><span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span></span></label>)}
        </fieldset>
        {value !== null && scope !== null && <p role="status" className="mt-5 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">{changed ? changed === total ? `${changed} 名学生将全部改为${state}。` : `其中 ${changed} 名学生将改为${state}，其余 ${total - changed} 名学生保持不变。` : '当前选择无需修改。'}</p>}
      </div>
      {error && <ControlValidationNotice message={error} onClose={() => setError("")} />}
      <div className="dc-confirm-footer">
        <button type="button" className="dc-btn" onClick={closeAfterSave}>取消</button>
        <button type="button" className="dc-btn-primary" disabled={scope !== null && value !== null && !changed} onClick={() => { if (scope === null) { setError('请选择本次修改范围'); return; } if (value === null) { setError("请选择万象视界设置后的状态：允许使用或禁止使用"); return; } if (!changed) return; onSave(value, scope); closeAfterSave(); }}>保存</button>
      </div>
    </>}
  </DeviceControlLayer>;
};
