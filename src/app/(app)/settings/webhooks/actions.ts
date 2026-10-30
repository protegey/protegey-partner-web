"use server";

import { revalidatePath } from "next/cache";
import { apiFetch, apiFetchGuarded, apiFetchTextGuarded, ApiError, type AuthExpired } from "@/lib/api";
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

export interface WebhookDeliveriesQuery {
  page?: number;
  status?: WebhookDeliveryStatus;
}

export async function getWebhookDeliveries(query: WebhookDeliveriesQuery = {}): Promise<PaginatedResult<WebhookDelivery>> {
  const params = new URLSearchParams({ page: String(query.page ?? 1), limit: "20" });
  if (query.status) params.set("status", query.status);
  return apiFetch<PaginatedResult<WebhookDelivery>>(`/partners/me/api-credentials/webhook-deliveries?${params.toString()}`);
}

/** Every row matching the active status filter, as CSV text — the backend's
 * `/partners/me/api-credentials/webhook-deliveries/export` endpoint ignores pagination and
 * returns the full filtered set. */
export async function exportWebhookDeliveriesAction(query: Omit<WebhookDeliveriesQuery, "page"> = {}): Promise<string | { error: string } | AuthExpired> {
  const params = new URLSearchParams();
  if (query.status) params.set("status", query.status);
  try {
    return await apiFetchTextGuarded(`/partners/me/api-credentials/webhook-deliveries/export?${params.toString()}`);
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    throw error;
  }
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
