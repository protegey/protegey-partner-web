"use server";

import { revalidatePath } from "next/cache";
import { apiFetch, apiFetchGuarded, ApiError, type AuthExpired } from "@/lib/api";

export type RuleSegment = "KYC1" | "KYC2" | "AGENT" | "SUPER_AGENT" | "MERCHANT" | "CORPORATE" | "ALL";
export type AlertRuleStatus = "draft" | "active" | "disabled";
export type AlertRuleSource = "system" | "manual" | "ai_generated";

export interface AlertRule {
  id: string;
  partnerId: string | null;
  code: string;
  name: string;
  nameFr: string | null;
  description: string;
  descriptionFr: string | null;
  explanation: string | null;
  explanationFr: string | null;
  segment: RuleSegment;
  expression: unknown;
  parameters: Record<string, number>;
  status: AlertRuleStatus;
  severity: "review" | "block";
  source: AlertRuleSource;
  createdAt: string;
  updatedAt: string;
}

/** Initial page load — a 401 here bubbles to the (app) error boundary, same as every other page. */
export async function getAlertRules(): Promise<AlertRule[]> {
  return apiFetch<AlertRule[]>("/alert-rules/me");
}

export type MutationResult<T> = T | { error: string } | AuthExpired;

async function runGuarded<T>(path: string, options?: Parameters<typeof apiFetch>[1]): Promise<MutationResult<T>> {
  try {
    return await apiFetchGuarded<T>(path, options);
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    throw error;
  }
}

export interface UpdateAlertRuleInput {
  status?: AlertRuleStatus;
  parameters?: Record<string, number>;
  name?: string;
}

export async function updateAlertRule(id: string, patch: UpdateAlertRuleInput): Promise<MutationResult<AlertRule>> {
  const result = await runGuarded<AlertRule>(`/alert-rules/me/${id}`, { method: "PATCH", body: patch });
  if (!("error" in result) && !("authExpired" in result)) revalidatePath("/alert-rules");
  return result;
}

export async function generateAlertRule(description: string): Promise<MutationResult<AlertRule>> {
  const result = await runGuarded<AlertRule>("/alert-rules/me/generate", { method: "POST", body: { description } });
  if (!("error" in result) && !("authExpired" in result)) revalidatePath("/alert-rules");
  return result;
}

export interface SimulateTransactionInput {
  externalCustomerId: string;
  direction: "DEBIT" | "CREDIT";
  amount: number;
  counterpartyExternalId?: string;
  isCash?: boolean;
  occurredAt: string;
}

export interface SimulationOutcome {
  transaction: SimulateTransactionInput;
  matched: boolean;
}

export async function simulateAlertRule(id: string, transactions: SimulateTransactionInput[]): Promise<MutationResult<SimulationOutcome[]>> {
  return runGuarded<SimulationOutcome[]>(`/alert-rules/me/${id}/simulate`, { method: "POST", body: { transactions } });
}
