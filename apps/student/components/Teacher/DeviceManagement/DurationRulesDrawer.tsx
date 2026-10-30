import React from 'react';
import { X } from 'lucide-react';
import { durationRuleText, weekdayRangeText } from '../data/hierarchicalDeviceControl';
import { DurationRuleGroup } from '../data/durationRuleGroups';
import { DeviceControlLayer } from './DeviceControlLayer';

export const DurationRulesDrawer: React.FC<{
  ids: string[]; label: string; groups: DurationRuleGroup[];
  onClose: () => void; onAdd: () => void; onEdit: (group: DurationRuleGroup) => void; onDelete: (group: DurationRuleGroup) => void;
}> = ({ label, groups, onClose, onAdd, onEdit, onDelete }) => {
  return <DeviceControlLayer labelId="duration-rules-title" onClose={onClose}>{close => <>
    <header className="flex items-center justify-between border-b p-6"><h2 id="duration-rules-title" className="text-xl font-bold">使用时长规则 · {label}</h2><button type="button" aria-label="关闭规则列表" onClick={close}><X size={20} /></button></header>
    <div className="dc-panel-body space-y-4"><p className="text-sm leading-6 text-slate-500">仅展示学校管理员设置的年级规则，班主任调整不影响此处展示。编辑后统一应用到整个年级；未涉及的星期保留原设置，未配置的星期执行默认规则。</p>
      {groups.map(group => <section className="rounded-xl border border-slate-200 p-4" key={group.key}>
        <h3 className="font-bold text-slate-800">{weekdayRangeText(group.rule.weekdays)}{group.fallback ? ' · 默认规则' : ''}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">{durationRuleText(group.rule)}</p>
        <p className="mt-2 text-xs leading-6 text-slate-500">{label}</p>
        {(group.fallback || group.rule.source === 'homeroom') && <p className="mt-1 text-xs text-slate-500">{group.fallback ? '系统默认；可为这些星期新增规则。' : '班主任设置'}</p>}
        {!group.fallback && <div className="mt-3 flex gap-3"><button type="button" className="dc-btn" onClick={() => onEdit(group)}>编辑</button><button type="button" className="dc-btn" onClick={() => onDelete(group)}>删除</button></div>}
      </section>)}
      <button type="button" className="dc-btn-primary" disabled={new Set(groups.filter(group => !group.fallback).flatMap(group => group.rule.weekdays)).size === 7} onClick={onAdd}>新增使用时长规则</button>
    </div>
  </>}</DeviceControlLayer>;
};
