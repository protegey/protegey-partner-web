import "server-only";
import { cookies } from "next/headers";

// Namespaced "_partner" — admin-web and partner-web both run on localhost (only the port
// differs), and browsers scope cookies by domain, NOT by port. Sharing a cookie name
// between the two apps means logging into one silently overwrites the other's session.
// Exported (just the names) so middleware.ts can read/write the same cookies — middleware
// runs outside the next/headers cookies() context and can't call the functions below.
export const ACCESS_TOKEN_COOKIE = "protegey_partner_access_token";
export const REFRESH_TOKEN_COOKIE = "protegey_partner_refresh_token";
const USER_COOKIE = "protegey_partner_user";

const isProduction = process.env.NODE_ENV === "production";

export const ACCESS_TOKEN_MAX_AGE = 60 * 15;
export const REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 30;

/** Same cookie attributes used everywhere a session cookie is set — middleware.ts reuses this shape directly. */
export function sessionCookieOptions(maxAge: number) {
  return { httpOnly: true, secure: isProduction, sameSite: "lax" as const, path: "/", maxAge };
}

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
  store.set(ACCESS_TOKEN_COOKIE, accessToken, sessionCookieOptions(ACCESS_TOKEN_MAX_AGE));
  store.set(REFRESH_TOKEN_COOKIE, refreshToken, sessionCookieOptions(REFRESH_TOKEN_MAX_AGE));
  store.set(USER_COOKIE, JSON.stringify(user), sessionCookieOptions(REFRESH_TOKEN_MAX_AGE));
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
