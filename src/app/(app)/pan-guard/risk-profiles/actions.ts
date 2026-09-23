"use server";

import { apiFetch } from "@/lib/api";
import type { PaginatedResult } from "../../transactions/actions";

export interface RiskProfileContribution {
  source: string;
  points: number;
  reason: string;
  at: string;
}

export type RiskProfileCategory = "behavioral" | "device" | "network" | "identity" | "compliance" | "other";

export interface RiskProfileBreakdownEntry {
  category: RiskProfileCategory;
  /** Ready-to-display label from the backend — always French (e.g. "Comportemental"). Prefer the local i18n map for bilingual UI. */
  label: string;
  points: number;
  count: number;
  weight: number;
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
  /** The single dimension driving the score most right now, or null if there are no contributions. */
  topCategory: RiskProfileCategory | null;
  breakdown: RiskProfileBreakdownEntry[];
  contributions: RiskProfileContribution[];
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
