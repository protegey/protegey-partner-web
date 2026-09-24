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
  deviceAttributes: Record<string, unknown> | null;
  ipCountry: string | null;
  ipHash: string | null;
  /** Decrypted server-side on read (AES-256-GCM at rest) — your own customer's real address. */
  ip: string | null;
  /** Decrypted server-side on read — the number you passed in when calling the SDK. */
  phoneNumber: string | null;
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
