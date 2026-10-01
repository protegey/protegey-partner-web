"use server";

import { revalidatePath } from "next/cache";
import { apiFetch, apiFetchGuarded, ApiError, type AuthExpired } from "@/lib/api";
import type { PaginatedResult } from "../../transactions/actions";

export interface WebhookSummary {
  webhookUrl: string | null;
  hasWebhookSecret: boolean;
}

export async function getWebhookSummary(): Promise<WebhookSummary> {
  return apiFetch<WebhookSummary>("/partners/me/api-credentials");
}

export type WebhookDeliveryStatus = "pending" | "delivered" | "failed";

export interface WebhookDelivery {
  id: string;
  eventType: string;
  eventId: string;
  status: WebhookDeliveryStatus;
  attempts: number;
  lastError: string | null;
  deliveredAt: string | null;
  failedAt: string | null;
  createdAt: string;
}

export async function getWebhookDeliveries(page = 1): Promise<PaginatedResult<WebhookDelivery>> {
  return apiFetch<PaginatedResult<WebhookDelivery>>(`/partners/me/api-credentials/webhook-deliveries?page=${page}&limit=20`);
}

export async function sendTestWebhookAction(): Promise<{ success: true } | { error: string } | AuthExpired> {
  try {
    const result = await apiFetchGuarded<{ success: true }>("/partners/me/api-credentials/webhook/test", { method: "POST" });
    if (!("error" in result) && !("authExpired" in result)) revalidatePath("/settings/webhooks");
    return result;
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    throw error;
  }
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
