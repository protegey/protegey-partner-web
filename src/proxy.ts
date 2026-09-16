import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  ACCESS_TOKEN_MAX_AGE,
  REFRESH_TOKEN_MAX_AGE,
  sessionCookieOptions,
} from "@/lib/session";

// "/client-application" is a business's own KYB questionnaire for a partner (e.g. Neero) — it
// has no Protegey account and no session at all, so it must never redirect to /login. Its two
// API proxy routes (document + partner-logo download) are equally public and session-less.
const PUBLIC_PATHS = [
  "/login",
  "/invitations/accept",
  "/reset-password",
  "/client-application",
  "/api/client-application-document",
  "/api/client-application-partner-logo",
];
// Routes a partner can still reach while their KYB verification is pending or rejected —
// they must be able to submit/see their documents, but nothing else in the app. API routes
// are always allowed through — they're not pages to redirect, and enforce their own auth.
const ALLOWED_WHILE_UNVERIFIED = ["/documents", "/settings", "/api"];

const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://localhost:3000";

async function isPartnerActive(accessToken: string): Promise<boolean> {
  try {
    const response = await fetch(`${BACKEND_API_URL}/partners/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!response.ok) return true; // fail open — real auth is still enforced by the API itself
    const partner = await response.json();
    return partner?.status === "active";
  } catch {
    return true;
  }
}

/**
 * The access-token cookie's own 15-minute maxAge means the browser has already deleted it
 * once it's truly expired — no need to decode the JWT to know that. Without this, every
 * request past that point (page loads AND Server Action POSTs alike, since the matcher below
 * covers both) fell straight into the "no session" branch further down and got redirected to
 * /login — which is fine for a page navigation, but a redirect response to a Server Action's
 * fetch() doesn't match the shape React expects back, which is what actually produced the
 * crash reported when clicking a button after being idle. Silently refreshing here, before
 * that check runs, means the common case (session younger than 30 days) never reaches it.
 */
async function tryRefresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string } | null> {
  try {
    const res = await fetch(`${BACKEND_API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path));

  let accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  let refreshed: { accessToken: string; refreshToken: string } | null = null;

  if (!accessToken && !isPublicPath) {
    const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
    if (refreshToken) {
      refreshed = await tryRefresh(refreshToken);
      if (refreshed) {
        accessToken = refreshed.accessToken;
        // So the checks below (and the page/action that runs after this) see the fresh
        // token on *this* request, instead of waiting for the browser to resend it.
        request.cookies.set(ACCESS_TOKEN_COOKIE, refreshed.accessToken);
        request.cookies.set(REFRESH_TOKEN_COOKIE, refreshed.refreshToken);
      }
    }
  }

  const hasSession = Boolean(accessToken);

  if (!hasSession && !isPublicPath) {
    const loginUrl = new URL("/login", request.url);
    // Only worth round-tripping back to for an actual page navigation — a Server Action
    // that ends up here (refresh token also dead) is a genuine, rare full logout; there's no
    // "returnTo" that helps a POST resume, and the redirect itself is the fallback already.
    if (request.method === "GET" && !request.headers.has("next-action")) {
      loginUrl.searchParams.set("returnTo", pathname + request.nextUrl.search);
    }
    return NextResponse.redirect(loginUrl);
  }

  if (hasSession && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  const isAllowedWhileUnverified = ALLOWED_WHILE_UNVERIFIED.some((path) => pathname.startsWith(path));
  if (hasSession && !isPublicPath && !isAllowedWhileUnverified) {
    const active = await isPartnerActive(accessToken!);
    if (!active) {
      return NextResponse.redirect(new URL("/documents", request.url));
    }
  }

  const response = NextResponse.next({ request });
  if (refreshed) {
    response.cookies.set(ACCESS_TOKEN_COOKIE, refreshed.accessToken, sessionCookieOptions(ACCESS_TOKEN_MAX_AGE));
    response.cookies.set(REFRESH_TOKEN_COOKIE, refreshed.refreshToken, sessionCookieOptions(REFRESH_TOKEN_MAX_AGE));
  }
  return response;
}

export const config = {
  // "images/" excludes public/images/* (login hero, welcome illustration, etc.) — static
  // assets must never go through the session/verification checks above.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/).*)"],
};
