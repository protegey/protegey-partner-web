"use server";

import { revalidatePath } from "next/cache";
import { apiFetch, apiFetchGuarded, apiFetchTextGuarded, ApiError, type AuthExpired } from "@/lib/api";
import { getLang } from "@/lib/i18n/lang";
import { t } from "@/lib/i18n/strings";

export type KycSessionStatus =
  | "Not Started"
  | "In Progress"
  | "Awaiting User"
  | "In Review"
  | "Approved"
  | "Declined"
  | "Resubmitted"
  | "Abandoned"
  | "Expired"
  | "Kyc Expired";

export interface KycEnrollment {
  id: string;
  fullName: string | null;
  status: KycSessionStatus;
  /** Full URL at the standalone facetec-web app with enrollmentId/token/apiBase embedded. */
  captureUrl?: string | null;
  country: string | null;
  livenessScore: number | null;
  faceMatchScore: number | null;
  amlRiskScore: number | null;
  amlTotalHits: number | null;
  documentType: string | null;
  idDocumentNumber?: string | null;
  /** Base64, no data: URI prefix — the ID photo and the liveness selfie capture. */
  documentPhoto: string | null;
  selfiePhoto: string | null;
  createdAt: string;
}

export interface PaginatedKycEnrollments {
  data: KycEnrollment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getKycEnrollments(params: { page?: number; status?: KycSessionStatus; search?: string } = {}) {
  const query = new URLSearchParams({ page: String(params.page ?? 1), limit: "20" });
  if (params.status) query.set("status", params.status);
  if (params.search) query.set("search", params.search);
  return apiFetch<PaginatedKycEnrollments>(`/kyc/me/sessions?${query.toString()}`);
}

/** Every row matching the active filters, as CSV text — the backend's `/kyc/me/sessions/export`
 * endpoint ignores pagination and returns the full filtered set. */
export async function exportKycEnrollmentsAction(params: { status?: KycSessionStatus; search?: string } = {}): Promise<string | { error: string } | AuthExpired> {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.search) query.set("search", params.search);
  try {
    return await apiFetchTextGuarded(`/kyc/me/sessions/export?${query.toString()}`);
  } catch (error) {
    if (error instanceof ApiError) return { error: error.message };
    throw error;
  }
}

export interface KycEnrollmentDetail extends KycEnrollment {
  /** Full FaceTec decision payload, verbatim — liveness/match scores, AML hits, IP/device, everything. */
  decision: Record<string, unknown> | null;
}

/** Fetched on demand when the partner opens a row's detail panel — not included in the list. */
export async function getKycEnrollmentDetail(id: string): Promise<KycEnrollmentDetail | AuthExpired> {
  return apiFetchGuarded<KycEnrollmentDetail>(`/kyc/me/sessions/${id}`);
}

export interface StartKycSessionState {
  error?: string;
  /**
   * A full URL at the standalone `protegey-facetec-web` app (own origin — e.g. Vercel +
   * Cloudflare, deliberately kept off our servers since it's the SDK-heavy capture flow) with
   * `enrollmentId`, a one-time `token`, and `apiBase` already embedded as query params.
   * facetec-web posts the capture result straight to the backend using that token
   * (`POST {apiBase}/kyc/sessions/:id/facetec-result?token=...`, no partner JWT involved) — this
   * app never receives or relays the result, it only sends the customer there and back.
   */
  captureUrl?: string;
}

export async function startKycSessionAction(
  _prevState: StartKycSessionState,
  formData: FormData,
): Promise<StartKycSessionState> {
  const lang = await getLang();
  const fullName = String(formData.get("fullName") ?? "").trim();

  try {
    const enrollment = await apiFetch<KycEnrollment>("/kyc/me/sessions", {
      method: "POST",
      body: fullName ? { fullName } : {},
    });
    revalidatePath("/kyc");
    if (enrollment.captureUrl) {
      return { captureUrl: enrollment.captureUrl };
    }
    return { error: t(lang, "kycStartFailedError") };
  } catch {
    return { error: t(lang, "kycStartFailedError") };
  }
}
