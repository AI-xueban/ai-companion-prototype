
import React, { useState } from 'react';
import { motion as motionOriginal, AnimatePresence } from 'framer-motion';
import { DayPlan, Task } from '../../types';
import { CheckCircle2, Circle, GripVertical, Clock, Sparkles, Play, Rocket, Lock } from 'lucide-react';

const motion = motionOriginal as any;

interface TaskStreamProps {
  plan: DayPlan | null;
  onStartQuiz: (task: Task) => void;
}

export const TaskStream: React.FC<TaskStreamProps> = ({ plan, onStartQuiz }) => {
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

  // Skeleton Loading State
  if (!plan) {
      return (
          <div className="flex flex-col gap-4">
              {[1, 2, 3].map(i => (
                  <div key={i} className="p-4 rounded-2xl border border-gray-100 bg-white shadow-sm flex items-center gap-4 animate-pulse">
                      <div className="w-5 h-5 rounded-full bg-gray-200"></div>
                      <div className="flex-1">
                          <div className="w-24 h-3 bg-gray-200 rounded mb-2"></div>
                          <div className="w-48 h-4 bg-gray-200 rounded"></div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-gray-100"></div>
                  </div>
              ))}
              <div className="text-center text-xs font-bold text-gray-400 mt-2 flex items-center justify-center gap-2">
                  <Sparkles size={12} className="animate-spin" />
                  小晤 正在生成今日计划...
              </div>
          </div>
      );
  }

  const toggleTask = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    const next = new Set(completedTasks);
    if (next.has(taskId)) {
      next.delete(taskId);
    } else {
      next.add(taskId);
    }
    setCompletedTasks(next);
  };

  return (
    <div className="flex flex-col gap-2.5">
        {plan.tasks.map((task, index) => {
            const isAssessment = task.id === 'task-assess';

            // Special Render for Assessment Task (Newbie Onboarding)
            if (isAssessment) {
                return (
                    <motion.div 
                        id={index === 0 ? "guide-task-first" : undefined} // Tagging for guide
                        key={task.id}
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => onStartQuiz(task)}
                        className="p-[1px] rounded-[20px] bg-gradient-to-r from-brand to-purple-600 shadow-lg cursor-pointer group hover:scale-[1.01] transition-transform"
                    >
                        <div className="bg-slate-900/40 backdrop-blur-sm p-3.5 rounded-[19px] flex items-center gap-3 h-full">
                            <div className="w-10 h-10 rounded-full bg-white text-brand flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform shrink-0">
                                <Rocket size={20} fill="currentColor" />
                            </div>
                            <div className="flex-1 text-white min-w-0">
                                <h4 className="font-black text-sm mb-0.5 truncate">{task.title}</h4>
                                <p className="text-white/60 text-[10px] font-medium flex items-center gap-1">
                                    <Sparkles size={10} className="text-brand-light" /> {task.aiReasoning}
                                </p>
                            </div>
                            <div className="bg-white/10 p-2 rounded-full text-white/80 group-hover:bg-white/20 group-hover:text-white transition-colors">
                                <Play size={16} fill="currentColor" />
                            </div>
                        </div>
                    </motion.div>
                );
            }

            const isCompleted = completedTasks.has(task.id);

            return (
                <motion.div 
                    id={index === 0 ? "guide-task-first" : undefined} // Tagging for guide
                    key={task.id}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-3 rounded-[20px] flex items-center gap-3 group/task transition-all border cursor-pointer ${
                        isCompleted 
                        ? 'bg-white/2 border-white/5 opacity-40' 
                        : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 hover:shadow-[0_8px_20px_rgba(0,0,0,0.2)]'
                    }`}
                    onClick={(e) => {
                        e.stopPropagation(); 
                        onStartQuiz(task); 
                    }}
                >
                    <div className="text-white/10 cursor-grab active:cursor-grabbing hover:text-white/30 transition-colors" onClick={(e) => e.stopPropagation()}>
                        <GripVertical size={16} />
                    </div>
                    
                    <button 
                        onClick={(e) => toggleTask(e, task.id)}
                        className={`transition-all duration-300 ${isCompleted ? 'text-brand' : 'text-white/20 hover:text-white/40'}`}
                    >
                        {isCompleted ? (
                            <div className="w-5 h-5 bg-brand rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(108,93,211,0.5)]">
                                <CheckCircle2 size={14} className="text-white" />
                            </div>
                        ) : (
                            <Circle size={20} strokeWidth={1.5} />
                        )}
                    </button>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md uppercase tracking-tight ${
                                task.subject === '数学' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/20' :
                                task.subject === '语文' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/20' :
                                task.subject === '英语' ? 'bg-green-500/20 text-green-400 border border-green-500/20' :
                                'bg-white/5 text-white/40 border border-white/10'
                            }`}>
                                {task.subject}
                            </span>
                            <div className="flex items-center gap-1 text-white/30 text-[10px] font-bold">
                                <Clock size={10} />
                                {task.durationMinutes}m
                            </div>
                        </div>
                        <h4 className={`font-bold text-white text-sm truncate ${isCompleted ? 'line-through opacity-50' : ''}`}>
                            {task.title}
                        </h4>
                        {task.aiReasoning && !isCompleted && (
                            <p className="text-[10px] text-brand-light/60 mt-0.5 flex items-center gap-1 truncate">
                                <Sparkles size={10} className="shrink-0" /> {task.aiReasoning}
                            </p>
                        )}
                    </div>

                    {/* Start Action */}
                    <div className="flex items-center">
                        <button className="w-8 h-8 rounded-full bg-white/5 text-white/40 flex items-center justify-center group-hover/task:bg-brand group-hover/task:text-white group-hover/task:shadow-[0_4px_12px_rgba(108,93,211,0.3)] transition-all">
                            <Play size={12} fill="currentColor" className="ml-0.5" />
                        </button>
                    </div>
                </motion.div>
            );
        })}
    </div>
  );
};
