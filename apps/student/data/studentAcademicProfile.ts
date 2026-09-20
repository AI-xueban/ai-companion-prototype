import type { UiSchoolSystem } from './juniorDemoCatalog';

/** 后台筛到的学生个人学业档案（原型用李华）。 */
export interface StudentAcademicRecord {
  studentId: string;
  name: string;
  grade: string;
  schoolSystem: UiSchoolSystem;
  term: string;
  textbooks: Record<string, string>;
}

export const DEMO_STUDENT_ACADEMIC: StudentAcademicRecord = {
  studentId: 'demo-s1',
  name: '李华',
  grade: '七年级',
  schoolSystem: '六三制',
  term: '上册',
  textbooks: {
    语文: '人教版',
    数学: '北师大版',
    英语: '沪教版',
    道德与法治: '人教版',
    历史: '人教版',
    生物: '人教版',
    地理: '人教版',
    科学: '浙教版',
    物理: '人教版',
    化学: '人教版',
  },
};

export function getAssignedTextbookVersion(subject: string): string | null {
  const key = subject === '道法' ? '道德与法治' : subject;
  return DEMO_STUDENT_ACADEMIC.textbooks[key] ?? null;
}
