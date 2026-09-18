"use server";

import { revalidatePath } from "next/cache";
import { apiFetch, apiUpload, ApiError } from "@/lib/api";
import { getLang } from "@/lib/i18n/lang";
import { t } from "@/lib/i18n/strings";

export interface PartnerDocument {
  id: string;
  type: string;
  status: "pending" | "submitted" | "approved" | "rejected";
  fileName: string | null;
  mimeType: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
}

export interface SubmitDocumentState {
  error?: string;
  success?: boolean;
}

export async function getMyDocuments(): Promise<PartnerDocument[]> {
  return apiFetch<PartnerDocument[]>("/partners/me/documents");
}

export async function submitDocumentAction(
  documentId: string,
  _prevState: SubmitDocumentState,
  formData: FormData,
): Promise<SubmitDocumentState> {
  const lang = await getLang();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: t(lang, "docFileRequiredError") };
  }

  const uploadForm = new FormData();
  uploadForm.append("file", file, file.name);

  try {
    await apiUpload(`/partners/me/documents/${documentId}/submit`, uploadForm);
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : t(lang, "commonGenericErrorTryAgain") };
  }

  revalidatePath("/documents");
  return { success: true };
}
