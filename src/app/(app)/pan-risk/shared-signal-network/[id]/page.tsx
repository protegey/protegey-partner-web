import type { Metadata } from "next";
import { getSharedSignalReport } from "../actions";
import { SharedSignalReportDetailClient } from "./SharedSignalReportDetailClient";

export const metadata: Metadata = {
  title: "Shared Signal Report — Protegey Partner",
};

export default async function SharedSignalReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const report = await getSharedSignalReport(id);

  return <SharedSignalReportDetailClient report={report} />;
}
