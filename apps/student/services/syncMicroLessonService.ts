import { getMockLessonsForCatalog, getDemoSyncMicroLessons, seedDemoSyncLessonProgress } from '../data/mockSyncMicroLessons';
import type { SyncMicroLesson, SyncMicroLessonScope } from '../types/syncMicroLesson';
function scoreLessonOverlap(lesson: SyncMicroLesson, graphNodeIds: Set<string>): number {
  if (graphNodeIds.size === 0) return 0;
  return lesson.kpoint_list.filter((kp) => graphNodeIds.has(String(kp.id))).length;
}

/**
 * 拉取当前 scope 下的同步微课列表（原型为 mock，后续替换为真实 API）
 */
export async function fetchSyncMicroLessons(
  scope: SyncMicroLessonScope,
  graphNodeIds: string[] = [],
): Promise<SyncMicroLesson[]> {
  await new Promise((r) => setTimeout(r, 320));

  seedDemoSyncLessonProgress();

  let lessons = getMockLessonsForCatalog(scope.textbookId, scope.chapterId, scope.sectionId);
  if (lessons.length === 0) {
    lessons = getDemoSyncMicroLessons();
  }
  const nodeSet = new Set(graphNodeIds);

  if (nodeSet.size > 0 && lessons.length > 1) {
    lessons = [...lessons].sort(
      (a, b) => scoreLessonOverlap(b, nodeSet) - scoreLessonOverlap(a, nodeSet),
    );
  }

  return lessons;
}