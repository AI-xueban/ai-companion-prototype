import React from 'react';
import { ReportData, ReportScope, Population, groupActivities, knowledgeGroups, percentage, reportDate } from '../data/learningReportData';
import { Metric, panel, ReportFootnote } from '../Analytics/LearningReportShared';
import { AnalysisTab } from '../Analytics/LearningAnalytics';

interface Props {
  scope: ReportScope; data: ReportData;
  onAnalyze: (tab: AnalysisTab, subject?: string) => void;
  onStudents: (filter: Population) => void; onStudent: (id: string) => void;
}

export function ClassLearningDashboard({ scope, data, onAnalyze, onStudents, onStudent }: Props) {
  const teaching = scope.view === 'teaching';
  const className = data.classes[0]?.name;
  if (!className) return <div className="p-8 text-sm text-slate-500">当前职责下暂无可查看班级，请先完善任教或班主任关系。</div>;
  const groups = knowledgeGroups(data);
  const subjects = groupActivities(data, 'subject');
  const contents = groupActivities(data, 'content').slice(0, 4);
  const first = data.answers.filter(a => a.kind === '首次');
  const days = data.roster.map(s => new Set(data.activities.filter(a => a.studentId === s.id).map(a => a.day)).size);
  const bands = [{ label: '暂无学习记录', count: days.filter(n => n === 0).length }, { label: '学习 1 天', count: days.filter(n => n === 1).length }, { label: '学习 2–3 天', count: days.filter(n => n >= 2 && n <= 3).length }, { label: '学习 4 天及以上', count: days.filter(n => n >= 4).length }];
  const students = data.roster.slice(0, 6);
  return <div className="h-full overflow-y-auto bg-[#F8F9FC]"><div className="mx-auto max-w-[1480px] space-y-6 p-6 lg:p-8">
    <header className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold text-indigo-600">{teaching ? '任课教师 · 学科学习与教学问题' : scope.view === 'homeroom' ? '班主任 · 班级整体与学生情况' : '学校管理 · 班级详情'}</p><h1 className="mt-2 text-2xl font-black text-slate-900">{className}{scope.subject !== 'all' ? ` · ${scope.subject}` : ''}</h1><p className="mt-2 text-sm text-slate-500">{teaching ? '查看本班该科学习内容、知识点问题和具体学生表现' : '了解本班各科学习分布、参与情况及每名学生的学习记录'}</p></div><span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">演示数据</span></header>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Metric label={teaching ? '该科学习人数' : '本班学习人数'} value={`${data.learnedIds.size} 人`} note={`当前范围 ${data.roster.length} 人 · 参与 ${percentage(data.learnedIds.size, data.roster.length)}%`} accent onClick={() => onStudents('learned')}/>
      <Metric label={teaching ? '该科学习时长' : '本班学习时长'} value={`${data.minutes} 分钟`} note={`${data.activities.length} 条学习活动`} onClick={() => onAnalyze('usage')}/>
      {teaching ? <Metric label="有首次作答的学生" value={`${new Set(first.map(a => a.studentId)).size} 人`} note={`${new Set(first.map(a => a.questionId)).size} 道不同题目 · 查看逐题结果`} onClick={() => onAnalyze('questions')}/> : <Metric label="使用过应用" value={`${data.usedIds.size} 人`} note={`本班 ${data.roster.length} 人中有主动操作的学生`} onClick={() => onStudents('used')}/>}
      <Metric label="人均学习时长" value={data.learnedIds.size ? `${Math.round(data.minutes / data.learnedIds.size)} 分钟` : '—'} note={`总分钟 ÷ ${data.learnedIds.size} 名学习学生`}/>
    </div>
    {teaching ? <>
      <section className={panel}><div className="flex items-center justify-between gap-4"><div><h2 className="font-black text-slate-900">哪些知识点出现问题</h2><p className="mt-1 text-xs text-slate-500">基于本班该科的首次作答，进入后查看题目与相关学生</p></div><button onClick={() => onAnalyze('knowledge')} className="text-xs font-bold text-indigo-600">查看知识点分析 →</button></div><div className="mt-5 space-y-3">{groups.map(group => <button key={`${group.subject}:${group.name}`} onClick={() => onAnalyze('knowledge')} className="flex w-full items-center justify-between gap-4 rounded-xl bg-slate-50 p-4 text-left"><div><p className="text-sm font-bold text-slate-800">{group.name}</p><p className="mt-1 text-xs text-slate-500">{group.people} 人练过 · {group.questionIds.length} 道题</p></div><span className="text-sm font-bold text-amber-700">首次错误涉及 {group.wrongPeople} 人 →</span></button>)}</div>{!groups.length && <p className="mt-5 text-sm text-slate-500">本期暂无可评价的作答，仍可查看学习内容和活动。</p>}<p className="mt-4 text-xs text-slate-400">学生自主选择的题目可能不同，错误涉及人数不等于未掌握人数。</p></section>
      <section className={panel}><div className="flex items-center justify-between"><h2 className="font-black text-slate-900">本班该科学了什么</h2><button onClick={() => onAnalyze('usage')} className="text-xs font-bold text-indigo-600">查看全部学习内容 →</button></div><div className="mt-4 grid gap-3 md:grid-cols-2">{contents.map(item => <div key={item.name} className="rounded-xl bg-slate-50 p-4"><p className="text-sm font-bold">{item.name}</p><p className="mt-2 text-xs text-slate-500">{item.people} 人 · {item.minutes} 分钟</p></div>)}</div>{!contents.length && <p className="mt-4 text-sm text-slate-500">本期暂无学习活动</p>}</section>
    </> : <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
      <section className={panel}><h2 className="font-black text-slate-900">本班各科学习情况</h2><p className="mt-1 text-xs text-slate-500">查看各科学习参与，再进入具体内容与题目</p><div className="mt-4 divide-y divide-slate-100">{subjects.map(item => <button key={item.name} onClick={() => onAnalyze('usage', item.name)} className="flex w-full items-center justify-between gap-3 py-4 text-left"><strong className="text-sm">{item.name}</strong><span className="text-xs text-slate-500">{item.people}/{data.roster.length} 人 · {item.minutes} 分钟 <span className="ml-2 text-indigo-600">查看 →</span></span></button>)}</div>{!subjects.length && <p className="mt-5 text-sm text-slate-500">本期暂无学科学习记录</p>}</section>
      <section className={panel}><h2 className="font-black text-slate-900">本班学生学习是否持续</h2><p className="mt-1 text-xs text-slate-500">本期有学习活动的天数</p><div className="mt-5 space-y-4">{bands.map(band => <div key={band.label}><div className="flex justify-between text-xs"><span>{band.label}</span><strong>{band.count} 人</strong></div><div className="mt-2 h-1.5 rounded-full bg-slate-100"><div className="h-full rounded-full bg-teal-500" style={{width:`${percentage(band.count, data.roster.length)}%`}}/></div></div>)}</div></section>
    </div>}
    <section className={panel}><div className="flex items-center justify-between gap-4"><div><h2 className="font-black text-slate-900">{teaching ? '学生的该科学习情况' : '本班学生学习情况'}</h2><p className="mt-1 text-xs text-slate-400">按名单顺序展示前 6 人 · 点击查看个人学习时间线</p></div><button className="text-xs font-bold text-indigo-600" onClick={() => onStudents('all')}>查看全班 {data.roster.length} 人 →</button></div><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm"><thead className="border-b border-slate-100 text-xs text-slate-400"><tr>{['学生','学习分钟','学习天数','首次作答','最近学习'].map(label=><th className="pb-3 font-normal" key={label}>{label}</th>)}</tr></thead><tbody>{students.map(student => { const activities=data.activities.filter(a=>a.studentId===student.id); const answers=first.filter(a=>a.studentId===student.id); return <tr key={student.id} className="border-b border-slate-100 last:border-0"><td className="py-4"><button className="font-bold text-indigo-600" onClick={()=>onStudent(student.id)}>{student.name}</button></td><td>{activities.length?activities.reduce((sum,a)=>sum+a.minutes,0):'—'}</td><td>{new Set(activities.map(a=>a.day)).size} 天</td><td>{answers.length?`${answers.length} 题`:'—'}</td><td className="text-xs text-slate-500">{activities.length?reportDate(Math.min(...activities.map(a=>a.day))):'暂无记录'}</td></tr>; })}</tbody></table></div></section>
    <ReportFootnote/>
  </div></div>;
}
