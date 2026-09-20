/** 公益运营后台 Mock · 数值对齐学生端 GrowthProfile 展示 */

export const POOL_SUMMARY = {
  balanceYuan: 28600,
  totalDonatedPoints: 128800,
  participants: 3642,
  totalMatchYuan: 12880,
  monthProjectSpendYuan: 42400,
  todayDonatedPoints: 8600,
  todayDonorCount: 142,
  todayMatchYuan: 860,
  pendingRisk: 17,
  suspiciousUsers: 6,
  ruleVersion: 'V1.0',
  enabledTitles: 5,
  latestReportLabel: '2026年4月 · 已发布',
};

export interface DonationRecord {
  id: string;
  user: string;
  school: string;
  className: string;
  points: number;
  amountYuan: number;
  balanceAfter: number;
  triggeredTitle: string;
  status: '成功' | '失败' | '已退款';
  riskStatus: '正常' | '待复核' | '已确认' | '已退款';
  riskReason?: string;
  linkedRiskId?: string;
  stageId?: string;
  ruleVersion?: string;
  time: string;
}

export const DONATION_RECORDS: DonationRecord[] = [
  { id: 'D20260612001', user: '李华', school: '第一实验中学', className: '七年级 3 班', points: 100, amountYuan: 1, balanceAfter: 420, triggeredTitle: '—', status: '成功', riskStatus: '正常', stageId: 'stage-2026-q2', ruleVersion: 'V1.0', time: '2026-06-12 09:18:00' },
  { id: 'D20260611002', user: '陈同学', school: '第一实验中学', className: '七年级 1 班', points: 200, amountYuan: 2, balanceAfter: 680, triggeredTitle: '—', status: '成功', riskStatus: '正常', stageId: 'stage-2026-q2', ruleVersion: 'V1.0', time: '2026-06-11 20:06:00' },
  { id: 'D20260610003', user: 'Sarah', school: '国际学校', className: '七年级 A 班', points: 500, amountYuan: 5, balanceAfter: 1200, triggeredTitle: '爱心小大使', status: '成功', riskStatus: '待复核', riskReason: '24 小时内捐赠 3 次，频率异常', linkedRiskId: 'RK002', stageId: 'stage-2026-q2', ruleVersion: 'V1.0', time: '2026-06-10 14:42:00' },
  { id: 'D20260609004', user: '王小明', school: '第一实验中学', className: '七年级 2 班', points: 50, amountYuan: 0.5, balanceAfter: 150, triggeredTitle: '—', status: '成功', riskStatus: '正常', stageId: 'stage-2026-q2', ruleVersion: 'V1.0', time: '2026-06-09 18:06:00' },
  { id: 'D20260608005', user: '赵同学', school: '第二实验中学', className: '七年级 5 班', points: 100, amountYuan: 1, balanceAfter: 90, triggeredTitle: '—', status: '失败', riskStatus: '正常', stageId: 'stage-2026-q2', ruleVersion: 'V1.0', time: '2026-06-08 11:30:00' },
  { id: 'D20260607006', user: 'Sarah', school: '国际学校', className: '七年级 A 班', points: 300, amountYuan: 3, balanceAfter: 1700, triggeredTitle: '—', status: '成功', riskStatus: '待复核', riskReason: '与 RK002 关联的异常捐赠链', linkedRiskId: 'RK002', stageId: 'stage-2026-q2', ruleVersion: 'V1.0', time: '2026-06-07 21:10:00' },
];

export interface PoolLedgerRow {
  id: string;
  type: '学生捐赠' | '项目支出';
  amountYuan: number;
  poolBalanceAfter: number;
  note: string;
  time: string;
}

/** 爱心池台账类型（对齐 docs/pre-v2.0/06-公益与奖励/公益爱心大使-需求文档.md §4.6.2） */
export interface PoolLedgerTypeDef {
  value: PoolLedgerRow['type'];
  direction: '汇入' | '支出';
  description: string;
}

export const POOL_LEDGER_TYPES: PoolLedgerTypeDef[] = [
  {
    value: '学生捐赠',
    direction: '汇入',
    description: '学生自愿捐入的学习金币按固定折算比汇总入账（列表金额为正值 ¥）',
  },
  {
    value: '项目支出',
    direction: '支出',
    description: '公益项目验收拨付，从爱心池扣减（列表金额为负值 ¥）',
  },
];

export const POOL_LEDGER_TYPE_OPTIONS = ['全部', ...POOL_LEDGER_TYPES.map((t) => t.value)];

/** 列表页通用时间范围快捷项（§4.3.2） */
export const LIST_TIME_RANGE_OPTIONS = ['全部', '今天', '近7天', '近30天'] as const;

export const POOL_LEDGER_ROWS: PoolLedgerRow[] = [
  { id: 'L20260612001', type: '学生捐赠', amountYuan: 860, poolBalanceAfter: 28600, note: '今日 142 人次捐赠金币折算', time: '2026-06-12 23:59:00' },
  { id: 'L20260610002', type: '学生捐赠', amountYuan: 1820, poolBalanceAfter: 27740, note: '6月10日 捐赠金币折算汇总', time: '2026-06-10 23:59:00' },
  { id: 'L20260605003', type: '项目支出', amountYuan: -3200, poolBalanceAfter: 26460, note: '守望乡图书角 · 项目验收付款', time: '2026-06-05 16:20:00' },
];

export interface PointLedgerRow {
  id: string;
  source: string;
  user: string;
  points: string;
  type: string;
  balanceAfter: number;
  status: string;
  time: string;
}

/** 金币账户流水类型（对齐 docs/pre-v2.0/06-公益与奖励/奖励结算体系.md §7.3） */
export interface PointLedgerTypeDef {
  value: string;
  direction: '入账' | '扣减' | '双向';
  scenes: string;
  description: string;
}

export const POINT_LEDGER_TYPES: PointLedgerTypeDef[] = [
  {
    value: '任务奖励',
    direction: '入账',
    scenes: 'task_complete',
    description: '完成今日计划中的整条学习任务（里程碑奖励，非单步看视频/做题）',
  },
  {
    value: '学习激励',
    direction: '入账',
    scenes: 'quiz_correct · quiz_combo · daily_conquer',
    description: '基础答题（每题 +5）、连对加成（+2）、每日攻克',
  },
  {
    value: '成就奖励',
    direction: '入账',
    scenes: 'achievement · league_promote · welcome_gift',
    description: '成就一次性、联赛晋级、新用户见面礼（均为一次性或按档位）',
  },
  {
    value: '爱心捐赠',
    direction: '扣减',
    scenes: '—',
    description: '学生主动将金币捐入爱心池（详情见「捐赠与爱心池 · 捐赠记录」）',
  },
  {
    value: '商店兑换',
    direction: '扣减',
    scenes: '—',
    description: '装扮商城或许愿池兑换消费（详情见「商店兑换」菜单）',
  },
  {
    value: '人工调整',
    direction: '双向',
    scenes: '—',
    description: '运营对学生金币账户补发或扣减，须填写原因并留审计',
  },
];

export const POINT_LEDGER_TYPE_OPTIONS = ['全部', ...POINT_LEDGER_TYPES.map((t) => t.value)];

export const POINT_LEDGER_ROWS: PointLedgerRow[] = [
  { id: 'P20260612001', source: '爱心捐赠', user: '李华', points: '-100', type: '爱心捐赠', balanceAfter: 420, status: '已捐赠', time: '2026-06-12 09:18:00' },
  { id: 'P20260612002', source: '今日任务·数学练习', user: '李华', points: '+15', type: '任务奖励', balanceAfter: 520, status: '已入账', time: '2026-06-12 08:30:00' },
  { id: 'P20260611003', source: '每日攻克', user: '陈同学', points: '+20', type: '学习激励', balanceAfter: 880, status: '已入账', time: '2026-06-11 10:18:00' },
  { id: 'P20260611004', source: '当日首次满分', user: '陈同学', points: '+10', type: '学习激励', balanceAfter: 860, status: '已入账', time: '2026-06-11 09:05:00' },
  { id: 'P20260610004', source: '爱心捐赠', user: 'Sarah', points: '-500', type: '爱心捐赠', balanceAfter: 1200, status: '已捐赠', time: '2026-06-10 14:42:00' },
  { id: 'P20260610005', source: '成就·连续7天学习', user: 'Sarah', points: '+100', type: '成就奖励', balanceAfter: 1700, status: '已入账', time: '2026-06-10 08:00:00' },
  { id: 'P20260609006', source: '装扮商城·猫耳耳机', user: '赵敏', points: '-300', type: '商店兑换', balanceAfter: 650, status: '已到账', time: '2026-06-09 16:20:00' },
  { id: 'P20260609005', source: '风控复核扣减', user: '王磊', points: '-200', type: '人工调整', balanceAfter: 280, status: '已调整', time: '2026-06-09 18:05:00' },
];

export interface RedeemRow {
  id: string;
  user: string;
  school: string;
  className: string;
  item: string;
  itemType: '主题皮肤' | '装扮套装';
  outfitCategory: '头饰' | '手持' | '套装';
  target: '我的装扮' | '小晤形象';
  points: number;
  status: '已到账';
  time: string;
}

export const OUTFIT_FILTER_ITEM_TYPES = ['全部', '主题皮肤', '装扮套装'] as const;
export const OUTFIT_FILTER_CATEGORIES = ['全部', '头饰', '手持', '套装'] as const;

export const REDEEM_ROWS: RedeemRow[] = [
  { id: 'R20260612001', user: '李华', school: '第一实验中学', className: '七年级 3 班', item: '猫耳耳机', itemType: '装扮套装', outfitCategory: '头饰', target: '我的装扮', points: 300, status: '已到账', time: '2026-06-12 11:20:00' },
  { id: 'R20260611002', user: '王强', school: '第一实验中学', className: '七年级 2 班', item: '宇航服', itemType: '装扮套装', outfitCategory: '套装', target: '我的装扮', points: 1000, status: '已到账', time: '2026-06-11 16:05:00' },
  { id: 'R20260611003', user: 'Sarah', school: '国际学校', className: '七年级 A 班', item: '三太子·哪吒', itemType: '主题皮肤', outfitCategory: '头饰', target: '小晤形象', points: 500, status: '已到账', time: '2026-06-11 09:30:00' },
  { id: 'R20260610004', user: '陈同学', school: '第一实验中学', className: '七年级 1 班', item: '羽毛笔', itemType: '装扮套装', outfitCategory: '手持', target: '我的装扮', points: 100, status: '已到账', time: '2026-06-10 20:18:00' },
  { id: 'R20260609005', user: '赵敏', school: '第一实验中学', className: '七年级 3 班', item: '智慧眼镜', itemType: '装扮套装', outfitCategory: '头饰', target: '我的装扮', points: 200, status: '已到账', time: '2026-06-09 14:50:00' },
  { id: 'R20260608006', user: '张小花', school: '第二实验中学', className: '八年级 1 班', item: '福尔摩斯', itemType: '主题皮肤', outfitCategory: '头饰', target: '小晤形象', points: 200, status: '已到账', time: '2026-06-08 19:42:00' },
  { id: 'R20260608007', user: '李明', school: '第一实验中学', className: '七年级 2 班', item: '广寒宫·嫦娥', itemType: '主题皮肤', outfitCategory: '头饰', target: '小晤形象', points: 150, status: '已到账', time: '2026-06-08 18:10:00' },
  { id: 'R20260607008', user: '王磊', school: '第二实验中学', className: '八年级 1 班', item: '魔法书', itemType: '装扮套装', outfitCategory: '手持', target: '我的装扮', points: 150, status: '已到账', time: '2026-06-07 12:00:00' },
];

export interface MonthlyReportRow {
  id: string;
  title: string;
  period: string;
  status: '草稿' | '已发布' | '已下线';
  publishTime: string;
  donatedPoints: number;
  participants: number;
  matchYuan: number;
  poolBalance: number;
}

export const MONTHLY_REPORTS: MonthlyReportRow[] = [
  { id: 'report-2026-04', title: '2026年4月爱心月报', period: '2026年3月1日 — 3月31日', status: '已发布', publishTime: '2026-04-03', donatedPoints: 128560, participants: 3842, matchYuan: 28600, poolBalance: 156800 },
  { id: 'report-2026-05', title: '2026年5月爱心月报', period: '2026年4月1日 — 4月30日', status: '草稿', publishTime: '—', donatedPoints: 0, participants: 0, matchYuan: 0, poolBalance: 0 },
];

/** 学生端万象视界 · 公益月报捐赠排行（脱敏） */
export interface CharityLeaderboardEntry {
  rank: number;
  name: string;
  avatarEmoji: string;
  avatarBg: string;
  points: number;
}

/** 上月捐赠排行（月报周期内） */
export const CHARITY_DONATION_LEADERBOARD_LAST_MONTH: CharityLeaderboardEntry[] = [
  { rank: 1, name: '林*悦', avatarEmoji: '👧', avatarBg: 'bg-rose-400', points: 680 },
  { rank: 2, name: '陈*轩', avatarEmoji: '👦', avatarBg: 'bg-sky-400', points: 620 },
  { rank: 3, name: '王*涵', avatarEmoji: '👧', avatarBg: 'bg-amber-400', points: 580 },
  { rank: 4, name: '张*琪', avatarEmoji: '👦', avatarBg: 'bg-violet-400', points: 520 },
  { rank: 5, name: '刘*泽', avatarEmoji: '👦', avatarBg: 'bg-emerald-400', points: 465 },
];

/** 累计捐赠排行（全部） */
export const CHARITY_DONATION_LEADERBOARD_ALL: CharityLeaderboardEntry[] = [
  { rank: 1, name: '李*华', avatarEmoji: '🦊', avatarBg: 'bg-indigo-400', points: 2850 },
  { rank: 2, name: '林*悦', avatarEmoji: '👧', avatarBg: 'bg-rose-400', points: 2340 },
  { rank: 3, name: '陈*轩', avatarEmoji: '👦', avatarBg: 'bg-sky-400', points: 1980 },
  { rank: 4, name: '赵*敏', avatarEmoji: '👧', avatarBg: 'bg-pink-400', points: 1720 },
  { rank: 5, name: '王*涵', avatarEmoji: '👧', avatarBg: 'bg-amber-400', points: 1560 },
];

/** @deprecated 使用 CHARITY_DONATION_LEADERBOARD_LAST_MONTH */
export const CHARITY_DONATION_LEADERBOARD = CHARITY_DONATION_LEADERBOARD_LAST_MONTH;

export const getPublishedMonthlyReport = (): MonthlyReportRow | undefined =>
  MONTHLY_REPORTS.find((r) => r.status === '已发布');

export interface FeedbackRow {
  id: string;
  type: '感谢视频' | '图文报告';
  title: string;
  project: string;
  summary: string;
  privacyNote: string;
  status: '草稿' | '已发布';
  publishDate: string;
}

export const FEEDBACK_ROWS: FeedbackRow[] = [
  { id: 'fb-001', type: '感谢视频', title: '感谢视频｜云南守望小学图书角落成', project: '守望乡图书角项目', summary: '师生用画笔写下感谢卡，镜头仅拍摄书本与教室环境。', privacyNote: '已隐去学生姓名及正面肖像', status: '已发布', publishDate: '2026-03-20' },
  { id: 'fb-002', type: '图文报告', title: '图文报告｜青海洪水镇多媒体教室启用', project: '多媒体教室援建', summary: '记录教室启用仪式与第一堂云端公开课。', privacyNote: '无学生正面肖像，姓名均已化名', status: '已发布', publishDate: '2026-03-27' },
];

export interface TitleLevelRow {
  id: string;
  thresholdYuan: number;
  title: string;
  certificate: string;
  icon: string;
  enabled: boolean;
}

export const TITLE_LEVELS: TitleLevelRow[] = [
  { id: 'title-001', thresholdYuan: 1, title: '爱心小星星', certificate: '爱心参与证', icon: '✨', enabled: true },
  { id: 'title-002', thresholdYuan: 10, title: '爱心小天使', certificate: '爱心守护证', icon: '💗', enabled: true },
  { id: 'title-003', thresholdYuan: 50, title: '爱心小大使', certificate: '爱心大使证', icon: '🌟', enabled: true },
  { id: 'title-004', thresholdYuan: 100, title: '爱心守护官', certificate: '爱心守护官证', icon: '🛡️', enabled: true },
  { id: 'title-005', thresholdYuan: 300, title: '公益小领航员', certificate: '公益领航证', icon: '🚀', enabled: true },
];

export const DONATION_RULES = {
  convertRatio: '100 金币 = ¥1.00',
  quickAmounts: '50 / 100 / 200 / 500',
  singleLimit: '仅受账户余额限制',
  dailyLimit: '未启用',
};

export interface CoinEarnRule {
  id: string;
  scene: string;
  minCoins: number;
  maxCoins: number;
  dailyLimit: number;
  state: '启用' | '停用';
  note: string;
}

/** 固定奖励、防通胀 · 对齐产品金币规则 */
export const COIN_EARN_RULES: CoinEarnRule[] = [
  { id: 'ce-1', scene: '基础答题', minCoins: 5, maxCoins: 5, dailyLimit: 150, state: '启用', note: 'quiz_correct；每答对一题 +5，与难度无关' },
  { id: 'ce-2', scene: '连对加成', minCoins: 2, maxCoins: 2, dailyLimit: 150, state: '启用', note: 'quiz_combo；连对≥3 时每题额外 +2' },
  { id: 'ce-3', scene: '完成今日任务', minCoins: 10, maxCoins: 20, dailyLimit: 60, state: '启用', note: 'task_complete；单条任务完成' },
  { id: 'ce-4', scene: '今日任务全完成', minCoins: 50, maxCoins: 50, dailyLimit: 50, state: '启用', note: 'task_all_complete；3/3 大满贯' },
  { id: 'ce-5', scene: '每日攻克', minCoins: 20, maxCoins: 20, dailyLimit: 20, state: '启用', note: 'daily_conquer；错题每日攻克' },
  { id: 'ce-6', scene: '成就一次性', minCoins: 50, maxCoins: 200, dailyLimit: 200, state: '启用', note: 'achievement；每成就 1 次（不计入日 cap）' },
];

export const COIN_GLOBAL_RULES = {
  dailyTotalLimit: 150,
  earnFreezeThreshold: '3 次/分钟',
  donationDailyLimit: 3,
  donationIntervalMinutes: 30,
  abnormalDonationWindowHours: 24,
};

export const POINT_RULES = [
  { name: '单用户每日金币上限', value: `${COIN_GLOBAL_RULES.dailyTotalLimit} 金币`, state: '启用', note: '所有场景合计上限' },
  { name: '异常获取冻结阈值', value: COIN_GLOBAL_RULES.earnFreezeThreshold, state: '启用', note: '触发后进入风控复核' },
  { name: '每日捐赠次数上限', value: `${COIN_GLOBAL_RULES.donationDailyLimit} 次`, state: '启用', note: '超出标记异常捐赠' },
  { name: '捐赠间隔限制', value: `${COIN_GLOBAL_RULES.donationIntervalMinutes} 分钟`, state: '启用', note: '短间隔重复捐赠触发复核' },
  { name: '兑换门槛', value: '100 金币起兑', state: '启用', note: '低于门槛不允许兑换' },
];

export interface RiskRow {
  id: string;
  user: string;
  school: string;
  score: number;
  riskType: '刷金币' | '异常捐赠';
  reason: string;
  status: '待复核' | '已处理' | '误报' | '观察中';
  accountBalance?: number;
  abnormalCoins?: number;
  relatedDonationIds?: string[];
  freezeEarn?: boolean;
  freezeDonate?: boolean;
  time: string;
}

export const RISK_ROWS: RiskRow[] = [
  { id: 'RK001', user: '李华', school: '第一实验中学', score: 86, riskType: '刷金币', reason: '短时间内连续获取 12 次金币', status: '待复核', accountBalance: 520, abnormalCoins: 360, time: '2026-06-11 09:00:00' },
  { id: 'RK002', user: 'Sarah', school: '国际学校', score: 72, riskType: '异常捐赠', reason: '24 小时内捐赠 3 次，累计 800 金币', status: '待复核', accountBalance: 1200, relatedDonationIds: ['D20260610003', 'D20260607006'], freezeDonate: false, time: '2026-06-11 08:30:00' },
  { id: 'RK003', user: '王磊', school: '第二实验中学', score: 65, riskType: '刷金币', reason: '学习激励入账频次异常偏高', status: '观察中', accountBalance: 280, abnormalCoins: 80, time: '2026-06-12 07:15:00' },
  { id: 'RK004', user: '赵敏', school: '第一实验中学', score: 58, riskType: '异常捐赠', reason: '捐赠间隔低于规则阈值', status: '待复核', accountBalance: 890, relatedDonationIds: ['D20260612001'], time: '2026-06-12 10:20:00' },
];

/** 许愿池兑换 · 对齐教师端 ClassIncentives 核销流程（内部管理只读监管） */
export interface WishTimelineEvent {
  actor: string;
  role: '学生' | '系统' | '老师';
  action: string;
  content?: string;
  time: string;
}

export interface WishRedeemRow {
  id: string;
  user: string;
  school: string;
  className: string;
  homeroomTeacher: string;
  handler: string;
  item: string;
  points: number;
  status: '待核销' | '已完成' | '已拒绝';
  appliedAt: string;
  handledAt: string;
  ledgerId?: string;
  studentNote?: string;
  rejectReason?: string;
  timeline: WishTimelineEvent[];
}

export const WISH_REDEEM_ROWS: WishRedeemRow[] = [
  {
    id: 'W20260612001',
    user: '李明',
    school: '第一实验中学',
    className: '七年级 2 班',
    homeroomTeacher: '赵老师',
    handler: '',
    item: '免做卡',
    points: 150,
    status: '待核销',
    appliedAt: '2026-06-12 10:20:00',
    handledAt: '—',
    ledgerId: 'P20260612010',
    studentNote: '本周作业较多，想兑换一次免做卡',
    timeline: [
      { actor: '李明', role: '学生', action: '提交兑换申请', content: '免做卡 · 消耗 150 金币', time: '2026-06-12 10:20:00' },
      { actor: '系统', role: '系统', action: '已扣减金币并冻结', content: '关联流水 P20260612010', time: '2026-06-12 10:20:01' },
      { actor: '系统', role: '系统', action: '已通知班主任', content: '赵老师 · 七年级 2 班', time: '2026-06-12 10:20:02' },
    ],
  },
  {
    id: 'W20260611002',
    user: '王强',
    school: '第一实验中学',
    className: '七年级 2 班',
    homeroomTeacher: '赵老师',
    handler: '赵老师',
    item: '课堂加分 +5',
    points: 80,
    status: '已完成',
    appliedAt: '2026-06-11 09:50:00',
    handledAt: '2026-06-11 10:00:00',
    ledgerId: 'P20260611008',
    timeline: [
      { actor: '王强', role: '学生', action: '提交兑换申请', content: '课堂加分 +5 · 消耗 80 金币', time: '2026-06-11 09:50:00' },
      { actor: '系统', role: '系统', action: '已通知班主任', content: '赵老师 · 七年级 2 班', time: '2026-06-11 09:50:01' },
      { actor: '赵老师', role: '老师', action: '确认核销', content: '线下已兑现课堂加分', time: '2026-06-11 10:00:00' },
    ],
  },
  {
    id: 'W20260610003',
    user: '张小花',
    school: '第一实验中学',
    className: '七年级 1 班',
    homeroomTeacher: '刘老师',
    handler: '刘老师',
    item: '早退 10 分钟',
    points: 200,
    status: '已拒绝',
    appliedAt: '2026-06-10 17:10:00',
    handledAt: '2026-06-10 18:00:00',
    ledgerId: 'P20260610015',
    rejectReason: '未满足积分规则',
    timeline: [
      { actor: '张小花', role: '学生', action: '提交兑换申请', content: '早退 10 分钟 · 消耗 200 金币', time: '2026-06-10 17:10:00' },
      { actor: '系统', role: '系统', action: '已通知班主任', content: '刘老师 · 七年级 1 班', time: '2026-06-10 17:10:01' },
      { actor: '刘老师', role: '老师', action: '拒绝核销', content: '未满足积分规则', time: '2026-06-10 18:00:00' },
      { actor: '系统', role: '系统', action: '金币已退回', content: '关联流水 P20260610015', time: '2026-06-10 18:00:01' },
    ],
  },
  {
    id: 'W20260612004',
    user: '李华',
    school: '第一实验中学',
    className: '七年级 3 班',
    homeroomTeacher: '王老师',
    handler: '',
    item: '免做卡',
    points: 150,
    status: '待核销',
    appliedAt: '2026-06-12 08:45:00',
    handledAt: '—',
    ledgerId: 'P20260612011',
    timeline: [
      { actor: '李华', role: '学生', action: '提交兑换申请', content: '免做卡 · 消耗 150 金币', time: '2026-06-12 08:45:00' },
      { actor: '系统', role: '系统', action: '已通知班主任', content: '王老师 · 七年级 3 班', time: '2026-06-12 08:45:01' },
    ],
  },
  {
    id: 'W20260609005',
    user: 'Sarah',
    school: '国际学校',
    className: '七年级 A 班',
    homeroomTeacher: 'Ms. Chen',
    handler: 'Ms. Chen',
    item: '课堂加分 +5',
    points: 80,
    status: '已完成',
    appliedAt: '2026-06-09 14:20:00',
    handledAt: '2026-06-09 15:00:00',
    ledgerId: 'P20260609020',
    timeline: [
      { actor: 'Sarah', role: '学生', action: '提交兑换申请', content: '课堂加分 +5 · 消耗 80 金币', time: '2026-06-09 14:20:00' },
      { actor: '系统', role: '系统', action: '已通知班主任', content: 'Ms. Chen · 七年级 A 班', time: '2026-06-09 14:20:01' },
      { actor: 'Ms. Chen', role: '老师', action: '确认核销', time: '2026-06-09 15:00:00' },
    ],
  },
  {
    id: 'W20260608006',
    user: '陈同学',
    school: '第二实验中学',
    className: '八年级 1 班',
    homeroomTeacher: '孙老师',
    handler: '孙老师',
    item: '免做卡',
    points: 150,
    status: '已完成',
    appliedAt: '2026-06-08 11:30:00',
    handledAt: '2026-06-08 12:00:00',
    ledgerId: 'P20260608005',
    studentNote: '月考复习期间使用',
    timeline: [
      { actor: '陈同学', role: '学生', action: '提交兑换申请', content: '免做卡 · 消耗 150 金币 · 备注：月考复习期间使用', time: '2026-06-08 11:30:00' },
      { actor: '系统', role: '系统', action: '已通知班主任', content: '孙老师 · 八年级 1 班', time: '2026-06-08 11:30:01' },
      { actor: '孙老师', role: '老师', action: '确认核销', time: '2026-06-08 12:00:00' },
    ],
  },
];

export const WISH_FILTER_SCHOOLS = ['全部', '第一实验中学', '国际学校', '第二实验中学'] as const;

export const WISH_FILTER_CLASSES: Record<string, string[]> = {
  全部: ['全部'],
  第一实验中学: ['全部', '七年级 1 班', '七年级 2 班', '七年级 3 班'],
  国际学校: ['全部', '七年级 A 班'],
  第二实验中学: ['全部', '八年级 1 班'],
};

export const WISH_FILTER_TEACHERS = ['全部', '赵老师', '刘老师', '王老师', 'Ms. Chen', '孙老师'] as const;

/** 金币消耗看板 · 总览轻量展示（近 30 天口径） */
export const COIN_CONSUMPTION_BOARD = {
  period: '近30天',
  modules: [
    { key: 'charity' as const, label: '爱心捐赠', coins: 85600 },
    { key: 'wish' as const, label: '许愿池', coins: 12400 },
    { key: 'outfit' as const, label: '装扮商城', coins: 8200 },
  ],
};

export const fmtNum = (n: number) => n.toLocaleString('zh-CN');
export const fmtYuan = (n: number) => `¥${fmtNum(n)}`;
