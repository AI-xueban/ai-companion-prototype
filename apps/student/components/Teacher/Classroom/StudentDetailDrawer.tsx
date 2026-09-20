import React, { useMemo, useState } from 'react';
import { X, BookOpen, Clock3, Brain, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { classRadar, studentDetailMap, knowledgeGraphBySubject } from '../data/mockTeacherData';

interface StudentDetailDrawerProps {
  studentId: string | null;
  studentName: string;
  onClose: () => void;
}

export const StudentDetailDrawer: React.FC<StudentDetailDrawerProps> = ({ studentId, studentName, onClose }) => {
  const [tab, setTab] = useState<'info' | 'knowledge' | 'mistake' | 'timeline'>('info');

  const detail = studentId ? studentDetailMap[studentId] : null;
  const knowledgeSubjects = useMemo(() => {
    const base = detail?.knowledge?.map((k) => ({ subject: (k as any).subject || detail?.radar?.[0]?.subject || '数学', ...k })) || [];
    const fallback = knowledgeGraphBySubject.flatMap((g) => g.nodes.map((n) => ({ ...n, subject: g.subject })));
    const allSubjects = Array.from(new Set([...base.map((k) => (k as any).subject || '数学'), ...knowledgeGraphBySubject.map((g) => g.subject)]));
    return { base, fallback, subjects: allSubjects };
  }, [detail]);
  const [knowledgeSubject, setKnowledgeSubject] = useState<string>('全部');
  const [mistakeKnowledge, setMistakeKnowledge] = useState<string>('all');
  const [mistakeTimeRange, setMistakeTimeRange] = useState<'all' | '3d' | '7d'>('all');
  const [openMistakeId, setOpenMistakeId] = useState<string | null>(null);
  const [timelineType, setTimelineType] = useState<string>('all');
  const [timelineSubject, setTimelineSubject] = useState<string>('all');

  const radarData = useMemo(() => {
    if (!detail) return classRadar;
    return detail.radar.map((d) => ({
      subject: d.subject,
      score: d.score,
      prevScore: d.prevScore,
      fullMark: d.fullMark,
    }));
  }, [detail]);

  const knowledgeOptions = useMemo(() => ['全部', ...knowledgeSubjects.subjects], [knowledgeSubjects]);
  const knowledgeItems = useMemo(() => {
    const source = knowledgeSubjects.base.length ? knowledgeSubjects.base : knowledgeSubjects.fallback;
    return source.filter((item: any) => knowledgeSubject === '全部' || item.subject === knowledgeSubject);
  }, [knowledgeSubject, knowledgeSubjects]);

  const mistakeKnowledgeOptions = useMemo(() => {
    const raw = detail?.mistakes || [];
    const knowledgePoints = raw.flatMap((m) => m.knowledgePoints || []) as string[];
    return ['all', ...Array.from(new Set<string>(knowledgePoints))];
  }, [detail]);

  const filteredMistakes = useMemo(() => {
    const raw = detail?.mistakes || [];
    return raw.filter((m: any) => {
      const matchKnowledge = mistakeKnowledge === 'all' || (m.knowledgePoints || []).includes(mistakeKnowledge);
      const due = typeof m.dueInDays === 'number' ? m.dueInDays : 99;
      const matchTime = mistakeTimeRange === 'all' ? true : mistakeTimeRange === '3d' ? due <= 3 : due <= 7;
      return matchKnowledge && matchTime;
    });
  }, [detail, mistakeKnowledge, mistakeTimeRange]);

  const filteredTimeline = useMemo(() => {
    const raw = detail?.timeline || [];
    return raw.filter((t: any) => {
      const matchType = timelineType === 'all' || t.type === timelineType;
      const matchSubject = timelineSubject === 'all' || t.subject === timelineSubject;
      return matchType && matchSubject;
    });
  }, [detail, timelineSubject, timelineType]);

  if (!studentId) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">学生详情</p>
            <h2 className="text-xl font-black text-slate-900">{studentName}</h2>
            <p className="text-xs text-slate-500">学号：{studentId}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 pt-4">
          <div className="flex items-center gap-2">
            {[
              { key: 'info', label: '能力画像' },
              { key: 'knowledge', label: '知识图谱' },
              { key: 'mistake', label: '错题本' },
              { key: 'timeline', label: '学习记录' },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setTab(item.key as any)}
                className={`px-4 py-2 rounded-lg text-sm font-bold border transition-colors ${
                  tab === item.key ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {tab === 'info' && (
            <div className="space-y-4">
              <div className="h-72 bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">能力雷达</p>
                    <h3 className="text-sm font-black text-slate-900">个人 vs 班级均值</h3>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500"></span> 个人</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full border border-slate-400 border-dashed"></span> 班级</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(148,163,184,0.4)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#475569', fontSize: 12, fontWeight: 700 }} />
                    <PolarRadiusAxis tick={false} axisLine={false} />
                    <Radar dataKey="prevScore" stroke="#94a3b8" strokeDasharray="4 4" fill="#cbd5e1" fillOpacity={0.15} name="班级" />
                    <Radar dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.35} name="个人" />
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {detail?.radar.slice(0, 4).map((item) => (
                  <div key={item.subject} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-sm font-black text-slate-900">{item.subject}</p>
                    <p className="text-xs text-slate-500 mt-1">{item.analysis}</p>
                    <p className="text-lg font-black text-purple-600 mt-2">{item.score}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'knowledge' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Brain size={16} className="text-blue-500" /> 知识图谱（科目筛选 + 状态）
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <Filter size={14} /> 科目：
                  <select
                    className="px-2 py-1 border border-slate-200 rounded-md text-xs font-bold"
                    value={knowledgeSubject}
                    onChange={(e) => setKnowledgeSubject(e.target.value)}
                  >
                    {knowledgeOptions.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {knowledgeItems.map((k: any) => {
                  const statusTone =
                    k.status === 'red' ? 'bg-red-100 text-red-700' : k.status === 'yellow' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700';
                  return (
                    <div key={k.id} className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-slate-900">{k.knowledgePoint}</p>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${statusTone}`}>{(k.status || '状态').toUpperCase()}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        未掌握 {k.unmasteredCount ?? '-'} · 复习中 {k.reviewing ?? '-'} · 已掌握 {k.mastered ?? '-'}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">科目：{(k as any).subject || knowledgeSubject || '数学'}</p>
                    </div>
                  );
                })}
                {!knowledgeItems.length && <p className="text-xs text-slate-500">暂无知识图谱数据。</p>}
              </div>
            </div>
          )}

          {tab === 'mistake' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <BookOpen size={16} className="text-amber-500" /> 错题本（知识点/时间筛选）
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-600">
                  <div className="flex items-center gap-1">
                    知识点：
                    <select
                      className="px-2 py-1 border border-slate-200 rounded-md text-xs font-bold"
                      value={mistakeKnowledge}
                      onChange={(e) => setMistakeKnowledge(e.target.value)}
                    >
                      {mistakeKnowledgeOptions.map((k) => (
                        <option key={k} value={k}>
                          {k === 'all' ? '全部' : k}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-1">
                    时间：
                    <select
                      className="px-2 py-1 border border-slate-200 rounded-md text-xs font-bold"
                      value={mistakeTimeRange}
                      onChange={(e) => setMistakeTimeRange(e.target.value as any)}
                    >
                      <option value="all">全部</option>
                      <option value="3d">近3天</option>
                      <option value="7d">近7天</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                {filteredMistakes.map((m) => {
                  const open = openMistakeId === m.id;
                  return (
                    <div key={`${m.id}-detail`} className="p-4 rounded-xl bg-white border border-slate-100 shadow-[0_4px_12px_rgba(0,0,0,0.04)]">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-slate-900">{m.fullQuestion}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            错误 {m.wrongAttempts} / {m.totalAttempts} · 知识点：{m.knowledgePoints?.join('、')} · 截止：{(m as any).deadlineLabel || '本周'}
                          </p>
                        </div>
                        <button onClick={() => setOpenMistakeId(open ? null : m.id)} className="text-xs font-bold text-slate-700 flex items-center gap-1">
                          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />} 查看详情
                        </button>
                      </div>
                      {open && (
                        <div className="mt-2 space-y-2 text-xs text-slate-600">
                          <p className="font-bold text-slate-800">标准答案</p>
                          <p>{m.correctAnswer}</p>
                          <p className="font-bold text-slate-800">学生作答</p>
                          <div className="overflow-auto border border-slate-200 rounded-lg">
                            <table className="min-w-full text-[11px]">
                              <thead className="bg-slate-50 text-slate-500 font-bold">
                                <tr>
                                  <th className="px-3 py-2 text-left">学号</th>
                                  <th className="px-3 py-2 text-left">姓名</th>
                                  <th className="px-3 py-2 text-left">对/错</th>
                                  <th className="px-3 py-2 text-left">作答</th>
                                  <th className="px-3 py-2 text-left">耗时</th>
                                  <th className="px-3 py-2 text-left">时间</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(m as any).attempts?.map((att: any) => (
                                  <tr key={att.id} className="border-t border-slate-100">
                                    <td className="px-3 py-2 font-mono text-slate-700">{att.studentId}</td>
                                    <td className="px-3 py-2 font-bold text-slate-900">{att.name}</td>
                                    <td className="px-3 py-2">
                                      <span className={`px-2 py-0.5 rounded-full font-black ${att.correct ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                        {att.correct ? '正确' : '错误'}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2 text-slate-700">{att.answer}</td>
                                    <td className="px-3 py-2 text-slate-700">{att.duration}</td>
                                    <td className="px-3 py-2 text-slate-500">{att.time}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {!filteredMistakes.length && <p className="text-xs text-slate-500">暂无错题记录。</p>}
              </div>
            </div>
          )}

          {tab === 'timeline' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <Clock3 size={16} className="text-green-500" /> 学习记录（类型/科目筛选）
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-600">
                  <div className="flex items-center gap-1">
                    类型：
                    <select
                      className="px-2 py-1 border border-slate-200 rounded-md text-xs font-bold"
                      value={timelineType}
                      onChange={(e) => setTimelineType(e.target.value)}
                    >
                      <option value="all">全部</option>
                      <option value="每日任务">每日任务</option>
                      <option value="专项练习">专项练习</option>
                      <option value="错题攻克">错题攻克</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-1">
                    科目：
                    <select
                      className="px-2 py-1 border border-slate-200 rounded-md text-xs font-bold"
                      value={timelineSubject}
                      onChange={(e) => setTimelineSubject(e.target.value)}
                    >
                      <option value="all">全部</option>
                      <option value="数学">数学</option>
                      <option value="物理">物理</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                {filteredTimeline.map((item, idx) => (
                  <div key={`${item.time}-${idx}`} className="p-3 rounded-lg border border-slate-100 bg-slate-50">
                    <p className="text-xs text-slate-500">{item.time}</p>
                    <p className="text-sm font-bold text-slate-900 mt-1">{item.type}</p>
                    <p className="text-xs text-slate-600 mt-1">{item.summary}</p>
                    {item.subject && <p className="text-[11px] text-slate-400 mt-1">科目：{item.subject}</p>}
                  </div>
                ))}
                {!filteredTimeline.length && <p className="text-xs text-slate-500">暂无记录。</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
