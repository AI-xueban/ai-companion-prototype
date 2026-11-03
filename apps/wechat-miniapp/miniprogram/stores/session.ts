import type { LoginResult, SessionProfile } from "../types/identity";
import { resetWorkScope } from '../services/workbenchScope';
import { DEMO_GUARDIAN_CHILD_IDS, getDemoStudent } from '../services/schoolDemoRoster';

const SESSION_KEY = "ai_companion_session";

export function saveSession(session: LoginResult): void {
  resetWorkScope();
  wx.setStorageSync(SESSION_KEY, session);
}

export function getSession(): LoginResult | undefined {
  return wx.getStorageSync(SESSION_KEY) as LoginResult | undefined;
}

export function getProfile(): SessionProfile | undefined {
  return getSession()?.profile;
}

export function linkedGuardianStudents(profile?: SessionProfile) {
  if (!profile?.roles.includes('guardian')) return [];
  const ids = profile.userId === 'guardian-demo-001' ? DEMO_GUARDIAN_CHILD_IDS : profile.linkedStudentIds || [];
  return [...new Set(ids)].map(id => getDemoStudent(id)).filter((student): student is NonNullable<typeof student> => Boolean(student));
}

export function selectGuardianStudent(studentId: string): boolean {
  const session = getSession();
  if (!session?.profile || !session.expiresAt || session.expiresAt <= Date.now() || !linkedGuardianStudents(session.profile).some(student => student.id === studentId)) return false;
  wx.setStorageSync(SESSION_KEY, { ...session, profile: { ...session.profile, activeStudentId: studentId } });
  return true;
}

export function clearSession(): void {
  resetWorkScope();
  wx.removeStorageSync(SESSION_KEY);
}
