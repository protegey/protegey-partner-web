"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";
import { useLang } from "@/lib/i18n/LangProvider";
import { Pagination } from "@/components/Pagination";
import type { SarReport } from "./actions";
import type { PaginatedResult } from "../transactions/actions";

const STATUS_COLOR: Record<string, string> = {
  draft: "bg-amber-500/15 text-amber-600",
  submitted: "bg-emerald-500/15 text-emerald-600",
  mlro_review: "bg-blue-500/15 text-blue-600",
  filing_pending: "bg-purple-500/15 text-purple-600",
  filed: "bg-emerald-500/15 text-emerald-600",
  rejected: "bg-red-500/15 text-red-600",
};

export function SarStrClient({
  result,
  page,
  initialStatus,
}: {
  result: PaginatedResult<SarReport>;
  page: number;
  initialStatus: string;
}) {
  const router = useRouter();
  const { t, lang } = useLang();
  const [, startTransition] = useTransition();
  const [status, setStatus] = useState(initialStatus);

  const statusLabel: Record<string, string> = {
    draft: t("sarStatusDraft"),
    submitted: t("sarStatusSubmitted"),
    mlro_review: t("sarStatusMlroReview"),
    filing_pending: t("sarStatusFilingPending"),
    filed: t("sarStatusFiled"),
    rejected: t("sarStatusRejected"),
  };

  function applyFilters(newPage: number = 1) {
    const params = new URLSearchParams();
    if (newPage > 1) params.set("page", String(newPage));
    if (status !== "all") params.set("status", status);
    startTransition(() => router.push(`/sar-str?${params.toString()}`));
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{t("sarStrPageTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("sarStrPageSubtitle")}</p>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-md border border-border bg-card p-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">{t("casesFilterStatusLabel")}</label>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              startTransition(() => {
                const params = new URLSearchParams();
                if (e.target.value !== "all") params.set("status", e.target.value);
                router.push(`/sar-str?${params.toString()}`);
              });
            }}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">{t("txFilterAllOption")}</option>
            <option value="draft">{t("sarStatusDraft")}</option>
            <option value="submitted">{t("sarStatusSubmitted")}</option>
            <option value="mlro_review">{t("sarStatusMlroReview")}</option>
            <option value="filing_pending">{t("sarStatusFilingPending")}</option>
            <option value="filed">{t("sarStatusFiled")}</option>
            <option value="rejected">{t("sarStatusRejected")}</option>
          </select>
        </div>
      </div>

      {result.data.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-md border border-border p-10 text-center">
          <FileText className="size-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">{t("sarStrEmpty")}</p>
          <p className="text-xs text-muted-foreground">{t("sarStrEmptyHint")}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">{t("sarColReference")}</th>
                <th className="px-4 py-2.5 font-medium">{t("sarColType")}</th>
                <th className="px-4 py-2.5 font-medium">{t("sarColCase")}</th>
                <th className="px-4 py-2.5 font-medium">{t("sarColTemplate")}</th>
                <th className="px-4 py-2.5 font-medium">{t("casesColStatus")}</th>
                <th className="px-4 py-2.5 font-medium">{t("signalsColWhen")}</th>
                <th className="px-4 py-2.5 font-medium">{t("sarColRegulatorReference")}</th>
                <th className="px-4 py-2.5 font-medium">{t("sarColUpdated")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {result.data.map((report) => (
                (() => {
                  const filingStatus = report.filingStatus ?? (report.status === "submitted" ? "filing_pending" : "draft");
                  return <tr key={report.id} onClick={() => router.push(`/sar-str/${report.id}`)} className="cursor-pointer hover:bg-muted/50">
                    <td className="px-4 py-2.5 font-mono text-xs text-foreground">{report.id}</td>
                    <td className="px-4 py-2.5 uppercase text-xs text-muted-foreground">{report.reportType}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{report.caseId}</td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{report.templateId}</td>
                  <td className="px-4 py-2.5">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[filingStatus]}`}>{statusLabel[filingStatus] ?? statusLabel[report.status]}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-xs text-muted-foreground">
                    {new Date(report.createdAt).toLocaleString(lang === "fr" ? "fr-FR" : "en-US")}
                  </td>
                   <td className="whitespace-nowrap px-4 py-2.5 text-xs text-muted-foreground">{report.regulatorReference ?? "—"}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-xs text-muted-foreground">{new Date(report.updatedAt).toLocaleString(lang === "fr" ? "fr-FR" : "en-US")}</td>
                  </tr>;
                })()
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} totalPages={result.totalPages} total={result.total} onPageChange={applyFilters} />
    </div>
  );
}
