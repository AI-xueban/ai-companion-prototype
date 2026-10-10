export type TeacherPortalRole = 'teacher' | 'class-teacher' | 'school-admin';
export interface TeacherPortalUser { id: string; name: string; account?: string; role: TeacherPortalRole; roleLabel: string; schoolId: string; schoolName: string; classIds: string[]; subject?: string }

export const DEMO_TEACHER_ACCOUNTS: Array<TeacherPortalUser & { account: string; password: string }> = [
  { id: 'teacher-01', account: '13800000000', password: '12345678', name: '张雨薇', role: 'teacher', roleLabel: '教师', schoolId: 'luohu-lab', schoolName: '罗湖实验学校', classIds: ['c1'], subject: '数学' },
  { id: 'head-01', account: '13800000001', password: '12345678', name: '李老师', role: 'class-teacher', roleLabel: '班主任', schoolId: 'luohu-lab', schoolName: '罗湖实验学校', classIds: ['c1'], subject: '语文' },
  { id: 'school-admin-01', account: 'admin@luohu.edu', password: '12345678', name: '学校管理员', role: 'school-admin', roleLabel: '学校管理员', schoolId: 'luohu-lab', schoolName: '罗湖实验学校', classIds: ['c1', 'c2', 'c3'] },
  { id: 'legacy-demo', account: 'demo@turing.com', password: '12345678', name: '李老师', role: 'class-teacher', roleLabel: '班主任', schoolId: 'luohu-lab', schoolName: '罗湖实验学校', classIds: ['c1'], subject: '语文' },
];

export const PORTAL_CLASSES = [
  { id: 'c1', name: '七年级(2)班', grade: 7, alertCount: 3 },
  { id: 'c2', name: '七年级(4)班', grade: 7, alertCount: 0 },
  { id: 'c3', name: '八年级(1)班', grade: 8, alertCount: 12 },
];
