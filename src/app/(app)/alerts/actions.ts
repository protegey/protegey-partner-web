"use server";

import { revalidatePath } from "next/cache";
import { apiFetch, apiFetchGuarded, ApiError, type AuthExpired } from "@/lib/api";
import type { PaginatedResult } from "../transactions/actions";

export type AlertStatus = "open" | "confirmed" | "more_info_requested" | "dismissed";

export interface AlertWithContext {
  id: string;
  partnerId: string;
  ruleId: string;
  ruleCode: string;
  externalCustomerId: string;
  transactionId: string | null;
  triggeredAt: string;
  matchedValues: Record<string, unknown> | null;
  status: AlertStatus;
  createdAt: string;
  ruleName: string;
  ruleNameFr: string | null;
  ruleExplanation: string | null;
  ruleExplanationFr: string | null;
  ruleSeverity: "review" | "block";
  transaction: {
    amount: string;
    currency: string;
    direction: "DEBIT" | "CREDIT";
    transactionType: string;
    occurredAt: string;
  } | null;
}

export interface AlertsQuery {
  page?: number;
  limit?: number;
  status?: AlertStatus;
  ruleCode?: string;
  externalCustomerId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export async function getAlerts(query: AlertsQuery = {}): Promise<PaginatedResult<AlertWithContext>> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  return apiFetch<PaginatedResult<AlertWithContext>>(`/alerts/me?${params.toString()}`);
}

export type MutationResult<T> = T | { error: string } | AuthExpired;

export async function updateAlertStatus(id: string, status: AlertStatus): Promise<MutationResult<AlertWithContext>> {
  try {
    const result = await apiFetchGuarded<AlertWithContext>(`/alerts/me/${id}`, { method: "PATCH", body: { status } });
    if (!("error" in result) && !("authExpired" in result)) revalidatePath("/alerts");
    return result;
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    throw error;
  }
}
