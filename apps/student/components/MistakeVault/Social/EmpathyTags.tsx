import React from 'react';
import { motion } from 'framer-motion';
import { InsightTag } from './types';

interface EmpathyTagsProps {
  tags: InsightTag[];
  onToggle: (id: string) => void;
}

export const EmpathyTags: React.FC<EmpathyTagsProps> = ({ tags, onToggle }) => {
  return (
    <div className="flex flex-wrap gap-3">
      {tags.map((tag) => (
        <motion.button
          key={tag.id}
          onClick={() => onToggle(tag.id)}
          whileTap={{ scale: 0.95 }}
          layout
          className={`relative px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 border flex items-center gap-2 ${
            tag.isSelected
              ? "bg-blue-500 border-blue-500 text-white shadow-md shadow-blue-200"
              : "bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100"
          }`}
        >
          {tag.isSelected && (
            <motion.span
              layoutId="check-icon"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-1.5 h-1.5 rounded-full bg-white"
            />
          )}
          <span>{tag.label}</span>
          <span className={`ml-1 opacity-60 text-[10px] ${
            tag.isSelected ? "text-white" : "text-gray-400"
          }`}>
            {tag.isSelected ? tag.count + 1 : tag.count}
          </span>
        </motion.button>
      ))}
    </div>
  );
};
