import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowLeftRight,
  BookOpen,
  ChevronRight,
  Clock,
  Info,
  History,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { schoolDeviceClasses } from "../data/schoolDeviceClasses";
import { DEMO_TEACHER_ACCOUNTS, TeacherPortalUser } from "../data/teacherAccess";
import {
  BorrowSchedule,
  borrowScheduleStatus,
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
  validateSchedule,
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
import { applySchoolDurationRule, durationUpdateDays } from "../data/durationApplyScope";
import { DurationRuleEditor } from "./DurationRuleEditor";
import { WorldUsageEditor } from "./WorldUsageEditor";
import { TemporaryLockEditor } from "./TemporaryLockEditor";
import { applyTemporaryLocks, updateTemporaryLocks, temporaryLockedStudentIds, TemporaryLocks, TemporaryLockScope, updateSchoolTemporaryLockSession, SchoolTemporaryLockSession, SCHOOL_TEMPORARY_LOCK_NOTICE, TemporaryLockClassStates, inheritTemporaryLocksByClass, teacherMayModifyLock } from "../data/temporaryDeviceLock";
import { ControlToast, ControlToastTone } from "./ControlToast";
import "./DeviceControl.css";

const tabs = [
  { id: "borrowing", label: "柜机借用管控", icon: Clock },
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
  selectedObjects?: string[];
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
  source?: "teacher-portal";
  operatorRole?: TeacherPortalUser["role"];
  before: string[];
  after: string[];
  ids: string[];
  snapshot: Record<string, StudentControl>;
};
const button = "dc-btn";
const primary = "dc-btn-primary";
const CONTROL_STORAGE_KEY = "ai-companion-device-controls-v2";
const HISTORY_STORAGE_KEY = "ai-companion-device-control-history-v2";
type LockSnapshot = Record<string, boolean>;
type StoredControls = {
  durationTeacherCanEdit?: boolean;
  borrow: Record<string, StudentControl>;
  duration: Record<string, StudentControl>;
  temporaryLockSnapshot?: LockSnapshot | null;
  temporaryLocks?: TemporaryLocks;
  schoolTemporaryLockSession?: SchoolTemporaryLockSession;
  temporaryLockClassStates?: TemporaryLockClassStates;
};
const isAdminRecord = (record: OperationRecord) => record.source
  ? record.source === "teacher-portal" && record.operatorRole === "school-admin"
  : record.operatorRole ? record.operatorRole === "school-admin" : DEMO_TEACHER_ACCOUNTS.some((user) => user.role === "school-admin" && (record.operator === user.name || record.operator?.startsWith(`${user.name}（`)));
const limitHistoryByModule = (records: OperationRecord[]) => {
  const counts: Partial<Record<ControlModule, number>> = {};
  return records.filter((record) => {
    if (!isAdminRecord(record)) return false;
    const count = counts[record.module] ?? 0;
    if (count >= 100) return false;
    counts[record.module] = count + 1;
    return true;
  });
};
const readStoredControls = (): StoredControls => {
  if (typeof window === "undefined") return { borrow: initialStudentControls(), duration: initialStudentControls() };
  try {
    const stored = JSON.parse(window.localStorage.getItem(CONTROL_STORAGE_KEY) ?? "null");
    if (stored?.borrow && stored?.duration) {
      if (stored.temporaryLockSnapshot && !stored.temporaryLocks) {
        const ids = deviceControlStudents.map((student) => student.id);
        const snapshot: LockSnapshot = stored.temporaryLockSnapshot;
        stored.borrow = Object.fromEntries(Object.entries(stored.borrow as Record<string, StudentControl>).map(([id, control]) => [id, { ...control, locked: snapshot[id] ?? control.locked }]));
        stored.temporaryLocks = { school: { key: "school", label: "全校", ids } };
      }
      stored.borrow = { ...initialStudentControls(), ...stored.borrow };
      stored.duration = { ...initialStudentControls(), ...stored.duration };
      return stored as StoredControls;
    }
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
  const defaultDurationEnabled = true;
  const [defaultDuration, setDefaultDuration] = useState<DurationRule>({ id: "default-duration", weekdays: [0, 1, 2, 3, 4, 5, 6], useDefault: false, ...defaultDurationRule, periods: [] });
  const [storedControls] = useState(readStoredControls);
  const [durationTeacherCanEdit, setDurationTeacherCanEdit] = useState(storedControls.durationTeacherCanEdit ?? false);
  const [temporaryLocks, setTemporaryLocks] = useState<TemporaryLocks>(storedControls.temporaryLocks ?? {});
  const [schoolTemporaryLockSession, setSchoolTemporaryLockSession] = useState<SchoolTemporaryLockSession>(storedControls.schoolTemporaryLockSession ?? { active: false, dailySnapshot: {} });
  const [temporaryLockClassStates, setTemporaryLockClassStates] = useState<TemporaryLockClassStates>(() => {
    if (storedControls.temporaryLockClassStates) return storedControls.temporaryLockClassStates;
    const lockedIds = temporaryLockedStudentIds(storedControls.temporaryLocks ?? {});
    return Object.fromEntries(schoolDeviceClasses.flatMap((item) => {
      const ids = deviceControlStudents.filter((student) => student.classId === item.id).map((student) => student.id);
      const locked = ids.filter((id) => lockedIds.has(id)).length;
      return locked === 0 || locked === ids.length ? [[item.id, { name: item.name, enabled: locked > 0 }]] : [];
    }));
  });
  const effectiveTemporaryLocks = inheritTemporaryLocksByClass(temporaryLocks, temporaryLockClassStates, deviceControlStudents, schoolTemporaryLockSession.active);
  const temporaryLockedIds = temporaryLockedStudentIds(effectiveTemporaryLocks);
  const temporaryState = (ids: string[]) => { const count = ids.filter((id) => temporaryLockedIds.has(id)).length; return count === 0 ? "未开启" : count === ids.length ? "已开启" : "部分开启"; };
  const lockActionLabel = (ids: string[]) => temporaryState(ids) === "已开启" ? "解除临时锁屏" : temporaryState(ids) === "未开启" ? "临时锁屏" : "设置临时锁屏";
  const [borrowControls, setBorrowControls] = useState(storedControls.borrow);
  const [ruleStatusNow, setRuleStatusNow] = useState(() => new Date());
  const [durationControls, setDurationControls] = useState(storedControls.duration);
  const isScheduleTab = tab === "borrowing" || tab === "duration";
  const scheduleEnabled = true;
  const controls = tab === "duration" ? durationControls : tab === "lock" ? applyTemporaryLocks(borrowControls, effectiveTemporaryLocks) : borrowControls;
  const setControls = tab === "duration" ? setDurationControls : setBorrowControls;
  const [selected, setSelected] = useState<string[]>([]);
  const [batchMode, setBatchMode] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [overview, setOverview] = useState<{
    label: string;
    ids: string[];
  } | null>(null);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [durationEditor, setDurationEditor] = useState<{ ids: string[]; label: string; rule: DurationRule; isDefault?: boolean; editingId?: string; requireApplyScope?: boolean; selectedObjects?: string[]; baseSignatures: Record<string, string> } | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [worldEditor, setWorldEditor] = useState<{ ids: string[]; label: string; value: null } | null>(null);
  const [lockEditor, setLockEditor] = useState<{ ids: string[]; label: string } | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [operationRecords, setOperationRecords] = useState<OperationRecord[]>(readStoredHistory);
  const [message, setMessage] = useState<{
    text: string;
    tone: ControlToastTone;
  } | null>(null);
  const operatorPhone = currentUser.phone ??
    DEMO_TEACHER_ACCOUNTS.find((user) => user.id === currentUser.id)?.phone;
  const operatorLabel = operatorPhone
    ? `${currentUser.name}（${operatorPhone}）`
    : currentUser.name;
  const changeDurationPermission = (allowed: boolean) => {
    setDurationTeacherCanEdit(allowed);
    setOperationRecords((records) => limitHistoryByModule([{
      id: `permission-${Date.now()}`, module: "duration", title: allowed ? "开放班主任调整权限" : "关闭班主任调整权限", scope: "全校",
      time: new Date().toLocaleString("zh-CN", { hour12: false }), operator: operatorLabel, source: "teacher-portal", operatorRole: currentUser.role,
      before: [durationTeacherCanEdit ? "班主任调整权限已开放" : "班主任调整权限未开放"], after: [allowed ? "班主任调整权限已开放，当前规则不变" : "班主任调整权限未开放，当前规则保留"], ids: deviceControlStudents.map((student) => student.id), snapshot: {},
    }, ...records]));
  };
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key !== CONTROL_STORAGE_KEY) return;
      const latest = readStoredControls();
      setBorrowControls(latest.borrow);
      setDurationControls(latest.duration);
      setDurationTeacherCanEdit(latest.durationTeacherCanEdit ?? false);
      setTemporaryLocks(latest.temporaryLocks ?? {});
      setSchoolTemporaryLockSession(latest.schoolTemporaryLockSession ?? { active: false, dailySnapshot: {} });
      setTemporaryLockClassStates(latest.temporaryLockClassStates ?? {});
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  useEffect(() => {
    if (tab !== "borrowing" || borrowMode !== "dates") return;
    setRuleStatusNow(new Date());
    const timer = setInterval(() => setRuleStatusNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, [tab, borrowMode]);
  useEffect(() => {
    try {
      window.localStorage.setItem(CONTROL_STORAGE_KEY, JSON.stringify({ borrow: borrowControls, duration: durationControls, durationTeacherCanEdit, temporaryLocks, schoolTemporaryLockSession, temporaryLockClassStates }));
    } catch { /* 浏览器存储不可用时继续使用当前会话数据 */ }
  }, [borrowControls, durationControls, durationTeacherCanEdit, temporaryLocks, schoolTemporaryLockSession, temporaryLockClassStates]);
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
    setBatchMode(false);
    setPage(1);
    setMessage(null);
  };
  const navigate = (nextGrade: number | null, nextClass: string | null) => {
    if (nextClass) return;
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
        main: value.durationRules.length ? "有单独规则" : "默认规则",
        sub: value.durationRules.length ? `${value.durationRules.length} 条单独规则` : "当前执行全校默认规则",
        active: value.durationRules.length > 0,
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
      return { main: mixed(ids) ? "学生规则有差异" : "学生规则一致", sub: `有单独规则 ${count} / ${ids.length} 人`, active: count > 0 };
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
          ? "学生规则有差异"
          : entries[0]?.answer || entries[0]?.explanation
            ? "学生规则一致"
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
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageRows = rows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const selectedRows = rows.filter((r) => selected.includes(r.id));
  const withSelected = (action: () => void) => {
    if (!selectedRows.length) {
      setMessage({
        text: `请选择要操作的${rowType}`,
        tone: "info",
      });
      return;
    }
    setMessage(null);
    action();
  };
  const runBatchAction = (action: () => void) => {
    if (!batchMode) {
      setBatchMode(true);
      setSelected([]);
      setMessage({ text: `请选择要操作的${rowType}`, tone: "info" });
      return;
    }
    withSelected(action);
  };
  const selectedObjectNames = selectedRows.map((row) =>
    row.student && row.subtitle
      ? `${row.label}（${row.subtitle}）`
      : row.label,
  );
  const targetIds = selectedRows.flatMap((r) => r.ids);
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
  const scopeObjects = (ids: string[]) => {
    const chosen = new Set(ids);
    return schoolDeviceClasses.filter((item) => deviceControlStudents.some((student) => student.classId === item.id && chosen.has(student.id))).map((item) => item.name);
  };
  const actualScope = (ids: string[]) => {
    const chosen = new Set(ids);
    if (chosen.size === deviceControlStudents.length) return "全校";
    const wholeGrade = controlGrades.find((value) => { const students = deviceControlStudents.filter((student) => student.grade === value); return students.length === chosen.size && students.every((student) => chosen.has(student.id)); });
    return wholeGrade ? `${wholeGrade}年级` : scopeObjects(ids).join("、");
  };
  const writeControls = (
    ids: string[],
    apply: (value: StudentControl, id: string) => StudentControl,
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
      if (tab === "world") return [value.world ? "允许使用万象视界" : "禁止使用万象视界"];
      return [value.locked ? "已锁屏" : "未锁屏"];
    };
    ids.forEach((id) => {
      next[id] = {
        ...apply(current[id], id),
        updated: { ...current[id].updated, [tab]: { by: operatorLabel, at } },
      };
    });
    const effectiveNext = next;
    const before = Array.from(new Set(ids.flatMap((id) => summarize(current[id]))));
    const after = Array.from(new Set(ids.flatMap((id) => summarize(effectiveNext[id]))));
    setControls(effectiveNext);
    setOperationRecords((records) => limitHistoryByModule([{ id: `record-${Date.now()}`, module: tab, title: actionTitle, scope: actualScope(ids), time: at, operator: operatorLabel, source: "teacher-portal", operatorRole: currentUser.role, before, after, ids: [...ids], snapshot }, ...records]));
    setSelected([]);
    setBatchMode(false);
    setMessage({ text: `设置已生效，影响 ${ids.length} 名学生`, tone: "success" });
  };
  const openEditor = (
    ids: string[],
    label: string,
    mode?: BorrowSchedule["mode"],
    schedule?: BorrowSchedule,
    selectedObjects?: string[],
  ) => {
    if (schedule?.mode === "dates" && borrowScheduleStatus(schedule) === "已失效") {
      setMessage({ text: "已失效规则不可编辑，仅支持删除", tone: "warning" });
      return;
    }
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
      requireApplyScope: tab !== "borrowing" && !classId && ids.length > 1,
      baseSignatures: Object.fromEntries(ids.map((id) => [id, policySignature(controls[id], tab)])),
    });
  };
  const openDurationEditor = (ids: string[], label: string, rule?: DurationRule, isDefault = false) => {
    setDurationEditor({ ids, label, selectedObjects: label.startsWith("已选") ? [...selectedObjectNames] : [label], rule: rule ?? newDurationRule(), isDefault, editingId: rule?.id, requireApplyScope: !classId && ids.length > 1 && !isDefault, baseSignatures: Object.fromEntries(ids.map((id) => [id, policySignature(durationControls[id], "duration")])) });
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
        setMessage({ text: "所选学生已被其他老师修改，请刷新后重新操作", tone: "warning" });
        return;
      }
      const scope = applyScope ?? "all";
      const updateIds = ids.filter((id) => durationUpdateDays(durationControls[id], rule, scope).length > 0);
      setConfirmation({
        title: "确认保存使用时长规则？", scope: label,
        selectedObjects: durationEditor.selectedObjects,
        count: updateIds.length,
        description: `${weekdayRangeText(rule.weekdays)}：${durationRuleText(rule)}`,
        action: "确认并生效",
        run: () => {
          if (ids.some((id) => policySignature(durationControls[id], "duration") !== baseSignatures[id])) { setMessage({ text: "所选学生已被其他老师修改，请刷新后重新操作", tone: "warning" }); return; }
          if (updateIds.length) writeControls(updateIds, (control) => applySchoolDurationRule(control, rule, scope), "保存使用时长规则");
          else setMessage({ text: "全部所选星期均为班主任配置，本次保留原规则", tone: "success" });
        },
      });
    }
    setDurationEditor(null);
  };
  const deleteDurationRules = (ids: string[], label: string, ruleId?: string) => setConfirmation({
    title: ruleId ? "确认删除使用时长规则？" : "确认恢复默认规则？",
    scope: label,
    count: ids.length,
    description: `${ruleId ? "删除后，对应星期恢复默认设置。" : "将清除所选范围当前设置的规则，并恢复默认规则。"}默认设置：连续使用60分钟、休息15分钟、每天累计180分钟，不限使用时段。`,
    action: ruleId ? "确认删除" : "确认恢复",
    danger: true,
    run: () => writeControls(ids, (control) => ({ ...control, durationRules: ruleId ? control.durationRules.filter((rule) => rule.id !== ruleId) : [] }), ruleId ? "删除使用时长规则" : "恢复默认使用时长规则"),
  });
  const saveEditor = (value: ControlEditorValue) => {
    if (!editor) return;
    const { ids, label, editingId, baseSignatures } = editor;
    if (ids.some((id) => policySignature(controls[id], tab) !== baseSignatures[id])) {
      setEditor(null);
      setMessage({ text: "所选学生已被其他老师修改，请刷新后重新操作", tone: "warning" });
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
      selectedObjects: label.startsWith("已选") ? selectedObjectNames : undefined,
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
            ? `修改范围：${value.applyScope === "all" ? `修改${label === "全校" ? "全校" : "当前所选范围"}全部学生，将覆盖老师此前单独设置的学生` : "跳过老师单独设置的学生，保留老师已有设置"}。`
            : "新借用规则将应用到所选学生。每周借用规则与指定日期借用规则分别保留。"
        : value.applyScope
          ? `修改范围：${value.applyScope === "all" ? `修改${label === "全校" ? "全校" : "当前所选范围"}全部学生，将覆盖老师此前单独设置的学生` : "跳过老师单独设置的学生，保留老师已有设置"}。`
          : "将统一设置所选学生的权限，覆盖此前的单独设置。",
      resultPreview: schedule ? <>
        <p className="font-bold">{schedule.mode === "dates" ? "保存后的规则" : "保存后实际生效规则"}</p>
        {resultingRules.map((rule) => <p key={rule} className="mt-1">{rule}</p>)}
      </> : undefined,
      action: schedule?.mode === "dates" ? "保存" : "确认并生效",
      run: () => {
        if (schedule) {
          const problem = validateSchedule(schedule);
          if (problem) {
            setMessage({ text: problem, tone: "error" });
            return;
          }
        }
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
        if (schedule?.mode === "dates") setMessage({ text: `指定日期借用规则已保存，${borrowScheduleStatus(schedule)}`, tone: "success" });
        setEditor(null);
      },
    });
  };
  const requestBoolean = (ids: string[], label: string, value: boolean) => {
    if (tab === "lock" && currentUser.role !== "school-admin" && !teacherMayModifyLock(schoolTemporaryLockSession, effectiveTemporaryLocks, ids)) {
      setMessage({ text: SCHOOL_TEMPORARY_LOCK_NOTICE, tone: "warning" });
      return;
    }
    if (tab === "lock") {
      const targetSet = new Set(ids);
      const scopes = rows.filter((row) => row.ids.every((id) => targetSet.has(id))).map((row) => ({ key: row.id, label: row.label, ids: row.ids }));
      requestTemporaryLock(scopes, value);
      return;
    }
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
      danger: !value,
      run: () =>
        writeControls(ids, (s) => ({
          ...s,
          [tab === "world" ? "world" : "locked"]: value,
        }), action),
    });
  };
  const schoolStudentIds = deviceControlStudents.map((student) => student.id);
  const affectedLockClassCount = (ids: string[], enabled: boolean) => {
    const selectedIds = new Set(ids);
    return new Set(deviceControlStudents.filter((student) => selectedIds.has(student.id) && temporaryLockedIds.has(student.id) !== enabled).map((student) => student.classId)).size;
  };
  const requestTemporaryLock = (scopes: TemporaryLockScope[], enabled: boolean, confirmed = false) => {
    const schoolAction = scopes.some((scope) => scope.key === "school");
    const changedScopes = schoolAction ? scopes : scopes.filter((scope) => scope.ids.some((id) => temporaryLockedIds.has(id) !== enabled));
    if (!changedScopes.length) {
      setMessage({ text: enabled ? "所选范围均已开启临时锁屏" : "所选范围均未单独开启临时锁屏，无需解除", tone: "info" });
      return;
    }
    const ids = [...new Set(changedScopes.flatMap((scope) => scope.ids))].filter((id) => schoolAction || temporaryLockedIds.has(id) !== enabled);
    const nextLocks = schoolAction ? enabled ? updateTemporaryLocks({}, scopes, true) : {} : updateTemporaryLocks(effectiveTemporaryLocks, changedScopes, enabled);
    const selectedIds = new Set(scopes.flatMap((scope) => scope.ids));
    const affectedClasses = new Set(deviceControlStudents.filter((student) => selectedIds.has(student.id)).map((student) => student.classId));
    const nextClassStates = schoolAction && !enabled ? {} : { ...temporaryLockClassStates, ...Object.fromEntries(schoolDeviceClasses.filter((item) => affectedClasses.has(item.id)).map((item) => [item.id, { name: item.name, enabled }])) };
    const nextSession: SchoolTemporaryLockSession = schoolAction
      ? updateSchoolTemporaryLockSession(schoolTemporaryLockSession, borrowControls, schoolStudentIds, enabled)
      : schoolTemporaryLockSession;
    const label = changedScopes.map((scope) => scope.label).join("、");
    const confirmation: Confirmation = {
      title: enabled ? "确认开启临时锁屏？" : "确认解除临时锁屏？",
      scope: label,
      count: ids.length,
      description: enabled
        ? schoolAction ? "全校进入临时锁屏管控。期间老师不能修改锁屏状态，管理员可单独解除年级或班级的临时锁屏。" : "临时锁定所选范围的学生设备，保留老师原有的锁屏设置。"
        : schoolAction ? "结束本次全校临时锁屏管控，所有年级、班级恢复原有日常锁屏状态，老师恢复锁屏操作权限。" : `解除临时锁屏后，恢复原有日常锁屏状态。${schoolTemporaryLockSession.active ? "全校临时锁屏管控尚未结束，老师仍不可修改锁屏。" : ""}`,
      action: enabled ? "开启临时锁屏" : "解除临时锁屏",
      danger: enabled,
      run: () => {
        const at = new Date().toLocaleString("zh-CN", { hour12: false });
        const snapshot = Object.fromEntries(ids.map((id) => [id, controls[id]]));
        const summarize = (state: TemporaryLocks) => { const lockedIds = temporaryLockedStudentIds(state); return [...new Set(ids.map((id) => lockedIds.has(id) ? "临时锁屏已开启" : "临时锁屏未开启"))]; };
        setTemporaryLocks(nextLocks);
        setTemporaryLockClassStates(nextClassStates);
        setSchoolTemporaryLockSession(nextSession);
        setBorrowControls((current) => Object.fromEntries(Object.entries(current).map(([id, control]) => [id, ids.includes(id) ? { ...control, locked: control.locked ?? false, updated: { ...control.updated, lock: { by: operatorLabel, at } } } : control])));
        setOperationRecords((records) => limitHistoryByModule([{ id: `record-${Date.now()}`, module: "lock", title: enabled ? "开启临时锁屏" : "解除临时锁屏", scope: schoolAction ? "全校" : actualScope(scopes.flatMap((scope) => scope.ids)), time: at, operator: operatorLabel, source: "teacher-portal", operatorRole: currentUser.role, before: summarize(effectiveTemporaryLocks), after: summarize(nextLocks), ids, snapshot }, ...records]));
        setSelected([]);
        setBatchMode(false);
        setMessage({ text: enabled ? "临时锁屏已开启" : "已解除临时锁屏，恢复原有日常锁屏状态。", tone: "success" });
      },
    };
    if (confirmed) confirmation.run();
    else setConfirmation(confirmation);
  };
  const openLockAction = (ids: string[], label: string) => {
    if (!ids.length) return;
    const state = temporaryState(ids);
    if (state === "部分开启") setLockEditor({ ids, label });
    else requestTemporaryLock([{ key: "selection", label, ids }], state === "未开启");
  };
  const schoolBorrowRules = borrowControls[schoolStudentIds[0]]?.schedules.filter(
    (rule) => rule.mode === borrowMode,
  ) ?? [];
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
    tab === "lock" ? temporaryState(currentStudents.map((student) => student.id)) === "已开启" : isScheduleTab
      ? tab === "duration" ? defaultDurationEnabled : scheduleEnabled
      : currentStudents.every((s) =>
          tab === "world" ? controls[s.id].world : controls[s.id].locked,
        );
  const stateStudentCount = currentStudents.filter((student) =>
    tab === "world" ? controls[student.id].world : controls[student.id].locked,
  ).length;
  const scopeStateLabel =
    tab === "world"
      ? `允许使用 ${stateStudentCount} 人 ｜ 禁止使用 ${currentStudents.length - stateStudentCount} 人`
      : tab === "lock"
        ? !grade && schoolTemporaryLockSession.active ? `全校临时锁屏管控中${temporaryLockedIds.size < schoolStudentIds.length ? "，部分班级已单独解除" : ""}` : `临时锁屏${temporaryState(currentStudents.map((student) => student.id))}`
        : tab === "duration"
          ? grade ? scopeStatus.main : "全校默认配置说明"
        : !grade && tab === "borrowing"
          ? "按有效规则借用"
          : scopeStatus.main;
  const ActiveIcon = tabs.find((item) => item.id === tab)?.icon ?? Clock;
  const visibleOperationRecords = operationRecords.filter((record, index, records) => {
    if (record.module !== tab) return false;
    const signature = JSON.stringify([record.module, record.title, record.scope, record.time, record.before, record.after]);
    return records.findIndex((item) => JSON.stringify([item.module, item.title, item.scope, item.time, item.before, item.after]) === signature) === index;
  }).slice(0, 100);

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
                    {tab !== "duration" && <span
                      role="status"
                      className={`dc-state-badge ${tab === "world" || tab === "lock" ? "dc-state-count" : ""}`}
                      data-tone={
                        tab === "lock" ? switchChecked ? "danger" : "neutral" : !grade && tab !== "homework"
                          ? switchChecked
                              ? "success"
                              : "neutral"
                          : scopeStatus.active
                            ? "success"
                            : "neutral"
                      }
                    >
                      {scopeStateLabel}
                    </span>}
                  </h2>
                  <p>
                    {tab === "duration"
                      ? "默认规则：周一至周日，连续使用60分钟、休息15分钟、每天累计180分钟，不限使用时段。"
                      : isScheduleTab
                      ? "仅可在学生有效规则允许的时段借出；没有有效规则的学生无法借用。特殊日期可设置全天禁止借用，到期后恢复每周规则。"
                      : tab === "homework"
                        ? "设置学生查看答案、详解的权限，默认均不允许。"
                        : tab === "lock"
                          ? <>可对全校、年级或班级临时锁屏，解除后恢复原有日常锁屏状态。<strong className="ml-1 font-bold">临时锁屏老师不可操作</strong></>
                          : "可统一设置全校学生是否允许使用万象视界，也可在下方按年级、班级设置。"}
                    {grade && tab !== "borrowing" && ` 当前 ${currentStudents.length} 名学生。`}
                  </p>
                </div>
              </div>
              {!grade && (tab === "world" || tab === "lock") && (
                <div className="flex flex-wrap items-center gap-3">
                  {tab === "world" ? <button type="button" className={primary} onClick={() => setWorldEditor({ ids: schoolStudentIds, label: "全校", value: null })}>设置全校使用状态</button> : <button type="button" className={primary} onClick={() => requestTemporaryLock([{ key: "school", label: "全校", ids: schoolStudentIds }], !schoolTemporaryLockSession.active)}>{schoolTemporaryLockSession.active ? "解除临时锁屏" : "全校临时锁屏"}</button>}
                </div>
              )}
            </div>
          </section>
          {tab === "duration" && <section className="dc-list-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div><h3 className="font-bold text-slate-900">班主任调整权限 · {durationTeacherCanEdit ? "已开放" : "未开放"}</h3><p className="mt-2 text-sm text-slate-500">开放后，班主任可调整本班使用时长。关闭后，班主任不能修改，已有设置继续生效。</p></div>
              <div className="flex flex-wrap gap-3"><button type="button" className={button} onClick={() => setConfirmation({ title: durationTeacherCanEdit ? "关闭班主任调整权限？" : "开放班主任调整权限？", scope: "全校", count: schoolStudentIds.length, description: durationTeacherCanEdit ? "关闭后班主任只能查看使用时长，现有规则继续生效。" : "班主任可调整本班及学生的使用时长，当前规则保持不变，之前被替换的配置不会恢复。", action: "确认", run: () => { changeDurationPermission(!durationTeacherCanEdit); setMessage({ text: durationTeacherCanEdit ? "已关闭班主任调整权限，现有规则保持不变" : "已开放班主任调整权限，当前规则保持不变", tone: "success" }); } })}>{durationTeacherCanEdit ? "关闭调整权限" : "开放调整权限"}</button></div>
            </div>
          </section>}
          {tab === "borrowing" && (
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
                      <p className="flex items-center gap-3 font-bold text-slate-900">{scheduleDateText(rule)}{rule.mode === "dates" && <span className={`rounded-md px-2 py-1 text-xs font-medium ${borrowScheduleStatus(rule, ruleStatusNow) === "生效中" ? "bg-emerald-50 text-emerald-700" : borrowScheduleStatus(rule, ruleStatusNow) === "已失效" ? "bg-slate-100 text-slate-500" : "bg-amber-50 text-amber-700"}`}>{borrowScheduleStatus(rule, ruleStatusNow)}</span>}</p>
                      <p className="mt-1 text-sm text-slate-600">{schedulePeriodText(rule)}</p>
                    </div>
                    <div className="flex gap-2">
                      {(rule.mode !== "dates" || borrowScheduleStatus(rule, ruleStatusNow) !== "已失效") && <button type="button" className={button} onClick={() => openEditor(schoolStudentIds, "全校", undefined, rule)}>编辑</button>}
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
                      ? "可在操作列单独设置学生，或使用批量操作。"
                      : grade
                        ? "可在操作列设置班级，或使用批量操作；教师端不展示学生列表。"
                        : "点击年级名称查看班级，可在操作列单独设置或使用批量操作。"}
                </p>
              </div>
              <div className="dc-actions">
                {tab === "duration" || tab === "homework" ? (
                  !batchMode && <button type="button" className={primary} onClick={() => { setBatchMode(true); setSelected([]); setMessage({ text: `请选择要设置的${rowType}`, tone: "info" }); }}>批量操作</button>
                ) : tab === "world" ? (
                  !batchMode && <button type="button" className={primary} onClick={() => { setBatchMode(true); setSelected([]); setMessage({ text: `请选择要设置的${rowType}`, tone: "info" }); }}>批量设置</button>
                ) : (
                  !batchMode && <button type="button" className={primary} onClick={() => {
                    setBatchMode(true);
                    setSelected([]);
                    setMessage({ text: `请选择需要锁屏或解除临时锁屏的${rowType}`, tone: "info" });
                  }}>批量操作</button>
                )}
              </div>
            </div>
            {batchMode && (
              <div className="dc-selection-bar flex items-center justify-between gap-3">
                <span>
                  {selected.length
                    ? `已选 ${selected.length} ${classId ? "名学生" : `个${rowType}`}，共 ${targetIds.length} 名学生`
                    : tab === "lock" ? `请选择需要锁屏或解除临时锁屏的${rowType}` : `请选择要设置的${rowType}`}
                </span>
                <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setSelected([]);
                    setBatchMode(false);
                    setMessage(null);
                  }}
                  className="shrink-0 font-bold"
                >
                  取消
                </button>
                {tab === "duration" && <button type="button" className={primary} disabled={!targetIds.length} onClick={() => openDurationEditor(targetIds, targetLabel)}>设置使用时长</button>}
                {tab === "homework" && <button type="button" className={primary} disabled={!targetIds.length} onClick={() => openEditor(targetIds, targetLabel, undefined, undefined, selectedObjectNames)}>设置查看权限</button>}
                {tab === "world" && <button type="button" className={primary} disabled={!targetIds.length} onClick={() => setWorldEditor({ ids: [...new Set(targetIds)], label: selectedObjectNames.join("、"), value: null })}>设置使用状态</button>}
                {tab === "lock" && <button type="button" className={primary} disabled={!targetIds.length} onClick={() => openLockAction([...new Set(targetIds)], selectedObjectNames.join("、"))}>{targetIds.length ? lockActionLabel(targetIds) : "设置临时锁屏"}</button>}
                </div>
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
                    {batchMode && (
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
                    )}
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
                      {batchMode && (
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
                      )}
                      <td className="py-4 align-top text-slate-400">
                        {(currentPage - 1) * pageSize + index + 1}
                      </td>
                      <td className="py-4 align-top">
                        {row.classId ? <span className="font-bold text-slate-900">{row.label}</span> : <button
                          type="button"
                          onClick={() =>
                            row.student
                              ? setDetailId(row.student.id)
                              : navigate(row.grade!, row.classId ?? null)
                          }
                          className="font-bold text-indigo-600 hover:underline"
                        >
                          {row.label}
                        </button>}
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
                        temporaryLockState={temporaryState(row.ids)}
                        defaultDurationEnabled={defaultDurationEnabled}
                        defaultDurationRule={defaultDuration}
                        onBorrowOverview={() => showBorrowOverview(row)}
                      />
                      <td className="dc-row-actions sticky right-0 px-5 py-4 align-top">
                        <div className="flex flex-col items-start gap-3">
                          {tab === "duration" && (
                            <button type="button" className="dc-link whitespace-nowrap" onClick={() => openDurationEditor(row.ids, row.label)}>
                              设置使用时长
                            </button>
                          )}
                          {tab === "homework" && (
                            <button type="button" className="dc-link whitespace-nowrap" onClick={() => openEditor(row.ids, row.label, undefined, undefined, [row.label])}>
                              设置权限
                            </button>
                          )}
                          {tab === "world" && <button type="button" className="dc-link whitespace-nowrap" onClick={() => setWorldEditor({ ids: row.ids, label: row.label, value: null })}>设置使用状态</button>}
                          {tab === "lock" && <button type="button" className="dc-link whitespace-nowrap" onClick={() => openLockAction(row.ids, row.label)}>{lockActionLabel(row.ids)}</button>}
                          {!row.classId && <button
                            type="button"
                            onClick={() =>
                              row.student
                                ? setDetailId(row.student.id)
                                : navigate(row.grade!, row.classId ?? null)
                            }
                            className="dc-link flex items-center gap-1 whitespace-nowrap"
                          >
                            {row.student
                              ? "查看详情"
                              : grade
                                ? "查看学生"
                                : "查看班级"}
                            <ChevronRight size={15} />
                          </button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!pageRows.length && (
                    <tr>
                      <td
                        colSpan={
                          3 +
                          (batchMode ? 1 : 0) +
                          configurationColumnCount({
                            module: tab,
                            student: !!classId,
                            mode: borrowMode,
                          })
                        }
                      >
                        <div className="dc-empty">
                          <span>
                            <Info size={23} strokeWidth={1.5} />
                          </span>
                          <p>暂无{rowType}</p>
                          <small>当前范围暂无数据</small>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {pageCount > 1 && <div className="dc-pagination flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
              <span>
                共 {rows.length} {classId ? "名学生" : `个${rowType}`} ·
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
          {message && <ControlToast message={message.text} tone={message.tone} onClose={() => setMessage(null)} />}
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
            batchMode && tab === "homework" ? { answer: false, explanation: false } : !editor.schedule && !mixed(editor.ids)
              ? controls[editor.ids[0]]
              : undefined
          }
          batchDefaults={batchMode && tab === "homework"}
          requireApplyScope={editor.requireApplyScope}
          onClose={() => setEditor(null)}
          onSave={saveEditor}
        />
      )}
      {durationEditor && <DurationRuleEditor
        key={`${durationEditor.isDefault ? "default" : durationEditor.label}-${durationEditor.rule.id}`}
        label={durationEditor.label}
        count={durationEditor.ids.length}
        selectedObjects={durationEditor.selectedObjects}
        rule={durationEditor.rule}
        defaultRule={defaultDuration}
        isDefault={durationEditor.isDefault}
        requireApplyScope={!durationEditor.isDefault}
        onClose={() => setDurationEditor(null)}
        onSave={saveDurationRule}
      />}
      {lockEditor && <TemporaryLockEditor label={lockEditor.label} selectedObjects={lockEditor.label.startsWith("已选") ? selectedObjectNames : undefined} count={lockEditor.ids.length} lockClassCount={affectedLockClassCount(lockEditor.ids, true)} unlockClassCount={affectedLockClassCount(lockEditor.ids, false)} lockedCount={lockEditor.ids.filter((studentId) => temporaryLockedIds.has(studentId)).length} schoolSessionActive={schoolTemporaryLockSession.active} state={temporaryState(lockEditor.ids)} onClose={() => setLockEditor(null)} onSave={(enabled) => requestTemporaryLock([{ key: "selection", label: lockEditor.label, ids: lockEditor.ids }], enabled, true)} />}
      {worldEditor && <WorldUsageEditor label={worldEditor.label} selectedObjects={worldEditor.label.startsWith("已选") ? selectedObjectNames : undefined} total={worldEditor.ids.length} allowed={worldEditor.ids.filter((id) => controls[id].world).length} onClose={() => setWorldEditor(null)} onSave={(value) => {
        const changedIds = worldEditor.ids.filter((id) => controls[id].world !== value);
        if (!changedIds.length) return;
        const state = value ? "允许使用" : "禁止使用";
        writeControls(changedIds, (control) => ({ ...control, world: value }), `${state}万象视界`);
        setMessage({ text: `已将 ${changedIds.length} 名学生设为${state}万象视界`, tone: "success" });
      }} />}
      {historyOpen && (
        <DeviceControlLayer labelId="operation-history-title" onClose={() => setHistoryOpen(false)}>
          {(close) => <>
            <header className="flex items-center justify-between border-b p-6">
              <div>
                <h2 id="operation-history-title" className="text-xl font-bold text-slate-900">{tabs.find((item) => item.id === tab)?.label}操作记录</h2>
                <p className="mt-1 text-sm text-slate-500">仅记录教师端学校管理员的操作，每个模块显示近100条记录</p>
              </div>
              <button type="button" aria-label="关闭操作记录" onClick={close} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={20} /></button>
            </header>
            <div className="dc-panel-body space-y-4">
              {visibleOperationRecords.length ? visibleOperationRecords.map((record) => (
                <article key={record.id} className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div><h3 className="font-bold text-slate-900">{record.title}</h3><p className="mt-1 text-xs text-slate-500">{record.time} · {record.operator} · {record.scope}</p></div>
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
                {!!confirmation.selectedObjects?.length && <ul aria-label="本次确认对象列表" className="mt-2 flex flex-wrap gap-2">{confirmation.selectedObjects.map((name) => <li key={name} className="rounded bg-white px-2 py-1 text-sm">{name}</li>)}</ul>}
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
