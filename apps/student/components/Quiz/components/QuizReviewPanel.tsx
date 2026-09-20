import React, { useMemo, useState } from 'react';
import { Lightbulb, FileText, Bot, PlayCircle, ChevronRight } from 'lucide-react';
import { UniversalQuizQuestion } from '../UniversalQuizView';
import { allQuestions, QuestionItem } from '../../../data/questionBank';
import { QuestionFeedbackEntry } from './QuestionFeedbackEntry';
import { QuestionFeedbackScene } from '../../../types/questionFeedback';
import { MistakeReasonPicker } from './MistakeReasonPicker';
import { MistakeReasonKey } from '../../../data/mistakeReasons';

type ReviewTab = 'analysis' | 'similar' | 'ai';

interface QuizReviewPanelProps {
  question: UniversalQuizQuestion;
  userAnswer?: string | string[];
  isCorrect: boolean;
  feedbackScene?: QuestionFeedbackScene;
  showMistakeReason?: boolean;
  selectedMistakeReasons?: MistakeReasonKey[];
  onMistakeReasonSelect?: (reasons: MistakeReasonKey[]) => void;
  onStartSimilarPractice?: (question: UniversalQuizQuestion) => void;
}

export const QuizReviewPanel: React.FC<QuizReviewPanelProps> = ({
  question,
  userAnswer,
  isCorrect,
  feedbackScene = 'review',
  showMistakeReason = false,
  selectedMistakeReasons = [],
  onMistakeReasonSelect,
  onStartSimilarPractice,
}) => {
  const [activeTab, setActiveTab] = useState<ReviewTab>('analysis');

  const similarQuestions = useMemo(() => {
    const pool = allQuestions.filter((q) => q.id !== question.id && q.subject === question.subject);
    return pool.slice(0, 4);
  }, [question.id, question.subject]);

  const formatAnswer = (val: unknown) => {
    if (Array.isArray(val)) return val.map(String).join(', ');
    return String(val ?? '—');
  };

  const tabs: { id: ReviewTab; label: string; icon: React.ReactNode; accent?: boolean }[] = [
    { id: 'analysis', label: '解析', icon: <FileText size={14} /> },
    { id: 'similar', label: '相似题', icon: <FileText size={14} /> },
    { id: 'ai', label: 'AI 1对1解答', icon: <Bot size={14} />, accent: true },
  ];

  const toUniversalQuestion = (q: QuestionItem): UniversalQuizQuestion => ({
    id: q.id,
    type: q.type,
    content: {
      stem: q.content.stem,
      options: q.content.options,
      audioUrl: q.content.audioUrl,
      transcript: q.content.transcript,
      examRules: q.content.examRules,
      subQuestions: q.content.subQuestions,
    },
    result: q.result,
    tags: q.tags,
    difficulty: q.difficulty,
    category: q.category,
    knowledgePoints: q.knowledgePoints,
    subject: q.subject,
  });

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="flex items-center gap-2 flex-wrap">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition ${
              activeTab === tab.id
                ? tab.accent
                  ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white border-transparent shadow-md'
                  : 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-200'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pb-4">
        {activeTab === 'analysis' && (
          <>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
              <div className="grid grid-cols-1 gap-3 text-sm">
                <div>
                  <div className="text-xs font-bold text-slate-400 mb-1">你的答案</div>
                  <div className={`font-semibold ${isCorrect ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {formatAnswer(userAnswer)} · {isCorrect ? '正确' : '错误'}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-400 mb-1">参考答案</div>
                  <div className="font-semibold text-slate-800">
                    {formatAnswer(question.result?.correctAnswer)}
                  </div>
                </div>
              </div>
              {showMistakeReason && !isCorrect && onMistakeReasonSelect ? (
                <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
                  <MistakeReasonPicker
                    selectedReasons={selectedMistakeReasons}
                    onSelect={onMistakeReasonSelect}
                    className="min-w-0 flex-1"
                  />
                  <QuestionFeedbackEntry
                    question={question}
                    userAnswer={userAnswer}
                    isCorrect={isCorrect}
                    scene={feedbackScene}
                    className="shrink-0"
                  />
                </div>
              ) : (
                <QuestionFeedbackEntry
                  question={question}
                  userAnswer={userAnswer}
                  isCorrect={isCorrect}
                  scene={feedbackScene}
                  className="pt-2 border-t border-slate-100"
                />
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
              <div className="px-4 py-3 text-xs font-bold text-slate-500 border-b border-slate-100">原题讲解视频</div>
              <button
                type="button"
                className="w-full aspect-video bg-slate-900/90 flex items-center justify-center text-white relative"
              >
                <PlayCircle size={48} className="opacity-90" />
                <span className="absolute bottom-3 left-3 text-xs font-semibold text-white/80">点击播放</span>
              </button>
            </div>

            <div className="rounded-2xl border border-sky-100 bg-sky-50/70 p-4">
              <div className="text-xs font-bold text-sky-800 mb-2 flex items-center gap-1">
                <Lightbulb size={14} />
                本题解析
              </div>
              <p className="text-sm text-sky-900 leading-relaxed whitespace-pre-wrap">
                {question.result?.explanation || '暂无解析内容'}
              </p>
            </div>

            {question.knowledgePoints && question.knowledgePoints.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2">
                <div className="text-xs font-bold text-slate-500">关联知识点</div>
                <div className="flex flex-wrap gap-2">
                  {question.knowledgePoints.map((kp) => (
                    <span
                      key={kp}
                      className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100"
                    >
                      {kp}
                    </span>
                  ))}
                </div>
                <div className="text-xs text-slate-500 font-semibold">健康分 65</div>
              </div>
            )}

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs font-black text-emerald-700 mb-1">掌握度评估</div>
                <div className="text-xs text-emerald-800/80">连续答对可提升该知识点掌握状态</div>
              </div>
              <div className="w-12 h-12 rounded-full border-4 border-emerald-400 flex items-center justify-center text-sm font-black text-emerald-700">
                6
              </div>
            </div>

          </>
        )}

        {activeTab === 'similar' && (
          <div className="space-y-3">
            {similarQuestions.map((sq) => (
              <button
                key={sq.id}
                type="button"
                onClick={() => onStartSimilarPractice?.(toUniversalQuestion(sq))}
                className="w-full text-left rounded-2xl border border-slate-200 bg-white p-4 hover:border-indigo-200 hover:shadow-sm transition flex items-start gap-3"
              >
                <p className="flex-1 text-sm text-slate-700 line-clamp-2">{sq.content.stem}</p>
                <ChevronRight size={16} className="shrink-0 text-slate-300 mt-1" />
              </button>
            ))}
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-sky-50 to-indigo-50 p-5 space-y-3">
            <div className="flex items-center gap-2 text-indigo-700 font-black text-sm">
              <Bot size={18} />
              AI 1对1 解答
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              针对本题步骤、思路卡点进行一对一讲解。后续可接入小晤对话面板。
            </p>
            <button
              type="button"
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-black shadow-md"
            >
              开始提问
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
