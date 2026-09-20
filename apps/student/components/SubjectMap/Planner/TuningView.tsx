import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Calendar, CheckCircle2, Circle } from 'lucide-react';
import { PlanConfig, PlannerState, KnowledgeNode } from './types';

interface TuningViewProps {
  config: PlanConfig;
  diagnosis: PlannerState['diagnosis'];
  onUpdate: (updates: Partial<PlanConfig>) => void;
  onNext: () => void;
}

export const TuningView: React.FC<TuningViewProps> = ({ config, diagnosis, onUpdate, onNext }) => {
  // Calculate load based on selection
  const topicCount = config.selectedTopics.length;
  // Simple heuristic: 1 topic = 30 mins total work.
  const totalMinutes = topicCount * 30;
  const dailyMinutes = Math.round(totalMinutes / config.durationDays);
  
  // Determine intensity label
  const getIntensity = (mins: number) => {
    if (mins < 15) return { label: '轻松', color: 'text-green-500', bg: 'bg-green-500' };
    if (mins < 35) return { label: '适中', color: 'text-blue-500', bg: 'bg-blue-500' };
    return { label: '高压', color: 'text-orange-500', bg: 'bg-orange-500' };
  };

  const intensity = getIntensity(dailyMinutes);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="h-full flex flex-col pt-20 pb-8 px-6"
    >
      <div className="mb-6">
        <h2 className="text-2xl font-black text-gray-900">定制你的节奏</h2>
        <p className="text-gray-500 text-sm">平衡学习量与时间，避免半途而废。</p>
      </div>

      {/* 1. Scope Selection (What to learn) */}
      <div className="flex-1 overflow-y-auto pr-2 -mr-2 mb-6">
        <div className="mb-4">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 block">攻克目标 ({topicCount})</label>
          <div className="flex flex-wrap gap-2">
            {diagnosis.recommendedTopics.map((topic) => {
              const isSelected = config.selectedTopics.includes(topic.id);
              return (
                <button
                  key={topic.id}
                  onClick={() => {
                    const newSelected = isSelected
                      ? config.selectedTopics.filter(id => id !== topic.id)
                      : [...config.selectedTopics, topic.id];
                    onUpdate({ selectedTopics: newSelected });
                  }}
                  className={`px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 border ${
                    isSelected 
                      ? 'bg-black text-white border-black shadow-md transform scale-105' 
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {topic.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Rhythm Control (How fast) */}
      <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 mb-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-gray-400" />
            <span className="font-bold text-gray-900">计划周期</span>
          </div>
          <div className="text-2xl font-black text-brand">{config.durationDays} <span className="text-sm font-medium text-gray-400">天</span></div>
        </div>

        {/* Custom Slider */}
        <div className="relative h-12 bg-gray-200 rounded-full p-1 flex items-center mb-6">
          {/* Background Track Indicators */}
          <div className="absolute inset-0 flex justify-between px-4 items-center text-xs font-bold text-gray-400 pointer-events-none z-10">
            <span>7天 (冲刺)</span>
            <span>14天 (标准)</span>
            <span>21天 (稳健)</span>
          </div>

          {/* Sliding Pill */}
          <motion.div 
            className="absolute left-1 top-1 bottom-1 w-1/3 bg-white rounded-full shadow-md z-0"
            animate={{ 
              left: config.durationDays === 7 ? '4px' : config.durationDays === 14 ? '33%' : 'calc(66% - 4px)',
              width: '33%'
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />

          {/* Invisible Click Areas */}
          <div className="absolute inset-0 flex z-20">
            {[7, 14, 21].map((days) => (
              <button 
                key={days}
                onClick={() => onUpdate({ durationDays: days })}
                className="flex-1 h-full"
              />
            ))}
          </div>
        </div>

        {/* Dynamic Feedback */}
        <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${intensity.bg}`} />
            <span className="text-sm font-bold text-gray-700">每日负荷</span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className={`text-xl font-black ${intensity.color}`}>{dailyMinutes}</span>
            <span className="text-xs text-gray-400">分钟</span>
          </div>
        </div>
        
        {dailyMinutes > 40 && (
          <div className="mt-2 text-xs text-orange-500 font-medium text-center bg-orange-50 py-1 rounded-lg">
            ⚠️ 强度较大，建议减少目标或延长周期
          </div>
        )}
      </div>

      {/* Action */}
      <button 
        onClick={onNext}
        disabled={topicCount === 0}
        className={`w-full py-4 rounded-2xl font-bold text-lg transition-all shadow-xl ${
            topicCount === 0 
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
            : 'bg-black text-white hover:scale-[1.02] active:scale-[0.98] shadow-black/10'
        }`}
      >
        生成路线图
      </button>
    </motion.div>
  );
};

