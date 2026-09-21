export type UserRole = "student" | "guardian" | "teacher";

export interface SessionProfile {
  userId: string;
  roles: UserRole[];
  displayName: string;
  activeStudentId?: string;
  activeClassId?: string;
}

export interface LoginResult {
  accessToken: string;
  profile: SessionProfile;
}
