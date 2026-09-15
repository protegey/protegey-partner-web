"use server";

import { revalidatePath } from "next/cache";
import { apiFetch } from "@/lib/api";

export type DiditSessionStatus =
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
  status: DiditSessionStatus;
  sessionUrl: string | null;
  country: string | null;
  livenessScore: number | null;
  createdAt: string;
}

export interface PaginatedKycEnrollments {
  data: KycEnrollment[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function getKycEnrollments(params: { page?: number; status?: DiditSessionStatus } = {}) {
  const query = new URLSearchParams({ page: String(params.page ?? 1), limit: "20" });
  if (params.status) query.set("status", params.status);
  return apiFetch<PaginatedKycEnrollments>(`/kyc/me/sessions?${query.toString()}`);
}

export interface StartKycSessionState {
  error?: string;
  url?: string;
}

export async function startKycSessionAction(
  _prevState: StartKycSessionState,
  formData: FormData,
): Promise<StartKycSessionState> {
  const fullName = String(formData.get("fullName") ?? "").trim();

  try {
    const enrollment = await apiFetch<KycEnrollment>("/kyc/me/sessions", {
      method: "POST",
      body: fullName ? { fullName } : {},
    });
    if (!enrollment.sessionUrl) {
      return { error: "Verification session created but no link was returned. Try again." };
    }
    revalidatePath("/kyc");
    return { url: enrollment.sessionUrl };
  } catch {
    return { error: "Could not start a verification session. Please try again." };
  }
}
