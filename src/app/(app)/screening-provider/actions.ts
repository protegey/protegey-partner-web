"use server";

import { revalidatePath } from "next/cache";
import { apiFetch, ApiError, type AuthExpired } from "@/lib/api";
import { getLang } from "@/lib/i18n/lang";
import { t } from "@/lib/i18n/strings";

export type ScreeningProviderName = "default" | "dow_jones";
export type ScreeningCredentialStatus = "unverified" | "active" | "invalid" | "quota_exceeded";

export interface ScreeningProviderStatus {
  provider: ScreeningProviderName;
  credential: {
    status: ScreeningCredentialStatus;
    maskedApiKey: string;
    hasApiSecret: boolean;
    lastCheckedAt: string | null;
    lastErrorMessage: string | null;
  } | null;
}

export async function getScreeningProviderStatus(): Promise<ScreeningProviderStatus> {
  return apiFetch<ScreeningProviderStatus>("/partners/me/screening-provider");
}

export interface ActionResult {
  error?: string;
  success?: boolean;
}

async function runGuarded(run: () => Promise<void>): Promise<ActionResult | AuthExpired> {
  const lang = await getLang();
  try {
    await run();
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return { authExpired: true };
    return { error: error instanceof ApiError ? error.message : t(lang, "commonGenericError") };
  }
  revalidatePath("/screening-provider");
  return { success: true };
}

export async function saveDowJonesCredentialAction(apiKey: string, apiSecret: string): Promise<ActionResult | AuthExpired> {
  return runGuarded(() => apiFetch("/partners/me/screening-provider/dow-jones", { method: "PUT", body: { apiKey, apiSecret: apiSecret || undefined } }) as Promise<void>);
}

export async function deleteDowJonesCredentialAction(): Promise<ActionResult | AuthExpired> {
  return runGuarded(() => apiFetch("/partners/me/screening-provider/dow-jones", { method: "DELETE" }) as Promise<void>);
}

export async function setScreeningProviderAction(provider: ScreeningProviderName): Promise<ActionResult | AuthExpired> {
  return runGuarded(() => apiFetch("/partners/me/screening-provider", { method: "PATCH", body: { provider } }) as Promise<void>);
}
