"use server";

import { apiFetch } from "@/lib/api";
import type { NotificationEvent } from "@/lib/events";
import type { PaginatedResult } from "../transactions/actions";

export interface NotificationsPage extends PaginatedResult<NotificationEvent> {
  unreadCount: number;
}

export async function getNotifications(page = 1): Promise<NotificationsPage> {
  return apiFetch<NotificationsPage>(`/notifications/me?page=${page}`);
}

export async function getUnreadNotificationsCount(): Promise<number> {
  try {
    const result = await apiFetch<NotificationsPage>("/notifications/me?limit=1");
    return result.unreadCount;
  } catch {
    return 0;
  }
}

export async function markNotificationsSeen(): Promise<void> {
  await apiFetch("/notifications/me/seen", { method: "POST" });
}
