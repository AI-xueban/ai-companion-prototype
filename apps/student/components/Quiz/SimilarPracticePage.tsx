import React, { useId, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, ChevronLeft, Sparkles } from 'lucide-react';
import { UniversalQuizView, normalizeQuizSubmitPayload, normalizeQuestionAnswer, type UniversalQuizQuestion } from './UniversalQuizView';
import { QuestionRichContent } from './components/QuestionRichContent';
import type { QuestionItem } from '../../data/questionBank';
import { recommendSimilarQuestions, type RelativeDifficulty } from '../../services/similarPracticeService';
import { getPortalRoot } from '../../utils/portal';
import { recordSimilarAttempt } from '../../utils/similarQuestionAttempts';
import { isBlankMatch, resolveQuestionCorrectness } from '../../utils/manualGrade';

import { grantQuizSessionReward, grantVariantCorrectionReward, mergeRewardResults } from '../../services/rewardService';
import { useRewardGranted } from '../Rewards/RewardGrantContext';
import { UniversalQuizResult, enrichQuizResultWithPracticeStates, type QuizSessionResult } from './UniversalQuizResult';

import { AITutorLayer } from '../Dashboard/AITutorLayer';
import { QuizStem } from './components/QuizStem';
import { XkwHtmlStem } from './components/XkwHtmlStem';

const levels: { value: RelativeDifficulty; label: string; note: string }[] = [
  { value: 'easier', label: '简单一点', note: '先巩固基础' },
  { value: 'same', label: '难度相当', note: '再练同类题' },
  { value: 'harder', label: '更难一点', note: '挑战进阶题' },
];

function QuestionStemPreview({ question }: { question: UniversalQuizQuestion }) {
  const images = question.content.stemImages?.length ? question.content.stemImages
    : question.content.originalImageUrl ? [question.content.originalImageUrl] : undefined;
  return <div inert className="pointer-events-none max-h-[72px] overflow-hidden text-sm leading-6 text-slate-800 [&_img]:max-h-[72px] [&_img]:object-contain [&_p]:my-0">
    <div className="line-clamp-3">{question.content.htmlStem
      ? <XkwHtmlStem html={question.content.htmlStem} />
      : <QuizStem content={question.content.stem || ''} images={images} />}</div>
  </div>;
}

export function SimilarPracticePage({ source, onClose }: { source: UniversalQuizQuestion; onClose: () => void }) {
  const onRewardGranted = useRewardGranted();
  const [sessionResult, setSessionResult] = useState<QuizSessionResult | null>(null);
  const [level, setLevel] = useState<RelativeDifficulty>('same');
  const [selected, setSelected] = useState<QuestionItem | null>(null);
  const [tutorOpen, setTutorOpen] = useState(false);
  const [attemptVersion, setAttemptVersion] = useState(0);
  const difficultyGroupId = useId();
  const recommendationsByLevel = useMemo(() => ({
    easier: recommendSimilarQuestions(source, 'easier'),
    same: recommendSimilarQuestions(source, 'same'),
    harder: recommendSimilarQuestions(source, 'harder'),
  }), [source]);
  const recommendations = recommendationsByLevel[level];
  const root = getPortalRoot();
  const returnToList = () => { setTutorOpen(false); setSelected(null); setSessionResult(null); setAttemptVersion((value) => value + 1); };
  if (!root) return null;
  if (tutorOpen && selected) return createPortal(
    <section className="absolute inset-0 z-[950] bg-white" aria-label="变式题1对1讲题">
      <AITutorLayer onClose={() => setTutorOpen(false)} question={{
        id: selected.id, number: '1', text: selected.content.stem,
        subject: ({ math: '数学', chinese: '语文', english: '英语' } as Record<string, string>)[selected.subject] ?? selected.subject,
        imageSrc: selected.content.originalImageUrl ?? selected.content.stemImages?.[0],
      }} problemContent={<QuestionRichContent question={selected} showAudioPlayer={false} />} />
    </section>, root,
  );

  return createPortal(
    <section className="absolute inset-0 z-[950] bg-slate-50 flex flex-col overflow-hidden" aria-label="举一反三练习页面">
      <div className="w-full h-full min-h-0 flex flex-col">
        <header className="shrink-0 bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button type="button" onClick={selected ? returnToList : onClose} aria-label={selected ? '返回推荐题' : '返回来源页面'} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition hover:bg-slate-200"><ChevronLeft size={22} /></button>
            <h2 className="shrink-0 font-black text-lg text-slate-900 flex items-center gap-2"><Sparkles size={20} className="text-indigo-600" />举一反三</h2>
          </div>
          <p className="text-sm text-slate-500">学会一道题，解决一类题</p>
        </header>
        {!selected ? (
          <div className="flex-1 min-h-0 overflow-y-auto p-6" data-attempt-version={attemptVersion}>
            <div className="mx-auto w-full max-w-4xl space-y-4">
              <div className="space-y-3">
                <h3 className="text-sm font-black text-slate-800">原题</h3>
                <article role="button" tabIndex={0} aria-label="查看原题，返回上一页面" onClick={onClose} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onClose(); } }} className="flex cursor-pointer items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-indigo-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
                  <div className="min-w-0 flex-1"><QuestionStemPreview question={source} /></div><ArrowRight size={16} className="shrink-0 text-indigo-500" />
                </article>
              </div>
              <div className="min-w-0 space-y-4">
                <div className="space-y-2.5">
                  <div className="flex items-center gap-3">
                    <h3 className="shrink-0 text-sm font-black text-slate-800">推荐练习</h3>
                    <div role="radiogroup" aria-label="选择练习难度" className="ml-auto grid min-w-0 flex-1 max-w-md grid-cols-3 gap-2 border-b border-slate-200">
                      {levels.map((option) => {
                        return <label key={option.value} className="relative cursor-pointer">
                          <input type="radio" name={difficultyGroupId} value={option.value} checked={level === option.value} onChange={() => setLevel(option.value)} aria-label={option.label} className="peer sr-only" />
                          <span className="relative flex min-h-11 items-center justify-center rounded-t-lg px-3 py-3 text-sm font-semibold text-slate-500 transition hover:bg-indigo-50/60 hover:text-indigo-600 peer-checked:text-indigo-600 after:absolute after:bottom-0 after:left-1/2 after:h-0.5 after:w-6 after:-translate-x-1/2 after:rounded-full after:bg-transparent peer-checked:after:bg-indigo-600 peer-focus-visible:ring-2 peer-focus-visible:ring-inset peer-focus-visible:ring-indigo-500">
                            {option.label}
                          </span>
                        </label>;
                      })}
                    </div>
                  </div>
                </div>
                                {recommendations.length === 0 ? <div className="flex items-start gap-3 bg-white border border-slate-200 rounded-2xl px-5 py-5"><Sparkles size={22} className="shrink-0 mt-0.5 text-indigo-400" /><div><p className="text-sm font-bold text-slate-700">暂无符合该难度的同类题</p><p className="text-xs text-slate-500 mt-1.5">试试其他难度，或返回原题复习解析</p></div></div> : recommendations.map((question, index) => {
                  const startQuestion = () => { setSelected(question); setSessionResult(null); };
                  return <article key={question.id} role="button" tabIndex={0} aria-label={'练习同类题 ' + (index + 1)} onClick={startQuestion} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); startQuestion(); } }} className="flex cursor-pointer items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-indigo-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
                    <div className="min-w-0 flex-1"><QuestionStemPreview question={question} /></div><ArrowRight size={16} className="shrink-0 text-indigo-500" />
                  </article>;
                })}
              </div>
            </div>
          </div>
        ) : sessionResult ? (
          <div className="flex-1 min-h-0 relative"><UniversalQuizResult
            initialData={sessionResult}
            allowSimilarPractice={false}
            onOpenAITutor={() => setTutorOpen(true)}
            onRestart={() => setSessionResult(null)}
            onContinue={returnToList}
            onClose={onClose}
          /></div>
        ) : <div className="flex-1 min-h-0"><UniversalQuizView mode="practice" questions={[selected]} singleQuestionMode onClose={returnToList} onOpenAITutor={() => setTutorOpen(true)} onSubmit={(payload) => {
          const { answers, paperDraftSnapshots, paperSelfGrades, questionTimesSec, totalTimeSec } = normalizeQuizSubmitPayload(payload);
          const answer = normalizeQuestionAnswer(selected, answers[selected.id]);
          const grade = paperSelfGrades?.[selected.id];
          const correctAnswer = selected.result?.correctAnswer;
          const userParts = Array.isArray(answer) ? answer.map(String) : [String(answer ?? '')];
          const correctParts = Array.isArray(correctAnswer) ? correctAnswer.map(String) : [String(correctAnswer ?? '')];
          const normalizeChoice = (part: string) => {
            const labelled = part.trim().match(/^([A-Z])(?:[.．、\s]|$)/i);
            if (labelled) return labelled[1].toUpperCase();
            const index = selected.content.options?.findIndex((option) => option === part);
            return index !== undefined && index >= 0 ? String.fromCharCode(65 + index) : part;
          };
          if (selected.type.includes('choice')) {
            userParts.forEach((part, index) => { userParts[index] = normalizeChoice(part); });
            correctParts.forEach((part, index) => { correctParts[index] = normalizeChoice(part); });
          }
          if (selected.type === 'multiple_choice') { userParts.sort(); correctParts.sort(); }
          const correct = selected.content.originalImageUrl ? grade === 'correct'
            : selected.content.manualGradeBlankIndex !== undefined ? resolveQuestionCorrectness(selected.content.manualGradeBlankIndex, correctAnswer, answer, grade)
            : userParts.length === correctParts.length && userParts.every((part, index) => isBlankMatch(part, correctParts[index]));
          let granted = grantQuizSessionReward({
            sessionId: crypto.randomUUID(), quizSetId: `similar_${selected.id}`, title: '举一反三练习',
            totalCount: 1, correctCount: correct ? 1 : 0,
            questions: [{ questionId: selected.id, difficulty: selected.difficulty, isCorrect: correct }],
            questionTimesSec: questionTimesSec ? [questionTimesSec[selected.id] ?? 0] : undefined, totalTimeSec,
          });
          if (correct && !granted.invalidLearning && !granted.skippedReasons.some(reason => reason.includes('重复刷'))) {
            const correction = grantVariantCorrectionReward(source.id);
            if (correction) granted = mergeRewardResults(granted, correction);
          }

          if (!granted.invalidLearning) recordSimilarAttempt(selected.id, correct);
          setSessionResult({
            sessionId: crypto.randomUUID(), timestamp: Date.now(),
            totalTimeSec: totalTimeSec ?? 0, score: correct ? 100 : 0,
            correctCount: correct ? 1 : 0, totalCount: 1,
            rewards: { baseXp: granted.xp, bonusXp: 0, coins: granted.coins },
            grantResult: granted, skillChanges: [], aiComment: '继续练习同类题，巩固所学。',
            questions: enrichQuizResultWithPracticeStates([{
              question: selected, questionId: selected.id, index: 1, isCorrect: correct,
              timeSpentSec: questionTimesSec?.[selected.id] ?? 0, difficulty: selected.difficulty ?? 1,
              stemSummary: selected.content.stem, subject: selected.subject ?? 'math',
              questionType: selected.type, options: selected.content.options,
              correctAnswer: Array.isArray(correctAnswer) ? correctAnswer.join('、') : correctAnswer ?? '',
              userAnswer: Array.isArray(answer) ? answer.join('、') : answer ?? '',
              rawCorrectAnswer: correctAnswer, rawUserAnswer: answer,
              explanation: selected.result?.explanation, knowledgePoint: selected.knowledgePoints?.[0] ?? '',
              knowledgePoints: selected.knowledgePoints, paperSelfGrade: grade,
              paperDraftImageUrl: paperDraftSnapshots?.[selected.id],
            }]),
          });
          onRewardGranted?.(granted);
        }} /></div>}
      </div>
    </section>, root,
  );
}

export function SimilarPracticeEntry({ question }: { question: UniversalQuizQuestion }) {
  const [open, setOpen] = useState(false);
  return <><button type="button" onClick={() => setOpen(true)} className="w-full flex items-center justify-between gap-3 rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-left hover:bg-indigo-100 transition"><div className="flex items-center gap-3"><Sparkles size={20} className="text-indigo-600" /><div><div className="text-sm font-black text-indigo-700">举一反三</div><div className="text-xs text-indigo-500 mt-0.5">选个难度，再练一道同类题</div></div></div><ArrowRight size={18} className="text-indigo-600" /></button>{open && <SimilarPracticePage key={question.id} source={question} onClose={() => setOpen(false)} />}</>;
}
