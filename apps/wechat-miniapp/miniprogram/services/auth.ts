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

/** 验证码的发送、校验和账号状态检查都必须由服务端完成。 */
export async function requestTeacherSmsCode(_phone: string): Promise<void> {
  throw new Error("请接入后端教师短信验证码接口");
}

export async function loginTeacherBySms(_phone: string, _code: string): Promise<LoginResult> {
  throw new Error("请接入后端教师手机号验证码登录接口");
}

export async function loginTeacherByPassword(_phone: string, _password: string): Promise<LoginResult> {
  throw new Error("请接入后端教师账号密码登录接口");
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
    expiresAt: Date.now() + 30 * 60 * 1000,
    profile: {
      userId: isGuardian ? "guardian-demo-001" : "teacher-demo-001",
      roles: [role],
      displayName: isGuardian ? "王女士" : "陈老师",
      activeStudentId: isGuardian ? activeStudentId : undefined,
      activeClassId: isGuardian ? undefined : "class-g5-2",
    },
  };
}

/** 仅供原型演示；演示手机号与验证码不能作为正式登录凭证。 */
export function createDemoTeacherSmsResult(phone: string, code: string): LoginResult {
  if (phone !== "13800138000") throw new Error("未找到该手机号对应的教师账号");
  if (code !== "123456") throw new Error("验证码错误或已过期");
  return createDemoLoginResult("teacher");
}

/** 仅供原型演示；正式密码验证必须在服务端完成。 */
export function createDemoTeacherPasswordResult(phone: string, password: string): LoginResult {
  if (phone !== "13800138000") throw new Error("未找到该手机号对应的教师账号");
  if (password !== "Demo@123456") throw new Error("账号或密码错误");
  return createDemoLoginResult("teacher");
}

const DEMO_TEACHER_WECHAT_BINDING_KEY = "ai_companion_demo_teacher_wechat_binding";
const DEMO_TEACHER_MANUAL_LOGOUT_KEY = "ai_companion_demo_teacher_manual_logout";

/** 主动退出后停在登录页，直到老师再次主动登录。 */
export function setDemoTeacherManualLogout(value: boolean): void {
  if (value) wx.setStorageSync(DEMO_TEACHER_MANUAL_LOGOUT_KEY, true);
  else wx.removeStorageSync(DEMO_TEACHER_MANUAL_LOGOUT_KEY);
}

export function wasDemoTeacherManualLogout(): boolean {
  // 退出标记与微信绑定分开保存，退出登录不会解除账号绑定。
  return wx.getStorageSync(DEMO_TEACHER_MANUAL_LOGOUT_KEY) === true;
}

/** 原型专用：只记录是否绑定演示教师账号，不存 openid 或 session_key。正式环境由后端维护绑定关系。 */
export function getDemoTeacherWechatBinding(): string {
  return wx.getStorageSync(DEMO_TEACHER_WECHAT_BINDING_KEY) || "";
}

export function bindDemoTeacherWechat(userId: string): void {
  const existingUserId = getDemoTeacherWechatBinding();
  if (existingUserId && existingUserId !== userId) throw new Error("当前微信已绑定其他教师账号，请先解绑");
  wx.setStorageSync(DEMO_TEACHER_WECHAT_BINDING_KEY, userId);
}

export function unbindDemoTeacherWechat(userId: string, password: string): void {
  if (password !== "Demo@123456") throw new Error("二次验证失败，请检查登录密码");
  if (getDemoTeacherWechatBinding() !== userId) throw new Error("当前微信未绑定此教师账号");
  wx.removeStorageSync(DEMO_TEACHER_WECHAT_BINDING_KEY);
}
