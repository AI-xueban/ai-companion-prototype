import React, { useState } from "react";
import { DeviceControlLayer } from "./DeviceControlLayer";
import { ControlValidationNotice } from "./ControlValidationNotice";

export const TemporaryLockEditor: React.FC<{
  label: string;
  selectedObjects?: string[];
  count: number;
  lockClassCount: number;
  unlockClassCount: number;
  schoolSessionActive?: boolean;
  state: "已开启" | "未开启" | "部分开启";
  onClose: () => void;
  onSave: (enabled: boolean) => void;
}> = ({ label, selectedObjects, count, lockClassCount, unlockClassCount, schoolSessionActive, state, onClose, onSave }) => {
  const [error, setError] = useState("");
  const [value, setValue] = useState<boolean | null>(null);
  const unchanged = value === true && state === "已开启" || value === false && state === "未开启";
  return <DeviceControlLayer variant="dialog" labelId="temporary-lock-editor-title" onClose={onClose} unsavedChanges={value !== null}>
    {(close, closeAfterSave) => <>
      <div className="dc-confirm-body">
        <h2 id="temporary-lock-editor-title" className="text-xl font-bold text-slate-900">设置临时锁屏</h2>
        <p className="mt-3 text-sm text-slate-600">设置范围：{label} · 共 {count} 名学生</p>
        <p className="mt-2 text-sm text-slate-500">当前临时锁屏状态：{state}</p>
        {!!selectedObjects?.length && <ul aria-label="本次设置对象列表" className="mt-3 flex flex-wrap gap-2 text-sm">{selectedObjects.map((name) => <li key={name} className="rounded bg-slate-50 px-2 py-1">{name}</li>)}</ul>}
        <fieldset className="mt-5 space-y-3">
          <legend className="mb-3 font-bold">请选择要执行的操作</legend>
          {[true, false].map((enabled) => <label key={String(enabled)} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 ${value === enabled ? "border-indigo-500 bg-indigo-50" : "border-slate-200"}`}>
            <input type="radio" name="temporary-lock-action" checked={value === enabled} onChange={() => setValue(enabled)} />
            <span>
              <span className="block font-medium text-slate-900">{enabled ? "开启临时锁屏" : "解除临时锁屏"}</span>
              <span className="mt-1 block text-sm text-slate-500">{enabled ? `${lockClassCount}个班未开启` : `${unlockClassCount}个班已开启`}</span>
            </span>
          </label>)}
        </fieldset>
        {value !== null && <p role="status" className="mt-5 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">{unchanged ? `所选范围临时锁屏均${state}，无需重复操作。` : value ? "确认后将临时锁定所选范围的学生设备，期间老师无法解锁。" : `解除临时锁屏后，恢复原有日常锁屏状态。${schoolSessionActive ? "全校临时锁屏管控尚未结束，老师仍不可修改锁屏。" : "老师恢复锁屏操作权限。"}`}</p>}
      </div>
      {error && <ControlValidationNotice message={error} onClose={() => setError("")} />}
      <div className="dc-confirm-footer">
        <button type="button" className="dc-btn" onClick={close}>取消</button>
        <button type="button" className="dc-btn-primary" disabled={unchanged} onClick={() => { if (value === null) { setError("请选择要执行的操作：开启临时锁屏或解除临时锁屏"); return; } if (unchanged) return; onSave(value); closeAfterSave(); }}>确认{value === null ? "设置" : value ? "开启" : "解除"}</button>
      </div>
    </>}
  </DeviceControlLayer>;
};
