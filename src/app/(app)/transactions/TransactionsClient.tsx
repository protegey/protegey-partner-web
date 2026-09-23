"use client";

import { Fragment, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownLeft, ArrowUpRight, ChevronDown, ChevronRight } from "lucide-react";
import { useLang } from "@/lib/i18n/LangProvider";
import { Pagination } from "@/components/Pagination";
import { DeviceAttributesDetails } from "@/components/DeviceAttributesSummary";
import type { DeviceAction, MonitoringTransaction, PaginatedResult } from "./actions";

function riskColor(score: number): string {
  if (score >= 50) return "text-destructive";
  if (score >= 20) return "text-amber-600";
  return "text-muted-foreground";
}

const DEVICE_ACTION_COLOR: Record<DeviceAction, string> = {
  allow: "bg-emerald-500/15 text-emerald-600",
  soft_challenge: "bg-amber-500/15 text-amber-600",
  hard_challenge: "bg-orange-500/15 text-orange-600",
  block: "bg-destructive/15 text-destructive",
};

export function TransactionsClient({
  result,
  page,
  initialDirection,
  initialDecision,
  initialCustomer,
  initialDateFrom,
  initialDateTo,
}: {
  result: PaginatedResult<MonitoringTransaction>;
  page: number;
  initialDirection: string;
  initialDecision: string;
  initialCustomer: string;
  initialDateFrom: string;
  initialDateTo: string;
}) {
  const router = useRouter();
  const { t, lang } = useLang();
  const [, startTransition] = useTransition();
  const [direction, setDirection] = useState(initialDirection);
  const [decision, setDecision] = useState(initialDecision);
  const [customer, setCustomer] = useState(initialCustomer);
  const [dateFrom, setDateFrom] = useState(initialDateFrom);
  const [dateTo, setDateTo] = useState(initialDateTo);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function applyFilters(newPage: number = 1) {
    const params = new URLSearchParams();
    if (newPage > 1) params.set("page", String(newPage));
    if (direction !== "all") params.set("direction", direction);
    if (decision !== "all") params.set("decision", decision);
    if (customer) params.set("customer", customer);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    startTransition(() => router.push(`/transactions?${params.toString()}`));
  }

  function resetFilters() {
    setDirection("all");
    setDecision("all");
    setCustomer("");
    setDateFrom("");
    setDateTo("");
    startTransition(() => router.push("/transactions"));
  }

  const decisionLabel: Record<string, string> = {
    clear: t("txDecisionClear"),
    review: t("txDecisionReview"),
    blocked: t("txDecisionBlocked"),
  };

  const deviceActionLabel: Record<DeviceAction, string> = {
    allow: t("deviceActionAllow"),
    soft_challenge: t("deviceActionSoftChallenge"),
    hard_challenge: t("deviceActionHardChallenge"),
    block: t("deviceActionBlock"),
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{t("txPageTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("txPageSubtitle")}</p>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-md border border-border bg-card p-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">{t("txFilterDirectionLabel")}</label>
          <select
            value={direction}
            onChange={(e) => setDirection(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">{t("txFilterAllOption")}</option>
            <option value="CREDIT">{t("txDirectionIn")}</option>
            <option value="DEBIT">{t("txDirectionOut")}</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">{t("txFilterDecisionLabel")}</label>
          <select
            value={decision}
            onChange={(e) => setDecision(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">{t("txFilterAllOption")}</option>
            <option value="clear">{t("txDecisionClear")}</option>
            <option value="review">{t("txDecisionReview")}</option>
            <option value="blocked">{t("txDecisionBlocked")}</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">{t("txColCustomer")}</label>
          <input
            type="text"
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            placeholder={t("txFilterCustomerPlaceholder")}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">{t("txFilterFromLabel")}</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">{t("txFilterToLabel")}</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button
          type="button"
          onClick={() => applyFilters()}
          className="rounded-md bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          {t("txFilterApply")}
        </button>
        <button
          type="button"
          onClick={resetFilters}
          className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          {t("txFilterReset")}
        </button>
      </div>

      {result.data.length === 0 ? (
        <p className="rounded-md border border-border p-6 text-center text-sm text-muted-foreground">{t("txEmpty")}</p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="w-8 px-4 py-2.5" />
                <th className="px-4 py-2.5 font-medium">{t("txColDate")}</th>
                <th className="px-4 py-2.5 font-medium">{t("txColExternalId")}</th>
                <th className="px-4 py-2.5 font-medium">{t("txColCustomer")}</th>
                <th className="px-4 py-2.5 font-medium">{t("txColCounterparty")}</th>
                <th className="px-4 py-2.5 font-medium">{t("txColDirection")}</th>
                <th className="px-4 py-2.5 font-medium">{t("txColAmount")}</th>
                <th className="px-4 py-2.5 font-medium">{t("txColType")}</th>
                <th className="px-4 py-2.5 font-medium">{t("txColCash")}</th>
                <th className="px-4 py-2.5 font-medium">{t("txColDecision")}</th>
                <th className="px-4 py-2.5 font-medium">{t("txColRisk")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {result.data.map((tx) => {
                const expanded = expandedId === tx.id;
                const hasDeviceSignal = tx.deviceAction != null || tx.deviceRiskScore != null || tx.deviceAttributes != null || tx.ipCountry != null;
                return (
                  <Fragment key={tx.id}>
                    <tr onClick={() => setExpandedId(expanded ? null : tx.id)} className="cursor-pointer hover:bg-muted/50">
                      <td className="px-4 py-2.5 text-muted-foreground">
                        {expanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-xs text-muted-foreground">
                        {new Date(tx.occurredAt).toLocaleString(lang === "fr" ? "fr-FR" : "en-US")}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{tx.externalTransactionId}</td>
                      <td className="px-4 py-2.5 font-mono text-xs text-foreground">{tx.externalCustomerId}</td>
                      <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">{tx.counterpartyExternalId ?? "—"}</td>
                      <td className="px-4 py-2.5">
                        <span className="inline-flex items-center gap-1 text-xs text-foreground">
                          {tx.direction === "CREDIT" ? (
                            <ArrowDownLeft className="size-3.5 text-primary" />
                          ) : (
                            <ArrowUpRight className="size-3.5 text-muted-foreground" />
                          )}
                          {tx.direction === "CREDIT" ? t("txDirectionIn") : t("txDirectionOut")}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 font-medium text-foreground">
                        {Number(tx.amount).toLocaleString(lang === "fr" ? "fr-FR" : "en-US")} {tx.currency}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">{tx.transactionType}</td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">{tx.isCash ? t("txCashYes") : t("txCashNo")}</td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-xs font-medium">{decisionLabel[tx.decision]}</td>
                      <td className={`px-4 py-2.5 text-xs font-semibold ${riskColor(tx.riskScore)}`}>{tx.riskScore}</td>
                    </tr>
                    {expanded ? (
                      <tr className="bg-muted/30">
                        <td colSpan={11} className="px-4 py-4">
                          <div className="flex flex-col gap-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              {t("deviceSignalDetailSectionTitle")}
                            </p>
                            {hasDeviceSignal ? (
                              <div className="flex flex-col gap-3">
                                <div className="flex flex-wrap items-center gap-2">
                                  {tx.deviceAction ? (
                                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${DEVICE_ACTION_COLOR[tx.deviceAction]}`}>
                                      {deviceActionLabel[tx.deviceAction]}
                                    </span>
                                  ) : null}
                                  {tx.deviceRiskScore != null ? (
                                    <span className={`text-xs font-semibold ${riskColor(tx.deviceRiskScore)}`}>
                                      {t("deviceSignalsColRiskScore")}: {tx.deviceRiskScore}
                                    </span>
                                  ) : null}
                                </div>
                                {tx.deviceReasons && tx.deviceReasons.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {tx.deviceReasons.map((reason) => (
                                      <span key={reason} className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                        {reason}
                                      </span>
                                    ))}
                                  </div>
                                ) : null}
                                <DeviceAttributesDetails attributes={tx.deviceAttributes} ipCountry={tx.ipCountry} ipHash={tx.ipHash} />
                              </div>
                            ) : (
                              <p className="text-xs text-muted-foreground">{t("deviceSignalsNoEnrichedData")}</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} totalPages={result.totalPages} total={result.total} onPageChange={applyFilters} />
    </div>
  );
}
