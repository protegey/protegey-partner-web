"use server";

import { apiFetch, apiFetchTextGuarded, ApiError, type AuthExpired } from "@/lib/api";
import type { NotificationEvent } from "@/lib/events";
import type { PaginatedResult } from "../transactions/actions";

export interface NotificationsPage extends PaginatedResult<NotificationEvent> {
  unreadCount: number;
}

export interface NotificationsQuery {
  page?: number;
  type?: string;
  actorLabel?: string;
  dateFrom?: string;
  dateTo?: string;
}

export async function getNotifications(query: NotificationsQuery = {}): Promise<NotificationsPage> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  return apiFetch<NotificationsPage>(`/notifications/me?${params.toString()}`);
}

/** Every row matching `query`, as CSV text — the backend's `/notifications/me/export` endpoint
 * ignores pagination and returns the full filtered set (same underlying rows as Audit Logs). */
export async function exportNotificationsAction(query: Omit<NotificationsQuery, "page">): Promise<string | { error: string } | AuthExpired> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  try {
    return await apiFetchTextGuarded(`/notifications/me/export?${params.toString()}`);
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    throw error;
  }
}

export async function markNotificationsSeen(): Promise<void> {
  await apiFetch("/notifications/me/seen", { method: "POST" });
}
