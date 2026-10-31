"use client";

import { useState } from "react";
import { Eye, Loader2, ShieldQuestion, ZoomIn } from "lucide-react";
import { Drawer } from "@/components/Drawer";
import { useSessionGuard } from "@/components/SessionExpiredProvider";
import { useLang } from "@/lib/i18n/LangProvider";
import { getKycEnrollmentDetail, type KycEnrollmentDetail } from "./actions";
import { ImageLightbox, type GalleryImage } from "./ImageLightbox";
import { countryFlag, countryName } from "./country";

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

function GalleryThumb({ image, onClick }: { image: GalleryImage; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative aspect-[4/3] overflow-hidden rounded-md border border-border bg-muted"
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- base64 data: URI, not a remote asset Next can optimize */}
      <img src={image.url} alt={image.label} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
      <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30">
        <ZoomIn className="size-5 text-white opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <p className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5 text-left text-[11px] font-medium text-white">
        {image.label}
      </p>
    </button>
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

  const images: GalleryImage[] = [
    detail?.documentPhoto && { url: `data:image/jpeg;base64,${detail.documentPhoto}`, label: t("kycImageIdDocument") },
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
            {images.length > 0 ? (
              <div>
                <p className="mb-2 text-sm font-semibold text-foreground">{t("kycCapturedImages")}</p>
                <div className="grid grid-cols-2 gap-2">
                  {images.map((image, i) => (
                    <GalleryThumb key={image.label} image={image} onClick={() => setLightboxIndex(i)} />
                  ))}
                </div>
              </div>
            ) : null}

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

            <div>
              <p className="mb-2 text-sm font-semibold text-foreground">{t("kycBiometricScores")}</p>
              <div className="grid grid-cols-3 gap-3">
                <ScoreBadge label={t("kycScoreLiveness")} score={detail.livenessScore} />
                <ScoreBadge label={t("kycColFaceMatch")} score={detail.faceMatchScore} />
                <ScoreBadge label={t("kycScoreConfidence")} score={num(decision, "confidenceScore")} />
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-foreground">{t("kycAmlSectionTitle")}</p>
              {detail.amlTotalHits && detail.amlTotalHits > 0 ? (
                <div className="rounded-md border border-border p-3">
                  <p className="text-sm font-medium text-foreground">{t("kycAmlHitsFound")}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("kycRiskPrefix")} {detail.amlRiskScore?.toFixed(0) ?? "—"} · {detail.amlTotalHits}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">{t("kycAmlNoHits")}</p>
              )}
            </div>

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

