"use server";

import { redirect } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { clearSessionCookies, setSessionCookies, type SessionUser } from "@/lib/session";

export async function logoutAction() {
  await clearSessionCookies();
  redirect("/login");
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: SessionUser;
}

export interface PerformLoginResult {
  error?: string;
  success?: boolean;
}

/**
 * Shared by the /login page's own form (src/app/login/actions.ts, which redirects on
 * success) and reauthenticateAction below (which doesn't — it's called from the in-place
 * session-expired dialog, which needs to stay on the current page and retry whatever action
 * failed, not navigate away).
 */
export async function performLogin(email: string, password: string): Promise<PerformLoginResult> {
  if (!email || !password) {
    return { error: "Please enter your email and password." };
  }

  let response: LoginResponse;
  try {
    response = await apiFetch<LoginResponse>("/auth/login", {
      method: "POST",
      body: { email, password },
      unauthenticated: true,
    });
  } catch (error) {
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      return { error: "Incorrect email or password." };
    }
    return { error: "Something went wrong. Please try again." };
  }

  if (!response.user.partnerId) {
    return {
      error:
        "This is a Protegey administrator account, not a partner account. Please use the Protegey admin portal to sign in.",
    };
  }

  await setSessionCookies(response.accessToken, response.refreshToken, response.user);
  return { success: true };
}

/** Called directly from SessionExpiredProvider's dialog — logs back in without navigating. */
export async function reauthenticateAction(email: string, password: string): Promise<PerformLoginResult> {
  return performLogin(email, password);
}

/**
 * Locks the caller's own session server-side (see backend's JwtAuthGuard — every other request
 * gets rejected with 423 until unlocked). Called from ScreenLockProvider, both on a manual
 * "Lock" click and from the inactivity timer; the overlay itself shows immediately and
 * optimistically on the client regardless of this call's outcome, so a failure here (e.g. the
 * token already expired) is swallowed — there's nothing meaningful to report back, and the
 * existing session-expired flow already covers "the token itself is no longer valid".
 */
export async function lockScreenAction(): Promise<void> {
  try {
    await apiFetch("/auth/lock", { method: "POST" });
  } catch {
    // Nothing to lock (already logged out) — not this action's job to handle.
  }
}

export interface UnlockScreenResult {
  success?: boolean;
  error?: string;
  /** Too many incorrect attempts — the account is now locked out of login entirely for the
   * lockout window (same counter a real login uses), so there's nothing left to unlock back
   * into. The caller must sign the user all the way out instead of leaving them on a password
   * box that cannot succeed. Session cookies are already cleared by the time this is true. */
  forcedLogout?: boolean;
}

/** Password-only re-auth to clear a screen lock — no email (the session already knows who this
 * is) and no OTP (this isn't a new login, just re-proving physical presence). */
export async function unlockScreenAction(password: string): Promise<UnlockScreenResult> {
  if (!password) {
    return { error: "Please enter your password." };
  }

  try {
    await apiFetch("/auth/unlock", { method: "POST", body: { password } });
    return { success: true };
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return { error: "Incorrect password." };
    }
    if (error instanceof ApiError && error.status === 403) {
      await clearSessionCookies();
      return { error: error.message, forcedLogout: true };
    }
    return { error: "Something went wrong. Please try again." };
  }
}
