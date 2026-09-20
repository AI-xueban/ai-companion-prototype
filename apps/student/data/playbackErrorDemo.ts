export type PlaybackErrorKind = 'link_invalid' | 'load_failed' | 'network_timeout';

export const PLAYBACK_ERROR_DEMO_CHAPTER_ID = 'playback-error-demo-chapter';
export const PLAYBACK_ERROR_DEMO_CHAPTER_TITLE = '播放异常演示章节';
export const PLAYBACK_ERROR_DEMO_LESSON_TITLE = '播放异常演示';

export const PLAYBACK_ERROR_DEMOS: {
  kind: PlaybackErrorKind;
  title: string;
  idSuffix: string;
  body: string;
}[] = [
  {
    kind: 'link_invalid',
    title: '链接失效（演示）',
    idSuffix: 'playback-link-invalid',
    body: '视频暂时打不开，请稍后再试或换一条看看。',
  },
  {
    kind: 'load_failed',
    title: '加载失败（演示）',
    idSuffix: 'playback-load-failed',
    body: '视频加载出错了，请稍后再试或换一条看看。',
  },
  {
    kind: 'network_timeout',
    title: '网络超时（演示）',
    idSuffix: 'playback-network-timeout',
    body: '网络不太稳，请稍后再试或换一条看看。',
  },
];

export function matchPlaybackErrorDemo(idOrTitle?: string | null): PlaybackErrorKind | null {
  if (!idOrTitle) return null;
  if (idOrTitle.includes('playback-link-invalid') || idOrTitle.includes('链接失效')) return 'link_invalid';
  if (idOrTitle.includes('playback-load-failed') || idOrTitle.includes('加载失败')) return 'load_failed';
  if (idOrTitle.includes('playback-network-timeout') || idOrTitle.includes('网络超时')) return 'network_timeout';
  return null;
}

export function playbackErrorDemoOf(kind: PlaybackErrorKind) {
  return PLAYBACK_ERROR_DEMOS.find((item) => item.kind === kind) ?? PLAYBACK_ERROR_DEMOS[0];
}

export function isPlaybackErrorDemoChapter(idOrTitle?: string | null) {
  return Boolean(
    idOrTitle
    && (idOrTitle.includes(PLAYBACK_ERROR_DEMO_CHAPTER_ID) || idOrTitle.includes(PLAYBACK_ERROR_DEMO_CHAPTER_TITLE)),
  );
}

export function isPlaybackErrorDemoText(idOrTitle?: string | null) {
  return matchPlaybackErrorDemo(idOrTitle) != null
    || Boolean(idOrTitle && idOrTitle.includes(PLAYBACK_ERROR_DEMO_LESSON_TITLE));
}

export function appendPlaybackErrorDemoToSyncLessons<T extends { unit: string; section: string }>(
  lessons: T[],
): T[] {
  if (!lessons.length) return lessons;
  if (lessons.some((lesson) => isPlaybackErrorDemoChapter(lesson.unit))) return lessons;
  const template = lessons[lessons.length - 1] as T & Record<string, unknown>;
  const next: Record<string, unknown> = {
    ...template,
    unit: PLAYBACK_ERROR_DEMO_CHAPTER_TITLE,
    section: PLAYBACK_ERROR_DEMO_LESSON_TITLE,
  };
  if ('task' in template) next.task = '';
  if ('videos' in template) {
    const sample = Array.isArray(template.videos) ? template.videos[0] as Record<string, unknown> | undefined : undefined;
    next.videos = sample && 'skill' in sample
      ? PLAYBACK_ERROR_DEMOS.map((item) => ({ skill: item.title, name: item.title }))
      : PLAYBACK_ERROR_DEMOS.map((item) => ({ tag: item.title, title: item.title }));
  }
  if ('topicGroups' in template) {
    next.topicGroups = [{
      section: PLAYBACK_ERROR_DEMO_LESSON_TITLE,
      videos: PLAYBACK_ERROR_DEMOS.map((item) => ({ tag: item.title, title: item.title })),
    }];
  }
  if ('sections' in template) {
    const sectionSample = Array.isArray(template.sections)
      && Array.isArray((template.sections[0] as { videos?: unknown[] } | undefined)?.videos)
      ? ((template.sections[0] as { videos: Record<string, unknown>[] }).videos[0])
      : undefined;
    next.sections = [{
      id: `${PLAYBACK_ERROR_DEMO_CHAPTER_ID}::demo-sec`,
      title: PLAYBACK_ERROR_DEMO_LESSON_TITLE,
      videos: PLAYBACK_ERROR_DEMOS.map((item) => (
        sectionSample && 'skill' in sectionSample
          ? { skill: item.title, name: item.title, id: item.idSuffix, title: item.title }
          : { tag: item.title, title: item.title, id: item.idSuffix }
      )),
    }];
  }
  return [...lessons, next as T];
}
