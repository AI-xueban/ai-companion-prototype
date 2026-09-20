import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Plus, HelpCircle, AlertCircle, RefreshCw, CirclePlay, Check, X } from 'lucide-react';
import scanDemoImg from '@/assets/lingjing-scan-demo.png';
import knowledgeLoadingImg from '@/assets/lingjing-knowledge-loading.png';
import { ZhiyueGradeMark, ZhiyueQuestionGrade } from './ZhiyueHomework/types';

type KnowledgePoint = {
  name: string;
  hasVideo: boolean;
};

const KNOWLEDGE_POINTS: KnowledgePoint[] = [
  { name: '一元一次方程组', hasVideo: true },
  { name: '一元二次方程组定义与性质', hasVideo: true },
  { name: '分数不等式', hasVideo: false },
];

const QUESTION_TEXT =
  '7. 如图，已知圆 O 的半径为 2，点 P 是圆 O 外一点，且 OP=4，点 Q 是圆 O 上的动点，点 M 是线段 PQ 的中点，则线段 OM 长度的最小值是（ ）';

const OPTIONS = ['A. 1', 'B. 2', 'C. 3', 'D. 4'];

const ANALYSIS_TEXT =
  '本题考查圆的性质与动点问题。连接 OQ，利用勾股定理表示 OM 的长度，结合 OP、OQ 的长度关系，通过几何意义或三角函数求最小值。';

const KEY_POINT_TEXT =
  '动点问题中，先建立几何关系，再借助中位线、勾股定理或三角函数将目标线段转化为可求最值的表达式。';

const DisabledAnswerBlock = () => (
  <div className="rounded-xl bg-slate-100 border border-slate-200/80 px-4 py-6 text-center">
    <p className="text-sm text-slate-400 font-medium">老师已关闭查看答案解析</p>
  </div>
);

const LingjingToast = ({ message, visible }: { message: string; visible: boolean }) => (
  <AnimatePresence>
    {visible && (
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.96 }}
        transition={{ duration: 0.2 }}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[300] pointer-events-none"
      >
        <div className="px-4 py-2.5 rounded-xl bg-slate-800/90 text-white text-sm font-medium shadow-lg backdrop-blur-sm">
          {message}
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

const KnowledgePointsLoading = () => (
  <div className="flex flex-col items-center justify-center py-10 px-4">
    <div className="relative w-[120px] h-[92px] mx-auto mb-5 overflow-hidden shrink-0">
      <img
        src={knowledgeLoadingImg}
        alt=""
        aria-hidden
        draggable={false}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[38%] w-[280px] max-w-none pointer-events-none select-none"
      />
    </div>
    <p className="text-sm text-slate-400 font-medium text-center leading-relaxed">
      小略正在努力匹配知识点视频中，请稍等哦！
    </p>
  </div>
);

const KnowledgePointsError = ({ onRefresh }: { onRefresh: () => void }) => (
  <div className="flex flex-col items-center justify-center py-10 px-4">
    <AlertCircle size={52} className="text-slate-300 mb-5" strokeWidth={1.5} aria-hidden />
    <button
      type="button"
      onClick={onRefresh}
      className="text-sm text-slate-400 font-medium text-center leading-relaxed mb-5 hover:text-blue-600 transition-colors"
    >
      加载出错啦~点击此处刷新看看吧！
    </button>
    <button
      type="button"
      onClick={onRefresh}
      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-50 border border-blue-200 text-blue-600 text-sm font-bold hover:bg-blue-100 active:scale-95 transition-colors"
    >
      <RefreshCw size={15} />
      刷新
    </button>
  </div>
);

const KnowledgePointTag = ({
  name,
  hasVideo,
  active,
  onClick,
}: {
  name: string;
  hasVideo: boolean;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full border text-xs font-bold active:scale-95 transition-colors ${
      active
        ? 'bg-blue-100 border-blue-300 text-blue-800'
        : 'bg-blue-50 border-blue-100 text-blue-700 hover:bg-blue-100'
    }`}
  >
    {hasVideo && <CirclePlay size={14} className="text-blue-500 shrink-0" />}
    {name}
  </button>
);

const KnowledgePointVideoPlayer = ({ name }: { name: string }) => (
  <div className="mt-3 rounded-xl border border-slate-100 bg-white overflow-hidden">
    <p className="text-sm font-black text-slate-800 px-4 pt-4 pb-3">{name}</p>
    <div className="relative mx-4 mb-4 aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-slate-700 via-slate-800 to-blue-900">
      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-14 h-14 rounded-full bg-white/95 shadow-xl flex items-center justify-center">
          <CirclePlay size={28} className="text-blue-600 ml-0.5" />
        </div>
      </div>
    </div>
  </div>
);

const HomeworkNoMatchModal = ({
  visible,
  onRetake,
  onBack,
}: {
  visible: boolean;
  onRetake: () => void;
  onBack: () => void;
}) => (
  <AnimatePresence>
    {visible && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 z-[220] flex items-center justify-center bg-slate-900/45 backdrop-blur-[2px] p-6"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          className="w-full max-w-[320px] rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="homework-no-match-title"
        >
          <div className="px-6 pt-7 pb-5 text-center">
            <p id="homework-no-match-title" className="text-base font-bold text-slate-800 leading-relaxed">
              该题暂无法批改，请重新拍一道题吧
            </p>
          </div>
          <div className="grid grid-cols-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-3.5 text-sm font-bold text-slate-500 hover:bg-slate-50 transition-colors border-r border-slate-100"
            >
              返回
            </button>
            <button
              type="button"
              onClick={onRetake}
              className="px-4 py-3.5 text-sm font-bold text-blue-600 hover:bg-blue-50 transition-colors"
            >
              重拍
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

type KnowledgeLoadState = 'idle' | 'loading' | 'error' | 'ready';
type QuestionId = 'q7' | 'q8';
type QuestionGradeState = ZhiyueQuestionGrade;
type GradeMark = ZhiyueGradeMark;

const KNOWLEDGE_LOAD_DELAY_MS = 1800;

const defaultQuestionGrade = (id: QuestionId, at: number): QuestionGradeState => ({
  systemGrade: id === 'q7' ? 'incorrect' : 'correct',
  systemAt: at,
  userGrade: null,
  userAt: null,
  step: 'idle',
});

const formatGradeTime = (ts: number) => {
  const date = new Date(ts);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

const GradeMarkIcon = ({ mark, size = 'md' }: { mark: GradeMark; size?: 'sm' | 'md' }) => {
  const isCorrect = mark === 'correct';
  const box = size === 'sm' ? 'w-6 h-6' : 'w-8 h-8';
  const icon = size === 'sm' ? 14 : 18;
  return (
    <span
      className={`inline-flex items-center justify-center ${box} rounded-full ${
        isCorrect ? 'bg-green-100' : 'bg-red-100'
      }`}
    >
      {isCorrect ? (
        <Check size={icon} className="text-green-600" strokeWidth={3} />
      ) : (
        <X size={icon} className="text-red-500" strokeWidth={3} />
      )}
    </span>
  );
};

const displayedGrade = (state: QuestionGradeState): GradeMark => state.userGrade ?? state.systemGrade;

export const LingjingTutorPage = ({
  onRetake,
  onExit,
  headerBackLabel = '重拍',
  onHeaderBack,
  pageCount = 1,
  fromHistory = false,
  initialGrades = {},
  onGradesChange,
}: {
  onRetake: () => void;
  onExit: () => void;
  headerBackLabel?: string;
  onHeaderBack?: () => void;
  pageCount?: number;
  fromHistory?: boolean;
  initialGrades?: Record<string, QuestionGradeState>;
  onGradesChange?: (grades: Record<string, QuestionGradeState>) => void;
}) => {
  // 合并版不保留原型标注控制台；“无匹配知识点”演示态默认关闭。
  const showHomeworkNoMatch = false;
  const clearHomeworkNoMatch = () => {};
  const [selectedId, setSelectedId] = useState<QuestionId>('q7');
  const [pageIndex, setPageIndex] = useState(0);
  const loadedAtRef = useRef(Date.now());
  const openedDoneKeysRef = useRef(
    new Set(Object.entries(initialGrades).filter(([, grade]) => grade.step === 'done').map(([key]) => key))
  );
  const [questionGrades, setQuestionGrades] = useState<Record<string, QuestionGradeState>>(initialGrades);
  const [knowledgeLoadState, setKnowledgeLoadState] = useState<KnowledgeLoadState>('idle');
  const [activeKnowledgePoint, setActiveKnowledgePoint] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const knowledgeSectionRef = useRef<HTMLElement>(null);
  const knowledgeLoadTriggeredRef = useRef(false);
  const knowledgeLoadTimerRef = useRef<number | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const questionKey = (id: QuestionId, page = pageIndex) => `${page}:${id}`;
  const getQuestionGrade = (id: QuestionId, page = pageIndex) =>
    questionGrades[questionKey(id, page)] ?? defaultQuestionGrade(id, loadedAtRef.current);
  const currentGrade = getQuestionGrade(selectedId);
  const showHistoryCompare =
    fromHistory && currentGrade.step === 'done' && openedDoneKeysRef.current.has(questionKey(selectedId));

  const patchQuestionGrade = (id: QuestionId, partial: Partial<QuestionGradeState>) => {
    const key = questionKey(id);
    const next = {
      ...questionGrades,
      [key]: { ...(questionGrades[key] ?? defaultQuestionGrade(id, loadedAtRef.current)), ...partial },
    };
    setQuestionGrades(next);
    onGradesChange?.(next);
  };

  const handlePickGrade = (mark: GradeMark) => {
    patchQuestionGrade(selectedId, {
      userGrade: mark,
      userAt: Date.now(),
      step: 'done',
    });
  };

  const handleHeaderBack = () => {
    clearHomeworkNoMatch();
    (onHeaderBack ?? onRetake)();
  };

  const clearKnowledgeLoadTimer = () => {
    if (knowledgeLoadTimerRef.current != null) {
      window.clearTimeout(knowledgeLoadTimerRef.current);
      knowledgeLoadTimerRef.current = null;
    }
  };

  const startKnowledgeLoad = (shouldSucceed: boolean) => {
    clearKnowledgeLoadTimer();
    setKnowledgeLoadState('loading');
    knowledgeLoadTimerRef.current = window.setTimeout(() => {
      setKnowledgeLoadState(shouldSucceed ? 'ready' : 'error');
      knowledgeLoadTimerRef.current = null;
    }, KNOWLEDGE_LOAD_DELAY_MS);
  };

  const handleKnowledgeRefresh = () => {
    setActiveKnowledgePoint(null);
    startKnowledgeLoad(true);
  };

  const activePoint = KNOWLEDGE_POINTS.find(point => point.name === activeKnowledgePoint);

  const showToast = (message: string) => {
    if (toastTimerRef.current != null) {
      window.clearTimeout(toastTimerRef.current);
    }
    setToastMessage(message);
    toastTimerRef.current = window.setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = null;
    }, 2200);
  };

  const handleKnowledgePointClick = (point: KnowledgePoint) => {
    if (!point.hasVideo) {
      showToast('暂无知识点视频');
      return;
    }
    setActiveKnowledgePoint(point.name);
  };

  useEffect(() => {
    const section = knowledgeSectionRef.current;
    const root = scrollRef.current;
    if (!section || !root) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || knowledgeLoadTriggeredRef.current) return;
        knowledgeLoadTriggeredRef.current = true;
        startKnowledgeLoad(false);
      },
      { root, threshold: 0.35, rootMargin: '0px 0px -8% 0px' }
    );

    observer.observe(section);
    return () => {
      observer.disconnect();
      clearKnowledgeLoadTimer();
      if (toastTimerRef.current != null) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="relative w-full h-full flex flex-col bg-[#f3f4f6] text-slate-800">
      <div className="flex flex-1 min-h-0">
        {/* 左侧：扫描原图 */}
        <div className="w-[44%] shrink-0 flex flex-col bg-[#eceff3] border-r border-slate-200/80 min-h-0">
          <div className="shrink-0 flex items-center gap-2 px-4 py-3">
            <button
              type="button"
              onClick={handleHeaderBack}
              className="flex items-center gap-1 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ChevronLeft size={20} />
              <span className="text-sm font-bold">{headerBackLabel}</span>
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-auto px-3 pb-3">
            <div className="relative mx-auto max-w-[360px]">
              <img
                src={scanDemoImg}
                alt={`作业扫描图 第${pageIndex + 1}页`}
                className={`w-full rounded-lg shadow-md border border-slate-200/60 bg-white ${
                  pageIndex === 1 ? 'saturate-[.75] contrast-110' : pageIndex === 2 ? 'hue-rotate-15' : ''
                }`}
              />
              {pageCount > 1 && (
                <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/60 text-white text-[10px] font-bold">
                  第{pageIndex + 1}页
                </span>
              )}

              {/* 未作答缩略高亮 */}
              <div className="absolute top-[4%] left-[6%] w-[28%] aspect-[4/3] border-2 border-white/90 rounded shadow-sm pointer-events-none" />
              <span className="absolute top-[3%] left-[6%] text-[9px] font-bold text-white bg-slate-700/75 px-1.5 py-0.5 rounded pointer-events-none">
                未作答
              </span>

              {/* 第7题选中框 */}
              <button
                type="button"
                onClick={() => setSelectedId('q7')}
                className={`absolute left-[5%] right-[8%] top-[22%] h-[26%] rounded border-2 transition-colors ${
                  selectedId === 'q7' ? 'border-blue-500 bg-blue-500/10' : 'border-transparent'
                }`}
                aria-label="第7题"
              >
                <span className="absolute top-1.5 right-2 pointer-events-none">
                  <GradeMarkIcon mark={displayedGrade(getQuestionGrade('q7'))} size="sm" />
                </span>
              </button>

              {/* 第8题框 */}
              <button
                type="button"
                onClick={() => setSelectedId('q8')}
                className={`absolute left-[5%] right-[8%] top-[50%] h-[22%] rounded border-2 transition-colors ${
                  selectedId === 'q8' ? 'border-blue-500 bg-blue-500/10' : 'border-white/80'
                }`}
                aria-label="第8题"
              >
                <span className="absolute top-1.5 right-2 pointer-events-none">
                  <GradeMarkIcon mark={displayedGrade(getQuestionGrade('q8'))} size="sm" />
                </span>
              </button>
            </div>
          </div>
          {pageCount > 1 && (
            <div className="shrink-0 flex items-center justify-center gap-3 py-3">
              {Array.from({ length: pageCount }, (_, index) => (
                <button
                  key={index}
                  type="button"
                  aria-label={`第${index + 1}页`}
                  onClick={() => {
                    setPageIndex(index);
                    setSelectedId('q7');
                  }}
                  className={`w-8 h-8 rounded-full text-sm font-bold transition-colors ${
                    pageIndex === index
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'bg-white text-slate-500 border border-slate-200 hover:border-blue-300'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 右侧：批改结果 */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-white">
          <div className="shrink-0 flex items-center justify-between gap-3 px-5 py-3 border-b border-slate-100">
            <h1 className="text-base font-black text-slate-900">批改结果</h1>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg border border-blue-500 text-blue-600 text-xs font-bold bg-white hover:bg-blue-50 transition-colors whitespace-nowrap"
              >
                AI 1对1讲题
              </button>
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors flex items-center gap-1 whitespace-nowrap"
              >
                <Plus size={14} />
                加入错题本
              </button>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar px-5 py-4 space-y-4">
            <section className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
              <div className="flex items-center justify-between gap-2 mb-2">
                <h2 className="text-sm font-black text-slate-800">题目</h2>
                {currentGrade.step === 'idle' && (
                  <button
                    type="button"
                    onClick={() => patchQuestionGrade(selectedId, { step: 'prompt' })}
                    className="flex items-center gap-1 text-[11px] text-blue-600 font-bold shrink-0"
                  >
                    <HelpCircle size={14} />
                    对批改结果有疑问
                  </button>
                )}
              </div>
              <AnimatePresence mode="wait">
                {currentGrade.step === 'prompt' && (
                  <motion.p
                    key="prompt"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="text-sm text-slate-500 mb-3"
                  >
                    批改错了，
                    <button
                      type="button"
                      onClick={() => patchQuestionGrade(selectedId, { step: 'pick' })}
                      className="text-[#7b6cff] font-bold"
                    >
                      自己批改
                    </button>
                  </motion.p>
                )}
                {currentGrade.step === 'pick' && (
                  <motion.div
                    key="pick"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="flex items-center gap-3 mb-3 text-sm text-slate-500"
                  >
                    <span>修改批改答案为：</span>
                    <button type="button" aria-label="改为正确" onClick={() => handlePickGrade('correct')}>
                      <GradeMarkIcon mark="correct" />
                    </button>
                    <button type="button" aria-label="改为错误" onClick={() => handlePickGrade('incorrect')}>
                      <GradeMarkIcon mark="incorrect" />
                    </button>
                  </motion.div>
                )}
                {currentGrade.step === 'done' && currentGrade.userGrade && currentGrade.userAt && (
                  <motion.div
                    key="done"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="mb-3"
                  >
                    {showHistoryCompare ? (
                      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          {formatGradeTime(currentGrade.systemAt)} 智阅作业:
                          <GradeMarkIcon mark={currentGrade.systemGrade} size="sm" />
                        </span>
                        <span className="inline-flex items-center gap-1">
                          {formatGradeTime(currentGrade.userAt)} 我的批改:
                          <GradeMarkIcon mark={currentGrade.userGrade} size="sm" />
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        我的批改:
                        <GradeMarkIcon mark={currentGrade.userGrade} size="sm" />
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
              <p className="text-sm leading-relaxed text-slate-700 font-medium mb-3">{QUESTION_TEXT}</p>
              <div className="grid grid-cols-2 gap-2 text-sm text-slate-600">
                {OPTIONS.map(opt => (
                  <span key={opt} className="font-medium">
                    {opt}
                  </span>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-sm font-black text-slate-800 mb-2">分析</h2>
              <p className="text-sm leading-relaxed text-slate-600">{ANALYSIS_TEXT}</p>
            </section>

            <section>
              <h2 className="text-sm font-black text-slate-800 mb-2">答案</h2>
              <DisabledAnswerBlock />
            </section>

            <section>
              <h2 className="text-sm font-black text-slate-800 mb-2">详解</h2>
              <DisabledAnswerBlock />
            </section>

            <section>
              <h2 className="text-sm font-black text-slate-800 mb-2">点睛</h2>
              <p className="text-sm leading-relaxed text-slate-600">{KEY_POINT_TEXT}</p>
            </section>

            <section ref={knowledgeSectionRef} className="pb-4 min-h-[120px]">
              <h2 className="text-sm font-black text-slate-800 mb-3">知识点视频</h2>
              <AnimatePresence mode="wait">
                {knowledgeLoadState === 'idle' && (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-10 rounded-xl bg-slate-50 border border-dashed border-slate-200/80"
                  />
                )}
                {knowledgeLoadState === 'loading' && (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25 }}
                  >
                    <KnowledgePointsLoading />
                  </motion.div>
                )}
                {knowledgeLoadState === 'error' && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25 }}
                  >
                    <KnowledgePointsError onRefresh={handleKnowledgeRefresh} />
                  </motion.div>
                )}
                {knowledgeLoadState === 'ready' && (
                  <motion.div
                    key="ready"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                  >
                    <div className="flex flex-wrap gap-2">
                      {KNOWLEDGE_POINTS.map((point, index) => (
                        <motion.div
                          key={point.name}
                          initial={{ opacity: 0, scale: 0.92 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.08, duration: 0.25 }}
                        >
                          <KnowledgePointTag
                            name={point.name}
                            hasVideo={point.hasVideo}
                            active={activeKnowledgePoint === point.name}
                            onClick={() => handleKnowledgePointClick(point)}
                          />
                        </motion.div>
                      ))}
                    </div>
                    <AnimatePresence mode="wait">
                      {activePoint?.hasVideo && (
                        <motion.div
                          key={activePoint.name}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.25 }}
                          className="mt-3"
                        >
                          <KnowledgePointVideoPlayer name={activePoint.name} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          </div>
        </div>
      </div>
      <LingjingToast message={toastMessage ?? ''} visible={!!toastMessage} />
      <HomeworkNoMatchModal
        visible={showHomeworkNoMatch}
        onRetake={() => {
          clearHomeworkNoMatch();
          onRetake();
        }}
        onBack={() => {
          clearHomeworkNoMatch();
          onExit();
        }}
      />
    </div>
  );
};
