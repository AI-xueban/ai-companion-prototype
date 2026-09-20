import React, { useState, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import { UniversalQuizQuestion } from '../UniversalQuizView';
import { QuizStem } from './QuizStem';
import { XkwHtmlStem } from './XkwHtmlStem';

interface QuestionRichContentProps {
  question: UniversalQuizQuestion;
  showAudioPlayer?: boolean; // 是否显示音频播放器
}

/** 子题文案若已含（1）/1. 等序号，不再叠加外层 1. 2. 3. */
const formatSubQuestionText = (idx: number, question: string): string => {
  if (/^[（(]\d+[）)]/.test(question) || /^\d+[.．、]/.test(question)) {
    return question;
  }
  return `${idx + 1}. ${question}`;
};

const STEM_SECTION_LABEL: Record<'reading' | 'image' | 'default', string> = {
  reading: '阅读材料',
  image: '题目',
  default: '题目',
};

export const QuestionRichContent: React.FC<QuestionRichContentProps> = ({
  question,
  showAudioPlayer = true
}) => {
  const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  const isReadingLike = question ? ['reading_comp', 'task_reading', 'short_cloze', 'dialogue_fill', 'poem_reading', 'classical_reading'].includes(question.type as any) : false;

  // 清理音频资源
  useEffect(() => {
    return () => {
      if (previewAudio) {
        previewAudio.pause();
        previewAudio.src = '';
      }
    };
  }, [previewAudio]);

  const handlePreviewPlay = () => {
    if (!question?.content?.audioUrl) return;

    if (previewAudio) {
      if (!previewAudio.paused) {
        previewAudio.pause();
        setIsAudioPlaying(false);
        return;
      } else if (previewAudio.src === question.content.audioUrl) {
        previewAudio.play().then(() => setIsAudioPlaying(true)).catch(() => {});
        return;
      }
    }

    const audio = new Audio(question.content.audioUrl);
    setPreviewAudio(audio);
    audio.onloadedmetadata = () => {
      setAudioDuration(audio.duration || 0);
    };
    audio.ontimeupdate = () => {
      setAudioProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0);
    };
    audio.onended = () => {
      setIsAudioPlaying(false);
      setAudioProgress(0);
    };
    audio.onerror = () => {
      setIsAudioPlaying(false);
    };
    audio.play()
      .then(() => setIsAudioPlaying(true))
      .catch(() => setIsAudioPlaying(false));
  };

  const hasStemImages = Boolean(question.content.stemImages && question.content.stemImages.length > 0);
  const hasHtmlStem = Boolean(question.content.htmlStem);
  const hasSubQuestions = Boolean(question.content.subQuestions && question.content.subQuestions.length > 0);
  const showStemSection = Boolean(question.content.stem || hasStemImages || hasHtmlStem);
  const stemSectionLabel = isReadingLike
    ? STEM_SECTION_LABEL.reading
    : hasStemImages
      ? STEM_SECTION_LABEL.image
      : STEM_SECTION_LABEL.default;

  return (
    <div className="space-y-4">
      {/* 题干：图片与文字合并为一块，避免「图 + 孤立文字卡」重复感 */}
      {showStemSection && (
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm space-y-2.5">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-slate-400">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>{stemSectionLabel}</span>
          </div>
          {hasHtmlStem ? (
            <XkwHtmlStem html={question.content.htmlStem!} />
          ) : hasStemImages || !isReadingLike ? (
            <QuizStem
              content={question.content.stem || ''}
              images={question.content.stemImages}
            />
          ) : (
            <div className="text-[13px] leading-6 text-slate-800 whitespace-pre-wrap">
              {question.content.stem}
            </div>
          )}
        </div>
      )}

      {/* 听力播放器 */}
      {showAudioPlayer && question.content?.audioUrl && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 shadow-sm">
          <div className="flex items-center gap-3 text-xs text-slate-600">
            <button
              onClick={(e) => { e.stopPropagation(); handlePreviewPlay(); }}
              className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 active:scale-95 transition"
            >
              {isAudioPlaying ? <Pause size={16} /> : <Play size={16} className="translate-x-[0.5px]" />}
            </button>
            <div className="flex-1 h-2 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full bg-[#0A84FF]"
                style={{ width: `${isAudioPlaying ? audioProgress : 0}%` }}
              />
            </div>
            <span className="font-mono min-w-[72px] text-right text-slate-500">
              {audioDuration
                ? `${Math.floor((audioDuration * (audioProgress / 100)) / 60).toString().padStart(2, '0')}:${Math.floor((audioDuration * (audioProgress / 100)) % 60).toString().padStart(2, '0')}`
                : '00:00'}
              {' / '}
              {audioDuration ? `${Math.floor(audioDuration / 60).toString().padStart(2, '0')}:${Math.floor(audioDuration % 60).toString().padStart(2, '0')}` : '--:--'}
            </span>
          </div>
        </div>
      )}

      {/* 子题模式：优先渲染 subQuestions */}
      {hasSubQuestions && !hasHtmlStem ? (
        <div className="space-y-3">
          {hasStemImages && (
            <div className="text-xs font-semibold text-slate-500 tracking-wide px-1">
              作答小题
            </div>
          )}
          {question.content.subQuestions!.map((sq, idx) => {
            const isReadingOption = isReadingLike && sq.options;
            return (
              <div
                key={idx}
                className="flex flex-col gap-3 p-4 rounded-2xl border border-slate-100 bg-slate-50/70"
              >
                <div className="text-sm font-semibold text-slate-800">
                  {formatSubQuestionText(idx, sq.question)}
                </div>
                {sq.options && (
                  <div className="grid grid-cols-1 gap-2">
                    {sq.options.map((opt, oidx) => {
                      const hasPrefix = /^[A-Z]\.\s*/.test(opt);
                      const label = hasPrefix ? opt.charAt(0) : String.fromCharCode(65 + oidx);
                      const content = hasPrefix ? opt.replace(/^[A-Z]\.\s*/, '') : opt;
                      return (
                        <div
                          key={oidx}
                          className="flex items-start gap-2 p-3 rounded-xl border border-slate-200 bg-white hover:shadow-sm transition-all"
                        >
                          <div className="w-7 h-7 shrink-0 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-[11px] font-black text-slate-500">
                            {label}
                          </div>
                          <div className={`${isReadingOption ? 'text-[13px] leading-6' : 'text-[14px] leading-relaxed'} text-slate-700`}>
                            {content}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* 普通选项展示区块 (Options) */
        question.content.options && question.content.options.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
            {question.content.options.map((option, idx) => {
              const hasPrefix = /^[A-Z]\.\s*/.test(option);
              const label = hasPrefix ? option.charAt(0) : String.fromCharCode(65 + idx);
              const content = hasPrefix ? option.replace(/^[A-Z]\.\s*/, '') : option;

              return (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-4 rounded-2xl border border-slate-100 bg-slate-50/50 transition-all hover:bg-white hover:shadow-sm"
                >
                  <div className="w-8 h-8 shrink-0 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-black text-slate-400 shadow-sm mt-0.5">
                    {label}
                  </div>
                  <div className="text-[15px] text-slate-700 leading-relaxed font-medium pt-1">
                    {content}
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

    </div>
  );
};