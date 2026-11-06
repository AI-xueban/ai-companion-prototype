import React, { useEffect, useState } from 'react';
import { Info, X } from 'lucide-react';
import { TeacherPortalUser } from '../data/teacherAccess';
import type { ControlExceptionDemo } from '../data/controlExceptionDemo';
import { schoolDeviceClasses } from '../data/schoolDeviceClasses';
import { BorrowSchedule, deviceControlStudents, newBorrowSchedule, schoolDate, scheduleDateText, schedulePeriodText } from '../data/hierarchicalDeviceControl';
import { BorrowingRuleEntry, BorrowingState, borrowingStorageKey, borrowingRuleTypeEnabled, setBorrowingRuleTypeEnabled, classTemporarilyDenied, deleteGroupedBorrowingRule, groupBorrowingRules, initialBorrowingState, readBorrowingState, gradeBorrowingDateConflict, saveGradeBorrowingRule, setTemporaryBorrowing } from '../data/borrowingControl';
import { SchoolBorrowingRuleEditor } from './SchoolBorrowingRuleEditor';
import { DeviceControlLayer } from './DeviceControlLayer';
import { ControlToast } from './ControlToast';
import './SchoolBorrowingControl.css';

type Scope = { label: string; classIds: string[] };
type Editing = Scope & { chooseGrades?: boolean; rule: BorrowSchedule; editingId?: string; originals?: BorrowingRuleEntry[]; revision: number };
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
const ruleText = (rule: BorrowSchedule) => rule.mode === 'weekly' && rule.weekdayPeriods && !rule.deny
  ? schedulePeriodText(rule)
  : `${scheduleDateText(rule)} · ${schedulePeriodText(rule)}`;
const ruleSummary = (state: BorrowingState, ids: string[]) => [...new Set(ids.flatMap(id => (state.classRules[id] ?? []).map(ruleText)))];
const temporarySummary = (state: BorrowingState, ids: string[]) => ids.map(id => `${scopeNames([id])[0]}：${classTemporarilyDenied(state, id) ? '临时禁止借用' : '未开启临时禁借'}`);

export const SchoolBorrowingControl: React.FC<{ currentUser: TeacherPortalUser; demoScenario?: ControlExceptionDemo }> = ({ currentUser, demoScenario }) => {
  const [exception, setException] = useState(demoScenario?.kind);
  const [loadError, setLoadError] = useState(false);
  const [state, setState] = useState<BorrowingState>(() => {
    try { return readBorrowingState(currentUser.schoolId); } catch { return initialBorrowingState(); }
  });
  const [ruleError, setRuleError] = useState('');
  const [ruleHelpOpen, setRuleHelpOpen] = useState(false);
  const [gradeTemporaryOpen, setGradeTemporaryOpen] = useState(false);
  const [restoringBorrowing, setRestoringBorrowing] = useState(false);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [temporaryGrades, setTemporaryGrades] = useState<number[]>([]);
  const [notice, setNotice] = useState<{ text: string; tone: 'success' | 'error' | 'warning' | 'info' } | null>(null);
  const refresh = () => { try { setState(readBorrowingState(currentUser.schoolId)); setLoadError(false); } catch { setLoadError(true); } };
  useEffect(() => {
    refresh();
    const sync = (event: StorageEvent) => { if (event.key === borrowingStorageKey(currentUser.schoolId)) refresh(); };
    window.addEventListener('storage', sync);
    window.addEventListener('focus', refresh);
    const visible = () => { if (document.visibilityState === 'visible') refresh(); };
    document.addEventListener('visibilitychange', visible);
    const timer = window.setInterval(refresh, 60_000);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', visible); window.removeEventListener('storage', sync); window.removeEventListener('focus', refresh); };
  }, [currentUser.schoolId]);
  const empty = exception === 'no-grades' || exception === 'no-classes' || exception === 'no-students';
  const scope: Scope = { label: '全校', classIds: allClasses };
  const rows: (Scope & { id: string; grade: number })[] = [...new Set(schoolDeviceClasses.map(group => group.grade))].map(value => ({ id: `grade-${value}`, grade: value, label: gradeName(value), classIds: schoolDeviceClasses.filter(group => group.grade === value).map(group => group.id) }));
  if (empty) rows.length = 0;
  const selectableRows = rows.filter(row => studentCount(row.classIds) > 0);
  const deniedCount = (ids: string[]) => ids.filter(id => classTemporarilyDenied(state, id)).length;
  const allBorrowingStopped = allClasses.length > 0 && deniedCount(allClasses) === allClasses.length;
  const stoppableRows = selectableRows.filter(row => deniedCount(row.classIds) < row.classIds.length);
  const restorableRows = selectableRows.filter(row => deniedCount(row.classIds) > 0);
  const temporaryRows = restoringBorrowing ? restorableRows : stoppableRows;
  const selectedTemporaryRows = temporaryRows.filter(row => temporaryGrades.includes(row.grade));
  const openTemporary = (restore: boolean) => {
    setRestoringBorrowing(restore);
    setTemporaryGrades((restore ? restorableRows : stoppableRows).map(row => row.grade));
    setGradeTemporaryOpen(true);
  };
  const tempLabel = (ids: string[]) => deniedCount(ids) === ids.length ? '已临时禁止借用' : deniedCount(ids) ? '部分临时禁止借用' : '未开启临时禁借';
  const askTemporary = (targetScope: Scope, enabled: boolean, schoolAction = false) => {
    const changedClassIds = schoolAction ? targetScope.classIds : targetScope.classIds.filter(id => classTemporarilyDenied(state, id) !== enabled);
    const affectedScope = { label: changedClassIds.length === targetScope.classIds.length ? targetScope.label : scopeNames(changedClassIds).join('、'), classIds: changedClassIds };
    if (!affectedScope.classIds.length) return;
    setConfirm({ title: enabled ? '确认停止借用？' : '确认恢复借用？', scope: affectedScope, revision: state.revision,
      description: enabled ? '将禁止所选范围内的学生借出，已有借用规则保留'
        : '解除临时禁借后，按当前有效的借用规则执行',
      change: current => setTemporaryBorrowing(current, affectedScope.classIds, enabled, schoolAction),
      summary: current => temporarySummary(current, affectedScope.classIds),
    });
  };
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
    if (rule.mode === 'weekly' && classIds.some(id => (state.classRules[id] ?? []).some(existing => existing.mode === 'weekly' && !originals.some(entry => entry.classId === id && entry.ruleId === existing.id)))) return '所选年级已有规则，请编辑已有规则';
    if (rule.mode === 'dates' && rule.endDate < schoolDate()) return '结束日期不能早于今天';
    if (gradeBorrowingDateConflict(state, classIds, rule, originals)) return '所选日期已有规则，请重新选择';
    setRuleError('');
    setConfirm({ title: '确认保存借用规则？', scope: targetScope, revision: editing.revision,
      description: rule.mode === 'weekly'
        ? ruleText(rule).split('；').map(line => line.endsWith('可借用') ? line : `${line} 可借用`).join('；')
        : ruleText(rule),
      change: current => saveGradeBorrowingRule(current, classIds, rule, originals, true),
      summary: current => ruleSummary(current, [...new Set([...classIds, ...originals.map(entry => entry.classId)])]), closeEditor: true, dateCheck: rule.mode === 'dates' ? { rule, originals } : undefined });
  };
  const deleteRule = (targetScope: Scope, rule: BorrowSchedule, originals: BorrowingRuleEntry[]) => {
    const unrestricted = targetScope.classIds.filter(id => !(state.classRules[id] ?? []).some(item => !originals.some(entry => entry.classId === id && entry.ruleId === item.id)));
    const warning = unrestricted.length === targetScope.classIds.length ? '这是所选班级的最后一条规则。删除后默认随时可借。' : unrestricted.length ? `删除后，${scopeNames(unrestricted).join('、')}将没有借用规则，默认随时可借。` : '删除后按剩余规则执行；没有当天有效的日期规则且未设置每周规则时，默认可借用。';
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
      if (confirm.dateCheck && confirm.dateCheck.rule.endDate < schoolDate()) { setConfirm(null); setRuleError('结束日期不能早于今天'); refresh(); return; }
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
      setState(saved); setConfirm(null); setGradeTemporaryOpen(false); if (confirm.closeEditor) setEditing(null);
      setNotice({ text: confirm.title.includes('停止') ? '已停止借用' : confirm.title.includes('恢复') ? '已恢复借用' : confirm.title.includes('删除') ? '借用规则已删除' : '借用规则已保存', tone: 'success' });
    } catch (error) {
      if (error instanceof Error && error.message === '所选日期已有规则，请重新选择') { setConfirm(null); setRuleError(error.message); refresh(); return; }
      setNotice({ text: '保存失败，请稍后重试。已填写的内容已保留。', tone: 'error' });
    }
  };
  const toggleRuleType = (mode: BorrowSchedule['mode']) => {
    if (currentUser.role !== 'school-admin') return;
    try {
      if (exception === 'save-failed') throw new Error('save-failed');
      const current = readBorrowingState(currentUser.schoolId);
      if (current.revision !== state.revision || exception === 'conflict' || exception === 'scope-changed') {
        setState(current); setNotice({ text: '相关设置已被其他人修改，本次未保存，请重新设置。', tone: 'warning' }); return;
      }
      const enabled = !borrowingRuleTypeEnabled(current, mode);
      const saved = { ...setBorrowingRuleTypeEnabled(current, mode, enabled), revision: current.revision + 1 };
      localStorage.setItem(borrowingStorageKey(currentUser.schoolId), JSON.stringify(saved));
      setState(saved);
      setNotice({ text: `${mode === 'dates' ? '指定日期规则' : '每周固定规则'}已${enabled ? '生效' : '暂停'}`, tone: 'success' });
    } catch { setNotice({ text: '保存失败，请稍后重试。', tone: 'error' }); }
  };
  if (currentUser.role !== 'school-admin') return <p className="p-6">无权限查看学校借用管控。</p>;
  if (loadError || exception === 'load-failed') return <div className="dc-list-card p-8 text-center"><p>借用管控加载失败，请重试。</p><button className="dc-btn mt-4" onClick={() => { setException(undefined); refresh(); }}>重新加载</button></div>;
  const compactScope = (ids: string[]) => scopeNames(ids).join('、').replace(/年级、/g, '、');
  const stoppedClassIds = empty ? [] : allClasses.filter(id => classTemporarilyDenied(state, id));
  const addRule = (mode: BorrowSchedule['mode']) => {
    if (mode === 'weekly' && selectableRows.length > 0 && selectableRows.every(row => row.classIds.some(id => (state.classRules[id] ?? []).some(rule => rule.mode === 'weekly')))) {
      setNotice({ text: '全部年级已有规则，请编辑或删除后新增', tone: 'info' });
      return;
    }
    openRule({ label: '请选择年级', classIds: [] }, newBorrowSchedule(mode));
    setEditing(current => current ? { ...current, chooseGrades: true } : current);
  };
  return <>
    <div className="borrow-order-description borrow-order-strip">生效优先级：全校停止借用 ＞ 指定日期规则 ＞ 每周固定规则；无规则时默认可借。<button type="button" className="borrow-rule-help" aria-label="查看借用规则" aria-haspopup="dialog" onClick={() => setRuleHelpOpen(true)}><Info size={17} /></button></div>
    <section className="borrow-policy-section borrow-policy-section--primary" aria-label="全校借用管控">
      <header className="borrow-policy-heading"><div className="borrow-policy-title"><h2>全校借用管控</h2></div><button disabled={!selectableRows.length} className="dc-btn-primary" onClick={() => openTemporary(allBorrowingStopped)}>{allBorrowingStopped ? '全校恢复借用' : '全校停止借用'}</button></header>
      {stoppedClassIds.length > 0 && <div className="borrow-policy-list"><article className="borrow-policy-row" aria-label="已停止借用规则"><div className="borrow-policy-content"><h3>{compactScope(stoppedClassIds)}</h3><p>已停止借用</p></div>{!allBorrowingStopped && <button type="button" className="dc-btn borrow-restore-button" onClick={() => openTemporary(true)}>恢复借用</button>}</article></div>}
    </section>
    {(['dates', 'weekly'] as const).map(mode => {
      const groups = groupBorrowingRules(state, empty ? [] : allClasses, mode).sort((a, b) => mode === 'dates' ? a.rule.startDate.localeCompare(b.rule.startDate) : 0);
      return <section className={`borrow-policy-section borrow-policy-section--${mode}`} key={mode} aria-label={mode === 'dates' ? '指定日期规则' : '每周固定规则'}>
        <header className="borrow-policy-heading"><div className="borrow-policy-title"><h2>{mode === 'dates' ? '指定日期规则' : '每周固定规则'}</h2><span className="borrow-policy-hint">{mode === 'dates' ? '禁止借用日期' : '每周可用时间'}</span></div><label className="borrow-rule-enabled"><span>生效</span><button type="button" role="switch" aria-label={`${mode === 'dates' ? '指定日期规则' : '每周固定规则'}生效`} aria-checked={borrowingRuleTypeEnabled(state, mode)} disabled={!selectableRows.length} onClick={() => toggleRuleType(mode)}><span /></button></label></header>
        {borrowingRuleTypeEnabled(state, mode) && <div className="borrow-policy-list">{groups.map(({ key, rule, entries }) => {
          const grades = new Set(schoolDeviceClasses.filter(group => entries.some(entry => entry.classId === group.id)).map(group => group.grade));
          const classIds = schoolDeviceClasses.filter(group => grades.has(group.grade)).map(group => group.id);
          const target = { label: compactScope(classIds), classIds };
          const detail = mode === 'dates' ? scheduleDateText(rule) : ruleText(rule);
          return <article key={key} className="borrow-policy-row"><div className="borrow-policy-content"><h3>{target.label}</h3>{detail.split('；').map((line, index) => <p key={index}>{line}</p>)}</div><div className="borrow-policy-row-actions"><button aria-label={`编辑${target.label}${mode === 'dates' ? '日期' : '每周'}规则`} onClick={() => openRule(target, rule, rule.id, entries)}>编辑</button><button aria-label={`删除${target.label}${mode === 'dates' ? '日期' : '每周'}规则`} onClick={() => deleteRule(target, rule, entries)}>删除</button></div></article>;
        })}{!groups.length && <p className="borrow-policy-empty text-center">{mode === 'dates' ? '暂无日期规则，可新增日期规则' : '暂无每周规则，可新增每周规则'}</p>}</div>}
        {borrowingRuleTypeEnabled(state, mode) && <footer className="borrow-policy-footer"><button type="button" className="borrow-policy-add" disabled={!selectableRows.length} onClick={() => addRule(mode)}>{mode === 'dates' ? '新增日期规则' : '新增每周规则'}</button></footer>}
      </section>;
    })}
    {ruleHelpOpen && <DeviceControlLayer labelId="borrow-rule-help-title" onClose={() => setRuleHelpOpen(false)}>{close => <>
      <header className="borrow-policy-heading border-b"><h2 id="borrow-rule-help-title" className="text-xl font-bold">借用规则</h2><button type="button" aria-label="关闭借用规则" onClick={close}><X size={20} /></button></header>
      <div className="dc-panel-body space-y-6"><ol className="borrow-rule-help-list">
        <li><h3>全校停止借用</h3><p>所选年级不可借用，需手动恢复。</p></li>
        <li><h3>指定日期规则</h3><p>这些日期全天不可借用，每周规则暂不生效。</p></li>
        <li><h3>每周固定规则</h3><p>按所选星期和时段借用；不设时段则全天可借。</p></li>
        <li><h3>默认借用</h3><p>学校停用和禁止借用日期除外，没有每周规则时可随时借用。</p></li>
      </ol><p className="border-t pt-4 text-sm leading-7 text-slate-500">班主任禁止借用的学生由班主任解除后按照学校规则借用</p></div>
      <footer className="dc-confirm-footer"><button type="button" className="dc-btn-primary" onClick={close}>我知道了</button></footer>
    </>}</DeviceControlLayer>}
    {gradeTemporaryOpen && !confirm && <DeviceControlLayer labelId="borrow-grade-temporary" onClose={() => setGradeTemporaryOpen(false)}>{close => <><header className="borrow-policy-heading"><h2 id="borrow-grade-temporary" className="text-xl font-bold">{restoringBorrowing ? '恢复借用' : '全校停止借用'}</h2><button aria-label="关闭借用管控设置" onClick={close}><X size={20} /></button></header><div className="dc-panel-body space-y-6">
      <fieldset className="borrow-temporary-scope"><legend className="mb-3 text-sm font-semibold"><span className="mr-1 text-red-500" aria-hidden="true">*</span>设置范围</legend><label className="borrow-school-choice"><input type="checkbox" disabled={!temporaryRows.length} checked={temporaryRows.length > 0 && temporaryRows.every(row => temporaryGrades.includes(row.grade))} onChange={event => setTemporaryGrades(event.target.checked ? temporaryRows.map(row => row.grade) : [])} />全校</label><div className="borrow-temporary-grades">{rows.map(row => <label key={row.id} className={!temporaryRows.includes(row) ? 'borrow-grade-disabled' : undefined}><input type="checkbox" disabled={!temporaryRows.includes(row)} checked={temporaryRows.includes(row) && temporaryGrades.includes(row.grade)} onChange={event => setTemporaryGrades(current => event.target.checked ? [...current, row.grade] : current.filter(grade => grade !== row.grade))} />{row.label}</label>)}</div></fieldset>
      </div><footer className="dc-confirm-footer"><button className="dc-btn" onClick={close}>取消</button><button className="dc-btn-primary" disabled={!selectedTemporaryRows.length} onClick={() => { const classIds = selectedTemporaryRows.flatMap(row => row.classIds); const all = classIds.length === allClasses.length; askTemporary({ label: all ? '全校' : compactScope(classIds), classIds }, !restoringBorrowing, all || (restoringBorrowing && state.schoolTemporaryActive && allClasses.filter(id => classTemporarilyDenied(state, id)).every(id => classIds.includes(id)))); }}>{restoringBorrowing ? '确认恢复' : '确认停止'}</button></footer></>}</DeviceControlLayer>}
    {editing && <SchoolBorrowingRuleEditor key={editing.rule.id} chooseGrades={editing.chooseGrades} rule={editing.rule} grades={rows.map(row => ({ grade: row.grade, label: row.label, count: studentCount(row.classIds), disabled: !studentCount(row.classIds), hasWeeklyRule: row.classIds.some(id => (state.classRules[id] ?? []).some(rule => rule.mode === 'weekly')) }))} initialGrades={[...new Set(schoolDeviceClasses.filter(group => editing.classIds.includes(group.id)).map(group => group.grade))]} backToList={false} editing={!!editing.editingId} error={ruleError} onClearError={() => setRuleError('')} onClose={() => setEditing(null)} onSave={saveRule} />}
    {confirm && <DeviceControlLayer labelId="borrow-confirm" variant="dialog" level={3} onClose={() => setConfirm(null)}>{close => <><header className="border-b p-6"><h2 id="borrow-confirm" className="text-xl font-bold">{confirm.title}</h2></header><div className="dc-panel-body space-y-4"><p className="font-bold text-indigo-700">{confirm.scope.label}</p><p className="text-sm leading-7">{confirm.description}</p>{confirm.conflictDetails?.length ? <div className="rounded-lg bg-slate-50 p-3 text-sm"><p className="font-medium text-slate-700">将覆盖的已有规则</p><ul className="mt-2 max-h-32 space-y-1 overflow-y-auto text-slate-600">{confirm.conflictDetails.map(detail => <li key={detail}>{detail}</li>)}</ul></div> : null}</div><footer className="flex justify-end gap-3 border-t p-5"><button className="dc-btn" onClick={close}>取消</button><button className="dc-btn-primary" onClick={commit}>确认并生效</button></footer></>}</DeviceControlLayer>}
    {notice && <ControlToast message={notice.text} tone={notice.tone} onClose={() => setNotice(null)} />}
  </>;
};
