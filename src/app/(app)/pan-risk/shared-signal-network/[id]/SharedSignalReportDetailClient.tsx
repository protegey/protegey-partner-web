"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { useLang } from "@/lib/i18n/LangProvider";
import type { SharedSignalReportDetail, SharedSignalCategory } from "../actions";

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
          <span className="font-medium">{report.sourceCaseTitle}</span>
          <span className="text-xs text-muted-foreground">{t((CASE_STATUS_KEY[report.sourceCaseStatus] ?? "caseStatusClosed") as Parameters<typeof t>[0])}</span>
        </Link>
      </div>
    </div>
  );
}
