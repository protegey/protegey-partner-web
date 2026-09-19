"use server";

import { apiFetch } from "@/lib/api";
import type { PaginatedResult } from "../../transactions/actions";

export type DeviceAction = "allow" | "soft_challenge" | "hard_challenge" | "block";

export interface DeviceSignal {
  id: string;
  partnerId: string;
  externalCustomerId: string | null;
  eventId: string;
  visitorId: string | null;
  riskScore: number;
  action: DeviceAction;
  reasons: string[] | null;
  source: "webhook" | "device_event";
  createdAt: string;
}

export interface DeviceSignalsQuery {
  page?: number;
  externalCustomerId?: string;
  action?: DeviceAction;
}

export async function getDeviceSignals(query: DeviceSignalsQuery = {}): Promise<PaginatedResult<DeviceSignal>> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  return apiFetch<PaginatedResult<DeviceSignal>>(`/device-signals/me?${params.toString()}`);
}
