import React, { useEffect, useState } from 'react';
import { ArrowLeft, ChevronRight, History, X } from 'lucide-react';
import { TeacherPortalUser } from '../data/teacherAccess';
import type { ControlExceptionDemo } from '../data/controlExceptionDemo';
import { schoolDeviceClasses } from '../data/schoolDeviceClasses';
import { BorrowSchedule, borrowScheduleStatus, deviceControlStudents, newBorrowSchedule, scheduleDateText, schedulePeriodText, schedulesConflict } from '../data/hierarchicalDeviceControl';
import { BorrowingState, borrowingListSummary, borrowingStorageKey, classTemporarilyDenied, initialBorrowingState, readBorrowingState, saveClassBorrowingRule, setTemporaryBorrowing } from '../data/borrowingControl';
import { StudentControlEditor } from './StudentControlEditor';
import { DeviceControlLayer } from './DeviceControlLayer';
import { ControlToast } from './ControlToast';
import './SchoolBorrowingControl.css';

type Scope = { label: string; classIds: string[] };
type Editing = Scope & { rule: BorrowSchedule; editingId?: string; revision: number };
type Confirm = { title: string; scope: Scope; description: string; revision: number; change: (state: BorrowingState) => BorrowingState; summary: (state: BorrowingState) => string[]; closeEditor?: boolean };
const allClasses = schoolDeviceClasses.map(group => group.id);
const scopeNames = (ids: string[]) => {
  const selected = new Set(ids);
  return [...new Set(schoolDeviceClasses.map(group => group.grade))].flatMap(grade => {
    const classes = schoolDeviceClasses.filter(group => group.grade === grade);
    const included = classes.filter(group => selected.has(group.id));
    return included.length === classes.length
      ? [classes[0].name.split('年级')[0] + '年级']
      : included.map(group => group.name);
  });
};
const studentCount = (ids: string[]) => deviceControlStudents.filter(student => ids.includes(student.classId)).length;
const ruleText = (rule: BorrowSchedule) => `${scheduleDateText(rule)} · ${schedulePeriodText(rule)}`;
const ruleSummary = (state: BorrowingState, ids: string[]) => [...new Set(ids.flatMap(id => (state.classRules[id] ?? []).map(ruleText)))];
const temporarySummary = (state: BorrowingState, ids: string[]) => ids.map(id => `${scopeNames([id])[0]}：${classTemporarilyDenied(state, id) ? '临时禁止借用' : '未开启临时禁借'}`);

export const SchoolBorrowingControl: React.FC<{ currentUser: TeacherPortalUser; demoScenario?: ControlExceptionDemo; initialGrade?: number | null; onGradeChange?: (grade: number | null) => void }> = ({ currentUser, demoScenario, initialGrade = null, onGradeChange }) => {
  const [exception, setException] = useState(demoScenario?.kind);
  const [loadError, setLoadError] = useState(false);
  const [state, setState] = useState<BorrowingState>(() => {
    try { return readBorrowingState(currentUser.schoolId); } catch { return initialBorrowingState(); }
  });
  const [grade, setGrade] = useState<number | null>(demoScenario?.kind === 'no-classes' || demoScenario?.kind === 'no-students' ? 7 : initialGrade);
  const [mode, setMode] = useState<BorrowSchedule['mode']>('weekly');
  const [batch, setBatch] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [overview, setOverview] = useState<Scope | null>(null);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [history, setHistory] = useState(false);
  const [notice, setNotice] = useState<{ text: string; tone: 'success' | 'error' | 'warning' } | null>(null);
  const [now, setNow] = useState(() => new Date());
  const refresh = () => { try { setState(readBorrowingState(currentUser.schoolId)); setLoadError(false); } catch { setLoadError(true); } };
  useEffect(() => {
    refresh();
    const sync = (event: StorageEvent) => { if (event.key === borrowingStorageKey(currentUser.schoolId)) refresh(); };
    const timer = setInterval(() => setNow(new Date()), 30000);
    window.addEventListener('storage', sync);
    window.addEventListener('focus', refresh);
    return () => { clearInterval(timer); window.removeEventListener('storage', sync); window.removeEventListener('focus', refresh); };
  }, [currentUser.schoolId]);
  const classes = schoolDeviceClasses.filter(group => grade === null || group.grade === grade);
  const empty = exception === 'no-grades' || exception === 'no-classes' || exception === 'no-students';
  const scope: Scope = { label: grade === null ? '全校' : `${grade}年级`, classIds: classes.map(group => group.id) };
  const rows: (Scope & { id: string; grade?: number })[] = grade === null
    ? [...new Set(schoolDeviceClasses.map(group => group.grade))].map(value => ({ id: `grade-${value}`, grade: value, label: `${value}年级`, classIds: schoolDeviceClasses.filter(group => group.grade === value).map(group => group.id) }))
    : classes.map(group => ({ id: group.id, label: group.name, classIds: [group.id] }));
  if (empty) rows.length = 0;
  const selectedRows = rows.filter(row => selected.includes(row.id));
  const target: Scope = { label: selectedRows.map(row => row.label).join('、'), classIds: selectedRows.flatMap(row => row.classIds) };
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pages);
  const visible = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const deniedCount = (ids: string[]) => ids.filter(id => classTemporarilyDenied(state, id)).length;
  const tempLabel = (ids: string[]) => deniedCount(ids) === ids.length ? '已禁止借用' : deniedCount(ids) ? '部分禁止借用' : '未开启临时禁借';
  const go = (value: number | null) => { setGrade(value); onGradeChange?.(value); setSelected([]); setBatch(false); setPage(1); };
  const askTemporary = (targetScope: Scope, enabled: boolean, schoolAction = false) => {
    setConfirm({ title: enabled ? '确认临时禁止借用？' : schoolAction ? '确认结束全校临时禁借？' : '确认解除临时禁借？', scope: targetScope, revision: state.revision,
      description: enabled ? '所选范围停止新借出，受影响班级的班主任暂时无法修改借用状态。已有借用规则和学生禁借保留。'
        : '解除临时禁借后，按当前有效的借用规则执行，保留已有的学生禁借。对应班级的班主任恢复借用管控。',
      change: current => setTemporaryBorrowing(current, targetScope.classIds, enabled, schoolAction),
      summary: current => temporarySummary(current, targetScope.classIds),
    });
  };
  const openRule = (targetScope: Scope, rule = newBorrowSchedule(mode), editingId?: string) => {
    if (rule.mode === 'dates' && editingId && borrowScheduleStatus(rule) === '已失效') return;
    setEditing({ ...targetScope, label: targetScope.classIds.length === allClasses.length ? '全校' : scopeNames(targetScope.classIds).join('、'), rule, editingId, revision: state.revision });
  };
  const saveRule = (rule: BorrowSchedule) => {
    if (!editing) return;
    const conflicts = editing.classIds.filter(id => (state.classRules[id] ?? []).some(previous => previous.id !== editing.editingId && schedulesConflict(previous, rule))).length;
    setConfirm({ title: conflicts ? '确认覆盖借用规则？' : '确认保存借用规则？', scope: editing, revision: editing.revision,
      description: `${ruleText(rule)}。${conflicts ? `其中 ${conflicts} 个班级已有同类规则，将覆盖重叠日期，未重叠日期保留。` : '规则将应用到所选范围。'}${rule.mode === 'weekly' ? '每周规则仅允许在所选星期和时段借用；其他已设规则继续保留，指定日期规则优先。' : '每周与日期规则分别保留。'}不改变临时禁借及学生禁借。`,
      change: current => saveClassBorrowingRule(current, editing.classIds, rule, editing.editingId),
      summary: current => ruleSummary(current, editing.classIds), closeEditor: true });
  };
  const deleteRule = (targetScope: Scope, rule: BorrowSchedule) => {
    const unrestricted = targetScope.classIds.filter(id => !(state.classRules[id] ?? []).some(item => item.id !== rule.id));
    const warning = unrestricted.length === targetScope.classIds.length ? '这是所选班级的最后一条规则。删除后默认随时可借，已禁借的学生除外。' : unrestricted.length ? `删除后，${scopeNames(unrestricted).join('、')}将没有借用规则，默认随时可借，已禁借的学生除外；其他班级按剩余规则执行。` : '删除后按剩余规则执行；没有当天有效的日期规则且未设置每周规则时，默认可借用。';
    setConfirm({ title: '确认删除借用规则？', scope: targetScope, revision: state.revision,
    description: `${ruleText(rule)}。${warning}`,
    change: current => ({ ...current, classRules: { ...current.classRules, ...Object.fromEntries(targetScope.classIds.map(id => [id, (current.classRules[id] ?? []).filter(item => item.id !== rule.id)])) } }),
    summary: current => ruleSummary(current, targetScope.classIds) });
  };
  const commit = () => {
    if (!confirm || currentUser.role !== 'school-admin') return;
    if (exception === 'save-failed') { setNotice({ text: '保存失败，请检查网络或稍后重试。已填写的内容已保留。', tone: 'error' }); return; }
    if (exception === 'scope-changed' || exception === 'conflict') {
      setConfirm(null); setEditing(null); setSelected([]); refresh();
      setNotice({ text: exception === 'scope-changed' ? '所选范围的学生或班级已变化，请重新选择后再设置。' : '相关设置已被其他人修改，本次未保存，请重新设置。', tone: 'warning' }); return;
    }
    try {
      const current = readBorrowingState(currentUser.schoolId);
      if (current.revision !== confirm.revision) {
        setState(current); setConfirm(null); setEditing(null);
        setNotice({ text: '相关设置已被其他人修改，本次未保存，请重新设置。', tone: 'warning' }); return;
      }
      const next = confirm.change(current);
      const record = { id: crypto.randomUUID(), at: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false }), operator: `${currentUser.name}${currentUser.phone ? `（${currentUser.phone}）` : ''}`, title: confirm.title.replace('确认', '').replace('？', ''), scope: confirm.scope.label, classIds: confirm.scope.classIds, before: confirm.summary(current), after: confirm.summary(next) };
      const saved = { ...next, revision: current.revision + 1, history: [record, ...current.history].slice(0, 100) };
      localStorage.setItem(borrowingStorageKey(currentUser.schoolId), JSON.stringify(saved));
      setState(saved); setConfirm(null); if (confirm.closeEditor) setEditing(null);
      setNotice({ text: '借用管控设置已生效', tone: 'success' });
    } catch { setNotice({ text: '保存失败，请稍后重试。已填写的内容已保留。', tone: 'error' }); }
  };
  const ruleGroups = (targetScope: Scope) => {
    const groups = new Map<string, { rule: BorrowSchedule; classIds: string[] }>();
    targetScope.classIds.forEach(id => (state.classRules[id] ?? []).filter(rule => rule.mode === mode).forEach(rule => {
      const key = JSON.stringify(rule);
      const group = groups.get(key) ?? { rule, classIds: [] }; group.classIds.push(id); groups.set(key, group);
    }));
    return [...groups.values()];
  };
  const temporaryActions = (targetScope: Scope) => <>
    {deniedCount(targetScope.classIds) < targetScope.classIds.length && <button disabled={empty} className="dc-btn" onClick={() => askTemporary(targetScope, true)}>临时禁止借用</button>}
    {deniedCount(targetScope.classIds) > 0 && <button disabled={empty} className="dc-btn" onClick={() => askTemporary(targetScope, false)}>解除临时禁借</button>}
  </>;
  if (currentUser.role !== 'school-admin') return <p className="p-6">无权限查看学校借用管控。</p>;
  if (loadError || exception === 'load-failed') return <div className="dc-list-card p-8 text-center"><p>借用管控加载失败，请重试。</p><button className="dc-btn mt-4" onClick={() => { setException(undefined); refresh(); }}>重新加载</button></div>;
  return <>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <nav className="flex items-center gap-3 text-sm" aria-label="借用管控层级"><button className="font-bold text-indigo-600" onClick={() => go(null)}>{grade !== null && <ArrowLeft size={15} className="mr-2 inline" />}全校</button>{grade !== null && <><ChevronRight size={15} /><span>{grade}年级</span></>}</nav>
      <button className="dc-btn" onClick={() => setHistory(true)}><History size={15} />操作记录</button>
    </div>
    <section className="dc-scope-card">
      <div className="flex flex-wrap items-center justify-between gap-4"><div className="dc-scope-heading"><h2>{scope.label} · 柜机借用管控</h2><p className="mt-2">{grade === null && state.schoolTemporaryActive ? `全校临时禁借管控中${deniedCount(allClasses) < allClasses.length ? '，部分班级已单独解除' : ''}` : tempLabel(scope.classIds)}</p></div>
        <div className="flex flex-wrap gap-2">{grade === null ? <button disabled={empty} className="dc-btn-primary" onClick={() => askTemporary(scope, !state.schoolTemporaryActive, true)}>{state.schoolTemporaryActive ? '结束全校临时禁借' : '全校临时禁止借用'}</button> : temporaryActions(scope)}</div>
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-500">未设置借用时间，默认随时可借；设置后按规定时间借用。被学校或班主任禁借的学生除外。</p>
      <p className="mt-3 text-sm leading-6 text-slate-500">解除学校临时禁借后，按当前借用安排执行；班主任设置的禁借仍需班主任解除。</p>
    </section>
    <section className="borrow-rules-section" aria-label={`${scope.label}借用规则`}>
      <nav className="borrow-raised-tabs" aria-label="借用规则类型" role="tablist">
        {(['weekly', 'dates'] as const).map(value => (
          <button key={value} id={`borrow-rule-tab-${value}`} type="button" role="tab"
            aria-selected={value === mode} aria-controls="borrow-rules-panel"
            onClick={() => setMode(value)}>
            {value === 'weekly' ? '每周固定借用规则' : '指定日期借用规则'}
          </button>
        ))}
      </nav>
      <div id="borrow-rules-panel" role="tabpanel" aria-labelledby={`borrow-rule-tab-${mode}`} className="borrow-rules-panel">
        <div className="borrow-rules-heading">
          <div>
            <h3>{scope.label}借用规则</h3>
            <p>{mode === 'weekly' ? '查看和设置每周固定的借用安排。' : '指定日期规则优先于每周规则；到期或删除后，按仍有效的日期规则或每周规则执行。'}</p>
          </div>
          <button disabled={empty} className="dc-btn-primary" onClick={() => openRule(scope)}>
            {mode === 'weekly' ? '新增每周规则' : '新增日期规则'}
          </button>
        </div>
        <div className="borrow-inline-rules">
          {!empty && ruleGroups(scope).map(({ rule, classIds }) => (
            <article className="borrow-inline-rule" key={`${rule.id}-${classIds.join()}`}>
              <div className="borrow-inline-rule-content">
                <div className="borrow-inline-rule-title">
                  <h4>{scheduleDateText(rule)}</h4>
                  {rule.mode === 'dates' && <span className="borrow-rule-status" data-status={borrowScheduleStatus(rule, now)}>{borrowScheduleStatus(rule, now)}</span>}
                </div>
                <p className="borrow-rule-period">{schedulePeriodText(rule)}</p>
                <p className="borrow-rule-scope">适用范围：{classIds.length === scope.classIds.length ? scope.label : scopeNames(classIds).join('、')}</p>
              </div>
              <div className="borrow-inline-rule-actions">
                {(rule.mode !== 'dates' || borrowScheduleStatus(rule, now) !== '已失效') && <button className="dc-btn" onClick={() => openRule({ label: classIds.length === scope.classIds.length ? scope.label : scopeNames(classIds).join('、'), classIds }, rule, rule.id)}>编辑</button>}
                <button className="dc-btn" onClick={() => deleteRule({ label: classIds.length === scope.classIds.length ? scope.label : scopeNames(classIds).join('、'), classIds }, rule)}>删除</button>
              </div>
            </article>
          ))}
          {(empty || !ruleGroups(scope).length) && <div className="borrow-rules-empty">尚未设置{mode === 'weekly' ? '每周固定' : '指定日期'}借用规则</div>}
        </div>
      </div>
    </section>
    <section className="dc-list-card overflow-hidden">
      <div className="dc-list-heading flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-bold">{grade === null ? '年级' : '班级'}列表</h3>
        <button disabled={empty} className="dc-btn" onClick={() => { setBatch(!batch); setSelected([]); }}>{batch ? '退出批量操作' : '批量操作'}</button>
      </div>
      {batch && <div className="flex flex-wrap items-center gap-3 border-t bg-indigo-50 px-5 py-3"><span className="text-sm">已选 {selected.length} 个{grade === null ? '年级' : '班级'} · {studentCount(target.classIds)} 名学生</span><button disabled={!selected.length} className="dc-btn" onClick={() => openRule(target)}>设置借用规则</button><button disabled={!selected.length || deniedCount(target.classIds) === target.classIds.length} className="dc-btn" onClick={() => askTemporary(target, true)}>临时禁止借用</button><button disabled={!selected.length || !deniedCount(target.classIds)} className="dc-btn" onClick={() => askTemporary(target, false)}>解除临时禁借</button></div>}
      <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="border-y bg-slate-50 text-slate-500"><tr>{batch && <th className="p-4"><input type="checkbox" aria-label="本页全选" checked={visible.length > 0 && visible.every(row => selected.includes(row.id))} onChange={event => setSelected(event.target.checked ? [...new Set([...selected, ...visible.map(row => row.id)])] : selected.filter(id => !visible.some(row => row.id === id)))} /></th>}<th className="p-4">{grade === null ? '年级' : '班级'}</th><th className="p-4">借用规则</th><th className="p-4">临时禁借状态</th><th className="p-4">说明</th><th className="p-4">最后操作人</th><th className="p-4">操作时间</th><th className="p-4">操作</th></tr></thead><tbody>
        {empty && <tr><td colSpan={batch ? 8 : 7} className="p-12 text-center text-slate-500">{exception === 'no-grades' ? '学校暂无年级，请先完善年级信息。' : exception === 'no-classes' ? '该年级暂无班级，请先添加班级。' : '该班级暂无学生，请先添加学生。'}</td></tr>}{visible.map(row => { const summary = borrowingListSummary(state, row.classIds, mode); const last = state.history.find(record => record.classIds?.some(id => row.classIds.includes(id))); return <tr key={row.id} className="border-b border-slate-100">{batch && <td className="p-4"><input type="checkbox" aria-label={`选择${row.label}`} checked={selected.includes(row.id)} onChange={() => setSelected(selected.includes(row.id) ? selected.filter(id => id !== row.id) : [...selected, row.id])} /></td>}<td className="p-4 font-bold">{row.grade !== undefined ? <button className="inline-flex items-center gap-2 text-indigo-600" onClick={() => go(row.grade!)}>{row.label}<ChevronRight size={15} /></button> : row.label}</td><td className="max-w-xs p-4">{summary.rules.length ? summary.rules.map((rule, index) => <p key={index} className="text-xs leading-5 text-slate-500">{ruleText(rule)}</p>) : '—'}</td><td className="p-4"><span className={`rounded-md px-2 py-1 text-xs font-bold ${deniedCount(row.classIds) ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-600'}`}>{tempLabel(row.classIds)}</span></td><td className="p-4 text-xs leading-5 text-slate-500">{summary.note}</td><td className="max-w-40 p-4 text-xs leading-6 text-slate-500">{last?.operator ?? '—'}</td><td className="p-4 text-xs leading-6 text-slate-500">{last?.at ?? '—'}</td><td className="p-4"><div className="flex flex-wrap gap-2"><button className="dc-btn" onClick={() => setOverview(row)}>设置规则</button>{temporaryActions(row)}</div></td></tr>; })}
      </tbody></table></div>
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm text-slate-500"><span>共 {rows.length} 个{grade === null ? '年级' : '班级'}</span><div className="flex items-center gap-3"><select aria-label="每页条数" value={pageSize} onChange={event => { setPageSize(Number(event.target.value)); setPage(1); }}>{[10, 20, 40].map(value => <option key={value} value={value}>{value}条/页</option>)}</select><button className="dc-btn" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>上一页</button><span>{currentPage} / {pages}</span><button className="dc-btn" disabled={currentPage === pages} onClick={() => setPage(currentPage + 1)}>下一页</button></div></div>
    </section>
    {overview && <DeviceControlLayer labelId="borrow-overview" onClose={() => setOverview(null)}>{close => <><header className="flex items-center justify-between border-b p-6"><h2 id="borrow-overview" className="text-xl font-bold">设置规则 · {overview.label} · {mode === 'weekly' ? '每周借用规则' : '指定日期规则'}</h2><button aria-label="关闭规则列表" onClick={close}><X size={20} /></button></header><div className="dc-panel-body space-y-4"><p className="text-sm text-slate-500">当前所选对象的原配置，可编辑、删除或新增规则。</p>{ruleGroups(overview).map(({ rule, classIds }) => <section key={`${rule.id}-${classIds.join()}`} className="rounded-xl border p-4"><h3 className="font-bold">{scheduleDateText(rule)}</h3><p className="mt-2 text-sm">{schedulePeriodText(rule)}</p>{rule.mode === 'dates' && <p className="mt-2 text-sm text-indigo-600">{borrowScheduleStatus(rule, now)}</p>}<p className="mt-3 text-xs leading-6 text-slate-500">{scopeNames(classIds).join('、')}</p><div className="mt-3 flex gap-2">{(rule.mode !== 'dates' || borrowScheduleStatus(rule, now) !== '已失效') && <button className="dc-btn" onClick={() => openRule({ label: scopeNames(classIds).join('、'), classIds }, rule, rule.id)}>编辑</button>}<button className="dc-btn" onClick={() => deleteRule({ label: scopeNames(classIds).join('、'), classIds }, rule)}>删除</button></div></section>)}{!ruleGroups(overview).length && <p className="py-12 text-center text-slate-500">尚未设置借用规则</p>}</div><footer className="border-t p-5"><button className="dc-btn-primary" onClick={() => openRule(overview)}>新增借用规则</button></footer></>}</DeviceControlLayer>}
    {editing && <StudentControlEditor key={`${editing.rule.id}-${editing.revision}`} targetLabel={editing.label} count={studentCount(editing.classIds)} selectedObjects={scopeNames(editing.classIds)} schedule={editing.rule} onClose={() => setEditing(null)} onSave={value => { if (value.schedule) saveRule(value.schedule); }} />}
    {confirm && <DeviceControlLayer labelId="borrow-confirm" variant="dialog" level={3} onClose={() => setConfirm(null)}>{close => <><header className="border-b p-6"><h2 id="borrow-confirm" className="text-xl font-bold">{confirm.title}</h2></header><div className="dc-panel-body space-y-4"><p className="font-bold text-indigo-700">{confirm.scope.label}</p><p className="text-sm text-slate-500">影响 {studentCount(confirm.scope.classIds)} 名学生</p><p className="text-sm leading-7">{confirm.description}</p></div><footer className="flex justify-end gap-3 border-t p-5"><button className="dc-btn" onClick={close}>取消</button><button className="dc-btn-primary" onClick={commit}>确认并生效</button></footer></>}</DeviceControlLayer>}
    {history && <DeviceControlLayer labelId="borrow-history" onClose={() => setHistory(false)}>{close => <><header className="flex items-center justify-between border-b p-6"><h2 id="borrow-history" className="text-xl font-bold">借用管控操作记录</h2><button aria-label="关闭操作记录" onClick={close}><X size={20} /></button></header><div className="dc-panel-body space-y-4"><p className="text-xs text-slate-500">仅记录教师端学校管理员的操作，每个模块显示近100条记录。</p>{state.history.map(record => <section key={record.id} className="rounded-xl border p-4"><h3 className="font-bold">{record.title}</h3><p className="mt-2 text-sm">操作对象：{record.scope || '未记录'}</p><p className="mt-2 text-xs text-slate-500">{record.operator} · {record.at}</p><details className="mt-3 text-sm"><summary>查看修改前后</summary><p className="mt-2 whitespace-pre-line">修改前：{record.before.join('\n') || '无规则'}</p><p className="mt-2 whitespace-pre-line">修改后：{record.after.join('\n') || '无规则'}</p></details></section>)}{!state.history.length && <p className="py-10 text-center text-slate-500">暂无操作记录</p>}</div></>}</DeviceControlLayer>}
    {notice && <ControlToast message={notice.text} tone={notice.tone} onClose={() => setNotice(null)} />}
  </>;
};
