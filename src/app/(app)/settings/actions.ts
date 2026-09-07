"use server";

import { revalidatePath } from "next/cache";
import { apiFetch, apiUpload, ApiError } from "@/lib/api";

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

export async function uploadLogoAction(formData: FormData): Promise<ActionResult> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Please choose an image to upload." };
  }

  const uploadForm = new FormData();
  uploadForm.append("file", file, file.name);

  try {
    await apiUpload("/partners/me/logo", uploadForm);
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Something went wrong." };
  }
  revalidatePath("/settings");
  revalidatePath("/clients");
  return { success: true };
}

export async function removeLogoAction(): Promise<ActionResult> {
  try {
    await apiFetch("/partners/me/logo", { method: "DELETE" });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Something went wrong." };
  }
  revalidatePath("/settings");
  revalidatePath("/clients");
  return { success: true };
}
