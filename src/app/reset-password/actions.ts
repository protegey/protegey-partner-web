"use server";

import { apiFetch, ApiError } from "@/lib/api";
import { getLang } from "@/lib/i18n/lang";
import { t } from "@/lib/i18n/strings";

export interface ResetPasswordState {
  error?: string;
  success?: boolean;
}

export async function resetPasswordAction(
  _prevState: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const lang = await getLang();

  if (!token) {
    return { error: t(lang, "resetPasswordMissingTokenError") };
  }
  if (password.length < 10) {
    return { error: t(lang, "resetPasswordTooShortError") };
  }
  if (password !== confirmPassword) {
    return { error: t(lang, "resetPasswordMismatchError") };
  }

  try {
    await apiFetch("/auth/reset-password", { method: "POST", body: { token, password }, unauthenticated: true });
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message };
    }
    return { error: t(lang, "commonGenericErrorTryAgain") };
  }

  return { success: true };
}
