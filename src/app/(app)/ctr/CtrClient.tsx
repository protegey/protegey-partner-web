"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { FileText, FileOutput } from "lucide-react";
import { useLang } from "@/lib/i18n/LangProvider";
import { PageGuideButton, type PageGuideContent } from "@/components/PageGuideButton";

const CTR_GUIDE: Record<"en" | "fr", PageGuideContent> = {
  fr: {
    title: "CTR — Déclarations de transactions en espèces",
    explanation:
      "Une CTR n'a rien à voir avec un soupçon de fraude — c'est purement automatique et réglementaire : dès qu'un client dépasse un seuil configuré de transactions en ESPÈCES sur une période donnée, un rapport est généré ici tout seul, sans intervention humaine au départ.\n\nChaque rapport indique la période concernée, le nombre et le montant total des transactions en espèces, la devise, et le seuil qui a été franchi. Il suit ensuite le même circuit qu'une SAR : brouillon → revue MLRO → en attente de dépôt → déposé (avec une référence du régulateur), ou rejeté.\n\nLa version imprimable (« aperçu ») produit le document final à transmettre au régulateur.",
    diagram: [
      [{ label: "Transactions en espèces", note: "dépassent le seuil configuré" }],
      [{ label: "CTR", note: "généré automatiquement", current: true }],
      [{ label: "Revue MLRO", note: "responsable conformité" }],
      [{ label: "Déposé", note: "avec référence régulateur" }],
    ],
    diagramCaption: "Contrairement à une SAR, aucune décision humaine ne déclenche une CTR — seul le seuil compte.",
  },
  en: {
    title: "CTR — Cash Transaction Reports",
    explanation:
      "A CTR has nothing to do with suspicion of fraud — it's purely automatic and regulatory: as soon as a customer crosses a configured threshold of CASH transactions over a given period, a report is generated here on its own, with no human decision to start it.\n\nEach report shows the period covered, the count and total amount of cash transactions, the currency, and the threshold that was crossed. It then follows the same path as a SAR: draft → MLRO review → filing pending → filed (with a regulator reference), or rejected.\n\nThe printable version (\"apercu\") produces the final document to hand to the regulator.",
    diagram: [
      [{ label: "Cash transactions", note: "cross the configured threshold" }],
      [{ label: "CTR", note: "auto-generated", current: true }],
      [{ label: "MLRO review", note: "compliance officer" }],
      [{ label: "Filed", note: "with regulator reference" }],
    ],
    diagramCaption: "Unlike a SAR, no human decision triggers a CTR — only the threshold does.",
  },
};
import { Pagination } from "@/components/Pagination";
import { ConfirmActionDialog } from "@/components/ConfirmActionDialog";
import { generateCtrAction, updateCtrAction, type CtrReport, type CtrStatus } from "./actions";
import type { PaginatedResult } from "../transactions/actions";
import type { StringKey } from "@/lib/i18n/strings";

const colors: Record<string, string> = { draft: "bg-amber-500/15 text-amber-600", mlro_review: "bg-blue-500/15 text-blue-600", filing_pending: "bg-purple-500/15 text-purple-600", filed: "bg-emerald-500/15 text-emerald-600", rejected: "bg-red-500/15 text-red-600" };

type PendingTransition = "mlro_review" | "filing_pending" | "filed";

const DIALOG_COPY: Record<PendingTransition, { title: StringKey; description: StringKey; confirmLabel: StringKey }> = {
  mlro_review: { title: "ctrConfirmReviewTitle", description: "ctrConfirmReviewDescription", confirmLabel: "ctrReview" },
  filing_pending: { title: "ctrConfirmApproveTitle", description: "ctrConfirmApproveDescription", confirmLabel: "ctrApprove" },
  filed: { title: "ctrConfirmFileTitle", description: "ctrConfirmFileDescription", confirmLabel: "ctrFile" },
};

export function CtrClient({ result, page }: { result: PaginatedResult<CtrReport>; page: number }) {
  const { t, lang } = useLang(); const router = useRouter(); const [, transition] = useTransition();
  const [form, setForm] = useState({ periodStart: "", periodEnd: "", currency: "XOF", thresholdAmount: "" }); const [message, setMessage] = useState("");
  const [confirmTarget, setConfirmTarget] = useState<{ report: CtrReport; status: PendingTransition } | null>(null);
  const [filingNotes, setFilingNotes] = useState("");
  const [regulatorReference, setRegulatorReference] = useState("");
  const [pending, setPending] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);

  async function generate(event: React.FormEvent) {
    event.preventDefault();
    const response = await generateCtrAction(form);
    if ("error" in response) { setMessage(response.error); toast.error(response.error); return; }
    if ("authExpired" in response) return;
    setMessage(t("ctrGenerated"));
    toast.success(t("ctrGeneratedToast"));
    router.refresh();
  }

  function openConfirm(report: CtrReport, status: PendingTransition) {
    setConfirmTarget({ report, status });
    setFilingNotes(report.filingNotes ?? "");
    setRegulatorReference(report.regulatorReference ?? "");
    setDialogError(null);
  }

  function closeConfirm() {
    setConfirmTarget(null);
    setFilingNotes("");
    setRegulatorReference("");
    setDialogError(null);
  }

  async function confirmTransition() {
    if (!confirmTarget) return;
    setPending(true);
    setDialogError(null);
    const response = await updateCtrAction(confirmTarget.report.id, {
      status: confirmTarget.status,
      filingNotes,
      regulatorReference: confirmTarget.status === "filed" ? regulatorReference : undefined,
    });
    setPending(false);
    if ("error" in response) { setDialogError(response.error); toast.error(response.error); return; }
    if ("authExpired" in response) return;
    closeConfirm();
    toast.success(t("ctrUpdatedToast"));
    router.refresh();
  }

  const actionForStatus: Partial<Record<CtrStatus, PendingTransition>> = { draft: "mlro_review", mlro_review: "filing_pending", filing_pending: "filed" };

  return <div className="flex w-full flex-col gap-6">
    <div><div className="flex items-center gap-2"><h1 className="text-xl font-semibold text-foreground">{t("ctrPageTitle")}</h1><PageGuideButton content={CTR_GUIDE[lang]} /></div><p className="text-sm text-muted-foreground">{t("ctrPageSubtitle")}</p></div>
    <form onSubmit={generate} className="grid gap-3 rounded-md border border-border bg-card p-4 md:grid-cols-5">
      <label className="text-xs text-muted-foreground">{t("ctrPeriodStart")}<input required type="date" value={form.periodStart} onChange={e => setForm({ ...form, periodStart: e.target.value })} className="mt-1 w-full rounded border border-border bg-background p-2 text-sm text-foreground" /></label>
      <label className="text-xs text-muted-foreground">{t("ctrPeriodEnd")}<input required type="date" value={form.periodEnd} onChange={e => setForm({ ...form, periodEnd: e.target.value })} className="mt-1 w-full rounded border border-border bg-background p-2 text-sm text-foreground" /></label>
      <label className="text-xs text-muted-foreground">{t("ctrCurrency")}<input required maxLength={3} value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value.toUpperCase() })} placeholder={t("ctrCurrencyPlaceholder")} className="mt-1 w-full rounded border border-border bg-background p-2 text-sm text-foreground" /></label>
      <label className="text-xs text-muted-foreground">{t("ctrThreshold")}<input required type="number" min="0" step="0.01" value={form.thresholdAmount} onChange={e => setForm({ ...form, thresholdAmount: e.target.value })} placeholder={t("ctrThresholdPlaceholder")} className="mt-1 w-full rounded border border-border bg-background p-2 text-sm text-foreground" /></label>
      <button className="self-end rounded bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">{t("ctrGenerate")}</button>
    </form>
    {message && <p className="text-sm text-muted-foreground">{message}</p>}
    {result.data.length === 0 ? <div className="flex flex-col items-center gap-3 rounded-md border border-border p-10 text-center"><FileText className="size-8 text-muted-foreground/40" /><p className="text-sm text-muted-foreground">{t("ctrEmpty")}</p></div> : <div className="overflow-x-auto rounded-md border border-border"><table className="w-full text-left text-sm"><thead className="bg-muted text-muted-foreground"><tr>{["ctrCustomer", "ctrPeriod", "ctrAmount", "ctrCount", "ctrStatus", "ctrReference", "ctrActions"].map(k => <th key={k} className="px-4 py-2.5 font-medium">{t(k as never)}</th>)}</tr></thead><tbody className="divide-y divide-border">{result.data.map(report => {
      const nextAction = actionForStatus[report.status];
      return <tr key={report.id}><td className="px-4 py-2.5 font-mono text-xs">{report.externalCustomerId}</td><td className="px-4 py-2.5 text-xs">{report.periodStart} – {report.periodEnd}</td><td className="px-4 py-2.5">{report.cashTotalAmount} {report.currency}</td><td className="px-4 py-2.5">{report.cashTransactionCount}</td><td className="px-4 py-2.5"><span className={`rounded-full px-2 py-0.5 text-xs ${colors[report.status]}`}>{t(`ctrStatus_${report.status}` as never)}</span></td><td className="px-4 py-2.5 text-xs">{report.regulatorReference ?? "—"}</td><td className="px-4 py-2.5"><div className="flex items-center gap-3">{nextAction ? <button onClick={() => openConfirm(report, nextAction)} className="text-xs text-primary hover:underline">{t(DIALOG_COPY[nextAction].confirmLabel)}</button> : null}<Link href={`/ctr/${report.id}/apercu`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline"><FileOutput className="size-3.5" />{t("ctrPreviewButton")}</Link></div></td></tr>;
    })}</tbody></table></div>}
    <Pagination page={page} totalPages={result.totalPages} total={result.total} onPageChange={(next) => transition(() => router.push(`/ctr?page=${next}`))} />

    {confirmTarget ? (
      <ConfirmActionDialog
        open={Boolean(confirmTarget)}
        onClose={closeConfirm}
        onConfirm={confirmTransition}
        title={t(DIALOG_COPY[confirmTarget.status].title)}
        description={t(DIALOG_COPY[confirmTarget.status].description)}
        confirmLabel={t(DIALOG_COPY[confirmTarget.status].confirmLabel)}
        pending={pending}
        confirmDisabled={filingNotes.trim().length === 0}
        variant={confirmTarget.status === "filed" ? "destructive" : "primary"}
      >
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-xs text-muted-foreground">
            {t("ctrFilingNotesLabel")}
            <textarea
              value={filingNotes}
              onChange={(e) => setFilingNotes(e.target.value)}
              placeholder={t("ctrFilingNotesPlaceholder")}
              rows={3}
              autoFocus
              className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
            />
          </label>
          {confirmTarget.status === "filed" ? (
            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
              {t("ctrReferenceLabel")}
              <input
                value={regulatorReference}
                onChange={(e) => setRegulatorReference(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
              />
            </label>
          ) : null}
          {dialogError ? <p className="text-sm text-destructive">{dialogError}</p> : null}
        </div>
      </ConfirmActionDialog>
    ) : null}
  </div>;
}
