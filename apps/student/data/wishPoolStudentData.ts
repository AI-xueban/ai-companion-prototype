import type { LucideIcon } from 'lucide-react';
import { Armchair, BookOpen, Clock, Cookie, ScrollText, Star } from 'lucide-react';

/** 对齐教师端 ClassIncentives · incentiveGoods 上架配置 */
export type WishShelfStatus = 'on' | 'off';

/** 对齐教师端 redemptionRecords · status */
export type WishApplicationStatus = 'pending' | 'done' | 'rejected';

export interface WishPoolGoods {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: LucideIcon;
  accent: 'violet' | 'amber' | 'sky' | 'rose' | 'emerald';
  shelfStatus: WishShelfStatus;
  stock: number;
  limitPerUser: number;
}

export interface WishApplication {
  id: string;
  goodsId: string;
  goodsName: string;
  price: number;
  status: WishApplicationStatus;
  appliedAt: string;
  handler: string;
  handledAt: string;
  rejectReason: string;
}

/** 学生端展示文案 · 与教师端「待核销 / 已完成 / 已拒绝」一一对应 */
export const WISH_APPLICATION_STATUS_META: Record<
  WishApplicationStatus,
  { label: string; hint: string; badgeClass: string; dotClass: string }
> = {
  pending: {
    label: '待核销',
    hint: '已提交申请，等待老师核销',
    badgeClass: 'bg-amber-400/15 text-amber-300 border-amber-400/25',
    dotClass: 'bg-amber-400',
  },
  done: {
    label: '已核销',
    hint: '老师已确认兑现',
    badgeClass: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/25',
    dotClass: 'bg-emerald-400',
  },
  rejected: {
    label: '已拒绝',
    hint: '核销未通过，冻结金币已退回',
    badgeClass: 'bg-red-400/15 text-red-300 border-red-400/25',
    dotClass: 'bg-red-400',
  },
};

export const WISH_POOL_GOODS: WishPoolGoods[] = [
  {
    id: 'g-001',
    name: '免做卡',
    description: '兑换一次作业免做权益，需老师线下确认',
    price: 150,
    icon: ScrollText,
    accent: 'violet',
    shelfStatus: 'on',
    stock: 12,
    limitPerUser: 1,
  },
  {
    id: 'g-002',
    name: '课堂加分 +5',
    description: '老师核销后计入课堂表现加分（演示：每人限兑 2 次）',
    price: 80,
    icon: Star,
    accent: 'amber',
    shelfStatus: 'on',
    stock: 30,
    limitPerUser: 2,
  },
  {
    id: 'g-003',
    name: '早退 10 分钟',
    description: '放学前早退 10 分钟特权券',
    price: 200,
    icon: Clock,
    accent: 'sky',
    shelfStatus: 'off',
    stock: 8,
    limitPerUser: 1,
  },
  {
    id: 'g-004',
    name: 'C位体验卡',
    description: '任选班级座位一天，需班主任安排',
    price: 200,
    icon: Armchair,
    accent: 'rose',
    shelfStatus: 'on',
    stock: 5,
    limitPerUser: 1,
  },
  {
    id: 'g-005',
    name: '零食大礼包',
    description: '课间小零食兑换券，限量供应',
    price: 300,
    icon: Cookie,
    accent: 'emerald',
    shelfStatus: 'on',
    stock: 10,
    limitPerUser: 1,
  },
  {
    id: 'g-006',
    name: '课外图书',
    description: '兑换一本班级图书角课外书',
    price: 500,
    icon: BookOpen,
    accent: 'violet',
    shelfStatus: 'on',
    stock: 6,
    limitPerUser: 1,
  },
];

export const INITIAL_WISH_APPLICATIONS: WishApplication[] = [
  {
    id: 'w-001',
    goodsId: 'g-001',
    goodsName: '免做卡',
    price: 150,
    status: 'pending',
    appliedAt: '06-12 10:20',
    handler: '',
    handledAt: '',
    rejectReason: '',
  },
  {
    id: 'w-002',
    goodsId: 'g-002',
    goodsName: '课堂加分 +5',
    price: 80,
    status: 'done',
    appliedAt: '06-11 09:50',
    handler: '赵老师',
    handledAt: '06-11 10:00',
    rejectReason: '',
  },
  {
    id: 'w-003',
    goodsId: 'g-003',
    goodsName: '早退 10 分钟',
    price: 200,
    status: 'rejected',
    appliedAt: '06-10 17:10',
    handler: '赵老师',
    handledAt: '06-10 18:00',
    rejectReason: '未满足班级积分规则',
  },
];

const ACCENT_STYLES: Record<WishPoolGoods['accent'], { iconBg: string; stripe: string; ring: string }> = {
  violet: {
    iconBg: 'bg-violet-500/20 text-violet-300',
    stripe: 'from-violet-500/80 to-violet-400/40',
    ring: 'hover:ring-violet-400/30',
  },
  amber: {
    iconBg: 'bg-amber-500/20 text-amber-300',
    stripe: 'from-amber-500/80 to-amber-400/40',
    ring: 'hover:ring-amber-400/30',
  },
  sky: {
    iconBg: 'bg-sky-500/20 text-sky-300',
    stripe: 'from-sky-500/80 to-sky-400/40',
    ring: 'hover:ring-sky-400/30',
  },
  rose: {
    iconBg: 'bg-rose-500/20 text-rose-300',
    stripe: 'from-rose-500/80 to-rose-400/40',
    ring: 'hover:ring-rose-400/30',
  },
  emerald: {
    iconBg: 'bg-emerald-500/20 text-emerald-300',
    stripe: 'from-emerald-500/80 to-emerald-400/40',
    ring: 'hover:ring-emerald-400/30',
  },
};

export const WISH_REDEEM_PROGRESS_STEPS = ['提交申请', '等待核销', '核销完成'] as const;

export function getWishProgressStepIndex(status: WishApplicationStatus): number {
  if (status === 'pending') return 1;
  if (status === 'done') return 2;
  return 1;
}

export function getWishGoodsById(goodsId: string) {
  return WISH_POOL_GOODS.find((goods) => goods.id === goodsId);
}

export function getWishGoodsAccentStyle(accent: WishPoolGoods['accent']) {
  return ACCENT_STYLES[accent];
}
