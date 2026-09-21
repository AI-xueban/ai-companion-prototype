import type { LoginResult } from "../types/identity";

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
