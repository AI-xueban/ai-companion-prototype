import type { SessionProfile, UserRole } from "../types/identity";

export function hasRole(profile: SessionProfile | undefined, role: UserRole): boolean {
  return Boolean(profile?.roles.includes(role));
}

export function homePathFor(profile: SessionProfile): string {
  if (hasRole(profile, "teacher")) return "/pages/teacher/home/index";
  if (hasRole(profile, "guardian")) return "/pages/guardian/home/index";
  return "/pages/auth/login/index";
}
