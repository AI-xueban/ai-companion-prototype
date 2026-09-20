
import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { VideoLesson } from './VideoLesson';
import { QuizPage } from '../Quiz/QuizPage';
import { ArticleReader } from './ArticleReader';
import { Task, UserStats } from '../../types';
import { RewardGrantResult } from '../../types/reward';
import { isKgMicroLessonTask, isKgScopeMicroLessonTask } from '../../utils/kgMicroLesson';
import type { LearningExitReason } from '../../types/learningReturn';

interface LearningFlowProps {
  onExit: (reason?: LearningExitReason) => void;
  task?: Task | null;
  showVideo?: boolean;
  onStartRemedial?: (qs: any[]) => void;
  onRewardGranted?: (result: RewardGrantResult) => void;
  onTaskComplete?: (task: Task) => void;
  todayTaskIds?: string[];
  userStats?: UserStats;
}

type Phase = 'video' | 'quiz' | 'review' | 'reading';

export const LearningFlow: React.FC<LearningFlowProps> = ({
  onExit,
  task,
  showVideo = true,
  onStartRemedial,
  onRewardGranted,
  onTaskComplete,
  todayTaskIds,
  userStats,
}) => {
  const scopeSyncLesson = isKgScopeMicroLessonTask(task);
  const knowledgeMicroOnly = isKgMicroLessonTask(task) && !scopeSyncLesson;

  const [phase, setPhase] = useState<Phase>(() => {
       // 1. 如果是明确的阅读类任务（如时事新闻），直接去阅读页
       if (task?.quizType === 'reading') {
        return 'reading';
    }

    // 2. 课本同步学视频封面 / 微课：无论学科都先进入播放器
    if (showVideo && isKgMicroLessonTask(task)) {
        return 'video';
    }

    // 3. 主科（数学、语文、英语）优先进入视频/互动课程
    if (task?.subject === '数学' || task?.subject === '语文' || task?.subject === '英语') {
        return showVideo ? 'video' : 'quiz';
    }

    // 4. 其他“宝箱”类任务（如科学、逻辑、百科等），进入阅读/探索页
    if (task?.subject === '时事' || task?.subject === '阅读' || task?.levelType === 'chest') {
        return 'reading';
    }

    // 5. 练习或BOSS挑战 -> 进入测验
    if (task?.levelType === 'practice' || task?.levelType === 'boss') {
        return 'quiz';
    }
      return showVideo ? 'video' : 'quiz';
  });

  return (
    <div className="w-full h-full bg-white relative overflow-hidden">
      <AnimatePresence mode="wait">
        {phase === 'reading' ? (
          <motion.div
            key="reading"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-full h-full"
          >
            <ArticleReader 
                task={task}
                onExit={() => onExit('abort')}
                onComplete={() => onExit('complete')}
            />
          </motion.div>
        ) : phase === 'video' ? (
          <motion.div 
            key="video"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full h-full"
          >
            <VideoLesson 
                mode="learn"
                onComplete={(action) => {
                  if (action === 'lesson-practice') {
                    onExit('lesson-practice');
                    return;
                  }
                  if (task?.sectionVideoPlaylist) {
                    onExit('complete');
                    return;
                  }
                  if (scopeSyncLesson) {
                    setPhase('quiz');
                    return;
                  }
                  if (knowledgeMicroOnly) {
                    onExit('complete');
                    return;
                  }
                  setPhase('quiz');
                }}
                onExit={() => onExit('abort')}
                task={task}
                onRewardGranted={onRewardGranted}
            />
          </motion.div>
        ) : phase === 'quiz' ? (
          <motion.div 
            key="quiz"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="w-full h-full"
          >
             <QuizPage 
                onExit={(reason) => onExit(reason ?? 'abort')}
                onReview={() => setPhase('review')}
                task={task} 
                onStartRemedial={onStartRemedial}
                onRewardGranted={onRewardGranted}
                onTaskComplete={onTaskComplete}
                todayTaskIds={todayTaskIds}
                userStats={userStats}
             />
          </motion.div>
        ) : (
          <motion.div 
            key="review"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full h-full"
          >
            <VideoLesson 
                mode="review"
                onComplete={() => onExit('complete')}
                onExit={() => onExit('abort')}
                task={task}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
