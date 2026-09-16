"use server";

import { redirect } from "next/navigation";
import { performLogin } from "@/lib/auth-actions";

export interface LoginState {
  error?: string;
}

export async function loginAction(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const returnTo = String(formData.get("returnTo") ?? "").trim();

  const result = await performLogin(email, password);
  if (result.error) {
    return { error: result.error };
  }

  // Only ever redirect back into our own app tree — an absolute or protocol-relative
  // returnTo would let a crafted login link send the user somewhere else after signing in.
  redirect(returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/dashboard");
}
