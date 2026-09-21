"use server";

import { revalidatePath } from "next/cache";
import { apiFetch, apiFetchGuarded, ApiError, type AuthExpired } from "@/lib/api";

export type PepStatus = "possible_match" | "confirmed" | "false_positive" | "cleared" | "expired";
export type PepCategory = "domestic" | "foreign" | "international_organisation" | "family_member" | "close_associate";

export interface PepDesignation {
  id: string;
  partnerId: string;
  externalCustomerId: string;
  status: PepStatus;
  category: PepCategory;
  role: string | null;
  jurisdiction: string | null;
  source: string;
  sourceReference: string | null;
  notes: string | null;
  reviewedByUserId: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedPepDesignations {
  data: PepDesignation[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreatePepDesignation {
  externalCustomerId: string;
  status: PepStatus;
  category: PepCategory;
  role?: string;
  jurisdiction?: string;
  source: string;
  notes?: string;
}

export async function getPepDesignations(query: { page?: number; status?: PepStatus } = {}) {
  const params = new URLSearchParams({ page: String(query.page ?? 1), limit: "20" });
  if (query.status) params.set("status", query.status);
  return apiFetch<PaginatedPepDesignations>(`/pep/me?${params.toString()}`);
}

export type PepMutationResult<T> = T | { error: string } | AuthExpired;

export async function createPepDesignationAction(body: CreatePepDesignation): Promise<PepMutationResult<PepDesignation>> {
  try {
    const result = await apiFetchGuarded<PepDesignation>("/pep/me", { method: "POST", body });
    if (!("error" in result) && !("authExpired" in result)) revalidatePath("/pep");
    return result;
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    throw error;
  }
}

export async function reviewPepDesignationAction(
  id: string,
  body: { status: PepStatus; notes?: string },
): Promise<PepMutationResult<PepDesignation>> {
  try {
    const result = await apiFetchGuarded<PepDesignation>(`/pep/me/${id}`, { method: "PATCH", body });
    if (!("error" in result) && !("authExpired" in result)) revalidatePath("/pep");
    return result;
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    throw error;
  }
}
