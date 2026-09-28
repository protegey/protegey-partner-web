"use server";

import { apiFetch } from "@/lib/api";

export type IntegrationChannelKey = "transactions" | "deviceSignals" | "behavioralSignals" | "kyc";
export type IntegrationGrade = "excellent" | "good" | "fair" | "poor";

export interface IntegrationChannelHealth {
  key: IntegrationChannelKey;
  totalCount: number;
  recentCount: number;
  lastReceivedAt: string | null;
  active: boolean;
}

export interface IntegrationHealthReport {
  windowDays: number;
  apiKeyConfigured: boolean;
  apiKeyCreatedAt: string | null;
  webhookConfigured: boolean;
  channels: IntegrationChannelHealth[];
  score: number;
  grade: IntegrationGrade;
}

export async function getIntegrationHealth(): Promise<IntegrationHealthReport> {
  return apiFetch<IntegrationHealthReport>("/integration-health/me");
}
