import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { TeacherPortalUser } from '../data/teacherAccess';
import type { ControlExceptionDemo } from '../data/controlExceptionDemo';
import { schoolDeviceClasses } from '../data/schoolDeviceClasses';
import { BorrowSchedule, deviceControlStudents, newBorrowSchedule, scheduleDateText, schedulePeriodText } from '../data/hierarchicalDeviceControl';
import { BorrowingRuleEntry, BorrowingState, borrowingStorageKey, classTemporarilyDenied, deleteGroupedBorrowingRule, groupBorrowingRules, initialBorrowingState, readBorrowingState, gradeBorrowingDateConflict, saveGradeBorrowingRule, setTemporaryBorrowing } from '../data/borrowingControl';
import { SchoolBorrowingRuleEditor } from './SchoolBorrowingRuleEditor';
import { DeviceControlLayer } from './DeviceControlLayer';
import { ControlToast } from './ControlToast';
import './SchoolBorrowingControl.css';

type Scope = { label: string; classIds: string[] };
type Editing = Scope & { rule: BorrowSchedule; editingId?: string; originals?: BorrowingRuleEntry[]; revision: number };
type Confirm = { title: string; scope: Scope; description: string; revision: number; change: (state: BorrowingState) => BorrowingState; summary: (state: BorrowingState) => string[]; closeEditor?: boolean; conflictDetails?: string[]; dateCheck?: { rule: BorrowSchedule; originals: BorrowingRuleEntry[] } };
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

export const SchoolBorrowingControl: React.FC<{ currentUser: TeacherPortalUser; demoScenario?: ControlExceptionDemo }> = ({ currentUser, demoScenario }) => {
  const [exception, setException] = useState(demoScenario?.kind);
  const [loadError, setLoadError] = useState(false);
  const [state, setState] = useState<BorrowingState>(() => {
    try { return readBorrowingState(currentUser.schoolId); } catch { return initialBorrowingState(); }
  });
  const [ruleError, setRuleError] = useState('');
  const [gradePicker, setGradePicker] = useState<number[] | null>(null);
  const [overview, setOverview] = useState<Scope | null>(null);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [temporaryChoice, setTemporaryChoice] = useState<Scope | null>(null);
  const [temporaryChoiceValue, setTemporaryChoiceValue] = useState<boolean | null>(null);
  const [notice, setNotice] = useState<{ text: string; tone: 'success' | 'error' | 'warning' } | null>(null);
  const refresh = () => { try { setState(readBorrowingState(currentUser.schoolId)); setLoadError(false); } catch { setLoadError(true); } };
  useEffect(() => {
    refresh();
    const sync = (event: StorageEvent) => { if (event.key === borrowingStorageKey(currentUser.schoolId)) refresh(); };
    window.addEventListener('storage', sync);
    window.addEventListener('focus', refresh);
    return () => { window.removeEventListener('storage', sync); window.removeEventListener('focus', refresh); };
  }, [currentUser.schoolId]);
  const empty = exception === 'no-grades' || exception === 'no-classes' || exception === 'no-students';
  const scope: Scope = { label: '全校', classIds: allClasses };
  const rows: (Scope & { id: string; grade: number })[] = [...new Set(schoolDeviceClasses.map(group => group.grade))].map(value => ({ id: `grade-${value}`, grade: value, label: gradeName(value), classIds: schoolDeviceClasses.filter(group => group.grade === value).map(group => group.id) }));
  if (empty) rows.length = 0;
  const selectableRows = rows.filter(row => studentCount(row.classIds) > 0);
  const deniedCount = (ids: string[]) => ids.filter(id => classTemporarilyDenied(state, id)).length;
  const tempLabel = (ids: string[]) => deniedCount(ids) === ids.length ? '已临时禁止借用' : deniedCount(ids) ? '部分临时禁止借用' : '未开启临时禁借';
  const openOverview = (targetScope: Scope) => setOverview(targetScope);
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
  const openRule = (targetScope: Scope, rule = newBorrowSchedule('weekly'), editingId?: string, originals?: BorrowingRuleEntry[]) => {
    setRuleError('');
    setEditing({ ...targetScope, label: targetScope.classIds.length === allClasses.length ? '全校' : scopeNames(targetScope.classIds).join('、'), rule, editingId, originals, revision: state.revision });
  };
  const saveRule = (rule: BorrowSchedule, grades: number[]): string | undefined => {
    if (!editing) return;
    const classIds = schoolDeviceClasses.filter(group => grades.includes(group.grade)).map(group => group.id);
    if (!classIds.length) return '请选择年级';
    const targetScope = { label: classIds.length === allClasses.length ? '全校' : scopeNames(classIds).join('、'), classIds };
    const originals = editing.originals ?? (editing.editingId ? classIds.map(classId => ({ classId, ruleId: editing.editingId! })) : []);
    if (gradeBorrowingDateConflict(state, classIds, rule, originals)) return '所选日期已有规则，请重新选择';
    const replacedGrades = [...new Set(schoolDeviceClasses.filter(group => classIds.includes(group.id) && (state.classRules[group.id] ?? []).some(existing => existing.mode === 'weekly')).map(group => group.grade))];
    setRuleError('');
    setConfirm({ title: '确认保存借用规则？', scope: targetScope, revision: editing.revision,
      description: `${ruleText(rule)}。${rule.mode === 'weekly'
        ? `${replacedGrades.length ? `${replacedGrades.map(gradeName).join('、')}已有规则，是否确认修改？` : ''}仅允许在设置的星期和时段借用，其他时间不可借用。`
        : ''}`,
      change: current => saveGradeBorrowingRule(current, classIds, rule, originals, true),
      summary: current => ruleSummary(current, classIds), closeEditor: true, dateCheck: rule.mode === 'dates' ? { rule, originals } : undefined });
  };
  const deleteRule = (targetScope: Scope, rule: BorrowSchedule, originals: BorrowingRuleEntry[]) => {
    const unrestricted = targetScope.classIds.filter(id => !(state.classRules[id] ?? []).some(item => !originals.some(entry => entry.classId === id && entry.ruleId === item.id)));
    const warning = unrestricted.length === targetScope.classIds.length ? '这是所选班级的最后一条规则。删除后默认随时可借，已禁借的学生除外。' : unrestricted.length ? `删除后，${scopeNames(unrestricted).join('、')}将没有借用规则，默认随时可借，已禁借的学生除外；其他班级按剩余规则执行。` : '删除后按剩余规则执行；没有当天有效的日期规则且未设置每周规则时，默认可借用。';
    setConfirm({ title: '确认删除借用规则？', scope: targetScope, revision: state.revision,
    description: `${ruleText(rule)}。${warning}`,
    change: current => deleteGroupedBorrowingRule(current, originals),
    summary: current => ruleSummary(current, targetScope.classIds) });
  };
  const commit = () => {
    if (!confirm || currentUser.role !== 'school-admin') return;
    if (exception === 'save-failed') { setNotice({ text: '保存失败，请检查网络或稍后重试。已填写的内容已保留。', tone: 'error' }); return; }
    if (exception === 'scope-changed' || exception === 'conflict') {
      setConfirm(null); setEditing(null); refresh();
      setNotice({ text: exception === 'scope-changed' ? '所选范围的学生或班级已变化，请重新选择后再设置。' : '相关设置已被其他人修改，本次未保存，请重新设置。', tone: 'warning' }); return;
    }
    try {
      const current = readBorrowingState(currentUser.schoolId);
      if (current.revision !== confirm.revision) {
        setState(current); setConfirm(null);
        setEditing(previous => previous ? { ...previous, revision: current.revision } : previous);
        if (confirm.dateCheck && gradeBorrowingDateConflict(current, confirm.scope.classIds, confirm.dateCheck.rule, confirm.dateCheck.originals)) { setRuleError('所选日期已有规则，请重新选择'); return; }
        setNotice({ text: '相关设置已被其他人修改，本次未保存，请重新设置。', tone: 'warning' }); return;
      }
      const next = confirm.change(current);
      const record = { id: crypto.randomUUID(), at: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false }), operator: `${currentUser.name}${currentUser.phone ? `（${currentUser.phone}）` : ''}`, title: confirm.title.replace('确认', '').replace('？', ''), scope: confirm.scope.label, classIds: confirm.scope.classIds, before: confirm.summary(current), after: confirm.summary(next) };
      const saved = { ...next, revision: current.revision + 1, history: [record, ...current.history].slice(0, 100) };
      localStorage.setItem(borrowingStorageKey(currentUser.schoolId), JSON.stringify(saved));
      setState(saved); setConfirm(null); if (confirm.closeEditor) setEditing(null);
      setNotice({ text: '借用管控设置已生效', tone: 'success' });
    } catch (error) {
      if (error instanceof Error && error.message === '所选日期已有规则，请重新选择') { setConfirm(null); setRuleError(error.message); refresh(); return; }
      setNotice({ text: '保存失败，请稍后重试。已填写的内容已保留。', tone: 'error' });
    }
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
      <nav className="font-bold text-sm text-indigo-600" aria-label="借用管控层级">全校</nav>
    </div>
    <section className="dc-scope-card borrow-scope-overview">
      <div className="flex flex-wrap items-center justify-between gap-4"><div className="dc-scope-heading"><h2>全校 · 柜机借用管控</h2>{(state.schoolTemporaryActive || deniedCount(allClasses) > 0) && <p className="mt-2">{state.schoolTemporaryActive ? '全校临时禁借管控中' : tempLabel(allClasses)}</p>}</div>
        <button disabled={empty || (!state.schoolTemporaryActive && !studentCount(allClasses))} className="dc-btn-primary" onClick={() => askTemporary(scope, !state.schoolTemporaryActive, true)}>{state.schoolTemporaryActive ? '结束全校临时禁借' : '全校临时禁止借用'}</button>
      </div>
      <p className="borrow-scope-description text-sm text-slate-500">未设置借用时间时，学生可随时借用；设置后，按规定时间借用。</p>
      <p className="borrow-scope-description text-sm text-slate-500">学校临时禁借期间，相关学生不可借用。解除后，按当前借用安排执行；班主任单独设置的禁借仍需班主任解除。</p>
    </section>
    <section className="borrow-rules-section" aria-label={`${scope.label}借用规则`}>
      <section className="dc-list-card overflow-hidden">
        <div className="dc-list-heading borrow-list-heading flex flex-wrap items-center justify-between gap-3">
          <div><h3 className="font-bold">借用规则</h3><p className="borrow-priority-note">禁止借用日期优先生效</p></div>
          <button disabled={!selectableRows.length} className="dc-btn borrow-batch-toggle" onClick={() => setGradePicker([])}>设置全校借用规则</button>
        </div>
        <div className="borrow-card-grid">
          {empty && <p className="borrow-card-empty">{exception === 'no-grades' ? '学校暂无年级，请先完善年级信息。' : exception === 'no-classes' ? '该年级暂无班级，请先添加班级。' : '该年级暂无学生，请先添加学生。'}</p>}
          {rows.map(row => {
            if (studentCount(row.classIds) === 0) return <React.Fragment key={row.id}><article className="borrow-scope-card" aria-disabled="true"><div className="borrow-card-heading"><div className="borrow-card-title"><h4>{row.label}</h4></div></div><div className="borrow-card-rules"><p className="borrow-card-placeholder">{row.grade !== undefined ? '该年级暂无学生' : '该班级暂无学生'}</p></div></article></React.Fragment>;
            const weeklySummary = { rules: groupBorrowingRules(state, row.classIds, 'weekly').map(group => group.rule), note: '未设置规则' };
            const dateRules = groupBorrowingRules(state, row.classIds, 'dates').map(group => group.rule)
              .sort((left, right) => left.startDate.localeCompare(right.startDate));
            const weeklyPreviewLimit = dateRules.length ? 1 : 2;
            const previewRules = weeklySummary.rules.length
              ? [...weeklySummary.rules.slice(0, weeklyPreviewLimit), ...dateRules.slice(0, 1)].slice(0, 2)
              : dateRules.slice(0, 2);
            const hiddenRuleCount = weeklySummary.rules.length + dateRules.length - previewRules.length;
            const denied = deniedCount(row.classIds);
            return <React.Fragment key={row.id}><article className="borrow-scope-card">
              <div className="borrow-card-heading">
                <div className="borrow-card-title"><h4>{row.label}</h4>{denied > 0 && <span className="borrow-denied-badge">{tempLabel(row.classIds)}</span>}</div>
              </div>
              <div className="borrow-card-rules">
                {previewRules.map((rule, index) => <div key={`${rule.id}-${index}`} className="borrow-card-rule"><div className="borrow-card-rule-heading"><strong>{scheduleDateText(rule)}</strong></div>{schedulePeriodText(rule).split('；').map((line, position) => <span key={position}>{line}</span>)}</div>)}
                {!previewRules.length && <p className="borrow-card-placeholder">未设置借用规则</p>}
                {hiddenRuleCount > 0 && <button className="borrow-card-more" onClick={() => openOverview(row)}>还有 {hiddenRuleCount} 条，查看全部</button>}
              </div>
              <div className="borrow-card-footer">
                <div className="borrow-card-actions ml-auto"><button className="dc-btn" onClick={() => openOverview(row)}>设置规则</button>{temporaryActions(row)}</div>
              </div>
            </article></React.Fragment>;
          })}
        </div>
        <div className="p-4 text-sm text-slate-500">共 {rows.length} 个年级</div>
      </section>
    </section>
    {gradePicker !== null && <DeviceControlLayer labelId="borrow-grade-picker" onClose={() => setGradePicker(null)}>{close => <>
      <header className="flex items-center justify-between"><h2 id="borrow-grade-picker" className="text-xl font-bold">选择年级</h2><button type="button" aria-label="关闭年级选择" onClick={close}><X size={20} /></button></header>
      <div className="dc-panel-body space-y-4"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={selectableRows.length > 0 && selectableRows.every(row => gradePicker.includes(row.grade))} onChange={event => setGradePicker(event.target.checked ? selectableRows.map(row => row.grade) : [])} />全部年级</label><div className="flex flex-wrap gap-3">{rows.map(row => <label key={row.id} className="dc-choice"><input type="checkbox" checked={gradePicker.includes(row.grade)} disabled={!studentCount(row.classIds)} onChange={() => setGradePicker(current => current?.includes(row.grade) ? current.filter(value => value !== row.grade) : [...(current ?? []), row.grade])} />{row.label}</label>)}</div></div>
      <footer className="flex justify-end gap-3"><button type="button" className="dc-btn" onClick={close}>取消</button><button type="button" className="dc-btn-primary" disabled={!gradePicker.length} onClick={() => { const classIds = rows.filter(row => gradePicker.includes(row.grade)).flatMap(row => row.classIds); setOverview({ label: classIds.length === allClasses.length ? '全校' : scopeNames(classIds).join('、'), classIds }); setGradePicker(null); }}>下一步</button></footer>
    </>}</DeviceControlLayer>}
    {overview && <DeviceControlLayer labelId="borrow-overview" onClose={() => setOverview(null)}>{close => <>
      <header className="flex items-center justify-between border-b p-6"><h2 id="borrow-overview" className="text-xl font-bold">设置规则 · {overview.label}</h2><div className="flex items-center gap-3"><button type="button" className="text-sm text-indigo-600" onClick={() => { setGradePicker([...new Set(schoolDeviceClasses.filter(group => overview.classIds.includes(group.id)).map(group => group.grade))]); setOverview(null); }}>重新选择年级</button><button aria-label="关闭规则列表" onClick={close}><X size={20} /></button></div></header>
      <div className="dc-panel-body space-y-6">
        {(() => {
          const groups = groupBorrowingRules(state, overview.classIds, 'weekly');
          return <section aria-label="每周固定借用规则" className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-bold">每周固定借用规则</h3><div className="flex gap-2"><button type="button" className="dc-btn" onClick={() => { const current = groups.length === 1 ? groups[0] : undefined; openRule(overview, current?.rule ?? newBorrowSchedule('weekly'), current?.rule.id, current?.entries); }}>{groups.length ? '修改每周规则' : '设置每周规则'}</button>{groups.length > 0 && <button type="button" className="dc-btn" onClick={() => setConfirm({ title: '确认删除每周借用规则？', scope: overview, revision: state.revision, description: '删除所选年级的每周安排，指定日期规则保留。未命中日期规则且没有禁借限制时，默认可以借用。', change: current => ({ ...current, classRules: { ...current.classRules, ...Object.fromEntries(overview.classIds.map(id => [id, (current.classRules[id] ?? []).filter(rule => rule.mode !== 'weekly')])) } }), summary: current => ruleSummary(current, overview.classIds) })}>删除</button>}</div></div>
            {groups.length ? <div className="space-y-4 rounded-xl bg-slate-50 p-4">{groups.map(({ key, rule, entries }) => <div key={key}>{(groups.length > 1 || entries.length < overview.classIds.length) && <p className="mb-1 text-xs text-slate-500">{scopeNames([...new Set(entries.map(entry => entry.classId))]).join('、')}</p>}<p className="font-medium">{scheduleDateText(rule)}</p><p className="mt-1 text-sm text-slate-600">{schedulePeriodText(rule)}</p></div>)}</div> : <p className="py-4 text-sm text-slate-500">尚未设置每周固定借用规则</p>}
          </section>;
        })()}
        <section aria-label="指定日期借用规则" className="space-y-3 border-t border-slate-200 pt-6">
          <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="font-bold">指定日期借用规则</h3><button type="button" className="dc-btn" onClick={() => openRule(overview, newBorrowSchedule('dates'))}>新增日期规则</button></div>
          {groupBorrowingRules(state, overview.classIds, 'dates').sort((a, b) => a.rule.startDate.localeCompare(b.rule.startDate)).map(({ key, rule, entries }) => {
            const grades = new Set(schoolDeviceClasses.filter(group => entries.some(entry => entry.classId === group.id)).map(group => group.grade));
            const classIds = schoolDeviceClasses.filter(group => grades.has(group.grade)).map(group => group.id);
            const target = { label: classIds.length === allClasses.length ? '全校' : scopeNames(classIds).join('、'), classIds };
            return <section key={key} className="rounded-xl border border-slate-200 p-4"><h4 className="font-bold">{scheduleDateText(rule)}</h4><p className="mt-2 text-sm">{schedulePeriodText(rule)}</p><p className="mt-2 text-xs text-slate-500">{target.label}</p><div className="mt-3 flex gap-2"><button type="button" className="dc-btn" onClick={() => openRule(target, rule, rule.id, entries)}>编辑</button><button type="button" className="dc-btn" onClick={() => deleteRule(target, rule, entries)}>删除</button></div></section>;
          })}
          {!groupBorrowingRules(state, overview.classIds, 'dates').length && <p className="py-4 text-sm text-slate-500">尚未设置指定日期借用规则</p>}
        </section>
      </div>
    </>}</DeviceControlLayer>}
    {editing && <SchoolBorrowingRuleEditor key={editing.rule.id} rule={editing.rule} grades={rows.map(row => ({ grade: row.grade, label: row.label, count: studentCount(row.classIds), disabled: !studentCount(row.classIds), hasWeeklyRule: row.classIds.some(id => (state.classRules[id] ?? []).some(rule => rule.mode === 'weekly')) }))} initialGrades={[...new Set(schoolDeviceClasses.filter(group => editing.classIds.includes(group.id)).map(group => group.grade))]} editing={!!editing.editingId} error={ruleError} onClearError={() => setRuleError('')} onClose={() => setEditing(null)} onSave={saveRule} />}
    {temporaryChoice && <DeviceControlLayer labelId="borrow-temporary-choice" variant="dialog" onClose={() => setTemporaryChoice(null)}>{close => <><div className="dc-confirm-body"><h2 id="borrow-temporary-choice" className="text-xl font-bold">设置临时禁借</h2><p className="mt-3 text-sm text-slate-600">设置范围：{temporaryChoice.label} · 共 {studentCount(temporaryChoice.classIds)} 名学生</p><p className="mt-2 text-sm text-slate-500">当前所选范围：{deniedCount(temporaryChoice.classIds)} 个班已禁借，{temporaryChoice.classIds.length - deniedCount(temporaryChoice.classIds)} 个班未禁借。</p><fieldset className="mt-5 space-y-3"><legend className="mb-3 font-bold">请选择要执行的操作</legend>{([true, false] as const).map(enabled => <label key={String(enabled)} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 ${temporaryChoiceValue === enabled ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200'}`}><input type="radio" name="borrow-temporary-action" checked={temporaryChoiceValue === enabled} onChange={() => setTemporaryChoiceValue(enabled)} /><span><span className="block font-medium text-slate-900">{enabled ? '临时禁止借用' : '解除临时禁借'}</span><span className="mt-1 block text-sm text-slate-500">{enabled ? `${temporaryChoice.classIds.length - deniedCount(temporaryChoice.classIds)} 个未禁借班级将被禁借` : `${deniedCount(temporaryChoice.classIds)} 个已禁借班级将解除`}，其余保持不变。</span></span></label>)}</fieldset>{temporaryChoiceValue !== null && <p role="status" className="mt-4 max-h-32 overflow-y-auto rounded-lg bg-slate-50 p-3 text-xs leading-6 text-slate-600">本次涉及班级：{classNames(temporaryChoice.classIds.filter(id => classTemporarilyDenied(state, id) !== temporaryChoiceValue)).join('、')}</p>}</div><div className="dc-confirm-footer"><button type="button" className="dc-btn" onClick={close}>取消</button><button type="button" className="dc-btn-primary" disabled={temporaryChoiceValue === null} onClick={() => { if (temporaryChoiceValue === null) return; askTemporary(temporaryChoice, temporaryChoiceValue); setTemporaryChoice(null); }}>下一步</button></div></>}</DeviceControlLayer>}
    {confirm && <DeviceControlLayer labelId="borrow-confirm" variant="dialog" level={3} onClose={() => setConfirm(null)}>{close => <><header className="border-b p-6"><h2 id="borrow-confirm" className="text-xl font-bold">{confirm.title}</h2></header><div className="dc-panel-body space-y-4"><p className="font-bold text-indigo-700">{confirm.scope.label}</p><p className="text-sm text-slate-500">影响 {studentCount(confirm.scope.classIds)} 名学生</p><p className="text-sm leading-7">{confirm.description}</p>{confirm.conflictDetails?.length ? <div className="rounded-lg bg-slate-50 p-3 text-sm"><p className="font-medium text-slate-700">将覆盖的已有规则</p><ul className="mt-2 max-h-32 space-y-1 overflow-y-auto text-slate-600">{confirm.conflictDetails.map(detail => <li key={detail}>{detail}</li>)}</ul></div> : null}</div><footer className="flex justify-end gap-3 border-t p-5"><button className="dc-btn" onClick={close}>取消</button><button className="dc-btn-primary" onClick={commit}>确认并生效</button></footer></>}</DeviceControlLayer>}
    {notice && <ControlToast message={notice.text} tone={notice.tone} onClose={() => setNotice(null)} />}
  </>;
};
