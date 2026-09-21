"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Briefcase } from "lucide-react";
import { useSessionGuard } from "@/components/SessionExpiredProvider";
import { useLang } from "@/lib/i18n/LangProvider";
import { updateAlertStatus, type AlertStatus, type AlertWithContext } from "./actions";
import type { PaginatedResult } from "../transactions/actions";

function isError(value: unknown): value is { error: string } {
  return Boolean(value) && typeof value === "object" && "error" in (value as object);
}

const STATUS_COLOR: Record<AlertStatus, string> = {
  open: "bg-amber-500/15 text-amber-600",
  confirmed: "bg-destructive/15 text-destructive",
  more_info_requested: "bg-blue-500/15 text-blue-600",
  dismissed: "bg-muted text-muted-foreground",
};

export function AlertsClient({
  result,
  page,
  initialStatus,
}: {
  result: PaginatedResult<AlertWithContext>;
  page: number;
  initialStatus: string;
}) {
  const router = useRouter();
  const guard = useSessionGuard();
  const { t, lang } = useLang();
  const [, startTransition] = useTransition();
  const [status, setStatus] = useState(initialStatus);
  const [alerts, setAlerts] = useState(result.data);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const statusLabel: Record<AlertStatus, string> = {
    open: t("alertsStatusOpen"),
    confirmed: t("alertsStatusConfirmed"),
    more_info_requested: t("alertsStatusMoreInfo"),
    dismissed: t("alertsStatusDismissed"),
  };

  function applyStatusFilter(next: string) {
    setStatus(next);
    const params = new URLSearchParams();
    if (next !== "all") params.set("status", next);
    startTransition(() => router.push(`/alerts?${params.toString()}`));
  }

  async function handleUpdate(id: string, next: AlertStatus) {
    setUpdatingId(id);
    setError(null);
    try {
      const updated = await guard(() => updateAlertStatus(id, next));
      if (updated === null) return;
      if (isError(updated)) {
        setError(updated.error);
        return;
      }
      setAlerts((prev) => prev.map((a) => (a.id === id ? updated : a)));
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">{t("alertsPageTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("alertsPageSubtitle")}</p>
      </div>

      <div className="flex items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">{t("alertsFilterStatusLabel")}</label>
          <select
            value={status}
            onChange={(e) => applyStatusFilter(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">{t("txFilterAllOption")}</option>
            <option value="open">{t("alertsStatusOpen")}</option>
            <option value="more_info_requested">{t("alertsStatusMoreInfo")}</option>
            <option value="confirmed">{t("alertsStatusConfirmed")}</option>
            <option value="dismissed">{t("alertsStatusDismissed")}</option>
          </select>
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {alerts.length === 0 ? (
        <p className="rounded-md border border-border p-6 text-center text-sm text-muted-foreground">{t("alertsEmpty")}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {alerts.map((alert) => {
            const ruleName = (lang === "fr" && alert.ruleNameFr) || alert.ruleName;
            const explanation = lang === "fr" ? alert.ruleExplanationFr || alert.ruleExplanation : alert.ruleExplanation;
            const isBusy = updatingId === alert.id;

            return (
              <div key={alert.id} className="rounded-md border border-border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <button
                      type="button"
                      onClick={() => setExpandedId((prev) => (prev === alert.id ? null : alert.id))}
                      className="text-left text-sm font-semibold text-foreground hover:underline"
                    >
                      {ruleName}
                    </button>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {new Date(alert.triggeredAt).toLocaleString(lang === "fr" ? "fr-FR" : "en-US")} · {alert.externalCustomerId}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {alert.ruleCode} · {alert.ruleSeverity === "block" ? t("alertsSeverityBlock") : t("alertsSeverityReview")} · {t("alertsColTransaction")}: {alert.transactionId ?? "—"}
                    </p>
                    {alert.transaction ? (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {Number(alert.transaction.amount).toLocaleString(lang === "fr" ? "fr-FR" : "en-US")} {alert.transaction.currency} —{" "}
                        {alert.transaction.transactionType}
                      </p>
                    ) : (
                      <p className="mt-0.5 text-xs text-muted-foreground">{t("alertsNoTransaction")}</p>
                    )}
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLOR[alert.status]}`}>
                    {statusLabel[alert.status]}
                  </span>
                </div>

                {expandedId === alert.id && explanation ? (
                  <p className="mt-2 rounded-md bg-muted/50 p-2.5 text-xs text-foreground">{explanation}</p>
                ) : null}

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {alert.status === "open" || alert.status === "more_info_requested" ? (
                    <>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleUpdate(alert.id, "confirmed")}
                        className="flex items-center gap-1.5 rounded-md bg-destructive px-3 py-1.5 text-xs font-semibold text-destructive-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                      >
                        {isBusy ? <Loader2 className="size-3.5 animate-spin" /> : null}
                        {t("alertsActionConfirm")}
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleUpdate(alert.id, "dismissed")}
                        className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
                      >
                        {t("alertsActionDismiss")}
                      </button>
                      {alert.status === "open" ? (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleUpdate(alert.id, "more_info_requested")}
                          className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
                        >
                          {t("alertsActionRequestInfo")}
                        </button>
                      ) : null}
                    </>
                  ) : (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleUpdate(alert.id, "open")}
                      className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
                    >
                      {t("alertsActionReopen")}
                    </button>
                  )}
                  <Link
                    href={`/cases/new?customer=${encodeURIComponent(alert.externalCustomerId)}&alertId=${alert.id}`}
                    className={`flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted ${explanation ? "" : "ml-auto"}`}
                  >
                    <Briefcase className="size-3.5" />
                    {t("alertsOpenCase")}
                  </Link>
                  {explanation ? (
                    <button
                      type="button"
                      onClick={() => setExpandedId((prev) => (prev === alert.id ? null : alert.id))}
                      className="ml-auto text-xs font-medium text-primary hover:underline"
                    >
                      {t("alertsViewRuleDetails")}
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {result.totalPages > 1 ? (
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              const params = new URLSearchParams();
              if (status !== "all") params.set("status", status);
              params.set("page", String(page - 1));
              startTransition(() => router.push(`/alerts?${params.toString()}`));
            }}
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
            onClick={() => {
              const params = new URLSearchParams();
              if (status !== "all") params.set("status", status);
              params.set("page", String(page + 1));
              startTransition(() => router.push(`/alerts?${params.toString()}`));
            }}
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
