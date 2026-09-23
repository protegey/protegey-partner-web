"use server";

import { apiFetch } from "@/lib/api";

export type TransactionDirection = "DEBIT" | "CREDIT";
export type TransactionDecision = "clear" | "review" | "blocked";
export type DeviceAction = "allow" | "soft_challenge" | "hard_challenge" | "block";

export interface MonitoringTransaction {
  id: string;
  partnerId: string;
  externalTransactionId: string;
  externalCustomerId: string;
  direction: TransactionDirection;
  amount: string;
  currency: string;
  transactionType: string;
  counterpartyExternalId: string | null;
  isCash: boolean;
  occurredAt: string;
  decision: TransactionDecision;
  riskScore: number;
  createdAt: string;
  deviceRiskScore: number | null;
  deviceAction: DeviceAction | null;
  deviceReasons: string[] | null;
  deviceVisitorId: string | null;
  deviceAttributes: Record<string, unknown> | null;
  ipCountry: string | null;
  ipHash: string | null;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TransactionsQuery {
  page?: number;
  limit?: number;
  direction?: TransactionDirection;
  decision?: TransactionDecision;
  externalCustomerId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export async function getTransactions(query: TransactionsQuery = {}): Promise<PaginatedResult<MonitoringTransaction>> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  return apiFetch<PaginatedResult<MonitoringTransaction>>(`/transactions/me?${params.toString()}`);
}

export interface TransactionStats {
  windowDays: number;
  totalCount: number;
  totalVolume: number;
  flaggedCount: number;
  flaggedPercent: number;
  averageRiskScore: number;
  volumeByDay: { date: string; count: number; volume: number }[];
  decisionBreakdown: { decision: string; count: number }[];
  directionBreakdown: { direction: string; count: number }[];
  topRules: { code: string; name: string; nameFr: string | null; count: number }[];
}

export async function getTransactionStats(): Promise<TransactionStats> {
  return apiFetch<TransactionStats>("/transactions/me/stats");
}
