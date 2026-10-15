import React, { useState } from "react";
import { ArrowLeft, X } from "lucide-react";
import { schoolDeviceClasses } from "../data/schoolDeviceClasses";
import {
  BorrowSchedule,
  ControlModule,
  DeviceStudent,
  scheduleDateText,
  schedulePeriodText,
  StudentControl,
} from "../data/hierarchicalDeviceControl";
import { DeviceControlLayer } from "./DeviceControlLayer";

export const StudentControlDetail: React.FC<{
  student: DeviceStudent;
  control: StudentControl;
  module: ControlModule;
  borrowingEnabled: boolean;
  initialMode?: BorrowSchedule["mode"];
  onClose: () => void;
  onEdit: (schedule?: BorrowSchedule) => void;
  onDelete: (schedule: BorrowSchedule) => void;
  onAdd: (mode: BorrowSchedule["mode"]) => void;
  onAction: (value: boolean) => void;
}> = ({
  student,
  control,
  module,
  borrowingEnabled,
  initialMode = "weekly",
  onClose,
  onEdit,
  onDelete,
  onAdd,
  onAction,
}) => {
  const [mode, setMode] = useState<"weekly" | "dates">(initialMode);
  const schedules = control.schedules.filter((s) => s.mode === mode);
  const modified = control.updated[module];
  return (
    <DeviceControlLayer
      labelId="student-control-detail-title"
      onClose={onClose}
    >
      {(close) => (
        <>
          <header className="flex items-center justify-between border-b p-6">
            <div>
              <h2
                id="student-control-detail-title"
                className="text-xl font-bold text-slate-900"
              >
                {student.name}
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {
                  schoolDeviceClasses.find((c) => c.id === student.classId)
                    ?.name
                }{" "}
                · 编号 {student.number}
              </p>
            </div>
            <button
              type="button"
              aria-label="关闭学生详情"
              onClick={close}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            >
              <X size={20} />
            </button>
          </header>
          <div className="dc-panel-body space-y-5">
            <button
              type="button"
              onClick={close}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:border-indigo-300 hover:text-indigo-600"
            >
              <ArrowLeft size={17} />
              返回学生列表
            </button>
            {module === "borrowing" ? (
              <>
                {!borrowingEnabled && (
                  <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                    全校借用管控已关闭，当前不限制借用时间。
                  </p>
                )}
                <div
                  role="tablist"
                  aria-label="学生借用规则类型"
                  className="dc-student-tabs flex gap-2 rounded-xl bg-slate-100 p-1"
                >
                  {(["weekly", "dates"] as const).map((value) => (
                    <button
                      type="button"
                      role="tab"
                      aria-selected={mode === value}
                      key={value}
                      onClick={() => setMode(value)}
                      className={`flex-1 rounded-lg px-3 py-2 text-sm font-bold ${mode === value ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"}`}
                    >
                      {value === "weekly"
                        ? "每周固定借用规则"
                        : "指定日期借用规则"}
                      （
                      {control.schedules.filter((s) => s.mode === value).length}
                      ）
                    </button>
                  ))}
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={!borrowingEnabled}
                    onClick={() => onAdd(mode)}
                    className="dc-btn-primary"
                  >
                    {mode === "weekly"
                      ? "新增每周借用规则"
                      : "新增指定日期借用规则"}
                  </button>
                </div>
                {mode === "dates" && (
                  <p className="text-xs leading-6 text-slate-500">
                    指定日期借用规则优先生效，到期或删除后自动恢复每周固定借用规则。
                  </p>
                )}
                {!schedules.length && (
                  <div className="rounded-xl border border-dashed p-8 text-center text-sm text-slate-400">
                    暂无
                    {mode === "weekly"
                      ? "每周固定借用规则"
                      : "指定日期借用规则"}
                  </div>
                )}
                {schedules.map((s) => (
                  <article
                    key={s.id}
                    className="dc-rule-card rounded-xl border p-4"
                  >
                    <p className="text-sm font-bold text-slate-800">
                      {scheduleDateText(s)}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      {schedulePeriodText(s)}
                    </p>
                    <div className="mt-4 flex justify-end gap-5">
                      <button
                        type="button"
                        disabled={!borrowingEnabled}
                        onClick={() => onEdit(s)}
                        className="text-sm font-bold text-indigo-600 disabled:opacity-40"
                      >
                        编辑
                      </button>
                      <button
                        type="button"
                        disabled={!borrowingEnabled}
                        onClick={() => onDelete(s)}
                        className="text-sm font-bold text-red-600 disabled:opacity-40"
                      >
                        删除
                      </button>
                    </div>
                  </article>
                ))}
              </>
            ) : module === "homework" ? (
              <>
                <div className="rounded-xl border p-4 text-sm">
                  <p>
                    查看答案：
                    <strong>{control.answer ? "允许" : "不允许"}</strong>
                  </p>
                  <p className="mt-3">
                    查看详解：
                    <strong>{control.explanation ? "允许" : "不允许"}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onEdit()}
                  className="dc-btn-primary"
                >
                  设置权限
                </button>
              </>
            ) : (
              <>
                <div className="rounded-xl border p-4 text-sm">
                  当前状态：
                  <strong>
                    {module === "world"
                      ? control.world
                        ? "已开放"
                        : "已关闭"
                      : control.locked
                        ? "已锁屏"
                        : "未锁屏"}
                  </strong>
                </div>
                <div className="flex gap-3">
                  {[module === "world" ? !control.world : !control.locked].map((value) => (
                    <button
                      type="button"
                      key={String(value)}
                      onClick={() => onAction(value)}
                      className={`rounded-lg border px-4 py-2.5 text-sm font-bold ${value ? (module === "lock" ? "border-red-200 bg-red-50 text-red-600" : "border-indigo-600 bg-indigo-600 text-white") : "border-slate-200 text-slate-700"}`}
                    >
                      {module === "world"
                        ? value
                          ? "开放权限"
                          : "关闭权限"
                        : value
                          ? "锁屏"
                          : "解除锁屏"}
                    </button>
                  ))}
                </div>
              </>
            )}
            <div className="border-t pt-4 text-xs leading-6 text-slate-500">
              {modified ? (
                <>
                  最后操作：{modified.by}
                  <br />
                  操作时间：{modified.at}
                </>
              ) : (
                "当前使用初始配置，尚无操作记录。"
              )}
            </div>
          </div>
          <footer className="flex justify-end border-t p-5">
            <button type="button" onClick={close} className="dc-btn">
              关闭
            </button>
          </footer>
        </>
      )}
    </DeviceControlLayer>
  );
};
