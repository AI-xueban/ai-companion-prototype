import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ChevronLeft, Printer } from 'lucide-react';
import {
  countSelectedChapters,
  DEFAULT_PRACTICE_SCENARIO,
  locateSelfTestTarget,
  recommendPracticeQuestionCount,
  selfTestHasKnowledgePoints,
  selfTestLeafNoun,
  selfTestEmptyHint,
  type PracticeDifficulty,
  type PracticeScenarioCode,
  type SelfTestTreeNode,
} from '../../data/juniorSyncAssessment';
import { PracticeSetupDialog, type PracticeSetupResult } from './PracticeSetupDialog';
import { PracticeShortageDialog } from './PracticeShortageDialog';
import { PaperPrintFlow, type PaperPrintJob } from './PaperPrintFlow';
import {
  getDemoStock,
  difficultyLevelOf,
  isDailyQuotaShortageKind,
  isHardBlockShortageKind,
  shiftDifficulty,
  shortageKindFromSelectedLeaves,
  matchPrintExceptionDemo,
  printExceptionDemoFromSelectedLeaves,
  type PracticeShortageKind,
} from '../../data/practiceShortageDemo';

interface SyncSelfTestPageProps {
  open: boolean;
  subject: string;
  grade: string;
  term: string;
  version?: string;
  tree: SelfTestTreeNode[];
  currentChapterHint?: string;
  currentSectionHint?: string;
  subjects?: string[];
  onSubjectChange?: (subject: string) => void;
  pageTitle?: string;
  startLabel?: string;
  layerClassName?: string;
  onBack: () => void;
  onStart: (payload: {
    selectedIds: string[];
    questionCount: number;
    title: string;
    difficulty: PracticeDifficulty;
    difficultyLevel: 1 | 2 | 3 | 4 | 5;
    scenario: PracticeScenarioCode;
    scenarioLabel: string;
  }) => void;
  onPrint?: (payload: {
    selectedIds: string[];
    questionCount: number;
    title: string;
    difficulty: PracticeDifficulty;
    difficultyLevel: 1 | 2 | 3 | 4 | 5;
    scenario: PracticeScenarioCode;
    scenarioLabel: string;
    questionTypeCounts?: PracticeSetupResult['questionTypeCounts'];
    paperTitle?: string;
    paperKind?: string;
    includeAnswerAnalysis?: boolean;
    printExceptionDemo?: PaperPrintJob['printExceptionDemo'];
  }) => PaperPrintJob;
}

function getLeafIds(node: SelfTestTreeNode): string[] {
  if (!node.children?.length) return [node.id];
  return node.children.flatMap(getLeafIds);
}

function countLeaves(node: SelfTestTreeNode): number {
  return getLeafIds(node).length;
}

function isKnowledgeGroup(node: SelfTestTreeNode) {
  return Boolean(node.children?.length && node.children.every((child) => child.kind === 'knowledge'));
}

function buildSelectionMaps(nodes: SelfTestTreeNode[]) {
  const leafById = new Map<string, string[]>();
  const walk = (node: SelfTestTreeNode) => {
    leafById.set(node.id, getLeafIds(node));
    node.children?.forEach(walk);
  };
  nodes.forEach(walk);
  return leafById;
}

function getSelectedLeafLabels(nodes: SelfTestTreeNode[], selected: Set<string>) {
  const labels: string[] = [];
  const walk = (node: SelfTestTreeNode) => {
    if (!node.children?.length && selected.has(node.id)) labels.push(node.title);
    node.children?.forEach(walk);
  };
  nodes.forEach(walk);
  return labels;
}

function defaultExpanded(nodes: SelfTestTreeNode[]) {
  const expanded: Record<string, boolean> = {};
  const walk = (node: SelfTestTreeNode, depth: number) => {
    const kids = node.children ?? [];
    if (!kids.length) return;
    if (depth <= 2 || isKnowledgeGroup(node) || kids.every((child) => !child.children?.length)) {
      expanded[node.id] = true;
    }
    kids.forEach((child) => walk(child, depth + 1));
  };
  nodes.forEach((node) => walk(node, 0));
  return expanded;
}

function NodeCheckbox({
  checked,
  indeterminate,
  onChange,
}: {
  checked: boolean;
  indeterminate: boolean;
  onChange: () => void;
}) {
  return (
    <input
      type="checkbox"
      checked={checked}
      ref={(el) => {
        if (el) el.indeterminate = indeterminate;
      }}
      onChange={onChange}
      className="h-4 w-4 shrink-0 rounded border-slate-300 text-violet-600 focus:ring-violet-500"
    />
  );
}

function KnowledgeChips({
  nodes,
  selectedLeaves,
  selectable,
  onToggleNode,
}: {
  nodes: SelfTestTreeNode[];
  selectedLeaves: Set<string>;
  selectable: boolean;
  onToggleNode: (node: SelfTestTreeNode) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5 pt-1">
      {nodes.map((node) => {
        const selected = selectedLeaves.has(node.id);
        const selectedClass = selected
          ? 'border-violet-300 bg-violet-50 text-violet-700'
          : 'border-slate-200 bg-white text-slate-600';
        if (!selectable) {
          return (
            <span
              key={node.id}
              className={`max-w-full truncate rounded-full border px-2.5 py-1 text-[11px] font-medium ${selectedClass}`}
            >
              {node.title}
            </span>
          );
        }
        return (
          <button
            key={node.id}
            type="button"
            onClick={() => onToggleNode(node)}
            className={`max-w-full truncate rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
              selected
                ? selectedClass
                : `${selectedClass} hover:border-violet-200 hover:bg-violet-50/50`
            }`}
          >
            {node.title}
          </button>
        );
      })}
    </div>
  );
}

function TreeNodeRow({
  node,
  depth,
  expanded,
  selectedLeaves,
  leafById,
  knowledgeChipsSelectable,
  onToggleExpand,
  onToggleNode,
}: {
  node: SelfTestTreeNode;
  depth: number;
  expanded: Record<string, boolean>;
  selectedLeaves: Set<string>;
  leafById: Map<string, string[]>;
  knowledgeChipsSelectable: boolean;
  onToggleExpand: (id: string) => void;
  onToggleNode: (node: SelfTestTreeNode) => void;
}) {
  const leaves = leafById.get(node.id) ?? [];
  const selectedCount = leaves.filter((id) => selectedLeaves.has(id)).length;
  const checked = leaves.length > 0 && selectedCount === leaves.length;
  const indeterminate = selectedCount > 0 && selectedCount < leaves.length;
  const hasChildren = Boolean(node.children?.length);
  const knowledgeGroup = isKnowledgeGroup(node);
  const isOpen = expanded[node.id] ?? depth < 1;
  const leafCount = countLeaves(node);

  if (node.kind === 'knowledge') {
    return null;
  }

  return (
    <div className={depth === 0 ? 'border-b border-indigo-50 last:border-b-0' : ''}>
      <div
        data-self-test-node={node.id}
        className={`flex items-center gap-2 py-1.5 pr-1 ${depth === 0 ? 'px-1' : 'rounded-lg hover:bg-slate-50'}`}
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            aria-label={isOpen ? '收起' : '展开'}
            onClick={() => onToggleExpand(node.id)}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100"
          >
            <ChevronDown size={14} className={`transition-transform ${isOpen ? '' : '-rotate-90'}`} />
          </button>
        ) : (
          <span className="h-6 w-6 shrink-0" />
        )}
        <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2">
          <NodeCheckbox checked={checked} indeterminate={indeterminate} onChange={() => onToggleNode(node)} />
          <span className={`min-w-0 flex-1 truncate text-[13px] ${depth === 0 || hasChildren ? 'font-medium text-slate-800' : 'text-slate-700'}`}>
            {node.title}
          </span>
          {hasChildren ? (
            <span className="shrink-0 text-[10px] text-slate-400">
              {selectedCount > 0 ? `${selectedCount}/` : ''}{leafCount}
            </span>
          ) : null}
        </label>
      </div>
      {hasChildren && isOpen && (
        knowledgeGroup ? (
          <div style={{ paddingLeft: `${depth * 12 + 34}px` }} className="pb-2 pr-1">
            <KnowledgeChips
              nodes={node.children!}
              selectedLeaves={selectedLeaves}
              selectable={knowledgeChipsSelectable}
              onToggleNode={onToggleNode}
            />
          </div>
        ) : (
          <div>
            {node.children!.map((child) => (
              <TreeNodeRow
                key={child.id}
                node={child}
                depth={depth + 1}
                expanded={expanded}
                selectedLeaves={selectedLeaves}
                leafById={leafById}
                knowledgeChipsSelectable={knowledgeChipsSelectable}
                onToggleExpand={onToggleExpand}
                onToggleNode={onToggleNode}
              />
            ))}
          </div>
        )
      )}
    </div>
  );
}

export const SyncSelfTestPage: React.FC<SyncSelfTestPageProps> = ({
  open,
  subject,
  grade,
  term,
  version,
  tree,
  currentChapterHint,
  currentSectionHint,
  subjects,
  onSubjectChange,
  pageTitle = '自主测 · 整册',
  startLabel = '开始自测',
  layerClassName = 'z-[550]',
  onBack,
  onStart,
  onPrint,
}) => {
  const viewport = typeof document !== 'undefined' ? document.getElementById('app-viewport') : null;
  const treeScrollRef = useRef<HTMLDivElement>(null);
  const leafById = useMemo(() => buildSelectionMaps(tree), [tree]);
  const [selectedLeaves, setSelectedLeaves] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [isAssembling, setIsAssembling] = useState(false);
  const [setupMode, setSetupMode] = useState<'online' | 'print'>('online');
  const [setupDraft, setSetupDraft] = useState<Pick<PracticeSetupResult, 'questionCount' | 'difficulty' | 'scenario' | 'questionTypeCounts'> | null>(null);
  const [printJob, setPrintJob] = useState<PaperPrintJob | null>(null);
  const assembleTimerRef = useRef<number | null>(null);
  useEffect(() => () => {
    if (assembleTimerRef.current) window.clearTimeout(assembleTimerRef.current);
  }, []);
  const [setupDifficulty, setSetupDifficulty] = useState<PracticeDifficulty>('中等');
  const [setupScenario, setSetupScenario] = useState<PracticeScenarioCode>(DEFAULT_PRACTICE_SCENARIO);
  const [shortageOverlay, setShortageOverlay] = useState<{
    kind: PracticeShortageKind;
    variant: 'below_count' | 'no_new' | 'empty_bank' | 'daily_limit' | 'subject_daily_limit';
    difficulty: PracticeDifficulty;
    scenario: PracticeScenarioCode;
    scenarioLabel: string;
    availableCount: number;
    requestedCount: number;
    beforeSetup?: boolean;
  } | null>(null);
  const hasKnowledge = selfTestHasKnowledgePoints(subject);
  const leafNoun = selfTestLeafNoun(subject);
  const showSubjectRail = Boolean(subjects && subjects.length > 1 && onSubjectChange);
  const knowledgeChipsSelectable = hasKnowledge;
  const located = useMemo(
    () => locateSelfTestTarget(tree, currentChapterHint, currentSectionHint),
    [tree, currentChapterHint, currentSectionHint],
  );

  useEffect(() => {
    if (!open) return;
    const nextExpanded: Record<string, boolean> = {};
    tree.forEach((chapter) => {
      nextExpanded[chapter.id] = chapter.id === located.chapterId;
    });
    located.expandIds.forEach((id) => {
      nextExpanded[id] = true;
    });
    if (!located.chapterId && !located.sectionId) {
      Object.assign(nextExpanded, defaultExpanded(tree));
    }
    setExpanded(nextExpanded);
    setSelectedLeaves(new Set());
    setIsSetupOpen(false);
    setIsAssembling(false);
    setSetupMode('online');
    setSetupDraft(null);
    setPrintJob(null);
    setShortageOverlay(null);

    const scrollId = located.sectionId || located.chapterId;
    const timer = window.setTimeout(() => {
      const container = treeScrollRef.current;
      if (!container || !scrollId) return;
      const el = container.querySelector(`[data-self-test-node="${scrollId}"]`);
      if (!(el instanceof HTMLElement)) return;
      const top = el.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop;
      container.scrollTo({ top: Math.max(0, top - 8), behavior: 'auto' });
    }, 360);
    return () => window.clearTimeout(timer);
  }, [open, tree, located]);

  const selectedCount = selectedLeaves.size;
  const selectedScopeLabels = useMemo(
    () => getSelectedLeafLabels(tree, selectedLeaves),
    [tree, selectedLeaves],
  );
  const chapterCount = useMemo(
    () => countSelectedChapters(tree, selectedLeaves),
    [tree, selectedLeaves],
  );
  const recommendedCount = recommendPracticeQuestionCount(selectedCount, chapterCount);
  const shortageKind = useMemo(
    () => shortageKindFromSelectedLeaves(tree, selectedLeaves),
    [tree, selectedLeaves],
  );
  const printExceptionDemo = useMemo(
    () => printExceptionDemoFromSelectedLeaves(tree, selectedLeaves)
      ?? selectedScopeLabels.map((label) => matchPrintExceptionDemo(label)).find(Boolean)
      ?? null,
    [tree, selectedLeaves, selectedScopeLabels],
  );

  const confirmStart = (
    setup: {
      questionCount: number;
      difficulty: PracticeDifficulty;
      difficultyLevel: 1 | 2 | 3 | 4 | 5;
      scenario: PracticeScenarioCode;
      scenarioLabel: string;
      questionTypeCounts?: PracticeSetupResult['questionTypeCounts'];
      paperTitle?: string;
      paperKind?: string;
      includeAnswerAnalysis?: boolean;
    },
    ignoreStock = false,
    mode: 'online' | 'print' = 'online',
  ) => {
    // 打印异常交给 PaperPrintFlow 的单一状态机处理，不能继续依赖设置页的组卷计时器。
    if (mode === 'print' && printExceptionDemo) {
      setIsAssembling(false);
      setIsSetupOpen(false);
      setShortageOverlay(null);
      setPrintJob({
        title: setup.paperTitle || `${subject}·自定义练习卷`,
        questionCount: setup.questionCount,
        subject,
        questionTypeCounts: setup.questionTypeCounts,
        includeAnswerAnalysis: setup.includeAnswerAnalysis,
        printExceptionDemo,
      });
      return;
    }
    const finishStart = () => {
      if (shortageKind && !ignoreStock) {
        if (isDailyQuotaShortageKind(shortageKind)) {
          setShortageOverlay({
            kind: shortageKind,
            variant: shortageKind,
            difficulty: setup.difficulty,
            scenario: setup.scenario,
            scenarioLabel: setup.scenarioLabel,
            availableCount: 0,
            requestedCount: setup.questionCount,
          });
          return;
        }
        if (shortageKind === 'empty_bank') {
          setShortageOverlay({
            kind: shortageKind,
            variant: 'empty_bank',
            difficulty: setup.difficulty,
            scenario: setup.scenario,
            scenarioLabel: setup.scenarioLabel,
            availableCount: 0,
            requestedCount: setup.questionCount,
          });
          return;
        }
        const availableCount = getDemoStock(shortageKind, setup.difficulty);
        if (availableCount <= 0) {
          setShortageOverlay({
            kind: shortageKind,
            variant: 'no_new',
            difficulty: setup.difficulty,
            scenario: setup.scenario,
            scenarioLabel: setup.scenarioLabel,
            availableCount: 0,
            requestedCount: setup.questionCount,
          });
          return;
        }
        if (availableCount < setup.questionCount) {
          setShortageOverlay({
            kind: shortageKind,
            variant: 'below_count',
            difficulty: setup.difficulty,
            scenario: setup.scenario,
            scenarioLabel: setup.scenarioLabel,
            availableCount,
            requestedCount: setup.questionCount,
          });
          return;
        }
      }
      setIsSetupOpen(false);
      setShortageOverlay(null);
      const payload = {
        selectedIds: [...selectedLeaves],
        questionCount: setup.questionCount,
        difficulty: setup.difficulty,
        difficultyLevel: setup.difficultyLevel,
        scenario: setup.scenario,
        scenarioLabel: setup.scenarioLabel,
        questionTypeCounts: setup.questionTypeCounts,
        includeAnswerAnalysis: setup.includeAnswerAnalysis,
        title: mode === 'print' && setup.paperTitle ? setup.paperTitle : `${pageTitle.includes('练习') ? '自主练习' : '自主测'} · ${setup.questionCount}题 · ${setup.difficulty} · ${setup.scenarioLabel}`,
      };
      if (mode === 'print') {
        const printPayload = { ...payload, printExceptionDemo };
        const requestedJob = onPrint?.(printPayload);
        setPrintJob({
          ...(requestedJob ?? {
          title: payload.title,
          questionCount: payload.questionCount,
          subject,
          questionTypeCounts: payload.questionTypeCounts,
          includeAnswerAnalysis: payload.includeAnswerAnalysis,
          }),
          // 异常章节是本次所选知识点的属性，不能被外层组卷回调覆盖或遗漏。
          printExceptionDemo: requestedJob?.printExceptionDemo ?? printExceptionDemo,
        });
        return;
      }
      onStart(payload);
    };
    if (ignoreStock || mode === 'print') {
      finishStart();
      return;
    }
    if (assembleTimerRef.current) window.clearTimeout(assembleTimerRef.current);
    setIsAssembling(true);
    assembleTimerRef.current = window.setTimeout(() => {
      setIsAssembling(false);
      assembleTimerRef.current = null;
      finishStart();
    }, 700);
  };

  const openSetup = (mode: 'online' | 'print') => () => {
    if (isDailyQuotaShortageKind(shortageKind)) {
      setShortageOverlay({
        kind: shortageKind,
        variant: shortageKind,
        difficulty: '中等',
        scenario: DEFAULT_PRACTICE_SCENARIO,
        scenarioLabel: '同步练习',
        availableCount: 0,
        requestedCount: 0,
        beforeSetup: true,
      });
      return;
    }
    if (!setupDraft) {
      setSetupDifficulty('中等');
      setSetupScenario(DEFAULT_PRACTICE_SCENARIO);
      setSetupDraft({
        questionCount: mode === 'print' ? Math.max(20, recommendedCount) : recommendedCount,
        difficulty: '中等',
        scenario: DEFAULT_PRACTICE_SCENARIO,
        questionTypeCounts: undefined,
      });
    }
    setSetupMode(mode);
    setIsAssembling(false);
    setIsSetupOpen(true);
  };

  const toggleNode = (node: SelfTestTreeNode) => {
    const leaves = leafById.get(node.id) ?? (node.kind === 'knowledge' ? [node.id] : []);
    if (!leaves.length) return;
    setSelectedLeaves((prev) => {
      const next = new Set(prev);
      const allSelected = leaves.every((id) => next.has(id));
      leaves.forEach((id) => {
        if (allSelected) next.delete(id);
        else next.add(id);
      });
      return next;
    });
  };

  if (!viewport) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="sync-self-test-page"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 260 }}
          className={`absolute inset-0 ${layerClassName} flex flex-col bg-[#FAF9F6]`}
        >
          <header className="shrink-0 border-b border-indigo-100 bg-white px-5 pb-3 pt-4">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onBack}
                aria-label="返回"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <ChevronLeft size={22} />
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-[17px] font-semibold text-slate-900">{pageTitle}</h1>
                <p className="truncate text-[11px] text-slate-400">
                  {version ? `${version} · ` : ''}{grade}{term} · {subject}
                  {hasKnowledge ? ' · 按章节勾选知识点组卷' : ' · 按目录勾选课文/课时组卷'}
                </p>
              </div>
              <button
                type="button"
                disabled={selectedCount === 0}
                onClick={openSetup('print')}
                className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3 text-[13px] font-semibold text-violet-700 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-50 disabled:text-slate-400"
              >
                <Printer size={15} />打印试卷
              </button>
            </div>
          </header>

          <div className="flex min-h-0 flex-1">
            {showSubjectRail ? (
              <aside className="flex w-[88px] shrink-0 flex-col gap-1 overflow-y-auto border-r border-indigo-100 bg-white px-2 py-3">
                {subjects!.map((item) => {
                  const active = item === subject;
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => onSubjectChange?.(item)}
                      className={`h-9 w-full shrink-0 rounded-xl px-1 text-[12px] font-semibold transition ${
                        active
                          ? 'bg-violet-600 text-white shadow-sm'
                          : 'bg-transparent text-slate-600 hover:bg-violet-50 hover:text-violet-700'
                      }`}
                    >
                      {item === '道德与法治' ? '道法' : item}
                    </button>
                  );
                })}
              </aside>
            ) : null}
            <div ref={treeScrollRef} className="min-h-0 min-w-0 flex-1 overflow-y-auto px-4 py-3">
              <div className="mx-auto max-w-5xl overflow-hidden rounded-2xl border border-indigo-100 bg-white px-2 py-1 shadow-[0_4px_16px_rgba(99,102,241,0.05)]">
                {tree.length === 0 && (
                  <p className="px-3 py-8 text-center text-[13px] text-slate-400">该教材暂无章节目录</p>
                )}
                {tree.map((node) => (
                  <TreeNodeRow
                    key={`${subject}-${node.id}`}
                    node={node}
                    depth={0}
                    expanded={expanded}
                    selectedLeaves={selectedLeaves}
                    leafById={leafById}
                    knowledgeChipsSelectable={knowledgeChipsSelectable}
                    onToggleExpand={(id) => setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))}
                    onToggleNode={toggleNode}
                  />
                ))}
              </div>
            </div>
          </div>

          <footer className="shrink-0 border-t border-indigo-100 bg-white px-4 py-3">
            <div className="mx-auto flex max-w-5xl items-center gap-3">
              <div className="min-w-0 flex-1">
                {selectedCount === 0 ? (
                  <p className="text-[13px] font-semibold text-slate-800">{selfTestEmptyHint(subject)}</p>
                ) : (
                  <>
                    <p className="text-[13px] font-semibold text-slate-800">
                      已选 {selectedCount} {leafNoun}
                      {chapterCount > 0 ? ` · ${chapterCount} 章` : ''}
                      {` · 推荐 ${recommendedCount} 题`}
                    </p>
                    <button
                      type="button"
                      onClick={() => setSelectedLeaves(new Set())}
                      className="text-[11px] text-slate-400 transition hover:text-slate-600"
                    >
                      清空选择
                    </button>
                  </>
                )}
              </div>
              <button type="button" disabled={selectedCount === 0} onClick={openSetup('online')} className="h-10 shrink-0 rounded-xl bg-violet-600 px-4 text-[13px] font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400">{startLabel}</button>
            </div>
          </footer>

          <PracticeSetupDialog
            open={isSetupOpen}
            selectedCount={selectedCount}
            chapterCount={chapterCount}
            leafNoun={leafNoun}
            subject={subject}
            selectedScopeLabels={selectedScopeLabels}
            paperTitleContext={{ version, grade, term }}
            recommendedCount={setupMode === 'print' ? Math.max(20, recommendedCount) : recommendedCount}
            initialQuestionCount={setupDraft?.questionCount}
            questionMax={setupMode === 'print' ? 20 : undefined}
            questionPresets={setupMode === 'print' ? [10, 15, 20] : undefined}
            mode={setupMode}
            startLabel={setupMode === 'print' ? '生成试卷' : startLabel}
            cancelLabel={setupMode === 'print' ? '暂不组卷' : '暂不练习'}
            title={setupMode === 'print' ? '试卷设置' : '开始自主练习，先选好题量、难度和场景'}
            guideText={undefined}
            assembling={isAssembling}
            dailyQuotaReached={setupMode === 'print' && printExceptionDemo === 'daily_limit'}
            initialDifficulty={setupDraft?.difficulty ?? setupDifficulty}
            initialScenario={setupDraft?.scenario ?? setupScenario}
            onDraftChange={setSetupDraft}
            onBackToScope={() => {
              if (assembleTimerRef.current) window.clearTimeout(assembleTimerRef.current);
              setIsAssembling(false);
              setIsSetupOpen(false);
            }}
            onClose={() => {
              if (assembleTimerRef.current) window.clearTimeout(assembleTimerRef.current);
              setIsAssembling(false);
              setIsSetupOpen(false);
            }}
            onConfirm={(setup) => confirmStart(setup, false, setupMode)}
          />
          {shortageOverlay && (
            <PracticeShortageDialog
              open
              variant={shortageOverlay.variant}
              scopeLabel="所选范围"
              difficulty={shortageOverlay.difficulty}
              scenarioLabel={shortageOverlay.scenarioLabel}
              availableCount={shortageOverlay.availableCount}
              requestedCount={shortageOverlay.requestedCount}
              canLower={Boolean(shiftDifficulty(shortageOverlay.difficulty, -1))}
              canRaise={Boolean(shiftDifficulty(shortageOverlay.difficulty, 1))}
              showRetryDone={shortageOverlay.variant === 'no_new'}
              cancelLabel={
                isHardBlockShortageKind(shortageOverlay.kind)
                  ? '知道了'
                  : isSetupOpen
                    ? '返回修改'
                    : '先不练了'
              }
              onLower={() => {
                if (isHardBlockShortageKind(shortageOverlay.kind)) return;
                const next = shiftDifficulty(shortageOverlay.difficulty, -1);
                if (!next) return;
                const availableCount = getDemoStock(shortageOverlay.kind, next);
                setSetupDifficulty(next);
                if (availableCount <= 0) {
                  setShortageOverlay({ ...shortageOverlay, difficulty: next, variant: 'no_new', availableCount: 0, beforeSetup: false });
                  setIsSetupOpen(true);
                  return;
                }
                setShortageOverlay(null);
                setIsSetupOpen(true);
              }}
              onRaise={() => {
                if (isHardBlockShortageKind(shortageOverlay.kind)) return;
                const next = shiftDifficulty(shortageOverlay.difficulty, 1);
                if (!next) return;
                const availableCount = getDemoStock(shortageOverlay.kind, next);
                setSetupDifficulty(next);
                if (availableCount <= 0) {
                  setShortageOverlay({ ...shortageOverlay, difficulty: next, variant: 'no_new', availableCount: 0, beforeSetup: false });
                  setIsSetupOpen(true);
                  return;
                }
                setShortageOverlay(null);
                setIsSetupOpen(true);
              }}
              onUseAvailable={shortageOverlay.variant === 'below_count' ? () => {
                confirmStart({
                  questionCount: Math.max(1, shortageOverlay.availableCount),
                  difficulty: shortageOverlay.difficulty,
                  difficultyLevel: difficultyLevelOf(shortageOverlay.difficulty),
                  scenario: shortageOverlay.scenario,
                  scenarioLabel: shortageOverlay.scenarioLabel,
                }, true, setupMode);
              } : undefined}
              onRetryDone={() => {
                confirmStart({
                  questionCount: shortageOverlay.requestedCount || recommendedCount || 5,
                  difficulty: shortageOverlay.difficulty,
                  difficultyLevel: difficultyLevelOf(shortageOverlay.difficulty),
                  scenario: shortageOverlay.scenario,
                  scenarioLabel: shortageOverlay.scenarioLabel,
                }, true, setupMode);
              }}
              onCancel={() => {
                setShortageOverlay(null);
                if (isHardBlockShortageKind(shortageOverlay.kind) || shortageOverlay.beforeSetup) {
                  setIsSetupOpen(false);
                }
              }}
            />
          )}
          <PaperPrintFlow
            job={printJob}
            onClose={() => setPrintJob(null)}
            onModify={() => {
              setPrintJob(null);
              setIsSetupOpen(true);
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>,
    viewport,
  );
};
