import type { Metadata } from "next";
import Link from "next/link";
import { getCtrReport } from "../../actions";
import { getPartnerSettings } from "../../../settings/profile/actions";
import { getLang } from "@/lib/i18n/lang";
import { t, type StringKey } from "@/lib/i18n/strings";
import { PrintButton } from "@/components/PrintButton";

export const metadata: Metadata = {
  title: "CTR Document Preview — Protegey Partner",
};

const STATUS_LABEL_KEY: Record<string, StringKey> = {
  draft: "ctrStatus_draft",
  mlro_review: "ctrStatus_mlro_review",
  filing_pending: "ctrStatus_filing_pending",
  filed: "ctrStatus_filed",
  rejected: "ctrStatus_rejected",
};

function formatDate(value: string | null, lang: "en" | "fr"): string {
  if (!value) return t(lang, "sarDocNoValue");
  return new Date(value).toLocaleString(lang === "fr" ? "fr-FR" : "en-US");
}

export default async function CtrReportPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lang = await getLang();
  const [report, partner] = await Promise.all([getCtrReport(id), getPartnerSettings()]);
  const statusKey = STATUS_LABEL_KEY[report.status] ?? "ctrStatus_draft";

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 pb-16">
      <div className="flex items-center justify-between print:hidden">
        <Link href="/ctr" className="text-xs text-muted-foreground hover:underline">
          {t(lang, "ctrPreviewBackButton")}
        </Link>
        <PrintButton label={t(lang, "sarPreviewPrintButton")} />
      </div>
      <p className="text-xs text-muted-foreground print:hidden">{t(lang, "sarPreviewPrintHint")}</p>

      <div className="mx-auto w-full max-w-[210mm] rounded-md border border-border bg-white p-10 font-serif text-neutral-900 shadow-sm print:w-full print:max-w-none print:border-0 print:p-0 print:shadow-none">
        <p className="text-center font-sans text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
          {t(lang, "sarDocConfidential")}
        </p>
        <h1 className="mt-3 text-center text-lg font-bold">{t(lang, "ctrDocTitle")}</h1>
        <p className="text-center text-sm text-neutral-600">
          {report.currency} · {t(lang, statusKey)}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-2 border-y border-neutral-300 py-4 font-sans text-xs">
          <div>
            <p className="text-neutral-500">{t(lang, "ctrDocDeclaringInstitution")}</p>
            <p className="font-medium">{partner.name}</p>
          </div>
          <div>
            <p className="text-neutral-500">{t(lang, "sarDocInternalReference")}</p>
            <p className="font-mono font-medium">{report.id}</p>
          </div>
          <div>
            <p className="text-neutral-500">{t(lang, "ctrDocCustomer")}</p>
            <p className="font-mono font-medium">{report.externalCustomerId}</p>
          </div>
          <div>
            <p className="text-neutral-500">{t(lang, "sarColRegulatorReference")}</p>
            <p className="font-medium">{report.regulatorReference ?? t(lang, "sarDocNoValue")}</p>
          </div>
        </div>

        <div className="mt-6">
          <p className="border-b border-neutral-300 pb-1 text-sm font-bold uppercase tracking-wide text-neutral-800">
            {t(lang, "ctrDocPeriod")}
          </p>
          <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-3">
            <div>
              <p className="font-sans text-[11px] text-neutral-500">{t(lang, "ctrPeriod")}</p>
              <p className="text-sm">{report.periodStart} – {report.periodEnd}</p>
            </div>
            <div>
              <p className="font-sans text-[11px] text-neutral-500">{t(lang, "ctrAmount")}</p>
              <p className="text-sm">{report.cashTotalAmount} {report.currency}</p>
            </div>
            <div>
              <p className="font-sans text-[11px] text-neutral-500">{t(lang, "ctrCount")}</p>
              <p className="text-sm">{report.cashTransactionCount}</p>
            </div>
            <div>
              <p className="font-sans text-[11px] text-neutral-500">{t(lang, "ctrDocThresholdApplied")}</p>
              <p className="text-sm">{report.thresholdAmount} {report.currency}</p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <p className="border-b border-neutral-300 pb-1 text-sm font-bold uppercase tracking-wide text-neutral-800">
            {t(lang, "sarDocFilingNotes")}
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm">{report.filingNotes || t(lang, "sarDocNoValue")}</p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-2 border-t border-neutral-300 pt-4 font-sans text-xs">
          <div>
            <p className="text-neutral-500">{t(lang, "sarDocMlroApprovedBy")}</p>
            <p className="font-mono font-medium">{report.mlroApprovedByUserId ?? t(lang, "sarDocNoValue")}</p>
          </div>
          <div>
            <p className="text-neutral-500">{t(lang, "ctrDocMlroApprovedAt")}</p>
            <p className="font-medium">{formatDate(report.mlroReviewedAt, lang)}</p>
          </div>
          <div>
            <p className="text-neutral-500">{t(lang, "sarDocFiledAt")}</p>
            <p className="font-medium">{formatDate(report.filedAt, lang)}</p>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-6 font-sans text-xs">
          <div>
            <div className="h-10 border-b border-neutral-400" />
            <p className="mt-1 text-neutral-500">{t(lang, "sarDocSignatureDeclarant")}</p>
          </div>
          <div>
            <div className="h-10 border-b border-neutral-400" />
            <p className="mt-1 text-neutral-500">{t(lang, "sarDocSignatureDate")}</p>
          </div>
        </div>

        <p className="mt-8 text-center font-sans text-[10px] text-neutral-400">
          {t(lang, "sarDocGeneratedOn")} {new Date().toLocaleString(lang === "fr" ? "fr-FR" : "en-US")}
        </p>
      </div>
    </div>
  );
}
