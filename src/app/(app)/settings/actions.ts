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
  revalidatePath("/settings");
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
  revalidatePath("/settings");
  revalidatePath("/clients");
  return { success: true };
}

export interface ApiCredentialSummary {
  apiKeyPrefix: string | null;
  apiKeyCreatedAt: string | null;
  webhookUrl: string | null;
  hasWebhookSecret: boolean;
}

export interface GenerateApiKeyResult extends ActionResult {
  apiKey?: string;
}

export interface ConfigureWebhookResult extends ActionResult {
  webhookSecret?: string;
}

export async function getApiCredentials(): Promise<ApiCredentialSummary> {
  return apiFetch<ApiCredentialSummary>("/partners/me/api-credentials");
}

export async function generateApiKeyAction(): Promise<GenerateApiKeyResult | AuthExpired> {
  const lang = await getLang();
  try {
    const { apiKey } = await apiFetch<{ apiKey: string }>("/partners/me/api-credentials", { method: "POST" });
    revalidatePath("/settings");
    return { success: true, apiKey };
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return { authExpired: true };
    return { error: error instanceof ApiError ? error.message : t(lang, "commonGenericError") };
  }
}

export async function configureWebhookAction(url: string): Promise<ConfigureWebhookResult | AuthExpired> {
  const lang = await getLang();
  try {
    const { webhookSecret } = await apiFetch<{ webhookSecret: string }>("/partners/me/api-credentials/webhook", {
      method: "PATCH",
      body: { url },
    });
    revalidatePath("/settings");
    return { success: true, webhookSecret };
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return { authExpired: true };
    return { error: error instanceof ApiError ? error.message : t(lang, "commonGenericError") };
  }
}
