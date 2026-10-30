"use server";

import { revalidatePath } from "next/cache";
import { apiFetch, apiFetchGuarded, apiFetchTextGuarded, ApiError, type AuthExpired } from "@/lib/api";
import type { PaginatedResult } from "../transactions/actions";

export type CtrStatus = "draft" | "mlro_review" | "filing_pending" | "filed" | "rejected";
export interface CtrReport { id: string; externalCustomerId: string; periodStart: string; periodEnd: string; currency: string; cashTransactionCount: number; cashTotalAmount: string; thresholdAmount: string; status: CtrStatus; regulatorReference: string | null; filedAt: string | null; filingNotes: string | null; mlroApprovedByUserId: string | null; mlroReviewedAt: string | null; createdAt: string; updatedAt: string; }
export type MutationResult<T> = T | { error: string } | AuthExpired;

export interface CtrQuery { page?: number; status?: CtrStatus; currency?: string; periodFrom?: string; periodTo?: string; }

export async function getCtrReports(query: CtrQuery = {}): Promise<PaginatedResult<CtrReport>> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) { if (value !== undefined && value !== "") params.set(key, String(value)); }
  return apiFetch(`/ctr/me?${params.toString()}`);
}
export async function getCtrReport(id: string): Promise<CtrReport> { return apiFetch(`/ctr/me/${id}`); }

/** Every row matching `query`, as CSV text — the backend's `/ctr/me/export` endpoint ignores
 * pagination and returns the full filtered set. */
export async function exportCtrAction(query: Omit<CtrQuery, "page">): Promise<string | { error: string } | AuthExpired> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) { if (value !== undefined && value !== "") params.set(key, String(value)); }
  try { return await apiFetchTextGuarded(`/ctr/me/export?${params.toString()}`); }
  catch (error) { if (error instanceof ApiError) return { error: error.message }; throw error; }
}

export async function generateCtrAction(input: { periodStart: string; periodEnd: string; currency: string; thresholdAmount: string }): Promise<MutationResult<CtrReport[]>> {
  try { const result = await apiFetchGuarded<CtrReport[]>("/ctr/me/generate", { method: "POST", body: input }); if (!("error" in result) && !("authExpired" in result)) revalidatePath("/ctr"); return result; }
  catch (error) { if (error instanceof ApiError) return { error: error.message }; throw error; }
}

export async function updateCtrAction(id: string, input: { status: CtrStatus; regulatorReference?: string; filingNotes?: string }): Promise<MutationResult<CtrReport>> {
  try { const result = await apiFetchGuarded<CtrReport>(`/ctr/me/${id}`, { method: "PATCH", body: input }); if (!("error" in result) && !("authExpired" in result)) revalidatePath("/ctr"); return result; }
  catch (error) { if (error instanceof ApiError) return { error: error.message }; throw error; }
}
