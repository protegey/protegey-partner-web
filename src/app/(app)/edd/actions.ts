"use server";

import { revalidatePath } from "next/cache";
import { apiFetch, apiFetchGuarded, ApiError, type AuthExpired } from "@/lib/api";
import type { PaginatedResult } from "../transactions/actions";

export type EddStatus = "pending" | "in_review" | "approved" | "rejected";
export type EddTrigger = "pep_confirmed" | "sanctions_match" | "high_risk_score" | "repeated_alerts";

export interface EddChecklist {
  identityVerified: boolean;
  sourceOfFundsReviewed: boolean;
  sourceOfWealthReviewed: boolean;
  businessPurposeVerified: boolean;
  seniorApproval: boolean;
}

export interface EddReview {
  id: string;
  externalCustomerId: string;
  trigger: EddTrigger;
  status: EddStatus;
  assignedToUserId: string | null;
  dueAt: string | null;
  notes: string | null;
  checklist: EddChecklist;
  reviewedByUserId: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function getEddReviews(query: { page?: number; status?: EddStatus } = {}) {
  const params = new URLSearchParams({ page: String(query.page ?? 1), limit: "20" });
  if (query.status) params.set("status", query.status);
  return apiFetch<PaginatedResult<EddReview>>(`/edd/me?${params.toString()}`);
}

export type EddMutationResult = EddReview | { error: string } | AuthExpired;

export async function updateEddReview(
  id: string,
  payload: { status?: EddStatus; assignedToUserId?: string | null; dueAt?: string | null; notes?: string | null; checklist?: EddChecklist },
): Promise<EddMutationResult> {
  try {
    const result = await apiFetchGuarded<EddReview>(`/edd/me/${id}`, { method: "PATCH", body: payload });
    if (!("error" in result) && !("authExpired" in result)) revalidatePath("/edd");
    return result;
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    throw error;
  }
}
