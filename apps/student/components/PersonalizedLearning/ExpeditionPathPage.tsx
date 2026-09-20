import React, { useState, useRef, useLayoutEffect, useMemo, useEffect } from 'react';
import { motion as motionOriginal, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Sparkles, Rocket, RefreshCw, CirclePlay, AlertTriangle } from 'lucide-react';
import { ExpeditionPlan, MapNode, Task } from '../../types';
import { DynamicExpeditionCapsule } from './DynamicExpeditionCapsule';
import { NodeDetailModal } from './NodeDetailModal';
import { GameNodeComponent } from './GameNode';
import { VideoLesson } from '../Learning/VideoLesson';
import { expeditionSession } from './expeditionSessionBridge';
import pathHeroAvatar from '@/assets/girl_v0.1-removebg-preview.png';
import {
  buildExpeditionMapNodes,
  GEOMETRY_KNOWLEDGE_POINTS,
  BuildExpeditionMapNodesOptions,
} from './expeditionMapNodes';
import { resolvePlanLevelTitles } from './expeditionPlanConfig';
import { ExpeditionContinuePrompt } from './ExpeditionContinuePrompt';
import {
  buildPlanCatalog,
  flattenSelectableItems,
  getPlanQuota,
  getSelectionMode,
  remainingItemsForContinue,
  type ContinuePromptKind,
} from './expeditionCatalog';

const motion = motionOriginal as any;

const WEEKLY_THEMES = [
  { id: 'nebula', name: '紫雾星云', accent: 'text-violet-300' },
  { id: 'cyan', name: '青辉航线', accent: 'text-cyan-300' },
  { id: 'amber', name: '琥珀星域', accent: 'text-amber-300' },
];

const STAR_FIELD = Array.from({ length: 70 }, (_, i) => ({
  id: i,
  left: `${(i * 17 + 11) % 100}%`,
  top: `${(i * 29 + 7) % 100}%`,
  size: i % 5 === 0 ? 3 : i % 3 === 0 ? 2 : 1,
  delay: (i % 8) * 0.35,
  opacity: 0.35 + ((i * 13) % 50) / 100,
}));

const WeekSection: React.FC<{ week: any; children: React.ReactNode }> = ({ week, children }) => (
  <div className="relative flex flex-col items-center shrink-0 px-8">
    <div className={`mb-6 text-center ${week.theme.accent}`}>
      <div className="text-[9px] font-black uppercase tracking-[0.22em] opacity-60">Expedition</div>
      <div className="text-lg font-black tracking-tight text-white/90">{week.weekLabel}</div>
      <div className="text-[11px] font-medium opacity-80 mt-0.5">{week.theme.name}</div>
    </div>
    {children}
  </div>
);

interface ExpeditionPathPageProps {
  plan: ExpeditionPlan;
  activeSubject: string;
  learningSessionSignal?: number;
  completedCount: number;
  planStatus: 'active' | 'completed';
  onCompletedCountChange?: (count: number) => void;
  onPlanStatusChange?: (status: 'active' | 'completed') => void;
  onBack: () => void;
  onStartLevel?: (taskInfo: Partial<Task>) => void;
  onNewPlan?: () => void;
  onExitPlan?: () => void;
  onReturnHome?: () => void;
  readOnly?: boolean;
  mapOptions?: BuildExpeditionMapNodesOptions;
  historyLabel?: string;
  onExtendPlan?: (next: { levelTitles: string[]; selectedIds: string[] }) => void;
  onFinishEarly?: () => void;
}

export const ExpeditionPathPage: React.FC<ExpeditionPathPageProps> = ({
  plan,
  activeSubject,
  completedCount,
  planStatus,
  onBack,
  onStartLevel,
  onNewPlan,
  onExitPlan,
  readOnly = false,
  mapOptions,
  historyLabel,
  onExtendPlan,
  onFinishEarly,
}) => {
  const [selectedNode, setSelectedNode] = useState<MapNode | null>(null);
  const [videoTask, setVideoTask] = useState<Task | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [lockedHint, setLockedHint] = useState('');
  const [continueKind, setContinueKind] = useState<ContinuePromptKind | null>(null);
  const [pathD, setPathD] = useState('');
  const [isMapReady, setIsMapReady] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const contentContainerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const resolvedMapOptions = useMemo<BuildExpeditionMapNodesOptions>(() => {
    if (mapOptions?.totalLevels != null && mapOptions?.titles) return mapOptions;
    const titles = resolvePlanLevelTitles(plan);
    return {
      totalLevels: titles.length || getPlanQuota(plan.duration),
      titles,
    };
  }, [mapOptions, plan]);

  const expeditionNodes = useMemo(() => {
    const totalLevels = resolvedMapOptions.totalLevels ?? GEOMETRY_KNOWLEDGE_POINTS.length;
    const count = planStatus === 'completed' ? totalLevels : completedCount;
    return buildExpeditionMapNodes(count, resolvedMapOptions);
  }, [completedCount, planStatus, resolvedMapOptions]);

  /** Left → right: level ascending; zigzag on Y */
  const displayNodes = useMemo(() => {
    const sorted = [...expeditionNodes].sort((a, b) => a.level - b.level);
    const baseOffset = 48;
    return sorted.map((node, index) => {
      const isBase = index === 0;
      let yOffset = isBase ? 0 : index % 2 === 0 ? -baseOffset : baseOffset;
      if (node.xOffset !== undefined) {
        // reuse existing offset field as vertical amplitude if authored
        yOffset = node.xOffset;
      }
      return { ...node, yOffset };
    });
  }, [expeditionNodes]);

  const sprintGroups = useMemo(() => {
    if (displayNodes.length === 0) return [];
    const nodes = [...displayNodes];
    const weeks: any[] = [];
    const DAYS_PER_WEEK = 7;
    let nodeIdx = 0;
    let weekCount = 0;

    while (nodeIdx < nodes.length) {
      const chunk = nodes.slice(nodeIdx, nodeIdx + DAYS_PER_WEEK);
      if (chunk.length === 0) break;
      const isAllCompleted = chunk.every((n) => n.status === 'completed');
      const hasCurrent = chunk.some((n) => n.status === 'current');
      let status = 'locked';
      if (isAllCompleted) status = 'completed';
      else if (hasCurrent) status = 'current';

      weeks.push({
        id: `week-${weekCount}`,
        weekLabel: `Week ${weekCount + 1}`,
        theme: WEEKLY_THEMES[weekCount % WEEKLY_THEMES.length],
        status,
        nodes: chunk.map((node, index) => ({
          ...node,
          dayIndex: index + 1,
        })),
      });
      nodeIdx += DAYS_PER_WEEK;
      weekCount++;
    }
    return weeks;
  }, [displayNodes]);

  useLayoutEffect(() => {
    if (sprintGroups.length === 0 || !contentContainerRef.current) return;

    const timer = setTimeout(() => {
      if (!contentContainerRef.current) return;
      const containerRect = contentContainerRef.current.getBoundingClientRect();
      const points: { x: number; y: number }[] = [];
      const scrollLeft = scrollContainerRef.current?.scrollLeft ?? 0;

      sprintGroups.forEach((week) => {
        week.nodes.forEach((node: any) => {
          const el = nodeRefs.current.get(node.id);
          if (el && contentContainerRef.current) {
            const elRect = el.getBoundingClientRect();
            const actualX =
              elRect.left - containerRect.left + elRect.width / 2 + scrollLeft;
            const actualY = elRect.top - containerRect.top + elRect.height / 2;
            points.push({ x: actualX, y: actualY });
          }
        });
      });

      if (points.length < 2) {
        setPathD('');
        setIsMapReady(true);
        return;
      }

      let d = `M ${points[0].x} ${points[0].y}`;
      for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        const distX = p2.x - p1.x;
        const tension = 0.35;
        d += ` C ${p1.x + distX * tension} ${p1.y}, ${p2.x - distX * tension} ${p2.y}, ${p2.x} ${p2.y}`;
      }
      setPathD(d);

      const currentNode = displayNodes.find((n) => n.status === 'current');
      if (currentNode && scrollContainerRef.current) {
        const el = nodeRefs.current.get(currentNode.id);
        const container = scrollContainerRef.current;
        if (el) {
          const containerRect = container.getBoundingClientRect();
          const elRect = el.getBoundingClientRect();
          const offset =
            elRect.left - containerRect.left - containerRect.width / 2 + elRect.width / 2;
          container.scrollTo({ left: container.scrollLeft + offset, behavior: 'smooth' });
        }
      }

      requestAnimationFrame(() => setIsMapReady(true));
    }, 120);

    return () => clearTimeout(timer);
  }, [sprintGroups, displayNodes]);

  useEffect(() => {
    if (!lockedHint) return;
    const timer = window.setTimeout(() => setLockedHint(''), 1800);
    return () => window.clearTimeout(timer);
  }, [lockedHint]);

  useEffect(() => {
    if (readOnly || planStatus !== 'active' || plan.continuePromptHandled) {
      setContinueKind(null);
      return;
    }
    const quota = getPlanQuota(plan.duration);
    const scheduled = resolvePlanLevelTitles(plan).length;
    if (completedCount < scheduled || completedCount >= quota) {
      setContinueKind(null);
      return;
    }
    const mode = getSelectionMode(plan.subject || activeSubject);
    const catalog = buildPlanCatalog(plan.subject || activeSubject, plan.textbook);
    const items = flattenSelectableItems(catalog, mode);
    setContinueKind(remainingItemsForContinue(items, plan, mode).kind);
  }, [
    readOnly,
    planStatus,
    plan,
    completedCount,
    activeSubject,
  ]);
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const handleNodeClick = (node: MapNode) => {
    if (node.status === 'locked') {
      setLockedHint('请先通关上一关哦');
      return;
    }
    setSelectedNode(node);
  };

  const handleContinueConfirm = () => {
    const quota = getPlanQuota(plan.duration);
    const remainSlots = Math.max(0, quota - completedCount);
    const mode = getSelectionMode(plan.subject || activeSubject);
    const catalog = buildPlanCatalog(plan.subject || activeSubject, plan.textbook);
    const items = flattenSelectableItems(catalog, mode);
    const { extras } = remainingItemsForContinue(items, plan, mode);
    const added = extras.slice(0, remainSlots);
    if (added.length === 0) {
      onFinishEarly?.();
      setContinueKind(null);
      return;
    }
    const currentTitles = resolvePlanLevelTitles(plan);
    onExtendPlan?.({
      levelTitles: [...currentTitles, ...added.map((item) => item.label)],
      selectedIds: [...(plan.selectedIds ?? []), ...added.map((item) => item.id)],
    });
    setContinueKind(null);
  };

  const buildTaskFromNode = (node: MapNode): Task => ({
    id: node.id,
    title: node.title,
    subject: activeSubject,
    durationMinutes: node.durationMinutes ?? 15,
    completed: node.status === 'completed',
    levelType: node.nodeType,
    quizType: node.quizType,
  });

  const handleStart = () => {
    if (readOnly || !selectedNode || !onStartLevel) return;
    expeditionSession.pendingNodeId = selectedNode.id;
    onStartLevel(buildTaskFromNode(selectedNode));
    setSelectedNode(null);
  };

  const handleWatchVideo = (node: MapNode) => {
    if (readOnly || node.status !== 'completed') return;
    setVideoTask(buildTaskFromNode(node));
    setSelectedNode(null);
  };

  const handleConfirmExit = () => {
    setShowExitConfirm(false);
    onExitPlan?.();
  };

  const showExitButton = !readOnly && planStatus === 'active' && !!onExitPlan;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="absolute inset-0 left-0 right-0 w-full max-w-full min-w-0 flex flex-col overflow-hidden z-30"
      style={{
        background:
          'radial-gradient(ellipse at 20% 30%, #2a1b4d 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, #0f2a4a 0%, transparent 45%), linear-gradient(135deg, #070B1A 0%, #12102A 45%, #0A1528 100%)',
      }}
    >
      {/* Galaxy / space backdrop */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -left-20 w-[55%] h-[55%] rounded-full bg-violet-600/20 blur-[100px]" />
        <div className="absolute top-[20%] right-[-10%] w-[45%] h-[50%] rounded-full bg-cyan-500/15 blur-[110px]" />
        <div className="absolute bottom-[-15%] left-[25%] w-[50%] h-[40%] rounded-full bg-indigo-500/20 blur-[120px]" />
        <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] rounded-full bg-fuchsia-500/10 blur-[90px]" />
        {STAR_FIELD.map((star) => (
          <span
            key={star.id}
            className="absolute rounded-full bg-white animate-pulse"
            style={{
              left: star.left,
              top: star.top,
              width: star.size,
              height: star.size,
              opacity: star.opacity,
              animationDelay: `${star.delay}s`,
              boxShadow: star.size > 1 ? '0 0 6px rgba(255,255,255,0.8)' : undefined,
            }}
          />
        ))}
        {/* faint grid of distant stars band */}
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              'radial-gradient(1px 1px at 10% 20%, white, transparent), radial-gradient(1px 1px at 30% 70%, white, transparent), radial-gradient(1.5px 1.5px at 70% 40%, white, transparent), radial-gradient(1px 1px at 90% 80%, white, transparent)',
            backgroundSize: '220px 180px',
          }}
        />
      </div>

      <div className="relative z-50 shrink-0 w-full max-w-full min-w-0 flex justify-center">
        <div className="w-full max-w-5xl min-w-0 mx-auto px-4 sm:px-6 pt-3 pb-2">
          {!readOnly && planStatus === 'completed' && onNewPlan && (
            <div className="flex justify-end mb-2">
              <button
                type="button"
                onClick={onNewPlan}
                className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/30 hover:bg-indigo-400 transition-colors whitespace-nowrap"
              >
                <RefreshCw size={14} className="shrink-0" />
                <span className="hidden min-[380px]:inline">生成新的学习计划</span>
                <span className="min-[380px]:hidden">新计划</span>
              </button>
            </div>
          )}

          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={onBack}
              className="shrink-0 flex items-center gap-1 px-3 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-white text-sm font-bold hover:bg-white/15 transition-colors"
            >
              <ChevronLeft size={18} className="shrink-0" />
              <span className="whitespace-nowrap">返回</span>
            </button>

            {!readOnly ? (
              <>
                <div className="min-w-0">
                  <DynamicExpeditionCapsule
                    plan={plan}
                    sharedLayout={false}
                    className="max-w-none"
                    completedLevels={
                      planStatus === 'completed'
                        ? Math.max(1, plan.duration * 7)
                        : completedCount
                    }
                    elapsedDays={
                      planStatus === 'completed'
                        ? Math.max(1, plan.duration * 7)
                        : completedCount
                    }
                  />
                </div>
                {showExitButton ? (
                  <button
                    type="button"
                    onClick={() => setShowExitConfirm(true)}
                    className="shrink-0 px-2.5 sm:px-3 py-2 rounded-xl bg-white/10 border border-white/15 backdrop-blur-md text-[11px] sm:text-xs font-bold text-white/70 hover:text-rose-300 hover:border-rose-300/40 hover:bg-rose-500/10 transition-colors whitespace-nowrap"
                  >
                    结束计划
                  </button>
                ) : (
                  <div className="w-0" aria-hidden />
                )}
              </>
            ) : (
              <div className="col-span-2 min-w-0 flex items-center justify-end min-h-[40px]">
                {historyLabel && (
                  <span className="min-w-0 max-w-full truncate text-xs font-bold text-indigo-200 bg-indigo-500/20 border border-indigo-300/30 px-3 py-1.5 rounded-xl">
                    {historyLabel}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Horizontal path: left → right */}
      <div
        ref={scrollContainerRef}
        className="relative z-0 flex-1 min-h-0 w-full overflow-x-auto overflow-y-hidden no-scrollbar scroll-smooth"
      >
        <motion.div
          ref={contentContainerRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: isMapReady ? 1 : 0 }}
          transition={{ duration: 0.5 }}
          className="relative h-full min-h-[420px] flex items-center px-8 py-6"
          style={{ width: 'max-content', minWidth: '100%' }}
        >
          <div className="absolute inset-0 pointer-events-none z-10 overflow-visible">
            <svg className="absolute inset-0 w-full h-full overflow-visible">
              <defs>
                <linearGradient id="expThemeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#22d3ee" />
                  <stop offset="50%" stopColor="#a78bfa" />
                  <stop offset="100%" stopColor="#f472b6" />
                </linearGradient>
                <linearGradient id="expEnergyFill" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="white" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="white" stopOpacity="0.15" />
                </linearGradient>
                <filter id="expGlow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="10" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              {pathD && (
                <>
                  <path
                    d={pathD}
                    fill="none"
                    stroke="url(#expThemeGradient)"
                    strokeOpacity="0.55"
                    strokeWidth="36"
                    strokeLinecap="round"
                    filter="url(#expGlow)"
                  />
                  <path
                    d={pathD}
                    fill="none"
                    stroke="rgba(255,255,255,0.28)"
                    strokeWidth="10"
                    strokeLinecap="round"
                  />
                  <motion.path
                    d={pathD}
                    fill="none"
                    stroke="url(#expEnergyFill)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray="18 36"
                    animate={{ strokeDashoffset: [0, -54] }}
                    transition={{ repeat: Infinity, duration: 1.4, ease: 'linear' }}
                  />
                </>
              )}
            </svg>
          </div>

          {/* Start */}
          <div className="relative z-20 flex flex-col items-center shrink-0 mr-12 pr-4">
            <div className="w-20 h-8 rounded-[100%] bg-cyan-400/15 border border-cyan-300/40 flex items-center justify-center shadow-[0_0_24px_rgba(34,211,238,0.25)]">
              <Rocket size={14} className="text-cyan-300" />
            </div>
            <span className="text-[10px] font-black text-cyan-300/90 mt-2 uppercase tracking-widest">
              Base Camp
            </span>
          </div>

          <div className="relative z-20 flex items-start gap-2">
            {sprintGroups.map((week) => (
              <WeekSection key={week.id} week={week}>
                <div className="flex flex-row items-center gap-28 relative z-10 px-4 pb-4 pt-8">
                  {week.nodes.map((node: MapNode & { dayIndex: number; yOffset?: number }) => {
                    const yOffset = node.yOffset ?? 0;
                    return (
                      <div
                        key={node.id}
                        ref={(el) => {
                          if (el) nodeRefs.current.set(node.id, el);
                        }}
                        className="relative flex flex-col items-center shrink-0"
                        style={{ transform: `translateY(${yOffset}px)` }}
                      >
                        <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-black text-white/40 uppercase tracking-widest pointer-events-none whitespace-nowrap">
                          Day {node.dayIndex}
                        </div>
                        <div className="relative z-10 flex flex-col items-center gap-1.5">
                          {node.status === 'current' && (
                            <motion.div
                              className="absolute -top-14 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center pointer-events-none"
                              animate={{ y: [0, -6, 0] }}
                              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                            >
                              <div className="relative">
                                <div className="absolute inset-0 rounded-full bg-indigo-400/45 blur-md animate-pulse" />
                                <img
                                  src={pathHeroAvatar}
                                  alt="我在这里"
                                  className="relative w-12 h-14 object-contain drop-shadow-lg"
                                />
                              </div>
                              <div className="mt-0.5 px-2 py-0.5 rounded-full bg-indigo-500 text-white text-[9px] font-black shadow-md shadow-indigo-500/40 whitespace-nowrap">
                                闯到这关啦
                              </div>
                              <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent border-t-indigo-500" />
                            </motion.div>
                          )}
                          <GameNodeComponent node={node} onClick={() => handleNodeClick(node)} />
                          {node.status === 'completed' && !readOnly && (
                            <motion.button
                              type="button"
                              initial={{ opacity: 0, y: -4 }}
                              animate={{ opacity: 1, y: 0 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleWatchVideo(node);
                              }}
                              className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-500 text-white text-[10px] font-black shadow-lg shadow-indigo-500/30 hover:bg-indigo-400 transition-colors shrink-0 whitespace-nowrap"
                            >
                              <CirclePlay size={12} className="shrink-0" />
                              看视频
                            </motion.button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </WeekSection>
            ))}
          </div>

          {/* Goal on the right */}
          <div className="relative z-20 flex flex-col items-center shrink-0 ml-16 pl-4 opacity-90">
            <div className="w-20 h-20 rounded-full border-2 border-dashed border-fuchsia-300/50 flex items-center justify-center shadow-[0_0_28px_rgba(244,114,182,0.25)]">
              <Sparkles size={24} className="text-fuchsia-300" />
            </div>
            <span className="text-[10px] font-black text-fuchsia-300 mt-2 tracking-widest uppercase">
              Goal
            </span>
          </div>
        </motion.div>
      </div>

      <NodeDetailModal
        node={selectedNode}
        onClose={() => setSelectedNode(null)}
        onStart={handleStart}
        onWatchVideo={
          selectedNode?.status === 'completed' && !readOnly
            ? () => handleWatchVideo(selectedNode)
            : undefined
        }
        readOnly={readOnly}
      />

      <AnimatePresence>
        {showExitConfirm && (
          <motion.div
            key="exit-plan-confirm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[80] flex items-center justify-center px-6 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setShowExitConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 12 }}
              transition={{ type: 'spring', damping: 24, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xs bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 text-center"
            >
              <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-rose-50 flex items-center justify-center">
                <AlertTriangle size={26} className="text-rose-500" />
              </div>
              <h3 className="text-lg font-black text-slate-800">确定结束该学习计划？</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">
                结束后计划结束，未完成的关卡将清空，已获得的成就和进度会保留。
              </p>
              <div className="mt-6 flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={handleConfirmExit}
                  className="w-full py-3 rounded-2xl bg-rose-500 text-white text-sm font-black shadow-lg shadow-rose-500/25 hover:bg-rose-600 transition-colors"
                >
                  确认结束
                </button>
                <button
                  type="button"
                  onClick={() => setShowExitConfirm(false)}
                  className="w-full py-3 rounded-2xl bg-slate-100 text-slate-600 text-sm font-bold hover:bg-slate-200 transition-colors"
                >
                  暂不结束
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {videoTask && (
          <motion.div
            key={`level-video-${videoTask.id}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="absolute inset-0 z-[70] bg-white"
          >
            <VideoLesson
              mode="review"
              task={videoTask}
              onComplete={() => setVideoTask(null)}
              onExit={() => setVideoTask(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {lockedHint ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="pointer-events-none absolute inset-x-0 bottom-8 z-[90] flex justify-center px-6"
          >
            <div className="rounded-full bg-white/95 px-4 py-2 text-[12px] font-black text-slate-700 shadow-lg">
              {lockedHint}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <ExpeditionContinuePrompt
        open={Boolean(continueKind)}
        kind={continueKind}
        onConfirm={handleContinueConfirm}
        onEnd={() => {
          setContinueKind(null);
          onFinishEarly?.();
        }}
      />
    </motion.div>
  );
};
