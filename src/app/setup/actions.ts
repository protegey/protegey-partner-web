"use server";

import { redirect } from "next/navigation";
import { apiFetch, apiUpload, ApiError } from "@/lib/api";
import { setSessionCookies, type SessionUser } from "@/lib/session";
import { getLang } from "@/lib/i18n/lang";
import { t } from "@/lib/i18n/strings";

export interface SetupStatus {
  enabled: boolean;
  completed: boolean;
}

/** Fails toward "not usable" on any error — a transient backend hiccup must never make the
 * first-run wizard falsely appear available, since POST /setup/bootstrap would just reject it
 * again anyway. Used both by this page and by /login to decide whether to redirect here. */
export async function getSetupStatus(): Promise<SetupStatus> {
  try {
    return await apiFetch<SetupStatus>("/setup/status", { unauthenticated: true });
  } catch {
    return { enabled: false, completed: false };
  }
}

export interface SetupState {
  error?: string;
}

interface BootstrapResponse {
  accessToken: string;
  refreshToken: string;
  user: SessionUser;
}

export async function setupAction(_prevState: SetupState, formData: FormData): Promise<SetupState> {
  const lang = await getLang();

  const organizationName = String(formData.get("organizationName") ?? "").trim();
  const organizationType = String(formData.get("organizationType") ?? "");
  const country = String(formData.get("country") ?? "").trim();
  const partnerPortalUrl = String(formData.get("partnerPortalUrl") ?? "").trim();
  const adminFirstName = String(formData.get("adminFirstName") ?? "").trim();
  const adminLastName = String(formData.get("adminLastName") ?? "").trim();
  const adminEmail = String(formData.get("adminEmail") ?? "").trim();
  const adminPassword = String(formData.get("adminPassword") ?? "");
  const adminPasswordConfirm = String(formData.get("adminPasswordConfirm") ?? "");
  // All optional — a client can skip email entirely here and configure it later from the
  // dashboard (/settings/email), or leave RESEND_API_KEY/MAIL_FROM_* in .env in control instead.
  const resendApiKey = String(formData.get("resendApiKey") ?? "").trim();
  const mailFromAddress = String(formData.get("mailFromAddress") ?? "").trim();
  const mailFromName = String(formData.get("mailFromName") ?? "").trim();
  // Also optional — a client can skip it here and set it later from Settings → AI, or leave
  // DEEPSEEK_API_KEY in .env in control instead. Without it, Pan Studio's rule assistant simply
  // stays unavailable; nothing else in the product depends on it.
  const deepseekApiKey = String(formData.get("deepseekApiKey") ?? "").trim();
  // Also optional — skipping it just means the generic default icon is used until someone
  // uploads one later from Settings → Organization Profile.
  const logo = formData.get("logo");

  if (adminPassword !== adminPasswordConfirm) {
    return { error: t(lang, "setupPasswordMismatchError") };
  }

  let response: BootstrapResponse;
  try {
    response = await apiFetch<BootstrapResponse>("/setup/bootstrap", {
      method: "POST",
      unauthenticated: true,
      body: {
        organizationName,
        organizationType,
        country,
        partnerPortalUrl,
        adminFirstName,
        adminLastName,
        adminEmail,
        adminPassword,
        ...(resendApiKey ? { resendApiKey } : {}),
        ...(mailFromAddress ? { mailFromAddress } : {}),
        ...(mailFromName ? { mailFromName } : {}),
        ...(deepseekApiKey ? { deepseekApiKey } : {}),
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message };
    }
    return { error: t(lang, "setupGenericError") };
  }

  await setSessionCookies(response.accessToken, response.refreshToken, response.user);

  if (logo instanceof File && logo.size > 0) {
    const uploadForm = new FormData();
    uploadForm.append("file", logo, logo.name);
    try {
      await apiUpload("/partners/me/logo", uploadForm);
    } catch {
      // The organization + admin account already exist and the session is already live at this
      // point — a failed logo upload (bad format, oversized file) must never undo that or block
      // the redirect. The client can just upload it again from Settings → Organization Profile.
    }
  }

  redirect("/dashboard");
}
