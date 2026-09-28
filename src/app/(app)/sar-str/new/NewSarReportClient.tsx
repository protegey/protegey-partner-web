"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useSessionGuard } from "@/components/SessionExpiredProvider";
import { useLang } from "@/lib/i18n/LangProvider";
import { generateSarReportAction } from "../actions";
import { PageGuideButton, type PageGuideContent } from "@/components/PageGuideButton";

const NEW_SAR_GUIDE: Record<"en" | "fr", PageGuideContent> = {
  fr: {
    title: "Nouvelle déclaration SAR/STR",
    explanation:
      "Ce formulaire génère un brouillon de déclaration à partir d'un Dossier existant (tu ne peux pas en créer une sans dossier source). Tu choisis le pays du client — pour sélectionner le bon modèle réglementaire, ou le modèle générique UEMOA/international si aucun n'existe pour ce pays — et le type de déclaration : SAR ou STR.\n\nUne fois généré, la plupart des champs sont déjà pré-remplis depuis les données KYC, transactions et criblage du dossier ; il ne reste qu'à écrire le récit et l'envoyer en revue.",
    diagram: [
      [{ label: "Dossier", note: "source obligatoire" }],
      [{ label: "Nouvelle déclaration", note: "pays + type (SAR/STR)", current: true }],
      [{ label: "Brouillon pré-rempli" }],
      [{ label: "SAR/STR", note: "revue MLRO puis dépôt" }],
    ],
  },
  en: {
    title: "New SAR/STR report",
    explanation:
      "This form generates a draft report from an existing Case (you can't create one without a source case). You pick the customer's country — to select the right regulatory template, or the generic UEMOA/international template if none exists for that country — and the report type: SAR or STR.\n\nOnce generated, most fields are already pre-filled from the case's KYC, transaction, and screening data; all that's left is writing the narrative and sending it for review.",
    diagram: [
      [{ label: "Case", note: "required source" }],
      [{ label: "New report", note: "country + type (SAR/STR)", current: true }],
      [{ label: "Pre-filled draft" }],
      [{ label: "SAR/STR", note: "MLRO review then filing" }],
    ],
  },
};

function isError(value: unknown): value is { error: string } {
  return Boolean(value) && typeof value === "object" && "error" in (value as object);
}

export function NewSarReportClient({ caseId }: { caseId: string }) {
  const router = useRouter();
  const guard = useSessionGuard();
  const { t, lang } = useLang();
  const [countryCode, setCountryCode] = useState("TG");
  const [reportType, setReportType] = useState<"sar" | "str">("sar");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const result = await guard(() => generateSarReportAction(caseId, countryCode, reportType));
      if (result === null) return;
      if (isError(result)) {
        setError(result.error);
        toast.error(result.error);
        return;
      }
      toast.success(t("sarDraftCreatedToast"));
      router.push(`/sar-str/${result.id}`);
    } finally {
      setSubmitting(false);
    }
  }

  if (!caseId) {
    return <p className="mx-auto max-w-lg text-sm text-destructive">{t("sarNewMissingCase")}</p>;
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold text-foreground">{t("sarNewPageTitle")}</h1>
          <PageGuideButton content={NEW_SAR_GUIDE[lang]} />
        </div>
        <p className="text-sm text-muted-foreground">{t("sarNewPageSubtitle")}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-md border border-border bg-card p-5">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">{t("sarNewTypeLabel")}</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as "sar" | "str")}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="sar">SAR</option>
            <option value="str">STR</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-foreground">{t("sarNewCountryLabel")}</label>
          <select
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="TG">Togo — CENTIF-Togo</option>
          </select>
          <p className="text-xs text-muted-foreground">{t("sarNewCountryHint")}</p>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <button
          type="submit"
          disabled={submitting}
          className="flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
          {t("sarNewSubmitButton")}
        </button>
      </form>
    </div>
  );
}
