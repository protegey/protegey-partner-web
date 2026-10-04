"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye } from "lucide-react";
import { useLang } from "@/lib/i18n/LangProvider";
import { Pagination } from "@/components/Pagination";
import type { AlertDecisionVerdict, AlertStatus, AlertWithContext } from "./actions";
import type { StringKey } from "@/lib/i18n/strings";
import type { TeamMember } from "../team/actions";
import type { PaginatedResult } from "../transactions/actions";
import { PageGuideButton, type PageGuideContent } from "@/components/PageGuideButton";

const ALERTS_GUIDE: Record<"en" | "fr", PageGuideContent> = {
  fr: {
    title: "Alertes",
    explanation:
      "Une alerte apparaît ici quand quelque chose de suspect a été détecté : une règle de transaction s'est déclenchée (Pan Studio), le moteur comportemental a vu une dérive à haute confiance combinée à un autre signal, ou un analyste a cliqué sur « Signaler » manuellement sur une transaction même sans règle déclenchée.\n\nChaque alerte porte un verdict hérité de la règle qui l'a créée — BLOCK (bloquer), STEP_UP (vérification renforcée), ESCALATE (escalader) ou ALERT (simple signal) — et un statut de traitement : ouverte, confirmée comme fraude, information demandée, ou classée sans suite.\n\nCliquez sur une ligne pour voir le détail complet de l'alerte et agir sur elle (assigner, confirmer, classer, convertir en dossier).",
    diagram: [
      [
        { label: "Règles (Pan Studio)", note: "déclenchement par transaction" },
        { label: "Moteur comportemental", note: "dérive à haute confiance + un autre signal" },
        { label: "Signalement manuel", note: "depuis une transaction" },
      ],
      [{ label: "Alertes", note: "verdict + statut de traitement", current: true }],
      [{ label: "Dossier", note: "si escaladée / confirmée" }],
    ],
    diagramCaption: "Trois sources différentes peuvent créer une alerte — cette page les traite toutes de la même façon.",
  },
  en: {
    title: "Alerts",
    explanation:
      "An alert shows up here when something suspicious was detected: a transaction rule fired (Pan Studio), the behavioral engine saw a high-confidence deviation combined with another signal, or an analyst manually clicked \"Flag\" on a transaction even without a matching rule.\n\nEvery alert carries a verdict inherited from the rule that created it — BLOCK, STEP_UP (extra verification), ESCALATE, or ALERT (a plain notice) — plus a workflow status: open, confirmed fraud, more info requested, or dismissed.\n\nClick a row to see the alert's full detail and act on it (assign, confirm, dismiss, convert to a case).",
    diagram: [
      [
        { label: "Rules (Pan Studio)", note: "fires per transaction" },
        { label: "Behavioral engine", note: "high-confidence deviation + another signal" },
        { label: "Manual flag", note: "from a transaction" },
      ],
      [{ label: "Alerts", note: "verdict + workflow status", current: true }],
      [{ label: "Case", note: "if escalated / confirmed" }],
    ],
    diagramCaption: "Three different sources can create an alert — this page handles them all the same way.",
  },
};

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

export function AlertsClient({
  result,
  page,
  initialStatus,
  initialAlertNumber,
  teamMembers,
}: {
  result: PaginatedResult<AlertWithContext>;
  page: number;
  initialStatus: string;
  initialAlertNumber: string;
  teamMembers: TeamMember[];
}) {
  const router = useRouter();
  const { t, lang } = useLang();
  const [, startTransition] = useTransition();
  const [status, setStatus] = useState(initialStatus);
  const [alertNumberInput, setAlertNumberInput] = useState(initialAlertNumber);
  const locale = lang === "fr" ? "fr-FR" : "en-US";

  const statusLabel: Record<AlertStatus, string> = {
    open: t("alertsStatusOpen"),
    confirmed: t("alertsStatusConfirmed"),
    more_info_requested: t("alertsStatusMoreInfo"),
    dismissed: t("alertsStatusDismissed"),
  };

  function pushFilters(nextStatus: string, nextAlertNumber: string) {
    const params = new URLSearchParams();
    if (nextStatus !== "all") params.set("status", nextStatus);
    if (nextAlertNumber.trim()) params.set("alertNumber", nextAlertNumber.trim());
    startTransition(() => router.push(`/alerts?${params.toString()}`));
  }

  function applyStatusFilter(next: string) {
    setStatus(next);
    pushFilters(next, alertNumberInput);
  }

  function applyAlertNumberFilter(event: FormEvent) {
    event.preventDefault();
    pushFilters(status, alertNumberInput);
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-foreground">{t("alertsPageTitle")}</h1>
          <PageGuideButton content={ALERTS_GUIDE[lang]} />
        </div>
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
        <form onSubmit={applyAlertNumberFilter} className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">{t("alertsFilterNumberLabel")}</label>
          <input
            type="number"
            min={1}
            value={alertNumberInput}
            onChange={(e) => setAlertNumberInput(e.target.value)}
            placeholder={t("alertsFilterNumberPlaceholder")}
            className="w-32 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
        </form>
      </div>

      {result.data.length === 0 ? (
        <p className="rounded-md border border-border p-6 text-center text-sm text-muted-foreground">{t("alertsEmpty")}</p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-border">
          <table className="w-full min-w-[840px] text-left text-sm">
            <thead className="bg-muted/40 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2">{t("alertsColNumber")}</th>
                <th className="px-3 py-2">{t("alertsColRule")}</th>
                <th className="px-3 py-2">{t("alertsColCustomer")}</th>
                <th className="px-3 py-2">{t("alertsColTransaction")}</th>
                <th className="px-3 py-2">{t("alertsColVerdict")}</th>
                <th className="px-3 py-2">{t("alertsColStatus")}</th>
                <th className="px-3 py-2">{t("alertsAssignedTo")}</th>
                <th className="px-3 py-2">{t("alertsColTriggeredAt")}</th>
                <th className="px-3 py-2">{t("alertsColActions")}</th>
              </tr>
            </thead>
            <tbody>
              {result.data.map((alert, idx) => {
                const ruleName = (lang === "fr" && alert.ruleNameFr) || alert.ruleName;
                const assignee = teamMembers.find((member) => member.id === alert.assignedToUserId);
                return (
                  <tr
                    key={alert.id}
                    onClick={() => router.push(`/alerts/${alert.id}`)}
                    className="animate-fade-in-up cursor-pointer border-t border-border transition-colors hover:bg-muted/40"
                    style={{ animationDelay: `${Math.min(idx, 12) * 25}ms` }}
                  >
                    <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">#{alert.alertNumber}</td>
                    <td className="px-3 py-2.5">
                      <Link href={`/alerts/${alert.id}`} onClick={(e) => e.stopPropagation()} className="font-medium text-foreground hover:underline">
                        {ruleName}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {alert.ruleCode}
                        {alert.ruleNumber ? ` · ${t("alertsColRuleNumberShort")}${alert.ruleNumber}` : ""}
                      </p>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs text-foreground">{alert.externalCustomerId}</td>
                    <td className="px-3 py-2.5 text-xs text-foreground">
                      {alert.transaction ? (
                        <>
                          {Number(alert.transaction.amount).toLocaleString(locale)} {alert.transaction.currency}
                          <p className="text-muted-foreground">{alert.transaction.transactionType}</p>
                        </>
                      ) : (
                        <span className="text-muted-foreground">{t("alertsNoTransaction")}</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      {alert.decisionVerdict ? (
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${DECISION_VERDICT_CONFIG[alert.decisionVerdict].color}`}>
                          {t(DECISION_VERDICT_CONFIG[alert.decisionVerdict].key)}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLOR[alert.status]}`}>{statusLabel[alert.status]}</span>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-foreground">{assignee ? `${assignee.firstName} ${assignee.lastName}` : t("alertsUnassigned")}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-xs text-muted-foreground">{new Date(alert.triggeredAt).toLocaleString(locale)}</td>
                    <td className="px-3 py-2.5">
                      <Link
                        href={`/alerts/${alert.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex w-fit items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                      >
                        <Eye className="size-3.5" />
                        {t("alertsViewAction")}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        page={page}
        totalPages={result.totalPages}
        total={result.total}
        onPageChange={(nextPage) => {
          const params = new URLSearchParams();
          if (status !== "all") params.set("status", status);
          if (alertNumberInput.trim()) params.set("alertNumber", alertNumberInput.trim());
          params.set("page", String(nextPage));
          startTransition(() => router.push(`/alerts?${params.toString()}`));
        }}
      />
    </div>
  );
}
