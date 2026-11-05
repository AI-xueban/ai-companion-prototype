import React, { useState } from "react";
import { X } from "lucide-react";
import { DeviceControlLayer } from "./DeviceControlLayer";
import { ControlValidationNotice } from "./ControlValidationNotice";

export const WorldUsageEditor: React.FC<{
  fixedValue?: boolean; scopeSelector?: React.ReactNode;
  initialSelection?: { value: boolean; scope: "all" | "unmodified" };
  label: string;
  selectedObjects?: string[];
  total: number;
  allowed: number;
  teacherTotal: number;
  teacherAllowed: number;
  onClose: () => void;
  onSave: (allowed: boolean, scope: "all" | "unmodified") => void;
}> = ({ fixedValue, scopeSelector, initialSelection, label, selectedObjects, total, allowed, teacherTotal, teacherAllowed, onClose, onSave }) => {
  const scope = "unmodified" as const;
  const [error, setError] = useState("");
  const [value, setValue] = useState<boolean | null>(fixedValue ?? initialSelection?.value ?? null);
  const eligible = total - (scope === "unmodified" ? teacherTotal : 0);
  const eligibleAllowed = allowed - (scope === "unmodified" ? teacherAllowed : 0);
  const changed = value === null ? 0 : value ? eligible - eligibleAllowed : eligibleAllowed;
  return <DeviceControlLayer labelId="world-usage-title" onClose={onClose} unsavedChanges={value !== (fixedValue ?? initialSelection?.value ?? null)}>
    {(close, closeAfterSave) => <>
      <header className="flex items-center justify-between"><h2 id="world-usage-title" className="text-xl font-bold text-slate-900">设置万象视界使用状态</h2><button type="button" aria-label="关闭设置" onClick={close}><X size={20} /></button></header>
      <div className="dc-panel-body">
        {scopeSelector}
        <p className="mt-3 text-sm text-slate-600">设置范围：{label}</p>
        {!!selectedObjects?.length && <ul aria-label="本次设置对象列表" className="mt-3 flex flex-wrap gap-2 text-sm">{selectedObjects.map((name) => <li key={name} className="rounded bg-slate-50 px-2 py-1">{name}</li>)}</ul>}
        {fixedValue !== undefined ? <p className="mt-5 font-bold">{fixedValue ? '恢复使用万象视界' : '停止使用万象视界'}</p> : <fieldset className="mt-6 space-y-3">
          <legend className="mb-3 font-bold"><span className="mr-1 text-red-500" aria-hidden="true">*</span>请选择设置后的状态</legend>
          {[true, false].map((option) => <label key={String(option)} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 ${value === option ? "border-indigo-500 bg-indigo-50" : "border-slate-200"}`}>
            <input type="radio" name="world-usage" checked={value === option} onChange={() => setValue(option)} />
            <span>{option ? "允许使用万象视界" : "禁止使用万象视界"}</span>
          </label>)}
        </fieldset>}

      </div>
      {error && <ControlValidationNotice message={error} onClose={() => setError("")} />}
      <div className="dc-confirm-footer">
        <button type="button" className="dc-btn" onClick={closeAfterSave}>取消</button>
        <button type="button" className="dc-btn-primary" disabled={scope !== null && value !== null && !changed} onClick={() => { if (scopeSelector && !total) { setError('请选择年级'); return; } if (value === null) { setError("请选择万象视界设置后的状态：允许使用或禁止使用"); return; } if (!changed) return; onSave(value, scope); closeAfterSave(); }}>保存</button>
      </div>
    </>}
  </DeviceControlLayer>;
};
