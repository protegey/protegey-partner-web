import type { Metadata } from "next";
import { getAuditLogs } from "./actions";
import { AuditLogsClient } from "./AuditLogsClient";
import { getLang } from "@/lib/i18n/lang";
import { getSessionUser } from "@/lib/session";
import { requirePageAccess } from "@/lib/requirePageAccess";

export const metadata: Metadata = {
  title: "Audit Logs — Protegey Partner",
};

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const [user, lang] = await Promise.all([getSessionUser(), getLang()]);
  const denied = requirePageAccess(user, "partners.view_audit_logs", lang);
  if (denied) return denied;

  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const result = await getAuditLogs(page);

  return <AuditLogsClient result={result} page={page} />;
}
