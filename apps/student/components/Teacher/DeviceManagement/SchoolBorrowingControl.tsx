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
const gradeName = (grade: number) => {
  const name = schoolDeviceClasses.find(group => group.grade === grade)?.name;
  return name ? `${name.split('年级')[0]}年级` : `${grade}年级`;
};
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
const classNames = (ids: string[]) => schoolDeviceClasses.filter(group => ids.includes(group.id)).map(group => group.name);
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
  const [overview, setOverview] = useState<Scope | null>(null);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [temporaryChoice, setTemporaryChoice] = useState<Scope | null>(null);
  const [temporaryChoiceValue, setTemporaryChoiceValue] = useState<boolean | null>(null);
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
  const scope: Scope = { label: grade === null ? '全校' : gradeName(grade), classIds: classes.map(group => group.id) };
  const rows: (Scope & { id: string; grade?: number })[] = grade === null
    ? [...new Set(schoolDeviceClasses.map(group => group.grade))].map(value => ({ id: `grade-${value}`, grade: value, label: gradeName(value), classIds: schoolDeviceClasses.filter(group => group.grade === value).map(group => group.id) }))
    : classes.map(group => ({ id: group.id, label: group.name, classIds: [group.id] }));
  if (empty) rows.length = 0;
  const selectedRows = rows.filter(row => selected.includes(row.id));
  const target: Scope = { label: selectedRows.map(row => row.label).join('、'), classIds: selectedRows.flatMap(row => row.classIds) };
  const deniedCount = (ids: string[]) => ids.filter(id => classTemporarilyDenied(state, id)).length;
  const tempLabel = (ids: string[]) => deniedCount(ids) === ids.length ? '已禁止借用' : deniedCount(ids) ? '部分禁止借用' : '未开启临时禁借';
  const go = (value: number | null) => { setGrade(value); onGradeChange?.(value); setSelected([]); setBatch(false); };
  const openOverview = (targetScope: Scope, initialMode: BorrowSchedule['mode'] = 'weekly') => { setMode(initialMode); setOverview(targetScope); };
  const askTemporary = (targetScope: Scope, enabled: boolean, schoolAction = false) => {
    const changedClassIds = schoolAction ? targetScope.classIds : targetScope.classIds.filter(id => classTemporarilyDenied(state, id) !== enabled);
    const affectedScope = { label: changedClassIds.length === targetScope.classIds.length ? targetScope.label : scopeNames(changedClassIds).join('、'), classIds: changedClassIds };
    if (!affectedScope.classIds.length) return;
    setConfirm({ title: enabled ? '确认临时禁止借用？' : schoolAction ? '确认结束全校临时禁借？' : '确认解除临时禁借？', scope: affectedScope, revision: state.revision,
      description: enabled ? '所选范围停止新借出，受影响班级的班主任暂时无法修改借用状态。已有借用规则和学生禁借保留。'
        : '解除临时禁借后，按当前有效的借用规则执行，保留已有的学生禁借。对应班级的班主任恢复借用管控。',
      change: current => setTemporaryBorrowing(current, affectedScope.classIds, enabled, schoolAction),
      summary: current => temporarySummary(current, affectedScope.classIds),
    });
  };
  const openTemporaryChoice = (targetScope: Scope) => { setTemporaryChoice(targetScope); setTemporaryChoiceValue(null); };
  const openRule = (targetScope: Scope, rule = newBorrowSchedule(mode), editingId?: string) => {
    if (rule.mode === 'dates' && editingId && borrowScheduleStatus(rule) === '已失效') return;
    setEditing({ ...targetScope, label: targetScope.classIds.length === allClasses.length ? '全校' : scopeNames(targetScope.classIds).join('、'), rule, editingId, revision: state.revision });
  };
  const saveRule = (rule: BorrowSchedule) => {
    if (!editing) return;
    const conflicts = editing.classIds.filter(id => (state.classRules[id] ?? []).some(previous => previous.id !== editing.editingId && schedulesConflict(previous, rule))).length;
    setConfirm({ title: conflicts ? '确认覆盖借用规则？' : '确认保存借用规则？', scope: editing, revision: editing.revision,
      description: `${ruleText(rule)}。${conflicts ? `其中 ${conflicts} 个班级已有同类规则，将覆盖重叠日期，未重叠日期保留。` : '规则将应用到所选范围。'}${rule.mode === 'weekly' ? '每周规则仅允许在所选星期和时段借用。' : '每周与日期规则分别保留。不改变临时禁借及学生禁借。'}`,
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
  const temporaryActions = (targetScope: Scope) => {
    const denied = deniedCount(targetScope.classIds);
    if (denied > 0 && denied < targetScope.classIds.length) return <button disabled={empty} className="dc-btn" onClick={() => openTemporaryChoice(targetScope)}>设置临时禁借</button>;
    return <button disabled={empty} className="dc-btn" onClick={() => askTemporary(targetScope, denied === 0)}>{denied > 0 ? '解除临时禁借' : '临时禁止借用'}</button>;
  };
  if (currentUser.role !== 'school-admin') return <p className="p-6">无权限查看学校借用管控。</p>;
  if (loadError || exception === 'load-failed') return <div className="dc-list-card p-8 text-center"><p>借用管控加载失败，请重试。</p><button className="dc-btn mt-4" onClick={() => { setException(undefined); refresh(); }}>重新加载</button></div>;
  return <>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <nav className="flex items-center gap-3 text-sm" aria-label="借用管控层级"><button className="font-bold text-indigo-600" onClick={() => go(null)}>{grade !== null && <ArrowLeft size={15} className="mr-2 inline" />}全校</button>{grade !== null && <><ChevronRight size={15} /><span>{gradeName(grade)}</span></>}</nav>
      <button className="dc-btn" onClick={() => setHistory(true)}><History size={15} />操作记录</button>
    </div>
    <section className="dc-scope-card borrow-scope-overview">
      <div className="flex flex-wrap items-center justify-between gap-4"><div className="dc-scope-heading"><h2>{scope.label} · 柜机借用管控</h2>{((grade === null && state.schoolTemporaryActive) || deniedCount(scope.classIds) > 0) && <p className="mt-2">{grade === null && state.schoolTemporaryActive ? `全校临时禁借管控中${deniedCount(allClasses) === 0 ? '，所有班级已单独解除' : deniedCount(allClasses) < allClasses.length ? '，部分班级已单独解除' : ''}` : tempLabel(scope.classIds)}</p>}</div>
        <div className="flex flex-wrap gap-2">{grade === null ? <button disabled={empty} className="dc-btn-primary" onClick={() => askTemporary(scope, !state.schoolTemporaryActive, true)}>{state.schoolTemporaryActive ? '结束全校临时禁借' : '全校临时禁止借用'}</button> : temporaryActions(scope)}</div>
      </div>
      <p className="borrow-scope-description text-sm text-slate-500">未设置借用时间时，学生可随时借用；设置后，按规定时间借用。</p>
      <p className="borrow-scope-description text-sm text-slate-500">学校临时禁借期间，相关学生不可借用。解除后，按当前借用安排执行；班主任单独设置的禁借仍需班主任解除。</p>
    </section>
    <section className="borrow-rules-section" aria-label={`${scope.label}借用规则`}>
      <section className="dc-list-card overflow-hidden">
        <div className="dc-list-heading borrow-list-heading flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-bold">{grade === null ? '年级' : '班级'}借用规则</h3>
          <button disabled={empty} className="dc-btn borrow-batch-toggle" aria-pressed={batch} onClick={() => { setBatch(!batch); setSelected([]); }}>{batch ? '退出批量操作' : '批量操作'}</button>
        </div>
        {batch && <div className="borrow-batch-bar">
          <label className="borrow-select-all"><input type="checkbox" aria-label="全选当前层级" checked={rows.length > 0 && rows.every(row => selected.includes(row.id))} onChange={event => setSelected(event.target.checked ? rows.map(row => row.id) : [])} />全选当前层级</label>
          <span>已选 {selected.length} 个{grade === null ? '年级' : '班级'} · {studentCount(target.classIds)} 名学生</span>
          <div className="borrow-batch-actions"><button disabled={!selected.length} className="dc-btn" onClick={() => openOverview(target)}>设置借用规则</button>{deniedCount(target.classIds) > 0 && deniedCount(target.classIds) < target.classIds.length ? <button className="dc-btn" onClick={() => openTemporaryChoice(target)}>设置临时禁借</button> : <button disabled={!selected.length} className="dc-btn" onClick={() => askTemporary(target, deniedCount(target.classIds) === 0)}>{deniedCount(target.classIds) === target.classIds.length && selected.length ? '解除临时禁借' : '临时禁止借用'}</button>}</div>
        </div>}
        <div className="borrow-card-grid">
          {empty && <p className="borrow-card-empty">{exception === 'no-grades' ? '学校暂无年级，请先完善年级信息。' : exception === 'no-classes' ? '该年级暂无班级，请先添加班级。' : '该班级暂无学生，请先添加学生。'}</p>}
          {rows.map(row => {
            const weeklySummary = borrowingListSummary(state, row.classIds, 'weekly');
            const dateSummary = borrowingListSummary(state, row.classIds, 'dates');
            const upcomingDates = dateSummary.rules.filter(rule => borrowScheduleStatus(rule, now) !== '已失效')
              .sort((left, right) => {
                const priority = { '生效中': 0, '待生效': 1, '已失效': 2 };
                return priority[borrowScheduleStatus(left, now)] - priority[borrowScheduleStatus(right, now)] || left.startDate.localeCompare(right.startDate);
              });
            const anyUpcomingDate = row.classIds.some(id => (state.classRules[id] ?? []).some(rule => rule.mode === 'dates' && borrowScheduleStatus(rule, now) !== '已失效'));
            const dateDiffers = dateSummary.note !== '—' && anyUpcomingDate;
            const weeklyPreviewLimit = upcomingDates.length || dateDiffers ? 1 : 2;
            const previewRules = [...weeklySummary.rules.slice(0, weeklyPreviewLimit), ...upcomingDates.slice(0, 1)];
            const hiddenRuleCount = weeklySummary.rules.length + upcomingDates.length - previewRules.length;
            const last = state.history.find(record => record.classIds?.some(id => row.classIds.includes(id)));
            const denied = deniedCount(row.classIds);
            return <article key={row.id} className="borrow-scope-card">
              <div className="borrow-card-heading">
                {batch && <input type="checkbox" aria-label={`选择${row.label}`} checked={selected.includes(row.id)} onChange={() => setSelected(selected.includes(row.id) ? selected.filter(id => id !== row.id) : [...selected, row.id])} />}
                <div className="borrow-card-title">{row.grade !== undefined
                  ? <button className="borrow-grade-link" onClick={() => go(row.grade!)}>{row.label}</button>
                  : <h4>{row.label}</h4>}
                  {denied > 0 && <span className="borrow-denied-badge">{tempLabel(row.classIds)}</span>}
                </div>
                {row.grade !== undefined && <button className="borrow-grade-hint" onClick={() => go(row.grade!)}>查看班级 <ChevronRight size={16} /></button>}
              </div>
              <div className="borrow-card-rules">
                {weeklySummary.note !== '—' && weeklySummary.note !== '未设置规则' && <p className="borrow-card-placeholder">每周规则：{weeklySummary.note}{row.grade !== undefined && <span>，查看班级了解具体配置</span>}</p>}
                {previewRules.map((rule, index) => <div key={`${rule.id}-${index}`} className="borrow-card-rule"><div className="borrow-card-rule-heading"><strong>{scheduleDateText(rule)}</strong>{rule.mode === 'dates' && <span className="borrow-rule-status" data-status={borrowScheduleStatus(rule, now)}>{borrowScheduleStatus(rule, now)}</span>}</div><span>{schedulePeriodText(rule)}</span></div>)}
                {dateDiffers && <p className="borrow-card-placeholder">有指定日期规则，各班配置不同{row.grade !== undefined && <span>，查看班级了解具体配置</span>}</p>}
                {!previewRules.length && !dateDiffers && weeklySummary.note === '未设置规则' && <p className="borrow-card-placeholder">未设置借用规则</p>}
                {!batch && hiddenRuleCount > 0 && <button className="borrow-card-more" onClick={() => openOverview(row, weeklySummary.rules.length > weeklyPreviewLimit ? 'weekly' : 'dates')}>还有 {hiddenRuleCount} 条，查看全部</button>}
              </div>
              {!batch && <div className="borrow-card-footer">
                {last && <details className="borrow-card-history"><summary>最近操作</summary><p>{last.title} · {last.operator} · {last.at}</p></details>}
                <div className="borrow-card-actions"><button className="dc-btn" onClick={() => openOverview(row)}>设置规则</button>{temporaryActions(row)}</div>
              </div>}
            </article>;
          })}
        </div>
        <div className="p-4 text-sm text-slate-500">共 {rows.length} 个{grade === null ? '年级' : '班级'}</div>
      </section>
    </section>
    {overview && <DeviceControlLayer labelId="borrow-overview" onClose={() => setOverview(null)}>{close => <>
      <header className="flex items-center justify-between border-b p-6"><h2 id="borrow-overview" className="text-xl font-bold">设置规则 · {overview.label}</h2><button aria-label="关闭规则列表" onClick={close}><X size={20} /></button></header>
      <div className="dc-panel-body space-y-4">
        <p className="text-sm text-slate-500">选择规则类型，查看当前配置或新增规则。指定日期内按日期规则执行。</p>
        <div className="borrow-rule-options" role="group" aria-label="规则类型">
          {(['weekly', 'dates'] as const).map(value => <button key={value} type="button" aria-pressed={mode === value} onClick={() => setMode(value)}>{value === 'weekly' ? '每周固定借用规则' : '指定日期借用规则'}</button>)}
        </div>
        {ruleGroups(overview).map(({ rule, classIds }) => <section key={`${rule.id}-${classIds.join()}`} className="rounded-xl border p-4"><h3 className="font-bold">{scheduleDateText(rule)}</h3><p className="mt-2 text-sm">{schedulePeriodText(rule)}</p>{rule.mode === 'dates' && <p className="mt-2 text-sm text-indigo-600">{borrowScheduleStatus(rule, now)}</p>}<p className="mt-3 text-xs leading-6 text-slate-500">{scopeNames(classIds).join('、')}</p><div className="mt-3 flex gap-2">{(rule.mode !== 'dates' || borrowScheduleStatus(rule, now) !== '已失效') && <button className="dc-btn" onClick={() => openRule({ label: scopeNames(classIds).join('、'), classIds }, rule, rule.id)}>编辑</button>}<button className="dc-btn" onClick={() => deleteRule({ label: scopeNames(classIds).join('、'), classIds }, rule)}>删除</button></div></section>)}
        {!ruleGroups(overview).length && <p className="py-12 text-center text-slate-500">尚未设置{mode === 'weekly' ? '每周固定' : '指定日期'}借用规则</p>}
      </div>
      <footer className="border-t p-5"><button className="dc-btn-primary" onClick={() => openRule(overview)}>新增{mode === 'weekly' ? '每周固定' : '指定日期'}借用规则</button></footer>
    </>}</DeviceControlLayer>}
    {editing && <StudentControlEditor key={`${editing.rule.id}-${editing.revision}`} targetLabel={editing.label} count={studentCount(editing.classIds)} selectedObjects={scopeNames(editing.classIds)} schedule={editing.rule} onClose={() => setEditing(null)} onSave={value => { if (value.schedule) saveRule(value.schedule); }} />}
    {temporaryChoice && <DeviceControlLayer labelId="borrow-temporary-choice" variant="dialog" onClose={() => setTemporaryChoice(null)}>{close => <><div className="dc-confirm-body"><h2 id="borrow-temporary-choice" className="text-xl font-bold">设置临时禁借</h2><p className="mt-3 text-sm text-slate-600">设置范围：{temporaryChoice.label} · 共 {studentCount(temporaryChoice.classIds)} 名学生</p><p className="mt-2 text-sm text-slate-500">当前所选范围：{deniedCount(temporaryChoice.classIds)} 个班已禁借，{temporaryChoice.classIds.length - deniedCount(temporaryChoice.classIds)} 个班未禁借。</p><fieldset className="mt-5 space-y-3"><legend className="mb-3 font-bold">请选择要执行的操作</legend>{([true, false] as const).map(enabled => <label key={String(enabled)} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 ${temporaryChoiceValue === enabled ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200'}`}><input type="radio" name="borrow-temporary-action" checked={temporaryChoiceValue === enabled} onChange={() => setTemporaryChoiceValue(enabled)} /><span><span className="block font-medium text-slate-900">{enabled ? '临时禁止借用' : '解除临时禁借'}</span><span className="mt-1 block text-sm text-slate-500">{enabled ? `${temporaryChoice.classIds.length - deniedCount(temporaryChoice.classIds)} 个未禁借班级将被禁借` : `${deniedCount(temporaryChoice.classIds)} 个已禁借班级将解除`}，其余保持不变。</span></span></label>)}</fieldset>{temporaryChoiceValue !== null && <p role="status" className="mt-4 max-h-32 overflow-y-auto rounded-lg bg-slate-50 p-3 text-xs leading-6 text-slate-600">本次涉及班级：{classNames(temporaryChoice.classIds.filter(id => classTemporarilyDenied(state, id) !== temporaryChoiceValue)).join('、')}</p>}</div><div className="dc-confirm-footer"><button type="button" className="dc-btn" onClick={close}>取消</button><button type="button" className="dc-btn-primary" disabled={temporaryChoiceValue === null} onClick={() => { if (temporaryChoiceValue === null) return; askTemporary(temporaryChoice, temporaryChoiceValue); setTemporaryChoice(null); }}>下一步</button></div></>}</DeviceControlLayer>}
    {confirm && <DeviceControlLayer labelId="borrow-confirm" variant="dialog" level={3} onClose={() => setConfirm(null)}>{close => <><header className="border-b p-6"><h2 id="borrow-confirm" className="text-xl font-bold">{confirm.title}</h2></header><div className="dc-panel-body space-y-4"><p className="font-bold text-indigo-700">{confirm.scope.label}</p><p className="text-sm text-slate-500">影响 {studentCount(confirm.scope.classIds)} 名学生</p><p className="text-sm leading-7">{confirm.description}</p></div><footer className="flex justify-end gap-3 border-t p-5"><button className="dc-btn" onClick={close}>取消</button><button className="dc-btn-primary" onClick={commit}>确认并生效</button></footer></>}</DeviceControlLayer>}
    {history && <DeviceControlLayer labelId="borrow-history" onClose={() => setHistory(false)}>{close => <><header className="flex items-center justify-between border-b p-6"><h2 id="borrow-history" className="text-xl font-bold">借用管控操作记录</h2><button aria-label="关闭操作记录" onClick={close}><X size={20} /></button></header><div className="dc-panel-body space-y-4"><p className="text-xs text-slate-500">仅记录教师端学校管理员的操作，每个模块显示近100条记录。</p>{state.history.map(record => <section key={record.id} className="rounded-xl border p-4"><h3 className="font-bold">{record.title}</h3><p className="mt-2 text-sm">操作对象：{record.scope || '未记录'}</p><p className="mt-2 text-xs text-slate-500">{record.operator} · {record.at}</p><details className="mt-3 text-sm"><summary>查看修改前后</summary><p className="mt-2 whitespace-pre-line">修改前：{record.before.join('\n') || '无规则'}</p><p className="mt-2 whitespace-pre-line">修改后：{record.after.join('\n') || '无规则'}</p></details></section>)}{!state.history.length && <p className="py-10 text-center text-slate-500">暂无操作记录</p>}</div></>}</DeviceControlLayer>}
    {notice && <ControlToast message={notice.text} tone={notice.tone} onClose={() => setNotice(null)} />}
  </>;
};
