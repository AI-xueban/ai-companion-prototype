import React from 'react';
import { EmpathyTags } from './EmpathyTags';
import { InsightList } from './InsightList';
import { InsightTag, PeerInsight } from './types';

interface MistakeSocialContentProps {
  tags: InsightTag[];
  insights: PeerInsight[];
  onTagToggle: (id: string) => void;
  onLike: (id: string) => void;
  onDislike: (id: string) => void;
  onShare?: () => void;
  isDark?: boolean;
}

export const MistakeSocialContent: React.FC<MistakeSocialContentProps> = ({
  tags,
  insights,
  onTagToggle,
  onLike,
  onDislike,
  onShare,
  isDark = false
}) => {
  const textColorClass = isDark ? 'text-gray-400' : 'text-gray-400';
  const subTitleClass = `text-xs font-bold ${textColorClass} uppercase mb-3 px-1`;

  return (
    <div className="pt-6 pb-2 space-y-6 mt-[-21px]">
      {/* A. Empathy Tags */}
      <div>
        <div className={subTitleClass}>你的情况是？</div>
        <EmpathyTags tags={tags} onToggle={onTagToggle} />
      </div>

      {/* B. Insights List */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className={subTitleClass}>避坑指南</div>
          <button
            type="button"
            onClick={onShare}
            disabled={!onShare}
            className="text-xs font-bold text-blue-500 active:opacity-70 transition-colors disabled:opacity-40"
          >
            + 分享我的见解
          </button>
        </div>
        <InsightList insights={insights} onLike={onLike} onDislike={onDislike} />
      </div>
    </div>
  );
};
