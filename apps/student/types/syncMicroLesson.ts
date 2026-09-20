/** 学科网同步微课 API 结构 */

export interface SyncMicroKpoint {
  id: number;
  title: string;
}

export interface SyncMicroLesson {
  id: number;
  title: string;
  cover_url: string;
  kpoint_list: SyncMicroKpoint[];
  /** 视频时长（秒），原型 mock；真实接口接入后替换 */
  duration_sec?: number;
  /** 播放列表：小节/知识点名，与视频类型 title 分开展示 */
  topicTitle?: string;
}

export interface SyncMicroLessonResponse {
  code: number;
  msg: string;
  data: SyncMicroLesson[];
}

export interface SyncMicroLessonScope {
  textbookId: number;
  chapterId: number;
  sectionId?: number;
  scopeLabel: string;
}

export interface SyncMicroLessonPlayPayload {
  lesson: SyncMicroLesson;
  scope: SyncMicroLessonScope;
}
