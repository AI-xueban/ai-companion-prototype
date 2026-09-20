/**
 * 手写学情快照（无知识图谱）。
 * 健康分与五态规则见 docs/v2.0/02-学科/课本同步学/05-同步课本与自主练习-阅读版.md 第 10 节。
 */

export type MasterySource = 'hand';

export type MasteryStatus = 'unknown' | 'exploring' | 'mastered' | 'reviewing' | 'weak';

export interface StudentMasteryRecord {
  studentId: string;
  subject: string;
  version: string;
  grade: string;
  term: string;
  kpName: string;
  kpKey: string;
  kgNodeId?: string;
  nMastered: number;
  nReviewing: number;
  nWeak: number;
  score: number;
  lastPracticedAt?: string;
  source: MasterySource;
}

export const MASTERY_STATUS_LABEL: Record<MasteryStatus, string> = {
  unknown: '未知',
  exploring: '探索中',
  mastered: '已掌握',
  reviewing: '待复习',
  weak: '待攻克',
};

export function makeKpKey(
  subject: string,
  version: string,
  grade: string,
  term: string,
  kpName: string,
): string {
  return `${subject}|${version}|${grade}|${term}|${kpName}`;
}

export function computeHealthScore(nMastered: number, nReviewing: number, nWeak: number): number {
  const total = nMastered + nReviewing + nWeak;
  if (total <= 0) return 0;
  return Math.round((nMastered * 100 + nReviewing * 60) / total);
}

export function deriveMasteryStatus(nMastered: number, nReviewing: number, nWeak: number): MasteryStatus {
  const total = nMastered + nReviewing + nWeak;
  if (total === 0) return 'unknown';
  if (total < 2) return 'exploring';
  const score = computeHealthScore(nMastered, nReviewing, nWeak);
  if (score >= 80) return 'mastered';
  if (score >= 60) return 'reviewing';
  return 'weak';
}

const rec = (
  studentId: string,
  subject: string,
  version: string,
  grade: string,
  term: string,
  kpName: string,
  nMastered: number,
  nReviewing: number,
  nWeak: number,
  lastPracticedAt?: string,
): StudentMasteryRecord => ({
  studentId,
  subject,
  version,
  grade,
  term,
  kpName,
  kpKey: makeKpKey(subject, version, grade, term, kpName),
  kgNodeId: undefined,
  nMastered,
  nReviewing,
  nWeak,
  score: computeHealthScore(nMastered, nReviewing, nWeak),
  lastPracticedAt,
  source: 'hand',
});

/** 原型学生 demo-s1：九年级上，数学北师大 / 语文人教 / 英语沪教 */
export const MOCK_STUDENT_MASTERY: StudentMasteryRecord[] = [
  rec('demo-s1', '数学', '北师大版', '九年级', '上册', '菱形的性质', 9, 2, 1, '2026-08-12'),
  rec('demo-s1', '数学', '北师大版', '九年级', '上册', '菱形的判定', 4, 4, 2, '2026-08-10'),
  rec('demo-s1', '数学', '北师大版', '九年级', '上册', '一元二次方程的定义', 6, 5, 4, '2026-08-14'),
  rec('demo-s1', '数学', '北师大版', '九年级', '上册', '根的判别式', 2, 3, 4, '2026-08-08'),
  rec('demo-s1', '数学', '北师大版', '九年级', '上册', '相似三角形的判定', 1, 0, 0, '2026-08-05'),
  rec('demo-s1', '语文', '人教版', '九年级', '上册', '1 沁园春·雪/毛泽东', 6, 1, 0, '2026-08-11'),
  rec('demo-s1', '英语', '沪教版', '九年级', '上册', 'Unit 1 Great people', 4, 5, 1, '2026-08-13'),
];

export function getStudentMastery(
  studentId: string,
  kpName: string,
  subject?: string,
): StudentMasteryRecord | undefined {
  return MOCK_STUDENT_MASTERY.find((row) =>
    row.studentId === studentId
    && row.kpName === kpName
    && (!subject || row.subject === subject),
  );
}

export function getMasteryView(studentId: string, kpName: string, subject?: string) {
  const row = getStudentMastery(studentId, kpName, subject);
  if (!row) {
    return {
      score: 0,
      status: 'unknown' as MasteryStatus,
      label: MASTERY_STATUS_LABEL.unknown,
      nMastered: 0,
      nReviewing: 0,
      nWeak: 0,
    };
  }
  const status = deriveMasteryStatus(row.nMastered, row.nReviewing, row.nWeak);
  return {
    score: row.score,
    status,
    label: MASTERY_STATUS_LABEL[status],
    nMastered: row.nMastered,
    nReviewing: row.nReviewing,
    nWeak: row.nWeak,
  };
}
