import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { LockRule, createLockRule } from '../data/deviceControlRules';
import { PORTAL_CLASSES } from '../data/teacherAccess';

export const validateLockRules = (rules: LockRule[]): string | null => {
  for (const [index, rule] of rules.entries()) {
    if (rule.scope !== 'school' && !rule.grade) return `规则 ${index + 1}：请选择年级`;
    if (rule.scope === 'class' && !PORTAL_CLASSES.some(c => c.id === rule.classId && String(c.grade) === rule.grade)) return `规则 ${index + 1}：请选择班级`;
  }
  return null;
};

export const LockRules: React.FC<{ rules: LockRule[]; onChange: (rules: LockRule[]) => void; showErrors: boolean }> = ({ rules, onChange, showErrors }) => {
  const update = (id: number, changes: Partial<LockRule>) => onChange(rules.map(rule => rule.id === id ? { ...rule, ...changes } : rule));
  const grades = [...new Set(PORTAL_CLASSES.map(c => c.grade))].sort((a, b) => a - b);
  return <><h2 className="font-bold text-slate-900">锁屏管控规则</h2><p className="mt-2 text-sm text-slate-500">按全校、年级或班级分别设置锁屏规则，每个班级可以独立配置。</p><div className="mt-6 space-y-5">
    {rules.map((rule, index) => <section key={rule.id} className="rounded-xl border border-blue-100 bg-[#f4f8ff] p-6"><div className="mb-6 flex items-center justify-between border-b border-blue-100 pb-4"><h3 className="font-bold text-slate-800">规则 {index + 1}</h3><button type="button" onClick={() => onChange(rules.filter(r => r.id !== rule.id))} aria-label={`删除锁屏规则${index + 1}`} className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-600"><Trash2 size={15} />删除规则</button></div><div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4"><span className="w-40 text-right text-sm text-slate-600"><span className="text-red-500">* </span>管控范围</span>{([['school','全校'],['grade','指定年级'],['class','指定班级']] as const).map(([scope,label]) => <label key={scope} className="flex items-center gap-2 text-sm text-slate-600"><input type="radio" name={`lock-scope-${rule.id}`} checked={rule.scope === scope} onChange={() => update(rule.id, { scope, grade: '', classId: '' })} />{label}</label>)}</div>
      {rule.scope !== 'school' && <div className="flex flex-wrap items-start gap-4"><label htmlFor={`lock-grade-${rule.id}`} className="w-40 pt-2 text-right text-sm text-slate-600"><span className="text-red-500">* </span>年级选择</label><div><select id={`lock-grade-${rule.id}`} value={rule.grade} onChange={e => update(rule.id, { grade: e.target.value, classId: '' })} className="min-w-60 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"><option value="">请选择年级</option>{grades.map(grade => <option key={grade} value={grade}>{grade}年级</option>)}</select>{showErrors && !rule.grade && <p className="mt-1 text-xs text-red-500">请选择年级</p>}</div></div>}
      {rule.scope === 'class' && <div className="flex flex-wrap items-start gap-4"><label htmlFor={`lock-class-${rule.id}`} className="w-40 pt-2 text-right text-sm text-slate-600"><span className="text-red-500">* </span>班级选择</label><div><select id={`lock-class-${rule.id}`} disabled={!rule.grade} value={rule.classId} onChange={e => update(rule.id, { classId: e.target.value })} className="min-w-60 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm disabled:opacity-50"><option value="">请选择班级</option>{PORTAL_CLASSES.filter(c => String(c.grade) === rule.grade).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>{showErrors && !rule.classId && <p className="mt-1 text-xs text-red-500">请选择班级</p>}</div></div>}
      <div className="flex items-center gap-4"><span className="w-40 text-right text-sm text-slate-600">锁屏设置</span><button type="button" role="switch" aria-label={`规则${index + 1}锁屏`} aria-checked={rule.enabled} onClick={() => update(rule.id, { enabled: !rule.enabled })} className={`relative h-6 w-11 rounded-full ${rule.enabled ? 'bg-indigo-600' : 'bg-slate-300'}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white ${rule.enabled ? 'left-6' : 'left-1'}`} /></button><span className="text-sm text-slate-600">{rule.enabled ? '开启锁屏' : '关闭锁屏'}</span></div>
    </div></section>)}
    {!rules.length && <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">暂无锁屏规则，请添加规则。</div>}
    <button type="button" onClick={() => onChange([...rules, createLockRule(Math.max(0, ...rules.map(r => r.id)) + 1)])} className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-bold text-white"><Plus size={17} />新增锁屏管控规则</button>
  </div></>;
};
