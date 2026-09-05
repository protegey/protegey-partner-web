import "server-only";
import { cookies } from "next/headers";

const ACCESS_TOKEN_COOKIE = "protegey_access_token";
const REFRESH_TOKEN_COOKIE = "protegey_refresh_token";
const USER_COOKIE = "protegey_user";

const isProduction = process.env.NODE_ENV === "production";

export interface SessionUser {
  sub: string;
  email: string;
  partnerId: string | null;
  roles: string[];
  permissions: string[];
}

export async function setSessionCookies(
  accessToken: string,
  refreshToken: string,
  user: SessionUser,
) {
  const store = await cookies();
  const common = {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
    path: "/",
  };
  store.set(ACCESS_TOKEN_COOKIE, accessToken, { ...common, maxAge: 60 * 15 });
  store.set(REFRESH_TOKEN_COOKIE, refreshToken, { ...common, maxAge: 60 * 60 * 24 * 30 });
  store.set(USER_COOKIE, JSON.stringify(user), { ...common, maxAge: 60 * 60 * 24 * 30 });
}

export async function clearSessionCookies() {
  const store = await cookies();
  store.delete(ACCESS_TOKEN_COOKIE);
  store.delete(REFRESH_TOKEN_COOKIE);
  store.delete(USER_COOKIE);
}

export async function getAccessToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(ACCESS_TOKEN_COOKIE)?.value;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const raw = store.get(USER_COOKIE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}
