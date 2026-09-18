import type { Metadata } from "next";
import { getAuditLogs } from "./actions";
import { AuditLogsClient } from "./AuditLogsClient";

export const metadata: Metadata = {
  title: "Audit Logs — Protegey Partner",
};

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const result = await getAuditLogs(page);

  return <AuditLogsClient result={result} page={page} />;
}
