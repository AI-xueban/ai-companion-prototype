import React from 'react';
import { Delete, Check } from 'lucide-react';

interface VirtualNumPadProps {
    onInput: (char: string) => void;
    onDelete: () => void;
    onConfirm?: () => void;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '-'];

export const VirtualNumPad: React.FC<VirtualNumPadProps> = ({ onInput, onDelete, onConfirm }) => {
    return (
        <div className="grid grid-cols-4 gap-1.5 p-1.5 bg-gray-100 rounded-xl">
            {KEYS.map(key => (
                <button
                    key={key}
                    onClick={() => onInput(key)}
                    className="h-9 rounded-lg bg-white shadow-sm border-b-2 border-gray-200 text-sm font-bold text-gray-700 active:scale-95 active:bg-gray-50 transition-all flex items-center justify-center"
                >
                    {key}
                </button>
            ))}
            
            {/* Backspace */}
            <button
                onClick={onDelete}
                className="h-9 rounded-lg bg-gray-200 shadow-sm border-b-2 border-gray-300 text-gray-600 active:scale-95 transition-all flex items-center justify-center col-span-2"
            >
                <Delete size={16} />
            </button>

             {/* Confirm / Next */}
             {onConfirm && (
                 <button
                    onClick={onConfirm}
                    className="h-9 rounded-lg bg-[#007AFF] shadow-sm border-b-2 border-blue-700 text-white active:scale-95 transition-all flex items-center justify-center col-span-2"
                >
                    <Check size={18} />
                </button>
             )}
        </div>
    );
};
