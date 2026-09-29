"use server";

import { apiFetch } from "@/lib/api";

export type ContractDiscountType = "percent" | "fixed";

export interface PartnerContract {
  id: string;
  standardMonthlyFee: string;
  discountType: ContractDiscountType;
  discountValue: string;
  includedTransactions: string;
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
  percentUsed: number;
}

export async function getMyContract(): Promise<PartnerContract | null> {
  return apiFetch<PartnerContract | null>("/partners/me/contract");
}

export async function getMyContractUsage(): Promise<ContractCycleUsage | null> {
  return apiFetch<ContractCycleUsage | null>("/partners/me/contract/usage");
}
