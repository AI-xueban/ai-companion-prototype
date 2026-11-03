import React from 'react';
import { ControlModule, durationRuleText, StudentControl, weekdayRangeText } from '../data/hierarchicalDeviceControl';
import { SchoolDurationPolicies, schoolDurationGroups } from '../data/schoolDurationPolicies';
import './SchoolBorrowingControl.css';

type Row = { id: string; label: string; ids: string[]; grade?: number; classId?: string };
export const ControlScopeCards: React.FC<{
  durationPolicies: SchoolDurationPolicies;
  module: ControlModule; rows: Row[]; rowType: string; controls: Record<string, StudentControl>;
  batch: boolean; selected: string[]; onBatch: () => void; onSelect: (ids: string[]) => void;
  onSettings: (row: Row) => void;
  onBatchSettings: () => void; lockState: (ids: string[]) => string; lockAction: (ids: string[]) => string;
  recentOperation: (ids: string[]) => { title: string; operator: string; at: string } | undefined;
  emptyTitle?: string; emptyDescription?: string;
}> = ({ durationPolicies, module, rows, rowType, controls, batch: requestedBatch, selected, onBatch, onSelect, onSettings, onBatchSettings, lockState, lockAction, recentOperation, emptyTitle, emptyDescription }) => {
  const batch = requestedBatch && module !== 'lock';
  const toggle = (id: string) => onSelect(selected.includes(id) ? selected.filter(value => value !== id) : [...selected, id]);
  const selectableRows = rows.filter(row => row.ids.length > 0);
  const selectedRows = selectableRows.filter(row => selected.includes(row.id));
  const all = selectableRows.length > 0 && selectableRows.every(row => selected.includes(row.id));
  const action = (ids: string[]) => module === 'duration' ? '设置规则' : module === 'homework' ? '设置权限' : module === 'world' ? '设置使用状态' : lockAction(ids);
  const heading = module === 'duration' ? '使用时长规则' : module === 'homework' ? '智阅作业管控' : module === 'world' ? '万象视界管控' : `${rowType}管控`;
  const settingLabel = module === 'duration' ? '设置全校使用时长规则' : module === 'homework' ? '设置全校权限' : module === 'world' ? '设置全校使用状态' : '批量操作';
  return <section className="dc-list-card overflow-hidden">
    <div className="dc-list-heading borrow-list-heading flex flex-wrap items-center justify-between gap-3">
      <h3 className="font-bold text-slate-900">{heading}</h3>
      {module !== 'lock' && <button type="button" className="dc-btn borrow-batch-toggle" aria-pressed={batch} disabled={!selectableRows.length} onClick={onBatch}>{batch ? '退出设置' : settingLabel}</button>}
    </div>
    {batch && <div className="borrow-batch-bar">
      <label className="borrow-select-all"><input type="checkbox" aria-label="全选当前层级" checked={all} disabled={!selectableRows.length} onChange={() => onSelect(all ? [] : selectableRows.map(row => row.id))} />全选当前层级</label>
      <span>已选 {selectedRows.length} 个{rowType} · {selectedRows.reduce((sum, row) => sum + row.ids.length, 0)} 名学生</span>
      <div className="borrow-batch-actions"><button type="button" className="dc-btn-primary" disabled={!selectedRows.length} onClick={onBatchSettings}>{module === 'duration' ? '新增使用时长规则' : action(selectedRows.flatMap(row => row.ids))}</button></div>
    </div>}
    <div className="borrow-card-grid">
      {rows.map((row, index) => {
        const stageHeader = !row.classId && row.grade !== undefined && (index === 0 || ((rows[index - 1].grade ?? 0) <= 6) !== (row.grade <= 6)) && <h4 className="borrow-stage-heading">{row.grade <= 6 ? '小学' : '初中'}</h4>;
        if (!row.ids.length) return <React.Fragment key={row.id}>{stageHeader}<article className="borrow-scope-card" aria-disabled="true"><div className="borrow-card-heading"><div className="borrow-card-title"><h4>{row.label}</h4></div></div><div className="borrow-card-rules"><p className="borrow-card-placeholder">{row.classId ? '该班级暂无学生' : '该年级暂无学生'}</p></div></article></React.Fragment>;
        const entries = row.ids.map(id => controls[id]).filter(Boolean);
        const latest = recentOperation(row.ids);
        const duration = module === 'duration' ? schoolDurationGroups(row.ids, durationPolicies[row.grade ?? ""] ?? []) : [];
        const permission = (field: 'answer' | 'explanation' | 'world') => {
          const count = entries.filter(entry => entry[field]).length;
          return count === 0 ? '不允许' : count === entries.length ? '允许' : '部分学生允许';
        };
        return <React.Fragment key={row.id}>{stageHeader}<article className={`borrow-scope-card ${batch ? 'borrow-scope-card--selectable' : ''}`}
          role={batch ? 'checkbox' : undefined} aria-label={batch ? `选择${row.label}` : undefined} aria-checked={batch ? selected.includes(row.id) : undefined}
          tabIndex={batch ? 0 : undefined} onClick={batch ? () => toggle(row.id) : undefined}
          onKeyDown={batch ? event => { if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); toggle(row.id); } } : undefined}>
          <div className="borrow-card-heading">
            {batch && <span className="borrow-card-checkbox" aria-hidden="true" />}
            <div className="borrow-card-title"><h4>{row.label}</h4></div>
          </div>
          <div className="borrow-card-rules">
            {module === 'duration' && duration.slice(0, 2).map(group => <div className="borrow-card-rule" key={group.key}><strong>{weekdayRangeText(group.rule.weekdays)}{group.fallback ? ' · 默认规则' : ''}</strong><span>{durationRuleText(group.rule)}</span></div>)}
            {module === 'duration' && !batch && duration.length > 2 && <button type="button" className="borrow-card-more" onClick={() => onSettings(row)}>查看全部规则</button>}
            {module === 'homework' && <><div className="borrow-card-rule"><strong>查看答案</strong><span>{permission('answer')}</span></div><div className="borrow-card-rule"><strong>查看详解</strong><span>{permission('explanation')}</span></div></>}
            {module === 'world' && <div className="borrow-card-rule"><strong>万象视界使用状态</strong><span>{permission('world') === '不允许' ? '禁止使用' : permission('world') === '允许' ? '允许使用' : '部分学生允许使用'}</span></div>}
            {module === 'lock' && <div className="borrow-card-rule"><strong>临时锁屏</strong><span>{lockState(row.ids)}</span></div>}
          </div>
          {!batch && <div className="borrow-card-footer">{latest && <details className="borrow-card-history"><summary>最近操作</summary><p>{latest.title} · {latest.operator} · {latest.at}</p></details>}<div className="borrow-card-actions"><button type="button" className="dc-btn" onClick={() => onSettings(row)}>{action(row.ids)}</button></div></div>}
        </article></React.Fragment>;
      })}
      {!rows.length && <div className="borrow-card-empty"><p>{emptyTitle ?? `暂无${rowType}`}</p><p>{emptyDescription ?? '当前范围暂无数据'}</p></div>}
    </div>
    <div className="px-5 py-3 text-sm text-slate-500">共 {rows.length} 个{rowType}</div>
  </section>;
};
