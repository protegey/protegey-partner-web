"use server";

import { apiFetch } from "@/lib/api";
import type { PaginatedResult } from "../../transactions/actions";

export interface RiskProfileContribution {
  source: string;
  points: number;
  reason: string;
  at: string;
}

/** Canonical 4-dimension fusion taxonomy — matches protegey-core-v2's WeightedRiskFusionEngine
 * (Behavioral 35%, Network 40%, Contextual 15%, Historical 10%). */
export type RiskProfileCategory = "behavioral" | "network" | "contextual" | "historical";

export interface RiskProfileBreakdownEntry {
  category: RiskProfileCategory;
  /** Ready-to-display label from the backend — always French (e.g. "Comportemental"). Prefer the local i18n map for bilingual UI. */
  label: string;
  points: number;
  count: number;
  weight: number;
}

/** One contribution re-expressed as a motivated before/after change — "62 → 78 (↑)" instead of
 * just "+16", reconstructed server-side from the append-only contributions log. Newest first. */
export interface RiskProfileHistoryEntry {
  at: string;
  source: string;
  category: RiskProfileCategory;
  reason: string;
  points: number;
  scoreBefore: number;
  scoreAfter: number;
  direction: "increased" | "decreased" | "unchanged";
}

export interface EntityRiskProfile {
  id: string;
  partnerId: string;
  externalCustomerId: string;
  cumulativeScore: number;
  /** Cumulative score with old contributions aged out (30-day half-life) — "how risky are they right now". */
  decayedScore: number;
  /** Composite score with each dimension weighted by fusion importance — the headline number. */
  weightedScore: number;
  /** weightedScore turned into an actionable label — "high" starts just above what any single
   * alert could produce alone, so it always reflects a real pattern, not one event. */
  riskLevel: "low" | "medium" | "high" | "critical";
  /** The single dimension driving the score most right now, or null if there are no contributions. */
  topCategory: RiskProfileCategory | null;
  breakdown: RiskProfileBreakdownEntry[];
  contributions: RiskProfileContribution[];
  /** Newest first — the score immediately before/after each contribution. */
  history: RiskProfileHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface RiskProfilesQuery {
  page?: number;
  externalCustomerId?: string;
}

export async function getRiskProfiles(query: RiskProfilesQuery = {}): Promise<PaginatedResult<EntityRiskProfile>> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  return apiFetch<PaginatedResult<EntityRiskProfile>>(`/risk-profile/me?${params.toString()}`);
}

/** Per-customer drill-down — same richer shape as the list, fetched for a single entity. */
export async function getRiskProfileDetail(externalCustomerId: string): Promise<EntityRiskProfile> {
  return apiFetch<EntityRiskProfile>(`/risk-profile/me/${encodeURIComponent(externalCustomerId)}`);
}
