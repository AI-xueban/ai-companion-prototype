import React, { useMemo, useState } from "react";
import { ArrowLeft, Search, X } from "lucide-react";
import {
  BorrowSchedule,
  deviceControlStudents,
  schedulePeriodText,
  StudentControl,
} from "../data/hierarchicalDeviceControl";
import {
  borrowDateSummary,
  groupBorrowConfigurations,
} from "../data/borrowingOverview";
import { schoolDeviceClasses } from "../data/schoolDeviceClasses";
import { DeviceControlLayer } from "./DeviceControlLayer";

export const BorrowingOverviewDrawer: React.FC<{
  label: string;
  ids: string[];
  controls: Record<string, StudentControl>;
  mode: BorrowSchedule["mode"];
  onClose: () => void;
}> = ({ label, ids, controls, mode, onClose }) => {
  const groups = useMemo(
    () => groupBorrowConfigurations(ids, controls, mode),
    [ids, controls, mode],
  );
  const [groupKey, setGroupKey] = useState<string | null>(null);
  const [classId, setClassId] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const selectedGroup = groups.find((g) => g.key === groupKey);
  const groupName = (key: string) => {
    const index = groups.findIndex((g) => g.key === key);
    return !groups[index]?.schedules.length
      ? "未设置借用规则"
      : groups.length === 1
        ? "统一借用规则"
        : `借用规则 ${index + 1}`;
  };
  const members = useMemo(() => {
    const selectedIds = new Set(selectedGroup?.studentIds ?? []);
    return deviceControlStudents.filter((s) => selectedIds.has(s.id));
  }, [selectedGroup]);
  const memberClasses = schoolDeviceClasses.filter((c) =>
    members.some((s) => s.classId === c.id),
  );
  const filtered = members.filter(
    (s) =>
      (classId === "all" || s.classId === classId) &&
      `${s.name} ${s.number}`.includes(search.trim()),
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageRows = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );
  const openMembers = (key: string) => {
    setGroupKey(key);
    setClassId("all");
    setSearch("");
    setPage(1);
  };
  const heading = "px-4 py-3 text-left text-xs font-medium text-slate-500";
  const cell = "px-4 py-3 align-top text-sm text-slate-700";
  return (
    <DeviceControlLayer
      labelId="borrow-overview-title"
      size="wide"
      onClose={onClose}
    >
      {(close) => (
        <>
          <header className="flex items-center justify-between border-b border-slate-200 p-6">
            <div>
              <h2
                id="borrow-overview-title"
                className="text-xl font-bold text-slate-900"
              >
                {label} ·{" "}
                {mode === "weekly" ? "每周固定借用规则" : "指定日期借用规则"}
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                按学生当前实际借用规则分组 · 共 {ids.length} 人
              </p>
            </div>
            <button
              type="button"
              aria-label="关闭借用规则详情"
              onClick={close}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            >
              <X size={20} />
            </button>
          </header>
          <div className="dc-panel-body space-y-5">
            {selectedGroup ? (
              <>
                <button
                  type="button"
                  onClick={() => setGroupKey(null)}
                  className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-bold text-slate-700"
                >
                  <ArrowLeft size={17} />
                  返回借用规则分组
                </button>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-bold text-slate-900">
                    {groupName(selectedGroup.key)} · 学生名单
                  </h3>
                  <span className="text-sm text-slate-500">
                    共 {members.length} 人
                  </span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {memberClasses.length > 1 && (
                    <select
                      aria-label="差异学生班级"
                      value={classId}
                      onChange={(e) => {
                        setClassId(e.target.value);
                        setPage(1);
                      }}
                      className="rounded-lg border bg-white px-3 py-2 text-sm"
                    >
                      <option value="all">全部班级</option>
                      {memberClasses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  )}
                  <div className="relative">
                    <Search
                      size={15}
                      className="absolute left-3 top-3 text-slate-400"
                    />
                    <input
                      aria-label="搜索差异学生"
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                      }}
                      placeholder="搜索姓名或编号"
                      className="rounded-lg border py-2 pl-9 pr-3 text-sm"
                    />
                  </div>
                  {(classId !== "all" || search) && (
                    <button
                      type="button"
                      onClick={() => {
                        setClassId("all");
                        setSearch("");
                        setPage(1);
                      }}
                      className="text-sm text-indigo-600"
                    >
                      清空筛选
                    </button>
                  )}
                </div>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="dc-data-table text-left">
                    <thead className="bg-slate-50">
                      <tr>
                        {["序号", "编号", "姓名", "年级", "班级"].map(
                          (name) => (
                            <th key={name} className={heading}>
                              {name}
                            </th>
                          ),
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {pageRows.map((s, i) => (
                        <tr key={s.id} className="border-t border-slate-100">
                          <td className={cell}>
                            {(currentPage - 1) * pageSize + i + 1}
                          </td>
                          <td className={cell}>{s.number}</td>
                          <td className={cell}>{s.name}</td>
                          <td className={cell}>{s.grade}年级</td>
                          <td className={cell}>
                            {
                              schoolDeviceClasses.find(
                                (c) => c.id === s.classId,
                              )?.name
                            }
                          </td>
                        </tr>
                      ))}
                      {!pageRows.length && (
                        <tr>
                          <td
                            colSpan={5}
                            className="p-10 text-center text-sm text-slate-400"
                          >
                            没有符合条件的学生
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
                  <span>
                    共 {filtered.length} 人 · 第 {currentPage}/{pageCount} 页
                  </span>
                  <div className="flex items-center gap-2">
                    <select
                      aria-label="差异名单每页条数"
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setPage(1);
                      }}
                      className="rounded-lg border bg-white px-2 py-1.5"
                    >
                      {[10, 20, 40].map((n) => (
                        <option key={n} value={n}>
                          {n} 条/页
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
                    <button
                      type="button"
                      disabled={currentPage === pageCount}
                      onClick={() => setPage(currentPage + 1)}
                      className="rounded-lg border px-3 py-1.5 disabled:opacity-30"
                    >
                      下一页
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-bold text-slate-700">
                    {groups.length === 1
                      ? "全部学生配置一致"
                      : `共 ${groups.length} 组配置`}
                  </p>
                  <span className="text-xs text-slate-500">
                    不同仅表示借用规则不一致
                  </span>
                </div>
                {mode === "dates" && (
                  <p className="rounded-lg bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
                    指定日期借用规则优先生效，到期或删除后自动恢复每周固定借用规则。
                  </p>
                )}
                {groups.map((group) => (
                  <article
                    key={group.key}
                    className="dc-rule-card overflow-hidden rounded-xl border"
                  >
                    <header className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <h3 className="text-sm font-bold text-slate-900">
                          {groupName(group.key)}
                        </h3>
                        <span className="text-xs text-slate-500">
                          {group.studentIds.length}/{ids.length} 人
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => openMembers(group.key)}
                        className="text-sm font-bold text-indigo-600"
                      >
                        查看学生（{group.studentIds.length}人）
                      </button>
                    </header>
                    {group.schedules.length ? (
                      <div className="overflow-x-auto">
                        <table className="dc-data-table">
                          <thead>
                            <tr>
                              <th className={heading}>
                                {mode === "weekly" ? "适用星期" : "适用日期"}
                              </th>
                              {mode === "dates" && (
                                <th className={heading}>借用方式</th>
                              )}
                              <th className={heading}>借用时段</th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.schedules.map((s, index) => (
                              <tr
                                key={index}
                                className="border-t border-slate-100"
                              >
                                <td className={cell}>{borrowDateSummary(s)}</td>
                                {mode === "dates" && (
                                  <td className={cell}>
                                    {s.deny ? "全天禁止借用" : "按时段借用"}
                                  </td>
                                )}
                                <td className={cell}>
                                  {s.deny ? "—" : schedulePeriodText(s)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="px-4 py-5 text-sm leading-7 text-slate-500">
                        {mode === "weekly"
                          ? "未设置每周借用规则。借用管控开启且当天无指定日期借用规则时，不能借用。"
                          : "未设置指定日期借用规则，按每周固定借用规则执行。"}
                      </p>
                    )}
                  </article>
                ))}
              </>
            )}
          </div>
          <footer className="flex justify-end border-t border-slate-200 p-5">
            <button type="button" onClick={close} className="dc-btn">
              返回列表
            </button>
          </footer>
        </>
      )}
    </DeviceControlLayer>
  );
};
