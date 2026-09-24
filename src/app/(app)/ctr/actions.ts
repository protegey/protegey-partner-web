"use server";

import { revalidatePath } from "next/cache";
import { apiFetch, apiFetchGuarded, ApiError, type AuthExpired } from "@/lib/api";
import type { PaginatedResult } from "../transactions/actions";

export type CtrStatus = "draft" | "mlro_review" | "filing_pending" | "filed" | "rejected";
export interface CtrReport { id: string; externalCustomerId: string; periodStart: string; periodEnd: string; currency: string; cashTransactionCount: number; cashTotalAmount: string; thresholdAmount: string; status: CtrStatus; regulatorReference: string | null; filedAt: string | null; filingNotes: string | null; mlroApprovedByUserId: string | null; mlroReviewedAt: string | null; createdAt: string; updatedAt: string; }
export type MutationResult<T> = T | { error: string } | AuthExpired;

export async function getCtrReports(page = 1): Promise<PaginatedResult<CtrReport>> { return apiFetch(`/ctr/me?page=${page}`); }
export async function getCtrReport(id: string): Promise<CtrReport> { return apiFetch(`/ctr/me/${id}`); }

export async function generateCtrAction(input: { periodStart: string; periodEnd: string; currency: string; thresholdAmount: string }): Promise<MutationResult<CtrReport[]>> {
  try { const result = await apiFetchGuarded<CtrReport[]>("/ctr/me/generate", { method: "POST", body: input }); if (!("error" in result) && !("authExpired" in result)) revalidatePath("/ctr"); return result; }
  catch (error) { if (error instanceof ApiError) return { error: error.message }; throw error; }
}

export async function updateCtrAction(id: string, input: { status: CtrStatus; regulatorReference?: string; filingNotes?: string }): Promise<MutationResult<CtrReport>> {
  try { const result = await apiFetchGuarded<CtrReport>(`/ctr/me/${id}`, { method: "PATCH", body: input }); if (!("error" in result) && !("authExpired" in result)) revalidatePath("/ctr"); return result; }
  catch (error) { if (error instanceof ApiError) return { error: error.message }; throw error; }
}
