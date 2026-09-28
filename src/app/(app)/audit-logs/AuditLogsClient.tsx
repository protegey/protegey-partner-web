"use client";

import { useRouter } from "next/navigation";
import { ScrollText } from "lucide-react";
import { useLang } from "@/lib/i18n/LangProvider";
import { Pagination } from "@/components/Pagination";
import { describeEvent, type NotificationEvent } from "@/lib/events";
import type { PaginatedResult } from "../transactions/actions";
import { PageGuideButton, type PageGuideContent } from "@/components/PageGuideButton";

const AUDIT_LOGS_GUIDE: Record<"en" | "fr", PageGuideContent> = {
  fr: {
    title: "Journaux d'audit",
    explanation:
      "Chaque action importante qui se produit dans le produit — une alerte créée ou changée de statut, une décision KYC, un dossier fermé, une équipe modifiée — laisse une trace horodatée. Cette page montre cette trace en entier, sans filtre, avec qui l'a faite (ou quel système automatique) et les détails techniques associés.\n\nC'est exactement le même flux d'événements que la page Notifications, mais présenté pour la conformité : rien n'est marqué comme « lu », rien ne peut être supprimé, et rien n'est caché. C'est la source de vérité en cas de contrôle réglementaire ou d'enquête interne sur « qui a fait quoi, et quand ».",
    diagram: [
      [
        { label: "Alertes, Dossiers, KYC/KYB, Équipe…", note: "toute action dans le produit" },
      ],
      [{ label: "Journal d'événements", note: "append-only" }],
      [
        { label: "Journaux d'audit", note: "vue complète, non filtrée", current: true },
        { label: "Notifications", note: "même flux, vue filtrée" },
      ],
    ],
    diagramCaption: "Notifications et Journaux d'audit lisent le même journal d'événements — seule la présentation diffère.",
  },
  en: {
    title: "Audit logs",
    explanation:
      "Every meaningful action in the product — an alert created or its status changed, a KYC decision, a case closed, a team change — leaves a timestamped trace. This page shows that trace in full, unfiltered, with who did it (or which automated system) and the technical details attached.\n\nIt's the exact same event stream as the Notifications page, just presented for compliance purposes: nothing is marked \"read\", nothing can be deleted, and nothing is hidden. This is the source of truth for a regulatory check or an internal investigation into \"who did what, and when\".",
    diagram: [
      [{ label: "Alerts, Cases, KYC/KYB, Team…", note: "any action in the product" }],
      [{ label: "Event log", note: "append-only" }],
      [
        { label: "Audit logs", note: "full, unfiltered view", current: true },
        { label: "Notifications", note: "same stream, filtered view" },
      ],
    ],
    diagramCaption: "Notifications and Audit Logs read the same event log — only the presentation differs.",
  },
};

export function AuditLogsClient({ result, page }: { result: PaginatedResult<NotificationEvent>; page: number }) {
  const router = useRouter();
  const { t, lang } = useLang();

  return (
    <div className="flex w-full flex-col gap-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-foreground">{t("auditLogsPageTitle")}</h1>
          <PageGuideButton content={AUDIT_LOGS_GUIDE[lang]} />
        </div>
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
