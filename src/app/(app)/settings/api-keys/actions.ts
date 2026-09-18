"use server";

import { revalidatePath } from "next/cache";
import { apiFetch, apiFetchGuarded, ApiError, type AuthExpired } from "@/lib/api";

export interface ApiKeySummary {
  apiKeyPrefix: string | null;
  apiKeyCreatedAt: string | null;
}

export async function getApiKeySummary(): Promise<ApiKeySummary> {
  return apiFetch<ApiKeySummary>("/partners/me/api-credentials");
}

export type GenerateApiKeyResult = { success: true; apiKey: string } | { error: string } | AuthExpired;

export async function generateApiKeyAction(): Promise<GenerateApiKeyResult> {
  try {
    const result = await apiFetchGuarded<{ apiKey: string }>("/partners/me/api-credentials", { method: "POST" });
    if ("authExpired" in result) return result;
    revalidatePath("/settings/api-keys");
    return { success: true, apiKey: result.apiKey };
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    throw error;
  }
}
