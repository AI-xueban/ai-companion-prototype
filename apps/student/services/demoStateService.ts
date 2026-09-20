const LOCAL_STORAGE_KEYS = new Set([
  'ai_friend_daily_word_check_ins',
  'ai_friend_mistake_reasons',
  'ai_friend_question_feedback',
  'ai_friend_reward_ledger_v1',
  'ai_friend_similar_attempts',
  'ai_friend_tutor_explain_feedback',
  'ai_friend_textbook_versions_v1',
  'ai_friend_academic_context_v1',
  'kg-chinese-display-scheme',
  'kg-mastery-overrides',
  'lumi-space-auto-voice',
  'mockTeacherToken',
]);

const LOCAL_STORAGE_PREFIXES = [
  'kg-last-scope-',
  'sync-lesson-progress-',
];

const SESSION_STORAGE_KEYS = new Set([
  'kg-practice-pending',
]);

const SESSION_STORAGE_PREFIXES = [
  'kg-return-node-',
  'kg-sync-lesson-kpoints-',
];

function removeProjectEntries(
  storage: Storage,
  exactKeys: Set<string>,
  prefixes: string[],
): number {
  const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index))
    .filter((key): key is string => Boolean(key));

  const projectKeys = keys.filter((key) => (
    exactKeys.has(key) || prefixes.some((prefix) => key.startsWith(prefix))
  ));

  projectKeys.forEach((key) => storage.removeItem(key));
  return projectKeys.length;
}

export function resetDemoPersistentState(): number {
  if (typeof window === 'undefined') return 0;

  return removeProjectEntries(localStorage, LOCAL_STORAGE_KEYS, LOCAL_STORAGE_PREFIXES)
    + removeProjectEntries(sessionStorage, SESSION_STORAGE_KEYS, SESSION_STORAGE_PREFIXES);
}
