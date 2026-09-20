import { DEMO_STUDENT_ACADEMIC } from '../data/studentAcademicProfile';
import type { UiSchoolSystem } from '../data/juniorDemoCatalog';

const STORAGE_KEY = 'ai_friend_academic_context_v1';

export type AcademicContext = {
  grade: string;
  term: string;
  schoolSystem: UiSchoolSystem;
};

export function getDefaultAcademicContext(): AcademicContext {
  return {
    grade: DEMO_STUDENT_ACADEMIC.grade,
    term: DEMO_STUDENT_ACADEMIC.term,
    schoolSystem: DEMO_STUDENT_ACADEMIC.schoolSystem,
  };
}

export function loadAcademicContext(): AcademicContext {
  const fallback = getDefaultAcademicContext();
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<AcademicContext>;
    return {
      grade: parsed.grade || fallback.grade,
      term: parsed.term || fallback.term,
      schoolSystem: parsed.schoolSystem === '五四制' ? '五四制' : '六三制',
    };
  } catch {
    return fallback;
  }
}

export function saveAcademicContext(context: AcademicContext) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(context));
  } catch {
    /* ignore quota / private mode */
  }
}
