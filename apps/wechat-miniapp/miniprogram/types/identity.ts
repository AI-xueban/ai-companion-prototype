/**
 * 该小程序只提供家长与教师工作空间。
 * 学生账号是被关联的学习数据主体，而不是本小程序的登录角色。
 */
export type UserRole = "guardian" | "teacher";

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
