import type { Metadata } from "next";
import { PaginationControls } from "@/components/PaginationControls";
import { RefreshButton } from "@/components/RefreshButton";
import { getTeamMembers } from "../team/actions";
import { getEddReviews, type EddStatus } from "./actions";
import { EddClient } from "./EddClient";

export const metadata: Metadata = { title: "EDD — Protegey Partner" };

export default async function EddPage({ searchParams }: { searchParams: Promise<{ page?: string; status?: string }> }) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const status = params.status as EddStatus | undefined;
  const [result, teamMembers] = await Promise.all([getEddReviews({ page, status }), getTeamMembers()]);
  return <div className="flex flex-col gap-3"><div className="flex justify-end"><RefreshButton /></div><EddClient result={result} initialStatus={status ?? "all"} teamMembers={teamMembers} /><PaginationControls page={result.page} totalPages={result.totalPages} total={result.total} href={(nextPage) => `/edd?page=${nextPage}${status ? `&status=${encodeURIComponent(status)}` : ""}`} /></div>;
}
