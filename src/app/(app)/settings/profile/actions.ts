"use server";

import { revalidatePath } from "next/cache";
import { apiFetch, apiUpload, ApiError, type AuthExpired } from "@/lib/api";
import { getLang } from "@/lib/i18n/lang";
import { t } from "@/lib/i18n/strings";

export interface PartnerSettings {
  id: string;
  name: string;
  logoFileName: string | null;
}

export interface ActionResult {
  error?: string;
  success?: boolean;
}

export async function getPartnerSettings(): Promise<PartnerSettings> {
  return apiFetch<PartnerSettings>("/partners/me");
}

export async function uploadLogoAction(formData: FormData): Promise<ActionResult | AuthExpired> {
  const lang = await getLang();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: t(lang, "settingsImageRequiredError") };
  }

  const uploadForm = new FormData();
  uploadForm.append("file", file, file.name);

  try {
    await apiUpload("/partners/me/logo", uploadForm);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return { authExpired: true };
    return { error: error instanceof ApiError ? error.message : t(lang, "commonGenericError") };
  }
  revalidatePath("/settings/profile");
  revalidatePath("/clients");
  return { success: true };
}

export async function removeLogoAction(): Promise<ActionResult | AuthExpired> {
  const lang = await getLang();
  try {
    await apiFetch("/partners/me/logo", { method: "DELETE" });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return { authExpired: true };
    return { error: error instanceof ApiError ? error.message : t(lang, "commonGenericError") };
  }
  revalidatePath("/settings/profile");
  revalidatePath("/clients");
  return { success: true };
}
