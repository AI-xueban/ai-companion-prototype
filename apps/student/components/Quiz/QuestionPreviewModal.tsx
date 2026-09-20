import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, Star, ChevronDown, ChevronUp, Sparkles, Bot, Zap, ArrowRight, Bookmark, BookOpen, Lightbulb } from 'lucide-react';
import { UniversalQuizQuestion } from './UniversalQuizView';
import { getQuestionTypeLabel, DifficultyLevel, QuestionCategory, allQuestions as mockQuestions, QuestionItem } from '../../data/questionBank';
import { StatusRing, CognitiveState } from './StatusRing';
import { MistakeSocialContent } from '../MistakeVault/Social/MistakeSocialContent';
import { MOCK_INSIGHT_TAGS, MOCK_PEER_INSIGHTS, PeerInsight, InsightTag } from '../MistakeVault/Social/types';
import { QuestionBadges, DIFFICULTY_BADGE, getDifficultyColor } from './components/QuestionBadges';
import { MistakePreviewResultCard } from './MistakePreviewResultCard';
import { QuestionRichContent } from './components/QuestionRichContent';

interface QuestionPreviewModalProps {
    isOpen: boolean;
    question: UniversalQuizQuestion | null;
    onClose: () => void;
    onStartChallenge: (question: UniversalQuizQuestion) => void;
    onViewAnalysis: (question: UniversalQuizQuestion) => void;
    onStartDrill?: (question: UniversalQuizQuestion) => void;
    source?: 'mistake' | 'bank';
}

// 映射掌握程度的 AI 解释文案
const getAiCognitiveReason = (state: CognitiveState): string => {
    switch (state) {
        case 'GAP': return '上次练习出现概念混淆，建议重点攻克。';
        case 'MASTERED': return '已连续 5 次正确，完全掌握该知识点。';
        case 'FADED': return '距离上次复习已过 7 天，建议激活记忆。';
        default: return 'AI 正在分析你的知识图谱...';
    }
};

export const QuestionPreviewModal: React.FC<QuestionPreviewModalProps> = ({
    isOpen,
    question,
    onClose,
    onStartChallenge,
    onViewAnalysis,
    onStartDrill,
    source = 'bank'
}) => {

    const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
    const [activeFunctionTab, setActiveFunctionTab] = useState<'none' | 'similar' | 'spark'>('none');
    const [isBookmarked, setIsBookmarked] = useState(false);
    
    // Similar questions state
    const [similarQuestions, setSimilarQuestions] = useState<QuestionItem[]>([]);
    
    // Spark data state
    const [sparkInsights, setSparkInsights] = useState<PeerInsight[]>(MOCK_PEER_INSIGHTS);
    const [sparkTags, setSparkTags] = useState<InsightTag[]>(MOCK_INSIGHT_TAGS);
  const [isSparkShareOpen, setIsSparkShareOpen] = useState(false);
  const [sparkShareText, setSparkShareText] = useState('');
  const [sparkShareTags, setSparkShareTags] = useState<string[]>([]);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

    // Reset state when question changes
    useEffect(() => {
        if (isOpen) {
            setIsAnalysisOpen(false);
            setActiveFunctionTab('none');
            setIsBookmarked(question?.bookmarked || false);
            // Reset spark data if needed or keep mock
            setSparkTags(MOCK_INSIGHT_TAGS);
            setSparkInsights(MOCK_PEER_INSIGHTS);
            
            if (question) {
                const recommended = mockQuestions
                    .filter(q => q.id !== question.id) // 排除当前题
                    .slice(0, 3); // 简单取前 3 个
                setSimilarQuestions(recommended);
            } else {
                setSimilarQuestions([]);
            }
        }
    }, [isOpen, question]);
    
    // Similar question click handler
    const handleSimilarQuestionClick = (q: QuestionItem) => {
        onClose();
        console.log('Selected similar question:', q.id);
    };


    // Spark handlers
    const handleTagToggle = (id: string) => {
        setSparkTags(prev => prev.map(tag => 
            tag.id === id ? { ...tag, isSelected: !tag.isSelected } : tag
        ));
    };

    const handleSparkLike = (id: string) => {
        setSparkInsights(prev => prev.map(item => {
            if (item.id === id) {
                return {
                    ...item,
                    isLiked: !item.isLiked,
                    likes: item.isLiked ? item.likes - 1 : item.likes + 1
                };
            }
            return item;
        }));
    };

  const handleSparkDislike = (id: string) => {
    setSparkInsights(prev => prev.map(item => {
      if (item.id !== id) return item;
      const wasDisliked = !!item.isDisliked;
      const wasLiked = !!item.isLiked;
      return {
        ...item,
        isDisliked: !wasDisliked,
        isLiked: wasDisliked ? item.isLiked : false,
        likes: wasDisliked ? item.likes : wasLiked ? Math.max(0, item.likes - 1) : item.likes
      };
    }));
  };

  const openSparkShare = () => {
    setActiveFunctionTab('spark');
    setIsSparkShareOpen(true);
    const preset = sparkTags.filter(t => t.isSelected).map(t => t.label);
    setSparkShareTags(preset);
  };

  const toggleSparkShareTag = (label: string) => {
    setSparkShareTags(prev => prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]);
  };

  const handleSparkShareSubmit = () => {
    const content = sparkShareText.trim();
    if (!content) return;
    const newInsight: PeerInsight = {
      id: `local-${Date.now()}`,
      authorName: '我',
      authorAvatarColor: 'bg-gradient-to-tr from-blue-500 to-indigo-600',
      content,
      likes: 0,
      isLiked: false,
      tags: sparkShareTags,
      timeAgo: '刚刚'
    };
    setSparkInsights(prev => [newInsight, ...prev]);
    setSparkShareText('');
    setSparkShareTags([]);
    setIsSparkShareOpen(false);
  };

  // 保证所有 Hook 每次渲染都会执行，避免 Hook 顺序变化
  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  useEffect(() => {
    setPortalTarget(document.getElementById('app-viewport'));
  }, []);

  // 如果没有题目且没有在动画中，可以不渲染内容，但 AnimatePresence 需要保持挂载
  const cognitiveState = question?.cognitiveState || 'GAP';

  const modalContent = (
    <AnimatePresence>
      {isOpen && question && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md z-[1100]"
          />

          {/* Bottom Sheet Card - Full Width Style */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute inset-0 z-[1101] flex flex-col justify-end pointer-events-none"
          >
            {/* 模拟 iOS Modal 顶部指示条 (Outside) */}
            <div className="w-full flex justify-center pb-2 pointer-events-auto" onClick={onClose}>
              <div className="w-12 h-1.5 bg-white/30 rounded-full backdrop-blur-sm" />
            </div>

            {/* Main Container - Full Width */}
            <div className="w-full bg-white/90 backdrop-blur-xl rounded-t-[32px] shadow-[0_-20px_60px_rgba(0,0,0,0.2)] flex flex-col max-h-[85vh] pointer-events-auto pb-safe overflow-hidden border-t border-white/50">

              {/* 3.3.1 顶部导航栏 (Header) */}
              <div className="px-6 py-4 flex justify-between items-center border-b border-black/5">
                {/* 左侧：标签行 */}
                <QuestionBadges
                  typeLabel={getQuestionTypeLabel(question.type as any)}
                  difficulty={question.difficulty || 1}
                  category={question.category}
                  knowledgePoints={question.knowledgePoints}
                />

                {/* 右侧：操作区 */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsBookmarked(!isBookmarked)}
                    className="p-2 rounded-full hover:bg-black/5 transition-colors active:scale-90"
                  >
                    <Star
                      size={20}
                      className={isBookmarked ? "fill-amber-400 text-amber-400" : "text-slate-400"}
                    />
                  </button>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-black/5 transition-colors active:scale-90"
                  >
                    <X size={20} className="text-slate-400" />
                  </button>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto min-h-0 relative">
                <div className="p-6 space-y-6 max-w-5xl mx-auto w-full">
                  {source === 'mistake' ? (
                    <MistakePreviewResultCard
                      question={question}
                      practiceStats={{ correct: 1, wrong: 0 }}
                    />
                  ) : (
                    <>
                  {/* 3.3.2 掌握程度 (Cognitive Status) */}
                  <div className="flex items-center gap-4 bg-gradient-to-r from-slate-50 to-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="shrink-0">
                      <StatusRing state={cognitiveState} size={48} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-black text-slate-800">掌握程度评估</h4>
                        <span className="text-[10px] px-1.5 py-0.5 bg-slate-900 text-white rounded font-bold">AI Insight</span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        {getAiCognitiveReason(cognitiveState)}
                      </p>
                    </div>
                  </div>

                  {/* 3.3.2 题目内容展示 */}
                  <QuestionRichContent question={question} />

                  {/* 3.3.2 查看解析 (Analysis Accordion) */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                    <button
                      onClick={() => setIsAnalysisOpen(!isAnalysisOpen)}
                      className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between group"
                    >
                      <span className="text-xs font-bold text-slate-500 flex items-center gap-2">
                        <BookOpen size={14} />
                        查看解析与答案
                      </span>
                      <ChevronDown
                        size={16}
                        className={`text-slate-400 transition-transform duration-300 ${isAnalysisOpen ? 'rotate-180' : ''}`}
                      />
                    </button>
                    <AnimatePresence>
                      {isAnalysisOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 border-t border-slate-100 bg-white">
                            {question.content?.subQuestions && question.content.subQuestions.length > 0 ? (
                              <div className="space-y-3">
                                <div className="mb-2">
                                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded mr-2">
                                    答案与解析
                                  </span>
                                  <div className="font-mono font-bold text-slate-800 text-[13px] leading-relaxed mt-1">
                                    {(question.result?.correctAnswer && Array.isArray(question.result.correctAnswer))
                                      ? question.result.correctAnswer.map((a, idx) => `${idx + 1}:${a}`).join('    ')
                                      : question.content.subQuestions
                                        .map((sq, idx) => `${idx + 1}:${sq.answer || '-'}`)
                                        .join('    ')
                                    }
                                  </div>
                                </div>
                                <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                                  {question.result?.explanation || '暂无解析'}
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="mb-2">
                                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded mr-2">
                                    正确答案
                                  </span>
                                  <span className="font-mono font-bold text-slate-800">
                                    {Array.isArray(question.result?.correctAnswer)
                                      ? question.result?.correctAnswer.join(', ')
                                      : question.result?.correctAnswer}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-600 leading-relaxed">
                                  {question.result?.explanation || "暂无详细解析"}
                                </p>
                              </>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* 3.3.3 功能区 (Expanded Features) */}
                  <div className="pt-2">
                    <div className="flex items-center gap-6 border-b border-slate-100 pb-2 mb-4">
                      <button
                        onClick={() => setActiveFunctionTab(activeFunctionTab === 'similar' ? 'none' : 'similar')}
                        className={`text-xs font-bold pb-2 -mb-2.5 transition-colors border-b-2 ${activeFunctionTab === 'similar'
                            ? 'text-indigo-600 border-indigo-600'
                            : 'text-slate-400 border-transparent hover:text-slate-600'
                          }`}
                      >
                        相似题推荐
                      </button>
                      <button
                        onClick={() => setActiveFunctionTab(activeFunctionTab === 'spark' ? 'none' : 'spark')}
                        className={`text-xs font-bold pb-2 -mb-2.5 transition-colors border-b-2 flex items-center gap-1 ${activeFunctionTab === 'spark'
                            ? 'text-amber-500 border-amber-500'
                            : 'text-slate-400 border-transparent hover:text-slate-600'
                          }`}
                      >
                        <Sparkles size={12} />
                        思维火花
                      </button>
                    </div>

                    <AnimatePresence mode="wait">
                      {activeFunctionTab === 'similar' && (
                        <motion.div
                          key="similar"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="space-y-3"
                        >
                          {similarQuestions.length > 0 ? (
                            similarQuestions.map((q) => (
                              <button
                                key={q.id}
                                onClick={() => handleSimilarQuestionClick(q)}
                                className="w-full text-left bg-white rounded-xl p-4 border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all active:scale-[0.98] group"
                              >
                                {/* 卡片顶部：难度 + 题型标签 */}
                                <div className="flex items-center gap-2 mb-2">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getDifficultyColor(q.difficulty)}`}>
                                    {DIFFICULTY_BADGE[q.difficulty]}
                                  </span>
                                  <span className="px-2 py-0.5 rounded bg-slate-50 text-slate-500 text-[10px] font-bold">
                                    {getQuestionTypeLabel(q.type)}
                                  </span>
                                </div>

                                {/* 题干预览（截断） */}
                                <p className="text-sm text-slate-700 line-clamp-2 mb-2 font-medium">
                                  {q.content.stem}
                                </p>

                                {/* 底部：知识点 + 箭头 */}
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] text-indigo-600 font-medium">
                                    {q.knowledgePoints[0] || '数学'}
                                  </span>
                                  <ArrowRight size={14} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                                </div>
                              </button>
                            ))
                          ) : (
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                              <p className="text-xs text-slate-400 text-center py-2">
                                暂无相似题数据
                              </p>
                            </div>
                          )}
                        </motion.div>
                      )}
                      {activeFunctionTab === 'spark' && (
                        <motion.div
                          key="spark"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                        >
                          <div className="bg-amber-50/50 rounded-xl p-4 border border-amber-100 mb-3">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="p-1.5 bg-amber-100 text-amber-600 rounded-lg">
                                <Lightbulb size={14} />
                              </div>
                              <div className="text-xs font-bold text-amber-900">
                                思维火花
                                <span className="ml-2 font-normal text-amber-700/60">({sparkInsights.length + 9}条讨论)</span>
                              </div>
                            </div>

                            <MistakeSocialContent
                              tags={sparkTags}
                              insights={sparkInsights}
                              onTagToggle={handleTagToggle}
                              onLike={handleSparkLike}
                              onDislike={handleSparkDislike}
                              onShare={openSparkShare}
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Bottom Spacer */}
                  <div className="h-4" />
                  </>
                )}
              </div>
            </div>

              {/* 3.3.4 底部行动区 (Footer) */}
              <div className="p-6 pt-4 border-t border-slate-100 bg-white/50 backdrop-blur-md">
                <div className="max-w-5xl mx-auto w-full flex items-center gap-4">

                  <button
                    onClick={() => onStartChallenge(question)}
                    className="flex-[1.2] h-14 rounded-2xl border-2 border-indigo-600 bg-white text-indigo-600 font-bold text-sm flex items-center justify-center gap-2 hover:bg-indigo-50 transition-all active:scale-[0.98]"
                  >
                    <Play size={18} />
                    <span>复习</span>
                  </button>

                  <button
                    onClick={() => onStartDrill?.(question)}
                    className="flex-[2] h-14 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-black text-lg shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98] hover:shadow-xl hover:shadow-amber-500/40"
                  >
                    <Sparkles size={22} className="text-white animate-pulse" />
                    <span>举一反三</span>
                  </button>
                </div>
              </div>

            </div>
          </motion.div>

          {/* Spark share drawer */}
          <AnimatePresence>
            {isSparkShareOpen && (
              <motion.div
                className="absolute inset-0 z-[1110] flex flex-col justify-end pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div
                  className="absolute inset-0 bg-black/30 pointer-events-auto"
                  onClick={() => setIsSparkShareOpen(false)}
                />
                <motion.div
                  initial={{ y: 320 }}
                  animate={{ y: 0 }}
                  exit={{ y: 320 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                  className="relative pointer-events-auto bg-white/90 backdrop-blur-xl rounded-t-[32px] shadow-[0_-20px_60px_rgba(0,0,0,0.2)] p-4 space-y-4 max-h-[70vh]"
                >
                  <div className="h-1.5 w-12 bg-gray-300 rounded-full mx-auto mb-2" />
                  <div className="text-sm font-bold text-gray-800">分享我的见解</div>
                  <textarea
                    value={sparkShareText}
                    onChange={e => setSparkShareText(e.target.value)}
                    className="w-full h-28 rounded-2xl bg-white/80 border border-white/60 focus:border-blue-200 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-400"
                    placeholder="写下你踩坑的要点或提醒（最少一句）"
                  />
                  <div className="flex flex-wrap gap-2">
                    {sparkTags.map(tag => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => toggleSparkShareTag(tag.label)}
                        className={`px-3 py-1 rounded-full text-xs font-bold border ${sparkShareTags.includes(tag.label)
                            ? 'bg-blue-50 text-blue-600 border-blue-100'
                            : 'bg-white/70 text-gray-500 border-gray-100'
                          } active:scale-95 transition`}
                      >
                        #{tag.label}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={handleSparkShareSubmit}
                    disabled={!sparkShareText.trim()}
                    className="w-full h-12 rounded-2xl bg-blue-500 text-white text-sm font-bold active:scale-98 disabled:opacity-50"
                  >
                    发布见解
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );

  return portalTarget ? createPortal(modalContent, portalTarget) : modalContent;
};
