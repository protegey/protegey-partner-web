import type { Metadata } from "next";
import { Suspense } from "react";
import { getAlerts } from "./actions";
import type { AlertStatus } from "./actions";
import { getTeamMembers } from "../team/actions";
import { AlertsClient } from "./AlertsClient";

export const metadata: Metadata = {
  title: "Alerts — Protegey Partner",
};

export default async function AlertsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const { page: pageParam, status } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const [result, teamMembers] = await Promise.all([
    getAlerts({ page, status: status as AlertStatus | undefined }),
    getTeamMembers(),
  ]);

  return (
    <Suspense>
      <AlertsClient result={result} page={page} initialStatus={status ?? "all"} teamMembers={teamMembers} />
    </Suspense>
  );
}
