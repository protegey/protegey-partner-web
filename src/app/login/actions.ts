"use server";

import { redirect } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { setSessionCookies, type SessionUser } from "@/lib/session";

export interface LoginState {
  error?: string;
}

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: SessionUser;
}

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

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

  await setSessionCookies(response.accessToken, response.refreshToken, response.user);
  redirect("/dashboard");
}
