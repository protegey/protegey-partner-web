"use server";

import { revalidatePath } from "next/cache";
import { apiFetch, apiFetchGuarded, ApiError, type AuthExpired } from "@/lib/api";
import type { PaginatedResult } from "../transactions/actions";
import type { Case } from "../cases/actions";

export type AlertStatus = "open" | "confirmed" | "more_info_requested" | "dismissed";
export type AlertDisposition = "confirmed_fraud" | "false_positive" | "no_action" | "sar_filed" | "escalated";

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
  assignedToUserId: string | null;
  disposition: AlertDisposition | null;
  investigationNotes: string | null;
  dueAt: string | null;
  resolvedAt: string | null;
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
  return updateAlert(id, { status });
}

export interface AlertUpdatePayload {
  status?: AlertStatus;
  assignedToUserId?: string | null;
  disposition?: AlertDisposition | null;
  investigationNotes?: string | null;
  dueAt?: string | null;
}

export async function updateAlert(id: string, payload: AlertUpdatePayload): Promise<MutationResult<AlertWithContext>> {
  try {
    const result = await apiFetchGuarded<AlertWithContext>(`/alerts/me/${id}`, { method: "PATCH", body: payload });
    if (!("error" in result) && !("authExpired" in result)) revalidatePath("/alerts");
    return result;
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    throw error;
  }
}

export interface ConvertAlertToCaseResult {
  alert: AlertWithContext;
  case: Case;
}

/** One-click path: escalates the alert and creates a pre-filled case from it, atomically. */
export async function convertAlertToCaseAction(id: string): Promise<MutationResult<ConvertAlertToCaseResult>> {
  try {
    const result = await apiFetchGuarded<ConvertAlertToCaseResult>(`/alerts/me/${id}/convert-to-case`, { method: "POST" });
    if (!("error" in result) && !("authExpired" in result)) {
      revalidatePath("/alerts");
      revalidatePath("/cases");
    }
    return result;
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    throw error;
  }
}
