// 与平板端 2026-10-12 的校级演示名册保持相同的班级、学生 ID 和人数。
export const SCHOOL_NAME = '罗湖实验学校';
export const REPORT_END = '2026-10-12';
export interface TeachingAssignment { subject: string; classIds: string[] }
export function getDemoTeachingAssignments(teacherId: string): TeachingAssignment[] {
  if (teacherId === 'teacher-demo-001') return [{ subject: '数学', classIds: ['c1', 'c2'] }, { subject: '英语', classIds: ['c1', 'c2'] }];
  if (teacherId === 'other-teacher-demo') return [{ subject: '语文', classIds: ['c1'] }];
  return [];
}
export function formatHomeworkTitle(subject: string, kind: 'homework' | 'checkin' = 'homework', at: Date = new Date()): string {
  const date = new Date(at.getTime() + 8 * 60 * 60 * 1000);
  return `${date.getUTCMonth() + 1}月${date.getUTCDate()}日（周${'日一二三四五六'[date.getUTCDay()]}）${subject}${kind === 'checkin' ? '打卡' : '任务'}`;
}

export const DEMO_CLASSES = [
  { id: 'c1', name: '七年级(2)班', grade: 7, count: 30, used7: 18, learned7: 15, used30: 26, learned30: 23, subjects7: { 数学: 12, 语文: 10, 英语: 8 }, subjects30: { 数学: 21, 语文: 18, 英语: 15 } },
  { id: 'c2', name: '七年级(4)班', grade: 7, count: 28, used7: 21, learned7: 18, used30: 25, learned30: 22, subjects7: { 数学: 15, 语文: 12, 英语: 11 }, subjects30: { 数学: 21, 语文: 19, 英语: 18 } },
  { id: 'c3', name: '八年级(1)班', grade: 8, count: 32, used7: 19, learned7: 14, used30: 28, learned30: 24, subjects7: { 数学: 11, 语文: 10, 英语: 8, 物理: 7 }, subjects30: { 数学: 20, 语文: 19, 英语: 16, 物理: 15 } },
] as const;

export type DemoClass = typeof DEMO_CLASSES[number];
export type DemoClassId = DemoClass['id'];

const surnames = ['李', '王', '张', '陈', '刘', '杨', '赵', '黄', '周', '吴', '徐', '孙', '马', '朱', '胡', '郭', '何', '林', '高', '罗', '郑', '梁', '谢', '宋', '唐', '许', '韩', '冯', '邓', '曹', '彭', '曾'];
const givenNames = ['晨', '宇', '欣', '泽', '宁', '彤', '睿', '涵', '博', '怡', '轩', '琳', '然', '琪', '涛', '月', '乐', '悦', '航', '颖', '阳', '萱', '洋', '思', '妍', '辰', '佳', '明', '瑶', '静', '文', '昕'];

export const DEMO_STUDENTS = DEMO_CLASSES.flatMap(row => Array.from({ length: row.count }, (_, index) => ({
  id: `${row.id}-s${String(index + 1).padStart(2, '0')}`,
  name: surnames[index % surnames.length] + givenNames[(index + row.grade) % givenNames.length],
  classId: row.id,
  className: row.name,
  grade: row.grade,
})));

export type DemoStudent = typeof DEMO_STUDENTS[number];
export const GUARDIAN_STUDENT_ID = 'c1-s01';
export const DEMO_GUARDIAN_CHILD_IDS = ['c1-s01', 'c2-s02'];
export const getDemoStudent = (studentId: string) => DEMO_STUDENTS.find(student => student.id === studentId);
export const getDemoClass = (classId: string) => DEMO_CLASSES.find(row => row.id === classId);

export const reportDate = (day: number) => {
  const date = new Date(`${REPORT_END}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - day);
  return date.toISOString().slice(0, 10);
};
