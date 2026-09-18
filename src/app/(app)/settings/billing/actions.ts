"use server";

import { apiFetch } from "@/lib/api";

export interface PlanFeature {
  label: string;
  labelFr: string;
}

export interface Plan {
  id: string;
  code: string;
  name: string;
  nameFr: string;
  description: string;
  descriptionFr: string;
  priceLabel: string | null;
  priceLabelFr: string | null;
  features: PlanFeature[];
  sortOrder: number;
}

export async function getPlans(): Promise<Plan[]> {
  return apiFetch<Plan[]>("/plans");
}

export async function getCurrentPlanCode(): Promise<string> {
  const partner = await apiFetch<{ plan: string }>("/partners/me");
  return partner.plan;
}
