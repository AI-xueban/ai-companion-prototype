export type StudentNotificationAction = 'sync' | 'practice' | 'mistake';

export type StudentNotificationGroup = 'learning' | 'record' | 'rule' | 'growth';
export type StudentNotificationPriority = 'normal' | 'pinned';

export interface StudentNotification {
  id: string;
  group: StudentNotificationGroup;
  title: string;
  summary: string;
  /** 面向学生展示的相对时间，如“10 分钟前”或“昨天”。 */
  timeLabel: string;
  isUnread?: boolean;
  action?: StudentNotificationAction;
  /** 未归还设备等风险事件固定在面板顶部，不随普通消息列表滚动。 */
  priority?: StudentNotificationPriority;
  /** 风险尚未解除时，已读后也保留首页消息红点。 */
  isPersistentRisk?: boolean;
}

/**
 * 教师答案策略变化时，只告知学生当前能否查看及下一步，不暴露“策略更新”等内部术语。
 */
export const createAnswerAccessNotification = (canView: boolean): StudentNotification => (
  canView
    ? {
        id: 'answer-access-open',
        group: 'rule',
        title: '答案与解析已开放',
        summary: '本次练习现在可以查看答案与解析',
        timeLabel: '刚刚',
        isUnread: true,
      }
    : {
        id: 'answer-access-closed',
        group: 'rule',
        title: '答案与解析暂不可查看',
        summary: '教师暂未开放答案与解析，请先完成练习',
        timeLabel: '刚刚',
        isUnread: true,
      }
);

/**
 * 首页通知的演示数据只描述现有学生端流程中已经确认的状态。
 * 实际接入时由通知服务替换此数据源，展示组件无需感知业务模块。
 */
export const STUDENT_NOTIFICATION_DEMO: StudentNotification[] = [
  {
    id: 'mistake-review',
    group: 'learning',
    title: '错题复习',
    summary: '有 3 道错题等待复习',
    timeLabel: '10 分钟前',
    isUnread: true,
    action: 'mistake',
  },
  {
    id: 'learning-path',
    group: 'learning',
    title: '学习计划',
    summary: '今日学习计划还有 2 科待完成',
    timeLabel: '1 小时前',
    isUnread: true,
  },
  createAnswerAccessNotification(true),
  {
    id: 'device-overdue-return',
    group: 'rule',
    title: '设备已逾期',
    summary: '设备已经逾期 2 天 5 小时，请及时归还',
    timeLabel: '今天 08:30',
    isUnread: true,
    priority: 'pinned',
    isPersistentRisk: true,
  },
  {
    id: 'wish-approved',
    group: 'growth',
    title: '许愿池审核通过',
    summary: '你的心愿已通过审核',
    timeLabel: '昨天',
    isUnread: true,
  },
];
