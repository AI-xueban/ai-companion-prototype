import { getAllPrintQuestionTypes } from '../data/jyeooPrintQuestionTypeMock';

const STORAGE_KEY = 'ai-companion:print-question-type-preferences:v1';

type PreferenceMap = Record<string, string[]>;

function readAll(): PreferenceMap {
  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}') as PreferenceMap;
  } catch {
    return {};
  }
}

export function getQuestionTypePreference(subject?: string): string[] | null {
  if (!subject || typeof window === 'undefined') return null;
  const saved = readAll()[subject];
  if (!Array.isArray(saved)) return null;
  const catalog = new Set(getAllPrintQuestionTypes(subject));
  return saved.filter((item) => catalog.has(item));
}

export function saveQuestionTypePreference(subject: string, enabledTypes: string[]) {
  if (typeof window === 'undefined') return;
  const catalog = new Set(getAllPrintQuestionTypes(subject));
  const safeTypes = [...new Set(enabledTypes)].filter((item) => catalog.has(item));
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...readAll(), [subject]: safeTypes }));
}

export { STORAGE_KEY as QUESTION_TYPE_PREFERENCE_STORAGE_KEY };
