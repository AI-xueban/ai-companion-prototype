import React from 'react';

interface QuizStemProps {
    content: string;
    images?: string[];
    highlightIndex?: number | null;
    /** 各空位已填答案，回填到题干内联空 */
    gapAnswers?: string[];
    fontSize?: 'normal' | 'large';
    onGapClick?: (index: number) => void;
}

const GAP_RE = /_{3,}|\{\{.*?\}\}|（\s*）|\(\s*\)/g;

export const QuizStem: React.FC<QuizStemProps> = ({ 
    content, 
    images, 
    highlightIndex = null,
    gapAnswers = [],
    fontSize = 'normal',
    onGapClick,
}) => {
    const renderContent = () => {
        const parts = content.split(GAP_RE);
        
        if (parts.length === 1) return <p className="whitespace-pre-wrap">{content}</p>;

        return (
            <p className="whitespace-pre-wrap leading-[1.8] text-[13px] text-slate-800">
                {parts.map((part, index) => (
                    <React.Fragment key={index}>
                        <span>{part}</span>
                        {index < parts.length - 1 && (() => {
                            const filled = (gapAnswers[index] || '').trim();
                            const isActive = highlightIndex === index;
                            return (
                                <button
                                    type="button"
                                    onClick={() => onGapClick?.(index)}
                                    className={`
                                        mx-0.5 inline-flex min-w-[40px] items-center justify-center
                                        rounded-md border px-2 py-0.5 align-middle text-[12px] font-bold
                                        transition-all duration-200
                                        ${filled
                                            ? isActive
                                                ? 'border-violet-500 bg-violet-100 text-violet-700'
                                                : 'border-violet-300 bg-violet-50 text-violet-700'
                                            : isActive
                                                ? 'border-violet-500 bg-violet-100 text-violet-400 scale-105 shadow-md shadow-violet-200/50'
                                                : 'border-violet-100 bg-violet-50/80 text-violet-300'}
                                    `}
                                >
                                    {filled || '\u00A0\u00A0\u00A0'}
                                </button>
                            );
                        })()}
                    </React.Fragment>
                ))}
            </p>
        );
    };

    return (
        <div className={`text-gray-900 font-medium ${fontSize === 'large' ? 'text-base' : 'text-[13px] leading-6'}`}>
            {images && images.length > 0 && (
                <div className="flex flex-wrap gap-4 mb-6">
                    {images.map((img, idx) => (
                        <img 
                            key={idx} 
                            src={img} 
                            alt={`Figure ${idx + 1}`} 
                            className="max-w-full rounded-2xl border border-gray-100 shadow-sm max-h-[300px] object-contain bg-white"
                        />
                    ))}
                </div>
            )}

            <div className="select-text">
                {renderContent()}
            </div>
        </div>
    );
};

export function countStemGaps(stem: string): number {
  const matches = stem.match(GAP_RE);
  return matches?.length || 0;
}
