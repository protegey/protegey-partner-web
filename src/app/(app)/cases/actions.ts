"use server";

import { revalidatePath } from "next/cache";
import { apiFetch, apiFetchGuarded, ApiError, type AuthExpired } from "@/lib/api";
import type { PaginatedResult } from "../transactions/actions";

export type CaseStatus = "open" | "investigating" | "closed";
export type CaseOutcome = "no_action" | "false_positive" | "sar_filed";

export interface Case {
  id: string;
  partnerId: string;
  externalCustomerId: string;
  title: string;
  status: CaseStatus;
  assignedToUserId: string | null;
  linkedAlertIds: string[];
  outcome: CaseOutcome | null;
  closedByUserId: string | null;
  closedAt: string | null;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CaseNote {
  id: string;
  caseId: string;
  authorUserId: string;
  body: string;
  createdAt: string;
}

export interface CaseWithNotes extends Case {
  notes: CaseNote[];
}

export interface CasesQuery {
  page?: number;
  status?: CaseStatus;
  externalCustomerId?: string;
}

export async function getCases(query: CasesQuery = {}): Promise<PaginatedResult<Case>> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  return apiFetch<PaginatedResult<Case>>(`/cases/me?${params.toString()}`);
}

export async function getCase(id: string): Promise<CaseWithNotes> {
  return apiFetch<CaseWithNotes>(`/cases/me/${id}`);
}

export type MutationResult<T> = T | { error: string } | AuthExpired;

export async function createCaseAction(externalCustomerId: string, title: string, alertIds: string[]): Promise<MutationResult<Case>> {
  try {
    const result = await apiFetchGuarded<Case>(`/cases/me`, { method: "POST", body: { externalCustomerId, title, alertIds } });
    if (!("error" in result) && !("authExpired" in result)) revalidatePath("/cases");
    return result;
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    throw error;
  }
}

export async function addCaseNoteAction(id: string, body: string): Promise<MutationResult<CaseNote>> {
  try {
    const result = await apiFetchGuarded<CaseNote>(`/cases/me/${id}/notes`, { method: "POST", body: { body } });
    if (!("error" in result) && !("authExpired" in result)) revalidatePath(`/cases/${id}`);
    return result;
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    throw error;
  }
}

export type SharedSignalCategory = "confirmed_fraud" | "identity_theft" | "money_laundering" | "other";

export interface SharedSignalReceipt {
  id: string;
  category: SharedSignalCategory;
  reportedAt: string;
}

export async function getCaseSignalStatus(id: string): Promise<{ shared: boolean }> {
  return apiFetch<{ shared: boolean }>(`/cases/me/${id}/share-signal`);
}

export async function shareCaseSignalAction(
  id: string,
  identifiers: { phoneNumber?: string; email?: string; deviceFingerprint?: string },
  category: SharedSignalCategory,
): Promise<MutationResult<SharedSignalReceipt[]>> {
  try {
    const result = await apiFetchGuarded<SharedSignalReceipt[]>(`/cases/me/${id}/share-signal`, {
      method: "POST",
      body: { ...identifiers, category },
    });
    if (!("error" in result) && !("authExpired" in result)) revalidatePath(`/cases/${id}`);
    return result;
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    throw error;
  }
}

export async function updateCaseAction(
  id: string,
  patch: { status?: CaseStatus; assignedToUserId?: string; outcome?: CaseOutcome },
): Promise<MutationResult<Case>> {
  try {
    const result = await apiFetchGuarded<Case>(`/cases/me/${id}`, { method: "PATCH", body: patch });
    if (!("error" in result) && !("authExpired" in result)) {
      revalidatePath(`/cases/${id}`);
      revalidatePath("/cases");
    }
    return result;
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    throw error;
  }
}
