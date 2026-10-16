import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowLeftRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock,
  Info,
  History,
  LockKeyhole,
  Power,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { schoolDeviceClasses } from "../data/schoolDeviceClasses";
import { DEMO_TEACHER_ACCOUNTS, TeacherPortalUser } from "../data/teacherAccess";
import {
  BorrowSchedule,
  ControlModule,
  controlGrades,
  defaultDurationRule,
  DeviceStudent,
  deviceControlStudents,
  durationRuleText,
  DurationRule,
  initialStudentControls,
  mergeBorrowSchedule,
  newBorrowSchedule,
  newDurationRule,
  policySignature,
  scheduleDateText,
  schedulePeriodText,
  schedulesConflict,
  StudentControl,
  weekdayRangeText,
} from "../data/hierarchicalDeviceControl";
import {
  ControlEditorValue,
  StudentControlEditor,
} from "./StudentControlEditor";
import { StudentControlDetail } from "./StudentControlDetail";
import { borrowingConfigurationKey } from "../data/borrowingOverview";
import { BorrowingOverviewDrawer } from "./BorrowingOverviewDrawer";
import {
  configurationColumnCount,
  ControlConfigurationCells,
  ControlConfigurationHeaders,
} from "./ControlConfigurationColumns";
import { DeviceControlLayer } from "./DeviceControlLayer";
import { DurationRuleEditor } from "./DurationRuleEditor";
import "./DeviceControl.css";

const tabs = [
  { id: "borrowing", label: "借用管控", icon: Clock },
  { id: "duration", label: "使用时长管控", icon: Clock },
  { id: "homework", label: "智阅作业管控", icon: BookOpen },
  { id: "world", label: "万象视界管控", icon: Sparkles },
  { id: "lock", label: "锁屏管控", icon: LockKeyhole },
] as const;
type ScopeRow = {
  id: string;
  label: string;
  subtitle: string;
  ids: string[];
  grade?: number;
  classId?: string;
  student?: DeviceStudent;
};
type Editor = {
  ids: string[];
  label: string;
  selectedObjects?: string[];
  schedule?: BorrowSchedule;
  editingId?: string;
  requireApplyScope?: boolean;
  baseSignatures: Record<string, string>;
};
type Confirmation = {
  title: string;
  scope: string;
  count: number;
  description: string;
  warning?: React.ReactNode;
  resultPreview?: React.ReactNode;
  action: string;
  danger?: boolean;
  run: () => void;
};
type OperationRecord = {
  id: string;
  module: ControlModule;
  title: string;
  scope: string;
  time: string;
  operator: string;
  before: string[];
  after: string[];
  ids: string[];
  snapshot: Record<string, StudentControl>;
};
const button = "dc-btn";
const primary = "dc-btn-primary";
const CONTROL_STORAGE_KEY = "ai-companion-device-controls-v2";
const HISTORY_STORAGE_KEY = "ai-companion-device-control-history-v2";
const localDateText = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};
const removeExpiredSchedules = (controls: Record<string, StudentControl>) => {
  const today = localDateText();
  return Object.fromEntries(Object.entries(controls).map(([id, control]) => [id, {
    ...control,
    schedules: control.schedules.filter((schedule) => schedule.mode !== "dates" || !schedule.endDate || schedule.endDate >= today),
  }]));
};
const limitHistoryByModule = (records: OperationRecord[]) => {
  const counts: Partial<Record<ControlModule, number>> = {};
  return records.filter((record) => {
    const count = counts[record.module] ?? 0;
    if (count >= 100) return false;
    counts[record.module] = count + 1;
    return true;
  });
};
const readStoredControls = () => {
  if (typeof window === "undefined") return { borrow: initialStudentControls(), duration: initialStudentControls() };
  try {
    const stored = JSON.parse(window.localStorage.getItem(CONTROL_STORAGE_KEY) ?? "null");
    if (stored?.borrow && stored?.duration) return stored as { borrow: Record<string, StudentControl>; duration: Record<string, StudentControl> };
  } catch { /* 使用初始演示数据 */ }
  const initial = initialStudentControls();
  return { borrow: initial, duration: initialStudentControls() };
};
const readStoredHistory = (): OperationRecord[] => {
  if (typeof window === "undefined") return [];
  try {
    const stored = JSON.parse(window.localStorage.getItem(HISTORY_STORAGE_KEY) ?? "[]");
    return Array.isArray(stored) ? limitHistoryByModule(stored) : [];
  } catch { return []; }
};
const labelClass = (id: string) =>
  schoolDeviceClasses.find((c) => c.id === id)?.name ?? "";

export const HierarchicalDeviceControl: React.FC<{ currentUser: TeacherPortalUser }> = ({
  currentUser,
}) => {
  const [tab, setTab] = useState<ControlModule>("borrowing");
  const [borrowMode, setBorrowMode] =
    useState<BorrowSchedule["mode"]>("weekly");
  const [grade, setGrade] = useState<number | null>(null);
  const [classId, setClassId] = useState<string | null>(null);
  const [borrowing, setBorrowing] = useState(false);
  const defaultDurationEnabled = true;
  const [defaultDuration, setDefaultDuration] = useState<DurationRule>({ id: "default-duration", weekdays: [0, 1, 2, 3, 4, 5, 6], useDefault: false, ...defaultDurationRule, periods: [] });
  const [storedControls] = useState(readStoredControls);
  const [borrowControls, setBorrowControls] = useState(() => removeExpiredSchedules(storedControls.borrow));
  const [durationControls, setDurationControls] = useState(storedControls.duration);
  const isScheduleTab = tab === "borrowing" || tab === "duration";
  const scheduleEnabled = tab === "duration" || borrowing;
  const controls = tab === "duration" ? durationControls : borrowControls;
  const setControls = tab === "duration" ? setDurationControls : setBorrowControls;
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [overview, setOverview] = useState<{
    label: string;
    ids: string[];
  } | null>(null);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [durationEditor, setDurationEditor] = useState<{ ids: string[]; label: string; rule: DurationRule; isDefault?: boolean; editingId?: string; requireApplyScope?: boolean; baseSignatures: Record<string, string> } | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [operationRecords, setOperationRecords] = useState<OperationRecord[]>(readStoredHistory);
  const [message, setMessage] = useState<{
    text: string;
    tone: "success" | "notice";
  } | null>(null);
  const operatorPhone = currentUser.phone ??
    DEMO_TEACHER_ACCOUNTS.find((user) => user.id === currentUser.id)?.phone;
  const operatorLabel = operatorPhone
    ? `${currentUser.name}（${operatorPhone}）`
    : currentUser.name;
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), 4500);
    return () => clearTimeout(timer);
  }, [message]);
  useEffect(() => {
    try {
      window.localStorage.setItem(CONTROL_STORAGE_KEY, JSON.stringify({ borrow: borrowControls, duration: durationControls }));
    } catch { /* 浏览器存储不可用时继续使用当前会话数据 */ }
  }, [borrowControls, durationControls]);
  useEffect(() => {
    try {
      window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(limitHistoryByModule(operationRecords)));
    } catch { /* 记录较大或浏览器存储不可用时继续使用当前会话数据 */ }
  }, [operationRecords]);
  const currentStudents = deviceControlStudents.filter((s) =>
    tab === "borrowing" ? true : classId ? s.classId === classId : grade ? s.grade === grade : true,
  );
  const scopeLabel = tab === "borrowing" ? "全校" : classId
    ? labelClass(classId)
    : grade
      ? `${grade}年级`
      : "全校";
  const rowType = classId ? "学生" : grade ? "班级" : "年级";
  const resetList = () => {
    setSelected([]);
    setSearch("");
    setFilter("all");
    setPage(1);
    setMessage(null);
  };
  const navigate = (nextGrade: number | null, nextClass: string | null) => {
    setGrade(nextGrade);
    setClassId(nextClass);
    resetList();
  };
  const values = (ids: string[]) =>
    ids.map((id) =>
      tab === "borrowing"
        ? {
            ...controls[id],
            schedules: controls[id].schedules.filter(
              (s) => s.mode === borrowMode,
            ),
          }
        : controls[id],
    );
  const mixed = (ids: string[]) =>
    new Set(
      values(ids).map((s) =>
        tab === "borrowing"
          ? borrowingConfigurationKey(s.schedules, borrowMode)
          : policySignature(s, tab),
      ),
    ).size > 1;
  const status = (ids: string[]) => {
    const entries = values(ids);
    if (ids.length === 1) {
      const value = entries[0],
        modified = value.updated[tab];
      const sub = modified
        ? `最后操作：${modified.by} · ${modified.at}`
        : "尚无操作记录";
      if (tab === "duration") return {
        main: value.durationRules.length || defaultDurationEnabled ? "使用时长受管控" : "不限制使用时长",
        sub: value.durationRules.length ? `${value.durationRules.length} 条规则生效` : defaultDurationEnabled ? "当前执行默认规则" : "当前无时长限制",
        active: value.durationRules.length > 0 || defaultDurationEnabled,
      };
      if (tab === "borrowing")
        return {
          main: value.schedules.length ? "已设置借用规则" : "未设置借用规则",
          sub: `${borrowMode === "weekly" ? "每周固定借用规则" : "指定日期借用规则"} ${value.schedules.length} 条`,
          active: value.schedules.length > 0,
        };
      if (tab === "homework")
        return {
          main: `答案：${value.answer ? "允许" : "不允许"} · 详解：${value.explanation ? "允许" : "不允许"}`,
          sub,
          active: value.answer || value.explanation,
        };
      return {
        main:
          tab === "world"
            ? value.world
              ? "已开放"
              : "已关闭"
            : value.locked
              ? "已锁屏"
              : "未锁屏",
        sub,
        active: tab === "world" ? value.world : value.locked,
      };
    }
    if (tab === "duration") {
      const count = entries.filter((s) => s.durationRules.length).length;
      const controlledCount = defaultDurationEnabled ? ids.length : count;
      return { main: controlledCount === 0 ? "不限制使用时长" : mixed(ids) ? "学生规则有差异" : "学生规则一致", sub: `使用时长受管控 ${controlledCount} / ${ids.length} 人`, active: controlledCount > 0 };
    }
    if (tab === "borrowing") {
      const count = entries.filter((s) => s.schedules.length).length;
      return {
        main:
          count === 0
            ? "未设置借用规则"
            : mixed(ids)
              ? "借用规则存在差异"
              : "借用规则一致",
        sub: `已设置 ${count} / ${ids.length} 人`,
        active: count > 0,
      };
    }
    if (tab === "homework") {
      const answers = entries.filter((s) => s.answer).length,
        explanations = entries.filter((s) => s.explanation).length;
      return {
        main: mixed(ids)
          ? "权限存在差异"
          : entries[0]?.answer || entries[0]?.explanation
            ? "权限一致"
            : "答案、详解均不允许",
        sub: `答案允许 ${answers} 人 · 详解允许 ${explanations} 人`,
        active: answers + explanations > 0,
      };
    }
    const count = entries.filter((s) =>
      tab === "world" ? s.world : s.locked,
    ).length;
    const word = tab === "world" ? "开放" : "锁屏";
    return {
      main:
        count === 0
          ? tab === "world"
            ? "全部已关闭"
            : "全部未锁屏"
          : count === ids.length
            ? `全部已${word}`
            : `部分学生已${word}`,
      sub: `已${word} ${count} / ${ids.length} 人`,
      active: count > 0,
    };
  };
  const rows: ScopeRow[] = classId
    ? currentStudents.map((s) => ({
        id: s.id,
        label: s.name,
        subtitle: s.number,
        ids: [s.id],
        student: s,
      }))
    : grade
      ? schoolDeviceClasses
          .filter((c) => c.grade === grade)
          .map((c) => ({
            id: c.id,
            label: c.name,
            subtitle: "",
            ids: deviceControlStudents
              .filter((s) => s.classId === c.id)
              .map((s) => s.id),
            grade,
            classId: c.id,
          }))
      : controlGrades.map((g) => ({
          id: `grade-${g}`,
          label: `${g}年级`,
          subtitle: `${schoolDeviceClasses.filter((c) => c.grade === g).length} 个班级`,
          ids: deviceControlStudents
            .filter((s) => s.grade === g)
            .map((s) => s.id),
          grade: g,
        }));
  const filteredRows = rows.filter((row) => {
    if (search && !`${row.label} ${row.subtitle}`.includes(search.trim()))
      return false;
    if (filter === "mixed") return mixed(row.ids);
    if (filter === "same") return !mixed(row.ids);
    if (filter === "active") return status(row.ids).active;
    if (filter === "inactive") return !status(row.ids).active;
    return true;
  });
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageRows = filteredRows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const selectedRows = rows.filter((r) => selected.includes(r.id));
  const withSelected = (action: () => void) => {
    if (!selectedRows.length) {
      setMessage({
        text: `请先选择所要操作的${rowType}`,
        tone: "notice",
      });
      return;
    }
    setMessage(null);
    action();
  };
  const selectedObjectNames = selectedRows.map((row) =>
    row.student && row.subtitle
      ? `${row.label}（${row.subtitle}）`
      : row.label,
  );
  const targetIds = selectedRows.flatMap((r) => r.ids);
  const booleanTargetValues = targetIds.map((id) =>
    tab === "world" ? controls[id].world : controls[id].locked,
  );
  const availableBooleanActions = !selectedRows.length
    ? [true, false]
    : booleanTargetValues.every(Boolean)
      ? [false]
      : booleanTargetValues.every((value) => !value)
        ? [true]
        : [true, false];
  const targetLabel = selected.length
    ? classId
      ? `已选 ${selected.length} 名学生`
      : `已选 ${selected.length} 个${rowType}`
    : scopeLabel;
  const checkedAll =
    pageRows.length > 0 && pageRows.every((r) => selected.includes(r.id));
  const scopeStatus = status(currentStudents.map((s) => s.id));
  const detailStudent = deviceControlStudents.find((s) => s.id === detailId);
  const showBorrowOverview = (row: ScopeRow) =>
    row.student
      ? setDetailId(row.student.id)
      : setOverview({ label: row.label, ids: row.ids });
  const writeControls = (
    ids: string[],
    apply: (value: StudentControl) => StudentControl,
    actionTitle = "修改管控设置",
  ) => {
    const at = new Date().toLocaleString("zh-CN", { hour12: false });
    const current = controls;
    const next = { ...current };
    const snapshot = Object.fromEntries(ids.map((id) => [id, current[id]]));
    const summarize = (value: StudentControl) => {
      if (tab === "borrowing") return value.schedules.length ? value.schedules.map((rule) => `${scheduleDateText(rule)}；${schedulePeriodText(rule)}`) : ["无借用规则"];
      if (tab === "duration") return value.durationRules.length ? value.durationRules.map((rule) => `${scheduleDateText({ ...rule, mode: "weekly", startDate: "", endDate: "", deny: false })}；${durationRuleText(rule)}`) : [`每天；${durationRuleText(defaultDuration)}`];
      if (tab === "homework") return [`查看答案：${value.answer ? "允许" : "不允许"}；查看详解：${value.explanation ? "允许" : "不允许"}`];
      if (tab === "world") return [value.world ? "万象视界已开放" : "万象视界已关闭"];
      return [value.locked ? "已锁屏" : "未锁屏"];
    };
    ids.forEach((id) => {
      next[id] = {
        ...apply(current[id]),
        updated: { ...current[id].updated, [tab]: { by: operatorLabel, at } },
      };
    });
    const effectiveNext = tab === "borrowing" ? removeExpiredSchedules(next) : next;
    const before = Array.from(new Set(ids.flatMap((id) => summarize(current[id]))));
    const after = Array.from(new Set(ids.flatMap((id) => summarize(effectiveNext[id]))));
    setControls(effectiveNext);
    setOperationRecords((records) => limitHistoryByModule([{ id: `record-${Date.now()}`, module: tab, title: actionTitle, scope: ids.length === deviceControlStudents.length ? "全校" : `${ids.length} 名学生`, time: at, operator: operatorLabel, before, after, ids: [...ids], snapshot }, ...records]));
    setSelected([]);
    setMessage({ text: `设置已生效，影响 ${ids.length} 名学生`, tone: "success" });
  };
  const openEditor = (
    ids: string[],
    label: string,
    mode?: BorrowSchedule["mode"],
    schedule?: BorrowSchedule,
    selectedObjects?: string[],
  ) => {
    setMessage(null);
    setEditor({
      ids,
      label,
      selectedObjects,
      schedule: schedule
        ? {
            ...schedule,
            weekdays: [...schedule.weekdays],
            periods: schedule.periods.map((p) => ({ ...p })),
          }
        : mode
          ? newBorrowSchedule(mode)
          : undefined,
      editingId: schedule?.id,
      requireApplyScope: !classId && ids.length > 1,
      baseSignatures: Object.fromEntries(ids.map((id) => [id, policySignature(controls[id], tab)])),
    });
  };
  const openDurationEditor = (ids: string[], label: string, rule?: DurationRule, isDefault = false) => {
    setDurationEditor({ ids, label, rule: rule ?? newDurationRule(), isDefault, editingId: rule?.id, requireApplyScope: !classId && ids.length > 1 && !isDefault, baseSignatures: Object.fromEntries(ids.map((id) => [id, policySignature(durationControls[id], "duration")])) });
  };
  const saveDurationRule = (rule: DurationRule, applyScope?: "all" | "unmodified") => {
    if (!durationEditor) return;
    if (durationEditor.isDefault) {
      setDefaultDuration(rule);
      setDurationControls((current) => Object.fromEntries(Object.entries(current).map(([id, control]) => [id, {
        ...control,
        durationRules: control.durationRules.map((existing) => existing.useDefault ? {
          ...existing,
          continuousMinutes: rule.continuousMinutes,
          restMinutes: rule.restMinutes,
          dailyMinutes: rule.dailyMinutes,
          periods: rule.periods.map((period) => ({ ...period })),
        } : existing),
      }])));
      setMessage({ text: "默认使用时长规则已保存", tone: "success" });
    } else {
      const { ids, label, editingId, baseSignatures } = durationEditor;
      if (ids.some((id) => policySignature(durationControls[id], "duration") !== baseSignatures[id])) {
        setDurationEditor(null);
        setMessage({ text: "所选学生已被其他老师修改，请刷新后重新操作", tone: "notice" });
        return;
      }
      setConfirmation({
        title: "确认保存使用时长规则？",
        scope: label,
        count: ids.length,
        description: durationRuleText(rule),
        warning: applyScope ? `修改范围：${applyScope === "all" ? "全校修改，将覆盖老师此前单独设置的学生" : "仅修改老师未单独设置的学生，保留老师已有设置"}。` : undefined,
        resultPreview: <><p className="font-bold">保存后实际生效规则</p><p className="mt-1">{weekdayRangeText(rule.weekdays)}：{durationRuleText(rule)}</p><p className="mt-1 text-slate-500">未覆盖的日期继续执行全校默认规则。</p></>,
        action: "确认并生效",
        run: () => writeControls(ids, (control) => ({
          ...control,
          durationRules: [
            ...control.durationRules.filter((existing) => existing.id !== editingId && !existing.weekdays.some((day) => rule.weekdays.includes(day))).map((existing) => ({ ...existing })),
            ...control.durationRules.filter((existing) => existing.id !== editingId && existing.weekdays.some((day) => rule.weekdays.includes(day))).map((existing) => ({ ...existing, weekdays: existing.weekdays.filter((day) => !rule.weekdays.includes(day)) })).filter((existing) => existing.weekdays.length),
            { ...rule, weekdays: [...rule.weekdays], periods: rule.periods.map((period) => ({ ...period })) },
          ],
        }), "保存使用时长规则"),
      });
    }
    setDurationEditor(null);
  };
  const deleteDurationRules = (ids: string[], label: string, ruleId?: string) => setConfirmation({
    title: ruleId ? "确认删除使用时长规则？" : "确认恢复默认规则？",
    scope: label,
    count: ids.length,
    description: `${ruleId ? "删除后，对应星期恢复默认规则。" : "将清除所选范围当前设置的规则，并恢复默认规则。"}默认规则：${durationRuleText(defaultDuration)}。`,
    action: ruleId ? "确认删除" : "确认恢复",
    danger: true,
    run: () => writeControls(ids, (control) => ({ ...control, durationRules: ruleId ? control.durationRules.filter((rule) => rule.id !== ruleId) : [] }), ruleId ? "删除使用时长规则" : "恢复默认使用时长规则"),
  });
  const saveEditor = (value: ControlEditorValue) => {
    if (!editor) return;
    const { ids, label, editingId, baseSignatures } = editor;
    if (ids.some((id) => policySignature(controls[id], tab) !== baseSignatures[id])) {
      setEditor(null);
      setMessage({ text: "所选学生已被其他老师修改，请刷新后重新操作", tone: "notice" });
      return;
    }
    const schedule = value.schedule;
    const conflicts = schedule
      ? ids.filter((id) =>
          controls[id].schedules.some(
            (s) => s.id !== editingId && schedulesConflict(s, schedule),
          ),
        )
      : [];
    const coveredRules = schedule
      ? Array.from(new Map(ids.flatMap((id) => controls[id].schedules)
          .filter((item) => item.id !== editingId && schedulesConflict(item, schedule))
          .map((item) => {
            const text = `${scheduleDateText(item)}；${schedulePeriodText(item)}`;
            return [text, text] as const;
          })).values())
      : [];
    const resultingRules = schedule
      ? Array.from(new Set(ids.flatMap((id) => mergeBorrowSchedule(controls[id].schedules, schedule, editingId).map((item) => `${scheduleDateText(item)}；${schedulePeriodText(item)}`))))
      : [];
    setConfirmation({
      title: schedule
        ? conflicts.length
          ? "确认覆盖借用规则？"
          : "确认保存借用规则？"
        : "确认设置智阅作业权限？",
      scope: label,
      count: ids.length,
      description: schedule
        ? `${scheduleDateText(schedule)}；${schedulePeriodText(schedule)}`
        : `查看答案：${value.answer ? "允许" : "不允许"}；查看详解：${value.explanation ? "允许" : "不允许"}`,
      warning: schedule
        ? conflicts.length
          ? <>
              <p>{conflicts.length} 名学生在所选日期已有同类借用规则，将覆盖重叠日期，其他日期保留。</p>
              <div className="mt-3 border-t border-amber-200 pt-3">
                <p className="font-bold">将覆盖以下原规则：</p>
                {coveredRules.map((rule) => <p key={rule} className="mt-1">{rule}</p>)}
              </div>
            </>
          : value.applyScope
            ? `修改范围：${value.applyScope === "all" ? "全校修改，将覆盖老师此前单独设置的学生" : "仅修改老师未单独设置的学生，保留老师已有设置"}。`
            : "新借用规则将应用到所选学生。每周借用规则与指定日期借用规则分别保留。"
        : value.applyScope
          ? `修改范围：${value.applyScope === "all" ? "全校修改，将覆盖老师此前单独设置的学生" : "仅修改老师未单独设置的学生，保留老师已有设置"}。`
          : "将统一设置所选学生的权限，覆盖此前的单独设置。",
      resultPreview: schedule ? <>
        <p className="font-bold">保存后实际生效规则</p>
        {resultingRules.map((rule) => <p key={rule} className="mt-1">{rule}</p>)}
      </> : undefined,
      action: "确认并生效",
      run: () => {
        writeControls(ids, (s) =>
          schedule
            ? {
                ...s,
                schedules: mergeBorrowSchedule(
                  s.schedules,
                  schedule,
                  editingId,
                ),
              }
            : { ...s, answer: value.answer!, explanation: value.explanation! },
          schedule ? "保存借用规则" : "设置智阅作业权限",
        );
        setEditor(null);
      },
    });
  };
  const requestBoolean = (ids: string[], label: string, value: boolean) => {
    const action =
      tab === "world"
        ? value
          ? "开放权限"
          : "关闭权限"
        : value
          ? "锁屏"
          : "解除锁屏";
    setConfirmation({
      title: `确认${action}？`,
      scope: label,
      count: ids.length,
      description:
        tab === "world"
          ? `所选学生的万象视界权限将设为“${value ? "开放" : "关闭"}”。`
          : `所选学生的平板将${value ? "锁屏" : "解除手动锁屏"}，不影响借用权限。`,
      warning: "以本次操作为准，覆盖所选范围内此前的单独设置。",
      action: `确认${action}`,
      danger: tab === "lock" ? value : !value,
      run: () =>
        writeControls(ids, (s) => ({
          ...s,
          [tab === "world" ? "world" : "locked"]: value,
        }), action),
    });
  };
  const schoolStudentIds = deviceControlStudents.map((student) => student.id);
  const schoolBorrowRules = borrowControls[schoolStudentIds[0]]?.schedules.filter(
    (rule) => rule.mode === borrowMode,
  ) ?? [];
  const requestBorrowSwitch = () =>
    setConfirmation({
      title: `确认${scheduleEnabled ? "关闭" : "开启"}全校借用管控？`,
      scope: "全校",
      count: deviceControlStudents.length,
      description: scheduleEnabled
        ? "关闭后全校设备不能从柜机借出；已设置的借用规则保留。"
        : "开启后仅允许在全校统一配置的时段从柜机借出设备；没有有效规则时无法借出。",
      action: `确认${scheduleEnabled ? "关闭" : "开启"}并生效`,
      run: () => {
        setBorrowing(!scheduleEnabled);
        setMessage({ text: "全校借用管控设置已生效", tone: "success" });
      },
    });
  const removeScopeSchedules = (mode: BorrowSchedule["mode"]) => {
    const count = targetIds.reduce(
      (sum, id) =>
        sum + controls[id].schedules.filter((s) => s.mode === mode).length,
      0,
    );
    setConfirmation({
      title: `确认删除${mode === "weekly" ? "每周" : "指定日期"}借用规则？`,
      scope: targetLabel,
      count: targetIds.length,
      description: `将删除所选学生的 ${count} 条${mode === "weekly" ? "每周固定" : "指定日期"}借用规则。`,
      warning:
        mode === "dates"
          ? "对应日期恢复每周固定借用规则；没有每周借用规则时禁止借用。"
          : "未配置其他有效借用规则的日期将无法借用。",
      action: "确认删除",
      danger: true,
      run: () =>
        writeControls(targetIds, (s) => ({
          ...s,
          schedules: s.schedules.filter((item) => item.mode !== mode),
        }), "删除借用规则"),
    });
  };
  const restoreHomework = () =>
    setConfirmation({
      title: "确认恢复默认权限？",
      scope: targetLabel,
      count: targetIds.length,
      description:
        "查看答案、查看详解均恢复为“不允许”，覆盖所选学生此前的设置。",
      action: "确认恢复并生效",
      run: () =>
        writeControls(targetIds, (s) => ({
          ...s,
          answer: false,
          explanation: false,
        }), "恢复智阅作业默认权限"),
    });
  const deleteSchedule = (student: DeviceStudent, schedule: BorrowSchedule) =>
    setConfirmation({
      title: "确认删除借用规则？",
      scope: `${labelClass(student.classId)} · ${student.name}`,
      count: 1,
      description: `${scheduleDateText(schedule)}；${schedulePeriodText(schedule)}`,
      warning:
        schedule.mode === "dates"
          ? "删除后对应日期恢复每周固定借用规则；没有每周借用规则时禁止借用。"
          : "删除后，对应星期没有其他有效借用规则时禁止借用。",
      action: "确认删除",
      danger: true,
      run: () =>
        writeControls([student.id], (s) => ({
          ...s,
          schedules: s.schedules.filter((item) => item.id !== schedule.id),
        }), "删除借用规则"),
    });
  const deleteSchoolSchedule = (schedule: BorrowSchedule) =>
    setConfirmation({
      title: "确认删除全校借用规则？",
      scope: "全校",
      count: schoolStudentIds.length,
      description: `${scheduleDateText(schedule)}；${schedulePeriodText(schedule)}`,
      action: "确认删除",
      danger: true,
      run: () =>
        writeControls(schoolStudentIds, (control) => ({
          ...control,
          schedules: control.schedules.filter((rule) => rule.id !== schedule.id),
        }), "删除全校借用规则"),
    });
  const switchChecked =
    isScheduleTab
      ? tab === "duration" ? defaultDurationEnabled : scheduleEnabled
      : currentStudents.every((s) =>
          tab === "world" ? controls[s.id].world : controls[s.id].locked,
        );
  const stateStudentCount = currentStudents.filter((student) =>
    tab === "world" ? controls[student.id].world : controls[student.id].locked,
  ).length;
  const scopeStateLabel =
    tab === "world"
      ? `${stateStudentCount} 名学生已开放，${currentStudents.length - stateStudentCount} 名学生已禁止`
      : tab === "lock"
        ? `${stateStudentCount} 名学生已锁屏，${currentStudents.length - stateStudentCount} 名学生未锁屏`
        : tab === "duration"
          ? grade ? scopeStatus.main : "默认规则"
        : !grade && tab === "borrowing"
          ? scheduleEnabled
            ? "全校借用管控已开启"
            : "全校借用管控已关闭"
          : scopeStatus.main;
  const globalActionValues =
    isScheduleTab
      ? [!scheduleEnabled]
      : switchChecked
        ? [false]
        : scopeStatus.active
          ? [true, false]
          : [true];
  const globalActionLabel = (value: boolean) =>
    isScheduleTab
      ? value
        ? `开启${tab === "duration" ? "使用时长" : "借用"}管控`
        : `关闭${tab === "duration" ? "使用时长" : "借用"}管控`
      : tab === "world"
        ? value
          ? "全校开放权限"
          : "全校关闭权限"
        : value
          ? "全校锁屏"
          : "全校解除锁屏";
  const globalActionDanger = (value: boolean) =>
    tab === "world" ? !value : tab === "lock" && value;
  const ActiveIcon = tabs.find((item) => item.id === tab)?.icon ?? Clock;
  const visibleOperationRecords = operationRecords.filter((record, index, records) => {
    if (record.module !== tab) return false;
    const signature = JSON.stringify([record.module, record.title, record.scope, record.time, record.before, record.after]);
    return records.findIndex((item) => JSON.stringify([item.module, item.title, item.scope, item.time, item.before, item.after]) === signature) === index;
  }).slice(0, 100);
  const restoreOperationRecord = (record: OperationRecord) => {
    const containsExpiredSchedule = record.module === "borrowing" && Object.values(record.snapshot).some((control) =>
      control.schedules.some((schedule) => schedule.mode === "dates" && Boolean(schedule.endDate) && schedule.endDate < localDateText()),
    );
    if (containsExpiredSchedule) {
      setHistoryOpen(false);
      setMessage({ text: "该版本包含已过期的指定日期规则，请重新选择有效日期后保存", tone: "notice" });
      return;
    }
    setConfirmation({
      title: "确认恢复此版本？",
      scope: record.scope,
      count: record.ids.length,
      description: `${record.time} 由 ${record.operator} 操作的版本。`,
      resultPreview: <><p className="font-bold">恢复后的规则</p>{record.before.map((item) => <p key={item} className="mt-1">{item}</p>)}</>,
      action: "确认恢复",
      run: () => {
        const restore = (current: Record<string, StudentControl>) => ({ ...current, ...record.snapshot });
        if (record.module === "duration") setDurationControls(restore);
        else setBorrowControls(restore);
        setOperationRecords((records) => limitHistoryByModule([{ ...record, id: `record-${Date.now()}`, title: `恢复版本：${record.title}`, time: new Date().toLocaleString("zh-CN", { hour12: false }), operator: operatorLabel, before: record.after, after: record.before }, ...records]));
        setMessage({ text: "历史版本已恢复并生效", tone: "success" });
      },
    });
  };

  return (
    <div className="dc-page flex h-full flex-col">
      <header className="dc-header shrink-0 border-b bg-white">
        <h1 className="text-2xl font-black text-slate-900">全校设备管控</h1>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <nav
            role="tablist"
            aria-label="设备管控模块"
            className="dc-tabs flex flex-wrap"
          >
            {tabs.map((item) => (
              <button
                type="button"
                key={item.id}
                id={`control-tab-${item.id}`}
                role="tab"
                aria-selected={tab === item.id}
                aria-controls={`control-panel-${item.id}`}
                onClick={() => {
                  setTab(item.id);
                  resetList();
                  setDetailId(null);
                }}
                className={`flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-bold ${tab === item.id ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-900"}`}
              >
                <item.icon size={16} />
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </header>
      <div
        role="tabpanel"
        id={`control-panel-${tab}`}
        aria-labelledby={`control-tab-${tab}`}
        className="dc-workspace min-h-0 flex-1 overflow-y-auto"
      >
        <div className="dc-content mx-auto space-y-5">
          <div className="dc-breadcrumb flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-4">
              {grade && (
                <button type="button" onClick={() => classId ? navigate(grade, null) : navigate(null, null)} className="dc-btn">
                  <ArrowLeft size={17} />
                  {classId ? "返回班级列表" : "返回全校"}
                </button>
              )}
              <nav aria-label="管控层级" className="flex items-center gap-2 text-sm">
                <button type="button" onClick={() => navigate(null, null)} className={grade ? "font-bold text-indigo-600" : "font-bold text-slate-900"}>全校</button>
                {grade && <><ChevronRight size={15} className="text-slate-400" /><button type="button" onClick={() => navigate(grade, null)} className={classId ? "font-bold text-indigo-600" : "font-bold text-slate-900"}>{grade}年级</button></>}
                {classId && <><ChevronRight size={15} className="text-slate-400" /><span className="font-bold text-slate-900">{labelClass(classId)}</span></>}
              </nav>
            </div>
            {!grade && (
              <button
                type="button"
                onClick={() => setHistoryOpen(true)}
                className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-indigo-600"
              >
                <History size={15} />
                操作记录
              </button>
            )}
          </div>
          <section className="dc-scope-card">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="dc-scope-heading">
                <span className="dc-scope-icon">
                  <ActiveIcon size={21} strokeWidth={1.7} />
                </span>
                <div>
                  <h2>
                    {scopeLabel} · {tabs.find((t) => t.id === tab)?.label}
                    <span
                      role="status"
                      className={`dc-state-badge ${tab === "world" || tab === "lock" ? "dc-state-count" : ""}`}
                      data-tone={
                        !grade && tab !== "homework"
                          ? tab === "lock" && switchChecked
                            ? "danger"
                            : switchChecked
                              ? "success"
                              : "neutral"
                          : scopeStatus.active
                            ? "success"
                            : "neutral"
                      }
                    >
                      {scopeStateLabel}
                    </span>
                  </h2>
                  <p>
                    {tab === "duration"
                      ? `全校默认：${durationRuleText(defaultDuration)}；可按年级、班级或学生设置单独规则。`
                      : isScheduleTab
                      ? scheduleEnabled
                        ? "开启借用管控后，仅可在有效规则允许的时段借用设备；未设置有效规则时，无法借用设备。"
                        : "借用管控关闭，设备不能从柜机借出；已有借用规则保留。"
                      : tab === "homework"
                        ? "设置学生查看答案、详解的权限，默认均不允许。"
                        : "以最新一次操作为准。"}
                    {grade && tab !== "borrowing" && ` 当前 ${currentStudents.length} 名学生。`}
                  </p>
                </div>
              </div>
              {(!grade || tab === "borrowing") && tab !== "homework" && tab !== "duration" && (
                <div className="flex flex-wrap items-center gap-3">
                  {globalActionValues.map((value) => (
                  <button
                    type="button"
                    key={String(value)}
                    aria-label={globalActionLabel(value)}
                    onClick={() =>
                      isScheduleTab
                        ? requestBorrowSwitch()
                        : requestBoolean(
                            deviceControlStudents.map((s) => s.id),
                            "全校",
                            value,
                          )
                    }
                    className={`dc-global-action ${globalActionDanger(value) ? "dc-btn-danger" : "dc-btn-primary"}`}
                  >
                    <Power size={16} />
                    {globalActionLabel(value)}
                  </button>
                  ))}
                </div>
              )}
            </div>
          </section>
          {tab === "borrowing" && borrowing && (
            <section className="dc-list-card overflow-hidden">
              <nav role="tablist" aria-label="全校借用规则类型" className="dc-rule-tabs flex border-b border-slate-100">
                {(["weekly", "dates"] as const).map((mode) => (
                  <button
                    type="button"
                    role="tab"
                    key={mode}
                    aria-selected={borrowMode === mode}
                    onClick={() => setBorrowMode(mode)}
                    className={`border-b-2 px-1 py-4 text-sm font-bold ${borrowMode === mode ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-900"}`}
                  >
                    {mode === "weekly" ? "每周固定借用规则" : "指定日期借用规则"}
                  </button>
                ))}
              </nav>
              {borrowMode === "dates" && (
                <p className="border-b border-slate-100 bg-indigo-50/60 px-5 py-3 text-xs leading-5 text-indigo-700">
                  指定日期内优先按本规则执行；规则到期或删除后，恢复每周借用规则。
                </p>
              )}
              <div className="dc-list-heading flex flex-wrap items-center justify-between gap-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900">全校借出时间段</h3>
                  <p className="mt-1 text-xs text-slate-500">统一设置全校设备从柜机借出的时间。</p>
                </div>
                <button type="button" className={primary} onClick={() => openEditor(schoolStudentIds, "全校", borrowMode)}>
                  {borrowMode === "weekly" ? "新增每周借用规则" : "新增指定日期借用规则"}
                </button>
              </div>
              <div className="space-y-3 p-5">
                {schoolBorrowRules.length ? schoolBorrowRules.map((rule) => (
                  <div key={rule.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4">
                    <div>
                      <p className="font-bold text-slate-900">{scheduleDateText(rule)}</p>
                      <p className="mt-1 text-sm text-slate-600">{schedulePeriodText(rule)}</p>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" className={button} onClick={() => openEditor(schoolStudentIds, "全校", undefined, rule)}>编辑</button>
                      <button type="button" className={button} onClick={() => deleteSchoolSchedule(rule)}>删除</button>
                    </div>
                  </div>
                )) : <p className="py-8 text-center text-sm text-slate-500">尚未设置{borrowMode === "weekly" ? "每周固定" : "指定日期"}借用规则</p>}
              </div>
            </section>
          )}
          {tab !== "borrowing" && (!isScheduleTab || scheduleEnabled) && (
          <section className="dc-list-card overflow-hidden">
            <div className="dc-list-heading flex flex-wrap items-center justify-between gap-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900">{rowType}列表</h3>
                <p className="mt-1 text-xs text-slate-500">
                  {classId
                      ? "点击学生查看详情，可单独修改。"
                      : `点击${rowType}名称进入下一级，勾选后可批量设置。`}
                </p>
              </div>
              <div className="dc-actions">
                {tab === "duration" ? (
                  <>
                    <button type="button" className={primary} onClick={() => withSelected(() => openDurationEditor(targetIds, targetLabel))}>新增使用时长规则</button>
                    <button type="button" className={button} onClick={() => withSelected(() => deleteDurationRules(targetIds, targetLabel))}>恢复默认规则</button>
                  </>
                ) : tab === "homework" ? (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        withSelected(() => openEditor(
                          targetIds,
                          targetLabel,
                          undefined,
                          undefined,
                          selectedObjectNames,
                        ))
                      }
                      className={primary}
                    >
                      设置权限
                    </button>
                    <button
                      type="button"
                      onClick={() => withSelected(restoreHomework)}
                      className={button}
                    >
                      恢复默认
                    </button>
                  </>
                ) : (
                  <>
                    {availableBooleanActions.map((value) => (
                      <button
                        type="button"
                        key={String(value)}
                        onClick={() =>
                          withSelected(() => requestBoolean(targetIds, targetLabel, value))
                        }
                        className={value ? primary : button}
                      >
                        {tab === "world"
                          ? value
                            ? "开放权限"
                            : "关闭权限"
                          : value
                            ? "锁屏"
                            : "解除锁屏"}
                      </button>
                    ))}
                  </>
                )}
              </div>
            </div>
            <div className="dc-filterbar flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search
                    size={15}
                    className="absolute left-3 top-3 text-slate-400"
                  />
                  <input
                    aria-label={`搜索${rowType}`}
                    placeholder={
                      classId ? "搜索姓名或编号" : `搜索${rowType}名称`
                    }
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                      setSelected([]);
                    }}
                    className="w-52 rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm"
                  />
                </div>
                <select
                  aria-label="筛选配置状态"
                  value={filter}
                  onChange={(e) => {
                    setFilter(e.target.value);
                    setPage(1);
                    setSelected([]);
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="all">全部状态</option>
                  {!classId && (
                    <>
                      <option value="same">{tab === "duration" ? "学生规则一致" : "配置一致"}</option>
                      <option value="mixed">{tab === "duration" ? "学生规则有差异" : "配置存在差异"}</option>
                    </>
                  )}
                  <option value="active">
                    {tab === "duration"
                      ? "使用时长受管控"
                      : isScheduleTab
                      ? "已设置借用规则"
                      : tab === "homework"
                        ? "有开放权限"
                        : tab === "world"
                          ? "有已开放学生"
                          : "有已锁屏学生"}
                  </option>
                  <option value="inactive">
                    {tab === "duration"
                      ? "不限制使用时长"
                      : isScheduleTab
                      ? "未设置借用规则"
                      : tab === "homework"
                        ? "均不允许"
                        : tab === "world"
                          ? "全部已关闭"
                          : "全部未锁屏"}
                  </option>
                </select>
                {(search || filter !== "all") && (
                  <button
                    type="button"
                    onClick={resetList}
                    className="text-sm text-indigo-600"
                  >
                    清空筛选
                  </button>
                )}
              </div>
              <span className="text-xs text-slate-500">
                {selected.length
                  ? `操作范围：${targetLabel} · ${targetIds.length} 人`
                  : `请先选择${rowType}`}
              </span>
            </div>
            {selected.length > 0 && (
              <div className="dc-selection-bar flex items-center justify-between gap-3">
                <span>
                  已选 {selected.length} {classId ? "名学生" : `个${rowType}`}
                  ，影响 {targetIds.length} 名学生
                </span>
                <button
                  type="button"
                  onClick={() => setSelected([])}
                  className="shrink-0 font-bold"
                >
                  取消选择
                </button>
              </div>
            )}
            <div className="dc-table-hint">
              <ArrowLeftRight size={14} />
              左右滑动查看完整字段
            </div>
            <div className="dc-table-scroll">
              <table className="dc-data-table text-left">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="w-12 px-5 py-3">
                      <input
                        type="checkbox"
                        aria-label={`选择本页${rowType}`}
                        checked={checkedAll}
                        onChange={() =>
                          setSelected(
                            checkedAll
                              ? selected.filter(
                                  (id) => !pageRows.some((r) => r.id === id),
                                )
                              : [
                                  ...new Set([
                                    ...selected,
                                    ...pageRows.map((r) => r.id),
                                  ]),
                                ],
                          )
                        }
                      />
                    </th>
                    <th className="w-16 py-3 font-medium">序号</th>
                    <th className="min-w-32 py-3 font-medium">
                      {rowType}
                      {classId ? " / 编号" : ""}
                    </th>
                    <ControlConfigurationHeaders
                      module={tab}
                      student={!!classId}
                      mode={borrowMode}
                    />
                    <th className="sticky right-0 min-w-32 bg-slate-50 px-5 py-3 font-medium">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((row, index) => (
                    <tr
                      key={row.id}
                      data-selected={selected.includes(row.id)}
                      className="border-t border-slate-100"
                    >
                      <td className="px-5 py-4 align-top">
                        <input
                          type="checkbox"
                          aria-label={`选择${row.label}`}
                          checked={selected.includes(row.id)}
                          onChange={() =>
                            setSelected(
                              selected.includes(row.id)
                                ? selected.filter((id) => id !== row.id)
                                : [...selected, row.id],
                            )
                          }
                        />
                      </td>
                      <td className="py-4 align-top text-slate-400">
                        {(currentPage - 1) * pageSize + index + 1}
                      </td>
                      <td className="py-4 align-top">
                        <button
                          type="button"
                          onClick={() =>
                            row.student
                              ? setDetailId(row.student.id)
                              : navigate(row.grade!, row.classId ?? null)
                          }
                          className="font-bold text-indigo-600 hover:underline"
                        >
                          {row.label}
                        </button>
                        {row.subtitle && (
                          <p className="mt-1 text-xs text-slate-400">
                            {row.subtitle}
                          </p>
                        )}
                      </td>
                      <ControlConfigurationCells
                        module={tab}
                        student={!!row.student}
                        mode={borrowMode}
                        ids={row.ids}
                        controls={controls}
                        defaultDurationEnabled={defaultDurationEnabled}
                        defaultDurationRule={defaultDuration}
                        onBorrowOverview={() => showBorrowOverview(row)}
                      />
                      <td className="dc-row-actions sticky right-0 px-5 py-4 align-top">
                        <div className="flex flex-col items-start gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              row.student
                                ? setDetailId(row.student.id)
                                : navigate(row.grade!, row.classId ?? null)
                            }
                            className="dc-link flex items-center gap-1 whitespace-nowrap"
                          >
                            {row.student
                              ? "查看并设置"
                              : grade
                                ? "查看学生"
                                : "查看班级"}
                            <ChevronRight size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!pageRows.length && (
                    <tr>
                      <td
                        colSpan={
                          4 +
                          configurationColumnCount({
                            module: tab,
                            student: !!classId,
                            mode: borrowMode,
                          })
                        }
                      >
                        <div className="dc-empty">
                          <span>
                            <Search size={23} strokeWidth={1.5} />
                          </span>
                          <p>没有符合条件的{rowType}</p>
                          <small>试试调整搜索或筛选条件</small>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {pageCount > 1 && <div className="dc-pagination flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
              <span>
                共 {filteredRows.length} {classId ? "名学生" : `个${rowType}`} ·
                第 {currentPage} / {pageCount} 页
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <label htmlFor="control-page-size">每页</label>
                <select
                  id="control-page-size"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                  className="rounded-lg border px-2 py-1.5"
                >
                  {[10, 20, 40].map((size) => (
                    <option key={size} value={size}>
                      {size} 条
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setPage(currentPage - 1)}
                  className="rounded-lg border px-3 py-1.5 disabled:opacity-30"
                >
                  上一页
                </button>
                {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
                  <button
                    type="button"
                    key={n}
                    aria-label={`第${n}页`}
                    aria-current={n === currentPage ? "page" : undefined}
                    onClick={() => setPage(n)}
                    className={`rounded-lg border px-3 py-1.5 ${n === currentPage ? "border-indigo-600 bg-indigo-600 text-white" : "border-slate-200"}`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={currentPage === pageCount}
                  onClick={() => setPage(currentPage + 1)}
                  className="rounded-lg border px-3 py-1.5 disabled:opacity-30"
                >
                  下一页
                </button>
              </div>
            </div>}
          </section>
          )}
          {message && (
            <div role="status" className="dc-feedback" data-tone={message.tone}>
              {message.tone === "notice" ? <Info size={17} /> : <CheckCircle2 size={17} />}
              <span>{message.text}</span>
              <button
                type="button"
                aria-label="关闭提示"
                onClick={() => setMessage(null)}
              >
                <X size={15} />
              </button>
            </div>
          )}
        </div>
      </div>
      {detailStudent && (
        <StudentControlDetail
          key={`${tab}-${detailStudent.id}`}
          student={detailStudent}
          control={controls[detailStudent.id]}
          module={tab}
          borrowingEnabled={scheduleEnabled}
          initialMode={borrowMode}
          onClose={() => setDetailId(null)}
          onEdit={(schedule) =>
            openEditor(
              [detailStudent.id],
              `${labelClass(detailStudent.classId)} · ${detailStudent.name}`,
              undefined,
              schedule,
            )
          }
          onAdd={(mode) =>
            openEditor(
              [detailStudent.id],
              labelClass(detailStudent.classId) + " · " + detailStudent.name,
              mode,
            )
          }
          onDelete={(schedule) => deleteSchedule(detailStudent, schedule)}
          onAction={(value) =>
            requestBoolean(
              [detailStudent.id],
              `${labelClass(detailStudent.classId)} · ${detailStudent.name}`,
              value,
            )
          }
          defaultDurationEnabled={defaultDurationEnabled}
          defaultDurationRule={defaultDuration}
          onDurationAdd={() => openDurationEditor([detailStudent.id], `${labelClass(detailStudent.classId)} · ${detailStudent.name}`)}
          onDurationEdit={(rule) => openDurationEditor([detailStudent.id], `${labelClass(detailStudent.classId)} · ${detailStudent.name}`, rule)}
          onDurationDelete={(rule) => deleteDurationRules([detailStudent.id], `${labelClass(detailStudent.classId)} · ${detailStudent.name}`, rule.id)}
        />
      )}
      {overview && (
        <BorrowingOverviewDrawer
          label={overview.label}
          ids={overview.ids}
          controls={controls}
          mode={borrowMode}
          onClose={() => setOverview(null)}
        />
      )}
      {editor && (
        <StudentControlEditor
          key={`${tab}-${editor.schedule?.id ?? editor.label}`}
          targetLabel={editor.label}
          count={editor.ids.length}
          selectedObjects={editor.selectedObjects}
          schedule={editor.schedule}
          homework={
            !editor.schedule && !mixed(editor.ids)
              ? controls[editor.ids[0]]
              : undefined
          }
          requireApplyScope={editor.requireApplyScope}
          onClose={() => setEditor(null)}
          onSave={saveEditor}
        />
      )}
      {durationEditor && <DurationRuleEditor
        key={`${durationEditor.isDefault ? "default" : durationEditor.label}-${durationEditor.rule.id}`}
        label={durationEditor.label}
        count={durationEditor.ids.length}
        rule={durationEditor.rule}
        defaultRule={defaultDuration}
        isDefault={durationEditor.isDefault}
        requireApplyScope={durationEditor.requireApplyScope}
        onClose={() => setDurationEditor(null)}
        onSave={saveDurationRule}
      />}
      {historyOpen && (
        <DeviceControlLayer labelId="operation-history-title" onClose={() => setHistoryOpen(false)}>
          {(close) => <>
            <header className="flex items-center justify-between border-b p-6">
              <div>
                <h2 id="operation-history-title" className="text-xl font-bold text-slate-900">{tabs.find((item) => item.id === tab)?.label}操作记录</h2>
                <p className="mt-1 text-sm text-slate-500">查看规则变更，并可恢复到历史版本；显示近100条记录</p>
              </div>
              <button type="button" aria-label="关闭操作记录" onClick={close} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={20} /></button>
            </header>
            <div className="dc-panel-body space-y-4">
              {visibleOperationRecords.length ? visibleOperationRecords.map((record) => (
                <article key={record.id} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div><h3 className="font-bold text-slate-900">{record.title}</h3><p className="mt-1 text-xs text-slate-500">{record.time} · {record.operator} · {record.scope}</p></div>
                    <button type="button" className="dc-btn shrink-0" onClick={() => restoreOperationRecord(record)}>恢复此版本</button>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <div className="rounded-lg bg-slate-50 p-3"><p className="mb-2 text-xs font-bold text-slate-500">修改前</p>{record.before.map((item) => <p key={item} className="mt-1 text-sm text-slate-700">{item}</p>)}</div>
                    <div className="rounded-lg bg-indigo-50 p-3"><p className="mb-2 text-xs font-bold text-indigo-600">修改后</p>{record.after.map((item) => <p key={item} className="mt-1 text-sm text-slate-700">{item}</p>)}</div>
                  </div>
                </article>
              )) : <div className="rounded-xl border border-dashed p-10 text-center text-sm text-slate-500">暂无操作记录</div>}
            </div>
          </>}
        </DeviceControlLayer>
      )}
      {confirmation && (
        <DeviceControlLayer
          variant="dialog"
          labelId="control-confirm-title"
          level={2}
          onClose={() => setConfirmation(null)}
        >
          {(close) => (
            <>
              <span
                className="dc-confirm-icon"
                data-danger={confirmation.danger === true}
              >
                {confirmation.danger ? (
                  <LockKeyhole size={21} />
                ) : (
                  <ShieldCheck size={21} />
                )}
              </span>
              <h2 id="control-confirm-title" className="dc-confirm-title">
                {confirmation.title}
              </h2>
              <div className="dc-confirm-scope">
                <p>影响范围：{confirmation.scope}</p>
                <p>共 {confirmation.count} 名学生</p>
              </div>
              <p className="dc-confirm-description">
                {confirmation.description}
              </p>
              {confirmation.warning && (
                <div className="dc-confirm-warning">{confirmation.warning}</div>
              )}
              {confirmation.resultPreview && (
                <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-sm leading-6 text-slate-700">{confirmation.resultPreview}</div>
              )}
              <div className="dc-confirm-footer">
                <button
                  type="button"
                  data-autofocus
                  onClick={close}
                  className={button}
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={() => {
                    confirmation.run();
                    close();
                  }}
                  className={confirmation.danger ? "dc-btn-danger" : primary}
                >
                  {confirmation.action}
                </button>
              </div>
            </>
          )}
        </DeviceControlLayer>
      )}
    </div>
  );
};
