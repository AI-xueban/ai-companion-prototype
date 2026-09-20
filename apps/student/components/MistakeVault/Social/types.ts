export interface InsightTag {
  id: string;
  label: string;
  count: number;
  isSelected?: boolean;
}

export interface PeerInsight {
  id: string;
  authorName: string;
  authorAvatarColor: string; // Gradient class or hex
  content: string;
  likes: number;
  isLiked?: boolean;
  isDisliked?: boolean;
  tags?: string[]; // e.g. "避坑大神", "思路清奇"
  timeAgo: string;
}

export const MOCK_INSIGHT_TAGS: InsightTag[] = [
  { id: '1', label: '我也算错啦', count: 125 },
  { id: '2', label: '看错题目条件', count: 89 },
  { id: '3', label: '完全没思路', count: 45 },
  { id: '4', label: '以为是另一题', count: 12 },
];

export const MOCK_PEER_INSIGHTS: PeerInsight[] = [
  {
    id: '101',
    authorName: '数学小王子',
    authorAvatarColor: 'bg-gradient-to-tr from-blue-400 to-blue-600',
    content: '注意！题目求的是平方和，不是和的平方！\n公式要背熟：x₁²+x₂² = (x₁+x₂)² - 2x₁x₂',
    likes: 128,
    isLiked: false,
    tags: ['避坑大神'],
    timeAgo: '2小时前'
  },
  {
    id: '102',
    authorName: '快乐学习',
    authorAvatarColor: 'bg-gradient-to-tr from-green-400 to-emerald-600',
    content: '这道题有个隐藏条件“x1, x2为实数”，需要先验证 Δ ≥ 0。虽然这道题正好满足，但是如果是大题忘了写步骤会扣分的！',
    likes: 86,
    isLiked: true,
    tags: ['细心帝'],
    timeAgo: '5小时前'
  },
  {
    id: '103',
    authorName: '迷糊虫',
    authorAvatarColor: 'bg-gradient-to-tr from-orange-400 to-red-500',
    content: '我又把 -5x 看成 +5x 了... 谁来救救我的眼睛 T_T',
    likes: 32,
    isLiked: false,
    timeAgo: '1天前'
  }
];













