import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '../../UI/Card';
import { highFreqMistakes, knowledgeGraphBySubject } from '../data/mockTeacherData';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AlertTriangle, BookOpen, Info, ChevronDown, Clock3, TrendingDown, Target, Zap, Filter, Layers } from 'lucide-react';

const UI_LIMITS = {
  riskTopN: 5,
  barMaxItems: 40,
  listPageSize: 20,
  defaultLevel: 2 as number | 'all',
  showOnlyNonGreen: true,
  enableAnimations: false,
};

const LEVEL_LABELS: Record<number, string> = {
  1: '学科 (L1)',
  2: '章节 (L2)',
  3: '小节 (L3)',
  4: '知识点 (L4)',
};

const HealthSummaryBanner = ({
  summary,
  level,
  mastery,
  coverage,
  quality,
}: {
  summary: { red: number; yellow: number; green: number };
  level: number | 'all';
  mastery: {
    baseTotal: number;
    rateMastered: number;
    rateReviewing: number;
    rateUnmastered: number;
    rateUnknown: number;
    countMastered: number;
    countReviewing: number;
    countUnmastered: number;
    countUnknown: number;
  };
  coverage: { covered: number; total: number; rate: number };
  quality: { avgHealth?: number; avgLastActiveDays?: number };
}) => {
  const totalNodes = summary.red + summary.yellow + summary.green;
  if (totalNodes === 0) return null;
  const clampPct = (v: number) => Math.min(100, Math.max(0, Number(v.toFixed(1))));
  const pM = clampPct(mastery.rateMastered);
  const pR = clampPct(mastery.rateReviewing);
  const pU = clampPct(mastery.rateUnmastered);
  const pX = clampPct(mastery.rateUnknown);

  return (
    <div className="mb-10 bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 left-0 w-1 h-full bg-slate-900" />
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-50 rounded-xl">
            <Target size={20} className="text-slate-900" />
          </div>
          <div>
            <h4 className="text-lg font-black text-slate-900 tracking-tight">班级掌握概览（数学）</h4>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              统计维度: {level === 'all' ? '全量层级' : LEVEL_LABELS[level as number]} · 总人次 {mastery.baseTotal}
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-2xl font-black text-slate-900">{pM}%</span>
          <span className="text-[10px] font-black text-slate-400 ml-1 uppercase tracking-widest">掌握率</span>
        </div>
      </div>
      
      <div className="space-y-3 mb-6">
        <div className="h-4 w-full flex rounded-full overflow-hidden bg-slate-50 border border-slate-100">
          <div style={{ width: `${pM}%` }} className="bg-emerald-500 h-full transition-all duration-700 ease-out" />
          <div style={{ width: `${pR}%` }} className="bg-amber-400 h-full transition-all duration-700 ease-out" />
          <div style={{ width: `${pU}%` }} className="bg-red-500 h-full transition-all duration-700 ease-out" />
          <div style={{ width: `${pX}%` }} className="bg-slate-200 h-full transition-all duration-700 ease-out" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-bold text-slate-600">
          <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500" /> 掌握 {pM}%</span>
          <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-400" /> 复习 {pR}%</span>
          <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500" /> 未掌握 {pU}%</span>
          <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-slate-300" /> 未知 {pX}%</span>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">覆盖度</p>
          <div className="text-lg font-black text-slate-900">{coverage.rate.toFixed(1)}%</div>
          <p className="text-xs text-slate-500 font-bold">已覆盖 {coverage.covered} / {coverage.total} 节点</p>
        </div>
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">健康分均值</p>
          <div className="text-lg font-black text-slate-900">{quality.avgHealth ? quality.avgHealth.toFixed(1) : '—'}</div>
          <p className="text-xs text-slate-500 font-bold">85+ 视为健康</p>
        </div>
      </div>
    </div>
  );
};

const RiskCard = ({ item }: { item: any }) => (
  <Card className="flex-1 min-w-[300px] p-6 border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group bg-white rounded-[32px]">
    <div className="flex justify-between items-start mb-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-red-600 bg-red-50 px-3 py-1 rounded-full uppercase tracking-wider">高风险点</span>
          <span className="text-[10px] font-bold text-slate-400">ID: {item.id}</span>
        </div>
        <h5 className="text-xl font-black text-slate-900 group-hover:text-red-600 transition-colors leading-tight">{item.knowledgePoint}</h5>
      </div>
      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center min-w-[90px]">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">未掌握</p>
        <p className="text-lg font-black text-slate-900">{item.unmasteredCount} 人</p>
      </div>
    </div>

    <div className="grid grid-cols-1 gap-4 mb-8">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-slate-900">未掌握人数占比</span>
          <span className="text-[10px] font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded">{item.coverage}%</span>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase">
            <Layers size={10} /> 考频重要度
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-slate-700">{(item.importance * 100).toFixed(0)}%</span>
            <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
              <div className="bg-slate-400 h-full" style={{ width: `${item.importance * 100}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div className="space-y-3">
      <div className="flex justify-between items-end">
        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-slate-900">未掌握人数占比</span>
          <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">{item.coverage}%</span>
        </div>
        <span className="text-sm font-black text-slate-900">
          {item.unmasteredCount}
          <span className="text-[10px] font-bold text-slate-400 ml-1">/ {item.totalStudents} 人</span>
        </span>
      </div>
      <div className="h-3 w-full bg-slate-50 rounded-full overflow-hidden p-[2px] border border-slate-100">
        <div 
          className="bg-gradient-to-r from-red-400 to-red-600 h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(239,68,68,0.3)]" 
          style={{ width: `${item.coverage}%` }} 
        />
      </div>
    </div>
  </Card>
);

export const TeacherAnalytics: React.FC = () => {
  const [tab, setTab] = useState<'knowledge' | 'mistake'>('knowledge');
  const [viewLevel, setViewLevel] = useState<number | 'all'>(UI_LIMITS.defaultLevel);
  const [page, setPage] = useState(1);
  const defaultSubjects = ['数学', '语文', '英语'];
  const subjectOptions = useMemo(
    () => Array.from(new Set([...defaultSubjects, ...knowledgeGraphBySubject.map((g) => g.subject)])),
    [knowledgeGraphBySubject],
  );
  const [subject, setSubject] = useState<string>(subjectOptions[0] ?? '');
  
  const currentGroup = useMemo(() => knowledgeGraphBySubject.find((g) => g.subject === subject), [subject]);
  
  // 根据层级与状态筛选节点，并按风险排序
  const filteredNodes = useMemo(() => {
    if (!currentGroup) return [];
    let list = viewLevel === 'all' ? currentGroup.allNodes : currentGroup.allNodes.filter((n) => n.level === viewLevel);
    if (UI_LIMITS.showOnlyNonGreen) {
      list = list.filter((n) => n.status !== 'green');
    }
    return [...list].sort((a, b) => b.riskScore - a.riskScore);
  }, [currentGroup, viewLevel]);

  const masteryStat = useMemo(() => {
    if (!filteredNodes.length) {
      return {
        mastery: {
          baseTotal: 32,
          rateMastered: 0,
          rateReviewing: 0,
          rateUnmastered: 0,
          rateUnknown: 100,
          countMastered: 0,
          countReviewing: 0,
          countUnmastered: 0,
          countUnknown: 32,
        },
        coverage: { covered: 0, total: 0, rate: 0 },
        quality: { avgHealth: undefined, avgLastActiveDays: undefined },
      };
    }

    let sumM = 0;
    let sumR = 0;
    let sumU = 0;
    let sumX = 0;
    let sumHealth = 0;
    let healthCnt = 0;
    let sumActive = 0;
    let activeCnt = 0;
    let covered = 0;
    const nodesCount = filteredNodes.length;

    filteredNodes.forEach((n) => {
      const total = n.totalStudents ?? 32;
      const unmastered = n.unmasteredCount ?? 0;
      const reviewing = n.reviewing ?? 0;
      const mastered = Math.max(0, Math.min(total, n.mastered ?? total - unmastered - reviewing));
      const unknown = Math.max(0, total - mastered - reviewing - unmastered);

      const rM = mastered / total;
      const rR = reviewing / total;
      const rU = unmastered / total;
      const rX = unknown / total;

      sumM += rM;
      sumR += rR;
      sumU += rU;
      sumX += rX;

      if (mastered + reviewing + unmastered > 0) covered += 1;

      if (typeof n.healthScore === 'number') {
        sumHealth += n.healthScore;
        healthCnt += 1;
      }
      if (typeof n.lastActivityDays === 'number') {
        sumActive += n.lastActivityDays;
        activeCnt += 1;
      }
    });

    const avgM = sumM / nodesCount;
    const avgR = sumR / nodesCount;
    const avgU = sumU / nodesCount;
    const avgX = Math.max(0, 1 - (avgM + avgR + avgU));

    const baseTotal = 32;
    const pctM = avgM * 100;
    const pctR = avgR * 100;
    const pctU = avgU * 100;
    const pctX = avgX * 100;

    const cntM = Math.round((pctM / 100) * baseTotal);
    const cntR = Math.round((pctR / 100) * baseTotal);
    const cntU = Math.round((pctU / 100) * baseTotal);
    const cntX = Math.max(0, baseTotal - cntM - cntR - cntU);

    return {
      mastery: {
        baseTotal,
        rateMastered: pctM,
        rateReviewing: pctR,
        rateUnmastered: pctU,
        rateUnknown: pctX,
        countMastered: cntM,
        countReviewing: cntR,
        countUnmastered: cntU,
        countUnknown: cntX,
      },
      coverage: { covered, total: nodesCount, rate: nodesCount ? (covered / nodesCount) * 100 : 0 },
      quality: {
        avgHealth: healthCnt ? sumHealth / healthCnt : undefined,
        avgLastActiveDays: activeCnt ? sumActive / activeCnt : undefined,
      },
    };
  }, [filteredNodes]);

  // 分页控制
  useEffect(() => {
    setPage(1);
  }, [viewLevel, subject]);
  const totalPages = Math.max(1, Math.ceil(filteredNodes.length / UI_LIMITS.listPageSize));
  const pagedNodes = useMemo(() => {
    const start = (page - 1) * UI_LIMITS.listPageSize;
    return filteredNodes.slice(start, start + UI_LIMITS.listPageSize);
  }, [filteredNodes, page]);

  const barData = useMemo(() => filteredNodes.slice(0, UI_LIMITS.barMaxItems), [filteredNodes]);

  // 始终展示风险最高的原子点 (L4) 作为预警（遵循限流）
  const topRisks = useMemo(() => {
    if (!currentGroup) return [];
    return [...currentGroup.allNodes]
      .filter(n => n.level === 4 || (n.level === 3 && !currentGroup.allNodes.some(any => any.parentId === n.id))) // 优先 L4，或者没有子节点的 L3
      .filter(n => (UI_LIMITS.showOnlyNonGreen ? n.status !== 'green' : true))
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, UI_LIMITS.riskTopN);
  }, [currentGroup]);

  // 用于汇总展示的统计数据
  const displaySummary = useMemo(() => {
    return filteredNodes.reduce(
      (acc, n) => {
        acc[n.status] += 1;
        return acc;
      },
      { red: 0, yellow: 0, green: 0 } as { red: number; yellow: number; green: number }
    );
  }, [filteredNodes]);

  const sortedMistakes = useMemo(() => {
    return highFreqMistakes
      .map((m) => {
        const errorRate = m.wrongAttempts && m.totalAttempts ? Number(((m.wrongAttempts / m.totalAttempts) * 100).toFixed(1)) : 0;
        const importance = 0.8; 
        const weight = errorRate * (m.totalAttempts || 1) * importance;
        return { ...m, errorRate, weight };
      })
      .sort((a, b) => b.weight - a.weight || b.errorRate - a.errorRate);
  }, []);

  const [openNode, setOpenNode] = useState<string | null>(null);
  const [openMistakeId, setOpenMistakeId] = useState<string | null>(null);

  return (
    <div className="h-full flex flex-col p-6 md:p-10 bg-[#F8F9FC] overflow-y-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-1 bg-slate-900 rounded-full" />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">洞察看板</p>
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight">班级薄弱点 & 错题洞察</h2>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-200">
            {[
              { key: 'knowledge', label: '知识图谱', icon: Zap },
              { key: 'mistake', label: '错题分析', icon: AlertTriangle },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setTab(item.key as any)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black transition-all duration-300 ${
                  tab === item.key 
                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' 
                    : 'bg-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                <item.icon size={16} />
                {item.label}
              </button>
            ))}
          </div>
          
          <select
            className="px-5 py-3 border border-slate-200 rounded-2xl text-sm font-black text-slate-700 bg-white shadow-sm outline-none focus:ring-2 focus:ring-slate-900 transition-all cursor-pointer"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          >
            {subjectOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-[24px] p-5 flex items-start gap-4 mb-10">
        <div className="p-2 bg-blue-500 rounded-lg shrink-0">
          <Info size={18} className="text-white" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-black text-blue-900">数据计算口径说明</p>
          <p className="text-xs font-bold text-blue-700/80 leading-relaxed">
            数据源：近 7 天学生端作答记录；
            状态映射：已掌握绿（健康分 ≥ 80），待复习黄（60–80），待攻克红（&lt; 60）；探索中蓝、未知灰；
            健康分：(已掌握题数 × 100 + 待复习题数 × 60) / 做过的题数。
            风险分计算公式：(未掌握人数占比 &times; 重要度权重 &times; 遗忘系数)。
          </p>
        </div>
      </div>

      {tab === 'knowledge' && (
        <div className={`space-y-12 ${UI_LIMITS.enableAnimations ? 'animate-in fade-in slide-in-from-bottom-4 duration-700' : ''}`}>
          {!currentGroup && (
            <div className="p-4 rounded-2xl border border-dashed border-slate-200 bg-white text-sm text-slate-500 font-bold">
              当前学科暂无数据，已展示占位内容。
            </div>
          )}
          {/* Section 1: Health Banner */}
          <HealthSummaryBanner
            summary={displaySummary}
            level={viewLevel}
            mastery={masteryStat.mastery}
            coverage={masteryStat.coverage}
            quality={masteryStat.quality}
          />

          {/* Section 2: Top Risks */}
          <div>
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-50 rounded-xl">
                  <TrendingDown size={24} className="text-red-500" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900">核心风险预警</h3>
                  <p className="text-xs font-bold text-slate-400 italic">基于原子知识点 (L4) 的紧迫性评估</p>
                </div>
              </div>
              <span className="text-[10px] font-black text-slate-400 bg-white px-5 py-2 rounded-full border border-slate-100 shadow-sm uppercase tracking-widest">
                TOP 3 关键干预目标
              </span>
            </div>
            <div className="flex flex-wrap gap-6">
              {topRisks.map((node) => (
                <RiskCard key={node.id} item={node} />
              ))}
            </div>
          </div>

          {/* Section 3: Detailed Inventory */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
            <div className="lg:col-span-3">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <div className="w-2 h-6 bg-slate-200 rounded-full" />
                  风险分布可视化
                </h3>
                
                {/* Level Tabs */}
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  {[
                    { val: 'all', label: '全部' },
                    { val: 2, label: '章节' },
                    { val: 3, label: '小节' },
                    { val: 4, label: '点' },
                  ].map((l) => (
                    <button
                      key={l.val}
                      onClick={() => setViewLevel(l.val as any)}
                      className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${
                        viewLevel === l.val 
                          ? 'bg-white text-slate-900 shadow-sm' 
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>

              <Card className="p-8 h-[480px] rounded-[32px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} layout="vertical" margin={{ left: 100, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="knowledgePoint" 
                      type="category" 
                      tick={{ fill: '#64748b', fontSize: 10, fontWeight: 800 }}
                      width={120}
                    />
                    <Bar dataKey="unmasteredCount" radius={[0, 10, 10, 0]} barSize={20}>
                      {barData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.status === 'red' ? '#ef4444' : entry.status === 'yellow' ? '#fbbf24' : '#10b981'} 
                          fillOpacity={0.8}
                        />
                      ))}
                    </Bar>
                    <Tooltip
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: 24, border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', padding: 16 }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload;
                          return (
                            <div className="space-y-3">
                              <p className="text-sm font-black text-slate-900">{item.knowledgePoint}</p>
                              <div className="grid grid-cols-2 gap-x-6 gap-y-2 border-t border-slate-100 pt-3">
                                <div className="space-y-0.5">
                                  <p className="text-[9px] font-bold text-slate-400 uppercase">未掌握人数</p>
                                  <p className="text-sm font-black text-red-500">{item.unmasteredCount} 人</p>
                                </div>
                                <div className="space-y-0.5">
                                  <p className="text-[9px] font-bold text-slate-400 uppercase">未掌握占比</p>
                                  <p className="text-sm font-black text-slate-900">{item.coverage}%</p>
                                </div>
                                <div className="space-y-0.5">
                                  <p className="text-[9px] font-bold text-slate-400 uppercase">考频重要度</p>
                                  <p className="text-sm font-black text-slate-900">{(item.importance * 100).toFixed(0)}%</p>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>

            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <div className="w-2 h-6 bg-slate-200 rounded-full" />
                  节点详情清单
                </h3>
                <Filter size={16} className="text-slate-300" />
              </div>
              <div className="space-y-4 max-h-[480px] overflow-y-auto pr-2 custom-scrollbar">
                {pagedNodes.map((item) => {
                  const open = openNode === item.id;
                  const statusColors = {
                    red: 'border-red-200 bg-red-50 text-red-700',
                    yellow: 'border-amber-200 bg-amber-50 text-amber-700',
                    green: 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  };
                  return (
                    <div 
                      key={item.id} 
                      className={`p-5 rounded-[24px] border transition-all duration-300 ${open ? 'ring-2 ring-slate-900 bg-white border-transparent shadow-xl' : 'bg-white border-slate-100'}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="text-sm font-black text-slate-900 leading-none">{item.knowledgePoint}</p>
                            <span className="text-[8px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-black tracking-widest uppercase">
                              {LEVEL_LABELS[item.level as number] || '未知'}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400">
                            <span className="flex items-center gap-1.5"><Zap size={10} className="text-amber-400" /> 未掌握 {item.unmasteredCount} 人</span>
                            <span className="flex items-center gap-1.5"><Target size={10} className="text-slate-300" /> {item.coverage}% 未掌握</span>
                          </div>
                        </div>
                        <button
                          onClick={() => setOpenNode(open ? null : item.id)}
                          className={`p-2.5 rounded-xl transition-all ${open ? 'bg-slate-900 text-white rotate-180' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                        >
                          <ChevronDown size={14} />
                        </button>
                      </div>
                      {open && (
                        <div className="mt-5 pt-5 border-t border-slate-50 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                              <p className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-wider">健康评分</p>
                              <p className="text-sm font-black text-slate-900">{item.healthScore}</p>
                            </div>
                            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                              <p className="text-[9px] font-black text-slate-400 uppercase mb-1 tracking-wider">考频权重</p>
                              <p className="text-sm font-black text-slate-900">{(item.importance * 100).toFixed(0)}%</p>
                            </div>
                          </div>
    
                        </div>
                      )}
                    </div>
                  );
                })}
                {pagedNodes.length === 0 && (
                  <div className="text-sm text-slate-400 font-bold text-center py-4">暂无数据</div>
                )}
              </div>
              <div className="flex items-center justify-between mt-4 text-xs text-slate-500">
                <div>共 {filteredNodes.length} 个节点 · 每页 {UI_LIMITS.listPageSize} 个</div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 rounded-lg border text-slate-600 disabled:opacity-50"
                  >
                    上一页
                  </button>
                  <span className="text-slate-700 font-black">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 rounded-lg border text-slate-600 disabled:opacity-50"
                  >
                    下一页
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'mistake' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 rounded-xl">
                <AlertTriangle size={24} className="text-amber-500" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900">高频错题洞察</h3>
                <p className="text-xs font-bold text-slate-400">基于错误率与班级影响维度的智能排序</p>
              </div>
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-white px-4 py-2 rounded-full border border-slate-100">
              班级共性难题清单
            </span>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {sortedMistakes.map((item) => {
              const open = openMistakeId === item.id;
              return (
                <Card 
                  key={item.id} 
                  className={`p-6 border transition-all duration-300 rounded-[32px] ${open ? 'border-amber-200 ring-4 ring-amber-50 shadow-xl bg-white' : 'border-slate-100 shadow-sm bg-white'}`}
                >
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <p className="text-xl font-black text-slate-900 leading-tight">{item.questionSnippet}</p>
                        <span className="text-[9px] px-3 py-1 rounded-full bg-amber-50 text-amber-600 font-black flex items-center gap-1.5 border border-amber-100 uppercase">
                          <Clock3 size={10} /> 任务期限：{item.deadlineLabel || '本周'}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-[11px] font-bold text-slate-500 mb-6 border-b border-slate-50 pb-4">
                        <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-400" /> 班级错误率 <span className="text-red-600 font-black">{item.errorRate}%</span></span>
                        <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-slate-300" /> 样本量 {item.totalAttempts} 人</span>
                        <span className="flex items-center gap-2 underline decoration-slate-200 underline-offset-4">题型：{item.questionType}</span>
                        <span className="text-slate-900 bg-slate-50 px-2 py-0.5 rounded">科目：{item.subject}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-5">
                        {item.knowledgePoints?.map((kp, idx) => (
                          <span key={idx} className="text-[9px] px-3 py-1 rounded-lg bg-slate-100 text-slate-500 font-black">#{kp}</span>
                        ))}
                      </div>
                      <div className="p-3 bg-slate-900 rounded-2xl inline-flex items-center gap-3 shadow-lg shadow-slate-200">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                          系统推荐处理权重
                        </p>
                        <div className="w-px h-3 bg-slate-700" />
                        <p className="text-sm font-black text-white italic">
                          {item.weight.toFixed(1)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setOpenMistakeId(open ? null : item.id)}
                      className={`px-6 py-3 rounded-2xl text-xs font-black transition-all ${open ? 'bg-amber-500 text-white shadow-lg shadow-amber-200' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                    >
                      {open ? '收起详情' : '展开题目解析'}
                    </button>
                  </div>
                  
                  {open && (
                    <div className="mt-8 pt-8 border-t border-slate-100 space-y-8 animate-in fade-in duration-500">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-6 bg-slate-900 rounded-full" />
                            <h4 className="font-black text-slate-900 text-sm">题干内容</h4>
                          </div>
                          <div className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-6 rounded-[24px] border border-slate-100 font-medium">
                            {item.fullQuestion}
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                            <h4 className="font-black text-slate-900 text-sm">标准解析 (由 Lumi 提供)</h4>
                          </div>
                          <div className="text-sm text-emerald-800 leading-relaxed bg-emerald-50 p-6 rounded-[24px] border border-emerald-100 font-medium italic">
                            {item.correctAnswer}
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
                          <h4 className="font-black text-slate-900 text-sm">班级学生作答详情分布</h4>
                        </div>
                        <div className="overflow-hidden border border-slate-100 rounded-[24px] shadow-sm">
                          <table className="min-w-full text-xs">
                            <thead className="bg-slate-50 text-slate-500 font-black uppercase tracking-wider">
                              <tr>
                                <th className="px-6 py-5 text-left font-black">学生基本信息</th>
                                <th className="px-6 py-5 text-left font-black">掌握评价</th>
                                <th className="px-6 py-5 text-left font-black">提交答案记录</th>
                                <th className="px-6 py-5 text-left font-black">答题耗时</th>
                                <th className="px-6 py-5 text-right font-black">最后尝试时间</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-50">
                              {(item.attempts || []).map((att) => (
                                <tr key={att.id} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-400 text-xs shadow-inner">
                                        {att.name.charAt(0)}
                                      </div>
                                      <div>
                                        <p className="font-black text-slate-900">{att.name}</p>
                                        <p className="text-[10px] font-bold text-slate-400 tracking-tighter">STUDENT ID: {att.studentId}</p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${att.correct ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                      {att.correct ? '已通过' : '未通过'}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 font-black text-slate-700">{att.answer}</td>
                                  <td className="px-6 py-4 font-bold text-slate-500">{att.duration}</td>
                                  <td className="px-6 py-4 text-right font-bold text-slate-400 italic">{att.time}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      <div className="py-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">
                         <p className="text-[10px] text-slate-400 font-bold italic tracking-widest">
                           数据实时同步：基于学生端最近一次作答（近 7 天），逻辑已由 AI 服务校验
                         </p>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
