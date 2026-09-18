"use server";

import { revalidatePath } from "next/cache";
import { apiFetch, apiFetchGuarded, ApiError, type AuthExpired } from "@/lib/api";

export interface WebhookSummary {
  webhookUrl: string | null;
  hasWebhookSecret: boolean;
}

export async function getWebhookSummary(): Promise<WebhookSummary> {
  return apiFetch<WebhookSummary>("/partners/me/api-credentials");
}

export type ConfigureWebhookResult = { success: true; webhookSecret: string } | { error: string } | AuthExpired;

export async function configureWebhookAction(url: string): Promise<ConfigureWebhookResult> {
  try {
    const result = await apiFetchGuarded<{ webhookSecret: string }>("/partners/me/api-credentials/webhook", {
      method: "PATCH",
      body: { url },
    });
    if ("authExpired" in result) return result;
    revalidatePath("/settings/webhooks");
    return { success: true, webhookSecret: result.webhookSecret };
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    throw error;
  }
}
