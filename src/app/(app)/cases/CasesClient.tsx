"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Briefcase, CircleCheck, Eye, FolderOpen, Plus, Search, TrendingUp } from "lucide-react";
import { useLang } from "@/lib/i18n/LangProvider";
import { Pagination } from "@/components/Pagination";
import { KpiCard } from "@/components/KpiCard";
import type { Case, CaseStats } from "./actions";
import type { PaginatedResult } from "../transactions/actions";
import { PageGuideButton, type PageGuideContent } from "@/components/PageGuideButton";

const CASES_GUIDE: Record<"en" | "fr", PageGuideContent> = {
  fr: {
    title: "Dossiers",
    explanation:
      "Un dossier regroupe tout ce qu'il faut pour enquêter en profondeur sur un client : les alertes liées, les notes de l'équipe, les pièces jointes (preuves). Il est ouvert soit à la main par un analyste, soit automatiquement quand une alerte de gravité critique est escaladée.\n\nChaque dossier a un statut de traitement (ouvert, en investigation, fermé), une priorité (critique/élevée/moyenne/faible) pour trier ce qui presse, et une fois fermé, un résultat (aucune action, faux positif, ou déclaration de soupçon déposée).\n\nUn dossier fermé n'est pas la fin : il peut ensuite servir à générer une déclaration de soupçon (SAR/STR) ou à partager les identifiants du fraudeur au réseau de signaux partagés entre partenaires.",
    diagram: [
      [
        { label: "Alerte critique", note: "escaladée automatiquement" },
        { label: "Création manuelle" },
      ],
      [{ label: "Dossiers", note: "statut + priorité", current: true }],
      [
        { label: "SAR/STR", note: "si fermé avec déclaration" },
        { label: "Réseau de signaux partagés", note: "si fermé et partagé" },
      ],
    ],
    diagramCaption: "Un dossier fermé peut déclencher deux choses en aval : une déclaration réglementaire ou un partage réseau.",
  },
  en: {
    title: "Cases",
    explanation:
      "A case bundles everything needed to investigate a customer in depth: linked alerts, the team's notes, and uploaded evidence. It's opened either by hand by an analyst, or automatically when a critical-severity alert gets escalated.\n\nEvery case has a workflow status (open, investigating, closed), a priority (critical/high/medium/low) to sort what's urgent, and once closed, an outcome (no action, false positive, or SAR filed).\n\nA closed case isn't the end of the line — it can go on to generate a suspicious activity report (SAR/STR), or have the fraudster's identifiers shared to the network other Protegey partners can check against.",
    diagram: [
      [
        { label: "Critical alert", note: "auto-escalated" },
        { label: "Manual creation" },
      ],
      [{ label: "Cases", note: "status + priority", current: true }],
      [
        { label: "SAR/STR", note: "if closed with a filing" },
        { label: "Shared Signal Network", note: "if closed and shared" },
      ],
    ],
    diagramCaption: "A closed case can trigger two downstream things: a regulatory filing or a network share.",
  },
};

const STATUS_COLOR: Record<string, string> = {
  open: "bg-amber-500/15 text-amber-600",
  investigating: "bg-blue-500/15 text-blue-600",
  closed: "bg-muted text-muted-foreground",
};

const PRIORITY_COLOR: Record<string, string> = {
  critical: "bg-destructive/15 text-destructive",
  high: "bg-orange-500/15 text-orange-600",
  medium: "bg-amber-500/15 text-amber-600",
  low: "bg-muted text-muted-foreground",
};

export function CasesClient({
  result,
  page,
  initialStatus,
  initialCustomer,
  initialCaseNumber,
  stats,
}: {
  result: PaginatedResult<Case>;
  page: number;
  initialStatus: string;
  initialCustomer: string;
  initialCaseNumber: string;
  stats: CaseStats | null;
}) {
  const router = useRouter();
  const { t, lang } = useLang();
  const locale = lang === "fr" ? "fr-FR" : "en-US";
  const [, startTransition] = useTransition();
  const [status, setStatus] = useState(initialStatus);
  const [customer, setCustomer] = useState(initialCustomer);
  const [caseNumber, setCaseNumber] = useState(initialCaseNumber);

  const statusLabel: Record<string, string> = {
    open: t("caseStatusOpen"),
    investigating: t("caseStatusInvestigating"),
    closed: t("caseStatusClosed"),
  };

  const priorityLabel: Record<string, string> = {
    critical: t("casePriorityCritical"),
    high: t("casePriorityHigh"),
    medium: t("casePriorityMedium"),
    low: t("casePriorityLow"),
  };

  function applyFilters(newPage: number = 1) {
    const params = new URLSearchParams();
    if (newPage > 1) params.set("page", String(newPage));
    if (status !== "all") params.set("status", status);
    if (customer) params.set("customer", customer);
    if (caseNumber.trim()) params.set("caseNumber", caseNumber.trim());
    startTransition(() => router.push(`/cases?${params.toString()}`));
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-foreground">{t("casesPageTitle")}</h1>
            <PageGuideButton content={CASES_GUIDE[lang]} />
          </div>
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

      {stats ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <KpiCard icon={<Briefcase className="size-4 text-primary" />} label={t("casesKpiTotal")} value={stats.total} locale={locale} delayMs={0} />
          <KpiCard icon={<FolderOpen className="size-4 text-amber-600" />} label={t("casesKpiOpen")} value={stats.open} locale={locale} delayMs={40} />
          <KpiCard icon={<Search className="size-4 text-blue-600" />} label={t("casesKpiInvestigating")} value={stats.investigating} locale={locale} delayMs={80} />
          <KpiCard icon={<CircleCheck className="size-4 text-muted-foreground" />} label={t("casesKpiClosed")} value={stats.closed} locale={locale} delayMs={120} />
          <KpiCard icon={<TrendingUp className="size-4 text-destructive" />} label={t("casesKpiEscalated")} value={stats.escalated} locale={locale} delayMs={160} />
        </div>
      ) : null}

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
          <label className="text-xs font-medium text-muted-foreground">{t("casesFilterNumberLabel")}</label>
          <input
            type="number"
            min={1}
            value={caseNumber}
            onChange={(e) => setCaseNumber(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            placeholder={t("casesFilterNumberPlaceholder")}
            className="w-32 rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
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
                <th className="px-4 py-2.5 font-medium">{t("casesColNumber")}</th>
                <th className="px-4 py-2.5 font-medium">{t("casesColTitle")}</th>
                <th className="px-4 py-2.5 font-medium">{t("signalsColCustomer")}</th>
                <th className="px-4 py-2.5 font-medium">{t("casesColStatus")}</th>
                <th className="px-4 py-2.5 font-medium">{t("casesColPriority")}</th>
                <th className="px-4 py-2.5 font-medium">{t("casesColAssignee")}</th>
                <th className="px-4 py-2.5 font-medium">{t("casesColAlerts")}</th>
                <th className="px-4 py-2.5 font-medium">{t("casesColOutcome")}</th>
                <th className="px-4 py-2.5 font-medium">{t("signalsColWhen")}</th>
                <th className="px-4 py-2.5 font-medium">{t("casesColUpdated")}</th>
                <th className="px-4 py-2.5 font-medium">{t("casesColClosed")}</th>
                <th className="px-4 py-2.5 font-medium text-right">{t("casesColActions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {result.data.map((kase) => (
                <tr key={kase.id} onClick={() => router.push(`/cases/${kase.id}`)} className="cursor-pointer hover:bg-muted/50">
                  <td className="px-4 py-2.5">
                    <span className="rounded-md bg-primary/15 px-2 py-1 font-mono text-sm font-bold text-primary">#{kase.caseNumber}</span>
                  </td>
                  <td className="px-4 py-2.5 font-medium text-foreground">{kase.title}</td>
                  <td className="px-4 py-2.5 text-foreground">{kase.externalCustomerId}</td>
                  <td className="px-4 py-2.5">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[kase.status]}`}>{statusLabel[kase.status]}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_COLOR[kase.priority]}`}>{priorityLabel[kase.priority]}</span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{kase.assignedToUserName ?? "—"}</td>
                  <td className="px-4 py-2.5 text-center text-muted-foreground">{kase.linkedAlertIds.length}</td>
                  <td className="px-4 py-2.5 text-xs text-muted-foreground">{kase.outcome ? (kase.outcome === "no_action" ? t("caseOutcomeNoAction") : kase.outcome === "false_positive" ? t("caseOutcomeFalsePositive") : t("caseOutcomeSarFiled")) : "—"}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-xs text-muted-foreground">
                    {new Date(kase.createdAt).toLocaleString(lang === "fr" ? "fr-FR" : "en-US")}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-xs text-muted-foreground">{new Date(kase.updatedAt).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US")}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-xs text-muted-foreground">{kase.closedAt ? new Date(kase.closedAt).toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US") : "—"}</td>
                  <td className="px-4 py-2.5 text-right">
                    <Link
                      href={`/cases/${kase.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="ml-auto flex w-fit items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                    >
                      <Eye className="size-3.5" />
                      {t("commonView")}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} totalPages={result.totalPages} total={result.total} onPageChange={applyFilters} />
    </div>
  );
}
