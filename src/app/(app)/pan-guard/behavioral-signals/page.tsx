import type { Metadata } from "next";
import { getBehavioralSignals, type BehavioralConfidenceTier } from "./actions";
import { BehavioralSignalsClient } from "./BehavioralSignalsClient";

export const metadata: Metadata = {
  title: "Behavioral Signals — Protegey Partner",
};

export default async function BehavioralSignalsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; customer?: string; tier?: string }>;
}) {
  const { page: pageParam, customer, tier } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const result = await getBehavioralSignals({ page, externalCustomerId: customer, confidenceTier: tier as BehavioralConfidenceTier | undefined });

  return <BehavioralSignalsClient result={result} page={page} initialCustomer={customer ?? ""} initialTier={tier ?? "all"} />;
}
