import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Filter, BookOpen, ChevronRight, Star, Play, Pause, ChevronDown } from 'lucide-react';
import { allQuestions as mockQuestions, QuestionType, DifficultyLevel, QuestionCategory, getQuestionTypeLabel, CognitiveState, SubjectType, getQuestionsBySubject } from '../../data/questionBank';
import { UniversalQuizView, UniversalQuizQuestion, normalizeQuizSubmitPayload } from './UniversalQuizView';
import { QuestionPreviewModal } from './QuestionPreviewModal';
import { StatusRing } from './StatusRing';
import { SingleQuestionResultCard } from './SingleQuestionResultCard';
import { MistakeReasonKey } from '../../data/mistakeReasons';
import { getMistakeReasons, recordMistakeReasons } from '../../services/mistakeReasonService';

const STATE_TEXT_MAP: Record<CognitiveState, string> = {
  GAP: '未掌握',
  MASTERED: '已掌握',
  FADED: '需复习'
};

const STATE_STYLE_MAP: Record<CognitiveState, string> = {
  GAP: 'bg-rose-500/10 text-rose-300 border-rose-500/20',
  MASTERED: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
  FADED: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
};

interface QuestionBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectQuestion: (questionId: string) => void;
  title?: string;
  subject?: SubjectType; // 新增：按学科过滤
}

// Smart Filter Capsules
const FILTER_TYPES_DEFAULT: { id: QuestionType | 'all', label: string }[] = [
  { id: 'all', label: '全部题型' },
  { id: 'single_choice', label: '单选' },
  { id: 'multiple_choice', label: '多选' },
  { id: 'fill_in_blank', label: '填空' },
  { id: 'true_false', label: '判断' }
];

// English grouped types (two-level optgroup)
const ENGLISH_TYPE_GROUPS: { label: string; options: { id: QuestionType; label: string }[] }[] = [
  {
    label: '听读专项',
    options: [
      { id: 'listening_choice', label: '听力选择' },
      { id: 'listening_blank', label: '听力填空' },
      { id: 'listening_match', label: '听力匹配' },
      { id: 'listening_judge', label: '听力判断' },
      { id: 'listening_sort', label: '听力排序' },
      { id: 'phonics', label: '语音题' },
    ],
  },
  {
    label: '拼写语法',
    options: [
      { id: 'spelling', label: '单词拼写' },
      { id: 'grammar_choice', label: '语法选择' },
    ],
  },
  {
    label: '词句运用',
    options: [
      { id: 'word_choice', label: '单项选择' },
      { id: 'cloze_choice', label: '选词填空' },
      { id: 'sentence_completion', label: '完成句子' },
      { id: 'situation', label: '情景运用' },
    ],
  },
  {
    label: '阅读专项',
    options: [
      { id: 'reading_comp', label: '阅读理解' },
      { id: 'task_reading', label: '任务型阅读' },
      { id: 'short_cloze', label: '短文填空' },
      { id: 'dialogue_fill', label: '补全对话' },
    ],
  },
  {
    label: '翻译和改错',
    options: [
      { id: 'translation', label: '翻译' },
      { id: 'correction', label: '改错' },
    ],
  },
];

const CHINESE_TYPES: { id: QuestionType | 'all'; label: string }[] = [
  { id: 'all', label: '全部题型' },
  { id: 'accumulation', label: '积累运用' },
  { id: 'dictation', label: '默写' },
  { id: 'integrated_learning', label: '综合性学习' },
  { id: 'classical_reading', label: '文言文阅读' },
  { id: 'poem_reading', label: '诗歌阅读' },
];

const DIFFICULTY_LEVELS: { id: DifficultyLevel | 'all', label: string }[] = [
  { id: 'all', label: '全难度' },
  { id: 1, label: '容易' },
  { id: 2, label: '较易' },
  { id: 3, label: '适中' },
  { id: 4, label: '较难' },
  { id: 5, label: '困难' },
];

const DIFFICULTY_BADGE: Record<DifficultyLevel, string> = {
  1: '容易',
  2: '较易',
  3: '适中',
  4: '较难',
  5: '困难',
};

const CATEGORY_BADGE: Record<QuestionCategory, string> = {
  'typical': '典型题',
  'textbook': '课本原题',
  'synchronous': '同步题',
  'finale': '压轴题',
};

const SOURCE_TYPES: { id: QuestionCategory | 'all', label: string }[] = [
  { id: 'all', label: '全部来源' },
  { id: 'typical', label: '典型题' },
  { id: 'finale', label: '压轴题' },
  { id: 'synchronous', label: '同步题' },
  { id: 'textbook', label: '课本原题' },
];

// New Mastery Filter
const MASTERY_FILTERS: { id: CognitiveState | 'all', label: string }[] = [
  { id: 'all', label: '全部状态' },
  { id: 'GAP', label: '未掌握' },
  { id: 'MASTERED', label: '已掌握' },
  { id: 'FADED', label: '需复习' }
];

export const QuestionBankModal: React.FC<QuestionBankModalProps> = ({ isOpen, onClose, onSelectQuestion, title = "知识点题库", subject = 'math' }) => {
  const [activeType, setActiveType] = useState<QuestionType | 'all'>('all');
  const [activeDifficulty, setActiveDifficulty] = useState<DifficultyLevel | 'all'>('all');
  const [activeSource, setActiveSource] = useState<QuestionCategory | 'all'>('all');
  const [activeMastery, setActiveMastery] = useState<CognitiveState | 'all'>('all');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // 结果卡控制
  const [showResultCard, setShowResultCard] = useState(false);
  const [resultPayload, setResultPayload] = useState<any>(null);
  const [mistakeReasons, setMistakeReasons] = useState<MistakeReasonKey[]>([]);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);
  
  // Local state for bookmarks since mock data is static
  const questionSource = useMemo(
    () => (subject ? getQuestionsBySubject(subject as SubjectType) : mockQuestions),
    [subject]
  );

  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(
    new Set(questionSource.filter(q => q.bookmarked).map(q => q.id))
  );

  useEffect(() => {
    setBookmarkedIds(new Set(questionSource.filter(q => q.bookmarked).map(q => q.id)));
  }, [questionSource]);

  useEffect(() => {
    setPortalTarget(
      document.getElementById('app-viewport') ||
      document.getElementById('modal-root') ||
      null
    );
  }, []);

  // Cleanup audio on unmount/close
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);
  
  // Preview/Practice Mode State
  const [previewQuestion, setPreviewQuestion] = useState<UniversalQuizQuestion | null>(null);
  const [activeQuizMode, setActiveQuizMode] = useState<{
      isOpen: boolean;
      mode: 'practice' | 'analysis';
      questionId: string | null;
      customQuestions?: UniversalQuizQuestion[];
      singleQuestionMode?: boolean;
  }>({ isOpen: false, mode: 'practice', questionId: null });

  // 新增：获取 Portal 目标
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
      setMounted(true);
      return () => setMounted(false);
  }, []);

  const isEnglish = subject === 'english';
  const isChinese = subject === 'chinese';
  const typeOptions = isEnglish ? ENGLISH_TYPE_GROUPS : isChinese ? CHINESE_TYPES : FILTER_TYPES_DEFAULT;

  // Filter Logic
  const filteredQuestions = useMemo(() => {
    return questionSource
      .filter(q => !subject || q.subject === subject)
      .filter(q => {
        const typeMatch = activeType === 'all' || q.type === activeType;
        const diffMatch = activeDifficulty === 'all' || q.difficulty === activeDifficulty;
        const sourceMatch = activeSource === 'all' || q.category === activeSource;
        const masteryMatch = activeMastery === 'all' || q.cognitiveState === activeMastery;
        return typeMatch && diffMatch && sourceMatch && masteryMatch;
      });
  }, [questionSource, subject, activeType, activeDifficulty, activeSource, activeMastery]);

  // Quiz questions prepared for UniversalQuizView, with options fallback
  const quizQuestions = useMemo(() => {
    const base = activeQuizMode.customQuestions?.length
      ? activeQuizMode.customQuestions
      : filteredQuestions.map(q => ({
          ...q,
          content: {
            ...q.content,
            options: q.content.options || q.options?.map(o => o.content || o.label)
          }
        }) as any);
    return base;
  }, [activeQuizMode.customQuestions, filteredQuestions]);

  // Handlers
  const handleQuestionClick = (q: typeof mockQuestions[0]) => {
      // Convert to UniversalQuizQuestion format and open preview
      const universalQ: any = {
          ...q,
          type: q.type as any, // Simple cast for now
          source: q.category
      };
      setPreviewQuestion(universalQ);
  };

  const handleStartChallenge = (q: UniversalQuizQuestion) => {
      setPreviewQuestion(null);
      // Wait for modal to close
      setTimeout(() => {
        setActiveQuizMode({
            isOpen: true,
            mode: 'practice',
            questionId: q.id,
            customQuestions: [q],
            singleQuestionMode: true
        });
      }, 200);
  };

  const handleViewAnalysis = (q: UniversalQuizQuestion) => {
      setPreviewQuestion(null);
      setTimeout(() => {
        setActiveQuizMode({
            isOpen: true,
            mode: 'analysis',
            questionId: q.id,
            customQuestions: [q],
            singleQuestionMode: true
        });
      }, 200);
  };

  // 单题提交 -> 构造结果卡
  const handleQuizSubmit = (payload: any) => {
    const { answers } = normalizeQuizSubmitPayload(payload);
    if (!quizQuestions.length) {
      setActiveQuizMode(prev => ({ ...prev, isOpen: false }));
      return;
    }

    const currentIndex = activeQuizMode.questionId
      ? Math.max(0, quizQuestions.findIndex(q => q.id === activeQuizMode.questionId))
      : 0;
    const question = quizQuestions[currentIndex] || quizQuestions[0];
    const userAnswer = answers?.[question.id];
    const correctAnswer = question.result?.correctAnswer;

    const isCorrect = Array.isArray(correctAnswer)
      ? Array.isArray(userAnswer)
        ? correctAnswer.join(',') === userAnswer.join(',')
        : correctAnswer.includes(userAnswer)
      : userAnswer === correctAnswer || userAnswer === String(correctAnswer);

    const optionViews = (question.content?.options || []).map((opt: string, idx: number) => {
      const label = String.fromCharCode(65 + idx);
      const normalizedOpt = opt.replace(/^[A-Z]\.\s*/, '');
      const isCorrectOpt = Array.isArray(correctAnswer)
        ? correctAnswer.includes(label) || correctAnswer.includes(opt)
        : correctAnswer === label || correctAnswer === opt;
      const isUserSelected = Array.isArray(userAnswer)
        ? userAnswer.includes(label) || userAnswer.includes(opt)
        : userAnswer === label || userAnswer === opt;
      return {
        label,
        text: normalizedOpt,
        isCorrect: isCorrectOpt,
        userSelected: isUserSelected,
      };
    });

    const baseCorrect = question.correctCount ?? 0;
    const baseWrong = question.wrongCount ?? 0;
    const correctCount = baseCorrect + (isCorrect ? 1 : 0);
    const wrongCount = baseWrong + (!isCorrect ? 1 : 0);

    const knowledgePoints = (question.knowledgePoints || ['KP-01']).slice(0, 4).map((kp, idx) => {
      const palette = ['#7C3AED', '#6366F1', '#F59E0B', '#10B981', '#06B6D4', '#F97316'];
      return {
        id: kp,
        label: kp,
        color: palette[idx % palette.length],
      };
    });

    setResultPayload({
      question,
      status: isCorrect ? 'correct' : 'wrong',
      userAnswer,
      correctAnswer,
      options: optionViews,
      knowledgePoints,
      timeUsedSec: 36,
      attemptStats: {
        totalAttempts: Math.max(1, correctCount + wrongCount),
        correctCount,
        wrongCount,
        lastAttemptAt: '刚刚',
        lastCorrectAt: correctCount ? '今天' : '—',
        lastWrongAt: wrongCount ? '今天' : '—',
      },
    });
    setMistakeReasons(isCorrect ? [] : getMistakeReasons(question.id));

    setShowResultCard(true);
    setActiveQuizMode(prev => ({ ...prev, isOpen: false }));
  };

  // Mini audio player for card preview (single instance)
  const handlePlayPreview = (q: typeof mockQuestions[0]) => {
      const url = q.content?.audioUrl;
      if (!url) return;

      // If clicking same item, toggle play/pause
      if (playingId === q.id && audioRef.current) {
          if (audioRef.current.paused) {
              audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
          } else {
              audioRef.current.pause();
              setIsPlaying(false);
          }
          return;
      }

      // Switch to a new audio source
      if (!audioRef.current) {
          audioRef.current = new Audio();
      }
      const audio = audioRef.current;
      audio.pause();
      audio.src = url;
      audio.currentTime = 0;
      setPlayingId(q.id);
      setProgress(0);
      setDuration(0);
      setIsPlaying(false);

      const handleTimeUpdate = () => {
          setProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0);
          setDuration(audio.duration || 0);
      };
      const handleEnded = () => {
          setIsPlaying(false);
          setPlayingId(null);
          setProgress(0);
      };
      const handleLoaded = () => setDuration(audio.duration || 0);
      const handleError = () => {
          setIsPlaying(false);
          setPlayingId(null);
      };

      audio.onended = handleEnded;
      audio.ontimeupdate = handleTimeUpdate;
      audio.onloadedmetadata = handleLoaded;
      audio.onerror = handleError;

      audio.play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          setIsPlaying(false);
          setPlayingId(null);
        });
  };

  // 如果没有挂载或找不到目标，返回 null
  if (!mounted || !portalTarget) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
            {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            data-modal-backdrop="true"
            className="absolute inset-0 z-[980]"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            data-modal-surface="true"
            className="absolute inset-0 z-[990] flex flex-col pointer-events-none"
          >
            <div className="absolute inset-0 bg-slate-900 flex flex-col pointer-events-auto">
            {/* 1. Header Area */}
            <div className="relative pt-6 pb-4 px-6 bg-slate-900/50 shrink-0 z-20">
              <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6" />
              
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-black text-white leading-tight">{title}</h2>
                  <p className="text-xs font-bold text-white/40 mt-1 uppercase tracking-widest">
                    共 {filteredQuestions.length} 道精选题目
                  </p>
                </div>
                <button 
                  onClick={onClose}
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:bg-white/20 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Smart Filters (4 Parallel Dropdowns) */}
              <div className="grid grid-cols-4 gap-2">
                 {/* 1. Type Filter */}
                 <div className="relative">
                   <select 
                      value={activeType}
                      onChange={(e) => setActiveType(e.target.value as any)}
                      className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all"
                   >
                    <option value="all" className="bg-slate-800 text-white font-semibold">全部题型</option>
                      {isEnglish
                        ? ENGLISH_TYPE_GROUPS.flatMap(group => [
                            <option
                              key={`${group.label}-header`}
                              value=""
                              disabled
                              className="bg-slate-800 text-white/50 font-black"
                            >
                              {group.label}
                            </option>,
                            ...group.options.map(opt => (
                              <option key={opt.id} value={opt.id} className="bg-slate-800 text-white">
                                {opt.label}
                              </option>
                            ))
                          ])
                        : typeOptions.map(type => (
                            <option key={type.id} value={type.id} className="bg-slate-800 text-white">
                              {type.label}
                            </option>
                          ))
                      }
                   </select>
                   <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/30">
                      <ChevronRight size={12} className="rotate-90" />
                   </div>
                 </div>

                 {/* 2. Difficulty Filter */}
                 <div className="relative">
                   <select 
                      value={activeDifficulty}
                      onChange={(e) => setActiveDifficulty(e.target.value === 'all' ? 'all' : Number(e.target.value) as any)}
                      className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all"
                   >
                      {DIFFICULTY_LEVELS.map(diff => (
                        <option key={diff.id} value={diff.id} className="bg-slate-800 text-white">
                           {diff.label}
                        </option>
                      ))}
                   </select>
                   <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/30">
                      <ChevronRight size={12} className="rotate-90" />
                   </div>
                 </div>

                 {/* 3. Source Filter */}
                 <div className="relative">
                   <select 
                      value={activeSource}
                      onChange={(e) => setActiveSource(e.target.value as any)}
                      className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all"
                   >
                      {SOURCE_TYPES.map(src => (
                        <option key={src.id} value={src.id} className="bg-slate-800 text-white">
                           {src.label}
                        </option>
                      ))}
                   </select>
                   <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/30">
                      <ChevronRight size={12} className="rotate-90" />
                   </div>
                 </div>

                 {/* 4. Mastery Filter (New) */}
                 <div className="relative">
                   <select 
                      value={activeMastery}
                      onChange={(e) => setActiveMastery(e.target.value as any)}
                      className="w-full appearance-none bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-indigo-500/50 focus:bg-white/10 transition-all"
                   >
                      {MASTERY_FILTERS.map(m => (
                        <option key={m.id} value={m.id} className="bg-slate-800 text-white">
                           {m.label}
                        </option>
                      ))}
                   </select>
                   <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-white/30">
                      <ChevronRight size={12} className="rotate-90" />
                   </div>
                 </div>
              </div>
            </div>

            {/* 2. Scrollable Question List */}
            <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-3 no-scrollbar relative">
              {/* Fade at top */}
              <div className="sticky top-0 h-4 bg-gradient-to-b from-slate-900 to-transparent z-10 -mt-2 mb-2 pointer-events-none" />

              <AnimatePresence mode='popLayout'>
                {filteredQuestions.map((q, index) => (
                  <motion.div
                    layout
                    role="button"
                    tabIndex={0}
                    key={q.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => handleQuestionClick(q)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleQuestionClick(q);
                      }
                    }}
                    className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 flex gap-4 hover:bg-white/10 active:scale-[0.98] transition-all group text-left relative overflow-hidden cursor-pointer"
                  >
                    {/* Bookmark Toggle */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setBookmarkedIds(prev => {
                          const next = new Set(prev);
                          if (next.has(q.id)) next.delete(q.id);
                          else next.add(q.id);
                          return next;
                        });
                      }}
                      className="absolute top-4 right-4 z-10 p-1.5 rounded-full hover:bg-white/10 transition-colors"
                    >
                      <Star 
                        size={16} 
                        className={bookmarkedIds.has(q.id) 
                          ? "fill-amber-400 text-amber-400" 
                          : "text-white/10 group-hover:text-white/30 transition-colors"
                        } 
                      />
                    </button>

                    {/* Left: Status Ring (Cognitive State) */}
                    <div className="flex flex-col items-center gap-2 shrink-0 w-12 pt-1">
                       <StatusRing state={q.cognitiveState || 'GAP'} size={36} />
                    </div>

                    {/* Right: Content */}
                    <div className="flex-1 min-w-0">
                       {(() => {
                          const isReading = q.type === 'reading_comp';
                          const rawStem = q.content?.stem || '';
                          const needsClamp = isReading && rawStem.length > 140;
                          const stemPreview = needsClamp ? `${rawStem.slice(0, 140)}…` : rawStem;
                          return (
                            <>
                       <div className="flex items-center gap-2 mb-2">
                          {/* Index Number */}
                          <span className="text-[10px] font-black text-white/20 font-mono mr-1">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                              q.type === 'single_choice' ? 'bg-sky-500/20 text-sky-300 border-sky-500/30' :
                              'bg-white/10 text-white/50 border-white/10'
                          }`}>
                            {getQuestionTypeLabel(q.type)}
                          </span>

                          {/* Difficulty Badge */}
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-amber-500/30 bg-amber-500/10 text-amber-200/80">
                            {DIFFICULTY_BADGE[q.difficulty]}
                          </span>

                          {/* Category Badge */}
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-orange-500/30 bg-orange-500/10 text-orange-200/80">
                            {CATEGORY_BADGE[q.category]}
                          </span>

                          {/* State Label Badge */}
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                            STATE_STYLE_MAP[q.cognitiveState || 'GAP']
                          }`}>
                            {STATE_TEXT_MAP[q.cognitiveState || 'GAP']}
                          </span>
                       </div>
                       
                       <p className={`text-sm font-medium text-white/80 leading-relaxed font-serif mb-3 ${q.type === 'reading_comp' ? 'line-clamp-3' : 'line-clamp-2'}`}>
                         {stemPreview}
                       </p>

                       </>
                       );
                       })()}

                       {/* Mini audio bar (single active at a time) */}
                       {q.content?.audioUrl && (
                         <div className="flex items-center gap-3 text-[11px] text-slate-300 mb-3" onClick={(e) => e.stopPropagation()}>
                           <button
                             onClick={() => handlePlayPreview(q)}
                             className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white active:scale-95 transition"
                           >
                             {playingId === q.id && isPlaying ? <Pause size={14} /> : <Play size={14} className="translate-x-[0.5px]" />}
                           </button>
                           <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                             <div
                               className="h-full bg-[#0A84FF]"
                               style={{ width: `${playingId === q.id ? progress : 0}%` }}
                             />
                           </div>
                           <div className="font-mono text-[11px] min-w-[72px] text-right">
                             {playingId === q.id && duration
                               ? `${Math.floor((duration * (progress / 100)) / 60).toString().padStart(2, '0')}:${Math.floor((duration * (progress / 100)) % 60).toString().padStart(2, '0')}`
                               : '00:00'}
                             {' / '}
                             {duration ? `${Math.floor(duration / 60).toString().padStart(2, '0')}:${Math.floor(duration % 60).toString().padStart(2, '0')}` : '--:--'}
                           </div>
                         </div>
                       )}

                       {/* Sub-questions preview */}
                       {q.content?.subQuestions && q.content.subQuestions.length > 0 && (
                          <div className="space-y-1 text-[12px] text-white/70">
                              <div className="flex items-center gap-2 text-white/50 font-semibold text-[11px]">
                                  <ChevronDown size={12} />
                                  <span>小题预览（{q.content.subQuestions.length} 题）</span>
                              </div>
                              {q.content.subQuestions.slice(0, 2).map((sq, idx) => {
                                  const isReading = q.type === 'reading_comp';
                                  const showOptions = Array.isArray(sq.options) && sq.options.length > 0;
                                  return (
                                      <div key={idx} className="bg-white/5 border border-white/5 rounded-xl p-3 space-y-2">
                                          <div className="text-[12px] font-semibold text-white/80 line-clamp-2">
                                              {idx + 1}. {sq.question}
                                          </div>
                                          {showOptions && (
                                              <div className={`text-[11px] text-white/70 ${isReading ? 'space-y-1' : 'space-x-2'}`}>
                                                  {sq.options.slice(0, 4).map((opt, oidx) => (
                                                      <div key={oidx} className={isReading ? 'leading-snug' : 'inline-block'}>
                                                          {isReading ? `${String.fromCharCode(65 + oidx)}. ${opt}` : opt}
                                                      </div>
                                                  ))}
                                              </div>
                                          )}
                                      </div>
                                  );
                              })}
                              {q.content.subQuestions.length > 2 && (
                                  <div className="text-[11px] text-indigo-200/80 font-semibold">
                                      ... 共 {q.content.subQuestions.length} 小题
                                  </div>
                              )}
                          </div>
                       )}

                       <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-[10px] text-indigo-200/40">
                             {q.knowledgePoints?.map(kp => (
                               <span key={kp}>#{kp}</span>
                             ))}
                          </div>
                          
                          {/* Simplified Action Arrow */}
                          <ChevronRight size={14} className="text-white/10 group-hover:text-white/40 transition-colors" />
                       </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {filteredQuestions.length === 0 && (
                <div className="py-12 flex flex-col items-center justify-center text-white/30">
                   <Filter size={48} className="mb-4 opacity-50" />
                   <p className="text-sm font-bold">没有找到符合条件的题目</p>
                   <button 
                     onClick={() => { setActiveType('all'); setActiveDifficulty('all'); setActiveSource('all'); setActiveMastery('all'); }}
                     className="mt-4 text-xs font-bold text-indigo-400 hover:underline"
                   >
                     清除筛选条件
                   </button>
                </div>
              )}
              
              {/* Bottom Spacer for safe area */}
              <div className="h-8" />
            </div>
            
            {/* 3. Floating Action Bar (Optional: "Practice a random set") */}
            <div className="absolute bottom-6 left-6 right-6">
                
            </div>
            </div>
          </motion.div>

          {/* New Preview Modal */}
          <QuestionPreviewModal 
            isOpen={!!previewQuestion}
            question={previewQuestion}
            onClose={() => setPreviewQuestion(null)}
            onStartChallenge={handleStartChallenge}
            onViewAnalysis={handleViewAnalysis}
          />

          {/* Universal Quiz View Overlay (Main Quiz Interface) */}
          <AnimatePresence>
            {activeQuizMode.isOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute inset-0 z-[70] bg-white"
              >
                 <UniversalQuizView 
                    mode={activeQuizMode.mode}
                    questions={quizQuestions}
                    initialQuestionIndex={activeQuizMode.questionId 
                        ? Math.max(0, quizQuestions.findIndex(q => q.id === activeQuizMode.questionId))
                        : 0
                    }
                    onClose={() => setActiveQuizMode(prev => ({ ...prev, isOpen: false }))}
                    onSubmit={handleQuizSubmit}
                    themeColor="indigo"
                    singleQuestionMode={activeQuizMode.singleQuestionMode}
                 />
              </motion.div>
            )}
          </AnimatePresence>

          {/* 结果卡弹层 */}
          {showResultCard && resultPayload && (
            <SingleQuestionResultCard
              subject={resultPayload.question.subject}
              questionId={resultPayload.question.id}
              questionType={resultPayload.question.type}
              difficulty={resultPayload.question.difficulty}
              stem={resultPayload.question.content?.stem || ''}
              options={resultPayload.options}
              userAnswerPreview={
                Array.isArray(resultPayload.userAnswer)
                  ? resultPayload.userAnswer.join(', ')
                  : String(resultPayload.userAnswer ?? '')
              }
              correctAnswerPreview={
                Array.isArray(resultPayload.correctAnswer)
                  ? resultPayload.correctAnswer.join(', ')
                  : String(resultPayload.correctAnswer ?? '')
              }
              explanationText={resultPayload.question.result?.explanation}
              explanationPitfalls={resultPayload.question.result?.detail ? [resultPayload.question.result.detail] : []}
              mediaList={resultPayload.question.content?.audioUrl ? [{ type: 'audio', duration: 90 }] : []}
              knowledgePoints={resultPayload.knowledgePoints}
              status={resultPayload.status}
              timeUsedSec={resultPayload.timeUsedSec}
              attemptStats={resultPayload.attemptStats}
              showMistakeTags={resultPayload.status === 'wrong'}
              selectedMistakeReasons={mistakeReasons}
              onMistakeReasonSelect={(reasons) => {
                recordMistakeReasons(resultPayload.question.id, reasons);
                setMistakeReasons(reasons);
              }}
              onRetry={() => {
                setShowResultCard(false);
                setResultPayload(null);
                setMistakeReasons([]);
                setActiveQuizMode(prev => ({ ...prev, isOpen: true }));
              }}
              onNext={() => {
                setShowResultCard(false);
                setResultPayload(null);
                setActiveQuizMode(prev => ({ ...prev, isOpen: false }));
              }}
              onClose={() => {
                setShowResultCard(false);
                setResultPayload(null);
                setActiveQuizMode(prev => ({ ...prev, isOpen: false }));
              }}
            />
          )}
        </>
      )}
    </AnimatePresence>,
    portalTarget
  );
};
