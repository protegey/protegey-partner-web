"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2 } from "lucide-react";
import { useSessionGuard } from "@/components/SessionExpiredProvider";
import { useLang } from "@/lib/i18n/LangProvider";
import { updateSarReportAction, reviewSarReportAction, approveSarReportAction, recordSarFilingResultAction, type MutationResult, type SarReport, type SarTemplate, type SarFieldDef } from "../actions";

function isError(value: unknown): value is { error: string } {
  return Boolean(value) && typeof value === "object" && "error" in (value as object);
}

function sourceBadge(field: SarFieldDef, lang: "en" | "fr"): string | null {
  if (field.source.type !== "path") return null;
  const prefix = field.source.path.split(".")[0];
  const labels: Record<string, { en: string; fr: string }> = {
    kyc: { en: "Pan-ID", fr: "Pan-ID" },
    transactions: { en: "Pan-Monitor", fr: "Pan-Monitor" },
    screening: { en: "Pan-Risk", fr: "Pan-Risk" },
    customer: { en: "Pan-Monitor", fr: "Pan-Monitor" },
    case: { en: "Case", fr: "Case" },
    meta: { en: "System", fr: "Système" },
  };
  return labels[prefix]?.[lang] ?? null;
}

export function SarReportDetailClient({ report: initialReport, template, canSubmit, canManage }: { report: SarReport; template: SarTemplate; canSubmit: boolean; canManage: boolean }) {
  const router = useRouter();
  const guard = useSessionGuard();
  const { t, lang } = useLang();
  const [report, setReport] = useState(initialReport);
  const [manualValues, setManualValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const section of template.schema) {
      for (const field of section.fields) {
        if (field.source.type === "manual") {
          const value = initialReport.data[field.id];
          initial[field.id] = typeof value === "string" ? value : "";
        }
      }
    }
    return initial;
  });
  const [narrative, setNarrative] = useState(initialReport.narrative);
  const [saving, setSaving] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filingStatus = report.filingStatus ?? (report.status === "submitted" ? "filing_pending" : "draft");
  const isDraft = filingStatus === "draft";

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const result = await guard(() => updateSarReportAction(report.id, { data: manualValues, narrative }));
      if (result === null) return;
      if (isError(result)) {
        setError(result.error);
        return;
      }
      setReport(result);
    } finally {
      setSaving(false);
    }
  }

  async function handleTransition(action: () => Promise<MutationResult<SarReport>>) {
    setTransitioning(true);
    setError(null);
    try {
      const result = await guard(action);
      if (result === null) return;
      if (isError(result)) {
        setError(result.error);
        return;
      }
      setReport(result);
    } finally {
      setTransitioning(false);
    }
  }

  async function handleFilingResult(status: "filed" | "rejected") {
    const regulatorReference = status === "filed" ? window.prompt(t("sarReferencePrompt")) ?? "" : undefined;
    const filingNotes = window.prompt(t("sarFilingNotesPrompt")) ?? "";
    await handleTransition(() => recordSarFilingResultAction(report.id, { status, regulatorReference, filingNotes }));
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <button type="button" onClick={() => router.push("/sar-str")} className="text-xs text-muted-foreground hover:underline">
          {t("sarBackToList")}
        </button>
        <div className="mt-1 flex items-center gap-3">
          <h1 className="text-xl font-semibold text-foreground">{template.regulatorName}</h1>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
               STATUS_COLOR[filingStatus]
            }`}
          >
            {STATUS_LABEL(t, filingStatus)}
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {report.reportType.toUpperCase()} · {t("sarColRegulatorReference")}: {report.regulatorReference ?? "—"}
        </p>
        <p className="font-mono text-xs text-muted-foreground">{report.id}</p>
      </div>

      {filingStatus !== "draft" ? (
        <div className="flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="size-4 shrink-0" />
          {filingStatus === "filed" ? `${t("sarSubmittedNote")} ${report.regulatorReference ?? ""}` : STATUS_LABEL(t, filingStatus)}
        </div>
      ) : null}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {template.schema.map((section) => (
        <div key={section.id} className="rounded-md border border-border bg-card p-4">
          <p className="mb-3 text-sm font-semibold text-foreground">{lang === "fr" ? section.titleFr : section.title}</p>
          <div className="flex flex-col gap-3">
            {section.fields.map((field) => {
              const label = lang === "fr" ? field.labelFr : field.label;
              const badge = sourceBadge(field, lang);

              if (field.source.type === "path") {
                const value = report.data[field.id];
                return (
                  <div key={field.id} className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-medium text-muted-foreground">{label}</label>
                      {badge ? <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">{badge}</span> : null}
                    </div>
                    <p className="rounded-md bg-muted/50 px-3 py-1.5 text-sm text-foreground">{value !== undefined ? String(value) : "—"}</p>
                  </div>
                );
              }

              if (field.fieldType === "textarea") {
                return (
                  <div key={field.id} className="flex flex-col gap-1">
                    <label className="text-xs font-medium text-muted-foreground">{label}</label>
                    <textarea
                      disabled={!isDraft}
                      value={manualValues[field.id] ?? ""}
                      onChange={(e) => setManualValues((prev) => ({ ...prev, [field.id]: e.target.value }))}
                      rows={3}
                      className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
                    />
                  </div>
                );
              }

              return (
                <div key={field.id} className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-muted-foreground">{label}</label>
                  <input
                    disabled={!isDraft}
                    value={manualValues[field.id] ?? ""}
                    onChange={(e) => setManualValues((prev) => ({ ...prev, [field.id]: e.target.value }))}
                    className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div className="rounded-md border-2 border-primary/30 bg-card p-4">
        <p className="mb-1 text-sm font-semibold text-foreground">{t("sarNarrativeTitle")}</p>
        <p className="mb-3 text-xs text-muted-foreground">{t("sarNarrativeHint")}</p>
        <textarea
          disabled={!isDraft}
          value={narrative}
          onChange={(e) => setNarrative(e.target.value)}
          rows={6}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
        />
      </div>

      {isDraft ? (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
             disabled={saving || transitioning}
            onClick={handleSave}
            className="flex items-center gap-2 rounded-md border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-60"
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : null}
            {t("sarSaveButton")}
          </button>
          {canManage && isDraft ? (
            <button
              type="button"
              disabled={saving || transitioning || !narrative.trim()}
              onClick={() => handleTransition(() => reviewSarReportAction(report.id))}
              className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {transitioning ? <Loader2 className="size-4 animate-spin" /> : null}
              {t("sarReviewButton")}
            </button>
          ) : null}
        </div>
      ) : null}

      {canSubmit && filingStatus === "mlro_review" ? (
        <div className="flex flex-wrap gap-3">
          <button type="button" disabled={transitioning} onClick={() => handleTransition(() => approveSarReportAction(report.id))} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">
            {t("sarApproveButton")}
          </button>
        </div>
      ) : null}

      {canManage && filingStatus === "filing_pending" ? (
        <div className="flex flex-wrap gap-3 rounded-md border border-border bg-card p-4">
          <button type="button" disabled={transitioning} onClick={() => handleFilingResult("filed")} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">{t("sarMarkFiledButton")}</button>
          <button type="button" disabled={transitioning} onClick={() => handleFilingResult("rejected")} className="rounded-md border border-destructive/40 px-4 py-2 text-sm font-semibold text-destructive disabled:opacity-60">{t("sarMarkRejectedButton")}</button>
        </div>
      ) : null}
    </div>
  );
}

const STATUS_COLOR: Record<string, string> = {
  draft: "bg-amber-500/15 text-amber-600",
  mlro_review: "bg-blue-500/15 text-blue-600",
  filing_pending: "bg-purple-500/15 text-purple-600",
  filed: "bg-emerald-500/15 text-emerald-600",
  rejected: "bg-red-500/15 text-red-600",
};

function STATUS_LABEL(t: (key: "sarStatusDraft" | "sarStatusMlroReview" | "sarStatusFilingPending" | "sarStatusFiled" | "sarStatusRejected" | "sarStatusSubmitted") => string, status: string): string {
  const labels: Record<string, string> = {
    draft: "sarStatusDraft",
    mlro_review: "sarStatusMlroReview",
    filing_pending: "sarStatusFilingPending",
    filed: "sarStatusFiled",
    rejected: "sarStatusRejected",
  };
  return t((labels[status] ?? "sarStatusSubmitted") as Parameters<typeof t>[0]);
}
