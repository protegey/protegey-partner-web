import type { Metadata } from "next";
import { PaginationControls } from "@/components/PaginationControls";
import { getAssignableTeamMembers } from "../team/actions";
import { getEddReviews, type EddStatus } from "./actions";
import { EddClient } from "./EddClient";
import { getLang } from "@/lib/i18n/lang";
import { getSessionUser } from "@/lib/session";
import { requirePageAccess } from "@/lib/requirePageAccess";

export const metadata: Metadata = { title: "EDD — Protegey Partner" };

export default async function EddPage({ searchParams }: { searchParams: Promise<{ page?: string; status?: string }> }) {
  const [user, lang] = await Promise.all([getSessionUser(), getLang()]);
  const denied = requirePageAccess(user, "sanctions.view", lang);
  if (denied) return denied;

  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const status = params.status as EddStatus | undefined;
  const [result, teamMembers] = await Promise.all([getEddReviews({ page, status }), getAssignableTeamMembers("partners.manage_alerts")]);
  // Keyed on page+status: a filter/pagination change re-renders this server component with fresh
  // props but wouldn't otherwise remount EddClient — forcing a remount is what makes its local
  // `reviews`/`filter` state (seeded once from props via useState) actually reflect the change
  // instead of staying stale (same issue fixed in /alerts).
  return <div className="flex flex-col gap-3"><EddClient key={`${page}-${status ?? "all"}`} result={result} initialStatus={status ?? "all"} teamMembers={teamMembers} /><PaginationControls page={result.page} totalPages={result.totalPages} total={result.total} href={(nextPage) => `/edd?page=${nextPage}${status ? `&status=${encodeURIComponent(status)}` : ""}`} /></div>;
}
