"use client";

import { useRouter } from "next/navigation";
import { ScrollText } from "lucide-react";
import { useLang } from "@/lib/i18n/LangProvider";
import { describeEvent, type NotificationEvent } from "@/lib/events";
import type { PaginatedResult } from "../transactions/actions";

export function AuditLogsClient({ result, page }: { result: PaginatedResult<NotificationEvent>; page: number }) {
  const router = useRouter();
  const { t, lang } = useLang();

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
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

      {result.totalPages > 1 ? (
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push(`/audit-logs?page=${page - 1}`)}
            disabled={page <= 1}
            className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t("paginationPrevious")}
          </button>
          <span className="text-sm text-muted-foreground">
            {t("paginationPagePrefix")} {page} {t("paginationOf")} {result.totalPages}
          </span>
          <button
            type="button"
            onClick={() => router.push(`/audit-logs?page=${page + 1}`)}
            disabled={page >= result.totalPages}
            className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t("paginationNext")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
