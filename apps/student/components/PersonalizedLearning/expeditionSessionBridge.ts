import type { ExpeditionPlan } from '../../types';

export type ExpeditionReturnScreen =
  | 'main'
  | 'path'
  | 'history'
  | 'history-level-result'
  | 'video-learning'
  | 'textbook-video'
  | 'learning-module';

/** 跨 LearningFlow / SubjectMap 挂载周期的训练计划会话状态 */
export const expeditionSession = {
  pendingNodeId: null as string | null,
  /** 本关测验已提交，返回地图时推进进度 */
  pendingLevelSuccess: false,
  /** 结果页点「继续闯关」：推进后自动开启下一关训练 */
  continueNextAfterResult: false,
  /** 已在 App 内切到下一关并推进进度，SubjectMap 只需同步 completedCount */
  progressSyncedFromApp: false,
  planCompleted: false,
  requestNewPlan: false,
  /** 所选内容提前练完、关卡额度还没用完时，回到路径弹出续学询问 */
  needsContinuePrompt: false,
  /**
   * 结果页「<」返回目标：星空闯关路线页。
   * 非 null 表示从学习会话返回时需要恢复该屏。
   */
  returnScreen: null as ExpeditionReturnScreen | null,
  /**
   * 离开学科 Tab 前最后停留的子页；切回学科时原样恢复（计划首页 / 路线 / 历史等）。
   */
  lastScreen: 'main' as ExpeditionReturnScreen,
  activePlan: null as ExpeditionPlan | null,
  /** 已完成关卡数（跨 LearningFlow / SubjectMap 持久化）；14 关演示默认第 2 周第 6 天 */
  completedCount: 12,
};

export function resetExpeditionSession() {
  expeditionSession.pendingNodeId = null;
  expeditionSession.pendingLevelSuccess = false;
  expeditionSession.continueNextAfterResult = false;
  expeditionSession.progressSyncedFromApp = false;
  expeditionSession.planCompleted = false;
  expeditionSession.requestNewPlan = false;
  expeditionSession.needsContinuePrompt = false;
  expeditionSession.returnScreen = null;
  expeditionSession.lastScreen = 'main';
  expeditionSession.activePlan = null;
  expeditionSession.completedCount = 12;
}
