import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Brain,
  Calculator,
  ChevronRight,
  Puzzle,
  RefreshCw,
  Rocket,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { InteractiveLumi } from '../LumiSpace/InteractiveLumi';
import { WizardPlanPayload, getExpectedTotalMinutes } from './expeditionPlanConfig';
import {
  TextbookTheme,
  buildThemeLevelTitles,
  describeTheme,
  getPlanQuota,
  getTextbookThemes,
  nextThemeOffset,
  takeThemeBatch,
} from './expeditionCatalog';
import { usePrototypeAnnotationOptional } from '../../context/PrototypeAnnotationContext';

interface WizardProps {
  onComplete: (plan: WizardPlanPayload) => void;
  subject: string;
  textbook?: string;
  entryMode?: 'default' | 'first-time';
}

type WizardStep = 'hook' | 'category' | 'duration';

const THEME_ICONS = [Zap, Target, BookOpen, Brain, Calculator, Puzzle, TrendingUp];
const THEME_COLORS = [
  'text-rose-600',
  'text-violet-600',
  'text-indigo-600',
  'text-sky-600',
  'text-emerald-600',
  'text-amber-600',
];

function themeIcon(index: number) {
  return THEME_ICONS[index % THEME_ICONS.length];
}

function themeColor(index: number) {
  return THEME_COLORS[index % THEME_COLORS.length];
}

export const LumiExpeditionWizard: React.FC<WizardProps> = ({
  onComplete,
  subject,
  textbook,
  entryMode = 'default',
}) => {
  const annotation = usePrototypeAnnotationOptional();
  const isFirstTime = entryMode === 'first-time' || annotation?.expeditionSimScenario === 'first-time';
  const isComingSoon = subject === '语文' || subject === '英语';

  const allThemes = useMemo(() => getTextbookThemes(subject, textbook), [subject, textbook]);
  const [step, setStep] = useState<WizardStep>('hook');
  const [history, setHistory] = useState<WizardStep[]>([]);
  const [batchOffset, setBatchOffset] = useState(0);
  const [duration, setDuration] = useState(2);
  const [selectedId, setSelectedId] = useState(allThemes[0]?.id ?? '');

  const visibleThemes = useMemo(
    () => takeThemeBatch(allThemes, batchOffset),
    [allThemes, batchOffset]
  );

  const selectedTheme =
    visibleThemes.find((theme) => theme.id === selectedId) ??
    allThemes.find((theme) => theme.id === selectedId) ??
    visibleThemes[0];

  const goToStep = (nextStep: WizardStep) => {
    setHistory((prev) => [...prev, step]);
    setStep(nextStep);
  };

  const goBack = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setStep(prev);
  };

  const syncSelectionToBatch = (batch: TextbookTheme[]) => {
    if (batch.length === 0) {
      setSelectedId('');
      return;
    }
    setSelectedId((current) => (batch.some((theme) => theme.id === current) ? current : batch[0].id));
  };

  const refreshThemes = () => {
    const nextOffset = nextThemeOffset(allThemes.length, batchOffset);
    const nextBatch = takeThemeBatch(allThemes, nextOffset);
    setBatchOffset(nextOffset);
    syncSelectionToBatch(nextBatch);
  };

  const openThemePicker = () => {
    const firstBatch = takeThemeBatch(allThemes, 0);
    setBatchOffset(0);
    syncSelectionToBatch(firstBatch);
    goToStep('category');
  };

  const buildPayload = (): WizardPlanPayload => {
    const theme = selectedTheme ?? allThemes[0];
    const quota = getPlanQuota(duration);
    if (!theme) {
      return { intent: 'weakness', duration, subject, textbook };
    }
    return {
      intent: 'weakness',
      duration,
      category: theme.id,
      topic: theme.id,
      topics: [theme.id],
      subject,
      textbook,
      title: `${theme.label}专项突破计划`,
      coverage: theme.knowledgePoints.length
        ? `覆盖${theme.knowledgePoints.slice(0, 3).join('、')}等`
        : `覆盖「${theme.label}」核心内容`,
      levelTitles: buildThemeLevelTitles(theme, quota),
      selectedLabels: [theme.label],
    };
  };

  const getLumiEmotion = (): 'idle' | 'happy' | 'thinking' | 'sparkle' => {
    if (isComingSoon) return 'thinking';
    if (step === 'hook') return 'sparkle';
    if (step === 'category') return 'thinking';
    return 'happy';
  };

  const getDialogueText = () => {
    if (isComingSoon) return '这一科还在准备，先去其他科目练练吧。';
    if (step === 'hook') {
      return isFirstTime
        ? 'Hi! 你刚开始用，还没有任何学情。小晤按教材顺序为你准备了 6 个主题，不满意可以刷新换一批。'
        : 'Hi! 小晤按教材顺序为你推荐了 6 个主题，点一下就能开始，也可以刷新换一批。';
    }
    if (step === 'category') return '每次展示 6 个主题，单选一个即可。刷新会按教材顺序换下一批。';
    return '选好时长就可以开启计划。也可以返回更换主题。';
  };

  const renderComingSoon = () => (
    <motion.div
      key="coming-soon"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25 }}
      className="flex w-full flex-col items-center gap-[14px]"
    >
      <div className="relative w-full overflow-hidden rounded-[32px] border border-white/10 bg-slate-900/40 p-1 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 opacity-40" />
        <div className="relative flex flex-col items-center justify-center gap-6 rounded-[28px] bg-slate-900/60 p-6 text-center backdrop-blur-md">
          <div className="relative mt-2">
            <div className="flex h-20 w-20 rotate-3 items-center justify-center rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg">
              <Target size={40} className="text-white drop-shadow-md" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black tracking-tight text-white">专属提分锦囊</h2>
            <p className="mx-auto max-w-[240px] text-xs font-medium leading-relaxed text-slate-500">
              暂未开放，正在筹备中
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const renderHookStep = () => (
    <motion.div
      key="hook"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25 }}
      className="flex w-full flex-col items-center gap-[14px]"
    >
      <div className="group relative w-full overflow-hidden rounded-[32px] border border-white/10 bg-slate-900/40 p-1 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 opacity-50 transition-opacity group-hover:opacity-100" />
        <div className="relative flex flex-col items-center justify-center gap-6 rounded-[28px] bg-slate-900/60 p-6 text-center backdrop-blur-md">
          <div className="relative mt-2">
            <div className="absolute inset-0 rounded-full bg-indigo-500/30 blur-xl animate-pulse" />
            <div className="flex h-20 w-20 rotate-3 items-center justify-center rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg transition-transform group-hover:rotate-6 group-hover:scale-105">
              <Target size={40} className="text-white drop-shadow-md" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black tracking-tight text-white">
              {isFirstTime ? '初次定制学习计划' : '专属提分锦囊'}
            </h2>
            <p className="mx-auto max-w-[240px] text-xs font-medium leading-relaxed text-slate-400">
              {isFirstTime ? '还没有学习数据，先按教材顺序推荐 6 个主题' : '按教材顺序为你推荐 6 个主题'}
              <br />
              可刷新换一批，单选后开始
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={openThemePicker}
            className="mt-1 flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3 text-sm font-black text-indigo-950 shadow-lg shadow-indigo-500/20"
          >
            <Rocket size={18} className="text-indigo-600" />
            <span>查看推荐主题</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );

  const renderCategorySelect = () => {
    const canRefresh = allThemes.length > 0;
    return (
      <motion.div
        key="category"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.25 }}
        className="flex w-full flex-col gap-3"
      >
        <div className="flex items-center justify-between px-0.5">
          <span className="text-[11px] text-slate-400">
            按教材顺序推荐 · 单选 1 个
          </span>
          <button
            type="button"
            onClick={refreshThemes}
            disabled={!canRefresh}
            className="inline-flex items-center gap-1 rounded-full border border-indigo-300/40 bg-indigo-500/10 px-2.5 py-1 text-[11px] font-semibold text-indigo-200 hover:bg-indigo-500/20 disabled:opacity-40"
          >
            <RefreshCw size={12} />
            刷新
          </button>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={visibleThemes.map((theme) => theme.id).join('|')}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-2 gap-3"
          >
            {visibleThemes.map((theme, index) => {
              const isSelected = selectedTheme?.id === theme.id;
              const Icon = themeIcon(allThemes.findIndex((item) => item.id === theme.id));
              return (
                <motion.button
                  key={theme.id}
                  type="button"
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSelectedId(theme.id)}
                  className={`relative flex h-28 flex-col items-start justify-between gap-2 overflow-hidden rounded-2xl border p-4 text-left transition-all ${
                    isSelected
                      ? 'border-indigo-400/80 bg-indigo-500/10 shadow-[0_16px_45px_rgba(79,70,229,0.45)]'
                      : 'border-white/10 bg-slate-900/60 shadow-[0_14px_36px_rgba(15,23,42,0.7)] hover:border-indigo-400/50 hover:bg-slate-900/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/90 shadow-md">
                      <Icon size={18} className={themeColor(index)} />
                    </div>
                    <span className="line-clamp-2 text-[13px] font-semibold leading-tight text-slate-50">
                      {theme.label}
                    </span>
                  </div>
                  <span className="line-clamp-2 text-[11px] text-slate-400">{describeTheme(theme)}</span>
                  {isSelected ? (
                    <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-[11px] text-white shadow-md">
                      ✓
                    </div>
                  ) : null}
                </motion.button>
              );
            })}
          </motion.div>
        </AnimatePresence>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={goBack}
            className="rounded-2xl bg-indigo-100 py-3 text-sm font-black text-violet-500 hover:bg-indigo-200"
          >
            返回上一步
          </button>
          <motion.button
            type="button"
            whileTap={{ scale: selectedTheme ? 0.96 : 1 }}
            onClick={() => {
              if (!selectedTheme) return;
              goToStep('duration');
            }}
            disabled={!selectedTheme}
            className={`flex items-center justify-center gap-1 rounded-2xl py-3 text-sm font-black ${
              selectedTheme
                ? 'bg-gradient-to-r from-violet-500 to-indigo-500 text-white shadow-[0_8px_18px_rgba(124,92,255,0.28)]'
                : 'cursor-not-allowed bg-slate-200 text-slate-400'
            }`}
          >
            <span>确认所选主题</span>
            <ChevronRight size={16} />
          </motion.button>
        </div>
      </motion.div>
    );
  };

  const renderDurationStep = () => {
    const theme = selectedTheme;
    const title = theme ? `${theme.label}专项突破计划` : '专项突破计划';
    const coverage = theme
      ? theme.knowledgePoints.length
        ? `覆盖${theme.knowledgePoints.slice(0, 3).join('、')}等`
        : `覆盖「${theme.label}」核心内容`
      : '';
    return (
      <motion.div
        key="duration"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.25 }}
        className="relative w-full overflow-hidden rounded-[28px] border border-white/80 bg-[#edf4fc] p-4 shadow-[0_14px_34px_rgba(81,112,164,0.14)]"
      >
        <div className="mb-3 rounded-2xl bg-gradient-to-r from-violet-400/90 to-sky-300/90 px-4 py-2.5">
          <p className="text-[12px] font-bold text-white">小晤已按你选的主题排好训练节奏</p>
        </div>
        <h3 className="mb-1 text-[18px] font-black text-slate-800">{title}</h3>
        <p className="mb-4 text-[12px] leading-relaxed text-slate-500">{coverage}</p>
        <div className="mb-4 rounded-2xl bg-white p-1 shadow-[0_4px_12px_rgba(148,163,184,0.12)]">
          <div className="mb-1 flex items-center justify-between px-3 pt-2">
            <span className="text-[11px] font-semibold text-slate-400">训练时长</span>
            <span className="text-[12px] font-black text-slate-700">约 {getExpectedTotalMinutes(duration)} 分钟</span>
          </div>
          <div className="flex">
            {[1, 2, 3].map((week) => {
              const selected = duration === week;
              return (
                <button
                  key={week}
                  type="button"
                  onClick={() => setDuration(week)}
                  className={`flex-1 rounded-xl py-2.5 text-center transition-all ${
                    selected ? 'bg-violet-500 text-white shadow-[0_4px_10px_rgba(124,92,255,0.28)]' : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <span className="block text-[13px] font-black">{week} 周</span>
                  <span className={`text-[10px] font-semibold ${selected ? 'text-white/80' : 'text-slate-400'}`}>
                    {week * 7} 关
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => {
              setHistory(['hook']);
              setStep('category');
            }}
            className="rounded-2xl bg-indigo-100 py-3 text-sm font-black text-violet-500 hover:bg-indigo-200"
          >
            更换主题
          </button>
          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            onClick={() => onComplete(buildPayload())}
            className="rounded-2xl bg-gradient-to-r from-violet-500 to-indigo-500 py-3 text-sm font-black text-white shadow-[0_8px_18px_rgba(124,92,255,0.28)]"
          >
            确认并开启计划
          </motion.button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center px-4 py-6 md:py-8">
      <div className="flex w-full max-w-6xl flex-row items-center justify-center gap-5 lg:gap-8">
        <motion.div
          layout
          className="relative z-20 flex shrink-0 flex-col items-center"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
        >
          <InteractiveLumi size={isComingSoon || step === 'hook' ? 'lg' : step === 'category' ? 'md' : 'lg'} emotion={getLumiEmotion()} />
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={isComingSoon ? 'coming-soon' : step}
            className={`relative mt-3 rounded-2xl border border-white/40 bg-white/80 text-center shadow-xl backdrop-blur-xl ${
              isComingSoon || step === 'hook' ? 'w-64 p-4' : step === 'category' ? 'w-44 p-3' : 'w-64 p-4'
            }`}
          >
            <div className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-l border-t border-white/40 bg-white/80" />
            <p className={`font-medium leading-snug text-slate-700 ${isComingSoon || step !== 'category' ? 'text-sm' : 'text-[11px]'}`}>
              {getDialogueText()}
            </p>
          </motion.div>
        </motion.div>

        <div className={`relative z-20 flex w-full min-w-0 flex-1 flex-col justify-center ${isComingSoon || step === 'hook' ? 'max-w-sm min-h-[320px]' : 'max-w-lg'}`}>
          <AnimatePresence mode="wait">
            {isComingSoon && renderComingSoon()}
            {!isComingSoon && step === 'hook' && renderHookStep()}
            {!isComingSoon && step === 'category' && renderCategorySelect()}
            {!isComingSoon && step === 'duration' && renderDurationStep()}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
