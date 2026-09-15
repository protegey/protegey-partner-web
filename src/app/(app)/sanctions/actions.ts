"use server";

import { apiFetch } from "@/lib/api";

export interface SanctionsEntity {
  id: string;
  name: string;
  type: string;
  source: string;
  sourceId: string | null;
  aliases: string[];
  dateOfBirth: string | null;
  nationality: string | null;
  listingDate: string | null;
  delistedAt: string | null;
  notes: string | null;
  createdAt: string;
}

export interface PaginatedSanctions {
  data: SanctionsEntity[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SanctionsStats {
  total: number;
  active: number;
  delisted: number;
  byType: { type: string; count: number }[];
  bySource: { source: string; count: number }[];
}

export async function getSanctions(params: {
  page?: number;
  type?: string;
  source?: string;
  search?: string;
  includeDelisted?: boolean;
}): Promise<PaginatedSanctions> {
  const query = new URLSearchParams({ page: String(params.page ?? 1), limit: "20" });
  if (params.type) query.set("type", params.type);
  if (params.source) query.set("source", params.source);
  if (params.search) query.set("search", params.search);
  if (params.includeDelisted) query.set("includeDelisted", "true");
  return apiFetch<PaginatedSanctions>(`/sanctions?${query.toString()}`);
}

export async function getSanctionsStats(): Promise<SanctionsStats> {
  return apiFetch<SanctionsStats>("/sanctions/stats");
}
