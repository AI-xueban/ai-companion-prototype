import React from 'react';

export const ControlGradeSelector: React.FC<{
  options: { grade: number; label: string; disabled?: boolean; hint?: string }[];
  selected: number[]; onChange: (grades: number[]) => void;
}> = ({ options, selected, onChange }) => {
  const available = options.filter(option => !option.disabled).map(option => option.grade);
  const all = available.length > 0 && available.every(grade => selected.includes(grade));
  return <fieldset className="space-y-3"><legend className="mb-3 text-sm font-bold"><span className="mr-1 text-red-500" aria-hidden="true">*</span>选择年级</legend>
    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={all} disabled={!available.length} onChange={() => onChange(all ? [] : available)} />全部</label>
    <div className="flex flex-wrap gap-3">{options.map(option => <label key={option.grade} className="dc-choice"><input type="checkbox" checked={selected.includes(option.grade)} disabled={option.disabled} onChange={() => onChange(selected.includes(option.grade) ? selected.filter(grade => grade !== option.grade) : [...selected, option.grade])} />{option.label}{option.hint && <small className="text-xs text-slate-400">{option.hint}</small>}</label>)}</div>
  </fieldset>;
};
