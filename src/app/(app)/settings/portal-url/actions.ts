"use server";

import { revalidatePath } from "next/cache";
import { apiFetch, ApiError, type AuthExpired } from "@/lib/api";
import { getLang } from "@/lib/i18n/lang";
import { t } from "@/lib/i18n/strings";

export interface PortalUrlConfig {
  partnerPortalUrl: string;
}

export interface ActionResult {
  error?: string;
  success?: boolean;
}

export async function getPortalUrlConfig(): Promise<PortalUrlConfig> {
  try {
    return await apiFetch<PortalUrlConfig>("/on-premise/portal-url");
  } catch {
    return { partnerPortalUrl: "" };
  }
}

export async function updatePortalUrlAction(partnerPortalUrl: string): Promise<ActionResult | AuthExpired> {
  const lang = await getLang();
  try {
    await apiFetch("/on-premise/portal-url", { method: "PATCH", body: { partnerPortalUrl } });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return { authExpired: true };
    return { error: error instanceof ApiError ? error.message : t(lang, "commonGenericError") };
  }
  revalidatePath("/settings/portal-url");
  return { success: true };
}
