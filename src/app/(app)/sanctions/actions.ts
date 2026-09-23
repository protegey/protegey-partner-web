"use server";

import { revalidatePath } from "next/cache";
import { apiFetch, apiFetchGuarded, ApiError, type AuthExpired } from "@/lib/api";
import type { PaginatedResult } from "../transactions/actions";

export interface SanctionsEntity {
  id: string;
  name: string;
  type: string;
  source: string;
  sourceId: string | null;
  aliases: string[];
  dateOfBirth: string | null;
  nationality: string | null;
  listingDate: string | null;
  delistedAt: string | null;
  notes: string | null;
  createdAt: string;
}

export interface PaginatedSanctions {
  data: SanctionsEntity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SanctionsStats {
  total: number;
  active: number;
  delisted: number;
  byType: { type: string; count: number }[];
  bySource: { source: string; count: number }[];
}

export async function getSanctions(params: {
  page?: number;
  type?: string;
  source?: string;
  search?: string;
  includeDelisted?: boolean;
}): Promise<PaginatedSanctions> {
  const query = new URLSearchParams({ page: String(params.page ?? 1), limit: "20" });
  if (params.type) query.set("type", params.type);
  if (params.source) query.set("source", params.source);
  if (params.search) query.set("search", params.search);
  if (params.includeDelisted) query.set("includeDelisted", "true");
  return apiFetch<PaginatedSanctions>(`/sanctions?${query.toString()}`);
}

export async function getSanctionsStats(): Promise<SanctionsStats> {
  return apiFetch<SanctionsStats>("/sanctions/stats");
}

export interface SanctionsSearchMatch {
  id: string;
  name: string;
  type: string;
  source: string;
  sourceId: string | null;
  aliases: string[];
  dateOfBirth: string | null;
  nationality: string | null;
  listingDate: string | null;
  notes: string | null;
  score: number;
  matchedOn: string;
  isPep: boolean;
}

export interface SanctionsSearchResult {
  decision: "blocked" | "review" | "clear";
  score: number;
  pepMatch: boolean;
  matches: SanctionsSearchMatch[];
}

/**
 * Standalone name lookup — sanctions + PEP status in one call, independent of any existing
 * client/customer record. This is the "type a name, check if this person is at risk" tool;
 * previously the only screening path (`ComplianceInfoButton`) required an already-created KYB
 * client. Pass `externalCustomerId` to tie a qualifying hit to a real customer record — the
 * backend then persists it as a durable, reviewable `ScreeningMatch` (see below); omit it for a
 * purely transient lookup that leaves no trace.
 */
export async function searchSanctionsAction(
  name: string,
  type: "person" | "business",
  externalCustomerId?: string,
): Promise<SanctionsSearchResult | AuthExpired> {
  const params = new URLSearchParams({ name, type });
  if (externalCustomerId) params.set("externalCustomerId", externalCustomerId);
  return apiFetchGuarded<SanctionsSearchResult>(`/sanctions/search?${params.toString()}`);
}

// ── Durable screening matches (per customer, reviewable) ───────────────────
// Unlike the ad-hoc search above, these records persist per customer and survive the underlying
// sanctions list entry being edited or delisted later — the old platform's "OSINT Enrichment,
// verified by {analyst}" concept.

export type ScreeningMatchStatus = "possible_match" | "confirmed" | "false_positive" | "cleared";

export interface ScreeningMatch {
  id: string;
  partnerId: string;
  externalCustomerId: string;
  sanctionsEntityId: string;
  matchedName: string;
  matchScore: number;
  matchedOn: string;
  isPep: boolean;
  source: string;
  status: ScreeningMatchStatus;
  verifiedByUserId: string | null;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ScreeningMatchesQuery {
  externalCustomerId?: string;
  status?: ScreeningMatchStatus;
  page?: number;
  limit?: number;
}

export async function getScreeningMatches(query: ScreeningMatchesQuery = {}): Promise<PaginatedResult<ScreeningMatch>> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  return apiFetch<PaginatedResult<ScreeningMatch>>(`/screening-matches/me?${params.toString()}`);
}

export type MutationResult<T> = T | { error: string } | AuthExpired;

/** Confirm/dismiss/clear a persisted match — stamps `verifiedByUserId`/`verifiedAt` server-side. */
export async function reviewScreeningMatchAction(
  id: string,
  status: Exclude<ScreeningMatchStatus, "possible_match">,
  externalCustomerId?: string,
): Promise<MutationResult<ScreeningMatch>> {
  try {
    const result = await apiFetchGuarded<ScreeningMatch>(`/screening-matches/me/${id}`, { method: "PATCH", body: { status } });
    if (!("error" in result) && !("authExpired" in result) && externalCustomerId) {
      revalidatePath(`/pan-guard/risk-profiles/${encodeURIComponent(externalCustomerId)}`);
    }
    return result;
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    throw error;
  }
}
