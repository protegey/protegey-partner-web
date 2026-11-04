"use client";

import { useState } from "react";
import { Download, Eye, Loader2, Pencil, RefreshCw, ShieldQuestion, ZoomIn } from "lucide-react";
import { Drawer } from "@/components/Drawer";
import { CopyRevealField } from "@/components/CopyRevealField";
import { ConfirmActionDialog } from "@/components/ConfirmActionDialog";
import { useSessionGuard } from "@/components/SessionExpiredProvider";
import { useLang } from "@/lib/i18n/LangProvider";
import {
  getKycEnrollmentDetail,
  rescreenSanctionsAction,
  resendKycEnrollmentAction,
  updateKycEnrollmentAction,
  type KycEnrollmentDetail,
  type UpdateKycEnrollmentInput,
} from "./actions";
import { ImageLightbox, downloadGalleryImage, type GalleryImage } from "./ImageLightbox";
import { ALL_COUNTRIES, countryFlag, countryName } from "./country";
import type { StringKey } from "@/lib/i18n/strings";

const RESENDABLE_STATUSES = new Set(["Declined", "Expired", "In Review", "Resubmitted"]);

type Rec = Record<string, unknown>;

function num(o: Rec | null | undefined, key: string): number | null {
  const v = o?.[key];
  return typeof v === "number" ? v : null;
}
function bool(o: Rec | null | undefined, key: string): boolean | null {
  const v = o?.[key];
  return typeof v === "boolean" ? v : null;
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  if (value == null || value === "") return null;
  return (
    <div>
      <p className="text-[10px] font-medium uppercase text-muted-foreground">{label}</p>
      <p className="text-sm text-foreground">{value}</p>
    </div>
  );
}

function ScoreBadge({ label, score }: { label: string; score: number | null }) {
  return (
    <div className="rounded-md border border-border p-3">
      <p className="text-[10px] font-medium uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-foreground">{score != null ? `${score.toFixed(0)}%` : "—"}</p>
    </div>
  );
}

const DOCUMENT_FIELD_LABEL_KEYS: Record<string, "kycFieldDateOfBirth" | "kycFieldPlaceOfBirth" | "kycFieldProfession" | "kycFieldSex" | "kycFieldDateOfIssue" | "kycFieldDateOfExpiration"> = {
  dateOfBirth: "kycFieldDateOfBirth",
  placeOfBirth: "kycFieldPlaceOfBirth",
  profession: "kycFieldProfession",
  sex: "kycFieldSex",
  dateOfIssue: "kycFieldDateOfIssue",
  dateOfExpiration: "kycFieldDateOfExpiration",
};

const ID_SCAN_CHECK_LABEL_KEYS: Record<string, "kycCheckOcrTemplateMatch" | "kycCheckDocumentQuality" | "kycCheckFaceQuality" | "kycCheckUnexpectedMedia"> = {
  matchedOcrTemplate: "kycCheckOcrTemplateMatch",
  qualityIssueOnDocument: "kycCheckDocumentQuality",
  qualityIssueOnFacePhoto: "kycCheckFaceQuality",
  unexpectedMediaEncountered: "kycCheckUnexpectedMedia",
};

/** FaceTec's own enum convention: 0 means OK, any other number means an issue, null/undefined
 * means the document template doesn't carry that feature at all (e.g. no NFC chip, no MRZ). The
 * two quality flags are booleans instead (true meaning an issue was found), inverted to match. */
function CheckRow({ t, labelKey, value }: { t: (key: StringKey) => string; labelKey: StringKey; value: unknown }) {
  let status: "ok" | "issue" | "na";
  if (typeof value === "number") status = value === 0 ? "ok" : "issue";
  else if (typeof value === "boolean") status = value ? "issue" : "ok";
  else status = "na";

  const statusLabel = status === "ok" ? t("kycCheckOk") : status === "issue" ? t("kycCheckIssue") : t("kycCheckNotApplicable");
  const color = status === "issue" ? "text-destructive" : status === "ok" ? "text-foreground" : "text-muted-foreground";
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{t(labelKey)}</span>
      <span className={`font-medium ${color}`}>{statusLabel}</span>
    </div>
  );
}

function GalleryThumb({ image, onClick }: { image: GalleryImage; onClick: () => void }) {
  const { t } = useLang();
  return (
    <div className="group relative aspect-[4/3] w-full overflow-hidden rounded-md border border-border bg-muted">
      <button type="button" onClick={onClick} className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element -- base64 data: URI, not a remote asset Next can optimize */}
        <img src={image.url} alt={image.label} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
          <ZoomIn className="size-6 text-white opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          downloadGalleryImage(image);
        }}
        aria-label={t("kycDownloadImageAria")}
        className="absolute right-1.5 top-1.5 rounded bg-black/50 p-1.5 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100"
      >
        <Download className="size-4" />
      </button>
      <p className="pointer-events-none absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5 text-left text-xs font-medium text-white">
        {image.label}
      </p>
    </div>
  );
}

const STATUS_OPTIONS = ["In Review", "Approved", "Declined"] as const;

// "sex" is rendered separately as a dropdown (see SEX_OPTIONS below), not a free-text input.
const DOCUMENT_FIELD_INPUTS: { key: "dateOfBirth" | "placeOfBirth" | "profession" | "dateOfIssue" | "dateOfExpiration"; labelKey: StringKey }[] = [
  { key: "dateOfBirth", labelKey: "kycFieldDateOfBirth" },
  { key: "placeOfBirth", labelKey: "kycFieldPlaceOfBirth" },
  { key: "profession", labelKey: "kycFieldProfession" },
  { key: "dateOfIssue", labelKey: "kycFieldDateOfIssue" },
  { key: "dateOfExpiration", labelKey: "kycFieldDateOfExpiration" },
];

// Male/Female first (what every government ID's own "SEXE/SEX" field actually prints, and what
// FaceTec's OCR reads off it) — the rest cover how someone correcting this field might reasonably
// want to describe it instead. Values stay short, uppercase codes so they read the same as
// whatever OCR already wrote for any field that's never been touched.
const SEX_OPTIONS: { value: string; label: string }[] = [
  { value: "M", label: "Homme / Male" },
  { value: "F", label: "Femme / Female" },
  { value: "NB", label: "Non-binaire / Non-binary" },
  { value: "X", label: "Autre / Other (X)" },
  { value: "U", label: "Préfère ne pas préciser / Prefer not to say" },
];

const FIELD_LABEL_KEYS: Record<string, StringKey> = {
  fullName: "kycEditFieldFullName",
  country: "clientsComplianceFieldNationality",
  documentType: "kycFieldDocumentType",
  idDocumentNumber: "kycFieldDocumentNumber",
  sex: "kycFieldSex",
  dateOfBirth: "kycFieldDateOfBirth",
  placeOfBirth: "kycFieldPlaceOfBirth",
  profession: "kycFieldProfession",
  dateOfIssue: "kycFieldDateOfIssue",
  dateOfExpiration: "kycFieldDateOfExpiration",
  status: "kycEditFieldStatus",
};

function EditEnrollmentForm({
  detail,
  onCancel,
  onSaved,
}: {
  detail: KycEnrollmentDetail;
  onCancel: () => void;
  onSaved: (updated: KycEnrollmentDetail) => void;
}) {
  const { t } = useLang();
  const guard = useSessionGuard();
  const documentFields = (detail.decision?.documentFields as Record<string, string> | null | undefined) ?? {};
  const [form, setForm] = useState({
    fullName: detail.fullName ?? "",
    country: detail.country ?? "",
    documentType: detail.documentType ?? "",
    idDocumentNumber: detail.idDocumentNumber ?? "",
    sex: documentFields.sex ?? "",
    dateOfBirth: documentFields.dateOfBirth ?? "",
    placeOfBirth: documentFields.placeOfBirth ?? "",
    profession: documentFields.profession ?? "",
    dateOfIssue: documentFields.dateOfIssue ?? "",
    dateOfExpiration: documentFields.dateOfExpiration ?? "",
    status: detail.status as (typeof STATUS_OPTIONS)[number] | "",
    reviewNote: "",
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  // Built once the user asks to save (not live on every keystroke) — the confirmation dialog shows
  // exactly this before anything is actually sent, and it's reused as-is for the actual request.
  const [pendingChanges, setPendingChanges] = useState<{ payload: UpdateKycEnrollmentInput; diff: { label: string; from: string; to: string }[] } | null>(
    null,
  );

  function buildPendingChanges(): { payload: UpdateKycEnrollmentInput; diff: { label: string; from: string; to: string }[] } {
    const payload: UpdateKycEnrollmentInput = {};
    const diff: { label: string; from: string; to: string }[] = [];
    const track = (field: keyof UpdateKycEnrollmentInput, from: string, to: string) => {
      if (to === from) return;
      (payload as Record<string, string>)[field] = to;
      diff.push({ label: t(FIELD_LABEL_KEYS[field] ?? field), from: from || "—", to: to || "—" });
    };

    track("fullName", detail.fullName ?? "", form.fullName);
    track("country", detail.country ?? "", form.country);
    track("documentType", detail.documentType ?? "", form.documentType);
    track("idDocumentNumber", detail.idDocumentNumber ?? "", form.idDocumentNumber);
    track("sex", documentFields.sex ?? "", form.sex);
    track("dateOfBirth", documentFields.dateOfBirth ?? "", form.dateOfBirth);
    track("placeOfBirth", documentFields.placeOfBirth ?? "", form.placeOfBirth);
    track("profession", documentFields.profession ?? "", form.profession);
    track("dateOfIssue", documentFields.dateOfIssue ?? "", form.dateOfIssue);
    track("dateOfExpiration", documentFields.dateOfExpiration ?? "", form.dateOfExpiration);

    if (form.status && form.status !== detail.status) {
      track("status", detail.status, form.status);
      if (form.reviewNote.trim()) payload.reviewNote = form.reviewNote.trim();
    }

    return { payload, diff };
  }

  function handleReviewClick() {
    const changes = buildPendingChanges();
    if (changes.diff.length === 0) {
      onCancel();
      return;
    }
    setPendingChanges(changes);
  }

  async function handleConfirmSave() {
    if (!pendingChanges) return;
    setSaving(true);
    setSaveError(null);
    const result = await guard(() => updateKycEnrollmentAction(detail.id, pendingChanges.payload));
    setSaving(false);
    if (!result) return; // cancelled or session-expired retry also failed — guard already handled it
    if ("error" in result) {
      setSaveError(result.error);
      setPendingChanges(null);
      return;
    }
    setPendingChanges(null);
    onSaved(result);
  }

  return (
    <div className="space-y-3 rounded-md border border-border p-3">
      <p className="text-sm font-semibold text-foreground">{t("kycEditButton")}</p>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted-foreground">{t("kycEditFieldFullName")}</span>
          <input
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            className="rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted-foreground">{t("clientsComplianceFieldNationality")}</span>
          <select
            value={form.country}
            onChange={(e) => setForm({ ...form, country: e.target.value })}
            className="rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
          >
            <option value="">—</option>
            {ALL_COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {countryFlag(c.code)} {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted-foreground">{t("kycFieldDocumentType")}</span>
          <input
            value={form.documentType}
            onChange={(e) => setForm({ ...form, documentType: e.target.value })}
            className="rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted-foreground">{t("kycFieldDocumentNumber")}</span>
          <input
            value={form.idDocumentNumber}
            onChange={(e) => setForm({ ...form, idDocumentNumber: e.target.value })}
            className="rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted-foreground">{t("kycFieldSex")}</span>
          <select
            value={form.sex}
            onChange={(e) => setForm({ ...form, sex: e.target.value })}
            className="rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
          >
            <option value="">—</option>
            {SEX_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
            {/* Preserves whatever raw value OCR (or an older edit) already wrote, instead of
                silently blanking it out just because it doesn't match one of the options above. */}
            {form.sex && !SEX_OPTIONS.some((o) => o.value === form.sex) ? <option value={form.sex}>{form.sex}</option> : null}
          </select>
        </label>
        {DOCUMENT_FIELD_INPUTS.map(({ key, labelKey }) => (
          <label key={key} className="flex flex-col gap-1 text-xs">
            <span className="text-muted-foreground">{t(labelKey)}</span>
            <input
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              className="rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
            />
          </label>
        ))}
      </div>

      <label className="flex flex-col gap-1 text-xs">
        <span className="text-muted-foreground">{t("kycEditFieldStatus")}</span>
        <select
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value as (typeof STATUS_OPTIONS)[number] })}
          className="rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      {form.status && form.status !== detail.status ? (
        <label className="flex flex-col gap-1 text-xs">
          <span className="text-muted-foreground">{t("kycEditFieldReviewNote")}</span>
          <textarea
            value={form.reviewNote}
            onChange={(e) => setForm({ ...form, reviewNote: e.target.value })}
            rows={2}
            className="rounded-md border border-border bg-background px-2 py-1.5 text-sm text-foreground"
          />
        </label>
      ) : null}

      {saveError ? <p className="text-xs text-destructive">{saveError}</p> : null}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleReviewClick}
          disabled={saving}
          className="rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving ? t("kycEditSaving") : t("kycEditSave")}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
        >
          {t("cancel")}
        </button>
      </div>

      <ConfirmActionDialog
        open={pendingChanges != null}
        onClose={() => setPendingChanges(null)}
        onConfirm={handleConfirmSave}
        title={t("kycEditConfirmTitle")}
        description={t("kycEditConfirmBody")}
        confirmLabel={t("kycEditSave")}
        pendingLabel={t("kycEditSaving")}
        pending={saving}
      >
        <div className="max-h-56 space-y-1.5 overflow-y-auto rounded-md border border-border bg-muted/40 p-2.5 text-xs">
          {pendingChanges?.diff.map((change) => (
            <div key={change.label} className="flex flex-col">
              <span className="font-medium text-foreground">{change.label}</span>
              <span className="text-muted-foreground">
                {change.from} <span aria-hidden="true">→</span> {change.to}
              </span>
            </div>
          ))}
        </div>
      </ConfirmActionDialog>
    </div>
  );
}

export function KycDetailButton({ enrollmentId, fullName }: { enrollmentId: string; fullName: string | null }) {
  const guard = useSessionGuard();
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [detail, setDetail] = useState<KycEnrollmentDetail | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendUrl, setResendUrl] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);
  const [rescreening, setRescreening] = useState(false);
  const [rescreenError, setRescreenError] = useState<string | null>(null);

  async function handleRescreenSanctions() {
    if (!detail) return;
    setRescreening(true);
    setRescreenError(null);
    const result = await guard(() => rescreenSanctionsAction(detail.id));
    setRescreening(false);
    if (!result) return;
    if ("error" in result) {
      setRescreenError(result.error);
      return;
    }
    setDetail(result);
  }

  async function handleResend() {
    if (!detail) return;
    setResending(true);
    setResendError(null);
    const result = await guard(() => resendKycEnrollmentAction(detail.id));
    setResending(false);
    if (!result) return;
    if ("error" in result) {
      setResendError(result.error);
      return;
    }
    setResendUrl(result.captureUrl);
    setDetail({ ...detail, status: result.status });
  }

  async function handleOpen() {
    setOpen(true);
    setLoading(true);
    setError(false);
    try {
      const result = await guard(() => getKycEnrollmentDetail(enrollmentId));
      if (result) setDetail(result);
      else setError(true);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  const decision = detail?.decision ?? null;
  const riskFactors = (decision?.riskFactors as Rec | null | undefined) ?? null;
  const documentFields = (decision?.documentFields as Record<string, string> | null | undefined) ?? null;
  const idScanChecks = (decision?.idScanChecks as Rec | null | undefined) ?? null;
  const sanctionsMatches = (decision?.sanctionsMatches as Rec[] | null | undefined) ?? null;
  const identityResolution = (decision?.identityResolution as Rec | null | undefined) ?? null;
  const networkFlag = (identityResolution?.networkFlag as Rec | null | undefined) ?? null;

  const images: GalleryImage[] = [
    detail?.documentPhoto && { url: `data:image/jpeg;base64,${detail.documentPhoto}`, label: t("kycImageIdDocument") },
    detail?.documentBackPhoto && { url: `data:image/jpeg;base64,${detail.documentBackPhoto}`, label: t("kycImageIdDocumentBack") },
    detail?.documentFaceCrop && { url: `data:image/jpeg;base64,${detail.documentFaceCrop}`, label: t("kycImageDocumentFaceCrop") },
    detail?.selfiePhoto && { url: `data:image/jpeg;base64,${detail.selfiePhoto}`, label: t("kycImageSelfie") },
  ].filter((x): x is GalleryImage => Boolean(x));

  const hasRiskFactors = bool(riskFactors, "rootedDevice") != null || bool(riskFactors, "emulator") != null || num(riskFactors, "spoofAttempts") != null;

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="flex w-fit items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
      >
        <Eye className="size-3.5" />
        {t("kycViewDetailsButton")}
      </button>

      <Drawer open={open} onClose={() => setOpen(false)} title={`${t("kycDetailDrawerTitlePrefix")} — ${fullName ?? t("kycUnnamed")}`}>
        {loading ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{t("kycDetailLoading")}</p>
          </div>
        ) : error || !detail ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <ShieldQuestion className="size-10 text-muted-foreground" />
            <p className="text-lg font-semibold text-foreground">{t("kycCouldNotLoad")}</p>
            <p className="max-w-sm text-sm text-muted-foreground">{t("kycTryAgainNotice")}</p>
          </div>
        ) : !decision ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <ShieldQuestion className="size-10 text-muted-foreground" />
            <p className="text-lg font-semibold text-foreground">{t("kycNoDecisionTitle")}</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              {t("kycNoDecisionBody")}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              {editing ? (
                <EditEnrollmentForm
                  detail={detail}
                  onCancel={() => setEditing(false)}
                  onSaved={(updated) => {
                    setDetail(updated);
                    setEditing(false);
                  }}
                />
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="flex w-fit items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    <Pencil className="size-3.5" />
                    {t("kycEditButton")}
                  </button>
                  {/* Disabled for now, on request — leave the code intact, just don't render the
                      button. Re-enable by uncommenting this block.
                  {RESENDABLE_STATUSES.has(detail.status) && (
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resending}
                      className="flex w-fit items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
                    >
                      <RefreshCw className={`size-3.5 ${resending ? "animate-spin" : ""}`} />
                      {t("kycResendButton")}
                    </button>
                  )}
                  */}
                </div>
              )}
              {resendError && <p className="mt-2 text-xs text-destructive">{resendError}</p>}
              {resendUrl && <div className="mt-2"><CopyRevealField label={t("kycResendLinkLabel")} value={resendUrl} /></div>}
            </div>

            {images.length > 0 ? (
              <div>
                <p className="mb-2 text-sm font-semibold text-foreground">{t("kycCapturedImages")}</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {images.map((image, i) => (
                    <GalleryThumb key={image.label} image={image} onClick={() => setLightboxIndex(i)} />
                  ))}
                </div>
              </div>
            ) : (
              // FaceTec writes these images into its own database asynchronously, well after the
              // decision itself is final (see FaceTecImagesService / the background retry in
              // KycService) — a finished enrollment with no images yet isn't an error, it just
              // hasn't been backfilled yet. Skeleton tiles (same size/layout as the real
              // thumbnails) make that obvious at a glance instead of a plain text line easy to miss.
              <div>
                <p className="mb-2 text-sm font-semibold text-foreground">{t("kycCapturedImages")}</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="animate-shimmer aspect-[4/3] w-full rounded-md border border-border bg-muted" />
                  ))}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{t("kycImagesProcessing")}</p>
              </div>
            )}

            <div>
              <p className="mb-2 text-sm font-semibold text-foreground">{t("kycIdentityDocument")}</p>
              <div className="grid grid-cols-2 gap-3 rounded-md border border-border p-3">
                <Field label={t("kycFieldDocumentType")} value={detail.documentType} />
                <Field label={t("kycFieldDocumentNumber")} value={detail.idDocumentNumber} />
                <Field
                  label={t("clientsComplianceFieldNationality")}
                  value={
                    detail.country ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span>{countryFlag(detail.country)}</span>
                        {countryName(detail.country)}
                      </span>
                    ) : null
                  }
                />
              </div>
            </div>

            {documentFields && Object.keys(documentFields).length > 0 ? (
              <div>
                <p className="mb-2 text-sm font-semibold text-foreground">{t("kycDocumentFieldsTitle")}</p>
                <div className="grid grid-cols-2 gap-3 rounded-md border border-border p-3">
                  {Object.entries(DOCUMENT_FIELD_LABEL_KEYS)
                    .filter(([key]) => documentFields[key])
                    .map(([key, labelKey]) => (
                      <Field key={key} label={t(labelKey)} value={documentFields[key]} />
                    ))}
                </div>
              </div>
            ) : null}

            {idScanChecks ? (
              <div>
                <p className="mb-2 text-sm font-semibold text-foreground">{t("kycIdScanChecksTitle")}</p>
                <div className="flex flex-col gap-1.5 rounded-md border border-border p-3">
                  {Object.entries(ID_SCAN_CHECK_LABEL_KEYS).map(([key, labelKey]) => (
                    <CheckRow key={key} t={t} labelKey={labelKey} value={idScanChecks[key]} />
                  ))}
                </div>
              </div>
            ) : null}

            <div>
              <p className="mb-2 text-sm font-semibold text-foreground">{t("kycBiometricScores")}</p>
              <div className="grid grid-cols-3 gap-3">
                <ScoreBadge label={t("kycScoreLiveness")} score={detail.livenessScore} />
                <ScoreBadge label={t("kycColFaceMatch")} score={detail.faceMatchScore} />
                <ScoreBadge label={t("kycScoreConfidence")} score={num(decision, "confidenceScore")} />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">{t("kycAmlSectionTitle")}</p>
                <button
                  type="button"
                  onClick={handleRescreenSanctions}
                  disabled={rescreening}
                  className="flex shrink-0 items-center gap-1.5 rounded-md border border-border px-2 py-1 text-[11px] font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
                >
                  <RefreshCw className={`size-3 ${rescreening ? "animate-spin" : ""}`} />
                  {t("kycRescreenButton")}
                </button>
              </div>
              {rescreenError ? <p className="mb-2 text-xs text-destructive">{rescreenError}</p> : null}
              {detail.amlTotalHits && detail.amlTotalHits > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    {t("kycRiskPrefix")} {detail.amlRiskScore?.toFixed(0) ?? "—"} · {detail.amlTotalHits}
                  </p>
                  {sanctionsMatches && sanctionsMatches.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {sanctionsMatches.map((match, i) => (
                        <div key={String(match.id ?? i)} className="rounded-md border border-border p-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-foreground">{String(match.name ?? "—")}</p>
                            {match.isPep ? (
                              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-600">
                                {t("kycSanctionsPepBadge")}
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {t("kycSanctionsMatchSourcePrefix")} {String(match.source ?? "—")} · {t("kycSanctionsMatchScorePrefix")}{" "}
                            {typeof match.score === "number" ? `${Math.round(match.score * 100)}%` : "—"}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-md border border-border p-3">
                      <p className="text-sm font-medium text-foreground">{t("kycAmlHitsFound")}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">{t("kycAmlNoHits")}</p>
              )}
            </div>

            {identityResolution ? (
              <div>
                <p className="mb-2 text-sm font-semibold text-foreground">{t("kycNetworkSectionTitle")}</p>
                <div className="space-y-2">
                  <div className="rounded-md border border-border p-3">
                    <p className={`text-sm font-medium ${networkFlag?.flagged ? "text-destructive" : "text-foreground"}`}>
                      {networkFlag?.flagged ? t("kycNetworkFlagged") : t("kycNetworkClear")}
                    </p>
                    {networkFlag?.flagged && typeof networkFlag.matchCount === "number" ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t("kycNetworkMatchCountPrefix")} {networkFlag.matchCount}
                      </p>
                    ) : null}
                  </div>
                  <div className="rounded-md border border-border p-3">
                    <p className="text-sm font-medium text-foreground">{t("kycIdentityLinkTitle")}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {identityResolution.linkType === "new"
                        ? t("kycIdentityLinkNew")
                        : identityResolution.linkType === "conflict"
                          ? t("kycIdentityLinkConflict")
                          : t("kycIdentityLinkMatched")}
                    </p>
                    {typeof identityResolution.linkConfidence === "number" ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t("kycIdentityLinkConfidencePrefix")} {Math.round(identityResolution.linkConfidence * 100)}%
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}

            {hasRiskFactors ? (
              <div>
                <p className="mb-2 text-sm font-semibold text-foreground">{t("kycRiskFactorsTitle")}</p>
                <div className="flex flex-col gap-1.5 rounded-md border border-border p-3 text-xs text-muted-foreground">
                  {bool(riskFactors, "rootedDevice") ? <p className="font-medium text-destructive">{t("kycRiskRootedDevice")}</p> : null}
                  {bool(riskFactors, "emulator") ? <p className="font-medium text-destructive">{t("kycRiskEmulator")}</p> : null}
                  {num(riskFactors, "spoofAttempts") != null ? (
                    <p>{t("kycRiskSpoofAttemptsPrefix")} {num(riskFactors, "spoofAttempts")}</p>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </Drawer>

      {lightboxIndex != null ? (
        <ImageLightbox images={images} initialIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
      ) : null}
    </>
  );
}

