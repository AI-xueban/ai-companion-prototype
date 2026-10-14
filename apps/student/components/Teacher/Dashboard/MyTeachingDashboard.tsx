import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, ChevronRight, Clock3, FileQuestion, Info, Users, X } from 'lucide-react';
import { TeacherPortalUser } from '../data/teacherAccess';
import { SCHOOL_LEARNING_DEMO, SchoolLearningPeriod } from '../data/mockSchoolLearningData';
import { getDemoActivities, getDemoNoRecordReason, getDemoQuestionAttempts, getDemoRoster, getDemoTeachingUnit } from '../data/mockTeachingEvidence';

interface Props {
  user: TeacherPortalUser;
  onOpenSchool: () => void;
}

const rate = (count: number, total: number) => total ? Math.round(count / total * 100) : 0;

export const MyTeachingDashboard: React.FC<Props> = ({ user, onOpenSchool }) => {
  const [period, setPeriod] = useState<SchoolLearningPeriod>('7d');
  const [tab, setTab] = useState<'teaching' | 'homeroom'>(() => user.teachingAssignments.length ? 'teaching' : 'homeroom');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [selectedHomeroomId, setSelectedHomeroomId] = useState<string | null>(null);
  const [questionId, setQuestionId] = useState<string | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [showAllActivities, setShowAllActivities] = useState(false);
  const [followupType, setFollowupType] = useState('全班讲解');
  const [followups, setFollowups] = useState<Record<string, string>>({});

  const classes = SCHOOL_LEARNING_DEMO[period].filter((row) => row.schoolId === user.schoolId && user.classIds.includes(row.id));
  const assignments = user.teachingAssignments.flatMap((assignment) => assignment.subjects.flatMap((subject) => {
    const row = classes.find((item) => item.id === assignment.classId);
    const usage = row?.subjects.find((item) => item.subject === subject);
    return row && usage ? [{ key: `${row.id}:${subject}`, row, subject, usage }] : [];
  }));
  const selected = assignments.find((item) => item.key === selectedKey) ?? assignments[0] ?? null;
  const homeroomClasses = classes.filter((row) => user.homeroomClassIds.includes(row.id));
  const selectedHomeroom = homeroomClasses.find((row) => row.id === selectedHomeroomId) ?? homeroomClasses[0] ?? null;

  const unit = selected ? getDemoTeachingUnit(selected.row.id, selected.subject) : null;
  const teachingActivities = selected ? getDemoActivities(selected.row, period).filter((item) => item.subject === selected.subject) : [];
  const teachingRoster = selected ? getDemoRoster(selected.row) : [];
  const attempts = selected ? getDemoQuestionAttempts(selected.row, selected.subject) : [];
  const attemptedStudentCount = new Set(attempts.map((item) => item.studentId)).size;
  const question = unit?.questions.find((item) => item.id === questionId) ?? null;
  const questionAttempts = question ? attempts.filter((item) => item.questionId === question.id) : [];

  const detailRow = tab === 'teaching' ? selected?.row : selectedHomeroom;
  const student = detailRow && studentId ? getDemoRoster(detailRow).find((item) => item.id === studentId) : null;
  const studentActivities = detailRow && student ? getDemoActivities(detailRow, period)
    .filter((item) => item.studentId === student.id && (tab === 'homeroom' || item.subject === selected?.subject)) : [];
  const studentAttempts = tab === 'teaching' && student ? attempts.filter((item) => item.studentId === student.id) : [];

  const selectAssignment = (key: string) => { setSelectedKey(key); setQuestionId(null); setStudentId(null); setShowAllActivities(false); };
  const selectHomeroom = (id: string) => { setSelectedHomeroomId(id); setQuestionId(null); setStudentId(null); };
  const changeTab = (next: 'teaching' | 'homeroom') => { setTab(next); setQuestionId(null); setStudentId(null); };

  return <div className="h-full overflow-y-auto bg-[#F8F9FC]">
    <div className="mx-auto max-w-[1440px] space-y-5 px-6 py-7 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2"><h1 className="text-2xl font-black text-slate-900">我的班级</h1><span className="rounded-full bg-amber-100 px-2 py-1 text-[11px] font-bold text-amber-700">演示数据</span></div>
          <p className="mt-2 text-sm text-slate-500">从我负责的班级进入学习记录、题目证据与跟进事项</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-500">周期<select aria-label="我的班级统计周期" value={period} onChange={(event) => { setPeriod(event.target.value as SchoolLearningPeriod); setQuestionId(null); setStudentId(null); }} className="ml-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"><option value="7d">近 7 天</option><option value="30d">近 30 天</option></select></label>
          <button type="button" onClick={onOpenSchool} className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-indigo-600 hover:bg-indigo-50"><ArrowLeft size={14} />全校学情</button>
        </div>
      </div>

      <div role="tablist" aria-label="我的职责" className="flex gap-2 border-b border-slate-200">
        {assignments.length > 0 && <button type="button" role="tab" aria-selected={tab === 'teaching'} onClick={() => changeTab('teaching')} className={tab === 'teaching' ? 'border-b-2 border-indigo-600 px-4 py-3 text-sm font-bold text-indigo-700' : 'px-4 py-3 text-sm font-bold text-slate-500'}>我任教的班级</button>}
        {homeroomClasses.length > 0 && <button type="button" role="tab" aria-selected={tab === 'homeroom'} onClick={() => changeTab('homeroom')} className={tab === 'homeroom' ? 'border-b-2 border-indigo-600 px-4 py-3 text-sm font-bold text-indigo-700' : 'px-4 py-3 text-sm font-bold text-slate-500'}>我负责的班主任班级</button>}
      </div>

      {tab === 'teaching' ? <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        <section className="h-fit rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="px-1 font-black text-slate-900">选择班级与学科</h2><p className="mt-1 px-1 text-xs text-slate-500">每项按正式任教关系查看，不合并跨科学生人数</p>
          <div className="mt-4 space-y-2">{assignments.map((item) => {
            const itemUnit = getDemoTeachingUnit(item.row.id, item.subject);
            return <button key={item.key} type="button" aria-pressed={selected?.key === item.key} onClick={() => selectAssignment(item.key)} className={selected?.key === item.key ? 'w-full rounded-xl border border-indigo-300 bg-indigo-50 p-3 text-left' : 'w-full rounded-xl border border-slate-100 bg-white p-3 text-left hover:bg-slate-50'}>
              <span className="flex items-center justify-between gap-2 text-sm font-bold text-slate-900">{item.row.name} · {item.subject}<ChevronRight size={15} className="shrink-0 text-slate-400" /></span>
              <span className="mt-1 block text-xs text-slate-500">{period === '7d' ? '近 7 天' : '近 30 天'}该科学习 {item.usage.learned}/{item.usage.eligible} 人</span>
              <span className="mt-1 block text-[11px] text-indigo-600">{itemUnit ? `${itemUnit.unit} · ${itemUnit.attemptedCount} 人有可比作答` : '暂无可比题目证据'}</span>
            </button>;
          })}</div>
        </section>

        {selected && <div className="space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold text-indigo-600">任教范围 · {period === '7d' ? '近 7 天' : '近 30 天'}</p>
            <h2 className="mt-1 text-xl font-black text-slate-900">{selected.row.name} · {selected.subject}</h2>
            <p className="mt-1 text-xs text-slate-500">下面的参与人数覆盖该科本周期全部已接入学习活动；题目线索限定在“{unit?.unit ?? '暂无教学单元'}”演示单元。</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-indigo-50 p-4"><p className="text-xs font-bold text-indigo-700">该科学习活动</p><p className="mt-2 text-2xl font-black text-slate-900">{selected.usage.learned}<span className="ml-1 text-sm font-normal text-slate-500">/ {selected.usage.eligible} 人</span></p><p className="mt-1 text-xs text-slate-500">参与率 {rate(selected.usage.learned, selected.usage.eligible)}%</p></div>
              <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold text-slate-600">全班应用操作</p><p className="mt-2 text-2xl font-black text-slate-900">{selected.row.used}<span className="ml-1 text-sm font-normal text-slate-500">/ {selected.row.enrolled} 人</span></p><p className="mt-1 text-xs text-slate-500">包含其他学科，仅作使用背景</p></div>
              <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs font-bold text-slate-600">本单元可比作答</p><p className="mt-2 text-2xl font-black text-slate-900">{attemptedStudentCount}<span className="ml-1 text-sm font-normal text-slate-500">人</span></p><p className="mt-1 text-xs text-slate-500">仅计入本单元首次独立作答</p></div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="flex items-center gap-2 text-xs font-bold text-indigo-600"><FileQuestion size={15} />题目证据 · 待核查</p><h3 className="mt-1 text-lg font-black text-slate-900">{unit ? `${unit.unit} · ${unit.questions[0].knowledgePoint}` : '暂无可比较题目'}</h3></div>{unit && <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">样例线索，不判定班级共性</span>}</div>
            {unit ? <>
              <p className="mt-3 text-sm text-slate-600">本单元 {unit.questions.length} 道演示题，{attemptedStudentCount} 名学生有可比首次作答，{unit.firstWrongCount} 人至少有一次首次错误；其余 {selected.usage.eligible - attemptedStudentCount} 人本周期无本单元可比作答，原因尚待核对。{unit.scoringMethod}。</p>
              <div className="mt-4 space-y-2">{unit.questions.map((item) => {
                const itemAttempts = attempts.filter((attempt) => attempt.questionId === item.id);
                return <button key={item.id} type="button" onClick={() => setQuestionId(item.id)} className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 text-left hover:border-indigo-200 hover:bg-indigo-50"><span><strong className="block text-sm text-slate-800">{item.stem}</strong><span className="mt-1 block text-xs text-slate-500">首次错误 {itemAttempts.filter((attempt) => !attempt.correct).length}/{itemAttempts.length} 名作答学生 · 查看逐题作答</span></span><ArrowRight size={16} className="shrink-0 text-indigo-600" /></button>;
              })}</div>
              <p className="mt-3 text-xs text-slate-400">共性问题还需教研确认参与门槛、题目难度与知识点映射；未作答不等于不会。</p>
            </> : <p className="mt-3 text-sm text-slate-500">当前只有学习活动记录，没有可比较的题目证据，不能判断知识点掌握。</p>}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="flex items-center gap-2 text-xs font-bold text-indigo-600"><Clock3 size={15} />平板学习记录</p><h3 className="mt-1 text-lg font-black text-slate-900">该科学生做了什么</h3></div><span className="text-xs text-slate-500">{teachingActivities.length} 名学生 · {teachingActivities.length} 条活动</span></div>
            <div className="mt-4 divide-y divide-slate-100">{teachingActivities.slice(0, showAllActivities ? undefined : 6).map((activity) => {
              const activityStudent = teachingRoster.find((item) => item.id === activity.studentId);
              return <button key={activity.id} type="button" onClick={() => setStudentId(activity.studentId)} className="flex w-full flex-wrap items-center justify-between gap-2 py-3 text-left hover:bg-slate-50"><span><strong className="text-sm text-slate-800">{activityStudent?.name}</strong><span className="ml-3 text-xs text-slate-500">{activity.title}</span></span><span className="flex items-center gap-2 text-xs text-slate-500">{activity.minutes} 分钟 <ChevronRight size={14} className="text-indigo-600" /></span></button>;
            })}</div>
            {teachingActivities.length > 6 && <button type="button" onClick={() => setShowAllActivities((value) => !value)} className="mt-3 text-xs font-bold text-indigo-600">{showAllActivities ? '收起记录' : `查看全部 ${teachingActivities.length} 条记录`}</button>}
            <p className="mt-3 text-xs text-slate-400">时长、活动与题目均为同一组演示学生生成；真实接入需从原始事件核对。</p>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-black text-slate-900">教学跟进</h3><p className="mt-1 text-xs text-slate-500">先记录教师动作，后续有可比较再练时才能判断变化</p>
            <div className="mt-4 flex flex-wrap gap-2"><select aria-label="跟进方式" value={followupType} onChange={(event) => setFollowupType(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"><option>全班讲解</option><option>小组补练</option><option>个别辅导</option><option>暂不处理</option></select><button type="button" onClick={() => setFollowups((value) => ({ ...value, [selected.key]: followupType }))} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white hover:bg-indigo-500">记录演示跟进</button></div>
            <p className="mt-3 text-xs text-slate-600">{followups[selected.key] ? `已记录：${followups[selected.key]}。尚无复查证据，不能判定已改善。` : '尚未记录跟进；本演示不写入真实业务数据。'}</p>
          </section>
        </div>}
      </div> : <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        <section className="h-fit rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><h2 className="px-1 font-black text-slate-900">选择负责班级</h2><p className="mt-1 px-1 text-xs text-slate-500">仅展示正式分配的班主任班级</p><div className="mt-4 space-y-2">{homeroomClasses.map((row) => <button key={row.id} type="button" aria-pressed={selectedHomeroom?.id === row.id} onClick={() => selectHomeroom(row.id)} className={selectedHomeroom?.id === row.id ? 'w-full rounded-xl border border-indigo-300 bg-indigo-50 p-3 text-left' : 'w-full rounded-xl border border-slate-100 p-3 text-left hover:bg-slate-50'}><span className="flex items-center justify-between text-sm font-bold text-slate-900">{row.name}<ChevronRight size={15} className="text-slate-400" /></span><span className="mt-1 block text-xs text-slate-500">{row.learned}/{row.enrolled} 人有学习活动 · {row.enrolled - row.used} 人无操作记录</span></button>)}</div></section>
        {selectedHomeroom && <div className="space-y-5">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><p className="text-xs font-bold text-violet-600">班主任范围 · {period === '7d' ? '近 7 天' : '近 30 天'}</p><h2 className="mt-1 text-xl font-black text-slate-900">{selectedHomeroom.name} · 全班学习使用</h2><p className="mt-1 text-xs text-slate-500">仅指学伴应用内可归属记录，不能推断线下学习。</p><div className="mt-5 flex h-3 overflow-hidden rounded-full bg-slate-100"><span className="bg-indigo-500" style={{ width: `${rate(selectedHomeroom.learned, selectedHomeroom.enrolled)}%` }} /><span className="bg-amber-400" style={{ width: `${rate(selectedHomeroom.used - selectedHomeroom.learned, selectedHomeroom.enrolled)}%` }} /><span className="bg-slate-300" style={{ width: `${rate(selectedHomeroom.enrolled - selectedHomeroom.used, selectedHomeroom.enrolled)}%` }} /></div><div className="mt-4 grid gap-2 text-xs sm:grid-cols-3"><p><strong className="text-indigo-700">{selectedHomeroom.learned} 人</strong>有学习活动</p><p><strong className="text-amber-700">{selectedHomeroom.used - selectedHomeroom.learned} 人</strong>仅有应用操作</p><p><strong className="text-slate-700">{selectedHomeroom.enrolled - selectedHomeroom.used} 人</strong>暂无操作记录</p></div></section>
          <div className="grid gap-5 lg:grid-cols-2"><section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h3 className="font-black text-slate-900">各科学习参与</h3><p className="mt-1 text-xs text-slate-500">各科人数可重叠，不能相加为全班人数</p><div className="mt-4 space-y-3">{selectedHomeroom.subjects.map((item) => <div key={item.subject} className="flex justify-between text-sm"><span className="text-slate-600">{item.subject}</span><strong className="text-slate-900">{item.learned}/{item.eligible} · {rate(item.learned, item.eligible)}%</strong></div>)}</div></section><section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h3 className="font-black text-slate-900">无操作记录原因</h3><p className="mt-1 text-xs text-slate-500">仅展示有来源的原因，未知不推断为未学习</p><div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">{[['待同步', selectedHomeroom.syncPending], ['设备不可用', selectedHomeroom.deviceUnavailable], ['待核对', selectedHomeroom.unknownNoRecord]].map(([label, value]) => <div key={label} className="rounded-lg bg-slate-50 p-3"><strong className="block text-xl text-slate-900">{value}</strong>{label}</div>)}</div></section></div>
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div><p className="flex items-center gap-2 text-xs font-bold text-violet-600"><Users size={15} />班主任核查名单</p><h3 className="mt-1 text-lg font-black text-slate-900">暂无应用操作记录的学生</h3></div><span className="text-xs text-slate-500">{selectedHomeroom.enrolled - selectedHomeroom.used} 人</span></div><div className="mt-4 divide-y divide-slate-100">{getDemoRoster(selectedHomeroom).slice(selectedHomeroom.used).map((item) => <button key={item.id} type="button" onClick={() => setStudentId(item.id)} className="flex w-full items-center justify-between gap-2 py-3 text-left hover:bg-slate-50"><span className="text-sm font-bold text-slate-800">{item.name}</span><span className="flex items-center gap-2 text-xs text-slate-500">{getDemoNoRecordReason(selectedHomeroom, item.id)}<ChevronRight size={14} className="text-indigo-600" /></span></button>)}</div><p className="mt-3 text-xs text-slate-400">名单仅供演示核查流程；正式产品需关联任务、出勤、设备与同步来源。</p></section>
        </div>}
      </div>}

      <div className="flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-900"><Info size={15} className="mt-0.5 shrink-0" /><span>页面数字、学习记录和题目作答使用同一组演示学生。当前仍未接入真实任务、设备和逐题服务；是否构成教学共性需教研判定。</span></div>
    </div>

    {question && selected && <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/30" onClick={() => setQuestionId(null)}><aside role="dialog" aria-modal="true" aria-label="题目与首次作答" className="h-full w-full max-w-[560px] overflow-y-auto bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}><div className="flex items-start justify-between gap-2"><div><p className="text-xs font-bold text-indigo-600">{selected.row.name} · {selected.subject} · {unit?.unit}</p><h2 className="mt-1 text-xl font-black text-slate-900">原题与首次作答</h2></div><button type="button" aria-label="关闭题目" onClick={() => setQuestionId(null)} className="rounded-lg p-2 hover:bg-slate-100"><X size={18} /></button></div><div className="mt-6 rounded-xl bg-slate-50 p-4"><p className="text-sm font-bold text-slate-900">{question.stem}</p><p className="mt-3 text-xs text-slate-600">参考答案：{question.correctAnswer} · {unit?.scoringMethod}</p></div><p className="mt-5 text-sm font-bold text-slate-800">首次作答 {questionAttempts.length} 人 · 首次错误 {questionAttempts.filter((item) => !item.correct).length} 人</p><div className="mt-3 divide-y divide-slate-100">{questionAttempts.map((attempt) => <button key={attempt.studentId} type="button" onClick={() => { setQuestionId(null); setStudentId(attempt.studentId); }} className="flex w-full justify-between gap-3 py-3 text-left text-sm hover:bg-slate-50"><span className="font-bold text-slate-800">{teachingRoster.find((item) => item.id === attempt.studentId)?.name}<span className="ml-2 font-normal text-slate-500">作答：{attempt.answer}</span></span><span className={attempt.correct ? 'text-emerald-700' : 'text-amber-700'}>{attempt.correct ? '正确' : '首次错误'}</span></button>)}</div><p className="mt-5 text-xs text-slate-400">此处为演示题与演示作答；正式逐题详情须保留来源、版本、判分方式及完整尝试链。</p></aside></div>}

    {student && detailRow && <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/30" onClick={() => setStudentId(null)}><aside role="dialog" aria-modal="true" aria-label="学生学习记录" className="h-full w-full max-w-[520px] overflow-y-auto bg-white p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}><div className="flex items-start justify-between gap-2"><div><p className="text-xs font-bold text-indigo-600">{detailRow.name} · {period === '7d' ? '近 7 天' : '近 30 天'}{tab === 'teaching' ? ` · ${selected?.subject}` : ' · 班主任范围'}</p><h2 className="mt-1 text-xl font-black text-slate-900">{student.name}的学习记录</h2></div><button type="button" aria-label="关闭学生记录" onClick={() => setStudentId(null)} className="rounded-lg p-2 hover:bg-slate-100"><X size={18} /></button></div>{studentActivities.length ? <div className="mt-6 space-y-3">{studentActivities.map((activity) => <div key={activity.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4"><p className="text-sm font-bold text-slate-900">{activity.subject} · {activity.title}</p><p className="mt-1 text-xs text-slate-600">{activity.timeLabel} · 实际参与 {activity.minutes} 分钟 · 已完成</p></div>)}</div> : <div className="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-900"><p>本周期暂无可归属的学伴学习活动。</p>{getDemoNoRecordReason(detailRow, student.id) && <p className="mt-2 text-xs">当前可核对原因：{getDemoNoRecordReason(detailRow, student.id)}。不代表线下没有学习。</p>}</div>}{tab === 'teaching' && studentAttempts.length > 0 && <div className="mt-6"><h3 className="text-sm font-black text-slate-900">本单元首次作答</h3><div className="mt-2 space-y-2">{studentAttempts.map((attempt) => <div key={attempt.questionId} className="rounded-lg border border-slate-100 p-3 text-xs"><p className="font-bold text-slate-700">{unit?.questions.find((item) => item.id === attempt.questionId)?.stem}</p><p className="mt-1 text-slate-500">作答：{attempt.answer} · {attempt.correct ? '正确' : '首次错误'}</p></div>)}</div></div>}<p className="mt-6 text-xs text-slate-400">演示记录仅用于验证汇总与明细一致；真实记录需支持原始事件、身份及同步状态追溯。</p></aside></div>}
  </div>;
};
