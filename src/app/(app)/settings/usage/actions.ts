"use server";

import { apiFetch } from "@/lib/api";

export interface UsageSummary {
  windowDays: number;
  transactionsThisMonth: number;
  kycSessionsThisMonth: number;
  clientsInvitedTotal: number;
  teamMembersTotal: number;
}

export async function getUsageSummary(): Promise<UsageSummary> {
  return apiFetch<UsageSummary>("/usage/me");
}
