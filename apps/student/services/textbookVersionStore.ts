import { getDemoTextbookVersions, isJuniorGrade, preferredVersion, type UiSchoolSystem } from '../data/juniorDemoCatalog';
import { getJuniorChineseTextbookVersions } from '../data/juniorChineseSyncVideos';
import { getAssignedTextbookVersion } from '../data/studentAcademicProfile';
import { DEFAULT_SUBJECT_TEXTBOOK, STUDY_TEXTBOOK_OPTIONS } from '../data/syncTextbookCatalog';
import type { SubjectType } from '../types';

const STORAGE_KEY = 'ai_friend_textbook_versions_v1';

type VersionRecord = {
  version: string;
  updatedAt: number;
};

type VersionMap = Record<string, VersionRecord>;

function readMap(): VersionMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as VersionMap;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeMap(map: VersionMap) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore quota / private mode */
  }
}

export function getAvailableTextbookVersions(
  subject: string,
  grade: string,
  term: string,
  schoolSystem: UiSchoolSystem,
): string[] {
  if (!isJuniorGrade(grade, schoolSystem)) {
    const preferred = DEFAULT_SUBJECT_TEXTBOOK[subject as SubjectType];
    return preferred
      ? [preferred, ...STUDY_TEXTBOOK_OPTIONS.filter((version) => version !== preferred)]
      : [...STUDY_TEXTBOOK_OPTIONS];
  }
  if (subject === '语文') {
    if (schoolSystem !== '六三制') return [];
    return getJuniorChineseTextbookVersions(grade, term);
  }
  return getDemoTextbookVersions(subject, grade, term, schoolSystem);
}

/** 读取该学科用户最后一次亲手选过的教材版本。 */
export function getSavedTextbookVersion(subject: string): string | null {
  const record = readMap()[subject];
  return record?.version || null;
}

/** 学生改版本时写入。自动回落不要调用，以免覆盖有效历史。 */
export function saveTextbookVersion(subject: string, version: string) {
  if (!subject || !version) return;
  const map = readMap();
  map[subject] = { version, updatedAt: Date.now() };
  writeMap(map);
}

/**
 * 进入页面时的展示版本：
 * 1. 该学科有学生亲手改过的版本，且当前可选列表仍包含它 → 用它
 * 2. 否则用后台学生档案里的该科版本（在可选列表内）
 * 3. 再否则用系统默认表
 */
export function resolveTextbookVersion(
  subject: string,
  availableVersions: string[],
  schoolSystem: UiSchoolSystem,
): string {
  const pool = availableVersions.length ? availableVersions : ['人教版'];
  const saved = getSavedTextbookVersion(subject);
  if (saved && pool.includes(saved)) return saved;
  const assigned = getAssignedTextbookVersion(subject);
  if (assigned && pool.includes(assigned)) return assigned;
  return preferredVersion(subject, pool, schoolSystem);
}
