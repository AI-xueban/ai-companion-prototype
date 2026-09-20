import { useEffect, useState } from 'react';

export type DonationStageStatus = '募集中' | '已满' | '已结项';

export interface DonationStage {
  id: string;
  name: string;
  period: string;
  capCoins: number;
  receivedCoins: number;
  ruleVersion: string;
  status: DonationStageStatus;
  projectNote?: string;
  closedAt?: string;
}

export const PENDING_DONATION_PROJECT_NAME = '项目名称：待定';
export const PENDING_DONATION_PROJECT_NOTE =
  '项目名称尚未确定，待后续录入；当前可先配置募款上限并查看进度。';

const LEGACY_STAGE_NAME_PATTERN = /守望乡|图书角|多媒体教室|下阶段募款/;

const INITIAL_STAGES: DonationStage[] = [
  {
    id: 'stage-2026-q1',
    name: `${PENDING_DONATION_PROJECT_NAME}（已结项）`,
    period: '2026年1月 — 3月',
    capCoins: 180_000,
    receivedCoins: 180_000,
    ruleVersion: 'V1.0',
    status: '已结项',
    closedAt: '2026-04-03',
    projectNote: PENDING_DONATION_PROJECT_NOTE,
  },
  {
    id: 'stage-2026-q2',
    name: PENDING_DONATION_PROJECT_NAME,
    period: '2026年4月 — 6月',
    capCoins: 200_000,
    receivedCoins: 128_800,
    ruleVersion: 'V1.0',
    status: '募集中',
    projectNote: PENDING_DONATION_PROJECT_NOTE,
  },
];

const isPendingProjectStage = (stage: Pick<DonationStage, 'name'>) =>
  stage.name.includes('待定')
  || stage.name.includes('待命名')
  || stage.name.includes('待配置')
  || LEGACY_STAGE_NAME_PATTERN.test(stage.name);

const normalizeStage = (stage: DonationStage): DonationStage => {
  if (!isPendingProjectStage(stage)) return { ...stage };

  const closedSuffix = stage.status === '已结项' ? '（已结项）' : '';
  return {
    ...stage,
    name: `${PENDING_DONATION_PROJECT_NAME}${closedSuffix}`,
    projectNote: stage.projectNote ?? PENDING_DONATION_PROJECT_NOTE,
  };
};

let stages: DonationStage[] = INITIAL_STAGES.map((s) => ({ ...s }));
let activeStageId = 'stage-2026-q2';

type StageListener = () => void;
const listeners = new Set<StageListener>();

const emitStageChange = () => {
  listeners.forEach((fn) => fn());
};

const reconcileStageCatalog = () => {
  const seedById = new Map(INITIAL_STAGES.map((s) => [s.id, s]));
  stages = stages.map((stage) => {
    const seed = seedById.get(stage.id);
    const merged = seed
      ? { ...stage, name: seed.name, projectNote: seed.projectNote, period: seed.period }
      : stage;
    return normalizeStage(merged);
  });
};

reconcileStageCatalog();

export const subscribeDonationStage = (fn: StageListener) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};

export const getDonationStages = (): DonationStage[] => stages.map((s) => normalizeStage(s));

export const getActiveStage = (): DonationStage | undefined => {
  const stage = stages.find((s) => s.id === activeStageId);
  return stage ? normalizeStage(stage) : undefined;
};

export const setDonationStageDemoStatus = (status: DonationStageStatus) => {
  reconcileStageCatalog();

  if (status === '已结项') {
    activeStageId = 'stage-2026-q1';
    emitStageChange();
    return;
  }

  const currentStage = stages.find((s) => s.id === 'stage-2026-q2');
  if (!currentStage) return;

  activeStageId = currentStage.id;
  currentStage.status = status;
  currentStage.closedAt = undefined;
  currentStage.receivedCoins = status === '已满' ? currentStage.capCoins : 128_800;
  emitStageChange();
};

/** 运营后台展示 */
export const getStageAdminLabel = (stage: DonationStage) =>
  isPendingProjectStage(stage) ? PENDING_DONATION_PROJECT_NAME : stage.name;

/** 学生端展示：具体项目名未定时用通用文案 */
export const getStageStudentLabel = (stage: DonationStage) =>
  isPendingProjectStage(stage) ? '本期爱心募款' : stage.name;

export const getStageProgress = (stage: DonationStage) => {
  const remaining = Math.max(0, stage.capCoins - stage.receivedCoins);
  const percent = stage.capCoins > 0 ? Math.min(100, (stage.receivedCoins / stage.capCoins) * 100) : 0;
  const isFull = remaining <= 0 || stage.status === '已满' || stage.status === '已结项';
  return { remaining, percent, isFull };
};

/** 学生端：爱心大使募款是否进行中（仅「募集中」可捐） */
export const isCharityCampaignRunning = (stage?: DonationStage): boolean =>
  !!stage && stage.status === '募集中';

export const validateStageDonation = (coins: number): { ok: boolean; message?: string } => {
  const stage = stages.find((s) => s.id === activeStageId);
  if (!stage) return { ok: false, message: '当前无开放募款阶段，请稍后再试' };
  if (stage.status === '已结项') return { ok: false, message: '本阶段已结项，请等待下阶段开启' };
  if (stage.status === '已满') return { ok: false, message: '本阶段爱心目标已满，感谢你的参与' };

  const { remaining } = getStageProgress(normalizeStage(stage));
  if (remaining <= 0) return { ok: false, message: '本阶段爱心目标已满，感谢你的参与' };
  if (coins > remaining) {
    return { ok: false, message: `本阶段剩余可捐 ${remaining.toLocaleString()} 金币，请调整捐赠数量` };
  }
  return { ok: true };
};

export const applyStageDonation = (coins: number): boolean => {
  const check = validateStageDonation(coins);
  if (!check.ok) return false;

  const stage = stages.find((s) => s.id === activeStageId);
  if (!stage) return false;

  stage.receivedCoins += coins;
  if (stage.receivedCoins >= stage.capCoins) {
    stage.receivedCoins = stage.capCoins;
    stage.status = '已满';
  }
  emitStageChange();
  return true;
};

export const updateActiveStageCap = (capCoins: number) => {
  const stage = stages.find((s) => s.id === activeStageId);
  if (!stage || stage.status === '已结项') return;

  stage.capCoins = Math.max(stage.receivedCoins, capCoins);
  if (stage.receivedCoins >= stage.capCoins) stage.status = '已满';
  else stage.status = '募集中';
  emitStageChange();
};

export const updateActiveStageMeta = (patch: Pick<DonationStage, 'name' | 'period' | 'projectNote'>) => {
  const stage = stages.find((s) => s.id === activeStageId);
  if (!stage || stage.status === '已结项') return;
  Object.assign(stage, patch);
  emitStageChange();
};

export const closeActiveStageAndOpenNext = (): DonationStage | null => {
  const stage = stages.find((s) => s.id === activeStageId);
  if (!stage) return null;

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  stage.status = '已结项';
  stage.closedAt = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  stage.name = `${PENDING_DONATION_PROJECT_NAME}（已结项）`;

  const next: DonationStage = normalizeStage({
    id: `stage-${now.getFullYear()}-q${Math.ceil((now.getMonth() + 1) / 3)}-next`,
    name: PENDING_DONATION_PROJECT_NAME,
    period: '待配置',
    capCoins: 200_000,
    receivedCoins: 0,
    ruleVersion: stage.ruleVersion,
    status: '募集中',
    projectNote: PENDING_DONATION_PROJECT_NOTE,
  });
  stages = [...stages.map((s) => (s.id === stage.id ? normalizeStage(stage) : normalizeStage(s))), next];
  activeStageId = next.id;
  emitStageChange();
  return { ...next };
};

export const useDonationStage = () => {
  const [, tick] = useState(0);
  useEffect(() => subscribeDonationStage(() => tick((n) => n + 1)), []);
  const activeStage = getActiveStage();
  const progress = activeStage ? getStageProgress(activeStage) : null;
  return { activeStage, progress, stages: getDonationStages() };
};

if (import.meta.hot) {
  import.meta.hot.accept(() => {
    reconcileStageCatalog();
    emitStageChange();
  });
}
