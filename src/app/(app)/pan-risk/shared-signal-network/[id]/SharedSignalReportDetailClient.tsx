"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { useLang } from "@/lib/i18n/LangProvider";
import type { SharedSignalReportDetail, SharedSignalCategory } from "../actions";
import { PageGuideButton, type PageGuideContent } from "@/components/PageGuideButton";

const SHARED_SIGNAL_DETAIL_GUIDE: Record<"en" | "fr", PageGuideContent> = {
  fr: {
    title: "Signalement partagé",
    explanation:
      "Tu regardes le détail d'un signalement que TOI tu as envoyé au réseau : le type d'identifiant partagé (téléphone, email, empreinte d'appareil), la catégorie (fraude confirmée, usurpation d'identité, blanchiment, autre), et le Dossier interne d'où il vient.\n\nCe signalement est visible par les autres partenaires Protegey quand ils interrogent le réseau — mais uniquement sa catégorie et sa date, jamais ton identité ni les détails de ton dossier. Le lien vers le dossier source ici n'est visible que par toi.",
    diagram: [
      [{ label: "Dossier fermé", note: "fraude confirmée" }],
      [{ label: "Signalement partagé", note: "détail d'un envoi", current: true }],
      [{ label: "Réseau de signaux partagés", note: "visible par les autres partenaires (anonymisé)" }],
    ],
  },
  en: {
    title: "Shared report",
    explanation:
      "You're looking at the detail of a report YOU sent to the network: the type of identifier shared (phone, email, device fingerprint), the category (confirmed fraud, identity theft, money laundering, other), and the internal Case it came from.\n\nThis report is visible to other Protegey partners when they query the network — but only its category and date, never your identity or your case's details. The link to the source case here is visible to you only.",
    diagram: [
      [{ label: "Case closed", note: "confirmed fraud" }],
      [{ label: "Shared report", note: "detail of one submission", current: true }],
      [{ label: "Shared Signal Network", note: "visible to other partners (anonymized)" }],
    ],
  },
};

const CATEGORY_KEY: Record<SharedSignalCategory, string> = {
  confirmed_fraud: "sharedSignalCategoryConfirmedFraud",
  identity_theft: "sharedSignalCategoryIdentityTheft",
  money_laundering: "sharedSignalCategoryMoneyLaundering",
  other: "sharedSignalCategoryOther",
};

const IDENTITY_TYPE_KEY: Record<string, string> = {
  phone: "sharedSignalIdentityTypePhone",
  email: "sharedSignalIdentityTypeEmail",
  device_fingerprint: "sharedSignalIdentityTypeDevice",
};

const CASE_STATUS_KEY: Record<string, string> = {
  open: "caseStatusOpen",
  investigating: "caseStatusInvestigating",
  closed: "caseStatusClosed",
};

export function SharedSignalReportDetailClient({ report }: { report: SharedSignalReportDetail }) {
  const router = useRouter();
  const { t, lang } = useLang();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <button type="button" onClick={() => router.push("/pan-risk/shared-signal-network")} className="text-xs text-muted-foreground hover:underline">
          {t("sharedSignalBackToList")}
        </button>
        <div className="mt-1 flex items-center gap-3">
          <ShieldAlert className="size-5 text-muted-foreground" />
          <h1 className="text-xl font-semibold text-foreground">{t(CATEGORY_KEY[report.category] as Parameters<typeof t>[0])}</h1>
          <PageGuideButton content={SHARED_SIGNAL_DETAIL_GUIDE[lang]} />
        </div>
        <p className="text-sm text-muted-foreground">
          {t("sharedSignalReportedOn")} {new Date(report.reportedAt).toLocaleString(lang === "fr" ? "fr-FR" : "en-US")}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 rounded-md border border-border bg-card p-5 sm:grid-cols-2">
        <div>
          <p className="text-xs font-medium uppercase text-muted-foreground">{t("sharedSignalColIdentityType")}</p>
          <p className="mt-1 text-sm text-foreground">{t((IDENTITY_TYPE_KEY[report.identityType] ?? "sharedSignalIdentityTypePhone") as Parameters<typeof t>[0])}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-muted-foreground">{t("sharedSignalColCategory")}</p>
          <p className="mt-1 text-sm text-foreground">{t(CATEGORY_KEY[report.category] as Parameters<typeof t>[0])}</p>
        </div>
      </div>

      <div className="rounded-md border border-border bg-card p-5">
        <p className="text-xs font-medium uppercase text-muted-foreground">{t("sharedSignalSourceCaseTitle")}</p>
        <p className="mt-2 text-xs text-muted-foreground">{t("sharedSignalSourceCaseHint")}</p>
        <Link
          href={`/cases/${report.sourceCaseId}`}
          className="mt-3 flex items-center justify-between rounded-md border border-border px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-muted"
        >
          <span className="flex flex-col">
            <span className="font-medium">{report.sourceCaseTitle}</span>
            {report.externalCustomerId ? <span className="font-mono text-xs text-muted-foreground">{report.externalCustomerId}</span> : null}
          </span>
          <span className="text-xs text-muted-foreground">{t((CASE_STATUS_KEY[report.sourceCaseStatus] ?? "caseStatusClosed") as Parameters<typeof t>[0])}</span>
        </Link>
      </div>
    </div>
  );
}
