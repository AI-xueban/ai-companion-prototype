import React from 'react';
import { motion } from 'framer-motion';
import { Heart, HeartCrack, BadgeCheck } from 'lucide-react';
import { PeerInsight } from './types';

interface InsightListProps {
  insights: PeerInsight[];
  onLike: (id: string) => void;
  onDislike: (id: string) => void;
}

export const InsightList: React.FC<InsightListProps> = ({ insights, onLike, onDislike }) => {
  return (
    <div className="flex flex-col gap-4">
      {insights.map((insight, index) => (
        <motion.div
          key={insight.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-gray-50/50 rounded-2xl p-4 border border-gray-100/50"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full ${insight.authorAvatarColor} shadow-inner flex items-center justify-center text-white text-xs font-bold`}>
                {insight.authorName[0]}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-gray-800">{insight.authorName}</span>
                    {insight.tags?.map(tag => (
                        <span key={tag} className="px-1.5 py-0.5 rounded-md bg-yellow-100 text-yellow-700 text-[10px] font-bold border border-yellow-200">
                            {tag}
                        </span>
                    ))}
                </div>
                <div className="text-[10px] text-gray-400 font-medium">{insight.timeAgo}</div>
              </div>
            </div>
          </div>
          
          <div className="text-sm text-gray-600 leading-relaxed pl-10 whitespace-pre-line">
            {insight.content}
          </div>

          <div className="flex items-center justify-end mt-2 gap-3">
              <button
                onClick={() => onDislike(insight.id)}
                className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${insight.isDisliked ? 'text-rose-500' : 'text-gray-400 hover:text-gray-600'}`}
              >
                  <motion.div whileTap={{ scale: 1.2 }} animate={insight.isDisliked ? { scale: [1, 1.15, 1] } : {}}>
                    <HeartCrack size={14} fill={insight.isDisliked ? "currentColor" : "none"} />
                  </motion.div>
              </button>

              <button 
                onClick={() => onLike(insight.id)}
                className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${insight.isLiked ? 'text-red-500' : 'text-gray-400 hover:text-gray-600'}`}
              >
                  <motion.div whileTap={{ scale: 1.4 }} animate={insight.isLiked ? { scale: [1, 1.2, 1] } : {}}>
                    <Heart size={14} fill={insight.isLiked ? "currentColor" : "none"} />
                  </motion.div>
                  {insight.likes}
              </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
};













