import React from 'react';
import { RuleEffectSwitch } from './RuleEffectSwitch';
import { DurationRuleGroup } from '../data/durationRuleGroups';
import { durationRuleText, weekdayRangeText } from '../data/hierarchicalDeviceControl';
import './SchoolBorrowingControl.css';

export const SchoolDurationRuleList: React.FC<{
  defaultIds: string[]; groups: DurationRuleGroup[]; label: (ids: string[]) => string; disabled?: boolean;
  onAdd: () => void; onEdit: (group: DurationRuleGroup) => void; onDelete: (group: DurationRuleGroup) => void;
  enabled?: boolean; onToggle?: () => void;
}> = ({ defaultIds, groups, label, disabled, onAdd, onEdit, onDelete, enabled = true, onToggle }) => <>
  <section className="borrow-policy-section borrow-default-summary" aria-label="默认使用时长规则"><div className="borrow-policy-content">{!!defaultIds.length && <p>{label(defaultIds)}</p>}<p>周一至周日 · 连续60分钟 · 休息15分钟 · 每日累计180分钟 · 不限可用时段</p></div><span className="borrow-default-label">默认规则</span></section>
  <section className="borrow-policy-section" aria-label="使用时长规则">
  <header className="borrow-policy-heading"><div className="borrow-policy-title"><h2>使用时长规则</h2></div>{onToggle && <RuleEffectSwitch label="使用时长规则" enabled={enabled} disabled={disabled} onToggle={onToggle} />}</header>
  {enabled && <div className="borrow-policy-list">{groups.map(group => <article className="borrow-policy-row" key={group.key}>
    <div className="borrow-policy-content"><h3>{label(group.ids)}</h3><p>{weekdayRangeText(group.rule.weekdays)}</p><p>{durationRuleText(group.rule)}</p></div>
    <div className="borrow-policy-row-actions"><button aria-label={`编辑${label(group.ids)}使用时长规则`} onClick={() => onEdit(group)}>编辑</button><button aria-label={`删除${label(group.ids)}使用时长规则`} onClick={() => onDelete(group)}>删除</button></div>
  </article>)}{!groups.length && <p className="borrow-policy-empty">{disabled ? '学校暂无可设置的年级' : '暂无自定义规则'}</p>}</div>}
  {enabled && <footer className="borrow-policy-footer"><button className="borrow-policy-add" disabled={disabled} onClick={onAdd}>新增自定义规则</button></footer>}
</section></>;
