import {
  getMistakeReasonLabel,
  getMistakeReasonLabels,
  MISTAKE_REASON_MAX_COUNT,
  MISTAKE_REASON_META,
  MistakeReasonKey,
} from '../data/mistakeReasons';

const STORAGE_KEY = 'ai_friend_mistake_reasons';

export interface MistakeReasonEntry {
  reasons: MistakeReasonKey[];
  reasonLabels: string[];
  errorTypes: string[];
  updatedAt: string;
}

type MistakeReasonRecord = Record<string, MistakeReasonEntry>;

const normalizeEntry = (raw: unknown): MistakeReasonEntry | undefined => {
  if (!raw || typeof raw !== 'object') return undefined;
  const value = raw as Record<string, unknown>;
  if (Array.isArray(value.reasons)) {
    const reasons = value.reasons.filter(Boolean) as MistakeReasonKey[];
    return buildEntry(reasons);
  }
  if (typeof value.reason === 'string') {
    return buildEntry([value.reason as MistakeReasonKey]);
  }
  return undefined;
};

const buildEntry = (reasons: MistakeReasonKey[]): MistakeReasonEntry => {
  const unique = Array.from(new Set(reasons)).slice(0, MISTAKE_REASON_MAX_COUNT);
  return {
    reasons: unique,
    reasonLabels: getMistakeReasonLabels(unique),
    errorTypes: unique.map((key) => MISTAKE_REASON_META[key].errorType),
    updatedAt: new Date().toISOString(),
  };
};

const readRecords = (): MistakeReasonRecord => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const records: MistakeReasonRecord = {};
    Object.entries(parsed).forEach(([questionId, entry]) => {
      const normalized = normalizeEntry(entry);
      if (normalized) records[questionId] = normalized;
    });
    return records;
  } catch {
    return {};
  }
};

const writeRecords = (records: MistakeReasonRecord) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
};

export const recordMistakeReasons = (
  questionId: string,
  reasons: MistakeReasonKey[],
): MistakeReasonEntry => {
  const entry = buildEntry(reasons);
  const records = readRecords();
  records[questionId] = entry;
  writeRecords(records);
  return entry;
};

/** @deprecated 兼容旧调用，等价于只保留 1 项 */
export const recordMistakeReason = (questionId: string, reason: MistakeReasonKey) =>
  recordMistakeReasons(questionId, [reason]);

export const getMistakeReasons = (questionId: string): MistakeReasonKey[] =>
  readRecords()[questionId]?.reasons ?? [];

/** @deprecated 返回首个错因，兼容旧逻辑 */
export const getMistakeReason = (questionId: string): MistakeReasonKey | undefined =>
  getMistakeReasons(questionId)[0];

export const getMistakeReasonLabelForQuestion = (questionId: string): string | undefined => {
  const stored = readRecords()[questionId];
  if (!stored?.reasonLabels?.length) {
    return getMistakeReasonLabel(stored?.reasons?.[0]);
  }
  return stored.reasonLabels.join('、');
};

export const listMistakeReasonRecords = () => readRecords();
