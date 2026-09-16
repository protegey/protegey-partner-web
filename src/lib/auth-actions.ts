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
