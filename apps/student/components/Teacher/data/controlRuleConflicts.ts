import { BorrowingRule } from './deviceControlRules';
import { schoolDeviceClasses } from './schoolDeviceClasses';

export interface Schedule { scheduleMode?: 'weekly' | 'dates'; weekdays: number[]; startDate?: string; endDate?: string }
export interface ScheduleExclusion extends Schedule { classId: string }
export const controlClassIds = (rule: { scope: 'school' | 'grade' | 'class'; grade: string; classId: string; excludedClassIds?: string[] }) => schoolDeviceClasses.filter(c => (rule.scope === 'school' || (rule.scope === 'grade' ? String(c.grade) === rule.grade : c.id === rule.classId)) && !rule.excludedClassIds?.includes(c.id)).map(c => c.id);
export const scheduleApplies = (rule: Schedule, date: string) => rule.scheduleMode === 'dates' ? !!(rule.startDate && rule.endDate && date >= rule.startDate && date <= rule.endDate) : rule.weekdays.includes((new Date(date + 'T12:00:00Z').getUTCDay() + 6) % 7);
export const borrowingRuleApplies = (rule: BorrowingRule, classId: string, date: string) => controlClassIds(rule).includes(classId) && scheduleApplies(rule, date) && !rule.exclusions?.some(e => e.classId === classId && scheduleApplies(e, date));
const shifted = (date: string, days: number) => { const d = new Date(date + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0,10); };
export const firstConflictDate = (old: BorrowingRule, added: BorrowingRule, classId: string): string | null => {
  if ((old.scheduleMode ?? 'weekly') !== (added.scheduleMode ?? 'weekly')) return null;
  const ranges = [old,added].filter(r => r.scheduleMode === 'dates');
  const start = ranges.length ? ranges.map(r=>r.startDate!).sort().at(-1)! : '2026-01-05';
  const end = ranges.length ? ranges.map(r=>r.endDate!).sort()[0] : '9999-12-31';
  if (start > end) return null;
  const boundaries = [start, ...(old.exclusions ?? []).filter(e=>e.classId===classId && e.scheduleMode==='dates').flatMap(e=>[e.startDate!,shifted(e.endDate!,1)])];
  const candidates = [...new Set(boundaries.flatMap(d=>Array.from({length:7},(_,i)=>shifted(d,i))))].filter(d=>d>=start && d<=end).sort();
  return candidates.find(d=>borrowingRuleApplies(old,classId,d) && scheduleApplies(added,d)) ?? null;
};
export interface BorrowingConflict { classId: string; date: string }
export const findBorrowingConflicts = (existing: BorrowingRule[], added: BorrowingRule[]): BorrowingConflict[] => {
  const found = new Map<string,BorrowingConflict>();
  for (const rule of added) for (const old of existing) for (const classId of controlClassIds(rule)) {
    if (found.has(classId) || !controlClassIds(old).includes(classId)) continue;
    const date=firstConflictDate(old,rule,classId); if(date)found.set(classId,{classId,date});
  }
  return [...found.values()];
};
export const applyBorrowingOverwrite = (existing: BorrowingRule[], added: BorrowingRule[]): BorrowingRule[] => [...existing.map(old => {
  const exclusions=[...(old.exclusions ?? [])];
  for(const rule of added) for(const classId of controlClassIds(rule)) if(controlClassIds(old).includes(classId) && firstConflictDate(old,rule,classId)) exclusions.push({classId,scheduleMode:rule.scheduleMode,weekdays:[...rule.weekdays],startDate:rule.startDate,endDate:rule.endDate});
  return {...old,exclusions};
}),...added];

export const effectiveBorrowingRule = (rules: BorrowingRule[], classId: string, date: string) => {
  const applicable = rules.filter(r => borrowingRuleApplies(r,classId,date));
  return applicable.find(r=>r.scheduleMode==='dates') ?? applicable.find(r=>r.scheduleMode!=='dates');
};
export const canBorrowAt = (enabled: boolean, rules: BorrowingRule[], classId: string, date: string, time: string) => {
  if (!enabled) return true;
  const rule = effectiveBorrowingRule(rules,classId,date);
  return !!rule && rule.accessMode !== 'deny' && rule.periods.some(p=>p.start <= time && time < p.end);
};

export const expandClassRules = <T extends {id:number;scope:'school'|'grade'|'class';grade:string;classId:string;excludedClassIds?:string[]}>(rules:T[]):T[] => {
  let nextId=Math.max(0,...rules.map(r=>r.id))+1;
  return rules.flatMap(r=>r.scope==='class'?[r]:controlClassIds(r).map((classId,i)=>({...r,id:i===0?r.id:nextId++,scope:'class' as const,classId,grade:String(schoolDeviceClasses.find(c=>c.id===classId)?.grade ?? '')})));
};
