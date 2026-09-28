"use client";

import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { useLang } from "@/lib/i18n/LangProvider";
import { Pagination } from "@/components/Pagination";
import { describeEvent } from "@/lib/events";
import type { NotificationsPage } from "./actions";
import { PageGuideButton, type PageGuideContent } from "@/components/PageGuideButton";

const NOTIFICATIONS_GUIDE: Record<"en" | "fr", PageGuideContent> = {
  fr: {
    title: "Notifications",
    explanation:
      "C'est le fil d'actualité de tout ce qui se passe pour ton organisation : un statut KYC qui change, une nouvelle alerte, un dossier qui change de statut, une demande KYB soumise, et plus encore.\n\nClique sur une notification et tu es directement emmené à l'enregistrement concerné (l'alerte, le dossier, le client…) — pas besoin de le chercher toi-même.\n\nC'est le même flux d'événements que les Journaux d'audit, juste présenté différemment : ici pour rester informé au jour le jour, là-bas pour la trace de conformité complète.",
    diagram: [
      [
        { label: "KYC / KYB", note: "changement de statut" },
        { label: "Alertes" },
        { label: "Dossiers" },
      ],
      [{ label: "Journal d'événements" }],
      [{ label: "Notifications", note: "fil filtré, cliquable", current: true }],
    ],
  },
  en: {
    title: "Notifications",
    explanation:
      "This is the activity feed for everything happening in your organization: a KYC status change, a new alert, a case changing status, a KYB submission, and more.\n\nClick a notification and you're taken straight to the record it's about (the alert, the case, the client…) — no need to go hunting for it yourself.\n\nIt's the same event stream as Audit Logs, just presented differently: here to stay on top of things day-to-day, there for the full compliance record.",
    diagram: [
      [
        { label: "KYC / KYB", note: "status change" },
        { label: "Alerts" },
        { label: "Cases" },
      ],
      [{ label: "Event log" }],
      [{ label: "Notifications", note: "filtered, clickable feed", current: true }],
    ],
  },
};

export function NotificationsClient({ result, page }: { result: NotificationsPage; page: number }) {
  const router = useRouter();
  const { t, lang } = useLang();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-foreground">{t("notificationsPageTitle")}</h1>
          <PageGuideButton content={NOTIFICATIONS_GUIDE[lang]} />
        </div>
        <p className="text-sm text-muted-foreground">{t("notificationsPageSubtitle")}</p>
      </div>

      {result.data.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-md border border-border p-10 text-center">
          <Bell className="size-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">{t("notificationsEmpty")}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {result.data.map((event) => (
            <div key={event.id} className="rounded-md border border-border bg-card p-3.5">
              <p className="text-sm text-foreground">{describeEvent(lang, event)}</p>
              <p className="mt-1 text-xs text-muted-foreground">{new Date(event.createdAt).toLocaleString(lang === "fr" ? "fr-FR" : "en-US")}</p>
            </div>
          ))}
        </div>
      )}

      <Pagination page={page} totalPages={result.totalPages} total={result.total} onPageChange={(next) => router.push(`/notifications?page=${next}`)} />
    </div>
  );
}
