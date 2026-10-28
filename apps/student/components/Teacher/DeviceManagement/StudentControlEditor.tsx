import React, { useRef, useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import {
  BorrowSchedule,
  StudentControl,
  validateSchedule,
  schoolDate,
  weekdayNames,
} from "../data/hierarchicalDeviceControl";
import { DeviceControlLayer } from "./DeviceControlLayer";
import { ControlValidationNotice } from "./ControlValidationNotice";
import { ControlToast } from "./ControlToast";

export type ControlEditorValue = {
  schedule?: BorrowSchedule;
  answer?: boolean;
  explanation?: boolean;
  applyScope?: "all" | "unmodified";
};
export const StudentControlEditor: React.FC<{
  initialApplyScope?: "all" | "unmodified";
  targetLabel: string;
  count: number;
  selectedObjects?: string[];
  schedule?: BorrowSchedule;
  homework?: Pick<StudentControl, "answer" | "explanation">;
  requireApplyScope?: boolean;
  batchDefaults?: boolean;
  activeDateEdit?: boolean;
  onClose: () => void;
  onSave: (value: ControlEditorValue) => void;
}> = ({ initialApplyScope, targetLabel, count, selectedObjects, schedule, homework, requireApplyScope, batchDefaults, activeDateEdit = false, onClose, onSave }) => {
  const [draft, setDraft] = useState(schedule);
  const [answer, setAnswer] = useState(homework?.answer ?? false);
  const [explanation, setExplanation] = useState(
    homework?.explanation ?? false,
  );
  const [error, setError] = useState("");
  const [restoreNotice, setRestoreNotice] = useState(0);
  const [applyScope, setApplyScope] = useState<"all" | "unmodified" | null>(initialApplyScope ?? null);
  const initial = useRef(JSON.stringify({ draft, answer, explanation, applyScope }));
  const dirty = initial.current !== JSON.stringify({ draft, answer, explanation, applyScope });
  const showApplyScope = requireApplyScope && draft?.mode !== "dates";
  const update = (changes: Partial<BorrowSchedule>) => {
    setError("");
    setDraft((current) => (current ? { ...current, ...changes } : current));
  };
  const submit = () => {
    if (draft) {
      const problem = validateSchedule(draft, new Date(), activeDateEdit ? schedule?.startDate : undefined);
      if (problem) {
        setError(problem);
        return;
      }
    }
    if (showApplyScope && !applyScope) {
      setError("请选择本次修改范围");
      return;
    }
    setError("");
    onSave(draft ? { schedule: draft, applyScope: draft.mode === "dates" ? "all" : applyScope ?? undefined } : { answer, explanation, applyScope: applyScope ?? undefined });
  };
  const inputClass =
    "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm";
  const now = new Date();
  const today = schoolDate(now);
  return (
    <DeviceControlLayer
      labelId="student-control-editor-title"
      level={1}
      onClose={onClose}
      unsavedChanges={dirty}
    >
      {(close) => (
        <>
          <header className="flex items-center justify-between border-b p-6">
            <h2
              id="student-control-editor-title"
              className="text-xl font-bold text-slate-900"
            >
              {draft
                ? draft.mode === "weekly"
                  ? "设置每周借用规则"
                  : "设置指定日期借用规则"
                : "设置智阅作业权限"}
            </h2>
            <button
              type="button"
              aria-label="关闭设置"
              onClick={close}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            >
              <X size={20} />
            </button>
          </header>
          <div className="dc-panel-body space-y-6">
            {!draft && <div className="text-sm leading-6 text-slate-500"><p>全校默认规则：不允许查看答案和详解。</p></div>}
            <div className="dc-target">
              <p className="text-sm font-bold text-indigo-900">{targetLabel}</p>
              <p className="mt-1 text-xs text-indigo-700">
                {`本次设置影响 ${count} 名学生`}
              </p>
              {!!selectedObjects?.length && (
                <ul className="dc-selected-objects" aria-label="本次设置对象列表">
                  {selectedObjects.map((name) => (
                    <li key={name}>{name}</li>
                  ))}
                </ul>
              )}
            </div>
            {draft ? (
              <>
                <div>
                  <h3 className="mb-3 text-sm font-bold text-slate-800">
                    <span className="mr-1 text-red-500">*</span>{draft.mode === "weekly" ? "适用星期" : "适用日期"}
                  </h3>
                  {draft.mode === "weekly" ? (
                    <div className="dc-weekdays">
                      {weekdayNames.map((day, index) => (
                        <label key={day} className="dc-choice">
                          <input
                            type="checkbox"
                            checked={draft.weekdays.includes(index)}
                            onChange={() =>
                              update({
                                weekdays: draft.weekdays.includes(index)
                                  ? draft.weekdays.filter((d) => d !== index)
                                  : [...draft.weekdays, index].sort(),
                              })
                            }
                          />
                          {day}
                        </label>
                      ))}
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-center gap-3">
                        <input
                          type="date"
                          aria-label="开始日期"
                          min={today}
                          disabled={activeDateEdit}
                          value={draft.startDate}
                          onChange={(e) =>
                            update({ startDate: e.target.value })
                          }
                          className={inputClass}
                        />
                        <span className="text-slate-400">至</span>
                        <input
                          type="date"
                          aria-label="结束日期"
                          min={draft.startDate && draft.startDate > today ? draft.startDate : today}
                          value={draft.endDate}
                          onChange={(e) => update({ endDate: e.target.value })}
                          className={inputClass}
                        />
                      </div>
                      <p className="mt-2 text-xs leading-5 text-slate-500">{activeDateEdit ? '规则已生效，开始日期和借用方式保持不变，仅可调整结束日期。' : '生效日期只能选择当天及之后，包含起止日期。到期后按剩余规则执行；无每周规则时默认可借。已失效规则仅支持删除。'}</p>
                    </>
                  )}
                </div>
                {draft.mode === "dates" && !activeDateEdit && (
                  <div>
                    <h3 className="mb-3 text-sm font-bold text-slate-800">
                      借用方式
                    </h3>
                    <div className="flex gap-6">
                      {[false, true].map((deny) => (
                        <label key={String(deny)} className="dc-choice">
                          <input
                            type="radio"
                            name="date-borrow-mode"
                            checked={draft.deny === deny}
                            onChange={() => update({ deny })}
                          />
                          {deny ? "全天禁止借用" : "按时段借用"}
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                {!activeDateEdit && !(draft.mode === "dates" && draft.deny) && (
                  <div>
                    <h3 className="mb-3 text-sm font-bold text-slate-800">
                      <span className="mr-1 text-red-500">*</span>借用时段
                    </h3>
                    <div className="space-y-3">
                      {draft.periods.map((period, index) => (
                        <div key={index} className="dc-time-row">
                          <input
                            type="time"
                            aria-label={`时段${index + 1}开始时间`}
                            value={period.start}
                            onChange={(e) =>
                              update({
                                periods: draft.periods.map((p, i) =>
                                  i === index
                                    ? { ...p, start: e.target.value }
                                    : p,
                                ),
                              })
                            }
                            className={inputClass}
                          />
                          <span className="text-slate-400">至</span>
                          <input
                            type="time"
                            aria-label={`时段${index + 1}结束时间`}
                            value={period.end}
                            onChange={(e) =>
                              update({
                                periods: draft.periods.map((p, i) =>
                                  i === index
                                    ? { ...p, end: e.target.value }
                                    : p,
                                ),
                              })
                            }
                            className={inputClass}
                          />
                          <button
                            type="button"
                            aria-label={`删除时段${index + 1}`}
                            onClick={() =>
                              update({
                                periods: draft.periods.filter(
                                  (_, i) => i !== index,
                                ),
                              })
                            }
                            className="p-2 text-slate-400 hover:text-red-600"
                          >
                            <Trash2 size={17} />
                          </button>
                          {index === draft.periods.length - 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                update({
                                  periods: [
                                    ...draft.periods,
                                    { start: "", end: "" },
                                  ],
                                })
                              }
                              className="flex items-center gap-1 rounded-lg border border-indigo-200 px-3 py-2 text-sm text-indigo-600"
                            >
                              <Plus size={16} />
                              添加时段
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    {!draft.periods.length && (
                      <button
                        type="button"
                        onClick={() =>
                          update({ periods: [{ start: "", end: "" }] })
                        }
                        className="text-sm text-indigo-600"
                      >
                        ＋ 添加时段
                      </button>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-5">
                {[
                  { label: "查看答案", value: answer, change: setAnswer },
                  {
                    label: "查看详解",
                    value: explanation,
                    change: setExplanation,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="dc-rule-card rounded-xl border p-4"
                  >
                    <h3 className="mb-3 text-sm font-bold text-slate-800">
                      <span className="mr-1 text-red-500">*</span>{item.label}
                    </h3>
                    <div className="flex gap-8">
                      {[false, true].map((allowed) => (
                        <label key={String(allowed)} className="dc-choice">
                          <input
                            type="radio"
                            name={item.label}
                            checked={item.value === allowed}
                            onChange={() => item.change(allowed)}
                          />
                          {allowed ? "允许" : "不允许"}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {showApplyScope && (
              <fieldset className="rounded-lg bg-slate-50 p-4">
                <legend className="text-sm font-bold text-slate-800"><span className="text-red-500">*</span> {draft ? "本次修改哪些学生？" : "本次如何修改？"}</legend>
                <div className="mt-3 space-y-3">
                  <label className="block cursor-pointer">
                    <span className="flex items-start gap-3"><input type="radio" name="apply-scope" checked={applyScope === "all"} onChange={() => { setApplyScope("all"); setError(""); }} className="mt-1" /><span><b className="block text-sm text-slate-900">{!draft ? "修改所选学生的全部科目" : targetLabel === "全校" ? "全校修改" : "修改当前范围全部学生"}</b><span className="mt-1 block text-xs leading-5 text-slate-500">{!draft ? "将本次答案和解析权限应用于所选学生的全部科目，替换学校和老师此前的设置。" : "覆盖本次范围内全部学生，包括老师此前单独设置的学生。"}</span></span></span>
                  </label>
                  <label className="block cursor-pointer">
                    <span className="flex items-start gap-3"><input type="radio" name="apply-scope" checked={applyScope === "unmodified"} onChange={() => { setApplyScope("unmodified"); setError(""); }} className="mt-1" /><span><b className="block text-sm text-slate-900">{!draft ? "保留老师设置的科目" : "跳过老师单独设置的学生"}</b><span className="mt-1 block text-xs leading-5 text-slate-500">{!draft ? "逐个学生保留老师设置过的科目，其余科目按本次设置修改。" : "保留老师已按班级或学生设置的规则。"}</span></span></span>
                  </label>
                </div>
              </fieldset>
            )}
            {error && <ControlValidationNotice message={error} onClose={() => setError("")} />}
          </div>
          {restoreNotice > 0 && <ControlToast key={restoreNotice} message="已填入默认设置，保存后生效" tone="success" duration={3000} onClose={() => setRestoreNotice(0)} />}
      <footer className="flex justify-end gap-3 border-t p-5">
            {!draft && <button type="button" className="dc-btn mr-auto" onClick={() => { setAnswer(false); setExplanation(false); setError(""); setRestoreNotice((value) => value + 1); }}>恢复全校默认规则</button>}
            <button type="button" onClick={close} className="dc-btn">
              取消
            </button>
            <button type="button" onClick={submit} disabled={activeDateEdit && draft?.endDate === schedule?.endDate} className="dc-btn-primary">
              {!draft || draft.mode === "dates" ? "保存" : "保存并生效"}
            </button>
          </footer>
        </>
      )}
    </DeviceControlLayer>
  );
};
