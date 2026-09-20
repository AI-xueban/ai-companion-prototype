import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  describeWatchStatus,
  getSyncLessonProgressVersion,
  loadSyncLessonProgress,
  makeSectionVideoItemId,
  makeSectionVideoProgressId,
  subscribeSyncLessonProgress,
  type WatchStatusTone,
} from '../../services/syncMicroLessonProgress';
import {
  describeSyncPracticeStatus,
  getSyncBookProgressVersion,
  getSyncPracticeStatus,
  subscribeSyncBookProgress,
} from '../../services/syncProgressStore';
import {
  BookA,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  Clock,
  Compass,
  Flag,
  Globe2,
  Headphones,
  Lightbulb,
  type LucideIcon,
  Mic,
  PenTool,
  Play,
  Puzzle,
  Target,
} from 'lucide-react';
import {
  resolveOtherSubjectVideoTag,
  stripVideoNameFromSource,
  type SyncVideoTagContext,
} from '../../data/syncVideoTagRules';

export interface SyncSectionVideo {
  tag: string;
  title: string;
}

export interface SyncSectionTopic {
  section: string;
  videos: SyncSectionVideo[];
}

export interface SectionVideoPlayItem {
  topic: SyncSectionTopic;
  video: SyncSectionVideo;
  videoIndex: number;
  title: string;
  topicTitle?: string;
}

interface SyncSectionPageProps {
  open: boolean;
  unitTitle: string;
  topics: SyncSectionTopic[];
  layout?: 'grid' | 'path';
  /** 学习页叶子叫法：小节 / 课时 / 课文 等，用于无视频轻提示 */
  lessonNoun?: string;
  /**
   * 非语文：主标题用视频名，类型标签（知识精讲等）靠右小标签。
   * 语文大卡：仍以环节名（课前导学等）为主，不走此规则。
   */
  preferVideoName?: boolean;
  /** 当前学科，用于 §7.4 标签归类（学 / 练） */
  subject?: string;
  /** 章 / 单元名，供历史 / 道法「课文精讲」上下文匹配 */
  catalogUnitTitle?: string;
  /** 课时切换模式：左侧课时独立列表，切换刷新右侧学/练内容（仅多课时且启用时生效） */
  periodSwitcher?: boolean;
  /** 上次学习到的课时名（period.section），用于在左侧课时列表标记"上次学习" */
  lastStudiedSection?: string;
  /**
   * §7.8.3 视频未上线 / 正在上架中：本课视频元数据在目录里，但资源还没上架 / 未过审。
   * 开启后学习页直接拦住不进播放器：视频条目不可点、标「未上线」、用占位封面；
   * 一课一练入口仍保留。顶部给一条「视频正在上架中」说明条。
   */
  videoPending?: boolean;
  onBack: () => void;
  onPlayVideo: (
    topic: SyncSectionTopic,
    video: SyncSectionVideo,
    index: number,
    playlist: SectionVideoPlayItem[],
  ) => void;
  onStartPractice?: () => void;
  practiceMark?: {
    bookKey: string;
    practiceKey: string;
  };
}

function useSyncPracticeView(mark?: { bookKey: string; practiceKey: string }) {
  useSyncExternalStore(subscribeSyncBookProgress, getSyncBookProgressVersion, () => 0);
  if (!mark) return describeSyncPracticeStatus('未练习');
  return describeSyncPracticeStatus(getSyncPracticeStatus(mark.bookKey, mark.practiceKey));
}

function hashText(text: string) {
  return Math.abs([...text].reduce((hash, char) => ((hash * 31) + char.charCodeAt(0)) | 0, 0));
}

const PATH_STYLES: Array<{
  match?: string;
  Icon: LucideIcon;
  from: string;
  to: string;
  accent: string;
  blob: string;
}> = [
  { match: '单元目标', Icon: Target, from: '#EEF2FF', to: '#E0E7FF', accent: '#4F46E5', blob: '#A5B4FC' },
  { match: '巧记单词', Icon: BookA, from: '#FFF7ED', to: '#FFEDD5', accent: '#EA580C', blob: '#FDBA74' },
  { match: '阅读', Icon: BookOpen, from: '#EEF2FF', to: '#E0E7FF', accent: '#4F46E5', blob: '#A5B4FC' },
  { match: '听力', Icon: Headphones, from: '#ECFEFF', to: '#CFFAFE', accent: '#0891B2', blob: '#67E8F9' },
  { match: '语法', Icon: Lightbulb, from: '#FFFBEB', to: '#FEF3C7', accent: '#D97706', blob: '#FCD34D' },
  { match: '写作', Icon: PenTool, from: '#ECFDF5', to: '#D1FAE5', accent: '#059669', blob: '#6EE7B7' },
  { match: '口语', Icon: Mic, from: '#FDF2F8', to: '#FCE7F3', accent: '#DB2777', blob: '#F9A8D4' },
  { match: '文化', Icon: Globe2, from: '#F0FDFA', to: '#CCFBF1', accent: '#0D9488', blob: '#5EEAD4' },
  { match: '项目', Icon: Puzzle, from: '#F5F3FF', to: '#EDE9FE', accent: '#7C3AED', blob: '#C4B5FD' },
  { match: '跨学科', Icon: Puzzle, from: '#F5F3FF', to: '#EDE9FE', accent: '#7C3AED', blob: '#C4B5FD' },
  { match: '导学', Icon: Compass, from: '#FFF7ED', to: '#FFEDD5', accent: '#EA580C', blob: '#FDBA74' },
  { match: '解读', Icon: BookOpen, from: '#EEF2FF', to: '#E0E7FF', accent: '#4F46E5', blob: '#A5B4FC' },
  { match: '巩固', Icon: PenTool, from: '#ECFDF5', to: '#D1FAE5', accent: '#059669', blob: '#6EE7B7' },
  { match: '精讲', Icon: Clapperboard, from: '#F5F3FF', to: '#EDE9FE', accent: '#7C3AED', blob: '#C4B5FD' },
  { match: '视频', Icon: Clapperboard, from: '#F5F3FF', to: '#EDE9FE', accent: '#7C3AED', blob: '#C4B5FD' },
  { match: '练习', Icon: PenTool, from: '#ECFDF5', to: '#D1FAE5', accent: '#059669', blob: '#6EE7B7' },
  { match: '知识', Icon: Lightbulb, from: '#FFFBEB', to: '#FEF3C7', accent: '#D97706', blob: '#FCD34D' },
  { match: '新课标', Icon: Flag, from: '#EEF2FF', to: '#E0E7FF', accent: '#4F46E5', blob: '#A5B4FC' },
  { match: '词汇', Icon: BookA, from: '#FFF7ED', to: '#FFEDD5', accent: '#EA580C', blob: '#FDBA74' },
];

export function getPathStyle(tag: string, index: number) {
  return PATH_STYLES.find((item) => item.match && tag.includes(item.match)) ?? PATH_STYLES[index % 4];
}

function getCoverMeta(topic: SyncSectionTopic, video: SyncSectionVideo, index: number) {
  const hash = hashText(`${topic.section}-${video.tag}-${index}`);
  return {
    duration: `${5 + (hash % 8)}:${String((hash >> 3) % 60).padStart(2, '0')}`,
  };
}

function compactGridVideoLabel(tag: string, section: string, unitTitle: string) {
  let label = tag.trim();
  for (const prefix of [section, unitTitle]) {
    const trimmed = prefix.trim();
    if (!trimmed) continue;
    if (label.startsWith(`${trimmed} · `)) label = label.slice(trimmed.length + 3);
    else if (label.startsWith(`${trimmed}·`)) label = label.slice(trimmed.length + 1);
    else if (label.startsWith(`${trimmed} `)) label = label.slice(trimmed.length).trim();
  }
  return label.trim() || tag;
}

/** 主标题用视频名；展示标签靠右；学 / 练按 §7.4.1 */
function resolvePathStepDisplay(
  video: SyncSectionVideo,
  topicSection: string,
  unitTitle: string,
  tagCtx: SyncVideoTagContext,
) {
  const strippedTag = compactGridVideoLabel(video.tag || '', topicSection, unitTitle);
  const strippedTitle = compactGridVideoLabel(video.title || '', topicSection, unitTitle);
  const source = [video.tag, video.title, strippedTag, strippedTitle].filter(Boolean).join(' ');

  if (tagCtx.subject === '英语') {
    const name = strippedTitle || strippedTag || video.title || video.tag || '同步微课';
    const tagLabel = video.tag && video.tag !== name ? video.tag : '';
    return { name, tagLabel, phase: 'learn' as LearningPathPhase, phaseSource: source };
  }

  const classified = resolveOtherSubjectVideoTag(source, {
    ...tagCtx,
    sectionTitle: tagCtx.sectionTitle || topicSection,
    lessonTitle: tagCtx.lessonTitle || unitTitle,
  });
  const preferSource = strippedTitle || strippedTag || video.title || video.tag || '';
  let name = stripVideoNameFromSource(preferSource, classified.displayTags);
  if (video.tag?.includes(' · ')) {
    const head = video.tag.split(' · ')[0]?.trim();
    if (head) name = head;
  }
  if (!name || classified.displayTags.includes(name)) {
    name = stripVideoNameFromSource(preferSource, classified.displayTags);
  }
  if (!name && topicSection && topicSection !== unitTitle) name = topicSection;
  if (!name) name = preferSource || '同步微课';

  // 「历史其他 / 地理其他」等仅作异常归类，不在学习路径上展示
  const tagLabel = classified.isOther
    ? ''
    : classified.displayTags.filter((tag) => tag && tag !== name).join('、');
  return {
    name,
    tagLabel,
    phase: classified.phase as LearningPathPhase,
    phaseSource: source,
  };
}

export type LearningPathPhase = 'learn' | 'practice';

export function getStepPhase(tag: string, subject = '数学'): LearningPathPhase {
  return resolveOtherSubjectVideoTag(tag, { subject }).phase;
}

export const PHASE_META = {
  learn: { label: '学', hint: '知识理解、教材讲解、方法学习' },
  practice: { label: '练', hint: '题型训练、考试应用、易错巩固' },
} as const;

export function getStepSortOrder(tag: string, subject = '数学') {
  return getStepPhase(tag, subject) === 'learn' ? 0 : 1;
}

export interface LearningPathStepView {
  key: string;
  label: string;
  tagLabel?: string;
  topicTitle?: string;
  duration: string;
  phase: LearningPathPhase;
  isPracticeStep?: boolean;
  isActive?: boolean;
  status?: string;
  statusTone?: WatchStatusTone;
  progressRatio?: number;
}

const STATUS_TONE_CLASS: Record<WatchStatusTone, string> = {
  active: 'text-orange-500',
  done: 'text-emerald-600',
  progress: 'text-slate-500',
  muted: 'text-slate-400',
};

export function LearningPathStepList({
  steps,
  onSelect,
  showIndex = true,
}: {
  steps: LearningPathStepView[];
  onSelect: (index: number) => void;
  showIndex?: boolean;
}) {
  if (steps.length === 0) return null;

  let lastPhase: LearningPathPhase | null = null;

  return (
    <>
      {steps.map((step, index) => {
        const style = getPathStyle(step.tagLabel || step.label, index);
        const Icon = step.isPracticeStep ? PenTool : style.Icon;
        const isPracticeStep = Boolean(step.isPracticeStep);
        const showPhase = !isPracticeStep && step.phase !== lastPhase;
        if (showPhase) lastPhase = step.phase;
        const phaseMeta = PHASE_META[step.phase];
        const isLast = index === steps.length - 1;
        const isActive = Boolean(step.isActive);
        const contextLabel = step.topicTitle && step.topicTitle !== step.label ? step.topicTitle : '';

        return (
          <React.Fragment key={step.key}>
            {showPhase && (
              <div className={`flex items-center gap-2 ${index > 0 ? 'mt-3' : ''} mb-2`}>
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-600">
                  {phaseMeta.label}
                </span>
                <span className="text-[11px] text-slate-400">{phaseMeta.hint}</span>
              </div>
            )}
            <div className="flex gap-3">
              {showIndex && (
                <div className="flex w-6 shrink-0 flex-col items-center">
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                      isPracticeStep
                        ? 'bg-amber-500 text-white'
                        : isActive
                          ? 'bg-indigo-600 text-white'
                          : 'bg-indigo-100 text-indigo-600'
                    }`}
                  >
                    {index + 1}
                  </span>
                  {!isLast && <span className="mt-1 w-px flex-1 min-h-[12px] bg-indigo-100" />}
                </div>
              )}
              <div className={`min-w-0 flex-1 ${isLast ? '' : 'pb-2'}`}>
                <button
                  type="button"
                  onClick={() => onSelect(index)}
                  className={`group relative flex w-full items-center gap-2.5 overflow-hidden rounded-xl border px-3 py-2 text-left transition ${
                    isPracticeStep
                      ? 'border-amber-200 bg-amber-50/80 hover:border-amber-300 hover:bg-amber-100/80'
                      : isActive
                        ? 'border-indigo-200 bg-indigo-50 shadow-sm'
                        : 'border-indigo-100/80 bg-white hover:border-indigo-200 hover:bg-indigo-50/60'
                  }`}
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={isPracticeStep ? { background: '#FEF3C7', color: '#D97706' } : { background: style.from, color: style.accent }}
                  >
                    <Icon size={15} strokeWidth={1.8} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate text-[13px] font-medium ${isPracticeStep ? 'text-amber-900' : isActive ? 'text-indigo-900' : 'text-slate-800'}`}>
                      {step.label}
                    </span>
                    {contextLabel ? (
                      <span className="mt-0.5 block truncate text-[11px] text-slate-400">{contextLabel}</span>
                    ) : null}
                    {step.status ? (
                      <span className={`mt-0.5 block truncate text-[10px] font-bold ${STATUS_TONE_CLASS[step.statusTone ?? 'muted']}`}>
                        {step.status}
                      </span>
                    ) : null}
                  </span>
                  {step.tagLabel ? (
                    <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                      {step.tagLabel}
                    </span>
                  ) : null}
                  <span className="shrink-0 text-[11px] tabular-nums text-slate-400">{step.duration}</span>
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition ${
                    isPracticeStep
                      ? 'bg-amber-100 text-amber-600 group-hover:bg-amber-500 group-hover:text-white'
                      : isActive
                        ? 'bg-indigo-600 text-white'
                        : 'bg-indigo-50 text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white'
                  }`}>
                    {isPracticeStep ? <ChevronRight size={12} /> : <Play size={11} fill="currentColor" className="ml-0.5" />}
                  </span>
                  {typeof step.progressRatio === 'number' && step.progressRatio > 0 ? (
                    <span className="absolute inset-x-0 bottom-0 h-0.5 bg-black/5">
                      <span
                        className={`block h-full ${isActive ? 'bg-indigo-500' : step.statusTone === 'done' ? 'bg-emerald-500' : 'bg-indigo-400'}`}
                        style={{ width: `${step.progressRatio}%` }}
                      />
                    </span>
                  ) : null}
                </button>
              </div>
            </div>
          </React.Fragment>
        );
      })}
    </>
  );
}

interface PathStepItem {
  key: string;
  topic: SyncSectionTopic;
  video: SyncSectionVideo;
  videoIndex: number;
  label: string;
  tagLabel: string;
  duration: string;
  phase: keyof typeof PHASE_META;
  topicTitle: string;
}

function buildPathSteps(
  topics: SyncSectionTopic[],
  unitTitle: string,
  includePractice: boolean,
  preferVideoName = true,
  tagCtx: SyncVideoTagContext = { subject: '数学', lessonTitle: unitTitle },
): PathStepItem[] {
  const steps = topics.flatMap((topic, topicIndex) =>
    topic.videos.map((video, videoIndex) => {
      if (preferVideoName) {
        const display = resolvePathStepDisplay(video, topic.section, unitTitle, {
          ...tagCtx,
          sectionTitle: topic.section,
          lessonTitle: tagCtx.lessonTitle || unitTitle,
        });
        return {
          key: `${topic.section}-${video.tag}-${videoIndex}`,
          topic,
          video,
          videoIndex,
          label: display.name,
          tagLabel: display.tagLabel,
          duration: getCoverMeta(topic, video, videoIndex).duration,
          phase: display.phase,
          topicTitle: topic.section !== unitTitle && topic.section !== display.name ? topic.section : '',
          sortBucket: display.phase === 'learn' ? 0 : 1,
          topicIndex,
        };
      }
      const label = compactGridVideoLabel(video.tag, topic.section, unitTitle) || video.tag || video.title;
      return {
        key: `${topic.section}-${video.tag}-${videoIndex}`,
        topic,
        video,
        videoIndex,
        label,
        tagLabel: '',
        duration: getCoverMeta(topic, video, videoIndex).duration,
        phase: getStepPhase(video.tag || video.title || label, tagCtx.subject),
        topicTitle: topic.section !== unitTitle ? topic.section : '',
        sortBucket: getStepSortOrder(video.tag || video.title || label, tagCtx.subject),
        topicIndex,
      };
    }),
  ).sort((a, b) => a.sortBucket - b.sortBucket || a.topicIndex - b.topicIndex);

  if (includePractice) {
    steps.push({
      key: 'section-practice',
      topic: topics[0] ?? { section: unitTitle, videos: [] },
      video: { tag: '一课一练', title: '一课一练' },
      videoIndex: -1,
      label: '一课一练',
      tagLabel: '',
      duration: '约10分钟',
      phase: 'practice',
      topicTitle: '',
      sortBucket: 99,
      topicIndex: 999,
    });
  }

  return steps.map(({ sortBucket: _sortBucket, topicIndex: _topicIndex, ...step }) => step);
}

export function collectPlayableSectionVideos(
  topics: SyncSectionTopic[],
  unitTitle: string,
  layout: 'grid' | 'path' = 'grid',
  preferVideoName = layout !== 'path',
  tagCtx: SyncVideoTagContext = { subject: '数学', lessonTitle: unitTitle },
): SectionVideoPlayItem[] {
  // 语文大卡：播放器标题用环节名（tag）
  if (layout === 'path' || !preferVideoName) {
    return topics.flatMap((topic) =>
      topic.videos.map((video, videoIndex) => ({
        topic,
        video,
        videoIndex,
        title: video.tag || video.title,
        topicTitle: topic.section !== unitTitle ? topic.section : '',
      })),
    );
  }
  return buildPathSteps(topics, unitTitle, false, true, tagCtx)
    .filter((step) => step.videoIndex >= 0)
    .map((step) => ({
      topic: step.topic,
      video: step.video,
      videoIndex: step.videoIndex,
      title: step.label,
      topicTitle: step.tagLabel || step.topicTitle,
    }));
}

function SyncMicroLessonEmpty({ lessonNoun = '小节' }: { lessonNoun?: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5">
      <Clapperboard size={14} strokeWidth={1.7} className="shrink-0 text-slate-300" />
      <p className="text-[12px] text-slate-400">{`本${lessonNoun}暂无同步名师课`}</p>
    </div>
  );
}

/** §7.8.3 视频未上线 / 正在上架中 —— 学习页占位卡。和正常"学习路径"卡同高同结构，里头放缺省图 + 文案。 */
function VideoPendingBanner({ lessonNoun = '小节' }: { lessonNoun?: string }) {
  return (
    <div className="flex flex-col rounded-3xl bg-white px-5 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.05)] ring-1 ring-slate-100">
      <div className="mb-3 flex shrink-0 items-center">
        <p className="text-[13px] font-semibold text-slate-500">学习路径</p>
      </div>
      <div className="flex h-[212px] flex-col items-center justify-center gap-4 rounded-2xl bg-slate-50/50 px-6">
        {/* 缺省图：胶片图 + 角标时钟，表示「等待上架」 */}
        <div className="relative">
          <div className="flex h-[92px] w-[92px] items-center justify-center rounded-[28px] bg-slate-100 text-slate-300 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
            <Clapperboard size={42} strokeWidth={1.5} />
          </div>
          <span className="absolute -bottom-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm ring-1 ring-slate-100">
            <Clock size={14} strokeWidth={2.2} />
          </span>
        </div>
        <div className="flex flex-col items-center gap-1.5 text-center">
          <p className="text-[15px] font-semibold text-slate-700">视频正在上架中</p>
          <p className="max-w-[320px] text-[12px] leading-5 text-slate-400">
            本课视频还在准备中，上架后自动开放。
          </p>
          <p className="text-[12px] leading-5 text-slate-500">
            可先做「一课一练」
          </p>
        </div>
      </div>
    </div>
  );
}

function LearningPathView({
  steps,
  onPlayVideo,
  onStartPractice,
  practiceMark,
  lessonNoun,
  videoPending = false,
}: {
  steps: PathStepItem[];
  onPlayVideo: (topic: SyncSectionTopic, video: SyncSectionVideo, index: number) => void;
  onStartPractice?: () => void;
  practiceMark?: { bookKey: string; practiceKey: string };
  lessonNoun?: string;
  videoPending?: boolean;
}) {
  useSyncExternalStore(subscribeSyncLessonProgress, getSyncLessonProgressVersion, () => 0);
  const practice = useSyncPracticeView(practiceMark);

  if (steps.length === 0) {
    return <SyncMicroLessonEmpty lessonNoun={lessonNoun} />;
  }

  const videoSteps = steps.filter((step) => step.videoIndex >= 0);
  const practiceSteps = steps.filter((step) => step.videoIndex < 0);
  const hasVideos = videoSteps.length > 0;

  const toStepView = (step: PathStepItem, playlist: PathStepItem[]): LearningPathStepView => {
    if (step.videoIndex < 0) {
      return {
        key: step.key,
        label: step.label,
        tagLabel: step.tagLabel,
        topicTitle: step.topicTitle,
        duration: step.duration,
        phase: step.phase,
        isPracticeStep: true,
        status: practice.status,
        statusTone: practice.tone,
      };
    }
    const playlistIndex = playlist.findIndex((item) => item.key === step.key);
    const itemId = makeSectionVideoItemId(
      step.topic.section,
      step.video.title || step.video.tag,
      step.videoIndex,
    );
    const lessonId = makeSectionVideoProgressId(itemId, Math.max(playlistIndex, 0));
    const durationSec = 20;
    const saved = loadSyncLessonProgress(lessonId);
    const watch = describeWatchStatus(
      saved,
      saved?.durationSec || durationSec,
    );
    return {
      key: step.key,
      label: step.label,
      tagLabel: step.tagLabel,
      topicTitle: step.topicTitle,
      duration: step.duration,
      phase: step.phase,
      isPracticeStep: false,
      status: watch.status,
      statusTone: watch.tone,
      progressRatio: watch.ratio,
    };
  };

  if (!hasVideos) {
    return (
      <div className="flex flex-col gap-3">
        <SyncMicroLessonEmpty lessonNoun={lessonNoun} />
        {practiceSteps.length > 0 ? (
          <div className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_20px_rgba(15,23,42,0.05)] ring-1 ring-slate-100">
            <div className="px-3.5 py-3">
              <LearningPathStepList
                steps={practiceSteps.map((step) => toStepView(step, videoSteps))}
                showIndex={false}
                onSelect={(index) => {
                  const step = practiceSteps[index];
                  if (!step) return;
                  onStartPractice?.();
                }}
              />
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {videoPending ? <VideoPendingBanner lessonNoun={lessonNoun} /> : null}
      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_20px_rgba(15,23,42,0.05)] ring-1 ring-slate-100">
        <div className="px-3.5 py-3">
          <LearningPathStepList
            steps={(videoPending ? steps.filter((step) => step.videoIndex < 0) : steps).map((step) => toStepView(step, videoSteps))}
            onSelect={(index) => {
              const step = (videoPending ? steps.filter((s) => s.videoIndex < 0) : steps)[index];
              if (!step) return;
              if (step.videoIndex < 0) onStartPractice?.();
              else if (!videoPending) onPlayVideo(step.topic, step.video, step.videoIndex);
            }}
          />
        </div>
      </div>
    </div>
  );
}

function sectionVideoWatchStatus(
  topic: SyncSectionTopic,
  video: SyncSectionVideo,
  videoIndex: number,
  playlistIndex: number,
) {
  const itemId = makeSectionVideoItemId(topic.section, video.title || video.tag, videoIndex);
  const lessonId = makeSectionVideoProgressId(itemId, Math.max(playlistIndex, 0));
  const saved = loadSyncLessonProgress(lessonId);
  return describeWatchStatus(saved, saved?.durationSec || 20);
}

function PathStepEntry({
  tag,
  index,
  compact = false,
  status,
  statusTone,
}: {
  tag: string;
  index: number;
  compact?: boolean;
  status?: string;
  statusTone?: WatchStatusTone;
}) {
  const style = getPathStyle(tag, index);
  const Icon = style.Icon;
  return (
    <div
      className="relative flex h-[212px] w-full flex-col items-center justify-center overflow-hidden rounded-3xl px-3 transition group-hover:-translate-y-0.5"
      style={{ background: `linear-gradient(165deg, ${style.from} 0%, ${style.to} 100%)` }}
    >
      <span
        className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full opacity-50"
        style={{ background: style.blob }}
      />
      <span
        className="pointer-events-none absolute -bottom-12 -left-10 h-28 w-28 rounded-full opacity-35"
        style={{ background: style.blob }}
      />
      <span
        className="absolute left-3 top-3 flex h-6 min-w-6 items-center justify-center rounded-full bg-white/80 px-1.5 text-[11px] font-semibold shadow-sm"
        style={{ color: style.accent }}
      >
        {index + 1}
      </span>
      <span
        className={`relative z-[1] flex items-center justify-center rounded-[28px] bg-white shadow-[0_12px_28px_rgba(15,23,42,0.12)] transition group-hover:scale-105 ${compact ? 'h-16 w-16' : 'h-[88px] w-[88px]'}`}
        style={{ color: style.accent }}
      >
        <Icon size={compact ? 30 : 40} strokeWidth={1.6} />
      </span>
      <p className={`relative z-[1] truncate font-semibold text-slate-800 ${compact ? 'mt-3 text-[13px]' : 'mt-5 text-[16px]'}`}>{tag}</p>
      {status ? (
        <p className={`relative z-[1] mt-1 text-[11px] font-bold ${STATUS_TONE_CLASS[statusTone ?? 'muted']}`}>{status}</p>
      ) : null}
    </div>
  );
}

export const SyncSectionPage: React.FC<SyncSectionPageProps> = ({
  open,
  unitTitle,
  topics,
  layout = 'grid',
  lessonNoun = '小节',
  preferVideoName = layout !== 'path',
  subject = '数学',
  catalogUnitTitle,
  periodSwitcher = false,
  lastStudiedSection,
  videoPending = false,
  onBack,
  onPlayVideo,
  onStartPractice,
  practiceMark,
}) => {
  useSyncExternalStore(subscribeSyncLessonProgress, getSyncLessonProgressVersion, () => 0);
  const practice = useSyncPracticeView(practiceMark);
  const viewport = typeof document !== 'undefined' ? document.getElementById('app-viewport') : null;
  if (!viewport) return null;

  const isPath = layout === 'path';
  const usePeriodSwitcher = Boolean(periodSwitcher) && topics.length > 1;
  const [periodIndex, setPeriodIndex] = useState(0);
  const periodSignature = topics.map((t) => t.section).join('|');
  useEffect(() => { setPeriodIndex(0); }, [periodSignature]);
  const safePeriodIndex = Math.min(Math.max(periodIndex, 0), Math.max(topics.length - 1, 0));
  const activeTopics = usePeriodSwitcher ? [topics[safePeriodIndex]] : topics;

  const tagCtx: SyncVideoTagContext = {
    subject,
    unitTitle: catalogUnitTitle,
    lessonTitle: unitTitle,
  };
  const pathSteps = buildPathSteps(activeTopics, unitTitle, usePeriodSwitcher ? false : Boolean(onStartPractice), preferVideoName, tagCtx);
  const playableVideos = collectPlayableSectionVideos(activeTopics, unitTitle, layout, preferVideoName, tagCtx);
  const playVideo = (topic: SyncSectionTopic, video: SyncSectionVideo, index: number) => {
    onPlayVideo(topic, video, index, playableVideos);
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="sync-section-page"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 260 }}
          className="absolute inset-0 z-[550] flex flex-col bg-[#F7F8FB]"
        >
          <header className="shrink-0 border-b border-slate-100 bg-white px-5 pb-3 pt-4">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onBack}
                aria-label="返回"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <ChevronLeft size={22} />
              </button>
              <h1 className="min-w-0 flex-1 truncate text-[18px] font-semibold text-slate-900">{unitTitle}</h1>
            </div>
          </header>

          {usePeriodSwitcher ? (
            <>
            <div className="flex min-h-0 flex-1">
              <aside className="w-48 shrink-0 overflow-y-auto border-r border-slate-100 bg-white px-2 py-3">
                <div className="space-y-1">
                  {topics.map((topic, i) => {
                    const isActive = i === safePeriodIndex;
                    return (
                      <button
                        key={topic.section}
                        type="button"
                        onClick={() => setPeriodIndex(i)}
                        className={`flex w-full flex-col items-start rounded-lg border px-2.5 py-1.5 text-left text-[12px] font-medium transition ${
                          isActive
                            ? 'border-indigo-500 bg-indigo-500 text-white'
                            : 'border-slate-100 bg-slate-50/80 text-slate-600 hover:border-indigo-100 hover:bg-indigo-50 hover:text-indigo-600'
                        }`}
                      >
                        <span className="min-w-0 leading-[1.35] line-clamp-2 break-words">{topic.section}</span>
                        {lastStudiedSection && lastStudiedSection === topic.section ? (
                          <span
                            className={`mt-1 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                              isActive
                                ? 'bg-white/25 text-white'
                                : 'bg-indigo-50 text-indigo-600'
                            }`}
                          >
                            <Clock size={10} strokeWidth={2.2} />
                            上次学习
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </aside>
              <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4 pt-4">
                <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
                  <LearningPathView
                    steps={pathSteps}
                    onPlayVideo={playVideo}
                    onStartPractice={onStartPractice}
                    practiceMark={practiceMark}
                    lessonNoun={lessonNoun}
                  />
                </div>
              </div>
            </div>
            {onStartPractice && (
              <div className="shrink-0 border-t border-slate-100 bg-white px-5 py-3">
                <button
                  type="button"
                  onClick={onStartPractice}
                  className="group flex w-full items-center gap-2.5 rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-left transition hover:border-amber-300 hover:bg-amber-100/80"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                    <PenTool size={18} strokeWidth={1.8} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-semibold text-amber-900">一课一练</span>
                    <span className="block text-[11px] text-amber-700/80">本课配套练习（整课共享）</span>
                  </span>
                  <span className={`shrink-0 text-[11px] font-bold ${STATUS_TONE_CLASS[practice.tone]}`}>{practice.status}</span>
                  <ChevronRight size={16} className="shrink-0 text-amber-500 transition group-hover:translate-x-0.5" />
                </button>
              </div>
            )}
            </>
          ) : (
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4 pt-4">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
              {isPath ? (
                <>
                  {videoPending ? (
                    <VideoPendingBanner lessonNoun={lessonNoun} />
                  ) : topics.some((topic) => topic.videos.length > 0) ? (
                    topics.map((topic) => (
                      <section key={topic.section} className="flex flex-col">
                        {topic.section !== unitTitle && (
                          <h2 className="mb-2 shrink-0 text-[15px] font-semibold text-slate-700">{topic.section}</h2>
                        )}
                        {topic.videos.length === 0 ? (
                          <SyncMicroLessonEmpty lessonNoun={lessonNoun} />
                        ) : (
                          <div className="flex flex-col rounded-3xl bg-white px-5 py-4 shadow-[0_8px_24px_rgba(15,23,42,0.05)] ring-1 ring-slate-100">
                            <div className="mb-3 flex shrink-0 items-center">
                              <p className="text-[13px] font-semibold text-slate-500">学习路径</p>
                            </div>
                            {topic.videos.length > 4 ? (
                              <div
                                className="grid gap-3"
                                style={{
                                  gridTemplateColumns: `repeat(${Math.min(topic.videos.length, 5)}, minmax(0, 1fr))`,
                                }}
                              >
                                {topic.videos.map((video, index) => {
                                  const playlistIndex = playableVideos.findIndex((item) =>
                                    item.topic.section === topic.section
                                    && item.videoIndex === index
                                    && (item.video.title === video.title || item.video.tag === video.tag),
                                  );
                                  const watch = sectionVideoWatchStatus(topic, video, index, playlistIndex);
                                  return (
                                    <button
                                      key={`${video.tag}-${index}`}
                                      type="button"
                                      onClick={() => playVideo(topic, video, index)}
                                      className="group min-w-0"
                                    >
                                      <PathStepEntry tag={video.tag} index={index} compact status={watch.status} statusTone={watch.tone} />
                                    </button>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="flex items-center">
                                {topic.videos.map((video, index) => {
                                  const playlistIndex = playableVideos.findIndex((item) =>
                                    item.topic.section === topic.section
                                    && item.videoIndex === index
                                    && (item.video.title === video.title || item.video.tag === video.tag),
                                  );
                                  const watch = sectionVideoWatchStatus(topic, video, index, playlistIndex);
                                  return (
                                    <React.Fragment key={`${video.tag}-${index}`}>
                                      <button
                                        type="button"
                                        onClick={() => playVideo(topic, video, index)}
                                        className="group min-w-0 flex-1"
                                      >
                                        <PathStepEntry tag={video.tag} index={index} status={watch.status} statusTone={watch.tone} />
                                      </button>
                                      {index < topic.videos.length - 1 && (
                                        <div className="flex w-9 shrink-0 items-center">
                                          <div className="relative h-px w-full bg-indigo-200">
                                            <ChevronRight size={16} className="absolute -right-1.5 top-1/2 -translate-y-1/2 text-indigo-300" />
                                          </div>
                                        </div>
                                      )}
                                    </React.Fragment>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </section>
                    ))
                  ) : (
                    <SyncMicroLessonEmpty lessonNoun={lessonNoun} />
                  )}
                  {onStartPractice && (
                    <button
                      type="button"
                      onClick={onStartPractice}
                      className="group flex w-full items-center gap-2.5 rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-left transition hover:border-amber-300 hover:bg-amber-100/80"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                        <PenTool size={18} strokeWidth={1.8} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] font-semibold text-amber-900">一课一练</span>
                        <span className="block text-[11px] text-amber-700/80">做完本课配套练习</span>
                      </span>
                      <span className={`shrink-0 text-[11px] font-bold ${STATUS_TONE_CLASS[practice.tone]}`}>{practice.status}</span>
                      <ChevronRight size={16} className="shrink-0 text-amber-500 transition group-hover:translate-x-0.5" />
                    </button>
                  )}
                </>
              ) : (
                <LearningPathView
                  steps={pathSteps}
                  onPlayVideo={playVideo}
                  onStartPractice={onStartPractice}
                  practiceMark={practiceMark}
                  lessonNoun={lessonNoun}
                  videoPending={videoPending}
                />
              )}
            </div>
          </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>,
    viewport,
  );
};
