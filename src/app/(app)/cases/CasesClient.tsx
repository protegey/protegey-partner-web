"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Briefcase, Plus } from "lucide-react";
import { useLang } from "@/lib/i18n/LangProvider";
import type { Case } from "./actions";
import type { PaginatedResult } from "../transactions/actions";

const STATUS_COLOR: Record<string, string> = {
  open: "bg-amber-500/15 text-amber-600",
  investigating: "bg-blue-500/15 text-blue-600",
  closed: "bg-muted text-muted-foreground",
};

export function CasesClient({
  result,
  page,
  initialStatus,
  initialCustomer,
}: {
  result: PaginatedResult<Case>;
  page: number;
  initialStatus: string;
  initialCustomer: string;
}) {
  const router = useRouter();
  const { t, lang } = useLang();
  const [, startTransition] = useTransition();
  const [status, setStatus] = useState(initialStatus);
  const [customer, setCustomer] = useState(initialCustomer);

  const statusLabel: Record<string, string> = {
    open: t("caseStatusOpen"),
    investigating: t("caseStatusInvestigating"),
    closed: t("caseStatusClosed"),
  };

  function applyFilters(newPage: number = 1) {
    const params = new URLSearchParams();
    if (newPage > 1) params.set("page", String(newPage));
    if (status !== "all") params.set("status", status);
    if (customer) params.set("customer", customer);
    startTransition(() => router.push(`/cases?${params.toString()}`));
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">{t("casesPageTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("casesPageSubtitle")}</p>
        </div>
        <Link
          href="/cases/new"
          className="flex shrink-0 items-center gap-1.5 rounded-md bg-primary px-3.5 py-1.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Plus className="size-4" />
          {t("casesNewButton")}
        </Link>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-md border border-border bg-card p-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">{t("signalsFilterCustomerLabel")}</label>
          <input
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            placeholder={t("signalsFilterCustomerPlaceholder")}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">{t("casesFilterStatusLabel")}</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">{t("txFilterAllOption")}</option>
            <option value="open">{t("caseStatusOpen")}</option>
            <option value="investigating">{t("caseStatusInvestigating")}</option>
            <option value="closed">{t("caseStatusClosed")}</option>
          </select>
        </div>
        <button
          type="button"
          onClick={() => applyFilters()}
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
        >
          {t("txFilterApply")}
        </button>
      </div>

      {result.data.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-md border border-border p-10 text-center">
          <Briefcase className="size-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">{t("casesEmpty")}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">{t("casesColTitle")}</th>
                <th className="px-4 py-2.5 font-medium">{t("signalsColCustomer")}</th>
                <th className="px-4 py-2.5 font-medium">{t("casesColStatus")}</th>
                <th className="px-4 py-2.5 font-medium">{t("casesColAssignee")}</th>
                <th className="px-4 py-2.5 font-medium">{t("casesColAlerts")}</th>
                <th className="px-4 py-2.5 font-medium">{t("casesColOutcome")}</th>
                <th className="px-4 py-2.5 font-medium">{t("signalsColWhen")}</th>
                <th className="px-4 py-2.5 font-medium">{t("casesColUpdated")}</th>
                <th className="px-4 py-2.5 font-medium">{t("casesColClosed")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {result.data.map((kase) => (
                <tr key={kase.id} onClick={() => router.push(`/cases/${kase.id}`)} className="cursor-pointer hover:bg-muted/50">
                  <td className="px-4 py-2.5 font-medium text-foreground">{kase.title}</td>
                  <td className="px-4 py-2.5 text-foreground">{kase.externalCustomerId}</td>
                  <td className="px-4 py-2.5">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[kase.status]}`}>{statusLabel[kase.status]}</span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{kase.assignedToUserId ?? "—"}</td>
                  <td className="px-4 py-2.5 text-center text-muted-foreground">{kase.linkedAlertIds.length}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{kase.outcome ? (kase.outcome === "no_action" ? t("caseOutcomeNoAction") : kase.outcome === "false_positive" ? t("caseOutcomeFalsePositive") : t("caseOutcomeSarFiled")) : "—"}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-xs text-muted-foreground">
                    {new Date(kase.createdAt).toLocaleString(lang === "fr" ? "fr-FR" : "en-US")}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-xs text-muted-foreground">{new Date(kase.updatedAt).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US")}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-xs text-muted-foreground">{kase.closedAt ? new Date(kase.closedAt).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US") : "—"}</td>
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
            onClick={() => applyFilters(page - 1)}
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
            onClick={() => applyFilters(page + 1)}
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
