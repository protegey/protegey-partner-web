"use server";

import { apiFetchGuarded, ApiError, type AuthExpired } from "@/lib/api";

export type MutationResult = { success: true } | { error: string } | AuthExpired;

export async function changePasswordAction(currentPassword: string, newPassword: string): Promise<MutationResult> {
  try {
    const result = await apiFetchGuarded<{ success: boolean }>("/auth/me/password", {
      method: "PATCH",
      body: { currentPassword, newPassword },
    });
    if ("authExpired" in result) return result;
    return { success: true };
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    throw error;
  }
}
