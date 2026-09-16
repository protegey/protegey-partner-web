"use client";

import { useState } from "react";
import { Loader2, ShieldAlert, ShieldCheck, ShieldQuestion, ShieldX, ZoomIn } from "lucide-react";
import { Drawer } from "@/components/Drawer";
import { useSessionGuard } from "@/components/SessionExpiredProvider";
import { getKycEnrollmentDetail, type KycEnrollmentDetail, type DiditSessionStatus } from "./actions";
import { ImageLightbox, type GalleryImage } from "./ImageLightbox";
import { countryFlag, countryName } from "./country";

type Rec = Record<string, unknown>;

function arr(d: Rec | null | undefined, key: string): Rec[] {
  const v = d?.[key];
  return Array.isArray(v) ? (v as Rec[]) : [];
}
function first(d: Rec | null | undefined, key: string): Rec | null {
  return arr(d, key)[0] ?? null;
}
function str(o: Rec | null | undefined, key: string): string | null {
  const v = o?.[key];
  return typeof v === "string" && v.length > 0 ? v : null;
}
function num(o: Rec | null | undefined, key: string): number | null {
  const v = o?.[key];
  return typeof v === "number" ? v : null;
}
function bool(o: Rec | null | undefined, key: string): boolean | null {
  const v = o?.[key];
  return typeof v === "boolean" ? v : null;
}
function strArr(o: Rec | null | undefined, key: string): string[] {
  const v = o?.[key];
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

const STATUS_CONFIG: Record<string, { color: string; icon: typeof ShieldCheck }> = {
  Approved: { color: "text-primary", icon: ShieldCheck },
  Declined: { color: "text-destructive", icon: ShieldX },
  default: { color: "text-amber-600", icon: ShieldAlert },
};

function MiniStatus({ status }: { status: string | null }) {
  if (!status) return null;
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.default;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${config.color}`}>
      <Icon className="size-3.5" />
      {status}
    </span>
  );
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
      {/* eslint-disable-next-line @next/next/no-img-element -- external Didit-hosted asset */}
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
  const idVerification = first(decision, "id_verifications");
  const faceMatch = first(decision, "face_matches");
  const liveness = first(decision, "liveness_checks");
  const amlScreening = first(decision, "aml_screenings");
  const ipAnalysis = first(decision, "ip_analyses");
  const poa = first(decision, "poa_verifications");

  const images: GalleryImage[] = [
    str(idVerification, "front_image") && { url: str(idVerification, "front_image")!, label: "ID — front" },
    str(idVerification, "back_image") && { url: str(idVerification, "back_image")!, label: "ID — back" },
    str(idVerification, "portrait_image") && { url: str(idVerification, "portrait_image")!, label: "ID — portrait" },
    str(faceMatch, "source_image") && { url: str(faceMatch, "source_image")!, label: "Selfie (face match)" },
    str(faceMatch, "target_image") && { url: str(faceMatch, "target_image")!, label: "ID photo (face match)" },
    str(liveness, "reference_image") && { url: str(liveness, "reference_image")!, label: "Liveness reference" },
    str(poa, "document_file") && { url: str(poa, "document_file")!, label: "Proof of address" },
  ].filter((x): x is GalleryImage => Boolean(x));

  const nationality = str(idVerification, "nationality") ?? str(idVerification, "issuing_state");
  const amlHits = arr(amlScreening, "hits");

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="text-xs font-medium text-primary hover:underline"
      >
        View details
      </button>

      <Drawer open={open} onClose={() => setOpen(false)} title={`Verification details — ${fullName ?? "Unnamed"}`}>
        {loading ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading verification details…</p>
          </div>
        ) : error || !detail ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <ShieldQuestion className="size-10 text-muted-foreground" />
            <p className="text-lg font-semibold text-foreground">Couldn&apos;t load details</p>
            <p className="max-w-sm text-sm text-muted-foreground">Please try again.</p>
          </div>
        ) : !decision ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <ShieldQuestion className="size-10 text-muted-foreground" />
            <p className="text-lg font-semibold text-foreground">No decision yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              This session hasn&apos;t completed on Didit&apos;s side yet — details appear once it has.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {images.length > 0 ? (
              <div>
                <p className="mb-2 text-sm font-semibold text-foreground">Captured images</p>
                <div className="grid grid-cols-3 gap-2">
                  {images.map((image, i) => (
                    <GalleryThumb key={image.label} image={image} onClick={() => setLightboxIndex(i)} />
                  ))}
                </div>
              </div>
            ) : null}

            {idVerification ? (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">Identity document</p>
                  <MiniStatus status={str(idVerification, "status")} />
                </div>
                <div className="grid grid-cols-2 gap-3 rounded-md border border-border p-3">
                  <Field label="Full name" value={str(idVerification, "full_name")} />
                  <Field label="Date of birth" value={str(idVerification, "date_of_birth")} />
                  <Field label="Document type" value={str(idVerification, "document_type")} />
                  <Field label="Document number" value={str(idVerification, "document_number")} />
                  <Field
                    label="Nationality"
                    value={
                      nationality ? (
                        <span className="inline-flex items-center gap-1.5">
                          <span>{countryFlag(nationality)}</span>
                          {countryName(nationality)}
                        </span>
                      ) : null
                    }
                  />
                  <Field label="Expiration date" value={str(idVerification, "expiration_date")} />
                  <Field label="Gender" value={str(idVerification, "gender")} />
                  <Field label="Place of birth" value={str(idVerification, "place_of_birth")} />
                  <div className="col-span-2">
                    <Field label="Address" value={str(idVerification, "formatted_address") ?? str(idVerification, "address")} />
                  </div>
                </div>
              </div>
            ) : null}

            <div>
              <p className="mb-2 text-sm font-semibold text-foreground">Biometric scores</p>
              <div className="grid grid-cols-2 gap-3">
                <ScoreBadge label="Liveness" score={num(liveness, "score")} />
                <ScoreBadge label="Face match" score={num(faceMatch, "score")} />
              </div>
            </div>

            {amlScreening ? (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">AML / PEP / Sanctions screening</p>
                  <MiniStatus status={str(amlScreening, "status")} />
                </div>
                {amlHits.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No hits — clear.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {amlHits.map((hit, i) => {
                      const riskScore = num(hit, "risk_score");
                      const riskColor = (riskScore ?? 0) >= 66 ? "text-destructive" : (riskScore ?? 0) >= 33 ? "text-amber-600" : "text-foreground";
                      return (
                        <div key={i} className="rounded-md border border-border p-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-foreground">{str(hit, "caption") ?? "Unnamed match"}</p>
                            {riskScore != null ? (
                              <span className={`text-xs font-semibold ${riskColor}`}>Risk {riskScore.toFixed(0)}</span>
                            ) : null}
                          </div>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {strArr(hit, "datasets").map((dataset) => (
                              <span key={dataset} className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                                {dataset}
                              </span>
                            ))}
                          </div>
                          {num(hit, "match_score") != null ? (
                            <p className="mt-1.5 text-xs text-muted-foreground">Name match score: {num(hit, "match_score")}%</p>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : null}

            {ipAnalysis ? (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">Device &amp; IP</p>
                  {bool(ipAnalysis, "is_vpn_or_tor") || bool(ipAnalysis, "is_data_center") ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-destructive">
                      <ShieldAlert className="size-3.5" />
                      VPN/Proxy detected
                    </span>
                  ) : null}
                </div>
                <div className="grid grid-cols-2 gap-3 rounded-md border border-border p-3">
                  <Field label="IP address" value={str(ipAnalysis, "ip_address")} />
                  <Field
                    label="Location"
                    value={
                      str(ipAnalysis, "ip_country_code") ? (
                        <span className="inline-flex items-center gap-1.5">
                          <span>{countryFlag(str(ipAnalysis, "ip_country_code"))}</span>
                          {[str(ipAnalysis, "ip_city"), str(ipAnalysis, "ip_country")].filter(Boolean).join(", ")}
                        </span>
                      ) : (
                        str(ipAnalysis, "ip_country")
                      )
                    }
                  />
                  <Field label="ISP" value={str(ipAnalysis, "isp")} />
                  <Field label="Organization" value={str(ipAnalysis, "organization")} />
                  <Field label="Browser" value={str(ipAnalysis, "browser_family")} />
                  <Field label="OS / Platform" value={str(ipAnalysis, "platform") ?? str(ipAnalysis, "os_family")} />
                  <Field label="Device" value={str(ipAnalysis, "device_brand")} />
                  <Field label="Time zone" value={str(ipAnalysis, "time_zone")} />
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
