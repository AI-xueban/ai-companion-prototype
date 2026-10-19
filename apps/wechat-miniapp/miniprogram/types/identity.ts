/**
 * 该小程序提供家长空间，以及学校管理员与教师共用的工作台。
 * 学生账号是被关联的学习数据主体，而不是本小程序的登录角色。
 */
export type UserRole = "guardian" | "teacher" | "school_admin";

export interface SessionProfile {
  userId: string;
  roles: UserRole[];
  displayName: string;
  professionalTitles?: string[];
  teachingAssignments?: Array<{ subject: string; classIds: string[] }>;
  activeStudentId?: string;
  linkedStudentIds?: string[];
  activeClassId?: string;
}

export interface LoginResult {
  accessToken: string;
  profile: SessionProfile;
  /** 原型会话过期时间；正式环境以服务端校验结果为准。 */
  expiresAt?: number;
}
