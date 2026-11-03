export type GuardianBinding = {
  id: string;
  name: string;
  relationship: string;
  maskedPhone: string;
  isPrimary: boolean;
  boundAt: string;
};

// Read-only examples, independent of the student's QR credential.
const DEMO_BINDINGS: { schoolId: string; studentAccount: string; guardians: GuardianBinding[] }[] = [
  {
    schoolId: 'luohu-lab',
    studentAccount: '9080005',
    guardians: [
      { id: 'guardian-demo-1', name: '李建国', relationship: '爸爸', maskedPhone: '138****0021', isPrimary: true, boundAt: '2026-10-12 09:30:00' },
      { id: 'guardian-demo-2', name: '王丽', relationship: '妈妈', maskedPhone: '139****0036', isPrimary: false, boundAt: '2026-10-13 18:15:00' },
    ],
  },
];

export const getGuardianBindingDemoData = (schoolId: string, studentAccount: string): GuardianBinding[] =>
  [...(DEMO_BINDINGS.find((item) => item.schoolId === schoolId && item.studentAccount === studentAccount)?.guardians ?? [])]
    .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.boundAt.localeCompare(b.boundAt));
