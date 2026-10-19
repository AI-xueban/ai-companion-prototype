import React from 'react';
import { schoolDeviceClasses } from '../data/schoolDeviceClasses';

export const RuleClassSelector: React.FC<{ readOnly?: boolean; grade: string; selected: string[]; onGrade: (grade: string) => void; onSelect: (ids: string[]) => void }> = ({ grade, selected, onGrade, onSelect, readOnly }) => {
  const visible = schoolDeviceClasses.filter(c=>!grade || grade==='all' || String(c.grade)===grade);
  if (readOnly) { const target = schoolDeviceClasses.find(c=>c.id===selected[0]); return <div className="grid grid-cols-[100px_1fr] gap-4 text-sm"><span className="text-right text-slate-600">年级</span><span>{target?.grade ?? grade}年级</span><span className="text-right text-slate-600">班级</span><span>{target?.name.replace(/^.*年级/,'') ?? '—'}</span></div>; }
  return <div className="space-y-4">
    <div className="grid grid-cols-[100px_1fr] items-center gap-4"><label className="text-right text-sm text-slate-600">年级</label><select aria-label="规则年级" value={grade || 'all'} onChange={e=>onGrade(e.target.value)} className="w-48 rounded-lg border bg-white p-2 text-sm"><option value="all">全部年级</option>{[...new Set(schoolDeviceClasses.map(c=>c.grade))].map(g=><option key={g} value={g}>{g}年级</option>)}</select></div>
    <div className="grid grid-cols-[100px_1fr] items-start gap-4"><span className="pt-2 text-right text-sm text-slate-600">班级</span><div className="min-w-0"><div className="mb-3 flex gap-4 text-sm"><button type="button" onClick={()=>onSelect([...new Set([...selected,...visible.map(c=>c.id)])])} className="text-indigo-600">全选当前年级班级</button><button type="button" onClick={()=>onSelect([])} className="text-slate-500">清空</button></div><div className="grid max-h-52 grid-cols-2 gap-3 overflow-y-auto rounded-lg border bg-white p-3">{visible.map(c=><label key={c.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={selected.includes(c.id)} onChange={()=>onSelect(selected.includes(c.id)?selected.filter(id=>id!==c.id):[...selected,c.id])}/>{c.name}</label>)}</div><p className="mt-2 text-xs leading-6 text-slate-500">已选 {selected.length} 个班级，保存后每班生成一条规则。</p></div></div>
  </div>;
};
