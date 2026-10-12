import type { LoginResult, UserRole } from "../types/identity";

/**
 * 只获取临时 code，不直接把 openid、unionid 或长期令牌放在小程序端。
 * 后端须校验 code、完成账号绑定并返回短期业务会话。
 */
export async function requestWechatLoginCode(): Promise<string> {
  const result = await wx.login();
  if (!result.code) throw new Error("未能获取微信登录凭证");
  return result.code;
}

export async function loginPlatformAccount(_account: string, _credential: string): Promise<LoginResult> {
  throw new Error("请接入后端 POST /auth/platform-login 接口");
}

export async function bindWechatToStudent(_studentId: string): Promise<void> {
  const code = await requestWechatLoginCode();
  void code;
  throw new Error("请接入后端 POST /account/wechat-bind 接口");
}

/**
 * 仅用于当前原型：模拟后端在完成微信授权、平台身份验证和关系校验后返回的会话。
 * 接入后端时，应由 code-login/platform-login 的真实响应替换它，不能在前端伪造授权。
 */
export function createDemoLoginResult(role: UserRole, activeStudentId?: string): LoginResult {
  const isGuardian = role === "guardian";
  return {
    accessToken: "demo-short-lived-session",
    profile: {
      userId: isGuardian ? "guardian-demo-001" : "teacher-demo-001",
      roles: [role],
      displayName: isGuardian ? "王女士" : "陈老师",
      activeStudentId: isGuardian ? activeStudentId : undefined,
      activeClassId: isGuardian ? undefined : "class-g5-2",
    },
  };
}
