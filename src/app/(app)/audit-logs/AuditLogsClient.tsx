"use client";

import { useRouter } from "next/navigation";
import { ScrollText } from "lucide-react";
import { useLang } from "@/lib/i18n/LangProvider";
import { Pagination } from "@/components/Pagination";
import { describeEvent, type NotificationEvent } from "@/lib/events";
import type { PaginatedResult } from "../transactions/actions";

export function AuditLogsClient({ result, page }: { result: PaginatedResult<NotificationEvent>; page: number }) {
  const router = useRouter();
  const { t, lang } = useLang();

  return (
    <div className="flex w-full flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{t("auditLogsPageTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("auditLogsPageSubtitle")}</p>
      </div>

      {result.data.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-md border border-border p-10 text-center">
          <ScrollText className="size-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">{t("auditLogsEmpty")}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">{t("auditLogsColWhen")}</th>
                <th className="px-4 py-2.5 font-medium">{t("auditLogsColEvent")}</th>
                <th className="px-4 py-2.5 font-medium">{t("auditLogsColType")}</th>
                <th className="px-4 py-2.5 font-medium">{t("auditLogsColId")}</th>
                <th className="px-4 py-2.5 font-medium">{t("auditLogsColActor")}</th>
                <th className="px-4 py-2.5 font-medium">{t("auditLogsColMetadata")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {result.data.map((event) => (
                <tr key={event.id}>
                  <td className="whitespace-nowrap px-4 py-2.5 text-xs text-muted-foreground">
                    {new Date(event.createdAt).toLocaleString(lang === "fr" ? "fr-FR" : "en-US")}
                  </td>
                  <td className="px-4 py-2.5 text-foreground">{describeEvent(lang, event)}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{event.type}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{event.id}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-xs text-muted-foreground">
                    {event.actorLabel ?? t("eventSystemActor")}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{event.metadata ? Object.keys(event.metadata).length : 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} totalPages={result.totalPages} total={result.total} onPageChange={(next) => router.push(`/audit-logs?page=${next}`)} />
    </div>
  );
}
