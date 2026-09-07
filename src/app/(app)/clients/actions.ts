"use server";

import { revalidatePath } from "next/cache";
import { apiFetch, ApiError } from "@/lib/api";

export type ClientBusinessStatus = "invited" | "pending_review" | "more_info_required" | "active" | "rejected";
export type ClientKybSubmissionStatus = "pending" | "submitted" | "more_info_required" | "approved" | "rejected";

export interface ClientBusinessOwner {
  name: string;
  taxpayerNumber?: string | null;
  dateOfBirthOrIncorporation?: string | null;
  address?: string | null;
  ownershipPercent?: number | null;
  nonEuEntityOrCitizen?: boolean | null;
}

export interface GeneralInfoSection {
  legalName?: string | null;
  tradingName?: string | null;
  /** ISO 3166-1 alpha-2 country code — the business's own country, not `countriesOfOperation`. */
  country?: string | null;
  tradingAddress?: string | null;
  mailingAddress?: string | null;
  legalStatus?: string | null;
  incorporationDate?: string | null;
  registrationNumber?: string | null;
  website?: string | null;
  phone?: string | null;
  contactPerson?: string | null;
  owners?: ClientBusinessOwner[];
}

export interface BusinessDescriptionSection {
  yearsInOperation?: string | null;
  countriesOfOperation?: string | null;
  hasShellBankRelationships?: boolean | null;
  shellBankDetails?: string | null;
  primaryBusinessFocus?: string | null;
  mainRevenueActivity?: string | null;
  estimatedMonthlyTransactionCount?: string | null;
  estimatedMonthlyTransactionValue?: string | null;
}

export interface PaymentServicesSection {
  yearsProvidingPaymentServices?: string | null;
  focusType?: "primary" | "convenience" | "supplement" | null;
  servicesOffered?: string[];
  otherServiceDetails?: string | null;
  usesAgents?: boolean | null;
  totalAgents?: number | null;
  agentsOutsideCountryDetails?: string | null;
  isAffiliateOfOtherFi?: boolean | null;
  affiliateType?: string | null;
  affiliateName?: string | null;
  affiliateLicensingCountry?: string | null;
}

export interface YesNoAnswer {
  answer: boolean;
  details?: string | null;
}

export interface DisclosuresSection {
  licenseDeniedSuspendedRevoked?: YesNoAnswer | null;
  bankruptcy?: YesNoAnswer | null;
  criminalConviction?: YesNoAnswer | null;
  amlCivilOrCriminalProceedings?: YesNoAnswer | null;
}

export interface ClientKybSubmission {
  id: string;
  status: ClientKybSubmissionStatus;
  generalInfo: GeneralInfoSection | null;
  businessDescription: BusinessDescriptionSection | null;
  paymentServices: PaymentServicesSection | null;
  disclosures: DisclosuresSection | null;
  documentFileName: string | null;
  documentMimeType: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  moreInfoNote: string | null;
  rejectionReason: string | null;
}

export interface ClientBusiness {
  id: string;
  legalName: string | null;
  contactEmail: string;
  contactName: string;
  status: ClientBusinessStatus;
  activatedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  submission?: ClientKybSubmission;
}

export type ClientStage = "invited" | "responded";

export interface PaginatedClients {
  data: ClientBusiness[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ActionResult {
  error?: string;
  success?: boolean;
}

export interface InviteClientState {
  error?: string;
  success?: boolean;
}

/** Summary use only (dashboard counts) — not paginated, capped at a generous limit. */
export async function getClients(): Promise<ClientBusiness[]> {
  const result = await apiFetch<PaginatedClients>("/clients/me?limit=100");
  return result.data;
}

const CLIENTS_PAGE_SIZE = 10;

export async function getClientsPage(params: { stage: ClientStage; page?: number }): Promise<PaginatedClients> {
  const query = new URLSearchParams({
    stage: params.stage,
    page: String(params.page ?? 1),
    limit: String(CLIENTS_PAGE_SIZE),
  });
  return apiFetch<PaginatedClients>(`/clients/me?${query.toString()}`);
}

export async function getClient(clientId: string): Promise<ClientBusiness> {
  return apiFetch<ClientBusiness>(`/clients/me/${clientId}`);
}

export async function inviteClientAction(
  _prevState: InviteClientState,
  formData: FormData,
): Promise<InviteClientState> {
  const contactName = String(formData.get("contactName") ?? "").trim();
  const contactEmail = String(formData.get("contactEmail") ?? "").trim();

  if (!contactName || !contactEmail) {
    return { error: "All fields are required." };
  }

  try {
    await apiFetch("/clients/me", { method: "POST", body: { contactName, contactEmail } });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Something went wrong. Please try again." };
  }

  revalidatePath("/clients");
  return { success: true };
}

export async function resendClientInvitationAction(clientId: string): Promise<ActionResult> {
  try {
    await apiFetch(`/clients/me/${clientId}/resend-invitation`, { method: "POST" });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Something went wrong." };
  }
  revalidatePath("/clients");
  return { success: true };
}

export async function decideClientSubmissionAction(
  clientId: string,
  decision: "approve" | "reject" | "request_more_info",
  detail?: string,
): Promise<ActionResult> {
  try {
    await apiFetch(`/clients/me/${clientId}/decision`, {
      method: "PATCH",
      body: {
        decision,
        ...(decision === "reject" ? { reason: detail } : {}),
        ...(decision === "request_more_info" ? { note: detail } : {}),
      },
    });
  } catch (error) {
    return { error: error instanceof ApiError ? error.message : "Something went wrong." };
  }
  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
  return { success: true };
}
