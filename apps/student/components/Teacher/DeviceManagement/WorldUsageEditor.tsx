import React, { useState } from "react";
import { DeviceControlLayer } from "./DeviceControlLayer";
import { ControlValidationNotice } from "./ControlValidationNotice";

export const WorldUsageEditor: React.FC<{
  label: string;
  selectedObjects?: string[];
  total: number;
  allowed: number;
  onClose: () => void;
  onSave: (allowed: boolean) => void;
}> = ({ label, selectedObjects, total, allowed, onClose, onSave }) => {
  const [error, setError] = useState("");
  const [value, setValue] = useState<boolean | null>(null);
  const changed = value === null ? 0 : value ? total - allowed : allowed;
  const state = value ? "允许使用" : "禁止使用";
  return <DeviceControlLayer variant="dialog" labelId="world-usage-title" onClose={onClose} unsavedChanges={value !== null}>
    {(close, closeAfterSave) => <>
      <div className="dc-confirm-body">
        <h2 id="world-usage-title" className="text-xl font-bold text-slate-900">设置这 {total} 名学生的万象视界使用状态</h2>
        <p className="mt-3 text-sm text-slate-600">设置范围：{label}</p>
        <p className="mt-2 text-sm text-slate-500">当前允许使用 {allowed} 人，禁止使用 {total - allowed} 人</p>
        <p className="mt-3 text-sm leading-6 text-slate-500">本次设置将修改所选范围的当前使用状态。老师之后仍可调整，以最后一次成功保存为准。</p>
        {!!selectedObjects?.length && <ul aria-label="本次设置对象列表" className="mt-3 flex flex-wrap gap-2 text-sm">{selectedObjects.map((name) => <li key={name} className="rounded bg-slate-50 px-2 py-1">{name}</li>)}</ul>}
        <fieldset className="mt-6 space-y-3">
          <legend className="mb-3 font-bold">请选择设置后的状态</legend>
          {[true, false].map((option) => <label key={String(option)} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 ${value === option ? "border-indigo-500 bg-indigo-50" : "border-slate-200"}`}>
            <input type="radio" name="world-usage" checked={value === option} onChange={() => setValue(option)} />
            <span>{option ? "允许使用万象视界" : "禁止使用万象视界"}</span>
          </label>)}
        </fieldset>
        {value !== null && <p role="status" className="mt-5 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">{changed ? changed === total ? `${changed} 名学生将全部改为${state}。` : `其中 ${changed} 名学生将改为${state}，其余 ${total - changed} 名学生保持不变。` : `所选学生均已${state}，无需修改。`}</p>}
      </div>
      {error && <ControlValidationNotice message={error} onClose={() => setError("")} />}
      <div className="dc-confirm-footer">
        <button type="button" className="dc-btn" onClick={close}>取消</button>
        <button type="button" className="dc-btn-primary" disabled={value !== null && !changed} onClick={() => { if (value === null) { setError("请选择万象视界设置后的状态：允许使用或禁止使用"); return; } if (!changed) return; onSave(value); closeAfterSave(); }}>确认设置</button>
      </div>
    </>}
  </DeviceControlLayer>;
};
