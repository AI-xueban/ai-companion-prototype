import React, { useEffect, useRef, useState } from 'react';
import { X, ChevronRight, Clock3 } from 'lucide-react';
import { TeacherPortalUser } from '../data/teacherAccess';
import { ReportData, ReportScope, ReportView, REPORT_QUESTIONS, getViews, scopeClasses, scopeSubjects, minutesLabel, periodLabel, reportDate } from '../data/learningReportData';

export const panel = 'rounded-2xl border border-slate-200 bg-white p-5 lg:p-6';
export const selectStyle = 'rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700';
export const scopeNames: Record<ReportView, string> = { school: '全校', teaching: '我任教的班级', homeroom: '班主任班级' };

export function LearningScopeBar({ user, scope, onChange }: { user: TeacherPortalUser; scope: ReportScope; onChange: (scope: ReportScope) => void }) {
  const classes = scopeClasses(user, scope);
  const subjects = scopeSubjects(user, scope);
  const schoolOverview = scope.view === 'school' && scope.classId === 'all';
  const changeClass = (classId: string) => {
    const next = { ...scope, classId };
    onChange({ ...next, subject: scope.view === 'teaching' ? scopeSubjects(user, next).includes(scope.subject) ? scope.subject : scopeSubjects(user, next)[0] ?? '' : 'all' });
  };
  return <div className="shrink-0 border-b border-slate-200 bg-white px-6 py-3 lg:px-8">
    <div className="flex flex-wrap items-center gap-3">
      <span className="mr-2 text-sm font-bold text-indigo-700">{scope.view === 'school' ? '学校管理' : scope.view === 'homeroom' ? '班主任工作台' : '任课教师工作台'}</span>
      {schoolOverview && <select aria-label="学情年级" className={selectStyle} value={scope.grade} onChange={e => onChange({ ...scope, grade: e.target.value, subject: 'all' })}><option value="all">全部年级</option><option value="7">七年级</option><option value="8">八年级</option></select>}
      {!schoolOverview && <select aria-label="学情班级" className={selectStyle} value={scope.classId} onChange={e => changeClass(e.target.value)}>{!classes.length && <option value="">暂无可查看班级</option>}{classes.map(row => <option key={row.id} value={row.id}>{row.name}</option>)}</select>}
      {(scope.view !== 'homeroom' || scope.subject !== 'all') && <select aria-label="学情学科" className={selectStyle} value={scope.subject} onChange={e => onChange({ ...scope, subject: e.target.value })}>{scope.view !== 'teaching' && <option value="all">全部学科</option>}{!subjects.length && scope.view === 'teaching' && <option value="">暂无任教学科</option>}{subjects.map(subject => <option key={subject}>{subject}</option>)}</select>}
      <select aria-label="学情周期" className={selectStyle} value={scope.period} onChange={e => onChange({ ...scope, period: e.target.value as ReportScope['period'] })}><option value="7d">近 7 天</option><option value="30d">近 30 天</option></select>
    </div>
    <p className="mt-2 text-[11px] text-slate-400">{periodLabel(scope.period)} · 学伴应用内记录 · 演示快照{scope.view === 'teaching' ? ' · 当前班级的任教学科' : scope.view === 'homeroom' ? (scope.subject === 'all' ? ' · 本班各科学习情况' : ' · 当前所选学科') : ''}</p>
  </div>;
}
export function Metric({ label, value, note, onClick, accent = false }: { label: string; value: React.ReactNode; note: string; onClick?: () => void; accent?: boolean }) {
  const body = <><p className={`text-xs font-bold ${accent ? 'text-indigo-600' : 'text-slate-500'}`}>{label}</p><p className="mt-3 text-3xl font-black tracking-tight text-slate-900">{value}</p><p className="mt-2 text-xs text-slate-500">{note}</p></>;
  const style = `rounded-2xl border p-5 text-left ${accent ? 'border-indigo-100 bg-indigo-50/70' : 'border-slate-200 bg-white'}`;
  return onClick ? <button type="button" onClick={onClick} className={`${style} hover:border-indigo-300`} aria-label={`查看${label}`}>{body}</button> : <div className={style}>{body}</div>;
}

export function ReportModal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current();
      if (e.key === 'Tab') {
        const items = ref.current?.querySelectorAll<HTMLElement>('button, select, input, summary, [tabindex="0"]');
        if (!items?.length) return;
        const first = items[0], last = items[items.length - 1];
        if (e.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', handler);
    return () => { document.removeEventListener('keydown', handler); previous?.focus(); };
  }, []);
  return <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/35" onClick={onClose}><aside ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} className="h-full w-full max-w-[640px] overflow-y-auto bg-white p-6 outline-none shadow-2xl" onClick={e => e.stopPropagation()}><div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4"><h2 className="text-xl font-black text-slate-900">{title}</h2><button type="button" aria-label="关闭详情" onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100"><X size={18} /></button></div>{children}</aside></div>;
}

export function StudentLearningDetail({ studentId, data, scope, onClose }: { studentId: string; data: ReportData; scope: ReportScope; onClose: () => void }) {
  const [feature, setFeature] = useState('all');
  const student = data.roster.find(item => item.id === studentId);
  if (!student) return null;
  const all = data.activities.filter(item => item.studentId === studentId);
  const filtered = all.filter(item => feature === 'all' || item.feature === feature).sort((a, b) => a.day - b.day || b.start.localeCompare(a.start));
  const first = data.answers.filter(item => item.studentId === studentId && item.kind === '首次');
  const days = new Set(all.map(item => item.day)).size;
  return <ReportModal title={`${student.name}的学习明细`} onClose={onClose}>
    <p className="mt-4 text-sm text-slate-500">{student.className} · {scope.subject === 'all' ? (scope.view === 'teaching' ? '任教学科' : '全部学科') : scope.subject}</p><p className="mt-1 text-xs text-slate-400">{periodLabel(scope.period)} · 演示数据</p>
    <div className="my-5 grid grid-cols-3 gap-3 rounded-xl bg-indigo-50 p-4 text-center"><div><strong className="block text-xl text-indigo-900">{all.length ? all.reduce((sum, item) => sum + item.minutes, 0) : '—'}</strong><span className="text-xs text-indigo-600">学习分钟</span></div><div><strong className="block text-xl text-indigo-900">{days}</strong><span className="text-xs text-indigo-600">学习天数</span></div><div><strong className="block text-xl text-indigo-900">{first.length}</strong><span className="text-xs text-indigo-600">首次作答题数</span></div></div>
    <div className="flex items-center justify-between"><h3 className="font-bold text-slate-900">做了什么</h3><select aria-label="个人活动类型" value={feature} onChange={e => setFeature(e.target.value)} className={selectStyle}><option value="all">全部活动</option>{[...new Set(all.map(item => item.feature))].map(name => <option key={name}>{name}</option>)}</select></div>
    {filtered.length === 0 && <div className="mt-5 rounded-xl bg-slate-50 p-5 text-sm text-slate-500">{data.usedIds.has(studentId) ? '本期有应用使用记录，当前范围暂无学习活动。' : '当前范围、周期内暂无应用使用记录。'}<p className="mt-2 text-xs">这里只展示学伴应用内记录，不能据此判断线下学习情况。</p></div>}
    <div className="mt-5 space-y-4">{[...new Set(filtered.map(item => item.day))].map(day => <section key={day}><h4 className="mb-2 text-xs font-bold text-slate-500">{reportDate(day)}</h4><div className="space-y-2">{filtered.filter(item => item.day === day).map(activity => {
      const answers = data.answers.filter(item => item.activityId === activity.id);
      return <details key={activity.id} className="group rounded-xl border border-slate-200 p-4"><summary className="cursor-pointer list-none"><div className="flex items-center justify-between gap-3"><p className="text-sm font-bold text-slate-800">{activity.subject} · {activity.feature}</p><ChevronRight size={15} className="shrink-0 text-slate-400 group-open:rotate-90" /></div><p className="mt-1 text-xs text-slate-500">{activity.content}</p><p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500"><Clock3 size={12} />{activity.start} · {activity.minutes} 分钟 · {activity.status}{answers.length > 0 && ` · ${answers.length} 题 / 答对 ${answers.filter(a => a.correct).length} 题`}</p></summary><div className="mt-3 space-y-2 border-t border-slate-100 pt-3">{answers.length ? answers.map(answer => { const question = REPORT_QUESTIONS.find(q => q.id === answer.questionId)!; return <div key={answer.id} className="rounded-lg bg-slate-50 p-3 text-xs"><p className="font-bold text-slate-700">{question.stem}</p><p className="mt-2 text-slate-500">{answer.kind}作答：{answer.answer} · <span className={answer.correct ? 'text-emerald-700' : 'text-amber-700'}>{answer.correct ? '正确' : '错误'}</span></p><p className="mt-1 text-slate-500">参考答案：{question.answer} · {question.scoring}</p>{answer.kind === '订正' && <p className="mt-1 text-slate-400">订正结果不等同于已经掌握，后续独立再练另行记录。</p>}</div>; }) : <p className="text-xs text-slate-500">{activity.feature === '同步微课' ? '记录内容观看与播放时长。' : '记录已发生的学习互动；原始对话不在此展示。'}本次无关联作答结果。</p>}</div></details>;
    })}</div></section>)}</div>
  </ReportModal>;
}

export function ReportFootnote() {
  return <details className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500"><summary className="cursor-pointer font-semibold">统计说明与数据范围</summary><div className="mt-3 space-y-2 leading-6"><p>所有数字为截至 2026-10-12 的固定演示数据，用于评审交互。近 7 / 30 天按完整自然日统计。</p><p>使用人数按学生去重；学习人数计入已发生内容观看、练习或学习互动的学生。仅打开页面不计入学习。筛选学科或任教范围后，使用人数只计该范围的操作。</p><p>学习时长统计活动参与分钟，排除后台、暂停与服务等待，不代表专注时长。总时长去重；人均时长除以本期学习人数。</p><p>本演示覆盖同步微课、自主练习、错题订正、AI 讲题和小晤学习问答。实际数据服务尚未接入；其他功能的记录范围见需求稿。当前数据不反映线下学习及其他应用。</p></div></details>;
}
