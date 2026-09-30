import type { Metadata } from "next";
import { getDeviceSignals, type DeviceAction } from "./actions";
import { DeviceSignalsClient } from "./DeviceSignalsClient";
import { getLang } from "@/lib/i18n/lang";
import { getSessionUser } from "@/lib/session";
import { requirePageAccess } from "@/lib/requirePageAccess";

export const metadata: Metadata = {
  title: "Device Signals — Protegey Partner",
};

export default async function DeviceSignalsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; customer?: string; action?: string }>;
}) {
  const [user, lang] = await Promise.all([getSessionUser(), getLang()]);
  const denied = requirePageAccess(user, "partners.view_transactions", lang);
  if (denied) return denied;

  const { page: pageParam, customer, action } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const result = await getDeviceSignals({ page, externalCustomerId: customer, action: action as DeviceAction | undefined });

  return <DeviceSignalsClient result={result} page={page} initialCustomer={customer ?? ""} initialAction={action ?? "all"} />;
}
