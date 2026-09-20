import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Zap, Target, TrendingUp } from 'lucide-react';
import { PlannerState } from './types';

interface DiagnosticViewProps {
  diagnosis: PlannerState['diagnosis'];
  onNext: () => void;
}

export const DiagnosticView: React.FC<DiagnosticViewProps> = ({ diagnosis, onNext }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="h-full flex flex-col pt-20 pb-8 px-6"
    >
      {/* Title */}
      <div className="mb-8">
        <h2 className="text-2xl font-black text-gray-900 mb-2">
          发现 {diagnosis.weaknessCount} 个<br/>
          <span className="text-brand">提分潜力点</span>
        </h2>
        <p className="text-gray-500 text-sm leading-relaxed">
          基于你的知识图谱，这些薄弱环节正在<br/>阻碍你突破高分瓶颈。
        </p>
      </div>

      {/* Radar Chart Visualization (Abstract) */}
      <div className="flex-1 flex items-center justify-center relative mb-8">
        <div className="w-64 h-64 relative">
          {/* Background Circles */}
          {[1, 0.75, 0.5, 0.25].map((scale, i) => (
            <div 
              key={i} 
              className="absolute inset-0 rounded-full border border-gray-100"
              style={{ transform: `scale(${scale})` }}
            />
          ))}
          
          {/* Radar Blob */}
          <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full drop-shadow-xl overflow-visible">
            <motion.path
              d="M 50 10 L 85 35 L 75 80 L 25 80 L 15 35 Z"
              fill="rgba(59, 130, 246, 0.2)"
              stroke="#3B82F6"
              strokeWidth="2"
              initial={{ d: "M 50 50 L 50 50 L 50 50 L 50 50 L 50 50 Z" }}
              animate={{ d: "M 50 10 L 85 35 L 75 80 L 25 80 L 15 35 Z" }}
              transition={{ duration: 1, ease: "backOut" }}
            />
            {/* Dots */}
            {[
              { x: 50, y: 10, label: '代数' },
              { x: 85, y: 35, label: '几何' },
              { x: 75, y: 80, label: '统计' },
              { x: 25, y: 80, label: '数论' },
              { x: 15, y: 35, label: '逻辑' }
            ].map((p, i) => (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r="3" fill="#3B82F6" className="animate-pulse" />
                <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize="4" fill="#64748B" className="font-bold">{p.label}</text>
              </g>
            ))}
          </svg>

          {/* Floating Insight Card */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="absolute -bottom-4 -right-4 bg-white p-3 rounded-2xl shadow-lg border border-gray-100 flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
              <TrendingUp size={16} />
            </div>
            <div>
              <div className="text-xs text-gray-400">预计提分</div>
              <div className="text-sm font-bold text-gray-900">+{diagnosis.predictedScoreBoost} 分</div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Plan Summary Card */}
      <div className="bg-gray-50 rounded-2xl p-5 mb-8 border border-gray-100">
        <div className="flex items-center gap-3 mb-3">
          <Target className="text-brand" size={20} />
          <span className="font-bold text-gray-800">推荐方案：中考重点突击</span>
        </div>
        <div className="flex justify-between text-sm">
          <div className="flex flex-col">
            <span className="text-gray-400 text-xs mb-1">周期</span>
            <span className="font-medium text-gray-900">14 天</span>
          </div>
          <div className="w-px h-8 bg-gray-200" />
          <div className="flex flex-col">
            <span className="text-gray-400 text-xs mb-1">每日投入</span>
            <span className="font-medium text-gray-900">25 分钟</span>
          </div>
          <div className="w-px h-8 bg-gray-200" />
          <div className="flex flex-col">
            <span className="text-gray-400 text-xs mb-1">任务量</span>
            <span className="font-medium text-gray-900">12 关卡</span>
          </div>
        </div>
      </div>

      {/* Primary Action */}
      <button 
        onClick={onNext}
        className="w-full bg-black text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-black/10"
      >
        <Zap className="fill-yellow-400 text-yellow-400" size={20} />
        开启提分计划
        <ArrowRight size={20} className="opacity-50" />
      </button>
      
      <div className="text-center mt-4">
        <button className="text-sm text-gray-400 font-medium hover:text-gray-600">
          我想先做个测试
        </button>
      </div>
    </motion.div>
  );
};

