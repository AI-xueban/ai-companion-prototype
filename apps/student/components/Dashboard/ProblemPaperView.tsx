import React from 'react';

import {

  AI_SOLVE_MOCK_SHOTS,

  AISolveMockShot,

  AISolveQuestion,

  DEFAULT_QUESTION,

  getShotById,

} from '../../data/aiSolveMockData';
import { normalizeTutorDisplayText } from '../../utils/tutorDisplayText';



const PaperShell: React.FC<{ children: React.ReactNode; className?: string; fill?: boolean }> = ({
  children,
  className = '',
  fill = true,
}) => (
  <div
    className={`bg-[#f0f2f5] overflow-hidden relative flex flex-col select-none ${className}`}
  >
    <div className="absolute inset-0 bg-white opacity-90" />
    <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:8px_8px]" />
    <div className={fill ? 'relative z-10 flex-1 min-h-0' : 'relative z-10'}>{children}</div>
  </div>
);



export const SingleQuestionPaper: React.FC<{
  question: AISolveQuestion;
  className?: string;
  compact?: boolean;
  imageOnly?: boolean;
  adaptive?: boolean;
}> = ({ question, className = '', compact, imageOnly, adaptive = false }) => {
  if (question.imageSrc && imageOnly) {
    return (
      <PaperShell className={className} fill={!adaptive}>
        <img
          src={question.imageSrc}
          alt={`第 ${question.number} 题`}
          className={`bg-[#f5f5f0] p-1 ${adaptive ? 'w-full h-auto' : 'w-full h-full object-contain'}`}
        />
      </PaperShell>
    );
  }

  if (adaptive && question.imageSrc) {
    return (
      <PaperShell className={className} fill={false}>
        <div className={`w-full flex flex-col ${compact ? 'p-2 gap-1' : 'p-3 md:p-4 gap-2'}`}>
          {!imageOnly && (
            <div className="flex gap-2 items-start shrink-0">
              <span className="text-[10px] font-black text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded shrink-0">
                {question.number}.
              </span>
              <p
                className={`text-slate-800 font-sans tabular-nums lining-nums font-bold leading-snug ${compact ? 'text-[8px] line-clamp-3' : 'text-[11px] md:text-xs'}`}
              >
                {normalizeTutorDisplayText(question.text)}
              </p>
            </div>
          )}
          <img
            src={question.imageSrc}
            alt={`第 ${question.number} 题配图`}
            className="w-full h-auto rounded-lg bg-[#f5f5f0]"
          />
        </div>
      </PaperShell>
    );
  }

  return (

    <PaperShell className={className}>

      <div

        className={`w-full h-full flex flex-col ${compact ? 'p-2 gap-1' : 'p-3 md:p-4 gap-2'}`}

      >

        {!imageOnly && (

          <div className="flex gap-2 items-start shrink-0">

            <span className="text-[10px] font-black text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded shrink-0">

              {question.number}.

            </span>

            <p

              className={`text-slate-800 font-sans tabular-nums lining-nums font-bold leading-snug ${compact ? 'text-[8px] line-clamp-3' : 'text-[11px] md:text-xs'}`}

            >

              {normalizeTutorDisplayText(question.text)}

            </p>

          </div>

        )}

        {question.imageSrc ? (

          <div className="flex-1 min-h-0 flex items-center justify-center overflow-hidden rounded-lg bg-[#f5f5f0]">

            <img

              src={question.imageSrc}

              alt={`第 ${question.number} 题配图`}

              className="max-w-full max-h-full object-contain"

            />

          </div>

        ) : null}

      </div>

    </PaperShell>

  );

};



export const MultiQuestionPaper: React.FC<{

  shot: AISolveMockShot;

  className?: string;

  highlightId?: string | null;

  onSelectQuestion?: (q: AISolveQuestion) => void;

}> = ({ shot, className = '', highlightId, onSelectQuestion }) => {
  const pageImage = shot.imageSrc ?? shot.questions.find((q) => q.imageSrc)?.imageSrc;

  if (pageImage) {
    return (
      <PaperShell className={className}>
        <img
          src={pageImage}
          alt=""
          className="w-full h-full object-cover object-top"
          draggable={false}
        />
      </PaperShell>
    );
  }

  return (
  <PaperShell className={className}>

    <div
      className={`px-6 py-4 w-full h-full flex flex-col gap-1 relative ${
        !onSelectQuestion ? 'pointer-events-none' : ''
      }`}
    >

      {shot.questions.map((q) => {

        const isHighlight = highlightId === q.id;

        const clickable = !!onSelectQuestion;

        return (

          <button

            key={q.id}

            type="button"

            disabled={!clickable}

            onClick={() => onSelectQuestion?.(q)}

            className={`

              text-left rounded-lg px-3 py-2.5 transition-all border-2

              ${clickable ? 'cursor-pointer hover:bg-brand/5' : 'cursor-default'}

              ${isHighlight ? 'border-brand bg-brand/10 shadow-md' : 'border-transparent'}

            `}

          >

            <div className="flex gap-2 items-start">

              <span className="text-[10px] font-black text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded shrink-0">

                {q.number}.

              </span>

              <p className="text-[10px] text-slate-800 font-sans tabular-nums lining-nums font-bold leading-snug">

                {normalizeTutorDisplayText(q.text)}

              </p>

            </div>

          </button>

        );

      })}

    </div>

  </PaperShell>
  );
};



export const ShotThumbnail: React.FC<{ shotId: string; className?: string; preview?: boolean }> = ({
  shotId,
  className = '',
  preview = false,
}) => {
  const shot = getShotById(shotId);
  if (!shot) return null;

  if (preview) {
    const imgSrc = shot.imageSrc ?? shot.questions.find((q) => q.imageSrc)?.imageSrc;
    if (imgSrc) {
      return (
        <img
          src={imgSrc}
          alt=""
          className={`${className} object-cover object-top block`}
          draggable={false}
        />
      );
    }

    return (
      <div className={`${className} bg-white overflow-hidden flex flex-col gap-[2px] p-1.5`}>
        {shot.questions.map((q) => (
          <div
            key={q.id}
            className="flex-1 min-h-0 bg-slate-100 rounded-[2px] px-1 flex items-center overflow-hidden"
          >
            <span className="text-[6px] font-bold text-slate-600 truncate leading-tight">
              {q.number}. {q.text}
            </span>
          </div>
        ))}
      </div>
    );
  }

  const previewClass = '';

  if (shot.multiQuestion) {
    return <MultiQuestionPaper shot={shot} className={`${className} ${previewClass}`} />;
  }

  const q = shot.questions[0];
  if (q.imageSrc) {
    return (
      <SingleQuestionPaper question={q} className={`${className} ${previewClass}`} imageOnly compact />
    );
  }
  return <SingleQuestionPaper question={q} className={`${className} ${previewClass}`} compact />;
};



export const MockProblemView: React.FC<{
  className?: string;
  question?: AISolveQuestion;
  adaptive?: boolean;
  imageOnly?: boolean;
}> = ({ className = '', question, adaptive = true, imageOnly = false }) => {
  const q = question ?? DEFAULT_QUESTION;
  return (
    <SingleQuestionPaper
      question={q}
      className={className}
      adaptive={adaptive}
      imageOnly={imageOnly}
    />
  );
};


