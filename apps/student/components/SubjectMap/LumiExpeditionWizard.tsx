import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Rocket, Target, Check, Clock, ChevronRight, Mic, Calculator, Brain, BookOpen, Search, X, HelpCircle, RefreshCw } from 'lucide-react';
import { InteractiveLumi } from '../LumiSpace/InteractiveLumi';

interface WizardProps {
  onComplete: (plan: { intent: string; duration: number; topic?: string; focus?: string }) => void;
  subject: string;
}

// ------------------- Constants -------------------

const MATH_TOPIC_TREE: Record<string, { label: string; icon: any; color: string; children: { id: string; label: string }[] }> = {
  algebra: {
    label: "🔢 代数",
    icon: Calculator,
    color: "bg-blue-50 text-blue-600",
    children: [
      { id: 'quad_func', label: "二次函数" },
      { id: 'inequality', label: "不等式与不等式组" },
      { id: 'fraction_eq', label: "分式方程" },
      { id: 'linear_func', label: "一次函数" },
    ]
  },
  geometry: {
    label: "📐 几何",
    icon: Target,
    color: "bg-emerald-50 text-emerald-600",
    children: [
      { id: 'triangle', label: "全等/相似三角形" },
      { id: 'circle', label: "圆的性质" },
      { id: 'pythagoras', label: "勾股定理" },
      { id: 'solid', label: "立体几何" },
    ]
  },
  stats: {
    label: "📊 统计与概率",
    icon: Rocket, // Placeholder
    color: "bg-purple-50 text-purple-600",
    children: [
      { id: 'data_analysis', label: "数据的分析" },
      { id: 'probability', label: "概率初步" },
    ]
  },
  unsure: {
    label: "🤔 我也不确定",
    icon: HelpCircle,
    color: "bg-amber-50 text-amber-600",
    children: [] // Special case
  }
};

const ERROR_TYPES = [
  { id: 'concept', label: "🤯 概念模糊", desc: "记不住公式 / 性质混淆", icon: Brain },
  { id: 'calc', label: "✍️ 计算老错", desc: "思路对，但总算不对", icon: Calculator },
  { id: 'app', label: "😵‍💫 读不懂题", desc: "应用题不知道设变量", icon: BookOpen }
];

type WizardStep = 'hook' | 'proposal' | 'intent' | 'category_select' | 'sub_topic_select' | 'error_analysis' | 'duration';

const STEP_META: Record<WizardStep, { eyebrow: string; title: string }> = {
  hook: {
    eyebrow: '',
    title: '',
  },
  proposal: {
    eyebrow: 'STEP 1',
    title: 'AI 智能诊断建议',
  },
  intent: {
    eyebrow: 'STEP 1',
    title: '开启你的专属训练旅程',
  },
  category_select: {
    eyebrow: 'STEP 2',
    title: '定制训练内容',
  },
  sub_topic_select: {
    eyebrow: 'STEP 3',
    title: '再精确到具体知识点',
  },
  error_analysis: {
    eyebrow: 'STEP 3',
    title: '说说你通常是哪里掉链子',
  },
  duration: {
    eyebrow: 'STEP 3',
    title: '设定未来几周的节奏',
  },
};

export const LumiExpeditionWizard: React.FC<WizardProps> = ({ onComplete, subject }) => {
  const [step, setStep] = useState<WizardStep>('hook'); // Default to hook
  const [history, setHistory] = useState<WizardStep[]>([]);
  const [isGenerating, setIsGenerating] = useState(false); // For hook loading state
  const [selection, setSelection] = useState({
    intent: 'weakness', // Default intent
    category: 'geometry', // Default recommendation
    subTopic: '',
    errorType: '',
    duration: 2 // Default 2 weeks
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when step changes (optional, but good for chat flow)
  useEffect(() => {
    if (scrollRef.current) {
        // scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [step]);

  const goToStep = (nextStep: WizardStep) => {
    setHistory(prev => [...prev, step]);
    setStep(nextStep);
  };

  const handleHookGenerate = () => {
    setIsGenerating(true);
    // Simulate AI thinking time
    setTimeout(() => {
      setIsGenerating(false);
      goToStep('proposal');
    }, 2000);
  };

  const goBack = () => {
    if (history.length > 0) {
        const prev = history[history.length - 1];
        setHistory(prevH => prevH.slice(0, -1));
        setStep(prev);
    }
  };

  // ------------------- Render Helpers -------------------

  const getLumiEmotion = () => {
    if (isGenerating) return 'thinking';
    switch (step) {
        case 'hook': return 'curious';
        case 'proposal': return 'happy';
        case 'intent': return 'idle';
        case 'category_select': return 'curious';
        case 'sub_topic_select': return 'curious';
        case 'error_analysis': return 'thinking';
        case 'duration': return 'excited';
        default: return 'idle';
    }
  };

  const getDialogueText = () => {
    if (isGenerating) return "正在扫描错题本... 分析知识盲区... 规划最优路径...";
    
    switch (step) {
        case 'hook':
            return `Hi! 发现你的知识图谱中有 3 个薄弱点待修复。小晤 已为你准备好针对性提分方案。`;
        case 'proposal':
            return `方案已生成！核心锁定【${subject === '数学' ? '几何' : subject}专项】。你可以自由调整训练时长，小晤 会自动适配每日任务量。`;
        case 'intent':
            return `Hi! 检测到 ${subject} 还没有特训计划，让我们一起定制专属路径吧！`;
        case 'category_select':
            return `没问题，我们来手动调整。你觉得最近哪个板块最需要加强？`;
        case 'sub_topic_select':
            const catLabel = MATH_TOPIC_TREE[selection.category]?.label || '该板块';
            return `${catLabel}可是数学的脊梁！具体是哪里卡住了？`;
        case 'error_analysis':
            return `跟我说说，做题时哪种情况最常见？这决定了我们的战术！`;
        case 'duration':
            const focusLabel = selection.errorType 
                ? (selection.errorType === 'concept' ? '概念强化' : selection.errorType === 'calc' ? '计算特训' : '模型拆解')
                : (MATH_TOPIC_TREE[selection.category]?.label || '专项突破');
            return `明白！针对【${focusLabel}】的路径已生成。你希望用多长时间完成挑战？`;
        default:
            return '';
    }
  };

  // ------------------- Step Content Renderers -------------------

  const renderHookStep = () => (
      <motion.div
        key="hook"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.25 }}
        className="flex flex-col gap-2.5 w-full items-center"
      >
          {/* Mystery Card */}
          <div className="relative w-full overflow-hidden rounded-[24px] bg-slate-900/40 p-1 border border-white/10 shadow-xl group">
             <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 opacity-50 group-hover:opacity-100 transition-opacity"></div>
             
             <div className="relative bg-slate-900/60 backdrop-blur-md rounded-[20px] p-4 text-center flex flex-col items-center justify-center gap-3">
                 
                 {/* Floating Icon */}
                 <div className="relative mt-0.5">
                    <div className="absolute inset-0 bg-indigo-500/30 blur-xl rounded-full animate-pulse"></div>
                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg border border-white/10 rotate-3 transition-transform group-hover:rotate-6 group-hover:scale-105">
                        <Target size={28} className="text-white drop-shadow-md" />
                        <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full border border-slate-900">3</div>
                    </div>
                 </div>

                 <div className="space-y-2">
                     <h2 className="text-xl font-black text-white tracking-tight">专属提分锦囊</h2>
                     <p className="text-slate-400 text-xs font-medium max-w-[200px] mx-auto leading-relaxed">
                         基于你的近期错题与薄弱点<br/>小晤 已就绪
                     </p>
                 </div>

                 {/* Generate Button */}
                 <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={handleHookGenerate}
                    disabled={isGenerating}
                    className="w-full py-2.5 bg-white text-indigo-950 rounded-xl font-black text-sm shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 mt-1 group/btn relative overflow-hidden"
                 >
                     {isGenerating ? (
                         <>
                            <div className="w-4 h-4 border-2 border-indigo-900/30 border-t-indigo-600 rounded-full animate-spin"></div>
                            <span className="opacity-70">正在分析图谱...</span>
                         </>
                     ) : (
                         <>
                            <Rocket size={18} className="text-indigo-600 group-hover/btn:-translate-y-0.5 group-hover/btn:translate-x-0.5 transition-transform" />
                            <span>生成我的专属路径</span>
                         </>
                     )}
                 </motion.button>
             </div>
          </div>
      </motion.div>
  );

  const renderProposalStep = () => (
      <motion.div
        key="proposal"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.25 }}
        className="flex flex-col gap-[14px] w-full"
      >
        {/* Recommended Plan Card */}
        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-indigo-600 to-violet-700 p-1 shadow-[0_20px_50px_rgba(79,70,229,0.4)] border border-white/20">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-400/20 rounded-full blur-xl translate-y-1/2 -translate-x-1/2"></div>
            
            <div className="relative bg-slate-900/40 backdrop-blur-sm rounded-[28px] p-5 text-white">
                <div className="flex items-start justify-between mb-5">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-black uppercase tracking-wider">
                                AI Recommended
                            </span>
                        </div>
                        <h2 className="text-2xl font-black leading-tight">几何专项<br/>突破计划</h2>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
                        <Target size={24} className="text-white" />
                    </div>
                </div>

                {/* Duration Segmented Control (Interactive) */}
                <div className="bg-black/20 backdrop-blur-md p-1.5 rounded-[20px] flex shadow-inner border border-white/10 mb-4">
                    {[1, 2, 3].map((w) => (
                    <button
                        key={w}
                        onClick={() => setSelection(s => ({ ...s, duration: w }))}
                        className={`relative flex-1 py-2 rounded-[16px] text-[11px] font-bold transition-all duration-300
                        ${selection.duration === w
                            ? 'text-indigo-900'
                            : 'text-white/40 hover:text-white/60'
                        }`}
                    >
                        {selection.duration === w && (
                        <motion.div
                            layoutId="proposalDuration"
                            className="absolute inset-0 bg-white rounded-[16px]"
                            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                            transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                        />
                        )}
                        <span className="relative z-10">{w} 周</span>
                    </button>
                    ))}
                </div>

                {/* Dynamic Daily Load Info */}
                <div className="flex items-center justify-between px-2 mb-2">
                    <span className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Daily Load</span>
                    <div className="flex items-end gap-1.5">
                        <span className="text-xl font-black text-white">
                             {selection.duration === 1 ? '45' : selection.duration === 2 ? '25' : '15'}
                        </span>
                        <span className="text-[10px] font-bold text-white/60 mb-1">min/day</span>
                    </div>
                </div>

                {/* Radar Chart Placeholder (Simple CSS visual) */}
                <div className="flex items-center gap-2 text-[10px] font-medium text-white/70 bg-white/5 p-2.5 rounded-xl border border-white/5">
                     <Brain size={12} className="text-indigo-300 shrink-0" />
                     <span>覆盖全等三角形、圆的性质等 12 个考点</span>
                </div>
            </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-row gap-3 items-stretch h-[54px]">
            {/* 左侧：换个主题 (30%) */}
            <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => goToStep('category_select')}
                className="flex-[3] rounded-2xl border border-white/10 bg-slate-800/50 hover:bg-slate-800 text-slate-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors backdrop-blur-sm"
            >
                <RefreshCw size={14} />
                <span>换主题</span>
            </motion.button>

            {/* 右侧：确认并开启 (70%) */}
            <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                    onComplete({
                        intent: 'weakness',
                        duration: selection.duration, // Use user selected duration
                        topic: 'geometry_pack',
                        focus: 'concept'
                    });
                }}
                className="flex-[7] bg-white text-indigo-900 rounded-2xl font-black text-sm shadow-[0_0_30px_rgba(255,255,255,0.2)] flex items-center justify-center gap-2"
            >
                <Check size={18} className="text-indigo-600" />
                <span>确认并开启计划</span>
            </motion.button>
        </div>
      </motion.div>
  );

  const renderIntentStep = () => (
    <motion.div
      key="intent"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col gap-4 w-full"
    >
      <div className="rounded-2xl bg-slate-900/70 border border-white/5 px-4 py-3 shadow-[0_18px_40px_rgba(15,23,42,0.45)]">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-slate-100">
            {subject} · 学科地图
          </span>
          <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400">
            1–3 周训练
          </span>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-400">
          小晤 会根据你的薄弱点自动排出接下来几周的训练关卡，让你稳步补齐短板。
        </p>
      </div>

      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={() => {
          // 默认设置为“攻克薄弱点”意图
          setSelection(s => ({ ...s, intent: 'weakness' }));

          // 核心逻辑：数学 -> 诊断流程；其他 -> 直接时长
          if (subject === '数学' || subject === 'Math') {
            goToStep('category_select');
          } else {
            goToStep('duration');
          }
        }}
        className="w-full py-4.5 bg-slate-950 text-slate-50 rounded-full font-semibold text-sm shadow-[0_18px_45px_rgba(15,23,42,0.8)] flex items-center justify-center gap-2 mt-1 group border border-white/8"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-lg shadow-indigo-500/40">
          <Rocket size={18} className="text-white" />
        </div>
        <span className="tracking-wide">开始规划路径</span>
        <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
      </motion.button>

      <p className="text-[11px] text-center text-slate-500 mt-1">
        之后你也可以在学科地图顶部，重新唤起这一步来微调你的训练计划。
      </p>
    </motion.div>
  );

  const renderCategorySelect = () => (
    <motion.div
      key="category"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25 }}
      className="grid grid-cols-2 gap-3"
    >
      {Object.entries(MATH_TOPIC_TREE).map(([key, data]) => {
        const isSelected = selection.category === key;
        return (
          <motion.button
            key={key}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              setSelection(s => ({ ...s, category: key }));
              if (key === 'unsure') {
                // Keep unsure flow as is, maybe useful
                goToStep('error_analysis');
              } else {
                // PRD v1.1: Skip detailed sub-selection to keep it "3 clicks"
                // Go straight to duration for general topic mastery
                goToStep('duration');
              }
            }}
            className={`relative flex flex-col items-start justify-between gap-2 p-4 rounded-2xl border text-left h-28 overflow-hidden transition-all
              ${isSelected
                ? 'border-indigo-400/80 bg-indigo-500/10 shadow-[0_16px_45px_rgba(79,70,229,0.45)]'
                : 'border-white/10 bg-slate-900/60 hover:border-indigo-400/50 hover:bg-slate-900/80 shadow-[0_14px_36px_rgba(15,23,42,0.7)]'
              }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-white/90 flex items-center justify-center shadow-md">
                <data.icon size={18} className={data.color.replace('bg-', '')} />
              </div>
              <span className="font-semibold text-[13px] text-slate-50">{data.label}</span>
            </div>
            <span className="text-[11px] text-slate-400">
              {key === 'algebra' && '方程 / 函数 / 不等式等代数核心'}
              {key === 'geometry' && '图形、定理与空间想象相关内容'}
              {key === 'stats' && '数据分析与基础概率直觉'}
              {key === 'unsure' && '交给 Lumi 诊断，从最近错题中帮你找薄弱点'}
            </span>
            {isSelected && (
              <div className="absolute right-3 top-3 w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[11px] shadow-md">
                ✓
              </div>
            )}
          </motion.button>
        );
      })}
    </motion.div>
  );

  const renderSubTopicSelect = () => {
      const categoryData = MATH_TOPIC_TREE[selection.category];
      if (!categoryData) return null;

      return (
        <motion.div
          key="subtopic"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="flex flex-col gap-3"
        >
          {categoryData.children.map(child => {
            const isSelected = selection.subTopic === child.id;
            return (
              <motion.button
                key={child.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setSelection(s => ({ ...s, subTopic: child.id }));
                  goToStep('error_analysis');
                }}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border bg-slate-950/60 transition-all
                  ${isSelected
                    ? 'border-indigo-400/80 shadow-[0_16px_40px_rgba(79,70,229,0.5)]'
                    : 'border-white/8 hover:border-indigo-400/60 hover:bg-slate-900/80 shadow-[0_14px_34px_rgba(15,23,42,0.7)]'
                  }`}
              >
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-50">{child.label}</span>
                  <span className="text-[11px] text-slate-400 mt-0.5">
                    以这个知识点为核心，生成后续训练路径。
                  </span>
                </div>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] transition-colors
                    ${isSelected ? 'bg-indigo-500 text-white shadow-md' : 'bg-slate-900 text-slate-400'}`}
                >
                  <ChevronRight size={16} />
                </div>
              </motion.button>
            );
          })}

          {/* Voice Input Option */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            className="mt-1 w-full px-4 py-3 rounded-2xl border border-indigo-500/30 bg-indigo-500/5 text-[12px] font-medium text-indigo-300 flex items-center justify-center gap-2"
          >
            <Mic size={14} />
            <span>或者直接用语音跟我说你在哪一块最迷糊</span>
          </motion.button>
        </motion.div>
      );
  };

  const renderErrorAnalysis = () => (
    <motion.div
      key="error"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col gap-3"
    >
      {ERROR_TYPES.map(err => {
        const isSelected = selection.errorType === err.id;
        return (
          <motion.button
            key={err.id}
            onClick={() => {
              setSelection(s => ({ ...s, errorType: err.id }));
              goToStep('duration');
            }}
            whileTap={{ scale: 0.98 }}
            className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl border text-left transition-all
              ${isSelected
                ? 'border-indigo-400/80 bg-indigo-500/10 shadow-[0_18px_42px_rgba(79,70,229,0.5)]'
                : 'border-white/10 bg-slate-900/70 hover:border-indigo-400/60 hover:bg-slate-900/90 shadow-[0_16px_38px_rgba(15,23,42,0.75)]'
              }`}
          >
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
              <err.icon size={20} />
            </div>
            <div>
              <h4 className="font-semibold text-[13px] text-slate-50">
                {err.id === 'concept' && '概念老记不住 / 容易混淆'}
                {err.id === 'calc' && '思路对，但总算错 / 粗心挂科'}
                {err.id === 'app' && '一到应用题就懵 / 不会建模'}
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">{err.desc}</p>
            </div>
          </motion.button>
        );
      })}
    </motion.div>
  );

  const renderDurationStep = () => (
    <motion.div
      key="duration"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col gap-5"
      style={{
        backdropFilter: 'blur(19.43px)',
        backgroundColor: 'rgba(61, 61, 61, 1)',
        borderRadius: '38px',
        paddingTop: '11px',
        paddingBottom: '11px',
        paddingLeft: '10px',
        paddingRight: '10px'
      }}
    >
      {/* Duration Segmented Control */}
      <div className="bg-slate-900/70 backdrop-blur-md p-1.5 rounded-[24px] flex shadow-inner border border-white/10">
        {[1, 2, 3].map((w) => (
          <button
            key={w}
            onClick={() => setSelection(s => ({ ...s, duration: w }))}
            className={`relative flex-1 py-2.5 rounded-[20px] text-xs font-semibold transition-all duration-300
              ${selection.duration === w
                ? 'text-indigo-600'
                : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            {selection.duration === w && (
              <motion.div
                layoutId="activeDuration"
                className="absolute inset-0 bg-white rounded-[20px]"
                style={{ boxShadow: 'none' }}
                transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
              />
            )}
            <span className="relative z-10 flex items-center justify-center gap-1.5">
              <Clock size={13} className={selection.duration === w ? "text-indigo-500" : "text-slate-400"} />
              {w} 周
            </span>
          </button>
        ))}
      </div>

        {/* Duration Info */}
      <div className="px-1 space-y-2">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.16em]">
          预计每日投入
        </p>
        <div className="flex items-end justify-between">
          <div className="text-2xl font-black text-slate-50">
            {selection.duration === 1 ? '45 分钟' : selection.duration === 2 ? '25 分钟' : '15 分钟'}
            <span className="text-sm font-medium text-slate-400 ml-1">/ 天</span>
          </div>
          <span className="text-[11px] text-slate-400">
            {selection.duration === 1 && '密集短冲刺 · 适合考前强化'}
            {selection.duration === 2 && '稳步推进 · 兼顾学校作业'}
            {selection.duration === 3 && '轻松节奏 · 不挤占太多时间'}
          </span>
        </div>

        {/* Simple rhythm bar */}
        <div className="mt-1 flex items-center gap-1.5">
          {Array.from({ length: 7 }).map((_, idx) => {
            const level = selection.duration === 1 ? 3 : selection.duration === 2 ? 2 : 1;
            const active = idx < 7;
            return (
              <div
                key={idx}
                className={`flex-1 rounded-full transition-all h-1.5
                  ${active
                    ? level === 3
                      ? 'bg-gradient-to-r from-indigo-400 to-sky-400'
                      : level === 2
                        ? 'bg-indigo-400/80'
                        : 'bg-indigo-300/70'
                    : 'bg-slate-700'
                  }`}
              />
            );
          })}
        </div>
      </div>

      {/* Confirm Button */}
      <motion.button
        whileTap={{ scale: 0.96 }}
        onClick={() => onComplete({
          intent: selection.intent,
          duration: selection.duration,
          topic: selection.subTopic,
          focus: selection.errorType
        })}
        className="w-full py-4 bg-slate-950 text-slate-50 rounded-full font-semibold text-sm shadow-[0_20px_50px_rgba(15,23,42,0.9)] flex items-center justify-center gap-2 mt-1 group border border-white/8"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-sky-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-lg shadow-indigo-500/40">
          <Rocket size={18} className="text-white" />
        </div>
        <span className="tracking-wide">生成这几周的训练地图</span>
      </motion.button>
    </motion.div>
  );

  return (
    <div className="w-full h-full min-h-0 flex flex-col items-center justify-center relative px-6 py-2 overflow-hidden" ref={scrollRef}>
      
      {/* Lumi Container - Fluid positioning */}
      <motion.div 
        layout
        className="relative z-20 mb-3 flex items-center justify-center gap-4"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
      >
        <InteractiveLumi size="md" emotion={getLumiEmotion()} />
        
        {/* Dialogue Bubble - iOS Glassmorphism */}
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={step} // Re-animate on step change
            className="relative w-72 bg白/80 backdrop-blur-xl border border白/40 shadow-lg rounded-2xl p-3 text-center"
        >
            <div className="absolute top-1/2 -left-2 -translate-y-1/2 w-4 h-4 bg白/80 rotate-45 border-b border-l border白/40" />
            <p className="text-[13px] font-medium text-slate-700 leading-relaxed">
                {getDialogueText()}
            </p>
        </motion.div>
      </motion.div>

      {/* Interaction Area */}
      <div className="w-full max-w-sm relative z-20 min-h-0 flex flex-col justify-end overflow-hidden">
        <AnimatePresence mode="wait">
            {step === 'hook' && renderHookStep()}
            {step === 'proposal' && renderProposalStep()}
            {step === 'intent' && renderIntentStep()}
            {step === 'category_select' && renderCategorySelect()}
            {step === 'sub_topic_select' && renderSubTopicSelect()}
            {step === 'error_analysis' && renderErrorAnalysis()}
            {step === 'duration' && renderDurationStep()}
        </AnimatePresence>

        {history.length > 0 && (
            <div className="flex justify-center mt-3">
                 <button 
                    onClick={goBack}
                    className="text-slate-400 text-xs font-medium hover:text-slate-600 transition-colors flex items-center gap-1"
                >
                    <ChevronRight className="rotate-180" size={12}/>
                    返回上一步
                </button>
            </div>
        )}
      </div>

      {/* Decorative Background for Duration Step */}
      {step === 'duration' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.1 }}
            className="absolute inset-0 pointer-events-none flex items-center justify-center z-0"
          >
              <svg width="100%" height="100%" viewBox="0 0 400 600" fill="none" className="scale-150 opacity-50">
                   <path d="M200 600 C 100 450 300 350 200 200" stroke="#6366f1" strokeWidth="8" strokeDasharray="20 20" strokeLinecap="round" />
              </svg>
          </motion.div>
      )}
    </div>
  );
};
