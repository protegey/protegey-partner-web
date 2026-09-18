import type { Metadata } from "next";
import { Suspense } from "react";
import { getAlerts } from "./actions";
import type { AlertStatus } from "./actions";
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

  const result = await getAlerts({ page, status: status as AlertStatus | undefined });

  return (
    <Suspense>
      <AlertsClient result={result} page={page} initialStatus={status ?? "all"} />
    </Suspense>
  );
}
