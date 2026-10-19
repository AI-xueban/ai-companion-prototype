import React, { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { schoolDeviceClasses } from "../data/schoolDeviceClasses";
import {
  ControlModule,
  deviceControlStudents,
  durationRuleText,
  DurationRule,
  policySignature,
  StudentControl,
  weekdayNames,
  weekdayRangeText,
} from "../data/hierarchicalDeviceControl";
import { DeviceControlLayer } from "./DeviceControlLayer";

type DifferenceModule = Exclude<ControlModule, "borrowing">;

const ruleSummary = (
  control: StudentControl,
  module: DifferenceModule,
  defaultDurationRule: DurationRule,
) => {
  if (module === "duration") {
    const groups = weekdayNames.reduce<Array<{ text: string; days: number[] }>>(
      (result, _, day) => {
        const rule =
          control.durationRules.find((item) => item.weekdays.includes(day)) ??
          defaultDurationRule;
        const text = durationRuleText(rule);
        const existing = result.find((item) => item.text === text);
        if (existing) existing.days.push(day);
        else result.push({ text, days: [day] });
        return result;
      },
      [],
    );
    return groups.map(
      (group) => `${weekdayRangeText(group.days)}：${group.text}`,
    );
  }
  if (module === "homework") {
    return [
      `查看答案：${control.answer ? "允许" : "不允许"}；查看详解：${control.explanation ? "允许" : "不允许"}`,
    ];
  }
  if (module === "world") {
    return [control.world ? "已开放万象视界权限" : "已关闭万象视界权限"];
  }
  return [control.locked ? "已锁屏" : "未锁屏"];
};

export const ControlDifferenceDrawer: React.FC<{
  label: string;
  ids: string[];
  module: DifferenceModule;
  controls: Record<string, StudentControl>;
  defaultDurationRule: DurationRule;
  onClose: () => void;
}> = ({ label, ids, module, controls, defaultDurationRule, onClose }) => {
  const groups = useMemo(() => {
    const grouped = new Map<string, string[]>();
    ids.forEach((id) => {
      const key = policySignature(controls[id], module);
      grouped.set(key, [...(grouped.get(key) ?? []), id]);
    });
    return [...grouped.values()].sort((a, b) => b.length - a.length);
  }, [controls, ids, module]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const heading = "px-4 py-3 text-left text-xs font-medium text-slate-500";
  const cell = "px-4 py-3 text-sm text-slate-700";

  return (
    <DeviceControlLayer labelId="control-difference-title" size="wide" onClose={onClose}>
      {(close) => (
        <>
          <header className="flex items-center justify-between border-b border-slate-200 p-6">
            <div>
              <h2 id="control-difference-title" className="text-xl font-bold text-slate-900">
                {label} · 学生规则差异
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                按当前生效规则分组 · 共 {ids.length} 名学生、{groups.length} 组规则
              </p>
            </div>
            <button type="button" aria-label="关闭规则差异" onClick={close} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
              <X size={20} />
            </button>
          </header>
          <div className="dc-panel-body space-y-4">
            {groups.map((groupIds, index) => {
              const control = controls[groupIds[0]];
              const students = deviceControlStudents.filter((student) => groupIds.includes(student.id));
              const open = expanded === index;
              return (
                <article key={policySignature(control, module)} className="overflow-hidden rounded-xl border border-slate-200">
                  <div className="flex flex-wrap items-start justify-between gap-4 bg-slate-50 px-5 py-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-bold text-slate-900">生效规则 {index + 1}</h3>
                        <span className="text-sm text-slate-500">{groupIds.length} 名学生</span>
                      </div>
                      <div className="mt-2 space-y-1 text-sm text-slate-700">
                        {ruleSummary(control, module, defaultDurationRule).map((text) => <p key={text}>{text}</p>)}
                      </div>
                    </div>
                    <button type="button" onClick={() => setExpanded(open ? null : index)} className="dc-link flex items-center gap-1 whitespace-nowrap">
                      {open ? "收起学生" : "查看学生"}
                      {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </button>
                  </div>
                  {open && (
                    <div className="max-h-80 overflow-auto border-t border-slate-200">
                      <table className="dc-data-table text-left">
                        <thead className="sticky top-0 bg-white">
                          <tr>{["编号", "姓名", "年级", "班级"].map((name) => <th key={name} className={heading}>{name}</th>)}</tr>
                        </thead>
                        <tbody>
                          {students.map((student) => (
                            <tr key={student.id} className="border-t border-slate-100">
                              <td className={cell}>{student.number}</td>
                              <td className={cell}>{student.name}</td>
                              <td className={cell}>{student.grade}年级</td>
                              <td className={cell}>{schoolDeviceClasses.find((item) => item.id === student.classId)?.name}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </>
      )}
    </DeviceControlLayer>
  );
};
