import React from 'react';
import { ArrowRight, BookOpen } from 'lucide-react';
import type { PhotoReplyAction, PhotoTriageItem } from './lumiPhotoClassify';

interface LumiPhotoTriageCardProps {
  imageUrls: string[];
  items: PhotoTriageItem[];
  onAction: (action: PhotoReplyAction) => void;
}

export const LumiPhotoTriageCard: React.FC<LumiPhotoTriageCardProps> = ({
  imageUrls,
  items,
  onAction,
}) => {
  if (items.length === 0) return null;

  return (
    <div className="mt-2 w-full max-w-[85%] rounded-2xl bg-white/95 backdrop-blur-sm border border-white/60 shadow-sm overflow-hidden">
      <div className="px-3.5 py-2 border-b border-gray-100">
        <p className="text-[11px] font-bold text-gray-400 tracking-wide">识别到的题目</p>
      </div>
      <div className="divide-y divide-gray-50">
        {items.map((item) => {
          const thumb = imageUrls[item.imageIndex];
          return (
            <button
              key={`${item.imageIndex}-${item.label}`}
              type="button"
              onClick={() => onAction(item.action)}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left hover:bg-brand/5 active:bg-brand/10 transition-colors"
            >
              <div className="relative shrink-0 w-11 h-11 rounded-lg overflow-hidden bg-gray-100 ring-1 ring-gray-100">
                {thumb ? (
                  <img src={thumb} alt="" className="w-full h-full object-cover" />
                ) : null}
                <span className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-brand text-white flex items-center justify-center shadow-sm">
                  <BookOpen size={9} strokeWidth={2.5} />
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-800 truncate">
                  {item.ordinalLabel} · {item.label}
                </p>
                <p className="text-[11px] text-brand font-medium mt-0.5">{item.actionLabel}</p>
              </div>
              <ArrowRight size={14} className="shrink-0 text-gray-300" />
            </button>
          );
        })}
      </div>
    </div>
  );
};
