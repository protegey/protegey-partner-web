"use server";

import { revalidatePath } from "next/cache";
import { apiFetch, apiFetchGuarded, ApiError, type AuthExpired } from "@/lib/api";
import type { PaginatedResult } from "../transactions/actions";
import type { Case } from "../cases/actions";

export type AlertStatus = "open" | "confirmed" | "more_info_requested" | "dismissed";
export type AlertDisposition = "confirmed_fraud" | "false_positive" | "no_action" | "sar_filed" | "escalated";
/** Stamped from the rule that fired it — the old platform's "Decision Outcome" block, attached
 * directly to the alert instead of requiring a separate lookup. Null for alerts predating this field. */
export type AlertDecisionVerdict = "BLOCK" | "STEP_UP" | "ESCALATE" | "ALERT";

export interface AlertWithContext {
  id: string;
  partnerId: string;
  ruleId: string;
  ruleCode: string;
  /** Human-readable "alert 1032" — never the uuid. */
  alertNumber: number;
  externalCustomerId: string;
  transactionId: string | null;
  triggeredAt: string;
  matchedValues: Record<string, unknown> | null;
  status: AlertStatus;
  decisionVerdict: AlertDecisionVerdict | null;
  assignedToUserId: string | null;
  disposition: AlertDisposition | null;
  investigationNotes: string | null;
  dueAt: string | null;
  resolvedAt: string | null;
  resolvedByUserId: string | null;
  createdAt: string;
  ruleName: string;
  ruleNameFr: string | null;
  ruleExplanation: string | null;
  ruleExplanationFr: string | null;
  ruleSeverity: "review" | "block";
  ruleNumber: number | null;
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
  alertNumber?: number;
  ruleCode?: string;
  externalCustomerId?: string;
  transactionId?: string;
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

export async function getAlert(id: string): Promise<AlertWithContext> {
  return apiFetch<AlertWithContext>(`/alerts/me/${id}`);
}

export interface AlertRuleHistory {
  count: number;
  alerts: AlertWithContext[];
}

/** Same customer, same rule, any other time it fired — scoped by partnerId like every other
 * lookup here, since externalCustomerId is only unique within one partner, never globally. */
export async function getCustomerRuleHistory(externalCustomerId: string, ruleCode: string, excludeAlertId?: string): Promise<AlertRuleHistory> {
  const params = new URLSearchParams({ externalCustomerId, ruleCode });
  if (excludeAlertId) params.set("excludeAlertId", excludeAlertId);
  return apiFetch<AlertRuleHistory>(`/alerts/me/history?${params.toString()}`);
}

/** Every alert (if any) already tied to this transaction — a transaction can have more than one
 * (several rules can each fire their own alert), most recent first. */
export async function getAlertsForTransaction(transactionId: string): Promise<AlertWithContext[]> {
  const result = await getAlerts({ transactionId, limit: 20 });
  return result.data;
}

/** Manually flags a transaction that no automated rule matched — creates (or reuses, if one is
 * already open) an Alert on it, so the same assign/confirm/dismiss workflow applies to it too. */
export async function flagTransactionAction(transactionId: string): Promise<MutationResult<AlertWithContext>> {
  try {
    const result = await apiFetchGuarded<AlertWithContext>(`/alerts/me/flag-transaction`, { method: "POST", body: { transactionId } });
    if (!("error" in result) && !("authExpired" in result)) {
      revalidatePath("/alerts");
      revalidatePath(`/transactions/${transactionId}`);
    }
    return result;
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    throw error;
  }
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
