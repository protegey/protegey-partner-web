"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, Briefcase, CalendarClock, Zap } from "lucide-react";
import { useSessionGuard } from "@/components/SessionExpiredProvider";
import { useLang } from "@/lib/i18n/LangProvider";
import { Pagination } from "@/components/Pagination";
import {
  updateAlert,
  updateAlertStatus,
  convertAlertToCaseAction,
  type AlertDecisionVerdict,
  type AlertDisposition,
  type AlertStatus,
  type AlertWithContext,
} from "./actions";
import type { StringKey } from "@/lib/i18n/strings";
import type { TeamMember } from "../team/actions";
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

const DECISION_VERDICT_CONFIG: Record<AlertDecisionVerdict, { key: StringKey; color: string }> = {
  BLOCK: { key: "alertsVerdictBlock", color: "bg-destructive/15 text-destructive" },
  ESCALATE: { key: "alertsVerdictEscalate", color: "bg-orange-500/15 text-orange-600" },
  STEP_UP: { key: "alertsVerdictStepUp", color: "bg-amber-500/15 text-amber-600" },
  ALERT: { key: "alertsVerdictAlert", color: "bg-blue-500/15 text-blue-600" },
};

const UPDATE_TOAST_KEY: Record<AlertStatus, StringKey> = {
  open: "alertReopenedToast",
  confirmed: "alertConfirmedToast",
  more_info_requested: "alertMoreInfoRequestedToast",
  dismissed: "alertDismissedToast",
};

export function AlertsClient({
  result,
  page,
  initialStatus,
  teamMembers,
}: {
  result: PaginatedResult<AlertWithContext>;
  page: number;
  initialStatus: string;
  teamMembers: TeamMember[];
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [savingLifecycleId, setSavingLifecycleId] = useState<string | null>(null);
  const [convertingId, setConvertingId] = useState<string | null>(null);

  const dispositionLabel: Record<AlertDisposition, string> = {
    confirmed_fraud: t("alertsDispositionConfirmedFraud"),
    false_positive: t("alertsDispositionFalsePositive"),
    no_action: t("alertsDispositionNoAction"),
    sar_filed: t("alertsDispositionSarFiled"),
    escalated: t("alertsDispositionEscalated"),
  };

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
        toast.error(updated.error);
        return;
      }
      setAlerts((prev) => prev.map((a) => (a.id === id ? updated : a)));
      toast.success(t(UPDATE_TOAST_KEY[next]));
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleLifecycleUpdate(id: string, form: HTMLFormElement) {
    const data = new FormData(form);
    setSavingLifecycleId(id);
    setError(null);
    try {
      const updated = await guard(() => updateAlert(id, {
        assignedToUserId: String(data.get("assignedToUserId") || "") || null,
        disposition: (String(data.get("disposition") || "") || null) as AlertDisposition | null,
        investigationNotes: String(data.get("investigationNotes") || "") || null,
        dueAt: String(data.get("dueAt") || "") ? new Date(String(data.get("dueAt"))).toISOString() : null,
      }));
      if (updated === null) return;
      if (isError(updated)) {
        setError(updated.error);
        toast.error(updated.error);
        return;
      }
      setAlerts((prev) => prev.map((a) => (a.id === id ? updated : a)));
      setEditingId(null);
      toast.success(t("alertLifecycleSavedToast"));
    } finally {
      setSavingLifecycleId(null);
    }
  }

  async function handleConvertToCase(id: string) {
    setConvertingId(id);
    setError(null);
    try {
      const result = await guard(() => convertAlertToCaseAction(id));
      if (result === null) return;
      if (isError(result)) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      setAlerts((prev) => prev.map((a) => (a.id === id ? result.alert : a)));
      toast.success(t("alertConvertedToCaseToast"));
      router.push(`/cases/${result.case.id}`);
    } finally {
      setConvertingId(null);
    }
  }

  function inputDateValue(value: string | null) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  }

  return (
    <div className="flex w-full flex-col gap-6">
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
            const isSavingLifecycle = savingLifecycleId === alert.id;
            const assignee = teamMembers.find((member) => member.id === alert.assignedToUserId);

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
                  <div className="flex shrink-0 items-center gap-2">
                    {alert.decisionVerdict ? (
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${DECISION_VERDICT_CONFIG[alert.decisionVerdict].color}`}>
                        {t(DECISION_VERDICT_CONFIG[alert.decisionVerdict].key)}
                      </span>
                    ) : null}
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLOR[alert.status]}`}>
                      {statusLabel[alert.status]}
                    </span>
                  </div>
                </div>

                {expandedId === alert.id && explanation ? (
                  <p className="mt-2 rounded-md bg-muted/50 p-2.5 text-xs text-foreground">{explanation}</p>
                ) : null}

                <div className="mt-3 rounded-md border border-border bg-muted/20 p-3">
                  <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-4">
                    <span>{t("alertsAssignedTo")}: <strong className="font-medium text-foreground">{assignee ? `${assignee.firstName} ${assignee.lastName}` : t("alertsUnassigned")}</strong></span>
                    <span>{t("alertsDisposition")}: <strong className="font-medium text-foreground">{alert.disposition ? dispositionLabel[alert.disposition] : "—"}</strong></span>
                    <span>{t("alertsDueAt")}: <strong className="font-medium text-foreground">{alert.dueAt ? new Date(alert.dueAt).toLocaleString(lang === "fr" ? "fr-FR" : "en-US") : "—"}</strong></span>
                    <span>{t("alertsResolvedAt")}: <strong className="font-medium text-foreground">{alert.resolvedAt ? new Date(alert.resolvedAt).toLocaleString(lang === "fr" ? "fr-FR" : "en-US") : "—"}</strong></span>
                  </div>
                  {alert.investigationNotes ? <p className="mt-2 whitespace-pre-wrap text-xs text-foreground">{alert.investigationNotes}</p> : null}
                  {editingId === alert.id ? (
                    <form className="mt-3 grid gap-3 sm:grid-cols-2" onSubmit={(event) => { event.preventDefault(); void handleLifecycleUpdate(alert.id, event.currentTarget); }}>
                      <label className="flex flex-col gap-1 text-xs font-medium text-foreground">
                        {t("alertsAssignedTo")}
                        <select name="assignedToUserId" defaultValue={alert.assignedToUserId ?? ""} className="rounded-md border border-border bg-background px-2.5 py-1.5 text-sm font-normal outline-none focus:ring-2 focus:ring-ring">
                          <option value="">{t("alertsUnassigned")}</option>
                          {teamMembers.filter((member) => member.isActive).map((member) => <option key={member.id} value={member.id}>{member.firstName} {member.lastName}</option>)}
                        </select>
                      </label>
                      <label className="flex flex-col gap-1 text-xs font-medium text-foreground">
                        {t("alertsDisposition")}
                        <select name="disposition" defaultValue={alert.disposition ?? ""} className="rounded-md border border-border bg-background px-2.5 py-1.5 text-sm font-normal outline-none focus:ring-2 focus:ring-ring">
                          <option value="">{t("alertsNoDisposition")}</option>
                          {Object.entries(dispositionLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                        </select>
                      </label>
                      <label className="flex flex-col gap-1 text-xs font-medium text-foreground sm:col-span-2">
                        {t("alertsInvestigationNotes")}
                        <textarea name="investigationNotes" defaultValue={alert.investigationNotes ?? ""} placeholder={t("alertsInvestigationNotesPlaceholder")} rows={3} className="rounded-md border border-border bg-background px-2.5 py-1.5 text-sm font-normal outline-none focus:ring-2 focus:ring-ring" />
                      </label>
                      <label className="flex flex-col gap-1 text-xs font-medium text-foreground">
                        {t("alertsDueAt")}
                        <input type="datetime-local" name="dueAt" defaultValue={inputDateValue(alert.dueAt)} className="rounded-md border border-border bg-background px-2.5 py-1.5 text-sm font-normal outline-none focus:ring-2 focus:ring-ring" />
                      </label>
                      <div className="flex items-end justify-end gap-2">
                        <button type="button" onClick={() => setEditingId(null)} className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted">{t("commonCancel")}</button>
                        <button type="submit" disabled={isSavingLifecycle} className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">
                          {isSavingLifecycle ? <Loader2 className="size-3.5 animate-spin" /> : null}{t("alertsSaveLifecycle")}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button type="button" onClick={() => setEditingId(alert.id)} className="mt-2 flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
                      <CalendarClock className="size-3.5" />{t("alertsEditLifecycle")}
                    </button>
                  )}
                </div>

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
                  <button
                    type="button"
                    disabled={convertingId === alert.id}
                    title={t("alertsConvertToCaseHint")}
                    onClick={() => handleConvertToCase(alert.id)}
                    className="flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/10 disabled:opacity-50"
                  >
                    {convertingId === alert.id ? <Loader2 className="size-3.5 animate-spin" /> : <Zap className="size-3.5" />}
                    {t("alertsConvertToCase")}
                  </button>
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

      <Pagination
        page={page}
        totalPages={result.totalPages}
        total={result.total}
        onPageChange={(nextPage) => {
          const params = new URLSearchParams();
          if (status !== "all") params.set("status", status);
          params.set("page", String(nextPage));
          startTransition(() => router.push(`/alerts?${params.toString()}`));
        }}
      />
    </div>
  );
}
