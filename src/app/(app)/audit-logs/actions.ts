"use server";

import { apiFetch } from "@/lib/api";
import type { NotificationEvent } from "@/lib/events";
import type { PaginatedResult } from "../transactions/actions";

export async function getAuditLogs(page = 1): Promise<PaginatedResult<NotificationEvent>> {
  return apiFetch<PaginatedResult<NotificationEvent>>(`/audit-logs/me?page=${page}`);
}
