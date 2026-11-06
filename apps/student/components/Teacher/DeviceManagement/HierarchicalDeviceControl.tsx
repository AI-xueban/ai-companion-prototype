import { preserveTeacherSettings } from '../data/schoolControlProtection';
import { restoreDefaultHomeworkRule, usesDefaultHomeworkRule } from '../data/homeworkDefaultRule';
import { SchoolSwitchControl } from './SchoolSwitchControl';
import { SchoolDurationRuleList } from './SchoolDurationRuleList';
import { ControlGradeSelector } from './ControlGradeSelector';
import { moveSchoolDurationPolicySet, occupiedSchoolDurationDays, applySchoolPolicySetToStudent, updateSchoolDurationPolicySet, removeSchoolPolicyFromStudent, importSchoolDurationPolicies, SchoolDurationPolicies, schoolDurationGroups, updateSchoolDurationPolicies } from '../data/schoolDurationPolicies';
import React, { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowLeftRight,
  BookOpen,
  ChevronRight,
  Clock,
  Info,
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
  policyDisplaySignature,
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
import { SchoolBorrowingControl } from "./SchoolBorrowingControl";
import {
  configurationColumnCount,
  ControlConfigurationCells,
  ControlConfigurationHeaders,
} from "./ControlConfigurationColumns";
import { DeviceControlLayer } from "./DeviceControlLayer";
import { durationUpdateDays } from "../data/durationApplyScope";
import { DurationRuleEditor } from "./DurationRuleEditor";
import { ControlScopeCards } from "./ControlScopeCards";
import { DurationRulesDrawer } from "./DurationRulesDrawer";
import { DurationRuleGroup } from "../data/durationRuleGroups";
import { WorldUsageEditor } from "./WorldUsageEditor";
import { TemporaryLockEditor } from "./TemporaryLockEditor";
import { applyTemporaryLocks, updateTemporaryLocks, temporaryLockedStudentIds, TemporaryLocks, TemporaryLockScope, updateSchoolTemporaryLockSession, SchoolTemporaryLockSession, SCHOOL_TEMPORARY_LOCK_NOTICE, TemporaryLockClassStates, inheritTemporaryLocksByClass, teacherMayModifyLock } from "../data/temporaryDeviceLock";
import { ControlToast, ControlToastTone } from "./ControlToast";
import "./DeviceControl.css";
import type { ControlExceptionDemo } from "../data/controlExceptionDemo";

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
  originalIds?: string[];
  ids: string[];
  label: string;
  selectedObjects?: string[];
  schedule?: BorrowSchedule;
  editingId?: string;
  requireApplyScope?: boolean;
  baseSignatures: Record<string, string>;
};
type Confirmation = {
  hideCount?: boolean;
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
  schoolRuleModulesEnabled?: Partial<Record<'duration' | 'homework', boolean>>;
  schoolDurationPolicies?: SchoolDurationPolicies;
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
      stored.schoolDurationPolicies ??= importSchoolDurationPolicies(deviceControlStudents, stored.duration);
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

export const HierarchicalDeviceControl: React.FC<{ currentUser: TeacherPortalUser; demoScenario?: ControlExceptionDemo }> = ({
  currentUser,
  demoScenario,
}) => {
  const [tab, setTab] = useState<ControlModule>(demoScenario?.module ?? "borrowing");
  const [exception, setException] = useState(demoScenario?.kind);
  const [borrowMode, setBorrowMode] =
    useState<BorrowSchedule["mode"]>("weekly");
  const [grade, setGrade] = useState<number | null>(null);
  const [classId, setClassId] = useState<string | null>(null);
  useEffect(() => { setGrade(null); setClassId(null); }, []);
  const defaultDurationEnabled = true;
  const [defaultDuration, setDefaultDuration] = useState<DurationRule>({ id: "default-duration", weekdays: [0, 1, 2, 3, 4, 5, 6], useDefault: false, ...defaultDurationRule, periods: [] });
  const [storedControls] = useState(readStoredControls);
  const [schoolDurationPolicies, setSchoolDurationPolicies] = useState<SchoolDurationPolicies>(storedControls.schoolDurationPolicies ?? {});
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
  const [schoolRuleModulesEnabled, setSchoolRuleModulesEnabled] = useState(storedControls.schoolRuleModulesEnabled ?? {});
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
  const [worldActionValue, setWorldActionValue] = useState<boolean | undefined>(undefined);
  const [settingsGrades, setSettingsGrades] = useState<number[] | null>(null);
  const [durationOverview, setDurationOverview] = useState<{ ids: string[]; label: string; global?: boolean } | null>(null);
  const [durationEditor, setDurationEditor] = useState<{ originalIds?: string[]; ids: string[]; label: string; rule: DurationRule; isDefault?: boolean; editingId?: string; originalRule?: DurationRule; requireApplyScope?: boolean; selectedObjects?: string[]; baseSignatures: Record<string, string> } | null>(null);
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
  const [worldEditor, setWorldEditor] = useState<{ ids: string[]; label: string; value: null; baseSignatures: Record<string, string> } | null>(null);
  const [lockEditor, setLockEditor] = useState<{ ids: string[]; label: string } | null>(null);
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
  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key !== CONTROL_STORAGE_KEY) return;
      const latest = readStoredControls();
      setBorrowControls(latest.borrow);
      setDurationControls(latest.duration);
      setSchoolRuleModulesEnabled(latest.schoolRuleModulesEnabled ?? {});
      setSchoolDurationPolicies(latest.schoolDurationPolicies ?? {});
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
      window.localStorage.setItem(CONTROL_STORAGE_KEY, JSON.stringify({ borrow: borrowControls, duration: durationControls, schoolDurationPolicies, temporaryLocks, schoolTemporaryLockSession, temporaryLockClassStates, schoolRuleModulesEnabled }));
    } catch { /* 浏览器存储不可用时继续使用当前会话数据 */ }
  }, [borrowControls, durationControls, schoolDurationPolicies, temporaryLocks, schoolTemporaryLockSession, temporaryLockClassStates, schoolRuleModulesEnabled]);
  useEffect(() => {
    try {
      window.localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(limitHistoryByModule(operationRecords)));
    } catch { /* 记录较大或浏览器存储不可用时继续使用当前会话数据 */ }
  }, [operationRecords]);
  const listEmpty = ['no-grades', 'no-classes', 'no-students'].includes(exception ?? '');
  const currentStudents = listEmpty ? [] : deviceControlStudents.filter((s) =>
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
          : policyDisplaySignature(s, tab),
      ),
    ).size > 1;
  const status = (ids: string[]) => {
    if (tab === "duration") {
      const selectedIds = new Set(ids);
      const grades = new Set(deviceControlStudents.filter(student => selectedIds.has(student.id)).map(student => student.grade));
      const count = [...grades].reduce((sum, value) => sum + (schoolDurationPolicies[value]?.length ?? 0), 0);
      return { main: count ? "已设置年级规则" : "默认规则", sub: "仅展示学校管理员设置的年级规则", active: count > 0 };
    }
    const entries = values(ids);
    if (ids.length === 1) {
      const value = entries[0];
      const sub = "";
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
        sub: "",
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
  const rows: ScopeRow[] = listEmpty ? [] : controlGrades.map(g => ({
    id: `grade-${g}`, label: `${g}年级`, subtitle: "",
    ids: deviceControlStudents.filter(student => student.grade === g).map(student => student.id), grade: g,
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
      ? "已选范围"
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
  const latestControls = useRef({ borrow: borrowControls, duration: durationControls });
  latestControls.current = { borrow: borrowControls, duration: durationControls };
  const currentModuleControls = (module: ControlModule) => {
    const stored = readStoredControls();
    return module === "duration" ? stored.duration : stored.borrow;
  };
  const demoConflictPending = useRef(demoScenario?.kind === 'conflict');
  const toggleSchoolRuleModule = (module: 'duration' | 'homework') => {
    if (currentUser.role !== 'school-admin') return;
    try {
      if (exception === 'save-failed') throw new Error('save-failed');
      const stored = readStoredControls();
      const latest = stored.schoolRuleModulesEnabled ?? {};
      if ((latest[module] !== false) !== (schoolRuleModulesEnabled[module] !== false)) {
        setSchoolRuleModulesEnabled(latest); setMessage({ text: '相关设置已被其他人修改，本次未保存，请重新设置。', tone: 'warning' }); return;
      }
      const enabled = latest[module] === false;
      const next = { ...latest, [module]: enabled };
      localStorage.setItem(CONTROL_STORAGE_KEY, JSON.stringify({ ...stored, schoolRuleModulesEnabled: next }));
      setSchoolRuleModulesEnabled(next);
      setMessage({ text: `${module === 'duration' ? '使用时长规则' : '智阅作业规则'}已${enabled ? '生效' : '暂停'}`, tone: 'success' });
    } catch { setMessage({ text: '保存失败，请稍后重试。', tone: 'error' }); }
  };
  const worldSwitchSignatures = useRef<Record<string, string>>({});
  const hasConflict = (ids: string[], module: ControlModule, signatures: Record<string, string>) => {
    const latest = currentModuleControls(module);
    const local = module === "duration" ? latestControls.current.duration : latestControls.current.borrow;
    const simulatedConflict = demoConflictPending.current;
    demoConflictPending.current = false;
    if (!simulatedConflict && !ids.some(id => !latest[id] || policySignature(latest[id], module) !== signatures[id] || policySignature(local[id], module) !== signatures[id])) return false;
    const stored = readStoredControls();
    setBorrowControls(stored.borrow);
    setDurationControls(stored.duration);
    setSchoolDurationPolicies(stored.schoolDurationPolicies ?? {});
    setEditor(null); setDurationEditor(null); setWorldEditor(null);
    setMessage({ text: "相关设置已被其他人修改，本次未保存，请重新设置。", tone: "warning" });
    return true;
  };
  const openWorldEditor = (ids: string[], label: string) => setWorldEditor({ ids, label, value: null, baseSignatures: Object.fromEntries(ids.map(id => [id, policySignature(controls[id], "world")])) });
  const writeControls = (
    ids: string[],
    apply: (value: StudentControl, id: string) => StudentControl,
    actionTitle = "修改管控设置",
    operationScope?: string,
  ) => {
    const at = new Date().toLocaleString("zh-CN", { hour12: false });
    const stored = readStoredControls();
    const current = tab === "duration" ? stored.duration : stored.borrow;
    // Preserve changes in the other bucket when a different module saved meanwhile.
    if (tab === "duration") setBorrowControls(stored.borrow);
    else { setDurationControls(stored.duration); setSchoolDurationPolicies(stored.schoolDurationPolicies ?? {}); }
    const next = { ...current };
    const snapshot = Object.fromEntries(ids.map((id) => [id, current[id]]));
    const summarize = (value: StudentControl) => {
      if (tab === "borrowing") return value.schedules.length ? value.schedules.map((rule) => `${scheduleDateText(rule)}；${schedulePeriodText(rule)}`) : ["无借用规则"];
      if (tab === "duration") return value.durationRules.length ? value.durationRules.map((rule) => `${scheduleDateText({ ...rule, mode: "weekly", startDate: "", endDate: "", deny: false })}；${durationRuleText(rule)}`) : [`每天；${durationRuleText(defaultDuration)}`];
      if (tab === "homework") return [`查看答案：${value.answer ? "允许" : "不允许"}；查看详解：${value.explanation ? "允许" : "不允许"}`];
      if (tab === "world") return [value.world ? "允许使用万象视界" : "禁止使用万象视界"];
      return [value.locked ? "已锁屏" : "未锁屏"];
    };
    const changedIds = ids.filter((id) => {
      const value = preserveTeacherSettings(current[id], apply(current[id], id), tab);
      if (value === current[id]) return false;
      next[id] = {
        ...value,
        revisions: { ...current[id].revisions, [tab]: (current[id].revisions?.[tab] ?? 0) + 1 },
        updated: { ...current[id].updated, [tab]: { by: operatorLabel, at } },
      };
      return true;
    });
    if (!changedIds.length) { setMessage({ text: '无需修改', tone: 'info' }); return; }
    ids = changedIds;
    const effectiveNext = next;
    const before = Array.from(new Set(ids.flatMap((id) => summarize(current[id]))));
    const after = Array.from(new Set(ids.flatMap((id) => summarize(effectiveNext[id]))));
    setControls(effectiveNext);
    setOperationRecords((records) => limitHistoryByModule([{ id: `record-${Date.now()}`, module: tab, title: actionTitle, scope: operationScope ?? actualScope(ids), time: at, operator: operatorLabel, source: "teacher-portal", operatorRole: currentUser.role, before, after, ids: [...ids], snapshot }, ...records]));
    setSelected([]);
    setBatchMode(false);
    setMessage({ text: actionTitle.includes('删除') ? '规则已删除' : actionTitle.startsWith('恢复') ? '已恢复默认设置' : '设置已生效', tone: "success" });
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
      originalIds: tab === "homework" && ids.length ? [...ids] : undefined,
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
    const blocked = isDefault ? [] : occupiedSchoolDurationDays(schoolDurationPolicies, deviceControlStudents, ids, rule);
    const available = [0, 1, 2, 3, 4, 5, 6].filter(day => !blocked.includes(day));
    if (!isDefault && !available.length) { setMessage({ text: "所选年级每天都已有规则，请修改已有规则或删除后再新增", tone: "warning" }); return; }
    setDurationEditor({ originalIds: rule ? [...ids] : undefined, ids, label, selectedObjects: label.startsWith("已选") ? [...selectedObjectNames] : [label], rule: rule ?? { ...newDurationRule(), weekdays: available }, isDefault, editingId: rule?.id, originalRule: rule, requireApplyScope: !classId && ids.length > 1 && !isDefault, baseSignatures: Object.fromEntries(ids.map((id) => [id, policySignature(durationControls[id], "duration")])) });
  };
  const requestDurationDelete = (group: DurationRuleGroup, label = actualScope(group.ids)) => {
    const signatures = Object.fromEntries(group.ids.map(id => [id, policySignature(durationControls[id], "duration")]));
    setConfirmation({ title: "确认删除使用时长规则？", scope: label, count: group.ids.length,
      description: `${weekdayRangeText(group.rule.weekdays)}：${durationRuleText(group.rule)}。删除后恢复默认设置`,
      action: "确认删除", danger: true, run: () => {
        if (hasConflict(group.ids, "duration", signatures)) return;
        writeControls(group.ids, control => removeSchoolPolicyFromStudent(control, group.rule), "删除使用时长规则", label);
        setSchoolDurationPolicies(updateSchoolDurationPolicies(readStoredControls().schoolDurationPolicies ?? {}, deviceControlStudents, group.ids, group.rule, undefined, true));
      },
    });
  };
  const saveDurationRule = (rules: DurationRule[], applyScope?: "all" | "unmodified") => {
    if (!durationEditor || !rules.length) return;
    if (!durationEditor.ids.length) { setMessage({ text: "请选择年级", tone: "warning" }); return; }
    const rule = rules[0];
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
      const { ids, label, originalRule, baseSignatures } = durationEditor;
      const removedIds = (durationEditor.originalIds ?? []).filter(id => !ids.includes(id));
      const checkedIds = [...new Set([...ids, ...(durationEditor.originalIds ?? [])])];
      const blocked = occupiedSchoolDurationDays(schoolDurationPolicies, deviceControlStudents, ids, originalRule);
      if (rules.some(item => item.weekdays.some(day => blocked.includes(day)))) { setMessage({ text: "所选星期已有规则，请修改已有规则或删除后再新增", tone: "warning" }); return; }
      const scope = "unmodified" as const;
      const updateIds = ids.filter((id) => rules.some(item => durationUpdateDays(durationControls[id], item, scope).length > 0) || (!!originalRule && durationUpdateDays(durationControls[id], originalRule, scope).length > 0));
      const removedUpdateIds = originalRule ? removedIds.filter(id => durationUpdateDays(durationControls[id], originalRule, scope).length > 0) : [];
      const changedIds = [...new Set([...updateIds, ...removedUpdateIds])];
      setConfirmation({
        title: "确认保存使用时长规则？", scope: label,
        hideCount: true,
        count: changedIds.length,
        description: `${rules.map(item => `${weekdayRangeText(item.weekdays)}：${durationRuleText(item)}`).join('；')}。${originalRule ? "替换本条原规则；移除的星期执行默认规则。" : ""}`,
        action: "确认并生效",
        run: () => {
          if (hasConflict(checkedIds, "duration", baseSignatures)) { setMessage({ text: "相关设置已被其他人修改，本次未保存，请重新设置。", tone: "warning" }); return; }
          const latestPolicies = readStoredControls().schoolDurationPolicies ?? {};
          const occupied = occupiedSchoolDurationDays(latestPolicies, deviceControlStudents, ids, originalRule);
          if (rules.some(item => item.weekdays.some(day => occupied.includes(day)))) { setMessage({ text: "所选星期已有规则，本次未保存，请修改已有规则或删除后再新增", tone: "warning" }); return; }
          setSchoolDurationPolicies(moveSchoolDurationPolicySet(latestPolicies, deviceControlStudents, durationEditor.originalIds ?? [], ids, rules, originalRule));
          if (changedIds.length) writeControls(changedIds, (control, id) => removedIds.includes(id) && originalRule ? removeSchoolPolicyFromStudent(control, originalRule, scope) : applySchoolPolicySetToStudent(control, rules, scope, originalRule), "保存使用时长规则", label);
          else {
            setOperationRecords(records => limitHistoryByModule([{ id: `record-${Date.now()}`, module: "duration", title: "保存年级使用时长规则", scope: label,
              time: new Date().toLocaleString("zh-CN", { hour12: false }), operator: operatorLabel, source: "teacher-portal", operatorRole: currentUser.role,
              before: ["学生实际配置为班主任设置"], after: [...rules.map(item => `年级学校规则：${weekdayRangeText(item.weekdays)}；${durationRuleText(item)}`), "保留全部班主任设置，学生实际配置不变"], ids: [...ids], snapshot: {},
            }, ...records]));
            setSelected([]); setBatchMode(false);
            setMessage({ text: "使用时长规则已保存", tone: "success" });
          }
          setDurationEditor(null);
        },
      });
    }
    if (durationEditor.isDefault) setDurationEditor(null);
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
    if (!editor.ids.length) { setMessage({ text: "请选择年级", tone: "warning" }); return; }
    const { ids, label, editingId, baseSignatures } = editor;
    value = { ...value, applyScope: "unmodified" };
    const schedule = value.schedule;
    const updateIds = schedule || value.applyScope !== 'unmodified' ? ids : ids.filter(id => controls[id].homeworkSource !== 'teacher');
    const removedIds = !schedule ? (editor.originalIds ?? []).filter(id => !ids.includes(id) && (value.applyScope !== 'unmodified' || controls[id].homeworkSource !== 'teacher')) : [];
    const checkedIds = [...new Set([...ids, ...(editor.originalIds ?? [])])];
    const changedIds = [...new Set([...updateIds, ...removedIds])];
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
      count: changedIds.length,
      description: schedule
        ? `${scheduleDateText(schedule)}；${schedulePeriodText(schedule)}`
        : `查看答案：${value.answer ? "允许" : "不允许"}；查看详解：${value.explanation ? "允许" : "不允许"}`,
      warning: schedule && conflicts.length ? <p>所选范围在指定日期已有同类借用规则，将覆盖重叠日期，其他日期保留。</p> : undefined,
      resultPreview: schedule ? <>
        <p className="font-bold">{schedule.mode === "dates" ? "保存后的规则" : "保存后实际生效规则"}</p>
        {resultingRules.map((rule) => <p key={rule} className="mt-1">{rule}</p>)}
      </> : undefined,
      action: schedule?.mode === "dates" ? "保存" : "确认并生效",
      run: () => {
        if (hasConflict(checkedIds, schedule ? "borrowing" : "homework", baseSignatures)) return;
        if (!changedIds.length) { setEditor(null); setMessage({ text: "无需修改", tone: "success" }); return; }
        if (schedule) {
          const problem = validateSchedule(schedule);
          if (problem) {
            setMessage({ text: problem, tone: "error" });
            return;
          }
        }
        writeControls(changedIds, (s, id) =>
          removedIds.includes(id) ? restoreDefaultHomeworkRule(s) : schedule
            ? {
                ...s,
                schedules: mergeBorrowSchedule(
                  s.schedules,
                  schedule,
                  editingId,
                ),
              }
            : { ...s, answer: value.answer!, explanation: value.explanation!, homeworkSource: 'school', homeworkUsesDefault: false },
          schedule ? "保存借用规则" : "设置智阅作业权限", label,
        );
        if (schedule?.mode === "dates") setMessage({ text: "指定日期借用规则已保存", tone: "success" });
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
  const affectedLockClassNames = (ids: string[], enabled: boolean) => {
    const selectedIds = new Set(ids);
    const affectedClassIds = new Set(deviceControlStudents.filter((student) => selectedIds.has(student.id) && temporaryLockedIds.has(student.id) !== enabled).map((student) => student.classId));
    return schoolDeviceClasses.filter((group) => affectedClassIds.has(group.id)).map((group) => group.name);
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
        : schoolAction ? "结束本次全校临时锁屏管控，所有年级、班级执行当前日常锁屏设置，老师恢复锁屏操作权限。" : "解除临时锁屏后，执行当前日常锁屏设置，恢复所选班级老师的锁屏管控权限；其他班级不受影响。",
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
        setMessage({ text: enabled ? "临时锁屏已开启" : "已解除临时锁屏", tone: "success" });
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
      ? "当前使用状态"
      : tab === "lock"
        ? !grade && schoolTemporaryLockSession.active ? `全校临时锁屏管控中${temporaryLockedIds.size < schoolStudentIds.length ? "，部分年级已单独解除" : ""}` : `临时锁屏${temporaryState(currentStudents.map((student) => student.id))}`
        : tab === "duration"
          ? grade ? scopeStatus.main : "全校默认配置说明"
        : !grade && tab === "borrowing"
          ? "按有效规则借用"
          : scopeStatus.main;
  // Demo requests are transient. They never replace school data or write a storage key.
  useEffect(() => {
    if (!demoScenario || demoScenario.kind === 'normal') return;
    if (demoScenario.kind === 'scope-changed') {
      setSelected([]);
      setMessage({ text: '所选范围的学生或班级已变化，请重新选择后设置。', tone: 'warning' });
    }
    if (demoScenario.kind === 'save-failed' || demoScenario.kind === 'conflict') {
      const ids = deviceControlStudents.filter(s => s.grade === 7).map(s => s.id);
      if (tab === 'duration') openDurationEditor(ids, '7年级', { ...newDurationRule(), continuousMinutes: 45 });
      else if (tab === 'world') openWorldEditor(ids, '7年级');
      else if (tab === 'homework') openEditor(ids, '7年级');
      else openEditor(schoolStudentIds, '全校', 'weekly');
      if (demoScenario.kind === 'save-failed') setMessage({ text: '保存失败，请检查网络或稍后重试。已填写的内容已保留。', tone: 'error' });
    }
  }, []);

  const emptyState = exception === 'no-grades' ? { scope: '全校', title: '学校暂无年级', description: '请先完善学校的年级信息。' }
    : exception === 'no-classes' ? { scope: '全校 / 7年级', title: '该年级暂无班级', description: '请先为该年级添加班级。' }
    : exception === 'no-students' ? { scope: '全校 / 7年级', title: '该年级暂无学生', description: '学生加入年级后，可设置管控规则。' }
    : exception === 'load-failed' ? { scope: '全校', title: '加载失败', description: '暂时无法获取管控数据，请检查网络后重试。' }
    : exception === 'permission' ? { scope: '全校', title: '暂无全校设备管控权限', description: '请联系平台管理员确认您的权限。' } : null;
  if (emptyState && !listEmpty) return <div className="dc-page flex h-full flex-col">
    <header className="dc-header border-b bg-white"><h1 className="text-2xl font-black">全校设备管控</h1><p className="mt-3 text-sm text-slate-600">{tabs.find(item => item.id === tab)?.label}</p></header>
    <div className="dc-workspace flex-1 overflow-y-auto"><div className="dc-content mx-auto"><p className="mb-5 text-sm text-slate-500">{emptyState.scope}</p>
      <section className="rounded-2xl border border-slate-200 bg-white px-6 py-20 text-center"><Info size={42} className="mx-auto text-slate-300"/><h2 className="mt-5 text-lg font-bold text-slate-800">{emptyState.title}</h2><p className="mt-2 text-sm text-slate-500">{emptyState.description}</p>
      {exception === 'load-failed' && <button type="button" className="dc-btn-primary mt-6" onClick={() => setException(undefined)}>重新加载</button>}
      {(exception === 'no-classes' || exception === 'no-students') && <button type="button" className="dc-btn mt-6" onClick={() => setException(undefined)}>返回全校</button>}
      </section></div></div>
  </div>;

  const changeSettingsGrades = (grades: number[]) => {
    setSettingsGrades(grades);
    const ids = rows.filter(row => grades.includes(row.grade!)).flatMap(row => row.ids);
    const label = !grades.length ? '请选择年级' : grades.length === rows.length ? '全校' : rows.filter(row => grades.includes(row.grade!)).map(row => row.label).join('、');
    const signatures = Object.fromEntries(ids.map(id => [id, policySignature(controls[id], tab)]));
    if (tab === 'duration') setDurationEditor(current => current ? { ...current, ids, label, selectedObjects: [label], baseSignatures: { ...current.baseSignatures, ...Object.fromEntries(ids.map(id => [id, current.baseSignatures[id] ?? policySignature(durationControls[id], 'duration')])) } } : current);
    else if (tab === 'homework') setEditor(current => current ? { ...current, ids, label, selectedObjects: [label], baseSignatures: { ...current.baseSignatures, ...Object.fromEntries(ids.map(id => [id, current.baseSignatures[id] ?? signatures[id]])) } } : current);
    else if (tab === 'world') setWorldEditor(current => current ? { ...current, ids, label, baseSignatures: { ...current.baseSignatures, ...Object.fromEntries(ids.map(id => [id, current.baseSignatures[id] ?? signatures[id]])) } } : current);
  };
  const durationListGroups = new Map<string, DurationRuleGroup>();
  rows.forEach(row => schoolDurationGroups(row.ids, schoolDurationPolicies[deviceControlStudents.find(student => row.ids.includes(student.id))?.grade ?? ''] ?? []).filter(group => !group.fallback).forEach(group => {
    const existing = durationListGroups.get(group.key);
    durationListGroups.set(group.key, existing ? { ...existing, ids: [...new Set([...existing.ids, ...group.ids])] } : group);
  }));
  const durationScopeLabel = (ids: string[]) => rows.filter(row => row.ids.some(id => ids.includes(id))).map(row => ['一', '二', '三', '四', '五', '六', '七', '八', '九'][(row.grade ?? 1) - 1] ?? String(row.grade)).join('、') + '年级';
  const originalSettingsIds = tab === 'duration' ? durationEditor?.originalIds : tab === 'homework' ? editor?.originalIds : undefined;
  const occupiedSettingsGrade = (row: typeof rows[number]) => !row.ids.some(id => originalSettingsIds?.includes(id)) && (
    tab === 'duration' ? occupiedSchoolDurationDays(schoolDurationPolicies, deviceControlStudents, row.ids).length > 0
    : tab === 'homework' && !!originalSettingsIds?.length && row.ids.some(id => !usesDefaultHomeworkRule(controls[id])));
  const settingsGradeSelector = settingsGrades === null ? undefined : <ControlGradeSelector options={rows.map(row => ({ grade: row.grade!, label: row.label, disabled: !row.ids.length || occupiedSettingsGrade(row), hint: occupiedSettingsGrade(row) ? '已有规则' : undefined }))} selected={settingsGrades} onChange={changeSettingsGrades} />;
  const durationConflictHint = !durationEditor || durationEditor.originalRule ? undefined : rows.filter(row => row.ids.some(id => durationEditor.ids.includes(id))).flatMap(row => {
    const days = occupiedSchoolDurationDays(schoolDurationPolicies, deviceControlStudents, row.ids);
    return days.length ? [`${row.label}${weekdayRangeText(days)}已有规则`] : [];
  }).join('；');
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
                  if (listEmpty) { setGrade(null); setClassId(null); }
                  setException(undefined);
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
        <div className="dc-content dc-borrowing-content mx-auto space-y-5">
          {tab === "borrowing" ? <SchoolBorrowingControl currentUser={currentUser} demoScenario={demoScenario?.module === 'borrowing' ? demoScenario : undefined} /> : <>
          {tab === 'duration' && <div className="borrow-order-description borrow-order-strip">可按年级设置使用时长和可用时段，未设置时执行默认规则。</div>}
          {tab === 'homework' && <div className="borrow-order-description borrow-order-strip">可按年级设置查看答案和详解的权限，默认均不允许。</div>}
          {(tab === 'world' || tab === 'lock') ? <SchoolSwitchControl module={tab} rows={rows} restricted={id => tab === 'world' ? !controls[id].world : temporaryLockedIds.has(id)} onOpen={() => { worldSwitchSignatures.current = Object.fromEntries(rows.flatMap(row => row.ids).map(id => [id, policySignature(controls[id], 'world')])); }} onApply={(ids, label, restore) => {
            if (tab === 'world') {
              if (hasConflict(ids, 'world', worldSwitchSignatures.current)) return;
              const changedIds = ids.filter(id => controls[id].world !== restore && controls[id].worldSource !== 'teacher');
              if (!changedIds.length) { setMessage({ text: '无需修改', tone: 'info' }); return; }
              writeControls(changedIds, control => ({ ...control, world: restore, worldSource: 'school' }), restore ? '恢复使用万象视界' : '停止使用万象视界', label);
              setMessage({ text: restore ? '已恢复使用万象视界' : '已停止使用万象视界', tone: 'success' });
            }
            else requestTemporaryLock([{ key: ids.length === schoolStudentIds.length ? 'school' : 'selection', label, ids }], !restore);
          }} /> : tab === 'duration' ? <SchoolDurationRuleList enabled={schoolRuleModulesEnabled.duration !== false} onToggle={() => toggleSchoolRuleModule('duration')} groups={[...durationListGroups.values()]} label={durationScopeLabel} disabled={!rows.some(row => row.ids.length)}
            onAdd={() => { const availableRows = rows.filter(row => row.ids.length); if (availableRows.length > 0 && availableRows.every(row => (schoolDurationPolicies[row.grade ?? ''] ?? []).length > 0)) { setMessage({ text: '全部年级已有规则，请编辑或删除后新增', tone: 'info' }); return; } setDurationOverview(null); setSettingsGrades([]); openDurationEditor([], '请选择年级'); }}
            onEdit={group => { setDurationOverview(null); setSettingsGrades(rows.filter(row => row.ids.some(id => group.ids.includes(id))).map(row => row.grade!)); openDurationEditor(group.ids, durationScopeLabel(group.ids), group.rule); }}
            onDelete={group => requestDurationDelete(group, durationScopeLabel(group.ids))} /> : <ControlScopeCards enabled={schoolRuleModulesEnabled.homework !== false} onToggle={() => toggleSchoolRuleModule('homework')} module={tab} rows={rows} rowType={rowType} controls={controls} durationPolicies={schoolDurationPolicies}
            batch={batchMode} selected={selected} onBatch={() => { const availableRows = rows.filter(row => row.ids.length); if (tab === 'homework' && availableRows.length > 0 && availableRows.every(row => row.ids.some(id => !usesDefaultHomeworkRule(controls[id])))) { setMessage({ text: '全部年级已有规则，请编辑或删除后新增', tone: 'info' }); return; } setBatchMode(false); setSelected([]); setSettingsGrades([]); if (tab === 'homework') openEditor([], '请选择年级'); else if (tab === 'world') openWorldEditor([], '请选择年级'); }} onSelect={setSelected}
            onDelete={tab === 'homework' ? row => {
              const signatures = Object.fromEntries(row.ids.map(id => [id, policySignature(controls[id], 'homework')]));
              setConfirmation({ title: '确认删除智阅作业规则？', scope: row.label, count: row.ids.length, hideCount: true,
                description: '删除后恢复默认规则：不允许查看答案和详解。', action: '确认删除', danger: true,
                run: () => { if (hasConflict(row.ids, 'homework', signatures)) return; writeControls(row.ids, restoreDefaultHomeworkRule, '删除智阅作业规则并恢复默认', row.label); },
              });
            } : undefined}
            onSettings={row => {
              setSettingsGrades(null);
              if (tab === "homework") { setSettingsGrades(rows.filter(item => item.ids.some(id => row.ids.includes(id))).map(item => item.grade!)); openEditor(row.ids, row.label, undefined, undefined, [row.label]); }
              else if (tab === "world") openWorldEditor(row.ids, row.label);
              else openLockAction(row.ids, row.label);
            }}
            onBatchSettings={() => {
              if (tab === "homework") openEditor(targetIds, targetLabel, undefined, undefined, selectedObjectNames);
              else if (tab === "world") openWorldEditor(targetIds, selectedObjectNames.join("、"));
              else openLockAction(targetIds, selectedObjectNames.join("、"));
            }} lockState={temporaryState} lockAction={lockActionLabel}
            emptyTitle={listEmpty ? emptyState?.title : undefined} emptyDescription={listEmpty ? emptyState?.description : undefined} />}
          {message && <ControlToast duration={demoScenario && (exception === "conflict" || exception === "scope-changed" || exception === "save-failed") ? 12000 : undefined} message={message.text} tone={message.tone} onClose={() => setMessage(null)} />}
          </>}
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
          scopeChanged={!!editor.originalIds && (editor.originalIds.length !== editor.ids.length || editor.originalIds.some(id => !editor.ids.includes(id)))}
          defaultHomeworkRule={tab === 'homework' && !editor.originalIds?.length && editor.ids.length > 0 && editor.ids.every(id => usesDefaultHomeworkRule(controls[id]))}
          scopeSelector={settingsGradeSelector}
          initialApplyScope={(exception === "save-failed" || exception === "conflict") ? "all" : undefined}
          key={`${tab}-${editor.schedule?.id ?? "permissions"}`}
          targetLabel={editor.label}
          count={editor.ids.length}
          selectedObjects={editor.selectedObjects}
          schedule={editor.schedule}
          homework={
            (batchMode || settingsGrades !== null) && tab === "homework" && !editor.originalIds?.length ? { answer: false, explanation: false } : !editor.schedule && !mixed(editor.ids)
              ? controls[editor.ids[0]]
              : undefined
          }
          batchDefaults={(batchMode || settingsGrades !== null) && tab === "homework"}
          requireApplyScope={settingsGrades !== null || editor.requireApplyScope}
          onClose={() => setEditor(null)}
          onSave={saveEditor}
        />
      )}
      {durationOverview && !durationEditor && tab === "duration" && <DurationRulesDrawer ids={durationOverview.ids} label={durationOverview.label} global={durationOverview.global}
        groupLabel={group => actualScope(group.ids)}
        groups={durationOverview.global ? rows.flatMap(row => schoolDurationGroups(row.ids, schoolDurationPolicies[deviceControlStudents.find(student => row.ids.includes(student.id))?.grade ?? ""] ?? []).filter(group => !group.fallback).map(group => ({ ...group, key: `${row.grade}-${group.key}` }))) : schoolDurationGroups(durationOverview.ids, schoolDurationPolicies[deviceControlStudents.find(student => durationOverview.ids.includes(student.id))?.grade ?? ""] ?? [])}
        onClose={() => setDurationOverview(null)} onAdd={() => { if (durationOverview.global) { setSettingsGrades([]); openDurationEditor([], '请选择年级'); } else { setSettingsGrades(null); openDurationEditor(durationOverview.ids, durationOverview.label); } }}
        onEdit={group => { setSettingsGrades(null); openDurationEditor(group.ids, actualScope(group.ids), group.rule); }} onDelete={group => requestDurationDelete(group, actualScope(group.ids))} />}
      {durationEditor && <DurationRuleEditor
        scopeChanged={!!durationEditor.originalIds && (durationEditor.originalIds.length !== durationEditor.ids.length || durationEditor.originalIds.some(id => !durationEditor.ids.includes(id)))}
        creating={!durationEditor.originalRule && !durationEditor.isDefault}
        noAvailableGrades={!durationEditor.originalRule && settingsGrades !== null && rows.length > 0 && rows.every(row => occupiedSchoolDurationDays(schoolDurationPolicies, deviceControlStudents, row.ids).length > 0)}
        scopeSelector={settingsGradeSelector}
        backToList={!!durationOverview}
        conflictHint={durationConflictHint ? `${durationConflictHint}，请取消相应年级，或返回编辑已有规则。` : undefined}
        initialApplyScope={(exception === "save-failed" || exception === "conflict") ? "all" : undefined}
        key={durationEditor.rule.id}
        label={durationEditor.label}
        count={durationEditor.ids.length}
        selectedObjects={durationEditor.selectedObjects}
        rule={durationEditor.rule}
        blockedWeekdays={durationEditor.isDefault ? [] : occupiedSchoolDurationDays(schoolDurationPolicies, deviceControlStudents, durationEditor.ids, durationEditor.originalRule)}
        defaultRule={defaultDuration}
        isDefault={durationEditor.isDefault}
        requireApplyScope={!durationEditor.isDefault}
        onClose={() => setDurationEditor(null)}
        onSave={saveDurationRule}
      />}
      {lockEditor && <TemporaryLockEditor label={lockEditor.label} selectedObjects={lockEditor.label.startsWith("已选") ? selectedObjectNames : undefined} count={lockEditor.ids.length} lockClassNames={affectedLockClassNames(lockEditor.ids, true)} unlockClassNames={affectedLockClassNames(lockEditor.ids, false)} lockedCount={lockEditor.ids.filter((studentId) => temporaryLockedIds.has(studentId)).length} schoolSessionActive={schoolTemporaryLockSession.active} state={temporaryState(lockEditor.ids)} onClose={() => setLockEditor(null)} onSave={(enabled) => requestTemporaryLock([{ key: "selection", label: lockEditor.label, ids: lockEditor.ids }], enabled, true)} />}
      {worldEditor && <WorldUsageEditor fixedValue={worldActionValue} scopeSelector={settingsGradeSelector} initialSelection={(exception === "save-failed" || exception === "conflict") ? { value: worldEditor.ids.some(id => !controls[id].world), scope: "all" } : undefined} label={worldEditor.label} selectedObjects={worldEditor.label.startsWith("已选") ? selectedObjectNames : undefined} total={worldEditor.ids.length} allowed={worldEditor.ids.filter((id) => controls[id].world).length} teacherTotal={worldEditor.ids.filter((id) => controls[id].worldSource === 'teacher').length} teacherAllowed={worldEditor.ids.filter((id) => controls[id].worldSource === 'teacher' && controls[id].world).length} onClose={() => { setWorldEditor(null); setWorldActionValue(undefined); }} onSave={(value, scope) => {
        if (hasConflict(worldEditor.ids, "world", worldEditor.baseSignatures)) return;
        const changedIds = worldEditor.ids.filter((id) => controls[id].world !== value && controls[id].worldSource !== 'teacher');
        if (!changedIds.length) return;
        const state = value ? "允许使用" : "禁止使用";
        writeControls(changedIds, (control) => ({ ...control, world: value, worldSource: 'school' }), `${state}万象视界`, worldEditor.label);
        setMessage({ text: value ? "已恢复使用万象视界" : "已停止使用万象视界", tone: "success" });
      }} />}
      {confirmation && tab === 'lock' && <DeviceControlLayer variant="dialog" labelId="lock-confirm-title" level={2} onClose={() => setConfirmation(null)}>{close => <>
        <header className="flex items-center justify-between border-b p-6"><h2 id="lock-confirm-title" className="text-xl font-bold text-slate-900">{confirmation.title}</h2><button type="button" aria-label="关闭锁屏确认" onClick={close}><X size={20} /></button></header>
        <div className="dc-panel-body space-y-4"><span className="dc-confirm-icon" data-danger={confirmation.danger === true}>{confirmation.danger ? <LockKeyhole size={21} /> : <ShieldCheck size={21} />}</span>
          <div className="dc-confirm-scope"><p>影响范围：{confirmation.scope}</p></div>
          <p className="dc-confirm-description">{confirmation.description}</p>
          {confirmation.warning && <div className="dc-confirm-warning">{confirmation.warning}</div>}
          {confirmation.resultPreview && <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-sm leading-6 text-slate-700">{confirmation.resultPreview}</div>}
        </div><footer className="dc-confirm-footer"><button type="button" data-autofocus onClick={close} className={button}>取消</button><button type="button" onClick={() => { confirmation.run(); close(); }} className={confirmation.danger ? 'dc-btn-danger' : primary}>{confirmation.action}</button></footer>
      </>}</DeviceControlLayer>}
      {confirmation && tab !== 'lock' && (
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
