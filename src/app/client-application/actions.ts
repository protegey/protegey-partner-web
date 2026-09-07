"use server";

import { apiFetch, apiUpload, ApiError } from "@/lib/api";
import type {
  BusinessDescriptionSection,
  DisclosuresSection,
  GeneralInfoSection,
  PaymentServicesSection,
} from "../(app)/clients/actions";

export interface ClientApplicationView {
  partnerName: string;
  hasPartnerLogo: boolean;
  status: "pending" | "submitted" | "more_info_required" | "approved" | "rejected";
  language: "en" | "fr" | null;
  expiresAt: string;
  moreInfoNote: string | null;
  rejectionReason: string | null;
  generalInfo: GeneralInfoSection | null;
  businessDescription: BusinessDescriptionSection | null;
  paymentServices: PaymentServicesSection | null;
  disclosures: DisclosuresSection | null;
  document: { fileName: string; mimeType: string } | null;
}

export interface ActionResult {
  error?: string;
  success?: boolean;
}

export async function getApplication(token: string): Promise<ClientApplicationView | null> {
  try {
    return await apiFetch<ClientApplicationView>(`/client-applications/${token}`, { unauthenticated: true });
  } catch (error) {
    if (error instanceof ApiError) return null;
    throw error;
  }
}

export async function saveDraftAction(
  token: string,
  sections: {
    generalInfo?: GeneralInfoSection;
    businessDescription?: BusinessDescriptionSection;
    paymentServices?: PaymentServicesSection;
    disclosures?: DisclosuresSection;
    language?: "en" | "fr";
  },
): Promise<ActionResult> {
  try {
    await apiFetch(`/client-applications/${token}`, { method: "PATCH", body: sections, unauthenticated: true });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Something went wrong." };
  }
  return { success: true };
}

export async function uploadApplicationDocumentAction(token: string, formData: FormData): Promise<ActionResult> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Please choose a file to upload." };
  }

  const uploadForm = new FormData();
  uploadForm.append("file", file, file.name);

  try {
    await apiUpload(`/client-applications/${token}/document`, uploadForm, { unauthenticated: true });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Something went wrong." };
  }
  return { success: true };
}

export async function submitApplicationAction(token: string): Promise<ActionResult> {
  try {
    await apiFetch(`/client-applications/${token}/submit`, { method: "POST", unauthenticated: true });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Something went wrong." };
  }
  return { success: true };
}
