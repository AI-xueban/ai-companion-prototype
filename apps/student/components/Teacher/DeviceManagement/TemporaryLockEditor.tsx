import { ControlToast } from "./ControlToast";
import React, { useState } from "react";
import { X } from "lucide-react";
import { DeviceControlLayer } from "./DeviceControlLayer";
import { ControlValidationNotice } from "./ControlValidationNotice";

export const TemporaryLockEditor: React.FC<{
  label: string;
  selectedObjects?: string[];
  count: number;
  lockClassNames: string[];
  lockedCount: number;
  unlockClassNames: string[];
  schoolSessionActive?: boolean;
  state: "已开启" | "未开启" | "部分开启";
  onClose: () => void;
  onSave: (enabled: boolean) => void;
}> = ({ label, selectedObjects, count, lockedCount, lockClassNames, unlockClassNames, schoolSessionActive, state, onClose, onSave }) => {
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [value, setValue] = useState<boolean | null>(null);
  const changed = value === null ? 0 : value ? count - lockedCount : lockedCount;
  const unchanged = value === true && state === "已开启" || value === false && state === "未开启";
  return <DeviceControlLayer labelId="temporary-lock-editor-title" onClose={onClose} unsavedChanges={value !== null}>
    {(close, closeAfterSave) => <>
      <header className="flex items-center justify-between border-b p-6"><h2 id="temporary-lock-editor-title" className="text-xl font-bold text-slate-900">设置临时锁屏</h2><button type="button" aria-label="关闭临时锁屏设置" onClick={close}><X size={20} /></button></header>
      <div className="dc-panel-body">
        <p className="mt-3 text-sm text-slate-600">设置范围：{label}</p>
        <p className="mt-2 text-sm text-slate-500">当前临时锁屏状态：{state}</p>
        {!!selectedObjects?.length && <ul aria-label="本次设置对象列表" className="mt-3 flex flex-wrap gap-2 text-sm">{selectedObjects.map((name) => <li key={name} className="rounded bg-slate-50 px-2 py-1">{name}</li>)}</ul>}
        <fieldset className="mt-5 space-y-3">
          <legend className="mb-3 font-bold"><span className="mr-1 text-red-500" aria-hidden="true">*</span>请选择要执行的操作</legend>
          {[true, false].map((enabled) => <label key={String(enabled)} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 ${value === enabled ? "border-indigo-500 bg-indigo-50" : "border-slate-200"}`}>
            <input type="radio" name="temporary-lock-action" checked={value === enabled} onChange={() => { setValue(enabled); setError(""); setNotice((enabled ? count - lockedCount : lockedCount) === 0 ? "无需修改" : ""); }} />
            <span>
              <span className="block font-medium text-slate-900">{enabled ? "开启临时锁屏" : "解除临时锁屏"}</span>
              <span className="mt-1 block text-sm text-slate-500">{enabled ? `${lockClassNames.length}个班有学生未开启` : `${unlockClassNames.length}个班有学生已开启`}</span>
            </span>
          </label>)}
        </fieldset>
        {value === false && <p className="mt-4 text-sm leading-6 text-slate-600">解除后执行当前日常锁屏设置，恢复所选班级老师的锁屏管控权限；其他班级不受影响。</p>}
        {value !== null && changed > 0 && <p className="mt-4 max-h-32 overflow-y-auto text-xs leading-6 text-slate-500">本次涉及班级：{(value ? lockClassNames : unlockClassNames).join("、")}</p>}
        {notice && <ControlToast message={notice} tone="info" onClose={() => setNotice("")} />}
      {error && <ControlValidationNotice message={error} onClose={() => setError("")} />}
      </div>
      <footer className="dc-confirm-footer">
        <button type="button" className="dc-btn" onClick={closeAfterSave}>取消</button>
        <button type="button" className="dc-btn-primary" disabled={unchanged} onClick={() => { if (value === null) { setError("请选择要执行的操作：开启临时锁屏或解除临时锁屏"); return; } if (unchanged) return; onSave(value); closeAfterSave(); }}>确认{value === null ? "设置" : value ? "开启" : "解除"}</button>
      </footer>
    </>}
  </DeviceControlLayer>;
};
