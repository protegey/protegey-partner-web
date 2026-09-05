"use server";

import { redirect } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { setSessionCookies, type SessionUser } from "@/lib/session";

export interface AcceptInvitationState {
  error?: string;
}

interface AcceptInvitationResponse {
  accessToken: string;
  refreshToken: string;
  user: SessionUser;
}

export async function acceptInvitationAction(
  _prevState: AcceptInvitationState,
  formData: FormData,
): Promise<AcceptInvitationState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!token) {
    return { error: "This invitation link is missing its token." };
  }
  if (password.length < 10) {
    return { error: "Password must be at least 10 characters long." };
  }
  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  let response: AcceptInvitationResponse;
  try {
    response = await apiFetch<AcceptInvitationResponse>("/auth/invitations/accept", {
      method: "POST",
      body: { token, password },
      unauthenticated: true,
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message };
    }
    return { error: "Something went wrong. Please try again." };
  }

  await setSessionCookies(response.accessToken, response.refreshToken, response.user);
  redirect("/dashboard");
}
