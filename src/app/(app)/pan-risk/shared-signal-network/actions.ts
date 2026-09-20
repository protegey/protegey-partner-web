"use server";

import { apiFetch, apiFetchGuarded, ApiError, type AuthExpired } from "@/lib/api";
import type { PaginatedResult } from "../../transactions/actions";

export type SharedSignalCategory = "confirmed_fraud" | "identity_theft" | "money_laundering" | "other";
export type SharedSignalIdentityType = "phone" | "email" | "device_fingerprint";

export interface SharedSignalReportSummary {
  id: string;
  identityType: SharedSignalIdentityType;
  category: SharedSignalCategory;
  reportedAt: string;
  sourceCaseId: string;
}

export interface SharedSignalReportDetail extends SharedSignalReportSummary {
  sourceCaseTitle: string;
  sourceCaseStatus: string;
}

export interface CheckSharedSignalResult {
  flagged: boolean;
  category: SharedSignalCategory | null;
  reportedDaysAgo: number | null;
}

export interface SharedSignalReportsQuery {
  page?: number;
  category?: SharedSignalCategory;
}

export interface SharedSignalNetworkStatus {
  enabled: boolean;
  enabledAt: string | null;
  eligible: boolean;
  daysUntilEligible: number;
}

export async function getSharedSignalNetworkStatus(): Promise<SharedSignalNetworkStatus> {
  return apiFetch<SharedSignalNetworkStatus>(`/partners/me/shared-signals/status`);
}

export async function getSharedSignalReports(query: SharedSignalReportsQuery = {}): Promise<PaginatedResult<SharedSignalReportSummary>> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  return apiFetch<PaginatedResult<SharedSignalReportSummary>>(`/partners/me/shared-signals/reports?${params.toString()}`);
}

export async function getSharedSignalReport(id: string): Promise<SharedSignalReportDetail> {
  return apiFetch<SharedSignalReportDetail>(`/partners/me/shared-signals/reports/${id}`);
}

export type MutationResult<T> = T | { error: string } | AuthExpired;

export async function checkSharedSignalAction(identifiers: {
  phoneNumber?: string;
  email?: string;
  deviceFingerprint?: string;
}): Promise<MutationResult<CheckSharedSignalResult>> {
  try {
    return await apiFetchGuarded<CheckSharedSignalResult>(`/partners/me/shared-signals/check`, { method: "POST", body: identifiers });
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    throw error;
  }
}
