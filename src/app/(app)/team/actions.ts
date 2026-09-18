"use server";

import { revalidatePath } from "next/cache";
import { apiFetch, ApiError, type AuthExpired } from "@/lib/api";
import { getLang } from "@/lib/i18n/lang";
import { t } from "@/lib/i18n/strings";

export interface TeamMember {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  roles: { name: string; displayName: string }[];
}

export interface AssignableRole {
  id: string;
  name: string;
  displayName: string;
}

export interface PendingInvitation {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  expiresAt: string;
  roles: { name: string; displayName: string }[];
}

export interface InviteAgentState {
  error?: string;
  success?: boolean;
}

export interface ActionResult {
  error?: string;
  success?: boolean;
}

export async function getTeamMembers(): Promise<TeamMember[]> {
  return apiFetch<TeamMember[]>("/partners/me/team");
}

export async function getPendingInvitations(): Promise<PendingInvitation[]> {
  return apiFetch<PendingInvitation[]>("/partners/me/team/invitations");
}

export async function getAssignableRoles(): Promise<AssignableRole[]> {
  return apiFetch<AssignableRole[]>("/roles?scope=partner");
}

export async function resendAgentInvitationAction(invitationId: string): Promise<ActionResult | AuthExpired> {
  const lang = await getLang();
  try {
    await apiFetch(`/partners/me/team/invitations/${invitationId}/resend`, { method: "POST" });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return { authExpired: true };
    return { error: error instanceof ApiError ? error.message : t(lang, "commonGenericError") };
  }
  revalidatePath("/team");
  return { success: true };
}

export async function setAgentStatusAction(userId: string, isActive: boolean): Promise<ActionResult | AuthExpired> {
  const lang = await getLang();
  try {
    await apiFetch(`/partners/me/team/${userId}/status`, { method: "PATCH", body: { isActive } });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return { authExpired: true };
    return { error: error instanceof ApiError ? error.message : t(lang, "commonGenericError") };
  }
  revalidatePath("/team");
  return { success: true };
}

export async function sendPasswordResetAction(userId: string): Promise<ActionResult | AuthExpired> {
  const lang = await getLang();
  try {
    await apiFetch(`/partners/me/team/${userId}/reset-password`, { method: "POST" });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return { authExpired: true };
    return { error: error instanceof ApiError ? error.message : t(lang, "commonGenericError") };
  }
  return { success: true };
}

export interface UpdateInvitationState {
  error?: string;
  success?: boolean;
}

/** Bound with the invitation id (see submitDocumentAction for the same pattern) so it fits useActionState's (prevState, formData) shape. */
export async function updateInvitationAction(
  invitationId: string,
  _prevState: UpdateInvitationState,
  formData: FormData,
): Promise<UpdateInvitationState> {
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const roleIds = formData.getAll("roleIds").map(String);
  const lang = await getLang();

  if (!firstName || !lastName || !email || !phone) {
    return { error: t(lang, "commonAllFieldsRequired") };
  }
  if (roleIds.length === 0) {
    return { error: t(lang, "teamSelectRoleError") };
  }

  try {
    await apiFetch(`/partners/me/team/invitations/${invitationId}`, {
      method: "PATCH",
      body: { firstName, lastName, email, phone, roleIds },
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : t(lang, "commonGenericError") };
  }
  revalidatePath("/team");
  return { success: true };
}

export async function inviteAgentAction(
  _prevState: InviteAgentState,
  formData: FormData,
): Promise<InviteAgentState> {
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const roleIds = formData.getAll("roleIds").map(String);
  const lang = await getLang();

  if (!firstName || !lastName || !email || !phone) {
    return { error: t(lang, "commonAllFieldsRequired") };
  }
  if (roleIds.length === 0) {
    return { error: t(lang, "teamSelectRoleError") };
  }

  try {
    await apiFetch("/partners/me/team", { method: "POST", body: { firstName, lastName, email, phone, roleIds } });
  } catch (error) {
    if (error instanceof ApiError) {
      return { error: error.message };
    }
    return { error: t(lang, "commonGenericErrorTryAgain") };
  }

  revalidatePath("/team");
  return { success: true };
}
