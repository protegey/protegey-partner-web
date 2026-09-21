"use server";

import { revalidatePath } from "next/cache";
import { apiFetch, apiFetchGuarded, ApiError, type AuthExpired } from "@/lib/api";
import type { PaginatedResult } from "../transactions/actions";

export type SarReportStatus = "draft" | "submitted" | "mlro_review" | "filing_pending" | "filed" | "rejected";
export type SarReportType = "sar" | "str";

export interface SarReport {
  id: string;
  partnerId: string;
  caseId: string;
  templateId: string;
  status: "draft" | "submitted";
  reportType: SarReportType;
  filingStatus: Exclude<SarReportStatus, "submitted">;
  data: Record<string, unknown>;
  narrative: string;
  preparedByUserId: string;
  submittedByUserId: string | null;
  submittedAt: string | null;
  regulatorReference: string | null;
  filedAt: string | null;
  filingNotes: string | null;
  mlroApprovedByUserId: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SarReportsQuery {
  page?: number;
  status?: SarReportStatus;
}

export async function getSarReports(query: SarReportsQuery = {}): Promise<PaginatedResult<SarReport>> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  return apiFetch<PaginatedResult<SarReport>>(`/sar-reports/me?${params.toString()}`);
}

export async function getSarReport(id: string): Promise<SarReport> {
  return apiFetch<SarReport>(`/sar-reports/me/${id}`);
}

export type SarFieldType = "text" | "date" | "number" | "textarea" | "checkbox";
export type SarFieldSource = { type: "manual" } | { type: "path"; path: string };

export interface SarFieldDef {
  id: string;
  label: string;
  labelFr: string;
  fieldType: SarFieldType;
  source: SarFieldSource;
}

export interface SarSectionDef {
  id: string;
  title: string;
  titleFr: string;
  fields: SarFieldDef[];
}

export interface SarTemplate {
  id: string;
  partnerId: string | null;
  countryCode: string;
  regulatorName: string;
  version: number;
  schema: SarSectionDef[];
}

export async function getSarTemplate(id: string): Promise<SarTemplate> {
  return apiFetch<SarTemplate>(`/sar-templates/me/${id}`);
}

export type MutationResult<T> = T | { error: string } | AuthExpired;

export async function generateSarReportAction(caseId: string, countryCode: string, reportType: SarReportType = "sar"): Promise<MutationResult<SarReport>> {
  try {
    const result = await apiFetchGuarded<SarReport>(`/sar-reports/me`, { method: "POST", body: { caseId, countryCode, reportType } });
    if (!("error" in result) && !("authExpired" in result)) revalidatePath("/sar-str");
    return result;
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    throw error;
  }
}

export async function updateSarReportAction(
  id: string,
  patch: { data?: Record<string, unknown>; narrative?: string },
): Promise<MutationResult<SarReport>> {
  try {
    const result = await apiFetchGuarded<SarReport>(`/sar-reports/me/${id}`, { method: "PATCH", body: patch });
    if (!("error" in result) && !("authExpired" in result)) revalidatePath(`/sar-str/${id}`);
    return result;
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    throw error;
  }
}

export async function submitSarReportAction(id: string): Promise<MutationResult<SarReport>> {
  try {
    const result = await apiFetchGuarded<SarReport>(`/sar-reports/me/${id}/submit`, { method: "POST" });
    if (!("error" in result) && !("authExpired" in result)) {
      revalidatePath(`/sar-str/${id}`);
      revalidatePath("/sar-str");
    }
    return result;
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    throw error;
  }
}

async function sarTransitionAction(id: string, path: "review" | "approve"): Promise<MutationResult<SarReport>> {
  try {
    const result = await apiFetchGuarded<SarReport>(`/sar-reports/me/${id}/${path}`, { method: "POST" });
    if (!("error" in result) && !("authExpired" in result)) {
      revalidatePath(`/sar-str/${id}`);
      revalidatePath("/sar-str");
    }
    return result;
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    throw error;
  }
}

export async function reviewSarReportAction(id: string): Promise<MutationResult<SarReport>> {
  return sarTransitionAction(id, "review");
}

export async function approveSarReportAction(id: string): Promise<MutationResult<SarReport>> {
  return sarTransitionAction(id, "approve");
}

export async function recordSarFilingResultAction(
  id: string,
  result: { status: "filed" | "rejected"; regulatorReference?: string; filingNotes?: string },
): Promise<MutationResult<SarReport>> {
  try {
    const response = await apiFetchGuarded<SarReport>(`/sar-reports/me/${id}/filing-result`, { method: "POST", body: result });
    if (!("error" in response) && !("authExpired" in response)) {
      revalidatePath(`/sar-str/${id}`);
      revalidatePath("/sar-str");
    }
    return response;
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    throw error;
  }
}
