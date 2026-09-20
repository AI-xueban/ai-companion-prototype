import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, History } from 'lucide-react';
import { ExpeditionPlanHistoryRecord, Task } from '../../types';
import {
  formatPlanPeriodLabel,
  formatTimelineMonth,
  getExpeditionPlanHistory,
  getHistoryTimelineDate,
  getPlanLearningDays,
  getTimelineMonthKey,
} from './expeditionPlanHistory';
import { Annotatable } from '../Prototype/Annotatable';
import { HistoryLevelPanel } from './HistoryLevelSidePanel';
import { VideoLesson } from '../Learning/VideoLesson';

interface ExpeditionPlanHistoryPageProps {
  onBack: () => void;
  onReviewLevel: (record: ExpeditionPlanHistoryRecord, levelIndex: number, levelTitle: string) => void;
}

const SUBJECT_STYLE: Record<string, { block: string; tag: string; cardAccent: string }> = {
  数学: {
    block: 'bg-blue-500',
    tag: 'bg-blue-50 text-blue-700',
    cardAccent: 'border-blue-200/80',
  },
  语文: {
    block: 'bg-red-500',
    tag: 'bg-red-50 text-red-700',
    cardAccent: 'border-red-200/80',
  },
  英语: {
    block: 'bg-green-500',
    tag: 'bg-green-50 text-green-700',
    cardAccent: 'border-green-200/80',
  },
};

const DEFAULT_SUBJECT_STYLE = {
  block: 'bg-slate-400',
  tag: 'bg-slate-50 text-slate-600',
  cardAccent: 'border-slate-200/80',
};

export const ExpeditionPlanHistoryPage: React.FC<ExpeditionPlanHistoryPageProps> = ({
  onBack,
  onReviewLevel,
}) => {
  const records = getExpeditionPlanHistory();
  const [selectedRecord, setSelectedRecord] = useState<ExpeditionPlanHistoryRecord | null>(null);
  const [videoTask, setVideoTask] = useState<Task | null>(null);
  const hasSelection = selectedRecord !== null;

  return (
    <div className="absolute inset-0 flex flex-col bg-[#F0F4F8] z-30">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-[#F5F7FA] via-[#F0F4F8] to-[#Eef2f6]" />
        <div className="absolute top-[-10%] left-[-20%] w-[70%] h-[50%] bg-indigo-400/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-50 flex items-center gap-3 px-6 pt-4 pb-3 shrink-0 bg-[#F0F4F8]/95 backdrop-blur-md border-b border-slate-200/40">
        <button
          type="button"
          onClick={onBack}
          aria-label="返回"
          className="shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-200/80 text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex-1 min-w-0 flex items-center gap-2 min-h-[36px] pt-0.5">
          <History size={18} className="text-indigo-500 shrink-0" />
          <h1 className="text-lg font-black text-slate-700 truncate">历史记录</h1>
        </div>
      </div>

      <div className="relative flex-1 flex min-h-0 overflow-hidden">
        <motion.div
          layout
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          className={`relative z-10 flex flex-col min-h-0 ${
            hasSelection
              ? 'w-[min(100%,480px)] shrink-0 border-r border-slate-200/50'
              : 'flex-1'
          }`}
        >
          <Annotatable
            annotationId="subject.expedition-history"
            className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 pb-8"
          >
            <motion.div
              layout
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className={`pt-2 ${hasSelection ? '' : 'max-w-2xl mx-auto w-full'}`}
            >
              {records.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                    <History size={28} className="text-slate-300" />
                  </div>
                  <p className="text-sm font-bold text-slate-500">暂无历史计划</p>
                  <p className="text-xs text-slate-400 mt-1">生成专属路径后，记录会出现在这里</p>
                </div>
              ) : (
                <HistoryAchievementList
                  records={records}
                  selectedRecord={selectedRecord}
                  onSelect={setSelectedRecord}
                />
              )}
            </motion.div>
          </Annotatable>
        </motion.div>

        <AnimatePresence>
          {selectedRecord && (
            <motion.div
              key="history-level-panel"
              initial={{ opacity: 0, x: 48 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 48 }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="relative z-10 flex-1 min-w-0"
            >
              <HistoryLevelPanel
                key={selectedRecord.id}
                record={selectedRecord}
                onReviewLevel={(levelIndex, levelTitle) =>
                  onReviewLevel(selectedRecord, levelIndex, levelTitle)
                }
                onWatchLevelVideo={(levelIndex, levelTitle) => {
                  setVideoTask({
                    id: `${selectedRecord.id}-level-${levelIndex + 1}`,
                    title: levelTitle,
                    subject: selectedRecord.subject,
                    durationMinutes: 15,
                    completed: true,
                    levelType: levelIndex === selectedRecord.levelCount - 1 ? 'boss' : 'level',
                  });
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {videoTask && (
          <motion.div
            key={`history-video-${videoTask.id}`}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="absolute inset-0 z-50 bg-white"
          >
            <VideoLesson
              mode="review"
              task={videoTask}
              onComplete={() => setVideoTask(null)}
              onExit={() => setVideoTask(null)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const HistoryAchievementList: React.FC<{
  records: ExpeditionPlanHistoryRecord[];
  selectedRecord: ExpeditionPlanHistoryRecord | null;
  onSelect: (record: ExpeditionPlanHistoryRecord) => void;
}> = ({ records, selectedRecord, onSelect }) => {
  let lastMonthKey = '';

  return (
    <div className="space-y-1 py-1">
      {records.map((record, index) => {
        const timelineDate = getHistoryTimelineDate(record);
        const monthKey = getTimelineMonthKey(timelineDate);
        const showMonth = monthKey !== lastMonthKey;
        lastMonthKey = monthKey;

        return (
          <React.Fragment key={record.id}>
            {showMonth && (
              <div className="sticky top-0 z-10 py-2.5 mb-1 bg-[#F0F4F8]/95 backdrop-blur-sm">
                <span className="text-xs font-black text-slate-500 tracking-wide">
                  {formatTimelineMonth(timelineDate)}
                </span>
              </div>
            )}
            <HistoryAchievementCard
              record={record}
              index={index}
              selected={selectedRecord?.id === record.id}
              onSelect={() => onSelect(record)}
            />
          </React.Fragment>
        );
      })}
    </div>
  );
};

const HistoryAchievementCard: React.FC<{
  record: ExpeditionPlanHistoryRecord;
  index: number;
  selected: boolean;
  onSelect: () => void;
}> = ({ record, index, selected, onSelect }) => {
  const levelText = `${record.completedLevels ?? record.levelCount}/${record.levelCount} 关`;
  const learningDays = getPlanLearningDays(record);
  const periodLabel = formatPlanPeriodLabel(record);
  const subjectStyle = SUBJECT_STYLE[record.subject] ?? DEFAULT_SUBJECT_STYLE;

  return (
    <motion.button
      type="button"
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={`w-full text-left rounded-[20px] bg-white/90 backdrop-blur border shadow-sm overflow-hidden transition-all px-4 py-3.5 mb-3 ${
        selected
          ? 'ring-2 ring-indigo-200/70 border-indigo-400 shadow-md'
          : `${subjectStyle.cardAccent} hover:shadow-md hover:border-indigo-200/60`
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="text-sm font-black text-slate-800 truncate flex-1 min-w-0">{record.planName}</h3>
        <span
          className={`shrink-0 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-black ${subjectStyle.tag}`}
        >
          <span className={`w-2 h-2 rounded-[3px] shrink-0 ${subjectStyle.block}`} />
          {record.subject}
        </span>
      </div>

      <p className="text-[11px] text-slate-500 leading-relaxed">
        <span className="font-bold text-slate-600 tabular-nums">{periodLabel}</span>
        <span className="text-emerald-500 ml-0.5">✓</span>
        <span className="mx-1.5 text-slate-300">·</span>
        <span className="font-bold text-slate-600">累计 {learningDays} 天</span>
        <span className="mx-1.5 text-slate-300">·</span>
        <span className="font-bold text-slate-600">{levelText}</span>
      </p>
    </motion.button>
  );
};
