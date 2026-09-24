"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, CheckCircle2, FileOutput } from "lucide-react";
import { useSessionGuard } from "@/components/SessionExpiredProvider";
import { ConfirmActionDialog } from "@/components/ConfirmActionDialog";
import { useLang } from "@/lib/i18n/LangProvider";
import type { StringKey } from "@/lib/i18n/strings";
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

/** Realistic examples for the fields this schema is known to carry — falls back to a generic hint
 * keyed off the field type for anything a future template adds that isn't listed here. */
const FIELD_PLACEHOLDERS: Record<string, { en: string; fr: string }> = {
  infractions_sous_jacentes: { en: "e.g. Structuring to stay under the reporting threshold", fr: "ex. Fractionnement pour rester sous le seuil déclaratif" },
  motifs_declaration: { en: "e.g. Four cash withdrawals in one day, no economic rationale for the customer's profile", fr: "ex. Quatre retraits en espèces le même jour, sans rapport avec le profil du client" },
  nature_operations: { en: "e.g. Cash withdrawals via mobile money agents", fr: "ex. Retraits en espèces via des agents mobile money" },
  numero_compte: { en: "e.g. CI-SIKA-00123456", fr: "ex. CI-SIKA-00123456" },
  narratif_indices: { en: "Describe the pattern in your own words, in the order you noticed it", fr: "Décrivez le schéma avec vos propres mots, dans l'ordre où vous l'avez repéré" },
  nationalite: { en: "e.g. Ivorian", fr: "ex. Ivoirienne" },
  situation_matrimoniale: { en: "e.g. Single", fr: "ex. Célibataire" },
  employeur: { en: "e.g. Self-employed — market trader", fr: "ex. Indépendante — commerçante au marché" },
  actionnaires_principaux: { en: "e.g. Kouadio Yao — CNI 123456 — 60%", fr: "ex. Kouadio Yao — CNI 123456 — 60%" },
  beneficiaire_effectif: { en: "e.g. Same as principal shareholder", fr: "ex. Identique à l'actionnaire principal" },
  elements_cles_relation: { en: "e.g. Customer since 2023, mostly cash-in/cash-out activity", fr: "ex. Cliente depuis 2023, activité principalement cash-in/cash-out" },
};

function fieldPlaceholder(field: SarFieldDef, lang: "en" | "fr"): string | undefined {
  const known = FIELD_PLACEHOLDERS[field.id];
  if (known) return known[lang];
  if (field.fieldType === "number") return lang === "fr" ? "ex. 0" : "e.g. 0";
  if (field.fieldType === "textarea") return lang === "fr" ? "Décrivez ici…" : "Describe here…";
  return lang === "fr" ? "Saisissez une valeur…" : "Enter a value…";
}

export function SarReportDetailClient({ report: initialReport, template, canSubmit, canManage }: { report: SarReport; template: SarTemplate; canSubmit: boolean; canManage: boolean }) {
  const router = useRouter();
  const guard = useSessionGuard();
  const { t, lang } = useLang();
  const [report, setReport] = useState(initialReport);
  // Seeded from every field, not just manual ones — a Pan-Monitor/Pan-ID auto-filled value (e.g.
  // the total amount Pan-Monitor computed) is a starting point, not a locked-in fact: the analyst
  // preparing a real regulatory declaration must be able to correct it before filing.
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const section of template.schema) {
      for (const field of section.fields) {
        const value = initialReport.data[field.id];
        if (field.fieldType === "checkbox") {
          initial[field.id] = value === true || value === "true" ? "true" : "false";
        } else {
          initial[field.id] = typeof value === "string" || typeof value === "number" ? String(value) : "";
        }
      }
    }
    return initial;
  });
  const [narrative, setNarrative] = useState(initialReport.narrative);
  const [saving, setSaving] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filingDialog, setFilingDialog] = useState<"filed" | "rejected" | null>(null);
  const [filingNotesInput, setFilingNotesInput] = useState("");
  const [regulatorReferenceInput, setRegulatorReferenceInput] = useState("");
  const [filingPending, setFilingPending] = useState(false);
  const [filingError, setFilingError] = useState<string | null>(null);

  const filingStatus = report.filingStatus ?? (report.status === "submitted" ? "filing_pending" : "draft");
  const isDraft = filingStatus === "draft";

  /** Persists the current form state and reports whether it worked — used both by the explicit
   * "Save draft" button and silently before every status transition below, so clicking e.g.
   * "Send for MLRO review" never fails on stale server-side data just because the analyst forgot
   * to save first (the server validates against what's actually persisted, not what's on screen). */
  async function saveDraft(showToast: boolean): Promise<boolean> {
    setError(null);
    try {
      const result = await guard(() => updateSarReportAction(report.id, { data: values, narrative }));
      if (result === null) return false;
      if (isError(result)) {
        setError(result.error);
        toast.error(result.error);
        return false;
      }
      setReport(result);
      if (showToast) toast.success(t("sarDraftSavedToast"));
      return true;
    } catch {
      return false;
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await saveDraft(true);
    } finally {
      setSaving(false);
    }
  }

  async function handleTransition(action: () => Promise<MutationResult<SarReport>>, successToastKey?: StringKey, saveFirst = false) {
    setTransitioning(true);
    setError(null);
    try {
      if (saveFirst && !(await saveDraft(false))) return;
      const result = await guard(action);
      if (result === null) return;
      if (isError(result)) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      setReport(result);
      if (successToastKey) toast.success(t(successToastKey));
    } finally {
      setTransitioning(false);
    }
  }

  function openFilingDialog(status: "filed" | "rejected") {
    setFilingDialog(status);
    setFilingNotesInput("");
    setRegulatorReferenceInput("");
    setFilingError(null);
  }

  function closeFilingDialog() {
    setFilingDialog(null);
    setFilingNotesInput("");
    setRegulatorReferenceInput("");
    setFilingError(null);
  }

  async function confirmFilingResult() {
    if (!filingDialog) return;
    setFilingPending(true);
    setFilingError(null);
    const result = await guard(() =>
      recordSarFilingResultAction(report.id, {
        status: filingDialog,
        regulatorReference: filingDialog === "filed" ? regulatorReferenceInput : undefined,
        filingNotes: filingNotesInput,
      }),
    );
    setFilingPending(false);
    if (result === null) return;
    if (isError(result)) {
      setFilingError(result.error);
      toast.error(result.error);
      return;
    }
    setReport(result);
    closeFilingDialog();
    toast.success(t(filingDialog === "filed" ? "sarFiledToast" : "sarRejectedToast"));
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => router.push("/sar-str")} className="text-xs text-muted-foreground hover:underline">
            {t("sarBackToList")}
          </button>
          <Link
            href={`/sar-str/${report.id}/apercu`}
            className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
          >
            <FileOutput className="size-3.5" />
            {t("sarPreviewButton")}
          </Link>
        </div>
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
              const placeholder = field.source.type === "path" ? undefined : fieldPlaceholder(field, lang);

              const fieldLabel = (
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-muted-foreground">{label}</label>
                  {badge ? <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">{badge}</span> : null}
                </div>
              );

              if (field.fieldType === "checkbox") {
                return (
                  <label key={field.id} className="flex items-center gap-2 text-sm text-foreground">
                    <input
                      type="checkbox"
                      disabled={!isDraft}
                      checked={values[field.id] === "true"}
                      onChange={(e) => setValues((prev) => ({ ...prev, [field.id]: e.target.checked ? "true" : "false" }))}
                      className="size-4 rounded border-border accent-primary disabled:opacity-60"
                    />
                    {label}
                    {badge ? <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">{badge}</span> : null}
                  </label>
                );
              }

              if (field.fieldType === "textarea") {
                return (
                  <div key={field.id} className="flex flex-col gap-1">
                    {fieldLabel}
                    <textarea
                      disabled={!isDraft}
                      value={values[field.id] ?? ""}
                      onChange={(e) => setValues((prev) => ({ ...prev, [field.id]: e.target.value }))}
                      placeholder={placeholder}
                      rows={3}
                      className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
                    />
                  </div>
                );
              }

              return (
                <div key={field.id} className="flex flex-col gap-1">
                  {fieldLabel}
                  <input
                    type={field.fieldType === "number" ? "number" : field.fieldType === "date" ? "date" : "text"}
                    disabled={!isDraft}
                    value={values[field.id] ?? ""}
                    onChange={(e) => setValues((prev) => ({ ...prev, [field.id]: e.target.value }))}
                    placeholder={placeholder}
                    className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div className={`rounded-md border-2 bg-card p-4 ${!narrative.trim() && isDraft ? "border-destructive/50" : "border-primary/30"}`}>
        <div className="mb-1 flex items-center gap-1.5">
          <p className="text-sm font-semibold text-foreground">{t("sarNarrativeTitle")}</p>
          {isDraft ? <span className="text-sm font-semibold text-destructive">*</span> : null}
          {!narrative.trim() && isDraft ? (
            <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-destructive">
              {t("sarRequiredBadge")}
            </span>
          ) : null}
        </div>
        <p className="mb-3 text-xs text-muted-foreground">{t("sarNarrativeHint")}</p>
        <textarea
          disabled={!isDraft}
          value={narrative}
          onChange={(e) => setNarrative(e.target.value)}
          placeholder={lang === "fr" ? "ex. Retrait de 400 000 XOF sans justification économique claire, motif : structuration suspectée." : "e.g. 400,000 XOF withdrawal with no clear economic justification, grounds: suspected structuring."}
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
              onClick={() => handleTransition(() => reviewSarReportAction(report.id), "sarSentForReviewToast", true)}
              className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {transitioning ? <Loader2 className="size-4 animate-spin" /> : null}
              {t("sarReviewButton")}
            </button>
          ) : null}
          {canManage && isDraft && !narrative.trim() ? (
            <p className="text-xs text-destructive">{t("sarReviewDisabledHint")}</p>
          ) : null}
        </div>
      ) : null}

      {canSubmit && filingStatus === "mlro_review" ? (
        <div className="flex flex-wrap gap-3">
          <button type="button" disabled={transitioning} onClick={() => handleTransition(() => approveSarReportAction(report.id), "sarApprovedToast", true)} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">
            {t("sarApproveButton")}
          </button>
        </div>
      ) : null}

      {canManage && filingStatus === "filing_pending" ? (
        <div className="flex flex-wrap gap-3 rounded-md border border-border bg-card p-4">
          <button type="button" onClick={() => openFilingDialog("filed")} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60">{t("sarMarkFiledButton")}</button>
          <button type="button" onClick={() => openFilingDialog("rejected")} className="rounded-md border border-destructive/40 px-4 py-2 text-sm font-semibold text-destructive disabled:opacity-60">{t("sarMarkRejectedButton")}</button>
        </div>
      ) : null}

      {filingDialog ? (
        <ConfirmActionDialog
          open={Boolean(filingDialog)}
          onClose={closeFilingDialog}
          onConfirm={confirmFilingResult}
          title={t(filingDialog === "filed" ? "sarConfirmFileTitle" : "sarConfirmRejectTitle")}
          description={t(filingDialog === "filed" ? "sarConfirmFileDescription" : "sarConfirmRejectDescription")}
          confirmLabel={t(filingDialog === "filed" ? "sarMarkFiledButton" : "sarMarkRejectedButton")}
          pending={filingPending}
          variant={filingDialog === "filed" ? "primary" : "destructive"}
        >
          <div className="flex flex-col gap-3">
            {filingDialog === "filed" ? (
              <label className="flex flex-col gap-1 text-xs text-muted-foreground">
                {t("sarReferencePrompt")}
                <input
                  value={regulatorReferenceInput}
                  onChange={(e) => setRegulatorReferenceInput(e.target.value)}
                  autoFocus
                  className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                />
              </label>
            ) : null}
            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
              {t("sarFilingNotesPrompt")}
              <textarea
                value={filingNotesInput}
                onChange={(e) => setFilingNotesInput(e.target.value)}
                rows={3}
                autoFocus={filingDialog === "rejected"}
                className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
            {filingError ? <p className="text-sm text-destructive">{filingError}</p> : null}
          </div>
        </ConfirmActionDialog>
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
