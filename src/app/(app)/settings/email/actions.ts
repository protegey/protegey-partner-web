"use server";

import { revalidatePath } from "next/cache";
import { apiFetch, ApiError, type AuthExpired } from "@/lib/api";
import { getLang } from "@/lib/i18n/lang";
import { t } from "@/lib/i18n/strings";

export interface MailConfig {
  hasResendApiKey: boolean;
  fromAddress: string | null;
  fromName: string | null;
  configured: boolean;
}

export interface ActionResult {
  error?: string;
  success?: boolean;
}

/** Fails toward "nothing configured" — this page's own on-premise/permission guards already run
 * before this is ever called, so an error here is a transient backend hiccup, not a real "SaaS
 * partner trying to see this" case. */
export async function getMailConfig(): Promise<MailConfig> {
  try {
    return await apiFetch<MailConfig>("/on-premise/mail-config");
  } catch {
    return { hasResendApiKey: false, fromAddress: null, fromName: null, configured: false };
  }
}

export async function updateMailConfigAction(data: {
  resendApiKey?: string;
  fromAddress?: string;
  fromName?: string;
}): Promise<ActionResult | AuthExpired> {
  const lang = await getLang();
  try {
    await apiFetch("/on-premise/mail-config", { method: "PATCH", body: data });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return { authExpired: true };
    return { error: error instanceof ApiError ? error.message : t(lang, "commonGenericError") };
  }
  revalidatePath("/settings/email");
  return { success: true };
}
