import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export type SessionFeedbackRating = 'helpful' | 'neutral' | 'bad';

export interface SessionFeedbackPayload {
    rating: SessionFeedbackRating;
    tags: string[];
    note?: string;
}

interface SessionFeedbackSheetProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (payload: SessionFeedbackPayload) => void;
    onSkip: () => void;
}

type FeedbackStep = 'rating' | 'tags' | 'thanks';

const RATING_OPTIONS: { key: SessionFeedbackRating; emoji: string; label: string }[] = [
    { key: 'helpful', emoji: '😊', label: '很有帮助' },
    { key: 'neutral', emoji: '😐', label: '一般' },
    { key: 'bad', emoji: '😕', label: '不太满意' },
];

const IMPROVE_TAGS = [
    { id: 'not_understood', label: '没理解我' },
    { id: 'off_topic', label: '答非所问' },
    { id: 'lack_companionship', label: '缺少陪伴感' },
    { id: 'tone', label: '语气不对' },
    { id: 'too_long', label: '回复太长' },
    { id: 'too_short', label: '回复太短' },
];

const THANKS_MESSAGES: Record<SessionFeedbackRating, string> = {
    helpful: '谢谢反馈！小晤会继续陪你学习 ✨',
    neutral: '收到，小晤会努力变得更好～',
    bad: '抱歉这次没帮上忙，下次可以换种方式问我哦',
};

export const SessionFeedbackSheet: React.FC<SessionFeedbackSheetProps> = ({
    open,
    onClose,
    onSubmit,
    onSkip,
}) => {
    const [step, setStep] = useState<FeedbackStep>('rating');
    const [rating, setRating] = useState<SessionFeedbackRating | null>(null);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [note, setNote] = useState('');

    const portalTarget =
        document.getElementById('app-viewport') ||
        document.getElementById('modal-root') ||
        document.body;

    const thanksTimerRef = useRef<number | null>(null);

    useEffect(() => {
        if (!open) {
            setStep('rating');
            setRating(null);
            setSelectedTags([]);
            setNote('');
            if (thanksTimerRef.current) {
                clearTimeout(thanksTimerRef.current);
                thanksTimerRef.current = null;
            }
        }
    }, [open]);

    useEffect(() => {
        return () => {
            if (thanksTimerRef.current) clearTimeout(thanksTimerRef.current);
        };
    }, []);

    const showThanksAndSubmit = (payload: SessionFeedbackPayload) => {
        setRating(payload.rating);
        setStep('thanks');
        if (thanksTimerRef.current) clearTimeout(thanksTimerRef.current);
        thanksTimerRef.current = window.setTimeout(() => {
            onSubmit(payload);
            thanksTimerRef.current = null;
        }, 1600);
    };

    const toggleTag = (id: string) => {
        setSelectedTags((prev) =>
            prev.includes(id) ? prev.filter((tag) => tag !== id) : [...prev, id],
        );
    };

    const handleRatingSelect = (value: SessionFeedbackRating) => {
        if (value === 'helpful') {
            showThanksAndSubmit({ rating: value, tags: [] });
            return;
        }
        setRating(value);
        setStep('tags');
    };

    const handleTagsSubmit = () => {
        if (!rating) return;
        showThanksAndSubmit({
            rating,
            tags: selectedTags,
            note: note.trim() || undefined,
        });
    };

    if (!open) return null;

    return createPortal(
        <AnimatePresence>
            {open && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-[180] bg-gray-900/45 backdrop-blur-[2px]"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                        className="absolute left-0 right-0 bottom-0 z-[190] px-4 pb-6 pt-2"
                    >
                        <div className="max-w-2xl mx-auto bg-white rounded-[28px] shadow-2xl border border-gray-100 overflow-hidden">
                            <div className="flex items-center justify-between px-5 pt-4 pb-2">
                                <div>
                                    <p className="text-[11px] font-bold text-brand">
                                        {step === 'rating' && '小晤想听听'}
                                        {step === 'tags' && '告诉小晤'}
                                        {step === 'thanks' && '收到啦'}
                                    </p>
                                    <h3 className="text-lg font-black text-gray-800 mt-0.5">
                                        {step === 'rating' && '这次聊得怎么样？'}
                                        {step === 'tags' && '哪里可以更好？'}
                                        {step === 'thanks' && '谢谢告诉我'}
                                    </h3>
                                </div>
                                {step !== 'thanks' ? (
                                    <button
                                        type="button"
                                        onClick={onSkip}
                                        className="p-2 rounded-full text-gray-400 hover:bg-gray-100 transition-colors"
                                        aria-label="关闭"
                                    >
                                        <X size={18} />
                                    </button>
                                ) : null}
                            </div>

                            <div className="px-5 pb-5">
                                <AnimatePresence mode="wait">
                                    {step === 'rating' && (
                                        <motion.div
                                            key="rating"
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -8 }}
                                            className="space-y-4"
                                        >
                                            <div className="grid grid-cols-3 gap-3">
                                                {RATING_OPTIONS.map((option) => (
                                                    <button
                                                        key={option.key}
                                                        type="button"
                                                        onClick={() => handleRatingSelect(option.key)}
                                                        className="flex flex-col items-center gap-2 py-4 rounded-2xl border-2 border-gray-100 bg-gray-50 hover:border-brand/30 hover:bg-brand/5 transition-all active:scale-[0.98]"
                                                    >
                                                        <span className="text-3xl">{option.emoji}</span>
                                                        <span className="text-xs font-bold text-gray-700">{option.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={onSkip}
                                                className="w-full py-2.5 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors"
                                            >
                                                跳过
                                            </button>
                                        </motion.div>
                                    )}

                                    {step === 'tags' && (
                                        <motion.div
                                            key="tags"
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -8 }}
                                            className="space-y-4"
                                        >
                                            <p className="text-xs text-gray-400 font-medium">可多选</p>
                                            <div className="flex flex-wrap gap-2">
                                                {IMPROVE_TAGS.map((tag) => {
                                                    const selected = selectedTags.includes(tag.id);
                                                    return (
                                                        <button
                                                            key={tag.id}
                                                            type="button"
                                                            onClick={() => toggleTag(tag.id)}
                                                            className={`px-3.5 py-2 rounded-full text-xs font-bold border transition-all ${
                                                                selected
                                                                    ? 'bg-brand text-white border-brand shadow-sm'
                                                                    : 'bg-white text-gray-600 border-gray-200 hover:border-brand/30'
                                                            }`}
                                                        >
                                                            {tag.label}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            <input
                                                type="text"
                                                value={note}
                                                onChange={(e) => setNote(e.target.value.slice(0, 50))}
                                                placeholder="其他想说的（选填）"
                                                className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-brand/20"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleTagsSubmit}
                                                className="w-full py-3 rounded-2xl bg-brand text-white font-bold shadow-lg shadow-brand/20 hover:bg-brand-dark transition-colors active:scale-[0.98]"
                                            >
                                                提交反馈
                                            </button>
                                        </motion.div>
                                    )}

                                    {step === 'thanks' && rating && (
                                        <motion.div
                                            key="thanks"
                                            initial={{ opacity: 0, scale: 0.96 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="py-8 text-center"
                                        >
                                            <div className="text-4xl mb-3">
                                                {RATING_OPTIONS.find((item) => item.key === rating)?.emoji}
                                            </div>
                                            <p className="text-sm font-bold text-gray-700 leading-relaxed px-4">
                                                {THANKS_MESSAGES[rating]}
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        portalTarget,
    );
};
