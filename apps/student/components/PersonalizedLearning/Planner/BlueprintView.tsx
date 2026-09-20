import React from 'react';
import { motion } from 'framer-motion';
import { Map, Flag, Trophy, CheckCircle2, ChevronRight, RefreshCw } from 'lucide-react';
import { PlanConfig, PlannerState } from './types';

interface BlueprintViewProps {
  config: PlanConfig;
  diagnosis: PlannerState['diagnosis'];
  onBack: () => void;
  onCommit: () => void;
}

export const BlueprintView: React.FC<BlueprintViewProps> = ({ config, diagnosis, onBack, onCommit }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="h-full flex flex-col pt-20 pb-8 px-6 bg-gray-50/50"
    >
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-black text-gray-900">计划蓝图已就绪</h2>
        <p className="text-gray-500 text-sm">这是你未来 {config.durationDays} 天的通关路线。</p>
      </div>

      {/* Ticket / Receipt Style Card */}
      <div className="flex-1 bg-white rounded-3xl shadow-xl shadow-gray-200/50 overflow-hidden flex flex-col mb-6 border border-gray-100 relative">
        {/* Top Decorative Edge (Simulating perforated paper) */}
        <div className="absolute top-0 left-0 right-0 h-4 bg-brand/5" />
        
        {/* Header Section */}
        <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-b border-blue-100">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">PLAN ID: #8291</div>
              <h3 className="text-xl font-black text-gray-900">几何专项突破</h3>
            </div>
            <div className="bg-white p-2 rounded-xl shadow-sm">
              <Map className="text-brand" size={24} />
            </div>
          </div>
          <div className="flex gap-4">
             <div className="bg-white/60 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-800">
               {config.durationDays} 天周期
             </div>
             <div className="bg-white/60 px-3 py-1.5 rounded-lg text-xs font-bold text-blue-800">
               {config.selectedTopics.length} 个核心点
             </div>
          </div>
        </div>

        {/* Timeline / Roadmap List */}
        <div className="flex-1 overflow-y-auto p-6 relative">
          {/* Vertical Line */}
          <div className="absolute left-9 top-6 bottom-6 w-0.5 bg-gray-100" />

          {/* Milestones */}
          <div className="space-y-6 relative z-10">
            {/* Start */}
            <div className="flex gap-4">
              <div className="w-6 h-6 rounded-full bg-green-500 border-4 border-white shadow-sm flex-shrink-0 z-10" />
              <div>
                <div className="text-xs font-bold text-gray-400 mb-1">Day 1</div>
                <div className="text-sm font-bold text-gray-900">前测诊断 & 基础回顾</div>
                <div className="text-xs text-gray-500 mt-1">包含: {diagnosis.recommendedTopics[0]?.name}</div>
              </div>
            </div>

            {/* Middle */}
            <div className="flex gap-4">
              <div className="w-6 h-6 rounded-full bg-blue-100 border-4 border-white shadow-sm flex items-center justify-center flex-shrink-0 z-10">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
              </div>
              <div>
                <div className="text-xs font-bold text-gray-400 mb-1">Day {Math.floor(config.durationDays / 2)}</div>
                <div className="text-sm font-bold text-gray-900">专项强化训练</div>
                <div className="text-xs text-gray-500 mt-1">攻克重难点与易错题</div>
              </div>
            </div>

            {/* End */}
            <div className="flex gap-4">
              <div className="w-6 h-6 rounded-full bg-yellow-100 border-4 border-white shadow-sm flex items-center justify-center flex-shrink-0 z-10">
                <Flag size={12} className="text-yellow-600 fill-yellow-600" />
              </div>
              <div>
                <div className="text-xs font-bold text-gray-400 mb-1">Day {config.durationDays}</div>
                <div className="text-sm font-bold text-gray-900">全真模拟通关</div>
                <div className="text-xs text-gray-500 mt-1">点亮图谱所有节点</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Promise Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center gap-3">
          <Trophy size={16} className="text-yellow-500" />
          <span className="text-xs text-gray-500 font-medium">预计掌握度将提升至 <span className="text-green-600 font-bold">92%</span></span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button 
          onClick={onBack}
          className="px-4 py-4 rounded-2xl font-bold text-gray-500 bg-gray-200 hover:bg-gray-300 transition-colors"
        >
          <RefreshCw size={20} />
        </button>
        <button 
          onClick={onCommit}
          className="flex-1 bg-black text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-black/10"
        >
          <CheckCircle2 className="text-green-400" size={20} />
          签收并执行计划
        </button>
      </div>
    </motion.div>
  );
};

