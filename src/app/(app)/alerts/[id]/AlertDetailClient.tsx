"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Briefcase, CalendarClock, CircleCheck, CircleX, Loader2, MessageCircleQuestion, RotateCcw, Zap } from "lucide-react";
import { ConfirmActionDialog } from "@/components/ConfirmActionDialog";
import { useSessionGuard } from "@/components/SessionExpiredProvider";
import { useLang } from "@/lib/i18n/LangProvider";
import { DeviceAttributesDetails } from "@/components/DeviceAttributesSummary";
import {
  updateAlert,
  updateAlertStatus,
  convertAlertToCaseAction,
  type AlertDecisionVerdict,
  type AlertDisposition,
  type AlertRuleHistory,
  type AlertStatus,
  type AlertWithContext,
} from "../actions";
import type { MonitoringTransaction } from "../../transactions/actions";
import type { TeamMember } from "../../team/actions";
import type { StringKey } from "@/lib/i18n/strings";
import { PageGuideButton, type PageGuideContent } from "@/components/PageGuideButton";

const ALERT_DETAIL_GUIDE: Record<"en" | "fr", PageGuideContent> = {
  fr: {
    title: "Détail de l'alerte",
    explanation:
      "Toutes les informations disponibles sur cette alerte sont ici : la règle qui l'a déclenchée, les valeurs exactes qui ont franchi le seuil, la transaction liée (avec le signal d'appareil complet), l'historique de ce client avec cette même règle, et le traitement en cours (assignation, disposition, notes).\n\nLes actions — confirmer la fraude, rejeter, demander plus d'informations, convertir en dossier ou en ouvrir un directement — sont regroupées en haut à droite.",
    diagram: [
      [{ label: "Liste des alertes", note: "vue tableau" }],
      [{ label: "Détail de l'alerte", note: "toutes les informations + actions", current: true }],
      [{ label: "Dossier", note: "si convertie / escaladée" }],
    ],
  },
  en: {
    title: "Alert detail",
    explanation:
      "Everything known about this alert lives here: the rule that fired it, the exact values that crossed the threshold, the linked transaction (with its full device signal), this customer's history with the same rule, and the current workflow state (assignment, disposition, notes).\n\nActions — confirm as fraud, dismiss, request more info, convert to a case, or open one directly — are grouped in the top right.",
    diagram: [
      [{ label: "Alerts list", note: "table view" }],
      [{ label: "Alert detail", note: "all information + actions", current: true }],
      [{ label: "Case", note: "if converted / escalated" }],
    ],
  },
};

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

type PendingActionKind = AlertStatus | "convert";

const DIALOG_COPY: Record<PendingActionKind, { title: StringKey; description: StringKey; confirmLabel: StringKey }> = {
  confirmed: { title: "alertsConfirmFraudDialogTitle", description: "alertsConfirmFraudDialogDescription", confirmLabel: "alertsActionConfirm" },
  dismissed: { title: "alertsDismissDialogTitle", description: "alertsDismissDialogDescription", confirmLabel: "alertsActionDismiss" },
  more_info_requested: { title: "alertsRequestInfoDialogTitle", description: "alertsRequestInfoDialogDescription", confirmLabel: "alertsActionRequestInfo" },
  open: { title: "alertsReopenDialogTitle", description: "alertsReopenDialogDescription", confirmLabel: "alertsActionReopen" },
  convert: { title: "alertsConvertToCaseDialogTitle", description: "alertsConvertToCaseDialogDescription", confirmLabel: "alertsConvertToCase" },
};

function formatMatchedValue(v: unknown): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

export function AlertDetailClient({
  alert: initialAlert,
  history,
  transaction,
  teamMembers,
  canManage,
}: {
  alert: AlertWithContext;
  history: AlertRuleHistory;
  transaction: MonitoringTransaction | null;
  teamMembers: TeamMember[];
  canManage: boolean;
}) {
  const { t, lang } = useLang();
  const guard = useSessionGuard();
  const router = useRouter();
  const locale = lang === "fr" ? "fr-FR" : "en-US";

  const [alert, setAlert] = useState(initialAlert);
  const [pendingAction, setPendingAction] = useState<PendingActionKind | null>(null);
  const [updating, setUpdating] = useState(false);
  const [converting, setConverting] = useState(false);
  const [editingLifecycle, setEditingLifecycle] = useState(false);
  const [savingLifecycle, setSavingLifecycle] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ruleName = (lang === "fr" && alert.ruleNameFr) || alert.ruleName;
  const explanation = lang === "fr" ? alert.ruleExplanationFr || alert.ruleExplanation : alert.ruleExplanation;
  const assignee = teamMembers.find((member) => member.id === alert.assignedToUserId);
  const resolver = alert.resolvedByUserId ? teamMembers.find((member) => member.id === alert.resolvedByUserId) : null;

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

  function inputDateValue(value: string | null) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  }

  async function handleUpdate(next: AlertStatus) {
    setUpdating(true);
    setError(null);
    try {
      const updated = await guard(() => updateAlertStatus(alert.id, next));
      if (updated === null) return;
      if (isError(updated)) {
        setError(updated.error);
        toast.error(updated.error);
        return;
      }
      setAlert(updated);
      toast.success(t(UPDATE_TOAST_KEY[next]));
      setPendingAction(null);
      router.refresh();
    } finally {
      setUpdating(false);
    }
  }

  async function handleLifecycleUpdate(form: HTMLFormElement) {
    const data = new FormData(form);
    setSavingLifecycle(true);
    setError(null);
    try {
      const updated = await guard(() =>
        updateAlert(alert.id, {
          assignedToUserId: String(data.get("assignedToUserId") || "") || null,
          disposition: (String(data.get("disposition") || "") || null) as AlertDisposition | null,
          investigationNotes: String(data.get("investigationNotes") || "") || null,
          dueAt: String(data.get("dueAt") || "") ? new Date(String(data.get("dueAt"))).toISOString() : null,
        }),
      );
      if (updated === null) return;
      if (isError(updated)) {
        setError(updated.error);
        toast.error(updated.error);
        return;
      }
      setAlert(updated);
      setEditingLifecycle(false);
      toast.success(t("alertLifecycleSavedToast"));
      router.refresh();
    } finally {
      setSavingLifecycle(false);
    }
  }

  async function handleConvertToCase() {
    setConverting(true);
    setError(null);
    try {
      const result = await guard(() => convertAlertToCaseAction(alert.id));
      if (result === null) return;
      if (isError(result)) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      setAlert(result.alert);
      toast.success(t("alertConvertedToCaseToast"));
      setPendingAction(null);
      router.push(`/cases/${result.case.id}`);
    } finally {
      setConverting(false);
    }
  }

  async function handleConfirmPendingAction() {
    if (!pendingAction) return;
    if (pendingAction === "convert") await handleConvertToCase();
    else await handleUpdate(pendingAction);
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <Link href="/alerts" className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
          {t("alertsDetailBackToList")}
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-xs font-semibold text-muted-foreground">#{alert.alertNumber}</span>
              <h1 className="text-lg font-semibold text-foreground">{ruleName}</h1>
              <PageGuideButton content={ALERT_DETAIL_GUIDE[lang]} />
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {new Date(alert.triggeredAt).toLocaleString(locale)} · {alert.ruleCode}
              {alert.ruleNumber ? ` (${t("alertsColRuleNumberShort")}${alert.ruleNumber})` : ""} · {alert.externalCustomerId}
            </p>
          </div>
          {canManage ? (
            <div className="flex flex-wrap items-center gap-2">
              {alert.status === "open" || alert.status === "more_info_requested" ? (
                <>
                  <button
                    type="button"
                    disabled={updating}
                    onClick={() => setPendingAction("confirmed")}
                    className="flex items-center gap-1.5 rounded-md bg-destructive px-3 py-1.5 text-sm font-semibold text-destructive-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    <CircleCheck className="size-4" />
                    {t("alertsActionConfirm")}
                  </button>
                  <button
                    type="button"
                    disabled={updating}
                    onClick={() => setPendingAction("dismissed")}
                    className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
                  >
                    <CircleX className="size-4" />
                    {t("alertsActionDismiss")}
                  </button>
                  {alert.status === "open" ? (
                    <button
                      type="button"
                      disabled={updating}
                      onClick={() => setPendingAction("more_info_requested")}
                      className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
                    >
                      <MessageCircleQuestion className="size-4" />
                      {t("alertsActionRequestInfo")}
                    </button>
                  ) : null}
                </>
              ) : (
                <button
                  type="button"
                  disabled={updating}
                  onClick={() => setPendingAction("open")}
                  className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
                >
                  <RotateCcw className="size-4" />
                  {t("alertsActionReopen")}
                </button>
              )}
              <button
                type="button"
                disabled={converting}
                onClick={() => setPendingAction("convert")}
                className="flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/5 px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10 disabled:opacity-50"
              >
                {converting ? <Loader2 className="size-4 animate-spin" /> : <Zap className="size-4" />}
                {t("alertsConvertToCase")}
              </button>
              <Link
                href={`/cases/new?customer=${encodeURIComponent(alert.externalCustomerId)}&alertId=${alert.id}`}
                className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                <Briefcase className="size-4" />
                {t("alertsOpenCase")}
              </Link>
            </div>
          ) : null}
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="rounded-md border border-border bg-card p-4">
        <p className="mb-3 text-sm font-semibold text-foreground">{t("alertsDetailOverviewTitle")}</p>
        <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">{t("alertsDetailRuleCode")}</p>
            <p className="font-mono text-xs font-medium text-foreground">{alert.ruleCode}</p>
          </div>
          {alert.ruleNumber ? (
            <div>
              <p className="text-xs text-muted-foreground">{t("alertsDetailRuleNumber")}</p>
              <p className="font-mono text-xs font-medium text-foreground">#{alert.ruleNumber}</p>
            </div>
          ) : null}
          <div>
            <p className="text-xs text-muted-foreground">{t("alertsDetailSeverity")}</p>
            <p className="font-medium text-foreground">{alert.ruleSeverity === "block" ? t("alertsSeverityBlock") : t("alertsSeverityReview")}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("alertsDetailVerdict")}</p>
            {alert.decisionVerdict ? (
              <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${DECISION_VERDICT_CONFIG[alert.decisionVerdict].color}`}>
                {t(DECISION_VERDICT_CONFIG[alert.decisionVerdict].key)}
              </span>
            ) : (
              <p className="text-muted-foreground">—</p>
            )}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("alertsColStatus")}</p>
            <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLOR[alert.status]}`}>{statusLabel[alert.status]}</span>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("alertsDetailCustomer")}</p>
            <p className="font-mono text-xs font-medium text-foreground">{alert.externalCustomerId}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("alertsDetailTriggeredAt")}</p>
            <p className="font-medium text-foreground">{new Date(alert.triggeredAt).toLocaleString(locale)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("alertsDetailCreatedAt")}</p>
            <p className="font-medium text-foreground">{new Date(alert.createdAt).toLocaleString(locale)}</p>
          </div>
          {alert.resolvedAt ? (
            <div>
              <p className="text-xs text-muted-foreground">{t("alertsDetailResolvedAt")}</p>
              <p className="font-medium text-foreground">{new Date(alert.resolvedAt).toLocaleString(locale)}</p>
            </div>
          ) : null}
          {resolver ? (
            <div>
              <p className="text-xs text-muted-foreground">{t("alertsDetailResolvedBy")}</p>
              <p className="font-medium text-foreground">{resolver.firstName} {resolver.lastName}</p>
            </div>
          ) : null}
        </div>
        {explanation ? <p className="mt-3 rounded-md bg-muted/50 p-2.5 text-xs text-foreground">{explanation}</p> : null}
      </div>

      {alert.matchedValues && Object.keys(alert.matchedValues).length > 0 ? (
        <div className="rounded-md border border-border bg-card p-4">
          <p className="mb-3 text-sm font-semibold text-foreground">{t("alertsDetailMatchedValuesTitle")}</p>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 rounded-md border border-border bg-muted/20 p-2.5 text-xs sm:grid-cols-3">
            {Object.entries(alert.matchedValues).map(([key, value]) => (
              <div key={key} className="flex flex-col">
                <dt className="text-[10px] uppercase text-muted-foreground">{key}</dt>
                <dd className="truncate text-foreground" title={formatMatchedValue(value)}>{formatMatchedValue(value)}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}

      <div className="rounded-md border border-border bg-card p-4">
        <p className="mb-3 text-sm font-semibold text-foreground">{t("alertsDetailHistoryTitle")}</p>
        {history.count <= 1 ? (
          <p className="text-xs text-muted-foreground">{t("alertsDetailHistoryNone")}</p>
        ) : (
          <>
            <p className="text-sm text-foreground">{t("alertsDetailHistoryCount").replace("{count}", String(history.count))}</p>
            <div className="mt-2 flex flex-col gap-1.5">
              {history.alerts
                .filter((item) => item.id !== alert.id)
                .slice(0, 10)
                .map((item) => (
                  <Link
                    key={item.id}
                    href={`/alerts/${item.id}`}
                    className="flex items-center justify-between gap-2 rounded-md border border-border px-2.5 py-1.5 text-xs transition-colors hover:bg-muted"
                  >
                    <span className="text-foreground">{new Date(item.triggeredAt).toLocaleString(locale)}</span>
                    <span className={`rounded-full px-2 py-0.5 font-semibold ${STATUS_COLOR[item.status]}`}>{statusLabel[item.status]}</span>
                  </Link>
                ))}
            </div>
          </>
        )}
        <p className="mt-2 text-[11px] text-muted-foreground">{t("alertsDetailHistoryScopeNote")}</p>
      </div>

      <div className="rounded-md border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-foreground">{t("alertsDetailTransactionTitle")}</p>
          {transaction ? (
            <Link href={`/transactions/${transaction.id}`} className="text-xs font-medium text-primary hover:underline">
              {t("alertsDetailViewTransaction")}
            </Link>
          ) : null}
        </div>
        {transaction ? (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">{t("txColAmount")}</p>
                <p className="font-medium text-foreground">{Number(transaction.amount).toLocaleString(locale)} {transaction.currency}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("txColType")}</p>
                <p className="font-medium text-foreground">{transaction.transactionType}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t("txColDecision")}</p>
                <p className="font-medium text-foreground">{transaction.decision}</p>
              </div>
            </div>
            <DeviceAttributesDetails
              attributes={transaction.deviceAttributes}
              ipCountry={transaction.ipCountry}
              ipLatitude={transaction.ipLatitude}
              ipLongitude={transaction.ipLongitude}
              ipHash={transaction.ipHash}
              ip={transaction.ip}
              phoneNumber={transaction.devicePhoneNumber}
            />
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">{t("alertsDetailNoTransaction")}</p>
        )}
      </div>

      <div className="rounded-md border border-border bg-card p-4">
        <p className="mb-3 text-sm font-semibold text-foreground">{t("alertsDetailLifecycleTitle")}</p>
        <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-4">
          <span>{t("alertsAssignedTo")}: <strong className="font-medium text-foreground">{assignee ? `${assignee.firstName} ${assignee.lastName}` : t("alertsUnassigned")}</strong></span>
          <span>{t("alertsDisposition")}: <strong className="font-medium text-foreground">{alert.disposition ? dispositionLabel[alert.disposition] : "—"}</strong></span>
          <span>{t("alertsDueAt")}: <strong className="font-medium text-foreground">{alert.dueAt ? new Date(alert.dueAt).toLocaleString(locale) : "—"}</strong></span>
          <span>{t("alertsResolvedAt")}: <strong className="font-medium text-foreground">{alert.resolvedAt ? new Date(alert.resolvedAt).toLocaleString(locale) : "—"}</strong></span>
        </div>
        {alert.investigationNotes ? <p className="mt-2 whitespace-pre-wrap text-xs text-foreground">{alert.investigationNotes}</p> : null}
        {canManage ? (
          editingLifecycle ? (
            <form
              className="mt-3 grid gap-3 sm:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                void handleLifecycleUpdate(event.currentTarget);
              }}
            >
              <label className="flex flex-col gap-1 text-xs font-medium text-foreground">
                {t("alertsAssignedTo")}
                <select name="assignedToUserId" defaultValue={alert.assignedToUserId ?? ""} className="rounded-md border border-border bg-background px-2.5 py-1.5 text-sm font-normal outline-none focus:ring-2 focus:ring-ring">
                  <option value="">{t("alertsUnassigned")}</option>
                  {teamMembers.filter((member) => member.isActive).map((member) => (
                    <option key={member.id} value={member.id}>{member.firstName} {member.lastName}</option>
                  ))}
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
                <button type="button" onClick={() => setEditingLifecycle(false)} className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted">{t("commonCancel")}</button>
                <button type="submit" disabled={savingLifecycle} className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">
                  {savingLifecycle ? <Loader2 className="size-3.5 animate-spin" /> : null}{t("alertsSaveLifecycle")}
                </button>
              </div>
            </form>
          ) : (
            <button type="button" onClick={() => setEditingLifecycle(true)} className="mt-2 flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
              <CalendarClock className="size-3.5" />{t("alertsEditLifecycle")}
            </button>
          )
        ) : null}
      </div>

      <ConfirmActionDialog
        open={pendingAction !== null}
        onClose={() => setPendingAction(null)}
        onConfirm={handleConfirmPendingAction}
        title={pendingAction ? t(DIALOG_COPY[pendingAction].title) : ""}
        description={pendingAction ? t(DIALOG_COPY[pendingAction].description) : undefined}
        confirmLabel={pendingAction ? t(DIALOG_COPY[pendingAction].confirmLabel) : ""}
        pending={pendingAction ? (pendingAction === "convert" ? converting : updating) : false}
      />
    </div>
  );
}
