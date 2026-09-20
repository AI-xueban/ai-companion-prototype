import type { Achievement } from '../types';

/**
 * 仅用于原型演示的成就事件。业务接入时，完成条件由各自的学习流程产生，
 * 统一把已达成的 Achievement 交给领取弹层，不经由消息中心。
 */
export const ACHIEVEMENT_DEMO_ITEMS: Achievement[] = [
  {
    id: 'a1',
    title: '早起鸟',
    description: '连续 7 天在早上 8 点前完成打卡',
    icon: '🌅',
  },
  {
    id: 'a2',
    title: '数学之星',
    description: '数学单元测试满分',
    icon: '📐',
  },
  {
    id: 'a3',
    title: '专注大师',
    description: '单次学习时长超过 60 分钟',
    icon: '🧘',
  },
].map((achievement) => ({ ...achievement, unlocked: false }));

export const findAchievementDemo = (id: string) =>
  ACHIEVEMENT_DEMO_ITEMS.find((achievement) => achievement.id === id) ?? null;
