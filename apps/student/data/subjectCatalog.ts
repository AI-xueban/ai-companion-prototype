import { isJuniorGrade, type UiSchoolSystem } from './juniorDemoCatalog';

/** 小学学段学科入口（与学科 Tab 一致） */
export const ELEMENTARY_SUBJECTS = ['语文', '数学', '英语', '道德与法治', '科学'] as const;

/**
 * 初中学段错题入口：展示该学段全部学科（10 科），
 * 不随当前年级裁剪，避免跨年级遗留错题找不到入口。
 */
export const JUNIOR_STAGE_SUBJECTS = [
  '语文',
  '数学',
  '英语',
  '物理',
  '化学',
  '道德与法治',
  '历史',
  '生物',
  '地理',
  '科学',
] as const;

export type StageSubject = (typeof ELEMENTARY_SUBJECTS)[number] | (typeof JUNIOR_STAGE_SUBJECTS)[number];

const JUNIOR_GRADE_SUBJECTS: Record<string, string[]> = {
  七年级: ['语文', '数学', '英语', '道德与法治', '历史', '生物', '地理', '科学'],
  八年级: ['语文', '数学', '英语', '物理', '道德与法治', '历史', '生物', '地理', '科学'],
  九年级: ['语文', '数学', '英语', '物理', '化学', '道德与法治', '历史', '科学'],
};

const WUSI_GRADE_SUBJECTS: Record<string, string[]> = {
  六年级: ['语文', '数学', '英语', '道德与法治', '历史', '生物', '地理', '科学'],
  七年级: ['语文', '数学', '英语', '道德与法治', '历史', '生物', '地理', '科学'],
  八年级: ['语文', '数学', '英语', '物理', '化学', '道德与法治', '历史', '生物', '地理', '科学'],
  九年级: ['语文', '数学', '英语', '物理', '化学', '道德与法治', '历史'],
};

/** 当前年级学科表（与学科 Tab 一致，随年级裁剪） */
export const getGradeSubjects = (
  grade: string,
  system: UiSchoolSystem = '六三制',
): string[] => {
  if (!isJuniorGrade(grade, system)) return [...ELEMENTARY_SUBJECTS];
  if (system === '五四制') return WUSI_GRADE_SUBJECTS[grade] ?? WUSI_GRADE_SUBJECTS['九年级'];
  return JUNIOR_GRADE_SUBJECTS[grade] ?? JUNIOR_GRADE_SUBJECTS['九年级'];
};

export const getMistakeVaultSubjects = (
  grade: string,
  system: UiSchoolSystem = '六三制',
): string[] =>
  isJuniorGrade(grade, system) ? [...JUNIOR_STAGE_SUBJECTS] : [...ELEMENTARY_SUBJECTS];

export const displaySubjectName = (subject: string) =>
  subject === '道德与法治' ? '道法' : subject;
