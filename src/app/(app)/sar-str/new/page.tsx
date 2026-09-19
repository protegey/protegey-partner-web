import type { Metadata } from "next";
import { NewSarReportClient } from "./NewSarReportClient";

export const metadata: Metadata = {
  title: "New SAR/STR — Protegey Partner",
};

export default async function NewSarReportPage({ searchParams }: { searchParams: Promise<{ caseId?: string }> }) {
  const { caseId } = await searchParams;
  return <NewSarReportClient caseId={caseId ?? ""} />;
}
