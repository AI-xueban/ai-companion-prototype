import React from 'react';
import { Check, X, Circle, Square } from 'lucide-react';
import { motion } from 'framer-motion';

type SelectionCardVariant = 'default' | 'true_false';

interface SelectionCardProps {
    id: string;
    label: string; // A, B, C or √, ×
    content: string;
    isSelected: boolean;
    isMulti?: boolean;
    disabled?: boolean;
    onSelect: () => void;
    state?: 'default' | 'correct' | 'wrong'; // For feedback
    className?: string;
    labelClassName?: string;
    contentClassName?: string;
    variant?: SelectionCardVariant;
}

export const SelectionCard: React.FC<SelectionCardProps> = ({
    label,
    content,
    isSelected,
    isMulti = false,
    disabled = false,
    onSelect,
    state = 'default',
    className,
    labelClassName,
    contentClassName,
    variant = 'default'
}) => {
    const isTrueFalse = variant === 'true_false';

    // Dynamic Styles
    let bgClass = "bg-white";
    let borderClass = "border-gray-100";
    let textClass = "text-gray-700";
    let indicatorClass = "border-gray-300 text-transparent bg-gray-50";

    if (state === 'correct') {
        bgClass = "bg-green-50";
        borderClass = "border-green-500";
        textClass = "text-green-800";
        indicatorClass = "border-green-500 bg-green-500 text-white";
    } else if (state === 'wrong') {
        bgClass = "bg-red-50";
        borderClass = "border-red-400";
        textClass = "text-red-800";
        indicatorClass = "border-red-400 bg-red-400 text-white";
    } else if (isSelected) {
        bgClass = "bg-[#EBF5FF]"; // Light Apple Blue
        borderClass = "border-[#007AFF]"; // Apple Blue
        textClass = "text-[#007AFF]";
        indicatorClass = "border-[#007AFF] bg-[#007AFF] text-white";
    }

    const indicatorShape = isTrueFalse ? 'rounded-lg' : (isMulti ? 'rounded-md' : 'rounded-full');
    const indicatorSize = isTrueFalse ? 'w-8 h-8 text-xs' : 'w-7 h-7 text-[11px]';
    const contentSize = isTrueFalse ? 'text-sm' : 'text-[13px]';

    return (
        <motion.button
            whileTap={!disabled ? { scale: 0.98 } : {}}
            onClick={disabled ? undefined : onSelect}
            className={`w-full relative flex items-center gap-2.5 p-2.5 rounded-xl border transition-all duration-200 ${bgClass} ${borderClass} ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50'} ${className ?? ''}`}
        >
            {/* Indicator (Checkbox or Radio) */}
            <div className={`${indicatorSize} flex-shrink-0 border flex items-center justify-center font-bold transition-colors ${indicatorClass} ${indicatorShape} ${labelClassName ?? ''}`}>
                {state === 'correct' ? <Check size={13} strokeWidth={3} /> :
                 state === 'wrong' ? <X size={13} strokeWidth={3} /> :
                 isSelected ? <Check size={13} strokeWidth={3} /> : 
                 <span className="text-gray-400">{label}</span>}
            </div>

            {/* Content */}
            <div className={`flex-1 text-left font-medium leading-5 ${contentSize} ${textClass} ${contentClassName ?? ''}`}>
                {content}
            </div>
            
            {/* Right Status Icon (Optional) */}
            {isSelected && state === 'default' && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-[#007AFF]">
                    <Check size={16} />
                </motion.div>
            )}
        </motion.button>
    );
};
