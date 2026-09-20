import { SubjectType } from '../types';

export type AfterclassPracticeStatus = 'not_started' | 'in_progress' | 'completed';

export const AFTERCLASS_STATUS_LABEL: Record<AfterclassPracticeStatus, string> = {
  not_started: '未练习',
  in_progress: '练习中',
  completed: '已练完',
};

export type AfterclassPracticeBank = {
  status: AfterclassPracticeStatus;
  remaining: number;
  bankSize: number;
};

type StoredBank = Partial<AfterclassPracticeBank>;

const STORAGE_KEY = 'ai_friend_afterclass_practice_bank_v2';

const SEED: Record<string, StoredBank> = {
  '数学::北师大版::math-unit-1-section-1': { status: 'completed', remaining: 0, bankSize: 18 },
  '数学::北师大版::math-unit-1-section-2': { status: 'in_progress', remaining: 12, bankSize: 18 },
};

let cache: Record<string, StoredBank> | null = null;
let pendingKey: string | null = null;

function statusKey(subject: string, textbook: string, cardId: string) {
  return `${subject}::${textbook}::${cardId}`;
}

function defaultBankSize(cardId: string) {
  return cardId.includes('__unit') ? 24 : 18;
}

function load() {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    cache = raw ? (JSON.parse(raw) as Record<string, StoredBank>) : { ...SEED };
  } catch {
    cache = { ...SEED };
  }
  return cache;
}

function persist() {
  if (!cache) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
}

function ensureRecord(subject: string, textbook: string, cardId: string) {
  const key = statusKey(subject, textbook, cardId);
  const current = load();
  if (!current[key]) current[key] = {};
  if (!current[key].bankSize) current[key].bankSize = defaultBankSize(cardId);
  if (current[key].remaining == null) current[key].remaining = current[key].bankSize;
  if (!current[key].status) current[key].status = 'not_started';
  return { key, record: current[key] };
}

export function getAfterclassPracticeBank(
  subject: SubjectType | string,
  textbook: string,
  cardId: string
): AfterclassPracticeBank {
  const { record } = ensureRecord(subject, textbook, cardId);
  return {
    status: record.status || 'not_started',
    remaining: record.remaining ?? defaultBankSize(cardId),
    bankSize: record.bankSize || defaultBankSize(cardId),
  };
}

export function getAfterclassPracticeStatus(
  subject: SubjectType | string,
  textbook: string,
  cardId: string
): AfterclassPracticeStatus {
  return getAfterclassPracticeBank(subject, textbook, cardId).status;
}

export function beginAfterclassPractice(
  subject: SubjectType | string,
  textbook: string,
  cardId: string,
  questionCount: number
) {
  const { key, record } = ensureRecord(subject, textbook, cardId);
  pendingKey = key;
  record.status = 'in_progress';
  record.remaining = Math.max(0, (record.remaining ?? record.bankSize ?? 0) - Math.max(0, questionCount));
  persist();
}

export function completePendingAfterclassPractice() {
  if (!pendingKey) return;
  const current = load();
  if (!current[pendingKey]) current[pendingKey] = {};
  current[pendingKey].status = 'completed';
  persist();
  pendingKey = null;
}

export function refreshAfterclassPracticeBank(
  subject: SubjectType | string,
  textbook: string,
  cardId: string
) {
  const { record } = ensureRecord(subject, textbook, cardId);
  record.bankSize = record.bankSize || defaultBankSize(cardId);
  record.remaining = record.bankSize;
  persist();
}
