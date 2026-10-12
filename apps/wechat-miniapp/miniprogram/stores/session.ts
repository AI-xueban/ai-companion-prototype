import type { LoginResult, SessionProfile } from "../types/identity";

const SESSION_KEY = "ai_companion_session";

export function saveSession(session: LoginResult): void {
  wx.setStorageSync(SESSION_KEY, session);
}

export function getSession(): LoginResult | undefined {
  return wx.getStorageSync(SESSION_KEY) as LoginResult | undefined;
}

export function getProfile(): SessionProfile | undefined {
  return getSession()?.profile;
}

export function clearSession(): void {
  wx.removeStorageSync(SESSION_KEY);
}
