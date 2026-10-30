"use server";

import { apiFetch, apiFetchTextGuarded, ApiError, type AuthExpired } from "@/lib/api";
import type { PaginatedResult } from "../../transactions/actions";

export type BehavioralConfidenceTier = "low" | "medium" | "high";
export type BehavioralCategory = "keystroke" | "touch" | "navigation" | "login_time" | "session_velocity";

export interface BehavioralSignal {
  id: string;
  partnerId: string;
  externalCustomerId: string;
  sessionId: string;
  deviationScore: number;
  confidenceTier: BehavioralConfidenceTier;
  categories: BehavioralCategory[];
  createdAt: string;
}

export interface BehavioralSignalsQuery {
  page?: number;
  externalCustomerId?: string;
  confidenceTier?: BehavioralConfidenceTier;
}

export async function getBehavioralSignals(query: BehavioralSignalsQuery = {}): Promise<PaginatedResult<BehavioralSignal>> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  return apiFetch<PaginatedResult<BehavioralSignal>>(`/behavioral-signals/me?${params.toString()}`);
}

/** Every row matching the active filters, as CSV text — the backend's
 * `/behavioral-signals/me/export` endpoint ignores pagination and returns the full filtered set. */
export async function exportBehavioralSignalsAction(query: Omit<BehavioralSignalsQuery, "page"> = {}): Promise<string | { error: string } | AuthExpired> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  try {
    return await apiFetchTextGuarded(`/behavioral-signals/me/export?${params.toString()}`);
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    throw error;
  }
}
