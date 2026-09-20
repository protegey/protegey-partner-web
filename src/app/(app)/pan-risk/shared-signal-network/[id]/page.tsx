import type { Metadata } from "next";
import { getSharedSignalNetworkStatus, getSharedSignalReport } from "../actions";
import { SharedSignalReportDetailClient } from "./SharedSignalReportDetailClient";
import { SharedSignalNetworkGate } from "../SharedSignalNetworkGate";

export const metadata: Metadata = {
  title: "Shared Signal Report — Protegey Partner",
};

export default async function SharedSignalReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const status = await getSharedSignalNetworkStatus();
  if (!status.eligible) {
    return <SharedSignalNetworkGate status={status} />;
  }

  const report = await getSharedSignalReport(id);

  return <SharedSignalReportDetailClient report={report} />;
}
