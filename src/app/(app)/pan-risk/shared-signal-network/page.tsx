import type { Metadata } from "next";
import { getSharedSignalNetworkStatus, getSharedSignalReports, type SharedSignalCategory } from "./actions";
import { SharedSignalNetworkClient } from "./SharedSignalNetworkClient";
import { SharedSignalNetworkGate } from "./SharedSignalNetworkGate";

export const metadata: Metadata = {
  title: "Shared Signal Network — Protegey Partner",
};

export default async function SharedSignalNetworkPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; category?: string }>;
}) {
  const { page: pageParam, category } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  const status = await getSharedSignalNetworkStatus();
  if (!status.eligible) {
    return <SharedSignalNetworkGate status={status} />;
  }

  const result = await getSharedSignalReports({ page, category: category as SharedSignalCategory | undefined });

  return <SharedSignalNetworkClient result={result} page={page} initialCategory={category ?? "all"} />;
}
