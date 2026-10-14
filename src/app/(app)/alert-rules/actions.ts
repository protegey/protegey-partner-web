"use server";

import { revalidatePath } from "next/cache";
import { apiFetch, apiFetchGuarded, ApiError, type AuthExpired } from "@/lib/api";

export type RuleSegment = "KYC1" | "KYC2" | "AGENT" | "SUPER_AGENT" | "MERCHANT" | "CORPORATE" | "ALL";
export type AlertRuleStatus = "draft" | "active" | "disabled";
export type AlertRuleSource = "system" | "manual" | "ai_generated";
export type AlertRuleSeverity = "review" | "step_up" | "block" | "escalate";
export type AlertRuleDomain = "transaction" | "identity";

export interface AlertRule {
  id: string;
  partnerId: string | null;
  code: string;
  /** Human-readable "rule 25" — shared by a system rule and any partner's fork of it, never the uuid. */
  ruleNumber: number;
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
  severity: AlertRuleSeverity;
  /** Fixed at creation — never sent back in an update. 'transaction' rules evaluate per ingested
   * transaction; 'identity' rules evaluate once per KYC decision (e.g. a shared ID document
   * across accounts) and have no meaningful transaction simulator. */
  domain: AlertRuleDomain;
  source: AlertRuleSource;
  createdAt: string;
  updatedAt: string;
  /** A concrete, fillable example of the payload that would trigger THIS rule as it's currently
   * configured — recomputed server-side from `expression`/`parameters` on every fetch, so it
   * always reflects this rule's live thresholds, never a stale snapshot. Null when the rule's
   * expression shape doesn't map to a known example pattern. */
  examplePayload: Record<string, unknown> | null;
  /** Earlier transactions (oldest first) needed alongside `examplePayload` to actually cross a
   * velocity/count/sum rule's threshold — empty for every rule a single transaction already
   * demonstrates on its own. */
  exampleAdditionalPayloads: Record<string, unknown>[];
  exampleScenarioEn: string | null;
  exampleScenarioFr: string | null;
  examplePayloadNoteEn: string | null;
  examplePayloadNoteFr: string | null;
}

/** Initial page load — a 401 here bubbles to the (app) error boundary, same as every other page. */
export async function getAlertRules(): Promise<AlertRule[]> {
  return apiFetch<AlertRule[]>("/alert-rules/me");
}

export type MutationResult<T> = T | { error: string; suggestion?: string } | AuthExpired;

async function runGuarded<T>(path: string, options?: Parameters<typeof apiFetch>[1]): Promise<MutationResult<T>> {
  try {
    return await apiFetchGuarded<T>(path, options);
  } catch (error) {
    if (error instanceof ApiError) {
      const suggestion = error.details?.suggestion;
      return { error: error.message, suggestion: typeof suggestion === "string" ? suggestion : undefined };
    }
    throw error;
  }
}

export interface UpdateAlertRuleInput {
  status?: AlertRuleStatus;
  parameters?: Record<string, number>;
  name?: string;
  nameFr?: string;
  description?: string;
  descriptionFr?: string;
  severity?: AlertRuleSeverity;
}

export async function updateAlertRule(id: string, patch: UpdateAlertRuleInput): Promise<MutationResult<AlertRule>> {
  const result = await runGuarded<AlertRule>(`/alert-rules/me/${id}`, { method: "PATCH", body: patch });
  if (!("error" in result) && !("authExpired" in result)) revalidatePath("/alert-rules");
  return result;
}

/**
 * Deleting a fork of a system rule just reverts the partner back to the shared default (its code
 * re-appears via the system row); deleting a wholly custom rule removes it outright. The backend
 * refuses to delete an unforked system default.
 *
 * Returns `{ success: true }` on success, deliberately NOT the raw `null` body a 204 response
 * produces — `useSessionGuard`'s `guard()` wrapper already returns literal `null` to mean "auth
 * expired, user gave up re-authenticating", so a delete action must never also use `null` as its
 * own success value, or a real successful delete becomes indistinguishable from that at the
 * call site.
 */
export async function deleteAlertRule(id: string): Promise<MutationResult<{ success: true }>> {
  const result = await runGuarded<null>(`/alert-rules/me/${id}`, { method: "DELETE" });
  if (result && typeof result === "object" && ("error" in result || "authExpired" in result)) return result;
  revalidatePath("/alert-rules");
  return { success: true };
}

export async function generateAlertRule(description: string): Promise<MutationResult<AlertRule>> {
  const result = await runGuarded<AlertRule>("/alert-rules/me/generate", { method: "POST", body: { description } });
  if (!("error" in result) && !("authExpired" in result)) revalidatePath("/alert-rules");
  return result;
}

export type SimulateTransactionChannel = "branch" | "atm" | "pos" | "online" | "mobile_app" | "ussd" | "agent" | "api" | "call_center";

export interface SimulateTransactionInput {
  externalCustomerId: string;
  direction: "DEBIT" | "CREDIT";
  amount: number;
  counterpartyExternalId?: string;
  isCash?: boolean;
  occurredAt: string;
  channel?: SimulateTransactionChannel;
  transactionType?: string;
  /** SWIFT/BIC or a local bank/MNO code — bank-wire and cross-institution scenarios. */
  counterpartyInstitutionCode?: string;
  /** The counterparty's country — compare against the simulated customer's own `country` to test a cross-border rule. */
  counterpartyCountry?: string;
  /** The simulated customer's own registered country. */
  country?: string;
  isPep?: boolean;
  /** Seconds since the simulated customer's password/email/phone last changed — lets you test an
   * account-takeover rule. Omit to simulate "the partner never reported this signal". */
  secondsSincePasswordChange?: number;
  secondsSinceEmailChange?: number;
  secondsSincePhoneChange?: number;
  /** 0-100 — what percentage of the account balance this simulated DEBIT represents. Lets you
   * test a mule-account/account-drain rule. */
  balanceDepletionRatio?: number;
  /** Simulate "the customer has never sent to this counterparty before". */
  isNewCounterparty?: boolean;
  /** 0-100 — simulate a recent behavioral-biometrics deviation score. */
  behavioralDeviationScore?: number;
}

export interface SimulationOutcome {
  transaction: SimulateTransactionInput;
  matched: boolean;
}

export async function simulateAlertRule(id: string, transactions: SimulateTransactionInput[]): Promise<MutationResult<SimulationOutcome[]>> {
  return runGuarded<SimulationOutcome[]>(`/alert-rules/me/${id}/simulate`, { method: "POST", body: { transactions } });
}
