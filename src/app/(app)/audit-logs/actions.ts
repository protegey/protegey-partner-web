"use server";

import { apiFetch, apiFetchTextGuarded, ApiError, type AuthExpired } from "@/lib/api";
import type { NotificationEvent } from "@/lib/events";
import type { PaginatedResult } from "../transactions/actions";

export interface AuditLogsQuery {
  page?: number;
  type?: string;
  actorLabel?: string;
  dateFrom?: string;
  dateTo?: string;
}

export async function getAuditLogs(query: AuditLogsQuery): Promise<PaginatedResult<NotificationEvent>> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  return apiFetch<PaginatedResult<NotificationEvent>>(`/audit-logs/me?${params.toString()}`);
}

/** Every row matching `query`, as CSV text — the backend's `/audit-logs/me/export` endpoint
 * ignores pagination and returns the full filtered set. */
export async function exportAuditLogsAction(query: Omit<AuditLogsQuery, "page">): Promise<string | { error: string } | AuthExpired> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  try {
    return await apiFetchTextGuarded(`/audit-logs/me/export?${params.toString()}`);
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    throw error;
  }
}
