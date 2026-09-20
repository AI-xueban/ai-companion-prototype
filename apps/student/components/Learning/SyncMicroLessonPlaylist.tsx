import React, { useMemo, useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ListMusic, Play, ChevronRight } from 'lucide-react';
import type { SyncMicroLesson } from '../../types/syncMicroLesson';
import {
  describeWatchStatus,
  formatDurationLabel,
  getSyncLessonProgressVersion,
  loadSyncLessonProgress,
  subscribeSyncLessonProgress,
  SYNC_MICRO_LESSON_COMPLETE_RATIO,
} from '../../services/syncMicroLessonProgress';
import { getSyncLessonDurationSec } from '../../utils/syncLessonDuration';
import {
  describeSyncPracticeStatus,
  getSyncBookProgressVersion,
  getSyncPracticeStatus,
  subscribeSyncBookProgress,
} from '../../services/syncProgressStore';
import {
  getStepPhase,
  getStepSortOrder,
  LearningPathStepList,
  type LearningPathStepView,
} from '../SubjectMap/SyncSectionPage';

interface SyncMicroLessonPlaylistProps {
  open: boolean;
  scopeLabel?: string;
  lessons: SyncMicroLesson[];
  activeLessonId?: number;
  loading?: boolean;
  onClose: () => void;
  onSelect: (lesson: SyncMicroLesson) => void;
  onEnterChapterQuiz?: () => void;
  footerLabel?: string;
  footerHint?: string;
  practiceMark?: {
    bookKey: string;
    practiceKey: string;
  };
  /** path：数学 / catalog 学·练路径；list：英语等平铺列表 */
  layout?: 'path' | 'list';
}

const SyncMicroLessonPlaylist: React.FC<SyncMicroLessonPlaylistProps> = ({
  open,
  scopeLabel,
  lessons,
  activeLessonId,
  loading = false,
  onClose,
  onSelect,
  onEnterChapterQuiz,
  footerLabel = '一课一练',
  footerHint = '看完微课后可测本章掌握',
  practiceMark,
  layout = 'path',
}) => {
  const progressVersion = useSyncExternalStore(subscribeSyncLessonProgress, getSyncLessonProgressVersion, () => 0);
  const practiceVersion = useSyncExternalStore(subscribeSyncBookProgress, getSyncBookProgressVersion, () => 0);
  const isPathLayout = layout === 'path';
  const practice = describeSyncPracticeStatus(
    practiceMark ? getSyncPracticeStatus(practiceMark.bookKey, practiceMark.practiceKey) : '未练习',
  );

  const pathSteps = useMemo(() => {
    if (!isPathLayout) return [];
    const videoSteps = lessons
      .map((lesson, index) => {
        const phaseText = `${lesson.topicTitle ?? ''} ${lesson.title}`;
        return {
          key: String(lesson.id),
          lesson,
          label: lesson.title,
          topicTitle: lesson.topicTitle,
          duration: formatDurationLabel(getSyncLessonDurationSec(lesson)),
          phase: getStepPhase(phaseText),
          sortBucket: getStepSortOrder(phaseText),
          originalIndex: index,
        };
      })
      .sort((a, b) => a.sortBucket - b.sortBucket || a.originalIndex - b.originalIndex);

    const rows: Array<{
      key: string;
      lesson?: SyncMicroLesson;
      label: string;
      topicTitle?: string;
      duration: string;
      phase: ReturnType<typeof getStepPhase>;
      isPracticeStep: boolean;
      isActive: boolean;
      status?: string;
      statusTone?: LearningPathStepView['statusTone'];
      progressRatio?: number;
    }> = videoSteps.map((step) => {
      const isActive = step.lesson.id === activeLessonId;
      const durationSec = getSyncLessonDurationSec(step.lesson);
      const saved = loadSyncLessonProgress(step.lesson.id);
      const watch = describeWatchStatus(
        saved,
        saved?.durationSec || durationSec,
        SYNC_MICRO_LESSON_COMPLETE_RATIO,
        isActive,
      );
      return {
        key: step.key,
        lesson: step.lesson,
        label: step.label,
        topicTitle: step.topicTitle,
        duration: step.duration,
        phase: step.phase,
        isPracticeStep: false,
        isActive,
        status: watch.status,
        statusTone: watch.tone,
        progressRatio: watch.ratio,
      };
    });

    if (onEnterChapterQuiz) {
      rows.push({
        key: 'section-practice',
        lesson: undefined,
        label: footerLabel.replace(/^进入/, '') || '一课一练',
        topicTitle: undefined,
        duration: '约10分钟',
        phase: 'practice',
        isPracticeStep: true,
        isActive: false,
        status: practice.status,
        statusTone: practice.tone,
      });
    }

    return rows;
  }, [activeLessonId, footerLabel, isPathLayout, lessons, onEnterChapterQuiz, practice.status, practice.tone, progressVersion, practiceVersion]);

  const handleSelect = (index: number) => {
    const step = pathSteps[index];
    if (!step) return;
    if (step.isPracticeStep) {
      onEnterChapterQuiz?.();
      return;
    }
    if (step.lesson) onSelect(step.lesson);
  };

  const renderListBody = () => {
    if (loading) {
      return <div className="py-10 text-center text-xs font-bold text-slate-400">加载中…</div>;
    }
    if (lessons.length === 0) {
      return <div className="py-10 text-center text-xs font-bold text-slate-400">本节暂无微课</div>;
    }
    if (isPathLayout) {
      return (
        <LearningPathStepList
          steps={pathSteps.map((step): LearningPathStepView => ({
            key: step.key,
            label: step.label,
            topicTitle: step.topicTitle,
            duration: step.duration,
            phase: step.phase,
            isPracticeStep: step.isPracticeStep,
            isActive: step.isActive,
            status: step.status,
            statusTone: step.statusTone,
            progressRatio: step.progressRatio,
          }))}
          onSelect={handleSelect}
          showIndex={false}
        />
      );
    }

    return (
      <div className="space-y-2">
        {lessons.map((lesson) => {
          const durationSec = getSyncLessonDurationSec(lesson);
          const saved = loadSyncLessonProgress(lesson.id);
          const isActive = lesson.id === activeLessonId;
          const watch = describeWatchStatus(saved, saved?.durationSec || durationSec, SYNC_MICRO_LESSON_COMPLETE_RATIO, isActive);
          const statusClass =
            watch.tone === 'active'
              ? 'text-orange-500'
              : watch.tone === 'done'
                ? 'text-emerald-600'
                : watch.tone === 'progress'
                  ? 'text-slate-500'
                  : 'text-slate-400';

          return (
            <button
              key={lesson.id}
              type="button"
              onClick={() => onSelect(lesson)}
              className={`relative w-full overflow-hidden flex gap-2.5 p-2 rounded-2xl text-left transition-all active:scale-[0.99] ${
                isActive
                  ? 'bg-indigo-50 border border-indigo-200 shadow-sm'
                  : 'bg-slate-50/80 border border-transparent hover:bg-indigo-50/50 hover:border-indigo-100'
              }`}
            >
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-200 shrink-0 flex items-center justify-center">
                {isActive ? (
                  <span className="text-[9px] font-black text-white bg-indigo-600 px-1.5 py-0.5 rounded">播</span>
                ) : (
                  <Play size={14} className="text-slate-500" fill="currentColor" />
                )}
              </div>
              <div className="flex-1 min-w-0 py-0.5">
                <p className={`text-xs font-black leading-snug line-clamp-2 ${isActive ? 'text-indigo-900' : 'text-slate-800'}`}>
                  {lesson.title}
                </p>
                <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                  {formatDurationLabel(durationSec)}
                </p>
                <p className={`text-[10px] font-bold mt-0.5 truncate ${statusClass}`}>
                  {watch.status}
                </p>
              </div>
              {watch.ratio > 0 ? (
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-black/5">
                  <span
                    className={`block h-full ${isActive ? 'bg-indigo-500' : watch.tone === 'done' ? 'bg-emerald-500' : 'bg-indigo-400'}`}
                    style={{ width: `${watch.ratio}%` }}
                  />
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
            aria-label="关闭播放列表"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            className="absolute top-0 right-0 bottom-0 z-50 w-[min(100%,320px)] bg-white shadow-2xl flex flex-col"
          >
            <div className="shrink-0 px-4 pt-4 pb-3 border-b border-slate-100 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-indigo-600">
                  <ListMusic size={14} />
                  <span className="text-xs font-black">播放列表</span>
                </div>
                {scopeLabel ? (
                  <p className="text-sm font-black text-slate-900 mt-1 truncate">{scopeLabel}</p>
                ) : null}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors shrink-0"
                aria-label="关闭"
              >
                <X size={18} />
              </button>
            </div>

            <div className={`flex-1 overflow-y-auto custom-scrollbar ${isPathLayout ? 'px-3.5 py-3' : 'p-3'}`}>
              {renderListBody()}
            </div>

            {!isPathLayout && onEnterChapterQuiz ? (
              <div className="shrink-0 p-3 pt-2 border-t border-slate-100 bg-white">
                <button
                  type="button"
                  onClick={onEnterChapterQuiz}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black shadow-lg shadow-indigo-200/60 active:scale-[0.98] transition-all"
                >
                  <span>{footerLabel}</span>
                  <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                    <ChevronRight size={14} />
                  </div>
                </button>
                <p className="text-[10px] text-slate-400 font-medium text-center mt-2">
                  {footerHint}
                </p>
              </div>
            ) : null}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default SyncMicroLessonPlaylist;
