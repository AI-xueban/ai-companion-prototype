export interface HomeworkControlRule { excludedClassIds?: string[]; id: number; scope: 'school' | 'grade' | 'class'; grade: string; classId: string; mode: 'default' | 'custom'; allowAnswer: boolean; allowExplanation: boolean }
export const defaultHomeworkControl = { allowAnswer: false, allowExplanation: false };
export const createHomeworkControlRule = (id: number): HomeworkControlRule => ({ id, scope: 'school', grade: '', classId: '', mode: 'default', ...defaultHomeworkControl });
