"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, ArrowDownLeft, ArrowUpRight, Briefcase, UserPlus, CircleCheck, CircleX, Flag, Loader2 } from "lucide-react";
import { useSessionGuard } from "@/components/SessionExpiredProvider";
import { ConfirmActionDialog } from "@/components/ConfirmActionDialog";
import { Dialog } from "@/components/Dialog";
import { DeviceAttributesDetails } from "@/components/DeviceAttributesSummary";
import { useLang } from "@/lib/i18n/LangProvider";
import type { MonitoringTransaction, DeviceAction } from "../actions";
import { openCaseForTransactionAction } from "../actions";
import { updateAlert, flagTransactionAction, type AlertRuleHistory, type AlertWithContext } from "../../alerts/actions";
import type { TeamMember } from "../../team/actions";
import { PageGuideButton, type PageGuideContent } from "@/components/PageGuideButton";

const TRANSACTION_DETAIL_GUIDE: Record<"en" | "fr", PageGuideContent> = {
  fr: {
    title: "Transaction",
    explanation:
      "Tu regardes une transaction précise : son montant, son sens (débit/crédit), sa décision (effacée / à revoir / bloquée), son score de risque, et les informations de l'appareil qui l'a initiée (empreinte, pays IP, recommandation).\n\nSi une règle a déclenché une Alerte sur cette transaction, quatre actions sont possibles ici et agissent toutes sur cette alerte liée : Assigner (à un membre de l'équipe), Approuver (confirme que c'était bien une fraude), Refuser (faux positif, rien à signaler), ou Signaler (« Flag ») — qui ouvre une alerte manuellement même si aucune règle ne s'est déclenchée.\n\nC'est le point d'entrée pour agir concrètement sur un paiement suspect, au lieu de rester dans la liste.",
    diagram: [
      [{ label: "Règles + signal d'appareil", note: "au moment de la transaction" }],
      [{ label: "Transaction", note: "décision + score, vue détaillée", current: true }],
      [{ label: "Alerte liée", note: "assigner / approuver / refuser / signaler" }],
    ],
  },
  en: {
    title: "Transaction",
    explanation:
      "You're looking at one specific transaction: its amount, direction (debit/credit), decision (clear / review / blocked), risk score, and the device that initiated it (fingerprint, IP country, recommendation).\n\nIf a rule triggered an Alert on this transaction, four actions are available here and all act on that linked alert: Assign (to a team member), Approve (confirms it really was fraud), Decline (false positive, nothing to flag), or Flag — which manually opens an alert even if no rule fired.\n\nThis is the entry point to actually act on a suspicious payment, instead of staying in the list.",
    diagram: [
      [{ label: "Rules + device signal", note: "at transaction time" }],
      [{ label: "Transaction", note: "decision + score, detail view", current: true }],
      [{ label: "Linked alert", note: "assign / approve / decline / flag" }],
    ],
  },
};

function isError(value: unknown): value is { error: string } {
  return Boolean(value) && typeof value === "object" && "error" in (value as object);
}

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

const ALERT_STATUS_COLOR: Record<string, string> = {
  open: "bg-amber-500/15 text-amber-600",
  confirmed: "bg-destructive/15 text-destructive",
  more_info_requested: "bg-blue-500/15 text-blue-600",
  dismissed: "bg-muted text-muted-foreground",
};

const DEVICE_ACTION_LABEL_KEY: Record<DeviceAction, "deviceActionAllow" | "deviceActionSoftChallenge" | "deviceActionHardChallenge" | "deviceActionBlock"> = {
  allow: "deviceActionAllow",
  soft_challenge: "deviceActionSoftChallenge",
  hard_challenge: "deviceActionHardChallenge",
  block: "deviceActionBlock",
};

const ALERT_STATUS_LABEL_KEY: Record<string, "alertsStatusOpen" | "alertsStatusConfirmed" | "alertsStatusMoreInfo" | "alertsStatusDismissed"> = {
  open: "alertsStatusOpen",
  confirmed: "alertsStatusConfirmed",
  more_info_requested: "alertsStatusMoreInfo",
  dismissed: "alertsStatusDismissed",
};

type PendingAction = "approve" | "decline" | "flag" | null;

export function TransactionDetailClient({
  transaction,
  initialAlerts,
  ruleHistory,
  teamMembers,
  canManage,
  canOpenCase,
}: {
  transaction: MonitoringTransaction;
  initialAlerts: AlertWithContext[];
  ruleHistory: AlertRuleHistory | null;
  teamMembers: TeamMember[];
  canManage: boolean;
  canOpenCase: boolean;
}) {
  const { t, lang } = useLang();
  const guard = useSessionGuard();
  const router = useRouter();
  const locale = lang === "fr" ? "fr-FR" : "en-US";

  const [alerts, setAlerts] = useState(initialAlerts);
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignee, setAssignee] = useState("");
  const [pending, setPending] = useState(false);
  const [openingCase, setOpeningCase] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const alert = alerts[0] ?? null;
  const hasDeviceSignal = transaction.deviceAction != null || transaction.deviceRiskScore != null || transaction.deviceAttributes != null || transaction.ipCountry != null || transaction.ip != null || transaction.devicePhoneNumber != null;

  const decisionLabel: Record<string, string> = {
    clear: t("txDecisionClear"),
    review: t("txDecisionReview"),
    blocked: t("txDecisionBlocked"),
  };

  function replaceAlert(next: AlertWithContext) {
    setAlerts((current) => {
      if (current.some((item) => item.id === next.id)) return current.map((item) => (item.id === next.id ? next : item));
      return [next, ...current];
    });
  }

  async function handleFlag() {
    setPending(true);
    setError(null);
    try {
      const result = await guard(() => flagTransactionAction(transaction.id));
      if (result === null) return;
      if (isError(result)) { setError(result.error); toast.error(result.error); return; }
      replaceAlert(result);
      setPendingAction(null);
      toast.success(t("txFlaggedToast"));
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function handleDecision(status: "confirmed" | "dismissed", disposition: "confirmed_fraud" | "false_positive") {
    if (!alert) return;
    setPending(true);
    setError(null);
    try {
      const result = await guard(() => updateAlert(alert.id, { status, disposition }));
      if (result === null) return;
      if (isError(result)) { setError(result.error); toast.error(result.error); return; }
      replaceAlert(result);
      setPendingAction(null);
      toast.success(t(status === "confirmed" ? "txApprovedToast" : "txDeclinedToast"));
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function handleAssign() {
    if (!alert) return;
    setPending(true);
    setError(null);
    try {
      const result = await guard(() => updateAlert(alert.id, { assignedToUserId: assignee || null }));
      if (result === null) return;
      if (isError(result)) { setError(result.error); toast.error(result.error); return; }
      replaceAlert(result);
      setAssignOpen(false);
      toast.success(t("txAssignedToast"));
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function handleOpenCase() {
    setOpeningCase(true);
    setError(null);
    try {
      const result = await guard(() => openCaseForTransactionAction(transaction.id));
      if (result === null) return;
      if (isError(result)) { setError(result.error); toast.error(result.error); return; }
      toast.success(t("txCaseOpenedToast"));
      router.push(`/cases/${result.id}`);
    } finally {
      setOpeningCase(false);
    }
  }

  const assigneeName = alert?.assignedToUserId ? teamMembers.find((member) => member.id === alert.assignedToUserId) : null;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <Link href="/transactions" className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
          {t("txDetailBackToList")}
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-mono text-lg font-semibold text-foreground">{transaction.externalTransactionId}</h1>
              <PageGuideButton content={TRANSACTION_DETAIL_GUIDE[lang]} />
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {new Date(transaction.occurredAt).toLocaleString(locale)} · {transaction.transactionType} · {decisionLabel[transaction.decision]}
            </p>
          </div>
          {canManage || canOpenCase ? (
            <div className="flex flex-wrap items-center gap-2">
              {canManage ? (
                <>
                  <button
                    type="button"
                    onClick={() => setAssignOpen(true)}
                    disabled={!alert}
                    title={!alert ? t("txActionsNeedFlagHint") : undefined}
                    className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <UserPlus className="size-4" />
                    {t("txActionAssign")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingAction("approve")}
                    disabled={!alert}
                    title={!alert ? t("txActionsNeedFlagHint") : undefined}
                    className="flex items-center gap-1.5 rounded-md border border-emerald-500/30 px-3 py-1.5 text-sm font-medium text-emerald-600 transition-colors hover:bg-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <CircleCheck className="size-4" />
                    {t("txActionApprove")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingAction("decline")}
                    disabled={!alert}
                    title={!alert ? t("txActionsNeedFlagHint") : undefined}
                    className="flex items-center gap-1.5 rounded-md border border-destructive/30 px-3 py-1.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <CircleX className="size-4" />
                    {t("txActionDecline")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingAction("flag")}
                    className="flex items-center gap-1.5 rounded-md border border-amber-500/30 px-3 py-1.5 text-sm font-medium text-amber-600 transition-colors hover:bg-amber-500/10"
                  >
                    <Flag className="size-4" />
                    {t("txActionFlag")}
                  </button>
                </>
              ) : null}
              {canOpenCase ? (
                <button
                  type="button"
                  disabled={openingCase}
                  onClick={handleOpenCase}
                  className="flex items-center gap-1.5 rounded-md border border-primary/40 bg-primary/5 px-3 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/10 disabled:opacity-50"
                >
                  {openingCase ? <Loader2 className="size-4 animate-spin" /> : <Briefcase className="size-4" />}
                  {t("txActionOpenCase")}
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="rounded-md border border-border bg-card p-4">
        <p className="mb-3 text-sm font-semibold text-foreground">{t("txDetailRiskAssessment")}</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">{t("txColRisk")}</p>
            <p className={`text-2xl font-bold ${riskColor(transaction.riskScore)}`}>{transaction.riskScore}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("txColDecision")}</p>
            <p className="text-sm font-semibold text-foreground">{decisionLabel[transaction.decision]}</p>
          </div>
          {alert ? (
            <div>
              <p className="text-xs text-muted-foreground">{t("txDetailMatchedRule")}</p>
              <p className="text-sm font-semibold text-foreground">{lang === "fr" ? alert.ruleNameFr ?? alert.ruleName : alert.ruleName}</p>
            </div>
          ) : null}
        </div>
      </div>

      <div className="rounded-md border border-border bg-card p-4">
        <p className="mb-3 text-sm font-semibold text-foreground">{t("txDetailTransactionDetails")}</p>
        <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">{t("txColAmount")}</p>
            <p className="font-medium text-foreground">{Number(transaction.amount).toLocaleString(locale)} {transaction.currency}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("txColDirection")}</p>
            <p className="flex items-center gap-1 font-medium text-foreground">
              {transaction.direction === "CREDIT" ? <ArrowDownLeft className="size-3.5 text-primary" /> : <ArrowUpRight className="size-3.5 text-muted-foreground" />}
              {transaction.direction === "CREDIT" ? t("txDirectionIn") : t("txDirectionOut")}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("txColCustomer")}</p>
            <p className="font-mono text-xs font-medium text-foreground">{transaction.externalCustomerId}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("txColCounterparty")}</p>
            <p className="font-mono text-xs font-medium text-foreground">{transaction.counterpartyExternalId ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("txColType")}</p>
            <p className="font-medium text-foreground">{transaction.transactionType}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("txColCash")}</p>
            <p className="font-medium text-foreground">{transaction.isCash ? t("txCashYes") : t("txCashNo")}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("txColChannel")}</p>
            <p className="font-medium text-foreground">{transaction.channel ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("txColCounterpartyInstitution")}</p>
            <p className="font-mono text-xs font-medium text-foreground">{transaction.counterpartyInstitutionCode ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("txColCounterpartyCountry")}</p>
            <p className="font-medium text-foreground">{transaction.counterpartyCountry ?? "—"}</p>
          </div>
        </div>
      </div>

      <div className="rounded-md border border-border bg-card p-4">
        <p className="mb-3 text-sm font-semibold text-foreground">{t("deviceSignalDetailSectionTitle")}</p>
        {hasDeviceSignal ? (
          <div className="flex flex-col gap-3">
            {transaction.deviceAction ? (
              <span className={`inline-block w-fit rounded-full px-2 py-0.5 text-xs font-medium ${DEVICE_ACTION_COLOR[transaction.deviceAction]}`}>
                {t(DEVICE_ACTION_LABEL_KEY[transaction.deviceAction])}
              </span>
            ) : null}
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
          <p className="text-xs text-muted-foreground">{t("deviceSignalsNoEnrichedData")}</p>
        )}
      </div>

      <div className="rounded-md border border-border bg-card p-4">
        <p className="mb-3 text-sm font-semibold text-foreground">{t("txDetailLinkedAlerts")}</p>
        {alerts.length === 0 ? (
          <p className="text-xs text-muted-foreground">{t("txDetailNoAlerts")}</p>
        ) : (
          <div className="flex flex-col gap-2">
            {alerts.map((item) => {
              const itemAssignee = item.assignedToUserId ? teamMembers.find((member) => member.id === item.assignedToUserId) : null;
              return (
                <Link
                  key={item.id}
                  href={`/alerts/${item.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-3 text-sm transition-colors hover:bg-muted"
                >
                  <div>
                    <p className="font-medium text-foreground">{lang === "fr" ? item.ruleNameFr ?? item.ruleName : item.ruleName}</p>
                    <p className="text-xs text-muted-foreground">
                      {t("alertsAssignedTo")}: {itemAssignee ? `${itemAssignee.firstName} ${itemAssignee.lastName}` : t("alertsUnassigned")}
                    </p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${ALERT_STATUS_COLOR[item.status]}`}>{t(ALERT_STATUS_LABEL_KEY[item.status])}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {ruleHistory ? (
        <div className="rounded-md border border-border bg-card p-4">
          <p className="mb-3 text-sm font-semibold text-foreground">{t("txDetailRuleHistoryTitle")}</p>
          {ruleHistory.count <= 1 ? (
            <p className="text-xs text-muted-foreground">{t("txDetailRuleHistoryNone")}</p>
          ) : (
            <p className="text-sm text-foreground">{t("txDetailRuleHistoryCount").replace("{count}", String(ruleHistory.count))}</p>
          )}
          <p className="mt-2 text-[11px] text-muted-foreground">{t("alertsDetailHistoryScopeNote")}</p>
        </div>
      ) : null}

      {assignOpen ? (
        <Dialog open={assignOpen} onClose={() => setAssignOpen(false)} title={t("txActionAssign")} closeAriaLabel={t("closeDialogAria")}>
          <div className="flex flex-col gap-3">
            <select
              value={assignee}
              onChange={(event) => setAssignee(event.target.value)}
              className="rounded-md border border-border bg-background px-2.5 py-1.5 text-sm text-foreground"
            >
              <option value="">{t("alertsUnassigned")}</option>
              {teamMembers.filter((member) => member.isActive).map((member) => (
                <option key={member.id} value={member.id}>{member.firstName} {member.lastName}</option>
              ))}
            </select>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setAssignOpen(false)} className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted">{t("commonCancel")}</button>
              <button type="button" disabled={pending} onClick={handleAssign} className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50">{t("txSaveAssignment")}</button>
            </div>
          </div>
        </Dialog>
      ) : null}

      <ConfirmActionDialog
        open={pendingAction === "approve"}
        onClose={() => setPendingAction(null)}
        onConfirm={() => handleDecision("confirmed", "confirmed_fraud")}
        title={t("txConfirmApproveTitle")}
        description={t("txConfirmApproveDescription")}
        confirmLabel={t("txActionApprove")}
        pending={pending}
      />
      <ConfirmActionDialog
        open={pendingAction === "decline"}
        onClose={() => setPendingAction(null)}
        onConfirm={() => handleDecision("dismissed", "false_positive")}
        title={t("txConfirmDeclineTitle")}
        description={t("txConfirmDeclineDescription")}
        confirmLabel={t("txActionDecline")}
        pending={pending}
        variant="destructive"
      />
      <ConfirmActionDialog
        open={pendingAction === "flag"}
        onClose={() => setPendingAction(null)}
        onConfirm={handleFlag}
        title={t("txConfirmFlagTitle")}
        description={t("txConfirmFlagDescription")}
        confirmLabel={t("txActionFlag")}
        pending={pending}
      />
    </div>
  );
}
