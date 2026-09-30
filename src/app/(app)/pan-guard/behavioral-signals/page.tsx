import type { Metadata } from "next";
import { getBehavioralSignals, type BehavioralConfidenceTier } from "./actions";
import { BehavioralSignalsClient } from "./BehavioralSignalsClient";
import { getLang } from "@/lib/i18n/lang";
import { getSessionUser } from "@/lib/session";
import { requirePageAccess } from "@/lib/requirePageAccess";

export const metadata: Metadata = {
  title: "Behavioral Signals — Protegey Partner",
};

export default async function BehavioralSignalsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; customer?: string; tier?: string }>;
}) {
  const [user, lang] = await Promise.all([getSessionUser(), getLang()]);
  const denied = requirePageAccess(user, "partners.view_transactions", lang);
  if (denied) return denied;

  const { page: pageParam, customer, tier } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const result = await getBehavioralSignals({ page, externalCustomerId: customer, confidenceTier: tier as BehavioralConfidenceTier | undefined });

  return <BehavioralSignalsClient result={result} page={page} initialCustomer={customer ?? ""} initialTier={tier ?? "all"} />;
}
