"use server";

import { revalidatePath } from "next/cache";
import { apiFetch, ApiError, type AuthExpired } from "@/lib/api";
import { getLang } from "@/lib/i18n/lang";
import { t } from "@/lib/i18n/strings";

export interface AiConfig {
  hasDeepseekApiKey: boolean;
}

export interface ActionResult {
  error?: string;
  success?: boolean;
}

/** Fails toward "nothing configured" — this page's own on-premise/permission guards already run
 * before this is ever called, so an error here is a transient backend hiccup, not a real "SaaS
 * partner trying to see this" case. */
export async function getAiConfig(): Promise<AiConfig> {
  try {
    return await apiFetch<AiConfig>("/on-premise/ai-config");
  } catch {
    return { hasDeepseekApiKey: false };
  }
}

export async function updateAiConfigAction(deepseekApiKey: string): Promise<ActionResult | AuthExpired> {
  const lang = await getLang();
  try {
    await apiFetch("/on-premise/ai-config", { method: "PATCH", body: { deepseekApiKey } });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return { authExpired: true };
    return { error: error instanceof ApiError ? error.message : t(lang, "commonGenericError") };
  }
  revalidatePath("/settings/ai");
  return { success: true };
}
