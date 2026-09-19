"use server";

import { apiFetch } from "@/lib/api";
import type { PaginatedResult } from "../../transactions/actions";

export interface RiskProfileContribution {
  source: string;
  points: number;
  reason: string;
  at: string;
}

export interface EntityRiskProfile {
  id: string;
  partnerId: string;
  externalCustomerId: string;
  cumulativeScore: number;
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
