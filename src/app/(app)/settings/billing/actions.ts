"use server";

import { apiFetch } from "@/lib/api";

export type ContractDiscountType = "percent" | "fixed";

/** See ContractBonusRecurrence on the backend entity for the full semantics of each value. */
export type ContractBonusRecurrence = "none" | "once" | "monthly";

export interface PartnerContract {
  id: string;
  standardMonthlyFee: string;
  discountType: ContractDiscountType;
  discountValue: string;
  includedTransactions: string;
  bonusTransactions: string;
  bonusRecurrence: ContractBonusRecurrence;
  bonusTransactionsRemaining: string | null;
  overageRate: string;
  paymentTermsDays: number;
  taxRate: string;
  currency: string;
}

export interface ContractCycleUsage {
  cycleStart: string;
  cycleEnd: string;
  includedTransactions: string;
  consumedTransactions: number;
  overageTransactions: number;
  bonusRecurrence: ContractBonusRecurrence;
  bonusApplied: number;
  effectiveOverageTransactions: number;
  percentUsed: number;
}

export async function getMyContract(): Promise<PartnerContract | null> {
  return apiFetch<PartnerContract | null>("/partners/me/contract");
}

export async function getMyContractUsage(): Promise<ContractCycleUsage | null> {
  return apiFetch<ContractCycleUsage | null>("/partners/me/contract/usage");
}
