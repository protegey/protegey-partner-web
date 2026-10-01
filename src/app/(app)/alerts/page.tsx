import type { Metadata } from "next";
import { Suspense } from "react";
import { getAlerts } from "./actions";
import type { AlertStatus } from "./actions";
import { getAssignableTeamMembers } from "../team/actions";
import { AlertsClient } from "./AlertsClient";
import { getLang } from "@/lib/i18n/lang";
import { getSessionUser } from "@/lib/session";
import { requirePageAccess } from "@/lib/requirePageAccess";

export const metadata: Metadata = {
  title: "Alerts — Protegey Partner",
};

export default async function AlertsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const [user, lang] = await Promise.all([getSessionUser(), getLang()]);
  const denied = requirePageAccess(user, ["partners.manage_alerts", "partners.view_alerts"], lang);
  if (denied) return denied;

  const { page: pageParam, status } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const [result, teamMembers] = await Promise.all([
    getAlerts({ page, status: status as AlertStatus | undefined }),
    getAssignableTeamMembers("partners.manage_alerts"),
  ]);

  return (
    <Suspense>
      {/* Keyed on page+status: a filter/pagination change pushes a new URL that re-renders this
          server component with fresh props, but wouldn't otherwise remount the client component
          below — forcing a remount is what makes its local `alerts`/`status` state (seeded once
          from props via useState) actually reflect the new filter instead of staying stale. */}
      <AlertsClient key={`${page}-${status ?? "all"}`} result={result} page={page} initialStatus={status ?? "all"} teamMembers={teamMembers} />
    </Suspense>
  );
}
