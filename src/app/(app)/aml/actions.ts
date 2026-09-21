"use server";

import { apiFetch } from "@/lib/api";

export interface AmlSummary {
  openAlerts: number;
  confirmedAlerts: number;
  overdueAlerts: number;
  escalatedAlerts: number;
  confirmedPep: number;
  pepReviews: number;
  sarDrafts: number;
  sarSubmitted: number;
}

export async function getAmlSummary(): Promise<AmlSummary> {
  return apiFetch<AmlSummary>("/aml/me/summary");
}
