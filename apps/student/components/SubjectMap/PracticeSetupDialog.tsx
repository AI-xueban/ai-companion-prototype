import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BookOpen, ChevronLeft, Minus, Plus, X } from 'lucide-react';
import {
  DEFAULT_PRACTICE_SCENARIO,
  PRACTICE_DIFFICULTIES,
  PRACTICE_QUESTION_MAX,
  PRACTICE_QUESTION_MIN,
  PRACTICE_QUESTION_PRESETS,
  PRACTICE_SCENARIOS,
  type PracticeDifficulty,
  type PracticeScenarioCode,
} from '../../data/juniorSyncAssessment';
import { getPrintQuestionTypeAvailability } from '../../data/jyeooPrintQuestionTypeMock';
import { PRINT_DAILY_PAPER_REMAINING } from '../../data/practiceShortageDemo';

export interface PracticeSetupResult {
  questionCount: number;
  difficulty: PracticeDifficulty;
  difficultyLevel: 1 | 2 | 3 | 4 | 5;
  scenario: PracticeScenarioCode;
  scenarioLabel: string;
  questionTypeCounts?: QuestionTypeCount[];
  paperTitle?: string;
  paperKind?: string;
  includeAnswerAnalysis?: boolean;
}

export interface QuestionTypeCount { name: string; count: number; availableCount?: number; }
const EMPTY_SCOPE_LABELS: string[] = [];
const PAPER_TITLE_MAX_LENGTH = 30;
const PAPER_TITLE_PREFERRED_LENGTH = 24;

export interface PaperTitleContext {
  version?: string;
  grade?: string;
  term?: string;
}

const cleanTitlePart = (value?: string) => value?.trim().replace(/\s+/g, ' ') ?? '';
const limitTitle = (value: string, max = PAPER_TITLE_MAX_LENGTH) =>
  value.length <= max ? value : `${value.slice(0, Math.max(0, max - 1)).trimEnd()}…`;

/**
 * 默认命名优先保留教材、年级、学科和卷型；范围过长时收敛为已选知识点数量。
 * 用户手动修改后不再以此方法覆盖其输入。
 */
export const generatePaperTitle = ({
  subject,
  scopeLabels = EMPTY_SCOPE_LABELS,
  paperKind = '单元测试卷',
  context,
}: {
  subject?: string;
  scopeLabels?: string[];
  paperKind?: string;
  context?: PaperTitleContext;
}) => {
  const scope = scopeLabels.map(cleanTitlePart).filter(Boolean);
  const kind = paperKind === '不限类型' ? '自定义练习卷' : cleanTitlePart(paperKind) || '自定义练习卷';
  const prefix = [
    cleanTitlePart(context?.version),
    `${cleanTitlePart(context?.grade)}${cleanTitlePart(context?.term)}`,
    cleanTitlePart(subject),
  ].filter(Boolean);
  const detailedScope = scope.length === 0 ? '自定义范围' : scope.length === 1 ? scope[0] : `${scope[0]}等${scope.length}个知识点`;
  const detailedTitle = [...prefix, detailedScope, kind].join('·');
  if (detailedTitle.length <= PAPER_TITLE_PREFERRED_LENGTH) return detailedTitle;

  const compactScope = `已选${scope.length || 1}个知识点`;
  const compactTitle = [...prefix, compactScope, kind].join('·');
  if (compactTitle.length <= PAPER_TITLE_MAX_LENGTH) return compactTitle;

  // 超过硬上限时保留卷型，范围简写，其他信息从右侧截断。
  const body = [...prefix, compactScope].join('·');
  return `${limitTitle(body, Math.max(1, PAPER_TITLE_MAX_LENGTH - kind.length - 1))}·${kind}`;
};

export const getDefaultPrintQuestionTypes = (subject?: string, selectedScopeLabels: string[] = []): QuestionTypeCount[] =>
  getPrintQuestionTypeAvailability(subject, selectedScopeLabels).map((item) => ({
    ...item,
    count: Math.min(3, item.availableCount),
  }));

interface PracticeSetupDialogProps {
  open: boolean;
  selectedCount: number;
  chapterCount: number;
  leafNoun: string;
  subject?: string;
  /** 已勾选章节/知识点名称，用于筛选本次可用题型。 */
  selectedScopeLabels?: string[];
  /** 教材、年级与学期用于生成可读的默认试卷名称。 */
  paperTitleContext?: PaperTitleContext;
  recommendedCount: number;
  /** Restore a returned group-paper draft instead of resetting the count. */
  initialQuestionCount?: number;
  /** 单元测试等短练习可传入更严格的上限。 */
  questionMax?: number;
  startLabel: string;
  /** 与 startLabel 对仗的次要按钮，如「暂不练习」「暂不测试」 */
  cancelLabel?: string;
  /** 弹窗主标题，按入口区分（自主练习 / 单元测试） */
  title?: string;
  /** 引导学生完成题量、难度、场景选择 */
  guideText?: string;
  /** 打印试卷可选择纸质题型，并使用更大的题量范围。 */
  mode?: 'online' | 'print';
  questionPresets?: number[];
  assembling?: boolean;
  /** 打印助手当日组卷次数已满时，在设置页直接拦截。 */
  dailyQuotaReached?: boolean;
  initialDifficulty?: PracticeDifficulty;
  initialScenario?: PracticeScenarioCode;
  /** Persists edits while the user returns to modify the selected scope. */
  onDraftChange?: (draft: Pick<PracticeSetupResult, 'questionCount' | 'difficulty' | 'scenario' | 'questionTypeCounts'>) => void;
  /** Returns to the selection page without submitting a paper request. */
  onBackToScope?: () => void;
  onClose: () => void;
  onConfirm: (result: PracticeSetupResult) => void;
}

export const PracticeSetupDialog: React.FC<PracticeSetupDialogProps> = ({
  open,
  selectedCount,
  chapterCount,
  leafNoun,
  subject,
  selectedScopeLabels = EMPTY_SCOPE_LABELS,
  paperTitleContext,
  recommendedCount,
  initialQuestionCount,
  questionMax = PRACTICE_QUESTION_MAX,
  startLabel,
  cancelLabel = '暂不开始',
  title = '请先选择题量、难度和场景',
  guideText,
  mode = 'online',
  questionPresets = PRACTICE_QUESTION_PRESETS,
  assembling = false,
  dailyQuotaReached = false,
  initialDifficulty = '中等',
  initialScenario = DEFAULT_PRACTICE_SCENARIO,
  onDraftChange,
  onBackToScope,
  onClose,
  onConfirm,
}) => {
  const clampCount = (value: number) =>
    Math.min(questionMax, Math.max(PRACTICE_QUESTION_MIN, value));
  const [questionCount, setQuestionCount] = useState(() => clampCount(initialQuestionCount ?? recommendedCount));
  const [difficulty, setDifficulty] = useState<PracticeDifficulty>('中等');
  const [scenario, setScenario] = useState<PracticeScenarioCode>(DEFAULT_PRACTICE_SCENARIO);
  const [questionTypeCounts, setQuestionTypeCounts] = useState<QuestionTypeCount[]>(() => getDefaultPrintQuestionTypes(subject, selectedScopeLabels));
  const [paperTitle, setPaperTitle] = useState(() => generatePaperTitle({ subject, scopeLabels: selectedScopeLabels, context: paperTitleContext }));
  const [isPaperTitleEdited, setIsPaperTitleEdited] = useState(false);
  const [paperKind, setPaperKind] = useState('单元测试卷');
  const [includeAnswerAnalysis, setIncludeAnswerAnalysis] = useState(false);
  const isPrintMode = mode === 'print';
  const dailyQuotaRemaining = dailyQuotaReached ? 0 : PRINT_DAILY_PAPER_REMAINING;
  const printQuestionLimit = Math.min(questionMax, 20);
  const selectedScopeKey = selectedScopeLabels.slice().sort().join('|');

  useEffect(() => {
    if (!open) return;
    setDifficulty(initialDifficulty);
    setScenario(initialScenario);
    setQuestionCount(clampCount(initialQuestionCount ?? recommendedCount));
    setQuestionTypeCounts(getDefaultPrintQuestionTypes(subject, selectedScopeLabels));
    setPaperTitle(generatePaperTitle({ subject, scopeLabels: selectedScopeLabels, context: paperTitleContext }));
    setIsPaperTitleEdited(false);
    setPaperKind('单元测试卷');
    setIncludeAnswerAnalysis(false);
  }, [open, initialQuestionCount, recommendedCount, initialDifficulty, initialScenario, questionMax, mode, subject, selectedScopeKey, paperTitleContext?.version, paperTitleContext?.grade, paperTitleContext?.term]);

  useEffect(() => {
    if (!open) return;
    onDraftChange?.({ questionCount: isPrintMode ? printQuestionCount : questionCount, difficulty, scenario, questionTypeCounts: isPrintMode ? questionTypeCounts : undefined });
  }, [open, questionCount, difficulty, scenario, questionTypeCounts, isPrintMode, onDraftChange]);

  const printQuestionCount = questionTypeCounts.reduce((total, item) => total + item.count, 0);

  const questionPresetsAsc = useMemo(() => {
    const set = new Set<number>([...questionPresets, recommendedCount]);
    return [...set]
      .filter((n) => n >= PRACTICE_QUESTION_MIN && n <= questionMax)
      .sort((a, b) => a - b);
  }, [recommendedCount, questionMax, questionPresets]);

  const confirm = () => {
    const item = PRACTICE_DIFFICULTIES.find((d) => d.label === difficulty) ?? PRACTICE_DIFFICULTIES[2];
    const scene = PRACTICE_SCENARIOS.find((d) => d.code === scenario) ?? PRACTICE_SCENARIOS[0];
    onConfirm({
      questionCount: isPrintMode ? Math.min(printQuestionCount, printQuestionLimit) : clampCount(questionCount),
      difficulty: item.label,
      difficultyLevel: item.level,
      scenario: scene.code,
      scenarioLabel: scene.label,
      questionTypeCounts: isPrintMode ? questionTypeCounts.filter((item) => item.count > 0) : undefined,
      paperTitle: isPrintMode ? paperTitle.trim() : undefined,
      paperKind: isPrintMode ? paperKind : undefined,
      includeAnswerAnalysis: isPrintMode ? includeAnswerAnalysis : undefined,
    });
  };

  return (
    <AnimatePresence>
      {open && (
        <div className={`absolute inset-0 z-20 flex ${isPrintMode ? 'bg-slate-50' : 'items-center justify-center px-4'}`}>
          {!isPrintMode ? (
            <motion.button
              type="button"
              aria-label="关闭设置"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={assembling ? undefined : onClose}
              className="absolute inset-0 bg-slate-950/35 backdrop-blur-[2px]"
            />
          ) : null}
          <motion.div
            role="dialog"
            aria-modal={isPrintMode ? undefined : 'true'}
            aria-labelledby="practice-setup-title"
            initial={isPrintMode ? { opacity: 0, x: 16 } : { opacity: 0, y: 16, scale: 0.96 }}
            animate={isPrintMode ? { opacity: 1, x: 0 } : { opacity: 1, y: 0, scale: 1 }}
            exit={isPrintMode ? { opacity: 0, x: 16 } : { opacity: 0, y: 12, scale: 0.96 }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className={isPrintMode
              ? 'relative z-10 flex h-full w-full flex-col overflow-hidden bg-slate-50'
              : 'relative z-10 flex max-h-[calc(100%-2rem)] w-full max-w-[420px] flex-col overflow-hidden rounded-3xl border border-white/80 bg-white shadow-[0_24px_64px_rgba(15,23,42,0.18)]'}
          >
            <div className={isPrintMode ? 'flex h-14 items-center border-b border-slate-200 bg-white px-6' : 'flex items-start justify-between px-5 pb-1.5 pt-3'}>
              {onBackToScope ? (
                <button type="button" onClick={onBackToScope} disabled={assembling} aria-label="修改组卷范围" className="mr-2 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40">
                  <ChevronLeft size={20} />
                </button>
              ) : null}
              {isPrintMode ? <h1 className="text-[20px] font-semibold tracking-tight text-slate-900">组卷设置</h1> : null}
              {isPrintMode ? (
                <button
                  type="button"
                  onClick={confirm}
                  disabled={assembling || dailyQuotaReached}
                  className="ml-auto h-9 rounded-xl bg-violet-600 px-5 text-[13px] font-semibold text-white transition hover:bg-violet-700 disabled:cursor-wait disabled:opacity-80"
                >
                  {assembling ? '正在组卷…' : dailyQuotaReached ? '今日已达上限' : '生成组卷'}
                </button>
              ) : null}
              {!isPrintMode ? (
                <div className="min-w-0">
                  <h2 id="practice-setup-title" className="text-[16px] font-semibold text-slate-900">
                    {title}
                  </h2>
                  <>
                    {guideText && !isPrintMode ? (
                      <p className="mt-1 text-[12px] leading-5 text-slate-500">{guideText}</p>
                    ) : null}
                    <p className={`text-[12px] text-slate-400 ${guideText ? 'mt-0.5' : 'mt-1'}`}>
                      已选 {chapterCount} 章 · {selectedCount} {leafNoun}
                    </p>
                  </>
                </div>
              ) : null}
              {!isPrintMode ? (
                <button
                  type="button"
                  onClick={onClose}
                  disabled={assembling}
                  aria-label="关闭"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <X size={16} />
                </button>
              ) : null}
            </div>

            {isPrintMode ? (
              <div className="border-b border-slate-100 bg-white px-6 pb-4">
                <div className="mx-auto flex w-full max-w-[900px] items-center justify-between rounded-xl border border-slate-100 bg-white px-3 py-2 text-slate-600">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-50 text-violet-500"><BookOpen size={14} /></span>
                    <p className="text-[13px] font-medium">已选 {chapterCount} 章 · {selectedCount} {leafNoun}</p>
                    <span className="h-3 w-px bg-slate-200" aria-hidden="true" />
                    <p className="text-[11px] text-slate-400">今日还可组卷 {dailyQuotaRemaining} 次</p>
                  </div>
                  {onBackToScope ? <button type="button" disabled={assembling} onClick={onBackToScope} className="text-[11px] font-medium text-violet-600 hover:text-violet-700 disabled:opacity-40">修改范围</button> : null}
                </div>
              </div>
            ) : null}

            <div className={isPrintMode ? 'mx-auto flex min-h-0 w-full max-w-[900px] flex-1 flex-col gap-3 overflow-hidden px-6 py-4' : 'flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-4 pb-1'}>
              {!isPrintMode ? (
              <section>
                <div className="mb-1.5 flex items-center justify-between">
                  <p className="text-[12px] font-semibold text-slate-700">题量</p>
                  <p className="text-[11px] text-slate-400">最多 {questionMax} 题</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    aria-label="减少题量"
                    disabled={assembling || questionCount <= PRACTICE_QUESTION_MIN}
                    onClick={() => setQuestionCount((n) => clampCount(n - 1))}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <Minus size={14} />
                  </button>
                  <div className="grid min-w-0 flex-1 grid-cols-5 gap-1">
                    {questionPresetsAsc.map((preset) => {
                      const active = questionCount === preset;
                      const recommended = preset === recommendedCount;
                      return (
                        <button
                          key={preset}
                          type="button"
                          disabled={assembling}
                          onClick={() => setQuestionCount(preset)}
                          className={`relative h-8 min-w-0 rounded-xl border text-[11px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                            active
                              ? 'border-violet-300 bg-violet-50 text-violet-700'
                              : 'border-slate-200 bg-white text-slate-600 hover:border-violet-200 hover:bg-violet-50/50'
                          }`}
                        >
                          {preset}题
                          {recommended ? <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 rounded-full bg-violet-100 px-1 text-[8px] leading-3 text-violet-600">荐</span> : null}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    aria-label="增加题量"
                    disabled={assembling || questionCount >= questionMax}
                    onClick={() => setQuestionCount((n) => clampCount(n + 1))}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </section>
              ) : null}

              {!isPrintMode ? <section>
                <div className="flex items-center gap-2">
                  <p className="shrink-0 text-[12px] font-semibold text-slate-700">难度</p>
                  <div className="grid flex-1 grid-cols-5 gap-1.5">
                  {PRACTICE_DIFFICULTIES.map((item) => {
                    const active = difficulty === item.label;
                    return (
                      <button
                        key={item.label}
                        type="button"
                        disabled={assembling}
                        onClick={() => setDifficulty(item.label)}
                        className={`rounded-xl border px-1 py-1.5 text-[12px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                          active
                            ? 'border-violet-300 bg-violet-50 text-violet-700'
                            : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                  </div>
                </div>
              </section> : null}

              {isPrintMode ? (
                <>
                  <section className="max-w-[720px] space-y-3">
                    <div className="space-y-2.5">
                      <div className="flex items-start gap-3"><label className="flex min-w-0 flex-1 items-center gap-3" htmlFor="paper-title"><span className="w-14 shrink-0 text-[13px] font-semibold text-slate-700">试卷名称</span><input id="paper-title" value={paperTitle} maxLength={PAPER_TITLE_MAX_LENGTH} disabled={assembling} onChange={(event) => { setPaperTitle(event.target.value); setIsPaperTitleEdited(true); }} className="h-9 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-[13px] font-medium text-slate-800 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100" /></label><span className="mt-2 shrink-0 text-[10px] text-slate-400">{paperTitle.length}/{PAPER_TITLE_MAX_LENGTH}</span></div>
                      <div className="flex items-center gap-3"><p className="w-14 shrink-0 text-[13px] font-semibold text-slate-700">难度</p><div className="flex flex-wrap gap-1.5">{PRACTICE_DIFFICULTIES.map((item) => { const active = difficulty === item.label; return <button key={item.label} type="button" disabled={assembling} onClick={() => setDifficulty(item.label)} className={`h-8 w-16 rounded-lg border text-[11px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${active ? 'border-violet-300 bg-violet-50 text-violet-700' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'}`}>{item.label}</button>; })}</div></div>
                    </div>
                  </section>
                  <section className="max-w-[640px] space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-[14px] font-semibold text-slate-800">题型与题量</h3>
                      <p className="text-[12px] font-medium text-slate-500">共 <span className="text-violet-600">{printQuestionCount}</span> / {printQuestionLimit} 题</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {questionTypeCounts.map((item, index) => (
                        <div key={item.name} className="flex h-9 items-center rounded-lg border border-slate-100 bg-white px-2.5">
                          <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-slate-700">{item.name}<span className="ml-1 text-[10px] font-normal text-slate-400">可用 {item.availableCount ?? '—'} 题</span></span>
                          <button type="button" aria-label={`减少${item.name}数量`} disabled={assembling || item.count === 0} onClick={() => setQuestionTypeCounts((current) => current.map((type, position) => position === index ? { ...type, count: Math.max(0, type.count - 1) } : type))} className="flex h-6 w-6 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-35"><Minus size={12} /></button>
                          <span className="w-6 text-center text-[12px] font-semibold text-slate-800">{item.count}</span>
                          <button type="button" aria-label={`增加${item.name}数量`} disabled={assembling || printQuestionCount >= printQuestionLimit || (item.availableCount != null && item.count >= item.availableCount)} onClick={() => setQuestionTypeCounts((current) => current.map((type, position) => position === index ? { ...type, count: type.count + 1 } : type))} className="flex h-6 w-6 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-35"><Plus size={12} /></button>
                        </div>
                      ))}
                    </div>
                  </section>
                  <div className="max-w-[900px] space-y-4">
                    <section className="flex items-center gap-5">
                      <h3 className="w-14 shrink-0 text-[14px] font-semibold text-slate-800">试卷类型</h3>
                      <div className="flex gap-2">{['单元测试卷', '期中测评卷', '真题卷', '不限类型'].map((item) => <button key={item} type="button" disabled={assembling} onClick={() => { setPaperKind(item); if (!isPaperTitleEdited) setPaperTitle(generatePaperTitle({ subject, scopeLabels: selectedScopeLabels, paperKind: item, context: paperTitleContext })); }} className={`h-9 w-[100px] rounded-lg border px-1 text-[11px] font-semibold ${paperKind === item ? 'border-violet-300 bg-violet-50 text-violet-700' : 'border-slate-200 bg-white text-slate-500 hover:border-violet-200'}`}>{item}</button>)}</div>
                    </section>
                    <section className="flex items-center gap-5">
                      <h3 className="w-14 shrink-0 text-[14px] font-semibold text-slate-800">打印内容</h3>
                      <div className="flex gap-2"><button type="button" onClick={() => setIncludeAnswerAnalysis(true)} className={`h-9 w-[128px] rounded-lg border text-[11px] font-semibold ${includeAnswerAnalysis ? 'border-violet-300 bg-violet-50 text-violet-700' : 'border-slate-200 bg-white text-slate-500'}`}>试卷＋答案解析</button><button type="button" onClick={() => setIncludeAnswerAnalysis(false)} className={`h-9 w-[96px] rounded-lg border text-[11px] font-semibold ${!includeAnswerAnalysis ? 'border-violet-300 bg-violet-50 text-violet-700' : 'border-slate-200 bg-white text-slate-500'}`}>仅试卷</button></div>
                    </section>
                  </div>
                </>
              ) : null}
              {!isPrintMode ? (
              <section>
                <p className="mb-1.5 text-[12px] font-semibold text-slate-700">场景</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {PRACTICE_SCENARIOS.map((item) => {
                    const active = scenario === item.code;
                    return (
                      <button
                        key={item.code}
                        type="button"
                        disabled={assembling}
                        onClick={() => setScenario(item.code)}
                        className={`rounded-xl border px-1 py-1.5 text-[12px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                          active
                            ? 'border-violet-300 bg-violet-50 text-violet-700'
                            : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </section>
              ) : null}

            </div>

            {!isPrintMode ? <div className="flex items-center gap-2 px-5 pb-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={assembling}
                className="h-9 flex-1 rounded-2xl bg-slate-100 text-[13px] font-semibold text-slate-600 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={confirm}
                disabled={assembling}
                className="h-9 flex-[1.4] rounded-2xl bg-violet-600 text-[13px] font-semibold text-white transition hover:bg-violet-700 disabled:cursor-wait disabled:opacity-80"
              >
                {assembling ? '正在出题…' : startLabel}
              </button>
            </div> : null}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
