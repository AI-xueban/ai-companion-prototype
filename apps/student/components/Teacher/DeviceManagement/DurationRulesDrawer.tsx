import React from 'react';
import { X } from 'lucide-react';
import { durationRuleText, StudentControl, weekdayRangeText } from '../data/hierarchicalDeviceControl';
import { DurationRuleGroup, groupDurationRules } from '../data/durationRuleGroups';
import { deviceControlStudents } from '../data/hierarchicalDeviceControl';
import { schoolDeviceClasses } from '../data/schoolDeviceClasses';
import { DeviceControlLayer } from './DeviceControlLayer';

export const DurationRulesDrawer: React.FC<{
  ids: string[]; label: string; controls: Record<string, StudentControl>;
  onClose: () => void; onAdd: () => void; onEdit: (group: DurationRuleGroup) => void; onDelete: (group: DurationRuleGroup) => void;
}> = ({ ids, label, controls, onClose, onAdd, onEdit, onDelete }) => {
  const groups = groupDurationRules(ids, controls);
  const scopeText = (group: DurationRuleGroup) => {
    const selected = new Set(group.ids);
    return [...new Set(schoolDeviceClasses.map(item => item.grade))].flatMap(grade => {
      const classes = schoolDeviceClasses.filter(item => item.grade === grade);
      const classIds = new Set(classes.map(item => item.id));
      const gradeStudents = deviceControlStudents.filter(student => classIds.has(student.classId));
      if (gradeStudents.length && gradeStudents.every(student => selected.has(student.id))) return [`${grade}年级`];
      return classes.flatMap(item => {
        const students = gradeStudents.filter(student => student.classId === item.id);
        const count = students.filter(student => selected.has(student.id)).length;
        return count ? [`${item.name}${count === students.length ? '' : '（部分学生）'}`] : [];
      });
    }).join('、');
  };
  return <DeviceControlLayer labelId="duration-rules-title" onClose={onClose}>{close => <>
    <header className="flex items-center justify-between border-b p-6"><h2 id="duration-rules-title" className="text-xl font-bold">使用时长规则 · {label}</h2><button type="button" aria-label="关闭规则列表" onClick={close}><X size={20} /></button></header>
    <div className="dc-panel-body space-y-4"><p className="text-sm leading-6 text-slate-500">逐条查看当前规则。编辑带入原配置，仅修改该条规则的适用范围；未配置的星期执行默认规则。</p>
      {groups.map(group => <section className="rounded-xl border border-slate-200 p-4" key={group.key}>
        <h3 className="font-bold text-slate-800">{weekdayRangeText(group.rule.weekdays)}{group.fallback ? ' · 默认规则' : ''}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">{durationRuleText(group.rule)}</p>
        <p className="mt-2 text-xs leading-6 text-slate-500">{scopeText(group)}</p>
        {(group.fallback || group.rule.source === 'homeroom') && <p className="mt-1 text-xs text-slate-500">{group.fallback ? '系统默认；设置其他规则可覆盖对应星期。' : '班主任设置'}</p>}
        {!group.fallback && <div className="mt-3 flex gap-3"><button type="button" className="dc-btn" onClick={() => onEdit(group)}>编辑</button><button type="button" className="dc-btn" onClick={() => onDelete(group)}>删除</button></div>}
      </section>)}
      <button type="button" className="dc-btn-primary" onClick={onAdd}>新增使用时长规则</button>
    </div>
  </>}</DeviceControlLayer>;
};
