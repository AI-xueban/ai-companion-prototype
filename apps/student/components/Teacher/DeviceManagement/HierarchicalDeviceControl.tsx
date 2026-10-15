import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowLeftRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock,
  Info,
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
  DeviceStudent,
  deviceControlStudents,
  initialStudentControls,
  mergeBorrowSchedule,
  newBorrowSchedule,
  policySignature,
  scheduleDateText,
  schedulePeriodText,
  schedulesConflict,
  StudentControl,
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
import "./DeviceControl.css";

const tabs = [
  { id: "borrowing", label: "借用管控", icon: Clock },
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
};
type Confirmation = {
  title: string;
  scope: string;
  count: number;
  description: string;
  warning?: string;
  action: string;
  danger?: boolean;
  run: () => void;
};
const button = "dc-btn";
const primary = "dc-btn-primary";
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
  const [controls, setControls] = useState(initialStudentControls);
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
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null);
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
  const currentStudents = deviceControlStudents.filter((s) =>
    classId ? s.classId === classId : grade ? s.grade === grade : true,
  );
  const scopeLabel = classId
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
  ) => {
    const at = new Date().toLocaleString("zh-CN", { hour12: false });
    setControls((current) => {
      const next = { ...current };
      ids.forEach((id) => {
        next[id] = {
          ...apply(current[id]),
          updated: { ...current[id].updated, [tab]: { by: operatorLabel, at } },
        };
      });
      return next;
    });
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
    });
  };
  const saveEditor = (value: ControlEditorValue) => {
    if (!editor) return;
    const { ids, label, editingId } = editor;
    const schedule = value.schedule;
    const conflicts = schedule
      ? ids.filter((id) =>
          controls[id].schedules.some(
            (s) => s.id !== editingId && schedulesConflict(s, schedule),
          ),
        )
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
          ? `${conflicts.length} 名学生在所选日期已有同类借用规则，将覆盖重叠日期，其他日期保留。`
          : "新借用规则将应用到所选学生。每周借用规则与指定日期借用规则分别保留。"
        : "将统一设置所选学生的权限，覆盖此前的单独设置。",
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
        })),
    });
  };
  const requestBorrowSwitch = () =>
    setConfirmation({
      title: `确认${borrowing ? "关闭" : "开启"}全校借用管控？`,
      scope: "全校",
      count: deviceControlStudents.length,
      description: borrowing
        ? "关闭后全校不受借用时间限制，所有学生的借用规则保留。"
        : "开启后仅允许在已配置的时段借用；没有有效借用规则的学生将无法借用。",
      action: `确认${borrowing ? "关闭" : "开启"}并生效`,
      run: () => {
        setBorrowing(!borrowing);
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
        })),
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
        })),
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
        })),
    });
  const switchChecked =
    tab === "borrowing"
      ? borrowing
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
        : !grade && tab === "borrowing"
          ? borrowing
            ? "全校借用管控已开启"
            : "全校借用管控已关闭"
          : scopeStatus.main;
  const globalActionValues =
    tab === "borrowing"
      ? [!borrowing]
      : switchChecked
        ? [false]
        : scopeStatus.active
          ? [true, false]
          : [true];
  const globalActionLabel = (value: boolean) =>
    tab === "borrowing"
      ? value
        ? "开启借用管控"
        : "关闭借用管控"
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

  return (
    <div className="dc-page flex h-full flex-col">
      <header className="dc-header shrink-0 border-b bg-white">
        <h1 className="text-2xl font-black text-slate-900">全校设备管控</h1>
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
      </header>
      <div
        role="tabpanel"
        id={`control-panel-${tab}`}
        aria-labelledby={`control-tab-${tab}`}
        className="dc-workspace min-h-0 flex-1 overflow-y-auto"
      >
        <div className="dc-content mx-auto space-y-5">
          <div className="dc-breadcrumb flex flex-wrap items-center gap-4">
            {grade && (
              <button
                type="button"
                onClick={() =>
                  classId ? navigate(grade, null) : navigate(null, null)
                }
                className="dc-btn"
              >
                <ArrowLeft size={17} />
                {classId ? "返回班级列表" : "返回全校"}
              </button>
            )}
            <nav
              aria-label="管控层级"
              className="flex items-center gap-2 text-sm"
            >
              <button
                type="button"
                onClick={() => navigate(null, null)}
                className={
                  grade
                    ? "font-bold text-indigo-600"
                    : "font-bold text-slate-900"
                }
              >
                全校
              </button>
              {grade && (
                <>
                  <ChevronRight size={15} className="text-slate-400" />
                  <button
                    type="button"
                    onClick={() => navigate(grade, null)}
                    className={
                      classId
                        ? "font-bold text-indigo-600"
                        : "font-bold text-slate-900"
                    }
                  >
                    {grade}年级
                  </button>
                </>
              )}
              {classId && (
                <>
                  <ChevronRight size={15} className="text-slate-400" />
                  <span className="font-bold text-slate-900">
                    {labelClass(classId)}
                  </span>
                </>
              )}
            </nav>
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
                    {tab === "borrowing"
                      ? borrowing
                        ? "仅可在允许时段借用；指定日期内优先执行指定日期规则，到期或删除后恢复每周固定规则。"
                        : "全校不限借用时间，已有借用规则保留。"
                      : tab === "homework"
                        ? "设置学生查看答案、详解的权限，默认均不允许。"
                        : "以最新一次操作为准。"}
                    {grade && ` 当前 ${currentStudents.length} 名学生。`}
                  </p>
                </div>
              </div>
              {!grade && tab !== "homework" && (
                <div className="flex flex-wrap items-center gap-3">
                  {globalActionValues.map((value) => (
                  <button
                    type="button"
                    key={String(value)}
                    aria-label={globalActionLabel(value)}
                    onClick={() =>
                      tab === "borrowing"
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
          {(tab !== "borrowing" || borrowing) && (
          <section className="dc-list-card overflow-hidden">
            {tab === "borrowing" && (
              <nav
                role="tablist"
                aria-label="借用规则类型"
                className="dc-rule-tabs flex border-b border-slate-100"
              >
                {(["weekly", "dates"] as const).map((mode) => (
                  <button
                    type="button"
                    role="tab"
                    key={mode}
                    aria-selected={borrowMode === mode}
                    onClick={() => {
                      setBorrowMode(mode);
                      resetList();
                    }}
                    className={`border-b-2 px-1 py-4 text-sm font-bold ${borrowMode === mode ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-900"}`}
                  >
                    {mode === "weekly"
                      ? "每周固定借用规则"
                      : "指定日期借用规则"}
                  </button>
                ))}
              </nav>
            )}
            <div className="dc-list-heading flex flex-wrap items-center justify-between gap-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900">{rowType}列表</h3>
                <p className="mt-1 text-xs text-slate-500">
                  {tab === "borrowing" && borrowMode === "dates"
                    ? `指定日期规则优先，到期或删除后恢复每周规则。请先勾选${rowType}，再新增或删除。`
                    : classId
                      ? "点击学生查看详情，可单独修改。"
                      : `点击${rowType}名称进入下一级，勾选后可批量设置。`}
                </p>
              </div>
              <div className="dc-actions">
                {tab === "borrowing" ? (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        withSelected(() => openEditor(
                          targetIds,
                          targetLabel,
                          borrowMode,
                          undefined,
                          selectedObjectNames,
                        ))
                      }
                      className={primary}
                    >
                      {borrowMode === "weekly"
                        ? "新增每周借用规则"
                        : "新增指定日期借用规则"}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        withSelected(() => removeScopeSchedules(borrowMode))
                      }
                      className={button}
                    >
                      删除借用规则
                    </button>
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
                        所选对象 · {tab === "world"
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
                      <option value="same">配置一致</option>
                      <option value="mixed">配置存在差异</option>
                    </>
                  )}
                  <option value="active">
                    {tab === "borrowing"
                      ? "已设置借用规则"
                      : tab === "homework"
                        ? "有开放权限"
                        : tab === "world"
                          ? "有已开放学生"
                          : "有已锁屏学生"}
                  </option>
                  <option value="inactive">
                    {tab === "borrowing"
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
                          {tab === "borrowing" && !row.student && (
                            <button
                              type="button"
                              onClick={() => showBorrowOverview(row)}
                              className="dc-link whitespace-nowrap"
                            >
                              {mixed(row.ids) ? "查看差异" : "查看借用规则"}
                            </button>
                          )}
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
          borrowingEnabled={borrowing}
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
          onClose={() => setEditor(null)}
          onSave={saveEditor}
        />
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
                <p className="dc-confirm-warning">{confirmation.warning}</p>
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
